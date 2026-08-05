# Asset provenance and licences

Everything the app renders is either **originally drawn for this project** or comes
from a **permissively licensed** set stored locally. Nothing is hotlinked, so the
interface renders fully with no network connection.

## Icons: Lucide (ISC)

- **Source:** <https://lucide.dev> · <https://github.com/lucide-icons/lucide>
- **Licence:** ISC, giving permission to use, copy, modify and distribute, with the
  copyright notice retained. Full text: [`../src/assets/icons/LICENSE.lucide`](../src/assets/icons/LICENSE.lucide)
- **Version:** `lucide-static` 1.28.0, fetched 5 August 2026
- **Stored at:** `src/assets/icons/*.svg`, 84 individual SVGs, kept as the
  unmodified originals for provenance.
- **Rendered from:** `src/js/icons.js`, which holds only the drawing commands from
  those files. That means the entire set costs **zero network requests** and every
  icon inherits `currentColor`, so an icon is always the colour of the text it sits
  beside.

Why not an icon font or a sprite sheet: both add a request that can fail, and a
font in particular renders as a wrong glyph while it loads.

### Regenerating after adding or removing icons

```bash
# 1. download the new icon(s), noting -L because unpkg redirects
curl -sfSL -o src/assets/icons/NAME.svg \
  "https://unpkg.com/lucide-static@latest/icons/NAME.svg"

# 2. confirm it is actually SVG and not a redirect notice
head -c 200 src/assets/icons/NAME.svg | grep -q '<svg' && echo ok

# 3. rebuild the module
node scripts/gen-icons.mjs
```

Then add the mapping in `src/js/glyphs.js` if the icon should replace a data emoji.

## Brand marks: original work

`src/js/brand.js` holds the emblem and the small national flags, both drawn for
this project. **No third-party logo is used anywhere**, which keeps the brand free
of any licensing question.

The emblem is a German sign plate seen head-on: a gold-edged plate with a road
narrowing toward a horizon bar. Two earlier attempts were discarded for legibility
reasons worth recording. Fine perspective dashes turned to mush below 30px, and a
circle above the road's taper read as a head, turning the mark into a pedestrian
sign. It is now verified legible from 20px up.

Flag designs are not copyrightable; these are simplified to read at 16px.

## Traffic signs: original work

`src/js/signs.js` contains 36 German road signs drawn as inline SVG for this
project. The designs themselves are prescribed by the StVO (a German federal
regulation), and these are our own renderings of those shapes.

## Textures: generated, not downloaded

The asphalt grain is an inline SVG `feTurbulence` filter in the `--grain` custom
property (`src/css/base.css`), and the callout markers are masked inline SVG. The
reference site this design took inspiration from uses raster texture files; we
generate ours so nothing can 404 and the whole surface works offline.

## Fonts: Google Fonts, with a working fallback

- **Cinzel** (display) and **DM Sans** (body), both under the SIL Open Font License.
- Loaded from `fonts.googleapis.com`, but **every** rule specifies a local fallback
  stack, so a blocked CDN degrades to Georgia / the system sans rather than breaking
  the layout.

## Map tiles: OpenStreetMap

Leaflet loads tiles from `tile.openstreetmap.org` with the required attribution
visible on the map. This is the one genuinely network-dependent feature; `map.js`
detects a missing Leaflet and falls back to a list with Google Maps links, so the
Places screen still works offline.
