import React from 'react';
import EmpresaActions from './EmpresaActions.jsx';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button'
import Pagination from '@/components/ui/Pagination'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'


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
            <Alert variant="destructive">
              <svg xmlns="http://www.w3.org/2000/svg" className="size-4 text-red-600" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 8v4m0 4h.01" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
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
            {/* Mobile cards */}
            <div className="sm:hidden p-4 space-y-3">
                {empresasArray.map(e => (
                    <div key={e.id} className="border rounded-lg p-3 bg-white">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <div className="text-sm font-semibold text-indigo-700">{e.codigo}</div>
                                <div className="text-sm text-gray-800">{e.nombre}</div>
                            </div>
                            <div className="text-xs text-gray-500">{e.rubro ? e.rubro.nombre : 'N/A'}</div>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex-1">
                                {/* acciones */}
                                <EmpresaActions empresa={e} onView={onView} onEdit={onEdit} onDelete={onDelete} />
                            </div>
                            <Link to={`/dashboard/empresas/${e.id}/ratios`} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-900 text-gray-100 hover:bg-zinc-800">Ver Ratios</Link>
                        </div>
                    </div>
                ))}
            </div>

            {/* Table for sm+ screens */}
            <div className="hidden sm:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 table-auto">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Código</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rubro</th>
                            <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {empresasArray.map((empresa) => (
                            <tr key={empresa.id} className="hover:bg-gray-50">
                                <td className="px-3 py-3 align-top text-sm font-medium text-gray-900 break-words max-w-xs">{empresa.codigo}</td>
                                <td className="px-3 py-3 align-top text-sm text-gray-700 break-words max-w-xs">{empresa.nombre}</td>
                                <td className="px-3 py-3 align-top text-sm text-gray-700 break-words max-w-xs">{empresa.rubro ? empresa.rubro.nombre : 'N/A'}</td>
                                <td className="px-3 py-3 align-top text-center text-sm font-medium">
                                    <div className="flex items-center justify-center gap-2">
                                        <EmpresaActions empresa={empresa} onView={onView} onEdit={onEdit} onDelete={onDelete} />
                                        <Link to={`/dashboard/empresas/${empresa.id}/ratios`} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-900 text-gray-100 hover:bg-zinc-800">Ver Ratios</Link>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Paginación: reemplazamos por componente reutilizable que maneja páginas numéricas */}
            { (last_page > 1) && (
              <Pagination pagination={{ current_page, last_page, total, per_page }} onPageChange={onPageChange} isLoading={isLoading} />
            ) }
        </div>
    );
};

export default EmpresaList;
