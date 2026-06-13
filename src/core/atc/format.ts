import type { AtcConfig, AtcTarget } from './types.ts';

export function formatTarget(target: AtcTarget | undefined): string {
  if (!target) return '✓';
  if (target.kind === 'number') return String(target.value);
  switch (target.accept) {
    case 'outer':
      return '25';
    case 'bullseye':
      return '50';
    case 'any':
      return 'Bull';
  }
}

export const SEGMENT_LABELS = {
  any: 'Tous segments',
  singles: 'Simples',
  doubles: 'Doubles',
  triples: 'Triples',
} as const;

export const ORDER_LABELS = {
  ascending: '1 → 20',
  descending: '20 → 1',
  random: 'Aléatoire',
  board: 'Ordre plateau',
} as const;

export const BULL_LABELS = {
  any: '25 ou 50',
  bullseye: '50 uniquement',
  outerThenBullseye: '25 puis 50',
} as const;

/** Libellé complet de la variante (écran de victoire). */
export function formatVariant(config: AtcConfig): string {
  const parts = [
    SEGMENT_LABELS[config.segmentRule],
    ORDER_LABELS[config.orderId],
    `Bull : ${BULL_LABELS[config.bullRule]}`,
  ];
  if (config.hitsPerTarget > 1) parts.push(`${config.hitsPerTarget} touches par cible`);
  return parts.join(' · ');
}

/** Libellé court pour l'en-tête de jeu. */
export function formatVariantShort(config: AtcConfig): string {
  const segment = SEGMENT_LABELS[config.segmentRule];
  return config.hitsPerTarget > 1 ? `${segment} ×${config.hitsPerTarget}` : segment;
}

/** Durée mm:ss (ou h:mm:ss au-delà d'une heure). */
export function formatDuration(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const mm = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}
