import React, { useState, useEffect } from 'react'
import Header from './Header'
import SocialSidebar from './SocialSidebar'
import ChatButton from './ChatButton'
import Footer from './Footer'
import './IngredientsPage.css'
import api from './services/api'

export default function IngredientsPage() {
  // State
  const [ingredients, setIngredients] = useState([])
  const [filteredIngredients, setFilteredIngredients] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Filter & Search
  const [filterType, setFilterType] = useState('all') // all, low-stock, active
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('name') // name, quantity, price
  
  // Form State
  const [showForm, setShowForm] = useState(false)
  const [editingIngredient, setEditingIngredient] = useState(null)
  const [form, setForm] = useState({
    name: '',
    unit: 'kg',
    price_per_unit: '',
    quantity: '',
    min_quantity: '10',
    supplier: '',
    description: ''
  })
  
  // Stock Modal
  const [showStockModal, setShowStockModal] = useState(false)
  const [stockAction, setStockAction] = useState('import') // import, export
  const [selectedIngredient, setSelectedIngredient] = useState(null)
  const [stockForm, setStockForm] = useState({
    quantity: '',
    note: ''
  })
  
  // History Modal
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [history, setHistory] = useState([])
  const [historyLoading, setHistoryLoading] = useState(false)

  const token = localStorage.getItem('token')
  const userRole = localStorage.getItem('userRole')
  const isAdmin = !!token && userRole === 'admin'

  // Fetch ingredients on mount
  useEffect(() => {
    if (isAdmin) {
      fetchIngredients()
    } else {
      setError('Bạn không có quyền truy cập trang này')
      setLoading(false)
    }
  }, [isAdmin])

  // Filter & Search ingredients
  useEffect(() => {
    let result = [...ingredients]
    
    // Filter by type
    if (filterType === 'low-stock') {
      result = result.filter(item => item.is_low_stock)
    } else if (filterType === 'active') {
      result = result.filter(item => item.is_active)
    }
    
    // Search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(item =>
        item.name.toLowerCase().includes(query) ||
        item.supplier?.toLowerCase().includes(query)
      )
    }
    
    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name)
        case 'quantity':
          return b.quantity - a.quantity
        case 'price':
          return b.price_per_unit - a.price_per_unit
        default:
          return 0
      }
    })
    
    setFilteredIngredients(result)
  }, [ingredients, filterType, searchQuery, sortBy])

  // Fetch all ingredients
  const fetchIngredients = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await api.getIngredients()
      setIngredients(data)
    } catch (err) {
      console.error('Error fetching ingredients:', err)
      setError(err.message || 'Không thể tải danh sách nguyên liệu')
    } finally {
      setLoading(false)
    }
  }

  // Reset form
  const resetForm = () => {
    setEditingIngredient(null)
    setForm({
      name: '',
      unit: 'kg',
      price_per_unit: '',
      quantity: '',
      min_quantity: '10',
      supplier: '',
      description: ''
    })
  }

  // Handle form change
  const handleFormChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  // Handle submit form (Create/Update)
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    const payload = {
      ...form,
      price_per_unit: parseFloat(form.price_per_unit),
      quantity: parseFloat(form.quantity || 0),
      min_quantity: parseFloat(form.min_quantity || 10)
    }
    
    try {
      if (editingIngredient) {
        await api.updateIngredient(editingIngredient.id, payload)
        alert('✅ Cập nhật nguyên liệu thành công!')
      } else {
        await api.createIngredient(payload)
        alert('✅ Thêm nguyên liệu thành công!')
      }
      
      resetForm()
      setShowForm(false)
      fetchIngredients()
    } catch (err) {
      console.error(err)
      alert(err.message || 'Có lỗi xảy ra')
    }
  }

  // Handle edit
  const handleEdit = (ingredient) => {
    setEditingIngredient(ingredient)
    setForm({
      name: ingredient.name,
      unit: ingredient.unit,
      price_per_unit: String(ingredient.price_per_unit),
      quantity: String(ingredient.quantity),
      min_quantity: String(ingredient.min_quantity),
      supplier: ingredient.supplier || '',
      description: ingredient.description || ''
    })
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Handle delete
  const handleDelete = async (id) => {
    if (!window.confirm('Xóa nguyên liệu này?')) return
    
    try {
      await api.deleteIngredient(id)
      alert('✅ Xóa nguyên liệu thành công!')
      fetchIngredients()
    } catch (err) {
      console.error(err)
      alert(err.message || 'Có lỗi xảy ra khi xóa')
    }
  }

  // Open stock modal
  const openStockModal = (ingredient, action) => {
    setSelectedIngredient(ingredient)
    setStockAction(action)
    setStockForm({ quantity: '', note: '' })
    setShowStockModal(true)
  }

  // Handle stock submit
  const handleStockSubmit = async (e) => {
    e.preventDefault()
    
    const quantity = parseFloat(stockForm.quantity)
    if (quantity <= 0) {
      alert('Số lượng phải lớn hơn 0')
      return
    }
    
    try {
      if (stockAction === 'import') {
        await api.importStock(selectedIngredient.id, quantity, stockForm.note)
        alert('✅ Nhập kho thành công!')
      } else {
        await api.exportStock(selectedIngredient.id, quantity, stockForm.note)
        alert('✅ Xuất kho thành công!')
      }
      
      setShowStockModal(false)
      fetchIngredients()
    } catch (err) {
      console.error(err)
      alert(err.message || 'Có lỗi xảy ra')
    }
  }

  // Open history modal
  const openHistoryModal = async (ingredient) => {
    setSelectedIngredient(ingredient)
    setShowHistoryModal(true)
    setHistoryLoading(true)
    
    try {
      const data = await api.getStockHistory(ingredient.id)
      setHistory(data)
    } catch (err) {
      console.error(err)
      alert(err.message || 'Không thể tải lịch sử')
    } finally {
      setHistoryLoading(false)
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="ingredients-page">
        <Header />
        <section className="page-banner">
          <div className="page-banner-container">
            <h1 className="page-title">Ingredients</h1>
            <div className="breadcrumb">
              <a href="/">🏠</a>
              <span className="separator">»</span>
              <span>Ingredients</span>
            </div>
          </div>
        </section>
        <section className="ingredients-section">
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Đang tải nguyên liệu...</p>
          </div>
        </section>
        <Footer />
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="ingredients-page">
        <Header />
        <section className="page-banner">
          <div className="page-banner-container">
            <h1 className="page-title">Ingredients</h1>
          </div>
        </section>
        <section className="ingredients-section">
          <div className="error-state">
            <h2>⚠️ Lỗi</h2>
            <p>{error}</p>
            {isAdmin && (
              <button onClick={fetchIngredients} className="retry-btn">
                Thử lại
              </button>
            )}
          </div>
        </section>
        <Footer />
      </div>
    )
  }

  return (
    <div className="ingredients-page">
      <Header />
      
      <section className="page-banner">
        <div className="page-banner-container">
          <h1 className="page-title">Ingredients</h1>
          <div className="breadcrumb">
            <a href="/">🏠</a>
            <span className="separator">»</span>
            <span>Ingredients Management</span>
          </div>
        </div>
      </section>

      <section className="ingredients-section">
        <div className="ingredients-container">
          
          {/* Toolbar */}
          <div className="ingredients-toolbar">
            <div className="toolbar-left">
              <button
                className="add-btn"
                onClick={() => {
                  if (showForm && editingIngredient) {
                    resetForm()
                  }
                  setShowForm(!showForm)
                }}
              >
                {editingIngredient ? 'Sửa nguyên liệu' : showForm ? 'Đóng form' : '+ Thêm nguyên liệu'}
              </button>
              
              <div className="filter-tabs">
                <button
                  className={`filter-tab ${filterType === 'all' ? 'active' : ''}`}
                  onClick={() => setFilterType('all')}
                >
                  Tất cả ({ingredients.length})
                </button>
                <button
                  className={`filter-tab ${filterType === 'low-stock' ? 'active' : ''}`}
                  onClick={() => setFilterType('low-stock')}
                >
                  Sắp hết ({ingredients.filter(i => i.is_low_stock).length})
                </button>
                <button
                  className={`filter-tab ${filterType === 'active' ? 'active' : ''}`}
                  onClick={() => setFilterType('active')}
                >
                  Đang hoạt động ({ingredients.filter(i => i.is_active).length})
                </button>
              </div>
            </div>
            
            <div className="toolbar-right">
              <input
                type="text"
                className="search-input"
                placeholder="🔍 Tìm kiếm..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              
              <select
                className="sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="name">Sắp xếp: Tên</option>
                <option value="quantity">Sắp xếp: Số lượng</option>
                <option value="price">Sắp xếp: Giá</option>
              </select>
            </div>
          </div>

          {/* Form */}
          {showForm && (
            <div className="ingredient-form-panel">
              <h3 className="form-title">
                {editingIngredient ? 'Sửa nguyên liệu' : 'Thêm nguyên liệu mới'}
              </h3>
              <form className="ingredient-form" onSubmit={handleSubmit}>
                <label>
                  Tên nguyên liệu *
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleFormChange}
                    required
                    placeholder="VD: Bột mì"
                  />
                </label>

                <label>
                  Đơn vị *
                  <select
                    name="unit"
                    value={form.unit}
                    onChange={handleFormChange}
                  >
                    <option value="kg">kg</option>
                    <option value="g">g</option>
                    <option value="lít">lít</option>
                    <option value="ml">ml</option>
                    <option value="cái">cái</option>
                    <option value="gói">gói</option>
                    <option value="lon">lon</option>
                    <option value="hộp">hộp</option>
                  </select>
                </label>

                <label>
                  Giá/đơn vị ($) *
                  <input
                    type="number"
                    name="price_per_unit"
                    min="0"
                    step="0.01"
                    value={form.price_per_unit}
                    onChange={handleFormChange}
                    required
                    placeholder="0.00"
                  />
                </label>

                <label>
                  Số lượng tồn
                  <input
                    type="number"
                    name="quantity"
                    min="0"
                    step="0.01"
                    value={form.quantity}
                    onChange={handleFormChange}
                    placeholder="0"
                  />
                </label>

                <label>
                  Ngưỡng cảnh báo
                  <input
                    type="number"
                    name="min_quantity"
                    min="0"
                    step="0.01"
                    value={form.min_quantity}
                    onChange={handleFormChange}
                    placeholder="10"
                  />
                </label>

                <label>
                  Nhà cung cấp
                  <input
                    name="supplier"
                    value={form.supplier}
                    onChange={handleFormChange}
                    placeholder="VD: ABC Company"
                  />
                </label>

                <label className="form-full">
                  Mô tả
                  <textarea
                    name="description"
                    rows={3}
                    value={form.description}
                    onChange={handleFormChange}
                    placeholder="Mô tả chi tiết..."
                  />
                </label>

                <div className="form-actions">
                  <button type="submit" className="save-btn">
                    {editingIngredient ? 'Lưu thay đổi' : 'Thêm nguyên liệu'}
                  </button>
                  {editingIngredient && (
                    <button
                      type="button"
                      className="cancel-btn"
                      onClick={() => {
                        resetForm()
                        setShowForm(false)
                      }}
                    >
                      Hủy
                    </button>
                  )}
                </div>
              </form>
            </div>
          )}

          {/* Table */}
          <div className="ingredients-table-wrapper">
            <table className="ingredients-table">
              <thead>
                <tr>
                  <th>Tên</th>
                  <th>Đơn vị</th>
                  <th>Giá/đơn vị</th>
                  <th>Tồn kho</th>
                  <th>Ngưỡng</th>
                  <th>Nhà CC</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredIngredients.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="empty-row">
                      Không có nguyên liệu nào
                    </td>
                  </tr>
                ) : (
                  filteredIngredients.map(item => (
                    <tr key={item.id} className={item.is_low_stock ? 'low-stock-row' : ''}>
                      <td>
                        <div className="ingredient-name">
                          {item.name}
                          {item.is_low_stock && (
                            <span className="warning-badge">⚠️ Sắp hết</span>
                          )}
                        </div>
                      </td>
                      <td>{item.unit}</td>
                      <td className="price-cell">${item.price_per_unit.toFixed(2)}</td>
                      <td className={item.is_low_stock ? 'low-stock-cell' : ''}>
                        {item.quantity} {item.unit}
                      </td>
                      <td>{item.min_quantity} {item.unit}</td>
                      <td>{item.supplier || '-'}</td>
                      <td>
                        <span className={`status-badge ${item.is_active ? 'active' : 'inactive'}`}>
                          {item.is_active ? '✓ Active' : '✗ Inactive'}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="action-btn import-btn"
                            onClick={() => openStockModal(item, 'import')}
                            title="Nhập kho"
                          >
                            ↓
                          </button>
                          <button
                            className="action-btn export-btn"
                            onClick={() => openStockModal(item, 'export')}
                            title="Xuất kho"
                          >
                            ↑
                          </button>
                          <button
                            className="action-btn history-btn"
                            onClick={() => openHistoryModal(item)}
                            title="Lịch sử"
                          >
                            📋
                          </button>
                          <button
                            className="action-btn edit-btn"
                            onClick={() => handleEdit(item)}
                            title="Sửa"
                          >
                            ✏️
                          </button>
                          <button
                            className="action-btn delete-btn"
                            onClick={() => handleDelete(item.id)}
                            title="Xóa"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Stock Modal */}
          {showStockModal && (
            <div className="modal-backdrop" onClick={() => setShowStockModal(false)}>
              <div className="modal" onClick={(e) => e.stopPropagation()}>
                <button
                  className="modal-close"
                  onClick={() => setShowStockModal(false)}
                >
                  ×
                </button>
                
                <h3 className="modal-title">
                  {stockAction === 'import' ? '📥 Nhập kho' : '📤 Xuất kho'}
                </h3>
                
                <p className="modal-subtitle">
                  {selectedIngredient?.name} ({selectedIngredient?.unit})
                </p>
                
                <form onSubmit={handleStockSubmit} className="stock-form">
                  <label>
                    Số lượng *
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={stockForm.quantity}
                      onChange={(e) => setStockForm({...stockForm, quantity: e.target.value})}
                      required
                      placeholder="0"
                      autoFocus
                    />
                  </label>
                  
                  <label>
                    Ghi chú
                    <textarea
                      rows={3}
                      value={stockForm.note}
                      onChange={(e) => setStockForm({...stockForm, note: e.target.value})}
                      placeholder="VD: Nhập từ nhà cung cấp ABC..."
                    />
                  </label>
                  
                  <div className="modal-actions">
                    <button type="submit" className="submit-btn">
                      {stockAction === 'import' ? 'Nhập kho' : 'Xuất kho'}
                    </button>
                    <button
                      type="button"
                      className="cancel-btn"
                      onClick={() => setShowStockModal(false)}
                    >
                      Hủy
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* History Modal */}
          {showHistoryModal && (
            <div className="modal-backdrop" onClick={() => setShowHistoryModal(false)}>
              <div className="modal modal-large" onClick={(e) => e.stopPropagation()}>
                <button
                  className="modal-close"
                  onClick={() => setShowHistoryModal(false)}
                >
                  ×
                </button>
                
                <h3 className="modal-title">
                  📋 Lịch sử nhập/xuất kho
                </h3>
                
                <p className="modal-subtitle">
                  {selectedIngredient?.name}
                </p>
                
                {historyLoading ? (
                  <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Đang tải...</p>
                  </div>
                ) : history.length === 0 ? (
                  <p className="empty-text">Chưa có lịch sử</p>
                ) : (
                  <div className="history-list">
                    {history.map(item => (
                      <div key={item.id} className="history-item">
                        <div className="history-header">
                          <span className={`history-type ${item.type}`}>
                            {item.type === 'import' ? '📥 Nhập' : '📤 Xuất'}
                          </span>
                          <span className="history-date">
                            {new Date(item.created_at).toLocaleString('vi-VN')}
                          </span>
                        </div>
                        <div className="history-body">
                          <p><strong>Số lượng:</strong> {item.quantity} {selectedIngredient?.unit}</p>
                          <p><strong>Trước:</strong> {item.before} → <strong>Sau:</strong> {item.after}</p>
                          {item.note && <p><strong>Ghi chú:</strong> {item.note}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </section>

      <SocialSidebar />
      <ChatButton />
      <Footer />
    </div>
  )
}