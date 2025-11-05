import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import RatioService from '@/services/GestionEmpresas/Ratios/RatioDefinicionService';
import authService from '@/services/auth/authService'
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { Checkbox } from '@/components/ui/checkbox'
import { useModal } from '@/context/ModalContext'

const defaultComponentItem = () => ({ concepto_id: '', rol: 'NUMERADOR', orden: 1, requiere_promedio: false, sentido: 1, operacion: 'ADD', factor: 1.0 });

const RatioFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isCreate = location.pathname.endsWith('/create');
  const isEdit = !!id && location.pathname.endsWith('/edit');
  const isView = !!id && !location.pathname.endsWith('/edit');

  const [form, setForm] = useState({ codigo: '', nombre: '', formula: '', sentido: 'MAYOR_MEJOR', categoria: '', multiplicador_numerador: '', multiplicador_denominador: '', multiplicador_resultado: 1.0, is_protected: false, componentes: [defaultComponentItem(), defaultComponentItem()] });
  const [conceptos, setConceptos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [previewEmpresa, setPreviewEmpresa] = useState('');
  const [previewPeriodo, setPreviewPeriodo] = useState('');
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
                  operacion: pivot.operacion ?? c.operacion ?? 'ADD',
                  factor: pivot.factor ?? c.factor ?? 1.0,
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
        // map operacion to symbol for preview
        const mapOp = {
          'ADD': '+',
          'SUB': '-',
          'MUL': '*',
          'DIV': '/'
        };
        const op = mapOp[c.operacion] || (Number(c.sentido) === -1 ? '-' : '+');
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
      if (!c.operacion || !['ADD','SUB','MUL','DIV'].includes(String(c.operacion))) { setError(`El componente ${i + 1} debe tener una operación válida (ADD,SUB,MUL,DIV).`); return false; }
      if (c.factor === undefined || c.factor === null || isNaN(Number(c.factor))) { setError(`El componente ${i + 1} debe tener un factor numérico.`); return false; }
    }
    // validar multiplicadores opcionales (si vienen, deben ser numéricos)
    const mNum = form.multiplicador_numerador;
    const mDen = form.multiplicador_denominador;
    const mRes = form.multiplicador_resultado;
    if (mNum !== '' && mNum !== null && mNum !== undefined && isNaN(Number(mNum))) { setError('Multiplicador numerador debe ser numérico.'); return false; }
    if (mDen !== '' && mDen !== null && mDen !== undefined && isNaN(Number(mDen))) { setError('Multiplicador denominador debe ser numérico.'); return false; }
    if (mRes !== '' && mRes !== null && mRes !== undefined && isNaN(Number(mRes))) { setError('Multiplicador resultado debe ser numérico.'); return false; }
    setError(null);
    return true;
  };

  const preparePayload = () => {
    // enviar: { codigo, nombre, formula, sentido, componentes: [...] }
    const payload = {
      codigo: form.codigo,
      nombre: form.nombre,
      formula: form.formula,
      sentido: form.sentido,
      categoria: form.categoria,
      is_protected: !!form.is_protected,
      componentes: (form.componentes || []).map(c => ({
        concepto_id: Number(c.concepto_id),
        rol: c.rol,
        orden: Number(c.orden),
        requiere_promedio: !!c.requiere_promedio,
        sentido: Number(c.sentido),
        operacion: c.operacion,
        factor: Number(c.factor || 1.0)
      }))
    };

    // multiplicadores opcionales: si el campo está vacío, omitimos la propiedad
    if (form.multiplicador_numerador !== '' && form.multiplicador_numerador !== null && form.multiplicador_numerador !== undefined) {
      payload.multiplicador_numerador = Number(form.multiplicador_numerador);
    }
    if (form.multiplicador_denominador !== '' && form.multiplicador_denominador !== null && form.multiplicador_denominador !== undefined) {
      payload.multiplicador_denominador = Number(form.multiplicador_denominador);
    }
    if (form.multiplicador_resultado !== '' && form.multiplicador_resultado !== null && form.multiplicador_resultado !== undefined) {
      payload.multiplicador_resultado = Number(form.multiplicador_resultado);
    }

    return payload;
  };

  const handlePreview = async () => {
    if (!validateForm()) return;
    setError(null);
    try {
      const payload = preparePayload();
      // Añadir parámetros de preview (empresa/periodo) si están definidos
      if (previewEmpresa) payload.empresa_id = previewEmpresa;
      if (previewPeriodo) payload.periodo_id = previewPeriodo;

      // Usamos siempre el endpoint dry-run para que la previsualización refleje los cambios
      // locales (multiplicadores u otros) aunque estemos editando una definición existente.
      const resp = await RatioService.dryRun(payload);

      const data = resp?.data ?? resp;
      // Construir mensaje legible
      const lines = [];
      if (data?.result !== undefined) lines.push(`Resultado: ${data.result}`);
      if (data?.numerador !== undefined) lines.push(`Numerador: ${JSON.stringify(data.numerador)}`);
      if (data?.denominador !== undefined) lines.push(`Denominador: ${JSON.stringify(data.denominador)}`);
      if (data?.breakdown) lines.push(`Desglose: ${JSON.stringify(data.breakdown)}`);
      if (data?.warnings && data.warnings.length) lines.push(`Warnings: ${data.warnings.join('; ')}`);

      await modal.alert({ title: 'Vista previa', message: (<div className="text-left whitespace-pre-wrap">{lines.join('\n\n') || JSON.stringify(data)}</div>), iconType: 'info' });
    } catch (err) {
      console.error('Error en vista previa:', err);
      setError(err.response?.data?.message || err.message || 'Error al generar la vista previa');
    }
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

      {error && (
        <div className="mb-4">
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 bg-white p-4 md:p-6 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label>Código</Label>
            <Input name="codigo" value={form.codigo || ''} onChange={handleChange} disabled={isView} className="mt-1" />
          </div>

          <div>
            <Label>Categoría</Label>
            <Select value={form.categoria || ''} onValueChange={(v) => setForm(prev => ({ ...prev, categoria: v }))} disabled={isView}>
              <SelectTrigger className="w-full mt-1">
                <SelectValue placeholder="-- Seleccionar --" />
              </SelectTrigger>
              <SelectContent>
                {categorias.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Nombre</Label>
            <Input name="nombre" value={form.nombre || ''} onChange={handleChange} disabled={isView} className="mt-1" />
          </div>
        </div>
        <div>
          <Label>Fórmula (previsualización)</Label>
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
          <Label className="block text-sm font-medium text-gray-700">Componentes</Label>
          <div className="mt-2 space-y-3">
            {(form.componentes || []).map((c, idx) => (
              <div key={idx} className="bg-gray-50 p-3 rounded grid grid-cols-1 md:grid-cols-12 gap-2 items-center">
                <div className="md:col-span-3">
                  <Label className="text-xs">Oper.</Label>
                  <Select value={c.operacion || ''} onValueChange={(v) => updateComponent(idx, 'operacion', v)} disabled={isView}>
                    <SelectTrigger className="w-full mt-1">
                      <SelectValue placeholder="--" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ADD">ADD (+)</SelectItem>
                      <SelectItem value="SUB">SUB (-)</SelectItem>
                      <SelectItem value="MUL">MUL (*)</SelectItem>
                      <SelectItem value="DIV">DIV (/)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="md:col-span-4">
                  <Label className="text-xs">Concepto</Label>
                  <Select value={c.concepto_id ? String(c.concepto_id) : ''} onValueChange={(v) => updateComponent(idx, 'concepto_id', v)} disabled={isView}>
                    <SelectTrigger className="w-full mt-1">
                      <SelectValue placeholder="-- Seleccionar --" />
                    </SelectTrigger>
                    <SelectContent>
                      {conceptos.map(con => (
                        <SelectItem key={con.id} value={String(con.id)}>{con.codigo ? `${con.codigo} - ${con.nombre_concepto || con.nombre}` : (con.nombre_concepto || con.nombre)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="md:col-span-2">
                  <Label className="text-xs">Rol</Label>
                  <Select value={c.rol || 'NUMERADOR'} onValueChange={(v) => updateComponent(idx, 'rol', v)} disabled={isView}>
                    <SelectTrigger className="w-full mt-1">
                      <SelectValue placeholder="Rol" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NUMERADOR">NUMERADOR</SelectItem>
                      <SelectItem value="DENOMINADOR">DENOMINADOR</SelectItem>
                      <SelectItem value="OPERANDO">OPERANDO</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="md:col-span-1">
                  <Label className="text-xs">Orden</Label>
                  <Input disabled={isView} type="number" min="1" value={c.orden} onChange={(e) => updateComponent(idx, 'orden', e.target.value)} className="mt-1" />
                </div>

                <div className="md:col-span-1">
                  <Label className="text-xs">Sentido</Label>
                  <Select value={String(c.sentido)} onValueChange={(v) => updateComponent(idx, 'sentido', v)} disabled={isView}>
                    <SelectTrigger className="w-full mt-1">
                      <SelectValue placeholder="" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={String(1)}>1</SelectItem>
                      <SelectItem value={String(-1)}>-1</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="md:col-span-1">
                  <Label className="text-xs">Factor</Label>
                  <Input disabled={isView} type="number" step="0.01" value={c.factor} onChange={(e) => updateComponent(idx, 'factor', e.target.value)} className="mt-1" />
                </div>

                <div className="md:col-span-1 flex md:justify-end mt-2 md:mt-0">
                  {!isView && (
                    <Button type="button" variant="destructive" size="sm" onClick={() => removeComponent(idx)}>Eliminar</Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {!isView && (
            <div className="mt-3">
              <Button type="button" variant="primary" size="sm" onClick={addComponent}>Agregar componente</Button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-12 md:col-span-4">
            <Label>Multiplicador numerador</Label>
            <Input name="multiplicador_numerador" value={form.multiplicador_numerador ?? ''} onChange={(e) => setForm(prev => ({ ...prev, multiplicador_numerador: e.target.value }))} disabled={isView} type="number" step="0.01" className="mt-1" placeholder="ej. 1.0" />
            <p className="text-xs text-gray-500 mt-1">Escala el numerador (ej. 100 para transformar a % sólo el numerador).</p>
          </div>
          <div className="col-span-12 md:col-span-4">
            <Label>Multiplicador denominador</Label>
            <Input name="multiplicador_denominador" value={form.multiplicador_denominador ?? ''} onChange={(e) => setForm(prev => ({ ...prev, multiplicador_denominador: e.target.value }))} disabled={isView} type="number" step="0.01" className="mt-1" placeholder="ej. 1.0" />
            <p className="text-xs text-gray-500 mt-1">Escala el denominador.</p>
          </div>
          <div className="col-span-12 md:col-span-4 flex flex-col justify-end">
            <Label>Multiplicador resultado</Label>
            <Input name="multiplicador_resultado" value={form.multiplicador_resultado ?? ''} onChange={(e) => setForm(prev => ({ ...prev, multiplicador_resultado: e.target.value }))} disabled={isView} type="number" step="0.01" className="mt-1" placeholder="ej. 100" />
            <p className="text-xs text-gray-500 mt-1">Factor aplicado al resultado final (p.ej. 100 para %). Borra para enviar null/omitir.</p>
          </div>
          <div className="col-span-12 flex items-end justify-end">
            <label className="inline-flex items-center">
              <Checkbox checked={!!form.is_protected} onCheckedChange={(v) => setForm(prev => ({ ...prev, is_protected: !!v }))} disabled={isView} />
              <span className="ml-2 text-sm text-gray-700">Protegida</span>
            </label>
          </div>

          <div className="col-span-12 flex items-center justify-end space-x-2">
            <Button type="button" onClick={() => navigate(-1)} variant="primary" size="md">Volver</Button>
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
