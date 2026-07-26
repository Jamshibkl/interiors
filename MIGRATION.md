# Intrio migration — porting checklist

Working notes for moving this site onto the Intrio template
(ThemeForest #63681229, Regular License).

## Before starting

- [ ] Intrio ZIP purchased and extracted; path known
- [ ] Current site committed to git so we can roll back
- [ ] Confirm which of Intrio's 5 homepage variants to use

## Pages to rebuild (7)

| Page | Notes |
|---|---|
| `index.html` | Hero slideshow, services, why-us, founder, reels, testimonials, FAQ |
| `about.html` | Founder block (photo removed), why-us cards, process |
| `services.html` | Service cards + modal detail, 10-step process timeline |
| `gallery.html` | 3D coverflow, model↔render comparison, video tour carousel |
| `workshop.html` | 4 course cards, why-us |
| `careers.html` | Role listings |
| `contact.html` | Contact form, map, connect band |

## Custom features to port (none of these ship with Intrio)

**Integrations — must keep working**
- [ ] EmailJS quote + contact forms (`EMAILJS` config, `js/app.js`)
- [ ] Google Sheets lead logger (`SHEET_ENDPOINT`) — the permanent lead record
- [ ] WhatsApp floating button (`WA_NUMBER`)

**Interactive components**
- [ ] Gallery 3D coverflow, grouped by room category (incl. Pooja Room)
- [ ] Lightbox for gallery detail grid
- [ ] SketchUp ↔ render drag comparison (slide + dissolve modes)
- [ ] Video tour coverflow (plays local files inline, `assets/video/`)
- [ ] Services modal with per-service detail
- [ ] Testimonials slider
- [ ] FAQ accordion
- [ ] Animated stat counters
- [ ] Intro preloader (first visit per session only)
- [ ] Scroll progress bar + custom cursor
- [ ] Careers listings, newsletter, connect band

## Content / assets

- [ ] `assets/opt/` — ~110 images, keep paths or remap via `js/assets.js`
- [ ] `js/assets.js` — ASSET map incl. `pooja1..4`, hero keys, logos (base64)
- [ ] Founder bio copy (architect + interior designer, Hyderabad)
- [ ] Social links (`SOCIALS` array — Instagram, Facebook, YouTube, Pinterest, Threads)
- [ ] Favicon + apple-touch-icon

## Decisions to make

- Keep `scripts/build-pages.js` generator, or hand-maintain Intrio's pages?
- Keep the `public/` mirror, or serve directly from root?
  (Vercel currently serves `public/` — see `vercel.json`)
- Intrio is Bootstrap 5; current site is custom CSS. Do we keep any of
  `css/styles.css`, or start clean from Intrio's stylesheet?

## Rollback

Everything is in git on `main`. Branch before the port:

```
git checkout -b intrio-migration
```
