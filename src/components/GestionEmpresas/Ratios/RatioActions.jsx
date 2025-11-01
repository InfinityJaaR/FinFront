import { Eye, Edit, Trash2 } from 'lucide-react';
import Button from '@/components/ui/Button';

/**
 * Componente que renderiza los botones de acción para una fila de la tabla de Ratios.
 */
const RatioActions = ({ ratio, onView, onEdit, onDelete }) => {
    return (
        <div className="flex space-x-2 justify-center">
            <Button onClick={() => onView(ratio.id)} variant="default" size="icon" aria-label="Ver detalles del ratio">
                <Eye size={18} />
            </Button>

            <Button onClick={() => onEdit(ratio.id)} variant="default" size="icon" aria-label="Editar ratio">
                <Edit size={18} />
            </Button>

            <Button onClick={() => onDelete(ratio.id)} variant="default" size="icon" aria-label="Eliminar ratio">
                <Trash2 size={18} />
            </Button>
        </div>
    );
};

export default RatioActions;