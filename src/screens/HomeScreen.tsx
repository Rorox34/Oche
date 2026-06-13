import { gameModes } from '../modes/registry';
import { useAppStore } from '../store/appStore';
import { Button } from '../components/Button';
import { SettingsButton } from '../components/Settings';

export function HomeScreen() {
  const game = useAppStore((s) => s.game);
  const resumeGame = useAppStore((s) => s.resumeGame);
  const quitGame = useAppStore((s) => s.quitGame);
  const openSetup = useAppStore((s) => s.openSetup);

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-8 px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(3rem,env(safe-area-inset-top))]">
      <header className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-1">
          <h1 className="font-display text-7xl font-bold uppercase leading-none tracking-tight">
            Oche
          </h1>
          <p className="text-muted">Compteur de fléchettes</p>
        </div>
        <SettingsButton className="-mr-1 mt-1" />
      </header>

      {game && (
        <section
          aria-label="Partie en cours"
          className="flex flex-col gap-2 rounded-3xl border border-accent/60 bg-surface p-4"
        >
          <span className="font-display text-sm font-semibold uppercase tracking-widest text-accent">
            Partie en cours
          </span>
          <Button variant="primary" onClick={resumeGame}>
            Reprendre
          </Button>
          <Button variant="ghost" onClick={quitGame}>
            Abandonner la partie
          </Button>
        </section>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-sm font-semibold uppercase tracking-widest text-muted">
          Modes de jeu
        </h2>
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
