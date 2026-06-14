// One-off extractor: pulls the embedded base64 assets + logos out of the
// original single-file page into a shared assets.js used by every page.
const fs = require('fs');
const src = fs.readFileSync('kaveri-interiors.html', 'utf8');

// 1) the ASSET object literal: `const ASSET = { ... };`
const assetMatch = src.match(/const ASSET = (\{[\s\S]*?\});/);
if (!assetMatch) throw new Error('ASSET object not found');
const assetLiteral = assetMatch[1];

// 2) nav logo + footer logo data URIs
const dataUris = [...src.matchAll(/src="(data:image\/png;base64,[^"]+)"/g)].map(m => m[1]);
if (dataUris.length < 2) throw new Error('Expected 2 logo data URIs, found ' + dataUris.length);
const logo = dataUris[0];      // line 509 nav/hero logo (square)
const footLogo = dataUris[1];  // line 821 footer wordmark logo

const out =
`/* Kaveri Interiors — shared image assets (extracted, browser-cached across pages) */
window.ASSET = ${assetLiteral};
window.KAVERI_LOGO = "${logo}";
window.KAVERI_FOOT_LOGO = "${footLogo}";
`;

fs.writeFileSync('assets.js', out, 'utf8');
console.log('assets.js written:', (out.length / 1024 / 1024).toFixed(2), 'MB');
console.log('ASSET keys:', Object.keys(JSON.parse(assetLiteral)).join(', '));
