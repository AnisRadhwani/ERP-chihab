import type { DocumentSnapshot } from "firebase-admin/firestore";
import { getFirestore } from "../config/firebase.js";

export function requireFirestore() {
  const db = getFirestore();
  if (!db) {
    throw new Error(
      "Firebase non configuré. Ajoutez firebase-service-account.json et redémarrez l'API."
    );
  }
  return db;
}

export function docToData<T>(doc: DocumentSnapshot): T {
  return { id: doc.id, ...doc.data() } as T;
}
