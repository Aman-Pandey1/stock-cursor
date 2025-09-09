"use client"

import { useState, useEffect, useRef } from "react"
import API from "../utils/api"
import "./PurchaseManagement.css"
import { format } from "date-fns"
import { useNavigate } from "react-router-dom"

const PurchaseManagement = () => {
  const [allProducts, setAllProducts] = useState([])
  const [products, setProducts] = useState([])
  const [selectedProducts, setSelectedProducts] = useState([])
  const [currentSupplierName, setCurrentSupplierName] = useState("")
  const [currentDate, setCurrentDate] = useState(format(new Date(), "yyyy-MM-dd"))
  const [currentNotes, setCurrentNotes] = useState("")
  const [message, setMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState({
    products: false,
    allProducts: false,
  })
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [showSearchResults, setShowSearchResults] = useState(false)
  const searchRef = useRef(null)
  const navigate = useNavigate()

  const addProductToCart = (product, quantity) => {
    const existingIndex = selectedProducts.findIndex((p) => p._id === product._id)

    if (existingIndex >= 0) {
      const updatedProducts = [...selectedProducts]
      updatedProducts[existingIndex].quantity = quantity
      setSelectedProducts(updatedProducts)
      setMessage(`✅ Updated quantity for ${product.companyName} - ${product.modelNo}`)
    } else {
      const newProduct = {
        ...product,
        quantity: quantity,
        supplierName: currentSupplierName,
        date: currentDate,
        notes: currentNotes,
      }
      setSelectedProducts([...selectedProducts, newProduct])
      setMessage(`✅ Added ${product.companyName} - ${product.modelNo} to purchase list`)
    }
    setShowSearchResults(false)
  }

  const removeProductFromCart = (productId) => {
    setSelectedProducts(selectedProducts.filter((p) => p._id !== productId))
    setMessage("🗑️ Product removed from purchase list")
  }

  const getTotalItemsInCart = () => {
    return selectedProducts.reduce((total, product) => total + product.quantity, 0)
  }

  useEffect(() => {
    fetchAllProducts()
    
    // Add click outside listener to close search results
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchResults(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const fetchAllProducts = async () => {
    setIsLoading((prev) => ({ ...prev, allProducts: true }))
    try {
      const res = await API.get("/products")
      setAllProducts(res.data)
    } catch (err) {
      console.error("Error fetching all products:", err)
      setMessage("❌ Error fetching products")
    } finally {
      setIsLoading((prev) => ({ ...prev, allProducts: false }))
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch()
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setProducts([])
      setShowSearchResults(false)
      return
    }

    setIsSearching(true)
    try {
      const filtered = allProducts.filter((product) => {
        return (
          product.companyName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.modelNo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.invoiceNo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.size?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.color?.toLowerCase().includes(searchQuery.toLowerCase())
        )
      })

      setProducts(filtered)
      setShowSearchResults(true)
    } catch (err) {
      console.error("Error searching products:", err)
      setMessage("❌ Error searching products")
      setProducts([])
    } finally {
      setIsSearching(false)
    }
  }

// In handleBatchAddStock function, replace the API calls with:
const handleBatchAddStock = async () => {
  if (selectedProducts.length === 0) {
    setMessage("⚠️ Please add products to purchase list first.");
    return;
  }

  if (!currentSupplierName.trim()) {
    setMessage("⚠️ Please enter customer name.");
    return;
  }

  for (const product of selectedProducts) {
    if (product.quantity <= 0) {
      setMessage(`⚠️ Invalid quantity for ${product.companyName} - ${product.modelNo}`);
      return;
    }
  }

  setIsSubmitting(true);
  setMessage("🔄 Processing purchase...");

  try {
    // First update stock for all products
    const stockPromises = selectedProducts.map((product) =>
      API.put(`/products/${product._id}/add-stock`, {
        quantity: product.quantity,
      })
    );

    // Then create purchase records
    const purchasePromises = selectedProducts.map((product) =>
      API.post("/purchases", {
        productId: product._id,
        companyName: product.companyName,
        modelNo: product.modelNo,
        quantity: product.quantity,
        supplierName: currentSupplierName,
        date: currentDate,
        notes: currentNotes,
      })
    );

    // Execute all promises
    await Promise.all([...stockPromises, ...purchasePromises]);

    setMessage(`✅ Successfully processed ${selectedProducts.length} products for ${currentSupplierName}`);

    setSelectedProducts([]);
    setCurrentSupplierName("");
    setCurrentDate(format(new Date(), "yyyy-MM-dd"));
    setCurrentNotes("");
    setSearchQuery("");
    setProducts([]);
    setShowSearchResults(false);

    fetchAllProducts();
  } catch (err) {
    console.error("Purchase error:", err);
    const errorMsg = err.response?.data?.message || err.message || "Error processing purchase";
    setMessage(`❌ ${errorMsg}`);
  } finally {
    setIsSubmitting(false);
  }
};

  const viewProductDetails = (productId) => {
    navigate(`/product-details/${productId}`)
  }

  if (isLoading.allProducts) {
    return (
      <div className="purchase-management-container">
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <p>Loading data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="purchase-management-container">
      <div className="page-header">
        <h2><i className="fas fa-cart-arrow-down"></i> Purchase Management System</h2>
      </div>

      <div className="purchase-entry-section">
        <h3><i className="fas fa-plus-circle"></i> Add New Purchase</h3>

        <div className="supplier-info-section">
          <h4><i className="fas fa-user"></i> Customer Information</h4>
          <div className="supplier-form">
            <input
              type="text"
              placeholder="Customer Name (optional)"
              value={currentSupplierName}
              onChange={(e) => setCurrentSupplierName(e.target.value)}
              className="supplier-input"
              
            />
            <input
              type="date"
              value={currentDate}
              onChange={(e) => setCurrentDate(e.target.value)}
              max={format(new Date(), "yyyy-MM-dd")}
              className="date-input"
            />
            <input
              type="text"
              placeholder="Notes (optional)"
              value={currentNotes}
              onChange={(e) => setCurrentNotes(e.target.value)}
              className="notes-input"
            />
          </div>
        </div>

        {selectedProducts.length > 0 && (
          <div className="purchase-list">
            <h4>
              <i className="fas fa-clipboard-list"></i> Purchase List ({selectedProducts.length} items, {getTotalItemsInCart()} total qty)
            </h4>
            <div className="purchase-items">
              {selectedProducts.map((product) => (
                <div key={product._id} className="purchase-item">
                  <div className="purchase-item-info">
                    <strong>{product.companyName}</strong> - {product.modelNo}
                    <span className="purchase-item-details">
                      Qty: {product.quantity}
                    </span>
                  </div>
                  <button onClick={() => removeProductFromCart(product._id)} className="remove-btn">
                    <i className="fas fa-times"></i> Remove
                  </button>
                </div>
              ))}
            </div>
            <div className="purchase-actions">
              <button
                onClick={handleBatchAddStock}
                disabled={isSubmitting || !currentSupplierName.trim()}
                className="process-purchase-btn"
              >
                {isSubmitting ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-check-circle"></i>}
                {isSubmitting ? "Processing..." : `Complete Purchase for ${currentSupplierName || "Customer"}`}
              </button>
              <button onClick={() => setSelectedProducts([])} className="clear-purchase-btn">
                <i className="fas fa-trash"></i> Clear List
              </button>
            </div>
          </div>
        )}

        <div className="search-container" ref={searchRef}>
          <h4><i className="fas fa-search"></i> Search & Add Products</h4>
          <div className="search-bar-wrapper">
            <input
              type="text"
              placeholder="Search by Product, model name"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setShowSearchResults(true)
              }}
              onFocus={() => setShowSearchResults(true)}
              className="search-input"
            />
            <button className="search-button" onClick={handleSearch} disabled={isSearching}>
              {isSearching ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-search"></i>}
              {isSearching ? "Searching..." : "Search"}
            </button>
          </div>

          {showSearchResults && products.length > 0 && (
            <div className="search-results-dropdown">
              <div className="search-results-header">
                <span><i className="fas fa-list"></i> Found {products.length} products</span>
                <button 
                  className="close-results-btn"
                  onClick={() => setShowSearchResults(false)}
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
              <div className="search-results-list">
                {products.map((p) => {
                  const isExactMatch =
                    p.companyName?.toLowerCase() === searchQuery.toLowerCase() ||
                    p.modelNo?.toLowerCase() === searchQuery.toLowerCase()

                  const isInPurchaseList = selectedProducts.some((sp) => sp._id === p._id)

                  return (
                    <div
                      key={p._id}
                      className={`search-result-item ${isInPurchaseList ? "in-purchase-list" : ""} ${isExactMatch ? "exact-match" : ""}`}
                    >
                      <div className="search-result-info">
                        <div className="search-result-main">
                          <strong>{p.companyName}</strong> - {p.modelNo}
                          {p.invoiceNo && <span className="invoice-no"> (Invoice: {p.invoiceNo})</span>}
                        </div>
                        <div className="search-result-details">
                          {p.size && <span><i className="fas fa-ruler"></i> Size: {p.size}</span>}
                          {p.color && <span><i className="fas fa-palette"></i> Color: {p.color}</span>}
                          <span className="product-stock"><i className="fas fa-boxes"></i> Current Stock: {p.quantity} pcs</span>
                        </div>
                        {isExactMatch && <span className="exact-match-tag">Exact Match</span>}
                        {isInPurchaseList && <span className="in-purchase-list-tag">In List</span>}
                      </div>
                      <div className="search-result-actions">
                        <div className="input-with-icon">
                          <i className="fas fa-cubes"></i>
                          <input
                            type="number"
                            min="1"
                            placeholder="Qty"
                            className="qty-input"
                            onKeyPress={(e) => {
                              if (e.key === "Enter") {
                                const qty = Number.parseInt(e.target.value)
                                if (qty > 0) {
                                  addProductToCart(p, qty)
                                  e.target.value = ""
                                }
                              }
                            }}
                          />
                        </div>
                        <button
                          onClick={(e) => {
                            const qtyInput = e.target.parentElement.querySelector(".qty-input")
                            const qty = Number.parseInt(qtyInput.value)
                            if (qty > 0) {
                              addProductToCart(p, qty)
                              qtyInput.value = ""
                            } else {
                              setMessage("⚠️ Please enter valid quantity")
                            }
                          }}
                          className="add-to-purchase-btn"
                        >
                          <i className="fas fa-cart-plus"></i> {isInPurchaseList ? "Update" : "Add"}
                        </button>
                        <button onClick={() => viewProductDetails(p._id)} className="view-details-btn">
                          <i className="fas fa-eye"></i>
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {showSearchResults && searchQuery && products.length === 0 && !isSearching && (
            <div className="search-results-dropdown">
              <div className="no-search-results">
                <p><i className="fas fa-search"></i> No products found for "{searchQuery}"</p>
                <button 
                  className="create-new-product-btn"
                  onClick={() => navigate("/add-product")}
                >
                  <i className="fas fa-plus"></i> Create New Product
                </button>
              </div>
            </div>
          )}
        </div>

        {message && (
          <p
            className={`message ${message.startsWith("❌") ? "error" : message.startsWith("⚠️") ? "warning" : "success"}`}
          >
            {message.startsWith("❌") && <i className="fas fa-exclamation-circle"></i>}
            {message.startsWith("⚠️") && <i className="fas fa-exclamation-triangle"></i>}
            {message.startsWith("✅") && <i className="fas fa-check-circle"></i>}
            {message}
          </p>
        )}
      </div>
    </div>
  )
}

export default PurchaseManagement