import { createContext } from "react";

export type Language = "en" | "fi" | "sv";

export type TranslationContextType = {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string) => string;
};

export const TranslationContext = createContext<TranslationContextType | null>(null);
