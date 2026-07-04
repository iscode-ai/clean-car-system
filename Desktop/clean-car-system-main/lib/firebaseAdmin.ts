import { initializeApp, getApps, cert, App } from "firebase-admin/app";

function init(): App {
  if (getApps().length > 0) return getApps()[0];
  return initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID!,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
      privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, "\n"),
    }),
  });
}

export function getAdminDb() {
  const { getFirestore } = require("firebase-admin/firestore");
  return getFirestore(init());
}

export function getAdminAuth() {
  const { getAuth } = require("firebase-admin/auth");
  return getAuth(init());
}
