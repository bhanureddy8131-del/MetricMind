import React, { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext()

const themes = {
  cobalt: {
    name: 'Bold Cobalt',
    primary: '#2563EB',
    primaryDark: '#1D4ED8',
    primaryLight: '#DBEAFE',
  },

  purple: {
    name: 'Royal Purple',
    primary: '#7C3AED',
    primaryDark: '#6D28D9',
    primaryLight: '#EDE9FE',
  },

  emerald: {
    name: 'Emerald',
    primary: '#059669',
    primaryDark: '#047857',
    primaryLight: '#D1FAE5',
  },

  rose: {
    name: 'Rose',
    primary: '#E11D48',
    primaryDark: '#BE123C',
    primaryLight: '#FFE4E6',
  },
}

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState(() => {
    return localStorage.getItem('metricmind_mode') || 'light'
  })

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('metricmind_theme') || 'cobalt'
  })

  useEffect(() => {
    localStorage.setItem('metricmind_mode', mode)
    localStorage.setItem('metricmind_theme', theme)

    const root = document.documentElement

    root.setAttribute('data-theme', theme)
    root.setAttribute('data-mode', mode)

    const selectedTheme = themes[theme]

    root.style.setProperty('--primary', selectedTheme.primary)
    root.style.setProperty('--primary-dark', selectedTheme.primaryDark)
    root.style.setProperty('--primary-light', selectedTheme.primaryLight)
  }, [mode, theme])

  const toggleMode = () => {
    setMode((current) => (current === 'light' ? 'dark' : 'light'))
  }

  const changeTheme = (newTheme) => {
    if (themes[newTheme]) {
      setTheme(newTheme)
    }
  }

  return (
    <ThemeContext.Provider
      value={{
        mode,
        theme,
        themes,
        toggleMode,
        changeTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}