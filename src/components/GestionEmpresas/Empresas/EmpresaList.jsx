import React from 'react';
// Corrección de la importación: Asegurar que se puede resolver la ruta
import EmpresaActions from './EmpresaActions.jsx'; 
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';


/**
 * Componente que muestra la lista de empresas en formato de tabla y maneja la paginación.
 */
const EmpresaList = ({
    empresas, 
    pagination, 
    isLoading, 
    error, 
    onDelete, 
    onView, 
    onEdit, 
    onPageChange
}) => {
    
    // Si está cargando y no hay datos previos
    if (isLoading && (!pagination || pagination.current_page === undefined)) {
        return (
            <div className="flex justify-center items-center h-40">
                <Loader2 className="animate-spin text-indigo-500 mr-2" size={24} />
                <p className="text-gray-600">Cargando empresas...</p>
            </div>
        );
    }

    // Si hay un error
    if (error) {
        return (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                <strong className="font-bold">Error: </strong>
                <span className="block sm:inline">{error}</span>
            </div>
        );
    }
    
    // Asegurarnos de que 'empresas' sea un array para evitar errores si el hook/servicio devuelve otra forma
    const empresasArray = Array.isArray(empresas) ? empresas : [];

    // Si no hay empresas
    if (empresasArray.length === 0) {
        return (
            <div className="text-center py-10 text-gray-500">
                No se encontraron empresas registradas.
            </div>
        );
    }

    // Normalizamos la paginación con valores por defecto
    const { current_page = 1, last_page = 1, total = 0, per_page = empresasArray.length } = pagination || {};

    // Calculamos el índice de inicio para mostrar en el mensaje de paginación
    const fromIndex = (current_page - 1) * per_page + 1;
    // Calculamos el índice final
    const toIndex = fromIndex + empresasArray.length - 1;

    return (
        <div className="bg-white shadow-xl rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Código</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rubro</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {empresasArray.map((empresa) => (
                            <tr key={empresa.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {empresa.codigo}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                    {empresa.nombre}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                    {/* Asumimos que la relación rubro se carga en el index del backend si es necesario */}
                                    {empresa.rubro ? empresa.rubro.nombre : 'N/A'} 
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
  <div className="flex items-center justify-center gap-2">
    <EmpresaActions
      empresa={empresa}
      onView={onView}
      onEdit={onEdit}
      onDelete={onDelete}
    />

    {/* Botón Ratios con mismo look & feel que los otros */}
    <Link
      to={`/dashboard/empresas/${empresa.id}/ratios`}
      className="inline-flex items-center gap-2 px-3 py-2 rounded-xl
             bg-zinc-900 text-gray-100 hover:bg-zinc-800
             focus:outline-none focus:ring-2 focus:ring-zinc-400/40
             transition-colors"
      title="Ver Ratios"
    >
      {/* lucide-react icon opcional */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-4 w-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 3v18h18" />
        <path d="M19 9l-5 5-3-3-4 4" />
      </svg>
      <span >Ver Ratios</span>
    </Link>
  </div>
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

export default EmpresaList;
