import type { Dart, KillerPlayer, KillerState } from './types.ts';

export const isEliminated = (p: KillerPlayer): boolean => p.lives <= 0;

export const aliveCount = (players: KillerPlayer[]): number =>
  players.reduce((n, p) => n + (p.lives > 0 ? 1 : 0), 0);

/** Le joueur peut-il attaquer (tueur, hors prison, en vie) ? */
export const canAttack = (p: KillerPlayer): boolean => p.isKiller && !p.inPrison && p.lives > 0;

const BULL: Dart[] = [
  { value: 25, multiplier: 1 },
  { value: 25, multiplier: 2 },
];

/**
 * Fléchettes utiles pour le joueur courant (clavier intelligent) :
 * - en prison ou pas encore tueur → ce qui permet d'entrer (Bull, ou son double) ;
 * - tueur → les numéros des adversaires (en simple/double/triple, pour rester
 *   éclairés quel que soit le multiplicateur), plus le Bull en mode prison.
 */
export function recommendedDarts(state: KillerState): Dart[] {
  const me = state.players[state.currentPlayer];
  const entry = state.config.entry;

  if (me.inPrison) return BULL;
  if (!me.isKiller) {
    if (entry === 'double') return [{ value: me.number, multiplier: 2 }];
    return BULL; // 'bull' (et garde-fou)
  }

  // Tueur : cibler les numéros adverses encore en vie.
  const singles: Dart[] = [];
  const doubles: Dart[] = [];
  const triples: Dart[] = [];
  state.players.forEach((p, idx) => {
    if (idx === state.currentPlayer || p.lives <= 0) return;
    singles.push({ value: p.number, multiplier: 1 });
    doubles.push({ value: p.number, multiplier: 2 });
    triples.push({ value: p.number, multiplier: 3 });
  });
  const out = [...singles, ...doubles, ...triples];
  if (entry === 'prison') out.push(...BULL); // option : renvoyer tout le monde en prison
  return out;
}
