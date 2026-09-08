// =============================================
// WRITLE — Enhanced Frontend Logic
// =============================================

// --- State ---
let selectedTemplate = null;
let selectedFiles = [];
let objectUrls = [];
let templateTypes = {};
let currentStep = 1;
const totalSteps = 3;

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
async function loadTemplateTypes() {
  try {
    const response = await fetch('/api/template-types');
    templateTypes = await response.json();
    renderTemplateGrid();
  } catch (error) {
    console.error('Error loading template types:', error);
  }
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
  const copyBtn = document.getElementById('copyBtn');
  const createAnotherBtn = document.getElementById('createAnotherBtn');
  const whatsappBtn = document.getElementById('whatsappBtn');
  const nativeShareBtn = document.getElementById('nativeShareBtn');

  if (prevBtn) prevBtn.addEventListener('click', prevStep);
  if (nextBtn) nextBtn.addEventListener('click', nextStep);
  if (copyBtn) copyBtn.addEventListener('click', copyLink);
  if (createAnotherBtn) createAnotherBtn.addEventListener('click', createAnother);
  if (whatsappBtn) whatsappBtn.addEventListener('click', shareWhatsApp);
  if (nativeShareBtn) nativeShareBtn.addEventListener('click', shareNative);
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

  const formData = new FormData();
  formData.append('type', selectedTemplate);
  formData.append('message', document.getElementById('message').value);
  formData.append('senderName', document.getElementById('senderName').value);
  formData.append('recipientName', document.getElementById('recipientName').value);

  selectedFiles.forEach(file => {
    formData.append('media', file);
  });

  const submitBtn = document.getElementById('submitBtn');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Creating...';

  try {
    const response = await fetch('/api/create', {
      method: 'POST',
      body: formData
    });

    const data = await response.json();

    if (data.success) {
      showSuccess(data.shareUrl);
    } else {
      showToast('Error: ' + data.error);
    }
  } catch (error) {
    console.error('Error creating template:', error);
    showToast('Failed to create message. Please try again.');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Create Message ✨';
  }
}

// =============================================
// SUCCESS & SHARING
// =============================================
function showSuccess(shareUrl) {
  const fullUrl = window.location.origin + shareUrl;
  document.getElementById('shareLink').value = fullUrl;

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

function copyLink() {
  const linkInput = document.getElementById('shareLink');
  const url = linkInput.value;

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(url).then(() => {
      setCopySuccess();
    }).catch(() => {
      fallbackCopy();
    });
  } else {
    fallbackCopy();
  }
}

function fallbackCopy() {
  const linkInput = document.getElementById('shareLink');
  linkInput.select();
  linkInput.setSelectionRange(0, 99999);

  try {
    const success = document.execCommand('copy');
    if (success) setCopySuccess();
  } catch (e) {
    showToast('Please copy the link manually');
  }
}

function setCopySuccess() {
  const btn = document.getElementById('copyBtn');
  const original = btn.textContent;
  btn.textContent = 'Copied!';
  btn.style.background = '#27ae60';
  setTimeout(() => {
    btn.textContent = original;
    btn.style.background = '';
  }, 2000);
}

function shareWhatsApp() {
  const url = document.getElementById('shareLink').value;
  const text = encodeURIComponent('I have a special message for you 💌 ' + url);
  window.open(`https://wa.me/?text=${text}`, '_blank', 'noopener');
}

function shareNative() {
  const url = document.getElementById('shareLink').value;
  const data = {
    title: 'A special message for you',
    text: 'Someone sent you a beautiful message on Writele',
    url: url
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
