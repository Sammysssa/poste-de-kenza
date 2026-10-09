// Service worker des notifications de La Poste de Kenza.
// La config Firebase lui est transmise par index.html dans son adresse (?config=…) :
// il n'y a rien à modifier dans ce fichier.
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js");

const config = JSON.parse(new URL(self.location.href).searchParams.get("config") || "{}");
firebase.initializeApp(config);
// Les notifications envoyées par les fonctions sont affichées automatiquement
// quand l'app est fermée ; un toucher ouvre la boîte aux lettres.
firebase.messaging();
