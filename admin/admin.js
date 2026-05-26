const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

const API_URL = "/.netlify/functions/catalog-admin";
const PASSWORD_KEY = "aura_admin_password";
const USER_KEY = "aura_admin_user";

let catalogData = { version: 1, updatedAt: "", categories: [], products: [] };
let currentImages = [];
let newImages = [];
let selectedProductId = "";
let selectedCategoryId = "";
let usingFallback = false;

function toast(message, type = "success") {
  const el = $("#toast");
  if (!el) return;
  el.textContent = message;
  el.className = `toast show ${type}`;
  setTimeout(() => {
    el.className = "toast";
  }, 3800);
}

function setStatus(message) {
  const status = $("#status-text");
  if (status) status.textContent = message;
}

function getPassword() {
  return localStorage.getItem(PASSWORD_KEY) || "";
}

function getUsername() {
  return localStorage.getItem(USER_KEY) || "";
}

function setCredentials(username, password) {
  localStorage.setItem(USER_KEY, username);
  localStorage.setItem(PASSWORD_KEY, password);
}

function clearPassword() {
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(PASSWORD_KEY);
}

function slugify(value = "") {
  return value
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || `producto-${Date.now()}`;
}

function escapeHtml(value = "") {
  return value
    .toString()
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function categoryName(id) {
  return catalogData.categories.find((cat) => cat.id === id)?.name || id || "Sin categoría";
}

function primaryImage(product) {
  return product.images?.[0] || "../assets/images/iconos/logo_png_blanco.png";
}

async function apiRequest(action, payload = null) {
  const options = {
    method: payload ? "POST" : "GET",
    headers: {
      "Content-Type": "application/json",
      "x-admin-user": getUsername(),
      "x-admin-password": getPassword(),
    },
  };

  let url = `${API_URL}?action=${encodeURIComponent(action)}`;
  if (payload) options.body = JSON.stringify({ action, ...payload });

  const response = await fetch(url, options);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error || "Error de conexión con el panel.");
    error.status = response.status;
    throw error;
  }
  return data;
}

async function loadCatalog({ allowPreview = false } = {}) {
  setStatus("Cargando catálogo...");
  usingFallback = false;

  try {
    const data = await apiRequest("list");
    catalogData = data.catalog;
    setStatus("Conectado con GitHub. Los cambios se publicarán automáticamente.");
  } catch (error) {
    console.warn(error);

    if (error.status === 401 || error.status === 403) {
      clearPassword();
      showLogin();
      toast(error.message || "Usuario o contraseña incorrectos.", "error");
      throw error;
    }

    if (!allowPreview) {
      toast(error.message || "No se pudo validar el acceso al panel.", "error");
      throw error;
    }

    try {
      const response = await fetch("../data/productos.json", { cache: "no-store" });
      if (!response.ok) throw new Error("No existe data/productos.json");
      catalogData = await response.json();
      usingFallback = true;
      setStatus("Modo vista previa: configura Netlify/GitHub para poder guardar cambios.");
      toast("Catálogo cargado en modo vista previa. Aún no se puede publicar.", "warn");
    } catch (fallbackError) {
      setStatus("No se pudo cargar el catálogo.");
      toast(error.message || fallbackError.message, "error");
      throw fallbackError;
    }
  }

  renderCategoryControls();
  renderProductsList();
  resetForm();
  resetCategoryForm();
}

async function authenticateAndLoad(username, password) {
  setCredentials(username, password);

  try {
    await loadCatalog();
    showApp();
  } catch (error) {
    clearPassword();
    showLogin();
    throw error;
  }
}

function showApp() {
  $("#login-view").hidden = true;
  $("#app-view").hidden = false;
}

function showLogin() {
  $("#login-view").hidden = false;
  $("#app-view").hidden = true;
}

function renderCategoryControls() {
  const select = $("#product-primary-category");
  const checks = $("#category-checks");
  if (!select || !checks) return;

  const categories = catalogData.categories || [];

  select.innerHTML = categories
    .map((cat) => `<option value="${escapeHtml(cat.id)}">${escapeHtml(cat.name)}</option>`)
    .join("");

  checks.innerHTML = categories
    .map(
      (cat) => `
        <label class="category-pill">
          <input type="checkbox" value="${escapeHtml(cat.id)}" />
          <span><i class="fas ${escapeHtml(cat.icon || "fa-tag")}"></i> ${escapeHtml(cat.name)}</span>
        </label>`,
    )
    .join("");

  select.onchange = () => {
    const selected = select.value;
    const checkbox = $(`#category-checks input[value="${CSS.escape(selected)}"]`);
    if (checkbox) checkbox.checked = true;
  };

  renderCategoriesList();
}

function categoryUsageCount(id) {
  return (catalogData.products || []).filter((product) => {
    const categories = new Set([...(product.categories || []), product.primaryCategory].filter(Boolean));
    return categories.has(id);
  }).length;
}

function renderCategoriesList() {
  const list = $("#categories-list");
  const count = $("#category-count");
  if (!list) return;

  const categories = catalogData.categories || [];
  if (count) count.textContent = `${categories.length} ${categories.length === 1 ? "sección" : "secciones"}`;

  if (!categories.length) {
    list.innerHTML = `<p class="empty-small">Aún no hay secciones. Crea una para organizar el catálogo.</p>`;
    return;
  }

  list.innerHTML = categories
    .map((category) => {
      const usage = categoryUsageCount(category.id);
      return `
        <button class="category-item ${category.id === selectedCategoryId ? "active" : ""}" type="button" data-category-id="${escapeHtml(category.id)}">
          <span class="category-item-icon"><i class="fas ${escapeHtml(category.icon || "fa-tag")}"></i></span>
          <span class="category-item-copy">
            <strong>${escapeHtml(category.name)}</strong>
            <small>${usage} ${usage === 1 ? "producto" : "productos"}</small>
          </span>
        </button>`;
    })
    .join("");

  $$(".category-item", list).forEach((button) => {
    button.addEventListener("click", () => editCategory(button.dataset.categoryId));
  });
}

function resetCategoryForm() {
  selectedCategoryId = "";
  const form = $("#category-form");
  if (!form) return;
  form.reset();
  $("#category-original-id").value = "";
  $("#category-id").value = "";
  $("#category-icon").value = "fa-star";
  $("#delete-category-btn").hidden = true;
  renderCategoriesList();
}

function editCategory(id) {
  const category = (catalogData.categories || []).find((item) => item.id === id);
  if (!category) return;

  selectedCategoryId = category.id;
  $("#category-original-id").value = category.id || "";
  $("#category-id").value = category.id || "";
  $("#category-name").value = category.name || "";
  $("#category-icon").value = category.icon || "fa-star";
  $("#delete-category-btn").hidden = false;
  renderCategoriesList();
}

function buildCategoryFromForm() {
  const name = $("#category-name").value.trim();
  return {
    id: $("#category-id").value.trim() || slugify(name),
    name,
    icon: $("#category-icon").value || "fa-star",
  };
}

async function saveCategory(event) {
  event.preventDefault();
  if (usingFallback) {
    toast("Configura la función de Netlify antes de publicar cambios.", "error");
    return;
  }

  const button = $("#save-category-btn");
  const original = button.innerHTML;
  const category = buildCategoryFromForm();
  const originalId = $("#category-original-id").value || selectedCategoryId || "";

  if (!category.name) {
    toast("El nombre de la sección es obligatorio.", "error");
    return;
  }

  button.disabled = true;
  button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';

  try {
    const result = await apiRequest("saveCategory", { category, originalId });
    catalogData = result.catalog;
    selectedCategoryId = result.category?.id || category.id;
    renderCategoryControls();
    renderProductsList();
    editCategory(selectedCategoryId);
    resetForm();
    toast("Sección guardada. Netlify desplegará la web en unos segundos.");
  } catch (error) {
    console.error(error);
    toast(error.message, "error");
  } finally {
    button.disabled = false;
    button.innerHTML = original;
  }
}

async function deleteSelectedCategory() {
  const id = $("#category-original-id").value || selectedCategoryId;
  if (!id) return;
  if (usingFallback) {
    toast("Configura la función de Netlify antes de eliminar secciones.", "error");
    return;
  }

  const usage = categoryUsageCount(id);
  const category = (catalogData.categories || []).find((item) => item.id === id);
  const warning = usage
    ? ` Esta sección está en ${usage} ${usage === 1 ? "producto" : "productos"}; se quitará de ellos o se reasignará a otra sección.`
    : "";

  if (!confirm(`¿Eliminar la sección "${category?.name || id}"?${warning}`)) return;

  try {
    const result = await apiRequest("deleteCategory", { id });
    catalogData = result.catalog;
    resetCategoryForm();
    renderCategoryControls();
    renderProductsList();
    resetForm();
    toast("Sección eliminada correctamente.");
  } catch (error) {
    console.error(error);
    toast(error.message, "error");
  }
}

function renderProductsList() {
  const list = $("#products-list");
  const count = $("#product-count");
  const query = slugify($("#admin-search")?.value || "").replace(/-/g, " ");
  if (!list) return;

  const products = [...(catalogData.products || [])]
    .filter((product) => {
      if (!query) return true;
      const haystack = slugify(`${product.title} ${product.description} ${(product.keywords || []).join(" ")}`).replace(/-/g, " ");
      return query.split(" ").every((word) => haystack.includes(word));
    })
    .sort((a, b) => (a.title || "").localeCompare(b.title || "", "es"));

  if (count) count.textContent = `${catalogData.products?.length || 0} ${(catalogData.products?.length || 0) === 1 ? "producto" : "productos"}`;

  list.innerHTML = products
    .map(
      (product) => `
      <button class="product-item ${product.id === selectedProductId ? "active" : ""}" type="button" data-product-id="${escapeHtml(product.id)}">
        <img src="../${escapeHtml(primaryImage(product).replace(/^\.\.\//, ""))}" alt="${escapeHtml(product.title || "Producto")}" />
        <span>
          <strong>${escapeHtml(product.title || "Sin título")}</strong>
          <small>${escapeHtml(categoryName(product.primaryCategory))}</small>
          <span class="status ${product.visible === false ? "hidden" : ""}">${product.visible === false ? "Oculto" : "Visible"}</span>
        </span>
      </button>`,
    )
    .join("");

  $$(".product-item", list).forEach((button) => {
    button.addEventListener("click", () => editProduct(button.dataset.productId));
  });
}

function resetForm() {
  selectedProductId = "";
  currentImages = [];
  newImages = [];
  $("#editor-title").textContent = "Nuevo producto";
  $("#delete-product-btn").hidden = true;
  $("#product-form").reset();
  $("#product-id").value = "";
  $("#product-visible").checked = true;
  const firstCategory = catalogData.categories?.[0]?.id || "decoracion";
  $("#product-primary-category").value = firstCategory;
  $$("#category-checks input").forEach((input) => {
    input.checked = input.value === firstCategory;
  });
  renderImages();
  renderProductsList();
}

function editProduct(id) {
  const product = catalogData.products.find((item) => item.id === id);
  if (!product) return;

  selectedProductId = product.id;
  currentImages = [...(product.images || [])];
  newImages = [];

  $("#editor-title").textContent = `Editar: ${product.title}`;
  $("#delete-product-btn").hidden = false;
  $("#product-id").value = product.id || "";
  $("#product-title").value = product.title || "";
  $("#product-description").value = product.description || "";
  $("#product-primary-category").value = product.primaryCategory || product.categories?.[0] || catalogData.categories?.[0]?.id || "decoracion";
  $("#product-keywords").value = (product.keywords || []).join(", ");
  $("#product-visible").checked = product.visible !== false;
  $("#product-featured").checked = Boolean(product.featured);
  $("#product-alt").value = product.alt || product.title || "";
  $("#product-wallapop").value = product.links?.wallapop || "";
  $("#product-vinted").value = product.links?.vinted || "";
  $("#product-cults").value = product.links?.cults || "";

  const categories = new Set(product.categories || [product.primaryCategory].filter(Boolean));
  categories.add($("#product-primary-category").value);
  $$("#category-checks input").forEach((input) => {
    input.checked = categories.has(input.value);
  });

  renderImages();
  renderProductsList();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderImages() {
  const currentHost = $("#current-images");
  const newHost = $("#new-images");
  if (!currentHost || !newHost) return;

  currentHost.innerHTML = currentImages
    .map(
      (src, index) => `
      <div class="image-preview">
        <img src="../${src.replace(/^\.\.\//, "")}" alt="Imagen actual ${index + 1}" />
        <button type="button" data-remove-current="${index}" aria-label="Quitar imagen"><i class="fas fa-times"></i></button>
      </div>`,
    )
    .join("");

  newHost.innerHTML = newImages
    .map(
      (image, index) => `
      <div class="image-preview">
        <img src="${image.preview}" alt="Nueva imagen ${index + 1}" />
        <button type="button" data-remove-new="${index}" aria-label="Quitar imagen"><i class="fas fa-times"></i></button>
      </div>`,
    )
    .join("");

  $$('[data-remove-current]').forEach((button) => {
    button.addEventListener("click", () => {
      currentImages.splice(Number(button.dataset.removeCurrent), 1);
      renderImages();
    });
  });

  $$('[data-remove-new]').forEach((button) => {
    button.addEventListener("click", () => {
      newImages.splice(Number(button.dataset.removeNew), 1);
      renderImages();
    });
  });
}

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

async function optimizeImage(file, index) {
  const img = await loadImage(file);
  const maxSide = 1800;
  const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
  const width = Math.max(1, Math.round(img.width * scale));
  const height = Math.max(1, Math.round(img.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, width, height);
  URL.revokeObjectURL(img.src);

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.84));
  const contentBase64 = await blobToBase64(blob);
  const baseName = slugify(file.name.replace(/\.[^.]+$/, "")) || `foto-${index + 1}`;

  return {
    filename: `${baseName}-${Date.now()}-${index + 1}.jpg`,
    mimeType: "image/jpeg",
    contentBase64,
    preview: URL.createObjectURL(blob),
  };
}

async function processImageFiles(fileList = []) {
  const files = Array.from(fileList).filter((file) => file?.type?.startsWith("image/"));

  if (!files.length) {
    toast("Arrastra o selecciona archivos de imagen válidos.", "error");
    return;
  }

  toast(`Preparando ${files.length} ${files.length === 1 ? "imagen" : "imágenes"}...`, "warn");

  for (let i = 0; i < files.length; i += 1) {
    try {
      const optimized = await optimizeImage(files[i], newImages.length + i);
      newImages.push(optimized);
    } catch (error) {
      console.error(error);
      toast(`No se pudo preparar ${files[i].name}`, "error");
    }
  }

  renderImages();
  toast("Imágenes listas para publicar.");
}

async function handleImagesSelected(event) {
  await processImageFiles(event.target.files || []);
  event.target.value = "";
}

function initImageDropZone() {
  const dropZone = $("#image-drop-zone");
  const input = $("#product-images");
  if (!dropZone || !input) return;

  const openPicker = () => input.click();
  const setActive = (active) => dropZone.classList.toggle("is-dragover", active);

  dropZone.addEventListener("click", openPicker);
  dropZone.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openPicker();
    }
  });

  ["dragenter", "dragover"].forEach((eventName) => {
    dropZone.addEventListener(eventName, (event) => {
      event.preventDefault();
      event.stopPropagation();
      setActive(true);
    });
  });

  ["dragleave", "dragend", "drop"].forEach((eventName) => {
    dropZone.addEventListener(eventName, (event) => {
      event.preventDefault();
      event.stopPropagation();
      const related = event.relatedTarget;
      if (eventName === "drop" || !related || !dropZone.contains(related)) setActive(false);
    });
  });

  dropZone.addEventListener("drop", async (event) => {
    setActive(false);
    await processImageFiles(event.dataTransfer?.files || []);
  });
}

function buildProductFromForm() {
  const title = $("#product-title").value.trim();
  const id = $("#product-id").value || slugify(title);
  const primaryCategory = $("#product-primary-category").value;
  const categories = new Set(
    $$("#category-checks input:checked")
      .map((input) => input.value)
      .filter(Boolean),
  );
  categories.add(primaryCategory);

  return {
    id,
    title,
    description: $("#product-description").value.trim(),
    primaryCategory,
    categories: Array.from(categories),
    keywords: $("#product-keywords").value.split(",").map((item) => item.trim()).filter(Boolean),
    images: [...currentImages],
    alt: $("#product-alt").value.trim() || title,
    featured: $("#product-featured").checked,
    visible: $("#product-visible").checked,
    links: {
      wallapop: $("#product-wallapop").value.trim(),
      vinted: $("#product-vinted").value.trim(),
      cults: $("#product-cults").value.trim(),
    },
  };
}

async function saveProduct(event) {
  event.preventDefault();
  if (usingFallback) {
    toast("Configura la función de Netlify antes de publicar cambios.", "error");
    return;
  }

  const button = $("#save-product-btn");
  const original = button.innerHTML;
  const product = buildProductFromForm();

  if (!product.title) {
    toast("El título es obligatorio.", "error");
    return;
  }

  button.disabled = true;
  button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Publicando...';

  try {
    const result = await apiRequest("saveProduct", { product, newImages });
    catalogData = result.catalog;
    renderCategoryControls();
    newImages = [];
    currentImages = result.product?.images || product.images;
    selectedProductId = result.product?.id || product.id;
    $("#product-id").value = selectedProductId;
    renderProductsList();
    renderImages();
    toast("Producto publicado. Netlify desplegará la web en unos segundos.");
  } catch (error) {
    console.error(error);
    toast(error.message, "error");
  } finally {
    button.disabled = false;
    button.innerHTML = original;
  }
}

async function deleteSelectedProduct() {
  if (!selectedProductId) return;
  if (usingFallback) {
    toast("Configura la función de Netlify antes de eliminar productos.", "error");
    return;
  }
  const product = catalogData.products.find((item) => item.id === selectedProductId);
  if (!confirm(`¿Eliminar "${product?.title || selectedProductId}" del catálogo? Las imágenes antiguas pueden quedar en GitHub.`)) return;

  try {
    const result = await apiRequest("deleteProduct", { id: selectedProductId });
    catalogData = result.catalog;
    renderCategoryControls();
    resetForm();
    toast("Producto eliminado del catálogo.");
  } catch (error) {
    console.error(error);
    toast(error.message, "error");
  }
}

function initEvents() {
  $("#login-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const username = $("#admin-username").value.trim();
    const password = $("#admin-password").value;

    if (!username || !password) {
      toast("Introduce usuario y contraseña.", "error");
      return;
    }

    const submitButton = event.submitter || event.currentTarget.querySelector("button[type='submit']");
    const originalContent = submitButton?.innerHTML;

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>Validando...</span>';
    }

    try {
      await authenticateAndLoad(username, password);
      toast("Acceso verificado. Bienvenido al panel.");
    } catch (error) {
      toast(error.message || "Usuario o contraseña incorrectos.", "error");
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.innerHTML = originalContent;
      }
    }
  });

  $("#logout-btn")?.addEventListener("click", () => {
    clearPassword();
    showLogin();
  });

  $("#reload-btn")?.addEventListener("click", loadCatalog);
  $("#new-product-btn")?.addEventListener("click", resetForm);
  $("#reset-form-btn")?.addEventListener("click", resetForm);
  $("#delete-product-btn")?.addEventListener("click", deleteSelectedProduct);
  $("#admin-search")?.addEventListener("input", renderProductsList);
  $("#product-images")?.addEventListener("change", handleImagesSelected);
  initImageDropZone();
  $("#product-form")?.addEventListener("submit", saveProduct);
  $("#new-category-btn")?.addEventListener("click", resetCategoryForm);
  $("#category-form")?.addEventListener("submit", saveCategory);
  $("#delete-category-btn")?.addEventListener("click", deleteSelectedCategory);
}

window.addEventListener("DOMContentLoaded", async () => {
  initEvents();
  const savedPassword = getPassword();
  const savedUsername = getUsername();
  if (savedPassword && savedUsername) {
    try {
      await authenticateAndLoad(savedUsername, savedPassword);
    } catch {
      clearPassword();
      showLogin();
    }
  } else {
    clearPassword();
    showLogin();
  }
});
