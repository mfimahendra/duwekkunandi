import { applicationDefault, getApp, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

// Kredensial diambil dari Application Default Credentials:
// - Firebase App Hosting: otomatis
// - Lokal: set GOOGLE_APPLICATION_CREDENTIALS ke path file service account
export function getDb(): Firestore {
  const app = getApps().length
    ? getApp()
    : initializeApp({
        credential: applicationDefault(),
        projectId: process.env.FIREBASE_PROJECT_ID,
      });
  return getFirestore(app);
}
