(() => {
  const site = window.SITE;
  const works = window.WORKS;
  const $ = (id) => document.getElementById(id);

  // Site text
  document.title = `${site.name} — Portfolio`;
  $("brand").textContent = site.name;
  $("name").textContent = site.name;
  $("tagline").textContent = site.tagline;
  $("about-text").textContent = site.about;
  $("email").textContent = site.email;
  $("email").href = `mailto:${site.email}`;
  $("links").innerHTML = site.links
    .map((l) => `<li><a href="${l.url}" target="_blank" rel="noopener">${l.label}</a></li>`)
    .join("");
  $("copyright").textContent = `© ${new Date().getFullYear()} ${site.name}`;

  // Filters
  const categories = ["All", ...new Set(works.map((w) => w.category))];
  let active = "All";
  const filters = $("filters");
  const renderFilters = () => {
    filters.innerHTML = categories
      .map((c) => `<button role="tab" aria-selected="${c === active}" data-cat="${c}">${c}</button>`)
      .join("");
  };
  filters.addEventListener("click", (e) => {
    const cat = e.target.dataset.cat;
    if (!cat) return;
    active = cat;
    renderFilters();
    renderGallery();
  });

  // Gallery
  let visible = [];
  const gallery = $("gallery");
  const renderGallery = () => {
    visible = works.filter((w) => active === "All" || w.category === active);
    gallery.innerHTML = visible
      .map(
        (w, i) => `
        <button class="work" data-i="${i}">
          <img src="${w.image}" alt="${w.title}, ${w.year}" loading="lazy">
          <div class="meta"><span>${w.title}</span><span>${w.year}</span></div>
        </button>`
      )
      .join("");
  };
  gallery.addEventListener("click", (e) => {
    const card = e.target.closest(".work");
    if (card) open(+card.dataset.i);
  });

  // Lightbox
  const lb = $("lightbox");
  const lbImg = lb.querySelector("img");
  const lbCap = lb.querySelector("figcaption");
  let current = 0;
  const show = (i) => {
    current = (i + visible.length) % visible.length;
    const w = visible[current];
    lbImg.src = w.image;
    lbImg.alt = `${w.title}, ${w.year}`;
    lbCap.innerHTML = `<strong>${w.title}</strong>${[w.medium, w.size, w.year].filter(Boolean).join(" · ")}`;
  };
  const open = (i) => { show(i); lb.showModal(); };
  lb.querySelector(".lb-close").onclick = () => lb.close();
  lb.querySelector(".lb-prev").onclick = () => show(current - 1);
  lb.querySelector(".lb-next").onclick = () => show(current + 1);
  lb.addEventListener("click", (e) => { if (e.target === lb) lb.close(); });
  document.addEventListener("keydown", (e) => {
    if (!lb.open) return;
    if (e.key === "ArrowLeft") show(current - 1);
    if (e.key === "ArrowRight") show(current + 1);
  });

  renderFilters();
  renderGallery();
})();
