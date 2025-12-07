import React, { useState, useEffect } from 'react'
import Header from './Header'
import Footer from './Footer'
import './AdminQuestionsPage.css'

export default function AdminQuestionsPage() {
  const [questions, setQuestions] = useState([])
  const [replyText, setReplyText] = useState({})
  const token = localStorage.getItem('token')

  const loadQuestions = async () => {
    const res = await fetch('/api/questions', {
      headers: { Authorization: `Bearer ${token}` }
    })
    if (res.ok) {
      const data = await res.json()
      setQuestions(data)
    }
  }

  const handleReply = async (questionId) => {
  const answer = replyText[questionId]
  if (!answer) return

  const res = await fetch(`/api/questions/${questionId}/reply`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}` 
    },
    body: JSON.stringify({ answer })
  })

  if (res.ok) {
    alert('Đã trả lời!')
    setReplyText({ ...replyText, [questionId]: '' })
    loadQuestions()
  }
}
  useEffect(() => {
    loadQuestions()
  }, [])

  return (
    <div className="admin-questions-page">
      <Header />
      <section className="page-banner">
        <h1>Quản lý câu hỏi</h1>
      </section>
      <section className="questions-section">
        <div className="questions-container">
          {questions.length === 0 ? (
            <p>Không có câu hỏi nào</p>
          ) : (
            questions.map((q) => (
              <div key={q.id} className="question-card">
                <h4>{q.subject}</h4>
                <p><strong>Câu hỏi:</strong> {q.question}</p>
                <p><strong>Phòng ban:</strong> {q.department}</p>
                <p><strong>Trạng thái:</strong> {q.answered ? '✅ Đã trả lời' : '⏳ Chưa trả lời'}</p>
                {q.answered && <p><strong>Câu trả lời:</strong> {q.answer}</p>}
                {!q.answered && (
                  <div className="reply-box">
                    <textarea
                      placeholder="Nhập câu trả lời..."
                      value={replyText[q.id] || ''}
                      onChange={(e) => setReplyText({ ...replyText, [q.id]: e.target.value })}
                    />
                    <button onClick={() => handleReply(q.id)}>Gửi trả lời</button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </section>
      <Footer />
    </div>
  )
}