const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const memoryStore = new Map();
let kv;

try {
  ({ kv } = require('@vercel/kv'));
} catch (error) {
  console.warn('Vercel KV not configured; using in-memory fallback for local development.');
  kv = {
    async get(key) {
      return memoryStore.has(key) ? memoryStore.get(key) : null;
    },
    async set(key, value) {
      memoryStore.set(key, value);
      return value;
    }
  };
}

const app = express();
const PORT = process.env.PORT || 3000;

// Resolve public directory — in Vercel serverless functions the included
// files land under <root>/src/public, whereas locally __dirname is src/
const candidatePaths = [
  path.join(__dirname, 'src', 'public'),
  path.join(__dirname, 'public')
];
const PUBLIC_DIR = candidatePaths.find(p => fs.existsSync(p)) || candidatePaths[0];

const ALLOWED_EXTENSIONS = [
  '.jpeg', '.jpg', '.png', '.gif',
  '.mp4', '.webm', '.ogg', '.mov', '.avi', '.wmv', '.flv', '.mkv'
];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ALLOWED_EXTENSIONS.includes(ext)) {
      return cb(null, true);
    }
    cb(new Error('Only image and video files are allowed'));
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

const isUuid = (id) => /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);

app.use(express.json());
app.use(express.static(PUBLIC_DIR));

// Serve previously uploaded media from KV
app.get('/uploads/:filename', async (req, res) => {
  try {
    const fileRecord = await kv.get(`file:${req.params.filename}`);
    if (!fileRecord) {
      return res.status(404).send('File not found');
    }
    res.set('Content-Type', fileRecord.contentType);
    res.set('Content-Length', fileRecord.size);
    res.send(Buffer.from(fileRecord.data, 'base64'));
  } catch (err) {
    console.error('Error serving file:', err);
    res.status(500).send('Error retrieving file');
  }
});

app.get('/api/template-types', (req, res) => {
  res.json(templateTypes);
});

app.post('/api/create', upload.array('media', 10), async (req, res) => {
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
      const filename = crypto.randomUUID() + path.extname(file.originalname);
      // Persist uploaded file to KV as base64
      kv.set(`file:${filename}`, {
        data: file.buffer.toString('base64'),
        contentType: file.mimetype,
        size: file.size,
        originalName: file.originalname
      });
      return {
        url: `/uploads/${filename}`,
        type: file.mimetype.startsWith('image/') ? 'image' : 'video',
        filename: filename
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

    await kv.set(`template:${id}`, template);

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

app.get('/api/template/:id', async (req, res) => {
  try {
    const template = await kv.get(`template:${req.params.id}`);
    if (!template) {
      return res.status(404).json({ success: false, error: 'Template not found' });
    }
    res.json({ success: true, template });
  } catch (error) {
    console.error('Error fetching template:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

app.get('/:id', (req, res) => {
  if (!isUuid(req.params.id)) {
    return res.status(404).sendFile(path.join(PUBLIC_DIR, 'index.html'));
  }
  res.sendFile(path.join(PUBLIC_DIR, 'view.html'));
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  if (req.headers.accept?.includes('application/json') || req.xhr) {
    res.status(500).json({ success: false, error: 'Something went wrong!' });
  } else {
    res.status(500).send('Something went wrong!');
  }
});

// Export the Express app for @vercel/node
module.exports = app;

// Only start a local server when running outside Vercel
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
