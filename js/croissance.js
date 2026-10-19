/* =========================================================
   CROISSANCE.JS — Œuf → Petite coccinelle → Adulte, en temps réel.
   Le stade se calcule à partir du moment de la ponte : le temps
   continue donc de compter même quand le jeu est fermé.
   « avance » = temps de croissance gagné (achat ou mini-jeu).
   Les durées se règlent dans config.js (CROISSANCE).
   ========================================================= */

Cocci.Croissance = (function () {
  var CONFIG = Cocci.CONFIG;
  var G = Cocci.Genetique;
  var T = Cocci.Temps;

  var STADES = ['oeuf', 'petite', 'adulte'];
  var NOMS = { oeuf: 'Œuf', petite: 'Petite coccinelle', adulte: 'Adulte' };
  var NOMS_COURTS = { oeuf: 'Œuf', petite: 'Petite', adulte: 'Adulte' };

  // Durée (ms) d'un stade pour cette coccinelle, selon sa rareté
  function dureeStade(c, stade) {
    return T.heures(CONFIG.CROISSANCE[stade][G.rareteGlobale(c.genes).id]);
  }

  // Temps de croissance écoulé, avance comprise
  function ecoule(c, maintenant) {
    return (maintenant || T.maintenant()) - c.ponte + (c.avance || 0);
  }

  /* Où en est cette coccinelle ?
     Renvoie { stade, progression (0 à 1) dans le stade, resteStade (ms),
               resteTotal (ms) avant l'âge adulte, prochain (stade suivant) } */
  function info(c, maintenant) {
    if (c.stade === 'adulte') return { stade: 'adulte', progression: 1, resteStade: 0, resteTotal: 0, prochain: null };

    var t = ecoule(c, maintenant);
    var oeuf = dureeStade(c, 'oeuf');
    var petite = dureeStade(c, 'petite');

    if (t < oeuf) {
      return { stade: 'oeuf', progression: t / oeuf, resteStade: oeuf - t, resteTotal: oeuf + petite - t, prochain: 'petite' };
    }
    if (t < oeuf + petite) {
      var dans = t - oeuf;
      return { stade: 'petite', progression: dans / petite, resteStade: petite - dans, resteTotal: petite - dans, prochain: 'adulte' };
    }
    return { stade: 'adulte', progression: 1, resteStade: 0, resteTotal: 0, prochain: null };
  }

  /* Fait avancer toutes les coccinelles jusqu'à « maintenant ».
     Renvoie la liste des changements : { coccinelle, de, vers, nouvelle }
     – vers 'petite' : éclosion, les gènes sont révélés et la combinaison
       entre au Coccidex (nouvelle = true si c'est une première ; le bonus
       de pièces d'or est alors déjà ajouté)
     – vers 'adulte' : la coccinelle peut se reproduire, être vendue…
     Une coccinelle qui passe d'œuf à adulte d'un coup (longue absence)
     donne les deux changements, dans l'ordre.                          */
  function mettreAJour(etat, maintenant) {
    maintenant = maintenant || T.maintenant();
    var changements = [];
    etat.coccinelles.forEach(function (c) {
      if (c.stade === 'adulte') return;
      var nouveau = info(c, maintenant).stade;
      if (nouveau === c.stade) return;

      if (c.stade === 'oeuf') {
        c.eclosion = c.ponte + dureeStade(c, 'oeuf');
        Cocci.Habitats.installer(etat, c); // elle quitte la nurserie pour un habitat
        changements.push({
          coccinelle: c, de: 'oeuf', vers: 'petite',
          nouvelle: Cocci.Economie.decouvrir(etat, c.genes, c.eclosion)
        });
      }
      if (nouveau === 'adulte') {
        c.adulteDepuis = c.ponte + dureeStade(c, 'oeuf') + dureeStade(c, 'petite') - (c.avance || 0);
        changements.push({ coccinelle: c, de: 'petite', vers: 'adulte', nouvelle: false });
      }
      c.stade = nouveau;
    });
    return changements;
  }

  // Fait gagner du temps de croissance à une petite coccinelle (achat, mini-jeu).
  // Renvoie le temps réellement gagné (jamais plus que ce qui reste).
  function avancer(c, ms) {
    var i = info(c);
    if (i.stade !== 'petite') return 0;
    var gain = Math.max(0, Math.min(ms, i.resteTotal));
    c.avance = (c.avance || 0) + gain;
    return gain;
  }

  return {
    STADES: STADES,
    NOMS: NOMS,
    NOMS_COURTS: NOMS_COURTS,
    dureeStade: dureeStade,
    info: info,
    mettreAJour: mettreAJour,
    avancer: avancer
  };
})();
