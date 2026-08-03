import { isValidDart } from '../darts.ts';
import { buildTargets } from './targets.ts';
import { MARKS_TO_CLOSE, PAR_PER_HOLE, VARIANTS, marksFor } from './rules.ts';
import type {
  GolfAction,
  GolfConfig,
  GolfLogEntry,
  GolfPlayer,
  GolfState,
} from './types.ts';

const MAX_LOG = 200;

const createPlayer = (name: string, holes: number): GolfPlayer => ({
  name,
  holeScores: Array.from({ length: holes }, () => -1),
  strokes: 0,
  dartsThrown: 0,
  holeMarks: 0,
  holeDarts: 0,
});

/** Index du joueur au plus petit total de coups (égalité → premier dans l'ordre). */
const leaderIndex = (players: GolfPlayer[]): number =>
  players.reduce((best, p, i) => (p.strokes < players[best].strokes ? i : best), 0);

export function createGame(config: GolfConfig): GolfState {
  const targets = buildTargets(config);
  return {
    config,
    targets,
    players: config.playerNames.map((name) => createPlayer(name, targets.length)),
    currentPlayer: 0,
    round: 0,
    currentVisit: [],
    phase: 'playing',
    winner: null,
    log: [],
  };
}

export function reduce(state: GolfState, action: GolfAction): GolfState {
  switch (action.type) {
    case 'dart':
      return applyDart(state, action.dart);
    case 'restart':
      return createGame(state.config);
  }
}

const pushLog = (log: GolfLogEntry[], entry: GolfLogEntry): GolfLogEntry[] =>
  [...log, entry].slice(-MAX_LOG);

function applyDart(state: GolfState, dart: GolfState['currentVisit'][number]): GolfState {
  if (state.phase !== 'playing' || !isValidDart(dart)) return state;
  return state.config.variant === 'cricket' ? applyDartCricket(state, dart) : applyDartFixed(state, dart);
}

/** Standard / Au plus court : volée fixe de 3 fléchettes, scorée une fois complète. */
function applyDartFixed(state: GolfState, dart: GolfState['currentVisit'][number]): GolfState {
  const players = state.players.map((p) => ({ ...p, holeScores: [...p.holeScores] }));
  const player = players[state.currentPlayer];
  const target = state.targets[state.round];
  const visit = [...state.currentVisit, dart];

  player.dartsThrown += 1;
  const progressed: GolfState = { ...state, players, currentVisit: visit };

  // La volée se poursuit tant qu'il reste des fléchettes.
  if (visit.length < 3) return progressed;

  // Trou terminé : on en calcule le score selon la variante.
  const strokes = VARIANTS[state.config.variant].holeScore!(visit, target);
  player.holeScores[state.round] = strokes;
  player.strokes += strokes;

  const entry: GolfLogEntry = {
    player: state.currentPlayer,
    hole: target,
    darts: visit,
    strokes,
  };

  const isLastPlayer = state.currentPlayer === players.length - 1;
  const isLastHole = state.round === state.targets.length - 1;

  // Fin du dernier trou : le plus petit total de coups l'emporte.
  if (isLastPlayer && isLastHole) {
    return {
      ...progressed,
      phase: 'matchOver',
      winner: leaderIndex(players),
      currentVisit: [],
      log: pushLog(state.log, entry),
    };
  }

  // Joueur suivant ; le trou n'avance qu'une fois le dernier joueur passé.
  return {
    ...progressed,
    currentPlayer: (state.currentPlayer + 1) % players.length,
    round: isLastPlayer ? state.round + 1 : state.round,
    currentVisit: [],
    log: pushLog(state.log, entry),
  };
}

/** Prochain joueur qui n'a pas encore fermé le trou courant (Cricket) ; -1 si tous ont fermé. */
function nextUnclosedPlayer(players: GolfPlayer[], round: number, from: number): number {
  const n = players.length;
  for (let step = 1; step <= n; step++) {
    const idx = (from + step) % n;
    if (players[idx].holeScores[round] === -1) return idx;
  }
  return -1;
}

/**
 * Cricket : le trou se ferme en accumulant 3 marques (simple=1, double=2,
 * triple=3), la volée s'arrête dès la fermeture ou après 3 fléchettes, et la
 * main passe au prochain joueur qui n'a pas encore fermé. Le trou n'avance
 * que lorsque tous les joueurs ont fermé.
 */
function applyDartCricket(state: GolfState, dart: GolfState['currentVisit'][number]): GolfState {
  const players = state.players.map((p) => ({ ...p, holeScores: [...p.holeScores] }));
  const player = players[state.currentPlayer];
  const target = state.targets[state.round];
  const visit = [...state.currentVisit, dart];

  const gain = marksFor(dart, target);
  const before = player.holeMarks;
  player.holeMarks = Math.min(MARKS_TO_CLOSE, before + gain);
  player.holeDarts += 1;
  player.dartsThrown += 1;

  const closedNow = before < MARKS_TO_CLOSE && player.holeMarks >= MARKS_TO_CLOSE;
  const turnOver = visit.length === 3 || closedNow;

  if (!turnOver) {
    return { ...state, players, currentVisit: visit };
  }

  let strokes: number | null = null;
  if (closedNow) {
    strokes = player.holeDarts;
    player.holeScores[state.round] = strokes;
    player.strokes += strokes;
  }

  const log = pushLog(state.log, { player: state.currentPlayer, hole: target, darts: visit, strokes });
  const holeComplete = players.every((p) => p.holeScores[state.round] !== -1);

  if (holeComplete) {
    const isLastHole = state.round === state.targets.length - 1;
    if (isLastHole) {
      return {
        ...state,
        players,
        currentVisit: [],
        phase: 'matchOver',
        winner: leaderIndex(players),
        log,
      };
    }

    // Trou suivant : marques et compteur de fléchettes remis à zéro pour tous.
    for (const p of players) {
      p.holeMarks = 0;
      p.holeDarts = 0;
    }
    return {
      ...state,
      players,
      round: state.round + 1,
      currentPlayer: (state.currentPlayer + 1) % players.length,
      currentVisit: [],
      log,
    };
  }

  // On attend les autres : la main passe au prochain joueur qui n'a pas encore fermé.
  const next = nextUnclosedPlayer(players, state.round, state.currentPlayer);
  return {
    ...state,
    players,
    currentPlayer: next === -1 ? state.currentPlayer : next,
    currentVisit: [],
    log,
  };
}

/** Nombre de trous joués par le joueur. */
export const playedHoles = (player: GolfPlayer): number =>
  player.holeScores.reduce((n, s) => n + (s >= 0 ? 1 : 0), 0);

/** Score relatif au par (négatif = sous le par), sur les trous joués. */
export const relativeToPar = (player: GolfPlayer): number =>
  player.strokes - playedHoles(player) * PAR_PER_HOLE;
