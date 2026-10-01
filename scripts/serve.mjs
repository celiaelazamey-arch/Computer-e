import { createServer } from 'node:http';
import { readFile, realpath, stat } from 'node:fs/promises';
import { extname, isAbsolute, relative, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));
const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
};

function contained(root, file) {
  const path = relative(root, file);
  return path === '' || (!isAbsolute(path) && path !== '..' && !path.startsWith(`..${sep}`));
}

export function createStaticServer({ root = resolve(projectRoot, 'site'), basePath = '' } = {}) {
  root = resolve(root);
  basePath = basePath.replace(/\/$/, '');
  if (basePath && (!basePath.startsWith('/') || basePath.includes('..') || basePath.includes('\\'))) {
    throw new Error('Invalid base path.');
  }
  const resolvedRoot = realpath(root);

  return createServer((request, response) => {
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.setHeader('Cache-Control', 'no-store');
    response.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self'; style-src 'self'; font-src 'self'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'none'",
    );

    const end = (status, message) => {
      response.writeHead(status, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end(request.method === 'HEAD' ? undefined : message);
    };

    async function handle() {
      if (request.method !== 'GET' && request.method !== 'HEAD') {
        response.setHeader('Allow', 'GET, HEAD');
        return end(405, 'Method not allowed.');
      }
      let pathname;
      try {
        pathname = decodeURIComponent((request.url || '/').split(/[?#]/)[0]);
      } catch {
        return end(400, 'Invalid path.');
      }
      if (
        !pathname.startsWith('/') ||
        pathname.includes('\0') ||
        pathname.includes('\\') ||
        pathname.split('/').some((part) => part === '..' || part === '.')
      ) {
        return end(400, 'Invalid path.');
      }
      if (basePath && pathname === basePath) {
        response.writeHead(308, { Location: `${basePath}/` });
        return response.end();
      }
      if (basePath && !pathname.startsWith(`${basePath}/`)) return end(404, 'Page not found.');
      let path = pathname.slice(basePath.length);
      if (path.split('/').some((part) => part.startsWith('.'))) return end(404, 'Page not found.');
      if (path.endsWith('/')) path += 'index.html';
      const file = resolve(root, `.${path}`);
      const actualRoot = await resolvedRoot;
      if (!contained(root, file)) return end(404, 'Page not found.');
      let actualFile;
      try {
        actualFile = await realpath(file);
        if (!contained(actualRoot, actualFile) || !(await stat(actualFile)).isFile())
          return end(404, 'Page not found.');
      } catch (error) {
        if (['ENOENT', 'ENOTDIR', 'EACCES'].includes(error.code)) return end(404, 'Page not found.');
        throw error;
      }
      const body = await readFile(actualFile);
      response.writeHead(200, {
        'Content-Type': types[extname(actualFile)] || 'application/octet-stream',
        'Content-Length': body.length,
      });
      response.end(request.method === 'HEAD' ? undefined : body);
    }

    handle().catch((error) => {
      console.error(`Static server error: ${error.code || error.message}`);
      if (!response.headersSent) end(500, 'Unable to serve this page.');
      else response.end();
    });
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const { values } = parseArgs({
      options: {
        root: { type: 'string', default: 'site' },
        port: { type: 'string', default: process.env.PORT || '3000' },
        host: { type: 'string', default: '0.0.0.0' },
        'base-path': { type: 'string', default: '' },
      },
    });
    const port = Number(values.port);
    if (!Number.isInteger(port) || port < 1 || port > 65535)
      throw new Error('Port must be between 1 and 65535.');
    const root = resolve(projectRoot, values.root);
    await stat(root);
    const server = createStaticServer({ root, basePath: values['base-path'] });
    server.on('error', (error) => {
      console.error(error.message);
      process.exitCode = 1;
    });
    server.listen(port, values.host, () =>
      console.log(`Computer-e is ready on http://${values.host}:${port}${values['base-path'] || ''}/`),
    );
    for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => server.close());
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
