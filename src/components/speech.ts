export const IDLE_PHRASE = 'Привіт! Я — ОС цієї компанії. Наведи на меню — підкажу, куди тобі →';

/** Any element can make the hero assistant "speak". */
export function say(text: string) {
  window.dispatchEvent(new CustomEvent('weexp-say', { detail: { text } }));
}

export function sayIdle() {
  window.dispatchEvent(new CustomEvent('weexp-idle'));
}
