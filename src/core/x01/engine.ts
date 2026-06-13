import type { Dart, X01Action, X01Config, X01LogEntry, X01Player, X01State } from './types.ts';
import { canFinishWith, dartScore, finishingDarts, isValidDart, satisfiesIn } from './rules.ts';

export { dartScore, isValidDart };

const MAX_LOG = 200;

const createPlayer = (name: string, config: X01Config): X01Player => ({
  name,
  score: config.startScore,
  opened: config.inRule === 'straight',
  legsWon: 0,
  dartsThrown: 0,
  pointsScored: 0,
  visits: 0,
  highestVisit: 0,
  checkoutAttempts: 0,
  checkoutHits: 0,
});

export function createGame(config: X01Config): X01State {
  return {
    config,
    players: config.playerNames.map((name) => createPlayer(name, config)),
    currentPlayer: 0,
    legStarter: 0,
    legIndex: 1,
    currentVisit: [],
    visitStartScore: config.startScore,
    visitStartOpened: config.inRule === 'straight',
    phase: 'playing',
    winner: null,
    bustCount: 0,
    log: [],
  };
}

export function reduce(state: X01State, action: X01Action): X01State {
  switch (action.type) {
    case 'dart':
      return applyDart(state, action.dart);
    case 'nextLeg':
      return startNextLeg(state);
    case 'restart':
      return createGame(state.config);
  }
}

const pushLog = (log: X01LogEntry[], entry: X01LogEntry): X01LogEntry[] =>
  [...log, entry].slice(-MAX_LOG);

function applyDart(state: X01State, dart: Dart): X01State {
  if (state.phase !== 'playing' || !isValidDart(dart)) return state;

  const { inRule, outRule } = state.config;
  const players = state.players.map((p) => ({ ...p }));
  const player = players[state.currentPlayer];
  const visit = [...state.currentVisit, dart];
  const wasOpened = player.opened;
  const scoreBefore = player.score;

  player.dartsThrown += 1;

  // Tentative de checkout : fléchette lancée alors qu'un finish direct existait.
  if (wasOpened && finishingDarts(scoreBefore, outRule).length > 0) {
    player.checkoutAttempts += 1;
  }

  // Ouverture du compte : une fléchette non qualifiante ne marque aucun point.
  let scored = 0;
  if (wasOpened) {
    scored = dartScore(dart);
  } else if (satisfiesIn(dart, inRule)) {
    player.opened = true;
    scored = dartScore(dart);
  }

  const newScore = scoreBefore - scored;
  const finishes = canFinishWith(dart, outRule);
  const isCheckout = scored > 0 && newScore === 0 && finishes;
  const isBust =
    newScore < 0 ||
    (outRule !== 'straight' && (newScore === 1 || (newScore === 0 && !finishes)));

  if (isBust) {
    // Visite annulée : score ET statut d'ouverture restaurés.
    player.score = state.visitStartScore;
    player.opened = state.visitStartOpened;
    return endVisit(
      { ...state, players, currentVisit: visit, bustCount: state.bustCount + 1 },
      visit,
      true,
    );
  }

  player.score = newScore;

  if (isCheckout) {
    player.checkoutHits += 1;
    player.legsWon += 1;
    const scoredVisit = state.visitStartScore;
    player.pointsScored += scoredVisit;
    player.visits += 1;
    if (scoredVisit > player.highestVisit) player.highestVisit = scoredVisit;
    const matchOver = player.legsWon >= state.config.legsToWin;
    return {
      ...state,
      players,
      currentVisit: visit,
      log: pushLog(state.log, {
        player: state.currentPlayer,
        leg: state.legIndex,
        darts: visit,
        scored: scoredVisit,
        bust: false,
        checkout: true,
      }),
      phase: matchOver ? 'matchOver' : 'legOver',
      winner: state.currentPlayer,
    };
  }

  if (visit.length === 3) {
    return endVisit({ ...state, players, currentVisit: visit }, visit, false);
  }

  return { ...state, players, currentVisit: visit };
}

function endVisit(state: X01State, visit: Dart[], bust: boolean): X01State {
  const players = state.players.map((p) => ({ ...p }));
  const player = players[state.currentPlayer];
  // Une visite bust rapporte 0 point (le score ayant été restauré, le delta est nul).
  const scored = state.visitStartScore - player.score;
  player.pointsScored += scored;
  player.visits += 1;
  if (scored > player.highestVisit) player.highestVisit = scored;

  const next = (state.currentPlayer + 1) % players.length;
  return {
    ...state,
    players,
    currentPlayer: next,
    currentVisit: [],
    visitStartScore: players[next].score,
    visitStartOpened: players[next].opened,
    log: pushLog(state.log, {
      player: state.currentPlayer,
      leg: state.legIndex,
      darts: visit,
      scored,
      bust,
      checkout: false,
    }),
  };
}

function startNextLeg(state: X01State): X01State {
  if (state.phase !== 'legOver') return state;
  const starter = (state.legStarter + 1) % state.players.length;
  const opened = state.config.inRule === 'straight';
  return {
    ...state,
    players: state.players.map((p) => ({ ...p, score: state.config.startScore, opened })),
    currentPlayer: starter,
    legStarter: starter,
    legIndex: state.legIndex + 1,
    currentVisit: [],
    visitStartScore: state.config.startScore,
    visitStartOpened: opened,
    phase: 'playing',
    winner: null,
  };
}

/** Moyenne par volée de 3 — basée sur les fléchettes réellement lancées. */
export const average3Darts = (player: X01Player): number =>
  player.dartsThrown === 0 ? 0 : (player.pointsScored / player.dartsThrown) * 3;

/** Pourcentage de checkout, ou null si aucune tentative. */
export const checkoutRate = (player: X01Player): number | null =>
  player.checkoutAttempts === 0
    ? null
    : Math.round((player.checkoutHits / player.checkoutAttempts) * 100);
