import type { GolfCricketConfig } from './types.ts';

/** Score relatif au par, façon golf : « PAR », « +3 », « -2 ». */
export function formatRelativePar(rel: number): string {
  if (rel === 0) return 'PAR';
  return rel > 0 ? `+${rel}` : `${rel}`;
}

/** Libellé court pour l'en-tête de jeu. */
export const formatConfigShort = (config: GolfCricketConfig): string => `${config.holes} trous · fermeture à 3 marques`;

/** Libellé complet des règles (écran de victoire). */
export const formatConfig = (config: GolfCricketConfig): string =>
  `${config.holes} trous · fermez chaque trou en 3 marques (simple = 1, double = 2, triple = 3) · chaque fléchette compte un coup, le plus rapide gagne`;
