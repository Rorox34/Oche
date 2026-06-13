import { isValidDart } from '../darts.ts';
import { buildTargets } from './order.ts';
import { countsForTarget } from './rules.ts';
import { formatTarget } from './format.ts';
import type { AtcAction, AtcConfig, AtcLogEntry, AtcPlayer, AtcState } from './types.ts';

const MAX_LOG = 200;

const createPlayer = (name: string): AtcPlayer => ({
  name,
  targetIndex: 0,
  hitsOnTarget: 0,
  dartsThrown: 0,
  hits: 0,
  visits: 0,
});

/**
 * `rng` et `now` sont injectables pour les tests. Le réducteur lui-même
 * n'utilise l'horloge qu'au lancer gagnant (endedAt) — impureté assumée et
 * sans effet sur l'undo, les snapshots portant les horodatages.
 */
export function createGame(
  config: AtcConfig,
  rng: () => number = Math.random,
  now: () => number = Date.now,
): AtcState {
  return {
    config,
    targets: buildTargets(config, rng),
    players: config.playerNames.map(createPlayer),
    currentPlayer: 0,
    currentVisit: [],
    visitStartHits: 0,
    visitStartTargetIndex: 0,
    phase: 'playing',
    winner: null,
    startedAt: now(),
    endedAt: null,
    log: [],
  };
}

export function reduce(state: AtcState, action: AtcAction): AtcState {
  switch (action.type) {
    case 'dart':
      return applyDart(state, action.dart);
    case 'restart':
      // Revanche : même configuration, nouveau parcours (re-tirage si aléatoire).
      return createGame(state.config);
  }
}

const pushLog = (log: AtcLogEntry[], entry: AtcLogEntry): AtcLogEntry[] =>
  [...log, entry].slice(-MAX_LOG);

const visitEntry = (state: AtcState, player: AtcPlayer, finish: boolean): AtcLogEntry => ({
  player: state.currentPlayer,
  target: formatTarget(state.targets[state.visitStartTargetIndex]),
  darts: state.currentVisit,
  hits: player.hits - state.visitStartHits,
  finish,
});

function applyDart(state: AtcState, dart: AtcState['currentVisit'][number]): AtcState {
  if (state.phase !== 'playing' || !isValidDart(dart)) return state;

  const players = state.players.map((p) => ({ ...p }));
  const player = players[state.currentPlayer];
  const visit = [...state.currentVisit, dart];

  player.dartsThrown += 1;

  let won = false;
  if (countsForTarget(dart, state.targets[player.targetIndex], state.config.segmentRule)) {
    player.hits += 1;
    player.hitsOnTarget += 1;
    if (player.hitsOnTarget >= state.config.hitsPerTarget) {
      player.targetIndex += 1;
      player.hitsOnTarget = 0;
      won = player.targetIndex >= state.targets.length;
    }
  }

  const progressed = { ...state, players, currentVisit: visit };

  if (won) {
    player.visits += 1;
    return {
      ...progressed,
      phase: 'matchOver',
      winner: state.currentPlayer,
      endedAt: Date.now(),
      log: pushLog(state.log, visitEntry(progressed, player, true)),
    };
  }

  if (visit.length === 3) {
    player.visits += 1;
    const next = (state.currentPlayer + 1) % players.length;
    return {
      ...progressed,
      currentPlayer: next,
      currentVisit: [],
      visitStartHits: players[next].hits,
      visitStartTargetIndex: players[next].targetIndex,
      log: pushLog(state.log, visitEntry(progressed, player, false)),
    };
  }

  return progressed;
}

/** Pourcentage de fléchettes réussies, ou null avant le premier lancer. */
export const hitRate = (player: AtcPlayer): number | null =>
  player.dartsThrown === 0 ? null : Math.round((player.hits / player.dartsThrown) * 100);
