import en from "./en";
import fi from "./fi";
import sv from "./sv";
import type { Language } from "./TranslationContext";

export const translations: Record<Language, Record<string, unknown>> = { en, fi, sv };
