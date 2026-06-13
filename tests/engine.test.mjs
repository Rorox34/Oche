import assert from 'node:assert/strict';
import { createGame, reduce, dartScore, average3Darts, checkoutRate } from '../src/core/x01/engine.ts';
import { checkoutRoutes } from '../src/core/x01/checkout.ts';
import { canFinishWith, satisfiesIn, finishingDarts } from '../src/core/x01/rules.ts';
import { formatDart } from '../src/core/x01/format.ts';

const base = { startScore: 501, inRule: 'straight', outRule: 'double', legsToWin: 2, playerNames: ['A', 'B'] };
const dart = (value, multiplier = 1) => ({ type: 'dart', dart: { value, multiplier } });

/** État avec joueur courant à `score` (ouvert ou non), cohérent avec visitStart*. */
const withScore = (cfg, score, opened = true) => {
  const s = createGame(cfg);
  return {
    ...s,
    players: s.players.map((p, i) => (i === 0 ? { ...p, score, opened } : p)),
    visitStartScore: score,
    visitStartOpened: opened,
  };
};

// ===== Calculs de score & visite normale =====
let s = createGame(base);
s = reduce(s, dart(20, 3));
assert.equal(s.players[0].score, 441);
s = reduce(s, dart(20, 3));
s = reduce(s, dart(20, 3));
assert.equal(s.players[0].score, 321);
assert.equal(s.currentPlayer, 1, 'changement de joueur après 3 fléchettes');
assert.equal(s.players[0].visits, 1);
assert.equal(s.players[0].highestVisit, 180);
assert.equal(average3Darts(s.players[0]).toFixed(1), '180.0');
assert.equal(s.log.length, 1);
assert.equal(s.log[0].scored, 180);
assert.equal(s.log[0].bust, false);

// ===== Bust : score < 0 → restauration, main passée, 0 point, journal & compteur =====
let b = withScore(base, 30);
b = reduce(b, dart(20, 2)); // 30 - 40 < 0
assert.equal(b.players[0].score, 30, 'score restauré après bust');
assert.equal(b.currentPlayer, 1);
assert.equal(b.players[0].pointsScored, 0);
assert.equal(b.bustCount, 1, 'bustCount incrémenté');
assert.equal(b.log.at(-1).bust, true);
assert.equal(b.log.at(-1).scored, 0);

// ===== Double out : rester à 1 = bust ; finir sans double = bust =====
let one = withScore(base, 30);
one = reduce(one, dart(9));
one = reduce(one, dart(20)); // reste 1
assert.equal(one.players[0].score, 30);
assert.equal(one.bustCount, 1);
let nd = withScore(base, 30);
nd = reduce(nd, dart(10, 3)); // 0 sur un triple en double out
assert.equal(nd.players[0].score, 30);

// ===== Checkout double out → legOver, rotation, matchOver, revanche =====
let win = withScore(base, 32);
win = reduce(win, dart(16, 2));
assert.equal(win.phase, 'legOver');
assert.equal(win.winner, 0);
assert.equal(win.log.at(-1).checkout, true);
const legOverState = win;
assert.equal(reduce(legOverState, dart(20)), legOverState, 'fléchette ignorée hors phase de jeu');
win = reduce(win, { type: 'nextLeg' });
assert.equal(win.phase, 'playing');
assert.equal(win.players[0].score, 501);
assert.equal(win.currentPlayer, 1, 'rotation du lanceur initial');
assert.equal(win.legIndex, 2);
let m1 = withScore({ ...base, legsToWin: 1 }, 40);
m1 = reduce(m1, dart(20, 2));
assert.equal(m1.phase, 'matchOver');
const rematch = reduce(m1, { type: 'restart' });
assert.equal(rematch.phase, 'playing');
assert.equal(rematch.players[0].score, 501);
assert.equal(rematch.log.length, 0);

// ===== Sortie directe (straight out) : finir sur un simple, 1 n'est pas un bust =====
let so = withScore({ ...base, outRule: 'straight' }, 3);
so = reduce(so, dart(2)); // reste 1, pas de bust
assert.equal(so.players[0].score, 1);
assert.equal(so.currentPlayer, 0);
so = reduce(so, dart(1)); // finit sur un simple
assert.equal(so.phase, 'legOver');
let so25 = withScore({ ...base, outRule: 'straight' }, 25);
so25 = reduce(so25, dart(25, 1));
assert.equal(so25.phase, 'legOver', 'straight out : finir sur bull 25');

// ===== Master out : double ou triple uniquement, 1 = bust =====
let mt = withScore({ ...base, outRule: 'master' }, 60);
mt = reduce(mt, dart(20, 3));
assert.equal(mt.phase, 'legOver', 'master out : finir sur un triple');
let md = withScore({ ...base, outRule: 'master' }, 40);
md = reduce(md, dart(20, 2));
assert.equal(md.phase, 'legOver', 'master out : finir sur un double');
let ms = withScore({ ...base, outRule: 'master' }, 20);
ms = reduce(ms, dart(20, 1)); // 0 sur un simple → bust
assert.equal(ms.players[0].score, 20);
assert.equal(ms.bustCount, 1);
let m1b = withScore({ ...base, outRule: 'master' }, 21);
m1b = reduce(m1b, dart(20, 1)); // reste 1 → bust
assert.equal(m1b.players[0].score, 21);

// ===== Double in =====
let di = createGame({ ...base, inRule: 'double' });
assert.equal(di.players[0].opened, false);
di = reduce(di, dart(20, 1)); // non qualifiant : 0 point
assert.equal(di.players[0].score, 501);
assert.equal(di.players[0].dartsThrown, 1);
di = reduce(di, dart(10, 2)); // ouvre ET compte
assert.equal(di.players[0].opened, true);
assert.equal(di.players[0].score, 481);
// Bust après ouverture dans la même visite → ouverture annulée aussi
let dib = withScore({ ...base, inRule: 'double' }, 40, false);
dib = reduce(dib, dart(10, 2)); // ouvre, reste 20
assert.equal(dib.players[0].opened, true);
dib = reduce(dib, dart(15, 3)); // 20 - 45 < 0 → bust
assert.equal(dib.players[0].score, 40);
assert.equal(dib.players[0].opened, false, 'ouverture annulée avec la visite bust');
assert.equal(dib.visitStartOpened, false);

// ===== Triple in =====
let ti = createGame({ ...base, inRule: 'triple' });
ti = reduce(ti, dart(20, 1));
ti = reduce(ti, dart(20, 2));
assert.equal(ti.players[0].score, 501, 'simple et double ne qualifient pas en triple in');
ti = reduce(ti, dart(20, 3));
assert.equal(ti.players[0].score, 441, 'le triple ouvre et compte');
assert.equal(ti.currentPlayer, 1);

// ===== Bull in : 25 ou 50 obligatoire =====
let bi = createGame({ ...base, inRule: 'bull' });
bi = reduce(bi, dart(20, 3)); // T20 ne qualifie pas
assert.equal(bi.players[0].score, 501);
bi = reduce(bi, dart(25, 1)); // 25 ouvre
assert.equal(bi.players[0].score, 476);
let bi50 = createGame({ ...base, inRule: 'bull' });
bi50 = reduce(bi50, dart(25, 2)); // 50 ouvre aussi
assert.equal(bi50.players[0].score, 451);

// ===== Statistiques de checkout (tentatives / réussites) =====
let co = withScore(base, 40);
co = reduce(co, dart(20, 2)); // finishable → tentative + réussite
assert.equal(co.players[0].checkoutAttempts, 1);
assert.equal(co.players[0].checkoutHits, 1);
assert.equal(checkoutRate(co.players[0]), 100);
let co2 = withScore(base, 40);
co2 = reduce(co2, dart(20, 1)); // 40 finishable → tentative ratée, reste 20
co2 = reduce(co2, dart(5, 1)); // 20 finishable → tentative ratée, reste 15
co2 = reduce(co2, dart(1, 1)); // 15 impair non finishable en 1 → pas de tentative
assert.equal(co2.players[0].checkoutAttempts, 2);
assert.equal(co2.players[0].checkoutHits, 0);
assert.equal(checkoutRate(co2.players[0]), 0);
assert.equal(checkoutRate(createGame(base).players[0]), null);

// ===== Fléchettes invalides ignorées =====
const fresh = createGame(base);
assert.equal(reduce(fresh, dart(25, 3)), fresh);
assert.equal(reduce(fresh, dart(21, 1)), fresh);

// ===== Règles unitaires =====
assert.equal(satisfiesIn({ value: 25, multiplier: 2 }, 'bull'), true);
assert.equal(satisfiesIn({ value: 19, multiplier: 2 }, 'bull'), false);
assert.equal(canFinishWith({ value: 20, multiplier: 3 }, 'master'), true);
assert.equal(canFinishWith({ value: 20, multiplier: 1 }, 'master'), false);
assert.equal(canFinishWith({ value: 5, multiplier: 1 }, 'straight'), true);

// ===== Suggestions de finish =====
const fmt = (r) => r.map(formatDart).join(' ');
let routes = checkoutRoutes(170, 3, 'double');
assert.equal(fmt(routes[0]), 'T20 T20 DB');
routes = checkoutRoutes(32, 3, 'double');
assert.equal(fmt(routes[0]), 'D16', '32 → D16 fortement suggéré');
assert.ok(routes.length >= 2 && routes.length <= 3);
const firsts = routes.map((r) => formatDart(r[0]));
assert.equal(new Set(firsts).size, firsts.length, 'premières fléchettes distinctes');
routes = checkoutRoutes(80, 3, 'double');
assert.equal(fmt(routes[0]), 'T20 D10', '80 → T20 D10');
routes = checkoutRoutes(40, 3, 'double');
assert.equal(fmt(routes[0]), 'D20');
assert.equal(checkoutRoutes(169, 3, 'double').length, 0);
assert.equal(checkoutRoutes(159, 3, 'double').length, 0);
// Master : triples autorisés en finish, 61 → T15 D8 (route pro)
routes = checkoutRoutes(61, 3, 'master');
assert.equal(fmt(routes[0]), 'T15 D8');
routes = checkoutRoutes(60, 1, 'master');
assert.ok(routes.some((r) => fmt(r) === 'T20'));
// Straight : simples autorisés
routes = checkoutRoutes(20, 1, 'straight');
assert.equal(fmt(routes[0]), '20');
routes = checkoutRoutes(25, 1, 'straight');
assert.equal(fmt(routes[0]), '25');
// Validité exhaustive : somme exacte + dernière fléchette conforme à la règle
for (const rule of ['straight', 'double', 'master']) {
  const max = rule === 'double' ? 170 : 180;
  for (let score = 2; score <= max; score++) {
    for (const route of checkoutRoutes(score, 3, rule)) {
      assert.ok(route.length >= 1 && route.length <= 3);
      assert.equal(route.reduce((t, d) => t + dartScore(d), 0), score, `somme ${rule} ${score}`);
      assert.ok(canFinishWith(route.at(-1), rule), `fin ${rule} ${score}`);
      // Aucun reste intermédiaire injouable
      let rest = score;
      for (const d of route.slice(0, -1)) {
        rest -= dartScore(d);
        assert.ok(rest >= (rule === 'straight' ? 1 : 2), `reste ${rule} ${score}`);
      }
    }
  }
}
// Cohérence finishingDarts / routes 1 fléchette
assert.deepEqual(
  checkoutRoutes(50, 1, 'double').map(fmt),
  finishingDarts(50, 'double').map((d) => formatDart(d)),
);

console.log('ALL ENGINE TESTS PASSED');
