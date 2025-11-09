import React from 'react'
import useEmpresaActiva from '@/hooks/GestionEmpresas/Empresas/useEmpresaActiva'

/**
 * EmpresaSelector
 * Props:
 * - label (string) optional
 * - className (string) optional
 * - onChange(empresa) optional callback when empresa cambia
 * - empresas (array) optional override list
 * - empresaActiva (object|null) optional override
 */
const EmpresaSelector = ({ label = 'Empresa', className = '', onChange, empresas: empresasProp, empresaActiva: empresaActivaProp }) => {
  const { empresaActiva, setEmpresaActiva, empresas, isLoading, error, isLocked } = useEmpresaActiva()

  const list = Array.isArray(empresasProp) ? empresasProp : empresas
  const selected = empresaActivaProp ?? empresaActiva

  const handleChange = async (e) => {
    const val = e.target.value
    if (!val) {
      await setEmpresaActiva(null)
      onChange && onChange(null)
      return
    }
    // buscar objeto en la lista
    const found = list.find((it) => String(it.id) === String(val))
    if (found) {
      await setEmpresaActiva(found)
      onChange && onChange(found)
    } else {
      // si no está en la lista, pasar el id y permitir al hook resolver
      await setEmpresaActiva(Number(val))
      onChange && onChange({ id: Number(val) })
    }
  }

  return (
    <div className={className}>
      {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}

      {isLocked ? (
        <div className="text-sm text-gray-800">
          {selected ? (
            <strong>{selected.nombre || selected.nombre_corto || `ID ${selected.id}`}</strong>
          ) : (
            <em>Sin empresa asignada</em>
          )}
        </div>
      ) : (
        <div>
          <select
            className="border rounded px-2 py-1 w-full"
            value={selected?.id ?? ''}
            onChange={handleChange}
            disabled={isLoading}
          >
            <option value="">{isLoading ? 'Cargando...' : 'Seleccione una empresa'}</option>
            {!isLoading && list && list.length === 0 && <option value="">No hay empresas</option>}
            {!isLoading && list && list.map((e) => (
              <option key={e.id} value={e.id}>{e.nombre || e.nombre_corto || `Empresa ${e.id}`}</option>
            ))}
          </select>
          {error && <div className="text-sm text-red-600 mt-1">{String(error)}</div>}
        </div>
      )}
    </div>
  )
}

export default EmpresaSelector
