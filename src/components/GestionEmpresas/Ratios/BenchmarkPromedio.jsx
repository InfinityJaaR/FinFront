import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";

import RubroService from "@/services/GestionEmpresas/Rubros/RubroService"; // getAllRubros()
import RatioDefinicionService from "@/services/GestionEmpresas/Ratios/RatioDefinicionService"; // getAllRatios
import { getPeriodos } from "@/services/GestionEmpresas/Ratios/PeriodoService";
import { getBenchmarkSector, getEmpresasPorRubro } from "@/services/GestionEmpresas/Benchmark/BenchmarkService";
import "./BenchmarkPromedio.css";

export default function BenchmarkPromedio() {
    const clsResultado = (empresaId) => {
  const r = resultado(empresaId);
  if (r === "Cumple") return "chip chip-ok";
  if (r === "No cumple") return "chip chip-bad";
  return "muted";
};

  const { id: empresaIdFromUrl } = useParams(); // por si llegas desde una empresa concreta
  const [rubros, setRubros] = useState([]);
  const [ratios, setRatios] = useState([]);
  const [periodos, setPeriodos] = useState([]);

  const [rubroId, setRubroId] = useState("");
  const [ratioId, setRatioId] = useState("");
  const [periodoId, setPeriodoId] = useState("");

  const [empresasOpciones, setEmpresasOpciones] = useState([]);
  const [rows, setRows] = useState([
    { key: 1, empresaId: "" },
    { key: 2, empresaId: "" },
  ]); // mínimo 2

  const [promedio, setPromedio] = useState(null);
  const [valores, setValores] = useState({}); // {empresaId: valor}
  const [sentido, setSentido] = useState("MAYOR_MEJOR"); // "MAYOR_MEJOR" | "MENOR_MEJOR" | "CERCANO_A_1"
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  // catálogos
  useEffect(() => {
    (async () => {
      const rubrosL = await RubroService.getAllRubros();
      const ratiosPage = await RatioDefinicionService.getAllRatios(1, "");
      const ratiosL = Array.isArray(ratiosPage) ? ratiosPage : (ratiosPage?.data ?? []);
      const periodosL = await getPeriodos();

      setRubros(rubrosL || []);
      setRatios(ratiosL || []);
      setPeriodos(periodosL || []);
    })();
  }, []);

  // al elegir rubro, cargar empresas del sector
  useEffect(() => {
    if (!rubroId) { setEmpresasOpciones([]); return; }
    getEmpresasPorRubro(rubroId).then(setEmpresasOpciones).catch(() => setEmpresasOpciones([]));
    // limpiar filas
    setRows(prev => prev.map(r => ({ ...r, empresaId: "" })));
  }, [rubroId]);

  const addRow = () => setRows(prev => prev.length >= 5 ? prev : [...prev, { key: Date.now(), empresaId: "" }]);
  const removeRow = (key) => setRows(prev => prev.length <= 2 ? prev : prev.filter(r => r.key !== key));
  const changeRowEmpresa = (key, empresaId) =>
    setRows(prev => prev.map(r => r.key === key ? { ...r, empresaId } : r));

  const empresaNombre = (id) => empresasOpciones.find(e => e.id === id)?.nombre || "—";

  // obtener datos
const obtener = async () => {
  setMsg("");

  // ✅ Validación: que haya sector, ratio, periodo
  if (!rubroId || !ratioId || !periodoId) {
    setMsg("Selecciona sector, ratio y periodo.");
    return;
  }

  // ✅ Validación: que al menos una empresa esté seleccionada
  const empresasSeleccionadas = rows
    .map(r => r.empresaId)
    .filter(id => id !== null && id !== undefined && id !== "");

  if (empresasSeleccionadas.length === 0) {
    setMsg("Selecciona al menos una empresa antes de obtener los ratios.");
    return;
  }

  setLoading(true);
  try {
    const data = await getBenchmarkSector({
      rubro_id: Number(rubroId),
      ratio_id: Number(ratioId),
      periodo_id: Number(periodoId),
    });
    setPromedio(data.promedio ?? null);
    setSentido(data?.ratio?.sentido || "MAYOR_MEJOR");
    const idx = {};
    (data.empresas || []).forEach(e => (idx[e.empresa_id] = e.valor));
    setValores(idx);
  } catch (e) {
    console.error("Benchmark ERROR:", {
      message: e?.message,
      status: e?.response?.status,
      data: e?.response?.data,
    });
    const s = e?.response?.status;
    if (s === 401) setMsg("No autorizado (401). Revisa el token.");
    else if (s === 403) setMsg("Prohibido (403). Falta rol/permisos.");
    else if (s === 404) setMsg("Ruta no encontrada (404).");
    else if (s === 422)
      setMsg(
        `Parámetros inválidos (422). rubro_id=${rubroId}, ratio_id=${ratioId}, periodo_id=${periodoId}`
      );
    else setMsg("No se pudieron obtener los datos del benchmark.");
  } finally {
    setLoading(false);
  }
};


  // resultado: Cumple / No cumple / Sin datos
const resultado = (empresaId) => {
   const v = valores?.[empresaId];
   if (v === null || v === undefined || promedio === null || promedio === undefined) return "Sin datos";
   const nv = Number(v);
   const np = Number(promedio);
   switch (sentido) {
     case "MAYOR_MEJOR":
       return nv >= np ? "Cumple" : "No cumple";
     case "MENOR_MEJOR":
       return nv <= np ? "Cumple" : "No cumple";
     case "CERCANO_A_1": {
       // más cerca de 1 que el promedio del sector
       const dv = Math.abs(nv - 1);
       const dp = Math.abs(np - 1);
       return dv <= dp ? "Cumple" : "No cumple";
     }
     default:
       return "Sin datos";
   }
 };

  const fmt = (x) => (x === null || x === undefined || x === "" ? "—" :
    Number(x).toLocaleString("es-SV", { maximumFractionDigits: 2 }));

  // Empresas disponibles para seleccionar (solo del sector, y opcionalmente evita duplicados)
  const seleccionados = useMemo(() => new Set(rows.map(r => r.empresaId).filter(Boolean)), [rows]);
  const opcionesEmpresa = (currentId) =>
    empresasOpciones.filter(e => !seleccionados.has(e.id) || e.id === currentId);

  return (
    <div className="p-4 benchmark">
      <h2 className="text-xl font-semibold mb-1">Benchmark Promedio</h2>
      <p className="text-sm text-gray-600 mb-4">Comparación de ratios por sector</p>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2 items-center mb-3">
        <select className="border px-3 py-2 rounded" value={rubroId} onChange={(e)=>setRubroId(e.target.value ? Number(e.target.value) : "")}>
          <option value="">Sector</option>
          {rubros.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
        </select>

        <select className="border px-3 py-2 rounded" value={ratioId} onChange={(e)=>setRatioId(e.target.value ? Number(e.target.value) : "")}>
          <option value="">Ratio</option>
          {ratios.map(r => <option key={r.id} value={r.id}>{r.nombre ?? r.codigo}</option>)}
        </select>

        <select className="border px-3 py-2 rounded" value={periodoId} onChange={(e)=>setPeriodoId(e.target.value ? Number(e.target.value) : "")}>
          <option value="">Periodo</option>
          {periodos.map(p => <option key={p.id} value={p.id}>{p.anio}</option>)}
        </select>

        <button className="btn btn-secondary" onClick={addRow} disabled={rows.length>=5}>Añadir empresa</button>
        <button className="btn btn-primary" onClick={obtener} disabled={loading}>{loading ? "Cargando..." : "Obtener ratios"}</button>
        {msg && <span className="text-red-600 text-sm">{msg}</span>}
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto card">
        <table className="min-w-[760px] w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="text-left px-3 py-2 border w-72">Empresas</th>
              <th className="text-right px-3 py-2 border w-40">Valor empresa</th>
              <th className="text-right px-3 py-2 border w-40">Ratio promedio</th>
              <th className="text-left px-3 py-2 border w-40">Resultado</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr key={row.key} className="hover:bg-gray-50">
                <td className="px-3 py-2 border">
                  <div className="flex items-center gap-2">
                    <select
                      className="border px-2 py-1 rounded w-full"
                      value={row.empresaId ?? ""}
                      onChange={(e)=>changeRowEmpresa(row.key, e.target.value ? Number(e.target.value) : "")}
                    >
                      <option value="">Elegir empresa</option>
                      {opcionesEmpresa(row.empresaId).map(e => (
                        <option key={e.id} value={e.id}>{e.nombre}</option>
                      ))}
                    </select>

                    <button className="btn-icon" onClick={()=>removeRow(row.key)} disabled={rows.length<=2}>✕</button>
                  </div>
                </td>
                <td className="px-3 py-2 border text-right">{fmt(valores[row.empresaId]) || <span className="muted">—</span>}</td>
                <td className="px-3 py-2 border text-right">{fmt(promedio) || <span className="muted">—</span>}</td>
                <td className="px-3 py-2 border">
                  {["Cumple", "No cumple"].includes(resultado(row.empresaId)) ? (
                <span className={clsResultado(row.empresaId)}>{resultado(row.empresaId)}</span>
                  ) : (
                    <span className="muted">Sin datos</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-500 mt-2">
        El promedio se calcula con todas las empresas del sector que tengan valor para el ratio y periodo seleccionados.
      </p>
    </div>
  );
}
