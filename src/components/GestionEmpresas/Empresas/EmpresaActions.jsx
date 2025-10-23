import { Eye, Edit, Trash2 } from 'lucide-react';

/**
 * Componente que renderiza los botones de acción para una fila de la tabla.
 */
const EmpresaActions = ({ empresa, onView, onEdit, onDelete }) => {
    return (
        <div className="flex space-x-2 justify-center">
            {/* Botón Ver */}
            <button
                onClick={() => onView(empresa.id)}
                className="p-2 text-blue-600 hover:text-blue-800 rounded-full transition duration-150"
                aria-label="Ver detalles"
            >
                <Eye size={18} />
            </button>
            
            {/* Botón Editar */}
            <button
                onClick={() => onEdit(empresa.id)}
                className="p-2 text-yellow-600 hover:text-yellow-800 rounded-full transition duration-150"
                aria-label="Editar empresa"
            >
                <Edit size={18} />
            </button>

            {/* Botón Eliminar */}
            <button
                onClick={() => onDelete(empresa.id)}
                className="p-2 text-red-600 hover:text-red-800 rounded-full transition duration-150"
                aria-label="Eliminar empresa"
            >
                <Trash2 size={18} />
            </button>
        </div>
    );
};

export default EmpresaActions;
