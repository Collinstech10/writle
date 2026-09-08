const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

const UPLOAD_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const ALLOWED_MIME_TYPES = /jpeg|jpg|png|gif|mp4|webm|ogg|mov|avi|wmv|flv|mkv/;

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOAD_DIR);
  },
  filename: function (req, file, cb) {
    const uniqueName = crypto.randomUUID() + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: function (req, file, cb) {
    const extname = ALLOWED_MIME_TYPES.test(path.extname(file.originalname).toLowerCase());
    const mimetype = ALLOWED_MIME_TYPES.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Only image and video files are allowed'));
    }
  }
});

const templateTypes = {
  'marry-me': {
    name: 'Will You Marry Me?',
    theme: 'romantic',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    icon: '💍'
  },
  'sorry': {
    name: 'I Am Sorry',
    theme: 'apology',
    background: 'linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)',
    icon: '😔'
  },
  'love': {
    name: 'I Love You',
    theme: 'love',
    background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    icon: '❤️'
  },
  'will-you-date': {
    name: 'Will You Date Me?',
    theme: 'dating',
    background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    icon: '💕'
  },
  'happy-anniversary': {
    name: 'Happy Anniversary',
    theme: 'celebration',
    background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    icon: '🎉'
  },
  'just-for-you': {
    name: 'Special Message',
    theme: 'special',
    background: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
    icon: '✨'
  }
};

const templates = new Map();

const isUuid = (id) => /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(UPLOAD_DIR));

app.get('/api/template-types', (req, res) => {
  res.json(templateTypes);
});

app.post('/api/create', upload.array('media', 10), (req, res) => {
  try {
    const { type, message, senderName, recipientName } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, error: 'Message is required' });
    }

    if (!type || !templateTypes[type]) {
      return res.status(400).json({ success: false, error: 'Invalid template type' });
    }

    const id = crypto.randomUUID();

    const mediaFiles = req.files ? req.files.map(file => {
      const relativePath = path.relative(__dirname, file.path).replace(/\\/g, '/');
      return {
        url: '/' + relativePath,
        type: file.mimetype.startsWith('image/') ? 'image' : 'video',
        filename: file.filename
      };
    }) : [];

    const template = {
      id,
      type,
      message: message.trim(),
      senderName: (senderName || '').trim(),
      recipientName: (recipientName || '').trim(),
      media: mediaFiles,
      createdAt: new Date().toISOString(),
      templateConfig: templateTypes[type]
    };

    templates.set(id, template);

    res.json({
      success: true,
      id,
      shareUrl: `/${id}`,
      template
    });
  } catch (error) {
    console.error('Error creating template:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/template/:id', (req, res) => {
  const template = templates.get(req.params.id);
  if (!template) {
    return res.status(404).json({ success: false, error: 'Template not found' });
  }
  res.json({ success: true, template });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/:id', (req, res) => {
  if (!isUuid(req.params.id)) {
    return res.status(404).sendFile(path.join(__dirname, 'public', 'index.html'));
  }
  res.sendFile(path.join(__dirname, 'public', 'view.html'));
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  if (req.xhr || req.headers.accept?.includes('application/json')) {
    res.status(500).json({ success: false, error: 'Something went wrong!' });
  } else {
    res.status(500).send('Something went wrong!');
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
