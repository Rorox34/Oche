export type ThemeId = 'dark-classic' | 'light-pro' | 'tournament';

export interface ThemeDefinition {
  id: ThemeId;
  name: string;
  /** Couleur de fond, utilisée pour la meta theme-color (barre système mobile). */
  boardColor: string;
}

/**
 * Les couleurs elles-mêmes vivent dans src/index.css (variables --t-* par
 * [data-theme]). Ajouter un thème = un bloc CSS + une entrée ici.
 */
export const themes: ThemeDefinition[] = [
  { id: 'dark-classic', name: 'Dark Classic', boardColor: '#08090b' },
  { id: 'light-pro', name: 'Light Pro', boardColor: '#f4f3ee' },
  { id: 'tournament', name: 'Tournament', boardColor: '#0a1226' },
];

export const DEFAULT_THEME: ThemeId = 'dark-classic';

export const getTheme = (id: ThemeId): ThemeDefinition =>
  themes.find((t) => t.id === id) ?? themes[0];
