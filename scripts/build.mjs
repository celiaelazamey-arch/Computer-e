import { copyFile, mkdir, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { dirname, extname, isAbsolute, relative, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const projectRoot = fileURLToPath(new URL('../', import.meta.url));
const extensions = new Set(['.html', '.css', '.js', '.svg', '.woff2', '.txt']);

function isWithin(parent, child) {
  const path = relative(parent, child);
  return path === '' || (!isAbsolute(path) && !path.startsWith(`..${sep}`) && path !== '..');
}

async function collectAssets(directory, prefix = '') {
  const result = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const name = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.name.startsWith('.')) continue;
    if (entry.isSymbolicLink()) throw new Error(`Symbolic links are not published: ${name}`);
    if (entry.isDirectory()) {
      result.push(...(await collectAssets(resolve(directory, entry.name), name)));
    } else if (entry.isFile() && extensions.has(extname(entry.name))) {
      result.push(name);
    }
  }
  return result.sort();
}

export async function buildSite({
  sourceDir = resolve(projectRoot, 'site'),
  outputDir = resolve(projectRoot, 'dist'),
} = {}) {
  sourceDir = resolve(sourceDir);
  outputDir = resolve(outputDir);
  if (
    outputDir === resolve(projectRoot) ||
    isWithin(outputDir, sourceDir) ||
    isWithin(sourceDir, outputDir) ||
    isWithin(resolve(projectRoot, '.git'), outputDir)
  ) {
    throw new Error(
      'The output must be separate from the source and must not be the repository root or .git.',
    );
  }

  // Validate all source files before replacing the generated output.
  const files = await collectAssets(sourceDir);
  if (!files.includes('index.html')) throw new Error('The site must contain index.html.');
  await rm(outputDir, { recursive: true, force: true });
  await mkdir(outputDir, { recursive: true });
  let bytes = 0;
  for (const file of files) {
    const destination = resolve(outputDir, file);
    await mkdir(dirname(destination), { recursive: true });
    await copyFile(resolve(sourceDir, file), destination);
    bytes += (await stat(destination)).size;
  }
  await writeFile(resolve(outputDir, '.nojekyll'), '');
  return { files: [...files, '.nojekyll'], bytes, outputDir };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const result = await buildSite();
    console.log(`Built ${result.files.length} files (${(result.bytes / 1024).toFixed(1)} KB) into dist/.`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
