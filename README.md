# Oche — Compteur de fléchettes (PWA)

Compteur de fléchettes mobile-first. Six modes : **301 / 501** (règles
d'entrée/sortie complètes, suggestions de finish, clavier intelligent),
**Around the Clock** (variantes de segments, ordres dont l'ordre réel du
plateau, bull final, multi-touches, chrono), **Cricket** (Standard, Cut-Throat,
Sans points), **Shanghai** (manches 1→7/10/20, ordre croissant ou aléatoire,
victoire Shanghai S+D+T), **Golf** (9 ou 18 trous, scoring Standard ou Au plus
court) et **Killer** (vies configurables, entrée Bull/Double/Prison, soin sur
élimination). Options accessibles partout via l'engrenage en en-tête. Thèmes,
historique coulissant, statistiques en direct, écran de victoire, undo illimité,
partie persistée hors-ligne.

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
node --experimental-strip-types tests/shanghai.test.mjs # moteur Shanghai
node --experimental-strip-types tests/golf.test.mjs     # moteur Golf
node --experimental-strip-types tests/killer.test.mjs   # moteur Killer
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
│   ├── cricket/       # Moteur Cricket (pur, indépendant) :
│   │   ├── targets.ts #   jeu de cibles (20→15 + Bull)
│   │   ├── rules.ts   #   VARIANTS : score, distribution des points, victoire
│   │   ├── engine.ts  #   réducteur : marques, fermeture, score, MPR
│   │   └── format.ts  #   libellés des variantes et cibles
│   ├── shanghai/      # Moteur Shanghai (pur, indépendant) :
│   │   ├── targets.ts #   suite des manches (1→N, croissant ou aléatoire)
│   │   ├── rules.ts   #   score, détection du Shanghai (S+D+T)
│   │   ├── engine.ts  #   réducteur : manches, rotation, victoire Shanghai
│   │   └── format.ts  #   libellés des plages et de l'ordre
│   ├── golf/          # Moteur Golf (pur, indépendant) :
│   │   ├── targets.ts #   numéros des trous (1→N)
│   │   ├── rules.ts   #   VARIANTS : score d'un trou, par, provisoire
│   │   ├── engine.ts  #   réducteur : trous, rotation, score relatif au par
│   │   └── format.ts  #   libellés des variantes et score relatif
│   └── killer/        # Moteur Killer (pur, indépendant) :
│       ├── rules.ts   #   statuts, recommandations (numéros adverses)
│       ├── engine.ts  #   réducteur : entrée, attaque, prison, élimination
│       └── format.ts  #   libellés d'entrée, statuts, évènements de volée
├── modes/
│   ├── types.ts       # Contrat GameModeDefinition (createGame, reduce, écrans)
│   ├── registry.ts    # Registre — ajouter un mode = 1 dossier + 1 ligne
│   ├── x01/           # Écrans du mode 301/501
│   ├── atc/           # Écrans du mode Around the Clock
│   ├── cricket/       # Écrans Cricket (Setup, Game, Board)
│   ├── shanghai/      # Écrans Shanghai (Setup, Game, PlayerCard)
│   ├── golf/          # Écrans Golf (Setup, Game, Scorecard)
│   └── killer/        # Écrans Killer (Setup, Game, PlayerCard)
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

## Shanghai

Une **manche par numéro** : à la manche *n* on ne vise que le numéro *n* avec 3
fléchettes, et on marque `numéro × multiplicateur` (les autres numéros et le
bull ne comptent pas). À la fin des manches, le **score le plus haut gagne**.

Règle iconique — le **Shanghai** : réussir **Simple + Double + Triple** du numéro
visé dans une même volée donne la **victoire immédiate**, quel que soit le score.

| Réglage | Options |
|---|---|
| **Manches** | 1 → 7 (classique), 1 → 10, 1 → 20 |
| **Ordre des numéros** | Croissant, Aléatoire (*Random Shanghai*) |
| **Victoire Shanghai** | activable / désactivable |

La suite des manches est produite par `buildTargets(config, rng)`
([`targets.ts`](src/core/shanghai/targets.ts)) — l'ordre aléatoire est ré-tiré à
chaque revanche. La détection du Shanghai et le score sont isolés dans
[`rules.ts`](src/core/shanghai/rules.ts) (`isShanghai`, `scoreFor`).

## Golf

Comme au golf : **9 ou 18 trous**, le trou *n* correspond au **numéro *n*** sur
la cible (3 fléchettes par trou). On marque des **coups** et le **score le plus
bas gagne**. Le classement se juge au score relatif au par (par 3 par trou).

| Réglage | Options |
|---|---|
| **Trous** | 9 (1 → 9), 18 (1 → 18) |
| **Score** | **Standard** (meilleure fléchette : triple = 1, double = 2, simple = 3, manqué = 4) · **Au plus court** (nombre de fléchettes pour toucher, manqué = 4) |

Les deux méthodes de score vivent dans l'objet `VARIANTS` de
[`rules.ts`](src/core/golf/rules.ts) (`holeScore`) — ajouter un mode de score =
une entrée. La carte de parcours code les coups en couleur (eagle / birdie / par
/ bogey).

## Killer

Jeu d'élimination. Chaque joueur reçoit un **numéro** (tiré au lancement) et des
**vies**. Il faut d'abord **entrer** (devenir « tueur »), puis on retire des vies
aux adversaires en touchant **leur** numéro — simple 1, double 2, triple 3 vies.
Quand un joueur tombe à 0 vie il est éliminé ; **dernier survivant gagne**.

| Réglage | Options |
|---|---|
| **Vies** | 3, 4, 5, 7 |
| **Entrée** | **Bull** (toucher 25/50) · **Double** (le double de son numéro) · **Prison** |
| **Soin sur élimination** | éliminer un adversaire restaure toutes vos vies |

**Règle Prison** : tout le monde commence enfermé ; il faut faire **25 ou 50**
pour sortir ; un joueur déjà sorti qui refait **25 ou 50** renvoie **tous les
autres en prison** (ils doivent ré-évader). Un tueur enfermé ne peut plus
attaquer tant qu'il n'est pas ressorti.

La logique (entrée, attaque, prison, soin, victoire) est dans le réducteur pur
[`engine.ts`](src/core/killer/engine.ts) ; les évènements de volée (entrée,
sortie, retrait de vies, élimination…) sont structurés et mis en forme dans
[`format.ts`](src/core/killer/format.ts).

## Ajouter un mode de jeu

Les modes Cricket, Shanghai, Golf et Killer ci-dessus illustrent concrètement cette recette :

1. Créer `src/modes/<mode>/` avec un état, un réducteur pur et deux écrans.
2. Exporter un `GameModeDefinition` (`createGame`, `reduce`, `SetupScreen`, `GameScreen`).
3. L'ajouter à la liste de `src/modes/registry.ts`. Rien d'autre à toucher :
   navigation, persistance, undo et reprise de partie sont fournis par le shell.

## Préparation du futur

- **Sets** : `legsToWin` existe déjà ; les sets sont un niveau au-dessus
  (compteur `setsWon` + condition de fin dans `engine.ts`), sans impact UI majeur.
- **High Score / Gotcha / Halve It** : nouveaux dossiers sous `modes/` via le
  contrat `GameModeDefinition` — les six modes existants servent de modèles
  (cibles/manches/trous générés, variantes centralisées, état par joueur).
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
