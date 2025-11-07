import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Route, Routes, Navigate, Outlet, useLocation } from 'react-router-dom'
import './App.css'
import Login from './pages/auth/LoginScreen'
import Dashboard from './components/ui/Dashboard/Dashboard'
import Inicio from './pages/dashboard/Inicio'
import authService from './services/auth/authService'
import RubrosPage from './pages/GestionEmpresas/Rubros/RubroPage'
import EmpresaPage from './pages/GestionEmpresas/Empresas/EmpresaPage'
import RatiosPage from './pages/GestionEmpresas/Ratios/RatiosPage'
import RubroFormPage from './pages/GestionEmpresas/Rubros/RubroFormPage'
import EmpresaFormPage from './pages/GestionEmpresas/Empresas/EmpresaFormPage'
import RatioFormPage from './pages/GestionEmpresas/Ratios/RatioFormPage'
import CatalogoPage from './pages/GestionCuentas/Catalogo'
import NuevoCatalogoPage from './pages/GestionCuentas/NuevoCatalogo'
import { ModalProvider } from '@/context/ModalContext'
import RatiosEmpresa from './pages/GestionEmpresas/Ratios/RatiosEmpresa';
import ComparacionesInternasPage from "./pages/GestionEmpresas/Ratios/ComparacionesInternasPage";
import EstadosFinancierosPage from './pages/EstadosFinancieros/EstadosFinancieros';
import NuevoEstadoPage from './components/EstadosFinancieros/NuevoEstado';
import ImportarEstadoPage from './components/EstadosFinancieros/ImportarEstado';
import BenchmarkPromedio from "@/components/GestionEmpresas/Ratios/BenchmarkPromedio";
import AnalisisBalancePage from './pages/AnalisisVerticalHorizontal/AnalisisBalance';

import { useParams } from 'react-router-dom';

// Función para verificar autenticación leyendo de localStorage
function isAuthenticated() {
  return !!localStorage.getItem('token')
}

// Componente para proteger rutas privadas
function PrivateRoute() {
  const location = useLocation()
  if (!isAuthenticated()) {
    return <Navigate to="/" state={{ from: location }} replace />
  }
  return <Outlet />
}

// Componente para evitar mostrar login si ya está autenticado
function PublicRoute({ children }) {
  if (isAuthenticated()) {
    return <Navigate to="/dashboard" replace />
  }
  return children
}

// Componente para proteger rutas por rol
function RoleRoute({ allowedRoles, children }) {
  const user = authService.getCurrentUser()
  const userRoles = user?.roles?.map(r => r.name) || []

  const hasRole = allowedRoles.some(role => userRoles.includes(role))

  if (!hasRole) {
    // Redirigir al dashboard si no tiene el rol requerido
    return <Navigate to="/dashboard" replace />
  }

  return children
}

// Componente para proteger rutas por permiso
function PermissionRoute({ requiredPermissions, children }) {
  const permissions = authService.getPermissions()

  const hasPermission = requiredPermissions.some(permission =>
    permissions.includes(permission)
  )

  if (!hasPermission) {
    // Redirigir al dashboard si no tiene el permiso requerido
    return <Navigate to="/dashboard" replace />
  }

  return children
}

function EmpRatiosWrapper() {
  const { empresaId } = useParams();
  return <RatiosEmpresa empresaId={empresaId} />;
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
      <ModalProvider>
      <Routes>
        {/* Ruta pública para login en "/" */}
        <Route
          path="/"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />

        {/* Rutas protegidas bajo /dashboard */}
        <Route element={<PrivateRoute />}>
          <Route path="/dashboard" element={<Dashboard onLogout={handleLogout} />}>
            {/* Ruta de inicio del dashboard - accesible para todos */}
            <Route index element={<Inicio />} />

            {/* Ejemplos de rutas protegidas por rol */}

            {/* Solo Administradores */}
            <Route
              path="accounts"
              element={
                <RoleRoute allowedRoles={["Administrador", "Admin"]}>
                  {/* <Cuentas /> */}
                  <div className="p-6">
                    <h1 className="text-2xl font-bold">Cuentas</h1>
                    <p>Solo usuarios con rol Administrador o Admin pueden ver esta página.</p>
                  </div>
                </RoleRoute>
              }
            />

              <Route
              path="empresas/:empresaId/ratios"
              element={
                <PermissionRoute requiredPermissions={["ver_ratios"]}>
                  <EmpRatiosWrapper />
                </PermissionRoute>
              }
              />
                         
            <Route
              path="empresas/:empresaId/ratios/comparaciones"
              element={
                <PermissionRoute requiredPermissions={["ver_ratios"]}>
                  <ComparacionesInternasPage />
                </PermissionRoute>
              }
            />

            <Route
              path="/dashboard/benchmark-promedio"
              element={<BenchmarkPromedio />}
            />



            {/* Administradores y Contadores */}
            <Route
              path="transactions"
              element={
                <RoleRoute allowedRoles={["Administrador", "Admin", "Contador"]}>
                  {/* <Transacciones /> */}
                  <div className="p-6">
                    <h1 className="text-2xl font-bold">Transacciones</h1>
                    <p>Solo usuarios con rol Administrador, Admin o Contador pueden ver esta página.</p>
                  </div>
                </RoleRoute>
              }
            />

            {/* Administradores solamente */}
            <Route
              path="investments"
              element={
                <RoleRoute allowedRoles={["Administrador", "Admin"]}>
                  {/* <Inversiones /> */}
                  <div className="p-6">
                    <h1 className="text-2xl font-bold">Inversiones</h1>
                    <p>Solo Administradores pueden ver esta página.</p>
                  </div>
                </RoleRoute>
              }
            />

            {/* Ruta accesible para todos - sin restricciones */}
            <Route
              path="reports"
              element={
                <div className="p-6">
                  <h1 className="text-2xl font-bold">Reportes</h1>
                  <p>Todos los usuarios autenticados pueden ver esta página.</p>
                </div>
              }
            />

            {/* Administradores y Analistas */}
            <Route
              path="analytics"
              element={
                <RoleRoute allowedRoles={["Administrador", "Admin", "Analista"]}>
                  {/* <Analisis /> */}
                  <div className="p-6">
                    <h1 className="text-2xl font-bold">Análisis</h1>
                    <p>Solo Administradores y Analistas pueden ver esta página.</p>
                  </div>
                </RoleRoute>
              }
            />

            {/* Solo Administradores */}
            <Route
              path="settings"
              element={
                <RoleRoute allowedRoles={["Administrador", "Admin"]}>
                  {/* <Configuracion /> */}
                  <div className="p-6">
                    <h1 className="text-2xl font-bold">Configuración</h1>
                    <p>Solo Administradores pueden ver esta página.</p>
                  </div>
                </RoleRoute>
              }
            />
            {/* Grupo: Gestión de empresas (listas + formularios) */}
            <Route path="gestion-empresas">
              {/* Empresas */}
              <Route
                path="empresas"
                element={
                  <PermissionRoute requiredPermissions={["gestionar_empresas"]}>
                    <EmpresaPage />
                  </PermissionRoute>
                }
              />
              <Route
                path="empresas/create"
                element={
                  <PermissionRoute requiredPermissions={["gestionar_empresas"]}>
                    <EmpresaFormPage />
                  </PermissionRoute>
                }
              />
              <Route
                path="empresas/:id"
                element={
                  <PermissionRoute requiredPermissions={["gestionar_empresas"]}>
                    <EmpresaFormPage />
                  </PermissionRoute>
                }
              />
              <Route
                path="empresas/:id/edit"
                element={
                  <PermissionRoute requiredPermissions={["gestionar_empresas"]}>
                    <EmpresaFormPage />
                  </PermissionRoute>
                }
              />

              {/* Rubros */}
              <Route
                path="rubros"
                element={
                  <PermissionRoute requiredPermissions={["gestionar_rubros"]}>
                    <RubrosPage />
                  </PermissionRoute>
                }
              />
              <Route
                path="rubros/create"
                element={
                  <PermissionRoute requiredPermissions={["gestionar_rubros"]}>
                    <RubroFormPage />
                  </PermissionRoute>
                }
              />
              <Route
                path="rubros/:id"
                element={
                  <PermissionRoute requiredPermissions={["gestionar_rubros"]}>
                    <RubroFormPage />
                  </PermissionRoute>
                }
              />
              <Route
                path="rubros/:id/edit"
                element={
                  <PermissionRoute requiredPermissions={["gestionar_rubros"]}>
                    <RubroFormPage />
                  </PermissionRoute>
                }
              />

              {/* Definición de Ratios */}
              <Route
                path="definicion-ratios"
                element={
                  <PermissionRoute requiredPermissions={["gestionar_ratios_definicion"]}>
                    <RatiosPage />
                  </PermissionRoute>
                }
              />
              <Route
                path="definicion-ratios/create"
                element={
                  <PermissionRoute requiredPermissions={["gestionar_ratios_definicion"]}>
                    <RatioFormPage />
                  </PermissionRoute>
                }
              />
              <Route
                path="definicion-ratios/:id"
                element={
                  <PermissionRoute requiredPermissions={["gestionar_ratios_definicion"]}>
                    <RatioFormPage />
                  </PermissionRoute>
                }
              />
              <Route
                path="definicion-ratios/:id/edit"
                element={
                  <PermissionRoute requiredPermissions={["gestionar_ratios_definicion"]}>
                    <RatioFormPage />
                  </PermissionRoute>
                }
              />
            </Route>

            <Route
              path="catalogo-cuentas"
              element={
                <PermissionRoute requiredPermissions={["gestionar_catalogo_cuentas"]}>
                  <CatalogoPage />
                </PermissionRoute>
              }
            />

            <Route
              path="catalogo-cuentas/nuevo"
              element={
                <PermissionRoute requiredPermissions={["gestionar_catalogo_cuentas"]}>
                  <NuevoCatalogoPage />
                </PermissionRoute>
              }
            />

            {/* Estados Financieros */}
            <Route
              path="estados-financieros"
              element={<EstadosFinancierosPage />}
            />
            <Route
              path="estados-financieros/nuevo"
              element={<NuevoEstadoPage />}
            />
            <Route
              path="estados-financieros/importar"
              element={<ImportarEstadoPage />}
            />

            {/* Análisis de Balance General (Vertical y Horizontal) */}
            <Route
              path="analisis-balance"
              element={
                <PermissionRoute requiredPermissions={["analizar_balance"]}>
                  <AnalisisBalancePage />
                </PermissionRoute>
              }
            />

            {/* Accesible para todos */}
            <Route
              path="help"
              element={
                <div className="p-6">
                  <h1 className="text-2xl font-bold">Ayuda</h1>
                  <p>Todos los usuarios pueden acceder a la ayuda.</p>
                </div>
              }
            />

            {/* Aquí puedes agregar más rutas con protección por permisos */}
            {/* Ejemplo con permisos: */}
            {/* <Route 
              path="admin-panel" 
              element={
                <PermissionRoute requiredPermissions={["gestionar_usuarios", "configurar_sistema"]}>
                  <AdminPanel />
                </PermissionRoute>
              } 
            /> */}
          </Route>
        </Route>

        {/* Redirección por defecto */}
        <Route
          path="*"
          element={
            isAuthenticated()
              ? <Navigate to="/dashboard" replace />
              : <Navigate to="/" replace />
          }
        />
      </Routes>
      </ModalProvider>
    </Router>
  )
}

export default App
