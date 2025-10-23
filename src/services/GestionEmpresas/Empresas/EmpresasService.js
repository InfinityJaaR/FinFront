import axios from 'axios';
// Importa la URL base (ruta correcta)
import url from '../../utils/url'; 

const EMPRESAS_API_URL = `${url}empresas`;

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

class EmpresaService {

    /**
     * [1. INDEX] OBTENER una lista paginada de empresas.
     * GET /api/empresas?page=X&search=Y
     * @param {number} page - Número de página.
     * @param {string} search - Término de búsqueda.
     * @returns {Promise<Object>} Objeto con la data paginada (data, current_page, last_page, etc.).
     */
    async getAllEmpresas(page = 1, search = '') {
        try {
            const query = `?page=${page}${search ? `&search=${search}` : ''}`;
            const response = await axios.get(`${EMPRESAS_API_URL}${query}`, {
                headers: getAuthHeaders(),
            });
            // El controlador retorna directamente la data paginada
            return response.data;
        } catch (error) {
            console.error('Error al obtener la lista de empresas:', error);
            throw error;
        }
    }

    /**
     * [3. SHOW] OBTENER los detalles de una empresa específica.
     * GET /api/empresas/{id}
     * @param {number} id - El ID de la empresa a buscar.
     * @returns {Promise<Object>} El objeto empresa con sus relaciones cargadas (rubro, etc.).
     */
    async getEmpresa(id) {
        try {
            const response = await axios.get(`${EMPRESAS_API_URL}/${id}`, {
                headers: getAuthHeaders(),
            });
            // El controlador retorna { success: true, data: empresa }
            return response.data.data; 
        } catch (error) {
            console.error(`Error al obtener la empresa con ID ${id}:`, error);
            throw error;
        }
    }

    /**
     * [CREATE DATA] OBTENER datos necesarios para el formulario de creación.
     * GET /api/empresas/create
     * @returns {Promise<Object>} Data inicial (ej: rubros_disponibles).
     */
    async getEmpresaCreationData() {
        try {
            const response = await axios.get(`${EMPRESAS_API_URL}/create`, {
                headers: getAuthHeaders(),
            });
            return response.data;
        } catch (error) {
            console.error('Error al obtener datos para creación de empresa:', error);
            throw error;
        }
    }

    /**
     * [2. STORE] CREAR una nueva empresa.
     * POST /api/empresas
     * @param {Object} empresaData - Los datos de la nueva empresa ({ rubro_id, codigo, nombre, descripcion }).
     * @returns {Promise<Object>} La respuesta del servidor, incluyendo la empresa creada.
     */
    async createEmpresa(empresaData) {
        try {
            const response = await axios.post(EMPRESAS_API_URL, empresaData, {
                headers: getAuthHeaders(),
            });
            // El controlador retorna { success: true, message, data: empresa } con código 201
            return response.data;
        } catch (error) {
            console.error('Error al crear la empresa:', error);
            // El controlador de Laravel retorna errores de validación con código 422
            throw error;
        }
    }

    /**
     * [4. UPDATE] ACTUALIZAR una empresa.
     * PUT /api/empresas/{id}
     * @param {number} id - El ID de la empresa a actualizar.
     * @param {Object} empresaData - Los datos actualizados.
     * @returns {Promise<Object>} La respuesta del servidor, incluyendo la empresa actualizada.
     */
    async updateEmpresa(id, empresaData) {
        try {
            const response = await axios.put(`${EMPRESAS_API_URL}/${id}`, empresaData, {
                headers: getAuthHeaders(),
            });
            // El controlador retorna { success: true, message, data: empresa } con código 200
            return response.data;
        } catch (error) {
            console.error(`Error al actualizar la empresa con ID ${id}:`, error);
            throw error;
        }
    }

    /**
     * [5. DESTROY] ELIMINAR una empresa.
     * DELETE /api/empresas/{id}
     * @param {number} id - El ID de la empresa a eliminar.
     * @returns {Promise<void>}
     */
    async deleteEmpresa(id) {
        try {
            // El controlador retorna 200 con un mensaje de éxito, o 500 si hay dependencias (FK).
            await axios.delete(`${EMPRESAS_API_URL}/${id}`, {
                headers: getAuthHeaders(),
            });
            // Retorna un objeto o vacío si la eliminación fue exitosa (200 OK)
            return { success: true, message: "Empresa eliminada exitosamente." };
        } catch (error) {
            console.error(`Error al eliminar la empresa con ID ${id}:`, error);
            // Captura el error 500 (o 409 si lo implementaste) si hay registros asociados
            if (error.response && error.response.status === 500) {
                 // Aquí relanzamos un error con un mensaje más amigable para el frontend
                throw new Error(error.response.data.message || 'No se pudo eliminar la empresa debido a datos asociados (cuentas, estados, etc.).');
            }
            throw error;
        }
    }
}

export default new EmpresaService();
