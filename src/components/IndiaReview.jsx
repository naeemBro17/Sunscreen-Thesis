import { useContext } from "react";
import { AppContext } from "../context/AppContext";

const ROWS = [1, 2, 3];

function IndiaReview({ section }) {
  const { t } = useContext(AppContext);
  const rows = ROWS.filter((n) => t[`${section}.r${n}.label`]);

  return (
    <div className="india-review">
      <div className="india-review-eyebrow">{t[`${section}.eyebrow`]}</div>
      <h3 className="india-review-title">{t[`${section}.title`]}</h3>
      <p className="india-review-lead">{t[`${section}.lead`]}</p>
      <div className="india-review-rows">
        {rows.map((n) => (
          <div className="india-review-row" key={n}>
            <div className="india-review-row-label">{t[`${section}.r${n}.label`]}</div>
            <p className="india-review-row-text">{t[`${section}.r${n}.text`]}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default IndiaReview;
