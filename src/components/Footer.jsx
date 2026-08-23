import { useContext } from "react";
import { AppContext } from "../context/AppContext";

function Footer() {
  const { t } = useContext(AppContext);

  return (
    <footer className="footer">
      <div className="footer-brand">SkinScience</div>
      <div className="footer-meta">Naeem Muhammad · 2026 · 100+ sources</div>
      {t["foot.tag"] && <p className="footer-tag">{t["foot.tag"]}</p>}
      {t["foot.disc"] && (
        <p className="footer-disc">
          {t["foot.discLabel"] && <span className="footer-disc-label">{t["foot.discLabel"]}: </span>}
          {t["foot.disc"]}
        </p>
      )}
    </footer>
  );
}

export default Footer;
