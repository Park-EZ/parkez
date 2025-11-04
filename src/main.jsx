import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { seedIfEmpty } from './api'

// Log frontend startup
console.log('🚀 Starting EZpark Frontend...')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

// Seed data on app initialization
seedIfEmpty()
  .then(() => {
    console.log('✅ Frontend: Mock data initialized')
  })
  .catch((error) => {
    console.error('⚠️  Frontend: Error initializing mock data:', error.message)
  })

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)

// Log when frontend is ready
const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
const useApi = import.meta.env.VITE_USE_API === 'true'
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('✅ Frontend: Application loaded')
console.log(`   API URL: ${apiUrl}`)
console.log(`   API Mode: ${useApi ? 'Enabled' : 'Disabled (using localStorage)'}`)
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
