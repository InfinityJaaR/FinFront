import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import useEmpresaActiva from '@/hooks/GestionEmpresas/Empresas/useEmpresaActiva'
import VentasHistoricasService from '@/services/GestionEmpresas/Ventas/VentasHistoricasService'
import ProyeccionesService from '@/services/GestionEmpresas/Proyecciones/ProyeccionesService'
import { useModal } from '@/context/ModalContext'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import Button from '@/components/ui/Button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Pencil, Trash2, Eye, Download } from 'lucide-react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
// Componentes antiguos de proyecciones integrados aquí (lista y detalle)
// import ProyeccionList from '@/pages/GestionEmpresas/Proyecciones/ProyeccionList'
// import ProyeccionDetailsModal from '@/pages/GestionEmpresas/Proyecciones/ProyeccionDetailsModal'

const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
const STALE_KEY = (empresaId, year) => `ventas_stale_${empresaId}_${year}`
const METHOD_LABELS = {
  minimos_cuadrados: 'Mínimos Cuadrados',
  incremento_porcentual: 'Incremento Porcentual',
  incremento_absoluto: 'Incremento Absoluto',
}
const methodLabel = (m) => METHOD_LABELS[m] || m

const SimpleLine = ({ series, width=800, height=220, colors=['#2563eb','#059669','#ef4444'] }) => {
  // series: [{ name, data: number[12] }]
  const [hover, setHover] = React.useState(null) // { i, x, y }
  const all = series.flatMap(s => s.data)
  const min = Math.min(...all, 0)
  const max = Math.max(...all, 1)
  const pad = 20
  const xStep = (width - pad*2) / (MESES.length - 1)
  const scaleY = (v) => height - pad - ((v - min) / Math.max(max-min,1)) * (height - pad*2)
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-56" onMouseLeave={()=>setHover(null)}>
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
      {/* hover capture + tooltip */}
      {MESES.map((_,i)=>{
        const x = pad + i*xStep
        const onEnter = ()=>{
          const tooltipX = x
          const tooltipY = pad + 10
          setHover({ i, x: tooltipX, y: tooltipY })
        }
        return (
          <rect key={i} x={x - xStep/2} y={pad} width={xStep} height={height - pad*2} fill="transparent" onMouseEnter={onEnter} />
        )
      })}
      {hover && (
        <g>
          <line x1={hover.x} y1={pad} x2={hover.x} y2={height-pad} stroke="#9ca3af" strokeDasharray="4 2" />
          <rect x={Math.min(Math.max(hover.x+8, pad), width-180)} y={hover.y} width={170} height={20 + series.length*16} rx={6} ry={6} fill="#111827" opacity="0.9" />
          <text x={Math.min(Math.max(hover.x+16, pad+8), width-172)} y={hover.y+14} fill="#fff" fontSize="12" fontWeight="bold">{MESES[hover.i]}</text>
          {series.map((s,idx)=>{
            const v = s.data[hover.i] ?? 0
            return <text key={s.name} x={Math.min(Math.max(hover.x+16, pad+8), width-172)} y={hover.y+14+(idx+1)*16} fill="#e5e7eb" fontSize="11">{`${s.name}: $${Number(v).toLocaleString()}`}</text>
          })}
        </g>
      )}
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
  const [toast, setToast] = useState(null) // { type: 'success'|'error', message, ts }

  // Auto-cerrar toast después de unos segundos
  useEffect(() => {
    if (!toast) return
    const timeout = setTimeout(() => setToast(null), toast.type === 'success' ? 2500 : 4000)
    return () => clearTimeout(timeout)
  }, [toast])

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
    try { localStorage.setItem(STALE_KEY(empresaActiva.id, year), '1') } catch (e) { console.debug('localStorage.setItem failed', e) }
  }
  const clearStale = () => { try { localStorage.removeItem(STALE_KEY(empresaActiva.id, year)) } catch (e) { console.debug('localStorage.removeItem failed', e) } }
  const isStale = () => { try { return !!localStorage.getItem(STALE_KEY(empresaActiva.id, year)) } catch (e) { console.debug('localStorage.getItem failed', e); return false } }

  const [editing, setEditing] = useState(null) // mes en edición
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

  // Cargar montos desde Excel y SOBRESCRIBIR los 12 meses
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const ext = file.name.split('.').pop()?.toLowerCase()
    if (!['xlsx','xls'].includes(ext)) {
      await alert({ title: 'Formato inválido', message: 'Seleccione un archivo .xlsx o .xls.' })
      e.target.value = ''
      return
    }
    try {
      const data = await file.arrayBuffer()
      const XLSX = await import('xlsx')
      const wb = XLSX.read(data, { type: 'array' })
      const sheetName = wb.SheetNames?.[0]
      if (!sheetName) { await alert({ title: 'Error', message: 'El archivo no contiene hojas.' }); return }
      const sheet = wb.Sheets[sheetName]
      const rowsArr = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null }) // [ [headers...], [row...], ... ]
      if (!Array.isArray(rowsArr) || rowsArr.length < 2) {
        await alert({ title: 'Encabezado requerido', message: 'La primera fila debe contener encabezados (Mes, Ventas...).' })
        return
      }
      const headers = (rowsArr[0] || []).map(h => (h ?? '').toString().trim())
      // Buscar columna MES (igual ignorando may/min)
      const mesCol = headers.findIndex(h => h.toLowerCase() === 'mes')
      // Buscar columna VENTAS (que contenga la palabra "ventas")
      const ventasCol = headers.findIndex(h => h.toLowerCase().includes('ventas'))
      if (mesCol === -1 || ventasCol === -1) {
        await alert({ title: 'Columnas no válidas', message: 'Debe existir una columna "Mes" y otra que contenga "Ventas".' })
        return
      }

      const MONTH_NAME_MAP = {
        'ene': 1, 'enero': 1,
        'feb': 2, 'febrero': 2,
        'mar': 3, 'marzo': 3,
        'abr': 4, 'abril': 4,
        'may': 5, 'mayo': 5,
        'jun': 6, 'junio': 6,
        'jul': 7, 'julio': 7,
        'ago': 8, 'agosto': 8,
        'sep': 9, 'sept': 9, 'septiembre': 9,
        'oct': 10, 'octubre': 10,
        'nov': 11, 'noviembre': 11,
        'dic': 12, 'diciembre': 12
      }

      const parsed = []
      for (let i = 1; i < rowsArr.length; i++) {
        const row = rowsArr[i] || []
        let mesVal = row[mesCol]
        let ventasVal = row[ventasCol]
        if (mesVal == null || ventasVal == null) continue
        // Normalizar mes
        let mesNum
        if (typeof mesVal === 'number') {
          mesNum = mesVal
        } else if (typeof mesVal === 'string') {
          const m = mesVal.trim().toLowerCase()
          if (/^[0-9]+$/.test(m)) mesNum = Number(m)
          else mesNum = MONTH_NAME_MAP[m]
        }
        if (!mesNum || mesNum < 1 || mesNum > 12) continue
        // Normalizar monto
        if (typeof ventasVal === 'string') {
          const cleaned = ventasVal.replace(/\s+/g, '').replace(/\./g, '').replace(/,/g, '.')
          ventasVal = Number(cleaned)
        }
        const monto = Number(ventasVal)
        if (!Number.isFinite(monto)) continue
        parsed.push({ mes: mesNum, monto })
      }

      if (parsed.length === 0) {
        await alert({ title: 'Sin filas válidas', message: 'No se pudieron interpretar montos del Excel.' })
        return
      }

      // Quedarse con el último valor por mes (sobrescribir duplicados)
      const byMonth = {}
      for (const p of parsed) byMonth[p.mes] = p.monto

      // Validar al menos 11 meses distintos
      const distinctCount = Object.keys(byMonth).length
      if (distinctCount < 11) {
        await alert({ title: 'Datos incompletos', message: `Se requieren al menos 11 meses. Se encontraron ${distinctCount}.` })
        return
      }

      // SOBRESCRIBIR: construir 12 meses usando sólo lo importado; faltantes quedan vacíos
      const updated = Array.from({ length: 12 }).map((_, idx) => {
        const mes = idx + 1
        const nuevoMonto = byMonth[mes]
        return { anio: displayYear, mes, monto: nuevoMonto != null ? nuevoMonto : '' }
      })
      setRows(updated)
      await alert({ title: 'Importación completada', message: 'Se sobrescribieron los montos con los datos del Excel.' })
    } catch (err) {
      console.error('Error leyendo Excel:', err)
      await alert({ title: 'Error', message: err?.message || 'No se pudo procesar el archivo.' })
    } finally {
      try { e.target.value = '' } catch { /* noop */ }
    }
  }

  const generate = async (metodo) => {
    if (!complete) { await alert({ title: 'Datos incompletos', message: 'Se requieren 12/12 meses.' }); return }
    try {
      const payload = { metodo_usado: metodo, periodo_proyectado: displayYear + 1 }
      // Log de diagnóstico: qué se envía al generar
      console.log('[Proyecciones] generarProyeccion click', {
        empresaId: empresaActiva?.id,
        payload,
      })
      await ProyeccionesService.generarProyeccion(empresaActiva.id, payload)
      clearStale()
      await alert({ title: 'Éxito', message: 'Proyección generada.' })
      await loadProys()
    } catch (err) {
      await alert({ title: 'Error', message: err.response?.data?.message || err.message })
    }
  }

  const [details, setDetails] = useState({}) // {proyId: detalles[]}
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [viewOpen, setViewOpen] = useState(false)
  const [viewData, setViewData] = useState(null)
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
      s.push({ name: methodLabel(p.metodo_usado || p.metodo), data })
    }
    return s
  }, [proyecciones, details])

  const downloadProjectionPdf = async (p) => {
    try {
      const d = await ProyeccionesService.verProyeccion(empresaActiva.id, p.id)
      const periodo = d?.proyeccion?.periodo_proyectado ?? d?.periodo_proyectado ?? (displayYear+1)
      const metodo = methodLabel(d?.proyeccion?.metodo_usado ?? d?.metodo_usado ?? (p.metodo_usado || p.metodo))
      const detallesRaw = (d?.detalles || d?.data?.detalles || [])
      const items = detallesRaw.map(it => ({ mes: Number(it.mes), monto: Number(it.monto_proyectado || it.monto || 0) }))
      const empresaNombre = empresaActiva?.nombre || 'Empresa'
      const ahora = new Date()
      const timestamp = `${ahora.getFullYear()}-${String(ahora.getMonth()+1).padStart(2,'0')}-${String(ahora.getDate()).padStart(2,'0')} ${String(ahora.getHours()).padStart(2,'0')}:${String(ahora.getMinutes()).padStart(2,'0')}`

      const doc = new jsPDF({ unit: 'pt', format: 'a4' })
      const margin = 40
      let y = margin

      doc.setFontSize(16)
      doc.text(`Proyección ${periodo}`, margin, y)
      doc.setFontSize(12)
      y += 18
      doc.text(empresaNombre, margin, y)
      y += 16
      doc.setFontSize(10)
      doc.setTextColor(80)
      doc.text(`Método: ${metodo}`, margin, y)
      y += 14
      doc.text(`Generado: ${timestamp}`, margin, y)
      y += 14
      doc.text(`Fuente: Ventas ${displayYear}`, margin, y)
      doc.setTextColor(0)

      const body = (items.length ? items : Array.from({length:12},(_,i)=>({mes:i+1,monto:0}))).map(it => [
        `${String(it.mes).padStart(2,'0')} · ${MESES[it.mes-1] || ''}`,
        (it.monto ?? 0).toLocaleString()
      ])
      const total = items.reduce((a,x)=>a+(x.monto||0),0)

      autoTable(doc, {
        head: [['Mes', 'Monto proyectado']],
        body,
        foot: [['Total', total.toLocaleString()]],
        startY: y + 16,
        styles: { fontSize: 10 },
        headStyles: { fillColor: [249, 250, 251], textColor: 55 },
        columnStyles: {
          0: { halign: 'left' },
          1: { halign: 'right' },
        },
        footStyles: { fontStyle: 'bold' },
        margin: { left: margin, right: margin },
      })

      const safePeriodo = String(periodo)
      doc.save(`Proyeccion_${safePeriodo}.pdf`)
      setToast({ type: 'success', message: `PDF descargado: Proyección ${safePeriodo}`, ts: Date.now() })
    } catch (err) {
      const msg = err?.response?.data?.message || err.message
      setToast({ type: 'error', message: `Error al generar PDF: ${msg}`, ts: Date.now() })
      await alert({ title: 'Error', message: msg })
    }
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3 flex-wrap">
            <Button onClick={()=>navigate('/dashboard/gestion-empresas/ventas-mensuales')} variant="default" size="sm" className="cursor-pointer bg-black text-white hover:text-black">⟵ Volver</Button>
            <span className="text-lg font-semibold">Ventas ▸ {displayYear}</span>
            <span className={`text-xs px-2 py-1 rounded-full ${complete? 'bg-green-100 text-green-700':'bg-amber-100 text-amber-700'}`}>{complete? 'Completo 12/12' : `Incompleto ${rows.filter(r=>r.monto!=='' && r.monto!=null).length}/12`}</span>
            <span className="text-xs text-gray-500">Total: {total.toLocaleString()}</span>
            {isStale() && <span className="text-xs text-amber-700 bg-amber-100 px-2 py-0.5 rounded">Desactualizada</span>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {toast && (
            <div
              className={`mb-4 px-3 py-2 rounded text-xs flex items-center gap-2 shadow transition-opacity duration-300 ${toast.type==='success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}
              role="status"
            >
              <span>{toast.message}</span>
              <button
                onClick={()=>setToast(null)}
                className="ml-auto text-[10px] uppercase tracking-wide hover:underline"
                aria-label="Cerrar notificación"
              >Cerrar</button>
            </div>
          )}
          <Tabs value={tab} onValueChange={setTab} className="w-full">
            <TabsList>
              <TabsTrigger value="meses">Meses</TabsTrigger>
              <TabsTrigger value="proy">Proyecciones</TabsTrigger>
            </TabsList>
            <TabsContent value="meses" className="mt-4 space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                <Button onClick={saveAll} variant="primary" size="sm" className="cursor-pointer">Guardar cambios</Button>
                <Button onClick={deleteYear} variant="danger" size="sm" className="cursor-pointer">Eliminar año</Button>
                <div className="flex flex-col">
                  <label htmlFor="excel_upload" className="text-xs font-medium text-gray-700 mb-1">Cargar desde Excel</label>
                  <input
                    id="excel_upload"
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileUpload}
                    className="text-xs"
                    aria-label="Cargar montos desde Excel"
                  />
                </div>
              </div>
              <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
                <table className="w-full text-sm text-left text-gray-500">
                  <caption className="p-5 text-base font-semibold text-left text-gray-900 bg-white">
                    Montos mensuales
                    <p className="mt-1 text-xs font-normal text-gray-500">Edite los montos por mes. Use el lápiz para activar la edición individual y el ícono de bote para eliminar el mes.</p>
                  </caption>
                  <thead className="text-xs uppercase bg-gray-50 text-gray-700">
                    <tr>
                      <th scope="col" className="px-6 py-3">Mes</th>
                      <th scope="col" className="px-6 py-3">Año</th>
                      <th scope="col" className="px-6 py-3">Monto</th>
                      <th scope="col" className="px-6 py-3"><span className="sr-only">Acciones</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading && (
                      <tr><td colSpan={4} className="px-6 py-4">Cargando...</td></tr>
                    )}
                    {!loading && MESES.map((label,i)=>{
                      const mes = i+1
                      const r = rows.find(x=>x.mes===mes) || { anio: year, mes, monto:'' }
                      const isEditing = editing === mes
                      return (
                        <tr key={mes} className="bg-white border-b border-gray-200 hover:bg-gray-50">
                          <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">{label}</th>
                          <td className="px-6 py-4 text-xs text-gray-500">{r.anio}</td>
                          <td className="px-6 py-4">
                            {isEditing ? (
                              <input type="number" step="0.01" value={r.monto} onChange={e=>handleChange(mes, e.target.value)} className="border rounded px-2 py-1 w-32 focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="0.00" />
                            ) : (
                              <div className="w-32 text-right tabular-nums">{r.monto === '' || r.monto == null ? '—' : Number(r.monto).toLocaleString()}</div>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end items-center gap-2">
                              <Button variant="secondary" size="icon" aria-label="Editar" onClick={()=> setEditing(isEditing? null : mes)}>
                                <Pencil className="size-4" />
                              </Button>
                              {(r.id || r.monto) && (
                                <Button onClick={()=>deleteMonth(r, label)} variant="danger" size="icon" aria-label={`Eliminar ${label}`} className="cursor-pointer">
                                  <Trash2 className="size-4"/>
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </TabsContent>
            <TabsContent value="proy" className="mt-4 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex flex-col">
                    <span>Proyecciones basadas en {displayYear} → {displayYear+1}</span>
                    <span className="text-xs font-normal text-gray-500">Upsert: si existe, se reemplaza.</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {[{k:'minimos_cuadrados',l:'Mínimos Cuadrados'},{k:'incremento_porcentual',l:'Inc. Porcentual'},{k:'incremento_absoluto',l:'Inc. Absoluto'}].map(m => (
                      <Button key={m.k} disabled={!complete} onClick={()=>generate(m.k)} variant={complete? 'primary':'default'} size="sm" className={!complete? 'opacity-50 cursor-not-allowed':''}>{m.l}</Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex items-center justify-between">
                  <CardTitle>Proyecciones {displayYear+1}</CardTitle>
                  <Button onClick={loadProys} variant="outline" size="sm" className="cursor-pointer bg-black text-white hover:text-black">Recargar</Button>
                </CardHeader>
                <CardContent>
                  <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
                    <table className="w-full text-sm text-left text-gray-500">
                      <caption className="p-5 text-base font-semibold text-left text-gray-900 bg-white">
                        Proyecciones generadas
                        <p className="mt-1 text-xs font-normal text-gray-500">Lista de proyecciones para el año {displayYear+1}. Use los botones para ver, descargar o eliminar.</p>
                      </caption>
                      <thead className="text-xs uppercase bg-gray-50 text-gray-700">
                        <tr>
                          <th scope="col" className="px-6 py-3">Método</th>
                          <th scope="col" className="px-6 py-3">Año</th>
                          <th scope="col" className="px-6 py-3"><span className="sr-only">Acciones</span></th>
                        </tr>
                      </thead>
                      <tbody>
                        {loadingProy && (
                          <tr><td colSpan={3} className="px-6 py-4">Cargando...</td></tr>
                        )}
                        {!loadingProy && proyecciones.length === 0 && (
                          <tr><td colSpan={3} className="px-6 py-6 text-center text-gray-500">Sin proyecciones</td></tr>
                        )}
                        {!loadingProy && proyecciones.map(p => (
                          <tr key={p.id} className="bg-white border-b border-gray-200 hover:bg-gray-50">
                            <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">{methodLabel(p.metodo_usado || p.metodo)}</th>
                            <td className="px-6 py-4 text-xs text-gray-500">{p.periodo_proyectado || p.periodo}</td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex justify-end items-center gap-2">
                                <Button
                                  variant="secondary"
                                  size="icon"
                                  aria-label="Ver"
                                  onClick={async()=>{
                                    const d = await ProyeccionesService.verProyeccion(empresaActiva.id, p.id)
                                    setViewData(d)
                                    setViewOpen(true)
                                  }}
                                  className="cursor-pointer"
                                >
                                  <Eye className="size-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  aria-label="Descargar PDF"
                                  onClick={()=>downloadProjectionPdf(p)}
                                  className="cursor-pointer"
                                  title="Descargar PDF"
                                >
                                  <Download className="size-4" />
                                </Button>
                                <Button
                                  onClick={async()=>{ await ProyeccionesService.eliminarProyeccion(empresaActiva.id, p.id); await loadProys() }}
                                  variant="danger"
                                  size="icon"
                                  aria-label="Borrar"
                                  className="cursor-pointer"
                                >
                                  <Trash2 className="size-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex items-center justify-between">
                  <CardTitle>Comparador ({displayYear+1})</CardTitle>
                  <Button onClick={loadDetails} variant="outline" size="sm" className="cursor-pointer bg-black text-white hover:text-black">Cargar series</Button>
                </CardHeader>
                <CardContent>
                  {loadingDetails ? <div>Cargando...</div> : (
                    series.length === 0 ? <div className="text-sm text-gray-500">Sin series.</div> : <SimpleLine series={series} />
                  )}
                </CardContent>
              </Card>
              {viewOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" role="dialog" aria-modal="true">
                  <div className="bg-white rounded-lg w-[560px] max-w-[95vw] p-6 shadow-lg">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">Proyección {viewData?.proyeccion?.periodo_proyectado || viewData?.periodo_proyectado}</h3>
                      <Button variant="secondary" size="icon" aria-label="Cerrar" onClick={()=>{ setViewOpen(false); setViewData(null) }}>✕</Button>
                    </div>
                    {!viewData ? <div>Cargando...</div> : (
                      <div className="space-y-3 text-sm">
                        <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                          <span>ID: {viewData?.proyeccion?.id ?? viewData?.id}</span>
                          <span>Método: {viewData?.proyeccion?.metodo_usado ?? viewData?.metodo_usado}</span>
                          <span>Año: {viewData?.proyeccion?.periodo_proyectado ?? viewData?.periodo_proyectado}</span>
                        </div>
                        <div className="relative overflow-x-auto shadow-md sm:rounded-lg max-h-72 overflow-y-auto">
                          <table className="w-full text-sm text-left text-gray-500">
                            <caption className="p-4 text-base font-semibold text-left text-gray-900 bg-white">
                              Detalle de la proyección
                              <p className="mt-1 text-xs font-normal text-gray-500">
                                Valores por mes para el año {viewData?.proyeccion?.periodo_proyectado ?? viewData?.periodo_proyectado}
                                {viewData?.proyeccion?.metodo_usado || viewData?.metodo_usado ? ` · Método: ${viewData?.proyeccion?.metodo_usado ?? viewData?.metodo_usado}` : ''}
                              </p>
                            </caption>
                            <thead className="text-xs uppercase bg-gray-50 text-gray-700">
                              <tr>
                                <th scope="col" className="px-6 py-3">Mes</th>
                                <th scope="col" className="px-6 py-3">Monto proyectado</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(viewData.detalles || viewData.data?.detalles || []).map((d,i)=>(
                                <tr key={i} className="bg-white border-b border-gray-200">
                                  <th scope="row" className="px-6 py-3 font-medium text-gray-900 whitespace-nowrap">
                                    {`${String(d.mes).padStart(2,'0')} · ${MESES[(Number(d.mes||i+1)-1)] || ''}`}
                                  </th>
                                  <td className="px-6 py-3">{Number(d.monto_proyectado || d.monto || 0).toLocaleString()}</td>
                                </tr>
                              ))}
                              {(viewData.detalles || viewData.data?.detalles || []).length === 0 && (
                                <tr><td colSpan={2} className="px-6 py-6 text-center text-gray-500">Sin detalles</td></tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

export default YearDetail
