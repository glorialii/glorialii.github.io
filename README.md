# Gloria Li — Portfolio

## Structure

```
index.html        Markup only — one <section> per nav tab (home, experience,
                   projects, skills, taekwondo), no inline styles or scripts.
                   A small SVG <symbol id="turtle"> at the top of <body> is
                   reused everywhere (nav mark, hero watermark, scroll bar).
css/
  style.css        Numbered sections: tokens → base → scroll progress → nav
                    → pages → home → experience → projects → skills →
                    taekwondo → footer → focus states → mobile. See the
                    contents comment at the top of the file.
js/
  main.js          Three parts: (1) tab navigation, (2) the scroll-progress
                    bar the turtle rides, (3) the sound engine (generative
                    ambient pad + click, built on the Web Audio API — no
                    audio files).
assets/
  gloria-li.jpg     Home page photo
  taekwondo.png     Taekwondo page photo
  resume.pdf        Downloadable résumé (linked from Home, and the footer
                     of every page)
```

## Design direction

Minimal, big type, lots of whitespace — sage green as the one accent color
(kept out of the Taekwondo section on purpose, where a short red/blue belt
stripe nods to the actual competition gear colors instead). The turtle
motif ties two things together at once: turtle shells are hexagonal grids,
and grids are one of the running visual ideas across the site (the stat
grid on Home, the 5-column skills grid). The same turtle icon shows up as
the nav mark, a very faint watermark behind the hero, and riding the
scroll-progress bar at the top of the page.

## Editing

- **Colors, type, spacing** — all live as CSS custom properties at the top
  of `css/style.css` (`:root { ... }`). Change a value there and it updates
  everywhere.
- **Adding a project** — copy one `.proj-item` block in `index.html`
  (inside `#page-projects`), bump `.proj-num` to the next number. If
  there's no repo link yet, use a `<span class="proj-status">` instead of
  `.proj-link` (see the Sola entry) — swap it for the real link once one
  exists.
- **Activity ticker** — the scrolling strip under the Home stats
  (`.ticker` in `index.html`) mixes work + projects in one chronological
  feed. Its content is duplicated once (two `.ticker-group` blocks with
  identical items) so the loop is seamless — update both copies together.
  It pauses on hover and is disabled automatically for people with
  reduced-motion preferences set.
- **The turtle icon** — defined once as `<symbol id="turtle">` near the top
  of `<body>` in `index.html`, then reused with `<svg><use href="#turtle"/></svg>`
  wherever it appears. Edit the symbol once to change it everywhere.
- **Photos** — both photo containers (`.hero-photo`, `.ath-photo`) use
  `object-fit: contain` on a soft background, so the full image always
  shows rather than being cropped. Hovering either one lifts it slightly
  and plays a soft two-note chime (only if the sound toggle is on).
- **Sound layers** — all synthesized in `js/main.js`, section 5, no audio
  files. Switching tabs plays a small pentatonic motif unique to each page
  (see `PAGE_MOTIFS`) plus a filtered-noise "whoosh"; a quiet "drop" plays
  on every click anywhere, paired with the ripple effect; nav links,
  buttons, and footer links each play a quick hover tick at a different
  pitch; the stat/project/exp/skill cards play a short tick on hover,
  cycling through a 5-note run; hovering the activity ticker plays a soft
  shimmer; scrolling to the bottom of a page plays a small triumphant
  milestone run; every résumé download link plays a sparkly "unlock"
  arpeggio; turning ambient sound off plays a quiet power-down tone; and
  the turtle logo bounces with a "boop" when clicked — boop it five times
  in a row for a little fanfare. Everything is gated behind the sound
  toggle — nothing plays until the person turns it on. To add another
  sound, follow the pattern of the existing `play*` functions (they're all
  short, self-contained Web Audio snippets) and wire it to an event in one
  of the `DOMContentLoaded` blocks near the bottom of the file.
- **Click ripple** — every click spawns a small sage droplet that expands
  and fades from the cursor (`js/main.js` section 4, `.ripple` in
  `css/style.css`). Purely visual, layers with the drop sound above.
- **Scroll-reveal** — any element with class `reveal` fades and drifts up
  into place the first time it enters the viewport (`js/main.js`, section
  2), and everything already on-screen when you switch tabs reveals
  immediately rather than waiting on a scroll. Add or remove the `reveal`
  class in `index.html` to control what animates in. Falls back to fully
  visible, no animation, if JavaScript is disabled.
- **Résumé** — replace `assets/resume.pdf` with an updated file of the same
  name; every download link on the site points at that one file.

## Running locally

Just open `index.html` in a browser — no build step. If your browser
blocks local file access for the fonts/assets, serve the folder instead:

```
python3 -m http.server 8000
```

then visit `http://localhost:8000`.
