/* =========================================================
   CHASSE AUX PUCERONS — l'écran du mini-jeu.
   Des pucerons tombent ; la petite coccinelle se déplace à gauche
   et à droite pour les attraper (doigt, souris ou flèches).
   Les règles (gains, délai…) sont dans js/minijeu.js et config.js.
   ========================================================= */

Cocci.Chasse = (function () {
  var REGLES = Cocci.CONFIG.MINI_JEU;
  var G = Cocci.Genetique;
  var D = Cocci.Dessin;
  var T = Cocci.Temps;
  var M = Cocci.MiniJeu;
  var UI = Cocci.UI;
  var $ = UI.$;

  var LARGEUR_JOUEUR = 70;   // taille de la coccinelle à l'écran (px)
  var HAUTEUR_JOUEUR = 90;

  var coccinelle = null;     // la petite coccinelle qui joue
  var partie = null;         // l'état de la partie en cours

  function duree(minutes) { return T.formater(T.heures(minutes / 60)); }

  /* ---------- Écran d'accueil ---------- */
  function afficherIntro() {
    $('chasse-contenu').innerHTML =
      '<div class="fiche-entete"><h2 id="chasse-titre">Chasse aux pucerons</h2>' +
      '<button type="button" class="bouton-fermer" data-chasse="fermer" aria-label="Fermer le mini-jeu">×</button></div>' +
      '<div class="chasse-intro">' + D.selonStade(coccinelle, 'petite', { taille: 110 }) +
      '<ul class="chasse-regles">' +
      '<li>' + D.puceron(30) + '<span>Chaque puceron attrapé : <strong>−' + duree(REGLES.GAIN_PAR_PUCERON_MINUTES) + '</strong> de croissance</span></li>' +
      '<li>' + D.goutte(30) + '<span>Goutte de rosée dorée (rare) : <strong>−' + duree(REGLES.GAIN_GOUTTE_MINUTES) + '</strong></span></li>' +
      '<li><span class="aide">Maximum ' + duree(REGLES.MAX_PAR_PARTIE_MINUTES) + ' par partie. Partie de ' + REGLES.DUREE_PARTIE_SECONDES + ' secondes.</span></li>' +
      '</ul></div>' +
      '<p class="aide chasse-commandes">Glisse le doigt, bouge la souris, ou utilise les flèches ← → du clavier.</p>' +
      '<button type="button" class="bouton bouton-large" data-chasse="demarrer">C’est parti !</button>';
  }

  /* ---------- La partie ---------- */
  function demarrer() {
    if (!M.commencer(coccinelle)) return;
    Cocci.Jeu.enregistrer();

    $('chasse-contenu').innerHTML =
      '<div class="chasse-hud">' +
        '<span class="chasse-chrono" id="chasse-chrono">' + REGLES.DUREE_PARTIE_SECONDES + ' s</span>' +
        '<span id="chasse-score" aria-live="polite"></span>' +
      '</div>' +
      '<div class="chasse-terrain" id="chasse-terrain">' +
        '<div class="chasse-joueur" id="chasse-joueur">' + D.selonStade(coccinelle, 'petite', { taille: HAUTEUR_JOUEUR }) + '</div>' +
      '</div>' +
      '<button type="button" class="bouton bouton-secondaire" data-chasse="arreter">Arrêter la partie</button>';

    var terrain = $('chasse-terrain');
    partie = {
      debut: performance.now(), dernier: performance.now(),
      prochain: 0.3, objets: [],
      x: 0.5, cible: 0.5, gauche: false, droite: false,
      pucerons: 0, gouttes: 0, fini: false,
      terrain: terrain, joueur: $('chasse-joueur'),
      largeur: terrain.clientWidth, hauteur: terrain.clientHeight
    };

    terrain.addEventListener('pointerdown', viserPointeur);
    terrain.addEventListener('pointermove', viserPointeur);
    document.addEventListener('keydown', touche);
    document.addEventListener('keyup', touche);
    window.addEventListener('resize', mesurer);
    majScore();
    requestAnimationFrame(boucle);
  }

  function mesurer() {
    if (!partie) return;
    partie.largeur = partie.terrain.clientWidth;
    partie.hauteur = partie.terrain.clientHeight;
  }

  function viserPointeur(e) {
    if (!partie || partie.fini) return;
    var rect = partie.terrain.getBoundingClientRect();
    partie.cible = Math.max(0.06, Math.min(0.94, (e.clientX - rect.left) / rect.width));
  }

  function touche(e) {
    if (!partie || partie.fini) return;
    var appui = e.type === 'keydown';
    if (e.key === 'ArrowLeft') { partie.gauche = appui; e.preventDefault(); }
    if (e.key === 'ArrowRight') { partie.droite = appui; e.preventDefault(); }
  }

  function faireTomber() {
    var estGoutte = Math.random() < REGLES.PROBA_GOUTTE;
    var el = document.createElement('div');
    el.className = 'chasse-objet' + (estGoutte ? ' chasse-goutte' : '');
    el.innerHTML = estGoutte ? D.goutte(34) : D.puceron(38);
    partie.terrain.appendChild(el);
    partie.objets.push({
      el: el, goutte: estGoutte,
      x: 0.06 + Math.random() * 0.88, y: -40,
      vitesse: partie.hauteur * REGLES.VITESSE_CHUTE * (estGoutte ? 1.35 : 1) * (0.8 + Math.random() * 0.5)
    });
  }

  function attraper(o) {
    if (o.goutte) partie.gouttes++; else partie.pucerons++;
    // petit « +2 min » qui s'envole
    var bulle = document.createElement('span');
    bulle.className = 'chasse-bulle';
    bulle.textContent = '−' + duree(o.goutte ? REGLES.GAIN_GOUTTE_MINUTES : REGLES.GAIN_PAR_PUCERON_MINUTES);
    bulle.style.left = (o.x * partie.largeur) + 'px';
    bulle.style.top = (partie.hauteur - HAUTEUR_JOUEUR - 20) + 'px';
    partie.terrain.appendChild(bulle);
    setTimeout(function () { bulle.remove(); }, 700);
    majScore();
  }

  function majScore() {
    var gagne = M.gain(partie.pucerons, partie.gouttes);
    $('chasse-score').innerHTML = D.puceron(22) + ' <strong>' + partie.pucerons + '</strong>' +
      (partie.gouttes ? ' · ' + D.goutte(20) + ' <strong>' + partie.gouttes + '</strong>' : '') +
      ' · −' + T.formater(gagne) + (M.plafondAtteint(partie.pucerons, partie.gouttes) ? ' <span class="pastille-texte">Maximum !</span>' : '');
  }

  function boucle(t) {
    if (!partie || partie.fini) return;
    var dt = Math.min(0.05, (t - partie.dernier) / 1000);
    partie.dernier = t;
    var reste = REGLES.DUREE_PARTIE_SECONDES - (t - partie.debut) / 1000;
    if (reste <= 0) return finir();
    $('chasse-chrono').textContent = Math.ceil(reste) + ' s';

    // La coccinelle glisse vers sa cible
    if (partie.gauche) partie.cible = Math.max(0.06, partie.cible - 1.3 * dt);
    if (partie.droite) partie.cible = Math.min(0.94, partie.cible + 1.3 * dt);
    partie.x += (partie.cible - partie.x) * Math.min(1, dt * 14);
    var xJoueur = partie.x * partie.largeur;
    partie.joueur.style.transform = 'translateX(' + (xJoueur - LARGEUR_JOUEUR / 2) + 'px)';

    // De nouveaux objets tombent
    partie.prochain -= dt;
    if (partie.prochain <= 0) {
      faireTomber();
      partie.prochain = REGLES.APPARITION_SECONDES * (0.6 + Math.random() * 0.8);
    }

    // Chute et attrapes
    var hautJoueur = partie.hauteur - HAUTEUR_JOUEUR + 15;
    partie.objets = partie.objets.filter(function (o) {
      o.y += o.vitesse * dt;
      var bas = o.y + 34;
      if (bas >= hautJoueur && o.y < partie.hauteur - 20 && Math.abs(o.x * partie.largeur - xJoueur) < LARGEUR_JOUEUR * 0.6) {
        attraper(o);
        o.el.remove();
        return false;
      }
      if (o.y > partie.hauteur) { o.el.remove(); return false; }
      o.el.style.transform = 'translate(' + (o.x * partie.largeur - 18) + 'px,' + o.y + 'px)';
      return true;
    });

    requestAnimationFrame(boucle);
  }

  /* ---------- Fin de partie ---------- */
  function finir() {
    if (!partie || partie.fini) return;
    partie.fini = true;
    partie.terrain.removeEventListener('pointerdown', viserPointeur);
    partie.terrain.removeEventListener('pointermove', viserPointeur);
    document.removeEventListener('keydown', touche);
    document.removeEventListener('keyup', touche);
    window.removeEventListener('resize', mesurer);

    var gagne = M.terminer(coccinelle, partie.pucerons, partie.gouttes);
    Cocci.Jeu.enregistrer();
    var adulte = Cocci.Croissance.info(coccinelle).stade === 'adulte';

    $('chasse-contenu').innerHTML =
      '<div class="fiche-entete"><h2 id="chasse-titre">Partie terminée !</h2>' +
      '<button type="button" class="bouton-fermer" data-chasse="fermer" aria-label="Fermer le mini-jeu">×</button></div>' +
      '<div class="chasse-fin">' + D.selonStade(coccinelle, adulte ? 'adulte' : 'petite', { taille: 110 }) +
      '<p class="chasse-resultat">' + D.puceron(30) + ' <strong>' + partie.pucerons + '</strong> puceron' + (partie.pucerons > 1 ? 's' : '') + ' attrapé' + (partie.pucerons > 1 ? 's' : '') + '</p>' +
      (partie.gouttes ? '<p class="chasse-resultat">' + D.goutte(28) + ' <strong>' + partie.gouttes + '</strong> goutte' + (partie.gouttes > 1 ? 's' : '') + ' dorée' + (partie.gouttes > 1 ? 's' : '') + '</p>' : '') +
      '<p>Temps de croissance gagné : <strong>' + T.formater(gagne) + '</strong></p>' +
      (adulte ? '<p class="pastille-texte">Elle est devenue adulte !</p>' : '') +
      '<p class="aide">Prochaine partie possible dans ' + T.formater(M.attente(coccinelle)) + '.</p></div>' +
      '<button type="button" class="bouton bouton-large" data-chasse="fermer">Terminer</button>';

    Cocci.Interface.rafraichir();
  }

  /* ---------- Ouverture / fermeture ---------- */
  function ouvrir(id) {
    coccinelle = UI.trouver(id);
    if (!M.peutJouer(coccinelle)) return;
    partie = null;
    afficherIntro();
    if (!$('chasse').open) $('chasse').showModal();
  }

  function fermer() {
    if (partie && !partie.fini) finir(); // fermer en pleine partie = on garde ce qui est gagné
    partie = null;
    coccinelle = null;
    if ($('chasse').open) $('chasse').close();
  }

  function enCours() { return !!(partie && !partie.fini); }

  function init() {
    $('chasse').addEventListener('click', function (e) {
      var bouton = e.target.closest('[data-chasse]');
      if (!bouton) return;
      var action = bouton.dataset.chasse;
      if (action === 'demarrer') demarrer();
      if (action === 'arreter') finir();
      if (action === 'fermer') fermer();
    });
    // touche Échap : on termine proprement
    $('chasse').addEventListener('cancel', function (e) {
      e.preventDefault();
      if (enCours()) finir(); else fermer();
    });
  }

  return { init: init, ouvrir: ouvrir, enCours: enCours };
})();
