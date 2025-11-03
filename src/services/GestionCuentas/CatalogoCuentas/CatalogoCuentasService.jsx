import axios from 'axios';
import url from '../../utils/url';

const CATALOGO_API_URL = `${url}catalogo-cuentas`;

/**
 * Función auxiliar para obtener los headers de autenticación (Bearer Token)
 * Se asume que el token está en localStorage.
 */
const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return token
        ? { Authorization: `Bearer ${token}` }
        : {};
};

class CatalogoCuentasService {

    /**
     * OBTENER lista de empresas con información de catálogo
     * GET /api/catalogo-cuentas/empresas
     * @returns {Promise<Object>} Array de empresas con información de catálogo
     */
    async getEmpresasConCatalogo() {
        try {
            const response = await axios.get(`${CATALOGO_API_URL}/empresas`, {
                headers: getAuthHeaders(),
            });
            return response.data;
        } catch (error) {
            console.error('Error al obtener empresas con catálogo:', error);
            throw error;
        }
    }

    /**
     * OBTENER catálogo de cuentas de una empresa específica
     * GET /api/catalogo-cuentas/empresa/{empresaId}
     * @param {number} empresaId - ID de la empresa
     * @returns {Promise<Object>} Objeto con empresa, cuentas y total
     */
    async getCatalogoByEmpresa(empresaId) {
        try {
            const response = await axios.get(`${CATALOGO_API_URL}/empresa/${empresaId}`, {
                headers: getAuthHeaders(),
            });
            return response.data;
        } catch (error) {
            console.error(`Error al obtener catálogo de empresa ${empresaId}:`, error);
            throw error;
        }
    }

    /**
     * CARGAR/REEMPLAZAR catálogo completo de una empresa
     * POST /api/catalogo-cuentas
     * @param {Object} catalogoData - Datos del catálogo { empresa_id, cuentas: [] }
     * @returns {Promise<Object>} Respuesta con cuentas creadas
     */
    async cargarCatalogo(catalogoData) {
        try {
            const response = await axios.post(CATALOGO_API_URL, catalogoData, {
                headers: getAuthHeaders(),
            });
            return response.data;
        } catch (error) {
            console.error('Error al cargar catálogo:', error);
            throw error;
        }
    }

    /**
     * ACTUALIZAR una cuenta específica
     * PUT /api/catalogo-cuentas/{id}
     * @param {number} id - ID de la cuenta
     * @param {Object} cuentaData - Datos de la cuenta { codigo, nombre, tipo, es_calculada }
     * @returns {Promise<Object>} Respuesta con la cuenta actualizada
     */
    async actualizarCuenta(id, cuentaData) {
        try {
            const response = await axios.put(`${CATALOGO_API_URL}/${id}`, cuentaData, {
                headers: getAuthHeaders(),
            });
            return response.data;
        } catch (error) {
            console.error(`Error al actualizar cuenta ${id}:`, error);
            throw error;
        }
    }

    /**
     * ELIMINAR una cuenta específica
     * DELETE /api/catalogo-cuentas/{id}
     * @param {number} id - ID de la cuenta
     * @returns {Promise<Object>} Respuesta de confirmación
     */
    async eliminarCuenta(id) {
        try {
            const response = await axios.delete(`${CATALOGO_API_URL}/${id}`, {
                headers: getAuthHeaders(),
            });
            return response.data;
        } catch (error) {
            console.error(`Error al eliminar cuenta ${id}:`, error);
            throw error;
        }
    }
}

// Exportar una instancia única del servicio (patrón Singleton)
export default new CatalogoCuentasService();
