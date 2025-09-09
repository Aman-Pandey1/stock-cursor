import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import API from "../utils/api";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import "./CustomerDetails.css";

const CustomerDetails = () => {
  const { customerName } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchCustomerDetails();
  }, [customerName]);

  const fetchCustomerDetails = async () => {
    try {
      const res = await API.get(`/products/sales/customer/${encodeURIComponent(customerName)}`);
      setCustomer(res.data);
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load customer details");
    } finally {
      setLoading(false);
    }
  };

  const downloadCustomerPDF = () => {
    if (!customer || !customer.sales || customer.sales.length === 0) {
      setError("No sales data available to generate PDF");
      return;
    }

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text(
      `Customer Purchase Report: ${customerName}`,
      105,
      15,
      { align: "center" }
    );

    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.text(
      `Generated on: ${format(new Date(), "dd MMM yyyy HH:mm")}`,
      105,
      22,
      { align: "center" }
    );

    doc.text(
      `Total Transactions: ${customer.totalTransactions} | Total Items: ${customer.totalItems}`,
      105,
      29,
      { align: "center" }
    );

    autoTable(doc, {
      startY: 40,
      head: [["Date", "Product", "Model", "Quantity", "Notes"]],
      body: customer.sales.map((sale) => [
        format(new Date(sale.date), "dd MMM yyyy"),
        sale.companyName,
        sale.modelNo,
        sale.quantity,
        sale.notes || "-",
      ]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [41, 128, 185] },
    });

    doc.save(`${customerName}_purchase_report.pdf`);
  };

  const viewProductDetails = (productId) => {
    navigate(`/product-details/${productId}`);
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!customer) return <div className="not-found">Customer not found</div>;

  return (
    <div className="customer-details-container">
      <button onClick={() => navigate(-1)} className="back-button">
        &larr; Back to Sales Reports
      </button>

      <div className="customer-header">
        <h2>👤 Customer: {customerName}</h2>
        <div className="customer-stats">
          <div className="stat-item">
            <span className="stat-label">Total Transactions:</span>
            <span className="stat-value">{customer.totalTransactions}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Total Items:</span>
            <span className="stat-value">{customer.totalItems}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">First Purchase:</span>
            <span className="stat-value">
              {format(new Date(customer.firstPurchase), "dd MMM yyyy")}
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Last Purchase:</span>
            <span className="stat-value">
              {format(new Date(customer.lastPurchase), "dd MMM yyyy")}
            </span>
          </div>
        </div>
        <div className="customer-actions">
          <button onClick={downloadCustomerPDF} className="download-pdf-btn">
            📄 Download PDF Report
          </button>
        </div>
      </div>

      <div className="purchase-history-section">
        <h3>🛒 Purchase History</h3>
        {customer.sales && customer.sales.length > 0 ? (
          <div className="purchase-table">
            <div className="table-header">
              <span>Date</span>
              <span>Product</span>
              <span>Model</span>
              <span>Quantity</span>
              <span>Notes</span>
              <span>Actions</span>
            </div>
            {customer.sales.map((sale) => (
              <div key={sale._id} className="table-row">
                <span>{format(new Date(sale.date), "dd MMM yyyy")}</span>
                <span>{sale.companyName}</span>
                <span>{sale.modelNo}</span>
                <span className="quantity-cell">{sale.quantity}</span>
                <span className="notes-cell">{sale.notes || "-"}</span>
                <span className="actions-cell">
                  <button 
                    onClick={() => viewProductDetails(sale.productId)} 
                    className="view-product-btn"
                  >
                    View Product
                  </button>
                </span>
              </div>
            ))}
            <div className="table-footer">
              <span>Total:</span>
              <span></span>
              <span></span>
              <span className="total-qty">{customer.totalItems}</span>
              <span></span>
              <span></span>
            </div>
          </div>
        ) : (
          <p>No purchase history found for this customer.</p>
        )}
      </div>

      <div className="product-summary-section">
        <h3>📊 Product Summary</h3>
        {customer.productSummary && customer.productSummary.length > 0 ? (
          <div className="summary-table">
            <div className="table-header">
              <span>Product</span>
              <span>Model</span>
              <span>Total Quantity</span>
              <span>Transactions</span>
            </div>
            {customer.productSummary.map((product, index) => (
              <div key={index} className="table-row">
                <span>{product.companyName}</span>
                <span>{product.modelNo}</span>
                <span className="quantity-cell">{product.totalQuantity}</span>
                <span>{product.transactions.length}</span>
              </div>
            ))}
          </div>
        ) : (
          <p>No product summary available.</p>
        )}
      </div>
    </div>
  );
};

export default CustomerDetails;