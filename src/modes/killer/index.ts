import type { GameModeDefinition } from '../types';
import type { KillerAction, KillerConfig, KillerState } from '../../core/killer/types';
import { createGame, reduce } from '../../core/killer/engine';
import { KillerSetup } from './KillerSetup';
import { KillerGame } from './KillerGame';

export const killerMode: GameModeDefinition<KillerConfig, KillerState, KillerAction> = {
  id: 'killer',
  name: 'Killer',
  description: 'Numéro perso + vies · entrée Bull/Double/Prison · dernier survivant',
  createGame: (config) => createGame(config),
  reduce,
  SetupScreen: KillerSetup,
  GameScreen: KillerGame,
};
