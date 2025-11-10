import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Button } from "../ui/button"
import { useEstadosFinancieros } from "../../hooks/EstadosFinancieros/useEstadosFinancieros"

const formatCurrency = (value) => {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP'
  }).format(value)
}

const calcularTotal = (items) => {
  if (!items || !Array.isArray(items)) return 0
  return items.reduce((sum, item) => {
    const monto = Number(item.monto) || 0
    return sum + monto
  }, 0)
}

export default function EstadoResultado({ empresaId, periodoId }) {
  const navigate = useNavigate()
  const { obtenerEstado, loading } = useEstadosFinancieros()
  const [datos, setDatos] = useState(null)
  const [estadoActual, setEstadoActual] = useState(null)

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
        setEstadoActual(estado)
        procesarDatos(estado)
      } else {
        setDatos(null)
        setEstadoActual(null)
      }
    } catch (error) {
      console.error('Error al cargar estado de resultados:', error)
      setDatos(null)
      setEstadoActual(null)
    }
  }

  const procesarDatos = (estado) => {
    const detalles = estado.detalles || []
    
    console.log('=== PROCESANDO ESTADO DE RESULTADOS ===')
    console.log('Total detalles:', detalles.length)
    
    // Filtrar solo cuentas NO calculadas para los totales (evitar doble conteo)
    const ingresos = detalles.filter(d => 
      d.catalogo_cuenta?.codigo?.startsWith('4') && 
      d.catalogo_cuenta?.codigo !== '4' &&
      !d.catalogo_cuenta?.es_calculada
    )
    const costos = detalles.filter(d => 
      d.catalogo_cuenta?.codigo?.startsWith('5') && 
      d.catalogo_cuenta?.codigo !== '5' &&
      !d.catalogo_cuenta?.es_calculada
    )
    const gastos = detalles.filter(d => 
      d.catalogo_cuenta?.codigo?.startsWith('6') && 
      d.catalogo_cuenta?.codigo !== '6' &&
      !d.catalogo_cuenta?.es_calculada
    )
    
    // Separar "Otros Resultados" en Otros Ingresos/Gastos e Impuestos
    const otrosResultados = detalles.filter(d => 
      d.catalogo_cuenta?.codigo?.startsWith('7') && 
      d.catalogo_cuenta?.codigo !== '7' &&
      !d.catalogo_cuenta?.es_calculada
    )
    
    // Separar impuestos de otros resultados
    const impuestos = otrosResultados.filter(d => 
      d.catalogo_cuenta?.nombre?.toLowerCase().includes('impuesto')
    )
    
    const otrosIngresosGastos = otrosResultados.filter(d => 
      !d.catalogo_cuenta?.nombre?.toLowerCase().includes('impuesto') &&
      !d.catalogo_cuenta?.nombre?.toLowerCase().includes('utilidad')
    )
    
    // Buscar cuentas de utilidades calculadas por el backend (8.1 - 8.4)
    const cuentaUtilidadBruta = detalles.find(d => d.catalogo_cuenta?.codigo === '8.1')
    const cuentaUtilidadOperacional = detalles.find(d => d.catalogo_cuenta?.codigo === '8.2')
    const cuentaUtilidadAntesImpuestos = detalles.find(d => d.catalogo_cuenta?.codigo === '8.3')
    const cuentaUtilidadNeta = detalles.find(d => d.catalogo_cuenta?.codigo === '8.4')
    
    // Buscar "Utilidad del Ejercicio" en el catálogo (es lo mismo que Utilidad Neta)
    const cuentaUtilidadEjercicio = detalles.find(d => 
      d.catalogo_cuenta?.nombre?.toLowerCase().includes('utilidad') &&
      d.catalogo_cuenta?.nombre?.toLowerCase().includes('ejercicio')
    )
    
    console.log('Ingresos (sin calculadas):', ingresos.length)
    console.log('Costos (sin calculadas):', costos.length)
    console.log('Gastos (sin calculadas):', gastos.length)
    console.log('Otros Ingresos/Gastos:', otrosIngresosGastos.length)
    console.log('Impuestos:', impuestos.length)
    console.log('Utilidad Bruta (8.1):', cuentaUtilidadBruta ? cuentaUtilidadBruta.monto : 'NO ENCONTRADA')
    console.log('Utilidad Operacional (8.2):', cuentaUtilidadOperacional ? cuentaUtilidadOperacional.monto : 'NO ENCONTRADA')
    console.log('Utilidad Antes Impuestos (8.3):', cuentaUtilidadAntesImpuestos ? cuentaUtilidadAntesImpuestos.monto : 'NO ENCONTRADA')
    console.log('Utilidad Neta (8.4):', cuentaUtilidadNeta ? cuentaUtilidadNeta.monto : 'NO ENCONTRADA')
    console.log('Utilidad del Ejercicio:', cuentaUtilidadEjercicio ? cuentaUtilidadEjercicio.monto : 'NO ENCONTRADA')

    setDatos({ 
      ingresos, 
      costos, 
      gastos, 
      otrosIngresosGastos,
      impuestos,
      utilidadBruta: cuentaUtilidadBruta?.monto,
      utilidadOperacional: cuentaUtilidadOperacional?.monto,
      utilidadAntesImpuestos: cuentaUtilidadAntesImpuestos?.monto,
      utilidadNeta: cuentaUtilidadNeta?.monto || cuentaUtilidadEjercicio?.monto // Priorizar 8.4, sino usar Utilidad del Ejercicio
    })
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

  const totalIngresos = calcularTotal(datos?.ingresos || [])
  const totalCostos = calcularTotal(datos?.costos || [])
  const totalGastos = calcularTotal(datos?.gastos || [])
  const totalOtrosIngresosGastos = calcularTotal(datos?.otrosIngresosGastos || [])
  const totalImpuestos = calcularTotal(datos?.impuestos || [])
  
  // Usar utilidades del backend si existen, sino calcular manualmente
  const utilidadBruta = datos.utilidadBruta !== undefined && datos.utilidadBruta !== null && !isNaN(datos.utilidadBruta)
    ? Number(datos.utilidadBruta)
    : totalIngresos - totalCostos
  
  const utilidadOperacional = datos.utilidadOperacional !== undefined && datos.utilidadOperacional !== null && !isNaN(datos.utilidadOperacional)
    ? Number(datos.utilidadOperacional)
    : utilidadBruta - totalGastos
  
  // Utilidad Antes de Impuestos = Utilidad Operacional ± Otros Ingresos y Gastos
  // Si no hay otros, es igual a Utilidad Operacional
  const utilidadAntesImpuestos = datos.utilidadAntesImpuestos !== undefined && datos.utilidadAntesImpuestos !== null && !isNaN(datos.utilidadAntesImpuestos)
    ? Number(datos.utilidadAntesImpuestos)
    : utilidadOperacional + totalOtrosIngresosGastos
  
  const utilidadNeta = datos.utilidadNeta !== undefined && datos.utilidadNeta !== null && !isNaN(datos.utilidadNeta)
    ? Number(datos.utilidadNeta)
    : utilidadAntesImpuestos - totalImpuestos

  console.log('=== TOTALES CALCULADOS ===')
  console.log('Total Ingresos:', totalIngresos)
  console.log('Total Costos:', totalCostos)
  console.log('Total Gastos:', totalGastos)
  console.log('Total Otros Ingresos/Gastos:', totalOtrosIngresosGastos)
  console.log('Total Impuestos:', totalImpuestos)
  console.log('Utilidad Bruta:', utilidadBruta, '(de BD:', datos.utilidadBruta !== undefined && datos.utilidadBruta !== null, ')')
  console.log('Utilidad Operacional:', utilidadOperacional, '(de BD:', datos.utilidadOperacional !== undefined && datos.utilidadOperacional !== null, ')')
  console.log('Utilidad Antes Impuestos:', utilidadAntesImpuestos, '(de BD:', datos.utilidadAntesImpuestos !== undefined && datos.utilidadAntesImpuestos !== null, ')')
  console.log('Utilidad Neta:', utilidadNeta, '(de BD:', datos.utilidadNeta !== undefined && datos.utilidadNeta !== null, ')')
  
  // Verificar si hay otros ingresos/gastos para mostrar esa sección
  const tieneOtrosIngresosGastos = datos.otrosIngresosGastos && datos.otrosIngresosGastos.length > 0

  const handleEditar = () => {
    if (!estadoActual?.id) return
    navigate(`/dashboard/estados-financieros/${estadoActual.id}/editar`)
  }

  return (
    <div className="space-y-4">
      {estadoActual?.id && (
        <div className="flex justify-end">
          <Button variant="outline" onClick={handleEditar}>
            Editar estado financiero
          </Button>
        </div>
      )}
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
        <div className="border-t-2 border-border pt-4">
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

        {/* Utilidad Operacional */}
        <div className="border-t-2 border-border pt-4">
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold text-foreground">UTILIDAD OPERACIONAL</span>
            <span className="text-xl font-bold text-foreground">{formatCurrency(utilidadOperacional)}</span>
          </div>
        </div>

        {/* Otros Ingresos y Gastos (solo si existen) */}
        {tieneOtrosIngresosGastos && (
          <>
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-foreground">Otros Ingresos y Gastos</h3>
              <div className="space-y-2">
                {datos.otrosIngresosGastos.map((item, index) => (
                  <div key={index} className="flex items-center justify-between border-b border-border py-2 last:border-0">
                    <span className="text-sm text-foreground">
                      {item.catalogo_cuenta?.codigo} - {item.catalogo_cuenta?.nombre}
                    </span>
                    <span className="font-medium tabular-nums text-foreground">{formatCurrency(item.monto)}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between border-t-2 border-border pt-2">
                  <span className="font-semibold text-foreground">Total Otros Ingresos/Gastos</span>
                  <span className="font-bold tabular-nums text-foreground">{formatCurrency(totalOtrosIngresosGastos)}</span>
                </div>
              </div>
            </div>

            {/* Utilidad Antes de Impuestos */}
            <div className="border-t-2 border-border pt-4">
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-foreground">UTILIDAD ANTES DE IMPUESTOS</span>
                <span className="text-xl font-bold text-foreground">{formatCurrency(utilidadAntesImpuestos)}</span>
              </div>
            </div>
          </>
        )}

        {/* Impuesto a la Renta (si existe) */}
        {datos.impuestos && datos.impuestos.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-foreground">Impuestos</h3>
            <div className="space-y-2">
              {datos.impuestos.map((item, index) => (
                <div key={index} className="flex items-center justify-between border-b border-border py-2 last:border-0">
                  <span className="text-sm text-foreground">
                    {item.catalogo_cuenta?.codigo} - {item.catalogo_cuenta?.nombre}
                  </span>
                  <span className="font-medium tabular-nums text-foreground">{formatCurrency(item.monto)}</span>
                </div>
              ))}
              <div className="flex items-center justify-between border-t-2 border-border pt-2">
                <span className="font-semibold text-foreground">Total Impuestos</span>
                <span className="font-bold tabular-nums text-foreground">{formatCurrency(totalImpuestos)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Utilidad Neta / Utilidad del Ejercicio */}
        <div className="border-t-2 border-border pt-4">
          <div className="flex items-center justify-between">
            <span className="text-xl font-bold text-foreground">UTILIDAD NETA DEL EJERCICIO</span>
            <span className="text-2xl font-bold text-foreground">{formatCurrency(utilidadNeta)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
    </div>
  )
}
