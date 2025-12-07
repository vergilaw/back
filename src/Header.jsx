import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import { useCart } from './contexts/CartContext'
import { useToast } from './contexts/ToastContext'
import LoginModal from './LoginModal'
import './Header.css'

export default function Header() {
  const { user, logout } = useAuth()
  const { cartTotal } = useCart()
  const toast = useToast()
  const [showLogin, setShowLogin] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)

  const handleLogout = () => {
    logout()
    setShowUserMenu(false)
    toast.info('Đã đăng xuất')
  }

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY

      if (currentScrollY > lastScrollY && currentScrollY > 80) {
        setIsVisible(false)
      } else {
        setIsVisible(true)
      }

      setLastScrollY(currentScrollY)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [lastScrollY])

  return (
    <header className={`header ${isVisible ? 'header-visible' : 'header-hidden'}`}>
      <div className="header-container">
        {/* Logo */}
        <Link to="/" className="logo">
          <div className="logo-icon">🧁</div>
          <span className="logo-text">Sweet Bakery</span>
        </Link>

        {/* Navigation */}
        <nav className="nav">
          <Link to="/" className="nav-link">Home</Link>
          <Link to="/about" className="nav-link">About</Link>
          <Link to="/menu" className="nav-link">Our Menu</Link>
          <Link to="/blog" className="nav-link">Blog</Link>
          <Link to="/shop" className="nav-link">Shop</Link>
          <Link to="/faq" className="nav-link">FAQ</Link>
          <Link to="/contact" className="nav-link">Contact</Link>
        </nav>

        {/* Right side */}
        <div className="header-actions">
          <a href="tel:+18882467" className="phone-btn">
            📞 +1 (888) 24 675
          </a>
          <Link to="/cart" className="cart-btn">
            🛒 CART
            {cartTotal.total_items > 0 && <span className="cart-badge">{cartTotal.total_items}</span>}
          </Link>
          
          {user ? (
            <div className="user-menu-wrapper">
              <button className="user-btn" onClick={() => setShowUserMenu(!showUserMenu)}>
                👤 {user.full_name?.split(' ')[0] || 'Account'}
              </button>
              {showUserMenu && (
                <div className="user-dropdown">
                  <Link to="/my-orders" onClick={() => setShowUserMenu(false)}>My Orders</Link>
                  <button onClick={handleLogout}>Logout</button>
                </div>
              )}
            </div>
          ) : (
            <button className="login-btn" onClick={() => setShowLogin(true)}>
              Login
            </button>
          )}
        </div>
      </div>
      <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} />
    </header>
  )
}