import React from 'react';
import { TrendingUp } from 'lucide-react';
import RubroActionsCell from './RubroActionsCell.jsx'; 

/**
 * Componente de tabla para mostrar la lista de Rubros.
 * Se asegura de que la estética esté alineada con Empresas y Ratios.
 */
const RubroTable = ({ rubros, onView, onEdit, onDelete, isSubmitting }) => {
    
    if (rubros.length === 0) {
        return (
            <div className="text-center py-10 text-gray-500">
                <TrendingUp className="h-10 w-10 mx-auto mb-3 text-gray-400" />
                <p className="text-lg">No hay rubros registrados.</p>
                <p className="text-sm mt-1">Utiliza el botón 'Nuevo Rubro' para agregar uno.</p>
            </div>
        );
    }
    
    return (
        // Contenedor principal con sombra y bordes redondeados, como en Empresas/Ratios
        <div className="bg-white shadow-xl rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 table-auto">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-3 py-2 sm:px-4 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Código / Nombre</th>
                            <th className="px-3 py-2 sm:px-4 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/3">Descripción</th>
                            <th className="px-3 py-2 sm:px-4 sm:py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {rubros.map((rubro) => (
                            <tr key={rubro.id} className="hover:bg-gray-50 transition-colors">
                                {/* Columna Código/Nombre: Estilo más limpio */}
                                <td className="px-3 py-2 sm:px-4 sm:py-3 align-top">
                                    <div className="text-sm font-semibold text-indigo-700">{rubro.codigo}</div>
                                    <div className="text-xs text-gray-800">{rubro.nombre}</div>
                                </td>
                                
                                {/* DESCRIPCIÓN: permitir wrap y limitar ancho en pantallas pequeñas */}
                                <td className="px-3 py-2 sm:px-4 sm:py-3 text-sm text-gray-600 max-w-xs sm:max-w-sm break-words">
                                    {rubro.descripcion || 'N/A'}
                                </td>

                                {/* Celda de Acciones */}
                                <td className="px-3 py-2 sm:px-4 sm:py-3 text-center text-sm font-medium">
                                    <RubroActionsCell 
                                        rubro={rubro} 
                                        onView={onView} 
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
        </div>
    );
};

export default RubroTable;