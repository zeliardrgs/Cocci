/* =========================================================
   MISSIONS.JS — Les 3 missions (facile, moyenne, difficile).
   Une mission demande 1 à 3 gènes précis ; on la remplit en
   donnant une coccinelle adulte qui correspond.
   Les réglages sont dans config.js (MISSIONS).
   ========================================================= */

Cocci.Missions = (function () {
  var CONFIG = Cocci.CONFIG;
  var REGLES = CONFIG.MISSIONS;
  var G = Cocci.Genetique;
  var T = Cocci.Temps;

  function niveau(index) { return REGLES.NIVEAUX[index]; }

  /* ---------- Quels gènes le joueur peut-il obtenir ? ----------
     Point de départ : les gènes de toutes ses coccinelles + les gènes
     communs (toujours disponibles à la boutique). Ensuite, chaque
     croisement peut ajouter un mélange de carapace ou une mutation.   */
  function genesAtteignables(etat) {
    var connus = {};
    G.TYPES.forEach(function (type) {
      connus[type] = {};
      G.valeursDeRarete(type, 1).forEach(function (g) { connus[type][g.id] = true; });
    });
    etat.coccinelles.forEach(function (c) {
      G.TYPES.forEach(function (type) { connus[type][c.genes[type]] = true; });
    });

    for (var n = 0; n < REGLES.NB_CROISEMENTS_MAX; n++) {
      var avant = {};
      G.TYPES.forEach(function (type) { avant[type] = Object.keys(connus[type]); });
      G.TYPES.forEach(function (type) {
        avant[type].forEach(function (id) {
          G.ciblesMutation(type, id).forEach(function (g) { connus[type][g.id] = true; });
        });
      });
      avant.carapace.forEach(function (a) {
        avant.carapace.forEach(function (b) {
          var melange = G.recetteMelange(a, b);
          if (melange) connus.carapace[melange] = true;
        });
      });
    }
    return connus;
  }

  /* ---------- Correspondance ---------- */

  // La coccinelle remplit-elle la demande ? (les gènes non demandés sont libres)
  function correspond(c, demande) {
    if (c.stade !== 'adulte') return false;
    return Object.keys(demande).every(function (type) { return c.genes[type] === demande[type]; });
  }

  function candidates(etat, mission) {
    return etat.coccinelles.filter(function (c) { return correspond(c, mission.demande); });
  }

  /* ---------- Création d'une mission ---------- */

  function memeDemande(a, b) {
    var ka = Object.keys(a), kb = Object.keys(b);
    return ka.length === kb.length && ka.every(function (k) { return a[k] === b[k]; });
  }

  function melanger(liste) {
    var copie = liste.slice();
    for (var i = copie.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = copie[i]; copie[i] = copie[j]; copie[j] = t;
    }
    return copie;
  }

  function creer(etat, index) {
    var n = niveau(index);
    var atteignables = genesAtteignables(etat);
    var demande = null;

    for (var essai = 0; essai < 40; essai++) {
      var essaiDemande = {};
      var possible = melanger(G.TYPES).slice(0, n.nbGenes).every(function (type) {
        var choix = Object.keys(atteignables[type])
          .map(function (id) { return G.gene(type, id); })
          .filter(function (g) { return g.rarete >= n.rareteMin && g.rarete <= n.rareteMax; });
        if (!choix.length) return false;
        essaiDemande[type] = G.auHasard(choix).id;
        return true;
      });
      if (!possible) continue;

      // pas deux fois la même demande à l'écran
      var doublon = etat.missions.some(function (m) { return m && !m.vide && memeDemande(m.demande, essaiDemande); });
      if (doublon) continue;

      // au-delà du niveau facile, on évite une mission déjà remplie d'avance
      var dejaRemplie = etat.coccinelles.some(function (c) { return correspond(c, essaiDemande); });
      demande = essaiDemande;
      if (index === 0 || !dejaRemplie) break;
    }

    return {
      id: 'm' + T.maintenant().toString(36) + Math.floor(Math.random() * 1000).toString(36),
      niveau: n.id,
      demande: demande,
      creeLe: T.maintenant()
    };
  }

  /* ---------- Mise à jour : remplace les missions dont l'attente est finie ----------
     Renvoie le nombre de nouvelles missions arrivées.                     */
  function mettreAJour(etat, maintenant) {
    maintenant = maintenant || T.maintenant();
    var arrivees = 0;
    REGLES.NIVEAUX.forEach(function (n, i) {
      var m = etat.missions[i];
      if (!m) {
        etat.missions[i] = creer(etat, i); // première fois : pas d'attente
      } else if (m.vide && maintenant >= m.retour) {
        etat.missions[i] = creer(etat, i);
        arrivees++;
      }
    });
    return arrivees;
  }

  function vider(etat, index) {
    etat.missions[index] = { vide: true, retour: T.maintenant() + T.heures(REGLES.DELAI_REMPLACEMENT_HEURES) };
  }

  /* ---------- Donner une coccinelle ----------
     Renvoie { pieces, sauvage, sauvageNouvelle } ou null si impossible. */
  function donner(etat, index, idCoccinelle) {
    var mission = etat.missions[index];
    var c = etat.coccinelles.find(function (x) { return x.id === idCoccinelle; });
    if (!mission || mission.vide || !c || !correspond(c, mission.demande)) return null;

    var n = niveau(index);
    etat.coccinelles.splice(etat.coccinelles.indexOf(c), 1);
    etat.pieces += n.pieces;
    var resultat = { pieces: n.pieces, sauvage: null, sauvageNouvelle: false };

    if (n.sauvage) {
      // la coccinelle donnée libère une place : la sauvage peut la prendre
      var accueil = Cocci.Economie.accueillir(etat, Cocci.Economie.genesSauvage());
      resultat.sauvage = accueil.coccinelle;
      resultat.sauvageNouvelle = accueil.nouvelle;
    }
    vider(etat, index);
    return resultat;
  }

  function refuser(etat, index) {
    if (!etat.missions[index] || etat.missions[index].vide) return;
    vider(etat, index);
  }

  return {
    niveau: niveau,
    genesAtteignables: genesAtteignables,
    correspond: correspond,
    candidates: candidates,
    mettreAJour: mettreAJour,
    donner: donner,
    refuser: refuser
  };
})();
