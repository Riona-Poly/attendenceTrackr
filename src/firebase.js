import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyACrh3Ron3lORVp6HCh0EWXsw9_O01GICI",
  authDomain: "attendancebunker.firebaseapp.com",
  projectId: "attendancebunker",
  storageBucket: "attendancebunker.firebasestorage.app",
  messagingSenderId: "982367071536",
  appId: "1:982367071536:web:e80e14af35a878f267acf5"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);