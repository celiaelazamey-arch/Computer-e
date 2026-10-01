import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { repository } from '../site/data.js';

export const repoId = `${repository.owner}/${repository.name}`;

export function githubApi(method, endpoint, body) {
  const args = ['api', endpoint, '--method', method];
  if (body !== undefined) args.push('--input', '-');
  try {
    const output = execFileSync('gh', args, {
      encoding: 'utf8',
      input: body === undefined ? undefined : JSON.stringify(body),
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return { ok: true, data: output.trim() ? JSON.parse(output) : null };
  } catch (error) {
    let data;
    try {
      data = JSON.parse(error.stdout || '{}');
    } catch {
      data = {};
    }
    return {
      ok: false,
      status: Number(data.status) || 0,
      message:
        data.message ||
        (error.code === 'ENOENT'
          ? 'GitHub CLI (gh) is not installed.'
          : 'GitHub request failed. Check the GitHub connection and repository permissions.'),
    };
  }
}

export async function configureRepository(api = githubApi, log = console.log) {
  const info = await api('GET', `repos/${repoId}`);
  if (!info.ok) throw new Error(info.message);
  if (info.data.visibility !== 'public')
    throw new Error(
      'Stopped: this setup only supports an already-public repository. It will not change repository visibility.',
    );
  if (!info.data.permissions?.admin)
    throw new Error(
      'Administrator access is required. Reconnect GitHub with the necessary repository permissions in Arena, or run this command as the repository owner. Do not share access tokens in chat.',
    );

  const actions = await api('GET', `repos/${repoId}/actions/permissions`);
  if (!actions.ok || !actions.data.enabled)
    throw new Error(
      'Enable GitHub Actions in repository Settings first. This script will not override the allowed-actions policy.',
    );

  const tasks = [];
  const pages = await api('GET', `repos/${repoId}/pages`);
  if (!pages.ok && pages.status !== 404) throw new Error(`Unable to inspect Pages: ${pages.message}`);
  if (!pages.ok || pages.data.build_type !== 'workflow') {
    tasks.push([
      'GitHub Pages (Actions source)',
      pages.ok ? 'PUT' : 'POST',
      `repos/${repoId}/pages`,
      { build_type: 'workflow' },
    ]);
  } else {
    log('✓ GitHub Pages already uses GitHub Actions.');
  }
  tasks.push(
    ['Dependabot alerts', 'PUT', `repos/${repoId}/vulnerability-alerts`],
    ['Dependabot security updates', 'PUT', `repos/${repoId}/automated-security-fixes`],
    [
      'Secret scanning and push protection',
      'PATCH',
      `repos/${repoId}`,
      {
        security_and_analysis: {
          secret_scanning: { status: 'enabled' },
          secret_scanning_push_protection: { status: 'enabled' },
        },
      },
    ],
    ['Private vulnerability reporting', 'PUT', `repos/${repoId}/private-vulnerability-reporting`],
  );
  if (!info.data.homepage)
    tasks.push(['Project website link', 'PATCH', `repos/${repoId}`, { homepage: repository.siteUrl }]);

  const results = [];
  for (const [name, method, endpoint, body] of tasks) {
    const result = await api(method, endpoint, body);
    results.push({ name, ...result });
    log(`${result.ok ? '✓' : '✗'} ${name}${result.ok ? '' : `: ${result.message}`}`);
  }
  log(
    'No billing settings, payment methods, Copilot subscriptions, Codespaces, or Projects were created or changed.',
  );
  log(
    'Merge the setup into main, then run Deploy Pages. A successful settings change is not a completed deployment.',
  );
  return results;
}

export async function checkRepository(api = githubApi, log = console.log) {
  for (const [name, endpoint] of [
    ['Repository', `repos/${repoId}`],
    ['Pages', `repos/${repoId}/pages`],
    ['Dependabot alerts', `repos/${repoId}/vulnerability-alerts`],
    ['Dependabot security updates', `repos/${repoId}/automated-security-fixes`],
    ['Private vulnerability reporting', `repos/${repoId}/private-vulnerability-reporting`],
  ]) {
    const result = await api('GET', endpoint);
    if (!result.ok) {
      log(`${name}: unavailable (${result.status || 'connection error'}). ${result.message}`);
      continue;
    }
    if (name === 'Repository') {
      const security = result.data.security_and_analysis;
      log(`Repository: ${result.data.visibility}; admin: ${Boolean(result.data.permissions?.admin)}`);
      log(
        `Secret scanning: ${security?.secret_scanning?.status || 'unknown'}; push protection: ${security?.secret_scanning_push_protection?.status || 'unknown'}`,
      );
    } else if (name === 'Pages') {
      log(`Pages: ${result.data.html_url}; source: ${result.data.build_type}; status: ${result.data.status}`);
    } else {
      log(`${name}: ${result.data ? JSON.stringify(result.data) : 'enabled'}`);
    }
  }
  log(
    'A 403/404 response can also mean insufficient permissions; it is not proof that a feature is disabled.',
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const args = process.argv.slice(2);
    if (args.length > 1 || (args.length === 1 && !['--check', '--apply'].includes(args[0])))
      throw new Error('Usage: node scripts/github-setup.mjs [--check | --apply]');
    if (args[0] === '--apply') {
      const results = await configureRepository();
      if (results.some((result) => !result.ok)) process.exitCode = 1;
    } else await checkRepository();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
