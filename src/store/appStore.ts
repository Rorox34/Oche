import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getMode } from '../modes/registry';
import { DEFAULT_THEME, type ThemeId } from '../themes';

export type Screen = 'home' | 'setup' | 'game';

interface ActiveGame {
  modeId: string;
  state: unknown;
  /** Pile de snapshots pour l'undo — bornée pour limiter le localStorage. */
  past: unknown[];
}

export interface Settings {
  themeId: ThemeId;
  smartKeypad: boolean;
}

const DEFAULT_SETTINGS: Settings = { themeId: DEFAULT_THEME, smartKeypad: true };

interface AppState {
  screen: Screen;
  setupModeId: string | null;
  game: ActiveGame | null;
  settings: Settings;
  /** Overlay d'options, accessible depuis n'importe quel écran (non persisté). */
  settingsOpen: boolean;
  openSettings: () => void;
  closeSettings: () => void;
  goHome: () => void;
  openSetup: (modeId: string) => void;
  startGame: (modeId: string, config: unknown) => void;
  resumeGame: () => void;
  quitGame: () => void;
  dispatch: (action: unknown) => void;
  undo: () => void;
  setTheme: (themeId: ThemeId) => void;
  setSmartKeypad: (enabled: boolean) => void;
}

const MAX_UNDO = 150;

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      screen: 'home',
      setupModeId: null,
      game: null,
      settings: DEFAULT_SETTINGS,
      settingsOpen: false,

      openSettings: () => set({ settingsOpen: true }),
      closeSettings: () => set({ settingsOpen: false }),

      goHome: () => set({ screen: 'home' }),

      openSetup: (modeId) => set({ screen: 'setup', setupModeId: modeId }),

      startGame: (modeId, config) => {
        const mode = getMode(modeId);
        set({
          game: { modeId, state: mode.createGame(config), past: [] },
          screen: 'game',
        });
      },

      resumeGame: () => {
        if (get().game) set({ screen: 'game' });
      },

      quitGame: () => set({ game: null, screen: 'home' }),

      dispatch: (action) => {
        const { game } = get();
        if (!game) return;
        const next = getMode(game.modeId).reduce(game.state, action);
        if (next === game.state) return;
        set({
          game: {
            ...game,
            state: next,
            past: [...game.past, game.state].slice(-MAX_UNDO),
          },
        });
      },

      undo: () => {
        const { game } = get();
        if (!game || game.past.length === 0) return;
        set({
          game: {
            ...game,
            state: game.past[game.past.length - 1],
            past: game.past.slice(0, -1),
          },
        });
      },

      setTheme: (themeId) => set((s) => ({ settings: { ...s.settings, themeId } })),

      setSmartKeypad: (enabled) =>
        set((s) => ({ settings: { ...s.settings, smartKeypad: enabled } })),
    }),
    {
      name: 'oche-app-v1',
      version: 2,
      // Le format du jeu a changé en v2 (règles in/out, stats, journal) :
      // une sauvegarde v1 incompatible est réinitialisée proprement.
      migrate: (persisted, version) => {
        if (version < 2) {
          return {
            screen: 'home' as const,
            setupModeId: null,
            game: null,
            settings: DEFAULT_SETTINGS,
          };
        }
        return persisted as Pick<AppState, 'screen' | 'setupModeId' | 'game' | 'settings'>;
      },
      partialize: (s) => ({
        screen: s.screen,
        setupModeId: s.setupModeId,
        game: s.game,
        settings: s.settings,
      }),
    },
  ),
);
