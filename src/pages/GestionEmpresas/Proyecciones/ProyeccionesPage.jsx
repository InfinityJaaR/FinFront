import React, { useEffect, useState, useCallback } from 'react'
import EmpresaSelector from '@/components/GestionEmpresas/EmpresaSelector'
import useEmpresaActiva from '@/hooks/GestionEmpresas/Empresas/useEmpresaActiva'
import ProyeccionesService from '@/services/GestionEmpresas/Proyecciones/ProyeccionesService'
import ProyeccionForm from '@/pages/GestionEmpresas/Proyecciones/ProyeccionForm'
import ProyeccionList from '@/pages/GestionEmpresas/Proyecciones/ProyeccionList'
import ProyeccionDetailsModal from '@/pages/GestionEmpresas/Proyecciones/ProyeccionDetailsModal'
import CreateProyeccionForm from '@/pages/GestionEmpresas/Proyecciones/CreateProyeccionForm'
import GenerateProyeccionModal from '@/pages/GestionEmpresas/Proyecciones/GenerateProyeccionModal'
import { useModal } from '@/context/ModalContext'

const ProyeccionesPage = () => {
  const { empresaActiva, isLocked } = useEmpresaActiva()
  const { alert, confirm } = useModal()
  const [proyecciones, setProyecciones] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [selectedProyeccion, setSelectedProyeccion] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isGenerateOpen, setIsGenerateOpen] = useState(false)
  const [toGenerate, setToGenerate] = useState(null)

  const fetchList = useCallback(async () => {
    if (!empresaActiva?.id) {
      setProyecciones([])
      return
    }
    setLoading(true)
    setError(null)
    try {
      const list = await ProyeccionesService.listarProyecciones(empresaActiva.id)
      setProyecciones(Array.isArray(list) ? list : list?.proyecciones ?? [])
    } catch (err) {
      console.error(err)
      setError(err.response?.data?.message || err.message || 'Error cargando proyecciones')
    } finally {
      setLoading(false)
    }
  }, [empresaActiva])

  useEffect(() => {
    fetchList()
  }, [fetchList])

  const handleGenerate = async (payload) => {
    if (!empresaActiva?.id) {
      await alert({ title: 'Empresa requerida', message: 'Seleccione una empresa primero.' })
      return
    }
    try {
      const res = await ProyeccionesService.generarProyeccion(empresaActiva.id, payload)
      // mostrar resultado y volver a cargar lista
      await alert({ title: 'Éxito', message: res?.message || 'Proyección generada.' })
      fetchList()
    } catch (err) {
      console.error(err)
      await alert({ title: 'Error', message: err.response?.data?.message || err.message || 'Error generando proyección' })
    }
  }

  const handleDelete = async (id) => {
    if (!empresaActiva?.id) return
    const ok = await confirm({ title: 'Confirmar', message: '¿Eliminar esta proyección?' })
    if (!ok) return
    try {
      await ProyeccionesService.eliminarProyeccion(empresaActiva.id, id)
      fetchList()
    } catch (err) {
      console.error(err)
      await alert({ title: 'Error', message: err.response?.data?.message || err.message || 'Error eliminando proyección' })
    }
  }

  const handleView = async (id) => {
    if (!empresaActiva?.id) return
    setSelectedProyeccion(null)
    setIsModalOpen(true)
    try {
      const data = await ProyeccionesService.verProyeccion(empresaActiva.id, id)
      setSelectedProyeccion(data)
    } catch (err) {
      console.error('Error cargando detalle', err)
      setSelectedProyeccion({ error: err.response?.data?.message || err.message })
    }
  }

  const handleOpenGenerate = (proyeccion) => {
    setToGenerate(proyeccion)
    setIsGenerateOpen(true)
  }

  const handleGenerateClose = (didGenerate) => {
    setIsGenerateOpen(false)
    setToGenerate(null)
    if (didGenerate) fetchList()
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">Proyecciones de Ventas</h2>

      <div className="mb-4">
        <EmpresaSelector />
      </div>

      <div className="mb-6">
        <CreateProyeccionForm empresaId={empresaActiva?.id} onCreated={() => fetchList()} />
        <ProyeccionForm onGenerate={handleGenerate} disabled={!empresaActiva?.id} isLocked={isLocked} />
      </div>

      <div>
        <h3 className="text-lg font-medium mb-2">Proyecciones existentes</h3>
        {loading ? (
          <div>Cargando proyecciones...</div>
        ) : error ? (
          <div className="text-red-600">{error}</div>
        ) : (
          <ProyeccionList proyecciones={proyecciones} onDelete={handleDelete} onView={handleView} onGenerate={handleOpenGenerate} />
        )}
      </div>
      
      <ProyeccionDetailsModal open={isModalOpen} onClose={() => setIsModalOpen(false)} data={selectedProyeccion} />
      <GenerateProyeccionModal open={isGenerateOpen} onClose={handleGenerateClose} empresaId={empresaActiva?.id} proyeccion={toGenerate} />
    </div>
  )
}

export default ProyeccionesPage
