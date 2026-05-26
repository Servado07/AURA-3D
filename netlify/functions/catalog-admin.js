const DATA_PATH = "data/productos.json";

const jsonHeaders = {
  "Content-Type": "application/json; charset=utf-8",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, x-admin-user, x-admin-password",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

function response(statusCode, body) {
  return { statusCode, headers: jsonHeaders, body: JSON.stringify(body) };
}

function requireEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Falta la variable de entorno ${name}`);
  return value;
}

function parseAdminUsers(value = "") {
  const raw = String(value || "").trim();
  if (!raw) return [];

  if (raw.startsWith("{")) {
    const parsed = JSON.parse(raw);
    return Object.entries(parsed).map(([username, password]) => ({
      username: String(username).trim(),
      password: String(password),
    })).filter((user) => user.username && user.password);
  }

  return raw
    .split(/[\n,]+/)
    .map((row) => row.trim())
    .filter(Boolean)
    .map((row) => {
      const separator = row.indexOf(":");
      if (separator === -1) return null;
      return {
        username: row.slice(0, separator).trim(),
        password: row.slice(separator + 1),
      };
    })
    .filter((user) => user?.username && user.password);
}

function getConfig() {
  const users = parseAdminUsers(process.env.ADMIN_USERS || "");
  const password = process.env.ADMIN_PASSWORD || "";

  if (!users.length && !password) {
    throw new Error("Falta la variable de entorno ADMIN_PASSWORD o ADMIN_USERS");
  }

  return {
    token: requireEnv("GITHUB_TOKEN"),
    owner: requireEnv("GITHUB_OWNER"),
    repo: requireEnv("GITHUB_REPO"),
    branch: process.env.GITHUB_BRANCH || "main",
    password,
    users,
  };
}

function getHeader(event, name) {
  const lower = name.toLowerCase();
  return event.headers?.[name] || event.headers?.[lower] || "";
}

function assertAuth(event, config) {
  const providedUser = getHeader(event, "x-admin-user").trim();
  const providedPassword = getHeader(event, "x-admin-password");

  if (config.users.length) {
    const validUser = config.users.find((user) =>
      user.username.toLowerCase() === providedUser.toLowerCase() && user.password === providedPassword,
    );

    if (!providedUser || !providedPassword || !validUser) {
      const error = new Error("Usuario o contraseña incorrectos.");
      error.statusCode = 401;
      throw error;
    }
    return;
  }

  if (!providedPassword || providedPassword !== config.password) {
    const error = new Error("Contraseña incorrecta o no enviada.");
    error.statusCode = 401;
    throw error;
  }
}

function toBase64Utf8(value) {
  return Buffer.from(value, "utf8").toString("base64");
}

function fromBase64Utf8(value) {
  return Buffer.from(value || "", "base64").toString("utf8");
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

function cleanFilename(value = "foto.jpg") {
  const parts = value.split(".");
  const ext = parts.length > 1 ? parts.pop().toLowerCase().replace(/[^a-z0-9]/g, "") : "jpg";
  const base = slugify(parts.join(".")) || "foto";
  return `${base}.${ext || "jpg"}`;
}

async function githubRequest(config, path, options = {}) {
  const url = `https://api.github.com/repos/${config.owner}/${config.repo}${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${config.token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const error = new Error(data?.message || `GitHub respondió con ${response.status}`);
    error.statusCode = response.status;
    error.github = data;
    throw error;
  }

  return data;
}

async function getFile(config, path) {
  return githubRequest(config, `/contents/${encodeURIComponent(path).replace(/%2F/g, "/")}?ref=${encodeURIComponent(config.branch)}`);
}

async function getOptionalFile(config, path) {
  try {
    return await getFile(config, path);
  } catch (error) {
    if (error.statusCode === 404) return null;
    throw error;
  }
}

async function putFile(config, path, contentBase64, message, sha) {
  const body = {
    message,
    content: contentBase64,
    branch: config.branch,
  };
  if (sha) body.sha = sha;

  return githubRequest(config, `/contents/${encodeURIComponent(path).replace(/%2F/g, "/")}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

async function readCatalog(config) {
  const file = await getFile(config, DATA_PATH);
  const catalog = JSON.parse(fromBase64Utf8(file.content));
  catalog.products ||= [];
  catalog.categories ||= [];
  return { catalog, sha: file.sha };
}

async function writeCatalog(config, catalog, sha, message) {
  catalog.version = catalog.version || 1;
  catalog.updatedAt = new Date().toISOString();
  const content = JSON.stringify(catalog, null, 2);
  await putFile(config, DATA_PATH, toBase64Utf8(content), message, sha);
}

function normalizeProduct(product) {
  const title = (product.title || "").trim();
  const id = slugify(product.id || title);
  const primaryCategory = product.primaryCategory || product.categories?.[0] || "decoracion";
  const categories = Array.from(new Set([...(product.categories || []), primaryCategory].filter(Boolean)));

  return {
    id,
    title,
    description: (product.description || "").trim(),
    primaryCategory,
    categories,
    keywords: Array.isArray(product.keywords) ? product.keywords.map((item) => String(item).trim()).filter(Boolean) : [],
    images: Array.isArray(product.images) ? product.images.filter(Boolean) : [],
    alt: (product.alt || title).trim(),
    featured: Boolean(product.featured),
    visible: product.visible !== false,
    links: {
      wallapop: product.links?.wallapop || "",
      vinted: product.links?.vinted || "",
      cults: product.links?.cults || "",
    },
  };
}

function normalizeCategory(category = {}) {
  const name = String(category.name || "").trim();
  const id = slugify(category.id || name);
  const icon = String(category.icon || "fa-star")
    .trim()
    .replace(/[^a-z0-9-]/gi, "") || "fa-star";

  return { id, name, icon };
}

function updateProductsCategoryReferences(products = [], oldId, newId) {
  if (!oldId || oldId === newId) return products;

  return products.map((product) => {
    const categories = new Set((product.categories || []).map((id) => (id === oldId ? newId : id)).filter(Boolean));
    if (product.primaryCategory === oldId) product.primaryCategory = newId;
    if (product.primaryCategory) categories.add(product.primaryCategory);
    product.categories = Array.from(categories);
    return product;
  });
}

async function saveCategory(config, payload) {
  const { catalog, sha } = await readCatalog(config);
  const category = normalizeCategory(payload.category || {});
  const originalId = slugify(payload.originalId || category.id || "");

  if (!category.name) {
    const error = new Error("La sección necesita nombre.");
    error.statusCode = 400;
    throw error;
  }

  catalog.categories ||= [];
  catalog.products ||= [];

  const conflict = catalog.categories.find((item) => item.id === category.id && item.id !== originalId);
  if (conflict) {
    const error = new Error("Ya existe una sección con ese identificador.");
    error.statusCode = 409;
    throw error;
  }

  const index = catalog.categories.findIndex((item) => item.id === originalId || item.id === category.id);
  if (index >= 0) catalog.categories[index] = category;
  else catalog.categories.push(category);

  catalog.products = updateProductsCategoryReferences(catalog.products, originalId, category.id);

  await writeCatalog(config, catalog, sha, `Actualizar sección: ${category.name}`);
  return { catalog, category };
}

async function deleteCategory(config, payload) {
  const id = slugify(payload.id || "");
  if (!id) {
    const error = new Error("Falta el ID de la sección.");
    error.statusCode = 400;
    throw error;
  }

  const { catalog, sha } = await readCatalog(config);
  catalog.categories ||= [];
  catalog.products ||= [];

  const category = catalog.categories.find((item) => item.id === id);
  if (!category) {
    const error = new Error("La sección no existe.");
    error.statusCode = 404;
    throw error;
  }

  if (catalog.categories.length <= 1) {
    const error = new Error("No puedes eliminar la única sección del catálogo.");
    error.statusCode = 400;
    throw error;
  }

  const remainingCategories = catalog.categories.filter((item) => item.id !== id);
  const fallbackId = remainingCategories[0]?.id;

  catalog.categories = remainingCategories;
  catalog.products = catalog.products.map((product) => {
    const categories = new Set((product.categories || []).filter((categoryId) => categoryId && categoryId !== id));

    if (product.primaryCategory === id || !product.primaryCategory) {
      product.primaryCategory = categories.values().next().value || fallbackId;
    }

    if (product.primaryCategory) categories.add(product.primaryCategory);
    product.categories = Array.from(categories);
    return product;
  });

  await writeCatalog(config, catalog, sha, `Eliminar sección: ${category.name}`);
  return { catalog };
}

async function uploadImages(config, product, newImages = []) {
  const uploadedPaths = [];
  const folder = `assets/images/productos/${product.id}`;

  for (let index = 0; index < newImages.length; index += 1) {
    const image = newImages[index];
    if (!image?.contentBase64) continue;

    const filename = cleanFilename(image.filename || `foto-${index + 1}.jpg`);
    const path = `${folder}/${filename}`;
    const existing = await getOptionalFile(config, path);

    await putFile(
      config,
      path,
      image.contentBase64,
      `Subir imagen ${filename} de ${product.title}`,
      existing?.sha,
    );
    uploadedPaths.push(path);
  }

  return uploadedPaths;
}

async function saveProduct(config, payload) {
  const { catalog, sha } = await readCatalog(config);
  const product = normalizeProduct(payload.product || {});

  if (!product.title) {
    const error = new Error("El producto necesita título.");
    error.statusCode = 400;
    throw error;
  }

  const uploadedImages = await uploadImages(config, product, payload.newImages || []);
  product.images = [...product.images, ...uploadedImages];

  const index = catalog.products.findIndex((item) => item.id === product.id);
  if (index >= 0) catalog.products[index] = product;
  else catalog.products.push(product);

  await writeCatalog(config, catalog, sha, `Actualizar catálogo: ${product.title}`);
  return { catalog, product };
}

async function deleteProduct(config, payload) {
  const id = slugify(payload.id || "");
  if (!id) {
    const error = new Error("Falta el ID del producto.");
    error.statusCode = 400;
    throw error;
  }

  const { catalog, sha } = await readCatalog(config);
  catalog.products = catalog.products.filter((product) => product.id !== id);
  await writeCatalog(config, catalog, sha, `Eliminar producto del catálogo: ${id}`);
  return { catalog };
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers: jsonHeaders, body: "" };

  try {
    const config = getConfig();
    assertAuth(event, config);

    if (event.httpMethod === "GET") {
      const { catalog } = await readCatalog(config);
      return response(200, { catalog });
    }

    if (event.httpMethod !== "POST") return response(405, { error: "Método no permitido." });

    const payload = JSON.parse(event.body || "{}");
    const action = payload.action || event.queryStringParameters?.action;

    if (action === "saveProduct") {
      const result = await saveProduct(config, payload);
      return response(200, result);
    }

    if (action === "deleteProduct") {
      const result = await deleteProduct(config, payload);
      return response(200, result);
    }

    if (action === "saveCategory") {
      const result = await saveCategory(config, payload);
      return response(200, result);
    }

    if (action === "deleteCategory") {
      const result = await deleteCategory(config, payload);
      return response(200, result);
    }

    if (action === "list") {
      const { catalog } = await readCatalog(config);
      return response(200, { catalog });
    }

    return response(400, { error: "Acción no reconocida." });
  } catch (error) {
    console.error(error);
    return response(error.statusCode || 500, {
      error: error.message || "Error interno del panel.",
      details: error.github || undefined,
    });
  }
};
