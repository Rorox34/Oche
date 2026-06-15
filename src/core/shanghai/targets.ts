import type { ShanghaiConfig, ShanghaiRange } from './types.ts';

/** Numéro le plus haut joué pour chaque plage (= nombre de manches). */
export const RANGE_MAX: Record<ShanghaiRange, number> = {
  '1-7': 7,
  '1-10': 10,
  '1-20': 20,
};

function shuffled(numbers: number[], rng: () => number): number[] {
  const out = [...numbers];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Suite des numéros de manche : 1…max selon la plage, ordonnée ou tirée au sort. */
export function buildTargets(config: ShanghaiConfig, rng: () => number = Math.random): number[] {
  const base = Array.from({ length: RANGE_MAX[config.range] }, (_, i) => i + 1);
  return config.orderId === 'random' ? shuffled(base, rng) : base;
}
