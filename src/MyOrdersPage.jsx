import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'
import { useAuth } from './contexts/AuthContext'
import { useToast } from './contexts/ToastContext'
import ConfirmModal from './ConfirmModal'
import './MyOrdersPage.css'

const API_URL = 'http://localhost:8000/api'

export default function MyOrdersPage() {
  const navigate = useNavigate()
  const { user, token } = useAuth()
  const toast = useToast()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, type: '', orderId: null })

  useEffect(() => {
    if (!user) {
      navigate('/cart')
      return
    }
    fetchOrders()
  }, [user])

  const fetchOrders = async () => {
    try {
      const res = await fetch(`${API_URL}/orders/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        setOrders(await res.json())
      }
    } catch (err) {
      console.error('Error fetching orders:', err)
    } finally {
      setLoading(false)
    }
  }

  const openCancelModal = (orderId) => {
    setConfirmModal({ isOpen: true, type: 'cancel', orderId })
  }

  const openDeleteModal = (orderId) => {
    setConfirmModal({ isOpen: true, type: 'delete', orderId })
  }

  const closeModal = () => {
    setConfirmModal({ isOpen: false, type: '', orderId: null })
  }

  const handleConfirm = async () => {
    const { type, orderId } = confirmModal
    closeModal()

    if (type === 'cancel') {
      try {
        const res = await fetch(`${API_URL}/orders/${orderId}/cancel`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (res.ok) {
          toast.success('Đã hủy đơn hàng')
          fetchOrders()
        } else {
          const data = await res.json()
          toast.error(data.detail || 'Không thể hủy đơn hàng')
        }
      } catch (err) {
        toast.error('Lỗi khi hủy đơn hàng')
      }
    } else if (type === 'delete') {
      try {
        const res = await fetch(`${API_URL}/orders/${orderId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (res.ok || res.status === 204) {
          toast.success('Đã xóa đơn hàng')
          fetchOrders()
        } else {
          const data = await res.json()
          toast.error(data.detail || 'Không thể xóa đơn hàng')
        }
      } catch (err) {
        toast.error('Lỗi khi xóa đơn hàng')
      }
    }
  }

  const statusLabels = {
    pending: 'Pending',
    paid: 'Paid',
    confirmed: 'Confirmed',
    shipping: 'Shipping',
    delivered: 'Delivered',
    cancelled: 'Cancelled'
  }

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (!user) return null

  return (
    <div className="my-orders-page">
      <Header />
      
      <section className="page-banner">
        <div className="page-banner-container">
          <h1 className="page-title">My Orders</h1>
          <div className="breadcrumb">
            <Link to="/">🏠</Link>
            <span className="separator">»</span>
            <span>My Orders</span>
          </div>
        </div>
      </section>

      <section className="orders-section">
        <div className="orders-container">
          {loading ? (
            <p className="loading">Loading orders...</p>
          ) : orders.length === 0 ? (
            <div className="empty-orders">
              <p>You haven't placed any orders yet</p>
              <Link to="/shop" className="btn-primary">Start Shopping</Link>
            </div>
          ) : (
            <div className="orders-list">
              {orders.map(order => (
                <div key={order.id} className="order-card">
                  <div className="order-header">
                    <div>
                      <span className="order-id">Order #{order.id.slice(-8)}</span>
                      <span className="order-date">{formatDate(order.created_at)}</span>
                    </div>
                    <span className={`status-badge ${order.status}`}>
                      {statusLabels[order.status]}
                    </span>
                  </div>
                  
                  <div className="order-items">
                    {order.items.slice(0, 3).map((item, idx) => (
                      <div key={idx} className="order-item">
                        <img src={item.image} alt={item.name} />
                        <div className="item-info">
                          <span className="item-name">{item.name}</span>
                          <span className="item-qty">x{item.quantity}</span>
                        </div>
                        <span className="item-price">${(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                    {order.items.length > 3 && (
                      <p className="more-items">+{order.items.length - 3} more items</p>
                    )}
                  </div>
                  
                  <div className="order-footer">
                    <div className="order-total">
                      <span>Total:</span>
                      <strong>${order.total_amount.toFixed(2)}</strong>
                    </div>
                    <div className="order-actions">
                      <Link to={`/order-success/${order.id}`} className="btn-view">View Details</Link>
                      {(order.status === 'pending' || order.status === 'paid') && (
                        <button className="btn-cancel" onClick={() => openCancelModal(order.id)}>
                          Cancel Order
                        </button>
                      )}
                      {order.status === 'cancelled' && (
                        <button className="btn-delete" onClick={() => openDeleteModal(order.id)}>
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.type === 'cancel' ? 'Hủy đơn hàng' : 'Xóa đơn hàng'}
        message={confirmModal.type === 'cancel' 
          ? 'Bạn có chắc muốn hủy đơn hàng này?' 
          : 'Bạn có chắc muốn xóa đơn hàng này? Hành động này không thể hoàn tác.'}
        confirmText={confirmModal.type === 'cancel' ? 'Hủy đơn' : 'Xóa'}
        cancelText="Đóng"
        type="danger"
        onConfirm={handleConfirm}
        onCancel={closeModal}
      />
    </div>
  )
}
