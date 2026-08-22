import { useContext } from "react";
import { motion } from "framer-motion";
import { AppContext } from "../context/AppContext";
import SectionHeading from "./SectionHeading";

function ChapterBlock({ section, children }) {
  const { t } = useContext(AppContext);
  const eyebrow = t[`${section}.eyebrow`] ?? t[`${section}.kicker`];
  const title = t[`${section}.title`];
  const body = t[`${section}.lead`] ?? t[`${section}.body`];
  const bodyIsHtml = /<[a-z][\s\S]*>/i.test(body ?? "");
  const guide = t[`${section}.guide`];

  return (
    <motion.section
      className="chapter"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-8%" }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
    >
      <SectionHeading eyebrow={eyebrow} title={title} />
      {bodyIsHtml ? (
        <div className="chapter-body" dangerouslySetInnerHTML={{ __html: body }} />
      ) : (
        <p className="chapter-body">{body}</p>
      )}
      {guide && <p className="chapter-guide">{guide}</p>}
      {children}
    </motion.section>
  );
}

export default ChapterBlock;
