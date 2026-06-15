import type { Dart } from './types.ts';

/** Points marqués par une fléchette sur la cible (0 hors-cible). */
export const scoreFor = (dart: Dart, target: number): number =>
  dart.value === target ? target * dart.multiplier : 0;

/**
 * La volée réalise-t-elle un Shanghai ? Soit un simple, un double **et** un
 * triple du numéro visé dans les trois fléchettes (peu importe l'ordre).
 */
export function isShanghai(visit: Dart[], target: number): boolean {
  const mults = new Set(visit.filter((d) => d.value === target).map((d) => d.multiplier));
  return mults.has(1) && mults.has(2) && mults.has(3);
}

/**
 * Fléchettes utiles pour la cible courante (clavier intelligent) : le numéro
 * visé en simple, double et triple, afin qu'il reste éclairé quel que soit le
 * multiplicateur actif (et qu'on voie de quoi faire un Shanghai).
 */
export function recommendedDarts(target: number | undefined): Dart[] {
  if (target === undefined) return [];
  return [
    { value: target, multiplier: 1 },
    { value: target, multiplier: 2 },
    { value: target, multiplier: 3 },
  ];
}
