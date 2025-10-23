import React from 'react'
import { 
  DollarSign, 
  TrendingUp, 
  Wallet, 
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  PieChart 
} from 'lucide-react'
import { cn } from '@/lib/utils'

const Inicio = () => {
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
    <div>
      {/* Encabezado del dashboard */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard Financiero</h1>
        <p className="text-gray-600">Bienvenido de nuevo. Aquí está tu resumen financiero.</p>
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
            <button className="text-sm text-blue-600 hover:text-blue-700 font-medium" style={{background: "transparent", border: "none", outline: "none"}}>
              Ver todas
            </button>
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
                <TrendingUp className="h-5 w-5" />
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
    </div>
  )
}

export default Inicio
