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

  // Click-to-play YouTube (loads nothing from YouTube until clicked).
  const videoBlock = (id, label = "Play video") => `
    <div class="video" data-yt="${esc(id)}">
      <img src="${bigThumb(id)}" alt="" loading="lazy" onerror="this.onerror=null;this.src='${thumb(id)}'">
      <button class="play" aria-label="${esc(label)}"><span class="play-icon"></span><span class="play-label">${esc(label)}</span></button>
    </div>`;
  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".video .play");
    if (!btn) return;
    const box = btn.closest(".video");
    box.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${box.dataset.yt}?autoplay=1&rel=0" title="Video" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>`;
  });

  // Cover image for a card: video still if there is one, otherwise a typographic poster.
  const cover = (w) => {
    const img = (w.gallery && w.gallery[0]) || (w.video && thumb(w.video));
    if (img) return `<div class="cover"><img src="${esc(img)}" alt="" loading="lazy"></div>`;
    return `<div class="cover poster" data-tone="${(w.title.length % 3) + 1}"><span>${esc(w.title)}</span></div>`;
  };
  const card = (w) => `
    <a class="card" href="${workUrl(w)}" data-disc="${esc((w.disciplines || []).join(" "))}">
      ${cover(w)}
      <div class="card-meta">
        <h3>${esc(w.title)}</h3>
        <p class="roles">${esc(w.roles.join(" · "))} <span>${esc(w.year)}</span></p>
        ${w.award && w.award.startsWith("Award") ? `<p class="badge">Award 2025</p>` : ""}
      </div>
    </a>`;

  // ---------- shell: header + footer ----------
  const nav = [
    ["index.html", "Home", "home"],
    ["works.html", "Works", "works"],
    ["practice.html", "Practice", "practice"],
    ["about.html", "About", "about"],
  ];
  document.body.insertAdjacentHTML(
    "afterbegin",
    `<header class="site-header">
      <a class="brand" href="index.html">${esc(SITE.name)}</a>
      <nav>${nav
        .filter(([, , key]) => key !== "home")
        .map(([href, label, key]) => `<a href="${href}"${key === page || (page === "work" && key === "works") ? ' aria-current="page"' : ""}>${label}</a>`)
        .join("")}<a href="#contact">Contact</a></nav>
    </header>`
  );
  document.body.insertAdjacentHTML(
    "beforeend",
    `<footer class="site-footer" id="contact">
      <div class="footer-inner">
        <p class="footer-motto">${esc(SITE.motto)}.</p>
        <div class="footer-cols">
          <div><h4>Contact</h4><p><a href="mailto:${esc(SITE.email)}">${esc(SITE.email)}</a></p></div>
          <div><h4>Based in</h4><p>${esc(SITE.places)}</p></div>
          <div><h4>Showreel</h4><p><a href="https://youtu.be/${esc(SITE.showreel)}" target="_blank" rel="noopener">Movement showreel ↗</a></p></div>
        </div>
        <p class="copyright">© ${new Date().getFullYear()} ${esc(SITE.name)}</p>
      </div>
    </footer>`
  );

  const main = $("main");

  // ---------- pages ----------
  const pages = {
    home() {
      const featured = WORKS.find((w) => w.featured);
      const selected = ["terrorizers", "ion", "playground", "through", "house-of-democracy", "kill-the-banana-trees"]
        .map((id) => WORKS.find((w) => w.id === id))
        .filter(Boolean);
      main.innerHTML = `
        <section class="hero">
          <div class="hero-field" aria-hidden="true"><div class="melt"></div></div>
          <div class="hero-text">
            <p class="eyebrow">${esc(SITE.places)}</p>
            <h1>${esc(SITE.name).replace(/(\S+-\S+)/, '<span class="nw">$1</span>')}</h1>
            <p class="motto">${esc(SITE.motto)}</p>
            <p class="hero-roles">${esc(SITE.roles)}</p>
          </div>
          <a class="scroll-cue" href="#statement" aria-label="Scroll down">↓</a>
        </section>

        <section class="statement wrap" id="statement">
          ${SITE.statement.map((p, i) => `<p class="${i === 0 ? "lead" : ""}">${esc(p)}</p>`).join("")}
        </section>

        ${featured ? `
        <section class="featured wrap">
          <div class="section-head"><p class="eyebrow">Featured work</p>${featured.award ? `<p class="badge">${esc(featured.award)}</p>` : ""}</div>
          ${videoBlock(featured.video, featured.videoLabel ? `Watch the ${featured.videoLabel.toLowerCase()}` : "Watch")}
          <div class="featured-text">
            <h2><a href="${workUrl(featured)}">${esc(featured.title)}</a></h2>
            <p>${esc(featured.summary)}</p>
            <a class="more" href="${workUrl(featured)}">Director’s page, process & credits →</a>
          </div>
        </section>` : ""}

        <section class="wrap">
          <div class="section-head"><p class="eyebrow">Selected works</p><a class="more" href="works.html">All works →</a></div>
          <div class="grid">${selected.map(card).join("")}</div>
        </section>

        <section class="ways wrap">
          <p class="eyebrow">One practice, four ways in</p>
          <div class="ways-grid">
            <a href="works.html?d=Directing"><span>Directing</span><small>Authorial productions for stage and film</small></a>
            <a href="works.html?d=Performing"><span>Performing</span><small>Physical theatre, dance, film and live music</small></a>
            <a href="works.html?d=Design"><span>Design</span><small>Video and scenography for theatre</small></a>
            <a href="practice.html"><span>Training</span><small>Terzopoulos method & body-mind practice</small></a>
          </div>
        </section>`;
    },

    works() {
      const discs = ["All", "Directing", "Performing", "Film", "Design"];
      let active = new URLSearchParams(location.search).get("d");
      if (!discs.includes(active)) active = "All";
      const list = [...WORKS].sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0) || byYear(a, b));
      main.innerHTML = `
        <section class="page-head wrap">
          <h1>Works</h1>
          <p>Each work appears once, with the roles I held in it.</p>
          <div class="filters" role="group" aria-label="Filter works">
            ${discs.map((d) => `<button data-d="${d}">${d}</button>`).join("")}
            <a href="practice.html" class="filter-link">Training →</a>
          </div>
        </section>
        <section class="wrap"><div class="grid" id="grid">${list.map(card).join("")}</div></section>`;
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
        if (!e.target.dataset.d) return;
        active = e.target.dataset.d;
        apply();
      });
      apply();
    },

    work() {
      const id = new URLSearchParams(location.search).get("id");
      const i = WORKS.findIndex((w) => w.id === id);
      const w = WORKS[i];
      if (!w) {
        main.innerHTML = `<section class="page-head wrap"><h1>Not found</h1><p><a href="works.html">See all works →</a></p></section>`;
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
      ].filter(([, v]) => v);
      const prev = WORKS[(i - 1 + WORKS.length) % WORKS.length];
      const next = WORKS[(i + 1) % WORKS.length];
      const section = (title, html) => (html ? `<section class="work-section"><h2>${title}</h2>${html}</section>` : "");
      main.innerHTML = `
        <article class="work wrap ${w.featured ? "is-featured" : ""}">
          <header class="work-head">
            <p class="eyebrow"><a href="works.html">Works</a> / ${esc((w.disciplines || []).join(" · "))}</p>
            <h1>${esc(w.title)}</h1>
            ${w.award ? `<p class="badge">${esc(w.award)}</p>` : ""}
          </header>
          ${w.video ? videoBlock(w.video, w.videoLabel ? `Watch the ${w.videoLabel.toLowerCase()}` : "Watch") : ""}
          <div class="work-body">
            <dl class="facts">${facts.map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join("")}</dl>
            <div class="work-text">
              ${w.summary && !w.description ? `<p class="lead">${esc(w.summary)}</p>` : ""}
              ${paras(w.description)}
              ${section("The source", w.source ? `<p>${esc(w.source)}</p>` : "")}
              ${section("Director’s note", paras(w.directorNote))}
              ${section("Process", paras(w.process))}
              ${section("Productions", w.list ? `<ul class="cv-list">${w.list.map(([y, t, d]) => `<li><span class="y">${esc(y)}</span><span><strong>${esc(t)}</strong> <em>${esc(d)}</em></span></li>`).join("")}</ul>` : "")}
              ${section("Credits", w.credits?.length ? `<dl class="credits">${w.credits.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join("")}</dl>` : "")}
            </div>
          </div>
          ${w.gallery?.length ? `<div class="gallery">${w.gallery.map((src) => `<img src="${esc(src)}" alt="${esc(w.title)}" loading="lazy">`).join("")}</div>` : ""}
          <nav class="prev-next">
            <a href="${workUrl(prev)}"><small>Previous</small>${esc(prev.title)}</a>
            <a href="${workUrl(next)}"><small>Next</small>${esc(next.title)}</a>
          </nav>
        </article>`;
    },

    practice() {
      main.innerHTML = `
        <section class="page-head wrap">
          <p class="eyebrow">Practice & training</p>
          <h1>The body as a place of transformation</h1>
        </section>
        <section class="wrap prose">${PRACTICE.intro.map((p, i) => `<p class="${i === 0 ? "lead" : ""}">${esc(p)}</p>`).join("")}</section>
        <section class="wrap">
          <div class="section-head"><p class="eyebrow">Workshops I offer</p></div>
          <div class="offers">
            ${PRACTICE.offers.map((o) => `<div class="offer"><h3>${esc(o.title)}</h3><p class="who">${esc(o.who)}</p><p>${esc(o.text)}</p></div>`).join("")}
          </div>
          <p class="formats">${esc(PRACTICE.formats)}</p>
          <p><a class="button" href="mailto:${esc(SITE.email)}?subject=${encodeURIComponent("Workshop enquiry")}">Book a workshop</a></p>
        </section>
        <section class="wrap cv-block"><h2>Teaching</h2>${cvRows(CV.pedagogy)}</section>
        <section class="wrap cv-block"><h2>Training lineage</h2>${cvRows(CV.workshops)}</section>`;
    },

    about() {
      main.innerHTML = `
        <section class="about-top wrap">
          <figure class="portrait"><img src="images/portrait.jpg" alt="Portrait of ${esc(SITE.name)}"></figure>
          <div>
            <p class="eyebrow">About</p>
            <h1>${esc(SITE.name)}</h1>
            <p class="aka">also ${esc(SITE.alsoKnownAs)}</p>
            <div class="prose">${paras(SITE.bio)}</div>
            <p><a class="button" href="https://youtu.be/${esc(SITE.showreel)}" target="_blank" rel="noopener">Movement showreel ↗</a></p>
          </div>
        </section>
        <section class="wrap cv-block"><h2>Skills</h2>
          <dl class="skills">${Object.entries(CV.skills).map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join("")}</dl>
        </section>
        <section class="wrap cv-block"><h2>Awards</h2>${cvRows(CV.awards)}</section>
        <section class="wrap cv-block"><h2>Festivals</h2>${cvRows(CV.festivals)}</section>
        <section class="wrap cv-block"><h2>Directing</h2>${cvRows(CV.directing)}</section>
        <section class="wrap cv-block"><h2>Performing</h2>${cvRows(CV.performing)}</section>
        <section class="wrap cv-block"><h2>Teaching</h2>${cvRows(CV.pedagogy)}</section>
        <section class="wrap cv-block"><h2>Education</h2>${cvRows(CV.education)}</section>
        <section class="wrap cv-block"><h2>Workshops attended</h2>${cvRows(CV.workshops)}</section>`;
    },
  };

  function cvRows(rows) {
    return `<ul class="cv-list">${rows
      .map(([y, a, b]) => `<li><span class="y">${esc(y)}</span><span>${b ? `<strong>${esc(a)}</strong> <em>${esc(b)}</em>` : esc(a)}</span></li>`)
      .join("")}</ul>`;
  }

  (pages[page] || pages.home)();
})();
