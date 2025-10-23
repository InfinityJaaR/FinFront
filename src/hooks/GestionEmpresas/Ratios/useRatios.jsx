import { useState, useEffect, useCallback } from 'react';
// Usar alias @ para rutas desde src y corregir typo en carpeta 'GestimpEmpresas'
import RatioDefinicionService from '@/services/GestionEmpresas/Ratios/RatioDefinicionService'; 
import axios from 'axios'; // Se mantiene por convención

/**
 * Hook personalizado para gestionar la lógica de la página de listado de Definiciones de Ratios.
 */
const useRatios = () => {
    const [ratiosData, setRatiosData] = useState({
        data: [],
        meta: {}, // Contiene la información de paginación
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');

    // Corrección: El servicio se exportó como una INSTANCIA, se usa directamente.
    const service = RatioDefinicionService; 

    const fetchRatios = useCallback(async (page = 1, search = '') => {
        setIsLoading(true);
        setError(null);
        try {
            // El servicio getAllRatios devuelve el objeto de paginación completo.
            const response = await service.getAllRatios(page, search);

            let items = [];
            let meta = {};

            // Normalización similar a useEmpresas para asegurar que se manejan las estructuras
            if (response && Array.isArray(response.data)) {
                items = response.data;
                meta = response.meta || {};
            } else if (response && Array.isArray(response)) {
                 items = response;
            }

            setRatiosData({ data: items, meta });
            
            if (meta.current_page) {
                setCurrentPage(meta.current_page);
            }
        } catch (err) {
            setError('Error al cargar la lista de definiciones de ratios. Por favor, intente de nuevo.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [service]);

    // Efecto para cargar datos iniciales o cuando cambia la página/búsqueda
    useEffect(() => {
        const handler = setTimeout(() => {
            fetchRatios(currentPage, searchTerm);
        }, 300); 

        return () => clearTimeout(handler);
    }, [currentPage, searchTerm, fetchRatios]);

    /**
     * Función para eliminar una definición de ratio.
     * @param {number} id - ID del ratio a eliminar.
     */
    const handleDeleteRatio = async (id) => {
        const isConfirmed = window.confirm ? window.confirm('¿Está seguro de que desea eliminar esta definición de ratio? Esto eliminará todos los valores históricos calculados.') : true;
        
        if (!isConfirmed) {
            return;
        }

        try {
            await service.deleteRatio(id);
            alert('Definición de Ratio eliminada con éxito.'); 
            
            // Recargar la lista
            fetchRatios(currentPage, searchTerm); 
        } catch (err) {
            setError(err.message || 'Ocurrió un error al intentar eliminar el ratio.');
            console.error('Error de eliminación:', err);
        }
    };

    return {
        ratios: ratiosData.data,
        pagination: ratiosData.meta,
        isLoading,
        error,
        searchTerm,
        setSearchTerm,
        setCurrentPage,
        handleDeleteRatio,
    };
};

export default useRatios;