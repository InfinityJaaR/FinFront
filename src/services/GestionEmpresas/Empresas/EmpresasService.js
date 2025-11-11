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

// Ponlo dentro de la clase EmpresaService
async getEmpresas() {
  try {
    const response = await axios.get(`${EMPRESAS_API_URL}`, {
      headers: getAuthHeaders(),
    });
    const d = response.data;
    // Normaliza: array directo, o en data, o en items, o vacío.
    if (Array.isArray(d)) return d;
    if (Array.isArray(d?.data)) return d.data;
    if (Array.isArray(d?.items)) return d.items;
    return [];
  } catch (error) {
    console.error('Error al obtener todas las empresas:', error);
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
            // Nota: Esta función realiza un DELETE simple (sin force). Para borrado forzado usar deleteEmpresaForce
            await axios.delete(`${EMPRESAS_API_URL}/${id}`, {
                headers: getAuthHeaders(),
            });
            return { success: true, message: "Empresa eliminada exitosamente." };
        } catch (error) {
            console.error(`Error al eliminar la empresa con ID ${id}:`, error);
            // Relanzar el error original para que el frontend pueda inspeccionar status/details
            throw error;
        }
    }

    /**
     * Eliminar una empresa con opción de borrado forzado.
     * @param {number} id
     * @param {boolean} force
     */
    async deleteEmpresaForce(id, force = false) {
        try {
            const response = await axios.delete(`${EMPRESAS_API_URL}/${id}`, {
                headers: getAuthHeaders(),
                params: force ? { force: true } : {}
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Desactivar / Activar empresa
     * PATCH /api/empresas/{id}/disable?action=enable|disable
     */
    async disableEmpresa(id, action = 'disable') {
        try {
            const response = await axios.patch(`${EMPRESAS_API_URL}/${id}/disable`, {}, {
                headers: getAuthHeaders(),
                params: { action }
            });
            return response.data;
        } catch (error) {
            console.error(`Error al cambiar estado de la empresa ${id}:`, error);
            throw error;
        }
    }
        async getEmpresaResumen(id) {
  const response = await axios.get(`${EMPRESAS_API_URL}/${id}/resumen`, {
    headers: getAuthHeaders(),
  });
  return response.data.data; // { id, nombre }

  
}

async getEmpresasAll() {
  try {
    const response = await axios.get(`${EMPRESAS_API_URL}/all`, {
      headers: getAuthHeaders(),
    });
    // Devuelve array plano de empresas
    return response.data?.data ?? [];
  } catch (error) {
    console.error('Error al obtener todas las empresas:', error);
    throw error;
  }
}

/**
 * Obtener lista básica de empresas (id, nombre) para selectores
 * GET /api/empresas-all
 * @returns {Promise<Array>} Array de objetos { id, nombre }
 */
async getEmpresasBasic() {
  try {
    const response = await axios.get(`${url}empresas-all`, {
      headers: getAuthHeaders(),
    });
    return response.data?.data ?? [];
  } catch (error) {
    console.error('Error al obtener empresas básicas:', error);
    throw error;
  }
}


}

export default new EmpresaService();
