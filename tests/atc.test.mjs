import assert from 'node:assert/strict';
import { createGame, reduce, hitRate } from '../src/core/atc/engine.ts';
import { BOARD_ORDER, buildNumberOrder, buildTargets } from '../src/core/atc/order.ts';
import { countsForTarget, recommendedDarts } from '../src/core/atc/rules.ts';
import { formatDuration, formatTarget } from '../src/core/atc/format.ts';

const base = {
  segmentRule: 'any',
  orderId: 'ascending',
  bullRule: 'any',
  hitsPerTarget: 1,
  playerNames: ['A', 'B'],
};
const dart = (value, multiplier = 1) => ({ type: 'dart', dart: { value, multiplier } });
const seq = (...vals) => { let i = 0; return () => vals[i++ % vals.length]; };

// ===== Génération des ordres =====
assert.deepEqual(buildNumberOrder('ascending').slice(0, 3), [1, 2, 3]);
assert.equal(buildNumberOrder('ascending').length, 20);
assert.deepEqual(buildNumberOrder('descending').slice(0, 3), [20, 19, 18]);
assert.deepEqual(buildNumberOrder('board'), [...BOARD_ORDER]);
const rnd = buildNumberOrder('random', seq(0.13, 0.87, 0.42, 0.61, 0.05));
assert.deepEqual([...rnd].sort((a, b) => a - b), Array.from({ length: 20 }, (_, i) => i + 1),
  "l'ordre aléatoire est une permutation de 1..20");
assert.deepEqual(buildNumberOrder('random', seq(0.5)), buildNumberOrder('random', seq(0.5)),
  'déterministe à rng injecté');

// ===== Étapes bull =====
assert.deepEqual(buildTargets(base).at(-1), { kind: 'bull', accept: 'any' });
assert.equal(buildTargets(base).length, 21);
assert.deepEqual(buildTargets({ ...base, bullRule: 'bullseye' }).at(-1), { kind: 'bull', accept: 'bullseye' });
const otb = buildTargets({ ...base, bullRule: 'outerThenBullseye' });
assert.equal(otb.length, 22);
assert.deepEqual(otb.slice(-2), [{ kind: 'bull', accept: 'outer' }, { kind: 'bull', accept: 'bullseye' }]);

// ===== countsForTarget : toutes les variantes =====
const n17 = { kind: 'number', value: 17 };
assert.equal(countsForTarget({ value: 17, multiplier: 1 }, n17, 'any'), true);
assert.equal(countsForTarget({ value: 17, multiplier: 3 }, n17, 'any'), true);
assert.equal(countsForTarget({ value: 16, multiplier: 1 }, n17, 'any'), false);
assert.equal(countsForTarget({ value: 17, multiplier: 2 }, n17, 'singles'), false);
assert.equal(countsForTarget({ value: 17, multiplier: 1 }, n17, 'singles'), true);
assert.equal(countsForTarget({ value: 17, multiplier: 2 }, n17, 'doubles'), true);
assert.equal(countsForTarget({ value: 17, multiplier: 1 }, n17, 'doubles'), false);
assert.equal(countsForTarget({ value: 17, multiplier: 3 }, n17, 'triples'), true);
assert.equal(countsForTarget({ value: 17, multiplier: 1 }, n17, 'triples'), false);
assert.equal(countsForTarget({ value: 25, multiplier: 1 }, { kind: 'bull', accept: 'any' }, 'doubles'), true,
  'le bull suit sa propre règle, pas celle des segments');
assert.equal(countsForTarget({ value: 25, multiplier: 2 }, { kind: 'bull', accept: 'outer' }, 'any'), false);
assert.equal(countsForTarget({ value: 25, multiplier: 1 }, { kind: 'bull', accept: 'bullseye' }, 'any'), false);
assert.equal(countsForTarget({ value: 25, multiplier: 2 }, { kind: 'bull', accept: 'bullseye' }, 'any'), true);

// ===== Progression : plusieurs numéros dans une même volée =====
let s = createGame(base);
s = reduce(s, dart(1));
s = reduce(s, dart(2, 3)); // un triple compte comme une touche, pas trois
s = reduce(s, dart(5)); // manqué (cible = 3)
assert.equal(s.players[0].targetIndex, 2, 'avancé de deux cibles dans la volée');
assert.equal(s.players[0].hits, 2);
assert.equal(s.players[0].dartsThrown, 3);
assert.equal(s.players[0].visits, 1);
assert.equal(s.currentPlayer, 1, 'rotation après 3 fléchettes');
assert.equal(s.log.length, 1);
assert.equal(s.log[0].hits, 2);
assert.equal(s.log[0].target, '1');
assert.equal(s.log[0].finish, false);
assert.equal(hitRate(s.players[0]), 67);
assert.equal(hitRate(s.players[1]), null);

// ===== hitsPerTarget : 2 et 3 touches =====
let h2 = createGame({ ...base, hitsPerTarget: 2 });
h2 = reduce(h2, dart(1));
assert.equal(h2.players[0].targetIndex, 0);
assert.equal(h2.players[0].hitsOnTarget, 1);
h2 = reduce(h2, dart(1));
assert.equal(h2.players[0].targetIndex, 1, 'cible validée après 2 touches');
assert.equal(h2.players[0].hitsOnTarget, 0);
let h3 = createGame({ ...base, hitsPerTarget: 3 });
h3 = reduce(h3, dart(1, 1));
h3 = reduce(h3, dart(1, 2));
h3 = reduce(h3, dart(1, 3));
assert.equal(h3.players[0].targetIndex, 1, 'cible validée après 3 touches');

// ===== Victoire : dernier numéro puis bull =====
const nearWin = (cfg) => {
  const g = createGame(cfg);
  const last = g.targets.length - 1;
  return {
    ...g,
    players: g.players.map((p, i) => (i === 0 ? { ...p, targetIndex: last } : p)),
    visitStartTargetIndex: last,
  };
};
let w = nearWin(base);
w = reduce(w, dart(25, 1)); // bull 'any' : 25 suffit
assert.equal(w.phase, 'matchOver');
assert.equal(w.winner, 0);
assert.ok(typeof w.endedAt === 'number' && w.endedAt >= w.startedAt);
assert.equal(w.log.at(-1).finish, true);
assert.equal(reduce(w, dart(5)), w, 'fléchette ignorée après la victoire');
let w50 = nearWin(base);
w50 = reduce(w50, dart(25, 2)); // 50 valide aussi en 'any'
assert.equal(w50.phase, 'matchOver');
let wbe = nearWin({ ...base, bullRule: 'bullseye' });
wbe = reduce(wbe, dart(25, 1)); // 25 ne suffit pas
assert.equal(wbe.phase, 'playing');
wbe = reduce(wbe, dart(25, 2));
assert.equal(wbe.phase, 'matchOver');
// Outer puis bullseye : deux étapes distinctes
let wob = createGame({ ...base, bullRule: 'outerThenBullseye' });
const outerIdx = wob.targets.length - 2;
wob = {
  ...wob,
  players: wob.players.map((p, i) => (i === 0 ? { ...p, targetIndex: outerIdx } : p)),
  visitStartTargetIndex: outerIdx,
};
wob = reduce(wob, dart(25, 2)); // 50 ne valide PAS l'étape outer (25 simple requis)
assert.equal(wob.players[0].targetIndex, outerIdx);
wob = reduce(wob, dart(25, 1)); // 25 valide l'étape outer
assert.equal(wob.players[0].targetIndex, outerIdx + 1);
wob = reduce(wob, dart(25, 2)); // 50 termine
assert.equal(wob.phase, 'matchOver');
assert.equal(wob.players[0].visits, 1, 'la volée gagnante compte comme un tour');

// ===== hitsPerTarget s'applique aussi au bull =====
let bh = nearWin({ ...base, hitsPerTarget: 2 });
bh = reduce(bh, dart(25, 1));
assert.equal(bh.phase, 'playing');
assert.equal(bh.players[0].hitsOnTarget, 1);
bh = reduce(bh, dart(25, 2));
assert.equal(bh.phase, 'matchOver');

// ===== Revanche : regénère un parcours, remet tout à zéro =====
const r = reduce(w, { type: 'restart' });
assert.equal(r.phase, 'playing');
assert.equal(r.players[0].targetIndex, 0);
assert.equal(r.players[0].dartsThrown, 0);
assert.equal(r.log.length, 0);
assert.equal(r.endedAt, null);

// ===== Fléchettes invalides ignorées =====
const fresh = createGame(base);
assert.equal(reduce(fresh, dart(25, 3)), fresh);
assert.equal(reduce(fresh, dart(21, 1)), fresh);

// ===== Recommandations du clavier intelligent =====
assert.deepEqual(recommendedDarts(n17, 'doubles'), [{ value: 17, multiplier: 2 }]);
assert.equal(recommendedDarts(n17, 'any').length, 3);
assert.deepEqual(recommendedDarts({ kind: 'bull', accept: 'bullseye' }, 'any'), [{ value: 25, multiplier: 2 }]);
assert.deepEqual(recommendedDarts(undefined, 'any'), []);

// ===== Formatage =====
assert.equal(formatTarget({ kind: 'number', value: 17 }), '17');
assert.equal(formatTarget({ kind: 'bull', accept: 'any' }), 'Bull');
assert.equal(formatTarget({ kind: 'bull', accept: 'outer' }), '25');
assert.equal(formatTarget({ kind: 'bull', accept: 'bullseye' }), '50');
assert.equal(formatTarget(undefined), '✓');
assert.equal(formatDuration(83_000), '01:23');
assert.equal(formatDuration(3_725_000), '1:02:05');

console.log('ALL ATC TESTS PASSED');
