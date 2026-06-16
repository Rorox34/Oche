import { VARIANTS } from './rules.ts';
import type { GolfConfig } from './types.ts';

/** Score relatif au par, façon golf : « PAR », « +3 », « -2 ». */
export function formatRelativePar(rel: number): string {
  if (rel === 0) return 'PAR';
  return rel > 0 ? `+${rel}` : `${rel}`;
}

/** Libellé court pour l'en-tête de jeu. */
export const formatVariantShort = (config: GolfConfig): string =>
  `${config.holes} trous · ${VARIANTS[config.variant].label}`;

/** Libellé complet de la variante (écran de victoire). */
export const formatVariant = (config: GolfConfig): string =>
  `${config.holes} trous · ${VARIANTS[config.variant].description}`;
