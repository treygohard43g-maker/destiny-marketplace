/* =========================================================
   DESTINY MARKETPLACE
   Homepage Interactions
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

  /* =======================================================
     ELEMENTS
  ======================================================= */

  const header = document.querySelector(".site-header");

  const menuButton = document.querySelector("#menuButton");
  const mobileMenu = document.querySelector("#mobileMenu");

  const searchButton = document.querySelector("#searchButton");

  const revealElements =
    document.querySelectorAll(".reveal");

  const yearElements =
    document.querySelectorAll("[data-year]");

  const featuredProducts =
    document.getElementById("featuredProducts");


  /* =======================================================
     MOBILE MENU
  ======================================================= */

  const closeMobileMenu = () => {

    if (!mobileMenu || !menuButton) {
      return;
    }

    mobileMenu.classList.remove("is-open");

    menuButton.setAttribute(
      "aria-expanded",
      "false"
    );

    mobileMenu.setAttribute(
      "aria-hidden",
      "true"
    );

    document.body.classList.remove("menu-open");

    const icon =
      menuButton.querySelector("i");

    if (icon) {
      icon.classList.remove("fa-xmark");
      icon.classList.add("fa-bars");
    }

  };


  const openMobileMenu = () => {

    if (!mobileMenu || !menuButton) {
      return;
    }

    mobileMenu.classList.add("is-open");

    menuButton.setAttribute(
      "aria-expanded",
      "true"
    );

    mobileMenu.setAttribute(
      "aria-hidden",
      "false"
    );

    document.body.classList.add("menu-open");

    const icon =
      menuButton.querySelector("i");

    if (icon) {
      icon.classList.remove("fa-bars");
      icon.classList.add("fa-xmark");
    }

  };


  if (menuButton && mobileMenu) {

    menuButton.addEventListener(
      "click",
      () => {

        const isOpen =
          mobileMenu.classList.contains("is-open");

        if (isOpen) {
          closeMobileMenu();
        } else {
          openMobileMenu();
        }

      }
    );


    const mobileLinks =
      mobileMenu.querySelectorAll("a");

    mobileLinks.forEach((link) => {

      link.addEventListener(
        "click",
        () => {
          closeMobileMenu();
        }
      );

    });

  }


  /* =======================================================
     CLOSE MENU WHEN RESIZING TO DESKTOP
  ======================================================= */

  window.addEventListener(
    "resize",
    () => {

      if (window.innerWidth > 1050) {
        closeMobileMenu();
      }

    }
  );


  /* =======================================================
     HEADER SCROLL EFFECT
  ======================================================= */

  const updateHeader = () => {

    if (!header) {
      return;
    }

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
     REVEAL ANIMATIONS
  ======================================================= */

  if (
    "IntersectionObserver" in window &&
    revealElements.length > 0
  ) {

    const revealObserver =
      new IntersectionObserver(
        (entries, observer) => {

          entries.forEach((entry) => {

            if (!entry.isIntersecting) {
              return;
            }

            entry.target.classList.add(
              "is-visible"
            );

            observer.unobserve(
              entry.target
            );

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

    revealElements.forEach((element) => {

      element.classList.add(
        "is-visible"
      );

    });

  }


  /* =======================================================
     CURRENT YEAR
  ======================================================= */

  const currentYear =
    new Date().getFullYear();

  yearElements.forEach((element) => {

    element.textContent =
      currentYear;

  });


  /* =======================================================
     SEARCH
  ======================================================= */

  if (searchButton) {

    searchButton.addEventListener(
      "click",
      () => {

        const searchSection =
          document.getElementById(
            "shop"
          );

        if (searchSection) {

          searchSection.scrollIntoView({
            behavior: "smooth",
            block: "start"
          });

        }

        /*
         * Full marketplace search will be
         * connected when the product catalog
         * and Firestore search system are added.
         */

      }
    );

  }


  /* =======================================================
     FEATURED PRODUCTS
  ======================================================= */

  if (featuredProducts) {

    /*
     * Firestore product loading will be
     * connected here next.
     *
     * The homepage currently keeps the
     * empty-state UI until real products
     * are available.
     */

  }


  /* =======================================================
     ESCAPE KEY
  ======================================================= */

  document.addEventListener(
    "keydown",
    (event) => {

      if (event.key === "Escape") {

        closeMobileMenu();

      }

    }
  );


  /* =======================================================
     CLOSE MENU WHEN CLICKING OUTSIDE
  ======================================================= */

  document.addEventListener(
    "click",
    (event) => {

      if (!mobileMenu || !menuButton) {
        return;
      }

      const isOpen =
        mobileMenu.classList.contains(
          "is-open"
        );

      if (!isOpen) {
        return;
      }

      const clickedInsideMenu =
        mobileMenu.contains(
          event.target
        );

      const clickedMenuButton =
        menuButton.contains(
          event.target
        );

      if (
        !clickedInsideMenu &&
        !clickedMenuButton
      ) {

        closeMobileMenu();

      }

    }
  );

});
