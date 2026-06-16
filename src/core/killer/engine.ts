import { isValidDart } from '../darts.ts';
import { aliveCount } from './rules.ts';
import type {
  KillerAction,
  KillerConfig,
  KillerEvent,
  KillerLogEntry,
  KillerPlayer,
  KillerState,
} from './types.ts';

const MAX_LOG = 200;

/** Attribue des numéros distincts (1–20) aux joueurs (tirage mélangé). */
function assignNumbers(count: number, rng: () => number): number[] {
  const all = Array.from({ length: 20 }, (_, i) => i + 1);
  for (let i = all.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [all[i], all[j]] = [all[j], all[i]];
  }
  return all.slice(0, count);
}

/** Met les joueurs en prison si la variante l'exige (début de la phase de jeu). */
const applyPrisonStart = (players: KillerPlayer[], config: KillerConfig): KillerPlayer[] =>
  config.entry === 'prison' ? players.map((p) => ({ ...p, inPrison: true })) : players;

export function createGame(config: KillerConfig, rng: () => number = Math.random): KillerState {
  const random = config.numberMode === 'random';
  // En mode aléatoire : numéros tirés et partie lancée. Sinon : numéro 0
  // (non attribué) et phase d'attribution où chaque joueur choisit son numéro.
  const numbers = random ? assignNumbers(config.playerNames.length, rng) : config.playerNames.map(() => 0);
  const players: KillerPlayer[] = config.playerNames.map((name, i) => ({
    name,
    number: numbers[i],
    lives: config.lives,
    maxLives: config.lives,
    isKiller: false,
    inPrison: false,
    dartsThrown: 0,
    kills: 0,
  }));
  return {
    config,
    players: random ? applyPrisonStart(players, config) : players,
    currentPlayer: 0,
    currentVisit: [],
    visitEvents: [],
    phase: random ? 'playing' : 'assigning',
    winner: null,
    log: [],
  };
}

export function reduce(state: KillerState, action: KillerAction): KillerState {
  switch (action.type) {
    case 'dart':
      return state.phase === 'assigning'
        ? assignNumber(state, action.dart)
        : applyDart(state, action.dart);
    case 'restart':
      // Revanche : même configuration (ré-attribution selon le mode).
      return createGame(state.config);
  }
}

/** Phase d'attribution : le joueur courant touche son numéro (segment 1–20, libre). */
function assignNumber(state: KillerState, dart: KillerState['currentVisit'][number]): KillerState {
  if (dart.value < 1 || dart.value > 20) return state; // bull/manqué/invalide ignorés
  if (state.players.some((p, i) => i !== state.currentPlayer && p.number === dart.value)) {
    return state; // numéro déjà pris : on rejoue
  }
  const players = state.players.map((p) => ({ ...p }));
  players[state.currentPlayer].number = dart.value;

  const next = state.currentPlayer + 1;
  if (next < players.length) {
    return { ...state, players, currentPlayer: next };
  }
  // Tous les numéros attribués : la partie commence.
  return {
    ...state,
    players: applyPrisonStart(players, state.config),
    currentPlayer: 0,
    phase: 'playing',
  };
}

const pushLog = (log: KillerLogEntry[], entry: KillerLogEntry): KillerLogEntry[] =>
  [...log, entry].slice(-MAX_LOG);

/** Prochain joueur encore en vie, après `from`. */
function nextAlive(players: KillerPlayer[], from: number): number {
  for (let k = 1; k <= players.length; k++) {
    const idx = (from + k) % players.length;
    if (players[idx].lives > 0) return idx;
  }
  return from;
}

const winnerIndex = (players: KillerPlayer[]): number => players.findIndex((p) => p.lives > 0);

function applyDart(state: KillerState, dart: KillerState['currentVisit'][number]): KillerState {
  if (state.phase !== 'playing' || !isValidDart(dart)) return state;

  const players = state.players.map((p) => ({ ...p }));
  const me = players[state.currentPlayer];
  const cur = state.currentPlayer;
  const visit = [...state.currentVisit, dart];
  const events: KillerEvent[] = [...state.visitEvents];
  const isBull = dart.value === 25;

  me.dartsThrown += 1;

  if (me.inPrison) {
    // En prison : seul le Bull libère.
    if (isBull) {
      me.inPrison = false;
      me.isKiller = true;
      events.push({ kind: 'escape', player: cur });
    }
  } else if (!me.isKiller) {
    // Pas encore tueur : valider l'entrée.
    const entered =
      state.config.entry === 'double'
        ? dart.value === me.number && dart.multiplier === 2
        : isBull; // 'bull'
    if (entered) {
      me.isKiller = true;
      events.push({ kind: 'enter', player: cur });
    }
  } else if (state.config.entry === 'prison' && isBull) {
    // Tueur en mode prison qui refait Bull : tous les autres en prison.
    players.forEach((p, idx) => {
      if (idx !== cur && p.lives > 0) {
        p.inPrison = true;
        p.isKiller = false;
      }
    });
    events.push({ kind: 'jailAll', player: cur });
  } else if (!isBull) {
    // Tueur qui vise un numéro : retire des vies à son propriétaire.
    const tIdx = players.findIndex((p, idx) => idx !== cur && p.number === dart.value && p.lives > 0);
    if (tIdx >= 0) {
      const target = players[tIdx];
      const removed = Math.min(target.lives, dart.multiplier);
      target.lives -= removed;
      events.push({ kind: 'hit', player: cur, target: tIdx, lives: removed });
      if (target.lives === 0) {
        me.kills += 1;
        events.push({ kind: 'eliminate', player: cur, target: tIdx });
        if (state.config.healOnKill) {
          me.lives = me.maxLives;
          events.push({ kind: 'heal', player: cur });
        }
      }
    }
  }

  const progressed: KillerState = { ...state, players, currentVisit: visit, visitEvents: events };

  // Victoire : un seul survivant.
  if (players.length >= 2 && aliveCount(players) === 1) {
    return {
      ...progressed,
      phase: 'matchOver',
      winner: winnerIndex(players),
      currentVisit: [],
      visitEvents: [],
      log: pushLog(state.log, { player: cur, darts: visit, events }),
    };
  }

  if (visit.length === 3) {
    return {
      ...progressed,
      currentPlayer: nextAlive(players, cur),
      currentVisit: [],
      visitEvents: [],
      log: pushLog(state.log, { player: cur, darts: visit, events }),
    };
  }

  return progressed;
}

/** Total des vies retirées par le joueur courant pendant la volée en cours. */
export const visitLivesTaken = (state: KillerState): number =>
  state.visitEvents.reduce((n, e) => n + (e.kind === 'hit' ? e.lives : 0), 0);
