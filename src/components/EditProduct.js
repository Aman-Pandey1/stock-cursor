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
    sku: '',
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
        setProduct(res.data);
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
        alertQty: Number(product.alertQty)
      };

      await API.put(`/products/${id}`, updatedProduct);
      navigate('/product-list');
    } catch (error) {
      console.error('Error updating product:', error);
    }
  };

  return (
    <div className="edit-product-container">
      <h2>Edit Product</h2>
      <form onSubmit={handleUpdate} className="edit-product-form">
        <input type="text" name="companyName" value={product.companyName} onChange={handleChange} placeholder="Company Name" required />
        <input type="text" name="modelNo" value={product.modelNo} onChange={handleChange} placeholder="Model No" required />
        <input type="text" name="sku" value={product.sku} onChange={handleChange} placeholder="SKU" required />
        <input type="text" name="size" value={product.size} onChange={handleChange} placeholder="Size" />
        <input type="text" name="color" value={product.color} onChange={handleChange} placeholder="Color" />
        <input type="text" name="design" value={product.design} onChange={handleChange} placeholder="Design" />
        <input type="text" name="type" value={product.type} onChange={handleChange} placeholder="Type" />
        <input type="number" name="quantity" value={product.quantity} onChange={handleChange} placeholder="Quantity" required />
        <input type="number" name="alertQty" value={product.alertQty} onChange={handleChange} placeholder="Alert Quantity" required />

        <label>Upload New Image (optional):</label>
        <input type="file" accept="image/*" onChange={handleImageChange} />

        {product.image?.url && (
          <div className="edit-img-preview-container">
            <img src={product.image.url} alt="Current Product" className="edit-img-preview" />
          </div>
        )}

        <button type="submit">Update Product</button>
      </form>
    </div>
  );
};

export default EditProduct;
