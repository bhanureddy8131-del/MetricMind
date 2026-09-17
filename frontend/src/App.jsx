import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom'

import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'

import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import DatasetUpload from './pages/DatasetUpload'
import AddData from './pages/AddData'
import Reports from './pages/Reports'
import Settings from './pages/Settings'


function ProtectedRoute({ children }) {
  const token = localStorage.getItem('metricmind_token')

  if (!token) {
    return (
      <Navigate
        to="/login"
        replace
      />
    )
  }

  return children
}


export default function App() {
  return (
    <BrowserRouter>

      <ThemeProvider>

        <AuthProvider>

          <Routes>

            {/* Login */}
            <Route
              path="/login"
              element={<Login />}
            />

            {/* Register */}
            <Route
              path="/register"
              element={<Register />}
            />

            {/* Dashboard */}
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

            {/* Dataset */}
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

            {/* Add Data */}
            <Route
              path="/add-data"
              element={
                <ProtectedRoute>
                  <AddData />
                </ProtectedRoute>
              }
            />

            {/* Reports */}
            <Route
              path="/reports"
              element={
                <ProtectedRoute>
                  <Reports />
                </ProtectedRoute>
              }
            />

            {/* Settings */}
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }
            />

            {/* Unknown URL */}
            <Route
              path="*"
              element={
                <Navigate
                  to="/"
                  replace
                />
              }
            />

          </Routes>

        </AuthProvider>

      </ThemeProvider>

    </BrowserRouter>
  )
}