import React from 'react';
import { Eye, Edit, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import Button from '@/components/ui/Button';
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
            <Button
                onClick={() => onView(rubro.id)}
                variant="action"
                size="icon"
                intent="view"
                icon={<Eye className="h-5 w-5" />}
                title="Ver detalles del Rubro"
                aria-label="Ver detalles"
            />

            {/* Botón Editar */}
            <Button
                onClick={() => onEdit(rubro)}
                disabled={!canManage || isSubmitting}
                variant="action"
                size="icon"
                intent="edit"
                icon={<Edit className="h-5 w-5" />}
                title="Editar Rubro"
                aria-label="Editar"
                className={cn(!canManage && 'opacity-50 cursor-not-allowed')}
            />

            {/* Botón Eliminar */}
            <Button
                onClick={() => onDelete(rubro.id, rubro.nombre)}
                disabled={!canManage || isSubmitting}
                variant="action"
                size="icon"
                intent="delete"
                icon={<Trash2 className="h-5 w-5" />}
                title="Eliminar Rubro"
                aria-label="Eliminar"
                className={cn((!canManage || isSubmitting) && 'opacity-50 cursor-not-allowed')}
            />
        </div>
    );
};

export default RubroActionsCell;
