import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom'
import './App.css'
import Login from './pages/auth/LoginScreen'
import Dashboard from './components/ui/Dashboard/Dashboard'
import authService from './services/auth/authService'

// Función para verificar autenticación leyendo de localStorage
function isAuthenticated() {
  return !!localStorage.getItem('token')
}

function App() {
  // Estado local que se sincroniza con localStorage
  const [auth, setAuth] = useState(isAuthenticated())

  useEffect(() => {
    // Actualizar el estado cuando cambie localStorage
    const handleStorageChange = () => {
      setAuth(isAuthenticated())
    }

    // Escuchar cambios en el storage
    window.addEventListener('storage', handleStorageChange)
    
    // También podemos forzar una verificación periódica
    const interval = setInterval(() => {
      setAuth(isAuthenticated())
    }, 100) // Verificar cada 100ms

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      clearInterval(interval)
    }
  }, [])

  const handleLogout = async () => {
    await authService.logout()
    setAuth(false)
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={!auth ? <Login /> : <Navigate to="/dashboard" />} />
        <Route 
          path="/dashboard" 
          element={auth ? <Dashboard onLogout={handleLogout} /> : <Navigate to="/" />} 
        />
      </Routes>
    </Router>
  )
}

export default App
