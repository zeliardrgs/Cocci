/* =========================================================
   DESSIN.JS — Dessine une coccinelle en SVG, par couches.
   Base : le dessin « Cocci.svg » de Zelia (repère 139 × 178).
   1. corps sombre (visible entre les ailes)
   2. carapace (couleur du gène)
   3. motif (découpé à la forme de la carapace)
   4. ombres et reflet par-dessus, pour garder le volume
   5. collerette + tête
   ========================================================= */

Cocci.Dessin = (function () {
  var G = Cocci.Genetique;
  var CONFIG = Cocci.CONFIG;
  var compteur = 0; // pour donner un nom unique aux dégradés de chaque dessin

  var LARGEUR = 139, HAUTEUR = 178;
  var MILIEU = 69.2; // axe de symétrie

  /* ---------- Formes du dessin d'origine ---------- */
  var FORMES = {
    corps: 'M69.2182 170C85.5604 170 98.8083 138.827 98.8083 100.372C98.8083 61.9176 85.5604 30.7441 69.2182 30.7441C52.8761 30.7441 39.6282 61.9176 39.6282 100.372C39.6282 138.827 52.8761 170 69.2182 170Z',
    ombreCorps: 'M92.0299 91.8235L70.0964 89.9378C70.0964 89.875 70.0964 89.8121 70.0964 89.7571L69.9382 89.7493L68.8941 89.8357L68.5144 89.8043L68.3563 89.8121C68.3563 89.8357 68.3563 89.8593 68.3563 89.8828L46.4227 91.7685C12.2055 139.507 42.6103 163.321 61.6014 169.56C63.5788 170.212 65.7065 169.049 66.1811 167.038C67.6998 160.626 68.6489 150.255 69.2342 139.036C69.8195 150.279 70.7687 160.674 72.2874 167.093C72.7619 169.104 74.8896 170.267 76.8671 169.615C95.8424 163.376 126.247 139.562 92.0299 91.8235Z',
    carapace: 'M108.046 36.8883L68.6481 33.502L30.3811 36.7861C-27.8736 118.058 23.8952 158.6 56.2141 169.214C59.5836 170.322 63.1983 168.35 64.013 164.917C66.5995 154.003 68.2131 136.349 69.2097 117.249C70.2063 136.388 71.8199 154.082 74.4143 165.011C75.229 168.444 78.8437 170.416 82.2132 169.309C114.54 158.694 166.301 118.152 108.046 36.8883Z',
    ombreBord: 'M108.182 36.8888L104.614 36.5824C155.988 108.905 109.843 145.016 80.9881 154.499C77.9745 155.489 74.7315 153.721 74.0038 150.649C71.6863 140.859 70.2388 125.004 69.3451 107.868C68.4513 124.973 67.0038 140.789 64.6863 150.563C63.9586 153.635 60.7156 155.402 57.702 154.412C28.8475 144.921 -17.2975 108.811 34.0837 36.4802L30.5086 36.7866C-27.7461 118.058 24.0226 158.6 56.3416 169.215C59.7111 170.323 63.3258 168.351 64.1405 164.917C66.727 154.004 68.3405 136.349 69.3371 117.249C70.3338 136.389 71.9473 154.082 74.5417 165.011C75.3564 168.445 78.9711 170.417 82.3406 169.309C114.667 158.694 166.428 118.153 108.182 36.8888Z',
    ombreCol: 'M69.2498 48.0136C62.2023 48.98 33.245 49.0743 29.2744 39.7325C24.3387 53.7963 61.1819 53.8435 69.2498 52.7278C77.3256 53.7335 114.05 53.2149 109.083 39.2925C105.104 48.6029 76.2894 48.8936 69.2498 48.0136Z',
    reflet: 'M97.1713 46.6155C97.1001 46.5056 97.0131 46.4034 96.9261 46.3013C87.7588 48.4383 76.0604 48.5562 70.6818 48.1476C69.7485 48.0769 68.8152 48.0848 67.8897 48.1634C62.5349 48.6426 50.8918 48.6819 41.7008 46.6784C10.252 94.8334 41.5426 119.072 61.3247 125.57C63.4524 126.269 75.1033 126.347 76.8039 125.821C96.5306 119.716 129.126 95.4698 97.1713 46.6155Z',
    collerette: 'M106.212 29.872C90.5345 11.369 69.0519 12.6732 69.0519 12.6732C69.0519 12.6732 47.5613 11.6518 32.1217 30.3513C17.378 48.2257 56.6021 49.1843 67.8892 48.1707C68.8225 48.0843 69.7479 48.0843 70.6813 48.155C81.9842 49.0193 121.2 47.55 106.212 29.872Z',
    tete: 'M94.7274 30.367C91.2788 24.6786 87.1262 19.383 81.5182 16.0988C82.3013 15.0617 82.7442 13.9146 82.7363 12.7047C82.7284 11.2118 82.0403 9.82118 80.8697 8.62693L84.8878 4.98132C85.1725 5.08346 85.481 5.15417 85.8053 5.14632C87.2369 5.13846 88.3917 3.97564 88.3838 2.55354C88.3759 1.13144 87.2053 -0.00781651 85.7737 4.03956e-05C84.342 0.0078973 83.1872 1.16286 83.203 2.58496C83.203 2.81281 83.2426 3.02495 83.2979 3.23709L79.003 7.13411C76.5272 5.57845 73.0312 4.61205 69.1634 4.64347C65.3272 4.65919 61.8785 5.64916 59.4265 7.21268L55.1395 3.4178C55.1949 3.20566 55.2344 2.99352 55.2265 2.76567C55.2186 1.34357 54.0559 0.20432 52.6163 0.212177C51.1847 0.220034 50.0378 1.375 50.0457 2.7971C50.0536 4.2192 51.2163 5.36631 52.648 5.35845C52.9723 5.35845 53.2807 5.28774 53.5655 5.17774L57.5599 8.71335C56.3655 9.93903 55.6774 11.3611 55.6853 12.8775C55.6932 14.0325 56.1124 15.1324 56.8401 16.1303C51.161 19.4773 47.0242 24.8907 43.5993 30.7048C38.1021 40.031 44.1846 47.5029 49.0965 47.8486C56.2706 48.3515 51.7304 27.9078 69.1317 26.3364C86.5488 27.6878 82.2855 48.1865 89.4596 47.5893C94.3715 47.1729 100.351 39.6224 94.7274 30.367Z'
  };

  // Emplacements des motifs sur l'aile gauche (copiés en miroir à droite)
  var POSITIONS = [
    { x: 46, y: 72,  taille: 1 },
    { x: 24, y: 104, taille: 1.1 },
    { x: 46, y: 137, taille: 1 }
  ];

  /* ---------- Petits outils ---------- */

  function miroir(positions) {
    return positions.concat(positions.map(function (p) {
      return { x: 2 * MILIEU - p.x, y: p.y, taille: p.taille, miroir: true };
    }));
  }

  // sens : 'horizontal', 'vertical' ou 'diagonale'
  function degrade(id, couleurs, sens) {
    var stops = couleurs.map(function (c, i) {
      return '<stop offset="' + Math.round(i / (couleurs.length - 1) * 100) + '%" stop-color="' + c + '"/>';
    }).join('');
    var axes = {
      horizontal: 'x1="10" y1="0" x2="128" y2="0"',
      vertical: 'x1="0" y1="40" x2="0" y2="170"',
      diagonale: 'x1="15" y1="45" x2="125" y2="165"'
    };
    return '<linearGradient id="' + id + '" gradientUnits="userSpaceOnUse" ' + axes[sens] + '>' + stops + '</linearGradient>';
  }

  /* ---------- Couleurs : clarté et contraste ---------- */

  function canaux(hex) {
    var n = parseInt(hex.replace('#', ''), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  // Clarté perçue d'une couleur (0 = noir, 1 = blanc)
  function clarte(hex) {
    var c = canaux(hex).map(function (v) {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  }

  // Écart entre deux couleurs (1 = identiques, 21 = noir sur blanc)
  function contraste(a, b) {
    var la = clarte(a), lb = clarte(b);
    return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
  }

  // Contour du motif : discret d'habitude, marqué si motif et carapace se ressemblent
  function contourMotif(couleurCarapace, couleurMotif) {
    if (contraste(couleurCarapace, couleurMotif) >= CONFIG.SEUIL_CONTRASTE_MOTIF) {
      return { couleur: 'rgba(0,0,0,0.22)', epaisseur: 1.2 };
    }
    // motif clair → contour sombre ; motif sombre → contour clair
    return clarte(couleurMotif) > 0.35
      ? { couleur: 'rgba(40,25,0,0.75)', epaisseur: 2.6 }
      : { couleur: 'rgba(255,255,255,0.85)', epaisseur: 2.6 };
  }

  // Étoile à 5 branches centrée en (x, y)
  function etoile(x, y, r) {
    var pts = [];
    for (var i = 0; i < 10; i++) {
      var rayon = i % 2 === 0 ? r : r * 0.45;
      var angle = -Math.PI / 2 + i * Math.PI / 5;
      pts.push((x + rayon * Math.cos(angle)).toFixed(1) + ',' + (y + rayon * Math.sin(angle)).toFixed(1));
    }
    return '<polygon points="' + pts.join(' ') + '"/>';
  }

  // Cœur centré en (x, y)
  function coeur(x, y, s, epaisseur) {
    // le contour est divisé par l'agrandissement pour garder un trait fin
    return '<path transform="translate(' + x + ' ' + y + ') scale(' + s + ')" stroke-width="' + (epaisseur / s).toFixed(3) + '" ' +
      'd="M0 0.38 C-0.55 0 -0.5 -0.48 0 -0.2 C0.5 -0.48 0.55 0 0 0.38 Z"';
  }

  // Points d'une spirale (tourne dans un sens à gauche, dans l'autre à droite)
  function pointsSpirale(x, y, r, inverse) {
    var tours = 2.4, nb = 60, pts = [];
    for (var i = 0; i <= nb; i++) {
      var t = i / nb;
      var angle = t * tours * Math.PI * 2;
      pts.push((x + (inverse ? -1 : 1) * Math.cos(angle) * r * t).toFixed(1) + ' ' + (y + Math.sin(angle) * r * t).toFixed(1));
    }
    return pts;
  }

  function chemin(pts) {
    return 'M' + pts.join(' L');
  }

  /* ---------- Le motif ----------
     peindre(n) : couleur de l'élément n° n du motif (identique pour tous,
                  sauf Rainbow où chaque élément a sa couleur)
     contour    : { couleur, epaisseur } autour de chaque élément          */

  function dessinerMotif(motif, peindre, contour) {
    var trait = 'stroke="' + contour.couleur + '" stroke-width="' + contour.epaisseur + '"';
    var formes = '';

    if (motif === 'pois') {
      miroir(POSITIONS).forEach(function (p, n) {
        formes += '<circle cx="' + p.x + '" cy="' + p.y + '" r="' + (10 * p.taille) + '" fill="' + peindre(n) + '"/>';
      });
      return '<g ' + trait + '>' + formes + '</g>';
    }

    if (motif === 'rayures') {
      [64, 90, 116, 142].forEach(function (y, n) {
        formes += '<rect x="0" y="' + y + '" width="' + LARGEUR + '" height="11" fill="' + peindre(n) + '"/>';
      });
      return '<g ' + trait + '>' + formes + '</g>';
    }

    if (motif === 'coeurs') {
      miroir(POSITIONS).forEach(function (p, n) {
        formes += coeur(p.x, p.y, 25 * p.taille, contour.epaisseur) + ' fill="' + peindre(n) + '"/>';
      });
      return '<g stroke="' + contour.couleur + '">' + formes + '</g>';
    }

    if (motif === 'etoiles') {
      miroir(POSITIONS).forEach(function (p, n) {
        formes += etoile(p.x, p.y, 13 * p.taille).replace('/>', ' fill="' + peindre(n) + '"/>');
      });
      return '<g ' + trait + ' stroke-linejoin="round">' + formes + '</g>';
    }

    if (motif === 'spirale') {
      var spirales = [pointsSpirale(38, 100, 24, false), pointsSpirale(2 * MILIEU - 38, 100, 24, true)];
      // le contour d'abord (trait plus large dessous)…
      formes += '<path d="' + spirales.map(chemin).join(' ') + '" stroke="' + contour.couleur + '" stroke-width="' + (6 + 2 * contour.epaisseur) + '"/>';
      // …puis le trait coloré, découpé en 3 morceaux par spirale (pour Rainbow)
      spirales.forEach(function (pts, s) {
        for (var m = 0; m < 3; m++) {
          var morceau = pts.slice(m * 20, m * 20 + 21);
          formes += '<path d="' + chemin(morceau) + '" stroke="' + peindre(s * 3 + m) + '" stroke-width="6"/>';
        }
      });
      return '<g fill="none" stroke-linecap="round" stroke-linejoin="round">' + formes + '</g>';
    }
    return '';
  }

  /* ---------- Effets spéciaux de carapace ---------- */

  // Crystal : des ailes fines qu'on devine sous la carapace transparente
  var AILES_CRYSTAL =
    '<g opacity="0.55" stroke="#9fb3bd" stroke-width="1.2" fill="#eef8fc">' +
      '<path d="M66 52 C40 70 26 120 44 160 C54 150 62 110 66 52Z"/>' +
      '<path d="M72 52 C98 70 112 120 94 160 C84 150 76 110 72 52Z"/>' +
      '<path d="M64 70 L50 140 M74 70 L88 140" fill="none"/>' +
    '</g>';

  // Crystal : un reflet brillant en diagonale
  function refletCrystal() {
    return '<g fill="white">' +
      '<polygon points="20,120 70,40 92,40 42,120" opacity="0.55"/>' +
      '<polygon points="52,150 104,64 112,64 60,150" opacity="0.4"/>' +
      '</g>';
  }

  // Prime : petites étincelles qui scintillent (animation coupée si
  // « réduire les animations » est activé : voir style.css)
  function etincelles() {
    function etincelle(x, y, r, delai) {
      return '<path class="scintille" style="animation-delay:' + delai + 's" ' +
        'd="M' + x + ' ' + (y - r) + ' Q' + x + ' ' + y + ' ' + (x + r) + ' ' + y + ' Q' + x + ' ' + y + ' ' + x + ' ' + (y + r) +
        ' Q' + x + ' ' + y + ' ' + (x - r) + ' ' + y + ' Q' + x + ' ' + y + ' ' + x + ' ' + (y - r) + 'Z" fill="white"/>';
    }
    return etincelle(40, 78, 7, 0) + etincelle(98, 112, 6, 0.9) + etincelle(58, 140, 5, 1.7);
  }

  /* ---------- La coccinelle complète ----------
     genes   : { carapace: 'ruby', motif: 'pois', couleurMotif: 'coal' }
     options : { taille: 120 } = hauteur en pixels (facultatif)          */

  function cadre(hauteur, label, contenu) {
    var largeur = Math.round(hauteur * LARGEUR / HAUTEUR);
    return '<svg class="coccinelle" viewBox="0 0 ' + LARGEUR + ' ' + HAUTEUR + '" width="' + largeur + '" height="' + hauteur +
      '" role="img" aria-label="' + label + '" xmlns="http://www.w3.org/2000/svg">' + contenu + '</svg>';
  }

  // Silhouette unie (emplacement vide, coccinelle pas encore découverte…)
  function silhouette(options) {
    options = options || {};
    var c = options.couleur || CONFIG.COULEUR_SILHOUETTE;
    return cadre(options.taille || 120, 'Silhouette de coccinelle',
      '<path d="' + FORMES.carapace + '" fill="' + c + '"/>' +
      '<path d="' + FORMES.collerette + '" fill="' + c + '"/>' +
      '<path d="' + FORMES.tete + '" fill="' + c + '"/>' +
      '<path opacity="0.12" d="' + FORMES.tete + '" fill="black"/>');
  }

  /* ---------- Les stades de croissance ---------- */

  var OMBRE_SOL = '<ellipse cx="69" cy="168" rx="38" ry="6" fill="black" opacity="0.12"/>';

  // Œuf : aucun indice, les gènes sont cachés
  function oeuf(options) {
    options = options || {};
    return cadre(options.taille || 120, 'Œuf de coccinelle',
      OMBRE_SOL +
      '<path d="M69 40C98 40 110 98 108 124C106 152 90 166 69 166C48 166 32 152 30 124C28 98 40 40 69 40Z" ' +
      'fill="' + CONFIG.COULEUR_OEUF + '"/>' +
      '<path d="M69 166C90 166 106 152 108 124C108 118 107 111 106 104C104 140 88 156 66 156C52 156 40 150 33 140C38 156 52 166 69 166Z" ' +
      'fill="black" opacity="0.08"/>' +
      '<ellipse cx="54" cy="78" rx="8" ry="15" transform="rotate(20 54 78)" fill="white" opacity="0.7"/>');
  }

  // Petite coccinelle : exactement l'adulte, en plus petit (posée en bas du cadre)
  var ECHELLE_PETITE = 0.7;
  var PETITE = 'translate(' + MILIEU + ' 172) scale(' + ECHELLE_PETITE + ') translate(-' + MILIEU + ' -172)';

  // Dessine une coccinelle de l'élevage selon son stade
  function selonStade(c, stade, options) {
    if (stade === 'oeuf') return oeuf(options);
    if (stade === 'petite') return coccinelle(c.genes, Object.assign({}, options, { petite: true }));
    return coccinelle(c.genes, options);
  }

  /* Un gène peut être absent (mission : « ? ») :
     carapace absente → gris, motif absent → un « ? », couleur de motif absente → gris foncé
     options.petite : dessine la version « petite coccinelle »                            */
  function coccinelle(genes, options) {
    options = options || {};
    var uid = 'c' + (++compteur);
    var complet = genes.carapace && genes.motif && genes.couleurMotif;

    var carapace = genes.carapace ? G.gene('carapace', genes.carapace) : { couleur: CONFIG.COULEUR_INCONNUE };
    var couleurMotif = genes.couleurMotif ? G.gene('couleurMotif', genes.couleurMotif) : { couleur: CONFIG.COULEUR_MOTIF_INCONNU };
    var defs = '<clipPath id="' + uid + '-forme"><path d="' + FORMES.carapace + '"/></clipPath>';

    // Carapace : couleur unie, ou effet spécial
    var fondCarapace = carapace.couleur;
    var opaciteCarapace = 1;
    var sousCarapace = '';   // dessiné juste sous la carapace
    var surCarapace = '';    // dessiné par-dessus le motif
    if (carapace.effet === 'prime') {
      defs += degrade(uid + '-carapace', carapace.degrade, 'diagonale');
      fondCarapace = 'url(#' + uid + '-carapace)';
      surCarapace = etincelles();
    }
    if (carapace.effet === 'crystal') {
      opaciteCarapace = 0.45;  // semi-transparente : on devine le corps et les ailes
      sousCarapace = AILES_CRYSTAL;
      surCarapace = refletCrystal();
    }

    // Motif : chaque élément reçoit sa couleur via peindre(n)
    var peindre = function () { return couleurMotif.couleur; };
    if (couleurMotif.effet === 'silver') {
      defs += degrade(uid + '-motif', couleurMotif.degrade, 'diagonale');
      peindre = function () { return 'url(#' + uid + '-motif)'; };
    }
    if (couleurMotif.effet === 'rainbow') {
      peindre = function (n) { return couleurMotif.couleurs[n % couleurMotif.couleurs.length]; };
    }

    var motif = genes.motif
      ? dessinerMotif(genes.motif, peindre, contourMotif(carapace.couleur, couleurMotif.couleur))
      : '<text x="' + MILIEU + '" y="122" text-anchor="middle" font-size="54" font-weight="800" ' +
        'font-family="sans-serif" fill="white" opacity="0.85">?</text>';

    var corps =
      // 1. corps
      '<path opacity="0.5" d="' + FORMES.corps + '" fill="black"/>' +
      '<path opacity="0.2" d="' + FORMES.ombreCorps + '" fill="black"/>' +
      sousCarapace +
      // 2. carapace
      '<path d="' + FORMES.carapace + '" fill="' + fondCarapace + '" fill-opacity="' + opaciteCarapace + '"/>' +
      // 3. motif, puis effets par-dessus (reflet, étincelles)
      '<g clip-path="url(#' + uid + '-forme)">' + motif + surCarapace + '</g>' +
      // 4. ombres et reflet
      '<path opacity="0.2" d="' + FORMES.ombreBord + '" fill="black"/>' +
      '<path opacity="0.2" d="' + FORMES.ombreCol + '" fill="black"/>' +
      '<path opacity="0.2" d="' + FORMES.reflet + '" fill="white"/>';
    // 5. collerette + tête
    var tete =
      '<path d="' + FORMES.collerette + '" fill="' + CONFIG.COULEUR_COLLERETTE + '"/>' +
      '<path d="' + FORMES.tete + '" fill="' + CONFIG.COULEUR_CORPS + '"/>';

    var dessin = options.petite
      ? '<g transform="' + PETITE + '">' + corps + tete + '</g>'
      : corps + tete;

    var label = complet ? (options.petite ? 'Petite coccinelle ' : 'Coccinelle ') + G.nom(genes) : 'Coccinelle demandée';
    return cadre(options.taille || 120, label, '<defs>' + defs + '</defs>' + dessin);
  }

  /* ---------- Mini-jeu : puceron et goutte de rosée dorée ---------- */

  function puceron(taille) {
    return '<svg viewBox="0 0 40 32" width="' + taille + '" height="' + Math.round(taille * 0.8) + '" aria-hidden="true">' +
      '<path d="M12 25l-3 5M20 27v4M28 25l3 5" stroke="#5a9e3a" stroke-width="2.4" stroke-linecap="round"/>' +
      '<ellipse cx="22" cy="17" rx="14" ry="10" fill="#9fe07a"/>' +
      '<ellipse cx="25" cy="13" rx="7" ry="3.5" fill="white" opacity="0.45"/>' +
      '<circle cx="8" cy="13" r="6.5" fill="#7cc95a"/>' +
      '<circle cx="6.5" cy="11.5" r="1.8" fill="#2f3a2f"/>' +
      '<path d="M5 7 Q2 2 0 2 M9 7 Q9 2 12 1" stroke="#5a9e3a" stroke-width="1.6" fill="none" stroke-linecap="round"/>' +
      '</svg>';
  }

  function goutte(taille) {
    return '<svg viewBox="0 0 30 40" width="' + Math.round(taille * 0.75) + '" height="' + taille + '" aria-hidden="true">' +
      '<defs><linearGradient id="goutte-or" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0" stop-color="#FFF3A0"/><stop offset="0.5" stop-color="#FFC301"/><stop offset="1" stop-color="#E08A00"/>' +
      '</linearGradient></defs>' +
      '<path d="M15 2 C15 2 3 18 3 26 A12 12 0 0 0 27 26 C27 18 15 2 15 2Z" fill="url(#goutte-or)" stroke="#B36A00" stroke-width="1.5"/>' +
      '<ellipse cx="10" cy="24" rx="3" ry="6" fill="white" opacity="0.6" transform="rotate(20 10 24)"/>' +
      '</svg>';
  }

  return {
    coccinelle: coccinelle,
    silhouette: silhouette,
    oeuf: oeuf,
    selonStade: selonStade,
    puceron: puceron,
    goutte: goutte
  };
})();
