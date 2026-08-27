import { useContext } from "react";
import { AppContext } from "../context/AppContext";

function toParagraphs(text) {
  return String(text ?? "")
    .split(/\n\s*\n/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function InfoBox({ section }) {
  const { t } = useContext(AppContext);
  const head = t[`${section}.head`];
  const body = t[`${section}.body`];
  const cite = t[`${section}.cite`];

  const subs = [];
  for (let i = 1; t[`${section}.sub${i}.title`]; i += 1) {
    subs.push({
      num: t[`${section}.sub${i}.num`],
      title: t[`${section}.sub${i}.title`],
      body: t[`${section}.body${i}`],
    });
  }

  if (!body && subs.length === 0) return null;

  return (
    <div className="info-box">
      {head && <div className="info-box-head">{head}</div>}
      {subs.length > 0 ? (
        subs.map((sub, i) => (
          <div className={`info-box-sub${i > 0 ? " info-box-sub--spaced" : ""}`} key={i}>
            <div className="info-box-sub-head">
              <span className="info-box-sub-num">{sub.num}</span>
              <span className="info-box-sub-title">{sub.title}</span>
            </div>
            <div className="info-box-sub-rule" />
            {toParagraphs(sub.body).map((p, j) => (
              <p className="info-box-body" key={j}>
                {p}
              </p>
            ))}
          </div>
        ))
      ) : (
        <p className="info-box-body">{body}</p>
      )}
      {cite && <div className="info-box-cite">{cite}</div>}
    </div>
  );
}

export default InfoBox;
