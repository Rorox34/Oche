import type { Dart, OutRule } from './types.ts';
import { dartScore, finishingDarts, minRemaining } from './rules.ts';

/** Préparations pour les gros scores : gros triples d'abord. */
const SETUP_BIG: Dart[] = [
  { value: 20, multiplier: 3 },
  { value: 19, multiplier: 3 },
  { value: 18, multiplier: 3 },
  { value: 17, multiplier: 3 },
  { value: 16, multiplier: 3 },
  { value: 15, multiplier: 3 },
  { value: 25, multiplier: 2 },
  { value: 25, multiplier: 1 },
  ...Array.from({ length: 20 }, (_, i): Dart => ({ value: 20 - i, multiplier: 1 })),
];

/** Restes "propres" à laisser près du finish, par ordre de préférence. */
const NICE_LEAVES = [32, 16, 40, 36, 24, 20, 8, 12, 28, 4, 18, 2, 50];

const leaveRank = (leave: number): number => {
  const i = NICE_LEAVES.indexOf(leave);
  if (i !== -1) return i;
  return leave % 2 === 0 ? 40 : 60;
};

/** Préparations près du finish : ordonnées par qualité du reste laissé. */
function setupNear(score: number): Dart[] {
  const candidates: Dart[] = [
    ...Array.from({ length: 20 }, (_, i): Dart => ({ value: i + 1, multiplier: 1 })),
    ...Array.from({ length: 20 }, (_, i): Dart => ({ value: i + 1, multiplier: 3 })),
    { value: 25, multiplier: 1 },
  ];
  return candidates
    .filter((d) => score - dartScore(d) >= 2)
    .sort((a, b) => {
      const ra = leaveRank(score - dartScore(a));
      const rb = leaveRank(score - dartScore(b));
      if (ra !== rb) return ra - rb;
      if (a.multiplier !== b.multiplier) return a.multiplier - b.multiplier;
      return dartScore(b) - dartScore(a);
    });
}

const setupOrder = (score: number, outRule: OutRule): Dart[] =>
  score > 61 || outRule === 'straight' ? SETUP_BIG : setupNear(score);

/** Première route trouvée pour `score` en `dartsLeft` fléchettes, ou null. */
function firstRoute(score: number, dartsLeft: number, outRule: OutRule): Dart[] | null {
  if (dartsLeft <= 0 || score < minRemaining(outRule) || score > 60 * dartsLeft) return null;
  const finish = finishingDarts(score, outRule);
  if (finish.length > 0) return [finish[0]];
  if (dartsLeft === 1) return null;
  for (const setup of setupOrder(score, outRule)) {
    const rest = score - dartScore(setup);
    if (rest < minRemaining(outRule)) continue;
    const route = firstRoute(rest, dartsLeft - 1, outRule);
    if (route) return [setup, ...route];
  }
  return null;
}

const sameDart = (a: Dart, b: Dart): boolean =>
  a.value === b.value && a.multiplier === b.multiplier;

/**
 * Jusqu'à `limit` routes de finish, à première fléchette distincte
 * (directement exploitables par le clavier intelligent).
 */
export function checkoutRoutes(
  score: number,
  dartsLeft: number,
  outRule: OutRule,
  limit = 3,
): Dart[][] {
  if (dartsLeft <= 0 || score < minRemaining(outRule) || score > 60 * dartsLeft) return [];

  const routes: Dart[][] = [];

  for (const finish of finishingDarts(score, outRule)) {
    if (routes.length >= limit) break;
    routes.push([finish]);
  }

  if (dartsLeft > 1) {
    for (const setup of setupOrder(score, outRule)) {
      if (routes.length >= limit) break;
      if (routes.some((r) => sameDart(r[0], setup))) continue;
      const rest = score - dartScore(setup);
      if (rest < minRemaining(outRule)) continue;
      const tail = firstRoute(rest, dartsLeft - 1, outRule);
      if (tail) routes.push([setup, ...tail]);
    }
  }

  return routes;
}
