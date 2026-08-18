/**
 * Сигнали довіри (ТЗ §6). Реальні дані — заповнює власник із підтвердженням.
 * ПОРОЖНІЙ масив = відповідний блок не показуємо (краще нічого, ніж вигадане).
 * НЕ додавати фейкових сертифікатів, логотипів клієнтів чи публікацій.
 */
export type Credential = { label: string; detail?: string; href?: string };

// Офіційні сертифікати / статуси партнера. Приклад: { label: 'Google Partner' }.
export const CERTIFICATIONS: Credential[] = [];

// Партнерства (платформи, агенції, вендори) з підтвердженим статусом.
export const PARTNERSHIPS: Credential[] = [];

// Публікації, виступи, згадки. Приклад: { label: 'Виступ на E-commerce Summit', href: 'https://…' }.
export const PUBLICATIONS: Credential[] = [];

// Платформи й інструменти, з якими будуємо (технологічний стек) — реальні, показуємо завжди.
export const PLATFORMS = [
  'Shopify', 'WooCommerce', 'PrestaShop', 'OpenCart', 'Magento', 'Odoo',
  'GA4', 'BigQuery', 'Allegro', 'Amazon',
];
