import { Eye, Edit, Trash2 } from 'lucide-react';
import Button from '@/components/ui/Button';

/**
 * Componente que renderiza los botones de acción para una fila de la tabla de Ratios.
 */
const RatioActions = ({ ratio, onView, onEdit, onDelete }) => {
    return (
        <div className="flex space-x-2 justify-center">
            <Button onClick={() => onView(ratio.id)} variant="action" size="icon" intent="view" icon={<Eye size={18} />} aria-label="Ver detalles del ratio" />

            <Button onClick={() => onEdit(ratio.id)} variant="action" size="icon" intent="edit" icon={<Edit size={18} />} aria-label="Editar ratio" />

            <Button onClick={() => onDelete(ratio.id)} variant="action" size="icon" intent="delete" icon={<Trash2 size={18} />} aria-label="Eliminar ratio" />
        </div>
    );
};

export default RatioActions;