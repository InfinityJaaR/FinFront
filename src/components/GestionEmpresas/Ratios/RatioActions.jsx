import { Eye, Edit, Trash2 } from 'lucide-react';

/**
 * Componente que renderiza los botones de acción para una fila de la tabla de Ratios.
 */
const RatioActions = ({ ratio, onView, onEdit, onDelete }) => {
    return (
        <div className="flex space-x-2 justify-center">
            {/* Botón Ver */}
            <button
                onClick={() => onView(ratio.id)}
                className="p-2 text-blue-600 hover:text-blue-800 rounded-full transition duration-150"
                aria-label="Ver detalles del ratio"
            >
                <Eye size={18} />
            </button>
            
            {/* Botón Editar */}
            <button
                onClick={() => onEdit(ratio.id)}
                className="p-2 text-yellow-600 hover:text-yellow-800 rounded-full transition duration-150"
                aria-label="Editar ratio"
            >
                <Edit size={18} />
            </button>

            {/* Botón Eliminar */}
            <button
                onClick={() => onDelete(ratio.id)}
                className="p-2 text-red-600 hover:text-red-800 rounded-full transition duration-150"
                aria-label="Eliminar ratio"
            >
                <Trash2 size={18} />
            </button>
        </div>
    );
};

export default RatioActions;