import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'
import api from './services/api'
import './RecipesPage.css'

export default function RecipesPage() {
  const [products, setProducts] = useState([])
  const [recipes, setRecipes] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [showForm, setShowForm] = useState(false)
  
  const [formData, setFormData] = useState({
    instructions: '',
    origin: '',
    story: '',
    history: '',
    prep_time: 0,
    cook_time: 0,
    servings: 1
  })

  const navigate = useNavigate()
  const token = localStorage.getItem('token')
  const userRole = localStorage.getItem('userRole')

  useEffect(() => {
    if (!token || userRole !== 'admin') {
      alert('Only admins can access this page')
      navigate('/home')
      return
    }
    fetchData()
  }, [token, userRole, navigate])

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const productsData = await api.getProducts({ limit: 100 })
      setProducts(productsData)
      
      // Fetch recipes cho từng product
      const recipePromises = productsData.map(async (product) => {
        try {
          const recipe = await api.getRecipeByProduct(product.id)
          return { productId: product.id, recipe }
        } catch {
          return { productId: product.id, recipe: null }
        }
      })
      
      const recipeResults = await Promise.all(recipePromises)
      const recipesMap = {}
      recipeResults.forEach(({ productId, recipe }) => {
        recipesMap[productId] = recipe
      })
      
      setRecipes(recipesMap)
    } catch (err) {
      console.error('Error fetching data:', err)
      setError(err.message || 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      instructions: '',
      origin: '',
      story: '',
      history: '',
      prep_time: 0,
      cook_time: 0,
      servings: 1
    })
    setSelectedProduct(null)
    setShowForm(false)
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleCreateOrUpdate = (product) => {
    setSelectedProduct(product)
    const existingRecipe = recipes[product.id]
    
    if (existingRecipe) {
      setFormData({
        instructions: existingRecipe.instructions || '',
        origin: existingRecipe.origin || '',
        story: existingRecipe.story || '',
        history: existingRecipe.history || '',
        prep_time: existingRecipe.prep_time || 0,
        cook_time: existingRecipe.cook_time || 0,
        servings: existingRecipe.servings || 1
      })
    }
    
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const payload = {
      product_id: selectedProduct.id,
      ingredients: selectedProduct.ingredients?.map(ing => ({
        ingredient_id: ing.ingredient_id,
        quantity: ing.quantity_needed,
        unit: ing.unit
      })) || [],
      instructions: formData.instructions,
      origin: formData.origin,
      story: formData.story,
      history: formData.history,
      prep_time: parseInt(formData.prep_time),
      cook_time: parseInt(formData.cook_time),
      servings: parseInt(formData.servings)
    }

    try {
      const existingRecipe = recipes[selectedProduct.id]
      
      if (existingRecipe) {
        await api.updateRecipe(existingRecipe.id, payload)
        alert('✅ Recipe updated successfully')
      } else {
        await api.createRecipe(payload)
        alert('✅ Recipe created successfully')
      }

      resetForm()
      fetchData()
    } catch (err) {
      console.error('Error saving recipe:', err)
      alert(err.message || 'Failed to save recipe')
    }
  }

  const handleDelete = async (productId) => {
    const recipe = recipes[productId]
    if (!recipe) return
    
    if (!confirm('Are you sure you want to delete this recipe?')) return

    try {
      await api.deleteRecipe(recipe.id)
      alert('✅ Recipe deleted successfully')
      fetchData()
    } catch (err) {
      console.error('Error deleting recipe:', err)
      alert(err.message || 'Failed to delete recipe')
    }
  }

  if (loading) {
    return (
      <div className="recipes-page">
        <Header />
        <section className="page-banner">
          <div className="page-banner-container">
            <h1 className="page-title">Recipes Management</h1>
          </div>
        </section>
        <section className="recipes-section">
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading recipes...</p>
          </div>
        </section>
        <Footer />
      </div>
    )
  }

  if (error) {
    return (
      <div className="recipes-page">
        <Header />
        <section className="page-banner">
          <div className="page-banner-container">
            <h1 className="page-title">Recipes Management</h1>
          </div>
        </section>
        <section className="recipes-section">
          <div className="error-state">
            <h2>⚠️ Error Loading Recipes</h2>
            <p>{error}</p>
            <button onClick={fetchData} className="retry-btn">
              Try Again
            </button>
          </div>
        </section>
        <Footer />
      </div>
    )
  }

  return (
    <div className="recipes-page">
      <Header />

      <section className="page-banner">
        <div className="page-banner-container">
          <h1 className="page-title">Recipes</h1>
          <div className="breadcrumb">
            <a href="/">🏠</a>
            <span className="separator">»</span>
            <a href="/admin/questions">Admin</a>
            <span className="separator">»</span>
            <span>Recipes</span>
          </div>
        </div>
      </section>

      <section className="recipes-section">
        <div className="recipes-container">
          
          {/* Form Panel */}
          {showForm && selectedProduct && (
            <div className="recipe-form-panel">
              <h3>
                {recipes[selectedProduct.id] ? 'Edit Recipe' : 'Create Recipe'} for "{selectedProduct.name}"
              </h3>
              <form onSubmit={handleSubmit} className="recipe-form">
                <label className="form-full">
                  Instructions
                  <textarea
                    name="instructions"
                    rows="4"
                    value={formData.instructions}
                    onChange={handleInputChange}
                    placeholder="Step-by-step instructions..."
                  />
                </label>

                <label className="form-full">
                  Origin
                  <textarea
                    name="origin"
                    rows="3"
                    value={formData.origin}
                    onChange={handleInputChange}
                    placeholder="Where do the ingredients come from?"
                  />
                </label>

                <label className="form-full">
                  Story
                  <textarea
                    name="story"
                    rows="3"
                    value={formData.story}
                    onChange={handleInputChange}
                    placeholder="The story behind this product..."
                  />
                </label>

                <label className="form-full">
                  History
                  <textarea
                    name="history"
                    rows="3"
                    value={formData.history}
                    onChange={handleInputChange}
                    placeholder="Historical background..."
                  />
                </label>

                <div className="form-row">
                  <label>
                    Prep Time (mins)
                    <input
                      type="number"
                      name="prep_time"
                      min="0"
                      value={formData.prep_time}
                      onChange={handleInputChange}
                    />
                  </label>

                  <label>
                    Cook Time (mins)
                    <input
                      type="number"
                      name="cook_time"
                      min="0"
                      value={formData.cook_time}
                      onChange={handleInputChange}
                    />
                  </label>

                  <label>
                    Servings
                    <input
                      type="number"
                      name="servings"
                      min="1"
                      value={formData.servings}
                      onChange={handleInputChange}
                    />
                  </label>
                </div>

                <div className="form-actions">
                  <button type="submit" className="submit-btn">
                    {recipes[selectedProduct.id] ? 'Update' : 'Create'}
                  </button>
                  <button type="button" className="cancel-btn" onClick={resetForm}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Products Table */}
          <div className="recipes-table-wrapper">
            <h2>Products & Recipes</h2>
            <table className="recipes-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Has Recipe</th>
                  <th>Ingredients</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map(product => {
                  const hasRecipe = !!recipes[product.id]
                  const hasIngredients = product.ingredients && product.ingredients.length > 0
                  
                  return (
                    <tr key={product.id}>
                      <td className="product-name-cell">
                        <img src={product.image} alt={product.name} className="product-thumb" />
                        <span>{product.name}</span>
                      </td>
                      <td>{product.category}</td>
                      <td>
                        <span className={`status-badge ${hasRecipe ? 'has-recipe' : 'no-recipe'}`}>
                          {hasRecipe ? '✓ Yes' : '✗ No'}
                        </span>
                      </td>
                      <td>
                        {hasIngredients ? (
                          <span className="ingredients-count">
                            {product.ingredients.length} items
                          </span>
                        ) : (
                          <span className="no-ingredients">None</span>
                        )}
                      </td>
                      <td className="actions-cell">
                        <button
                          className="action-btn edit-btn"
                          onClick={() => handleCreateOrUpdate(product)}
                          title={hasRecipe ? 'Edit recipe' : 'Create recipe'}
                        >
                          {hasRecipe ? '✏️' : '➕'}
                        </button>
                        {hasRecipe && (
                          <button
                            className="action-btn delete-btn"
                            onClick={() => handleDelete(product.id)}
                            title="Delete recipe"
                          >
                            🗑️
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

        </div>
      </section>

      <Footer />
    </div>
  )
}