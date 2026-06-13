import type { X01Config } from './types.ts';

export { dartKind, formatDart } from '../darts.ts';
export type { DartKind } from '../darts.ts';

export const IN_LABELS = {
  straight: 'Entrée directe',
  double: 'Double in',
  triple: 'Triple in',
  bull: 'Bull in',
} as const;

export const OUT_LABELS = {
  straight: 'Sortie directe',
  double: 'Double out',
  master: 'Master out',
} as const;

/** Libellé complet des règles, ex. "501 · Double in · Master out · 3 manches". */
export function formatRules(config: X01Config): string {
  const parts = [String(config.startScore), IN_LABELS[config.inRule], OUT_LABELS[config.outRule]];
  if (config.legsToWin > 1) parts.push(`${config.legsToWin} manches`);
  return parts.join(' · ');
}

/** Libellé court pour l'en-tête de jeu. */
export function formatRulesShort(config: X01Config): string {
  const parts = [String(config.startScore)];
  if (config.inRule !== 'straight') parts.push(IN_LABELS[config.inRule]);
  parts.push(OUT_LABELS[config.outRule]);
  return parts.join(' · ');
}
