import { useEffect } from 'react';
import { useAppStore } from '../store/appStore';
import { getMode } from '../modes/registry';

export function SetupScreen() {
  const modeId = useAppStore((s) => s.setupModeId);
  const startGame = useAppStore((s) => s.startGame);
  const goHome = useAppStore((s) => s.goHome);

  useEffect(() => {
    if (!modeId) goHome();
  }, [modeId, goHome]);

  if (!modeId) return null;

  const Setup = getMode(modeId).SetupScreen;
  return <Setup onStart={(config) => startGame(modeId, config)} onBack={goHome} />;
}
