const fs = require('fs');

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

  // If email was not explicitly prefixed with Email:
  if (!email) {
    const emailMatch = msg.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    if (emailMatch) email = emailMatch[1];
  }

  let cleanLoc = (location || '').trim();
  if (cleanLoc === ',' || cleanLoc === ', ' || cleanLoc === '—') cleanLoc = '';

  let cleanProj = (projectType || '').trim();
  if (cleanProj === ',' || cleanProj === ', ' || cleanProj === '—') cleanProj = 'Interior Inquiry';

  // Determine type
  let type = 'quote';
  const fLower = (form || '').toLowerCase();
  if (fLower.includes('contact')) type = 'contact';
  else if (fLower.includes('job') || fLower.includes('career')) type = 'career';

  // Format date
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
    id: 'sheet_' + (index + 1) + '_' + (phone ? phone.replace(/\D/g,'').slice(-6) : Math.random().toString(36).slice(2,7)),
    type: type,
    receivedAt: receivedAt,
    status: (status && status.trim()) ? status.trim() : 'New',
    notes: (notes || '').trim(),
    sheetRow: index + 2, // header is row 1
    payload: {
      name: (name || 'Anonymous').trim(),
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

const csv = fs.readFileSync('sheet_data.csv', 'utf8');
const rows = parseCSV(csv);
const leads = rows.slice(1).map((r, i) => parseSheetLead(r, i));

console.log('Successfully parsed leads:', leads.length);
console.log('Sample parsed lead 1 (Priyanka):', leads.find(l => l.payload.name === 'Priyanka'));
console.log('Sample parsed lead 2 (Swarna latha):', leads.find(l => l.payload.name.includes('Swarna')));
console.log('Sample parsed lead 3 (Job App):', leads.find(l => l.type === 'career'));
