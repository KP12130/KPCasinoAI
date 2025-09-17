import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc, updateDoc, onSnapshot, collection, query, orderBy, limit, where } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebasestorage.app`,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

const provider = new GoogleAuthProvider();

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error) {
    console.error("Error signing in with Google:", error);
    throw error;
  }
};

export const signOutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out:", error);
    throw error;
  }
};

export const createUserDocument = async (user: User) => {
  const userRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userRef);
  
  if (!userSnap.exists()) {
    await setDoc(userRef, {
      firebaseUid: user.uid,
      email: user.email,
      displayName: user.displayName,
      balance: 1000.00,
      totalWagered: 0.00,
      totalWon: 0.00,
      gamesPlayed: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
  
  return userSnap.exists() ? userSnap.data() : null;
};

export const updateUserBalance = async (userId: string, newBalance: number, wagered: number, won: number) => {
  const userRef = doc(db, "users", userId);
  await updateDoc(userRef, {
    balance: newBalance,
    totalWagered: wagered,
    totalWon: won,
    gamesPlayed: increment(1),
    updatedAt: new Date(),
  });
};

export const addGameToHistory = async (userId: string, gameData: any) => {
  const historyRef = collection(db, "gameHistory");
  await setDoc(doc(historyRef), {
    userId,
    ...gameData,
    createdAt: new Date(),
  });
};

export const subscribeToUserData = (userId: string, callback: (data: any) => void) => {
  const userRef = doc(db, "users", userId);
  return onSnapshot(userRef, (doc) => {
    if (doc.exists()) {
      callback(doc.data());
    }
  });
};

export const subscribeToGameHistory = (userId: string, callback: (games: any[]) => void) => {
  const historyRef = collection(db, "gameHistory");
  const q = query(
    historyRef,
    where("userId", "==", userId),
    orderBy("createdAt", "desc"),
    limit(10)
  );
  
  return onSnapshot(q, (snapshot) => {
    const games = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(games);
  });
};

export { onAuthStateChanged };

// Helper function for incrementing values
const increment = (value: number) => ({
  increment: value
});
