import { createContext, useState, useEffect } from 'react'
import axios from 'axios'

const AuthContext = createContext(null)

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState(() => localStorage.getItem('metricmind_token'))

  // Initialize user on mount
  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('metricmind_token')
      if (savedToken) {
        try {
          const response = await axios.get(`${API_BASE_URL}/v1/auth/me`, {
            headers: { Authorization: `Bearer ${savedToken}` }
          })
          setUser(response.data)
          setToken(savedToken)
        } catch (error) {
          // Token invalid or expired
          localStorage.removeItem('metricmind_token')
          setToken(null)
        }
      }
      setLoading(false)
    }
    initAuth()
  }, [])

  const login = async (email, password) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/v1/auth/login`, {
        email,
        password
      })
      
      const { access_token, user: userData } = response.data
      
      localStorage.setItem('metricmind_token', access_token)
      setToken(access_token)
      setUser(userData)
      
      return { success: true, user: userData }
    } catch (error) {
      const message = error.response?.data?.detail || 'Login failed'
      return { success: false, error: message }
    }
  }

  const register = async (full_name, username, email, password) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/v1/auth/register`, {
        full_name,
        username,
        email,
        password
      })
      
      const { access_token, user: userData } = response.data
      
      localStorage.setItem('metricmind_token', access_token)
      setToken(access_token)
      setUser(userData)
      
      return { success: true, user: userData }
    } catch (error) {
      const message = error.response?.data?.detail || 'Registration failed'
      return { success: false, error: message }
    }
  }

  const logout = async () => {
    try {
      if (token) {
        await axios.post(`${API_BASE_URL}/v1/auth/logout`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        })
      }
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      localStorage.removeItem('metricmind_token')
      setToken(null)
      setUser(null)
    }
  }

  const isAuthenticated = !!token && !!user

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      isAuthenticated,
      login,
      logout,
      register
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export { AuthContext }
