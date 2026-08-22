import { useEffect, useRef, useState } from "react";
import useInViewOnce from "../hooks/useInViewOnce";

const NUMBER_PATTERN = /^([^\d]*)([\d.]+)([^\d]*)$/;
const COUNT_UP_DURATION = 1800;

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

function StatBlock({ number, label }) {
  const [ref, inView] = useInViewOnce(0.4);
  const match = NUMBER_PATTERN.exec(number);
  const [display, setDisplay] = useState(match ? `${match[1]}0${match[3]}` : number);
  const frameRef = useRef(null);

  useEffect(() => {
    if (!inView || !match) return undefined;
    const [, prefix, numStr, suffix] = match;
    const target = parseFloat(numStr);
    const decimals = numStr.includes(".") ? numStr.split(".")[1].length : 0;
    const start = performance.now();

    function tick(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / COUNT_UP_DURATION, 1);
      const value = target * easeOutCubic(progress);
      setDisplay(`${prefix}${value.toFixed(decimals)}${suffix}`);
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick);
      }
    }

    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView]);

  return (
    <div className="stat-block" ref={ref}>
      <div className="stat-num">{display}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

export default StatBlock;
