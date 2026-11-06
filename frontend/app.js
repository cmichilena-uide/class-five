const API_URL = "http://localhost:8000";
const URL_STORE = API_URL + "/productos/";
const URL_LOGIN = API_URL + "/auth/login";
const URL_REGISTER = API_URL + "/auth/register";

const TOKEN_KEY = "token";
const USERNAME_KEY = "username";

const formatPrice = (price) => "$" + price.toFixed(2);
const stockText = (product) =>
  "Stock: " + product.stock + " | ID: " + product.id;

const productUrl = (id) => URL_STORE + id;

const savedMessage = (editing, product) =>
  editing
    ? "Producto con ID " + product.id + " actualizado"
    : "Producto guardado con ID " + product.id;
const formTitle = (editingId) =>
  editingId === null
    ? "Agregar producto"
    : "Editar producto (ID " + editingId + ")";
const saveButtonText = (editingId) =>
  editingId === null ? "Guardar" : "Actualizar";

const isValidImageUrl = (text) =>
  text === "" || text.startsWith("http://") || text.startsWith("https://");

const RULES = Object.freeze([
  {
    fails: (d) => d.name === "" || d.description === "",
    message: "Complete el nombre y la descripción",
  },
  {
    fails: (d) => isNaN(d.price) || d.price <= 0,
    message: "El precio debe ser un número mayor a 0",
  },
  {
    fails: (d) => !Number.isInteger(d.stock) || d.stock < 0,
    message: "El stock debe ser un número entero positivo",
  },
  {
    fails: (d) => !isValidImageUrl(d.image),
    message: "La imagen debe ser una URL que empiece con http:// o https://",
  },
]);
const firstError = (data) =>
  RULES.find((rule) => rule.fails(data))?.message ?? null;

const productBody = (data) => ({
  nombre: data.name,
  descripcion: data.description,
  precio: data.price,
  stock: data.stock,
  imagen: data.image === "" ? null : data.image,
});

const readStorage = (key) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};
const writeStorage = (key, value) => {
  try {
    if (value === null) {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, value);
    }
  } catch {}
};

const INITIAL_STATE = Object.freeze({
  editingId: null,
  token: readStorage(TOKEN_KEY),
  username: readStorage(USERNAME_KEY),
});

const withEditing = (editingId) => (state) => ({ ...state, editingId });
const withSession = (token, username) => (state) => ({
  ...state,
  token,
  username,
});

const createState = (initial) => {
  const cell = { current: Object.freeze(initial) };
  return Object.freeze({
    read: () => cell.current,
    update: (transition) => {
      cell.current = Object.freeze(transition(cell.current));
    },
  });
};

const state = createState(INITIAL_STATE);

class SessionExpiredError extends Error {}

const ERROR_MESSAGES = Object.freeze({
  400: "Solicitud inválida",
  401: "Sesión expirada, inicie sesión nuevamente",
  404: "Producto no encontrado",
  409: "El usuario o el email ya están registrados",
  422: "Datos inválidos",
});

const responseError = (response) =>
  response.status === 401
    ? new SessionExpiredError(ERROR_MESSAGES[401])
    : new Error(ERROR_MESSAGES[response.status] ?? "Error en el servidor");
const readJson = (response) =>
  response.ok ? response.json() : Promise.reject(responseError(response));

const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: "Bearer " + state.read().token,
});

const apiFetch = (url, options = {}) =>
  fetch(url, { ...options, headers: authHeaders() }).then(readJson);

const fetchProducts = () => apiFetch(URL_STORE);
const fetchProduct = (id) => apiFetch(productUrl(id));
const removeProduct = (id) => apiFetch(productUrl(id), { method: "DELETE" });
const saveProduct = (editingId, data) =>
  apiFetch(editingId === null ? URL_STORE : productUrl(editingId), {
    method: editingId === null ? "POST" : "PUT",
    body: JSON.stringify(productBody(data)),
  });

const loginRequest = (username, password) =>
  fetch(URL_LOGIN, {
    method: "POST",
    body: new URLSearchParams({ username, password }),
  }).then((response) =>
    response.ok
      ? response.json()
      : Promise.reject(new Error("Usuario o contraseña incorrectos")),
  );

const registerRequest = (data) =>
  fetch(URL_REGISTER, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }).then(readJson);

const createElement = (tag, properties = {}, children = []) => {
  const element = Object.assign(document.createElement(tag), properties);
  element.append(...children);
  return element;
};

const createButton = (className, textContent, onclick) =>
  createElement("button", { type: "button", className, textContent, onclick });

const createNoImage = () =>
  createElement("div", { className: "no_image", textContent: "Sin imagen" });

const createImage = (product) =>
  createElement("img", {
    className: "product_image",
    alt: product.nombre,
    onerror: (event) => event.target.replaceWith(createNoImage()),
    src: product.imagen,
  });

const createPicture = (product) =>
  product.imagen ? createImage(product) : createNoImage();

const createCard = (actions) => (product) =>
  createElement("div", { className: "product_card" }, [
    createPicture(product),
    createElement("h3", { textContent: product.nombre }),
    createElement("p", { textContent: product.descripcion }),
    createElement("p", {
      className: "price",
      textContent: formatPrice(product.precio),
    }),
    createElement("p", { textContent: stockText(product) }),
    createElement("div", { className: "actions" }, [
      createButton("edit_button", "Editar", () => actions.onEdit(product)),
      createButton("delete_button", "Eliminar", () =>
        actions.onDelete(product.id),
      ),
    ]),
  ]);

const dom = Object.freeze({
  products: document.getElementById("products"),
  searchResult: document.getElementById("search_result"),
  formMessage: document.getElementById("form_message"),
  searchMessage: document.getElementById("search_message"),
  loginMessage: document.getElementById("login_message"),
  registerMessage: document.getElementById("register_message"),
  productForm: document.getElementById("product_form"),
  searchForm: document.getElementById("search_form"),
  loginForm: document.getElementById("login_form"),
  registerForm: document.getElementById("register_form"),
  authSection: document.getElementById("auth_section"),
  adminSection: document.getElementById("admin_section"),
  userInfo: document.getElementById("user_info"),
  userName: document.getElementById("user_name"),
  logoutButton: document.getElementById("logout_button"),
  formTitle: document.getElementById("add"),
  saveButton: document.getElementById("save_button"),
  cancelButton: document.getElementById("cancel_button"),
  name: document.getElementById("name"),
  description: document.getElementById("description"),
  price: document.getElementById("price"),
  stock: document.getElementById("stock"),
  image: document.getElementById("image"),
  searchId: document.getElementById("search_id"),
  loginUsername: document.getElementById("login_username"),
  loginPassword: document.getElementById("login_password"),
  registerUsername: document.getElementById("register_username"),
  registerEmail: document.getElementById("register_email"),
  registerPassword: document.getElementById("register_password"),
});

const showMessage = (element, text, color) => {
  element.textContent = text;
  element.style.color = color;
};
const clearMessage = (element) => showMessage(element, "", "black");

const renderCatalog = (products, actions) =>
  products.length === 0
    ? dom.products.replaceChildren("No tienes productos todavía.")
    : dom.products.replaceChildren(...products.map(createCard(actions)));

const renderForm = (editingId) => {
  dom.formTitle.textContent = formTitle(editingId);
  dom.saveButton.textContent = saveButtonText(editingId);
  dom.cancelButton.hidden = editingId === null;
};

const renderSession = () => {
  const { token, username } = state.read();
  const loggedIn = token !== null;
  dom.authSection.hidden = loggedIn;
  dom.adminSection.hidden = !loggedIn;
  dom.userInfo.hidden = !loggedIn;
  dom.userName.textContent = loggedIn ? "Hola, " + username : "";
};

const fillForm = (product) => {
  dom.name.value = product.nombre;
  dom.description.value = product.descripcion;
  dom.price.value = String(product.precio);
  dom.stock.value = String(product.stock);
  dom.image.value = product.imagen ?? "";
};

const readForm = () => ({
  name: dom.name.value.trim(),
  description: dom.description.value.trim(),
  price: Number(dom.price.value),
  stock: Number(dom.stock.value),
  image: dom.image.value.trim(),
});

const saveSession = (token, username) => {
  writeStorage(TOKEN_KEY, token);
  writeStorage(USERNAME_KEY, username);
  state.update(withSession(token, username));
};

const logout = (message) => {
  saveSession(null, null);
  exitEditing();
  dom.searchResult.replaceChildren();
  clearMessage(dom.formMessage);
  clearMessage(dom.searchMessage);
  renderSession();
  dom.products.replaceChildren(message);
};

const handleError = (element) => (error) =>
  error instanceof SessionExpiredError
    ? logout(error.message)
    : showMessage(element, error.message, "red");

const loadProducts = async () =>
  state.read().token === null
    ? dom.products.replaceChildren("Inicie sesión para ver los productos.")
    : fetchProducts()
        .then((products) => renderCatalog(products, actions))
        .catch((error) =>
          error instanceof SessionExpiredError
            ? logout(error.message)
            : dom.products.replaceChildren("No se pudo conectar con la API."),
        );

const exitEditing = () => {
  state.update(withEditing(null));
  dom.productForm.reset();
  renderForm(null);
};

const cancelEditing = () => {
  exitEditing();
  clearMessage(dom.formMessage);
};

const editProduct = (product) => {
  state.update(withEditing(product.id));
  fillForm(product);
  renderForm(product.id);
  clearMessage(dom.formMessage);
  dom.formTitle.scrollIntoView();
};

const deleteProduct = (id) =>
  confirm("¿Seguro que desea eliminar este producto?")
    ? removeProduct(id)
        .then(() => {
          if (state.read().editingId === id) {
            exitEditing();
          }
          dom.searchResult.replaceChildren();
          return loadProducts();
        })
        .catch(handleError(dom.formMessage))
    : Promise.resolve();

const actions = Object.freeze({ onEdit: editProduct, onDelete: deleteProduct });

const onSaved = (editingId) => (product) => {
  showMessage(
    dom.formMessage,
    savedMessage(editingId !== null, product),
    "green",
  );
  if (editingId !== null) {
    dom.searchResult.replaceChildren();
  }
  exitEditing();
  return loadProducts();
};

const submitForm = (event) => {
  event.preventDefault();
  const data = readForm();
  const error = firstError(data);
  if (error !== null) {
    showMessage(dom.formMessage, error, "red");
    return Promise.resolve();
  }
  const { editingId } = state.read();
  return saveProduct(editingId, data)
    .then(onSaved(editingId))
    .catch(handleError(dom.formMessage));
};

const searchProduct = async (event) => {
  event.preventDefault();
  dom.searchResult.replaceChildren();
  clearMessage(dom.searchMessage);
  return fetchProduct(dom.searchId.value)
    .then((product) =>
      dom.searchResult.replaceChildren(createCard(actions)(product)),
    )
    .catch(handleError(dom.searchMessage));
};

const submitLogin = async (event) => {
  event.preventDefault();
  clearMessage(dom.loginMessage);
  const username = dom.loginUsername.value.trim();
  return loginRequest(username, dom.loginPassword.value)
    .then((data) => {
      saveSession(data.access_token, username);
      dom.loginForm.reset();
      renderSession();
      return loadProducts();
    })
    .catch((e) => showMessage(dom.loginMessage, e.message, "red"));
};

const submitRegister = async (event) => {
  event.preventDefault();
  clearMessage(dom.registerMessage);
  const data = {
    username: dom.registerUsername.value.trim(),
    email: dom.registerEmail.value.trim(),
    password: dom.registerPassword.value,
  };
  if (data.password.length < 8) {
    showMessage(
      dom.registerMessage,
      "La contraseña debe tener al menos 8 caracteres",
      "red",
    );
    return;
  }
  return registerRequest(data)
    .then((user) => {
      dom.registerForm.reset();
      dom.loginUsername.value = user.username;
      showMessage(
        dom.registerMessage,
        "Usuario " + user.username + " registrado, ahora inicie sesión",
        "green",
      );
    })
    .catch((e) => showMessage(dom.registerMessage, e.message, "red"));
};

const init = () => {
  dom.productForm.addEventListener("submit", submitForm);
  dom.searchForm.addEventListener("submit", searchProduct);
  dom.cancelButton.addEventListener("click", cancelEditing);
  dom.loginForm.addEventListener("submit", submitLogin);
  dom.registerForm.addEventListener("submit", submitRegister);
  dom.logoutButton.addEventListener("click", () =>
    logout("Sesión cerrada. Inicie sesión para ver los productos."),
  );
  renderSession();
  return loadProducts();
};

init();
