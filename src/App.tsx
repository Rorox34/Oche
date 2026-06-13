import { useEffect } from 'react';
import { useAppStore } from './store/appStore';
import { getTheme } from './themes';
import { HomeScreen } from './screens/HomeScreen';
import { SetupScreen } from './screens/SetupScreen';
import { GameScreen } from './screens/GameScreen';

export default function App() {
  const screen = useAppStore((s) => s.screen);
  const themeId = useAppStore((s) => s.settings.themeId);

  useEffect(() => {
    document.documentElement.dataset.theme = themeId;
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', getTheme(themeId).boardColor);
  }, [themeId]);

  if (screen === 'setup') return <SetupScreen />;
  if (screen === 'game') return <GameScreen />;
  return <HomeScreen />;
}
