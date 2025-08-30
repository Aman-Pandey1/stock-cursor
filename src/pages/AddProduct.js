import React, { useState } from 'react';
import API from '../utils/api';
import './AddProduct.css';

const AddProduct = () => {
  const [data, setData] = useState({
    companyName: '',
    modelNo: '',
    invoiceNo: '',
    invoiceDate: '',
    size: '',
    quantity: '',
    alertQty: '',
  });

  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async () => {
    // Validation
    if (!data.invoiceDate) return alert("Please select invoice date");
    if (!data.modelNo.trim()) return alert("Model Number is required");
    if (!data.quantity || data.quantity <= 0) return alert("Please enter a valid quantity");
    if (!data.alertQty || data.alertQty <= 0) return alert("Please enter a valid alert quantity");
    
    setLoading(true);

    try {
      let imageData = null;

      // If image is provided, upload to Cloudinary
      if (image) {
        const formData = new FormData();
        formData.append("file", image);
        formData.append("upload_preset", "ml_default");

        const cloudRes = await fetch(
          `https://api.cloudinary.com/v1_1/dqibmkvib/image/upload`,
          { method: "POST", body: formData }
        );
        const cloudData = await cloudRes.json();

        imageData = {
          url: cloudData.secure_url,
          public_id: cloudData.public_id,
        };
      }

      // Prepare payload
      const payload = {
        companyName: data.companyName,
        modelNo: data.modelNo || '',
        invoiceNo: data.invoiceNo || '',
        invoiceDate: data.invoiceDate,
        size: data.size,
        quantity: Number(data.quantity),
        alertQty: Number(data.alertQty),
      };

      if (imageData) payload.image = imageData;

      // Send to backend
      await API.post("/products", payload, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      alert("Product added successfully!");
      
      // Reset form
      setData({
        companyName: '',
        modelNo: '',
        invoiceNo: '',
        invoiceDate: '',
        size: '',
        quantity: '',
        alertQty: '',
      });
      setImage(null);

    } catch (error) {
      console.error("Error:", error);
      alert(`Error: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-product-container">
      <h2 className="add-product-title">Add Product</h2>
      <div className="form-grid">
        <input 
          className="form-input" 
          name="companyName" 
          placeholder="Company Name" 
          value={data.companyName} 
          onChange={handleChange} 
        />
        <input
          className="form-input"
          name="modelNo"
          placeholder="Model Number"
          value={data.modelNo}
          onChange={handleChange}
          required
        />
        <input
          className="form-input"
          name="invoiceNo"
          placeholder="Invoice Number"
          value={data.invoiceNo}
          onChange={handleChange}
        />
        <input 
          className="form-input" 
          type="date" 
          name="invoiceDate" 
          placeholder="Invoice Date" 
          value={data.invoiceDate} 
          onChange={handleChange} 
        />
        <input 
          className="form-input" 
          name="size" 
          placeholder="Size" 
          value={data.size} 
          onChange={handleChange} 
        />
        <input 
          className="form-input" 
          name="quantity" 
          type="number" 
          placeholder="Total Quantity in Stock" 
          value={data.quantity} 
          onChange={handleChange} 
          min="1"
        />
        <input 
          className="form-input" 
          name="alertQty" 
          type="number" 
          placeholder="Minimum Quantity Before Alert" 
          value={data.alertQty} 
          onChange={handleChange} 
          min="1"
        />
        <input 
          type="file" 
          className="file-input" 
          onChange={(e) => setImage(e.target.files[0])} 
        />
        <button 
          className="submit-btn" 
          onClick={handleSubmit} 
          disabled={loading}
        >
          {loading ? 'Uploading...' : 'Add Product'}
        </button>
      </div>
    </div>
  );
};

export default AddProduct;