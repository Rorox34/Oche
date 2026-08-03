import type { GolfCricketConfig } from './types.ts';

/** Numéros des trous : 1 … N. */
export function buildTargets(config: GolfCricketConfig): number[] {
  return Array.from({ length: config.holes }, (_, i) => i + 1);
}
