import { createContext, useEffect, useState } from 'react'
import axios from 'axios'

export const AuthContext = createContext(null)

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  'http://127.0.0.1:8001/api'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)

  const [loading, setLoading] = useState(true)

  const [token, setToken] = useState(() =>
    localStorage.getItem('metricmind_token')
  )

  useEffect(() => {
    async function initializeAuth() {
      const savedToken =
        localStorage.getItem('metricmind_token')

      if (!savedToken) {
        setLoading(false)
        return
      }

      try {
        const response = await axios.get(
          `${API_BASE_URL}/v1/auth/me`,
          {
            headers: {
              Authorization: `Bearer ${savedToken}`,
            },
          }
        )

        const userData =
          response.data?.user ||
          response.data

        setUser(userData)
        setToken(savedToken)
      } catch (error) {
        console.log(
          'Saved MetricMind session is invalid.'
        )

        localStorage.removeItem(
          'metricmind_token'
        )

        localStorage.removeItem(
          'metricmind_user'
        )

        setToken(null)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    initializeAuth()
  }, [])

  const login = async (email, password) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/v1/auth/login`,
        {
          email: email.trim(),
          password,
        }
      )

      const accessToken =
        response.data?.access_token

      const userData =
        response.data?.user

      if (!accessToken) {
        return {
          success: false,
          error:
            'Backend did not return an access token.',
        }
      }

      localStorage.setItem(
        'metricmind_token',
        accessToken
      )

      localStorage.setItem(
        'metricmind_user',
        JSON.stringify(userData || {})
      )

      setToken(accessToken)
      setUser(userData || null)

      return {
        success: true,
        user: userData,
      }
    } catch (error) {
      console.error('Login error:', error)

      if (error.response?.status === 401) {
        return {
          success: false,
          error: 'Invalid email or password.',
        }
      }

      if (!error.response) {
        return {
          success: false,
          error:
            'Cannot connect to MetricMind backend. Make sure port 8001 is running.',
        }
      }

      return {
        success: false,
        error:
          error.response?.data?.detail ||
          'Login failed.',
      }
    }
  }

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
          full_name: full_name.trim(),
          username: username.trim(),
          email: email.trim(),
          password,
        }
      )

      const accessToken =
        response.data?.access_token

      const userData =
        response.data?.user

      if (accessToken) {
        localStorage.setItem(
          'metricmind_token',
          accessToken
        )

        localStorage.setItem(
          'metricmind_user',
          JSON.stringify(userData || {})
        )

        setToken(accessToken)
        setUser(userData || null)
      }

      return {
        success: true,
        user: userData,
      }
    } catch (error) {
      console.error(
        'Registration error:',
        error
      )

      return {
        success: false,
        error:
          error.response?.data?.detail ||
          'Registration failed.',
      }
    }
  }

  const logout = async () => {
    const currentToken =
      localStorage.getItem(
        'metricmind_token'
      )

    try {
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
      console.log(
        'Logout completed locally.'
      )
    }

    localStorage.removeItem(
      'metricmind_token'
    )

    localStorage.removeItem(
      'metricmind_user'
    )

    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: Boolean(token),
        login,
        register,
        logout,
        API_BASE_URL,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}