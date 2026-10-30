import React from 'react';
import {
  WITNESS_MONSTERS,
  CritterType,
  COCKROACH_CRITTERS,
} from '../data/extraGamesData';

/* ============================================================================
 * 1. DIXIT SURREAL DREAMLIKE VECTOR ART CARDS (24 Unique Illustrated Scenes!)
 * ========================================================================== */
export const DixitArtCardSvg: React.FC<{
  cardId: number;
  className?: string;
}> = ({ cardId, className = 'w-full h-full' }) => {
  const id = ((Math.abs(cardId - 1)) % 24) + 1;

  const palettes = [
    { sky: '#1e1b4b', accent1: '#ffca3a', accent2: '#f15bb5', ground: '#4c1d95' },
    { sky: '#0f172a', accent1: '#00f5d4', accent2: '#ff924c', ground: '#1e3a8a' },
    { sky: '#3b0764', accent1: '#ff595e', accent2: '#ffca3a', ground: '#701a75' },
    { sky: '#134e4a', accent1: '#fde047', accent2: '#fb7185', ground: '#065f46' },
    { sky: '#451a03', accent1: '#38bdf8', accent2: '#facc15', ground: '#7c2d12' },
    { sky: '#172554', accent1: '#a3e635', accent2: '#f472b6', ground: '#312e81' },
  ];
  const pal = palettes[(id - 1) % palettes.length];

  return (
    <svg viewBox="0 0 180 240" className={`${className} select-none`}>
      {/* Background Sky */}
      <rect x="0" y="0" width="180" height="240" rx="18" fill={pal.sky} />

      {/* Ambient Stars / Dots */}
      <circle cx="26" cy="28" r="2.5" fill="#fff9ec" opacity="0.8" />
      <circle cx="152" cy="34" r="3" fill={pal.accent1} opacity="0.85" />
      <circle cx="44" cy="64" r="2" fill={pal.accent2} opacity="0.7" />
      <circle cx="138" cy="82" r="2" fill="#fff9ec" opacity="0.65" />

      {/* 24 Distinct Surreal Dreamlike Scenes */}
      {id === 1 && (
        /* #1: Floating Island Castle Anchored to a Red Balloon */
        <g>
          <path d="M 90 42 L 90 115" stroke="#fff9ec" strokeWidth="3" strokeDasharray="4 4" />
          <circle cx="90" cy="44" r="26" fill="#ff595e" stroke="#161426" strokeWidth="4" />
          <path d="M 78 32 A 14 14 0 0 1 92 26" fill="none" stroke="#fff9ec" strokeWidth="3" strokeLinecap="round" />
          <polygon points="40,145 140,145 112,205 90,222 66,202" fill="#8ac926" stroke="#161426" strokeWidth="4" />
          <rect x="68" y="108" width="44" height="38" fill="#ffca3a" stroke="#161426" strokeWidth="4" />
          <polygon points="62,108 90,82 118,108" fill="#00bbf9" stroke="#161426" strokeWidth="4" />
          <rect x="83" y="124" width="14" height="22" rx="7" fill="#161426" />
        </g>
      )}

      {id === 2 && (
        /* #2: Giant Cosmic Hourglass Pouring Stars into an Ocean */
        <g>
          <rect x="0" y="190" width="180" height="50" fill="#00bbf9" />
          <rect x="46" y="34" width="88" height="12" rx="5" fill="#ff924c" stroke="#161426" strokeWidth="4" />
          <rect x="46" y="184" width="88" height="12" rx="5" fill="#ff924c" stroke="#161426" strokeWidth="4" />
          <path
            d="M 54 46 C 54 96 86 105 90 115 C 94 125 126 134 126 184 H 54 C 54 134 86 125 90 115 C 94 105 126 96 126 46 Z"
            fill="#e0f2fe"
            fillOpacity="0.25"
            stroke="#fff9ec"
            strokeWidth="4"
          />
          <polygon points="66,74 114,74 90,110" fill="#ffca3a" />
          <polygon points="90,132 118,182 62,182" fill="#f15bb5" />
          <circle cx="90" cy="122" r="4" fill="#ffca3a" />
        </g>
      )}

      {id === 3 && (
        /* #3: Sky Whale Swimming Above Golden Clouds with a Lantern */
        <g>
          <path
            d="M 28 130 C 32 82 98 76 136 108 C 150 120 156 104 166 96 C 164 118 156 128 144 132 C 122 154 58 158 28 130 Z"
            fill="#00bbf9"
            stroke="#161426"
            strokeWidth="4"
          />
          <circle cx="56" cy="116" r="5" fill="#161426" />
          <line x1="28" y1="126" x2="18" y2="160" stroke="#ffca3a" strokeWidth="3" />
          <circle cx="18" cy="166" r="9" fill="#ffca3a" stroke="#161426" strokeWidth="3" />
          <path d="M 10 210 Q 35 182 65 198 Q 95 175 128 196 Q 155 182 174 210 V 240 H 10 Z" fill="#f15bb5" stroke="#161426" strokeWidth="4" />
        </g>
      )}

      {id === 4 && (
        /* #4: Giant Keyhole Doorway in the Desert Opening to Night Galaxy */
        <g>
          <rect x="0" y="165" width="180" height="75" fill="#ff924c" stroke="#161426" strokeWidth="4" />
          <rect x="44" y="48" width="92" height="145" rx="46" fill="#ffca3a" stroke="#161426" strokeWidth="5" />
          <circle cx="90" cy="100" r="24" fill="#191636" stroke="#161426" strokeWidth="4" />
          <polygon points="78,116 102,116 112,175 68,175" fill="#191636" stroke="#161426" strokeWidth="4" />
          <circle cx="90" cy="98" r="8" fill="#00f5d4" />
          <circle cx="88" cy="152" r="4" fill="#ff595e" />
        </g>
      )}

      {id === 5 && (
        /* #5: Ladder Leaning Against a Sleeping Crescent Moon */
        <g>
          <path
            d="M 118 42 A 52 52 0 1 0 118 142 A 38 38 0 1 1 118 42 Z"
            fill="#ffca3a"
            stroke="#161426"
            strokeWidth="4.5"
          />
          <line x1="42" y1="226" x2="82" y2="96" stroke="#fff9ec" strokeWidth="5" strokeLinecap="round" />
          <line x1="64" y1="226" x2="104" y2="96" stroke="#fff9ec" strokeWidth="5" strokeLinecap="round" />
          {[0, 1, 2, 3, 4, 5].map((step) => (
            <line
              key={step}
              x1={47 + step * 6.5}
              y1={210 - step * 20}
              x2={69 + step * 6.5}
              y2={210 - step * 20}
              stroke="#ff595e"
              strokeWidth="4"
            />
          ))}
        </g>
      )}

      {id === 6 && (
        /* #6: Stormy Ocean Inside a Porcelain Teacup with a Paper Boat */
        <g>
          <ellipse cx="90" cy="204" rx="64" ry="14" fill="#f15bb5" stroke="#161426" strokeWidth="4" />
          <path d="M 134 142 C 162 142 162 178 132 178" fill="none" stroke="#fff9ec" strokeWidth="8" />
          <path d="M 34 130 H 146 C 142 186 122 200 90 200 C 58 200 38 186 34 130 Z" fill="#fff9ec" stroke="#161426" strokeWidth="4" />
          <path d="M 38 134 Q 65 118 90 134 Q 115 150 142 134" fill="#00bbf9" stroke="#161426" strokeWidth="3.5" />
          <polygon points="90,82 68,126 112,126" fill="#ffca3a" stroke="#161426" strokeWidth="3.5" />
          <polygon points="56,126 124,126 110,142 70,142" fill="#ff595e" stroke="#161426" strokeWidth="3.5" />
        </g>
      )}

      {id === 7 && (
        /* #7: Cactus Floating Away as a Hot Air Balloon */
        <g>
          <ellipse cx="90" cy="88" rx="44" ry="52" fill="#38b000" stroke="#161426" strokeWidth="4.5" />
          <path d="M 46 88 C 22 88 22 56 36 56 C 44 56 44 74 48 76" fill="#38b000" stroke="#161426" strokeWidth="4" />
          <path d="M 134 84 C 158 84 158 48 144 48 C 136 48 136 68 132 72" fill="#38b000" stroke="#161426" strokeWidth="4" />
          <circle cx="90" cy="34" r="10" fill="#f15bb5" stroke="#161426" strokeWidth="3" />
          <line x1="72" y1="138" x2="78" y2="174" stroke="#fff9ec" strokeWidth="3" />
          <line x1="108" y1="138" x2="102" y2="174" stroke="#fff9ec" strokeWidth="3" />
          <rect x="72" y="174" width="36" height="28" rx="6" fill="#ff924c" stroke="#161426" strokeWidth="4" />
        </g>
      )}

      {id === 8 && (
        /* #8: Giant Chess Knight Facing a Tiny Glowing Crown */
        <g>
          <rect x="0" y="184" width="180" height="56" fill="#312e81" stroke="#161426" strokeWidth="4" />
          <path
            d="M 40 184 L 48 118 L 32 104 L 54 62 L 74 52 L 72 72 C 94 78 98 112 86 146 L 96 184 Z"
            fill="#fff9ec"
            stroke="#161426"
            strokeWidth="4.5"
            strokeLinejoin="round"
          />
          <circle cx="56" cy="82" r="4" fill="#161426" />
          <polygon
            points="122,184 126,158 136,168 144,154 152,168 162,158 166,184"
            fill="#ffca3a"
            stroke="#161426"
            strokeWidth="3.5"
          />
          <circle cx="144" cy="142" r="14" fill="#ffca3a" opacity="0.3" />
        </g>
      )}

      {id === 9 && (
        /* #9: Spiral Piano Keyboard Staircase into the Clouds */
        <g>
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <g key={i} transform={`translate(${26 + i * 14}, ${196 - i * 22}) rotate(${-i * 4})`}>
              <rect x="0" y="0" width="54" height="16" rx="3" fill="#fff9ec" stroke="#161426" strokeWidth="3" />
              <rect x="30" y="0" width="24" height="9" fill="#161426" />
            </g>
          ))}
          <circle cx="136" cy="48" r="22" fill="#ffca3a" stroke="#161426" strokeWidth="4" />
        </g>
      )}

      {id === 10 && (
        /* #10: Lighthouse Built on a Giant Sea Turtle’s Shell */
        <g>
          <ellipse cx="92" cy="182" rx="58" ry="30" fill="#38b000" stroke="#161426" strokeWidth="4.5" />
          <circle cx="154" cy="176" r="14" fill="#8ac926" stroke="#161426" strokeWidth="4" />
          <circle cx="158" cy="173" r="3" fill="#161426" />
          <polygon points="72,154 80,68 104,68 112,154" fill="#ff595e" stroke="#161426" strokeWidth="4" />
          <rect x="76" y="96" width="32" height="18" fill="#fff9ec" stroke="#161426" strokeWidth="3" />
          <rect x="78" y="48" width="28" height="20" fill="#ffca3a" stroke="#161426" strokeWidth="4" />
          <polygon points="106,58 178,34 178,82" fill="#fde047" opacity="0.45" />
        </g>
      )}

      {id === 11 && (
        /* #11: Glass Lightbulb Terrarium Holding a Blooming Tree */
        <g>
          <rect x="72" y="182" width="36" height="26" rx="6" fill="#94a3b8" stroke="#161426" strokeWidth="4" />
          <circle cx="90" cy="116" r="62" fill="#38bdf8" fillOpacity="0.28" stroke="#fff9ec" strokeWidth="4.5" />
          <path d="M 42 152 Q 90 140 138 152 A 60 60 0 0 1 42 152 Z" fill="#8ac926" stroke="#161426" strokeWidth="3.5" />
          <rect x="84" y="108" width="12" height="42" fill="#7c2d12" stroke="#161426" strokeWidth="3" />
          <circle cx="90" cy="92" r="26" fill="#f15bb5" stroke="#161426" strokeWidth="4" />
          <circle cx="70" cy="102" r="16" fill="#ffca3a" stroke="#161426" strokeWidth="3.5" />
          <circle cx="110" cy="102" r="16" fill="#00f5d4" stroke="#161426" strokeWidth="3.5" />
        </g>
      )}

      {id === 12 && (
        /* #12: Clockwork Sun & Melting Pocket Watch */
        <g>
          <circle cx="90" cy="106" r="52" fill="#ffca3a" stroke="#161426" strokeWidth="5" />
          <circle cx="90" cy="106" r="38" fill="#fff9ec" stroke="#161426" strokeWidth="3.5" />
          <line x1="90" y1="106" x2="90" y2="76" stroke="#161426" strokeWidth="5" strokeLinecap="round" />
          <line x1="90" y1="106" x2="114" y2="118" stroke="#ff595e" strokeWidth="5" strokeLinecap="round" />
          <path d="M 56 146 Q 56 208 72 208 Q 84 208 84 158 Q 96 222 112 222 Q 126 222 124 146 Z" fill="#ffca3a" stroke="#161426" strokeWidth="4" />
        </g>
      )}

      {id === 13 && (
        /* #13: Giant Red Umbrella Carrying a Tiny House Upside Down */
        <g>
          <path d="M 90 42 V 136 C 90 152 68 152 68 138" fill="none" stroke="#fff9ec" strokeWidth="5" strokeLinecap="round" />
          <path d="M 22 132 A 68 58 0 0 0 158 132 Z" fill="#ff595e" stroke="#161426" strokeWidth="4.5" />
          <rect x="70" y="96" width="40" height="34" fill="#ffca3a" stroke="#161426" strokeWidth="4" />
          <polygon points="64,96 90,72 116,96" fill="#00bbf9" stroke="#161426" strokeWidth="4" />
        </g>
      )}

      {id === 14 && (
        /* #14: Two Masked Venetian Faces — Day & Night */
        <g>
          <ellipse cx="68" cy="120" rx="38" ry="50" fill="#ffca3a" stroke="#161426" strokeWidth="4.5" />
          <ellipse cx="114" cy="126" rx="38" ry="50" fill="#00bbf9" stroke="#161426" strokeWidth="4.5" />
          <circle cx="56" cy="112" r="5" fill="#161426" />
          <path d="M 54 138 Q 68 150 82 138" fill="none" stroke="#161426" strokeWidth="4" strokeLinecap="round" />
          <circle cx="126" cy="118" r="5" fill="#161426" />
          <path d="M 102 148 Q 116 136 130 148" fill="none" stroke="#161426" strokeWidth="4" strokeLinecap="round" />
        </g>
      )}

      {id === 15 && (
        /* #15: Giant Eye Balloon Watching a Maze */
        <g>
          <rect x="24" y="160" width="132" height="58" rx="8" fill="#8ac926" stroke="#161426" strokeWidth="4" />
          <path d="M 44 160 V 196 H 96 V 176 H 128 V 218" fill="none" stroke="#161426" strokeWidth="5" />
          <circle cx="90" cy="84" r="44" fill="#fff9ec" stroke="#161426" strokeWidth="5" />
          <circle cx="90" cy="84" r="22" fill="#9b5de5" stroke="#161426" strokeWidth="4" />
          <circle cx="90" cy="84" r="9" fill="#161426" />
          <circle cx="96" cy="78" r="4" fill="#ffffff" />
        </g>
      )}

      {id === 16 && (
        /* #16: Origami Paper Crane Flying Out of an Open Book */
        <g>
          <path d="M 20 198 Q 55 178 90 198 Q 125 178 160 198 L 150 220 Q 120 202 90 220 Q 60 202 30 220 Z" fill="#fff9ec" stroke="#161426" strokeWidth="4" />
          <polygon points="90,56 34,98 82,114" fill="#00f5d4" stroke="#161426" strokeWidth="4" strokeLinejoin="round" />
          <polygon points="90,56 148,92 98,114" fill="#ffca3a" stroke="#161426" strokeWidth="4" strokeLinejoin="round" />
          <polygon points="82,114 98,114 90,158" fill="#f15bb5" stroke="#161426" strokeWidth="4" strokeLinejoin="round" />
        </g>
      )}

      {id === 17 && (
        /* #17: Astronaut Watering a Single Rose on an Asteroid */
        <g>
          <circle cx="90" cy="212" r="68" fill="#94a3b8" stroke="#161426" strokeWidth="5" />
          <circle cx="64" cy="186" r="10" fill="#64748b" />
          <line x1="118" y1="154" x2="118" y2="118" stroke="#38b000" strokeWidth="5" />
          <circle cx="118" cy="112" r="14" fill="#ff595e" stroke="#161426" strokeWidth="3.5" />
          <rect x="44" y="98" width="36" height="48" rx="14" fill="#fff9ec" stroke="#161426" strokeWidth="4" />
          <circle cx="62" cy="82" r="22" fill="#fff9ec" stroke="#161426" strokeWidth="4" />
          <rect x="48" y="74" width="28" height="16" rx="8" fill="#00bbf9" stroke="#161426" strokeWidth="3" />
        </g>
      )}

      {id === 18 && (
        /* #18: Golden Birdcage Wide Open with Stars Inside, Bird Sitting on Top */
        <g>
          <path d="M 46 184 V 108 A 44 44 0 0 1 134 108 V 184 Z" fill="none" stroke="#ffca3a" strokeWidth="5" />
          <line x1="74" y1="68" x2="74" y2="184" stroke="#ffca3a" strokeWidth="3" />
          <line x1="106" y1="68" x2="106" y2="184" stroke="#ffca3a" strokeWidth="3" />
          <circle cx="90" cy="48" r="14" fill="#00bbf9" stroke="#161426" strokeWidth="4" />
          <polygon points="104,48 116,44 104,54" fill="#ff924c" />
          <polygon points="90,118 95,130 108,130 98,138 102,150 90,142 78,150 82,138 72,130 85,130" fill="#f15bb5" />
        </g>
      )}

      {id === 19 && (
        /* #19: Submarine Periscope Peeking Out of Pink Cotton Clouds */
        <g>
          <path d="M 86 156 V 76 H 118" fill="none" stroke="#ffca3a" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M 86 156 V 76 H 118" fill="none" stroke="#161426" strokeWidth="4" />
          <circle cx="122" cy="76" r="12" fill="#00f5d4" stroke="#161426" strokeWidth="4" />
          <path d="M 0 162 Q 30 132 62 156 Q 92 128 126 154 Q 156 134 180 162 V 240 H 0 Z" fill="#f15bb5" stroke="#161426" strokeWidth="4.5" />
        </g>
      )}

      {id === 20 && (
        /* #20: Giant Scissors Cutting a Rainbow Ribbon */
        <g>
          <path d="M 0 90 Q 90 140 180 80" fill="none" stroke="#ff595e" strokeWidth="14" />
          <path d="M 0 104 Q 90 154 180 94" fill="none" stroke="#ffca3a" strokeWidth="14" />
          <path d="M 0 118 Q 90 168 180 108" fill="none" stroke="#00bbf9" strokeWidth="14" />
          <line x1="58" y1="184" x2="122" y2="62" stroke="#e2e8f0" strokeWidth="9" strokeLinecap="round" />
          <line x1="122" y1="184" x2="58" y2="62" stroke="#cbd5e1" strokeWidth="9" strokeLinecap="round" />
          <circle cx="56" cy="190" r="16" fill="none" stroke="#ff924c" strokeWidth="6" />
          <circle cx="124" cy="190" r="16" fill="none" stroke="#ff924c" strokeWidth="6" />
        </g>
      )}

      {id === 21 && (
        /* #21: Snowglobe Containing a Fiery Volcano */
        <g>
          <rect x="44" y="182" width="92" height="28" rx="8" fill="#7c2d12" stroke="#161426" strokeWidth="4" />
          <circle cx="90" cy="124" r="64" fill="#e0f2fe" fillOpacity="0.25" stroke="#fff9ec" strokeWidth="4.5" />
          <polygon points="48,180 78,116 102,116 132,180" fill="#475569" stroke="#161426" strokeWidth="4" />
          <path d="M 78 116 Q 90 140 102 116 L 112 92 Q 90 66 68 92 Z" fill="#ff595e" stroke="#161426" strokeWidth="3.5" />
          <circle cx="90" cy="82" r="10" fill="#ffca3a" />
        </g>
      )}

      {id === 22 && (
        /* #22: Puppet Strings Controlling a Golden Crown */
        <g>
          <line x1="36" y1="32" x2="144" y2="48" stroke="#ff924c" strokeWidth="9" strokeLinecap="round" />
          <line x1="54" y1="36" x2="54" y2="144" stroke="#fff9ec" strokeWidth="2.5" strokeDasharray="4 4" />
          <line x1="90" y1="40" x2="90" y2="132" stroke="#fff9ec" strokeWidth="2.5" strokeDasharray="4 4" />
          <line x1="126" y1="46" x2="126" y2="144" stroke="#fff9ec" strokeWidth="2.5" strokeDasharray="4 4" />
          <polygon
            points="42,178 48,134 72,154 90,124 108,154 132,134 138,178"
            fill="#ffca3a"
            stroke="#161426"
            strokeWidth="4.5"
            strokeLinejoin="round"
          />
        </g>
      )}

      {id === 23 && (
        /* #23: Giant Snail Carrying a Cozy Glowing Lantern House */
        <g>
          <path d="M 20 188 Q 90 176 158 188 Q 168 198 152 204 H 28 Z" fill="#8ac926" stroke="#161426" strokeWidth="4" />
          <circle cx="82" cy="136" r="46" fill="#9b5de5" stroke="#161426" strokeWidth="4.5" />
          <circle cx="82" cy="136" r="24" fill="#ffca3a" stroke="#161426" strokeWidth="4" />
          <line x1="142" y1="182" x2="152" y2="152" stroke="#161426" strokeWidth="4" />
          <circle cx="152" cy="150" r="6" fill="#fff9ec" stroke="#161426" strokeWidth="3" />
        </g>
      )}

      {id === 24 && (
        /* #24: Train Track Going Straight Up Into a Starry Portal */
        <g>
          <ellipse cx="90" cy="68" rx="48" ry="28" fill="#00f5d4" stroke="#161426" strokeWidth="4.5" />
          <ellipse cx="90" cy="68" rx="28" ry="15" fill="#191636" />
          <line x1="42" y1="236" x2="76" y2="76" stroke="#ffca3a" strokeWidth="5" />
          <line x1="138" y1="236" x2="104" y2="76" stroke="#ffca3a" strokeWidth="5" />
          {[0, 1, 2, 3, 4, 5].map((r) => (
            <line
              key={r}
              x1={44 + r * 5.5}
              y1={222 - r * 25}
              x2={136 - r * 5.5}
              y2={222 - r * 25}
              stroke="#ff595e"
              strokeWidth="4"
            />
          ))}
        </g>
      )}

      {/* Inner Decorative Golden Frame */}
      <rect
        x="6"
        y="6"
        width="168"
        height="228"
        rx="14"
        fill="none"
        stroke="rgba(255,249,236,0.32)"
        strokeWidth="2.5"
      />
    </svg>
  );
};

/* ============================================================================
 * 2. MONSTER WITNESS SVG (الشاهد الوحيد — 16 Distinct Weird Cartoon Creatures!)
 * ========================================================================== */
export const MonsterWitnessSvg: React.FC<{
  monsterId: number;
  className?: string;
}> = ({ monsterId, className = 'w-64 h-64' }) => {
  const m =
    WITNESS_MONSTERS.find((item) => item.id === monsterId) ||
    WITNESS_MONSTERS[0];

  return (
    <svg viewBox="0 0 220 220" className={`${className} select-none`}>
      {/* Background Specimen Card */}
      <rect
        x="6"
        y="6"
        width="208"
        height="208"
        rx="26"
        fill={m.bg}
        stroke="#161426"
        strokeWidth="6"
      />

      {/* Shadow */}
      <ellipse cx="110" cy="194" rx="52" ry="9" fill="rgba(22,20,38,0.2)" />

      {/* ARMS LAYER (Behind Body) */}
      {m.arms === 'wings' && (
        <g>
          <path
            d="M 55 110 L 14 78 L 24 114 L 14 134 L 55 136 Z"
            fill={m.accentColor}
            stroke="#161426"
            strokeWidth="4.5"
            strokeLinejoin="round"
          />
          <path
            d="M 165 110 L 206 78 L 196 114 L 206 134 L 165 136 Z"
            fill={m.accentColor}
            stroke="#161426"
            strokeWidth="4.5"
            strokeLinejoin="round"
          />
        </g>
      )}
      {m.arms === 'tentacles' && (
        <g fill="none" stroke="#161426" strokeWidth="10" strokeLinecap="round">
          <path d="M 56 122 Q 18 102 24 146 Q 28 168 44 156" />
          <path d="M 164 122 Q 202 102 196 146 Q 192 168 176 156" />
          <path d="M 56 122 Q 18 102 24 146 Q 28 168 44 156" stroke={m.accentColor} strokeWidth="5" />
          <path d="M 164 122 Q 202 102 196 146 Q 192 168 176 156" stroke={m.accentColor} strokeWidth="5" />
        </g>
      )}
      {m.arms === 'claws' && (
        <g>
          <line x1="56" y1="120" x2="28" y2="104" stroke="#161426" strokeWidth="7" />
          <circle cx="24" cy="100" r="13" fill={m.accentColor} stroke="#161426" strokeWidth="4" />
          <polygon points="12,94 24,100 16,108" fill={m.bg} />
          <line x1="164" y1="120" x2="192" y2="104" stroke="#161426" strokeWidth="7" />
          <circle cx="196" cy="100" r="13" fill={m.accentColor} stroke="#161426" strokeWidth="4" />
          <polygon points="208,94 196,100 204,108" fill={m.bg} />
        </g>
      )}
      {m.arms === 'noodle' && (
        <g fill="none" stroke="#161426" strokeWidth="6" strokeLinecap="round">
          <path d="M 54 118 C 22 118 22 154 36 164" />
          <path d="M 166 118 C 198 118 198 154 184 164" />
        </g>
      )}

      {/* LEGS */}
      <line x1="88" y1="168" x2="84" y2="192" stroke="#161426" strokeWidth="8" strokeLinecap="round" />
      <line x1="132" y1="168" x2="136" y2="192" stroke="#161426" strokeWidth="8" strokeLinecap="round" />

      {/* HORNS / TOPPERS */}
      {m.horns === 'crown' && (
        <polygon
          points="82,58 88,30 110,46 132,30 138,58"
          fill="#ffca3a"
          stroke="#161426"
          strokeWidth="4.5"
          strokeLinejoin="round"
        />
      )}
      {m.horns === 'devil' && (
        <g>
          <path d="M 76 64 Q 58 32 48 44 Q 54 66 72 72 Z" fill={m.accentColor} stroke="#161426" strokeWidth="4" />
          <path d="M 144 64 Q 162 32 172 44 Q 166 66 148 72 Z" fill={m.accentColor} stroke="#161426" strokeWidth="4" />
        </g>
      )}
      {m.horns === 'antennas' && (
        <g>
          <line x1="90" y1="62" x2="74" y2="32" stroke="#161426" strokeWidth="5" />
          <circle cx="74" cy="30" r="8" fill={m.accentColor} stroke="#161426" strokeWidth="4" />
          <line x1="130" y1="62" x2="146" y2="32" stroke="#161426" strokeWidth="5" />
          <circle cx="146" cy="30" r="8" fill={m.accentColor} stroke="#161426" strokeWidth="4" />
        </g>
      )}
      {m.horns === 'cactus' && (
        <g>
          <rect x="98" y="28" width="24" height="36" rx="12" fill="#38b000" stroke="#161426" strokeWidth="4" />
          <circle cx="110" cy="26" r="6" fill="#ff595e" stroke="#161426" strokeWidth="3" />
        </g>
      )}
      {m.horns === 'ears' && (
        <g>
          <ellipse cx="82" cy="48" rx="11" ry="24" fill={m.bodyColor} stroke="#161426" strokeWidth="4.5" />
          <ellipse cx="138" cy="48" rx="11" ry="24" fill={m.bodyColor} stroke="#161426" strokeWidth="4.5" />
        </g>
      )}

      {/* BODY SHAPE */}
      {m.shape === 'pear' && (
        <path
          d="M 110 54 C 82 54 76 88 64 118 C 52 152 72 176 110 176 C 148 176 168 152 156 118 C 144 88 138 54 110 54 Z"
          fill={m.bodyColor}
          stroke="#161426"
          strokeWidth="5.5"
        />
      )}
      {m.shape === 'triangle' && (
        <polygon
          points="110,48 170,172 50,172"
          fill={m.bodyColor}
          stroke="#161426"
          strokeWidth="5.5"
          strokeLinejoin="round"
        />
      )}
      {m.shape === 'box' && (
        <rect
          x="56"
          y="58"
          width="108"
          height="114"
          rx="22"
          fill={m.bodyColor}
          stroke="#161426"
          strokeWidth="5.5"
        />
      )}
      {m.shape === 'bean' && (
        <rect
          x="64"
          y="52"
          width="92"
          height="122"
          rx="46"
          fill={m.bodyColor}
          stroke="#161426"
          strokeWidth="5.5"
        />
      )}
      {m.shape === 'star' && (
        <polygon
          points="110,44 130,84 174,90 142,122 150,170 110,148 70,170 78,122 46,90 90,84"
          fill={m.bodyColor}
          stroke="#161426"
          strokeWidth="5"
          strokeLinejoin="round"
        />
      )}
      {m.shape === 'blob' && (
        <circle
          cx="110"
          cy="116"
          r="56"
          fill={m.bodyColor}
          stroke="#161426"
          strokeWidth="5.5"
        />
      )}

      {/* BODY PATTERN */}
      {m.pattern === 'spots' && (
        <g fill={m.accentColor} opacity="0.85">
          <circle cx="78" cy="148" r="7" />
          <circle cx="142" cy="146" r="8" />
          <circle cx="110" cy="162" r="6" />
        </g>
      )}
      {m.pattern === 'belly' && (
        <ellipse
          cx="110"
          cy="150"
          rx="28"
          ry="18"
          fill={m.accentColor}
          stroke="#161426"
          strokeWidth="3.5"
        />
      )}
      {m.pattern === 'stripes' && (
        <g stroke={m.accentColor} strokeWidth="6" strokeLinecap="round">
          <line x1="78" y1="154" x2="142" y2="154" />
          <line x1="86" y1="164" x2="134" y2="164" />
        </g>
      )}
      {m.pattern === 'stitches' && (
        <g stroke="#161426" strokeWidth="3.5" strokeLinecap="round">
          <line x1="74" y1="154" x2="102" y2="160" />
          <line x1="80" y1="150" x2="78" y2="160" />
          <line x1="92" y1="152" x2="90" y2="162" />
        </g>
      )}

      {/* EYES LAYER (1, 2, 3, or 4 Distinct Eyes!) */}
      {m.eyes === 1 && (
        <g>
          <circle cx="110" cy="98" r="20" fill="#ffffff" stroke="#161426" strokeWidth="4.5" />
          <circle cx="110" cy="98" r="9" fill="#161426" />
          <circle cx="114" cy="94" r="3" fill="#ffffff" />
        </g>
      )}
      {m.eyes === 2 && (
        <g>
          <circle cx="92" cy="98" r="13" fill="#ffffff" stroke="#161426" strokeWidth="4" />
          <circle cx="92" cy="98" r="5.5" fill="#161426" />
          <circle cx="128" cy="98" r="13" fill="#ffffff" stroke="#161426" strokeWidth="4" />
          <circle cx="128" cy="98" r="5.5" fill="#161426" />
        </g>
      )}
      {m.eyes === 3 && (
        <g>
          <circle cx="86" cy="102" r="10" fill="#ffffff" stroke="#161426" strokeWidth="3.5" />
          <circle cx="86" cy="102" r="4" fill="#161426" />
          <circle cx="110" cy="84" r="11" fill="#ffffff" stroke="#161426" strokeWidth="3.5" />
          <circle cx="110" cy="84" r="4.5" fill="#161426" />
          <circle cx="134" cy="102" r="10" fill="#ffffff" stroke="#161426" strokeWidth="3.5" />
          <circle cx="134" cy="102" r="4" fill="#161426" />
        </g>
      )}
      {m.eyes === 4 && (
        <g>
          {[82, 101, 119, 138].map((cx) => (
            <g key={cx}>
              <circle cx={cx} cy="98" r="8" fill="#ffffff" stroke="#161426" strokeWidth="3" />
              <circle cx={cx} cy="98" r="3.5" fill="#161426" />
            </g>
          ))}
        </g>
      )}

      {/* MOUTH LAYER */}
      {m.mouth === 'fangs' && (
        <g>
          <path d="M 86 128 Q 110 140 134 128" fill="none" stroke="#161426" strokeWidth="4.5" strokeLinecap="round" />
          <polygon points="92,130 98,142 104,132" fill="#ffffff" stroke="#161426" strokeWidth="2.5" />
          <polygon points="116,132 122,142 128,130" fill="#ffffff" stroke="#161426" strokeWidth="2.5" />
        </g>
      )}
      {m.mouth === 'tongue' && (
        <g>
          <path d="M 88 128 Q 110 138 132 128" fill="none" stroke="#161426" strokeWidth="4.5" strokeLinecap="round" />
          <path d="M 102 132 V 148 A 8 8 0 0 0 118 148 V 132 Z" fill="#ff595e" stroke="#161426" strokeWidth="3" />
        </g>
      )}
      {m.mouth === 'zigzag' && (
        <polyline
          points="84,132 94,124 104,134 116,124 126,134 136,126"
          fill="none"
          stroke="#161426"
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
      {m.mouth === 'bucktooth' && (
        <g>
          <line x1="90" y1="130" x2="130" y2="130" stroke="#161426" strokeWidth="4.5" strokeLinecap="round" />
          <rect x="103" y="130" width="14" height="12" rx="2" fill="#ffffff" stroke="#161426" strokeWidth="3" />
        </g>
      )}
    </svg>
  );
};

/* ============================================================================
 * 3. COCKROACH POKER CRITTER CARD SVG (8 Cute-Creepy Critters + Card Back!)
 * ========================================================================== */
export const CritterCardSvg: React.FC<{
  critter?: CritterType;
  faceDown?: boolean;
  lang?: 'ar' | 'en';
  className?: string;
}> = ({ critter = 'roach', faceDown = false, lang = 'ar', className = 'w-28 h-36' }) => {
  if (faceDown) {
    return (
      <svg viewBox="0 0 120 160" className={`${className} select-none`}>
        <rect x="4" y="4" width="112" height="152" rx="16" fill="#25204d" stroke="#161426" strokeWidth="5" />
        <rect x="14" y="14" width="92" height="132" rx="10" fill="none" stroke="#ffca3a" strokeWidth="3" strokeDasharray="6 4" />
        <circle cx="60" cy="80" r="26" fill="#ff595e" stroke="#161426" strokeWidth="4" />
        <text x="60" y="90" textAnchor="middle" fill="#ffca3a" fontSize="32" fontWeight="900">
          ?
        </text>
      </svg>
    );
  }

  const meta = COCKROACH_CRITTERS.find((c) => c.id === critter) || COCKROACH_CRITTERS[0];

  return (
    <svg viewBox="0 0 120 160" className={`${className} select-none`}>
      <rect x="4" y="4" width="112" height="152" rx="16" fill="#fff9ec" stroke="#161426" strokeWidth="5" />
      <rect x="12" y="12" width="96" height="106" rx="10" fill={meta.color} fillOpacity="0.22" stroke="#161426" strokeWidth="3" />

      {/* Critter Illustration */}
      {critter === 'scorpion' && (
        <g>
          <path d="M 60 88 C 86 88 90 52 72 40" fill="none" stroke="#161426" strokeWidth="6" strokeLinecap="round" />
          <polygon points="72,34 62,42 74,48" fill="#ff595e" stroke="#161426" strokeWidth="2.5" />
          <ellipse cx="56" cy="86" rx="20" ry="14" fill="#ff924c" stroke="#161426" strokeWidth="4" />
          <circle cx="34" cy="72" r="8" fill="#ff924c" stroke="#161426" strokeWidth="3.5" />
          <circle cx="34" cy="98" r="8" fill="#ff924c" stroke="#161426" strokeWidth="3.5" />
          <circle cx="48" cy="82" r="3" fill="#161426" />
        </g>
      )}

      {critter === 'bat' && (
        <g>
          <path d="M 60 68 L 20 48 L 28 82 L 60 78 L 92 82 L 100 48 Z" fill="#9b5de5" stroke="#161426" strokeWidth="4" strokeLinejoin="round" />
          <circle cx="60" cy="68" r="16" fill="#3b0764" stroke="#161426" strokeWidth="4" />
          <polygon points="48,54 52,40 58,54" fill="#9b5de5" stroke="#161426" strokeWidth="3" />
          <polygon points="62,54 68,40 72,54" fill="#9b5de5" stroke="#161426" strokeWidth="3" />
          <circle cx="54" cy="66" r="3" fill="#ffca3a" />
          <circle cx="66" cy="66" r="3" fill="#ffca3a" />
        </g>
      )}

      {critter === 'frog' && (
        <g>
          <ellipse cx="60" cy="76" rx="28" ry="20" fill="#8ac926" stroke="#161426" strokeWidth="4" />
          <circle cx="44" cy="54" r="10" fill="#ffffff" stroke="#161426" strokeWidth="4" />
          <circle cx="76" cy="54" r="10" fill="#ffffff" stroke="#161426" strokeWidth="4" />
          <circle cx="44" cy="54" r="4" fill="#161426" />
          <circle cx="76" cy="54" r="4" fill="#161426" />
          <path d="M 42 78 Q 60 90 78 78" fill="none" stroke="#161426" strokeWidth="4" strokeLinecap="round" />
        </g>
      )}

      {critter === 'spider' && (
        <g>
          <g stroke="#161426" strokeWidth="4" strokeLinecap="round">
            <line x1="24" y1="54" x2="96" y2="86" />
            <line x1="24" y1="86" x2="96" y2="54" />
            <line x1="22" y1="70" x2="98" y2="70" />
          </g>
          <circle cx="60" cy="70" r="18" fill="#161426" />
          <circle cx="53" cy="66" r="4" fill="#ff595e" />
          <circle cx="67" cy="66" r="4" fill="#ff595e" />
          <circle cx="48" cy="74" r="2.5" fill="#ffca3a" />
          <circle cx="72" cy="74" r="2.5" fill="#ffca3a" />
        </g>
      )}

      {critter === 'roach' && (
        <g>
          <path d="M 52 44 Q 36 26 28 32" fill="none" stroke="#161426" strokeWidth="3.5" strokeLinecap="round" />
          <path d="M 68 44 Q 84 26 92 32" fill="none" stroke="#161426" strokeWidth="3.5" strokeLinecap="round" />
          <ellipse cx="60" cy="72" rx="18" ry="26" fill="#d97706" stroke="#161426" strokeWidth="4" />
          <line x1="60" y1="52" x2="60" y2="96" stroke="#161426" strokeWidth="3" />
          <circle cx="53" cy="52" r="3.5" fill="#ffffff" />
          <circle cx="67" cy="52" r="3.5" fill="#ffffff" />
        </g>
      )}

      {critter === 'snake' && (
        <g>
          <path
            d="M 34 92 Q 26 70 56 70 Q 88 70 78 48 Q 70 36 52 44"
            fill="none"
            stroke="#38b000"
            strokeWidth="14"
            strokeLinecap="round"
          />
          <path
            d="M 34 92 Q 26 70 56 70 Q 88 70 78 48 Q 70 36 52 44"
            fill="none"
            stroke="#161426"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <path d="M 44 44 L 32 40 M 44 44 L 34 50" stroke="#ff595e" strokeWidth="3" strokeLinecap="round" />
        </g>
      )}

      {critter === 'rat' && (
        <g>
          <circle cx="42" cy="52" r="12" fill="#fda4af" stroke="#161426" strokeWidth="4" />
          <circle cx="78" cy="52" r="12" fill="#fda4af" stroke="#161426" strokeWidth="4" />
          <polygon points="60,94 36,58 84,58" fill="#94a3b8" stroke="#161426" strokeWidth="4" strokeLinejoin="round" />
          <circle cx="52" cy="68" r="3.5" fill="#161426" />
          <circle cx="68" cy="68" r="3.5" fill="#161426" />
          <circle cx="60" cy="92" r="5" fill="#ff595e" stroke="#161426" strokeWidth="2.5" />
        </g>
      )}

      {critter === 'chameleon' && (
        <g>
          <path d="M 32 76 A 28 24 0 0 1 88 76 Z" fill="#00bbf9" stroke="#161426" strokeWidth="4" />
          <circle cx="44" cy="84" r="10" fill="none" stroke="#00bbf9" strokeWidth="6" />
          <circle cx="74" cy="64" r="8" fill="#ffca3a" stroke="#161426" strokeWidth="3.5" />
          <circle cx="75" cy="64" r="3" fill="#161426" />
        </g>
      )}

      {/* Bottom Name Plate */}
      <rect x="14" y="124" width="92" height="22" rx="8" fill={meta.color} stroke="#161426" strokeWidth="3" />
      <text x="60" y="139" textAnchor="middle" fill="#161426" fontSize="13" fontWeight="900">
        {lang === 'ar' ? meta.name_ar : meta.name_en}
      </text>
    </svg>
  );
};
