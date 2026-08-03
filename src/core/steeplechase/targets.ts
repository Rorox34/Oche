import type { SteeplechaseConfig, SteeplechaseTarget } from './types.ts';

/** Le parcours : les haies 1 → 20, dans l'ordre, puis le Bull si activé. */
export function buildTargets(config: SteeplechaseConfig): SteeplechaseTarget[] {
  const numbers: SteeplechaseTarget[] = Array.from({ length: 20 }, (_, i) => ({
    kind: 'number',
    value: i + 1,
  }));
  return config.finalBull ? [...numbers, { kind: 'bull' }] : numbers;
}
