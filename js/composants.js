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
    return C.NOMS[info.prochain] + ' dans ' + T.formater(info.resteStade);
  }

  // Temps avant l'âge adulte (inutile pour une nymphe : la ligne du dessus le dit déjà)
  function texteTotal(info) {
    return info.prochain === 'adulte' ? '' : 'Adulte dans ' + T.formater(info.resteTotal);
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
      el.querySelector('.barre').setAttribute('aria-valuenow', pct);
      el.querySelector('.barre-remplie').style.width = pct + '%';
      el.querySelector('.suivi').textContent = texteSuivi(info);
      el.querySelector('.suivi-total').textContent = texteTotal(info);
    });
  }

  /* ---------- Carte d'une coccinelle de l'élevage (cliquable) ----------
     options.marque  : 'A' ou 'B' si choisie comme parent
     options.nouveau : affiche la pastille « Nouveau »                  */
  function carte(c, options) {
    options = options || {};
    var nouveau = options.nouveau ? '<span class="pastille-nouveau">Nouveau</span>' : '';

    if (c.stade !== 'adulte') {
      var stade = C.info(c).stade;
      return '<button type="button" class="carte carte-croissance" data-id="' + c.id + '" data-suivi="' + c.id + '"' +
        ' aria-label="' + C.NOMS[stade] + ', voir la fiche">' + nouveau +
        D.selonStade(c, stade, { taille: 120 }) +
        '<span class="carte-nom">' + C.NOMS[stade] + '</span>' + blocSuivi(c) + '</button>';
    }

    var rarete = G.rareteGlobale(c.genes);
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
    majSuivis: majSuivis,
    annoncer: annoncer
  };
})();
