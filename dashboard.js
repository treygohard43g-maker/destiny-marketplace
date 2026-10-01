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
   MARKETPLACE SECTIONS
========================================================= */

const flashDealsGrid =
  document.getElementById("flashDealsGrid");

const featuredGrid =
  document.getElementById("featuredGrid");

const recommendedGrid =
  document.getElementById("recommendedGrid");

const newArrivalsGrid =
  document.getElementById("newArrivalsGrid");

const categoriesSection =
  document.getElementById("categoriesSection");

const productsSection =
  document.getElementById("productsSection");


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

const CART_STORAGE_KEY =
  "destinyMarketplaceCart";


/* =========================================================
   AUTHENTICATION
========================================================= */

onAuthStateChanged(
  auth,
  async (user) => {

    if (!user) {

      window.location.href = "login.html";

      return;
    }

    try {

      await reload(user);

      const currentUser = auth.currentUser;

      if (!currentUser) {

        window.location.href = "login.html";

        return;
      }

      if (!currentUser.emailVerified) {

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

  }
);


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

}


/* =========================================================
   LOAD PRODUCTS
========================================================= */

async function loadProducts() {

  showProductsLoading();

  try {

    const productsReference =
      collection(
        db,
        PRODUCTS_COLLECTION
      );

    const snapshot =
      await getDocs(
        productsReference
      );

    allProducts =
      snapshot.docs
        .map(
          (documentSnapshot) =>
            normalizeProduct(
              documentSnapshot.id,
              documentSnapshot.data()
            )
        )
        .filter(
          (product) =>
            isProductVisible(product)
        );

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
   NORMALIZE PRODUCT
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
        ? normalizeCategory(data.category)
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

    featured:
      data.featured === true,

    flashDeal:
      data.flashDeal === true,

    discount:
      Number.isFinite(Number(data.discount))
        ? Number(data.discount)
        : 0,

    createdAt:
      data.createdAt || null,

    updatedAt:
      data.updatedAt || null

  };

}


/* =========================================================
   CATEGORY NORMALIZATION
========================================================= */

function normalizeCategory(category) {

  return category
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-");

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
    unavailableStatuses.includes(
      product.status
    )
  ) {
    return false;
  }

  if (
    product.stock !== null &&
    product.stock <= 0
  ) {
    return false;
  }

  return true;

}


/* =========================================================
   MAIN MARKETPLACE
========================================================= */

function renderMarketplace() {

  const hasSearch =
    currentSearch.trim().length > 0;

  if (hasSearch) {

    hideMarketplaceSections();

    renderSearchResults();

    return;
  }

  showMarketplaceSections();

  renderHomeSections();

  renderMainProductCollection();

}


/* =========================================================
   HOME SECTIONS
========================================================= */

function renderHomeSections() {

  renderSectionProducts(
    flashDealsGrid,
    getFlashDeals()
  );

  renderSectionProducts(
    featuredGrid,
    getFeaturedProducts()
  );

  renderSectionProducts(
    recommendedGrid,
    getRecommendedProducts()
  );

  renderSectionProducts(
    newArrivalsGrid,
    getNewArrivals()
  );

}


/* =========================================================
   FLASH DEALS
========================================================= */

function getFlashDeals() {

  const products =
    allProducts.filter(
      (product) =>
        product.flashDeal === true ||
        product.discount > 0
    );

  if (products.length > 0) {

    return sortNewest(products)
      .slice(0, 8);

  }

  return sortNewest(allProducts)
    .slice(0, 8);

}


/* =========================================================
   FEATURED
========================================================= */

function getFeaturedProducts() {

  const featured =
    allProducts.filter(
      (product) =>
        product.featured === true
    );

  if (featured.length > 0) {

    return sortNewest(featured)
      .slice(0, 8);

  }

  return sortNewest(allProducts)
    .slice(0, 8);

}


/* =========================================================
   RECOMMENDED
========================================================= */

function getRecommendedProducts() {

  return sortNewest(allProducts)
    .slice(0, 8);

}


/* =========================================================
   NEW ARRIVALS
========================================================= */

function getNewArrivals() {

  return sortNewest(allProducts)
    .slice(0, 8);

}


/* =========================================================
   SORT NEWEST
========================================================= */

function sortNewest(products) {

  return [...products].sort(
    (a, b) =>
      getTimestamp(b.createdAt) -
      getTimestamp(a.createdAt)
  );

}


/* =========================================================
   SECTION PRODUCT RENDER
========================================================= */

function renderSectionProducts(
  container,
  products
) {

  if (!container) {
    return;
  }

  if (!products.length) {

    container.innerHTML = "";

    return;
  }

  container.innerHTML =
    products
      .map(
        (product) =>
          createProductCard(product)
      )
      .join("");

  attachProductCardEvents(container);

}


/* =========================================================
   MAIN PRODUCTS
========================================================= */

function renderMainProductCollection() {

  const filteredProducts =
    getFilteredProducts();

  const sortedProducts =
    sortProducts(filteredProducts);

  updateMarketplaceHeading();

  if (!sortedProducts.length) {

    showProductsEmpty();

    return;
  }

  hideProductsEmpty();

  renderProducts(sortedProducts);

}


/* =========================================================
   SEARCH RESULTS
========================================================= */

function renderSearchResults() {

  const filteredProducts =
    getFilteredProducts();

  const sortedProducts =
    sortProducts(filteredProducts);

  updateMarketplaceHeading();

  if (!sortedProducts.length) {

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

  return allProducts.filter(
    (product) => {

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

    }
  );

}


/* =========================================================
   SORT PRODUCTS
========================================================= */

function sortProducts(products) {

  const sorted = [...products];

  switch (currentSort) {

    case "price-low":

      sorted.sort(
        (a, b) =>
          a.price - b.price
      );

      break;

    case "price-high":

      sorted.sort(
        (a, b) =>
          b.price - a.price
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
   TIMESTAMP
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

  if (value instanceof Date) {

    return value.getTime();

  }

  if (typeof value === "number") {

    return value;

  }

  if (typeof value === "string") {

    const timestamp =
      Date.parse(value);

    return Number.isNaN(timestamp)
      ? 0
      : timestamp;

  }

  return 0;

}


/* =========================================================
   PRODUCT GRID
========================================================= */

function renderProducts(products) {

  if (!productGrid) {
    return;
  }

  productGrid.innerHTML =
    products
      .map(
        (product) =>
          createProductCard(product)
      )
      .join("");

  productGrid.hidden = false;

  attachProductCardEvents(productGrid);

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

  const discountMarkup =
    product.discount > 0

      ? `
        <span class="product-discount">
          -${escapeHtml(
            String(product.discount)
          )}%
        </span>
      `

      : "";

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

        ${discountMarkup}

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
              Price
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

function attachProductCardEvents(
  container = document
) {

  const addButtons =
    container.querySelectorAll(
      "[data-add-to-cart]"
    );

  addButtons.forEach(
    (button) => {

      button.addEventListener(
        "click",
        (event) => {

          event.stopPropagation();

          const productId =
            button.dataset.addToCart;

          addToCart(productId);

        }
      );

    }
  );

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


/* =========================================================
   SAVE CART
========================================================= */

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


/* =========================================================
   ADD TO CART
========================================================= */

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


/* =========================================================
   CART COUNT
========================================================= */

function updateCartCount() {

  const cart = getCart();

  const count =
    cart.reduce(
      (total, item) =>
        total +
        Number(item.quantity || 0),
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
    clearSearch.hidden = !hasSearch;
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

      updateCategoryButtons();

      renderMarketplace();

      productsSection?.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });

    }
  );

}


function updateCategoryButtons() {

  document
    .querySelectorAll("[data-category]")
    .forEach(
      (button) => {

        button.classList.toggle(
          "active",
          button.dataset.category ===
            activeCategory
        );

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
   SIDEBAR
========================================================= */

function openSidebar() {

  if (!sidebar) {
    return;
  }

  sidebar.classList.add("open");

  sidebarOverlay?.classList.add("visible");

  document.body.classList.add(
    "sidebar-open"
  );

}


function closeSidebar() {

  sidebar?.classList.remove("open");

  sidebarOverlay?.classList.remove(
    "visible"
  );

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


/* =========================================================
   DASHBOARD ACTIONS
========================================================= */

document.addEventListener(
  "click",
  (event) => {

    const actionElement =
      event.target.closest(
        "[data-action]"
      );

    if (!actionElement) {
      return;
    }

    const action =
      actionElement.dataset.action;

    if (!action) {
      return;
    }

    event.preventDefault();

    handleDashboardAction(action);

  }
);


/* =========================================================
   DASHBOARD ACTION HANDLER
========================================================= */

function handleDashboardAction(action) {

  closeSidebar();

  switch (action) {

    case "marketplace":

      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });

      break;


    case "categories":

      activeCategory = "all";

      updateCategoryButtons();

      renderMarketplace();

      categoriesSection?.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });

      break;


    case "phones":

      selectCategory("phones");

      break;


    case "laptops":

      selectCategory("laptops");

      break;


    case "electronics":

      selectCategory("electronics");

      break;


    case "fashion":

      selectCategory("fashion");

      break;


    case "shoes":

      selectCategory("shoes");

      break;


    case "home":

      selectCategory("home");

      break;


    case "giftcards":
    case "buy-giftcards":

      selectCategory("gift-cards");

      break;


    case "sim-cards":

      selectCategory("sim-cards");

      break;


    case "cart":

      handleCartAction();

      break;


    case "orders":

      showToast(
        "My Orders will be connected next."
      );

      break;


    case "settings":

      showToast(
        "Account Settings will be connected next."
      );

      break;


    case "support":

      showToast(
        "Help & Support will be connected next."
      );

      break;


    case "buy-bitcoin":

      showToast(
        "Bitcoin purchase will be connected next."
      );

      break;


    case "sell-bitcoin":

      showToast(
        "Bitcoin selling will be connected next."
      );

      break;


    case "giftcard-exchange":

      showToast(
        "Gift Card Exchange will be connected next."
      );

      break;


    default:

      showToast(
        "This marketplace feature is coming soon."
      );

  }

}


/* =========================================================
   CATEGORY ACTION
========================================================= */

function selectCategory(category) {

  activeCategory = category;

  updateCategoryButtons();

  currentSearch = "";

  if (productSearch) {
    productSearch.value = "";
  }

  updateSearchControls();

  renderMarketplace();

  productsSection?.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });

}


/* =========================================================
   CART ACTION
========================================================= */

function handleCartAction() {

  const cart = getCart();

  if (!cart.length) {

    showToast(
      "Your cart is empty."
    );

    return;
  }

  showToast(
    `You have ${cart.reduce(
      (total, item) =>
        total +
        Number(item.quantity || 0),
      0
    )} item${
      cart.reduce(
        (total, item) =>
          total +
          Number(item.quantity || 0),
        0
      ) === 1
        ? ""
        : "s"
    } in your cart.`
  );

}


/* =========================================================
   SECTION ACTIONS
========================================================= */

document.addEventListener(
  "click",
  (event) => {

    const sectionButton =
      event.target.closest(
        "[data-section-action]"
      );

    if (!sectionButton) {
      return;
    }

    const section =
      sectionButton.dataset.sectionAction;

    handleSectionAction(section);

  }
);


function handleSectionAction(section) {

  currentSearch = "";

  if (productSearch) {
    productSearch.value = "";
  }

  updateSearchControls();

  switch (section) {

    case "flash-deals":

      scrollToSection(
        flashDealsGrid
      );

      break;


    case "featured":

      scrollToSection(
        featuredGrid
      );

      break;


    case "recommended":

      scrollToSection(
        recommendedGrid
      );

      break;


    case "new-arrivals":

      scrollToSection(
        newArrivalsGrid
      );

      break;

  }

}


function scrollToSection(element) {

  element?.closest(
    ".marketplace-product-section"
  )?.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });

}


/* =========================================================
   LOGOUT
========================================================= */

logoutButton?.addEventListener(
  "click",
  async () => {

    try {

      await signOut(auth);

      window.location.href =
        "login.html";

    } catch (error) {

      console.error(
        "Logout failed:",
        error
      );

      showToast(
        "Unable to sign out. Please try again."
      );

    }

  }
);


/* =========================================================
   RETRY
========================================================= */

retryProductsButton?.addEventListener(
  "click",
  () => {

    loadProducts();

  }
);


/* =========================================================
   EMPTY SEARCH
========================================================= */

clearSearchButton?.addEventListener(
  "click",
  clearSearchInput
);


/* =========================================================
   HEADING
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
      searchResultMessage.hidden = false;
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
        formatCategoryName(activeCategory);
    }

    return;
  }

  if (productsKicker) {
    productsKicker.textContent =
      "Marketplace";
  }

  if (productsTitle) {
    productsTitle.textContent =
      "More Products";
  }

}


/* =========================================================
   MARKETPLACE SECTIONS VISIBILITY
========================================================= */

function hideMarketplaceSections() {

  document
    .querySelectorAll(
      ".marketplace-product-section"
    )
    .forEach(
      (section) => {
        section.hidden = true;
      }
    );

}


function showMarketplaceSections() {

  document
    .querySelectorAll(
      ".marketplace-product-section"
    )
    .forEach(
      (section) => {
        section.hidden = false;
      }
    );

}


/* =========================================================
   LOADING
========================================================= */

function showProductsLoading() {

  productsLoading?.removeAttribute(
    "hidden"
  );

  productGrid?.setAttribute(
    "hidden",
    ""
  );

  productsEmpty?.setAttribute(
    "hidden",
    ""
  );

  productsError?.setAttribute(
    "hidden",
    ""
  );

}


/* =========================================================
   EMPTY STATE
========================================================= */

function showProductsEmpty() {

  productsLoading?.setAttribute(
    "hidden",
    ""
  );

  productGrid?.setAttribute(
    "hidden",
    ""
  );

  productsError?.setAttribute(
    "hidden",
    ""
  );

  productsEmpty?.removeAttribute(
    "hidden"
  );

  const hasSearch =
    currentSearch.trim().length > 0;

  if (productsEmptyMessage) {

    if (hasSearch) {

      productsEmptyMessage.textContent =
        `No products matched "${currentSearch.trim()}".`;

    } else if (activeCategory !== "all") {

      productsEmptyMessage.textContent =
        `There are currently no available products in ${formatCategoryName(activeCategory)}.`;

    } else {

      productsEmptyMessage.textContent =
        "There are currently no available products.";

    }

  }

}


/* =========================================================
   HIDE EMPTY
========================================================= */

function hideProductsEmpty() {

  productsLoading?.setAttribute(
    "hidden",
    ""
  );

  productsEmpty?.setAttribute(
    "hidden",
    ""
  );

  productsError?.setAttribute(
    "hidden",
    ""
  );

}


/* =========================================================
   ERROR
========================================================= */

function showProductsError() {

  productsLoading?.setAttribute(
    "hidden",
    ""
  );

  productGrid?.setAttribute(
    "hidden",
    ""
  );

  productsEmpty?.setAttribute(
    "hidden",
    ""
  );

  productsError?.removeAttribute(
    "hidden"
  );

}


/* =========================================================
   TOAST
========================================================= */

function showToast(message) {

  if (!dashboardToast) {
    return;
  }

  if (toastMessage) {
    toastMessage.textContent = message;
  }

  dashboardToast.classList.add(
    "show"
  );

  clearTimeout(toastTimer);

  toastTimer =
    setTimeout(
      () => {

        dashboardToast.classList.remove(
          "show"
        );

      },
      3000
    );

}


/* =========================================================
   PRICE FORMAT
========================================================= */

function formatPrice(
  price,
  currency
) {

  const safePrice =
    Number.isFinite(Number(price))
      ? Number(price)
      : 0;

  const safeCurrency =
    typeof currency === "string" &&
    currency.length === 3
      ? currency
      : "USD";

  try {

    return new Intl.NumberFormat(
      undefined,
      {
        style: "currency",
        currency: safeCurrency,
        maximumFractionDigits: 2
      }
    ).format(safePrice);

  } catch (error) {

    return `${safeCurrency} ${safePrice.toFixed(2)}`;

  }

}


/* =========================================================
   CATEGORY NAME
========================================================= */

function formatCategoryName(category) {

  if (!category) {
    return "Other";
  }

  return category
    .split("-")
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1)
    )
    .join(" ");

}


/* =========================================================
   TEXT TRUNCATION
========================================================= */

function truncateText(
  text,
  maxLength
) {

  if (!text) {
    return "";
  }

  if (text.length <= maxLength) {
    return text;
  }

  return (
    text
      .slice(0, maxLength)
      .trimEnd() +
    "..."
  );

}


/* =========================================================
   HTML ESCAPING
========================================================= */

function escapeHtml(value) {

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}


function escapeAttribute(value) {

  return escapeHtml(value);

}


/* =========================================================
   KEYBOARD
========================================================= */

document.addEventListener(
  "keydown",
  (event) => {

    if (event.key === "Escape") {

      closeSidebar();

    }

  }
);


/* =========================================================
   INITIAL SEARCH STATE
========================================================= */

updateSearchControls();
updateCartCount();
