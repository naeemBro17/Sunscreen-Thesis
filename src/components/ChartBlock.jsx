import { useContext, useEffect, useRef } from "react";
import { AppContext } from "../context/AppContext";
import chartData from "../content/chartData";
import useInViewOnce from "../hooks/useInViewOnce";

const CHART_HEIGHT = 280;
const AXIS_LABEL_WIDTH = 52;

// Bar gradient endpoints, keyed by value rank rather than bar position.
const BAR_GRADIENT_LOW = "#6B5535";
const BAR_GRADIENT_HIGH = "#D4A843";

function cssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function hexToRgb(hex) {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(full, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function rgbaFromHex(hex, alpha) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r},${g},${b},${alpha})`;
}

function mixHex(hexA, hexB, t) {
  const a = hexToRgb(hexA);
  const b = hexToRgb(hexB);
  const r = Math.round(a.r + (b.r - a.r) * t);
  const g = Math.round(a.g + (b.g - a.g) * t);
  const bl = Math.round(a.b + (b.b - a.b) * t);
  return `rgb(${r},${g},${bl})`;
}

function valueGradientColors(values) {
  const max = Math.max(...values);
  const min = Math.min(...values);
  const span = max - min;
  return values.map((v) => {
    const t = span === 0 ? 1 : (v - min) / span;
    return mixHex(BAR_GRADIENT_LOW, BAR_GRADIENT_HIGH, t);
  });
}

function easeInOutCubic(x) {
  return x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2;
}

function easeInOutQuart(x) {
  return x < 0.5 ? 8 * x * x * x * x : 1 - (-2 * x + 2) ** 4 / 2;
}

function niceMax(value) {
  if (!Number.isFinite(value) || value <= 0) return 10;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const residual = value / magnitude;
  const steps = [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10];
  const niceResidual = steps.find((s) => s >= residual) ?? 10;
  return niceResidual * magnitude;
}

function setupCanvasDPR(canvas, cssWidth, cssHeight) {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.max(1, Math.round(cssWidth * dpr));
  canvas.height = Math.max(1, Math.round(cssHeight * dpr));
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return ctx;
}

function roundRectTop(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h);
  ctx.beginPath();
  ctx.moveTo(x, y + h);
  ctx.lineTo(x, y + radius);
  ctx.arcTo(x, y, x + radius, y, radius);
  ctx.lineTo(x + w - radius, y);
  ctx.arcTo(x + w, y, x + w, y + radius, radius);
  ctx.lineTo(x + w, y + h);
  ctx.closePath();
}

function drawAxes(ctx, { padding, plotW, plotH, yMax, xTicks, tickColor, gridColor, axisColor, fontFamily, axisXTitle, canvasHeight }) {
  const tickCount = 4;
  ctx.font = `9px ${fontFamily}`;
  ctx.lineWidth = 1;

  for (let i = 0; i <= tickCount; i += 1) {
    const v = (yMax * i) / tickCount;
    const y = padding.top + plotH - (plotH * v) / yMax;
    ctx.strokeStyle = gridColor;
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(padding.left + plotW, y);
    ctx.stroke();
    ctx.fillStyle = tickColor;
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ctx.fillText(String(Math.round(v)), padding.left - 8, y);
  }

  ctx.strokeStyle = axisColor;
  ctx.beginPath();
  ctx.moveTo(padding.left, padding.top);
  ctx.lineTo(padding.left, padding.top + plotH);
  ctx.lineTo(padding.left + plotW, padding.top + plotH);
  ctx.stroke();

  ctx.fillStyle = tickColor;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  xTicks.forEach(({ x, label }) => ctx.fillText(label, x, padding.top + plotH + 8));

  if (axisXTitle) {
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.fillStyle = tickColor;
    ctx.fillText(axisXTitle, padding.left + plotW / 2, canvasHeight - 2);
  }
}

function AxisYLabel({ text }) {
  if (!text) return null;
  return (
    <div className="chart-axis-y-label">
      <span>{text}</span>
    </div>
  );
}

function LineChartCanvas({ config, lang, t }) {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const tooltipRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    const tooltip = tooltipRef.current;
    if (!wrap || !canvas) return undefined;

    const tickColor = cssVar("--cream-mute");
    const gridColor = rgbaFromHex(cssVar("--cream"), 0.08);
    const axisColor = rgbaFromHex(cssVar("--cream"), 0.2);
    const fontFamily = cssVar("--mono");
    const seriesColors = [cssVar("--teal"), cssVar("--cream-soft"), cssVar("--teal-deep")];
    const labels = config.labels[lang];
    const n = labels.length;
    const yMax = config.yMax ?? niceMax(Math.max(...config.datasets.flatMap((d) => d.values)));
    const axisXTitle = config.axisX?.[lang];

    let size = { width: 0, height: CHART_HEIGHT };
    let state = { phase: "idle", startTime: 0 };
    let lastProgress = 0;
    let lastPulse = null;

    function layout() {
      const padding = { top: 16, right: 16, bottom: 30, left: 34 };
      const plotW = size.width - padding.left - padding.right;
      const plotH = size.height - padding.top - padding.bottom;
      const xAt = (i) => padding.left + (plotW * i) / (n - 1);
      const yAt = (v) => padding.top + plotH - (plotH * v) / yMax;
      return { padding, plotW, plotH, xAt, yAt };
    }

    function draw(progress, pulseT) {
      if (!size.width) return;
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, size.width, size.height);
      const { padding, plotW, plotH, xAt, yAt } = layout();

      drawAxes(ctx, {
        padding,
        plotW,
        plotH,
        canvasHeight: size.height,
        yMax,
        xTicks: labels.map((label, i) => ({ x: xAt(i), label })),
        tickColor,
        gridColor,
        axisColor,
        fontFamily,
        axisXTitle,
      });

      const totalSegments = n - 1;
      const exactPos = progress * totalSegments;

      config.datasets.forEach((ds, si) => {
        const color = seriesColors[si % seriesColors.length];
        const { values } = ds;

        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = 2.5;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.moveTo(xAt(0), yAt(values[0]));
        for (let i = 1; i < n; i += 1) {
          if (exactPos >= i) {
            ctx.lineTo(xAt(i), yAt(values[i]));
          } else if (exactPos > i - 1) {
            const segT = exactPos - (i - 1);
            const x = xAt(i - 1) + (xAt(i) - xAt(i - 1)) * segT;
            const y = yAt(values[i - 1]) + (yAt(values[i]) - yAt(values[i - 1])) * segT;
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();

        for (let i = 0; i < n; i += 1) {
          if (exactPos >= i - 0.001) {
            ctx.beginPath();
            ctx.fillStyle = color;
            ctx.arc(xAt(i), yAt(values[i]), 3, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        if (pulseT != null) {
          const bump = Math.sin(pulseT * Math.PI);
          ctx.globalAlpha = bump * 0.7;
          ctx.strokeStyle = color;
          ctx.lineWidth = 1.5;
          for (let i = 0; i < n; i += 1) {
            ctx.beginPath();
            ctx.arc(xAt(i), yAt(values[i]), 3 + bump * 4, 0, Math.PI * 2);
            ctx.stroke();
          }
          ctx.globalAlpha = 1;
        }
      });
    }

    function animate(timestamp) {
      if (state.phase === "draw") {
        if (!state.startTime) state.startTime = timestamp;
        const raw = Math.min((timestamp - state.startTime) / 2000, 1);
        const eased = easeInOutCubic(raw);
        lastProgress = eased;
        draw(eased, null);
        if (raw < 1) {
          rafRef.current = requestAnimationFrame(animate);
        } else {
          state = { phase: "pulse", startTime: timestamp };
          rafRef.current = requestAnimationFrame(animate);
        }
      } else if (state.phase === "pulse") {
        const raw = Math.min((timestamp - state.startTime) / 500, 1);
        lastPulse = raw;
        draw(1, raw);
        if (raw < 1) {
          rafRef.current = requestAnimationFrame(animate);
        } else {
          state = { phase: "done", startTime: 0 };
          lastPulse = null;
          draw(1, null);
          rafRef.current = null;
        }
      }
    }

    function startAnimation() {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      state = { phase: "draw", startTime: 0 };
      lastPulse = null;
      rafRef.current = requestAnimationFrame(animate);
    }

    function resetAnimation() {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      state = { phase: "idle", startTime: 0 };
      lastProgress = 0;
      lastPulse = null;
      draw(0, null);
    }

    function resize() {
      const cssWidth = wrap.clientWidth;
      if (!cssWidth) return;
      setupCanvasDPR(canvas, cssWidth, CHART_HEIGHT);
      size = { width: cssWidth, height: CHART_HEIGHT };
      draw(lastProgress, lastPulse);
    }

    function handleMouseMove(e) {
      if (!tooltip) return;
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const { xAt, yAt } = layout();
      let best = null;
      let bestDist = 14;
      config.datasets.forEach((ds) => {
        ds.values.forEach((v, i) => {
          const dist = Math.hypot(xAt(i) - mx, yAt(v) - my);
          if (dist < bestDist) {
            bestDist = dist;
            best = { x: xAt(i), y: yAt(v), v };
          }
        });
      });
      if (best) {
        tooltip.style.opacity = "1";
        tooltip.style.left = `${best.x}px`;
        tooltip.style.top = `${best.y}px`;
        tooltip.textContent = String(best.v);
      } else {
        tooltip.style.opacity = "0";
      }
    }

    function handleMouseLeave() {
      if (tooltip) tooltip.style.opacity = "0";
    }

    resize();

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(wrap);

    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          startAnimation();
        } else {
          resetAnimation();
        }
      },
      { threshold: 0.2 }
    );
    intersectionObserver.observe(wrap);

    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseleave", handleMouseLeave);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config, lang, t]);

  return (
    <div className="chart-canvas-outer" style={{ height: `${CHART_HEIGHT}px` }}>
      <AxisYLabel text={config.axisY?.[lang]} />
      <div
        ref={wrapRef}
        className="chart-canvas-wrap"
        style={{ marginLeft: `${AXIS_LABEL_WIDTH}px`, height: `${CHART_HEIGHT}px` }}
      >
        <canvas ref={canvasRef} style={{ width: "100%", height: `${CHART_HEIGHT}px`, display: "block" }} />
        <div ref={tooltipRef} className="chart-tooltip" />
      </div>
    </div>
  );
}

function BarChartCanvas({ config, lang }) {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const tooltipRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    const tooltip = tooltipRef.current;
    if (!wrap || !canvas) return undefined;

    const tickColor = cssVar("--cream-mute");
    const gridColor = rgbaFromHex(cssVar("--cream"), 0.08);
    const axisColor = rgbaFromHex(cssVar("--cream"), 0.2);
    const fontFamily = cssVar("--mono");
    const labels = config.labels[lang];
    const { values } = config;
    const n = values.length;
    const colors = valueGradientColors(values);
    const yMax = config.yMax ?? niceMax(Math.max(...values));
    const axisXTitle = config.axisX?.[lang];

    const STAGGER_MS = 80;
    const BAR_DURATION_MS = 1200;
    const totalDuration = (n - 1) * STAGGER_MS + BAR_DURATION_MS;

    let size = { width: 0, height: CHART_HEIGHT };
    let state = { phase: "idle", startTime: 0 };
    let lastElapsed = 0;

    function layout() {
      const padding = { top: 16, right: 16, bottom: 30, left: 34 };
      const plotW = size.width - padding.left - padding.right;
      const plotH = size.height - padding.top - padding.bottom;
      const slot = plotW / n;
      const barWidth = Math.min(56, slot * 0.6);
      const centerX = (i) => padding.left + slot * (i + 0.5);
      return { padding, plotW, plotH, barWidth, centerX };
    }

    function barRect(i, elapsedMs) {
      const { padding, plotH, barWidth, centerX } = layout();
      const baselineY = padding.top + plotH;
      const delay = i * STAGGER_MS;
      const raw = Math.min(Math.max((elapsedMs - delay) / BAR_DURATION_MS, 0), 1);
      const eased = easeInOutQuart(raw);
      const fullHeight = (plotH * values[i]) / yMax;
      const h = fullHeight * eased;
      return { x: centerX(i) - barWidth / 2, y: baselineY - h, w: barWidth, h, baselineY };
    }

    function draw(elapsedMs) {
      if (!size.width) return;
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, size.width, size.height);
      const { padding, plotW, plotH, centerX } = layout();

      drawAxes(ctx, {
        padding,
        plotW,
        plotH,
        canvasHeight: size.height,
        yMax,
        xTicks: labels.map((label, i) => ({ x: centerX(i), label })),
        tickColor,
        gridColor,
        axisColor,
        fontFamily,
        axisXTitle,
      });

      values.forEach((v, i) => {
        const { x, y, w, h } = barRect(i, elapsedMs);
        if (h <= 0) return;
        ctx.fillStyle = colors[i % colors.length];
        roundRectTop(ctx, x, y, w, h, 4);
        ctx.fill();

        if (h > 28 && labels[i]) {
          ctx.save();
          ctx.translate(x + w / 2, y + h - 8);
          ctx.rotate(-Math.PI / 2);
          ctx.fillStyle = "rgba(10,10,10,0.55)";
          ctx.font = `8px ${fontFamily}`;
          ctx.textAlign = "left";
          ctx.textBaseline = "middle";
          ctx.fillText(labels[i], 0, 0);
          ctx.restore();
        }
      });
    }

    function animate(timestamp) {
      if (!state.startTime) state.startTime = timestamp;
      const elapsed = timestamp - state.startTime;
      lastElapsed = Math.min(elapsed, totalDuration);
      draw(lastElapsed);
      if (elapsed < totalDuration) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        state = { phase: "done", startTime: 0 };
        rafRef.current = null;
      }
    }

    function startAnimation() {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      state = { phase: "draw", startTime: 0 };
      rafRef.current = requestAnimationFrame(animate);
    }

    function resetAnimation() {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      state = { phase: "idle", startTime: 0 };
      lastElapsed = 0;
      draw(0);
    }

    function resize() {
      const cssWidth = wrap.clientWidth;
      if (!cssWidth) return;
      setupCanvasDPR(canvas, cssWidth, CHART_HEIGHT);
      size = { width: cssWidth, height: CHART_HEIGHT };
      draw(lastElapsed);
    }

    function handleMouseMove(e) {
      if (!tooltip) return;
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      let hit = null;
      values.forEach((v, i) => {
        const { x, y, w, baselineY } = barRect(i, lastElapsed);
        if (mx >= x && mx <= x + w && my >= y && my <= baselineY) {
          hit = { x: x + w / 2, y, v };
        }
      });
      if (hit) {
        tooltip.style.opacity = "1";
        tooltip.style.left = `${hit.x}px`;
        tooltip.style.top = `${hit.y}px`;
        tooltip.textContent = String(hit.v);
      } else {
        tooltip.style.opacity = "0";
      }
    }

    function handleMouseLeave() {
      if (tooltip) tooltip.style.opacity = "0";
    }

    resize();

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(wrap);

    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          startAnimation();
        } else {
          resetAnimation();
        }
      },
      { threshold: 0.2 }
    );
    intersectionObserver.observe(wrap);

    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseleave", handleMouseLeave);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config, lang]);

  return (
    <div className="chart-canvas-outer" style={{ height: `${CHART_HEIGHT}px` }}>
      <AxisYLabel text={config.axisY?.[lang]} />
      <div
        ref={wrapRef}
        className="chart-canvas-wrap"
        style={{ marginLeft: `${AXIS_LABEL_WIDTH}px`, height: `${CHART_HEIGHT}px` }}
      >
        <canvas ref={canvasRef} style={{ width: "100%", height: `${CHART_HEIGHT}px`, display: "block" }} />
        <div ref={tooltipRef} className="chart-tooltip" />
      </div>
    </div>
  );
}

function ChartBlock({ section }) {
  const { t, lang, theme } = useContext(AppContext);
  const title = t[`${section}.title`];
  const sub = t[`${section}.sub`];
  const note = t[`${section}.note`];
  const config = chartData[section];
  const [ref, inView] = useInViewOnce(0.2);

  let canvas = null;
  if (config && inView) {
    if (config.type === "bar") {
      canvas = <BarChartCanvas key={theme} config={config} lang={lang} />;
    } else if (config.type === "line") {
      canvas = <LineChartCanvas key={theme} config={config} lang={lang} t={t} />;
    }
  }

  return (
    <div className="chart-block" ref={ref}>
      <div className="chart-label">{title}</div>
      {sub && <p className="chart-sub">{sub}</p>}
      <div className="chart-placeholder">{config ? canvas : "Chart loads here"}</div>
      {note && <div className="chart-note">{note}</div>}
    </div>
  );
}

export default ChartBlock;
