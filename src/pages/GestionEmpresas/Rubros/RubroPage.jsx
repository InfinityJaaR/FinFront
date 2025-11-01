import React from 'react';
import { useRubros } from '@/hooks/GestionEmpresas/Rubros/useRubros'; // Hook de gestión de datos
import { useAuth } from '@/hooks/auth/useAuth'; // Tu hook existente para permisos
import { Plus, Loader2, AlertTriangle, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useModal } from '@/context/ModalContext'
import RubroTable from '@/components/GestionEmpresas/Rubros/RubroTable'; // Nuevo componente

const RubrosPage = () => {
    const { 
        rubros, 
        isLoading, 
        error, 
        deleteRubro, 
        isSubmitting
    } = useRubros();
    
    const { hasPermission } = useAuth();
    
    // Verificación de permiso centralizada
    const canManageRubros = hasPermission('gestionar_rubros');

    const navigate = useNavigate();
    const modal = useModal();

    // Manejador de eliminación con confirmación
    const handleDelete = async (rubroId, rubroNombre) => {
        const ok = await modal.confirm({ title: 'Confirmar eliminación', message: `¿Estás seguro de eliminar el rubro: "${rubroNombre}"? Esta acción es irreversible.` })
        if (!ok) return

        const result = await deleteRubro(rubroId);
        if (result.success) {
            console.log(result.message);
        } else {
            console.error(result.message);
            await modal.alert({ title: 'Error', message: `Error al eliminar: ${result.message}` })
        }
    };
    
    // --- Renderizado de Estado: Carga y Error de Petición ---
    if (isLoading) {
        return (
            <div className="flex flex-col justify-center items-center h-64 bg-white rounded-2xl shadow-xl">
                <Loader2 className="h-8 w-8 text-blue-600 animate-spin mb-3" />
                <p className="text-lg text-gray-700">Cargando rubros...</p>
            </div>
        );
    }
    
    // --- Renderizado de Error de Permisos ---
    if (!canManageRubros && !isLoading) {
         return (
             <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded-xl shadow-md">
                 <div className="flex items-center">
                     <X className="h-6 w-6 text-yellow-600 mr-3 flex-shrink-0" />
                     <p className="text-lg font-medium text-yellow-800">Acceso Denegado</p>
                 </div>
                 <p className="mt-2 text-sm text-yellow-700">No tienes el permiso necesario ('gestionar_rubros') para acceder o modificar esta sección.</p>
             </div>
         );
     }
     
    // --- Renderizado de Contenido Principal ---
    return (
        <div className="space-y-6">
            <header className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-900">Gestión de Rubros Empresariales</h1>
                
                {/* Botón de Creación */}
                {canManageRubros && (
                    <button
                        onClick={() => navigate('/dashboard/gestion-empresas/rubros/create')}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-5 rounded-xl shadow-lg transition-colors transform hover:scale-[1.02] active:scale-95 disabled:opacity-70"
                        title="Crear Nuevo Rubro"
                    >
                        <Plus className="h-5 w-5" />
                        Nuevo Rubro
                    </button>
                )}
            </header>
            
            <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100">
                
                {/* Alerta de Error General de API */}
                {error && (
                    <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-md mb-4">
                        <div className="flex items-center">
                            <AlertTriangle className="h-5 w-5 text-red-500 mr-3" />
                            <p className="text-sm font-medium text-red-800">{error}</p>
                        </div>
                    </div>
                )}

                {/* Tabla de Rubros */}
                <RubroTable 
                    rubros={rubros} 
                    onEdit={(r) => navigate(`/dashboard/gestion-empresas/rubros/${r.id}/edit`)}
                    onView={(id) => navigate(`/dashboard/gestion-empresas/rubros/${id}`)}
                    onDelete={handleDelete}
                    isSubmitting={isSubmitting} // Pasa el estado de envío para deshabilitar botones
                />
            </div>
            
        </div>
    );
};

export default RubrosPage;
