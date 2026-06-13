import type { Dart, InRule, OutRule } from './types.ts';
import { dartScore } from '../darts.ts';

export { dartScore, isValidDart } from '../darts.ts';

/** La fléchette qualifie-t-elle l'ouverture du compte ? */
export function satisfiesIn(dart: Dart, rule: InRule): boolean {
  switch (rule) {
    case 'straight':
      return true;
    case 'double':
      return dart.multiplier === 2;
    case 'triple':
      return dart.multiplier === 3;
    case 'bull':
      // Bull in : 25 ou 50 (double bull) obligatoire.
      return dart.value === 25;
  }
}

/** La fléchette peut-elle conclure une manche (score exactement à zéro) ? */
export function canFinishWith(dart: Dart, rule: OutRule): boolean {
  switch (rule) {
    case 'straight':
      return dart.value > 0;
    case 'double':
      return dart.multiplier === 2;
    case 'master':
      return dart.multiplier === 2 || dart.multiplier === 3;
  }
}

/** Score restant minimal jouable : en dessous, c'est un bust. */
export const minRemaining = (rule: OutRule): number => (rule === 'straight' ? 1 : 2);

/** Fléchettes uniques concluant exactement `score`, par ordre de préférence. */
export function finishingDarts(score: number, rule: OutRule): Dart[] {
  const out: Dart[] = [];
  if (rule === 'straight') {
    if (score >= 1 && score <= 20) out.push({ value: score, multiplier: 1 });
    if (score === 25) out.push({ value: 25, multiplier: 1 });
  }
  if (score % 2 === 0 && score / 2 >= 1 && score / 2 <= 20) {
    out.push({ value: score / 2, multiplier: 2 });
  }
  if (score === 50) out.push({ value: 25, multiplier: 2 });
  if (rule !== 'double' && score % 3 === 0 && score / 3 >= 1 && score / 3 <= 20) {
    out.push({ value: score / 3, multiplier: 3 });
  }
  return out;
}

/** Fléchettes recommandées pour ouvrir le compte (clavier intelligent). */
export function openingDarts(rule: InRule): Dart[] {
  switch (rule) {
    case 'straight':
      return [];
    case 'double':
      return [{ value: 20, multiplier: 2 }];
    case 'triple':
      return [{ value: 20, multiplier: 3 }];
    case 'bull':
      return [
        { value: 25, multiplier: 2 },
        { value: 25, multiplier: 1 },
      ];
  }
}
