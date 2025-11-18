import { createContext, useContext, useState, useEffect } from "react"

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

  useEffect(() => {
    // Note: Session persistence removed - user will need to login on each page refresh
    // To add session persistence, implement JWT tokens in the backend
    setLoading(false)
  }, [])

  const login = async (email, password) => {
    try {
      console.log("Logging in via API...")
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })

      if (!res.ok) {
        let msg = 'Login failed'
        try {
          const body = await res.json()
          msg = body.error || body.message || msg
        } catch (e) {
          msg = res.statusText || msg
        }
        throw new Error(msg)
      }

      const userData = await res.json()
      setUser(userData)
      return userData
    } catch (err) {
      if (err instanceof Error) throw err
      throw new Error('Failed to login')
    }
  }

  const register = async (email, password, name) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name })
      })

      if (!res.ok) {
        let msg = 'Registration failed'
        try {
          const body = await res.json()
          msg = body.error || body.message || msg
        } catch (e) {
          msg = res.statusText || msg
        }
        throw new Error(msg)
      }

      const userData = await res.json()
      setUser(userData)
      return userData
    } catch (err) {
      if (err instanceof Error) throw err
      throw new Error('Failed to register')
    }
  }

  const logout = () => {
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider")
  }
  return context
}
