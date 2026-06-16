import type { Dart } from '../darts.ts';

export type { Dart, Multiplier } from '../darts.ts';

/**
 * Façon de devenir « tueur » (= de pouvoir attaquer) :
 * - `bull`   : toucher 25 ou 50.
 * - `double` : toucher le double de son propre numéro.
 * - `prison` : on commence enfermé ; 25/50 pour sortir ; un tueur qui refait
 *              25/50 renvoie tous les autres en prison.
 */
export type KillerEntry = 'bull' | 'double' | 'prison';

export interface KillerConfig {
  /** Vies au départ. */
  lives: number;
  entry: KillerEntry;
  /** Éliminer un adversaire restaure toutes ses propres vies. */
  healOnKill: boolean;
  playerNames: string[];
}

export interface KillerPlayer {
  name: string;
  /** Numéro personnel (1–20), attribué au lancement. Les autres l'attaquent dessus. */
  number: number;
  lives: number;
  maxLives: number;
  /** Peut attaquer (a validé son entrée / est sorti de prison). */
  isKiller: boolean;
  /** Mode prison : actuellement enfermé. */
  inPrison: boolean;
  dartsThrown: number;
  kills: number;
}

export type KillerPhase = 'playing' | 'matchOver';

/** Évènements d'une volée (structurés : la mise en forme est dans format.ts). */
export type KillerEvent =
  | { kind: 'enter'; player: number }
  | { kind: 'escape'; player: number }
  | { kind: 'jailAll'; player: number }
  | { kind: 'hit'; player: number; target: number; lives: number }
  | { kind: 'eliminate'; player: number; target: number }
  | { kind: 'heal'; player: number };

export interface KillerLogEntry {
  player: number;
  darts: Dart[];
  events: KillerEvent[];
}

export interface KillerState {
  config: KillerConfig;
  players: KillerPlayer[];
  currentPlayer: number;
  currentVisit: Dart[];
  /** Évènements accumulés pendant la volée en cours (journal + undo). */
  visitEvents: KillerEvent[];
  phase: KillerPhase;
  winner: number | null;
  log: KillerLogEntry[];
}

export type KillerAction = { type: 'dart'; dart: Dart } | { type: 'restart' };
