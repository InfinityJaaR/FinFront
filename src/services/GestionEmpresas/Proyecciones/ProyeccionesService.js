import axios from 'axios'
import url from '@/services/utils/url'
import { getAuthHeaders } from '@/services/auth/authService'

const BASE = `${url}empresas`

class ProyeccionesService {
  async generarProyeccion(empresaId, body) {
    try {
      const res = await axios.post(`${BASE}/${empresaId}/proyecciones/generar`, body, {
        headers: getAuthHeaders(),
      })
      return res.data
    } catch (err) {
      console.error('Error generarProyeccion', err)
      throw err
    }
  }

  async createProyeccion(empresaId, body) {
    try {
      // Intentar crear un registro de proyección (si el backend lo soporta)
      const res = await axios.post(`${BASE}/${empresaId}/proyecciones`, body, {
        headers: getAuthHeaders(),
      })
      return res.data
    } catch (err) {
      console.warn('createProyeccion no soportado o falló, fallback a generarProyeccion', err)
      throw err
    }
  }

  async generateForProyeccion(empresaId, proyeccionId, body) {
    try {
      // Endpoint opcional: POST /empresas/{empresa}/proyecciones/{proyeccion}/generar
      const res = await axios.post(`${BASE}/${empresaId}/proyecciones/${proyeccionId}/generar`, body, {
        headers: getAuthHeaders(),
      })
      return res.data
    } catch (err) {
      console.warn('generateForProyeccion no soportado o falló, fallback a generarProyeccion', err)
      // fallback: usar el endpoint upsert existente
      return await this.generarProyeccion(empresaId, body)
    }
  }

  async listarProyecciones(empresaId) {
    try {
      const res = await axios.get(`${BASE}/${empresaId}/proyecciones`, {
        headers: getAuthHeaders(),
      })
      const raw = res.data?.data ?? res.data
      return normalizeList(raw)
    } catch (err) {
      console.error('Error listarProyecciones', err)
      throw err
    }
  }

  async verProyeccion(empresaId, proyeccionId) {
    try {
      const res = await axios.get(`${BASE}/${empresaId}/proyecciones/${proyeccionId}`, {
        headers: getAuthHeaders(),
      })
      const data = res.data?.data ?? res.data
      if (data?.proyeccion) {
        data.proyeccion.periodo_proyectado = parseYear(data.proyeccion.periodo_proyectado ?? data.proyeccion.periodo)
      } else if (data) {
        data.periodo_proyectado = parseYear(data.periodo_proyectado ?? data.periodo)
      }
      return data
    } catch (err) {
      console.error('Error verProyeccion', err)
      throw err
    }
  }

  async eliminarProyeccion(empresaId, proyeccionId) {
    try {
      const res = await axios.delete(`${BASE}/${empresaId}/proyecciones/${proyeccionId}`, {
        headers: getAuthHeaders(),
      })
      return res.data
    } catch (err) {
      console.error('Error eliminarProyeccion', err)
      throw err
    }
  }
}

// Helpers fuera de la clase
function parseYear(val) {
  const n = Number(String(val ?? '').replace(/[^0-9]/g, ''))
  return Number.isFinite(n) && n > 0 ? n : undefined
}

function normalizeList(list) {
  const arr = Array.isArray(list) ? list : (list?.proyecciones || list?.data || [])
  return arr.map(p => ({
    ...p,
    periodo_proyectado: parseYear(p?.periodo_proyectado ?? p?.periodo)
  }))
}

export default new ProyeccionesService()
