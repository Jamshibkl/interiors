/* ======================================================================
   KAVERI INTERIORS, shared site script (works across every page)
   Every builder guards on its container, so a page only runs the parts
   that exist in its markup.
   ====================================================================== */

/* ====== CONFIG, edit these ====== */
const WA_NUMBER = "919000470679";   // WhatsApp number, intl format, no +
const YOUTUBE_ID = "YOUTUBE_ID";    // set to a specific video id to embed the tour inline
const YOUTUBE_CHANNEL = "https://www.youtube.com/@kaveriinteriors";

/* EmailJS, dashboard.emailjs.com.
   PUBLIC_KEY ships to the browser by design and CANNOT be hidden. Locking it
   to our domain (Account > Security > Allowed Origins) is a paid feature, so
   on the free plan any origin may send using this key. The exposure is capped
   by the 200/month quota, watch Email History for sends we didn't trigger,
   and rotate the key in the dashboard if it's ever abused.
   The recipient is NOT set here, it's hardcoded in each template's
   "To Email" field on the dashboard, so it can't be tampered with client-side.
   Template markup lives in scripts/emailjs-template-*.html */
const EMAILJS = {
  PUBLIC_KEY:       "R3fRQs3_4gPcJvyHb",     // Account > General > Public Key
  SERVICE_ID:       "service_d2c33n9",     // Email Services > (your service)
  TEMPLATE_QUOTE:   "template_8x6opn3",    // "QUOTE", free-quote modal
  TEMPLATE_CONTACT: "template_z2qvlgr"     // "Contact Us", contact page form
};

/* Google Sheet lead log, the permanent record of every enquiry.
   Email is only a notification and is capped at 200/month; the sheet has no
   quota, so a lead survives even once EmailJS is exhausted.
   Paste the Apps Script Web app URL here, setup steps are in
   scripts/google-sheet-lead-logger.gs */
const SHEET_ENDPOINT = "https://script.google.com/macros/s/AKfycbwnVtWUmTDKFu-wWc1BAaSLC-EDDAt6dlc68g28Q_sbpIN5tFL3C1yqIdkIc6e0kDRs/exec";
/* ================================= */

const ASSET = window.ASSET || {};
const GRAD = {
  si1:'linear-gradient(155deg,#d9cdbd,#b3998a)',
  si2:'linear-gradient(155deg,#c2bca8,#97987f)',
  si3:'linear-gradient(155deg,#c3aa8c,#8a7150)',
  si4:'linear-gradient(155deg,#e2d6c2,#c3aa8c)',
  si5:'linear-gradient(155deg,#d9cdbd,#8a7150)',
  si6:'linear-gradient(155deg,#9d9784,#2a2622)'
};
// background = real image over gradient fallback
const RBG = (key,grad)=> `url('${ASSET[key]||''}') center/cover no-repeat, ${grad}`;
const $ = (id)=>document.getElementById(id);

/* ---------- logos (shared, from assets.js) ---------- */
document.querySelectorAll('[data-brand-logo]').forEach(img=>{ if(window.KAVERI_LOGO) img.src=window.KAVERI_LOGO; });
document.querySelectorAll('[data-foot-logo]').forEach(img=>{ if(window.KAVERI_FOOT_LOGO) img.src=window.KAVERI_FOOT_LOGO; });
document.querySelectorAll('[data-founder-photo]').forEach(img=>{ if(ASSET.portrait) img.src=ASSET.portrait; });
document.querySelectorAll('img[data-asset]').forEach(img=>{ const k=img.getAttribute('data-asset'); if(ASSET[k]) img.src=ASSET[k]; });

/* ---------- year ---------- */
if($('yr')) $('yr').textContent = new Date().getFullYear();

/* ---------- nav + scroll progress ---------- */
const nav = $('nav'), totop = $('totop'), prog = $('progress'), topbar = $('topbar');
window.addEventListener('scroll', () => {
  if(nav) nav.classList.toggle('scrolled', scrollY > 40);
  if(topbar) topbar.classList.toggle('hide', scrollY > 40);
  if(totop) totop.classList.toggle('show', scrollY > 600);
  if(prog){ const h=document.documentElement; prog.style.width=(h.scrollTop/(h.scrollHeight-h.clientHeight)*100)+'%'; }
});
const burger = $('burger'), navLinks = $('navLinks');
function toggleMenu(){ if(navLinks){navLinks.classList.toggle('open');} if(burger){burger.classList.toggle('x');} }
function closeMenu(){ if(navLinks){navLinks.classList.remove('open');} if(burger){burger.classList.remove('x');} }
// same-page smooth scroll (used by hero buttons / footer anchors on the SAME page)
function go(id){ closeMenu(); const el=$(id); if(el){ el.scrollIntoView({behavior:'smooth'}); } else { window.location.href='index.html#'+id; } }

/* ---------- reveal on scroll ---------- */
const io = new IntersectionObserver((es)=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}}),{threshold:.12});
document.querySelectorAll('.reveal,.reveal-l,.reveal-r,.reveal-zoom,.stagger').forEach(el=>io.observe(el));

/* ---------- services data ---------- */
const ICO = {
  sofa:'<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 10V7a2 2 0 012-2h10a2 2 0 012 2v3"/><path d="M3 14a2 2 0 012-2h14a2 2 0 012 2v4H3z"/><path d="M6 18v2M18 18v2"/></svg>',
  cube:'<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z"/><path d="M12 21V12M12 12l8-4.5M12 12L4 7.5"/></svg>',
  roller:'<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="4" width="12" height="6" rx="1.5"/><path d="M15.5 7H19v4h-7v3"/><rect x="10" y="14" width="4" height="6" rx="1.2"/></svg>',
  building:'<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="3" width="10" height="18" rx="1"/><path d="M14 9h5a1 1 0 011 1v11h-6"/><path d="M7 7h1M10 7h1M7 11h1M10 11h1M7 15h1M10 15h1M17 13h.5M17 17h.5"/></svg>',
  blueprint:'<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 3v4M12 17v4M3 12h4M17 12h4"/><path d="M12 12l5-3"/><circle cx="12" cy="12" r="1.6"/></svg>',
  crane:'<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 21V5l13 2"/><path d="M6 5l4 3M6 8l3 2M6 11l3 2"/><path d="M19 7v3M19 10h-3v3M16 13v2"/><path d="M4 21h6"/></svg>'
};
const SERVICES = [
  {c:'si1',i:ICO.sofa,t:'Residential',s:'Homes designed around how you live.',d:'Complete home interiors, bedrooms, living, dining, kitchens and wardrobes, planned into one cohesive, boho-modern scheme tailored to your family, lifestyle and budget, and kept calm and uncluttered.',f:['Space planning & furniture layout','Colour, material & finish palettes','Modular kitchen & wardrobe design','Lighting, décor & final styling']},
  {c:'si2',i:ICO.building,t:'Commercial',s:'Spaces that work as hard as you do.',d:'Interiors for cafés, salons, retail and offices that balance brand identity, customer experience and day-to-day function, designed to look distinctive and run smoothly.',f:['Cafés, salons, retail & offices','Brand-led concept & theming','Customer-flow & seating planning','Durable, practical material choices']},
  {c:'si3',i:ICO.blueprint,t:'Architecture',s:'Thoughtful spaces from the ground up.',d:'Architectural design and space planning for new builds and major layouts, sound proportions, natural light and circulation worked out before a single wall goes up.',f:['Floor plans & space planning','Elevations & 3D massing','Site & circulation studies','Coordinated working drawings']},
  {c:'si4',i:ICO.crane,t:'Construction',s:'Build-ready, on-site, on-track.',d:'As an architect, I bridge design and site, turning drawings into reality with structurally sound detailing, vendor coordination and quality supervision through to handover.',f:['Structural & build-ready detailing','BOQ & material specification','Vendor & contractor coordination','On-site supervision & quality checks']},
  {c:'si5',i:ICO.cube,t:'3D Visualization',s:'See it before it’s built.',d:'Photo-realistic 3D views of your proposed design so you can experience the colours, textures and layout in advance, and make confident decisions before any work begins.',f:['Photoreal 3D renders (V-Ray / Enscape)','Multiple angles & view options','Real-time walkthroughs','Revisions before execution']},
  {c:'si6',i:ICO.roller,t:'Renovation & Consultation',s:'Refresh, or just get direction.',d:'Reviving existing spaces with minimal fuss, or one-off consultations with mood boards, colour and material guidance for clients who want expert direction on their own project.',f:['Single-room or full renovation','Layout & flow improvements','One-off design consultation','Colour & material advice']}
];
const SERV_IMG = ['serv1','serv2','serv3','serv4','serv5','serv6'];
const ICO_BG = ['#a8826a','#97987f','#ab8f68','#b3998a','#8a7150','#8f8a7a'];

const sg = $('servGrid');
if(sg){
  SERVICES.forEach((x,i)=>{
    const el=document.createElement('div');
    el.className='serv-card';
    el.onclick=()=>openServ(i);
    el.innerHTML=`<div class="img ph ${x.c}"></div>
      <span class="serv-no">${String(i+1).padStart(2,'0')}</span>
      <div class="serv-inner">
        <span class="serv-ico">${x.i}</span>
        <h3>${x.t}</h3>
        <p>${x.s}</p>
        <span class="serv-link">Explore<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span>
      </div>`;
    el.querySelector('.img').style.background = RBG(SERV_IMG[i], GRAD[x.c]);
    sg.appendChild(el);
  });
}
function openServ(i){
  if(!$('smTitle')) return;
  $('smTitle').textContent=SERVICES[i].t;
  $('smBody').textContent=SERVICES[i].d;
  $('smFeatures').innerHTML = SERVICES[i].f.map(x=>`<li>${x}</li>`).join('');
  openModal('servModal');
}

/* ---------- gallery ---------- */
const GAL=[
  {t:'Mint Modular Kitchen', s:'Modular · 3D Render', cat:'Kitchen',    img:'kitchen1', grad:'si1'},
  {t:'Green & Wood Kitchen', s:'Modular Kitchen',     cat:'Kitchen',    img:'kitchen2', grad:'si3'},
  {t:'Grey Modular Kitchen', s:'Modular Kitchen',     cat:'Kitchen',    img:'kitchen3', grad:'si4'},
  {t:'Ivory & Wood L-Kitchen',s:'Modular Kitchen',    cat:'Kitchen',    img:'kitchen5', grad:'si4'},
  {t:'Chevron Gloss Kitchen', s:'Kitchen · Dining',   cat:'Kitchen',    img:'kitchen6', grad:'si1'},
  {t:'Navy & Walnut Kitchen', s:'Kitchen · Breakfast Counter',cat:'Kitchen',img:'kitchen7',grad:'si6'},
  {t:'Aubergine Gloss Kitchen',s:'Kitchen · Dining',  cat:'Kitchen',    img:'kitchen8', grad:'si5'},
  {t:'Sage Parallel Kitchen', s:'Modular Kitchen',    cat:'Kitchen',    img:'kitchen9', grad:'si2'},
  {t:'Sky Breakfast Kitchen', s:'Kitchen · Breakfast Bar',cat:'Kitchen',img:'kitchen10',grad:'si4'},
  {t:'Blush Gloss Kitchen',  s:'Modular Kitchen',      cat:'Kitchen',    img:'g2Kitchen1',grad:'si1'},
  {t:'Grey Gloss L-Kitchen', s:'Modular Kitchen',      cat:'Kitchen',    img:'g2Kitchen2',grad:'si6'},
  {t:'Blush Parallel Kitchen',s:'Modular Kitchen',     cat:'Kitchen',    img:'g2Kitchen3',grad:'si4'},
  {t:'Pichwai Master Suite', s:'Master Bedroom',      cat:'Bedroom',    img:'bedPichwai',grad:'si4'},
  {t:'World-Map Bedroom',    s:'Bedroom',             cat:'Bedroom',    img:'bed_front',grad:'si2'},
  {t:'Tropical Headboard Suite', s:'Master Bedroom',  cat:'Bedroom',    img:'bed_angled',grad:'si4'},
  {t:'Arch Headboard Suite', s:'Master Bedroom',      cat:'Bedroom',    img:'bedroomF', grad:'si4'},
  {t:'Master Suite Lounge',  s:'Bedroom',             cat:'Bedroom',    img:'bedroomW', grad:'si5'},
  {t:'Wardrobe & Storage',   s:'Bedroom Storage',     cat:'Bedroom',    img:'wardrobe', grad:'si2'},
  {t:'Magenta Wardrobe Suite',s:'Bedroom · Wardrobe', cat:'Bedroom',    img:'bedMagenta',grad:'si5'},
  {t:'Blush Sliding Wardrobe',s:'Bedroom Storage',    cat:'Bedroom',    img:'wardrobe2',grad:'si1'},
  {t:'World-Map Kids Room',  s:'Kids Bedroom',        cat:'Bedroom',    img:'g2Bed1',   grad:'si2'},
  {t:'Nursery Suite',        s:'Kids Bedroom',        cat:'Bedroom',    img:'g2Bed2',   grad:'si3'},
  {t:'Pastel Cloud Kids Room',s:'Kids Bedroom',       cat:'Bedroom',    img:'g2Bed3',   grad:'si1'},
  {t:'Tropical Arch Bedroom',s:'Master Bedroom',      cat:'Bedroom',    img:'g2Bed4',   grad:'si4'},
  {t:'Cane Wardrobe Bedroom',s:'Bedroom · Study',     cat:'Bedroom',    img:'g2Bed5',   grad:'si3'},
  {t:'Jaali Study Bedroom',  s:'Bedroom · Study',     cat:'Bedroom',    img:'g2Bed6',   grad:'si2'},
  {t:'Lotus Panel Wardrobe', s:'Bedroom · Wardrobe',  cat:'Bedroom',    img:'g2Bed7',   grad:'si6'},
  {t:'Space Theme Kids Room',s:'Kids Bedroom',        cat:'Bedroom',    img:'g2Bed8',   grad:'si2'},
  {t:'Crane Art Master Suite',s:'Master Bedroom',     cat:'Bedroom',    img:'g2Bed9',   grad:'si5'},
  {t:'Fluted Wall Bedroom', s:'Master Bedroom',       cat:'Bedroom',    img:'g2Bed10',  grad:'si1'},
  {t:'Green Shelf Bedroom', s:'Bedroom · TV Unit',     cat:'Bedroom',    img:'g2Bed11',  grad:'si3'},
  {t:'Pichwai TV Wall',      s:'Living · Décor',      cat:'Living',     img:'living6',  grad:'si3'},
  {t:'Living Room & TV Unit',s:'Living Room',         cat:'Living',     img:'living1',  grad:'si1'},
  {t:'Open Living & Dining', s:'Living · Dining',     cat:'Living',     img:'living2',  grad:'si6'},
  {t:'Panelled TV Wall',     s:'Living Room',         cat:'Living',     img:'living4',  grad:'si4'},
  {t:'Fluted Cane TV Unit',  s:'Living Room',         cat:'Living',     img:'living5',  grad:'si1'},
  {t:'Sage Arch TV Unit',    s:'Living Room',         cat:'Living',     img:'living7',  grad:'si2'},
  {t:'Stone & Halo TV Wall', s:'Living Room',         cat:'Living',     img:'living8',  grad:'si6'},
  {t:'Garden-View Living',   s:'Living Room',         cat:'Living',     img:'living9',  grad:'si4'},
  {t:'Heritage Art Living',  s:'Living · Décor',      cat:'Living',     img:'g2Living1',grad:'si3'},
  {t:'Floral Marble TV Wall',s:'Living Room',         cat:'Living',     img:'g2Living2',grad:'si1'},
  {t:'Fluted Wood TV Wall',  s:'Living · Pooja',      cat:'Living',     img:'g2Living3',grad:'si5'},
  {t:'Bengali Art Living',   s:'Living · Décor',      cat:'Living',     img:'g2Living4',grad:'si3'},
  {t:'Arched Panel Living',  s:'Living · Dining',     cat:'Living',     img:'g2Living5',grad:'si2'},
  {t:'Swing & Pichwai Dining',s:'Dining · Décor',     cat:'Dining',     img:'dining3',  grad:'si2'},
  {t:'Wood-Ceiling Dining',  s:'Dining · Kitchen',    cat:'Dining',     img:'g2Dining1',grad:'si3'},
  {t:'Cane Pendant Dining',  s:'Dining Room',         cat:'Dining',     img:'g2Dining2',grad:'si1'},
  {t:'Crockery & Display Unit',s:'Dining Storage',    cat:'Dining',     img:'g2Dining3',grad:'si4'},
  {t:'Chandelier Dining',    s:'Dining · Stairwell',  cat:'Dining',     img:'g2Dining4',grad:'si6'},
  {t:'Bar & Crockery Unit',  s:'Dining · Bar',        cat:'Dining',     img:'g2Dining5',grad:'si3'},
  {t:'Dining & Crockery Wall',s:'Dining Room',        cat:'Dining',     img:'dining',   grad:'si3'},
  {t:'Slat-Wall Dining',     s:'Dining Room',         cat:'Dining',     img:'dining2',  grad:'si1'},
  {t:'Pichwai & Cane Partition',s:'Foyer · Entrance', cat:'Partitions',      img:'partition4',grad:'si5'},
  {t:'Wooden Foyer',         s:'Entrance · Foyer',    cat:'Partitions',      img:'foyer',    grad:'si5'},
  {t:'Jali Display Partition',s:'Foyer · Living',     cat:'Partitions',      img:'partition',grad:'si2'},
  {t:'Lotus Jaali Partition', s:'Foyer · Living',     cat:'Partitions',      img:'partition2',grad:'si3'},
  {t:'Pichwai Screen Divider',s:'Foyer · Living',     cat:'Partitions',      img:'partition3',grad:'si2'},
  {t:'Lotus & Cow Medallion Screen',s:'Foyer · Décor',cat:'Partitions',      img:'partition5',grad:'si1'},
  {t:'Foyer Entrance',       s:'Entrance',            cat:'Partitions',      img:'foyer2',   grad:'si3'},
  {t:'Temple Mural Pooja Unit',s:'Pooja Room · Mandir',cat:'Pooja Room', img:'pooja5',   grad:'si3'},
  {t:'Lotus Pooja Door',     s:'Pooja Room · Mandir',  cat:'Pooja Room', img:'pooja1',   grad:'si3'},
  {t:'Namam Pooja Doors',    s:'Pooja Room · Mandir',  cat:'Pooja Room', img:'pooja2',   grad:'si5'},
  {t:'Star-Glass Pooja Room',s:'Pooja Room · Mandir',  cat:'Pooja Room', img:'pooja3',   grad:'si4'},
  {t:'Kolam Pooja Doors',    s:'Pooja Room · Mandir',  cat:'Pooja Room', img:'pooja4',   grad:'si1'},
  {t:'Brass Lotus Pooja Doors',s:'Pooja Room · Mandir',cat:'Pooja Room', img:'pooja6',   grad:'si4'},
  {t:'Indigo Pichwai Mandir',s:'Pooja Room · Mandir',  cat:'Pooja Room', img:'pooja7',   grad:'si6'},
  {t:'Oak Medallion Pooja Doors',s:'Pooja Room · Mandir',cat:'Pooja Room',img:'pooja8',  grad:'si1'},
  {t:'Balcony Sit-out',      s:'Balcony',             cat:'Balcony',    img:'balcony',  grad:'si4'},
  {t:'Sunset Balcony Deck',  s:'Balcony · Utility',   cat:'Balcony',    img:'balcony2', grad:'si5'},
  {t:'Dusk Balcony Garden',  s:'Balcony · Sit-out',   cat:'Balcony',    img:'g2Balcony1',grad:'si2'},
  {t:'Art Plate Niche',      s:'Foyer · Décor',       cat:'Partitions',      img:'decor1',   grad:'si2'},
  {t:'Beauty Salon',         s:'Commercial · Retail', cat:'Commercial', img:'salon',    grad:'si5'},
  {t:'Café Interior',        s:'Commercial · Hospitality', cat:'Commercial', img:'cafe',grad:'si2'},
  {t:'Coastal Organic Café', s:'Commercial · Hospitality', cat:'Commercial', img:'g2Cafe1',grad:'si2'},
  {t:'Café Rattan Booths',   s:'Commercial · Hospitality', cat:'Commercial', img:'g2Cafe2',grad:'si4'},
  {t:'Coastal Café Bar',     s:'Commercial · Hospitality', cat:'Commercial', img:'g2Cafe3',grad:'si2'},
  {t:'Coastal Café Booths',  s:'Commercial · Hospitality', cat:'Commercial', img:'g2Cafe4',grad:'si4'},
  {t:'Coastal Café Palm Court',s:'Commercial · Hospitality', cat:'Commercial', img:'g2Cafe5',grad:'si1'},
  {t:'Coastal Café Plate Wall',s:'Commercial · Hospitality', cat:'Commercial', img:'g2Cafe6',grad:'si3'}
];
const gg=$('galGrid');
const stage=$('room3dStage');
if(stage && gg){
  // group projects by room category, preserving first-seen order
  const CATS=[];
  GAL.forEach(g=>{ let c=CATS.find(x=>x.cat===g.cat); if(!c){c={cat:g.cat,items:[]};CATS.push(c);} c.items.push(g); });
  const n=CATS.length;

  const galDetail=$('galDetail'), galTitle=$('galDetailTitle'), room3d=$('room3d'), dots=$('room3dDots');
  const lightbox=bg=>{const lb=$('lbImg');lb.className='lb-img ph';lb.style.background=bg;openModal('lightbox');};

  let active=0, timer=null;
  const cards=[];

  // ---- build the 3D coverflow cards ----
  CATS.forEach((c,i)=>{
    const cover=c.items[0];
    const bg=RBG(cover.img,GRAD[cover.grad]);
    const el=document.createElement('article');
    el.className='r3-card';
    el.innerHTML=`<div class="r3-cover" style="background:${bg}"></div>
      <span class="r3-count">${c.items.length} design${c.items.length>1?'s':''}</span>
      <div class="r3-meta"><b>${c.cat}</b><span class="r3-see">See all
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span></div>`;
    el.addEventListener('click',()=>{ i===active ? openRoom(c) : go(i); });
    stage.appendChild(el);
    cards.push(el);
    const d=document.createElement('button'); d.className='r3-dot'; d.setAttribute('aria-label',c.cat);
    d.addEventListener('click',()=>go(i)); dots.appendChild(d);
  });

  // ---- position every card in 3D space relative to the active one ----
  function place(){
    const spread=Math.min(320, Math.max(150, innerWidth*0.34)); // responsive fan-out
    const depth=Math.min(185, spread*0.6);
    cards.forEach((el,i)=>{
      let o=i-active; if(o>n/2) o-=n; if(o<-n/2) o+=n;
      const a=Math.abs(o);
      const tx=o*spread, tz=-a*depth, ry=-o*43, sc=1-a*0.15;
      const op=a===0?1:a===1?0.92:a===2?0.42:0;
      el.style.transform=`translate(-50%,-50%) translateX(${tx}px) translateZ(${tz}px) rotateY(${ry}deg) scale(${sc})`;
      el.style.opacity=op;
      el.style.zIndex=String(100-a);
      el.style.filter=`brightness(${a===0?1:a===1?0.72:0.45})`;
      el.style.pointerEvents=a>2?'none':'auto';
      el.classList.toggle('is-active',o===0);
    });
    [...dots.children].forEach((d,i)=>d.classList.toggle('active',i===active));
  }
  function go(i){ active=((i%n)+n)%n; place(); restart(); }
  const next=()=>go(active+1), prev=()=>go(active-1);
  function restart(){ clearInterval(timer); timer=setInterval(next,4200); }

  if($('r3Next')) $('r3Next').onclick=next;
  if($('r3Prev')) $('r3Prev').onclick=prev;
  room3d.addEventListener('mouseenter',()=>clearInterval(timer));
  room3d.addEventListener('mouseleave',restart);
  addEventListener('resize',place); // keep the 3D fan-out responsive
  // keyboard + swipe
  const vp=room3d.querySelector('.room3d-viewport');
  let sx=0;
  vp.addEventListener('touchstart',e=>sx=e.touches[0].clientX,{passive:true});
  vp.addEventListener('touchend',e=>{const dx=e.changedTouches[0].clientX-sx; if(Math.abs(dx)>40)(dx<0?next():prev());});
  document.addEventListener('keydown',e=>{ if(galDetail.hasAttribute('hidden')&&!room3d.hasAttribute('hidden')){ if(e.key==='ArrowRight')next(); else if(e.key==='ArrowLeft')prev(); } });

  place(); restart();

  // ---- expand a room into the detail grid ----
  function openRoom(c){
    gg.innerHTML='';
    galTitle.innerHTML=`${c.cat} <span>${c.items.length} design${c.items.length>1?'s':''}</span>`;
    c.items.forEach((g,i)=>{
      const bg = RBG(g.img, GRAD[g.grad]);
      const el=document.createElement('figure');
      el.className='gal ph';
      el.style.animationDelay=(i%9*0.06)+'s';
      el.innerHTML=`<span class="gal-tag">${g.cat}</span><figcaption><b>${g.t}</b><small>${g.s}</small></figcaption>`;
      el.style.background=bg;
      el.onclick=()=>lightbox(bg);
      gg.appendChild(el);
    });
    clearInterval(timer);
    room3d.setAttribute('hidden','');
    galDetail.removeAttribute('hidden');
    galDetail.scrollIntoView({behavior:'smooth',block:'start'});
  }

  // ---- back to the 3D carousel ----
  const back=$('galBack');
  if(back) back.onclick=()=>{
    galDetail.setAttribute('hidden','');
    room3d.removeAttribute('hidden');
    place(); restart();
    room3d.scrollIntoView({behavior:'smooth',block:'center'});
  };
}

/* ---------- inspiration tiles ---------- */
const INSP=['kitchen1','bed_angled','living1','dining','foyer','balcony'];
document.querySelectorAll('.insp-grid .insp').forEach((el,i)=>{
  el.style.background = RBG(INSP[i], GRAD['si'+(i+1)]);
  el.querySelectorAll('.swap').forEach(s=>s.remove());
});

/* ---------- backgrounds that depend on assets ---------- */
const setBg=(sel,key,grad)=>{const e=document.querySelector(sel);if(e)e.style.background=RBG(key,grad);};

// home hero crossfade slideshow
const heroBg=$('heroBg');
if(heroBg){
  // slideshow order — first entry is the image visitors land on.
  // Swap the names to reorder; all four are the original online set.
  const HERO=['heroHome3','heroHome2','heroHome4','heroHome1'];
  HERO.forEach((k,i)=>{
    const s=document.createElement('div');
    s.className='hero-slide';
    s.style.backgroundImage=`url('${ASSET[k]}')`;
    const d=(i*6.5)+'s'; s.style.animationDelay=`${d}, ${d}`;
    heroBg.appendChild(s);
  });
}
// sub-page hero banners: <div class="page-hero-bg" data-bg="cafe"></div>
document.querySelectorAll('.page-hero-bg[data-bg]').forEach(el=>{
  const k=el.getAttribute('data-bg');
  if(ASSET[k]) el.style.backgroundImage=`url('${ASSET[k]}')`;
});

setBg('.about-bg','bed_angled','linear-gradient(160deg,#c2bca8,#9d8467)');
setBg('.des-img','approach','linear-gradient(160deg,#c2bca8,#9d8467)');
const port=document.querySelector('.about-portrait'); if(port) port.style.backgroundImage=`url('${ASSET.portrait}')`;

/* ---------- counters ---------- */
/* each stat counts itself up when it scrolls in, eased so the number decelerates
   into place instead of ticking at a flat rate */
(function(){
  const nums=document.querySelectorAll('.num[data-count]'); if(!nums.length) return;
  const still=window.matchMedia('(prefers-reduced-motion:reduce)').matches;
  const ease=t=>1-Math.pow(1-t,4);   // easeOutQuart
  function paint(n,v){
    const suf=n.dataset.suffix||'';
    n.innerHTML=v+(suf?'<span class="sfx">'+suf+'</span>':'');
  }
  function run(n){
    const tgt=+n.dataset.count||0, dur=1500, t0=performance.now();
    const cell=n.closest('.stat'); if(cell) cell.classList.add('counted');
    if(still){ paint(n,tgt); return; }
    (function tick(now){
      const p=Math.min(1,(now-t0)/dur);
      paint(n,Math.round(tgt*ease(p)));
      if(p<1) requestAnimationFrame(tick);
    })(t0);
  }
  const cio=new IntersectionObserver((es)=>es.forEach(e=>{
    if(!e.isIntersecting) return;
    cio.unobserve(e.target);
    // hold back so the number starts just after its cell has faded in
    const cell=e.target.closest('.stat');
    const idx=cell&&cell.parentNode?[].indexOf.call(cell.parentNode.children,cell):0;
    setTimeout(()=>run(e.target),still?0:180+idx*90);
  }),{threshold:.5});
  nums.forEach(n=>cio.observe(n));
})();

/* ---------- stat band: spotlight follows the cursor ---------- */
(function(){
  if(!window.matchMedia('(pointer:fine)').matches) return;
  document.querySelectorAll('.stat').forEach(cell=>{
    cell.addEventListener('pointermove',e=>{
      const r=cell.getBoundingClientRect();
      cell.style.setProperty('--mx',((e.clientX-r.left)/r.width*100)+'%');
      cell.style.setProperty('--my',((e.clientY-r.top)/r.height*100)+'%');
    });
  });
})();

/* ---------- faq ---------- */
const FAQ=[
  ['Do you take on small projects or only full homes?','Both, from styling a single room to a full turnkey home. There’s no project too small if it’s a space you love.'],
  ['What does the design process look like?','Discovery → concept & mood boards → detailed design and 3D views → execution and final styling. You’re involved at every step.'],
  ['Do you work outside your city?','Yes, projects are taken on across India, with remote consultation available for clients further away.'],
  ['How are charges calculated?','It depends on scope, consultation, room-by-room, or full turnkey. Share your details for a free, no-obligation quote.'],
  ['Can you work with my budget?','Absolutely. The design is shaped around your budget from day one, so there are no surprises later.']
];
const fl=$('faqList');
if(fl){
  FAQ.forEach(f=>{
    const it=document.createElement('div');it.className='faq-item';
    it.innerHTML=`<button class="faq-q">${f[0]}<span class="pl">+</span></button><div class="faq-a"><div>${f[1]}</div></div>`;
    const a=it.querySelector('.faq-a');
    it.querySelector('.faq-q').onclick=()=>{const open=it.classList.contains('open');document.querySelectorAll('.faq-item').forEach(x=>{x.classList.remove('open');x.querySelector('.faq-a').style.maxHeight=null;});if(!open){it.classList.add('open');a.style.maxHeight=a.scrollHeight+'px';}};
    fl.appendChild(it);
  });
}

/* ---------- careers ---------- */
const CAREERS=[
  {role:'Site Engineer',type:'Full-time · Hyderabad',desc:'Coordinate site execution, client coordination, material follow-up and progress tracking for residential and commercial interiors. Civil/site experience preferred.'},
  {role:'Interior Design Intern',type:'Internship · 3–6 months',desc:'Assist with concept development, mood boards, space planning, material research and client presentations while learning the studio workflow hands-on.'}
];
const cg=$('careerGrid');
if(cg){
  CAREERS.forEach((c,i)=>{
    const accent=['#a8826a','#97987f','#ab8f68'][i%3];
    const el=document.createElement('div');
    el.className='career-card';
    el.style.borderTopColor=accent;
    // a plain mailto silently does nothing on desktops with no mail client set up,
    // so Apply opens a form that posts to the same inbox the enquiry forms use
    el.innerHTML=`<b>${c.role}</b><span class="career-type">${c.type}</span><p>${c.desc}</p>
      <button class="career-apply" type="button">Apply →</button>`;
    el.querySelector('.career-apply').addEventListener('click',()=>openApply(c.role));
    cg.appendChild(el);
  });
}

/* ---------- testimonials slider ---------- */
(function(){
  const track=$('tstTrack'); if(!track) return;
  const slides=track.children.length, dots=$('tstDots');
  let idx=0, timer;
  for(let i=0;i<slides;i++){const b=document.createElement('button');b.className='tst-dot'+(i===0?' active':'');b.onclick=()=>{idx=i;render();reset();};dots.appendChild(b);}
  function render(){track.style.transform=`translateX(-${idx*100}%)`;[...dots.children].forEach((d,i)=>d.classList.toggle('active',i===idx));}
  window.tstGo=(d)=>{idx=(idx+d+slides)%slides;render();reset();};
  function reset(){clearInterval(timer);timer=setInterval(()=>{idx=(idx+1)%slides;render();},5500);}
  let sx=0; const sl=$('tstSlider');
  sl.addEventListener('touchstart',e=>sx=e.touches[0].clientX,{passive:true});
  sl.addEventListener('touchend',e=>{const dx=e.changedTouches[0].clientX-sx;if(Math.abs(dx)>40)window.tstGo(dx<0?1:-1);});
  sl.addEventListener('mouseenter',()=>clearInterval(timer));
  sl.addEventListener('mouseleave',reset);
  render();reset();
})();

/* ---------- video tour: 3D coverflow, videos play inline on the site ----------
   Drop .mp4 files into assets/video/ using the filenames below. Any entry whose
   file is missing simply shows its poster with a "coming soon" note, the rest
   keep working, so you can add videos one at a time. */
const TOURS = [
  {t:'Walkthrough 01', s:'Tap to play', src:'assets/video/tour-01.mp4', img:'bedPichwai',   grad:'si1'},
  {t:'Walkthrough 02', s:'Tap to play', src:'assets/video/tour-02.mp4', img:'living6',      grad:'si4'},
  {t:'Walkthrough 03', s:'Tap to play', src:'assets/video/tour-03.mp4', img:'kitchen5',     grad:'si2'},
  {t:'Walkthrough 04', s:'Tap to play', src:'assets/video/tour-04.mp4', img:'partition4',   grad:'si5'},
  {t:'Walkthrough 05', s:'Tap to play', src:'assets/video/tour-05.mp4', img:'dining3',      grad:'si3'},
  {t:'Walkthrough 06', s:'Tap to play', src:'assets/video/tour-06.mp4', img:'pooja5',       grad:'si6'},
  {t:'Walkthrough 07', s:'Tap to play', src:'assets/video/tour-07.mp4', img:'living7',      grad:'si1'},
  {t:'Walkthrough 08', s:'Tap to play', src:'assets/video/tour-08.mp4', img:'kitchen7',     grad:'si4'},
  {t:'Walkthrough 09', s:'Tap to play', src:'assets/video/tour-09.mp4', img:'bedMagenta',   grad:'si5'},
  {t:'Walkthrough 10', s:'Tap to play', src:'assets/video/tour-10.mp4', img:'balcony2',     grad:'si2'}
];
(function(){
  const stage=$('tour3dStage'), dots=$('tour3dDots'), root3=$('tour3d');
  if(!stage||!dots||!root3) return;
  const n=TOURS.length;
  let active=0, timer=null;
  const cards=[];

  const playIcon='<svg viewBox="0 0 24 24" fill="currentColor" width="26" height="26"><path d="M8 5v14l11-7z"/></svg>';

  TOURS.forEach((v,i)=>{
    const el=document.createElement('article');
    el.className='r3-card tour-card';
    el.innerHTML=`<div class="r3-cover" style="background:${RBG(v.img,GRAD[v.grad])}"></div>
      <span class="r3-count">Walkthrough</span>
      <span class="tour-play">${playIcon}</span>
      <div class="r3-meta"><b>${v.t}</b><span class="r3-see">${v.s}</span></div>`;
    el.addEventListener('click',()=>{ i===active ? play(i) : go(i); });
    stage.appendChild(el); cards.push(el);
    const d=document.createElement('button'); d.className='r3-dot'; d.setAttribute('aria-label',v.t);
    d.addEventListener('click',()=>go(i)); dots.appendChild(d);
  });

  // same 3D fan-out maths as the room coverflow, so both sections move alike
  function place(){
    const spread=Math.min(320,Math.max(150,innerWidth*0.34));
    const depth=Math.min(185,spread*0.6);
    cards.forEach((el,i)=>{
      let o=i-active; if(o>n/2) o-=n; if(o<-n/2) o+=n;
      const a=Math.abs(o);
      el.style.transform=`translate(-50%,-50%) translateX(${o*spread}px) translateZ(${-a*depth}px) rotateY(${-o*43}deg) scale(${1-a*0.15})`;
      el.style.opacity=a===0?1:a===1?0.92:a===2?0.42:0;
      el.style.zIndex=String(100-a);
      el.style.filter=`brightness(${a===0?1:a===1?0.72:0.45})`;
      el.style.pointerEvents=a>2?'none':'auto';
      el.classList.toggle('is-active',o===0);
    });
    [...dots.children].forEach((d,i)=>d.classList.toggle('active',i===active));
  }

  // stop and tear down any video that is not the active card
  function stopAll(except){
    cards.forEach((el,i)=>{
      if(i===except) return;
      const vid=el.querySelector('video');
      if(vid){ vid.pause(); vid.remove(); }
      el.classList.remove('is-playing');
    });
  }

  function play(i){
    const el=cards[i], v=TOURS[i];
    stopAll(i);
    if(el.querySelector('video')) return;          // already playing
    clearInterval(timer);                          // never rotate away from a playing video
    const vid=document.createElement('video');
    vid.className='tour-video';
    vid.src=v.src; vid.controls=true; vid.autoplay=true; vid.playsInline=true; vid.preload='none';
    vid.setAttribute('controlsList','nodownload');
    vid.addEventListener('error',()=>{           // file not added yet, fall back to the poster
      vid.remove(); el.classList.remove('is-playing'); el.classList.add('tour-missing');
    });
    vid.addEventListener('ended',()=>{ vid.remove(); el.classList.remove('is-playing'); restart(); });
    el.appendChild(vid); el.classList.add('is-playing');
    const p=vid.play(); if(p&&p.catch) p.catch(()=>{});
  }

  function go(i){ active=((i%n)+n)%n; stopAll(-1); place(); restart(); }
  const next=()=>go(active+1), prev=()=>go(active-1);
  function restart(){ clearInterval(timer); timer=setInterval(()=>{ if(!stage.querySelector('video')) next(); },5200); }

  if($('tourNext')) $('tourNext').onclick=next;
  if($('tourPrev')) $('tourPrev').onclick=prev;
  root3.addEventListener('mouseenter',()=>clearInterval(timer));
  root3.addEventListener('mouseleave',()=>{ if(!stage.querySelector('video')) restart(); });
  addEventListener('resize',place);

  const vp=root3.querySelector('.room3d-viewport');
  let sx=0;
  vp.addEventListener('touchstart',e=>sx=e.touches[0].clientX,{passive:true});
  vp.addEventListener('touchend',e=>{const dx=e.changedTouches[0].clientX-sx; if(Math.abs(dx)>40)(dx<0?next():prev());});

  place(); restart();
})();

/* ---------- modals ---------- */
function openModal(id){const m=$(id);if(m){m.classList.add('open');document.body.style.overflow='hidden';}}
function closeModal(id){const m=$(id);if(m){m.classList.remove('open');document.body.style.overflow='';}}
function openQuote(){closeMenu();openModal('quoteModal');}
document.querySelectorAll('.modal').forEach(m=>m.addEventListener('click',e=>{if(e.target===m)closeModal(m.id);}));
document.addEventListener('keydown',e=>{if(e.key==='Escape')document.querySelectorAll('.modal.open').forEach(m=>closeModal(m.id));});

/* ---------- newsletter ---------- */
function subscribe(){const e=$('newsEmail').value.trim();const ok=$('newsOk');if(!e||!e.includes('@')){ok.textContent='Please enter a valid email.';return;}ok.textContent='Thank you, you’re subscribed! ✦';$('newsEmail').value='';}

/* ---------- intro preloader ---------- */
(function(){
  const pl=$('preloader'); if(!pl){document.body.classList.remove('loading');return;}
  function done(){document.body.classList.remove('loading');pl.classList.add('done');setTimeout(()=>{if(pl.parentNode)pl.remove();},850);}
  if(document.readyState==='complete') setTimeout(done,700);
  else window.addEventListener('load',()=>setTimeout(done,700));
  setTimeout(done,4000); // safety: never trap the page
})();

/* ---------- social media (single source of truth) ---------- */
const SOCIALS=[
  ['Instagram','@interiorsbykaveri','https://www.instagram.com/interiorsbykaveri/','M7.0301.084c-1.2768.0602-2.1487.264-2.911.5634-.7888.3075-1.4575.72-2.1228 1.3877-.6652.6677-1.075 1.3368-1.3802 2.127-.2954.7638-.4956 1.6365-.552 2.914-.0564 1.2775-.0689 1.6882-.0626 4.947.0062 3.2586.0206 3.6671.0825 4.9473.061 1.2765.264 2.1482.5635 2.9107.308.7889.72 1.4573 1.388 2.1228.6679.6655 1.3365 1.0743 2.1285 1.38.7632.295 1.6361.4961 2.9134.552 1.2773.056 1.6884.069 4.9462.0627 3.2578-.0062 3.668-.0207 4.9478-.0814 1.28-.0607 2.147-.2652 2.9098-.5633.7889-.3086 1.4578-.72 2.1228-1.3881.665-.6682 1.0745-1.3378 1.3795-2.1284.2957-.7632.4966-1.636.552-2.9124.0556-1.2809.0691-1.6898.0628-4.948-.0062-3.2583-.0207-3.6668-.0815-4.9465-.0607-1.2797-.264-2.1487-.5633-2.9117-.3084-.7889-.72-1.4568-1.3876-2.1228C21.2982 1.33 20.628.9208 19.8378.6165 19.0744.3214 18.2018.1196 16.9244.0645 15.6471.0093 15.236-.005 11.977.0014 8.718.0076 8.31.0215 7.0301.0839m.1402 21.6932c-1.17-.0509-1.8053-.2453-2.2287-.408-.5606-.216-.96-.4771-1.3819-.895-.422-.4178-.6811-.8186-.9-1.378-.1644-.4234-.3624-1.058-.4171-2.228-.0595-1.2645-.072-1.6442-.079-4.848-.007-3.2037.0053-3.583.0607-4.848.0508-1.169.2463-1.8055.408-2.2282.216-.5613.4762-.96.895-1.3816.4188-.4217.8184-.6814 1.3783-.9003.4232-.1651 1.0577-.3614 2.2272-.4171 1.2655-.06 1.6447-.072 4.848-.079 3.2033-.007 3.5835.005 4.8495.0608 1.169.0508 1.8053.2445 2.228.408.5608.216.96.4754 1.3816.895.4216.4194.6816.8176.9005 1.3787.1655.4218.3617 1.056.4169 2.2263.0602 1.2655.0739 1.645.0796 4.848.0058 3.203-.0055 3.5834-.0608 4.848-.051 1.17-.2453 1.8055-.408 2.2294-.216.5604-.4763.96-.8954 1.3814-.419.4215-.8181.6811-1.3783.9-.4226.1649-1.0577.3617-2.2262.4174-1.2656.0595-1.6448.072-4.8493.079-3.2045.007-3.5825-.006-4.848-.0608M16.953 5.5864A1.44 1.44 0 1 0 18.39 4.144a1.44 1.44 0 0 0-1.437 1.4424M5.8385 12.012c.0067 3.4032 2.7706 6.1557 6.173 6.1493 3.4026-.0065 6.157-2.7701 6.1506-6.1733-.0065-3.4032-2.771-6.1565-6.174-6.1498-3.403.0067-6.156 2.771-6.1496 6.1738M8 12.0033a4 4 0 1 1 4.008 3.9921A3.9996 3.9996 0 0 1 8 12.0033'],
  ['Facebook','Kaveri Interiors','https://www.facebook.com/people/Kaveri-Interiors/61567068665464/','M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z'],
  ['YouTube','@kaveriinteriors','https://www.youtube.com/@kaveriinteriors','M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z'],
  ['Pinterest','interiorsbykaveri','https://www.pinterest.com/interiorsbykaveri/','M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.607 0 11.985-5.365 11.985-11.987C23.97 5.39 18.592.026 11.985.026L12.017 0z'],
  ['Threads','@interiorsbykaveri','https://www.threads.com/@interiorsbykaveri','M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.164 1.43 1.783 3.631 2.698 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.964-.065-1.19.408-2.285 1.33-3.082.88-.76 2.119-1.207 3.583-1.291a13.853 13.853 0 0 1 3.02.142c-.126-.742-.375-1.332-.75-1.757-.513-.586-1.308-.883-2.359-.89h-.029c-.844 0-1.992.232-2.721 1.32L7.475 7.176c.98-1.452 2.568-2.252 4.601-2.252h.043c3.393.024 5.414 2.078 5.711 5.652.169.069.339.143.504.224 1.39.654 2.408 1.642 2.946 2.864.751 1.701.82 4.474-1.43 6.726-1.719 1.717-3.939 2.483-6.946 2.503Z']
];
const svgIcon=(d)=>`<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="${d}"/></svg>`;
// placeholder-aware anchor attributes: any entry whose url is '#' renders as a
// dead, clearly-labelled link rather than a broken one. All are live right now.
const socialAttrs=(name,url)=> (url && url!=='#')
  ? `href="${url}" target="_blank" rel="noopener" aria-label="${name}" title="${name}"`
  : `href="#" onclick="return false" aria-label="${name} (link coming soon)" title="${name}, link coming soon"`;
// fill every [data-socials] container (footer, founder, about, contact)
document.querySelectorAll('[data-socials]').forEach(box=>{
  box.innerHTML=SOCIALS.map(([name,,url,d])=>`<a ${socialAttrs(name,url)}>${svgIcon(d)}</a>`).join('');
});

/* ---------- connect band (platform cards) ---------- */
(function(){
  const cg=$('connectGrid'); if(!cg) return;
  cg.innerHTML=SOCIALS.map(([name,handle,url,d])=>
    `<a class="connect-card" ${socialAttrs(name,url)}>
       <span class="cc-ico">${svgIcon(d)}</span>
       <span class="cc-meta"><b>${name}</b><small>${(url&&url!=='#')?handle:'Coming soon'}</small></span>
       <span class="cc-go" aria-hidden="true"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span>
     </a>`).join('');
})();

/* ---------- model vs render comparison (slide + dissolve) ---------- */
(function(){
  const cmp=$('cmp'); if(!cmp) return;
  const handle=$('cmpHandle'), mSlide=$('cmpSlide'), mDissolve=$('cmpDissolve');
  const reduce=matchMedia('(prefers-reduced-motion:reduce)').matches;
  let pos=50, dragging=false;

  function set(p){
    pos=Math.max(0,Math.min(100,p));
    cmp.style.setProperty('--pos',pos);
    handle.setAttribute('aria-valuenow',Math.round(pos));
  }
  function fromX(x){ const r=cmp.getBoundingClientRect(); set(((x-r.left)/r.width)*100); }

  cmp.addEventListener('pointerdown',e=>{
    if(cmp.classList.contains('dissolve')) return;
    dragging=true; cmp.classList.add('touched');
    if(cmp.setPointerCapture) cmp.setPointerCapture(e.pointerId);
    fromX(e.clientX);
  });
  cmp.addEventListener('pointermove',e=>{ if(dragging) fromX(e.clientX); });
  addEventListener('pointerup',()=>{ dragging=false; });

  handle.addEventListener('keydown',e=>{
    const step=e.shiftKey?10:2;
    if(e.key==='ArrowLeft'||e.key==='ArrowDown'){ set(pos-step); e.preventDefault(); cmp.classList.add('touched'); }
    else if(e.key==='ArrowRight'||e.key==='ArrowUp'){ set(pos+step); e.preventDefault(); cmp.classList.add('touched'); }
    else if(e.key==='Home'){ set(0); e.preventDefault(); }
    else if(e.key==='End'){ set(100); e.preventDefault(); }
  });

  function slideMode(){
    cmp.classList.remove('dissolve');
    mSlide.classList.add('active'); mDissolve.classList.remove('active');
    mSlide.setAttribute('aria-selected','true'); mDissolve.setAttribute('aria-selected','false');
    set(50);
  }
  function dissolveMode(){
    cmp.classList.add('dissolve','touched');
    mDissolve.classList.add('active'); mSlide.classList.remove('active');
    mDissolve.setAttribute('aria-selected','true'); mSlide.setAttribute('aria-selected','false');
  }
  if(mSlide) mSlide.addEventListener('click',slideMode);
  if(mDissolve) mDissolve.addEventListener('click',dissolveMode);

  // one-time sweep on first view, so the interaction explains itself
  function intro(){
    if(reduce){ set(50); return; }
    let start=null; const dur=1600;
    set(88);
    requestAnimationFrame(function step(t){
      if(start===null) start=t;
      const k=Math.min((t-start)/dur,1), e=1-Math.pow(1-k,3);
      set(88-(88-50)*e);
      if(k<1) requestAnimationFrame(step);
    });
  }

  const io2=new IntersectionObserver(es=>{
    es.forEach(en=>{
      if(!en.isIntersecting) return;
      intro();
      io2.disconnect();
    });
  },{threshold:.35});
  io2.observe(cmp);
})();

/* ---------- reels strip ----------------------------------------------------
   REELS is the list shown in "Reels from the studio". To feature a reel, open it
   on Instagram, hit ⋯ → "Copy link", and take the shortcode out of the URL:

       https://www.instagram.com/reel/DK4pQrXyz12/   ->   code:'DK4pQrXyz12'

   With a code set, the card shows that reel's real Instagram cover (fetched by
   /api/reel-thumb) and plays the reel in a lightbox on this site. `cover` is the
   local image shown until the Instagram cover arrives, and if it can't be reached
   at all. An entry with no code just links out to the profile, as before.        */
const IG_URL='https://www.instagram.com/interiorsbykaveri/';
const REELS=[
  {code:'DbK6-1bTBem', cover:'living1'},     // 23 Jul 2026
  {code:'DbDSkf_TeHA', cover:'foyer'},       // 21 Jul 2026
  {code:'DbAvJtpznYy', cover:'balcony'},     // 20 Jul 2026
  {code:'Da2pTcfzXqE', cover:'dining'},      // 15 Jul 2026
  {code:'DanMgrazBzX', cover:'bed_angled'},  // 10 Jul 2026
  {code:'DakoB6UTQUI', cover:'living1'},     //  9 Jul 2026
  {code:'DaiDEy5TPrF', cover:'kitchen1'},    //  8 Jul 2026
  {code:'DaSmMlXzOid', cover:'bed_angled'}   //  2 Jul 2026
];
const reelUrl=code=>'https://www.instagram.com/reel/'+code+'/';

/* Newest reel first. A shortcode is base64 of the media id, which climbs with
   every post, so comparing codes puts them in posting order — meaning a new link
   can be pasted anywhere in the list above and still lands in the right place. */
const IG64='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
function newestFirst(a,b){
  const x=a.code||'',y=b.code||'';
  if(!x||!y) return (x?0:1)-(y?0:1);            // entries with no code sink to the end
  if(x.length!==y.length) return y.length-x.length;
  for(let i=0;i<x.length;i++){
    const d=IG64.indexOf(y[i])-IG64.indexOf(x[i]);
    if(d) return d;
  }
  return 0;
}

function openReel(code){
  const frame=$('reelFrame'); if(!frame) return;
  frame.innerHTML='<iframe src="'+reelUrl(code)+'embed/" title="Instagram reel" '+
    'frameborder="0" scrolling="no" allowtransparency="true" allowfullscreen '+
    'allow="autoplay; encrypted-media; picture-in-picture; clipboard-write; web-share"></iframe>';
  const out=$('reelOpen'); if(out) out.href=reelUrl(code);
  openModal('reelModal');
}

(function(){
  const rg=$('reelsGrid'); if(!rg) return;
  const play='<span class="reel-play"><svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg></span>';
  const tag='<span class="reel-tag"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1"/></svg>Reel</span>';
  REELS.slice().sort(newestFirst).forEach((r,i)=>{
    const a=document.createElement('a');
    a.className='reel';
    a.style.background=RBG(r.cover,GRAD['si'+((i%6)+1)]);
    if(r.code){
      // real reel: Instagram's own cover, and playback stays on this site
      a.href=reelUrl(r.code);
      a.setAttribute('aria-label','Play this reel');
      a.innerHTML='<img class="reel-thumb" src="/api/reel-thumb?code='+encodeURIComponent(r.code)+
        '" alt="" loading="lazy" decoding="async">'+tag+play;
      const im=a.querySelector('.reel-thumb');
      im.addEventListener('load',()=>im.classList.add('on'));
      im.addEventListener('error',()=>im.remove());   // keep the local cover
      a.addEventListener('click',e=>{e.preventDefault();openReel(r.code);});
    }else{
      a.href=IG_URL;
      a.target='_blank'; a.rel='noopener';
      a.setAttribute('aria-label','Watch on Instagram');
      a.innerHTML=tag+play;
    }
    rg.appendChild(a);
  });

  // drop the iframe whenever the modal closes, however it was closed, so the
  // reel stops playing instead of carrying on behind the page
  const modal=$('reelModal'), frame=$('reelFrame');
  if(modal&&frame){
    new MutationObserver(()=>{ if(!modal.classList.contains('open')) frame.innerHTML=''; })
      .observe(modal,{attributes:true,attributeFilter:['class']});
  }
})();

/* ---------- enquiry / quote submission ---------- */
/* One shape of the enquiry, shared by the email template and the sheet row. */
function enquiryParams(src, payload){
  return {
    form_type:      payload.formLabel || (src === 'quote' ? 'Quote request' : 'Contact enquiry'),
    name:           payload.name,
    phone:          payload.phone,
    location:       payload.location    || ', ',
    project_type:   payload.projectType || ', ',
    message:        payload.message     || ', ',
    email:          payload.email       || ', ',
    budget:         payload.budget      || ', ',
    design_theme:   payload.designTheme  || ', ',
    whatsapp_optin: payload.whatsappOptIn ? 'Yes' : 'No',
    page_url:       window.location.href,
    submitted_at:   new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
  };
}

/* Notification. Capped at 200/month on the free EmailJS plan. */
async function sendEmail(src, params){
  if (typeof emailjs === 'undefined') throw new Error('EmailJS SDK not loaded.');
  if (EMAILJS.PUBLIC_KEY.startsWith('YOUR_')) throw new Error('EmailJS not configured.');

  const isQuote  = src === 'quote';
  const template = isQuote ? EMAILJS.TEMPLATE_QUOTE : EMAILJS.TEMPLATE_CONTACT;
  if (template.startsWith('YOUR_')) throw new Error('EmailJS template not configured for: ' + src);

  emailjs.init({ publicKey: EMAILJS.PUBLIC_KEY });
  // Keys must match the {{placeholders}} in the matching template file. The quote
  // form now folds design theme, budget, email and notes into {{message}}, so it
  // is sent for both forms — the quote template renders {{message}} too.
  return emailjs.send(EMAILJS.SERVICE_ID, template, params);
}

/* Permanent record. No quota, this is what must not fail.
   text/plain keeps it a "simple" request: application/json would trigger a
   CORS preflight, which Apps Script does not answer. */
async function saveToSheet(params){
  if (SHEET_ENDPOINT.startsWith('YOUR_')) throw new Error('Sheet endpoint not configured.');
  const res = await fetch(SHEET_ENDPOINT, {
    method: 'POST',
    headers: {'Content-Type': 'text/plain;charset=utf-8'},
    body: JSON.stringify(params)
  });
  const data = await res.json().catch(() => ({}));
  if (!data.ok) throw new Error(data.error || 'Sheet write failed.');
  return data;
}

/* Both destinations are attempted independently: a lead is only lost if BOTH
   fail, and only then do we fall back to WhatsApp. */
async function postSubmission(src, payload){
  const params = enquiryParams(src, payload);
  const [email, sheet] = await Promise.allSettled([
    sendEmail(src, params),
    saveToSheet(params)
  ]);

  if (email.status === 'rejected') console.error('Email notify failed:', email.reason);
  if (sheet.status === 'rejected') console.error('Sheet log failed:', sheet.reason);
  if (email.status === 'rejected' && sheet.status === 'rejected'){
    throw new Error('Both email and sheet failed.');
  }
  return { emailed: email.status === 'fulfilled', logged: sheet.status === 'fulfilled' };
}
/* ---------- careers: application form ----------------------------------------
   Applications ride the same two rails as every other enquiry — an EmailJS
   notification to the studio inbox plus a row in the Google Sheet — so one
   failing never loses the candidate. A prefilled mailto stays on screen as a
   manual fallback.                                                             */
const CAREERS_EMAIL = 'interiorsbykaveri@gmail.com';

function applyMailto(role, name, phone, email, folio, note){
  const lines = ['Hi Kaveri Interiors,', '', `I'd like to apply for the ${role} role.`, ''];
  if(name)  lines.push('Name: ' + name);
  if(phone) lines.push('Phone: ' + phone);
  if(email) lines.push('Email: ' + email);
  if(folio) lines.push('Portfolio: ' + folio);
  if(note)  lines.push('', note);
  lines.push('', 'Thank you.');
  return 'mailto:' + CAREERS_EMAIL +
    '?subject=' + encodeURIComponent('Application: ' + role) +
    '&body='    + encodeURIComponent(lines.join('\n'));
}

function openApply(role){
  const label=$('applyRole'), hidden=$('applyRoleValue'), mail=$('applyMail'), res=$('applyResult');
  if(label)  label.textContent = role;
  if(hidden) hidden.value = role;
  if(mail)   mail.href = applyMailto(role);
  if(res){ res.textContent=''; res.className='form-msg'; }
  openModal('applyModal');
}

async function sendApply(){
  const g=id=>{const el=$(id);return el?el.value.trim():'';};
  const role=g('applyRoleValue')||'General application';
  const name=g('aName'), phone=g('aPhone'), email=g('aEmail'), folio=g('aFolio'), note=g('aMsg');
  if(!name||!phone){ alert('Please add your name and phone number.'); return; }

  // fold the extra fields into `message` so the existing template + sheet columns fit
  const message=[`Applying for: ${role}`, email&&`Email: ${email}`, folio&&`Portfolio: ${folio}`,
                 note&&`Note: ${note}`].filter(Boolean).join('\n');
  const payload={name, phone, location:'', projectType:'Career · '+role, message,
                 whatsappOptIn:false, formLabel:'Job application'};

  const res=$('applyResult'), btn=res?res.previousElementSibling:null;
  const label=btn?btn.textContent:'';
  if(btn&&btn.disabled) return;                 // ignore double-taps while in flight
  if(btn){ btn.disabled=true; btn.textContent='Sending…'; }
  if(res){ res.textContent=''; res.className='form-msg'; }

  try{
    await postSubmission('contact', payload);
    if(res){ res.textContent='Thanks! Your application is with the studio, we’ll be in touch soon.';
             res.className='form-msg success'; }
    ['aName','aPhone','aEmail','aFolio','aMsg'].forEach(id=>{const el=$(id); if(el) el.value='';});
    setTimeout(()=>closeModal('applyModal'), 1900);
  }catch(error){
    console.error('Application send failed:', error);
    // hand them a fully prefilled email instead of losing the application
    const mail=$('applyMail');
    if(mail) mail.href=applyMailto(role, name, phone, email, folio, note);
    if(res){ res.textContent='Could not send just now — use the email link below and it will arrive prefilled.';
             res.className='form-msg error'; }
  }finally{
    if(btn){ btn.disabled=false; btn.textContent=label; }
  }
}

function sendWhatsApp(name, phone, loc, type, msg){
  let text = `Hi Kaveri! I'd like a quote.%0A%0AName: ${name}%0APhone: ${phone}`;
  if(loc) text += `%0ALocation: ${loc}`;
  if(type) text += `%0AProject: ${type}`;
  if(msg) text += `%0ADetails: ${msg}`;
  window.open(`https://wa.me/${WA_NUMBER}?text=${text}`, '_blank');
}
/* Project type drives a follow-up dropdown: home size for a full interior,
   which drawing set for a design-only job. Hidden until the parent is chosen. */
function quoteTypeChanged(){
  const t=$('qType')?$('qType').value:'';
  const pairs=[['qHomeWrap','qHome','Full home interior'],
               ['qServiceWrap','qService','Only design service']];
  pairs.forEach(([wrapId,selId,match])=>{
    const wrap=$(wrapId), sel=$(selId);
    if(!wrap) return;
    wrap.hidden = (t!==match);
    if(wrap.hidden && sel) sel.value='';   // don't submit a stale sub-answer
  });
}

async function sendQuote(src){
  const g=id=>{const el=$(id);return el?el.value.trim():'';};
  let name,phone,loc,type,msg,wa,email='',budget='',theme='';
  if(src==='quote'){
    name=g('qName');phone=g('qPhone');loc=g('qLoc');
    // fold the sub-answer into the project type: "Full home interior · 3 BHK"
    const base=g('qType'), sub=g('qHome')||g('qService');
    type = base + (sub ? ' · ' + sub : '');
    email=g('qEmail'); budget=g('qBudget'); theme=g('qTheme');
    msg=[theme  && 'Design theme: '+theme,
         budget && 'Budget: '+budget,
         email  && 'Email: '+email,
         g('qNotes')].filter(Boolean).join('\n');
    wa=$('qWa')?$('qWa').checked:false;
  }
  else{name=g('cName');phone=g('cPhone');loc=g('cLoc');type=g('cType');msg=g('cMsg');wa=$('cWa')?$('cWa').checked:false;}
  if(!name||!phone){alert('Please add your name and phone number.');return;}
  const payload={name,phone,location:loc,projectType:type,message:msg,whatsappOptIn:wa,email,budget,designTheme:theme};
  const resultEl = $(src==='quote' ? 'quoteResult' : 'contactResult');
  // The submit button always sits immediately before the message div in both forms.
  const btn = resultEl ? resultEl.previousElementSibling : null;
  const btnLabel = btn ? btn.textContent : '';
  if(btn && btn.disabled) return;            // already in flight, ignore double-click
  if(btn){btn.disabled=true;btn.textContent='Sending…';}
  if(resultEl){resultEl.textContent='';resultEl.className='form-msg';}

  try{
    await postSubmission(src,payload);
    if(resultEl){resultEl.textContent='Thanks! Your request is received and will be responded to within 24 hours.';resultEl.className='form-msg success';}
    const fields = src==='quote'
      ? ['qName','qPhone','qEmail','qLoc','qType','qHome','qService','qTheme','qBudget','qNotes']
      : ['cName','cPhone','cLoc','cType','cMsg'];
    fields.forEach(id=>{const el=$(id); if(el) el.value='';});
    if(src==='quote') quoteTypeChanged();      // re-hide the follow-up dropdowns
    // Hold the modal open briefly so the success line is actually readable.
    if(src==='quote') setTimeout(()=>closeModal('quoteModal'),1600);
  }catch(error){
    console.error('Enquiry send failed:',error);
    if(resultEl){resultEl.textContent='Could not send just now, opening WhatsApp instead.';resultEl.className='form-msg error';}
    sendWhatsApp(name,phone,loc,type,msg);
  }finally{
    if(btn){btn.disabled=false;btn.textContent=btnLabel;}
  }
}
