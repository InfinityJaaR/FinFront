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

export default function BalanceGeneral({ empresaId, periodoId }) {
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
        tipo: 'BALANCE'
      })

      if (response.success && response.data.length > 0) {
        const estado = response.data[0]
        procesarDatos(estado)
      } else {
        setDatos(null)
      }
    } catch (error) {
      console.error('Error al cargar balance:', error)
      setDatos(null)
    }
  }

  // Función para determinar si una cuenta es de segundo nivel (subcategoría principal)
  const esSubcategoriaPrincipal = (codigo) => {
    // Formato: X.X (ej: 1.1 = Activo Corriente, 1.2 = Activo No Corriente)
    // Excluimos cuentas con más de un punto (ej: 1.1.01)
    const partes = codigo.split('.')
    return partes.length === 2 && partes[1].length <= 2
  }

  const procesarDatos = (estado) => {
    const detalles = estado.detalles || []
    
    console.log('=== PROCESANDO BALANCE GENERAL ===')
    console.log('Total detalles:', detalles.length)
    
    // Separar cuentas por tipo, excluyendo las cuentas totales (1, 2, 3)
    const activos = detalles.filter(d => 
      d.catalogo_cuenta?.codigo?.startsWith('1') && 
      d.catalogo_cuenta?.codigo !== '1'
    )
    const pasivos = detalles.filter(d => 
      d.catalogo_cuenta?.codigo?.startsWith('2') && 
      d.catalogo_cuenta?.codigo !== '2'
    )
    const patrimonio = detalles.filter(d => 
      d.catalogo_cuenta?.codigo?.startsWith('3') && 
      d.catalogo_cuenta?.codigo !== '3'
    )

    console.log('Activos (sin total):', activos.length)
    console.log('Pasivos (sin total):', pasivos.length)
    console.log('Patrimonio (sin total):', patrimonio.length)

    // Buscar cuentas totales (si existen en la BD)
    const cuentaTotalActivos = detalles.find(d => d.catalogo_cuenta?.codigo === '1')
    const cuentaTotalPasivos = detalles.find(d => d.catalogo_cuenta?.codigo === '2')
    const cuentaTotalPatrimonio = detalles.find(d => d.catalogo_cuenta?.codigo === '3')

    console.log('Cuenta Total Activos (1):', cuentaTotalActivos ? `${cuentaTotalActivos.monto}` : 'NO ENCONTRADA')
    console.log('Cuenta Total Pasivos (2):', cuentaTotalPasivos ? `${cuentaTotalPasivos.monto}` : 'NO ENCONTRADA')
    console.log('Cuenta Total Patrimonio (3):', cuentaTotalPatrimonio ? `${cuentaTotalPatrimonio.monto}` : 'NO ENCONTRADA')

    setDatos({ 
      activos, 
      pasivos, 
      patrimonio,
      totalActivos: cuentaTotalActivos?.monto,
      totalPasivos: cuentaTotalPasivos?.monto,
      totalPatrimonio: cuentaTotalPatrimonio?.monto
    })
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex min-h-[400px] items-center justify-center">
          <p className="text-muted-foreground">Cargando balance general...</p>
        </CardContent>
      </Card>
    )
  }

  if (!datos) {
    return (
      <Card>
        <CardContent className="flex min-h-[400px] items-center justify-center">
          <p className="text-muted-foreground">No hay datos de balance general para esta empresa y periodo</p>
        </CardContent>
      </Card>
    )
  }

  // Usar los totales de la BD si existen, sino calcular
  // IMPORTANTE: Convertir a número porque el backend puede devolver strings
  const totalActivos = datos.totalActivos !== undefined && datos.totalActivos !== null 
    ? Number(datos.totalActivos)
    : calcularTotal(datos.activos)
  
  const totalPasivos = datos.totalPasivos !== undefined && datos.totalPasivos !== null
    ? Number(datos.totalPasivos)
    : calcularTotal(datos.pasivos)
  
  const totalPatrimonio = datos.totalPatrimonio !== undefined && datos.totalPatrimonio !== null
    ? Number(datos.totalPatrimonio)
    : calcularTotal(datos.patrimonio)
  
  const totalPasivosPatrimonio = totalPasivos + totalPatrimonio

  console.log('=== TOTALES CALCULADOS ===')
  console.log('Total Activos:', totalActivos, '(de BD:', datos.totalActivos !== undefined && datos.totalActivos !== null, ')')
  console.log('Total Pasivos:', totalPasivos, '(de BD:', datos.totalPasivos !== undefined && datos.totalPasivos !== null, ')')
  console.log('Total Patrimonio:', totalPatrimonio, '(de BD:', datos.totalPatrimonio !== undefined && datos.totalPatrimonio !== null, ')')
  console.log('Total Pasivos + Patrimonio:', totalPasivosPatrimonio)
  console.log('Diferencia con Activos:', totalActivos - totalPasivosPatrimonio)

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader className="bg-primary text-primary-foreground">
          <CardTitle className="text-2xl font-bold">ACTIVOS</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="space-y-3">
            <div className="space-y-2">
              {datos.activos.map((item, index) => {
                const esSubcategoria = esSubcategoriaPrincipal(item.catalogo_cuenta?.codigo || '')
                return (
                  <div 
                    key={index} 
                    className="flex items-center justify-between border-b border-border py-2 last:border-0"
                  >
                    <span className={`text-sm text-foreground ${esSubcategoria ? 'font-bold' : ''}`}>
                      {item.catalogo_cuenta?.codigo} - {item.catalogo_cuenta?.nombre}
                    </span>
                    <span className={`tabular-nums text-foreground ${esSubcategoria ? 'font-bold' : 'font-medium'}`}>
                      {formatCurrency(item.monto)}
                    </span>
                  </div>
                )
              })}
              <div className="flex items-center justify-between border-t-2 border-border pt-2">
                <span className="font-semibold text-foreground">Total Activos</span>
                <span className="font-bold tabular-nums text-foreground">{formatCurrency(totalActivos)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="bg-secondary text-secondary-foreground">
          <CardTitle className="text-2xl font-bold">PASIVOS Y PATRIMONIO</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="space-y-3">
            <h3 className="font-semibold text-foreground">Pasivos</h3>
            <div className="space-y-2">
              {datos.pasivos.map((item, index) => {
                const esSubcategoria = esSubcategoriaPrincipal(item.catalogo_cuenta?.codigo || '')
                return (
                  <div 
                    key={index} 
                    className="flex items-center justify-between border-b border-border py-2 last:border-0"
                  >
                    <span className={`text-sm text-foreground ${esSubcategoria ? 'font-bold' : ''}`}>
                      {item.catalogo_cuenta?.codigo} - {item.catalogo_cuenta?.nombre}
                    </span>
                    <span className={`tabular-nums text-foreground ${esSubcategoria ? 'font-bold' : 'font-medium'}`}>
                      {formatCurrency(item.monto)}
                    </span>
                  </div>
                )
              })}
              <div className="flex items-center justify-between border-t-2 border-border pt-2">
                <span className="font-semibold text-foreground">Total Pasivos</span>
                <span className="font-bold tabular-nums text-foreground">{formatCurrency(totalPasivos)}</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold text-foreground">Patrimonio</h3>
            <div className="space-y-2">
              {datos.patrimonio.map((item, index) => (
                <div key={index} className="flex items-center justify-between border-b border-border py-2 last:border-0">
                  <span className="text-sm text-foreground">
                    {item.catalogo_cuenta?.codigo} - {item.catalogo_cuenta?.nombre}
                  </span>
                  <span className="font-medium tabular-nums text-foreground">{formatCurrency(item.monto)}</span>
                </div>
              ))}
              <div className="flex items-center justify-between border-t-2 border-border pt-2">
                <span className="font-semibold text-foreground">Total Patrimonio</span>
                <span className="font-bold tabular-nums text-foreground">{formatCurrency(totalPatrimonio)}</span>
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-muted p-4">
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold text-foreground">TOTAL PASIVO + PATRIMONIO</span>
              <span className="text-xl font-bold text-foreground">{formatCurrency(totalPasivosPatrimonio)}</span>
            </div>
          </div>

          <div className={`rounded-lg p-4 ${Math.abs(totalActivos - totalPasivosPatrimonio) < 0.01 ? 'bg-green-50 dark:bg-green-950' : 'bg-red-50 dark:bg-red-950'}`}>
            <div className="text-center">
              <p className="text-sm font-medium text-white">
                {Math.abs(totalActivos - totalPasivosPatrimonio) < 0.01 ? '✓ Balance cuadrado' : '⚠ Balance descuadrado'}
              </p>
              <p className="text-xs text-white mt-1">
                Diferencia: {formatCurrency(totalActivos - totalPasivosPatrimonio)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
