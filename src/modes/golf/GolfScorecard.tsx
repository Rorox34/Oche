import { Fragment } from 'react';
import type { GolfPlayer } from '../../core/golf/types';
import { relativeToPar } from '../../core/golf/engine';
import { formatRelativePar } from '../../core/golf/format';

interface Props {
  targets: number[];
  players: GolfPlayer[];
  currentPlayer: number;
  /** Index du trou courant (ligne mise en valeur). */
  round: number;
  /** Variante Cricket : affiche la progression des marques (x/3) sur le trou en cours. */
  showMarks?: boolean;
}

/** Couleur d'un coup : 1 eagle (or), 2 birdie (vert), 3 par (crème), ≥4 bogey (rouge). */
function StrokeCell({
  score,
  active,
  marks,
  showMarks,
}: {
  score: number;
  active: boolean;
  marks: number;
  showMarks: boolean;
}) {
  if (score < 0) {
    if (showMarks && marks > 0) {
      return <span className="mx-auto text-sm font-semibold tabular-nums text-accent">{marks}/3</span>;
    }
    return <span className="mx-auto text-muted/25">·</span>;
  }
  const tone =
    score === 1 ? 'text-gold' : score === 2 ? 'text-green' : score === 3 ? 'text-cream' : 'text-red';
  return (
    <span
      className={`mx-auto font-display text-xl font-bold leading-none tabular-nums ${tone} ${active ? '' : 'opacity-90'}`}
    >
      {score}
    </span>
  );
}

/** Carte de parcours : une ligne par trou, une colonne par joueur. */
export function GolfScorecard({ targets, players, currentPlayer, round, showMarks = false }: Props) {
  const cols = `2.5rem repeat(${players.length}, minmax(0, 1fr))`;

  // Meneur jugé au score relatif au par (équitable même si les joueurs n'ont
  // pas encore joué le même nombre de trous), mis en valeur s'il y a un écart.
  const rels = players.map((p) => relativeToPar(p));
  const best = Math.min(...rels);
  const hasLeader = new Set(rels).size > 1 && players.some((p) => p.holeScores.some((s) => s >= 0));

  return (
    <div role="table" aria-label="Carte de parcours" className="rounded-2xl border border-line bg-board p-2">
      <div className="grid items-stretch gap-x-1" style={{ gridTemplateColumns: cols }}>
        {/* En-tête : coin « Tr » + joueurs (total + score relatif au par) */}
        <span className="self-center text-center text-[0.65rem] uppercase tracking-widest text-muted">Tr</span>
        {players.map((p, i) => {
          const active = i === currentPlayer;
          const leads = hasLeader && relativeToPar(p) === best;
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
              <span
                className={`font-display text-2xl font-bold leading-none tabular-nums
                  ${leads ? 'text-gold' : active ? 'text-cream' : 'text-muted'}`}
              >
                {p.strokes}
              </span>
              <span className="text-[0.65rem] text-muted">{formatRelativePar(relativeToPar(p))}</span>
            </div>
          );
        })}

        {/* Lignes de trous */}
        {targets.map((hole, i) => {
          const onHole = i === round;
          return (
            <Fragment key={i}>
              <span
                className={`flex items-center justify-center border-t border-line/40 font-display text-base font-bold leading-none
                  ${onHole ? 'text-cream' : 'text-muted'}`}
              >
                {hole}
              </span>
              {players.map((p, pi) => (
                <span
                  key={pi}
                  className={`flex items-center border-t border-line/40 py-1.5
                    ${onHole ? 'bg-surface/40' : ''}`}
                >
                  <StrokeCell
                    score={p.holeScores[i]}
                    active={pi === currentPlayer}
                    marks={p.holeMarks}
                    showMarks={showMarks && onHole}
                  />
                </span>
              ))}
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}
