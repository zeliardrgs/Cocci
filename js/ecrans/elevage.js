/* =========================================================
   ÉCRAN ÉLEVAGE (accueil)
   – Vue « Habitats » : la nurserie avec les œufs, puis chaque habitat
     où les coccinelles se promènent librement.
   – Vue « Liste » : toutes les coccinelles en cartes.
   Toucher une coccinelle ouvre sa fiche.
   ========================================================= */

Cocci.Ecrans = Cocci.Ecrans || {};

Cocci.Ecrans.elevage = (function () {
  var CONFIG = Cocci.CONFIG;
  var REGLES = CONFIG.HABITATS;
  var G = Cocci.Genetique;
  var D = Cocci.Dessin;
  var E = Cocci.Economie;
  var H = Cocci.Habitats;
  var UI = Cocci.UI;
  var $ = UI.$;

  var vue = lireVue();          // 'habitats' ou 'liste'
  var courant = lireHabitat();  // habitat affiché : -1 = nurserie, 0 = Habitat 1…
  var promeneurs = [];          // coccinelles affichées dans les habitats
  var positions = {};           // position de chacune, gardée d'un affichage à l'autre
  var mouvementReduit = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var dernierInstant = 0;

  /* ---------- Préférence d'affichage (mémorisée dans ce navigateur) ---------- */
  function lireVue() {
    try { return localStorage.getItem('coccinelles-vue') === 'liste' ? 'liste' : 'habitats'; } catch (e) { return 'habitats'; }
  }
  function lireHabitat() {
    try { var n = parseInt(localStorage.getItem('coccinelles-habitat'), 10); return isNaN(n) ? 0 : n; } catch (e) { return 0; }
  }
  function choisirVue(v) {
    vue = v;
    try { localStorage.setItem('coccinelles-vue', v); } catch (e) { /* tant pis */ }
    afficher();
  }

  /* ---------- Décor (dessiné par le code) ---------- */
  function hasard(graine) {
    // petit générateur toujours identique pour une même graine : le décor ne bouge pas
    return function () { graine = (graine * 9301 + 49297) % 233280; return graine / 233280; };
  }

  function fleur(x, y, couleur, r) {
    var petales = '';
    for (var i = 0; i < 5; i++) {
      var a = i * Math.PI * 2 / 5;
      petales += '<circle cx="' + (x + Math.cos(a) * r).toFixed(1) + '" cy="' + (y + Math.sin(a) * r).toFixed(1) + '" r="' + r + '" fill="' + couleur + '"/>';
    }
    return '<g opacity="0.9">' + petales + '<circle cx="' + x + '" cy="' + y + '" r="' + (r * 0.8) + '" fill="#FFD84D"/></g>';
  }

  function feuille(x, y, angle, taille) {
    return '<g transform="translate(' + x + ' ' + y + ') rotate(' + angle + ') scale(' + taille + ')">' +
      '<path d="M0 0 C10 -12 30 -12 40 0 C30 12 10 12 0 0Z" fill="#7cc95a" opacity="0.75"/>' +
      '<path d="M2 0 L36 0" stroke="#5a9e3a" stroke-width="1.2" opacity="0.6"/></g>';
  }

  function decorHabitat(n) {
    var r = hasard(n * 7 + 3);
    var couleurs = ['#FF9FC0', '#FFFFFF', '#B9A5FF', '#FFB36B'];
    var elements = '';
    for (var i = 0; i < 5; i++) elements += feuille(r() * 300, r() * 160, r() * 360, 0.6 + r() * 0.6);
    for (var j = 0; j < 6; j++) elements += fleur(r() * 300, r() * 160, couleurs[j % couleurs.length], 3 + r() * 2);
    elements += '<ellipse cx="' + (40 + r() * 220) + '" cy="' + (20 + r() * 120) + '" rx="12" ry="8" fill="#c9c2b4" opacity="0.8"/>';
    return '<svg class="decor" viewBox="0 0 300 160" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' + elements + '</svg>';
  }

  function decorNurserie() {
    return '<svg class="decor" viewBox="0 0 300 160" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' +
      '<path d="M10 150 C40 40 260 40 290 150 Z" fill="#9fd67e"/>' +
      '<path d="M150 150 L150 60" stroke="#6bb04a" stroke-width="3"/>' +
      '<path d="M150 120 L90 90 M150 110 L210 80 M150 140 L70 125 M150 135 L230 118" stroke="#6bb04a" stroke-width="2" opacity="0.7"/>' +
      fleur(30, 30, '#FFFFFF', 4) + fleur(270, 25, '#FF9FC0', 4) +
      '</svg>';
  }

  /* ---------- Les « pièces » qu'on fait défiler ----------
     -1 = la nurserie, 0, 1, 2… = les habitats, puis une dernière page
     pour acheter un nouvel habitat.                                   */
  function nbPages(etat) { return etat.habitats + 2; }           // nurserie + habitats + achat
  function pageVersIndex(etat, page) { return page - 1; }        // page 0 = nurserie (-1)

  function titrePage(etat, i) {
    if (i === -1) return { nom: 'Nurserie', compte: H.oeufs(etat).length + ' / ' + REGLES.NURSERIE_PLACES + ' œufs' };
    if (i >= etat.habitats) return { nom: 'Nouvel habitat', compte: REGLES.PLACES_PAR_HABITAT + ' places de plus' };
    return { nom: H.nom(i), compte: H.habitants(etat, i).length + ' / ' + REGLES.PLACES_PAR_HABITAT };
  }

  // Le bouton pour changer d'habitat : ‹ Nom (compte) ›, et des petits points
  function htmlSelecteur(etat) {
    var t = titrePage(etat, courant);
    var points = '';
    for (var p = 0; p < nbPages(etat); p++) {
      points += '<span class="point' + (pageVersIndex(etat, p) === courant ? ' point-actif' : '') + '"></span>';
    }
    return '<div class="selecteur-habitat">' +
      '<button type="button" class="selecteur-fleche" data-pas="-1" aria-label="Habitat précédent">‹</button>' +
      '<div class="selecteur-nom" aria-live="polite"><strong>' + t.nom + '</strong><span>' + t.compte + '</span>' +
      '<span class="points" aria-hidden="true">' + points + '</span></div>' +
      '<button type="button" class="selecteur-fleche" data-pas="1" aria-label="Habitat suivant">›</button>' +
      '</div>';
  }

  /* ---------- Nurserie : les œufs, posés sur une grande feuille ---------- */
  function sceneNurserie(etat) {
    var oeufs = H.oeufs(etat);
    var contenu = oeufs.map(function (c) {
      return '<button type="button" class="oeuf-nid" data-id="' + c.id + '" data-suivi="' + c.id + '" aria-label="Œuf, voir la fiche">' +
        D.oeuf({ taille: 72 }) +
        '<span class="suivi suivi-mini"></span><span class="suivi-total" hidden></span></button>';
    }).join('');
    if (!oeufs.length) contenu = '<p class="habitat-vide">Aucun œuf pour l’instant : va pondre dans l’onglet Reproduction !</p>';
    return '<div class="habitat-scene scene-nurserie">' + decorNurserie() + '<div class="nid">' + contenu + '</div></div>';
  }

  /* ---------- Un habitat : les coccinelles s'y promènent ---------- */
  function htmlPromeneur(c) {
    var petite = c.stade === 'petite';
    return '<button type="button" class="balade' + (petite ? ' balade-petite' : '') + '" data-id="' + c.id + '" ' +
      'aria-label="' + (petite ? 'Petite coccinelle ' : '') + G.nom(c.genes) + ', voir la fiche">' +
      '<span class="balade-corps">' + D.selonStade(c, c.stade, { taille: 72 }) + '</span></button>';
  }

  function sceneHabitat(etat, i) {
    var habitants = H.habitants(etat, i);
    return '<div class="habitat-scene" data-scene="' + i + '">' + decorHabitat(i) +
      habitants.map(htmlPromeneur).join('') +
      (habitants.length ? '' : '<p class="habitat-vide">Habitat vide</p>') + '</div>';
  }

  // Dernière page : acheter un habitat
  function sceneAchat(etat) {
    return '<div class="habitat-scene scene-achat">' +
      '<button type="button" class="habitat-acheter" data-acheter-habitat>' +
      '<span class="habitat-acheter-plus">+</span> Nouvel habitat · ' + Cocci.Icones.montant(E.prixHabitat(etat)) +
      '<span class="aide">' + REGLES.PLACES_PAR_HABITAT + ' places de plus pour tes coccinelles</span></button></div>';
  }

  // L'habitat remplit l'écran jusqu'à la barre de navigation (sans faire défiler la page)
  function ajusterHauteur() {
    var scene = document.querySelector('#vue-habitats .habitat-scene');
    if (!scene || $('ecran-elevage').hidden) return;
    var haut = scene.getBoundingClientRect().top + window.scrollY;
    var nav = document.querySelector('.navigation').offsetHeight;
    scene.style.height = Math.max(300, window.innerHeight - haut - nav - 16) + 'px';
  }

  function changerPage(pas) {
    var etat = Cocci.Jeu.etat;
    var n = nbPages(etat);
    var page = (courant + 1 + pas + n) % n; // on boucle : après le dernier, on revient à la nurserie
    courant = pageVersIndex(etat, page);
    try { localStorage.setItem('coccinelles-habitat', String(courant)); } catch (e) { /* tant pis */ }
    afficher();
  }

  /* ---------- Promenade ---------- */
  function nouvelleCible() {
    return { x: 0.12 + Math.random() * 0.76, y: 0.18 + Math.random() * 0.64 };
  }

  function preparerPromeneurs() {
    promeneurs = [];
    document.querySelectorAll('#vue-habitats .balade').forEach(function (el) {
      var id = el.dataset.id;
      if (!positions[id]) {
        var depart = nouvelleCible();
        positions[id] = { x: depart.x, y: depart.y, angle: Math.random() * 360, cible: nouvelleCible(), pause: Math.random() * 2 };
      }
      promeneurs.push({ el: el, corps: el.querySelector('.balade-corps'), scene: el.parentNode, p: positions[id] });
    });
    placerTous(0);
  }

  function ecartAngle(de, vers) {
    return ((vers - de + 540) % 360) - 180;
  }

  function placerTous(dt) {
    promeneurs.forEach(function (m) {
      var w = m.scene.clientWidth, h = m.scene.clientHeight, p = m.p;
      if (dt && !mouvementReduit) {
        if (p.pause > 0) {
          p.pause -= dt;
        } else {
          var dx = (p.cible.x - p.x) * w, dy = (p.cible.y - p.y) * h;
          var distance = Math.sqrt(dx * dx + dy * dy);
          var vitesse = REGLES.VITESSE_BALADE * w * (m.el.classList.contains('balade-petite') ? 1.25 : 1);
          if (distance < 2) {
            p.pause = 0.8 + Math.random() * 3;      // elle s'arrête un moment…
            p.cible = nouvelleCible();              // …puis repart ailleurs
          } else {
            var pas = Math.min(distance, vitesse * dt);
            p.x += dx / distance * pas / w;
            p.y += dy / distance * pas / h;
            var vise = Math.atan2(dy, dx) * 180 / Math.PI + 90; // la tête est dessinée vers le haut
            p.angle += ecartAngle(p.angle, vise) * Math.min(1, dt * 5);
          }
        }
      }
      m.el.style.transform = 'translate(' + (p.x * w - 36) + 'px,' + (p.y * h - 45) + 'px)'; // centre de la zone 72 × 90
      m.corps.style.transform = 'rotate(' + (mouvementReduit ? 0 : p.angle) + 'deg)';
    });
  }

  function boucle(t) {
    var dt = dernierInstant ? Math.min(0.1, (t - dernierInstant) / 1000) : 0;
    dernierInstant = t;
    if (promeneurs.length && !$('ecran-elevage').hidden && vue === 'habitats') placerTous(dt);
    requestAnimationFrame(boucle);
  }

  /* ---------- Affichage ---------- */
  function afficher() {
    var etat = Cocci.Jeu.etat;
    var occupe = etat.coccinelles.length;

    $('places-elevage').textContent = occupe + ' / ' + H.capacite(etat) + ' places';
    document.querySelectorAll('[data-vue]').forEach(function (b) {
      b.setAttribute('aria-pressed', b.dataset.vue === vue ? 'true' : 'false');
    });
    $('vue-habitats').hidden = vue !== 'habitats';
    $('grille-elevage').hidden = vue !== 'liste';

    if (vue === 'habitats') {
      // un seul habitat à la fois, en grand
      if (courant < -1 || courant > etat.habitats) courant = 0;
      var scene = courant === -1 ? sceneNurserie(etat)
        : courant >= etat.habitats ? sceneAchat(etat)
        : sceneHabitat(etat, courant);
      $('vue-habitats').innerHTML = htmlSelecteur(etat) + scene;
      ajusterHauteur();
      preparerPromeneurs();
    } else {
      var cartes = etat.coccinelles.slice().reverse().map(function (c) {
        return UI.carte(c, { nouveau: c.id === Cocci.Jeu.dernierNe });
      }).join('');
      for (var k = 0; k < H.placesLibres(etat); k++) {
        cartes += '<div class="carte carte-vide" aria-hidden="true"><span>Place libre</span></div>';
      }
      $('grille-elevage').innerHTML = cartes;
      promeneurs = [];
    }
    UI.majSuivis();

    $('bouton-ajouter').hidden = !CONFIG.MODE_TEST;
    $('bouton-ajouter').disabled = !H.placesLibres(etat);
  }

  // Bouton de test : ajoute une coccinelle adulte au hasard
  function ajouterAuHasard() {
    var etat = Cocci.Jeu.etat;
    if (!H.placesLibres(etat)) return;
    var accueil = E.accueillir(etat, G.aleatoire({ sansMutationSeulement: true }));
    Cocci.Jeu.dernierNe = accueil.coccinelle.id;
    Cocci.Jeu.enregistrer();
    Cocci.Interface.rafraichir();
  }

  function init() {
    function ouvrir(e) {
      var fleche = e.target.closest('[data-pas]');
      if (fleche) return changerPage(Number(fleche.dataset.pas));
      var cible = e.target.closest('[data-id]');
      if (cible) Cocci.Interface.ouvrirFiche(cible.dataset.id);
      if (e.target.closest('[data-acheter-habitat]')) Cocci.Boutique.ouvrir();
    }
    $('vue-habitats').addEventListener('click', ouvrir);
    $('grille-elevage').addEventListener('click', ouvrir);
    document.querySelectorAll('[data-vue]').forEach(function (b) {
      b.addEventListener('click', function () { choisirVue(b.dataset.vue); });
    });
    $('bouton-ajouter').addEventListener('click', ajouterAuHasard);
    $('bouton-boutique-elevage').addEventListener('click', function () { Cocci.Boutique.ouvrir(); });
    window.addEventListener('resize', ajusterHauteur);
    requestAnimationFrame(boucle);
  }

  return { init: init, afficher: afficher };
})();
