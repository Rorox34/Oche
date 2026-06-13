/** Socle commun à tous les modes de jeu : la fléchette et son affichage. */

export type Multiplier = 1 | 2 | 3;

export interface Dart {
  /** 0 = manqué, 1–20 = secteurs, 25 = bull (D25 = 50, T25 invalide). */
  value: number;
  multiplier: Multiplier;
}

export const dartScore = (dart: Dart): number => dart.value * dart.multiplier;

export function isValidDart(dart: Dart): boolean {
  if (dart.value === 0) return true;
  if (dart.value === 25) return dart.multiplier !== 3;
  return Number.isInteger(dart.value) && dart.value >= 1 && dart.value <= 20;
}

export type DartKind = 'miss' | 'single' | 'double' | 'triple' | 'bull';

export function dartKind(dart: Dart): DartKind {
  if (dart.value === 0) return 'miss';
  if (dart.value === 25) return 'bull';
  if (dart.multiplier === 3) return 'triple';
  if (dart.multiplier === 2) return 'double';
  return 'single';
}

export function formatDart(dart: Dart): string {
  if (dart.value === 0) return '✕';
  if (dart.value === 25) return dart.multiplier === 2 ? 'DB' : '25';
  const prefix = dart.multiplier === 3 ? 'T' : dart.multiplier === 2 ? 'D' : '';
  return `${prefix}${dart.value}`;
}
