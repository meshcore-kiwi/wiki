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
	// lightningcss rejects a selector in the Six theme's CSS; esbuild doesn't
	vite: { build: { cssMinify: 'esbuild' } },
	integrations: [
		starlight({
			title: 'MeshCore NZ',
			social: [
				{
					icon: 'analytics',
					label: 'NZ Map',
					href: 'https://meshcore.baird.io/'
				},
				{
					icon: 'github',
					label: 'GitHub',
					href: 'https://github.com/meshcore-kiwi/wiki'
				}
			],
			// no sidebar config - Starlight autogenerates the whole
			// sidebar from src/content/docs/ folder structure. Add folders/files,
			// menu updates itself. Order/labels via per-page frontmatter.
			customCss: ['./src/styles/custom.css'],
			head: [
				{
					// the Six theme renders social icons without target support;
					// open them in a new tab (rel="me" marks the social links)
					tag: 'script',
					content: `document.addEventListener('DOMContentLoaded',()=>{document.querySelectorAll('a[rel~="me"]').forEach(a=>{a.target='_blank';a.rel+=' noopener'})})`,
				},
			],
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