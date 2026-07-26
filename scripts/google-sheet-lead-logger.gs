/* ============================================================================
   KAVERI INTERIORS — lead logger (Google Apps Script)
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
   read the sheet. doGet() below deliberately returns nothing, so the URL leaks
   no data. Reading the leads requires being logged into your Google account.
   Worst case: someone posts junk rows, which you delete. Nothing is exposed.

   ---------------------------------------------------------------------------
   AFTER CHANGING THIS FILE
   ---------------------------------------------------------------------------
   Deploy > Manage deployments > pencil icon > Version: New version > Deploy.
   Editing alone does nothing — the live URL keeps serving the old version
   until you deploy a new one. The URL itself stays the same.
   ============================================================================ */

var SHEET_NAME = 'Leads';

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

  // Status dropdown so the pipeline stays consistent instead of free-typed.
  var statusCol = HEADERS.indexOf('Status') + 1;
  var rule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['New', 'Contacted', 'Quoted', 'Won', 'Lost'], true)
    .setAllowInvalid(false)
    .build();
  sheet.getRange(2, statusCol, sheet.getMaxRows() - 1, 1).setDataValidation(rule);

  return sheet;
}

/* The website POSTs here. Body is JSON sent as text/plain (see js/app.js). */
function doPost(e) {
  var lock = LockService.getScriptLock();
  // Two people submitting at the same instant would otherwise race for the
  // same row. Wait briefly rather than drop a lead.
  lock.waitLock(20000);
  try {
    var d = JSON.parse(e.postData.contents);
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

/* Deliberately returns no data. Anyone can find this URL, so it must never
   serve the leads. Reading them requires the Google account that owns the sheet. */
function doGet() {
  return json_({ ok: true, message: 'Endpoint is live. Leads are not served here.' });
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
