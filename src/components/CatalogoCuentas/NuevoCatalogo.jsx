"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Modal from "@/components/ui/Modal"
import { Upload, Download, FileSpreadsheet, CheckCircle2, AlertCircle, X, Building2, Save, Loader2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useCatalogoCuentas } from "@/hooks/CatalogoCuentas/useCatalogoCuentas"
import authService from "@/services/auth/authService"

export default function AccountCatalogUploader() {
  const navigate = useNavigate()
  const [selectedCompany, setSelectedCompany] = useState("")
  const [accounts, setAccounts] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [successModalData, setSuccessModalData] = useState({ title: '', description: '' })

  const {
    empresas,
    loading: loadingEmpresas,
    cargarEmpresas,
    guardarCatalogo,
  } = useCatalogoCuentas()

  // Cargar empresas al montar el componente
  useEffect(() => {
    cargarEmpresas()
  }, [cargarEmpresas])

  // Pre-seleccionar empresa si es Analista Financiero
  useEffect(() => {
    if (empresas.length > 0 && !selectedCompany) {
      const user = authService.getCurrentUser()
      
      // Si es analista y solo hay una empresa (la suya), seleccionarla automáticamente
      if (empresas.length === 1) {
        setSelectedCompany(empresas[0].id.toString())
      }
      // O si el usuario tiene empresa_id, seleccionarla
      else if (user?.empresa_id) {
        const empresaUsuario = empresas.find(e => e.id === user.empresa_id)
        if (empresaUsuario) {
          setSelectedCompany(empresaUsuario.id.toString())
        }
      }
    }
  }, [empresas, selectedCompany])

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsLoading(true)
    setError(null)
    setSuccessMessage(null)

    try {
      const fileExtension = file.name.split(".").pop().toLowerCase()

      if (fileExtension === "csv") {
        await parseCSV(file)
      } else if (fileExtension === "xlsx" || fileExtension === "xls") {
        await parseExcel(file)
      } else {
        throw new Error("Formato de archivo no soportado. Use CSV o Excel (.xlsx, .xls)")
      }

      setSuccessMessage(`Archivo cargado exitosamente`)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
      event.target.value = ""
    }
  }

  const parseCSV = async (file) => {
    const text = await file.text()
    const lines = text.split("\n").filter((line) => line.trim())

    // Skip header row
    const dataLines = lines.slice(1)

    const parsedAccounts = dataLines.map((line, index) => {
      const [codigo, nombre] = line.split(",").map((item) => item.trim().replace(/^"|"$/g, ""))

      if (!codigo || !nombre) {
        throw new Error(`Línea ${index + 2}: Formato inválido. Asegúrese de que cada línea tenga código y nombre`)
      }

      // Auto-asignar estado financiero basado en el tipo de cuenta
      const tipo = determinarTipoCuenta(codigo)
      const estado_financiero = inferirEstadoFinanciero(tipo)

      return { codigo, nombre, estado_financiero }
    })

    setAccounts(parsedAccounts)
  }

  const parseExcel = async (file) => {
    // For Excel files, we'll use the xlsx library
    const XLSX = await import("xlsx")
    const data = await file.arrayBuffer()
    const workbook = XLSX.read(data, { type: "array" })
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })

    // Skip header row
    const dataRows = jsonData.slice(1)

    const parsedAccounts = dataRows
      .filter((row) => row.length >= 2 && row[0] && row[1])
      .map((row, index) => {
        const codigo = String(row[0]).trim()
        const nombre = String(row[1]).trim()

        if (!codigo || !nombre) {
          throw new Error(`Fila ${index + 2}: Formato inválido`)
        }

        // Auto-asignar estado financiero basado en el tipo de cuenta
        const tipo = determinarTipoCuenta(codigo)
        const estado_financiero = inferirEstadoFinanciero(tipo)

        return { codigo, nombre, estado_financiero }
      })

    if (parsedAccounts.length === 0) {
      throw new Error("No se encontraron datos válidos en el archivo")
    }

    setAccounts(parsedAccounts)
  }

  const downloadTemplate = () => {
    const csvContent =
      "Código,Nombre de Cuenta\n1000,Activo\n1100,Activo Corriente\n1110,Caja\n1120,Bancos\n2000,Pasivo\n2100,Pasivo Corriente\n3000,Patrimonio\n4000,Ingresos\n5000,Gastos"

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)

    link.setAttribute("href", url)
    link.setAttribute("download", "plantilla_catalogo_cuentas.csv")
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    setSuccessMessage("Plantilla descargada exitosamente")
    setTimeout(() => setSuccessMessage(null), 3000)
  }

  const handleSave = async () => {
    if (!selectedCompany || accounts.length === 0) return

    setIsLoading(true)
    setError(null)

    try {
      // Preparar datos para enviar al backend
      const catalogoData = {
        empresa_id: parseInt(selectedCompany),
        cuentas: accounts.map(cuenta => ({
          codigo: cuenta.codigo,
          nombre: cuenta.nombre,
          tipo: determinarTipoCuenta(cuenta.codigo),
          es_calculada: false,
          estado_financiero: cuenta.estado_financiero || 'NINGUNO'
        }))
      }

      const response = await guardarCatalogo(catalogoData)
      
      if (response.success) {
        const empresaSeleccionada = empresas.find((c) => c.id === parseInt(selectedCompany))
        
        // Mostrar modal de éxito
        setSuccessModalData({
          title: '¡Catálogo guardado exitosamente!',
          description: `El catálogo de cuentas para ${empresaSeleccionada?.nombre} se ha guardado correctamente con ${accounts.length} cuenta(s).`
        })
        setShowSuccessModal(true)
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Error al guardar el catálogo'
      setError(errorMsg)
      console.error('Error al guardar catálogo:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Función auxiliar para determinar el tipo de cuenta según el código
  // 1 - Activo, 2 - Pasivo, 3 - Patrimonio, 4 - Ingresos, 5 - Costos, 6 - Gastos, 7 - Resultados
  const determinarTipoCuenta = (codigo) => {
    const primerDigito = codigo.toString()[0]
    
    switch(primerDigito) {
      case '1':
        return 'ACTIVO'
      case '2':
        return 'PASIVO'
      case '3':
        return 'PATRIMONIO'
      case '4':
        return 'INGRESO'
      case '5':
      case '6':
      case '7':
        return 'GASTO'
      default:
        return 'ACTIVO' // Por defecto
    }
  }

  // Función auxiliar para inferir estado financiero según el código
  // 1-3 → Balance General, 4-7 → Estado de Resultados
  const inferirEstadoFinanciero = (tipo) => {
    const mapeo = {
      'ACTIVO': 'BALANCE_GENERAL',
      'PASIVO': 'BALANCE_GENERAL',
      'PATRIMONIO': 'BALANCE_GENERAL',
      'INGRESO': 'ESTADO_RESULTADOS',
      'GASTO': 'ESTADO_RESULTADOS',
    }
    return mapeo[tipo] || 'NINGUNO'
  }

  // Handler para cambiar el estado financiero de una cuenta
  const handleEstadoFinancieroChange = (index, value) => {
    setAccounts(prevAccounts => {
      const newAccounts = [...prevAccounts]
      newAccounts[index].estado_financiero = value
      return newAccounts
    })
  }

  // Aplicar estado financiero masivamente
  const aplicarEstadoFinancieroMasivo = (estado) => {
    setAccounts(prevAccounts => 
      prevAccounts.map(account => {
        const tipo = determinarTipoCuenta(account.codigo)
        const primerDigito = account.codigo.toString()[0]
        
        // Balance General: códigos 1, 2, 3
        if (estado === 'BALANCE_GENERAL' && ['1', '2', '3'].includes(primerDigito)) {
          return { ...account, estado_financiero: estado }
        }
        // Estado de Resultados: códigos 4, 5, 6, 7
        if (estado === 'ESTADO_RESULTADOS' && ['4', '5', '6', '7'].includes(primerDigito)) {
          return { ...account, estado_financiero: estado }
        }
        return account
      })
    )
    setSuccessMessage(`Estado financiero aplicado exitosamente`)
    setTimeout(() => setSuccessMessage(null), 3000)
  }

  // Función para formatear el estado financiero
  const formatEstadoFinanciero = (estado) => {
    const labels = {
      'BALANCE_GENERAL': 'Balance General',
      'ESTADO_RESULTADOS': 'Estado de Resultados',
      'NINGUNO': 'N/A'
    }
    return labels[estado] || estado
  }

  // Función para obtener la clase CSS del badge
  const getBadgeClass = (estado) => {
    const classes = {
      'BALANCE_GENERAL': 'bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium',
      'ESTADO_RESULTADOS': 'bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium',
      'NINGUNO': 'bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs font-medium'
    }
    return classes[estado] || classes['NINGUNO']
  }

  const handleCancel = () => {
    setAccounts([])
    setSelectedCompany("")
    setError(null)
    setSuccessMessage(null)
  }

  const clearAccounts = () => {
    setAccounts([])
    setError(null)
    setSuccessMessage(null)
  }

  return (
    <div className="p-8 space-y-8 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center pb-4 border-b border-gray-200">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Nuevo Catálogo de Cuentas</h1>
          <p className="text-gray-600">Carga un catálogo de cuentas desde un archivo CSV o Excel</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" aria-hidden="true" />
            Seleccionar Empresa
          </CardTitle>
          <CardDescription>
            {empresas.length === 1 
              ? "Empresa asignada (no se puede cambiar)" 
              : "Seleccione la empresa para cargar su catálogo de cuentas"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select 
            value={selectedCompany} 
            onValueChange={setSelectedCompany} 
            disabled={loadingEmpresas || empresas.length === 1}
          >
            <SelectTrigger className="w-full" aria-label="Seleccionar empresa">
              <SelectValue placeholder={loadingEmpresas ? "Cargando empresas..." : "Seleccione una empresa..."} />
            </SelectTrigger>
            <SelectContent>
              {empresas.map((empresa) => (
                <SelectItem key={empresa.id} value={empresa.id.toString()}>
                  {empresa.nombre} {empresa.tiene_catalogo ? '(Tiene catálogo - Se reemplazará)' : '(Sin catálogo)'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cargar Catálogo de Cuentas</CardTitle>
          <CardDescription>Sube un archivo CSV o Excel con dos columnas: Código y Nombre de Cuenta</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={() => document.getElementById("file-upload").click()}
              disabled={isLoading || !selectedCompany}
              className="flex-1"
              size="lg"
            >
              <Upload className="mr-2 h-5 w-5" aria-hidden="true" />
              {isLoading ? "Cargando..." : "Cargar Archivo"}
            </Button>
            <input
              id="file-upload"
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileUpload}
              className="sr-only"
              aria-label="Seleccionar archivo de catálogo de cuentas"
              disabled={!selectedCompany}
            />

            <Button onClick={downloadTemplate} variant="outline" className="flex-1" size="lg">
              <Download className="mr-2 h-5 w-5" aria-hidden="true" />
              Descargar Plantilla
            </Button>
          </div>

          {!selectedCompany && (
            <Alert>
              <AlertCircle className="h-4 w-4" aria-hidden="true" />
              <AlertDescription>Debe seleccionar una empresa antes de cargar el catálogo</AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" aria-hidden="true" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {successMessage && (
            <Alert className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" aria-hidden="true" />
              <AlertDescription className="text-green-800 dark:text-green-200">{successMessage}</AlertDescription>
            </Alert>
          )}

          {accounts.length > 0 && !error && !successMessage && (
            <Alert className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" aria-hidden="true" />
              <AlertDescription className="text-green-800 dark:text-green-200">
                Se cargaron {accounts.length} cuentas exitosamente
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {accounts.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Cuentas Cargadas</CardTitle>
              <CardDescription>Total: {accounts.length} cuentas</CardDescription>
            </div>
            <Button
              onClick={clearAccounts}
              variant="ghost"
              size="sm"
              className="text-red-600 hover:text-red-700"
            >
              <X className="mr-2 h-4 w-4" aria-hidden="true" />
              Limpiar
            </Button>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex flex-wrap gap-2">
              <Button 
                onClick={() => aplicarEstadoFinancieroMasivo('BALANCE_GENERAL')}
                variant="outline"
                size="sm"
                className="text-blue-600 border-blue-300 hover:bg-blue-50"
              >
                Cuentas 1-2-3 → Balance General
              </Button>
              <Button 
                onClick={() => aplicarEstadoFinancieroMasivo('ESTADO_RESULTADOS')}
                variant="outline"
                size="sm"
                className="text-green-600 border-green-300 hover:bg-green-50"
              >
                Cuentas 4-5-6-7 → Estado de Resultados
              </Button>
            </div>
            <div className="rounded-lg border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Código</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Nombre de Cuenta</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Estado Financiero</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {accounts.map((account, index) => (
                      <tr key={index} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-sm font-mono text-gray-900">{account.codigo}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{account.nombre}</td>
                        <td className="px-4 py-3">
                          <Select 
                            value={account.estado_financiero} 
                            onValueChange={(value) => handleEstadoFinancieroChange(index, value)}
                          >
                            <SelectTrigger className="w-full max-w-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="NINGUNO">Ninguno</SelectItem>
                              <SelectItem value="BALANCE_GENERAL">Balance General</SelectItem>
                              <SelectItem value="ESTADO_RESULTADOS">Estado de Resultados</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {accounts.length > 0 && selectedCompany && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <Button onClick={handleSave} className="flex-1" size="lg" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-5 w-5" aria-hidden="true" />
                    Guardar Catálogo
                  </>
                )}
              </Button>
              <Button onClick={handleCancel} variant="outline" className="flex-1" size="lg" disabled={isLoading}>
                <X className="mr-2 h-5 w-5" aria-hidden="true" />
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="bg-gray-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" aria-hidden="true" />
            Formato del Archivo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <h3 className="font-semibold text-sm mb-2">Estructura requerida:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
              <li>Primera fila: Encabezados (Código, Nombre de Cuenta)</li>
              <li>Columna 1: Código de la cuenta</li>
              <li>Columna 2: Nombre de la cuenta</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-sm mb-2">Formatos aceptados:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
              <li>CSV (.csv)</li>
              <li>Excel (.xlsx, .xls)</li>
            </ul>
          </div>
        </CardContent>
      </Card>
      </div>

      <Modal
        isOpen={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false)
          navigate('/dashboard/catalogo-cuentas')
        }}
        type="success"
        title={successModalData.title}
        footer={
          <Button
            onClick={() => {
              setShowSuccessModal(false)
              navigate('/dashboard/catalogo-cuentas')
            }}
            className="gap-2"
          >
            <CheckCircle2 className="h-4 w-4" />
            Continuar
          </Button>
        }
      >
        <p className="text-sm text-gray-600 dark:text-gray-300">
          {successModalData.description}
        </p>
      </Modal>
    </div>
  )
}
