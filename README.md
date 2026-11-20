# Art Portfolio

A simple, fast portfolio site for showing artwork. It's plain HTML, CSS and JavaScript with no build step, and it's ready to host for free on GitHub Pages.

## Adding your work

1. Put your image files in `images/`. JPG or WebP files under about 2,000px on the long edge load quickly.
2. Open `works.js` and add an entry for each piece:

   ```js
   { title: "Night Garden", year: 2025, medium: "Mixed media", size: "80 × 110 cm", category: "Mixed media", image: "images/night-garden.jpg" },
   ```

3. Edit the `SITE` block at the top of `works.js` with your name, bio, email and links.
4. Delete the `images/placeholder-*.svg` files once your own work is in.

The filter buttons are generated from each work's `category`.

## Preview locally

Open `index.html` in a browser, or run:

```bash
python3 -m http.server 8000
```

Then go to http://localhost:8000.

## Publishing

Push to the `main` branch. GitHub Pages serves the site from the repository root.
