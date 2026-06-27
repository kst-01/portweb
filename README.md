# Simple Cyberpunk Portfolio

This is a simple, single-page portfolio built to match the requirements you provided: a fast, responsive, stylized cyberpunk theme with animated elements and social links. It is ready to be hosted on Vercel, Netlify, GitHub Pages, or any static hosting.

Quick start

1. Update the content:
   - Replace "Your Name" in `index.html` with your name.
   - Update project entries and social links in `index.html`.

2. Preview locally:

```bash
# from this folder
# use any static server, e.g. Python 3
python -m http.server 3000
# then open http://localhost:3000
```

3. Deploy to Vercel (recommended):

```bash
# Install Vercel CLI if you want
npm i -g vercel
# from this folder
vercel
# follow prompts and set project to public
```

Or just push this folder to a GitHub repo and connect the repo in Vercel/Netlify and they will detect it as a static site.

Notes

- Add images to an `assets/` folder and reference them from `index.html`.
- The site uses Google Fonts (Orbitron & Inter). If you need an offline build, download fonts and update `index.html`.