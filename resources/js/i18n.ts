import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enTranslations from '../lang/en.json';

const getInitialLang = () => {
  try {
    const el = document.getElementById('app');
    if (el && el.dataset.page) {
      const initialPage = JSON.parse(el.dataset.page);
      return initialPage.props?.auth?.lang || initialPage.props?.auth?.user?.lang || 'en';
    }
  } catch (e) {
    // fallback
  }
  return 'en';
};

const userLang = getInitialLang();

i18n
  .use(initReactI18next)
  .init({
    lng: userLang,
    fallbackLng: 'en',
    resources: {
      en: {
        translation: enTranslations,
      },
    },
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
