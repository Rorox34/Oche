import type { Dart } from '../darts.ts';

export type { Dart, Multiplier } from '../darts.ts';

export interface SteeplechaseConfig {
  /** Termine le parcours sur le Bull après le 20. */
  finalBull: boolean;
  playerNames: string[];
}

/** Une haie du parcours : les numéros 1–20, puis éventuellement le Bull. */
export type SteeplechaseTarget = { kind: 'number'; value: number } | { kind: 'bull' };

export interface SteeplechasePlayer {
  name: string;
  /** Index de la haie courante dans state.targets (0 = première haie). */
  hurdleIndex: number;
  dartsThrown: number;
  /** Fléchettes ayant touché leur haie (pour le pourcentage de réussite). */
  hits: number;
  visits: number;
  /** Volées totalement manquées : le cheval chute et recule d'une haie. */
  falls: number;
}

export type SteeplechasePhase = 'playing' | 'matchOver';

export interface SteeplechaseLogEntry {
  player: number;
  /** Haie visée au début de la volée. */
  target: string;
  darts: Dart[];
  /** Haies franchies pendant la volée ; négatif (-1) en cas de chute. */
  advance: number;
  finish: boolean;
}

export interface SteeplechaseState {
  config: SteeplechaseConfig;
  /** Parcours figé à la création : 1 → 20 (+ Bull). */
  targets: SteeplechaseTarget[];
  players: SteeplechasePlayer[];
  currentPlayer: number;
  currentVisit: Dart[];
  /** Haie du joueur courant au début de sa volée (référence pour l'affichage en direct). */
  visitStartHurdle: number;
  phase: SteeplechasePhase;
  winner: number | null;
  log: SteeplechaseLogEntry[];
}

export type SteeplechaseAction = { type: 'dart'; dart: Dart } | { type: 'restart' };
