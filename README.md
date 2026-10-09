# La Poste de Kenza 💌

Une boîte aux lettres privée : Sammy écrit, Kenza ouvre. De temps en temps, Sammy envoie une carte-réponse pour lui demander sur quoi elle veut sa prochaine lettre, avec un bouton « Choisis pour moi ».

Tout est gratuit et sans carte bancaire : Firebase reste sur son forfait gratuit (Spark), l'app est hébergée par GitHub Pages, et les notifications sont envoyées par GitHub Actions.

## Comment on entre

Pas de compte ni de mot de passe : chacun a **son lien secret**, qui contient une clé. La première fois qu'un téléphone ouvre son lien, il est reconnu pour de bon. Les clés sont rangées dans la base Firestore (collection `cles`), que l'app ne peut ni lire ni lister ; elles n'apparaissent nulle part dans ce dépôt.

Quiconque obtiendrait un lien pourrait ouvrir la boîte correspondante : on ne les partage qu'avec la bonne personne. Sur iPhone, on ajoute l'app à l'écran d'accueil **depuis la page ouverte avec son lien**, pour que l'icône garde la clé.

## Ce que contient ce dépôt

| Fichier | Rôle |
|---|---|
| `index.html` | Toute l'app, avec la config publique du projet Firebase `poste-de-kenza`. |
| `manifest.webmanifest`, `icons/` | Nom et icône (le trésor) sur l'écran d'accueil. |
| `firebase-messaging-sw.js` | Reçoit les notifications sur le téléphone. Rien à modifier. |
| `firestore.rules` | Copie des règles de sécurité publiées dans Firestore. |
| `facteur/` et `.github/workflows/facteur.yml` | La tournée du facteur : toutes les 5 minutes, envoie les notifications. |

## Mise en ligne

1. **Settings → Pages** → *Deploy from a branch* → branche `main`, dossier `/ (root)` → Save. L'app est en ligne une minute plus tard sur `https://sammysssa.github.io/poste-de-kenza/`.
2. **Clé du facteur** (pour les notifications) : Firebase → **Paramètres du projet → Comptes de service → Générer une nouvelle clé privée**. Un fichier JSON se télécharge.
   Sur GitHub → **Settings → Secrets and variables → Actions → New repository secret** : nom `FIREBASE_SERVICE_ACCOUNT`, valeur = tout le contenu du fichier. Supprime ensuite le fichier de ton ordinateur.
3. **Tester** : onglet **Actions → Tournée du facteur → Run workflow**. Au bout d'une minute, la tournée doit être cochée en vert.

## Notifications

| Qui | Est prévenu quand |
|---|---|
| Kenza | une lettre arrive (tout de suite, ou à l'heure programmée), une carte-réponse arrive |
| Sammy | Kenza répond à une carte, ouvre une lettre, envoie un cœur |

Le texte des lettres n'apparaît jamais dans une notification. Pour les activer, chacun touche **Activer les notifications** dans l'app :

- **Android** : directement dans Chrome.
- **iPhone** (iOS 16.4 ou plus récent) : depuis l'app ajoutée à l'écran d'accueil (Partager → Sur l'écran d'accueil, depuis la page ouverte avec son lien), puis ouverte depuis l'icône du trésor.

La tournée passe toutes les 5 minutes, mais GitHub ne garantit pas l'horaire à la minute près : compte en général 5 à 15 minutes entre une lettre postée et la notification.

## Au quotidien

**Sammy** : *Écrire* pour une lettre classique ou une « à ouvrir quand… », à poster tout de suite ou à programmer. *Demander* pour envoyer une carte-réponse. *Envoyées* pour voir ce qu'elle a lu et les cœurs reçus. « Voir sa boîte aux lettres » montre exactement ce qu'elle voit, sans rien marquer comme lu.

**Kenza** : les nouvelles lettres arrivent dans des enveloppes à ouvrir, les « à ouvrir quand… » restent en réserve, et les lettres lues sont rangées pour être relues. Elle peut envoyer un cœur sous chaque lettre et cocher sa réponse aux cartes.

## Si ça coince

- **« Ce lien ne fonctionne pas »** : le lien a été coupé en route. Il doit se terminer par la clé complète (34 caractères après `cle=`).
- **Un téléphone ouvre la mauvaise boîte** : rouvre-le avec le bon lien, il bascule automatiquement.
- **La tournée est rouge dans Actions** : ouvre-la pour lire le message. Le plus souvent, le secret `FIREBASE_SERVICE_ACCOUNT` est incomplet (il faut coller tout le fichier, accolades comprises).
- **Pas de notification** : vérifie qu'en bas de l'app il est écrit « Notifications activées sur cet appareil » et que la dernière tournée est verte. Sur iPhone, l'app doit être ouverte depuis l'icône, et le mode Concentration peut retenir les notifications.
- **Changer un lien** (s'il a fuité) : dans Firestore, supprime le document de la clé dans `cles` et crée-en un nouveau avec un autre identifiant (`k_` ou `s_` suivi de 32 caractères hexadécimaux) et le même champ `role`.

## Bon à savoir

- Le journal de la tournée est public (dépôt public) : il ne contient que des compteurs, jamais de contenu.
- Sans activité pendant 60 jours, GitHub met en pause les tâches planifiées ; le facteur laisse donc un petit commit vide toutes les six semaines pour rester en service.
- Le brouillon de la lettre en cours reste sur le téléphone tant qu'elle n'est pas postée.
