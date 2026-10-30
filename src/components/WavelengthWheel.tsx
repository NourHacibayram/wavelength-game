import React, { useRef, useState, useCallback } from 'react';
import { WEDGE_WIDTH_DEG } from '../data/cards';
import { CaretLeft, CaretRight, Eye, EyeSlash, LockKey } from '@phosphor-icons/react';

interface WavelengthWheelProps {
  targetAngle: number;
  dialAngle: number;
  showTarget: boolean;
  canMoveDial: boolean;
  onDialChange: (newAngle: number, isFinal?: boolean) => void;
  otherTeamGuess?: 'left' | 'right' | null;
  lang: 'ar' | 'en';
}

const CX = 300;
const CY = 285;
const R_FACE = 224;
const R_BEZEL = 250;
const R_SCALLOP = 264;

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

function createWedgePath(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const clampedStart = Math.max(-90, Math.min(90, startAngle));
  const clampedEnd = Math.max(-90, Math.min(90, endAngle));
  const start = polarToCartesian(cx, cy, r, clampedStart);
  const end = polarToCartesian(cx, cy, r, clampedEnd);
  const largeArcFlag = clampedEnd - clampedStart <= 180 ? '0' : '1';

  return [
    `M ${cx} ${cy}`,
    `L ${start.x.toFixed(2)} ${start.y.toFixed(2)}`,
    `A ${r} ${r} 0 ${largeArcFlag} 1 ${end.x.toFixed(2)} ${end.y.toFixed(2)}`,
    'Z',
  ].join(' ');
}

export const WavelengthWheel: React.FC<WavelengthWheelProps> = ({
  targetAngle,
  dialAngle,
  showTarget,
  canMoveDial,
  onDialChange,
  otherTeamGuess,
  lang,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const computeAngleFromPointer = useCallback((clientX: number, clientY: number) => {
    if (!svgRef.current) return null;
    const rect = svgRef.current.getBoundingClientRect();
    const scaleX = 600 / rect.width;
    const scaleY = 355 / rect.height;
    const svgX = (clientX - rect.left) * scaleX;
    const svgY = (clientY - rect.top) * scaleY;

    const dx = svgX - CX;
    const dy = svgY - CY;
    // Allow dragging slightly below the baseline without flipping
    const effectiveDy = Math.min(dy, -8);
    const rawAngle = (Math.atan2(dx, -effectiveDy) * 180) / Math.PI;
    const clamped = Math.max(-85, Math.min(85, rawAngle));
    return Math.round(clamped * 2) / 2;
  }, []);

  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!canMoveDial) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDragging(true);
    const nextAngle = computeAngleFromPointer(e.clientX, e.clientY);
    if (nextAngle !== null) {
      onDialChange(nextAngle, false);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!canMoveDial || !isDragging) return;
    const nextAngle = computeAngleFromPointer(e.clientX, e.clientY);
    if (nextAngle !== null) {
      onDialChange(nextAngle, false);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!canMoveDial || !isDragging) return;
    setIsDragging(false);
    const nextAngle = computeAngleFromPointer(e.clientX, e.clientY);
    if (nextAngle !== null) {
      onDialChange(nextAngle, true);
    } else {
      onDialChange(dialAngle, true);
    }
  };

  const nudgeAngle = (delta: number) => {
    if (!canMoveDial) return;
    const next = Math.max(-85, Math.min(85, Math.round((dialAngle + delta) * 2) / 2));
    onDialChange(next, true);
  };

  // Generate scalloped cartoon gear teeth around the upper semicircle
  const scallopCircles = [];
  const numScallops = 23;
  for (let i = 0; i < numScallops; i++) {
    const a = -90 + (i * 180) / (numScallops - 1);
    const pt = polarToCartesian(CX, CY, R_BEZEL - 2, a);
    scallopCircles.push(pt);
  }

  // Generate degree ticks along the inner curve
  const ticks = [];
  for (let a = -80; a <= 80; a += 10) {
    const p1 = polarToCartesian(CX, CY, R_FACE - 6, a);
    const p2 = polarToCartesian(CX, CY, R_FACE - (a % 20 === 0 ? 18 : 11), a);
    ticks.push({ a, p1, p2, major: a % 20 === 0 });
  }

  // 5 Target wedges centered at targetAngle
  const wedges = [
    {
      points: '2',
      color: '#ffaa1d', // Cartoon Golden Yellow-Orange
      start: targetAngle - WEDGE_WIDTH_DEG * 2.5,
      end: targetAngle - WEDGE_WIDTH_DEG * 1.5,
      mid: targetAngle - WEDGE_WIDTH_DEG * 2,
    },
    {
      points: '3',
      color: '#ff5722', // Cartoon Vibrant Orange-Red
      start: targetAngle - WEDGE_WIDTH_DEG * 1.5,
      end: targetAngle - WEDGE_WIDTH_DEG * 0.5,
      mid: targetAngle - WEDGE_WIDTH_DEG * 1,
    },
    {
      points: '4',
      color: '#3898b8', // Iconic Wavelength Teal-Blue
      start: targetAngle - WEDGE_WIDTH_DEG * 0.5,
      end: targetAngle + WEDGE_WIDTH_DEG * 0.5,
      mid: targetAngle,
    },
    {
      points: '3',
      color: '#ff5722',
      start: targetAngle + WEDGE_WIDTH_DEG * 0.5,
      end: targetAngle + WEDGE_WIDTH_DEG * 1.5,
      mid: targetAngle + WEDGE_WIDTH_DEG * 1,
    },
    {
      points: '2',
      color: '#ffaa1d',
      start: targetAngle + WEDGE_WIDTH_DEG * 1.5,
      end: targetAngle + WEDGE_WIDTH_DEG * 2.5,
      mid: targetAngle + WEDGE_WIDTH_DEG * 2,
    },
  ];

  // Speckle dots for the dark-navy frame & shutter cover
  const speckles = [
    { x: 140, y: 180, r: 2.2 }, { x: 185, y: 120, r: 1.8 }, { x: 240, y: 95, r: 2.5 },
    { x: 310, y: 88, r: 1.7 }, { x: 375, y: 112, r: 2.3 }, { x: 430, y: 165, r: 1.9 },
    { x: 165, y: 235, r: 2.4 }, { x: 445, y: 230, r: 2.1 }, { x: 280, y: 155, r: 1.6 },
    { x: 345, y: 180, r: 2.2 }, { x: 215, y: 195, r: 1.9 }, { x: 390, y: 215, r: 2.5 },
  ];

  return (
    <div className="relative w-full max-w-[600px] mx-auto select-none">
      {/* Status Pill Above the Wheel */}
      <div className="flex items-center justify-center mb-2">
        {showTarget ? (
          <div className="cartoon-badge bg-[#ffca3a] text-[#161426] px-4 py-1 text-sm md:text-base flex items-center gap-2">
            <Eye weight="fill" className="w-5 h-5" />
            <span>{lang === 'ar' ? 'الهدف مكشوف!' : 'Target Revealed!'}</span>
          </div>
        ) : (
          <div className="cartoon-badge bg-[#2d265e] text-[#fff9ec] px-4 py-1 text-sm md:text-base flex items-center gap-2">
            <EyeSlash weight="fill" className="w-5 h-5 text-[#ffca3a]" />
            <span>{lang === 'ar' ? 'الهدف مخفي خلف الغطاء الأزرق' : 'Target Hidden Behind Screen'}</span>
          </div>
        )}
      </div>

      {/* Main Cartoon SVG Wheel */}
      <div className="relative">
        <svg
          ref={svgRef}
          viewBox="0 0 600 355"
          className={`w-full h-auto drop-shadow-[0_10px_0_#120f29] ${
            canMoveDial ? 'cursor-grab active:cursor-grabbing touch-none' : 'cursor-default'
          }`}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        >
          <defs>
            {/* Clip path for the inner cream semicircle */}
            <clipPath id="dialFaceClip">
              <path
                d={`M ${CX - R_FACE} ${CY} A ${R_FACE} ${R_FACE} 0 0 1 ${CX + R_FACE} ${CY} Z`}
              />
            </clipPath>

            {/* Radial subtle shading on cream face */}
            <radialGradient id="creamFaceGrad" cx="50%" cy="90%" r="85%">
              <stop offset="0%" stopColor="#fffdf7" />
              <stop offset="80%" stopColor="#f7f1df" />
              <stop offset="100%" stopColor="#ebe2c8" />
            </radialGradient>

            {/* Glossy red needle gradient */}
            <linearGradient id="redNeedleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ff3b5c" />
              <stop offset="55%" stopColor="#e11538" />
              <stop offset="100%" stopColor="#b00b28" />
            </linearGradient>
          </defs>

          {/* 1. Scalloped Cream Gear Ring (Back Layer) */}
          <g>
            {/* Outer cream base semicircle */}
            <path
              d={`M ${CX - R_SCALLOP} ${CY} A ${R_SCALLOP} ${R_SCALLOP} 0 0 1 ${CX + R_SCALLOP} ${CY} Z`}
              fill="#f8f4e8"
              stroke="#161426"
              strokeWidth="6"
            />
            {scallopCircles.map((pt, idx) => (
              <circle
                key={idx}
                cx={pt.x}
                cy={pt.y}
                r="24"
                fill="#f8f4e8"
                stroke="#161426"
                strokeWidth="6"
              />
            ))}
            {/* Inner fill to merge scallops cleanly */}
            <path
              d={`M ${CX - (R_SCALLOP - 3)} ${CY} A ${R_SCALLOP - 3} ${R_SCALLOP - 3} 0 0 1 ${CX + (R_SCALLOP - 3)} ${CY} Z`}
              fill="#f8f4e8"
            />
          </g>

          {/* 2. Speckled Deep-Navy Bezel Ring */}
          <path
            d={`M ${CX - R_BEZEL} ${CY} A ${R_BEZEL} ${R_BEZEL} 0 0 1 ${CX + R_BEZEL} ${CY} L ${CX + R_BEZEL} ${CY + 24} L ${CX - R_BEZEL} ${CY + 24} Z`}
            fill="#0b2842"
            stroke="#161426"
            strokeWidth="6"
            strokeLinejoin="round"
          />

          {/* Cartoon shine arc on the navy bezel */}
          <path
            d={`M ${CX - R_BEZEL + 16} ${CY - 15} A ${R_BEZEL - 12} ${R_BEZEL - 12} 0 0 1 ${CX + R_BEZEL - 16} ${CY - 15}`}
            fill="none"
            stroke="rgba(125, 211, 252, 0.22)"
            strokeWidth="5"
            strokeLinecap="round"
          />

          {/* 3. Inner Cream Semicircle Face */}
          <g clipPath="url(#dialFaceClip)">
            <path
              d={`M ${CX - R_FACE} ${CY} A ${R_FACE} ${R_FACE} 0 0 1 ${CX + R_FACE} ${CY} Z`}
              fill="url(#creamFaceGrad)"
            />

            {/* Subtle degree ticks when cover is open or closed */}
            {ticks.map((t, i) => (
              <line
                key={i}
                x1={t.p1.x}
                y1={t.p1.y}
                x2={t.p2.x}
                y2={t.p2.y}
                stroke="#d5cbb2"
                strokeWidth={t.major ? '3' : '2'}
                strokeLinecap="round"
              />
            ))}

            {/* 4. Target Scoring Wedges (2 - 3 - 4 - 3 - 2) */}
            {showTarget && (
              <g className="transition-opacity duration-300">
                {wedges.map((w, index) => {
                  const pathD = createWedgePath(CX, CY, R_FACE, w.start, w.end);
                  const labelPos = polarToCartesian(CX, CY, R_FACE - 28, w.mid);
                  return (
                    <g key={index}>
                      <path
                        d={pathD}
                        fill={w.color}
                        stroke="#161426"
                        strokeWidth="3.5"
                        strokeLinejoin="round"
                      />
                      <text
                        x={labelPos.x}
                        y={labelPos.y}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill="#161426"
                        fontSize="24"
                        fontWeight="800"
                        transform={`rotate(${w.mid}, ${labelPos.x}, ${labelPos.y})`}
                      >
                        {w.points}
                      </text>
                    </g>
                  );
                })}
              </g>
            )}

            {/* 5. Sliding Cartoon Navy Shutter Screen (When Target is Hidden) */}
            {!showTarget && (
              <g>
                <path
                  d={`M ${CX - R_FACE} ${CY} A ${R_FACE} ${R_FACE} 0 0 1 ${CX + R_FACE} ${CY} Z`}
                  fill="#0f3152"
                />
                {/* Decorative rays on the closed shutter */}
                {[-60, -30, 0, 30, 60].map((rayAngle) => {
                  const p = polarToCartesian(CX, CY, R_FACE, rayAngle);
                  return (
                    <line
                      key={rayAngle}
                      x1={CX}
                      y1={CY}
                      x2={p.x}
                      y2={p.y}
                      stroke="rgba(186, 230, 253, 0.12)"
                      strokeWidth="3"
                      strokeDasharray="8 8"
                    />
                  );
                })}
                {/* Cosmic speckles on the shutter */}
                {speckles.map((s, idx) => (
                  <circle
                    key={idx}
                    cx={s.x}
                    cy={s.y}
                    r={s.r}
                    fill="rgba(186, 230, 253, 0.55)"
                  />
                ))}
                {/* Question mark badge in the middle of the closed shutter */}
                <circle
                  cx={CX}
                  cy={CY - 125}
                  r="30"
                  fill="#17426b"
                  stroke="#161426"
                  strokeWidth="4"
                />
                <text
                  x={CX}
                  y={CY - 122}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="#ffca3a"
                  fontSize="34"
                  fontWeight="800"
                >
                  ?
                </text>
              </g>
            )}

            {/* Inner shadow arc around the cream face */}
            <path
              d={`M ${CX - R_FACE} ${CY} A ${R_FACE} ${R_FACE} 0 0 1 ${CX + R_FACE} ${CY}`}
              fill="none"
              stroke="#161426"
              strokeWidth="8"
            />
          </g>

          {/* Base Bar across the bottom of the semicircle */}
          <rect
            x={CX - R_BEZEL - 6}
            y={CY - 4}
            width={(R_BEZEL + 6) * 2}
            height="32"
            rx="14"
            fill="#092138"
            stroke="#161426"
            strokeWidth="6"
          />

          {/* Mint-Turquoise Accent Ring behind the Red Hub (like the physical device!) */}
          <circle
            cx={CX}
            cy={CY}
            r="56"
            fill="#6ee7b7"
            stroke="#161426"
            strokeWidth="5"
          />

          {/* Other Team Left/Right Flag Indicator (in Teams Mode) */}
          {otherTeamGuess && (
            <g
              transform={`translate(${otherTeamGuess === 'left' ? CX - 175 : CX + 175}, ${CY - 40})`}
            >
              <rect
                x="-52"
                y="-18"
                width="104"
                height="34"
                rx="17"
                fill="#ffca3a"
                stroke="#161426"
                strokeWidth="4"
              />
              <text
                x="0"
                y="1"
                textAnchor="middle"
                dominantBaseline="central"
                fill="#161426"
                fontSize="14"
                fontWeight="800"
              >
                {otherTeamGuess === 'left'
                  ? lang === 'ar'
                    ? '⬅️ تخمين الخصم'
                    : '⬅️ Team B Guess'
                  : lang === 'ar'
                  ? 'تخمين الخصم ➡️'
                  : 'Team B Guess ➡️'}
              </text>
            </g>
          )}

          {/* 6. The Iconic Crimson Red Rotating Pointer Arm & Hub */}
          <g
            transform={`rotate(${dialAngle}, ${CX}, ${CY})`}
            style={{
              transition: isDragging ? 'none' : 'transform 0.14s cubic-bezier(0.22, 1, 0.36, 1)',
            }}
          >
            {/* Drop shadow of the needle */}
            <path
              d={`M ${CX - 13} ${CY} L ${CX - 5} ${CY - (R_FACE - 22)} A 5 5 0 0 1 ${CX + 5} ${
                CY - (R_FACE - 22)
              } L ${CX + 13} ${CY} Z`}
              fill="rgba(22, 20, 38, 0.35)"
              transform="translate(5, 5)"
            />

            {/* Main Crimson Needle Stick */}
            <path
              d={`M ${CX - 13} ${CY} L ${CX - 5} ${CY - (R_FACE - 22)} A 5 5 0 0 1 ${CX + 5} ${
                CY - (R_FACE - 22)
              } L ${CX + 13} ${CY} Z`}
              fill="url(#redNeedleGrad)"
              stroke="#161426"
              strokeWidth="5"
              strokeLinejoin="round"
            />

            {/* Cartoon white highlight line along the needle */}
            <line
              x1={CX - 3}
              y1={CY - 55}
              x2={CX - 2}
              y2={CY - (R_FACE - 34)}
              stroke="rgba(255, 255, 255, 0.55)"
              strokeWidth="3.5"
              strokeLinecap="round"
            />

            {/* Chunky Red Central Knob */}
            <circle
              cx={CX}
              cy={CY}
              r="46"
              fill="url(#redNeedleGrad)"
              stroke="#161426"
              strokeWidth="6"
            />

            {/* Inner 3D Cap of the Red Knob */}
            <circle
              cx={CX}
              cy={CY - 3}
              r="33"
              fill="#f42447"
              stroke="#161426"
              strokeWidth="3.5"
            />

            {/* Glossy Cartoon Specular Highlight on the Knob */}
            <ellipse
              cx={CX - 11}
              cy={CY - 14}
              rx="10"
              ry="6"
              transform={`rotate(-25, ${CX - 11}, ${CY - 14})`}
              fill="rgba(255, 255, 255, 0.55)"
            />
          </g>
        </svg>
      </div>

      {/* Fine-Tune Controls & Angle Indicator Bar Under the Wheel (always physical LTR to match wheel geometry) */}
      <div dir="ltr" className="flex items-center justify-between gap-2 mt-1 px-2">
        <button
          type="button"
          disabled={!canMoveDial}
          onClick={() => nudgeAngle(-2)}
          className="cartoon-btn bg-[#2d265e] hover:bg-[#393075] text-white px-3.5 py-2 flex items-center gap-1.5 text-sm"
        >
          <CaretLeft weight="bold" className="w-4 h-4" />
          <span>{lang === 'ar' ? 'يسار' : 'Left'}</span>
        </button>

        <div className="cartoon-badge bg-[#161426] text-[#ffca3a] px-4 py-1 text-sm flex items-center gap-2">
          {!canMoveDial && <LockKey weight="fill" className="w-4 h-4 text-[#ff595e]" />}
          <span className="font-bold">
            {dialAngle > 0 ? `+${dialAngle}°` : `${dialAngle}°`}
          </span>
        </div>

        <button
          type="button"
          disabled={!canMoveDial}
          onClick={() => nudgeAngle(2)}
          className="cartoon-btn bg-[#2d265e] hover:bg-[#393075] text-white px-3.5 py-2 flex items-center gap-1.5 text-sm"
        >
          <span>{lang === 'ar' ? 'يمين' : 'Right'}</span>
          <CaretRight weight="bold" className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
