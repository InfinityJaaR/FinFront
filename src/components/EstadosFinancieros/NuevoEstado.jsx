import { useNavigate } from "react-router-dom"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, FileUp, PenLine } from "lucide-react"

export default function NuevoEstadoPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard/estados-financieros')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Nuevo Estado Financiero</h1>
            <p className="text-muted-foreground">Selecciona cómo deseas ingresar el estado financiero</p>
          </div>
        </div>

        {/* Opciones de ingreso */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Opción Manual */}
          <Card 
            className="cursor-pointer transition-all hover:border-primary hover:shadow-lg"
            onClick={() => navigate('/dashboard/estados-financieros/nuevo-manual')}
          >
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <PenLine className="h-8 w-8 text-primary" />
              </div>
              <CardTitle>Ingreso Manual</CardTitle>
              <CardDescription>Ingresa las cuentas y montos manualmente uno por uno</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button className="w-full">Ingresar Manualmente</Button>
            </CardContent>
          </Card>

          {/* Opción Importar */}
          <Card 
            className="cursor-pointer transition-all hover:border-primary hover:shadow-lg"
            onClick={() => navigate('/dashboard/estados-financieros/importar')}
          >
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <FileUp className="h-8 w-8 text-primary" />
              </div>
              <CardTitle>Importar Archivo</CardTitle>
              <CardDescription>Sube un archivo CSV o XML con las cuentas y montos</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button className="w-full">Importar Archivo</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
