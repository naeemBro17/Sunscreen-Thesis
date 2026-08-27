import { useContext, useEffect, useState } from "react";
import { AppContext } from "../context/AppContext";

const TOC_ENTRIES = [
  { id: "s1", key: "toc.1" },
  { id: "s2", key: "toc.2" },
  { id: "s3", key: "toc.3" },
  { id: "s4", key: "toc.4" },
  { id: "s4b", key: "toc.realworld" },
  { id: "s5", key: "toc.5" },
  { id: "s6", key: "toc.6" },
  { id: "s7", key: "toc.7" },
  { id: "s8", key: "toc.8" },
];

function Toc() {
  const { t } = useContext(AppContext);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(TOC_ENTRIES[0].id);

  useEffect(() => {
    const ids = TOC_ENTRIES.map(({ id }) => id);
    const els = ids.map((id) => document.getElementById(id)).filter(Boolean);
    if (els.length === 0) return undefined;

    // Highlight whichever section currently occupies the most vertical space in
    // the viewport. Tracking every section's visible height (rather than acting
    // on the last intersecting entry) keeps short sections like s4b reliably
    // highlighted instead of losing out to the taller section below them.
    const visibleHeight = new Map();
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRect.height > 0) {
            visibleHeight.set(entry.target.id, entry.intersectionRect.height);
          } else {
            visibleHeight.delete(entry.target.id);
          }
        });
        let current = null;
        let currentHeight = 0;
        ids.forEach((id) => {
          const h = visibleHeight.get(id) ?? 0;
          if (h > currentHeight) {
            current = id;
            currentHeight = h;
          }
        });
        if (current) setActive(current);
      },
      { threshold: Array.from({ length: 21 }, (_, i) => i / 20) }
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
          {TOC_ENTRIES.map(({ id, key }) => {
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
                  {t[key]}
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
