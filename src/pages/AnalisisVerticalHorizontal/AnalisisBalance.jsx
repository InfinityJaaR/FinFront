import { useState, useEffect } from "react"
import { Card, CardContent } from "../../components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs"
import { Alert, AlertDescription } from "../../components/ui/alert"
import { AlertCircle, BarChart3, TrendingUp } from "lucide-react"
import FiltrosAnalisis from "../../components/AnalisisVerticalHorizontal/FiltrosAnalisis"
import TablaAnalisisVertical from "../../components/AnalisisVerticalHorizontal/TablaAnalisisVertical"
import TablaAnalisisHorizontal from "../../components/AnalisisVerticalHorizontal/TablaAnalisisHorizontal"
import { useAnalisisBalance } from "../../hooks/AnalisisVerticalHorizontal/useAnalisisBalance"
import { useEstadosFinancieros } from "../../hooks/EstadosFinancieros/useEstadosFinancieros"

export default function AnalisisBalancePage() {
  const {
    analisisVertical,
    analisisHorizontal,
    loading,
    error,
    obtenerAnalisisVertical,
    obtenerAnalisisHorizontal,
    exportarCSV,
    esAdministrador,
    setError,
  } = useAnalisisBalance()

  const {
    empresas,
    periodos,
    cargarEmpresas,
    cargarPeriodos,
  } = useEstadosFinancieros()

  // Estados para filtros
  const [tipoAnalisisActivo, setTipoAnalisisActivo] = useState("vertical")
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState("")
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState("")
  const [periodoBaseSeleccionado, setPeriodoBaseSeleccionado] = useState("")
  const [periodoCompSeleccionado, setPeriodoCompSeleccionado] = useState("")
  const [seccionSeleccionada, setSeccionSeleccionada] = useState(undefined)

  const esAdmin = esAdministrador()

  // Cargar empresas y periodos al iniciar
  useEffect(() => {
    if (esAdmin) {
      cargarEmpresas()
    }
    cargarPeriodos()
  }, [esAdmin, cargarEmpresas, cargarPeriodos])

  // Validar si se puede analizar
  const puedeAnalizarVertical = () => {
    if (esAdmin && !empresaSeleccionada) return false
    return !!periodoSeleccionado
  }

  const puedeAnalizarHorizontal = () => {
    if (esAdmin && !empresaSeleccionada) return false
    return !!periodoBaseSeleccionado && !!periodoCompSeleccionado
  }

  // Handlers
  const handleAnalizarVertical = async () => {
    if (!puedeAnalizarVertical()) return

    const params = {
      periodo_id: periodoSeleccionado,
    }

    if (esAdmin && empresaSeleccionada) {
      params.empresa_id = empresaSeleccionada
    }

    if (seccionSeleccionada) {
      params.seccion = seccionSeleccionada
    }

    try {
      await obtenerAnalisisVertical(params)
    } catch (err) {
      console.error('Error al analizar:', err)
    }
  }

  const handleAnalizarHorizontal = async () => {
    if (!puedeAnalizarHorizontal()) return

    const params = {
      periodo_base_id: periodoBaseSeleccionado,
      periodo_comp_id: periodoCompSeleccionado,
    }

    if (esAdmin && empresaSeleccionada) {
      params.empresa_id = empresaSeleccionada
    }

    try {
      await obtenerAnalisisHorizontal(params)
    } catch (err) {
      console.error('Error al analizar:', err)
    }
  }

  const handleExportarVertical = () => {
    if (!analisisVertical?.lineas) return
    
    const nombreArchivo = `analisis_vertical_${periodoSeleccionado}_${Date.now()}.csv`
    exportarCSV(analisisVertical.lineas, 'vertical', nombreArchivo)
  }

  const handleExportarHorizontal = () => {
    if (!analisisHorizontal?.lineas) return
    
    // Obtener años de los periodos seleccionados
    const periodoBase = periodos.find(p => p.id === parseInt(periodoBaseSeleccionado))
    const periodoComp = periodos.find(p => p.id === parseInt(periodoCompSeleccionado))
    const anioBase = periodoBase?.anio || periodoBase?.año || periodoBaseSeleccionado
    const anioComp = periodoComp?.anio || periodoComp?.año || periodoCompSeleccionado
    
    const nombreArchivo = `analisis_horizontal_${anioBase}_vs_${anioComp}_${Date.now()}.csv`
    exportarCSV(analisisHorizontal.lineas, 'horizontal', nombreArchivo, { anioBase, anioComp })
  }

  const handleCambioTab = (value) => {
    setTipoAnalisisActivo(value)
    setError(null)
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Análisis de Balance General
            </h1>
          </div>
          <p className="text-muted-foreground">
            Realiza análisis vertical y horizontal del balance general de tu empresa
          </p>
        </div>

        {/* Alerta de error */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Tabs de Análisis */}
        <Tabs value={tipoAnalisisActivo} onValueChange={handleCambioTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="vertical" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Análisis Vertical
            </TabsTrigger>
            <TabsTrigger value="horizontal" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              Análisis Horizontal
            </TabsTrigger>
          </TabsList>

          {/* Análisis Vertical */}
          <TabsContent value="vertical" className="mt-6 space-y-6">
            <FiltrosAnalisis
              tipoAnalisis="vertical"
              esAdministrador={esAdmin}
              empresas={empresas}
              periodos={periodos}
              empresaSeleccionada={empresaSeleccionada}
              periodoSeleccionado={periodoSeleccionado}
              seccionSeleccionada={seccionSeleccionada}
              onEmpresaChange={setEmpresaSeleccionada}
              onPeriodoChange={setPeriodoSeleccionado}
              onSeccionChange={setSeccionSeleccionada}
              onAnalizar={handleAnalizarVertical}
              onExportar={handleExportarVertical}
              loading={loading}
              puedeAnalizar={puedeAnalizarVertical()}
              puedeExportar={!!analisisVertical?.lineas?.length}
            />

            <TablaAnalisisVertical 
              datos={analisisVertical} 
              loading={loading}
            />
          </TabsContent>

          {/* Análisis Horizontal */}
          <TabsContent value="horizontal" className="mt-6 space-y-6">
            <FiltrosAnalisis
              tipoAnalisis="horizontal"
              esAdministrador={esAdmin}
              empresas={empresas}
              periodos={periodos}
              empresaSeleccionada={empresaSeleccionada}
              periodoBaseSeleccionado={periodoBaseSeleccionado}
              periodoCompSeleccionado={periodoCompSeleccionado}
              onEmpresaChange={setEmpresaSeleccionada}
              onPeriodoBaseChange={setPeriodoBaseSeleccionado}
              onPeriodoCompChange={setPeriodoCompSeleccionado}
              onAnalizar={handleAnalizarHorizontal}
              onExportar={handleExportarHorizontal}
              loading={loading}
              puedeAnalizar={puedeAnalizarHorizontal()}
              puedeExportar={!!analisisHorizontal?.lineas?.length}
            />

            <TablaAnalisisHorizontal 
              datos={analisisHorizontal}
              periodos={periodos}
              loading={loading}
            />
          </TabsContent>
        </Tabs>

        {/* Información adicional */}
        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <h3 className="font-semibold flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                  Análisis Vertical
                </h3>
                <p className="text-sm text-muted-foreground">
                  Muestra la participación porcentual de cada cuenta respecto al total de su sección 
                  (Activo, Pasivo o Patrimonio). Útil para identificar la estructura y composición del balance.
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  Análisis Horizontal
                </h3>
                <p className="text-sm text-muted-foreground">
                  Compara el balance entre dos periodos diferentes, mostrando las variaciones absolutas 
                  y porcentuales. Útil para identificar tendencias y cambios significativos en el tiempo.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

