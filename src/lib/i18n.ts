'use client';

import { createContext, useContext, useState, useEffect, createElement } from 'react';
import type { ReactNode } from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────
export type Locale = 'es' | 'en';

// ── Simple nested-key resolver with {var} interpolation ──────────────────────
function resolve(obj: Record<string, unknown>, key: string): string {
  const parts = key.split('.');
  let cur: unknown = obj;
  for (const p of parts) {
    if (cur && typeof cur === 'object') cur = (cur as Record<string, unknown>)[p];
    else return key;
  }
  return typeof cur === 'string' ? cur : key;
}

export function interpolate(
  str: string,
  vars?: Record<string, string | number>,
): string {
  if (!vars) return str;
  return Object.entries(vars).reduce(
    (s, [k, v]) => s.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v)),
    str,
  );
}

// ── Context ───────────────────────────────────────────────────────────────────
interface LangContextType {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

const LangContext = createContext<LangContextType>({
  locale: 'es',
  setLocale: () => {},
  t: (key) => key,
});

// ── Provider ─────────────────────────────────────────────────────────────────
export function LangProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('es');
  const [messages, setMessages] = useState<Record<string, unknown>>({});

  // Load locale file + apply saved preference
  useEffect(() => {
    const saved = localStorage.getItem('garmin_lang') as Locale | null;
    const detected = navigator.language.startsWith('es') ? 'es' : 'en';
    const lang: Locale = saved === 'en' || saved === 'es' ? saved : detected;
    setLocaleState(lang);
  }, []);

  useEffect(() => {
    import(`@/locales/${locale}`)
      .then((mod) => setMessages(mod.default))
      .catch(() => {});
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = (l: Locale) => {
    setLocaleState(l);
    localStorage.setItem('garmin_lang', l);
  };

  const t = (key: string, vars?: Record<string, string | number>) =>
    interpolate(resolve(messages, key) || key, vars);

  return createElement(LangContext.Provider, { value: { locale, setLocale, t } }, children);
}

// ── Hook ─────────────────────────────────────────────────────────────────────
export function useLang() {
  return useContext(LangContext);
}
