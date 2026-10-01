/* =========================================================
   DESTINY MARKETPLACE
   CUSTOMER MARKETPLACE LOGIC
   ========================================================= */

import { auth, db } from "./firebase.js";

import {
  onAuthStateChanged,
  signOut,
  reload
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";

import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";


/* =========================================================
   DOM ELEMENTS
   ========================================================= */

const sidebar = document.getElementById("dashboardSidebar");
const sidebarOverlay = document.getElementById("sidebarOverlay");
const mobileMenuButton = document.getElementById("mobileMenuButton");
const sidebarClose = document.getElementById("sidebarClose");

const logoutButton = document.getElementById("logoutButton");

const productSearch = document.getElementById("productSearch");
const clearSearch = document.getElementById("clearSearch");
const clearSearchButton = document.getElementById("clearSearchButton");

const categoryList = document.getElementById("categoryList");

const productSort = document.getElementById("productSort");
const productGrid = document.getElementById("productGrid");

const productsLoading = document.getElementById("productsLoading");
const productsEmpty = document.getElementById("productsEmpty");
const productsError = document.getElementById("productsError");

const productsEmptyMessage =
  document.getElementById("productsEmptyMessage");

const retryProductsButton =
  document.getElementById("retryProductsButton");

const productsTitle =
  document.getElementById("productsTitle");

const productsKicker =
  document.getElementById("productsKicker");

const searchResultMessage =
  document.getElementById("searchResultMessage");

const searchTerm =
  document.getElementById("searchTerm");

const dashboardToast =
  document.getElementById("dashboardToast");

const toastMessage =
  document.getElementById("toastMessage");

const sidebarAvatar =
  document.getElementById("sidebarAvatar");

const sidebarUserName =
  document.getElementById("sidebarUserName");

const cartCount =
  document.getElementById("cartCount");

const headerCartCount =
  document.getElementById("headerCartCount");


/* =========================================================
   APPLICATION STATE
   ========================================================= */

let allProducts = [];

let activeCategory = "all";

let currentSearch = "";

let currentSort = "newest";

let toastTimer = null;


/* =========================================================
   CONSTANTS
   ========================================================= */

const PRODUCTS_COLLECTION = "products";

const CART_STORAGE_KEY = "destinyMarketplaceCart";


/* =========================================================
   AUTHENTICATION
   ========================================================= */

onAuthStateChanged(auth, async (user) => {

  if (!user) {
    window.location.href = "login.html";
    return;
  }

  try {

    await reload(user);

    if (!auth.currentUser) {
      window.location.href = "login.html";
      return;
    }

    if (!auth.currentUser.emailVerified) {

      await signOut(auth);

      window.location.href =
        "login.html?verification=required";

      return;
    }

    await loadCustomerProfile();

    updateCartCount();

    await loadProducts();

  } catch (error) {

    console.error(
      "Marketplace initialization failed:",
      error
    );

    showToast(
      "We couldn't load your marketplace account."
    );

  }

});


/* =========================================================
   CUSTOMER PROFILE
   ========================================================= */

async function loadCustomerProfile() {

  const user = auth.currentUser;

  if (!user) {
    return;
  }

  const fallbackName =
    user.displayName ||
    user.email?.split("@")[0] ||
    "Customer";

  const firstLetter =
    fallbackName
      .trim()
      .charAt(0)
      .toUpperCase() || "D";

  if (sidebarUserName) {
    sidebarUserName.textContent = fallbackName;
  }

  if (sidebarAvatar) {
    sidebarAvatar.textContent = firstLetter;
  }

  /*
   * Profile information will eventually be expanded
   * inside the Settings area.
   *
   * We intentionally do not display account balances
   * or verification information on the marketplace.
   */
}


/* =========================================================
   LOAD PRODUCTS
   ========================================================= */

async function loadProducts() {

  showProductsLoading();

  try {

    const productsReference =
      collection(db, PRODUCTS_COLLECTION);

    const snapshot =
      await getDocs(productsReference);

    allProducts = snapshot.docs
      .map((documentSnapshot) => {

        return normalizeProduct(
          documentSnapshot.id,
          documentSnapshot.data()
        );

      })
      .filter((product) => {

        return isProductVisible(product);

      });

    renderMarketplace();

  } catch (error) {

    console.error(
      "Failed to load products:",
      error
    );

    showProductsError();

    showToast(
      "Unable to load marketplace products."
    );

  }

}


/* =========================================================
   NORMALIZE PRODUCT DATA
   ========================================================= */

function normalizeProduct(id, data) {

  return {

    id,

    name:
      typeof data.name === "string"
        ? data.name.trim()
        : "Unnamed product",

    description:
      typeof data.description === "string"
        ? data.description.trim()
        : "",

    category:
      typeof data.category === "string"
        ? data.category.trim().toLowerCase()
        : "other",

    price:
      Number.isFinite(Number(data.price))
        ? Number(data.price)
        : 0,

    currency:
      typeof data.currency === "string"
        ? data.currency.trim().toUpperCase()
        : "USD",

    imageUrl:
      typeof data.imageUrl === "string"
        ? data.imageUrl.trim()
        : "",

    stock:
      data.stock !== undefined &&
      data.stock !== null &&
      data.stock !== ""
        ? Number(data.stock)
        : null,

    status:
      typeof data.status === "string"
        ? data.status.trim().toLowerCase()
        : "active",

    createdAt:
      data.createdAt || null,

    updatedAt:
      data.updatedAt || null

  };

}


/* =========================================================
   PRODUCT VISIBILITY
   ========================================================= */

function isProductVisible(product) {

  const unavailableStatuses = [
    "inactive",
    "unavailable",
    "archived",
    "draft",
    "deleted"
  ];

  if (
    unavailableStatuses.includes(product.status)
  ) {
    return false;
  }

  /*
   * If stock is explicitly provided and is zero or below,
   * the product is not displayed as available.
   *
   * If stock is missing, we allow the product because
   * some digital products may not use traditional stock.
   */

  if (
    product.stock !== null &&
    product.stock <= 0
  ) {
    return false;
  }

  return true;

}


/* =========================================================
   MARKETPLACE RENDERING
   ========================================================= */

function renderMarketplace() {

  const filteredProducts =
    getFilteredProducts();

  const sortedProducts =
    sortProducts(filteredProducts);

  updateMarketplaceHeading();

  if (sortedProducts.length === 0) {

    showProductsEmpty();

    return;

  }

  hideProductsEmpty();

  renderProducts(sortedProducts);

}


/* =========================================================
   FILTER PRODUCTS
   ========================================================= */

function getFilteredProducts() {

  const search =
    currentSearch
      .trim()
      .toLowerCase();

  return allProducts.filter((product) => {

    const matchesCategory =
      activeCategory === "all" ||
      product.category === activeCategory;

    if (!matchesCategory) {
      return false;
    }

    if (!search) {
      return true;
    }

    const searchableText = [

      product.name,

      product.description,

      product.category

    ]
      .join(" ")
      .toLowerCase();

    return searchableText.includes(search);

  });

}


/* =========================================================
   SORT PRODUCTS
   ========================================================= */

function sortProducts(products) {

  const sorted = [...products];

  switch (currentSort) {

    case "price-low":

      sorted.sort(
        (a, b) => a.price - b.price
      );

      break;


    case "price-high":

      sorted.sort(
        (a, b) => b.price - a.price
      );

      break;


    case "name":

      sorted.sort(
        (a, b) =>
          a.name.localeCompare(
            b.name,
            undefined,
            {
              sensitivity: "base"
            }
          )
      );

      break;


    case "newest":

    default:

      sorted.sort(
        (a, b) =>
          getTimestamp(b.createdAt) -
          getTimestamp(a.createdAt)
      );

      break;

  }

  return sorted;

}


/* =========================================================
   TIMESTAMP HELPER
   ========================================================= */

function getTimestamp(value) {

  if (!value) {
    return 0;
  }

  if (
    typeof value.toMillis === "function"
  ) {
    return value.toMillis();
  }

  if (
    value instanceof Date
  ) {
    return value.getTime();
  }

  if (
    typeof value === "number"
  ) {
    return value;
  }

  if (
    typeof value === "string"
  ) {

    const timestamp =
      Date.parse(value);

    return Number.isNaN(timestamp)
      ? 0
      : timestamp;

  }

  return 0;

}


/* =========================================================
   RENDER PRODUCT CARDS
   ========================================================= */

function renderProducts(products) {

  if (!productGrid) {
    return;
  }

  productGrid.innerHTML =
    products
      .map((product) => {

        return createProductCard(product);

      })
      .join("");

  attachProductCardEvents();

}


/* =========================================================
   PRODUCT CARD
   ========================================================= */

function createProductCard(product) {

  const formattedPrice =
    formatPrice(
      product.price,
      product.currency
    );

  const categoryName =
    formatCategoryName(
      product.category
    );

  const imageMarkup =
    product.imageUrl

      ? `
        <img
          src="${escapeAttribute(product.imageUrl)}"
          alt="${escapeAttribute(product.name)}"
          class="product-image"
          loading="lazy"
          onerror="this.style.display='none'; this.nextElementSibling.hidden=false;"
        >

        <div
          class="product-image-fallback"
          hidden
        >
          <i class="fa-solid fa-box"></i>
        </div>
      `

      : `
        <div class="product-image-fallback">
          <i class="fa-solid fa-box"></i>
        </div>
      `;


  return `

    <article
      class="product-card"
      data-product-id="${escapeAttribute(product.id)}"
    >

      <div class="product-image-wrap">

        ${imageMarkup}

        <span class="product-category">
          ${escapeHtml(categoryName)}
        </span>

      </div>


      <div class="product-card-body">

        <h3 class="product-name">
          ${escapeHtml(product.name)}
        </h3>

        ${
          product.description
            ? `
              <p class="product-description">
                ${escapeHtml(
                  truncateText(
                    product.description,
                    90
                  )
                )}
              </p>
            `
            : ""
        }


        <div class="product-card-bottom">

          <div class="product-price">

            <span class="price-label">
              From
            </span>

            <strong>
              ${escapeHtml(formattedPrice)}
            </strong>

          </div>


          <button
            type="button"
            class="add-to-cart-button"
            data-add-to-cart="${escapeAttribute(product.id)}"
            aria-label="Add ${escapeAttribute(product.name)} to cart"
          >

            <i class="fa-solid fa-cart-plus"></i>

            <span>Add</span>

          </button>

        </div>

      </div>

    </article>

  `;

}


/* =========================================================
   PRODUCT CARD EVENTS
   ========================================================= */

function attachProductCardEvents() {

  const addButtons =
    document.querySelectorAll(
      "[data-add-to-cart]"
    );

  addButtons.forEach((button) => {

    button.addEventListener(
      "click",
      () => {

        const productId =
          button.dataset.addToCart;

        addToCart(productId);

      }
    );

  });

}


/* =========================================================
   CART
   ========================================================= */

function getCart() {

  try {

    const storedCart =
      localStorage.getItem(
        CART_STORAGE_KEY
      );

    if (!storedCart) {
      return [];
    }

    const parsed =
      JSON.parse(storedCart);

    return Array.isArray(parsed)
      ? parsed
      : [];

  } catch (error) {

    console.error(
      "Unable to read cart:",
      error
    );

    return [];

  }

}


function saveCart(cart) {

  try {

    localStorage.setItem(
      CART_STORAGE_KEY,
      JSON.stringify(cart)
    );

  } catch (error) {

    console.error(
      "Unable to save cart:",
      error
    );

  }

}


function addToCart(productId) {

  const product =
    allProducts.find(
      (item) =>
        item.id === productId
    );

  if (!product) {

    showToast(
      "This product is no longer available."
    );

    return;

  }

  const cart = getCart();

  const existingItem =
    cart.find(
      (item) =>
        item.productId === productId
    );

  if (existingItem) {

    existingItem.quantity += 1;

  } else {

    cart.push({

      productId,

      quantity: 1

    });

  }

  saveCart(cart);

  updateCartCount();

  showToast(
    `${product.name} added to your cart.`
  );

}


function updateCartCount() {

  const cart =
    getCart();

  const count =
    cart.reduce(
      (total, item) =>
        total + Number(item.quantity || 0),
      0
    );

  updateCountElement(
    cartCount,
    count
  );

  updateCountElement(
    headerCartCount,
    count
  );

}


function updateCountElement(
  element,
  count
) {

  if (!element) {
    return;
  }

  if (count > 0) {

    element.textContent =
      count > 99
        ? "99+"
        : String(count);

    element.hidden = false;

  } else {

    element.textContent = "0";

    element.hidden = true;

  }

}


/* =========================================================
   SEARCH
   ========================================================= */

if (productSearch) {

  productSearch.addEventListener(
    "input",
    () => {

      currentSearch =
        productSearch.value;

      updateSearchControls();

      renderMarketplace();

    }
  );

}


if (clearSearch) {

  clearSearch.addEventListener(
    "click",
    clearSearchInput
  );

}


if (clearSearchButton) {

  clearSearchButton.addEventListener(
    "click",
    clearSearchInput
  );

}


function clearSearchInput() {

  if (productSearch) {
    productSearch.value = "";
  }

  currentSearch = "";

  updateSearchControls();

  renderMarketplace();

  productSearch?.focus();

}


function updateSearchControls() {

  const hasSearch =
    currentSearch.trim().length > 0;

  if (clearSearch) {
    clearSearch.hidden =
      !hasSearch;
  }

}


/* =========================================================
   CATEGORY FILTERING
   ========================================================= */

if (categoryList) {

  categoryList.addEventListener(
    "click",
    (event) => {

      const categoryButton =
        event.target.closest(
          "[data-category]"
        );

      if (!categoryButton) {
        return;
      }

      activeCategory =
        categoryButton.dataset.category ||
        "all";

      document
        .querySelectorAll(
          "[data-category]"
        )
        .forEach((button) => {

          button.classList.toggle(
            "active",
            button.dataset.category ===
              activeCategory
          );

        });

      renderMarketplace();

    }
  );

}


/* =========================================================
   SORTING
   ========================================================= */

if (productSort) {

  productSort.addEventListener(
    "change",
    () => {

      currentSort =
        productSort.value;

      renderMarketplace();

    }
  );

}


/* =========================================================
   MARKETPLACE HEADING
   ========================================================= */

function updateMarketplaceHeading() {

  const hasSearch =
    currentSearch.trim().length > 0;

  const hasCategory =
    activeCategory !== "all";


  if (hasSearch) {

    if (productsKicker) {
      productsKicker.textContent =
        "Search";
    }

    if (productsTitle) {
      productsTitle.textContent =
        "Search results";
    }

    if (searchResultMessage) {

      searchResultMessage.hidden =
        false;

    }

    if (searchTerm) {

      searchTerm.textContent =
        `"${currentSearch.trim()}"`;

    }

    return;

  }


  if (searchResultMessage) {
    searchResultMessage.hidden = true;
  }


  if (hasCategory) {

    if (productsKicker) {
      productsKicker.textContent =
        "Category";
    }

    if (productsTitle) {
      productsTitle.textContent =
        formatCategoryName(
          activeCategory
        );
    }

    return;

  }


  if (productsKicker) {
    productsKicker.textContent =
      "Marketplace";
  }

  if (productsTitle) {
    productsTitle.textContent =
      "All products";
  }

}


/* =========================================================
   PRODUCTS UI STATES
   ========================================================= */

function showProductsLoading() {

  if (productsLoading) {
    productsLoading.hidden = false;
  }

  if (productGrid) {
    productGrid.hidden = true;
  }

  if (productsEmpty) {
    productsEmpty.hidden = true;
  }

  if (productsError) {
    productsError.hidden = true;
  }

}


function hideProductsLoading() {

  if (productsLoading) {
    productsLoading.hidden = true;
  }

  if (productGrid) {
    productGrid.hidden = false;
  }

}


function showProductsEmpty() {

  hideProductsLoading();

  if (productGrid) {
    productGrid.innerHTML = "";
    productGrid.hidden = true;
  }

  if (productsEmpty) {

    productsEmpty.hidden = false;

  }

  if (productsEmptyMessage) {

    if (currentSearch.trim()) {

      productsEmptyMessage.textContent =
        `We couldn't find any products matching "${currentSearch.trim()}".`;

    } else if (activeCategory !== "all") {

      productsEmptyMessage.textContent =
        "There are currently no available products in this category.";

    } else {

      productsEmptyMessage.textContent =
        "There are currently no products available.";

    }

  }

}


function hideProductsEmpty() {

  hideProductsLoading();

  if (productsEmpty) {
    productsEmpty.hidden = true;
  }

  if (productsError) {
    productsError.hidden = true;
  }

}


function showProductsError() {

  if (productsLoading) {
    productsLoading.hidden = true;
  }

  if (productGrid) {
    productGrid.innerHTML = "";
    productGrid.hidden = true;
  }

  if (productsEmpty) {
    productsEmpty.hidden = true;
  }

  if (productsError) {
    productsError.hidden = false;
  }

}


/* =========================================================
   RETRY
   ========================================================= */

if (retryProductsButton) {

  retryProductsButton.addEventListener(
    "click",
    async () => {

      await loadProducts();

    }
  );

}


/* =========================================================
   SIDEBAR
   ========================================================= */

if (mobileMenuButton) {

  mobileMenuButton.addEventListener(
    "click",
    openSidebar
  );

}


if (sidebarClose) {

  sidebarClose.addEventListener(
    "click",
    closeSidebar
  );

}


if (sidebarOverlay) {

  sidebarOverlay.addEventListener(
    "click",
    closeSidebar
  );

}


function openSidebar() {

  sidebar?.classList.add("open");

  sidebarOverlay?.classList.add("visible");

  document.body.classList.add(
    "sidebar-open"
  );

}


function closeSidebar() {

  sidebar?.classList.remove("open");

  sidebarOverlay?.classList.remove("visible");

  document.body.classList.remove(
    "sidebar-open"
  );

}


/* =========================================================
   SIDEBAR / HEADER ACTIONS
   ========================================================= */

document
  .querySelectorAll(".dashboard-action")
  .forEach((button) => {

    button.addEventListener(
      "click",
      () => {

        const action =
          button.dataset.action;

        handleDashboardAction(action);

      }
    );

  });


function handleDashboardAction(action) {

  closeSidebar();

  switch (action) {

    case "cart":

      if (getCart().length === 0) {

        showToast(
          "Your cart is empty."
        );

      } else {

        showToast(
          "Cart checkout is coming next."
        );

      }

      break;


    case "categories":

      document
        .querySelector(
          ".category-section"
        )
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });

      break;


    case "orders":

      showToast(
        "My Orders will be connected next."
      );

      break;


    case "giftcards":

      selectCategory(
        "gift-cards"
      );

      break;


    case "exchange":

      showToast(
        "Gift card exchange will be connected next."
      );

      break;


    case "bitcoin":

      showToast(
        "Bitcoin services will be connected next."
      );

      break;


    case "settings":

      showToast(
        "Account settings will be connected next."
      );

      break;


    case "support":

      showToast(
        "Help & support will be connected next."
      );

      break;


    default:

      break;

  }

}


/* =========================================================
   SELECT CATEGORY FROM SIDEBAR
   ========================================================= */

function selectCategory(category) {

  activeCategory =
    category;

  document
    .querySelectorAll(
      "[data-category]"
    )
    .forEach((button) => {

      button.classList.toggle(
        "active",
        button.dataset.category ===
          category
      );

    });

  renderMarketplace();

  document
    .querySelector(
      ".products-section"
    )
    ?.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });

}


/* =========================================================
   LOGOUT
   ========================================================= */

if (logoutButton) {

  logoutButton.addEventListener(
    "click",
    async () => {

      try {

        logoutButton.disabled = true;

        await signOut(auth);

        window.location.href =
          "login.html";

      } catch (error) {

        console.error(
          "Sign out failed:",
          error
        );

        logoutButton.disabled = false;

        showToast(
          "Unable to sign out. Please try again."
        );

      }

    }
  );

}


/* =========================================================
   TOAST
   ========================================================= */

function showToast(message) {

  if (!dashboardToast || !toastMessage) {
    return;
  }

  toastMessage.textContent =
    message;

  dashboardToast.classList.add(
    "visible"
  );

  clearTimeout(toastTimer);

  toastTimer = setTimeout(() => {

    dashboardToast.classList.remove(
      "visible"
    );

  }, 3200);

}


/* =========================================================
   FORMATTING
   ========================================================= */

function formatPrice(
  amount,
  currency
) {

  const numericAmount =
    Number(amount);

  if (!Number.isFinite(numericAmount)) {
    return "Price unavailable";
  }

  try {

    return new Intl.NumberFormat(
      undefined,
      {
        style: "currency",
        currency:
          currency || "USD",
        maximumFractionDigits:
          2
      }
    ).format(numericAmount);

  } catch (error) {

    return `${currency || "USD"} ${numericAmount.toFixed(2)}`;

  }

}


function formatCategoryName(
  category
) {

  if (!category) {
    return "Other";
  }

  return category
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );

}


function truncateText(
  text,
  maximumLength
) {

  if (text.length <= maximumLength) {
    return text;
  }

  return (
    text.slice(
      0,
      maximumLength
    ).trimEnd() + "..."
  );

}


/* =========================================================
   SECURITY / HTML ESCAPING
   ========================================================= */

function escapeHtml(value) {

  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

}


function escapeAttribute(value) {

  return escapeHtml(value);

}


/* =========================================================
   KEYBOARD ACCESSIBILITY
   ========================================================= */

document.addEventListener(
  "keydown",
  (event) => {

    if (event.key === "Escape") {
      closeSidebar();
    }

  }
);
