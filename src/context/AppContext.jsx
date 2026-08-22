import { createContext, useEffect, useState } from "react";
import contentBn from "../content/content-bn";
import contentEn from "../content/content-en";

export const AppContext = createContext();

const CONTENT_BY_LANG = { bn: contentBn, en: contentEn };

export function AppProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem("lang") || "bn");
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "dark");
  const t = CONTENT_BY_LANG[lang];

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("lang", lang);
  }, [lang]);

  return (
    <AppContext.Provider value={{ lang, setLang, theme, setTheme, t }}>
      {children}
    </AppContext.Provider>
  );
}
