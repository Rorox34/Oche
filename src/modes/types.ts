import type { ComponentType } from 'react';

export interface SetupScreenProps<TConfig> {
  onStart: (config: TConfig) => void;
  onBack: () => void;
}

export interface GameScreenProps<TState, TAction> {
  state: TState;
  dispatch: (action: TAction) => void;
  undo: () => void;
  canUndo: boolean;
  onQuit: () => void;
  /** Retour à l'écran de configuration du mode (nouvelle partie). */
  onNewGame: () => void;
}

/**
 * Contrat d'un mode de jeu. Le shell (store, navigation, undo, persistance)
 * ne connaît que cette interface : ajouter un mode (Cricket, Around the
 * World, Killer…) = un dossier dans `src/modes/` + une entrée dans le registre.
 */
export interface GameModeDefinition<TConfig = unknown, TState = unknown, TAction = unknown> {
  id: string;
  name: string;
  description: string;
  createGame: (config: TConfig) => TState;
  reduce: (state: TState, action: TAction) => TState;
  SetupScreen: ComponentType<SetupScreenProps<TConfig>>;
  GameScreen: ComponentType<GameScreenProps<TState, TAction>>;
}
