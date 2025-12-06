import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import './Header.css'

export default function Header() {
  const [cartCount] = useState(0)
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)

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
            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
          </Link>
        </div>
      </div>
    </header>
  )
}