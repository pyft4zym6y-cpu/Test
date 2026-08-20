import { Link } from 'react-router-dom';
import { useT, useLp } from '@/i18n';
import './system.css';

/**
 * «Ваша роль — ваш результат» (ТЗ §8). Одна система — але комунікація під
 * кожного ЛПР: власник/CEO, комерційний директор, маркетинг/CMO, керівник
 * e-commerce. Кожна картка: що турбує роль → що вона отримує → на чому фокус.
 * Знімає розрив «сайт говорить в середньому до всіх».
 */
type Role = { key: string; role: string; worry: string; get: string; focus: string[] };

export function AudienceByRole() {
  const t = useT();
  const lp = useLp();

  const ROLES: Role[] = [
    {
      key: 'owner', role: t('Власник / CEO', 'Owner / CEO'),
      worry: t('Бізнес тримається на мені — я і є вузьке місце.', "The business rests on me — I'm the bottleneck."),
      get: t('Система, що працює без вас: власник у кожної частини, метрики й регулярний цикл. Independence Score як KPI передачі.', 'A system that runs without you: an owner for every part, metrics and a regular cycle. Independence Score as the handover KPI.'),
      focus: [t('Незалежність', 'Independence'), t('Модель росту', 'Growth model'), t('Governance', 'Governance')],
    },
    {
      key: 'commercial', role: t('Комерційний директор', 'Commercial Director'),
      worry: t('Оборот є, а прибутку — ні.', "Revenue is there, profit isn't."),
      get: t('Керована економіка продажів: конверсія, чек, повторні, маржа й contribution — рішення за юніт-економікою, а не за оборотом.', 'Managed sales economics: conversion, average order, repeat purchases, margin and contribution — decisions driven by unit economics, not by revenue.'),
      focus: [t('Маржа', 'Margin'), t('LTV', 'LTV'), t('Contribution', 'Contribution')],
    },
    {
      key: 'cmo', role: t('Маркетинг / CMO', 'Marketing / CMO'),
      worry: t('Усе тримається на платному трафіку, а CAC росте.', 'Everything rests on paid traffic, and CAC keeps rising.'),
      get: t('Органіка, retention і бренд замість залежності від реклами: CRM-контур, повертаність, зростання LTV.', 'Organic, retention and brand instead of dependence on ads: a CRM loop, repeat rate, growing LTV.'),
      focus: [t('CAC', 'CAC'), t('Retention', 'Retention'), t('Органіка', 'Organic')],
    },
    {
      key: 'ecom', role: t('Керівник e-commerce', 'Head of E-commerce'),
      worry: t('Вітрина не конвертує, дані розходяться, усе вручну.', "The storefront doesn't convert, data disagrees, everything is manual."),
      get: t('Робоча вітрина й єдині дані: CRO, наскрізна аналітика (GA4 / P&L), інтеграції та операції без ручного режиму.', 'A working storefront and unified data: CRO, end-to-end analytics (GA4 / P&L), integrations and operations without manual work.'),
      focus: [t('Конверсія', 'Conversion'), t('Дані', 'Data'), t('Операції', 'Operations')],
    },
  ];

  return (
    <section className="abr sysx" aria-label={t('Ваша роль — ваш результат', 'Your role — your result')}>
      <div className="abr-in">
        <div className="abr-head">
          <span className="sysx-kick">{t('Кому це · за роллю', 'Who it’s for · by role')}</span>
          <h2 className="sysx-display abr-h">{t('Одна система —', 'One system —')}<br /><span className="sysx-em">{t('різні виграші', 'different wins')}</span></h2>
          <p className="abr-lead">{t('Ми говоримо мовою кожного ЛПР. У кожної ролі свій біль і свій результат від однієї побудованої системи.', 'We speak the language of every decision-maker. Each role has its own pain and its own result from one system, once built.')}</p>
        </div>

        <div className="abr-grid">
          {ROLES.map((r) => (
            <article key={r.key} className="abr-card">
              <span className="abr-role mono">{r.role}</span>
              <p className="abr-worry">«{r.worry}»</p>
              <p className="abr-get">{r.get}</p>
              <div className="abr-focus">{r.focus.map((f) => <span key={f} className="abr-chip">{f}</span>)}</div>
            </article>
          ))}
        </div>

        <div className="abr-cta">
          <span className="abr-cta-note mono">{t('Ваша роль тут є? Діагностика покаже виграш саме під вас — за 5 хвилин.', 'Is your role here? Diagnostics will show the win tailored to you — in 5 minutes.')}</span>
          <Link to={lp('/diagnose')} className="sysx-cta is-primary">{t('Побачити мій виграш →', 'See my win →')}</Link>
        </div>
      </div>
    </section>
  );
}
