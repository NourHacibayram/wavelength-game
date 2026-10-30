import React, { useId } from 'react';

export interface TutorialSceneProps {
  step: number; // 0 | 1 | 2 | 3
  animT: number; // 0..1 entrance progress for current step
  clock: number; // continuous seconds for idle/loop motion
  lang: 'ar' | 'en';
}

/* Math Helpers for Pure Native SVG Geometry */
export function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function easeOutCubic(t: number): number {
  const c = clamp01(t);
  return 1 - Math.pow(1 - c, 3);
}

export function easeOutBack(t: number): number {
  const c = clamp01(t);
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(c - 1, 3) + c1 * Math.pow(c - 1, 2);
}

export function polarToXY(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

export function describeArcWedge(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number
): string {
  const s = Math.max(-90, Math.min(90, startAngle));
  const e = Math.max(-90, Math.min(90, endAngle));
  if (e - s <= 0.1) return '';
  const pStart = polarToXY(cx, cy, r, s);
  const pEnd = polarToXY(cx, cy, r, e);
  const largeArc = e - s <= 180 ? '0' : '1';
  return `M ${cx} ${cy} L ${pStart.x.toFixed(2)} ${pStart.y.toFixed(2)} A ${r} ${r} 0 ${largeArc} 1 ${pEnd.x.toFixed(2)} ${pEnd.y.toFixed(2)} Z`;
}

/**
 * Shared Cartoon Stage Backdrop (520 x 240 viewBox) with Collision-Free Scoped <defs> IDs
 */
export const StageBackdrop: React.FC<{
  bg?: string;
  accent?: string;
  children: React.ReactNode;
}> = ({ bg = '#1e1942', accent = '#ffca3a', children }) => {
  const rawId = useId();
  const safeUid = rawId.replace(/[^a-zA-Z0-9_-]/g, '');
  const dotsId = `tutDots_${safeUid}`;
  const glowId = `tutGlow_${safeUid}`;

  return (
    <svg
      viewBox="0 0 520 240"
      className="w-full h-auto block select-none overflow-hidden"
      style={{ fontFamily: "'Baloo Bhaijaan 2', system-ui, sans-serif" }}
    >
      <defs>
        <pattern
          id={dotsId}
          x="0"
          y="0"
          width="26"
          height="26"
          patternUnits="userSpaceOnUse"
        >
          <circle cx="4" cy="4" r="1.6" fill="rgba(255,255,255,0.08)" />
        </pattern>
        <radialGradient id={glowId} cx="50%" cy="48%" r="58%">
          <stop offset="0%" stopColor={accent} stopOpacity="0.18" />
          <stop offset="100%" stopColor={bg} stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect x="0" y="0" width="520" height="240" rx="20" fill={bg} />
      <rect x="0" y="0" width="520" height="240" rx="20" fill={`url(#${dotsId})`} />
      <rect x="0" y="0" width="520" height="240" rx="20" fill={`url(#${glowId})`} />

      {/* Subtle Table Shadow Floor */}
      <ellipse cx="260" cy="220" rx="210" ry="12" fill="rgba(10, 8, 24, 0.32)" />

      {children}
    </svg>
  );
};

/**
 * Crisp Pure-Vector Icons (No font glyph dependency!)
 */
export const SvgCheckMark: React.FC<{
  x: number;
  y: number;
  size?: number;
  color?: string;
}> = ({ x, y, size = 1, color = '#15803d' }) => (
  <g transform={`translate(${x}, ${y}) scale(${size})`}>
    <path
      d="M -6 0.5 L -2 4.5 L 6.5 -4.5"
      fill="none"
      stroke={color}
      strokeWidth="3.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </g>
);

export const SvgCrossMark: React.FC<{
  x: number;
  y: number;
  size?: number;
  color?: string;
}> = ({ x, y, size = 1, color = '#b91c1c' }) => (
  <g transform={`translate(${x}, ${y}) scale(${size})`}>
    <path
      d="M -4.5 -4.5 L 4.5 4.5 M 4.5 -4.5 L -4.5 4.5"
      fill="none"
      stroke={color}
      strokeWidth="2.8"
      strokeLinecap="round"
    />
  </g>
);

export const SvgDoubleArrow: React.FC<{
  x: number;
  y: number;
  color?: string;
}> = ({ x, y, color = '#161426' }) => (
  <g transform={`translate(${x}, ${y})`}>
    <path
      d="M -5.5 0 L 5.5 0 M -2.5 -3 L -5.5 0 L -2.5 3 M 2.5 -3 L 5.5 0 L 2.5 3"
      fill="none"
      stroke={color}
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </g>
);

/**
 * Cute Cartoon Player Avatar Token inside SVG (100% pure native SVG transforms!)
 */
export const SvgPlayerAvatar: React.FC<{
  x: number;
  y: number;
  color: string;
  label: string;
  scale?: number;
  highlight?: boolean;
  suspect?: boolean;
  crown?: boolean;
  clock?: number;
}> = ({
  x,
  y,
  color,
  label,
  scale = 1,
  highlight = false,
  suspect = false,
  crown = false,
  clock = 0,
}) => {
  const pulseR = 29.5 + Math.sin(clock * 5) * 2;
  const ringRot = (clock * 38) % 360;

  return (
    <g transform={`translate(${x}, ${y}) scale(${scale})`}>
      {highlight && (
        <circle
          cx="0"
          cy="0"
          r="28.5"
          fill="none"
          stroke="#ffca3a"
          strokeWidth="3.2"
          strokeDasharray="6 5"
          transform={`rotate(${ringRot}, 0, 0)`}
        />
      )}
      {suspect && (
        <circle
          cx="0"
          cy="0"
          r={pulseR}
          fill="rgba(255, 89, 94, 0.25)"
          stroke="#ff595e"
          strokeWidth="3.5"
        />
      )}

      {/* Shadow */}
      <circle cx="0" cy="4" r="21" fill="#120f29" />
      {/* Head Circle */}
      <circle cx="0" cy="0" r="21" fill={color} stroke="#161426" strokeWidth="3.5" />
      {/* Highlight Specular */}
      <path
        d="M -10 -9 A 13 13 0 0 1 6 -13"
        fill="none"
        stroke="rgba(255,255,255,0.55)"
        strokeWidth="2.8"
        strokeLinecap="round"
      />
      {/* Eyes */}
      <circle cx="-6.5" cy="-2" r="2.6" fill="#161426" />
      <circle cx="6.5" cy="-2" r="2.6" fill="#161426" />
      {/* Smile or Smirk */}
      {suspect ? (
        <path
          d="M -6 7 Q 0 4 7 8"
          fill="none"
          stroke="#161426"
          strokeWidth="2.6"
          strokeLinecap="round"
        />
      ) : (
        <path
          d="M -6.5 5 Q 0 11.5 6.5 5"
          fill="none"
          stroke="#161426"
          strokeWidth="2.6"
          strokeLinecap="round"
        />
      )}

      {/* Optional Crown */}
      {crown && (
        <polygon
          points="-11,-21 -6,-30 0,-24 6,-30 11,-21"
          fill="#ffca3a"
          stroke="#161426"
          strokeWidth="2.4"
          strokeLinejoin="round"
        />
      )}

      {/* Generous Name Pill (72px wide for clean margins in AR & EN!) */}
      <rect
        x="-36"
        y="16"
        width="72"
        height="18"
        rx="9"
        fill="#fff9ec"
        stroke="#161426"
        strokeWidth="2.5"
      />
      <text
        x="0"
        y="25.5"
        textAnchor="middle"
        dominantBaseline="central"
        fill="#161426"
        fontSize="10.2"
        fontWeight="800"
        style={{ unicodeBidi: 'plaintext' }}
      >
        {label}
      </text>
    </g>
  );
};

/**
 * Cartoon Speech / Info Pill inside SVG
 */
export const SvgPill: React.FC<{
  x: number;
  y: number;
  w?: number;
  h?: number;
  bg?: string;
  fg?: string;
  text: string;
  fontSize?: number;
  scale?: number;
}> = ({
  x,
  y,
  w = 140,
  h = 28,
  bg = '#fff9ec',
  fg = '#161426',
  text,
  fontSize = 11.5,
  scale = 1,
}) => {
  return (
    <g transform={`translate(${x}, ${y}) scale(${Math.max(0.01, scale)})`}>
      <rect
        x={-w / 2}
        y={-h / 2 + 2.5}
        width={w}
        height={h}
        rx={h / 2}
        fill="#120f29"
      />
      <rect
        x={-w / 2}
        y={-h / 2}
        width={w}
        height={h}
        rx={h / 2}
        fill={bg}
        stroke="#161426"
        strokeWidth="2.8"
      />
      <text
        x="0"
        y="0.5"
        textAnchor="middle"
        dominantBaseline="central"
        fill={fg}
        fontSize={fontSize}
        fontWeight="800"
        style={{ unicodeBidi: 'plaintext' }}
      >
        {text}
      </text>
    </g>
  );
};

/**
 * Celebratory Score / Result Burst Badge (Pure Native SVG Pop + Optional Bob!)
 */
export const SvgScoreBadge: React.FC<{
  x: number;
  y: number;
  w?: number;
  text: string;
  bg?: string;
  fg?: string;
  animT?: number;
  clock?: number;
}> = ({
  x,
  y,
  w = 180,
  text,
  bg = '#8ac926',
  fg = '#161426',
  animT = 1,
  clock = 0,
}) => {
  const s = Math.max(0.01, easeOutBack(animT));
  const bobY = animT >= 1 ? Math.sin(clock * 4) * 2.2 : 0;

  return (
    <g transform={`translate(${x}, ${y + bobY}) scale(${s})`}>
      <rect
        x={-w / 2}
        y="-13"
        width={w}
        height="31"
        rx="15.5"
        fill="#120f29"
      />
      <rect
        x={-w / 2}
        y="-16"
        width={w}
        height="31"
        rx="15.5"
        fill={bg}
        stroke="#161426"
        strokeWidth="3"
      />
      <text
        x="0"
        y="-0.5"
        textAnchor="middle"
        dominantBaseline="central"
        fill={fg}
        fontSize="11.5"
        fontWeight="900"
        style={{ unicodeBidi: 'plaintext' }}
      >
        {text}
      </text>
    </g>
  );
};
