/* =========================================================
   TEMPS.JS — Tout ce qui touche à l'heure et aux durées.
   C'est ici que le mode test divise les temps par 60.
   ========================================================= */

Cocci.Temps = (function () {
  var CONFIG = Cocci.CONFIG;

  function maintenant() {
    return Date.now();
  }

  // Convertit des heures de jeu en millisecondes (en tenant compte du mode test)
  function heures(h) {
    var diviseur = CONFIG.MODE_TEST ? CONFIG.DIVISEUR_MODE_TEST : 1;
    return h * 3600 * 1000 / diviseur;
  }

  function deuxChiffres(n) {
    return (n < 10 ? '0' : '') + n;
  }

  // Durée lisible : « 2 h 05 min », « 11 min 32 s », « 45 s »
  function formater(ms) {
    var total = Math.max(0, Math.ceil(ms / 1000));
    var h = Math.floor(total / 3600);
    var min = Math.floor((total % 3600) / 60);
    var s = total % 60;
    if (h > 0) return h + ' h ' + deuxChiffres(min) + ' min';
    if (min > 0) return min + ' min ' + deuxChiffres(s) + ' s';
    return s + ' s';
  }

  return { maintenant: maintenant, heures: heures, formater: formater };
})();
