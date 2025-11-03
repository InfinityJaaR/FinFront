import { useState, useCallback } from 'react'
import EstadosFinancierosService from '@/services/EstadosFinancieros/EstadosFinancierosService'

export const useEstadosFinancieros = () => {
  const [estados, setEstados] = useState([])
  const [empresas, setEmpresas] = useState([])
  const [periodos, setPeriodos] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  /**
   * Cargar lista de empresas
   */
  const cargarEmpresas = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await EstadosFinancierosService.obtenerEmpresas()
      if (response.success) {
        setEmpresas(response.data)
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cargar empresas')
      console.error('Error al cargar empresas:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Cargar lista de periodos
   */
  const cargarPeriodos = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await EstadosFinancierosService.obtenerPeriodos()
      if (response.success) {
        setPeriodos(response.data)
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cargar periodos')
      console.error('Error al cargar periodos:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Descargar plantilla CSV
   */
  const descargarPlantilla = useCallback(async (empresaId, tipo) => {
    try {
      setLoading(true)
      setError(null)
      await EstadosFinancierosService.descargarPlantilla(empresaId, tipo)
      return { success: true }
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Error al descargar plantilla'
      setError(errorMsg)
      console.error('Error al descargar plantilla:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Listar estados financieros con filtros
   */
  const listarEstados = useCallback(async (filters = {}) => {
    try {
      setLoading(true)
      setError(null)
      const response = await EstadosFinancierosService.listar(filters)
      if (response.success) {
        setEstados(response.data)
      }
      return response
    } catch (err) {
      setError(err.response?.data?.message || 'Error al listar estados financieros')
      console.error('Error al listar estados financieros:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Obtener un estado específico o listar con filtros
   */
  const obtenerEstado = useCallback(async (filters) => {
    try {
      setLoading(true)
      setError(null)
      // Si es un número, es un ID, sino es un objeto de filtros
      if (typeof filters === 'number') {
        const response = await EstadosFinancierosService.obtener(filters)
        return response
      } else {
        const response = await EstadosFinancierosService.listar(filters)
        return response
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error al obtener estado financiero')
      console.error('Error al obtener estado financiero:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Crear nuevo estado financiero
   */
  const crearEstado = useCallback(async (data) => {
    try {
      setLoading(true)
      setError(null)
      const response = await EstadosFinancierosService.crear(data)
      return response
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Error al crear estado financiero'
      setError(errorMsg)
      console.error('Error al crear estado financiero:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Actualizar estado financiero
   */
  const actualizarEstado = useCallback(async (id, data) => {
    try {
      setLoading(true)
      setError(null)
      const response = await EstadosFinancierosService.actualizar(id, data)
      return response
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Error al actualizar estado financiero'
      setError(errorMsg)
      console.error('Error al actualizar estado financiero:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Eliminar estado financiero
   */
  const eliminarEstado = useCallback(async (id) => {
    try {
      setLoading(true)
      setError(null)
      const response = await EstadosFinancierosService.eliminar(id)
      return response
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Error al eliminar estado financiero'
      setError(errorMsg)
      console.error('Error al eliminar estado financiero:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    // Estados
    estados,
    empresas,
    periodos,
    loading,
    error,
    
    // Funciones
    cargarEmpresas,
    cargarPeriodos,
    descargarPlantilla,
    listarEstados,
    obtenerEstado,
    crearEstado,
    actualizarEstado,
    eliminarEstado,
    
    // Helpers
    setError,
  }
}
