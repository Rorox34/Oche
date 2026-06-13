import type { X01Player } from '../../core/x01/types';
import { average3Darts, checkoutRate } from '../../core/x01/engine';

interface Props {
  player: X01Player;
  active: boolean;
  legsToWin: number;
  compact: boolean;
}

export function PlayerCard({ player, active, legsToWin, compact }: Props) {
  const rate = checkoutRate(player);

  return (
    <div
      aria-current={active ? 'true' : undefined}
      className={`flex flex-col items-center rounded-2xl border px-2 py-3 transition-colors
        ${active ? 'border-accent bg-surface ring-1 ring-accent/40' : 'border-line bg-board'}`}
    >
      <span className={`max-w-full truncate text-sm font-medium ${active ? 'text-accent' : 'text-muted'}`}>
        {player.name}
      </span>
      <span
        className={`mt-1 font-display font-bold leading-none tabular-nums
          ${compact ? 'text-3xl' : 'text-6xl'} ${active ? 'text-cream' : 'text-muted'}`}
      >
        {player.score}
      </span>

      {compact ? (
        <span className="mt-2 text-xs text-muted">Moy. {average3Darts(player).toFixed(1)}</span>
      ) : (
        <div className="mt-2 flex flex-col items-center gap-0.5 text-xs text-muted">
          <span>
            Moy. {average3Darts(player).toFixed(1)} · Max{' '}
            <span className={player.highestVisit >= 100 ? 'text-gold' : undefined}>
              {player.highestVisit}
            </span>
          </span>
          <span>
            Tours {player.visits} · CO {rate === null ? '—' : `${rate}%`}
          </span>
        </div>
      )}

      {legsToWin > 1 && (
        <span
          className="mt-2 flex gap-1"
          role="img"
          aria-label={`${player.legsWon} manche${player.legsWon > 1 ? 's' : ''} sur ${legsToWin}`}
        >
          {Array.from({ length: legsToWin }, (_, i) => (
            <span
              key={i}
              className={`h-1.5 w-1.5 rounded-full ${i < player.legsWon ? 'bg-green' : 'bg-line'}`}
            />
          ))}
        </span>
      )}
    </div>
  );
}
