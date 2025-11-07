import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Button } from "../ui/button"
import { Search, Download, X } from "lucide-react"

/**
 * Componente de filtros para análisis vertical y horizontal
 * @param {Object} props
 * @param {string} props.tipoAnalisis - 'vertical' o 'horizontal'
 * @param {boolean} props.esAdministrador - Si el usuario es administrador
 * @param {Array} props.empresas - Lista de empresas (solo para admin)
 * @param {Array} props.periodos - Lista de periodos disponibles
 * @param {string} props.empresaSeleccionada - ID de empresa seleccionada
 * @param {string} props.periodoSeleccionado - ID de periodo seleccionado (para vertical)
 * @param {string} props.periodoBaseSeleccionado - ID de periodo base (para horizontal)
 * @param {string} props.periodoCompSeleccionado - ID de periodo comparación (para horizontal)
 * @param {string} props.seccionSeleccionada - Sección seleccionada (para vertical)
 * @param {Function} props.onEmpresaChange - Callback al cambiar empresa
 * @param {Function} props.onPeriodoChange - Callback al cambiar periodo
 * @param {Function} props.onPeriodoBaseChange - Callback al cambiar periodo base
 * @param {Function} props.onPeriodoCompChange - Callback al cambiar periodo comparación
 * @param {Function} props.onSeccionChange - Callback al cambiar sección
 * @param {Function} props.onAnalizar - Callback al hacer clic en Analizar
 * @param {Function} props.onExportar - Callback al hacer clic en Exportar
 * @param {boolean} props.loading - Estado de carga
 * @param {boolean} props.puedeAnalizar - Si puede realizar el análisis
 * @param {boolean} props.puedeExportar - Si puede exportar
 */
export default function FiltrosAnalisis({
  tipoAnalisis,
  esAdministrador,
  empresas = [],
  periodos = [],
  empresaSeleccionada,
  periodoSeleccionado,
  periodoBaseSeleccionado,
  periodoCompSeleccionado,
  seccionSeleccionada,
  onEmpresaChange,
  onPeriodoChange,
  onPeriodoBaseChange,
  onPeriodoCompChange,
  onSeccionChange,
  onAnalizar,
  onExportar,
  loading = false,
  puedeAnalizar = false,
  puedeExportar = false,
}) {
  const secciones = [
    { value: 'ACTIVO', label: 'Activo' },
    { value: 'PASIVO', label: 'Pasivo' },
    { value: 'PATRIMONIO', label: 'Patrimonio' },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Filtros de {tipoAnalisis === 'vertical' ? 'Análisis Vertical' : 'Análisis Horizontal'}
        </CardTitle>
        <CardDescription>
          {tipoAnalisis === 'vertical'
            ? 'Selecciona los parámetros para el análisis vertical del balance general'
            : 'Selecciona los periodos para comparar en el análisis horizontal'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          {/* Selector de Empresa (solo para administradores) */}
          {esAdministrador && (
            <div className="space-y-2">
              <label htmlFor="empresa" className="text-sm font-medium text-foreground">
                Empresa *
              </label>
              <Select 
                value={empresaSeleccionada} 
                onValueChange={onEmpresaChange} 
                disabled={loading}
              >
                <SelectTrigger id="empresa" aria-label="Seleccionar empresa">
                  <SelectValue placeholder="Selecciona una empresa" />
                </SelectTrigger>
                <SelectContent>
                  {empresas.map((empresa) => (
                    <SelectItem key={empresa.id} value={empresa.id.toString()}>
                      {empresa.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Filtros para Análisis Vertical */}
          {tipoAnalisis === 'vertical' && (
            <>
              <div className="space-y-2">
                <label htmlFor="periodo" className="text-sm font-medium text-foreground">
                  Periodo *
                </label>
                <Select 
                  value={periodoSeleccionado} 
                  onValueChange={onPeriodoChange} 
                  disabled={loading}
                >
                  <SelectTrigger id="periodo" aria-label="Seleccionar periodo">
                    <SelectValue placeholder="Selecciona un periodo" />
                  </SelectTrigger>
                  <SelectContent>
                    {periodos.map((periodo) => (
                      <SelectItem key={periodo.id} value={periodo.id.toString()}>
                        {periodo.anio || periodo.año}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="seccion" className="text-sm font-medium text-foreground">
                    Sección (opcional)
                  </label>
                  {seccionSeleccionada && (
                    <button
                      onClick={() => onSeccionChange(undefined)}
                      className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                      disabled={loading}
                    >
                      <X className="h-3 w-3" />
                      Limpiar
                    </button>
                  )}
                </div>
                <Select 
                  value={seccionSeleccionada || undefined} 
                  onValueChange={onSeccionChange} 
                  disabled={loading}
                >
                  <SelectTrigger id="seccion" aria-label="Seleccionar sección">
                    <SelectValue placeholder="Todas las secciones" />
                  </SelectTrigger>
                  <SelectContent>
                    {secciones.map((seccion) => (
                      <SelectItem key={seccion.value} value={seccion.value}>
                        {seccion.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {/* Filtros para Análisis Horizontal */}
          {tipoAnalisis === 'horizontal' && (
            <>
              <div className="space-y-2">
                <label htmlFor="periodoBase" className="text-sm font-medium text-foreground">
                  Periodo Base *
                </label>
                <Select 
                  value={periodoBaseSeleccionado} 
                  onValueChange={onPeriodoBaseChange} 
                  disabled={loading}
                >
                  <SelectTrigger id="periodoBase" aria-label="Seleccionar periodo base">
                    <SelectValue placeholder="Selecciona periodo base" />
                  </SelectTrigger>
                  <SelectContent>
                    {periodos.map((periodo) => (
                      <SelectItem key={periodo.id} value={periodo.id.toString()}>
                        {periodo.anio || periodo.año}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label htmlFor="periodoComp" className="text-sm font-medium text-foreground">
                  Periodo Comparación *
                </label>
                <Select 
                  value={periodoCompSeleccionado} 
                  onValueChange={onPeriodoCompChange} 
                  disabled={loading}
                >
                  <SelectTrigger id="periodoComp" aria-label="Seleccionar periodo comparación">
                    <SelectValue placeholder="Selecciona periodo a comparar" />
                  </SelectTrigger>
                  <SelectContent>
                    {periodos.map((periodo) => (
                      <SelectItem key={periodo.id} value={periodo.id.toString()}>
                        {periodo.anio || periodo.año}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {/* Botones de acción */}
          <div className="flex gap-2 pt-2">
            <Button 
              onClick={onAnalizar} 
              disabled={!puedeAnalizar || loading}
              className="flex-1"
            >
              <Search className="mr-2 h-4 w-4" />
              {loading ? 'Analizando...' : 'Analizar'}
            </Button>
            
            {puedeExportar && (
              <Button 
                onClick={onExportar} 
                disabled={!puedeExportar || loading}
                variant="outline"
              >
                <Download className="mr-2 h-4 w-4" />
                Exportar CSV
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

