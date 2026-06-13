import type { AtcConfig, AtcOrderId, AtcTarget } from './types.ts';

/** Ordre réel des secteurs sur un plateau, en partant du 1 dans le sens horaire. */
export const BOARD_ORDER: readonly number[] = [
  1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5, 20,
];

const ASCENDING = Array.from({ length: 20 }, (_, i) => i + 1);

function shuffled(numbers: number[], rng: () => number): number[] {
  const out = [...numbers];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function buildNumberOrder(orderId: AtcOrderId, rng: () => number = Math.random): number[] {
  switch (orderId) {
    case 'ascending':
      return [...ASCENDING];
    case 'descending':
      return [...ASCENDING].reverse();
    case 'board':
      return [...BOARD_ORDER];
    case 'random':
      return shuffled(ASCENDING, rng);
  }
}

/** Parcours complet : numéros selon l'ordre choisi, puis étape(s) bull. */
export function buildTargets(config: AtcConfig, rng: () => number = Math.random): AtcTarget[] {
  const numbers: AtcTarget[] = buildNumberOrder(config.orderId, rng).map((value) => ({
    kind: 'number',
    value,
  }));
  const bull: AtcTarget[] =
    config.bullRule === 'outerThenBullseye'
      ? [
          { kind: 'bull', accept: 'outer' },
          { kind: 'bull', accept: 'bullseye' },
        ]
      : [{ kind: 'bull', accept: config.bullRule }];
  return [...numbers, ...bull];
}
