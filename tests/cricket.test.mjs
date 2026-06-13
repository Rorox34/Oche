import assert from 'node:assert/strict';
import { createGame, reduce, mpr, closedCount } from '../src/core/cricket/engine.ts';
import {
  MARKS_TO_CLOSE,
  VARIANTS,
  marksFor,
  isDead,
  isClosedBy,
  targetValue,
  recommendedDarts,
} from '../src/core/cricket/rules.ts';
import { buildTargets } from '../src/core/cricket/targets.ts';
import { formatTarget, formatVariant, formatVariantShort } from '../src/core/cricket/format.ts';

const cfg = (variant = 'standard', names = ['A', 'B']) => ({ variant, playerNames: names });
const dart = (value, multiplier = 1) => ({ type: 'dart', dart: { value, multiplier } });
const num = (v) => ({ kind: 'number', value: v });
const bull = { kind: 'bull' };

// ===== Cibles =====
const targets = buildTargets(cfg());
assert.equal(targets.length, 7, '6 numéros + bull');
assert.deepEqual(targets[0], num(20));
assert.deepEqual(targets[5], num(15));
assert.deepEqual(targets[6], bull);

// ===== marksFor : multiplicateurs et bull =====
assert.equal(marksFor({ value: 20, multiplier: 1 }, num(20)), 1);
assert.equal(marksFor({ value: 20, multiplier: 2 }, num(20)), 2);
assert.equal(marksFor({ value: 20, multiplier: 3 }, num(20)), 3);
assert.equal(marksFor({ value: 19, multiplier: 3 }, num(20)), 0, 'mauvais numéro');
assert.equal(marksFor({ value: 25, multiplier: 1 }, bull), 1, 'bull simple = 1 marque');
assert.equal(marksFor({ value: 25, multiplier: 2 }, bull), 2, 'double bull = 2 marques');
assert.equal(marksFor({ value: 0, multiplier: 1 }, num(20)), 0, 'manqué');
assert.equal(targetValue(num(18)), 18);
assert.equal(targetValue(bull), 25);

// ===== Ouverture / fermeture =====
let s = createGame(cfg());
s = reduce(s, dart(20)); // 1 marque
assert.equal(s.players[0].marks[0], 1);
assert.equal(isClosedBy(s.players[0], 0), false);
s = reduce(s, dart(20, 2)); // +2 → 3 marques (fermé), 0 excédent
assert.equal(s.players[0].marks[0], MARKS_TO_CLOSE);
assert.equal(isClosedBy(s.players[0], 0), true);
assert.equal(s.players[0].score, 0, 'rien à scorer en fermant pile');
assert.equal(s.currentPlayer, 0, 'encore au joueur 0 après 2 fléchettes');
s = reduce(s, dart(0)); // 3e fléchette (manquée) → fin de volée
assert.equal(s.currentPlayer, 1, 'rotation après 3 fléchettes');

// ===== Standard : score sur cible fermée tant qu'un adversaire est ouvert =====
let g = createGame(cfg('standard'));
g = reduce(g, dart(20, 3)); // ferme 20 d'un coup (3 marques, 0 excédent)
assert.equal(g.players[0].marks[0], 3);
assert.equal(g.players[0].score, 0);
g = reduce(g, dart(20, 3)); // 20 déjà fermé → 3 marques scorent = 60
assert.equal(g.players[0].score, 60);
g = reduce(g, dart(20, 1)); // +20 → 80, fin de volée
assert.equal(g.players[0].score, 80);
assert.equal(g.currentPlayer, 1);
assert.equal(g.log.at(-1).marks, 7, '3+3+1 marques posées');
assert.equal(g.log.at(-1).points, 80);

// fermer pour l'adversaire rend la cible morte : plus de points
let m = createGame(cfg('standard'));
m = reduce(m, dart(20, 3)); // A ferme 20
m = reduce(m, dart(19, 1)); // A pose 1 sur 19
m = reduce(m, dart(19, 1)); // A: fin de volée (19 à 2 marques)
assert.equal(m.currentPlayer, 1);
m = reduce(m, dart(20, 3)); // B ferme 20 → 20 mort pour tous
m = reduce(m, dart(20, 3)); // B: 20 mort → 0 point
assert.equal(m.players[1].score, 0, '20 mort : aucun point');
assert.ok(isDead(m.players, 0), '20 fermé par A et B');

// ===== Cut-Throat : les points vont aux adversaires ouverts, plus bas gagne =====
let c = createGame(cfg('cutthroat', ['A', 'B', 'C']));
c = reduce(c, dart(20, 3)); // A ferme 20
c = reduce(c, dart(20, 3)); // A score 60 → réparti sur B et C (ouverts)
assert.equal(c.players[0].score, 0, 'le marqueur ne prend pas les points');
assert.equal(c.players[1].score, 60);
assert.equal(c.players[2].score, 60);
c = reduce(c, dart(0)); // 3e fléchette → clôt la volée et journalise
assert.equal(c.log.at(-1).points, 120, '60 donnés à B + 60 à C');
assert.equal(VARIANTS.cutthroat.goal, 'lowest');

// ===== Victoire standard : fermer tout en menant au score =====
const closeAllExcept = (state, p, openIndex) => ({
  ...state,
  players: state.players.map((pl, i) =>
    i === p
      ? { ...pl, marks: pl.marks.map((_, idx) => (idx === openIndex ? 2 : MARKS_TO_CLOSE)) }
      : pl,
  ),
});
let w = createGame(cfg('standard'));
w = closeAllExcept(w, 0, 6); // A: tout fermé sauf le bull (2 marques)
w = reduce(w, dart(25, 1)); // ferme le bull → tout fermé, score 0 ≥ 0 → gagne
assert.equal(w.phase, 'matchOver');
assert.equal(w.winner, 0);
assert.equal(w.log.at(-1).finish, true);
assert.equal(reduce(w, dart(20)), w, 'fléchette ignorée après victoire');

// Standard : fermer tout mais être mené ⇒ pas encore gagné
let beh = createGame(cfg('standard'));
beh = {
  ...beh,
  players: [
    beh.players[0],
    { ...beh.players[1], score: 50 },
  ],
};
beh = closeAllExcept(beh, 0, 6);
beh = reduce(beh, dart(25, 1)); // ferme tout, score 0 < 50 → pas gagné
assert.equal(beh.phase, 'playing', 'fermé mais mené : la partie continue');

// ===== No-score : premier à tout fermer gagne, sans points =====
let n = createGame(cfg('no-score'));
n = closeAllExcept(n, 0, 6);
n = reduce(n, dart(25, 2)); // ferme le bull (double bull) → gagne immédiatement
assert.equal(n.phase, 'matchOver');
assert.equal(n.winner, 0);
assert.equal(n.players[0].score, 0, 'aucun point en no-score');
assert.equal(VARIANTS['no-score'].scores, false);

// ===== Stats : MPR et fermetures =====
let st = createGame(cfg());
assert.equal(mpr(st.players[0]), null, 'null avant le premier lancer');
st = reduce(st, dart(20, 3)); // 3 marques en 1 fléchette
assert.equal(mpr(st.players[0]), 9, '3 marques / 1 fléchette × 3 = 9');
assert.equal(closedCount(st.players[0]), 1);

// ===== Fléchettes invalides ignorées =====
const fresh = createGame(cfg());
assert.equal(reduce(fresh, dart(25, 3)), fresh, 'T25 invalide : état inchangé');
assert.equal(reduce(fresh, dart(21, 1)), fresh, '21 invalide : état inchangé');
const off = reduce(fresh, dart(14, 1)); // 14 valide mais hors-cible Cricket
assert.equal(off.players[0].dartsThrown, 1, 'le 14 compte comme fléchette lancée');
assert.equal(off.players[0].totalMarks, 0, 'aucune marque hors-cible');
assert.equal(reduce(fresh, dart(0, 1)).players[0].dartsThrown, 1, 'un manqué compte comme fléchette');

// ===== Revanche : remet tout à zéro =====
const r = reduce(w, { type: 'restart' });
assert.equal(r.phase, 'playing');
assert.equal(r.players[0].score, 0);
assert.deepEqual(r.players[0].marks, [0, 0, 0, 0, 0, 0, 0]);
assert.equal(r.log.length, 0);

// ===== Clavier intelligent : cibles encore ouvertes =====
let rec = createGame(cfg());
assert.equal(recommendedDarts(rec.targets, rec.players[0]).length, 7, '7 cibles ouvertes au départ');
rec = reduce(rec, dart(20, 3)); // ferme 20
const recs = recommendedDarts(rec.targets, rec.players[0]);
assert.equal(recs.length, 6, '20 fermé : 6 cibles restantes');
assert.ok(!recs.some((d) => d.value === 20), '20 fermé n’est plus recommandé');

// ===== Formatage =====
assert.equal(formatTarget(num(17)), '17');
assert.equal(formatTarget(bull), 'Bull');
assert.equal(formatVariantShort(cfg('cutthroat')), 'Cut-Throat');
assert.equal(formatVariantShort(cfg('no-score')), 'Sans points');
assert.ok(formatVariant(cfg('standard')).length > 0);

console.log('ALL CRICKET TESTS PASSED');
