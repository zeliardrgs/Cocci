/* =========================================================
   GENETIQUE.JS — Les gènes des coccinelles et la reproduction.
   Les probabilités se règlent dans config.js (REPRODUCTION).
   ========================================================= */

Cocci.Genetique = (function () {
  var CONFIG = Cocci.CONFIG;
  var REPRO = CONFIG.REPRODUCTION;
  var TYPES = ['carapace', 'motif', 'couleurMotif'];
  var NOMS_TYPES = { carapace: 'Carapace', motif: 'Motif', couleurMotif: 'Couleur du motif' };

  /* =========================================================
     LIRE LES GÈNES
     ========================================================= */

  // Retrouve la fiche d'un gène (nom, rareté, couleur) à partir de son id
  function gene(type, id) {
    var liste = CONFIG.GENES[type];
    for (var i = 0; i < liste.length; i++) {
      if (liste[i].id === id) return liste[i];
    }
    return null;
  }

  // Toutes les valeurs d'un type pour une rareté donnée (1 à 5)
  function valeursDeRarete(type, rarete) {
    return CONFIG.GENES[type].filter(function (g) { return g.rarete === rarete; });
  }

  // Fiche d'une rareté à partir de son nombre de points (1 à 5)
  function rareteParPoints(points) {
    return CONFIG.RARETES[points - 1];
  }

  // Fiche d'une rareté à partir de son id ('rare', 'epique'…)
  function rareteParId(id) {
    for (var i = 0; i < CONFIG.RARETES.length; i++) {
      if (CONFIG.RARETES[i].id === id) return CONFIG.RARETES[i];
    }
    return null;
  }

  // Somme des points des 3 gènes
  function points(genes) {
    var total = 0;
    TYPES.forEach(function (type) {
      total += gene(type, genes[type]).rarete;
    });
    return total;
  }

  // Rareté globale d'une coccinelle (fiche complète avec nom et couleur)
  function rareteGlobale(genes) {
    var total = points(genes);
    for (var i = 0; i < CONFIG.RARETE_GLOBALE.length; i++) {
      var palier = CONFIG.RARETE_GLOBALE[i];
      if (total >= palier.min && total <= palier.max) return rareteParId(palier.rarete);
    }
    return CONFIG.RARETES[0];
  }

  // Nom lisible : « Rouge · Pois · Noir »
  function nom(genes) {
    return TYPES.map(function (type) { return gene(type, genes[type]).nom; }).join(' · ');
  }

  // Identifiant unique d'une combinaison (servira au Coccidex)
  function cle(genes) {
    return genes.carapace + '-' + genes.motif + '-' + genes.couleurMotif;
  }

  /* =========================================================
     CRÉER DES COCCINELLES
     ========================================================= */

  function auHasard(liste) {
    return liste[Math.floor(Math.random() * liste.length)];
  }

  // Une combinaison au hasard.
  // options.sansMutationSeulement : exclut Doré, Spirale, Arc-en-ciel
  // options.rareteMax : n'autorise que les gènes jusqu'à cette rareté (1 à 5)
  function aleatoire(options) {
    options = options || {};
    function choisir(type) {
      var liste = CONFIG.GENES[type].filter(function (g) {
        if (options.sansMutationSeulement && g.mutationSeulement) return false;
        if (options.rareteMax && g.rarete > options.rareteMax) return false;
        return true;
      });
      return auHasard(liste).id;
    }
    return { carapace: choisir('carapace'), motif: choisir('motif'), couleurMotif: choisir('couleurMotif') };
  }

  var compteurId = 0;

  // Fabrique une coccinelle (un individu de l'élevage).
  // stade : 'oeuf' pour un bébé qui vient d'être pondu, 'adulte' sinon.
  function creerCoccinelle(genes, parents, stade) {
    var maintenant = Cocci.Temps.maintenant();
    var c = {
      id: 'k' + maintenant.toString(36) + (++compteurId).toString(36),
      genes: { carapace: genes.carapace, motif: genes.motif, couleurMotif: genes.couleurMotif },
      ponte: maintenant,
      parents: parents || null,
      stade: stade || 'adulte'
    };
    if (c.stade === 'adulte') c.adulteDepuis = maintenant;
    return c;
  }

  /* =========================================================
     REPRODUCTION
     ========================================================= */

  // Couleur obtenue en mélangeant deux carapaces, ou null si pas de recette
  function recetteMelange(a, b) {
    for (var i = 0; i < REPRO.MELANGES.length; i++) {
      var m = REPRO.MELANGES[i];
      if ((m.a === a && m.b === b) || (m.a === b && m.b === a)) return m.resultat;
    }
    return null;
  }

  // Valeurs vers lesquelles un gène peut muter (rareté juste au-dessus)
  function ciblesMutation(type, id) {
    return valeursDeRarete(type, gene(type, id).rarete + 1);
  }

  // Crée les gènes d'un bébé + un rapport qui raconte ce qui s'est passé
  function reproduire(A, B) {
    var genes = {};
    var rapport = { heritage: {}, melange: null, mutations: [] };

    // 1. Chaque gène vient du parent A ou B (50/50)
    TYPES.forEach(function (type) {
      var parent = Math.random() < 0.5 ? 'A' : 'B';
      genes[type] = (parent === 'A' ? A : B).genes[type];
      rapport.heritage[type] = { parent: parent, valeur: genes[type] };
    });

    // 2. Mélange de couleur de carapace
    var recette = recetteMelange(A.genes.carapace, B.genes.carapace);
    if (recette && Math.random() < REPRO.PROBA_MELANGE) {
      rapport.melange = { a: A.genes.carapace, b: B.genes.carapace, resultat: recette };
      genes.carapace = recette;
    }

    // 3. Mutation : chaque gène peut monter d'une rareté
    TYPES.forEach(function (type) {
      var cibles = ciblesMutation(type, genes[type]);
      if (cibles.length && Math.random() < REPRO.PROBA_MUTATION) {
        var nouvelle = auHasard(cibles).id;
        rapport.mutations.push({ type: type, de: genes[type], vers: nouvelle });
        genes[type] = nouvelle;
      }
    });

    return { genes: genes, rapport: rapport };
  }

  /* ---------- Repos du couple ---------- */

  function cleCouple(A, B) {
    return [A.id, B.id].sort().join('+');
  }

  // Temps restant (en ms) avant que ce couple puisse pondre à nouveau
  function reposRestant(etat, A, B) {
    var derniere = etat.reposCouples[cleCouple(A, B)];
    if (!derniere) return 0;
    var fin = derniere + Cocci.Temps.heures(REPRO.REPOS_COUPLE_HEURES);
    return Math.max(0, fin - Cocci.Temps.maintenant());
  }

  // Raison pour laquelle le couple ne peut pas pondre (ou null si tout va bien)
  function empechement(etat, A, B) {
    if (!A || !B) return 'Choisis deux parents.';
    if (A.id === B.id) return 'Il faut deux coccinelles différentes.';
    if (A.stade !== 'adulte' || B.stade !== 'adulte') return 'Seuls les adultes peuvent se reproduire.';
    var place = Cocci.Habitats.empechementPonte(etat);
    if (place) return place;
    var reste = reposRestant(etat, A, B);
    if (reste > 0) return 'Ce couple se repose encore ' + Cocci.Temps.formater(reste) + '.';
    return null;
  }

  // Pond un bébé et l'ajoute à l'élevage. Renvoie { bebe, rapport } ou null.
  function pondre(etat, A, B) {
    if (empechement(etat, A, B)) return null;
    var resultat = reproduire(A, B);
    var bebe = creerCoccinelle(resultat.genes, [A.id, B.id], 'oeuf');
    etat.coccinelles.push(bebe);
    etat.reposCouples[cleCouple(A, B)] = Cocci.Temps.maintenant();
    return { bebe: bebe, rapport: resultat.rapport };
  }

  /* =========================================================
     APERÇU : tous les bébés possibles et leurs chances
     ========================================================= */

  function ajouter(dist, id, p) {
    dist[id] = (dist[id] || 0) + p;
  }

  // Chances de chaque valeur pour un gène (avec ou sans mutation)
  function distributionGene(type, A, B, avecMutation) {
    var dist = {};
    ajouter(dist, A.genes[type], 0.5);
    ajouter(dist, B.genes[type], 0.5);

    if (type === 'carapace') {
      var recette = recetteMelange(A.genes.carapace, B.genes.carapace);
      if (recette) {
        var avecMelange = {};
        Object.keys(dist).forEach(function (id) { ajouter(avecMelange, id, dist[id] * (1 - REPRO.PROBA_MELANGE)); });
        ajouter(avecMelange, recette, REPRO.PROBA_MELANGE);
        dist = avecMelange;
      }
    }
    if (!avecMutation) return dist;

    var finale = {};
    Object.keys(dist).forEach(function (id) {
      var cibles = ciblesMutation(type, id);
      if (!cibles.length) { ajouter(finale, id, dist[id]); return; }
      ajouter(finale, id, dist[id] * (1 - REPRO.PROBA_MUTATION));
      cibles.forEach(function (c) { ajouter(finale, c.id, dist[id] * REPRO.PROBA_MUTATION / cibles.length); });
    });
    return finale;
  }

  // Liste de tous les bébés possibles, du plus probable au moins probable.
  // parMutation = true si ce bébé n'est possible que grâce à une mutation.
  function resultatsPossibles(A, B) {
    var avec = {}, sans = {};
    TYPES.forEach(function (type) {
      avec[type] = distributionGene(type, A, B, true);
      sans[type] = distributionGene(type, A, B, false);
    });
    var resultats = [];
    Object.keys(avec.carapace).forEach(function (c) {
      Object.keys(avec.motif).forEach(function (m) {
        Object.keys(avec.couleurMotif).forEach(function (cm) {
          resultats.push({
            genes: { carapace: c, motif: m, couleurMotif: cm },
            probabilite: avec.carapace[c] * avec.motif[m] * avec.couleurMotif[cm],
            parMutation: !(c in sans.carapace && m in sans.motif && cm in sans.couleurMotif)
          });
        });
      });
    });
    return resultats.sort(function (x, y) { return y.probabilite - x.probabilite; });
  }

  // Fait pondre le couple « pour de faux » n fois et compte les résultats
  function simuler(A, B, n) {
    var compte = { total: n, parCle: {} };
    for (var i = 0; i < n; i++) {
      var k = cle(reproduire(A, B).genes);
      compte.parCle[k] = (compte.parCle[k] || 0) + 1;
    }
    return compte;
  }

  return {
    TYPES: TYPES,
    NOMS_TYPES: NOMS_TYPES,
    gene: gene,
    valeursDeRarete: valeursDeRarete,
    rareteParPoints: rareteParPoints,
    rareteParId: rareteParId,
    points: points,
    rareteGlobale: rareteGlobale,
    nom: nom,
    cle: cle,
    auHasard: auHasard,
    aleatoire: aleatoire,
    creerCoccinelle: creerCoccinelle,
    recetteMelange: recetteMelange,
    ciblesMutation: ciblesMutation,
    reproduire: reproduire,
    reposRestant: reposRestant,
    empechement: empechement,
    pondre: pondre,
    resultatsPossibles: resultatsPossibles,
    simuler: simuler
  };
})();
