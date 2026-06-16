import { gameModes } from '../modes/registry';
import { useAppStore } from '../store/appStore';
import { Button } from '../components/Button';
import { SettingsButton } from '../components/Settings';

export function ModeSelectScreen() {
  const openSetup = useAppStore((s) => s.openSetup);
  const goHome = useAppStore((s) => s.goHome);

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-6 px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))]">
      <header className="flex items-center gap-2">
        <Button variant="ghost" onClick={goHome} aria-label="Retour à l'accueil" className="min-h-12 px-3">
          ←
        </Button>
        <h1 className="flex-1 font-display text-3xl font-bold uppercase tracking-wide">Nouvelle partie</h1>
        <SettingsButton />
      </header>

      <section className="flex flex-col gap-3">
        {gameModes.map((mode) => (
          <button
            type="button"
            key={mode.id}
            onClick={() => openSetup(mode.id)}
            className="flex flex-col items-start gap-1 rounded-3xl border border-line bg-surface p-5 text-left
              transition-transform duration-75 touch-manipulation active:scale-[0.98]
              focus-visible:outline-2 focus-visible:outline-cream"
          >
            <span className="font-display text-3xl font-bold text-cream">{mode.name}</span>
            <span className="text-sm text-muted">{mode.description}</span>
          </button>
        ))}
      </section>
    </div>
  );
}
