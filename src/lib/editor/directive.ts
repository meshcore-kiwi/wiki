// Starlight asides (`:::caution[Title] ... :::`) are remark-directive syntax.
// Milkdown does not know it, so it treated those lines as plain paragraph text
// and remark-stringify escaped the bracket on the way out:
//
//   :::caution[Backward compatibility]  ->  :::caution\[Backward compatibility]
//
// which breaks the aside. This teaches Milkdown the syntax properly, so a
// directive parses into a real node and serialises back byte-identically.
import { $node, $remark } from '@milkdown/kit/utils';
import remarkDirective from 'remark-directive';

export const remarkDirectivePlugin = $remark('remarkDirective', () => remarkDirective);

/**
 * mdast stores a directive's title as its first child paragraph, flagged with
 * `data.directiveLabel`. Holding it as an attribute instead keeps the node's
 * content purely the body, so the label cannot be half-deleted by editing.
 */
function labelOf(node: { children?: Array<Record<string, unknown>> }): string {
	const first = node.children?.[0] as
		| { data?: { directiveLabel?: boolean }; children?: Array<{ value?: string }> }
		| undefined;
	if (!first?.data?.directiveLabel) return '';
	return (first.children ?? []).map((c) => c.value ?? '').join('');
}

export const containerDirectiveNode = $node('containerDirective', () => ({
	content: 'block+',
	group: 'block',
	defining: true,
	attrs: {
		name: { default: 'note' },
		label: { default: '' },
	},
	parseDOM: [
		{
			tag: 'div[data-directive]',
			getAttrs: (dom: HTMLElement) => ({
				name: dom.dataset.directive ?? 'note',
				label: dom.dataset.directiveLabel ?? '',
			}),
		},
	],
	toDOM: (node: { attrs: { name: string; label: string } }) => [
		'div',
		{
			'data-directive': node.attrs.name,
			'data-directive-label': node.attrs.label,
			class: 'wiki-directive',
			// Shown via CSS ::before so it is visible but not editable text -
			// editing it would desynchronise it from the attribute.
			'data-heading': node.attrs.label || node.attrs.name.toUpperCase(),
		},
		0,
	],
	parseMarkdown: {
		match: ({ type }: { type: string }) => type === 'containerDirective',
		runner: (
			state: any,
			node: { name?: string; children?: Array<Record<string, unknown>> },
			type: unknown,
		) => {
			const label = labelOf(node);
			const children = node.children ?? [];
			state
				.openNode(type, { name: node.name ?? 'note', label })
				// Drop the label paragraph from the body; it is an attribute now
				// and gets re-emitted on serialise.
				.next(label ? children.slice(1) : children)
				.closeNode();
		},
	},
	toMarkdown: {
		match: (node: { type: { name: string } }) => node.type.name === 'containerDirective',
		runner: (state: any, node: { attrs: { name: string; label: string }; content: unknown }) => {
			state.openNode('containerDirective', undefined, {
				name: node.attrs.name,
				attributes: {},
			});
			if (node.attrs.label) {
				state.addNode(
					'paragraph',
					[{ type: 'text', value: node.attrs.label }],
					undefined,
					{ data: { directiveLabel: true } },
				);
			}
			state.next(node.content);
			state.closeNode();
		},
	},
}));

export const directivePlugins = [remarkDirectivePlugin, containerDirectiveNode].flat();
