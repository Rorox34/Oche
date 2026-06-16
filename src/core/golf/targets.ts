import type { GolfConfig } from './types.ts';

/**
 * Numéros des trous : 1 … N. La config est reçue pour permettre de futures
 * variantes (parcours aléatoire, trous personnalisés) sans changer les appelants.
 */
export function buildTargets(config: GolfConfig): number[] {
  return Array.from({ length: config.holes }, (_, i) => i + 1);
}
