import { Button } from './Button';

interface Props {
  winnerName: string;
  stats: { label: string; value: string }[];
  rules: string;
  onRematch: () => void;
  onNewGame: () => void;
  onQuit: () => void;
}

/** Écran de fin de partie partagé : gagnant, statistiques, règles, actions. */
export function VictoryOverlay({ winnerName, stats, rules, onRematch, onNewGame, onQuit }: Props) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Fin de partie"
      className="fixed inset-0 z-[60] flex items-center justify-center bg-board/90 p-6 backdrop-blur-sm"
    >
      <div className="victory-pop gold-pulse flex w-full max-w-sm flex-col items-center gap-5 rounded-3xl border-2 border-gold bg-surface p-6 text-center">
        <span className="font-display text-base font-semibold uppercase tracking-widest text-gold">
          🏆 Victoire
        </span>
        <span className="font-display text-6xl font-bold leading-none text-cream">{winnerName}</span>

        <dl className="grid w-full grid-cols-2 gap-2">
          {stats.map(({ label, value }) => (
            <div key={label} className="rounded-2xl border border-line bg-board px-2 py-2">
              <dt className="text-xs uppercase tracking-wide text-muted">{label}</dt>
              <dd className="font-display text-2xl font-bold tabular-nums text-cream">{value}</dd>
            </div>
          ))}
        </dl>

        <p className="text-xs text-muted">{rules}</p>

        <Button variant="primary" className="w-full" onClick={onRematch}>
          Revanche
        </Button>
        <div className="flex w-full gap-2">
          <Button className="flex-1" onClick={onNewGame}>
            Nouvelle partie
          </Button>
          <Button variant="ghost" className="flex-1" onClick={onQuit}>
            Accueil
          </Button>
        </div>
      </div>
    </div>
  );
}
