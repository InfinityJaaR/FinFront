import axios from 'axios'
import url from '@/services/utils/url'
import { getAuthHeaders } from '@/services/auth/authService'

const BASE = `${url}empresas`

// Normaliza items recibidos desde la API a forma {id, anio, mes, monto}
function normalizeItems(items = []) {
  return (items || []).map(it => {
    if (it && (it.anio != null && it.mes != null)) {
      return { id: it.id, anio: Number(it.anio), mes: Number(it.mes), monto: Number(it.monto ?? it.valor ?? 0) }
    }
    // Fallback antiguo basado en fecha YYYY-MM-01
    const fecha = it?.fecha || it?.fecha_proyectada || ''
    const y = Number((fecha || '').slice(0, 4))
    const m = Number((fecha || '').slice(5, 7))
    return { id: it?.id, anio: y, mes: m, monto: Number(it?.monto ?? it?.valor ?? 0) }
  })
}

// Convierte ventas {anio,mes,monto} -> {fecha,monto} para endpoints antiguos
function toLegacyFechaPayload(ventas = []) {
  return ventas.map(v => ({ fecha: `${v.anio}-${String(v.mes).padStart(2,'0')}-01`, monto: v.monto }))
}

// Helper para intentar rutas alternativas si el backend usa otra convención
async function tryAlternatives(calls = []) {
  let lastErr
  for (const fn of calls) {
    try { return await fn() } catch (err) {
      lastErr = err
      // sólo continuar en 404/405; otros errores se relanzan
      const status = err?.response?.status
      if (status && status !== 404 && status !== 405) throw err
    }
  }
  if (lastErr) throw lastErr
}

class VentasHistoricasService {
  async listar(empresaId, { year, page, per_page } = {}) {
    try {
      const headers = getAuthHeaders()
      // Preferir la nueva convención "ventas-mensuales"
      const primary = () => axios.get(`${BASE}/${empresaId}/ventas-mensuales`, { headers, params: { year, page, per_page } })
      const altA = () => axios.get(`${url}ventas-mensuales`, { headers, params: { year, page, per_page, empresa_id: empresaId } })
      const altB = () => axios.get(`${BASE}/${empresaId}/ventas-historicas`, { headers, params: { year, page, per_page } })
      const altC = () => axios.get(`${url}ventas-historicas`, { headers, params: { year, page, per_page, empresa_id: empresaId } })
      const res = await tryAlternatives([primary, altA, altB, altC])
      const raw = res.data?.data ?? res.data
      return normalizeItems(raw)
    } catch (err) {
      console.error('Error listar ventas históricas', err)
      throw err
    }
  }

  async upsertBulk(empresaId, ventas) {
    try {
      const headers = getAuthHeaders()
      // Normalizar a formato nuevo anio/mes
      const normalized = (ventas || []).map(v => (
        v?.anio != null && v?.mes != null
          ? { anio: Number(v.anio), mes: Number(v.mes), monto: Number(v.monto) }
          : { anio: Number(String(v.fecha).slice(0,4)), mes: Number(String(v.fecha).slice(5,7)), monto: Number(v.monto) }
      ))
      const bodyPrimary = { ventas: normalized }
      const bodyAlt = { empresa_id: empresaId, ventas: toLegacyFechaPayload(normalized) }
      const primary = () => axios.post(`${BASE}/${empresaId}/ventas-mensuales`, bodyPrimary, { headers })
      const altA = () => axios.post(`${url}ventas-mensuales`, bodyAlt, { headers })
      const altB = () => axios.post(`${BASE}/${empresaId}/ventas-historicas`, bodyPrimary, { headers })
      const altC = () => axios.post(`${url}ventas-historicas`, bodyAlt, { headers })
      const res = await tryAlternatives([primary, altA, altB, altC])
      const raw = res.data?.data ?? res.data
      return normalizeItems(raw)
    } catch (err) {
      console.error('Error upsertBulk ventas históricas', err)
      throw err
    }
  }

  async actualizar(empresaId, ventaId, body) {
    try {
      const headers = getAuthHeaders()
      const normalized = body?.anio != null && body?.mes != null
        ? { anio: Number(body.anio), mes: Number(body.mes), monto: Number(body.monto) }
        : { anio: Number(String(body.fecha).slice(0,4)), mes: Number(String(body.fecha).slice(5,7)), monto: Number(body.monto) }
      const primary = () => axios.put(`${BASE}/${empresaId}/ventas-mensuales/${ventaId}`, normalized, { headers })
      const altA = () => axios.put(`${url}ventas-mensuales/${ventaId}`, { ...normalized, empresa_id: empresaId }, { headers })
      const altB = () => axios.put(`${BASE}/${empresaId}/ventas-historicas/${ventaId}`, { fecha: `${normalized.anio}-${String(normalized.mes).padStart(2,'0')}-01`, monto: normalized.monto }, { headers })
      const altC = () => axios.put(`${url}ventas-historicas/${ventaId}`, { empresa_id: empresaId, fecha: `${normalized.anio}-${String(normalized.mes).padStart(2,'0')}-01`, monto: normalized.monto }, { headers })
      const res = await tryAlternatives([primary, altA, altB, altC])
      const raw = res.data?.data ?? res.data
      return normalizeItems([raw])[0] ?? raw
    } catch (err) {
      console.error('Error actualizar venta histórica', err)
      throw err
    }
  }

  async eliminar(empresaId, ventaId) {
    try {
      const headers = getAuthHeaders()
      const primary = () => axios.delete(`${BASE}/${empresaId}/ventas-mensuales/${ventaId}`, { headers })
      const altA = () => axios.delete(`${url}ventas-mensuales/${ventaId}`, { headers, data: { empresa_id: empresaId } })
      const altB = () => axios.delete(`${BASE}/${empresaId}/ventas-historicas/${ventaId}`, { headers })
      const altC = () => axios.delete(`${url}ventas-historicas/${ventaId}`, { headers, data: { empresa_id: empresaId } })
      const res = await tryAlternatives([primary, altA, altB, altC])
      return res.data
    } catch (err) {
      console.error('Error eliminar venta histórica', err)
      throw err
    }
  }
}

export default new VentasHistoricasService()
