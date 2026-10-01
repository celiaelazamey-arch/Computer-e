export const repository = Object.freeze({
  owner: 'celiaelazamey-arch',
  name: 'Computer-e',
  url: 'https://github.com/celiaelazamey-arch/Computer-e',
  siteUrl: 'https://celiaelazamey-arch.github.io/Computer-e/',
  reviewedAt: '2026-10-01',
});

const repo = repository.url;

export const features = Object.freeze([
  {
    id: 'pages',
    category: 'launch',
    name: 'GitHub Pages',
    summary: 'استضافة مجانية لملفات HTML وCSS وJavaScript في مستودع عام.',
    docs: 'https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages',
    setupUrl: `${repo}/settings/pages`,
    setupLabel: 'افتح إعدادات Pages',
    steps: [
      'من Settings / Pages، اختر GitHub Actions في قائمة Source. لا تحتاج إلى بطاقة بنكية أو نطاق مدفوع.',
      'ادمج ملفات الإعداد في main. سير عمل Deploy Pages يختبر الموقع ويبنيه ثم ينشر مجلد dist فقط.',
      'إن كانت الملفات مدمجة بالفعل، افتح Actions / Deploy Pages / Run workflow واختر main.',
      'بعد نجاح مهمة deploy، افتح رابط الموقع الذي يظهر في سجل النشر. الرابط المتوقع موجود أدناه.',
    ],
    note: 'الموقع ثابت: لا توجد استضافة لخادم Node.js أو Python أو قاعدة بيانات. الرابط المتوقع ليس تأكيدًا بأن النشر تم.',
  },
  {
    id: 'actions',
    category: 'launch',
    name: 'GitHub Actions',
    summary: 'اختبارات وبناء ونشر تلقائي باستخدام مشغّلات Ubuntu القياسية.',
    docs: 'https://docs.github.com/en/billing/concepts/product-billing/github-actions',
    setupUrl: `${repo}/actions`,
    setupLabel: 'افتح سير العمل',
    steps: [
      'ملف CI يشغّل اختبارات Node.js واختبارات المتصفح عند رفع التغييرات وعند فتح Pull Request.',
      'ملف Deploy Pages ينشر من main فقط، بعد نجاح الاختبارات، ولا ينشر من طلبات الدمج.',
      'تستخدم الملفات ubuntu-latest القياسي، مع صلاحيات محدودة ومهلة تشغيل لمنع المهام العالقة.',
      'عند تعطل اختبار، راجع سجله في تبويب Actions قبل دمج التغيير.',
    ],
    note: 'وقت المشغّلات القياسية مجاني للمستودعات العامة، لكن حدود التشغيل والاستخدام العادل والتخزين تظل سارية. المشغّلات الأكبر ليست ضمن هذا الإعداد.',
  },
  {
    id: 'packages',
    category: 'launch',
    name: 'GitHub Packages',
    summary: 'مشاركة الحزم العامة، مع خيار يدوي لنشر صورة الموقع على GHCR.',
    docs: 'https://docs.github.com/en/billing/concepts/product-billing/github-packages',
    setupUrl: `${repo}/actions/workflows/package.yml`,
    setupLabel: 'افتح النشر الاختياري',
    steps: [
      'GitHub Pages لا يحتاج إلى حزمة أو Docker. استخدم Packages فقط إذا احتجت توزيع صورة الموقع.',
      'بعد الدمج في main، افتح Actions / Publish container (optional)، ثم فعّل خيار التأكيد وشغّل سير العمل يدويًا.',
      'تُنشر الصورة إلى ghcr.io/celiaelazamey-arch/computer-e باستعمال GITHUB_TOKEN؛ لا تضف رمزًا شخصيًا في الملفات.',
      'من صفحة الحزمة، راجع Package settings واجعلها Public إذا أردت إتاحتها للجميع. لا تفترض أن حزمة جديدة عامة تلقائيًا.',
    ],
    note: 'الحزم العامة مجانية. للحزم الخاصة في GitHub Free: 500 MB تخزين مشترك مع Actions و1 GB نقل شهريًا. تخزين ونقل GHCR مجانيان حاليًا، وقد تتغير السياسة بإشعار مسبق.',
  },
  {
    id: 'codespaces',
    category: 'develop',
    name: 'GitHub Codespaces',
    summary: 'بيئة تطوير جاهزة في المتصفح، مع ملف إعداد مرفق بالمشروع.',
    docs: 'https://docs.github.com/en/billing/concepts/product-billing/github-codespaces',
    setupUrl: `${repo}/codespaces`,
    setupLabel: 'افتح Codespaces',
    steps: [
      'من Code / Codespaces، اختر إنشاء بيئة من main بعد دمج الملفات، أو اختر فرع العمل الحالي.',
      'اختر جهازًا ثنائي النواة: 120 ساعة نواة تعادل نحو 60 ساعة تشغيل، وليست 120 ساعة على هذا الجهاز.',
      'ملف devcontainer يثبت أدوات الاختبار. شغّل npm run dev، ثم افتح المنفذ 3000.',
      'أوقف البيئة عند الانتهاء، واضبط مهلة خمول قصيرة. احذف البيئات غير المطلوبة لأن البيئة المتوقفة ما زالت تستهلك التخزين.',
    ],
    note: 'الحصة للحسابات الشخصية Free: 120 ساعة نواة و15 GB-month شهريًا. بدون وسيلة دفع يتوقف الاستخدام عند نفاد الحصة. لم يتم إنشاء Codespace تلقائيًا.',
  },
  {
    id: 'copilot',
    category: 'develop',
    name: 'GitHub Copilot',
    summary: 'مساعد برمجة بخطة Free، أو مزايا Student للطلاب المؤهلين.',
    docs: 'https://docs.github.com/en/copilot/get-started/plans',
    setupUrl: 'https://github.com/copilot?ref_plan=free',
    setupLabel: 'افتح Copilot Free',
    steps: [
      'فعّل Copilot Free من حسابك، وتأكد أن الخطة المعروضة مجانية وليست تجربة Pro مدفوعة.',
      'في VS Code أو Codespaces، فعّل إضافة GitHub Copilot وسجّل الدخول بحساب GitHub نفسه.',
      'Free تتيح 2,000 إكمال كود شهريًا، مع رصيد محدود من GitHub AI Credits للمزايا الأخرى.',
      'إذا كنت طالبًا، قدّم إثبات الأهلية في GitHub Education ثم فعّل Copilot Student من مزايا حسابك.',
    ],
    note: 'التفعيل شخصي ولا يمكن لملفات المستودع الاشتراك نيابةً عنك. الخطة الحالية للطلاب هي Copilot Student؛ ليست وعدًا بالحصول على Pro أو استخدام غير محدود لكل المزايا.',
  },
  {
    id: 'projects',
    category: 'organize',
    name: 'GitHub Projects',
    summary: 'لوحة مهام وجداول مرتبطة بـ Issues وPull Requests.',
    docs: 'https://docs.github.com/en/issues/planning-and-tracking-with-projects/learning-about-projects/about-projects',
    setupUrl: 'https://github.com/users/celiaelazamey-arch/projects',
    setupLabel: 'افتح المشاريع',
    steps: [
      'من تبويب Projects في حسابك، اضغط New project واختر Board أو Table.',
      'سمِّ اللوحة Computer-e، وأضف حالات Todo وIn progress وDone.',
      'أضف Issues المستودع إلى اللوحة. قوالب الإبلاغ عن مشكلة وطلب ميزة مرفقة بهذا المشروع.',
      'من Workflows في اللوحة، فعّل تغيير الحالة تلقائيًا عند إغلاق Issue أو دمج Pull Request، ثم اربط اللوحة بالمستودع.',
    ],
    note: 'Issues وProjects متاحان مجانًا. القوالب جاهزة، لكن إنشاء لوحة في حسابك يحتاج صلاحية Projects منفصلة؛ لم يتم إنشاء لوحة تلقائيًا.',
  },
  {
    id: 'security',
    category: 'organize',
    name: 'GitHub Security',
    summary: 'Dependabot وCodeQL، مع مراجعة فحص الأسرار وحماية الرفع.',
    docs: 'https://docs.github.com/en/code-security/getting-started/github-security-features',
    setupUrl: `${repo}/settings/security_analysis`,
    setupLabel: 'افتح إعدادات الأمان',
    steps: [
      'ادمج dependabot.yml وcodeql.yml في main لتحديث الأدوات وفحص JavaScript بصورة دورية.',
      'من Settings / Security، راجع Dependency graph وDependabot alerts وSecurity updates.',
      'راجع Secret scanning وPush protection. هذه المزايا متاحة للمستودعات العامة دون شراء Advanced Security.',
      'فعّل Private vulnerability reporting لإتاحة الإبلاغ السري، وتابع النتائج في تبويب Security and quality.',
    ],
    note: 'ملفات الفحص لا تثبت أن إعدادات الحساب مفعّلة. إذا تسرب سر، ألغِه أو دوّره لدى مزوّده فورًا؛ حذف الملف وحده لا يكفي.',
  },
  {
    id: 'skills',
    category: 'develop',
    name: 'GitHub Skills',
    summary: 'دروس عملية مجانية لتعلّم GitHub خطوة بخطوة.',
    docs: 'https://skills.github.com/',
    setupUrl: 'https://skills.github.com/',
    setupLabel: 'استكشف الدورات',
    steps: [
      'ابدأ بدورة Introduction to GitHub للتعرّف على المستودعات وطلبات الدمج.',
      'انتقل إلى دورة GitHub Pages لتجربة نشر موقع ثابت.',
      'تعلّم GitHub Actions ثم اختبارات الأمان حسب احتياج مشروعك.',
      'نفّذ التمارين في مستودع تعليمي منفصل، ولا تنشر بيانات شخصية أو أسرارًا.',
    ],
    note: 'الدورات مجانية، لكن أي حصة خدمة تستخدمها أثناء التمرين تظل خاضعة لحدود حسابك.',
  },
]);

export function normalizeSearch(value = '') {
  return String(value)
    .normalize('NFKD')
    .replace(/[\u064B-\u065F\u0670\u0300-\u036f]/g, '')
    .replace(/[إأآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .trim()
    .toLocaleLowerCase('ar');
}

export function filterFeatures(query = '', category = 'all') {
  const words = normalizeSearch(query).split(/\s+/).filter(Boolean);
  return features.filter((feature) => {
    const text = normalizeSearch([feature.name, feature.summary, feature.note, ...feature.steps].join(' '));
    return (
      (category === 'all' || feature.category === category) && words.every((word) => text.includes(word))
    );
  });
}

export function readChecklist(value, allowedIds) {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? [...new Set(parsed.filter((id) => allowedIds.includes(id)))] : [];
  } catch {
    return [];
  }
}
