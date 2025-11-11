import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import EmpresasService from '@/services/GestionEmpresas/Empresas/EmpresasService';
import RubroService from '@/services/GestionEmpresas/Rubros/RubroService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
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
      // Al volver a la lista, indicamos que se debe refrescar y mostrar la primera página
      navigate('/dashboard/gestion-empresas/empresas', { state: { refresh: true } });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-6">Cargando empresa...</div>;

  return (
    <div className="p-4 sm:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-3xl mx-auto w-full">
        <header className="mb-6 empresa-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h1 className="text-xl sm:text-2xl font-bold mb-0">{isCreate ? 'Crear Empresa' : isEdit ? 'Editar Empresa' : 'Ver Empresa'}</h1>

          {isView && (
            <button onClick={() => navigate(`/dashboard/empresas/${id}/ratios/comparaciones`)} className="btn-comparaciones w-full sm:w-auto text-left sm:text-center">Comparaciones internas</button>
          )}
        </header>

        {error && (
          <div className="mb-4">
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 bg-white p-4 sm:p-6 rounded-lg shadow">
        <div>
          <Label>Código</Label>
          <Input name="codigo" value={form.codigo || ''} onChange={handleChange} disabled={isView} className="mt-1" />
        </div>
        <div>
          <Label>Nombre</Label>
          <Input name="nombre" value={form.nombre || ''} onChange={handleChange} disabled={isView} className="mt-1" />
        </div>
        <div>
          <Label>Rubro</Label>
          <Select value={form.rubro_id ? String(form.rubro_id) : ''} onValueChange={(v) => setForm(prev => ({ ...prev, rubro_id: v }))} disabled={isView}>
            <SelectTrigger aria-label="Seleccionar rubro">
              <SelectValue placeholder="-- Seleccione --" />
            </SelectTrigger>
            <SelectContent>
              {rubros.map(r => (
                <SelectItem key={r.id} value={String(r.id)}>{r.nombre}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Descripción</Label>
          <textarea
            name="descripcion"
            value={form.descripcion || ''}
            onChange={handleChange}
            disabled={isView}
            className="mt-1 w-full min-h-[80px] p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-150"
            placeholder="Descripción opcional de la empresa"
          />
        </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end space-y-2 sm:space-y-0 sm:space-x-3 mt-4">
            <Button type="button" onClick={() => navigate(-1)} variant="outline" size="lg" className="w-full sm:w-auto">Volver</Button>

            {!isView && (
              <Button type="submit" disabled={saving} variant="primary" size="lg" className="w-full sm:w-auto">
                {saving ? 'Guardando...' : 'Guardar'}
              </Button>
            )}
          </div>

      </form>
      </div>
    </div>
  );
};

export default EmpresaFormPage;
