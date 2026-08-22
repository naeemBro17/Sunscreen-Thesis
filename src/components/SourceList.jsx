import { useContext } from "react";
import { AppContext } from "../context/AppContext";

function SourceList({ section }) {
  const { t } = useContext(AppContext);
  const sources = [];
  for (let n = 1; t[`${section}.src${n}`]; n += 1) {
    sources.push({ n, text: t[`${section}.src${n}`] });
  }

  if (sources.length === 0) return null;

  return (
    <ol className="source-list">
      {sources.map((s) => (
        <li className="source-list-item" key={s.n}>
          <span className="source-list-num">{String(s.n).padStart(2, "0")}</span>
          <span className="source-list-text">{s.text}</span>
        </li>
      ))}
    </ol>
  );
}

export default SourceList;
