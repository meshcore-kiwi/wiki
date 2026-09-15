// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import starlightThemeSix from '@six-tech/starlight-theme-six'

import cloudflare from '@astrojs/cloudflare';
import react from '@astrojs/react';
import tailwind from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
	site: 'https://wiki.meshcore.kiwi',
	compressHTML: true,
	adapter: cloudflare(),
	// lightningcss rejects a selector in the Six theme's CSS; esbuild doesn't
	vite: {
		build: { cssMinify: 'esbuild' },
		plugins: [tailwind()],
	},
	integrations: [
		// React only for the interactive islands (auth pages, editor panel).
		// Doc pages render to plain HTML and load none of it.
		react(),
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
			// Header, not SocialIcons: the Six theme's Header imports its own
			// SocialIcons by relative path, so that slot is never consulted.
			components: {
				Header: './src/components/Header.astro',
				EditLink: './src/components/EditLink.astro',
			},
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