/**
 * Formatea un número como moneda
 * @param {number} amount - El monto a formatear
 * @param {string} currency - El código de moneda (por defecto 'USD')
 * @param {string} locale - El locale para el formato (por defecto 'es-ES')
 * @returns {string} El monto formateado como moneda
 */
export function formatCurrency(amount, currency = "USD", locale = "es-ES") {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

/**
 * Formatea un número con separadores de miles
 * @param {number} number - El número a formatear
 * @param {string} locale - El locale para el formato (por defecto 'es-ES')
 * @returns {string} El número formateado
 */
export function formatNumber(number, locale = "es-ES") {
  return new Intl.NumberFormat(locale).format(number)
}
