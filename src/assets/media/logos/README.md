# DARP product logos

These assets use the official user-supplied `DARP digital asset retrofit logo.png`.
Its source SHA-256 is
`3a65d28833ab153357e7240d655055ec8366f224a0b0b1e63105081e59436081`.

The emblem and custom letters are SVG outlines traced from the reference, rather
than a replacement font. The horizontal gap, red node/connector and red A triangle
are retained. Whitespace and slogans are omitted at compact placements. The dark
and light variants use identical paths; only the charcoal fill changes to white.
The supplied brand colors are charcoal `#272b2d` and red `#bd1420`.

| Asset | Canvas | Placement |
| --- | --- | --- |
| `darp.svg` | 269 x 56 | Light sidebar and the existing light-background Angular splash |
| `darp-dark.svg` | 269 x 56 | White/red wordmark for dark sidebars or dark page themes |
| `darp-small.svg` | 27 x 18 | Standalone D on light mobile headers, collapsed sidebars and initial splash |
| `darp-small-dark.svg` | 27 x 18 | White/red standalone D for the corresponding dark surfaces |
| `darp-auth.svg` | 240 x 147 | White/red stacked symbol and wordmark for the login aside |
| `darp-favicon.svg` | 32 x 32 | Square standalone D source for the favicon |
| `darp-favicon.ico` | 16, 32, 48, 64 | Transparent multi-size browser icon; also copied to `src/favicon.ico` |

The intrinsic canvases match the former logo assets, including the stacked login
logo. Existing Metronic height, theme visibility and sidebar minimize classes own
the display sizes and behavior. SVGs have transparent backgrounds and no external
font/image dependencies. Dark variants retain the red details from the reference.

Original Metronic logo files remain available as vendor references, but active
application logo placements use these DARP assets. Other media is unchanged.
