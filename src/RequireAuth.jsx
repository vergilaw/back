import { Navigate, Outlet, useLocation } from 'react-router-dom'

export default function RequireAuth() {
  const token = localStorage.getItem('token')
  const location = useLocation()

  if (!token) {
    return <Navigate to="/auth" replace state={{ from: location }} />
  }

  return <Outlet />
}