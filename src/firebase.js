import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDocFromServer } from "firebase/firestore";
import { getAuth, signInAnonymously } from "firebase/auth";
import firebaseConfig from "../firebase-applet-config.json";

export let db = null;
export let auth = null;

if (firebaseConfig && firebaseConfig.apiKey) {
  try {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
    auth = getAuth(app);

    // Initialize anonymous auth
    signInAnonymously(auth).catch((error) => {
      console.error("Anonymous auth failed:", error);
    });

    // CRITICAL: Test connection to Firestore
    async function testConnection() {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
        console.log("Firebase connection established successfully.");
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration: Client is offline.");
        } else if (error.code === 'permission-denied') {
          // This is actually a good sign - it means we connected but were rejected by rules
          console.log("Firebase connected (permission denied is expected for test doc).");
        } else {
          console.error("Firebase connection error:", error);
        }
      }
    }
    testConnection();

  } catch (error) {
    console.error("Firebase initialization error:", error);
  }
} else {
  console.warn("Firebase configuration is missing.");
}
