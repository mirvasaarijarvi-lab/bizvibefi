import { createContext, useContext, useState, ReactNode } from "react";

export type Language = "en" | "fi" | "sv";

type TranslationContextType = {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string) => string;
};

const TranslationContext = createContext<TranslationContextType | null>(null);

export const useTranslation = () => {
  const ctx = useContext(TranslationContext);
  if (!ctx) throw new Error("useTranslation must be used within TranslationProvider");
  return ctx;
};

const getNestedValue = (obj: Record<string, any>, path: string): string => {
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
  translations: Record<Language, Record<string, any>>;
}) => {
  const [lang, setLang] = useState<Language>("en");

  const t = (key: string) => getNestedValue(translations[lang], key);

  return (
    <TranslationContext.Provider value={{ lang, setLang, t }}>
      {children}
    </TranslationContext.Provider>
  );
};
