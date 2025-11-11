import React, { useState } from 'react';
import { Plus, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import useUsers from '@/hooks/GestionUsuarios/useUsers';
import UserTable from '@/components/GestionUsuarios/UserTable';
import UserFormModal from '@/components/GestionUsuarios/UserFormModal';
import UserStats from '@/components/GestionUsuarios/UserStats';

/**
 * Página principal de gestión de usuarios
 */
const UsersPage = () => {
    const {
        users,
        empresas,
        analistaRole,
        isLoading,
        error,
        filters,
        setFilters,
        handleCreateUser,
        handleUpdateUser,
        handleDeactivateUser,
        handleReactivateUser,
        handleDeleteUser
    } = useUsers();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Abrir modal para crear
    const handleNew = () => {
        setSelectedUser(null);
        setIsModalOpen(true);
    };

    // Abrir modal para editar
    const handleEdit = (user) => {
        setSelectedUser(user);
        setIsModalOpen(true);
    };

    // Cerrar modal
    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedUser(null);
    };

    // Enviar formulario
    const handleFormSubmit = async (userData) => {
        if (selectedUser) {
            // Edición
            return await handleUpdateUser(selectedUser.id, userData);
        } else {
            // Creación
            return await handleCreateUser(userData);
        }
    };

    // Filtrar usuarios por término de búsqueda
    const filteredUsers = users.filter(user => {
        const matchesSearch = 
            user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.empresa?.nombre?.toLowerCase().includes(searchTerm.toLowerCase());
        
        return matchesSearch;
    });

    return (
        <div className="p-8 space-y-8 bg-gray-50 min-h-screen">
            {/* Header */}
            <header className="flex justify-between items-center pb-4 border-b border-gray-200">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900">
                        Gestión de Usuarios
                    </h1>
                    <p className="text-gray-600 mt-1">
                        Administra los usuarios Analistas Financieros del sistema
                    </p>
                </div>
                <Button 
                    onClick={handleNew} 
                    variant="primary" 
                    size="lg" 
                    className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-blue-500 hover:from-indigo-700 hover:to-blue-600"
                >
                    <Plus size={18} />
                    Nuevo Usuario
                </Button>
            </header>

            {/* Estadísticas */}
            <UserStats users={users} />

            {/* Filtros y búsqueda */}
            <div className="bg-white p-4 rounded-lg shadow-md">
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Búsqueda */}
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Buscar por nombre, email o empresa..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-150"
                        />
                    </div>

                    {/* Filtro por estado */}
                    <div className="flex items-center gap-2">
                        <Filter className="text-gray-400" size={20} />
                        <select
                            value={filters.active}
                            onChange={(e) => setFilters({ ...filters, active: e.target.value })}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-150"
                        >
                            <option value="todos">Todos los usuarios</option>
                            <option value="true">Solo activos</option>
                            <option value="false">Solo inactivos</option>
                        </select>
                    </div>

                    {/* Filtro por empresa */}
                    <div className="flex items-center gap-2">
                        <select
                            value={filters.empresa_id || ''}
                            onChange={(e) => setFilters({ 
                                ...filters, 
                                empresa_id: e.target.value || undefined 
                            })}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-150"
                        >
                            <option value="">Todas las empresas</option>
                            <option value="null">Sin empresa</option>
                            {empresas.map((empresa) => (
                                <option key={empresa.id} value={empresa.id}>
                                    {empresa.nombre}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Contador de usuarios */}
            <div className="flex items-center gap-4 text-sm text-gray-600">
                <span className="font-medium">
                    Total: {filteredUsers.length} usuario{filteredUsers.length !== 1 ? 's' : ''}
                </span>
                <span>|</span>
                <span>
                    Activos: {filteredUsers.filter(u => u.active).length}
                </span>
                <span>|</span>
                <span>
                    Inactivos: {filteredUsers.filter(u => !u.active).length}
                </span>
            </div>

            {/* Mensajes de error */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-600">{error}</p>
                </div>
            )}

            {/* Tabla de usuarios */}
            {isLoading ? (
                <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent"></div>
                    <span className="ml-3 text-gray-600">Cargando usuarios...</span>
                </div>
            ) : (
                <UserTable
                    users={filteredUsers}
                    onEdit={handleEdit}
                    onDeactivate={handleDeactivateUser}
                    onReactivate={handleReactivateUser}
                    onDelete={handleDeleteUser}
                />
            )}

            {/* Modal de formulario */}
            <UserFormModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSubmit={handleFormSubmit}
                user={selectedUser}
                empresas={empresas}
                analistaRole={analistaRole}
            />
        </div>
    );
};

export default UsersPage;
