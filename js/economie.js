/* =========================================================
   ECONOMIE.JS — Pièces d'or, ventes, boutique, habitats,
   et bonus de première découverte.
   Tous les prix se règlent dans config.js (ECONOMIE).
   ========================================================= */

Cocci.Economie = (function () {
  var CONFIG = Cocci.CONFIG;
  var ECO = CONFIG.ECONOMIE;
  var G = Cocci.Genetique;

  /* ---------- Habitats ---------- */

  function prixHabitat(etat) {
    return ECO.BOUTIQUE.HABITAT.prixDepart + ECO.BOUTIQUE.HABITAT.hausse * etat.habitatsAchetes;
  }

  /* ---------- Découvertes ---------- */

  // Note une combinaison dans le Coccidex. Si c'est une première : bonus de pièces d'or.
  // Renvoie true si c'était une nouvelle combinaison.
  function decouvrir(etat, genes, moment) {
    var cle = G.cle(genes);
    if (etat.coccidex[cle]) return false;
    etat.coccidex[cle] = moment || Cocci.Temps.maintenant();
    etat.pieces += ECO.RECOMPENSE_DECOUVERTE;
    return true;
  }

  /* ---------- Vente ---------- */

  // Prix de vente d'un adulte, selon sa rareté globale
  function prixVente(c) {
    return ECO.PRIX_VENTE[G.rareteGlobale(c.genes).id];
  }

  // Vend un adulte : il quitte l'élevage, les pièces d'or sont ajoutées.
  // Renvoie le prix obtenu (0 si la vente est impossible).
  function vendre(etat, id) {
    var i = etat.coccinelles.findIndex(function (c) { return c.id === id; });
    if (i < 0 || etat.coccinelles[i].stade !== 'adulte') return 0;
    var prix = prixVente(etat.coccinelles[i]);
    etat.coccinelles.splice(i, 1);
    etat.pieces += prix;
    return prix;
  }

  /* ---------- Faire grandir une petite coccinelle ---------- */

  // Prix pour devenir adulte tout de suite : X pièces par heure restante (heure entamée = heure due)
  function prixAcceleration(c) {
    var info = Cocci.Croissance.info(c);
    if (info.stade !== 'petite') return 0;
    var heures = Math.ceil(info.resteTotal / Cocci.Temps.heures(1));
    return Math.max(1, heures) * CONFIG.ACCELERATION.PRIX_PAR_HEURE;
  }

  // Raison pour laquelle on ne peut pas faire grandir (ou null si c'est possible)
  function empechementAcceleration(etat, c) {
    if (!c || c.stade !== 'petite') return 'Seule une petite coccinelle peut grandir plus vite';
    if (etat.pieces < prixAcceleration(c)) return 'Pas assez de pièces d’or';
    return null;
  }

  // Paie et rend la coccinelle adulte. Renvoie le prix payé (0 si impossible).
  // (Le passage à l'âge adulte est ensuite constaté par Croissance.mettreAJour.)
  function accelerer(etat, c) {
    if (empechementAcceleration(etat, c)) return 0;
    var prix = prixAcceleration(c);
    etat.pieces -= prix;
    Cocci.Croissance.avancer(c, Infinity);
    return prix;
  }

  /* ---------- Coccinelles de la boutique ---------- */

  // Sauvage : les 3 gènes sont communs
  function genesSauvage() {
    return G.aleatoire({ sansMutationSeulement: true, rareteMax: ECO.BOUTIQUE.SAUVAGE.rareteMax });
  }

  // Mystère : un gène (au hasard) a la rareté garantie, les autres sont libres
  function genesMystere() {
    var regles = ECO.BOUTIQUE.MYSTERE;
    var genes = G.aleatoire({ sansMutationSeulement: true, rareteMax: regles.rareteMaxAutres });
    var type = G.auHasard(G.TYPES);
    var choix = G.valeursDeRarete(type, regles.rareteGarantie).filter(function (g) { return !g.mutationSeulement; });
    genes[type] = G.auHasard(choix).id;
    return genes;
  }

  // Ajoute une coccinelle adulte à l'élevage (achat ou récompense)
  // Renvoie { coccinelle, nouvelle }
  function accueillir(etat, genes) {
    var c = G.creerCoccinelle(genes);
    Cocci.Habitats.installer(etat, c);
    etat.coccinelles.push(c);
    return { coccinelle: c, nouvelle: decouvrir(etat, genes) };
  }

  /* ---------- Boutique ---------- */

  var ARTICLES = ['sauvage', 'mystere', 'habitat'];

  function prix(etat, article) {
    if (article === 'sauvage') return ECO.BOUTIQUE.SAUVAGE.prix;
    if (article === 'mystere') return ECO.BOUTIQUE.MYSTERE.prix;
    return prixHabitat(etat);
  }

  // Raison pour laquelle on ne peut pas acheter (ou null si c'est possible)
  function empechementAchat(etat, article) {
    if (article !== 'habitat' && !Cocci.Habitats.placesLibres(etat)) return 'Habitats pleins';
    if (etat.pieces < prix(etat, article)) return 'Pas assez de pièces d’or';
    return null;
  }

  // Achète un article. Renvoie { coccinelle, nouvelle } pour une coccinelle,
  // { habitat: n° du nouvel habitat }, ou null si l'achat est impossible.
  function acheter(etat, article) {
    if (empechementAchat(etat, article)) return null;
    etat.pieces -= prix(etat, article);
    if (article === 'habitat') {
      etat.habitats += 1;
      etat.habitatsAchetes += 1;
      return { habitat: etat.habitats - 1 };
    }
    return accueillir(etat, article === 'sauvage' ? genesSauvage() : genesMystere());
  }

  return {
    prixHabitat: prixHabitat,
    decouvrir: decouvrir,
    prixVente: prixVente,
    vendre: vendre,
    prixAcceleration: prixAcceleration,
    empechementAcceleration: empechementAcceleration,
    accelerer: accelerer,
    genesSauvage: genesSauvage,
    accueillir: accueillir,
    ARTICLES: ARTICLES,
    prix: prix,
    empechementAchat: empechementAchat,
    acheter: acheter
  };
})();
