/* La tournée du facteur : envoie les notifications de La Poste de Kenza.
 * Lancée toutes les 5 minutes par GitHub Actions (.github/workflows/facteur.yml),
 * gratuitement, sans carte bancaire côté Firebase.
 *
 *   Kenza est prévenue : une lettre arrive (tout de suite ou à sa date), une carte-réponse arrive.
 *   Sammy est prévenu  : Kenza répond à une carte, ouvre une lettre, envoie un cœur.
 *
 * Le texte des lettres n'est jamais envoyé (les notifications s'affichent sur l'écran verrouillé),
 * et le journal ne contient que des compteurs (il est public sur un dépôt public).
 */
const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { getMessaging } = require("firebase-admin/messaging");

const AUTEUR = process.env.AUTEUR || "Sammy";
const DESTINATAIRE = process.env.DESTINATAIRE || "Kenza";
const SURPRISE = "__surprise__";

/** Désigne une lettre sans dévoiler son contenu : son titre, sa consigne, ou sa date. */
function designation(l) {
  if (l.title) return `« ${l.title} »`;
  if (l.type === "quand") return `« Quand ${l.condition} »`;
  const d = l.deliverAt && typeof l.deliverAt.toDate === "function" ? l.deliverAt.toDate() : null;
  if (!d) return "Ta lettre";
  const jour = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", timeZone: "Europe/Paris" }).format(d);
  return `Celle du ${jour.replace(/^1 /, "1er ")}`;
}

function messageLettre(l) {
  if (l.type === "quand") return ["Une lettre à garder", `À ouvrir quand ${l.condition}.`];
  if (l.questionId) return ["Ta lettre est arrivée 💌", "Celle que tu as demandée t’attend dans ta boîte."];
  return ["Tu as du courrier 💌", `${AUTEUR} vient de t’écrire.`];
}

async function tournee(db, messaging) {
  const bilan = { envoyees: 0, echecs: 0, jetonsRetires: 0 };

  async function prevenir(role, titre, texte) {
    const snap = await db.collection("pushTokens").where("role", "==", role).get();
    if (snap.empty) return;
    const messages = snap.docs.map((d) => {
      const url = d.get("url");
      const webpush = { notification: { title: titre, body: texte } };
      if (typeof url === "string" && url.startsWith("https://")) {
        webpush.notification.icon = new URL("icons/icon-192.png", url).href;
        webpush.fcmOptions = { link: url };
      }
      return { token: d.id, webpush };
    });
    const res = await messaging.sendEach(messages);
    const morts = ["messaging/registration-token-not-registered", "messaging/invalid-registration-token"];
    await Promise.all(res.responses.map((r, i) => {
      if (r.success) { bilan.envoyees++; return null; }
      bilan.echecs++;
      console.log("Échec d’envoi :", r.error?.code);
      if (!morts.includes(r.error?.code)) return null;
      bilan.jetonsRetires++;
      return snap.docs[i].ref.delete();
    }));
  }

  const maintenant = Date.now();

  // 1. Lettres arrivées (immédiates ou programmées dont l'heure est passée)
  for (const d of (await db.collection("letters").where("notified", "==", false).get()).docs) {
    const l = d.data();
    if (!l.deliverAt || l.deliverAt.toMillis() > maintenant) continue;
    await d.ref.update({ notified: true });
    await prevenir("kenza", ...messageLettre(l));
  }

  // 2. Nouvelles cartes-réponses
  for (const d of (await db.collection("questions").where("notified", "==", false).get()).docs) {
    await d.ref.update({ notified: true });
    await prevenir("kenza", "Une carte-réponse pour toi", `${AUTEUR} te demande sur quoi tu veux ta prochaine lettre.`);
  }

  // 3. Réponses de Kenza aux cartes
  for (const d of (await db.collection("questions").where("answerNotified", "==", false).get()).docs) {
    const q = d.data();
    if (!q.answer) continue;
    await d.ref.update({ answerNotified: true });
    await prevenir("sammy", `${DESTINATAIRE} a répondu à ta carte`, q.answer === SURPRISE
      ? `${DESTINATAIRE} te laisse choisir le sujet de sa prochaine lettre.`
      : `${DESTINATAIRE} a coché : ${q.answer}`);
  }

  // 4. Lettres ouvertes (avec le cœur dans la même notification s'il est déjà là)
  for (const d of (await db.collection("letters").where("openNotified", "==", false).get()).docs) {
    const l = d.data();
    if (!l.openedAt) continue;
    const avecCoeur = l.hearted === true && l.heartNotified === false;
    await d.ref.update(avecCoeur ? { openNotified: true, heartNotified: true } : { openNotified: true });
    await prevenir("sammy",
      avecCoeur ? `${DESTINATAIRE} a ouvert ta lettre et t’a envoyé un cœur ♥` : `${DESTINATAIRE} a ouvert ta lettre`,
      designation(l));
  }

  // 5. Cœurs envoyés après coup
  const coeurs = await db.collection("letters").where("hearted", "==", true).where("heartNotified", "==", false).get();
  for (const d of coeurs.docs) {
    await d.ref.update({ heartNotified: true });
    await prevenir("sammy", `${DESTINATAIRE} t’a envoyé un cœur ♥`, designation(d.data()));
  }

  return bilan;
}

module.exports = { tournee, designation };

if (require.main === module) {
  const cle = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!cle) {
    console.log("Le secret FIREBASE_SERVICE_ACCOUNT n’est pas encore configuré : tournée annulée.");
    process.exit(0);
  }
  let identifiants;
  try { identifiants = JSON.parse(cle); } catch {
    console.error("Le secret FIREBASE_SERVICE_ACCOUNT n’est pas un JSON valide : colle tout le contenu du fichier de clé.");
    process.exit(1);
  }
  initializeApp({ credential: cert(identifiants) });
  tournee(getFirestore(), getMessaging())
    .then((b) => console.log(`Tournée terminée : ${b.envoyees} notification(s) envoyée(s), ${b.echecs} échec(s), ${b.jetonsRetires} appareil(s) oublié(s).`))
    .catch((e) => { console.error("La tournée a échoué :", e.code || e.message); process.exit(1); });
}
