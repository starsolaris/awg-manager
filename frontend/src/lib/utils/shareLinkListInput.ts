/**
 * Share-link schemes often pasted as a single space-separated line (e.g. from messengers).
 * Longest prefixes first so `naive+https://` wins over `naive+http://`.
 * Space/tab only before a scheme — not full `\\s`, so multiline YAML/JSON indents are not touched.
 */
const SPACE_BEFORE_SCHEME_PATTERN =
	'[ \\t]+(naive\\+https://|naive\\+http://|hysteria2://|vless://|hy2://|trojan://|ss://)';

const spaceBeforeShareSchemeRe = new RegExp(SPACE_BEFORE_SCHEME_PATTERN, 'g');

/** Space(s) before a known share scheme → newline so each link is on its own line. */
export function normalizeSpaceSeparatedShareLinks(text: string): string {
	return text.replace(spaceBeforeShareSchemeRe, '\n$1');
}

export function mergePastedShareList(
	current: string,
	selectionStart: number,
	selectionEnd: number,
	pasted: string,
): { next: string; caret: number } {
	const normalized = normalizeSpaceSeparatedShareLinks(pasted);
	const next = current.slice(0, selectionStart) + normalized + current.slice(selectionEnd);
	return { next, caret: selectionStart + normalized.length };
}

/** Share schemes for IDE-style highlighting (longest first inside alternation). */
const HIGHLIGHT_PROTO =
	'(naive\\+https://|naive\\+http://|hysteria2://|vless://|hy2://|trojan://|ss://)';

/**
 * Escape HTML, then wrap known share schemes in <span class="share-link-proto">…</span>
 * for use under a transparent textarea. Boundaries: line start, after newline/CR, or after space/tab/NBSP.
 */
export function escapeAndHighlightShareProtocols(raw: string): string {
	const esc = raw
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;');
	const re = new RegExp(
		`(?:^|(?<=[\\n\\r])|(?<=[ \\t\\u00a0]))(${HIGHLIGHT_PROTO})`,
		'gi',
	);
	return esc.replace(re, '<span class="share-link-proto">$1</span>');
}
