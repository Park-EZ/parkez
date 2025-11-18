import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Log frontend startup
console.log('🚀 Starting EZpark Frontend...')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)

// Log when frontend is ready
const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('✅ Frontend: Application loaded')
console.log(`   API URL: ${apiUrl}`)
console.log(`   API Mode: Enabled (always using database)`)
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
