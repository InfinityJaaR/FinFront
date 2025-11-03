import { useState, useEffect, useCallback } from 'react';
import catalogoCuentasService from '@/services/GestionCuentas/CatalogoCuentas/CatalogoCuentasService';

/**
 * Hook personalizado para gestionar el catálogo de cuentas
 * @param {number} empresaId - ID de la empresa (opcional)
 * @returns {Object} Estado y funciones para gestionar el catálogo
 */
export const useCatalogoCuentas = (empresaId = null) => {
    const [cuentas, setCuentas] = useState([]);
    const [empresas, setEmpresas] = useState([]);
    const [empresa, setEmpresa] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    /**
     * Cargar lista de empresas con información de catálogo
     */
    const cargarEmpresas = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await catalogoCuentasService.getEmpresasConCatalogo();
            if (response.success) {
                setEmpresas(response.data);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Error al cargar empresas');
            console.error('Error al cargar empresas:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * Cargar catálogo de cuentas de una empresa
     */
    const cargarCatalogo = useCallback(async (idEmpresa) => {
        if (!idEmpresa) return;
        
        setLoading(true);
        setError(null);
        try {
            const response = await catalogoCuentasService.getCatalogoByEmpresa(idEmpresa);
            if (response.success) {
                setCuentas(response.data.cuentas);
                setEmpresa(response.data.empresa);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Error al cargar catálogo');
            console.error('Error al cargar catálogo:', err);
            setCuentas([]);
            setEmpresa(null);
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * Guardar catálogo completo (reemplaza el existente)
     */
    const guardarCatalogo = useCallback(async (catalogoData) => {
        setLoading(true);
        setError(null);
        try {
            const response = await catalogoCuentasService.cargarCatalogo(catalogoData);
            if (response.success) {
                // Recargar el catálogo actualizado
                if (catalogoData.empresa_id) {
                    await cargarCatalogo(catalogoData.empresa_id);
                }
                return response;
            }
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Error al guardar catálogo';
            setError(errorMessage);
            console.error('Error al guardar catálogo:', err);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [cargarCatalogo]);

    /**
     * Actualizar una cuenta específica
     */
    const actualizarCuenta = useCallback(async (id, cuentaData) => {
        setLoading(true);
        setError(null);
        try {
            const response = await catalogoCuentasService.actualizarCuenta(id, cuentaData);
            if (response.success) {
                // Actualizar la cuenta en el estado local
                setCuentas(prevCuentas =>
                    prevCuentas.map(cuenta =>
                        cuenta.id === id ? response.data : cuenta
                    )
                );
                return response;
            }
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Error al actualizar cuenta';
            setError(errorMessage);
            console.error('Error al actualizar cuenta:', err);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * Eliminar una cuenta específica
     */
    const eliminarCuenta = useCallback(async (id) => {
        setLoading(true);
        setError(null);
        try {
            const response = await catalogoCuentasService.eliminarCuenta(id);
            if (response.success) {
                // Eliminar la cuenta del estado local
                setCuentas(prevCuentas =>
                    prevCuentas.filter(cuenta => cuenta.id !== id)
                );
                return response;
            }
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Error al eliminar cuenta';
            setError(errorMessage);
            console.error('Error al eliminar cuenta:', err);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    // Cargar catálogo automáticamente si se proporciona empresaId
    useEffect(() => {
        if (empresaId) {
            cargarCatalogo(empresaId);
        }
    }, [empresaId, cargarCatalogo]);

    return {
        // Estado
        cuentas,
        empresas,
        empresa,
        loading,
        error,
        
        // Funciones
        cargarEmpresas,
        cargarCatalogo,
        guardarCatalogo,
        actualizarCuenta,
        eliminarCuenta,
        
        // Setters (por si se necesitan)
        setCuentas,
        setError,
    };
};
