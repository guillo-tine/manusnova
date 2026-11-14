# Browser checks

Scripts that load the site in real browsers and catch the bugs that screenshots missed: clipped text, content that never appears, the closed request form blocking the page, and slow or choppy loading.

```bash
# from the repo root: build and serve the site on the port the scripts expect
npm run build
npx vite preview --port 5190

# in another terminal
cd qa
npm install
npm run setup     # downloads the test browsers (Chromium and WebKit, the Safari engine) once
npm run all       # clip + reveal + sheet; each prints "all clear" or what failed
```

To check the live site instead, set `URL=https://manusnova.org/` before the command.

| Script | What it checks |
|---|---|
| `clip.mjs` | Gradient headlines ("35", "Nothing.") aren't cut off, and nothing overflows sideways, at 11 widths from 320 to 2560 px |
| `reveal.mjs` | Every block that's on screen has actually faded in, at each quarter-screen of scrolling |
| `sheet.mjs` | The request form opens, accepts typing and closes, and when closed it blocks nothing and the page still scrolls |
| `load.mjs` | Load smoothness on a slowed-down CPU and slow 4G. Options: `CPU=6`, `MOBILE=1`, `GPU=0` (no graphics card) |
| `scroll.mjs` | Frame times while a real mouse wheel scrolls the whole page |
| `shots.mjs` | Saves a screenshot of every section to `shots/` for a visual check |

Firefox runs through your installed Firefox (`pw-shim.mjs`), because Playwright's own Firefox build would not start on the machine these were written on. Set `FIREFOX_PATH` if Firefox isn't at `C:\Program Files\Mozilla Firefox\firefox.exe`. To skip Firefox, set `ENGINES=chromium,webkit`.

`load.mjs` and `scroll.mjs` use the real GPU through Direct3D (`--use-angle=d3d11`), so they are written for Windows.
