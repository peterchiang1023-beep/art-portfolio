/* ==========================================================================
   The hidden wave.
   An invisible swell follows the pointer — slowly, with its own breathing rhythm.
   You never see it, only what it moves:
     - text barely changes size (a few percent) but casts a faint ghost along the
       wave and dims in its trough — nothing is moved or rotated
     - the vertical column rules bend around it
     - the Delphic E field warps like water (desktop only)
   On phones it follows the finger, and drifts on its own when nobody is touching.
   Images and videos are never touched. Off when the system asks for reduced motion.
   ========================================================================== */
(() => {
  const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (calm) return;
  const touch = !fine;
  document.documentElement.classList.add("has-wave", touch ? "wave-touch" : "wave-pointer");

  const PROTECTED = ".video, .duo, .cover, .menu, .site-header";
  const DISPLAY = ".giant, .title, .hero-motto, .footer-motto, .statement .lead, .ways a > span, .card-meta.big h3, .offer h3, .prev-next strong";
  const READING = "main p, main dt, main dd, main li > span, main h2.label, .hero-links li, .card-meta h3, .site-footer p";

  // ---------- 1. split display type into letters (with a hidden copy for screen readers) ----------
  function split(el) {
    if (el.dataset.split || el.closest(PROTECTED)) return;
    el.dataset.split = "1";
    const text = (el.innerText || el.textContent).replace(/\s+/g, " ").trim();
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    for (const n of nodes) {
      const frag = document.createDocumentFragment();
      for (const part of n.textContent.split(/(\s+)/)) {
        if (!part) continue;
        if (/^\s+$/.test(part)) { frag.append(document.createTextNode(part)); continue; }
        const w = document.createElement("span");
        w.className = "w";
        w.setAttribute("aria-hidden", "true");
        for (const c of part) {
          const s = document.createElement("span");
          s.className = "ch";
          s.textContent = c;
          w.append(s);
        }
        frag.append(w);
      }
      n.replaceWith(frag);
    }
    const sr = document.createElement("span");
    sr.className = "sr";
    sr.textContent = text;
    el.prepend(sr);
  }
  document.querySelectorAll(DISPLAY).forEach(split);

  // Reading text is split into words (not letters), so it stays easy to read.
  // The text itself stays in the DOM, so screen readers and copy/paste are unaffected.
  function splitWords(el) {
    if (el.dataset.split || el.closest(PROTECTED) || el.closest("[data-split]") || el.querySelector("[data-split]")) return;
    el.dataset.split = "w";
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    for (const n of nodes) {
      if (!n.textContent.trim()) continue;
      const frag = document.createDocumentFragment();
      for (const part of n.textContent.split(/(\s+)/)) {
        if (!part) continue;
        if (/^\s+$/.test(part)) { frag.append(document.createTextNode(part)); continue; }
        const w = document.createElement("span");
        w.className = "wd";
        w.textContent = part;
        frag.append(w);
      }
      n.replaceWith(frag);
    }
  }
  document.querySelectorAll(READING).forEach(splitWords);

  // ---------- 2. the bending column rules ----------
  const NS = "http://www.w3.org/2000/svg";
  const rulesSvg = document.createElementNS(NS, "svg");
  rulesSvg.setAttribute("class", "wave-rules");
  rulesSvg.setAttribute("aria-hidden", "true");
  document.body.prepend(rulesSvg);
  let ruleXs = [];
  const rulePaths = [];

  // ---------- 3. the warped Delphic E fields (one SVG filter per field) ----------
  const defs = document.createElementNS(NS, "svg");
  defs.setAttribute("width", "0");
  defs.setAttribute("height", "0");
  defs.style.position = "absolute";
  document.body.append(defs);
  const fields = (touch ? [] : [...document.querySelectorAll(".field")]).map((el, i) => {
    const f = document.createElementNS(NS, "filter");
    f.id = `wave-f${i}`;
    f.setAttribute("color-interpolation-filters", "sRGB");
    f.setAttribute("x", "-5%"); f.setAttribute("y", "-5%");
    f.setAttribute("width", "110%"); f.setAttribute("height", "110%");
    const img = document.createElementNS(NS, "feImage");
    img.setAttribute("href", "images/wave-map.png");
    img.setAttribute("preserveAspectRatio", "none");
    img.setAttribute("result", "map");
    // neutral grey everywhere outside the ripple, so nothing else moves
    const flood = document.createElementNS(NS, "feFlood");
    flood.setAttribute("flood-color", "rgb(128,128,128)");
    flood.setAttribute("result", "neutral");
    const comp = document.createElementNS(NS, "feComposite");
    comp.setAttribute("in", "map");
    comp.setAttribute("in2", "neutral");
    comp.setAttribute("operator", "over");
    comp.setAttribute("result", "fullmap");
    const dm = document.createElementNS(NS, "feDisplacementMap");
    dm.setAttribute("in", "SourceGraphic");
    dm.setAttribute("in2", "fullmap");
    dm.setAttribute("xChannelSelector", "R");
    dm.setAttribute("yChannelSelector", "G");
    dm.setAttribute("scale", "0");
    f.append(flood, img, comp, dm);
    defs.append(f);
    // the filter is attached only while the wave is actually over the field (see frame())
    return { el, img, dm, on: false, url: `url(#${f.id})` };
  });

  // ---------- 4. measure (positions are cached; transforms never affect layout) ----------
  let items = [];
  function measure() {
    for (const it of items) it.el.style.transform = "";
    items = [];
    const sx = scrollX, sy = scrollY;
    // display letters (kind 1) and reading words (kind 0); each gets a small random
    // phase offset so neighbours never pulse in perfect lockstep
    document.querySelectorAll(".ch").forEach((el) => {
      const r = el.getBoundingClientRect();
      if (!r.width) return;
      const a = Math.max(0.35, Math.min(1, r.height / 110)); // big letters swell more
      items.push({ el, x: r.left + sx + r.width / 2, y: r.top + sy + r.height / 2, a, j: Math.random() * 0.7, kind: 1, on: false });
    });
    document.querySelectorAll(".wd").forEach((el) => {
      const r = el.getBoundingClientRect();
      if (!r.width) return;
      items.push({ el, x: r.left + sx + r.width / 2, y: r.top + sy + r.height / 2, a: 1, j: Math.random() * 0.7, kind: 0, on: false });
    });
    // column rules: same x positions as the CSS rules
    ruleXs = [];
    document.querySelectorAll(".rules span").forEach((s, i, all) => {
      const r = s.getBoundingClientRect();
      if (!r.width && !r.height) return;
      if (getComputedStyle(s).display === "none") return;
      ruleXs.push(r.left);
      if (i === all.length - 1) ruleXs.push(r.right - 1);
    });
    while (rulePaths.length < ruleXs.length) {
      const p = document.createElementNS(NS, "path");
      rulesSvg.append(p);
      rulePaths.push(p);
    }
    rulePaths.forEach((p, i) => (p.style.display = i < ruleXs.length ? "" : "none"));
  }
  let measureTimer;
  const remeasure = () => { clearTimeout(measureTimer); measureTimer = setTimeout(measure, 120); };
  addEventListener("resize", remeasure);
  document.fonts && document.fonts.ready.then(remeasure);
  addEventListener("load", remeasure);
  document.addEventListener("click", (e) => { if (e.target.closest(".filters")) remeasure(); });
  measure();

  // ---------- 5. the wave itself ----------
  let mx = innerWidth * 0.62, my = innerHeight * 0.45; // where the pointer is
  let wx = mx, wy = my, vx = 0, vy = 0;              // where the wave is
  let energy = 0;      // swell built up by moving; lingers, then fades
  let presence = 0;    // fades in when the pointer is over the page, out when it leaves
  let inside = false;
  let phase = 0;
  let prev = performance.now();

  addEventListener("pointermove", (e) => {
    const d = Math.hypot(e.clientX - mx, e.clientY - my);
    energy = Math.min(1, energy + d / 700); // same responsiveness as a finger on the phone
    mx = e.clientX; my = e.clientY;
    inside = true;
  }, { passive: true });
  document.addEventListener("pointerleave", () => (inside = false));

  // phones: follow the finger closely; when nobody touches, drift on a slow path of its own.
  // A touch gives the wave a push and "grip" swells it while the finger is down,
  // so scrolling with a finger leaves a clear wake right where the finger is.
  let touching = false, lastTouch = -1e9, grip = 0;
  if (touch) {
    inside = true;
    const fromTouch = (e, push) => {
      const t0 = e.touches[0];
      if (!t0) return;
      const d = Math.hypot(t0.clientX - mx, t0.clientY - my);
      energy = Math.min(1, energy + push + (push ? 0 : d / 650));
      mx = t0.clientX; my = t0.clientY;
      touching = true; lastTouch = performance.now();
    };
    addEventListener("touchstart", (e) => fromTouch(e, 0.3), { passive: true });
    addEventListener("touchmove", (e) => fromTouch(e, 0), { passive: true });
    const lift = () => { touching = false; lastTouch = performance.now(); };
    addEventListener("touchend", lift, { passive: true });
    addEventListener("touchcancel", lift, { passive: true });
    let lastY = scrollY;
    addEventListener("scroll", () => {
      energy = Math.min(1, energy + Math.abs(scrollY - lastY) / 1100);
      lastY = scrollY;
      if (!touching) lastTouch = performance.now(); // momentum scroll: keep the wave where the finger let go
    }, { passive: true });
  }
  document.documentElement.addEventListener("mouseleave", () => (inside = false));

  const LAMBDA = 95; // distance between wave crests, px

  function frame(now) {
    const dt = Math.min(0.05, (now - prev) / 1000);
    prev = now;
    const t = now / 1000;
    if (touch && !touching && now - lastTouch > 1800) {
      // idle drift: a slow, never-repeating loop around the screen
      mx = innerWidth * (0.5 + 0.34 * Math.sin(t * 0.13) + 0.08 * Math.sin(t * 0.41 + 1));
      my = innerHeight * (0.45 + 0.3 * Math.sin(t * 0.09 + 2) + 0.07 * Math.sin(t * 0.33));
    }

    // Following: a spring whose stiffness drifts, so the pursuit is never mechanical.
    let k = Math.max(0.9, 3.2 + 1.6 * Math.sin(t * 0.37) + 0.9 * Math.sin(t * 0.91 + 2.1));
    // "grip": while a finger is down (phone) or the pointer is over the page (computer),
    // the wave swells and stays close instead of trailing far behind. Quick in, slow out.
    const held = touch ? touching : inside;
    grip += ((held ? 1 : 0) - grip) * Math.min(1, dt * (held ? 6 : 1.2));
    k *= 1 + 4 * grip;
    const damp = 2 * Math.sqrt(k) * 0.82; // slightly under-damped: a little sway when it arrives
    vx += ((mx - wx) * k - vx * damp) * dt;
    vy += ((my - wy) * k - vy * damp) * dt;
    wx += vx * dt; wy += vy * dt;

    // Rhythm: three slow breaths that never line up the same way twice.
    const breath = 0.6 + 0.22 * Math.sin(t * 0.53) + 0.12 * Math.sin(t * 1.37 + 1.3) + 0.06 * Math.sin(t * 2.9 + 0.4);
    energy *= Math.exp(-dt * 0.45);
    presence += ((inside ? 1 : 0) - presence) * Math.min(1, dt * 0.9);
    const A = presence * (0.5 * breath + 0.7 * energy + 0.45 * grip); // overall strength, ~0..1.6
    const R = 250 + 70 * Math.sin(t * 0.23) + 160 * energy;     // reach, px
    phase += dt * (1.0 + 0.45 * Math.sin(t * 0.29) + 0.6 * energy); // rings travel outward, unevenly

    // --- reads first (field boxes), writes after ---
    const boxes = fields.map((f) => f.el.getBoundingClientRect());

    // field warp
    fields.forEach((f, i) => {
      const b = boxes[i];
      const size = R * 3.2;
      // only filter when the ripple overlaps this field on screen; otherwise drop the filter
      // entirely, because even a zero-strength SVG filter re-renders the whole field every frame
      const near = wx + size / 2 > b.left && wx - size / 2 < b.right && wy + size / 2 > b.top && wy - size / 2 < b.bottom;
      const visible = b.bottom > 0 && b.top < innerHeight && A > 0.01 && near;
      if (!visible) { if (f.on) { f.el.style.filter = ""; f.on = false; } return; }
      if (!f.on) f.el.style.filter = f.url;
      f.img.setAttribute("x", (wx - b.left - size / 2).toFixed(1));
      f.img.setAttribute("y", (wy - b.top - size / 2).toFixed(1));
      f.img.setAttribute("width", size.toFixed(1));
      f.img.setAttribute("height", size.toFixed(1));
      f.dm.setAttribute("scale", (Math.min(A, 1.2) * 78).toFixed(1)); // field warp keeps its old strength
      f.on = true;
    });

    // column rules bend
    const H = innerHeight, step = 22;
    ruleXs.forEach((x0, i) => {
      let d = `M${x0.toFixed(1)},-10`;
      for (let y = 0; y <= H + step; y += step) {
        const dx = x0 - wx, dy = y - wy;
        const dist = Math.hypot(dx, dy) || 1;
        const g = Math.exp(-((dist / R) ** 2));
        const s = Math.sin(dist / LAMBDA - phase * 2.1);
        const off = A * g * s * 20 + A * g * Math.sign(dx || 1) * 6;
        d += ` L${(x0 + off).toFixed(1)},${y}`;
      }
      rulePaths[i].setAttribute("d", d);
    });

    // text
    const cx = wx + scrollX, cy = wy + scrollY;
    // beyond ~1.9 R the effect is under a few percent, so those letters are left alone,
    // and so is anything scrolled out of view
    const reach2 = (R * 1.9) ** 2;
    const top = scrollY - 80, bottom = scrollY + innerHeight + 80;
    for (const it of items) {
      const dx = it.x - cx, dy = it.y - cy;
      const d2 = dx * dx + dy * dy;
      if (d2 > reach2 || A < 0.004 || it.y < top || it.y > bottom) {
        if (it.on) {
          const st = it.el.style;
          st.transform = st.textShadow = st.opacity = "";
          it.on = false;
        }
        continue;
      }
      const dist = Math.sqrt(d2) || 1;
      const g = Math.exp(-d2 / (R * R));
      // Nothing moves or turns. The wave is felt more than seen:
      //  - size changes only a few percent (height and width slightly out of step)
      //  - a faint, blurred ghost of the letter drifts out along the wave, like refraction
      //  - the trough dims the text a little, as if a shadow passes
      const p = dist / LAMBDA - phase * 2.1 + it.j;
      const sy = A * g * Math.sin(p);
      const sx = A * g * Math.sin(p - 0.9);
      const ux = dx / dist, uy = dy / dist;
      const big = it.kind === 1;
      const kx = 1 + sx * (big ? 0.034 * it.a : 0.01);
      const ky = 1 + sy * (big ? 0.045 * it.a : 0.015);
      const echo = Math.abs(sy);                                  // 0..~1
      const off = sy * (big ? 9 * it.a : 2.6);                    // px, along the wave
      const blur = (big ? 3 + 11 * echo : 1 + 3 * echo).toFixed(1);
      const alpha = Math.round(echo * (big ? 60 : 40));           // % of the text colour
      const dim = 1 - Math.max(0, -sy) * (big ? 0.32 : 0.22);
      const st = it.el.style;
      st.transform = `scale(${kx.toFixed(4)},${ky.toFixed(4)})`;
      st.textShadow = alpha > 1
        ? `${(ux * off).toFixed(1)}px ${(uy * off).toFixed(1)}px ${blur}px color-mix(in srgb, currentColor ${alpha}%, transparent)`
        : "";
      st.opacity = dim.toFixed(3);
      it.on = true;
    }

    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
