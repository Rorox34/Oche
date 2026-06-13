import { useEffect } from 'react';
import { useAppStore } from '../store/appStore';
import { getMode } from '../modes/registry';

export function GameScreen() {
  const game = useAppStore((s) => s.game);
  const dispatch = useAppStore((s) => s.dispatch);
  const undo = useAppStore((s) => s.undo);
  const quitGame = useAppStore((s) => s.quitGame);
  const openSetup = useAppStore((s) => s.openSetup);
  const goHome = useAppStore((s) => s.goHome);

  useEffect(() => {
    if (!game) goHome();
  }, [game, goHome]);

  if (!game) return null;

  const { modeId } = game;
  const Game = getMode(modeId).GameScreen;
  return (
    <Game
      state={game.state}
      dispatch={dispatch}
      undo={undo}
      canUndo={game.past.length > 0}
      onQuit={quitGame}
      onNewGame={() => {
        quitGame();
        openSetup(modeId);
      }}
    />
  );
}
