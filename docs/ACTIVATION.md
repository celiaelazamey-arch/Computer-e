# تفعيل المشروع على GitHub — بدون بطاقة بنكية

- **المستودع:** [`celiaelazamey-arch/Computer-e`](https://github.com/celiaelazamey-arch/Computer-e)
- **فرع الإعداد:** `arena/01a0f844-computer-e`
- **نوع النشر:** GitHub Pages لموقع ثابت في مستودع عام.

ملفات الموقع وسير العمل لا يمكنها وحدها تغيير جميع إعدادات حساب GitHub. التفعيل النهائي يحتاج مالك المستودع أو شخصًا مخوّلًا. لا تحتاج إضافة بطاقة لهذا المسار، ولا تطلب هذه التعليمات اشتراكًا مدفوعًا.

## 1. حافظ على المسار المجاني

- اترك المستودع **Public**؛ هو عام أصلًا. لا تنشر فيه أسرارًا أو بيانات خاصة.
- استخدم GitHub Free ونطاق `github.io` المجاني.
- لا تضف بطاقة أو تبدأ تجربة Pro أو Copilot مدفوعة.
- ملفات Actions تستخدم `ubuntu-latest` القياسي، وليس مشغّلات أكبر مدفوعة.
- لا نغيّر الخطة أو إعدادات الفوترة. إذا كانت وسيلة دفع موجودة في الحساب أصلًا، راجع [Budgets and alerts](https://github.com/settings/billing) وحدود الإيقاف قبل تشغيل خدمات ذات حصة محدودة.

## 2. فعّل Pages قبل الدمج

1. افتح [إعدادات Pages](https://github.com/celiaelazamey-arch/Computer-e/settings/pages).
2. تحت **Build and deployment → Source** اختر **GitHub Actions**.
3. لا تختَر `Deploy from a branch`؛ هذا المشروع لديه سير بناء ونشر مخصص.
4. لا تحتاج إنشاء ملف workflow من القوالب المقترحة: الملف موجود في `.github/workflows/pages.yml`.

إذا لم تظهر Pages، تأكد أنك مسجل بحساب مخوّل وأن المستودع عام. إذا ظهر خطأ صلاحيات في Arena، راجع اتصال GitHub وصلاحيات المستودع؛ لا ترسل رمز وصول في المحادثة.

## 3. راجع ثم ادمج ملفات الإعداد

- افتح طلب الدمج من `arena/01a0f844-computer-e` إلى `main`.
- راجع الموقع وملفات Actions وانتظر نجاح **CI** و**CodeQL**، إذا سمحت سياسة الحساب بتشغيلهما.
- ادمج طلب الدمج من واجهة GitHub. لا يوجد احتياج لفرع جديد أو لرفع الملفات الناتجة عن البناء.

الموقع وسير النشر يعملان من `main`. فرع الإعداد يشغّل CI وCodeQL فقط؛ لا ينشر تلقائيًا موقع الإنتاج.

## 4. تحقّق من النشر

افتح [سير Deploy Pages](https://github.com/celiaelazamey-arch/Computer-e/actions/workflows/pages.yml).

- عند تحديث `main` يبدأ النشر تلقائيًا.
- إذا دُمجت الملفات قبل تفعيل Pages، اختر **Run workflow → main** بعد تفعيلها.
- يجب نجاح مهمتَي **build** و**deploy**. البناء يشغّل اختبارات الوحدات والمتصفح، ثم يرفع `dist` فقط.
- افتح رابط البيئة **github-pages** الذي يعرضه GitHub بعد نجاح `deploy`.

الرابط المتوقع:

```text
https://celiaelazamey-arch.github.io/Computer-e/
```

هذا رابط متوقع، وليس دليلًا على أن الموقع أصبح متاحًا. قد يستغرق ظهوره بضع دقائق بعد النشر الناجح.

## 5. راجع الأمان المجاني

من **Settings → Security** (قد يظهر باسم **Code security and analysis** حسب واجهة GitHub):

- راجع **Dependency graph** ثم فعّل **Dependabot alerts** و**Dependabot security updates** إن لم تكونا مفعّلتين.
- راجع **Secret scanning** و**Push protection**؛ التوثيق الحالي يذكر إتاحتهما افتراضيًا للمستودعات العامة. لا نفترض حالتهما من ملفات المشروع أو من استجابة API غير مخوّلة.
- فعّل **Private vulnerability reporting** ليتمكن المستخدمون من الإبلاغ السري عن الثغرات.
- **CodeQL:** سير العمل المرفق هو إعداد متقدم لـ JavaScript. إذا سبق تفعيل CodeQL Default setup، عطّله قبل استخدام السير المتقدم لتجنب تعارض الإعدادين.
- **Dependabot version updates:** ملف `dependabot.yml` يعمل بعد وصوله إلى الفرع الافتراضي. يحدّث أدوات الاختبار وActions وصور Docker أسبوعيًا، ولا يدمج أي تحديث تلقائيًا.

راقب تبويب **Security and quality** وتنبيهات CodeQL وDependabot. الفحص الآلي ليس ضمانًا لغياب كل الثغرات.

## بديل اختياري: سكربت إعداد المالك

بعد تثبيت GitHub CLI وتوصيله بحساب مخوّل:

```sh
npm ci --ignore-scripts
npm run github:check
npm run github:setup
```

`github:check` لا يكتب أي شيء. `github:setup` يتأكد أن المستودع عام وأن المستخدم لديه صلاحية `admin` وأن Actions مفعّلة، ثم:

1. ينشئ/يضبط مصدر Pages إلى GitHub Actions.
2. يفعّل Dependabot alerts وSecurity updates.
3. يراجع تفعيل Secret scanning وPush protection بطلب إعداد صريح.
4. يفعّل Private vulnerability reporting.
5. يضيف رابط الموقع المتوقع إلى صفحة المستودع إذا كان الحقل فارغًا فقط.

لا يغيّر الفوترة أو الخطة أو سياسة Actions، ولا يشتري أي خدمة، ولا ينشئ Codespace أو Project أو اشتراك Copilot، ولا يرفع الكود أو يدمجه. يمكن إعادة تشغيله؛ يظهر أي فشل جزئي بدلًا من إعلان نجاح كل الميزات.

استجابة `403` أو `404` قد تعني نقص الصلاحيات، وليست وحدها دليلًا على أن ميزة غير مفعّلة.

## 6. ابدأ Codespaces عند الحاجة فقط

1. من **Code → Codespaces** اختر الفرع الذي يحتوي على ملف `.devcontainer`.
2. اختر جهازًا **ثنائي النواة**، واستخدم الحصة الشخصية المجانية.
3. بعد تجهيز البيئة شغّل `npm run dev`، وافتح المنفذ 3000.
4. لاختبارات المتصفح شغّل `npx playwright install --with-deps chromium` ثم `npm run test:browser`.
5. اضبط مهلة خمول قصيرة من إعدادات Codespaces، وأوقف البيئة عند الانتهاء. احذف البيئات القديمة لتقليل التخزين.

الصورة المخصصة المرفقة والأدوات والملفات تستهلك من حصة التخزين. لا توجد Prebuilds أو بيئات تُنشأ تلقائيًا بهذا الإعداد.

## 7. Copilot وProjects وPackages

- **Copilot:** اختر [Copilot Free](https://github.com/copilot?ref_plan=free) من حسابك ثم فعّل إضافة GitHub Copilot في VS Code. الطلاب يراجعون [Education benefits](https://github.com/settings/education/benefits) لتفعيل **Copilot Student** بعد التحقق. لا تكمل صفحة شراء إذا كنت تريد المسار المجاني.
- **Projects:** اتبع [دليل اللوحة](PROJECTS.md). وجود قوالب Issues لا يعني إنشاء لوحة فعلية في حسابك.
- **Packages:** Pages لا تحتاج Docker. إذا احتجت الصورة، افتح `Publish container (optional)` من Actions على `main`، وفعّل مربع التأكيد يدويًا. الصورة تُنشر إلى `ghcr.io/celiaelazamey-arch/computer-e`. راجع ظهور الحزمة واجعلها Public إذا أردت تنزيلًا عامًا.
- **Skills:** افتح [GitHub Skills](https://skills.github.com/) لتعلّم الأدوات. لا تنقل بيانات شخصية إلى التمارين العامة.

## حل الأخطاء الشائعة

| المشكلة                                  | الحل                                                                                         |
| ---------------------------------------- | -------------------------------------------------------------------------------------------- |
| `Get Pages site failed` أو 404           | اختر Source = GitHub Actions ثم أعد تشغيل Deploy Pages. راجع صلاحيات Pages في الحساب.        |
| لا يظهر Run workflow                     | يجب وصول ملف السير إلى `main` أولًا.                                                         |
| لا تُقبل عملية النشر                     | راجع بيئة `github-pages` وسياسة الفروع/الموافقات؛ هذا السير ينشر من `main` فقط.              |
| Actions موقوفة أو الأكشن غير مسموح       | راجع Settings → Actions وسياسة الحساب، واسمح للأكشنات المحددة دون فتح سياسات أوسع من اللازم. |
| CodeQL يرفض التحليل مع Default setup     | استخدم إعدادًا واحدًا: عطّل Default setup قبل السير المتقدم المرفق.                          |
| صورة GHCR لا يمكن تنزيلها دون تسجيل دخول | الحزمة الجديدة قد تكون خاصة. غيّر ظهورها إلى Public من Package settings.                     |
| رابط الموقع يعرض 404                     | تأكد من نجاح deploy، واسم المستودع وحالة الأحرف `/Computer-e/`، وانتظر انتشار النشر.         |

## مراجع

- [إعداد مصدر GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).
- [الخدمات والحصص المجانية](FREE-GITHUB.md).
- [ميزانيات وحدود الاستخدام](https://docs.github.com/en/billing/how-tos/set-up-budgets).
