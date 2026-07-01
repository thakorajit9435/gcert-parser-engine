import i18n from 'i18next';
import {initReactI18next} from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

import en from './en.json';
import gu from './gu.json';

import {logAnalyticsEvent} from '../services/analytics';

const LANGUAGE_KEY = 'appLanguage';

const languageDetectorPlugin = {
  type: 'languageDetector',
  async: true,
  init: () => {},
  detect: async (callback: (lang: string) => void) => {
    try {
      const language = await AsyncStorage.getItem(LANGUAGE_KEY);
      if (language) {
        return callback(language);
      } else {
        return callback('gu');
      }
    } catch (error) {
      console.log('Error reading language', error);
      return callback('gu');
    }
  },
  cacheUserLanguage: async (language: string) => {
    try {
      await AsyncStorage.setItem(LANGUAGE_KEY, language);
      logAnalyticsEvent('language_change', {language});
    } catch (error) {
      console.log('Error saving language', error);
    }
  },
};

i18n
  .use(initReactI18next)
  .use(languageDetectorPlugin as any)
  .init({
    resources: {
      en: {
        translation: en,
      },
      gu: {
        translation: gu,
      },
    },
    fallbackLng: 'gu',
    interpolation: {
      escapeValue: false,
    },
    compatibilityJSON: 'v4',
  });

export default i18n;
