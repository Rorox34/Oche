import assert from 'node:assert/strict';
import {
  normalizeName,
  isRealName,
  recordResult,
  reverseResult,
  sortedProfiles,
  suggestNames,
  winRate,
} from '../src/store/profiles.ts';

const res = (players, winner) => ({ players, winner });

// ===== Normalisation & noms réels =====
assert.equal(normalizeName('  Bob '), 'bob');
assert.equal(isRealName('Bob'), true);
assert.equal(isRealName('   '), false);
assert.equal(isRealName('Joueur 1'), false, 'nom par défaut ignoré');
assert.equal(isRealName('joueur 12'), false);
assert.equal(isRealName('Joueur Bob'), true);

// ===== Enregistrement =====
let p = {};
p = recordResult(p, 'x01', res(['Bob', 'Alice'], 0), 1000); // Bob gagne
assert.equal(p['bob'].games, 1);
assert.equal(p['bob'].wins, 1);
assert.equal(p['alice'].games, 1);
assert.equal(p['alice'].wins, 0);
assert.equal(p['bob'].byMode.x01.wins, 1);
assert.equal(p['bob'].lastPlayedAt, 1000);

p = recordResult(p, 'cricket', res(['bob', 'Alice'], 1), 2000); // Alice gagne (casse différente pour Bob)
assert.equal(p['bob'].games, 2, 'fusion insensible à la casse');
assert.equal(p['bob'].wins, 1);
assert.equal(p['bob'].name, 'bob', 'dernière casse conservée');
assert.equal(p['alice'].wins, 1);
assert.equal(Object.keys(p['bob'].byMode).length, 2, 'deux modes pour Bob');

// les noms par défaut ne créent pas de profil
const pd = recordResult({}, 'x01', res(['Joueur 1', 'Joueur 2'], 0), 1);
assert.equal(Object.keys(pd).length, 0, 'aucun profil pour des noms par défaut');

// ===== Réversibilité (annulation du coup gagnant) =====
const before = recordResult({}, 'x01', res(['Bob', 'Alice'], 0), 1000);
const after = recordResult(before, 'atc', res(['Bob', 'Alice'], 1), 2000);
const reversed = reverseResult(after, 'atc', res(['Bob', 'Alice'], 1));
assert.equal(reversed['bob'].games, 1);
assert.equal(reversed['alice'].games, 1);
assert.equal(reversed['alice'].wins, 0, 'la victoire annulée est retirée');
assert.equal(reversed['bob'].byMode.atc, undefined, 'le mode annulé disparaît');
assert.deepEqual(reversed['bob'].byMode, before['bob'].byMode);
// annuler la seule partie d'un joueur retire son profil
const single = recordResult({}, 'x01', res(['Solo', 'Joueur 2'], 0), 1);
const empty = reverseResult(single, 'x01', res(['Solo', 'Joueur 2'], 0));
assert.equal(empty['solo'], undefined, 'profil retiré quand il retombe à zéro');

// ===== Tri & taux =====
let s = {};
s = recordResult(s, 'x01', res(['Bob', 'Alice'], 0), 1);
s = recordResult(s, 'x01', res(['Bob', 'Alice'], 0), 2);
s = recordResult(s, 'x01', res(['Carol', 'Bob'], 0), 3);
const sorted = sortedProfiles(s);
assert.equal(sorted[0].name, 'Bob', 'le plus joué en tête (3 parties)');
assert.equal(winRate(s['bob']), 67, '2 victoires sur 3');
assert.equal(winRate(s['alice']), 0);

// ===== Suggestions =====
assert.deepEqual(suggestNames(s, '', []), ['Bob', 'Alice', 'Carol'], 'saisie vide → tous, triés par usage');
assert.deepEqual(suggestNames(s, 'Joueur 1', []), ['Bob', 'Alice', 'Carol'], 'nom par défaut → tous');
assert.deepEqual(suggestNames(s, 'a', []), ['Alice', 'Carol'], 'filtre par sous-chaîne');
assert.deepEqual(suggestNames(s, '', ['Bob']), ['Alice', 'Carol'], 'exclut les déjà choisis');
assert.equal(suggestNames(s, 'zz', []).length, 0);

console.log('ALL PROFILES TESTS PASSED');
