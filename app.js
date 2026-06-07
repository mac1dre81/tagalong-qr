const API_BASE = (window.TAGALONG_CONFIG?.apiBaseUrl || 'http://localhost:4000').replace(/\/$/, '');

document.addEventListener('DOMContentLoaded', () => {
  checkHealth();
  document.getElementById('qr-form')?.addEventListener('submit', handleQrSubmit);
});

async function checkHealth() {
  const statusEl = document.getElementById('health-status');
  try {
    const response = await fetch(`${API_BASE}/health`);
    const data = await response.json();
    if (data.status === 'ok') {
      statusEl.textContent = '✓ Connected';
      statusEl.classList.add('ok');
    } else {
      statusEl.textContent = '✗ Unknown status';
    }
  } catch (error) {
    statusEl.textContent = '✗ Disconnected';
  }
}

async function handleQrSubmit(event) {
  event.preventDefault();
  const content = document.getElementById('qr-content').value.trim();
  const resultEl = document.getElementById('qr-result');

  if (!content) {
    resultEl.innerHTML = '<p style="color: var(--color-danger)">Please enter some content</p>';
    return;
  }

  // Note: Actual QR generation requires authentication
  // This shows a placeholder QR code using Google Charts API
  const qrUrl = `https://chart.googleapis.com/chart?chs=300x300&cht=qr&chl=${encodeURIComponent(content)}&choe=UTF-8`;
  
  resultEl.innerHTML = `
    <h4>Your QR Code:</h4>
    <img src="${qrUrl}" alt="QR Code for ${content}" />
    <p style="margin-top: 0.5rem; font-size: 0.875rem; color: var(--color-secondary)">
      (Sign in to save QR codes to your account)
    </p>
  `;
}

function toast(message) {
  const liveRegion = document.getElementById('live-region');
  liveRegion.textContent = message;
  liveRegion.classList.add('show');
  setTimeout(() => liveRegion.classList.remove('show'), 2200);
}