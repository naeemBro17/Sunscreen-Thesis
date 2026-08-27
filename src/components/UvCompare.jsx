import { useContext } from "react";
import { AppContext } from "../context/AppContext";

function UvCompare({ section }) {
  const { t } = useContext(AppContext);
  const label = t[`${section}.label`];

  return (
    <div className="uv-compare">
      {label && <div className="uv-compare-label">{label}</div>}
      <div className="uv-compare-grid">
        <div className="uv-compare-card uv-compare-card--uvb">
          <div className="uv-compare-tag">UVB</div>
          <h4 className="uv-compare-name">{t[`${section}.b.name`]}</h4>
          <ul className="uv-compare-list" dangerouslySetInnerHTML={{ __html: t[`${section}.b.list`] }} />
          <div className="uv-compare-reach">{t[`${section}.b.reach`]}</div>
        </div>
        <div className="uv-compare-card uv-compare-card--uva">
          <div className="uv-compare-tag">UVA</div>
          <h4 className="uv-compare-name">{t[`${section}.a.name`]}</h4>
          <ul className="uv-compare-list" dangerouslySetInnerHTML={{ __html: t[`${section}.a.list`] }} />
          <div className="uv-compare-reach">{t[`${section}.a.reach`]}</div>
        </div>
      </div>
      {t[`${section}.note`] && <p className="uv-compare-note">{t[`${section}.note`]}</p>}
    </div>
  );
}

export default UvCompare;
