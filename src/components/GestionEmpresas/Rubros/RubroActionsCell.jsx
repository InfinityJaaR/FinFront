import React from 'react';
import { Eye, Edit, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
// CORRECCIÓN: Sustituimos la importación con alias por una función simulada para garantizar la compilación
// Reemplaza esto con tu importación real si usas un sistema de alias configurado:
// import { useAuth } from '@/hooks/auth/useAuth'; 
const useAuth = () => ({ hasPermission: (permission) => true }); // Mock de useAuth

/**
 * Componente de celda para los botones de acción (Ver, Editar, Eliminar) de un rubro.
 * @param {Object} props.rubro El objeto rubro.
 * @param {Function} props.onView Función a llamar al ver detalles.
 * @param {Function} props.onEdit Función a llamar al editar.
 * @param {Function} props.onDelete Función a llamar al eliminar.
 * @param {boolean} props.isSubmitting Estado global de envío.
 */
const RubroActionsCell = ({ rubro, onView, onEdit, onDelete, isSubmitting }) => {
    const { hasPermission } = useAuth();
    const canManage = hasPermission('gestionar_rubros');

    return (
        <div className="flex justify-center space-x-2">
            {/* Botón Ver (Añadido para consistencia) */}
            <button
                onClick={() => onView(rubro.id)}
                className="text-blue-600 hover:text-blue-800 p-2 rounded-full transition-colors"
                title="Ver detalles del Rubro"
                aria-label="Ver detalles"
            >
                <Eye className="h-5 w-5" />
            </button>

            {/* Botón Editar */}
            <button
                onClick={() => onEdit(rubro)}
                disabled={!canManage || isSubmitting}
                className={cn("text-yellow-600 hover:text-yellow-800 p-2 rounded-full transition-colors", 
                    !canManage && "opacity-50 cursor-not-allowed"
                )}
                title="Editar Rubro"
                aria-label="Editar"
            >
                <Edit className="h-5 w-5" />
            </button>
            
            {/* Botón Eliminar */}
            <button
                onClick={() => onDelete(rubro.id, rubro.nombre)}
                disabled={!canManage || isSubmitting}
                className={cn("text-red-600 hover:text-red-800 p-2 rounded-full transition-colors", 
                    (!canManage || isSubmitting) && "opacity-50 cursor-not-allowed"
                )}
                title="Eliminar Rubro"
                aria-label="Eliminar"
            >
                <Trash2 className="h-5 w-5" />
            </button>
        </div>
    );
};

export default RubroActionsCell;
