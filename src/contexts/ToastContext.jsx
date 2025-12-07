import { createContext, useContext, useState, useCallback } from 'react'
import Toast from '../Toast'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const showToast = useCallback((message, type = 'success', duration = 3000) => {
    const id = Date.now() + Math.random()
    setToasts(prev => [...prev, { id, message, type, duration }])
  }, [])

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  // Shorthand methods
  const success = useCallback((msg, duration) => showToast(msg, 'success', duration), [showToast])
  const error = useCallback((msg, duration) => showToast(msg, 'error', duration), [showToast])
  const info = useCallback((msg, duration) => showToast(msg, 'info', duration), [showToast])
  const warning = useCallback((msg, duration) => showToast(msg, 'warning', duration), [showToast])

  return (
    <ToastContext.Provider value={{ showToast, success, error, info, warning }}>
      {children}
      <div className="toast-container">
        {toasts.map((toast, index) => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            duration={toast.duration}
            index={index}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return context
}
