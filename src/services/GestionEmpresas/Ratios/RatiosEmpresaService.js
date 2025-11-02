// src/services/RatiosEmpresaService.js
import axios from 'axios';
import url from '../../utils/url';

// Igual que en EmpresaService: tomar token desde localStorage
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export async function getRatiosEmpresa(empresaId, periodoId) {
  const resp = await axios.get(`${url}empresas/${empresaId}/ratios`, {
    params: { periodo_id: periodoId },
    headers: {
      ...getAuthHeaders(),
      Accept: 'application/json', // evita redirect a /api/login
    },
    withCredentials: false, // usamos Bearer, no cookies
  });
  return resp.data;
}

export async function generarRatiosEmpresa(empresaId, periodoId) {
  const resp = await axios.post(
    `${url}empresas/${empresaId}/ratios/generar`,
    { periodo_id: periodoId },
    {
      headers: {
        ...getAuthHeaders(),
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      withCredentials: false,
    }
  );
  return resp.data;
}
