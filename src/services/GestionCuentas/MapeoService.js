import axios from "axios";
import url from "../utils/url";

const API = `${url}`; // debe terminar en /api/
const authHeaders = () => {
  const t = localStorage.getItem("token");
  return t ? { Authorization: `Bearer ${t}` } : {};
};

export async function getListas(rubroId = null) {
  const qs = rubroId ? `?rubro_id=${rubroId}` : "";
  const res = await axios.get(`${API}catalogo/mapeo/listas${qs}`, { headers: authHeaders() });
  return res.data;
}

export async function getMapeoData(empresaId) {
  const res = await axios.get(`${API}empresas/${empresaId}/catalogo/mapeo`, {
    headers: authHeaders(),
  });
  return res.data;
}

export async function saveMapeo(empresaId, mapeos) {
  const res = await axios.post(
    `${API}empresas/catalogo/mapeo`,
    { empresa_id: empresaId, mapeos },
    { headers: { "Content-Type": "application/json", ...authHeaders() } }
  );
  return res.data;
}
