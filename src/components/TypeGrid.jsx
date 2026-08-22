import { useContext } from "react";
import { AppContext } from "../context/AppContext";

const TAG_KEYS = ["t1", "t2", "t3"];

function TypeGrid({ section, count }) {
  const { t } = useContext(AppContext);
  const items = Array.from({ length: count }, (_, i) => i + 1).filter(
    (n) => t[`${section}.w${n}.name`]
  );

  return (
    <div className="type-grid">
      {items.map((n) => {
        const key = `${section}.w${n}`;
        const ribbon = t[`${key}.ribbon`];
        const tags = TAG_KEYS.map((tag) => t[`${key}.${tag}`]).filter(Boolean);
        return (
          <div className={`type-card${ribbon ? " type-card-featured" : ""}`} key={n}>
            {ribbon && <div className="type-card-ribbon">{ribbon}</div>}
            <div className="type-card-tier">{t[`${key}.tier`]}</div>
            <h3 className="type-card-name">{t[`${key}.name`]}</h3>
            <div className="type-card-scope">{t[`${key}.scope`]}</div>
            <p className="type-card-reason">{t[`${key}.reason`]}</p>
            {tags.length > 0 && (
              <div className="type-card-tags">
                {tags.map((tag) => (
                  <span className="type-card-tag" key={tag}>{tag}</span>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default TypeGrid;
