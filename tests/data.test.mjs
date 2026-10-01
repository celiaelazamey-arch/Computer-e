import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { features, filterFeatures, normalizeSearch, readChecklist, repository } from '../site/data.js';

const html = await readFile(new URL('../site/index.html', import.meta.url), 'utf8');

test('every resource has a matching static card, safe URLs, and setup instructions', () => {
  assert.equal(features.length, 8);
  assert.equal(new Set(features.map((feature) => feature.id)).size, 8);
  for (const feature of features) {
    assert.match(html, new RegExp(`data-feature="${feature.id}"`));
    assert.match(html, new RegExp(`data-open-feature="${feature.id}"`));
    assert.equal(new URL(feature.docs).protocol, 'https:');
    assert.equal(new URL(feature.setupUrl).protocol, 'https:');
    assert.ok(feature.steps.length >= 3);
    assert.ok(feature.note.length > 20);
    assert.ok(['launch', 'develop', 'organize'].includes(feature.category));
  }
});

test('Arabic search ignores case, diacritics and common letter variants', () => {
  assert.equal(normalizeSearch(' إِعْدَاد  '), 'اعداد');
  assert.equal(normalizeSearch('أَمَان'), 'امان');
  assert.equal(normalizeSearch('بِيئَة'), 'بييه');
  assert.equal(normalizeSearch('GitHub'), 'github');
  assert.equal(normalizeSearch('على'), 'علي');
});

test('category filtering, multi-word search and empty searches work together', () => {
  assert.equal(filterFeatures().length, 8);
  assert.equal(filterFeatures('', 'launch').length, 3);
  assert.equal(filterFeatures('', 'develop').length, 3);
  assert.equal(filterFeatures('', 'organize').length, 2);
  assert.deepEqual(
    filterFeatures('HTML CSS').map((feature) => feature.id),
    ['pages'],
  );
  assert.deepEqual(filterFeatures('HTML CSS', 'develop'), []);
  assert.deepEqual(filterFeatures('nothing-matches-this'), []);
  assert.deepEqual(filterFeatures('', 'unknown'), []);
  assert.ok(filterFeatures('إعداد').length > 0);
});

test('saved checklists discard unknown values, duplicates and corrupted storage', () => {
  const allowed = ['pages', 'security'];
  assert.deepEqual(readChecklist('["pages","pages","security","unknown",12]', allowed), [
    'pages',
    'security',
  ]);
  for (const value of [null, 'null', '{}', '42', 'broken'])
    assert.deepEqual(readChecklist(value, allowed), []);
});

test('the site has RTL metadata, relative assets and no inline scripts or external stylesheets', () => {
  assert.match(html, /<html lang="ar" dir="rtl">/);
  assert.match(html, /src="\.\/app\.js"/);
  assert.match(html, /href="\.\/styles\.css"/);
  assert.equal((html.match(/<script\b/g) || []).length, 1);
  assert.match(html, /<script type="module" src="\.\/app\.js"><\/script>/);
  assert.doesNotMatch(html, /on(click|load|error)=|<link[^>]*href="https?:/);
  assert.equal(repository.siteUrl, 'https://celiaelazamey-arch.github.io/Computer-e/');
});
