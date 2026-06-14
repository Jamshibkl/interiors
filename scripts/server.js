const express = require('express');
const path = require('path');
const fs = require('fs/promises');

const app = express();
const PORT = process.env.PORT || 3000;
const ROOT = path.join(__dirname, '..'); // project root (this file lives in /scripts)
const SUBMISSIONS_FILE = path.join(ROOT, 'submissions.json');
const FRONTEND_FILE = path.join(ROOT, 'index.html');

app.use(express.json());
app.use(express.static(ROOT));

async function readSubmissions() {
  try {
    const raw = await fs.readFile(SUBMISSIONS_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    return [];
  }
}

async function saveSubmission(type, payload) {
  const submissions = await readSubmissions();
  submissions.push({
    type,
    payload,
    receivedAt: new Date().toISOString()
  });
  await fs.writeFile(SUBMISSIONS_FILE, JSON.stringify(submissions, null, 2), 'utf8');
}

function validateRequest(body) {
  return body && body.name && body.phone;
}

app.get('/', (req, res) => {
  res.sendFile(FRONTEND_FILE);
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.post('/api/contact', async (req, res) => {
  if (!validateRequest(req.body)) {
    return res.status(400).json({ error: 'Name and phone number are required.' });
  }

  try {
    await saveSubmission('contact', req.body);
    console.log('New contact request:', req.body.name, req.body.phone, req.body.projectType || 'no project type');
    return res.json({ success: true });
  } catch (error) {
    console.error('Contact save failed:', error);
    return res.status(500).json({ error: 'Unable to save contact request.' });
  }
});

app.post('/api/quote', async (req, res) => {
  if (!validateRequest(req.body)) {
    return res.status(400).json({ error: 'Name and phone number are required.' });
  }

  try {
    await saveSubmission('quote', req.body);
    console.log('New quote request:', req.body.name, req.body.phone, req.body.projectType || 'no project type');
    return res.json({ success: true });
  } catch (error) {
    console.error('Quote save failed:', error);
    return res.status(500).json({ error: 'Unable to save quote request.' });
  }
});

app.listen(PORT, () => {
  console.log(`Backend running: http://localhost:${PORT}`);
});
