import React from 'react';
import { TrendingUp } from 'lucide-react';
import RubroActionsCell from './RubroActionsCell'; // Importa el componente de acciones

/**
 * Componente de tabla para mostrar la lista de Rubros.
 * @param {Object} props
 * @param {Array<Object>} props.rubros Lista de rubros.
 * @param {Function} props.onEdit Función para abrir el modal de edición.
 * @param {Function} props.onDelete Función para manejar la eliminación.
 * @param {boolean} props.isSubmitting Estado de envío (para deshabilitar botones).
 */
const RubroTable = ({ rubros, onEdit, onDelete, isSubmitting }) => {
    
    // Si la lista está vacía
    if (rubros.length === 0) {
        return (
            <div className="text-center py-10 text-gray-500">
                <TrendingUp className="h-10 w-10 mx-auto mb-3 text-gray-300" />
                <p className="text-lg">No hay rubros registrados.</p>
                <p className="text-sm mt-1">Utiliza el botón 'Nuevo Rubro' para agregar uno.</p>
            </div>
        );
    }
    
    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider rounded-tl-xl">Código / Nombre</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descripción</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">P. Ácida</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">P. Liquidez</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">P. Apalancamiento</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">P. Rentabilidad</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider rounded-tr-xl">Acciones</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {rubros.map((rubro) => (
                        <tr key={rubro.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-semibold text-blue-700">{rubro.codigo}</div>
                                <div className="text-sm text-gray-800">{rubro.nombre}</div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500 max-w-sm truncate">{rubro.descripcion || 'N/A'}</td>
                            
                            {/* Celdas de Promedio - Usamos font-mono para números */}
                            <td className="px-6 py-4 text-center text-sm font-mono">{rubro.promedio_prueba_acida || '-'}</td>
                            <td className="px-6 py-4 text-center text-sm font-mono">{rubro.promedio_liquidez_corriente || '-'}</td>
                            <td className="px-6 py-4 text-center text-sm font-mono">{rubro.promedio_apalancamiento || '-'}</td>
                            <td className="px-6 py-4 text-center text-sm font-mono">{rubro.promedio_rentabilidad || '-'}</td>
                            
                            {/* Celda de Acciones */}
                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                <RubroActionsCell 
                                    rubro={rubro} 
                                    onEdit={onEdit} 
                                    onDelete={onDelete} 
                                    isSubmitting={isSubmitting}
                                />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default RubroTable;
