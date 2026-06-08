"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import ru from "../locales/ru.json";
import tj from "../locales/tj.json";

type Language = "ru" | "tj";
type Translations = typeof ru; // assuming ru and tj have the same keys

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, variables?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

const dictionaries = {
  ru,
  tj,
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("ru");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const savedLang = localStorage.getItem("crm_lang") as Language;
    if (savedLang && (savedLang === "ru" || savedLang === "tj")) {
      setLanguageState(savedLang);
    }
    setMounted(true);
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("crm_lang", lang);
    document.documentElement.lang = lang; // update html lang attribute
  };

  const t = (key: string, variables?: Record<string, string | number>): string => {
    const keys = key.split(".");
    let value: any = dictionaries[language];

    for (const k of keys) {
      if (value === undefined || value === null) break;
      value = value[k];
    }

    if (value === undefined || value === null) {
      // Fallback to ru if key not found in tj
      let fallbackValue: any = dictionaries["ru"];
      for (const k of keys) {
        if (fallbackValue === undefined || fallbackValue === null) break;
        fallbackValue = fallbackValue[k];
      }
      value = fallbackValue;
    }

    if (typeof value !== "string") {
      return key; // return key if not found or not a string
    }

    if (variables) {
      return Object.entries(variables).reduce(
        (str, [varName, varValue]) => str.replace(new RegExp(`{{${varName}}}`, "g"), String(varValue)),
        value
      );
    }

    return value;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      <div
        style={{
          visibility: mounted ? "visible" : "hidden",
          display: "contents" // prevents the div from breaking CSS grid/flex layouts
        }}
      >
        {children}
      </div>
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useTranslation must be used within a LanguageProvider");
  }
  return context;
}
