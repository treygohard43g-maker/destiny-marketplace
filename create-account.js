// =========================================================
// DESTINY MARKETPLACE — ACCOUNT CREATION
// =========================================================

import { auth, db } from "./firebase.js";

import {
  createUserWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
  deleteUser,
  signOut
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";

import {
  doc,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";


// =========================================================
// FORM ELEMENTS
// =========================================================

const signupForm =
  document.getElementById("signupForm");

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

  signupMessage.textContent =
    message;

  signupMessage.classList.add("show");
}


function clearMessage() {

  if (!signupMessage) return;

  signupMessage.textContent = "";

  signupMessage.classList.remove("show");
}


function setLoading(isLoading) {

  if (!signupButton) return;

  signupButton.disabled =
    isLoading;

  signupButton.textContent =
    isLoading
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

    showMessage(
      "Please enter your full name."
    );

    fullNameInput?.focus();

    return false;
  }


  if (!email) {

    showMessage(
      "Please enter your email address."
    );

    emailInput?.focus();

    return false;
  }


  if (!country) {

    showMessage(
      "Please select your country."
    );

    countryInput?.focus();

    return false;
  }


  if (!phone) {

    showMessage(
      "Please enter your phone number."
    );

    phoneInput?.focus();

    return false;
  }


  if (!password) {

    showMessage(
      "Please create a password."
    );

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

    showMessage(
      "Please confirm your password."
    );

    confirmPasswordInput?.focus();

    return false;
  }


  if (password !== confirmPassword) {

    showMessage(
      "Your passwords do not match."
    );

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


    // -----------------------------------------------------
    // Validate form
    // -----------------------------------------------------

    if (!validateForm()) {
      return;
    }


    // -----------------------------------------------------
    // Collect form data
    // -----------------------------------------------------

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


    let createdUser = null;

    let accountCreated = false;

    let profileCreated = false;


    try {

      // ===================================================
      // 1. CREATE FIREBASE AUTH ACCOUNT
      // ===================================================

      const userCredential =
        await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );


      createdUser =
        userCredential.user;

      accountCreated = true;


      // ===================================================
      // 2. SAVE DISPLAY NAME
      // ===================================================

      await updateProfile(
        createdUser,
        {
          displayName: fullName
        }
      );


      // ===================================================
      // 3. CREATE FIRESTORE CUSTOMER PROFILE
      // ===================================================

      await setDoc(
        doc(
          db,
          "users",
          createdUser.uid
        ),
        {
          uid: createdUser.uid,

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


      profileCreated = true;


      // ===================================================
      // 4. SEND EMAIL VERIFICATION
      // ===================================================

      try {

        await sendEmailVerification(
          createdUser
        );

      } catch (verificationError) {

        console.error(
          "Destiny Marketplace verification email error:",
          verificationError
        );


        // -------------------------------------------------
        // The account itself is valid.
        //
        // Do NOT delete the customer just because the
        // verification email failed to send.
        // -------------------------------------------------

        await signOut(auth);


        if (
          verificationError.code ===
          "auth/too-many-requests"
        ) {

          showMessage(
            "Your account was created, but another verification email cannot be sent yet. Please try signing in later and check your inbox or Spam folder."
          );

        } else {

          showMessage(
            "Your account was created, but we couldn't send the verification email right now. Please try signing in again later."
          );

        }


        setLoading(false);

        return;
      }


      // ===================================================
      // 5. SUCCESS
      // ===================================================

      showMessage(
        `Account created successfully. We sent a verification email to ${email}. Please check your inbox and your Spam or Junk folder if you don't see it.`
      );


      // ---------------------------------------------------
      // Change button state so the customer can clearly
      // see that registration completed.
      // ---------------------------------------------------

      if (signupButton) {

        signupButton.disabled = true;

        signupButton.textContent =
          "Verification email sent";

      }


      // ===================================================
      // 6. SIGN OUT
      // ===================================================

      await signOut(auth);


      // ===================================================
      // 7. MOVE TO LOGIN AFTER A SHORT DELAY
      // ===================================================
      //
      // The delay gives the customer enough time to actually
      // see the verification confirmation on this page.
      // ===================================================

      setTimeout(
        () => {

          window.location.href =
            "login.html?verification=sent";

        },
        2500
      );

    } catch (error) {

      console.error(
        "Destiny Marketplace account creation error:",
        error
      );


      // ===================================================
      // PARTIAL SIGNUP CLEANUP
      // ===================================================
      //
      // Only clean up the Auth account if account creation
      // succeeded but Firestore profile creation failed.
      //
      // Once the profile exists, we preserve the account.
      // ===================================================

      if (
        accountCreated &&
        createdUser &&
        !profileCreated
      ) {

        try {

          await deleteUser(
            createdUser
          );

        } catch (cleanupError) {

          console.error(
            "Destiny Marketplace signup cleanup error:",
            cleanupError
          );

        }

      }


      // ===================================================
      // ERROR HANDLING
      // ===================================================

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
            "We couldn't finish setting up your account. Please try again."
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
