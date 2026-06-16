import { useEffect } from 'react';
import { useAppStore } from '../store/appStore';
import { getMode } from '../modes/registry';

export function SetupScreen() {
  const modeId = useAppStore((s) => s.setupModeId);
  const startGame = useAppStore((s) => s.startGame);
  const openModes = useAppStore((s) => s.openModes);

  useEffect(() => {
    if (!modeId) openModes();
  }, [modeId, openModes]);

  if (!modeId) return null;

  const Setup = getMode(modeId).SetupScreen;
  return <Setup onStart={(config) => startGame(modeId, config)} onBack={openModes} />;
}
