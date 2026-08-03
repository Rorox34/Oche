import type { GameModeDefinition } from '../types';
import type {
  SteeplechaseAction,
  SteeplechaseConfig,
  SteeplechaseState,
} from '../../core/steeplechase/types';
import { createGame, reduce } from '../../core/steeplechase/engine';
import { SteeplechaseSetup } from './SteeplechaseSetup';
import { SteeplechaseGame } from './SteeplechaseGame';

export const steeplechaseMode: GameModeDefinition<SteeplechaseConfig, SteeplechaseState, SteeplechaseAction> = {
  id: 'steeplechase',
  name: 'Steeplechase',
  description: 'Course 1 → 20 (+ Bull) · les haies se franchissent en simple/double/triple · gare aux chutes',
  createGame: (config) => createGame(config),
  reduce,
  getResult: (state) =>
    state.phase === 'matchOver' && state.winner !== null
      ? { players: state.players.map((p) => p.name), winner: state.winner }
      : null,
  SetupScreen: SteeplechaseSetup,
  GameScreen: SteeplechaseGame,
};
