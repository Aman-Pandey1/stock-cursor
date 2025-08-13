import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../utils/api';
import './EditProduct.css';

const EditProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState({
    companyName: '',
    modelNo: '',
    invoiceNo: '',
    invoiceDate: '',
    size: '',
    color: '',
    design: '',
    type: '',
    quantity: '',
    alertQty: '',
    image: {
      url: '',
      public_id: ''
    }
  });
  const [newImage, setNewImage] = useState(null);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await API.get(`/products/${id}`);
        setProduct({
          ...res.data,
          invoiceDate: res.data.invoiceDate.split('T')[0] // Format date for input
        });
      } catch (error) {
        console.error('Error fetching product:', error);
      }
    };

    fetchProduct();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProduct((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setNewImage(file);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      if (newImage) {
        const formData = new FormData();
        formData.append('file', newImage);
        formData.append('upload_preset', 'ml_default');

        const cloudRes = await fetch(
          'https://api.cloudinary.com/v1_1/dqibmkvib/image/upload',
          {
            method: 'POST',
            body: formData
          }
        );

        if (!cloudRes.ok) {
          const err = await cloudRes.json();
          throw new Error(err.message || 'Cloudinary upload failed');
        }

        const cloudData = await cloudRes.json();

        product.image = {
          url: cloudData.secure_url,
          public_id: cloudData.public_id
        };
      }

      const updatedProduct = {
        ...product,
        quantity: Number(product.quantity),
        alertQty: Number(product.alertQty),
        invoiceDate: new Date(product.invoiceDate).toISOString()
      };

      await API.put(`/products/${id}`, updatedProduct);
      alert('Product updated successfully!');
      navigate('/product-list');
    } catch (error) {
      console.error('Error updating product:', error);
      alert(`Error updating product: ${error.message}`);
    }
  };

  return (
    <div className="edit-product-container">
      <h2>Edit Product</h2>
      <form onSubmit={handleUpdate} className="edit-product-form">
        <div className="form-row">
          <div className="form-group">
            <label>Company Name</label>
            <input type="text" name="companyName" value={product.companyName} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Model No</label>
            <input type="text" name="modelNo" value={product.modelNo} onChange={handleChange} required />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Invoice No</label>
            <input type="text" name="invoiceNo" value={product.invoiceNo} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Invoice Date</label>
            <input type="date" name="invoiceDate" value={product.invoiceDate} onChange={handleChange} required />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Size</label>
            <input type="text" name="size" value={product.size} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Color</label>
            <input type="text" name="color" value={product.color} onChange={handleChange} />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Design</label>
            <input type="text" name="design" value={product.design} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Type</label>
            <input type="text" name="type" value={product.type} onChange={handleChange} />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Quantity</label>
            <input type="number" name="quantity" value={product.quantity} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Alert Quantity</label>
            <input type="number" name="alertQty" value={product.alertQty} onChange={handleChange} required />
          </div>
        </div>

        <div className="form-group">
          <label>Current Image</label>
          {product.image?.url && (
            <div className="edit-img-preview-container">
              <img src={product.image.url} alt="Current Product" className="edit-img-preview" />
            </div>
          )}
        </div>

        <div className="form-group">
          <label>Upload New Image (optional)</label>
          <input type="file" accept="image/*" onChange={handleImageChange} />
        </div>

        <div className="form-actions">
          <button type="button" className="cancel-btn" onClick={() => navigate('/product-list')}>
            Cancel
          </button>
          <button type="submit" className="update-btn">
            Update Product
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditProduct;