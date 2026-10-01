// =========================================================
// DESTINY MARKETPLACE — CUSTOMER DASHBOARD
// =========================================================

import { auth, db } from "./firebase.js";

import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";

import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";


// =========================================================
// DOM ELEMENTS
// =========================================================

// Header
const headerAvatar =
  document.getElementById("headerAvatar");

const headerUserName =
  document.getElementById("headerUserName");

const headerUserEmail =
  document.getElementById("headerUserEmail");


// Welcome
const welcomeName =
  document.getElementById("welcomeName");


// Balances
const usdBalance =
  document.getElementById("usdBalance");

const ngnBalance =
  document.getElementById("ngnBalance");


// Sidebar
const sidebarAvatar =
  document.getElementById("sidebarAvatar");

const sidebarUserName =
  document.getElementById("sidebarUserName");


// Profile
const profileAvatar =
  document.getElementById("profileAvatar");

const profileName =
  document.getElementById("profileName");

const profileEmail =
  document.getElementById("profileEmail");

const profileCountry =
  document.getElementById("profileCountry");

const profileRole =
  document.getElementById("profileRole");


// Logout
const logoutButton =
  document.getElementById("logoutButton");


// Toast
const dashboardToast =
  document.getElementById("dashboardToast");

const toastMessage =
  document.getElementById("toastMessage");


// Mobile navigation
const dashboardSidebar =
  document.getElementById("dashboardSidebar");

const sidebarOverlay =
  document.getElementById("sidebarOverlay");

const mobileMenuButton =
  document.getElementById("mobileMenuButton");

const sidebarClose =
  document.getElementById("sidebarClose");


// =========================================================
// HELPERS
// =========================================================

function getInitials(name) {

  if (!name) {
    return "D";
  }

  const parts =
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean);

  if (parts.length === 1) {
    return parts[0]
      .charAt(0)
      .toUpperCase();
  }

  return (
    parts[0].charAt(0) +
    parts[parts.length - 1].charAt(0)
  ).toUpperCase();
}


function formatUsd(value) {

  const amount =
    Number(value) || 0;

  return amount.toLocaleString(
    "en-US",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }
  );
}


function formatNgn(value) {

  const amount =
    Number(value) || 0;

  return amount.toLocaleString(
    "en-NG",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }
  );
}


// =========================================================
// TOAST
// =========================================================

let toastTimeout = null;


function showToast(message) {

  if (!dashboardToast || !toastMessage) {
    return;
  }

  toastMessage.textContent =
    message;

  dashboardToast.classList.add("show");

  clearTimeout(toastTimeout);

  toastTimeout =
    setTimeout(
      () => {
        dashboardToast.classList.remove("show");
      },
      3000
    );
}


// =========================================================
// MOBILE SIDEBAR
// =========================================================

function openSidebar() {

  dashboardSidebar?.classList.add("open");

  sidebarOverlay?.classList.add("show");

  document.body.classList.add(
    "sidebar-open"
  );
}


function closeSidebar() {

  dashboardSidebar?.classList.remove("open");

  sidebarOverlay?.classList.remove("show");

  document.body.classList.remove(
    "sidebar-open"
  );
}


mobileMenuButton?.addEventListener(
  "click",
  openSidebar
);


sidebarClose?.addEventListener(
  "click",
  closeSidebar
);


sidebarOverlay?.addEventListener(
  "click",
  closeSidebar
);


// =========================================================
// CUSTOMER PROFILE
// =========================================================

async function loadCustomerProfile(user) {

  try {

    const userReference =
      doc(
        db,
        "users",
        user.uid
      );


    const userSnapshot =
      await getDoc(
        userReference
      );


    if (!userSnapshot.exists()) {

      console.error(
        "Destiny Marketplace: Customer profile not found."
      );

      showToast(
        "We couldn't load your customer profile."
      );

      return;
    }


    const profile =
      userSnapshot.data();


    // =====================================================
    // CUSTOMER DATA
    // =====================================================

    const customerName =
      profile.name ||
      user.displayName ||
      "Customer";


    const customerEmail =
      profile.email ||
      user.email ||
      "";


    const customerCountry =
      profile.country ||
      "Country not provided";


    const customerRole =
      profile.role ||
      "customer";


    const customerUsdBalance =
      profile.usdBalance ?? 0;


    const customerNgnBalance =
      profile.ngnBalance ?? 0;


    const initials =
      getInitials(
        customerName
      );


    // =====================================================
    // HEADER
    // =====================================================

    if (headerUserName) {

      headerUserName.textContent =
        customerName;

    }


    if (headerUserEmail) {

      headerUserEmail.textContent =
        customerEmail;

    }


    if (headerAvatar) {

      headerAvatar.textContent =
        initials;

    }


    // =====================================================
    // WELCOME
    // =====================================================

    if (welcomeName) {

      // Show first name in the greeting.
      const firstName =
        customerName
          .trim()
          .split(/\s+/)[0];

      welcomeName.textContent =
        firstName || "Customer";

    }


    // =====================================================
    // BALANCES
    // =====================================================

    if (usdBalance) {

      usdBalance.textContent =
        formatUsd(
          customerUsdBalance
        );

    }


    if (ngnBalance) {

      ngnBalance.textContent =
        formatNgn(
          customerNgnBalance
        );

    }


    // =====================================================
    // SIDEBAR
    // =====================================================

    if (sidebarUserName) {

      sidebarUserName.textContent =
        customerName;

    }


    if (sidebarAvatar) {

      sidebarAvatar.textContent =
        initials;

    }


    // =====================================================
    // PROFILE
    // =====================================================

    if (profileAvatar) {

      profileAvatar.textContent =
        initials;

    }


    if (profileName) {

      profileName.textContent =
        customerName;

    }


    if (profileEmail) {

      profileEmail.textContent =
        customerEmail;

    }


    if (profileCountry) {

      profileCountry.textContent =
        customerCountry;

    }


    if (profileRole) {

      profileRole.textContent =
        customerRole
          .charAt(0)
          .toUpperCase() +
        customerRole.slice(1);

    }

  } catch (error) {

    console.error(
      "Destiny Marketplace profile loading error:",
      error
    );

    showToast(
      "We couldn't load your dashboard data."
    );
  }
}


// =========================================================
// DASHBOARD ACTIONS
// =========================================================

const dashboardActions =
  document.querySelectorAll(
    ".dashboard-action"
  );


dashboardActions.forEach(
  (button) => {

    button.addEventListener(
      "click",
      () => {

        const action =
          button.dataset.action;


        closeSidebar();


        switch (action) {

          case "shop":

            showToast(
              "Marketplace shopping is coming soon."
            );

            break;


          case "orders":

            showToast(
              "Your orders section is coming soon."
            );

            break;


          case "giftcards":

            showToast(
              "Gift card services are coming soon."
            );

            break;


          case "sim":

            showToast(
              "Germany SIM services are coming soon."
            );

            break;


          case "bitcoin":

            showToast(
              "Bitcoin services are coming soon."
            );

            break;


          case "exchange":

            showToast(
              "Gift card exchange is coming soon."
            );

            break;


          case "profile":

            showToast(
              "Profile management is coming soon."
            );

            break;


          case "settings":

            showToast(
              "Account settings are coming soon."
            );

            break;


          case "notifications":

            showToast(
              "You have no new notifications."
            );

            break;


          case "funds":

            showToast(
              "Wallet funding is coming soon."
            );

            break;


          default:

            showToast(
              "This service is coming soon."
            );

        }

      }
    );

  }
);


// =========================================================
// LOGOUT
// =========================================================

logoutButton?.addEventListener(
  "click",
  async () => {

    if (logoutButton) {

      logoutButton.disabled =
        true;

      logoutButton.classList.add(
        "is-loading"
      );

    }


    try {

      await signOut(auth);

      window.location.replace(
        "login.html"
      );

    } catch (error) {

      console.error(
        "Destiny Marketplace logout error:",
        error
      );


      if (logoutButton) {

        logoutButton.disabled =
          false;

        logoutButton.classList.remove(
          "is-loading"
        );

      }


      showToast(
        "Unable to sign out right now. Please try again."
      );

    }

  }
);


// =========================================================
// AUTHENTICATION GUARD
// =========================================================
//
// The dashboard must only be accessible to:
// 1. A signed-in Firebase user.
// 2. A user whose email has been verified.
//
// This protects the customer dashboard from unauthenticated
// visitors and unverified accounts.
// =========================================================

onAuthStateChanged(
  auth,
  async (user) => {

    // -----------------------------------------------------
    // No authenticated user
    // -----------------------------------------------------

    if (!user) {

      window.location.replace(
        "login.html"
      );

      return;
    }


    // -----------------------------------------------------
    // Refresh Firebase user state.
    //
    // This is important when the customer verified their
    // email in another browser, tab, or device.
    // -----------------------------------------------------

    try {

      await user.reload();

    } catch (error) {

      console.error(
        "Destiny Marketplace authentication refresh error:",
        error
      );

      await signOut(auth);

      window.location.replace(
        "login.html"
      );

      return;
    }


    // -----------------------------------------------------
    // Verify email
    // -----------------------------------------------------

    if (!user.emailVerified) {

      await signOut(auth);

      window.location.replace(
        "login.html?verification=required"
      );

      return;
    }


    // -----------------------------------------------------
    // Verified customer
    // -----------------------------------------------------

    await loadCustomerProfile(
      user
    );

  }
);
