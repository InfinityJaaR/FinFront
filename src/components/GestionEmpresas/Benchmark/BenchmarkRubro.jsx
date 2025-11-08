import { useEffect, useMemo, useState } from "react";
import { getRubroRatios } from "@/services/GestionEmpresas/Benchmark/BenchmarkRubroService";
import RubroService from "@/services/GestionEmpresas/Rubros/RubroService";
import RatioDefinicionService from "@/services/GestionEmpresas/Ratios/RatioDefinicionService";
import { getPeriodos } from "@/services/GestionEmpresas/Ratios/PeriodoService";
import EmpresasService from "@/services/GestionEmpresas/Empresas/EmpresasService";
import authService from "@/services/auth/authService";
import "./BenchmarkRubro.css";



export default function BenchmarkRubro() {
  const [rubros, setRubros] = useState([]);
  const [ratios, setRatios] = useState([]);
  const [periodos, setPeriodos] = useState([]);

  const [rubroId, setRubroId] = useState("");
  const [ratioId, setRatioId] = useState("");
  const [periodoId, setPeriodoId] = useState("");

  const [resultado, setResultado] = useState(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  // usuario actual
  const user = authService.getCurrentUser();
  const roles = (user?.roles || []).map(r => r.name);
  const isAnalista = roles.includes("Analista Financiero");
  const empresaIdUser = user?.empresa_id ?? null;
  

  // Cargar catálogos
  useEffect(() => {
    (async () => {
      try {
        const [rub, per] = await Promise.all([
          RubroService.getAllRubros(),
          getPeriodos(),
        ]);

        // definiciones básicas; si tienes un endpoint indexBasico, úsalo
        const defs = await RatioDefinicionService.getAllRatios(1, "");
        const defsArr = Array.isArray(defs) ? defs : (defs?.data ?? []);

        setRubros(Array.isArray(rub) ? rub : []);
        setRatios(defsArr);
        setPeriodos(per || []);

        // Si Analista: preseleccionar rubro según empresa del usuario
        if (isAnalista && empresaIdUser) {
          const emp = await EmpresasService.getEmpresa(empresaIdUser);
          if (emp?.rubro_id) setRubroId(String(emp.rubro_id));
        }
      } catch {
        setRubros([]);
        setRatios([]);
        setPeriodos([]);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const empresaIdAnalista = empresaIdUser;

  const obtener = async () => {
    setMsg("");
    setResultado(null);
    if (!rubroId || !ratioId || !periodoId) {
      setMsg("Seleccione rubro, ratio y periodo.");
      return;
    }
    setLoading(true);
    try {
      const data = await getRubroRatios(Number(rubroId), Number(ratioId), Number(periodoId));

      // Si analista: mover su empresa al tope (sin mutar data original)
      let empresas = data?.empresas ?? [];
      if (isAnalista && empresaIdAnalista) {
        empresas = [...empresas].sort((a, b) => (a.empresa_id === empresaIdAnalista ? -1 : b.empresa_id === empresaIdAnalista ? 1 : 0));
      }

      setResultado({
        ...data,
        empresas
      });
    } catch (e) {
      setMsg("No se pudieron obtener los datos.");
    } finally {
      setLoading(false);
    }
  };

  const sentido = resultado?.ratio?.sentido;
  const ref = resultado?.valor_referencia;

  const trClass = (row) => {
    const base = "border-b";
    if (isAnalista && row.empresa_id === empresaIdAnalista) {
      return base + " bg-yellow-50";
    }
    return base;
  };

  const badge = (cumple) => {
    if (cumple === null || typeof cumple === "undefined") {
      return <span className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-600">Sin datos</span>;
    }
    return cumple
      ? <span className="px-2 py-1 text-xs rounded bg-green-100 text-green-700">Cumple</span>
      : <span className="px-2 py-1 text-xs rounded bg-red-100 text-red-700">No cumple</span>;
  };

  return (
    <div className="benchmark-container">
      <div className="benchmark-header">
        <h1>Benchmark por Rubro</h1>
        <p className="tiny italic mb-2">
          Esta vista permite comparar los ratios financieros de las empresas que pertenecen 
          a un mismo sector o rubro. 
          </p>
          <p className="tiny italic mb-2">
          El sistema evalúa si los valores individuales 
          cumplen o no con el estándar sectorial definido.
        </p>
      </div>

      <div className="benchmark-filters">
        <select
          className="border rounded px-3 py-2 min-w-[260px]"
          value={rubroId}
          onChange={(e) => setRubroId(e.target.value)}
          disabled={isAnalista} // analista no cambia rubro
        >
          <option value="">Seleccione rubro</option>
          {rubros.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
        </select>

        <select
          className="border rounded px-3 py-2 min-w-[260px]"
          value={ratioId}
          onChange={(e) => setRatioId(e.target.value)}
        >
          <option value="">Seleccione ratio</option>
          {ratios.map(r => (
            <option key={r.id} value={r.id}>
              {r.nombre ?? r.codigo}
            </option>
          ))}
        </select>

        <select
          className="border rounded px-3 py-2"
          value={periodoId}
          onChange={(e) => setPeriodoId(e.target.value)}
        >
          <option value="">Periodo</option>
          {periodos.map(p => <option key={p.id} value={p.id}>{p.anio}</option>)}
        </select>

        <button
          onClick={obtener}
          disabled={loading || !rubroId || !ratioId || !periodoId}
          className="px-4 py-2 rounded bg-blue-600 text-white hover:brightness-110 disabled:opacity-50"
        >
          {loading ? "Cargando..." : "Obtener resultados"}
        </button>

        {!!msg && <span className="text-red-600 text-sm">{msg}</span>}
      </div>

          {resultado && (
        <div className="benchmark-table-container">
          <div className="benchmark-table-header">
            <span>Ratio: <b>{resultado.ratio?.nombre}</b></span>
            <span style={{ marginLeft: "1.2rem" }}>
              Sentido: <b>{sentido}</b>
            </span>
            <span style={{ marginLeft: "1.2rem" }}>
              Referencia del sector: <b>{ref ?? "—"}</b>
            </span>
          </div>

          <table className="benchmark-table">
            <thead>
              <tr>
                <th>Empresa</th>
                <th>Valor</th>
                <th>Referencia</th>
                <th>Resultado</th>
              </tr>
            </thead>
            <tbody>
              {(resultado.empresas || []).map(row => (
                <tr
                  key={row.empresa_id}
                  className={row.empresa_id === empresaIdUser ? "benchmark-highlight" : ""}
                >
                  <td>{row.empresa}</td>
                  <td>{row.valor ?? "—"}</td>
                  <td>{ref ?? "—"}</td>
                  <td>
                    {row.cumple === null || typeof row.cumple === "undefined" ? (
                      <span className="badge badge-gray">Sin datos</span>
                    ) : row.cumple ? (
                      <span className="badge badge-green">Cumple</span>
                    ) : (
                      <span className="badge badge-red">No cumple</span>
                    )}
                  </td>
                </tr>
              ))}
              {(!resultado.empresas || resultado.empresas.length === 0) && (
                <tr>
                  <td colSpan="4" className="benchmark-empty">
                    Sin datos disponibles
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
