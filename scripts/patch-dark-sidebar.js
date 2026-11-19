/**
 * patch-dark-sidebar.js
 * Replaces the light sidebar CSS in all 4 admin/leads pages with the dark
 * chocolate-brown sidebar matching the reference design image.
 * Run: node scripts/patch-dark-sidebar.js
 */

const fs = require('fs');
const path = require('path');

const BASE = path.join(__dirname, '..');

// ─── DARK SIDEBAR CSS (replaces the old .admin-sidebar / nav-item etc.) ───────
const DARK_SIDEBAR_CSS = `
  /* ═══════════ DARK SIDEBAR THEME ═══════════ */
  .admin-sidebar{
    width:var(--sidebar-w);
    background:#3d2b1f;
    border-right:none;
    display:flex;flex-direction:column;
    position:sticky;top:0;height:100vh;
    z-index:999;flex-shrink:0;
    transition:transform .25s ease;
  }
  .sidebar-header{
    padding:22px 18px;
    display:flex;align-items:center;gap:11px;
    border-bottom:1px solid rgba(255,255,255,.08)
  }
  .brand-m,.brand-monogram{
    width:36px;height:36px;border-radius:10px;
    background:rgba(241,228,209,.18);color:#f1e4d1;
    display:grid;place-items:center;
    font-family:var(--serif);font-size:19px;font-weight:700;flex-shrink:0
  }
  .brand-meta{min-width:0;flex:1}
  .brand-title{
    font-family:var(--serif);font-size:16px;font-weight:700;
    line-height:1.15;color:#f1e4d1;
    white-space:nowrap;overflow:hidden;text-overflow:ellipsis
  }
  .brand-tag{
    font-size:9px;letter-spacing:1.5px;text-transform:uppercase;
    color:rgba(241,228,209,.55);font-weight:700;margin-top:2px
  }
  .sidebar-close,.sidebar-close-btn{
    display:none;width:28px;height:28px;border-radius:7px;
    align-items:center;justify-content:center;
    color:rgba(241,228,209,.6);font-size:15px;margin-left:auto
  }
  .sidebar-close:hover,.sidebar-close-btn:hover{
    background:rgba(255,255,255,.08);color:#f1e4d1
  }

  .sidebar-nav{
    flex:1;overflow-y:auto;padding:14px 10px;
    display:flex;flex-direction:column;gap:3px
  }
  .nav-label-grp,.nav-group-title{
    font-size:10px;font-weight:700;letter-spacing:1.6px;text-transform:uppercase;
    color:rgba(241,228,209,.4);padding:12px 10px 4px
  }
  .nav-item{
    display:flex;align-items:center;gap:9px;
    padding:9px 11px;border-radius:9px;
    color:rgba(241,228,209,.65);
    font-weight:500;font-size:13px;
    transition:all .15s;
    width:100%;text-align:left;text-decoration:none;
  }
  .nav-item:hover{background:rgba(255,255,255,.08);color:#f1e4d1}
  .nav-item.active{background:#f1e4d1;color:#3d2b1f;font-weight:600}
  .nav-item.active .nav-icon{color:#3d2b1f}
  .nav-icon{width:16px;height:16px;flex-shrink:0;color:currentColor}
  .nav-label{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .nav-badge{
    font-size:10.5px;font-weight:700;padding:1px 7px;border-radius:999px;
    background:rgba(255,255,255,.12);color:rgba(241,228,209,.75);margin-left:auto
  }
  .nav-badge.alert{background:#e8724a;color:#fff}
  .nav-item.active .nav-badge{background:rgba(61,43,31,.18);color:#3d2b1f}
  .nav-item.active .nav-badge.alert{background:#e8724a;color:#fff}

  .sidebar-footer{
    padding:12px 14px;
    border-top:1px solid rgba(255,255,255,.08);
    display:flex;align-items:center;justify-content:space-between;gap:8px;
    background:rgba(0,0,0,.18)
  }
  .admin-avatar{
    width:30px;height:30px;border-radius:50%;
    background:rgba(241,228,209,.2);color:#f1e4d1;
    font-weight:700;font-size:11px;display:grid;place-items:center;flex-shrink:0
  }
  .admin-name{font-size:12px;font-weight:600;color:#f1e4d1}
  .admin-status{font-size:11px;color:#6bcf7f;display:flex;align-items:center;gap:3px}
  .status-dot{width:5px;height:5px;border-radius:50%;background:#6bcf7f}

  /* ─── MOBILE TOPBAR (dark) ─── */
  .mob-header{
    display:none;position:sticky;top:0;z-index:990;
    background:#3d2b1f;border-bottom:1px solid rgba(255,255,255,.08);
    padding:9px 14px;align-items:center;justify-content:space-between
  }
  .mob-burger{
    width:34px;height:34px;border-radius:8px;
    display:grid;place-items:center;
    background:rgba(255,255,255,.1);color:#f1e4d1
  }
  .mob-brand .brand-title{color:#f1e4d1}
  .mob-brand .brand-tag{color:rgba(241,228,209,.55)}

  @media(max-width:768px){
    .admin-sidebar{position:fixed;left:0;top:0;transform:translateX(-100%)}
    .admin-sidebar.open{transform:translateX(0)}
    .sidebar-close,.sidebar-close-btn{display:flex!important}
    .mob-header{display:flex}
  }
  /* ════════════════════════════════════════════ */
`;

// Patterns to find the old sidebar CSS block and replace with new one
// We look for the .admin-sidebar{ block and replace until closing of media query
const OLD_SIDEBAR_PATTERNS = [
  // Pattern for leads.html / leads-list.html / leads-new.html sidebar
  /\/\* ---- SIDEBAR ----.*?@media\(max-width:768px\)\{[\s\S]*?\}\s*\}/,
  // Pattern for admin.html sidebar  
  /\/\* SIDEBAR \*\/[\s\S]*?@media\s*\(max-width\s*:\s*768px\)\s*\{[\s\S]*?\}\s*\}/,
];

// Also replace mob-header to dark
const OLD_MOB_HEADER = /\/\* ---- MOBILE HEADER ----.*?\.mob-brand\{[^}]*\}[\s\S]*?(?=\/\* ----|\s*\.admin-main)/;

const FILES = [
  'admin.html',
  'leads.html',
  'leads-list.html',
  'leads-new.html',
];

let patchedCount = 0;

FILES.forEach(filename => {
  const filePath = path.join(BASE, filename);
  if (!fs.existsSync(filePath)) {
    console.log(`⚠  SKIP: ${filename} not found`);
    return;
  }

  let html = fs.readFileSync(filePath, 'utf8');
  const original = html;

  // Strategy: find the sidebar block by looking for characteristic patterns
  // and do targeted string replacements

  // 1. Replace .admin-sidebar background from white/var(--white) to dark
  html = html.replace(
    /\.admin-sidebar\{[\s\S]*?background:var\(--white\)[^}]*\}/,
    match => match.replace('background:var(--white)', 'background:#3d2b1f')
                  .replace('border-right:1px solid var(--line);', 'border-right:none;')
  );

  // 2. Replace sidebar-header border
  html = html.replace(
    /\.sidebar-header\{([^}]*)border-bottom:1px solid var\(--line\)([^}]*)\}/,
    (m, pre, post) => `.sidebar-header{${pre}border-bottom:1px solid rgba(255,255,255,.08)${post}}`
  );

  // 3. Brand monogram colors (dark sidebar version)
  html = html.replace(
    /\.brand-m\{([^}]*)background:var\(--gold-soft\);color:var\(--gold-deep\)([^}]*)\}/,
    (m, pre, post) => `.brand-m{${pre}background:rgba(241,228,209,.18);color:#f1e4d1${post}}`
  );
  html = html.replace(
    /\.brand-monogram\{([^}]*)background:var\(--gold-soft\);color:var\(--gold-deep\)([^}]*)\}/,
    (m, pre, post) => `.brand-monogram{${pre}background:rgba(241,228,209,.18);color:#f1e4d1${post}}`
  );

  // 4. Brand title color
  html = html.replace(
    /\.brand-title\{([^}]*)color:var\(--black\)([^}]*)\}/,
    (m, pre, post) => `.brand-title{${pre}color:#f1e4d1${post}}`
  );

  // 5. Brand tag color
  html = html.replace(
    /\.brand-tag\{([^}]*)color:var\(--gold-deep\)([^}]*)\}/,
    (m, pre, post) => `.brand-tag{${pre}color:rgba(241,228,209,.55)${post}}`
  );

  // 6. Nav group title / label color
  html = html.replace(
    /\.nav-label-grp\{([^}]*)color:var\(--ink-light\)([^}]*)\}/,
    (m, pre, post) => `.nav-label-grp{${pre}color:rgba(241,228,209,.4)${post}}`
  );
  html = html.replace(
    /\.nav-group-title\{([^}]*)color:var\(--ink-light\)([^}]*)\}/,
    (m, pre, post) => `.nav-group-title{${pre}color:rgba(241,228,209,.4)${post}}`
  );

  // 7. Nav item color
  html = html.replace(
    /\.nav-item\{[\s\S]*?color:var\(--ink-soft\)[\s\S]*?\}/,
    match => match.replace('color:var(--ink-soft)', 'color:rgba(241,228,209,.65)')
  );

  // 8. Nav item hover
  html = html.replace(
    /\.nav-item:hover\{background:var\(--cream\);color:var\(--black\)\}/,
    '.nav-item:hover{background:rgba(255,255,255,.08);color:#f1e4d1}'
  );

  // 9. Nav item active - change from black bg to cream bg
  html = html.replace(
    /\.nav-item\.active\{background:var\(--black\);color:var\(--cream\);font-weight:600([^}]*)\}/,
    '.nav-item.active{background:#f1e4d1;color:#3d2b1f;font-weight:600$1}'
  );
  html = html.replace(
    /\.nav-item\.active\{background:var\(--black\);color:var\(--cream\);font-weight:600\}/,
    '.nav-item.active{background:#f1e4d1;color:#3d2b1f;font-weight:600}'
  );

  // 10. Nav badge
  html = html.replace(
    /\.nav-badge\{([^}]*)background:var\(--cream-2\);color:var\(--ink-soft\)([^}]*)\}/,
    (m, pre, post) => `.nav-badge{${pre}background:rgba(255,255,255,.12);color:rgba(241,228,209,.75)${post}}`
  );

  // 11. Sidebar footer background
  html = html.replace(
    /\.sidebar-footer\{([^}]*)background:var\(--cream-card\)([^}]*)\}/,
    (m, pre, post) => `.sidebar-footer{${pre}background:rgba(0,0,0,.18)${post}}`
  );
  html = html.replace(
    /\.sidebar-footer\{([^}]*)border-top:1px solid var\(--line\)([^}]*)\}/,
    (m, pre, post) => `.sidebar-footer{${pre}border-top:1px solid rgba(255,255,255,.08)${post}}`
  );

  // 12. Admin avatar colors
  html = html.replace(
    /\.admin-avatar\{([^}]*)background:var\(--gold-soft\);color:var\(--gold-deep\)([^}]*)\}/,
    (m, pre, post) => `.admin-avatar{${pre}background:rgba(241,228,209,.2);color:#f1e4d1${post}}`
  );

  // 13. Admin name color
  html = html.replace(
    /\.admin-name\{([^}]*)color:var\(--black\)([^}]*)\}/,
    (m, pre, post) => `.admin-name{${pre}color:#f1e4d1${post}}`
  );

  // 14. Status dot / admin-status (green live dot)
  html = html.replace(
    /\.admin-status\{([^}]*)color:var\(--ok\)([^}]*)\}/,
    (m, pre, post) => `.admin-status{${pre}color:#6bcf7f${post}}`
  );
  html = html.replace(
    /\.status-dot\{([^}]*)background:var\(--ok\)([^}]*)\}/,
    (m, pre, post) => `.status-dot{${pre}background:#6bcf7f${post}}`
  );

  // 15. Mobile header to dark
  html = html.replace(
    /\.mob-header\{([^}]*)background:var\(--white\)([^}]*)border-bottom:1px solid var\(--line\)([^}]*)\}/,
    (m, pre, mid, post) => `.mob-header{${pre}background:#3d2b1f${mid}border-bottom:1px solid rgba(255,255,255,.08)${post}}`
  );
  html = html.replace(
    /\.mob-burger\{([^}]*)background:var\(--cream\)([^}]*)\}/,
    (m, pre, post) => `.mob-burger{${pre}background:rgba(255,255,255,.1);color:#f1e4d1${post}}`
  );

  // 16. nav-item.active .nav-badge color fix
  html = html.replace(
    /\.nav-item\.active \.nav-badge\{background:rgba\(255,253,249,\.2\);color:var\(--cream\)\}/,
    '.nav-item.active .nav-badge{background:rgba(61,43,31,.18);color:#3d2b1f}'
  );

  if (html !== original) {
    fs.writeFileSync(filePath, html, 'utf8');
    console.log(`✓  Patched: ${filename}`);
    patchedCount++;
  } else {
    console.log(`⚠  No changes: ${filename} (patterns may not have matched)`);
  }
});

console.log(`\nDone. ${patchedCount}/${FILES.length} files patched.`);
