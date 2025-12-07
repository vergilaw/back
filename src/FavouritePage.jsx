import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from './Header'
import SocialSidebar from './SocialSidebar'
import ChatButton from './ChatButton'
import Footer from './Footer'
import api from './services/api'
import './FavouritePage.css'

export default function FavouritePage() {
  const [favourites, setFavourites] = useState([])
  const [viewMode, setViewMode] = useState(4)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [removingIds, setRemovingIds] = useState(new Set())
  const [addingToCartIds, setAddingToCartIds] = useState(new Set())

  const navigate = useNavigate()

  useEffect(() => {
    fetchFavourites()
  }, [])

  const fetchFavourites = async () => {
  setLoading(true)
  setError(null)
  
  try {
    const data = await api.getFavourites({ skip: 0, limit: 100 })
    console.log('✅ Favourites loaded:', data)
    setFavourites(data)
  } catch (err) {
    console.error('❌ Error fetching favourites:', err)
    
    // ✅ Don't show error if session expired
    if (err.message === 'Session expired') {
      return
    }
    
    setError(err.message || 'Failed to load favourites')
  } finally {
    setLoading(false)
  }
}

  const removeFromFavourites = async (productId) => {
    setRemovingIds(prev => new Set(prev).add(productId))
    
    try {
      await api.removeFromFavourites(productId)
      setFavourites(prev => prev.filter(fav => fav.product.id !== productId))
    } catch (err) {
      console.error('❌ Error removing favourite:', err)
      alert(err.message || 'Failed to remove from favourites')
    } finally {
      setRemovingIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(productId)
        return newSet
      })
    }
  }

  const addToCart = async (product) => {
    const token = localStorage.getItem('token')
    if (!token) {
      alert('Please login to add items to cart')
      return
    }

    setAddingToCartIds(prev => new Set(prev).add(product.id))
    
    try {
      await api.addToCart(product.id, 1)
      alert(`✅ ${product.name} added to cart!`)
    } catch (err) {
      console.error('❌ Error adding to cart:', err)
      alert(err.message || 'Failed to add to cart')
    } finally {
      setAddingToCartIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(product.id)
        return newSet
      })
    }
  }

  const clearAllFavourites = async () => {
    if (!confirm('Are you sure you want to remove all favourites?')) return
    
    try {
      await api.clearFavourites()
      setFavourites([])
    } catch (err) {
      console.error('❌ Error clearing favourites:', err)
      alert(err.message || 'Failed to clear favourites')
    }
  }

  if (loading) {
    return (
      <div className="favourite-page">
        <Header />
        <section className="page-banner">
          <div className="page-banner-container">
            <h1 className="page-title">My Favourites</h1>
            <div className="breadcrumb">
              <a href="/">🏠</a>
              <span className="separator">»</span>
              <span>Favourites</span>
            </div>
          </div>
        </section>
        <section className="favourite-section">
          <div className="favourite-container">
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading your favourites...</p>
            </div>
          </div>
        </section>
        <Footer />
      </div>
    )
  }

  if (error) {
    return (
      <div className="favourite-page">
        <Header />
        <section className="page-banner">
          <div className="page-banner-container">
            <h1 className="page-title">My Favourites</h1>
          </div>
        </section>
        <section className="favourite-section">
          <div className="favourite-container">
            <div className="error-state">
              <h2>⚠️ Error Loading Favourites</h2>
              <p>{error}</p>
              <button onClick={fetchFavourites} className="retry-btn">
                Try Again
              </button>
            </div>
          </div>
        </section>
        <Footer />
      </div>
    )
  }

  return (
    <div className="favourite-page">
      <Header />
      
      <section className="page-banner">
        <div className="page-banner-container">
          <h1 className="page-title">My Favourites</h1>
          <div className="breadcrumb">
            <a href="/">🏠</a>
            <span className="separator">»</span>
            <span>Favourites</span>
          </div>
        </div>
      </section>

      <section className="favourite-section">
        <div className="favourite-container">
          {favourites.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">💔</div>
              <h2>No Favourites Yet</h2>
              <p>You haven't added any products to your favourites.</p>
              <div className="empty-actions">
                <button onClick={() => navigate('/shop')} className="shop-btn">
                  Start Shopping
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Toolbar */}
              <div className="favourite-toolbar">
                <div className="toolbar-left">
                  <h2 className="favourite-count">
                    {favourites.length} {favourites.length === 1 ? 'Favourite' : 'Favourites'}
                  </h2>
                </div>
                
                <div className="toolbar-right">
                  {/* View Mode */}
                  <div className="view-mode">
                    <button 
                      className={`view-btn ${viewMode === 2 ? 'active' : ''}`}
                      onClick={() => setViewMode(2)}
                      title="2 columns"
                    >
                      <span className="grid-icon grid-2"></span>
                    </button>
                    <button 
                      className={`view-btn ${viewMode === 3 ? 'active' : ''}`}
                      onClick={() => setViewMode(3)}
                      title="3 columns"
                    >
                      <span className="grid-icon grid-3"></span>
                    </button>
                    <button 
                      className={`view-btn ${viewMode === 4 ? 'active' : ''}`}
                      onClick={() => setViewMode(4)}
                      title="4 columns"
                    >
                      <span className="grid-icon grid-4"></span>
                    </button>
                  </div>

                  <button onClick={clearAllFavourites} className="clear-all-btn">
                    Clear All
                  </button>
                </div>
              </div>

              {/* Product Grid */}
              <div className={`product-grid cols-${viewMode}`}>
                {favourites.map(favourite => (
                  <div key={favourite.favourite_id} className="product-card">
                    <div className="product-image-wrapper">
                      <img 
                        src={favourite.product.image} 
                        alt={favourite.product.name} 
                        className="product-image" 
                      />
                      
                      {favourite.product.badge && (
                        <span className={`product-badge badge-${favourite.product.badge.toLowerCase()}`}>
                          {favourite.product.badge}
                        </span>
                      )}
                      
                      {/* Remove favourite button - Icon trên góc trái */}
                      <button 
                        className="remove-favourite-btn-icon"
                        onClick={() => removeFromFavourites(favourite.product.id)}
                        disabled={removingIds.has(favourite.product.id)}
                        title="Remove from favourites"
                      >
                        {removingIds.has(favourite.product.id) ? '⏳' : '💔'}
                      </button>
                    </div>
                    
                    <div className="product-info">
                      <h3 className="product-name">{favourite.product.name}</h3>
                      <p className="product-price">${favourite.product.price.toFixed(2)}</p>
                      
                      {/* Action buttons */}
                      <div className="product-actions">
                        <button 
                          className="add-to-cart-btn"
                          onClick={() => addToCart(favourite.product)}
                          disabled={addingToCartIds.has(favourite.product.id)}
                        >
                          {addingToCartIds.has(favourite.product.id) ? '⏳ Adding...' : '🛒 Add to Cart'}
                        </button>
                        
                        <button 
                          className="remove-favourite-btn-text"
                          onClick={() => removeFromFavourites(favourite.product.id)}
                          disabled={removingIds.has(favourite.product.id)}
                        >
                          {removingIds.has(favourite.product.id) ? 'Removing...' : '💔 Remove'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      <SocialSidebar />
      <ChatButton />
      <Footer />
    </div>
  )
}