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
  SetupScreen: ShanghaiSetup,
  GameScreen: ShanghaiGame,
};
