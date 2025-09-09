// Frontend: SalesReports.jsx
"use client"

import { useState, useEffect } from "react"
import API from "../utils/api"
import "./SalesReport.css"
import { format } from "date-fns"
import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"
import { useNavigate } from "react-router-dom"

const SalesReports = () => {
  const [todaySales, setTodaySales] = useState([])
  const [weeklySales, setWeeklySales] = useState([])
  const [dailySalesReport, setDailySalesReport] = useState([])
  const [recentOutflows, setRecentOutflows] = useState([])
  const [activeTab, setActiveTab] = useState("today")
  const [isLoading, setIsLoading] = useState({
    today: false,
    weekly: false,
    daily: false,
    outflows: false,
  })
  const [currentView, setCurrentView] = useState("main")
  const [selectedSale, setSelectedSale] = useState(null)
  const [customerDetails, setCustomerDetails] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    fetchTodaySales()
    fetchWeeklySales()
    fetchDailySalesReport()
    fetchRecentOutflows()
  }, [])

  const fetchTodaySales = async () => {
    setIsLoading((prev) => ({ ...prev, today: true }))
    try {
      const todayStart = new Date()
      todayStart.setHours(0, 0, 0, 0)

      const todayEnd = new Date()
      todayEnd.setHours(23, 59, 59, 999)

      const res = await API.get("/products/sales/today", {
        params: {
          startDate: todayStart.toISOString(),
          endDate: todayEnd.toISOString(),
        },
      })

      const salesData = Array.isArray(res.data) ? res.data : []

      const formattedSales = salesData.map((sale) => ({
        _id: sale._id || sale.productId || Math.random().toString(),
        productId: sale.productId || sale.product?._id,
        companyName: sale.companyName || sale.product?.companyName || "Unknown",
        modelNo: sale.modelNo || sale.product?.modelNo || "N/A",
        totalSold: sale.quantity || sale.totalSold || 0,
        date: sale.date || sale.createdAt || new Date().toISOString(),
        partyName: sale.partyName || "Walk-in Customer",
        productDetails: {
          size: sale.product?.size || sale.size,
          color: sale.product?.color || sale.color,
          design: sale.product?.design || sale.design,
        },
      }))

      setTodaySales(formattedSales)
    } catch (err) {
      console.error("Error fetching today's sales:", err)
      setTodaySales([])
    } finally {
      setIsLoading((prev) => ({ ...prev, today: false }))
    }
  }

  const fetchWeeklySales = async () => {
    setIsLoading((prev) => ({ ...prev, weekly: true }))
    try {
      const res = await API.get("/products/sales/weekly")

      if (res.data && Array.isArray(res.data)) {
        const validatedData = res.data.map((item) => ({
          _id: item.productId || Math.random().toString(36).substr(2, 9),
          companyName: item.companyName || item.productDetails?.companyName || "Unknown",
          modelNo: item.modelNo || item.productDetails?.modelNo || "N/A",
          totalSold: item.totalSold || 0,
          date: item.date || new Date().toISOString(),
          partyName: item.partyName || "Walk-in Customer",
          productDetails: item.productDetails || {},
        }))

        setWeeklySales(validatedData)
      } else {
        setWeeklySales([])
      }
    } catch (err) {
      setWeeklySales([])
    } finally {
      setIsLoading((prev) => ({ ...prev, weekly: false }))
    }
  }

  const fetchDailySalesReport = async () => {
    setIsLoading((prev) => ({ ...prev, daily: true }))
    try {
      const res = await API.get("/products/sales/daily-report")
      if (res.data && Array.isArray(res.data)) {
        const validatedData = res.data.map((item) => ({
          _id: item._id || Math.random().toString(36).substr(2, 9),
          totalSales: item.totalSales || 0,
          itemsSold: item.itemsSold || 0,
          date: item.date || new Date().toISOString(),
        }))
        setDailySalesReport(validatedData)
      } else {
        setDailySalesReport([])
      }
    } catch (err) {
      console.error("Error fetching daily sales report:", err)
      setDailySalesReport([])
    } finally {
      setIsLoading((prev) => ({ ...prev, daily: false }))
    }
  }

  const fetchRecentOutflows = async () => {
    setIsLoading((prev) => ({ ...prev, outflows: true }))
    try {
      const res = await API.get("/products/sales/recent-outflows", {
        params: { limit: 10 },
      })

      if (res.data && Array.isArray(res.data)) {
        const formattedData = res.data.map((item) => ({
          _id: item._id,
          companyName: item.companyName || "Unknown",
          modelNo: item.modelNo || "N/A",
          quantity: item.quantity || 0,
          partyName: item.partyName || "N/A",
          notes: item.notes || "",
          createdAt: item.createdAt || item.date || new Date().toISOString(),
        }))

        setRecentOutflows(formattedData)
      } else {
        throw new Error("Invalid data format received from server")
      }
    } catch (err) {
      console.error("Fetch recent outflows error:", err)
      setRecentOutflows([])
    } finally {
      setIsLoading((prev) => ({ ...prev, outflows: false }))
    }
  }

  const fetchCustomerDetails = async (customerName) => {
    try {
      const res = await API.get(`/products/sales/customer/${encodeURIComponent(customerName)}`)
      setCustomerDetails(res.data)
      setCurrentView("customerDetails")
    } catch (err) {
      console.error("Error fetching customer details:", err)
    }
  }

  const generatePDF = (data, title, columns) => {
    if (!data || !Array.isArray(data) || data.length === 0) {
      return
    }

    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      })

      doc.setFont("helvetica", "bold")
      doc.setFontSize(16)
      doc.text(`${title} Sales Report`, 105, 15, { align: "center" })

      doc.setFont("helvetica", "normal")
      doc.setFontSize(10)
      doc.text(`Generated on: ${format(new Date(), "yyyy-MM-dd HH:mm")}`, 105, 22, { align: "center" })

      const tableData = data.map((item) => {
        return columns.map((col) => {
          const key = col.toLowerCase().replace(/\s+/g, "")

          if (key === "date") return format(new Date(item.date), "yyyy-MM-dd")
          if (key === "product") return item.companyName
          if (key === "model") return item.modelNo
          if (key === "quantitysold") return item.totalSold
          if (key === "totalsales") return item.totalSales
          if (key === "itemssold") return item.itemsSold
          if (key === "customer") return item.partyName

          return item.productDetails?.[key] || item[key] || ""
        })
      })

      autoTable(doc, {
        head: [columns],
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
          0: { cellWidth: "auto" },
          1: { cellWidth: "auto" },
          2: { cellWidth: "auto" },
          3: { cellWidth: "auto" },
        },
      })

      doc.save(`${title.toLowerCase().replace("'", "")}_sales_report.pdf`)
    } catch (err) {
      console.error("Error generating PDF:", err)
    }
  }

  const downloadTodaySalesPDF = () => {
    generatePDF(todaySales, "Today's", ["Customer", "Product", "Model", "Quantity Sold"])
  }

  const downloadWeeklySalesPDF = () => {
    generatePDF(weeklySales, "Weekly", ["Date", "Customer", "Product", "Model", "Quantity Sold"])
  }

  const downloadDailyReportPDF = () => {
    generatePDF(dailySalesReport, "Daily", ["Date", "Total Sales", "Items Sold"])
  }

  const handleSaleRowClick = (sale, saleType) => {
    const saleDetails = {
      ...sale,
      saleType: saleType,
      clickedAt: new Date().toISOString(),
    }
    setSelectedSale(saleDetails)
    setCurrentView("saleDetails")
  }

  const handleCustomerClick = (customerName) => {
    fetchCustomerDetails(customerName)
  }

  const goBackToMain = () => {
    setCurrentView("main")
    setSelectedSale(null)
    setCustomerDetails(null)
  }

  const viewProductDetails = (productId) => {
    navigate(`/product-details/${productId}`)
  }

  const navigateToStockOutflow = () => {
    navigate("/reduce-stock")
  }

  const SaleDetailsView = ({ sale, onBack }) => {
    return (
      <div className="sale-details-container">
        <div className="sale-details-header">
          <button onClick={onBack} className="back-btn">
            ← Back to Sales
          </button>
          <h2>📋 Sale Details</h2>
        </div>

        <div className="sale-details-content">
          <div className="sale-info-card">
            <h3>🏷️ Product Information</h3>
            <div className="info-grid">
              <div className="info-item">
                <label>Company Name:</label>
                <span>{sale.companyName}</span>
              </div>
              <div className="info-item">
                <label>Model Number:</label>
                <span>{sale.modelNo}</span>
              </div>
              <div className="info-item">
                <label>Quantity Sold:</label>
                <span className="sold-qty">{sale.totalSold} pieces</span>
              </div>
              <div className="info-item">
                <label>Sale Date:</label>
                <span>{format(new Date(sale.date), "dd MMM yyyy, HH:mm")}</span>
              </div>
              <div className="info-item">
                <label>Customer:</label>
                <span>{sale.partyName}</span>
              </div>
              <div className="info-item">
                <label>Sale Type:</label>
                <span className="sale-type-badge">{sale.saleType === "today" ? "Today's Sale" : "Weekly Sale"}</span>
              </div>
            </div>
          </div>

          {sale.productDetails && Object.keys(sale.productDetails).length > 0 && (
            <div className="product-details-card">
              <h3>🔍 Product Details</h3>
              <div className="info-grid">
                {sale.productDetails.size && (
                  <div className="info-item">
                    <label>Size:</label>
                    <span>{sale.productDetails.size}</span>
                  </div>
                )}
                {sale.productDetails.color && (
                  <div className="info-item">
                    <label>Color:</label>
                    <span>{sale.productDetails.color}</span>
                  </div>
                )}
                {sale.productDetails.design && (
                  <div className="info-item">
                    <label>Design:</label>
                    <span>{sale.productDetails.design}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="sale-actions-card">
            <h3>⚡ Quick Actions</h3>
            <div className="action-buttons">
              <button onClick={() => viewProductDetails(sale.productId || sale._id)} className="action-btn primary">
                👁️ View Full Product Details
              </button>
              <button
                onClick={() => {
                  const saleData = [sale]
                  generatePDF(
                    saleData,
                    `${sale.saleType === "today" ? "Today's" : "Weekly"}`,
                    sale.saleType === "today"
                      ? ["Customer", "Product", "Model", "Quantity Sold"]
                      : ["Date", "Customer", "Product", "Model", "Quantity Sold"],
                  )
                }}
                className="action-btn secondary"
              >
                📄 Download Sale PDF
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const CustomerDetailsView = ({ customer, onBack }) => {
    return (
      <div className="sale-details-container">
        <div className="sale-details-header">
          <button onClick={onBack} className="back-btn">
            ← Back to Sales
          </button>
          <h2>👤 Customer Details: {customer.customerName}</h2>
        </div>

        <div className="sale-details-content">
          <div className="sale-info-card">
            <h3>📊 Sales Summary</h3>
            <div className="info-grid">
              <div className="info-item">
                <label>Total Transactions:</label>
                <span>{customer.totalTransactions}</span>
              </div>
              <div className="info-item">
                <label>Total Items Purchased:</label>
                <span>{customer.totalItems} pieces</span>
              </div>
              <div className="info-item">
                <label>First Purchase:</label>
                <span>{format(new Date(customer.firstPurchase), "dd MMM yyyy")}</span>
              </div>
              <div className="info-item">
                <label>Last Purchase:</label>
                <span>{format(new Date(customer.lastPurchase), "dd MMM yyyy")}</span>
              </div>
            </div>
          </div>

          <div className="product-details-card">
            <h3>🛒 Purchase History</h3>
            {customer.sales && customer.sales.length > 0 ? (
              <div className="sales-table">
                <div className="table-header">
                  <span>Date</span>
                  <span>Product</span>
                  <span>Model</span>
                  <span>Quantity</span>
                  <span>Notes</span>
                </div>
                {customer.sales.map((sale) => (
                  <div key={sale._id} className="table-row">
                    <span>{format(new Date(sale.date), "dd MMM yyyy")}</span>
                    <span>{sale.companyName}</span>
                    <span>{sale.modelNo}</span>
                    <span className="sold-qty">{sale.quantity} pcs</span>
                    <span className="notes-cell">{sale.notes || "-"}</span>
                  </div>
                ))}
                <div className="table-footer">
                  <span>Total:</span>
                  <span></span>
                  <span></span>
                  <span className="total-qty">{customer.totalItems} pcs</span>
                  <span></span>
                </div>
              </div>
            ) : (
              <p className="no-data">No purchase history found.</p>
            )}
          </div>

          <div className="product-summary-card">
            <h3>📊 Product Summary</h3>
            {customer.productSummary && customer.productSummary.length > 0 ? (
              <div className="sales-table">
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
                    <span className="sold-qty">{product.totalQuantity} pcs</span>
                    <span>{product.transactions.length}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-data">No product summary available.</p>
            )}
          </div>

          <div className="sale-actions-card">
            <h3>⚡ Quick Actions</h3>
            <div className="action-buttons">
              <button 
                onClick={() => generatePDF(customer.sales, `${customer.customerName} Purchase History`, ["Date", "Product", "Model", "Quantity", "Notes"])}
                className="action-btn secondary"
              >
                📄 Download Customer Report
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (isLoading.today || isLoading.weekly || isLoading.daily || isLoading.outflows) {
    return (
      <div className="sales-reports-container">
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <p>Loading sales data...</p>
        </div>
      </div>
    )
  }

  if (currentView === "saleDetails" && selectedSale) {
    return <SaleDetailsView sale={selectedSale} onBack={goBackToMain} />
  }

  if (currentView === "customerDetails" && customerDetails) {
    return <CustomerDetailsView customer={customerDetails} onBack={goBackToMain} />
  }

  return (
    <div className="sales-reports-container">
      <div className="page-header">
        <h2>📊 Sales Reports</h2>
        <button onClick={navigateToStockOutflow} className="outflow-btn">
          📦 Back to Sales Entry
        </button>
      </div>

      <div className="sales-reports-section">
        <div className="tabs">
          <button className={`tab-btn ${activeTab === "today" ? "active" : ""}`} onClick={() => setActiveTab("today")}>
            Today's Sales
          </button>
          <button
            className={`tab-btn ${activeTab === "weekly" ? "active" : ""}`}
            onClick={() => setActiveTab("weekly")}
          >
            Weekly Sales
          </button>
          <button className={`tab-btn ${activeTab === "daily" ? "active" : ""}`} onClick={() => setActiveTab("daily")}>
            Daily Report
          </button>
          <button className={`tab-btn ${activeTab === "recent" ? "active" : ""}`} onClick={() => setActiveTab("recent")}>
            Recent Outflows
          </button>
        </div>

        <div className="report-actions">
          {activeTab !== "recent" && (
            <button
              onClick={
                activeTab === "today"
                  ? downloadTodaySalesPDF
                  : activeTab === "weekly"
                    ? downloadWeeklySalesPDF
                    : downloadDailyReportPDF
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
          )}
        </div>

        {activeTab === "today" ? (
          <div className="today-sales">
            <h3>📅 Today's Sales</h3>
            {todaySales.length > 0 ? (
              <div className="sales-table">
                <div className="table-header">
                  <span>Customer</span>
                  <span>Product</span>
                  <span>Model</span>
                  <span>Quantity Sold</span>
                </div>
                {todaySales.map((sale) => (
                  <div
                    key={sale._id}
                    className="table-row clickable-row"
                    onClick={() => handleSaleRowClick(sale, "today")}
                  >
                    <span className="clickable-customer" onClick={(e) => {
                      e.stopPropagation();
                      handleCustomerClick(sale.partyName);
                    }}>{sale.partyName}</span>
                    <span className="clickable-product">
                      {sale.companyName}
                      {sale.productDetails?.size && ` (Size: ${sale.productDetails.size})`}
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
                  <span>Customer</span>
                  <span>Product</span>
                  <span>Quantity Sold</span>
                </div>
                {weeklySales.map((sale) => (
                  <div
                    key={sale._id}
                    className="table-row clickable-row"
                    onClick={() => handleSaleRowClick(sale, "weekly")}
                  >
                    <span>{format(new Date(sale.date), "MMM dd")}</span>
                    <span className="clickable-customer" onClick={(e) => {
                      e.stopPropagation();
                      handleCustomerClick(sale.partyName);
                    }}>{sale.partyName}</span>
                    <span>{sale.companyName}</span>
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
        ) : activeTab === "daily" ? (
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
                    <span>{format(new Date(report.date), "MMM dd, yyyy")}</span>
                    <span>{report.totalSales} transactions</span>
                    <span className="sold-qty">{report.itemsSold} pcs</span>
                  </div>
                ))}
                <div className="table-footer">
                  <span>Total:</span>
                  <span>{dailySalesReport.reduce((sum, item) => sum + (item.totalSales || 0), 0)} transactions</span>
                  <span className="total-qty">
                    {dailySalesReport.reduce((sum, item) => sum + (item.itemsSold || 0), 0)} pcs
                  </span>
                </div>
              </div>
            ) : (
              <p className="no-data">No daily sales data available.</p>
            )}
          </div>
        ) : (
          <div className="recent-outflows-section">
            <h3>🔄 Recent Stock Reductions</h3>
            {recentOutflows.length > 0 ? (
              <div className="outflows-table">
                <div className="table-header">
                  <span>Customer</span>
                  <span>Product</span>
                  <span>Model</span>
                  <span>Qty Reduced</span>
                  <span>Time</span>
                </div>
                {recentOutflows.map((outflow) => (
                  <div key={outflow._id} className="table-row">
                    <span className="clickable-customer" onClick={() => handleCustomerClick(outflow.partyName)}>
                      {outflow.partyName}
                    </span>
                    <span>{outflow.companyName}</span>
                    <span>{outflow.modelNo}</span>
                    <span className="reduced-qty">-{outflow.quantity} pcs</span>
                    <span>{format(new Date(outflow.createdAt), "HH:mm")}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-data">No recent stock reductions.</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default SalesReports