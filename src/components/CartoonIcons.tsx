import React from 'react';
import { PartyGameId } from '../data/partyGamesData';
import {
  ForkKnife,
  PawPrint,
  GlobeHemisphereEast,
  Briefcase,
  FilmStrip,
  CarProfile,
  Sparkle,
} from '@phosphor-icons/react';

/* ============================================================================
 * 1. ANIMATED CARTOON BOMB SVG (with Dynamic Burning Fuse & Sparks!)
 * ========================================================================== */
interface AnimatedBombSvgProps {
  secondsLeft?: number;
  maxSeconds?: number;
  letters?: string;
  exploded?: boolean;
  className?: string;
}

export const AnimatedBombSvg: React.FC<AnimatedBombSvgProps> = ({
  secondsLeft = 10,
  maxSeconds = 12,
  letters,
  exploded = false,
  className = 'w-44 h-44',
}) => {
  if (exploded) {
    return (
      <svg
        viewBox="0 0 200 200"
        className={`${className} select-none overflow-visible`}
        aria-label="Explosion"
      >
        {/* Outer Red Comic Starburst */}
        <polygon
          points="100,6 123,42 166,22 154,65 194,86 158,116 184,158 138,154 126,194 96,162 60,190 56,146 12,152 38,112 8,78 50,62 42,18 82,42"
          fill="#ff595e"
          stroke="#161426"
          strokeWidth="6"
          strokeLinejoin="round"
          className="animate-pulse"
        />
        {/* Middle Orange Starburst */}
        <polygon
          points="100,28 118,56 150,42 140,74 172,92 142,114 160,144 126,140 116,170 96,146 68,166 66,132 34,136 54,106 32,82 64,70 58,38 88,56"
          fill="#ff924c"
          stroke="#161426"
          strokeWidth="5"
          strokeLinejoin="round"
        />
        {/* Inner Yellow Core */}
        <polygon
          points="100,52 112,72 134,64 128,86 148,98 128,112 138,132 116,128 108,148 96,132 76,144 76,120 56,122 70,102 56,86 78,78 74,58 92,70"
          fill="#ffca3a"
          stroke="#161426"
          strokeWidth="4"
          strokeLinejoin="round"
        />
        {/* Flying Debris Dots */}
        <circle cx="24" cy="36" r="6" fill="#161426" />
        <circle cx="178" cy="40" r="5" fill="#ffca3a" stroke="#161426" strokeWidth="3" />
        <circle cx="182" cy="172" r="7" fill="#161426" />
        <circle cx="22" cy="168" r="5" fill="#ff595e" stroke="#161426" strokeWidth="3" />
      </svg>
    );
  }

  // Fuse ratio from 0.08 (almost touching cap) to 1.0 (full fuse)
  const ratio = Math.max(0.06, Math.min(1, secondsLeft / Math.max(1, maxSeconds)));
  const isCritical = secondsLeft <= 4;

  // Quadratic Bezier curve for fuse: P0=(100, 46), P1=(128, 10), P2=(164, 28)
  const p0 = { x: 100, y: 46 };
  const p1 = { x: 128, y: 10 };
  const p2 = { x: 164, y: 28 };

  const t = ratio;
  const invT = 1 - t;
  // Subdivide quadratic bezier from 0 to t using De Casteljau's algorithm so the fuse physically shortens!
  const q1 = {
    x: invT * p0.x + t * p1.x,
    y: invT * p0.y + t * p1.y,
  };
  const tip = {
    x: invT * invT * p0.x + 2 * invT * t * p1.x + t * t * p2.x,
    y: invT * invT * p0.y + 2 * invT * t * p1.y + t * t * p2.y,
  };

  const fusePathD = `M ${p0.x} ${p0.y} Q ${q1.x} ${q1.y} ${tip.x} ${tip.y}`;

  return (
    <svg
      viewBox="0 0 200 190"
      className={`${className} select-none overflow-visible ${
        isCritical ? 'animate-bounce' : ''
      }`}
      aria-label="Ticking Bomb"
    >
      {/* Drop Shadow under Bomb */}
      <ellipse cx="100" cy="176" rx="54" ry="10" fill="rgba(22,20,38,0.35)" />

      {/* Burnt Fuse Ghost Track (shows how much fuse already burned!) */}
      <path
        d={`M ${p0.x} ${p0.y} Q ${p1.x} ${p1.y} ${p2.x} ${p2.y}`}
        fill="none"
        stroke="#161426"
        strokeWidth="4"
        strokeDasharray="4 6"
        strokeLinecap="round"
        opacity="0.25"
      />

      {/* Remaining Rope Fuse */}
      <path
        d={fusePathD}
        fill="none"
        stroke="#161426"
        strokeWidth="11"
        strokeLinecap="round"
      />
      <path
        d={fusePathD}
        fill="none"
        stroke="#d97706"
        strokeWidth="5.5"
        strokeLinecap="round"
      />
      <path
        d={fusePathD}
        fill="none"
        stroke="#fef08a"
        strokeWidth="2.5"
        strokeDasharray="5 5"
        strokeLinecap="round"
      />

      {/* Animated Burning Spark at the Exact Tip of the Shortening Fuse! */}
      <g transform={`translate(${tip.x}, ${tip.y})`}>
        {/* Outer Glow */}
        <circle
          cx="0"
          cy="0"
          r={isCritical ? '19' : '15'}
          fill="#ff595e"
          opacity="0.45"
          className="animate-ping"
        />
        {/* Star Spark Petals */}
        <polygon
          points="0,-16 4,-5 15,-8 7,1 14,11 3,6 -2,16 -5,5 -16,8 -7,-2 -13,-12 -3,-6"
          fill="#ff595e"
          stroke="#161426"
          strokeWidth="2.5"
          strokeLinejoin="round"
        >
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="0"
            to="360"
            dur="0.9s"
            repeatCount="indefinite"
          />
        </polygon>
        <polygon
          points="0,-11 3,-3 11,-3 5,2 8,10 0,5 -8,10 -5,2 -11,-3 -3,-3"
          fill="#ffca3a"
        >
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="360"
            to="0"
            dur="0.6s"
            repeatCount="indefinite"
          />
        </polygon>
        <circle cx="0" cy="0" r="4" fill="#ffffff" />
      </g>

      {/* Bomb Metallic Fuse Nozzle / Cap */}
      <rect
        x="82"
        y="42"
        width="36"
        height="18"
        rx="6"
        fill="#64748b"
        stroke="#161426"
        strokeWidth="5"
      />
      <line x1="90" y1="47" x2="90" y2="55" stroke="#94a3b8" strokeWidth="3" strokeLinecap="round" />

      {/* Main Bomb Sphere */}
      <circle
        cx="100"
        cy="112"
        r="60"
        fill={isCritical ? '#e11d48' : '#1e1b38'}
        stroke="#161426"
        strokeWidth="6"
      />

      {/* 3D Cartoon Rim Shading */}
      <path
        d="M 55 72 A 48 48 0 0 1 88 64"
        fill="none"
        stroke={isCritical ? '#fda4af' : '#4c467d'}
        strokeWidth="7"
        strokeLinecap="round"
      />
      <circle
        cx="65"
        cy="82"
        r="4"
        fill={isCritical ? '#fda4af' : '#4c467d'}
      />

      {/* Required Letters Badge Printed on the Bomb */}
      {letters ? (
        <g>
          <rect
            x="54"
            y="92"
            width="92"
            height="42"
            rx="14"
            fill="#161426"
            stroke="#ffca3a"
            strokeWidth="3.5"
          />
          <text
            x="100"
            y="120"
            textAnchor="middle"
            fill="#ffca3a"
            fontSize="24"
            fontWeight="900"
            letterSpacing="3"
          >
            {letters}
          </text>
        </g>
      ) : (
        /* Cute/Angry Cartoon Eyes on Bomb when no text is passed */
        <g>
          <circle cx="82" cy="110" r="7" fill="#ffca3a" />
          <circle cx="118" cy="110" r="7" fill="#ffca3a" />
          <path
            d="M 72 98 L 90 104 M 128 98 L 110 104"
            stroke="#ff595e"
            strokeWidth="4"
            strokeLinecap="round"
          />
        </g>
      )}
    </svg>
  );
};

/* ============================================================================
 * 2. CUSTOM ILLUSTRATED SVG ICONS FOR THE 5 PARTY GAMES (Zero Emojis!)
 * ========================================================================== */
export const PartyGameSvgIcon: React.FC<{
  gameId: PartyGameId;
  className?: string;
}> = ({ gameId, className = 'w-9 h-9' }) => {
  if (gameId === 'wavelength') {
    return (
      <svg viewBox="0 0 64 64" className={className}>
        {/* Semicircle Wheel Base */}
        <path
          d="M 6 48 A 26 26 0 0 1 58 48 Z"
          fill="#fff9ec"
          stroke="#161426"
          strokeWidth="4"
          strokeLinejoin="round"
        />
        {/* Target Wedges */}
        <path d="M 32 48 L 22 24 A 26 26 0 0 1 42 24 Z" fill="#ff924c" stroke="#161426" strokeWidth="2.5" />
        <path d="M 32 48 L 28 22.5 A 26 26 0 0 1 36 22.5 Z" fill="#00bbf9" stroke="#161426" strokeWidth="2" />
        {/* Red Pointer Needle */}
        <line x1="32" y1="48" x2="38" y2="20" stroke="#ff595e" strokeWidth="4.5" strokeLinecap="round" />
        <circle cx="32" cy="48" r="7" fill="#ff595e" stroke="#161426" strokeWidth="3.5" />
      </svg>
    );
  }

  if (gameId === 'chameleon') {
    return (
      <svg viewBox="0 0 64 64" className={className}>
        {/* Spy Fedora Hat Brim & Crown */}
        <path
          d="M 14 28 L 20 12 L 32 15 L 44 12 L 50 28 Z"
          fill="#ffca3a"
          stroke="#161426"
          strokeWidth="4"
          strokeLinejoin="round"
        />
        <ellipse cx="32" cy="28" rx="26" ry="5" fill="#ff924c" stroke="#161426" strokeWidth="4" />
        {/* Incognito Glasses */}
        <rect x="11" y="36" width="18" height="13" rx="6" fill="#161426" stroke="#fff9ec" strokeWidth="2.5" />
        <rect x="35" y="36" width="18" height="13" rx="6" fill="#161426" stroke="#fff9ec" strokeWidth="2.5" />
        <line x1="29" y1="41" x2="35" y2="41" stroke="#161426" strokeWidth="4" />
        {/* Glowing Spy Eyes */}
        <circle cx="20" cy="42.5" r="3" fill="#00bbf9" />
        <circle cx="44" cy="42.5" r="3" fill="#00bbf9" />
      </svg>
    );
  }

  if (gameId === 'ito') {
    return (
      <svg viewBox="0 0 64 64" className={className}>
        {/* Back Card */}
        <rect
          x="10"
          y="12"
          width="28"
          height="38"
          rx="6"
          transform="rotate(-10 24 31)"
          fill="#00bbf9"
          stroke="#161426"
          strokeWidth="4"
        />
        {/* Front Card */}
        <rect
          x="24"
          y="14"
          width="30"
          height="40"
          rx="6"
          transform="rotate(8 39 34)"
          fill="#8ac926"
          stroke="#161426"
          strokeWidth="4"
        />
        <text
          x="38"
          y="41"
          textAnchor="middle"
          fill="#161426"
          fontSize="18"
          fontWeight="900"
        >
          99
        </text>
      </svg>
    );
  }

  if (gameId === 'fibbage') {
    return (
      <svg viewBox="0 0 64 64" className={className}>
        {/* Bluff Face Circle */}
        <circle cx="28" cy="34" r="20" fill="#ffca3a" stroke="#161426" strokeWidth="4" />
        {/* Winking & Open Eye */}
        <circle cx="22" cy="28" r="3" fill="#161426" />
        <path d="M 31 28 Q 35 24 39 28" fill="none" stroke="#161426" strokeWidth="3.5" strokeLinecap="round" />
        {/* Long Pinocchio Lying Nose! */}
        <path
          d="M 34 33 L 58 31 L 58 38 L 34 39 Z"
          fill="#ff924c"
          stroke="#161426"
          strokeWidth="3.5"
          strokeLinejoin="round"
        />
        {/* Cheeky Grin */}
        <path d="M 20 42 Q 28 48 36 42" fill="none" stroke="#161426" strokeWidth="3.5" strokeLinecap="round" />
      </svg>
    );
  }

  // wordbomb
  return (
    <svg viewBox="0 0 64 64" className={className}>
      {/* Fuse */}
      <path d="M 32 16 Q 42 4 54 10" fill="none" stroke="#d97706" strokeWidth="4.5" strokeLinecap="round" />
      {/* Spark */}
      <polygon
        points="54,2 56,8 62,8 57,12 59,18 54,14 49,18 51,12 46,8 52,8"
        fill="#ff595e"
        stroke="#161426"
        strokeWidth="1.5"
      />
      <circle cx="54" cy="10" r="3" fill="#ffca3a" />
      {/* Cap */}
      <rect x="25" y="14" width="14" height="7" rx="2" fill="#64748b" stroke="#161426" strokeWidth="3.5" />
      {/* Bomb Body */}
      <circle cx="32" cy="38" r="20" fill="#161426" stroke="#161426" strokeWidth="4" />
      <circle cx="32" cy="38" r="17" fill="#25204d" />
      <path d="M 21 28 A 12 12 0 0 1 31 24" fill="none" stroke="#00bbf9" strokeWidth="3.5" strokeLinecap="round" />
      <circle cx="32" cy="38" r="6" fill="#ff595e" />
    </svg>
  );
};

/* ============================================================================
 * 3. CUSTOM VECTOR CARTOON CHARACTER AVATAR (Replaces Animal Emojis!)
 * ========================================================================== */
export const CartoonAvatarSvg: React.FC<{
  index: number;
  color?: string;
  className?: string;
}> = ({ index, color = '#ffca3a', className = 'w-full h-full' }) => {
  const variant = Math.abs(index) % 6;

  return (
    <svg viewBox="0 0 100 100" className={`${className} select-none`}>
      {/* Head Base */}
      <circle cx="50" cy="54" r="32" fill={color} stroke="#161426" strokeWidth="5" />

      {/* Cheeks */}
      <circle cx="30" cy="60" r="5" fill="#ff595e" opacity="0.45" />
      <circle cx="70" cy="60" r="5" fill="#ff595e" opacity="0.45" />

      {/* Eyes Variant */}
      {variant === 0 && (
        <>
          <circle cx="38" cy="50" r="5" fill="#161426" />
          <circle cx="62" cy="50" r="5" fill="#161426" />
          <circle cx="36" cy="48" r="2" fill="#ffffff" />
          <circle cx="60" cy="48" r="2" fill="#ffffff" />
          {/* Crown */}
          <polygon
            points="28,26 36,12 50,22 64,12 72,26"
            fill="#ffca3a"
            stroke="#161426"
            strokeWidth="4"
            strokeLinejoin="round"
          />
        </>
      )}

      {variant === 1 && (
        <>
          {/* Cool Sunglasses */}
          <rect x="24" y="42" width="22" height="14" rx="4" fill="#161426" />
          <rect x="54" y="42" width="22" height="14" rx="4" fill="#161426" />
          <line x1="46" y1="47" x2="54" y2="47" stroke="#161426" strokeWidth="4" />
          <line x1="28" y1="46" x2="36" y2="46" stroke="#00bbf9" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="58" y1="46" x2="66" y2="46" stroke="#00bbf9" strokeWidth="2.5" strokeLinecap="round" />
        </>
      )}

      {variant === 2 && (
        <>
          {/* Wink + Happy Eye */}
          <path d="M 32 50 Q 38 43 44 50" fill="none" stroke="#161426" strokeWidth="4.5" strokeLinecap="round" />
          <circle cx="62" cy="50" r="5" fill="#161426" />
          {/* Top Hair Tuft */}
          <path d="M 46 22 Q 52 8 62 18" fill="none" stroke="#161426" strokeWidth="5" strokeLinecap="round" />
        </>
      )}

      {variant === 3 && (
        <>
          {/* Big Round Glasses */}
          <circle cx="37" cy="50" r="10" fill="#ffffff" stroke="#161426" strokeWidth="4" />
          <circle cx="63" cy="50" r="10" fill="#ffffff" stroke="#161426" strokeWidth="4" />
          <line x1="47" y1="50" x2="53" y2="50" stroke="#161426" strokeWidth="4" />
          <circle cx="37" cy="50" r="4" fill="#161426" />
          <circle cx="63" cy="50" r="4" fill="#161426" />
        </>
      )}

      {variant === 4 && (
        <>
          {/* Ninja / Sport Headband */}
          <path d="M 20 40 Q 50 34 80 40" fill="none" stroke="#ff595e" strokeWidth="8" strokeLinecap="round" />
          <circle cx="38" cy="52" r="5" fill="#161426" />
          <circle cx="62" cy="52" r="5" fill="#161426" />
        </>
      )}

      {variant === 5 && (
        <>
          {/* Robot Antenna + Visor */}
          <line x1="50" y1="22" x2="50" y2="10" stroke="#161426" strokeWidth="4" />
          <circle cx="50" cy="10" r="5" fill="#ff595e" stroke="#161426" strokeWidth="3" />
          <rect x="28" y="43" width="44" height="13" rx="6" fill="#161426" />
          <circle cx="40" cy="49.5" r="3.5" fill="#8ac926" />
          <circle cx="60" cy="49.5" r="3.5" fill="#8ac926" />
        </>
      )}

      {/* Smile */}
      <path
        d="M 38 66 Q 50 76 62 66"
        fill="none"
        stroke="#161426"
        strokeWidth="4.5"
        strokeLinecap="round"
      />
    </svg>
  );
};

/* ============================================================================
 * 4. CATEGORY / TOPIC ICON (Replaces Topic Emojis!)
 * ========================================================================== */
export const TopicCategoryIcon: React.FC<{
  topicId: string;
  className?: string;
}> = ({ topicId, className = 'w-5 h-5' }) => {
  switch (topicId) {
    case 'food':
      return <ForkKnife weight="fill" className={className} />;
    case 'animals':
      return <PawPrint weight="fill" className={className} />;
    case 'countries':
      return <GlobeHemisphereEast weight="fill" className={className} />;
    case 'jobs':
      return <Briefcase weight="fill" className={className} />;
    case 'movies':
      return <FilmStrip weight="fill" className={className} />;
    case 'transport':
      return <CarProfile weight="fill" className={className} />;
    default:
      return <Sparkle weight="fill" className={className} />;
  }
};
