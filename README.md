# Coccinelles

Petit jeu d'élevage de coccinelles en HTML, inspiré de Pocket Frog : on croise des coccinelles pour découvrir de nouvelles combinaisons de couleurs et de motifs, et on attend du vrai temps pour qu'elles grandissent.

## Jouer

Ouvrir `index.html` dans un navigateur (double-clic). Aucune installation nécessaire.

La partie s'enregistre automatiquement dans le navigateur. Pour recommencer à zéro : toucher 5 fois le titre « Coccinelles », puis confirmer.

## Régler le jeu

Toutes les valeurs d'équilibrage sont dans `js/config.js` : couleurs et raretés, recettes de mélange, probabilités, durées de croissance, prix, missions.

`MODE_TEST: true` divise tous les temps par 60 (1 heure = 1 minute).

## Organisation

- `index.html`, `style.css`
- `js/config.js` : réglages
- `js/genetique.js`, `js/croissance.js`, `js/missions.js`, `js/economie.js`, `js/sauvegarde.js`, `js/temps.js` : règles du jeu
- `js/dessin.js` : dessin des coccinelles en SVG
- `js/composants.js`, `js/interface.js`, `js/ecrans/` : affichage et écrans
