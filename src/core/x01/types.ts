import type { Dart } from '../darts.ts';

export type { Dart, Multiplier } from '../darts.ts';

/** Règle d'entrée : condition pour "ouvrir" son compte et marquer des points. */
export type InRule = 'straight' | 'double' | 'triple' | 'bull';

/** Règle de sortie : fléchette autorisée pour terminer exactement à zéro. */
export type OutRule = 'straight' | 'double' | 'master';

export interface X01Config {
  startScore: 301 | 501;
  inRule: InRule;
  outRule: OutRule;
  /** Nombre de manches (legs) à gagner. Les sets s'ajouteront au-dessus de ce niveau. */
  legsToWin: number;
  playerNames: string[];
}

export interface X01Player {
  name: string;
  score: number;
  /** A ouvert son compte selon la règle d'entrée (toujours vrai en straight in). */
  opened: boolean;
  legsWon: number;
  dartsThrown: number;
  pointsScored: number;
  visits: number;
  highestVisit: number;
  /** Fléchettes lancées alors qu'un finish en 1 fléchette était possible. */
  checkoutAttempts: number;
  checkoutHits: number;
}

export type X01Phase = 'playing' | 'legOver' | 'matchOver';

/** Entrée du journal : une visite terminée (ou gagnante). */
export interface X01LogEntry {
  player: number;
  leg: number;
  darts: Dart[];
  scored: number;
  bust: boolean;
  checkout: boolean;
}

export interface X01State {
  config: X01Config;
  players: X01Player[];
  currentPlayer: number;
  legStarter: number;
  legIndex: number;
  currentVisit: Dart[];
  /** Score et statut d'ouverture en début de visite — restaurés en cas de bust. */
  visitStartScore: number;
  visitStartOpened: boolean;
  phase: X01Phase;
  winner: number | null;
  /** Incrémenté à chaque bust : l'UI déclenche l'animation sur augmentation (undo-safe). */
  bustCount: number;
  /** Journal chronologique borné des visites. */
  log: X01LogEntry[];
}

export type X01Action =
  | { type: 'dart'; dart: Dart }
  | { type: 'nextLeg' }
  | { type: 'restart' };
