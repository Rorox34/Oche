import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getMode } from '../modes/registry';
import { DEFAULT_THEME, type ThemeId } from '../themes';
import type { GameResult } from '../modes/types';
import { recordResult, reverseResult, type Profiles } from './profiles';

export type Screen = 'home' | 'setup' | 'game' | 'stats';

interface ActiveGame {
  modeId: string;
  state: unknown;
  /** Pile de snapshots pour l'undo — bornée pour limiter le localStorage. */
  past: unknown[];
  /** Résultat enregistré dans les statistiques (pour pouvoir l'annuler). */
  recordedResult: GameResult | null;
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
  /** Statistiques locales par joueur (persistées). */
  profiles: Profiles;
  /** Overlay d'options, accessible depuis n'importe quel écran (non persisté). */
  settingsOpen: boolean;
  openSettings: () => void;
  closeSettings: () => void;
  goHome: () => void;
  openStats: () => void;
  openSetup: (modeId: string) => void;
  startGame: (modeId: string, config: unknown) => void;
  resumeGame: () => void;
  quitGame: () => void;
  dispatch: (action: unknown) => void;
  undo: () => void;
  setTheme: (themeId: ThemeId) => void;
  setSmartKeypad: (enabled: boolean) => void;
  removeProfile: (key: string) => void;
  clearProfiles: () => void;
}

const MAX_UNDO = 150;

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      screen: 'home',
      setupModeId: null,
      game: null,
      settings: DEFAULT_SETTINGS,
      profiles: {},
      settingsOpen: false,

      openSettings: () => set({ settingsOpen: true }),
      closeSettings: () => set({ settingsOpen: false }),

      goHome: () => set({ screen: 'home' }),
      openStats: () => set({ screen: 'stats' }),

      openSetup: (modeId) => set({ screen: 'setup', setupModeId: modeId }),

      startGame: (modeId, config) => {
        const mode = getMode(modeId);
        set({
          game: { modeId, state: mode.createGame(config), past: [], recordedResult: null },
          screen: 'game',
        });
      },

      resumeGame: () => {
        if (get().game) set({ screen: 'game' });
      },

      quitGame: () => set({ game: null, screen: 'home' }),

      dispatch: (action) => {
        const { game, profiles } = get();
        if (!game) return;
        const mode = getMode(game.modeId);
        const next = mode.reduce(game.state, action);
        if (next === game.state) return;

        // Enregistrement des stats à la transition vers une partie terminée.
        // Le passage « terminé → en cours » via le réducteur est une revanche
        // (restart) : les stats déjà comptées sont conservées, le drapeau remis.
        const nextResult = mode.getResult(next);
        let recordedResult = game.recordedResult;
        let newProfiles = profiles;
        if (nextResult && !recordedResult) {
          newProfiles = recordResult(profiles, game.modeId, nextResult, Date.now());
          recordedResult = nextResult;
        } else if (!nextResult && recordedResult) {
          recordedResult = null;
        }

        set({
          game: {
            ...game,
            state: next,
            past: [...game.past, game.state].slice(-MAX_UNDO),
            recordedResult,
          },
          profiles: newProfiles,
        });
      },

      undo: () => {
        const { game, profiles } = get();
        if (!game || game.past.length === 0) return;
        const prev = game.past[game.past.length - 1];

        // Annuler le coup gagnant retire la partie des statistiques.
        let recordedResult = game.recordedResult;
        let newProfiles = profiles;
        if (recordedResult && !getMode(game.modeId).getResult(prev)) {
          newProfiles = reverseResult(profiles, game.modeId, recordedResult);
          recordedResult = null;
        }

        set({
          game: { ...game, state: prev, past: game.past.slice(0, -1), recordedResult },
          profiles: newProfiles,
        });
      },

      setTheme: (themeId) => set((s) => ({ settings: { ...s.settings, themeId } })),

      setSmartKeypad: (enabled) =>
        set((s) => ({ settings: { ...s.settings, smartKeypad: enabled } })),

      removeProfile: (key) =>
        set((s) => {
          const profiles = { ...s.profiles };
          delete profiles[key];
          return { profiles };
        }),

      clearProfiles: () => set({ profiles: {} }),
    }),
    {
      name: 'oche-app-v1',
      version: 3,
      // v2 : format de jeu (règles in/out, stats, journal). v3 : profils joueurs.
      migrate: (persisted, version) => {
        if (version < 2) {
          return {
            screen: 'home' as const,
            setupModeId: null,
            game: null,
            settings: DEFAULT_SETTINGS,
            profiles: {},
          };
        }
        const p = persisted as Pick<AppState, 'screen' | 'setupModeId' | 'game' | 'settings' | 'profiles'>;
        return { ...p, profiles: p.profiles ?? {} };
      },
      partialize: (s) => ({
        screen: s.screen,
        setupModeId: s.setupModeId,
        game: s.game,
        settings: s.settings,
        profiles: s.profiles,
      }),
    },
  ),
);
