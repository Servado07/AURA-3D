const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) =>
  Array.from(root.querySelectorAll(selector));

const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
).matches;

function initTheme() {
  const toggleBtn = $("#theme-toggle");
  const icon = toggleBtn?.querySelector("i");
  const savedTheme = localStorage.getItem("theme");
  const initialTheme = savedTheme || "dark";

  document.documentElement.setAttribute("data-theme", initialTheme);

  if (icon) {
    icon.classList.toggle("fa-sun", initialTheme === "dark");
    icon.classList.toggle("fa-moon", initialTheme !== "dark");
  }

  toggleBtn?.addEventListener("click", () => {
    const currentTheme = document.documentElement.getAttribute("data-theme");
    const targetTheme = currentTheme === "dark" ? "light" : "dark";

    document.documentElement.setAttribute("data-theme", targetTheme);
    localStorage.setItem("theme", targetTheme);

    if (icon) {
      icon.classList.toggle("fa-sun", targetTheme === "dark");
      icon.classList.toggle("fa-moon", targetTheme !== "dark");
    }
  });
}

function initNavigation() {
  const navbar = $(".navbar");
  const hamburger = $("#hamburger");
  const navLinks = $("#nav-links");

  const setNavState = () => {
    navbar?.classList.toggle("scrolled", window.scrollY > 24);
  };

  setNavState();
  window.addEventListener("scroll", setNavState, { passive: true });

  hamburger?.addEventListener("click", () => {
    navLinks?.classList.toggle("active");
    const icon = hamburger.querySelector("i");
    if (icon) {
      icon.classList.toggle("fa-bars");
      icon.classList.toggle("fa-times");
    }
  });

  $$(".nav-links a").forEach((link) => {
    link.addEventListener("click", () => {
      navLinks?.classList.remove("active");
      const icon = hamburger?.querySelector("i");
      icon?.classList.add("fa-bars");
      icon?.classList.remove("fa-times");
    });
  });
}

function initRevealAnimations() {
  const elements = $$(".fade-in");
  if (!elements.length) return;

  if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    elements.forEach((el) => el.classList.add("visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -50px 0px" },
  );

  elements.forEach((el, index) => {
    el.style.transitionDelay = `${Math.min(index % 4, 3) * 80}ms`;
    observer.observe(el);
  });
}

function initFaq() {
  const faqItems = $$(".faq-item");
  faqItems.forEach((item) => {
    const question = $(".faq-question", item);
    question?.addEventListener("click", () => {
      faqItems.forEach((otherItem) => {
        if (otherItem !== item) otherItem.classList.remove("active");
      });
      item.classList.toggle("active");
    });
  });
}

function initContactForm() {
  const contactForm = $("#contact-form");
  const toast = $("#form-success-toast");
  if (!contactForm) return;

  contactForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const btn = contactForm.querySelector("button[type='submit']");
    const originalBtnText = btn?.innerHTML;

    if (btn) {
      btn.innerHTML = 'Enviando... <i class="fas fa-spinner fa-spin"></i>';
      btn.disabled = true;
    }

    try {
      const data = new FormData(contactForm);
      const response = await fetch(contactForm.action || window.location.href, {
        method: "POST",
        body: data,
        headers: { Accept: "application/json" },
      });

      if (!response.ok) throw new Error("Form submission failed");

      toast?.classList.add("show");
      setTimeout(() => toast?.classList.remove("show"), 5000);
      contactForm.reset();
    } catch (error) {
      alert("Hubo un error al enviar. Inténtalo de nuevo.");
    } finally {
      if (btn) {
        btn.innerHTML = originalBtnText;
        btn.disabled = false;
      }
    }
  });
}

function initCarousels() {
  $$(".carousel-container").forEach((container) => {
    const slides = $$(".carousel-slide", container);
    const prevBtn = $(".prev", container);
    const nextBtn = $(".next", container);
    if (!slides.length) return;

    let currentSlide = 0;

    const showSlide = (index) => {
      slides[currentSlide]?.classList.remove("active");
      currentSlide = (index + slides.length) % slides.length;
      slides[currentSlide]?.classList.add("active");
    };

    nextBtn?.addEventListener("click", (event) => {
      event.preventDefault();
      showSlide(currentSlide + 1);
    });

    prevBtn?.addEventListener("click", (event) => {
      event.preventDefault();
      showSlide(currentSlide - 1);
    });
  });
}

function initScrollTop() {
  const scrollTopBtn = $("#scrollTopBtn");
  if (!scrollTopBtn) return;

  const currentScrollY = () =>
    window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;

  const update = () => {
    const shouldShow =
      currentScrollY() > 320 && !document.body.classList.contains("aura-chat-open");
    scrollTopBtn.classList.toggle("is-visible", shouldShow);
    scrollTopBtn.setAttribute("aria-hidden", shouldShow ? "false" : "true");
  };

  const goTop = (event) => {
    event?.preventDefault?.();
    event?.stopPropagation?.();

    const behavior = prefersReducedMotion ? "auto" : "smooth";
    window.scrollTo({ top: 0, left: 0, behavior });
    document.documentElement.scrollTo?.({ top: 0, left: 0, behavior });
    document.body.scrollTo?.({ top: 0, left: 0, behavior });
  };

  update();
  window.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update, { passive: true });
  window.addEventListener("aura-chat-state", update);
  scrollTopBtn.addEventListener("click", goTop);
  scrollTopBtn.addEventListener("touchend", goTop, { passive: false });
}

function initBuyOptions() {
  $$(".buy-trigger").forEach((button) => {
    button.addEventListener("click", function (event) {
      event.preventDefault();
      const wrapper = this.closest(".buy-wrapper");
      const options = wrapper?.querySelector(".platform-options");
      this.style.display = "none";
      options?.classList.add("active");
    });
  });
}

function normalize(value) {
  return (value || "")
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

let auraCatalogDataCache = null;

function escapeHtml(value = "") {
  return value
    .toString()
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

async function getCatalogData() {
  if (auraCatalogDataCache) return auraCatalogDataCache;

  try {
    const response = await fetch("data/productos.json", { cache: "no-store" });
    if (!response.ok) throw new Error("No se pudo cargar data/productos.json");
    auraCatalogDataCache = await response.json();
    return auraCatalogDataCache;
  } catch (error) {
    console.warn("Catálogo dinámico no disponible.", error);
    return null;
  }
}

function getCategoryMap(data) {
  return new Map(
    (data?.categories || []).map((category) => [category.id, category]),
  );
}

function getProductCategories(product) {
  if (Array.isArray(product.categories) && product.categories.length)
    return product.categories;
  if (product.primaryCategory) return [product.primaryCategory];
  return ["decoracion"];
}

function getPrimaryCategory(product) {
  return (
    product.primaryCategory || getProductCategories(product)[0] || "decoracion"
  );
}

function getCategoryName(categoryMap, id) {
  return categoryMap.get(id)?.name || id || "Catálogo";
}

function getProductKeywords(product) {
  const keywords = Array.isArray(product.keywords) ? product.keywords : [];
  return [
    ...keywords,
    product.title || "",
    product.description || "",
    product.alt || "",
    ...getProductCategories(product),
  ]
    .filter(Boolean)
    .join(" ");
}

function renderProductCard(product, categoryMap) {
  const categories = getProductCategories(product);
  const primary = getPrimaryCategory(product);
  const image =
    product.images?.[0] || "assets/images/iconos/logo_png_blanco.png";
  const title = product.title || "Producto Aura 3D";
  const alt = product.alt || title;
  const categoryLabel = getCategoryName(categoryMap, primary);
  const likeId = product.id || normalize(title).replace(/\s+/g, "-");

  return `
    <article class="catalog-card fade-in" data-category="${escapeHtml(categories.join(" "))}" data-title="${escapeHtml(title)}" data-keywords="${escapeHtml(getProductKeywords(product))}" data-like-id="${escapeHtml(likeId)}">
      <img src="${escapeHtml(image)}" alt="${escapeHtml(alt)}" title="" loading="lazy" />
      <button class="like-button" type="button" data-like-button aria-label="Me gusta ${escapeHtml(title)}" aria-pressed="false" title="Me gusta">
        <i class="fa-regular fa-heart" aria-hidden="true"></i>
        <span>Me gusta</span>
      </button>
      <div class="catalog-card-info"><span>${escapeHtml(categoryLabel)}</span><h3>${escapeHtml(title)}</h3></div>
    </article>`;
}

async function renderCatalogPage() {
  const host = $("#catalog-sections");
  if (!host) return;

  const data = await getCatalogData();
  const count = $("#catalog-count");
  if (!data?.products?.length) {
    host.innerHTML = `
      <div class="catalog-empty container">
        <i class="fas fa-triangle-exclamation"></i>
        <h3>No se ha podido cargar el catálogo</h3>
        <p>Revisa que exista el archivo <strong>data/productos.json</strong>.</p>
      </div>`;
    if (count) count.textContent = "0 piezas visibles";
    return;
  }

  const products = data.products.filter((product) => product.visible !== false);
  const categoryMap = getCategoryMap(data);
  const categories = (data.categories || []).filter((category) =>
    products.some((product) => getPrimaryCategory(product) === category.id),
  );

  const filters = $("#catalog-filters");
  if (filters) {
    filters.innerHTML =
      '<button class="filter-chip active" type="button" data-filter="all">Todo</button>';
    (data.categories || []).forEach((category) => {
      const button = document.createElement("button");
      button.className = "filter-chip";
      button.type = "button";
      button.dataset.filter = category.id;
      button.textContent = category.name;
      filters.appendChild(button);
    });
  }

  const jumpMenu = $("#catalog-jump-menu");
  if (jumpMenu) {
    jumpMenu.innerHTML = categories
      .map(
        (category) =>
          `<a href="#${escapeHtml(category.id)}">${escapeHtml(category.name)}</a>`,
      )
      .join("");
  }

  host.innerHTML = categories
    .map((category) => {
      const sectionProducts = products.filter(
        (product) => getPrimaryCategory(product) === category.id,
      );
      return `
        <section id="${escapeHtml(category.id)}" class="catalog-section" data-section="${escapeHtml(category.id)}">
          <div class="container">
            <div class="catalog-section-title fade-in">
              <span class="tag">Sección</span>
              <h2>${escapeHtml(category.name)}</h2>
            </div>
            <div class="catalog-grid">
              ${sectionProducts.map((product) => renderProductCard(product, categoryMap)).join("")}
            </div>
          </div>
        </section>`;
    })
    .join("");

  if (count)
    count.textContent = `${products.length} ${products.length === 1 ? "pieza visible" : "piezas visibles"}`;
}

async function renderHomeGalleryFromData() {
  const gallery = $(".home-gallery");
  if (!gallery || $("#catalog-sections")) return;

  const data = await getCatalogData();
  if (!data?.products?.length) return;

  const products = data.products
    .filter((product) => product.visible !== false)
    .sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)))
    .slice(0, 6);

  gallery.innerHTML = products
    .map((product) => {
      const image =
        product.images?.[0] || "assets/images/iconos/logo_png_blanco.png";
      const title = product.title || "Producto Aura 3D";
      const alt = product.alt || title;
      return `
        <figure class="gallery-card fade-in">
          <img src="${escapeHtml(image)}" alt="${escapeHtml(alt)}" title="" loading="lazy" />
          <figcaption><span>Vista rápida</span><strong>${escapeHtml(title)}</strong></figcaption>
        </figure>`;
    })
    .join("");

  const showcase = $(".category-showcase");
  if (showcase && Array.isArray(data.categories) && data.categories.length) {
    const visibleProducts = data.products.filter(
      (product) => product.visible !== false,
    );
    const categoriesWithProducts = data.categories.filter((category) =>
      visibleProducts.some(
        (product) =>
          getProductCategories(product).includes(category.id) ||
          getPrimaryCategory(product) === category.id,
      ),
    );
    const categories = (
      categoriesWithProducts.length ? categoriesWithProducts : data.categories
    ).slice(0, 4);
    showcase.innerHTML = categories
      .map(
        (category) => `
        <a href="galeria.html#${escapeHtml(category.id)}" class="category-tile">
          <i class="fas ${escapeHtml(category.icon || "fa-star")}"></i><span>${escapeHtml(category.name)}</span>
        </a>`,
      )
      .join("");
  }
}

async function initDynamicCatalogContent() {
  await renderCatalogPage();
  await renderHomeGalleryFromData();
}

function initCatalog() {
  const searchInput = $("#catalog-search");
  const filterButtons = $$(".filter-chip");
  const sortSelect = $("#catalog-sort");
  const cards = $$(".catalog-card");
  const sections = $$(".catalog-section");
  const count = $("#catalog-count");
  const empty = $("#catalog-empty");
  const lightbox = $("#catalog-lightbox");
  const lightboxImg = lightbox?.querySelector("img");
  const lightboxCaption = $(".lightbox-caption", lightbox || document);
  const lightboxClose = $(".lightbox-close", lightbox || document);

  if (!cards.length) return;

  cards.forEach((card, index) => {
    card.dataset.index = String(index);
    card.tabIndex = 0;
    card.setAttribute("role", "button");
    card.setAttribute("aria-label", `Ver ${card.dataset.title || "pieza"}`);
  });

  let activeFilter = "all";

  const matchesFilter = (card) => {
    if (activeFilter === "all") return true;
    return normalize(card.dataset.category).split(" ").includes(activeFilter);
  };

  const matchesSearch = (card) => {
    const query = normalize(searchInput?.value);
    if (!query) return true;
    const haystack = normalize(
      `${card.dataset.title} ${card.dataset.category} ${card.dataset.keywords} ${card.querySelector("img")?.alt}`,
    );
    return query.split(/\s+/).every((word) => haystack.includes(word));
  };

  const sortCards = () => {
    const mode = sortSelect?.value || "original";
    sections.forEach((section) => {
      const grid = $(".catalog-grid", section);
      if (!grid) return;
      const sectionCards = $$(".catalog-card", grid);
      const sorted = [...sectionCards].sort((a, b) => {
        if (mode === "az")
          return normalize(a.dataset.title).localeCompare(
            normalize(b.dataset.title),
          );
        if (mode === "category")
          return normalize(a.dataset.category).localeCompare(
            normalize(b.dataset.category),
          );
        return Number(a.dataset.index) - Number(b.dataset.index);
      });
      sorted.forEach((card) => grid.appendChild(card));
    });
  };

  const applyFilters = () => {
    sortCards();
    let visibleCards = 0;

    cards.forEach((card) => {
      const visible = matchesFilter(card) && matchesSearch(card);
      card.hidden = !visible;
      if (visible) visibleCards += 1;
    });

    sections.forEach((section) => {
      const hasVisibleCards = $$(".catalog-card", section).some(
        (card) => !card.hidden,
      );
      section.hidden = !hasVisibleCards;
    });

    if (count)
      count.textContent = `${visibleCards} ${visibleCards === 1 ? "pieza visible" : "piezas visibles"}`;
    if (empty) empty.hidden = visibleCards !== 0;
  };

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      activeFilter = button.dataset.filter || "all";
      filterButtons.forEach((btn) =>
        btn.classList.toggle("active", btn === button),
      );
      applyFilters();
    });
  });

  searchInput?.addEventListener("input", applyFilters);
  sortSelect?.addEventListener("change", applyFilters);

  const openLightbox = (card) => {
    if (!lightbox || !lightboxImg) return;
    const img = card.querySelector("img");
    const title = card.dataset.title || img?.alt || "Aura 3D";
    const category =
      card.querySelector(".catalog-card-info span")?.textContent || "Galería";

    lightboxImg.src = img?.src || "";
    lightboxImg.alt = img?.alt || title;
    if (lightboxCaption) lightboxCaption.textContent = `${category} · ${title}`;
    lightbox.classList.add("show");
    lightbox.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  };

  const closeLightbox = () => {
    if (!lightbox) return;
    lightbox.classList.remove("show");
    lightbox.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  };

  cards.forEach((card) => {
    card.addEventListener("click", (event) => {
      if (event.target.closest("button, a, input, select, textarea")) return;
      openLightbox(card);
    });
    card.addEventListener("keydown", (event) => {
      if (event.target.closest("button, a, input, select, textarea")) return;
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openLightbox(card);
      }
    });
  });

  lightboxClose?.addEventListener("click", closeLightbox);
  lightbox?.addEventListener("click", (event) => {
    if (event.target === lightbox) closeLightbox();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeLightbox();
  });

  applyFilters();
}

function initCatalogLikes() {
  const buttons = $$("[data-like-button]");
  if (!buttons.length) return;

  const storageKey = "aura_catalog_likes";
  const clientKey = "aura_catalog_like_client";
  const form = $("#catalog-like-form");

  const parseStoredLikes = () => {
    try {
      return new Set(JSON.parse(localStorage.getItem(storageKey) || "[]"));
    } catch {
      return new Set();
    }
  };

  const saveStoredLikes = (likes) => {
    localStorage.setItem(storageKey, JSON.stringify([...likes]));
  };

  const getClientId = () => {
    let id = localStorage.getItem(clientKey);
    if (!id) {
      id =
        window.crypto?.randomUUID?.() ||
        `cliente-${Date.now()}-${Math.random().toString(16).slice(2)}`;
      localStorage.setItem(clientKey, id);
    }
    return id;
  };

  const productIdFor = (card) => {
    const title =
      card?.dataset.title || card?.querySelector("img")?.alt || "producto";
    return (
      card?.dataset.likeId ||
      normalize(title).replace(/\s+/g, "-") ||
      "producto"
    );
  };

  const updateButton = (button, liked) => {
    const icon = button.querySelector("i");
    const label = button.querySelector("span");

    button.classList.toggle("is-liked", liked);
    button.setAttribute("aria-pressed", liked ? "true" : "false");
    button.setAttribute("title", liked ? "Quitar me gusta" : "Me gusta");

    if (icon) {
      icon.classList.toggle("fa-solid", liked);
      icon.classList.toggle("fa-regular", !liked);
    }
    if (label) label.textContent = liked ? "Te gusta" : "Me gusta";
  };

  const sendLikeToNetlify = async ({ card, action, productId }) => {
    if (!form) return;

    const data = new FormData(form);
    data.set("form-name", "catalogo_likes");
    data.set(
      "producto",
      card?.dataset.title || card?.querySelector("img")?.alt || "Producto",
    );
    data.set(
      "categoria",
      card?.querySelector(".catalog-card-info span")?.textContent ||
        card?.dataset.category ||
        "Catálogo",
    );
    data.set("producto_id", productId);
    data.set("accion", action);
    data.set("cliente", getClientId());
    data.set("pagina", window.location.pathname);

    try {
      await fetch("/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(data).toString(),
      });
    } catch (error) {
      console.warn("No se pudo registrar el me gusta en Netlify.", error);
    }
  };

  const likedProducts = parseStoredLikes();

  buttons.forEach((button) => {
    const card = button.closest(".catalog-card");
    if (!card) return;

    const productId = productIdFor(card);
    card.dataset.likeId = productId;
    updateButton(button, likedProducts.has(productId));

    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();

      const willLike = !likedProducts.has(productId);
      if (willLike) likedProducts.add(productId);
      else likedProducts.delete(productId);

      saveStoredLikes(likedProducts);
      updateButton(button, willLike);

      button.classList.remove("like-burst");
      void button.offsetWidth;
      button.classList.add("like-burst");
      window.setTimeout(() => button.classList.remove("like-burst"), 520);

      sendLikeToNetlify({
        card,
        action: willLike ? "like" : "unlike",
        productId,
      });
    });
  });
}

function initPromo() {
  const promoBanner = $("#promo-banner");
  const closeBannerBtn = $("#close-banner");
  const promoPopup = $("#promo-popup");
  let bannerHideTimer = null;

  const hideBanner = () => {
    if (!promoBanner) return;
    window.clearTimeout(bannerHideTimer);
    promoBanner.style.transform = "translateY(-100%)";
    document.body.classList.remove("banner-active");
    window.setTimeout(() => {
      promoBanner.style.display = "none";
    }, 350);
  };

  if (promoBanner) {
    document.body.classList.add("banner-active");
    promoBanner.style.display = "flex";
    promoBanner.style.transform = "translateY(0)";

    closeBannerBtn?.addEventListener("click", hideBanner);
    bannerHideTimer = window.setTimeout(hideBanner, 6200);
  }

  // Popup de la ruleta desactivado: mantenemos la ruleta accesible desde el menú,
  // pero evitamos que aparezca una ventana promocional al entrar en la web.
  if (promoPopup) {
    promoPopup.classList.remove("show");
    promoPopup.setAttribute("aria-hidden", "true");
    promoPopup.style.display = "none";
    document.body.style.overflow = "";
  }
}

function throwConfetti() {
  const colors = ["#6366f1", "#ec4899", "#06b6d4", "#facc15", "#10b981"];
  const amount = prefersReducedMotion ? 24 : 120;

  for (let i = 0; i < amount; i += 1) {
    const confetti = document.createElement("div");
    const size = 6 + Math.random() * 9;
    confetti.style.position = "fixed";
    confetti.style.width = `${size}px`;
    confetti.style.height = `${size * (Math.random() > 0.5 ? 1 : 0.55)}px`;
    confetti.style.backgroundColor =
      colors[Math.floor(Math.random() * colors.length)];
    confetti.style.left = `${Math.random() * 100}vw`;
    confetti.style.top = "-14px";
    confetti.style.borderRadius = Math.random() > 0.65 ? "50%" : "3px";
    confetti.style.zIndex = "9999";
    confetti.style.pointerEvents = "none";
    document.body.appendChild(confetti);

    const horizontal = -2 + Math.random() * 4;
    const velocity = 2 + Math.random() * 4.5;
    let x = 0;
    let y = 0;
    let rotation = Math.random() * 360;

    function animateConfetti() {
      y += velocity;
      x += horizontal + Math.sin(y / 32) * 1.5;
      rotation += 6 + Math.random() * 2;
      confetti.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${rotation}deg)`;

      if (y < window.innerHeight + 40) {
        requestAnimationFrame(animateConfetti);
      } else {
        confetti.remove();
      }
    }

    requestAnimationFrame(animateConfetti);
  }
}

function initRuleta() {
  const ruletaForm = $("#ruleta-form");
  const canvas = $("#ruletaCanvas");
  if (!ruletaForm || !canvas) return;

  const ctx = canvas.getContext("2d");
  const btnGirar = $("#btn-girar");
  const inputPremio = $("#premio-ganado");
  const resultBox = $("#resultado-box");
  const pointer = $(".ruleta-pointer");

  const premios = [
    { text: "10% DTO", prob: 35, color: "#4f46e5" },
    { text: "Casi...", prob: 25, color: "#27272a" },
    { text: "15% DTO", prob: 15, color: "#ec4899" },
    { text: "50% 2º Ud.", prob: 12, color: "#06b6d4" },
    { text: "Envío Gratis", prob: 10, color: "#8b5cf6" },
    { text: "Llavero Regalo", prob: 3, color: "#f59e0b" },
  ];

  let currentAngle = 0;
  let isSpinning = false;
  let idleFrame = null;
  let cooldownTimer = null;
  const numSlices = premios.length;
  const sliceAngle = (2 * Math.PI) / numSlices;
  const cooldownMs = 7 * 24 * 60 * 60 * 1000;
  const spinTimestampKey = "aura_ruleta_last_spin_at";
  const lastPrizeKey = "aura_ruleta_last_prize";
  const legacySpinKey = "ha_tirado_ruleta";

  function readLastSpinAt() {
    const stored = Number(localStorage.getItem(spinTimestampKey) || 0);
    if (Number.isFinite(stored) && stored > 0) return stored;

    if (localStorage.getItem(legacySpinKey) === "true") {
      const migrated = Date.now();
      localStorage.setItem(spinTimestampKey, String(migrated));
      return migrated;
    }

    return 0;
  }

  function remainingCooldownMs() {
    const lastSpinAt = readLastSpinAt();
    if (!lastSpinAt) return 0;
    return Math.max(0, lastSpinAt + cooldownMs - Date.now());
  }

  function formatCountdown(ms) {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (days > 0) return `${days}d ${hours}h ${minutes}m ${seconds}s`;
    if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
    return `${minutes}m ${seconds}s`;
  }

  function clearCooldownTimer() {
    if (cooldownTimer) window.clearInterval(cooldownTimer);
    cooldownTimer = null;
  }

  function unlockWeeklySpin() {
    clearCooldownTimer();
    localStorage.removeItem(legacySpinKey);
    localStorage.removeItem(spinTimestampKey);
    localStorage.removeItem(lastPrizeKey);
    ruletaForm.style.display = "block";
    if (resultBox) {
      resultBox.style.display = "none";
      resultBox.innerHTML = "";
    }
    if (btnGirar) {
      btnGirar.disabled = false;
      btnGirar.innerHTML = 'Desbloquear Ruleta <i class="fas fa-unlock"></i>';
    }
  }

  function startCooldownCountdown() {
    const countdownEl = $("#ruleta-countdown");
    if (!countdownEl) return;

    const updateCountdown = () => {
      const remaining = remainingCooldownMs();
      if (remaining <= 0) {
        countdownEl.textContent = "Ya puedes volver a participar 🎉";
        window.setTimeout(unlockWeeklySpin, 650);
        return;
      }
      countdownEl.textContent = formatCountdown(remaining);
    };

    clearCooldownTimer();
    updateCountdown();
    cooldownTimer = window.setInterval(updateCountdown, 1000);
  }

  function renderCooldownMessage({ prize = "", afterSpin = false } = {}) {
    if (!resultBox) return;

    const prizeText = prize || localStorage.getItem(lastPrizeKey) || "tu última tirada";
    ruletaForm.style.display = "none";
    resultBox.style.display = "block";
    resultBox.innerHTML = `
      <div class="ruleta-cooldown-card">
        <span class="ruleta-cooldown-icon"><i class="fas fa-clock"></i></span>
        <h3>${afterSpin ? "¡Tirada registrada!" : "Ya has participado esta semana"}</h3>
        <p>${afterSpin ? `Tu resultado ha sido: <strong>${prizeText}</strong>.` : `Tu última participación fue: <strong>${prizeText}</strong>.`}</p>
        <p>Podrás volver a girar la ruleta cuando termine este contador:</p>
        <strong id="ruleta-countdown" class="ruleta-countdown">Calculando...</strong>
        <small>La promoción se desbloquea automáticamente cada 7 días en este dispositivo.</small>
      </div>`;
    startCooldownCountdown();
  }

  if (remainingCooldownMs() > 0) {
    renderCooldownMessage();
  } else {
    unlockWeeklySpin();
  }

  function drawWheel() {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const outerRadius = Math.min(centerX, centerY) - 18;
    const radius = outerRadius - 18;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const outerGradient = ctx.createRadialGradient(
      centerX,
      centerY,
      radius * 0.2,
      centerX,
      centerY,
      outerRadius,
    );
    outerGradient.addColorStop(0, "rgba(255,255,255,0.1)");
    outerGradient.addColorStop(0.72, "rgba(24,24,27,0.95)");
    outerGradient.addColorStop(1, "rgba(255,255,255,0.18)");

    ctx.beginPath();
    ctx.arc(centerX, centerY, outerRadius, 0, Math.PI * 2);
    ctx.fillStyle = outerGradient;
    ctx.fill();

    premios.forEach((premio, i) => {
      const startAngle = currentAngle + i * sliceAngle;
      const endAngle = startAngle + sliceAngle;
      const gradient = ctx.createRadialGradient(
        centerX,
        centerY,
        20,
        centerX,
        centerY,
        radius,
      );
      gradient.addColorStop(0, "#ffffff");
      gradient.addColorStop(0.06, premio.color);
      gradient.addColorStop(1, premio.color);

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = gradient;
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.35)";
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(startAngle + sliceAngle / 2);
      ctx.textAlign = "right";
      ctx.fillStyle = "#ffffff";
      ctx.font = "800 21px Outfit, sans-serif";
      ctx.shadowColor = "rgba(0,0,0,0.45)";
      ctx.shadowBlur = 7;
      ctx.fillText(premio.text, radius - 28, 7);
      ctx.restore();
    });

    for (let i = 0; i < numSlices; i += 1) {
      const angle = currentAngle + i * sliceAngle;
      const x = centerX + Math.cos(angle) * (radius + 8);
      const y = centerY + Math.sin(angle) * (radius + 8);

      ctx.beginPath();
      ctx.arc(x, y, 8, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,255,255,0.95)";
      ctx.fill();
      ctx.strokeStyle = "rgba(0,0,0,0.28)";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(x - 3, y - 3, 2.2, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffff";
      ctx.fill();
    }

    ctx.beginPath();
    ctx.arc(centerX, centerY, 56, 0, Math.PI * 2);
    ctx.fillStyle = "#18181b";
    ctx.fill();
    ctx.lineWidth = 5;
    ctx.strokeStyle = "#ff2a5f";
    ctx.shadowColor = "rgba(255,42,95,0.55)";
    ctx.shadowBlur = 18;
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.font = "900 22px Outfit, sans-serif";
    ctx.fillText("AURA", centerX, centerY - 1);
    ctx.font = "800 14px Outfit, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.72)";
    ctx.fillText("3D", centerX, centerY + 20);
  }

  function updatePointer() {
    if (!pointer) return;
    const isMobile = window.innerWidth <= 780;
    const pointerAngle = isMobile ? (3 * Math.PI) / 2 : 0;
    const distance = (pointerAngle - currentAngle + 100 * Math.PI) % sliceAngle;
    let bend = 0;

    if (distance < 0.18) {
      bend = (1 - distance / 0.18) * -52;
    } else if (distance > sliceAngle - 0.1) {
      bend = (1 - (sliceAngle - distance) / 0.1) * 22;
    }

    pointer.style.transform = `rotate(${bend}deg)`;
  }

  function idle() {
    if (!isSpinning && !prefersReducedMotion) {
      currentAngle += 0.0018;
      drawWheel();
      updatePointer();
    }
    idleFrame = requestAnimationFrame(idle);
  }

  drawWheel();
  updatePointer();
  idle();
  window.addEventListener("resize", () => {
    drawWheel();
    updatePointer();
  });

  ruletaForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (isSpinning) return;

    if (remainingCooldownMs() > 0) {
      renderCooldownMessage();
      return;
    }

    cancelAnimationFrame(idleFrame);
    isSpinning = true;
    canvas.closest(".ruleta-wheel-box")?.classList.add("is-spinning");
    if (btnGirar) {
      btnGirar.disabled = true;
      btnGirar.innerHTML = 'Girando... <i class="fas fa-spinner fa-spin"></i>';
    }

    const rand = Math.random() * 100;
    let sum = 0;
    let winnerIndex = 0;

    for (let i = 0; i < premios.length; i += 1) {
      sum += premios[i].prob;
      if (rand <= sum) {
        winnerIndex = i;
        break;
      }
    }

    const premioTexto = premios[winnerIndex].text;
    if (inputPremio) inputPremio.value = premioTexto;

    const isMobile = window.innerWidth <= 780;
    const pointerAngle = isMobile ? (3 * Math.PI) / 2 : 0;
    const currentTurns = Math.ceil(currentAngle / (Math.PI * 2));
    const targetAngle =
      pointerAngle - (winnerIndex * sliceAngle + sliceAngle / 2);
    const finalAngle =
      currentTurns * Math.PI * 2 + targetAngle + 10 * Math.PI * 2;
    const duration = prefersReducedMotion ? 1000 : 5200;
    const startAngle = currentAngle;
    const startTime = performance.now();

    function animate(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easing = 1 - Math.pow(1 - progress, 4);

      currentAngle = startAngle + (finalAngle - startAngle) * easing;
      drawWheel();
      updatePointer();

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        enviarANetlify(premioTexto);
      }
    }

    requestAnimationFrame(animate);
  });

  async function enviarANetlify(premio) {
    const formData = new FormData(ruletaForm);

    try {
      await fetch("/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(formData).toString(),
      });

      localStorage.setItem(legacySpinKey, "true");
      localStorage.setItem(spinTimestampKey, String(Date.now()));
      localStorage.setItem(lastPrizeKey, premio);
      canvas.closest(".ruleta-wheel-box")?.classList.remove("is-spinning");
      ruletaForm.style.display = "none";

      if (resultBox) {
        if (premio !== "Casi...") throwConfetti();
        renderCooldownMessage({ prize: premio, afterSpin: true });
      }
    } catch (error) {
      console.error(error);
      alert("No se pudo registrar la tirada. Inténtalo de nuevo.");
      if (btnGirar) {
        btnGirar.disabled = false;
        btnGirar.innerHTML = 'Desbloquear Ruleta <i class="fas fa-unlock"></i>';
      }
      canvas.closest(".ruleta-wheel-box")?.classList.remove("is-spinning");
      isSpinning = false;
      idle();
      return;
    }

    isSpinning = false;
  }
}

function initPremiumCursor() {
  // Cursor glow desactivado a petición del cliente.
}

function initMagneticElements() {
  if (prefersReducedMotion || window.matchMedia("(pointer: coarse)").matches)
    return;

  const elements = $$(
    ".btn-primary, .btn-secondary, .btn-catalogo, .btn-back, .btn-outline, .nav-cta, .filter-chip, .category-tile",
  );

  elements.forEach((element) => {
    element.addEventListener("mousemove", (event) => {
      const rect = element.getBoundingClientRect();
      const x = event.clientX - rect.left - rect.width / 2;
      const y = event.clientY - rect.top - rect.height / 2;
      element.style.transform = `translate(${x * 0.08}px, ${y * 0.12}px) translateY(-2px)`;
    });

    element.addEventListener("mouseleave", () => {
      element.style.transform = "";
    });
  });
}

function initTiltCards() {
  if (prefersReducedMotion || window.matchMedia("(pointer: coarse)").matches)
    return;

  const cards = $$(
    ".service-card, .price-card, .review-card, .contact-card, .catalog-card, .gallery-card, .spec-item, .glass-card",
  );

  cards.forEach((card) => {
    card.classList.add("tilt-active");

    card.addEventListener("mousemove", (event) => {
      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      const rotateX = y * -5;
      const rotateY = x * 5;
      card.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
    });

    card.addEventListener("mouseleave", () => {
      card.style.transform = "";
    });
  });
}

function initImagePolish() {
  $$(
    'img[loading="lazy"], .image-background, .catalog-card img, .gallery-card img',
  ).forEach((img) => {
    const markLoaded = () => img.classList.add("img-loaded");
    if (img.complete) markLoaded();
    else img.addEventListener("load", markLoaded, { once: true });
  });
}

function initCatalogEnhancements() {
  const cards = $$(".catalog-card");
  const buttons = $$(".filter-chip");
  const searchInput = $("#catalog-search");
  const searchBox = searchInput?.closest(".search-box");
  const clearButton = $("#catalog-search-clear");
  const resetButton = $("#catalog-reset");
  const countLabel = $("#catalog-count");

  if (!cards.length) return;

  const cardMatchesButton = (card, filter) => {
    if (filter === "all") return true;
    return normalize(card.dataset.category).split(" ").includes(filter);
  };

  buttons.forEach((button) => {
    const filter = button.dataset.filter || "all";
    const total = cards.filter((card) =>
      cardMatchesButton(card, filter),
    ).length;
    if (!button.querySelector(".chip-count")) {
      const badge = document.createElement("span");
      badge.className = "chip-count";
      badge.textContent = total;
      button.appendChild(badge);
    }
    button.setAttribute(
      "aria-pressed",
      button.classList.contains("active") ? "true" : "false",
    );
  });

  const updateState = () => {
    if (searchBox)
      searchBox.classList.toggle(
        "has-value",
        Boolean(searchInput?.value.trim()),
      );
    buttons.forEach((button) => {
      button.setAttribute(
        "aria-pressed",
        button.classList.contains("active") ? "true" : "false",
      );
    });
    if (countLabel) countLabel.setAttribute("aria-live", "polite");
  };

  clearButton?.addEventListener("click", () => {
    if (!searchInput) return;
    searchInput.value = "";
    searchInput.dispatchEvent(new Event("input", { bubbles: true }));
    searchInput.focus();
    updateState();
  });

  resetButton?.addEventListener("click", () => {
    if (searchInput) {
      searchInput.value = "";
      searchInput.dispatchEvent(new Event("input", { bubbles: true }));
    }
    buttons[0]?.click();
    updateState();
  });

  searchInput?.addEventListener("input", updateState);
  buttons.forEach((button) =>
    button.addEventListener("click", () => setTimeout(updateState, 0)),
  );

  updateState();
}

function initCatalogLightboxNavigation() {
  const lightbox = $("#catalog-lightbox");
  const image = lightbox?.querySelector("img");
  const caption = lightbox?.querySelector(".lightbox-caption");
  if (!lightbox || !image) return;

  if (!lightbox.querySelector(".lightbox-prev")) {
    const prev = document.createElement("button");
    prev.className = "lightbox-nav lightbox-prev";
    prev.type = "button";
    prev.setAttribute("aria-label", "Imagen anterior");
    prev.innerHTML = '<i class="fas fa-chevron-left"></i>';
    lightbox.appendChild(prev);

    const next = document.createElement("button");
    next.className = "lightbox-nav lightbox-next";
    next.type = "button";
    next.setAttribute("aria-label", "Imagen siguiente");
    next.innerHTML = '<i class="fas fa-chevron-right"></i>';
    lightbox.appendChild(next);
  }

  const visibleCards = () => $$(".catalog-card").filter((card) => !card.hidden);
  const getPath = (src) => {
    try {
      return new URL(src, window.location.href).pathname;
    } catch {
      return src;
    }
  };

  const currentIndex = () => {
    const path = getPath(image.src);
    return visibleCards().findIndex(
      (card) => getPath(card.querySelector("img")?.src || "") === path,
    );
  };

  const navigate = (offset) => {
    const cards = visibleCards();
    if (!cards.length) return;
    const index = currentIndex();
    const target =
      cards[(index + offset + cards.length) % cards.length] || cards[0];
    const targetImg = target.querySelector("img");
    const title = target.dataset.title || targetImg?.alt || "Aura 3D";
    const category =
      target.querySelector(".catalog-card-info span")?.textContent || "Galería";

    image.src = targetImg?.src || "";
    image.alt = targetImg?.alt || title;
    if (caption) caption.textContent = `${category} · ${title}`;
  };

  lightbox
    .querySelector(".lightbox-prev")
    ?.addEventListener("click", (event) => {
      event.stopPropagation();
      navigate(-1);
    });

  lightbox
    .querySelector(".lightbox-next")
    ?.addEventListener("click", (event) => {
      event.stopPropagation();
      navigate(1);
    });

  document.addEventListener("keydown", (event) => {
    if (!lightbox.classList.contains("show")) return;
    if (event.key === "ArrowLeft") navigate(-1);
    if (event.key === "ArrowRight") navigate(1);
  });
}


function initCatalogToolbarAutoHide() {
  const toolbar = document.querySelector(".catalog-toolbar-wrap");
  if (!toolbar) return;

  const hero = document.querySelector(".catalog-hero");
  const isDesktop = () => window.matchMedia("(min-width: 781px)").matches;
  let lastY = window.scrollY;
  let ticking = false;

  const revealToolbar = () => toolbar.classList.remove("is-hidden");
  const hideToolbar = () => toolbar.classList.add("is-hidden");

  const update = () => {
    const currentY = window.scrollY;

    if (!isDesktop()) {
      revealToolbar();
      lastY = currentY;
      return;
    }

    const heroLimit = (hero?.offsetHeight || 0) + 60;
    const delta = currentY - lastY;

    if (currentY <= heroLimit || currentY < 180) {
      revealToolbar();
    } else if (delta > 8) {
      hideToolbar();
    } else if (delta < -8) {
      revealToolbar();
    }

    lastY = currentY;
  };

  const requestUpdate = () => {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(() => {
      update();
      ticking = false;
    });
  };

  window.addEventListener("scroll", requestUpdate, { passive: true });
  window.addEventListener("resize", requestUpdate);
  toolbar.addEventListener("focusin", revealToolbar);
  toolbar.addEventListener("pointerenter", revealToolbar);

  document.addEventListener("click", (event) => {
    if (
      event.target.closest("#catalog-filters .filter-chip") ||
      event.target.closest("#catalog-search-clear") ||
      event.target.closest("#catalog-reset") ||
      event.target.closest("#catalog-sort")
    ) {
      window.setTimeout(requestUpdate, 80);
    }
  });

  update();
}

function initRuletaFormProgress() {
  const form = $("#ruleta-form");
  const panel = form?.closest(".ruleta-info");
  if (!form || !panel) return;

  const fields = $$("input[required]", form);
  const update = () => {
    const completed = fields.filter((field) => field.value.trim()).length;
    const progress = fields.length
      ? Math.round((completed / fields.length) * 100)
      : 0;
    panel.style.setProperty("--form-progress", `${progress}%`);
  };

  fields.forEach((field) => field.addEventListener("input", update));
  update();
}

function initCategoryJumpSpy() {
  const links = $$(".catalog-jump-menu a");
  const sections = $$(".catalog-section");
  if (!links.length || !sections.length || !("IntersectionObserver" in window))
    return;

  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!visible) return;
      links.forEach((link) =>
        link.classList.toggle(
          "active",
          link.getAttribute("href") === `#${visible.target.id}`,
        ),
      );
    },
    { threshold: [0.18, 0.3, 0.5], rootMargin: "-25% 0px -55% 0px" },
  );

  sections.forEach((section) => observer.observe(section));
}

function initAuraChatbot() {
  if (document.body.classList.contains("admin-page-body")) return;
  if ($("#aura-chatbot")) return;

  const root = document.createElement("div");
  root.id = "aura-chatbot";
  root.className = "aura-chatbot";
  root.innerHTML = `
    <button class="aura-chat-toggle" type="button" aria-label="Abrir chat de Aura 3D" aria-expanded="false">
      <span class="aura-chat-toggle-orb"><i class="fas fa-comments"></i></span>
      <span class="aura-chat-toggle-text">¿Dudas?</span>
    </button>

    <section class="aura-chat-panel" aria-label="Chatbot Aura 3D" hidden>
      <header class="aura-chat-header">
        <div class="aura-chat-brand">
          <img src="assets/images/iconos/logo_png_blanco.png" alt="Aura 3D" />
          <div>
            <strong>AuraBot</strong>
            <span>Asistente de Aura 3D</span>
          </div>
        </div>
        <button class="aura-chat-close" type="button" aria-label="Cerrar chat"><i class="fas fa-times"></i></button>
      </header>

      <div class="aura-chat-messages" role="log" aria-live="polite"></div>

      <div class="aura-chat-suggestions" aria-label="Preguntas sugeridas">
        <button type="button">Quiero un regalo, ¿qué me recomendáis?</button>
        <button type="button">¿Tenéis cosas de música?</button>
        <button type="button">¿Qué puedo pedir para mi mascota?</button>
        <button type="button">¿Qué diferencia hay entre Raw y Premium?</button>
        <button type="button">¿Cuánto tarda un encargo?</button>
        <button type="button">¿Cómo pido presupuesto?</button>
      </div>

      <form class="aura-chat-form">
        <input type="text" maxlength="700" placeholder="Pregunta sobre Aura 3D..." aria-label="Mensaje para AuraBot" autocomplete="off" />
        <button type="submit" aria-label="Enviar mensaje"><i class="fas fa-paper-plane"></i></button>
      </form>
    </section>`;
  document.body.appendChild(root);

  const toggle = $(".aura-chat-toggle", root);
  const panel = $(".aura-chat-panel", root);
  const close = $(".aura-chat-close", root);
  const messagesHost = $(".aura-chat-messages", root);
  const form = $(".aura-chat-form", root);
  const input = $(".aura-chat-form input", root);
  const suggestions = $$(".aura-chat-suggestions button", root);
  const historyKey = "aura_chat_history_v15";

  let messages = [];
  let isLoading = false;
  let catalogSummaryCache = "";
  let knowledgeSummaryCache = "";
  let catalogDataForChat = null;
  let knowledgeDataForChat = null;

  const defaultMessage = {
    role: "assistant",
    content:
      "¡Hola! Soy AuraBot ✨ Cuéntame qué estás buscando y te oriento con ideas, catálogo, encargos, regalos, tiempos o presupuestos de Aura 3D.",
  };

  const saveHistory = () => {
    sessionStorage.setItem(historyKey, JSON.stringify(messages.slice(-10)));
  };

  const loadHistory = () => {
    try {
      const stored = JSON.parse(sessionStorage.getItem(historyKey) || "[]");
      messages =
        Array.isArray(stored) && stored.length ? stored : [defaultMessage];
    } catch {
      messages = [defaultMessage];
    }
  };

  const formatChatContent = (content = "") =>
    escapeHtml(content)
      .replace(/\n{3,}/g, "\n\n")
      .replace(/\n/g, "<br>");

  const messageHtml = (message) => `
    <div class="aura-chat-message ${message.role === "user" ? "user" : "bot"}">
      <div>${formatChatContent(message.content)}</div>
    </div>`;

  const render = () => {
    messagesHost.innerHTML =
      messages.map(messageHtml).join("") +
      (isLoading
        ? `
      <div class="aura-chat-message bot loading"><div><span></span><span></span><span></span></div></div>`
        : "");
    messagesHost.scrollTop = messagesHost.scrollHeight;
  };

  const openChat = () => {
    panel.hidden = false;
    root.classList.add("is-open");
    document.body.classList.add("aura-chat-open");
    toggle.setAttribute("aria-expanded", "true");
    window.dispatchEvent(new CustomEvent("aura-chat-state", { detail: { open: true } }));
    window.setTimeout(() => input?.focus(), 80);
  };

  const closeChat = () => {
    panel.hidden = true;
    root.classList.remove("is-open");
    document.body.classList.remove("aura-chat-open");
    toggle.setAttribute("aria-expanded", "false");
    window.dispatchEvent(new CustomEvent("aura-chat-state", { detail: { open: false } }));
  };

  const loadCatalogForChat = async () => {
    if (catalogDataForChat) return catalogDataForChat;
    catalogDataForChat = await getCatalogData();
    return catalogDataForChat;
  };

  const loadKnowledgeForChat = async () => {
    if (knowledgeDataForChat) return knowledgeDataForChat;
    try {
      const response = await fetch("data/aura-knowledge.json", {
        cache: "no-store",
      });
      if (!response.ok)
        throw new Error("No se pudo cargar data/aura-knowledge.json");
      knowledgeDataForChat = await response.json();
      return knowledgeDataForChat;
    } catch (error) {
      console.warn("Base de conocimiento AuraBot no disponible.", error);
      return null;
    }
  };

  const stringifyList = (items = []) => items.filter(Boolean).join("\n");

  const buildKnowledgeSummary = async () => {
    if (knowledgeSummaryCache) return knowledgeSummaryCache;

    const knowledge = await loadKnowledgeForChat();
    if (!knowledge) {
      knowledgeSummaryCache =
        "Base de conocimiento avanzada no disponible. Usar la información general de Aura 3D y el catálogo.";
      return knowledgeSummaryCache;
    }

    const services = (knowledge.services || [])
      .map(
        (service) =>
          `- ${service.name}: ${service.summary} Ideal para: ${service.bestFor || "consulta personalizada"}.`,
      )
      .join("\n");

    const prices = (knowledge.pricing?.items || [])
      .map((item) => `- ${item.name}: desde ${item.from}. ${item.description}`)
      .join("\n");

    const faqs = (knowledge.faqs || [])
      .map((item) => `P: ${item.question}\nR: ${item.answer}`)
      .join("\n");

    knowledgeSummaryCache = `
EMPRESA
${knowledge.business?.name || "Aura 3D"}: ${knowledge.business?.description || "Estudio de diseño e impresión 3D."}
Fundadores: ${(knowledge.business?.founders || []).join(", ") || "Sergio Valiente y Carlos Parriego"}.
Historia: ${knowledge.business?.story || "Proyecto especializado en impresión 3D personalizada."}
Tono: ${knowledge.business?.tone || "Cercano, profesional y claro."}

SERVICIOS
${services}

TARIFAS ORIENTATIVAS
${knowledge.pricing?.important || "No dar precio final sin presupuesto personalizado."}
${prices}

PROCESO DE COMPRA / PRESUPUESTO
${stringifyList((knowledge.orderingProcess || []).map((step, index) => `${index + 1}. ${step}`))}

ENVÍOS Y PLAZOS
- Stock: ${knowledge.timesAndShipping?.stock || "24/72h."}
- Personalizados: ${knowledge.timesAndShipping?.custom || "5 a 10 días laborables según complejidad."}
- Nota: ${knowledge.timesAndShipping?.note || "No prometer fechas exactas."}

MATERIALES
- Principal: ${knowledge.materials?.main || "PLA+ de alta calidad."}
- Flexibilidad: ${knowledge.materials?.flexibility || "Consultar según proyecto."}

CATÁLOGO
${knowledge.catalog?.description || "El catálogo se organiza por secciones y productos visibles."}
Secciones conocidas: ${(knowledge.catalog?.knownSections || []).join(", ")}.
Sugerencias: ${stringifyList(knowledge.catalog?.suggestions || [])}

RULETA
${knowledge.wheelPromotion?.description || "Promoción de premios y descuentos."}
Premios posibles: ${(knowledge.wheelPromotion?.possiblePrizes || []).join(", ")}.
Reglas: ${stringifyList(knowledge.wheelPromotion?.rules || [])}

CONTACTO
Formulario: ${knowledge.contact?.form || "Formulario de contacto en la web."}
Email: ${knowledge.contact?.email || "3daurainfo@gmail.com"}
Instagram: ${knowledge.contact?.instagram || "@3daura_"}
TikTok: ${knowledge.contact?.tiktok || "@3daura"}
Wallapop: ${knowledge.contact?.wallapop || "Perfil enlazado en la web."}
Vinted: ${knowledge.contact?.vinted || "Perfil enlazado en la web."}
Cults3D: ${knowledge.contact?.cults3d || "Perfil enlazado en la web."}

FAQ BASE
${faqs}

ESTILO DE CONVERSACIÓN
${stringifyList(knowledge.conversationStyle?.personality || [])}
Evitar: ${stringifyList(knowledge.conversationStyle?.avoid || [])}
Forma recomendada: ${stringifyList(knowledge.conversationStyle?.goodAnswerShape || [])}

PLAYBOOKS DE RECOMENDACIÓN
${stringifyList((knowledge.recommendationPlaybooks || []).map((item) => `- ${item.intent}: ${item.answerGuidance}`))}

EJEMPLOS DE RESPUESTA
${stringifyList(
  (knowledge.chatExamples || []).map(
    (item) => `Usuario: ${item.user}
AuraBot: ${item.assistant}`,
  ),
)}

REGLAS DEL ASISTENTE
${stringifyList(knowledge.responseRules || [])}
`.trim();

    return knowledgeSummaryCache;
  };

  const buildCatalogSummary = async () => {
    if (catalogSummaryCache) return catalogSummaryCache;

    const data = await loadCatalogForChat();
    if (!data?.products?.length) {
      catalogSummaryCache = "Catálogo no disponible en este momento.";
      return catalogSummaryCache;
    }

    const categoryMap = getCategoryMap(data);
    const categories = (data.categories || [])
      .map((category) => `${category.name} (${category.id})`)
      .join(", ");
    const products = data.products
      .filter((product) => product.visible !== false)
      .slice(0, 80)
      .map((product) => {
        const category = getCategoryName(
          categoryMap,
          getPrimaryCategory(product),
        );
        const extraCategories = getProductCategories(product)
          .map((id) => getCategoryName(categoryMap, id))
          .join(", ");
        const keywords =
          Array.isArray(product.keywords) && product.keywords.length
            ? ` · keywords: ${product.keywords.slice(0, 10).join(", ")}`
            : "";
        const description = product.description
          ? ` · descripción: ${product.description}`
          : "";
        const featured = product.featured ? " · destacado en inicio" : "";
        const links = product.links || {};
        const platforms = [
          links.wallapop && "Wallapop",
          links.vinted && "Vinted",
          links.cults && "Cults3D",
        ].filter(Boolean);
        const platformText = platforms.length
          ? ` · enlaces: ${platforms.join(", ")}`
          : "";
        return `- ${product.title} [principal: ${category}; secciones: ${extraCategories}]${description}${keywords}${featured}${platformText}`;
      })
      .join("\n");

    catalogSummaryCache = `Secciones actuales: ${categories || "Sin secciones"}\nProductos visibles:\n${products}`;
    return catalogSummaryCache;
  };

  const hasAny = (normalizedText, words) =>
    words.some((word) => normalizedText.includes(word));

  const isExternalQuestion = (q) =>
    hasAny(q, [
      "tiempo",
      "clima",
      "temperatura",
      "noticias",
      "politica",
      "política",
      "deberes",
      "receta",
      "cocina",
      "salud",
      "medico",
      "médico",
      "finanzas",
      "bitcoin",
      "bolsa",
      "programacion",
      "programación",
      "viaje",
      "hotel",
      "futbol",
      "fútbol",
    ]);

  const getVisibleProductsForChat = async () => {
    const data = await loadCatalogForChat();
    if (!data?.products?.length)
      return { data, products: [], categoryMap: new Map() };
    return {
      data,
      products: data.products.filter((product) => product.visible !== false),
      categoryMap: getCategoryMap(data),
    };
  };

  const productText = (product) =>
    normalize(
      [
        product.title,
        product.description,
        product.alt,
        ...(product.keywords || []),
        ...(product.categories || []),
        product.primaryCategory,
      ]
        .filter(Boolean)
        .join(" "),
    );

  const selectProductsByTerms = async (terms = [], limit = 4) => {
    const { products, categoryMap } = await getVisibleProductsForChat();
    const normalizedTerms = terms.map(normalize).filter(Boolean);
    const scored = products
      .map((product) => {
        const text = productText(product);
        const score = normalizedTerms.reduce(
          (total, term) => total + (text.includes(term) ? 1 : 0),
          0,
        );
        return { product, score };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((item) => item.product);
    return { products: scored, categoryMap };
  };

  const productNames = (products = []) =>
    products
      .map((product) => product.title)
      .filter(Boolean)
      .join(", ");

  const findProductAnswer = async (normalizedText) => {
    const { products, categoryMap } = await getVisibleProductsForChat();
    if (!products.length) return "";

    const matched = products.find((product) => {
      const title = normalize(product.title || "");
      if (title && normalizedText.includes(title)) return true;
      const keywords = Array.isArray(product.keywords)
        ? product.keywords.map(normalize)
        : [];
      return keywords.some(
        (keyword) => keyword.length > 3 && normalizedText.includes(keyword),
      );
    });

    if (!matched) return "";
    const category = getCategoryName(categoryMap, getPrimaryCategory(matched));
    const description = matched.description ? ` ${matched.description}` : "";
    const links = matched.links || {};
    const platforms = [
      links.wallapop && "Wallapop",
      links.vinted && "Vinted",
      links.cults && "Cults3D",
    ].filter(Boolean);
    const platformsText = platforms.length
      ? ` Si te interesa, puedes verlo o pedirlo mediante ${platforms.join(", ")}, o escribirnos para personalizarlo.`
      : " Si te interesa, podemos orientarte por el formulario, Instagram o email para ver presupuesto, tamaño y disponibilidad.";
    return `Sí, tenemos ${matched.title}, dentro de ${category}.${description}${platformsText} También podemos adaptar la idea en tamaño, color o acabado según lo que busques.`;
  };

  const recommendationAnswer = async (q) => {
    if (
      hasAny(q, [
        "nino",
        "ninos",
        "niño",
        "niños",
        "nina",
        "ninas",
        "niña",
        "niñas",
        "peque",
        "peques",
        "infantil",
        "hijo",
        "hija",
        "sobrino",
        "sobrina",
      ])
    ) {
      const { products } = await selectProductsByTerms(
        ["funko", "mascota", "busto", "decoracion", "figura"],
        4,
      );
      const names = productNames(products);
      return `Para niños yo iría a algo personalizado y llamativo: un funko inspirado en su mascota o personaje favorito, una figura sencilla decorativa o una placa con su nombre. ${names ? `Del catálogo te pueden encajar: ${names}.` : ""} Si es para un peque muy pequeño, mejor tratarlo como decoración y evitar piezas pequeñas sueltas. ¿Qué edad tiene y qué le gusta?`;
    }

    if (
      hasAny(q, [
        "musica",
        "música",
        "cantante",
        "artista",
        "album",
        "álbum",
        "dellafuente",
        "corales",
        "portada",
        "cancion",
        "canción",
      ])
    ) {
      const { products } = await selectProductsByTerms(
        ["dellafuente", "corales", "azulejo", "portate", "musica", "logo"],
        5,
      );
      const names = productNames(products);
      return `De música lo más chulo son los azulejos decorativos y piezas tipo portada/frase. ${names ? `Ahora mismo te pueden encajar: ${names}.` : "Podemos hacer una placa o azulejo inspirado en una portada, frase o artista."} Queda muy bien para decorar una habitación, estudio o como regalo. ¿Lo quieres para ti o para regalar?`;
    }

    if (hasAny(q, ["mascota", "perro", "gato", "animal", "peludo", "peluda"])) {
      const { products } = await selectProductsByTerms(
        ["mascota", "busto", "funko", "perro", "gato"],
        4,
      );
      const names = productNames(products);
      return `Para mascotas tenemos dos opciones que suelen gustar mucho: un busto personalizado si quieres algo elegante, o un funko de mascota si prefieres algo más divertido. ${names ? `En catálogo puedes ver ideas como ${names}.` : ""} Lo ideal es enviarnos fotos claras de frente y perfil, tamaño aproximado y si lo quieres Raw o Premium.`;
    }

    if (
      hasAny(q, [
        "regalo",
        "regalar",
        "cumple",
        "cumpleanos",
        "cumpleaños",
        "detalle",
        "sorpresa",
      ])
    ) {
      const { products } = await selectProductsByTerms(
        ["funko", "busto", "azulejo", "decoracion", "personalizado"],
        5,
      );
      const names = productNames(products);
      return `Para regalo, lo mejor es personalizarlo un poco para que tenga sentido para esa persona. ${names ? `Ideas que pueden funcionar: ${names}.` : "Podemos hacer bustos, funkos, azulejos o piezas decorativas a medida."} Si me dices para quién es y qué le gusta, te recomiendo algo más afinado.`;
    }

    if (
      hasAny(q, [
        "terror",
        "stranger",
        "fnaf",
        "vecna",
        "demogorgon",
        "miedo",
        "halloween",
        "gaming",
        "juego",
        "juegos",
      ])
    ) {
      const { products } = await selectProductsByTerms(
        ["terror", "fnaf", "vecna", "demogorgon", "figura", "gaming"],
        5,
      );
      const names = productNames(products);
      return `Si buscas algo de terror o colección, miraría piezas tipo ${names || "FNAF, Vecna Chibi o Demogorgon"}. Funcionan muy bien como decoración para escritorio, estantería o regalo fan. ¿Prefieres algo más chibi/decorativo o una figura más de colección?`;
    }

    return "";
  };

  const localAnswer = async (text, { forceFallback = false } = {}) => {
    const q = normalize(text);
    if (!q) return "";

    if (isExternalQuestion(q)) {
      return "Ahí no puedo ayudarte, estoy pensado solo para dudas de Aura 3D. Si quieres, sí puedo orientarte con regalos, catálogo, encargos personalizados, materiales, envíos o la ruleta.";
    }

    const recommendation = await recommendationAnswer(q);
    if (recommendation) return recommendation;

    const product = await findProductAnswer(q);
    if (product) return product;

    if (
      hasAny(q, [
        "presupuesto",
        "encargo",
        "personalizado",
        "contacto",
        "formulario",
        "pedir",
        "pedido",
        "idea",
        "hacer",
      ])
    ) {
      return "Sí, claro. Para pedir presupuesto, cuéntanos la idea en el formulario de contacto o por Instagram @3daura_. Lo que más nos ayuda es: fotos o referencias, medidas aproximadas, color, acabado Raw o Premium y si tienes una fecha concreta.";
    }

    if (
      hasAny(q, [
        "envio",
        "envios",
        "tarda",
        "tiempo",
        "llegar",
        "entrega",
        "plazo",
        "tardan",
      ])
    ) {
      return "Si el producto está en stock, normalmente lo enviamos en 24/72h. En encargos personalizados o pintados, lo habitual es entre 5 y 10 días laborables según la complejidad. Si lo necesitas para una fecha concreta, mejor nos lo dices al pedir presupuesto.";
    }

    if (
      hasAny(q, [
        "material",
        "pla",
        "resina",
        "filamento",
        "plastico",
        "plástico",
        "resistente",
      ])
    ) {
      return "Trabajamos principalmente con PLA+ de buena calidad porque da buen acabado y resistencia para figuras y decoración. Si el proyecto necesita otro material, lo podemos valorar según la pieza y el uso que vaya a tener.";
    }

    if (
      hasAny(q, [
        "precio",
        "precios",
        "tarifa",
        "tarifas",
        "cuesta",
        "coste",
        "vale",
        "cuanto",
        "cuánto",
      ])
    ) {
      return "Tenemos precios orientativos: Raw desde 15€, Premium desde 25€ y modelado a consultar. El precio final depende de tamaño, detalle, material, acabado y si hay que diseñar o modificar algo. Si me dices qué tienes en mente, te digo qué datos necesitaríamos para presupuestarlo.";
    }

    if (
      hasAny(q, [
        "servicio",
        "raw",
        "bruto",
        "premium",
        "acabado",
        "diseno",
        "diseño",
        "modelado",
      ])
    ) {
      return "Tenemos tres caminos: Raw, si quieres la pieza limpia para pintarla tú; Premium, si quieres recibirla ya preparada y con acabado artístico; y Diseño Personalizado, si hay que adaptar, escalar o crear algo a medida. Para regalo, normalmente recomendamos Premium o personalizado.";
    }

    if (
      hasAny(q, [
        "catalogo",
        "catálogo",
        "galeria",
        "galería",
        "producto",
        "productos",
        "azulejo",
        "azulejos",
        "busto",
        "bustos",
        "funko",
        "funkos",
        "figura",
        "figuras",
        "decoracion",
        "decoración",
        "terror",
      ])
    ) {
      const data = await loadCatalogForChat();
      if (data?.products?.length) {
        const categories = (data.categories || [])
          .map((category) => category.name)
          .join(", ");
        const count = data.products.filter(
          (product) => product.visible !== false,
        ).length;
        return `Ahora mismo tenemos ${count} piezas visibles en la galería, organizadas por secciones como ${categories}. Puedes filtrar por categoría o buscar por palabras clave; si buscas algo concreto, dime estilo o temática y te recomiendo opciones.`;
      }
      return "Puedes ver nuestras piezas en la Galería completa, con filtros por secciones y búsqueda por palabras clave. Si no encuentras justo lo que quieres, también hacemos encargos personalizados.";
    }

    if (
      hasAny(q, ["ruleta", "descuento", "premio", "premios", "girar", "suerte"])
    ) {
      return "La ruleta es una promo para conseguir descuentos o premios en Aura 3D. Rellenas tus datos, giras una vez y, si te toca premio, queda registrado para que podamos gestionarlo contigo. Es una forma rápida de llevarte una ventaja para tu próximo pedido.";
    }

    if (
      hasAny(q, ["comprar", "wallapop", "vinted", "cults", "stl", "descargar"])
    ) {
      return "Puedes comprar o contactar desde la web y, cuando un producto esté disponible, también mediante Wallapop o Vinted. Si buscas archivos digitales, algunos STL pueden estar en Cults3D. Para piezas personalizadas, lo mejor es escribirnos primero con la idea.";
    }

    if (
      hasAny(q, [
        "quienes",
        "quiénes",
        "sergio",
        "carlos",
        "historia",
        "nace",
        "aura 3d",
        "sois",
      ])
    ) {
      return "Aura 3D somos Sergio Valiente y Carlos Parriego. El proyecto nace de probar ideas, imprimir, mejorar acabados y convertir piezas 3D en regalos, decoración y encargos personalizados. Nos gusta que cada pieza tenga algo especial para quien la pide.";
    }

    if (forceFallback) {
      return "Te puedo orientar sobre Aura 3D, pero necesito un poco más de contexto. ¿Buscas un regalo, una pieza personalizada, algo del catálogo, información de envíos o un presupuesto?";
    }

    return "";
  };

  const askBot = async (text) => {
    messages.push({ role: "user", content: text });
    messages = messages.slice(-10);
    saveHistory();
    isLoading = true;
    render();

    try {
      const [catalogSummary, knowledgeSummary] = await Promise.all([
        buildCatalogSummary(),
        buildKnowledgeSummary(),
      ]);

      const response = await fetch("/.netlify/functions/aura-chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages,
          page: window.location.pathname,
          catalogSummary,
          knowledgeSummary,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok)
        throw new Error(data.error || "No se pudo conectar con AuraBot.");

      messages.push({
        role: "assistant",
        content:
          data.answer || (await localAnswer(text, { forceFallback: true })),
      });
    } catch (error) {
      console.warn("AuraBot error", error);
      messages.push({
        role: "assistant",
        content: await localAnswer(text, { forceFallback: true }),
      });
    } finally {
      isLoading = false;
      messages = messages.slice(-10);
      saveHistory();
      render();
    }
  };

  toggle.addEventListener("click", () => {
    if (panel.hidden) openChat();
    else closeChat();
  });
  close.addEventListener("click", closeChat);

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (isLoading) return;
    const text = input.value.trim();
    if (!text) return;
    input.value = "";
    askBot(text);
  });

  suggestions.forEach((button) => {
    button.addEventListener("click", () => {
      if (isLoading) return;
      askBot(button.textContent.trim());
    });
  });

  loadHistory();
  render();
}

window.addEventListener("DOMContentLoaded", async () => {
  initTheme();
  initNavigation();
  await initDynamicCatalogContent();
  initRevealAnimations();
  initFaq();
  initContactForm();
  initCarousels();
  initScrollTop();
  initBuyOptions();
  initCatalog();
  initCatalogLikes();
  initRuleta();
  initPromo();
  initMagneticElements();
  initTiltCards();
  initImagePolish();
  initCatalogEnhancements();
  initCatalogToolbarAutoHide();
  initCatalogLightboxNavigation();
  initRuletaFormProgress();
  initCategoryJumpSpy();
  initAuraChatbot();
});
