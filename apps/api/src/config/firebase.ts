import fs from "node:fs";
import path from "node:path";
import admin from "firebase-admin";
import { config, isFirebaseConfigured, MONOREPO_ROOT } from "./env.js";

let initialized = false;

function resolveServiceAccountPath(): string | null {
  const rawPath = config.firebase.serviceAccountPath;
  if (!rawPath) return null;

  return path.isAbsolute(rawPath)
    ? rawPath
    : path.resolve(MONOREPO_ROOT, rawPath);
}

export function getFirebaseAdmin(): admin.app.App | null {
  if (!isFirebaseConfigured()) {
    return null;
  }

  if (!initialized) {
    const serviceAccountPath = resolveServiceAccountPath();

    if (serviceAccountPath) {
      if (!fs.existsSync(serviceAccountPath)) {
        throw new Error(
          `Fichier Firebase introuvable: ${serviceAccountPath}. Téléchargez-le depuis Firebase Console.`
        );
      }

      const serviceAccount = JSON.parse(
        fs.readFileSync(serviceAccountPath, "utf-8")
      ) as admin.ServiceAccount;

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    } else {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: config.firebase.projectId,
          clientEmail: config.firebase.clientEmail,
          privateKey: config.firebase.privateKey,
        }),
      });
    }

    initialized = true;
  }

  return admin.app();
}

export function getFirestore(): admin.firestore.Firestore | null {
  const app = getFirebaseAdmin();
  return app ? app.firestore() : null;
}

export function getAuth(): admin.auth.Auth | null {
  const app = getFirebaseAdmin();
  return app ? app.auth() : null;
}
