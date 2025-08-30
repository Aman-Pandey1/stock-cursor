import React, { useEffect, useState } from 'react';
import API from '../utils/api';
import './ProductList.css';
import { useNavigate } from 'react-router-dom';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import defaultImg from '../assest/banner.webp';

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [dateFilter, setDateFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const navigate = useNavigate();

  // Calculate pagination values
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredProducts.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

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
      setFilteredProducts(res.data);
      setSelectedProducts([]);
      setCurrentPage(1); // Reset to first page when fetching new data
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      await fetchProducts();
      return;
    }

    setIsSearching(true);
    try {
      const filtered = products.filter(product => {
        return (
          product.companyName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.modelNo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.invoiceNo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.size?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.color?.toLowerCase().includes(searchQuery.toLowerCase())
        );
      });
      setFilteredProducts(filtered);
      setCurrentPage(1); // Reset to first page when searching
    } catch (error) {
      console.error('Error searching products:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const deleteProduct = async (id) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this product?');
    if (!confirmDelete) return;

    try {
      await API.delete(`/products/${id}`);
      alert('✅ Product deleted successfully');
      await fetchProducts();
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
    if (selectedProducts.length === currentItems.length && currentItems.length > 0) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(currentItems.map(p => p._id));
    }
  };

  const exportToPDF = async () => {
    try {
      if (filteredProducts.length === 0) {
        alert('No products to export');
        return;
      }

      let url = '/products/export/pdf';
      const params = new URLSearchParams();
      
      if (dateFilter) params.append('dateFilter', dateFilter);
      if (startDate && endDate) {
        params.append('startDate', startDate);
        params.append('endDate', endDate);
      }
      
      if (selectedProducts.length > 0) {
        // Use the selected products export endpoint
        const response = await API.post('/products/export/selected/pdf', {
          ids: selectedProducts
        }, {
          responseType: 'blob' // Important for handling binary data
        });
        
        // Create a download link for the blob
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `selected-products-${new Date().toISOString().slice(0,10)}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
      } else {
        // Use the filtered products export endpoint
        if (params.toString()) url += `?${params.toString()}`;
        
        const response = await API.get(url, {
          responseType: 'blob' // Important for handling binary data
        });
        
        // Create a download link for the blob
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `products-${new Date().toISOString().slice(0,10)}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
      }
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      alert('Failed to export PDF. Please try again.');
    }
  };

  const exportToExcel = async () => {
    try {
      let dataToExport;
      
      if (selectedProducts.length > 0) {
        dataToExport = filteredProducts.filter(p => selectedProducts.includes(p._id));
      } else {
        dataToExport = filteredProducts;
      }
      
      if (dataToExport.length === 0) {
        alert('No products to export');
        return;
      }

      const worksheet = XLSX.utils.json_to_sheet(dataToExport.map(p => ({
        'No.': dataToExport.indexOf(p) + 1,
        'Company': p.companyName,
        'Model': p.modelNo,
        'Invoice No': p.invoiceNo,
        'Invoice Date': new Date(p.invoiceDate).toLocaleDateString(),
        'Size': p.size || '-',
        'Color': p.color || '-',
        'Quantity': p.quantity,
        'Alert Qty': p.alertQty,
        'Created At': new Date(p.createdAt).toLocaleDateString()
      })));
      
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Products');
      XLSX.writeFile(workbook, `products_${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      alert('Failed to generate Excel file. Please try again.');
    }
  };

  // Pagination functions
  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };
  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch();
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    fetchProducts();
  }, [dateFilter, startDate, endDate]);

  // Generate page numbers for pagination
  const pageNumbers = [];
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

  return (
    <div className="product-list-container">
      <div className="product-list-header">
        <h2 className="product-list-heading">📦 Product Inventory</h2>
      </div>

      <div className="search-container">
        <div className="search-bar-wrapper">
          <input
            type="text"
            placeholder="Search by company, model, invoice no, size or color..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          <button 
            className="search-button"
            onClick={handleSearch}
            disabled={isSearching}
          >
            {isSearching ? 'Searching...' : 'Search'}
          </button>
        </div>
      </div>
      
      <div className="filter-controls">
        <div className="filter-group date-filter-group">
          <label>Date Range:</label>
          <div className="date-picker-container">
            <select 
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value);
                setStartDate('');
                setEndDate('');
              }}
              className="date-filter-select"
            >
              <option value="">All Time</option>
              <option value="today">Today</option>
              <option value="this-week">This Week</option>
              <option value="custom">Custom Range</option>
            </select>
            
            {dateFilter === 'custom' && (
              <div className="custom-date-range">
                <input 
                  type="date" 
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="date-input"
                />
                <span className="date-separator">to</span>
                <input 
                  type="date" 
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="date-input"
                />
              </div>
            )}
          </div>
        </div>
        
        <div className="items-per-page">
          <label>Items per page: </label>
          <select 
            value={itemsPerPage} 
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
          >
            <option value="5">5</option>
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="50">50</option>
          </select>
        </div>
        
        <button 
          className="filter-button"
          onClick={() => {
            setDateFilter('');
            setStartDate('');
            setEndDate('');
            setSearchQuery('');
          }}
        >
          Clear Filters
        </button>
      </div>
      
      <div className="export-controls">
        <button 
          className="export-button"
          onClick={exportToPDF}
          disabled={filteredProducts.length === 0}
        >
          Export to PDF
        </button>
        
        <button 
          className="export-button"
          onClick={exportToExcel}
          disabled={filteredProducts.length === 0}
        >
          Export to Excel
        </button>
        
        {selectedProducts.length > 0 && (
          <span className="selected-count">
            {selectedProducts.length} product(s) selected
          </span>
        )}
      </div>
      
      <div className="product-table-wrapper">
        <table className="product-table">
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  checked={selectedProducts.length === currentItems.length && currentItems.length > 0}
                  onChange={toggleSelectAll}
                />
              </th>
              <th>Image</th>
              <th>Company</th>
              <th>Model</th>
              <th>Invoice No</th>
              <th>Invoice Date</th>
              <th>Size</th>
              <th>Color</th>
              <th>Qty</th>
              <th>Alert Qty</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.map((p) => (
              <tr key={p._id} className={selectedProducts.includes(p._id) ? 'selected-row' : ''}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedProducts.includes(p._id)}
                    onChange={() => toggleSelectProduct(p._id)}
                  />
                </td>
                <td>
                  {p.image?.url ? (
                    <img
                      src={p.image.url}
                      alt="product"
                      className="product-img"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = defaultImg;
                      }}
                    />
                  ) : (
                    <img
                      src={defaultImg}
                      alt="no product"
                      className="product-img"
                    />
                  )}
                </td>
                <td>{p.companyName}</td>
                <td>{p.modelNo}</td>
                <td>{p.invoiceNo}</td>
                <td>{new Date(p.invoiceDate).toLocaleDateString()}</td>
                <td>{p.size || '-'}</td>
                <td>{p.color || '-'}</td>
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
            {currentItems.length === 0 && (
              <tr>
                <td colSpan="11" className="no-products">
                  {searchQuery ? 'No products match your search' : 'No products found'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {filteredProducts.length > itemsPerPage && (
        <div className="pagination-controls">
          <button 
            className="pagination-btn"
            onClick={prevPage}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          
          {pageNumbers.map(number => (
            <button
              key={number}
              className={`pagination-btn ${currentPage === number ? 'active' : ''}`}
              onClick={() => paginate(number)}
            >
              {number}
            </button>
          ))}
          
          <button 
            className="pagination-btn"
            onClick={nextPage}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      )}
      
      <div className="pagination-info">
        Showing {currentItems.length} of {filteredProducts.length} products
        {filteredProducts.length !== products.length && ` (filtered from ${products.length} total)`}
      </div>
    </div>
  );
};

export default ProductList;