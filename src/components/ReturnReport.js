"use client";

import { useEffect, useMemo, useState } from "react";
import API from "../utils/api";
import "./ReturnReport.css";
import { format, startOfDay, endOfDay, startOfMonth, endOfMonth } from "date-fns";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const ReturnReport = () => {
  const [returns, setReturns] = useState([]);
  const [activeTab, setActiveTab] = useState("today"); // today | monthly | all
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [generatingPDF, setGeneratingPDF] = useState(false);

  useEffect(() => {
    fetchReturns();
  }, [activeTab]);

  const fetchReturns = async () => {
    setLoading(true);
    try {
      const now = new Date();
      const params = { page: 1, limit: 1000 };
      if (activeTab === "today") {
        params.startDate = startOfDay(now).toISOString();
        params.endDate = endOfDay(now).toISOString();
      } else if (activeTab === "monthly") {
        params.startDate = startOfMonth(now).toISOString();
        params.endDate = endOfMonth(now).toISOString();
      }
      const query = new URLSearchParams(params).toString();
      const res = await API.get(`/returns?${query}`);
      const list = res.data?.returns || res.data || [];
      setReturns(Array.isArray(list) ? list : []);
      setSelectedCustomer(null);
    } catch (err) {
      console.error("Error fetching returns:", err);
      setMessage("❌ Failed to fetch return report");
    } finally {
      setLoading(false);
    }
  };

  const summaryRows = useMemo(() => {
    if (!Array.isArray(returns)) return [];
    const groups = new Map();
    for (const r of returns) {
      const key = r.customerName || "N/A";
      const current = groups.get(key) || { customerName: key, totalQty: 0, latestDate: null, notes: "" };
      const qty = Number(r.quantity) || 0;
      current.totalQty += qty;
      const d = r.date || r.createdAt;
      if (d) {
        const dt = new Date(d);
        if (!current.latestDate || dt > current.latestDate) current.latestDate = dt;
      }
      if (r.notes && !current.notes) current.notes = r.notes;
      groups.set(key, current);
    }
    return Array.from(groups.values()).sort((a, b) => (b.latestDate?.getTime() || 0) - (a.latestDate?.getTime() || 0));
  }, [returns]);

  const detailRows = useMemo(() => {
    if (!selectedCustomer) return [];
    const byProduct = new Map();
    for (const r of returns) {
      if ((r.customerName || "N/A") !== selectedCustomer) continue;
      const key = `${r.companyName || "Unknown"} | ${r.modelNo || "N/A"}`;
      const qty = Number(r.quantity) || 0;
      const cur = byProduct.get(key) || { product: key, totalQty: 0 };
      cur.totalQty += qty;
      byProduct.set(key, cur);
    }
    return Array.from(byProduct.values());
  }, [selectedCustomer, returns]);

  const downloadPDF = () => {
    setGeneratingPDF(true);
    
    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text("Return Report (Summary)", 105, 15, { align: "center" });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(`Generated on: ${format(new Date(), "yyyy-MM-dd HH:mm")}`, 105, 22, { align: "center" });

      const tableData = summaryRows.map((row) => [
        row.latestDate ? format(new Date(row.latestDate), "yyyy-MM-dd") : "N/A",
        row.customerName,
        row.notes || "-",
        row.totalQty.toString(),
      ]);

      autoTable(doc, {
        head: [['Date', 'Customer Name', 'Notes', 'Total Quantity']],
        body: tableData,
        startY: 25,
        margin: { top: 25 },
        styles: {
          fontSize: 9,
          cellPadding: 3,
          overflow: "linebreak",
        },
        headStyles: {
          fillColor: [22, 160, 133],
          textColor: [255, 255, 255],
          fontStyle: "bold",
          halign: "center",
        },
        columnStyles: {
          0: { cellWidth: 30 },
          1: { cellWidth: 60 },
          2: { cellWidth: 60 },
          3: { cellWidth: 30 },
        }
      });

      doc.save(`return-report-${format(new Date(), "yyyy-MM-dd")}.pdf`);
      setMessage("✅ PDF downloaded successfully");
    } catch (error) {
      console.error("Error generating PDF:", error);
      setMessage("❌ Failed to generate PDF");
    } finally {
      setGeneratingPDF(false);
    }
  };

  return (
    <div className="return-report-container">
      <div className="report-header">
        <h2>
          <i className="fas fa-undo-alt"></i> Return Report
        </h2>
        <div className="tabs">
          <button className={`tab-btn ${activeTab === 'today' ? 'active' : ''}`} onClick={() => setActiveTab('today')}>Today</button>
          <button className={`tab-btn ${activeTab === 'monthly' ? 'active' : ''}`} onClick={() => setActiveTab('monthly')}>Monthly</button>
          <button className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`} onClick={() => setActiveTab('all')}>All</button>
        </div>
        <button 
          onClick={downloadPDF} 
          disabled={generatingPDF || summaryRows.length === 0}
          className="download-pdf-btn"
        >
          {generatingPDF ? (
            <><i className="fas fa-spinner fa-spin"></i> Generating PDF...</>
          ) : (
            <><i className="fas fa-download"></i> Download PDF</>
          )}
        </button>
      </div>

      {loading ? (
        <p>Loading report...</p>
      ) : summaryRows.length === 0 ? (
        <p>No return records found.</p>
      ) : selectedCustomer ? (
        <div className="detail-view">
          <button className="back-btn" onClick={() => setSelectedCustomer(null)}>← Back</button>
          <h3>Details for {selectedCustomer}</h3>
          {detailRows.length === 0 ? (
            <p>No details available.</p>
          ) : (
            <table className="report-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Quantity</th>
                </tr>
              </thead>
              <tbody>
                {detailRows.map((row, idx) => (
                  <tr key={idx}>
                    <td>{row.product}</td>
                    <td>{row.totalQty}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ) : (
        <table className="report-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Customer Name</th>
              <th>Notes</th>
              <th>Total Quantity</th>
            </tr>
          </thead>
          <tbody>
            {summaryRows.map((row, index) => (
              <tr key={index} className="clickable-row" onClick={() => setSelectedCustomer(row.customerName)}>
                <td>{row.latestDate ? format(new Date(row.latestDate), "yyyy-MM-dd") : "N/A"}</td>
                <td>{row.customerName}</td>
                <td>{row.notes || "-"}</td>
                <td>{row.totalQty}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {message && <p className="report-message">{message}</p>}
    </div>
  );
};

export default ReturnReport;