import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import RubroService from '@/services/GestionEmpresas/Rubros/RubroService';
import Button from '@/components/ui/Button';
import { useModal } from '@/context/ModalContext'

const initial = {
  codigo: '',
  nombre: '',
  descripcion: '',
  promedio_prueba_acida: '',
  promedio_liquidez_corriente: '',
  promedio_apalancamiento: '',
  promedio_rentabilidad: '',
};

const RubroFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isCreate = location.pathname.endsWith('/create');
  const isEdit = !!id && location.pathname.endsWith('/edit');
  const isView = !!id && !location.pathname.endsWith('/edit');

  const [form, setForm] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const modal = useModal();

  useEffect(() => {
    if ((isEdit || isView) && id) {
      setLoading(true);
      RubroService.getRubro(id)
        .then(res => setForm(res))
        .catch(err => setError(err.message || 'Error al cargar rubro'))
        .finally(() => setLoading(false));
    }
  }, [id, isEdit, isView]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (isEdit && id) {
        await RubroService.updateRubro(id, form);
        await modal.alert({ title: 'Éxito', message: 'Rubro actualizado' });
      } else {
        await RubroService.createRubro(form);
        await modal.alert({ title: 'Éxito', message: 'Rubro creado' });
      }
      navigate('/dashboard/gestion-empresas/rubros');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-6">Cargando rubro...</div>;

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{isCreate ? 'Crear Rubro' : isEdit ? 'Editar Rubro' : 'Ver Rubro'}</h1>
      </header>

      {error && <div className="mb-4 text-red-600">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-lg shadow">
        <div>
          <label className="block text-sm font-medium text-gray-700">Código</label>
          <input name="codigo" value={form.codigo} onChange={handleChange} disabled={isView} className="mt-1 block w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Nombre</label>
          <input name="nombre" value={form.nombre} onChange={handleChange} disabled={isView} className="mt-1 block w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Descripción</label>
          <textarea name="descripcion" value={form.descripcion} onChange={handleChange} disabled={isView} className="mt-1 block w-full border rounded px-3 py-2" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm">P. Ácida</label>
            <input name="promedio_prueba_acida" value={form.promedio_prueba_acida || ''} onChange={handleChange} disabled={isView} className="mt-1 block w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm">P. Liquidez</label>
            <input name="promedio_liquidez_corriente" value={form.promedio_liquidez_corriente || ''} onChange={handleChange} disabled={isView} className="mt-1 block w-full border rounded px-3 py-2" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm">P. Apalancamiento</label>
            <input name="promedio_apalancamiento" value={form.promedio_apalancamiento || ''} onChange={handleChange} disabled={isView} className="mt-1 block w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm">P. Rentabilidad</label>
            <input name="promedio_rentabilidad" value={form.promedio_rentabilidad || ''} onChange={handleChange} disabled={isView} className="mt-1 block w-full border rounded px-3 py-2" />
          </div>
        </div>

        <div className="flex items-center justify-end space-x-2">
          <Button onClick={() => navigate(-1)} variant="default" size="md">Volver</Button>
          {!isView && (
            <button type="submit" disabled={saving} className="px-4 py-2 bg-indigo-600 text-white rounded">
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default RubroFormPage;
