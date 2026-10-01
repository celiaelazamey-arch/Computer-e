import test from 'node:test';
import assert from 'node:assert/strict';
import { checkRepository, configureRepository, repoId } from '../scripts/github-setup.mjs';

function mockApi(overrides = {}) {
  const calls = [];
  const root = `repos/${repoId}`;
  const defaults = {
    [root]: { ok: true, data: { visibility: 'public', permissions: { admin: true }, homepage: '' } },
    [`${root}/actions/permissions`]: { ok: true, data: { enabled: true } },
    [`${root}/pages`]: { ok: true, data: { build_type: 'workflow' } },
  };
  const api = async (method, endpoint, body) => {
    calls.push({ method, endpoint, body });
    return (
      overrides[`${method} ${endpoint}`] ||
      (method === 'GET' ? defaults[endpoint] : undefined) || { ok: true, data: null }
    );
  };
  return { api, calls, root };
}

test('setup refuses private repositories and never changes visibility', async () => {
  const { api, calls, root } = mockApi({
    [`GET repos/${repoId}`]: { ok: true, data: { visibility: 'private', permissions: { admin: true } } },
  });
  await assert.rejects(
    configureRepository(api, () => {}),
    /already-public/,
  );
  assert.deepEqual(
    calls.map(({ method, endpoint }) => [method, endpoint]),
    [['GET', root]],
  );
});

test('missing admin access and disabled Actions fail before any write', async () => {
  for (const overrides of [
    { [`GET repos/${repoId}`]: { ok: true, data: { visibility: 'public', permissions: { admin: false } } } },
    { [`GET repos/${repoId}/actions/permissions`]: { ok: true, data: { enabled: false } } },
  ]) {
    const { api, calls } = mockApi(overrides);
    await assert.rejects(configureRepository(api, () => {}));
    assert.ok(calls.every((call) => call.method === 'GET'));
  }
});

test('setup is idempotent, scoped to the repository and never touches billing', async () => {
  const { api, calls, root } = mockApi();
  const results = await configureRepository(api, () => {});
  assert.ok(results.every((result) => result.ok));
  assert.equal(calls.filter((call) => call.endpoint === `${root}/pages`).length, 1);
  assert.ok(calls.every((call) => call.endpoint.startsWith(root)));
  assert.ok(calls.every((call) => !/billing|codespaces|projects|copilot/.test(call.endpoint)));
  assert.ok(calls.some((call) => call.endpoint.endsWith('/vulnerability-alerts') && call.method === 'PUT'));
  const settings = calls.find((call) => call.body?.security_and_analysis);
  assert.equal(settings.body.security_and_analysis.secret_scanning.status, 'enabled');
  assert.equal(settings.body.security_and_analysis.secret_scanning_push_protection.status, 'enabled');
});

test('unconfigured Pages is created with an Actions source, without a new branch', async () => {
  const { api, calls, root } = mockApi({
    [`GET repos/${repoId}/pages`]: { ok: false, status: 404, message: 'Not Found' },
  });
  await configureRepository(api, () => {});
  const pageWrite = calls.find((call) => call.endpoint === `${root}/pages` && call.method === 'POST');
  assert.deepEqual(pageWrite.body, { build_type: 'workflow' });
});

test('unknown Pages access errors are not mistaken for a missing site', async () => {
  const { api, calls } = mockApi({
    [`GET repos/${repoId}/pages`]: { ok: false, status: 403, message: 'Not allowed' },
  });
  await assert.rejects(
    configureRepository(api, () => {}),
    /Unable to inspect Pages/,
  );
  assert.ok(calls.every((call) => call.method === 'GET'));
});

test('partial failures stay visible and existing website links are preserved', async () => {
  const { api, calls } = mockApi({
    [`GET repos/${repoId}`]: {
      ok: true,
      data: { visibility: 'public', permissions: { admin: true }, homepage: 'https://example.com' },
    },
    [`PUT repos/${repoId}/automated-security-fixes`]: { ok: false, status: 403, message: 'Not allowed' },
  });
  const results = await configureRepository(api, () => {});
  assert.equal(results.filter((result) => !result.ok).length, 1);
  assert.ok(!calls.some((call) => call.body?.homepage));
});

test('check mode is read-only and explains ambiguous permissions errors', async () => {
  const { api, calls } = mockApi({
    [`GET repos/${repoId}/pages`]: { ok: false, status: 403, message: 'Not allowed' },
  });
  const messages = [];
  await checkRepository(api, (message) => messages.push(message));
  assert.ok(calls.every((call) => call.method === 'GET'));
  assert.ok(messages.some((message) => message.includes('unavailable (403)')));
  assert.ok(messages.some((message) => message.includes('not proof')));
});
