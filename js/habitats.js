/* =========================================================
   HABITATS.JS — Où vivent les coccinelles.
   – La nurserie accueille les œufs.
   – Les habitats accueillent les petites et les adultes
     (c.habitat = numéro de l'habitat : 0 pour « Habitat 1 »…).
   – Chaque œuf a une place réservée dans les habitats : à l'éclosion,
     il y a donc toujours de la place pour la petite.
   Les réglages sont dans config.js (HABITATS).
   ========================================================= */

Cocci.Habitats = (function () {
  var REGLES = Cocci.CONFIG.HABITATS;

  function nom(i) { return 'Habitat ' + (i + 1); }

  function oeufs(etat) {
    return etat.coccinelles.filter(function (c) { return c.stade === 'oeuf'; });
  }

  function placesNurserie(etat) {
    return Math.max(0, REGLES.NURSERIE_PLACES - oeufs(etat).length);
  }

  function capacite(etat) {
    return etat.habitats * REGLES.PLACES_PAR_HABITAT;
  }

  // Coccinelles (petites et adultes) qui vivent dans l'habitat n° i
  function habitants(etat, i) {
    return etat.coccinelles.filter(function (c) { return c.stade !== 'oeuf' && c.habitat === i; });
  }

  // Places libres dans les habitats, une fois réservées celles des œufs
  function placesLibres(etat) {
    return Math.max(0, capacite(etat) - etat.coccinelles.length);
  }

  // Premier habitat qui a de la place (ou -1)
  function habitatLibre(etat) {
    for (var i = 0; i < etat.habitats; i++) {
      if (habitants(etat, i).length < REGLES.PLACES_PAR_HABITAT) return i;
    }
    return -1;
  }

  // Installe une petite ou un adulte dans le premier habitat libre
  function installer(etat, c) {
    var i = habitatLibre(etat);
    c.habitat = i >= 0 ? i : 0;
  }

  // Raison pour laquelle on ne peut pas pondre (ou null)
  function empechementPonte(etat) {
    if (!placesNurserie(etat)) {
      return 'La nurserie est pleine (' + REGLES.NURSERIE_PLACES + ' œufs). Attends une éclosion.';
    }
    if (!placesLibres(etat)) {
      return 'Plus de place dans les habitats pour le futur bébé. Vends une coccinelle ou achète un habitat.';
    }
    return null;
  }

  // Déménage une coccinelle vers l'habitat n° i (s'il a de la place)
  function demenager(etat, c, i) {
    if (!c || c.stade === 'oeuf' || i < 0 || i >= etat.habitats || c.habitat === i) return false;
    if (habitants(etat, i).length >= REGLES.PLACES_PAR_HABITAT) return false;
    c.habitat = i;
    return true;
  }

  // Remet tout en ordre (anciennes sauvegardes, réglages modifiés…) :
  // chaque petite ou adulte a un habitat valide, sans dépasser la capacité.
  function ranger(etat) {
    etat.habitats = Math.max(etat.habitats || 0, REGLES.AU_DEPART);
    // assez d'habitats pour tout le monde (on n'enlève jamais une coccinelle)
    while (capacite(etat) < etat.coccinelles.length) etat.habitats++;
    etat.coccinelles.forEach(function (c) {
      if (c.stade === 'oeuf') { c.habitat = null; return; }
      var valide = typeof c.habitat === 'number' && c.habitat >= 0 && c.habitat < etat.habitats;
      if (!valide) c.habitat = null;
    });
    etat.coccinelles.forEach(function (c) {
      if (c.stade !== 'oeuf' && c.habitat === null) installer(etat, c);
    });
    return etat;
  }

  return {
    nom: nom,
    oeufs: oeufs,
    placesNurserie: placesNurserie,
    capacite: capacite,
    habitants: habitants,
    placesLibres: placesLibres,
    habitatLibre: habitatLibre,
    installer: installer,
    empechementPonte: empechementPonte,
    demenager: demenager,
    ranger: ranger
  };
})();
