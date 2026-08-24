import { useContext, useState } from "react";
import { motion } from "framer-motion";
import { AppContext } from "../context/AppContext";
import ArcGauge from "./ArcGauge";

function WaterDropIcon() {
  return (
    <svg
      className="bgc-drop-icon"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="rgba(86,200,240,0.25)"
      stroke="#56C8F0"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 2.5c-3.6 5-7 9.3-7 13.3a7 7 0 0 0 14 0c0-4-3.4-8.3-7-13.3z" />
    </svg>
  );
}

function BangladeshClimate() {
  const { t, theme } = useContext(AppContext);
  const trackColor = theme === "light" ? "rgba(0,0,0,0.10)" : "rgba(255,255,255,0.12)";
  const [heatDone, setHeatDone] = useState(false);

  return (
    <motion.section
      className="bgc-section"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-8%" }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="bgc-photo" />
      <div className="bgc-overlay" />
      <div className="bgc-inner">
        <h2 className="bgc-title">{t["bgc.title"]}</h2>

        <div className="bgc-cards">
          <div className="bgc-card bgc-card--heat">
            <ArcGauge
              fraction={0.4}
              trackColor={trackColor}
              glowColor="rgba(232,97,26,0.25)"
              gradientFrom="#E8A830"
              gradientTo="#E8611A"
              duration={2000}
              onComplete={() => setHeatDone(true)}
            >
              <div className="arc-gauge-readout">
                <div className="bgc-gauge-value" style={{ color: "#E8611A" }}>
                  {t["bgc.heat.value"]}
                </div>
                <div className="bgc-gauge-label" style={{ color: "rgba(232,97,26,0.9)" }}>
                  {t["bgc.heat.label"]}
                </div>
              </div>
            </ArcGauge>
          </div>

          <div className="bgc-card bgc-card--humidity">
            <ArcGauge
              fraction={0.8}
              trackColor={trackColor}
              glowColor="rgba(46,139,192,0.25)"
              gradientFrom="#56C8F0"
              gradientTo="#1A6ABA"
              duration={2000}
              autoStart={false}
              start={heatDone}
            >
              <div className="arc-gauge-readout">
                <WaterDropIcon />
                <div className="bgc-gauge-value" style={{ color: "#2E8BC0" }}>
                  {t["bgc.humidity.value"]}
                </div>
                <div className="bgc-gauge-label" style={{ color: "rgba(46,139,192,0.9)" }}>
                  {t["bgc.humidity.label"]}
                </div>
              </div>
            </ArcGauge>
          </div>
        </div>
      </div>
    </motion.section>
  );
}

export default BangladeshClimate;
