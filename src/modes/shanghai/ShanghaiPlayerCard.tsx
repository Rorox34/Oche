import type { ShanghaiPlayer } from '../../core/shanghai/types';

interface Props {
  player: ShanghaiPlayer;
  active: boolean;
  /** Meneur du score (mis en valeur en or), s'il existe un écart. */
  leader: boolean;
  compact: boolean;
}

export function ShanghaiPlayerCard({ player, active, leader, compact }: Props) {
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
          ${compact ? 'text-3xl' : 'text-6xl'}
          ${leader ? 'text-gold' : active ? 'text-cream' : 'text-muted'}`}
      >
        {player.score}
      </span>
      {!compact && (
        <span className="mt-2 text-xs text-muted">
          Fléchettes {player.dartsThrown} · Manches {player.visits}
        </span>
      )}
    </div>
  );
}
