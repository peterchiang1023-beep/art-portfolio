# Chiang Cheng-Te — portfolio

*Melting into structure.* Portfolio site for a performer, director, designer and trainer working between Prague and Taipei.

It's plain HTML, CSS and JavaScript with no build step, hosted on GitHub Pages.

## Pages

| Page | File |
|---|---|
| Home: statement, Nine Songs, selected works, four ways in | `index.html` |
| Works, filterable by Directing / Performing / Film / Design | `works.html` |
| One page per work, e.g. `work.html?id=nine-songs` | `work.html` |
| Practice & training: workshops, teaching, lineage | `practice.html` |
| About: bio, skills, full CV | `about.html` |

## Editing content

**All the text lives in [`data.js`](data.js).** You don't need to touch the HTML.

- `SITE`: name, statement, bio, email, showreel
- `WORKS`: projects. Each has roles, disciplines, a YouTube `video` ID, and a description.
  Nine Songs also has `directorNote`, `process`, `gallery` and `credits`. Sections left empty are hidden.
- `PRACTICE`: workshops you offer
- `CV`: awards, festivals, credits, teaching, education, workshops, skills

Text marked **DRAFT** is a starting point to rewrite in your own words.

### Adding photos

1. Put them in a folder per project, e.g. `images/nine-songs/01.jpg`. JPGs around 2000px wide work well.
2. List them in that project's `gallery` in `data.js`:
   ```js
   gallery: ["images/nine-songs/01.jpg", "images/nine-songs/02.jpg"],
   ```
   The first photo also becomes the project's card image, replacing the video still.

## Preview locally

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Publishing

```bash
./deploy.sh
```

It asks for a GitHub token (hidden as you type), commits your changes, pushes them and updates GitHub Pages. The token isn't saved anywhere. Use a classic token with the `repo` scope.
