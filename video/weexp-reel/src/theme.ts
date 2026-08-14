// theme.ts — єдине джерело правди бренду WEEXP (поточний бренд).
// Темна база ink, коралловий акцент (Marker, максимум один у кадрі), смарагд — «система».
import { Easing } from "remotion";
import "@fontsource/unbounded/latin-700.css";
import "@fontsource/unbounded/latin-800.css";
import "@fontsource/unbounded/latin-ext-800.css";
import "@fontsource/unbounded/cyrillic-700.css";
import "@fontsource/unbounded/cyrillic-800.css";
import "@fontsource/manrope/latin-400.css";
import "@fontsource/manrope/latin-500.css";
import "@fontsource/manrope/latin-700.css";
import "@fontsource/manrope/cyrillic-400.css";
import "@fontsource/manrope/cyrillic-500.css";
import "@fontsource/manrope/cyrillic-700.css";

export const theme = {
  colors: {
    bg: "#0A1218",
    bgAlt: "#0F1A21",
    coral: "#D6362B",      // ГЕРОЙ-акцент — максимум один елемент у кадрі
    coralDeep: "#9E2A22",
    coralSoft: "#F08379",
    verd: "#6FAA9A",       // «система / результат»
    verdMid: "#3A8873",
    verdDeep: "#1F5648",
    text: "#E7EAE7",
    textDim: "#94A0A8",
  },
  fonts: {
    display: "'Unbounded', 'Arial Black', system-ui, sans-serif",
    body: "'Manrope', system-ui, sans-serif",
  },
  ease: {
    out: Easing.bezier(0.16, 1, 0.3, 1),
    inOut: Easing.bezier(0.83, 0, 0.17, 1),
    in: Easing.bezier(0.7, 0, 0.84, 0),
  },
  spring: {
    snappy: { damping: 14, stiffness: 160, mass: 0.6 },
    smooth: { damping: 20, stiffness: 90, mass: 1 },
    bouncy: { damping: 11, stiffness: 170, mass: 0.7 },
  },
} as const;
