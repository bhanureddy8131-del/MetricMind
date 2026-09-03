import { createContext, useState } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('metricmind_user') || 'null'))

  const login = (email, name = email.split('@')[0]) => {
    const next = { email, name }
    localStorage.setItem('metricmind_user', JSON.stringify(next))
    setUser(next)
  }
  const logout = () => { localStorage.removeItem('metricmind_user'); setUser(null) }

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>
}

export { AuthContext }
