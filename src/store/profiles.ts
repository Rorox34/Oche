import type { GameResult } from '../modes/types';

export interface PlayerModeStats {
  games: number;
  wins: number;
}

export interface PlayerProfile {
  /** Nom affiché (dernière casse utilisée). */
  name: string;
  games: number;
  wins: number;
  lastPlayedAt: number;
  /** Détail par mode (clé = id du mode). */
  byMode: Record<string, PlayerModeStats>;
}

/** Profils indexés par nom normalisé (insensible à la casse / aux espaces). */
export type Profiles = Record<string, PlayerProfile>;

export const normalizeName = (name: string): string => name.trim().toLowerCase();

/**
 * Un nom « réel » mérite un profil : non vide et différent des noms par défaut
 * (« Joueur 1 », « Joueur 2 »…), qui ne représentent pas une vraie personne.
 */
export function isRealName(name: string): boolean {
  const t = name.trim();
  return t.length > 0 && !/^joueur\s*\d+$/i.test(t);
}

/** Enregistre une partie terminée dans les profils (immutable). */
export function recordResult(
  profiles: Profiles,
  modeId: string,
  result: GameResult,
  now: number,
): Profiles {
  const next: Profiles = { ...profiles };
  result.players.forEach((rawName, i) => {
    if (!isRealName(rawName)) return;
    const key = normalizeName(rawName);
    const won = i === result.winner ? 1 : 0;
    const prev = next[key] ?? { name: rawName.trim(), games: 0, wins: 0, lastPlayedAt: 0, byMode: {} };
    const mode = prev.byMode[modeId] ?? { games: 0, wins: 0 };
    next[key] = {
      name: rawName.trim(), // garde la dernière casse
      games: prev.games + 1,
      wins: prev.wins + won,
      lastPlayedAt: now,
      byMode: { ...prev.byMode, [modeId]: { games: mode.games + 1, wins: mode.wins + won } },
    };
  });
  return next;
}

/** Inverse exact de recordResult (annulation du coup gagnant). */
export function reverseResult(profiles: Profiles, modeId: string, result: GameResult): Profiles {
  const next: Profiles = { ...profiles };
  result.players.forEach((rawName, i) => {
    if (!isRealName(rawName)) return;
    const key = normalizeName(rawName);
    const prev = next[key];
    if (!prev) return;
    const won = i === result.winner ? 1 : 0;

    const games = prev.games - 1;
    if (games <= 0) {
      delete next[key]; // un seul jeu enregistré → on retire le profil
      return;
    }
    const mode = prev.byMode[modeId];
    const byMode = { ...prev.byMode };
    const modeGames = (mode?.games ?? 0) - 1;
    if (modeGames <= 0) delete byMode[modeId];
    else byMode[modeId] = { games: modeGames, wins: (mode?.wins ?? 0) - won };

    next[key] = { ...prev, games, wins: prev.wins - won, byMode };
  });
  return next;
}

/** Profils triés du plus joué au moins joué (puis le plus récent). */
export function sortedProfiles(profiles: Profiles): PlayerProfile[] {
  return Object.values(profiles).sort(
    (a, b) => b.games - a.games || b.lastPlayedAt - a.lastPlayedAt || a.name.localeCompare(b.name),
  );
}

/**
 * Suggestions de noms pour la saisie : les profils connus, triés par usage,
 * filtrés par la saisie courante et privés des noms déjà choisis. Une saisie
 * vide ou un nom par défaut propose simplement les plus utilisés.
 */
export function suggestNames(
  profiles: Profiles,
  query: string,
  exclude: string[],
  limit = 6,
): string[] {
  const excluded = new Set(exclude.map(normalizeName));
  const q = query.trim().toLowerCase();
  const showAll = q === '' || /^joueur\s*\d+$/i.test(query.trim());
  return sortedProfiles(profiles)
    .filter((p) => !excluded.has(normalizeName(p.name)))
    .filter((p) => showAll || p.name.toLowerCase().includes(q))
    .slice(0, limit)
    .map((p) => p.name);
}

/** Taux de victoire en pourcentage entier. */
export const winRate = (profile: PlayerProfile): number =>
  profile.games === 0 ? 0 : Math.round((profile.wins / profile.games) * 100);
