# Endean's Barber Shop

The website for Endean's Barber Shop, 10a Harbour Road, Par, Cornwall PL24 2BB.

Five hand-written HTML pages served as static files from Cloudflare. There is no
framework, no template engine and no build step for the site itself — what is in
`public/` is exactly what gets served. Editing a page means opening that page's
`.html` file and changing the words.

---

## How it deploys

The site is a **Cloudflare Pages** project called `endeans`, live at
<https://endeans.pages.dev>. The repository is connected to it, so **pushing to
`main` puts the change live.** Nothing else to run.

```
git add -A
git commit -m "Update opening hours"
git push
```

Cloudflare picks up the push and uploads everything in `public/`. It takes about
thirty seconds.

### Connecting the repository (one time only)

1. Cloudflare dashboard → **Workers & Pages** → **endeans**
2. **Settings** → **Builds & deployments** → **Connect to Git**
3. Pick `manflutube-afk/endeans`, production branch `main`
4. **Framework preset:** None
   **Build command:** leave empty
   **Build output directory:** `public`

There is no build to configure because there is nothing to build — the files in
`public/` are the site exactly as served.

### Deploying by hand

If you ever need to push a change without going through Git:

```bash
npm run deploy
```

That runs `wrangler pages deploy`, which reads the project name and output
directory out of `wrangler.jsonc`.

---

## Working on it locally

```bash
npm install          # once
npm run dev          # serves the site at http://localhost:8787
```

Other commands:

| Command | What it does |
| --- | --- |
| `npm run check` | Checks every local link and image path actually exists. Run this before pushing. |
| `npm run images` | Rebuilds `public/assets/img/` from the originals in `source-images/`. |
| `npm run set-domain <domain>` | Rewrites every canonical URL, Open Graph tag, sitemap entry and piece of structured data to a new domain. |

---

## What is where

```
public/                     everything that gets served, exactly as served
├── index.html              Home
├── services/index.html     Services
├── about/index.html        About
├── gallery/index.html      Gallery
├── visit/index.html        Opening hours, address, map
├── 404.html                Shown for any unknown address
├── robots.txt              Points crawlers at the sitemap
├── sitemap.xml             The five pages, for Google
├── site.webmanifest        Icons and colours for "add to home screen"
├── _headers                Cache and security headers, read by Cloudflare
└── assets/
    ├── css/                one file per concern — see below
    ├── js/                 nav.js, hours.js, lightbox.js, year.js
    └── img/                generated — do not edit by hand

source-images/              the original photographs, never served
tools/                      build-images, set-domain, check-links
wrangler.jsonc              Cloudflare configuration
```

### The stylesheets

Each file owns one thing, and each page loads only what it uses.

| File | Owns |
| --- | --- |
| `tokens.css` | Every colour, font and radius. Change a brand colour here and it changes everywhere. |
| `base.css` | Reset, page shell, typography, the background grain and barber poles. |
| `header.css` | The sticky header and the mobile menu. |
| `footer.css` | The footer. Brings its own colours so it looks identical on every page. |
| `buttons.css` | The call-to-action buttons in their three finishes. |
| `cards.css` | Service cards, pills and badges. |
| `photos.css` | The organic photo crops. |
| `lightbox.css` | The full-screen photo viewer. |
| `home.css`, `services.css`, `about.css`, `gallery.css`, `visit.css` | Layout for that one page only. |

### The scripts

All four are plain JavaScript, no dependencies, loaded with `defer`. The site
works with JavaScript turned off — these only add conveniences.

- `nav.js` — opens and closes the mobile menu.
- `hours.js` — highlights today's row in the opening hours and works out whether
  the shop is open right now. **The opening times are written in this file as
  well as in the page markup** — if the hours change, update both, plus the
  `openingHoursSpecification` block in `visit/index.html` and `index.html`.
- `lightbox.js` — the photo viewer. It picks up any `.ph` element automatically.
- `year.js` — keeps the copyright year current.

---

## Making common changes

**Change the opening hours.** Four places, all in this repo:
`public/visit/index.html` (the `<ul class="hours">` list *and* the
`openingHoursSpecification` in the structured data), the `<ul class="footer-hours">`
block in each of the six pages, `public/index.html`'s structured data, and the
`WEEK` table at the top of `public/assets/js/hours.js`.

**Add a photograph.** Drop it in `source-images/`, add it to the list in
`tools/build-images.mjs`, run `npm run images`, then add a `<div class="ph soft">`
block to `public/gallery/index.html` copying one of the existing ones. The
lightbox picks it up on its own.

**Change a phone number or the address.** It appears in the footer of all six
pages, in the structured data on `index.html` and `visit/index.html`, and in the
contact links on `visit/index.html`. Search the repo for the old number to catch
every instance.

---

## Search engines

The site is set up for Google, but two steps have to be done by a person:

1. **Google Search Console** — add the site as a property at
   <https://search.google.com/search-console>, verify it (the DNS TXT method is
   easiest if the domain is on Cloudflare), then submit `sitemap.xml`.
2. **Google Business Profile** — for a local shop this matters more than the
   website does. Claim the listing at <https://business.google.com>, and make
   sure the name, address, phone number and opening hours match this site
   character for character. Google cross-checks them.

Already handled in the code: per-page titles and descriptions, canonical URLs,
Open Graph and Twitter cards, `HairSalon` structured data with address and
opening hours, breadcrumbs on every sub-page, a sitemap and a robots.txt.

### A note on the domain

The site currently uses `endeans.pages.dev`. A `pages.dev` subdomain works and
is perfectly stable, but Google gives it no local-search weight and it reads as
a test address to a customer who sees it. When a real domain is ready:

```bash
npm run set-domain endeansbarbers.co.uk
```

That rewrites every canonical URL, Open Graph tag, sitemap entry and piece of
structured data in one pass. Then add the domain in the Cloudflare dashboard
under **Workers & Pages → endeans → Custom domains**, and re-verify the new
address in Search Console.
