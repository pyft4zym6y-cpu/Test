# WEEXP Commerce OS — Data Room для внешнего независимого аудита

> Полный пакет документации по продукту и процессам, подготовленный для передачи
> внешнему независимому аудитору. Цель — дать возможность увидеть систему и все
> процессы «под микроскопом»: архитектуру, код, данные, безопасность, методологию,
> операционные и бизнес-процессы.

**Продукт.** WEEXP Commerce OS — система автоматизированного аудита e-commerce
(движок аудита `worker/` + клиентский портал `portal/`). Принимает сайт клиента и
доступы, проводит аудит по единой методологии (T1–T4, 19 блоков, Master Audit
System) и выпускает пакет отчётов (PDF/XLSX).

---

## Как устроен этот data room

Документы разбиты на 17 разделов по доменам аудита. Каждый раздел — отдельный файл.
Полный **реестр документов** со статусом и владельцем — в
[`00-document-register.md`](./00-document-register.md). Это и есть «весь перечень».

| # | Раздел | Файл | Что вскрывает |
|---|--------|------|----------------|
| 00 | Реестр документов | [`00-document-register.md`](./00-document-register.md) | Полный перечень всех документов, статус, владелец |
| 01 | Обзор продукта | [`01-product-overview.md`](./01-product-overview.md) | Что за продукт, ценность, границы системы |
| 02 | Архитектура | [`02-architecture.md`](./02-architecture.md) | Компоненты, потоки, стек, деплой-топология |
| 03 | Инвентарь модулей | [`03-module-inventory.md`](./03-module-inventory.md) | Все модули движка и страницы портала |
| 04 | Данные и приватность | [`04-data-flow-and-inventory.md`](./04-data-flow-and-inventory.md) | Какие данные входят, где хранятся, PII, потоки |
| 05 | Безопасность | [`05-security-surface.md`](./05-security-surface.md) | Аутентификация, секреты, поверхность атаки |
| 06 | Субпроцессоры | [`06-third-parties-and-subprocessors.md`](./06-third-parties-and-subprocessors.md) | Внешние сервисы, что им уходит, лицензии |
| 07 | Инфраструктура и ops | [`07-infrastructure-and-deployment.md`](./07-infrastructure-and-deployment.md) | Деплой, окружения, конфиги, мониторинг |
| 08 | QA и тестирование | [`08-qa-and-testing.md`](./08-qa-and-testing.md) | Тесты, типизация, верификация выводов (честные пробелы) |
| 09 | Методология и IP | [`09-methodology-and-ip.md`](./09-methodology-and-ip.md) | Ядро продукта: T1–T4, блоки, честность данных |
| 10 | Клиентский процесс | [`10-client-lifecycle-processes.md`](./10-client-lifecycle-processes.md) | Продажа → онбординг → доступы → аудит → выдача |
| 11 | GDPR / приватность | [`11-data-privacy-gdpr.md`](./11-data-privacy-gdpr.md) | RoPA, DPA, ретеншн, права субъектов |
| 12 | Юридическое | [`12-legal-compliance.md`](./12-legal-compliance.md) | Договоры, юрлица, IP, лицензии |
| 13 | Коммерция и финансы | [`13-commercial-financial.md`](./13-commercial-financial.md) | Модель, юнит-экономика, финотчётность |
| 14 | Организация и люди | [`14-organization-people.md`](./14-organization-people.md) | Роли, подрядчики, знания, доступы сотрудников |
| 15 | Реестр рисков | [`15-risk-register.md`](./15-risk-register.md) | Известные риски и статус митигации |
| 16 | Дорожная карта | [`16-roadmap-change-management.md`](./16-roadmap-change-management.md) | Планы, управление изменениями, версии |
| 17 | Логистика аудита | [`17-auditor-access-and-logistics.md`](./17-auditor-access-and-logistics.md) | Как дать аудитору доступ, NDA, скоуп, сроки |

### Слой глубины v2 — Evidence · Validation · Governance · Measurement

По итогам внешней оценки (7,8/10) добавлен сквозной слой: не новые темы, а **доказательность,
воспроизводимость, управляемость и измеримость** существующих. Часть — реализована в коде.

| # | Раздел | Файл | Слой |
|---|--------|------|------|
| 18 | Audit Run Record | [`18-audit-run-record.md`](./18-audit-run-record.md) | ✅ код: воспроизводимость прогона |
| 19 | Evidence Matrix | [`19-evidence-matrix.md`](./19-evidence-matrix.md) | Evidence: утверждение→доказательство→проверка |
| 20 | Quality & Validity Framework | [`20-audit-quality-and-validity-framework.md`](./20-audit-quality-and-validity-framework.md) | Measurement: Audit Reliability Score |
| 21 | Golden Dataset & Regression | [`21-golden-dataset-and-regression.md`](./21-golden-dataset-and-regression.md) | ✅ код: regression |
| 22 | AI Output Evaluation | [`22-ai-output-evaluation-framework.md`](./22-ai-output-evaluation-framework.md) | Validation: против галлюцинаций |
| 23 | Security Evidence Pack | [`23-security-evidence-pack.md`](./23-security-evidence-pack.md) | ✅ реальный npm audit |
| 24 | Incident Response Plan | [`24-incident-response-plan.md`](./24-incident-response-plan.md) | Governance: SEV, рантбук |
| 25 | Backup / Restore / BCDR | [`25-backup-restore-and-bcdr.md`](./25-backup-restore-and-bcdr.md) | Governance: RPO/RTO |
| 26 | GDPR Operational Pack | [`26-gdpr-operational-pack.md`](./26-gdpr-operational-pack.md) | Governance: RoPA/DPA/DSAR/breach |
| 27 | Access Matrix | [`27-employee-and-contractor-access-matrix.md`](./27-employee-and-contractor-access-matrix.md) | Governance: least-privilege |
| 28 | Benchmark Register | [`28-benchmark-register.md`](./28-benchmark-register.md) | Validation: почему «хорошо» |
| 29 | Methodology Governance & Change Control | [`29-methodology-governance-and-change-control.md`](./29-methodology-governance-and-change-control.md) | Governance |
| 30 | Audit Trail | [`30-audit-trail.md`](./30-audit-trail.md) | Governance |
| 31 | Separation of Duties | [`31-separation-of-duties.md`](./31-separation-of-duties.md) | Governance: producer/reviewer/approver |
| 32 | Unit Economics — Cost per Audit | [`32-unit-economics-cost-per-audit.md`](./32-unit-economics-cost-per-audit.md) | Measurement: экономика |
| 33 | Product KPI Framework | [`33-product-kpi-framework.md`](./33-product-kpi-framework.md) | Measurement |
| 34 | Open Questions & Owner Register | [`34-open-questions-and-owner-register.md`](./34-open-questions-and-owner-register.md) | журнал P0/P1 |
| 35 | Industry Landscape & Learning Sources | [`35-industry-landscape-and-learning-sources.md`](./35-industry-landscape-and-learning-sources.md) | ресёрч: конкуренты + кого читать |

---

## Статусы документов

| Статус | Значение |
|--------|----------|
| ✅ Готово | Документ подготовлен и заземлён на фактах кода/процессов |
| 📝 Черновик | Есть каркас/скелет, требует заполнения владельцем |
| ⛔ Нужно подготовить | Документ отсутствует; описано, что должно быть внутри и кто владелец |

**Принцип честности.** Data room не приукрашивает. Там, где чего-то нет (тесты, CI,
подписанные DPA), это помечено явно как пробел с указанием, что и кому нужно
подготовить. Внешний аудитор должен видеть реальную картину, а не витрину.

---

## Границы (что входит в периметр аудита)

**В периметре:**
- Кодовая база: `worker/` (движок аудита) и `portal/` (клиентский портал).
- Данные: краул-данные сайтов клиентов, ответы опросника, статусы доступов,
  загруженные файлы (выгрузки заказов/товаров), метаданные.
- Внешние сервисы (субпроцессоры): Anthropic (Claude API), Supabase, хостинг.
- Процессы: жизненный цикл клиента, обработка доступов, производство и выдача
  отчётов, обращение с данными.
- Методология и IP: логика аудита T1–T4, реестры вопросов/доступов, Master Audit
  System.

**Вне периметра (или отмечено как пробел):**
- Юридические, финансовые, HR-документы компании — предоставляются владельцами
  (см. разделы 12–14; здесь даны шаблоны и перечень).

---

## Точка входа для аудитора

1. Прочитать этот README и `00-document-register.md`.
2. Разделы 01–09 — техническая часть (заземлена на коде).
3. Разделы 10–16 — процессы и бизнес.
4. Раздел 17 — как получить доступы к системам для живой проверки.

*Подготовлено как версионируемая часть репозитория, чтобы отражать актуальное
состояние системы на момент коммита.*
