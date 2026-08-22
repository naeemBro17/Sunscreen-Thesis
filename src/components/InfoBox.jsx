import { useContext } from "react";
import { AppContext } from "../context/AppContext";

function InfoBox({ section }) {
  const { t } = useContext(AppContext);
  const head = t[`${section}.head`];
  const body = t[`${section}.body`];
  const cite = t[`${section}.cite`];

  if (!body) return null;

  return (
    <div className="info-box">
      {head && <div className="info-box-head">{head}</div>}
      <p className="info-box-body">{body}</p>
      {cite && <div className="info-box-cite">{cite}</div>}
    </div>
  );
}

export default InfoBox;
