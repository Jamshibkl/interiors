const express = require('express');
const path = require('path');
const fs = require('fs/promises');
const https = require('https');

// Google Apps Script endpoint — same as SHEET_ENDPOINT in js/app.js
const SHEET_ENDPOINT = 'https://script.google.com/macros/s/AKfycbwnVtWUmTDKFu-wWc1BAaSLC-EDDAt6dlc68g28Q_sbpIN5tFL3C1yqIdkIc6e0kDRs/exec';
// Direct public Google Sheet CSV export URL
const GOOGLE_SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/1v6Jl09sf7cTkmeATFVHvuFkYf2LtsgCGKseHyHAkdeU/export?format=csv&gid=585954869';

function fetchUrl(targetUrl) {
  return new Promise((resolve, reject) => {
    https.get(targetUrl, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchUrl(res.headers.location).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error('HTTP status ' + res.statusCode));
      }
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

function postToSheet(body) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const url = new URL(SHEET_ENDPOINT);
    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
        'Content-Length': Buffer.byteLength(payload)
      }
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch(e) { resolve({ ok: true }); }
      });
    });
    req.on('error', (err) => {
      console.warn('Sheet POST warning:', err.message);
      resolve({ ok: false, error: err.message });
    });
    req.on('response', (res) => {
      if (res.statusCode === 302 || res.statusCode === 301) {
        const location = res.headers['location'];
        if (location) {
          https.get(location, (r2) => {
            let d2 = '';
            r2.on('data', c => { d2 += c; });
            r2.on('end', () => {
              try { resolve(JSON.parse(d2)); }
              catch(e) { resolve({ ok: true }); }
            });
          }).on('error', () => resolve({ ok: true }));
        }
      }
    });
    req.write(payload);
    req.end();
  });
}

function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    const next = text[i+1];
    if (inQuotes) {
      if (c === '"' && next === '"') {
        field += '"';
        i++;
      } else if (c === '"') {
        inQuotes = false;
      } else {
        field += c;
      }
    } else {
      if (c === '"') {
        inQuotes = true;
      } else if (c === ',') {
        row.push(field);
        field = '';
      } else if (c === '\n' || (c === '\r' && next === '\n')) {
        row.push(field);
        rows.push(row);
        row = [];
        field = '';
        if (c === '\r') i++;
      } else if (c !== '\r') {
        field += c;
      }
    }
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

function parseSheetLead(row, index) {
  const [received, form, name, phone, location, projectType, rawMessage, whatsappOptIn, status, notes] = row;
  
  const msg = rawMessage || '';
  let email = '';
  let budget = '';
  let designTheme = '';
  let portfolio = '';
  let cleanMsgLines = [];

  const lines = msg.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (/^Email:\s*(.+)$/i.test(trimmed)) {
      email = trimmed.match(/^Email:\s*(.+)$/i)[1].trim();
    } else if (/^Budget:\s*(.+)$/i.test(trimmed)) {
      budget = trimmed.match(/^Budget:\s*(.+)$/i)[1].trim();
    } else if (/^Design theme:\s*(.+)$/i.test(trimmed)) {
      designTheme = trimmed.match(/^Design theme:\s*(.+)$/i)[1].trim();
    } else if (/^Portfolio:\s*(.+)$/i.test(trimmed)) {
      portfolio = trimmed.match(/^Portfolio:\s*(.+)$/i)[1].trim();
    } else {
      cleanMsgLines.push(trimmed);
    }
  }

  if (!email) {
    const emailMatch = msg.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    if (emailMatch) email = emailMatch[1];
  }

  let cleanLoc = (location || '').trim();
  if (cleanLoc === ',' || cleanLoc === ', ' || cleanLoc === '—') cleanLoc = '';

  let cleanProj = (projectType || '').trim();
  if (cleanProj === ',' || cleanProj === ', ' || cleanProj === '—') cleanProj = 'Full home interior';

  let type = 'quote';
  const fLower = (form || '').toLowerCase();
  if (fLower.includes('contact')) type = 'contact';
  else if (fLower.includes('job') || fLower.includes('career')) type = 'career';

  let receivedAt = new Date().toISOString();
  if (received) {
    const parsedDate = new Date(received);
    if (!isNaN(parsedDate.getTime())) {
      receivedAt = parsedDate.toISOString();
    }
  }

  let finalMsg = cleanMsgLines.join('\n').trim();
  if (portfolio) {
    finalMsg = (finalMsg ? finalMsg + '\n' : '') + 'Portfolio: ' + portfolio;
  }

  return {
    id: 'lead_sheet_' + (index + 1) + '_' + (phone ? phone.replace(/\D/g,'').slice(-6) : Math.random().toString(36).slice(2,7)),
    type: type,
    receivedAt: receivedAt,
    status: (status && status.trim()) ? status.trim() : 'New',
    notes: (notes || '').trim(),
    sheetRow: index + 2,
    payload: {
      name: (name || 'Lead #' + (index + 1)).trim(),
      phone: (phone || '').trim(),
      email: email,
      location: cleanLoc,
      projectType: cleanProj,
      budget: budget,
      designTheme: designTheme,
      message: finalMsg,
      whatsappOptIn: (whatsappOptIn || '').toLowerCase() === 'yes',
      formLabel: (form || 'Quote request').trim()
    }
  };
}

const app = express();
const PORT = process.env.PORT || 3000;
const ROOT = path.join(__dirname, '..'); // project root
const SUBMISSIONS_FILE = path.join(ROOT, 'submissions.json');
const FRONTEND_FILE = path.join(ROOT, 'index.html');
const ADMIN_FILE = path.join(ROOT, 'admin.html');
const LEADS_DASHBOARD_FILE = path.join(ROOT, 'leads.html');
const LEADS_LIST_FILE = path.join(ROOT, 'leads-list.html');
const LEADS_NEW_FILE = path.join(ROOT, 'leads-new.html');
const LEADS_PIPELINE_FILE = path.join(ROOT, 'leads-pipeline.html');
const GALLERY_FILE = path.join(ROOT, 'gallery.json');
const UPLOADS_DIR = path.join(ROOT, 'assets', 'uploads');
const PUBLIC_DIR = path.join(ROOT, 'public');
const PUBLIC_GALLERY_FILE = path.join(PUBLIC_DIR, 'gallery.json');
const PUBLIC_SUBMISSIONS_FILE = path.join(PUBLIC_DIR, 'submissions.json');
const PUBLIC_UPLOADS_DIR = path.join(PUBLIC_DIR, 'assets', 'uploads');

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static(ROOT));

async function ensureGalleryStorage() {
  try { await fs.mkdir(UPLOADS_DIR, { recursive: true }); } catch (e) {}
  try {
    const hasPub = await fs.stat(PUBLIC_DIR).then(s => s.isDirectory()).catch(() => false);
    if (hasPub) {
      await fs.mkdir(PUBLIC_UPLOADS_DIR, { recursive: true });
    }
  } catch (e) {}
}

async function readGallery() {
  try {
    const raw = await fs.readFile(GALLERY_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    return [];
  }
}

async function saveGallery(items) {
  const data = JSON.stringify(items, null, 2);
  await fs.writeFile(GALLERY_FILE, data, 'utf8');
  try {
    const hasPub = await fs.stat(PUBLIC_DIR).then(s => s.isDirectory()).catch(() => false);
    if (hasPub) {
      await fs.writeFile(PUBLIC_GALLERY_FILE, data, 'utf8');
    }
  } catch (e) {}
}

async function saveSubmissionsList(submissions) {
  const data = JSON.stringify(submissions, null, 2);
  await fs.writeFile(SUBMISSIONS_FILE, data, 'utf8');
  try {
    const hasPub = await fs.stat(PUBLIC_DIR).then(s => s.isDirectory()).catch(() => false);
    if (hasPub) {
      await fs.writeFile(PUBLIC_SUBMISSIONS_FILE, data, 'utf8');
    }
  } catch (e) {}
}

async function readSubmissions() {
  try {
    const raw = await fs.readFile(SUBMISSIONS_FILE, 'utf8');
    const items = JSON.parse(raw);
    if (Array.isArray(items) && items.length > 0) {
      return items;
    }
  } catch (error) {}
  // If empty or missing, sync from Google Sheet
  return await syncFromGoogleSheet();
}

async function syncFromGoogleSheet() {
  try {
    console.log('Syncing leads from Google Sheets CSV:', GOOGLE_SHEET_CSV_URL);
    const csv = await fetchUrl(GOOGLE_SHEET_CSV_URL);
    const rows = parseCSV(csv);
    if (!rows || rows.length < 2) {
      throw new Error('No rows found in sheet');
    }

    // Existing local submissions (to retain any manual notes / status updates)
    let existing = [];
    try {
      const raw = await fs.readFile(SUBMISSIONS_FILE, 'utf8');
      existing = JSON.parse(raw) || [];
    } catch(e) {}

    const existingMap = new Map();
    existing.forEach(item => {
      // Key by sheetRow or (phone + name)
      if (item.sheetRow) existingMap.set('row_' + item.sheetRow, item);
      const key2 = (item.payload?.phone || '') + '_' + (item.payload?.name || '');
      if (key2 !== '_') existingMap.set('contact_' + key2, item);
    });

    const parsedSheetLeads = rows.slice(1).map((r, i) => parseSheetLead(r, i));
    // Apply existing status & notes to keep user modifications
    const updatedSheetLeads = parsedSheetLeads.map(lead => {
      const match = existingMap.get('row_' + lead.sheetRow) ||
                    existingMap.get('contact_' + (lead.payload.phone + '_' + lead.payload.name));
      if (match) {
        lead.status = match.status || lead.status;
        lead.notes = match.notes || lead.notes;
        lead.id = match.id || lead.id;
      }
      return lead;
    });

    // Also keep purely manual / local leads that haven't been pushed to the sheet yet
    const manualLeads = existing.filter(item => item.type === 'manual' && !item.sheetRow);

    // Sort newest first
    const merged = [...manualLeads, ...updatedSheetLeads.reverse()];
    await saveSubmissionsList(merged);
    console.log(`Synced ${merged.length} leads successfully (${updatedSheetLeads.length} from sheet).`);
    return merged;
  } catch (err) {
    console.error('Google Sheet sync failed:', err.message);
    try {
      const raw = await fs.readFile(SUBMISSIONS_FILE, 'utf8');
      return JSON.parse(raw);
    } catch (e) {
      return [];
    }
  }
}

async function saveSubmission(type, payload) {
  const submissions = await readSubmissions();
  const newLead = {
    id: 'lead_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
    type: type || 'quote',
    receivedAt: new Date().toISOString(),
    status: 'New',
    notes: (payload.notes || '').trim(),
    payload: {
      name: (payload.name || '').trim(),
      phone: (payload.phone || '').trim(),
      email: (payload.email || '').trim(),
      location: (payload.location || '').trim(),
      projectType: (payload.projectType || 'Full home interior').trim(),
      budget: (payload.budget || '').trim(),
      designTheme: (payload.designTheme || payload.theme || '').trim(),
      message: (payload.message || '').trim(),
      whatsappOptIn: !!payload.whatsappOptIn || payload.whatsapp === 'Yes',
      formLabel: payload.formLabel || (type === 'quote' ? 'Quote request' : 'Contact enquiry'),
      consultationDate: (payload.consultationDate || '').trim(),
      consultationTime: (payload.consultationTime || '').trim()
    }
  };

  submissions.unshift(newLead);
  await saveSubmissionsList(submissions);

  // Also post to Google Sheet endpoint in background
  try {
    postToSheet({
      form_type: newLead.payload.formLabel,
      name: newLead.payload.name,
      phone: newLead.payload.phone,
      location: newLead.payload.location || ', ',
      project_type: newLead.payload.projectType || ', ',
      message: [
        newLead.payload.designTheme ? 'Design theme: ' + newLead.payload.designTheme : '',
        newLead.payload.budget ? 'Budget: ' + newLead.payload.budget : '',
        newLead.payload.email ? 'Email: ' + newLead.payload.email : '',
        newLead.payload.message
      ].filter(Boolean).join('\n'),
      email: newLead.payload.email || ', ',
      budget: newLead.payload.budget || ', ',
      design_theme: newLead.payload.designTheme || ', ',
      whatsapp_optin: newLead.payload.whatsappOptIn ? 'Yes' : 'No',
      submitted_at: new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
    }).catch(() => {});
  } catch(e) {}

  return newLead;
}

function validateRequest(body) {
  return body && body.name && body.phone;
}

// ── PAGE ROUTES ──────────────────────────────────────────
app.get('/', (req, res) => res.sendFile(FRONTEND_FILE));
app.get('/admin', (req, res) => res.sendFile(ADMIN_FILE));
app.get('/leads', (req, res) => res.sendFile(LEADS_DASHBOARD_FILE));
app.get('/leads/dashboard', (req, res) => res.sendFile(LEADS_DASHBOARD_FILE));
app.get('/leads-list', (req, res) => res.sendFile(LEADS_LIST_FILE));
app.get('/leads/list', (req, res) => res.sendFile(LEADS_LIST_FILE));
app.get('/leads-pipeline', (req, res) => res.sendFile(LEADS_PIPELINE_FILE));
app.get('/leads/pipeline', (req, res) => res.sendFile(LEADS_PIPELINE_FILE));
app.get('/leads-new', (req, res) => res.sendFile(LEADS_NEW_FILE));
app.get('/leads/new', (req, res) => res.sendFile(LEADS_NEW_FILE));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.get('/api/reel-thumb', require('../api/reel-thumb'));

// ── GALLERY API ──────────────────────────────────────────
app.get('/api/gallery', async (req, res) => {
  try {
    const items = await readGallery();
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: 'Failed to read gallery items.' });
  }
});

app.post('/api/gallery/upload', async (req, res) => {
  try {
    await ensureGalleryStorage();
    const { title, subtitle, category, image, fileName, grad } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Image title / heading is required.' });
    }
    if (!category || !category.trim()) {
      return res.status(400).json({ error: 'Room category / heading is required.' });
    }
    if (!image) {
      return res.status(400).json({ error: 'Image file or URL is required.' });
    }

    let imagePath = '';
    if (image.startsWith('data:image/')) {
      const match = image.match(/^data:image\/([a-zA-Z0-9+.-]+);base64,(.+)$/);
      if (!match) return res.status(400).json({ error: 'Invalid base64 image data.' });

      let ext = match[1].toLowerCase();
      if (ext === 'jpeg') ext = 'jpg';
      if (ext.includes('+')) ext = ext.split('+')[0];

      const buffer = Buffer.from(match[2], 'base64');
      const safeBase = (fileName ? path.parse(fileName).name : 'gallery_img')
        .replace(/[^a-zA-Z0-9_-]/g, '_')
        .slice(0, 30);
      const uniqueFile = `img_${Date.now()}_${safeBase}.${ext}`;
      const destPath = path.join(UPLOADS_DIR, uniqueFile);

      await fs.writeFile(destPath, buffer);
      try {
        const hasPub = await fs.stat(PUBLIC_DIR).then(s => s.isDirectory()).catch(() => false);
        if (hasPub) {
          await fs.writeFile(path.join(PUBLIC_UPLOADS_DIR, uniqueFile), buffer);
        }
      } catch (e) {}

      imagePath = `assets/uploads/${uniqueFile}`;
    } else if (image.startsWith('http://') || image.startsWith('https://') || image.startsWith('assets/')) {
      imagePath = image.trim();
    } else {
      return res.status(400).json({ error: 'Unsupported image format.' });
    }

    const items = await readGallery();
    const newItem = {
      id: 'gal_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
      t: title.trim(),
      s: (subtitle || category).trim(),
      cat: category.trim(),
      img: imagePath,
      grad: grad || 'si1',
      custom: true,
      createdAt: new Date().toISOString()
    };

    const catIndex = items.findIndex(x => x.cat && x.cat.toLowerCase() === newItem.cat.toLowerCase());
    if (catIndex !== -1) {
      items.splice(catIndex, 0, newItem);
    } else {
      items.unshift(newItem);
    }

    await saveGallery(items);
    return res.json({ success: true, item: newItem, items });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to upload image: ' + error.message });
  }
});

app.delete('/api/gallery/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const items = await readGallery();
    const idx = items.findIndex(x => x.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Item not found in gallery.' });

    const item = items[idx];
    if (item.img && item.img.startsWith('assets/uploads/')) {
      const fname = path.basename(item.img);
      try { await fs.unlink(path.join(UPLOADS_DIR, fname)); } catch (e) {}
      try { await fs.unlink(path.join(PUBLIC_UPLOADS_DIR, fname)); } catch (e) {}
    }

    items.splice(idx, 1);
    await saveGallery(items);
    return res.json({ success: true, items });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to delete gallery item.' });
  }
});

// ── WEBSITE FORM SUBMISSIONS ─────────────────────────────
app.post('/api/contact', async (req, res) => {
  if (!validateRequest(req.body)) {
    return res.status(400).json({ error: 'Name and phone number are required.' });
  }
  try {
    const lead = await saveSubmission('contact', req.body);
    console.log('Website Contact Lead received:', req.body.name, req.body.phone);
    return res.json({ success: true, lead });
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
    const lead = await saveSubmission('quote', req.body);
    console.log('Website Quote Lead received:', req.body.name, req.body.phone, req.body.projectType);
    return res.json({ success: true, lead });
  } catch (error) {
    console.error('Quote save failed:', error);
    return res.status(500).json({ error: 'Unable to save quote request.' });
  }
});

// ── LEADS MANAGEMENT API ─────────────────────────────────
app.get('/api/leads', async (req, res) => {
  try {
    if (req.query.refresh === '1') {
      const refreshed = await syncFromGoogleSheet();
      return res.json(refreshed);
    }
    const leads = await readSubmissions();
    return res.json(leads);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to retrieve leads.' });
  }
});

app.get('/api/leads/sync', async (req, res) => {
  try {
    const leads = await syncFromGoogleSheet();
    return res.json({ success: true, total: leads.length, leads });
  } catch (err) {
    return res.status(500).json({ error: 'Sync failed: ' + err.message });
  }
});

app.post('/api/leads/sync', async (req, res) => {
  try {
    const leads = await syncFromGoogleSheet();
    return res.json({ success: true, total: leads.length, leads });
  } catch (err) {
    return res.status(500).json({ error: 'Sync failed: ' + err.message });
  }
});

app.post('/api/leads', async (req, res) => {
  try {
    const p = req.body.payload || req.body;
    if (!p.name || !p.phone) {
      return res.status(400).json({ error: 'Name and phone number are required.' });
    }

    const lead = await saveSubmission(req.body.type || 'manual', {
      name: p.name,
      phone: p.phone,
      email: p.email,
      location: p.location,
      projectType: p.projectType || 'Full home interior',
      budget: p.budget,
      designTheme: p.designTheme || p.theme,
      message: p.message,
      whatsappOptIn: !!p.whatsappOptIn || p.whatsapp === 'Yes',
      formLabel: p.formLabel || p.source || 'Manual entry',
      notes: req.body.notes || ''
    });

    if (req.body.status && req.body.status !== 'New') {
      lead.status = req.body.status;
      const submissions = await readSubmissions();
      const idx = submissions.findIndex(x => x.id === lead.id);
      if (idx !== -1) {
        submissions[idx].status = req.body.status;
        await saveSubmissionsList(submissions);
      }
    }

    console.log(`Leads: created lead for "${p.name}"`);
    return res.json({ success: true, lead });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to create lead: ' + error.message });
  }
});

app.put('/api/leads/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes, payload } = req.body;
    const submissions = await readSubmissions();
    const idx = submissions.findIndex(x => x.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Lead not found.' });
    }

    if (status) submissions[idx].status = status;
    if (notes !== undefined) submissions[idx].notes = notes;
    if (payload && typeof payload === 'object') {
      submissions[idx].payload = { ...submissions[idx].payload, ...payload };
    }
    submissions[idx].updatedAt = new Date().toISOString();

    await saveSubmissionsList(submissions);
    console.log(`Leads: updated lead ${id} (Status: ${submissions[idx].status})`);
    return res.json({ success: true, lead: submissions[idx] });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update lead: ' + error.message });
  }
});

app.delete('/api/leads/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const submissions = await readSubmissions();
    const idx = submissions.findIndex(x => x.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Lead not found.' });
    }

    const removed = submissions.splice(idx, 1)[0];
    await saveSubmissionsList(submissions);
    console.log(`Leads: deleted lead ${id} ("${removed.payload?.name}")`);
    return res.json({ success: true, deleted: removed });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to delete lead: ' + error.message });
  }
});

const server = app.listen(PORT, () => {
  console.log(`Studio server running: http://localhost:${PORT}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    const nextPort = Number(PORT) + 1;
    console.warn(`Port ${PORT} is already in use. Trying port ${nextPort}...`);
    const server2 = app.listen(nextPort, () => {
      console.log(`Studio server running: http://localhost:${nextPort}`);
    });
    server2.on('error', (e) => {
      console.error(`Could not bind to port ${nextPort}:`, e.message);
    });
  } else {
    console.error('Server error:', err);
  }
});
