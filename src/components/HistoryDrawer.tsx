import { useEffect } from 'react';
import type { Dart } from '../core/darts';
import { Button } from './Button';
import { DartBadge } from './DartBadge';

/** Modèle de vue neutre : chaque mode mappe son journal vers ce format. */
export interface HistoryViewEntry {
  playerName: string;
  meta?: string;
  darts: Dart[];
  badge?: { label: string; tone: 'red' | 'green' };
  value?: string;
  gold?: boolean;
}

const BADGE_TONES = {
  red: 'border-red/50 bg-red/15 text-red',
  green: 'border-green/50 bg-green/15 text-green',
} as const;

/** Icône historique (horloge à flèche anti-horaire). */
function HistoryIcon() {
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
      <path d="M3 3v5h5" />
      <path d="M3.05 13A9 9 0 1 0 6 5.3L3 8" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

/** Bouton à placer dans l'en-tête : ouvre le tiroir d'historique. */
export function HistoryButton({
  open,
  onClick,
  className = '',
}: {
  open: boolean;
  onClick: () => void;
  className?: string;
}) {
  return (
    <Button
      variant="ghost"
      onClick={onClick}
      aria-label="Ouvrir l'historique des lancers"
      aria-haspopup="dialog"
      aria-expanded={open}
      className={`min-h-12 shrink-0 px-2.5 ${className}`}
    >
      <HistoryIcon />
    </Button>
  );
}

interface Props {
  /** Entrées chronologiques (la plus ancienne en premier). */
  entries: HistoryViewEntry[];
  open: boolean;
  onClose: () => void;
}

/**
 * Panneau coulissant d'historique (contrôlé). Le déclencheur est
 * <HistoryButton>, placé dans l'en-tête. Partagé par tous les modes.
 */
export function HistoryDrawer({ entries, open, onClose }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-board/60"
          onPointerDown={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        role="dialog"
        aria-label="Historique des lancers"
        aria-hidden={!open}
        inert={!open}
        className={`fixed right-0 top-0 z-50 flex h-dvh w-80 max-w-[85vw] flex-col border-l border-line
          bg-surface transition-transform duration-200 ease-out
          ${open ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <header className="flex items-center justify-between border-b border-line px-4 py-3">
          <h2 className="font-display text-xl font-bold uppercase tracking-wide">Historique</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer l'historique"
            className="min-h-11 min-w-11 rounded-xl text-muted touch-manipulation active:text-cream
              focus-visible:outline-2 focus-visible:outline-cream"
          >
            ✕
          </button>
        </header>

        <ul className="flex-1 overflow-y-auto px-3 py-2">
          {entries.length === 0 && (
            <li className="py-6 text-center text-sm text-muted">
              Les volées apparaîtront ici dès le premier lancer.
            </li>
          )}
          {[...entries].reverse().map((entry, i) => (
            <li
              key={entries.length - i}
              className="flex items-center gap-2 border-b border-line/50 py-2 last:border-b-0"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-cream">
                  {entry.playerName}
                  {entry.meta && <span className="ml-1 text-xs text-muted">{entry.meta}</span>}
                </p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {entry.darts.map((dart, d) => (
                    <DartBadge key={d} dart={dart} size="sm" />
                  ))}
                </div>
              </div>
              {entry.badge ? (
                <span
                  className={`rounded-lg border px-2 py-0.5 font-display text-sm font-bold uppercase ${BADGE_TONES[entry.badge.tone]}`}
                >
                  {entry.badge.label}
                </span>
              ) : entry.value !== undefined ? (
                <span
                  className={`font-display text-xl font-bold tabular-nums ${entry.gold ? 'text-gold' : 'text-cream'}`}
                >
                  {entry.value}
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      </aside>
    </>
  );
}
