import type { AtcPlayer } from '../../core/atc/types';
import { hitRate } from '../../core/atc/engine';

interface Props {
  player: AtcPlayer;
  /** Libellé de la cible courante ('✓' si parcours terminé). */
  targetLabel: string;
  /** Progression globale 0..1 sur le parcours. */
  progress: number;
  hitsPerTarget: number;
  active: boolean;
  compact: boolean;
}

export function AtcPlayerCard({
  player,
  targetLabel,
  progress,
  hitsPerTarget,
  active,
  compact,
}: Props) {
  const rate = hitRate(player);

  return (
    <div
      aria-current={active ? 'true' : undefined}
      className={`flex flex-col items-center rounded-2xl border px-2 py-3 transition-colors
        ${active ? 'border-accent bg-surface ring-1 ring-accent/40' : 'border-line bg-board'}`}
    >
      <span className={`max-w-full truncate text-sm font-medium ${active ? 'text-accent' : 'text-muted'}`}>
        {player.name}
      </span>

      <span className="mt-1 text-[0.65rem] uppercase tracking-widest text-muted">Cible</span>
      <span
        className={`font-display font-bold leading-none tabular-nums
          ${compact ? 'text-3xl' : 'text-6xl'} ${active ? 'text-cream' : 'text-muted'}`}
      >
        {targetLabel}
      </span>

      {hitsPerTarget > 1 && (
        <span
          className="mt-1.5 flex gap-1"
          role="img"
          aria-label={`${player.hitsOnTarget} touche${player.hitsOnTarget > 1 ? 's' : ''} sur ${hitsPerTarget}`}
        >
          {Array.from({ length: hitsPerTarget }, (_, i) => (
            <span
              key={i}
              className={`h-2 w-2 rounded-full ${i < player.hitsOnTarget ? 'bg-green' : 'bg-line'}`}
            />
          ))}
        </span>
      )}

      <span
        className="mt-2 h-1 w-full overflow-hidden rounded-full bg-line"
        role="progressbar"
        aria-valuenow={Math.round(progress * 100)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Progression de ${player.name}`}
      >
        <span className="block h-full bg-green" style={{ width: `${progress * 100}%` }} />
      </span>

      {!compact && (
        <span className="mt-2 text-xs text-muted">
          F {player.dartsThrown} · T {player.visits} · {rate === null ? '—' : `${rate}%`}
        </span>
      )}
    </div>
  );
}
