import { useState, ReactNode } from "react";
import { TranslationContext, type Language } from "./TranslationContextDef";

const getNestedValue = (obj: Record<string, unknown>, path: string): string => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const val = path.split(".").reduce((acc: any, key: string) => {
    if (acc === undefined || acc === null) return undefined;
    const idx = Number(key);
    return !isNaN(idx) && Array.isArray(acc) ? acc[idx] : acc[key];
  }, obj);
  return typeof val === "string" ? val : path;
};

export const TranslationProvider = ({
  children,
  translations,
}: {
  children: ReactNode;
  translations: Record<Language, Record<string, unknown>>;
}) => {
  const [lang, setLang] = useState<Language>("en");

  const t = (key: string) => getNestedValue(translations[lang], key);

  return (
    <TranslationContext.Provider value={{ lang, setLang, t }}>
      {children}
    </TranslationContext.Provider>
  );
};
