import { useContext, useEffect, useState } from "react";
import { AppContext } from "../context/AppContext";

const SECTION_IDS = ["s1", "s2", "s3", "s4", "s5", "s6", "s7", "s8"];

function Toc() {
  const { t } = useContext(AppContext);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(SECTION_IDS[0]);

  useEffect(() => {
    const els = SECTION_IDS.map((id) => document.getElementById(id)).filter(Boolean);
    if (els.length === 0) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id);
        });
      },
      { threshold: 0.2 }
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    function onKey(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  function handleSelect(id) {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    setOpen(false);
  }

  return (
    <>
      <button
        type="button"
        className="toc-toggle"
        aria-label={t["toc.label"]}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <span className={`toc-toggle-bar${open ? " open" : ""}`} />
      </button>

      {open && <div className="toc-backdrop" onClick={() => setOpen(false)} />}

      <nav className={`toc-panel${open ? " open" : ""}`} aria-hidden={!open}>
        <div className="toc-panel-label">{t["toc.label"]}</div>
        <ul className="toc-list">
          {SECTION_IDS.map((id, i) => {
            const isActive = active === id;
            return (
              <li key={id} className={`toc-item${isActive ? " active" : ""}`}>
                <a
                  href={`#${id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    handleSelect(id);
                  }}
                >
                  {t[`toc.${i + 1}`]}
                </a>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}

export default Toc;
