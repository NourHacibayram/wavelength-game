import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'motion/react';
import {
  Crown,
  Trophy,
  DiceSix,
  Lightning,
  ShieldCheck,
  RocketLaunch,
  ArrowsLeftRight,
  ArrowsClockwise,
  Sparkle,
  Robot,
  Play,
  Flame,
  WarningCircle,
} from '@phosphor-icons/react';

export const BOT_PLAYER_ID = 'snakes-bot-1';

export type SnakesEventType =
  | 'none'
  | 'ladder'
  | 'snake'
  | 'shield_block'
  | 'power_rocket'
  | 'power_shield'
  | 'power_swap'
  | 'power_swap_boost'
  | 'power_turbo'
  | 'power_banana'
  | 'win';

export interface SnakesLastMove {
  seq: number;
  playerId: string;
  dice: number;
  startSq: number;
  hopPath: number[];
  landedSq: number;
  finalSq: number;
  eventType: SnakesEventType;
  swappedWithId?: string | null;
  swappedFromSq?: number | null;
  gotBonusTurn: boolean;
  cappedThirdSix: boolean;
}

export interface SnakesHistoryEntry {
  seq: number;
  playerId: string;
  dice: number;
  fromSq: number;
  landedSq: number;
  toSq: number;
  eventType: SnakesEventType;
  swappedWithId?: string | null;
  gotBonusTurn: boolean;
}

export interface SnakesGameState {
  boardType: 'snakes';
  phase: 'playing' | 'finished';
  positions: Record<string, number>;
  turnIndex: number;
  playerOrder: string[];
  shields: Record<string, boolean>;
  consecutiveSixes: number;
  partyMode: boolean;
  winnerId: string | null;
  moveSeq: number;
  lastMove: SnakesLastMove | null;
  history: SnakesHistoryEntry[];
}

interface PlayerInfo {
  id: string;
  name: string;
  avatar_color: string;
  score: number;
}

export interface SnakesGameProps {
  gameData: SnakesGameState;
  players: PlayerInfo[];
  myPlayerId: string;
  isHost: boolean;
  isPassAndPlay: boolean;
  lang: 'ar' | 'en';
  onUpdateGameData: (
    nextData: SnakesGameState,
    scoreAwards?: Record<string, number>
  ) => void;
  onStartNewRound: () => void;
}

interface LadderDef {
  from: number;
  to: number;
  golden?: boolean;
}

interface SnakeDef {
  head: number;
  tail: number;
  bodyColor: string;
  patternColor: string;
  bellyColor: string;
  waves: number;
  amp: number;
  isRoyalCobra?: boolean;
  nameAr: string;
  nameEn: string;
}

type PowerTileKind = 'rocket' | 'shield' | 'swap' | 'turbo' | 'banana';

interface PowerTileDef {
  square: number;
  kind: PowerTileKind;
  badgeText: string;
  bgFill: string;
  accentFill: string;
  labelAr: string;
  labelEn: string;
}

const LADDERS: LadderDef[] = [
  { from: 4, to: 25, golden: true },
  { from: 13, to: 46, golden: true },
  { from: 21, to: 42 },
  { from: 33, to: 49 },
  { from: 50, to: 69 },
  { from: 62, to: 81 },
  { from: 71, to: 92, golden: true },
  { from: 80, to: 96 },
];

const SNAKES: SnakeDef[] = [
  {
    head: 24,
    tail: 7,
    bodyColor: '#10b981',
    patternColor: '#047857',
    bellyColor: '#a7f3d0',
    waves: 2,
    amp: 34,
    nameAr: 'الأفعى الزمردية',
    nameEn: 'Emerald Viper',
  },
  {
    head: 38,
    tail: 15,
    bodyColor: '#f97316',
    patternColor: '#c2410c',
    bellyColor: '#fef08a',
    waves: 2,
    amp: -36,
    nameAr: 'ثعبان المرجان',
    nameEn: 'Coral Python',
  },
  {
    head: 47,
    tail: 26,
    bodyColor: '#06b6d4',
    patternColor: '#0e7490',
    bellyColor: '#cffafe',
    waves: 2,
    amp: 30,
    nameAr: 'مامبا الجليد',
    nameEn: 'Cyan Mamba',
  },
  {
    head: 56,
    tail: 34,
    bodyColor: '#ec4899',
    patternColor: '#9d174d',
    bellyColor: '#fbcfe8',
    waves: 2,
    amp: -32,
    nameAr: 'أفعى الفوشيا',
    nameEn: 'Magenta Boa',
  },
  {
    head: 67,
    tail: 45,
    bodyColor: '#84cc16',
    patternColor: '#3f6212',
    bellyColor: '#ecfccb',
    waves: 2,
    amp: 32,
    nameAr: 'الأفعى المجلجلة',
    nameEn: 'Lime Rattler',
  },
  {
    head: 76,
    tail: 52,
    bodyColor: '#6366f1',
    patternColor: '#312e81',
    bellyColor: '#e0e7ff',
    waves: 3,
    amp: -34,
    nameAr: 'ثعبان البرق',
    nameEn: 'Indigo Adder',
  },
  {
    head: 88,
    tail: 55,
    bodyColor: '#ef4444',
    patternColor: '#991b1b',
    bellyColor: '#fde047',
    waves: 3,
    amp: 36,
    nameAr: 'الأفعى القرمزية',
    nameEn: 'Crimson Fang',
  },
  {
    head: 99,
    tail: 41,
    bodyColor: '#9333ea',
    patternColor: '#581c87',
    bellyColor: '#facc15',
    waves: 4,
    amp: 34,
    isRoyalCobra: true,
    nameAr: 'الكوبرا الملكية',
    nameEn: 'Royal Cobra',
  },
];

const POWER_TILES: PowerTileDef[] = [
  {
    square: 9,
    kind: 'rocket',
    badgeText: '+5',
    bgFill: '#ffedd5',
    accentFill: '#f97316',
    labelAr: 'صاروخ نيترو (+5)',
    labelEn: 'Nitro Rocket (+5)',
  },
  {
    square: 29,
    kind: 'shield',
    badgeText: 'SHIELD',
    bgFill: '#e0f2fe',
    accentFill: '#0284c7',
    labelAr: 'درع ضد الثعابين',
    labelEn: 'Anti-Snake Shield',
  },
  {
    square: 58,
    kind: 'swap',
    badgeText: 'SWAP',
    bgFill: '#f3e8ff',
    accentFill: '#9333ea',
    labelAr: 'تبادل مع المتصدر',
    labelEn: 'Swap with 1st',
  },
  {
    square: 74,
    kind: 'turbo',
    badgeText: '+6',
    bgFill: '#fef9c3',
    accentFill: '#eab308',
    labelAr: 'قفزة مضاعفة (+6)',
    labelEn: 'Turbo Jump (+6)',
  },
  {
    square: 84,
    kind: 'banana',
    badgeText: '-4',
    bgFill: '#fef3c7',
    accentFill: '#d97706',
    labelAr: 'قشرة موزة (-4)',
    labelEn: 'Banana Slip (-4)',
  },
];

const LADDERS_BY_FROM: Record<number, LadderDef> = Object.fromEntries(
  LADDERS.map((l) => [l.from, l])
);

const SNAKES_BY_HEAD: Record<number, SnakeDef> = Object.fromEntries(
  SNAKES.map((s) => [s.head, s])
);

const POWER_BY_SQUARE: Record<number, PowerTileDef> = Object.fromEntries(
  POWER_TILES.map((p) => [p.square, p])
);

const TILE_PALETTE = [
  '#fff9ec',
  '#fde68a',
  '#bae6fd',
  '#bbf7d0',
  '#fbcfe8',
  '#fed7aa',
];

export function buildInitialSnakesState(playerIds: string[]): SnakesGameState {
  const cleanIds = playerIds.length > 0 ? [...playerIds] : ['host'];
  const order =
    cleanIds.length === 1 ? [cleanIds[0], BOT_PLAYER_ID] : cleanIds;

  const positions: Record<string, number> = {};
  for (const id of order) {
    positions[id] = 1;
  }

  return {
    boardType: 'snakes',
    phase: 'playing',
    positions,
    turnIndex: 0,
    playerOrder: order,
    shields: {},
    consecutiveSixes: 0,
    partyMode: true,
    winnerId: null,
    moveSeq: 0,
    lastMove: null,
    history: [],
  };
}

function getSquareCenter(sq: number): {
  cx: number;
  cy: number;
  x: number;
  y: number;
  rowFromBottom: number;
  rowFromTop: number;
  col: number;
} {
  const clamped = Math.max(1, Math.min(100, sq));
  const zeroIdx = clamped - 1;
  const rowFromBottom = Math.floor(zeroIdx / 10);
  const rowFromTop = 9 - rowFromBottom;
  const colInRow = zeroIdx % 10;
  const col = rowFromBottom % 2 === 0 ? colInRow : 9 - colInRow;
  const x = col * 100;
  const y = rowFromTop * 100;
  return {
    cx: x + 50,
    cy: y + 50,
    x,
    y,
    rowFromBottom,
    rowFromTop,
    col,
  };
}

function sampleSnakePoint(
  snake: SnakeDef,
  t: number
): { x: number; y: number } {
  const headPt = getSquareCenter(snake.head);
  const tailPt = getSquareCenter(snake.tail);
  const dx = tailPt.cx - headPt.cx;
  const dy = tailPt.cy - headPt.cy;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;

  const clampedT = Math.max(0, Math.min(1, t));
  const envelope = Math.sin(Math.PI * clampedT);
  const wave = Math.sin(clampedT * Math.PI * snake.waves) * snake.amp * envelope;

  const rawX = headPt.cx + dx * clampedT + nx * wave;
  const rawY = headPt.cy + dy * clampedT + ny * wave;

  return {
    x: Math.max(28, Math.min(972, rawX)),
    y: Math.max(28, Math.min(972, rawY)),
  };
}

function buildSnakeSvgPath(snake: SnakeDef, shiftX = 0, shiftY = 0): string {
  const steps = 40;
  const pts: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const pt = sampleSnakePoint(snake, i / steps);
    const cmd = i === 0 ? 'M' : 'L';
    pts.push(`${cmd} ${(pt.x + shiftX).toFixed(1)} ${(pt.y + shiftY).toFixed(1)}`);
  }
  return pts.join(' ');
}

function getClusterOffset(
  idxInSquare: number,
  totalInSquare: number
): { ox: number; oy: number } {
  if (totalInSquare <= 1) return { ox: 0, oy: 4 };
  if (totalInSquare === 2) {
    return idxInSquare === 0 ? { ox: -18, oy: 6 } : { ox: 18, oy: 6 };
  }
  if (totalInSquare === 3) {
    const map = [
      { ox: -18, oy: 14 },
      { ox: 18, oy: 14 },
      { ox: 0, oy: -12 },
    ];
    return map[idxInSquare] || { ox: 0, oy: 0 };
  }
  if (totalInSquare === 4) {
    const map = [
      { ox: -18, oy: -10 },
      { ox: 18, oy: -10 },
      { ox: -18, oy: 16 },
      { ox: 18, oy: 16 },
    ];
    return map[idxInSquare] || { ox: 0, oy: 0 };
  }
  const angle = (idxInSquare / totalInSquare) * Math.PI * 2 - Math.PI / 2;
  return {
    ox: Math.cos(angle) * 22,
    oy: Math.sin(angle) * 22 + 3,
  };
}

/* Custom 3D-feel SVG Die (1..6) */
const Die3DSvg: React.FC<{
  face: number;
  rolling: boolean;
  highlightSix?: boolean;
}> = ({ face, rolling, highlightSix }) => {
  const pipMap: Record<number, Array<[number, number]>> = {
    1: [[50, 50]],
    2: [
      [29, 29],
      [71, 71],
    ],
    3: [
      [28, 28],
      [50, 50],
      [72, 72],
    ],
    4: [
      [29, 29],
      [71, 29],
      [29, 71],
      [71, 71],
    ],
    5: [
      [28, 28],
      [72, 28],
      [50, 50],
      [28, 72],
      [72, 72],
    ],
    6: [
      [29, 25],
      [71, 25],
      [29, 50],
      [71, 50],
      [29, 75],
      [71, 75],
    ],
  };

  const pips = pipMap[face] || pipMap[1];
  const isSix = face === 6;

  return (
    <motion.div
      animate={
        rolling
          ? {
              rotate: [0, -18, 22, -14, 18, 0],
              scale: [1, 1.12, 0.94, 1.1, 1],
              y: [0, -10, 2, -6, 0],
            }
          : { rotate: 0, scale: 1, y: 0 }
      }
      transition={{ duration: 0.38, ease: 'easeInOut' }}
      className="relative w-24 h-24 sm:w-28 sm:h-28 select-none shrink-0"
    >
      <svg viewBox="0 0 100 108" className="w-full h-full overflow-visible">
        {/* Drop shadow */}
        <rect
          x="10"
          y="18"
          width="84"
          height="84"
          rx="20"
          fill="rgba(22,20,38,0.35)"
        />
        {/* 3D Bottom Extrusion Lip */}
        <rect
          x="6"
          y="13"
          width="88"
          height="88"
          rx="20"
          fill={isSix && highlightSix ? '#eab308' : '#cbd5e1'}
          stroke="#161426"
          strokeWidth="5"
        />
        {/* Top Cube Face */}
        <rect
          x="6"
          y="5"
          width="88"
          height="88"
          rx="20"
          fill={isSix && highlightSix ? '#fef9c3' : '#fffef9'}
          stroke="#161426"
          strokeWidth="5"
        />
        {/* Glossy Top Bevel Highlight */}
        <path
          d="M 22 13 H 78 A 10 10 0 0 1 86 21"
          fill="none"
          stroke="#ffffff"
          strokeWidth="4"
          strokeLinecap="round"
          opacity="0.85"
        />
        {/* Pips */}
        {pips.map(([px, py], i) => (
          <g key={i}>
            <circle
              cx={px}
              cy={py - 4 + 2}
              r={face === 1 ? 11.5 : 8}
              fill="rgba(22,20,38,0.18)"
            />
            <circle
              cx={px}
              cy={py - 4}
              r={face === 1 ? 11.5 : 8}
              fill={
                face === 1
                  ? '#ef4444'
                  : isSix
                  ? '#d97706'
                  : '#161426'
              }
              stroke="#161426"
              strokeWidth={face === 1 || isSix ? '2.5' : '0'}
            />
            <circle
              cx={px - 2.5}
              cy={py - 6.5}
              r={face === 1 ? 3 : 2}
              fill="#ffffff"
              opacity="0.7"
            />
          </g>
        ))}
      </svg>
    </motion.div>
  );
};

/* Inline Power Tile Artwork inside a 100x100 cell */
const PowerTileArt: React.FC<{
  tile: PowerTileDef;
  cx: number;
  cy: number;
}> = ({ tile, cx, cy }) => {
  return (
    <g transform={`translate(${cx}, ${cy})`} pointerEvents="none">
      {/* Glowing backdrop badge */}
      <rect
        x="-34"
        y="-28"
        width="68"
        height="48"
        rx="14"
        fill={tile.bgFill}
        stroke="#161426"
        strokeWidth="2.8"
      />
      {tile.kind === 'rocket' && (
        <g transform="translate(0, -6) rotate(35)">
          <path
            d="M 0 -17 C 8 -8 9 4 7 10 L -7 10 C -9 4 -8 -8 0 -17 Z"
            fill="#ff595e"
            stroke="#161426"
            strokeWidth="2.4"
          />
          <circle cx="0" cy="-3" r="3.5" fill="#bae6fd" stroke="#161426" strokeWidth="1.8" />
          <path
            d="M -7 5 L -13 12 L -6 10 Z M 7 5 L 13 12 L 6 10 Z"
            fill="#ffca3a"
            stroke="#161426"
            strokeWidth="1.8"
          />
          <path
            d="M -4 10 L 0 18 L 4 10 Z"
            fill="#f97316"
            stroke="#161426"
            strokeWidth="1.6"
          />
        </g>
      )}

      {tile.kind === 'shield' && (
        <g transform="translate(0, -5)">
          <path
            d="M 0 -16 L 14 -10 V 1 C 14 10 7 15 0 18 C -7 15 -14 10 -14 1 V -10 Z"
            fill="#38bdf8"
            stroke="#161426"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <path
            d="M -5 0 L -1 4 L 6 -4"
            fill="none"
            stroke="#fffef9"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      )}

      {tile.kind === 'swap' && (
        <g transform="translate(0, -5)">
          <path
            d="M -14 -5 H 10 L 4 -11 M 14 6 H -10 L -4 12"
            fill="none"
            stroke="#9333ea"
            strokeWidth="3.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      )}

      {tile.kind === 'turbo' && (
        <g transform="translate(0, -5)">
          <polygon
            points="2,-16 -10,1 -1,1 -4,15 11,-2 2,-2"
            fill="#facc15"
            stroke="#161426"
            strokeWidth="2.4"
            strokeLinejoin="round"
          />
        </g>
      )}

      {tile.kind === 'banana' && (
        <g transform="translate(0, -5)">
          <path
            d="M -12 8 C -4 12 10 6 13 -10 C 6 -2 -3 3 -12 2 Z"
            fill="#fde047"
            stroke="#161426"
            strokeWidth="2.4"
            strokeLinejoin="round"
          />
          <path
            d="M -14 13 Q -6 16 2 13"
            fill="none"
            stroke="#d97706"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
        </g>
      )}

      {/* Bottom Mini Pill */}
      <rect
        x="-26"
        y="16"
        width="52"
        height="19"
        rx="9"
        fill={tile.accentFill}
        stroke="#161426"
        strokeWidth="2.4"
      />
      <text
        x="0"
        y="29.5"
        textAnchor="middle"
        fill="#fffef9"
        fontSize="11.5"
        fontWeight="900"
      >
        {tile.badgeText}
      </text>
    </g>
  );
};

/* Vector Ladder between two square centers */
const VectorLadderSvg: React.FC<{ ladder: LadderDef }> = ({ ladder }) => {
  const p1 = getSquareCenter(ladder.from);
  const p2 = getSquareCenter(ladder.to);
  const dx = p2.cx - p1.cx;
  const dy = p2.cy - p1.cy;
  const fullLen = Math.hypot(dx, dy) || 1;
  const ux = dx / fullLen;
  const uy = dy / fullLen;
  const nx = -uy;
  const ny = ux;

  // Trim slightly from exact centers so bases sit cleanly inside squares
  const trim = 12;
  const sx1 = p1.cx + ux * trim;
  const sy1 = p1.cy + uy * trim;
  const sx2 = p2.cx - ux * trim;
  const sy2 = p2.cy - uy * trim;
  const innerLen = Math.max(40, fullLen - trim * 2);

  const halfW = 18;
  const lx1 = sx1 + nx * halfW;
  const ly1 = sy1 + ny * halfW;
  const lx2 = sx2 + nx * halfW;
  const ly2 = sy2 + ny * halfW;

  const rx1 = sx1 - nx * halfW;
  const ry1 = sy1 - ny * halfW;
  const rx2 = sx2 - nx * halfW;
  const ry2 = sy2 - ny * halfW;

  const numRungs = Math.max(3, Math.floor(innerLen / 36));
  const rungs: Array<{ x1: number; y1: number; x2: number; y2: number }> = [];
  for (let i = 1; i <= numRungs; i++) {
    const t = i / (numRungs + 1);
    const cx = sx1 + (sx2 - sx1) * t;
    const cy = sy1 + (sy2 - sy1) * t;
    rungs.push({
      x1: cx + nx * halfW,
      y1: cy + ny * halfW,
      x2: cx - nx * halfW,
      y2: cy - ny * halfW,
    });
  }

  const railColor = ladder.golden ? '#facc15' : '#d97706';
  const rungColor = ladder.golden ? '#fde047' : '#fbbf24';
  const shineColor = ladder.golden ? '#fef9c3' : '#fde68a';

  return (
    <g pointerEvents="none">
      {/* Drop Shadow */}
      <g transform="translate(5, 7)" opacity="0.26">
        <line
          x1={lx1}
          y1={ly1}
          x2={lx2}
          y2={ly2}
          stroke="#161426"
          strokeWidth="12"
          strokeLinecap="round"
        />
        <line
          x1={rx1}
          y1={ry1}
          x2={rx2}
          y2={ry2}
          stroke="#161426"
          strokeWidth="12"
          strokeLinecap="round"
        />
        {rungs.map((r, idx) => (
          <line
            key={idx}
            x1={r.x1}
            y1={r.y1}
            x2={r.x2}
            y2={r.y2}
            stroke="#161426"
            strokeWidth="9"
            strokeLinecap="round"
          />
        ))}
      </g>

      {/* Rungs (drawn under rails so ends tuck seamlessly into rails) */}
      {rungs.map((r, idx) => (
        <g key={idx}>
          <line
            x1={r.x1}
            y1={r.y1}
            x2={r.x2}
            y2={r.y2}
            stroke="#161426"
            strokeWidth="10.5"
            strokeLinecap="round"
          />
          <line
            x1={r.x1}
            y1={r.y1}
            x2={r.x2}
            y2={r.y2}
            stroke={rungColor}
            strokeWidth="5.2"
            strokeLinecap="round"
          />
        </g>
      ))}

      {/* Left Rail */}
      <line
        x1={lx1}
        y1={ly1}
        x2={lx2}
        y2={ly2}
        stroke="#161426"
        strokeWidth="13"
        strokeLinecap="round"
      />
      <line
        x1={lx1}
        y1={ly1}
        x2={lx2}
        y2={ly2}
        stroke={railColor}
        strokeWidth="7.4"
        strokeLinecap="round"
      />
      <line
        x1={lx1}
        y1={ly1}
        x2={lx2}
        y2={ly2}
        stroke={shineColor}
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.85"
      />

      {/* Right Rail */}
      <line
        x1={rx1}
        y1={ry1}
        x2={rx2}
        y2={ry2}
        stroke="#161426"
        strokeWidth="13"
        strokeLinecap="round"
      />
      <line
        x1={rx1}
        y1={ry1}
        x2={rx2}
        y2={ry2}
        stroke={railColor}
        strokeWidth="7.4"
        strokeLinecap="round"
      />
      <line
        x1={rx1}
        y1={ry1}
        x2={rx2}
        y2={ry2}
        stroke={shineColor}
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.85"
      />
    </g>
  );
};

/* Expressive Cartoon Snake SVG from Head (higher square) to Tail (lower square) */
const VectorSnakeSvg: React.FC<{ snake: SnakeDef }> = ({ snake }) => {
  const headPt = getSquareCenter(snake.head);
  const tailPt = getSquareCenter(snake.tail);
  const prevSqPt = getSquareCenter(Math.max(1, snake.head - 1));

  // Orient snake head toward incoming pawns from square (head - 1)
  const faceAngleDeg =
    (Math.atan2(prevSqPt.cy - headPt.cy, prevSqPt.cx - headPt.cx) * 180) /
    Math.PI;

  // Tail rattle orientation
  const preTailPt = sampleSnakePoint(snake, 0.92);
  const tailAngleDeg =
    (Math.atan2(tailPt.cy - preTailPt.y, tailPt.cx - preTailPt.x) * 180) /
    Math.PI;

  const mainPath = buildSnakeSvgPath(snake, 0, 0);
  const shadowPath = buildSnakeSvgPath(snake, 5, 7);
  const bodyW = snake.isRoyalCobra ? 21 : 16.5;
  const outlineW = snake.isRoyalCobra ? 29 : 24;

  return (
    <g pointerEvents="none">
      {/* Soft Drop Shadow */}
      <path
        d={shadowPath}
        fill="none"
        stroke="rgba(22,20,38,0.28)"
        strokeWidth={outlineW}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Cobra Hood (behind body/head for 99 -> 41) */}
      {snake.isRoyalCobra && (
        <g transform={`translate(${headPt.cx}, ${headPt.cy}) rotate(${faceAngleDeg})`}>
          <ellipse
            cx="-6"
            cy="0"
            rx="22"
            ry="30"
            fill="#7e22ce"
            stroke="#161426"
            strokeWidth="4"
          />
          <ellipse
            cx="-5"
            cy="0"
            rx="15"
            ry="22"
            fill="#facc15"
            stroke="#161426"
            strokeWidth="2.5"
          />
        </g>
      )}

      {/* Thick Cartoon Outline */}
      <path
        d={mainPath}
        fill="none"
        stroke="#161426"
        strokeWidth={outlineW}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Main Vibrant Snake Body */}
      <path
        d={mainPath}
        fill="none"
        stroke={snake.bodyColor}
        strokeWidth={bodyW}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Patterned Scale Stripes */}
      <path
        d={mainPath}
        fill="none"
        stroke={snake.patternColor}
        strokeWidth={bodyW * 0.68}
        strokeDasharray="10 18"
        strokeLinecap="round"
      />

      {/* Glossy Belly / Spine Dots */}
      <path
        d={mainPath}
        fill="none"
        stroke={snake.bellyColor}
        strokeWidth="4.5"
        strokeDasharray="3 25"
        strokeLinecap="round"
      />

      {/* Tapered Golden Rattle Tail at lower square */}
      <g transform={`translate(${tailPt.cx}, ${tailPt.cy}) rotate(${tailAngleDeg})`}>
        <circle cx="2" cy="0" r="7.5" fill="#fbbf24" stroke="#161426" strokeWidth="3" />
        <circle cx="10" cy="0" r="5.8" fill="#fde047" stroke="#161426" strokeWidth="2.8" />
        <circle cx="16.5" cy="0" r="4" fill="#fef08a" stroke="#161426" strokeWidth="2.5" />
      </g>

      {/* Mischievous Cartoon Snake Head + Forked Red Tongue */}
      <g transform={`translate(${headPt.cx}, ${headPt.cy}) rotate(${faceAngleDeg})`}>
        {/* Red Forked Tongue pointing at incoming pawns */}
        <path
          d="M 16 0 L 32 0 L 39 -6 M 32 0 L 39 6"
          fill="none"
          stroke="#ef4444"
          strokeWidth="3.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Head Shape */}
        <ellipse
          cx="2"
          cy="0"
          rx={snake.isRoyalCobra ? 21 : 18.5}
          ry={snake.isRoyalCobra ? 17.5 : 15}
          fill={snake.bodyColor}
          stroke="#161426"
          strokeWidth="3.8"
        />

        {/* Snout Nostrils */}
        <circle cx="13" cy="-4" r="1.7" fill="#161426" />
        <circle cx="13" cy="4" r="1.7" fill="#161426" />

        {/* Big Cartoon Eyes */}
        <circle cx="-1" cy="-9" r="6.5" fill="#fffef9" stroke="#161426" strokeWidth="2.6" />
        <circle cx="-1" cy="9" r="6.5" fill="#fffef9" stroke="#161426" strokeWidth="2.6" />
        <circle cx="1.2" cy="-9" r="3.2" fill="#161426" />
        <circle cx="1.2" cy="9" r="3.2" fill="#161426" />
        <circle cx="0" cy="-10.5" r="1.2" fill="#ffffff" />
        <circle cx="0" cy="7.5" r="1.2" fill="#ffffff" />

        {/* Mischievous Eyebrows & Mini Crown for Royal Cobra */}
        {snake.isRoyalCobra && (
          <>
            <line
              x1="-6"
              y1="-16"
              x2="4"
              y2="-12"
              stroke="#161426"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <line
              x1="-6"
              y1="16"
              x2="4"
              y2="12"
              stroke="#161426"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <polygon
              points="-14,-8 -22,-13 -19,-3 -24,0 -19,3 -22,13 -14,8"
              fill="#facc15"
              stroke="#161426"
              strokeWidth="2.4"
              strokeLinejoin="round"
            />
          </>
        )}
      </g>
    </g>
  );
};

/* Animated Player Pawn Token inside SVG coordinate space */
const PlayerPawnSvg: React.FC<{
  x: number;
  y: number;
  hopLift: number;
  color: string;
  label: string;
  isBot: boolean;
  hasShield: boolean;
  isCurrentTurn: boolean;
}> = ({ x, y, hopLift, color, label, isBot, hasShield, isCurrentTurn }) => {
  const shadowScale = Math.max(0.55, 1 - Math.abs(hopLift) / 45);
  const initial = (label.trim()[0] || '?').toUpperCase();

  return (
    <g transform={`translate(${x}, ${y})`} pointerEvents="none">
      {/* Pulsing Turn Halo */}
      {isCurrentTurn && (
        <circle
          cx="0"
          cy="6"
          r="26"
          fill="none"
          stroke="#ffca3a"
          strokeWidth="4"
          strokeDasharray="8 6"
          opacity="0.95"
        />
      )}

      {/* Ground Shadow */}
      <ellipse
        cx="0"
        cy="17"
        rx={16 * shadowScale}
        ry={6.5 * shadowScale}
        fill="rgba(22,20,38,0.38)"
      />

      {/* Lifted Pawn Body */}
      <g transform={`translate(0, ${hopLift})`}>
        {/* Anti-Snake Shield Aura */}
        {hasShield && (
          <circle
            cx="0"
            cy="-4"
            r="24"
            fill="rgba(56, 189, 248, 0.22)"
            stroke="#38bdf8"
            strokeWidth="3"
          />
        )}

        {/* Classic 3D Meeple / Pawn Pedestal + Head */}
        <path
          d="M -15 14 C -15 4 -8 1 -6 -4 L 6 -4 C 8 1 15 4 15 14 Z"
          fill={color}
          stroke="#161426"
          strokeWidth="3.5"
          strokeLinejoin="round"
        />
        <ellipse
          cx="0"
          cy="14"
          rx="15"
          ry="4.5"
          fill={color}
          stroke="#161426"
          strokeWidth="3.2"
        />
        <circle
          cx="0"
          cy="-11"
          r="12.5"
          fill={color}
          stroke="#161426"
          strokeWidth="3.5"
        />
        {/* Specular Shine */}
        <path
          d="M -6 -17 A 8 8 0 0 1 3 -19"
          fill="none"
          stroke="#ffffff"
          strokeWidth="2.6"
          strokeLinecap="round"
          opacity="0.8"
        />

        {/* Initial or Bot Visor */}
        {isBot ? (
          <g>
            <rect
              x="-7.5"
              y="-15"
              width="15"
              height="7.5"
              rx="3.5"
              fill="#161426"
            />
            <circle cx="-3" cy="-11.2" r="1.8" fill="#38bdf8" />
            <circle cx="3" cy="-11.2" r="1.8" fill="#38bdf8" />
          </g>
        ) : (
          <text
            x="0"
            y="-6.5"
            textAnchor="middle"
            fill="#fffef9"
            stroke="#161426"
            strokeWidth="2.6"
            paintOrder="stroke"
            fontSize="13.5"
            fontWeight="900"
          >
            {initial}
          </text>
        )}

        {/* Mini Shield Emblem on Pawn */}
        {hasShield && (
          <g transform="translate(14, -18)">
            <path
              d="M 0 -7 L 7 -4 V 1 C 7 6 3.5 8.5 0 10 C -3.5 8.5 -7 6 -7 1 V -4 Z"
              fill="#38bdf8"
              stroke="#161426"
              strokeWidth="2"
            />
          </g>
        )}
      </g>
    </g>
  );
};

interface AnimPawnCoord {
  x: number;
  y: number;
  hopLift: number;
}

interface BannerNotice {
  id: number;
  tone: 'ladder' | 'snake' | 'shield' | 'power' | 'bonus' | 'win';
  title: string;
  subtitle: string;
}

export const SnakesAndLaddersGame: React.FC<SnakesGameProps> = ({
  gameData,
  players,
  myPlayerId,
  isHost,
  isPassAndPlay,
  lang,
  onUpdateGameData,
  onStartNewRound,
}) => {
  const isAr = lang === 'ar';

  // Build effective player list (auto-inject Solo Bot when players.length === 1)
  const effectivePlayers: PlayerInfo[] = useMemo(() => {
    if (players.length === 1) {
      return [
        players[0],
        {
          id: BOT_PLAYER_ID,
          name: isAr ? 'الخصم الآلي' : 'Arcade Bot',
          avatar_color: '#a855f7',
          score: 0,
        },
      ];
    }
    return players;
  }, [players, isAr]);

  const playerById = useMemo(() => {
    const map: Record<string, PlayerInfo> = {};
    for (const p of effectivePlayers) {
      map[p.id] = p;
    }
    return map;
  }, [effectivePlayers]);

  // Synchronize turn order cleanly with effectivePlayers
  const activeOrder: string[] = useMemo(() => {
    const validSet = new Set(effectivePlayers.map((p) => p.id));
    const base = (gameData.playerOrder || []).filter((id) => validSet.has(id));
    for (const p of effectivePlayers) {
      if (!base.includes(p.id)) {
        base.push(p.id);
      }
    }
    return base.length > 0 ? base : effectivePlayers.map((p) => p.id);
  }, [gameData.playerOrder, effectivePlayers]);

  const safeTurnIndex =
    activeOrder.length > 0
      ? ((gameData.turnIndex || 0) % activeOrder.length + activeOrder.length) %
        activeOrder.length
      : 0;
  const currentTurnPlayerId = activeOrder[safeTurnIndex] || effectivePlayers[0]?.id;
  const currentTurnPlayer = playerById[currentTurnPlayerId] || effectivePlayers[0];

  // Animation states
  const [isAnimating, setIsAnimating] = useState(false);
  const [diceRollingVisual, setDiceRollingVisual] = useState(false);
  const [displayedDiceFace, setDisplayedDiceFace] = useState<number>(
    gameData.lastMove?.dice || 6
  );
  const [animOverrides, setAnimOverrides] = useState<
    Record<string, AnimPawnCoord>
  >({});
  const [highlightedSq, setHighlightedSq] = useState<number | null>(null);
  const [banner, setBanner] = useState<BannerNotice | null>(null);

  const lastAnimatedSeqRef = useRef<number>(gameData.moveSeq || 0);
  const animCleanupRef = useRef<(() => void) | null>(null);

  const formatBannerForMove = useCallback(
    (move: SnakesLastMove): BannerNotice | null => {
      const actor = playerById[move.playerId]?.name || '';
      const swappedName = move.swappedWithId
        ? playerById[move.swappedWithId]?.name || ''
        : '';

      if (move.eventType === 'win') {
        return {
          id: move.seq,
          tone: 'win',
          title: isAr
            ? `تتويج ملكي! ${actor} وصل للمربع 100!`
            : `Royal Victory! ${actor} reached Square 100!`,
          subtitle: isAr
            ? 'حسم السباق بالضبط على القمّة الذهبية!'
            : 'Landed right on the golden summit!',
        };
      }
      if (move.eventType === 'ladder') {
        const isGolden = LADDERS_BY_FROM[move.landedSq]?.golden;
        return {
          id: move.seq,
          tone: 'ladder',
          title: isAr
            ? `${isGolden ? 'سلّم ذهبي!' : 'صعود سريع!'} طار من ${move.landedSq} إلى ${move.finalSq}!`
            : `${isGolden ? 'Golden Ladder!' : 'Fast Climb!'} Shot from ${move.landedSq} to ${move.finalSq}!`,
          subtitle: actor,
        };
      }
      if (move.eventType === 'snake') {
        const snake = SNAKES_BY_HEAD[move.landedSq];
        const isCobra = snake?.isRoyalCobra;
        return {
          id: move.seq,
          tone: 'snake',
          title: isAr
            ? isCobra
              ? `لدغته الكوبرا في 99 ونزل للـ 41!!`
              : `لدغة ثعبان! انزلق من ${move.landedSq} إلى ${move.finalSq}!`
            : isCobra
            ? `Bitten by the Royal Cobra at 99 down to 41!!`
            : `Snake Bite! Slid from ${move.landedSq} down to ${move.finalSq}!`,
          subtitle: `${actor} — ${isAr ? snake?.nameAr || '' : snake?.nameEn || ''}`,
        };
      }
      if (move.eventType === 'shield_block') {
        return {
          id: move.seq,
          tone: 'shield',
          title: isAr
            ? `أنقذك الدرع من لدغة الثعبان في ${move.landedSq}!`
            : `Shield blocked the snake bite on ${move.landedSq}!`,
          subtitle: actor,
        };
      }
      if (move.eventType === 'power_rocket') {
        return {
          id: move.seq,
          tone: 'power',
          title: isAr
            ? `صاروخ نيترو! اندفع +5 إلى المربع ${move.finalSq}!`
            : `Nitro Rocket! Boosted +5 to Square ${move.finalSq}!`,
          subtitle: actor,
        };
      }
      if (move.eventType === 'power_shield') {
        return {
          id: move.seq,
          tone: 'shield',
          title: isAr
            ? `درع مضاد للثعابين! محمي من اللدغة القادمة`
            : `Anti-Snake Shield equipped! Next snake bite blocked`,
          subtitle: actor,
        };
      }
      if (move.eventType === 'power_swap') {
        return {
          id: move.seq,
          tone: 'power',
          title: isAr
            ? `تبادل أماكن خارق مع ${swappedName}! (${move.landedSq} <-> ${move.finalSq})`
            : `Position Swap with ${swappedName}! (${move.landedSq} <-> ${move.finalSq})`,
          subtitle: actor,
        };
      }
      if (move.eventType === 'power_swap_boost') {
        return {
          id: move.seq,
          tone: 'power',
          title: isAr
            ? `أنت بالصدارة أصلاً! دفعة إضافية +3 إلى ${move.finalSq}`
            : `Already in 1st! Bonus +3 boost to ${move.finalSq}`,
          subtitle: actor,
        };
      }
      if (move.eventType === 'power_turbo') {
        return {
          id: move.seq,
          tone: 'power',
          title: isAr
            ? `قفزة مضاعفة! طار +6 إلى المربع ${move.finalSq}!`
            : `Turbo Jump! Leapt +6 to Square ${move.finalSq}!`,
          subtitle: actor,
        };
      }
      if (move.eventType === 'power_banana') {
        return {
          id: move.seq,
          tone: 'snake',
          title: isAr
            ? `زحلقة بقشرة موزة! رجع -4 إلى ${move.finalSq}!`
            : `Banana Peel Slip! Slid -4 back to ${move.finalSq}!`,
          subtitle: actor,
        };
      }
      if (move.gotBonusTurn) {
        return {
          id: move.seq,
          tone: 'bonus',
          title: isAr
            ? `جبت 6! إلك رمية إضافية!`
            : `Rolled a 6! You get an Extra Roll!`,
          subtitle: actor,
        };
      }
      if (move.cappedThirdSix) {
        return {
          id: move.seq,
          tone: 'bonus',
          title: isAr
            ? `ثلاث ستّات متتالية! انتقل الدور بعد رميتين إضافيتين`
            : `Three 6s in a row! Turn passes after 2 bonus rolls`,
          subtitle: actor,
        };
      }
      return null;
    },
    [isAr, playerById]
  );

  // Step-by-step hopping + ladder/snake/power glide animation on every moveSeq increment
  useEffect(() => {
    const seq = gameData.moveSeq || 0;

    if (seq === 0) {
      if (animCleanupRef.current) {
        animCleanupRef.current();
        animCleanupRef.current = null;
      }
      lastAnimatedSeqRef.current = 0;
      setIsAnimating(false);
      setDiceRollingVisual(false);
      setAnimOverrides({});
      setHighlightedSq(null);
      setBanner(null);
      return;
    }

    if (seq <= lastAnimatedSeqRef.current || !gameData.lastMove) {
      return;
    }

    lastAnimatedSeqRef.current = seq;
    const move = gameData.lastMove;

    if (animCleanupRef.current) {
      animCleanupRef.current();
      animCleanupRef.current = null;
    }

    let cancelled = false;
    const timers: number[] = [];
    let rafId: number | null = null;

    const cleanup = () => {
      cancelled = true;
      timers.forEach((id) => window.clearTimeout(id));
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
    animCleanupRef.current = cleanup;

    setIsAnimating(true);
    setDiceRollingVisual(true);

    // Hold moving pawn at startSq (and swapped player at swappedFromSq) while die tumbles
    const startPt = getSquareCenter(move.startSq);
    const initialOverrides: Record<string, AnimPawnCoord> = {
      [move.playerId]: { x: startPt.cx, y: startPt.cy + 4, hopLift: 0 },
    };
    if (
      move.eventType === 'power_swap' &&
      move.swappedWithId &&
      move.swappedFromSq
    ) {
      const otherPt = getSquareCenter(move.swappedFromSq);
      initialOverrides[move.swappedWithId] = {
        x: otherPt.cx,
        y: otherPt.cy + 4,
        hopLift: 0,
      };
    }
    setAnimOverrides(initialOverrides);

    // Rapidly cycle die faces during 360ms tumble
    const faces = [1, 4, 2, 6, 3, 5];
    faces.forEach((f, idx) => {
      const tid = window.setTimeout(() => {
        if (!cancelled) setDisplayedDiceFace(f);
      }, idx * 55);
      timers.push(tid);
    });

    const hopStartDelay = 370;
    const hopDurationMs = 135;

    const settleDieTimer = window.setTimeout(() => {
      if (cancelled) return;
      setDisplayedDiceFace(move.dice);
      setDiceRollingVisual(false);
    }, hopStartDelay - 20);
    timers.push(settleDieTimer);

    // Schedule each square-by-square hop
    move.hopPath.forEach((sq, stepIdx) => {
      const stepStart = hopStartDelay + stepIdx * hopDurationMs;
      const prevSq = stepIdx === 0 ? move.startSq : move.hopPath[stepIdx - 1];
      const fromPt = getSquareCenter(prevSq);
      const toPt = getSquareCenter(sq);

      // Mid-air peak of hop
      const midTimer = window.setTimeout(() => {
        if (cancelled) return;
        setHighlightedSq(sq);
        setAnimOverrides((prev) => ({
          ...prev,
          [move.playerId]: {
            x: (fromPt.cx + toPt.cx) / 2,
            y: (fromPt.cy + toPt.cy) / 2 + 2,
            hopLift: -20,
          },
        }));
      }, stepStart + Math.floor(hopDurationMs * 0.45));
      timers.push(midTimer);

      // Touchdown on square `sq`
      const landTimer = window.setTimeout(() => {
        if (cancelled) return;
        setHighlightedSq(sq);
        setAnimOverrides((prev) => ({
          ...prev,
          [move.playerId]: {
            x: toPt.cx,
            y: toPt.cy + 4,
            hopLift: 0,
          },
        }));
      }, stepStart + hopDurationMs);
      timers.push(landTimer);
    });

    const afterHopsMs =
      hopStartDelay + move.hopPath.length * hopDurationMs + 70;
    const hasSlide = move.finalSq !== move.landedSq;
    const slideDurationMs = hasSlide ? 560 : move.eventType !== 'none' ? 280 : 80;

    const slideTimer = window.setTimeout(() => {
      if (cancelled) return;

      const notice = formatBannerForMove(move);
      if (notice) {
        setBanner(notice);
      }

      if (!hasSlide) {
        const finishNoSlide = window.setTimeout(() => {
          if (cancelled) return;
          setAnimOverrides({});
          setHighlightedSq(null);
          setIsAnimating(false);
          if (move.eventType === 'win') {
            confetti({
              particleCount: 95,
              spread: 75,
              origin: { y: 0.6 },
            });
          }
        }, slideDurationMs);
        timers.push(finishNoSlide);
        return;
      }

      // Smooth 560ms RAF glide along Ladder, Snake S-curve, Swap, or Power boost!
      const landedPt = getSquareCenter(move.landedSq);
      const finalPt = getSquareCenter(move.finalSq);
      const snakeObj =
        move.eventType === 'snake' ? SNAKES_BY_HEAD[move.landedSq] : undefined;
      const swapPartnerId =
        move.eventType === 'power_swap' ? move.swappedWithId : null;
      const swapPartnerStartPt =
        swapPartnerId && move.swappedFromSq
          ? getSquareCenter(move.swappedFromSq)
          : null;

      const t0 = performance.now();

      const tick = (now: number) => {
        if (cancelled) return;
        const rawP = Math.min(1, (now - t0) / slideDurationMs);
        // Smooth easeInOutCubic
        const p =
          rawP < 0.5
            ? 4 * rawP * rawP * rawP
            : 1 - Math.pow(-2 * rawP + 2, 3) / 2;

        let px = landedPt.cx + (finalPt.cx - landedPt.cx) * p;
        let py = landedPt.cy + (finalPt.cy - landedPt.cy) * p + 4;
        let lift = 0;

        if (snakeObj) {
          const sPt = sampleSnakePoint(snakeObj, p);
          px = sPt.x;
          py = sPt.y + 2;
        } else if (move.eventType === 'ladder') {
          lift = -Math.sin(Math.PI * p) * 10;
        } else {
          lift = -Math.sin(Math.PI * p) * 22;
        }

        const nextOv: Record<string, AnimPawnCoord> = {
          [move.playerId]: { x: px, y: py, hopLift: lift },
        };

        if (swapPartnerId && swapPartnerStartPt) {
          nextOv[swapPartnerId] = {
            x:
              swapPartnerStartPt.cx +
              (landedPt.cx - swapPartnerStartPt.cx) * p,
            y:
              swapPartnerStartPt.cy +
              (landedPt.cy - swapPartnerStartPt.cy) * p +
              4,
            hopLift: -Math.sin(Math.PI * p) * 22,
          };
        }

        setAnimOverrides(nextOv);

        if (rawP < 1) {
          rafId = requestAnimationFrame(tick);
        } else {
          setHighlightedSq(move.finalSq);
          const endTimer = window.setTimeout(() => {
            if (cancelled) return;
            setAnimOverrides({});
            setHighlightedSq(null);
            setIsAnimating(false);
            if (move.eventType === 'win') {
              confetti({
                particleCount: 100,
                spread: 80,
                origin: { y: 0.58 },
              });
            }
          }, 90);
          timers.push(endTimer);
        }
      };

      rafId = requestAnimationFrame(tick);
    }, afterHopsMs);
    timers.push(slideTimer);

    return cleanup;
  }, [gameData.moveSeq, gameData.lastMove, formatBannerForMove]);

  // Auto-hide floating banner after 3.4s (unless game finished)
  useEffect(() => {
    if (!banner || banner.tone === 'win') return;
    const tid = window.setTimeout(() => {
      setBanner((prev) => (prev?.id === banner.id ? null : prev));
    }, 3400);
    return () => window.clearTimeout(tid);
  }, [banner]);

  // Execute a roll for `rollerId`
  const executeRollForPlayer = useCallback(
    (rollerId: string) => {
      if (gameData.phase !== 'playing' || isAnimating) return;

      const dice = Math.floor(Math.random() * 6) + 1;
      const currentPositions: Record<string, number> = {};
      for (const pid of activeOrder) {
        currentPositions[pid] = gameData.positions?.[pid] ?? 1;
      }

      const startSq = currentPositions[rollerId] ?? 1;

      // Exact step-by-step hop path with bounce-back off 100
      const hopPath: number[] = [];
      let cur = startSq;
      let dir = 1;
      for (let i = 0; i < dice; i++) {
        cur += dir;
        if (cur === 100 && i < dice - 1) {
          dir = -1;
        }
        hopPath.push(cur);
      }

      const landedSq = hopPath[hopPath.length - 1];
      let finalSq = landedSq;
      let eventType: SnakesEventType = 'none';
      const nextPositions = { ...currentPositions };
      const nextShields = { ...(gameData.shields || {}) };
      let swappedWithId: string | null = null;
      let swappedFromSq: number | null = null;

      if (landedSq === 100) {
        finalSq = 100;
        eventType = 'win';
      } else if (LADDERS_BY_FROM[landedSq]) {
        finalSq = LADDERS_BY_FROM[landedSq].to;
        eventType = 'ladder';
      } else if (SNAKES_BY_HEAD[landedSq]) {
        if (nextShields[rollerId]) {
          nextShields[rollerId] = false;
          finalSq = landedSq;
          eventType = 'shield_block';
        } else {
          finalSq = SNAKES_BY_HEAD[landedSq].tail;
          eventType = 'snake';
        }
      } else if (gameData.partyMode && POWER_BY_SQUARE[landedSq]) {
        const pTile = POWER_BY_SQUARE[landedSq];
        if (pTile.kind === 'rocket') {
          finalSq = Math.min(100, landedSq + 5);
          eventType = finalSq === 100 ? 'win' : 'power_rocket';
        } else if (pTile.kind === 'shield') {
          nextShields[rollerId] = true;
          finalSq = landedSq;
          eventType = 'power_shield';
        } else if (pTile.kind === 'swap') {
          // Find opponent in 1st place
          let leaderId: string | null = null;
          let leaderSq = -1;
          for (const otherId of activeOrder) {
            if (otherId === rollerId) continue;
            const sq = currentPositions[otherId] ?? 1;
            if (sq > leaderSq) {
              leaderSq = sq;
              leaderId = otherId;
            }
          }
          if (leaderId && leaderSq > landedSq) {
            swappedWithId = leaderId;
            swappedFromSq = leaderSq;
            finalSq = leaderSq;
            nextPositions[leaderId] = landedSq;
            eventType = 'power_swap';
          } else {
            finalSq = Math.min(100, landedSq + 3);
            eventType = finalSq === 100 ? 'win' : 'power_swap_boost';
          }
        } else if (pTile.kind === 'turbo') {
          finalSq = Math.min(100, landedSq + 6);
          eventType = finalSq === 100 ? 'win' : 'power_turbo';
        } else if (pTile.kind === 'banana') {
          finalSq = Math.max(1, landedSq - 4);
          eventType = 'power_banana';
        }
      }

      nextPositions[rollerId] = finalSq;
      const won = finalSq === 100;
      if (won) {
        eventType = 'win';
      }

      const prevSixes = gameData.consecutiveSixes || 0;
      let gotBonusTurn = false;
      let cappedThirdSix = false;
      let nextTurnIndex = safeTurnIndex;
      let nextConsecutiveSixes = 0;

      if (!won) {
        if (dice === 6 && prevSixes < 2) {
          gotBonusTurn = true;
          nextTurnIndex = safeTurnIndex;
          nextConsecutiveSixes = prevSixes + 1;
        } else {
          if (dice === 6 && prevSixes >= 2) {
            cappedThirdSix = true;
          }
          nextTurnIndex = (safeTurnIndex + 1) % activeOrder.length;
          nextConsecutiveSixes = 0;
        }
      }

      const nextSeq = (gameData.moveSeq || 0) + 1;
      const lastMove: SnakesLastMove = {
        seq: nextSeq,
        playerId: rollerId,
        dice,
        startSq,
        hopPath,
        landedSq,
        finalSq,
        eventType,
        swappedWithId,
        swappedFromSq,
        gotBonusTurn,
        cappedThirdSix,
      };

      const historyEntry: SnakesHistoryEntry = {
        seq: nextSeq,
        playerId: rollerId,
        dice,
        fromSq: startSq,
        landedSq,
        toSq: finalSq,
        eventType,
        swappedWithId,
        gotBonusTurn,
      };

      const nextState: SnakesGameState = {
        boardType: 'snakes',
        phase: won ? 'finished' : 'playing',
        positions: nextPositions,
        turnIndex: nextTurnIndex,
        playerOrder: activeOrder,
        shields: nextShields,
        consecutiveSixes: nextConsecutiveSixes,
        partyMode: gameData.partyMode ?? true,
        winnerId: won ? rollerId : null,
        moveSeq: nextSeq,
        lastMove,
        history: [historyEntry, ...(gameData.history || [])].slice(0, 8),
      };

      const isHumanWinner =
        won &&
        rollerId !== BOT_PLAYER_ID &&
        players.some((p) => p.id === rollerId);

      onUpdateGameData(
        nextState,
        isHumanWinner ? { [rollerId]: 4 } : undefined
      );
    },
    [
      gameData,
      isAnimating,
      activeOrder,
      safeTurnIndex,
      players,
      onUpdateGameData,
    ]
  );

  // Solo Bot Auto-Roll after 750ms once previous move animation settles
  const canDriveBot =
    isHost || isPassAndPlay || players[0]?.id === myPlayerId;

  useEffect(() => {
    if (
      gameData.phase !== 'playing' ||
      isAnimating ||
      currentTurnPlayerId !== BOT_PLAYER_ID ||
      !canDriveBot
    ) {
      return;
    }

    const botTimer = window.setTimeout(() => {
      executeRollForPlayer(BOT_PLAYER_ID);
    }, 750);

    return () => window.clearTimeout(botTimer);
  }, [
    gameData.phase,
    isAnimating,
    currentTurnPlayerId,
    canDriveBot,
    executeRollForPlayer,
  ]);

  const canToggleMode = isHost || isPassAndPlay || players.length === 1;
  const handleTogglePartyMode = () => {
    if (!canToggleMode || isAnimating) return;
    onUpdateGameData({
      ...gameData,
      boardType: 'snakes',
      partyMode: !gameData.partyMode,
    });
  };

  const handleRestartBoard = () => {
    if (isHost || isPassAndPlay || players.length === 1) {
      onStartNewRound();
    }
  };

  const isMyHumanTurn =
    gameData.phase === 'playing' &&
    currentTurnPlayerId !== BOT_PLAYER_ID &&
    (isPassAndPlay || currentTurnPlayerId === myPlayerId);

  // Precompute all 100 board squares
  const boardCells = useMemo(() => {
    const arr = [];
    for (let sq = 1; sq <= 100; sq++) {
      arr.push({ sq, ...getSquareCenter(sq) });
    }
    return arr;
  }, []);

  // Group static (non-overridden) pawns by square so co-located pawns fan out neatly
  const staticPawnsBySquare = useMemo(() => {
    const groups: Record<number, string[]> = {};
    for (const pid of activeOrder) {
      if (animOverrides[pid]) continue;
      const sq = gameData.positions?.[pid] ?? 1;
      if (!groups[sq]) groups[sq] = [];
      groups[sq].push(pid);
    }
    return groups;
  }, [activeOrder, gameData.positions, animOverrides]);

  // Sorted leaderboard standings
  const rankedPlayers = useMemo(() => {
    return [...activeOrder]
      .map((pid) => ({
        player: playerById[pid] || {
          id: pid,
          name: pid,
          avatar_color: '#38bdf8',
          score: 0,
        },
        sq: gameData.positions?.[pid] ?? 1,
        hasShield: !!gameData.shields?.[pid],
      }))
      .sort((a, b) => b.sq - a.sq);
  }, [activeOrder, playerById, gameData.positions, gameData.shields]);

  const winnerPlayer = gameData.winnerId ? playerById[gameData.winnerId] : null;
  const recentFeed = (gameData.history || []).slice(0, 4);

  return (
    <div
      dir={isAr ? 'rtl' : 'ltr'}
      className="w-full max-w-6xl mx-auto space-y-4 select-none [overflow-anchor:none]"
    >
      {/* Top Mode & Legend Header Bar */}
      <div className="cartoon-panel-dark px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[#ffca3a] border-[3px] border-[#161426] shadow-[0_3px_0_#161426] flex items-center justify-center shrink-0">
            <Crown weight="fill" className="w-6 h-6 text-[#161426]" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-black text-[#fff9ec] leading-tight">
              {isAr
                ? 'الحيّة والسلّم — الثعبان والسلالم'
                : 'Snakes & Ladders Deluxe'}
            </h2>
            <p className="text-xs font-bold text-[#cbd5e1]">
              {isAr
                ? 'أول من يصل بالضبط إلى المربع 100 يحصد التاج (+4 نقاط)!'
                : 'First to land right on Square 100 wins the Crown (+4 pts)!'}
            </p>
          </div>
        </div>

        {/* Classic vs Party Action Mode Toggle */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={!canToggleMode || isAnimating}
            onClick={handleTogglePartyMode}
            className={`cartoon-btn px-3.5 py-2 text-xs sm:text-sm flex items-center gap-2 ${
              gameData.partyMode
                ? 'bg-[#ffca3a] text-[#161426]'
                : 'bg-[#332d63] text-[#fff9ec]'
            }`}
          >
            <Sparkle weight="fill" className="w-4 h-4 shrink-0" />
            <span>
              {gameData.partyMode
                ? isAr
                  ? 'وضع أكشن الشلّة: مفعّل'
                  : 'Party Power Mode: ON'
                : isAr
                ? 'الوضع الكلاسيكي الصافي'
                : 'Classic Pure Mode'}
            </span>
          </button>

          {canToggleMode && gameData.moveSeq > 0 && gameData.phase === 'playing' && (
            <button
              type="button"
              disabled={isAnimating}
              onClick={handleRestartBoard}
              className="cartoon-btn bg-[#25204d] text-[#fff9ec] px-3 py-2 text-xs flex items-center gap-1.5"
              title={isAr ? 'إعادة الجولة' : 'Reset Match'}
            >
              <ArrowsClockwise weight="bold" className="w-4 h-4" />
              <span className="hidden sm:inline">
                {isAr ? 'إعادة' : 'Reset'}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Main Responsive 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT / MAIN: Crisp 10x10 Vector Board */}
        <div className="lg:col-span-7 space-y-3">
          <div className="relative cartoon-card bg-[#1e1a3d] p-2 sm:p-3.5 overflow-hidden">
            {/* Floating Dramatic Event Popup Banner */}
            <AnimatePresence>
              {banner && (
                <motion.div
                  key={banner.id}
                  initial={{ opacity: 0, y: -24, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -16, scale: 0.92 }}
                  transition={{ duration: 0.24 }}
                  className={`pointer-events-none absolute top-4 inset-x-4 z-20 mx-auto max-w-md rounded-2xl border-4 border-[#161426] px-4 py-2.5 shadow-[0_6px_0_#161426] flex items-center gap-3 ${
                    banner.tone === 'win'
                      ? 'bg-[#ffca3a] text-[#161426]'
                      : banner.tone === 'ladder'
                      ? 'bg-[#4ade80] text-[#161426]'
                      : banner.tone === 'snake'
                      ? 'bg-[#ff595e] text-white'
                      : banner.tone === 'shield'
                      ? 'bg-[#38bdf8] text-[#161426]'
                      : 'bg-[#f3e8ff] text-[#161426]'
                  }`}
                >
                  <div className="w-9 h-9 rounded-xl bg-white/90 border-2 border-[#161426] flex items-center justify-center shrink-0 text-[#161426]">
                    {banner.tone === 'win' && (
                      <Crown weight="fill" className="w-5 h-5 text-[#d97706]" />
                    )}
                    {banner.tone === 'ladder' && (
                      <RocketLaunch
                        weight="fill"
                        className="w-5 h-5 text-[#15803d]"
                      />
                    )}
                    {banner.tone === 'snake' && (
                      <WarningCircle
                        weight="fill"
                        className="w-5 h-5 text-[#dc2626]"
                      />
                    )}
                    {banner.tone === 'shield' && (
                      <ShieldCheck
                        weight="fill"
                        className="w-5 h-5 text-[#0284c7]"
                      />
                    )}
                    {(banner.tone === 'power' || banner.tone === 'bonus') && (
                      <Lightning
                        weight="fill"
                        className="w-5 h-5 text-[#9333ea]"
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm sm:text-base font-black leading-snug truncate">
                      {banner.title}
                    </div>
                    {banner.subtitle && (
                      <div className="text-xs font-extrabold opacity-85 truncate">
                        {banner.subtitle}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* 10x10 Pure Vector SVG Board (0.0px misalignment across every screen!) */}
            <div className="w-full aspect-square rounded-2xl overflow-hidden border-4 border-[#161426] bg-[#fff9ec]">
              <svg
                viewBox="0 0 1000 1000"
                className="w-full h-full block"
                role="img"
                aria-label={
                  isAr ? 'لوحة الحيّة والسلّم 1 إلى 100' : 'Snakes and Ladders 1 to 100 Board'
                }
              >
                {/* LAYER 1: 100 Boustrophedon Squares */}
                {boardCells.map(({ sq, x, y, cx, cy, rowFromBottom, rowFromTop, col }) => {
                  const baseFill =
                    sq === 1
                      ? '#4ade80'
                      : sq === 100
                      ? '#ffca3a'
                      : TILE_PALETTE[(rowFromTop * 2 + col) % TILE_PALETTE.length];

                  const isHopped = highlightedSq === sq;
                  const powerTile = gameData.partyMode
                    ? POWER_BY_SQUARE[sq]
                    : undefined;
                  const isRowEnd = sq < 100 && sq % 10 === 0;
                  const goesRight = rowFromBottom % 2 === 0;

                  return (
                    <g key={sq}>
                      <rect
                        x={x}
                        y={y}
                        width="100"
                        height="100"
                        fill={baseFill}
                        stroke="#161426"
                        strokeWidth="3.2"
                      />

                      {/* Subtle top bevel highlight */}
                      <rect
                        x={x + 4}
                        y={y + 4}
                        width="92"
                        height="18"
                        rx="5"
                        fill="rgba(255,255,255,0.34)"
                      />

                      {/* Subtle Boustrophedon Flow Chevron */}
                      {sq < 100 && (
                        <g opacity="0.22" pointerEvents="none">
                          {isRowEnd ? (
                            <polygon
                              points={`${x + 82},${y + 20} ${x + 88},${y + 11} ${x + 94},${y + 20}`}
                              fill="#161426"
                            />
                          ) : goesRight ? (
                            <polygon
                              points={`${x + 83},${y + 12} ${x + 92},${y + 17} ${x + 83},${y + 22}`}
                              fill="#161426"
                            />
                          ) : (
                            <polygon
                              points={`${x + 91},${y + 12} ${x + 82},${y + 17} ${x + 91},${y + 22}`}
                              fill="#161426"
                            />
                          )}
                        </g>
                      )}

                      {/* Square 1: Glowing Start Badge */}
                      {sq === 1 && (
                        <g pointerEvents="none">
                          <circle
                            cx={cx}
                            cy={cy - 4}
                            r="24"
                            fill="#bbf7d0"
                            stroke="#161426"
                            strokeWidth="2.6"
                          />
                          <polygon
                            points={`${cx - 5},${cy - 13} ${cx + 10},${cy - 4} ${cx - 5},${cy + 5}`}
                            fill="#15803d"
                          />
                          <rect
                            x={x + 8}
                            y={y + 72}
                            width="84"
                            height="22"
                            rx="10"
                            fill="#161426"
                          />
                          <text
                            x={cx}
                            y={y + 87}
                            textAnchor="middle"
                            fill="#4ade80"
                            fontSize="13.5"
                            fontWeight="900"
                          >
                            {isAr ? 'البداية' : 'START'}
                          </text>
                        </g>
                      )}

                      {/* Square 100: Royal Gold Crown Finish Illustration */}
                      {sq === 100 && (
                        <g pointerEvents="none">
                          <circle
                            cx={cx}
                            cy={cy + 2}
                            r="36"
                            fill="#fef08a"
                            stroke="#161426"
                            strokeWidth="2.8"
                          />
                          {/* Vector Royal Crown */}
                          <path
                            d={`M ${cx - 24} ${cy + 15} L ${cx - 28} ${cy - 12} L ${cx - 12} ${cy + 1} L ${cx} ${cy - 18} L ${cx + 12} ${cy + 1} L ${cx + 28} ${cy - 12} L ${cx + 24} ${cy + 15} Z`}
                            fill="#f59e0b"
                            stroke="#161426"
                            strokeWidth="3.5"
                            strokeLinejoin="round"
                          />
                          <rect
                            x={cx - 24}
                            y={cy + 13}
                            width="48"
                            height="9"
                            rx="4"
                            fill="#fde047"
                            stroke="#161426"
                            strokeWidth="3"
                          />
                          <circle cx={cx} cy={cy + 3} r="4" fill="#ef4444" />
                          <circle cx={cx - 13} cy={cy + 6} r="3" fill="#38bdf8" />
                          <circle cx={cx + 13} cy={cy + 6} r="3" fill="#38bdf8" />
                        </g>
                      )}

                      {/* Party Power Tile Artwork */}
                      {powerTile && (
                        <PowerTileArt tile={powerTile} cx={cx} cy={cy + 4} />
                      )}

                      {/* Active Hop Glow Ring */}
                      {isHopped && (
                        <rect
                          x={x + 5}
                          y={y + 5}
                          width="90"
                          height="90"
                          rx="12"
                          fill="none"
                          stroke="#ff595e"
                          strokeWidth="6"
                        />
                      )}

                      {/* Crisp Corner Square Number */}
                      <text
                        x={x + 10}
                        y={y + 23}
                        fill="#161426"
                        fontSize={sq === 100 ? '18' : '18.5'}
                        fontWeight="900"
                      >
                        {sq}
                      </text>
                    </g>
                  );
                })}

                {/* LAYER 2: 8 Wooden & Golden Ladders */}
                {LADDERS.map((ladder) => (
                  <VectorLadderSvg key={ladder.from} ladder={ladder} />
                ))}

                {/* LAYER 3: 8 Expressive Cartoon Snakes */}
                {SNAKES.map((snake) => (
                  <VectorSnakeSvg key={snake.head} snake={snake} />
                ))}

                {/* LAYER 4: Player Pawn Tokens (Static + Animated) */}
                {activeOrder.map((pid) => {
                  const pInfo = playerById[pid];
                  if (!pInfo) return null;

                  const override = animOverrides[pid];
                  let px = 50;
                  let py = 954;
                  let lift = 0;

                  if (override) {
                    px = override.x;
                    py = override.y;
                    lift = override.hopLift;
                  } else {
                    const sq = gameData.positions?.[pid] ?? 1;
                    const center = getSquareCenter(sq);
                    const group = staticPawnsBySquare[sq] || [pid];
                    const idxInSq = Math.max(0, group.indexOf(pid));
                    const { ox, oy } = getClusterOffset(idxInSq, group.length);
                    px = center.cx + ox;
                    py = center.cy + oy;
                  }

                  return (
                    <PlayerPawnSvg
                      key={pid}
                      x={px}
                      y={py}
                      hopLift={lift}
                      color={pInfo.avatar_color || '#38bdf8'}
                      label={pInfo.name}
                      isBot={pid === BOT_PLAYER_ID}
                      hasShield={!!gameData.shields?.[pid]}
                      isCurrentTurn={
                        gameData.phase === 'playing' &&
                        !isAnimating &&
                        pid === currentTurnPlayerId
                      }
                    />
                  );
                })}
              </svg>
            </div>
          </div>

          {/* Party Power Tiles Quick Legend */}
          {gameData.partyMode && (
            <div className="cartoon-panel-dark px-3.5 py-2.5 flex flex-wrap items-center justify-center gap-2 text-xs font-extrabold">
              <span className="text-[#ffca3a] flex items-center gap-1">
                <Sparkle weight="fill" className="w-4 h-4" />
                {isAr ? 'مربعات الأكشن:' : 'Power Tiles:'}
              </span>
              {POWER_TILES.map((pt) => (
                <span
                  key={pt.square}
                  className="px-2.5 py-1 rounded-full bg-[#191636] border-2 border-[#120f29] text-[#fff9ec] flex items-center gap-1"
                >
                  <span className="text-[#ffca3a]">#{pt.square}</span>
                  <span>{isAr ? pt.labelAr : pt.labelEn}</span>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT / SIDEBAR: Victory Podium, 3D Dice Roller, Standings & Live Action Feed */}
        <div className="lg:col-span-5 space-y-4">
          {/* Victory Celebration Card */}
          {gameData.phase === 'finished' && winnerPlayer && (
            <div className="cartoon-card bg-[#fef9c3] p-5 space-y-4 text-center">
              <div className="w-16 h-16 mx-auto rounded-3xl bg-[#ffca3a] border-4 border-[#161426] shadow-[0_5px_0_#161426] flex items-center justify-center">
                <Trophy weight="fill" className="w-9 h-9 text-[#161426]" />
              </div>
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#161426] text-[#ffca3a] text-xs font-black">
                  <Crown weight="fill" className="w-4 h-4" />
                  <span>{isAr ? 'بطل القمّة 100' : 'Summit 100 Champion'}</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-black text-[#161426]">
                  {isAr
                    ? `فاز ${winnerPlayer.name} بالسباق!`
                    : `${winnerPlayer.name} Wins the Race!`}
                </h3>
                <p className="text-sm font-extrabold text-[#475569]">
                  {gameData.winnerId === BOT_PLAYER_ID
                    ? isAr
                      ? 'الخصم الآلي خطف التاج هذه المرة — هل تنتقم منه؟'
                      : 'Arcade Bot snatched the crown — ready for a rematch?'
                    : isAr
                    ? 'حصد +4 نقاط في الترتيب العام لوصوله للمربع 100!'
                    : 'Earned +4 leaderboard points for reaching Square 100!'}
                </p>
              </div>

              {(isHost || isPassAndPlay || players.length === 1) ? (
                <button
                  type="button"
                  onClick={handleRestartBoard}
                  className="cartoon-btn bg-[#4ade80] text-[#161426] w-full py-3.5 text-lg flex items-center justify-center gap-2"
                >
                  <ArrowsClockwise weight="bold" className="w-6 h-6" />
                  <span>{isAr ? 'جولة جديدة!' : 'New Round!'}</span>
                </button>
              ) : (
                <div className="p-3 rounded-2xl bg-[#161426] text-[#ffca3a] text-sm font-extrabold">
                  {isAr
                    ? 'بانتظار المضيف لبدء جولة جديدة...'
                    : 'Waiting for host to start a new round...'}
                </div>
              )}
            </div>
          )}

          {/* 3D Dice & Active Turn Control Card */}
          {gameData.phase === 'playing' && currentTurnPlayer && (
            <div className="cartoon-card p-5 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="w-10 h-10 rounded-2xl border-[3px] border-[#161426] shadow-[0_3px_0_#161426] flex items-center justify-center text-white font-black shrink-0"
                    style={{
                      backgroundColor:
                        currentTurnPlayer.avatar_color || '#38bdf8',
                    }}
                  >
                    {currentTurnPlayerId === BOT_PLAYER_ID ? (
                      <Robot weight="fill" className="w-5 h-5 text-white" />
                    ) : (
                      (currentTurnPlayer.name[0] || '?').toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-extrabold text-[#64748b]">
                      {isAr ? 'الدور الحالي' : 'Current Turn'}
                    </div>
                    <div className="text-lg font-black text-[#161426] truncate flex items-center gap-1.5">
                      <span>{currentTurnPlayer.name}</span>
                      {gameData.shields?.[currentTurnPlayerId] && (
                        <span
                          className="inline-flex shrink-0"
                          title={isAr ? 'درع نشط' : 'Shield Active'}
                        >
                          <ShieldCheck
                            weight="fill"
                            className="w-5 h-5 text-[#0284c7]"
                          />
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="cartoon-badge bg-[#161426] text-[#ffca3a] px-3 py-1 text-sm shrink-0">
                  {isAr
                    ? `مربع ${gameData.positions?.[currentTurnPlayerId] ?? 1} / 100`
                    : `Sq ${gameData.positions?.[currentTurnPlayerId] ?? 1} / 100`}
                </div>
              </div>

              {/* Extra Roll Streak Pill when rolling a 6 */}
              {(gameData.consecutiveSixes || 0) > 0 && !isAnimating && (
                <div className="rounded-2xl bg-[#fef9c3] border-[3px] border-[#161426] px-3.5 py-2 flex items-center justify-center gap-2 text-xs sm:text-sm font-black text-[#161426]">
                  <Flame weight="fill" className="w-5 h-5 text-[#ea580c] shrink-0" />
                  <span>
                    {isAr
                      ? `جبت 6! إلك رمية إضافية (${gameData.consecutiveSixes}/2)`
                      : `Rolled a 6! Bonus Roll active (${gameData.consecutiveSixes}/2)`}
                  </span>
                </div>
              )}

              {/* 3D SVG Die + Roll Trigger */}
              <div className="flex flex-col sm:flex-row items-center gap-4 pt-1">
                <Die3DSvg
                  face={displayedDiceFace}
                  rolling={diceRollingVisual}
                  highlightSix={displayedDiceFace === 6}
                />

                <div className="flex-1 w-full space-y-2">
                  {isMyHumanTurn ? (
                    <button
                      type="button"
                      disabled={isAnimating}
                      onClick={() => executeRollForPlayer(currentTurnPlayerId)}
                      className="cartoon-btn bg-[#ff595e] hover:bg-[#ff4247] text-white w-full py-4 px-5 text-xl flex items-center justify-center gap-2.5"
                    >
                      <DiceSix weight="fill" className="w-7 h-7" />
                      <span>
                        {isAnimating
                          ? isAr
                            ? 'يتحرّك على اللوحة...'
                            : 'Moving on board...'
                          : (gameData.consecutiveSixes || 0) > 0
                          ? isAr
                            ? 'ارمِ الرمية الإضافية!'
                            : 'Roll Bonus Die!'
                          : isAr
                          ? 'ارمِ النرد!'
                          : 'Roll the Die!'}
                      </span>
                    </button>
                  ) : (
                    <div className="rounded-2xl bg-[#191636] border-[3px] border-[#161426] px-4 py-4 text-center text-[#ffca3a] font-extrabold text-sm sm:text-base flex items-center justify-center gap-2">
                      {currentTurnPlayerId === BOT_PLAYER_ID ? (
                        <>
                          <Robot weight="fill" className="w-5 h-5 animate-bounce" />
                          <span>
                            {isAr
                              ? 'الخصم الآلي يرمي النرد...'
                              : 'Arcade Bot is rolling...'}
                          </span>
                        </>
                      ) : (
                        <>
                          <Play weight="fill" className="w-4 h-4" />
                          <span>
                            {isAr
                              ? `بانتظار رمية ${currentTurnPlayer.name}...`
                              : `Waiting for ${currentTurnPlayer.name} to roll...`}
                          </span>
                        </>
                      )}
                    </div>
                  )}

                  <p className="text-[11px] font-bold text-[#64748b] text-center">
                    {isAr
                      ? 'الرقم 6 يمنحك رمية إضافية - تجاوز 100 يرتدّ للخلف!'
                      : 'Roll a 6 for an extra turn - Overshooting 100 bounces back!'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Race Progress Leaderboard */}
          <div className="cartoon-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-[#161426] flex items-center gap-2">
                <Trophy weight="fill" className="w-5 h-5 text-[#f59e0b]" />
                <span>
                  {isAr ? 'سباق القمّة (التقدّم نحو 100)' : 'Summit Race Progress'}
                </span>
              </h3>
              <span className="text-xs font-extrabold text-[#64748b]">
                {isAr ? `${rankedPlayers.length} متسابقين` : `${rankedPlayers.length} Racers`}
              </span>
            </div>

            <div className="space-y-2.5">
              {rankedPlayers.map(({ player, sq, hasShield }, idx) => {
                const isTurn =
                  gameData.phase === 'playing' &&
                  player.id === currentTurnPlayerId;
                const isMe = player.id === myPlayerId;
                const pct = Math.max(1, Math.min(100, sq));

                return (
                  <div
                    key={player.id}
                    className={`rounded-2xl border-[3px] border-[#161426] p-2.5 transition-colors ${
                      isTurn ? 'bg-[#fef9c3]' : 'bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-6 h-6 rounded-lg bg-[#161426] text-[#fff9ec] text-xs font-black flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <span
                          className="w-4 h-4 rounded-full border-2 border-[#161426] shrink-0"
                          style={{
                            backgroundColor: player.avatar_color || '#38bdf8',
                          }}
                        />
                        <span className="font-black text-sm text-[#161426] truncate">
                          {player.name}
                        </span>
                        {isMe && (
                          <span className="px-1.5 py-0.5 rounded-md bg-[#bae6fd] border border-[#161426] text-[10px] font-black text-[#161426]">
                            {isAr ? 'أنت' : 'YOU'}
                          </span>
                        )}
                        {hasShield && (
                          <span
                            className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-[#e0f2fe] border border-[#0284c7] text-[10px] font-black text-[#0369a1]"
                            title={isAr ? 'محمي بدرع ضد الثعابين' : 'Protected by Anti-Snake Shield'}
                          >
                            <ShieldCheck weight="fill" className="w-3.5 h-3.5" />
                            <span>{isAr ? 'درع' : 'Shield'}</span>
                          </span>
                        )}
                      </div>

                      <span className="text-xs font-black text-[#161426] shrink-0">
                        {sq}%
                      </span>
                    </div>

                    {/* Cartoon Progress Bar */}
                    <div className="w-full h-3 rounded-full bg-[#e2e8f0] border-2 border-[#161426] overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: player.avatar_color || '#38bdf8',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Live Dramatic Action Feed (Last 4 moves) */}
          <div className="cartoon-panel-dark p-4 space-y-2.5">
            <div className="text-xs font-black text-[#ffca3a] flex items-center gap-1.5">
              <Lightning weight="fill" className="w-4 h-4" />
              <span>
                {isAr ? 'آخر الأحداث الدرامية' : 'Live Dramatic Feed'}
              </span>
            </div>

            {recentFeed.length === 0 ? (
              <div className="text-xs font-bold text-[#94a3b8] py-2 text-center">
                {isAr
                  ? 'ارمِ النرد لبدء المطاردة بين السلالم والثعابين!'
                  : 'Roll the die to kick off the climb!'}
              </div>
            ) : (
              <div className="space-y-2">
                {recentFeed.map((item) => {
                  const actor = playerById[item.playerId]?.name || '';
                  const swappedName = item.swappedWithId
                    ? playerById[item.swappedWithId]?.name || ''
                    : '';

                  return (
                    <div
                      key={item.seq}
                      className="rounded-xl bg-[#191636] border-2 border-[#120f29] px-3 py-2 flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="px-2 py-0.5 rounded-lg bg-[#25204d] border border-[#ffca3a]/40 text-[#ffca3a] font-black shrink-0">
                          {item.dice}
                        </span>
                        <span className="font-extrabold text-[#fff9ec] truncate">
                          {actor}:{' '}
                          {item.eventType === 'win'
                            ? isAr
                              ? 'تُوّج في 100!'
                              : 'Crowned at 100!'
                            : item.eventType === 'ladder'
                            ? isAr
                              ? `سلّم (${item.landedSq} إلى ${item.toSq})`
                              : `Ladder (${item.landedSq} -> ${item.toSq})`
                            : item.eventType === 'snake'
                            ? isAr
                              ? `لدغة (${item.landedSq} إلى ${item.toSq})`
                              : `Snake (${item.landedSq} -> ${item.toSq})`
                            : item.eventType === 'shield_block'
                            ? isAr
                              ? `صدّ ثعبان ${item.landedSq} بالدرع!`
                              : `Shield saved at ${item.landedSq}!`
                            : item.eventType === 'power_swap'
                            ? isAr
                              ? `تبادل مع ${swappedName}`
                              : `Swapped w/ ${swappedName}`
                            : item.eventType === 'power_shield'
                            ? isAr
                              ? `التقط درعاً في ${item.toSq}`
                              : `Got Shield at ${item.toSq}`
                            : item.eventType === 'power_rocket'
                            ? isAr
                              ? `صاروخ +5 إلى ${item.toSq}`
                              : `Rocket +5 to ${item.toSq}`
                            : item.eventType === 'power_turbo'
                            ? isAr
                              ? `قفزة +6 إلى ${item.toSq}`
                              : `Turbo +6 to ${item.toSq}`
                            : item.eventType === 'power_banana'
                            ? isAr
                              ? `موزة -4 إلى ${item.toSq}`
                              : `Banana -4 to ${item.toSq}`
                            : isAr
                            ? `تقدّم من ${item.fromSq} إلى ${item.toSq}`
                            : `Moved ${item.fromSq} -> ${item.toSq}`}
                        </span>
                      </div>

                      <div className="shrink-0 flex items-center gap-1">
                        {item.eventType === 'ladder' && (
                          <RocketLaunch
                            weight="fill"
                            className="w-4 h-4 text-[#4ade80]"
                          />
                        )}
                        {(item.eventType === 'snake' ||
                          item.eventType === 'power_banana') && (
                          <WarningCircle
                            weight="fill"
                            className="w-4 h-4 text-[#ff595e]"
                          />
                        )}
                        {(item.eventType === 'shield_block' ||
                          item.eventType === 'power_shield') && (
                          <ShieldCheck
                            weight="fill"
                            className="w-4 h-4 text-[#38bdf8]"
                          />
                        )}
                        {item.eventType === 'power_swap' && (
                          <ArrowsLeftRight
                            weight="bold"
                            className="w-4 h-4 text-[#c084fc]"
                          />
                        )}
                        {item.eventType === 'win' && (
                          <Crown
                            weight="fill"
                            className="w-4 h-4 text-[#ffca3a]"
                          />
                        )}
                        {item.gotBonusTurn && (
                          <span className="px-1.5 py-0.5 rounded bg-[#ffca3a] text-[#161426] text-[10px] font-black">
                            +1
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SnakesAndLaddersGame;
