/**
 * Compile the TypeScript sources to a scratch directory, then run the test
 * suite with node's built-in runner.
 *
 * tsc emits extensionless CommonJS requires, which Node's ESM loader cannot
 * resolve, so the scratch directory gets its own package.json marking it as
 * CommonJS. This keeps the whole suite dependency-free: no ts-node, no jest,
 * no bundler.
 */
import { spawnSync } from 'node:child_process';
import { mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import process from 'node:process';

const OUT = '.test-build';

const run = (cmd, args) => {
	const r = spawnSync(cmd, args, { stdio: 'inherit' });
	return r.status ?? 1;
};

rmSync(OUT, { recursive: true, force: true });

// Resolve tsc's JS entry rather than the .bin shim, which is platform-specific.
const require = createRequire(import.meta.url);
const tsc = require.resolve('typescript/bin/tsc');

const compiled = run(process.execPath, [tsc, '-p', 'tsconfig.test.json']);
if (compiled !== 0) process.exit(compiled);

mkdirSync(OUT, { recursive: true });
writeFileSync(path.join(OUT, 'package.json'), JSON.stringify({ type: 'commonjs' }, null, 2));

const suites = readdirSync(path.join(OUT, 'tests'))
	.filter((f) => f.endsWith('.test.js'))
	.map((f) => path.join(OUT, 'tests', f));

if (suites.length === 0) {
	console.error('No compiled test files found.');
	process.exit(1);
}

process.exit(run('node', ['--test', ...suites]));
