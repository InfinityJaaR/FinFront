import React, { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import useEmpresaActiva from '@/hooks/GestionEmpresas/Empresas/useEmpresaActiva'
import VentasHistoricasService from '@/services/GestionEmpresas/Ventas/VentasHistoricasService'
import EmpresaSelector from '@/components/GestionEmpresas/EmpresaSelector'
import { useModal } from '@/context/ModalContext'

// Lista de años con resumen
const YearList = () => {
  const navigate = useNavigate()
  const { empresaActiva, isLocked } = useEmpresaActiva()
  const { confirm, alert } = useModal()
  const [ventas, setVentas] = useState([])
  const [yearIndex, setYearIndex] = useState({}) // {year: {count, total}}
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)

  // Cargar años disponibles (iterando años cercanos o usar lo existente) - simplificado: pedir varios años recientes
  useEffect(() => {
    const fetchData = async () => {
      if (!empresaActiva?.id) { setVentas([]); setYearIndex({}); return }
      setLoading(true)
      try {
        // Intentar cargar últimos 3 años y el actual + siguiente si existen datos
        const currentYear = new Date().getFullYear()
        const yearsToTry = [currentYear - 2, currentYear - 1, currentYear, currentYear + 1]
        const all = []
        for (const y of yearsToTry) {
          try {
            const data = await VentasHistoricasService.listar(empresaActiva.id, { year: y })
            if (Array.isArray(data) && data.length) {
              data.forEach(d => all.push(d))
            }
          } catch (e) {
            // ignorar errores por año sin datos
          }
        }
        setVentas(all)
        const map = {}
        all.forEach(v => {
          // Ahora la API entrega {anio, mes, monto}; fallback a fecha sólo si no viene anio
          const y = v.anio != null ? Number(v.anio) : Number((v.fecha || '').slice(0,4))
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

  const years = useMemo(() => Object.keys(yearIndex).map(Number).sort((a,b)=>a-b), [yearIndex])
  const filtered = useMemo(() => years.filter(y => query? String(y).includes(query.trim()): true), [years, query])

  const handleAddYear = async () => {
    if (!empresaActiva?.id) { await alert({ title: 'Empresa requerida', message: 'Selecciona una empresa primero.' }); return }
    const yStr = prompt('Nuevo año','2025')
    if (!yStr) return
    const y = Number(yStr)
    if (!y || y < 1900) return
    // Generar esqueleto vacío y guardar en bulk (monto 0) para permitir edición
    const skeleton = Array.from({ length: 12 }).map((_,i) => ({ anio: y, mes: i+1, monto: 0 }))
    try {
      await VentasHistoricasService.upsertBulk(empresaActiva.id, skeleton)
      await alert({ title: 'Éxito', message: 'Año inicializado.' })
      // Forzar refetch
      const data = await VentasHistoricasService.listar(empresaActiva.id, { year: y })
      setVentas(prev => prev.concat(data))
      const count = data.length
      const total = data.reduce((a,x)=> a + Number(x.monto||0), 0)
      setYearIndex(prev => ({ ...prev, [y]: { count, total } }))
    } catch (err) {
      await alert({ title: 'Error', message: err.response?.data?.message || err.message })
    }
  }

  const handleDeleteYear = async (year) => {
    const ok = await confirm({ title: 'Confirmar', message: `Eliminar todos los meses del año ${year}?` })
    if (!ok) return
    try {
      // Necesitamos obtener ids de cada venta para borrarlas individualmente
  const list = ventas.filter(v => (v.anio != null ? Number(v.anio) : Number((v.fecha || '').slice(0,4))) === year)
      for (const item of list) {
        await VentasHistoricasService.eliminar(empresaActiva.id, item.id)
      }
  setVentas(prev => prev.filter(v => (v.anio != null ? Number(v.anio) : Number((v.fecha || '').slice(0,4))) !== year))
      setYearIndex(prev => { const p = { ...prev }; delete p[year]; return p })
    } catch (err) {
      await alert({ title: 'Error', message: err.response?.data?.message || err.message })
    }
  }

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold">Ventas Mensuales</h2>
          <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar año" className="border rounded px-3 py-1 text-sm w-40" />
        </div>
        <div className="flex items-center gap-3">
          {!isLocked && <EmpresaSelector className="w-64" />}
          <button onClick={handleAddYear} disabled={!empresaActiva?.id} className="px-4 py-2 rounded bg-gray-900 text-white text-sm disabled:opacity-50">+ Año</button>
        </div>
      </div>
      {loading ? <div>Cargando...</div> : (
        <div className="border rounded p-4">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500">
                <th className="py-2 pr-4">Año</th>
                <th className="py-2 pr-4">Meses</th>
                <th className="py-2 pr-4">Total</th>
                <th className="py-2 pr-4">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(y => {
                const info = yearIndex[y]
                return (
                  <tr key={y} className="border-t">
                    <td className="py-2 pr-4 font-semibold">{y}</td>
                    <td className="py-2 pr-4">{info.count}/12</td>
                    <td className="py-2 pr-4">{Number(info.total).toLocaleString()}</td>
                    <td className="py-2 pr-4">
                      <div className="flex items-center gap-2">
                        <button onClick={()=>navigate(`/dashboard/gestion-empresas/ventas-mensuales/${y}`)} className="px-3 py-1.5 rounded border">Abrir</button>
                        <button onClick={()=>handleDeleteYear(y)} className="px-3 py-1.5 rounded border bg-red-600 text-white">🗑️</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {filtered.length === 0 && <tr><td colSpan={4} className="py-4 text-center text-gray-500">Sin años</td></tr>}
            </tbody>
          </table>
        </div>
      )}
      {!empresaActiva?.id && <div className="mt-4 text-sm text-gray-600">Seleccione una empresa para comenzar.</div>}
    </div>
  )
}

export default YearList
