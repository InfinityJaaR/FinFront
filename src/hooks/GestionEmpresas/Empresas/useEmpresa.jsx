import { useState, useEffect, useCallback } from 'react';
// Corrección de la ruta de importación para asegurar la resolución (añadiendo .js)
// También se asume que se usa la instancia exportada del servicio directamente.
import EmpresasService from '@/services/GestionEmpresas/Empresas/EmpresasService';
import axios from 'axios'; // Se mantiene el import de axios por si se usa en otro lugar

/**
 * Hook personalizado para gestionar la lógica de la página de listado de Empresas.
 */
const useEmpresas = () => {
    const [empresasData, setEmpresasData] = useState({
        data: [],
        meta: {}, // Contiene la información de paginación (current_page, last_page, total, etc.)
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');

    // Corrección: El servicio se exportó como una INSTANCIA, se usa directamente.
    const service = EmpresasService; 

    const fetchEmpresas = useCallback(async (page = 1, search = '') => {
        setIsLoading(true);
        setError(null);
        try {
            // Llamada al servicio
            const response = await service.getAllEmpresas(page, search);

            // Normalizar varias formas de respuesta posibles del backend/servicio
            // Queremos dejar: { data: Array, meta: { current_page, last_page, total, per_page } }
            let items = [];
            let meta = {};

            // Caso 1: la respuesta ya es un array
            if (Array.isArray(response)) {
                items = response;
            }
            // Caso 2: { data: [...] , meta: {...} }
            else if (response && Array.isArray(response.data)) {
                items = response.data;
                meta = response.meta || {};
            }
            // Caso 3: { data: { data: [...], ... } } (por ejemplo, envoltura success/data)
            else if (response && response.data && Array.isArray(response.data.data)) {
                items = response.data.data;
                meta = response.data.meta || response.data.pagination || {};
            }
            // Caso 4: paginación plana en el objeto: { data: [...], current_page, last_page, total, per_page }
            else if (response && response.data && Array.isArray(response.data)) {
                items = response.data;
                meta = response.meta || {
                    current_page: response.current_page,
                    last_page: response.last_page,
                    total: response.total,
                    per_page: response.per_page,
                };
            }
            // Caso 5: la respuesta es un objeto con claves top-level que contienen array en 'items' o 'results'
            else if (response && Array.isArray(response.items)) {
                items = response.items;
                meta = response.meta || {};
            } else if (response && Array.isArray(response.results)) {
                items = response.results;
                meta = response.meta || {};
            }
            // Fallback: intentar sacar response.data.data o response.data
            else if (response && response.data) {
                if (Array.isArray(response.data.data)) items = response.data.data;
                else if (Array.isArray(response.data)) items = response.data;
            }

            // Garantizar tipos
            if (!Array.isArray(items)) items = [];
            if (typeof meta !== 'object' || meta === null) meta = {};

            setEmpresasData({ data: items, meta });

            // Actualizar página actual si viene en meta
            if (meta.current_page) {
                setCurrentPage(meta.current_page);
            }
        } catch (err) {
            setError('Error al cargar la lista de empresas. Por favor, intente de nuevo.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [service]);

    // Efecto para cargar datos iniciales o cuando cambia la página/búsqueda
    useEffect(() => {
        // Debounce para evitar llamadas excesivas al escribir la búsqueda
        const handler = setTimeout(() => {
            fetchEmpresas(currentPage, searchTerm);
        }, 300); 

        return () => clearTimeout(handler);
    }, [currentPage, searchTerm, fetchEmpresas]);

    /**
     * Función para eliminar una empresa.
     * @param {number} id - ID de la empresa a eliminar.
     */
    const handleDeleteEmpresa = async (id) => {
        // Usamos una función de confirmación alternativa si window.confirm no está disponible
        const isConfirmed = window.confirm ? window.confirm('¿Está seguro de que desea eliminar esta empresa? Esto no se puede deshacer.') : true;
        
        if (!isConfirmed) {
            return;
        }

        try {
            await service.deleteEmpresa(id);
            // Mostrar un mensaje de éxito (esto se manejaría mejor con un contexto de notificaciones)
            alert('Empresa eliminada con éxito.'); 
            
            // Recargar la lista, volviendo a la página 1 si es necesario, pero intentaremos mantener la página actual.
            fetchEmpresas(currentPage, searchTerm); 
        } catch (err) {
            // Asegura que el error es legible
            setError(err.message || 'Ocurrió un error al intentar eliminar la empresa.');
            console.error('Error de eliminación:', err);
        }
    };

    return {
        empresas: empresasData.data,
        pagination: empresasData.meta,
        isLoading,
        error,
        searchTerm,
        setSearchTerm,
        setCurrentPage,
        handleDeleteEmpresa,
    };
};

export default useEmpresas;
