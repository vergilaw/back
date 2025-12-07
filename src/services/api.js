const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

class ApiService {
  constructor() {
    this.baseURL = 'http://localhost:8000'
  }

  /**
   * Generic request method with 401 auto-logout
   */
  async request(method, endpoint, data = null, params = null) {
    const url = new URL(`${this.baseURL}${endpoint}`)
    
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined) {
          url.searchParams.append(key, params[key])
        }
      })
    }

    const headers = {
      'Content-Type': 'application/json',
    }

    const token = localStorage.getItem('token')
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const options = {
      method,
      headers,
    }

    if (data && method !== 'GET') {
      options.body = JSON.stringify(data)
    }

    try {
      const response = await fetch(url.toString(), options)

      // ✅ AUTO LOGOUT KHI 401
      if (response.status === 401) {
        console.error('❌ 401 Unauthorized - Logging out...')
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        
        if (window.location.pathname !== '/auth') {
          alert('⚠️ Session expired. Please login again.')
          window.location.href = '/auth'
        }
        
        throw new Error('Session expired')
      }

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`
        try {
          const errorData = await response.json()
          errorMessage = errorData.detail || errorData.message || errorMessage
        } catch (e) {
          // Cannot parse error as JSON
        }
        throw new Error(errorMessage)
      }

      const contentType = response.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        return await response.json()
      } else {
        return await response.text()
      }
    } catch (error) {
      console.error(`Error fetching ${endpoint}:`, error)
      throw error
    }
  }

  // ============ PRODUCTS API ============

  /**
   * Get products with pagination and filters
   * @param {Object} params - { skip, limit, category, search, page }
   */
  async getProducts(params = {}) {
    const queryParams = new URLSearchParams()
    
    // Backend dùng skip/limit thay vì page
    if (params.page && params.limit) {
      const skip = (params.page - 1) * params.limit
      queryParams.append('skip', skip)
      queryParams.append('limit', params.limit)
    } else {
      if (params.skip !== undefined) queryParams.append('skip', params.skip)
      if (params.limit) queryParams.append('limit', params.limit)
    }
    
    // Category filter (không gửi 'all')
    if (params.category && params.category !== 'all') {
      queryParams.append('category', params.category)
    }
    
    // Search
    if (params.search) {
      queryParams.append('search', params.search)
    }
    
    const url = `${API_URL}/products?${queryParams.toString()}`
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const products = await response.json()
      
      // Backend trả về array, phải tự tính pagination
      return products
      
    } catch (error) {
      console.error('Error fetching products:', error)
      throw error
    }
  }

  /**
   * Get product count
   * @param {string} category - Category ID or null for all
   */
  async getProductCount(category = null) {
    const url = category && category !== 'all'
      ? `${API_URL}/products/count?category=${category}`
      : `${API_URL}/products/count`
    
    try {
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      return data.count
      
    } catch (error) {
      console.error('Error fetching product count:', error)
      throw error
    }
  }

  /**
   * Get categories with product count
   */
  async getCategories() {
    try {
      const response = await fetch(`${API_URL}/products/categories`, {
        headers: {
          'Content-Type': 'application/json',
        }
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      return await response.json()
      
    } catch (error) {
      console.error('Error fetching categories:', error)
      throw error
    }
  }

  /**
   * Get single product by ID
   * @param {string} id - Product ID
   */
  async getProduct(id) {
    try {
      const response = await fetch(`${API_URL}/products/${id}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      return await response.json()
      
    } catch (error) {
      console.error('Error fetching product:', error)
      throw error
    }
  }

  // ============ ADMIN PRODUCT CRUD ============

  /**
   * Create new product (ADMIN)
   * @param {Object} productData
   */
  async createProduct(productData) {
    const token = localStorage.getItem('token')
    
    try {
      const response = await fetch(`${API_URL}/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(productData),
      })

      if (response.status === 401) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        if (window.location.pathname !== '/auth') {
          alert('⚠️ Session expired. Please login again.')
          window.location.href = '/auth'
        }
        throw new Error('Session expired')
      }

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || `Create product failed: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error creating product:', error)
      throw error
    }
  }

  /**
   * Update product (ADMIN)
   * @param {string} id - product ID
   * @param {Object} productData
   */
  async updateProduct(id, productData) {
    const token = localStorage.getItem('token')
    
    try {
      const response = await fetch(`${API_URL}/products/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(productData),
      })

      if (response.status === 401) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        if (window.location.pathname !== '/auth') {
          alert('⚠️ Session expired. Please login again.')
          window.location.href = '/auth'
        }
        throw new Error('Session expired')
      }

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || `Update product failed: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error updating product:', error)
      throw error
    }
  }

  /**
   * Delete product (ADMIN) – backend sẽ set is_available = false
   * @param {string} id
   */
  async deleteProduct(id) {
    const token = localStorage.getItem('token')
    
    try {
      const response = await fetch(`${API_URL}/products/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.status === 401) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        if (window.location.pathname !== '/auth') {
          alert('⚠️ Session expired. Please login again.')
          window.location.href = '/auth'
        }
        throw new Error('Session expired')
      }

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || `Delete product failed: ${response.status}`)
      }

      // Backend trả 204 No Content hoặc body rỗng
      return true
    } catch (error) {
      console.error('Error deleting product:', error)
      throw error
    }
  }

  // ============ FAVOURITES API ============

  /**
   * Get user's favourites with pagination
   * @param {Object} params - { skip, limit }
   */
  async getFavourites(params = {}) {
    const queryParams = new URLSearchParams()
    
    if (params.skip !== undefined) queryParams.append('skip', params.skip)
    if (params.limit) queryParams.append('limit', params.limit)
    
    const url = `${API_URL}/favourites?${queryParams.toString()}`
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      // ✅ Handle 401
      if (response.status === 401) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        if (window.location.pathname !== '/auth') {
          alert('⚠️ Session expired. Please login again.')
          window.location.href = '/auth'
        }
        throw new Error('Session expired')
      }
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      return await response.json()
      
    } catch (error) {
      console.error('Error fetching favourites:', error)
      throw error
    }
  }

  /**
   * Get count of user's favourites
   */
  async getFavouritesCount() {
    try {
      const response = await fetch(`${API_URL}/favourites/count`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (response.status === 401) {
        throw new Error('Session expired')
      }
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      return data.count
      
    } catch (error) {
      console.error('Error fetching favourites count:', error)
      throw error
    }
  }

  /**
   * Check if product is in favourites
   * @param {string} productId - Product ID
   */
  async checkIsFavourite(productId) {
    try {
      const response = await fetch(`${API_URL}/favourites/check/${productId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (response.status === 401) {
        throw new Error('Session expired')
      }
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      return data.is_favourite
      
    } catch (error) {
      console.error('Error checking favourite status:', error)
      throw error
    }
  }

  /**
   * Add product to favourites
   * @param {string} productId - Product ID
   */
  async addToFavourites(productId) {
    try {
      const response = await fetch(`${API_URL}/favourites/${productId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (response.status === 401) {
        throw new Error('Session expired')
      }
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || 'Failed to add to favourites')
      }
      
      return await response.json()
      
    } catch (error) {
      console.error('Error adding to favourites:', error)
      throw error
    }
  }

  /**
   * Remove product from favourites
   * @param {string} productId - Product ID
   */
  async removeFromFavourites(productId) {
    try {
      const response = await fetch(`${API_URL}/favourites/${productId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (response.status === 401) {
        throw new Error('Session expired')
      }
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || 'Failed to remove from favourites')
      }
      
      return await response.json()
      
    } catch (error) {
      console.error('Error removing from favourites:', error)
      throw error
    }
  }

  /**
   * Clear all favourites
   */
  async clearFavourites() {
    try {
      const response = await fetch(`${API_URL}/favourites`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (response.status === 401) {
        throw new Error('Session expired')
      }
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      return await response.json()
      
    } catch (error) {
      console.error('Error clearing favourites:', error)
      throw error
    }
  }

  // ============ CART API ============

  /**
   * Get user's cart
   */
  async getCart() {
    try {
      const response = await fetch(`${API_URL}/cart`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (response.status === 401) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        if (window.location.pathname !== '/auth') {
          alert('⚠️ Session expired. Please login again.')
          window.location.href = '/auth'
        }
        throw new Error('Session expired')
      }
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      return await response.json()
      
    } catch (error) {
      console.error('Error fetching cart:', error)
      throw error
    }
  }

  /**
   * Get cart total (subtotal, shipping, total)
   */
  async getCartTotal() {
    try {
      const response = await fetch(`${API_URL}/cart/total`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (response.status === 401) {
        throw new Error('Session expired')
      }
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      return await response.json()
      
    } catch (error) {
      console.error('Error fetching cart total:', error)
      throw error
    }
  }

  /**
   * Add product to cart
   * @param {string} productId - Product ID
   * @param {number} quantity - Quantity to add (default: 1)
   */
  async addToCart(productId, quantity = 1) {
    try {
      const response = await fetch(`${API_URL}/cart/${productId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ quantity })
      })
      
      if (response.status === 401) {
        throw new Error('Session expired')
      }
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || 'Failed to add to cart')
      }
      
      return await response.json()
      
    } catch (error) {
      console.error('Error adding to cart:', error)
      throw error
    }
  }

  /**
   * Update cart item quantity
   * @param {string} productId - Product ID
   * @param {number} quantity - New quantity (0 to remove)
   */
  async updateCartQuantity(productId, quantity) {
    try {
      const response = await fetch(`${API_URL}/cart/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ quantity })
      })
      
      if (response.status === 401) {
        throw new Error('Session expired')
      }
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || 'Failed to update cart')
      }
      
      return await response.json()
      
    } catch (error) {
      console.error('Error updating cart:', error)
      throw error
    }
  }

  /**
   * Remove item from cart
   * @param {string} productId - Product ID
   */
  async removeFromCart(productId) {
    try {
      const response = await fetch(`${API_URL}/cart/${productId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (response.status === 401) {
        throw new Error('Session expired')
      }
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || 'Failed to remove from cart')
      }
      
      return await response.json()
      
    } catch (error) {
      console.error('Error removing from cart:', error)
      throw error
    }
  }

  /**
   * Clear all items from cart
   */
  async clearCart() {
    try {
      const response = await fetch(`${API_URL}/cart`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (response.status === 401) {
        throw new Error('Session expired')
      }
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      return await response.json()
      
    } catch (error) {
      console.error('Error clearing cart:', error)
      throw error
    }
  }

  // ============ CHATBOT API ============

  /**
   * Send chat message
   * @param {string} message - User message
   */
  async chat(message) {
    return await this.request('POST', '/api/chatbot/chat', { message })
  }

  /**
   * Get chat history
   * @param {number} limit - Number of messages
   */
  async getChatHistory(limit = 10) {
    return await this.request('GET', `/api/chatbot/history?limit=${limit}`)
  }

  /**
   * Clear chat history
   */
  async clearChatHistory() {
    return await this.request('DELETE', '/api/chatbot/history')
  }
  // ...existing code...

// ============ INGREDIENTS API (ADMIN ONLY) ============

/**
 * Get all ingredients (Admin)
 */
async getIngredients() {
  const token = localStorage.getItem('token')
  
  try {
    const response = await fetch(`${API_URL}/ingredients`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    })
    
    if (response.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      if (window.location.pathname !== '/auth') {
        alert('⚠️ Session expired. Please login again.')
        window.location.href = '/auth'
      }
      throw new Error('Session expired')
    }
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error fetching ingredients:', error)
    throw error
  }
}

/**
 * Get low stock ingredients (Admin)
 */
async getLowStockIngredients() {
  const token = localStorage.getItem('token')
  
  try {
    const response = await fetch(`${API_URL}/ingredients/low-stock`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    })
    
    if (response.status === 401) {
      throw new Error('Session expired')
    }
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error fetching low stock ingredients:', error)
    throw error
  }
}

/**
 * Get ingredient by ID (Admin)
 */
async getIngredient(id) {
  const token = localStorage.getItem('token')
  
  try {
    const response = await fetch(`${API_URL}/ingredients/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    })
    
    if (response.status === 401) {
      throw new Error('Session expired')
    }
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error fetching ingredient:', error)
    throw error
  }
}

/**
 * Create ingredient (Admin)
 */
async createIngredient(data) {
  const token = localStorage.getItem('token')
  
  try {
    const response = await fetch(`${API_URL}/ingredients`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    })
    
    if (response.status === 401) {
      throw new Error('Session expired')
    }
    
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.detail || `Create ingredient failed: ${response.status}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error creating ingredient:', error)
    throw error
  }
}

/**
 * Update ingredient (Admin)
 */
async updateIngredient(id, data) {
  const token = localStorage.getItem('token')
  
  try {
    const response = await fetch(`${API_URL}/ingredients/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    })
    
    if (response.status === 401) {
      throw new Error('Session expired')
    }
    
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.detail || `Update ingredient failed: ${response.status}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error updating ingredient:', error)
    throw error
  }
}

/**
 * Delete ingredient (Admin)
 */
async deleteIngredient(id) {
  const token = localStorage.getItem('token')
  
  try {
    const response = await fetch(`${API_URL}/ingredients/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    if (response.status === 401) {
      throw new Error('Session expired')
    }
    
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.detail || `Delete ingredient failed: ${response.status}`)
    }
    
    return true
  } catch (error) {
    console.error('Error deleting ingredient:', error)
    throw error
  }
}

/**
 * Import stock (Admin)
 */
async importStock(id, quantity, note = '') {
  const token = localStorage.getItem('token')
  
  try {
    const response = await fetch(`${API_URL}/ingredients/${id}/import`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ quantity, note })
    })
    
    if (response.status === 401) {
      throw new Error('Session expired')
    }
    
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.detail || 'Import stock failed')
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error importing stock:', error)
    throw error
  }
}

/**
 * Export stock (Admin)
 */
async exportStock(id, quantity, note = '') {
  const token = localStorage.getItem('token')
  
  try {
    const response = await fetch(`${API_URL}/ingredients/${id}/export`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ quantity, note })
    })
    
    if (response.status === 401) {
      throw new Error('Session expired')
    }
    
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.detail || 'Export stock failed')
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error exporting stock:', error)
    throw error
  }
}

/**
 * Get stock history (Admin)
 */
async getStockHistory(id) {
  const token = localStorage.getItem('token')
  
  try {
    const response = await fetch(`${API_URL}/ingredients/${id}/history`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    })
    
    if (response.status === 401) {
      throw new Error('Session expired')
    }
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error fetching stock history:', error)
    throw error
  }
}
/**
 * Check if enough ingredients to make product
 * @param {string} productId - Product ID
 * @param {number} quantity - Quantity to make (default: 1)
 */
async checkProductIngredients(productId, quantity = 1) {
  const token = localStorage.getItem('token')
  
  try {
    const response = await fetch(
      `${API_URL}/products/${productId}/check-ingredients?quantity=${quantity}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      }
    )
    
    if (response.status === 401) {
      throw new Error('Session expired')
    }
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error checking ingredients:', error)
    throw error
  }
}
// ...existing code...

// ============ RECIPES API ============

/**
 * Get recipe by product ID (Public)
 */
async getRecipeByProduct(productId) {
  try {
    const response = await fetch(`${API_URL}/recipes/product/${productId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    if (response.status === 404) {
      return null // Product không có recipe
    }
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error fetching recipe:', error)
    return null
  }
}

/**
 * Get product story (Public)
 */
async getProductStory(productId) {
  try {
    const response = await fetch(`${API_URL}/recipes/product/${productId}/story`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    if (response.status === 404) {
      return null
    }
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error fetching story:', error)
    return null
  }
}

/**
 * Create recipe (Admin)
 */
async createRecipe(data) {
  const token = localStorage.getItem('token')
  
  try {
    const response = await fetch(`${API_URL}/recipes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    })
    
    if (response.status === 401) {
      throw new Error('Session expired')
    }
    
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.detail || 'Create recipe failed')
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error creating recipe:', error)
    throw error
  }
}

/**
 * Update recipe (Admin)
 */
async updateRecipe(recipeId, data) {
  const token = localStorage.getItem('token')
  
  try {
    const response = await fetch(`${API_URL}/recipes/${recipeId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    })
    
    if (response.status === 401) {
      throw new Error('Session expired')
    }
    
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.detail || 'Update recipe failed')
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error updating recipe:', error)
    throw error
  }
}

/**
 * Delete recipe (Admin)
 */
async deleteRecipe(recipeId) {
  const token = localStorage.getItem('token')
  
  try {
    const response = await fetch(`${API_URL}/recipes/${recipeId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    if (response.status === 401) {
      throw new Error('Session expired')
    }
    
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.detail || 'Delete recipe failed')
    }
    
    return true
  } catch (error) {
    console.error('Error deleting recipe:', error)
    throw error
  }
}

/**
 * Get recipe cost (Admin)
 */
async getRecipeCost(recipeId) {
  const token = localStorage.getItem('token')
  
  try {
    const response = await fetch(`${API_URL}/recipes/${recipeId}/cost`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    })
    
    if (response.status === 401) {
      throw new Error('Session expired')
    }
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error fetching recipe cost:', error)
    throw error
  }
}

/**
 * Deduct ingredients when selling product (Admin)
 */
async deductIngredientsForProduct(productId, quantity = 1) {
  const token = localStorage.getItem('token')
  
  try {
    const response = await fetch(`${API_URL}/recipes/product/${productId}/deduct?quantity=${quantity}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    })
    
    if (response.status === 401) {
      throw new Error('Session expired')
    }
    
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.detail || 'Failed to deduct ingredients')
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error deducting ingredients:', error)
    throw error
  }
}
// ...existing code...

// ============ REVIEWS API ============

/**
 * Create review (User - must have purchased product)
 * @param {string} productId - Product ID
 * @param {number} rating - Rating (1-5)
 * @param {string} comment - Review comment (optional)
 */
async createReview(productId, rating, comment = '') {
  const token = localStorage.getItem('token')
  
  try {
    const response = await fetch(`${API_URL}/reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        product_id: productId,
        rating,
        comment
      })
    })
    
    if (response.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      if (window.location.pathname !== '/auth') {
        alert('⚠️ Session expired. Please login again.')
        window.location.href = '/auth'
      }
      throw new Error('Session expired')
    }
    
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.detail || 'Failed to create review')
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error creating review:', error)
    throw error
  }
}

/**
 * Get reviews of a product (Public - only approved reviews)
 * @param {string} productId - Product ID
 */
async getProductReviews(productId) {
  const token = localStorage.getItem('token')
  
  try {
    const headers = {
      'Content-Type': 'application/json'
    }
    
    // ← THÊM: Gửi token nếu có
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    
    const response = await fetch(`${API_URL}/reviews/product/${productId}`, {
      method: 'GET',
      headers
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error fetching product reviews:', error)
    return []
  }
}

/**
 * Get product rating summary (Public)
 * @param {string} productId - Product ID
 */
async getProductRating(productId) {
  try {
    const response = await fetch(`${API_URL}/reviews/product/${productId}/rating`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error fetching product rating:', error)
    return { avg_rating: 0, total_reviews: 0 }
  }
}

/**
 * Check if user can review product (User must be logged in)
 * @param {string} productId - Product ID
 */
async canReview(productId) {
  const token = localStorage.getItem('token')
  
  if (!token) {
    return { can_review: false, reason: 'Please login to review' }
  }
  
  try {
    const response = await fetch(`${API_URL}/reviews/product/${productId}/can-review`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    })
    
    if (response.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      if (window.location.pathname !== '/auth') {
        alert('⚠️ Session expired. Please login again.')
        window.location.href = '/auth'
      }
      throw new Error('Session expired')
    }
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error checking can review:', error)
    return { can_review: false, reason: 'Error checking review status' }
  }
}

/**
 * Get my reviews (User)
 */
async getMyReviews() {
  const token = localStorage.getItem('token')
  
  try {
    const response = await fetch(`${API_URL}/reviews/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    })
    
    if (response.status === 401) {
      throw new Error('Session expired')
    }
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error fetching my reviews:', error)
    throw error
  }
}

// ============ ADMIN REVIEW MANAGEMENT ============

/**
 * Get pending reviews (Admin)
 */
async getPendingReviews() {
  const token = localStorage.getItem('token')
  
  try {
    const response = await fetch(`${API_URL}/reviews/pending`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    })
    
    if (response.status === 401) {
      throw new Error('Session expired')
    }
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error fetching pending reviews:', error)
    throw error
  }
}

/**
 * Get all reviews (Admin)
 */
async getAllReviews() {
  const token = localStorage.getItem('token')
  
  try {
    const response = await fetch(`${API_URL}/reviews/all`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    })
    
    if (response.status === 401) {
      throw new Error('Session expired')
    }
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error fetching all reviews:', error)
    throw error
  }
}

/**
 * Approve review (Admin)
 * @param {string} reviewId - Review ID
 */
async approveReview(reviewId) {
  const token = localStorage.getItem('token')
  
  try {
    const response = await fetch(`${API_URL}/reviews/${reviewId}/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    })
    
    if (response.status === 401) {
      throw new Error('Session expired')
    }
    
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.detail || 'Failed to approve review')
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error approving review:', error)
    throw error
  }
}

/**
 * Hide review (Admin)
 * @param {string} reviewId - Review ID
 */
async hideReview(reviewId) {
  const token = localStorage.getItem('token')
  
  try {
    const response = await fetch(`${API_URL}/reviews/${reviewId}/hide`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    })
    
    if (response.status === 401) {
      throw new Error('Session expired')
    }
    
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.detail || 'Failed to hide review')
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error hiding review:', error)
    throw error
  }
}

/**
 * Delete review (Admin)
 * @param {string} reviewId - Review ID
 */
async deleteReview(reviewId) {
  const token = localStorage.getItem('token')
  
  try {
    const response = await fetch(`${API_URL}/reviews/${reviewId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    if (response.status === 401) {
      throw new Error('Session expired')
    }
    
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.detail || 'Failed to delete review')
    }
    
    return true
  } catch (error) {
    console.error('Error deleting review:', error)
    throw error
  }
}

}

export default new ApiService()