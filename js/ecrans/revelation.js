/* =========================================================
   RÉVÉLATION — la fenêtre qui s'ouvre à l'éclosion d'un œuf :
   l'œuf tremble, la petite coccinelle apparaît, et un bandeau
   « Nouvelle combinaison ! » si c'est une première.
   Plusieurs éclosions en même temps passent l'une après l'autre.
   ========================================================= */

Cocci.Revelation = (function () {
  var CONFIG = Cocci.CONFIG;
  var G = Cocci.Genetique;
  var D = Cocci.Dessin;
  var UI = Cocci.UI;
  var $ = UI.$;

  var file = []; // éclosions en attente d'être montrées

  function ajouter(coccinelle, nouvelle) {
    file.push({ id: coccinelle.id, nouvelle: nouvelle });
    suivante();
  }

  // Montre la prochaine éclosion, sauf pendant le mini-jeu (on attend la fin)
  function suivante() {
    if ($('revelation').open || !file.length || Cocci.Chasse.enCours()) return;
    var item = file.shift();
    var c = UI.trouver(item.id);
    if (!c) return suivante();
    var rarete = G.rareteGlobale(c.genes);

    $('revelation-contenu').innerHTML =
      '<p class="revelation-titre">Éclosion !</p>' +
      '<div class="revelation-scene" style="--rarete:' + rarete.couleur + '">' +
        '<div class="revelation-lueur"></div>' +
        '<div class="revelation-oeuf">' + D.oeuf({ taille: 130 }) + '</div>' +
        '<div class="revelation-bebe">' + D.selonStade(c, 'petite', { taille: 150 }) + '</div>' +
      '</div>' +
      '<h2 id="revelation-nom">' + G.nom(c.genes) + '</h2>' +
      '<p><span class="etiquette" style="--rarete:' + rarete.couleur + '">' + rarete.nom + ' · ' + G.points(c.genes) + ' pts</span></p>' +
      (item.nouvelle
        ? '<p class="bandeau-nouveau">Nouvelle combinaison ! +' + Cocci.Icones.montant(CONFIG.ECONOMIE.RECOMPENSE_DECOUVERTE) + '</p>'
        : '') +
      '<button type="button" class="bouton bouton-large" data-revelation="fermer">Bienvenue, petite !</button>';
    $('revelation').showModal();
  }

  function init() {
    $('revelation').addEventListener('click', function (e) {
      if (e.target.closest('[data-revelation]')) $('revelation').close();
    });
    $('revelation').addEventListener('close', function () { setTimeout(suivante, 250); });
  }

  return { init: init, ajouter: ajouter, suivante: suivante };
})();
