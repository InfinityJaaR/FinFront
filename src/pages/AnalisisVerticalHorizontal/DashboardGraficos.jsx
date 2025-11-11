import { useState, useEffect } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { BarChart } from '@mui/x-charts/BarChart'
import { PieChart } from '@mui/x-charts/PieChart'
import { Box, Alert, AlertTitle } from '@mui/material'
import { 
  ArrowLeft, 
  TrendingUp, 
  BarChart3, 
  PieChart as PieChartIcon,
  Layers,
  DollarSign
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs"
import { Button } from "../../components/ui/button"

/**
 * Componente Dashboard de Gráficos para Análisis Vertical y Horizontal
 * Utiliza Material UI Charts para visualización de datos financieros
 */
export default function DashboardGraficos() {
  const location = useLocation()
  const navigate = useNavigate()
  const [tabValue, setTabValue] = useState("general")
  
  // Obtener datos del state de navegación
  const datosAnalisis = location.state?.datos

  useEffect(() => {
    // Si no hay datos, redirigir al análisis
    if (!datosAnalisis) {
      navigate('/dashboard/analisis-balance')
    }
  }, [datosAnalisis, navigate])

  if (!datosAnalisis) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="mx-auto max-w-7xl">
          <Alert severity="warning">
            <AlertTitle>Sin datos disponibles</AlertTitle>
            No hay datos para mostrar. Regresa al análisis y genera los datos primero.
          </Alert>
        </div>
      </div>
    )
  }

  const formatearMoneda = (valor) => {
    return new Intl.NumberFormat('es-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(valor)
  }

  const formatearPorcentaje = (valor) => {
    if (valor === null || valor === undefined) return 'N/D'
    return `${(valor * 100).toFixed(2)}%`
  }

  const formatearSeccion = (seccion) => {
    switch (seccion) {
      case 'ACTIVO':
        return 'Activo'
      case 'PASIVO':
        return 'Pasivo'
      case 'PATRIMONIO':
        return 'Patrimonio'
      default:
        return seccion || 'N/A'
    }
  }

  // Determinar si es cuenta submayor o mayor
  const esSubmayor = (linea) => {
    if (linea.es_calculada !== undefined) {
      return linea.es_calculada === true || linea.es_calculada === 1
    }
    
    const codigo = linea.codigo?.toString().trim() || ''
    
    if (/^\d{4}$/.test(codigo)) {
      if (/\d000$/.test(codigo)) return true
      if (/\d{2}00$/.test(codigo)) return true
      return false
    }
    
    if (codigo.includes('.')) {
      const partes = codigo.split('.')
      if (partes.length === 1 && /^\d$/.test(codigo)) return true
      if (partes.length === 2 && /^\d+\.\d+$/.test(codigo)) return true
      return false
    }
    
    if (/^\d$/.test(codigo)) return true
    return false
  }

  // Determinar si es cuenta de mayor (ACTIVO, PASIVO, PATRIMONIO)
  const esCuentaMayor = (linea) => {
    const codigo = linea.codigo?.toString().trim() || ''
    
    // Formato numérico: termina en "000" (ej: 1000, 2000, 3000)
    if (/^\d{4}$/.test(codigo)) {
      if (/\d000$/.test(codigo)) return true
      return false
    }
    
    // Formato con puntos: un solo dígito (ej: 1, 2, 3)
    if (codigo.includes('.')) {
      const partes = codigo.split('.')
      if (partes.length === 1 && /^\d$/.test(codigo)) return true
      return false
    }
    
    // Un solo dígito sin punto (ej: 1, 2, 3)
    if (/^\d$/.test(codigo)) return true
    
    return false
  }

  // Paleta de colores para los gráficos de barras
  const coloresBarra = [
    '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981',
    '#06b6d4', '#6366f1', '#f43f5e', '#14b8a6', '#84cc16',
    '#a855f7', '#fb923c', '#22d3ee', '#facc15', '#4ade80'
  ]

  // Preparar datos para el análisis de cuentas principales
  const prepararDatosPrincipales = () => {
    if (!datosAnalisis?.lineas) return []
    
    // Incluir todas las cuentas (detalle y subcuentas de mayor) excepto cuentas de mayor (ACTIVO, PASIVO, PATRIMONIO)
    const lineasPrincipales = datosAnalisis.lineas
      .filter(linea => 
        linea.seccion && 
        (linea.seccion === 'ACTIVO' || linea.seccion === 'PASIVO' || linea.seccion === 'PATRIMONIO') &&
        !esCuentaMayor(linea)
      )
      .sort((a, b) => Math.abs(b.porcentaje || 0) - Math.abs(a.porcentaje || 0))
      .slice(0, 10)
    
    return lineasPrincipales.map((linea, index) => ({
      nombre: linea.nombre.length > 30 ? linea.nombre.substring(0, 27) + '...' : linea.nombre,
      porcentaje: (linea.porcentaje || 0) * 100,
      monto: linea.monto,
      nombreCompleto: linea.nombre,
      seccion: linea.seccion || 'N/A',
      color: coloresBarra[index % coloresBarra.length]
    }))
  }

  // Preparar datos por sección para gráficos de barras
  const prepararDatosSeccion = (seccion) => {
    if (!datosAnalisis?.lineas) return []
    
    // Incluir todas las cuentas de la sección (detalle y subcuentas de mayor) excepto cuentas de mayor
    const lineasSeccion = datosAnalisis.lineas
      .filter(linea => linea.seccion === seccion && !esCuentaMayor(linea))
      .sort((a, b) => Math.abs(b.porcentaje || 0) - Math.abs(a.porcentaje || 0))
      .slice(0, 15) // Top 15 cuentas
    
    return {
      categorias: lineasSeccion.map(linea => 
        linea.nombre.length > 25 ? linea.nombre.substring(0, 22) + '...' : linea.nombre
      ),
      porcentajes: lineasSeccion.map(linea => (linea.porcentaje || 0) * 100),
      montos: lineasSeccion.map(linea => linea.monto)
    }
  }

  const datosPrincipales = prepararDatosPrincipales()
  const datosActivo = prepararDatosSeccion('ACTIVO')
  const datosPasivo = prepararDatosSeccion('PASIVO')
  const datosPatrimonio = prepararDatosSeccion('PATRIMONIO')

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header similar al de AnalisisBalance */}
        <div className="space-y-2">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">
                  Análisis gráfico del balance general
                </h1>
                <p className="text-muted-foreground">
                  Visualización gráfica del análisis vertical del balance general
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => navigate('/dashboard/analisis-balance')}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver al Análisis
            </Button>
          </div>
        </div>

        {/* Tabs con estilo toggle similar a AnalisisBalance */}
        <Tabs value={tabValue} onValueChange={setTabValue} className="w-full">
          <TabsList className="grid w-full grid-cols-4 h-auto">
            <TabsTrigger value="general" className="gap-2 py-3">
              <Layers className="h-4 w-4" />
              General
            </TabsTrigger>
            <TabsTrigger value="activo" className="gap-2 py-3">
              <BarChart3 className="h-4 w-4" />
              Activo
            </TabsTrigger>
            <TabsTrigger value="pasivo" className="gap-2 py-3">
              <DollarSign className="h-4 w-4" />
              Pasivo
            </TabsTrigger>
            <TabsTrigger value="patrimonio" className="gap-2 py-3">
              <PieChartIcon className="h-4 w-4" />
              Patrimonio
            </TabsTrigger>
          </TabsList>

          {/* Tab General - Estado de las cuentas */}
          <TabsContent value="general" className="mt-6 space-y-6">
            {/* Distribución del Balance */}
            <Card>
              <CardHeader>
                <CardTitle>Distribución del Balance General</CardTitle>
              </CardHeader>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                  <PieChart
                    series={[
                      {
                        data: [
                          {
                            id: 0,
                            value: datosAnalisis?.totales?.ACTIVO || 0,
                            label: 'Activo',
                            color: '#2563eb'
                          },
                          {
                            id: 1,
                            value: datosAnalisis?.totales?.PASIVO || 0,
                            label: 'Pasivo',
                            color: '#f59e0b'
                          },
                          {
                            id: 2,
                            value: datosAnalisis?.totales?.PATRIMONIO || 0,
                            label: 'Patrimonio',
                            color: '#8b5cf6'
                          }
                        ].filter(item => item.value > 0),
                        highlightScope: { faded: 'global', highlighted: 'item' },
                        faded: { innerRadius: 30, additionalRadius: -30, color: 'gray' },
                        valueFormatter: (item) => formatearMoneda(item.value),
                        arcLabel: (item) => {
                          const totalBalance = (datosAnalisis?.totales?.ACTIVO || 0) + 
                                              (datosAnalisis?.totales?.PASIVO || 0) + 
                                              (datosAnalisis?.totales?.PATRIMONIO || 0)
                          const porcentaje = totalBalance > 0 ? (item.value / totalBalance * 100) : 0
                          return `${porcentaje.toFixed(1)}%`
                        },
                        arcLabelMinAngle: 20,
                        innerRadius: 60,
                        outerRadius: 140,
                        paddingAngle: 2,
                        cornerRadius: 5,
                      },
                    ]}
                    width={700}
                    height={400}
                    slotProps={{
                      legend: {
                        direction: 'row',
                        position: { vertical: 'bottom', horizontal: 'middle' },
                        padding: { top: 20 },
                        itemMarkWidth: 20,
                        itemMarkHeight: 20,
                        markGap: 8,
                        itemGap: 20,
                      },
                    }}
                  />
                </Box>
              </CardContent>
            </Card>

            {/* Cuentas con Mayor Participación - Gráfico */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Cuentas con Mayor Participación en el Balance
                </CardTitle>
              </CardHeader>
              <CardContent>
                {datosPrincipales.length > 0 ? (
                  <Box sx={{ width: '100%', overflowY: 'auto', mb: 0}}>
                    <BarChart
                      xAxis={[
                        { 
                          scaleType: 'band', 
                          data: datosPrincipales.map(d => d.nombre),
                          label: 'Cuentas',
                          tickLabelStyle: {
                            angle: -45,
                            textAnchor: 'end',
                            fontSize: 11,
                          }
                        }
                      ]}
                      yAxis={[
                        {
                          label: 'Participación (%)'
                        }
                      ]}
                      series={[
                        {
                          data: datosPrincipales.map(cuenta => cuenta.porcentaje),
                          label: 'Participación (%)',
                          color: '#3366FF',
                          valueFormatter: (value) => value ? `${value.toFixed(2)}%` : '',
                        }
                      ]}
                      width={1000}
                      height={400}
                      margin={{ bottom: 60, left: 80 }}
                      barCategoryGap={0.2}
                      grid={{ horizontal: false, vertical: false }}
                      slotProps={{
                        legend: {
                          direction: 'row',
                          position: { vertical: 'top', horizontal: 'center' },
                          padding: { bottom: 20 },
                        },
                        tooltip: {
                          content: ({ itemData, axisValue }) => {
                            if (!itemData || itemData.value === null || itemData.value === undefined) {
                              return null
                            }
                            const value = typeof itemData.value === 'number' ? itemData.value : parseFloat(itemData.value)
                            if (isNaN(value)) return null
                            return `${value.toFixed(2)}%`
                          }
                        }
                      }}
                    />
                  </Box>
                ) : (
                  <Alert severity="info">
                    No hay datos suficientes para mostrar el análisis
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Tabla de detalles de las cuentas principales */}
            {datosPrincipales.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Detalle de Participación</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-y-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                            Cuenta
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                            Sección
                          </th>
                          <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                            Monto
                          </th>
                          <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                            Participación
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {datosPrincipales.map((cuenta, index) => (
                          <tr key={index} className="border-b hover:bg-muted/50">
                            <td className="px-4 py-3 text-sm">
                              {cuenta.nombreCompleto}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              {formatearSeccion(cuenta.seccion)}
                            </td>
                            <td className="px-4 py-3 text-sm text-right font-medium">
                              {formatearMoneda(cuenta.monto)}
                            </td>
                            <td className="px-4 py-3 text-sm text-right font-semibold text-primary">
                              {cuenta.porcentaje.toFixed(2)}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Tab Activo */}
          <TabsContent value="activo" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-blue-600"></div>
                    Composición del Activo
                  </CardTitle>
                  <p className="text-lg font-semibold text-blue-600">
                    {formatearMoneda(datosAnalisis?.totales?.ACTIVO || 0)}
                  </p>
                </div>
              </CardHeader>
              <CardContent>
                {datosActivo.categorias.length > 0 ? (
                  <Box sx={{ width: '100%', overflowX: 'auto' }}>
                    <BarChart
                      xAxis={[
                        { 
                          scaleType: 'band', 
                          data: datosActivo.categorias,
                          label: 'Cuentas de Activo',
                          tickLabelStyle: {
                            angle: -45,
                            textAnchor: 'end',
                            fontSize: 11,
                          }
                        }
                      ]}
                      yAxis={[
                        {
                          label: 'Participación (%)'
                        }
                      ]}
                      series={[
                        { 
                          data: datosActivo.porcentajes,
                          label: 'Participación (%)',
                          valueFormatter: (value) => `${value.toFixed(2)}%`,
                          color: '#2563eb'
                        }
                      ]}
                      width={1000}
                      height={450}
                      margin={{ bottom: 60, left: 80 }}
                    />
                  </Box>
                ) : (
                  <Alert severity="info">
                    No hay cuentas de activo para mostrar
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Pasivo */}
          <TabsContent value="pasivo" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-amber-600"></div>
                    Composición del Pasivo
                  </CardTitle>
                  <p className="text-lg font-semibold text-amber-600">
                    {formatearMoneda(datosAnalisis?.totales?.PASIVO || 0)}
                  </p>
                </div>
              </CardHeader>
              <CardContent>
                {datosPasivo.categorias.length > 0 ? (
                  <Box sx={{ width: '100%', overflowX: 'auto' }}>
                    <BarChart
                      xAxis={[
                        { 
                          scaleType: 'band', 
                          data: datosPasivo.categorias,
                          label: 'Cuentas de Pasivo',
                          tickLabelStyle: {
                            angle: -45,
                            textAnchor: 'end',
                            fontSize: 11,
                          }
                        }
                      ]}
                      yAxis={[
                        {
                          label: 'Participación (%)'
                        }
                      ]}
                      series={[
                        { 
                          data: datosPasivo.porcentajes,
                          label: 'Participación (%)',
                          valueFormatter: (value) => `${value.toFixed(2)}%`,
                          color: '#f59e0b'
                        }
                      ]}
                      width={1000}
                      height={450}
                      margin={{ bottom: 60, left: 80 }}
                    />
                  </Box>
                ) : (
                  <Alert severity="info">
                    No hay cuentas de pasivo para mostrar
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Patrimonio */}
          <TabsContent value="patrimonio" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-purple-600"></div>
                    Composición del Patrimonio
                  </CardTitle>
                  <p className="text-lg font-semibold text-purple-600">
                    {formatearMoneda(datosAnalisis?.totales?.PATRIMONIO || 0)}
                  </p>
                </div>
              </CardHeader>
              <CardContent>
                {datosPatrimonio.categorias.length > 0 ? (
                  <Box sx={{ width: '100%', overflowX: 'auto' }}>
                    <BarChart
                      xAxis={[
                        { 
                          scaleType: 'band', 
                          data: datosPatrimonio.categorias,
                          label: 'Cuentas de Patrimonio',
                          tickLabelStyle: {
                            angle: -45,
                            textAnchor: 'end',
                            fontSize: 11,
                          }
                        }
                      ]}
                      yAxis={[
                        {
                          label: 'Participación (%)'
                        }
                      ]}
                      series={[
                        { 
                          data: datosPatrimonio.porcentajes,
                          label: 'Participación (%)',
                          valueFormatter: (value) => `${value.toFixed(2)}%`,
                          color: '#8b5cf6'
                        }
                      ]}
                      width={1000}
                      height={450}
                      margin={{ bottom: 60, left: 80 }}
                    />
                  </Box>
                ) : (
                  <Alert severity="info">
                    No hay cuentas de patrimonio para mostrar
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Información adicional al pie */}
        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <h3 className="font-semibold flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                  Análisis Vertical
                </h3>
                <p className="text-sm text-muted-foreground">
                  Muestra la participación porcentual de cada cuenta respecto al total de su sección.
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  Análisis por Secciones
                </h3>
                <p className="text-sm text-muted-foreground">
                  Explora en detalle la composición de Activo, Pasivo y Patrimonio de forma individual.
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold flex items-center gap-2">
                  <PieChartIcon className="h-5 w-5 text-purple-600" />
                  Visualización
                </h3>
                <p className="text-sm text-muted-foreground">
                  Gráficos interactivos para una mejor comprensión de la información financiera.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
