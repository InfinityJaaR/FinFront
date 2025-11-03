import axios from 'axios'
import url from '../utils/url'

const ESTADOS_API_URL = `${url}estados-financieros`

/**
 * Función auxiliar para obtener los headers de autenticación (Bearer Token)
 */
const getAuthHeaders = () => {
  const token = localStorage.getItem('token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

const EstadosFinancierosService = {
  /**
   * Obtener lista de empresas con catálogo disponible
   */
  obtenerEmpresas: async () => {
    try {
      const response = await axios.get(`${ESTADOS_API_URL}/empresas`, {
        headers: getAuthHeaders(),
      })
      return response.data
    } catch (error) {
      console.error('Error al obtener empresas:', error)
      throw error
    }
  },

  /**
   * Obtener lista de periodos disponibles
   */
  obtenerPeriodos: async () => {
    try {
      const response = await axios.get(`${ESTADOS_API_URL}/periodos`, {
        headers: getAuthHeaders(),
      })
      return response.data
    } catch (error) {
      console.error('Error al obtener periodos:', error)
      throw error
    }
  },

  /**
   * Descargar plantilla CSV con las cuentas según el tipo de estado
   * @param {number} empresaId - ID de la empresa
   * @param {string} tipo - 'BALANCE' o 'RESULTADOS'
   */
  descargarPlantilla: async (empresaId, tipo) => {
    try {
      const response = await axios.get(`${ESTADOS_API_URL}/plantilla`, {
        params: { empresa_id: empresaId, tipo },
        headers: getAuthHeaders(),
        responseType: 'blob'
      })
      
      // Crear enlace de descarga
      const blob = new Blob([response.data], { type: 'text/csv' })
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      
      // Extraer nombre del archivo del header Content-Disposition si existe
      const contentDisposition = response.headers['content-disposition']
      let filename = `plantilla_${tipo.toLowerCase()}_${empresaId}.csv`
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/)
        if (filenameMatch) {
          filename = filenameMatch[1]
        }
      }
      
      link.setAttribute('download', filename)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(downloadUrl)
      
      return { success: true, message: 'Plantilla descargada exitosamente' }
    } catch (error) {
      console.error('Error al descargar plantilla:', error)
      throw error
    }
  },

  /**
   * Listar estados financieros con filtros opcionales
   * @param {Object} filters - Filtros opcionales { empresa_id, periodo_id, tipo }
   */
  listar: async (filters = {}) => {
    try {
      const response = await axios.get(ESTADOS_API_URL, { 
        params: filters,
        headers: getAuthHeaders(),
      })
      return response.data
    } catch (error) {
      console.error('Error al listar estados financieros:', error)
      throw error
    }
  },

  /**
   * Obtener un estado financiero específico
   * @param {number} id - ID del estado financiero
   */
  obtener: async (id) => {
    try {
      const response = await axios.get(`${ESTADOS_API_URL}/${id}`, {
        headers: getAuthHeaders(),
      })
      return response.data
    } catch (error) {
      console.error('Error al obtener estado financiero:', error)
      throw error
    }
  },

  /**
   * Crear un nuevo estado financiero
   * @param {Object} data - Datos del estado { empresa_id, periodo_id, tipo, detalles }
   */
  crear: async (data) => {
    try {
      const response = await axios.post(ESTADOS_API_URL, data, {
        headers: getAuthHeaders(),
      })
      return response.data
    } catch (error) {
      console.error('Error al crear estado financiero:', error)
      throw error
    }
  },

  /**
   * Actualizar un estado financiero existente
   * @param {number} id - ID del estado financiero
   * @param {Object} data - Datos actualizados { detalles }
   */
  actualizar: async (id, data) => {
    try {
      const response = await axios.put(`${ESTADOS_API_URL}/${id}`, data, {
        headers: getAuthHeaders(),
      })
      return response.data
    } catch (error) {
      console.error('Error al actualizar estado financiero:', error)
      throw error
    }
  },

  /**
   * Eliminar un estado financiero
   * @param {number} id - ID del estado financiero
   */
  eliminar: async (id) => {
    try {
      const response = await axios.delete(`${ESTADOS_API_URL}/${id}`, {
        headers: getAuthHeaders(),
      })
      return response.data
    } catch (error) {
      console.error('Error al eliminar estado financiero:', error)
      throw error
    }
  }
}

export default EstadosFinancierosService
