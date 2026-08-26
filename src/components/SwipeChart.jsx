import { useContext, useEffect, useRef, useState } from "react";
import { AppContext } from "../context/AppContext";

const SECTION = "s4b";
const STAGE_COUNT = 6;
const NAEEMA_VALUES = [0.08, 0.11, 0.14, 0.22, 0.32, 0.38];
const MIM_VALUES = [0.08, 0.18, 0.3, 0.55, 0.72, 0.92];
const GAP_PCT = [0, 15, 28, 52, 68, 86];
const Y_MAX = 1;
const COLOR_A = "#34A853";
const COLOR_B = "#EA4335";
const FILL_COLOR = "rgba(234,67,53,0.07)";
const GLOW_A = "rgba(52,168,83,0.15)";
const GLOW_B = "rgba(234,67,53,0.15)";
const SWIPE_THRESHOLD = 40;
const ANIM_DURATION = 400;
const BN_DIGITS = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];

function cssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function localizeDigits(value, lang) {
  const str = String(value);
  if (lang !== "bn") return str;
  return str.replace(/[0-9]/g, (d) => BN_DIGITS[Number(d)]);
}

function easeOutCubic(x) {
  return 1 - (1 - x) ** 3;
}

function clamp(v, min, max) {
  return Math.min(max, Math.max(min, v));
}

function lerp(a, b, t) {
  return a + (b - a) * t;
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

function setupCanvasDPR(canvas, cssWidth, cssHeight) {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.max(1, Math.round(cssWidth * dpr));
  canvas.height = Math.max(1, Math.round(cssHeight * dpr));
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return ctx;
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

function SwipeChart() {
  const { t, lang, theme } = useContext(AppContext);
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const cardRef = useRef(null);
  const rafRef = useRef(null);
  const progressRef = useRef(0);
  const sizeRef = useRef({ width: 0, height: 0 });
  const dragRef = useRef({ startX: 0, dragging: false });
  const stageRef = useRef(0);

  const [stage, setStage] = useState(0);
  const [interacted, setInteracted] = useState(false);

  const gapPct = GAP_PCT[stage];

  useEffect(() => {
    stageRef.current = stage;
  }, [stage]);

  function goToStage(next) {
    const clamped = clamp(next, 0, STAGE_COUNT - 1);
    if (clamped === stageRef.current) return;
    setStage(clamped);
    animateTo(clamped);
  }

  function animateTo(target) {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const from = progressRef.current;
    const start = performance.now();
    function step(ts) {
      const elapsed = ts - start;
      const raw = clamp(elapsed / ANIM_DURATION, 0, 1);
      const eased = easeOutCubic(raw);
      progressRef.current = lerp(from, target, eased);
      draw();
      if (raw < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        rafRef.current = null;
      }
    }
    rafRef.current = requestAnimationFrame(step);
  }

  function draw() {
    const canvas = canvasRef.current;
    const { width, height } = sizeRef.current;
    if (!canvas || !width) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, width, height);

    const gridColor = "rgba(255,255,255,0.05)";
    const tickColor = cssVar("--cream-mute");
    const fontFamily = cssVar("--mono");
    const padding = { top: 16, right: 12, bottom: 26, left: 12 };
    const plotW = width - padding.left - padding.right;
    const plotH = height - padding.top - padding.bottom;
    const xAt = (i) => padding.left + (plotW * i) / (STAGE_COUNT - 1);
    const yAt = (v) => padding.top + plotH - (plotH * v) / Y_MAX;

    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;
    [0.25, 0.5, 0.75, 1.0].forEach((v) => {
      const y = yAt(v);
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(padding.left + plotW, y);
      ctx.stroke();
    });

    const axisLabels = [1, 2, 3, 4, 5, 6].map((n) => t[`${SECTION}.axis.x${n}`]);
    ctx.fillStyle = tickColor;
    ctx.font = `9px ${fontFamily}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    axisLabels.forEach((label, i) => ctx.fillText(label ?? "", xAt(i), padding.top + plotH + 8));

    const exactPos = progressRef.current;
    const naeemaPts = pointsUpTo(NAEEMA_VALUES, exactPos, xAt, yAt);
    const mimPts = pointsUpTo(MIM_VALUES, exactPos, xAt, yAt);

    if (mimPts.length >= 2 && naeemaPts.length >= 2) {
      ctx.beginPath();
      ctx.moveTo(mimPts[0].x, mimPts[0].y);
      for (let i = 1; i < mimPts.length; i += 1) ctx.lineTo(mimPts[i].x, mimPts[i].y);
      for (let i = naeemaPts.length - 1; i >= 0; i -= 1) ctx.lineTo(naeemaPts[i].x, naeemaPts[i].y);
      ctx.closePath();
      ctx.fillStyle = FILL_COLOR;
      ctx.fill();
    }

    function drawLine(pts, color, glow) {
      if (pts.length < 2) return;
      ctx.beginPath();
      ctx.strokeStyle = glow;
      ctx.lineWidth = 8;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i += 1) ctx.lineTo(pts[i].x, pts[i].y);
      ctx.stroke();

      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i += 1) ctx.lineTo(pts[i].x, pts[i].y);
      ctx.stroke();

      const last = pts[pts.length - 1];
      ctx.beginPath();
      ctx.fillStyle = color;
      ctx.arc(last.x, last.y, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    drawLine(naeemaPts, COLOR_A, GLOW_A);
    drawLine(mimPts, COLOR_B, GLOW_B);
  }

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return undefined;

    function resize() {
      const cssWidth = wrap.clientWidth;
      const cssHeight = wrap.clientHeight;
      if (!cssWidth || !cssHeight) return;
      setupCanvasDPR(canvas, cssWidth, cssHeight);
      sizeRef.current = { width: cssWidth, height: cssHeight };
      draw();
    }

    progressRef.current = stageRef.current;
    resize();

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(wrap);

    return () => {
      resizeObserver.disconnect();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang, theme]);

  function markInteracted() {
    if (!interacted) setInteracted(true);
  }

  function handleTouchStart(e) {
    markInteracted();
    dragRef.current = { startX: e.touches[0].clientX, dragging: true };
  }

  function handleTouchMove(e) {
    if (dragRef.current.dragging) e.stopPropagation();
  }

  function handleTouchEnd(e) {
    if (!dragRef.current.dragging) return;
    const dx = e.changedTouches[0].clientX - dragRef.current.startX;
    dragRef.current.dragging = false;
    if (dx <= -SWIPE_THRESHOLD) goToStage(stageRef.current + 1);
    else if (dx >= SWIPE_THRESHOLD) goToStage(stageRef.current - 1);
  }

  function handleMouseDown(e) {
    markInteracted();
    dragRef.current = { startX: e.clientX, dragging: true };
  }

  function handleMouseUp(e) {
    if (!dragRef.current.dragging) return;
    const dx = e.clientX - dragRef.current.startX;
    dragRef.current.dragging = false;
    if (dx <= -SWIPE_THRESHOLD) goToStage(stageRef.current + 1);
    else if (dx >= SWIPE_THRESHOLD) goToStage(stageRef.current - 1);
  }

  const heading = t[`${SECTION}.stage${stage + 1}.heading`];
  const body = t[`${SECTION}.stage${stage + 1}.body`];
  const source = t[`${SECTION}.stage${stage + 1}.source`];

  return (
    <div className="tf-swipe">
      <CharacterCards t={t} />
      <p className="tf-cards-intro">{t[`${SECTION}.cardsIntro`]}</p>

      <div
        className="tf-swipe-chart-card"
        ref={cardRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
      >
        <div className={`tf-swipe-hint${interacted ? " hidden" : ""}`}>
          <span className="tf-swipe-arrow-left">←</span>
          <span>{t[`${SECTION}.swipeHint`]}</span>
          <span className="tf-swipe-arrow-right">→</span>
        </div>

        <div className="tf-swipe-legend">
          <span className="tf-swipe-legend-item">
            <span className="tf-swipe-legend-dot" style={{ background: COLOR_A }} />
            {t[`${SECTION}.legend.a`]}
          </span>
          <span className="tf-swipe-legend-item">
            <span className="tf-swipe-legend-dot" style={{ background: COLOR_B }} />
            {t[`${SECTION}.legend.b`]}
          </span>
        </div>

        <div className="tf-swipe-canvas-wrap" ref={wrapRef}>
          <canvas ref={canvasRef} />
        </div>

        <div className="tf-swipe-timeline">
          {Array.from({ length: STAGE_COUNT }, (_, i) => i).map((i) => {
            const active = i === stage;
            return (
              <button
                key={i}
                type="button"
                className="tf-swipe-dot-wrap"
                onClick={() => {
                  markInteracted();
                  goToStage(i);
                }}
              >
                <span className={`tf-swipe-dot${active ? " active" : ""}`}>
                  {localizeDigits(i, lang)}
                </span>
                <span className={`tf-swipe-dot-label${active ? " active" : ""}`}>
                  {t[`${SECTION}.dot${i + 1}`]}
                </span>
              </button>
            );
          })}
        </div>

        <div className="tf-swipe-gapbar">
          <div className="tf-swipe-gapbar-row">
            <span>{t[`${SECTION}.gap.label`]}</span>
            <span className="tf-swipe-gapbar-pct">{localizeDigits(gapPct, lang)}%</span>
          </div>
          <div className="tf-swipe-gapbar-track">
            <div className="tf-swipe-gapbar-fill" style={{ width: `${gapPct}%` }} />
          </div>
        </div>
      </div>

      <div className="tf-swipe-stagebox">
        <div className="tf-swipe-stage-year">{heading}</div>
        <p className="tf-swipe-stage-body">{body}</p>
        {source && <div className="tf-swipe-stage-source">{source}</div>}
      </div>
    </div>
  );
}

export default SwipeChart;
