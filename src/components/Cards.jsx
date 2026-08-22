import { useContext } from "react";
import { AppContext } from "../context/AppContext";

function Cards({ section, count }) {
  const { t } = useContext(AppContext);
  const cards = Array.from({ length: count }, (_, i) => i + 1).filter(
    (n) => t[`${section}.card${n}.title`]
  );

  if (cards.length === 0) return null;

  return (
    <div className="card-list">
      {cards.map((n) => (
        <div className="card-item" key={n}>
          <h3 className="card-item-title">{t[`${section}.card${n}.title`]}</h3>
          <p className="card-item-text">{t[`${section}.card${n}.text`]}</p>
          {t[`${section}.card${n}.foot`] && (
            <div className="card-item-foot">{t[`${section}.card${n}.foot`]}</div>
          )}
        </div>
      ))}
    </div>
  );
}

export default Cards;
