import { useContext, useEffect, useRef } from "react";
import { AppContext } from "../context/AppContext";
import chartData from "../content/chartData";
import useInViewOnce from "../hooks/useInViewOnce";

const CHART_HEIGHT = 280;
const AXIS_LABEL_WIDTH = 52;
const BN_DIGITS = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
const SEVERITY_LABEL_CLASS = ["dot-severity-low", "dot-severity-medium", "dot-severity-high"];

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

function localizeNumber(value, lang) {
  const str = String(value);
  if (lang !== "bn") return str;
  return str.replace(/[0-9]/g, (d) => BN_DIGITS[Number(d)]);
}

function formatTooltip(label, value, unit) {
  const text = `${label} — ${value}`;
  return unit ? `${text} ${unit}` : text;
}

function valueGradientColors(values, gradEnd, gradStart) {
  const max = Math.max(...values);
  const min = Math.min(...values);
  const span = max - min;
  return values.map((v) => {
    const t = span === 0 ? 1 : (v - min) / span;
    return mixHex(gradEnd, gradStart, t);
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

function AxisYLabel({ text }) {
  if (!text) return null;
  return (
    <div className="chart-axis-y-label">
      <span>{text}</span>
    </div>
  );
}

function ChartLegend({ config, t }) {
  if (!config.severity) return null;
  return (
    <ul className="chart-legend">
      {config.datasets.map((ds, i) => (
        <li key={ds.labelKey}>
          <span className={`dot ${SEVERITY_LABEL_CLASS[i % SEVERITY_LABEL_CLASS.length]}`} />
          {t[ds.labelKey]}
        </li>
      ))}
    </ul>
  );
}

function LineChartCanvas({ config, lang, theme }) {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const tooltipRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    const tooltip = tooltipRef.current;
    if (!wrap || !canvas) return undefined;

    const isSeverity = !!config.severity;
    const tickColor = cssVar("--cream-mute");
    const gridColor = isSeverity
      ? (theme === "light" ? "rgba(26,21,16,0.08)" : "rgba(255,255,255,0.08)")
      : rgbaFromHex(cssVar("--cream"), 0.08);
    const axisColor = rgbaFromHex(cssVar("--cream"), 0.2);
    const fontFamily = cssVar("--mono");
    const seriesColors = isSeverity
      ? [cssVar("--severity-low"), cssVar("--severity-medium"), cssVar("--severity-high")]
      : [cssVar("--teal"), cssVar("--cream-soft"), cssVar("--teal-deep")];
    const labels = config.labels[lang];
    const n = labels.length;
    const yMax = config.yMax ?? niceMax(Math.max(...config.datasets.flatMap((d) => d.values)));
    const axisXTitle = config.axisX?.[lang];
    const totalDuration = isSeverity ? 4400 : 2500;

    let size = { width: 0, height: CHART_HEIGHT };
    let state = { phase: "idle", startTime: 0 };
    let lastElapsed = 0;

    function layout() {
      const padding = { top: 16, right: 16, bottom: 30, left: 34 };
      const plotW = size.width - padding.left - padding.right;
      const plotH = size.height - padding.top - padding.bottom;
      const xAt = (i) => padding.left + (plotW * i) / (n - 1);
      const yAt = (v) => padding.top + plotH - (plotH * v) / yMax;
      return { padding, plotW, plotH, xAt, yAt };
    }

    function drawGrid(ctx) {
      const { padding, plotW, plotH, xAt } = layout();
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

      if (!isSeverity) {
        ctx.strokeStyle = axisColor;
        ctx.beginPath();
        ctx.moveTo(padding.left, padding.top);
        ctx.lineTo(padding.left, padding.top + plotH);
        ctx.lineTo(padding.left + plotW, padding.top + plotH);
        ctx.stroke();
      }

      ctx.fillStyle = tickColor;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      labels.forEach((label, i) => ctx.fillText(label, xAt(i), padding.top + plotH + 8));

      if (axisXTitle) {
        ctx.textAlign = "center";
        ctx.textBaseline = "bottom";
        ctx.fillStyle = tickColor;
        ctx.fillText(axisXTitle, padding.left + plotW / 2, size.height - 2);
      }
    }

    function drawLine(ctx, values, color, exactPos, glowBlur, withDots) {
      const { xAt, yAt } = layout();
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = isSeverity ? 2 : 2.5;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.shadowColor = glowBlur > 0 ? color : "transparent";
      ctx.shadowBlur = glowBlur;
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
      ctx.shadowBlur = 0;

      if (withDots) {
        for (let i = 0; i < n; i += 1) {
          if (exactPos >= i - 0.001) {
            ctx.beginPath();
            ctx.fillStyle = color;
            ctx.arc(xAt(i), yAt(values[i]), 3, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
    }

    function drawSeverity(ctx, elapsedMs) {
      const totalSegments = n - 1;

      const lowMedRaw = Math.min(elapsedMs / 1000, 1);
      const lowMedEased = easeInOutCubic(lowMedRaw);
      const lowMedPos = lowMedEased * totalSegments;
      drawLine(ctx, config.datasets[0].values, seriesColors[0], lowMedPos, 0, false);
      drawLine(ctx, config.datasets[1].values, seriesColors[1], lowMedPos, 0, false);

      const redRaw = Math.min(Math.max((elapsedMs - 1000) / 1000, 0), 1);
      const redEased = easeInOutCubic(redRaw);
      const redPos = redEased * totalSegments;

      let glowBlur = 0;
      const pulseElapsed = elapsedMs - 2000;
      if (pulseElapsed >= 0 && pulseElapsed < 2400) {
        const pulseIndex = Math.min(Math.floor(pulseElapsed / 800), 2);
        const pulseLocal = (pulseElapsed - pulseIndex * 800) / 800;
        glowBlur = Math.sin(Math.min(Math.max(pulseLocal, 0), 1) * Math.PI) * 8;
      }
      drawLine(ctx, config.datasets[2].values, seriesColors[2], redPos, glowBlur, false);
    }

    function drawLegacy(ctx, elapsedMs) {
      const totalSegments = n - 1;
      const drawRaw = Math.min(elapsedMs / 2000, 1);
      const drawEased = easeInOutCubic(drawRaw);
      const exactPos = drawEased * totalSegments;
      const pulseRaw = Math.min(Math.max((elapsedMs - 2000) / 500, 0), 1);
      const pulseT = elapsedMs > 2000 ? pulseRaw : null;

      config.datasets.forEach((ds, si) => {
        const color = seriesColors[si % seriesColors.length];
        drawLine(ctx, ds.values, color, exactPos, 0, true);
        if (pulseT != null) {
          const bump = Math.sin(pulseT * Math.PI);
          const { xAt, yAt } = layout();
          ctx.globalAlpha = bump * 0.7;
          ctx.strokeStyle = color;
          ctx.lineWidth = 1.5;
          for (let i = 0; i < n; i += 1) {
            ctx.beginPath();
            ctx.arc(xAt(i), yAt(ds.values[i]), 3 + bump * 4, 0, Math.PI * 2);
            ctx.stroke();
          }
          ctx.globalAlpha = 1;
        }
      });
    }

    function draw(elapsedMs) {
      if (!size.width) return;
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, size.width, size.height);
      drawGrid(ctx);
      if (isSeverity) {
        drawSeverity(ctx, elapsedMs);
      } else {
        drawLegacy(ctx, elapsedMs);
      }
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

    function nearestPoint(mx, my) {
      const { xAt, yAt } = layout();
      let best = null;
      let bestDist = 16;
      config.datasets.forEach((ds) => {
        ds.values.forEach((v, i) => {
          const dist = Math.hypot(xAt(i) - mx, yAt(v) - my);
          if (dist < bestDist) {
            bestDist = dist;
            best = { x: xAt(i), y: yAt(v), xLabel: labels[i], v };
          }
        });
      });
      return best;
    }

    function handlePointer(e) {
      if (!tooltip) return;
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const best = nearestPoint(mx, my);
      if (best) {
        tooltip.style.opacity = "1";
        tooltip.style.left = `${best.x}px`;
        tooltip.style.top = `${best.y}px`;
        tooltip.textContent = `${best.xLabel} — ${localizeNumber(best.v, lang)}`;
      } else {
        tooltip.style.opacity = "0";
      }
    }

    function handlePointerLeave() {
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

    canvas.addEventListener("pointermove", handlePointer);
    canvas.addEventListener("pointerdown", handlePointer);
    canvas.addEventListener("pointerleave", handlePointerLeave);

    return () => {
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      canvas.removeEventListener("pointermove", handlePointer);
      canvas.removeEventListener("pointerdown", handlePointer);
      canvas.removeEventListener("pointerleave", handlePointerLeave);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config, lang, theme]);

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

    const fontFamily = cssVar("--mono");
    const labels = config.labels[lang];
    const { values } = config;
    const n = values.length;
    const unit = config.unit?.[lang] ?? "";
    const colors =
      config.variant === "country"
        ? config.countries.map((id) => cssVar(`--country-${id}`))
        : valueGradientColors(values, cssVar("--chart-gradient-end"), cssVar("--chart-gradient-start"));
    const yMax = config.yMax ?? niceMax(Math.max(...values));

    const STAGGER_MS = 80;
    const BAR_DURATION_MS = 1200;
    const totalDuration = (n - 1) * STAGGER_MS + BAR_DURATION_MS;

    let size = { width: 0, height: CHART_HEIGHT };
    let state = { phase: "idle", startTime: 0 };
    let lastElapsed = 0;

    function layout() {
      const padding = { top: 26, right: 12, bottom: 10, left: 12 };
      const plotW = size.width - padding.left - padding.right;
      const plotH = size.height - padding.top - padding.bottom;
      const slot = plotW / n;
      const barWidth = Math.min(64, slot * 0.72);
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

      values.forEach((v, i) => {
        const { x, y, w, h, baselineY } = barRect(i, elapsedMs);
        const color = colors[i % colors.length];
        if (h > 0) {
          ctx.fillStyle = color;
          roundRectTop(ctx, x, y, w, h, 4);
          ctx.fill();
        }

        const label = labels[i];
        if (!label) return;

        if (h > 28) {
          ctx.save();
          ctx.translate(x + w / 2, y + h - 8);
          ctx.rotate(-Math.PI / 2);
          ctx.fillStyle = "#FFFFFF";
          ctx.font = `8px ${fontFamily}`;
          ctx.textAlign = "left";
          ctx.textBaseline = "middle";
          ctx.fillText(label, 0, 0);
          ctx.restore();
        } else {
          const labelY = h > 0 ? y - 4 : baselineY - 4;
          ctx.save();
          ctx.fillStyle = color;
          ctx.font = `8px ${fontFamily}`;
          ctx.textAlign = "center";
          ctx.textBaseline = "bottom";
          ctx.fillText(label, x + w / 2, labelY);
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

    function handlePointer(e) {
      if (!tooltip) return;
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      let hit = null;
      values.forEach((v, i) => {
        const { x, y, w, baselineY } = barRect(i, lastElapsed);
        const top = Math.min(y, baselineY - 24);
        if (mx >= x && mx <= x + w && my >= top && my <= baselineY) {
          hit = { x: x + w / 2, y: Math.min(y, baselineY - 4), i };
        }
      });
      if (hit) {
        tooltip.style.opacity = "1";
        tooltip.style.left = `${hit.x}px`;
        tooltip.style.top = `${hit.y}px`;
        tooltip.textContent = formatTooltip(labels[hit.i], localizeNumber(values[hit.i], lang), unit);
      } else {
        tooltip.style.opacity = "0";
      }
    }

    function handlePointerLeave() {
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

    canvas.addEventListener("pointermove", handlePointer);
    canvas.addEventListener("pointerdown", handlePointer);
    canvas.addEventListener("pointerleave", handlePointerLeave);

    return () => {
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      canvas.removeEventListener("pointermove", handlePointer);
      canvas.removeEventListener("pointerdown", handlePointer);
      canvas.removeEventListener("pointerleave", handlePointerLeave);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config, lang]);

  return (
    <div
      ref={wrapRef}
      className="chart-canvas-outer chart-canvas-outer--bar"
      style={{ height: `${CHART_HEIGHT}px` }}
    >
      <canvas ref={canvasRef} style={{ width: "100%", height: `${CHART_HEIGHT}px`, display: "block" }} />
      <div ref={tooltipRef} className="chart-tooltip" />
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
      canvas = <LineChartCanvas key={theme} config={config} lang={lang} theme={theme} />;
    }
  }

  return (
    <div className="chart-block" ref={ref}>
      <div className="chart-label">{title}</div>
      {sub && <p className="chart-sub">{sub}</p>}
      {config && <ChartLegend config={config} t={t} />}
      <div className="chart-placeholder">{config ? canvas : "Chart loads here"}</div>
      {note && <div className="chart-note">{note}</div>}
    </div>
  );
}

export default ChartBlock;
