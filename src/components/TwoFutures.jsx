import { useContext, useState } from "react";
import { AppContext } from "../context/AppContext";
import SectionDivider from "./SectionDivider";
import SwipeChart from "./SwipeChart";

const SECTION = "s4b";

function Assumptions({ t }) {
  const items = [];
  for (let n = 1; t[`${SECTION}.assumptions.item${n}`]; n += 1) {
    items.push(t[`${SECTION}.assumptions.item${n}`]);
  }
  return (
    <div className="tf-assumptions">
      <h3>{t[`${SECTION}.assumptions.title`]}</h3>
      <ul>
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function Sources({ t }) {
  const sources = [];
  for (let n = 1; t[`${SECTION}.src${n}`]; n += 1) {
    sources.push({ n, text: t[`${SECTION}.src${n}`] });
  }
  return (
    <div className="tf-sources">
      {sources.map((s) => (
        <div key={s.n}>
          [{s.n}] {s.text}
        </div>
      ))}
    </div>
  );
}

function TwoFutures() {
  const { t } = useContext(AppContext);
  const [open, setOpen] = useState(false);

  return (
    <section className="chapter two-futures" id="s4b">
      <SectionDivider section="s4b" />

      <button
        type="button"
        className={`tf-toggle${open ? " open" : ""}`}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <span>{t[`${SECTION}.button`]}</span>
        <span className="tf-toggle-arrow">▾</span>
      </button>

      <div className={`tf-panel${open ? " open" : ""}`}>
        <div className="tf-panel-inner">
          {open && (
            <>
              <SwipeChart />
              <Assumptions t={t} />
              <div className="tf-disclaimer">{t[`${SECTION}.disclaimer`]}</div>
              <Sources t={t} />
            </>
          )}
        </div>
      </div>
    </section>
  );
}

export default TwoFutures;
