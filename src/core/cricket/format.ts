import { VARIANTS } from './rules.ts';
import type { CricketConfig, CricketTarget } from './types.ts';

export function formatTarget(target: CricketTarget): string {
  return target.kind === 'bull' ? 'Bull' : String(target.value);
}

/** Libellé court de la variante (en-tête de jeu). */
export const formatVariantShort = (config: CricketConfig): string =>
  VARIANTS[config.variant].label;

/** Libellé complet de la variante (écran de victoire). */
export const formatVariant = (config: CricketConfig): string =>
  VARIANTS[config.variant].description;
