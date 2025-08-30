"use client";

import { useEffect, useState } from "react";
import API from "../utils/api";
import "./PurchaseReport.css";
import { format } from "date-fns";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const PurchaseReport = () => {
  const [purchases, setPurchases] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [generatingPDF, setGeneratingPDF] = useState(false);

  useEffect(() => {
    fetchPurchases();
  }, [currentPage, limit]);

  const fetchPurchases = async () => {
    setLoading(true);
    try {
      const res = await API.get(`/purchases?page=${currentPage}&limit=${limit}`);
      setPurchases(res.data.purchases);
      setTotalPages(res.data.totalPages);
    } catch (err) {
      console.error("Error fetching purchases:", err);
      setMessage("❌ Failed to fetch purchase report");
    } finally {
      setLoading(false);
    }
  };

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
      doc.text("Purchase Report", 105, 15, { align: "center" });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(`Generated on: ${format(new Date(), "yyyy-MM-dd HH:mm")}`, 105, 22, { align: "center" });

      const tableData = purchases.map((item) => [
        item.date ? format(new Date(item.date), "yyyy-MM-dd") : "N/A",
        item.supplierName || "N/A",
        item.companyName,
        item.modelNo,
        item.quantity.toString(),
        item.notes || "-"
      ]);

      autoTable(doc, {
        head: [['Date', 'Supplier', 'Product', 'Model No', 'Quantity', 'Notes']],
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
          0: { cellWidth: 25 },
          1: { cellWidth: 30 },
          2: { cellWidth: 35 },
          3: { cellWidth: 35 },
          4: { cellWidth: 20 },
          5: { cellWidth: "auto" }
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
        <button 
          onClick={downloadPDF} 
          disabled={generatingPDF || purchases.length === 0}
          className="download-pdf-btn"
        >
          {generatingPDF ? (
            <><i className="fas fa-spinner fa-spin"></i> Generating PDF...</>
          ) : (
            <><i className="fas fa-download"></i> Download PDF</>
          )}
        </button>
      </div>

      <div className="report-controls">
        <label>Show: </label>
        <select value={limit} onChange={(e) => setLimit(Number(e.target.value))}>
          <option value={10}>10 per page</option>
          <option value={20}>20 per page</option>
          <option value={50}>50 per page</option>
        </select>
      </div>

      {loading ? (
        <p>Loading report...</p>
      ) : purchases.length === 0 ? (
        <p>No purchase records found.</p>
      ) : (
        <table className="report-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Supplier</th>
              <th>Product</th>
              <th>Model No</th>
              <th>Quantity</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {purchases.map((purchase, index) => (
              <tr key={index}>
                <td>{purchase.date ? format(new Date(purchase.date), "yyyy-MM-dd") : "N/A"}</td>
                <td>{purchase.supplierName || "N/A"}</td>
                <td>{purchase.companyName}</td>
                <td>{purchase.modelNo}</td>
                <td>{purchase.quantity}</td>
                <td>{purchase.notes || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Pagination */}
      <div className="pagination">
        <button
          disabled={currentPage === 1}
          onClick={() => setCurrentPage((prev) => prev - 1)}
        >
          ⬅ Prev
        </button>
        <span>
          Page {currentPage} of {totalPages}
        </span>
        <button
          disabled={currentPage === totalPages}
          onClick={() => setCurrentPage((prev) => prev + 1)}
        >
          Next ➡
        </button>
      </div>

      {message && <p className="report-message">{message}</p>}
    </div>
  );
};

export default PurchaseReport;