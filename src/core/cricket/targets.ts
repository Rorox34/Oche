import type { CricketConfig, CricketTarget } from './types.ts';
import { CRICKET_NUMBERS } from './rules.ts';

/**
 * Construit la liste des cibles. Standard : 20 → 15 puis le Bull. La config est
 * reçue pour permettre de futures variantes (Cricket aléatoire/Scram, Tactics
 * avec doubles/triples) de changer le jeu de cibles sans toucher aux appelants.
 */
export function buildTargets(_config: CricketConfig): CricketTarget[] {
  const numbers: CricketTarget[] = CRICKET_NUMBERS.map((value) => ({ kind: 'number', value }));
  return [...numbers, { kind: 'bull' }];
}
