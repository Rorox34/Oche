import { useAppStore } from '../store/appStore';
import { gameModes } from '../modes/registry';
import { Button } from '../components/Button';

export function CreditsScreen() {
  const goHome = useAppStore((s) => s.goHome);

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-6 px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))]">
      <header className="flex items-center gap-2">
        <Button variant="ghost" onClick={goHome} aria-label="Retour à l'accueil" className="min-h-12 px-3">
          ←
        </Button>
        <h1 className="flex-1 font-display text-3xl font-bold uppercase tracking-wide">Crédits</h1>
      </header>

      <div className="flex flex-col items-center gap-2 pt-4 text-center">
        <span className="font-display text-6xl font-bold uppercase tracking-tight">Oche</span>
        <p className="text-muted">Compteur de fléchettes · PWA hors-ligne</p>
      </div>

      <div className="flex flex-col gap-3">
        <section className="rounded-3xl border border-line bg-surface p-4">
          <h2 className="font-display text-sm font-semibold uppercase tracking-widest text-muted">
            Modes de jeu
          </h2>
          <p className="mt-1 text-cream">{gameModes.map((m) => m.name).join(' · ')}</p>
        </section>

        <section className="rounded-3xl border border-line bg-surface p-4">
          <h2 className="font-display text-sm font-semibold uppercase tracking-widest text-muted">
            Conçu avec
          </h2>
          <p className="mt-1 text-cream">React · TypeScript · Vite · Tailwind · Zustand</p>
        </section>

        <section className="rounded-3xl border border-line bg-surface p-4">
          <h2 className="font-display text-sm font-semibold uppercase tracking-widest text-muted">
            Code source
          </h2>
          <p className="mt-1 break-all text-cream">github.com/Rorox34/Oche</p>
        </section>
      </div>

      <p className="mt-auto text-center text-xs text-muted">
        Statistiques et parties enregistrées localement sur cet appareil.
      </p>
    </div>
  );
}
