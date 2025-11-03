import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Download, Upload, Save, Loader2, AlertCircle, CheckCircle2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { formatCurrency } from "@/lib/format-utils"
import { useEstadosFinancieros } from "@/hooks/EstadosFinancieros/useEstadosFinancieros"

export default function ImportarEstadoPage() {
  const navigate = useNavigate()

  const {
    empresas,
    periodos,
    loading,
    error,
    cargarEmpresas,
    cargarPeriodos,
    descargarPlantilla,
    crearEstado,
  } = useEstadosFinancieros()

  const [empresa, setEmpresa] = useState("")
  const [periodo, setPeriodo] = useState("")
  const [tipoEstado, setTipoEstado] = useState("")
  const [archivo, setArchivo] = useState(null)
  const [datosPreview, setDatosPreview] = useState([])
  const [isLoadingFile, setIsLoadingFile] = useState(false)
  const [successMessage, setSuccessMessage] = useState(null)
  const [errorMessage, setErrorMessage] = useState(null)

  // Cargar empresas y periodos al montar
  useEffect(() => {
    cargarEmpresas()
    cargarPeriodos()
  }, [cargarEmpresas, cargarPeriodos])

  const handleDescargarPlantilla = async () => {
    if (!empresa || !tipoEstado) {
      setErrorMessage('Selecciona empresa y tipo de estado primero')
      return
    }

    try {
      await descargarPlantilla(parseInt(empresa), tipoEstado)
      setSuccessMessage('Plantilla descargada exitosamente')
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Error al descargar plantilla')
    }
  }

  const handleArchivoChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setArchivo(file)

    // Leer y parsear el archivo
    const reader = new FileReader()
    reader.onload = (event) => {
      const contenido = event.target?.result
      if (typeof contenido === "string") {
        parsearArchivo(contenido, file.name.endsWith(".csv") ? "csv" : "xml")
      }
    }
    reader.readAsText(file)
  }

  const parsearArchivo = (contenido, tipo) => {
    if (tipo === "csv") {
      const lineas = contenido.split("\n").filter((l) => l.trim())
      const datos = []

      // Saltar la primera línea (encabezados)
      for (let i = 1; i < lineas.length; i++) {
        const [cuenta, monto] = lineas[i].split(",").map((s) => s.trim())
        if (cuenta && monto) {
          // Validar que el monto sea numérico
          const montoNumerico = Number.parseFloat(monto.replace(/[^0-9.-]/g, ""))
          if (!isNaN(montoNumerico)) {
            datos.push({
              id: i,
              cuenta,
              monto: montoNumerico,
              paraRatios: false,
            })
          }
        }
      }

      setDatosPreview(datos)
    } else if (tipo === "xml") {
      // Parsear XML básico
      const parser = new DOMParser()
      const xmlDoc = parser.parseFromString(contenido, "text/xml")
      const cuentas = xmlDoc.getElementsByTagName("cuenta")
      const datos = []

      for (let i = 0; i < cuentas.length; i++) {
        const nombre = cuentas[i].getElementsByTagName("nombre")[0]?.textContent
        const monto = cuentas[i].getElementsByTagName("monto")[0]?.textContent

        if (nombre && monto) {
          const montoNumerico = Number.parseFloat(monto.replace(/[^0-9.-]/g, ""))
          if (!isNaN(montoNumerico)) {
            datos.push({
              id: i + 1,
              cuenta: nombre,
              monto: montoNumerico,
              paraRatios: false,
            })
          }
        }
      }

      setDatosPreview(datos)
    }
  }

  const toggleRatio = (id) => {
    const nuevosRatios = new Set(cuentasParaRatios)
    if (nuevosRatios.has(id)) {
      nuevosRatios.delete(id)
    } else {
      nuevosRatios.add(id)
    }
    setCuentasParaRatios(nuevosRatios)
  }

  const handleGuardar = () => {
    const datosFinales = datosPreview.map((d) => ({
      ...d,
      paraRatios: cuentasParaRatios.has(d.id),
    }))

    console.log("Guardando estado financiero importado:", {
      empresa,
      año,
      tipoEstado,
      datos: datosFinales,
    })

    // Aquí implementarías la lógica para guardar en tu API/base de datos
    navigate('/dashboard/estados-financieros')
  }

  const puedeSubirArchivo = empresa && año && tipoEstado
  const puedeGuardar = datosPreview.length > 0

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Importar Estado Financiero</h1>
            <p className="text-muted-foreground">Sube un archivo CSV o XML con las cuentas y montos</p>
          </div>
        </div>

        {/* Selección de Empresa, Año y Tipo de Estado */}
        <Card>
          <CardHeader>
            <CardTitle>Información General</CardTitle>
            <CardDescription>Selecciona la empresa, año y tipo de estado antes de subir el archivo</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="empresa">Empresa</Label>
                <Select value={empresa} onValueChange={setEmpresa}>
                  <SelectTrigger id="empresa">
                    <SelectValue placeholder="Selecciona una empresa" />
                  </SelectTrigger>
                  <SelectContent>
                    {empresas.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id.toString()}>
                        {emp.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="año">Año Fiscal</Label>
                <Select value={año} onValueChange={setAño}>
                  <SelectTrigger id="año">
                    <SelectValue placeholder="Selecciona un año" />
                  </SelectTrigger>
                  <SelectContent>
                    {años.map((a) => (
                      <SelectItem key={a} value={a.toString()}>
                        {a}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tipoEstado">Tipo de Estado</Label>
                <Select value={tipoEstado} onValueChange={setTipoEstado}>
                  <SelectTrigger id="tipoEstado">
                    <SelectValue placeholder="Selecciona el tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="balance">Balance General</SelectItem>
                    <SelectItem value="resultados">Estado de Resultados</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Subir Archivo */}
        <Card>
          <CardHeader>
            <CardTitle>Subir Archivo</CardTitle>
            <CardDescription>Descarga la plantilla, complétala y súbela aquí</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="outline" onClick={handleDescargarPlantilla} className="gap-2 bg-transparent">
              <Download className="h-4 w-4" />
              Descargar Plantilla
            </Button>

            <div className="space-y-2">
              <Label htmlFor="archivo">Archivo</Label>
              <div className="flex gap-2">
                <Input
                  id="archivo"
                  type="file"
                  accept=".csv,.xml"
                  onChange={handleArchivoChange}
                  disabled={!puedeSubirArchivo}
                  className="flex-1"
                />
                <Button disabled={!archivo} variant="outline" className="gap-2 bg-transparent">
                  <Upload className="h-4 w-4" />
                  Subir
                </Button>
              </div>
              {!puedeSubirArchivo && (
                <p className="text-sm text-muted-foreground">
                  Selecciona empresa, año y tipo de estado antes de subir el archivo
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Previsualización */}
        {datosPreview.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Previsualización de Datos</CardTitle>
              <CardDescription>Revisa los datos y marca las cuentas que se usarán para calcular ratios</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                        Nombre de Cuenta
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Monto</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">
                        Usar para Ratios
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {datosPreview.map((dato) => (
                      <tr key={dato.id} className="border-b">
                        <td className="px-4 py-3 text-sm text-foreground">{dato.cuenta}</td>
                        <td className="px-4 py-3 text-right text-sm font-medium text-foreground">
                          {formatCurrency(dato.monto)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Checkbox
                            checked={cuentasParaRatios.has(dato.id)}
                            onCheckedChange={() => toggleRatio(dato.id)}
                            aria-label={`Usar ${dato.cuenta} para ratios`}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 font-semibold">
                      <td className="px-4 py-3 text-sm text-foreground">Total</td>
                      <td className="px-4 py-3 text-right text-sm text-foreground">
                        {formatCurrency(datosPreview.reduce((sum, d) => sum + d.monto, 0))}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <Button variant="outline" onClick={() => navigate(-1)}>
                  Cancelar
                </Button>
                <Button onClick={handleGuardar} disabled={!puedeGuardar} className="gap-2">
                  <Save className="h-4 w-4" />
                  Guardar Estado Financiero
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
