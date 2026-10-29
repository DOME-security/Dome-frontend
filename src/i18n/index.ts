import { en, type Messages } from './en';

// One locale today. Adding one: create src/i18n/<locale>.ts typed as Messages,
// translate src/content/guides/<locale>/*.md, and choose it here.
export const locale = 'en';
export const m: Messages = en;
export type { Messages };
