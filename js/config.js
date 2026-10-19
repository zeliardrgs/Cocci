/* =========================================================
   CONFIG.JS — Tous les réglages du jeu au même endroit.
   Tu peux modifier les valeurs ci-dessous sans risque :
   enregistre le fichier, puis recharge la page (F5).
   ========================================================= */

window.Cocci = window.Cocci || {};

Cocci.CONFIG = {

  /* ---------- MODE TEST ----------
     true  = tous les temps sont divisés par 60 (1 heure = 1 minute)
     false = temps réel                                               */
  MODE_TEST: true,
  DIVISEUR_MODE_TEST: 60,

  /* ---------- RARETÉS ----------
     points  : valeur d'un gène de cette rareté
     couleur : couleur de la bordure et de l'étiquette               */
  RARETES: [
    { id: 'commune',     nom: 'Commune',     points: 1, couleur: '#8f9aa0' },
    { id: 'peuCommune',  nom: 'Peu commune', points: 2, couleur: '#4caf68' },
    { id: 'rare',        nom: 'Rare',        points: 3, couleur: '#3d8fd6' },
    { id: 'epique',      nom: 'Épique',      points: 4, couleur: '#9457d6' },
    { id: 'legendaire',  nom: 'Légendaire',  points: 5, couleur: '#d99a1e' }
  ],

  /* Rareté globale d'une coccinelle = somme des points de ses 3 gènes */
  RARETE_GLOBALE: [
    { min: 3,  max: 5,  rarete: 'commune' },
    { min: 6,  max: 7,  rarete: 'peuCommune' },
    { min: 8,  max: 10, rarete: 'rare' },
    { min: 11, max: 13, rarete: 'epique' },
    { min: 14, max: 15, rarete: 'legendaire' }
  ],

  /* ---------- GÈNES ----------
     id      : nom interne (ne pas changer une fois le jeu lancé)
     nom     : nom affiché dans le jeu (nom de pierre)
     teinte  : la couleur en mots, affichée en petit pour aider
     rarete  : 1 = commune … 5 = légendaire (= nombre de points)
     couleur : couleur utilisée pour le dessin
     effet   : (optionnel) effet spécial dessiné par le jeu
               'crystal', 'prime' (carapace) · 'silver', 'rainbow' (motif)
     degrade / couleurs : (optionnel) couleurs utilisées par l'effet
     mutationSeulement : true = ne s'obtient QUE par mutation
                         (jamais en boutique ni chez les sauvages)     */
  GENES: {
    carapace: [
      { id: 'ruby',     nom: 'Ruby',     teinte: 'rouge',       rarete: 1, couleur: '#D7263D' },
      { id: 'amber',    nom: 'Amber',    teinte: 'jaune',       rarete: 1, couleur: '#F5B700' },
      { id: 'jaspe',    nom: 'Jaspe',    teinte: 'marron',      rarete: 1, couleur: '#8B5A3C' },
      { id: 'jade',     nom: 'Jade',     teinte: 'vert',        rarete: 2, couleur: '#2FA36B' },
      { id: 'lapis',    nom: 'Lapis',    teinte: 'bleu',        rarete: 2, couleur: '#1F4E9C' },
      { id: 'quartz',   nom: 'Quartz',   teinte: 'rose',        rarete: 3, couleur: '#F4A6C6' },
      { id: 'azurite',  nom: 'Azurite',  teinte: 'bleu clair',  rarete: 3, couleur: '#6EC6F0' },
      { id: 'amethyst', nom: 'Amethyst', teinte: 'violet',      rarete: 4, couleur: '#9B5DE5' },
      { id: 'crystal',  nom: 'Crystal',  teinte: 'transparent', rarete: 5, couleur: '#D9F1FA',
        effet: 'crystal', mutationSeulement: true },
      { id: 'prime',    nom: 'Prime',    teinte: 'arc-en-ciel', rarete: 5, couleur: '#E879F9',
        effet: 'prime', mutationSeulement: true,
        degrade: ['#FF595E', '#FF924C', '#FFCA3A', '#8AC926', '#1982C4', '#6A4C93'] }
    ],
    motif: [
      { id: 'pois',    nom: 'Pois',    rarete: 1 },
      { id: 'rayures', nom: 'Rayures', rarete: 2 },
      { id: 'coeurs',  nom: 'Cœurs',   rarete: 3 },
      { id: 'etoiles', nom: 'Étoiles', rarete: 4 },
      { id: 'spirale', nom: 'Spirale', rarete: 5, mutationSeulement: true }
    ],
    couleurMotif: [
      { id: 'coal',    nom: 'Coal',    teinte: 'noir',        rarete: 1, couleur: '#1B1B1B' },
      { id: 'carmin',  nom: 'Carmin',  teinte: 'rouge',       rarete: 1, couleur: '#B3001B' },
      { id: 'canari',  nom: 'Canari',  teinte: 'jaune',       rarete: 2, couleur: '#FFE135' },
      { id: 'lime',    nom: 'Lime',    teinte: 'vert citron', rarete: 2, couleur: '#A7E22E' },
      { id: 'rosea',   nom: 'Rosea',   teinte: 'rose',        rarete: 3, couleur: '#FF7EB6' },
      { id: 'cyan',    nom: 'Cyan',    teinte: 'cyan',        rarete: 3, couleur: '#00B4D8' },
      { id: 'violet',  nom: 'Violet',  teinte: 'violet',      rarete: 4, couleur: '#7B2CBF' },
      { id: 'indigo',  nom: 'Indigo',  teinte: 'indigo',      rarete: 4, couleur: '#3A0CA3' },
      { id: 'silver',  nom: 'Silver',  teinte: 'argent',      rarete: 5, couleur: '#C9CED4',
        effet: 'silver', mutationSeulement: true,
        degrade: ['#8E979F', '#E9EDF1', '#FFFFFF', '#AEB6BE', '#F4F6F8'] },
      { id: 'rainbow', nom: 'Rainbow', teinte: 'arc-en-ciel', rarete: 5, couleur: '#FF595E',
        effet: 'rainbow', mutationSeulement: true,
        couleurs: ['#FF595E', '#FF924C', '#FFCA3A', '#8AC926', '#1982C4', '#6A4C93'] }
    ]
  },

  /* ---------- LISIBILITÉ DES MOTIFS ----------
     Quand la couleur du motif ressemble trop à la carapace, le jeu ajoute
     un contour plus marqué (sombre ou clair) autour du motif.
     Plus le seuil est haut, plus le contour apparaît souvent.          */
  SEUIL_CONTRASTE_MOTIF: 1.8,

  /* ---------- CONVERSION DES ANCIENNES SAUVEGARDES ----------
     Si une sauvegarde contient une couleur qui n'existe plus, elle est
     remplacée par celle indiquée ici (sinon par la première de la liste). */
  CONVERSIONS: {
    carapace: {
      rouge: 'ruby', jaune: 'amber', orange: 'amber', vert: 'jade',
      bleu: 'lapis', rose: 'quartz', violet: 'amethyst', dore: 'amber'
    },
    couleurMotif: {
      noir: 'coal', blanc: 'canari', jaune: 'canari', arcEnCiel: 'rainbow'
    }
  },

  /* ---------- REPRODUCTION ---------- */
  REPRODUCTION: {
    PROBA_MELANGE: 0.25,         // 0.25 = 25 % de chance de mélanger les carapaces
    PROBA_MUTATION: 0.05,        // 0.05 = 5 % de chance de mutation, pour chaque gène
    REPOS_COUPLE_HEURES: 12,     // un même couple attend 12 h entre deux pontes

    // Recettes de mélange de carapace (l'ordre des parents n'a pas d'importance)
    MELANGES: [
      { a: 'ruby',  b: 'amber',   resultat: 'jaspe' },
      { a: 'lapis', b: 'amber',   resultat: 'jade' },
      { a: 'ruby',  b: 'lapis',   resultat: 'amethyst' },
      { a: 'ruby',  b: 'azurite', resultat: 'quartz' },
      { a: 'lapis', b: 'jade',    resultat: 'azurite' }
    ]
  },

  /* ---------- CROISSANCE ----------
     Durée de chaque stade, en heures, selon la rareté globale du bébé.
     (En mode test, 1 heure = 1 minute.)                               */
  CROISSANCE: {
    oeuf:   { commune: 2,  peuCommune: 3,  rare: 4,  epique: 6,  legendaire: 8 },
    larve:  { commune: 6,  peuCommune: 8,  rare: 10, epique: 12, legendaire: 16 },
    nymphe: { commune: 16, peuCommune: 19, rare: 22, epique: 30, legendaire: 36 }
  },

  /* ---------- ÉCONOMIE (monnaie : pièces d'or) ---------- */
  ECONOMIE: {
    // Prix de vente d'un adulte selon sa rareté globale
    PRIX_VENTE: { commune: 5, peuCommune: 15, rare: 40, epique: 100, legendaire: 300 },

    // Bonus (en pièces d'or) quand une combinaison est vue pour la première fois
    RECOMPENSE_DECOUVERTE: 10,

    BOUTIQUE: {
      // Coccinelle sauvage : adulte dont les 3 gènes sont communs
      SAUVAGE: { prix: 30, rareteMax: 1 },
      // Coccinelle mystère : un gène de rareté garantie, les autres jusqu'à rareteMaxAutres
      MYSTERE: { prix: 120, rareteGarantie: 3, rareteMaxAutres: 3 },
      // Place d'élevage : 100, puis +50 à chaque achat (100, 150, 200…)
      PLACE: { prixDepart: 100, hausse: 50 }
    }
  },

  /* ---------- MISSIONS ----------
     Une mission par niveau, affichées côte à côte.
     nbGenes   : nombre de gènes demandés (les autres sont libres)
     rareteMax : rareté maximale des gènes demandés (1 = commune … 4 = épique)
     sauvage   : true = une coccinelle sauvage offerte en plus            */
  MISSIONS: {
    DELAI_REMPLACEMENT_HEURES: 4, // une mission accomplie ou refusée revient 4 h plus tard
    NB_CROISEMENTS_MAX: 2,        // les gènes demandés s'obtiennent en 2 croisements maximum
    NIVEAUX: [
      { id: 'facile',    nom: 'Facile',    nbGenes: 1, rareteMin: 1, rareteMax: 2, pieces: 20,   sauvage: false },
      { id: 'moyenne',   nom: 'Moyenne',   nbGenes: 2, rareteMin: 1, rareteMax: 3, pieces: 60,   sauvage: false },
      { id: 'difficile', nom: 'Difficile', nbGenes: 3, rareteMin: 1, rareteMax: 4, pieces: 200,  sauvage: true }
    ]
  },

  /* ---------- SAUVEGARDE ---------- */
  SAUVEGARDE_AUTO_SECONDES: 5,   // le jeu s'enregistre tout seul toutes les 5 s
  RESET_NB_TOUCHES: 5,           // toucher 5 fois le titre « Coccinelles » = réinitialiser

  /* ---------- DÉPART D'UNE NOUVELLE PARTIE ---------- */
  DEPART: {
    pieces: 50,     // pièces d'or au départ
    places: 6,
    coccinelles: [
      { carapace: 'ruby',  motif: 'pois',    couleurMotif: 'coal' },   // rouge à pois noirs
      { carapace: 'amber', motif: 'rayures', couleurMotif: 'canari' }  // jaune à rayures (blanc → Canari)
    ]
  },

  /* ---------- DESSIN ---------- */
  COULEUR_CORPS: '#333333',       // tête et antennes
  COULEUR_COLLERETTE: '#EAC791',  // partie claire entre la tête et la carapace
  COULEUR_SILHOUETTE: '#cfdcc6',  // coccinelle pas encore choisie / pas découverte
  COULEUR_OEUF: '#fff1c7',
  COULEUR_LARVE: '#4a4a55',
  COULEUR_NYMPHE_FOND: '#d8c8a8', // la nymphe mélange sa vraie couleur avec ce beige
  DOSAGE_COULEUR_NYMPHE: 0.55,    // 0 = tout beige, 1 = vraie couleur
  COULEUR_INCONNUE: '#c9d3c2',     // carapace « ? » sur les missions
  COULEUR_MOTIF_INCONNU: '#8b9588' // couleur de motif « ? » sur les missions
};
