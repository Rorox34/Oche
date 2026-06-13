import { useEffect } from 'react';
import { useAppStore } from './store/appStore';
import { getTheme } from './themes';
import { HomeScreen } from './screens/HomeScreen';
import { SetupScreen } from './screens/SetupScreen';
import { GameScreen } from './screens/GameScreen';
import { SettingsOverlay } from './components/Settings';

export default function App() {
  const screen = useAppStore((s) => s.screen);
  const themeId = useAppStore((s) => s.settings.themeId);

  useEffect(() => {
    document.documentElement.dataset.theme = themeId;
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', getTheme(themeId).boardColor);
  }, [themeId]);

  return (
    <>
      {screen === 'setup' ? <SetupScreen /> : screen === 'game' ? <GameScreen /> : <HomeScreen />}
      <SettingsOverlay />
    </>
  );
}
