import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import API from "../utils/api";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import "./ProductDetails.css";

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showProductEditModal, setShowProductEditModal] = useState(false);
  const [showTransactionEditModal, setShowTransactionEditModal] =
    useState(false);
  const [currentTransaction, setCurrentTransaction] = useState(null);
  const [message, setMessage] = useState("");
  const [transactionFormData, setTransactionFormData] = useState({
    date: "",
    quantity: "",
    notes: "",
    partyName: "",
  });

  const [productFormData, setProductFormData] = useState({
    companyName: "",
    modelNo: "",
    description: "",
    quantity: "",
    size: "",
  });

  useEffect(() => {
    fetchProduct();
  }, [id]);
  
  const isValidTransactionId = (id) => {
    return /^[0-9a-fA-F]{24}$/.test(id) || id.startsWith("temp_");
  };

  const formatDateForInput = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - offset * 60 * 1000);
    return localDate.toISOString().slice(0, 16);
  };

  const fetchProduct = async () => {
    try {
      const res = await API.get(`/products/${id}/details`);
      setProduct(res.data);
      setProductFormData({
        companyName: res.data.companyName || "",
        modelNo: res.data.modelNo || "",
        description: res.data.description || "",
        quantity: res.data.quantity?.toString() || "",
        size: res.data.size || "",
      });
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load product");
    } finally {
      setLoading(false);
    }
  };

  const formatDateSafe = (dateInput) => {
    if (!dateInput) return "Date N/A";

    try {
      const dateObj =
        dateInput instanceof Date ? dateInput : new Date(dateInput);
      if (isNaN(dateObj.getTime())) {
        return "Date N/A";
      }
      return format(dateObj, "dd MMM yyyy HH:mm");
    } catch (e) {
      console.error("Date formatting error:", e);
      return "Date N/A";
    }
  };

  const handleProductUpdate = async (e) => {
    e.preventDefault();
    try {
      const response = await API.put(`/products/${id}`, {
        ...productFormData,
        quantity: Number(productFormData.quantity),
      });

      if (response.data.success) {
        await fetchProduct();
        setShowProductEditModal(false);
      } else {
        setError(response.data.message || "Product update failed");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update product");
    }
  };

  const handleEditTransaction = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        quantity: Number(transactionFormData.quantity),
        notes: transactionFormData.notes || "",
        partyName: transactionFormData.partyName || "Walk-in Customer",
      };

      if (transactionFormData.date) {
        const dateObj = new Date(transactionFormData.date);
        if (!isNaN(dateObj.getTime())) {
          payload.date = dateObj.toISOString();
        }
      }

      const response = await API.put(
        `/products/${id}/transactions/${currentTransaction}`,
        payload
      );

      if (response.data) {
        await fetchProduct();
        setShowTransactionEditModal(false);
        setMessage("Transaction updated successfully");
      } else {
        setError(response.data?.message || "Update failed");
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Update failed");
      console.error("Update error:", err);
    }
  };

  const handleDeleteTransaction = async (transactionId) => {
    if (!transactionId || !id) {
      setError("Invalid transaction data");
      return;
    }

    if (window.confirm("Are you sure you want to delete this transaction?")) {
      try {
        const response = await API.delete(
          `/products/${id}/transactions/${transactionId}`
        );

        if (response.data?.success) {
          await fetchProduct();
          setMessage("Transaction deleted successfully");
        } else {
          setError(response.data?.message || "Failed to delete transaction");
        }
      } catch (err) {
        setError(err.response?.data?.message || "Failed to delete transaction");
        console.error("Delete error:", err);
      }
    }
  };
  
  const handleDeleteProduct = async () => {
    if (
      window.confirm(
        "Are you sure you want to delete this product? This will permanently delete the product and all its transactions."
      )
    ) {
      try {
        await API.delete(`/products/${id}?deleteTransactions=true`);
        navigate("/products");
      } catch (err) {
        setError(err.response?.data?.message || "Failed to delete product");
      }
    }
  };

  const handleProductInputChange = (e) => {
    const { name, value } = e.target;
    setProductFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleTransactionInputChange = (e) => {
    const { name, value } = e.target;
    setTransactionFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddTransaction = () => {
    navigate(`/products/${id}/add-transaction`);
  };

  const downloadCustomerSalesPDF = () => {
    if (
      !product ||
      !product.salesByCustomer ||
      product.salesByCustomer.length === 0
    ) {
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
      `${product.companyName} - ${product.modelNo} Sales Report`,
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
      `Current Stock: ${product.quantity} | Total Sold: ${product.totalSold}`,
      105,
      29,
      { align: "center" }
    );

    let yPosition = 40;

    product.salesByCustomer.forEach((customer, index) => {
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFont("helvetica", "bold");
      doc.text(
        `${index + 1}. ${customer.customerName} (Total: ${
          customer.totalQuantity
        })`,
        14,
        yPosition
      );
      yPosition += 10;

      autoTable(doc, {
        startY: yPosition,
        head: [["Date", "Quantity", "Notes"]],
        body: customer.transactions.map((transaction) => [
          formatDateSafe(transaction.date),
          transaction.quantity,
          transaction.notes || "-",
        ]),
        margin: { left: 14 },
        styles: { fontSize: 9 },
        headStyles: { fillColor: [41, 128, 185] },
      });

      yPosition = doc.lastAutoTable.finalY + 10;
    });

    doc.save(`${product.companyName}_${product.modelNo}_sales_report.pdf`);
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!product) return <div className="not-found">Product not found</div>;

  return (
    <div className="product-details-container">
      <button onClick={() => navigate(-1)} className="back-button">
        &larr; Back to Sales
      </button>

      <div className="product-header">
        <div>
          <h2>
            {product.companyName} - {product.modelNo}
          </h2>
          <p className="product-description">
            {product.description || "No description available"}
          </p>
        </div>
        <div className="product-stats">
           <div className="stat-item size-box">
            <span className="stat-label">Size:</span>
            <span className="stat-value">{product.size || "N/A"}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Current Stock:</span>
            <span className="stat-value">{product.quantity}</span>
          </div>
       
          <div className="stat-item">
            <span className="stat-label">Total Sold:</span>
            <span className="stat-value">{product.totalSold}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Customers:</span>
            <span className="stat-value">{product.uniqueCustomers}</span>
          </div>
        </div>
        <div className="product-actions">
          {/* <button
            onClick={() => setShowProductEditModal(true)}
            className="edit-product-btn"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
              width="16"
              height="16"
            >
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
            </svg>
            Edit Product
          </button>
          <button onClick={handleDeleteProduct} className="delete-product-btn">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
              width="16"
              height="16"
            >
              <path
                fillRule="evenodd"
                d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            Delete Product
          </button> */}
          {product.salesByCustomer?.length > 0 && (
            <button
              onClick={downloadCustomerSalesPDF}
              className="download-pdf-btn"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
                width="16"
                height="16"
              >
                <path
                  fillRule="evenodd"
                  d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
              Download PDF
            </button>
          )}
        </div>
      </div>

      <div className="sales-history-section">
        <div className="section-header">
          <h3>Sales History</h3>
          <div className="header-actions">
            <span className="total-sold-badge">
              Total Sold: {product.totalSold}
            </span>
            <button
              onClick={handleAddTransaction}
              className="add-transaction-btn"
            >
              + Add Transaction
            </button>
          </div>
        </div>

        {product.salesByCustomer && product.salesByCustomer.length > 0 ? (
          <div className="customer-sales-container">
            <table className="sales-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Customer Name</th>
                  <th>Quantity</th>
                  <th>Notes</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {product.salesByCustomer.flatMap((customer, customerIndex) =>
                  customer?.transactions?.map(
                    (transaction, transactionIndex) => {
                      const transactionKey = transaction._id;
                      const safeTransaction = {
                        _id: transactionKey,
                        quantity: transaction.quantity || 0,
                        notes: transaction.notes || "",
                        date: transaction?.date,
                        partyName:
                          transaction.partyName ||
                          customer.customerName ||
                          "N/A",
                      };

                      return (
                        <tr key={transactionKey}>
                          <td>{formatDateSafe(safeTransaction?.date)}</td>
                          <td className="customer-cell">
                            {safeTransaction.partyName}
                          </td>
                          <td className="quantity-cell">
                            -{safeTransaction.quantity}
                          </td>
                          <td className="notes-cell">
                            {safeTransaction.notes}
                          </td>
                          <td className="actions-cell">
                            <button
                              onClick={() => {
                                setTransactionFormData(safeTransaction);
                                setShowTransactionEditModal(true);
                                setCurrentTransaction(transactionKey);
                              }}
                              className="edit-transaction-btn"
                              title="Edit"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                                width="14"
                                height="14"
                              >
                                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                              </svg>
                            </button>
                            <button
                              onClick={() =>
                                handleDeleteTransaction(safeTransaction?._id)
                              }
                              className="delete-transaction-btn"
                              title="Delete"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                                width="14"
                                height="14"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </button>
                          </td>
                        </tr>
                      );
                    }
                  )
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="no-sales-container">
            <p>No sales recorded for this product</p>
            <button
              onClick={handleAddTransaction}
              className="add-transaction-btn"
            >
              + Add First Transaction
            </button>
          </div>
        )}
      </div>

      {/* Edit Product Modal */}
      {showProductEditModal && (
        <div className="modal-overlay">
          <div className="edit-modal">
            <h3>Edit Product</h3>
            <form onSubmit={handleProductUpdate}>
              <div className="form-group">
                <label>Company Name</label>
                <input
                  type="text"
                  name="companyName"
                  value={productFormData.companyName || ""}
                  onChange={handleProductInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Model Number</label>
                <input
                  type="text"
                  name="modelNo"
                  value={productFormData.modelNo || ""}
                  onChange={handleProductInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  name="description"
                  value={productFormData.description || ""}
                  onChange={handleProductInputChange}
                />
              </div>
              <div className="form-group">
                <label>Current Stock</label>
                <input
                  type="number"
                  name="quantity"
                  value={productFormData.quantity || ""}
                  onChange={handleProductInputChange}
                  min="0"
                  required
                />
              </div>
              <div className="form-group">
                <label>Size</label>
                <input
                  type="text"
                  name="size"
                  value={productFormData.size || ""}
                  onChange={handleProductInputChange}
                />
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => setShowProductEditModal(false)}
                  className="cancel-btn"
                >
                  Cancel
                </button>
                <button type="submit" className="save-btn">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Transaction Modal */}
      {showTransactionEditModal && (
        <div className="modal-overlay">
          <div className="edit-modal">
            <h3>Edit Transaction</h3>
            <form onSubmit={handleEditTransaction}>
              <div className="form-group">
                <label>Date</label>
                <input
                  type="datetime-local"
                  name="date"
                  value={formatDateForInput(transactionFormData?.date)}
                  onChange={(e) =>
                    setTransactionFormData({
                      ...transactionFormData,
                      date: e.target.value,
                    })
                  }
                  required
                />
              </div>
              <div className="form-group">
                <label>Quantity</label>
                <input
                  type="number"
                  name="quantity"
                  value={transactionFormData.quantity}
                  onChange={(e) =>
                    setTransactionFormData({
                      ...transactionFormData,
                      quantity: e.target.value,
                    })
                  }
                  min="1"
                  required
                />
              </div>
              <div className="form-group">
                <label>Customer Name</label>
                <input
                  type="text"
                  name="partyName"
                  value={transactionFormData.partyName}
                  onChange={(e) =>
                    setTransactionFormData({
                      ...transactionFormData,
                      partyName: e.target.value,
                    })
                  }
                  required
                />
              </div>
              <div className="form-group">
                <label>Notes</label>
                <textarea
                  name="notes"
                  value={transactionFormData.notes}
                  onChange={(e) =>
                    setTransactionFormData({
                      ...transactionFormData,
                      notes: e.target.value,
                    })
                  }
                />
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => setShowTransactionEditModal(false)}
                  className="cancel-btn"
                >
                  Cancel
                </button>
                <button type="submit" className="save-btn">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetails;