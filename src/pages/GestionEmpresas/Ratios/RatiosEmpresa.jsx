import { useEffect, useState } from "react";
import { getRatiosEmpresa, generarRatiosEmpresa } from "../../../services/GestionEmpresas/Ratios/RatiosEmpresaService";
import { Wand2, Eye } from "lucide-react";
import EmpresaService from "../../../services/GestionEmpresas/Empresas/EmpresasService";
import { getPeriodos } from "../../../services/GestionEmpresas/Ratios/PeriodoService";


export default function RatiosEmpresa({ empresaId }) {
  const [empresaNombre, setEmpresaNombre] = useState("");
  const [periodos, setPeriodos] = useState([]);
  const [periodoId, setPeriodoId] = useState("");
  const [valores, setValores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  // (opcional) lee permisos del localStorage si tu login los guarda ahí
  const permissions = JSON.parse(localStorage.getItem("permissions") || "[]");
  const puedeCalcular = permissions.includes("calcular_ratios");


  useEffect(() => {
  if (!empresaId) return;
  EmpresaService.getEmpresa(empresaId)
    .then((data) => {
      const nombre = data?.nombre || data?.data?.nombre;
      setEmpresaNombre(nombre || `Empresa #${empresaId}`);
    })
    .catch(() => setEmpresaNombre(`Empresa #${empresaId}`));
}, [empresaId]);

useEffect(() => {
  getPeriodos()
    .then((data) => {
      // Mapeamos para mostrar el año como label
      const list = data.map(p => ({ id: p.id, label: p.anio.toString() }));
      setPeriodos(list);
    })
    .catch(() => setPeriodos([]));
}, []);

  const cargar = async () => {
    if (!empresaId || !periodoId) return;
    try {
      setLoading(true);
      setMsg("");
      const data = await getRatiosEmpresa(empresaId, periodoId);
      setValores(data?.valores ?? []);
    } catch (err) {
      const s = err?.response?.status;
      if (s === 401) setMsg("Sesión expirada. Inicia sesión nuevamente.");
      else if (s === 403) setMsg("No tienes permiso para ver ratios.");
      else setMsg("Error al cargar resultados.");
      setValores([]);
    } finally {
      setLoading(false);
    }
  };

  const generar = async () => {
    if (!empresaId || !periodoId) { setMsg("Seleccione periodo"); return; }
    try {
      setLoading(true);
      setMsg("");
      const data = await generarRatiosEmpresa(empresaId, periodoId);
      if (data?.success) {
        setMsg("Ratios generados");
        await cargar(); // recarga resultados
      } else {
        setMsg(data?.message || "Error al generar");
      }
    } catch (err) {
      const s = err?.response?.status;
      if (s === 401) setMsg("Sesión expirada. Inicia sesión nuevamente.");
      else if (s === 403) setMsg("No tienes permiso para generar ratios.");
      else setMsg("Error al generar ratios.");
    } finally {
      setLoading(false);
    }
  };

  // (opcional) formato bonito para porcentajes
const formatValor = (v, code) => {
  if (v === null || v === undefined) return "—";
  const n = Number(v);
  const esPorcentaje = ["ROE", "MARG_OP"].includes(code); // los que quieras mostrar como %
  const txt = (esPorcentaje ? n * 100 : n).toLocaleString("es-SV", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return esPorcentaje ? `${txt}%` : txt;
};

  return (
      
    <div className="p-4">
  <h2 className="text-xl font-semibold mb-3">
    Ratios de {empresaNombre || `Empresa #${empresaId}`}
  </h2>

  {/* Contenedor principal con botones a la izquierda y volver a la derecha */}
  <div className="flex flex-wrap items-center justify-between mb-4">
    {/* Bloque izquierdo: select y botones de acción */}
    <div className="flex flex-wrap items-center gap-2">
      <select
        className="border border-gray-300 p-2 rounded-md focus:ring-2 focus:ring-indigo-400 focus:outline-none"
        value={periodoId}
        onChange={(e) => setPeriodoId(e.target.value)}
      >
        <option value="">Seleccione periodo</option>
        {periodos.map((p) => (
          <option key={p.id} value={p.id}>
            {p.label}
          </option>
        ))}
      </select>

      {/* Botón Generar ratios */}
      <button
        onClick={generar}
        disabled={!periodoId || loading || !puedeCalcular}
        title={!puedeCalcular ? "No tiene permiso: calcular_ratios" : ""}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-md 
                   bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-medium
                   shadow-sm hover:shadow-lg hover:brightness-110 
                   active:scale-[0.98] transition-all
                   disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Wand2 className="w-4 h-4" />
        {loading ? "Procesando…" : "Generar ratios"}
      </button>

      {/* Botón Ver resultados (mejor contraste que el gris anterior) */}
      <button
        onClick={cargar}
        disabled={!periodoId || loading}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-md 
                   border border-gray-300 bg-gray-100 text-gray-800 font-medium
                   hover:bg-gray-200 hover:shadow-sm active:scale-[0.98]
                   transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Eye className="w-4 h-4 text-gray-700" />
        Ver resultados
      </button>

      {loading && (
        <span className="text-sm text-gray-500">Procesando…</span>
      )}
      {msg && <span className="text-sm ml-2">{msg}</span>}
    </div>

    {/* Botón rojo de volver atrás */}
    <button
      onClick={() => window.history.back()}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-md 
                 bg-red-600 text-white font-medium shadow-sm
                 hover:bg-red-700 hover:shadow-md active:scale-[0.98]
                 transition-all focus:outline-none focus:ring-2 focus:ring-red-400"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="w-4 h-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 19l-7-7 7-7"
        />
      </svg>
      Volver atrás
    </button>
  </div>
  


      <table className="w-full border">
        <thead>
          <tr className="bg-gray-50">
            <th className="p-2 text-left">Código</th>
            <th className="p-2 text-left">Nombre</th>
            <th className="p-2 text-right">Valor</th>
          </tr>
        </thead>
        <tbody>
          {valores.map(v=>(
            <tr key={v.codigo} className="border-t">
              <td className="p-2">{v.codigo}</td>
              <td className="p-2">{v.nombre}</td>
              <td className="p-2 text-right">{formatValor(v.valor, v.codigo)}</td>
            </tr>
          ))}
          {!valores.length && !loading && (
            <tr><td className="p-3 text-center text-gray-500" colSpan={3}>Sin datos</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
