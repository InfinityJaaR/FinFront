import { useState, useEffect, useCallback } from 'react';
// Corrección de la ruta de importación para asegurar la resolución (añadiendo .js)
// También se asume que se usa la instancia exportada del servicio directamente.
import EmpresasService from '@/services/GestionEmpresas/Empresas/EmpresasService';
import axios from 'axios'; // Se mantiene el import de axios por si se usa en otro lugar
import { useModal } from '@/context/ModalContext'

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
    const modal = useModal()

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
        const isConfirmed = await modal.confirm({
            title: 'Confirmar eliminación',
            message: '¿Está seguro de que desea eliminar esta empresa? Esto no se puede deshacer.',
            okVariant: 'danger',
            cancelVariant: 'primary',
            iconType: 'warning'
        })

        if (!isConfirmed) return;

        try {
            await service.deleteEmpresa(id);
            await modal.alert({ title: 'Éxito', message: 'Empresa eliminada con éxito.', iconType: 'success' }); 
            fetchEmpresas(currentPage, searchTerm);
            return;
        } catch (err) {
            // Si el backend devuelve 409 => tiene dependencias
            const status = err.response?.status
            if (status === 409) {
                const details = err.response.data?.details || {}
                const message = (
                    <div>
                        <p className="mb-2">{err.response.data?.message || 'La empresa tiene datos asociados que impiden su eliminación.'}</p>
                        <ul className="text-sm text-gray-600 list-disc list-inside">
                            {Object.entries(details).map(([k, v]) => (
                                <li key={k}><strong>{k.replace(/_/g, ' ')}:</strong> {v}</li>
                            ))}
                        </ul>
                    </div>
                )

                const choice = await modal.dialog({
                    title: 'No se puede eliminar la empresa',
                    message,
                    options: [
                        { key: 'disable', label: 'Desactivar empresa', variant: 'primary' },
                        { key: 'force', label: 'Eliminar permanentemente', variant: 'danger' },
                        { key: 'cancel', label: 'Cancelar', variant: 'default' }
                    ],
                    iconType: 'warning'
                })

                if (!choice || choice === 'cancel') return

                if (choice === 'disable') {
                    const doDisable = await modal.confirm({ title: 'Desactivar empresa', message: '¿Desea desactivar la empresa ahora?', okVariant: 'primary', cancelVariant: 'default', iconType: 'info' })
                    if (!doDisable) return

                    try {
                        await service.disableEmpresa(id, 'disable')
                        await modal.alert({ title: 'Empresa desactivada', message: 'La empresa fue desactivada correctamente.', iconType: 'success' })
                        fetchEmpresas(currentPage, searchTerm)
                    } catch (e) {
                        console.error('Error desactivando empresa', e)
                        await modal.alert({ title: 'Error', message: e.response?.data?.message || e.message || 'Error al desactivar la empresa.' })
                    }
                    return
                }

                if (choice === 'force') {
                    // 1) comprobar si la empresa está activa
                    try {
                        const emp = await service.getEmpresa(id)
                        if (emp.activo) {
                            const disableNow = await modal.confirm({ title: 'Empresa activa', message: 'La empresa está activa. Debe desactivarla antes de un borrado forzado. ¿Desea desactivarla ahora?', okVariant: 'primary', cancelVariant: 'default', iconType: 'warning' })
                            if (!disableNow) return
                            await service.disableEmpresa(id, 'disable')
                            await modal.alert({ title: 'Empresa desactivada', message: 'Empresa desactivada. Procediendo a borrado forzado.', iconType: 'info' })
                        }

                        // 2) ejecutar borrado forzado
                        try {
                            await service.deleteEmpresaForce(id, true)
                            await modal.alert({ title: 'Eliminada', message: 'Empresa eliminada permanentemente.', iconType: 'success' })
                            fetchEmpresas(currentPage, searchTerm)
                        } catch (e) {
                            console.error('Error en borrado forzado', e)
                            await modal.alert({ title: 'Error', message: e.response?.data?.message || e.message || 'Error al intentar borrado forzado.' })
                        }
                    } catch (e) {
                        console.error('Error comprobando empresa', e)
                        await modal.alert({ title: 'Error', message: e.response?.data?.message || e.message || 'No se pudo verificar el estado de la empresa.' })
                    }
                }
                return
            }

            // Otros errores
            console.error('Error de eliminación:', err);
            await modal.alert({ title: 'Error', message: err.response?.data?.message || err.message || 'Ocurrió un error al intentar eliminar la empresa.' })
            setError(err.message || 'Ocurrió un error al intentar eliminar la empresa.');
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
