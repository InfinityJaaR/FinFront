import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Badge } from "../ui/badge"

/**
 * Componente para mostrar tabla de análisis vertical
 * @param {Object} props
 * @param {Object} props.datos - Datos del análisis vertical
 * @param {boolean} props.loading - Estado de carga
 */
export default function TablaAnalisisVertical({ datos, loading = false }) {
  if (loading) {
    return (
      <Card>
        <CardContent className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Cargando análisis vertical...</p>
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
    return `${(valor * 100).toFixed(2)}%`
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

  // Determinar si una cuenta es submayor o detalle (incluye MAYOR y SUB_MAYOR)
  // Soporta dos formatos de códigos:
  // Formato numérico (4 dígitos): 1000, 1100, 1110, 1111
  // Formato con puntos: 1, 1.1, 1.1.1, 1.1.1.01
  const esSubmayor = (linea) => {
    // Si tiene el campo es_calculada, usar ese
    if (linea.es_calculada !== undefined) {
      return linea.es_calculada === true || linea.es_calculada === 1
    }
    
    const codigo = linea.codigo?.toString().trim() || ''
    
    // FORMATO NUMÉRICO (4 dígitos)
    if (/^\d{4}$/.test(codigo)) {
      // MAYOR: termina en "000" (ej: 1000, 2000, 3000)
      if (/\d000$/.test(codigo)) return true
      
      // SUB_MAYOR: termina en "00" pero no en "000" (ej: 1100, 1200, 2100)
      if (/\d{2}00$/.test(codigo)) return true
      
      // DETALLE y MOVIMIENTO no son submayor
      return false
    }
    
    // FORMATO CON PUNTOS
    if (codigo.includes('.')) {
      const partes = codigo.split('.')
      
      // MAYOR: un solo dígito (ej: 1, 2, 3)
      if (partes.length === 1 && /^\d$/.test(codigo)) return true
      
      // SUB_MAYOR: dos niveles (ej: 1.1, 1.2, 2.1)
      if (partes.length === 2 && /^\d+\.\d+$/.test(codigo)) return true
      
      // DETALLE: tres o más niveles (ej: 1.1.1, 1.1.1.01)
      return false
    }
    
    // MAYOR: un solo dígito sin punto (ej: 1, 2, 3)
    if (/^\d$/.test(codigo)) return true
    
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

  // Agrupar líneas por sección
  const lineasPorSeccion = datos.lineas.reduce((acc, linea) => {
    const seccion = linea.seccion || 'OTROS'
    if (!acc[seccion]) {
      acc[seccion] = []
    }
    acc[seccion].push(linea)
    return acc
  }, {})

  // Obtener nivel de importancia según el porcentaje
  const obtenerNivelImportancia = (porcentaje) => {
    const porcentajeAbs = Math.abs(porcentaje)
    if (porcentajeAbs >= 0.20) return 'muy-alta'
    if (porcentajeAbs >= 0.10) return 'alta'
    if (porcentajeAbs >= 0.05) return 'media'
    return 'baja'
  }

  // Configuración de colores para indicadores
  const configuracionIndicadores = {
    'muy-alta': { 
      size: 'w-4 h-4', 
      color: 'bg-purple-600', 
      label: 'Muy alta',
      rango: '≥20%'
    },
    'alta': { 
      size: 'w-3 h-3', 
      color: 'bg-blue-600', 
      label: 'Alta',
      rango: '10-19%'
    },
    'media': { 
      size: 'w-2.5 h-2.5', 
      color: 'bg-green-600', 
      label: 'Media',
      rango: '5-9%'
    },
    'baja': { 
      size: 'w-2 h-2', 
      color: 'bg-gray-300', 
      label: 'Baja',
      rango: '<5%'
    }
  }

  return (
    <div className="space-y-6">
      {/* Resumen de Totales */}
      <Card>
        <CardHeader>
          <CardTitle>Totales por Sección</CardTitle>
          <CardDescription>Base de cálculo para el análisis vertical</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Total Activo</p>
              <p className="text-2xl font-bold text-blue-600">
                {formatearMoneda(datos.totales?.ACTIVO || 0)}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Total Pasivo</p>
              <p className="text-2xl font-bold text-red-600">
                {formatearMoneda(datos.totales?.PASIVO || 0)}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Total Patrimonio</p>
              <p className="text-2xl font-bold text-green-600">
                {formatearMoneda(datos.totales?.PATRIMONIO || 0)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Leyenda de Indicadores */}
      <div className="flex items-center justify-center gap-6 text-sm text-gray-600">
        <span className="font-medium">Participación:</span>
        {Object.entries(configuracionIndicadores).map(([key, config]) => (
          <div key={key} className="flex items-center gap-1.5">
            <div className={`${config.size} ${config.color} rounded-full`} />
            <span>{config.label}</span>
          </div>
        ))}
      </div>

      {/* Tabla de Análisis Vertical por Sección */}
      {Object.entries(lineasPorSeccion).map(([seccion, lineas]) => (
        <Card key={seccion}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Badge className={obtenerColorSeccion(seccion)}>
                  {seccion}
                </Badge>
                <span className="text-sm font-normal text-muted-foreground">
                  ({lineas.length} cuentas)
                </span>
              </CardTitle>
              <p className="text-lg font-semibold">
                Total: {formatearMoneda(datos.totales?.[seccion] || 0)}
              </p>
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
                      Monto
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                      Porcentaje
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">
                      Representación
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {lineas.map((linea, index) => {
                    const porcentaje = linea.porcentaje !== null ? linea.porcentaje : 0
                    const esSignificativo = Math.abs(porcentaje) > 0.1 // Mayor al 10%
                    const esCuentaSubmayor = esSubmayor(linea)
                    const esCuentaMayor = esMayor(linea)
                    const nivelIndentacion = obtenerNivelIndentacion(linea.codigo)
                    
                    return (
                      <tr 
                        key={`${linea.catalogo_cuenta_id}-${index}`}
                        className={`border-b transition-colors ${
                          esCuentaSubmayor 
                            ? 'bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800' 
                            : 'hover:bg-muted/50'
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
                            {esCuentaSubmayor && (
                              <span className={`text-xs px-2 py-0.5 rounded-full ${
                                esCuentaMayor 
                                  ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300' 
                                  : 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                              }`}>
                                {esCuentaMayor ? 'Mayor' : 'Submayor'}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className={`px-4 py-3 text-sm text-right ${
                          esCuentaSubmayor ? 'font-bold text-lg' : 'font-medium'
                        }`}>
                          {formatearMoneda(linea.monto)}
                        </td>
                        <td className={`px-4 py-3 text-sm text-right ${
                          esCuentaSubmayor ? 'font-bold' : 'font-semibold'
                        }`}>
                          <span className={esSignificativo ? 'text-primary' : ''}>
                            {formatearPorcentaje(linea.porcentaje)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {!esCuentaSubmayor && (() => {
                            const nivel = obtenerNivelImportancia(linea.porcentaje)
                            const config = configuracionIndicadores[nivel]
                            
                            return (
                              <div className="flex items-center justify-center">
                                <div 
                                  className={`${config.size} ${config.color} rounded-full`}
                                  title={`${config.label}: ${config.rango}`}
                                />
                              </div>
                            )
                          })()}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

