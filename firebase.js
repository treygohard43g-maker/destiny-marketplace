// =========================================================
// DESTINY MARKETPLACE — FIREBASE CONFIGURATION
// =========================================================

import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";

import {
  getAuth
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";

import {
  getFirestore
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";


// Firebase project configuration
const firebaseConfig = {
  apiKey: "AIzaSyCWmK8rT7CZRkmYyK-JENpVaUX1I8vm0OQ",
  authDomain: "destiny-marketplace.firebaseapp.com",
  projectId: "destiny-marketplace",
  storageBucket: "destiny-marketplace.firebasestorage.app",
  messagingSenderId: "500425433660",
  appId: "1:500425433660:web:5806af272b5ca1e9661939"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);


// Firebase Authentication
const auth = getAuth(app);


// Cloud Firestore
const db = getFirestore(app);


// Export services for the rest of the application
export {
  app,
  auth,
  db
};
