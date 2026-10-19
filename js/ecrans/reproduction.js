/* =========================================================
   ÉCRAN REPRODUCTION — Parent A + Parent B, aperçu des bébés
   possibles avec leurs chances, et bouton pour pondre.
   ========================================================= */

Cocci.Ecrans = Cocci.Ecrans || {};

Cocci.Ecrans.reproduction = (function () {
  var CONFIG = Cocci.CONFIG;
  var G = Cocci.Genetique;
  var D = Cocci.Dessin;
  var T = Cocci.Temps;
  var C = Cocci.Croissance;
  var UI = Cocci.UI;
  var $ = UI.$;

  var choix = { A: null, B: null }; // id des parents choisis
  var simulation = null;            // résultat de « Simuler 1000 pontes »

  function etat() { return Cocci.Jeu.etat; }

  // Retire des emplacements les coccinelles vendues entre-temps
  function nettoyerChoix() {
    ['A', 'B'].forEach(function (l) {
      var c = choix[l] && UI.trouver(choix[l]);
      if (!c || c.stade !== 'adulte') choix[l] = null;
    });
  }

  /* ---------- Emplacements Parent A / Parent B ---------- */
  function afficherEmplacement(lettre) {
    var c = choix[lettre] && UI.trouver(choix[lettre]);
    var el = $('emplacement-' + lettre);
    if (!c) {
      el.className = 'emplacement emplacement-vide';
      el.style.removeProperty('--rarete');
      el.innerHTML = '<span class="emplacement-titre">Parent ' + lettre + '</span>' +
        D.silhouette({ taille: 96 }) +
        '<span class="aide">Choisis un adulte plus bas</span>';
      return;
    }
    var rarete = G.rareteGlobale(c.genes);
    el.className = 'emplacement';
    el.style.setProperty('--rarete', rarete.couleur);
    el.innerHTML = '<span class="emplacement-titre">Parent ' + lettre + '</span>' +
      D.coccinelle(c.genes, { taille: 96 }) +
      '<span class="carte-nom">' + G.nom(c.genes) + '</span>' +
      '<span class="etiquette">' + rarete.nom + '</span>' +
      '<span class="aide">Toucher pour retirer</span>';
  }

  /* ---------- Bouton Pondre ---------- */
  function majPondre() {
    var raison = G.empechement(etat(), UI.trouver(choix.A), UI.trouver(choix.B));
    $('bouton-pondre').disabled = !!raison;
    $('message-pondre').textContent = raison || 'Ce couple est prêt à pondre !';
  }

  /* ---------- Bébés possibles ---------- */
  function ligneResultat(r) {
    var rarete = G.rareteGlobale(r.genes);
    var simule = '';
    if (simulation) {
      var n = simulation.parCle[G.cle(r.genes)] || 0;
      simule = '<span class="simule">simulé : ' + UI.pourcent(n / simulation.total) + '</span>';
    }
    return '<li class="resultat" style="--rarete:' + rarete.couleur + '">' +
      D.coccinelle(r.genes, { taille: 56 }) +
      '<span class="resultat-texte"><span class="carte-nom">' + G.nom(r.genes) + '</span>' +
      '<span class="etiquette">' + rarete.nom + '</span></span>' +
      '<span class="resultat-chance"><strong>' + UI.pourcent(r.probabilite) + '</strong>' + simule + '</span>' +
      '</li>';
  }

  function afficherResultats() {
    var A = UI.trouver(choix.A), B = UI.trouver(choix.B);
    $('section-resultats').hidden = !(A && B);
    if (!A || !B) return;

    var tous = G.resultatsPossibles(A, B);
    var principaux = tous.filter(function (r) { return !r.parMutation; });
    var rares = tous.filter(function (r) { return r.parMutation; });
    var chanceRares = rares.reduce(function (s, r) { return s + r.probabilite; }, 0);

    $('liste-resultats').innerHTML = principaux.map(ligneResultat).join('');
    $('details-rares').hidden = rares.length === 0;
    $('resume-rares').textContent = rares.length + ' bébés possibles grâce à une mutation (' + UI.pourcent(chanceRares) + ' au total)';
    $('liste-rares').innerHTML = rares.map(ligneResultat).join('');

    // Le bouton de simulation sert à vérifier les probabilités : mode test seulement
    $('bouton-simuler').hidden = !CONFIG.MODE_TEST;
    if (simulation) {
      var observeRares = 0;
      rares.forEach(function (r) { observeRares += simulation.parCle[G.cle(r.genes)] || 0; });
      $('resume-simulation').textContent = 'Sur 1000 pontes simulées : ' + observeRares + ' bébés mutants (' +
        UI.pourcent(observeRares / simulation.total) + ').';
    }
    $('resume-simulation').hidden = !simulation;
  }

  /* ---------- Ponte : on montre l'œuf, les gènes restent cachés ---------- */
  function afficherPonte(resultat) {
    var r = resultat.rapport;
    var bebe = resultat.bebe;
    var info = C.info(bebe);

    var triche = '';
    if (CONFIG.MODE_TEST) {
      var lignes = G.TYPES.map(function (type) {
        return '<li>' + G.NOMS_TYPES[type] + ' : <strong>' + G.gene(type, r.heritage[type].valeur).nom +
          '</strong> <span class="aide">(du parent ' + r.heritage[type].parent + ')</span></li>';
      });
      if (r.melange) {
        lignes.push('<li class="evenement">Mélange de couleurs ! ' + G.gene('carapace', r.melange.a).nom + ' + ' +
          G.gene('carapace', r.melange.b).nom + ' → <strong>' + G.gene('carapace', r.melange.resultat).nom + '</strong></li>');
      }
      r.mutations.forEach(function (m) {
        lignes.push('<li class="evenement">Mutation ! ' + G.NOMS_TYPES[m.type] + ' : ' + G.gene(m.type, m.de).nom +
          ' → <strong>' + G.gene(m.type, m.vers).nom + '</strong></li>');
      });
      triche = '<details class="depliant"><summary>Voir les gènes (mode test)</summary><ul>' + lignes.join('') +
        '</ul><p class="aide">Résultat final : ' + G.nom(bebe.genes) + '</p></details>';
    }

    $('naissance').innerHTML = '<div class="naissance">' + D.oeuf({ taille: 110 }) +
      '<div class="naissance-texte"><h3>Un œuf a été pondu !</h3>' +
      '<p>Il éclora dans <strong>' + T.formater(info.resteStade) + '</strong> ' +
      'et sera adulte dans <strong>' + T.formater(info.resteTotal) + '</strong>.</p>' +
      '<button type="button" class="bouton bouton-secondaire" id="voir-elevage">Voir dans l\'élevage</button>' +
      triche + '</div></div>';
    $('voir-elevage').addEventListener('click', function () { Cocci.Interface.allerA('elevage'); });
  }

  /* ---------- Liste des adultes à choisir ---------- */
  function afficherAdultes() {
    var adultes = etat().coccinelles.filter(function (c) { return c.stade === 'adulte'; });
    $('grille-adultes').innerHTML = adultes.slice().reverse().map(function (c) {
      return UI.carte(c, { marque: c.id === choix.A ? 'A' : c.id === choix.B ? 'B' : '' });
    }).join('') || '<p class="aide">Aucun adulte pour l\'instant.</p>';
  }

  function afficher(options) {
    if (options && options.parent) {
      var id = options.parent;
      if (choix.A !== id && choix.B !== id) {
        if (!choix.A) choix.A = id; else choix.B = id;
        simulation = null;
        $('naissance').innerHTML = '';
      }
    }
    nettoyerChoix();
    afficherEmplacement('A');
    afficherEmplacement('B');
    majPondre();
    afficherResultats();
    afficherAdultes();
  }

  /* ---------- Actions ---------- */
  function choisir(id) {
    if (choix.A === id) choix.A = null;
    else if (choix.B === id) choix.B = null;
    else if (!choix.A) choix.A = id;
    else choix.B = id; // B vide ou remplacé
    simulation = null;
    $('naissance').innerHTML = '';
    afficher();
  }

  function pondre() {
    var resultat = G.pondre(etat(), UI.trouver(choix.A), UI.trouver(choix.B));
    if (!resultat) return;
    Cocci.Jeu.dernierNe = resultat.bebe.id;
    Cocci.Jeu.enregistrer();
    afficher();
    afficherPonte(resultat);
  }

  function simuler() {
    simulation = G.simuler(UI.trouver(choix.A), UI.trouver(choix.B), 1000);
    afficherResultats();
  }

  function init() {
    $('grille-adultes').addEventListener('click', function (e) {
      var carte = e.target.closest('[data-id]');
      if (carte) choisir(carte.dataset.id);
    });
    $('emplacement-A').addEventListener('click', function () { if (choix.A) choisir(choix.A); });
    $('emplacement-B').addEventListener('click', function () { if (choix.B) choisir(choix.B); });
    $('bouton-pondre').addEventListener('click', pondre);
    $('bouton-simuler').addEventListener('click', simuler);
  }

  return { init: init, afficher: afficher, tic: majPondre };
})();
