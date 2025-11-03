"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import BalanceGeneral from "@/components/EstadosFinancieros/BalanceGeneral"
import EstadoResultados from "@/components/EstadosFinancieros/EstadoResultado"

// Datos de ejemplo - reemplazar con datos reales de tu API/base de datos
const empresas = [
  { id: 1, nombre: "Empresa A S.A." },
  { id: 2, nombre: "Empresa B Ltda." },
  { id: 3, nombre: "Empresa C Corp." },
]

const años = ["2024", "2023", "2022", "2021", "2020"]

export default function EstadosFinancierosPage() {
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState("")
  const [añoSeleccionado, setAñoSeleccionado] = useState("")

  const mostrarEstados = empresaSeleccionada && añoSeleccionado

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Estados Financieros</h1>
          <p className="text-muted-foreground">Consulta el Balance General y Estado de Resultados por empresa y año</p>
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
                <Select value={empresaSeleccionada} onValueChange={setEmpresaSeleccionada}>
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

              {/* Selector de Año */}
              <div className="space-y-2">
                <label htmlFor="año" className="text-sm font-medium text-foreground">
                  Año Fiscal
                </label>
                <Select value={añoSeleccionado} onValueChange={setAñoSeleccionado}>
                  <SelectTrigger id="año" aria-label="Seleccionar año fiscal">
                    <SelectValue placeholder="Selecciona un año" />
                  </SelectTrigger>
                  <SelectContent>
                    {años.map((año) => (
                      <SelectItem key={año} value={año}>
                        {año}
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
              <BalanceGeneral empresaId={empresaSeleccionada} año={añoSeleccionado} />
            </TabsContent>

            <TabsContent value="resultados" className="mt-6">
              <EstadoResultados empresaId={empresaSeleccionada} año={añoSeleccionado} />
            </TabsContent>
          </Tabs>
        ) : (
          <Card>
            <CardContent className="flex min-h-[400px] items-center justify-center">
              <div className="text-center">
                <p className="text-lg text-muted-foreground">
                  Selecciona una empresa y un año para visualizar los estados financieros
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
