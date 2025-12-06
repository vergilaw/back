import React, { useState } from 'react'
import Header from './Header'
import SocialSidebar from './SocialSidebar'
import ChatButton from './ChatButton'
import './AboutPage.css'
import Footer from './Footer'

export default function AboutPage() {
  // State cho testimonials slider
  const [currentSlide, setCurrentSlide] = useState(0)

  const testimonials = [
    {
      id: 1,
      text: "XTRA Cafe is my go-to spot for amazing coffee and a relaxing vibe. The staff are always friendly and kind, and the desserts are next-level. Whether I'm working or catching up with friends and family, it's the perfect place to be.",
      name: "Jane Carter",
      role: "Artist",
      avatar: "https://randomuser.me/api/portraits/women/44.jpg"
    },
    {
      id: 2,
      text: "I love the cozy ambiance and top-notch service at XTRA Cafe. Their specialty lattes and fresh pastries never disappoint. It's a hidden gem that combines great taste, comfort, and great music—definitely a must-visit in town!",
      name: "David Smith",
      role: "Student",
      avatar: "https://randomuser.me/api/portraits/men/32.jpg"
    },
    {
      id: 3,
      text: "The best coffee shop in the city! Every visit feels like coming home. The baristas remember my order, and the atmosphere is perfect for both work and relaxation. Highly recommended!",
      name: "Sarah Johnson",
      role: "Designer",
      avatar: "https://randomuser.me/api/portraits/women/68.jpg"
    },
    {
      id: 4,
      text: "Amazing place with incredible coffee! The interior design is beautiful, and the staff are wonderful. I bring all my clients here for meetings. It never disappoints!",
      name: "Michael Brown",
      role: "Entrepreneur",
      avatar: "https://randomuser.me/api/portraits/men/52.jpg"
    }
  ]

  // Data cho Expert Chefs
  const chefs = [
    {
      id: 1,
      name: "Jimmy Roland",
      role: "Founder",
      image: "https://images.unsplash.com/photo-1583394293214-28ded15ee548?w=400&q=80"
    },
    {
      id: 2,
      name: "Nicolas Xavier",
      role: "Chef",
      image: "https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=400&q=80"
    },
    {
      id: 3,
      name: "Alex Hernandez",
      role: "Chef",
      image: "https://images.unsplash.com/photo-1624947506148-f1c85bfe68b1?w=400&q=80"
    },
    {
      id: 4,
      name: "Robert Gray",
      role: "Waiter",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80"
    }
  ]

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 2 >= testimonials.length ? 0 : prev + 2))
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 2 < 0 ? testimonials.length - 2 : prev - 2))
  }

  const totalPages = Math.ceil(testimonials.length / 2)
  const currentPage = Math.floor(currentSlide / 2)

  return (
    <div className="about-page">
      <Header />
      
      {/* Page Banner */}
      <section className="page-banner">
        <div className="page-banner-container">
          <h1 className="page-title">About</h1>
          <div className="breadcrumb">
            <a href="/">🏠</a>
            <span className="separator">»</span>
            <span>About</span>
          </div>
        </div>
      </section>

      {/* Our History Section */}
      <section className="our-history">
        <div className="our-history-container">
          <div className="history-content">
            <h2 className="section-title">
              Our <span className="highlight">History</span>
            </h2>
            <p className="history-text">
              Founded in 1998 in the heart of New York City, XTRA Cafe began as a cozy neighborhood spot with a passion for premium coffee and warm hospitality. Over the years, it grew into a global brand, now proudly serving customers in over 90 branches worldwide, while staying true to its original charm and quality.
            </p>
          </div>
          <div className="history-image">
            <img 
              src="https://images.unsplash.com/photo-1559305616-3f99cd43e353?w=800&q=80" 
              alt="Coffee shop interior with menu boards" 
            />
          </div>
        </div>
      </section>

      {/* Stats Counter */}
      <section className="stats-section">
        <div className="stats-container">
          <div className="stat-item">
            <div className="stat-number">14<span className="plus">+</span></div>
            <div className="stat-label">Meeting Rooms</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">56<span className="plus">+</span></div>
            <div className="stat-label">Menu Items</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">170<span className="k">k</span></div>
            <div className="stat-label">Coffee Served</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">90<span className="plus">+</span></div>
            <div className="stat-label">Town Branches</div>
          </div>
        </div>
      </section>

      {/* Enjoy Having Section */}
      <section className="enjoy-section">
        <div className="enjoy-container">
          <div className="enjoy-image">
            <img 
              src="https://images.unsplash.com/photo-1600093463592-8e36ae95ef56?w=600&q=80" 
              alt="Barista making coffee" 
            />
          </div>
          <div className="enjoy-content">
            <h2 className="section-title">
              <span className="highlight">Enjoy</span> Having Fun & Making <span className="highlight">Progress</span>
            </h2>
            <p className="enjoy-text">
              At XTRA Cafe, we believe in creating a space where people can relax, connect, and be productive. Whether you're here for a quick espresso or a long work session, we provide the perfect atmosphere to enjoy your time and make progress on what matters most.
            </p>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="testimonials-section">
        <div className="testimonials-container">
          <h2 className="section-title-center">
            Our <span className="highlight">Testimonials</span>
          </h2>

          <div className="testimonials-slider">
            <button className="slider-btn prev-btn" onClick={prevSlide} aria-label="Previous testimonials">
              ←
            </button>

            <div className="testimonials-cards">
              {testimonials.slice(currentSlide, currentSlide + 2).map((testimonial) => (
                <div key={testimonial.id} className="testimonial-card">
                  <p className="testimonial-text">"{testimonial.text}"</p>
                  <div className="testimonial-author">
                    <img 
                      src={testimonial.avatar} 
                      alt={testimonial.name}
                      className="author-avatar"
                    />
                    <div className="author-info">
                      <div className="author-name">{testimonial.name}</div>
                      <div className="author-role">{testimonial.role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button className="slider-btn next-btn" onClick={nextSlide} aria-label="Next testimonials">
              →
            </button>
          </div>

          <div className="slider-dots">
            {Array.from({ length: totalPages }).map((_, index) => (
              <button
                key={index}
                className={`dot ${currentPage === index ? 'active' : ''}`}
                onClick={() => setCurrentSlide(index * 2)}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Expert Chefs Section - PHẦN MỚI */}
      <section className="chefs-section">
        <div className="chefs-container">
          <h2 className="section-title-center-dark">
            Our <span className="highlight">Expert Chefs</span>
          </h2>
          <p className="chefs-subtitle">Meet our professional team members</p>

          <div className="chefs-grid">
            {chefs.map((chef) => (
              <div key={chef.id} className="chef-card">
                <div className="chef-image">
                  <img src={chef.image} alt={chef.name} />
                </div>
                <div className="chef-info">
                  <h3 className="chef-name">{chef.name}</h3>
                  <p className="chef-role">{chef.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <SocialSidebar />
      <ChatButton />
      <Footer />
    </div>
  )
}