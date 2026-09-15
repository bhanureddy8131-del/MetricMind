import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'

import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import DatasetUpload from './pages/DatasetUpload'

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('metricmind_token')

  if (!token) {
    return <Navigate to="/login" replace />
  }

  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route path="/register" element={<Register />} />

            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/dataset"
              element={
                <ProtectedRoute>
                  <DatasetUpload />
                </ProtectedRoute>
              }
            />

            <Route
              path="/dataset-upload"
              element={
                <ProtectedRoute>
                  <DatasetUpload />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}