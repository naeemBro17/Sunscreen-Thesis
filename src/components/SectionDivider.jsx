import { useContext } from "react";
import { AppContext } from "../context/AppContext";
import { SECTION_META } from "../content/sectionMeta";

export function getSectionDividerLabel(section, t) {
  const meta = SECTION_META[section];
  if (!meta) return null;
  return meta.tocKey ? t[meta.tocKey] : t[meta.eyebrowKey];
}

// True when SectionDivider renders a visible category label for this section.
// Used to avoid repeating that same label as a section eyebrow (which showed
// up as a second identical underline above the title).
export function sectionDividerHasName(section) {
  const meta = SECTION_META[section];
  return Boolean(meta && !meta.hideName && (meta.tocKey || meta.eyebrowKey));
}

function SectionDivider({ section }) {
  const { t } = useContext(AppContext);
  const meta = SECTION_META[section];
  if (!meta) return null;
  const label = getSectionDividerLabel(section, t);

  return (
    <div className="section-divider">
      <span className="section-divider-num">{meta.number}</span>
      {!meta.hideName && <span className="section-divider-name">{label}</span>}
    </div>
  );
}

export default SectionDivider;
