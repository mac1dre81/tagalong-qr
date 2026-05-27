const STORAGE_KEYS = {
  theme: 'tagalong-theme',
  plan: 'tagalong-plan',
  history: 'tagalong-history',
};

const PLAN_LABELS = {
  free: 'Free',
  premium: 'Premium',
  business: 'Business',
};

const TEMPLATES = {
  'real-estate': {
    fullName: 'Jordan Reyes',
    company: 'Summit Realty',
    title: 'Real Estate Agent',
    website: 'summitrealty.com',
    phones: [{ type: 'work mobile', value: '+1 (206) 555-0112' }],
    emails: [{ value: 'jordan@summitrealty.com' }],
  },
  consultant: {
    fullName: 'Mina Patel',
    company: 'Northlight Advisory',
    title: 'Strategy Consultant',
    website: 'northlightadvisory.com',
    phones: [{ type: 'work', value: '+1 (415) 555-0122' }],
    emails: [{ value: 'mina@northlightadvisory.com' }],
  },
  artist: {
    fullName: 'Sage Monroe',
    company: 'Studio Sage',
    title: 'Illustrator',
    website: 'studiosage.art',
    phones: [{ type: 'mobile', value: '+1 (503) 555-0150' }],
    emails: [{ value: 'hello@studiosage.art' }],
  },
  freelancer: {
    fullName: 'Alex Chen',
    company: 'Independent',
    title: 'Product Designer',
    website: 'alexchen.design',
    phones: [{ type: 'mobile', value: '+1 (310) 555-0174' }],
    emails: [{ value: 'alex@alexchen.design' }],
  },
};

const state = {
  plan: localStorage.getItem(STORAGE_KEYS.plan) || 'free',
  theme: localStorage.getItem(STORAGE_KEYS.theme) || 'light',
  history: safeParse(localStorage.getItem(STORAGE_KEYS.history), []),
  cameraStream: null,
  scannerInterval: null,
  previewDataUrl: '',
};

const elements = {};

document.addEventListener('DOMContentLoaded', () => {
  cacheElements();
  seedRepeatableFields();
  bindEvents();
  applyTheme();
  applyPlan();
  renderHistory();
  renderPreview();
});

function cacheElements() {
  Object.assign(elements, {
    body: document.body,
    themeToggle: document.querySelector('#theme-toggle'),
    upgradeButton: document.querySelector('#upgrade-button'),
    tabButtons: [...document.querySelectorAll('.tab')],
    panels: [...document.querySelectorAll('.panel')],
    form: document.querySelector('#card-form'),
    phoneList: document.querySelector('#phone-list'),
    emailList: document.querySelector('#email-list'),
    addPhone: document.querySelector('#add-phone'),
    addEmail: document.querySelector('#add-email'),
    generateButton: document.querySelector('#generate-button'),
    validationMessage: document.querySelector('#validation-message'),
    qrPreview: document.querySelector('#qr-preview'),
    qrPlaceholder: document.querySelector('#qr-placeholder'),
    qrRenderTarget: document.querySelector('#qr-render-target'),
    successBadge: document.querySelector('#success-badge'),
    downloadPng: document.querySelector('#download-png'),
    shareQr: document.querySelector('#share-qr'),
    copyQr: document.querySelector('#copy-qr'),
    historyList: document.querySelector('#history-list'),
    exportHistory: document.querySelector('#export-history'),
    subscriptionStatus: document.querySelector('#subscription-status'),
    mockPayment: document.querySelector('#mock-payment'),
    liveRegion: document.querySelector('#live-region'),
    adBanner: document.querySelector('#ad-banner'),
    templateSelect: document.querySelector('#template-select'),
    startCamera: document.querySelector('#start-camera'),
    stopCamera: document.querySelector('#stop-camera'),
    scannerVideo: document.querySelector('#scanner-video'),
    scanImage: document.querySelector('#scan-image'),
    website: document.querySelector('#website'),
    premiumBlocks: [...document.querySelectorAll('.premium-block')],
  });
}

function seedRepeatableFields() {
  if (!elements.phoneList.children.length) {
    addPhoneRow({ type: 'mobile', value: '' });
  }
  if (!elements.emailList.children.length) {
    addEmailRow({ value: '' });
  }
}

function bindEvents() {
  elements.themeToggle.addEventListener('click', toggleTheme);
  elements.upgradeButton.addEventListener('click', () => setPlan(state.plan === 'free' ? 'premium' : 'business'));
  elements.tabButtons.forEach((button) => {
    button.addEventListener('click', () => activatePanel(button.dataset.panel));
  });
  elements.addPhone.addEventListener('click', () => addPhoneRow({ type: 'mobile', value: '' }));
  elements.addEmail.addEventListener('click', () => addEmailRow({ value: '' }));
  elements.form.addEventListener('input', () => renderPreview());
  elements.form.addEventListener('change', () => renderPreview());
  elements.website.addEventListener('blur', () => {
    if (elements.website.value.trim()) {
      elements.website.value = normalizeUrl(elements.website.value.trim());
      renderPreview();
    }
  });
  elements.generateButton.addEventListener('click', () => renderPreview({ announceSave: true }));
  elements.downloadPng.addEventListener('click', downloadPng);
  elements.shareQr.addEventListener('click', shareQr);
  elements.copyQr.addEventListener('click', copyQr);
  elements.exportHistory.addEventListener('click', exportHistory);
  elements.subscriptionStatus.addEventListener('change', (event) => setPlan(event.target.value));
  elements.mockPayment.addEventListener('click', () => {
    const nextPlan = state.plan === 'free' ? 'premium' : 'business';
    setPlan(nextPlan);
    toast(`Mock checkout complete. ${PLAN_LABELS[nextPlan]} unlocked.`);
  });
  elements.templateSelect.addEventListener('change', applyTemplate);
  elements.startCamera.addEventListener('click', startCameraScanner);
  elements.stopCamera.addEventListener('click', stopCameraScanner);
  elements.scanImage.addEventListener('change', handleImageScan);
  elements.historyList.addEventListener('click', handleHistoryClick);
}

function toggleTheme() {
  state.theme = state.theme === 'light' ? 'dark' : 'light';
  localStorage.setItem(STORAGE_KEYS.theme, state.theme);
  applyTheme();
}

function applyTheme() {
  elements.body.dataset.theme = state.theme;
  elements.themeToggle.textContent = state.theme === 'light' ? 'Dark mode' : 'Light mode';
  elements.themeToggle.setAttribute('aria-pressed', String(state.theme === 'dark'));
}

function setPlan(plan) {
  state.plan = plan;
  localStorage.setItem(STORAGE_KEYS.plan, plan);
  applyPlan();
  renderHistory();
  renderPreview();
}

function applyPlan() {
  elements.subscriptionStatus.value = state.plan;
  elements.upgradeButton.textContent = state.plan === 'free' ? 'Upgrade to Premium' : `Plan: ${PLAN_LABELS[state.plan]}`;
  elements.adBanner.hidden = state.plan !== 'free';

  elements.premiumBlocks.forEach((block) => {
    const isLocked = state.plan === 'free';
    block.classList.toggle('is-locked', isLocked);
    block.classList.toggle('is-unlocked', !isLocked);
    [...block.querySelectorAll('input, select, textarea, button')].forEach((field) => {
      if (field.hasAttribute('data-placeholder')) {
        field.disabled = true;
      } else if (field.closest('.file-picker') && field.type === 'file') {
        field.disabled = isLocked;
      } else if (!field.id?.startsWith('download')) {
        field.disabled = isLocked;
      }
    });
  });
}

function activatePanel(panelId) {
  elements.tabButtons.forEach((button) => button.classList.toggle('is-active', button.dataset.panel === panelId));
  elements.panels.forEach((panel) => panel.classList.toggle('is-active', panel.id === panelId));
}

function addPhoneRow(data) {
  const row = document.createElement('div');
  row.className = 'contact-row';
  row.innerHTML = `
    <label>
      <span class="sr-only">Phone type</span>
      <select class="phone-type">
        <option value="mobile">Mobile</option>
        <option value="work">Work</option>
        <option value="work mobile">Work mobile</option>
      </select>
    </label>
    <label>
      <span class="sr-only">Phone number</span>
      <input class="phone-value" type="tel" placeholder="+1 (555) 555-5555" />
    </label>
    <button class="remove-row" type="button" aria-label="Remove phone">Remove</button>
  `;
  row.querySelector('.phone-type').value = data.type || 'mobile';
  row.querySelector('.phone-value').value = data.value || '';
  row.querySelector('.remove-row').addEventListener('click', () => {
    row.remove();
    if (!elements.phoneList.children.length) addPhoneRow({ type: 'mobile', value: '' });
    renderPreview();
  });
  elements.phoneList.appendChild(row);
}

function addEmailRow(data) {
  const row = document.createElement('div');
  row.className = 'contact-row';
  row.innerHTML = `
    <label>
      <span class="sr-only">Email label</span>
      <select class="email-type">
        <option value="work">Work</option>
        <option value="home">Home</option>
        <option value="other">Other</option>
      </select>
    </label>
    <label>
      <span class="sr-only">Email address</span>
      <input class="email-value" type="email" placeholder="you@example.com" />
    </label>
    <button class="remove-row" type="button" aria-label="Remove email">Remove</button>
  `;
  row.querySelector('.email-type').value = data.type || 'work';
  row.querySelector('.email-value').value = data.value || '';
  row.querySelector('.remove-row').addEventListener('click', () => {
    row.remove();
    if (!elements.emailList.children.length) addEmailRow({ value: '' });
    renderPreview();
  });
  elements.emailList.appendChild(row);
}

function applyTemplate(event) {
  const template = TEMPLATES[event.target.value];
  if (!template) {
    return;
  }

  setFieldValue('full-name', template.fullName);
  setFieldValue('company', template.company);
  setFieldValue('title', template.title);
  setFieldValue('website', template.website);
  elements.phoneList.innerHTML = '';
  elements.emailList.innerHTML = '';
  template.phones.forEach(addPhoneRow);
  template.emails.forEach(addEmailRow);
  renderPreview();
}

function setFieldValue(id, value) {
  const field = document.getElementById(id);
  if (field) field.value = value || '';
}

function collectFormData() {
  const phones = [...elements.phoneList.querySelectorAll('.contact-row')]
    .map((row) => ({
      type: row.querySelector('.phone-type').value,
      value: row.querySelector('.phone-value').value.trim(),
    }))
    .filter((item) => item.value);

  const emails = [...elements.emailList.querySelectorAll('.contact-row')]
    .map((row) => ({
      type: row.querySelector('.email-type').value,
      value: row.querySelector('.email-value').value.trim(),
    }))
    .filter((item) => item.value);

  return {
    fullName: document.querySelector('#full-name').value.trim(),
    company: document.querySelector('#company').value.trim(),
    title: document.querySelector('#title').value.trim(),
    website: normalizeUrl(document.querySelector('#website').value.trim()),
    street: document.querySelector('#street').value.trim(),
    city: document.querySelector('#city').value.trim(),
    state: document.querySelector('#state').value.trim(),
    zip: document.querySelector('#zip').value.trim(),
    linkedin: document.querySelector('#linkedin').value.trim(),
    twitter: document.querySelector('#twitter').value.trim(),
    birthday: document.querySelector('#birthday').value,
    notes: document.querySelector('#notes').value.trim(),
    customField: document.querySelector('#custom-field').value.trim(),
    phones,
    emails,
  };
}

function validateForm(data) {
  if (!data.fullName) {
    return 'Full name is required to build your QR business card.';
  }
  if (data.emails.some((entry) => !/^\S+@\S+\.\S+$/.test(entry.value))) {
    return 'Use a valid email address before generating your QR code.';
  }
  return '';
}

function renderPreview(options = {}) {
  if (!window.TagAlongQR?.createCanvas) {
    elements.validationMessage.textContent = 'Loading QR code library…';
    return;
  }

  const data = collectFormData();
  const error = validateForm(data);
  elements.validationMessage.textContent = error;

  if (error) {
    elements.qrPreview.hidden = true;
    elements.qrPlaceholder.hidden = false;
    state.previewDataUrl = '';
    return;
  }

  const vCard = buildVCard(data, state.plan);
  const size = state.plan === 'free' ? 250 : Number(document.querySelector('#qr-size')?.value || 250);
  const colorDark = state.plan === 'free' ? '#111111' : document.querySelector('#qr-foreground').value;
  const colorLight = state.plan === 'free' ? '#ffffff' : document.querySelector('#qr-background').value;

  requestAnimationFrame(() => {
    const rawCanvas = window.TagAlongQR.createCanvas(vCard, { size, colorDark, colorLight });
    elements.qrRenderTarget.innerHTML = '';
    elements.qrRenderTarget.appendChild(rawCanvas);

    const composedCanvas = document.createElement('canvas');
    composedCanvas.width = size;
    composedCanvas.height = size;
    const context = composedCanvas.getContext('2d');
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, size, size);
    context.drawImage(rawCanvas, 0, 0, size, size);

    state.previewDataUrl = composedCanvas.toDataURL('image/png');
    elements.qrPreview.src = state.previewDataUrl;
    elements.qrPreview.hidden = false;
    elements.qrPlaceholder.hidden = true;

    if (options.announceSave) {
      saveHistoryItem({ data, dataUrl: state.previewDataUrl, vCard });
      pulseSuccess();
      toast('QR code generated and saved locally.');
    }
  });
}

function buildVCard(data, plan) {
  const lines = ['BEGIN:VCARD', 'VERSION:3.0', `FN:${escapeVCard(data.fullName)}`];
  if (data.company) lines.push(`ORG:${escapeVCard(data.company)}`);
  if (data.title) lines.push(`TITLE:${escapeVCard(data.title)}`);
  data.phones.forEach((phone) => {
    lines.push(`TEL;TYPE=${mapPhoneType(phone.type)}:${escapeVCard(phone.value)}`);
  });
  data.emails.forEach((email) => {
    lines.push(`EMAIL;TYPE=${email.type.toUpperCase()}:${escapeVCard(email.value)}`);
  });
  if (data.website) lines.push(`URL:${escapeVCard(data.website)}`);
  if (data.street || data.city || data.state || data.zip) {
    lines.push(`ADR;TYPE=WORK:;;${escapeVCard(data.street)};${escapeVCard(data.city)};${escapeVCard(data.state)};${escapeVCard(data.zip)};`);
  }
  if (plan !== 'free') {
    if (data.linkedin) lines.push(`X-SOCIALPROFILE;TYPE=LinkedIn:${escapeVCard(normalizeUrl(data.linkedin))}`);
    if (data.twitter) lines.push(`X-SOCIALPROFILE;TYPE=Twitter:${escapeVCard(normalizeUrl(data.twitter))}`);
    if (data.birthday) lines.push(`BDAY:${data.birthday}`);
    if (data.notes) lines.push(`NOTE:${escapeVCard(data.notes)}`);
    if (data.customField) lines.push(`X-CUSTOM:${escapeVCard(data.customField)}`);
  }
  lines.push('END:VCARD');
  return lines.join('\n');
}

function mapPhoneType(type) {
  switch (type) {
    case 'work':
      return 'WORK';
    case 'work mobile':
      return 'WORK,CELL';
    default:
      return 'CELL';
  }
}

function escapeVCard(value) {
  return String(value || '')
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,');
}

function normalizeUrl(value) {
  if (!value) return '';
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

function saveHistoryItem(entry) {
  const limit = state.plan === 'free' ? 25 : Number.POSITIVE_INFINITY;
  const item = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    name: entry.data.fullName,
    subtitle: [entry.data.company, entry.data.title].filter(Boolean).join(' · '),
    website: entry.data.website,
    vCard: entry.vCard,
    dataUrl: entry.dataUrl,
  };
  state.history = [item, ...state.history].slice(0, limit);
  persistHistory();
  renderHistory();
}

function persistHistory() {
  localStorage.setItem(STORAGE_KEYS.history, JSON.stringify(state.history));
}

function renderHistory() {
  if (!state.history.length) {
    elements.historyList.innerHTML = '<div class="history-empty">No QR codes saved yet. Click Generate to store your first card.</div>';
    return;
  }

  elements.historyList.innerHTML = state.history
    .map(
      (item) => `
        <article class="history-item">
          <img class="history-thumb" src="${item.dataUrl}" alt="Saved QR code for ${escapeHtml(item.name)}" />
          <div>
            <h3>${escapeHtml(item.name)}</h3>
            <p>${escapeHtml(item.subtitle || 'Saved QR business card')}</p>
            <p>${new Date(item.createdAt).toLocaleString()}</p>
          </div>
          <div class="stack">
            <button class="secondary-button" type="button" data-action="load" data-id="${item.id}">Load</button>
            <button class="tertiary-button" type="button" data-action="delete" data-id="${item.id}">Delete</button>
          </div>
        </article>
      `,
    )
    .join('');
}

function handleHistoryClick(event) {
  const action = event.target.dataset.action;
  const id = event.target.dataset.id;
  if (!action || !id) return;

  if (action === 'delete') {
    state.history = state.history.filter((item) => item.id !== id);
    persistHistory();
    renderHistory();
    toast('Saved QR code removed.');
    return;
  }

  const item = state.history.find((entry) => entry.id === id);
  if (!item) return;
  importVCard(item.vCard);
  activatePanel('generator-panel');
  toast(`Loaded ${item.name} into the generator.`);
}

function exportHistory() {
  const blob = new Blob([JSON.stringify(state.history, null, 2)], { type: 'application/json' });
  downloadBlob(blob, 'tagalong-history.json');
  toast('History exported as JSON.');
}

function downloadPng() {
  if (!state.previewDataUrl) {
    toast('Generate a QR code first.');
    return;
  }
  const link = document.createElement('a');
  link.href = state.previewDataUrl;
  link.download = `${slugify(document.querySelector('#full-name').value || 'tagalong-card')}.png`;
  link.click();
  toast('PNG downloaded.');
}

async function shareQr() {
  if (!state.previewDataUrl) {
    toast('Generate a QR code first.');
    return;
  }
  if (!navigator.share) {
    toast('System share is not available in this browser.');
    return;
  }

  const file = dataUrlToFile(state.previewDataUrl, 'tagalong-qr.png');
  try {
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], title: 'My TagAlong QR card', text: 'Scan to save my contact details.' });
    } else {
      await navigator.share({ title: 'My TagAlong QR card', text: 'Scan to save my contact details.', url: state.previewDataUrl });
    }
    toast('QR code shared.');
  } catch (error) {
    if (error?.name !== 'AbortError') {
      toast('Share failed. Try downloading the PNG instead.');
    }
  }
}

async function copyQr() {
  if (!state.previewDataUrl) {
    toast('Generate a QR code first.');
    return;
  }
  try {
    const file = dataUrlToFile(state.previewDataUrl, 'tagalong-qr.png');
    if (navigator.clipboard?.write && window.ClipboardItem) {
      await navigator.clipboard.write([new ClipboardItem({ [file.type]: file })]);
    } else {
      await navigator.clipboard.writeText(state.previewDataUrl);
    }
    toast('QR code copied to clipboard.');
  } catch {
    toast('Clipboard copy is not available in this browser.');
  }
}

async function startCameraScanner() {
  if (!('BarcodeDetector' in window) || !navigator.mediaDevices?.getUserMedia) {
    toast('Camera scanning is not supported in this browser.');
    return;
  }

  stopCameraScanner();
  try {
    state.cameraStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
    elements.scannerVideo.srcObject = state.cameraStream;
    elements.scannerVideo.hidden = false;
    await elements.scannerVideo.play();
    const detector = new BarcodeDetector({ formats: ['qr_code'] });
    state.scannerInterval = window.setInterval(async () => {
      try {
        const barcodes = await detector.detect(elements.scannerVideo);
        if (barcodes[0]?.rawValue) {
          handleScannedValue(barcodes[0].rawValue);
          stopCameraScanner();
        }
      } catch {
        // ignore intermittent scanner errors
      }
    }, 600);
  } catch {
    toast('Unable to access the camera.');
  }
}

function stopCameraScanner() {
  if (state.scannerInterval) {
    window.clearInterval(state.scannerInterval);
    state.scannerInterval = null;
  }
  if (state.cameraStream) {
    state.cameraStream.getTracks().forEach((track) => track.stop());
    state.cameraStream = null;
  }
  elements.scannerVideo.pause();
  elements.scannerVideo.hidden = true;
  elements.scannerVideo.srcObject = null;
}

async function handleImageScan(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  if (!('BarcodeDetector' in window)) {
    toast('Image scanning needs a browser with BarcodeDetector support.');
    event.target.value = '';
    return;
  }

  try {
    const imageBitmap = await createImageBitmap(file);
    const detector = new BarcodeDetector({ formats: ['qr_code'] });
    const results = await detector.detect(imageBitmap);
    if (results[0]?.rawValue) {
      handleScannedValue(results[0].rawValue);
    } else {
      toast('No QR code found in that image.');
    }
  } catch {
    toast('Could not scan that image.');
  } finally {
    event.target.value = '';
  }
}

function handleScannedValue(rawValue) {
  if (/^BEGIN:VCARD/i.test(rawValue)) {
    importVCard(rawValue);
    activatePanel('generator-panel');
    toast('vCard imported into the generator.');
    return;
  }

  if (/^https?:\/\//i.test(rawValue) || /^www\./i.test(rawValue)) {
    if (window.confirm('This QR code contains a URL. Add it to the website field?')) {
      setFieldValue('website', normalizeUrl(rawValue));
      activatePanel('generator-panel');
      renderPreview();
    }
    return;
  }

  toast('Scanned QR code is not a supported vCard or URL.');
}

function importVCard(rawVCard) {
  const lines = rawVCard.split(/\r?\n/);
  const data = {
    phones: [],
    emails: [],
  };

  lines.forEach((line) => {
    if (line.startsWith('FN:')) data.fullName = unescapeVCard(line.slice(3));
    if (line.startsWith('ORG:')) data.company = unescapeVCard(line.slice(4));
    if (line.startsWith('TITLE:')) data.title = unescapeVCard(line.slice(6));
    if (line.startsWith('URL:')) data.website = unescapeVCard(line.slice(4));
    if (line.startsWith('ADR')) {
      const [, value = ''] = line.split(':');
      const parts = value.split(';');
      data.street = unescapeVCard(parts[2] || '');
      data.city = unescapeVCard(parts[3] || '');
      data.state = unescapeVCard(parts[4] || '');
      data.zip = unescapeVCard(parts[5] || '');
    }
    if (line.startsWith('TEL')) {
      const [meta, value = ''] = line.split(':');
      data.phones.push({
        type: meta.includes('WORK,CELL') ? 'work mobile' : meta.includes('WORK') ? 'work' : 'mobile',
        value: unescapeVCard(value),
      });
    }
    if (line.startsWith('EMAIL')) {
      const [meta, value = ''] = line.split(':');
      data.emails.push({
        type: meta.includes('HOME') ? 'home' : meta.includes('OTHER') ? 'other' : 'work',
        value: unescapeVCard(value),
      });
    }
  });

  setFieldValue('full-name', data.fullName);
  setFieldValue('company', data.company);
  setFieldValue('title', data.title);
  setFieldValue('website', data.website);
  setFieldValue('street', data.street);
  setFieldValue('city', data.city);
  setFieldValue('state', data.state);
  setFieldValue('zip', data.zip);
  elements.phoneList.innerHTML = '';
  elements.emailList.innerHTML = '';
  (data.phones.length ? data.phones : [{ type: 'mobile', value: '' }]).forEach(addPhoneRow);
  (data.emails.length ? data.emails : [{ value: '' }]).forEach(addEmailRow);
  renderPreview();
}

function unescapeVCard(value) {
  return String(value || '')
    .replace(/\\n/g, '\n')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\');
}

function dataUrlToFile(dataUrl, filename) {
  const [meta, content] = dataUrl.split(',');
  const mimeMatch = meta.match(/data:(.*?);base64/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/png';
  const bytes = Uint8Array.from(atob(content), (char) => char.charCodeAt(0));
  return new File([bytes], filename, { type: mime });
}

function downloadBlob(blob, filename) {
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(link.href), 0);
}

function pulseSuccess() {
  elements.successBadge.classList.remove('show');
  void elements.successBadge.offsetWidth;
  elements.successBadge.classList.add('show');
}

function toast(message) {
  elements.liveRegion.textContent = message;
  elements.liveRegion.classList.add('show');
  window.clearTimeout(toast.timeoutId);
  toast.timeoutId = window.setTimeout(() => elements.liveRegion.classList.remove('show'), 2200);
}

function slugify(value) {
  return String(value).trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'tagalong-card';
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function safeParse(value, fallback) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}
