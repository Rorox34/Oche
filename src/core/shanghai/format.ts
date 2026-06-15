import type { ShanghaiConfig } from './types.ts';

export const RANGE_LABELS = {
  '1-7': '1 → 7',
  '1-10': '1 → 10',
  '1-20': '1 → 20',
} as const;

export const ORDER_LABELS = {
  ascending: 'Croissant',
  random: 'Aléatoire',
} as const;

/** Libellé court pour l'en-tête de jeu. */
export function formatVariantShort(config: ShanghaiConfig): string {
  const range = RANGE_LABELS[config.range];
  return config.orderId === 'random' ? `${range} · Aléatoire` : range;
}

/** Libellé complet de la variante (écran de victoire). */
export function formatVariant(config: ShanghaiConfig): string {
  const parts = [`Manches ${RANGE_LABELS[config.range]}`, ORDER_LABELS[config.orderId]];
  if (config.shanghaiWin) parts.push('Victoire Shanghai (S+D+T)');
  return parts.join(' · ');
}
