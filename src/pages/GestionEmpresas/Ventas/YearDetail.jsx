import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import useEmpresaActiva from '@/hooks/GestionEmpresas/Empresas/useEmpresaActiva'
import VentasHistoricasService from '@/services/GestionEmpresas/Ventas/VentasHistoricasService'
import ProyeccionesService from '@/services/GestionEmpresas/Proyecciones/ProyeccionesService'
import { useModal } from '@/context/ModalContext'
// Componentes antiguos de proyecciones integrados aquí (lista y detalle)
// import ProyeccionList from '@/pages/GestionEmpresas/Proyecciones/ProyeccionList'
// import ProyeccionDetailsModal from '@/pages/GestionEmpresas/Proyecciones/ProyeccionDetailsModal'

const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
const STALE_KEY = (empresaId, year) => `ventas_stale_${empresaId}_${year}`

const SimpleLine = ({ series, width=800, height=220, colors=['#2563eb','#059669','#ef4444'] }) => {
  // series: [{ name, data: number[12] }]
  const all = series.flatMap(s => s.data)
  const min = Math.min(...all, 0)
  const max = Math.max(...all, 1)
  const pad = 20
  const xStep = (width - pad*2) / (MESES.length - 1)
  const scaleY = (v) => height - pad - ((v - min) / Math.max(max-min,1)) * (height - pad*2)
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-56">
      {/* grid */}
      {Array.from({length:5}).map((_,i)=>{
        const y = pad + (i*(height-pad*2)/4)
        return <line key={i} x1={pad} y1={y} x2={width-pad} y2={y} stroke="#e5e7eb" strokeDasharray="2 4" />
      })}
      {/* axes */}
      <line x1={pad} y1={pad} x2={pad} y2={height-pad} stroke="#9ca3af" />
      <line x1={pad} y1={height-pad} x2={width-pad} y2={height-pad} stroke="#9ca3af" />
      {/* labels */}
      {MESES.map((m,i)=>(<text key={m} x={pad + i*xStep} y={height-4} fontSize="10" textAnchor="middle" fill="#6b7280">{m}</text>))}
      {/* lines */}
      {series.map((s,idx)=>{
        const d = s.data.map((v,i)=>`${i===0?'M':'L'} ${pad + i*xStep} ${scaleY(v)}`).join(' ')
        return <path key={s.name} d={d} fill="none" stroke={colors[idx%colors.length]} strokeWidth="2" />
      })}
    </svg>
  )
}

const YearDetail = () => {
  const { year: yearParam } = useParams()
  const year = Number(yearParam)
  const navigate = useNavigate()
  const { empresaActiva } = useEmpresaActiva()
  const { alert, confirm } = useModal()

  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState('meses') // 'meses' | 'proy'
  const [proyecciones, setProyecciones] = useState([])
  const [loadingProy, setLoadingProy] = useState(false)

  const complete = rows.length === 12
  const total = rows.reduce((a,x)=> a + Number(x.monto||0), 0)
  // Recalcular año mostrado si los datos vienen con anio distinto a yearParam (seguridad)
  const displayYear = Number.isFinite(year) && year > 0 ? year : (rows[0]?.anio || new Date().getFullYear())

  const loadRows = async () => {
    if (!empresaActiva?.id) { setRows([]); return }
    setLoading(true)
    try {
      const data = await VentasHistoricasService.listar(empresaActiva.id, { year })
      const byKey = new Map((data||[]).map(v=>[`${v.anio}-${v.mes}`, v]))
      const full = MESES.map((m,i)=>{
        const key = `${year}-${i+1}`
        if (byKey.has(key)) return byKey.get(key)
        return { anio: year, mes: i+1, monto: '' }
      })
      setRows(full)
    } finally {
      setLoading(false)
    }
  }

  const loadProys = async () => {
    if (!empresaActiva?.id) { setProyecciones([]); return }
    setLoadingProy(true)
    try {
      const list = await ProyeccionesService.listarProyecciones(empresaActiva.id)
      const baseYear = Number.isFinite(year) && year > 0 ? year : (rows[0]?.anio || new Date().getFullYear())
      const arr = Array.isArray(list) ? list : (list?.proyecciones || [])
      const proys = arr.filter(p => Number(p.periodo_proyectado || p.periodo) === baseYear + 1)
      setProyecciones(proys)
    } finally { setLoadingProy(false) }
  }

  useEffect(() => { loadRows() }, [empresaActiva, year])
  useEffect(() => { if (tab === 'proy') loadProys() }, [tab])

  const markStale = () => {
    try { localStorage.setItem(STALE_KEY(empresaActiva.id, year), '1') } catch {}
  }
  const clearStale = () => { try { localStorage.removeItem(STALE_KEY(empresaActiva.id, year)) } catch {} }
  const isStale = () => { try { return !!localStorage.getItem(STALE_KEY(empresaActiva.id, year)) } catch { return false } }

  const handleChange = (mes, val) => {
    setRows(rs => rs.map(r => r.mes === mes ? { ...r, monto: val } : r))
  }

  const saveAll = async () => {
    const ventas = rows.filter(r=> r.monto!=='' && r.monto!=null).map(r=> ({ anio: r.anio, mes: r.mes, monto: Number(r.monto) }))
    try {
      await VentasHistoricasService.upsertBulk(empresaActiva.id, ventas)
      await alert({ title: 'Éxito', message: 'Montos guardados.' })
      await loadRows()
      markStale()
    } catch (err) {
      await alert({ title: 'Error', message: err.response?.data?.message || err.message })
    }
  }

  const deleteMonth = async (row, label) => {
    if (!row.id) { handleChange(row.mes, ''); return }
    const ok = await confirm({ title: 'Confirmar', message: `Eliminar ${label} ${year}?` })
    if (!ok) return
    await VentasHistoricasService.eliminar(empresaActiva.id, row.id)
    await loadRows()
    markStale()
  }

  const deleteYear = async () => {
    const ok = await confirm({ title: 'Confirmar', message: `Eliminar todos los meses de ${year}?` })
    if (!ok) return
    const data = await VentasHistoricasService.listar(empresaActiva.id, { year })
    for (const it of data) if (it.id) await VentasHistoricasService.eliminar(empresaActiva.id, it.id)
    await loadRows()
    markStale()
  }

  const generate = async (metodo) => {
    if (!complete) { await alert({ title: 'Datos incompletos', message: 'Se requieren 12/12 meses.' }); return }
    try {
      await ProyeccionesService.generarProyeccion(empresaActiva.id, { metodo_usado: metodo, periodo_proyectado: displayYear + 1 })
      clearStale()
      await alert({ title: 'Éxito', message: 'Proyección generada.' })
      await loadProys()
    } catch (err) {
      await alert({ title: 'Error', message: err.response?.data?.message || err.message })
    }
  }

  const [details, setDetails] = useState({}) // {proyId: detalles[]}
  const [loadingDetails, setLoadingDetails] = useState(false)
  const loadDetails = async () => {
    setLoadingDetails(true)
    try {
      const map = {}
      for (const p of proyecciones) {
        const d = await ProyeccionesService.verProyeccion(empresaActiva.id, p.id)
        const det = Array.isArray(d?.detalles) ? d.detalles : (d?.data?.detalles || [])
        map[p.id] = det
      }
      setDetails(map)
    } finally { setLoadingDetails(false) }
  }

  const series = useMemo(() => {
    const s = []
    for (const p of proyecciones) {
      const det = details[p.id]
      if (!det) continue
      const data = det.map(x => Number(x.monto_proyectado || x.monto || 0))
      s.push({ name: p.metodo_usado || p.metodo, data })
    }
    return s
  }, [proyecciones, details])

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <button onClick={()=>navigate('/dashboard/gestion-empresas/ventas-mensuales')} className="px-3 py-1.5 rounded border">⟵ Volver</button>
          <h2 className="text-xl font-semibold">Ventas ▸ {displayYear}</h2>
          <span className={`text-xs px-2 py-1 rounded-full ${complete? 'bg-green-100 text-green-700':'bg-amber-100 text-amber-700'}`}>{complete? 'Completo 12/12' : `Incompleto ${rows.filter(r=>r.monto!=='' && r.monto!=null).length}/12`}</span>
          <span className="text-xs text-gray-500">Total: {total.toLocaleString()}</span>
          {isStale() && <span className="text-xs text-amber-700 bg-amber-100 px-2 py-0.5 rounded">Desactualizada</span>}
        </div>
        <div className="inline-flex rounded-2xl border overflow-hidden">
          <button className={`px-4 py-2 text-sm ${tab==='meses'?'bg-gray-900 text-white':'bg-white'}`} onClick={()=>setTab('meses')}>Meses</button>
          <button className={`px-4 py-2 text-sm ${tab==='proy'?'bg-gray-900 text-white':'bg-white'}`} onClick={()=>setTab('proy')}>Proyecciones</button>
        </div>
      </div>

      {tab==='meses' && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <button onClick={saveAll} className="px-3 py-1.5 rounded bg-green-600 text-white">Guardar cambios</button>
            <button onClick={deleteYear} className="px-3 py-1.5 rounded border bg-red-600 text-white">Eliminar año</button>
          </div>
          {loading ? <div>Cargando...</div> : (
            <div className="border rounded p-4 overflow-auto">
              <table className="min-w-full text-sm">
                <thead><tr className="text-left text-gray-500"><th className="py-2 pr-4">Mes</th><th className="py-2 pr-4">Año</th><th className="py-2 pr-4">Monto</th><th className="py-2 pr-4">Acciones</th></tr></thead>
                <tbody>
                  {MESES.map((m,i)=>{
                    const mes = i+1
                    const r = rows.find(x=>x.mes===mes) || { anio: year, mes, monto:'' }
                    return (
                      <tr key={mes} className="border-t">
                        <td className="py-2 pr-4">{m}</td>
                        <td className="py-2 pr-4 text-xs text-gray-500">{r.anio}</td>
                        <td className="py-2 pr-4">
                          <input type="number" step="0.01" value={r.monto} onChange={e=>handleChange(mes, e.target.value)} className="border rounded px-2 py-1 w-32" placeholder="0.00" />
                        </td>
                        <td className="py-2 pr-4">
                          {(r.id || r.monto) && (
                            <button onClick={()=>deleteMonth(r, m)} className="text-red-600 text-xs hover:underline">{r.id? 'Eliminar':'Limpiar'}</button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab==='proy' && (
        <div className="space-y-4">
          <div className="border rounded p-4">
            <h3 className="font-medium">Proyecciones basadas en {displayYear} → {displayYear+1}</h3>
            <p className="text-xs text-gray-500">Upsert: si existe, se reemplaza.</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {[{k:'minimos_cuadrados',l:'Mínimos Cuadrados'},{k:'incremento_porcentual',l:'Inc. Porcentual'},{k:'incremento_absoluto',l:'Inc. Absoluto'}].map(m => (
                <button key={m.k} disabled={!complete} onClick={()=>generate(m.k)} className={`px-4 py-2 rounded text-sm border ${complete? 'bg-gray-900 text-white':'bg-gray-100 text-gray-400 cursor-not-allowed'}`}>{m.l}</button>
              ))}
            </div>
          </div>

          <div className="border rounded p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium">Proyecciones {displayYear+1}</h3>
              <button onClick={loadProys} className="px-3 py-1.5 rounded border">Recargar</button>
            </div>
            {loadingProy? <div>Cargando...</div> : (
              proyecciones.length === 0 ? <div className="text-sm text-gray-500">Sin proyecciones.</div> : (
                <ul className="text-sm space-y-2">
                  {proyecciones.map(p => (
                    <li key={p.id} className="flex items-center justify-between border rounded p-2">
                      <span>{p.metodo_usado} - {p.periodo_proyectado || p.periodo}</span>
                      <button onClick={async()=>{ await ProyeccionesService.eliminarProyeccion(empresaActiva.id, p.id); await loadProys() }} className="text-red-600 hover:underline">Borrar</button>
                    </li>
                  ))}
                </ul>
              )
            )}
          </div>

          <div className="border rounded p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium">Comparador ({displayYear+1})</h3>
              <button onClick={loadDetails} className="px-3 py-1.5 rounded border">Cargar series</button>
            </div>
            {loadingDetails ? <div>Cargando...</div> : (
              series.length === 0 ? <div className="text-sm text-gray-500">Sin series.</div> : <SimpleLine series={series} />
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default YearDetail
