import React from 'react'
import {
  PieChart,
  LineChart,
  BarChart3,
  Layers,
  FileSpreadsheet,
  Settings
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { useAuth } from '@/hooks/auth/useAuth'
import useEmpresaActiva from '@/hooks/GestionEmpresas/Empresas/useEmpresaActiva'

const Inicio = () => {
  const { getUserRole } = useAuth()
  const role = getUserRole()
  const isAnalyst = /analista/i.test(role || '')
  const { empresaActiva } = useEmpresaActiva()

  const modules = [
    {
      title: 'Ventas y Proyecciones',
      description:
        'Registra montos mensuales, importa desde Excel (Mes/Ventas), completa el Mes 12 con Suavizamiento Exponencial y descarga proyecciones en PDF.',
      Icon: LineChart,
      color: 'from-indigo-500 to-sky-500',
    },
    {
      title: 'Estados Financieros',
      description:
        'Administra Balance General y Estado de Resultados. Descarga plantillas y carga datos para acelerar la preparación de informes.',
      Icon: FileSpreadsheet,
      color: 'from-emerald-500 to-green-600',
    },
    {
      title: 'Catálogo de Cuentas',
      description:
        'Crea y gestiona catálogos, edita cuentas y realiza asignaciones para mapeo contable.',
      Icon: Layers,
      color: 'from-fuchsia-500 to-pink-500',
    },
    {
      title: 'Ratios y Benchmark',
      description:
        'Define ratios, calcula indicadores y compara resultados por empresa o rubro.',
      Icon: BarChart3,
      color: 'from-orange-500 to-amber-500',
    },
    {
      title: 'Análisis Vertical/Horizontal',
      description:
        'Analiza estructura y variaciones para apoyar la toma de decisiones.',
      Icon: PieChart,
      color: 'from-cyan-500 to-teal-500',
    },
    {
      title: 'Utilidades',
      description:
        'Exportación a PDF, plantillas CSV/Excel y una UI consistente para una experiencia fluida.',
      Icon: Settings,
      color: 'from-slate-500 to-gray-600',
    },
  ]

  return (
    <div>
      {/* Introducción */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Inicio</h1>
        <p className="text-gray-700">
          Bienvenido a la plataforma de gestión financiera. Este es un resumen de lo que puedes hacer.
        </p>
        {isAnalyst && (
          <p className="text-sm text-gray-700 mt-2">
            <span className="font-medium">Empresa asociada:</span>{' '}
            {empresaActiva ? (empresaActiva.nombre || empresaActiva.nombre_corto || `ID ${empresaActiva.id}`) : 'Sin empresa asignada'}
          </p>
        )}
      </div>

      {/* Resumen con tarjetas de texto */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map(({ title, description, Icon, color }) => (
          <Card key={title} className="overflow-hidden">
            <CardHeader className="flex flex-row items-center gap-3">
              <div className={cn('p-3 rounded-xl bg-gradient-to-br text-white', color)}>
                <Icon className="h-6 w-6" />
              </div>
              <CardTitle className="text-base">{title}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 pb-5">
              <p className="text-sm text-gray-600 leading-relaxed">{description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default Inicio
