import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useAuth } from './contexts/AuthContext'
import { useToast } from './contexts/ToastContext'
import './LoginModal.css'

const API_URL = 'http://localhost:8000/api'

export default function LoginModal({ isOpen, onClose }) {
  const { login, register } = useAuth()
  const toast = useToast()
  const [mode, setMode] = useState('login') // login, register, forgot, otp
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    phone: '',
    otp: '',
    new_password: ''
  })

  if (!isOpen) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    
    try {
      if (mode === 'login') {
        await login(formData.email, formData.password)
        toast.success('Đăng nhập thành công!')
        onClose()
      } else if (mode === 'register') {
        await register(formData)
        toast.success('Đăng ký thành công! Vui lòng đăng nhập.')
        setMode('login')
        setFormData({ ...formData, password: '' })
      }
    } catch (err) {
      toast.error(err.message)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    
    try {
      const res = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email })
      })
      const data = await res.json()
      
      if (!res.ok) throw new Error(data.detail || 'Không thể gửi OTP')
      
      toast.success('Đã gửi mã OTP đến email của bạn!')
      setMode('otp')
    } catch (err) {
      toast.error(err.message)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    
    try {
      const res = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          otp: formData.otp,
          new_password: formData.new_password
        })
      })
      const data = await res.json()
      
      if (!res.ok) throw new Error(data.detail || 'Không thể đổi mật khẩu')
      
      toast.success('Đổi mật khẩu thành công! Vui lòng đăng nhập.')
      setMode('login')
      setFormData({ ...formData, otp: '', new_password: '', password: '' })
    } catch (err) {
      toast.error(err.message)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const getTitle = () => {
    switch (mode) {
      case 'register': return 'Register'
      case 'forgot': return 'Forgot Password'
      case 'otp': return 'Reset Password'
      default: return 'Login'
    }
  }

  const modalContent = (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        
        <h2>{getTitle()}</h2>
        
        {error && <div className="alert error">{error}</div>}
        
        {/* LOGIN FORM */}
        {mode === 'login' && (
          <form onSubmit={handleSubmit}>
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              required
            />
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength={6}
            />
            <button type="submit" disabled={loading}>
              {loading ? 'Please wait...' : 'Login'}
            </button>
          </form>
        )}

        {/* REGISTER FORM */}
        {mode === 'register' && (
          <form onSubmit={handleSubmit}>
            <input
              type="text"
              name="full_name"
              placeholder="Full Name"
              value={formData.full_name}
              onChange={handleChange}
              required
            />
            <input
              type="tel"
              name="phone"
              placeholder="Phone Number"
              value={formData.phone}
              onChange={handleChange}
              required
            />
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              required
            />
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength={6}
            />
            <button type="submit" disabled={loading}>
              {loading ? 'Please wait...' : 'Register'}
            </button>
          </form>
        )}

        {/* FORGOT PASSWORD FORM */}
        {mode === 'forgot' && (
          <form onSubmit={handleForgotPassword}>
            <p className="form-hint">Nhập email để nhận mã OTP</p>
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              required
            />
            <button type="submit" disabled={loading}>
              {loading ? 'Đang gửi...' : 'Gửi mã OTP'}
            </button>
          </form>
        )}

        {/* OTP & NEW PASSWORD FORM */}
        {mode === 'otp' && (
          <form onSubmit={handleResetPassword}>
            <p className="form-hint">Nhập mã OTP đã gửi đến {formData.email}</p>
            <input
              type="text"
              name="otp"
              placeholder="Mã OTP (6 số)"
              value={formData.otp}
              onChange={handleChange}
              required
              maxLength={6}
            />
            <input
              type="password"
              name="new_password"
              placeholder="Mật khẩu mới"
              value={formData.new_password}
              onChange={handleChange}
              required
              minLength={6}
            />
            <button type="submit" disabled={loading}>
              {loading ? 'Đang xử lý...' : 'Đổi mật khẩu'}
            </button>
            <button 
              type="button" 
              className="btn-resend"
              onClick={handleForgotPassword}
              disabled={loading}
            >
              Gửi lại OTP
            </button>
          </form>
        )}
        
        {/* FORGOT PASSWORD LINK */}
        {mode === 'login' && (
          <p className="forgot-password">
            <button type="button" onClick={() => { setMode('forgot'); setError('') }}>
              Forgot Password?
            </button>
          </p>
        )}
        
        {/* SWITCH MODE */}
        <p className="switch-mode">
          {mode === 'login' && (
            <>
              Don't have an account?{' '}
              <button type="button" onClick={() => { setMode('register'); setError('') }}>
                Register
              </button>
            </>
          )}
          {mode === 'register' && (
            <>
              Already have an account?{' '}
              <button type="button" onClick={() => { setMode('login'); setError('') }}>
                Login
              </button>
            </>
          )}
          {(mode === 'forgot' || mode === 'otp') && (
            <>
              Back to{' '}
              <button type="button" onClick={() => { setMode('login'); setError('') }}>
                Login
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}
