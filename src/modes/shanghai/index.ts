import type { GameModeDefinition } from '../types';
import type { ShanghaiAction, ShanghaiConfig, ShanghaiState } from '../../core/shanghai/types';
import { createGame, reduce } from '../../core/shanghai/engine';
import { ShanghaiSetup } from './ShanghaiSetup';
import { ShanghaiGame } from './ShanghaiGame';

export const shanghaiMode: GameModeDefinition<ShanghaiConfig, ShanghaiState, ShanghaiAction> = {
  id: 'shanghai',
  name: 'Shanghai',
  description: 'Une manche par numéro · S+D+T = victoire immédiate',
  createGame: (config) => createGame(config),
  reduce,
  getResult: (state) =>
    state.phase === 'matchOver' && state.winner !== null
      ? { players: state.players.map((p) => p.name), winner: state.winner }
      : null,
  SetupScreen: ShanghaiSetup,
  GameScreen: ShanghaiGame,
};
