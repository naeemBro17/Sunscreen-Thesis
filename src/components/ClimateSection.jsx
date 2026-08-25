import { useContext, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { AppContext } from "../context/AppContext";
import useInViewOnce from "../hooks/useInViewOnce";

const START_ANGLE = (135 * Math.PI) / 180;
const SWEEP_ANGLE = (270 * Math.PI) / 180;
const DURATION = 2000;

const TRACK_WIDTH_PCT = 0.07;
const GLOW_WIDTH_PCT = 0.12;
const FILL_WIDTH_PCT = 0.08;
const DOT_RADIUS_PCT = 0.03;

function easeOutCubic(x) {
  return 1 - (1 - x) ** 3;
}

function setupCanvasDPR(canvas, cssSize) {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.max(1, Math.round(cssSize * dpr));
  canvas.height = Math.max(1, Math.round(cssSize * dpr));
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return ctx;
}

function strokeArc(ctx, cx, cy, radius, startAngle, sweep, color, width) {
  if (sweep <= 0) return;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, startAngle, startAngle + sweep);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.stroke();
}

function arcGradient(ctx, cx, cy, radius, colorFrom, colorTo) {
  try {
    const gradient = ctx.createConicGradient(START_ANGLE, cx, cy);
    gradient.addColorStop(0, colorFrom);
    gradient.addColorStop(SWEEP_ANGLE / (Math.PI * 2), colorTo);
    gradient.addColorStop(1, colorTo);
    return gradient;
  } catch {
    const p0x = cx + radius * Math.cos(START_ANGLE);
    const p0y = cy + radius * Math.sin(START_ANGLE);
    const p1x = cx + radius * Math.cos(START_ANGLE + SWEEP_ANGLE);
    const p1y = cy + radius * Math.sin(START_ANGLE + SWEEP_ANGLE);
    const gradient = ctx.createLinearGradient(p0x, p0y, p1x, p1y);
    gradient.addColorStop(0, colorFrom);
    gradient.addColorStop(1, colorTo);
    return gradient;
  }
}

function drawGauge(ctx, size, progress, colors) {
  ctx.clearRect(0, 0, size, size);
  const cx = size / 2;
  const cy = size / 2;
  const glowW = size * GLOW_WIDTH_PCT;
  const trackW = size * TRACK_WIDTH_PCT;
  const fillW = size * FILL_WIDTH_PCT;
  const dotR = size * DOT_RADIUS_PCT;
  const radius = size / 2 - glowW / 2 - 2;

  strokeArc(ctx, cx, cy, radius, START_ANGLE, SWEEP_ANGLE, colors.track, trackW);

  const sweepNow = SWEEP_ANGLE * progress;
  if (sweepNow > 0) {
    strokeArc(ctx, cx, cy, radius, START_ANGLE, sweepNow, colors.glow, glowW);
    const gradient = arcGradient(ctx, cx, cy, radius, colors.from, colors.to);
    strokeArc(ctx, cx, cy, radius, START_ANGLE, sweepNow, gradient, fillW);

    const tipAngle = START_ANGLE + sweepNow;
    const tipX = cx + radius * Math.cos(tipAngle);
    const tipY = cy + radius * Math.sin(tipAngle);
    ctx.beginPath();
    ctx.fillStyle = colors.dot;
    ctx.arc(tipX, tipY, dotR, 0, Math.PI * 2);
    ctx.fill();
  }
}

function Gauge({ fraction, target, colors, trackColor, start, onComplete, valueRef, children }) {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const stateRef = useRef({ size: 0, progress: 0, started: false, rafId: null });

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return undefined;
    const st = stateRef.current;
    const fullColors = { ...colors, track: trackColor };

    function draw(progress) {
      if (!st.size) return;
      const ctx = canvas.getContext("2d");
      drawGauge(ctx, st.size, progress, fullColors);
    }

    function resize() {
      const rect = wrap.getBoundingClientRect();
      if (!rect.width) return;
      st.size = rect.width;
      canvas.style.width = `${st.size}px`;
      canvas.style.height = `${st.size}px`;
      setupCanvasDPR(canvas, st.size);
      draw(st.progress);
    }

    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(wrap);

    return () => {
      resizeObserver.disconnect();
      if (st.rafId) cancelAnimationFrame(st.rafId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trackColor, colors.glow, colors.from, colors.to]);

  useEffect(() => {
    if (!start) return undefined;
    const canvas = canvasRef.current;
    const st = stateRef.current;
    if (!canvas || st.started) return undefined;
    st.started = true;
    const fullColors = { ...colors, track: trackColor };

    function animate(startTs, ts) {
      const elapsed = ts - startTs;
      const raw = Math.min(elapsed / DURATION, 1);
      const eased = easeOutCubic(raw);
      st.progress = eased * fraction;
      const ctx = canvas.getContext("2d");
      drawGauge(ctx, st.size, st.progress, fullColors);
      if (valueRef.current) {
        valueRef.current.textContent = String(Math.round(eased * target));
      }
      if (raw < 1) {
        st.rafId = requestAnimationFrame((t) => animate(startTs, t));
      } else {
        onComplete?.();
      }
    }
    st.rafId = requestAnimationFrame((ts) => animate(ts, ts));

    return () => {
      if (st.rafId) cancelAnimationFrame(st.rafId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [start]);

  return (
    <div className="clim-gauge-wrap" ref={wrapRef}>
      <canvas ref={canvasRef} className="clim-gauge-canvas" />
      <div className="clim-gauge-center">{children}</div>
    </div>
  );
}

function ClimateSection() {
  const { t, theme } = useContext(AppContext);
  const [sectionRef, inView] = useInViewOnce(0.3);
  const [heatDone, setHeatDone] = useState(false);
  const tempValueRef = useRef(null);
  const humidValueRef = useRef(null);
  const trackColor = theme === "light" ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.08)";

  return (
    <motion.section
      className="clim-section"
      ref={sectionRef}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-8%" }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="clim-inner">
        <span className="clim-eyebrow">{t["climate.eyebrow"]}</span>
        <h2 className="clim-title">{t["climate.title"]}</h2>

        <div className="clim-card">
          <div className="clim-panel">
            <span className="clim-badge clim-badge--temp" aria-hidden="true">
              🌡️
            </span>
            <Gauge
              fraction={0.4}
              target={40}
              trackColor={trackColor}
              colors={{ glow: "rgba(232,97,26,0.18)", from: "#E8A830", to: "#E8611A", dot: "#E8611A" }}
              start={inView}
              onComplete={() => setHeatDone(true)}
              valueRef={tempValueRef}
            >
              <div className="clim-gauge-value clim-gauge-value--temp">
                <span ref={tempValueRef}>0</span>
                {t["climate.temp.unit"]}
              </div>
              <div className="clim-gauge-label clim-gauge-label--temp">{t["climate.temp.label"]}</div>
            </Gauge>
          </div>

          <div className="clim-divider" />

          <div className="clim-panel">
            <span className="clim-badge clim-badge--humidity" aria-hidden="true">
              💧
            </span>
            <Gauge
              fraction={0.8}
              target={80}
              trackColor={trackColor}
              colors={{ glow: "rgba(46,139,192,0.18)", from: "#56C8F0", to: "#1A6ABA", dot: "#1A6ABA" }}
              start={heatDone}
              valueRef={humidValueRef}
            >
              <div className="clim-gauge-value clim-gauge-value--humidity">
                <span ref={humidValueRef}>0</span>
                {t["climate.humidity.unit"]}
              </div>
              <div className="clim-gauge-label clim-gauge-label--humidity">{t["climate.humidity.label"]}</div>
            </Gauge>
          </div>
        </div>

        <div className="clim-source">{t["climate.source"]}</div>
      </div>
    </motion.section>
  );
}

export default ClimateSection;
