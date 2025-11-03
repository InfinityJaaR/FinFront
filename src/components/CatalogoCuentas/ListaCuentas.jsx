"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function AccountList({ cuentas, empresaNombre, onEditAccount }) {
  if (!cuentas || cuentas.length === 0) {
    return (
      <Card>
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
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <p className="text-gray-600 text-center">No se encontraron cuentas con los criterios de búsqueda</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cuentas Contables</CardTitle>
        <CardDescription>
          {empresaNombre} - {cuentas.length} {cuentas.length === 1 ? "cuenta" : "cuentas"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Código</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Nombre de la Cuenta</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-900 w-24">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {cuentas.map((cuenta, index) => (
                <tr
                  key={`${cuenta.codigo}-${index}`}
                  className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors"
                >
                  <td className="py-3 px-4 font-mono text-sm text-gray-900">{cuenta.codigo}</td>
                  <td className="py-3 px-4 text-gray-900">{cuenta.nombre}</td>
                  <td className="py-3 px-4 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEditAccount(cuenta)}
                      aria-label={`Editar cuenta ${cuenta.codigo}`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                      <span className="ml-2">Editar</span>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
