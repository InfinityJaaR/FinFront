import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getListas, getMapeoData, saveMapeo } from "@/services/GestionCuentas/MapeoService";

export default function AsignacionCatalogoGeneral() {
  const navigate = useNavigate();

  
  const [empresas, setEmpresas] = useState([]);
  
  const [empresaId, setEmpresaId] = useState("");

  const [conceptos, setConceptos] = useState([]);
  const [cuentas, setCuentas] = useState([]);
  const [mapeos, setMapeos] = useState({});
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  // Cargar rubros + empresas (opcionalmente filtrando por rubro)
  const cargarListas = async () => {
    try {
      
      const data = await getListas();
      setEmpresas(data.empresas || []);
    } catch {
      setMsg("No se pudieron cargar listas.");
    }
  };

  useEffect(() => {
    cargarListas();
  }, []);

  // Cuando cambia rubro, recargar empresas filtradas
  const onChangeRubro = async (val) => {
    setRubroId(val);
    setEmpresaId("");
    setConceptos([]);
    setCuentas([]);
    setMapeos({});
    await cargarListas(val || null);
  };

  // Cargar datos de mapeo cuando se elige empresa
  const cargarMapeo = async (eid) => {
    if (!eid) return;
    setLoading(true);
    setMsg("");
    try {
      const data = await getMapeoData(eid);
      setConceptos(data.conceptos || []);
      setCuentas(data.cuentasEmpresa || []);
      const ini = {};
      (data.mapeos || []).forEach(m => { ini[m.concepto_id] = m.catalogo_cuenta_id; });
      setMapeos(ini);
    } catch {
      setMsg("No se pudieron cargar los datos de mapeo.");
    } finally {
      setLoading(false);
    }
  };

  const onChangeEmpresa = (val) => {
    setEmpresaId(val);
    setConceptos([]);
    setCuentas([]);
    setMapeos({});
    if (val) cargarMapeo(Number(val));
  };

  const cuentasAsignadas = useMemo(
    () => new Set(Object.values(mapeos).filter(Boolean)),
    [mapeos]
  );

  const handleSelectCuenta = (conceptoId, cuentaIdStr) => {
    const cuentaId = cuentaIdStr ? Number(cuentaIdStr) : null;
    if (cuentaId && cuentasAsignadas.has(cuentaId) && mapeos[conceptoId] !== cuentaId) {
      setMsg("Esa cuenta ya está asignada a otro concepto.");
      setTimeout(() => setMsg(""), 2500);
      return;
    }
    setMapeos(prev => ({ ...prev, [conceptoId]: cuentaId }));
  };

  const handleGuardar = async () => {
    try {
      if (!empresaId) { setMsg("Selecciona una empresa."); return; }
      const hayAlgo = Object.values(mapeos).some(v => v !== null && v !== undefined);
      if (!hayAlgo) { setMsg("Asigna al menos una cuenta."); return; }

      await saveMapeo(Number(empresaId), mapeos);
      setMsg("Mapeos guardados.");
      setTimeout(() => setMsg(""), 2000);
    } catch (e) {
      setMsg(e?.response?.data?.message || "No se pudo guardar.");
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Asignación de Catálogo</h2>
        <div className="flex gap-2">
          <button
            className="px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
            onClick={handleGuardar}
            disabled={!empresaId || loading}
          >
            Guardar
          </button>
          <button
            className="px-4 py-2 rounded-md bg-gray-100 hover:bg-gray-200"
            onClick={() => navigate(-1)}
          >
            Volver
          </button>
        </div>
      </div>

      {msg && <div className="mb-3 text-sm text-blue-700">{msg}</div>}

      {/* Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        <div>
          <label className="block text-sm mb-1">Empresa</label>
          <select
            className="border px-2 py-2 rounded w-full"
            value={empresaId}
            onChange={(e) => onChangeEmpresa(e.target.value)}
          >
            <option value="">— Seleccionar —</option>
            {empresas.map(emp => (
              <option key={emp.id} value={emp.id}>{emp.nombre}</option>
            ))}
          </select>
        </div>
      </div>

      {loading && <div className="p-2">Cargando…</div>}

      {/* Tablas */}
      {!!empresaId && !loading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Catálogo del sistema */}
          <div className="border rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-2 font-semibold">Catálogo del sistema</div>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="text-left px-3 py-2 w-40">Código</th>
                  <th className="text-left px-3 py-2">Concepto</th>
                </tr>
              </thead>
              <tbody>
                {conceptos.map(c => (
                  <tr key={c.id} className="border-t">
                    <td className="px-3 py-2">{c.codigo}</td>
                    <td className="px-3 py-2">{c.nombre_concepto}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Asignación por concepto */}
          <div className="border rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-2 font-semibold">Catálogo de la empresa</div>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="text-left px-3 py-2">Concepto</th>
                  <th className="text-left px-3 py-2">Cuenta de la empresa</th>
                </tr>
              </thead>
              <tbody>
                {conceptos.map(c => (
                  <tr key={c.id} className="border-t">
                    <td className="px-3 py-2">{c.nombre_concepto}</td>
                    <td className="px-3 py-2">
                      <select
                        className="border px-2 py-1 rounded w-full"
                        value={mapeos[c.id] ?? ""}
                        onChange={(e) => handleSelectCuenta(c.id, e.target.value)}
                      >
                        <option value="">— Elegir cuenta —</option>
                        {cuentas.map(cta => (
                          <option key={cta.id} value={cta.id}>
                            {cta.codigo} — {cta.nombre}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-4 py-2 text-xs text-gray-500">
              La misma cuenta no puede asignarse a más de un concepto.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
