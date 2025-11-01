import axios from 'axios';
// Importa la URL base (ruta correcta)
import url from '../../utils/url'; 

const RATIOS_API_URL = `${url}ratios/definiciones`;

/**
 * Función auxiliar para obtener los headers de autenticación (Bearer Token)
 * Se asume que el token está en localStorage.
 * NOTA: Esta función DEBERÍA estar centralizada en un archivo de utilidad o AuthService.
 */
const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return token
        ? { Authorization: `Bearer ${token}` }
        : {};
};

class RatioDefinicionService {

    /**
     * [1. INDEX] OBTENER una lista paginada de definiciones de ratios.
     * GET /api/ratios/definiciones?page=X&search=Y
     * @param {number} page - Número de página.
     * @param {string} search - Término de búsqueda opcional.
     * @returns {Promise<Object>} Objeto con la data paginada.
     */
    async getAllRatios(page = 1, search = '') {
        try {
            const query = `?page=${page}${search ? `&search=${search}` : ''}`;
            const response = await axios.get(`${RATIOS_API_URL}${query}`, {
                headers: getAuthHeaders(),
            });
            // El controlador retorna { success: true, data: data_paginada }
            return response.data.data; 
        } catch (error) {
            // Loguear detalle de la respuesta del servidor si existe para facilitar el debugging
            if (error.response && error.response.data) {
                console.error('Respuesta del servidor (ratios):', error.response.data);
            } else {
                console.error('Error al obtener la lista de definiciones de ratios:', error);
            }
            // Lanzar un Error más claro con el mensaje del servidor si está disponible
            const serverMessage = error.response?.data?.message || error.message || 'Error en la petición';
            throw new Error(serverMessage);
        }
    }

    /**
     * [4. SHOW] OBTENER los detalles de una definición de ratio.
     * GET /api/ratios/definiciones/{id}
     * @param {number} id - El ID de la definición de ratio.
     * @returns {Promise<Object>} El objeto RatioDefinicion con componentes y benchmarks.
     */
    async getRatioDefinicion(id) {
        try {
            const response = await axios.get(`${RATIOS_API_URL}/${id}`, {
                headers: getAuthHeaders(),
            });
            // El controlador retorna { success: true, data: ratio }
            return response.data.data; 
        } catch (error) {
            console.error(`Error al obtener la definición de ratio con ID ${id}:`, error);
            throw error;
        }
    }

    /**
     * [3. CREATE DATA] OBTENER datos necesarios para el formulario de creación.
     * GET /api/ratios/definiciones/create
     * @returns {Promise<Object>} Data inicial (ej: conceptos_disponibles para armar la fórmula).
     */
    async getRatioCreationData() {
        try {
            const response = await axios.get(`${RATIOS_API_URL}/create`, {
                headers: getAuthHeaders(),
            });
            return response.data;
        } catch (error) {
            console.error('Error al obtener datos para creación de ratio:', error);
            throw error;
        }
    }

    /**
     * [2. STORE] CREAR una nueva definición de ratio.
     * POST /api/ratios/definiciones
     * @param {Object} ratioData - Datos del nuevo ratio ({ codigo, nombre, formula, sentido, componentes[] }).
     * @returns {Promise<Object>} La respuesta del servidor, incluyendo el ratio creado.
     */
    async createRatio(ratioData) {
        try {
            const response = await axios.post(RATIOS_API_URL, ratioData, {
                headers: getAuthHeaders(),
            });
            // El controlador retorna { success: true, message, data: ratio } con código 201
            return response.data;
        } catch (error) {
            console.error('Error al crear la definición de ratio:', error);
            // Captura errores de validación (422) o permisos (403)
            throw error;
        }
    }

    /**
     * [4. UPDATE] ACTUALIZAR una definición de ratio.
     * PUT /api/ratios/definiciones/{id}
     * @param {number} id - El ID de la definición a actualizar.
     * @param {Object} ratioData - Los datos actualizados.
     * @returns {Promise<Object>} La respuesta del servidor, incluyendo el ratio actualizado.
     */
    async updateRatio(id, ratioData) {
        try {
            const response = await axios.put(`${RATIOS_API_URL}/${id}`, ratioData, {
                headers: getAuthHeaders(),
            });
            // El controlador retorna { success: true, message, data: ratio } con código 200
            return response.data;
        } catch (error) {
            console.error(`Error al actualizar la definición de ratio con ID ${id}:`, error);
            throw error;
        }
    }

    /**
     * [5. DESTROY] ELIMINAR una definición de ratio.
     * DELETE /api/ratios/definiciones/{id}
     * @param {number} id - El ID de la definición de ratio a eliminar.
     * @returns {Promise<Object>} Respuesta de éxito.
     */
    async deleteRatio(id) {
        try {
            // El controlador retorna 200 con un mensaje de éxito, o 500 si hay dependencias.
            await axios.delete(`${RATIOS_API_URL}/${id}`, {
                headers: getAuthHeaders(),
            });
            return { success: true, message: "Definición de Ratio eliminada exitosamente." };
        } catch (error) {
            console.error(`Error al eliminar la definición de ratio con ID ${id}:`, error);
            // Captura el error 500 (restricción de FK)
            if (error.response && error.response.status === 500) {
                throw new Error(error.response.data.message || 'No se pudo eliminar la definición de ratio debido a que está asociada a valores calculados (RatioValor).');
            }
            throw error;
        }
    }
}

export default new RatioDefinicionService();
