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
  var venteEnAttente = false;

  // Ce qu'on a le droit de voir d'un gène selon le stade
  function ligneGene(c, type) {
    var g = G.gene(type, c.genes[type]);
    var visible = c.stade === 'adulte' || (c.stade === 'nymphe' && type === 'carapace');
    var valeur = '<span class="inconnu">?</span>';
    if (visible) {
      var r = G.rareteParPoints(g.rarete);
      valeur = '<strong>' + g.nom + '</strong>' + (g.teinte ? ' <span class="aide">(' + g.teinte + ')</span>' : '') +
        (c.stade === 'adulte'
          ? ' <span class="etiquette" style="--rarete:' + r.couleur + '">' + r.nom + '</span>'
          : ' <span class="aide">(on la devine)</span>');
    }
    return '<dt>' + G.NOMS_TYPES[type] + '</dt><dd>' + valeur + '</dd>';
  }

  function afficherFiche() {
    var c = UI.trouver(ficheId);
    if (!c) { fermerFiche(); return; }
    var adulte = c.stade === 'adulte';
    var rarete = G.rareteGlobale(c.genes);
    var html = '';

    html += '<div class="fiche-entete">' +
      '<h2 id="fiche-titre">' + (adulte ? G.nom(c.genes) : C.NOMS[c.stade] + ' de coccinelle') + '</h2>' +
      '<button type="button" class="bouton-fermer" data-action="fermer" aria-label="Fermer la fiche">×</button></div>';

    html += '<div class="fiche-dessin"' + (adulte ? ' style="--rarete:' + rarete.couleur + '"' : '') + '>' +
      D.selonStade(c, c.stade, { taille: 170 }) + '</div>';

    html += adulte
      ? '<p class="fiche-rarete"><span class="etiquette" style="--rarete:' + rarete.couleur + '">' + rarete.nom + ' · ' + G.points(c.genes) + ' pts</span></p>'
      : '<p class="fiche-rarete aide">Rareté : ? — elle sera révélée à l\'âge adulte</p>';

    html += '<dl class="fiche-genes">' + G.TYPES.map(function (t) { return ligneGene(c, t); }).join('') + '</dl>';

    if (c.stade === 'oeuf') html += '<p class="aide">Les gènes sont cachés dans l\'œuf.</p>';
    if (c.stade === 'larve') html += '<p class="aide">Indice : la couleur des taches de la larve annonce celle de sa carapace.</p>';

    if (!adulte) {
      html += '<div class="fiche-suivi" data-suivi="' + c.id + '"><strong>Stade : ' + C.NOMS[c.stade] + '</strong>' + UI.blocSuivi(c) + '</div>';
    } else {
      var prix = E.prixVente(c);
      html += '<div class="fiche-actions">';
      if (venteEnAttente) {
        html += '<p class="fiche-question">Vendre cette coccinelle pour <strong>' + prix + ' pièces d’or</strong> ? Elle quittera ton élevage.</p>' +
          '<button type="button" class="bouton bouton-danger" data-action="confirmer-vente">Oui, vendre</button>' +
          '<button type="button" class="bouton bouton-secondaire" data-action="annuler-vente">Non, la garder</button>';
      } else {
        html += '<button type="button" class="bouton" data-action="parent">Choisir comme parent</button>' +
          '<button type="button" class="bouton bouton-secondaire" data-action="vendre">Vendre · ' + Cocci.Icones.montant(prix) + '</button>';
      }
      html += '</div>';
    }

    $('fiche-contenu').innerHTML = html;
  }

  function ouvrirFiche(id) {
    ficheId = id;
    venteEnAttente = false;
    afficherFiche();
    if (!$('fiche').open) $('fiche').showModal();
  }

  function fermerFiche() {
    ficheId = null;
    if ($('fiche').open) $('fiche').close();
  }

  function actionFiche(action) {
    var c = UI.trouver(ficheId);
    if (action === 'fermer') return fermerFiche();
    if (!c) return;
    if (action === 'vendre') { venteEnAttente = true; afficherFiche(); return; }
    if (action === 'annuler-vente') { venteEnAttente = false; afficherFiche(); return; }
    if (action === 'confirmer-vente') {
      var nom = G.nom(c.genes);
      var prix = E.vendre(etat(), c.id);
      fermerFiche();
      Cocci.Jeu.enregistrer();
      UI.annoncer(nom + ' vendue : <strong>+' + Cocci.Icones.montant(prix) + '</strong>');
      rafraichir();
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
    if (ch.vers === 'larve') return 'Un œuf a éclos : une larve est sortie !';
    if (ch.vers === 'nymphe') return 'Une larve est devenue nymphe.';
    return '<strong>' + G.nom(ch.coccinelle.genes) + '</strong> est devenue adulte !';
  }

  var BONUS = CONFIG.ECONOMIE.RECOMPENSE_DECOUVERTE;

  function phraseMissions(n) {
    return n === 1 ? 'Une nouvelle mission est arrivée.' : n + ' nouvelles missions sont arrivées.';
  }

  // Version simple, embellie à l'étape 7
  function afficherAbsence(absence) {
    var lignes = absence.changements.map(function (ch) {
      return '<li>' + phraseChangement(ch) +
        (ch.nouvelle ? ' <span class="pastille-texte">Nouvelle combinaison ! +' + Cocci.Icones.montant(BONUS) + '</span>' : '') + '</li>';
    });
    if (absence.nouvellesMissions) lignes.push('<li>' + phraseMissions(absence.nouvellesMissions) + '</li>');
    if (!lignes.length) return;
    $('absence-liste').innerHTML = lignes.join('');
    $('absence').hidden = false;
  }

  /* ---------- Horloge : chaque seconde ---------- */
  function tic() {
    var changements = C.mettreAJour(etat());
    var nouvellesMissions = Cocci.Missions.mettreAJour(etat());

    changements.forEach(function (ch) {
      UI.annoncer(phraseChangement(ch) +
        (ch.nouvelle ? '<br><strong>Nouvelle combinaison ! +' + Cocci.Icones.montant(BONUS) + '</strong>' : ''), ch.nouvelle);
    });
    if (nouvellesMissions) UI.annoncer(phraseMissions(nouvellesMissions));

    if (changements.length || nouvellesMissions) {
      Cocci.Jeu.enregistrer();
      // la fiche ouverte n'est redessinée que si c'est sa coccinelle qui a grandi
      rafraichir(!changements.some(function (ch) { return ch.coccinelle.id === ficheId; }));
    } else {
      UI.majSuivis();
    }
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
      if (bouton) actionFiche(bouton.dataset.action);
    });
    // fermeture avec la touche Échap (l'annonce arrive un peu après : on ignore
    // si une autre fiche a été rouverte entre-temps)
    $('fiche').addEventListener('close', function () { if (!$('fiche').open) ficheId = null; });

    $('absence-fermer').addEventListener('click', function () { $('absence').hidden = true; });
    brancherReinitialisation();

    Cocci.Boutique.init();
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
    ouvrirFiche: ouvrirFiche
  };
})();
