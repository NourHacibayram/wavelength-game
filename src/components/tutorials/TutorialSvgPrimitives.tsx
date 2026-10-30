import React from 'react';
import { motion } from 'motion/react';

export interface TutorialSceneProps {
  step: number; // 0 | 1 | 2 | 3
  lang: 'ar' | 'en';
}

/**
 * Shared Cartoon Stage Backdrop (520 x 240 viewBox)
 */
export const StageBackdrop: React.FC<{
  bg?: string;
  accent?: string;
  children: React.ReactNode;
}> = ({ bg = '#1e1942', accent = '#ffca3a', children }) => {
  return (
    <svg
      viewBox="0 0 520 240"
      className="w-full h-auto block select-none overflow-hidden"
      style={{ fontFamily: "'Baloo Bhaijaan 2', system-ui, sans-serif" }}
    >
      <defs>
        <pattern
          id="tutorialDots"
          x="0"
          y="0"
          width="26"
          height="26"
          patternUnits="userSpaceOnUse"
        >
          <circle cx="4" cy="4" r="1.6" fill="rgba(255,255,255,0.08)" />
        </pattern>
        <radialGradient id="stageGlow" cx="50%" cy="48%" r="58%">
          <stop offset="0%" stopColor={accent} stopOpacity="0.18" />
          <stop offset="100%" stopColor={bg} stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Main Stage Background */}
      <rect x="0" y="0" width="520" height="240" rx="20" fill={bg} />
      <rect x="0" y="0" width="520" height="240" rx="20" fill="url(#tutorialDots)" />
      <rect x="0" y="0" width="520" height="240" rx="20" fill="url(#stageGlow)" />

      {/* Subtle Table Felt / Floor Line */}
      <ellipse cx="260" cy="216" rx="210" ry="14" fill="rgba(10, 8, 24, 0.32)" />

      {children}
    </svg>
  );
};

/**
 * Cute Cartoon Player Avatar Token inside SVG
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
}> = ({
  x,
  y,
  color,
  label,
  scale = 1,
  highlight = false,
  suspect = false,
  crown = false,
}) => {
  return (
    <g transform={`translate(${x}, ${y}) scale(${scale})`}>
      {highlight && (
        <motion.circle
          cx="0"
          cy="0"
          r="30"
          fill="none"
          stroke="#ffca3a"
          strokeWidth="3.5"
          strokeDasharray="6 5"
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
        />
      )}
      {suspect && (
        <motion.circle
          cx="0"
          cy="0"
          r="31"
          fill="rgba(255, 89, 94, 0.25)"
          stroke="#ff595e"
          strokeWidth="3.5"
          animate={{ scale: [1, 1.12, 1] }}
          transition={{ duration: 1.1, repeat: Infinity }}
        />
      )}

      {/* Shadow */}
      <circle cx="0" cy="4" r="22" fill="#120f29" />
      {/* Head Circle */}
      <circle cx="0" cy="0" r="22" fill={color} stroke="#161426" strokeWidth="3.5" />
      {/* Highlight Specular */}
      <path
        d="M -11 -10 A 14 14 0 0 1 6 -14"
        fill="none"
        stroke="rgba(255,255,255,0.55)"
        strokeWidth="3"
        strokeLinecap="round"
      />
      {/* Eyes */}
      <circle cx="-7" cy="-2" r="2.8" fill="#161426" />
      <circle cx="7" cy="-2" r="2.8" fill="#161426" />
      {/* Smile or Smirk */}
      {suspect ? (
        <path
          d="M -6 7 Q 0 4 7 8"
          fill="none"
          stroke="#161426"
          strokeWidth="2.8"
          strokeLinecap="round"
        />
      ) : (
        <path
          d="M -7 5 Q 0 12 7 5"
          fill="none"
          stroke="#161426"
          strokeWidth="2.8"
          strokeLinecap="round"
        />
      )}

      {/* Optional Crown */}
      {crown && (
        <polygon
          points="-12,-22 -7,-32 0,-25 7,-32 12,-22"
          fill="#ffca3a"
          stroke="#161426"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
      )}

      {/* Name Pill */}
      <rect
        x="-30"
        y="17"
        width="60"
        height="18"
        rx="9"
        fill="#fff9ec"
        stroke="#161426"
        strokeWidth="2.5"
      />
      <text
        x="0"
        y="26.5"
        textAnchor="middle"
        dominantBaseline="central"
        fill="#161426"
        fontSize="10.5"
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
}> = ({
  x,
  y,
  w = 130,
  h = 30,
  bg = '#fff9ec',
  fg = '#161426',
  text,
  fontSize = 12.5,
}) => {
  return (
    <g transform={`translate(${x}, ${y})`}>
      <rect
        x={-w / 2}
        y={-h / 2 + 3}
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
        strokeWidth="3"
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
 * Celebratory Score / Result Burst Badge
 */
export const SvgScoreBadge: React.FC<{
  x: number;
  y: number;
  text: string;
  bg?: string;
}> = ({ x, y, text, bg = '#8ac926' }) => {
  return (
    <g transform={`translate(${x}, ${y})`}>
      <motion.g
        initial={{ scale: 0, rotate: -10 }}
        animate={{ scale: [0, 1.14, 1], rotate: [-10, 4, 0] }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
      >
        <rect
          x="-68"
          y="-16"
          width="136"
          height="34"
          rx="17"
          fill="#120f29"
        />
        <rect
          x="-68"
          y="-19"
          width="136"
          height="34"
          rx="17"
          fill={bg}
          stroke="#161426"
          strokeWidth="3.2"
        />
        <text
          x="0"
          y="-1.5"
          textAnchor="middle"
          dominantBaseline="central"
          fill="#161426"
          fontSize="13"
          fontWeight="900"
          style={{ unicodeBidi: 'plaintext' }}
        >
          {text}
        </text>
      </motion.g>
    </g>
  );
};
