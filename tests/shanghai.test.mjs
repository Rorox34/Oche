import assert from 'node:assert/strict';
import { createGame, reduce, pointsPerDart } from '../src/core/shanghai/engine.ts';
import { scoreFor, isShanghai, recommendedDarts } from '../src/core/shanghai/rules.ts';
import { buildTargets, RANGE_MAX } from '../src/core/shanghai/targets.ts';
import { formatVariant, formatVariantShort } from '../src/core/shanghai/format.ts';

const cfg = (over = {}) => ({
  range: '1-7',
  orderId: 'ascending',
  shanghaiWin: true,
  playerNames: ['A', 'B'],
  ...over,
});
const dart = (value, multiplier = 1) => ({ type: 'dart', dart: { value, multiplier } });
const seq = (...vals) => { let i = 0; return () => vals[i++ % vals.length]; };

// ===== Génération des cibles =====
assert.deepEqual(buildTargets(cfg()), [1, 2, 3, 4, 5, 6, 7]);
assert.equal(buildTargets(cfg({ range: '1-20' })).length, 20);
assert.equal(RANGE_MAX['1-10'], 10);
const rnd = buildTargets(cfg({ orderId: 'random' }), seq(0.13, 0.87, 0.42, 0.61, 0.05));
assert.deepEqual([...rnd].sort((a, b) => a - b), [1, 2, 3, 4, 5, 6, 7], 'permutation de 1..7');
assert.deepEqual(
  buildTargets(cfg({ orderId: 'random' }), seq(0.5)),
  buildTargets(cfg({ orderId: 'random' }), seq(0.5)),
  'déterministe à rng injecté',
);

// ===== scoreFor =====
assert.equal(scoreFor({ value: 3, multiplier: 1 }, 3), 3);
assert.equal(scoreFor({ value: 3, multiplier: 3 }, 3), 9, 'triple 3 = 9');
assert.equal(scoreFor({ value: 5, multiplier: 2 }, 3), 0, 'mauvais numéro');
assert.equal(scoreFor({ value: 25, multiplier: 2 }, 3), 0, 'le bull ne compte pas');

// ===== isShanghai =====
assert.equal(isShanghai([{ value: 3, multiplier: 1 }, { value: 3, multiplier: 2 }, { value: 3, multiplier: 3 }], 3), true);
assert.equal(isShanghai([{ value: 3, multiplier: 3 }, { value: 3, multiplier: 1 }, { value: 3, multiplier: 2 }], 3), true, 'ordre indifférent');
assert.equal(isShanghai([{ value: 3, multiplier: 1 }, { value: 3, multiplier: 1 }, { value: 3, multiplier: 3 }], 3), false, 'pas de double');
assert.equal(isShanghai([{ value: 3, multiplier: 1 }, { value: 3, multiplier: 2 }, { value: 5, multiplier: 3 }], 3), false);

// ===== Score d'une volée et rotation =====
let s = createGame(cfg());
s = reduce(s, dart(1, 3)); // manche 1, triple 1 = 3
s = reduce(s, dart(1, 1)); // +1 = 4
s = reduce(s, dart(5, 2)); // hors-cible (cible = 1) = 0
assert.equal(s.players[0].score, 4);
assert.equal(s.players[0].visits, 1);
assert.equal(s.currentPlayer, 1, 'rotation après 3 fléchettes');
assert.equal(s.round, 0, 'même manche tant que tous n’ont pas joué');
assert.equal(s.log.at(-1).target, 1);
assert.equal(s.log.at(-1).points, 4);
assert.equal(s.log.at(-1).shanghai, false);

// ===== La manche avance une fois le dernier joueur passé =====
s = reduce(s, dart(1, 1)); // B
s = reduce(s, dart(0, 1));
s = reduce(s, dart(0, 1)); // B termine sa volée
assert.equal(s.currentPlayer, 0);
assert.equal(s.round, 1, 'manche 2 après le tour de tous les joueurs');

// ===== Victoire Shanghai (S+D+T) immédiate, quel que soit le score =====
let sh = createGame(cfg({ playerNames: ['A', 'B'] }));
sh = { ...sh, players: [{ ...sh.players[0] }, { ...sh.players[1], score: 999 }] };
sh = reduce(sh, dart(1, 1));
sh = reduce(sh, dart(1, 2));
sh = reduce(sh, dart(1, 3)); // Shanghai sur le 1
assert.equal(sh.phase, 'matchOver');
assert.equal(sh.winner, 0, 'le Shanghai gagne même avec un score inférieur');
assert.equal(sh.shanghai, true);
assert.equal(sh.log.at(-1).shanghai, true);
assert.equal(reduce(sh, dart(2)), sh, 'fléchette ignorée après victoire');

// Shanghai désactivé : S+D+T ne gagne pas, score seulement
let off = createGame(cfg({ shanghaiWin: false }));
off = reduce(off, dart(1, 1));
off = reduce(off, dart(1, 2));
off = reduce(off, dart(1, 3));
assert.equal(off.phase, 'playing', 'sans la règle Shanghai, pas de victoire immédiate');
assert.equal(off.players[0].score, 6, '1 + 2 + 3');

// ===== Fin de partie : meilleur score gagne =====
// A marque le numéro de chaque manche, B reste à zéro, sur les 7 manches.
let g = createGame(cfg({ range: '1-7', shanghaiWin: false }));
for (let r = 0; r < 7; r++) {
  const t = g.targets[r];
  g = reduce(g, dart(t, 1)); // A marque t
  g = reduce(g, dart(0));
  g = reduce(g, dart(0));
  g = reduce(g, dart(0)); // B marque 0
  g = reduce(g, dart(0));
  g = reduce(g, dart(0));
}
assert.equal(g.phase, 'matchOver');
assert.equal(g.winner, 0, 'A a le meilleur score');
assert.equal(g.players[0].score, 1 + 2 + 3 + 4 + 5 + 6 + 7);

// ===== Stats =====
let stt = createGame(cfg());
assert.equal(pointsPerDart(stt.players[0]), null);
stt = reduce(stt, dart(1, 3)); // 3 points en 1 fléchette
assert.equal(pointsPerDart(stt.players[0]), 3);

// ===== Fléchettes invalides ignorées =====
const fresh = createGame(cfg());
assert.equal(reduce(fresh, dart(25, 3)), fresh, 'T25 invalide');
assert.equal(reduce(fresh, dart(21, 1)), fresh, '21 invalide');

// ===== Revanche =====
const r = reduce(sh, { type: 'restart' });
assert.equal(r.phase, 'playing');
assert.equal(r.round, 0);
assert.equal(r.players[0].score, 0);
assert.equal(r.shanghai, false);

// ===== Clavier intelligent =====
assert.deepEqual(recommendedDarts(3), [
  { value: 3, multiplier: 1 },
  { value: 3, multiplier: 2 },
  { value: 3, multiplier: 3 },
]);
assert.deepEqual(recommendedDarts(undefined), []);

// ===== Formatage =====
assert.equal(formatVariantShort(cfg()), '1 → 7');
assert.equal(formatVariantShort(cfg({ orderId: 'random' })), '1 → 7 · Aléatoire');
assert.ok(formatVariant(cfg()).includes('Shanghai'));

console.log('ALL SHANGHAI TESTS PASSED');
