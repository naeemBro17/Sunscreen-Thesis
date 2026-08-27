import { useContext, useState } from "react";
import { motion } from "framer-motion";
import { AppContext } from "../context/AppContext";
import SectionDivider, { sectionDividerHasName } from "./SectionDivider";

const BN_DIGITS = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
const TEST_NUMS = [1, 2, 3, 4];
const CONTRAST_ROWS = [1, 2, 3, 4];

function localizeDigits(value, lang) {
  if (lang !== "bn") return String(value);
  return String(value)
    .split("")
    .map((ch) => (ch >= "0" && ch <= "9" ? BN_DIGITS[ch.charCodeAt(0) - 48] : ch))
    .join("");
}

function renderTitle(title) {
  if (!title) return null;
  const dashSplit = title.split(/\s—\s/);
  if (dashSplit.length !== 2) return title;
  const [before, after] = dashSplit;
  const lastComma = after.lastIndexOf(",");
  if (lastComma === -1) return title;
  const mid = after.slice(0, lastComma + 1).trim();
  const last = after.slice(lastComma + 1).trim();
  return (
    <>
      {before} —<br />
      {mid}
      <br />
      <em>{last}</em>
    </>
  );
}

function AustraliaReport({ section }) {
  const { t, lang } = useContext(AppContext);
  const [openTests, setOpenTests] = useState(() => new Set());
  // The SectionDivider already renders the "Special Report" label for s8, so the
  // hardcoded eyebrow/kicker here would duplicate it above the title. Only show
  // the kicker when the divider is not already showing a name.
  const kickerRaw = t[`${section}.kicker`];
  const kicker = sectionDividerHasName(section) ? null : kickerRaw;

  const toggleTest = (n) => {
    setOpenTests((prev) => {
      const next = new Set(prev);
      if (next.has(n)) next.delete(n);
      else next.add(n);
      return next;
    });
  };

  return (
    <motion.section
      id={section}
      className="chapter chapter-s8"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-8%" }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
    >
      <SectionDivider section={section} />
      <div className="au-entry">
        {kicker && <div className="au-eyebrow">{kicker}</div>}
        <h1 className="au-title">{renderTitle(t[`${section}.title`])}</h1>
        <div className="au-body">
          <p>{t[`${section}.entry.p1`]}</p>
          <p>{t[`${section}.entry.p2`]}</p>
          <div className="au-legal-badge">{t[`${section}.legalBadge`]}</div>
        </div>
      </div>

      <div className="au-contrast">
        <div className="au-contrast-col">
          <div className="au-contrast-header">{t[`${section}.contrast.world.header`]}</div>
          {CONTRAST_ROWS.map((n) => (
            <div className="au-contrast-row" key={n}>
              <div className="au-contrast-label">{t[`${section}.contrast.row${n}.label`]}</div>
              <div className="au-contrast-val">{t[`${section}.contrast.row${n}.world`]}</div>
            </div>
          ))}
        </div>
        <div className="au-contrast-col au-contrast-col--au">
          <div className="au-contrast-header">{t[`${section}.contrast.au.header`]}</div>
          {CONTRAST_ROWS.map((n) => (
            <div className="au-contrast-row" key={n}>
              <div className="au-contrast-label">{t[`${section}.contrast.row${n}.label`]}</div>
              <div className="au-contrast-val au-contrast-val--highlight">
                {t[`${section}.contrast.row${n}.au`]}
              </div>
            </div>
          ))}
        </div>
      </div>

      <h2 className="au-tests-heading">{t[`${section}.tests.heading`]}</h2>
      <p className="au-tests-intro">{t[`${section}.tests.intro`]}</p>

      <div className="au-tests">
        {TEST_NUMS.map((n) => {
          const open = openTests.has(n);
          return (
            <div className={`au-test-item${open ? " open" : ""}`} key={n}>
              <button
                className="au-test-trigger"
                type="button"
                aria-expanded={open}
                onClick={() => toggleTest(n)}
              >
                <div className="au-test-num">{localizeDigits(n, lang)}</div>
                <div className="au-test-title-wrap">
                  <div className="au-test-title">{t[`${section}.test${n}.title`]}</div>
                  <div className="au-test-summary">{t[`${section}.test${n}.summary`]}</div>
                </div>
                <div className="au-test-arrow">▾</div>
              </button>
              <div className="au-test-body">
                <div className="au-test-body-inner">
                  <p>{t[`${section}.test${n}.body`]}</p>
                  {n === 2 && (
                    <div className="au-key-stat">
                      <div className="au-stat-number">{t[`${section}.test2.stat.number`]}</div>
                      <div className="au-stat-label">{t[`${section}.test2.stat.label`]}</div>
                      <div className="au-stat-compare">{t[`${section}.test2.stat.compare`]}</div>
                    </div>
                  )}
                  {n === 2 && <p className="au-test-closing">{t[`${section}.test2.closing`]}</p>}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="au-surveillance">
        <h3>{t[`${section}.surveillance.heading`]}</h3>
        <p>{t[`${section}.surveillance.body`]}</p>
        <div className="au-prohibited">
          <div>{t[`${section}.surveillance.prohibited.claims`]}</div>
          <div>{t[`${section}.surveillance.prohibited.note`]}</div>
        </div>
      </div>

      <div className="au-artg-box">
        <div className="au-artg-label">{t[`${section}.artg.label`]}</div>
        <div className="au-artg-number">{t[`${section}.artg.number`]}</div>
        <p className="au-artg-explain">{t[`${section}.artg.explain`]}</p>
        <a
          className="au-artg-link"
          href="https://www.tga.gov.au/resources/artg"
          target="_blank"
          rel="noopener noreferrer"
        >
          {t[`${section}.artg.link`]}
        </a>
      </div>

      <div className="au-cc-section">
        <h3>{t[`${section}.cc.heading`]}</h3>
        <p>{t[`${section}.cc.body`]}</p>
        <div className="au-cc-quote">{t[`${section}.cc.quote`]}</div>
      </div>

      <div className="au-usaaus">
        <h3>{t[`${section}.usaaus.heading`]}</h3>
        <div className="au-compare-grid">
          <div className="au-compare-card">
            <div className="au-compare-country">{t[`${section}.usaaus.us.header`]}</div>
            {[1, 2, 3].map((i) => (
              <div className="au-compare-item" key={i}>
                {t[`${section}.usaaus.us.item${i}`]}
              </div>
            ))}
          </div>
          <div className="au-compare-card au-compare-card--winner">
            <div className="au-compare-country">{t[`${section}.usaaus.au.header`]}</div>
            {[1, 2, 3].map((i) => (
              <div className="au-compare-item" key={i}>
                {t[`${section}.usaaus.au.item${i}`]}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="au-timeline">
        <h3>{t[`${section}.timeline.heading`]}</h3>
        {[1, 2, 3].map((i) => (
          <div className="au-tl-item" key={i}>
            <div className="au-tl-dot">{t[`${section}.timeline.item${i}.dot`]}</div>
            <div className="au-tl-content">
              <h4>{t[`${section}.timeline.item${i}.title`]}</h4>
              <p>{t[`${section}.timeline.item${i}.body`]}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="au-bottle-section">
        <h3>{t[`${section}.bottle.heading`]}</h3>
        <p>{t[`${section}.bottle.body`]}</p>
        <div className="au-bottle-closing">{t[`${section}.bottle.closing`]}</div>
      </div>

      <div className="au-citation">{t[`${section}.citation`]}</div>
    </motion.section>
  );
}

export default AustraliaReport;
