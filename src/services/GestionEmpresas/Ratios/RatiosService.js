// src/services/ratios/RatiosService.js
import axios from "axios";
import url from "../../utils/url";

const API_URL = url; // ej. "http://localhost:8000/api/"

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

class RatiosService {
  async getPeriodos() {
    const { data } = await axios.get(`${API_URL}periodos`, {
      headers: getAuthHeaders(),
    });
    return Array.isArray(data) ? data : data?.data || [];
  }

  async getRatiosDefiniciones() {
    const { data } = await axios.get(`${API_URL}ratios/definiciones`, {
      headers: getAuthHeaders(),
    });
    return Array.isArray(data) ? data : data?.data || [];
  }

  async getRatiosPorPeriodo(empresaId, periodoId) {
    const { data } = await axios.get(`${API_URL}empresas/${empresaId}/ratios`, {
      headers: getAuthHeaders(),
      params: { periodo_id: periodoId }, // ⚠️ id del periodo, no el año
    });

    const arr = Array.isArray(data) ? data : data?.data || [];
    return arr.map((it) => ({
      ratio_id: it.ratio_definicion_id ?? it.ratio_id,
      valor: it.valor ?? it.resultado ?? null,
    }));
  }
}

export default new RatiosService();
