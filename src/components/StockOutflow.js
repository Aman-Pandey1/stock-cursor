import React, { useState, useEffect } from "react";
import API from "../utils/api";
import "./StockOutflow.css";
import { format, startOfDay, endOfDay } from 'date-fns';
import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';

const StockOutflow = () => {
  // State declarations
  const [searchTerm, setSearchTerm] = useState("");
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [reduceQty, setReduceQty] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [todaySales, setTodaySales] = useState([]);
  const [weeklySales, setWeeklySales] = useState([]);
  const [dailySalesReport, setDailySalesReport] = useState([]);
  const [activeTab, setActiveTab] = useState("today");
  const [recentOutflows, setRecentOutflows] = useState([]);
  const [isLoading, setIsLoading] = useState({
    today: false,
    weekly: false,
    daily: false,
    outflows: false,
    products: false
  });

  // Fetch data on component mount
  useEffect(() => {
    fetchTodaySales();
    fetchWeeklySales();
    fetchDailySalesReport();
    fetchRecentOutflows();
  }, []);

  // Search products with debounce
  useEffect(() => {
    if (searchTerm.trim()) {
      const debounceTimer = setTimeout(() => {
        fetchProducts(searchTerm);
      }, 300);
      
      return () => clearTimeout(debounceTimer);
    } else {
      setProducts([]);
    }
  }, [searchTerm]);

  // API call functions with enhanced error handling
  const fetchProducts = async (term) => {
    setIsLoading(prev => ({...prev, products: true}));
    try {
      const res = await API.get(`/products?search=${term}`);
      if (res.data && Array.isArray(res.data)) {
        setProducts(res.data);
      } else {
        console.warn("Unexpected products data format:", res.data);
        setProducts([]);
      }
    } catch (err) {
      console.error("Error fetching products:", err);
      setMessage("❌ Error searching products");
      setProducts([]);
    } finally {
      setIsLoading(prev => ({...prev, products: false}));
    }
  };

const fetchTodaySales = async () => {
  setIsLoading(prev => ({...prev, today: true}));
  try {
    const res = await API.get("/products/sales/today");
    
    if (res.data && Array.isArray(res.data)) {
      const validatedData = res.data.map(item => ({
        _id: item.productId || Math.random().toString(36).substr(2, 9),
        companyName: item.companyName || item.productDetails?.companyName || 'Unknown',
        modelNo: item.modelNo || item.productDetails?.modelNo || 'N/A',
        totalSold: item.totalSold || 0,
        date: new Date().toISOString(),
        productDetails: item.productDetails || {}
      }));
      
      setTodaySales(validatedData);
    } else {
      setTodaySales([]);
    }
  } catch (err) {
    setMessage("❌ Error fetching today's sales");
    setTodaySales([]);
  } finally {
    setIsLoading(prev => ({...prev, today: false}));
  }
};

// Update fetchWeeklySales
const fetchWeeklySales = async () => {
  setIsLoading(prev => ({...prev, weekly: true}));
  try {
    const res = await API.get("/products/sales/weekly");
    
    if (res.data && Array.isArray(res.data)) {
      const validatedData = res.data.map(item => ({
        _id: item.productId || Math.random().toString(36).substr(2, 9),
        companyName: item.companyName || item.productDetails?.companyName || 'Unknown',
        modelNo: item.modelNo || item.productDetails?.modelNo || 'N/A',
        totalSold: item.totalSold || 0,
        date: item.date || new Date().toISOString(),
        productDetails: item.productDetails || {}
      }));
      
      setWeeklySales(validatedData);
    } else {
      setWeeklySales([]);
    }
  } catch (err) {
    setMessage("❌ Error fetching weekly sales");
    setWeeklySales([]);
  } finally {
    setIsLoading(prev => ({...prev, weekly: false}));
  }
};

  const fetchDailySalesReport = async () => {
    setIsLoading(prev => ({...prev, daily: true}));
    try {
      const res = await API.get("/products/sales/daily-report");
      if (res.data && Array.isArray(res.data)) {
        const validatedData = res.data.map(item => ({
          _id: item._id || Math.random().toString(36).substr(2, 9),
          totalSales: item.totalSales || 0,
          itemsSold: item.itemsSold || 0,
          date: item.date || new Date().toISOString()
        }));
        setDailySalesReport(validatedData);
      } else {
        console.warn("Unexpected daily report data format:", res.data);
        setDailySalesReport([]);
      }
    } catch (err) {
      console.error("Error fetching daily sales report:", err);
      setMessage("❌ Error fetching daily sales report");
      setDailySalesReport([]);
    } finally {
      setIsLoading(prev => ({...prev, daily: false}));
    }
  };

const fetchRecentOutflows = async () => {
  setIsLoading(prev => ({...prev, outflows: true}));
  setMessage("");
  
  try {
    const res = await API.get("/products/sales/recent-outflows", {
      params: { limit: 10 }
    });
    
    if (res.data && Array.isArray(res.data)) {
      // Format the data for display
      const formattedData = res.data.map(item => ({
        _id: item.id,
        companyName: item.companyName || 'Unknown',
        modelNo: item.modelNo || 'N/A',
        quantity: item.quantity || 0,
        createdAt: item.date || new Date().toISOString()
      }));
      
      setRecentOutflows(formattedData);
    } else {
      throw new Error("Invalid data format received from server");
    }
  } catch (err) {
    console.error("Fetch recent outflows error:", err);
    setMessage(`❌ Failed to load recent sales: ${err.response?.data?.message || err.message}`);
    setRecentOutflows([]);
  } finally {
    setIsLoading(prev => ({...prev, outflows: false}));
  }
};

  // Stock reduction handler with improved feedback
const handleReduceStock = async () => {
  if (!selectedProduct || !reduceQty) {
    setMessage("⚠️ Please select a product and enter quantity.");
    return;
  }
  if (isNaN(reduceQty) || parseInt(reduceQty) <= 0) {
    setMessage("⚠️ Please enter a valid quantity.");
    return;
  }
  if (parseInt(reduceQty) > selectedProduct.quantity) {
    setMessage(`⚠️ Quantity exceeds available stock (${selectedProduct.quantity} available).`);
    return;
  }

  setIsSubmitting(true);
  setMessage("");

  try {
    const res = await API.put(
      `/products/${selectedProduct._id}/reduce-stock`,
      { 
        reduceBy: parseInt(reduceQty),
        date: new Date().toISOString()
      }
    );

    setMessage(`✅ ${res.data.message}`);
    
    // Immediately update today's sales with optimistic update
    const newSale = {
      _id: `temp_${Date.now()}`,
      companyName: selectedProduct.companyName,
      modelNo: selectedProduct.modelNo,
      totalSold: parseInt(reduceQty),
      date: new Date().toISOString()
    };
    
    setTodaySales(prev => [...prev, newSale]);
    
    // Also update recent outflows
    const newOutflow = {
      _id: `temp_${Date.now()}_outflow`,
      companyName: selectedProduct.companyName,
      modelNo: selectedProduct.modelNo,
      quantity: parseInt(reduceQty),
      createdAt: new Date().toISOString()
    };
    
    setRecentOutflows(prev => [newOutflow, ...prev]);
    
    setReduceQty("");
    setSelectedProduct(null);
    setSearchTerm("");
    setProducts([]);
    
    // Refresh data from server to ensure consistency
    setTimeout(() => {
      fetchTodaySales();
      fetchWeeklySales();
      fetchDailySalesReport();
      fetchRecentOutflows();
    }, 1000);
  } catch (err) {
    // Roll back optimistic updates if the request fails
    setTodaySales(prev => prev.filter(item => !item._id.startsWith('temp_')));
    setRecentOutflows(prev => prev.filter(item => !item._id.startsWith('temp_outflow')));
    
    const errorMsg = err.response?.data?.message || "Error reducing stock";
    setMessage(`❌ ${errorMsg}`);
  } finally {
    setIsSubmitting(false);
  }
};

  // Robust PDF generation function
const generatePDF = (data, title, columns) => {
  if (!data || !Array.isArray(data) || data.length === 0) {
    setMessage("❌ No data available to generate PDF");
    return;
  }

  try {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    });

    // Add title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text(`${title} Sales Report`, 105, 15, { align: 'center' });
    
    // Add generation date
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Generated on: ${format(new Date(), 'yyyy-MM-dd HH:mm')}`, 105, 22, { align: 'center' });
    
    // Prepare detailed table data
    const tableData = data.map(item => {
      return columns.map(col => {
        const key = col.toLowerCase().replace(/\s+/g, '');
        
        // Handle special cases
        if (key === 'date') return format(new Date(item.date), 'yyyy-MM-dd');
        if (key === 'product') return item.companyName;
        if (key === 'model') return item.modelNo;
        if (key === 'quantitysold') return item.totalSold;
        if (key === 'totalsales') return item.totalSales;
        if (key === 'itemssold') return item.itemsSold;
        
        // Fallback to product details
        return item.productDetails?.[key] || item[key] || '';
      });
    });

    // Add the table with product details
    autoTable(doc, {
      head: [columns],
      body: tableData,
      startY: 25,
      margin: { top: 25 },
      styles: { 
        fontSize: 9,
        cellPadding: 3,
        overflow: 'linebreak'
      },
      headStyles: { 
        fillColor: [22, 160, 133],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        halign: 'center'
      },
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 'auto' },
        3: { cellWidth: 'auto' }
      }
    });

    // Save the PDF
    doc.save(`${title.toLowerCase().replace("'", "")}_sales_report.pdf`);
  } catch (err) {
    console.error("Error generating PDF:", err);
    setMessage("❌ Error generating PDF report");
  }
};

  // PDF download handlers
  const downloadTodaySalesPDF = () => {
    generatePDF(todaySales, "Today's", ['Product', 'Model', 'Quantity Sold']);
  };

  const downloadWeeklySalesPDF = () => {
    generatePDF(weeklySales, "Weekly", ['Date', 'Product', 'Model', 'Quantity Sold']);
  };

  const downloadDailyReportPDF = () => {
    generatePDF(dailySalesReport, "Daily", ['Date', 'Total Sales', 'Items Sold']);
  };

  // Render loading states
  if (isLoading.today || isLoading.weekly || isLoading.daily || isLoading.outflows) {
    return (
      <div className="stock-outflow-container">
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <p>Loading data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="stock-outflow-container">
      <h2>📦 Sales Management</h2>

      {/* Sales Entry Section */}
      <div className="sales-entry-section">
        <h3>➕ New Sale Entry</h3>
        
        {/* Search Field */}
        <div className="form-group">
          <input
            type="text"
            placeholder="🔍 Search by company or model..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            disabled={isSubmitting}
            className="search-input"
          />
        </div>

        {/* Product Search Results */}
       {products.length > 0 && (
  <div className="product-results">
    {products.map((p) => {
      const isExactMatch = 
        p.companyName.toLowerCase() === searchTerm.toLowerCase() || 
        p.modelNo.toLowerCase() === searchTerm.toLowerCase();
      
      return (
        <div
          key={p._id}
          className={`product-item ${selectedProduct?._id === p._id ? "selected" : ""} ${
            isExactMatch ? "exact-match" : ""
          }`}
          onClick={() => setSelectedProduct(p)}
          style={{ order: isExactMatch ? -1 : 0 }} // This ensures exact matches appear first
        >
          <div className="product-info">
            <strong>{p.companyName}</strong> - {p.modelNo}
            {isExactMatch && <span className="exact-match-tag">Exact Match</span>}
          </div>
          <div className="product-stock">
            Stock: {p.quantity} pcs
          </div>
        </div>
      );
    })}
  </div>
)}
        {/* Quantity Entry */}
        {selectedProduct && (
          <div className="sale-entry-form">
            <h4>
              Selected: <span className="product-name">{selectedProduct.companyName}</span> - 
              <span className="product-model">{selectedProduct.modelNo}</span>
            </h4>
            <div className="form-row">
              <input
                type="number"
                min="1"
                max={selectedProduct.quantity}
                placeholder="Enter quantity sold"
                value={reduceQty}
                onChange={(e) => setReduceQty(e.target.value)}
                disabled={isSubmitting}
              />
              <button 
                onClick={handleReduceStock} 
                disabled={isSubmitting}
                className="confirm-btn"
              >
                {isSubmitting ? "Processing..." : "Confirm Sale"}
              </button>
            </div>
          </div>
        )}

        {/* Message */}
        {message && (
          <p className={`message ${message.startsWith("❌") ? "error" : message.startsWith("⚠️") ? "warning" : "success"}`}>
            {message}
          </p>
        )}
      </div>

      {/* Recent Outflows Section */}
      <div className="recent-outflows-section">
        <h3>🔄 Recent Stock Reductions</h3>
        {recentOutflows.length > 0 ? (
          <div className="outflows-table">
            <div className="table-header">
              <span>Product</span>
              <span>Model</span>
              <span>Qty Reduced</span>
              <span>Time</span>
            </div>
            {recentOutflows.map((outflow) => (
              <div key={outflow._id} className="table-row">
                <span>{outflow.companyName}</span>
                <span>{outflow.modelNo}</span>
                <span className="reduced-qty">-{outflow.quantity} pcs</span>
                <span>{format(new Date(outflow.createdAt), 'HH:mm')}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="no-data">No recent stock reductions.</p>
        )}
      </div>

      {/* Sales Reports Section */}
      <div className="sales-reports-section">
        <div className="tabs">
          <button 
            className={`tab-btn ${activeTab === "today" ? "active" : ""}`}
            onClick={() => setActiveTab("today")}
          >
            Today's Sales
          </button>
          <button 
            className={`tab-btn ${activeTab === "weekly" ? "active" : ""}`}
            onClick={() => setActiveTab("weekly")}
          >
            Weekly Sales
          </button>
          <button 
            className={`tab-btn ${activeTab === "daily" ? "active" : ""}`}
            onClick={() => setActiveTab("daily")}
          >
            Daily Report
          </button>
        </div>

        <div className="report-actions">
          <button 
            onClick={
              activeTab === "today" ? downloadTodaySalesPDF : 
              activeTab === "weekly" ? downloadWeeklySalesPDF : 
              downloadDailyReportPDF
            }
            className="download-btn"
            disabled={
              (activeTab === "today" && todaySales.length === 0) ||
              (activeTab === "weekly" && weeklySales.length === 0) ||
              (activeTab === "daily" && dailySalesReport.length === 0)
            }
          >
            Download {activeTab === "today" ? "Today's" : activeTab === "weekly" ? "Weekly" : "Daily"} Report (PDF)
          </button>
        </div>

        {activeTab === "today" ? (
          <div className="today-sales">
            <h3>📅 Today's Sales</h3>
            {todaySales.length > 0 ? (
              <div className="sales-table">
                <div className="table-header">
                  <span>Product</span>
                  <span>Model</span>
                  <span>Quantity Sold</span>
                </div>
            {todaySales.map((sale) => (
  <div key={sale._id} className="table-row">
    <span>
      {sale.companyName}
      {sale.productDetails?.size && ` (Size: ${sale.productDetails.size})`}
      {sale.productDetails?.color && ` (Color: ${sale.productDetails.color})`}
    </span>
    <span>{sale.modelNo}</span>
    <span className="sold-qty">{sale.totalSold} pcs</span>
  </div>
))}
                <div className="table-footer">
                  <span>Total:</span>
                  <span></span>
                  <span className="total-qty">
                    {todaySales.reduce((sum, item) => sum + (item.totalSold || 0), 0)} pcs
                  </span>
                </div>
              </div>
            ) : (
              <p className="no-data">No sales recorded today.</p>
            )}
          </div>
        ) : activeTab === "weekly" ? (
          <div className="weekly-sales">
            <h3>📆 Weekly Sales</h3>
            {weeklySales.length > 0 ? (
              <div className="sales-table">
                <div className="table-header">
                  <span>Date</span>
                  <span>Product</span>
                  <span>Model</span>
                  <span>Quantity Sold</span>
                </div>
               {weeklySales.map((sale) => (
  <div key={sale._id} className="table-row">
    <span>{format(new Date(sale.date), 'MMM dd')}</span>
    <span>
      {sale.companyName}
      {sale.productDetails?.design && ` (Design: ${sale.productDetails.design})`}
    </span>
    <span>{sale.modelNo}</span>
    <span className="sold-qty">{sale.totalSold} pcs</span>
  </div>
))}
                <div className="table-footer">
                  <span>Total:</span>
                  <span></span>
                  <span></span>
                  <span className="total-qty">
                    {weeklySales.reduce((sum, item) => sum + (item.totalSold || 0), 0)} pcs
                  </span>
                </div>
              </div>
            ) : (
              <p className="no-data">No sales recorded this week.</p>
            )}
          </div>
        ) : (
          <div className="daily-report">
            <h3>📊 Daily Sales Report</h3>
            {dailySalesReport.length > 0 ? (
              <div className="sales-table">
                <div className="table-header">
                  <span>Date</span>
                  <span>Total Sales</span>
                  <span>Items Sold</span>
                </div>
                {dailySalesReport.map((report) => (
                  <div key={report._id} className="table-row">
                    <span>{format(new Date(report.date), 'MMM dd, yyyy')}</span>
                    <span>{report.totalSales} transactions</span>
                    <span className="sold-qty">{report.itemsSold} pcs</span>
                  </div>
                ))}
                <div className="table-footer">
                  <span>Total:</span>
                  <span>
                    {dailySalesReport.reduce((sum, item) => sum + (item.totalSales || 0), 0)} transactions
                  </span>
                  <span className="total-qty">
                    {dailySalesReport.reduce((sum, item) => sum + (item.itemsSold || 0), 0)} pcs
                  </span>
                </div>
              </div>
            ) : (
              <p className="no-data">No daily sales data available.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StockOutflow;