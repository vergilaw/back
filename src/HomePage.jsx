import React from 'react'
import Header from './Header'
import HeroSection from './HeroSection'
import SocialSidebar from './SocialSidebar'
import ChatButton from './ChatButton'
import './HomePage.css'
import Footer from './Footer'

export default function HomePage() {
  return (
    <div className="home-page">
      <Header />
      <HeroSection />
      <SocialSidebar />
      <ChatButton />
      <Footer />
    </div>
  )
}