import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'

import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import DatasetUpload from './pages/DatasetUpload'
import AddData from './pages/AddData'
import Reports from './pages/Reports'
import Settings from './pages/Settings'
import AIQuery from './pages/AIQuery'


function ProtectedRoute({ children }) {
  const token = localStorage.getItem('metricmind_token')

  if (!token) {
    return <Navigate to="/login" replace />
  }

  return children
}


function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>

          <Routes>

            <Route
              path="/login"
              element={<Login />}
            />

            <Route
              path="/register"
              element={<Register />}
            />

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
              path="/ai-query"
              element={
                <ProtectedRoute>
                  <AIQuery />
                </ProtectedRoute>
              }
            />

            <Route
              path="/query"
              element={
                <ProtectedRoute>
                  <AIQuery />
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

            <Route
              path="/add-data"
              element={
                <ProtectedRoute>
                  <AddData />
                </ProtectedRoute>
              }
            />

            <Route
              path="/reports"
              element={
                <ProtectedRoute>
                  <Reports />
                </ProtectedRoute>
              }
            />

            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }
            />

            <Route
              path="*"
              element={<Navigate to="/" replace />}
            />

          </Routes>

        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}


export default App