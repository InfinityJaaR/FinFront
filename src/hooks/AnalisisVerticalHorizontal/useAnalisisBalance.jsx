import { useState, useCallback } from 'react'
import AnalisisBalanceService from '@/services/AnalisisVerticalHorizontal/AnalisisBalanceService'
import authService from '@/services/auth/authService'

export const useAnalisisBalance = () => {
  const [analisisVertical, setAnalisisVertical] = useState(null)
  const [analisisHorizontal, setAnalisisHorizontal] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  /**
   * Determinar si el usuario es administrador
   */
  const esAdministrador = useCallback(() => {
    const role = authService.getUserRole()
    return role === 'Administrador'
  }, [])

  /**
   * Obtener empresa_id del usuario (para analista)
   */
  const obtenerEmpresaUsuario = useCallback(() => {
    const user = authService.getCurrentUser()
    return user?.empresa_id || null
  }, [])

  /**
   * Obtener análisis vertical del balance
   * @param {Object} params - { periodo_id, seccion (opcional), empresa_id (solo para admin) }
   */
  const obtenerAnalisisVertical = useCallback(async (params) => {
    try {
      setLoading(true)
      setError(null)
      
      // Preparar parámetros según rol
      const parametros = { ...params }
      
      // Si no es administrador, usar empresa del usuario
      if (!esAdministrador() && !parametros.empresa_id) {
        const empresaId = obtenerEmpresaUsuario()
        if (empresaId) {
          parametros.empresa_id = empresaId
        }
      }

      const response = await AnalisisBalanceService.obtenerAnalisisVertical(parametros)
      
      if (response.success) {
        setAnalisisVertical(response.data)
        return response.data
      }
      
      throw new Error(response.message || 'Error al obtener análisis vertical')
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Error al obtener análisis vertical'
      setError(errorMsg)
      console.error('Error al obtener análisis vertical:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [esAdministrador, obtenerEmpresaUsuario])

  /**
   * Obtener análisis horizontal del balance
   * @param {Object} params - { periodo_base_id, periodo_comp_id, empresa_id (solo para admin) }
   */
  const obtenerAnalisisHorizontal = useCallback(async (params) => {
    try {
      setLoading(true)
      setError(null)
      
      // Preparar parámetros según rol
      const parametros = { ...params }
      
      // Si no es administrador, usar empresa del usuario
      if (!esAdministrador() && !parametros.empresa_id) {
        const empresaId = obtenerEmpresaUsuario()
        if (empresaId) {
          parametros.empresa_id = empresaId
        }
      }

      const response = await AnalisisBalanceService.obtenerAnalisisHorizontal(parametros)
      
      if (response.success) {
        setAnalisisHorizontal(response.data)
        return response.data
      }
      
      throw new Error(response.message || 'Error al obtener análisis horizontal')
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Error al obtener análisis horizontal'
      setError(errorMsg)
      console.error('Error al obtener análisis horizontal:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [esAdministrador, obtenerEmpresaUsuario])

  /**
   * Limpiar resultados de análisis
   */
  const limpiarAnalisis = useCallback(() => {
    setAnalisisVertical(null)
    setAnalisisHorizontal(null)
    setError(null)
  }, [])

  /**
   * Exportar análisis a CSV
   * @param {Array} datos - Datos a exportar
   * @param {string} tipo - 'vertical' o 'horizontal'
   * @param {string} nombreArchivo - Nombre del archivo
   * @param {Object} opciones - Opciones adicionales (para horizontal: { anioBase, anioComp })
   */
  const exportarCSV = useCallback((datos, tipo, nombreArchivo = 'analisis_balance.csv', opciones = {}) => {
    if (!datos || datos.length === 0) {
      console.warn('No hay datos para exportar')
      return
    }

    let csv = ''
    
    if (tipo === 'vertical') {
      // Encabezados para análisis vertical (sin Sección y Denominador)
      csv = 'Código,Nombre,Monto,Porcentaje\n'
      
      datos.forEach(linea => {
        const porcentaje = linea.porcentaje !== null 
          ? (linea.porcentaje * 100).toFixed(2) + '%' 
          : 'N/D'
        csv += `"${linea.codigo}","${linea.nombre}",${linea.monto},${porcentaje}\n`
      })
    } else if (tipo === 'horizontal') {
      // Obtener años de los periodos (usar opciones o valores por defecto)
      const anioBase = opciones.anioBase || 'Base'
      const anioComp = opciones.anioComp || 'Comparación'
      
      // Encabezados para análisis horizontal (sin Sección, con años en lugar de "Monto Base" y "Monto Comparación")
      csv = `Código,Nombre,${anioBase},${anioComp},Variación Absoluta,Variación %\n`
      
      datos.forEach(linea => {
        const variacionPct = linea.variacion_pct !== null 
          ? (linea.variacion_pct * 100).toFixed(2) + '%' 
          : 'N/D'
        csv += `"${linea.codigo}","${linea.nombre}",${linea.monto_base},${linea.monto_comp},${linea.variacion_abs},${variacionPct}\n`
      })
    }

    // Crear y descargar archivo con BOM UTF-8 para que Excel reconozca las tildes
    const BOM = '\uFEFF'
    const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    
    link.setAttribute('href', url)
    link.setAttribute('download', nombreArchivo)
    link.style.visibility = 'hidden'
    
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }, [])

  return {
    // Estados
    analisisVertical,
    analisisHorizontal,
    loading,
    error,
    
    // Funciones
    obtenerAnalisisVertical,
    obtenerAnalisisHorizontal,
    limpiarAnalisis,
    exportarCSV,
    
    // Helpers
    esAdministrador,
    obtenerEmpresaUsuario,
    setError,
  }
}

