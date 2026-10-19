/* =========================================================
   ÉCRAN ÉLEVAGE (accueil) — toutes les coccinelles en grille,
   les places libres, et la fiche quand on touche une coccinelle.
   ========================================================= */

Cocci.Ecrans = Cocci.Ecrans || {};

Cocci.Ecrans.elevage = (function () {
  var CONFIG = Cocci.CONFIG;
  var G = Cocci.Genetique;
  var E = Cocci.Economie;
  var UI = Cocci.UI;
  var $ = UI.$;

  function afficher() {
    var etat = Cocci.Jeu.etat;
    var libres = E.placesLibres(etat);

    $('places-elevage').textContent = etat.coccinelles.length + ' / ' + etat.places + ' places';

    var html = etat.coccinelles.slice().reverse().map(function (c) {
      return UI.carte(c, { nouveau: c.id === Cocci.Jeu.dernierNe });
    }).join('');
    for (var i = 0; i < libres; i++) {
      html += '<div class="carte carte-vide" aria-hidden="true"><span>Place libre</span></div>';
    }
    $('grille-elevage').innerHTML = html;

    $('bouton-ajouter').hidden = !CONFIG.MODE_TEST;
    $('bouton-ajouter').disabled = libres === 0;
  }

  // Bouton de test : ajoute une coccinelle adulte au hasard
  function ajouterAuHasard() {
    var etat = Cocci.Jeu.etat;
    if (!E.placesLibres(etat)) return;
    var c = G.creerCoccinelle(G.aleatoire({ sansMutationSeulement: true }));
    etat.coccinelles.push(c);
    var cle = G.cle(c.genes);
    if (!etat.coccidex[cle]) etat.coccidex[cle] = Cocci.Temps.maintenant();
    Cocci.Jeu.dernierNe = c.id;
    Cocci.Jeu.enregistrer();
    Cocci.Interface.rafraichir();
  }

  function init() {
    $('grille-elevage').addEventListener('click', function (e) {
      var carte = e.target.closest('[data-id]');
      if (carte) Cocci.Interface.ouvrirFiche(carte.dataset.id);
    });
    $('bouton-ajouter').addEventListener('click', ajouterAuHasard);
    $('bouton-boutique-elevage').addEventListener('click', function () { Cocci.Boutique.ouvrir(); });
  }

  return { init: init, afficher: afficher };
})();
