// Локальный конфиг подпапки: перекрывает корневой postcss.config.js (там Tailwind,
// которого в этом приложении нет). Здесь — только autoprefixer (для -webkit-backdrop-filter и пр.).
export default {
  plugins: {
    autoprefixer: {},
  },
};
