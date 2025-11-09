import React from 'react'

const ProyeccionDetailsModal = ({ open, onClose, data }) => {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-lg w-11/12 max-w-2xl p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Detalle de Proyección</h3>
          <button onClick={onClose} className="text-gray-600">Cerrar</button>
        </div>

        {!data ? (
          <div>Cargando...</div>
        ) : (
          <div className="space-y-2">
            <div><strong>ID:</strong> {data.proyeccion?.id ?? data.id}</div>
            <div><strong>Método:</strong> {data.proyeccion?.metodo_usado ?? data.metodo_usado}</div>
            <div><strong>Año:</strong> {data.proyeccion?.periodo_proyectado ?? data.periodo_proyectado}</div>
            <div><strong>Detalles (primeros meses):</strong></div>
            <div className="overflow-auto max-h-64 border rounded p-2 bg-gray-50">
              <table className="min-w-full">
                <thead>
                  <tr>
                    <th className="text-left pr-2">Fecha</th>
                    <th className="text-left">Monto</th>
                  </tr>
                </thead>
                <tbody>
                  {(data.detalles || data.detalles_proyeccion || []).slice(0, 50).map((d, i) => (
                    <tr key={i}>
                      <td className="pr-2">{d.fecha_proyectada || d.fecha}</td>
                      <td>{d.monto_proyectado ?? d.monto ?? d.valor}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ProyeccionDetailsModal
