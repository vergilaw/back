import React, { useState, useEffect } from 'react'
import './SocialSidebar.css'

export default function SocialSidebar() {
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY

      // Nếu scroll xuống (currentScrollY > lastScrollY) → ẩn sidebar
      // Nếu scroll lên (currentScrollY < lastScrollY) → hiện sidebar
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false) // Ẩn khi scroll xuống
      } else {
        setIsVisible(true) // Hiện khi scroll lên
      }

      setLastScrollY(currentScrollY)
    }

    // Lắng nghe sự kiện scroll
    window.addEventListener('scroll', handleScroll)

    // Cleanup khi component unmount
    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [lastScrollY])

  return (
    <aside className={`social-sidebar ${isVisible ? 'visible' : 'hidden'}`}>
      <a href="#download" className="social-icon" title="Download">📥</a>
      <a href="#calendar" className="social-icon" title="Calendar">📅</a>
      <a href="#youtube" className="social-icon" title="YouTube">▶️</a>
      <a href="#chat" className="social-icon" title="Chat">💬</a>
      <a href="#favorite" className="social-icon" title="Favorite">❤️</a>
      <a href="#notifications" className="social-icon" title="Notifications">🔔</a>
    </aside>
  )
}