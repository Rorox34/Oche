export type ThemeId = 'dark-classic' | 'light-pro' | 'tournament';

export interface ThemeDefinition {
  id: ThemeId;
  name: string;
  /** Couleur de fond, utilisée pour la meta theme-color (barre système mobile). */
  boardColor: string;
  /** Couleurs d'aperçu (pastilles du sélecteur de thème). */
  surfaceColor: string;
  accentColor: string;
}

/**
 * Les couleurs elles-mêmes vivent dans src/index.css (variables --t-* par
 * [data-theme]). Ajouter un thème = un bloc CSS + une entrée ici. Les couleurs
 * d'aperçu ci-dessous doivent rester synchronisées avec ce bloc CSS.
 */
export const themes: ThemeDefinition[] = [
  { id: 'dark-classic', name: 'Dark Classic', boardColor: '#08090b', surfaceColor: '#14171c', accentColor: '#e2492f' },
  { id: 'light-pro', name: 'Light Pro', boardColor: '#f4f3ee', surfaceColor: '#ffffff', accentColor: '#1d4ed8' },
  { id: 'tournament', name: 'Tournament', boardColor: '#0a1226', surfaceColor: '#131f42', accentColor: '#ffb020' },
];

export const DEFAULT_THEME: ThemeId = 'dark-classic';

export const getTheme = (id: ThemeId): ThemeDefinition =>
  themes.find((t) => t.id === id) ?? themes[0];
