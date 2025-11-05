import axios from "axios";
import url from "../../utils/url";


const API = url; // debe terminar con /api/
const headers = () => {
  const t = localStorage.getItem("token");
  return t ? { Authorization: `Bearer ${t}` } : {};
};

export async function getEmpresasPorRubro(rubroId) {
  const { data } = await axios.get(`${API}rubros/${rubroId}/empresas`, { headers: headers() });
  return Array.isArray(data) ? data : data?.data ?? [];
}

export async function getBenchmarkSector({ rubro_id, ratio_id, periodo_id }) {
  const { data } = await axios.get(`${API}benchmark/sector-ratio`, {
    headers: headers(),
    params: { rubro_id, ratio_id, periodo_id },
  });
  return data; // { promedio, empresas:[{empresa_id,nombre,valor}], ratio:{mejor_es_mayor}}
}
