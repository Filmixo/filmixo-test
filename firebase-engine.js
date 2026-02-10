// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔥 FIREBASE ENGINE - Centralized Configuration & SDK
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Version: Firebase v10.8.0 (Modular SDK)
// Purpose: Single source of truth for Firebase config
// Usage: Import in home.js and post.js
// Change SDK version HERE only - auto-updates everywhere
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// Import Firebase SDK v10 (Modular)
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getFirestore, collection, getDocs, doc, getDoc, query, orderBy, limit } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Firebase Configuration (Change project credentials here)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const firebaseConfig = {
  apiKey: "AIzaSyDBEKWjBqTRxyIUn5LjGz9I8B0_CW-vqhs",
  authDomain: "filmixo-bb6af.firebaseapp.com",
  projectId: "filmixo-bb6af",
  storageBucket: "filmixo-bb6af.firebasestorage.app",
  messagingSenderId: "651846896099",
  appId: "1:651846896099:web:9acc58ce67ae54a1b6f3bb",
  measurementId: "G-PKXVL4JKN5"
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Initialize Firebase App
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Export for use in other files
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export { db, collection, getDocs, doc, getDoc, query, orderBy, limit };
