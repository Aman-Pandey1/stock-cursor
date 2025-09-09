"use client";

import { useEffect, useMemo, useState } from "react";
import API from "../utils/api";
import "./PurchaseReport.css";
import { format, startOfMonth, endOfMonth, startOfDay, endOfDay } from "date-fns";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const PurchaseReport = () => {
  const [purchases, setPurchases] = useState([]);
  const [activeTab, setActiveTab] = useState("today"); // today | monthly | all
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [generatingPDF, setGeneratingPDF] = useState(false);

  useEffect(() => {
    fetchPurchases();
  }, [activeTab]);

  const fetchPurchases = async () => {
    setLoading(true);
    try {
      const now = new Date();
      let params = { page: 1, limit: 1000 };

      if (activeTab === "today") {
        params.startDate = startOfDay(now).toISOString();
        params.endDate = endOfDay(now).toISOString();
      } else if (activeTab === "monthly") {
        params.startDate = startOfMonth(now).toISOString();
        params.endDate = endOfMonth(now).toISOString();
      }

      const query = new URLSearchParams(params).toString();
      const res = await API.get(`/purchases?${query}`);
      const list = res.data?.purchases || res.data || [];
      setPurchases(Array.isArray(list) ? list : []);
      setSelectedCompany(null);
    } catch (err) {
      console.error("Error fetching purchases:", err);
      setMessage("❌ Failed to fetch purchase report");
    } finally {
      setLoading(false);
    }
  };

  const summaryRows = useMemo(() => {
    if (!Array.isArray(purchases)) return [];
    const groups = new Map();
    for (const p of purchases) {
      const key = p.companyName || "Unknown";
      const current = groups.get(key) || { companyName: key, totalQty: 0, latestDate: null, notes: "" };
      const qty = Number(p.quantity) || 0;
      current.totalQty += qty;
      const d = p.date || p.invoiceDate || p.createdAt;
      if (d) {
        const dt = new Date(d);
        if (!current.latestDate || dt > current.latestDate) current.latestDate = dt;
      }
      if (p.notes && !current.notes) current.notes = p.notes;
      groups.set(key, current);
    }
    return Array.from(groups.values()).sort((a, b) => (b.latestDate?.getTime() || 0) - (a.latestDate?.getTime() || 0));
  }, [purchases]);

  const detailRows = useMemo(() => {
    if (!selectedCompany) return [];
    const byModel = new Map();
    for (const p of purchases) {
      if ((p.companyName || "Unknown") !== selectedCompany) continue;
      const model = p.modelNo || "N/A";
      const qty = Number(p.quantity) || 0;
      const cur = byModel.get(model) || { modelNo: model, totalQty: 0 };
      cur.totalQty += qty;
      byModel.set(model, cur);
    }
    return Array.from(byModel.values()).sort((a, b) => a.modelNo.localeCompare(b.modelNo));
  }, [selectedCompany, purchases]);

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
      doc.text("Purchase Report (Summary)", 105, 15, { align: "center" });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(`Generated on: ${format(new Date(), "yyyy-MM-dd HH:mm")}`, 105, 22, { align: "center" });

      const tableData = summaryRows.map((row) => [
        row.latestDate ? format(new Date(row.latestDate), "yyyy-MM-dd") : "N/A",
        row.companyName,
        row.notes || "-",
        row.totalQty.toString(),
      ]);

      autoTable(doc, {
        head: [['Date', 'Company Name', 'Notes', 'Total Quantity']],
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

      doc.save(`purchase-report-${format(new Date(), "yyyy-MM-dd")}.pdf`);
      setMessage("✅ PDF downloaded successfully");
    } catch (error) {
      console.error("Error generating PDF:", error);
      setMessage("❌ Failed to generate PDF");
    } finally {
      setGeneratingPDF(false);
    }
  };

  return (
    <div className="purchase-report-container">
      <div className="report-header">
        <h2>
          <i className="fas fa-file-invoice"></i> Purchase Report
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
        <p>No purchase records found.</p>
      ) : selectedCompany ? (
        <div className="detail-view">
          <button className="back-btn" onClick={() => setSelectedCompany(null)}>← Back</button>
          <h3>Details for {selectedCompany}</h3>
          {detailRows.length === 0 ? (
            <p>No details available.</p>
          ) : (
            <table className="report-table">
              <thead>
                <tr>
                  <th>Product Model</th>
                  <th>Quantity</th>
                </tr>
              </thead>
              <tbody>
                {detailRows.map((row, idx) => (
                  <tr key={idx}>
                    <td>{row.modelNo}</td>
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
              <th>Company Name</th>
              <th>Notes</th>
              <th>Total Quantity</th>
            </tr>
          </thead>
          <tbody>
            {summaryRows.map((row, index) => (
              <tr key={index} className="clickable-row" onClick={() => setSelectedCompany(row.companyName)}>
                <td>{row.latestDate ? format(new Date(row.latestDate), "yyyy-MM-dd") : "N/A"}</td>
                <td>{row.companyName}</td>
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

export default PurchaseReport;