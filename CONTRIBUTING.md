# Contributing to the MeshCore NZ Wiki

Thanks for helping build the wiki! Anyone can contribute - no coding required.

## How it works

1. Fork this repo, or use the **Edit page** link at the bottom of any wiki page to edit directly on GitHub
2. Add or edit Markdown files under `src/content/docs/`
3. Open a pull request
4. A maintainer reviews and merges it - the site deploys automatically from `main`

Not sure where something belongs, or want to discuss before writing? [Open an issue](https://github.com/meshcore-kiwi/wiki/issues/new/choose) first.

## Writing pages

- The sidebar is generated from the folder structure - drop a `.md` file in the right folder and it appears in the menu. No config changes needed (and PRs that add sidebar config will be declined).
- Folders become sidebar groups; a page's `title` frontmatter becomes its menu label.
- Every page needs frontmatter with at least a `title`:

  ```yaml
  ---
  title: My Page
  description: One line about the page (used for search and SEO).
  ---
  ```

- To control menu position, add `sidebar: { order: n }` - lower numbers sort higher. A folder takes the lowest order of its pages. Unordered items sort alphabetically after ordered ones.

## Style guide

- **British/NZ English** - colour, organise, centre, metre. This applies to AI-assisted writing too.
- **No em-dashes (—)** - use `-` instead.
- **Minimal emojis** - none in headings or prose; functional markers (like a tick/cross comparison) only.
- **Official MeshCore links only** - meshcore.io, flasher.meshcore.io, app.meshcore.nz, docs.meshcore.io.
- Write for a broad audience - new users read this wiki too, so spell out jargon on first use.

## Previewing locally (optional)

```sh
npm install
npm run dev    # localhost:4321
```

You don't need to do this for simple content edits - the PR checks will catch build problems.

## What makes a good contribution

- Real-world NZ experience: hardware that works here, antenna setups, site reports, coverage notes
- Corrections - even a typo fix is welcome
- New guides for things you had to figure out yourself

If in doubt, open the PR. A rough page someone can improve beats a perfect page that never gets written.
