import { useState, useEffect } from 'react'
import Header from './Header'
import SocialSidebar from './SocialSidebar'
import ChatButton from './ChatButton'
import Footer from './Footer'
import { useAuth } from './contexts/AuthContext'
import { useCart } from './contexts/CartContext'
import { useToast } from './contexts/ToastContext'
import LoginModal from './LoginModal'
import './ShopPage.css'

const API_URL = 'http://localhost:8000/api'

export default function ShopPage() {
  const { user } = useAuth()
  const { addToCart } = useCart()
  const toast = useToast()
  const [showLogin, setShowLogin] = useState(false)
  const [addingId, setAddingId] = useState(null)
  const [viewMode, setViewMode] = useState(4)
  const [itemsPerPage, setItemsPerPage] = useState(12)
  const [sortBy, setSortBy] = useState('default')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  // Fetch products from API
  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const res = await fetch(`${API_URL}/products?limit=100`)
      if (res.ok) {
        const data = await res.json()
        if (data.length > 0) {
          setProducts(data)
          setLoading(false)
          return
        }
      }
    } catch (err) {
      console.log('API not available, using static data')
    }
    // Fallback to static data
    setProducts(staticProducts)
    setLoading(false)
  }

  // ===== STATIC DATA FALLBACK =====
  const categories = [
    { id: 'all', name: 'All Products', count: 0 },
    { id: 'birthday-cakes', name: 'Birthday Cakes', count: 0 },
    { id: 'bread-savory', name: 'Bread & Savory', count: 0 },
    { id: 'cookies-minicakes', name: 'Cookies & Minicakes', count: 0 },
    { id: 'beverages', name: 'Beverages', count: 0 }
  ]

  const staticProducts = [
    // ===== BIRTHDAY CAKES =====
    { 
      id: 1, 
      name: 'Chocolate Birthday Cake', 
      price: 45.00, 
      category: 'birthday-cakes',
      description: 'Rich chocolate layers with vanilla cream filling',
      image: 'https://images.unsplash.com/photo-1558636508-e0db3814bd1d?w=400&q=80'
    },
    { 
      id: 2, 
      name: 'Strawberry Delight Cake', 
      price: 42.00, 
      category: 'birthday-cakes',
      description: 'Fresh strawberries with whipped cream frosting',
      image: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=400&q=80'
    },
    { 
      id: 3, 
      name: 'Red Velvet Cake', 
      price: 48.00, 
      category: 'birthday-cakes',
      description: 'Classic red velvet with cream cheese frosting',
      image: 'https://images.unsplash.com/photo-1586985289688-ca3cf47d3e6e?w=400&q=80'
    },
    { 
      id: 4, 
      name: 'Rainbow Birthday Cake', 
      price: 50.00, 
      category: 'birthday-cakes',
      description: 'Colorful layers perfect for kids parties',
      image: 'https://images.unsplash.com/photo-1588195538326-c5b1e5b80804?w=400&q=80'
    },
    { 
      id: 5, 
      name: 'Vanilla Dream Cake', 
      price: 40.00, 
      category: 'birthday-cakes',
      description: 'Light vanilla sponge with buttercream',
      image: 'https://images.unsplash.com/photo-1535141192574-5d4897c12636?w=400&q=80'
    },
    { 
      id: 6, 
      name: 'Tiramisu Cake', 
      price: 52.00, 
      category: 'birthday-cakes',
      description: 'Italian coffee-flavored dessert cake',
      image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400&q=80'
    },

    // ===== BREAD & SAVORY =====
    { 
      id: 7, 
      name: 'Croissant', 
      price: 4.50, 
      category: 'bread-savory',
      description: 'Buttery French pastry, perfectly flaky',
      image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400&q=80'
    },
    { 
      id: 8, 
      name: 'Sourdough Bread', 
      price: 8.00, 
      category: 'bread-savory',
      description: 'Artisan sourdough with crispy crust',
      image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&q=80'
    },
    { 
      id: 9, 
      name: 'Cheese Danish', 
      price: 5.50, 
      category: 'bread-savory',
      description: 'Sweet pastry filled with cream cheese',
      image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&q=80'
    },
    { 
      id: 10, 
      name: 'Savory Quiche', 
      price: 12.00, 
      category: 'bread-savory',
      description: 'Bacon, spinach and cheese quiche',
      image: 'https://images.unsplash.com/photo-1621743478914-cc8a86d7e9d5?w=400&q=80'
    },
    { 
      id: 11, 
      name: 'Baguette', 
      price: 6.00, 
      category: 'bread-savory',
      description: 'Traditional French bread loaf',
      image: 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=400&q=80'
    },
    { 
      id: 12, 
      name: 'Garlic Bread', 
      price: 7.50, 
      category: 'bread-savory',
      description: 'Toasted bread with garlic butter',
      image: 'https://images.unsplash.com/photo-1573140247632-f8fd74997d5c?w=400&q=80'
    },

    // ===== COOKIES & MINICAKES =====
    { 
      id: 13, 
      name: 'Chocolate Chip Cookies', 
      price: 12.00, 
      category: 'cookies-minicakes',
      description: 'Classic cookies with chocolate chips (6 pcs)',
      image: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=400&q=80'
    },
    { 
      id: 14, 
      name: 'Oatmeal Raisin Cookies', 
      price: 11.00, 
      category: 'cookies-minicakes',
      description: 'Healthy oatmeal cookies with raisins (6 pcs)',
      image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400&q=80'
    },
    { 
      id: 15, 
      name: 'Red Velvet Cupcake', 
      price: 8.00, 
      category: 'cookies-minicakes',
      description: 'Mini red velvet with cream cheese frosting',
      image: 'https://images.unsplash.com/photo-1614707267537-b85aaf00c4b7?w=400&q=80'
    },
    { 
      id: 16, 
      name: 'Chocolate Brownie', 
      price: 9.50, 
      category: 'cookies-minicakes',
      description: 'Fudgy chocolate brownie square',
      image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400&q=80'
    },
    { 
      id: 17, 
      name: 'Macarons Assorted', 
      price: 15.00, 
      category: 'cookies-minicakes',
      description: 'French macarons in various flavors (5 pcs)',
      image: 'https://images.unsplash.com/photo-1571506165871-ee72a35bc9d4?w=400&q=80'
    },
    { 
      id: 18, 
      name: 'Blueberry Muffin', 
      price: 6.50, 
      category: 'cookies-minicakes',
      description: 'Fresh blueberries baked into soft muffin',
      image: 'https://images.unsplash.com/photo-1607958996333-41aef7caefaa?w=400&q=80'
    },

    // ===== BEVERAGES =====
    { 
      id: 19, 
      name: 'Espresso', 
      price: 3.50, 
      category: 'beverages',
      description: 'Rich Italian espresso shot',
      image: 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=400&q=80'
    },
    { 
      id: 20, 
      name: 'Cappuccino', 
      price: 4.50, 
      category: 'beverages',
      description: 'Espresso with steamed milk foam',
      image: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=400&q=80'
    },
    { 
      id: 21, 
      name: 'Caramel Latte', 
      price: 5.00, 
      category: 'beverages',
      description: 'Latte with sweet caramel syrup',
      image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&q=80'
    },
    { 
      id: 22, 
      name: 'Iced Americano', 
      price: 4.00, 
      category: 'beverages',
      description: 'Chilled espresso with cold water',
      image: 'https://images.unsplash.com/photo-1517487881594-2787fef5ebf7?w=400&q=80'
    },
    { 
      id: 23, 
      name: 'Fresh Orange Juice', 
      price: 5.50, 
      category: 'beverages',
      description: 'Freshly squeezed orange juice',
      image: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400&q=80'
    },
    { 
      id: '24', 
      name: 'Berry Smoothie', 
      price: 6.50, 
      category: 'beverages',
      description: 'Mixed berries, banana and yogurt',
      image: 'https://images.unsplash.com/photo-1505252585461-04db1eb84625?w=400&q=80'
    }
  ]

  if (loading) {
    return (
      <div className="shop-page">
        <Header />
        <section className="page-banner">
          <div className="page-banner-container">
            <h1 className="page-title">Shop</h1>
          </div>
        </section>
        <section className="shop-section">
          <div className="shop-container">
            <p style={{color: 'white', textAlign: 'center', padding: '3rem'}}>Loading products...</p>
          </div>
        </section>
        <Footer />
      </div>
    )
  }

  // Đếm số sản phẩm mỗi category
  const categoriesWithCount = categories.map(cat => ({
    ...cat,
    count: cat.id === 'all' 
      ? products.length 
      : products.filter(p => p.category === cat.id).length
  }))

  // Filter theo category
  const filteredProducts = selectedCategory === 'all'
    ? products
    : products.filter(p => p.category === selectedCategory)

  // Sorting
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case 'price-low':
        return a.price - b.price
      case 'price-high':
        return b.price - a.price
      case 'name-az':
        return a.name.localeCompare(b.name)
      case 'name-za':
        return b.name.localeCompare(a.name)
      default:
        return 0
    }
  })

  // Pagination
  const totalPages = Math.ceil(sortedProducts.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentProducts = sortedProducts.slice(startIndex, endIndex)

  // Handle category change
  const handleCategoryChange = (categoryId) => {
    setSelectedCategory(categoryId)
    setCurrentPage(1) // Reset to page 1
  }

  // Check if using API data (has MongoDB ObjectId format)
  const isApiData = products.length > 0 && typeof products[0].id === 'string' && products[0].id.length === 24

  // Handle add to cart
  const handleAddToCart = async (product) => {
    if (!user) {
      setShowLogin(true)
      return
    }
    if (!isApiData) {
      toast.warning('Demo mode: Please add products to database first')
      return
    }
    setAddingId(product.id)
    try {
      await addToCart(product.id, 1)
      toast.success(`${product.name} đã thêm vào giỏ hàng!`)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setAddingId(null)
    }
  }

  return (
    <div className="shop-page">
      <Header />
      
      {/* Page Banner */}
      <section className="page-banner">
        <div className="page-banner-container">
          <h1 className="page-title">Shop</h1>
          <div className="breadcrumb">
            <a href="/">🏠</a>
            <span className="separator">»</span>
            <span>Shop</span>
          </div>
        </div>
      </section>

      {/* Shop Section */}
      <section className="shop-section">
        <div className="shop-container">
          
          {/* Category Filter Sidebar */}
          <aside className="shop-sidebar">
            <h3 className="sidebar-title">Categories</h3>
            <ul className="category-list">
              {categoriesWithCount.map(cat => (
                <li key={cat.id}>
                  <button
                    className={`category-btn ${selectedCategory === cat.id ? 'active' : ''}`}
                    onClick={() => handleCategoryChange(cat.id)}
                  >
                    <span className="category-name">{cat.name}</span>
                    <span className="category-count">({cat.count})</span>
                  </button>
                </li>
              ))}
            </ul>
          </aside>

          {/* Main Content */}
          <div className="shop-main">
            {/* Toolbar */}
            <div className="shop-toolbar">
              <div className="toolbar-left">
                <p className="results-count">
                  Showing {startIndex + 1}–{Math.min(endIndex, sortedProducts.length)} of {sortedProducts.length} results
                </p>
              </div>

              <div className="toolbar-right">
                {/* View Mode */}
                <div className="view-mode">
                  <button 
                    className={`view-btn ${viewMode === 2 ? 'active' : ''}`}
                    onClick={() => setViewMode(2)}
                    title="2 columns"
                  >
                    <span className="grid-icon grid-2"></span>
                  </button>
                  <button 
                    className={`view-btn ${viewMode === 3 ? 'active' : ''}`}
                    onClick={() => setViewMode(3)}
                    title="3 columns"
                  >
                    <span className="grid-icon grid-3"></span>
                  </button>
                  <button 
                    className={`view-btn ${viewMode === 4 ? 'active' : ''}`}
                    onClick={() => setViewMode(4)}
                    title="4 columns"
                  >
                    <span className="grid-icon grid-4"></span>
                  </button>
                </div>

                {/* Items per page */}
                <select 
                  className="toolbar-select"
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value))
                    setCurrentPage(1)
                  }}
                >
                  <option value={12}>12 Products</option>
                  <option value={24}>24 Products</option>
                  <option value={36}>36 Products</option>
                  <option value={sortedProducts.length}>All Products</option>
                </select>

                {/* Sort */}
                <select 
                  className="toolbar-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="default">Default Sorting</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="name-az">Name: A to Z</option>
                  <option value="name-za">Name: Z to A</option>
                </select>
              </div>
            </div>

            {/* Product Grid */}
            <div className={`product-grid cols-${viewMode}`}>
              {currentProducts.map(product => (
                <div key={product.id} className="product-card">
                  <div className="product-image-wrapper">
                    <img src={product.image} alt={product.name} className="product-image" />
                    <button 
                      className="add-to-cart-btn"
                      onClick={() => handleAddToCart(product)}
                      disabled={addingId === product.id}
                    >
                      {addingId === product.id ? '...' : '🛒 Add to Cart'}
                    </button>
                  </div>
                  <div className="product-info">
                    <h3 className="product-name">{product.name}</h3>
                    <p className="product-price">${product.price.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Empty State */}
            {currentProducts.length === 0 && (
              <div className="empty-state">
                <p>No products found in this category.</p>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pagination">
                <button 
                  className="page-btn"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  ←
                </button>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    className={`page-btn ${currentPage === page ? 'active' : ''}`}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </button>
                ))}
                
                <button 
                  className="page-btn"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  →
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      <SocialSidebar />
      <ChatButton />
      <Footer />
      <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} />
    </div>
  )
}