import React from 'react'

const ProyeccionList = ({ proyecciones = [], onDelete, onView, onGenerate }) => {
  if (!proyecciones || proyecciones.length === 0) return <div>No hay proyecciones</div>

  return (
    <table className="min-w-full border-collapse">
      <thead>
        <tr>
          <th className="border px-2 py-1 text-left">ID</th>
          <th className="border px-2 py-1 text-left">Método</th>
          <th className="border px-2 py-1 text-left">Año</th>
          <th className="border px-2 py-1 text-left">Creado</th>
          <th className="border px-2 py-1 text-left">Acciones</th>
        </tr>
      </thead>
      <tbody>
        {proyecciones.map((p) => (
          <tr key={p.id}>
            <td className="border px-2 py-1">{p.id}</td>
            <td className="border px-2 py-1">{p.metodo_usado}</td>
            <td className="border px-2 py-1">{p.periodo_proyectado}</td>
            <td className="border px-2 py-1">{p.created_at || '-'}</td>
            <td className="border px-2 py-1 space-x-2">
              {onView && (
                <button className="text-blue-600" onClick={() => onView(p.id)}>Ver</button>
              )}
              {onGenerate && (
                <button className="text-green-600" onClick={() => onGenerate(p)}>Generar</button>
              )}
              {onDelete && (
                <button className="text-red-600" onClick={() => onDelete(p.id)}>Eliminar</button>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export default ProyeccionList
