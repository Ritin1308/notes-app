const express = require('express');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
const JWT_SECRET = 'your-secret-key';

// Enable CORS for all origins
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

console.log('Starting Notes API Server...');

// In-memory data
const users = [
  { id: 1, email: 'admin@acme.test', role: 'Admin', tenantSlug: 'acme' },
  { id: 2, email: 'user@acme.test', role: 'Member', tenantSlug: 'acme' },
  { id: 3, email: 'admin@globex.test', role: 'Admin', tenantSlug: 'globex' },
  { id: 4, email: 'user@globex.test', role: 'Member', tenantSlug: 'globex' }
];

const tenants = {
  acme: { slug: 'acme', name: 'Acme Corp', plan: 'Free' },
  globex: { slug: 'globex', name: 'Globex Corporation', plan: 'Free' }
};

let notes = [];
let noteIdCounter = 1;

// Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'Admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Routes
app.get('/health', (req, res) => {
  console.log('Health check requested');
  res.json({ status: 'ok' });
});

app.post('/auth/login', (req, res) => {
  console.log('Login attempt:', req.body);
  
  const { email, password } = req.body;
  
  const user = users.find(u => u.email === email);
  if (!user) {
    console.log('User not found:', email);
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // Simple password check
  if (password !== 'password') {
    console.log('Invalid password for:', email);
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign({
    id: user.id,
    email: user.email,
    role: user.role,
    tenantSlug: user.tenantSlug
  }, JWT_SECRET, { expiresIn: '24h' });

  console.log('Login successful for:', email);
  res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      tenantSlug: user.tenantSlug
    }
  });
});

app.get('/auth/me', authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

app.post('/tenants/:slug/upgrade', authenticateToken, requireAdmin, (req, res) => {
  const { slug } = req.params;
  
  if (req.user.tenantSlug !== slug) {
    return res.status(403).json({ error: 'Cannot upgrade other tenants' });
  }

  if (!tenants[slug]) {
    return res.status(404).json({ error: 'Tenant not found' });
  }

  tenants[slug].plan = 'Pro';
  console.log(`Tenant ${slug} upgraded to Pro`);
  res.json({ message: 'Subscription upgraded to Pro', tenant: tenants[slug] });
});

app.get('/tenants/:slug', authenticateToken, (req, res) => {
  const { slug } = req.params;
  
  if (req.user.tenantSlug !== slug) {
    return res.status(403).json({ error: 'Access denied' });
  }

  res.json(tenants[slug]);
});

app.post('/notes', authenticateToken, (req, res) => {
  const { title, content } = req.body;
  const tenantSlug = req.user.tenantSlug;
  
  // Check note limit for Free plan
  if (tenants[tenantSlug].plan === 'Free') {
    const tenantNotes = notes.filter(note => note.tenantSlug === tenantSlug);
    if (tenantNotes.length >= 3) {
      return res.status(403).json({ 
        error: 'Note limit reached. Upgrade to Pro for unlimited notes.' 
      });
    }
  }

  const note = {
    id: noteIdCounter++,
    title,
    content,
    tenantSlug,
    createdBy: req.user.id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  notes.push(note);
  console.log(`Note created for tenant ${tenantSlug}:`, note.id);
  res.status(201).json(note);
});

app.get('/notes', authenticateToken, (req, res) => {
  const tenantNotes = notes.filter(note => note.tenantSlug === req.user.tenantSlug);
  res.json(tenantNotes);
});

app.get('/notes/:id', authenticateToken, (req, res) => {
  const noteId = parseInt(req.params.id);
  const note = notes.find(n => n.id === noteId && n.tenantSlug === req.user.tenantSlug);
  
  if (!note) {
    return res.status(404).json({ error: 'Note not found' });
  }
  
  res.json(note);
});

app.put('/notes/:id', authenticateToken, (req, res) => {
  const noteId = parseInt(req.params.id);
  const { title, content } = req.body;
  
  const noteIndex = notes.findIndex(n => n.id === noteId && n.tenantSlug === req.user.tenantSlug);
  
  if (noteIndex === -1) {
    return res.status(404).json({ error: 'Note not found' });
  }

  notes[noteIndex] = {
    ...notes[noteIndex],
    title,
    content,
    updatedAt: new Date().toISOString()
  };

  res.json(notes[noteIndex]);
});

app.delete('/notes/:id', authenticateToken, (req, res) => {
  const noteId = parseInt(req.params.id);
  
  const noteIndex = notes.findIndex(n => n.id === noteId && n.tenantSlug === req.user.tenantSlug);
  
  if (noteIndex === -1) {
    return res.status(404).json({ error: 'Note not found' });
  }

  notes.splice(noteIndex, 1);
  console.log(`Note ${noteId} deleted`);
  res.json({ message: 'Note deleted successfully' });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`✅ Server running on http://localhost:${port}`);
  console.log('Available endpoints:');
  console.log('- GET  /health');
  console.log('- POST /auth/login');
  console.log('- GET  /notes');
  console.log('- POST /notes');
  console.log('Ready for connections!');
});

module.exports = app;