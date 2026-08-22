import { useContext, useEffect, useState } from "react";
import { AppContext } from "../context/AppContext";

function Header() {
  const { lang, setLang, theme, setTheme } = useContext(AppContext);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 80);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`header ${scrolled ? "scrolled" : ""}`}>
      <div className="brand">
        <div>
          <span className="brand-serif">Skin</span>
          <span className="brand-reg">Science</span>
        </div>
        <div className="brand-sub">Research & Evidence</div>
      </div>

      <div className="header-right">
        <button
          className="lang-toggle"
          onClick={() => setLang((l) => (l === "bn" ? "en" : "bn"))}
          aria-label="Toggle language"
        >
          <span className={lang === "bn" ? "active" : ""}>বাং</span>
          <span className={lang === "en" ? "active" : ""}>EN</span>
        </button>
        <button
          className="theme-toggle"
          onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
          aria-label="Toggle theme"
        >
          {theme === "dark" ? "☀" : "☾"}
        </button>
      </div>
    </header>
  );
}

export default Header;
