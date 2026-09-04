import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import LoadingSpinner from './LoadingSpinner'

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()
  
  if (loading) {
    return <LoadingSpinner label="Loading..." />
  }
  
  return isAuthenticated ? children : <Navigate to="/login" replace />
}
