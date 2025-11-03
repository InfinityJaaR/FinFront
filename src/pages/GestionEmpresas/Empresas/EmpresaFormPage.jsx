import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import EmpresasService from '@/services/GestionEmpresas/Empresas/EmpresasService';
import RubroService from '@/services/GestionEmpresas/Rubros/RubroService';
import Button from '@/components/ui/Button';
import { useModal } from '@/context/ModalContext'
import "./EmpresaFormPage.css";


const EmpresaFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isCreate = location.pathname.endsWith('/create');
  const isEdit = !!id && location.pathname.endsWith('/edit');
  const isView = !!id && !location.pathname.endsWith('/edit');

  const [form, setForm] = useState({ codigo: '', nombre: '', descripcion: '', rubro_id: '' });
  const [rubros, setRubros] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const modal = useModal();

  useEffect(() => {
    // cargar rubros para el select
    RubroService.getAllRubros().then(list => setRubros(Array.isArray(list) ? list : [])).catch(() => {});
  }, []);

  useEffect(() => {
    if ((isEdit || isView) && id) {
      setLoading(true);
      EmpresasService.getEmpresa(id)
        .then(res => setForm(res))
        .catch(err => setError(err.message || 'Error al cargar empresa'))
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
        await EmpresasService.updateEmpresa(id, form);
        await modal.alert({ title: 'Éxito', message: 'Empresa actualizada' });
      } else {
        await EmpresasService.createEmpresa(form);
        await modal.alert({ title: 'Éxito', message: 'Empresa creada' });
      }
      navigate('/dashboard/gestion-empresas/empresas');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-6">Cargando empresa...</div>;

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <header className="mb-6 empresa-header">
  <h1 className="text-2xl font-bold mb-3">
    {isCreate ? 'Crear Empresa' : isEdit ? 'Editar Empresa' : 'Ver Empresa'}
  </h1>

  {isView && (
    <button
      onClick={() => navigate(`/dashboard/empresas/${id}/ratios/comparaciones`)}
      className="btn-comparaciones"
    >

      Comparaciones internas
    </button>
  )}
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
          <label className="block text-sm font-medium text-gray-700">Rubro</label>
          <select name="rubro_id" value={form.rubro_id || ''} onChange={handleChange} disabled={isView} className="mt-1 block w-full border rounded px-3 py-2">
            <option value="">-- Seleccione --</option>
            {rubros.map(r => (
              <option key={r.id} value={r.id}>{r.nombre}</option>
            ))}
          </select>
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

export default EmpresaFormPage;
