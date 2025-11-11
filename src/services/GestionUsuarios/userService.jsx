import axios from 'axios';
import url from '../utils/url';

class UserService {
    /**
     * Obtiene todos los usuarios con filtros opcionales
     * @param {Object} filters - Filtros (active, empresa_id)
     * @returns {Promise} Lista de usuarios
     */
    async getUsers(filters = {}) {
        try {
            const token = localStorage.getItem('token');
            const params = new URLSearchParams();
            
            if (filters.active !== undefined && filters.active !== 'todos') {
                params.append('active', filters.active);
            }
            
            if (filters.empresa_id !== undefined) {
                params.append('empresa_id', filters.empresa_id);
            }

            const response = await axios.get(`${url}users?${params.toString()}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            return response.data;
        } catch (error) {
            console.error('Error al obtener usuarios:', error);
            throw error;
        }
    }

    /**
     * Obtiene un usuario por ID
     * @param {number} id - ID del usuario
     * @returns {Promise} Datos del usuario
     */
    async getUser(id) {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${url}users/${id}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            return response.data;
        } catch (error) {
            console.error('Error al obtener usuario:', error);
            throw error;
        }
    }

    /**
     * Crea un nuevo usuario
     * @param {Object} userData - Datos del usuario (name, email, role_id, empresa_id)
     * @returns {Promise} Usuario creado
     */
    async createUser(userData) {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(`${url}users`, userData, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            return response.data;
        } catch (error) {
            console.error('Error al crear usuario:', error);
            throw error;
        }
    }

    /**
     * Actualiza un usuario existente
     * @param {number} id - ID del usuario
     * @param {Object} userData - Datos a actualizar
     * @returns {Promise} Usuario actualizado
     */
    async updateUser(id, userData) {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.put(`${url}users/${id}`, userData, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            return response.data;
        } catch (error) {
            console.error('Error al actualizar usuario:', error);
            throw error;
        }
    }

    /**
     * Desactiva un usuario (soft delete)
     * @param {number} id - ID del usuario
     * @returns {Promise} Respuesta del servidor
     */
    async deactivateUser(id) {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.delete(`${url}users/${id}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            return response.data;
        } catch (error) {
            console.error('Error al desactivar usuario:', error);
            throw error;
        }
    }

    /**
     * Reactiva un usuario desactivado
     * @param {number} id - ID del usuario
     * @returns {Promise} Respuesta del servidor
     */
    async reactivateUser(id) {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.patch(`${url}users/${id}/reactivate`, {}, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            return response.data;
        } catch (error) {
            console.error('Error al reactivar usuario:', error);
            throw error;
        }
    }

    /**
     * Elimina permanentemente un usuario
     * @param {number} id - ID del usuario
     * @returns {Promise} Respuesta del servidor
     */
    async deleteUserPermanent(id) {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.delete(`${url}users/${id}/permanent`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            return response.data;
        } catch (error) {
            console.error('Error al eliminar usuario permanentemente:', error);
            throw error;
        }
    }

    /**
     * Obtiene el rol "Analista Financiero" 
     * Requiere que el backend tenga un endpoint o lo hacemos desde roles
     * @returns {Promise} Rol de Analista Financiero
     */
    async getAnalistaFinancieroRole() {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${url}roles/analista-financiero`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            
            return response.data.data;
        } catch (error) {
            console.error('Error al obtener rol Analista Financiero:', error);
            // Fallback: devolver un objeto con el ID conocido del seeder
            // Según el RolSeeder, "Analista Financiero" tiene ID 2
            return { id: 2, name: 'Analista Financiero' };
        }
    }
}

// Exportar una instancia única del servicio
export default new UserService();
