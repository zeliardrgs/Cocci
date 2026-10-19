/* =========================================================
   ÉCRAN MISSIONS — 3 cartes : la coccinelle demandée, la
   récompense, et les boutons Donner / Refuser.
   ========================================================= */

Cocci.Ecrans = Cocci.Ecrans || {};

Cocci.Ecrans.missions = (function () {
  var CONFIG = Cocci.CONFIG;
  var G = Cocci.Genetique;
  var D = Cocci.Dessin;
  var T = Cocci.Temps;
  var M = Cocci.Missions;
  var UI = Cocci.UI;
  var $ = UI.$;

  // Ce que le joueur est en train de faire sur chaque carte :
  // { etape: 'choisir' | 'confirmer' | 'refuser', id: coccinelle choisie }
  var enCours = {};

  function etat() { return Cocci.Jeu.etat; }

  function texteRecompense(n) {
    return '<strong>' + n.pucerons + ' pucerons</strong>' + (n.sauvage ? ' + 1 coccinelle sauvage' : '');
  }

  function ligneGene(demande, type) {
    if (!demande[type]) return '<dt>' + G.NOMS_TYPES[type] + '</dt><dd><span class="inconnu">?</span> <span class="aide">au choix</span></dd>';
    var g = G.gene(type, demande[type]);
    var r = G.rareteParPoints(g.rarete);
    return '<dt>' + G.NOMS_TYPES[type] + '</dt><dd><strong>' + g.nom + '</strong> ' +
      (g.teinte ? '<span class="aide">(' + g.teinte + ')</span> ' : '') +
      '<span class="etiquette" style="--rarete:' + r.couleur + '">' + r.nom + '</span></dd>';
  }

  function carteVide(m) {
    return '<article class="mission mission-vide">' +
      D.silhouette({ taille: 80 }) +
      '<p><strong>Nouvelle mission</strong> dans <span class="attente" data-retour="' + m.retour + '">' +
      T.formater(m.retour - T.maintenant()) + '</span></p></article>';
  }

  function zoneActions(i, mission, liste) {
    var mode = enCours[i] || {};

    if (mode.etape === 'refuser') {
      return '<p class="question">Refuser cette mission ? Une nouvelle arrivera dans ' +
        T.formater(T.heures(CONFIG.MISSIONS.DELAI_REMPLACEMENT_HEURES)) + '.</p>' +
        '<div class="actions-ligne">' +
        '<button type="button" class="bouton bouton-danger" data-action="refuser-oui" data-index="' + i + '">Oui, refuser</button>' +
        '<button type="button" class="bouton bouton-secondaire" data-action="annuler" data-index="' + i + '">Non</button></div>';
    }

    if (mode.etape === 'confirmer') {
      var c = UI.trouver(mode.id);
      return '<p class="question">Donner <strong>' + G.nom(c.genes) + '</strong> ? Elle quittera ton élevage.</p>' +
        '<div class="actions-ligne">' +
        '<button type="button" class="bouton" data-action="donner-oui" data-index="' + i + '">Oui, donner</button>' +
        '<button type="button" class="bouton bouton-secondaire" data-action="annuler" data-index="' + i + '">Non</button></div>';
    }

    if (mode.etape === 'choisir') {
      return '<p class="question">Touche la coccinelle à donner :</p>' +
        '<div class="grille grille-petite">' + liste.map(function (c) {
          return UI.carte(c).replace('<button type="button"', '<button type="button" data-action="choisir" data-index="' + i + '"');
        }).join('') + '</div>' +
        '<button type="button" class="bouton bouton-secondaire" data-action="annuler" data-index="' + i + '">Annuler</button>';
    }

    return '<p class="aide">' + (liste.length
      ? liste.length + ' coccinelle' + (liste.length > 1 ? 's' : '') + ' de ton élevage correspond' + (liste.length > 1 ? 'ent' : '') + '.'
      : 'Aucun adulte ne correspond pour l\'instant : à toi de le faire naître !') + '</p>' +
      '<div class="actions-ligne">' +
      '<button type="button" class="bouton" data-action="donner" data-index="' + i + '"' + (liste.length ? '' : ' disabled') + '>Donner une coccinelle</button>' +
      '<button type="button" class="bouton bouton-secondaire" data-action="refuser" data-index="' + i + '">Refuser</button></div>';
  }

  function carteMission(i) {
    var mission = etat().missions[i];
    if (!mission || mission.vide) return carteVide(mission || { retour: T.maintenant() });
    var n = M.niveau(i);
    var liste = M.candidates(etat(), mission);

    return '<article class="mission niveau-' + n.id + '">' +
      '<header class="mission-entete"><span class="niveau">' + n.nom + '</span>' +
      '<span class="recompense">' + texteRecompense(n) + '</span></header>' +
      '<div class="mission-corps">' + D.coccinelle(mission.demande, { taille: 110 }) +
      '<dl class="fiche-genes">' + G.TYPES.map(function (t) { return ligneGene(mission.demande, t); }).join('') + '</dl></div>' +
      zoneActions(i, mission, liste) +
      '</article>';
  }

  function afficher() {
    // on oublie un choix devenu impossible (coccinelle vendue entre-temps…)
    Object.keys(enCours).forEach(function (i) {
      var m = etat().missions[i];
      if (!m || m.vide || (enCours[i].id && !UI.trouver(enCours[i].id))) delete enCours[i];
    });
    $('liste-missions').innerHTML = etat().missions.map(function (m, i) { return carteMission(i); }).join('');
  }

  // Comptes à rebours des missions en attente
  function tic() {
    document.querySelectorAll('[data-retour]').forEach(function (el) {
      el.textContent = T.formater(Number(el.dataset.retour) - T.maintenant());
    });
  }

  function agir(action, i, id) {
    if (action === 'donner') enCours[i] = { etape: 'choisir' };
    if (action === 'choisir') enCours[i] = { etape: 'confirmer', id: id };
    if (action === 'refuser') enCours[i] = { etape: 'refuser' };
    if (action === 'annuler') delete enCours[i];

    if (action === 'refuser-oui') {
      M.refuser(etat(), i);
      delete enCours[i];
      Cocci.Jeu.enregistrer();
    }

    if (action === 'donner-oui') {
      var r = M.donner(etat(), i, enCours[i].id);
      delete enCours[i];
      if (r) {
        Cocci.Jeu.enregistrer();
        UI.annoncer('Mission accomplie ! <strong>+' + r.pucerons + ' pucerons</strong>');
        if (r.sauvage) {
          Cocci.Jeu.dernierNe = r.sauvage.id;
          UI.annoncer('Une coccinelle sauvage rejoint ton élevage : <strong>' + G.nom(r.sauvage.genes) + '</strong>' +
            (r.sauvageNouvelle ? '<br>Nouvelle combinaison ! +' + CONFIG.ECONOMIE.RECOMPENSE_DECOUVERTE + ' pucerons' : ''), r.sauvageNouvelle);
        }
      }
    }
    Cocci.Interface.rafraichir();
  }

  function init() {
    $('liste-missions').addEventListener('click', function (e) {
      var bouton = e.target.closest('[data-action]');
      if (!bouton || bouton.disabled) return;
      agir(bouton.dataset.action, Number(bouton.dataset.index), bouton.dataset.id);
    });
  }

  return { init: init, afficher: afficher, tic: tic };
})();
