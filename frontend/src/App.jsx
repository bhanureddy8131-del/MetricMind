import { useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import Sidebar from './components/Sidebar'
import { useAuth } from './context/useAuth'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import AIQuery from './pages/AIQuery'
import Analytics from './pages/Analytics'
import Metrics from './pages/Metrics'
import Dimensions from './pages/Dimensions'
import Dataset from './pages/Dataset'
import SQLExplorer from './pages/SQLExplorer'
import Settings from './pages/Settings'
import './App.css'

function AppShell() { const [sidebarOpen, setSidebarOpen] = useState(false); return <div className="app-shell"><Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} /><div className="main-shell"><Navbar onMenu={() => setSidebarOpen(true)} /><main className="content"><Routes><Route path="/" element={<Dashboard />} /><Route path="/query" element={<AIQuery />} /><Route path="/analytics" element={<Analytics />} /><Route path="/metrics" element={<Metrics />} /><Route path="/dimensions" element={<Dimensions />} /><Route path="/dataset" element={<Dataset />} /><Route path="/sql" element={<SQLExplorer />} /><Route path="/settings" element={<Settings />} /><Route path="*" element={<Navigate to="/" replace />} /></Routes></main></div>{sidebarOpen && <button className="scrim" onClick={() => setSidebarOpen(false)} aria-label="Close navigation" />}</div> }

function App() { const { user } = useAuth(); return <Routes><Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} /><Route path="/register" element={user ? <Navigate to="/" replace /> : <Register />} /><Route path="*" element={<ProtectedRoute><AppShell /></ProtectedRoute>} /></Routes> }

export default App
