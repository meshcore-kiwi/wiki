# MeshCore NZ Wiki

Community wiki for [MeshCore](https://meshcore.io/) users in New Zealand - off-grid LoRa mesh networking across Aotearoa.

Built with [Astro](https://astro.build/), [Starlight](https://starlight.astro.build/), and the [Six theme](https://github.com/six-tech/starlight-theme-six). Hosted on Cloudflare Workers.

## Contributing

Anyone can contribute - no coding required.

1. Fork this repo (or edit directly on GitHub via the **Edit page** link at the bottom of any wiki page)
2. Add or edit Markdown files under `src/content/docs/`
3. Open a pull request

The sidebar is generated automatically from the folder structure - just drop a `.md` file in the right folder and it appears in the menu. No config changes needed.

- Folders become sidebar groups; a page's `title` frontmatter becomes its menu label
- Order pages with `sidebar: { order: n }` frontmatter; a folder takes the lowest order of its pages
- Every page needs frontmatter with at least a `title`

### Style guide

- British/NZ English (colour, organise, centre) - including AI-assisted writing
- No em-dashes; use `-`
- Emojis kept to a minimum - none in headings or prose
- Official MeshCore links only: meshcore.io, flasher.meshcore.io, app.meshcore.nz

See [AGENTS.md](AGENTS.md) for the full conventions (picked up automatically by AI coding tools).

## Local development

```sh
npm install
npm run dev       # dev server at localhost:4321
npm run build     # production build to ./dist/
npm run preview   # preview the production build
```

## Deployment

Deployed to Cloudflare Workers via [Wrangler](https://developers.cloudflare.com/workers/wrangler/) - see `wrangler.jsonc`.

```sh
npm run build
npx wrangler deploy
```
