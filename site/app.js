import { features, filterFeatures, readChecklist, repository } from './data.js';

const $ = (selector) => document.querySelector(selector);
const checklistKey = 'computer-e:launch:v1';
const themeKey = 'computer-e:theme:v1';
const themeButton = $('#theme-toggle');
const systemTheme = window.matchMedia('(prefers-color-scheme: dark)');
let chosenTheme;
try {
  chosenTheme = localStorage.getItem(themeKey);
} catch {
  /* Local storage is optional. */
}

function setTheme(theme) {
  const dark = theme === 'dark';
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  const label = dark ? 'تفعيل الوضع الفاتح' : 'تفعيل الوضع الداكن';
  themeButton.setAttribute('aria-label', label);
  themeButton.title = label;
  themeButton.querySelector('use').setAttribute('href', dark ? '#i-sun' : '#i-moon');
}
setTheme(
  chosenTheme === 'dark' || chosenTheme === 'light' ? chosenTheme : systemTheme.matches ? 'dark' : 'light',
);
themeButton.hidden = false;
themeButton.addEventListener('click', () => {
  chosenTheme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  setTheme(chosenTheme);
  try {
    localStorage.setItem(themeKey, chosenTheme);
  } catch {
    /* Keep working without persistence. */
  }
});
systemTheme.addEventListener('change', (event) => {
  if (!chosenTheme) setTheme(event.matches ? 'dark' : 'light');
});

const search = $('#feature-search');
const filterButtons = [...document.querySelectorAll('[data-category]')];
const cards = [...document.querySelectorAll('.feature-card')];
let currentCategory = 'all';
function updateFeatures() {
  const visible = filterFeatures(search.value, currentCategory);
  const ids = new Set(visible.map((feature) => feature.id));
  for (const card of cards) card.hidden = !ids.has(card.dataset.feature);
  for (const button of filterButtons)
    button.setAttribute('aria-pressed', String(button.dataset.category === currentCategory));
  $('#tool-count').textContent = `${visible.length} ${visible.length === 1 ? 'أداة' : 'أدوات'}`;
  $('#empty-state').hidden = visible.length !== 0;
}
for (const button of filterButtons) {
  button.addEventListener('click', () => {
    currentCategory = button.dataset.category;
    updateFeatures();
  });
}
search.addEventListener('input', updateFeatures);
$('#clear-filters').addEventListener('click', () => {
  search.value = '';
  currentCategory = 'all';
  updateFeatures();
  search.focus();
});
$('#resource-toolbar').hidden = false;

const dialog = $('#feature-dialog');
let dialogOpener;
for (const link of document.querySelectorAll('[data-open-feature]')) {
  if (typeof dialog.showModal !== 'function') continue;
  link.setAttribute('aria-haspopup', 'dialog');
  link.addEventListener('click', (event) => {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) return;
    const feature = features.find((item) => item.id === link.dataset.openFeature);
    if (!feature) return;
    event.preventDefault();
    dialogOpener = link;
    $('#dialog-title').textContent = feature.name;
    $('#dialog-summary').textContent = feature.summary;
    const steps = feature.steps.map((step) => {
      const item = document.createElement('li');
      item.textContent = step;
      return item;
    });
    $('#dialog-steps').replaceChildren(...steps);
    $('#dialog-note').textContent = feature.note;
    $('#dialog-setup').href = feature.setupUrl;
    $('#dialog-setup').textContent = feature.setupLabel;
    $('#dialog-docs').href = feature.docs;
    $('#dialog-url').hidden = feature.id !== 'pages';
    $('#copy-status').textContent = '';
    dialog.showModal();
    $('#close-dialog').focus();
  });
}
$('#close-dialog').addEventListener('click', () => dialog.close());
dialog.addEventListener('keydown', (event) => {
  if (event.key !== 'Tab') return;
  const controls = [...dialog.querySelectorAll('a[href], button:not([disabled]), [tabindex="0"]')].filter(
    (element) => element.getClientRects().length > 0,
  );
  const first = controls[0];
  const last = controls.at(-1);
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last?.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first?.focus();
  }
});
dialog.addEventListener('close', () => dialogOpener?.focus());
dialog.addEventListener('click', (event) => {
  if (event.target !== dialog) return;
  const bounds = dialog.getBoundingClientRect();
  if (
    event.clientX < bounds.left ||
    event.clientX > bounds.right ||
    event.clientY < bounds.top ||
    event.clientY > bounds.bottom
  )
    dialog.close();
});
$('#copy-url').addEventListener('click', async () => {
  try {
    if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
    await navigator.clipboard.writeText(repository.siteUrl);
    $('#copy-status').textContent = 'تم نسخ الرابط المتوقع. افتحه بعد نجاح النشر.';
  } catch {
    const range = document.createRange();
    range.selectNodeContents($('#site-url'));
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
    $('#copy-status').textContent = 'تعذّر النسخ التلقائي. حدّد الرابط وانسخه يدويًا.';
  }
});

const checkboxes = [...document.querySelectorAll('input[name="launch-step"]')];
const allowedIds = checkboxes.map((input) => input.value);
let storageAvailable = true;
let savedChecklist = [];
try {
  savedChecklist = readChecklist(localStorage.getItem(checklistKey), allowedIds);
} catch {
  storageAvailable = false;
}
for (const checkbox of checkboxes) checkbox.checked = savedChecklist.includes(checkbox.value);

function updateChecklist(persist = false) {
  const selected = checkboxes.filter((input) => input.checked).map((input) => input.value);
  $('#checklist-count').textContent = `${selected.length} / ${checkboxes.length}`;
  const progress = $('#checklist-progress');
  progress.setAttribute('aria-valuenow', String(selected.length));
  progress.dataset.progress = String(selected.length);
  if (persist) {
    try {
      localStorage.setItem(checklistKey, JSON.stringify(selected));
    } catch {
      storageAvailable = false;
    }
  }
  $('#checklist-note').textContent = storageAvailable
    ? 'متابعة شخصية على جهازك؛ ليست فحصًا لحالة GitHub.'
    : 'التخزين المحلي غير متاح؛ المتابعة لهذه الزيارة فقط، وليست فحصًا لحالة GitHub.';
}
for (const checkbox of checkboxes) checkbox.addEventListener('change', () => updateChecklist(true));
$('#reset-checklist').hidden = false;
$('#reset-checklist').addEventListener('click', () => {
  for (const checkbox of checkboxes) checkbox.checked = false;
  updateChecklist(true);
});
updateChecklist();
