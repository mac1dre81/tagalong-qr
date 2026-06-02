const STORAGE_KEYS = {
  token: 'tagalong-auth-token',
  rememberedEmail: 'tagalong-auth-remembered-email',
};

const REDIRECT_DELAY_MS = 500;
const TOAST_DURATION_MS = 2200;
const HOME_PATH = '../';
const API_BASE = (window.TAGALONG_CONFIG?.apiBaseUrl || 'http://localhost:4000').replace(/\/$/, '');

const elements = {};

document.addEventListener('DOMContentLoaded', () => {
  cacheElements();
  bindEvents();
  hydratePage();
});

function cacheElements() {
  Object.assign(elements, {
    loginCard: document.querySelector('#login-card'),
    sessionCard: document.querySelector('#session-card'),
    form: document.querySelector('#login-form'),
    email: document.querySelector('#login-email'),
    password: document.querySelector('#login-password'),
    rememberEmail: document.querySelector('#remember-email'),
    message: document.querySelector('#login-message'),
    sessionCopy: document.querySelector('#session-copy'),
    logoutButton: document.querySelector('#logout-button'),
    liveRegion: document.querySelector('#live-region'),
  });
}

function bindEvents() {
  elements.form.addEventListener('submit', handleLogin);
  elements.logoutButton.addEventListener('click', handleLogout);
}

async function hydratePage() {
  const rememberedEmail = localStorage.getItem(STORAGE_KEYS.rememberedEmail);
  if (rememberedEmail) {
    elements.email.value = rememberedEmail;
    elements.rememberEmail.checked = true;
  }

  const token = localStorage.getItem(STORAGE_KEYS.token);
  if (!token) {
    renderLoggedOutState();
    return;
  }

  try {
    const result = await request('/api/auth/session', { method: 'GET', token });
    renderSession(result.user);
    setMessage(`Signed in as ${result.user.email}.`, true);
  } catch {
    localStorage.removeItem(STORAGE_KEYS.token);
    renderLoggedOutState();
  }
}

async function handleLogin(event) {
  event.preventDefault();
  const email = elements.email.value.trim().toLowerCase();
  const password = elements.password.value.trim();

  if (!email) {
    setMessage('Enter your email address.');
    elements.email.focus();
    return;
  }

  if (!/^\S+@\S+\.\S+$/.test(email)) {
    setMessage('Use a valid email address.');
    elements.email.focus();
    return;
  }

  if (!password) {
    setMessage('Enter your password to continue.');
    elements.password.focus();
    return;
  }

  try {
    const result = await request('/api/auth/login', {
      method: 'POST',
      body: { email, password },
    });

    localStorage.setItem(STORAGE_KEYS.token, result.token);
    if (elements.rememberEmail.checked) {
      localStorage.setItem(STORAGE_KEYS.rememberedEmail, email);
    } else {
      localStorage.removeItem(STORAGE_KEYS.rememberedEmail);
    }

    renderSession(result.user);
    setMessage(`Signed in as ${email}. Redirecting…`, true);
    toast('Login complete.');
    window.setTimeout(() => window.location.assign(HOME_PATH), REDIRECT_DELAY_MS);
  } catch (error) {
    setMessage(error.message || 'Sign-in failed. Check your credentials and try again.');
  }
}

async function handleLogout() {
  const token = localStorage.getItem(STORAGE_KEYS.token);
  try {
    if (token) {
      await request('/api/auth/logout', { method: 'POST', token });
    }
  } catch {
    // logout should still clear local token even if API request fails
  }

  localStorage.removeItem(STORAGE_KEYS.token);
  elements.password.value = '';
  renderLoggedOutState();
  setMessage('You have been signed out.', true);
  toast('Signed out.');
}

function renderSession(user) {
  elements.sessionCopy.textContent = `Signed in as ${user.email}. Continue back to the generator any time.`;
  elements.loginCard.hidden = true;
  elements.sessionCard.hidden = false;
}

function renderLoggedOutState() {
  elements.loginCard.hidden = false;
  elements.sessionCard.hidden = true;
}

function setMessage(message, isSuccess = false) {
  elements.message.textContent = message;
  elements.message.classList.toggle('is-success', isSuccess);
}

function toast(message) {
  elements.liveRegion.textContent = message;
  elements.liveRegion.classList.add('show');
  window.clearTimeout(toast.timeoutId);
  toast.timeoutId = window.setTimeout(() => elements.liveRegion.classList.remove('show'), TOAST_DURATION_MS);
}

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(options.token ? { Authorization: 'Bearer ' + options.token } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (response.status === 204) {
    return null;
  }

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || `Request failed (${response.status})`);
  }
  return payload;
}
