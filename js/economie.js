/* =========================================================
   ECONOMIE.JS — Pucerons, places d'élevage, ventes, boutique,
   et bonus de première découverte.
   Tous les prix se règlent dans config.js (ECONOMIE).
   ========================================================= */

Cocci.Economie = (function () {
  var CONFIG = Cocci.CONFIG;
  var ECO = CONFIG.ECONOMIE;
  var G = Cocci.Genetique;

  /* ---------- Places ---------- */

  // Places encore libres (œufs, larves et nymphes comptent aussi)
  function placesLibres(etat) {
    return Math.max(0, etat.places - etat.coccinelles.length);
  }

  function prixPlace(etat) {
    return ECO.BOUTIQUE.PLACE.prixDepart + ECO.BOUTIQUE.PLACE.hausse * etat.placesAchetees;
  }

  /* ---------- Découvertes ---------- */

  // Note une combinaison dans le Coccidex. Si c'est une première : bonus de pucerons.
  // Renvoie true si c'était une nouvelle combinaison.
  function decouvrir(etat, genes, moment) {
    var cle = G.cle(genes);
    if (etat.coccidex[cle]) return false;
    etat.coccidex[cle] = moment || Cocci.Temps.maintenant();
    etat.pucerons += ECO.RECOMPENSE_DECOUVERTE;
    return true;
  }

  /* ---------- Vente ---------- */

  // Prix de vente d'un adulte, selon sa rareté globale
  function prixVente(c) {
    return ECO.PRIX_VENTE[G.rareteGlobale(c.genes).id];
  }

  // Vend un adulte : il quitte l'élevage, les pucerons sont ajoutés.
  // Renvoie le prix obtenu (0 si la vente est impossible).
  function vendre(etat, id) {
    var i = etat.coccinelles.findIndex(function (c) { return c.id === id; });
    if (i < 0 || etat.coccinelles[i].stade !== 'adulte') return 0;
    var prix = prixVente(etat.coccinelles[i]);
    etat.coccinelles.splice(i, 1);
    etat.pucerons += prix;
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
    etat.coccinelles.push(c);
    return { coccinelle: c, nouvelle: decouvrir(etat, genes) };
  }

  /* ---------- Boutique ---------- */

  var ARTICLES = ['sauvage', 'mystere', 'place'];

  function prix(etat, article) {
    if (article === 'sauvage') return ECO.BOUTIQUE.SAUVAGE.prix;
    if (article === 'mystere') return ECO.BOUTIQUE.MYSTERE.prix;
    return prixPlace(etat);
  }

  // Raison pour laquelle on ne peut pas acheter (ou null si c'est possible)
  function empechementAchat(etat, article) {
    if (article !== 'place' && !placesLibres(etat)) return 'Élevage plein';
    if (etat.pucerons < prix(etat, article)) return 'Pas assez de pucerons';
    return null;
  }

  // Achète un article. Renvoie { coccinelle, nouvelle } pour une coccinelle,
  // { place: true } pour une place, ou null si l'achat est impossible.
  function acheter(etat, article) {
    if (empechementAchat(etat, article)) return null;
    etat.pucerons -= prix(etat, article);
    if (article === 'place') {
      etat.places += 1;
      etat.placesAchetees += 1;
      return { place: true };
    }
    return accueillir(etat, article === 'sauvage' ? genesSauvage() : genesMystere());
  }

  return {
    placesLibres: placesLibres,
    prixPlace: prixPlace,
    decouvrir: decouvrir,
    prixVente: prixVente,
    vendre: vendre,
    genesSauvage: genesSauvage,
    accueillir: accueillir,
    ARTICLES: ARTICLES,
    prix: prix,
    empechementAchat: empechementAchat,
    acheter: acheter
  };
})();
