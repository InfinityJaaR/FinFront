import { Eye, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Componente que renderiza los botones de acción para una fila de la tabla.
 */
const EmpresaActions = ({ empresa, onView, onEdit, onDelete }) => {
    return (
            <div className="flex space-x-2 justify-center">
                <Button onClick={() => onView(empresa.id)} variant="ghost" size="icon" aria-label="Ver detalles">
                    <Eye size={18} />
                </Button>

                <Button onClick={() => onEdit(empresa.id)} variant="ghost" size="icon" aria-label="Editar empresa">
                    <Edit size={18} />
                </Button>

                <Button onClick={() => onDelete(empresa.id)} variant="destructive" size="icon" aria-label="Eliminar empresa">
                    <Trash2 size={18} />
                </Button>
            </div>
    );
};

export default EmpresaActions;
