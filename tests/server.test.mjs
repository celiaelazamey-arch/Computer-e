import test from 'node:test';
import assert from 'node:assert/strict';
import { request as httpRequest } from 'node:http';
import { mkdtemp, mkdir, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createStaticServer } from '../scripts/serve.mjs';

async function fixture(t, basePath = '') {
  const directory = await mkdtemp(join(tmpdir(), 'computer-e-server-'));
  const root = join(directory, 'site');
  await mkdir(root);
  await writeFile(join(root, 'index.html'), '<html>hello</html>');
  await writeFile(join(root, 'app.js'), 'export {};');
  await writeFile(join(root, '.env'), 'do-not-expose');
  await writeFile(join(directory, 'secret.txt'), 'do-not-expose');
  await symlink(join(directory, 'secret.txt'), join(root, 'escape.txt'));
  const server = createStaticServer({ root, basePath });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(async () => {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
    await rm(directory, { recursive: true, force: true });
  });
  const port = server.address().port;
  return (path, method = 'GET', headers = {}) =>
    new Promise((resolve, reject) => {
      const request = httpRequest({ hostname: '127.0.0.1', port, path, method, headers }, (response) => {
        let body = '';
        response.setEncoding('utf8');
        response.on('data', (chunk) => {
          body += chunk;
        });
        response.on('end', () => resolve({ status: response.statusCode, headers: response.headers, body }));
      });
      request.on('error', reject);
      request.end();
    });
}

test('static files support project paths, MIME types and query strings', async (t) => {
  const get = await fixture(t, '/Computer-e');
  assert.equal((await get('/Computer-e')).status, 308);
  assert.equal((await get('/Computer-e')).headers.location, '/Computer-e/');
  assert.equal((await get('/Computer-e/')).body, '<html>hello</html>');
  const script = await get('/Computer-e/app.js?version=1');
  assert.equal(script.status, 200);
  assert.match(script.headers['content-type'], /javascript/);
  assert.equal((await get('/')).status, 404);
  assert.equal((await get('/Computer-e/missing')).status, 404);
});

test('preview hosts are accepted and embeddable without loosening asset policies', async (t) => {
  const get = await fixture(t);
  const page = await get('/', 'GET', { Host: '3000-example.e2b.app' });
  assert.equal(page.status, 200);
  assert.equal(page.headers['x-content-type-options'], 'nosniff');
  assert.match(page.headers['content-security-policy'], /script-src 'self'/);
  assert.equal(page.headers['x-frame-options'], undefined);
  assert.doesNotMatch(page.headers['content-security-policy'], /frame-ancestors/);
});

test('HEAD works and unsupported methods are rejected', async (t) => {
  const get = await fixture(t);
  const head = await get('/', 'HEAD');
  assert.equal(head.status, 200);
  assert.equal(head.body, '');
  assert.equal(Number(head.headers['content-length']), '<html>hello</html>'.length);
  const post = await get('/', 'POST');
  assert.equal(post.status, 405);
  assert.equal(post.headers.allow, 'GET, HEAD');
});

test('traversal, hidden files, malformed encodings and escaping symlinks are never served', async (t) => {
  const get = await fixture(t);
  for (const path of [
    '/../secret.txt',
    '/%2e%2e/secret.txt',
    '/..%2Fsecret.txt',
    '/%00',
    '/%ZZ',
    '/foo%5Cbar',
  ]) {
    const response = await get(path);
    assert.equal(response.status, 400, path);
    assert.doesNotMatch(response.body, /do-not-expose/);
  }
  for (const path of ['/.env', '/.git/config', '/escape.txt']) {
    const response = await get(path);
    assert.equal(response.status, 404, path);
    assert.doesNotMatch(response.body, /do-not-expose/);
  }
});
