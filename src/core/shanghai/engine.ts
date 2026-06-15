import { isValidDart } from '../darts.ts';
import { buildTargets } from './targets.ts';
import { isShanghai, scoreFor } from './rules.ts';
import type {
  ShanghaiAction,
  ShanghaiConfig,
  ShanghaiLogEntry,
  ShanghaiPlayer,
  ShanghaiState,
} from './types.ts';

const MAX_LOG = 200;

const createPlayer = (name: string): ShanghaiPlayer => ({
  name,
  score: 0,
  dartsThrown: 0,
  visits: 0,
});

/** Index du joueur au plus haut score (égalité → premier dans l'ordre de jeu). */
const leaderIndex = (players: ShanghaiPlayer[]): number =>
  players.reduce((best, p, i) => (p.score > players[best].score ? i : best), 0);

export function createGame(config: ShanghaiConfig, rng: () => number = Math.random): ShanghaiState {
  return {
    config,
    targets: buildTargets(config, rng),
    players: config.playerNames.map(createPlayer),
    currentPlayer: 0,
    round: 0,
    currentVisit: [],
    visitPoints: 0,
    phase: 'playing',
    winner: null,
    shanghai: false,
    log: [],
  };
}

export function reduce(state: ShanghaiState, action: ShanghaiAction): ShanghaiState {
  switch (action.type) {
    case 'dart':
      return applyDart(state, action.dart);
    case 'restart':
      // Revanche : même configuration, nouveau tirage si l'ordre est aléatoire.
      return createGame(state.config);
  }
}

const pushLog = (log: ShanghaiLogEntry[], entry: ShanghaiLogEntry): ShanghaiLogEntry[] =>
  [...log, entry].slice(-MAX_LOG);

function applyDart(state: ShanghaiState, dart: ShanghaiState['currentVisit'][number]): ShanghaiState {
  if (state.phase !== 'playing' || !isValidDart(dart)) return state;

  const players = state.players.map((p) => ({ ...p }));
  const player = players[state.currentPlayer];
  const target = state.targets[state.round];
  const visit = [...state.currentVisit, dart];

  player.dartsThrown += 1;
  const points = scoreFor(dart, target);
  player.score += points;
  const visitPoints = state.visitPoints + points;

  const progressed: ShanghaiState = { ...state, players, currentVisit: visit, visitPoints };

  // La volée se poursuit tant qu'il reste des fléchettes.
  if (visit.length < 3) return progressed;

  player.visits += 1;
  const shanghai = state.config.shanghaiWin && isShanghai(visit, target);
  const entry: ShanghaiLogEntry = {
    player: state.currentPlayer,
    target,
    darts: visit,
    points: visitPoints,
    shanghai,
  };

  // Shanghai : victoire immédiate.
  if (shanghai) {
    return {
      ...progressed,
      phase: 'matchOver',
      winner: state.currentPlayer,
      shanghai: true,
      log: pushLog(state.log, entry),
    };
  }

  const isLastPlayer = state.currentPlayer === players.length - 1;
  const isLastRound = state.round === state.targets.length - 1;

  // Fin de la dernière manche : le meilleur score l'emporte.
  if (isLastPlayer && isLastRound) {
    return {
      ...progressed,
      phase: 'matchOver',
      winner: leaderIndex(players),
      currentVisit: [],
      visitPoints: 0,
      log: pushLog(state.log, entry),
    };
  }

  // Joueur suivant ; la manche n'avance qu'une fois le dernier joueur passé.
  return {
    ...progressed,
    currentPlayer: (state.currentPlayer + 1) % players.length,
    round: isLastPlayer ? state.round + 1 : state.round,
    currentVisit: [],
    visitPoints: 0,
    log: pushLog(state.log, entry),
  };
}

/** Points par fléchette, ou null avant le premier lancer. */
export const pointsPerDart = (player: ShanghaiPlayer): number | null =>
  player.dartsThrown === 0 ? null : player.score / player.dartsThrown;
