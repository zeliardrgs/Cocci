/* =========================================================
   COMPOSANTS.JS — Les petits éléments d'interface réutilisés
   sur tous les écrans : cartes, barres de progression, messages.
   ========================================================= */

Cocci.UI = (function () {
  var G = Cocci.Genetique;
  var D = Cocci.Dessin;
  var T = Cocci.Temps;
  var C = Cocci.Croissance;

  function $(id) { return document.getElementById(id); }

  function trouver(id) {
    return Cocci.Jeu.etat.coccinelles.find(function (c) { return c.id === id; }) || null;
  }

  function pourcent(p) {
    var v = p * 100;
    var decimales = v >= 10 ? 0 : v >= 1 ? 1 : 2;
    return v.toLocaleString('fr-FR', { maximumFractionDigits: decimales }) + ' %';
  }

  /* ---------- Carte d'une combinaison (dessin seul, non cliquable) ---------- */
  function carteGenes(genes, options) {
    options = options || {};
    var rarete = G.rareteGlobale(genes);
    return '<article class="carte" style="--rarete:' + rarete.couleur + '">' +
      D.coccinelle(genes, { taille: options.taille || 120 }) +
      '<span class="carte-nom">' + G.nom(genes) + '</span>' +
      '<span class="etiquette">' + rarete.nom + ' · ' + G.points(genes) + ' pts</span>' +
      '</article>';
  }

  /* ---------- Suivi de croissance (barre + comptes à rebours) ----------
     Tout élément avec data-suivi="id" est mis à jour chaque seconde.   */
  function texteSuivi(info) {
    return (info.stade === 'oeuf' ? 'Éclosion dans ' : 'Adulte dans ') + T.formater(info.resteStade);
  }

  // Temps avant l'âge adulte (pour l'œuf seulement : pour une petite, la ligne du dessus le dit déjà)
  function texteTotal(info) {
    return info.stade === 'oeuf' ? 'Adulte dans ' + T.formater(info.resteTotal) : '';
  }

  // Texte du bouton « Jouer » (ou son compte à rebours)
  function texteJouer(c) {
    var attente = Cocci.MiniJeu.attente(c);
    return attente ? 'Jouer · dans ' + T.formater(attente) : 'Jouer à la chasse aux pucerons';
  }

  function blocSuivi(c) {
    var info = C.info(c);
    var pct = Math.floor(info.progression * 100);
    return '<span class="barre" role="progressbar" aria-label="Croissance" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + pct + '">' +
      '<span class="barre-remplie" style="width:' + pct + '%"></span></span>' +
      '<span class="suivi">' + texteSuivi(info) + '</span>' +
      '<span class="aide suivi-total">' + texteTotal(info) + '</span>';
  }

  function majSuivis() {
    document.querySelectorAll('[data-suivi]').forEach(function (el) {
      var c = trouver(el.dataset.suivi);
      if (!c || c.stade === 'adulte') return;
      var info = C.info(c);
      var pct = Math.floor(info.progression * 100);
      // chaque morceau est facultatif (les mini-barres des habitats n'ont pas tout)
      var barre = el.querySelector('.barre');
      var remplie = el.querySelector('.barre-remplie');
      var suivi = el.querySelector('.suivi');
      var total = el.querySelector('.suivi-total');
      if (barre) barre.setAttribute('aria-valuenow', pct);
      if (remplie) remplie.style.width = pct + '%';
      if (suivi) suivi.textContent = suivi.classList.contains('suivi-mini') ? T.formater(info.resteStade) : texteSuivi(info);
      if (total) total.textContent = texteTotal(info);
    });
    // petite icône « mini-jeu disponible » sur les cartes
    document.querySelectorAll('[data-icone-jeu]').forEach(function (el) {
      var c = trouver(el.dataset.iconeJeu);
      el.hidden = !c || !Cocci.MiniJeu.peutJouer(c);
    });
    // bouton « Jouer » de la fiche : compte à rebours, puis réactivation
    document.querySelectorAll('[data-bouton-jeu]').forEach(function (el) {
      var c = trouver(el.dataset.boutonJeu);
      if (!c) return;
      el.disabled = !Cocci.MiniJeu.peutJouer(c);
      el.textContent = texteJouer(c);
    });
  }

  /* ---------- Carte d'une coccinelle de l'élevage (cliquable) ----------
     options.marque  : 'A' ou 'B' si choisie comme parent
     options.nouveau : affiche la pastille « Nouveau »                  */
  function carte(c, options) {
    options = options || {};
    var nouveau = options.nouveau ? '<span class="pastille-nouveau">Nouveau</span>' : '';

    var rarete = G.rareteGlobale(c.genes);

    // Œuf : rien n'est révélé (bordure neutre en pointillés)
    if (c.stade === 'oeuf') {
      return '<button type="button" class="carte carte-croissance" data-id="' + c.id + '" data-suivi="' + c.id + '"' +
        ' aria-label="Œuf, voir la fiche">' + nouveau +
        '<span class="pastille-stade">Œuf</span>' +
        D.oeuf({ taille: 120 }) +
        '<span class="carte-nom">Œuf mystère</span>' + blocSuivi(c) + '</button>';
    }

    // Petite coccinelle : tout est révélé, elle grandit encore
    if (c.stade === 'petite') {
      return '<button type="button" class="carte carte-petite" data-id="' + c.id + '" data-suivi="' + c.id + '"' +
        ' style="--rarete:' + rarete.couleur + '">' +
        '<span class="pastille-stade">Petite</span>' +
        '<span class="icone-jeu" data-icone-jeu="' + c.id + '" title="Mini-jeu disponible"' + (Cocci.MiniJeu.peutJouer(c) ? '' : ' hidden') + '>' +
        D.puceron(22) + '<span class="visuellement-cache">Mini-jeu disponible</span></span>' +
        D.selonStade(c, 'petite', { taille: 120 }) +
        '<span class="carte-nom">' + G.nom(c.genes) + '</span>' + blocSuivi(c) + '</button>';
    }

    return '<button type="button" class="carte' + (options.marque ? ' carte-choisie' : '') + '" data-id="' + c.id + '"' +
      ' style="--rarete:' + rarete.couleur + '">' +
      (options.marque ? '<span class="marque">' + options.marque + '</span>' : '') + nouveau +
      D.coccinelle(c.genes, { taille: 120 }) +
      '<span class="carte-nom">' + G.nom(c.genes) + '</span>' +
      '<span class="etiquette">' + rarete.nom + ' · ' + G.points(c.genes) + ' pts</span>' +
      '</button>';
  }

  /* ---------- Annonces (petits messages en bas de l'écran) ---------- */
  function annoncer(html, nouvelle) {
    var el = document.createElement('div');
    el.className = 'annonce' + (nouvelle ? ' annonce-nouvelle' : '');
    el.innerHTML = html;
    $('annonces').appendChild(el);
    setTimeout(function () { el.remove(); }, 5000);
  }

  return {
    $: $,
    trouver: trouver,
    pourcent: pourcent,
    carte: carte,
    carteGenes: carteGenes,
    blocSuivi: blocSuivi,
    texteJouer: texteJouer,
    majSuivis: majSuivis,
    annoncer: annoncer
  };
})();
