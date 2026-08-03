import { isValidDart } from '../darts.ts';
import { buildTargets } from './targets.ts';
import { hurdlesFor } from './rules.ts';
import { formatTarget } from './format.ts';
import type {
  SteeplechaseAction,
  SteeplechaseConfig,
  SteeplechaseLogEntry,
  SteeplechasePlayer,
  SteeplechaseState,
} from './types.ts';

const MAX_LOG = 200;

const createPlayer = (name: string): SteeplechasePlayer => ({
  name,
  hurdleIndex: 0,
  dartsThrown: 0,
  hits: 0,
  visits: 0,
  falls: 0,
});

export function createGame(config: SteeplechaseConfig): SteeplechaseState {
  return {
    config,
    targets: buildTargets(config),
    players: config.playerNames.map(createPlayer),
    currentPlayer: 0,
    currentVisit: [],
    visitStartHurdle: 0,
    phase: 'playing',
    winner: null,
    log: [],
  };
}

export function reduce(state: SteeplechaseState, action: SteeplechaseAction): SteeplechaseState {
  switch (action.type) {
    case 'dart':
      return applyDart(state, action.dart);
    case 'restart':
      // Revanche : même configuration, parcours et chevaux remis au départ.
      return createGame(state.config);
  }
}

const pushLog = (log: SteeplechaseLogEntry[], entry: SteeplechaseLogEntry): SteeplechaseLogEntry[] =>
  [...log, entry].slice(-MAX_LOG);

function applyDart(state: SteeplechaseState, dart: SteeplechaseState['currentVisit'][number]): SteeplechaseState {
  if (state.phase !== 'playing' || !isValidDart(dart)) return state;

  const players = state.players.map((p) => ({ ...p }));
  const player = players[state.currentPlayer];
  const visit = [...state.currentVisit, dart];

  player.dartsThrown += 1;

  const target = state.targets[player.hurdleIndex];
  const cleared = target ? hurdlesFor(dart, target) : 0;

  if (cleared > 0) {
    player.hits += 1;
    const remaining = state.targets.length - player.hurdleIndex;
    player.hurdleIndex += Math.min(cleared, remaining);
  }

  const won = player.hurdleIndex >= state.targets.length;
  const progressed = { ...state, players, currentVisit: visit };

  if (won) {
    player.visits += 1;
    return {
      ...progressed,
      phase: 'matchOver',
      winner: state.currentPlayer,
      log: pushLog(state.log, {
        player: state.currentPlayer,
        target: formatTarget(state.targets[state.visitStartHurdle]),
        darts: visit,
        advance: player.hurdleIndex - state.visitStartHurdle,
        finish: true,
      }),
    };
  }

  if (visit.length === 3) {
    player.visits += 1;

    // Chute : la volée entière n'a fait franchir aucune haie → recul d'une haie.
    let advance = player.hurdleIndex - state.visitStartHurdle;
    if (advance === 0 && player.hurdleIndex > 0) {
      player.hurdleIndex -= 1;
      player.falls += 1;
      advance = -1;
    }

    const entry: SteeplechaseLogEntry = {
      player: state.currentPlayer,
      target: formatTarget(state.targets[state.visitStartHurdle]),
      darts: visit,
      advance,
      finish: false,
    };

    const next = (state.currentPlayer + 1) % players.length;
    return {
      ...progressed,
      currentPlayer: next,
      currentVisit: [],
      visitStartHurdle: players[next].hurdleIndex,
      log: pushLog(state.log, entry),
    };
  }

  return progressed;
}

/** Pourcentage de fléchettes ayant touché leur haie, ou null avant le premier lancer. */
export const hitRate = (player: SteeplechasePlayer): number | null =>
  player.dartsThrown === 0 ? null : Math.round((player.hits / player.dartsThrown) * 100);
