import React, { useEffect, useState } from "react";
import { getListas, getMapeoData, saveMapeo } from "@/services/GestionCuentas/MapeoService";
import Button from "@/components/ui/Button";

export default function AsignacionCatalogo() {
  const [empresas, setEmpresas] = useState([]);
  const [empresaId, setEmpresaId] = useState("");
  const [conceptos, setConceptos] = useState([]);
  const [cuentasEmpresa, setCuentasEmpresa] = useState([]);
  const [mapeo, setMapeo] = useState({});
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  // 1️⃣ Cargar lista de empresas y conceptos globales
  useEffect(() => {
    const cargarListas = async () => {
      try {
        const data = await getListas();
        setEmpresas(data.empresas || []);
      } catch {
        setMsg("No se pudieron cargar las empresas.");
      }
    };
    cargarListas();
  }, []);

  // 2️⃣ Cargar mapeo de la empresa seleccionada
  const cargarMapeo = async (id) => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await getMapeoData(id);

      setConceptos(data.conceptos || []);
      setCuentasEmpresa(data.cuentasEmpresa || []);

      // Convertir el array de mapeos [{concepto_id, catalogo_cuenta_id}, ...]
      // a un objeto clave-valor { concepto_id: catalogo_cuenta_id }
      const mapObj = {};
      if (data.mapeos && Array.isArray(data.mapeos)) {
        data.mapeos.forEach((m) => {
          mapObj[m.concepto_id] = m.catalogo_cuenta_id;
        });
      }
      setMapeo(mapObj);
    } catch {
      setMsg("Error al cargar datos del mapeo.");
    } finally {
      setLoading(false);
    }
  };

  const handleEmpresaChange = (e) => {
    const id = e.target.value;
    setEmpresaId(id);
    setMapeo({});
    cargarMapeo(id);
  };

  // 3️⃣ Manejar cambio de select y evitar duplicados
  const handleSelectChange = (conceptoId, cuentaId) => {
    setMapeo((prev) => ({
      ...prev,
      [conceptoId]: cuentaId,
    }));
  };

  const cuentasSeleccionadas = Object.values(mapeo).filter(Boolean);

  const handleGuardar = async () => {
    if (!empresaId) return setMsg("Seleccione una empresa.");
    try {
      setLoading(true);
      await saveMapeo(empresaId, mapeo);
      setMsg("Mapeo guardado correctamente.");
    } catch {
      setMsg("Error al guardar el mapeo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Asignación de Catálogo</h1>

      {/* Selector de empresa */}
      <div className="mb-6">
        <label className="block font-medium mb-1">Empresa</label>
        <select
          className="border rounded-md p-2 w-full"
          value={empresaId}
          onChange={handleEmpresaChange}
        >
          <option value="">-- Seleccione empresa --</option>
          {empresas.map((emp) => (
            <option key={emp.id} value={emp.id}>
              {emp.nombre}
            </option>
          ))}
        </select>
      </div>

      {msg && <div className="mb-4 text-red-600">{msg}</div>}

      {/* Tabla de asignación */}
      {conceptos.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full border border-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 text-left w-1/4">Código del Sistema</th>
                <th className="p-2 text-left w-1/3">Concepto del Sistema</th>
                <th className="p-2 text-left w-1/3">Cuenta de la Empresa</th>
              </tr>
            </thead>
            <tbody>
  {conceptos.map((concepto) => {
    // Convertimos el ID actual a número
    const cuentaAsignadaId = Number(mapeo[concepto.id]);

    // Creamos una lista filtrada de cuentas
    const opcionesDisponibles = cuentasEmpresa.filter((cuenta) => {
      const cuentaId = Number(cuenta.id);
      // Si ya está seleccionada en otro concepto, la ocultamos
      const usadaEnOtro = Object.entries(mapeo).some(
        ([otroConceptoId, otroCuentaId]) =>
          Number(otroCuentaId) === cuentaId &&
          Number(otroConceptoId) !== Number(concepto.id)
      );
      return !usadaEnOtro || cuentaAsignadaId === cuentaId;
    });

    return (
      <tr key={concepto.id} className="border-t">
        <td className="p-2 font-mono text-gray-700">{concepto.codigo}</td>
        <td className="p-2">{concepto.nombre_concepto}</td>
        <td className="p-2">
          <select
            className="border rounded-md p-1 w-full"
            value={mapeo[concepto.id] || ""}
            onChange={(e) =>
              handleSelectChange(concepto.id, e.target.value)
            }
          >
            <option value="">— Elegir cuenta —</option>
            {opcionesDisponibles.map((cuenta) => (
              <option key={cuenta.id} value={cuenta.id}>
                {cuenta.codigo} — {cuenta.nombre}
              </option>
            ))}
          </select>
        </td>
      </tr>
    );
  })}
</tbody>

          </table>
        </div>
      )}

      {/* Botones */}
      <div className="mt-6 flex justify-end space-x-2">
        <Button
          onClick={handleGuardar}
          disabled={loading}
          variant="success"
          size="md"
        >
          {loading ? "Guardando..." : "Guardar"}
        </Button>
        <Button
          onClick={() => window.history.back()}
          variant="primary"
          size="md"
        >
          Volver
        </Button>
      </div>

      <p className="text-xs text-gray-500 mt-3">
        La misma cuenta no puede asignarse a más de un concepto.
      </p>
    </div>
  );
}
