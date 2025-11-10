// Servicio de Suavizamiento Exponencial Simple (SES)
// Calcula pronósticos según la fórmula: F_nuevo = alpha * A_anterior + (1 - alpha) * B_anterior
// - datosHistoricos: array de números (ventas reales). Se recomienda 11 o 12 puntos.
// - alpha: número entre 0 y 1.
// - pronosticoInicial: valor semilla para el pronóstico del Mes 1.
// Retorna:
// {
//   pronosticos: number[] // longitud = datosHistoricos.length; pronosticos[0] = pronosticoInicial
//   pronosticoSiguiente: number // pronóstico para el mes siguiente a datosHistoricos.length
// }

export function suavizamientoExponencialSimple(datosHistoricos, alpha, pronosticoInicial) {
  if (!Array.isArray(datosHistoricos) || datosHistoricos.length < 1) {
    throw new Error('datosHistoricos debe tener al menos 1 valor')
  }
  if (!(alpha >= 0 && alpha <= 1)) {
    throw new Error('alpha debe estar entre 0 y 1')
  }
  const n = datosHistoricos.length
  const pronosticos = new Array(n)
  // Mes 1: el pronóstico inicial
  pronosticos[0] = Number(pronosticoInicial)
  // Meses 2..n: usar fórmula con el real del mes anterior y el pronóstico anterior
  for (let i = 1; i < n; i++) {
    const A_anterior = Number(datosHistoricos[i - 1] ?? 0)
    const B_anterior = Number(pronosticos[i - 1] ?? 0)
    pronosticos[i] = alpha * A_anterior + (1 - alpha) * B_anterior
  }
  // Pronóstico del mes siguiente (n+1)
  const A_ultimo = Number(datosHistoricos[n - 1] ?? 0)
  const B_ultimo = Number(pronosticos[n - 1] ?? 0)
  const pronosticoSiguiente = alpha * A_ultimo + (1 - alpha) * B_ultimo
  return { pronosticos, pronosticoSiguiente }
}

export default { suavizamientoExponencialSimple }
