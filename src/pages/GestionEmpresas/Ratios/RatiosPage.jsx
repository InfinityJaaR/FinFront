import React from 'react';
import { Plus, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
// Corrección de rutas: usar alias @ para resolver desde src
import useRatios from '@/hooks/GestionEmpresas/Ratios/useRatios';
import RatioList from '@/components/GestionEmpresas/Ratios/RatioList';

const RatiosPage = () => {
    const {
        ratios,
        pagination,
        isLoading,
        error,
        searchTerm,
        setSearchTerm,
        setCurrentPage,
        handleDeleteRatio,
    } = useRatios();

    const navigate = useNavigate();

    // Funciones de acción de la tabla
    const handleView = (id) => {
        navigate(`/dashboard/gestion-empresas/definicion-ratios/${id}`);
    };

    const handleEdit = (id) => {
        navigate(`/dashboard/gestion-empresas/definicion-ratios/${id}/edit`);
    };

    const handleNew = () => {
        navigate('/dashboard/gestion-empresas/definicion-ratios/create');
    };

    return (
        <div className="p-4 sm:p-8 space-y-6 bg-gray-50 min-h-screen">
            <header className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 pb-2 border-b border-gray-200">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">Definiciones de Ratios Financieros</h1>
                <div className="w-full sm:w-auto flex justify-start sm:justify-end">
                  <button onClick={handleNew} className="flex items-center px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition duration-300 w-full sm:w-auto">
                    <Plus size={20} className="mr-2" />
                    <span className="truncate">Nueva Definición</span>
                  </button>
                </div>
            </header>

            {/* Herramientas de búsqueda y filtro */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="relative w-full sm:max-w-lg">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar por código o nombre..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-150"
                    />
                </div>
            </div>

            {/* Listado de Ratios */}
            <RatioList
                ratios={ratios}
                pagination={pagination}
                isLoading={isLoading}
                error={error}
                onDelete={handleDeleteRatio}
                onView={handleView}
                onEdit={handleEdit}
                onPageChange={setCurrentPage}
            />
        </div>
    );
};

export default RatiosPage;