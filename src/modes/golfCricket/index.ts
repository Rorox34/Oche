import type { GameModeDefinition } from '../types';
import type { GolfCricketAction, GolfCricketConfig, GolfCricketState } from '../../core/golfCricket/types';
import { createGame, reduce } from '../../core/golfCricket/engine';
import { GolfCricketSetup } from './GolfCricketSetup';
import { GolfCricketGame } from './GolfCricketGame';

export const golfCricketMode: GameModeDefinition<GolfCricketConfig, GolfCricketState, GolfCricketAction> = {
  id: 'golfCricket',
  name: 'Golf Cricket',
  description: '9 ou 18 trous · fermez chaque trou en 3 marques · le plus rapide gagne',
  createGame: (config) => createGame(config),
  reduce,
  getResult: (state) =>
    state.phase === 'matchOver' && state.winner !== null
      ? { players: state.players.map((p) => p.name), winner: state.winner }
      : null,
  SetupScreen: GolfCricketSetup,
  GameScreen: GolfCricketGame,
};
