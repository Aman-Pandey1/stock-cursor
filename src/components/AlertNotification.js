import React, { useEffect, useState, useRef } from 'react';
import API from '../utils/api';
import { toast } from 'react-toastify';
import './AlertNotification.css';
import { FaWhatsapp } from 'react-icons/fa';

const AlertNotification = () => {
  const [alerts, setAlerts] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const hasShownToast = useRef(false);

  const fetchLowStockProducts = async () => {
    try {
      const res = await API.get('/products/low-stock');
      setAlerts(res.data);
      
      if (res.data.length > 0 && !hasShownToast.current) {
        toast.warning(
          `${res.data.length} product(s) have low stock!`,
          { autoClose: 5000 }
        );
        hasShownToast.current = true;
      }
    } catch (error) {
      console.error('Error fetching low stock alerts:', error);
    }
  };

  const sendWhatsAppAlert = (product) => {
    const phoneNumber = '7250519404'; // Replace with your desired number
    const message = `Low Stock Alert!\n\n*Product:* ${product.companyName} - ${product.modelNo}\n*Current Qty:* ${product.quantity}\n*Alert Qty:* ${product.alertQty}\n*SKU:* ${product.sku}\n\nPlease restock soon!`;
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank');
  };

  useEffect(() => {
    fetchLowStockProducts();
    const interval = setInterval(fetchLowStockProducts, 2000);
    return () => clearInterval(interval);
  }, []);

  if (alerts.length === 0) return null;

  return (
    <div className={`alert-notification ${isOpen ? 'open' : ''}`}>
      <div className="alert-header" onClick={() => setIsOpen(!isOpen)}>
        <span className="alert-badge">{alerts.length}</span>
        <span>Low Stock Alerts</span>
        <span className="toggle-icon">{isOpen ? '▲' : '▼'}</span>
      </div>
      {isOpen && (
        <div className="alert-body">
          {alerts.map((product) => (
            <div key={product._id} className="alert-item">
              {product.imageUrl && (
                <img 
                  src={product.imageUrl} 
                  alt={product.modelNo} 
                  className="alert-product-img" 
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/placeholder.jpg';
                  }}
                />
              )}
              <div className="alert-details">
                <span className="alert-product-name">{product.companyName} - {product.modelNo}</span>
                <span className="alert-stock-level">
                  Current: {product.quantity} | Alert: {product.alertQty}
                </span>
                <button 
                  className="whatsapp-btn"
                  onClick={() => sendWhatsAppAlert(product)}
                >
                  <FaWhatsapp className="whatsapp-icon" />
                  Send Alert
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AlertNotification;