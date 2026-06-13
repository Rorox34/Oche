import type { CricketPlayer, CricketTarget, CricketVariant, Dart } from './types.ts';

/** Marques nécessaires pour fermer une cible. */
export const MARKS_TO_CLOSE = 3;

/** Numéros joués au Cricket, dans l'ordre d'affichage classique (haut → bas). */
export const CRICKET_NUMBERS: readonly number[] = [20, 19, 18, 17, 16, 15];

/** Valeur en points d'une cible (le bull vaut 25). */
export const targetValue = (target: CricketTarget): number =>
  target.kind === 'bull' ? 25 : target.value;

/**
 * Nombre de marques apportées par une fléchette sur une cible (0 hors-cible).
 * Un double vaut 2 marques, un triple 3 ; le bull simple 1, le double bull 2.
 */
export function marksFor(dart: Dart, target: CricketTarget): number {
  if (target.kind === 'bull') return dart.value === 25 ? dart.multiplier : 0;
  return dart.value === target.value ? dart.multiplier : 0;
}

/** La cible d'index `i` est-elle fermée par ce joueur ? */
export const isClosedBy = (player: CricketPlayer, i: number): boolean =>
  player.marks[i] >= MARKS_TO_CLOSE;

/** La cible d'index `i` est-elle morte (fermée par tous les joueurs) ? */
export const isDead = (players: CricketPlayer[], i: number): boolean =>
  players.every((p) => p.marks[i] >= MARKS_TO_CLOSE);

/**
 * Spécification d'une variante : libellés, objectif de score, distribution des
 * points et condition de victoire. C'est le **seul** endroit à compléter pour
 * ajouter une variante de Cricket — le moteur et l'UI s'en servent tels quels.
 */
export interface VariantSpec {
  label: string;
  description: string;
  /** Sens du classement : qui mène la partie. */
  goal: 'highest' | 'lowest';
  /** La variante attribue-t-elle des points ? (sinon course à la fermeture) */
  scores: boolean;
  /**
   * Distribue `marks` marques scorantes du joueur `scorer` sur la cible `i`
   * (valeur `value`). Mute `players`. Retourne le total de points générés.
   */
  distribute(
    players: CricketPlayer[],
    scorer: number,
    i: number,
    value: number,
    marks: number,
  ): number;
  /** `scorer` ayant fermé toutes ses cibles, a-t-il gagné la partie ? */
  hasWon(players: CricketPlayer[], scorer: number): boolean;
}

export const VARIANTS: Record<CricketVariant, VariantSpec> = {
  standard: {
    label: 'Standard',
    description: 'Marque sur tes numéros fermés tant qu’un adversaire ne l’a pas fermé. Score le plus haut gagne.',
    goal: 'highest',
    scores: true,
    distribute(players, scorer, i, value, marks) {
      // On ne marque que si au moins un adversaire n'a pas fermé la cible.
      const someoneOpen = players.some((p, idx) => idx !== scorer && p.marks[i] < MARKS_TO_CLOSE);
      if (!someoneOpen) return 0;
      const points = value * marks;
      players[scorer].score += points;
      return points;
    },
    hasWon(players, scorer) {
      const mine = players[scorer].score;
      return players.every((p, idx) => idx === scorer || mine >= p.score);
    },
  },

  cutthroat: {
    label: 'Cut-Throat',
    description: 'Tes points vont aux adversaires qui n’ont pas fermé la cible. Score le plus bas gagne.',
    goal: 'lowest',
    scores: true,
    distribute(players, scorer, i, value, marks) {
      let given = 0;
      players.forEach((p, idx) => {
        if (idx !== scorer && p.marks[i] < MARKS_TO_CLOSE) {
          p.score += value * marks;
          given += value * marks;
        }
      });
      return given;
    },
    hasWon(players, scorer) {
      const mine = players[scorer].score;
      return players.every((p, idx) => idx === scorer || mine <= p.score);
    },
  },

  'no-score': {
    label: 'Sans points',
    description: 'Aucun point : le premier à fermer toutes les cibles gagne.',
    goal: 'highest',
    scores: false,
    distribute() {
      return 0;
    },
    hasWon() {
      return true;
    },
  },
};

/**
 * Fléchettes utiles pour le joueur courant (clavier intelligent) : chaque cible
 * qu'il n'a pas encore fermée, déclinée pour **tous les multiplicateurs qui la
 * font avancer** (simple/double/triple pour un numéro, simple/double pour le
 * bull). Au Cricket toute touche compte : les cibles ouvertes restent ainsi
 * éclairées que le clavier soit en simple, double ou triple. Les simples sont
 * placés en tête pour conserver le meilleur numéro en surbrillance primaire.
 * Une cible non fermée par le joueur ne peut être morte — pas de filtre requis.
 */
export function recommendedDarts(
  targets: CricketTarget[],
  player: CricketPlayer,
): Dart[] {
  const open = targets.filter((_, i) => player.marks[i] < MARKS_TO_CLOSE);
  const singles: Dart[] = [];
  const doubles: Dart[] = [];
  const triples: Dart[] = [];
  open.forEach((target) => {
    if (target.kind === 'bull') {
      singles.push({ value: 25, multiplier: 1 });
      doubles.push({ value: 25, multiplier: 2 });
    } else {
      singles.push({ value: target.value, multiplier: 1 });
      doubles.push({ value: target.value, multiplier: 2 });
      triples.push({ value: target.value, multiplier: 3 });
    }
  });
  return [...singles, ...doubles, ...triples];
}
