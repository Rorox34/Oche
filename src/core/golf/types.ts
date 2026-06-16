import type { Dart } from '../darts.ts';

export type { Dart, Multiplier } from '../darts.ts';

/** Méthode de score d'un trou. Toute la logique est centralisée dans VARIANTS. */
export type GolfVariant = 'standard' | 'darts';

/** Nombre de trous (= numéros joués, 1…N). */
export type GolfHoles = 9 | 18;

export interface GolfConfig {
  variant: GolfVariant;
  holes: GolfHoles;
  playerNames: string[];
}

export interface GolfPlayer {
  name: string;
  /** Coups par trou, indexés comme state.targets ; -1 = trou pas encore joué. */
  holeScores: number[];
  /** Total des coups (somme des trous joués). */
  strokes: number;
  dartsThrown: number;
}

export type GolfPhase = 'playing' | 'matchOver';

export interface GolfLogEntry {
  player: number;
  /** Numéro du trou joué. */
  hole: number;
  darts: Dart[];
  /** Coups marqués sur ce trou. */
  strokes: number;
}

export interface GolfState {
  config: GolfConfig;
  /** Numéros des trous, dans l'ordre (1…N, figés à la création). */
  targets: number[];
  players: GolfPlayer[];
  currentPlayer: number;
  /** Index du trou courant (0 … targets.length-1). */
  round: number;
  currentVisit: Dart[];
  phase: GolfPhase;
  winner: number | null;
  log: GolfLogEntry[];
}

export type GolfAction = { type: 'dart'; dart: Dart } | { type: 'restart' };
