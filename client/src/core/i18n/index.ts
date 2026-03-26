import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Namespaces: cada feature tiene su propio archivo de traducciones
import esCommon from './locales/es/common.json';
import esCatalog from './locales/es/catalog.json';
import esOrders from './locales/es/orders.json';
import esAuth from './locales/es/auth.json';
import esAdmin from './locales/es/admin.json';

export const defaultNS = 'common';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    lng: 'es',                    // Idioma por defecto
    fallbackLng: 'es',
    defaultNS,
    ns: ['common', 'catalog', 'orders', 'auth', 'admin'],
    resources: {
      es: {
        common:  esCommon,
        catalog: esCatalog,
        orders:  esOrders,
        auth:    esAuth,
        admin:   esAdmin,
      },
    },
    interpolation: {
      escapeValue: false,         // React ya escapa el HTML
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

export default i18n;
