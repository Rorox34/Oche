import type { Dart, GolfVariant } from './types.ts';

/** Coups d'un trou manqué (aucune fléchette sur le numéro). */
export const MISS_STROKES = 4;

/** Par d'un trou (référence pour le score relatif). */
export const PAR_PER_HOLE = 3;

/** Marques nécessaires pour fermer un trou en variante Cricket. */
export const MARKS_TO_CLOSE = 3;

/**
 * Spécification d'une variante de score. Pour Standard/Au plus court, c'est le
 * **seul** endroit à compléter pour ajouter une façon de scorer une volée fixe
 * de 3 fléchettes — moteur et UI s'en servent tels quels. La variante Cricket
 * n'a pas de `holeScore` : elle se joue en volées de longueur variable
 * (fermeture par marques, attente des autres joueurs), gérée à part dans
 * `engine.ts`.
 */
export interface GolfVariantSpec {
  label: string;
  description: string;
  /** Coups marqués sur le trou à partir des (≤3) fléchettes visant `target`. Absent pour Cricket. */
  holeScore?(visit: Dart[], target: number): number;
}

export const VARIANTS: Record<GolfVariant, GolfVariantSpec> = {
  standard: {
    label: 'Standard',
    description: 'Meilleure fléchette du trou : triple = 1, double = 2, simple = 3, manqué = 4.',
    holeScore(visit, target) {
      let best = MISS_STROKES;
      for (const d of visit) {
        if (d.value !== target) continue;
        const stroke = d.multiplier === 3 ? 1 : d.multiplier === 2 ? 2 : 3;
        if (stroke < best) best = stroke;
      }
      return best;
    },
  },

  darts: {
    label: 'Au plus court',
    description: 'Coups = nombre de fléchettes pour toucher le numéro (1–3), 4 si manqué.',
    holeScore(visit, target) {
      const idx = visit.findIndex((d) => d.value === target);
      return idx === -1 ? MISS_STROKES : idx + 1;
    },
  },

  cricket: {
    label: 'Cricket',
    description:
      'Fermez le trou en 3 marques (simple = 1, double = 2, triple = 3 — ferme d’un coup) ; ' +
      'chaque fléchette compte un coup et on attend que tous les joueurs aient fermé avant le trou suivant.',
  },
};

/** Marques rapportées par une fléchette sur le trou visé (variante Cricket, 0 si hors cible). */
export function marksFor(dart: Dart, target: number): number {
  return dart.value === target ? dart.multiplier : 0;
}

/**
 * Score provisoire affiché pendant la volée : le coup acquis si au moins une
 * fléchette a touché, sinon `null` (on n'affiche pas la pénalité de manqué tant
 * qu'il reste des fléchettes à lancer). Non applicable en Cricket (voir
 * `player.holeMarks`, suivi en direct dans l'état) : renvoie toujours `null`.
 */
export function previewHoleScore(
  visit: Dart[],
  target: number,
  variant: GolfVariant,
): number | null {
  const holeScore = VARIANTS[variant].holeScore;
  if (!holeScore) return null;
  if (!visit.some((d) => d.value === target)) return null;
  return holeScore(visit, target);
}

/**
 * Fléchettes utiles pour le trou courant (clavier intelligent) : le numéro visé
 * en simple, double et triple, afin qu'il reste éclairé quel que soit le
 * multiplicateur actif.
 */
export function recommendedDarts(target: number | undefined): Dart[] {
  if (target === undefined) return [];
  return [
    { value: target, multiplier: 1 },
    { value: target, multiplier: 2 },
    { value: target, multiplier: 3 },
  ];
}
