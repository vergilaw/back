import React, { useState, useEffect, useRef } from 'react'
import api from './services/api'
import './Chatbot.css'

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [inputMessage, setInputMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [historyLoaded, setHistoryLoaded] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  // Load chat history khi mở chatbot lần đầu
  useEffect(() => {
    if (isOpen && !historyLoaded) {
      loadChatHistory()
    }
  }, [isOpen])

  // Auto scroll to bottom khi có message mới
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Focus input khi mở chatbot
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const loadChatHistory = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        setMessages([{
          role: 'assistant',
          content: 'Xin chào! Sweet Bakery xin phục vụ quý khách. Tôi có thể giúp gì cho bạn?',
          timestamp: new Date().toISOString()
        }])
        setHistoryLoaded(true)
        return
      }

      const history = await api.getChatHistory(10)
      if (history && history.length > 0) {
        setMessages(history)
      } else {
        setMessages([{
          role: 'assistant',
          content: 'Xin chào! Sweet Bakery xin phục vụ quý khách. Tôi có thể giúp gì cho bạn?',
          timestamp: new Date().toISOString()
        }])
      }
    } catch (err) {
      console.error('Error loading chat history:', err)
      setMessages([{
        role: 'assistant',
        content: 'Xin chào! Sweet Bakery xin phục vụ quý khách. Tôi có thể giúp gì cho bạn?',
        timestamp: new Date().toISOString()
      }])
    } finally {
      setHistoryLoaded(true)
    }
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    
    if (!inputMessage.trim()) return

    const userMessage = {
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date().toISOString()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setLoading(true)

    try {
      const response = await api.chat(userMessage.content)
      
      const botMessage = {
        role: 'assistant',
        content: response.response,
        timestamp: new Date().toISOString()
      }

      setMessages(prev => [...prev, botMessage])
    } catch (err) {
      console.error('Error sending message:', err)
      
      const errorMessage = {
        role: 'assistant',
        content: 'Xin lỗi, tôi đang gặp sự cố. Vui lòng thử lại sau hoặc liên hệ hotline 0901 234 567.',
        timestamp: new Date().toISOString()
      }

      setMessages(prev => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  const handleClearChat = async () => {
    if (!confirm('Xóa toàn bộ lịch sử chat?')) return

    try {
      await api.clearChatHistory()
      setMessages([{
        role: 'assistant',
        content: 'Xin chào! Sweet Bakery xin phục vụ quý khách. Tôi có thể giúp gì cho bạn?',
        timestamp: new Date().toISOString()
      }])
    } catch (err) {
      console.error('Error clearing chat:', err)
      alert('Không thể xóa lịch sử chat')
    }
  }

  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <>
      {/* Chat Button */}
      <button 
        className={`chatbot-toggle-btn ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        title="Chat với chúng tôi"
      >
        {isOpen ? '✕' : '💬'}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="chatbot-window">
          {/* Header */}
          <div className="chatbot-header">
            <div className="chatbot-header-info">
              <div className="chatbot-avatar">🍰</div>
              <div>
                <h3>Sweet Bakery</h3>
                <span className="chatbot-status">● Online</span>
              </div>
            </div>
            <button 
              className="chatbot-clear-btn"
              onClick={handleClearChat}
              title="Xóa lịch sử chat"
            >
              🗑️
            </button>
          </div>

          {/* Messages */}
          <div className="chatbot-messages">
            {messages.map((msg, index) => (
              <div 
                key={index} 
                className={`chatbot-message ${msg.role === 'user' ? 'user' : 'assistant'}`}
              >
                <div className="message-content">
                  <p>{msg.content}</p>
                  <span className="message-time">{formatTime(msg.timestamp)}</span>
                </div>
              </div>
            ))}
            
            {loading && (
              <div className="chatbot-message assistant">
                <div className="message-content">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form className="chatbot-input-form" onSubmit={handleSendMessage}>
            <input
              ref={inputRef}
              type="text"
              className="chatbot-input"
              placeholder="Nhập tin nhắn..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              disabled={loading}
            />
            <button 
              type="submit" 
              className="chatbot-send-btn"
              disabled={loading || !inputMessage.trim()}
            >
              ➤
            </button>
          </form>
        </div>
      )}
    </>
  )
}