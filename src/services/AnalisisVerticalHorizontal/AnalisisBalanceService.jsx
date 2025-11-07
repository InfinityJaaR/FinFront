import axios from 'axios'
import url from '../utils/url'

const ANALISIS_API_URL = `${url}analisis/balance`

/**
 * Función auxiliar para obtener los headers de autenticación (Bearer Token)
 */
const getAuthHeaders = () => {
  const token = localStorage.getItem('token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

const AnalisisBalanceService = {
  /**
   * Obtener análisis vertical del Balance General
   * @param {Object} params - Parámetros { periodo_id, empresa_id (opcional para admin), seccion (opcional) }
   * @returns {Promise} Respuesta con totales y líneas del análisis vertical
   */
  obtenerAnalisisVertical: async (params) => {
    try {
      const response = await axios.get(`${ANALISIS_API_URL}/vertical`, {
        params,
        headers: getAuthHeaders(),
      })
      return response.data
    } catch (error) {
      console.error('Error al obtener análisis vertical:', error)
      throw error
    }
  },

  /**
   * Obtener análisis horizontal del Balance General
   * @param {Object} params - Parámetros { periodo_base_id, periodo_comp_id, empresa_id (opcional para admin) }
   * @returns {Promise} Respuesta con líneas comparativas del análisis horizontal
   */
  obtenerAnalisisHorizontal: async (params) => {
    try {
      const response = await axios.get(`${ANALISIS_API_URL}/horizontal`, {
        params,
        headers: getAuthHeaders(),
      })
      return response.data
    } catch (error) {
      console.error('Error al obtener análisis horizontal:', error)
      throw error
    }
  },
}

export default AnalisisBalanceService

