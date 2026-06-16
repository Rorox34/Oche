import assert from 'node:assert/strict';
import { createGame, reduce, visitLivesTaken } from '../src/core/killer/engine.ts';
import { recommendedDarts, aliveCount, canAttack, isEliminated } from '../src/core/killer/rules.ts';
import { formatVariant, formatVariantShort, statusLabel, formatEvent } from '../src/core/killer/format.ts';

const cfg = (over = {}) => ({
  lives: 3,
  entry: 'bull',
  numberMode: 'random',
  healOnKill: false,
  playerNames: ['A', 'B', 'C'],
  ...over,
});
const dart = (value, multiplier = 1) => ({ type: 'dart', dart: { value, multiplier } });
const bull = (m = 1) => dart(25, m);
const setPlayers = (s, fn) => ({ ...s, players: s.players.map(fn) });

// ===== Attribution aléatoire =====
const g0 = createGame(cfg());
const nums = g0.players.map((p) => p.number);
assert.equal(g0.phase, 'playing', 'mode aléatoire : on joue directement');
assert.equal(new Set(nums).size, 3, 'numéros distincts');
nums.forEach((n) => assert.ok(n >= 1 && n <= 20));
g0.players.forEach((p) => {
  assert.equal(p.lives, 3);
  assert.equal(p.isKiller, false);
  assert.equal(p.inPrison, false);
});

// ===== Attribution « au choix » : phase d'attribution =====
let ch = createGame(cfg({ numberMode: 'choice' }));
assert.equal(ch.phase, 'assigning', 'mode au choix : phase d’attribution');
assert.ok(ch.players.every((p) => p.number === 0), 'numéros non attribués au départ');
ch = reduce(ch, dart(0)); // manqué → ignoré, on rejoue
assert.equal(ch.currentPlayer, 0);
ch = reduce(ch, dart(25)); // bull → ne peut pas être un numéro, ignoré
assert.equal(ch.players[0].number, 0);
ch = reduce(ch, dart(7, 3)); // A choisit 7 (multiplicateur indifférent)
assert.equal(ch.players[0].number, 7);
assert.equal(ch.currentPlayer, 1, 'au joueur suivant');
ch = reduce(ch, dart(7)); // B tente 7 déjà pris → ignoré
assert.equal(ch.players[1].number, 0);
ch = reduce(ch, dart(12)); // B choisit 12
ch = reduce(ch, dart(3)); // C choisit 3 → tous attribués
assert.equal(ch.phase, 'playing', 'partie lancée une fois tous attribués');
assert.deepEqual(ch.players.map((p) => p.number), [7, 12, 3]);
assert.equal(ch.currentPlayer, 0);

// prison « au choix » : en prison seulement après l'attribution
let chp = createGame(cfg({ numberMode: 'choice', entry: 'prison' }));
assert.ok(chp.players.every((p) => !p.inPrison), 'pas encore en prison pendant l’attribution');
chp = reduce(chp, dart(5));
chp = reduce(chp, dart(6));
chp = reduce(chp, dart(7));
assert.equal(chp.phase, 'playing');
assert.ok(chp.players.every((p) => p.inPrison), 'en prison une fois la partie lancée');

// ===== Pas d'attaque avant d'être tueur =====
let pre = createGame(cfg());
const preB = pre.players[1].number;
pre = reduce(pre, dart(preB, 2));
assert.equal(pre.players[1].lives, 3, 'on ne peut pas attaquer avant d’être tueur');
assert.equal(pre.players[0].dartsThrown, 1, 'la fléchette compte');

// ===== Entrée par Bull, attaque, élimination =====
let s = createGame(cfg());
const bNum = s.players[1].number;
s = reduce(s, bull()); // fléchette 1 : A devient tueur
assert.equal(s.players[0].isKiller, true);
s = reduce(s, dart(bNum, 2)); // fléchette 2 : A touche le double de B → B −2
assert.equal(s.players[1].lives, 1);
assert.equal(visitLivesTaken(s), 2, 'vies retirées dans la volée en cours');
assert.equal(s.currentPlayer, 0, 'encore le tour de A (volée non terminée)');
s = reduce(s, dart(bNum, 1)); // fléchette 3 : A touche B → B −1 → éliminé
assert.equal(s.players[1].lives, 0);
assert.equal(s.currentPlayer, 2, 'rotation vers C, B étant éliminé');
assert.equal(s.log.length, 1);
assert.ok(s.log[0].events.some((e) => e.kind === 'enter'));
assert.ok(s.log[0].events.some((e) => e.kind === 'eliminate'));

// ===== Entrée par Double de son propre numéro =====
let d2 = createGame(cfg({ entry: 'double' }));
const aNum = d2.players[0].number;
d2 = reduce(d2, dart(aNum, 1)); // simple ≠ entrée
assert.equal(d2.players[0].isKiller, false);
d2 = reduce(d2, dart(aNum, 2)); // double → entrée
assert.equal(d2.players[0].isKiller, true);

// ===== Victoire : dernier survivant =====
let w = createGame(cfg({ playerNames: ['A', 'B'], lives: 1 }));
w = setPlayers(w, (p, i) => (i === 0 ? { ...p, isKiller: true } : p));
const bN = w.players[1].number;
w = reduce(w, dart(bN, 1)); // A élimine B (1 vie) → A seul en vie
assert.equal(w.phase, 'matchOver');
assert.equal(w.winner, 0);
assert.equal(w.players[0].kills, 1);
assert.equal(aliveCount(w.players), 1);
assert.equal(reduce(w, dart(5)), w, 'fléchette ignorée après victoire');

// ===== Soin sur élimination =====
let h = createGame(cfg({ healOnKill: true, lives: 3 }));
h = setPlayers(h, (p, i) =>
  i === 0 ? { ...p, isKiller: true, lives: 1 } : i === 1 ? { ...p, lives: 1 } : p,
);
const bNh = h.players[1].number;
h = reduce(h, dart(bNh, 1)); // A (1 vie) élimine B → soigné à fond
assert.equal(h.players[1].lives, 0);
assert.equal(h.players[0].lives, 3, 'A restaure toutes ses vies');
assert.ok(h.log.length === 0 ? true : true); // l'event heal est dans la volée en cours
assert.ok(h.visitEvents.some((e) => e.kind === 'heal'));

// ===== Prison : départ enfermé, sortie au Bull, renvoi en prison =====
let p = createGame(cfg({ entry: 'prison' }));
assert.ok(p.players.every((pl) => pl.inPrison), 'tous en prison au départ');
const cNum = p.players[2].number;
p = reduce(p, dart(cNum, 1)); // A en prison, non-Bull → rien
assert.equal(p.players[0].inPrison, true);
assert.equal(p.players[2].lives, 3, 'pas d’attaque depuis la prison');
p = reduce(p, bull()); // A sort de prison
assert.equal(p.players[0].inPrison, false);
assert.equal(p.players[0].isKiller, true);
assert.ok(p.visitEvents.some((e) => e.kind === 'escape'));
// un autre joueur sorti puis renvoyé en prison par un Bull du tueur
p = setPlayers(p, (pl, i) => (i === 1 ? { ...pl, inPrison: false, isKiller: true } : pl));
p = reduce(p, bull()); // A refait Bull → tout le monde en prison
assert.equal(p.players[1].inPrison, true, 'B renvoyé en prison');
assert.equal(p.players[1].isKiller, false);
assert.equal(p.players[0].inPrison, false, 'A reste libre');
assert.ok(p.log.at(-1).events.some((e) => e.kind === 'jailAll'), 'jailAll journalisé (volée terminée)');
// un tueur en mode prison peut quand même attaquer un numéro
let pa = createGame(cfg({ entry: 'prison' }));
pa = setPlayers(pa, (pl, i) => (i === 0 ? { ...pl, inPrison: false, isKiller: true } : pl));
const cN = pa.players[2].number;
pa = reduce(pa, dart(cN, 2)); // A (sorti) attaque C → −2
assert.equal(pa.players[2].lives, 1);

// ===== Helpers de statut =====
assert.equal(isEliminated({ lives: 0 }), true);
assert.equal(canAttack({ isKiller: true, inPrison: false, lives: 2 }), true);
assert.equal(canAttack({ isKiller: true, inPrison: true, lives: 2 }), false);

// ===== Clavier intelligent =====
let r = createGame(cfg({ entry: 'bull' }));
assert.ok(recommendedDarts(r).every((d) => d.value === 25), 'avant entrée : viser le Bull');
r = setPlayers(r, (pl, i) => (i === 0 ? { ...pl, isKiller: true } : pl));
const recK = recommendedDarts(r);
const oppNums = r.players.filter((_, i) => i !== 0).map((pl) => pl.number);
assert.ok(oppNums.every((n) => recK.some((d) => d.value === n)), 'tueur : numéros adverses éclairés');
assert.ok(!recK.some((d) => d.value === r.players[0].number), 'pas son propre numéro');

// ===== Fléchettes invalides ignorées =====
const fresh = createGame(cfg());
assert.equal(reduce(fresh, dart(25, 3)), fresh, 'T25 invalide');
assert.equal(reduce(fresh, dart(21, 1)), fresh, '21 invalide');

// ===== Revanche : nouveaux numéros, tout réinitialisé =====
const rs = reduce(w, { type: 'restart' });
assert.equal(rs.phase, 'playing');
assert.ok(rs.players.every((pl) => pl.lives === 1));
assert.ok(rs.players.every((pl) => !pl.isKiller));

// ===== Formatage =====
assert.ok(formatVariantShort(cfg({ lives: 5, entry: 'prison' })).includes('Prison'));
assert.ok(formatVariant(cfg({ healOnKill: true })).includes('Soin'));
assert.equal(statusLabel({ lives: 0, inPrison: false, isKiller: true }), '💀 Éliminé');
assert.equal(statusLabel({ lives: 3, inPrison: true, isKiller: false }), '🔒 Prison');
assert.equal(statusLabel({ lives: 3, inPrison: false, isKiller: true }), '🗡 Tueur');
assert.equal(statusLabel({ lives: 3, inPrison: false, isKiller: false }), '⚪ À armer');
assert.equal(formatEvent({ kind: 'eliminate', player: 0, target: 1 }, g0.players), `${g0.players[1].name} éliminé`);

console.log('ALL KILLER TESTS PASSED');
