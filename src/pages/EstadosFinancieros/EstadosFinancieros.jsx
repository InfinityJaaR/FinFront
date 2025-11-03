import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs"
import { Button } from "../../components/ui/button"
import { Plus } from "lucide-react"
import BalanceGeneral from "../../components/EstadosFinancieros/BalanceGeneral"
import EstadoResultado from "../../components/EstadosFinancieros/EstadoResultado"
import { useEstadosFinancieros } from "../../hooks/EstadosFinancieros/useEstadosFinancieros"

export default function EstadosFinancierosPage() {
  const navigate = useNavigate()
  const {
    empresas,
    periodos,
    loading,
    cargarEmpresas,
    cargarPeriodos,
  } = useEstadosFinancieros()

  const [empresaSeleccionada, setEmpresaSeleccionada] = useState("")
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState("")

  useEffect(() => {
    cargarEmpresas()
    cargarPeriodos()
  }, [])

  const mostrarEstados = empresaSeleccionada && periodoSeleccionado

  const handleNuevoEstado = () => {
    navigate('/dashboard/estados-financieros/nuevo')
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Estados Financieros</h1>
            <p className="text-muted-foreground">
              Consulta el Balance General y Estado de Resultados por empresa y año
            </p>
          </div>
          <Button size="lg" className="gap-2" onClick={handleNuevoEstado}>
            <Plus className="h-5 w-5" />
            Nuevo Estado
          </Button>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle>Seleccionar Empresa y Período</CardTitle>
            <CardDescription>Elige la empresa y el año fiscal para visualizar los estados financieros</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {/* Selector de Empresa */}
              <div className="space-y-2">
                <label htmlFor="empresa" className="text-sm font-medium text-foreground">
                  Empresa
                </label>
                <Select value={empresaSeleccionada} onValueChange={setEmpresaSeleccionada} disabled={loading}>
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

              {/* Selector de Periodo */}
              <div className="space-y-2">
                <label htmlFor="periodo" className="text-sm font-medium text-foreground">
                  Periodo
                </label>
                <Select value={periodoSeleccionado} onValueChange={setPeriodoSeleccionado} disabled={loading}>
                  <SelectTrigger id="periodo" aria-label="Seleccionar periodo">
                    <SelectValue placeholder="Selecciona un periodo" />
                  </SelectTrigger>
                  <SelectContent>
                    {periodos.map((periodo) => (
                      <SelectItem key={periodo.id} value={periodo.id.toString()}>
                        {periodo.nombre} ({periodo.año})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Estados Financieros */}
        {mostrarEstados ? (
          <Tabs defaultValue="balance" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="balance">Balance General</TabsTrigger>
              <TabsTrigger value="resultados">Estado de Resultados</TabsTrigger>
            </TabsList>

            <TabsContent value="balance" className="mt-6">
              <BalanceGeneral empresaId={empresaSeleccionada} periodoId={periodoSeleccionado} />
            </TabsContent>

            <TabsContent value="resultados" className="mt-6">
              <EstadoResultado empresaId={empresaSeleccionada} periodoId={periodoSeleccionado} />
            </TabsContent>
          </Tabs>
        ) : (
          <Card>
            <CardContent className="flex min-h-[400px] items-center justify-center">
              <div className="text-center">
                <p className="text-lg text-muted-foreground">
                  Selecciona una empresa y un periodo para visualizar los estados financieros
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
