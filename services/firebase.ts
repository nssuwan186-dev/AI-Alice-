import 'firebase/auth';
import 'firebase/firestore';
import { useState, useEffect, useMemo } from 'react';
import { initializeApp, FirebaseApp, getApps, getApp } from 'firebase/app';
import {
  getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged, Auth, User
} from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

// Fix: Declare global variables to resolve 'Cannot find name' errors. These variables are expected to be injected by the environment.
declare const __firebase_config: string;
declare const __initial_auth_token: string | null;

// --- Firebase Configuration Handling ---
// This section now robustly handles the Firebase configuration, providing clear errors if it's missing or invalid.

let firebaseConfig: object | null = null;
let initialConfigError: string | null = null;

const firebaseConfigStr = typeof __firebase_config !== 'undefined'
  ? __firebase_config
  : null;

const initialAuthToken = typeof __initial_auth_token !== 'undefined'
  ? __initial_auth_token
  : null;

if (firebaseConfigStr) {
    try {
        firebaseConfig = JSON.parse(firebaseConfigStr);
        // A simple validation to check if the parsed object is not empty.
        if (Object.keys(firebaseConfig as object).length === 0) {
            initialConfigError = "The provided Firebase configuration is an empty object. Please provide a valid configuration.";
            firebaseConfig = null;
        }
    } catch (e) {
        initialConfigError = "Failed to parse the provided Firebase configuration. Please ensure it's a valid JSON string.";
        firebaseConfig = null;
    }
} else {
    initialConfigError = "Firebase configuration is missing. The app cannot connect to its backend. Please ensure the '__firebase_config' global variable is set with your Firebase project's web app configuration.";
}

// --- Singleton Firebase App Initialization ---
const initializeFirebaseApp = (): FirebaseApp | null => {
  // Short-circuit if config is invalid from the start.
  if (!firebaseConfig) {
      return null;
  }
  if (getApps().length) {
    return getApp();
  }
  try {
    return initializeApp(firebaseConfig);
  } catch (e) {
    console.error("Failed to initialize Firebase app with the provided config:", e);
    // This provides a more specific error if initialization fails even with a config.
    initialConfigError = e instanceof Error ? e.message : "An unknown error occurred during Firebase initialization.";
    return null;
  }
};

interface FirebaseHook {
  db: Firestore | null;
  auth: Auth | null;
  userId: string | null;
  user: User | null;
  isAuthReady: boolean;
  error: string | null;
}

export const useFirebase = (): FirebaseHook => {
  const [userId, setUserId] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  // Initialize error state with any configuration error found during setup.
  const [error, setError] = useState<string | null>(initialConfigError);

  // Memoize Firebase services to prevent re-initialization.
  const services = useMemo(() => {
    // If there was an error during config parsing or app initialization, don't proceed.
    if (initialConfigError) {
        return null;
    }
    const app = initializeFirebaseApp();
    if (!app) {
        // If the app failed to initialize for other reasons, update the error state.
        if (!error) {
             setError("Firebase app could not be initialized. Check console for details.");
        }
        return null;
    }
    try {
        const auth = getAuth(app);
        const db = getFirestore(app);
        return { auth, db };
    } catch (e) {
        console.error("Failed to get Firebase services (auth, firestore):", e);
        const errorMessage = e instanceof Error ? e.message : String(e);
        setError(`Failed to initialize Firebase services: ${errorMessage}`);
        return null;
    }
  }, []); // The dependency array is empty because config is resolved only once at the module level.

  // Effect for handling authentication state changes
  useEffect(() => {
    // Don't run auth logic if services failed to initialize or there's a config error.
    if (!services?.auth || error) {
      setIsAuthReady(true); // Mark auth as "ready" so the app doesn't hang on the loading screen.
      return;
    }

    const unsubscribe = onAuthStateChanged(services.auth, async (currentUser) => {
      if (currentUser) {
        setUserId(currentUser.uid);
        setUser(currentUser);
        setIsAuthReady(true);
      } else {
        try {
          if (initialAuthToken) {
            await signInWithCustomToken(services.auth, initialAuthToken);
          } else {
            await signInAnonymously(services.auth);
          }
        } catch (authError) {
          console.error("Firebase Auth Error during sign-in:", authError);
          const errorMessage = authError instanceof Error ? authError.message : String(authError);
          setError(`Authentication failed. This could be due to incorrect Firebase config or security rules. Details: ${errorMessage}`);
          setIsAuthReady(true);
        }
      }
    });
    
    return () => unsubscribe();
  }, [services, error]); // Add 'error' dependency

  return { 
    db: services?.db || null, 
    auth: services?.auth || null, 
    userId, 
    user, 
    isAuthReady,
    error
  };
};