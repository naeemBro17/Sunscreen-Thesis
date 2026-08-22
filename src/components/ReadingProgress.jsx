import { motion, useScroll } from "framer-motion";

function ReadingProgress() {
  const { scrollYProgress } = useScroll();

  return (
    <motion.div
      className="reading-progress"
      style={{ scaleX: scrollYProgress }}
    />
  );
}

export default ReadingProgress;
