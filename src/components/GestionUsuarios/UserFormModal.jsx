import React, { useState, useEffect } from 'react';
import { X, User, Mail, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Componente de formulario para crear/editar usuarios
 */
const UserFormModal = ({ isOpen, onClose, onSubmit, user, empresas, analistaRole }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        empresa_id: '',
        role_id: analistaRole?.id || 2 // Por defecto Analista Financiero
    });
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Debug: Ver qué empresas llegan al componente
    useEffect(() => {
        console.log('Empresas recibidas en modal:', empresas);
    }, [empresas]);

    // Cargar datos del usuario si es edición
    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || '',
                email: user.email || '',
                empresa_id: user.empresa_id || '',
                role_id: user.roles?.[0]?.id || analistaRole?.id || 2
            });
        } else {
            setFormData({
                name: '',
                email: '',
                empresa_id: '',
                role_id: analistaRole?.id || 2
            });
        }
        setErrors({});
    }, [user, analistaRole, isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        // Limpiar error del campo
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: null
            }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.name.trim()) {
            newErrors.name = 'El nombre es requerido';
        }

        if (!formData.email.trim()) {
            newErrors.email = 'El email es requerido';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Email inválido';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        setIsSubmitting(true);

        try {
            // Preparar datos para enviar
            const dataToSend = {
                name: formData.name.trim(),
                email: formData.email.trim(),
                role_id: formData.role_id,
                empresa_id: formData.empresa_id || null
            };

            await onSubmit(dataToSend);
            onClose();
        } catch (error) {
            console.error('Error al enviar formulario:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/20 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-blue-500 p-6 text-white rounded-t-2xl">
                    <div className="flex justify-between items-center">
                        <h2 className="text-2xl font-bold">
                            {user ? 'Editar Usuario' : 'Nuevo Usuario'}
                        </h2>
                        <button
                            onClick={onClose}
                            className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
                        >
                            <X className="h-6 w-6" />
                        </button>
                    </div>
                    <p className="text-indigo-100 mt-2 text-sm">
                        {user 
                            ? 'Actualiza la información del usuario Analista Financiero'
                            : 'Crea un nuevo usuario con rol de Analista Financiero'}
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Nombre */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <User className="inline h-4 w-4 mr-1" />
                            Nombre completo
                            <span className="text-red-500 ml-1">*</span>
                        </label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all ${
                                errors.name ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="Ej: Juan Pérez"
                        />
                        {errors.name && (
                            <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                        )}
                    </div>

                    {/* Email */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <Mail className="inline h-4 w-4 mr-1" />
                            Email
                            <span className="text-red-500 ml-1">*</span>
                        </label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            disabled={!!user} // No permitir cambiar email en edición
                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all ${
                                errors.email ? 'border-red-500' : 'border-gray-300'
                            } ${user ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                            placeholder="Ej: juan.perez@empresa.com"
                        />
                        {errors.email && (
                            <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                        )}
                        {user && (
                            <p className="text-gray-500 text-xs mt-1">
                                El email no puede ser modificado
                            </p>
                        )}
                    </div>

                    {/* Empresa */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <Building2 className="inline h-4 w-4 mr-1" />
                            Empresa
                        </label>
                        <select
                            name="empresa_id"
                            value={formData.empresa_id}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                        >
                            <option value="">Sin empresa asignada</option>
                            {empresas.map((empresa) => (
                                <option key={empresa.id} value={empresa.id}>
                                    {empresa.nombre}
                                </option>
                            ))}
                        </select>
                        <p className="text-gray-500 text-xs mt-1">
                            Opcional: Asigna una empresa al usuario
                        </p>
                    </div>

                    {/* Botones */}
                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={isSubmitting}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="bg-gradient-to-r from-indigo-600 to-blue-500 hover:from-indigo-700 hover:to-blue-600"
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                                    Guardando...
                                </>
                            ) : (
                                user ? 'Actualizar Usuario' : 'Crear Usuario'
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UserFormModal;
