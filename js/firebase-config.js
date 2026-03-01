// ============================================
//  Firebase Configuration
//  Bageshwar Bala Ji Sundarkand Mandal
// ============================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

// -----------------------------------------------
//  REPLACE these values with your Firebase project
//  Go to: Firebase Console > Project Settings > Web App
// -----------------------------------------------
// Import the functions you need from the SDKs you need
const firebaseConfig = {
  apiKey: "AIzaSyCEkcXfisIO7a_b0OHre8iFA7sEQMU0Q-A",
  authDomain: "bageshwar-mandal.firebaseapp.com",
  projectId: "bageshwar-mandal",
  storageBucket: "bageshwar-mandal.firebasestorage.app",
  messagingSenderId: "257893299378",
  appId: "1:257893299378:web:3eaba9d84f9b6a8c78c5ab"
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Export services
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

// -----------------------------------------------
//  Admin Email (only this email can log in as admin)
// -----------------------------------------------
export const ADMIN_EMAIL = "chhwjalcm@gmail.com";
