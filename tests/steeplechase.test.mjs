import assert from 'node:assert/strict';
import { createGame, reduce, hitRate } from '../src/core/steeplechase/engine.ts';
import { buildTargets } from '../src/core/steeplechase/targets.ts';
import { hurdlesFor, recommendedDarts } from '../src/core/steeplechase/rules.ts';
import { formatConfig, formatConfigShort, formatTarget } from '../src/core/steeplechase/format.ts';

const cfg = (over = {}) => ({ finalBull: true, playerNames: ['A', 'B'], ...over });
const dart = (value, multiplier = 1) => ({ type: 'dart', dart: { value, multiplier } });
const D = (value, multiplier = 1) => ({ value, multiplier });

// ===== Parcours =====
assert.equal(buildTargets(cfg()).length, 21, '20 numéros + Bull');
assert.deepEqual(buildTargets(cfg()).at(-1), { kind: 'bull' });
assert.equal(buildTargets(cfg({ finalBull: false })).length, 20);
assert.deepEqual(buildTargets(cfg({ finalBull: false })).at(-1), { kind: 'number', value: 20 });
assert.deepEqual(buildTargets(cfg()).slice(0, 3), [
  { kind: 'number', value: 1 },
  { kind: 'number', value: 2 },
  { kind: 'number', value: 3 },
]);

// ===== Haies franchies par fléchette =====
const n7 = { kind: 'number', value: 7 };
assert.equal(hurdlesFor(D(7, 1), n7), 1, 'simple = 1 haie');
assert.equal(hurdlesFor(D(7, 2), n7), 2, 'double = 2 haies');
assert.equal(hurdlesFor(D(7, 3), n7), 3, 'triple = 3 haies');
assert.equal(hurdlesFor(D(5, 1), n7), 0, 'hors cible = 0');
assert.equal(hurdlesFor(D(0), n7), 0, 'manqué = 0');
const bullTarget = { kind: 'bull' };
assert.equal(hurdlesFor(D(25, 1), bullTarget), 1, 'bull simple = 1 haie');
assert.equal(hurdlesFor(D(25, 2), bullTarget), 1, 'bull double (50) = 1 haie aussi');
assert.equal(hurdlesFor(D(17, 1), bullTarget), 0);

// ===== Progression : plusieurs haies dans une même fléchette =====
let s = createGame(cfg());
s = reduce(s, dart(1, 3)); // A : triple sur la haie 1 → saute 3 haies d'un coup
assert.equal(s.players[0].hurdleIndex, 3, 'haie 4 atteinte (index 3)');
assert.equal(s.players[0].hits, 1);
assert.equal(s.players[0].dartsThrown, 1);

// ===== Volée mixte : avance puis manque, la cible change en cours de volée =====
s = reduce(s, dart(4, 1)); // simple sur la haie courante (4) → +1
assert.equal(s.players[0].hurdleIndex, 4);
s = reduce(s, dart(1)); // manqué (cible = 5 désormais)
assert.equal(s.currentPlayer, 1, 'rotation après 3 fléchettes');
assert.equal(s.players[0].visits, 1);
assert.equal(s.log.at(-1).advance, 4, 'triple(3) + simple(1) = 4 haies dans la volée');
assert.equal(s.log.at(-1).finish, false);

// ===== Chute : volée totalement manquée =====
let c = createGame(cfg());
// Volée de A (3 fléchettes) : avance à la haie 2 (index 1) sur la 1re, puis 2 manqués.
c = reduce(c, dart(1, 1));
assert.equal(c.players[0].hurdleIndex, 1);
c = reduce(c, dart(15)); // cible désormais 2 : manqué
c = reduce(c, dart(15)); // toujours manqué
assert.equal(c.currentPlayer, 1, 'fin de la volée de A (3 fléchettes)');
assert.equal(c.players[0].hurdleIndex, 1, 'la volée a quand même fait avancer A (dart 1) : pas de chute');
assert.equal(c.players[0].falls, 0);

// Volée de B (3 fléchettes), totalement manquée dès le départ (haie 1) : pas de recul possible.
c = reduce(c, dart(0));
c = reduce(c, dart(0));
c = reduce(c, dart(0));
assert.equal(c.players[1].hurdleIndex, 0, 'pas de recul en dessous du départ');
assert.equal(c.players[1].falls, 0);
assert.equal(c.currentPlayer, 0);

// Retour à A, qui était à la haie 2 (index 1) : une volée blanche le fait chuter.
c = reduce(c, dart(9));
c = reduce(c, dart(9));
c = reduce(c, dart(9)); // cible = 2, jamais touchée
assert.equal(c.players[0].hurdleIndex, 0, 'chute : recul d’une haie');
assert.equal(c.players[0].falls, 1);
assert.equal(c.log.at(-1).advance, -1);

// ===== Victoire : dernière haie du parcours =====
const nearWin = (config) => {
  const g = createGame(config);
  const last = g.targets.length - 1;
  return {
    ...g,
    players: g.players.map((p, i) => (i === 0 ? { ...p, hurdleIndex: last } : p)),
    visitStartHurdle: last,
  };
};
let w = nearWin(cfg());
assert.deepEqual(w.targets[w.players[0].hurdleIndex], { kind: 'bull' });
w = reduce(w, dart(25, 1)); // dernière haie = Bull, simple suffit
assert.equal(w.phase, 'matchOver');
assert.equal(w.winner, 0);
assert.equal(w.log.at(-1).finish, true);
assert.equal(reduce(w, dart(5)), w, 'fléchette ignorée après la victoire');

// Victoire dès la 1re fléchette de la volée (pas besoin d’attendre 3 fléchettes)
let w2 = nearWin(cfg({ finalBull: false }));
w2 = reduce(w2, dart(20, 1));
assert.equal(w2.phase, 'matchOver');
assert.equal(w2.players[0].dartsThrown, 1);

// Un triple qui dépasserait la dernière haie ne fait pas déborder l’index
let w3 = nearWin(cfg({ finalBull: false }));
w3 = reduce(w3, dart(20, 3));
assert.equal(w3.phase, 'matchOver');
assert.equal(w3.players[0].hurdleIndex, w3.targets.length);

// ===== Revanche =====
const r = reduce(w, { type: 'restart' });
assert.equal(r.phase, 'playing');
assert.equal(r.players[0].hurdleIndex, 0);
assert.equal(r.players[0].falls, 0);
assert.equal(r.log.length, 0);

// ===== Fléchettes invalides ignorées =====
const fresh = createGame(cfg());
assert.equal(reduce(fresh, dart(25, 3)), fresh, 'T25 invalide');
assert.equal(reduce(fresh, dart(21, 1)), fresh, '21 invalide');

// ===== Réussite =====
assert.equal(hitRate(fresh.players[0]), null);
assert.equal(hitRate(s.players[0]), Math.round((2 / 3) * 100));

// ===== Clavier intelligent =====
assert.deepEqual(recommendedDarts(n7), [
  { value: 7, multiplier: 1 },
  { value: 7, multiplier: 2 },
  { value: 7, multiplier: 3 },
]);
assert.deepEqual(recommendedDarts(bullTarget), [
  { value: 25, multiplier: 1 },
  { value: 25, multiplier: 2 },
]);
assert.deepEqual(recommendedDarts(undefined), []);

// ===== Formatage =====
assert.equal(formatTarget({ kind: 'number', value: 7 }), '7');
assert.equal(formatTarget({ kind: 'bull' }), 'Bull');
assert.equal(formatTarget(undefined), '✓');
assert.equal(formatConfigShort(cfg()), '1 → 20 + Bull');
assert.equal(formatConfigShort(cfg({ finalBull: false })), '1 → 20');
assert.ok(formatConfig(cfg()).includes('chute'));

console.log('ALL STEEPLECHASE TESTS PASSED');
