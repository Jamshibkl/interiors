/* Generates 10 themed step illustration images (step-01.svg ... step-10.svg)
   for the Services "Step-by-Step Process" timeline. Self-contained, no network. */
const fs = require('fs');

// gold-stroke icon paths drawn in a 0..100 coordinate box (centered later)
const ICONS = {
  consult: `<rect x="10" y="22" width="50" height="34" rx="8"/><path d="M22 56v10l13-10"/><rect x="44" y="40" width="46" height="32" rx="8"/><path d="M78 72v9l-12-9"/>`,
  measure: `<rect x="12" y="40" width="76" height="20" rx="5"/><path d="M24 40v9M36 40v13M48 40v9M60 40v13M72 40v9"/>`,
  mood:    `<rect x="16" y="16" width="68" height="68" rx="7"/><rect x="25" y="25" width="24" height="24" rx="4"/><rect x="55" y="25" width="20" height="15" rx="4"/><rect x="55" y="46" width="20" height="29" rx="4"/><rect x="25" y="55" width="24" height="20" rx="4"/>`,
  plan:    `<rect x="14" y="20" width="72" height="60" rx="5"/><path d="M52 20v34M52 54h34M14 60h26M40 60v20"/><rect x="62" y="28" width="16" height="14" rx="2"/>`,
  cube:    `<path d="M50 14 86 33v34L50 86 14 67V33Z"/><path d="M50 86V50M50 50l36-19M50 50 14 31"/>`,
  swatch:  `<circle cx="40" cy="40" r="20"/><circle cx="62" cy="40" r="20"/><circle cx="51" cy="60" r="20"/>`,
  draw:    `<rect x="18" y="16" width="50" height="68" rx="5"/><path d="M27 33h32M27 46h32M27 59h22"/><path d="M64 26l20 14-16 22-20-14Z"/>`,
  build:   `<path d="M20 66a30 30 0 0 1 60 0Z"/><path d="M12 66h76"/><path d="M50 36V22M44 30h12"/>`,
  decor:   `<rect x="14" y="46" width="72" height="22" rx="7"/><path d="M22 46v-7a5 5 0 0 1 5-5h46a5 5 0 0 1 5 5v7M24 68v9M76 68v9"/>`,
  key:     `<circle cx="34" cy="44" r="15"/><path d="M46 53 80 87M72 79l8-8M62 69l8-8"/>`,
};

const STEPS = [
  { n: '01', icon: 'consult', accent: '#c97a55' },
  { n: '02', icon: 'measure', accent: '#8a9573' },
  { n: '03', icon: 'mood',    accent: '#c9a24b' },
  { n: '04', icon: 'plan',    accent: '#c79386' },
  { n: '05', icon: 'cube',    accent: '#6f8f86' },
  { n: '06', icon: 'swatch',  accent: '#b06f49' },
  { n: '07', icon: 'draw',    accent: '#8a9573' },
  { n: '08', icon: 'build',   accent: '#c9a24b' },
  { n: '09', icon: 'decor',   accent: '#c97a55' },
  { n: '10', icon: 'key',     accent: '#a8812f' },
];

function svg({ n, icon, accent }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 560" width="800" height="560" role="img">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#f6efe1"/><stop offset="0.55" stop-color="#efe3cd"/><stop offset="1" stop-color="#e9d9bd"/>
    </linearGradient>
    <radialGradient id="disc" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#f0e4cc"/>
    </radialGradient>
  </defs>
  <rect width="800" height="560" fill="url(#bg)"/>
  <text x="650" y="200" font-family="Georgia, 'Times New Roman', serif" font-size="240" font-weight="700" fill="${accent}" fill-opacity="0.12" text-anchor="middle" dominant-baseline="middle">${n}</text>
  <circle cx="400" cy="280" r="150" fill="url(#disc)" stroke="${accent}" stroke-opacity="0.25" stroke-width="2"/>
  <g transform="translate(300,180) scale(2)" fill="none" stroke="${accent}" stroke-width="4.2" stroke-linecap="round" stroke-linejoin="round">${ICONS[icon]}</g>
  <rect x="14" y="14" width="772" height="532" rx="20" fill="none" stroke="${accent}" stroke-opacity="0.35" stroke-width="2"/>
</svg>
`;
}

STEPS.forEach((s, i) => {
  const file = `step-${String(i + 1).padStart(2, '0')}.svg`;
  fs.writeFileSync(file, svg(s), 'utf8');
  console.log('wrote', file);
});
