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
  SoccerBall,
  MapPin,
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
        <polygon
          points="100,6 123,42 166,22 154,65 194,86 158,116 184,158 138,154 126,194 96,162 60,190 56,146 12,152 38,112 8,78 50,62 42,18 82,42"
          fill="#ff595e"
          stroke="#161426"
          strokeWidth="6"
          strokeLinejoin="round"
          className="animate-pulse"
        />
        <polygon
          points="100,28 118,56 150,42 140,74 172,92 142,114 160,144 126,140 116,170 96,146 68,166 66,132 34,136 54,106 32,82 64,70 58,38 88,56"
          fill="#ff924c"
          stroke="#161426"
          strokeWidth="5"
          strokeLinejoin="round"
        />
        <polygon
          points="100,52 112,72 134,64 128,86 148,98 128,112 138,132 116,128 108,148 96,132 76,144 76,120 56,122 70,102 56,86 78,78 74,58 92,70"
          fill="#ffca3a"
          stroke="#161426"
          strokeWidth="4"
          strokeLinejoin="round"
        />
        <circle cx="24" cy="36" r="6" fill="#161426" />
        <circle cx="178" cy="40" r="5" fill="#ffca3a" stroke="#161426" strokeWidth="3" />
        <circle cx="182" cy="172" r="7" fill="#161426" />
        <circle cx="22" cy="168" r="5" fill="#ff595e" stroke="#161426" strokeWidth="3" />
      </svg>
    );
  }

  const ratio = Math.max(0.06, Math.min(1, secondsLeft / Math.max(1, maxSeconds)));
  const isCritical = secondsLeft <= 4;

  const p0 = { x: 100, y: 46 };
  const p1 = { x: 128, y: 10 };
  const p2 = { x: 164, y: 28 };

  const t = ratio;
  const invT = 1 - t;
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
      <ellipse cx="100" cy="176" rx="54" ry="10" fill="rgba(22,20,38,0.35)" />

      <path
        d={`M ${p0.x} ${p0.y} Q ${p1.x} ${p1.y} ${p2.x} ${p2.y}`}
        fill="none"
        stroke="#161426"
        strokeWidth="4"
        strokeDasharray="4 6"
        strokeLinecap="round"
        opacity="0.25"
      />

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

      <g transform={`translate(${tip.x}, ${tip.y})`}>
        <circle
          cx="0"
          cy="0"
          r={isCritical ? '19' : '15'}
          fill="#ff595e"
          opacity="0.45"
          className="animate-ping"
        />
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

      <circle
        cx="100"
        cy="112"
        r="60"
        fill={isCritical ? '#e11d48' : '#1e1b38'}
        stroke="#161426"
        strokeWidth="6"
      />

      <path
        d="M 55 72 A 48 48 0 0 1 88 64"
        fill="none"
        stroke={isCritical ? '#fda4af' : '#4c467d'}
        strokeWidth="7"
        strokeLinecap="round"
      />
      <circle cx="65" cy="82" r="4" fill={isCritical ? '#fda4af' : '#4c467d'} />

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
 * 2. CUSTOM ILLUSTRATED SVG ICONS FOR ALL 14 PARTY GAMES (Zero Emojis!)
 * ========================================================================== */
export const PartyGameSvgIcon: React.FC<{
  gameId: PartyGameId;
  className?: string;
}> = ({ gameId, className = 'w-9 h-9' }) => {
  switch (gameId) {
    case 'wavelength':
      return (
        <svg viewBox="0 0 64 64" className={className}>
          <path
            d="M 6 48 A 26 26 0 0 1 58 48 Z"
            fill="#fff9ec"
            stroke="#161426"
            strokeWidth="4"
            strokeLinejoin="round"
          />
          <path d="M 32 48 L 22 24 A 26 26 0 0 1 42 24 Z" fill="#ff924c" stroke="#161426" strokeWidth="2.5" />
          <path d="M 32 48 L 28 22.5 A 26 26 0 0 1 36 22.5 Z" fill="#00bbf9" stroke="#161426" strokeWidth="2" />
          <line x1="32" y1="48" x2="38" y2="20" stroke="#ff595e" strokeWidth="4.5" strokeLinecap="round" />
          <circle cx="32" cy="48" r="7" fill="#ff595e" stroke="#161426" strokeWidth="3.5" />
        </svg>
      );

    case 'chameleon':
      return (
        <svg viewBox="0 0 64 64" className={className}>
          <path
            d="M 14 28 L 20 12 L 32 15 L 44 12 L 50 28 Z"
            fill="#ffca3a"
            stroke="#161426"
            strokeWidth="4"
            strokeLinejoin="round"
          />
          <ellipse cx="32" cy="28" rx="26" ry="5" fill="#ff924c" stroke="#161426" strokeWidth="4" />
          <rect x="11" y="36" width="18" height="13" rx="6" fill="#161426" stroke="#fff9ec" strokeWidth="2.5" />
          <rect x="35" y="36" width="18" height="13" rx="6" fill="#161426" stroke="#fff9ec" strokeWidth="2.5" />
          <line x1="29" y1="41" x2="35" y2="41" stroke="#161426" strokeWidth="4" />
          <circle cx="20" cy="42.5" r="3" fill="#00bbf9" />
          <circle cx="44" cy="42.5" r="3" fill="#00bbf9" />
        </svg>
      );

    case 'ito':
      return (
        <svg viewBox="0 0 64 64" className={className}>
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
          <text x="38" y="41" textAnchor="middle" fill="#161426" fontSize="18" fontWeight="900">
            99
          </text>
        </svg>
      );

    case 'taboo':
      return (
        <svg viewBox="0 0 64 64" className={className}>
          {/* Speech Bubble */}
          <path
            d="M 10 14 H 54 A 6 6 0 0 1 60 20 V 42 A 6 6 0 0 1 54 48 H 28 L 16 58 V 48 H 10 A 6 6 0 0 1 4 42 V 20 A 6 6 0 0 1 10 14 Z"
            fill="#fff9ec"
            stroke="#161426"
            strokeWidth="4"
            strokeLinejoin="round"
          />
          {/* Forbidden Circle Slash */}
          <circle cx="32" cy="31" r="12" fill="#ff595e" stroke="#161426" strokeWidth="3.5" />
          <line x1="24" y1="23" x2="40" y2="39" stroke="#fff9ec" strokeWidth="4" strokeLinecap="round" />
        </svg>
      );

    case 'dixit':
      return (
        <svg viewBox="0 0 64 64" className={className}>
          {/* Surreal Art Frame */}
          <rect x="12" y="6" width="40" height="52" rx="8" fill="#3b1d6e" stroke="#161426" strokeWidth="4" />
          {/* Golden Crescent Moon */}
          <path
            d="M 38 18 A 11 11 0 1 0 38 40 A 8 8 0 1 1 38 18 Z"
            fill="#ffca3a"
            stroke="#161426"
            strokeWidth="2.5"
          />
          {/* Floating Pink Cloud */}
          <path
            d="M 18 46 Q 22 40 28 43 Q 34 38 40 43 Q 46 41 46 47 Z"
            fill="#f15bb5"
            stroke="#161426"
            strokeWidth="2.5"
          />
          {/* Twinkling Star */}
          <polygon points="24,18 26,22 30,24 26,26 24,30 22,26 18,24 22,22" fill="#00f5d4" />
        </svg>
      );

    case 'witness':
      return (
        <svg viewBox="0 0 64 64" className={className}>
          {/* Monster Polaroid Frame */}
          <rect x="8" y="8" width="48" height="48" rx="10" fill="#e0f7ff" stroke="#161426" strokeWidth="4" />
          {/* Cute Bizarre 1-Eyed Horned Creature */}
          <path d="M 18 22 L 14 12 L 24 18 Z" fill="#ffca3a" stroke="#161426" strokeWidth="3" strokeLinejoin="round" />
          <path d="M 46 22 L 50 12 L 40 18 Z" fill="#ffca3a" stroke="#161426" strokeWidth="3" strokeLinejoin="round" />
          <path
            d="M 16 48 Q 16 20 32 20 Q 48 20 48 48 Z"
            fill="#00bbf9"
            stroke="#161426"
            strokeWidth="3.5"
          />
          <circle cx="32" cy="33" r="8" fill="#ffffff" stroke="#161426" strokeWidth="3" />
          <circle cx="32" cy="33" r="3.5" fill="#161426" />
          <polygon points="27,44 30,48 33,44" fill="#ffffff" stroke="#161426" strokeWidth="2" />
          <polygon points="33,44 36,48 39,44" fill="#ffffff" stroke="#161426" strokeWidth="2" />
        </svg>
      );

    case 'fakeartist':
      return (
        <svg viewBox="0 0 64 64" className={className}>
          {/* Artist Palette */}
          <path
            d="M 32 10 C 16 10 8 22 8 34 C 8 47 18 54 30 54 C 35 54 38 50 36 46 C 35 43 38 40 42 40 H 46 C 53 40 58 34 56 26 C 54 16 44 10 32 10 Z"
            fill="#ffca3a"
            stroke="#161426"
            strokeWidth="4"
          />
          <circle cx="20" cy="26" r="4" fill="#ff595e" stroke="#161426" strokeWidth="2" />
          <circle cx="30" cy="19" r="4" fill="#00bbf9" stroke="#161426" strokeWidth="2" />
          <circle cx="42" cy="23" r="4" fill="#8ac926" stroke="#161426" strokeWidth="2" />
          <circle cx="19" cy="38" r="4" fill="#9b5de5" stroke="#161426" strokeWidth="2" />
          {/* Paintbrush */}
          <path d="M 36 48 L 56 12" stroke="#161426" strokeWidth="6" strokeLinecap="round" />
          <path d="M 36 48 L 56 12" stroke="#ff924c" strokeWidth="3" strokeLinecap="round" />
        </svg>
      );

    case 'medium':
      return (
        <svg viewBox="0 0 64 64" className={className}>
          {/* Left Mind Sphere */}
          <circle cx="22" cy="34" r="15" fill="#00bbf9" stroke="#161426" strokeWidth="4" />
          {/* Right Mind Sphere */}
          <circle cx="42" cy="34" r="15" fill="#f15bb5" stroke="#161426" strokeWidth="4" opacity="0.9" />
          {/* Overlap Spark Bolt */}
          <polygon
            points="34,12 24,33 32,33 28,52 42,29 33,29"
            fill="#ffca3a"
            stroke="#161426"
            strokeWidth="3"
            strokeLinejoin="round"
          />
        </svg>
      );

    case 'soclover':
      return (
        <svg viewBox="0 0 64 64" className={className}>
          {/* 4-Leaf Clover Board */}
          <circle cx="22" cy="22" r="13" fill="#8ac926" stroke="#161426" strokeWidth="4" />
          <circle cx="42" cy="22" r="13" fill="#8ac926" stroke="#161426" strokeWidth="4" />
          <circle cx="22" cy="42" r="13" fill="#8ac926" stroke="#161426" strokeWidth="4" />
          <circle cx="42" cy="42" r="13" fill="#8ac926" stroke="#161426" strokeWidth="4" />
          <rect x="20" y="20" width="24" height="24" rx="6" fill="#38b000" />
          <circle cx="32" cy="32" r="8" fill="#ffca3a" stroke="#161426" strokeWidth="3.5" />
        </svg>
      );

    case 'wits':
      return (
        <svg viewBox="0 0 64 64" className={className}>
          {/* Casino Chip Stack */}
          <ellipse cx="32" cy="48" rx="22" ry="8" fill="#ff595e" stroke="#161426" strokeWidth="4" />
          <ellipse cx="32" cy="38" rx="22" ry="8" fill="#00bbf9" stroke="#161426" strokeWidth="4" />
          <ellipse cx="32" cy="28" rx="22" ry="8" fill="#ffca3a" stroke="#161426" strokeWidth="4" />
          <polygon
            points="32,19 35,25 41,25 36,29 38,34 32,31 26,34 28,29 23,25 29,25"
            fill="#161426"
          />
        </svg>
      );

    case 'insider':
      return (
        <svg viewBox="0 0 64 64" className={className}>
          {/* Red Pyramid / All-Seeing Insider Eye */}
          <polygon
            points="32,8 58,52 6,52"
            fill="#ff595e"
            stroke="#161426"
            strokeWidth="4"
            strokeLinejoin="round"
          />
          <ellipse cx="32" cy="37" rx="12" ry="8" fill="#fff9ec" stroke="#161426" strokeWidth="3.5" />
          <circle cx="32" cy="37" r="4.5" fill="#161426" />
          <circle cx="34" cy="35" r="1.5" fill="#ffca3a" />
        </svg>
      );

    case 'decrypto':
      return (
        <svg viewBox="0 0 64 64" className={className}>
          {/* Retro Code Screen */}
          <rect x="6" y="12" width="52" height="40" rx="8" fill="#1e1b38" stroke="#161426" strokeWidth="4" />
          <rect x="12" y="18" width="40" height="20" rx="4" fill="#00bbf9" stroke="#161426" strokeWidth="3" />
          <text x="32" y="33" textAnchor="middle" fill="#161426" fontSize="14" fontWeight="900">
            3-1-4
          </text>
          <circle cx="20" cy="45" r="3" fill="#ff595e" />
          <circle cx="32" cy="45" r="3" fill="#ffca3a" />
          <circle cx="44" cy="45" r="3" fill="#8ac926" />
        </svg>
      );

    case 'cockroach':
      return (
        <svg viewBox="0 0 64 64" className={className}>
          {/* Poker Card with Cheeky Bug */}
          <rect
            x="12"
            y="6"
            width="40"
            height="52"
            rx="7"
            fill="#fff9ec"
            stroke="#161426"
            strokeWidth="4"
          />
          {/* Cute Bug Antennas */}
          <path d="M 28 22 Q 22 12 18 15" fill="none" stroke="#161426" strokeWidth="3" strokeLinecap="round" />
          <path d="M 36 22 Q 42 12 46 15" fill="none" stroke="#161426" strokeWidth="3" strokeLinecap="round" />
          {/* Bug Body */}
          <ellipse cx="32" cy="36" rx="11" ry="13" fill="#8ac926" stroke="#161426" strokeWidth="3.5" />
          {/* Cool Poker Shades */}
          <rect x="20" y="27" width="11" height="7" rx="2" fill="#161426" />
          <rect x="33" y="27" width="11" height="7" rx="2" fill="#161426" />
          <line x1="31" y1="30" x2="33" y2="30" stroke="#161426" strokeWidth="3" />
          <path d="M 27 41 Q 32 45 37 41" fill="none" stroke="#161426" strokeWidth="3" strokeLinecap="round" />
        </svg>
      );

    case 'themind':
      return (
        <svg viewBox="0 0 64 64" className={className}>
          {/* Mystical Glowing Aura */}
          <circle
            cx="32"
            cy="34"
            r="24"
            fill="#2b194d"
            stroke="#161426"
            strokeWidth="4"
          />
          <circle
            cx="32"
            cy="34"
            r="19"
            fill="none"
            stroke="#ff924c"
            strokeWidth="2"
            strokeDasharray="4 4"
          />
          {/* Iconic Telepathic White Bunny Ears & Head */}
          <path
            d="M 22 28 C 18 10 24 6 27 18 L 28 26 Z"
            fill="#fff9ec"
            stroke="#161426"
            strokeWidth="3.2"
            strokeLinejoin="round"
          />
          <path
            d="M 42 28 C 46 10 40 6 37 18 L 36 26 Z"
            fill="#fff9ec"
            stroke="#161426"
            strokeWidth="3.2"
            strokeLinejoin="round"
          />
          <ellipse
            cx="32"
            cy="38"
            rx="14"
            ry="12"
            fill="#fff9ec"
            stroke="#161426"
            strokeWidth="3.5"
          />
          {/* Glowing Orange Third-Eye Mind Gem */}
          <polygon
            points="32,27 35.5,32 32,37 28.5,32"
            fill="#ff924c"
            stroke="#161426"
            strokeWidth="2"
          />
          {/* Calm Closed Zen Eyes */}
          <path
            d="M 23 39 Q 25.5 41.5 28 39"
            fill="none"
            stroke="#161426"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path
            d="M 36 39 Q 38.5 41.5 41 39"
            fill="none"
            stroke="#161426"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          {/* Mini Ascending Number Badge */}
          <rect
            x="40"
            y="43"
            width="20"
            height="15"
            rx="4"
            fill="#ffca3a"
            stroke="#161426"
            strokeWidth="2.8"
          />
          <text
            x="50"
            y="51"
            textAnchor="middle"
            dominantBaseline="central"
            fill="#161426"
            fontSize="9.5"
            fontWeight="900"
          >
            100
          </text>
        </svg>
      );

    case 'trix':
      return (
        <svg viewBox="0 0 64 64" className={className}>
          {/* Back Jack Card */}
          <g transform="rotate(-14, 24, 36)">
            <rect
              x="10"
              y="14"
              width="28"
              height="40"
              rx="6"
              fill="#fff9ec"
              stroke="#161426"
              strokeWidth="3.5"
            />
            <text
              x="17"
              y="26"
              textAnchor="middle"
              fill="#161426"
              fontSize="11"
              fontWeight="900"
            >
              J
            </text>
          </g>
          {/* Front King of Hearts (شيخ الكبة) Card */}
          <g transform="rotate(8, 38, 36)">
            <rect
              x="22"
              y="13"
              width="32"
              height="44"
              rx="6"
              fill="#ffffff"
              stroke="#161426"
              strokeWidth="3.5"
            />
            <text
              x="30"
              y="25"
              textAnchor="middle"
              fill="#e63946"
              fontSize="11"
              fontWeight="900"
            >
              K
            </text>
            {/* Heart Pip */}
            <path
              d="M 38 45 C 38 45 28 38 28 32 C 28 28.5 31 26.5 34 28 C 36 29 38 31.5 38 31.5 C 38 31.5 40 29 42 28 C 45 26.5 48 28.5 48 32 C 48 38 38 45 38 45 Z"
              fill="#ff595e"
              stroke="#161426"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
          </g>
          {/* Royal Trix Crown */}
          <polygon
            points="25,13 29,4 36,10 43,4 47,13"
            fill="#ffca3a"
            stroke="#161426"
            strokeWidth="2.8"
            strokeLinejoin="round"
          />
        </svg>
      );

    case 'monopoly':
      return (
        <svg viewBox="0 0 64 64" className={className}>
          {/* Property Deed Board Tile */}
          <rect
            x="8"
            y="14"
            width="48"
            height="42"
            rx="8"
            fill="#fff9ec"
            stroke="#161426"
            strokeWidth="3.8"
          />
          {/* Emerald Color Strip */}
          <path
            d="M 8 22 A 8 8 0 0 1 16 14 H 48 A 8 8 0 0 1 56 22 V 26 H 8 Z"
            fill="#10b981"
            stroke="#161426"
            strokeWidth="3.5"
          />
          {/* Golden Hotel Roof + Building */}
          <polygon
            points="18,38 32,27 46,38"
            fill="#ff595e"
            stroke="#161426"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <rect
            x="22"
            y="38"
            width="20"
            height="13"
            rx="2"
            fill="#ffca3a"
            stroke="#161426"
            strokeWidth="3"
          />
          <rect x="29" y="43" width="6" height="8" fill="#161426" />
          {/* Coin Badge */}
          <circle
            cx="49"
            cy="15"
            r="9.5"
            fill="#ffca3a"
            stroke="#161426"
            strokeWidth="3"
          />
          <text
            x="49"
            y="15.5"
            textAnchor="middle"
            dominantBaseline="central"
            fill="#161426"
            fontSize="11"
            fontWeight="900"
          >
            $
          </text>
        </svg>
      );

    case 'snakes':
      return (
        <svg viewBox="0 0 64 64" className={className}>
          {/* Golden Wooden Ladder Diagonal */}
          <g transform="rotate(22, 24, 34)">
            <line
              x1="15"
              y1="10"
              x2="15"
              y2="56"
              stroke="#d97706"
              strokeWidth="5"
              strokeLinecap="round"
            />
            <line
              x1="29"
              y1="10"
              x2="29"
              y2="56"
              stroke="#d97706"
              strokeWidth="5"
              strokeLinecap="round"
            />
            <line x1="15" y1="19" x2="29" y2="19" stroke="#161426" strokeWidth="3.2" />
            <line x1="15" y1="30" x2="29" y2="30" stroke="#161426" strokeWidth="3.2" />
            <line x1="15" y1="41" x2="29" y2="41" stroke="#161426" strokeWidth="3.2" />
            <line x1="15" y1="51" x2="29" y2="51" stroke="#161426" strokeWidth="3.2" />
          </g>
          {/* Sinuous Cartoon Green Snake */}
          <path
            d="M 48 16 C 34 16 56 34 38 40 C 24 45 48 56 34 56"
            fill="none"
            stroke="#161426"
            strokeWidth="10.5"
            strokeLinecap="round"
          />
          <path
            d="M 48 16 C 34 16 56 34 38 40 C 24 45 48 56 34 56"
            fill="none"
            stroke="#22c55e"
            strokeWidth="6"
            strokeLinecap="round"
          />
          {/* Snake Head + Tongue */}
          <circle
            cx="49"
            cy="15"
            r="7.5"
            fill="#22c55e"
            stroke="#161426"
            strokeWidth="3.2"
          />
          <circle cx="47" cy="13.5" r="1.8" fill="#161426" />
          <circle cx="52" cy="13.5" r="1.8" fill="#161426" />
          <path
            d="M 56 16 L 61 14 M 56 16 L 61 18"
            stroke="#ff595e"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
        </svg>
      );

    case 'wordbomb':
    default:
      return (
        <svg viewBox="0 0 64 64" className={className}>
          <path d="M 32 16 Q 42 4 54 10" fill="none" stroke="#d97706" strokeWidth="4.5" strokeLinecap="round" />
          <polygon
            points="54,2 56,8 62,8 57,12 59,18 54,14 49,18 51,12 46,8 52,8"
            fill="#ff595e"
            stroke="#161426"
            strokeWidth="1.5"
          />
          <circle cx="54" cy="10" r="3" fill="#ffca3a" />
          <rect x="25" y="14" width="14" height="7" rx="2" fill="#64748b" stroke="#161426" strokeWidth="3.5" />
          <circle cx="32" cy="38" r="20" fill="#161426" stroke="#161426" strokeWidth="4" />
          <circle cx="32" cy="38" r="17" fill="#25204d" />
          <path d="M 21 28 A 12 12 0 0 1 31 24" fill="none" stroke="#00bbf9" strokeWidth="3.5" strokeLinecap="round" />
          <circle cx="32" cy="38" r="6" fill="#ff595e" />
        </svg>
      );
  }
};

/* ============================================================================
 * 3. CUSTOM VECTOR CARTOON CHARACTER AVATAR
 * ========================================================================== */
export const CartoonAvatarSvg: React.FC<{
  index: number;
  color?: string;
  className?: string;
}> = ({ index, color = '#ffca3a', className = 'w-full h-full' }) => {
  const variant = Math.abs(index) % 6;

  return (
    <svg viewBox="0 0 100 100" className={`${className} select-none`}>
      <circle cx="50" cy="54" r="32" fill={color} stroke="#161426" strokeWidth="5" />
      <circle cx="30" cy="60" r="5" fill="#ff595e" opacity="0.45" />
      <circle cx="70" cy="60" r="5" fill="#ff595e" opacity="0.45" />

      {variant === 0 && (
        <>
          <circle cx="38" cy="50" r="5" fill="#161426" />
          <circle cx="62" cy="50" r="5" fill="#161426" />
          <circle cx="36" cy="48" r="2" fill="#ffffff" />
          <circle cx="60" cy="48" r="2" fill="#ffffff" />
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
          <rect x="24" y="42" width="22" height="14" rx="4" fill="#161426" />
          <rect x="54" y="42" width="22" height="14" rx="4" fill="#161426" />
          <line x1="46" y1="47" x2="54" y2="47" stroke="#161426" strokeWidth="4" />
          <line x1="28" y1="46" x2="36" y2="46" stroke="#00bbf9" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="58" y1="46" x2="66" y2="46" stroke="#00bbf9" strokeWidth="2.5" strokeLinecap="round" />
        </>
      )}

      {variant === 2 && (
        <>
          <path d="M 32 50 Q 38 43 44 50" fill="none" stroke="#161426" strokeWidth="4.5" strokeLinecap="round" />
          <circle cx="62" cy="50" r="5" fill="#161426" />
          <path d="M 46 22 Q 52 8 62 18" fill="none" stroke="#161426" strokeWidth="5" strokeLinecap="round" />
        </>
      )}

      {variant === 3 && (
        <>
          <circle cx="37" cy="50" r="10" fill="#ffffff" stroke="#161426" strokeWidth="4" />
          <circle cx="63" cy="50" r="10" fill="#ffffff" stroke="#161426" strokeWidth="4" />
          <line x1="47" y1="50" x2="53" y2="50" stroke="#161426" strokeWidth="4" />
          <circle cx="37" cy="50" r="4" fill="#161426" />
          <circle cx="63" cy="50" r="4" fill="#161426" />
        </>
      )}

      {variant === 4 && (
        <>
          <path d="M 20 40 Q 50 34 80 40" fill="none" stroke="#ff595e" strokeWidth="8" strokeLinecap="round" />
          <circle cx="38" cy="52" r="5" fill="#161426" />
          <circle cx="62" cy="52" r="5" fill="#161426" />
        </>
      )}

      {variant === 5 && (
        <>
          <line x1="50" y1="22" x2="50" y2="10" stroke="#161426" strokeWidth="4" />
          <circle cx="50" cy="10" r="5" fill="#ff595e" stroke="#161426" strokeWidth="3" />
          <rect x="28" y="43" width="44" height="13" rx="6" fill="#161426" />
          <circle cx="40" cy="49.5" r="3.5" fill="#8ac926" />
          <circle cx="60" cy="49.5" r="3.5" fill="#8ac926" />
        </>
      )}

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
 * 4. CUSTOM CARTOON REACTION BADGES (Replaces Reaction Bar Emojis!)
 * ========================================================================== */
export type ReactionType = 'bullseye' | 'fire' | 'laugh' | 'wow' | 'clap' | 'think';

export const ReactionSvgIcon: React.FC<{
  type: ReactionType;
  className?: string;
}> = ({ type, className = 'w-7 h-7' }) => {
  switch (type) {
    case 'bullseye':
      return (
        <svg viewBox="0 0 48 48" className={className}>
          <circle cx="24" cy="24" r="19" fill="#ff595e" stroke="#161426" strokeWidth="3.5" />
          <circle cx="24" cy="24" r="12" fill="#fff9ec" stroke="#161426" strokeWidth="3" />
          <circle cx="24" cy="24" r="5.5" fill="#00bbf9" stroke="#161426" strokeWidth="2.5" />
        </svg>
      );
    case 'fire':
      return (
        <svg viewBox="0 0 48 48" className={className}>
          <path
            d="M 25 5 C 25 5 39 16 37 29 C 35 39 27 43 24 43 C 15 43 10 36 11 27 C 12 20 18 16 18 16 C 18 16 17 22 21 23 C 20 15 25 5 25 5 Z"
            fill="#ff595e"
            stroke="#161426"
            strokeWidth="3.5"
            strokeLinejoin="round"
          />
          <path
            d="M 24 23 C 24 23 30 28 29 35 C 28 40 24 41 22 40 C 18 39 18 33 24 23 Z"
            fill="#ffca3a"
          />
        </svg>
      );
    case 'laugh':
      return (
        <svg viewBox="0 0 48 48" className={className}>
          <circle cx="24" cy="24" r="19" fill="#ffca3a" stroke="#161426" strokeWidth="3.5" />
          <path d="M 14 20 L 20 23 L 14 25" fill="none" stroke="#161426" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M 34 20 L 28 23 L 34 25" fill="none" stroke="#161426" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M 14 29 Q 24 41 34 29 Z" fill="#ff595e" stroke="#161426" strokeWidth="3" strokeLinejoin="round" />
          <circle cx="10" cy="27" r="3.5" fill="#00bbf9" stroke="#161426" strokeWidth="2" />
          <circle cx="38" cy="27" r="3.5" fill="#00bbf9" stroke="#161426" strokeWidth="2" />
        </svg>
      );
    case 'wow':
      return (
        <svg viewBox="0 0 48 48" className={className}>
          <polygon
            points="24,3 29,13 40,9 35,20 45,26 35,31 39,42 28,37 22,45 18,36 7,39 13,29 4,22 15,18 12,8 21,13"
            fill="#9b5de5"
            stroke="#161426"
            strokeWidth="3"
          />
          <circle cx="19" cy="23" r="3.5" fill="#fff9ec" />
          <circle cx="29" cy="23" r="3.5" fill="#fff9ec" />
          <ellipse cx="24" cy="32" rx="4.5" ry="5.5" fill="#ffca3a" stroke="#161426" strokeWidth="2.5" />
        </svg>
      );
    case 'clap':
      return (
        <svg viewBox="0 0 48 48" className={className}>
          <polygon points="24,4 26,11 22,11" fill="#ffca3a" />
          <polygon points="12,9 17,14 14,16" fill="#ffca3a" />
          <polygon points="36,9 31,14 34,16" fill="#ffca3a" />
          <path
            d="M 14 28 L 22 16 C 24 14 27 16 25 19 L 30 15 C 32 13 35 16 33 19 L 36 18 C 38 17 40 20 38 23 L 31 37 C 27 42 18 42 14 36 C 11 32 12 30 14 28 Z"
            fill="#8ac926"
            stroke="#161426"
            strokeWidth="3.5"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'think':
    default:
      return (
        <svg viewBox="0 0 48 48" className={className}>
          <circle cx="24" cy="24" r="19" fill="#00bbf9" stroke="#161426" strokeWidth="3.5" />
          <line x1="15" y1="17" x2="21" y2="15" stroke="#161426" strokeWidth="3.5" strokeLinecap="round" />
          <circle cx="18" cy="22" r="3" fill="#161426" />
          <circle cx="30" cy="22" r="3" fill="#161426" />
          <path d="M 18 33 Q 24 30 30 34" fill="none" stroke="#161426" strokeWidth="3.5" strokeLinecap="round" />
        </svg>
      );
  }
};

/* ============================================================================
 * 5. CATEGORY / TOPIC ICON
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
    case 'sports':
      return <SoccerBall weight="fill" className={className} />;
    case 'places':
      return <MapPin weight="fill" className={className} />;
    case 'transport':
      return <CarProfile weight="fill" className={className} />;
    default:
      return <Sparkle weight="fill" className={className} />;
  }
};
