/**
 * Formatea un precio en guaraníes (PYG).
 * Ejemplo: 150000 → "₲ 150.000"
 */
export function formatPrice(amount: number | string, currency = 'PYG'): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;

  if (currency === 'PYG') {
    return `₲ ${new Intl.NumberFormat('es-PY', { maximumFractionDigits: 0 }).format(num)}`;
  }

  return new Intl.NumberFormat('es-PY', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(num);
}
