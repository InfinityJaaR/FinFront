import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { useEstadosFinancieros } from "../../hooks/EstadosFinancieros/useEstadosFinancieros"

const formatCurrency = (value) => {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP'
  }).format(value)
}

const calcularTotal = (items) => {
  return items.reduce((sum, item) => sum + item.monto, 0)
}

export default function EstadoResultado({ empresaId, periodoId }) {
  const { obtenerEstado, loading } = useEstadosFinancieros()
  const [datos, setDatos] = useState(null)

  useEffect(() => {
    if (empresaId && periodoId) {
      cargarDatos()
    }
  }, [empresaId, periodoId])

  const cargarDatos = async () => {
    try {
      const response = await obtenerEstado({
        empresa_id: empresaId,
        periodo_id: periodoId,
        tipo: 'RESULTADOS'
      })

      if (response.success && response.data.length > 0) {
        const estado = response.data[0]
        procesarDatos(estado)
      } else {
        setDatos(null)
      }
    } catch (error) {
      console.error('Error al cargar estado de resultados:', error)
      setDatos(null)
    }
  }

  const procesarDatos = (estado) => {
    const detalles = estado.detalles || []
    
    const ingresos = detalles.filter(d => d.catalogo_cuenta?.codigo?.startsWith('4'))
    const costos = detalles.filter(d => d.catalogo_cuenta?.codigo?.startsWith('5'))
    const gastos = detalles.filter(d => d.catalogo_cuenta?.codigo?.startsWith('6'))
    const otros = detalles.filter(d => d.catalogo_cuenta?.codigo?.startsWith('7'))

    setDatos({ ingresos, costos, gastos, otros })
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex min-h-[400px] items-center justify-center">
          <p className="text-muted-foreground">Cargando estado de resultados...</p>
        </CardContent>
      </Card>
    )
  }

  if (!datos) {
    return (
      <Card>
        <CardContent className="flex min-h-[400px] items-center justify-center">
          <p className="text-muted-foreground">No hay datos de estado de resultados para esta empresa y periodo</p>
        </CardContent>
      </Card>
    )
  }

  const totalIngresos = calcularTotal(datos.ingresos)
  const totalCostos = calcularTotal(datos.costos)
  const utilidadBruta = totalIngresos - totalCostos
  const totalGastos = calcularTotal(datos.gastos)
  const totalOtros = calcularTotal(datos.otros)
  const utilidadNeta = utilidadBruta - totalGastos + totalOtros

  return (
    <Card>
      <CardHeader className="bg-primary text-primary-foreground">
        <CardTitle className="text-2xl font-bold">Estado de Resultados</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        {/* Ingresos */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-foreground">Ingresos</h3>
          <div className="space-y-2">
            {datos.ingresos.map((item, index) => (
              <div key={index} className="flex items-center justify-between border-b border-border py-2 last:border-0">
                <span className="text-sm text-foreground">
                  {item.catalogo_cuenta?.codigo} - {item.catalogo_cuenta?.nombre}
                </span>
                <span className="font-medium tabular-nums text-foreground">{formatCurrency(item.monto)}</span>
              </div>
            ))}
            <div className="flex items-center justify-between border-t-2 border-border pt-2">
              <span className="font-semibold text-foreground">Total Ingresos</span>
              <span className="font-bold tabular-nums text-foreground">{formatCurrency(totalIngresos)}</span>
            </div>
          </div>
        </div>

        {/* Costos */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-foreground">Costo de Ventas</h3>
          <div className="space-y-2">
            {datos.costos.map((item, index) => (
              <div key={index} className="flex items-center justify-between border-b border-border py-2 last:border-0">
                <span className="text-sm text-foreground">
                  {item.catalogo_cuenta?.codigo} - {item.catalogo_cuenta?.nombre}
                </span>
                <span className="font-medium tabular-nums text-foreground">{formatCurrency(item.monto)}</span>
              </div>
            ))}
            <div className="flex items-center justify-between border-t-2 border-border pt-2">
              <span className="font-semibold text-foreground">Total Costos</span>
              <span className="font-bold tabular-nums text-foreground">{formatCurrency(totalCostos)}</span>
            </div>
          </div>
        </div>

        {/* Utilidad Bruta */}
        <div className="rounded-lg bg-blue-50 dark:bg-blue-950 p-4">
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold text-foreground">UTILIDAD BRUTA</span>
            <span className="text-xl font-bold text-foreground">{formatCurrency(utilidadBruta)}</span>
          </div>
        </div>

        {/* Gastos Operacionales */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-foreground">Gastos Operacionales</h3>
          <div className="space-y-2">
            {datos.gastos.map((item, index) => (
              <div key={index} className="flex items-center justify-between border-b border-border py-2 last:border-0">
                <span className="text-sm text-foreground">
                  {item.catalogo_cuenta?.codigo} - {item.catalogo_cuenta?.nombre}
                </span>
                <span className="font-medium tabular-nums text-foreground">{formatCurrency(item.monto)}</span>
              </div>
            ))}
            <div className="flex items-center justify-between border-t-2 border-border pt-2">
              <span className="font-semibold text-foreground">Total Gastos</span>
              <span className="font-bold tabular-nums text-foreground">{formatCurrency(totalGastos)}</span>
            </div>
          </div>
        </div>

        {/* Otros Resultados (si existen) */}
        {datos.otros.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-foreground">Otros Resultados</h3>
            <div className="space-y-2">
              {datos.otros.map((item, index) => (
                <div key={index} className="flex items-center justify-between border-b border-border py-2 last:border-0">
                  <span className="text-sm text-foreground">
                    {item.catalogo_cuenta?.codigo} - {item.catalogo_cuenta?.nombre}
                  </span>
                  <span className="font-medium tabular-nums text-foreground">{formatCurrency(item.monto)}</span>
                </div>
              ))}
              <div className="flex items-center justify-between border-t-2 border-border pt-2">
                <span className="font-semibold text-foreground">Total Otros</span>
                <span className="font-bold tabular-nums text-foreground">{formatCurrency(totalOtros)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Utilidad Neta */}
        <div className={`rounded-lg p-4 ${utilidadNeta >= 0 ? 'bg-green-50 dark:bg-green-950' : 'bg-red-50 dark:bg-red-950'}`}>
          <div className="flex items-center justify-between">
            <span className="text-xl font-bold text-foreground">UTILIDAD NETA</span>
            <span className="text-2xl font-bold text-foreground">{formatCurrency(utilidadNeta)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
