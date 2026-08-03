import assert from 'node:assert/strict';
import { createGame, reduce, playedHoles, relativeToPar } from '../src/core/golfCricket/engine.ts';
import { MARKS_TO_CLOSE, marksFor, recommendedDarts } from '../src/core/golfCricket/rules.ts';
import { buildTargets } from '../src/core/golfCricket/targets.ts';
import { formatConfig, formatConfigShort, formatRelativePar } from '../src/core/golfCricket/format.ts';

const cfg = (over = {}) => ({ holes: 9, playerNames: ['A', 'B'], ...over });
const dart = (value, multiplier = 1) => ({ type: 'dart', dart: { value, multiplier } });
const D = (value, multiplier = 1) => ({ value, multiplier });

// ===== Cibles =====
assert.deepEqual(buildTargets(cfg()), [1, 2, 3, 4, 5, 6, 7, 8, 9]);
assert.equal(buildTargets(cfg({ holes: 18 })).length, 18);

// ===== Marques par fléchette =====
assert.equal(marksFor(D(3, 1), 3), 1, 'simple = 1 marque');
assert.equal(marksFor(D(3, 2), 3), 2, 'double = 2 marques');
assert.equal(marksFor(D(3, 3), 3), 3, 'triple = 3 marques');
assert.equal(marksFor(D(5, 3), 3), 0, 'hors cible = 0');
assert.equal(marksFor(D(0), 3), 0, 'manqué = 0');
assert.equal(MARKS_TO_CLOSE, 3);

// ===== Triple = fermeture immédiate en 1 fléchette =====
let s = createGame(cfg());
s = reduce(s, dart(1, 3)); // A : triple sur le trou 1
assert.equal(s.players[0].holeScores[0], 1, 'fermé en 1 coup (eagle)');
assert.equal(s.players[0].strokes, 1);
assert.equal(s.players[0].holeMarks, 3, 'marques figées à 3 après fermeture');
assert.equal(s.players[0].holeDarts, 1);
assert.equal(s.currentPlayer, 1, 'la main passe à B, qui n’a pas encore fermé');
assert.equal(s.round, 0, 'même trou tant que B n’a pas fermé');
assert.equal(s.log.at(-1).strokes, 1);

// ===== B ferme en 3 fléchettes (simple, simple, simple) → le trou avance =====
s = reduce(s, dart(1, 1)); // marque 1/3
assert.equal(s.currentPlayer, 1, 'volée en cours, toujours à B');
assert.equal(s.players[1].holeMarks, 1);
s = reduce(s, dart(1, 1)); // marque 2/3
assert.equal(s.players[1].holeMarks, 2);
s = reduce(s, dart(1, 1)); // marque 3/3 → fermé
assert.equal(s.players[1].holeScores[0], 3, 'fermé en 3 coups (par)');
assert.equal(s.players[1].strokes, 3);
assert.equal(s.round, 1, 'trou 2 une fois tout le monde fermé');
assert.equal(s.currentPlayer, 0, 'rotation naturelle après le trou');
assert.equal(s.players[0].holeMarks, 0, 'marques remises à zéro pour le nouveau trou');
assert.equal(s.players[0].holeDarts, 0);

// ===== Manqué = un coup en plus, sans marque (double + manqué + simple = 3 coups) =====
s = reduce(s, dart(2, 2)); // A : double → 2/3
s = reduce(s, dart(0)); // manqué : ne ferme pas, mais compte un coup
assert.equal(s.players[0].holeMarks, 2, 'le manqué ne progresse pas les marques');
assert.equal(s.players[0].holeDarts, 2);
s = reduce(s, dart(2, 1)); // simple → 3/3, fermé en 3 fléchettes malgré le manqué
assert.equal(s.players[0].holeScores[1], 3);
assert.equal(s.currentPlayer, 1, 'la main passe à B pour le même trou');

// ===== Volée de 3 fléchettes sans fermer : la main tourne, on revient plus tard =====
s = reduce(s, dart(0));
s = reduce(s, dart(0));
s = reduce(s, dart(0)); // B manque ses 3 fléchettes, trou 2 pas fermé
assert.equal(s.players[1].holeScores[1], -1, 'toujours pas fermé');
assert.equal(s.round, 1, 'le trou n’avance pas tant que B n’a pas fermé');
assert.equal(s.currentPlayer, 1, 'A a déjà fermé : la main reste/revient à B');
s = reduce(s, dart(2, 3)); // B : triple, ferme enfin (4 fléchettes au total sur ce trou)
assert.equal(s.players[1].holeScores[1], 4);
assert.equal(s.round, 2, 'trou 3 une fois B fermé à son tour');

// ===== Fin de partie : le plus petit total de fléchettes gagne =====
const closeHole = (state, playerStrokes) => {
  // playerStrokes[i] = nb de fléchettes voulu pour fermer (via triple direct, sinon simples)
  let st = state;
  for (const want of playerStrokes) {
    const t = st.targets[st.round];
    if (want === 1) {
      st = reduce(st, dart(t, 3));
    } else {
      for (let k = 0; k < want; k++) st = reduce(st, dart(t, 1));
    }
  }
  return st;
};
let g = createGame(cfg({ holes: 9 }));
for (let h = 0; h < 9; h++) g = closeHole(g, [1, 3]); // A ferme en 1 (triple), B en 3 (simples)
assert.equal(g.phase, 'matchOver');
assert.equal(g.winner, 0, 'A (plus petit total) gagne');
assert.equal(g.players[0].strokes, 9, '9 × 1');
assert.equal(g.players[1].strokes, 27, '9 × 3');

// ===== Stats : trous fermés et score relatif au par =====
assert.equal(playedHoles(g.players[0]), 9);
assert.equal(relativeToPar(g.players[0]), 9 - 9 * 3, 'A : -18 sous le par');
assert.equal(relativeToPar(g.players[1]), 0, 'B : pile au par');

// ===== 3 joueurs : on saute les joueurs déjà fermés =====
let t = createGame(cfg({ playerNames: ['A', 'B', 'C'] }));
t = reduce(t, dart(1, 3)); // A ferme direct
assert.equal(t.currentPlayer, 1);
t = reduce(t, dart(1, 3)); // B ferme direct
assert.equal(t.currentPlayer, 2, 'on saute A (déjà fermé) pour arriver à C');
t = reduce(t, dart(0));
t = reduce(t, dart(0));
t = reduce(t, dart(0)); // C manque ses 3 fléchettes
assert.equal(t.currentPlayer, 2, 'A et B fermés : la main reste à C');
assert.equal(t.round, 0);
t = reduce(t, dart(1, 1));
t = reduce(t, dart(1, 1));
t = reduce(t, dart(1, 1)); // C ferme enfin en 6 fléchettes
assert.equal(t.players[2].holeScores[0], 6);
assert.equal(t.round, 1, 'trou suivant une fois C fermé');
assert.equal(t.currentPlayer, 0, 'rotation naturelle depuis C (index 2) → A (index 0)');

// ===== Fléchettes invalides ignorées =====
const fresh = createGame(cfg());
assert.equal(reduce(fresh, dart(25, 3)), fresh, 'T25 invalide');
assert.equal(reduce(fresh, dart(21, 1)), fresh, '21 invalide');
assert.equal(
  reduce(fresh, dart(25, 1)).players[0].dartsThrown,
  1,
  'le bull compte comme fléchette (mais ne touche pas le numéro)',
);

// ===== Revanche =====
const r = reduce(g, { type: 'restart' });
assert.equal(r.phase, 'playing');
assert.equal(r.round, 0);
assert.equal(r.players[0].strokes, 0);
assert.equal(r.players[0].holeMarks, 0);
assert.deepEqual(r.players[0].holeScores, Array.from({ length: 9 }, () => -1));

// ===== Clavier intelligent =====
assert.deepEqual(recommendedDarts(4), [
  { value: 4, multiplier: 1 },
  { value: 4, multiplier: 2 },
  { value: 4, multiplier: 3 },
]);
assert.deepEqual(recommendedDarts(undefined), []);

// ===== Formatage =====
assert.equal(formatRelativePar(0), 'PAR');
assert.equal(formatRelativePar(3), '+3');
assert.equal(formatRelativePar(-2), '-2');
assert.equal(formatConfigShort(cfg()), '9 trous · fermeture à 3 marques');
assert.ok(formatConfig(cfg()).includes('9 trous'));

console.log('ALL GOLF CRICKET TESTS PASSED');
