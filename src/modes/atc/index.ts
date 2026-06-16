import type { GameModeDefinition } from '../types';
import type { AtcAction, AtcConfig, AtcState } from '../../core/atc/types';
import { createGame, reduce } from '../../core/atc/engine';
import { AtcSetup } from './AtcSetup';
import { AtcGame } from './AtcGame';

export const atcMode: GameModeDefinition<AtcConfig, AtcState, AtcAction> = {
  id: 'atc',
  name: 'Around the Clock',
  description: '1 → 20 puis Bull · simples, doubles, triples, ordre plateau',
  createGame: (config) => createGame(config),
  reduce,
  getResult: (state) =>
    state.phase === 'matchOver' && state.winner !== null
      ? { players: state.players.map((p) => p.name), winner: state.winner }
      : null,
  SetupScreen: AtcSetup,
  GameScreen: AtcGame,
};
