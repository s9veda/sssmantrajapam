import React, { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import { LOCALE_NAMES, SUPPORTED_LOCALES, t as translate, type Locale } from './translations';

export * from './translations';

const LOCALE_KEY = '@sssmantrajapam_locale';

function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

function deviceLocale(): Locale {
  for (const l of Localization.getLocales()) {
    if (isLocale(l.languageCode)) return l.languageCode;
  }
  return 'en';
}

// On web, /en, /es and /hi URLs are redirected by +middleware.ts to the bare path with a `lang` cookie.
function cookieLocale(): Locale | null {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|;\s*)lang=([^;]+)/);
  return match && isLocale(match[1]) ? match[1] : null;
}

interface LocaleContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
  locales: readonly Locale[];
  localeNames: Record<Locale, string>;
}

const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

export function LocaleProvider({ children }: { children: ReactNode }) {
  // Start with 'en' so server and first client render match, then resolve the real locale.
  const [locale, setLocaleState] = useState<Locale>('en');

  useEffect(() => {
    let active = true;
    (async () => {
      const fromCookie = cookieLocale();
      let resolved: Locale = fromCookie ?? deviceLocale();
      if (!fromCookie) {
        try {
          const stored = await AsyncStorage.getItem(LOCALE_KEY);
          if (isLocale(stored)) resolved = stored;
        } catch {
          // Fall back to the device locale.
        }
      }
      if (active) setLocaleState(resolved);
    })();
    return () => {
      active = false;
    };
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    AsyncStorage.setItem(LOCALE_KEY, next).catch(() => undefined);
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.cookie = `lang=${next}; path=/; max-age=31536000; SameSite=Lax`;
      document.documentElement.lang = next;
    }
  }, []);

  const value = useMemo<LocaleContextType>(
    () => ({
      locale,
      setLocale,
      t: (key: string) => translate(locale, key),
      locales: SUPPORTED_LOCALES,
      localeNames: LOCALE_NAMES,
    }),
    [locale, setLocale],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useTranslation() {
  const context = useContext(LocaleContext);
  if (!context) throw new Error('useTranslation must be used within a LocaleProvider');
  return context;
}
