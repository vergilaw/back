import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'
import { useAuth } from './contexts/AuthContext'
import './OrderSuccessPage.css'

const API_URL = 'http://localhost:8000/api'

export default function OrderSuccessPage() {
  const { orderId } = useParams()
  const { token } = useAuth()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchOrder()
  }, [orderId])

  const fetchOrder = async () => {
    try {
      const res = await fetch(`${API_URL}/orders/${orderId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        setOrder(await res.json())
      }
    } catch (err) {
      console.error('Error fetching order:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="order-success-page">
        <Header />
        <section className="success-section">
          <div className="success-container"><p>Loading...</p></div>
        </section>
        <Footer />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="order-success-page">
        <Header />
        <section className="success-section">
          <div className="success-container">
            <p>Order not found</p>
            <Link to="/shop" className="btn-primary">Continue Shopping</Link>
          </div>
        </section>
        <Footer />
      </div>
    )
  }

  const statusLabels = {
    pending: 'Pending Payment',
    paid: 'Paid',
    confirmed: 'Confirmed',
    shipping: 'Shipping',
    delivered: 'Delivered',
    cancelled: 'Cancelled'
  }

  return (
    <div className="order-success-page">
      <Header />
      
      <section className="success-section">
        <div className="success-container">
          <div className="success-icon">✓</div>
          <h1>Order Placed Successfully!</h1>
          <p className="order-id">Order ID: <strong>{order.id}</strong></p>
          
          <div className="order-details">
            <div className="detail-section">
              <h3>Order Status</h3>
              <span className={`status-badge ${order.status}`}>
                {statusLabels[order.status]}
              </span>
              {order.payment_method === 'cod' && order.payment_status === 'unpaid' && (
                <p className="cod-note">💵 Pay ${order.total_amount.toFixed(2)} when you receive your order</p>
              )}
            </div>

            <div className="detail-section">
              <h3>Shipping Address</h3>
              <p>{order.shipping_address}</p>
              <p>📞 {order.phone}</p>
            </div>

            <div className="detail-section">
              <h3>Order Items</h3>
              <div className="order-items">
                {order.items.map((item, idx) => (
                  <div key={idx} className="order-item">
                    <img src={item.image} alt={item.name} />
                    <div className="item-info">
                      <span className="item-name">{item.name}</span>
                      <span className="item-qty">Qty: {item.quantity}</span>
                    </div>
                    <span className="item-price">${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="detail-section total-section">
              <div className="total-row">
                <span>Payment Method</span>
                <span>{order.payment_method === 'cod' ? 'Cash on Delivery' : 'PayOS'}</span>
              </div>
              <div className="total-row grand-total">
                <span>Total Amount</span>
                <span>${order.total_amount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="success-actions">
            <Link to="/my-orders" className="btn-secondary">View My Orders</Link>
            <Link to="/shop" className="btn-primary">Continue Shopping</Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
