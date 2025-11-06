import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import RubroService from '@/services/GestionEmpresas/Rubros/RubroService';
import RatioService from '@/services/GestionEmpresas/Ratios/RatioDefinicionService';
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
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
  const [ratios, setRatios] = useState([]);
  const [benchmarks, setBenchmarks] = useState({}); // map ratioId -> { valor_promedio, fuente }
  const [showBenchmarks, setShowBenchmarks] = useState(false);
  const modal = useModal();

  useEffect(() => {
    if ((isEdit || isView) && id) {
      setLoading(true);
      RubroService.getRubro(id)
        .then(async res => {
          // Normalizar distintos shapes que el backend podría devolver:
          // - res puede ser el objeto rubro directamente
          // - res puede tener { rubro: {...}, benchmarks: [...] }
          // - res puede tener { data: { rubro: ... } }
          const rubroData = res?.rubro || res?.data?.rubro || res?.data || res;
          setForm(rubroData || {});

          // Buscar un array de benchmarks en varias ubicaciones posibles
          let bList = rubroData?.benchmarks || res?.benchmarks || res?.data?.benchmarks || [];
          // Si no viene en la respuesta principal, intentar obtenerlos por separado
          if ((!Array.isArray(bList) || !bList.length) && rubroData?.id) {
            try {
              const fetched = await RubroService.getBenchmarks(rubroData.id);
              bList = Array.isArray(fetched) ? fetched : (fetched?.data || []);
            } catch (err) {
              // no romper la carga del rubro si fallan los benchmarks
              bList = [];
            }
          }

          if (Array.isArray(bList) && bList.length) {
            const map = {};
            bList.forEach(b => {
              const rid = b.ratio_id ?? b.ratio?.id ?? b.ratioId ?? b.ratio_definicion?.id ?? null;
              if (!rid) return;
              map[rid] = {
                valor_promedio: b.valor_promedio ?? b.value ?? null,
                fuente: b.fuente ?? b.source ?? null,
              };
            });
            setBenchmarks(prev => ({ ...prev, ...map }));
          }
  })
        .catch(err => setError(err.message || 'Error al cargar rubro'))
        .finally(() => setLoading(false));
    }
  }, [id, isEdit, isView]);

  // cargar definiciones de ratios para la sección de benchmarks
  useEffect(() => {
    let mounted = true;
    RatioService.getAllRatios(1, '')
      .then(res => {
        // Normalizar: puede venir paginado o como array
        const list = Array.isArray(res) ? res : (res?.data || res?.data?.data || []);
        if (!mounted) return;
        setRatios(list);
        // inicializar benchmarks vacíos para cada ratio si no existen
        setBenchmarks(prev => {
          const next = { ...prev };
          list.forEach(r => {
            const idr = r.id || r.value || null;
            if (!idr) return;
            if (!next[idr]) next[idr] = { valor_promedio: '', fuente: '' };
          });
          return next;
        });
      })
      .catch(() => {});
    return () => { mounted = false; };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const updateBenchmark = (ratioId, field, value) => {
    setBenchmarks(prev => ({ ...prev, [ratioId]: { ...(prev[ratioId] || {}), [field]: value } }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      // Primero crear/actualizar rubro sin benchmarks
      const rubroPayload = {
        codigo: form.codigo,
        nombre: form.nombre,
        descripcion: form.descripcion,
        // incluir otros campos necesarios por el backend
      };

      let created;
      if (isEdit && id) {
        created = await RubroService.updateRubro(id, rubroPayload);
      } else {
        created = await RubroService.createRubro(rubroPayload);
      }

      // Normalizar id del rubro devuelto
      const rubroId = created?.rubro?.id || created?.id || created?.data?.id || id;

      // Preparar requests de benchmarks: sólo para valores completados
      const requests = Object.entries(benchmarks)
        .filter(([, b]) => b && b.valor_promedio !== '' && b.valor_promedio !== null && b.valor_promedio !== undefined)
        .map(([, b], idx) => {
          // necesitamos el ratio id; Object.entries lose key order, but we also need the key
          return null; // placeholder, we'll build properly below
        });

      // construir correctamente los requests incluyendo la key
      const benchmarkEntries = Object.entries(benchmarks).filter(([rid, b]) => b && b.valor_promedio !== '' && b.valor_promedio !== null && b.valor_promedio !== undefined);
      const benchmarkRequests = benchmarkEntries.map(([rid, b]) => {
        const payload = {
          ratio_id: Number(rid),
          valor_promedio: Number(String(b.valor_promedio).replace(',', '.')),
          fuente: b.fuente || null
        };
        return RubroService.createBenchmark(rubroId, payload).then(res => ({ ok: true, rid, res })).catch(err => ({ ok: false, rid, err }));
      });

      let results = [];
      if (benchmarkRequests.length) {
        // Ejecutar en paralelo
        results = await Promise.all(benchmarkRequests);
      }

      // Evaluar resultados
      const failed = results.filter(r => !r.ok);
      if (failed.length) {
        const failedList = failed.map(f => `Ratio ID ${f.rid}`).join(', ');
        await modal.alert({ title: 'Creación parcial', message: `Rubro creado (ID ${rubroId}), pero fallaron benchmarks: ${failedList}. Puedes reintentar individualmente.` });
      } else {
        await modal.alert({ title: 'Éxito', message: `Rubro ${isEdit ? 'actualizado' : 'creado'} correctamente` });
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

      {error && (
        <div className="mb-4">
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-lg shadow">
        <div>
          <Label>Código</Label>
          <Input name="codigo" value={form.codigo} onChange={handleChange} disabled={isView} className="mt-1" />
        </div>
        <div>
          <Label>Nombre</Label>
          <Input name="nombre" value={form.nombre} onChange={handleChange} disabled={isView} className="mt-1" />
        </div>
        <div>
          <Label>Descripción</Label>
          <textarea name="descripcion" value={form.descripcion} onChange={handleChange} disabled={isView} className="mt-1 block w-full border rounded px-3 py-2" />
        </div>

        <div className="border-t pt-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-medium">Benchmarks promedio por ratio</h3>
            <Button type="button" variant="ghost" size="sm" onClick={() => setShowBenchmarks(s => !s)}>{showBenchmarks ? 'Ocultar' : 'Mostrar'}</Button>
          </div>

          {showBenchmarks && (
            <div className="space-y-3">
              {ratios.length === 0 && <div className="text-sm text-gray-500">No hay definiciones de ratios cargadas.</div>}
              {ratios.map(r => {
                const rid = r.id || r.value;
                const b = benchmarks[rid] || { valor_promedio: '', fuente: '' };
                return (
                  <div key={rid} className="bg-gray-50 p-3 rounded grid grid-cols-12 gap-3 items-center">
                    <div className="col-span-4">
                      <div className="text-sm font-medium">{r.nombre || r.codigo || `Ratio ${rid}`}</div>
                      <div className="text-xs text-gray-500">{r.codigo ? `${r.codigo}` : ''}</div>
                    </div>
                    <div className="col-span-4 md:col-span-3">
                      <Label className="text-xs">Valor promedio</Label>
                      <Input type="number" step="0.01" value={b.valor_promedio ?? ''} onChange={(e) => updateBenchmark(rid, 'valor_promedio', e.target.value)} disabled={isView} className="mt-1" />
                    </div>
                    <div className="col-span-8 md:col-span-4">
                      <Label className="text-xs">Fuente</Label>
                      <Input type="text" value={b.fuente ?? ''} onChange={(e) => updateBenchmark(rid, 'fuente', e.target.value)} disabled={isView} className="mt-1" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end space-x-3 mt-4">
          <Button type="button" onClick={() => navigate(-1)} variant="outline" size="lg" className="px-5">Volver</Button>
          {!isView && (
            <Button type="submit" disabled={saving} variant="primary" size="lg" className="px-6">
              {saving ? 'Guardando...' : 'Guardar'}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
};

export default RubroFormPage;
