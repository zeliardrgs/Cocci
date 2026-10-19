/* =========================================================
   SAUVEGARDE.JS — L'état de la partie et son enregistrement
   automatique dans le navigateur (localStorage).
   ========================================================= */

Cocci.Sauvegarde = (function () {
  var CLE = 'coccinelles-sauvegarde';
  var VERSION = 1;

  // Une partie toute neuve, d'après les réglages DEPART de config.js
  function nouvelEtat() {
    var depart = Cocci.CONFIG.DEPART;
    var maintenant = Cocci.Temps.maintenant();
    var etat = {
      version: VERSION,
      creeLe: maintenant,
      derniereSauvegarde: maintenant,
      pucerons: depart.pucerons,
      places: depart.places,
      placesAchetees: 0,
      coccinelles: depart.coccinelles.map(function (genes) {
        return Cocci.Genetique.creerCoccinelle(genes);
      }),
      reposCouples: {}, // « idA+idB » → moment de la dernière ponte
      coccidex: {},     // « rouge-pois-noir » → moment de la découverte
      missions: []      // une case par niveau, remplie au démarrage
    };
    etat.coccinelles.forEach(function (c) {
      etat.coccidex[Cocci.Genetique.cle(c.genes)] = maintenant;
    });
    return etat;
  }

  // Complète une ancienne sauvegarde avec les nouveautés ajoutées depuis
  // (utile quand on ajoutera bonheur, habitats, décorations…)
  function completer(etat) {
    var neuf = nouvelEtat();
    Object.keys(neuf).forEach(function (cle) {
      if (!(cle in etat)) etat[cle] = neuf[cle];
    });
    return etat;
  }

  /* ---------- Conversion des couleurs qui n'existent plus ----------
     Utile quand on change les listes de gènes dans config.js : une
     ancienne couleur est remplacée selon CONVERSIONS (ou par la première
     de la liste) au lieu de casser la partie.                          */
  function convertirGene(type, id) {
    if (Cocci.Genetique.gene(type, id)) return id;
    var table = Cocci.CONFIG.CONVERSIONS[type] || {};
    var cible = table[id];
    if (cible && Cocci.Genetique.gene(type, cible)) return cible;
    return Cocci.CONFIG.GENES[type][0].id;
  }

  function convertirGenes(genes) {
    Cocci.Genetique.TYPES.forEach(function (type) {
      if (genes[type]) genes[type] = convertirGene(type, genes[type]);
    });
  }

  function convertirCouleurs(etat) {
    etat.coccinelles.forEach(function (c) { convertirGenes(c.genes); });

    (etat.missions || []).forEach(function (m) {
      if (m && m.demande) convertirGenes(m.demande);
    });

    // Coccidex : on renomme les combinaisons (si deux fusionnent, on garde la plus ancienne)
    var nouveau = {};
    Object.keys(etat.coccidex).forEach(function (cle) {
      var morceaux = cle.split('-');
      var genes = { carapace: morceaux[0], motif: morceaux[1], couleurMotif: morceaux[2] };
      convertirGenes(genes);
      var nouvelleCle = Cocci.Genetique.cle(genes);
      var moment = etat.coccidex[cle];
      if (!nouveau[nouvelleCle] || moment < nouveau[nouvelleCle]) nouveau[nouvelleCle] = moment;
    });
    etat.coccidex = nouveau;
    return etat;
  }

  // Relit la partie enregistrée, ou renvoie null s'il n'y en a pas
  function charger() {
    try {
      var texte = localStorage.getItem(CLE);
      if (!texte) return null;
      var etat = JSON.parse(texte);
      if (!etat || etat.version !== VERSION) return null;
      return convertirCouleurs(completer(etat));
    } catch (e) {
      return null; // sauvegarde illisible ou navigateur qui bloque le stockage
    }
  }

  var bloque = false; // passe à true après « effacer », le temps de recharger la page

  function enregistrer(etat) {
    if (bloque) return false;
    etat.derniereSauvegarde = Cocci.Temps.maintenant();
    try {
      localStorage.setItem(CLE, JSON.stringify(etat));
      return true;
    } catch (e) {
      return false;
    }
  }

  function effacer() {
    bloque = true;
    try { localStorage.removeItem(CLE); } catch (e) { /* rien à faire */ }
  }

  // Enregistre régulièrement, et aussi quand on quitte ou cache la page
  function demarrerAuto(etat) {
    setInterval(function () { enregistrer(etat); }, Cocci.CONFIG.SAUVEGARDE_AUTO_SECONDES * 1000);
    window.addEventListener('pagehide', function () { enregistrer(etat); });
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'hidden') enregistrer(etat);
    });
  }

  return {
    nouvelEtat: nouvelEtat,
    charger: charger,
    enregistrer: enregistrer,
    effacer: effacer,
    demarrerAuto: demarrerAuto
  };
})();
