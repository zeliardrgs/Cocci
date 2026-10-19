/* =========================================================
   INTERFACE.JS — Le chef d'orchestre de l'affichage :
   navigation entre les écrans, fiche d'une coccinelle,
   résumé de l'absence, horloge qui fait tout avancer.
   Chaque écran a son propre fichier dans js/ecrans/.
   ========================================================= */

Cocci.Interface = (function () {
  var CONFIG = Cocci.CONFIG;
  var G = Cocci.Genetique;
  var D = Cocci.Dessin;
  var T = Cocci.Temps;
  var C = Cocci.Croissance;
  var E = Cocci.Economie;
  var UI = Cocci.UI;
  var $ = UI.$;

  var ECRANS = ['elevage', 'reproduction', 'missions', 'coccidex'];
  var ecranActuel = 'elevage';

  function etat() { return Cocci.Jeu.etat; }

  /* =========================================================
     NAVIGATION
     ========================================================= */

  function allerA(nom, options) {
    ecranActuel = nom;
    ECRANS.forEach(function (e) {
      $('ecran-' + e).hidden = e !== nom;
      $('nav-' + e).setAttribute('aria-current', e === nom ? 'page' : 'false');
    });
    Cocci.Ecrans[nom].afficher(options);
    window.scrollTo(0, 0);
  }

  // À appeler après chaque changement de la partie.
  // garderFiche : ne pas redessiner la fiche ouverte (évite de perdre un clic en cours)
  function rafraichir(garderFiche) {
    $('compteur-pieces').textContent = etat().pieces;
    Cocci.Ecrans[ecranActuel].afficher();
    if (Cocci.Boutique.estOuverte() && !garderFiche) Cocci.Boutique.afficher();
    if (ficheId && !garderFiche) afficherFiche();
  }

  /* =========================================================
     FICHE D'UNE COCCINELLE (fenêtre par-dessus l'écran)
     ========================================================= */

  var ficheId = null;
  var confirmation = null; // 'vente', 'acceleration' ou 'demenager' quand on attend un choix

  // Où vit la coccinelle, et bouton pour déménager
  function blocMaison(c) {
    var H = Cocci.Habitats;
    if (c.stade === 'oeuf') return '<p class="fiche-maison">Vit dans : <strong>la nurserie</strong></p>';
    if (confirmation === 'demenager') {
      var choix = '';
      for (var i = 0; i < etat().habitats; i++) {
        var n = H.habitants(etat(), i).length;
        var plein = n >= CONFIG.HABITATS.PLACES_PAR_HABITAT;
        var ici = c.habitat === i;
        choix += '<button type="button" class="bouton bouton-secondaire" data-action="demenager-vers" data-habitat="' + i + '"' +
          (plein || ici ? ' disabled' : '') + '>' + H.nom(i) + ' · ' + n + '/' + CONFIG.HABITATS.PLACES_PAR_HABITAT +
          (ici ? ' (ici)' : plein ? ' (plein)' : '') + '</button>';
      }
      return '<div class="fiche-maison fiche-demenager"><p class="fiche-question">Dans quel habitat la faire vivre ?</p>' + choix +
        '<button type="button" class="bouton bouton-secondaire" data-action="annuler">Annuler</button></div>';
    }
    return '<p class="fiche-maison">Vit dans : <strong>' + H.nom(c.habitat) + '</strong>' +
      (etat().habitats > 1 ? ' <button type="button" class="lien" data-action="demenager">Déménager</button>' : '') + '</p>';
  }

  // Ce qu'on a le droit de voir d'un gène : tout, sauf dans l'œuf
  function ligneGene(c, type) {
    if (c.stade === 'oeuf') return '<dt>' + G.NOMS_TYPES[type] + '</dt><dd><span class="inconnu">?</span></dd>';
    var g = G.gene(type, c.genes[type]);
    var r = G.rareteParPoints(g.rarete);
    return '<dt>' + G.NOMS_TYPES[type] + '</dt><dd><strong>' + g.nom + '</strong>' +
      (g.teinte ? ' <span class="aide">(' + g.teinte + ')</span>' : '') +
      ' <span class="etiquette" style="--rarete:' + r.couleur + '">' + r.nom + '</span></dd>';
  }

  function actionsAdulte(c) {
    var prix = E.prixVente(c);
    if (confirmation === 'vente') {
      return '<p class="fiche-question">Vendre cette coccinelle pour <strong>' + prix + ' pièces d’or</strong> ? Elle quittera ton élevage.</p>' +
        '<button type="button" class="bouton bouton-danger" data-action="confirmer-vente">Oui, vendre</button>' +
        '<button type="button" class="bouton bouton-secondaire" data-action="annuler">Non, la garder</button>';
    }
    return '<button type="button" class="bouton" data-action="parent">Choisir comme parent</button>' +
      '<button type="button" class="bouton bouton-secondaire" data-action="vendre">Vendre · ' + Cocci.Icones.montant(prix) + '</button>';
  }

  function actionsPetite(c) {
    var prix = E.prixAcceleration(c);
    if (confirmation === 'acceleration') {
      return '<p class="fiche-question">La faire grandir tout de suite pour <strong>' + prix + ' pièces d’or</strong> ? Elle deviendra adulte immédiatement.</p>' +
        '<button type="button" class="bouton" data-action="confirmer-acceleration">Oui, la faire grandir</button>' +
        '<button type="button" class="bouton bouton-secondaire" data-action="annuler">Non</button>';
    }
    var raison = E.empechementAcceleration(etat(), c);
    return '<button type="button" class="bouton" data-action="accelerer"' + (raison ? ' disabled' : '') + '>' +
        (raison || 'Faire grandir · ' + Cocci.Icones.montant(prix)) + '</button>' +
      '<button type="button" class="bouton bouton-secondaire" data-action="jouer" data-bouton-jeu="' + c.id + '"' +
        (Cocci.MiniJeu.peutJouer(c) ? '' : ' disabled') + '>' + UI.texteJouer(c) + '</button>' +
      '<p class="aide">Une petite coccinelle ne peut pas encore se reproduire, être vendue ni partir en mission.</p>';
  }

  function afficherFiche() {
    var c = UI.trouver(ficheId);
    if (!c) { fermerFiche(); return; }
    var cache = c.stade === 'oeuf';
    var rarete = G.rareteGlobale(c.genes);
    var html = '';

    html += '<div class="fiche-entete">' +
      '<h2 id="fiche-titre">' + (cache ? 'Œuf mystère' : G.nom(c.genes)) + '</h2>' +
      '<button type="button" class="bouton-fermer" data-action="fermer" aria-label="Fermer la fiche">×</button></div>';

    html += '<div class="fiche-dessin"' + (cache ? '' : ' style="--rarete:' + rarete.couleur + '"') + '>' +
      D.selonStade(c, c.stade, { taille: 170 }) + '</div>';

    html += cache
      ? '<p class="fiche-rarete aide">Rareté : ? — tout sera révélé à l’éclosion</p>'
      : '<p class="fiche-rarete"><span class="pastille-stade-texte">' + C.NOMS[c.stade] + '</span> ' +
        '<span class="etiquette" style="--rarete:' + rarete.couleur + '">' + rarete.nom + ' · ' + G.points(c.genes) + ' pts</span></p>';

    html += '<dl class="fiche-genes">' + G.TYPES.map(function (t) { return ligneGene(c, t); }).join('') + '</dl>';

    if (cache) html += '<p class="aide">Les gènes sont cachés dans l’œuf : surprise à l’éclosion ! Un œuf ne peut pas être accéléré.</p>';

    if (c.stade !== 'adulte') {
      html += '<div class="fiche-suivi" data-suivi="' + c.id + '"><strong>Stade : ' + C.NOMS[c.stade] + '</strong>' + UI.blocSuivi(c) + '</div>';
    }
    html += blocMaison(c);
    if (c.stade === 'petite') html += '<div class="fiche-actions">' + actionsPetite(c) + '</div>';
    if (c.stade === 'adulte') html += '<div class="fiche-actions">' + actionsAdulte(c) + '</div>';

    $('fiche-contenu').innerHTML = html;
  }

  function ouvrirFiche(id) {
    ficheId = id;
    confirmation = null;
    afficherFiche();
    if (!$('fiche').open) $('fiche').showModal();
  }

  function fermerFiche() {
    ficheId = null;
    if ($('fiche').open) $('fiche').close();
  }

  function actionFiche(action, donnees) {
    var c = UI.trouver(ficheId);
    if (action === 'fermer') return fermerFiche();
    if (!c) return;
    if (action === 'demenager') { confirmation = 'demenager'; afficherFiche(); return; }
    if (action === 'demenager-vers') {
      var vers = Number(donnees.habitat);
      if (Cocci.Habitats.demenager(etat(), c, vers)) {
        Cocci.Jeu.enregistrer();
        UI.annoncer(G.nom(c.genes) + ' s’installe dans ' + Cocci.Habitats.nom(vers) + '.');
      }
      confirmation = null;
      rafraichir();
      return;
    }
    if (action === 'vendre') { confirmation = 'vente'; afficherFiche(); return; }
    if (action === 'accelerer') { confirmation = 'acceleration'; afficherFiche(); return; }
    if (action === 'annuler') { confirmation = null; afficherFiche(); return; }
    if (action === 'confirmer-vente') {
      var nom = G.nom(c.genes);
      var prix = E.vendre(etat(), c.id);
      fermerFiche();
      Cocci.Jeu.enregistrer();
      UI.annoncer(nom + ' vendue : <strong>+' + Cocci.Icones.montant(prix) + '</strong>');
      rafraichir();
      return;
    }
    if (action === 'confirmer-acceleration') {
      confirmation = null;
      var paye = E.accelerer(etat(), c);
      if (paye) {
        UI.annoncer('−' + Cocci.Icones.montant(paye));
        traiterChangements(); // elle devient adulte tout de suite (fiche redessinée)
      }
      return;
    }
    if (action === 'jouer') {
      fermerFiche();
      Cocci.Chasse.ouvrir(c.id);
      return;
    }
    if (action === 'parent') {
      fermerFiche();
      allerA('reproduction', { parent: c.id });
    }
  }

  /* =========================================================
     CHANGEMENTS DE STADE ET RÉSUMÉ DE L'ABSENCE
     ========================================================= */

  function phraseChangement(ch) {
    var nom = '<strong>' + G.nom(ch.coccinelle.genes) + '</strong>';
    if (ch.vers === 'petite') return 'Un œuf a éclos : ' + nom + ' !';
    return nom + ' est devenue adulte !';
  }

  var BONUS = CONFIG.ECONOMIE.RECOMPENSE_DECOUVERTE;

  function phraseMissions(n) {
    return n === 1 ? 'Une nouvelle mission est arrivée.' : n + ' nouvelles missions sont arrivées.';
  }

  // Version simple, embellie à l'étape 7
  function afficherAbsence(absence) {
    var eclosions = absence.changements.filter(function (ch) { return ch.vers === 'petite'; });
    var adultes = absence.changements.filter(function (ch) { return ch.vers === 'adulte'; });
    var lignes = [];
    if (eclosions.length) {
      lignes.push('<li class="absence-titre">' + eclosions.length + ' éclosion' + (eclosions.length > 1 ? 's' : '') + '</li>');
      eclosions.forEach(function (ch) {
        lignes.push('<li class="absence-ligne">' + D.selonStade(ch.coccinelle, 'petite', { taille: 44 }) + '<span>' + phraseChangement(ch) +
          (ch.nouvelle ? ' <span class="pastille-texte">Nouvelle combinaison ! +' + Cocci.Icones.montant(BONUS) + '</span>' : '') + '</span></li>');
      });
    }
    if (adultes.length) {
      lignes.push('<li class="absence-titre">' + adultes.length + ' coccinelle' + (adultes.length > 1 ? 's devenues adultes' : ' devenue adulte') + '</li>');
      adultes.forEach(function (ch) {
        lignes.push('<li class="absence-ligne">' + D.coccinelle(ch.coccinelle.genes, { taille: 44 }) + '<span>' + phraseChangement(ch) + '</span></li>');
      });
    }
    if (absence.nouvellesMissions) lignes.push('<li class="absence-titre">' + phraseMissions(absence.nouvellesMissions) + '</li>');
    if (!lignes.length) return;
    $('absence-liste').innerHTML = lignes.join('');
    $('absence').hidden = false;
  }

  /* ---------- Constater ce qui a changé (horloge, achat, mini-jeu) ---------- */
  function traiterChangements() {
    var changements = C.mettreAJour(etat());
    var nouvellesMissions = Cocci.Missions.mettreAJour(etat());

    changements.forEach(function (ch) {
      if (ch.vers === 'petite') Cocci.Revelation.ajouter(ch.coccinelle, ch.nouvelle); // la grande révélation
      else UI.annoncer(phraseChangement(ch));
    });
    if (nouvellesMissions) UI.annoncer(phraseMissions(nouvellesMissions));

    if (changements.length || nouvellesMissions) {
      Cocci.Jeu.enregistrer();
      // la fiche ouverte n'est redessinée que si c'est sa coccinelle qui a changé
      rafraichir(!changements.some(function (ch) { return ch.coccinelle.id === ficheId; }));
    }
    return changements.length > 0;
  }

  /* ---------- Horloge : chaque seconde ---------- */
  function tic() {
    if (!traiterChangements()) UI.majSuivis();
    Cocci.Revelation.suivante(); // une éclosion mise en attente pendant le mini-jeu
    if (Cocci.Ecrans[ecranActuel].tic) Cocci.Ecrans[ecranActuel].tic();
  }

  /* ---------- Réinitialisation cachée : toucher plusieurs fois le titre ---------- */
  function brancherReinitialisation() {
    var touches = 0, minuteur = null;
    $('titre-jeu').addEventListener('click', function () {
      touches++;
      clearTimeout(minuteur);
      minuteur = setTimeout(function () { touches = 0; }, 2000);
      if (touches < CONFIG.RESET_NB_TOUCHES) return;
      touches = 0;
      if (window.confirm('Effacer la sauvegarde et recommencer une nouvelle partie ?')) {
        Cocci.Sauvegarde.effacer();
        location.reload();
      }
    });
  }

  /* =========================================================
     DÉMARRAGE
     ========================================================= */

  function demarrer(absence) {
    if (CONFIG.MODE_TEST) $('badge-test').hidden = false;

    ECRANS.forEach(function (e) {
      $('nav-' + e).addEventListener('click', function () { allerA(e); });
      if (Cocci.Ecrans[e].init) Cocci.Ecrans[e].init();
    });

    $('fiche').addEventListener('click', function (ev) {
      if (ev.target === $('fiche')) return fermerFiche(); // clic à côté de la fenêtre
      var bouton = ev.target.closest('[data-action]');
      if (bouton) actionFiche(bouton.dataset.action, bouton.dataset);
    });
    // fermeture avec la touche Échap (l'annonce arrive un peu après : on ignore
    // si une autre fiche a été rouverte entre-temps)
    $('fiche').addEventListener('close', function () { if (!$('fiche').open) ficheId = null; });

    $('absence-fermer').addEventListener('click', function () { $('absence').hidden = true; });
    brancherReinitialisation();

    Cocci.Boutique.init();
    Cocci.Chasse.init();
    Cocci.Revelation.init();
    $('bouton-boutique').addEventListener('click', Cocci.Boutique.ouvrir);

    afficherAbsence(absence || { changements: [], nouvellesMissions: 0 });
    $('compteur-pieces').textContent = etat().pieces;
    allerA('elevage');
    setInterval(tic, 1000);
  }

  return {
    demarrer: demarrer,
    allerA: allerA,
    rafraichir: rafraichir,
    ouvrirFiche: ouvrirFiche,
    traiterChangements: traiterChangements
  };
})();
