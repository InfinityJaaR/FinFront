import React, { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import useEmpresaActiva from '@/hooks/GestionEmpresas/Empresas/useEmpresaActiva'
import VentasHistoricasService from '@/services/GestionEmpresas/Ventas/VentasHistoricasService'
import EmpresaSelector from '@/components/GestionEmpresas/EmpresaSelector'
import { useModal } from '@/context/ModalContext'
import Button from '@/components/ui/Button'
import { Trash2 } from 'lucide-react'

// Lista de años con resumen
const YearList = () => {
  const navigate = useNavigate()
  const { empresaActiva, isLocked } = useEmpresaActiva()
  const { confirm, alert } = useModal()
  const [ventas, setVentas] = useState([])
  const [yearIndex, setYearIndex] = useState({}) // {year: {count, total}}
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [newYear, setNewYear] = useState('')

  // Cargar TODOS los registros sin filtrar por año; construir índice de años presentes en la base
  useEffect(() => {
    const fetchData = async () => {
      if (!empresaActiva?.id) { setVentas([]); setYearIndex({}); return }
      setLoading(true)
      try {
        const all = await VentasHistoricasService.listar(empresaActiva.id) // sin filtro => todo histórico
        setVentas(all || [])
        const map = {}
        ;(all || []).forEach(v => {
          // Ahora la API entrega {anio, mes, monto}; fallback a fecha sólo si no viene anio
          const y = v.anio != null ? Number(v.anio) : Number((v.fecha || '').slice(0, 4))
          if (!map[y]) map[y] = { count: 0, total: 0 }
          map[y].count += 1
          map[y].total += Number(v.monto || 0)
        })
        setYearIndex(map)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [empresaActiva])

  const years = useMemo(() => Object.keys(yearIndex).map(Number).sort((a, b) => a - b), [yearIndex])
  const filtered = useMemo(() => years.filter(y => query ? String(y).includes(query.trim()) : true), [years, query])

  const handleAddYear = async () => {
    if (!empresaActiva?.id) { await alert({ title: 'Empresa requerida', message: 'Selecciona una empresa primero.' }); return }
    const y = Number(newYear)
    if (!y || y < 1900) return
    // Generar esqueleto vacío y guardar en bulk (monto 0) para permitir edición
    const skeleton = Array.from({ length: 12 }).map((_, i) => ({ anio: y, mes: i + 1, monto: 0 }))
    try {
      await VentasHistoricasService.upsertBulk(empresaActiva.id, skeleton)
      await alert({ title: 'Éxito', message: 'Año inicializado.' })
      // Refetch global para incluir todos los años
      const all = await VentasHistoricasService.listar(empresaActiva.id)
      setVentas(all || [])
      const map = {}
      ;(all || []).forEach(v => {
        const yr = v.anio != null ? Number(v.anio) : Number((v.fecha || '').slice(0, 4))
        if (!map[yr]) map[yr] = { count: 0, total: 0 }
        map[yr].count += 1
        map[yr].total += Number(v.monto || 0)
      })
      setYearIndex(map)
      setNewYear('')
    } catch (err) {
      await alert({ title: 'Error', message: err.response?.data?.message || err.message })
    }
  }

  const handleDeleteYear = async (year) => {
    const ok = await confirm({ title: 'Confirmar', message: `Eliminar todos los meses del año ${year}?` })
    if (!ok) return
    try {
      // Obtener ids del año a borrar y eliminarlos
      const list = ventas.filter(v => (v.anio != null ? Number(v.anio) : Number((v.fecha || '').slice(0, 4))) === year)
      for (const item of list) if (item.id) await VentasHistoricasService.eliminar(empresaActiva.id, item.id)
      // Refetch global para reconstruir índice
      const all = await VentasHistoricasService.listar(empresaActiva.id)
      setVentas(all || [])
      const map = {}
      ;(all || []).forEach(v => {
        const yr = v.anio != null ? Number(v.anio) : Number((v.fecha || '').slice(0, 4))
        if (!map[yr]) map[yr] = { count: 0, total: 0 }
        map[yr].count += 1
        map[yr].total += Number(v.monto || 0)
      })
      setYearIndex(map)
    } catch (err) {
      await alert({ title: 'Error', message: err.response?.data?.message || err.message })
    }
  }

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="relative overflow-x-auto shadow-md sm:rounded-lg bg-white">
        <table className="w-full text-sm text-left text-gray-500">
          <caption className="p-5 text-lg font-semibold text-left text-gray-900 bg-white">
            Ventas Mensuales
            <p className="mt-1 text-sm font-normal text-gray-500 max-w-3xl">Gestiona los registros mensuales de ventas por año. Usa los filtros para seleccionar empresa, buscar un año existente o inicializar uno nuevo para empezar a cargar datos.</p>
            <div className="mt-4 flex flex-wrap gap-3 items-between justify-between">              
              <section className='flex flex-wrap gap-3 items-center'>
                {!isLocked && <EmpresaSelector className="w-64 text-sm" />}
                <div className="flex flex-col items-start">
                  <label htmlFor="busqueda_anio" className="block text-sm font-medium text-gray-700 mb-1">Buscar por año: </label>
                  <input id='busqueda_anio' value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar por año" className="border rounded px-2 py-1 text-sm w-40 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>                
              </section>
              <div className='flex flex-row items-end gap-2'>
                  <div className="flex flex-col items-start">
                    <label htmlFor="nuevo_anio" className="block text-sm font-medium text-gray-700 mb-1">Nuevo año: </label>
                    <input id='nuevo_anio' value={newYear} onChange={e => setNewYear(e.target.value)} placeholder="Nuevo año" className="border rounded px-2 py-1 text-sm w-32 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <Button onClick={handleAddYear} disabled={!empresaActiva?.id || !newYear} variant="primary" size="sm" className={!empresaActiva?.id || !newYear ? "cursor-not-allowed" : "cursor-pointer"}>Añadir Año</Button>
                </div>
            </div>
          </caption>
          <thead className="text-xs uppercase bg-gray-50 text-gray-700">
            <tr>
              <th scope="col" className="px-6 py-3">Año</th>
              <th scope="col" className="px-6 py-3">Meses</th>
              <th scope="col" className="px-6 py-3">Total</th>
              <th scope="col" className="px-6 py-3"><span className="sr-only">Acciones</span></th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={4} className="px-6 py-4">Cargando...</td></tr>
            )}
            {!loading && filtered.map(y => {
              const info = yearIndex[y]
              return (
                <tr key={y} className="bg-white border-b border-gray-200 hover:bg-gray-50 transition-colors">
                  <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">{y}</th>
                  <td className="px-6 py-4">{info.count}/12</td>
                  <td className="px-6 py-4">{Number(info.total).toLocaleString()}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end items-center gap-2">
                      <Button onClick={() => navigate(`/dashboard/gestion-empresas/ventas-mensuales/${y}`)} variant="outline" size="sm" className="cursor-pointer bg-black text-white hover:text-black">Gestionar Año</Button>
                      <Button onClick={() => handleDeleteYear(y)} variant="danger" size="icon" aria-label={`Eliminar ${y}`}>
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              )
            })}
            {!loading && filtered.length === 0 && (
              <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">Sin años</td></tr>
            )}
          </tbody>
        </table>
        {!empresaActiva?.id && <div className="px-6 pb-4 text-sm text-gray-600">Seleccione una empresa para comenzar.</div>}
      </div>
    </div>
  )
}

export default YearList
