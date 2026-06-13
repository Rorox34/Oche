import type { Dart } from '../darts.ts';

export type { Dart, Multiplier } from '../darts.ts';

/** Segments comptant comme touche sur les numéros 1–20. */
export type AtcSegmentRule = 'any' | 'singles' | 'doubles' | 'triples';

/** Ordre de parcours des numéros. */
export type AtcOrderId = 'ascending' | 'descending' | 'random' | 'board';

/** Étape(s) finale(s) sur le bull. */
export type AtcBullRule = 'any' | 'bullseye' | 'outerThenBullseye';

export interface AtcConfig {
  segmentRule: AtcSegmentRule;
  orderId: AtcOrderId;
  bullRule: AtcBullRule;
  /** Touches nécessaires pour valider chaque cible (numéros et bull). */
  hitsPerTarget: 1 | 2 | 3;
  playerNames: string[];
}

/**
 * Une cible du parcours. Union discriminée : les futures variantes
 * (Shanghai, Cricket…) pourront introduire d'autres genres de cibles.
 */
export type AtcTarget =
  | { kind: 'number'; value: number }
  | { kind: 'bull'; accept: 'any' | 'outer' | 'bullseye' };

export interface AtcPlayer {
  name: string;
  /** Index de la cible courante dans state.targets. */
  targetIndex: number;
  /** Progression sur la cible courante (0 … hitsPerTarget-1). */
  hitsOnTarget: number;
  dartsThrown: number;
  /** Fléchettes ayant compté (pour le pourcentage de réussite). */
  hits: number;
  visits: number;
}

export type AtcPhase = 'playing' | 'matchOver';

export interface AtcLogEntry {
  player: number;
  /** Cible au début de la volée. */
  target: string;
  darts: Dart[];
  /** Touches réussies pendant la volée. */
  hits: number;
  finish: boolean;
}

export interface AtcState {
  config: AtcConfig;
  /** Parcours généré à la création (figé : persiste et survit à l'undo). */
  targets: AtcTarget[];
  players: AtcPlayer[];
  currentPlayer: number;
  currentVisit: Dart[];
  visitStartHits: number;
  visitStartTargetIndex: number;
  phase: AtcPhase;
  winner: number | null;
  /** Horodatages (ms epoch) pour le temps de jeu. */
  startedAt: number;
  endedAt: number | null;
  log: AtcLogEntry[];
}

export type AtcAction = { type: 'dart'; dart: Dart } | { type: 'restart' };
