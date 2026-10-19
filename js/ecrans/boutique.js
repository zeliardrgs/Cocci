/* =========================================================
   BOUTIQUE — fenêtre ouverte depuis le compteur de pièces d'or
   (en haut) ou le bouton « Boutique » de l'élevage.
   ========================================================= */

Cocci.Boutique = (function () {
  var CONFIG = Cocci.CONFIG;
  var G = Cocci.Genetique;
  var D = Cocci.Dessin;
  var E = Cocci.Economie;
  var UI = Cocci.UI;
  var $ = UI.$;

  var dernierAchat = null; // pour montrer ce qu'on vient d'obtenir

  var TEXTES = {
    sauvage: { titre: 'Coccinelle sauvage', description: 'Une adulte aux 3 gènes communs.' },
    mystere: { titre: 'Coccinelle mystère', description: 'Une adulte avec au moins 1 gène rare.' },
    habitat: { titre: 'Nouvel habitat', description: '' }
  };

  function etat() { return Cocci.Jeu.etat; }

  function visuel(article) {
    if (article === 'habitat') return '<div class="article-place" aria-hidden="true">+' + CONFIG.HABITATS.PLACES_PAR_HABITAT + '</div>';
    if (article === 'mystere') return D.coccinelle({}, { taille: 90 });
    return D.silhouette({ taille: 90, couleur: CONFIG.GENES.carapace[0].couleur });
  }

  function carteArticle(article) {
    var prix = E.prix(etat(), article);
    var raison = E.empechementAchat(etat(), article);
    var nb = etat().habitats;
    var description = article === 'habitat'
      ? CONFIG.HABITATS.PLACES_PAR_HABITAT + ' places de plus. Tu as ' + nb + ' habitat' + (nb > 1 ? 's' : '') + ' ; le prix augmente à chaque achat.'
      : TEXTES[article].description;
    return '<article class="article">' + visuel(article) +
      '<div class="article-texte"><h3>' + TEXTES[article].titre + '</h3><p class="aide">' + description + '</p></div>' +
      '<button type="button" class="bouton" data-acheter="' + article + '"' + (raison ? ' disabled' : '') + '>' +
      (raison || Cocci.Icones.montant(prix)) + '</button></article>';
  }

  function afficher() {
    var libres = Cocci.Habitats.placesLibres(etat());
    var html = '<div class="fiche-entete"><h2 id="boutique-titre">Boutique</h2>' +
      '<button type="button" class="bouton-fermer" data-fermer aria-label="Fermer la boutique">×</button></div>' +
      '<p class="boutique-solde">Tu as <strong>' + Cocci.Icones.montant(etat().pieces) + '</strong> · ' +
      libres + ' place' + (libres > 1 ? 's' : '') + ' libre' + (libres > 1 ? 's' : '') + ' dans les habitats</p>';

    if (dernierAchat && dernierAchat.coccinelle) {
      html += '<div class="achat">' + '<p><strong>Tu as obtenu :</strong></p>' +
        UI.carteGenes(dernierAchat.coccinelle.genes, { taille: 100 }) +
        (dernierAchat.nouvelle ? '<p class="pastille-texte">Nouvelle combinaison ! +' + Cocci.Icones.montant(CONFIG.ECONOMIE.RECOMPENSE_DECOUVERTE) + '</p>' : '') +
        '</div>';
    }

    html += '<div class="articles">' + E.ARTICLES.map(carteArticle).join('') + '</div>';
    $('boutique-contenu').innerHTML = html;
  }

  function ouvrir() {
    dernierAchat = null;
    afficher();
    if (!$('boutique').open) $('boutique').showModal();
  }

  function fermer() {
    if ($('boutique').open) $('boutique').close();
  }

  function acheter(article) {
    var resultat = E.acheter(etat(), article);
    if (!resultat) return;
    if (resultat.coccinelle) Cocci.Jeu.dernierNe = resultat.coccinelle.id;
    if ('habitat' in resultat) UI.annoncer('Nouvel habitat : ' + Cocci.Habitats.nom(resultat.habitat) + ' !');
    dernierAchat = resultat;
    Cocci.Jeu.enregistrer();
    Cocci.Interface.rafraichir();
    afficher();
  }

  function init() {
    $('boutique').addEventListener('click', function (e) {
      if (e.target === $('boutique') || e.target.closest('[data-fermer]')) return fermer();
      var bouton = e.target.closest('[data-acheter]');
      if (bouton && !bouton.disabled) acheter(bouton.dataset.acheter);
    });
  }

  function estOuverte() { return $('boutique').open; }

  return { init: init, ouvrir: ouvrir, afficher: afficher, estOuverte: estOuverte };
})();
