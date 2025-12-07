import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './AuthPage.css'
import TransitionLink from './TransitionLink'

export default function AuthPage() {
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ email: '', password: '', full_name: '', phone: '' })
  const navigate = useNavigate()

  const handleSubmit = async (event) => {
    event.preventDefault()
    const url = mode === 'login' ? '/api/auth/login' : '/api/auth/register'
    const payload = mode === 'login'
      ? { email: form.email, password: form.password }
      : form

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      alert('Đăng nhập/đăng ký thất bại')
      return
    }

    const data = await response.json()
localStorage.setItem('token', data.access_token)
localStorage.setItem('userRole', data.user.role?.toLowerCase?.() ?? '')
navigate('/home')
  }

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <h1>{mode === 'login' ? 'Đăng nhập' : 'Đăng ký'}</h1>
          <p>Sweet Bakery - trải nghiệm ngọt ngào</p>
        </div>
        <form className="auth-form" onSubmit={handleSubmit}>
          <input name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} required />
          <input name="password" type="password" placeholder="Mật khẩu" value={form.password} onChange={handleChange} required />
          {mode === 'register' && (
            <>
              <input name="full_name" placeholder="Họ và tên" value={form.full_name} onChange={handleChange} required />
              <input name="phone" placeholder="Số điện thoại" value={form.phone} onChange={handleChange} required />
            </>
          )}
          <button type="submit" className="primary-btn">
            {mode === 'login' ? 'Đăng nhập' : 'Đăng ký'}
          </button>
        </form>
        <div className="auth-toggle">
          <span>
            {mode === 'login' ? 'Chưa có tài khoản?' : 'Đã có tài khoản?'}
          </span>
          <button type="button" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
            {mode === 'login' ? 'Đăng ký' : 'Đăng nhập'}
          </button>
        </div>
        <TransitionLink to="/">Quay về trang chủ</TransitionLink>
      </div>
    </div>
  )
}