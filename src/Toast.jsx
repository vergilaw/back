import { useState, useEffect } from 'react'
import './Toast.css'

export default function Toast({ message, type = 'success', duration = 3000, index = 0, onClose }) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false)
      setTimeout(onClose, 300)
    }, duration)
    return () => clearTimeout(timer)
  }, [duration, onClose])

  const icons = {
    success: '✓',
    error: '✕',
    info: 'ℹ',
    warning: '⚠'
  }

  return (
    <div 
      className={`toast toast-${type} ${visible ? 'show' : 'hide'}`}
      style={{ top: `${100 + index * 70}px` }}
    >
      <span className="toast-icon">{icons[type]}</span>
      <span className="toast-message">{message}</span>
      <button className="toast-close" onClick={() => { setVisible(false); setTimeout(onClose, 300) }}>
        ×
      </button>
    </div>
  )
}
