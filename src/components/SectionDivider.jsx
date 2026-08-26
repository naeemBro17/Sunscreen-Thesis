import { useContext } from "react";
import { AppContext } from "../context/AppContext";
import { SECTION_META } from "../content/sectionMeta";

function SectionDivider({ section }) {
  const { t } = useContext(AppContext);
  const meta = SECTION_META[section];
  if (!meta) return null;
  const label = meta.tocKey ? t[meta.tocKey] : t[meta.eyebrowKey];

  return (
    <div className="section-divider">
      <span className="section-divider-num">{meta.number}</span>
      <span className="section-divider-name">{label}</span>
    </div>
  );
}

export default SectionDivider;
