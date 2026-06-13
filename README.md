# Oche — Compteur de fléchettes (PWA)

Compteur de fléchettes mobile-first. Trois modes : **301 / 501** (règles
d'entrée/sortie complètes, suggestions de finish, clavier intelligent),
**Around the Clock** (variantes de segments, ordres dont l'ordre réel du
plateau, bull final, multi-touches, chrono) et **Cricket** (Standard,
Cut-Throat, Sans points). Options accessibles partout via l'engrenage en
en-tête. Thèmes, historique coulissant, statistiques en direct, écran de
victoire, undo illimité, partie persistée hors-ligne.

## Démarrage

```bash
npm install
npm run dev        # développement (http://localhost:5173)
npm run build      # type-check + build de production (PWA générée)
npm run preview    # tester le build (service worker actif)
```

Tests du moteur de jeu (sans installation, Node ≥ 22.6) :

```bash
node --experimental-strip-types tests/engine.test.mjs   # moteur 301/501
node --experimental-strip-types tests/atc.test.mjs      # moteur Around the Clock
node --experimental-strip-types tests/cricket.test.mjs  # moteur Cricket
```

## Règles supportées

| Entrée | Effet |
|---|---|
| Straight In | toute fléchette ouvre le compte |
| Double In | un double (ou DB) est requis pour ouvrir |
| Triple In | un triple est requis pour ouvrir |
| Bull In | 25 **ou** 50 requis pour ouvrir |

| Sortie | Effet |
|---|---|
| Straight Out | finir sur n'importe quelle fléchette (rester à 1 est jouable) |
| Double Out | finir sur un double ou DB ; rester à 1 = bust |
| Master Out | finir sur un double **ou** un triple ; rester à 1 = bust |

Convention : un bust annule **toute la volée**, y compris une ouverture
réalisée pendant cette volée (score et statut d'ouverture restaurés).

## Architecture

```
src/
├── core/
│   ├── darts.ts       # Socle commun : fléchette, score, validité, affichage
│   ├── x01/           # Moteur 301/501 (pur) : règles in/out, busts, checkout, stats
│   ├── atc/           # Moteur Around the Clock (pur, indépendant) :
│   │   ├── order.ts   #   génération de l'ordre (1→20, 20→1, aléatoire, plateau)
│   │   ├── rules.ts   #   countsForTarget : variantes de touche centralisées
│   │   ├── engine.ts  #   réducteur : progression, hits par cible, victoire, chrono
│   │   └── format.ts  #   libellés des variantes, durée
│   └── cricket/       # Moteur Cricket (pur, indépendant) :
│       ├── targets.ts #   jeu de cibles (20→15 + Bull)
│       ├── rules.ts   #   VARIANTS : score, distribution des points, victoire
│       ├── engine.ts  #   réducteur : marques, fermeture, score, MPR
│       └── format.ts  #   libellés des variantes et cibles
├── modes/
│   ├── types.ts       # Contrat GameModeDefinition (createGame, reduce, écrans)
│   ├── registry.ts    # Registre — ajouter un mode = 1 dossier + 1 ligne
│   ├── x01/           # Écrans du mode 301/501
│   ├── atc/           # Écrans du mode Around the Clock
│   └── cricket/       # Écrans Cricket (Setup, Game, Board)
├── components/        # Partagé : DartKeypad, DartBadge, HistoryDrawer,
│                      #   VictoryOverlay, PlayerNamesField, Button, Segmented…
├── store/appStore.ts  # Zustand persist : navigation, partie, undo, réglages
├── themes/index.ts    # Thèmes (Dark Classic, Light Pro, Tournament)
└── screens/           # Shell générique : Home, Setup, Game
```

## Around the Clock

Toucher 1 → 2 → … → 20 puis le Bull. Variantes : segments valides (tous,
simples, doubles, triples — le bull suit sa propre règle), ordre des numéros
(ascendant, descendant, aléatoire, ordre réel du plateau), bull final (25 ou
50, 50 uniquement, 25 puis 50), 1 à 3 touches par cible. La revanche
regénère le parcours (nouveau tirage en ordre aléatoire).

## Cricket

Fermer chaque cible (**20 → 15 puis le Bull**) en accumulant **3 marques** :
un simple = 1 marque, un double = 2, un triple = 3 ; bull = 1, double bull = 2.
Une fois une cible fermée, les marques excédentaires comptent selon la variante,
tant qu'un adversaire ne l'a pas fermée (au-delà, la cible est « morte »).

| Variante | Points | Victoire |
|---|---|---|
| **Standard** | vers soi | tout fermé **et** score ≥ adversaires |
| **Cut-Throat** | vers les adversaires non fermés | tout fermé **et** score ≤ adversaires |
| **Sans points** | aucun | premier à tout fermer |

Convention : en Standard/Cut-Throat, l'égalité au score suffit (≥ / ≤) pour
valider la victoire dès que toutes les cibles sont fermées.

### Architecture & ajout d'une variante

Toute la logique propre à une variante (circulation des points, condition de
victoire, libellés) est centralisée dans **un seul objet** `VARIANTS` de
[`src/core/cricket/rules.ts`](src/core/cricket/rules.ts). Ajouter une variante
(p. ex. *Wild Mickey*, *Random/Scram*) = une entrée dans `VARIANTS` + une option
dans le `Segmented` de `CricketSetup` ; le moteur, le tableau et le clavier
intelligent la consomment sans modification. Le jeu de cibles est produit par
`buildTargets(config)` ([`targets.ts`](src/core/cricket/targets.ts)), prêt à
accepter des cibles aléatoires ou des variantes « Tactics » (doubles/triples).

## Ajouter un mode de jeu

Le mode Cricket ci-dessus est l'illustration concrète de cette recette :

1. Créer `src/modes/<mode>/` avec un état, un réducteur pur et deux écrans.
2. Exporter un `GameModeDefinition` (`createGame`, `reduce`, `SetupScreen`, `GameScreen`).
3. L'ajouter à la liste de `src/modes/registry.ts`. Rien d'autre à toucher :
   navigation, persistance, undo et reprise de partie sont fournis par le shell.

## Préparation du futur

- **Sets** : `legsToWin` existe déjà ; les sets sont un niveau au-dessus
  (compteur `setsWon` + condition de fin dans `engine.ts`), sans impact UI majeur.
- **Killer / Shanghai / High Score** : nouveaux dossiers sous `modes/` via le
  contrat `GameModeDefinition` — Around the Clock et Cricket servent de modèles
  (cibles en union discriminée, règles centralisées dans un objet de variantes).
- **Profils locaux / statistiques globales** : le moteur produit déjà un
  journal (`state.log`) et des statistiques par joueur — un futur slice
  `profiles` du store peut les agréger à la fin de chaque partie.
- **Comptes / classements / cloud / en ligne** : le cœur étant pur et
  sérialisable (state + actions), il peut être rejoué côté serveur tel quel.

## Réglages

- **Thème** : Dark Classic, Light Professional, Tournament Color (accueil).
- **Clavier intelligent** : surbrillance des meilleures fléchettes à
  l'approche d'un checkout — désactivable (accueil).

Note de migration : les sauvegardes de l'ancienne version (double out booléen)
sont réinitialisées proprement au premier lancement de cette version.
