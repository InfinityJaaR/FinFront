import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/format-utils"

// Datos de ejemplo - reemplazar con datos reales de tu API/base de datos
const obtenerDatosBalance = (empresaId, año) => {
  return {
    activos: {
      corrientes: [
        { cuenta: "Efectivo y Equivalentes", monto: 150000 },
        { cuenta: "Cuentas por Cobrar", monto: 85000 },
        { cuenta: "Inventarios", monto: 120000 },
        { cuenta: "Gastos Pagados por Anticipado", monto: 15000 },
      ],
      noCorrientes: [
        { cuenta: "Propiedad, Planta y Equipo", monto: 450000 },
        { cuenta: "Inversiones a Largo Plazo", monto: 75000 },
        { cuenta: "Activos Intangibles", monto: 35000 },
      ],
    },
    pasivos: {
      corrientes: [
        { cuenta: "Cuentas por Pagar", monto: 65000 },
        { cuenta: "Préstamos a Corto Plazo", monto: 40000 },
        { cuenta: "Impuestos por Pagar", monto: 25000 },
      ],
      noCorrientes: [
        { cuenta: "Préstamos a Largo Plazo", monto: 200000 },
        { cuenta: "Obligaciones por Arrendamiento", monto: 80000 },
      ],
    },
    patrimonio: [
      { cuenta: "Capital Social", monto: 300000 },
      { cuenta: "Reservas", monto: 50000 },
      { cuenta: "Utilidades Retenidas", monto: 180000 },
    ],
  }
}

const calcularTotal = (items) => {
  return items.reduce((sum, item) => sum + item.monto, 0)
}

export default function BalanceGeneral({ empresaId, año }) {
  const datos = obtenerDatosBalance(empresaId, año)

  const totalActivosCorrientes = calcularTotal(datos.activos.corrientes)
  const totalActivosNoCorrientes = calcularTotal(datos.activos.noCorrientes)
  const totalActivos = totalActivosCorrientes + totalActivosNoCorrientes

  const totalPasivosCorrientes = calcularTotal(datos.pasivos.corrientes)
  const totalPasivosNoCorrientes = calcularTotal(datos.pasivos.noCorrientes)
  const totalPasivos = totalPasivosCorrientes + totalPasivosNoCorrientes

  const totalPatrimonio = calcularTotal(datos.patrimonio)
  const totalPasivosPatrimonio = totalPasivos + totalPatrimonio

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* ACTIVOS */}
      <Card>
        <CardHeader className="bg-primary text-primary-foreground">
          <CardTitle className="text-2xl font-bold">ACTIVOS</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          {/* Activos Corrientes */}
          <div className="space-y-3">
            <h3 className="font-semibold text-foreground">Activos Corrientes</h3>
            <div className="space-y-2">
              {datos.activos.corrientes.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between border-b border-border py-2 last:border-0"
                >
                  <span className="text-sm text-foreground">{item.cuenta}</span>
                  <span className="font-medium tabular-nums text-foreground">{formatCurrency(item.monto)}</span>
                </div>
              ))}
              <div className="flex items-center justify-between border-t-2 border-border pt-2">
                <span className="font-semibold text-foreground">Total Activos Corrientes</span>
                <span className="font-bold tabular-nums text-foreground">{formatCurrency(totalActivosCorrientes)}</span>
              </div>
            </div>
          </div>

          {/* Activos No Corrientes */}
          <div className="space-y-3">
            <h3 className="font-semibold text-foreground">Activos No Corrientes</h3>
            <div className="space-y-2">
              {datos.activos.noCorrientes.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between border-b border-border py-2 last:border-0"
                >
                  <span className="text-sm text-foreground">{item.cuenta}</span>
                  <span className="font-medium tabular-nums text-foreground">{formatCurrency(item.monto)}</span>
                </div>
              ))}
              <div className="flex items-center justify-between border-t-2 border-border pt-2">
                <span className="font-semibold text-foreground">Total Activos No Corrientes</span>
                <span className="font-bold tabular-nums text-foreground">
                  {formatCurrency(totalActivosNoCorrientes)}
                </span>
              </div>
            </div>
          </div>

          {/* Total Activos */}
          <div className="flex items-center justify-between rounded-lg bg-gray-50 dark:bg-gray-800/30 p-4">
            <span className="text-xl font-bold">TOTAL ACTIVOS</span>
            <span className="text-xl font-bold tabular-nums">{formatCurrency(totalActivos)}</span>
          </div>
        </CardContent>
      </Card>

      {/* PASIVOS Y PATRIMONIO */}
      <Card>
        <CardHeader className="bg-destructive text-destructive-foreground">
          <CardTitle className="text-2xl font-bold">PASIVOS Y PATRIMONIO</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          {/* Pasivos Corrientes */}
          <div className="space-y-3">
            <h3 className="text-lg font-bold text-destructive border-b-2 border-destructive pb-1">PASIVOS</h3>
            <h4 className="font-semibold text-foreground">Pasivos Corrientes</h4>
            <div className="space-y-2">
              {datos.pasivos.corrientes.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between border-b border-border py-2 last:border-0"
                >
                  <span className="text-sm text-foreground">{item.cuenta}</span>
                  <span className="font-medium tabular-nums text-foreground">{formatCurrency(item.monto)}</span>
                </div>
              ))}
              <div className="flex items-center justify-between border-t-2 border-border pt-2">
                <span className="font-semibold text-foreground">Total Pasivos Corrientes</span>
                <span className="font-bold tabular-nums text-foreground">{formatCurrency(totalPasivosCorrientes)}</span>
              </div>
            </div>
          </div>

          {/* Pasivos No Corrientes */}
          <div className="space-y-3">
            <h3 className="font-semibold text-foreground">Pasivos No Corrientes</h3>
            <div className="space-y-2">
              {datos.pasivos.noCorrientes.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between border-b border-border py-2 last:border-0"
                >
                  <span className="text-sm text-foreground">{item.cuenta}</span>
                  <span className="font-medium tabular-nums text-foreground">{formatCurrency(item.monto)}</span>
                </div>
              ))}
              <div className="flex items-center justify-between border-t-2 border-border pt-2">
                <span className="font-semibold text-foreground">Total Pasivos No Corrientes</span>
                <span className="font-bold tabular-nums text-foreground">
                  {formatCurrency(totalPasivosNoCorrientes)}
                </span>
              </div>
            </div>
          </div>

          {/* Total Pasivos */}
          <div className="flex items-center justify-between rounded-lg bg-gray-50 dark:bg-gray-800/30 p-4">
            <span className="text-lg font-bold text-foreground">TOTAL PASIVOS</span>
            <span className="text-lg font-bold tabular-nums text-foreground">{formatCurrency(totalPasivos)}</span>
          </div>

          {/* Patrimonio */}
          <div className="space-y-3">
            <h3 className="text-lg font-bold text-destructive border-b-2 border-destructive pb-1">PATRIMONIO</h3>
            <div className="space-y-2">
              {datos.patrimonio.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between border-b border-border py-2 last:border-0"
                >
                  <span className="text-sm text-foreground">{item.cuenta}</span>
                  <span className="font-medium tabular-nums text-foreground">{formatCurrency(item.monto)}</span>
                </div>
              ))}
              <div className="flex items-center justify-between border-t-2 border-border pt-2">
                <span className="font-semibold text-foreground">TOTAL PATRIMONIO</span>
                <span className="font-bold tabular-nums text-foreground">{formatCurrency(totalPatrimonio)}</span>
              </div>
            </div>
          </div>

          {/* Total Pasivos + Patrimonio */}
          <div className="flex items-center justify-between rounded-lg bg-gray-50 dark:bg-gray-800/30 p-4">
            <span className="text-xl font-bold">TOTAL PASIVOS + PATRIMONIO</span>
            <span className="text-xl font-bold tabular-nums">
              {formatCurrency(totalPasivosPatrimonio)}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
