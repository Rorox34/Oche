import type { GameModeDefinition } from '../types';
import type { GolfAction, GolfConfig, GolfState } from '../../core/golf/types';
import { createGame, reduce } from '../../core/golf/engine';
import { GolfSetup } from './GolfSetup';
import { GolfGame } from './GolfGame';

export const golfMode: GameModeDefinition<GolfConfig, GolfState, GolfAction> = {
  id: 'golf',
  name: 'Golf',
  description: '9 ou 18 trous · score le plus bas · Standard ou Au plus court',
  createGame: (config) => createGame(config),
  reduce,
  SetupScreen: GolfSetup,
  GameScreen: GolfGame,
};
