import { auth } from "./firebase.js";

import {
  signInWithEmailAndPassword,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";


/* =========================================================
   DESTINY MARKETPLACE — LOGIN
========================================================= */

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


/* =========================================================
   MESSAGE
========================================================= */

function showMessage(message) {
  if (!loginMessage) return;

  loginMessage.textContent = message;
  loginMessage.classList.add("show");
}

function clearMessage() {
  if (!loginMessage) return;

  loginMessage.textContent = "";
  loginMessage.classList.remove("show");
}


/* =========================================================
   BUTTON STATE
========================================================= */

function setLoading(isLoading) {
  if (!loginButton) return;

  loginButton.disabled = isLoading;

  loginButton.textContent = isLoading
    ? "Signing in..."
    : "Sign in";
}


/* =========================================================
   LOGIN
========================================================= */

loginForm?.addEventListener(
  "submit",
  async (event) => {

    event.preventDefault();

    clearMessage();


    const email =
      emailInput?.value.trim() || "";

    const password =
      passwordInput?.value || "";


    /* -------------------------------------------------------
       VALIDATION
    ------------------------------------------------------- */

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

      /* -----------------------------------------------------
         REMEMBER ME
      ----------------------------------------------------- */

      await setPersistence(
        auth,
        rememberMe?.checked
          ? browserLocalPersistence
          : browserSessionPersistence
      );


      /* -----------------------------------------------------
         SIGN IN
      ----------------------------------------------------- */

      await signInWithEmailAndPassword(
        auth,
        email,
        password
      );


      /* -----------------------------------------------------
         SUCCESS
      ----------------------------------------------------- */

      window.location.href =
        "dashboard.html";


    } catch (error) {

      console.error(
        "Destiny Marketplace login error:",
        error
      );


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
