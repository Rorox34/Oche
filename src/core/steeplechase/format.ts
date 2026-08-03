import type { SteeplechaseConfig, SteeplechaseTarget } from './types.ts';

export function formatTarget(target: SteeplechaseTarget | undefined): string {
  if (!target) return '✓';
  return target.kind === 'bull' ? 'Bull' : String(target.value);
}

/** Libellé court pour l'en-tête de jeu. */
export const formatConfigShort = (config: SteeplechaseConfig): string =>
  config.finalBull ? '1 → 20 + Bull' : '1 → 20';

/** Libellé complet des règles (écran de victoire). */
export const formatConfig = (config: SteeplechaseConfig): string =>
  `Course ${config.finalBull ? '1 → 20 puis Bull' : '1 → 20'} · simple = 1 haie, double = 2, triple = 3 ` +
  `· volée sans aucune touche = chute (recul d'1 haie)`;
