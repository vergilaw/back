import React, { useState } from 'react'
import Header from './Header'
import SocialSidebar from './SocialSidebar'
import ChatButton from './ChatButton'
import Footer from './Footer'
import './FAQPage.css'

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState(0) // FAQ đầu tiên mở mặc định
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    department: 'Business Department',
    question: ''
  })

  const faqs = [
    {
      id: 1,
      question: 'What are your opening hours?',
      answer: 'We are open daily from 8:00 AM to 10:00 PM. Weekend hours may vary during holidays and special events.'
    },
    {
      id: 2,
      question: 'Do you offer non-dairy or plant-based milk options?',
      answer: 'Yes! We offer a variety of alternatives including oat milk, almond milk, soy milk, and coconut milk.'
    },
    {
      id: 3,
      question: 'Can I reserve a table in advance?',
      answer: 'Absolutely. You can reserve a table by calling us directly or using the reservation form on our website.'
    },
    {
      id: 4,
      question: 'Do you have Wi-Fi available for customers?',
      answer: 'Yes, we provide free high-speed Wi-Fi for all our customers. Just ask our staff for the password!'
    },
    {
      id: 5,
      question: 'Are your coffee beans locally sourced or imported?',
      answer: 'We source our premium coffee beans from both local roasters and certified international suppliers to ensure the highest quality.'
    },
    {
      id: 6,
      question: 'Can I host a private event or meeting at your cafe?',
      answer: 'Yes! We have dedicated spaces for private events and meetings. Please contact us to discuss your requirements and availability.'
    }
  ]

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    console.log('Form submitted:', formData)
    alert('Thank you! Your question has been sent.')
    // Reset form
    setFormData({
      name: '',
      email: '',
      subject: '',
      department: 'Business Department',
      question: ''
    })
  }

  return (
    <div className="faq-page">
      <Header />
      
      {/* Page Banner */}
      <section className="page-banner">
        <div className="page-banner-container">
          <h1 className="page-title">FAQ</h1>
          <div className="breadcrumb">
            <a href="/">🏠</a>
            <span className="separator">»</span>
            <span>FAQ</span>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="faq-section">
        <div className="faq-container">
          {/* Left Column - Hero & Form */}
          <div className="faq-left">
            {/* Hero */}
            <div className="faq-hero">
              <img 
                src="https://images.unsplash.com/photo-1511920170033-f8396924c348?w=600&q=80" 
                alt="Espresso Machine" 
                className="hero-image"
              />
              <div className="hero-content">
                <h2 className="hero-title">
                  Do You Have Any <span className="highlight">Questions?</span>
                </h2>
                <p className="hero-text">
                  Please read questions bellow and if you can not find your answer, 
                  please send us your question. we will answer you as soon as possible.
                </p>
                <div className="faqs-badge">
                  <span className="badge-icon">❓</span>
                  <span className="badge-text">F.A.Qs</span>
                </div>
              </div>
            </div>

            {/* Ask Form */}
            <div className="ask-form-section">
              <div className="ask-header">
                <span className="ask-icon">💬</span>
                <h3 className="ask-title">ASK US</h3>
              </div>
              <form onSubmit={handleSubmit} className="ask-form">
                <div className="form-group">
                  <label>Your Name (*)</label>
                  <input 
                    type="text" 
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Your Email (*)</label>
                  <input 
                    type="email" 
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Subject</label>
                  <input 
                    type="text" 
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label>Department</label>
                  <select 
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                  >
                    <option>Business Department</option>
                    <option>Customer Service</option>
                    <option>Technical Support</option>
                    <option>Catering & Events</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Your Question</label>
                  <textarea 
                    name="question"
                    rows="5"
                    value={formData.question}
                    onChange={handleInputChange}
                    required
                  ></textarea>
                </div>
                <button type="submit" className="ask-button">Ask</button>
              </form>
            </div>
          </div>

          {/* Right Column - FAQ Accordion */}
          <div className="faq-right">
            <div className="faq-list">
              {faqs.map((faq, index) => (
                <div 
                  key={faq.id} 
                  className={`faq-item ${openIndex === index ? 'active' : ''}`}
                >
                  <button 
                    className="faq-question"
                    onClick={() => toggleFAQ(index)}
                  >
                    <span>{faq.question}</span>
                    <span className="faq-icon">
                      {openIndex === index ? '▲' : '▼'}
                    </span>
                  </button>
                  <div className={`faq-answer ${openIndex === index ? 'open' : ''}`}>
                    <p>{faq.answer}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <SocialSidebar />
      <ChatButton />
      <Footer />
    </div>
  )
}