import { useContext } from "react";
import { AppContext } from "../context/AppContext";

function Footer() {
  const { t } = useContext(AppContext);

  return (
    <footer className="footer">
      <div className="footer-line footer-brand">{t["foot.brand"]}</div>
      <div className="footer-line footer-byline">
        {t["hero.byline.name"]} · {t["foot.metaYear"]} · {t["hero.byline.stat2"]}
      </div>
      {t["foot.tag"] && <div className="footer-line footer-tag">{t["foot.tag"]}</div>}
      {t["foot.disc"] && (
        <div className="footer-line footer-disc">
          {t["foot.discLabel"] && <span className="footer-disc-label">{t["foot.discLabel"]}: </span>}
          {t["foot.disc"]}
        </div>
      )}
    </footer>
  );
}

export default Footer;
