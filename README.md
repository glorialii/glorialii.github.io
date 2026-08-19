# Gloria Li — Portfolio

## Structure

```
index.html        Markup only — one <section> per nav tab (home, experience,
                   projects, skills, taekwondo), no inline styles or scripts.
css/
  style.css        Numbered sections: tokens → base → nav → pages → home →
                    experience → projects → skills → taekwondo → footer →
                    focus states → mobile. See the contents comment at the
                    top of the file.
js/
  main.js          Two parts: (1) tab navigation, (2) the sound engine
                    (generative ambient pad + click, built on the Web Audio
                    API — no audio files).
assets/
  gloria-li.jpg     Home page photo
  taekwondo.png     Taekwondo page photo
  resume.pdf        Downloadable résumé (linked from Home, and the footer
                     of every page)
```

## Editing

- **Colors, type, spacing** — all live as CSS custom properties at the top
  of `css/style.css` (`:root { ... }`). Change a value there and it updates
  everywhere.
- **Adding a project** — copy one `.proj-card` block in `index.html`
  (inside `#page-projects`), and give it `data-exhibit="EXHIBIT D"` plus a
  class of `g`, `r`, or `b` for which accent color the tab uses. If there's
  no repo link yet, use a `<span class="status-tag">` instead of the
  `.gh-btn` link (see the Sola card) — swap it for the real GitHub button
  once one exists.
- **Activity log ticker** — the scrolling "departures board" band under the
  Home hero (`.ticker-board` in `index.html`) mixes work + projects in one
  chronological feed. Its content is duplicated once (two `.ticker-group`
  blocks with identical items) so the loop is seamless — if you add or
  remove an item, update both copies the same way. It pauses on hover and
  is disabled automatically for people with reduced-motion preferences set.
- **Résumé** — replace `assets/resume.pdf` with an updated file of the same
  name; every download link on the site points at that one file.

## Running locally

Just open `index.html` in a browser — no build step. If your browser
blocks local file access for the fonts/assets, serve the folder instead:

```
python3 -m http.server 8000
```

then visit `http://localhost:8000`.
