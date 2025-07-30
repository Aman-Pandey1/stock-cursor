import React, { useEffect, useState } from 'react';
import API from '../utils/api';
import './ProductList.css';
import { useNavigate } from 'react-router-dom';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [dateFilter, setDateFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const navigate = useNavigate();

  const fetchProducts = async () => {
    try {
      let url = '/products';
      const params = new URLSearchParams();
      
      if (dateFilter) params.append('dateFilter', dateFilter);
      if (startDate && endDate) {
        params.append('startDate', startDate);
        params.append('endDate', endDate);
      }
      
      if (params.toString()) url += `?${params.toString()}`;
      
      const res = await API.get(url);
      setProducts(res.data);
      setSelectedProducts([]); // Reset selection when products change
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const deleteProduct = async (id) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this product?');
    if (!confirmDelete) return;

    try {
      await API.delete(`/products/${id}`);
      alert('✅ Product deleted successfully');
      fetchProducts();
    } catch (error) {
      alert('❌ Failed to delete product');
      console.error(error);
    }
  };

  const toggleSelectProduct = (id) => {
    setSelectedProducts(prev => 
      prev.includes(id) 
        ? prev.filter(productId => productId !== id)
        : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedProducts.length === products.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(products.map(p => p._id));
    }
  };

  const exportToPDF = async () => {
    try {
      let url = '/products/export/pdf';
      if (selectedProducts.length > 0) {
        // For selected products, we'll handle it client-side
        const selected = products.filter(p => selectedProducts.includes(p._id));
        generatePDF(selected);
        return;
      }
      
      window.open(url, '_blank');
    } catch (error) {
      console.error('Error exporting to PDF:', error);
    }
  };


const generatePDF = (productsToExport) => {
  const doc = new jsPDF();
  doc.setFontSize(18);
  doc.text('Product Inventory', 14, 20);

  let y = 30;
  productsToExport.forEach((product, index) => {
    doc.setFontSize(12);
    doc.text(
      `${index + 1}. ${product.companyName} - ${product.modelNo}`,
      14,
      y
    );
    y += 7;
    doc.text(`SKU: ${product.sku} | Qty: ${product.quantity} | Alert: ${product.alertQty}`, 14, y);
    y += 10;
  });

  doc.save('products.pdf');
};
  const exportToExcel = async () => {
    try {
      let dataToExport;
      
      if (selectedProducts.length > 0) {
        dataToExport = products.filter(p => selectedProducts.includes(p._id));
      } else {
        const res = await API.get('/products');
        dataToExport = res.data;
      }
      
      const worksheet = XLSX.utils.json_to_sheet(dataToExport.map(p => ({
        Company: p.companyName,
        Model: p.modelNo,
        SKU: p.sku,
        Size: p.size,
        Color: p.color,
        Quantity: p.quantity,
        'Alert Qty': p.alertQty,
        'Created At': new Date(p.createdAt).toLocaleDateString()
      })));
      
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Products');
      XLSX.writeFile(workbook, 'products.xlsx');
    } catch (error) {
      console.error('Error exporting to Excel:', error);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [dateFilter, startDate, endDate]);

  return (
    <div className="product-list-container">
      <h2 className="product-list-heading">📦 Product Inventory</h2>
      
      {/* Filter Controls */}
      <div className="filter-controls">
        <div className="filter-group">
          <label>Date Filter:</label>
          <select 
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          >
            <option value="">All Products</option>
            <option value="today">Today</option>
            <option value="this-week">This Week</option>
          </select>
        </div>
        
        <div className="filter-group">
          <label>From:</label>
          <input 
            type="date" 
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        
        <div className="filter-group">
          <label>To:</label>
          <input 
            type="date" 
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
        
        <button 
          className="filter-button"
          onClick={() => {
            setDateFilter('');
            setStartDate('');
            setEndDate('');
          }}
        >
          Clear Filters
        </button>
      </div>
      
      {/* Export Controls */}
      <div className="export-controls">
        <button 
          className="export-button"
          onClick={exportToPDF}
          disabled={products.length === 0}
        >
          Export to PDF
        </button>
        
        <button 
          className="export-button"
          onClick={exportToExcel}
          disabled={products.length === 0}
        >
          Export to Excel
        </button>
      </div>
      
      <div className="product-table-wrapper">
        <table className="product-table">
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  checked={selectedProducts.length === products.length && products.length > 0}
                  onChange={toggleSelectAll}
                />
              </th>
              <th>Image</th>
              <th>Company</th>
              <th>Model</th>
              <th>SKU</th>
              <th>Qty</th>
              <th>Alert Qty</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p._id} className={selectedProducts.includes(p._id) ? 'selected-row' : ''}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedProducts.includes(p._id)}
                    onChange={() => toggleSelectProduct(p._id)}
                  />
                </td>
                <td>
                  <img 
                    src={p.image?.url || '/placeholder.jpg'} 
                    alt="product" 
                    className="product-img" 
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/placeholder.jpg';
                    }}
                  />
                </td>
                <td>{p.companyName}</td>
                <td>{p.modelNo}</td>
                <td>{p.sku}</td>
                <td className={p.quantity <= p.alertQty ? 'low-stock' : ''}>
                  {p.quantity}
                  {p.quantity <= p.alertQty && <span className="stock-warning">!</span>}
                </td>
                <td>{p.alertQty}</td>
                <td className="action-buttons">
                  <button
                    className="btn edit-btn"
                    onClick={() => navigate(`/edit-product/${p._id}`)}
                  >
                    ✏️ Edit
                  </button>
                  <button
                    className="btn delete-btn"
                    onClick={() => deleteProduct(p._id)}
                  >
                    🗑️ Delete
                  </button>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td colSpan="8" className="no-products">No products found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProductList;