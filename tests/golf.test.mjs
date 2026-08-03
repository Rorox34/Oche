import assert from 'node:assert/strict';
import { createGame, reduce, playedHoles, relativeToPar } from '../src/core/golf/engine.ts';
import {
  VARIANTS,
  previewHoleScore,
  recommendedDarts,
  marksFor,
  MISS_STROKES,
  MARKS_TO_CLOSE,
} from '../src/core/golf/rules.ts';
import { buildTargets } from '../src/core/golf/targets.ts';
import { formatRelativePar, formatVariantShort } from '../src/core/golf/format.ts';

const cfg = (over = {}) => ({ variant: 'standard', holes: 9, playerNames: ['A', 'B'], ...over });
const dart = (value, multiplier = 1) => ({ type: 'dart', dart: { value, multiplier } });
const D = (value, multiplier = 1) => ({ value, multiplier });

// ===== Cibles =====
assert.deepEqual(buildTargets(cfg()), [1, 2, 3, 4, 5, 6, 7, 8, 9]);
assert.equal(buildTargets(cfg({ holes: 18 })).length, 18);

// ===== Variante Standard : meilleure fléchette (T=1, D=2, S=3, manqué=4) =====
const std = VARIANTS.standard.holeScore;
assert.equal(std([D(3, 3), D(3, 1), D(5, 1)], 3), 1, 'triple = 1 (eagle)');
assert.equal(std([D(3, 2), D(3, 1)], 3), 2, 'meilleure = double = 2');
assert.equal(std([D(3, 1), D(5, 1), D(0)], 3), 3, 'simple = 3 (par)');
assert.equal(std([D(5, 1), D(0), D(7, 2)], 3), MISS_STROKES, 'manqué = 4');

// ===== Variante Au plus court : nb de fléchettes pour toucher =====
const fewest = VARIANTS.darts.holeScore;
assert.equal(fewest([D(3, 1)], 3), 1, 'touché à la 1re');
assert.equal(fewest([D(5, 1), D(3, 2)], 3), 2, 'touché à la 2e (multiplicateur ignoré)');
assert.equal(fewest([D(0), D(0), D(3, 3)], 3), 3, 'touché à la 3e');
assert.equal(fewest([D(0), D(5, 1), D(7, 1)], 3), MISS_STROKES, 'jamais touché = 4');

// ===== Score provisoire =====
assert.equal(previewHoleScore([D(0)], 3, 'standard'), null, 'rien de décisif tant qu’on n’a pas touché');
assert.equal(previewHoleScore([D(0), D(3, 2)], 3, 'standard'), 2);
assert.equal(previewHoleScore([D(3, 1)], 3, 'darts'), 1);

// ===== Déroulé d'un trou et rotation =====
let s = createGame(cfg());
s = reduce(s, dart(1, 3)); // A, trou 1 : triple 1
s = reduce(s, dart(0));
s = reduce(s, dart(0)); // fin de volée → coup = 1
assert.equal(s.players[0].holeScores[0], 1);
assert.equal(s.players[0].strokes, 1);
assert.equal(s.currentPlayer, 1, 'rotation après 3 fléchettes');
assert.equal(s.round, 0, 'même trou tant que tous n’ont pas joué');
assert.equal(s.log.at(-1).hole, 1);
assert.equal(s.log.at(-1).strokes, 1);

// le trou avance une fois le dernier joueur passé
s = reduce(s, dart(1, 1)); // B simple 1 → 3
s = reduce(s, dart(0));
s = reduce(s, dart(0));
assert.equal(s.players[1].holeScores[0], 3);
assert.equal(s.round, 1, 'trou 2 après le tour de tous les joueurs');
assert.equal(s.currentPlayer, 0);

// ===== Fin de partie : plus petit total gagne =====
const playHole = (state, p0, p1) => {
  // chaque joueur marque le coup voulu : simple = 3, double = 2, triple = 1, sinon manqué
  const t = state.targets[state.round];
  const dartFor = (stroke) =>
    stroke === 1 ? dart(t, 3) : stroke === 2 ? dart(t, 2) : stroke === 3 ? dart(t, 1) : dart(0);
  let st = state;
  for (const stroke of [p0, p1]) {
    st = reduce(st, dartFor(stroke));
    st = reduce(st, dart(0));
    st = reduce(st, dart(0));
  }
  return st;
};
let g = createGame(cfg({ holes: 9 }));
for (let h = 0; h < 9; h++) g = playHole(g, 1, 3); // A fait 1 (eagle), B fait 3 (par) à chaque trou
assert.equal(g.phase, 'matchOver');
assert.equal(g.winner, 0, 'A (plus petit total) gagne');
assert.equal(g.players[0].strokes, 9, '9 × 1');
assert.equal(g.players[1].strokes, 27, '9 × 3');

// ===== Stats : trous joués et score relatif au par =====
assert.equal(playedHoles(g.players[0]), 9);
assert.equal(relativeToPar(g.players[0]), 9 - 9 * 3, 'A : -18 sous le par');
assert.equal(relativeToPar(g.players[1]), 0, 'B : pile au par');

// ===== Fléchettes invalides ignorées =====
const fresh = createGame(cfg());
assert.equal(reduce(fresh, dart(25, 3)), fresh, 'T25 invalide');
assert.equal(reduce(fresh, dart(21, 1)), fresh, '21 invalide');
assert.equal(reduce(fresh, dart(25, 1)).players[0].dartsThrown, 1, 'le bull compte comme fléchette (mais ne touche pas le numéro)');

// ===== Revanche =====
const r = reduce(g, { type: 'restart' });
assert.equal(r.phase, 'playing');
assert.equal(r.round, 0);
assert.equal(r.players[0].strokes, 0);
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
assert.equal(formatVariantShort(cfg()), '9 trous · Standard');
assert.equal(formatVariantShort(cfg({ variant: 'darts', holes: 18 })), '18 trous · Au plus court');

// ===== Variante Cricket : marques par fléchette =====
assert.equal(marksFor(D(3, 1), 3), 1, 'simple = 1 marque');
assert.equal(marksFor(D(3, 2), 3), 2, 'double = 2 marques');
assert.equal(marksFor(D(3, 3), 3), 3, 'triple = 3 marques');
assert.equal(marksFor(D(5, 3), 3), 0, 'hors cible = 0');
assert.equal(marksFor(D(0), 3), 0, 'manqué = 0');
assert.equal(MARKS_TO_CLOSE, 3);
assert.equal(previewHoleScore([D(3, 1)], 3, 'cricket'), null, 'pas de coup provisoire en Cricket (voir holeMarks)');

// ===== Cricket : triple = fermeture immédiate en 1 fléchette =====
const cricketCfg = (over = {}) => cfg({ variant: 'cricket', ...over });
let c = createGame(cricketCfg());
c = reduce(c, dart(1, 3)); // A : triple sur le trou 1
assert.equal(c.players[0].holeScores[0], 1, 'fermé en 1 coup (eagle)');
assert.equal(c.players[0].strokes, 1);
assert.equal(c.players[0].holeMarks, 3, 'marques figées à 3 après fermeture');
assert.equal(c.players[0].holeDarts, 1);
assert.equal(c.currentPlayer, 1, 'la main passe à B, qui n’a pas encore fermé');
assert.equal(c.round, 0, 'même trou tant que B n’a pas fermé');
assert.equal(c.log.at(-1).strokes, 1);

// ===== Cricket : B ferme en 3 fléchettes (simple, simple, simple) → le trou avance =====
c = reduce(c, dart(1, 1)); // marque 1/3
assert.equal(c.currentPlayer, 1, 'volée en cours, toujours à B');
c = reduce(c, dart(1, 1)); // marque 2/3
c = reduce(c, dart(1, 1)); // marque 3/3 → fermé
assert.equal(c.players[1].holeScores[0], 3, 'fermé en 3 coups (par)');
assert.equal(c.round, 1, 'trou 2 une fois tout le monde fermé');
assert.equal(c.currentPlayer, 0, 'rotation naturelle après le trou');
assert.equal(c.players[0].holeMarks, 0, 'marques remises à zéro pour le nouveau trou');

// ===== Cricket : manqué = un coup en plus, sans marque =====
c = reduce(c, dart(2, 2)); // A : double → 2/3
c = reduce(c, dart(0)); // manqué : ne ferme pas, mais compte un coup
assert.equal(c.players[0].holeMarks, 2, 'le manqué ne progresse pas les marques');
assert.equal(c.players[0].holeDarts, 2);
c = reduce(c, dart(2, 1)); // simple → 3/3, fermé en 3 fléchettes malgré le manqué
assert.equal(c.players[0].holeScores[1], 3);
assert.equal(c.currentPlayer, 1, 'la main passe à B pour le même trou');

// ===== Cricket : volée de 3 sans fermer → la main revient plus tard au même joueur =====
c = reduce(c, dart(0));
c = reduce(c, dart(0));
c = reduce(c, dart(0)); // B manque ses 3 fléchettes, trou 2 pas fermé
assert.equal(c.players[1].holeScores[1], -1, 'toujours pas fermé');
assert.equal(c.round, 1, 'le trou n’avance pas tant que B n’a pas fermé');
assert.equal(c.currentPlayer, 1, 'A a déjà fermé : la main reste/revient à B');
c = reduce(c, dart(2, 3)); // B : triple, ferme enfin (4 fléchettes au total sur ce trou)
assert.equal(c.players[1].holeScores[1], 4);
assert.equal(c.round, 2, 'trou 3 une fois B fermé à son tour');

// ===== Cricket : fin de partie, le plus petit total de fléchettes gagne =====
const closeHole = (state, playerStrokes) => {
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
let cg = createGame(cricketCfg({ holes: 9 }));
for (let h = 0; h < 9; h++) cg = closeHole(cg, [1, 3]); // A ferme en 1 (triple), B en 3 (simples)
assert.equal(cg.phase, 'matchOver');
assert.equal(cg.winner, 0, 'A (plus petit total) gagne');
assert.equal(cg.players[0].strokes, 9, '9 × 1');
assert.equal(cg.players[1].strokes, 27, '9 × 3');
assert.equal(relativeToPar(cg.players[0]), 9 - 9 * 3, 'A : -18 sous le par');

// ===== Cricket, 3 joueurs : on saute les joueurs déjà fermés =====
let t = createGame(cricketCfg({ playerNames: ['A', 'B', 'C'] }));
t = reduce(t, dart(1, 3)); // A ferme direct
assert.equal(t.currentPlayer, 1);
t = reduce(t, dart(1, 3)); // B ferme direct
assert.equal(t.currentPlayer, 2, 'on saute A (déjà fermé) pour arriver à C');
t = reduce(t, dart(0));
t = reduce(t, dart(0));
t = reduce(t, dart(0)); // C manque ses 3 fléchettes
assert.equal(t.currentPlayer, 2, 'A et B fermés : la main reste à C');
t = reduce(t, dart(1, 1));
t = reduce(t, dart(1, 1));
t = reduce(t, dart(1, 1)); // C ferme enfin en 6 fléchettes
assert.equal(t.players[2].holeScores[0], 6);
assert.equal(t.round, 1, 'trou suivant une fois C fermé');
assert.equal(t.currentPlayer, 0, 'rotation naturelle depuis C (index 2) → A (index 0)');

// ===== Cricket : revanche =====
const cr = reduce(cg, { type: 'restart' });
assert.equal(cr.phase, 'playing');
assert.equal(cr.players[0].holeMarks, 0);
assert.equal(formatVariantShort(cricketCfg()), '9 trous · Cricket');

console.log('ALL GOLF TESTS PASSED');
