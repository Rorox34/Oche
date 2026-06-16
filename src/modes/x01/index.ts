import type { GameModeDefinition } from '../types';
import type { X01Action, X01Config, X01State } from '../../core/x01/types';
import { createGame, reduce } from '../../core/x01/engine';
import { X01Setup } from './X01Setup';
import { X01Game } from './X01Game';

export const x01Mode: GameModeDefinition<X01Config, X01State, X01Action> = {
  id: 'x01',
  name: '301 / 501',
  description: 'Le classique. Descendez à zéro, finissez sur un double.',
  createGame,
  reduce,
  getResult: (state) =>
    state.phase === 'matchOver' && state.winner !== null
      ? { players: state.players.map((p) => p.name), winner: state.winner }
      : null,
  SetupScreen: X01Setup,
  GameScreen: X01Game,
};
