import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import RatioService from '@/services/GestionEmpresas/Ratios/RatioDefinicionService';
import Button from '@/components/ui/Button';
import { useModal } from '@/context/ModalContext'

const RatioFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isCreate = location.pathname.endsWith('/create');
  const isEdit = !!id && location.pathname.endsWith('/edit');
  const isView = !!id && !location.pathname.endsWith('/edit');

  const [form, setForm] = useState({ codigo: '', nombre: '', formula: '' });
  const [conceptos, setConceptos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const modal = useModal();

  useEffect(() => {
    // cargar datos para create (conceptos disponibles)
    RatioService.getRatioCreationData().then(r => {
      if (r && r.conceptos_disponibles) setConceptos(r.conceptos_disponibles);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if ((isEdit || isView) && id) {
      setLoading(true);
      RatioService.getRatioDefinicion(id)
        .then(res => setForm(res))
        .catch(err => setError(err.message || 'Error al cargar ratio'))
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
        await RatioService.updateRatio(id, form);
        await modal.alert({ title: 'Éxito', message: 'Ratio actualizado' });
      } else {
        await RatioService.createRatio(form);
        await modal.alert({ title: 'Éxito', message: 'Ratio creado' });
      }
      navigate('/dashboard/gestion-empresas/definicion-ratios');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-6">Cargando definición de ratio...</div>;

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{isCreate ? 'Crear Definición de Ratio' : isEdit ? 'Editar Definición de Ratio' : 'Ver Definición de Ratio'}</h1>
      </header>

      {error && <div className="mb-4 text-red-600">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-lg shadow">
        <div>
          <label className="block text-sm font-medium text-gray-700">Código</label>
          <input name="codigo" value={form.codigo || ''} onChange={handleChange} disabled={isView} className="mt-1 block w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Nombre</label>
          <input name="nombre" value={form.nombre || ''} onChange={handleChange} disabled={isView} className="mt-1 block w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Fórmula</label>
          <input name="formula" value={form.formula || ''} onChange={handleChange} disabled={isView} className="mt-1 block w-full border rounded px-3 py-2" />
        </div>

        <div className="flex items-center justify-end space-x-2">
          <Button onClick={() => navigate(-1)} variant="primary" size="md">Volver</Button>
          {!isView && (
            <Button type="submit" disabled={saving} variant="success" size="md">
              {saving ? 'Guardando...' : 'Guardar'}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
};

export default RatioFormPage;
