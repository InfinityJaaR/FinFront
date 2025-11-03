import apiClient from '../apiClient'

const EstadosFinancierosService = {
  /**
   * Obtener lista de empresas con catálogo disponible
   */
  obtenerEmpresas: async () => {
    try {
      const response = await apiClient.get('/estados-financieros/empresas')
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
      const response = await apiClient.get('/estados-financieros/periodos')
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
      const response = await apiClient.get('/estados-financieros/plantilla', {
        params: { empresa_id: empresaId, tipo },
        responseType: 'blob'
      })
      
      // Crear enlace de descarga
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      
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
      window.URL.revokeObjectURL(url)
      
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
      const response = await apiClient.get('/estados-financieros', { params: filters })
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
      const response = await apiClient.get(`/estados-financieros/${id}`)
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
      const response = await apiClient.post('/estados-financieros', data)
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
      const response = await apiClient.put(`/estados-financieros/${id}`, data)
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
      const response = await apiClient.delete(`/estados-financieros/${id}`)
      return response.data
    } catch (error) {
      console.error('Error al eliminar estado financiero:', error)
      throw error
    }
  }
}

export default EstadosFinancierosService
