import type { Dart } from '../darts.ts';

export type { Dart, Multiplier } from '../darts.ts';

/** Nombre de trous (= numéros joués, 1…N). */
export type GolfCricketHoles = 9 | 18;

export interface GolfCricketConfig {
  holes: GolfCricketHoles;
  playerNames: string[];
}

export interface GolfCricketPlayer {
  name: string;
  /** Fléchettes utilisées pour fermer chaque trou ; -1 = trou pas encore fermé. */
  holeScores: number[];
  /** Total des fléchettes sur les trous fermés (score à minimiser). */
  strokes: number;
  /** Marques (0–3) accumulées sur le trou courant. */
  holeMarks: number;
  /** Fléchettes déjà lancées sur le trou courant, toutes volées confondues. */
  holeDarts: number;
  dartsThrown: number;
}

export type GolfCricketPhase = 'playing' | 'matchOver';

export interface GolfCricketLogEntry {
  player: number;
  /** Numéro du trou visé. */
  hole: number;
  darts: Dart[];
  /** Fléchettes totales utilisées si le trou est fermé sur cette volée, sinon null. */
  strokes: number | null;
}

export interface GolfCricketState {
  config: GolfCricketConfig;
  /** Numéros des trous, dans l'ordre (1…N, figés à la création). */
  targets: number[];
  players: GolfCricketPlayer[];
  currentPlayer: number;
  /** Index du trou courant (0 … targets.length-1). */
  round: number;
  currentVisit: Dart[];
  phase: GolfCricketPhase;
  winner: number | null;
  log: GolfCricketLogEntry[];
}

export type GolfCricketAction = { type: 'dart'; dart: Dart } | { type: 'restart' };
