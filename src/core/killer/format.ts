import type { KillerConfig, KillerEvent, KillerPlayer } from './types.ts';

export const ENTRY_LABELS = {
  bull: 'Bull (25/50)',
  double: 'Double',
  prison: 'Prison',
} as const;

const ENTRY_DESCRIPTIONS = {
  bull: 'Touchez 25 ou 50 pour devenir tueur, puis visez les numéros adverses.',
  double: 'Touchez le double de votre numéro pour devenir tueur.',
  prison:
    'On commence en prison ; 25/50 pour sortir ; un tueur qui refait 25/50 renvoie tous les autres en prison.',
} as const;

export const entryDescription = (entry: KillerConfig['entry']): string => ENTRY_DESCRIPTIONS[entry];

/** Libellé court pour l'en-tête de jeu. */
export function formatVariantShort(config: KillerConfig): string {
  return `${config.lives} vies · ${ENTRY_LABELS[config.entry]}`;
}

/** Libellé complet (écran de victoire). */
export function formatVariant(config: KillerConfig): string {
  const parts = [`${config.lives} vies`, `Entrée : ${ENTRY_LABELS[config.entry]}`];
  if (config.healOnKill) parts.push('Soin sur élimination');
  return parts.join(' · ');
}

/** Statut affiché sur la carte joueur. */
export function statusLabel(player: KillerPlayer): string {
  if (player.lives <= 0) return '💀 Éliminé';
  if (player.inPrison) return '🔒 Prison';
  if (player.isKiller) return '🗡 Tueur';
  return '⚪ À armer';
}

/** Mise en forme d'un évènement de volée pour l'historique. */
export function formatEvent(event: KillerEvent, players: KillerPlayer[]): string {
  const name = (i: number) => players[i]?.name ?? `J${i + 1}`;
  switch (event.kind) {
    case 'enter':
      return 'devient tueur';
    case 'escape':
      return 'sort de prison';
    case 'jailAll':
      return 'renvoie tout le monde en prison';
    case 'hit':
      return `−${event.lives} à ${name(event.target)}`;
    case 'eliminate':
      return `${name(event.target)} éliminé`;
    case 'heal':
      return 'vies restaurées';
  }
}
