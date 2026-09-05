import { createContext, useEffect, useState } from 'react'
import axios from 'axios'

export const AuthContext = createContext(null)

const API_BASE_URL = 'http://127.0.0.1:8001/api'

function getStoredToken() {
  return localStorage.getItem('metricmind_token')
}

function getStoredUser() {
  const storedUser = localStorage.getItem('metricmind_user')

  if (!storedUser) {
    return null
  }

  try {
    return JSON.parse(storedUser)
  } catch {
    localStorage.removeItem('metricmind_user')
    return null
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(getStoredToken)
  const [user, setUser] = useState(getStoredUser)
  const [loading, setLoading] = useState(true)

  // ==========================================================
  // LOGIN
  // ==========================================================

  const login = async (email, password) => {
    try {
      console.log(
        'Login request:',
        `${API_BASE_URL}/v1/auth/login`
      )

      const response = await axios.post(
        `${API_BASE_URL}/v1/auth/login`,
        {
          email,
          password,
        }
      )

      console.log(
        'Login response:',
        response.data
      )

      const accessToken =
        response.data.access_token

      const userData =
        response.data.user

      if (!accessToken) {
        throw new Error(
          'Login succeeded but no access token was returned'
        )
      }

      // Save token
      localStorage.setItem(
        'metricmind_token',
        accessToken
      )

      // Save user
      if (userData) {
        localStorage.setItem(
          'metricmind_user',
          JSON.stringify(userData)
        )
      }

      // Update React state
      setToken(accessToken)
      setUser(userData)

      console.log(
        'Token saved successfully'
      )

      return {
        success: true,
        user: userData,
      }
    } catch (error) {
      console.error(
        'Login error:',
        error
      )

      let message =
        'Login failed. Please try again.'

      if (error.response) {
        message =
          error.response.data?.detail ||
          error.response.data?.message ||
          message
      } else if (error.message) {
        message = error.message
      }

      throw new Error(message)
    }
  }

  // ==========================================================
  // REGISTER
  // ==========================================================

  const register = async (
    full_name,
    username,
    email,
    password
  ) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/v1/auth/register`,
        {
          full_name,
          username,
          email,
          password,
        }
      )

      console.log(
        'Register response:',
        response.data
      )

      const accessToken =
        response.data.access_token

      const userData =
        response.data.user

      if (accessToken) {
        localStorage.setItem(
          'metricmind_token',
          accessToken
        )

        setToken(accessToken)
      }

      if (userData) {
        localStorage.setItem(
          'metricmind_user',
          JSON.stringify(userData)
        )

        setUser(userData)
      }

      return {
        success: true,
        user: userData,
      }
    } catch (error) {
      console.error(
        'Register error:',
        error
      )

      let message =
        'Registration failed. Please try again.'

      if (error.response) {
        message =
          error.response.data?.detail ||
          error.response.data?.message ||
          message
      }

      throw new Error(message)
    }
  }

  // ==========================================================
  // LOGOUT
  // ==========================================================

  const logout = async () => {
    try {
      const currentToken =
        localStorage.getItem(
          'metricmind_token'
        )

      if (currentToken) {
        await axios.post(
          `${API_BASE_URL}/v1/auth/logout`,
          {},
          {
            headers: {
              Authorization:
                `Bearer ${currentToken}`,
            },
          }
        )
      }
    } catch (error) {
      console.warn(
        'Logout request failed:',
        error
      )
    } finally {
      localStorage.removeItem(
        'metricmind_token'
      )

      localStorage.removeItem(
        'metricmind_user'
      )

      setToken(null)
      setUser(null)
    }
  }

  // ==========================================================
  // CHECK CURRENT USER
  // ==========================================================

  useEffect(() => {
    const checkAuthentication = async () => {
      const storedToken =
        localStorage.getItem(
          'metricmind_token'
        )

      const storedUser =
        getStoredUser()

      // No token = not logged in
      if (!storedToken) {
        setToken(null)
        setUser(null)
        setLoading(false)
        return
      }

      try {
        console.log(
          'Checking authentication with token'
        )

        const response = await axios.get(
          `${API_BASE_URL}/v1/auth/me`,
          {
            headers: {
              Authorization:
                `Bearer ${storedToken}`,
            },
          }
        )

        console.log(
          'Auth /me response:',
          response.data
        )

        const currentUser =
          response.data.user ||
          response.data

        setToken(storedToken)
        setUser(currentUser)

        localStorage.setItem(
          'metricmind_user',
          JSON.stringify(currentUser)
        )

      } catch (error) {
        console.error(
          'Authentication check failed:',
          error
        )

        if (error.response?.status === 401) {
          console.log(
            'Token is invalid or expired. Clearing session.'
          )

          localStorage.removeItem(
            'metricmind_token'
          )

          localStorage.removeItem(
            'metricmind_user'
          )

          setToken(null)
          setUser(null)
        } else if (storedUser) {
          // Keep the locally stored user if
          // the backend temporarily cannot be reached.
          setToken(storedToken)
          setUser(storedUser)
        }
      } finally {
        setLoading(false)
      }
    }

    checkAuthentication()
  }, [])

  // ==========================================================
  // CONTEXT VALUE
  // ==========================================================

  const value = {
    user,
    token,

    login,
    register,
    logout,

    loading,

    isAuthenticated:
      Boolean(token && user),
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}