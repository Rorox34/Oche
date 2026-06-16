import type { ReactNode } from 'react';
import { useAppStore } from '../store/appStore';
import { Button } from '../components/Button';
import { ThemeSlider } from '../components/ThemeSlider';

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="26"
      height="26"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

const PlayIcon = () => (
  <Icon>
    <polygon points="6 4 20 12 6 20 6 4" fill="currentColor" stroke="none" />
  </Icon>
);
const GearIcon = () => (
  <Icon>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </Icon>
);
const ChartIcon = () => (
  <Icon>
    <line x1="12" y1="20" x2="12" y2="10" />
    <line x1="18" y1="20" x2="18" y2="4" />
    <line x1="6" y1="20" x2="6" y2="16" />
  </Icon>
);
const InfoIcon = () => (
  <Icon>
    <circle cx="12" cy="12" r="9" />
    <line x1="12" y1="16" x2="12" y2="11" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </Icon>
);

interface TileProps {
  label: string;
  icon: ReactNode;
  onClick: () => void;
  primary?: boolean;
  compact?: boolean;
}

function Tile({ label, icon, onClick, primary = false, compact = false }: TileProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-3 rounded-3xl border text-left transition-transform duration-75
        touch-manipulation active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cream
        ${compact ? 'flex-col justify-center gap-2 p-4 text-center' : 'p-5'}
        ${primary ? 'border-accent bg-accent/15 text-cream' : 'border-line bg-surface text-cream'}`}
    >
      <span className={primary ? 'text-accent' : 'text-muted'}>{icon}</span>
      <span className={`font-display font-bold uppercase tracking-wide ${compact ? 'text-lg' : 'text-2xl'}`}>
        {label}
      </span>
    </button>
  );
}

export function HomeScreen() {
  const game = useAppStore((s) => s.game);
  const resumeGame = useAppStore((s) => s.resumeGame);
  const quitGame = useAppStore((s) => s.quitGame);
  const openModes = useAppStore((s) => s.openModes);
  const openStats = useAppStore((s) => s.openStats);
  const openCredits = useAppStore((s) => s.openCredits);
  const openSettings = useAppStore((s) => s.openSettings);

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-6 px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(3rem,env(safe-area-inset-top))]">
      <header className="flex flex-col gap-1">
        <h1 className="font-display text-7xl font-bold uppercase leading-none tracking-tight">Oche</h1>
        <p className="text-muted">Compteur de fléchettes</p>
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

      <nav className="flex flex-col gap-3">
        <Tile label="Nouvelle partie" icon={<PlayIcon />} onClick={openModes} primary />
        <Tile label="Options" icon={<GearIcon />} onClick={openSettings} />
        <div className="grid grid-cols-2 gap-3">
          <Tile label="Statistiques" icon={<ChartIcon />} onClick={openStats} compact />
          <Tile label="Crédits" icon={<InfoIcon />} onClick={openCredits} compact />
        </div>
      </nav>

      <div className="mt-auto">
        <ThemeSlider />
      </div>
    </div>
  );
}
