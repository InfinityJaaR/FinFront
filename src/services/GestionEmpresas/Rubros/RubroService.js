import axios from 'axios';
import url from '../../utils/url'; // Importa la URL base (ruta correcta)

const RUBROS_API_URL = `${url}rubros`;

/**
 * Función auxiliar para obtener los headers de autenticación (Bearer Token)
 * Se asume que el token está en localStorage.
 * Si ya tienes esta función en otro lugar (como AuthService.js), puedes importarla en su lugar.
 */
const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return token
        ? { Authorization: `Bearer ${token}` }
        : {};
};

class RubroService {

    /**
     * 1. OBTENER todos los rubros (Index)
     * GET /api/rubros
     * @returns {Promise<Array<Object>>} Lista de rubros.
     */
    async getAllRubros() {
        try {
            const response = await axios.get(RUBROS_API_URL, {
                headers: getAuthHeaders(),
            });
            // El controlador retorna directamente la colección de rubros (array)
            return response.data;
        } catch (error) {
            console.error('Error al obtener todos los rubros:', error);
            throw error;
        }
    }

    /**
     * 3. OBTENER un rubro específico (Show)
     * GET /api/rubros/{id}
     * @param {number} id El ID del rubro a buscar.
     * @returns {Promise<Object>} El objeto rubro.
     */
    async getRubro(id) {
        try {
            const response = await axios.get(`${RUBROS_API_URL}/${id}`, {
                headers: getAuthHeaders(),
            });
            // El controlador retorna directamente el objeto rubro
            return response.data;
        } catch (error) {
            console.error(`Error al obtener el rubro con ID ${id}:`, error);
            throw error;
        }
    }

    /**
     * 2. CREAR un nuevo rubro (Store)
     * POST /api/rubros
     * @param {Object} rubroData Los datos del nuevo rubro (código, nombre, etc.).
     * @returns {Promise<Object>} La respuesta del servidor, incluyendo el rubro creado.
     */
    async createRubro(rubroData) {
        try {
            // Envía los datos que deben coincidir con RubroStoreRequest
            const response = await axios.post(RUBROS_API_URL, rubroData, {
                headers: getAuthHeaders(),
            });
            // El controlador retorna { message, rubro } con código 201
            return response.data;
        } catch (error) {
            console.error('Error al crear el rubro:', error);
            // El controlador de Laravel retorna errores de validación con código 422
            throw error;
        }
    }

    /**
     * 4. ACTUALIZAR un rubro (Update)
     * PUT /api/rubros/{id}
     * @param {number} id El ID del rubro a actualizar.
     * @param {Object} rubroData Los datos actualizados.
     * @returns {Promise<Object>} La respuesta del servidor, incluyendo el rubro actualizado.
     */
    async updateRubro(id, rubroData) {
        try {
            // Envía los datos que deben coincidir con RubroUpdateRequest
            const response = await axios.put(`${RUBROS_API_URL}/${id}`, rubroData, {
                headers: getAuthHeaders(),
            });
            // El controlador retorna { message, rubro } con código 200
            return response.data;
        } catch (error) {
            console.error(`Error al actualizar el rubro con ID ${id}:`, error);
            throw error;
        }
    }

    /**
     * 5. ELIMINAR un rubro (Destroy)
     * DELETE /api/rubros/{id}
     * @param {number} id El ID del rubro a eliminar.
     * @returns {Promise<void>}
     */
    async deleteRubro(id) {
        try {
            // El controlador retorna 204 (No Content) o 409 (Conflict si tiene empresas)
            await axios.delete(`${RUBROS_API_URL}/${id}`, {
                headers: getAuthHeaders(),
            });
        } catch (error) {
            console.error(`Error al eliminar el rubro con ID ${id}:`, error);
            // Captura el error 409 (Conflict) específico de tu controlador
            if (error.response && error.response.status === 409) {
                // Relanza el error con un mensaje más claro
                throw new Error(error.response.data.message || 'No se pudo eliminar el rubro debido a registros asociados.');
            }
            throw error;
        }
    }

    /**
     * Crear o actualizar un benchmark para un rubro y ratio.
     * POST /api/rubros/{rubroId}/benchmarks
     * @param {number} rubroId
     * @param {Object} payload { ratio_id, valor_promedio, fuente }
     */
    async createBenchmark(rubroId, payload) {
        try {
            const response = await axios.post(`${RUBROS_API_URL}/${rubroId}/benchmarks`, payload, {
                headers: getAuthHeaders(),
            });
            return response.data;
        } catch (error) {
            console.error(`Error al crear benchmark para rubro ${rubroId}:`, error.response?.data || error.message || error);
            throw error;
        }
    }

    /**
     * Obtener benchmarks de un rubro
     * GET /api/rubros/{rubroId}/benchmarks
     * @param {number} rubroId
     */
    async getBenchmarks(rubroId) {
        try {
            const response = await axios.get(`${RUBROS_API_URL}/${rubroId}/benchmarks`, {
                headers: getAuthHeaders(),
            });
            return response.data; // puede ser array o { data: [...] }
        } catch (error) {
            console.error(`Error al obtener benchmarks para rubro ${rubroId}:`, error.response?.data || error.message || error);
            throw error;
        }
    }
}

export default new RubroService();
