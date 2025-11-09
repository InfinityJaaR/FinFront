import React, { useState } from 'react'
import ProyeccionesService from '@/services/GestionEmpresas/Proyecciones/ProyeccionesService'
import { useModal } from '@/context/ModalContext'

const METODOS = [
  { value: 'minimos_cuadrados', label: 'Mínimos cuadrados' },
  { value: 'incremento_porcentual', label: 'Incremento porcentual' },
  { value: 'incremento_absoluto', label: 'Incremento absoluto' },
]

const GenerateProyeccionModal = ({ open, onClose, empresaId, proyeccion }) => {
  const [metodo, setMetodo] = useState(METODOS[0].value)
  const [loading, setLoading] = useState(false)
  const { alert } = useModal()

  if (!open) return null

  const handleGenerate = async () => {
    if (!empresaId || !proyeccion) {
      await alert({ title: 'Datos incompletos', message: 'Falta empresa o proyección.' })
      return
    }
    setLoading(true)
    try {
      // Preferir endpoint por proyeccion si existe
      const body = { metodo_usado: metodo, periodo_proyectado: proyeccion.periodo_proyectado || proyeccion.periodo }
      const res = await ProyeccionesService.generateForProyeccion(empresaId, proyeccion.id, body)
      await alert({ title: 'Éxito', message: res?.message || 'Proyección generada.' })
      onClose(true)
    } catch (err) {
      console.error('Error generando proyección', err)
      await alert({ title: 'Error', message: err.response?.data?.message || err.message || 'Error generando' })
      onClose(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-lg w-96 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">Generar proyección</h3>
          <button onClick={() => onClose(false)} className="text-gray-600">Cerrar</button>
        </div>

        <div className="space-y-2">
          <div>
            <label className="block text-sm">Proyección</label>
            <div className="p-2 border rounded">{proyeccion.nombre || `ID ${proyeccion.id}`} - {proyeccion.periodo_proyectado || proyeccion.periodo}</div>
          </div>

          <div>
            <label className="block text-sm">Método</label>
            <select value={metodo} onChange={(e) => setMetodo(e.target.value)} className="border rounded px-2 py-1 w-full">
              {METODOS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>

          <div className="flex justify-end">
            <button onClick={handleGenerate} className="bg-blue-600 text-white px-3 py-1 rounded" disabled={loading}>{loading ? 'Generando...' : 'Generar'}</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default GenerateProyeccionModal
