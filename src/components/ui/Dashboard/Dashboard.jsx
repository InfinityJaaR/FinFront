import React from "react"
import { useState, useEffect } from "react"
import { useNavigate, Outlet, useLocation } from "react-router-dom"
import {
  Home,
  TrendingUp,
  Wallet,
  CreditCard,
  BarChart3,
  Settings,
  HelpCircle,
  Menu,
  ChevronRight,
  User,
  LogOut,
  Shield,
  PieChart,
} from "lucide-react"
import { cn } from "@/lib/utils"
import authService from "@/services/auth/authService"

const FinancialDashboard = ({
  onLogout,
}) => {
  // Obtener información del usuario autenticado
  const [userData, setUserData] = useState({
    userName: "Usuario",
    userRole: "Sin rol",
    roles: [],
    permissions: []
  })

  useEffect(() => {
    const user = authService.getCurrentUser()
    const permissions = authService.getPermissions()

    if (user) {
      // Obtener primer nombre y primer apellido
      // Soporta tanto "name" como "nombre" y "first_name"
      const firstName = (user.name || user.nombre || user.first_name || "")?.split(' ')[0] || ""
      const lastName = (user.last_name || user.apellido || user.apellidos || "")?.split(' ')[0] || ""
      const fullName = `${firstName} ${lastName}`.trim()

      // Obtener el rol
      const role = user.roles?.[0]?.name || user.role?.name || authService.getUserRole() || "Sin rol"

      // Obtener todos los roles (pueden ser múltiples)
      const userRoles = user.roles?.map(r => r.name) || []

      setUserData({
        userName: fullName || user.email || "Usuario",
        userRole: role,
        roles: userRoles,
        permissions: permissions
      })
    }
  }, [])

  const navigate = useNavigate()
  const [isDrawerOpen, setIsDrawerOpen] = useState(true)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState("Dashboard")
  const [isUserButtonHovered, setIsUserButtonHovered] = useState(false)
  const [isProfileHovered, setIsProfileHovered] = useState(false)
  const [isLogoutHovered, setIsLogoutHovered] = useState(false)

  const location = useLocation()

  const handleLogout = async () => {
    if (onLogout) {
      await onLogout()
    }
    navigate('/')
  }

  // Menú de navegación con protección por roles y permisos
  const menuItems = [
    {
      icon: Home,
      label: "Dashboard",
      href: "/dashboard"
      // Sin restricciones - todos pueden ver
    },
    {
      icon: TrendingUp, // Opcional: DollarSign o PieChart, TrendingUp es relevante para sector/ratios
      label: "Rubros",
      href: "/dashboard/rubros",
      permissions: ["gestionar_rubros"],
      roles: ["Administrador"]
    },
    {
      icon: Wallet, // Opcional: DollarSign o PieChart, TrendingUp es relevante para sector/ratios
      label: "Empresas",
      href: "/dashboard/empresas",
      permissions: ["gestionar_empresas"],
      roles: ["Administrador"]
    },
    {
      icon: CreditCard, // Opcional: DollarSign o PieChart, TrendingUp es relevante para sector/ratios
      label: "Ratios",
      href: "/dashboard/rubros",
      permissions: ["gestionar_ratios_definicion"],
      roles: ["Administrador"]
    },
    {
      icon: Wallet,
      label: "Cuentas",
      href: "/dashboard/accounts",
      badge: 3,
      roles: ["Administrador", "Analista Financiero"], // Solo estos roles pueden ver
      // permissions: ["ver_cuentas"] // Opcional: también puedes agregar permisos
    },
    {
      icon: CreditCard,
      label: "Transacciones",
      href: "/dashboard/transactions",
      roles: ["Administrador", "Inversor"],
      // permissions: ["ver_transacciones"]
    },

    {
      icon: TrendingUp,
      label: "Inversiones",
      href: "/dashboard/investments",
      roles: ["Inversor"],
    },
    {
      icon: BarChart3,
      label: "Reportes",
      href: "/dashboard/reports",
      // Sin restricciones - todos pueden ver reportes
    },
    {
      icon: PieChart,
      label: "Análisis",
      href: "/dashboard/analytics",
      roles: ["Administrador", "Analista Financiero"],
    },
    {
      icon: Settings,
      label: "Configuración",
      href: "/dashboard/settings",
      roles: ["Administrador"],
    },
    {
      icon: HelpCircle,
      label: "Ayuda",
      href: "/dashboard/help"
      // Sin restricciones - todos pueden ver ayuda
    },
  ]

  // Función para verificar si el usuario tiene acceso a un item del menú
  const hasAccess = (item) => {
    // Si no tiene restricciones de roles ni permisos, todos tienen acceso
    if (!item.roles && !item.permissions) {
      return true
    }

    // Verificar roles
    if (item.roles && item.roles.length > 0) {
      const hasRole = item.roles.some(role => userData.roles.includes(role))
      if (!hasRole) {
        return false
      }
    }

    // Verificar permisos (opcional)
    if (item.permissions && item.permissions.length > 0) {
      const hasPermission = item.permissions.some(permission =>
        userData.permissions.includes(permission)
      )
      if (!hasPermission) {
        return false
      }
    }

    return true
  }

  // Filtrar items del menú según el acceso del usuario
  const filteredMenuItems = menuItems.filter(hasAccess)

  // Función para generar breadcrumbs automáticamente desde la URL
  const generateBreadcrumbs = () => {
    const pathSegments = location.pathname.split('/').filter(Boolean)

    // Si estamos en /dashboard (página principal), solo mostrar "Inicio"
    if (location.pathname === "/dashboard") {
      return [{ label: "Inicio", href: "#" }]
    }

    const crumbs = [{ label: "Inicio", href: "/dashboard" }]

    let currentPath = ""

    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`

      // Saltar el segmento "dashboard" en los breadcrumbs
      if (segment === "dashboard") {
        return
      }

      // Buscar en menuItems si existe un label definido
      const menuItem = menuItems.find(item => item.href === currentPath)

      // Si es el último segmento, no tiene link (es la página actual)
      const isLast = index === pathSegments.length - 1

      // Convertir el segmento de URL a un nombre legible
      const label = menuItem
        ? menuItem.label
        : segment
          .split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ')

      crumbs.push({
        label,
        href: isLast ? "#" : currentPath
      })
    })

    return crumbs
  }

  const breadcrumbs = generateBreadcrumbs()

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50">
      {/* Drawer Lateral */}
      <aside
        className={cn(
          "fixed left-0 top-0 h-full bg-gradient-to-b from-slate-900 to-blue-900 text-white transition-all duration-300 z-40 shadow-2xl",
          isDrawerOpen ? "w-64" : "w-20",
        )}
      >
        {/* Logo y Toggle */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-white/10">
          {isDrawerOpen && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                <Shield className="h-6 w-6" />
              </div>
              <span className="font-bold text-lg">FinanceApp</span>
            </div>
          )}
          {!isDrawerOpen && (
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mx-auto">
              <Shield className="h-6 w-6" />
            </div>
          )}
        </div>

        {/* Menú de navegación */}
        <nav className="p-4 space-y-2">
          {filteredMenuItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.href
            return (
              <button
                key={item.label}
                onClick={() => {
                  navigate(item.href)
                  setCurrentPage(item.label)
                }}
                style={{
                  backgroundColor: isActive
                    ? 'rgb(59, 130, 246)'
                    : 'transparent'
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative",
                  isActive
                    ? "text-white shadow-lg"
                    : "text-gray-300 hover:text-white hover:bg-white/10",
                )}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {isDrawerOpen && (
                  <>
                    <span className="text-sm font-medium">{item.label}</span>
                    {item.badge && (
                      <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
                {!isDrawerOpen && item.badge && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        {/* Usuario en el drawer (versión compacta) */}
        {isDrawerOpen && (
          <div className="absolute bottom-4 left-4 right-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-full flex items-center justify-center text-white font-semibold">
                  {userData.userName.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{userData.userName}</p>
                  <p className="text-xs text-gray-300 truncate">{userData.userRole}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Contenido Principal */}
      <div className={cn("flex-1 transition-all duration-300", isDrawerOpen ? "ml-64" : "ml-20")}>
        {/* Barra de título */}
        <header className="h-16 bg-white/80 backdrop-blur-xl border-b border-gray-200 sticky top-0 z-30 shadow-sm">
          <div className="h-full flex items-center justify-between px-6">
            {/* Lado izquierdo: Toggle y Breadcrumbs */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsDrawerOpen(!isDrawerOpen)}
                style={{ backgroundColor: 'white', border: 'none', outline: 'none' }}
                className="p-2 hover:opacity-80 rounded-lg transition-opacity"
              >
                <Menu className="h-5 w-5" style={{ color: '#4B5563' }} />
              </button>

              {/* Breadcrumbs */}
              <nav className="flex items-center gap-2 text-sm">
                {breadcrumbs.map((crumb, index) => (
                  <div key={crumb.label} className="flex items-center gap-2">
                    {index > 0 && <ChevronRight className="h-4 w-4" style={{ color: '#9CA3AF' }} />}
                    <button
                      style={{
                        backgroundColor: 'transparent',
                        border: 'none',
                        outline: 'none',
                        color: index === breadcrumbs.length - 1 ? '#2563EB' : '#4B5563',
                        fontWeight: index === breadcrumbs.length - 1 ? '500' : '400'
                      }}
                      className="hover:opacity-80 transition-opacity"
                    >
                      {crumb.label}
                    </button>
                  </div>
                ))}
              </nav>
            </div>

            {/* Lado derecho: usuario */}
            <div className="flex items-center gap-3">
              {/* Usuario con dropdown */}
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  onMouseEnter={() => setIsUserButtonHovered(true)}
                  onMouseLeave={() => setIsUserButtonHovered(false)}
                  style={{
                    backgroundColor: isUserButtonHovered ? '#F3F4F6' : 'white',
                    border: 'none',
                    outline: 'none'
                  }}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg transition-colors"
                >
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold" style={{ background: 'linear-gradient(to bottom right, #3B82F6, #06B6D4)', color: 'white' }}>
                    {userData.userName.charAt(0)}
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium" style={{ color: '#111827' }}>{userData.userName}</p>
                    <p className="text-xs" style={{ color: '#6B7280' }}>{userData.userRole}</p>
                  </div>
                </button>

                {/* Dropdown del usuario */}
                {isUserMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0"
                      style={{ zIndex: 9998 }}
                      onClick={(e) => {
                        e.stopPropagation()
                        setIsUserMenuOpen(false)
                      }}
                    />
                    <div className="absolute right-0 top-full mt-2 w-64 rounded-xl shadow-2xl animate-scale-in" style={{ backgroundColor: 'white', borderWidth: '1px', borderColor: '#E5E7EB', zIndex: 9999 }}>
                      <div className="p-4" style={{ borderBottomWidth: '1px', borderColor: '#E5E7EB' }}>
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold" style={{ background: 'linear-gradient(to bottom right, #3B82F6, #06B6D4)', color: 'white' }}>
                            {userData.userName.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-semibold" style={{ color: '#111827' }}>{userData.userName}</p>
                            <p className="text-xs" style={{ color: '#6B7280' }}>{userData.userRole}</p>
                          </div>
                        </div>
                      </div>

                      <div className="p-2">
                        <button
                          onMouseEnter={() => setIsProfileHovered(true)}
                          onMouseLeave={() => setIsProfileHovered(false)}
                          style={{
                            backgroundColor: isProfileHovered ? '#F3F4F6' : 'transparent',
                            border: 'none',
                            outline: 'none'
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left"
                        >
                          <User className="h-4 w-4" style={{ color: '#4B5563' }} />
                          <span className="text-sm" style={{ color: '#374151' }}>Mi Perfil</span>
                        </button>
                        <div className="h-px my-2" style={{ backgroundColor: '#E5E7EB' }} />
                        <button
                          onClick={handleLogout}
                          onMouseEnter={() => setIsLogoutHovered(true)}
                          onMouseLeave={() => setIsLogoutHovered(false)}
                          style={{
                            backgroundColor: isLogoutHovered ? '#FEF2F2' : 'transparent',
                            border: 'none',
                            outline: 'none'
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left"
                        >
                          <LogOut className="h-4 w-4" style={{ color: '#DC2626' }} />
                          <span className="text-sm font-medium" style={{ color: '#DC2626' }}>Cerrar Sesión</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Contenido del Dashboard - Outlet para rutas anidadas */}
        <main className="p-6">
          <Outlet />
        </main>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes scale-in {
            from {
              opacity: 0;
              transform: scale(0.95);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }

          .animate-scale-in {
            animation: scale-in 0.2s ease-out;
          }
        `
      }} />
    </div>
  )
}

export default FinancialDashboard
