import { isValidDart } from '../darts.ts';
import { buildTargets } from './targets.ts';
import { MARKS_TO_CLOSE, PAR_PER_HOLE, marksFor } from './rules.ts';
import type {
  GolfCricketAction,
  GolfCricketConfig,
  GolfCricketLogEntry,
  GolfCricketPlayer,
  GolfCricketState,
} from './types.ts';

const MAX_LOG = 200;

const createPlayer = (name: string, holes: number): GolfCricketPlayer => ({
  name,
  holeScores: Array.from({ length: holes }, () => -1),
  strokes: 0,
  holeMarks: 0,
  holeDarts: 0,
  dartsThrown: 0,
});

/** Index du joueur au plus petit total de fléchettes (égalité → premier dans l'ordre). */
const leaderIndex = (players: GolfCricketPlayer[]): number =>
  players.reduce((best, p, i) => (p.strokes < players[best].strokes ? i : best), 0);

export function createGame(config: GolfCricketConfig): GolfCricketState {
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

export function reduce(state: GolfCricketState, action: GolfCricketAction): GolfCricketState {
  switch (action.type) {
    case 'dart':
      return applyDart(state, action.dart);
    case 'restart':
      return createGame(state.config);
  }
}

const pushLog = (log: GolfCricketLogEntry[], entry: GolfCricketLogEntry): GolfCricketLogEntry[] =>
  [...log, entry].slice(-MAX_LOG);

/** Prochain joueur qui n'a pas encore fermé le trou courant ; -1 si tous ont fermé. */
function nextUnclosedPlayer(players: GolfCricketPlayer[], round: number, from: number): number {
  const n = players.length;
  for (let step = 1; step <= n; step++) {
    const idx = (from + step) % n;
    if (players[idx].holeScores[round] === -1) return idx;
  }
  return -1;
}

function applyDart(state: GolfCricketState, dart: GolfCricketState['currentVisit'][number]): GolfCricketState {
  if (state.phase !== 'playing' || !isValidDart(dart)) return state;

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

  // La volée se poursuit tant que le joueur n'a ni fermé ni épuisé ses 3 fléchettes.
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

/** Nombre de trous fermés par le joueur. */
export const playedHoles = (player: GolfCricketPlayer): number =>
  player.holeScores.reduce((n, s) => n + (s >= 0 ? 1 : 0), 0);

/** Score relatif au par, sur les trous fermés (négatif = sous le par). */
export const relativeToPar = (player: GolfCricketPlayer): number =>
  player.strokes - playedHoles(player) * PAR_PER_HOLE;
