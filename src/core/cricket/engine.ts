import { isValidDart } from '../darts.ts';
import { buildTargets } from './targets.ts';
import { MARKS_TO_CLOSE, VARIANTS, marksFor, targetValue } from './rules.ts';
import type {
  CricketAction,
  CricketConfig,
  CricketLogEntry,
  CricketPlayer,
  CricketState,
} from './types.ts';

const MAX_LOG = 200;

const createPlayer = (name: string, targetCount: number): CricketPlayer => ({
  name,
  marks: Array.from({ length: targetCount }, () => 0),
  score: 0,
  dartsThrown: 0,
  visits: 0,
  totalMarks: 0,
});

export function createGame(config: CricketConfig): CricketState {
  const targets = buildTargets(config);
  return {
    config,
    targets,
    players: config.playerNames.map((name) => createPlayer(name, targets.length)),
    currentPlayer: 0,
    currentVisit: [],
    visitStartMarks: 0,
    visitPoints: 0,
    phase: 'playing',
    winner: null,
    log: [],
  };
}

export function reduce(state: CricketState, action: CricketAction): CricketState {
  switch (action.type) {
    case 'dart':
      return applyDart(state, action.dart);
    case 'restart':
      // Revanche : même configuration, état remis à zéro.
      return createGame(state.config);
  }
}

const pushLog = (log: CricketLogEntry[], entry: CricketLogEntry): CricketLogEntry[] =>
  [...log, entry].slice(-MAX_LOG);

const visitEntry = (state: CricketState, player: CricketPlayer, finish: boolean): CricketLogEntry => ({
  player: state.currentPlayer,
  darts: state.currentVisit,
  marks: player.totalMarks - state.visitStartMarks,
  points: state.visitPoints,
  finish,
});

function applyDart(state: CricketState, dart: CricketState['currentVisit'][number]): CricketState {
  if (state.phase !== 'playing' || !isValidDart(dart)) return state;

  const players = state.players.map((p) => ({ ...p, marks: [...p.marks] }));
  const player = players[state.currentPlayer];
  const visit = [...state.currentVisit, dart];
  const spec = VARIANTS[state.config.variant];

  player.dartsThrown += 1;

  let visitPoints = state.visitPoints;

  // Une fléchette ne touche qu'une cible : on s'arrête au premier match.
  for (let i = 0; i < state.targets.length; i++) {
    const m = marksFor(dart, state.targets[i]);
    if (m === 0) continue;

    const before = player.marks[i];
    const after = Math.min(before + m, MARKS_TO_CLOSE);
    const closingMarks = after - before; // marques consommées pour fermer
    const scoringMarks = m - closingMarks; // marques excédentaires (peuvent scorer)
    player.marks[i] = after;
    player.totalMarks += m;

    if (scoringMarks > 0) {
      visitPoints += spec.distribute(players, state.currentPlayer, i, targetValue(state.targets[i]), scoringMarks);
    }
    break;
  }

  const closedAll = player.marks.every((mk) => mk >= MARKS_TO_CLOSE);
  const won = closedAll && spec.hasWon(players, state.currentPlayer);

  const progressed: CricketState = { ...state, players, currentVisit: visit, visitPoints };

  if (won) {
    player.visits += 1;
    return {
      ...progressed,
      phase: 'matchOver',
      winner: state.currentPlayer,
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
      visitStartMarks: players[next].totalMarks,
      visitPoints: 0,
      log: pushLog(state.log, visitEntry(progressed, player, false)),
    };
  }

  return progressed;
}

/** Marques par tour (3 fléchettes), ou null avant le premier lancer. */
export const mpr = (player: CricketPlayer): number | null =>
  player.dartsThrown === 0 ? null : (player.totalMarks / player.dartsThrown) * 3;

/** Nombre de cibles fermées par le joueur. */
export const closedCount = (player: CricketPlayer): number =>
  player.marks.reduce((n, mk) => n + (mk >= MARKS_TO_CLOSE ? 1 : 0), 0);
