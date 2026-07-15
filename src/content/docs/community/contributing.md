---
title: Contributing
description: How to add or edit pages on this wiki - anyone can contribute.
---

Anyone can contribute to this wiki, two ways:

## 1. Via GitHub

Fork [the repo](https://github.com/meshcore-kiwi/wiki), edit or add Markdown files under `src/content/docs/`, and open a pull request. The **Edit page** link at the bottom of every page takes you straight there.

## 2. In the browser

Log in on this site and use the built-in editor. Your change is submitted as a pull request automatically. *(Coming soon.)*

## Style guide

- Use British/NZ English (colour, organise, centre) - this applies to AI-assisted writing too.
- No em-dashes (—); use `-` instead.
- Keep emojis to a minimum - none in headings or prose.

## Adding pages

- Drop a `.md` file anywhere under `src/content/docs/` - it appears in the sidebar automatically. No config needed.
- Folders become sidebar groups; the file's `title` frontmatter becomes its label.
- Control ordering with frontmatter:

```yaml
---
title: My Page
sidebar:
  order: 2
---
```

- Folder groups are ordered too: a folder takes the **lowest** `sidebar.order` of any page inside it. So to move a whole section up the menu, give its first page a low order number. Pages and folders without an order sort alphabetically, after ordered ones.
