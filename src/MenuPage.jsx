import React from 'react'
import Header from './Header'
import SocialSidebar from './SocialSidebar'
import ChatButton from './ChatButton'
import Footer from './Footer'
import './MenuPage.css'

export default function MenuPage() {
  const menuData = {
    birthdayCakes: {
      icon: '🎂',
      title: 'Birthday Cakes',
      items: [
        { id: 1, name: 'Chocolate Birthday Cake', price: 45.00, description: 'Rich chocolate layers with vanilla cream filling', badge: 'SPECIAL', icon: '🎂' },
        { id: 2, name: 'Strawberry Delight', price: 42.00, description: 'Fresh strawberries with whipped cream frosting', icon: '🍓' },
        { id: 3, name: 'Red Velvet Cake', price: 48.00, description: 'Classic red velvet with cream cheese frosting', badge: 'POPULAR', icon: '❤️' },
        { id: 4, name: 'Rainbow Birthday Cake', price: 50.00, description: 'Colorful layers perfect for kids parties', badge: 'NEW', icon: '🌈' },
        { id: 5, name: 'Vanilla Dream Cake', price: 40.00, description: 'Light vanilla sponge with buttercream', icon: '🎂' }
      ]
    },
    americanCakes: {
      icon: '🥐',
      title: 'American & Savory Cakes',
      items: [
        { id: 6, name: 'New York Cheesecake', price: 35.00, description: 'Creamy classic cheesecake with graham crust', badge: 'SPECIAL', icon: '🍰' },
        { id: 7, name: 'Carrot Cake', price: 32.00, description: 'Moist carrot cake with cream cheese frosting', icon: '🥕' },
        { id: 8, name: 'Savory Quiche', price: 28.00, description: 'Bacon, spinach and cheese quiche', icon: '🥧' },
        { id: 9, name: 'Meat Pie', price: 30.00, description: 'Beef and vegetable filled pastry', icon: '🥖' },
        { id: 10, name: 'Apple Pie', price: 25.00, description: 'Traditional American apple pie with cinnamon', badge: 'POPULAR', icon: '🍎' }
      ]
    },
    cookiesMinicakes: {
      icon: '🍪',
      title: 'Cookies & Minicake',
      items: [
        { id: 11, name: 'Chocolate Chip Cookies', price: 12.00, description: 'Classic cookies with chocolate chips (6 pcs)', badge: 'BESTSELLER', icon: '🍪' },
        { id: 12, name: 'Oatmeal Raisin Cookies', price: 11.00, description: 'Healthy oatmeal cookies with raisins (6 pcs)', icon: '🍪' },
        { id: 13, name: 'Red Velvet Cupcake', price: 8.00, description: 'Mini red velvet with cream cheese frosting', badge: 'NEW', icon: '🧁' },
        { id: 14, name: 'Chocolate Brownie', price: 9.50, description: 'Fudgy chocolate brownie square', icon: '🍫' },
        { id: 15, name: 'Lemon Tart', price: 10.00, description: 'Tangy lemon curd in buttery crust', icon: '🍋' },
        { id: 16, name: 'Macarons Assorted', price: 15.00, description: 'French macarons in various flavors (5 pcs)', badge: 'SPECIAL', icon: '🎀' }
      ]
    },
    freshJuice: {
      icon: '🍊',
      title: 'Fresh Juice',
      items: [
        { id: 17, name: 'Orange Juice', price: 5.50, description: 'Freshly squeezed orange juice', icon: '🍊' },
        { id: 18, name: 'Green Detox Juice', price: 6.50, description: 'Spinach, apple, cucumber and lemon', badge: 'HEALTHY', icon: '🥬' },
        { id: 19, name: 'Carrot Ginger Juice', price: 6.00, description: 'Fresh carrot with a hint of ginger', icon: '🥕' },
        { id: 20, name: 'Watermelon Juice', price: 5.00, description: 'Refreshing watermelon juice', icon: '🍉' }
      ]
    },
    smoothies: {
      icon: '🥤',
      title: 'Smoothies',
      items: [
        { id: 21, name: 'Berry Blast Smoothie', price: 7.50, description: 'Mixed berries, banana and yogurt', badge: 'POPULAR', icon: '🫐' },
        { id: 22, name: 'Mango Paradise', price: 7.00, description: 'Mango, pineapple and coconut milk', icon: '🥭' },
        { id: 23, name: 'Green Power Smoothie', price: 8.00, description: 'Spinach, banana, avocado and almond milk', badge: 'HEALTHY', icon: '🥑' },
        { id: 24, name: 'Chocolate Banana Shake', price: 6.50, description: 'Banana, cocoa and milk', icon: '🍌' }
      ]
    },
    teaCoffee: {
      icon: '☕',
      title: 'Tea & Coffee',
      items: [
        { id: 25, name: 'Espresso', price: 3.50, description: 'Rich Italian espresso shot', icon: '☕' },
        { id: 26, name: 'Cappuccino', price: 4.50, description: 'Espresso with steamed milk foam', badge: 'POPULAR', icon: '☕' },
        { id: 27, name: 'Caramel Latte', price: 5.00, description: 'Latte with sweet caramel syrup', icon: '☕' },
        { id: 28, name: 'Iced Americano', price: 4.00, description: 'Chilled espresso with cold water', icon: '🧊' },
        { id: 29, name: 'English Breakfast Tea', price: 3.00, description: 'Classic black tea blend', icon: '🫖' },
        { id: 30, name: 'Green Tea Latte', price: 4.50, description: 'Matcha green tea with steamed milk', badge: 'HEALTHY', icon: '🍵' }
      ]
    }
  }

  // Component render category
  const renderCategory = (categoryKey) => {
    const category = menuData[categoryKey]
    return (
      <div className="menu-category">
        <div className="category-header">
          <span className="category-icon">{category.icon}</span>
          <h2 className="category-title">
            {category.title.split(' ').slice(0, -1).join(' ')}{' '}
            <span className="highlight">{category.title.split(' ').slice(-1)}</span>
          </h2>
        </div>
        <div className="menu-items">
          {category.items.map(item => (
            <div key={item.id} className="menu-item">
              <div className="item-header">
                <div className="item-name-wrapper">
                  <span className="item-icon">{item.icon}</span>
                  <span className="item-name">{item.name}</span>
                  {item.badge && (
                    <span className={`item-badge badge-${item.badge.toLowerCase()}`}>
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className="item-dots"></span>
                <span className="item-price">${item.price.toFixed(2)}</span>
              </div>
              <p className="item-description">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="menu-page">
      <Header />
      
      {/* Page Banner */}
      <section className="page-banner">
        <div className="page-banner-container">
          <h1 className="page-title">Our Menu</h1>
          <div className="breadcrumb">
            <a href="/">🏠</a>
            <span className="separator">»</span>
            <span>Menu</span>
          </div>
        </div>
      </section>

      {/* ========== MENU DARK THEME - BAKERY ITEMS ========== */}
      <section className="menu-section menu-section-dark">
        <div className="menu-container">
          {renderCategory('birthdayCakes')}
          {renderCategory('americanCakes')}
          {renderCategory('cookiesMinicakes')}
          {renderCategory('freshJuice')}
        </div>
      </section>

      {/* ========== MENU LIGHT THEME - BEVERAGES ========== */}
      <section className="menu-section menu-section-light">
        <div className="menu-container">
          {renderCategory('smoothies')}
          {renderCategory('teaCoffee')}
          {renderCategory('birthdayCakes')}
          {renderCategory('cookiesMinicakes')}
        </div>
      </section>

      <SocialSidebar />
      <ChatButton />
      <Footer />
    </div>
  )
}