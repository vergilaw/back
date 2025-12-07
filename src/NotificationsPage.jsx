import React, { useState, useEffect } from 'react'
import Header from './Header'
import Footer from './Footer'
import './NotificationsPage.css'

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  const loadNotifications = async () => {
    const token = localStorage.getItem('token')
    try {
      const response = await fetch('/api/questions/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setNotifications(data)
      }
    } catch (error) {
      console.error('Failed to load notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadNotifications()
  }, [])

  return (
    <div className="notifications-page">
      <Header />
      <section className="page-banner">
        <div className="page-banner-container">
          <h1 className="page-title">Thông báo</h1>
        </div>
      </section>
      <section className="notifications-section">
        <div className="notifications-container">
          <button onClick={loadNotifications} className="refresh-btn">
            🔄 Tải lại
          </button>
          {loading ? (
            <p>Đang tải...</p>
          ) : notifications.length === 0 ? (
            <p className="empty-message">Chưa có thông báo nào</p>
          ) : (
            <div className="notification-list">
              {notifications.map((item) => (
                <div key={item.id} className="notification-card">
                  <h4>{item.subject}</h4>
                  <p className="question-text">Câu hỏi: {item.question}</p>
                  <p className="status">
                    {item.answered ? '✓ Đã trả lời' : '⏳ Đang chờ'}
                  </p>
                  {item.answer && (
                    <div className="answer-box">
                      <strong>Trả lời:</strong>
                      <p>{item.answer}</p>
                    </div>
                  )}
                  <small>{new Date(item.created_at).toLocaleString('vi-VN')}</small>
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