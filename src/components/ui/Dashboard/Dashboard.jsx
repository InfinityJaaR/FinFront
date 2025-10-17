import React from "react"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  Home,
  TrendingUp,
  Wallet,
  CreditCard,
  BarChart3,
  Settings,
  HelpCircle,
  Bell,
  Search,
  Menu,
  ChevronRight,
  User,
  LogOut,
  Shield,
  DollarSign,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react"
import { cn } from "@/lib/utils"

const FinancialDashboard = ({
  userName = "Juan Pérez",
  userRole = "Administrador",
  userAvatar,
  onLogout,
}) => {
  const navigate = useNavigate()
  const [isDrawerOpen, setIsDrawerOpen] = useState(true)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState("Dashboard")
  const [isUserButtonHovered, setIsUserButtonHovered] = useState(false)
  const [isProfileHovered, setIsProfileHovered] = useState(false)
  const [isLogoutHovered, setIsLogoutHovered] = useState(false)

  const handleLogout = async () => {
    if (onLogout) {
      await onLogout()
    }
    navigate('/')
  }

  // Menú de navegación
  const menuItems = [
    { icon: Home, label: "Dashboard", href: "/dashboard" },
    { icon: Wallet, label: "Cuentas", href: "/accounts", badge: 3 },
    { icon: CreditCard, label: "Transacciones", href: "/transactions" },
    { icon: TrendingUp, label: "Inversiones", href: "/investments" },
    { icon: BarChart3, label: "Reportes", href: "/reports" },
    { icon: PieChart, label: "Análisis", href: "/analytics" },
    { icon: Settings, label: "Configuración", href: "/settings" },
    { icon: HelpCircle, label: "Ayuda", href: "/help" },
  ]

  // Breadcrumbs dinámicos
  const breadcrumbs = [
    { label: "Inicio", href: "/" },
    { label: currentPage, href: "#" },
  ]

  // Datos de ejemplo para el dashboard
  const stats = [
    {
      title: "Balance Total",
      value: "$45,231.89",
      change: "+20.1%",
      isPositive: true,
      icon: Wallet,
      color: "from-blue-500 to-cyan-500",
    },
    {
      title: "Inversiones",
      value: "$12,234.56",
      change: "+15.3%",
      isPositive: true,
      icon: TrendingUp,
      color: "from-green-500 to-emerald-500",
    },
    {
      title: "Gastos del Mes",
      value: "$3,456.78",
      change: "-4.3%",
      isPositive: false,
      icon: CreditCard,
      color: "from-orange-500 to-red-500",
    },
    {
      title: "Ahorros",
      value: "$8,234.00",
      change: "+8.2%",
      isPositive: true,
      icon: PieChart,
      color: "from-purple-500 to-pink-500",
    },
  ]

  const recentTransactions = [
    { id: 1, name: "Transferencia a Juan", amount: -250.0, date: "Hoy, 10:30 AM", type: "transfer" },
    { id: 2, name: "Salario Mensual", amount: 5000.0, date: "Ayer, 9:00 AM", type: "income" },
    { id: 3, name: "Pago Netflix", amount: -15.99, date: "15 Oct, 2024", type: "subscription" },
    { id: 4, name: "Dividendos Acciones", amount: 180.5, date: "14 Oct, 2024", type: "investment" },
    { id: 5, name: "Compra Supermercado", amount: -125.75, date: "13 Oct, 2024", type: "expense" },
  ]

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
          {menuItems.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.label}
                onClick={() => setCurrentPage(item.label)}
                style={{
                  backgroundColor: currentPage === item.label 
                    ? 'rgb(59, 130, 246)' 
                    : 'transparent'
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative",
                  currentPage === item.label
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
                  {userName.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{userName}</p>
                  <p className="text-xs text-gray-300 truncate">{userRole}</p>
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

            {/* Lado derecho: Búsqueda, notificaciones y usuario */}
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
                    {userName.charAt(0)}
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium" style={{ color: '#111827' }}>{userName}</p>
                    <p className="text-xs" style={{ color: '#6B7280' }}>{userRole}</p>
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
                            {userName.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-semibold" style={{ color: '#111827' }}>{userName}</p>
                            <p className="text-xs" style={{ color: '#6B7280' }}>{userRole}</p>
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

        {/* Contenido del Dashboard */}
        <main className="p-6">
          {/* Encabezado del dashboard */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard Financiero</h1>
            <p className="text-gray-600">Bienvenido de nuevo, {userName}. Aquí está tu resumen financiero.</p>
          </div>

          {/* Tarjetas de estadísticas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat) => {
              const Icon = stat.icon
              return (
                <div
                  key={stat.title}
                  className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={cn("p-3 rounded-xl bg-gradient-to-br", stat.color)}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex items-center gap-1 text-sm">
                      {stat.isPositive ? (
                        <ArrowUpRight className="h-4 w-4 text-green-600" />
                      ) : (
                        <ArrowDownRight className="h-4 w-4 text-red-600" />
                      )}
                      <span className={cn("font-medium", stat.isPositive ? "text-green-600" : "text-red-600")}>
                        {stat.change}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              )
            })}
          </div>

          {/* Grid de contenido */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Transacciones recientes */}
            <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Transacciones Recientes</h2>
                <button className="text-sm text-blue-600 hover:text-blue-700 font-medium" style={{background: "transparent", border: "none", outline: "none"}}>Ver todas</button>
              </div>

              <div className="space-y-4">
                {recentTransactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between py-3 border-b border-gray-100">
                    <div className="flex items-center gap-4">
                      <div
                        className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center",
                          transaction.amount > 0 ? "bg-green-100" : "bg-red-100",
                        )}
                      >
                        <DollarSign
                          className={cn("h-5 w-5", transaction.amount > 0 ? "text-green-600" : "text-red-600")}
                        />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{transaction.name}</p>
                        <p className="text-xs text-gray-500">{transaction.date}</p>
                      </div>
                    </div>
                    <p
                      className={cn(
                        "text-sm font-semibold",
                        transaction.amount > 0 ? "text-green-600" : "text-red-600",
                      )}
                    >
                      {transaction.amount > 0 ? "+" : ""}${Math.abs(transaction.amount).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Panel lateral */}
            <div className="space-y-6">
              {/* Acciones rápidas */}
              <div className="rounded-2xl p-6" style={{ background: 'linear-gradient(to bottom right, #3B82F6, #06B6D4)', color: 'white' }}>
                <h3 className="text-lg font-bold mb-4">Acciones Rápidas</h3>
                <div className="space-y-3">
                  <button 
                    style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', backdropFilter: 'blur(8px)' }}
                    className="w-full hover:bg-white/30 rounded-xl px-4 py-3 text-left transition-colors flex items-center gap-3"
                  >
                    <CreditCard className="h-5 w-5" />
                    <span className="text-sm font-medium">Nueva Transferencia</span>
                  </button>
                  <button 
                    style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', backdropFilter: 'blur(8px)' }}
                    className="w-full hover:bg-white/30 rounded-xl px-4 py-3 text-left transition-colors flex items-center gap-3"
                  >
                    <TrendingUp className="h-5 w-5" />
                    <span className="text-sm font-medium">Invertir</span>
                  </button>
                  <button 
                    style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', backdropFilter: 'blur(8px)' }}
                    className="w-full hover:bg-white/30 rounded-xl px-4 py-3 text-left transition-colors flex items-center gap-3"
                  >
                    <BarChart3 className="h-5 w-5" />
                    <span className="text-sm font-medium">Ver Reportes</span>
                  </button>
                </div>
              </div>

              {/* Consejos */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Consejo del Día</h3>
                <div className="bg-blue-50 rounded-xl p-4">
                  <p className="text-sm text-gray-700">
                    Considera diversificar tu portafolio de inversiones para minimizar riesgos.
                  </p>
                </div>
              </div>
            </div>
          </div>
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
