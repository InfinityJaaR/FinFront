import React, { useState } from 'react'

const METODOS = [
  { value: 'minimos_cuadrados', label: 'Mínimos cuadrados' },
  { value: 'incremento_porcentual', label: 'Incremento porcentual' },
  { value: 'incremento_absoluto', label: 'Incremento absoluto' },
]

const ProyeccionForm = ({ onGenerate, disabled = false, isLocked = false }) => {
  const [metodo, setMetodo] = useState(METODOS[0].value)
  const [periodo, setPeriodo] = useState(new Date().getFullYear() + 1)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (disabled) return
    setLoading(true)
    try {
      await onGenerate({ metodo_usado: metodo, periodo_proyectado: Number(periodo) })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-sm">Método</label>
          <select value={metodo} onChange={(e) => setMetodo(e.target.value)} disabled={disabled || loading} className="border rounded px-2 py-1 w-full">
            {METODOS.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm">Año proyectado</label>
          <input type="number" value={periodo} onChange={(e) => setPeriodo(e.target.value)} disabled={disabled || loading} className="border rounded px-2 py-1 w-full" />
        </div>
      </div>

      <div>
        <button type="submit" className="bg-blue-600 text-white px-3 py-1 rounded" disabled={disabled || loading}>
          {loading ? 'Generando...' : isLocked ? 'Generar (Empresa fija)' : 'Generar'}
        </button>
      </div>
    </form>
  )
}

export default ProyeccionForm
