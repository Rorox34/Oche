import { Fragment } from 'react';
import type { CricketPlayer, CricketTarget, CricketVariant } from '../../core/cricket/types';
import { MARKS_TO_CLOSE, VARIANTS, isDead } from '../../core/cricket/rules';
import { closedCount, mpr } from '../../core/cricket/engine';
import { formatTarget } from '../../core/cricket/format';

interface Props {
  targets: CricketTarget[];
  players: CricketPlayer[];
  currentPlayer: number;
  variant: CricketVariant;
}

/** Une case de marques : · (vide), ╱ (1), ✕ (2), ⊗ vert cerclé (fermé). */
function MarkCell({ count, dead, active }: { count: number; dead: boolean; active: boolean }) {
  const closed = count >= MARKS_TO_CLOSE;
  const symbol = count === 0 ? '·' : count === 1 ? '╱' : '✕';
  return (
    <span
      aria-label={`${count} marque${count > 1 ? 's' : ''}${closed ? ', fermé' : ''}`}
      className={`mx-auto flex h-9 w-9 items-center justify-center font-display text-2xl font-bold leading-none
        ${closed ? 'rounded-full border-2 border-green text-green' : ''}
        ${count === 0 ? 'text-muted/25' : active ? 'text-cream' : 'text-muted'}
        ${dead ? 'opacity-40' : ''}`}
    >
      {symbol}
    </span>
  );
}

/** Tableau de marques Cricket : une ligne par cible, une colonne par joueur. */
export function CricketBoard({ targets, players, currentPlayer, variant }: Props) {
  const spec = VARIANTS[variant];
  const cols = `3rem repeat(${players.length}, minmax(0, 1fr))`;

  // Meneur (pour la mise en valeur du score) selon l'objectif de la variante.
  // Surligné seulement s'il existe un véritable écart entre les joueurs.
  const scores = players.map((p) => p.score);
  const best = spec.goal === 'highest' ? Math.max(...scores) : Math.min(...scores);
  const hasLeader = new Set(scores).size > 1;

  return (
    <div role="table" aria-label="Tableau Cricket" className="rounded-2xl border border-line bg-board p-2">
      <div className="grid items-stretch gap-x-1" style={{ gridTemplateColumns: cols }}>
        {/* En-tête : coin vide + joueurs */}
        <span aria-hidden="true" />
        {players.map((p, i) => {
          const active = i === currentPlayer;
          const leads = spec.scores && hasLeader && p.score === best;
          return (
            <div
              key={i}
              aria-current={active ? 'true' : undefined}
              className={`flex flex-col items-center rounded-xl px-1 py-1.5 transition-colors
                ${active ? 'bg-surface ring-1 ring-accent/40' : ''}`}
            >
              <span className={`max-w-full truncate text-xs font-medium ${active ? 'text-accent' : 'text-muted'}`}>
                {p.name}
              </span>
              {spec.scores ? (
                <span
                  className={`font-display text-2xl font-bold leading-none tabular-nums
                    ${leads ? 'text-gold' : active ? 'text-cream' : 'text-muted'}`}
                >
                  {p.score}
                </span>
              ) : (
                <span className={`font-display text-2xl font-bold leading-none tabular-nums ${active ? 'text-cream' : 'text-muted'}`}>
                  {closedCount(p)}
                  <span className="text-sm text-muted">/{targets.length}</span>
                </span>
              )}
              <span className="text-[0.65rem] text-muted">
                {mpr(p) === null ? '—' : `${mpr(p)!.toFixed(1)} MPR`}
              </span>
            </div>
          );
        })}

        {/* Lignes de cibles */}
        {targets.map((target, i) => {
          const dead = isDead(players, i);
          return (
            <Fragment key={i}>
              <span
                className={`flex items-center justify-center font-display text-xl font-bold leading-none
                  ${dead ? 'text-muted/40 line-through' : 'text-cream'}`}
              >
                {formatTarget(target)}
              </span>
              {players.map((p, pi) => (
                <span key={pi} className="flex items-center border-t border-line/40">
                  <MarkCell count={p.marks[i]} dead={dead} active={pi === currentPlayer} />
                </span>
              ))}
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}
