// src/components/GestionEmpresas/Ratios/RatiosComparativos.jsx
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import "./RatiosComparativos.css";
import { getPeriodos } from "../../../services/GestionEmpresas/Ratios/PeriodoService";
import RatioDefinicionService from "../../../services/GestionEmpresas/Ratios/RatioDefinicionService";
import { getRatiosEmpresa } from "../../../services/GestionEmpresas/Ratios/RatiosEmpresaService";
import EmpresasService from "../../../services/GestionEmpresas/Empresas/EmpresasService";

export default function RatiosComparativos({ empresaId: empresaIdProp, nombreEmpresa: nombreProp }) {
  const params = useParams();
  const empresaId = Number(empresaIdProp ?? params?.id ?? params?.empresaId);
  const [empresaNombre, setEmpresaNombre] = useState(nombreProp || "Empresa xyz");

  const [periodos, setPeriodos] = useState([]);     // [{id, anio}]
  const [ratiosDefs, setRatiosDefs] = useState([]); // [{id, nombre, codigo}]
  const [cols, setCols] = useState([
  { key: (typeof crypto !== "undefined" && crypto?.randomUUID) ? crypto.randomUUID() : String(Date.now()), periodoId: null },
  { key: (typeof crypto !== "undefined" && crypto?.randomUUID) ? crypto.randomUUID() : String(Date.now()), periodoId: null }
]);

  const [valores, setValores] = useState({});       // { [periodoId]: { [ratioId]: valor } }
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ID seguro si el navegador no soporta crypto.randomUUID
  const safeId = () =>
    (typeof crypto !== "undefined" && crypto?.randomUUID)
      ? crypto.randomUUID()
      : String(Date.now() + Math.random());

  // 1) Cargar nombre de la empresa (si no se pasó por props)
  useEffect(() => {
    (async () => {
      try {
        if (!empresaId) {
          setError("No se encontró el ID de empresa.");
          return;
        }
        if (!nombreProp) {
          const empresa = await EmpresasService.getEmpresa(empresaId);
          if (empresa?.nombre) setEmpresaNombre(empresa.nombre);
        }
      } catch (e) {
        console.error("Error cargando empresa:", {
          message: e.message,
          status: e.response?.status,
          data: e.response?.data,
        });
        // Si falla, dejamos "Empresa xyz" para no romper la UI
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empresaId]);

  // 2) Cargar catálogos: periodos + definiciones
  useEffect(() => {
    (async () => {
      try {
        const p = await getPeriodos();

        // getAllRatios(page, search) → puede devolver array o paginator
        const defsPaginadas = await RatioDefinicionService.getAllRatios(1, "");
        const defs = Array.isArray(defsPaginadas)
          ? defsPaginadas
          : (defsPaginadas?.data ?? []);

        setPeriodos(Array.isArray(p) ? p : []);
        setRatiosDefs(defs);
      } catch (e) {
        console.error("Error cargando catálogos:", {
          message: e.message,
          status: e.response?.status,
          data: e.response?.data,
        });
        setError("No se pudieron cargar periodos/definiciones");
      }
    })();
  }, []);

  // 3) Evitar periodos duplicados
  const periodosSeleccionados = useMemo(
    () => new Set(cols.map(c => c.periodoId).filter(Boolean)),
    [cols]
  );

  const opcionesPeriodo = (currentId) =>
    periodos.filter(p => !periodosSeleccionados.has(p.id) || p.id === currentId);

  // 4) Añadir/Quitar/Cambiar columnas
  const handleAddCol = () => {
    if (cols.length >= 3) return;
    setCols(prev => [...prev, { key: safeId(), periodoId: null }]);
  };

  const handleRemoveCol = (key) => {
    setCols(prev => prev.filter(c => c.key !== key));
  };

  const handleChangePeriodo = (key, periodoId) => {
    // Asegura que guardamos números (evitar 422 por string raro)
    const pid = periodoId ? Number(periodoId) : null;
    setCols(prev => prev.map(c => (c.key === key ? { ...c, periodoId: pid } : c)));
  };

  // 5) Obtener ratios por cada periodo seleccionado
  const handleObtenerRatios = async () => {
    setError("");
    const targets = cols.map(c => c.periodoId).filter(Boolean);
    if (targets.length === 0) {
      setError("Selecciona al menos un periodo.");
      return;
    }

    setLoading(true);
    try {
      // Llamamos la misma función getRatiosEmpresa que usas en RatiosEmpresa.jsx
      const results = await Promise.all(
        targets.map(async (pid) => {
          const res = await getRatiosEmpresa(empresaId, pid);
          // misma lógica que en RatiosEmpresa
          const lista = res?.valores ?? res?.data?.valores ?? res?.data ?? [];
          // indexamos por ratio.codigo o id
          const indexado = {};
          (lista || []).forEach(item => {
            const key = item.codigo;
            indexado[key] = item.valor ?? null;
          });
          return { pid, indexado };
        })
      );

      const nuevo = {};
      results.forEach(({ pid, indexado }) => (nuevo[pid] = indexado));
      setValores(nuevo);
    } catch (e) {
      console.error("Error obteniendo ratios comparativos:", {
        status: e.response?.status,
        data: e.response?.data,
      });
      setError("No se pudieron obtener los ratios. Revisa la API o los periodos.");
    } finally {
      setLoading(false);
    }
  };


  // 6) Render de celdas
  const cellValue = (periodoId, ratioId) => {
    if (!periodoId) return "";
    const v = valores?.[periodoId]?.[ratioId];
    if (v === null || v === undefined) return "Sin datos";
    const num = Number(v);
    return Number.isNaN(num)
      ? String(v)
      : num.toLocaleString("es-SV", { maximumFractionDigits: 2 });
  };

  return (
    <div className="p-4 comparativos">
      <h2 className="text-xl font-semibold mb-1">{empresaNombre}</h2>
      <p className="text-sm text-gray-600 mb-4">Comparaciones internas</p>

      <div className="flex items-center gap-2 mb-3">
        <button
          className="btn btn-primary disabled:opacity-50"
          onClick={handleAddCol}
          disabled={cols.length >= 3}
          title="Máximo 3 periodos"
        >
          Añadir periodo (Máximo 3)
        </button>

        <button
          className="btn btn-success"
          onClick={handleObtenerRatios}
          disabled={loading || cols.every(c => !c.periodoId)}
          title="Consulta y llena la tabla para los periodos seleccionados"
        >
          {loading ? "Cargando..." : "Obtener ratios"}
        </button>

        {!!error && <span className="text-red-600 text-sm">{error}</span>}
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-[760px] w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="text-left px-3 py-2 border w-64">Ratios</th>

              {cols.map(col => (
                <th key={col.key} className="px-2 py-2 border w-56">
                  <div className="flex items-center gap-2">
                    <select
                      className="w-full border px-2 py-1 rounded"
                      value={col.periodoId ?? ""}
                      onChange={(e) => handleChangePeriodo(col.key, e.target.value ? Number(e.target.value) : null)}
                    >
                      <option value="">Seleccionar periodo</option>
                      {opcionesPeriodo(col.periodoId).map(p => (
                        <option key={p.id} value={p.id}>
                          {p.anio}
                        </option>
                      ))}
                    </select>

                    <button
                      className="btn-icon btn-icon-danger"
                      onClick={() => handleRemoveCol(col.key)}
                      title="Quitar columna"
                      disabled={cols[0].key === col.key}
                    >
                      ✕
                    </button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {ratiosDefs.length === 0 ? (
              <tr>
                <td className="px-3 py-3 border text-gray-500" colSpan={1 + cols.length}>
                  No hay definiciones de ratios.
                </td>
              </tr>
            ) : (
              ratiosDefs.map(r => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2 border">{r.nombre ?? r.codigo}</td>
                  {cols.map(col => (
                    <td key={col.key} className="px-3 py-2 border">
                      {col.periodoId ? cellValue(col.periodoId, r.codigo) : ""}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-500 mt-2">
        Si un periodo muestra “Sin datos”, revisa que existan estados financieros y que hayas generado los ratios para ese periodo.
      </p>
    </div>
  );
}
