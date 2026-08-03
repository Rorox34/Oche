import type { Dart } from './types.ts';

/** Marques nécessaires pour fermer un trou. */
export const MARKS_TO_CLOSE = 3;

/** Par d'un trou (référence pour le score relatif) : 3 marques simples = 3 fléchettes. */
export const PAR_PER_HOLE = 3;

/** Marques rapportées par une fléchette sur le trou visé (0 si hors cible). */
export function marksFor(dart: Dart, target: number): number {
  return dart.value === target ? dart.multiplier : 0;
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
