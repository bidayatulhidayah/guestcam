import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './en.json';
import ms from './ms.json';

export const LANGUAGES = ['ms', 'en'] as const;
export type AppLanguage = (typeof LANGUAGES)[number];

/** Bahasa Melayu is the default; no language-choice screen (D-004). */
export const DEFAULT_LANGUAGE: AppLanguage = 'ms';

const STORAGE_KEY = 'guestcam.language';

function readSavedLanguage(): AppLanguage {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === 'en' || saved === 'ms' ? saved : DEFAULT_LANGUAGE;
  } catch {
    return DEFAULT_LANGUAGE;
  }
}

export function otherLanguage(language: string): AppLanguage {
  return language === 'en' ? 'ms' : 'en';
}

export async function setLanguage(language: AppLanguage): Promise<void> {
  try {
    localStorage.setItem(STORAGE_KEY, language);
  } catch {
    // Private mode or storage blocked: the choice lasts for this visit only.
  }
  await i18n.changeLanguage(language);
}

void i18n.use(initReactI18next).init({
  resources: { ms: { translation: ms }, en: { translation: en } },
  lng: readSavedLanguage(),
  fallbackLng: DEFAULT_LANGUAGE,
  supportedLngs: LANGUAGES,
  interpolation: { escapeValue: false },
  returnNull: false,
});

i18n.on('languageChanged', (language) => {
  document.documentElement.lang = language;
});
document.documentElement.lang = i18n.language;

export default i18n;
