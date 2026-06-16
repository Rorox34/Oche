import type { GameModeDefinition } from './types';
import { x01Mode } from './x01';
import { atcMode } from './atc';
import { cricketMode } from './cricket';
import { shanghaiMode } from './shanghai';
import { golfMode } from './golf';

/**
 * Le registre efface volontairement les génériques : le shell manipule des
 * modes hétérogènes. La sûreté de typage est garantie à l'intérieur de
 * chaque module de mode, où config/état/actions sont pleinement typés.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyGameMode = GameModeDefinition<any, any, any>;

export const gameModes: AnyGameMode[] = [x01Mode, atcMode, cricketMode, shanghaiMode, golfMode];

export function getMode(id: string): AnyGameMode {
  const mode = gameModes.find((m) => m.id === id);
  if (!mode) throw new Error(`Mode de jeu inconnu : ${id}`);
  return mode;
}
