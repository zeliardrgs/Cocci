/* =========================================================
   CROISSANCE.JS — Œuf → Larve → Nymphe → Adulte, en temps réel.
   Le stade se calcule à partir du moment de la ponte : le temps
   continue donc de compter même quand le jeu est fermé.
   Les durées se règlent dans config.js (CROISSANCE).
   ========================================================= */

Cocci.Croissance = (function () {
  var CONFIG = Cocci.CONFIG;
  var G = Cocci.Genetique;
  var T = Cocci.Temps;

  var STADES = ['oeuf', 'larve', 'nymphe', 'adulte'];
  var NOMS = { oeuf: 'Œuf', larve: 'Larve', nymphe: 'Nymphe', adulte: 'Adulte' };

  // Durée (ms) d'un stade pour cette coccinelle, selon sa rareté
  function dureeStade(c, stade) {
    return T.heures(CONFIG.CROISSANCE[stade][G.rareteGlobale(c.genes).id]);
  }

  /* Où en est cette coccinelle ?
     Renvoie { stade, progression (0 à 1), resteStade (ms), resteTotal (ms),
               prochain (stade suivant), finStade (moment où il change) } */
  function info(c, maintenant) {
    maintenant = maintenant || T.maintenant();
    if (c.stade === 'adulte') return { stade: 'adulte', progression: 1, resteStade: 0, resteTotal: 0, prochain: null };

    var debut = c.ponte;
    var resteTotal = 0;
    var resultat = null;
    for (var i = 0; i < 3; i++) {
      var stade = STADES[i];
      var duree = dureeStade(c, stade);
      var fin = debut + duree;
      if (!resultat && maintenant < fin) {
        resultat = {
          stade: stade,
          progression: (maintenant - debut) / duree,
          resteStade: fin - maintenant,
          prochain: STADES[i + 1],
          finStade: fin
        };
      }
      if (resultat) resteTotal += Math.min(duree, fin - maintenant);
      debut = fin;
    }
    if (!resultat) return { stade: 'adulte', progression: 1, resteStade: 0, resteTotal: 0, prochain: null, finStade: debut };
    resultat.resteTotal = resteTotal;
    return resultat;
  }

  // Moment exact où la coccinelle est (ou sera) devenue adulte
  function momentAdulte(c) {
    return c.ponte + dureeStade(c, 'oeuf') + dureeStade(c, 'larve') + dureeStade(c, 'nymphe');
  }

  /* Fait avancer toutes les coccinelles jusqu'à « maintenant ».
     Renvoie la liste des changements : { coccinelle, de, vers, nouvelle }
     nouvelle = true si c'est la première fois qu'on voit cette combinaison
     (le bonus de découverte est alors déjà ajouté aux pucerons).       */
  function mettreAJour(etat, maintenant) {
    maintenant = maintenant || T.maintenant();
    var changements = [];
    etat.coccinelles.forEach(function (c) {
      if (c.stade === 'adulte') return;
      var nouveau = info(c, maintenant).stade;
      if (nouveau === c.stade) return;

      var changement = { coccinelle: c, de: c.stade, vers: nouveau, nouvelle: false };
      c.stade = nouveau;
      if (nouveau === 'adulte') {
        c.adulteDepuis = momentAdulte(c);
        // ajout au Coccidex (+ bonus de pucerons si c'est une première)
        changement.nouvelle = Cocci.Economie.decouvrir(etat, c.genes, c.adulteDepuis);
      }
      changements.push(changement);
    });
    return changements;
  }

  return {
    STADES: STADES,
    NOMS: NOMS,
    dureeStade: dureeStade,
    info: info,
    mettreAJour: mettreAJour
  };
})();
