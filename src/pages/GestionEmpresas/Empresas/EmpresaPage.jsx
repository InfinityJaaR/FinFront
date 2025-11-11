import React from 'react';
import { Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom';
// Corrección de rutas: Añadir extensiones para asegurar la resolución
import useEmpresas from '@/hooks/GestionEmpresas/Empresas/useEmpresa';
import EmpresaList from '@/components/GestionEmpresas/Empresas/EmpresaList';

const EmpresasPage = () => {
    // Usamos el hook para obtener el estado y las funciones de acción
    const {
        empresas,
        pagination,
        isLoading,
        error,
        searchTerm,
        setSearchTerm,
        setCurrentPage,
        handleDeleteEmpresa,
    } = useEmpresas();

    // Navegación real con react-router
    const navigate = useNavigate();

    // Funciones de acción de la tabla
    const handleView = (id) => {
        navigate(`/dashboard/gestion-empresas/empresas/${id}`);
    };

    const handleEdit = (id) => {
        navigate(`/dashboard/gestion-empresas/empresas/${id}/edit`);
    };

    const handleNew = () => {
        navigate('/dashboard/gestion-empresas/empresas/create');
    };

    return (
        <div className="p-4 sm:p-8 space-y-6 bg-gray-50 min-h-screen">
                <header className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 pb-2 border-b border-gray-200">
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">Gestión de Empresas</h1>
                    <div className="w-full sm:w-auto flex justify-start sm:justify-end">
                      <Button onClick={handleNew} variant="primary" size="lg" className="flex items-center gap-2 w-full sm:w-auto">
                          <Plus size={18} />
                          <span className="truncate">Nueva Empresa</span>
                      </Button>
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

            {/* Listado de Empresas */}
            <EmpresaList
                empresas={empresas}
                pagination={pagination}
                isLoading={isLoading}
                error={error}
                onDelete={handleDeleteEmpresa}
                onView={handleView}
                onEdit={handleEdit}
                onPageChange={setCurrentPage}
            />
        </div>
    );
};

export default EmpresasPage;
