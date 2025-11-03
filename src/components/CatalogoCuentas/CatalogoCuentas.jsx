import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Loader2 } from "lucide-react"
import AccountList from "./ListaCuentas"
import EditAccountDialog from "./EditarCuenta"
import { useCatalogoCuentas } from "@/hooks/CatalogoCuentas/useCatalogoCuentas"
import authService from "@/services/auth/authService"

export default function AccountCatalog() {
  const navigate = useNavigate()
  const [selectedEmpresa, setSelectedEmpresa] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [editingAccount, setEditingAccount] = useState(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  const {
    cuentas,
    empresas,
    empresa,
    loading,
    error,
    cargarEmpresas,
    cargarCatalogo,
    actualizarCuenta,
  } = useCatalogoCuentas()

  // Cargar empresas al montar el componente
  useEffect(() => {
    cargarEmpresas()
  }, [cargarEmpresas])

  // Pre-seleccionar empresa si es Analista Financiero
  useEffect(() => {
    if (empresas.length > 0 && !selectedEmpresa) {
      const user = authService.getCurrentUser()
      
      // Si es analista y solo hay una empresa (la suya), seleccionarla automáticamente
      if (empresas.length === 1) {
        setSelectedEmpresa(empresas[0].id.toString())
      }
      // O si el usuario tiene empresa_id, seleccionarla
      else if (user?.empresa_id) {
        const empresaUsuario = empresas.find(e => e.id === user.empresa_id)
        if (empresaUsuario) {
          setSelectedEmpresa(empresaUsuario.id.toString())
        }
      }
    }
  }, [empresas, selectedEmpresa])

  // Cargar catálogo cuando cambia la empresa seleccionada
  useEffect(() => {
    if (selectedEmpresa) {
      cargarCatalogo(parseInt(selectedEmpresa))
    }
  }, [selectedEmpresa, cargarCatalogo])

  const cuentasFiltradas = cuentas.filter(
    (cuenta) =>
      cuenta.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cuenta.nombre.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleEditAccount = (cuenta) => {
    setEditingAccount(cuenta)
    setIsEditDialogOpen(true)
  }

  const handleSaveAccount = async (updatedAccount) => {
    try {
      await actualizarCuenta(editingAccount.id, updatedAccount)
      // El hook ya actualiza el estado local de cuentas
    } catch (err) {
      console.error('Error al guardar cuenta:', err)
      // El error ya se maneja en el hook
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Catálogo de Cuentas</h1>
          <p className="text-gray-600">Consulta el plan de cuentas contables por empresa</p>
        </div>
        <Button size="default" className="shrink-0" onClick={() => navigate('/dashboard/catalogo-cuentas/nuevo')}>
          Nuevo Catálogo
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Seleccionar Empresa</CardTitle>
          <CardDescription>
            {empresas.length === 1 
              ? "Mostrando tu empresa asignada" 
              : "Elige una empresa para ver su catálogo de cuentas"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="empresa-select">Empresa</Label>
            <Select 
              value={selectedEmpresa} 
              onValueChange={setSelectedEmpresa} 
              disabled={loading || empresas.length === 1}
            >
              <SelectTrigger id="empresa-select" className="w-full">
                <SelectValue placeholder={loading ? "Cargando empresas..." : "Selecciona una empresa"} />
              </SelectTrigger>
              <SelectContent>
                {empresas.map((empresa) => (
                  <SelectItem key={empresa.id} value={empresa.id.toString()}>
                    {empresa.nombre} {empresa.tiene_catalogo ? `(${empresa.total_cuentas} cuentas)` : '(Sin catálogo)'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedEmpresa && (
            <div className="space-y-2">
              <Label htmlFor="search-input">Buscar cuenta</Label>
              <Input
                id="search-input"
                type="text"
                placeholder="Buscar por código o nombre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
                disabled={loading}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {loading && selectedEmpresa && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-12 h-12 text-gray-400 mb-4 animate-spin" />
            <p className="text-gray-600 text-lg">Cargando catálogo de cuentas...</p>
          </CardContent>
        </Card>
      )}

      {!loading && selectedEmpresa && cuentas.length > 0 && (
        <AccountList
          cuentas={cuentasFiltradas}
          empresaNombre={empresa?.nombre}
          onEditAccount={handleEditAccount}
        />
      )}

      {!loading && selectedEmpresa && cuentas.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <svg
              className="w-16 h-16 text-gray-400 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p className="text-gray-600 text-lg mb-2">Esta empresa no tiene catálogo de cuentas</p>
            <p className="text-gray-500 text-sm mb-4">Haz clic en "Nuevo Catálogo" para cargar uno</p>
            <Button onClick={() => navigate('/dashboard/catalogo-cuentas/nuevo')}>
              Cargar Catálogo
            </Button>
          </CardContent>
        </Card>
      )}

      {!selectedEmpresa && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <svg
              className="w-16 h-16 text-gray-400 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p className="text-gray-600 text-center">Selecciona una empresa para ver su catálogo de cuentas</p>
          </CardContent>
        </Card>
      )}

      <EditAccountDialog
        account={editingAccount}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSave={handleSaveAccount}
      />
    </div>
  )
}
