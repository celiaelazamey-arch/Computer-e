import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.beforeEach(async ({ page }) => {
  await page.goto('./');
  await expect(page.locator('#resource-toolbar')).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
});

test('Arabic RTL assets load from the GitHub Pages project subpath without console errors', async ({
  page,
}) => {
  const errors = [];
  const external = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('request', (request) => {
    if (new URL(request.url()).origin !== new URL(page.url()).origin) external.push(request.url());
  });
  await page.reload();
  await expect(page).toHaveTitle(/Computer-e/);
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await expect(page.locator('.feature-card:visible')).toHaveCount(8);
  expect(errors).toEqual([]);
  expect(external).toEqual([]);
});

test('filters, Arabic search, empty states and reset are functional', async ({ page }) => {
  await page.getByRole('button', { name: 'النشر والأتمتة', exact: true }).click();
  await expect(page.locator('.feature-card:visible')).toHaveCount(3);
  await page.getByRole('searchbox').fill('HTML CSS');
  await expect(page.locator('.feature-card:visible')).toHaveCount(1);
  await expect(page.locator('[data-feature="pages"]')).toBeVisible();
  await page.getByRole('searchbox').fill('<script>alert(1)</script>');
  await expect(page.locator('.feature-card:visible')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'لا توجد أدوات مطابقة' })).toBeVisible();
  await page.getByRole('button', { name: 'إعادة ضبط البحث' }).click();
  await expect(page.locator('.feature-card:visible')).toHaveCount(8);
  await expect(page.getByRole('searchbox')).toHaveValue('');
  await expect(page.getByRole('button', { name: 'كل الأدوات', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
});

test('setup dialog supports keyboard focus, escape and focus restoration', async ({ page }) => {
  const opener = page.getByRole('link', { name: 'طريقة إعداد GitHub Pages', exact: true });
  await opener.click();
  const dialog = page.getByRole('dialog', { name: 'GitHub Pages', exact: true });
  await expect(dialog).toBeVisible();
  await expect(dialog.locator('ol li')).toHaveCount(4);
  await expect(page.getByRole('button', { name: 'إغلاق دليل الإعداد' })).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  expect(await page.evaluate(() => document.activeElement.closest('dialog') !== null)).toBe(true);
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await expect(opener).toBeFocused();
});

test('the expected URL can be copied without pretending deployment is complete', async ({
  page,
  context,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.getByRole('link', { name: 'طريقة إعداد GitHub Pages', exact: true }).click();
  await page.getByRole('button', { name: 'نسخ رابط الموقع المتوقع' }).click();
  await expect(page.locator('#copy-status')).toContainText('تم نسخ الرابط المتوقع');
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    'https://celiaelazamey-arch.github.io/Computer-e/',
  );
});

test('the launch checklist is local, persists reloads and can be reset', async ({ page }) => {
  await page.locator('.launch-checklist label').nth(0).click();
  await page.locator('.launch-checklist label').nth(1).click();
  await expect(page.locator('#checklist-progress')).toHaveAttribute('aria-valuenow', '2');
  await page.reload();
  await expect(page.locator('input[name="launch-step"]:checked')).toHaveCount(2);
  await expect(page.locator('#checklist-note')).toContainText('ليست فحصًا');
  await page.getByRole('button', { name: 'إعادة ضبط', exact: true }).click();
  await expect(page.locator('input[name="launch-step"]:checked')).toHaveCount(0);
  await expect(page.locator('#checklist-progress')).toHaveAttribute('aria-valuenow', '0');
});

test('theme preference persists and can be switched back', async ({ page }) => {
  await page.getByRole('button', { name: 'تفعيل الوضع الداكن' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.getByRole('button', { name: 'تفعيل الوضع الفاتح' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
});

test('blocked local storage does not break search, theme or checklist', async ({ page }) => {
  await page.addInitScript(() => {
    Storage.prototype.getItem = () => {
      throw new Error('Storage blocked');
    };
    Storage.prototype.setItem = () => {
      throw new Error('Storage blocked');
    };
  });
  await page.reload();
  await expect(page.locator('#resource-toolbar')).toBeVisible();
  await page.locator('.launch-checklist label').nth(0).click();
  await expect(page.locator('#checklist-progress')).toHaveAttribute('aria-valuenow', '1');
  await expect(page.locator('#checklist-note')).toContainText('التخزين المحلي غير متاح');
  await page.getByRole('button', { name: 'تفعيل الوضع الداكن' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.getByRole('searchbox').fill('HTML CSS');
  await expect(page.locator('.feature-card:visible')).toHaveCount(1);
});

test('no-JavaScript visitors still get all resources, deployment guidance and native FAQ', async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(baseURL);
  await expect(page.locator('.feature-card:visible')).toHaveCount(8);
  await expect(page.locator('#resource-toolbar')).not.toBeVisible();
  await page.getByText('هل النشر يحتاج فيزا أو بطاقة بنكية؟', { exact: true }).click();
  await expect(page.locator('details[open]')).toHaveCount(1);
  await expect(page.locator('a[data-open-feature="pages"]')).toHaveAttribute(
    'href',
    /^https:\/\/docs\.github\.com\//,
  );
  await context.close();
});

test('layout does not overflow at common phone, tablet and desktop widths', async ({ page }) => {
  for (const width of [320, 375, 600, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.evaluate(() => document.fonts.ready);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, `Horizontal overflow at ${width}px`).toBeLessThanOrEqual(1);
  }
});

test('light, dark and setup dialog pass automated WCAG accessibility checks', async ({ page }) => {
  const audit = async () => {
    const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    expect(result.violations).toEqual([]);
  };
  await audit();
  await page.getByRole('button', { name: 'تفعيل الوضع الداكن' }).click();
  await audit();
  await page.getByRole('link', { name: 'طريقة إعداد GitHub Pages', exact: true }).click();
  await audit();
});
