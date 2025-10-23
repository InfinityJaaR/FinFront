import React from 'react';
import { Plus, Search } from 'lucide-react';
// Corrección de rutas: Añadir extensiones para asegurar la resolución
import useEmpresas from '@/hooks/GestionEmpresas/Empresas/useEmpresa';
import EmpresaList from '@/components/GestionEmpresas/Empresas/EmpresaList';
// Corrección de la importación externa: Usar un hook dummy o comentario si no se define
// Ya que 'next/router' no se resuelve, lo reemplazamos por un hook de navegación simulado
const useRouter = () => ({ push: (path) => console.log(`Navigating to: ${path}`) });

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

    // Placeholder para la navegación
    const router = useRouter(); 

    // Funciones de acción de la tabla
    const handleView = (id) => {
        alert(`Ver detalles de la empresa: ${id}`);
        // router.push(`/empresas/${id}`);
    };

    const handleEdit = (id) => {
        alert(`Editar empresa: ${id}`);
        // router.push(`/empresas/edit/${id}`);
    };

    const handleNew = () => {
        alert('Ir a la página de creación de empresa');
        // router.push('/empresas/create');
    };

    return (
        <div className="p-8 space-y-8 bg-gray-50 min-h-screen">
            <header className="flex justify-between items-center pb-4 border-b border-gray-200">
                <h1 className="text-3xl font-extrabold text-gray-900">Gestión de Empresas</h1>
                <button
                    onClick={handleNew}
                    className="flex items-center px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition duration-300"
                >
                    <Plus size={20} className="mr-2" />
                    Nueva Empresa
                </button>
            </header>

            {/* Herramientas de búsqueda y filtro */}
            <div className="flex justify-between items-center space-x-4">
                <div className="relative flex-grow max-w-lg">
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
