import { auth } from "./firebase.js";

import {
  signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";

const loginForm = document.getElementById("loginForm");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const loginButton = document.getElementById("loginButton");
const errorMessage = document.getElementById("errorMessage");

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

function setLoading(isLoading) {
  if (!loginButton) return;

  loginButton.disabled = isLoading;

  loginButton.textContent = isLoading
    ? "Signing in..."
    : "Sign in";
}

loginForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  clearError();

  const email = emailInput?.value.trim() || "";
  const password = passwordInput?.value || "";

  if (!email || !password) {
    showError("Please enter your email and password.");
    return;
  }

  setLoading(true);

  try {
    await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

    window.location.href = "dashboard.html";

  } catch (error) {
    console.error("Login error:", error);

    switch (error.code) {
      case "auth/invalid-email":
        showError("Please enter a valid email address.");
        break;

      case "auth/user-not-found":
      case "auth/invalid-credential":
        showError("Incorrect email or password.");
        break;

      case "auth/wrong-password":
        showError("Incorrect email or password.");
        break;

      case "auth/too-many-requests":
        showError(
          "Too many unsuccessful attempts. Please try again later."
        );
        break;

      case "auth/network-request-failed":
        showError(
          "Network error. Check your internet connection and try again."
        );
        break;

      default:
        showError(
          "Unable to sign in right now. Please try again."
        );
    }

    setLoading(false);
  }
});
