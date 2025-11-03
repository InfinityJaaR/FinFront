import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/format-utils"

// Datos de ejemplo - reemplazar con datos reales de tu API/base de datos
const obtenerDatosResultados = (empresaId, año) => {
  return {
    ingresos: [
      { cuenta: "Ventas de Productos", monto: 850000 },
      { cuenta: "Ventas de Servicios", monto: 320000 },
      { cuenta: "Otros Ingresos Operacionales", monto: 45000 },
    ],
    costosVentas: [
      { cuenta: "Costo de Productos Vendidos", monto: 420000 },
      { cuenta: "Costo de Servicios Prestados", monto: 150000 },
    ],
    gastosOperacionales: [
      { cuenta: "Gastos de Administración", monto: 180000 },
      { cuenta: "Gastos de Ventas", monto: 125000 },
      { cuenta: "Depreciación y Amortización", monto: 35000 },
    ],
    otrosIngresos: [
      { cuenta: "Ingresos Financieros", monto: 12000 },
      { cuenta: "Otros Ingresos No Operacionales", monto: 8000 },
    ],
    otrosGastos: [
      { cuenta: "Gastos Financieros", monto: 28000 },
      { cuenta: "Otros Gastos No Operacionales", monto: 5000 },
    ],
    impuestos: [{ cuenta: "Impuesto a la Renta", monto: 58200 }],
  }
}

const calcularTotal = (items) => {
  return items.reduce((sum, item) => sum + item.monto, 0)
}

export default function EstadoResultados({ empresaId, año }) {
  const datos = obtenerDatosResultados(empresaId, año)

  const totalIngresos = calcularTotal(datos.ingresos)
  const totalCostosVentas = calcularTotal(datos.costosVentas)
  const utilidadBruta = totalIngresos - totalCostosVentas

  const totalGastosOperacionales = calcularTotal(datos.gastosOperacionales)
  const utilidadOperacional = utilidadBruta - totalGastosOperacionales

  const totalOtrosIngresos = calcularTotal(datos.otrosIngresos)
  const totalOtrosGastos = calcularTotal(datos.otrosGastos)
  const utilidadAntesImpuestos = utilidadOperacional + totalOtrosIngresos - totalOtrosGastos

  const totalImpuestos = calcularTotal(datos.impuestos)
  const utilidadNeta = utilidadAntesImpuestos - totalImpuestos

  return (
    <Card>
      <CardHeader className="bg-primary text-primary-foreground">
        <CardTitle className="text-2xl font-bold">Estado de Resultados</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        {/* Ingresos */}
        <div className="space-y-3">
          <h3 className="font-semibold text-foreground">Ingresos Operacionales</h3>
          <div className="space-y-2">
            {datos.ingresos.map((item, index) => (
              <div key={index} className="flex items-center justify-between border-b border-border py-2 last:border-0">
                <span className="text-sm text-foreground">{item.cuenta}</span>
                <span className={`font-medium tabular-nums ${item.monto < 0 ? 'text-destructive' : 'text-foreground'}`}>
                  {item.monto < 0 ? `(${formatCurrency(Math.abs(item.monto))})` : formatCurrency(item.monto)}
                </span>
              </div>
            ))}
            <div className="flex items-center justify-between border-t-2 border-border pt-2">
              <span className="font-semibold text-foreground">Total Ingresos</span>
              <span className={`font-bold tabular-nums ${totalIngresos < 0 ? 'text-destructive' : 'text-foreground'}`}>
                {totalIngresos < 0 ? `(${formatCurrency(Math.abs(totalIngresos))})` : formatCurrency(totalIngresos)}
              </span>
            </div>
          </div>
        </div>

        {/* Costos de Ventas */}
        <div className="space-y-3">
          <h3 className="font-semibold text-foreground">Costos de Ventas</h3>
          <div className="space-y-2">
            {datos.costosVentas.map((item, index) => (
              <div key={index} className="flex items-center justify-between border-b border-border py-2 last:border-0">
                <span className="text-sm text-foreground">{item.cuenta}</span>
                <span className="font-medium tabular-nums text-destructive">({formatCurrency(item.monto)})</span>
              </div>
            ))}
            <div className="flex items-center justify-between border-t-2 border-border pt-2">
              <span className="font-semibold text-foreground">Total Costos de Ventas</span>
              <span className="font-bold tabular-nums text-destructive">({formatCurrency(totalCostosVentas)})</span>
            </div>
          </div>
        </div>

        {/* Utilidad Bruta */}
        <div className="flex items-center justify-between rounded-lg bg-gray-50 dark:bg-gray-800/30 p-4">
          <span className="text-lg font-bold text-foreground">UTILIDAD BRUTA</span>
          <span className={`text-lg font-bold tabular-nums ${utilidadBruta < 0 ? 'text-destructive' : 'text-foreground'}`}>
            {utilidadBruta < 0 ? `(${formatCurrency(Math.abs(utilidadBruta))})` : formatCurrency(utilidadBruta)}
          </span>
        </div>

        {/* Gastos Operacionales */}
        <div className="space-y-3">
          <h3 className="font-semibold text-foreground">Gastos Operacionales</h3>
          <div className="space-y-2">
            {datos.gastosOperacionales.map((item, index) => (
              <div key={index} className="flex items-center justify-between border-b border-border py-2 last:border-0">
                <span className="text-sm text-foreground">{item.cuenta}</span>
                <span className="font-medium tabular-nums text-destructive">({formatCurrency(item.monto)})</span>
              </div>
            ))}
            <div className="flex items-center justify-between border-t-2 border-border pt-2">
              <span className="font-semibold text-foreground">Total Gastos Operacionales</span>
              <span className="font-bold tabular-nums text-destructive">
                ({formatCurrency(totalGastosOperacionales)})
              </span>
            </div>
          </div>
        </div>

        {/* Utilidad Operacional */}
        <div className="flex items-center justify-between rounded-lg bg-gray-50 dark:bg-gray-800/30 p-4">
          <span className="text-lg font-bold text-foreground">UTILIDAD OPERACIONAL</span>
          <span className={`text-lg font-bold tabular-nums ${utilidadOperacional < 0 ? 'text-destructive' : 'text-foreground'}`}>
            {utilidadOperacional < 0 ? `(${formatCurrency(Math.abs(utilidadOperacional))})` : formatCurrency(utilidadOperacional)}
          </span>
        </div>

        {/* Otros Ingresos */}
        <div className="space-y-3">
          <h3 className="font-semibold text-foreground">Otros Ingresos</h3>
          <div className="space-y-2">
            {datos.otrosIngresos.map((item, index) => (
              <div key={index} className="flex items-center justify-between border-b border-border py-2 last:border-0">
                <span className="text-sm text-foreground">{item.cuenta}</span>
                <span className={`font-medium tabular-nums ${item.monto < 0 ? 'text-destructive' : 'text-foreground'}`}>
                  {item.monto < 0 ? `(${formatCurrency(Math.abs(item.monto))})` : formatCurrency(item.monto)}
                </span>
              </div>
            ))}
            <div className="flex items-center justify-between border-t-2 border-border pt-2">
              <span className="font-semibold text-foreground">Total Otros Ingresos</span>
              <span className={`font-bold tabular-nums ${totalOtrosIngresos < 0 ? 'text-destructive' : 'text-foreground'}`}>
                {totalOtrosIngresos < 0 ? `(${formatCurrency(Math.abs(totalOtrosIngresos))})` : formatCurrency(totalOtrosIngresos)}
              </span>
            </div>
          </div>
        </div>

        {/* Otros Gastos */}
        <div className="space-y-3">
          <h3 className="font-semibold text-foreground">Otros Gastos</h3>
          <div className="space-y-2">
            {datos.otrosGastos.map((item, index) => (
              <div key={index} className="flex items-center justify-between border-b border-border py-2 last:border-0">
                <span className="text-sm text-foreground">{item.cuenta}</span>
                <span className="font-medium tabular-nums text-destructive">({formatCurrency(item.monto)})</span>
              </div>
            ))}
            <div className="flex items-center justify-between border-t-2 border-border pt-2">
              <span className="font-semibold text-foreground">Total Otros Gastos</span>
              <span className="font-bold tabular-nums text-destructive">({formatCurrency(totalOtrosGastos)})</span>
            </div>
          </div>
        </div>

        {/* Utilidad Antes de Impuestos */}
        <div className="flex items-center justify-between rounded-lg bg-gray-50 dark:bg-gray-800/30 p-4">
          <span className="text-lg font-bold text-foreground">UTILIDAD ANTES DE IMPUESTOS</span>
          <span className={`text-lg font-bold tabular-nums ${utilidadAntesImpuestos < 0 ? 'text-destructive' : 'text-foreground'}`}>
            {utilidadAntesImpuestos < 0 ? `(${formatCurrency(Math.abs(utilidadAntesImpuestos))})` : formatCurrency(utilidadAntesImpuestos)}
          </span>
        </div>

        {/* Impuestos */}
        <div className="space-y-3">
          <h3 className="font-semibold text-foreground">Impuestos</h3>
          <div className="space-y-2">
            {datos.impuestos.map((item, index) => (
              <div key={index} className="flex items-center justify-between border-b border-border py-2 last:border-0">
                <span className="text-sm text-foreground">{item.cuenta}</span>
                <span className="font-medium tabular-nums text-destructive">({formatCurrency(item.monto)})</span>
              </div>
            ))}
          </div>
        </div>

        {/* Utilidad Neta */}
        <div className="flex items-center justify-between rounded-lg bg-gray-50 dark:bg-gray-800/30 p-4">
          <span className="text-xl font-bold text-foreground">UTILIDAD NETA</span>
          <span className={`text-xl font-bold tabular-nums ${utilidadNeta < 0 ? 'text-destructive' : 'text-foreground'}`}>
            {utilidadNeta < 0 ? `(${formatCurrency(Math.abs(utilidadNeta))})` : formatCurrency(utilidadNeta)}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
