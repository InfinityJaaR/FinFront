import React, { useState } from 'react'
import ProyeccionesService from '@/services/GestionEmpresas/Proyecciones/ProyeccionesService'
import { useModal } from '@/context/ModalContext'

const CreateProyeccionForm = ({ empresaId, onCreated }) => {
  const [periodo, setPeriodo] = useState(new Date().getFullYear() + 1)
  const [nombre, setNombre] = useState('')
  const [loading, setLoading] = useState(false)

  const { alert } = useModal()

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!empresaId) {
      await alert({ title: 'Empresa requerida', message: 'Seleccione una empresa antes de crear el registro.' })
      return
    }
    setLoading(true)
    try {
      const body = { periodo_proyectado: Number(periodo), nombre }
      const res = await ProyeccionesService.createProyeccion(empresaId, body)
      await alert({ title: 'Éxito', message: res?.message || 'Registro de proyección creado.' })
      onCreated && onCreated(res?.data ?? res)
    } catch (err) {
      console.error('Error creando proyección', err)
      await alert({ title: 'Error', message: err.response?.data?.message || err.message || 'Error creando registro' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleCreate} className="mb-4 grid grid-cols-3 gap-4">
      <div>
        <label className="block text-sm">Año (registro)</label>
        <input type="number" value={periodo} onChange={(e) => setPeriodo(e.target.value)} className="border rounded px-2 py-1 w-full" />
      </div>
      <div>
        <label className="block text-sm">Nombre (opcional)</label>
        <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} className="border rounded px-2 py-1 w-full" />
      </div>
      <div className="flex items-end">
        <button type="submit" className="bg-green-600 text-white px-3 py-1 rounded" disabled={loading}>{loading ? 'Creando...' : 'Crear registro'}</button>
      </div>
    </form>
  )
}

export default CreateProyeccionForm
