import { useEffect } from 'react';
import { useAppStore } from '../store/appStore';
import { themes } from '../themes';
import { Segmented } from './Segmented';

/** Icône engrenage (Feather « settings »). */
function GearIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

/**
 * Bouton engrenage fixe (haut-droite) + page d'options en overlay.
 * Rendu au niveau du shell : disponible sur tous les écrans, à tout moment.
 */
export function Settings() {
  const open = useAppStore((s) => s.settingsOpen);
  const openSettings = useAppStore((s) => s.openSettings);
  const closeSettings = useAppStore((s) => s.closeSettings);
  const settings = useAppStore((s) => s.settings);
  const setTheme = useAppStore((s) => s.setTheme);
  const setSmartKeypad = useAppStore((s) => s.setSmartKeypad);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeSettings();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, closeSettings]);

  return (
    <>
      <button
        type="button"
        onClick={openSettings}
        aria-label="Options"
        aria-haspopup="dialog"
        aria-expanded={open}
        className="fixed right-[max(0.75rem,env(safe-area-inset-right))] top-[max(0.75rem,env(safe-area-inset-top))] z-30
          flex min-h-11 min-w-11 items-center justify-center rounded-full border border-line bg-surface/80 text-muted
          backdrop-blur transition-colors touch-manipulation active:scale-[0.95] active:text-cream
          focus-visible:outline-2 focus-visible:outline-cream"
      >
        <GearIcon />
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Options"
          className="fixed inset-0 z-[70] flex items-start justify-center bg-board/90 p-6
            pt-[max(3rem,env(safe-area-inset-top))] backdrop-blur-sm"
          onPointerDown={(e) => {
            if (e.target === e.currentTarget) closeSettings();
          }}
        >
          <div className="flex w-full max-w-md flex-col gap-6 rounded-3xl border border-line bg-surface p-6">
            <header className="flex items-center justify-between">
              <h2 className="font-display text-2xl font-bold uppercase tracking-wide">Options</h2>
              <button
                type="button"
                onClick={closeSettings}
                aria-label="Fermer les options"
                className="min-h-11 min-w-11 rounded-xl text-muted touch-manipulation active:text-cream
                  focus-visible:outline-2 focus-visible:outline-cream"
              >
                ✕
              </button>
            </header>

            <div className="flex flex-col gap-2">
              <span className="text-sm text-muted">Thème</span>
              <Segmented
                label="Thème"
                value={settings.themeId}
                onChange={setTheme}
                options={themes.map((t) => ({ value: t.id, label: t.name }))}
              />
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-sm text-muted">
                Clavier intelligent — met en évidence les meilleures fléchettes près d'un finish
              </span>
              <Segmented
                label="Clavier intelligent"
                value={settings.smartKeypad}
                onChange={setSmartKeypad}
                options={[
                  { value: true, label: 'Activé' },
                  { value: false, label: 'Désactivé' },
                ]}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
