import type { Dart } from '../darts.ts';

export type { Dart, Multiplier } from '../darts.ts';

/**
 * Variante de Cricket. N'influe que sur la circulation des points et la
 * condition de victoire — toute la logique correspondante est centralisée
 * dans `VARIANTS` (rules.ts). Ajouter une variante = une entrée là-bas.
 */
export type CricketVariant = 'standard' | 'cutthroat' | 'no-score';

/**
 * Cible Cricket. Union discriminée : les futures variantes (Tactics avec
 * doubles/triples, Cricket aléatoire…) pourront introduire d'autres genres
 * de cibles sans changer les appelants.
 */
export type CricketTarget = { kind: 'number'; value: number } | { kind: 'bull' };

export interface CricketConfig {
  variant: CricketVariant;
  playerNames: string[];
}

export interface CricketPlayer {
  name: string;
  /** Marques par cible (0 … MARKS_TO_CLOSE), indexées comme state.targets. */
  marks: number[];
  score: number;
  dartsThrown: number;
  visits: number;
  /** Total des marques posées sur cible (pour le MPR — marques par tour). */
  totalMarks: number;
}

export type CricketPhase = 'playing' | 'matchOver';

export interface CricketLogEntry {
  player: number;
  darts: Dart[];
  /** Marques posées pendant la volée. */
  marks: number;
  /** Points générés pendant la volée (vers soi ou les adversaires selon la variante). */
  points: number;
  finish: boolean;
}

export interface CricketState {
  config: CricketConfig;
  /** Cibles figées (ordre d'affichage), créées au lancement. */
  targets: CricketTarget[];
  players: CricketPlayer[];
  currentPlayer: number;
  currentVisit: Dart[];
  /** `totalMarks` du joueur courant au début de la volée (journal + undo). */
  visitStartMarks: number;
  /** Points générés par le joueur courant pendant la volée en cours. */
  visitPoints: number;
  phase: CricketPhase;
  winner: number | null;
  log: CricketLogEntry[];
}

export type CricketAction = { type: 'dart'; dart: Dart } | { type: 'restart' };
