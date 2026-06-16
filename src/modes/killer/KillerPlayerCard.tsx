import type { KillerPlayer } from '../../core/killer/types';
import { statusLabel } from '../../core/killer/format';

interface Props {
  player: KillerPlayer;
  active: boolean;
  compact: boolean;
}

function Lives({ lives, maxLives }: { lives: number; maxLives: number }) {
  if (maxLives > 5) {
    return (
      <span className="text-sm font-semibold text-red">
        ♥ {lives}
        <span className="text-muted">/{maxLives}</span>
      </span>
    );
  }
  return (
    <span className="flex gap-0.5" role="img" aria-label={`${lives} vie${lives > 1 ? 's' : ''} sur ${maxLives}`}>
      {Array.from({ length: maxLives }, (_, i) => (
        <span key={i} className={i < lives ? 'text-red' : 'text-line'}>
          {i < lives ? '♥' : '♡'}
        </span>
      ))}
    </span>
  );
}

export function KillerPlayerCard({ player, active, compact }: Props) {
  const dead = player.lives <= 0;

  return (
    <div
      aria-current={active ? 'true' : undefined}
      className={`flex flex-col items-center rounded-2xl border px-2 py-3 transition-colors
        ${dead ? 'border-line bg-board opacity-50' : active ? 'border-accent bg-surface ring-1 ring-accent/40' : 'border-line bg-board'}`}
    >
      <span
        className={`max-w-full truncate text-sm font-medium
          ${dead ? 'text-muted line-through' : active ? 'text-accent' : 'text-muted'}`}
      >
        {player.name}
      </span>

      <span className="mt-0.5 text-[0.6rem] uppercase tracking-widest text-muted">N°</span>
      <span
        className={`font-display font-bold leading-none tabular-nums
          ${compact ? 'text-3xl' : 'text-5xl'} ${dead ? 'text-muted' : active ? 'text-cream' : 'text-muted'}`}
      >
        {player.number}
      </span>

      <span className="mt-1.5">
        <Lives lives={player.lives} maxLives={player.maxLives} />
      </span>

      <span className="mt-1.5 text-[0.7rem] font-semibold text-muted">{statusLabel(player)}</span>
    </div>
  );
}
