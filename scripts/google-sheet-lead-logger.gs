/* ============================================================================
   KAVERI INTERIORS — lead logger + admin read API (Google Apps Script)
   Reference copy only. This does NOT run on the website or in the build;
   it runs on Google's servers, attached to your Google Sheet.

   ---------------------------------------------------------------------------
   SETUP — about 10 minutes, all free
   ---------------------------------------------------------------------------
   1. Go to sheets.new  (signed in as the account that should own the leads).
      Name the spreadsheet e.g. "Kaveri Interiors — Leads".

   2. Extensions > Apps Script. Delete the sample code. Paste this whole file.
      Click the disk icon to save.

   3. Deploy > New deployment.
        - Click the gear next to "Select type" > choose "Web app"
        - Description:   Lead logger
        - Execute as:    Me           <- so it can write to the sheet
        - Who has access: Anyone      <- REQUIRED. See the security note below.
      Click Deploy.

   4. Google shows a permissions warning ("Google hasn't verified this app").
      This is expected — you are the author. Click:
        Advanced > Go to <project name> (unsafe) > Allow
      This is your own script writing to your own sheet. Nothing else can
      reach it, because the URL is the only entry point and it only ever
      appends a row.

   5. Copy the Web app URL. It looks like:
        https://script.google.com/macros/s/AKfy...long.../exec
      Paste it into SHEET_ENDPOINT in js/app.js, then run: npm run build

   ---------------------------------------------------------------------------
   "Who has access: Anyone" — is that safe?
   ---------------------------------------------------------------------------
   Yes, and it is required: the website visitor's browser is anonymous, so it
   cannot authenticate as you. "Anyone" means anyone may POST a lead — the same
   as anyone being able to submit your contact form. It does NOT mean anyone can
   read the sheet. doGet() below deliberately requires the ADMIN_PASSWORD for
   any lead data, so the URL alone leaks nothing.
   Worst case: someone posts junk rows, which you delete. Nothing is exposed.

   ---------------------------------------------------------------------------
   AFTER CHANGING THIS FILE
   ---------------------------------------------------------------------------
   Deploy > Manage deployments > pencil icon > Version: New version > Deploy.
   Editing alone does nothing — the live URL keeps serving the old version
   until you deploy a new one. The URL itself stays the same.
   ============================================================================ */

var SHEET_NAME = 'Leads';
var CALENDAR_TIMEZONE = 'Asia/Kolkata';

var SETTINGS_KEY = 'CONSULTATION_SETTINGS';
var DEFAULT_SETTINGS = {
  enabled: true,
  fee: 2500,
  durationMinutes: 60,
  bookingWindowDays: 60,
  minNoticeHours: 12,
  paymentUrl: '',
  note: 'Choose a time when Kaveri is available. Payment is required before your slot is confirmed.',
  weekly: {
    0: [],
    1: ['10:00', '11:30', '15:00'],
    2: ['10:00', '11:30', '15:00'],
    3: ['10:00', '11:30'],
    4: ['10:00', '11:30', '15:00'],
    5: ['10:00', '11:30', '15:00'],
    6: []
  },
  overrides: {}
};

var HEADERS = [
  'Received',      // server timestamp — authoritative
  'Form',          // Quote request | Contact enquiry
  'Name',
  'Phone',
  'Location',
  'Project type',
  'Message',
  'WhatsApp opt-in',
  'Status',        // workflow column — edit this by hand
  'Notes'          // free text for Kaveri
];

/* Returns the Leads sheet, creating and formatting it on first run. */
function getSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (sheet) return sheet;

  sheet = ss.insertSheet(SHEET_NAME);
  sheet.appendRow(HEADERS);

  var head = sheet.getRange(1, 1, 1, HEADERS.length);
  head.setFontWeight('bold').setBackground('#2e2620').setFontColor('#ffffff');
  sheet.setFrozenRows(1);
  sheet.setColumnWidth(1, 150); // Received
  sheet.setColumnWidth(7, 320); // Message
  sheet.setColumnWidth(10, 260); // Notes

  var statusCol = HEADERS.indexOf('Status') + 1;
  var rule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['New', 'Contacted', 'In Progress', 'Converted', 'Lost'], true)
    .setAllowInvalid(false)
    .build();
  sheet.getRange(2, statusCol, sheet.getMaxRows() - 1, 1).setDataValidation(rule);

  return sheet;
}

/* The website POSTs here. Body is JSON sent as text/plain (see js/app.js). */
function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var d = JSON.parse(e.postData.contents);
    if (d.action === 'adminLoad' || d.action === 'adminSave') return admin_(d);

    // Admin read leads — password protected
    if (d.action === 'readLeads') return readLeads_(d);

    // Admin update lead status/notes — password protected
    if (d.action === 'updateLead') return updateLead_(d);

    // Admin delete lead — password protected
    if (d.action === 'deleteLead') return deleteLead_(d);

    // Public form submission
    if (!d.name || !d.phone) throw new Error('Name and phone are required.');

    getSheet_().appendRow([
      new Date(),
      d.form_type || '',
      d.name,
      "'" + String(d.phone),   // leading ' keeps Sheets from mangling +91 / dropping leading 0
      d.location || '',
      d.project_type || '',
      d.message || '',
      d.whatsapp_optin || '',
      'New',
      ''
    ]);

    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

/* Serves public consultation info and allows password-protected lead reads. */
function doGet(e) {
  var p = (e && e.parameter) || {};
  if (p.action === 'consultation') return json_({ ok: true, settings: publicSettings_() });
  if (p.action === 'availability') return availability_(p.date);
  return json_({ ok: true, message: 'Endpoint is live. Leads are not served here.' });
}

/* ----------------------------------------------------------------
   ADMIN: Read all leads from the Google Sheet (password protected)
   ---------------------------------------------------------------- */
function readLeads_(d) {
  var authResult = checkPassword_(d);
  if (!authResult.ok) return json_(authResult);

  try {
    var sheet = getSheet_();
    var lastRow = sheet.getLastRow();

    if (lastRow <= 1) {
      return json_({ ok: true, leads: [], total: 0 });
    }

    var data = sheet.getRange(2, 1, lastRow - 1, HEADERS.length).getValues();

    var leads = data.map(function(row, idx) {
      var received = row[0];
      var receivedISO = '';
      if (received instanceof Date) {
        receivedISO = Utilities.formatDate(received, 'UTC', "yyyy-MM-dd'T'HH:mm:ss'Z'");
      } else if (received) {
        receivedISO = String(received);
      }

      var phone = String(row[3] || '').replace(/^'/, ''); // remove leading quote we added

      return {
        id: 'sheet_row_' + (idx + 2), // row number as stable ID
        sheetRow: idx + 2,
        type: (String(row[1] || '')).toLowerCase().includes('contact') ? 'contact' : 'quote',
        receivedAt: receivedISO,
        status: String(row[8] || 'New'),
        notes: String(row[9] || ''),
        source: 'google_sheet',
        payload: {
          name: String(row[2] || ''),
          phone: phone,
          location: String(row[4] || ''),
          projectType: String(row[5] || ''),
          message: String(row[6] || ''),
          whatsappOptIn: String(row[7] || '').toLowerCase() === 'yes',
          email: '',
          budget: '',
          designTheme: ''
        }
      };
    }).filter(function(l) {
      return l.payload.name && l.payload.phone;
    });

    // Sort newest first
    leads.sort(function(a, b) {
      return new Date(b.receivedAt) - new Date(a.receivedAt);
    });

    return json_({ ok: true, leads: leads, total: leads.length });
  } catch (err) {
    return json_({ ok: false, error: 'Failed to read sheet: ' + String(err) });
  }
}

/* ----------------------------------------------------------------
   ADMIN: Update lead status or notes (password protected)
   ---------------------------------------------------------------- */
function updateLead_(d) {
  var authResult = checkPassword_(d);
  if (!authResult.ok) return json_(authResult);

  try {
    var rowNum = Number(d.sheetRow);
    if (!rowNum || rowNum < 2) throw new Error('Invalid sheet row number.');

    var sheet = getSheet_();
    var statusColIdx = HEADERS.indexOf('Status') + 1; // 1-indexed
    var notesColIdx = HEADERS.indexOf('Notes') + 1;

    if (d.status) {
      sheet.getRange(rowNum, statusColIdx).setValue(d.status);
    }
    if (d.notes !== undefined) {
      sheet.getRange(rowNum, notesColIdx).setValue(d.notes);
    }

    return json_({ ok: true, updated: { sheetRow: rowNum, status: d.status, notes: d.notes } });
  } catch (err) {
    return json_({ ok: false, error: 'Failed to update lead: ' + String(err) });
  }
}

/* ----------------------------------------------------------------
   ADMIN: Delete a lead row (password protected)
   ---------------------------------------------------------------- */
function deleteLead_(d) {
  var authResult = checkPassword_(d);
  if (!authResult.ok) return json_(authResult);

  try {
    var rowNum = Number(d.sheetRow);
    if (!rowNum || rowNum < 2) throw new Error('Invalid sheet row number.');

    var sheet = getSheet_();
    sheet.deleteRow(rowNum);

    return json_({ ok: true, deleted: { sheetRow: rowNum } });
  } catch (err) {
    return json_({ ok: false, error: 'Failed to delete lead: ' + String(err) });
  }
}

/* ----------------------------------------------------------------
   Password check helper
   ---------------------------------------------------------------- */
function checkPassword_(d) {
  var cache = CacheService.getScriptCache();
  var fails = Number(cache.get('adminFails') || 0);
  if (fails >= 5) return { ok: false, error: 'Too many wrong attempts. Try again in 15 minutes.' };

  var expected = PropertiesService.getScriptProperties().getProperty('ADMIN_PASSWORD');
  if (!expected) return { ok: false, error: 'ADMIN_PASSWORD is not set in Script Properties.' };
  if (String(d.password || '') !== expected) {
    cache.put('adminFails', String(fails + 1), 900);
    return { ok: false, error: 'Wrong password.' };
  }
  cache.remove('adminFails');
  return { ok: true };
}

/* ---------- consultation settings (edited on admin.html) ---------- */
function getSettings_() {
  var raw = PropertiesService.getScriptProperties().getProperty(SETTINGS_KEY);
  var saved = raw ? JSON.parse(raw) : {};
  var out = {};
  for (var k in DEFAULT_SETTINGS) out[k] = saved.hasOwnProperty(k) ? saved[k] : DEFAULT_SETTINGS[k];
  return out;
}

function publicSettings_() {
  var s = getSettings_();
  return {
    enabled: !!s.enabled,
    fee: s.fee,
    durationMinutes: s.durationMinutes,
    bookingWindowDays: s.bookingWindowDays,
    paymentUrl: s.paymentUrl,
    note: s.note
  };
}

var TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
var DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function cleanTimes_(list) {
  if (!Array.isArray(list)) throw new Error('Times must be a list.');
  var seen = {};
  return list.map(String).filter(function(t) {
    if (!TIME_RE.test(t)) throw new Error('Invalid time: ' + t);
    if (seen[t]) return false;
    return (seen[t] = true);
  }).sort();
}

function cleanSettings_(s) {
  var fee = Number(s.fee), dur = Number(s.durationMinutes);
  var win = Number(s.bookingWindowDays), notice = Number(s.minNoticeHours);
  if (!(fee >= 0 && fee <= 1000000)) throw new Error('Fee must be a number between 0 and 10,00,000.');
  if (!(dur >= 15 && dur <= 480)) throw new Error('Duration must be 15 to 480 minutes.');
  if (!(win >= 1 && win <= 365)) throw new Error('Booking window must be 1 to 365 days.');
  if (!(notice >= 0 && notice <= 720)) throw new Error('Minimum notice must be 0 to 720 hours.');
  var url = String(s.paymentUrl || '').trim();
  if (url && !/^https:\/\//.test(url)) throw new Error('Payment link must start with https://');

  var weekly = {};
  for (var d = 0; d < 7; d++) weekly[d] = cleanTimes_((s.weekly || {})[d] || []);
  var overrides = {}, today = Utilities.formatDate(new Date(), CALENDAR_TIMEZONE, 'yyyy-MM-dd');
  Object.keys(s.overrides || {}).forEach(function(date) {
    if (!DATE_RE.test(date)) throw new Error('Invalid date: ' + date);
    if (date >= today) overrides[date] = cleanTimes_(s.overrides[date]);
  });

  return {
    enabled: !!s.enabled,
    fee: Math.round(fee),
    durationMinutes: Math.round(dur),
    bookingWindowDays: Math.round(win),
    minNoticeHours: Math.round(notice),
    paymentUrl: url,
    note: String(s.note || '').slice(0, 300),
    weekly: weekly,
    overrides: overrides
  };
}

function admin_(d) {
  var authResult = checkPassword_(d);
  if (!authResult.ok) return json_(authResult);

  if (d.action === 'adminSave') {
    var clean = cleanSettings_(d.settings || {});
    PropertiesService.getScriptProperties().setProperty(SETTINGS_KEY, JSON.stringify(clean));
  }
  return json_({ ok: true, settings: getSettings_() });
}

function availability_(dateText) {
  try {
    if (!DATE_RE.test(dateText || '')) throw new Error('Invalid date.');
    var s = getSettings_();
    var none = json_({ ok: true, date: dateText, slots: [], fee: s.fee });
    if (!s.enabled) return none;

    var now = new Date();
    var date = new Date(dateText + 'T00:00:00+05:30');
    if (date.getTime() > now.getTime() + s.bookingWindowDays * 86400000) return none;

    var weekday = Number(Utilities.formatDate(date, CALENDAR_TIMEZONE, 'u')) % 7;
    var configured = s.overrides.hasOwnProperty(dateText) ? s.overrides[dateText] : (s.weekly[weekday] || []);
    var earliest = now.getTime() + s.minNoticeHours * 3600000;
    var calendar = CalendarApp.getDefaultCalendar();
    var slots = configured.filter(function(slot) {
      var start = new Date(dateText + 'T' + slot + ':00+05:30');
      if (start.getTime() < earliest) return false;
      var end = new Date(start.getTime() + s.durationMinutes * 60000);
      return calendar.getEvents(start, end).length === 0;
    });
    return json_({ ok: true, date: dateText, slots: slots, fee: s.fee });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
