import { Eye, Edit, Trash2 } from 'lucide-react';
import Button from '@/components/ui/Button';

/**
 * Componente que renderiza los botones de acción para una fila de la tabla.
 */
const EmpresaActions = ({ empresa, onView, onEdit, onDelete }) => {
    return (
        <div className="flex space-x-2 justify-center">
            <Button onClick={() => onView(empresa.id)} variant="action" size="icon" intent="view" icon={<Eye size={18} />} aria-label="Ver detalles" />

            <Button onClick={() => onEdit(empresa.id)} variant="action" size="icon" intent="edit" icon={<Edit size={18} />} aria-label="Editar empresa" />

            <Button onClick={() => onDelete(empresa.id)} variant="action" size="icon" intent="delete" icon={<Trash2 size={18} />} aria-label="Eliminar empresa" />
        </div>
    );
};

export default EmpresaActions;
