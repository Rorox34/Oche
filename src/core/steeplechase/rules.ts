import type { Dart, SteeplechaseTarget } from './types.ts';

function matchesTarget(dart: Dart, target: SteeplechaseTarget): boolean {
  return target.kind === 'bull' ? dart.value === 25 : dart.value === target.value;
}

/**
 * Haies franchies par une fléchette qui touche sa cible : simple = 1 (foulée
 * normale), double = 2 (belle foulée), triple = 3 (grand saut). Le bull ne
 * porte pas de multiplicateur de course : le toucher fait toujours franchir 1
 * haie, que ce soit 25 ou 50.
 */
export function hurdlesFor(dart: Dart, target: SteeplechaseTarget): number {
  if (!matchesTarget(dart, target)) return 0;
  return target.kind === 'bull' ? 1 : dart.multiplier;
}

/** Fléchettes utiles pour la haie courante (clavier intelligent). */
export function recommendedDarts(target: SteeplechaseTarget | undefined): Dart[] {
  if (!target) return [];
  if (target.kind === 'bull') {
    return [
      { value: 25, multiplier: 1 },
      { value: 25, multiplier: 2 },
    ];
  }
  return [
    { value: target.value, multiplier: 1 },
    { value: target.value, multiplier: 2 },
    { value: target.value, multiplier: 3 },
  ];
}
