import React from 'react'
import './HeroSection.css'

export default function HeroSection() {
  return (
    <section className="hero">
      <div className="hero-container">
        {/* Left content */}
        <div className="hero-content">
          <h1 className="hero-title">
            Crafted with <span className="highlight">Passion</span>, Served with a <span className="highlight">Smile</span>
          </h1>
          <p className="hero-description">
            A bakery or cake shop is an establishment that primarily offers a variety of freshly baked goods such as cakes, pastries, cookies, and bread, made with quality ingredients and crafted with care.
          </p>
        </div>

        {/* Right image */}
        <div className="hero-image">
          <img 
            src="https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&q=80" 
            alt="Coffee shop interior" 
          />
        </div>
      </div>
    </section>
  )
}