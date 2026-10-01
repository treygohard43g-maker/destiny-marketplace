// =========================================================
// DESTINY MARKETPLACE — ACCOUNT CREATION
// =========================================================

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


// =========================================================
// FORM ELEMENTS
// =========================================================

const signupForm = document.getElementById("signupForm");

const fullNameInput =
  document.getElementById("signupFullName");

const emailInput =
  document.getElementById("signupEmail");

const countryInput =
  document.getElementById("signupCountry");

const phoneCountryInput =
  document.getElementById("signupPhoneCountry");

const phoneInput =
  document.getElementById("signupPhone");

const passwordInput =
  document.getElementById("signupPassword");

const confirmPasswordInput =
  document.getElementById("signupConfirmPassword");

const termsInput =
  document.getElementById("terms");

const signupMessage =
  document.getElementById("signupMessage");

const signupButton =
  document.getElementById("signupButton");


// =========================================================
// UI HELPERS
// =========================================================

function showMessage(message) {
  if (!signupMessage) return;

  signupMessage.textContent = message;
  signupMessage.classList.add("show");
}


function clearMessage() {
  if (!signupMessage) return;

  signupMessage.textContent = "";
  signupMessage.classList.remove("show");
}


function setLoading(isLoading) {
  if (!signupButton) return;

  signupButton.disabled = isLoading;

  signupButton.textContent = isLoading
    ? "Creating account..."
    : "Create account";
}


// =========================================================
// FORM VALIDATION
// =========================================================

function validateForm() {
  const fullName =
    fullNameInput?.value.trim() || "";

  const email =
    emailInput?.value.trim() || "";

  const country =
    countryInput?.value || "";

  const phone =
    phoneInput?.value.trim() || "";

  const password =
    passwordInput?.value || "";

  const confirmPassword =
    confirmPasswordInput?.value || "";


  if (!fullName) {
    showMessage("Please enter your full name.");
    fullNameInput?.focus();
    return false;
  }


  if (!email) {
    showMessage("Please enter your email address.");
    emailInput?.focus();
    return false;
  }


  if (!country) {
    showMessage("Please select your country.");
    countryInput?.focus();
    return false;
  }


  if (!phone) {
    showMessage("Please enter your phone number.");
    phoneInput?.focus();
    return false;
  }


  if (!password) {
    showMessage("Please create a password.");
    passwordInput?.focus();
    return false;
  }


  if (password.length < 8) {
    showMessage(
      "Your password must be at least 8 characters."
    );

    passwordInput?.focus();
    return false;
  }


  if (!confirmPassword) {
    showMessage("Please confirm your password.");
    confirmPasswordInput?.focus();
    return false;
  }


  if (password !== confirmPassword) {
    showMessage("Your passwords do not match.");
    confirmPasswordInput?.focus();
    return false;
  }


  if (!termsInput?.checked) {
    showMessage(
      "Please agree to the Terms of Service and Privacy Policy."
    );

    termsInput?.focus();
    return false;
  }


  return true;
}


// =========================================================
// ACCOUNT CREATION
// =========================================================

signupForm?.addEventListener(
  "submit",
  async (event) => {
    event.preventDefault();

    clearMessage();


    // Validate before contacting Firebase.
    if (!validateForm()) {
      return;
    }


    const fullName =
      fullNameInput.value.trim();

    const email =
      emailInput.value.trim().toLowerCase();

    const country =
      countryInput.value;

    const phoneCountry =
      phoneCountryInput?.value || "+234";

    const phone =
      phoneInput.value.trim();

    const password =
      passwordInput.value;


    setLoading(true);


    try {

      // ---------------------------------------------------
      // 1. Create Firebase Authentication account
      // ---------------------------------------------------

      const userCredential =
        await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );


      const user =
        userCredential.user;


      // ---------------------------------------------------
      // 2. Store the customer's display name in Firebase
      // Authentication
      // ---------------------------------------------------

      await updateProfile(user, {
        displayName: fullName
      });


      // ---------------------------------------------------
      // 3. Create the customer's Firestore profile
      // ---------------------------------------------------
      //
      // IMPORTANT:
      // The role is always assigned as "customer".
      //
      // We do NOT allow the browser/user to choose their
      // own role.
      //
      // Initial balances are always zero.
      // ---------------------------------------------------

      await setDoc(
        doc(db, "users", user.uid),
        {
          uid: user.uid,

          name: fullName,

          email: email,

          country: country,

          phoneCountry: phoneCountry,

          phone: phone,

          role: "customer",

          currency: "USD",

          usdBalance: 0,

          ngnBalance: 0,

          createdAt: serverTimestamp(),

          updatedAt: serverTimestamp()
        }
      );


      // ---------------------------------------------------
      // 4. Account successfully created
      // ---------------------------------------------------

      window.location.href =
        "dashboard.html";

    } catch (error) {

      console.error(
        "Destiny Marketplace account creation error:",
        error
      );


      // ---------------------------------------------------
      // Firebase Authentication errors
      // ---------------------------------------------------

      switch (error.code) {

        case "auth/email-already-in-use":

          showMessage(
            "An account with this email already exists."
          );

          break;


        case "auth/invalid-email":

          showMessage(
            "Please enter a valid email address."
          );

          break;


        case "auth/weak-password":

          showMessage(
            "Your password is too weak. Please choose a stronger password."
          );

          break;


        case "auth/network-request-failed":

          showMessage(
            "Network error. Please check your internet connection and try again."
          );

          break;


        case "auth/operation-not-allowed":

          showMessage(
            "Email and password registration is currently unavailable."
          );

          break;


        case "permission-denied":

        case "firestore/permission-denied":

          showMessage(
            "Your account was created, but we couldn't finish setting up your profile. Please contact support."
          );

          break;


        default:

          showMessage(
            "We couldn't create your account right now. Please try again."
          );
      }


      setLoading(false);
    }
  }
);
