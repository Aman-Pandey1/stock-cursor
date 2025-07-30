import React, { useState } from 'react';
import API from '../utils/api';
import './AddProduct.css';

const AddProduct = () => {
  const [data, setData] = useState({
    companyName: '',
    modelNo: '',
    sku: '',
    size: '',
    color: '',
    design: '',
    type: '',
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
  if (!image) return alert("Please upload an image");

  setLoading(true);

  try {
    // 1. Upload image to Cloudinary
    const formData = new FormData();
    formData.append("file", image);
    formData.append("upload_preset", "ml_default"); // Make sure this matches your Cloudinary preset
    
    // Add timestamp and signature if needed (for unsigned uploads)
    // formData.append("timestamp", (Date.now() / 1000) | 0);
    // formData.append("signature", yourSignature); 

    const cloudRes = await fetch(
      `https://api.cloudinary.com/v1_1/dqibmkvib/image/upload`, // Replace YOUR_CLOUD_NAME
      {
        method: "POST",
        body: formData,
      }
    );

    if (!cloudRes.ok) {
      const errorData = await cloudRes.json();
      throw new Error(errorData.message || "Failed to upload image");
    }

    const cloudData = await cloudRes.json();

    // 2. Prepare payload for your backend
    const payload = {
      companyName: data.companyName,
      modelNo: data.modelNo,
      sku: data.sku,
      quantity: Number(data.quantity),
      alertQty: Number(data.alertQty),
      imageUrl: cloudData.secure_url,
      publicId: cloudData.public_id,
      // Add other fields your backend expects
      size: data.size,
      color: data.color,
      design: data.design,
      type: data.type
    };

    // 3. Send to your backend
    await API.post("/products/create", payload);

    alert("✅ Product added successfully!");
    // Reset form
    setData({
      companyName: '',
      modelNo: '',
      sku: '',
      size: '',
      color: '',
      design: '',
      type: '',
      quantity: '',
      alertQty: '',
    });
    setImage(null);
  } catch (error) {
    console.error("Error:", error);
    alert(`❌ Error: ${error.message}`);
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="add-product-container">
      <h2 className="add-product-title">Add Product</h2>
      <div className="form-grid">
        <input className="form-input" name="companyName" placeholder="Company Name" value={data.companyName} onChange={handleChange} />
        <input className="form-input" name="modelNo" placeholder="Model Number" value={data.modelNo} onChange={handleChange} />
        <input className="form-input" name="sku" placeholder="SKU" value={data.sku} onChange={handleChange} />
        <input className="form-input" name="size" placeholder="Size" value={data.size} onChange={handleChange} />
        <input className="form-input" name="color" placeholder="Color" value={data.color} onChange={handleChange} />
        <input className="form-input" name="design" placeholder="Design" value={data.design} onChange={handleChange} />
        <input className="form-input" name="type" placeholder="Type" value={data.type} onChange={handleChange} />
        <input className="form-input" name="quantity" type="number" placeholder="Total Quantity in Stock" value={data.quantity} onChange={handleChange} />
        <input className="form-input" name="alertQty" type="number" placeholder="Minimum Quantity Before Alert" value={data.alertQty} onChange={handleChange} />
        <input type="file" className="file-input" onChange={(e) => setImage(e.target.files[0])} />
        <button className="submit-btn" onClick={handleSubmit} disabled={loading}>
          {loading ? 'Uploading...' : 'Add Product'}
        </button>
      </div>
    </div>
  );
};

export default AddProduct;
