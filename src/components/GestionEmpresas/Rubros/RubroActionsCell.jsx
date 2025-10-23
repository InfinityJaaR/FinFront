import React from 'react';
import { Edit, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/auth/useAuth';

/**
 * Componente de celda para los botones de Editar y Eliminar de un rubro.
 * @param {Object} props
 * @param {Object} props.rubro El objeto rubro.
 * @param {Function} props.onEdit Función a llamar al editar.
 * @param {Function} props.onDelete Función a llamar al eliminar.
 * @param {boolean} props.isSubmitting Estado global de envío (para deshabilitar).
 */
const RubroActionsCell = ({ rubro, onEdit, onDelete, isSubmitting }) => {
    const { hasPermission } = useAuth();
    // Reutilizamos el check de permisos de tu hook de autenticación
    const canManage = hasPermission('gestionar_rubros');

    return (
        <div className="flex justify-center space-x-2">
            <button
                onClick={() => onEdit(rubro)}
                disabled={!canManage}
                className={cn("text-blue-600 hover:text-blue-900 p-2 rounded-full transition-colors", 
                    !canManage && "opacity-50 cursor-not-allowed"
                )}
                title="Editar Rubro"
            >
                <Edit className="h-5 w-5" />
            </button>
            <button
                onClick={() => onDelete(rubro.id, rubro.nombre)}
                disabled={!canManage || isSubmitting}
                className={cn("text-red-600 hover:text-red-900 p-2 rounded-full transition-colors", 
                    (!canManage || isSubmitting) && "opacity-50 cursor-not-allowed"
                )}
                title="Eliminar Rubro"
            >
                <Trash2 className="h-5 w-5" />
            </button>
        </div>
    );
};

export default RubroActionsCell;
