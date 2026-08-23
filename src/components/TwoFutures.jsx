import { useContext, useEffect, useRef, useState } from "react";
import { AppContext } from "../context/AppContext";

const SECTION = "s4b";
const STAGE_COUNT = 6;
const NAEEMA_VALUES = [0.08, 0.11, 0.14, 0.22, 0.32, 0.38];
const MIM_VALUES = [0.08, 0.18, 0.3, 0.55, 0.72, 0.92];
const Y_MAX = 1;
const AXIS_LABEL_WIDTH = 52;
const LERP_FACTOR = 0.08;
const BN_DIGITS = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];

function cssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function hexToRgb(hex) {
  const h = hex.trim().replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(full, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function rgbaFromHex(hex, alpha) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r},${g},${b},${alpha})`;
}

function setupCanvasDPR(canvas, cssWidth, cssHeight) {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.max(1, Math.round(cssWidth * dpr));
  canvas.height = Math.max(1, Math.round(cssHeight * dpr));
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return ctx;
}

function clamp(v, min, max) {
  return Math.min(max, Math.max(min, v));
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function valueAt(values, floatIdx) {
  const i0 = Math.floor(floatIdx);
  const i1 = Math.min(i0 + 1, values.length - 1);
  const frac = floatIdx - i0;
  return lerp(values[i0], values[i1], frac);
}

function pointsUpTo(values, exactPos, xAt, yAt) {
  const pts = [{ x: xAt(0), y: yAt(values[0]) }];
  for (let i = 1; i < values.length; i += 1) {
    if (exactPos >= i) {
      pts.push({ x: xAt(i), y: yAt(values[i]) });
    } else if (exactPos > i - 1) {
      const segT = exactPos - (i - 1);
      const x = xAt(i - 1) + (xAt(i) - xAt(i - 1)) * segT;
      const y = yAt(values[i - 1]) + (yAt(values[i]) - yAt(values[i - 1])) * segT;
      pts.push({ x, y });
      break;
    } else {
      break;
    }
  }
  return pts;
}

function localizeDigits(value, lang) {
  const str = String(value);
  if (lang !== "bn") return str;
  return str.replace(/[0-9]/g, (d) => BN_DIGITS[Number(d)]);
}

function CharacterCards({ t }) {
  return (
    <div className="tf-cards">
      <div className="tf-card tf-card--a">
        <div className="tf-card-name">{t[`${SECTION}.cardA.name`]}</div>
        <div className="tf-card-detail">{t[`${SECTION}.cardA.detail1`]}</div>
        <div className="tf-card-detail">{t[`${SECTION}.cardA.detail2`]}</div>
        <div className="tf-card-detail">{t[`${SECTION}.cardA.detail3`]}</div>
        <div className="tf-card-detail">{t[`${SECTION}.cardA.detail4`]}</div>
      </div>
      <div className="tf-card tf-card--b">
        <div className="tf-card-name">{t[`${SECTION}.cardB.name`]}</div>
        <div className="tf-card-detail">{t[`${SECTION}.cardB.detail1`]}</div>
        <div className="tf-card-detail">{t[`${SECTION}.cardB.detail2`]}</div>
        <div className="tf-card-detail">{t[`${SECTION}.cardB.detail3`]}</div>
        <div className="tf-card-detail">{t[`${SECTION}.cardB.detail4`]}</div>
      </div>
    </div>
  );
}

function ScrollChart({ t, lang }) {
  const sectionRef = useRef(null);
  const stickyRef = useRef(null);
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const gapFillRef = useRef(null);
  const gapValueRef = useRef(null);
  const rafRef = useRef(null);
  const [stageIndex, setStageIndex] = useState(0);

  useEffect(() => {
    const outer = sectionRef.current;
    const sticky = stickyRef.current;
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!outer || !sticky || !wrap || !canvas) return undefined;

    const teal = cssVar("--teal");
    const sand = cssVar("--sand");
    const gridColor = cssVar("--line");
    const tickColor = cssVar("--cream-mute");
    const fillColor = rgbaFromHex(sand, 0.06);
    const fontFamily = cssVar("--mono");

    const axisLabels = [1, 2, 3, 4, 5, 6].map((n) => t[`${SECTION}.axis.x${n}`]);

    let size = { width: 0, height: 0 };
    let displayProgress = 0;
    let stageIndexLocal = 0;

    function layout() {
      const padding = { top: 20, right: 20, bottom: 32, left: AXIS_LABEL_WIDTH };
      const plotW = size.width - padding.left - padding.right;
      const plotH = size.height - padding.top - padding.bottom;
      const xAt = (i) => padding.left + (plotW * i) / (STAGE_COUNT - 1);
      const yAt = (v) => padding.top + plotH - (plotH * v) / Y_MAX;
      return { padding, plotW, plotH, xAt, yAt };
    }

    function resize() {
      const cssWidth = wrap.clientWidth;
      const cssHeight = wrap.clientHeight;
      if (!cssWidth || !cssHeight) return;
      setupCanvasDPR(canvas, cssWidth, cssHeight);
      size = { width: cssWidth, height: cssHeight };
    }

    function drawGrid(ctx) {
      const { padding, plotW, plotH, xAt } = layout();
      ctx.strokeStyle = gridColor;
      ctx.lineWidth = 1;
      const ticks = 4;
      for (let i = 0; i <= ticks; i += 1) {
        const y = padding.top + (plotH * i) / ticks;
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(padding.left + plotW, y);
        ctx.stroke();
      }
      ctx.fillStyle = tickColor;
      ctx.font = `9px ${fontFamily}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      axisLabels.forEach((label, i) => ctx.fillText(label, xAt(i), padding.top + plotH + 10));
    }

    function drawLine(ctx, pts, color, lineWidth) {
      if (pts.length < 2) return;
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i += 1) ctx.lineTo(pts[i].x, pts[i].y);
      ctx.stroke();
      const last = pts[pts.length - 1];
      ctx.beginPath();
      ctx.fillStyle = color;
      ctx.arc(last.x, last.y, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }

    function drawFill(ctx, topPts, bottomPts) {
      if (topPts.length < 2 || bottomPts.length < 2) return;
      ctx.beginPath();
      ctx.moveTo(topPts[0].x, topPts[0].y);
      for (let i = 1; i < topPts.length; i += 1) ctx.lineTo(topPts[i].x, topPts[i].y);
      for (let i = bottomPts.length - 1; i >= 0; i -= 1) ctx.lineTo(bottomPts[i].x, bottomPts[i].y);
      ctx.closePath();
      ctx.fillStyle = fillColor;
      ctx.fill();
    }

    function draw() {
      if (!size.width) return;
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, size.width, size.height);
      drawGrid(ctx);

      const { xAt, yAt } = layout();
      const exactPos = displayProgress * (STAGE_COUNT - 1);
      const mimPts = pointsUpTo(MIM_VALUES, exactPos, xAt, yAt);
      const naeemaPts = pointsUpTo(NAEEMA_VALUES, exactPos, xAt, yAt);
      drawFill(ctx, mimPts, naeemaPts);
      drawLine(ctx, naeemaPts, teal, 2);
      drawLine(ctx, mimPts, sand, 2.5);

      const naeemaV = valueAt(NAEEMA_VALUES, exactPos);
      const mimV = valueAt(MIM_VALUES, exactPos);
      const gapPct = Math.round((mimV - naeemaV) * 100);
      if (gapFillRef.current) gapFillRef.current.style.width = `${clamp(gapPct, 0, 100)}%`;
      if (gapValueRef.current) gapValueRef.current.textContent = `${localizeDigits(gapPct, lang)}%`;

      const nearest = clamp(Math.round(exactPos), 0, STAGE_COUNT - 1);
      if (nearest !== stageIndexLocal) {
        stageIndexLocal = nearest;
        setStageIndex(nearest);
      }
    }

    function updatePin(rect) {
      const topOffset = window.innerHeight * 0.2;
      const stickyHeight = sticky.offsetHeight;
      if (rect.top > topOffset) {
        sticky.style.position = "absolute";
        sticky.style.top = "0px";
        sticky.style.bottom = "auto";
        sticky.style.left = "0px";
        sticky.style.width = "100%";
      } else if (rect.bottom < topOffset + stickyHeight) {
        sticky.style.position = "absolute";
        sticky.style.top = "auto";
        sticky.style.bottom = "0px";
        sticky.style.left = "0px";
        sticky.style.width = "100%";
      } else {
        sticky.style.position = "fixed";
        sticky.style.top = `${topOffset}px`;
        sticky.style.bottom = "auto";
        sticky.style.left = `${rect.left}px`;
        sticky.style.width = `${rect.width}px`;
      }
    }

    function tick() {
      const rect = outer.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      const rawProgress = total > 0 ? clamp(-rect.top / total, 0, 1) : 0;
      displayProgress = lerp(displayProgress, rawProgress, LERP_FACTOR);
      updatePin(rect);
      draw();
      rafRef.current = requestAnimationFrame(tick);
    }

    resize();
    updatePin(outer.getBoundingClientRect());
    draw();
    rafRef.current = requestAnimationFrame(tick);

    const resizeObserver = new ResizeObserver(() => {
      resize();
      draw();
    });
    resizeObserver.observe(wrap);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      resizeObserver.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  const heading = t[`${SECTION}.stage${stageIndex + 1}.heading`];
  const body = t[`${SECTION}.stage${stageIndex + 1}.body`];
  const source = t[`${SECTION}.stage${stageIndex + 1}.source`];

  return (
    <div className="tf-scrollchart" ref={sectionRef}>
      <div className="tf-scrollchart-sticky" ref={stickyRef}>
        <div className="chart-canvas-outer tf-chart-canvas-wrap" ref={wrapRef}>
          <div className="chart-axis-y-label">
            <span>{t[`${SECTION}.axis.y`]}</span>
          </div>
          <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block" }} />
        </div>

        <div className="tf-gap-indicator">
          <div className="tf-gap-label">
            <span>{t[`${SECTION}.gap.label`]}</span>
            <span ref={gapValueRef}>0%</span>
          </div>
          <div className="tf-gap-track">
            <div className="tf-gap-fill" ref={gapFillRef} />
          </div>
        </div>

        <div className="tf-stage-text">
          <h3 className="tf-stage-heading">{heading}</h3>
          <p className="tf-stage-body">{body}</p>
          {source && <div className="tf-stage-source">{source}</div>}
        </div>
      </div>
    </div>
  );
}

function Assumptions({ t }) {
  const items = [];
  for (let n = 1; t[`${SECTION}.assumptions.item${n}`]; n += 1) {
    items.push(t[`${SECTION}.assumptions.item${n}`]);
  }
  return (
    <div className="tf-assumptions">
      <h3>{t[`${SECTION}.assumptions.title`]}</h3>
      <ul>
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function Sources({ t }) {
  const sources = [];
  for (let n = 1; t[`${SECTION}.src${n}`]; n += 1) {
    sources.push({ n, text: t[`${SECTION}.src${n}`] });
  }
  return (
    <div className="tf-sources">
      {sources.map((s) => (
        <div key={s.n}>
          [{s.n}] {s.text}
        </div>
      ))}
    </div>
  );
}

function TwoFutures() {
  const { t, lang, theme } = useContext(AppContext);
  const [open, setOpen] = useState(false);

  return (
    <section className="chapter two-futures">
      <button
        type="button"
        className={`tf-toggle${open ? " open" : ""}`}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <span>{t[`${SECTION}.button`]}</span>
        <span className="tf-toggle-arrow">▾</span>
      </button>

      <div className={`tf-panel${open ? " open" : ""}`}>
        <div className="tf-panel-inner">
          {open && (
            <>
              <CharacterCards t={t} />
              <p className="tf-cards-intro">{t[`${SECTION}.cardsIntro`]}</p>
              <ScrollChart key={theme} t={t} lang={lang} />
              <Assumptions t={t} />
              <div className="tf-disclaimer">{t[`${SECTION}.disclaimer`]}</div>
              <Sources t={t} />
            </>
          )}
        </div>
      </div>
    </section>
  );
}

export default TwoFutures;
