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

      <div>
        <select
          className={`border rounded px-2 py-1 w-full ${isLocked ? 'bg-gray-100 cursor-not-allowed text-gray-700' : ''}`}
          value={selected?.id ?? ''}
          onChange={isLocked ? undefined : handleChange}
          disabled={isLoading || isLocked}
          aria-disabled={isLocked}
        >
          <option value="">{isLoading ? 'Cargando...' : (isLocked ? 'Empresa bloqueada' : 'Seleccione una empresa')}</option>
          {!isLoading && list && list.length === 0 && <option value="">No hay empresas</option>}
          {!isLoading && list && list.map((e) => (
            <option key={e.id} value={e.id}>{e.nombre || e.nombre_corto || `Empresa ${e.id}`}</option>
          ))}
        </select>
        {isLocked && selected && (
          <p className="mt-1 text-xs text-gray-500">Asociada al analista. No editable.</p>
        )}
        {isLocked && !selected && !isLoading && (
          <p className="mt-1 text-xs text-red-600">Sin empresa asignada al usuario.</p>
        )}
        {error && <div className="text-sm text-red-600 mt-1">{String(error)}</div>}
      </div>
    </div>
  )
}

export default EmpresaSelector
