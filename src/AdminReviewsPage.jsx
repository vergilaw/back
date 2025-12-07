import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'
import api from './services/api'
import './AdminReviewsPage.css'

export default function AdminReviewsPage() {
  const navigate = useNavigate()
  const [reviews, setReviews] = useState([])
  const [filter, setFilter] = useState('pending') // 'pending', 'all', 'approved', 'hidden'
  const [loading, setLoading] = useState(true)
  const [processingIds, setProcessingIds] = useState(new Set())

  const userRole = localStorage.getItem('userRole')
  
  useEffect(() => {
    if (userRole !== 'admin') {
      alert('⚠️ Admin access only!')
      navigate('/')
      return
    }
    fetchReviews()
  }, [filter, userRole, navigate])

  const fetchReviews = async () => {
    setLoading(true)
    try {
      let data
      if (filter === 'pending') {
        data = await api.getPendingReviews()
      } else {
        data = await api.getAllReviews()
        
        // Filter theo trạng thái
        if (filter === 'approved') {
          data = data.filter(r => r.is_approved && !r.is_hidden)
        } else if (filter === 'hidden') {
          data = data.filter(r => r.is_hidden)
        }
      }
      setReviews(data)
    } catch (err) {
      console.error('Error fetching reviews:', err)
      alert('Failed to load reviews: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (reviewId) => {
    if (processingIds.has(reviewId)) return
    
    setProcessingIds(prev => new Set(prev).add(reviewId))
    
    try {
      await api.approveReview(reviewId)
      alert('✅ Review approved!')
      fetchReviews()
    } catch (err) {
      console.error('Error approving review:', err)
      alert('Failed to approve: ' + err.message)
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(reviewId)
        return newSet
      })
    }
  }

  const handleHide = async (reviewId) => {
    if (processingIds.has(reviewId)) return
    if (!window.confirm('Hide this review?')) return
    
    setProcessingIds(prev => new Set(prev).add(reviewId))
    
    try {
      await api.hideReview(reviewId)
      alert('✅ Review hidden!')
      fetchReviews()
    } catch (err) {
      console.error('Error hiding review:', err)
      alert('Failed to hide: ' + err.message)
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(reviewId)
        return newSet
      })
    }
  }

  const handleDelete = async (reviewId) => {
    if (processingIds.has(reviewId)) return
    if (!window.confirm('⚠️ Permanently delete this review?')) return
    
    setProcessingIds(prev => new Set(prev).add(reviewId))
    
    try {
      await api.deleteReview(reviewId)
      alert('✅ Review deleted!')
      fetchReviews()
    } catch (err) {
      console.error('Error deleting review:', err)
      alert('Failed to delete: ' + err.message)
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(reviewId)
        return newSet
      })
    }
  }

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={`star ${i < rating ? 'filled' : ''}`}>
        ★
      </span>
    ))
  }

  const getStatusBadge = (review) => {
    if (review.is_hidden) {
      return <span className="status-badge hidden">Hidden</span>
    }
    if (review.is_approved) {
      return <span className="status-badge approved">Approved</span>
    }
    return <span className="status-badge pending">Pending</span>
  }

  return (
    <div className="admin-reviews-page">
      <Header />
      
      <section className="admin-reviews-section">
        <div className="admin-reviews-container">
          <div className="admin-header">
            <h1 className="page-title">📝 Review Management</h1>
            
            <div className="filter-tabs">
              <button 
                className={`filter-tab ${filter === 'pending' ? 'active' : ''}`}
                onClick={() => setFilter('pending')}
              >
                ⏳ Pending
              </button>
              <button 
                className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
                onClick={() => setFilter('all')}
              >
                📋 All
              </button>
              <button 
                className={`filter-tab ${filter === 'approved' ? 'active' : ''}`}
                onClick={() => setFilter('approved')}
              >
                ✅ Approved
              </button>
              <button 
                className={`filter-tab ${filter === 'hidden' ? 'active' : ''}`}
                onClick={() => setFilter('hidden')}
              >
                🚫 Hidden
              </button>
            </div>
          </div>

          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading reviews...</p>
            </div>
          ) : reviews.length === 0 ? (
            <div className="empty-state">
              <p>No reviews found.</p>
            </div>
          ) : (
            <div className="reviews-list">
              {reviews.map(review => (
                <div key={review.id} className="admin-review-card">
                  <div className="review-header">
                    <div className="review-user-info">
                      <span className="user-name">{review.user_name || 'Anonymous'}</span>
                      {getStatusBadge(review)}
                    </div>
                    <div className="review-meta">
                      <div className="rating-stars">
                        {renderStars(review.rating)}
                      </div>
                      <span className="review-date">
                        {new Date(review.created_at).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="review-body">
                    <p className="review-product">
                      <strong>Product ID:</strong> {review.product_id}
                    </p>
                    {review.comment && (
                      <p className="review-comment">"{review.comment}"</p>
                    )}
                  </div>

                  <div className="review-actions">
                    {!review.is_approved && (
                      <button
                        className="action-btn approve-btn"
                        onClick={() => handleApprove(review.id)}
                        disabled={processingIds.has(review.id)}
                      >
                        {processingIds.has(review.id) ? '...' : '✅ Approve'}
                      </button>
                    )}
                    
                    {!review.is_hidden && (
                      <button
                        className="action-btn hide-btn"
                        onClick={() => handleHide(review.id)}
                        disabled={processingIds.has(review.id)}
                      >
                        {processingIds.has(review.id) ? '...' : '🚫 Hide'}
                      </button>
                    )}
                    
                    <button
                      className="action-btn delete-btn"
                      onClick={() => handleDelete(review.id)}
                      disabled={processingIds.has(review.id)}
                    >
                      {processingIds.has(review.id) ? '...' : '🗑️ Delete'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  )
}