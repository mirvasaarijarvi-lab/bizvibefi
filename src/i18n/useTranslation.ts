import { useContext } from "react";
import { TranslationContext } from "./TranslationContext";

export const useTranslation = () => {
  const ctx = useContext(TranslationContext);
  if (!ctx) throw new Error("useTranslation must be used within TranslationProvider");
  return ctx;
};
