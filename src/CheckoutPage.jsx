import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'
import { useAuth } from './contexts/AuthContext'
import { useCart } from './contexts/CartContext'
import './CheckoutPage.css'

const API_URL = 'http://localhost:8000/api'

export default function CheckoutPage() {
  const navigate = useNavigate()
  const { user, token } = useAuth()
  const { cart, cartTotal, clearCart, loading: cartLoading } = useCart()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  // QR Payment Modal state
  const [showQRModal, setShowQRModal] = useState(false)
  const [paymentData, setPaymentData] = useState(null)
  const [checkingPayment, setCheckingPayment] = useState(false)
  
  const [formData, setFormData] = useState({
    shipping_address: '',
    phone: user?.phone || '',
    note: '',
    payment_method: 'cod'
  })
  
  // Poll payment status when QR modal is open
  useEffect(() => {
    let interval
    if (showQRModal && paymentData?.order_id) {
      interval = setInterval(async () => {
        try {
          const res = await fetch(`${API_URL}/payments/payos/check/${paymentData.order_id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          })
          const data = await res.json()
          if (data.payment_status === 'paid' || data.payos_status === 'PAID') {
            clearInterval(interval)
            setShowQRModal(false)
            navigate(`/order-success/${paymentData.order_id}`)
          }
        } catch (err) {
          console.error('Check payment error:', err)
        }
      }, 3000) // Check every 3 seconds
    }
    return () => clearInterval(interval)
  }, [showQRModal, paymentData, token, navigate])

  if (!user) {
    navigate('/cart')
    return null
  }

  // Wait for cart to load before checking if empty
  if (cartLoading) {
    return (
      <div className="checkout-page">
        <Header />
        <section className="page-banner">
          <div className="page-banner-container">
            <h1 className="page-title">Checkout</h1>
          </div>
        </section>
        <section className="checkout-section">
          <div className="checkout-container empty">
            <p>Loading cart...</p>
          </div>
        </section>
        <Footer />
      </div>
    )
  }

  // Don't show empty cart if QR modal is open (cart was cleared after order)
  if (cart.length === 0 && !showQRModal && !paymentData) {
    return (
      <div className="checkout-page">
        <Header />
        <section className="page-banner">
          <div className="page-banner-container">
            <h1 className="page-title">Checkout</h1>
          </div>
        </section>
        <section className="checkout-section">
          <div className="checkout-container empty">
            <p>Your cart is empty</p>
            <Link to="/shop" className="btn-primary">Go Shopping</Link>
          </div>
        </section>
        <Footer />
      </div>
    )
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Prepare order items
      const items = cart.map(item => ({
        product_id: item.product.id,
        name: item.product.name,
        price: item.product.price,
        quantity: item.quantity,
        image: item.product.image
      }))

      // Create order
      const orderRes = await fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          items,
          shipping_address: formData.shipping_address,
          phone: formData.phone,
          note: formData.note,
          payment_method: formData.payment_method
        })
      })

      const orderData = await orderRes.json()
      if (!orderRes.ok) throw new Error(orderData.detail || 'Failed to create order')

      // Clear cart after successful order
      await clearCart()

      // Handle payment
      if (formData.payment_method === 'payos') {
        // Create PayOS payment link
        const paymentRes = await fetch(`${API_URL}/payments/payos/${orderData.id}`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        })
        const payData = await paymentRes.json()
        
        if (paymentRes.ok && payData.qr_code) {
          // Show QR Modal instead of redirect
          setPaymentData({
            order_id: orderData.id,
            qr_code: payData.qr_code,
            payment_url: payData.payment_url,
            amount: payData.amount,
            order_code: payData.order_code
          })
          setShowQRModal(true)
          setLoading(false)
          return
        }
      }

      // COD or PayOS failed - go to success page
      navigate(`/order-success/${orderData.id}`)

    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="checkout-page">
      <Header />
      
      <section className="page-banner">
        <div className="page-banner-container">
          <h1 className="page-title">Checkout</h1>
          <div className="breadcrumb">
            <Link to="/">🏠</Link>
            <span className="separator">»</span>
            <Link to="/cart">Cart</Link>
            <span className="separator">»</span>
            <span>Checkout</span>
          </div>
        </div>
      </section>

      <section className="checkout-section">
        <div className="checkout-container">
          <form onSubmit={handleSubmit} className="checkout-form">
            <div className="checkout-layout">
              {/* Shipping Info */}
              <div className="shipping-info">
                <h3>Shipping Information</h3>
                
                {error && <div className="error-msg">{error}</div>}
                
                <div className="form-group">
                  <label>Full Name</label>
                  <input type="text" value={user.full_name} disabled />
                </div>
                
                <div className="form-group">
                  <label>Email</label>
                  <input type="email" value={user.email} disabled />
                </div>
                
                <div className="form-group">
                  <label>Phone Number *</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    minLength={10}
                    placeholder="Enter your phone number"
                  />
                </div>
                
                <div className="form-group">
                  <label>Shipping Address *</label>
                  <textarea
                    name="shipping_address"
                    value={formData.shipping_address}
                    onChange={handleChange}
                    required
                    minLength={10}
                    rows={3}
                    placeholder="Enter your full address"
                  />
                </div>
                
                <div className="form-group">
                  <label>Order Note (optional)</label>
                  <textarea
                    name="note"
                    value={formData.note}
                    onChange={handleChange}
                    rows={2}
                    placeholder="Special instructions for delivery"
                  />
                </div>

                <h3>Payment Method</h3>
                <div className="payment-methods">
                  <label className={`payment-option ${formData.payment_method === 'cod' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="payment_method"
                      value="cod"
                      checked={formData.payment_method === 'cod'}
                      onChange={handleChange}
                    />
                    <span className="payment-icon">💵</span>
                    <div>
                      <strong>Cash on Delivery (COD)</strong>
                      <p>Pay when you receive your order</p>
                    </div>
                  </label>
                  
                  <label className={`payment-option ${formData.payment_method === 'payos' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="payment_method"
                      value="payos"
                      checked={formData.payment_method === 'payos'}
                      onChange={handleChange}
                    />
                    <span className="payment-icon">💳</span>
                    <div>
                      <strong>Online Payment (PayOS)</strong>
                      <p>Pay via bank transfer or e-wallet</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Order Summary */}
              <div className="order-summary">
                <h3>Order Summary</h3>
                
                <div className="order-items">
                  {cart.map(item => (
                    <div key={item.cart_id} className="order-item">
                      <img src={item.product.image} alt={item.product.name} />
                      <div className="item-details">
                        <span className="item-name">{item.product.name}</span>
                        <span className="item-qty">x{item.quantity}</span>
                      </div>
                      <span className="item-price">${(item.product.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <div className="summary-totals">
                  <div className="summary-row">
                    <span>Subtotal</span>
                    <span>${cartTotal.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="summary-row">
                    <span>Shipping</span>
                    <span>{cartTotal.shipping === 0 ? 'Free' : `$${cartTotal.shipping.toFixed(2)}`}</span>
                  </div>
                  <div className="summary-row total">
                    <span>Total</span>
                    <span>${cartTotal.total.toFixed(2)}</span>
                  </div>
                </div>

                <button type="submit" className="place-order-btn" disabled={loading}>
                  {loading ? 'Processing...' : `Place Order - $${cartTotal.total.toFixed(2)}`}
                </button>
                
                <Link to="/cart" className="back-to-cart">← Back to Cart</Link>
              </div>
            </div>
          </form>
        </div>
      </section>

      <Footer />
      
      {/* QR Payment Modal */}
      {showQRModal && paymentData && (
        <div className="qr-modal-overlay">
          <div className="qr-modal">
            <button className="qr-modal-close" onClick={() => setShowQRModal(false)}>×</button>
            
            <h2>Scan QR to Pay</h2>
            <p className="qr-amount">Amount: <strong>${paymentData.amount?.toFixed(2)}</strong></p>
            
            <div className="qr-code-container">
              {paymentData.qr_code?.startsWith('http') ? (
                <img 
                  src={paymentData.qr_code} 
                  alt="Payment QR Code"
                  className="qr-code-image"
                />
              ) : (
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(paymentData.qr_code)}`} 
                  alt="Payment QR Code"
                  className="qr-code-image"
                />
              )}
            </div>
            
            <p className="qr-instruction">
              Open your banking app and scan this QR code to complete payment
            </p>
            
            <div className="qr-status">
              <span className="status-dot"></span>
              Waiting for payment...
            </div>
            
            <div className="qr-actions">
              <a 
                href={paymentData.payment_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="btn-open-payos"
              >
                Open PayOS Page
              </a>
              <button 
                className="btn-cancel-payment"
                onClick={() => {
                  setShowQRModal(false)
                  navigate(`/order-success/${paymentData.order_id}`)
                }}
              >
                Pay Later
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
