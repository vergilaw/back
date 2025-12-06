import React from 'react'
import { Routes, Route } from 'react-router-dom'
import HomePage from './HomePage'
import AboutPage from './AboutPage'
import MenuPage from './MenuPage'
import FAQPage from './FAQPage'
import ContactPage from './ContactPage'
import ShopPage from './ShopPage'
import './App.css'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/menu" element={<MenuPage />} />  {/* ← THÊM */}
      <Route path="/faq" element={<FAQPage />} />    {/* ← THÊM */}
      <Route path="/contact" element={<ContactPage />} />  {/* ← THÊM */}
      <Route path="/shop" element={<ShopPage />} />  {/* ← THÊM */}
    </Routes>
  )
}