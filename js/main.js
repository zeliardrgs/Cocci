/* =========================================================
   MAIN.JS — Point de départ : lance le jeu quand la page est prête.
   ========================================================= */

// Ce que tous les écrans partagent : la partie en cours
Cocci.Jeu = {
  etat: null,
  dernierNe: null, // id de la dernière coccinelle arrivée (pastille « Nouveau »)
  enregistrer: function () { Cocci.Sauvegarde.enregistrer(Cocci.Jeu.etat); }
};

document.addEventListener('DOMContentLoaded', function () {
  // 1. On reprend la partie enregistrée, ou on en commence une nouvelle
  var etat = Cocci.Sauvegarde.charger() || Cocci.Sauvegarde.nouvelEtat();
  Cocci.Jeu.etat = etat;

  // 2. On rattrape le temps passé pendant que le jeu était fermé
  var absence = {
    changements: Cocci.Croissance.mettreAJour(etat),
    nouvellesMissions: Cocci.Missions.mettreAJour(etat)
  };
  Cocci.Jeu.enregistrer();

  // 3. On affiche, puis on enregistre tout seul régulièrement
  Cocci.Interface.demarrer(absence);
  Cocci.Sauvegarde.demarrerAuto(etat);
});
