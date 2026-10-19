/* =========================================================
   MINIJEU.JS — Les règles de la « Chasse aux pucerons » :
   qui peut jouer, quand, et combien de temps on gagne.
   (L'écran du jeu lui-même est dans js/ecrans/chasse.js.)
   Les réglages sont dans config.js (MINI_JEU).
   ========================================================= */

Cocci.MiniJeu = (function () {
  var REGLES = Cocci.CONFIG.MINI_JEU;
  var T = Cocci.Temps;

  // Temps (ms) avant que cette petite coccinelle puisse rejouer (0 = maintenant)
  function attente(c) {
    if (!c.dernierePartie) return 0;
    return Math.max(0, c.dernierePartie + T.heures(REGLES.DELAI_ENTRE_PARTIES_HEURES) - T.maintenant());
  }

  function peutJouer(c) {
    return !!c && c.stade === 'petite' && attente(c) === 0;
  }

  // Temps de croissance (ms) gagné pour un nombre de pucerons et de gouttes, plafonné
  function gain(nbPucerons, nbGouttes) {
    var minutes = nbPucerons * REGLES.GAIN_PAR_PUCERON_MINUTES + nbGouttes * REGLES.GAIN_GOUTTE_MINUTES;
    return T.heures(Math.min(minutes, REGLES.MAX_PAR_PARTIE_MINUTES) / 60);
  }

  function plafondAtteint(nbPucerons, nbGouttes) {
    return nbPucerons * REGLES.GAIN_PAR_PUCERON_MINUTES + nbGouttes * REGLES.GAIN_GOUTTE_MINUTES >= REGLES.MAX_PAR_PARTIE_MINUTES;
  }

  // Début de partie : le délai commence tout de suite (on ne peut pas relancer pour tricher)
  function commencer(c) {
    if (!peutJouer(c)) return false;
    c.dernierePartie = T.maintenant();
    return true;
  }

  // Fin de partie : applique le temps gagné. Renvoie le temps réellement gagné (ms).
  function terminer(c, nbPucerons, nbGouttes) {
    return Cocci.Croissance.avancer(c, gain(nbPucerons, nbGouttes));
  }

  return {
    attente: attente,
    peutJouer: peutJouer,
    gain: gain,
    plafondAtteint: plafondAtteint,
    commencer: commencer,
    terminer: terminer
  };
})();
