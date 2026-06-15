import type { Dart } from '../darts.ts';

export type { Dart, Multiplier } from '../darts.ts';

/** Plage de numéros jouée (= nombre de manches). */
export type ShanghaiRange = '1-7' | '1-10' | '1-20';

/** Ordre de parcours des numéros. */
export type ShanghaiOrderId = 'ascending' | 'random';

export interface ShanghaiConfig {
  range: ShanghaiRange;
  orderId: ShanghaiOrderId;
  /** Réussir Simple + Double + Triple du numéro dans une volée = victoire immédiate. */
  shanghaiWin: boolean;
  playerNames: string[];
}

export interface ShanghaiPlayer {
  name: string;
  score: number;
  dartsThrown: number;
  /** Volées (manches) jouées par ce joueur. */
  visits: number;
}

export type ShanghaiPhase = 'playing' | 'matchOver';

export interface ShanghaiLogEntry {
  player: number;
  /** Numéro visé pendant la manche. */
  target: number;
  darts: Dart[];
  points: number;
  /** La volée a réalisé un Shanghai (S+D+T). */
  shanghai: boolean;
}

export interface ShanghaiState {
  config: ShanghaiConfig;
  /** Numéros des manches, dans l'ordre (figés à la création). */
  targets: number[];
  players: ShanghaiPlayer[];
  currentPlayer: number;
  /** Index de la manche courante (0 … targets.length-1). */
  round: number;
  currentVisit: Dart[];
  /** Points marqués par le joueur courant pendant la volée en cours. */
  visitPoints: number;
  phase: ShanghaiPhase;
  winner: number | null;
  /** La victoire vient-elle d'un Shanghai ? */
  shanghai: boolean;
  log: ShanghaiLogEntry[];
}

export type ShanghaiAction = { type: 'dart'; dart: Dart } | { type: 'restart' };
