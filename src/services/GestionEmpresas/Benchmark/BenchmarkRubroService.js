import axios from "axios";
import url from "../../utils/url";

const API = `${url}`; // debe terminar en /api/

const authHeaders = () => {
  const t = localStorage.getItem("token");
  return t ? { Authorization: `Bearer ${t}` } : {};
};

export async function getRubroRatios(rubroId, ratioId, periodoId) {
  const params = new URLSearchParams({ rubro_id: rubroId, ratio_id: ratioId, periodo_id: periodoId });
  const res = await axios.get(`${API}benchmark/rubro-ratios?${params.toString()}`, {
    headers: authHeaders(),
  });
  return res.data;
}
