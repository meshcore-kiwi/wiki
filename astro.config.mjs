// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import starlightThemeSix from '@six-tech/starlight-theme-six'

import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
	site: 'https://wiki.meshcore.kiwi',
	compressHTML: true,
	adapter: cloudflare(),
	// ponytail: lightningcss rejects a selector in the Six theme's CSS; esbuild doesn't
	vite: { build: { cssMinify: 'esbuild' } },
	integrations: [
		starlight({
			title: 'MeshCore NZ',
			social: [
				{
					icon: 'github',
					label: 'GitHub',
					href: 'https://github.com/meshcore-kiwi/wiki'
				}
			],
			// ponytail: no sidebar config - Starlight autogenerates the whole
			// sidebar from src/content/docs/ folder structure. Add folders/files,
			// menu updates itself. Order/labels via per-page frontmatter.
			customCss: ['./src/styles/custom.css'],
			editLink: {
				baseUrl: 'https://github.com/meshcore-kiwi/wiki/edit/main/',
			},
			plugins: [
				starlightThemeSix({
					navLinks: [{
						label: 'Wiki',
						link: '/getting-started/',
					}],
					footerText: 'MeshCore NZ community wiki - content CC BY-SA'
				})
			]
		}),
	],
});