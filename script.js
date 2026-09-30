/* =========================================================
   DESTINY MARKETPLACE
   Homepage Interactions
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  /* =======================================================
     ELEMENTS
  ======================================================= */

  const header = document.querySelector(".site-header");
  const menuButton = document.querySelector(".menu-toggle");
  const mobileMenu = document.querySelector(".mobile-menu");

  const revealElements = document.querySelectorAll(".reveal");


  /* =======================================================
     MOBILE NAVIGATION
  ======================================================= */

  if (menuButton && mobileMenu) {
    menuButton.addEventListener("click", () => {
      const isOpen = mobileMenu.classList.toggle("is-open");

      menuButton.setAttribute("aria-expanded", String(isOpen));

      document.body.classList.toggle("menu-open", isOpen);
    });

    const mobileLinks = mobileMenu.querySelectorAll("a");

    mobileLinks.forEach((link) => {
      link.addEventListener("click", () => {
        mobileMenu.classList.remove("is-open");
        menuButton.setAttribute("aria-expanded", "false");
        document.body.classList.remove("menu-open");
      });
    });
  }


  /* =======================================================
     HEADER SCROLL STATE
  ======================================================= */

  const updateHeader = () => {
    if (!header) return;

    if (window.scrollY > 20) {
      header.classList.add("is-scrolled");
    } else {
      header.classList.remove("is-scrolled");
    }
  };

  updateHeader();

  window.addEventListener(
    "scroll",
    updateHeader,
    {
      passive: true
    }
  );


  /* =======================================================
     SCROLL REVEAL
  ======================================================= */

  if ("IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          entry.target.classList.add("is-visible");

          observer.unobserve(entry.target);
        });
      },
      {
        threshold: 0.12,
        rootMargin: "0px 0px -40px 0px"
      }
    );

    revealElements.forEach((element) => {
      revealObserver.observe(element);
    });
  } else {
    /*
      Fallback for older browsers.
      If IntersectionObserver isn't available,
      simply show all reveal elements.
    */

    revealElements.forEach((element) => {
      element.classList.add("is-visible");
    });
  }


  /* =======================================================
     CURRENT YEAR
  ======================================================= */

  const yearElements = document.querySelectorAll("[data-year]");

  yearElements.forEach((element) => {
    element.textContent = new Date().getFullYear();
  });


  /* =======================================================
     PRODUCT AREA
     -------------------------------------------------------
     Products will later come from Firestore.

     We intentionally do NOT create fake products here.
  ======================================================= */

  const featuredProducts =
    document.getElementById("featuredProducts");

  if (featuredProducts) {
    /*
      Firebase product loading will be added later.

      Expected future flow:

      Firestore
          ↓
      products collection
          ↓
      JavaScript
          ↓
      product cards
          ↓
      featuredProducts
    */
  }


  /* =======================================================
     ESCAPE KEY
     -------------------------------------------------------
     Allows users to close the mobile menu with Escape.
  ======================================================= */

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;

    if (
      mobileMenu &&
      mobileMenu.classList.contains("is-open")
    ) {
      mobileMenu.classList.remove("is-open");

      if (menuButton) {
        menuButton.setAttribute(
          "aria-expanded",
          "false"
        );
      }

      document.body.classList.remove("menu-open");
    }
  });
});