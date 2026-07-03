import { initializeApp, getApps, cert, App } from "firebase-admin/app";

let app: App;

export function getAdminApp(): App {
  if (getApps().length > 0) {
    app = getApps()[0];
  } else {
    app = initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      }),
    });
  }
  return app;
}

export function getAdminDb() {
  const { getFirestore } = require("firebase-admin/firestore");
  return getFirestore(getAdminApp());
}

export function getAdminAuth() {
  const { getAuth } = require("firebase-admin/auth");
  return getAuth(getAdminApp());
}
