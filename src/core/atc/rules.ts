import type { AtcSegmentRule, AtcTarget, Dart } from './types.ts';

/**
 * Une fléchette compte-t-elle pour la cible ? Logique centralisée : les
 * variantes futures s'ajoutent ici. La règle de segment ne s'applique qu'aux
 * numéros — le bull suit sa propre règle (un « doubles only » avec étape 25
 * serait sinon injouable).
 */
export function countsForTarget(dart: Dart, target: AtcTarget, rule: AtcSegmentRule): boolean {
  if (target.kind === 'bull') {
    if (dart.value !== 25) return false;
    switch (target.accept) {
      case 'any':
        return true;
      case 'outer':
        return dart.multiplier === 1;
      case 'bullseye':
        return dart.multiplier === 2;
    }
  }
  if (dart.value !== target.value) return false;
  switch (rule) {
    case 'any':
      return true;
    case 'singles':
      return dart.multiplier === 1;
    case 'doubles':
      return dart.multiplier === 2;
    case 'triples':
      return dart.multiplier === 3;
  }
}

/** Fléchettes valides pour la cible courante (clavier intelligent). */
export function recommendedDarts(
  target: AtcTarget | undefined,
  rule: AtcSegmentRule,
): Dart[] {
  if (!target) return [];
  if (target.kind === 'bull') {
    switch (target.accept) {
      case 'any':
        return [
          { value: 25, multiplier: 1 },
          { value: 25, multiplier: 2 },
        ];
      case 'outer':
        return [{ value: 25, multiplier: 1 }];
      case 'bullseye':
        return [{ value: 25, multiplier: 2 }];
    }
  }
  const v = target.value;
  switch (rule) {
    case 'any':
      return [
        { value: v, multiplier: 1 },
        { value: v, multiplier: 2 },
        { value: v, multiplier: 3 },
      ];
    case 'singles':
      return [{ value: v, multiplier: 1 }];
    case 'doubles':
      return [{ value: v, multiplier: 2 }];
    case 'triples':
      return [{ value: v, multiplier: 3 }];
  }
}
