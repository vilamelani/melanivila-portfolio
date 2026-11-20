# melanivila-portfolio

Source code of my personal portfolio: [melanivila.vercel.app](https://melanivila.vercel.app).

It is a single-page static site with scroll animations and scroll-scrubbed background videos. There is no build step and no framework.

## Stack

- HTML, CSS and vanilla JavaScript
- [GSAP](https://gsap.com) (with ScrollTrigger and ScrollToPlugin) and [Lenis](https://github.com/darkroomengineering/lenis) for animation and smooth scrolling, loaded from a CDN with Subresource Integrity
- Google Fonts: Inter Tight, Instrument Serif, JetBrains Mono
- Hosted on Vercel

## Project structure

```
index.html        page markup, meta tags, structured data
style.css         all styles
script.js         animations and interactions
assets/           images, videos, favicon, résumé
scripts/serve.py  local dev server
vercel.json       cache and security headers
robots.txt, sitemap.xml
```

## Run locally

You need Python 3.

```bash
npm start
# or
python scripts/serve.py 5173
```

Then open http://localhost:5173.

Use `scripts/serve.py` instead of `python -m http.server`. The background videos are scrubbed with the scroll position, which requires HTTP Range requests, and the standard library server does not support them.

## Deployment

The site is deployed on Vercel as a static project. Pushes to `main` deploy to production, and other branches get preview deployments. No build command or output directory is needed. Headers are configured in `vercel.json`.

## Notes

- The content is in English.
- Animations are skipped when `prefers-reduced-motion` is set, and the page is readable without JavaScript.
- The projects listed in the Projects section are client work done at NTT Data, so there is no code or demo to link.
