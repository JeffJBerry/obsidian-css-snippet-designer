/**
 * Print the CHANGELOG section for a release, for use as GitHub release notes.
 *
 * Usage: node scripts/changelog-release-notes.mjs 1.0.1 > release-notes.md
 *
 * Falls back to the [Unreleased] section when the version has no section yet,
 * so notes work whether or not the changelog was rolled over before tagging.
 */
import { readFileSync } from 'node:fs';

const version = (process.argv[2] ?? '').trim().replace(/^v/, '');
if (!version) {
	console.error('Usage: node scripts/changelog-release-notes.mjs <version>');
	process.exit(1);
}

const changelog = readFileSync(new URL('../CHANGELOG.md', import.meta.url), 'utf8');

/** Body of the first section whose heading line starts with `marker`. */
function sectionBody(marker) {
	const start = changelog.indexOf(marker);
	if (start === -1) return '';
	const lineEnd = changelog.indexOf('\n', start);
	if (lineEnd === -1) return '';
	const rest = changelog.slice(lineEnd);
	const next = rest.indexOf('\n## [');
	const lines = (next === -1 ? rest : rest.slice(0, next)).split('\n');
	// Drop trailing blank lines and the link-reference definitions that follow
	// the last section (for example "[1.0.0]: https://...").
	while (lines.length > 0 && (lines[lines.length - 1].trim() === '' || /^\[[^\]]+\]:/.test(lines[lines.length - 1]))) {
		lines.pop();
	}
	return lines.join('\n').trim();
}

const body = sectionBody(`## [${version}]`) || sectionBody('## [Unreleased]');

process.stdout.write(body ? `${body}\n` : `Release ${version}\n`);
