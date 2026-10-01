// =========================================================
// DESTINY MARKETPLACE — LOGIN
// =========================================================

import { auth } from "./firebase.js";

import {
  signInWithEmailAndPassword,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  sendEmailVerification,
  signOut
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";


// =========================================================
// FORM ELEMENTS
// =========================================================

const loginForm =
  document.getElementById("loginForm");

const emailInput =
  document.getElementById("loginEmail");

const passwordInput =
  document.getElementById("loginPassword");

const rememberMe =
  document.getElementById("rememberMe");

const loginButton =
  document.getElementById("loginButton");

const loginMessage =
  document.getElementById("loginMessage");


// =========================================================
// URL PARAMETERS
// =========================================================

const urlParams =
  new URLSearchParams(window.location.search);

const verificationSent =
  urlParams.get("verification") === "sent";


// =========================================================
// UI HELPERS
// =========================================================

function showMessage(message) {

  if (!loginMessage) return;

  loginMessage.textContent =
    message;

  loginMessage.classList.add("show");
}


function clearMessage() {

  if (!loginMessage) return;

  loginMessage.textContent = "";

  loginMessage.classList.remove("show");
}


function setLoading(isLoading) {

  if (!loginButton) return;

  loginButton.disabled =
    isLoading;

  loginButton.textContent =
    isLoading
      ? "Signing in..."
      : "Sign in";
}


// =========================================================
// VERIFICATION MESSAGE
// =========================================================

if (verificationSent) {

  showMessage(
    "Your account was created. Please check your email and verify your address before signing in."
  );
}


// =========================================================
// LOGIN
// =========================================================

loginForm?.addEventListener(
  "submit",
  async (event) => {

    event.preventDefault();

    clearMessage();


    // -----------------------------------------------------
    // Collect form values
    // -----------------------------------------------------

    const email =
      emailInput?.value.trim().toLowerCase() || "";

    const password =
      passwordInput?.value || "";


    // -----------------------------------------------------
    // Basic validation
    // -----------------------------------------------------

    if (!email) {

      showMessage(
        "Please enter your email address."
      );

      emailInput?.focus();

      return;
    }


    if (!password) {

      showMessage(
        "Please enter your password."
      );

      passwordInput?.focus();

      return;
    }


    setLoading(true);


    try {

      // ===================================================
      // 1. SET AUTH PERSISTENCE
      // ===================================================

      await setPersistence(
        auth,
        rememberMe?.checked
          ? browserLocalPersistence
          : browserSessionPersistence
      );


      // ===================================================
      // 2. SIGN IN
      // ===================================================

      const userCredential =
        await signInWithEmailAndPassword(
          auth,
          email,
          password
        );


      const user =
        userCredential.user;


      // ===================================================
      // 3. REFRESH USER INFORMATION
      // ===================================================
      //
      // Firebase can cache authentication information.
      // Reloading ensures emailVerified reflects the
      // current server state after the user clicks the
      // verification link.
      // ===================================================

      await user.reload();


      // ===================================================
      // 4. CHECK EMAIL VERIFICATION
      // ===================================================

      if (!user.emailVerified) {

        // -------------------------------------------------
        // Sign the user out so an unverified account does
        // not remain authenticated in the browser.
        // -------------------------------------------------

        await signOut(auth);


        // -------------------------------------------------
        // Tell the customer exactly what to do.
        // -------------------------------------------------

        showMessage(
          "Your email address has not been verified yet. Please check your inbox and verify your email before signing in."
        );


        setLoading(false);

        return;
      }


      // ===================================================
      // 5. VERIFIED USER — OPEN DASHBOARD
      // ===================================================

      window.location.href =
        "dashboard.html";


    } catch (error) {

      console.error(
        "Destiny Marketplace login error:",
        error
      );


      // ===================================================
      // FIREBASE ERROR HANDLING
      // ===================================================

      switch (error.code) {

        case "auth/invalid-email":

          showMessage(
            "Please enter a valid email address."
          );

          break;


        case "auth/user-not-found":

        case "auth/wrong-password":

        case "auth/invalid-credential":

          showMessage(
            "Incorrect email or password."
          );

          break;


        case "auth/user-disabled":

          showMessage(
            "This account has been disabled. Please contact support."
          );

          break;


        case "auth/too-many-requests":

          showMessage(
            "Too many unsuccessful attempts. Please try again later."
          );

          break;


        case "auth/network-request-failed":

          showMessage(
            "Network error. Please check your internet connection."
          );

          break;


        default:

          showMessage(
            "Unable to sign in right now. Please try again."
          );
      }


      setLoading(false);
    }
  }
);
