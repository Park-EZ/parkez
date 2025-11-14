import { createContext, useContext, useState, useEffect } from "react"

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const USE_API = import.meta.env.VITE_USE_API === 'true'
  console.log(USE_API)
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

  useEffect(() => {
    // Check for existing session
    const storedUser = localStorage.getItem("ezpark_user")
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch (e) {
        localStorage.removeItem("ezpark_user")
      }
    }
    setLoading(false)
  }, [])

  const login = async (email, password) => {
    if (USE_API) {
      // Call backend login endpoint
      try {
        console.log("Trying to login via API...")
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
        localStorage.setItem('ezpark_user', JSON.stringify(userData))
        setUser(userData)
        return userData
      } catch (err) {
        if (err instanceof Error) throw err
        throw new Error('Failed to login')
      }
    }

    // LocalStorage-based login: check stored users (fallback)
    const USERS_KEY = 'ezpark_users'
    try {
      console.log("Fallback to Login via LocalStorage...")
      const usersRaw = localStorage.getItem(USERS_KEY) || '{}'
      const users = JSON.parse(usersRaw)
      const record = users[email]
      if (!record || record.password !== password) {
        throw new Error('Invalid credentials')
      }
      const userData = { id: record.id, email: record.email, name: record.name }
      localStorage.setItem('ezpark_user', JSON.stringify(userData))
      setUser(userData)
      return userData
    } catch (err) {
      if (err instanceof Error) throw err
      throw new Error('Failed to login')
    }
  }

  const register = async (email, password, name) => {
    if (USE_API) {
      // Call backend register endpoint
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
        localStorage.setItem('ezpark_user', JSON.stringify(userData))
        setUser(userData)
        return userData
      } catch (err) {
        if (err instanceof Error) throw err
        throw new Error('Failed to register')
      }
    }

    // LocalStorage-based register: save user record under email (fallback)
    const USERS_KEY = 'ezpark_users'
    try {
      const usersRaw = localStorage.getItem(USERS_KEY) || '{}'
      const users = JSON.parse(usersRaw)
      if (users[email]) {
        throw new Error('User already exists')
      }
      const id = 'user_' + Date.now()
      // NOTE: Storing plaintext passwords only for local/dev convenience
      users[email] = { id, email, name, password }
      localStorage.setItem(USERS_KEY, JSON.stringify(users))

      const userData = { id, email, name }
      localStorage.setItem('ezpark_user', JSON.stringify(userData))
      setUser(userData)
      return userData
    } catch (err) {
      if (err instanceof Error) throw err
      throw new Error('Failed to register')
    }
  }

  const logout = () => {
    localStorage.removeItem("ezpark_user")
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

