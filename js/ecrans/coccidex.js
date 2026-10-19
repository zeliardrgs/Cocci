/* =========================================================
   ÉCRAN COCCIDEX — provisoire : le compteur de découvertes.
   La grille des 225 combinaisons arrive à l'étape 6.
   En mode test, on y garde le nuancier pour vérifier les dessins.
   ========================================================= */

Cocci.Ecrans = Cocci.Ecrans || {};

Cocci.Ecrans.coccidex = (function () {
  var CONFIG = Cocci.CONFIG;
  var D = Cocci.Dessin;
  var C = Cocci.Croissance;
  var UI = Cocci.UI;
  var $ = UI.$;

  var TOTAL = CONFIG.GENES.carapace.length * CONFIG.GENES.motif.length * CONFIG.GENES.couleurMotif.length;
  var nuancierFait = false;

  // Exemples à vérifier : effets spéciaux et couleurs qui se ressemblent
  var EXEMPLES = [
    { carapace: 'crystal', motif: 'pois',    couleurMotif: 'coal' },
    { carapace: 'prime',   motif: 'etoiles', couleurMotif: 'silver' },
    { carapace: 'lapis',   motif: 'spirale', couleurMotif: 'rainbow' },
    { carapace: 'jaspe',   motif: 'coeurs',  couleurMotif: 'rainbow' },
    { carapace: 'ruby',    motif: 'pois',    couleurMotif: 'carmin' },
    { carapace: 'amber',   motif: 'rayures', couleurMotif: 'canari' },
    { carapace: 'amethyst', motif: 'etoiles', couleurMotif: 'violet' },
    { carapace: 'lapis',   motif: 'coeurs',  couleurMotif: 'indigo' }
  ];

  function afficherNuancier() {
    var G = CONFIG.GENES;
    $('nuancier-carapaces').innerHTML = G.carapace.map(function (c) {
      return UI.carteGenes({ carapace: c.id, motif: G.motif[0].id, couleurMotif: G.couleurMotif[0].id });
    }).join('');
    $('nuancier-motifs').innerHTML = G.motif.map(function (m) {
      return UI.carteGenes({ carapace: G.carapace[0].id, motif: m.id, couleurMotif: G.couleurMotif[0].id });
    }).join('');
    $('nuancier-couleurs').innerHTML = G.couleurMotif.map(function (c) {
      return UI.carteGenes({ carapace: G.carapace[3].id, motif: 'etoiles', couleurMotif: c.id });
    }).join('');
    $('nuancier-exemples').innerHTML = EXEMPLES.filter(function (g) {
      return Cocci.Genetique.gene('carapace', g.carapace) && Cocci.Genetique.gene('couleurMotif', g.couleurMotif);
    }).map(function (g) { return UI.carteGenes(g); }).join('');
    var exemple = { genes: { carapace: G.carapace[4].id, motif: 'coeurs', couleurMotif: G.couleurMotif[2].id } };
    $('nuancier-stades').innerHTML = C.STADES.map(function (stade) {
      return '<article class="carte">' + D.selonStade(exemple, stade, { taille: 120 }) +
        '<span class="carte-nom">' + C.NOMS[stade] + '</span></article>';
    }).join('');
    nuancierFait = true;
  }

  function afficher() {
    var trouvees = Object.keys(Cocci.Jeu.etat.coccidex).length;
    $('coccidex-compteur').textContent = trouvees + ' / ' + TOTAL;
    $('coccidex-total').textContent = TOTAL; // calculé d'après les gènes de config.js
    $('coccidex-barre').style.width = (trouvees / TOTAL * 100) + '%';
    $('nuancier').hidden = !CONFIG.MODE_TEST;
    if (CONFIG.MODE_TEST && !nuancierFait) afficherNuancier();
  }

  return { afficher: afficher };
})();
