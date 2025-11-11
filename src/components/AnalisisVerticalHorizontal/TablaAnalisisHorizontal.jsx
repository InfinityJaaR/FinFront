import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Badge } from "../ui/badge"
import { TrendingUp, TrendingDown, Minus, ArrowUpRight, ArrowDownRight } from "lucide-react"

/**
 * Componente para mostrar tabla de análisis horizontal
 * @param {Object} props
 * @param {Object} props.datos - Datos del análisis horizontal
 * @param {Array} props.periodos - Lista de periodos para mostrar nombres
 * @param {boolean} props.loading - Estado de carga
 */
export default function TablaAnalisisHorizontal({ datos, periodos = [], loading = false }) {
  if (loading) {
    return (
      <Card>
        <CardContent className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Cargando análisis horizontal...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!datos || !datos.lineas || datos.lineas.length === 0) {
    return (
      <Card>
        <CardContent className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <p className="text-lg text-muted-foreground">
              No hay datos disponibles para mostrar
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Selecciona los filtros y haz clic en Analizar
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const formatearMoneda = (valor) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(valor)
  }

  const formatearPorcentaje = (valor) => {
    if (valor === null || valor === undefined) {
      return 'N/D'
    }
    const signo = valor >= 0 ? '+' : ''
    return `${signo}${(valor * 100).toFixed(2)}%`
  }

  const obtenerColorSeccion = (seccion) => {
    switch (seccion) {
      case 'ACTIVO':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'PASIVO':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'PATRIMONIO':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  // Verificar si una cuenta tiene cuentas de detalle asociadas
  const tieneCuentasDetalle = (linea, todasLasLineas) => {
    const codigo = linea.codigo?.toString().trim() || ''
    const codigoNormalizado = codigo
    
    // FORMATO NUMÉRICO (4 dígitos)
    if (/^\d{4}$/.test(codigoNormalizado)) {
      // MAYOR (x000): buscar SUB_MAYOR (xx00) que empiecen con el mismo primer dígito
      if (/\d000$/.test(codigoNormalizado)) {
        const primerDigito = codigoNormalizado[0]
        return todasLasLineas.some(l => {
          const codigoL = l.codigo?.toString().trim() || ''
          return /^\d{4}$/.test(codigoL) && 
                 codigoL[0] === primerDigito && 
                 /\d{2}00$/.test(codigoL) &&
                 codigoL !== codigoNormalizado
        })
      }
      
      // SUB_MAYOR (xx00): buscar DETALLE (xxx0) o MOVIMIENTO (xxxx) que empiecen con los mismos dos primeros dígitos
      if (/\d{2}00$/.test(codigoNormalizado)) {
        const primerosDosDigitos = codigoNormalizado.substring(0, 2)
        return todasLasLineas.some(l => {
          const codigoL = l.codigo?.toString().trim() || ''
          return /^\d{4}$/.test(codigoL) && 
                 codigoL.substring(0, 2) === primerosDosDigitos &&
                 !/\d{2}00$/.test(codigoL) &&
                 codigoL !== codigoNormalizado
        })
      }
    }
    
    // FORMATO CON PUNTOS
    if (codigoNormalizado.includes('.')) {
      const partes = codigoNormalizado.split('.')
      
      // MAYOR (1): buscar SUB_MAYOR (1.x)
      if (partes.length === 1 && /^\d$/.test(codigoNormalizado)) {
        return todasLasLineas.some(l => {
          const codigoL = l.codigo?.toString().trim() || ''
          if (!codigoL.includes('.')) return false
          const partesL = codigoL.split('.')
          return partesL.length === 2 && 
                 partesL[0] === partes[0] &&
                 codigoL !== codigoNormalizado
        })
      }
      
      // SUB_MAYOR (1.1): buscar DETALLE (1.1.x)
      if (partes.length === 2 && /^\d+\.\d+$/.test(codigoNormalizado)) {
        return todasLasLineas.some(l => {
          const codigoL = l.codigo?.toString().trim() || ''
          if (!codigoL.includes('.')) return false
          const partesL = codigoL.split('.')
          return partesL.length >= 3 &&
                 partesL[0] === partes[0] &&
                 partesL[1] === partes[1] &&
                 codigoL !== codigoNormalizado
        })
      }
    }
    
    // MAYOR: un solo dígito sin punto (ej: 1, 2, 3)
    if (/^\d$/.test(codigoNormalizado)) {
      return todasLasLineas.some(l => {
        const codigoL = l.codigo?.toString().trim() || ''
        // Buscar cuentas que empiecen con este dígito seguido de punto o sean SUB_MAYOR numéricas
        return (codigoL.startsWith(codigoNormalizado + '.') || 
                (/^\d{4}$/.test(codigoL) && codigoL[0] === codigoNormalizado && /\d{2}00$/.test(codigoL))) &&
               codigoL !== codigoNormalizado
      })
    }
    
    return false
  }

  // Determinar si una cuenta es submayor o detalle (incluye MAYOR y SUB_MAYOR)
  // Soporta dos formatos de códigos:
  // Formato numérico (4 dígitos): 1000, 1100, 1110, 1111
  // Formato con puntos: 1, 1.1, 1.1.1, 1.1.1.01
  // IMPORTANTE: Solo es submayor si tiene cuentas de detalle asociadas
  const esSubmayor = (linea, todasLasLineas = []) => {
    // Si tiene el campo es_calculada, usar ese
    if (linea.es_calculada !== undefined) {
      const esCalculada = linea.es_calculada === true || linea.es_calculada === 1
      // Si es calculada, verificar si tiene hijos antes de considerarla submayor
      if (esCalculada) {
        return tieneCuentasDetalle(linea, todasLasLineas)
      }
      return false
    }
    
    const codigo = linea.codigo?.toString().trim() || ''
    
    // FORMATO NUMÉRICO (4 dígitos)
    if (/^\d{4}$/.test(codigo)) {
      // MAYOR: termina en "000" (ej: 1000, 2000, 3000)
      if (/\d000$/.test(codigo)) {
        return tieneCuentasDetalle(linea, todasLasLineas)
      }
      
      // SUB_MAYOR: termina en "00" pero no en "000" (ej: 1100, 1200, 2100)
      if (/\d{2}00$/.test(codigo)) {
        return tieneCuentasDetalle(linea, todasLasLineas)
      }
      
      // DETALLE y MOVIMIENTO no son submayor
      return false
    }
    
    // FORMATO CON PUNTOS
    if (codigo.includes('.')) {
      const partes = codigo.split('.')
      
      // MAYOR: un solo dígito (ej: 1, 2, 3)
      if (partes.length === 1 && /^\d$/.test(codigo)) {
        return tieneCuentasDetalle(linea, todasLasLineas)
      }
      
      // SUB_MAYOR: dos niveles (ej: 1.1, 1.2, 2.1)
      if (partes.length === 2 && /^\d+\.\d+$/.test(codigo)) {
        return tieneCuentasDetalle(linea, todasLasLineas)
      }
      
      // DETALLE: tres o más niveles (ej: 1.1.1, 1.1.1.01)
      return false
    }
    
    // MAYOR: un solo dígito sin punto (ej: 1, 2, 3)
    if (/^\d$/.test(codigo)) {
      return tieneCuentasDetalle(linea, todasLasLineas)
    }
    
    // Por defecto, no es submayor
    return false
  }

  // Determinar si una cuenta es MAYOR (nivel 1)
  const esMayor = (linea) => {
    const codigo = linea.codigo?.toString().trim() || ''
    
    // FORMATO NUMÉRICO (4 dígitos)
    if (/^\d{4}$/.test(codigo)) {
      // MAYOR: termina en "000" (ej: 1000, 2000, 3000)
      return /\d000$/.test(codigo)
    }
    
    // FORMATO CON PUNTOS o un solo dígito
    // MAYOR: un solo dígito (ej: 1, 2, 3)
    return /^\d$/.test(codigo)
  }

  // Obtener nivel de indentación basado en el código
  const obtenerNivelIndentacion = (codigo) => {
    const codigoStr = codigo?.toString().trim() || ''
    
    // FORMATO NUMÉRICO (4 dígitos)
    if (/^\d{4}$/.test(codigoStr)) {
      // MAYOR (x000): nivel 0
      if (/\d000$/.test(codigoStr)) return 0
      
      // SUB_MAYOR (xx00): nivel 1
      if (/\d{2}00$/.test(codigoStr)) return 1
      
      // DETALLE (xxx0): nivel 2
      if (/\d{3}0$/.test(codigoStr)) return 2
      
      // MOVIMIENTO (xxxx): nivel 3
      return 3
    }
    
    // FORMATO CON PUNTOS
    if (codigoStr.includes('.')) {
      const partes = codigoStr.split('.')
      // Nivel = número de partes - 1
      return Math.max(0, partes.length - 1)
    }
    
    // MAYOR: un solo dígito (ej: 1, 2, 3)
    if (/^\d$/.test(codigoStr)) return 0
    
    // Por defecto, sin indentación
    return 0
  }

  const obtenerIconoTendencia = (variacion) => {
    if (variacion === null || variacion === undefined) return <Minus className="h-4 w-4 text-gray-400" />
    if (variacion > 0.05) return <ArrowUpRight className="h-5 w-5 text-green-600" />
    if (variacion < -0.05) return <ArrowDownRight className="h-5 w-5 text-red-600" />
    return <Minus className="h-4 w-4 text-gray-400" />
  }

  const obtenerColorVariacion = (variacion) => {
    if (variacion === null || variacion === undefined) return 'text-gray-500'
    if (variacion > 0.05) return 'text-green-600 font-semibold'
    if (variacion < -0.05) return 'text-red-600 font-semibold'
    return 'text-gray-600'
  }

  // Obtener nombres de periodos
  const periodoBase = periodos.find(p => p.id === datos.periodo_base_id)
  const periodoComp = periodos.find(p => p.id === datos.periodo_comp_id)

  // Agrupar líneas por sección
  const lineasPorSeccion = datos.lineas.reduce((acc, linea) => {
    const seccion = linea.seccion || 'OTROS'
    if (!acc[seccion]) {
      acc[seccion] = []
    }
    acc[seccion].push(linea)
    return acc
  }, {})

  // Calcular estadísticas por sección
  const calcularEstadisticas = (lineas) => {
    const totalBase = lineas.reduce((sum, l) => sum + (l.monto_base || 0), 0)
    const totalComp = lineas.reduce((sum, l) => sum + (l.monto_comp || 0), 0)
    const variacionAbs = totalComp - totalBase
    const variacionPct = totalBase !== 0 ? variacionAbs / totalBase : null
    
    return { totalBase, totalComp, variacionAbs, variacionPct }
  }

  return (
    <div className="space-y-6">
      {/* Encabezado con información de periodos */}
      <Card>
        <CardHeader>
          <CardTitle>Comparación de Periodos</CardTitle>
          <CardDescription>
            Análisis horizontal del balance general
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Periodo Base</p>
              <p className="text-2xl font-bold">
                {periodoBase?.anio || periodoBase?.año || datos.periodo_base_id}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Periodo Comparación</p>
              <p className="text-2xl font-bold">
                {periodoComp?.anio || periodoComp?.año || datos.periodo_comp_id}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de Análisis Horizontal por Sección */}
      {Object.entries(lineasPorSeccion).map(([seccion, lineas]) => {
        const stats = calcularEstadisticas(lineas)
        
        return (
          <Card key={seccion}>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <Badge className={obtenerColorSeccion(seccion)}>
                    {seccion}
                  </Badge>
                  <span className="text-sm font-normal text-muted-foreground">
                    ({lineas.length} cuentas)
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div>
                    
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                        Código
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                        Nombre de Cuenta
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                        Monto Base
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                        Monto Comparación
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                        Variación Absoluta
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                        Variación %
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">
                        Tendencia
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {lineas.map((linea, index) => {
                      const variacionPct = linea.variacion_pct
                      const esVariacionSignificativa = variacionPct !== null && Math.abs(variacionPct) > 0.1 // Mayor al 10%
                      const esCuentaSubmayor = esSubmayor(linea, lineas)
                      const esCuentaMayor = esMayor(linea)
                      const nivelIndentacion = obtenerNivelIndentacion(linea.codigo)
                      
                      return (
                        <tr 
                          key={`${linea.catalogo_cuenta_id}-${index}`}
                          className={`border-b ${
                            esCuentaSubmayor 
                              ? 'bg-gray-50 dark:bg-gray-800/50' 
                              : esVariacionSignificativa 
                                ? 'bg-yellow-50 dark:bg-yellow-950/20'
                                : ''
                          }`}
                        >
                          <td className={`px-4 py-3 text-sm font-mono ${
                            esCuentaSubmayor ? 'font-bold' : ''
                          }`}>
                            {linea.codigo}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <div 
                              style={{ 
                                paddingLeft: esCuentaSubmayor ? '0px' : `${nivelIndentacion * 16}px` 
                              }}
                              className="flex items-center gap-2"
                            >
                              {!esCuentaSubmayor && (
                                <span className="text-gray-400">└─</span>
                              )}
                              <span className={esCuentaSubmayor ? 'font-bold' : ''}>
                                {linea.nombre}
                              </span>
                            </div>
                          </td>
                          <td className={`px-4 py-3 text-sm text-right ${
                            esCuentaSubmayor ? 'font-bold text-lg' : 'font-medium'
                          }`}>
                            {formatearMoneda(linea.monto_base)}
                          </td>
                          <td className={`px-4 py-3 text-sm text-right ${
                            esCuentaSubmayor ? 'font-bold text-lg' : 'font-medium'
                          }`}>
                            {formatearMoneda(linea.monto_comp)}
                          </td>
                          <td className={`px-4 py-3 text-sm text-right ${
                            esCuentaSubmayor ? 'font-bold' : 'font-medium'
                          } ${obtenerColorVariacion(variacionPct)}`}>
                            {formatearMoneda(linea.variacion_abs)}
                          </td>
                          <td className={`px-4 py-3 text-sm text-right ${
                            esCuentaSubmayor ? 'font-bold' : 'font-semibold'
                          } ${obtenerColorVariacion(variacionPct)}`}>
                            {formatearPorcentaje(linea.variacion_pct)}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center">
                              {obtenerIconoTendencia(variacionPct)}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

