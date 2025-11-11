import React from 'react';
import { Users, Edit, Trash2, CheckCircle, XCircle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Componente de tabla para mostrar la lista de usuarios
 */
const UserTable = ({ users, onEdit, onDeactivate, onReactivate, onDelete }) => {
    if (users.length === 0) {
        return (
            <div className="text-center py-10 text-gray-500">
                <Users className="h-10 w-10 mx-auto mb-3 text-gray-400" />
                <p className="text-lg">No hay usuarios registrados.</p>
                <p className="text-sm mt-1">Utiliza el botón 'Nuevo Usuario' para agregar uno.</p>
            </div>
        );
    }

    return (
        <div className="bg-white shadow-xl rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Nombre / Email
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Empresa
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Estado
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Acciones
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {users.map((user) => (
                            <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                {/* Columna Nombre/Email */}
                                <td className="px-4 py-3">
                                    <div className="text-sm font-semibold text-indigo-700">
                                        {user.name}
                                    </div>
                                    <div className="text-xs text-gray-600">
                                        {user.email}
                                    </div>
                                </td>

                                {/* Columna Empresa */}
                                <td className="px-4 py-3">
                                    <div className="text-sm text-gray-800">
                                        {user.empresa ? user.empresa.nombre : (
                                            <span className="text-gray-400 italic">Sin empresa asignada</span>
                                        )}
                                    </div>
                                </td>

                                {/* Columna Estado */}
                                <td className="px-4 py-3 text-center">
                                    {user.active ? (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                            <CheckCircle className="h-3 w-3" />
                                            Activo
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                            <XCircle className="h-3 w-3" />
                                            Inactivo
                                        </span>
                                    )}
                                </td>

                                {/* Columna Acciones */}
                                <td className="px-4 py-3 whitespace-nowrap text-center text-sm font-medium">
                                    <div className="flex items-center justify-center gap-2">
                                        {/* Botón Editar */}
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => onEdit(user)}
                                            className="inline-flex items-center gap-1"
                                            title="Editar usuario"
                                        >
                                            <Edit className="h-4 w-4" />
                                            Editar
                                        </Button>

                                        {/* Botón Desactivar/Reactivar */}
                                        {user.active ? (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => onDeactivate(user.id)}
                                                className="inline-flex items-center gap-1 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                                                title="Desactivar usuario"
                                            >
                                                <XCircle className="h-4 w-4" />
                                                Desactivar
                                            </Button>
                                        ) : (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => onReactivate(user.id)}
                                                className="inline-flex items-center gap-1 text-green-600 hover:text-green-700 hover:bg-green-50"
                                                title="Reactivar usuario"
                                            >
                                                <RotateCcw className="h-4 w-4" />
                                                Reactivar
                                            </Button>
                                        )}

                                        {/* Botón Eliminar (solo si está inactivo) */}
                                        {!user.active && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => onDelete(user.id)}
                                                className="inline-flex items-center gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                title="Eliminar permanentemente"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                                Eliminar
                                            </Button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default UserTable;
