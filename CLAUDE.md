# CLAUDE.md — Chiang Cheng-Te portfolio

Handover notes for any Claude session continuing this project. Read this first.
**This repository is public** (GitHub Pages). Never commit tokens, phone numbers, private
Drive links, budgets or other non-public production material — not here, not anywhere in the repo.

## What this is

The artist portfolio of **Chiang Cheng-Te** (also known as Peter / Pierre C): a Taiwanese
performer, director, designer and trainer in theatre and film, working between Prague and Taipei.
The site sells one coherent practice with four outputs (directing, performing, design, training)
rather than four separate careers.

- Live site: https://peterchiang1023-beep.github.io/art-portfolio/
- Repo: https://github.com/peterchiang1023-beep/art-portfolio (public; Pages serves `main` from the root)
- Motto / concept: **Melting (in/to) structure** — Apollo and Dionysus, yin and yang, form and dissolution,
  identity, home, transformation; ritual, body–mind practice, Taipei ⇄ Prague.

## Run, preview, publish

- Plain HTML/CSS/JS, **no build step**. Preview from the project folder:
  `python3 -m http.server 8000` → http://localhost:8000
  (In the Claude desktop app, a sandboxed preview server could not read `~/Documents`; running the
  server in the user's own terminal tab worked.)
- After changing SVGs/CSS, browsers cache aggressively — hard refresh (Cmd+Shift+R).
- **Publish:** the user runs `./deploy.sh`. It prompts for a GitHub token (hidden input), commits any
  changes (asks first), pushes `main`, and enables Pages. The token is held in memory for that run only
  (`GH_TOKEN` env + a one-off git credential helper) — never written to disk, git config or keychain.
  **The user does not want `gh auth login` on this machine.** Never ask them to paste a token into chat,
  and never type a token yourself; they paste it into the terminal prompt.
- Commit messages end with a `Co-Authored-By:` line for Claude.

## Files

| File | Role |
|---|---|
| `data.js` | **All content.** `SITE` (name, motto, statement, bio, email, showreel), `WORKS` (projects), `PRACTICE` (workshops), `CV`. Text marked DRAFT was written by Claude and still needs the artist's own words. |
| `site.js` | Renders every page from `data.js`. Page chosen by `<body data-page="home|works|work|practice|about">`. Builds header, "+" menu, footer, rows, cards, video embeds, spotlight hover/touch. |
| `wave.js` | The hidden wave (see Design). Loaded after `site.js`. |
| `styles.css` | All styles. Colour tokens on `:root`; `body.spot` swaps them for the dark spotlight. |
| `index.html`, `works.html`, `work.html`, `practice.html`, `about.html` | Thin shells (fonts + scripts). Project pages are `work.html?id=<work id>`. |
| `images/` | `portrait.jpg`, `<work-id>/NN.jpg` galleries, generated SVGs (below), `wave-map.png`, `favicon.svg`. |
| `tools/delphic.py` | Regenerates `delphic-tile.svg`, `delphic-tile-ink.svg`, `melt-mask.svg`, `melt-mask-ink.svg`, `delphic-e.svg`, `favicon.svg`: `python3 tools/delphic.py images` |
| `tools/wavemap.py` | Regenerates `images/wave-map.png` (ripple displacement map): `python3 tools/wavemap.py images/wave-map.png` |
| `deploy.sh` | Token-prompting publish script (see above). |

Adding a project: add an object to `WORKS` in `data.js` (`id`, `title`, `year`, `roles`, `disciplines` from
Directing/Performing/Film/Design, optional `video` YouTube id, `gallery` image paths, `description`, `director`,
`venue`, `award`, `links`, `creditGroups`, `photoCredit`). The first gallery image becomes the card cover;
otherwise the YouTube thumbnail; otherwise a black typographic poster.

## Design system (agreed with the artist — keep it)

- **Colour:** coral red `#FF4040` page, near-black `#0b0a09` type, paper `#f3ece2` for lit text. No gradients on the page.
- **Type:** Archivo (Google Fonts, variable, `font-stretch: 125%` = extended grotesque, uppercase for labels/headings)
  for structure; Cormorant Garamond italic for the soft *(in/to)* and the poetic statement lines.
  The motto renders MELTING / *(in/to)* / STRUCTURE — `(in/to)` slowly blurs (CSS `soften` animation).
- **Grid:** visible thin vertical column rules (thirds), label column + content columns (`.row`). Inspired by
  the *style* of adamclarkecolour.com (flat red, black extended caps, rules, "+" menu, spotlight hover) —
  adapted, **not copied**; keep it original.
- **Media:** project images are red/black duotone (`.duo`, grayscale + multiply, slight blur on cards).
  Hovering a card/video → page turns black (`body.spot`) and that work shows in full colour.
  Gallery photos have no blur. **The portrait is shown as photographed (true B&W, sharp, no duotone)** —
  the artist disliked it blurred.
- **The Delphic E motif** (from the artist's own sketch): central stem, horizontal bar, outward arcs; **square-cut
  stroke ends** (match the font, not rounded); the loop is an **ellipse ~1.45× long** (reads as a sideways
  hourglass / DNA). Repeated, arcs join into an endless chain `|0|0|0|` → `delphic-tile.svg`, two offset rows.
  Background field (`.field`, built by `frieze()` in site.js): chains rotated **−28°**, drifting along their own
  axis (80 s/cycle), behind the hero, page titles and footer. Two layers: crisp chain masked by
  `melt-mask.svg` (bold liquid ink blot: warp, drips, holes, droplets) + swollen/blurred chain masked by
  `melt-mask-ink.svg` (ink bleeding into wet paper). Pattern ~17% black on red; on black it turns red.
  The logo (name mark + favicon) is a **diagonal stem–loop–stem** unit (starts and ends with a stroke).
- **The hidden wave (`wave.js`)** — iterated several times with the artist; current agreed state:
  - The pointer is hidden (shown again over links, buttons, menu, videos). An invisible swell follows it on a
    spring whose stiffness drifts, with layered "breathing" sines, a lingering swell from movement, and
    unevenly travelling rings — slow, heavy, never robotic.
  - **Text never moves or rotates.** Display type is split into letters (`.ch`), reading text into words (`.wd`).
    The wave barely scales them (≈±4.5% letters, ±1.5% words) and is felt mainly as a **faint blurred ghost**
    (`text-shadow` drifting along the wave) and **dimming in the trough**. Artist feedback history:
    big scaling looked "cartoonish"; translate/rotate was rejected; the quiet ghost version was "the right
    direction", then raised ~1.5×. Tuning constants are in the text loop at the end of `frame()`.
  - Column rules bend (SVG paths); on desktop the E field warps via an SVG `feDisplacementMap` filter fed by
    `wave-map.png` (composited over neutral grey so only the ripple area moves).
  - **Phones/tablets:** wave follows the finger and drifts on its own when idle; no field warp (too heavy for
    phone GPUs). Press-and-hold a card/video/gallery image = touch version of the spotlight (a swipe doesn't trigger it).
  - Images and videos are never deformed. Everything is off under `prefers-reduced-motion`.
  - Gotchas: positions are measured once and cached (remeasured on resize/fonts/filter clicks) because
    transforms don't affect layout; CSS uses child selectors (`.giant > span`, `.ways a > span`, `.poster > span`)
    so the generated letter spans aren't styled as blocks.

## Content facts & decisions (confirmed by the artist)

- Public name: **Chiang Cheng-Te** everywhere (aka Peter / Pierre C). Some Nine Songs documents spell it
  "Cheng Te Chiang"; the site keeps Chiang Cheng-Te.
- **Nine Songs: Rituals of Longing** (flagship page): **co-directed with Allegra Stodolsky**; Chiang Cheng-Te is
  **producer** (main funder) and plays the Shaman (lead performer); **co-produced by ReCompose and Seagull Films**;
  support: Academy of Performing Arts in Prague only (**do not list TECO or TCCCZ**). Dance film shot in Prague
  2025 + live installation-performance (work in progress) at HAMU Gallery, 14 Dec 2025. Award: AMU
  Interfaculty Competition 2025. Project site: ninesongs.org. Photos: Hoi Man. Credits are in `data.js`.
  Keep pitch-only material off the site: funding asks, budgets, touring schedule, unconfirmed partners,
  internal reflections, contacts, unreleased edits.
- Terrorizers: director and actor, DAMU, award DAMU Internal Competition 2025.
- Teaching: assistant pedagogue, **Department of Scenography first**, DAMU (also working with Authorial Acting —
  not official yet). Trained instructor & assistant to Savvas Stroumpos, Attis Theatre (Terzopoulos method).
- Skills: Mandarin (native), English (fluent), Czech/French/Greek (beginner); erhu, clarinet, piano; baritone.
- Only the email is public — no phone numbers or body measurements on the site.
- Production photos came from the artist's own portfolio PDF and the Nine Songs Drive (the artist will share
  links again if needed — **don't put Drive links in this public repo**). Other artists' portfolios in those
  folders were not used.

## Open to-dos

1. Director's statement for Nine Songs (from the artist; the section is hidden while empty).
2. Rewrite DRAFT texts in `data.js`: artist statement, Practice intro, the three workshop offers.
3. Higher-resolution photos: Terrorizers and For Now, Until Then, Forever (~740 px), ION/Playground, and the
   original file of the portrait (the current one is a compressed chat copy).
4. Credit check: dramaturg "Jan Hurta" vs "Honda Hurta" in the Nine Songs sheet.
5. Optional ideas offered but not done: stronger DNA reading (arcs crossing at each stem); wave tuning per element;
   a Chinese-language version; updating the artist's Google Doc CV with the corrections already reflected on the site.

## Working with this artist

- Writes in English (not native); likes to see results in the browser and iterate visually.
- Prefers a recommendation plus a preview over long option lists; small, precise adjustments when tuning.
- Ask before publishing; they run `deploy.sh` themselves.
