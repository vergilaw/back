import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './TransitionCircle.css'

export default function TransitionLink({ to, children, className }) {
  const [running, setRunning] = useState(false)
  const navigate = useNavigate()

  const handleClick = (event) => {
    event.preventDefault()
    setRunning(true)
    setTimeout(() => {
      setRunning(false)
      navigate(to)
    }, 1000)
  }

  return (
    <>
      <button
        className={`${className ?? ''} transition-link-button`}
        onClick={handleClick}
      >
        {children}
      </button>
      {running && (
        <div className="transition-overlay">
          <div className="transition-circle" />
        </div>
      )}
    </>
  )
}