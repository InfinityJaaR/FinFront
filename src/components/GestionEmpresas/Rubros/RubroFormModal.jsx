import React, { useState, useEffect } from 'react';
import { X, Save, Loader2, TrendingUp } from 'lucide-react';
import { useRubros } from '@/hooks/GestionEmpresas/Rubros/useRubros'; // Importa tu hook de gestión
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'

const RubroFormModal = () => {
    const { 
        isModalOpen, 
        closeModal, 
        currentRubro, 
        saveRubro, 
        isSubmitting,
        validationErrors,
        error: apiError 
    } = useRubros();

    const isEditing = currentRubro && currentRubro.id !== undefined;
    
    // Estado local para los datos del formulario, inicializado desde currentRubro
    const [formData, setFormData] = useState(currentRubro || {});
    const [saveMessage, setSaveMessage] = useState(null);

    // Sincronizar el estado del formulario cuando el currentRubro cambia (al abrir el modal)
    useEffect(() => {
        if (currentRubro) {
            // Asegurarse de que los valores null/undefined se muestren como strings vacíos en inputs
            const safeData = Object.keys(currentRubro).reduce((acc, key) => {
                acc[key] = currentRubro[key] === null || currentRubro[key] === undefined ? '' : currentRubro[key];
                return acc;
            }, {});
            setFormData(safeData);
            setSaveMessage(null); // Limpiar mensaje al abrir/cambiar
        }
    }, [currentRubro]);

    if (!isModalOpen) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ 
            ...prev, 
            [name]: value 
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaveMessage(null);

        const result = await saveRubro(formData, isEditing);
        
        if (result.success) {
            setSaveMessage({ type: 'success', text: result.message });
            // Cierra el modal después de un breve tiempo para que el usuario vea el mensaje
            setTimeout(() => {
                closeModal();
            }, 1000); 
        } else {
            // El error y los errores de validación ya están manejados por el hook y se mostrarán
            setSaveMessage({ type: 'error', text: result.message });
        }
    };
    
    // Función auxiliar para mostrar errores de validación
    const renderError = (field) => {
        const errors = validationErrors[field];
        if (errors) {
            return (
                <p className="mt-1 text-xs text-red-500 font-medium">
                    {/* Laravel a menudo retorna un array de mensajes por campo, mostramos el primero */}
                    {errors[0]} 
                </p>
            );
        }
        return null;
    };


    return (
        // Backdrop del Modal
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4 animate-fade-in">
            <div 
                className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl transform transition-all animate-scale-in"
                onClick={e => e.stopPropagation()} // Evita cerrar al hacer clic dentro
            >
                {/* Encabezado del Modal */}
                <header className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <TrendingUp className="w-6 h-6 text-blue-600" />
                        {isEditing ? 'Editar Rubro' : 'Crear Nuevo Rubro'}
                    </h2>
                    <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 p-1 rounded-full transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </header>

                {/* Contenido/Cuerpo del Formulario */}
                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                        
                        {/* Mensaje de API (Éxito o Error global) */}
                                                {(saveMessage || apiError) && (
                                                        <div className="mb-2">
                                                            <Alert variant={saveMessage?.type === 'success' ? 'default' : 'destructive'}>
                                                                <AlertTitle>{saveMessage?.type === 'success' ? 'Éxito' : 'Error'}</AlertTitle>
                                                                <AlertDescription>{saveMessage?.text || apiError}</AlertDescription>
                                                            </Alert>
                                                        </div>
                                                )}
                        
                        {/* Campos Principales */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="codigo">Código *</Label>
                                <Input
                                    type="text"
                                    id="codigo"
                                    name="codigo"
                                    value={formData.codigo || ''}
                                    onChange={handleChange}
                                    required
                                    maxLength={10}
                                    className={validationErrors.codigo ? 'border-red-500' : ''}
                                />
                                {renderError('codigo')}
                            </div>
                            <div>
                                <Label htmlFor="nombre">Nombre *</Label>
                                <Input
                                    type="text"
                                    id="nombre"
                                    name="nombre"
                                    value={formData.nombre || ''}
                                    onChange={handleChange}
                                    required
                                    maxLength={100}
                                    className={validationErrors.nombre ? 'border-red-500' : ''}
                                />
                                {renderError('nombre')}
                            </div>
                        </div>

                        {/* Descripción */}
                            <div>
                                <Label htmlFor="descripcion">Descripción</Label>
                                <textarea
                                    id="descripcion"
                                    name="descripcion"
                                    value={formData.descripcion || ''}
                                    onChange={handleChange}
                                    rows="3"
                                    className={`w-full px-4 py-2 border rounded-xl shadow-sm focus:ring-blue-500 focus:border-blue-500 transition-colors ${validationErrors.descripcion ? 'border-red-500' : 'border-gray-300'}`}
                                ></textarea>
                                {renderError('descripcion')}
                            </div>

                        {/* Promedios (Ratios) - Agrupados */}
                        <div className="border border-dashed border-gray-300 p-4 rounded-xl space-y-4">
                            <h3 className="text-md font-semibold text-gray-800">Benchmarks (Promedios Sectoriales)</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                
                                {/* Promedio Prueba Ácida */}
                                <div>
                                    <label htmlFor="promedio_prueba_acida" className="block text-sm font-medium text-gray-700 mb-1">P. Prueba Ácida (0.00)</label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        id="promedio_prueba_acida"
                                        name="promedio_prueba_acida"
                                        value={formData.promedio_prueba_acida}
                                        onChange={handleChange}
                                        className={`${validationErrors.promedio_prueba_acida ? 'border-red-500' : ''} text-right`}
                                        placeholder="0.00"
                                    />
                                    {renderError('promedio_prueba_acida')}
                                </div>
                                
                                {/* Promedio Liquidez Corriente */}
                                <div>
                                    <label htmlFor="promedio_liquidez_corriente" className="block text-sm font-medium text-gray-700 mb-1">P. Liquidez Corriente (0.00)</label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        id="promedio_liquidez_corriente"
                                        name="promedio_liquidez_corriente"
                                        value={formData.promedio_liquidez_corriente}
                                        onChange={handleChange}
                                        className={`${validationErrors.promedio_liquidez_corriente ? 'border-red-500' : ''} text-right`}
                                        placeholder="0.00"
                                    />
                                    {renderError('promedio_liquidez_corriente')}
                                </div>
                                
                                {/* Promedio Apalancamiento */}
                                <div>
                                    <label htmlFor="promedio_apalancamiento" className="block text-sm font-medium text-gray-700 mb-1">P. Apalancamiento (0.00)</label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        id="promedio_apalancamiento"
                                        name="promedio_apalancamiento"
                                        value={formData.promedio_apalancamiento}
                                        onChange={handleChange}
                                        className={`${validationErrors.promedio_apalancamiento ? 'border-red-500' : ''} text-right`}
                                        placeholder="0.00"
                                    />
                                    {renderError('promedio_apalancamiento')}
                                </div>
                                
                                {/* Promedio Rentabilidad */}
                                <div>
                                    <label htmlFor="promedio_rentabilidad" className="block text-sm font-medium text-gray-700 mb-1">P. Rentabilidad (0.00)</label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        id="promedio_rentabilidad"
                                        name="promedio_rentabilidad"
                                        value={formData.promedio_rentabilidad}
                                        onChange={handleChange}
                                        className={`${validationErrors.promedio_rentabilidad ? 'border-red-500' : ''} text-right`}
                                        placeholder="0.00"
                                    />
                                    {renderError('promedio_rentabilidad')}
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* Footer del Modal (Botones) */}
                        <footer className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex flex-col sm:flex-row justify-end gap-3 rounded-b-2xl">
                            <Button type="button" variant="primary" size="md" onClick={closeModal} disabled={isSubmitting} className="w-full sm:w-auto">Cancelar</Button>
                            <Button type="submit" variant="success" size="md" disabled={isSubmitting} className="flex items-center gap-2 w-full sm:w-auto justify-center">
                                {isSubmitting ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                    <Save className="h-5 w-5" />
                                )}
                                {isEditing ? 'Guardar Cambios' : 'Crear Rubro'}
                            </Button>
                        </footer>
                </form>
            </div>
             <style dangerouslySetInnerHTML={{__html: `
                @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
                @keyframes scale-in { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
                .animate-fade-in { animation: fade-in 0.2s ease-out; }
                .animate-scale-in { animation: scale-in 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
            `}} />
        </div>
    );
};

export default RubroFormModal;
