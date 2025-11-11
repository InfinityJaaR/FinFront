import { useState, useEffect, useCallback } from 'react';
import userService from '@/services/GestionUsuarios/userService';
import empresasService from '@/services/GestionEmpresas/Empresas/EmpresasService';
import { useModal } from '@/context/ModalContext';


/**
 * Hook personalizado para gestionar usuarios
 */
const useUsers = () => {
    const [users, setUsers] = useState([]);
    const [empresas, setEmpresas] = useState([]);
    const [analistaRole, setAnalistaRole] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState({
        active: 'todos', // 'todos', true, false
        empresa_id: undefined
    });
    const modal = useModal();

    /**
     * Cargar usuarios con filtros
     */
    const fetchUsers = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await userService.getUsers(filters);
            const usersData = response.users || response.data || response || [];
            setUsers(Array.isArray(usersData) ? usersData : []);
        } catch (err) {
            setError('Error al cargar usuarios. Por favor, intente de nuevo.');
            console.error('Error al cargar usuarios:', err);
            setUsers([]);
        } finally {
            setIsLoading(false);
        }
    }, [filters]);

    /**
     * Cargar empresas para el selector
     */
    const fetchEmpresas = useCallback(async () => {
        try {
            const data = await empresasService.getEmpresasBasic();
            console.log('Empresas cargadas:', data); // Debug
            setEmpresas(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Error al cargar empresas:', err);
            setEmpresas([]);
        }
    }, []);

    /**
     * Obtener el rol de Analista Financiero
     */
    const fetchAnalistaRole = useCallback(async () => {
        try {
            const role = await userService.getAnalistaFinancieroRole();
            setAnalistaRole(role);
        } catch (err) {
            console.error('Error al obtener rol de Analista:', err);
            // Fallback con ID conocido
            setAnalistaRole({ id: 2, name: 'Analista Financiero' });
        }
    }, []);

    /**
     * Crear un nuevo usuario
     */
    const handleCreateUser = async (userData) => {
        try {
            await userService.createUser(userData);
            await modal.alert({
                title: 'Éxito',
                message: 'Usuario creado correctamente',
                iconType: 'success'
            });
            fetchUsers();
            return true;
        } catch (err) {
            const errorMsg = err.response?.data?.message 
                || err.response?.data?.error
                || err.message 
                || 'Error al crear usuario';
            
            await modal.alert({
                title: 'Error',
                message: errorMsg,
                iconType: 'error'
            });
            console.error('Error al crear usuario:', err);
            return false;
        }
    };

    /**
     * Actualizar un usuario existente
     */
    const handleUpdateUser = async (id, userData) => {
        try {
            await userService.updateUser(id, userData);
            await modal.alert({
                title: 'Éxito',
                message: 'Usuario actualizado correctamente',
                iconType: 'success'
            });
            fetchUsers();
            return true;
        } catch (err) {
            const errorMsg = err.response?.data?.message 
                || err.response?.data?.error
                || err.message 
                || 'Error al actualizar usuario';
            
            await modal.alert({
                title: 'Error',
                message: errorMsg,
                iconType: 'error'
            });
            console.error('Error al actualizar usuario:', err);
            return false;
        }
    };

    /**
     * Desactivar un usuario
     */
    const handleDeactivateUser = async (id) => {
        const confirmed = await modal.confirm({
            title: 'Confirmar desactivación',
            message: '¿Está seguro de que desea desactivar este usuario?',
            okVariant: 'warning',
            iconType: 'warning'
        });

        if (!confirmed) return false;

        try {
            await userService.deactivateUser(id);
            await modal.alert({
                title: 'Éxito',
                message: 'Usuario desactivado correctamente',
                iconType: 'success'
            });
            fetchUsers();
            return true;
        } catch (err) {
            await modal.alert({
                title: 'Error',
                message: err.response?.data?.message || 'Error al desactivar usuario',
                iconType: 'error'
            });
            console.error('Error al desactivar usuario:', err);
            return false;
        }
    };

    /**
     * Reactivar un usuario
     */
    const handleReactivateUser = async (id) => {
        const confirmed = await modal.confirm({
            title: 'Confirmar reactivación',
            message: '¿Está seguro de que desea reactivar este usuario?',
            okVariant: 'primary',
            iconType: 'info'
        });

        if (!confirmed) return false;

        try {
            await userService.reactivateUser(id);
            await modal.alert({
                title: 'Éxito',
                message: 'Usuario reactivado correctamente',
                iconType: 'success'
            });
            fetchUsers();
            return true;
        } catch (err) {
            await modal.alert({
                title: 'Error',
                message: err.response?.data?.message || 'Error al reactivar usuario',
                iconType: 'error'
            });
            console.error('Error al reactivar usuario:', err);
            return false;
        }
    };

    /**
     * Eliminar permanentemente un usuario
     */
    const handleDeleteUser = async (id) => {
        const confirmed = await modal.confirm({
            title: 'Confirmar eliminación permanente',
            message: '¿Está seguro de que desea eliminar permanentemente este usuario? Esta acción no se puede deshacer.',
            okVariant: 'danger',
            iconType: 'warning'
        });

        if (!confirmed) return false;

        try {
            await userService.deleteUserPermanent(id);
            await modal.alert({
                title: 'Éxito',
                message: 'Usuario eliminado permanentemente',
                iconType: 'success'
            });
            fetchUsers();
            return true;
        } catch (err) {
            await modal.alert({
                title: 'Error',
                message: err.response?.data?.message || 'Error al eliminar usuario',
                iconType: 'error'
            });
            console.error('Error al eliminar usuario:', err);
            return false;
        }
    };

    // Cargar datos iniciales
    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    useEffect(() => {
        fetchEmpresas();
        fetchAnalistaRole();
    }, [fetchEmpresas, fetchAnalistaRole]);

    return {
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
        handleDeleteUser,
        refreshUsers: fetchUsers
    };
};

export default useUsers;
