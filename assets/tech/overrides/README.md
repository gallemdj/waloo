# Tech logo overrides

SVGs here replace SVGL for specific slugs when running `sync-tech-logos.py`.

Use when SVGL only has a wordmark, the mark looks wrong at icon size, or you prefer a custom asset.

| Slug | Reason |
|------|--------|
| `jquery` | SVGL ships a wide wordmark (256×63); we use the compact jQuery arcs icon |

Add `{slug}.svg` and re-run:

```bash
python3 site/scripts/sync-tech-logos.py
```

**Service detail — Stack & partners:** custom marks live in `site/assets/tech/partners/` (e.g. `figma.svg`, `acf.svg`). WordPress/HTML/CSS use the main `tech/` set.
