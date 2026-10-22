// Importes en céntimos enteros para calcular sin errores de coma flotante.
// En JavaScript 0.1 + 0.2 no da 0.3: por eso nunca se suman importes como decimales.

// Como DECIMAL(10,2): hasta 8 cifras enteras y 2 decimales. Se admite coma o punto.
const AMOUNT_PATTERN = /^(\d{1,8})(?:[.,](\d{1,2}))?$/;

// "20,5" → 2050 céntimos. Devuelve null si el texto no es un importe válido.
export function parseCents(text: string): number | null {
  const match = AMOUNT_PATTERN.exec(text.trim());
  if (!match) {
    return null;
  }
  const decimals = (match[2] ?? '').padEnd(2, '0');
  return Number(match[1]) * 100 + Number(decimals);
}

// 2050 → "20.50", el formato de texto que espera la API
export function centsToApi(cents: number): string {
  return `${Math.floor(cents / 100)}.${String(cents % 100).padStart(2, '0')}`;
}

// Mismo reparto que la API (split_equally): parte redondeada hacia abajo al céntimo
// y los céntimos sobrantes, de uno en uno, empezando por el menor user_id.
// Solo se usa para la vista previa: las partes reales las calcula la API.
export function splitEqually(cents: number, userIds: number[]): Map<number, number> {
  const ids = [...userIds].sort((a, b) => a - b);
  const base = Math.floor(cents / ids.length);
  const leftover = cents - base * ids.length;
  return new Map(ids.map((id, i) => [id, base + (i < leftover ? 1 : 0)]));
}
