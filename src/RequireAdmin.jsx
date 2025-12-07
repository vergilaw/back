import { Navigate, Outlet } from 'react-router-dom'
import { useEffect } from 'react'

export default function RequireAdmin() {
  const token = localStorage.getItem('token')
  const userRole = localStorage.getItem('userRole')
  
  useEffect(() => {
    if (token && userRole !== 'admin') {
      alert('Bạn không phải admin, không thể vào trang này!')
    }
  }, [token, userRole])

  if (!token) {
    return <Navigate to="/auth" replace />
  }
  
  if (userRole !== 'admin') {
    return <Navigate to="/home" replace />
  }
  
  return <Outlet />
}