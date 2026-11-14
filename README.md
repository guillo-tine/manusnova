# manusnova.org

The website for Manus Nova, a student nonprofit in the Bronx that designs, prints, fits and gives away prosthetic hands for free.

It is a single scrolling page: black background, a 3D model of the hand's printed parts that turns as you scroll, and short sections of text.

## Run it

```bash
npm install
npm run dev        # http://localhost:8080
npm run build      # production build into dist/
npm run preview    # serve dist/ locally
```

Use Node 20 or newer. Vercel builds with Node 24.

## Deploy

The site is hosted on **Vercel**, project `manusnova` in the team `guillo-tines-projects`. The domain `manusnova.org` is registered at **Namecheap** and points at Vercel.

Production deploys are done from the command line. **Pushing to GitHub does not deploy.**

```bash
npx vercel login                                         # once, as a member of the Vercel team
npx vercel --prod --yes --scope guillo-tines-projects    # build on Vercel and go live
```

The `deploy` / `gh-pages` scripts in package.json are left over from an old GitHub Pages setup. They are not used.

## Where things are

| Path | What it is |
|---|---|
| `index.html` | Page title, SEO meta tags, social preview, structured data (JSON-LD), and the text shown when JavaScript is off |
| `src/pages/Index.tsx` | The page: lists the sections in order and decides whether to load the 3D |
| `src/components/Hero.tsx` | Opening section ("Prosthetic hands, printed and given away.") |
| `src/components/Story.tsx` | "Designed, tested, and printed by us." (words light up as you scroll) and "Nothing." (cost) |
| `src/components/About.tsx` | Mission, the "35 hands" count, and How it works (4 steps) |
| `src/components/Team.tsx` | Current team names and alumni |
| `src/components/Contact.tsx` | "Need a hand?" and contact links |
| `src/components/RequestSheet.tsx` | The request form pop-up. It sends email through FormSubmit (see below) |
| `src/components/Footer.tsx` | Footer text |
| `src/components/Intro.tsx` | The black "manus nova." opening screen |
| `src/lib/links.ts` | Email address, Instagram, and donate/join mail links |
| `src/components/three/` | The 3D model: `HandModel.tsx` loads it, `HandStage.tsx` positions and animates it |
| `src/lib/stage.ts` | Smooth scrolling (Lenis) and the per-frame scroll loop shared by the page and the 3D |
| `src/index.css` | Colours, the Apple-style easing curves, and all animation CSS |
| `public/` | Static files served as-is: favicon, `og-image.png` (link preview), robots.txt, sitemap.xml, the model |
| `scripts/bake-hand.mjs` | Prepares the 3D model (see below) |
| `src/components/ui/` | Unused shadcn/ui components from the original template. Safe to ignore |
| `qa/` | Browser checks to run before deploying (see `qa/README.md`) |

## Common edits

- **Change text:** find the words in `src/components/*.tsx` and edit them there. If the same fact also appears in `index.html` (meta description, JSON-LD FAQ, `<noscript>` block), update it there too so search results match.
- **The hand count:** it is in `src/components/About.tsx` (`35`), in the `<noscript>` block in `index.html`, and in the FAQ answer in `index.html`.
- **Team names:** edit the `crew` and `alumni` lists in `src/components/Team.tsx`, and the `member` / `alumni` lists in the NGO JSON-LD in `index.html`.
- **Email / Instagram:** `src/lib/links.ts`. The request form's destination is set separately in `RequestSheet.tsx`.
- **Link preview image:** replace `public/og-image.png` (1200×630).

## The request form

The form posts to `https://formsubmit.co/ajax/teammanusnova@gmail.com`, a free service that forwards submissions as an email. There is no server or database of our own. To send requests to a different address, change `FORM_ENDPOINT` in `RequestSheet.tsx`. The first submission to a new address triggers a confirmation email from FormSubmit that has to be clicked once.

## The 3D model

`assets-src/hand.glb` is the source: one mesh of every part laid flat on a print plate. It is not deployed.

`scripts/bake-hand.mjs` splits it into its 30 separate parts, computes the shading, compresses it, and writes `public/models/hand-parts.glb`. That baked file is what the site loads. Doing this ahead of time keeps the page from freezing while it loads.

```bash
node scripts/bake-hand.mjs
```

`/models/*` is cached by browsers for a year (`vercel.json`). If you re-bake, **give the output a new filename** and update `MODEL_URL` in `src/components/three/HandModel.tsx`. Otherwise returning visitors keep seeing the old model.

## Things that are easy to break

- **Windows "Show animations" off / reduced motion.** Many visitors have `prefers-reduced-motion` turned on without knowing it. Smooth scrolling and the scroll-driven 3D are deliberately kept on for them (`respectReducedMotion: false` in `stage.ts`). Only idle drift, blur and movement are dropped (see the end of `index.css`).
- **Gradient text** (`.free-word`, used for "35" and "Nothing.") only paints inside its own box. Large sizes can clip the last letter or descenders. Check it at several screen widths after changing the text or its size.
- **Each section's reserved box for the model.** Every section has a `data-pose` and an empty `data-slot` element. The model is fitted into that box so it never covers text. To move the model in a section, change the layout of its `data-slot`, not the 3D code.
- **The request sheet must stay fully hidden when closed.** If it ever covers the page invisibly, scrolling and clicking stop working over it.
- **No GPU.** On machines that can only render 3D in software, the 3D is skipped entirely (`gpuAvailable()` in `stage.ts`). The page must still read fine without it.
