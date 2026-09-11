import { createContext, useEffect, useState } from 'react'
import axios from 'axios'

const AuthContext = createContext(null)

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8001/api'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState(function () {
    return localStorage.getItem('metricmind_token')
  })

  useEffect(function () {
    async function initializeAuth() {
      const savedToken = localStorage.getItem('metricmind_token')

      if (!savedToken) {
        setLoading(false)
        return
      }

      try {
        const response = await axios.get(
          API_BASE_URL + '/v1/auth/me',
          {
            headers: {
              Authorization: 'Bearer ' + savedToken,
            },
          }
        )

        setUser(response.data)
        setToken(savedToken)
      } catch (error) {
        console.error('Authentication check failed:', error)

        localStorage.removeItem('metricmind_token')
        setToken(null)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    initializeAuth()
  }, [])

  async function login(email, password) {
    try {
      const response = await axios.post(
        API_BASE_URL + '/v1/auth/login',
        {
          email: email,
          password: password,
        }
      )

      const accessToken = response.data.access_token
      const userData = response.data.user || null

      if (!accessToken) {
        return {
          success: false,
          error: 'Backend did not return an access token.',
        }
      }

      localStorage.setItem('metricmind_token', accessToken)

      setToken(accessToken)
      setUser(userData)

      return {
        success: true,
        user: userData,
      }
    } catch (error) {
      console.error('Login error:', error)

      let message = 'Login failed.'

      if (error.response) {
        if (error.response.data) {
          if (typeof error.response.data.detail === 'string') {
            message = error.response.data.detail
          }
        }
      } else if (error.request) {
        message =
          'Cannot connect to backend. Make sure MetricMind backend is running on port 8001.'
      }

      return {
        success: false,
        error: message,
      }
    }
  }

  async function register(
    full_name,
    username,
    email,
    password
  ) {
    try {
      const response = await axios.post(
        API_BASE_URL + '/v1/auth/register',
        {
          full_name: full_name,
          username: username,
          email: email,
          password: password,
        }
      )

      const accessToken = response.data.access_token
      const userData = response.data.user || null

      if (!accessToken) {
        return {
          success: false,
          error: 'Registration succeeded but no access token was returned.',
        }
      }

      localStorage.setItem('metricmind_token', accessToken)

      setToken(accessToken)
      setUser(userData)

      return {
        success: true,
        user: userData,
      }
    } catch (error) {
      console.error('Registration error:', error)

      let message = 'Registration failed.'

      if (error.response) {
        if (error.response.data) {
          if (typeof error.response.data.detail === 'string') {
            message = error.response.data.detail
          }
        }
      } else if (error.request) {
        message =
          'Cannot connect to backend. Make sure MetricMind backend is running on port 8001.'
      }

      return {
        success: false,
        error: message,
      }
    }
  }

  async function logout() {
    const currentToken = localStorage.getItem(
      'metricmind_token'
    )

    try {
      if (currentToken) {
        await axios.post(
          API_BASE_URL + '/v1/auth/logout',
          {},
          {
            headers: {
              Authorization: 'Bearer ' + currentToken,
            },
          }
        )
      }
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      localStorage.removeItem('metricmind_token')
      setToken(null)
      setUser(null)
    }
  }

  const isAuthenticated = Boolean(token && user)

  return (
    <AuthContext.Provider
      value={{
        user: user,
        token: token,
        loading: loading,
        isAuthenticated: isAuthenticated,
        login: login,
        register: register,
        logout: logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export { AuthContext }