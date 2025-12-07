import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'
import { useAuth } from './contexts/AuthContext'
import { useCart } from './contexts/CartContext'
import LoginModal from './LoginModal'
import './CartPage.css'

export default function CartPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { cart, cartTotal, loading, updateQuantity, removeFromCart } = useCart()
  const [showLogin, setShowLogin] = useState(false)

  if (!user) {
    return (
      <div className="cart-page">
        <Header />
        <section className="page-banner">
          <div className="page-banner-container">
            <h1 className="page-title">Shopping Cart</h1>
            <div className="breadcrumb">
              <Link to="/">🏠</Link>
              <span className="separator">»</span>
              <span>Cart</span>
            </div>
          </div>
        </section>
        <section className="cart-section">
          <div className="cart-container empty-cart">
            <p>Please login to view your cart</p>
            <button className="btn-primary" onClick={() => setShowLogin(true)}>Login</button>
          </div>
        </section>
        <Footer />
        <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} />
      </div>
    )
  }

  if (loading) {
    return (
      <div className="cart-page">
        <Header />
        <section className="cart-section">
          <div className="cart-container"><p>Loading...</p></div>
        </section>
        <Footer />
      </div>
    )
  }

  return (
    <div className="cart-page">
      <Header />
      
      <section className="page-banner">
        <div className="page-banner-container">
          <h1 className="page-title">Shopping Cart</h1>
          <div className="breadcrumb">
            <Link to="/">🏠</Link>
            <span className="separator">»</span>
            <span>Cart</span>
          </div>
        </div>
      </section>

      <section className="cart-section">
        <div className="cart-container">
          {cart.length === 0 ? (
            <div className="empty-cart">
              <p>Your cart is empty</p>
              <Link to="/shop" className="btn-primary">Continue Shopping</Link>
            </div>
          ) : (
            <div className="cart-layout">
              <div className="cart-items">
                <table className="cart-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Price</th>
                      <th>Quantity</th>
                      <th>Total</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {cart.map(item => (
                      <tr key={item.cart_id}>
                        <td className="product-cell">
                          <img src={item.product.image} alt={item.product.name} />
                          <span>{item.product.name}</span>
                        </td>
                        <td>${item.product.price.toFixed(2)}</td>
                        <td>
                          <div className="quantity-control">
                            <button onClick={() => updateQuantity(item.product.id, item.quantity - 1)}>-</button>
                            <span>{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.product.id, item.quantity + 1)}>+</button>
                          </div>
                        </td>
                        <td>${(item.product.price * item.quantity).toFixed(2)}</td>
                        <td>
                          <button className="remove-btn" onClick={() => removeFromCart(item.product.id)}>×</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="cart-summary">
                <h3>Order Summary</h3>
                <div className="summary-row">
                  <span>Subtotal ({cartTotal.total_items} items)</span>
                  <span>${cartTotal.subtotal.toFixed(2)}</span>
                </div>
                <div className="summary-row">
                  <span>Shipping</span>
                  <span>{cartTotal.shipping === 0 ? 'Free' : `$${cartTotal.shipping.toFixed(2)}`}</span>
                </div>
                {cartTotal.subtotal < 50 && (
                  <p className="free-shipping-note">Add ${(50 - cartTotal.subtotal).toFixed(2)} more for free shipping!</p>
                )}
                <div className="summary-row total">
                  <span>Total</span>
                  <span>${cartTotal.total.toFixed(2)}</span>
                </div>
                <button className="checkout-btn" onClick={() => navigate('/checkout')}>
                  Proceed to Checkout
                </button>
                <Link to="/shop" className="continue-shopping">Continue Shopping</Link>
              </div>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  )
}
