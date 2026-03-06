'use client';

import { useEffect, useRef } from 'react';

interface CircularGaugeProps {
  score: number;        // 0–100
  size?: number;        // svg viewBox size
  strokeWidth?: number;
  color: string;
  trackColor?: string;
  children?: React.ReactNode;
  animate?: boolean;
}

// Converts polar angle (degrees, 0=top) to SVG cartesian coords
function polar(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arcPath(cx: number, cy: number, r: number, startDeg: number, endDeg: number) {
  const s = polar(cx, cy, r, startDeg);
  const e = polar(cx, cy, r, endDeg);
  const largeArc = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${s.x} ${s.y} A ${r} ${r} 0 ${largeArc} 1 ${e.x} ${e.y}`;
}

// Gauge arc: 135° → 405° (270° total, starting bottom-left, ending bottom-right)
const START_DEG = 135;
const TOTAL_DEG = 270;

export default function CircularGauge({
  score,
  size = 200,
  strokeWidth = 12,
  color,
  trackColor = '#1f1f1f',
  children,
  animate = true,
}: CircularGaugeProps) {
  const cx = size / 2;
  const cy = size / 2;
  const r = (size - strokeWidth * 2 - 4) / 2;
  const circumference = (TOTAL_DEG / 360) * 2 * Math.PI * r;
  const endDeg = START_DEG + TOTAL_DEG;

  const clampedScore = Math.max(0, Math.min(100, score));
  const fillDeg = START_DEG + (clampedScore / 100) * TOTAL_DEG;

  const arcRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    if (!animate || !arcRef.current) return;
    const el = arcRef.current;
    el.style.strokeDasharray = `${circumference}`;
    el.style.strokeDashoffset = `${circumference}`;
    // Force reflow
    void el.getBoundingClientRect();
    el.style.transition = 'stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)';
    el.style.strokeDashoffset = `${circumference * (1 - clampedScore / 100)}`;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [score]);

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      width={size}
      height={size}
      className="overflow-visible"
    >
      {/* Track */}
      <path
        d={arcPath(cx, cy, r, START_DEG, endDeg)}
        fill="none"
        stroke={trackColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      {/* Fill */}
      <path
        ref={arcRef}
        d={arcPath(cx, cy, r, START_DEG, fillDeg)}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        style={
          animate
            ? undefined
            : {
                strokeDasharray: circumference,
                strokeDashoffset: circumference * (1 - clampedScore / 100),
              }
        }
      />
      {/* Glow dot at tip */}
      {clampedScore > 2 && (
        <circle
          cx={polar(cx, cy, r, fillDeg).x}
          cy={polar(cx, cy, r, fillDeg).y}
          r={strokeWidth / 2}
          fill={color}
          style={{ filter: `drop-shadow(0 0 6px ${color})` }}
        />
      )}
      {/* Center content */}
      {children && (
        <foreignObject x={cx - r * 0.7} y={cy - r * 0.7} width={r * 1.4} height={r * 1.4}>
          <div
            // @ts-expect-error - xmlns is valid
            xmlns="http://www.w3.org/1999/xhtml"
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {children}
          </div>
        </foreignObject>
      )}
    </svg>
  );
}
