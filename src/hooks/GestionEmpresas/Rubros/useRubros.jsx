import { useState, useEffect, useCallback } from 'react';
// RubroService está en services/GestionEmpresas/Rubros
import RubroService from '@/services/GestionEmpresas/Rubros/RubroService'; 

const initialRubroState = {
    codigo: '',
    nombre: '',
    descripcion: '',
    promedio_prueba_acida: '',
    promedio_liquidez_corriente: '',
    promedio_apalancamiento: '',
    promedio_rentabilidad: '',
};

/**
 * Hook personalizado para la gestión de Rubros (CRUD).
 */
export const useRubros = () => {
    const [rubros, setRubros] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [currentRubro, setCurrentRubro] = useState(null); // Para edición
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [validationErrors, setValidationErrors] = useState({});

    // --- Cargar Todos los Rubros ---
    const fetchRubros = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await RubroService.getAllRubros();
            setRubros(data);
        } catch (err) {
            console.error("Error al cargar los rubros:", err);
            setError("No se pudieron cargar los rubros. Verifique la conexión o sus permisos.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchRubros();
    }, [fetchRubros]);

    // --- Manejo de Formulario (Crear/Actualizar) ---
    const saveRubro = async (rubroData, isEditing) => {
        setIsSubmitting(true);
        setError(null);
        setValidationErrors({});

        // Convertir campos numéricos a null si están vacíos para la validación de Laravel
        const dataToSend = Object.fromEntries(
            Object.entries(rubroData).map(([key, value]) => {
                if (key.startsWith('promedio_') && value === '') {
                    return [key, null];
                }
                return [key, value];
            })
        );
        
        try {
            let response;
            if (isEditing && dataToSend.id) {
                // Actualizar
                response = await RubroService.updateRubro(dataToSend.id, dataToSend);
            } else {
                // Crear
                response = await RubroService.createRubro(dataToSend);
            }

            // Recargar la lista después de una operación exitosa
            fetchRubros();
            // Mantener el modal cerrado si es éxito, el componente manejará la notificación
            setIsModalOpen(false); 
            
            return { success: true, message: response.message };

        } catch (err) {
            console.error("Error al guardar el rubro:", err);
            
            let message = "Ocurrió un error inesperado al guardar.";

            // Manejar errores de validación de Laravel (código 422)
            if (err.response && err.response.status === 422) {
                setValidationErrors(err.response.data.errors || {});
                message = "Hay errores en el formulario. Por favor, revíselos.";
            } else {
                // Otros errores (servidor, red, etc.)
                message = err.response?.data?.message || err.message || message;
            }
            
            setError(message); // Establece el error en el estado del hook
            return { success: false, message: message }; // RETORNA EL MENSAJE CORREGIDO
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- Eliminar Rubro ---
    const deleteRubro = async (id) => {
        setIsSubmitting(true);
        setError(null);
        try {
            await RubroService.deleteRubro(id);
            // Actualizar el estado local directamente (más rápido que un refetch)
            setRubros(prev => prev.filter(r => r.id !== id));
            return { success: true, message: "Rubro eliminado exitosamente." };
        } catch (err) {
            console.error("Error al eliminar el rubro:", err);
            
            let message = "Ocurrió un error inesperado al eliminar.";
            if (err.message.includes('empresas asociadas')) {
                // Mensaje del error 409 que manejamos en el Service
                message = err.message; 
            }
            
            setError(message);
            return { success: false, message: message };
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- Funciones para el Modal de Edición/Creación ---
    const openCreateModal = () => {
        setCurrentRubro(initialRubroState); // Limpiar para un nuevo rubro
        setValidationErrors({});
        setError(null);
        setIsModalOpen(true);
    };

    const openEditModal = (rubro) => {
        // Clonar el objeto para que las modificaciones no afecten el estado de la tabla
        setCurrentRubro({ ...rubro }); 
        setValidationErrors({});
        setError(null);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setCurrentRubro(null); // Limpiar al cerrar
        setValidationErrors({}); // Limpiar errores
        setError(null); // Limpiar error
    };


    return {
        // Estado
        rubros,
        isLoading,
        error,
        isSubmitting,
        currentRubro,
        isModalOpen,
        validationErrors,
        
        // Acciones
        fetchRubros,
        saveRubro,
        deleteRubro,
        openCreateModal,
        openEditModal,
        closeModal,
    };
};