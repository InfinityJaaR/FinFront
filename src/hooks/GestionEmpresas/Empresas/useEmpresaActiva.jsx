import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/auth/useAuth'
import EmpresasService from '@/services/GestionEmpresas/Empresas/EmpresasService'
import catalogoService from '@/services/GestionCuentas/CatalogoCuentas/CatalogoCuentasService'

/**
 * useEmpresaActiva
 * - Para rol "Analista Financiero": detecta la empresa asociada al usuario y la fija (no editable).
 * - Para rol "Administrador": no fija empresa por defecto y expone listado para seleccionar.
 *
 * Retorna: { empresaActiva, setEmpresaActiva, empresas, isLoading, error, isLocked }
 */
const STORAGE_KEY = 'empresa_activa_id'

const useEmpresaActiva = () => {
  const { user, loading: authLoading, getUserRole } = useAuth()

  const [empresaActiva, setEmpresaActivaState] = useState(null)
  const [empresas, setEmpresas] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const role = getUserRole()
  const isLocked = role === 'Analista Financiero'

  // Helpers para obtener empresa desde distintos formatos del user
  const extractEmpresaFromUser = (u) => {
    if (!u) return null
    // Posibles variantes: u.empresa (obj), u.empresa_id (id), u.company (obj)
    if (u.empresa) return u.empresa
    if (u.company) return u.company
    if (u.empresa_id) return { id: u.empresa_id }
    if (u.company_id) return { id: u.company_id }
    // Si el usuario ya contiene un campo abreviado
    if (u.empresa_actual) return u.empresa_actual
    return null
  }

  // Sync helpers
  const persistEmpresaId = (id) => {
    try {
      if (id) localStorage.setItem(STORAGE_KEY, String(id))
      else localStorage.removeItem(STORAGE_KEY)
      // Notificar a otros consumidores
      window.dispatchEvent(new Event('empresaActivaChanged'))
    } catch {}
  }

  const readPersistedId = () => {
    try { return localStorage.getItem(STORAGE_KEY) } catch { return null }
  }

  // Cargar lista de empresas (para Admin)
  const fetchEmpresas = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      // Preferimos un método que devuelva array plano
      let list = []
      try {
        list = await EmpresasService.getEmpresas()
        console.debug('useEmpresaActiva: getEmpresas ->', list)
      } catch (e) {
        console.warn('useEmpresaActiva: getEmpresas failed', e)
        list = []
      }

      // Si no devolvió array, intentar paginar por /api/empresas (paginado)
      if (!Array.isArray(list) || list.length === 0) {
        if (typeof EmpresasService.getAllEmpresas === 'function') {
          try {
            // Obtener primera página
            const pageResp = await EmpresasService.getAllEmpresas(1, '')
            console.debug('useEmpresaActiva: getAllEmpresas page1 ->', pageResp)

            // Normalizar paginador: puede venir como { success: true, data: { data: [...], current_page, last_page } }
            const paginator = pageResp?.data ?? pageResp
            const pageData = paginator?.data ?? []
            if (Array.isArray(pageData) && pageData.length > 0) {
              list = [...pageData]
              const lastPage = Number(paginator?.last_page || paginator?.lastPage || 1)
              // Si hay más páginas, iterar y concatenar
              if (lastPage > 1) {
                const promises = []
                for (let p = 2; p <= lastPage; p++) {
                  promises.push(EmpresasService.getAllEmpresas(p, ''))
                }
                const pages = await Promise.all(promises)
                pages.forEach((pg) => {
                  const pgPaginador = pg?.data ?? pg
                  const items = pgPaginador?.data ?? []
                  if (Array.isArray(items) && items.length) list = list.concat(items)
                })
              }
            }
          } catch (e) {
            console.warn('useEmpresaActiva: getAllEmpresas (paginated) failed', e)
          }
        }

        // último recurso: intentar endpoint del catálogo (devuelve empresas con metadata de catálogo)
        if ((!Array.isArray(list) || list.length === 0) && typeof catalogoService.getEmpresasConCatalogo === 'function') {
          try {
            const resp = await catalogoService.getEmpresasConCatalogo()
            console.debug('useEmpresaActiva: catalogoService.getEmpresasConCatalogo ->', resp)
            // resp puede ser { success: true, data: [...] } o array
            if (resp?.success && Array.isArray(resp.data) && resp.data.length > 0) {
              list = resp.data
            } else if (Array.isArray(resp)) {
              list = resp
            }
          } catch (e) {
            console.warn('useEmpresaActiva: catalogoService.getEmpresasConCatalogo failed', e)
          }
        }
      }

      const normalized = Array.isArray(list) ? list : (list?.data ?? [])
      setEmpresas(normalized)

      // Si hay una empresa persistida y aún no se ha seleccionado en este hook, cargarla
      const persistedId = readPersistedId()
      if (persistedId && !empresaActiva) {
        const found = normalized.find(e => String(e.id) === String(persistedId))
        if (found) setEmpresaActivaState(found)
        else {
          const loaded = await loadEmpresaById(Number(persistedId))
          if (loaded) setEmpresaActivaState(loaded)
        }
      }
    } catch (err) {
      console.error('Error cargando empresas:', err)
      setError(err.message || 'Error cargando empresas')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Obtener datos completos de una empresa por id
  const loadEmpresaById = useCallback(async (id) => {
    if (!id) return null
    try {
      const e = await EmpresasService.getEmpresa(id)
      return e
    } catch (err) {
      console.error('Error cargando empresa por id', id, err)
      return null
    }
  }, [])

  // Función para cambiar la empresa activa (para Admin)
  const setEmpresaActiva = useCallback(async (empresaOrIdOrNull) => {
    // Si el rol es Analista, ignorar cambios externos
    if (isLocked) return

    if (!empresaOrIdOrNull) {
      setEmpresaActivaState(null)
      persistEmpresaId(null)
      return
    }

    // Si es objeto con id, usarlo directamente si tiene propiedades
    if (typeof empresaOrIdOrNull === 'object') {
      // Si contiene solo id, intentar cargar datos completos
      if (Object.keys(empresaOrIdOrNull).length === 1 && empresaOrIdOrNull.id) {
        const loaded = await loadEmpresaById(empresaOrIdOrNull.id)
        const val = loaded ?? empresaOrIdOrNull
        setEmpresaActivaState(val)
        persistEmpresaId(val?.id)
      } else {
        setEmpresaActivaState(empresaOrIdOrNull)
        persistEmpresaId(empresaOrIdOrNull?.id)
      }
      return
    }

    // Si es id (number|string)
    if (typeof empresaOrIdOrNull === 'number' || typeof empresaOrIdOrNull === 'string') {
      const loaded = await loadEmpresaById(empresaOrIdOrNull)
      setEmpresaActivaState(loaded)
      persistEmpresaId(loaded?.id)
      return
    }
  }, [isLocked, loadEmpresaById])

  // Inicialización: cuando ya tenemos user y rol
  useEffect(() => {
    if (authLoading) return

    const uEmpresa = extractEmpresaFromUser(user)

    if (role === 'Analista Financiero') {
      // Forzar empresa del analista
      if (!uEmpresa) {
        // Si no viene la empresa en el user, intentar obtener por un campo id conocido
        const id = user?.empresa_id || user?.company_id
        if (id) {
          ;(async () => {
            setIsLoading(true)
            const loaded = await loadEmpresaById(id)
            setEmpresaActivaState(loaded)
            persistEmpresaId(loaded?.id)
            setIsLoading(false)
          })()
        }
      } else {
        // Si uEmpresa es sólo {id}, cargar completo
        if (uEmpresa && uEmpresa.id && Object.keys(uEmpresa).length === 1) {
          ;(async () => {
            setIsLoading(true)
            const loaded = await loadEmpresaById(uEmpresa.id)
            const val = loaded ?? uEmpresa
            setEmpresaActivaState(val)
            persistEmpresaId(val?.id)
            setIsLoading(false)
          })()
        } else {
          setEmpresaActivaState(uEmpresa)
          persistEmpresaId(uEmpresa?.id)
        }
      }

      // No cargar lista de empresas para analista
      return
    }

    // Para Admin (u otro rol): empresa activa nula por defecto y cargar lista
    setEmpresaActivaState(null)
    fetchEmpresas()
  }, [authLoading, user, role, fetchEmpresas, loadEmpresaById])

  // Escuchar cambios externos (storage/custom) para sincronizar entre instancias
  useEffect(() => {
    const onChange = async () => {
      const persistedId = readPersistedId()
      if (!persistedId) { setEmpresaActivaState(null); return }
      // si ya es la misma, no hacer nada
      if (empresaActiva && String(empresaActiva.id) === String(persistedId)) return
      const found = empresas.find(e => String(e.id) === String(persistedId))
      if (found) setEmpresaActivaState(found)
      else {
        const loaded = await loadEmpresaById(Number(persistedId))
        if (loaded) setEmpresaActivaState(loaded)
      }
    }
    const storageHandler = (e) => { if (e.key === STORAGE_KEY) onChange() }
    window.addEventListener('storage', storageHandler)
    window.addEventListener('empresaActivaChanged', onChange)
    return () => {
      window.removeEventListener('storage', storageHandler)
      window.removeEventListener('empresaActivaChanged', onChange)
    }
  }, [empresaActiva, empresas, loadEmpresaById])

  return {
    empresaActiva,
    setEmpresaActiva,
    empresas,
    isLoading,
    error,
    isLocked,
  }
}

export default useEmpresaActiva
