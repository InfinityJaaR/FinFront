import React from 'react';
// Importación corregida de acciones
import RatioActions from './RatioActions.jsx'; 
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

/**
 * Componente que muestra la lista de Definiciones de Ratios en formato de tabla.
 */
const RatioList = ({
    ratios, 
    pagination, 
    isLoading, 
    error, 
    onDelete, 
    onView, 
    onEdit, 
    onPageChange
}) => {
    
    // Lógica de carga y error simplificada
    if (isLoading && (!pagination || pagination.current_page === undefined)) {
        return (
            <div className="flex justify-center items-center h-40">
                <Loader2 className="animate-spin text-indigo-500 mr-2" size={24} />
                <p className="text-gray-600">Cargando definiciones de ratios...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                <strong className="font-bold">Error: </strong>
                <span className="block sm:inline">{error}</span>
            </div>
        );
    }
    
    const ratiosArray = Array.isArray(ratios) ? ratios : [];

    if (ratiosArray.length === 0) {
        return (
            <div className="text-center py-10 text-gray-500">
                No se encontraron definiciones de ratios registradas.
            </div>
        );
    }

    const { current_page = 1, last_page = 1, total = 0, per_page = ratiosArray.length } = pagination || {};

    const fromIndex = (current_page - 1) * per_page + 1;
    const toIndex = fromIndex + ratiosArray.length - 1;

    return (
        <div className="bg-white shadow-xl rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Código</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fórmula</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sentido</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {ratiosArray.map((ratio) => (
                            <tr key={ratio.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {ratio.codigo}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                    {ratio.nombre}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 max-w-xs overflow-hidden text-ellipsis">
                                    {ratio.formula}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                    {ratio.sentido}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    <RatioActions 
                                        ratio={ratio}
                                        onView={onView}
                                        onEdit={onEdit}
                                        onDelete={onDelete}
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Paginación */}
            {last_page > 1 && (
                <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                    <p className="text-sm text-gray-700">
                        Mostrando <span className="font-medium">{fromIndex}</span> a <span className="font-medium">{toIndex}</span> de <span className="font-medium">{total}</span> resultados
                    </p>
                    <div className="flex-1 flex justify-end">
                        <button
                            onClick={() => onPageChange(current_page - 1)}
                            disabled={current_page === 1 || isLoading}
                            className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-l-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                        >
                            <ChevronLeft size={16} className="mr-2" />
                            Anterior
                        </button>
                        <button
                            onClick={() => onPageChange(current_page + 1)}
                            disabled={current_page === last_page || isLoading}
                            className="-ml-px relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-r-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                        >
                            Siguiente
                            <ChevronRight size={16} className="ml-2" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RatioList;