import { useState } from 'react'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom'
import './App.css'
import Login from './pages/auth/LoginScreen'
import Dashboard from './components/ui/Dashboard/Dashboard'
import { useAuth } from './hooks/auth/useAuth'

function App() {
  const { isAuthenticated, loading, logout } = useAuth()

  return (
    <Router>
      <Routes>
        <Route path="/" element={!isAuthenticated ? <Login /> : <Navigate to="/dashboard" />} />
        <Route 
          path="/dashboard" 
          element={isAuthenticated ? <Dashboard onLogout={logout} /> : <Navigate to="/" />} 
        />
      </Routes>
    </Router>
  )
}

export default App
