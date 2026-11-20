(() => {
  const { SITE, WORKS, PRACTICE, CV } = window;
  const page = document.body.dataset.page;
  const $ = (s, el = document) => el.querySelector(s);

  // ---------- helpers ----------
  const esc = (s) =>
    String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const paras = (arr) => (arr || []).map((p) => `<p>${esc(p)}</p>`).join("");
  const thumb = (id) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
  const bigThumb = (id) => `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`;
  const workUrl = (w) => `work.html?id=${encodeURIComponent(w.id)}`;
  const byYear = (a, b) => String(b.year).localeCompare(String(a.year));
  const pad = (n) => String(n).padStart(2, "0");
  // "Melting (in/to) structure" -> MELTING <em>(in/to)</em> STRUCTURE
  const motto = (m = SITE.motto) => esc(m).replace(/\((.*?)\)/, '<em class="soft">($1)</em>');
  // Background frieze of ruined Delphic E's (the ritual motif).
  const frieze = (cls = "") => `<div class="frieze ${cls}" aria-hidden="true"><div class="frieze-band"></div></div>`;

  // Click-to-play YouTube (nothing loads from YouTube until clicked).
  const videoBlock = (id, label = "Play") => `
    <div class="video duo" data-yt="${esc(id)}">
      <img src="${bigThumb(id)}" alt="" loading="lazy" onerror="this.onerror=null;this.src='${thumb(id)}'">
      <button class="play" aria-label="${esc(label)}"><span class="play-icon"></span><span class="play-label">${esc(label)}</span></button>
    </div>`;
  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".video .play");
    if (!btn) return;
    const box = btn.closest(".video");
    box.classList.remove("duo");
    box.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${box.dataset.yt}?autoplay=1&rel=0" title="Video" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>`;
  });

  // Card cover: photo or video still in duotone; otherwise a black typographic block.
  const cover = (w) => {
    const img = (w.gallery && w.gallery[0]) || (w.video && thumb(w.video));
    if (img) return `<div class="cover duo"><img src="${esc(img)}" alt="" loading="lazy"></div>`;
    return `<div class="cover poster"><span>${esc(w.title)}</span></div>`;
  };
  const card = (w) => `
    <a class="card" href="${workUrl(w)}" data-disc="${esc((w.disciplines || []).join(" "))}">
      ${cover(w)}
      <div class="card-meta">
        <div><h3>${esc(w.title)}</h3><p>${esc(w.roles.join(" + "))}</p></div>
        <div class="right"><p>${esc((w.disciplines || [])[0] || "")}</p><p>${esc(w.year)}</p></div>
      </div>
      ${w.award && w.award.startsWith("Award") ? `<p class="flag">Award</p>` : ""}
    </a>`;
  const row = (label, body, { count, id, cls = "" } = {}) => `
    <section class="row wrap ${cls}"${id ? ` id="${id}"` : ""}>
      <div class="row-label"><h2 class="label">${label}</h2>${count != null ? `<span class="label count">(${pad(count)})</span>` : ""}</div>
      <div class="row-body">${body}</div>
    </section>`;
  const cvRows = (rows) =>
    `<ul class="cv-list">${rows
      .map(([y, a, b]) => `<li><span class="y">${esc(y)}</span><span>${b ? `<strong>${esc(a)}</strong><em>${esc(b)}</em>` : esc(a)}</span></li>`)
      .join("")}</ul>`;

  // ---------- shell: rules, header, menu, footer ----------
  const navItems = [
    ["works.html", "Works", "works"],
    [workUrl(WORKS.find((w) => w.featured) || WORKS[0]), "Nine Songs", "nine"],
    ["practice.html", "Practice", "practice"],
    ["about.html", "About", "about"],
    ["#contact", "Contact", "contact"],
  ];
  document.body.insertAdjacentHTML(
    "afterbegin",
    `<div class="rules wrap" aria-hidden="true"><span></span><span></span><span></span></div>
    <header class="site-header wrap">
      <a class="brand" href="index.html"><span class="e-mark" aria-hidden="true"></span><span>${esc(SITE.name)}</span></a>
      <nav class="quick">${navItems
        .slice(0, 4)
        .map(([href, label, key]) => `<a href="${href}"${key === page || (page === "work" && key === "works") ? ' aria-current="page"' : ""}>${label}</a>`)
        .join("")}</nav>
      <button class="menu-btn" aria-expanded="false" aria-controls="menu"><span class="plus" aria-hidden="true"></span><span class="sr">Menu</span></button>
    </header>
    <div class="menu" id="menu" hidden>
      <div class="menu-inner wrap">
        <nav class="menu-big">${navItems.map(([href, label]) => `<a href="${href}">${label}</a>`).join("")}</nav>
        <div class="menu-side">
          <p class="label">Works</p>
          <ul>${WORKS.slice(0, 10).map((w) => `<li><a href="${workUrl(w)}"><strong>${esc(w.title)}</strong> ${esc(w.year)}</a></li>`).join("")}</ul>
          <p class="label">${esc(SITE.email)}</p>
        </div>
      </div>
    </div>`
  );
  document.body.insertAdjacentHTML(
    "beforeend",
    `<footer class="site-footer" id="contact">
      ${frieze("on-dark")}
      <div class="wrap">
        <p class="footer-motto">${motto()}</p>
        <div class="footer-cols">
          <div><p class="label">Contact</p><p><a href="mailto:${esc(SITE.email)}">${esc(SITE.email)}</a></p></div>
          <div><p class="label">Based in</p><p>${esc(SITE.places)}</p></div>
          <div><p class="label">Showreel</p><p><a href="https://youtu.be/${esc(SITE.showreel)}" target="_blank" rel="noopener">Movement showreel ↗</a></p></div>
        </div>
        <p class="label copyright">© ${new Date().getFullYear()} ${esc(SITE.name)}</p>
      </div>
    </footer>`
  );

  const menu = $("#menu");
  const menuBtn = $(".menu-btn");
  const setMenu = (open) => {
    menu.hidden = !open;
    menuBtn.setAttribute("aria-expanded", open);
    document.body.classList.toggle("menu-open", open);
  };
  menuBtn.addEventListener("click", () => setMenu(menu.hidden));
  menu.addEventListener("click", (e) => e.target.closest("a") && setMenu(false));
  document.addEventListener("keydown", (e) => e.key === "Escape" && setMenu(false));

  // Spotlight: hovering a work turns the page black and brings that image to full colour.
  if (matchMedia("(hover: hover)").matches) {
    document.addEventListener("mouseover", (e) => {
      const c = e.target.closest(".card, .video.duo");
      document.querySelectorAll(".is-lit").forEach((el) => el !== c && el.classList.remove("is-lit"));
      if (c) c.classList.add("is-lit");
      document.body.classList.toggle("spot", !!c);
    });
  }

  const main = $("main");

  // ---------- pages ----------
  const pages = {
    home() {
      const featured = WORKS.find((w) => w.featured);
      const selected = ["terrorizers", "ion", "playground", "through", "house-of-democracy", "kill-the-banana-trees"]
        .map((id) => WORKS.find((w) => w.id === id))
        .filter(Boolean);
      const [first, ...rest] = SITE.name.split(" ");
      main.innerHTML = `
        <section class="hero wrap">
          ${frieze("hero-frieze")}
          <div class="hero-top">
            <div><p class="label">${esc(SITE.places)}</p><p class="label thin">Theatre &amp; film</p></div>
            <div><p class="label thin">${esc(SITE.roles).replace(/ · /g, "<br>")}</p></div>
            <div><ul class="label hero-links">
              <li><a href="works.html?d=Directing">Directing</a></li>
              <li><a href="works.html?d=Performing">Performing</a></li>
              <li><a href="works.html?d=Film">Film</a></li>
              <li><a href="works.html?d=Design">Design</a></li>
              <li><a href="practice.html">Training</a></li>
            </ul></div>
          </div>
          <div class="hero-bottom">
            <p class="hero-motto">${motto()}</p>
            <h1 class="giant"><span>${esc(first)}</span><span class="nw">${esc(rest.join(" "))}</span></h1>
          </div>
        </section>

        ${row("Statement", `<div class="statement">${SITE.statement.map((p, i) => `<p class="${i === 0 ? "lead" : ""}">${esc(p)}</p>`).join("")}</div>`)}

        ${featured ? row("Featured", `
          ${videoBlock(featured.video, featured.videoLabel ? `Watch the ${featured.videoLabel.toLowerCase()}` : "Watch")}
          <div class="card-meta big">
            <div><h3><a href="${workUrl(featured)}">${esc(featured.title)}</a></h3><p>${esc(featured.roles.join(" + "))}</p></div>
            <div class="right"><p>${esc(featured.award || "")}</p><p><a href="${workUrl(featured)}">Director’s page →</a></p></div>
          </div>`) : ""}

        ${row("Selected works", `<div class="cards">${selected.map(card).join("")}</div><p class="after"><a class="label" href="works.html">All works →</a></p>`, { count: selected.length })}

        ${row("One practice,<br>four ways in", `
          <div class="ways">
            <a href="works.html?d=Directing"><span>Directing</span><small>Authorial productions for stage and film</small></a>
            <a href="works.html?d=Performing"><span>Performing</span><small>Physical theatre, dance, film, live music</small></a>
            <a href="works.html?d=Design"><span>Design</span><small>Video and scenography for theatre</small></a>
            <a href="practice.html"><span>Training</span><small>Terzopoulos method & body-mind practice</small></a>
          </div>`)}`;
    },

    works() {
      const discs = ["All", "Directing", "Performing", "Film", "Design"];
      let active = new URLSearchParams(location.search).get("d");
      if (!discs.includes(active)) active = "All";
      const list = [...WORKS].sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0) || byYear(a, b));
      const n = (d) => (d === "All" ? WORKS.length : WORKS.filter((w) => w.disciplines.includes(d)).length);
      main.innerHTML = `
        <section class="page-head wrap">${frieze()}
          <h1 class="giant">Works</h1>
        </section>
        ${row(
          `<span class="filters" role="group" aria-label="Filter works">${discs
            .map((d) => `<button data-d="${d}">${d} <span>(${pad(n(d))})</span></button>`)
            .join("")}<a href="practice.html">Training →</a></span>`,
          `<div class="cards" id="grid">${list.map(card).join("")}</div>`,
          { cls: "works-row" }
        )}`;
      const apply = () => {
        main.querySelectorAll(".filters button").forEach((b) => b.setAttribute("aria-pressed", b.dataset.d === active));
        main.querySelectorAll("#grid .card").forEach((c) => {
          c.hidden = active !== "All" && !c.dataset.disc.split(" ").includes(active);
        });
        const url = new URL(location);
        active === "All" ? url.searchParams.delete("d") : url.searchParams.set("d", active);
        history.replaceState(null, "", url);
      };
      main.querySelector(".filters").addEventListener("click", (e) => {
        const b = e.target.closest("button");
        if (!b) return;
        active = b.dataset.d;
        apply();
      });
      apply();
    },

    work() {
      const id = new URLSearchParams(location.search).get("id");
      const i = WORKS.findIndex((w) => w.id === id);
      const w = WORKS[i];
      if (!w) {
        main.innerHTML = `<section class="page-head wrap">${frieze()}<h1 class="giant">Not found</h1><p><a class="label" href="works.html">All works →</a></p></section>`;
        return;
      }
      document.title = `${w.title} — ${SITE.name}`;
      const facts = [
        ["Year", w.year],
        ["Role", w.roles.join(", ")],
        ["Form", w.form],
        ["Director", w.director],
        ["Venue", w.venue],
        ["Original title", w.originalTitle],
        ["Recognition", w.award],
      ].filter(([, v]) => v);
      const prev = WORKS[(i - 1 + WORKS.length) % WORKS.length];
      const next = WORKS[(i + 1) % WORKS.length];
      const sub = (title, html) => (html ? row(title, html) : "");
      main.innerHTML = `
        <section class="page-head wrap">${frieze()}
          <p class="label"><a href="works.html">Works</a> / ${esc((w.disciplines || []).join(" + "))}</p>
          <h1 class="title">${esc(w.title)}</h1>
        </section>
        ${w.video ? `<section class="wrap">${videoBlock(w.video, w.videoLabel ? `Watch the ${w.videoLabel.toLowerCase()}` : "Watch")}</section>` : ""}
        ${row(
          `<dl class="facts">${facts.map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join("")}</dl>`,
          `<div class="prose">${w.description ? paras(w.description) : `<p>${esc(w.summary)}</p>`}</div>`,
          { cls: "work-main" }
        )}
        ${sub("The source", w.source ? `<div class="prose"><p>${esc(w.source)}</p></div>` : "")}
        ${sub("Director’s note", w.directorNote?.length ? `<div class="prose">${paras(w.directorNote)}</div>` : "")}
        ${sub("Process", w.process?.length ? `<div class="prose">${paras(w.process)}</div>` : "")}
        ${sub("Productions", w.list ? cvRows(w.list.map(([y, t, d]) => [y, t, d])) : "")}
        ${sub("Credits", w.credits?.length ? `<dl class="facts two">${w.credits.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join("")}</dl>` : "")}
        ${w.gallery?.length ? `<section class="wrap gallery">${w.gallery.map((src) => `<div class="duo"><img src="${esc(src)}" alt="${esc(w.title)}" loading="lazy"></div>`).join("")}</section>` : ""}
        <nav class="prev-next wrap">
          <a href="${workUrl(prev)}"><span class="label">← Previous</span><strong>${esc(prev.title)}</strong></a>
          <a href="${workUrl(next)}"><span class="label">Next →</span><strong>${esc(next.title)}</strong></a>
        </nav>`;
    },

    practice() {
      main.innerHTML = `
        <section class="page-head wrap">${frieze()}
          <p class="label">Practice & training</p>
          <h1 class="title">The body as a place of transformation</h1>
        </section>
        ${row("Approach", `<div class="statement">${PRACTICE.intro.map((p, i) => `<p class="${i === 0 ? "lead" : ""}">${esc(p)}</p>`).join("")}</div>`)}
        ${row("Workshops", `
          <div class="offers">
            ${PRACTICE.offers.map((o, i) => `<div class="offer"><span class="label">${pad(i + 1)}</span><h3>${esc(o.title)}</h3><p class="label thin">${esc(o.who)}</p><p>${esc(o.text)}</p></div>`).join("")}
          </div>
          <p class="label thin formats">${esc(PRACTICE.formats)}</p>
          <p><a class="button" href="mailto:${esc(SITE.email)}?subject=${encodeURIComponent("Workshop enquiry")}">Book a workshop →</a></p>`, { count: PRACTICE.offers.length })}
        ${row("Teaching", cvRows(CV.pedagogy))}
        ${row("Training lineage", cvRows(CV.workshops))}`;
    },

    about() {
      main.innerHTML = `
        <section class="page-head wrap">${frieze()}
          <p class="label">About</p>
          <h1 class="giant small"><span>${esc(SITE.name.split(" ")[0])}</span><span class="nw">${esc(SITE.name.split(" ").slice(1).join(" "))}</span></h1>
        </section>
        ${row(
          `<figure class="portrait duo"><img src="images/portrait.jpg" alt="Portrait of ${esc(SITE.name)}"></figure><p class="label thin">also ${esc(SITE.alsoKnownAs)}</p>`,
          `<div class="prose">${paras(SITE.bio)}</div><p><a class="button" href="https://youtu.be/${esc(SITE.showreel)}" target="_blank" rel="noopener">Movement showreel ↗</a></p>`,
          { cls: "about-main" }
        )}
        ${row("Skills", `<dl class="facts">${Object.entries(CV.skills).map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join("")}</dl>`)}
        ${row("Awards", cvRows(CV.awards))}
        ${row("Festivals", cvRows(CV.festivals))}
        ${row("Directing", cvRows(CV.directing))}
        ${row("Performing", cvRows(CV.performing))}
        ${row("Teaching", cvRows(CV.pedagogy))}
        ${row("Education", cvRows(CV.education))}
        ${row("Workshops attended", cvRows(CV.workshops))}`;
    },
  };

  (pages[page] || pages.home)();
})();
