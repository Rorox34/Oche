import { dartKind, formatDart, type Dart, type DartKind } from '../core/darts';

const KIND_STYLES: Record<DartKind, string> = {
  single: 'border-line bg-surface text-cream',
  double: 'border-green/50 bg-green/15 text-green',
  triple: 'border-red/50 bg-red/15 text-red',
  bull: 'border-gold/50 bg-gold/15 text-gold',
  miss: 'border-line/60 bg-transparent text-muted',
};

interface Props {
  dart: Dart;
  size?: 'sm' | 'md';
}

/** Badge coloré par type : Simple / Double (vert) / Triple (rouge) / Bull (or). */
export function DartBadge({ dart, size = 'md' }: Props) {
  const kind = dartKind(dart);
  return (
    <span
      className={`inline-flex items-center justify-center rounded-lg border font-display font-bold tabular-nums
        ${size === 'md' ? 'min-w-11 px-1.5 py-0.5 text-lg' : 'min-w-8 px-1 text-sm'}
        ${KIND_STYLES[kind]}`}
    >
      {formatDart(dart)}
    </span>
  );
}
