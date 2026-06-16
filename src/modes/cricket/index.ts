import type { GameModeDefinition } from '../types';
import type { CricketAction, CricketConfig, CricketState } from '../../core/cricket/types';
import { createGame, reduce } from '../../core/cricket/engine';
import { CricketSetup } from './CricketSetup';
import { CricketGame } from './CricketGame';

export const cricketMode: GameModeDefinition<CricketConfig, CricketState, CricketAction> = {
  id: 'cricket',
  name: 'Cricket',
  description: 'Ferme 20 → 15 + Bull · Standard, Cut-Throat ou Sans points',
  createGame: (config) => createGame(config),
  reduce,
  getResult: (state) =>
    state.phase === 'matchOver' && state.winner !== null
      ? { players: state.players.map((p) => p.name), winner: state.winner }
      : null,
  SetupScreen: CricketSetup,
  GameScreen: CricketGame,
};
