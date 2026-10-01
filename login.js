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

const verificationStatus =
  urlParams.get("verification");


// =========================================================
// UI HELPERS
// =========================================================

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


function setLoading(isLoading) {

  if (!loginButton) return;

  loginButton.disabled = isLoading;

  loginButton.textContent =
    isLoading
      ? "Signing in..."
      : "Sign in";
}


// =========================================================
// VERIFICATION STATUS MESSAGE
// =========================================================

if (verificationStatus === "sent") {

  showMessage(
    "Account created successfully. We sent a verification email to your inbox. Please verify your email before signing in. Check your Spam or Junk folder if you don't see it."
  );

}


if (verificationStatus === "required") {

  showMessage(
    "Please verify your email address before accessing your account. Check your inbox or Spam folder for the verification email."
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


    // ===================================================
    // COLLECT FORM VALUES
    // ===================================================

    const email =
      emailInput?.value.trim().toLowerCase() || "";

    const password =
      passwordInput?.value || "";


    // ===================================================
    // VALIDATION
    // ===================================================

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

      // =================================================
      // 1. AUTH PERSISTENCE
      // =================================================

      await setPersistence(
        auth,
        rememberMe?.checked
          ? browserLocalPersistence
          : browserSessionPersistence
      );


      // =================================================
      // 2. SIGN IN
      // =================================================

      const userCredential =
        await signInWithEmailAndPassword(
          auth,
          email,
          password
        );


      const user =
        userCredential.user;


      // =================================================
      // 3. REFRESH FIREBASE USER
      // =================================================
      //
      // This is important because the customer may have
      // clicked the verification link in another tab,
      // browser, or device.
      // =================================================

      await user.reload();


      // =================================================
      // 4. EMAIL VERIFICATION CHECK
      // =================================================

      if (!user.emailVerified) {

        // ------------------------------------------------
        // Try to send another verification email.
        // ------------------------------------------------

        try {

          await sendEmailVerification(user);

          showMessage(
            "Your email is not verified yet. We sent a new verification email to your inbox. Please verify your email, then sign in again. Check your Spam or Junk folder if needed."
          );

        } catch (verificationError) {

          console.error(
            "Destiny Marketplace verification email error:",
            verificationError
          );


          if (
            verificationError.code ===
            "auth/too-many-requests"
          ) {

            showMessage(
              "Your email is not verified yet. A verification email was already sent recently. Please check your inbox or Spam folder and try again later."
            );

          } else {

            showMessage(
              "Your email is not verified yet. Please check your inbox or Spam folder for the verification email."
            );

          }
        }


        // ------------------------------------------------
        // Never keep an unverified customer authenticated.
        // ------------------------------------------------

        await signOut(auth);

        setLoading(false);

        return;
      }


      // =================================================
      // 5. VERIFIED CUSTOMER
      // =================================================

      window.location.replace(
        "dashboard.html"
      );

    } catch (error) {

      console.error(
        "Destiny Marketplace login error:",
        error
      );


      // =================================================
      // FIREBASE ERROR HANDLING
      // =================================================

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
            "Network error. Please check your internet connection and try again."
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
