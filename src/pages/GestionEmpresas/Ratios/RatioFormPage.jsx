import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import RatioService from '@/services/GestionEmpresas/Ratios/RatioDefinicionService';
import authService from '@/services/auth/authService'
import Button from '@/components/ui/Button';
import { useModal } from '@/context/ModalContext'

const defaultComponentItem = () => ({ concepto_id: '', rol: 'NUMERADOR', orden: 1, requiere_promedio: false, sentido: 1, operator: '+' });

const RatioFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isCreate = location.pathname.endsWith('/create');
  const isEdit = !!id && location.pathname.endsWith('/edit');
  const isView = !!id && !location.pathname.endsWith('/edit');

  const [form, setForm] = useState({ codigo: '', nombre: '', formula: '', sentido: 'MAYOR_MEJOR', categoria: '', multiplicador: 1.0, is_protected: false, componentes: [defaultComponentItem(), defaultComponentItem()] });
  const [conceptos, setConceptos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const modal = useModal();

  useEffect(() => {
    // cargar datos para create (conceptos disponibles)
    RatioService.getRatioCreationData().then(r => {
      if (r && r.conceptos_disponibles) setConceptos(r.conceptos_disponibles);
    }).catch(() => {});
    // cargar categorias
    RatioService.getCategories().then(c => {
      setCategorias(Array.isArray(c) ? c : []);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if ((isEdit || isView) && id) {
      setLoading(true);
      RatioService.getRatioDefinicion(id)
        .then(res => {
          // Normalizar la estructura recibida para usar en el formulario
          const normalized = {
            codigo: res.codigo || '',
            nombre: res.nombre || '',
            formula: res.formula || '',
            sentido: res.sentido || 'MAYOR_MEJOR',
            categoria: res.categoria || res.categoria_id || '',
            multiplicador: res.multiplicador ?? res.multiplier ?? 1.0,
            is_protected: res.is_protected ?? false,
            componentes: Array.isArray(res.componentes) ? res.componentes.map(c => {
              // puede venir con pivot: { pivot: { rol, orden, requiere_promedio, sentido } }
              const pivot = c.pivot || {};
              return {
                concepto_id: c.id || c.concepto_id || pivot.concepto_id || '',
                rol: pivot.rol || c.rol || 'NUMERADOR',
                orden: pivot.orden ?? c.orden ?? 1,
                requiere_promedio: pivot.requiere_promedio ?? c.requiere_promedio ?? false,
                sentido: pivot.sentido ?? c.sentido ?? 1,
                operator: pivot.operator ?? ( (pivot.sentido ?? c.sentido ?? 1) === -1 ? '-' : '+' ),
              };
            }) : [defaultComponentItem(), defaultComponentItem()]
          };
          setForm(normalized);
        })
        .catch(err => setError(err.message || 'Error al cargar ratio'))
        .finally(() => setLoading(false));
    }
  }, [id, isEdit, isView]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const updateComponent = (index, field, value) => {
    setForm(prev => {
      const componentes = Array.isArray(prev.componentes) ? [...prev.componentes] : [];
      componentes[index] = { ...componentes[index], [field]: value };
      return { ...prev, componentes };
    });
  };

  // util: obtener nombre legible del concepto
  const getConceptName = (conceptoId) => {
    const c = conceptos.find(x => Number(x.id) === Number(conceptoId));
    return c ? (c.nombre_concepto || c.nombre || c.label || `concepto_${conceptoId}`) : `concepto_${conceptoId}`;
  };

  // Genera la fórmula textual a partir de componentes y operadores
  const generateFormula = () => {
    const comps = Array.isArray(form.componentes) ? form.componentes : [];
    const byRole = role => comps.filter(x => x.rol === role).sort((a,b) => Number(a.orden) - Number(b.orden));
    const joinGroup = (group) => {
      if (!group.length) return '';
      return group.map((c, idx) => {
        const name = getConceptName(c.concepto_id);
        const op = c.operator || (Number(c.sentido) === -1 ? '-' : '+');
        if (idx === 0) return name;
        // map × to × in display
        return `${op === '*' ? ' * ' : op === 'x' ? ' * ' : ` ${op} `}${name}`;
      }).join('');
    };
    // Numerador incluye NUMERADOR y OPERANDO mezclados por orden
    const numeradorGroup = comps.filter(x => x.rol === 'NUMERADOR' || x.rol === 'OPERANDO').sort((a,b) => Number(a.orden) - Number(b.orden));
    const numerador = joinGroup(numeradorGroup);
    const denominador = joinGroup(byRole('DENOMINADOR'));
    const formula = `(${numerador || '0'}) / (${denominador || '1'})`;
    return formula;
  };

  // Keep preview in sync with components
  useEffect(() => {
    const f = generateFormula();
    setForm(prev => ({ ...prev, formula: f }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.componentes, conceptos]);

  const addComponent = () => {
    setForm(prev => ({ ...prev, componentes: [...(prev.componentes || []), defaultComponentItem()] }));
  };

  const removeComponent = (index) => {
    setForm(prev => ({ ...prev, componentes: prev.componentes.filter((_, i) => i !== index) }));
  };

  const validateForm = () => {
    if (!form.codigo || !form.nombre || !form.formula) {
      setError('Código, Nombre y Fórmula son obligatorios.');
      return false;
    }
    if (!form.categoria) {
      setError('La categoría es obligatoria.');
      return false;
    }
    if (!Array.isArray(form.componentes) || form.componentes.length < 2) {
      setError('Se requieren al menos 2 componentes.');
      return false;
    }
    // validar que exista al menos un NUMERADOR y un DENOMINADOR
    const hasNumerador = (form.componentes || []).some(c => c.rol === 'NUMERADOR');
    const hasDenominador = (form.componentes || []).some(c => c.rol === 'DENOMINADOR');
    if (!hasNumerador || !hasDenominador) {
      setError('La definición debe contener al menos un NUMERADOR y un DENOMINADOR.');
      return false;
    }
    // validar cada componente
    for (let i = 0; i < form.componentes.length; i++) {
      const c = form.componentes[i];
      if (!c.concepto_id) { setError(`El componente ${i + 1} debe tener un concepto seleccionado.`); return false; }
      if (!c.rol) { setError(`El componente ${i + 1} debe tener un rol.`); return false; }
      if (!c.orden || Number(c.orden) < 1) { setError(`El componente ${i + 1} debe tener un orden >= 1.`); return false; }
      if (![1, -1].includes(Number(c.sentido))) { setError(`El componente ${i + 1} debe tener sentido 1 o -1.`); return false; }
    }
    setError(null);
    return true;
  };

  const preparePayload = () => {
    // enviar: { codigo, nombre, formula, sentido, componentes: [...] }
    return {
      codigo: form.codigo,
      nombre: form.nombre,
      formula: form.formula,
      sentido: form.sentido,
      categoria: form.categoria,
      multiplicador: Number(form.multiplicador) || 1.0,
      is_protected: !!form.is_protected,
      componentes: (form.componentes || []).map(c => ({
        concepto_id: Number(c.concepto_id),
        rol: c.rol,
        orden: Number(c.orden),
        requiere_promedio: !!c.requiere_promedio,
        sentido: Number(c.sentido)
      }))
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setSaving(true);
    setError(null);
    try {
      const payload = preparePayload();
      if (isEdit && id) {
        await RatioService.updateRatio(id, payload);
        await modal.alert({ title: 'Éxito', message: 'Ratio actualizado' });
      } else {
        await RatioService.createRatio(payload);
        await modal.alert({ title: 'Éxito', message: 'Ratio creado' });
      }
      navigate('/dashboard/gestion-empresas/definicion-ratios');
    } catch (err) {
      // manejar errores de validación del servidor (Laravel)
      const serverErrors = err.response?.data?.errors;
      if (serverErrors) {
        // concatenar mensajes
        const first = Object.values(serverErrors).flat()[0];
        setError(first || 'Error en la validación del servidor');
      } else {
        setError(err.response?.data?.message || err.message || 'Error al guardar');
      }
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
          <label className="block text-sm font-medium text-gray-700">Fórmula (previsualización)</label>
          <div className="mt-1 block w-full border rounded px-3 py-3 bg-gray-50 text-sm text-gray-800">
            {form.formula || '(fórmula vacía)'}
          </div>
        </div>

        {/* Leyenda explicativa para campos clave */}
        <div className="bg-blue-50 border border-blue-100 p-3 rounded mb-4">
          <strong className="block text-sm font-medium text-blue-800 mb-1">Leyenda</strong>
          <ul className="text-sm text-gray-700 list-disc list-inside space-y-1">
            <li><strong>Orden:</strong> Posición del componente en la fórmula. Numeración empieza en 1; determina la secuencia de evaluación/visualización.</li>
            <li><strong>Sentido:</strong> Indica si la contribución del componente es positiva (<code>1</code>) o negativa (<code>-1</code>) en el cálculo del ratio.</li>
            <li><strong>Multiplicador:</strong> Factor que se aplica al resultado final (ej.: <code>100</code> para mostrar porcentaje). Se define en el campo "Multiplicador".</li>
          </ul>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Componentes</label>
          <div className="mt-2 space-y-3">
            {(form.componentes || []).map((c, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-gray-50 p-3 rounded">
                <div className="col-span-4 flex items-center space-x-2">
                  {/* operador (solo para preview) */}
                  <div className="w-16">
                    <label className="text-xs text-gray-600">Op</label>
                    <select disabled={isView} value={c.operator} onChange={(e) => updateComponent(idx, 'operator', e.target.value)} className="mt-1 block w-full border rounded px-2 py-1">
                      <option value="+">+</option>
                      <option value="-">-</option>
                      <option value="*">×</option>
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-gray-600">Concepto</label>
                    <select disabled={isView} value={c.concepto_id} onChange={(e) => updateComponent(idx, 'concepto_id', e.target.value)} className="mt-1 block w-full border rounded px-2 py-1">
                      <option value="">-- Seleccionar --</option>
                      {conceptos.map(con => (
                        <option key={con.id} value={con.id}>{con.nombre_concepto || con.nombre || con.label || con.nombre_concepto}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-gray-600">Rol</label>
                  <select disabled={isView} value={c.rol} onChange={(e) => updateComponent(idx, 'rol', e.target.value)} className="mt-1 block w-full border rounded px-2 py-1">
                    <option value="NUMERADOR">NUMERADOR</option>
                    <option value="DENOMINADOR">DENOMINADOR</option>
                    <option value="OPERANDO">OPERANDO</option>
                  </select>
                </div>
                <div className="col-span-1">
                  <label className="text-xs text-gray-600">Orden</label>
                  <input disabled={isView} type="number" min="1" value={c.orden} onChange={(e) => updateComponent(idx, 'orden', e.target.value)} className="mt-1 block w-full border rounded px-2 py-1" />
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-gray-600">Promedio</label>
                  <div className="mt-1">
                    <label className="inline-flex items-center">
                      <input disabled={isView} type="checkbox" checked={!!c.requiere_promedio} onChange={(e) => updateComponent(idx, 'requiere_promedio', e.target.checked)} className="form-checkbox" />
                      <span className="ml-2 text-sm text-gray-700">Requiere promedio</span>
                    </label>
                  </div>
                </div>
                <div className="col-span-1">
                  <label className="text-xs text-gray-600">Sentido</label>
                  <select disabled={isView} value={c.sentido} onChange={(e) => updateComponent(idx, 'sentido', e.target.value)} className="mt-1 block w-full border rounded px-2 py-1">
                    <option value={1}>1</option>
                    <option value={-1}>-1</option>
                  </select>
                </div>
                <div className="col-span-2 flex justify-end">
                  {!isView && (
                    <Button variant="danger" size="sm" onClick={() => removeComponent(idx)}>Eliminar</Button>
                  )}
                </div>
              </div>
            ))}
          </div>
          {!isView && (
            <div className="mt-3">
              <Button variant="primary" size="sm" onClick={addComponent}>Agregar componente</Button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-6">
            <label className="block text-sm font-medium text-gray-700">Categoría</label>
            <select name="categoria" value={form.categoria} onChange={handleChange} disabled={isView} className="mt-1 block w-full border rounded px-3 py-2">
              <option value="">-- Seleccionar --</option>
              {categorias.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div className="col-span-3">
            <label className="block text-sm font-medium text-gray-700">Multiplicador</label>
            <input name="multiplicador" value={form.multiplicador} onChange={handleChange} disabled={isView} type="number" step="0.01" className="mt-1 block w-full border rounded px-3 py-2" />
          </div>
          <div className="col-span-3 flex items-end justify-end">
            <label className="inline-flex items-center">
              <input name="is_protected" type="checkbox" checked={!!form.is_protected} onChange={(e) => setForm(prev => ({ ...prev, is_protected: e.target.checked }))} disabled={isView} className="form-checkbox" />
              <span className="ml-2 text-sm text-gray-700">Protegida</span>
            </label>
          </div>

          <div className="col-span-12 flex items-center justify-end space-x-2">
            <Button onClick={() => navigate(-1)} variant="primary" size="md">Volver</Button>
            {!isView && ( (authService.hasPermission && authService.hasPermission('gestionar_ratios_definicion')) || (authService.getUserRole && authService.getUserRole() === 'Administrador') ) && (
              <Button type="submit" disabled={saving} variant="success" size="md">
                {saving ? 'Guardando...' : 'Guardar'}
              </Button>
            )}
            {!isView && !( (authService.hasPermission && authService.hasPermission('gestionar_ratios_definicion')) || (authService.getUserRole && authService.getUserRole() === 'Administrador') ) && (
              <div className="text-sm text-gray-500">No tienes permiso para guardar.</div>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};

export default RatioFormPage;
