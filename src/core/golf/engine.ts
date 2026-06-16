import { isValidDart } from '../darts.ts';
import { buildTargets } from './targets.ts';
import { PAR_PER_HOLE, VARIANTS } from './rules.ts';
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

  const players = state.players.map((p) => ({ ...p, holeScores: [...p.holeScores] }));
  const player = players[state.currentPlayer];
  const target = state.targets[state.round];
  const visit = [...state.currentVisit, dart];

  player.dartsThrown += 1;
  const progressed: GolfState = { ...state, players, currentVisit: visit };

  // La volée se poursuit tant qu'il reste des fléchettes.
  if (visit.length < 3) return progressed;

  // Trou terminé : on en calcule le score selon la variante.
  const strokes = VARIANTS[state.config.variant].holeScore(visit, target);
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

/** Nombre de trous joués par le joueur. */
export const playedHoles = (player: GolfPlayer): number =>
  player.holeScores.reduce((n, s) => n + (s >= 0 ? 1 : 0), 0);

/** Score relatif au par (négatif = sous le par), sur les trous joués. */
export const relativeToPar = (player: GolfPlayer): number =>
  player.strokes - playedHoles(player) * PAR_PER_HOLE;
