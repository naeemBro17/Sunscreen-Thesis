import { useContext, useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { AppContext } from "../context/AppContext";

function Hero() {
  const { t } = useContext(AppContext);
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.05]);
  const heroSub = t["hero.p1"].split("<strong>")[0].trim();

  return (
    <section className="hero" ref={heroRef}>
      <motion.div className="hero-photo" style={{ scale }} />
      <div className="hero-scrim" />

      <div className="scroll-side">
        <span className="scroll-side-text">{t["hero.scroll"]}</span>
        <span className="scroll-line" />
        <span className="scroll-dot" />
      </div>

      <div className="hero-text">
        <span
          className="eyebrow"
          dangerouslySetInnerHTML={{ __html: t["hero.kicker"] }}
        />

        <h1
          className="hero-title"
          dangerouslySetInnerHTML={{ __html: t["hero.title"] }}
        />

        <div className="accent-line" />
        <p
          className="hero-sub"
          dangerouslySetInnerHTML={{ __html: heroSub }}
        />

        <div className="cta-row">
          <div className="cta-circle">↓</div>
          <span className="cta-text">{t["hero.cta"]}</span>
        </div>

        <div className="byline">
          <span className="byline-name">{t["hero.byline.name"]}</span> ·{" "}
          {t["hero.byline.stat1"]} · {t["hero.byline.stat2"]}
        </div>
      </div>
    </section>
  );
}

export default Hero;
