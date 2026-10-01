import { auth, db } from "./firebase.js";

import {
  createUserWithEmailAndPassword,
  updateProfile
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";

import {
  doc,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";


/* =========================================================
   DESTINY MARKETPLACE — CREATE ACCOUNT
========================================================= */

const createAccountForm =
  document.getElementById("createAccountForm");

const nameInput =
  document.getElementById("name");

const emailInput =
  document.getElementById("email");

const passwordInput =
  document.getElementById("password");

const confirmPasswordInput =
  document.getElementById("confirmPassword");

const createAccountButton =
  document.getElementById("createAccountButton");

const errorMessage =
  document.getElementById("errorMessage");


/* =========================================================
   ERROR HANDLING
========================================================= */

function showError(message) {
  if (!errorMessage) return;

  errorMessage.textContent = message;
  errorMessage.classList.add("show");
}

function clearError() {
  if (!errorMessage) return;

  errorMessage.textContent = "";
  errorMessage.classList.remove("show");
}


/* =========================================================
   BUTTON STATE
========================================================= */

function setLoading(isLoading) {
  if (!createAccountButton) return;

  createAccountButton.disabled = isLoading;

  createAccountButton.textContent = isLoading
    ? "Creating account..."
    : "Create account";
}


/* =========================================================
   FORM SUBMISSION
========================================================= */

createAccountForm?.addEventListener(
  "submit",
  async (event) => {
    event.preventDefault();

    clearError();

    const name =
      nameInput?.value.trim() || "";

    const email =
      emailInput?.value.trim() || "";

    const password =
      passwordInput?.value || "";

    const confirmPassword =
      confirmPasswordInput?.value || "";


    /* -------------------------------------------------------
       VALIDATION
    ------------------------------------------------------- */

    if (!name) {
      showError("Please enter your full name.");
      nameInput?.focus();
      return;
    }

    if (!email) {
      showError("Please enter your email address.");
      emailInput?.focus();
      return;
    }

    if (!password) {
      showError("Please create a password.");
      passwordInput?.focus();
      return;
    }

    if (password.length < 6) {
      showError(
        "Your password must be at least 6 characters."
      );
      passwordInput?.focus();
      return;
    }

    if (password !== confirmPassword) {
      showError("Your passwords do not match.");
      confirmPasswordInput?.focus();
      return;
    }


    /* -------------------------------------------------------
       CREATE FIREBASE ACCOUNT
    ------------------------------------------------------- */

    setLoading(true);

    try {
      const userCredential =
        await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );

      const user =
        userCredential.user;


      /* -----------------------------------------------------
         SAVE CUSTOMER NAME TO FIREBASE AUTH
      ----------------------------------------------------- */

      await updateProfile(user, {
        displayName: name
      });


      /* -----------------------------------------------------
         CREATE CUSTOMER DOCUMENT
      ----------------------------------------------------- */

      await setDoc(
        doc(db, "users", user.uid),
        {
          uid: user.uid,
          name: name,
          email: email,

          country: "",
          currency: "USD",

          createdAt: serverTimestamp(),

          usdBalance: 0,
          ngnBalance: 0
        }
      );


      /* -----------------------------------------------------
         SEND CUSTOMER TO DASHBOARD
      ----------------------------------------------------- */

      window.location.href =
        "dashboard.html";

    } catch (error) {
      console.error(
        "Create account error:",
        error
      );


      /* -----------------------------------------------------
         FIREBASE ERROR MESSAGES
      ----------------------------------------------------- */

      switch (error.code) {

        case "auth/email-already-in-use":
          showError(
            "An account with this email already exists."
          );
          break;

        case "auth/invalid-email":
          showError(
            "Please enter a valid email address."
          );
          break;

        case "auth/weak-password":
          showError(
            "Your password is too weak. Please choose a stronger password."
          );
          break;

        case "auth/network-request-failed":
          showError(
            "Network error. Check your connection and try again."
          );
          break;

        default:
          showError(
            "We couldn't create your account right now. Please try again."
          );
      }

      setLoading(false);
    }
  }
);
