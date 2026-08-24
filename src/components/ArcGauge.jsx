import { useEffect, useRef } from "react";
import useInViewOnce from "../hooks/useInViewOnce";

const START_ANGLE = (135 * Math.PI) / 180;
const SWEEP_ANGLE = (270 * Math.PI) / 180;
const TRACK_WIDTH = 14;
const GLOW_WIDTH = 26;
const FILL_WIDTH = 18;

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

function ArcGauge({
  fraction,
  trackColor,
  glowColor,
  gradientFrom,
  gradientTo,
  duration,
  autoStart = true,
  start = true,
  onComplete,
  children,
}) {
  const [wrapRef, inView] = useInViewOnce(0.3);
  const canvasRef = useRef(null);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return undefined;

    let size = 0;
    let currentFraction = 0;
    let rafId = null;

    function draw(progressFraction) {
      if (!size) return;
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, size, size);
      const cx = size / 2;
      const cy = size / 2;
      const radius = size / 2 - GLOW_WIDTH / 2 - 2;

      strokeArc(ctx, cx, cy, radius, START_ANGLE, SWEEP_ANGLE, trackColor, TRACK_WIDTH);

      const sweepNow = SWEEP_ANGLE * progressFraction;
      if (sweepNow > 0) {
        strokeArc(ctx, cx, cy, radius, START_ANGLE, sweepNow, glowColor, GLOW_WIDTH);
        const gradient = arcGradient(ctx, cx, cy, radius, gradientFrom, gradientTo);
        strokeArc(ctx, cx, cy, radius, START_ANGLE, sweepNow, gradient, FILL_WIDTH);
      }
    }

    function resize() {
      const cssSize = wrap.clientWidth;
      if (!cssSize) return;
      size = cssSize;
      canvas.style.width = `${size}px`;
      canvas.style.height = `${size}px`;
      setupCanvasDPR(canvas, size);
      draw(currentFraction);
    }

    function animate(startTs, ts) {
      const elapsed = ts - startTs;
      const raw = Math.min(elapsed / duration, 1);
      currentFraction = easeOutCubic(raw) * fraction;
      draw(currentFraction);
      if (raw < 1) {
        rafId = requestAnimationFrame((t) => animate(startTs, t));
      } else {
        onCompleteRef.current?.();
      }
    }

    resize();

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(wrap);

    const shouldStart = autoStart ? inView : inView && start;
    if (shouldStart) {
      rafId = requestAnimationFrame((ts) => animate(ts, ts));
    }

    return () => {
      resizeObserver.disconnect();
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [inView, start, autoStart, fraction, trackColor, glowColor, gradientFrom, gradientTo, duration, wrapRef]);

  return (
    <div className="arc-gauge" ref={wrapRef}>
      <canvas ref={canvasRef} className="arc-gauge-canvas" />
      <div className="arc-gauge-center">{children}</div>
    </div>
  );
}

export default ArcGauge;
