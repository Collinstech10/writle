// =============================================
// WRITLE — Enhanced Frontend Logic
// =============================================

// --- State ---
let selectedTemplate = null;
let selectedFiles = [];
let objectUrls = [];
let templateTypes = {};
let currentStep = 1;
const totalSteps = 4;
let pinMode = 'auto'; // 'auto' | 'custom'
let currentShareUrl = '';
let currentPin = '';

// Local template metadata (previously served by /api/template-types).
// Writele is frontend-only, so this now lives in the client.
const TEMPLATE_TYPES = {
  'marry-me': { name: 'Will You Marry Me?', theme: 'romantic', icon: '💍' },
  'sorry': { name: 'I Am Sorry', theme: 'apology', icon: '😔' },
  'love': { name: 'I Love You', theme: 'love', icon: '❤️' },
  'will-you-date': { name: 'Will You Date Me?', theme: 'dating', icon: '💕' },
  'happy-anniversary': { name: 'Happy Anniversary', theme: 'celebration', icon: '🎉' },
  'just-for-you': { name: 'Special Message', theme: 'special', icon: '✨' }
};

// Sharing limits — everything lives inside the URL now, so media has to
// stay small. Photos are auto-compressed; videos can't be embedded.
const MAX_LINK_PHOTOS = 4;
const PHOTO_MAX_DIMENSION = 1000;
const PHOTO_JPEG_QUALITY = 0.65;
const LINK_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

// --- Template Config (client-side personalities) ---
const templateThemes = {
  'marry-me': {
    gradient: 'linear-gradient(135deg, #2c1a3a 0%, #4a2060 50%, #6b3a8a 100%)',
    previewBg: 'linear-gradient(135deg, #1a0a2e 0%, #2d1050 100%)',
    accent: '#a78bfa',
    animation: 'heartPulse',
    petalColor: 'rgba(167,139,250,0.2)',
    personality: 'dramatic'
  },
  'sorry': {
    gradient: 'linear-gradient(135deg, #dce8f5 0%, #b8d4f0 100%)',
    previewBg: 'linear-gradient(135deg, #e8f0f8 0%, #c8ddf0 100%)',
    accent: '#5b8ab5',
    animation: 'none',
    petalColor: 'rgba(91,138,181,0.12)',
    personality: 'gentle'
  },
  'love': {
    gradient: 'linear-gradient(135deg, #fce4ec 0%, #f8bbd0 50%, #f48fb1 100%)',
    previewBg: 'linear-gradient(135deg, #fff0f4 0%, #ffe0ea 100%)',
    accent: '#e91e63',
    animation: 'heartPulse',
    petalColor: 'rgba(233,30,99,0.15)',
    personality: 'romantic'
  },
  'will-you-date': {
    gradient: 'linear-gradient(135deg, #fce4ec 0%, #f3e5f5 50%, #e8dff0 100%)',
    previewBg: 'linear-gradient(135deg, #fef5f9 0%, #faf0f8 100%)',
    accent: '#ec407a',
    animation: 'float',
    petalColor: 'rgba(236,64,122,0.14)',
    personality: 'playful'
  },
  'happy-anniversary': {
    gradient: 'linear-gradient(135deg, #fff8e1 0%, #ffe0b2 50%, #ffcc80 100%)',
    previewBg: 'linear-gradient(135deg, #fffdf5 0%, #fff5e6 100%)',
    accent: '#f57c00',
    animation: 'float',
    petalColor: 'rgba(245,124,0,0.14)',
    personality: 'celebratory'
  },
  'just-for-you': {
    gradient: 'linear-gradient(135deg, #f3e5f5 0%, #ede7f6 50%, #d1c4e9 100%)',
    previewBg: 'linear-gradient(135deg, #faf8fd 0%, #f5f0fa 100%)',
    accent: '#7c4dff',
    animation: 'fadeIn',
    petalColor: 'rgba(124,77,255,0.1)',
    personality: 'elegant'
  }
};

const templateDescriptions = {
  'marry-me': 'A dramatic and heartfelt marriage proposal',
  'sorry': 'A sincere and gentle apology from the heart',
  'love': 'Express your deepest love and affection',
  'will-you-date': 'Ask them out in the cutest way possible',
  'happy-anniversary': 'Celebrate your special day in style',
  'just-for-you': 'A unique message for any special occasion'
};

// --- Init ---
document.addEventListener('DOMContentLoaded', () => {
  loadTemplateTypes();
  setupEventListeners();
  setupButtonListeners();
  initThemeSystem();
  createPetals();
});

// =============================================
// THEME SYSTEM
// =============================================
function initThemeSystem() {
  const savedTheme = localStorage.getItem('writele-theme') || 'romantic';
  applyTheme(savedTheme);

  document.querySelectorAll('.theme-dot').forEach(dot => {
    dot.addEventListener('click', () => {
      const theme = dot.dataset.theme;
      applyTheme(theme);
      localStorage.setItem('writele-theme', theme);
      updatePreview();
    });
  });
}

function applyTheme(theme) {
  document.querySelectorAll('.theme-dot').forEach(d => d.classList.remove('active'));
  const dot = document.querySelector(`[data-theme="${theme}"]`);
  if (dot) dot.classList.add('active');

  document.body.className = `theme-${theme}`;
}

function getCurrentTheme() {
  const dot = document.querySelector('.theme-dot.active');
  return dot ? dot.dataset.theme : 'romantic';
}

// =============================================
// PETALS
// =============================================
function createPetals() {
  const container = document.getElementById('heroPetals');
  if (!container) return;

  const count = 18;
  for (let i = 0; i < count; i++) {
    const petal = document.createElement('div');
    petal.className = 'petal';
    petal.style.left = Math.random() * 100 + '%';
    petal.style.animationDuration = (8 + Math.random() * 14) + 's';
    petal.style.animationDelay = (Math.random() * 10) + 's';
    petal.style.width = (6 + Math.random() * 10) + 'px';
    petal.style.height = (6 + Math.random() * 10) + 'px';
    petal.style.opacity = (0.06 + Math.random() * 0.1).toString();
    container.appendChild(petal);
  }
}

// =============================================
// TEMPLATE TYPES
// =============================================
function loadTemplateTypes() {
  templateTypes = TEMPLATE_TYPES;
  renderTemplateGrid();
}

function renderTemplateGrid() {
  const grid = document.getElementById('templateGrid');
  grid.innerHTML = '';

  const personalities = {
    'marry-me': '💍',
    'sorry': '😔',
    'love': '❤️',
    'will-you-date': '💕',
    'happy-anniversary': '🎉',
    'just-for-you': '✨'
  };

  Object.entries(templateTypes).forEach(([key, template], index) => {
    const theme = templateThemes[key] || templateThemes['just-for-you'];
    const card = document.createElement('div');
    card.className = 'template-card animate-in';
    card.style.setProperty('--template-color', theme.accent);
    card.style.setProperty('--template-color-bg', hexToRgba(theme.accent, 0.06));
    card.style.animationDelay = (index * 0.06) + 's';
    card.dataset.type = key;

    const desc = templateDescriptions[key] || 'A special message template';

    card.innerHTML = `
      <div class="template-card-top">
        <span class="template-card-icon">${personalities[key] || template.icon || '✨'}</span>
        <span class="template-card-badge">${template.name}</span>
      </div>
      <div class="template-card-name">${template.name}</div>
      <div class="template-card-desc">${desc}</div>
      <div class="template-card-arrow">→</div>
    `;

    card.addEventListener('click', () => selectTemplate(key));
    grid.appendChild(card);
  });
}

function hexToRgba(hex, alpha) {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

// =============================================
// TEMPLATE SELECTION
// =============================================
function selectTemplate(type) {
  document.querySelectorAll('.template-card').forEach(card => {
    card.classList.remove('selected');
  });

  const selectedCard = document.querySelector(`[data-type="${type}"]`);
  if (selectedCard) selectedCard.classList.add('selected');

  selectedTemplate = type;
  const config = templateTypes[type];
  const theme = templateThemes[type] || templateThemes['just-for-you'];

  document.getElementById('selectedIcon').textContent = getTemplateIcon(type);

  document.getElementById('selectedTemplateName').textContent = config.name;

  document.getElementById('formPlaceholder').classList.add('hidden');
  document.getElementById('creationForm').classList.remove('hidden');

  resetSteps();
  updatePreview();

  const panel = document.getElementById('creatorPanel');
  panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// =============================================
// MULTI-STEP FORM
// =============================================
function resetSteps() {
  currentStep = 1;
  updateStepVisibility();
}

function updateStepVisibility() {
  document.querySelectorAll('.form-step').forEach((step, i) => {
    step.classList.toggle('active', i + 1 === currentStep);
  });

  const prevBtn = document.getElementById('prevStepBtn');
  const nextBtn = document.getElementById('nextStepBtn');
  const submitBtn = document.getElementById('submitBtn');

  if (currentStep === 1) {
    prevBtn.classList.add('hidden');
  } else {
    prevBtn.classList.remove('hidden');
  }

  if (currentStep === totalSteps) {
    nextBtn.classList.add('hidden');
    submitBtn.classList.remove('hidden');
  } else {
    nextBtn.classList.remove('hidden');
    submitBtn.classList.add('hidden');
  }
}

function nextStep() {
  if (currentStep < totalSteps) {
    currentStep++;
    updateStepVisibility();
  }
}

function prevStep() {
  if (currentStep > 1) {
    currentStep--;
    updateStepVisibility();
  }
}

// =============================================
// EVENT LISTENERS
// =============================================
function setupEventListeners() {
  const uploadArea = document.getElementById('uploadArea');
  const mediaInput = document.getElementById('mediaInput');
  const messageInput = document.getElementById('message');
  const recipientInput = document.getElementById('recipientName');
  const senderInput = document.getElementById('senderName');

  if (uploadArea) {
    uploadArea.addEventListener('click', () => mediaInput.click());
    uploadArea.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        mediaInput.click();
      }
    });

    uploadArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      uploadArea.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', () => {
      uploadArea.classList.remove('dragover');
    });

    uploadArea.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadArea.classList.remove('dragover');
      handleFiles(e.dataTransfer.files);
    });
  }

  if (mediaInput) {
    mediaInput.addEventListener('change', handleFileSelect);
  }

  if (messageInput) {
    messageInput.addEventListener('input', () => {
      document.getElementById('charCount').textContent = messageInput.value.length;
      updatePreview();
    });
  }

  if (recipientInput) {
    recipientInput.addEventListener('input', updatePreview);
  }

  if (senderInput) {
    senderInput.addEventListener('input', updatePreview);
  }

  const form = document.getElementById('messageForm');
  if (form) {
    form.addEventListener('submit', handleFormSubmit);
  }
}

function setupButtonListeners() {
  const prevBtn = document.getElementById('prevStepBtn');
  const nextBtn = document.getElementById('nextStepBtn');
  const submitBtn = document.getElementById('submitBtn');
  const createAnotherBtn = document.getElementById('createAnotherBtn');
  const whatsappBtn = document.getElementById('whatsappBtn');
  const nativeShareBtn = document.getElementById('nativeShareBtn');

  if (prevBtn) prevBtn.addEventListener('click', prevStep);
  if (nextBtn) nextBtn.addEventListener('click', nextStep);
  if (createAnotherBtn) createAnotherBtn.addEventListener('click', createAnother);
  if (whatsappBtn) whatsappBtn.addEventListener('click', shareWhatsApp);
  if (nativeShareBtn) nativeShareBtn.addEventListener('click', shareNative);

  const copyLinkBtn = document.getElementById('copyLinkBtn');
  const copyPinBtn = document.getElementById('copyPinBtn');
  const copyDetailsBtn = document.getElementById('copyDetailsBtn');
  if (copyLinkBtn) copyLinkBtn.addEventListener('click', copyLink);
  if (copyPinBtn) copyPinBtn.addEventListener('click', copyPin);
  if (copyDetailsBtn) copyDetailsBtn.addEventListener('click', copyDetails);

  setupPinModeToggle();
}

// =============================================
// PIN MODE TOGGLE (auto-generate vs custom)
// =============================================
function setupPinModeToggle() {
  const buttons = document.querySelectorAll('.pin-mode-btn');
  const customWrap = document.getElementById('customPinWrap');

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      buttons.forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');

      pinMode = btn.dataset.mode;
      if (customWrap) customWrap.classList.toggle('hidden', pinMode !== 'custom');
    });
  });

  const customPinInput = document.getElementById('customPin');
  if (customPinInput) {
    customPinInput.addEventListener('input', () => {
      customPinInput.value = customPinInput.value.replace(/\D/g, '').slice(0, 6);
    });
  }
}

// =============================================
// FILE HANDLING
// =============================================
function handleFileSelect(e) {
  handleFiles(e.target.files);
}

function handleFiles(files) {
  const fileArray = Array.from(files);

  if (selectedFiles.length + fileArray.length > 10) {
    showToast('Maximum 10 files allowed');
    return;
  }

  const allowedTypes = /jpeg|jpg|png|gif|mp4|webm|ogg|mov|avi|wmv|flv|mkv/;
  const invalidFiles = fileArray.filter(file => {
    const ext = allowedTypes.test(file.name.split('.').pop().toLowerCase());
    const mime = allowedTypes.test(file.type);
    return !ext || !mime;
  });

  if (invalidFiles.length > 0) {
    showToast('Only image and video files are allowed');
    return;
  }

  selectedFiles = [...selectedFiles, ...fileArray];
  updateFilePreview();
  updatePreview();
}

function updateFilePreview() {
  revokeObjectUrls();

  const preview = document.getElementById('filePreview');
  preview.innerHTML = '';

  selectedFiles.forEach((file, index) => {
    const item = document.createElement('div');
    item.className = 'preview-item animate-in';
    item.style.animationDelay = (index * 0.04) + 's';

    if (file.type.startsWith('image/')) {
      const img = document.createElement('img');
      img.src = URL.createObjectURL(file);
      img.alt = 'Preview';
      item.appendChild(img);
      objectUrls.push(img.src);
    } else if (file.type.startsWith('video/')) {
      const video = document.createElement('video');
      video.src = URL.createObjectURL(file);
      video.muted = true;
      video.preload = 'metadata';
      item.appendChild(video);
      objectUrls.push(video.src);
    }

    const removeBtn = document.createElement('button');
    removeBtn.className = 'preview-remove';
    removeBtn.innerHTML = '×';
    removeBtn.setAttribute('aria-label', 'Remove file');
    removeBtn.addEventListener('click', () => removeFile(index));
    item.appendChild(removeBtn);

    preview.appendChild(item);
  });
}

function removeFile(index) {
  selectedFiles.splice(index, 1);
  updateFilePreview();
  updatePreview();
}

function revokeObjectUrls() {
  objectUrls.forEach(url => URL.revokeObjectURL(url));
  objectUrls = [];
}

// =============================================
// TOAST NOTIFICATIONS
// =============================================
function showToast(message) {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.style.cssText = `
      position: fixed;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%) translateY(100px);
      background: #2c2416;
      color: white;
      padding: 12px 24px;
      border-radius: 100px;
      font-family: 'Inter', sans-serif;
      font-size: 0.9rem;
      font-weight: 500;
      z-index: 9999;
      transition: transform 0.3s ease;
      box-shadow: 0 8px 30px rgba(0,0,0,0.2);
      white-space: nowrap;
    `;
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.style.transform = 'translateX(-50%) translateY(0)';

  clearTimeout(toast._timeout);
  toast._timeout = setTimeout(() => {
    toast.style.transform = 'translateX(-50%) translateY(100px)';
  }, 2500);
}

// =============================================
// LIVE PREVIEW
// =============================================
function updatePreview() {
  const frame = document.getElementById('previewFrame');
  if (!frame) return;

  if (!selectedTemplate) {
    frame.innerHTML = `
      <div class="preview-placeholder">
        <div class="preview-placeholder-icon">💌</div>
        <p>Your message preview will appear here</p>
      </div>
    `;
    return;
  }

  const theme = templateThemes[selectedTemplate] || templateThemes['just-for-you'];
  const config = templateTypes[selectedTemplate];
  const recipientName = (document.getElementById('recipientName')?.value || '').trim();
  const senderName = (document.getElementById('senderName')?.value || '').trim();
  const message = document.getElementById('message')?.value || '';

  const displayMedia = selectedFiles.slice(0, 4);

  frame.innerHTML = `
    <div class="preview-content">
      <div class="preview-header" style="background: ${theme.previewBg}">
        <div class="preview-template-icon ${theme.animation === 'heartPulse' ? 'heart-pulse' : ''}">${getTemplateIcon(selectedTemplate)}</div>
        <div class="preview-template-title">${config ? config.name : ''}</div>
        ${recipientName ? `<div class="preview-recipient">Dear ${escapeHtml(recipientName)}</div>` : ''}
      </div>
      <div class="preview-body">
        <div class="preview-message-box">
          <div class="preview-message-text">${escapeHtml(message) || '<em style="color: var(--color-text-muted)">Your message will appear here...</em>'}</div>
          ${senderName ? `<div class="preview-sender">— ${escapeHtml(senderName)}</div>` : ''}
        </div>
        ${displayMedia.length > 0 ? `
          <div class="preview-media">
            ${displayMedia.map(file => {
              if (file.type.startsWith('image/')) {
                return `<div class="preview-media-item"><img src="${URL.createObjectURL(file)}" alt="Preview"></div>`;
              }
              return '';
            }).join('')}
          </div>
        ` : ''}
      </div>
      <div class="preview-footer">Made with Writele</div>
    </div>
  `;
}

function getTemplateIcon(type) {
  const icons = {
    'marry-me': '💍',
    'sorry': '😔',
    'love': '❤️',
    'will-you-date': '💕',
    'happy-anniversary': '🎉',
    'just-for-you': '✨'
  };
  return icons[type] || '✨';
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// =============================================
// FORM SUBMISSION
// =============================================
async function handleFormSubmit(e) {
  e.preventDefault();

  if (!selectedTemplate) {
    showToast('Please select a template type');
    return;
  }

  const message = document.getElementById('message').value.trim();
  if (!message) {
    showToast('Please write your message');
    return;
  }

  let pin;
  if (pinMode === 'custom') {
    const customPinInput = document.getElementById('customPin');
    pin = (customPinInput ? customPinInput.value : '').trim();
    if (!WritleCrypto.isValidPin(pin)) {
      showToast('Your custom PIN must be exactly 6 digits');
      return;
    }
  } else {
    pin = WritleCrypto.generatePin();
  }

  const submitBtn = document.getElementById('submitBtn');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Creating...';

  try {
    const videoCount = selectedFiles.filter(f => f.type.startsWith('video/')).length;
    if (videoCount > 0) {
      showToast('Videos stay in your preview only — they can\'t be added to the link');
    }

    const media = await buildMediaPayload(selectedFiles);

    const dataObj = {
      type: selectedTemplate,
      message,
      senderName: document.getElementById('senderName').value.trim(),
      recipientName: document.getElementById('recipientName').value.trim(),
      media,
      createdAt: new Date().toISOString()
    };

    const expiresAt = Date.now() + LINK_EXPIRY_MS;
    const encoded = await WritleCrypto.encrypt(pin, dataObj, expiresAt);
    const shareUrl = `${window.location.origin}/view.html#d=${encoded}`;

    if (encoded.length > 400000) {
      showToast('Your link is quite large — consider fewer photos for easier sharing');
    }

    showSuccess(shareUrl, pin, expiresAt);
  } catch (error) {
    console.error('Error creating message:', error);
    showToast('Failed to create your message. Please try again.');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Create Message ✨';
  }
}

// Converts up to MAX_LINK_PHOTOS selected images into compressed, embeddable
// base64 payloads. Videos are intentionally skipped — there is no server to
// store them, and a raw video is far too large to live inside a URL.
async function buildMediaPayload(files) {
  const images = files.filter(f => f.type.startsWith('image/')).slice(0, MAX_LINK_PHOTOS);
  const results = [];
  for (const file of images) {
    try {
      const data = await compressImageToBase64(file, PHOTO_MAX_DIMENSION, PHOTO_JPEG_QUALITY);
      results.push({ type: 'image', mime: 'image/jpeg', data });
    } catch (err) {
      console.error('Failed to process image', file.name, err);
    }
  }
  return results;
}

function compressImageToBase64(file, maxDimension, quality) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      let { width, height } = img;
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round(height * (maxDimension / width));
          width = maxDimension;
        } else {
          width = Math.round(width * (maxDimension / height));
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      const dataUrl = canvas.toDataURL('image/jpeg', quality);
      URL.revokeObjectURL(url);
      resolve(dataUrl.split(',')[1]); // strip the data: prefix, keep base64 only
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not load image'));
    };

    img.src = url;
  });
}

// =============================================
// SUCCESS & SHARING
// =============================================
function showSuccess(shareUrl, pin, expiresAt) {
  currentShareUrl = shareUrl;
  currentPin = pin;

  document.getElementById('shareLink').value = shareUrl;
  document.getElementById('pinDisplayValue').textContent = pin;

  const expiryNote = document.getElementById('expiryNote');
  if (expiryNote) expiryNote.textContent = 'The link expires in 1 hour.';

  document.getElementById('creationForm').classList.add('hidden');
  document.getElementById('successSection').classList.remove('hidden');

  document.getElementById('successSection').scrollIntoView({ behavior: 'smooth', block: 'start' });

  // Re-trigger success animation
  const iconWrap = document.querySelector('.success-icon-wrap');
  const icon = document.querySelector('.success-icon');
  if (iconWrap) {
    iconWrap.style.animation = 'none';
    iconWrap.offsetHeight;
    iconWrap.style.animation = '';
  }
  if (icon) {
    icon.style.animation = 'none';
    icon.offsetHeight;
    icon.style.animation = '';
  }
}

function copyText(text) {
  return new Promise((resolve) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => resolve(true)).catch(() => resolve(fallbackCopyText(text)));
    } else {
      resolve(fallbackCopyText(text));
    }
  });
}

function fallbackCopyText(text) {
  const temp = document.createElement('textarea');
  temp.value = text;
  temp.style.position = 'fixed';
  temp.style.opacity = '0';
  document.body.appendChild(temp);
  temp.focus();
  temp.select();
  let success = false;
  try {
    success = document.execCommand('copy');
  } catch (e) {
    success = false;
  }
  document.body.removeChild(temp);
  return success;
}

function flashCopied(btn) {
  if (!btn) return;
  const original = btn.textContent;
  btn.textContent = 'Copied!';
  btn.classList.add('copied');
  setTimeout(() => {
    btn.textContent = original;
    btn.classList.remove('copied');
  }, 2000);
}

async function copyLink() {
  const ok = await copyText(currentShareUrl);
  if (ok) flashCopied(document.getElementById('copyLinkBtn'));
  else showToast('Please copy the link manually');
}

async function copyPin() {
  const ok = await copyText(currentPin);
  if (ok) flashCopied(document.getElementById('copyPinBtn'));
  else showToast('Please copy the PIN manually');
}

async function copyDetails() {
  const details = `💌 I made something special for you on Writele.\n\nOpen your message:\n${currentShareUrl}\n\n🔐 PIN: ${currentPin}\n\n⏰ This link expires in 1 hour.`;
  const ok = await copyText(details);
  if (ok) flashCopied(document.getElementById('copyDetailsBtn'));
  else showToast('Please copy the details manually');
}

function shareWhatsApp() {
  const text = encodeURIComponent(
    `I have a special message for you 💌 I'll send you the PIN separately.\n\nOpen it here: ${currentShareUrl}`
  );
  window.open(`https://wa.me/?text=${text}`, '_blank', 'noopener');
}

function shareNative() {
  const data = {
    title: 'A special message for you',
    text: 'Someone sent you a beautiful, PIN-protected message on Writele',
    url: currentShareUrl
  };

  if (navigator.share) {
    navigator.share(data).catch(() => {});
  } else {
    copyLink();
    showToast('Link copied — share it anywhere!');
  }
}

// =============================================
// RESET / CREATE ANOTHER
// =============================================
function resetForm() {
  document.getElementById('messageForm').reset();
  document.getElementById('charCount').textContent = '0';
  selectedFiles = [];
  revokeObjectUrls();
  updateFilePreview();
  selectedTemplate = null;
  currentShareUrl = '';
  currentPin = '';

  pinMode = 'auto';
  document.querySelectorAll('.pin-mode-btn').forEach(b => {
    const isAuto = b.dataset.mode === 'auto';
    b.classList.toggle('active', isAuto);
    b.setAttribute('aria-selected', isAuto ? 'true' : 'false');
  });
  const customPinWrap = document.getElementById('customPinWrap');
  if (customPinWrap) customPinWrap.classList.add('hidden');

  document.querySelectorAll('.template-card').forEach(card => {
    card.classList.remove('selected');
  });

  document.getElementById('creationForm').classList.add('hidden');
  document.getElementById('formPlaceholder').classList.remove('hidden');
  document.getElementById('successSection').classList.add('hidden');

  resetSteps();

  document.getElementById('previewFrame').innerHTML = `
    <div class="preview-placeholder">
      <div class="preview-placeholder-icon">💌</div>
      <p>Your message preview will appear here</p>
    </div>
  `;
}

function createAnother() {
  resetForm();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
