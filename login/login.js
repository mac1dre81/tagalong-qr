const STORAGE_KEYS = {
  session: 'tagalong-auth-session',
  rememberedEmail: 'tagalong-auth-remembered-email',
};

const REDIRECT_DELAY_MS = 500;
const TOAST_DURATION_MS = 2200;
const HOME_PATH = '../';

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

function hydratePage() {
  const rememberedEmail = localStorage.getItem(STORAGE_KEYS.rememberedEmail);
  const session = safeParse(localStorage.getItem(STORAGE_KEYS.session), null);

  if (rememberedEmail) {
    elements.email.value = rememberedEmail;
    elements.rememberEmail.checked = true;
  }

  if (session?.email) {
    renderSession(session);
    setMessage(`Signed in as ${session.email}.`, true);
    return;
  }

  renderLoggedOutState();
}

function handleLogin(event) {
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

  const session = {
    email,
    loggedInAt: new Date().toISOString(),
  };

  localStorage.setItem(STORAGE_KEYS.session, JSON.stringify(session));
  if (elements.rememberEmail.checked) {
    localStorage.setItem(STORAGE_KEYS.rememberedEmail, email);
  } else {
    localStorage.removeItem(STORAGE_KEYS.rememberedEmail);
  }

  renderSession(session);
  setMessage(`Signed in as ${email}. Redirecting…`, true);
  toast('Mock login complete.');
  window.setTimeout(() => window.location.assign(HOME_PATH), REDIRECT_DELAY_MS);
}

function handleLogout() {
  localStorage.removeItem(STORAGE_KEYS.session);
  elements.password.value = '';
  renderLoggedOutState();
  setMessage('You have been signed out.', true);
  toast('Signed out.');
}

function renderSession(session) {
  elements.sessionCopy.textContent = `Signed in as ${session.email}. Continue back to the generator any time.`;
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

function safeParse(value, fallback) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}
