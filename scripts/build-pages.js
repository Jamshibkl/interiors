/* Generates the inner pages from one shared shell so nav/footer/modals stay
   identical across the site. Run from the project root: node scripts/build-pages.js  */
const fs = require('fs');

const NAV_ITEMS = [
  ['index.html', 'Home', 'home'],
  ['about.html', 'About', 'about'],
  ['services.html', 'Services', 'services'],
  ['workshop.html', 'Workshop', 'workshop'],
  ['gallery.html', 'Gallery', 'gallery'],
  ['careers.html', 'Careers', 'careers'],
  ['contact.html', 'Contact', 'contact'],
];

const nav = (active) => `
<nav id="nav">
  <a href="index.html" class="brand">
    <img data-brand-logo alt="Kaveri Interiors logo">
    <span class="brand-name">Kaveri<small>Interiors</small></span>
  </a>
  <div class="nav-links" id="navLinks">
    ${NAV_ITEMS.map(([href,label,key]) => `<a href="${href}"${key===active?' class="active"':''}>${label}</a>`).join('\n    ')}
    <a class="nav-cta" onclick="openQuote()">Get a Free Quote</a>
  </div>
  <button class="burger" id="burger" onclick="toggleMenu()" aria-label="Menu"><span></span><span></span><span></span></button>
</nav>`;

const pageHero = (h) => `
<header class="page-hero">
  <div class="page-hero-bg" data-bg="${h.bg}"></div>
  <div class="page-hero-inner">
    <div class="eyebrow">${h.eyebrow}</div>
    <h1>${h.h1}</h1>
    ${h.p ? `<p>${h.p}</p>` : ''}
    <div class="crumbs"><a href="index.html">Home</a><span>/</span>${h.crumb}</div>
  </div>
</header>`;

const ctaBand = `
<section class="cta-band">
  <div class="wrap reveal">
    <div class="sec-tag">Ready when you are</div>
    <h2>Let's design a space <em>you'll love</em></h2>
    <p>Share a few details about your project and we'll get back within 24 hours with next steps.</p>
    <div class="hero-cues">
      <a class="btn btn-primary" onclick="openQuote()">Get a Free Quote</a>
      <a class="btn btn-ghost-light" href="contact.html">Contact the studio</a>
    </div>
  </div>
</section>`;

const footer = `
<footer>
  <div class="wrap foot-grid">
    <div>
      <img class="foot-logo" data-foot-logo alt="Kaveri Interiors">
      <p>Civil engineer &amp; interior designer crafting functional, aesthetically refined spaces — space planning, material selection and 3D visualization.</p>
      <div class="foot-soc" data-socials></div>
    </div>
    <div>
      <h4>Explore</h4>
      <ul>
        <li><a href="about.html">About</a></li>
        <li><a href="services.html">Services</a></li>
        <li><a href="workshop.html">Workshop</a></li>
        <li><a href="gallery.html">Gallery</a></li>
        <li><a href="careers.html">Careers</a></li>
        <li><a href="contact.html">Contact</a></li>
      </ul>
    </div>
    <div>
      <h4>Services</h4>
      <ul>
        <li><a href="services.html">Interior Design</a></li>
        <li><a href="services.html">Styling &amp; Décor</a></li>
        <li><a href="services.html">Turnkey Projects</a></li>
        <li><a href="services.html">Renovation</a></li>
        <li><a href="services.html">Consultation</a></li>
      </ul>
    </div>
    <div>
      <h4>Contact</h4>
      <ul>
        <li><a href="mailto:hello@kaveriinteriors.com">hello@kaveriinteriors.com</a></li>
        <li><a href="tel:+910000000000">+91 00000 00000</a></li>
        <li><a href="https://www.instagram.com/interiorsbykaveri/" target="_blank" rel="noopener">@interiorsbykaveri</a></li>
        <li><a onclick="openQuote()">Get a free quote</a></li>
      </ul>
    </div>
  </div>
  <div class="foot-bottom">© <span id="yr"></span> <b>Kaveri Interiors</b> · All rights reserved.</div>
</footer>`;

const quoteModal = `
<div class="modal" id="quoteModal">
  <div class="modal-box">
    <button class="modal-close" onclick="closeModal('quoteModal')">×</button>
    <h3>Get a free quote</h3>
    <div class="small">Share a few details and we’ll get back within 24 hours.</div>
    <div class="field"><input id="qName" placeholder="Your name"></div>
    <div class="field"><input id="qPhone" placeholder="Phone number"></div>
    <div class="field"><input id="qLoc" placeholder="Property location"></div>
    <div class="field">
      <select id="qType">
        <option value="">Project type…</option>
        <option>Full home interior</option>
        <option>Single room</option>
        <option>Renovation</option>
        <option>Styling only</option>
        <option>Consultation</option>
      </select>
    </div>
    <label class="check"><input type="checkbox" id="qWa" checked> Send me updates on WhatsApp</label>
    <button class="btn btn-primary" style="width:100%;justify-content:center" onclick="sendQuote('quote')">Send my request</button>
    <div class="form-msg" id="quoteResult"></div>
  </div>
</div>`;

const servModal = `
<div class="modal" id="servModal">
  <div class="modal-box">
    <button class="modal-close" onclick="closeModal('servModal')">×</button>
    <div class="m-tag">Service</div>
    <h3 id="smTitle"></h3>
    <p id="smBody"></p>
    <div class="sm-feat-label">What's included</div>
    <ul id="smFeatures" class="sm-features"></ul>
    <button class="btn btn-dark" onclick="closeModal('servModal');openQuote()">Get a quote for this</button>
  </div>
</div>`;

const lightbox = `
<div class="modal" id="lightbox">
  <button class="modal-close" onclick="closeModal('lightbox')">×</button>
  <div class="lb-img ph" id="lbImg"></div>
</div>`;

const floating = `
<a class="fab wa" href="https://wa.me/919XXXXXXXXX?text=Hi%20Kaveri%2C%20I%27d%20like%20to%20talk%20about%20an%20interior%20project" target="_blank" rel="noopener" aria-label="Chat on WhatsApp"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.71.306 1.263.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0 0 20.464 3.488"/></svg></a>
<button class="fab totop" id="totop" onclick="window.scrollTo({top:0,behavior:'smooth'})" aria-label="Back to top">↑</button>`;

function page({file, title, desc, active, hero, body, extraModals=''}) {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${title}</title>
<meta name="description" content="${desc}" />
<link rel="icon" type="image/png" href="favicon.png">
<link rel="apple-touch-icon" href="apple-touch-icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,600;1,700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="css/styles.css">
</head>
<body class="loading">
<div id="preloader">
  <div class="pl-mark"><b>Kaveri</b><span>Interiors</span></div>
  <div class="pl-bar"><i></i></div>
</div>
<script>window.addEventListener('load',function(){setTimeout(function(){document.body.classList.remove('loading');var p=document.getElementById('preloader');if(p)p.classList.add('done');},700);});setTimeout(function(){document.body.classList.remove('loading');var p=document.getElementById('preloader');if(p)p.classList.add('done');},4000);</script>
<div id="progress"></div>
<div class="topbar" id="topbar">
  <div class="tb-inner">
    <div class="tb-left">
      <a class="tb-item" href="tel:+910000000000"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/></svg>+91 00000 00000</a>
      <a class="tb-item" href="mailto:hello@kaveriinteriors.com"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/></svg>hello@kaveriinteriors.com</a>
      <span class="tb-item tb-loc"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>Hyderabad, India</span>
    </div>
    <div class="tb-right">
      <span class="tb-follow">Follow us</span>
      <div class="topbar-social" data-socials></div>
    </div>
  </div>
</div>
${nav(active)}
${pageHero(hero)}
${body}
${ctaBand}
${footer}
${floating}
${quoteModal}${extraModals}

<script src="js/assets.js"></script>
<script src="js/app.js"></script>
</body>
</html>
`;
  fs.writeFileSync(file, html, 'utf8');
  console.log('wrote', file);
}

/* =========================== ABOUT =========================== */
page({
  file: 'about.html',
  title: 'About — Kaveri Interiors',
  desc: 'Meet Kaveri — civil engineer and interior designer behind a calm, boho-modern design studio in Hyderabad.',
  active: 'about',
  hero: { eyebrow: 'About the studio', h1: 'Where engineering meets <em>elegant design</em>', p: 'A hands-on, one-to-one design practice rooted in how you actually live.', bg: 'heroAbout', crumb: 'About' },
  body: `
<section class="founder">
  <div class="wrap founder-grid">
    <div class="founder-photo reveal-l">
      <div class="photo-shell"><img data-founder-photo alt="Kaveri — founder of Kaveri Interiors"></div>
      <span class="founder-badge"><b>40+</b><small>Spaces designed</small></span>
    </div>
    <div class="founder-text stagger">
      <h2>Meet our founder<span class="founder-line"></span></h2>
      <div class="founder-name">Kaveri</div>
      <div class="founder-role">Interior Designer &amp; Civil Engineer</div>
      <p>I am a civil engineer and interior designer dedicated to crafting functional, aesthetically refined spaces. With expertise in space planning, material selection, and 3D visualization, I translate design concepts into practical, elegant solutions.</p>
      <p>My freelance experience has strengthened my ability to understand client needs, manage projects efficiently, and deliver high-quality designs that balance creativity and functionality — every project approached with the belief that a space should feel as good to live in as it looks.</p>
      <div class="founder-tags">
        <span>Civil Engineer</span><span>Interior Designer</span><span>3D Visualization</span><span>Residential &amp; Commercial</span><span>Hyderabad, India</span>
      </div>
      <div class="founder-quote">A well-designed space should feel as good to live in as it looks.</div>
      <div class="founder-cta">
        <a class="btn btn-primary" onclick="openQuote()">Work with us</a>
        <a class="btn btn-ghost-light" href="https://www.instagram.com/interiorsbykaveri/" target="_blank" rel="noopener">@interiorsbykaveri</a>
      </div>
    </div>
  </div>
</section>

<section id="designer">
  <div class="wrap des-grid">
    <div class="des-img ph reveal-l"></div>
    <div class="des-text reveal-r">
      <div class="sec-tag">My approach</div>
      <h3>Design that works as well as it looks</h3>
      <div class="role">Space planning · Material selection · 3D visualization</div>
      <p>Every project starts with how a space will actually be used — then layers in materials, light and proportion until it feels both refined and effortless to live in.</p>
      <p>As a civil engineer, I bring structural understanding to the design, so concepts stay practical and build-ready — not just pretty pictures.</p>
      <div class="des-social" data-socials aria-label="Follow Kaveri Interiors"></div>
    </div>
  </div>
</section>

<section id="why">
  <div class="wrap">
    <div class="sec-head center reveal">
      <div class="sec-tag">Why choose us</div>
      <h2>Excellence in <em>every corner</em></h2>
      <div class="sub">A designer's eye, an engineer's precision, and a genuinely personal process.</div>
    </div>
    <div class="why-grid reveal stagger">
      <div class="why-card"><div class="num" data-count="40" data-suffix="+">0</div><div class="lbl">Spaces designed</div></div>
      <div class="why-card"><div class="num" data-count="5" data-suffix="+">0</div><div class="lbl">Years freelance</div></div>
      <div class="why-card"><div class="num" data-count="6" data-suffix="">0</div><div class="lbl">Design tools mastered</div></div>
      <div class="why-card"><div class="num" data-count="100" data-suffix="%">0</div><div class="lbl">Bespoke design</div></div>
    </div>
    <div class="ws-grid reveal stagger">
      <div class="ws-card"><div class="ws-img"><div class="ws-cover" style="background-image:url('https://images.pexels.com/photos/8469988/pexels-photo-8469988.jpeg?auto=compress&cs=tinysrgb&w=800')"></div></div><div class="ws-body"><h3>Engineer + Designer</h3><p>A civil-engineering background means designs are structurally sound and build-ready, not just beautiful renders.</p></div></div>
      <div class="ws-card"><div class="ws-img"><div class="ws-cover" style="background-image:url('https://images.pexels.com/photos/10145678/pexels-photo-10145678.jpeg?auto=compress&cs=tinysrgb&w=800')"></div></div><div class="ws-body"><h3>Photoreal 3D Visualization</h3><p>See your space in lifelike 3D before any work begins, so every decision is made with confidence.</p></div></div>
      <div class="ws-card"><div class="ws-img"><div class="ws-cover" style="background-image:url('https://images.pexels.com/photos/4977410/pexels-photo-4977410.jpeg?auto=compress&cs=tinysrgb&w=800')"></div></div><div class="ws-body"><h3>Personal, hands-on process</h3><p>You work directly with the designer at every stage — no handoffs, no templates, no copy-paste rooms.</p></div></div>
      <div class="ws-card"><div class="ws-img"><div class="ws-cover" style="background-image:url('https://images.pexels.com/photos/33175667/pexels-photo-33175667.jpeg?auto=compress&cs=tinysrgb&w=800')"></div></div><div class="ws-body"><h3>Budget-honest design</h3><p>The scheme is shaped around your budget from day one, with clear choices and no surprises later.</p></div></div>
      <div class="ws-card"><div class="ws-img"><div class="ws-cover" style="background-image:url('https://images.pexels.com/photos/30754467/pexels-photo-30754467.jpeg?auto=compress&cs=tinysrgb&w=800')"></div></div><div class="ws-body"><h3>Residential &amp; commercial</h3><p>From homes and bedrooms to cafés and salons — versatile design across project types.</p></div></div>
      <div class="ws-card"><div class="ws-img"><div class="ws-cover" style="background-image:url('https://images.pexels.com/photos/7579192/pexels-photo-7579192.jpeg?auto=compress&cs=tinysrgb&w=800')"></div></div><div class="ws-body"><h3>On-time turnkey delivery</h3><p>End-to-end coordination and quality checks through to a fully finished, styled handover.</p></div></div>
    </div>
  </div>
</section>

<section class="worked">
  <div class="wrap">
    <div class="sec-head center reveal">
      <div class="sec-tag">Our footprint</div>
      <h2>Where we've <em>worked</em></h2>
      <div class="sub">Projects and consultations across South India — based in Hyderabad, available beyond.</div>
    </div>
    <div class="worked-grid reveal">
      <div class="worked-map">
        <iframe loading="lazy" referrerpolicy="no-referrer-when-downgrade" title="Kaveri Interiors — Hyderabad" src="https://www.google.com/maps?q=Hyderabad,Telangana,India&z=11&output=embed"></iframe>
      </div>
    </div>
  </div>
</section>
`,
});

/* =========================== SERVICES =========================== */
page({
  file: 'services.html',
  title: 'Services — Kaveri Interiors',
  desc: 'Residential, commercial, architecture, construction, 3D visualization, renovation and consultation — full-service interior design.',
  active: 'services',
  hero: { eyebrow: 'What we do', h1: 'Interior design, <em>end to end</em>', p: 'From first concept to the final styled handover — tap any service to see exactly what’s included.', bg: 'heroServices', crumb: 'Services' },
  extraModals: servModal,
  body: `
<section id="services">
  <div class="wrap">
    <div class="sec-head center reveal">
      <div class="sec-tag">Our services</div>
      <h2>Comprehensive <em>design solutions</em></h2>
      <div class="sub">Tailored to your lifestyle, space and budget. Tap any service to see what's included.</div>
    </div>
    <div class="serv-grid reveal stagger" id="servGrid"></div>
  </div>
</section>

<section class="process-tl">
  <div class="wrap">
    <div class="sec-head center reveal">
      <div class="sec-tag">Our process</div>
      <h2>Step-by-Step Interior <em>Design Process</em></h2>
      <div class="sub">Follow the journey from concept to completion with our 10-step process.</div>
    </div>
    <div class="ptl">
      <div class="ptl-step reveal"><div class="ptl-img"><img src="assets/Initial%20Consultancy.jpg" alt="Initial consultancy"></div><div class="ptl-card"><span class="ptl-no">01</span><h3>Initial Consultancy</h3><p>We begin with a client briefing to understand your needs, style preferences and budget.</p></div></div>
      <div class="ptl-step reveal"><div class="ptl-img"><img src="assets/Site.jpg" alt="Site measurement and survey"></div><div class="ptl-card"><span class="ptl-no">02</span><h3>Site Measurement &amp; Survey</h3><p>Detailed on-site measurements and a study of the space so every plan is built on accurate data.</p></div></div>
      <div class="ptl-step reveal"><div class="ptl-img"><img src="assets/opt/moodboard.jpg" alt="Concept and mood boards" loading="lazy"></div><div class="ptl-card"><span class="ptl-no">03</span><h3>Concept &amp; Mood Boards</h3><p>Themes, colour palettes and references that set a clear visual direction for your space.</p></div></div>
      <div class="ptl-step reveal"><div class="ptl-img"><img src="assets/opt/spaceplanning.jpg" alt="Space planning with floor plans" loading="lazy"></div><div class="ptl-card"><span class="ptl-no">04</span><h3>Space Planning</h3><p>Functional layouts and furniture arrangement worked out for flow, comfort and everyday use.</p></div></div>
      <div class="ptl-step reveal"><div class="ptl-img"><img src="assets/opt/3dvisualization.jpg" alt="3D visualization render" loading="lazy"></div><div class="ptl-card"><span class="ptl-no">05</span><h3>3D Visualization</h3><p>Photoreal 3D views so you can see, refine and approve the design before any work begins.</p></div></div>
      <div class="ptl-step reveal"><div class="ptl-img"><img src="assets/opt/materialselection.jpg" alt="Material and finish selection" loading="lazy"></div><div class="ptl-card"><span class="ptl-no">06</span><h3>Material &amp; Finish Selection</h3><p>Finalising colours, materials, textures and finishes — balanced for beauty, durability and budget.</p></div></div>
      <div class="ptl-step reveal"><div class="ptl-img"><img src="assets/opt/drawingsboq.jpg" alt="Detailed drawings and BOQ" loading="lazy"></div><div class="ptl-card"><span class="ptl-no">07</span><h3>Detailed Drawings &amp; BOQ</h3><p>Working drawings, specifications and a clear bill of quantities so execution stays precise.</p></div></div>
      <div class="ptl-step reveal"><div class="ptl-img"><img src="assets/opt/execution.jpg" alt="Execution and on-site supervision" loading="lazy"></div><div class="ptl-card"><span class="ptl-no">08</span><h3>Execution &amp; On-site Supervision</h3><p>Build-ready detailing, vendor coordination and quality checks on site through to completion.</p></div></div>
      <div class="ptl-step reveal"><div class="ptl-img"><img src="assets/opt/styling.jpg" alt="Styling and decor" loading="lazy"></div><div class="ptl-card"><span class="ptl-no">09</span><h3>Styling &amp; Décor</h3><p>The final layering of furnishings, lighting and décor that brings the whole space to life.</p></div></div>
      <div class="ptl-step reveal"><div class="ptl-img"><img src="assets/opt/handover.jpg" alt="Handover" loading="lazy"></div><div class="ptl-card"><span class="ptl-no">10</span><h3>Handover</h3><p>The final reveal — we hand over your transformed space, ready for you to move in.</p></div></div>
    </div>
  </div>
</section>

<section id="why">
  <div class="wrap">
    <div class="sec-head center reveal">
      <div class="sec-tag">Why choose us</div>
      <h2>Excellence in <em>every corner</em></h2>
      <div class="sub">A designer's eye, an engineer's precision, and a genuinely personal process.</div>
    </div>
    <div class="ws-grid reveal stagger">
      <div class="ws-card"><div class="ws-img"><div class="ws-cover" style="background-image:url('https://images.pexels.com/photos/8469988/pexels-photo-8469988.jpeg?auto=compress&cs=tinysrgb&w=800')"></div></div><div class="ws-body"><h3>Engineer + Designer</h3><p>A civil-engineering background means designs are structurally sound and build-ready, not just beautiful renders.</p></div></div>
      <div class="ws-card"><div class="ws-img"><div class="ws-cover" style="background-image:url('https://images.pexels.com/photos/10145678/pexels-photo-10145678.jpeg?auto=compress&cs=tinysrgb&w=800')"></div></div><div class="ws-body"><h3>Photoreal 3D Visualization</h3><p>See your space in lifelike 3D before any work begins, so every decision is made with confidence.</p></div></div>
      <div class="ws-card"><div class="ws-img"><div class="ws-cover" style="background-image:url('https://images.pexels.com/photos/4977410/pexels-photo-4977410.jpeg?auto=compress&cs=tinysrgb&w=800')"></div></div><div class="ws-body"><h3>Personal, hands-on process</h3><p>You work directly with the designer at every stage — no handoffs, no templates, no copy-paste rooms.</p></div></div>
      <div class="ws-card"><div class="ws-img"><div class="ws-cover" style="background-image:url('https://images.pexels.com/photos/33175667/pexels-photo-33175667.jpeg?auto=compress&cs=tinysrgb&w=800')"></div></div><div class="ws-body"><h3>Budget-honest design</h3><p>The scheme is shaped around your budget from day one, with clear choices and no surprises later.</p></div></div>
      <div class="ws-card"><div class="ws-img"><div class="ws-cover" style="background-image:url('https://images.pexels.com/photos/30754467/pexels-photo-30754467.jpeg?auto=compress&cs=tinysrgb&w=800')"></div></div><div class="ws-body"><h3>Residential &amp; commercial</h3><p>From homes and bedrooms to cafés and salons — versatile design across project types.</p></div></div>
      <div class="ws-card"><div class="ws-img"><div class="ws-cover" style="background-image:url('https://images.pexels.com/photos/7579192/pexels-photo-7579192.jpeg?auto=compress&cs=tinysrgb&w=800')"></div></div><div class="ws-body"><h3>On-time turnkey delivery</h3><p>End-to-end coordination and quality checks through to a fully finished, styled handover.</p></div></div>
    </div>
  </div>
</section>`,
});

/* =========================== WORKSHOP =========================== */
page({
  file: 'workshop.html',
  title: 'Workshops & Training — Kaveri Interiors',
  desc: 'Hands-on interior design & software workshops — SketchUp, AutoCAD, 3D visualization, project management and more, taught by a civil engineer & interior designer.',
  active: 'workshop',
  hero: { eyebrow: 'Learn & grow', h1: 'Workshops &amp; <em>Training</em>', p: 'Empowering the next generation with modern, build-ready design skills.', bg: 'heroWorkshop', crumb: 'Workshop' },
  body: `
<section id="workshop-intro">
  <div class="wrap">
    <div class="sec-head center reveal">
      <div class="sec-tag">Learn with us</div>
      <h2>Hands-on <em>workshops</em></h2>
      <div class="sub">From SketchUp basics to advanced project management, our sessions blend design creativity with real-world, build-ready skills — taught by a practicing civil engineer &amp; interior designer. Perfect for students, fresh graduates and professionals levelling up.</div>
    </div>
    <div class="ws-grid reveal stagger">
      <div class="ws-card"><div class="ws-img"><div class="ws-cover" style="background-image:url('https://images.pexels.com/photos/7504599/pexels-photo-7504599.jpeg?auto=compress&cs=tinysrgb&w=800')"></div><span class="ws-no">01</span></div><div class="ws-body"><h3>SketchUp Essentials</h3><div class="ws-meta">Beginner · Hands-on</div><p>Model rooms and furniture in 3D from scratch — navigation, components, layouts and clean, presentation-ready models.</p></div></div>
      <div class="ws-card"><div class="ws-img"><div class="ws-cover" style="background-image:url('https://images.pexels.com/photos/4458210/pexels-photo-4458210.jpeg?auto=compress&cs=tinysrgb&w=800')"></div><span class="ws-no">02</span></div><div class="ws-body"><h3>AutoCAD for Interiors</h3><div class="ws-meta">Beginner → Intermediate</div><p>Accurate 2D floor plans, elevations and working drawings — the technical backbone of every interior project.</p></div></div>
      <div class="ws-card"><div class="ws-img"><div class="ws-cover" style="background-image:url('https://images.pexels.com/photos/10145678/pexels-photo-10145678.jpeg?auto=compress&cs=tinysrgb&w=800')"></div><span class="ws-no">03</span></div><div class="ws-body"><h3>3D Visualization — V-Ray &amp; Enscape</h3><div class="ws-meta">Intermediate</div><p>Lighting, materials and cameras to turn models into photoreal renders and real-time walkthroughs clients love.</p></div></div>
      <div class="ws-card"><div class="ws-img"><div class="ws-cover" style="background-image:url('https://images.pexels.com/photos/6580566/pexels-photo-6580566.jpeg?auto=compress&cs=tinysrgb&w=800')"></div><span class="ws-no">04</span></div><div class="ws-body"><h3>Interior Design Fundamentals</h3><div class="ws-meta">All levels</div><p>Space planning, colour theory, material selection and styling — the design thinking behind beautiful, liveable spaces.</p></div></div>
      <div class="ws-card"><div class="ws-img"><div class="ws-cover" style="background-image:url('https://images.pexels.com/photos/19915766/pexels-photo-19915766.jpeg?auto=compress&cs=tinysrgb&w=800')"></div><span class="ws-no">05</span></div><div class="ws-body"><h3>Primavera P6 — Project Management</h3><div class="ws-meta">Intermediate → Advanced</div><p>Plan, schedule and track interior & construction projects like a pro — timelines, resources and on-site delivery.</p></div></div>
      <div class="ws-card"><div class="ws-img"><div class="ws-cover" style="background-image:url('https://images.pexels.com/photos/8470842/pexels-photo-8470842.jpeg?auto=compress&cs=tinysrgb&w=800')"></div><span class="ws-no">06</span></div><div class="ws-body"><h3>Estimation, BOQ &amp; Site</h3><div class="ws-meta">Practical</div><p>Quantities, costing and bills of quantities, plus site coordination basics — bridge the gap between design and execution.</p></div></div>
    </div>
  </div>
</section>

<section id="ws-why">
  <div class="wrap">
    <div class="sec-head center reveal">
      <div class="sec-tag">Why train with us</div>
      <h2>Skills that get you <em>hired</em></h2>
    </div>
    <div class="ws-grid reveal stagger">
      <div class="ws-card"><div class="ws-img"><div class="ws-cover" style="background-image:url('https://images.pexels.com/photos/32702849/pexels-photo-32702849.jpeg?auto=compress&cs=tinysrgb&w=800')"></div></div><div class="ws-body"><h3>Taught by a practitioner</h3><p>Learn from a working civil engineer &amp; interior designer — real projects, real tools, no fluff.</p></div></div>
      <div class="ws-card"><div class="ws-img"><div class="ws-cover" style="background-image:url('https://images.pexels.com/photos/7858841/pexels-photo-7858841.jpeg?auto=compress&cs=tinysrgb&w=800')"></div></div><div class="ws-body"><h3>Software + design together</h3><p>Not just buttons — you learn the design thinking behind every drawing, render and decision.</p></div></div>
      <div class="ws-card"><div class="ws-img"><div class="ws-cover" style="background-image:url('https://images.pexels.com/photos/9849323/pexels-photo-9849323.jpeg?auto=compress&cs=tinysrgb&w=800')"></div></div><div class="ws-body"><h3>Portfolio-ready outcomes</h3><p>Walk away with finished pieces you can show clients or employers, plus guidance on next steps.</p></div></div>
    </div>
    <div style="text-align:center;margin-top:46px" class="reveal">
      <a class="btn btn-primary" onclick="openQuote()">Enquire about workshops</a>
    </div>
  </div>
</section>`,
});

/* =========================== GALLERY =========================== */
page({
  file: 'gallery.html',
  title: 'Gallery — Kaveri Interiors',
  desc: 'Selected residential and commercial interior projects, 3D renders and a real-time walkthrough.',
  active: 'gallery',
  hero: { eyebrow: 'Selected work', h1: 'A look inside <em>recent projects</em>', p: 'Photoreal renders and finished spaces across homes, kitchens, bedrooms and more.', bg: 'heroGallery', crumb: 'Gallery' },
  extraModals: lightbox,
  body: `
<section id="gallery">
  <div class="wrap">
    <div class="sec-head reveal">
      <div class="sec-tag">Selected work</div>
      <h2>Explore by <em>room</em></h2>
      <div class="sub">Pick a room to see every design — then tap any image to view it larger.</div>
    </div>
    <div class="room3d reveal" id="room3d">
      <button class="room3d-arrow r3-prev" id="r3Prev" aria-label="Previous room">‹</button>
      <div class="room3d-viewport"><div class="room3d-stage" id="room3dStage"></div></div>
      <button class="room3d-arrow r3-next" id="r3Next" aria-label="Next room">›</button>
      <div class="room3d-dots" id="room3dDots"></div>
    </div>
    <div class="gal-detail" id="galDetail" hidden>
      <div class="gal-detail-head">
        <button class="gal-back" id="galBack">← All rooms</button>
        <h3 id="galDetailTitle"></h3>
      </div>
      <div class="gal-grid" id="galGrid"></div>
    </div>
  </div>
</section>

<section id="ba">
  <div class="wrap">
    <div class="sec-head center reveal">
      <div class="sec-tag">From concept to render</div>
      <h2>3D model to <em>reality</em></h2>
      <div class="sub">Drag the handle — from the working 3D model to the final photoreal render.</div>
    </div>
    <div class="ba-wrap reveal" id="baWrap">
      <div class="ba-img ba-after ph"><span class="tag">Final render</span></div>
      <div class="ba-img ba-before ph" id="baBefore"><span class="tag">3D model</span></div>
      <div class="ba-handle" id="baHandle"></div>
    </div>
  </div>
</section>

<section id="tour">
  <div class="wrap">
    <div class="sec-head center reveal">
      <div class="sec-tag">Walkthrough</div>
      <h2>Project <em>video tour</em></h2>
      <div class="sub">Step inside a finished project — a real-time 3D walkthrough of the space.</div>
    </div>
    <div class="tour-frame reveal" id="tourFrame">
      <div class="tour-poster" id="tourPoster" onclick="loadTour()">
        <div class="play">▶</div>
        <span class="tour-hint">Play walkthrough</span>
      </div>
    </div>
  </div>
</section>`,
});

/* =========================== CAREERS =========================== */
page({
  file: 'careers.html',
  title: 'Careers — Kaveri Interiors',
  desc: 'Join Kaveri Interiors — roles for interior designers, 3D artists and design interns.',
  active: 'careers',
  hero: { eyebrow: 'Careers', h1: 'Build beautiful spaces <em>with us</em>', p: 'We’re always happy to hear from talented designers, 3D artists and interns.', bg: 'heroCareers', crumb: 'Careers' },
  body: `
<section id="careers">
  <div class="wrap">
    <div class="sec-head center reveal">
      <div class="sec-tag">Careers</div>
      <h2>No open roles <em>right now</em></h2>
      <div class="sub">We're a small, hands-on studio and we open positions as our projects grow.</div>
    </div>
    <div class="career-empty reveal">
      <div class="career-empty-badge">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2"/><path d="M3 13h18"/></svg>
      </div>
      <h3>All positions are currently filled</h3>
      <p>There are no vacancies at the moment — but we're always glad to meet talented interior designers, 3D artists and interns. Send your portfolio and we'll keep you in mind for upcoming projects.</p>
      <a class="btn btn-dark" href="mailto:hello@kaveriinteriors.com?subject=Portfolio%20%E2%80%93%20Kaveri%20Interiors">Send your portfolio</a>
    </div>
  </div>
</section>

<section id="faq">
  <div class="wrap">
    <div class="sec-head center reveal">
      <div class="sec-tag">Good to know</div>
      <h2>Frequently <em>asked</em></h2>
    </div>
    <div class="faq-list reveal" id="faqList"></div>
  </div>
</section>`,
});

/* =========================== CONTACT =========================== */
page({
  file: 'contact.html',
  title: 'Contact — Kaveri Interiors',
  desc: 'Talk to the designer. Get a free, no-obligation quote for your interior project.',
  active: 'contact',
  hero: { eyebrow: 'Get in touch', h1: 'Let’s design it <em>together</em>', p: 'Tell us about your space — we’ll reply within 24 hours.', bg: 'heroContact', crumb: 'Contact' },
  body: `
<section id="contact">
  <div class="wrap">
    <div class="contact-grid">
      <div class="contact-info reveal">
        <div class="sec-tag">Studio details</div>
        <div class="row"><div class="ico">✉</div><div><b>Email</b><a href="mailto:hello@kaveriinteriors.com">hello@kaveriinteriors.com</a></div></div>
        <div class="row"><div class="ico">✆</div><div><b>Phone</b><a href="tel:+910000000000">+91 00000 00000</a></div></div>
        <div class="row"><div class="ico">◎</div><div><b>Studio</b><span>Hyderabad, India</span></div></div>
        <div class="row"><div class="ico">⌾</div><div><b>Instagram</b><a href="https://www.instagram.com/interiorsbykaveri/" target="_blank" rel="noopener">@interiorsbykaveri</a></div></div>
        <div class="row"><div class="ico">♡</div><div><b>Follow us</b><div class="contact-social" data-socials aria-label="Social links"></div></div></div>
        <a class="map" href="https://www.google.com/maps/search/?api=1&query=Hyderabad,Telangana,India" target="_blank" rel="noopener" title="Open Hyderabad in Google Maps">
          <span class="map-fallback">
            <span class="map-pin">◎</span>
            <b>Hyderabad, Telangana</b>
            <small>India · Available for projects across the city &amp; beyond</small>
            <em>View on Google Maps →</em>
          </span>
          <iframe class="map-frame" loading="lazy" referrerpolicy="no-referrer-when-downgrade" onload="this.classList.add('ok')" src="https://www.google.com/maps?q=Hyderabad,Telangana,India&z=11&output=embed"></iframe>
        </a>
      </div>
      <div class="form-card reveal">
        <h3>Talk to the designer</h3>
        <div class="small">Tell us about your space — we’ll reply within 24 hours.</div>
        <div class="field"><input id="cName" placeholder="Your name"></div>
        <div class="field"><input id="cPhone" placeholder="Phone number"></div>
        <div class="field"><input id="cLoc" placeholder="Property location"></div>
        <div class="field">
          <select id="cType">
            <option value="">Project type…</option>
            <option>Full home interior</option>
            <option>Single room</option>
            <option>Renovation</option>
            <option>Styling only</option>
            <option>Consultation</option>
          </select>
        </div>
        <div class="field"><textarea id="cMsg" placeholder="A little about your project…"></textarea></div>
        <label class="check"><input type="checkbox" id="cWa" checked> Send me updates on WhatsApp</label>
        <button class="btn btn-dark" onclick="sendQuote('contact')">Send enquiry</button>
        <div class="form-msg" id="contactResult"></div>
      </div>
    </div>
  </div>
</section>

<section id="faq">
  <div class="wrap">
    <div class="sec-head center reveal">
      <div class="sec-tag">Good to know</div>
      <h2>Frequently <em>asked</em></h2>
    </div>
    <div class="faq-list reveal" id="faqList"></div>
  </div>
</section>

<section id="news">
  <div class="wrap reveal">
    <div class="sec-tag">Stay inspired</div>
    <h2>Design tips, in your inbox</h2>
    <p>Subscribe for boho-modern ideas, palettes and behind-the-scenes from the studio.</p>
    <div class="news-form">
      <input type="email" id="newsEmail" placeholder="Your email address">
      <button class="btn btn-primary" onclick="subscribe()">Subscribe</button>
    </div>
    <div class="news-ok" id="newsOk"></div>
  </div>
</section>`,
});

console.log('All inner pages generated.');
