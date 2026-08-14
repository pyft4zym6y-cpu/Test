// Портал использует обычный CSS (src/styles.css) без PostCSS-плагинов.
// Пустой конфиг нужен, чтобы Vite не поднимался к postcss.config.js лендинга
// в корне монорепозитория (там подключён tailwindcss, которого у портала нет).
export default { plugins: {} };
