import type { Dart, InRule } from '../../core/x01/types';
import { IN_LABELS } from '../../core/x01/format';
import { DartBadge } from '../../components/DartBadge';

interface Props {
  score: number;
  routes: Dart[][];
  opened: boolean;
  inRule: InRule;
}

/**
 * Zone de hauteur fixe (pas de décalage du pavé pendant la partie) affichant
 * jusqu'à 3 routes de finish, ou la règle d'ouverture restante.
 */
export function FinishPanel({ score, routes, opened, inRule }: Props) {
  return (
    <div className="flex h-24 flex-col items-center justify-center gap-1 overflow-hidden" role="status">
      {!opened ? (
        <p className="font-display text-lg font-semibold text-gold">
          Ouverture requise : {IN_LABELS[inRule]}
          {inRule === 'bull' ? ' (25 ou 50)' : ''}
        </p>
      ) : routes.length > 0 ? (
        <>
          <div className="flex items-center gap-2">
            <span className="font-display text-2xl font-bold tabular-nums text-cream">{score}</span>
            <span aria-hidden="true" className="text-muted">→</span>
            <span className="flex gap-1.5">
              {routes[0].map((dart, i) => (
                <DartBadge key={i} dart={dart} />
              ))}
            </span>
          </div>
          {routes.slice(1).map((route, r) => (
            <div key={r} className="flex items-center gap-1.5 opacity-75">
              <span aria-hidden="true" className="text-sm text-muted">ou</span>
              {route.map((dart, i) => (
                <DartBadge key={i} dart={dart} size="sm" />
              ))}
            </div>
          ))}
        </>
      ) : null}
    </div>
  );
}
