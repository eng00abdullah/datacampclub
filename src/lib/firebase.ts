import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, GithubAuthProvider, FacebookAuthProvider, OAuthProvider, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { initializeAppCheck, ReCaptchaV3Provider, AppCheck } from 'firebase/app-check';
import firebaseConfig from '../../firebase-applet-config.json';

const isConfigValid = 
  firebaseConfig.apiKey && 
  firebaseConfig.apiKey !== 'PLACEHOLDER_API_KEY' &&
  firebaseConfig.projectId &&
  firebaseConfig.projectId !== 'PLACEHOLDER_PROJECT_ID';

export const isFirebaseReady = isConfigValid;

let app: FirebaseApp;
let db: Firestore;
let auth: Auth;
let storage: FirebaseStorage;
let appCheck: AppCheck;

if (isConfigValid) {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);
  storage = getStorage(app);

  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
    const siteKey = (import.meta as any).env.VITE_RECAPTCHA_SITE_KEY;
    if (siteKey) {
      appCheck = initializeAppCheck(app, {
        provider: new ReCaptchaV3Provider(siteKey),
        isTokenAutoRefreshEnabled: true
      });
    } else {
      console.warn("App Check site key missing. App Check is disabled.");
    }
  }
} else {
  console.warn("Firebase configuration is missing or invalid. Using mock mode.");
  app = {} as any;
  db = {} as any;
  auth = {
    currentUser: null,
    onAuthStateChanged: (cb: any) => {
      cb(null);
      return () => {};
    },
    signOut: async () => {},
  } as any;
  storage = {} as any;
  appCheck = {} as any;
}

export { db, auth, storage, appCheck };

export const googleProvider = new GoogleAuthProvider();
export const githubProvider = new GithubAuthProvider();
export const facebookProvider = new FacebookAuthProvider();
export const linkedinProvider = new OAuthProvider('linkedin.com');

export default app;
