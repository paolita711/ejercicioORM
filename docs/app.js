const API_BASE = 'https://api-productos-1hdu.onrender.com/api';
const SESSION_KEY = 'productos-panel-session';
const PAGE_SIZE = 9;

const state = {
  token: '',
  user: null,
  products: [],
  visible: [],
  page: 1,
  search: '',
  category: '',
  sort: 'id-desc',
  editingId: null
};

const el = {
  apiStatus: document.getElementById('apiStatus'),
  authView: document.getElementById('authView'),
  appView: document.getElementById('appView'),
  userChip: document.getElementById('userChip'),
  logoutBtn: document.getElementById('logoutBtn'),
  tabLogin: document.getElementById('tabLogin'),
  tabRegister: document.getElementById('tabRegister'),
  loginForm: document.getElementById('loginForm'),
  registerForm: document.getElementById('registerForm'),
  loginEmail: document.getElementById('loginEmail'),
  loginPassword: document.getElementById('loginPassword'),
  regNombre: document.getElementById('regNombre'),
  regEmail: document.getElementById('regEmail'),
  regPassword: document.getElementById('regPassword'),
  regRol: document.getElementById('regRol'),
  authError: document.getElementById('authError'),
  registerError: document.getElementById('registerError'),
  loginSubmit: document.getElementById('loginSubmit'),
  registerSubmit: document.getElementById('registerSubmit'),
  newBtn: document.getElementById('newBtn'),
  refreshBtn: document.getElementById('refreshBtn'),
  searchInput: document.getElementById('searchInput'),
  categoryFilter: document.getElementById('categoryFilter'),
  sortSelect: document.getElementById('sortSelect'),
  listMeta: document.getElementById('listMeta'),
  productGrid: document.getElementById('productGrid'),
  emptyState: document.getElementById('emptyState'),
  pagination: document.getElementById('pagination'),
  modalBackdrop: document.getElementById('modalBackdrop'),
  modalTitle: document.getElementById('modalTitle'),
  closeModalBtn: document.getElementById('closeModalBtn'),
  cancelModalBtn: document.getElementById('cancelModalBtn'),
  productForm: document.getElementById('productForm'),
  pNombre: document.getElementById('pNombre'),
  pDescripcion: document.getElementById('pDescripcion'),
  pPrecio: document.getElementById('pPrecio'),
  pStock: document.getElementById('pStock'),
  pCategoria: document.getElementById('pCategoria'),
  pActivo: document.getElementById('pActivo'),
  formError: document.getElementById('formError'),
  saveBtn: document.getElementById('saveBtn'),
  toast: document.getElementById('toast')
};

const escapeMap = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => escapeMap[char]);

const money = new Intl.NumberFormat('es-EC', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2
});

function parseJwt(token) {
  try {
    const part = token.split('.')[1];
    const normalized = part.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
}

function readSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function persistSession() {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ token: state.token, user: state.user }));
}

function clearSession() {
  state.token = '';
  state.user = null;
  localStorage.removeItem(SESSION_KEY);
}

function currentRole() {
  if (state.user && state.user.rol) return state.user.rol;
  const payload = state.token ? parseJwt(state.token) : null;
  return payload && payload.rol ? payload.rol : '';
}

function canWrite() {
  return ['admin', 'editor'].includes(currentRole());
}

function canDelete() {
  return currentRole() === 'admin';
}

async function api(path, options = {}) {
  const headers = { Accept: 'application/json', ...(options.headers || {}) };
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';
  if (state.token) headers.Authorization = `Bearer ${state.token}`;

  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method: options.method || 'GET',
      headers,
      body: options.body
    });
  } catch {
    throw new Error('No se pudo conectar con la API. Revisa tu conexión e inténtalo de nuevo.');
  }

  const text = await response.text();
  let payload = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = null;
    }
  }

  if (!response.ok) {
    if (response.status === 401 && !path.startsWith('/auth/')) {
      clearSession();
      syncSessionUI();
    }
    const error = new Error(payload && payload.message ? payload.message : `Error ${response.status} en la solicitud`);
    error.status = response.status;
    error.details = payload && Array.isArray(payload.errors) ? payload.errors : [];
    throw error;
  }

  return payload;
}

function showError(container, error) {
  const lines = [error.message || 'Ocurrió un error'];
  if (error.details && error.details.length > 0) {
    error.details.forEach((detail) => {
      lines.push(`${detail.field || 'Campo'}: ${detail.message}`);
    });
  }
  container.innerHTML = lines.map((line) => escapeHtml(line)).join('<br>');
  container.hidden = false;
}

function clearError(container) {
  container.hidden = true;
  container.innerHTML = '';
}

let toastTimer = null;
function showToast(message, isError = false) {
  clearTimeout(toastTimer);
  el.toast.textContent = message;
  el.toast.className = `toast${isError ? ' toast-error' : ''}`;
  el.toast.hidden = false;
  toastTimer = setTimeout(() => {
    el.toast.hidden = true;
  }, 3600);
}

function setBusy(button, busy, label) {
  if (busy) {
    if (!button.dataset.original) button.dataset.original = button.textContent;
    button.disabled = true;
    button.textContent = label;
  } else {
    button.disabled = false;
    button.textContent = button.dataset.original || label;
  }
}

async function checkApi() {
  try {
    const response = await fetch(`${API_BASE}/health`, { cache: 'no-store' });
    const payload = await response.json().catch(() => null);
    const online = response.ok && payload && payload.success;
    el.apiStatus.textContent = online ? 'API: online' : 'API: sin respuesta';
    el.apiStatus.className = `status-badge ${online ? 'status-ok' : 'status-error'}`;
  } catch {
    el.apiStatus.textContent = 'API: sin conexión';
    el.apiStatus.className = 'status-badge status-error';
  }
}

function syncSessionUI() {
  const loggedIn = Boolean(state.token);
  el.authView.hidden = loggedIn;
  el.appView.hidden = !loggedIn;
  el.logoutBtn.hidden = !loggedIn;
  el.userChip.hidden = !loggedIn;
  el.newBtn.hidden = !canWrite();

  if (loggedIn) {
    const nombre = state.user && state.user.nombre ? state.user.nombre : 'Usuario';
    el.userChip.textContent = `${nombre} · ${currentRole() || 'sin rol'}`;
  }
}

function switchTab(tab) {
  const isLogin = tab === 'login';
  el.tabLogin.classList.toggle('tab-active', isLogin);
  el.tabRegister.classList.toggle('tab-active', !isLogin);
  el.tabLogin.setAttribute('aria-selected', String(isLogin));
  el.tabRegister.setAttribute('aria-selected', String(!isLogin));
  el.loginForm.hidden = !isLogin;
  el.registerForm.hidden = isLogin;
  clearError(el.authError);
  clearError(el.registerError);
}

function logout(notify = true) {
  clearSession();
  state.products = [];
  state.visible = [];
  state.page = 1;
  syncSessionUI();
  if (notify) showToast('Sesión cerrada correctamente');
}

async function loadProducts() {
  setBusy(el.refreshBtn, true, 'Cargando…');
  try {
    const first = await api('/Productos?page=1&limit=100');
    const totalPages = first.pagination && first.pagination.totalPages ? first.pagination.totalPages : 1;
    const products = Array.isArray(first.data) ? [...first.data] : [];

    for (let page = 2; page <= totalPages; page += 1) {
      const next = await api(`/Productos?page=${page}&limit=100`);
      if (Array.isArray(next.data)) products.push(...next.data);
    }

    state.products = products;
    buildCategoryFilter();
    applyFilters();
  } catch (error) {
    showToast(error.message, true);
  } finally {
    setBusy(el.refreshBtn, false, 'Actualizar');
  }
}

function buildCategoryFilter() {
  const categories = [...new Set(state.products.map((product) => product.categoria).filter(Boolean))]
    .sort((a, b) => String(a).localeCompare(String(b), 'es'));

  el.categoryFilter.innerHTML =
    '<option value="">Todas las categorías</option>' +
    categories.map((category) => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`).join('');

  if (state.category && categories.includes(state.category)) {
    el.categoryFilter.value = state.category;
  } else {
    state.category = '';
    el.categoryFilter.value = '';
  }
}

function applyFilters() {
  const query = state.search.trim().toLocaleLowerCase('es');
  let list = state.products.filter((product) => {
    const matchesText =
      !query ||
      String(product.nombre || '').toLocaleLowerCase('es').includes(query) ||
      String(product.categoria || '').toLocaleLowerCase('es').includes(query);
    const matchesCategory = !state.category || product.categoria === state.category;
    return matchesText && matchesCategory;
  });

  const sorters = {
    'id-desc': (a, b) => b.id - a.id,
    'id-asc': (a, b) => a.id - b.id,
    'nombre-asc': (a, b) => String(a.nombre).localeCompare(String(b.nombre), 'es'),
    'precio-asc': (a, b) => Number(a.precio) - Number(b.precio),
    'precio-desc': (a, b) => Number(b.precio) - Number(a.precio),
    'stock-asc': (a, b) => Number(a.stock) - Number(b.stock)
  };

  list = [...list].sort(sorters[state.sort] || sorters['id-desc']);
  state.visible = list;

  const totalPages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
  state.page = Math.min(Math.max(1, state.page), totalPages);
  renderProducts(totalPages);
}

function cardHtml(product) {
  const activo = product.activo !== false;
  const editButton = canWrite()
    ? `<button class="btn btn-secondary btn-small" type="button" data-action="edit" data-id="${product.id}">Editar</button>`
    : '';
  const deleteButton = canDelete()
    ? `<button class="btn btn-danger btn-small" type="button" data-action="delete" data-id="${product.id}">Eliminar</button>`
    : '';

  return `
    <article class="product-card">
      <div class="card-top">
        <h3>${escapeHtml(product.nombre)}</h3>
        <span class="badge badge-category">${escapeHtml(product.categoria || 'Sin categoría')}</span>
      </div>
      <p class="card-description">${escapeHtml(product.descripcion || 'Sin descripción')}</p>
      <div class="card-price">${money.format(Number(product.precio) || 0)}</div>
      <div class="card-stock">
        <span class="badge ${activo ? 'badge-active' : 'badge-inactive'}">${activo ? 'Activo' : 'Inactivo'}</span>
        · Stock: ${Number(product.stock) || 0}
      </div>
      <div class="card-footer">
        <span class="card-id">#${product.id}</span>
        <div class="card-actions">${editButton}${deleteButton}</div>
      </div>
    </article>`;
}

function renderProducts(totalPages) {
  const start = (state.page - 1) * PAGE_SIZE;
  const end = start + PAGE_SIZE;
  const pageItems = state.visible.slice(start, end);

  el.productGrid.innerHTML = pageItems.map(cardHtml).join('');
  el.emptyState.hidden = state.visible.length > 0;

  if (state.visible.length === 0) {
    el.listMeta.textContent = `0 productos · ${state.products.length} en el catálogo`;
  } else {
    el.listMeta.textContent = `Mostrando ${start + 1}–${Math.min(end, state.visible.length)} de ${state.visible.length} · ${state.products.length} en el catálogo`;
  }

  renderPagination(totalPages);
}

function renderPagination(totalPages) {
  if (totalPages <= 1) {
    el.pagination.innerHTML = '';
    return;
  }

  let html = `<button class="page-btn" type="button" data-page="${state.page - 1}" ${state.page === 1 ? 'disabled' : ''} aria-label="Anterior">‹</button>`;
  for (let page = 1; page <= totalPages; page += 1) {
    html += `<button class="page-btn ${page === state.page ? 'page-btn-active' : ''}" type="button" data-page="${page}" ${page === state.page ? 'aria-current="page"' : ''}>${page}</button>`;
  }
  html += `<button class="page-btn" type="button" data-page="${state.page + 1}" ${state.page === totalPages ? 'disabled' : ''} aria-label="Siguiente">›</button>`;
  el.pagination.innerHTML = html;
}

function openModal(product) {
  state.editingId = product ? product.id : null;
  el.modalTitle.textContent = product ? 'Editar producto' : 'Nuevo producto';
  el.saveBtn.textContent = product ? 'Guardar cambios' : 'Crear producto';
  el.saveBtn.dataset.original = el.saveBtn.textContent;
  el.pNombre.value = product ? product.nombre : '';
  el.pDescripcion.value = product && product.descripcion ? product.descripcion : '';
  el.pPrecio.value = product ? Number(product.precio).toFixed(2) : '';
  el.pStock.value = product ? Number(product.stock) : '';
  el.pCategoria.value = product && product.categoria ? product.categoria : '';
  el.pActivo.checked = product ? product.activo !== false : true;
  clearError(el.formError);
  el.modalBackdrop.hidden = false;
  setTimeout(() => el.pNombre.focus(), 0);
}

function closeModal() {
  el.modalBackdrop.hidden = true;
  el.productForm.reset();
  state.editingId = null;
  clearError(el.formError);
}

el.tabLogin.addEventListener('click', () => switchTab('login'));
el.tabRegister.addEventListener('click', () => switchTab('register'));
el.logoutBtn.addEventListener('click', () => logout());

el.loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  clearError(el.authError);
  setBusy(el.loginSubmit, true, 'Entrando…');

  try {
    const payload = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: el.loginEmail.value.trim(),
        password: el.loginPassword.value
      })
    });
    state.token = payload.data.token;
    state.user = payload.data.usuario;
    persistSession();
    el.loginForm.reset();
    syncSessionUI();
    showToast(`Hola, ${state.user && state.user.nombre ? state.user.nombre : 'usuario'}`);
    await loadProducts();
  } catch (error) {
    showError(el.authError, error);
  } finally {
    setBusy(el.loginSubmit, false, 'Entrar');
  }
});

el.registerForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  clearError(el.registerError);
  setBusy(el.registerSubmit, true, 'Creando…');

  try {
    await api('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        nombre: el.regNombre.value.trim(),
        email: el.regEmail.value.trim(),
        password: el.regPassword.value,
        rol: el.regRol.value
      })
    });
    const email = el.regEmail.value.trim();
    el.registerForm.reset();
    switchTab('login');
    el.loginEmail.value = email;
    showToast('Cuenta creada. Inicia sesión para continuar.');
  } catch (error) {
    showError(el.registerError, error);
  } finally {
    setBusy(el.registerSubmit, false, 'Crear cuenta');
  }
});

el.refreshBtn.addEventListener('click', loadProducts);
el.newBtn.addEventListener('click', () => openModal());
el.closeModalBtn.addEventListener('click', closeModal);
el.cancelModalBtn.addEventListener('click', closeModal);
el.modalBackdrop.addEventListener('click', (event) => {
  if (event.target === el.modalBackdrop) closeModal();
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !el.modalBackdrop.hidden) closeModal();
});

let searchTimer = null;
el.searchInput.addEventListener('input', () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    state.search = el.searchInput.value;
    state.page = 1;
    applyFilters();
  }, 160);
});

el.categoryFilter.addEventListener('change', () => {
  state.category = el.categoryFilter.value;
  state.page = 1;
  applyFilters();
});

el.sortSelect.addEventListener('change', () => {
  state.sort = el.sortSelect.value;
  state.page = 1;
  applyFilters();
});

el.pagination.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-page]');
  if (!button || button.disabled) return;
  state.page = Number(button.dataset.page);
  renderProducts(Math.max(1, Math.ceil(state.visible.length / PAGE_SIZE)));
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

el.productGrid.addEventListener('click', async (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button) return;

  const id = Number(button.dataset.id);
  const product = state.products.find((item) => item.id === id);
  if (!product) return;

  if (button.dataset.action === 'edit') {
    openModal(product);
    return;
  }

  if (button.dataset.action === 'delete') {
    if (!window.confirm(`¿Eliminar "${product.nombre}"? Esta acción no se puede deshacer.`)) return;
    button.disabled = true;
    try {
      await api(`/Productos/${id}`, { method: 'DELETE' });
      showToast('Producto eliminado correctamente');
      await loadProducts();
    } catch (error) {
      showToast(error.message, true);
      button.disabled = false;
    }
  }
});

el.productForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  clearError(el.formError);

  const nombre = el.pNombre.value.trim();
  const descripcion = el.pDescripcion.value.trim();
  const precio = Number(el.pPrecio.value);
  const stock = Number(el.pStock.value);
  const categoria = el.pCategoria.value.trim();
  const activo = el.pActivo.checked;
  const editing = Boolean(state.editingId);

  if (nombre.length < 2 || !Number.isFinite(precio) || precio < 0 || !Number.isInteger(stock) || stock < 0) {
    showError(el.formError, {
      message: 'Revisa los campos obligatorios',
      details: [
        { field: 'nombre', message: 'Mínimo 2 caracteres' },
        { field: 'precio', message: 'Debe ser un número mayor o igual a 0' },
        { field: 'stock', message: 'Debe ser un entero mayor o igual a 0' }
      ]
    });
    return;
  }

  const payload = { nombre, descripcion, precio, stock, categoria, activo };
  setBusy(el.saveBtn, true, 'Guardando…');

  try {
    if (editing) {
      await api(`/Productos/${state.editingId}`, { method: 'PUT', body: JSON.stringify(payload) });
    } else {
      await api('/Productos', { method: 'POST', body: JSON.stringify(payload) });
    }
    closeModal();
    showToast(editing ? 'Producto actualizado correctamente' : 'Producto creado correctamente');
    await loadProducts();
  } catch (error) {
    showError(el.formError, error);
  } finally {
    setBusy(el.saveBtn, false, 'Guardar');
  }
});

const session = readSession();
if (session.token) {
  state.token = session.token;
  state.user = session.user || parseJwt(session.token);
}
syncSessionUI();
checkApi();
if (state.token) loadProducts();
