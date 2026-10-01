import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildSite, projectRoot } from '../scripts/build.mjs';

async function fixture(t) {
  const directory = await mkdtemp(join(tmpdir(), 'computer-e-build-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const sourceDir = join(directory, 'site');
  const outputDir = join(directory, 'dist');
  await mkdir(join(sourceDir, 'fonts'), { recursive: true });
  await writeFile(join(sourceDir, 'index.html'), '<html lang="ar"></html>');
  await writeFile(join(sourceDir, 'styles.css'), 'body {}');
  await writeFile(join(sourceDir, 'app.js'), 'export {};');
  await writeFile(join(sourceDir, 'fonts', 'LICENSE.txt'), 'font license');
  await writeFile(join(sourceDir, '.env'), 'not-for-publication');
  await writeFile(join(sourceDir, 'private.md'), 'internal documentation');
  return { directory, sourceDir, outputDir };
}

test('the build publishes only assets, includes the font license and disables Jekyll', async (t) => {
  const { sourceDir, outputDir } = await fixture(t);
  const result = await buildSite({ sourceDir, outputDir });
  assert.deepEqual(result.files, ['app.js', 'fonts/LICENSE.txt', 'index.html', 'styles.css', '.nojekyll']);
  assert.ok(result.bytes > 0);
  assert.equal(await readFile(join(outputDir, '.nojekyll'), 'utf8'), '');
  await assert.rejects(readFile(join(outputDir, '.env')));
  await assert.rejects(readFile(join(outputDir, 'private.md')));
});

test('builds are repeatable and stale output is removed', async (t) => {
  const { sourceDir, outputDir } = await fixture(t);
  const first = await buildSite({ sourceDir, outputDir });
  await writeFile(join(outputDir, 'stale.js'), 'old');
  const second = await buildSite({ sourceDir, outputDir });
  assert.deepEqual(first, second);
  await assert.rejects(readFile(join(outputDir, 'stale.js')));
});

test('unsafe output locations are rejected before removing source or repository files', async (t) => {
  const { directory, sourceDir } = await fixture(t);
  for (const outputDir of [
    directory,
    sourceDir,
    join(sourceDir, 'dist'),
    projectRoot,
    join(projectRoot, '.git'),
  ]) {
    await assert.rejects(buildSite({ sourceDir, outputDir }), /separate/);
  }
  assert.match(await readFile(join(sourceDir, 'index.html'), 'utf8'), /html/);
});

test('missing entrypoints and symbolic links fail before replacing output', async (t) => {
  const { directory, sourceDir, outputDir } = await fixture(t);
  await mkdir(outputDir);
  await writeFile(join(outputDir, 'keep.txt'), 'previous build');
  await symlink(join(directory, 'secret.txt'), join(sourceDir, 'escape.txt'));
  await assert.rejects(buildSite({ sourceDir, outputDir }), /Symbolic links/);
  assert.equal(await readFile(join(outputDir, 'keep.txt'), 'utf8'), 'previous build');
  await rm(join(sourceDir, 'escape.txt'));
  await rm(join(sourceDir, 'index.html'));
  await assert.rejects(buildSite({ sourceDir, outputDir }), /index.html/);
  assert.equal(await readFile(join(outputDir, 'keep.txt'), 'utf8'), 'previous build');
});
