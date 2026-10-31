import React, { useState, useEffect, useRef } from 'react';
import {
  Flame,
  Scissors,
  Lightning,
  FastForward,
  ArrowsClockwise,
  Broadcast,
  Shuffle,
  Magnet,
  Prohibit,
  Eye,
  EyeSlash,
  Trophy,
  WarningOctagon,
  Sparkle,
  Question,
  CheckCircle,
  Skull,
  ShieldCheck,
  CornersOut,
  CornersIn,
  SpeakerHigh,
  Crosshair,
} from '@phosphor-icons/react';
import { PartyGameSvgIcon, CartoonAvatarSvg } from './CartoonIcons';

export type BoomCardType =
  | 'bomb'
  | 'defuse'
  | 'attack'
  | 'skip'
  | 'reverse'
  | 'radar'
  | 'shuffle'
  | 'magnet'
  | 'block';

export interface BoomCard {
  id: string;
  type: BoomCardType;
}

export interface BoomPendingAction {
  id: string;
  actorId: string;
  cardType: Exclude<BoomCardType, 'bomb' | 'defuse' | 'block'>;
  targetPlayerId?: string;
  blockedCount: number; // Odd = blocked (cancelled), Even = active!
  lastBlockerId?: string;
  createdAt: number;
}

export interface BoomCinematicEvent {
  id: string;
  type: BoomCardType | 'exploded' | 'planted';
  actorId: string;
  targetId?: string;
  subtitle_ar: string;
  subtitle_en: string;
  timestamp: number;
}

export interface BoomDeckGameState {
  phase:
    | 'playing'
    | 'counter_window'
    | 'bomb_crisis'
    | 'planting_bomb'
    | 'round_over';
  round: number;
  deck: BoomCard[];
  discardPile: BoomCard[];
  hands: Record<string, BoomCard[]>;
  alivePlayerIds: string[];
  eliminatedPlayerIds: string[];
  turnPlayerId: string;
  turnsRemaining: number;
  direction: 1 | -1;
  pendingAction?: BoomPendingAction | null;
  crisisPlayerId?: string | null;
  radarPeekPlayerId?: string | null;
  radarCards?: BoomCard[];
  lastCinematic?: BoomCinematicEvent | null;
  winnerId?: string | null;
  actionLog: {
    ar: string;
    en: string;
  }[];
}

interface PlayerInfo {
  id: string;
  name: string;
  avatar_color: string;
  score: number;
}

interface BoomDeckGameProps {
  gameData: BoomDeckGameState;
  players: PlayerInfo[];
  myPlayerId: string;
  isHost: boolean;
  isPassAndPlay: boolean;
  lang: 'ar' | 'en';
  onUpdateGameData: (
    nextData: BoomDeckGameState,
    scoreAwards?: Record<string, number>
  ) => void;
  onStartNewRound: () => void;
}

export const BOOM_CARD_META: Record<
  BoomCardType,
  {
    name_ar: string;
    name_en: string;
    short_ar: string;
    short_en: string;
    desc_ar: string;
    desc_en: string;
    bg: string;
    badgeBg: string;
    accent: string;
    tag_ar: string;
    tag_en: string;
  }
> = {
  bomb: {
    name_ar: 'الديناميت المشتعل!',
    name_en: 'Lit Dynamite!',
    short_ar: 'ينفجر إلا بمقص أسلاك!',
    short_en: 'Explodes unless Defused!',
    desc_ar: 'إذا سحبته ينفجر فيك فوراً وتخرج من الجولة إلا إذا معك «مقص الأسلاك»!',
    desc_en: 'If drawn, it explodes and eliminates you unless you hold Wire Cutters!',
    bg: '#ffe4e6',
    badgeBg: '#e11d48',
    accent: '#e11d48',
    tag_ar: 'خطر قاتل',
    tag_en: 'LETHAL',
  },
  defuse: {
    name_ar: 'مقص الأسلاك',
    name_en: 'Wire Cutters',
    short_ar: 'ينقذك ويزرع اللغم بالسر',
    short_en: 'Saves you & re-plants bomb',
    desc_ar: 'يشتغل تلقائياً عند سحب الديناميت! ينقذك ويخليك تزرع القنبلة بأي مكان بالكومة بالسر!',
    desc_en: 'Cuts the fuse when you draw a bomb and lets you secretly hide it anywhere in the deck!',
    bg: '#dcfce7',
    badgeBg: '#16a34a',
    accent: '#22c55e',
    tag_ar: 'حماية تلقائية',
    tag_en: 'AUTO-SAVE',
  },
  attack: {
    name_ar: 'تدبيل المصيبة ×2',
    name_en: 'Double Trouble ×2',
    short_ar: 'ينهي دورك + سحبتين للي بعدك',
    short_en: 'End turn + next draws 2x',
    desc_ar: 'ينهي دورك فوراً بدون ما تسحب كرت، ويجبر اللاعب اللي بعدك يسحب مرتين متتاليتين!',
    desc_en: 'Immediately ends your turn without drawing and forces the next player to take 2 turns!',
    bg: '#fef9c3',
    badgeBg: '#ca8a04',
    accent: '#eab308',
    tag_ar: 'هجوم مباشر',
    tag_en: 'ATTACK ×2',
  },
  skip: {
    name_ar: 'تزحليقة نيترو!',
    name_en: 'Nitro Skip!',
    short_ar: 'اهرب من سحب الكرت',
    short_en: 'End turn without drawing',
    desc_ar: 'تزحلق واهرب من دورك الحالي بسلام بدون ما تسحب كرت من الكومة!',
    desc_en: 'Dash safely out of your current turn without drawing a card from the pile!',
    bg: '#e0f2fe',
    badgeBg: '#0284c7',
    accent: '#00bbf9',
    tag_ar: 'هروب فوري',
    tag_en: 'ESCAPE',
  },
  reverse: {
    name_ar: 'عكس السير',
    name_en: 'U-Turn Reverse',
    short_ar: 'اعكس الاتجاه واهرب من السحب',
    short_en: 'Flip direction & skip draw',
    desc_ar: 'يعكس اتجاه الدوران حول الطاولة وينهي دورك الحالي بدون سحب كرت!',
    desc_en: 'Flips the turn direction around the table and ends your current turn without drawing!',
    bg: '#f3e8ff',
    badgeBg: '#7c3aed',
    accent: '#9b5de5',
    tag_ar: 'قلب الطاولة',
    tag_en: 'U-TURN',
  },
  radar: {
    name_ar: 'رادار الكومة',
    name_en: 'X-Ray Radar',
    short_ar: 'اكشف أول 3 كروت بالسر',
    short_en: 'Peek top 3 cards secretly',
    desc_ar: 'يكشف لك وحدك بالأشعة السينية أول 3 كروت بأعلى الكومة لتعرف إذا القنبلة عالوجه!',
    desc_en: 'Secretly scans the top 3 cards of the Draw Pile so only you see if a bomb is next!',
    bg: '#fce7f3',
    badgeBg: '#db2777',
    accent: '#f15bb5',
    tag_ar: 'كشف سري',
    tag_en: 'X-RAY',
  },
  shuffle: {
    name_ar: 'إعصار الخلط',
    name_en: 'Tornado Shuffle',
    short_ar: 'اخلط الكومة بالكامل',
    short_en: 'Shuffle the entire deck',
    desc_ar: 'يخلط كومة السحب بالكامل بلمح البصر ليبعد القنبلة عن الوجه أو يخرّب خطط الرادار!',
    desc_en: 'Whirlwind-shuffles the entire Draw Pile to dodge a top-decked bomb!',
    bg: '#ccfbf1',
    badgeBg: '#0d9488',
    accent: '#14b8a6',
    tag_ar: 'بعثرة الكومة',
    tag_en: 'WHIRLWIND',
  },
  magnet: {
    name_ar: 'مغناطيس السرقة',
    name_en: 'Heist Magnet',
    short_ar: 'اسرق كرت من إيد خصمك',
    short_en: 'Steal 1 card from a rival',
    desc_ar: 'اختر أي لاعب عالطاولة واسحب بالمغناطيس كرتاً عشوائياً من يده إلى يدك!',
    desc_en: 'Target any rival player and yank 1 random card straight from their hand into yours!',
    bg: '#ffedd5',
    badgeBg: '#ea580c',
    accent: '#f97316',
    tag_ar: 'سرقة كرت',
    tag_en: 'STEAL',
  },
  block: {
    name_ar: 'بلوك! إبطال',
    name_en: 'BLOCK! Stamp',
    short_ar: 'ألغِ حركة خصمك بأي لحظة',
    short_en: 'Cancel any rival card',
    desc_ar: 'اكبسه بأي لحظة لما يلعب خصمك كرت قدرة (هجوم، تزحليقة، سرقة...) لإبطال حركته فوراً!',
    desc_en: 'Slam this during the Counter Window to cancel any action card played by a rival!',
    bg: '#fee2e2',
    badgeBg: '#dc2626',
    accent: '#ef4444',
    tag_ar: 'اعتراض فوري',
    tag_en: 'COUNTER',
  },
};

function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function buildInitialBoomDeckState(
  players: { id: string; name: string }[],
  round = 1
): BoomDeckGameState {
  const activePlayers =
    players.length >= 2
      ? players
      : [
          { id: 'p1', name: 'اللاعب 1' },
          { id: 'p2', name: 'اللاعب 2' },
        ];
  const pIds = activePlayers.map((p) => p.id);
  const count = pIds.length;

  let cardSeq = 1;
  const makeCard = (type: BoomCardType): BoomCard => ({
    id: `bc_${round}_${cardSeq++}_${Math.random().toString(36).slice(2, 6)}`,
    type,
  });

  // 1. Build Safe Action Pool first (NO bombs during initial deal!)
  const pool: BoomCard[] = [];
  const scale = Math.max(1, Math.ceil(count / 3));
  for (let i = 0; i < 4 * scale; i++) pool.push(makeCard('skip'));
  for (let i = 0; i < 4 * scale; i++) pool.push(makeCard('attack'));
  for (let i = 0; i < 4 * scale; i++) pool.push(makeCard('radar'));
  for (let i = 0; i < 3 * scale; i++) pool.push(makeCard('reverse'));
  for (let i = 0; i < 3 * scale; i++) pool.push(makeCard('shuffle'));
  for (let i = 0; i < 4 * scale; i++) pool.push(makeCard('magnet'));
  for (let i = 0; i < 4 * scale; i++) pool.push(makeCard('block'));

  const shuffledPool = shuffleArray(pool);

  // 2. Deal 5 action cards + 1 guaranteed Wire Cutters (Defuse) to each player (6 cards total)
  const hands: Record<string, BoomCard[]> = {};
  pIds.forEach((pid) => {
    const dealt = shuffledPool.splice(0, 5);
    dealt.push(makeCard('defuse'));
    hands[pid] = shuffleArray(dealt);
  });

  // 3. Add extra Wire Cutters + (count - 1) Lit Dynamite bombs into the Draw Pile!
  const remainingDeck = [...shuffledPool];
  const extraDefuses = Math.max(1, Math.ceil(count / 2));
  for (let i = 0; i < extraDefuses; i++) {
    remainingDeck.push(makeCard('defuse'));
  }
  const bombCount = Math.max(1, count - 1);
  for (let i = 0; i < bombCount; i++) {
    remainingDeck.push(makeCard('bomb'));
  }

  const finalDeck = shuffleArray(remainingDeck);

  return {
    phase: 'playing',
    round,
    deck: finalDeck,
    discardPile: [],
    hands,
    alivePlayerIds: pIds,
    eliminatedPlayerIds: [],
    turnPlayerId: pIds[0],
    turnsRemaining: 1,
    direction: 1,
    pendingAction: null,
    crisisPlayerId: null,
    radarPeekPlayerId: null,
    radarCards: [],
    lastCinematic: null,
    winnerId: null,
    actionLog: [
      {
        ar: `بدأت الجولة ${round}! وُزّع لكل لاعب مقص أسلاك واحد، وزُرعت ${bombCount} قنابل ديناميت بالكومة!`,
        en: `Round ${round} started! Every player holds 1 Wire Cutter and ${bombCount} Dynamite bombs lurk in the deck!`,
      },
    ],
  };
}

/* ============================================================================
 * ORNATE CARD BACK SVG FOR RIVAL FANNED HANDS & DRAW PILE
 * ========================================================================== */
export const BoomCardBackSvg: React.FC<{ className?: string }> = ({
  className = 'w-10 h-14',
}) => (
  <svg viewBox="0 0 60 84" className={className}>
    <defs>
      <linearGradient id="boomBackCrimson" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#fb7185" />
        <stop offset="45%" stopColor="#e11d48" />
        <stop offset="100%" stopColor="#881337" />
      </linearGradient>
    </defs>
    <rect
      x="2"
      y="2"
      width="56"
      height="80"
      rx="10"
      fill="url(#boomBackCrimson)"
      stroke="#161426"
      strokeWidth="4"
    />
    <rect
      x="7"
      y="7"
      width="46"
      height="70"
      rx="6"
      fill="none"
      stroke="#ffca3a"
      strokeWidth="2"
      strokeDasharray="5 3"
    />
    <circle
      cx="30"
      cy="44"
      r="16"
      fill="#161426"
      stroke="#ffca3a"
      strokeWidth="2.5"
    />
    {/* Mini Bomb Core */}
    <circle cx="29" cy="46" r="8" fill="#e11d48" />
    <path
      d="M 33 38 Q 37 31 43 32"
      fill="none"
      stroke="#ffca3a"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
    <polygon
      points="43,27 45,31 49,31 46,34 47,38 43,35 39,38 40,34 37,31 41,31"
      fill="#ffca3a"
    />
  </svg>
);

/* ============================================================================
 * HIGH-DETAIL MULTI-LAYERED CARTOON VECTOR ILLUSTRATIONS FOR ALL 9 CARDS
 * ========================================================================== */
export const BoomCardIllustrationSvg: React.FC<{
  type: BoomCardType;
  className?: string;
}> = ({ type, className = 'w-16 h-16' }) => {
  switch (type) {
    case 'bomb':
      return (
        <svg viewBox="0 0 96 96" className={className}>
          <defs>
            <radialGradient id="bombHalo" cx="50%" cy="55%" r="50%">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="55%" stopColor="#fda4af" />
              <stop offset="100%" stopColor="#fb7185" />
            </radialGradient>
            <linearGradient id="dynStick" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#fb7185" />
              <stop offset="40%" stopColor="#e11d48" />
              <stop offset="100%" stopColor="#9f1239" />
            </linearGradient>
          </defs>
          {/* Danger Halo + Caution Rim */}
          <circle cx="48" cy="52" r="36" fill="url(#bombHalo)" stroke="#161426" strokeWidth="3.5" />
          <circle cx="48" cy="52" r="30" fill="none" stroke="#e11d48" strokeWidth="2" strokeDasharray="6 4" opacity="0.5" />
          {/* 3 Shaded 3D Dynamite Cylinders */}
          <g>
            {/* Left Stick */}
            <rect x="21" y="34" width="16" height="46" rx="6" fill="url(#dynStick)" stroke="#161426" strokeWidth="3.4" />
            <line x1="26" y1="39" x2="26" y2="74" stroke="#ffe4e6" strokeWidth="2.5" strokeLinecap="round" opacity="0.75" />
            {/* Right Stick */}
            <rect x="59" y="34" width="16" height="46" rx="6" fill="url(#dynStick)" stroke="#161426" strokeWidth="3.4" />
            <line x1="64" y1="39" x2="64" y2="74" stroke="#ffe4e6" strokeWidth="2.5" strokeLinecap="round" opacity="0.75" />
            {/* Center Tall Stick */}
            <rect x="38" y="29" width="20" height="53" rx="7" fill="#f43f5e" stroke="#161426" strokeWidth="3.6" />
            <line x1="43.5" y1="34" x2="43.5" y2="76" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" opacity="0.8" />
          </g>
          {/* Heavy Tactical Straps */}
          <rect x="18" y="43" width="60" height="7" rx="2.5" fill="#161426" />
          <rect x="18" y="65" width="60" height="7" rx="2.5" fill="#161426" />
          {/* Colored Detonator Wires */}
          <path d="M 28 43 C 24 35, 36 35, 42 48" fill="none" stroke="#38bdf8" strokeWidth="2.8" strokeLinecap="round" />
          <path d="M 68 43 C 72 35, 60 35, 54 48" fill="none" stroke="#facc15" strokeWidth="2.8" strokeLinecap="round" />
          {/* Digital Countdown Console */}
          <rect x="27" y="46" width="42" height="21" rx="5" fill="#1e293b" stroke="#161426" strokeWidth="3.4" />
          <rect x="31" y="50" width="34" height="13" rx="2.5" fill="#090d16" stroke="#ffca3a" strokeWidth="1.5" />
          <text x="48" y="60" textAnchor="middle" fill="#ff595e" fontSize="11.5" fontWeight="900" fontFamily="monospace">
            00:01
          </text>
          {/* Braided Fuse & Multi-Layer Fireball Spark */}
          <path d="M 48 29 C 48 16, 61 17, 68 12" fill="none" stroke="#d97706" strokeWidth="5" strokeLinecap="round" />
          <path d="M 48 29 C 48 16, 61 17, 68 12" fill="none" stroke="#161426" strokeWidth="2.5" strokeDasharray="3 4" strokeLinecap="round" />
          <g transform="translate(70, 12)">
            <polygon
              points="0,-11 4,-4 12,-5 6,1 10,8 2,5 -3,11 -4,3 -12,2 -5,-3"
              fill="#ff595e"
              stroke="#161426"
              strokeWidth="2.6"
              strokeLinejoin="round"
            />
            <polygon
              points="0,-6 2.5,-2 7,-2 3.5,1 5,5 0,3 -3,6 -2.5,1 -7,-1 -2,-2"
              fill="#ffca3a"
            />
            <circle cx="0" cy="0" r="2.8" fill="#ffffff" />
          </g>
        </svg>
      );

    case 'defuse':
      return (
        <svg viewBox="0 0 96 96" className={className}>
          <defs>
            <radialGradient id="defuseHalo" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ecfccb" />
              <stop offset="65%" stopColor="#86efac" />
              <stop offset="100%" stopColor="#22c55e" />
            </radialGradient>
            <linearGradient id="steelJaw" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#f8fafc" />
              <stop offset="50%" stopColor="#cbd5e1" />
              <stop offset="100%" stopColor="#64748b" />
            </linearGradient>
          </defs>
          {/* Emerald Shield Aura */}
          <circle cx="48" cy="50" r="36" fill="url(#defuseHalo)" stroke="#161426" strokeWidth="3.5" />
          {/* Red Fuse Wire Being Snipped in Half! */}
          <path d="M 10 34 C 22 34, 30 38, 39 40" fill="none" stroke="#161426" strokeWidth="8" strokeLinecap="round" />
          <path d="M 10 34 C 22 34, 30 38, 39 40" fill="none" stroke="#e11d48" strokeWidth="4.5" strokeLinecap="round" />
          <path d="M 57 40 C 66 38, 74 34, 86 34" fill="none" stroke="#161426" strokeWidth="8" strokeLinecap="round" strokeDasharray="6 5" />
          <path d="M 57 40 C 66 38, 74 34, 86 34" fill="none" stroke="#e11d48" strokeWidth="4.5" strokeLinecap="round" strokeDasharray="6 5" />
          {/* Chrome Jaws of the Wire Cutters */}
          <path
            d="M 48 44 L 35 23 C 39 18, 45 20, 48 31 Z"
            fill="url(#steelJaw)"
            stroke="#161426"
            strokeWidth="3.2"
            strokeLinejoin="round"
          />
          <path
            d="M 48 44 L 61 23 C 57 18, 51 20, 48 31 Z"
            fill="url(#steelJaw)"
            stroke="#161426"
            strokeWidth="3.2"
            strokeLinejoin="round"
          />
          {/* Insulated Rubber Handles with Grip Ridges */}
          <path
            d="M 45 46 L 24 78 C 20 82, 28 86, 33 80 L 49 51 Z"
            fill="#16a34a"
            stroke="#161426"
            strokeWidth="3.4"
            strokeLinejoin="round"
          />
          <path
            d="M 51 46 L 72 78 C 76 82, 68 86, 63 80 L 47 51 Z"
            fill="#22c55e"
            stroke="#161426"
            strokeWidth="3.4"
            strokeLinejoin="round"
          />
          {/* Golden Pivot Bolt */}
          <circle cx="48" cy="46" r="7" fill="#ffca3a" stroke="#161426" strokeWidth="3.2" />
          <circle cx="48" cy="46" r="2.5" fill="#161426" />
          {/* Snipping Spark Burst */}
          <polygon
            points="48,8 51,16 60,14 54,21 60,27 51,25 48,33 45,25 36,27 42,21 36,14 45,16"
            fill="#00f5d4"
            stroke="#161426"
            strokeWidth="2.4"
            strokeLinejoin="round"
          />
          <circle cx="48" cy="20.5" r="4" fill="#ffffff" />
        </svg>
      );

    case 'attack':
      return (
        <svg viewBox="0 0 96 96" className={className}>
          <defs>
            <radialGradient id="atkHalo" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="45%" stopColor="#fef08a" />
              <stop offset="100%" stopColor="#f59e0b" />
            </radialGradient>
          </defs>
          <circle cx="48" cy="50" r="36" fill="url(#atkHalo)" stroke="#161426" strokeWidth="3.5" />
          {/* Speed Impact Spikes */}
          <polygon
            points="48,10 53,20 65,13 61,25 75,23 67,34 82,38 70,46 82,56 68,59 74,72 60,68 58,82 48,72 38,82 36,68 22,72 28,59 14,56 26,46 14,38 29,34 21,23 35,25 31,13 43,20"
            fill="#fde047"
            stroke="#161426"
            strokeWidth="2.2"
          />
          {/* Left Supercharged Bolt */}
          <polygon
            points="39,12 16,49 34,49 25,82 55,41 37,41"
            fill="#ffca3a"
            stroke="#161426"
            strokeWidth="3.6"
            strokeLinejoin="round"
          />
          <polygon points="36,20 22,46 34,46 29,67 48,43 36,43" fill="#ffffff" opacity="0.7" />
          {/* Right Supercharged Bolt */}
          <polygon
            points="64,14 43,47 59,47 51,78 79,40 62,40"
            fill="#f97316"
            stroke="#161426"
            strokeWidth="3.6"
            strokeLinejoin="round"
          />
          {/* 3D Crimson ×2 Badge */}
          <g transform="translate(68, 67)">
            <circle cx="0" cy="0" r="15" fill="#e11d48" stroke="#161426" strokeWidth="3.5" />
            <circle cx="0" cy="0" r="11.5" fill="none" stroke="#fda4af" strokeWidth="1.5" />
            <text x="0" y="5" textAnchor="middle" fill="#ffffff" fontSize="14" fontWeight="900">
              ×2
            </text>
          </g>
        </svg>
      );

    case 'skip':
      return (
        <svg viewBox="0 0 96 96" className={className}>
          <defs>
            <radialGradient id="skipHalo" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#e0f2fe" />
              <stop offset="65%" stopColor="#7dd3fc" />
              <stop offset="100%" stopColor="#0284c7" />
            </radialGradient>
          </defs>
          <circle cx="48" cy="50" r="36" fill="url(#skipHalo)" stroke="#161426" strokeWidth="3.5" />
          {/* Nitro Exhaust Flame & Smoke Clouds */}
          <circle cx="19" cy="56" r="8" fill="#ffffff" stroke="#161426" strokeWidth="2.8" />
          <circle cx="26" cy="64" r="6" fill="#e2e8f0" stroke="#161426" strokeWidth="2.5" />
          <path
            d="M 32 48 L 10 42 L 20 53 L 8 60 L 34 58 Z"
            fill="#f97316"
            stroke="#161426"
            strokeWidth="2.8"
            strokeLinejoin="round"
          />
          {/* Winged Turbo Sneaker / Rocket Boot */}
          <g transform="rotate(-12 52 48)">
            <path
              d="M 34 30 H 54 L 58 46 L 78 50 C 83 51, 84 62, 76 64 H 30 C 26 64, 26 54, 29 48 Z"
              fill="#00bbf9"
              stroke="#161426"
              strokeWidth="3.6"
              strokeLinejoin="round"
            />
            {/* White Sole & Racing Stripes */}
            <rect x="27" y="60" width="53" height="7" rx="3.5" fill="#ffffff" stroke="#161426" strokeWidth="3" />
            {/* Golden Hermes Wing on Boot */}
            <path
              d="M 42 42 C 32 32, 22 34, 18 24 C 28 22, 36 25, 42 30 C 38 22, 30 18, 26 12 C 38 12, 48 20, 52 34 Z"
              fill="#ffca3a"
              stroke="#161426"
              strokeWidth="3"
              strokeLinejoin="round"
            />
          </g>
          {/* Neon Fast-Forward Chevrons */}
          <polygon points="62,18 76,28 62,38" fill="#ffca3a" stroke="#161426" strokeWidth="2.8" strokeLinejoin="round" />
          <polygon points="73,18 87,28 73,38" fill="#ffffff" stroke="#161426" strokeWidth="2.8" strokeLinejoin="round" />
        </svg>
      );

    case 'reverse':
      return (
        <svg viewBox="0 0 96 96" className={className}>
          <defs>
            <radialGradient id="revHalo" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#fae8ff" />
              <stop offset="65%" stopColor="#d8b4fe" />
              <stop offset="100%" stopColor="#9333ea" />
            </radialGradient>
          </defs>
          <circle cx="48" cy="50" r="36" fill="url(#revHalo)" stroke="#161426" strokeWidth="3.5" />
          <circle cx="48" cy="50" r="14" fill="#161426" stroke="#ffca3a" strokeWidth="2.5" />
          {/* Top 3D Ribbon Arrow (Violet -> Gold) */}
          <path
            d="M 21 44 A 27 27 0 0 1 73 38"
            fill="none"
            stroke="#161426"
            strokeWidth="12"
            strokeLinecap="round"
          />
          <path
            d="M 21 44 A 27 27 0 0 1 73 38"
            fill="none"
            stroke="#7c3aed"
            strokeWidth="7"
            strokeLinecap="round"
          />
          <polygon
            points="74,23 86,43 63,43"
            fill="#ffca3a"
            stroke="#161426"
            strokeWidth="3.2"
            strokeLinejoin="round"
          />
          {/* Bottom 3D Ribbon Arrow (Magenta -> Cyan) */}
          <path
            d="M 75 56 A 27 27 0 0 1 23 62"
            fill="none"
            stroke="#161426"
            strokeWidth="12"
            strokeLinecap="round"
          />
          <path
            d="M 75 56 A 27 27 0 0 1 23 62"
            fill="none"
            stroke="#f15bb5"
            strokeWidth="7"
            strokeLinecap="round"
          />
          <polygon
            points="22,77 10,57 33,57"
            fill="#00f5d4"
            stroke="#161426"
            strokeWidth="3.2"
            strokeLinejoin="round"
          />
          {/* Center Spin Star */}
          <polygon points="48,41 50.5,47.5 57,50 50.5,52.5 48,59 45.5,52.5 39,50 45.5,47.5" fill="#ffca3a" />
        </svg>
      );

    case 'radar':
      return (
        <svg viewBox="0 0 96 96" className={className}>
          <defs>
            <radialGradient id="radHalo" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#fdf2f8" />
              <stop offset="65%" stopColor="#f9a8d4" />
              <stop offset="100%" stopColor="#db2777" />
            </radialGradient>
          </defs>
          <circle cx="48" cy="50" r="36" fill="url(#radHalo)" stroke="#161426" strokeWidth="3.5" />
          {/* 3 Fanned Cards Being Scanned by X-Ray */}
          <g transform="rotate(-16 28 38)">
            <rect x="16" y="18" width="22" height="32" rx="4" fill="#e0f2fe" stroke="#161426" strokeWidth="3" />
            <text x="27" y="38" textAnchor="middle" fill="#0284c7" fontSize="11" fontWeight="900">1</text>
          </g>
          <g transform="rotate(16 68 38)">
            <rect x="58" y="18" width="22" height="32" rx="4" fill="#dcfce7" stroke="#161426" strokeWidth="3" />
            <text x="69" y="38" textAnchor="middle" fill="#16a34a" fontSize="11" fontWeight="900">3</text>
          </g>
          {/* Center Card Revealed as a Glowing Red Bomb! */}
          <rect x="36" y="13" width="24" height="35" rx="4.5" fill="#ffe4e6" stroke="#161426" strokeWidth="3.2" />
          <circle cx="48" cy="31" r="7" fill="#e11d48" stroke="#161426" strokeWidth="2.2" />
          <circle cx="48" cy="31" r="2.5" fill="#ffca3a" />
          {/* Cybernetic X-Ray Visor Goggles */}
          <rect x="18" y="51" width="60" height="22" rx="11" fill="#161426" stroke="#ffca3a" strokeWidth="3.2" />
          <circle cx="35" cy="62" r="7.5" fill="#00f5d4" stroke="#161426" strokeWidth="2" />
          <circle cx="61" cy="62" r="7.5" fill="#00f5d4" stroke="#161426" strokeWidth="2" />
          <circle cx="33" cy="60" r="2.5" fill="#ffffff" />
          <circle cx="59" cy="60" r="2.5" fill="#ffffff" />
          {/* Neon Laser Scan Line Across Cards */}
          <line x1="16" y1="32" x2="80" y2="32" stroke="#00f5d4" strokeWidth="3.5" strokeLinecap="round" />
        </svg>
      );

    case 'shuffle':
      return (
        <svg viewBox="0 0 96 96" className={className}>
          <defs>
            <radialGradient id="shufHalo" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#f0fdfa" />
              <stop offset="65%" stopColor="#5eead4" />
              <stop offset="100%" stopColor="#0d9488" />
            </radialGradient>
          </defs>
          <circle cx="48" cy="50" r="36" fill="url(#shufHalo)" stroke="#161426" strokeWidth="3.5" />
          {/* Tornado Funnel Swirls */}
          <path d="M 18 32 Q 48 44 78 32" fill="none" stroke="#161426" strokeWidth="7" strokeLinecap="round" />
          <path d="M 18 32 Q 48 44 78 32" fill="none" stroke="#00f5d4" strokeWidth="3.5" strokeLinecap="round" />
          <path d="M 24 52 Q 48 64 72 52" fill="none" stroke="#161426" strokeWidth="7" strokeLinecap="round" />
          <path d="M 24 52 Q 48 64 72 52" fill="none" stroke="#2dd4bf" strokeWidth="3.5" strokeLinecap="round" />
          <path d="M 33 70 Q 48 79 63 70" fill="none" stroke="#161426" strokeWidth="6" strokeLinecap="round" />
          {/* Flying Cards Caught in the Cyclone */}
          <g transform="rotate(-24 26 36)">
            <rect x="15" y="20" width="20" height="28" rx="4" fill="#ffca3a" stroke="#161426" strokeWidth="3" />
            <circle cx="25" cy="34" r="4" fill="#e11d48" />
          </g>
          <g transform="rotate(22 70 36)">
            <rect x="60" y="20" width="20" height="28" rx="4" fill="#00bbf9" stroke="#161426" strokeWidth="3" />
            <circle cx="70" cy="34" r="4" fill="#ffffff" />
          </g>
          <g transform="rotate(6 48 42)">
            <rect x="37" y="24" width="22" height="31" rx="4.5" fill="#fff9ec" stroke="#161426" strokeWidth="3.2" />
            <polygon points="48,31 51,38 58,38 52,42 54,49 48,45 42,49 44,42 38,38 45,38" fill="#f15bb5" />
          </g>
        </svg>
      );

    case 'magnet':
      return (
        <svg viewBox="0 0 96 96" className={className}>
          <defs>
            <radialGradient id="magHalo" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#fff7ed" />
              <stop offset="65%" stopColor="#fdba74" />
              <stop offset="100%" stopColor="#ea580c" />
            </radialGradient>
          </defs>
          <circle cx="48" cy="50" r="36" fill="url(#magHalo)" stroke="#161426" strokeWidth="3.5" />
          {/* Stolen Card Being Yanked From Above */}
          <g transform="rotate(14 48 21)">
            <rect x="37" y="7" width="22" height="28" rx="4" fill="#ffca3a" stroke="#161426" strokeWidth="3" />
            <rect x="41" y="11" width="14" height="20" rx="2" fill="#fff9ec" />
          </g>
          {/* Giant Horseshoe Magnet */}
          <path
            d="M 22 36 V 56 A 26 26 0 0 0 74 56 V 36 H 58 V 56 A 10 10 0 0 1 38 56 V 36 Z"
            fill="#e11d48"
            stroke="#161426"
            strokeWidth="3.6"
            strokeLinejoin="round"
          />
          {/* Metallic Silver Pole Tips */}
          <rect x="22" y="26" width="16" height="12" rx="2" fill="#e2e8f0" stroke="#161426" strokeWidth="3.4" />
          <rect x="58" y="26" width="16" height="12" rx="2" fill="#e2e8f0" stroke="#161426" strokeWidth="3.4" />
          {/* High-Voltage Plasma Waves */}
          <path d="M 30 22 L 35 14 L 41 21" fill="none" stroke="#00bbf9" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M 55 21 L 61 14 L 66 22" fill="none" stroke="#00bbf9" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );

    case 'block':
    default:
      return (
        <svg viewBox="0 0 96 96" className={className}>
          <defs>
            <linearGradient id="stopOct" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#fb7185" />
              <stop offset="45%" stopColor="#ef4444" />
              <stop offset="100%" stopColor="#991b1b" />
            </linearGradient>
          </defs>
          {/* 3D Octagonal Steel & Crimson Stop Sign */}
          <polygon
            points="33,12 63,12 84,33 84,63 63,84 33,84 12,63 12,33"
            fill="url(#stopOct)"
            stroke="#161426"
            strokeWidth="4"
            strokeLinejoin="round"
          />
          <polygon
            points="36,18 60,18 78,36 78,60 60,78 36,78 18,60 18,36"
            fill="none"
            stroke="#fecdd3"
            strokeWidth="2.2"
            strokeLinejoin="round"
          />
          {/* White Inner Shield + Bold Stop Hand / Prohibit Slash */}
          <circle cx="48" cy="48" r="20" fill="#fff9ec" stroke="#161426" strokeWidth="3.5" />
          {/* Cartoon Stop Hand Palm */}
          <rect x="40" y="44" width="16" height="15" rx="4" fill="#ef4444" stroke="#161426" strokeWidth="2.4" />
          <rect x="38" y="34" width="4.5" height="12" rx="2" fill="#ef4444" stroke="#161426" strokeWidth="2" />
          <rect x="43.5" y="31" width="4.5" height="14" rx="2" fill="#ef4444" stroke="#161426" strokeWidth="2" />
          <rect x="49" y="32" width="4.5" height="13" rx="2" fill="#ef4444" stroke="#161426" strokeWidth="2" />
          <rect x="54.5" y="36" width="4.5" height="10" rx="2" fill="#ef4444" stroke="#161426" strokeWidth="2" />
          <line x1="33" y1="33" x2="63" y2="63" stroke="#161426" strokeWidth="7" strokeLinecap="round" />
          <line x1="33" y1="33" x2="63" y2="63" stroke="#ffca3a" strokeWidth="3.5" strokeLinecap="round" />
        </svg>
      );
  }
};

/* ============================================================================
 * SPATIAL ARENA COORDINATE SYSTEM (1000 × 560 Tabletop Canvas)
 * Every player seat around the table has exact (x, y) coordinates so animations
 * literally travel between the Actor Seat, the Target Seat, and the Center Deck!
 * ========================================================================== */
export interface SeatCoord {
  id: string;
  x: number; // 0..1000
  y: number; // 0..560
  isBottomViewer: boolean;
}

const DRAW_PILE_COORD = { x: 420, y: 270 };
const DISCARD_PILE_COORD = { x: 580, y: 270 };
const TABLE_CENTER_COORD = { x: 500, y: 270 };

export function computeTableSeatCoords(
  players: { id: string }[],
  bottomViewerId: string
): Record<string, SeatCoord> {
  const result: Record<string, SeatCoord> = {};
  if (players.length === 0) return result;

  const bottomIdx = Math.max(
    0,
    players.findIndex((p) => p.id === bottomViewerId)
  );
  // Rotate players array so bottomViewerId is index 0 (Bottom Center of Table)
  const rotated = [
    ...players.slice(bottomIdx),
    ...players.slice(0, bottomIdx),
  ];

  // Bottom player sits at (500, 485)
  result[rotated[0].id] = {
    id: rotated[0].id,
    x: 500,
    y: 485,
    isBottomViewer: true,
  };

  const rivals = rotated.slice(1);
  const rCount = rivals.length;

  // Preset balanced stadium arc coordinates for 1 to 7+ rivals around the upper/side perimeter
  rivals.forEach((riv, idx) => {
    // Angle goes from Left-Bottom-ish (160 deg) over the Top (270 deg) to Right-Bottom-ish (380 deg)
    const t = rCount === 1 ? 0.5 : idx / (rCount - 1);
    const angleDeg = rCount === 1 ? 270 : 165 + t * 210; // 165° (left) -> 270° (top) -> 375° (right)
    const rad = (angleDeg * Math.PI) / 180;
    const rx = 390;
    const ry = 185;
    const cx = 500 + Math.cos(rad) * rx;
    const cy = 265 + Math.sin(rad) * ry;
    result[riv.id] = {
      id: riv.id,
      x: Math.round(cx),
      y: Math.round(cy),
      isBottomViewer: false,
    };
  });

  return result;
}

/* ============================================================================
 * LIVE IN-ARENA SPATIAL CHOREOGRAPHY LAYER (SVG viewBox="0 0 1000 560")
 * Renders directly ON the table surface between the actual player seats & deck!
 * ========================================================================== */
export const ArenaSpatialFXLayer: React.FC<{
  seatCoords: Record<string, SeatCoord>;
  turnPlayerId: string;
  direction: 1 | -1;
  cinematic: BoomCinematicEvent | null;
  ar: boolean;
}> = ({ seatCoords, turnPlayerId, direction, cinematic, ar }) => {
  const turnSeat = seatCoords[turnPlayerId] || { x: 500, y: 485 };
  const actorSeat =
    (cinematic && seatCoords[cinematic.actorId]) || { x: 500, y: 485 };
  const targetSeat =
    (cinematic?.targetId && seatCoords[cinematic.targetId]) ||
    DRAW_PILE_COORD;

  return (
    <svg
      viewBox="0 0 1000 560"
      className="absolute inset-0 w-full h-full pointer-events-none z-20 overflow-visible"
      preserveAspectRatio="none"
    >
      <defs>
        <radialGradient id="turnBeamGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffca3a" stopOpacity="0.32" />
          <stop offset="100%" stopColor="#ffca3a" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="tractorBeam" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#f97316" stopOpacity="0.95" />
          <stop offset="50%" stopColor="#ffca3a" stopOpacity="1" />
          <stop offset="100%" stopColor="#00bbf9" stopOpacity="0.95" />
        </linearGradient>
      </defs>

      {/* 1. PERMANENT TABLETOP ORBITAL TURN RING & DIRECTION ARROWS */}
      <ellipse
        cx="500"
        cy="270"
        rx="340"
        ry="155"
        fill="none"
        stroke="#ffca3a"
        strokeWidth="2.5"
        strokeDasharray="10 14"
        opacity="0.28"
      >
        <animate
          attributeName="stroke-dashoffset"
          from={direction === 1 ? '48' : '0'}
          to={direction === 1 ? '0' : '48'}
          dur="1.6s"
          repeatCount="indefinite"
        />
      </ellipse>

      {/* Spotlight Beam from Center Console to Active Turn Player's Seat */}
      <line
        x1={TABLE_CENTER_COORD.x}
        y1={TABLE_CENTER_COORD.y}
        x2={turnSeat.x}
        y2={turnSeat.y}
        stroke="#ffca3a"
        strokeWidth="4"
        strokeDasharray="8 8"
        opacity="0.35"
      />
      <circle cx={turnSeat.x} cy={turnSeat.y} r="55" fill="url(#turnBeamGrad)" />

      {/* 2. LIVE SPATIAL ABILITY CHOREOGRAPHY HAPPENING LITERALLY IN THE ARENA! */}
      {cinematic && (
        <g key={cinematic.id}>
          {/* ==================== MAGNET: TRACTOR BEAM & FLYING STOLEN CARD FROM TARGET SEAT -> ACTOR SEAT ==================== */}
          {cinematic.type === 'magnet' && (
            <g>
              {/* High-Voltage Tractor Beam Line Connecting Actor Seat <-> Target Seat */}
              <line
                x1={actorSeat.x}
                y1={actorSeat.y}
                x2={targetSeat.x}
                y2={targetSeat.y}
                stroke="#161426"
                strokeWidth="18"
                strokeLinecap="round"
                opacity="0.6"
              />
              <line
                x1={actorSeat.x}
                y1={actorSeat.y}
                x2={targetSeat.x}
                y2={targetSeat.y}
                stroke="url(#tractorBeam)"
                strokeWidth="10"
                strokeDasharray="16 10"
                strokeLinecap="round"
              >
                <animate
                  attributeName="stroke-dashoffset"
                  values="0;52"
                  dur="0.35s"
                  repeatCount="indefinite"
                />
              </line>

              {/* Target Seat Magnetic Lock Ring */}
              <circle
                cx={targetSeat.x}
                cy={targetSeat.y}
                r="42"
                fill="none"
                stroke="#f97316"
                strokeWidth="5"
                strokeDasharray="10 6"
              >
                <animate
                  attributeName="r"
                  values="30;58;30"
                  dur="0.7s"
                  repeatCount="indefinite"
                />
              </circle>

              {/* Giant Horseshoe Magnet Launching at Actor's Seat */}
              <g transform={`translate(${actorSeat.x}, ${actorSeat.y})`}>
                <circle r="44" fill="#ffedd5" stroke="#161426" strokeWidth="4" />
                <path
                  d="M -18 -14 V 8 A 18 18 0 0 0 18 8 V -14 H 7 V 8 A 7 7 0 0 1 -7 8 V -14 Z"
                  fill="#e11d48"
                  stroke="#161426"
                  strokeWidth="3.5"
                />
                <rect x="-18" y="-22" width="11" height="9" fill="#cbd5e1" stroke="#161426" strokeWidth="3" />
                <rect x="7" y="-22" width="11" height="9" fill="#cbd5e1" stroke="#161426" strokeWidth="3" />
              </g>

              {/* Physical Stolen Card Flying Across the Table from Target Seat -> Actor Seat! */}
              <g>
                <animateTransform
                  attributeName="transform"
                  type="translate"
                  values={`${targetSeat.x},${targetSeat.y}; ${actorSeat.x},${actorSeat.y}; ${actorSeat.x},${actorSeat.y}`}
                  keyTimes="0; 0.75; 1"
                  dur="1.15s"
                  repeatCount="indefinite"
                />
                <g>
                  <animateTransform
                    attributeName="transform"
                    type="rotate"
                    from="0"
                    to="360"
                    dur="0.6s"
                    repeatCount="indefinite"
                  />
                  <rect
                    x="-24"
                    y="-34"
                    width="48"
                    height="68"
                    rx="8"
                    fill="#ffca3a"
                    stroke="#161426"
                    strokeWidth="4"
                  />
                  <rect
                    x="-17"
                    y="-27"
                    width="34"
                    height="54"
                    rx="5"
                    fill="#fff9ec"
                    stroke="#161426"
                    strokeWidth="2"
                  />
                  <circle cx="0" cy="0" r="10" fill="#f97316" />
                </g>
              </g>
            </g>
          )}

          {/* ==================== ATTACK ×2: TWIN LIGHTNING BOLTS SLAMMING FROM ACTOR -> NEXT PLAYER ==================== */}
          {cinematic.type === 'attack' && (
            <g>
              {/* High-Voltage Lightning Beam from Actor to Target/Center */}
              <line
                x1={actorSeat.x}
                y1={actorSeat.y}
                x2={targetSeat.x}
                y2={targetSeat.y}
                stroke="#eab308"
                strokeWidth="12"
                strokeDasharray="20 8"
                strokeLinecap="round"
              >
                <animate
                  attributeName="stroke-dashoffset"
                  values="28;0"
                  dur="0.25s"
                  repeatCount="indefinite"
                />
              </line>

              {/* Travelling Energy Bolt Orb from Actor -> Target */}
              <g>
                <animateTransform
                  attributeName="transform"
                  type="translate"
                  values={`${actorSeat.x},${actorSeat.y}; ${targetSeat.x},${targetSeat.y}`}
                  dur="0.75s"
                  repeatCount="indefinite"
                />
                <circle r="38" fill="#fef08a" stroke="#161426" strokeWidth="4" />
                <polygon
                  points="4,-28 -18,4 0,4 -10,28 20,-4 2,-4"
                  fill="#f97316"
                  stroke="#161426"
                  strokeWidth="3"
                />
                <circle cx="22" cy="18" r="16" fill="#e11d48" stroke="#161426" strokeWidth="3" />
                <text x="22" y="23" textAnchor="middle" fill="#ffffff" fontSize="15" fontWeight="900">
                  ×2
                </text>
              </g>

              {/* Shockwave Ring at Target */}
              <circle
                cx={targetSeat.x}
                cy={targetSeat.y}
                r="45"
                fill="none"
                stroke="#e11d48"
                strokeWidth="6"
              >
                <animate attributeName="r" values="20;75" dur="0.75s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="1;0" dur="0.75s" repeatCount="indefinite" />
              </circle>
            </g>
          )}

          {/* ==================== SKIP: NITRO ROCKET DASH ESCAPING ACTOR SEAT ==================== */}
          {cinematic.type === 'skip' && (
            <g>
              {/* Smoke Puffs Left Behind at Actor Seat */}
              <circle cx={actorSeat.x - 25} cy={actorSeat.y} r="22" fill="#e0f2fe" stroke="#161426" strokeWidth="3">
                <animate attributeName="r" values="12;34;12" dur="0.8s" repeatCount="indefinite" />
              </circle>
              <circle cx={actorSeat.x + 25} cy={actorSeat.y - 10} r="18" fill="#bae6fd" stroke="#161426" strokeWidth="3">
                <animate attributeName="r" values="10;28;10" dur="0.8s" repeatCount="indefinite" />
              </circle>
              {/* Rocket Boot Vaulting from Actor Seat Across the Table */}
              <g>
                <animateTransform
                  attributeName="transform"
                  type="translate"
                  values={`${actorSeat.x},${actorSeat.y}; ${TABLE_CENTER_COORD.x},${TABLE_CENTER_COORD.y - 40}`}
                  dur="0.85s"
                  repeatCount="indefinite"
                />
                <circle r="40" fill="#00bbf9" stroke="#161426" strokeWidth="4" />
                <polygon points="-16,-18 10,0 -16,18" fill="#ffca3a" stroke="#161426" strokeWidth="3" />
                <polygon points="4,-18 30,0 4,18" fill="#ffffff" stroke="#161426" strokeWidth="3" />
              </g>
            </g>
          )}

          {/* ==================== REVERSE: GIANT NEON U-TURN PORTAL SPINNING AROUND THE WHOLE TABLE ==================== */}
          {cinematic.type === 'reverse' && (
            <g transform="translate(500, 270)">
              <ellipse
                cx="0"
                cy="0"
                rx="360"
                ry="170"
                fill="none"
                stroke="#a855f7"
                strokeWidth="10"
                strokeDasharray="32 18"
              >
                <animate
                  attributeName="stroke-dashoffset"
                  values="0;100"
                  dur="0.5s"
                  repeatCount="indefinite"
                />
              </ellipse>
              <g>
                <animateTransform
                  attributeName="transform"
                  type="rotate"
                  from={direction === 1 ? '0' : '360'}
                  to={direction === 1 ? '360' : '0'}
                  dur="1.2s"
                  repeatCount="indefinite"
                />
                <path
                  d="M -95 -20 A 95 95 0 0 1 95 -20"
                  fill="none"
                  stroke="#9b5de5"
                  strokeWidth="16"
                  strokeLinecap="round"
                />
                <polygon points="95,-48 128,-5 68,-5" fill="#ffca3a" stroke="#161426" strokeWidth="4" />
                <path
                  d="M 95 20 A 95 95 0 0 1 -95 20"
                  fill="none"
                  stroke="#f15bb5"
                  strokeWidth="16"
                  strokeLinecap="round"
                />
                <polygon points="-95,48 -128,5 -68,5" fill="#00f5d4" stroke="#161426" strokeWidth="4" />
              </g>
            </g>
          )}

          {/* ==================== RADAR: X-RAY LASER CONE FROM ACTOR SEAT SCANNING THE CENTER DRAW PILE ==================== */}
          {cinematic.type === 'radar' && (
            <g>
              {/* X-Ray Laser Cone from Actor Seat to Center Draw Pile */}
              <polygon
                points={`${actorSeat.x},${actorSeat.y} ${DRAW_PILE_COORD.x - 95},${DRAW_PILE_COORD.y - 55} ${DRAW_PILE_COORD.x + 95},${DRAW_PILE_COORD.y + 55}`}
                fill="#00f5d4"
                opacity="0.22"
              />
              <line
                x1={actorSeat.x}
                y1={actorSeat.y}
                x2={DRAW_PILE_COORD.x}
                y2={DRAW_PILE_COORD.y}
                stroke="#f15bb5"
                strokeWidth="6"
                strokeDasharray="12 8"
              >
                <animate attributeName="stroke-dashoffset" values="20;0" dur="0.35s" repeatCount="indefinite" />
              </line>
              {/* 3 Holographic Cards Floating Over the Center Draw Pile */}
              <g transform={`translate(${DRAW_PILE_COORD.x}, ${DRAW_PILE_COORD.y})`}>
                <circle r="78" fill="none" stroke="#00f5d4" strokeWidth="4" strokeDasharray="10 8">
                  <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="3s" repeatCount="indefinite" />
                </circle>
                <rect x="-64" y="-32" width="36" height="52" rx="6" fill="#fff9ec" stroke="#161426" strokeWidth="3.5" transform="rotate(-12 -46 -6)" />
                <rect x="-18" y="-38" width="36" height="52" rx="6" fill="#ffca3a" stroke="#161426" strokeWidth="3.5" />
                <rect x="28" y="-32" width="36" height="52" rx="6" fill="#ff595e" stroke="#161426" strokeWidth="3.5" transform="rotate(12 46 -6)" />
                {/* Sweeping Neon Scan Bar */}
                <rect x="-75" y="-42" width="150" height="8" rx="4" fill="#00f5d4" stroke="#161426" strokeWidth="2">
                  <animate attributeName="y" values="-42;24;-42" dur="0.9s" repeatCount="indefinite" />
                </rect>
              </g>
            </g>
          )}

          {/* ==================== SHUFFLE: TORNADO VORTEX SPINNING 8 FLYING CARDS OVER THE CENTER DECK ==================== */}
          {cinematic.type === 'shuffle' && (
            <g transform={`translate(${DRAW_PILE_COORD.x}, ${DRAW_PILE_COORD.y})`}>
              <circle r="95" fill="none" stroke="#14b8a6" strokeWidth="6" strokeDasharray="18 12">
                <animate attributeName="r" values="40;115;40" dur="0.9s" repeatCount="indefinite" />
              </circle>
              <g>
                <animateTransform
                  attributeName="transform"
                  type="rotate"
                  from="0"
                  to="360"
                  dur="0.75s"
                  repeatCount="indefinite"
                />
                {[0, 60, 120, 180, 240, 300].map((deg, idx) => (
                  <g key={deg} transform={`rotate(${deg}) translate(0, -68)`}>
                    <rect
                      x="-18"
                      y="-26"
                      width="36"
                      height="52"
                      rx="6"
                      fill={idx % 2 === 0 ? '#ffca3a' : '#00bbf9'}
                      stroke="#161426"
                      strokeWidth="3.5"
                    />
                  </g>
                ))}
              </g>
            </g>
          )}

          {/* ==================== BLOCK: GIANT RED OCTAGONAL STAMP SLAMMING FROM BLOCKER SEAT ONTO CENTER PILE ==================== */}
          {cinematic.type === 'block' && (
            <g>
              <line
                x1={actorSeat.x}
                y1={actorSeat.y}
                x2={DISCARD_PILE_COORD.x}
                y2={DISCARD_PILE_COORD.y}
                stroke="#ef4444"
                strokeWidth="10"
                strokeDasharray="14 8"
              />
              <g transform={`translate(${DISCARD_PILE_COORD.x}, ${DISCARD_PILE_COORD.y})`}>
                <circle r="90" fill="none" stroke="#ef4444" strokeWidth="7">
                  <animate attributeName="r" values="30;110" dur="0.65s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="1;0" dur="0.65s" repeatCount="indefinite" />
                </circle>
                <g>
                  <animateTransform
                    attributeName="transform"
                    type="scale"
                    values="1.5;0.95;1.08;1"
                    dur="0.55s"
                    repeatCount="indefinite"
                  />
                  <polygon
                    points="-28,-64 28,-64 64,-28 64,28 28,64 -28,64 -64,28 -64,-28"
                    fill="#ef4444"
                    stroke="#161426"
                    strokeWidth="5"
                  />
                  <circle r="36" fill="#fff9ec" stroke="#161426" strokeWidth="4" />
                  <line x1="-22" y1="-22" x2="22" y2="22" stroke="#ef4444" strokeWidth="10" strokeLinecap="round" />
                  <line x1="22" y1="-22" x2="-22" y2="22" stroke="#ef4444" strokeWidth="10" strokeLinecap="round" />
                </g>
              </g>
            </g>
          )}

          {/* ==================== BOMB DRAWN: LIT DYNAMITE FLYING OUT OF CENTER DECK -> VICTIM SEAT ==================== */}
          {cinematic.type === 'bomb' && (
            <g>
              <line
                x1={DRAW_PILE_COORD.x}
                y1={DRAW_PILE_COORD.y}
                x2={actorSeat.x}
                y2={actorSeat.y}
                stroke="#e11d48"
                strokeWidth="8"
                strokeDasharray="12 8"
              />
              <g>
                <animateTransform
                  attributeName="transform"
                  type="translate"
                  values={`${DRAW_PILE_COORD.x},${DRAW_PILE_COORD.y}; ${actorSeat.x},${actorSeat.y}`}
                  dur="0.85s"
                  repeatCount="indefinite"
                />
                <circle r="48" fill="#ffe4e6" stroke="#e11d48" strokeWidth="5" />
                <rect x="-24" y="-18" width="48" height="36" rx="8" fill="#e11d48" stroke="#161426" strokeWidth="4" />
                <rect x="-14" y="-10" width="28" height="20" rx="4" fill="#fef08a" stroke="#161426" strokeWidth="2.5" />
                <text x="0" y="4" textAnchor="middle" fill="#e11d48" fontSize="12" fontWeight="900">
                  00:01
                </text>
              </g>
            </g>
          )}

          {/* ==================== DEFUSE: GIANT WIRE CUTTERS SNIPPING THE RED FUSE ON THE TABLE ==================== */}
          {cinematic.type === 'defuse' && (
            <g transform={`translate(${TABLE_CENTER_COORD.x}, ${TABLE_CENTER_COORD.y})`}>
              <circle r="85" fill="#22c55e" opacity="0.25">
                <animate attributeName="r" values="40;110;40" dur="0.8s" repeatCount="indefinite" />
              </circle>
              <line x1="-110" y1="0" x2="-20" y2="0" stroke="#e11d48" strokeWidth="10" strokeLinecap="round" />
              <line x1="20" y1="0" x2="110" y2="0" stroke="#e11d48" strokeWidth="10" strokeLinecap="round" strokeDasharray="12 10" />
              <circle r="44" fill="#22c55e" stroke="#161426" strokeWidth="5" />
              <path
                d="M -18 2 L -5 15 L 22 -14"
                fill="none"
                stroke="#ffffff"
                strokeWidth="9"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>
          )}

          {/* ==================== PLANTED: STEALTH BOMB CARD SLIDING FROM ACTOR SEAT -> INTO DRAW PILE ==================== */}
          {cinematic.type === 'planted' && (
            <g>
              <g>
                <animateTransform
                  attributeName="transform"
                  type="translate"
                  values={`${actorSeat.x},${actorSeat.y}; ${DRAW_PILE_COORD.x},${DRAW_PILE_COORD.y}`}
                  dur="0.95s"
                  repeatCount="indefinite"
                />
                <rect
                  x="-26"
                  y="-36"
                  width="52"
                  height="72"
                  rx="8"
                  fill="#161426"
                  stroke="#e11d48"
                  strokeWidth="4"
                />
                <circle cx="-9" cy="-4" r="5" fill="#ffca3a" />
                <circle cx="9" cy="-4" r="5" fill="#ffca3a" />
              </g>
            </g>
          )}

          {/* ==================== EXPLODED: MASSIVE COMIC FIREBALL AT VICTIM'S TABLE SEAT ==================== */}
          {cinematic.type === 'exploded' && (
            <g transform={`translate(${actorSeat.x}, ${actorSeat.y})`}>
              <circle r="90" fill="none" stroke="#ffca3a" strokeWidth="8">
                <animate attributeName="r" values="25;135" dur="0.7s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="1;0" dur="0.7s" repeatCount="indefinite" />
              </circle>
              <polygon
                points="0,-75 18,-32 62,-52 38,-10 78,12 34,26 48,68 4,42 -28,72 -26,28 -74,26 -38,-4 -64,-44 -18,-28"
                fill="#e11d48"
                stroke="#161426"
                strokeWidth="5"
              >
                <animateTransform
                  attributeName="transform"
                  type="scale"
                  values="0.85;1.15;0.85"
                  dur="0.45s"
                  repeatCount="indefinite"
                />
              </polygon>
              <circle r="28" fill="#ffca3a" stroke="#161426" strokeWidth="4" />
              <text x="0" y="6" textAnchor="middle" fill="#161426" fontSize="16" fontWeight="900">
                {ar ? 'بوووم!' : 'BOOM!'}
              </text>
            </g>
          )}
        </g>
      )}
    </svg>
  );
};

/* ============================================================================
 * MAIN BOOM DECK ("الفتيل الملعون") FULL-SCREEN TABLETOP ARENA COMPONENT
 * ========================================================================== */
export const BoomDeckGame: React.FC<BoomDeckGameProps> = ({
  gameData,
  players,
  myPlayerId,
  isHost,
  isPassAndPlay,
  lang,
  onUpdateGameData,
  onStartNewRound,
}) => {
  const ar = lang === 'ar';
  const arenaRef = useRef<HTMLDivElement>(null);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [pickingMagnetTarget, setPickingMagnetTarget] = useState(false);
  const [passAndPlayHandUnlocked, setPassAndPlayHandUnlocked] = useState(false);
  const [showQuickRules, setShowQuickRules] = useState(false);
  const [counterSecondsLeft, setCounterSecondsLeft] = useState<number>(4);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [activeCinematic, setActiveCinematic] =
    useState<BoomCinematicEvent | null>(null);

  // Active viewer: in Pass & Play, the person holding the device is the current turn player
  const activeViewerId = isPassAndPlay ? gameData.turnPlayerId : myPlayerId;
  const myHand = gameData.hands?.[activeViewerId] || [];
  const isMyTurn = activeViewerId === gameData.turnPlayerId;
  const isAmAlive = (gameData.alivePlayerIds || []).includes(activeViewerId);

  // Compute exact 2D seat coordinates around the oval tabletop
  const seatCoords = computeTableSeatCoords(players, activeViewerId);

  // Trigger live in-arena animation for 2.6 seconds whenever `lastCinematic` updates
  useEffect(() => {
    if (!gameData.lastCinematic) return;
    setActiveCinematic(gameData.lastCinematic);
    const timer = setTimeout(() => {
      setActiveCinematic((prev) =>
        prev?.id === gameData.lastCinematic?.id ? null : prev
      );
    }, 2600);
    return () => clearTimeout(timer);
  }, [gameData.lastCinematic?.id]);

  // Reset Pass-and-Play privacy lock when turn changes
  useEffect(() => {
    setPassAndPlayHandUnlocked(false);
    setSelectedCardId(null);
    setPickingMagnetTarget(false);
  }, [gameData.turnPlayerId, gameData.phase]);

  // Countdown for the 4-second Counter ("بلوك!") Window
  useEffect(() => {
    if (gameData.phase !== 'counter_window' || !gameData.pendingAction) return;
    setCounterSecondsLeft(4);
    const interval = setInterval(() => {
      setCounterSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [
    gameData.phase,
    gameData.pendingAction?.id,
    gameData.pendingAction?.blockedCount,
  ]);

  // Auto-resolve Counter Window when timer hits 0
  useEffect(() => {
    if (
      gameData.phase === 'counter_window' &&
      counterSecondsLeft === 0 &&
      gameData.pendingAction &&
      (isHost || isPassAndPlay || myPlayerId === gameData.pendingAction.actorId)
    ) {
      resolvePendingAction();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [counterSecondsLeft, gameData.phase]);

  const toggleFullScreenArena = () => {
    setIsFullscreen((prev) => !prev);
  };

  const getPlayerName = (pid?: string | null) =>
    players.find((p) => p.id === pid)?.name || (ar ? 'لاعب' : 'Player');

  const getPlayerIndex = (pid?: string | null) =>
    Math.max(0, players.findIndex((p) => p.id === pid));

  const getNextAlivePlayerId = (
    fromPlayerId: string,
    aliveIds: string[],
    dir: 1 | -1
  ): string => {
    if (aliveIds.length === 0) return fromPlayerId;
    const orderedIds = players
      .map((p) => p.id)
      .filter((id) => aliveIds.includes(id));
    if (orderedIds.length === 0) return aliveIds[0];
    const idx = orderedIds.indexOf(fromPlayerId);
    if (idx === -1) return orderedIds[0];
    const nextIdx = (idx + dir + orderedIds.length) % orderedIds.length;
    return orderedIds[nextIdx];
  };

  // Calculate live Bomb Risk % in the Draw Pile!
  const totalDeckCount = gameData.deck?.length || 0;
  const bombsInDeckCount = (gameData.deck || []).filter(
    (c) => c.type === 'bomb'
  ).length;
  const bombRiskPercent =
    totalDeckCount > 0
      ? Math.round((bombsInDeckCount / totalDeckCount) * 100)
      : 0;

  const myBlockCard = myHand.find((c) => c.type === 'block');

  // Play an action card from hand -> starts the dramatic Counter Window (or target selection for Magnet)
  const handleInitiateCardPlay = (card: BoomCard, targetPlayerId?: string) => {
    if (gameData.phase !== 'playing' || !isMyTurn) return;
    if (
      card.type === 'bomb' ||
      card.type === 'defuse' ||
      card.type === 'block'
    )
      return;

    if (card.type === 'magnet' && !targetPlayerId) {
      setSelectedCardId(card.id);
      setPickingMagnetTarget(true);
      return;
    }

    const updatedHand = (gameData.hands[gameData.turnPlayerId] || []).filter(
      (c) => c.id !== card.id
    );
    const actorName = getPlayerName(gameData.turnPlayerId);
    const computedTargetId =
      targetPlayerId ||
      (card.type === 'attack' || card.type === 'skip'
        ? getNextAlivePlayerId(
            gameData.turnPlayerId,
            gameData.alivePlayerIds,
            gameData.direction
          )
        : undefined);
    const targetName = targetPlayerId ? getPlayerName(targetPlayerId) : '';
    const meta = BOOM_CARD_META[card.type];

    const pending: BoomPendingAction = {
      id: `act_${Date.now()}`,
      actorId: gameData.turnPlayerId,
      cardType: card.type,
      targetPlayerId: computedTargetId,
      blockedCount: 0,
      createdAt: Date.now(),
    };

    const nextState: BoomDeckGameState = {
      ...gameData,
      phase: 'counter_window',
      hands: {
        ...gameData.hands,
        [gameData.turnPlayerId]: updatedHand,
      },
      discardPile: [...(gameData.discardPile || []), card],
      pendingAction: pending,
      radarPeekPlayerId: null,
      radarCards: [],
      lastCinematic: {
        id: `cin_${Date.now()}`,
        type: card.type,
        actorId: gameData.turnPlayerId,
        targetId: computedTargetId,
        subtitle_ar: targetPlayerId
          ? `${actorName} صوّب «${meta.name_ar}» نحو ${targetName}!`
          : `${actorName} أطلق قدرة «${meta.name_ar}» عالطاولة!`,
        subtitle_en: targetPlayerId
          ? `${actorName} aimed "${meta.name_en}" at ${targetName}!`
          : `${actorName} unleashed "${meta.name_en}" on the table!`,
        timestamp: Date.now(),
      },
      actionLog: [
        {
          ar: `${actorName} لعب كرت «${meta.name_ar}»${
            targetName ? ` ضد ${targetName}` : ''
          }!`,
          en: `${actorName} played "${meta.name_en}"${
            targetName ? ` on ${targetName}` : ''
          }!`,
        },
        ...(gameData.actionLog || []).slice(0, 7),
      ],
    };

    setSelectedCardId(null);
    setPickingMagnetTarget(false);
    onUpdateGameData(nextState);
  };

  // Slam a BLOCK ("بلوك!") card during the Counter Window!
  const handleSlamBlockCard = (blockerPlayerId: string) => {
    if (gameData.phase !== 'counter_window' || !gameData.pendingAction) return;
    const blockerHand = gameData.hands?.[blockerPlayerId] || [];
    const blockCard = blockerHand.find((c) => c.type === 'block');
    if (!blockCard) return;

    const nextBlockerHand = blockerHand.filter((c) => c.id !== blockCard.id);
    const newBlockedCount = gameData.pendingAction.blockedCount + 1;
    const isNowCancelled = newBlockedCount % 2 === 1;
    const blockerName = getPlayerName(blockerPlayerId);
    const actorName = getPlayerName(gameData.pendingAction.actorId);

    const nextState: BoomDeckGameState = {
      ...gameData,
      hands: {
        ...gameData.hands,
        [blockerPlayerId]: nextBlockerHand,
      },
      discardPile: [...(gameData.discardPile || []), blockCard],
      pendingAction: {
        ...gameData.pendingAction,
        blockedCount: newBlockedCount,
        lastBlockerId: blockerPlayerId,
      },
      lastCinematic: {
        id: `cin_block_${Date.now()}`,
        type: 'block',
        actorId: blockerPlayerId,
        targetId: gameData.pendingAction.actorId,
        subtitle_ar: isNowCancelled
          ? `${blockerName} كبس ختم «بلوك!» وأبطل حركة ${actorName}!`
          : `${blockerName} كبس «بلوك ع البلوك!» ورجّع الحركة تشتغل!`,
        subtitle_en: isNowCancelled
          ? `${blockerName} slammed BLOCK and cancelled ${actorName}’s move!`
          : `${blockerName} double-blocked — the move is BACK ON!`,
        timestamp: Date.now(),
      },
      actionLog: [
        {
          ar: isNowCancelled
            ? `${blockerName} اعترض بكرت «بلوك!» وألغى الحركة!`
            : `${blockerName} ردّ بكرت «بلوك ع البلوك» وأعاد تفعيل الحركة!`,
          en: isNowCancelled
            ? `${blockerName} slammed BLOCK to cancel the card!`
            : `${blockerName} played BLOCK on the BLOCK!`,
        },
        ...(gameData.actionLog || []).slice(0, 7),
      ],
    };

    onUpdateGameData(nextState);
  };

  // Execute (or cancel if blocked) the pending action after the Counter Window
  const resolvePendingAction = () => {
    const pending = gameData.pendingAction;
    if (!pending) return;

    const isCancelled = pending.blockedCount % 2 === 1;
    const actorName = getPlayerName(pending.actorId);

    if (isCancelled) {
      onUpdateGameData({
        ...gameData,
        phase: 'playing',
        pendingAction: null,
        actionLog: [
          {
            ar: `أُبطلت حركة ${actorName} بالبلوك! ما زال الدور عند ${actorName}.`,
            en: `${actorName}’s card was blocked! It is still ${actorName}’s turn.`,
          },
          ...(gameData.actionLog || []).slice(0, 7),
        ],
      });
      return;
    }

    const cType = pending.cardType;
    let nextDeck = [...(gameData.deck || [])];
    let nextHands = { ...gameData.hands };
    let nextTurnPlayerId = gameData.turnPlayerId;
    let nextTurnsRemaining = gameData.turnsRemaining;
    let nextDirection = gameData.direction;
    let nextRadarPlayerId: string | null = null;
    let nextRadarCards: BoomCard[] = [];
    let logAr = '';
    let logEn = '';

    if (cType === 'skip') {
      if (nextTurnsRemaining > 1) {
        nextTurnsRemaining -= 1;
        logAr = `${actorName} تزحلق من سحبة واحدة! باقي عليه (${nextTurnsRemaining}) سحبة.`;
        logEn = `${actorName} skipped 1 draw! (${nextTurnsRemaining} left).`;
      } else {
        nextTurnPlayerId = getNextAlivePlayerId(
          gameData.turnPlayerId,
          gameData.alivePlayerIds,
          nextDirection
        );
        nextTurnsRemaining = 1;
        logAr = `${actorName} تزحلق بسلام بدون سحب! الدور انتقل إلى ${getPlayerName(
          nextTurnPlayerId
        )}.`;
        logEn = `${actorName} skipped drawing! Turn passed to ${getPlayerName(
          nextTurnPlayerId
        )}.`;
      }
    } else if (cType === 'attack') {
      nextTurnPlayerId = getNextAlivePlayerId(
        gameData.turnPlayerId,
        gameData.alivePlayerIds,
        nextDirection
      );
      nextTurnsRemaining =
        gameData.turnsRemaining > 1 ? gameData.turnsRemaining + 2 : 2;
      logAr = `${actorName} دبل المصيبة! ${getPlayerName(
        nextTurnPlayerId
      )} مجبور يسحب (${nextTurnsRemaining}) مرات!`;
      logEn = `${actorName} struck! ${getPlayerName(
        nextTurnPlayerId
      )} must take ${nextTurnsRemaining} turns!`;
    } else if (cType === 'reverse') {
      nextDirection = (gameData.direction === 1 ? -1 : 1) as 1 | -1;
      if (nextTurnsRemaining > 1) {
        nextTurnsRemaining -= 1;
        logAr = `${actorName} عكس اتجاه الطاولة وتخلص من سحبة واحدة!`;
        logEn = `${actorName} reversed direction and cleared 1 draw!`;
      } else {
        nextTurnPlayerId = getNextAlivePlayerId(
          gameData.turnPlayerId,
          gameData.alivePlayerIds,
          nextDirection
        );
        nextTurnsRemaining = 1;
        logAr = `${actorName} عكس اتجاه السير ونجا من السحب! الدور عند ${getPlayerName(
          nextTurnPlayerId
        )}.`;
        logEn = `${actorName} reversed direction! Turn is now ${getPlayerName(
          nextTurnPlayerId
        )}’s.`;
      }
    } else if (cType === 'radar') {
      nextRadarPlayerId = pending.actorId;
      nextRadarCards = nextDeck.slice(0, 3);
      logAr = `${actorName} فحص أول ${nextRadarCards.length} كروت بالكومة بالرادار السري!`;
      logEn = `${actorName} secretly scanned the top ${nextRadarCards.length} cards!`;
    } else if (cType === 'shuffle') {
      nextDeck = shuffleArray(nextDeck);
      logAr = `${actorName} خلط كومة السحب بالكامل بإعصار الخلط!`;
      logEn = `${actorName} shuffled the entire Draw Pile!`;
    } else if (cType === 'magnet') {
      const victimId =
        pending.targetPlayerId ||
        gameData.alivePlayerIds.find((id) => id !== pending.actorId);
      const victimHand = victimId ? [...(nextHands[victimId] || [])] : [];
      if (victimId && victimHand.length > 0) {
        const randIdx = Math.floor(Math.random() * victimHand.length);
        const [stolenCard] = victimHand.splice(randIdx, 1);
        nextHands = {
          ...nextHands,
          [victimId]: victimHand,
          [pending.actorId]: [
            ...(nextHands[pending.actorId] || []),
            stolenCard,
          ],
        };
        logAr = `${actorName} سرق كرتاً عشوائياً بالمغناطيس من يد ${getPlayerName(
          victimId
        )}!`;
        logEn = `${actorName} magnetized a random card from ${getPlayerName(
          victimId
        )}’s hand!`;
      } else {
        logAr = `${actorName} شغل المغناطيس لكن يد الخصم فارغة!`;
        logEn = `${actorName} used Magnet, but target had no cards!`;
      }
    }

    onUpdateGameData({
      ...gameData,
      phase: 'playing',
      deck: nextDeck,
      hands: nextHands,
      turnPlayerId: nextTurnPlayerId,
      turnsRemaining: nextTurnsRemaining,
      direction: nextDirection,
      pendingAction: null,
      radarPeekPlayerId: nextRadarPlayerId,
      radarCards: nextRadarCards,
      lastCinematic: {
        id: `cin_res_${Date.now()}`,
        type: cType,
        actorId: pending.actorId,
        targetId: pending.targetPlayerId,
        subtitle_ar: logAr,
        subtitle_en: logEn,
        timestamp: Date.now(),
      },
      actionLog: [
        { ar: logAr, en: logEn },
        ...(gameData.actionLog || []).slice(0, 7),
      ],
    });
  };

  // Draw the top card from the Draw Pile to end 1 turn!
  const handleDrawCard = () => {
    if (gameData.phase !== 'playing' || !isMyTurn) return;
    const currentDeck = [...(gameData.deck || [])];
    if (currentDeck.length === 0) return;

    const topCard = currentDeck.shift()!;
    const drawerId = gameData.turnPlayerId;
    const drawerName = getPlayerName(drawerId);

    if (topCard.type === 'bomb') {
      onUpdateGameData({
        ...gameData,
        phase: 'bomb_crisis',
        deck: currentDeck,
        crisisPlayerId: drawerId,
        radarPeekPlayerId: null,
        radarCards: [],
        lastCinematic: {
          id: `cin_bomb_${Date.now()}`,
          type: 'bomb',
          actorId: drawerId,
          subtitle_ar: `إنذار أحمر! ${drawerName} سحب كرت «الديناميت المشتعل»!`,
          subtitle_en: `RED ALERT! ${drawerName} drew a LIT DYNAMITE!`,
          timestamp: Date.now(),
        },
        actionLog: [
          {
            ar: `كارثة! ${drawerName} سحب «الديناميت المشتعل» من الكومة!`,
            en: `DANGER! ${drawerName} drew a LIT DYNAMITE from the pile!`,
          },
          ...(gameData.actionLog || []).slice(0, 7),
        ],
      });
      return;
    }

    const updatedHand = [...(gameData.hands[drawerId] || []), topCard];
    let nextTurnPlayerId = drawerId;
    let nextTurnsRemaining = gameData.turnsRemaining;

    if (nextTurnsRemaining > 1) {
      nextTurnsRemaining -= 1;
    } else {
      nextTurnPlayerId = getNextAlivePlayerId(
        drawerId,
        gameData.alivePlayerIds,
        gameData.direction
      );
      nextTurnsRemaining = 1;
    }

    onUpdateGameData({
      ...gameData,
      deck: currentDeck,
      hands: {
        ...gameData.hands,
        [drawerId]: updatedHand,
      },
      turnPlayerId: nextTurnPlayerId,
      turnsRemaining: nextTurnsRemaining,
      radarPeekPlayerId: null,
      radarCards: [],
      actionLog: [
        {
          ar:
            nextTurnPlayerId === drawerId
              ? `${drawerName} سحب كرتاً آمناً! باقي عليه (${nextTurnsRemaining}) سحبة.`
              : `${drawerName} سحب كرتاً آمناً ونجا! الدور الآن عند ${getPlayerName(
                  nextTurnPlayerId
                )}.`,
          en:
            nextTurnPlayerId === drawerId
              ? `${drawerName} drew safe! (${nextTurnsRemaining} draw left).`
              : `${drawerName} drew a safe card! Now it’s ${getPlayerName(
                  nextTurnPlayerId
                )}’s turn.`,
        },
        ...(gameData.actionLog || []).slice(0, 7),
      ],
    });
  };

  // Cut the Bomb Fuse using Wire Cutters (Defuse)!
  const handleDefuseBomb = () => {
    const crisisId = gameData.crisisPlayerId || gameData.turnPlayerId;
    const hand = [...(gameData.hands[crisisId] || [])];
    const defuseIdx = hand.findIndex((c) => c.type === 'defuse');
    if (defuseIdx === -1) return;

    const [usedDefuse] = hand.splice(defuseIdx, 1);
    const survivorName = getPlayerName(crisisId);

    onUpdateGameData({
      ...gameData,
      phase: 'planting_bomb',
      hands: {
        ...gameData.hands,
        [crisisId]: hand,
      },
      discardPile: [...(gameData.discardPile || []), usedDefuse],
      lastCinematic: {
        id: `cin_defuse_${Date.now()}`,
        type: 'defuse',
        actorId: crisisId,
        subtitle_ar: `${survivorName} قصّ السلك بمقص الأسلاك ونجا من الانفجار!`,
        subtitle_en: `${survivorName} snipped the red wire and survived!`,
        timestamp: Date.now(),
      },
      actionLog: [
        {
          ar: `${survivorName} فكّك الديناميت بمقص الأسلاك! الآن يزرع اللغم بالكومة بالسر...`,
          en: `${survivorName} defused the bomb and is secretly planting it back in the deck...`,
        },
        ...(gameData.actionLog || []).slice(0, 7),
      ],
    });
  };

  // Re-plant the defused bomb at a secret position in the Draw Pile!
  const handlePlantBombAt = (
    positionChoice:
      | 'top_0'
      | 'top_1'
      | 'top_2'
      | 'middle'
      | 'bottom'
      | 'random'
  ) => {
    const planterId = gameData.crisisPlayerId || gameData.turnPlayerId;
    const planterName = getPlayerName(planterId);
    const nextDeck = [...(gameData.deck || [])];
    const newBomb: BoomCard = {
      id: `bc_replanted_${Date.now()}`,
      type: 'bomb',
    };

    let insertIdx = 0;
    if (positionChoice === 'top_0') insertIdx = 0;
    else if (positionChoice === 'top_1')
      insertIdx = Math.min(1, nextDeck.length);
    else if (positionChoice === 'top_2')
      insertIdx = Math.min(2, nextDeck.length);
    else if (positionChoice === 'middle')
      insertIdx = Math.floor(nextDeck.length / 2);
    else if (positionChoice === 'bottom') insertIdx = nextDeck.length;
    else insertIdx = Math.floor(Math.random() * (nextDeck.length + 1));

    nextDeck.splice(insertIdx, 0, newBomb);

    let nextTurnPlayerId = planterId;
    let nextTurnsRemaining = gameData.turnsRemaining;
    if (nextTurnsRemaining > 1) {
      nextTurnsRemaining -= 1;
    } else {
      nextTurnPlayerId = getNextAlivePlayerId(
        planterId,
        gameData.alivePlayerIds,
        gameData.direction
      );
      nextTurnsRemaining = 1;
    }

    onUpdateGameData({
      ...gameData,
      phase: 'playing',
      deck: nextDeck,
      crisisPlayerId: null,
      turnPlayerId: nextTurnPlayerId,
      turnsRemaining: nextTurnsRemaining,
      lastCinematic: {
        id: `cin_plant_${Date.now()}`,
        type: 'planted',
        actorId: planterId,
        subtitle_ar: `${planterName} زرع الديناميت بمكان سري داخل الكومة!`,
        subtitle_en: `${planterName} secretly planted the Dynamite back into the deck!`,
        timestamp: Date.now(),
      },
      actionLog: [
        {
          ar: `${planterName} خبّأ القنبلة بالكومة بالسر! الدور الآن عند ${getPlayerName(
            nextTurnPlayerId
          )}.`,
          en: `${planterName} hid the bomb in the deck! Turn is now ${getPlayerName(
            nextTurnPlayerId
          )}’s.`,
        },
        ...(gameData.actionLog || []).slice(0, 7),
      ],
    });
  };

  // Player has NO Wire Cutters -> BOOM! Eliminated!
  const handleConfirmExplosion = () => {
    const victimId = gameData.crisisPlayerId || gameData.turnPlayerId;
    const victimName = getPlayerName(victimId);
    const nextAlive = (gameData.alivePlayerIds || []).filter(
      (id) => id !== victimId
    );
    const nextEliminated = [...(gameData.eliminatedPlayerIds || []), victimId];

    if (nextAlive.length <= 1) {
      const champId = nextAlive[0] || victimId;
      const awards: Record<string, number> = { [champId]: 4 };
      nextEliminated.slice(-1).forEach((runnerUpId) => {
        if (runnerUpId !== champId) awards[runnerUpId] = 1;
      });

      onUpdateGameData(
        {
          ...gameData,
          phase: 'round_over',
          alivePlayerIds: nextAlive,
          eliminatedPlayerIds: nextEliminated,
          crisisPlayerId: null,
          winnerId: champId,
          lastCinematic: {
            id: `cin_win_${Date.now()}`,
            type: 'exploded',
            actorId: victimId,
            subtitle_ar: `انفجر الديناميت بـ ${victimName}! الفائز الناجي الأخير هو ${getPlayerName(
              champId
            )}!`,
            subtitle_en: `${victimName} exploded! Last survivor ${getPlayerName(
              champId
            )} wins!`,
            timestamp: Date.now(),
          },
          actionLog: [
            {
              ar: `انفجر ${victimName} وتُوّج ${getPlayerName(
                champId
              )} بطلاً للفتيل الملعون (+4 نقاط)!`,
              en: `${victimName} blew up! ${getPlayerName(
                champId
              )} is the Last Survivor (+4 pts)!`,
            },
            ...(gameData.actionLog || []).slice(0, 7),
          ],
        },
        awards
      );
      return;
    }

    const nextTurnPlayerId = getNextAlivePlayerId(
      victimId,
      nextAlive,
      gameData.direction
    );

    onUpdateGameData({
      ...gameData,
      phase: 'playing',
      alivePlayerIds: nextAlive,
      eliminatedPlayerIds: nextEliminated,
      crisisPlayerId: null,
      turnPlayerId: nextTurnPlayerId,
      turnsRemaining: 1,
      lastCinematic: {
        id: `cin_exp_${Date.now()}`,
        type: 'exploded',
        actorId: victimId,
        subtitle_ar: `بوووم! انفجر الديناميت بـ ${victimName} وخرج من الجولة!`,
        subtitle_en: `KABOOM! ${victimName} had no Wire Cutters and blew up!`,
        timestamp: Date.now(),
      },
      actionLog: [
        {
          ar: `انفجر اللغم بوجه ${victimName} وخرج! باقي ${nextAlive.length} ناجين.`,
          en: `${victimName} exploded! ${nextAlive.length} survivors remain.`,
        },
        ...(gameData.actionLog || []).slice(0, 7),
      ],
    });
  };

  const selectedCard = myHand.find((c) => c.id === selectedCardId) || null;
  const crisisPlayerId = gameData.crisisPlayerId || gameData.turnPlayerId;
  const crisisHand = gameData.hands?.[crisisPlayerId] || [];
  const crisisHasDefuse = crisisHand.some((c) => c.type === 'defuse');
  const isCrisisMine = activeViewerId === crisisPlayerId;

  // Separate rivals (seated around upper/side perimeter of the table) from active bottom viewer
  const bottomIdx = Math.max(
    0,
    players.findIndex((p) => p.id === activeViewerId)
  );
  const rotatedPlayers = [
    ...players.slice(bottomIdx),
    ...players.slice(0, bottomIdx),
  ];
  const bottomPlayer = rotatedPlayers[0] || players[0];
  const rivalPlayers = rotatedPlayers.slice(1);

  return (
    <div
      ref={arenaRef}
      className={`select-none transition-all duration-300 ${
        isFullscreen
          ? 'fixed inset-0 z-50 w-screen h-screen overflow-y-auto bg-[#0c0a18] p-2 sm:p-4 flex flex-col justify-between'
          : 'w-full space-y-3'
      }`}
    >
      {/* ====================================================================
          1. COMPACT BUNKER CONTROL BAR (With Fullscreen Arena Toggle + 10s Guide)
         ==================================================================== */}
      <div className="rounded-3xl border-4 border-[#161426] bg-[#191636] px-4 py-2.5 shadow-[0_6px_0_#161426] flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[#ffe4e6] border-3 border-[#161426] shadow-[0_3px_0_#161426] flex items-center justify-center shrink-0">
            <PartyGameSvgIcon gameId="boomdeck" className="w-9 h-9" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-white">
                {ar ? 'طاولة الفتيل الملعون' : 'Boom Deck Bunker Table'}
              </h2>
              <span className="cartoon-badge bg-[#ffca3a] text-[#161426] px-2.5 py-0.5 text-[11px]">
                {ar ? `الجولة ${gameData.round}` : `Round ${gameData.round}`}
              </span>
              <span className="cartoon-badge bg-[#8ac926] text-[#161426] px-2.5 py-0.5 text-[11px] hidden sm:inline-flex">
                {ar
                  ? `الناجون: ${gameData.alivePlayerIds.length}/${players.length}`
                  : `Alive: ${gameData.alivePlayerIds.length}/${players.length}`}
              </span>
            </div>
            <p className="text-[11px] font-bold text-white/75 hidden md:block">
              {ar
                ? 'الجميع جالسون حول الطاولة! العب كرت قدرة من يدك أو اسحب كرتاً من الكومة بالوسط لإنهاء دورك.'
                : 'Everyone is seated around the felt table! Play an ability card or draw 1 card from the center pile.'}
            </p>
          </div>
        </div>

        {/* Live Action Ticker in Center of Top Bar */}
        {gameData.actionLog?.[0] && (
          <div className="hidden xl:flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-[#110e24] border-2 border-white/15 text-xs font-extrabold text-[#ffca3a] max-w-md truncate">
            <SpeakerHigh weight="fill" className="w-4 h-4 text-[#ff595e] shrink-0" />
            <span className="truncate">
              {ar ? gameData.actionLog[0].ar : gameData.actionLog[0].en}
            </span>
          </div>
        )}

        {/* Right Controls: Bombs Badge + Cheat Sheet + FULL SCREEN BUTTON */}
        <div className="flex flex-wrap items-center gap-2">
          <div
            className={`cartoon-badge px-3 py-1 text-xs flex items-center gap-1.5 ${
              bombRiskPercent >= 50
                ? 'bg-[#e11d48] text-white animate-pulse'
                : 'bg-[#25204d] text-white'
            }`}
          >
            <Flame weight="fill" className="w-4 h-4 text-[#ffca3a]" />
            <span>
              {ar
                ? `${bombsInDeckCount} قنابل (${bombRiskPercent}% خطر)`
                : `${bombsInDeckCount} Bombs (${bombRiskPercent}% Risk)`}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setShowQuickRules((v) => !v)}
            className="cartoon-btn bg-[#00bbf9] text-[#161426] px-3 py-1 text-xs flex items-center gap-1 cursor-pointer"
          >
            <Question weight="fill" className="w-4 h-4" />
            <span>{ar ? 'دليل الكروت' : 'Cards Guide'}</span>
          </button>

          <button
            type="button"
            onClick={toggleFullScreenArena}
            className="cartoon-btn bg-[#ffca3a] hover:bg-[#fde047] text-[#161426] px-3.5 py-1 text-xs flex items-center gap-1.5 cursor-pointer"
          >
            {isFullscreen ? (
              <>
                <CornersIn weight="bold" className="w-4 h-4" />
                <span>{ar ? 'تصغير الشاشة' : 'Exit Fullscreen'}</span>
              </>
            ) : (
              <>
                <CornersOut weight="bold" className="w-4 h-4" />
                <span>{ar ? 'ملء الشاشة بالكامل' : 'Full Screen Table'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Collapsible Visual Guide Drawer */}
      {showQuickRules && (
        <div className="cartoon-card p-3.5 bg-[#fff9ec] grid grid-cols-1 sm:grid-cols-3 gap-2.5 animate-in fade-in duration-150">
          <div className="p-2.5 rounded-2xl bg-[#e0f2fe] border-3 border-[#161426] flex items-center gap-2.5">
            <BoomCardIllustrationSvg type="skip" className="w-12 h-12 shrink-0" />
            <div className="text-xs">
              <div className="font-extrabold text-[#161426]">
                {ar ? '1. العب كروت قدرات (اختياري)' : '1. Play Abilities (Optional)'}
              </div>
              <div className="font-bold text-[#3f3b5c]">
                {ar
                  ? 'افحص الكومة بالرادار، اسرق بالمغناطيس، أو اهرب بتزحليقة أو تدبيل ×2!'
                  : 'Scan top 3 cards, steal a card, or skip/attack to avoid drawing!'}
              </div>
            </div>
          </div>

          <div className="p-2.5 rounded-2xl bg-[#ffe4e6] border-3 border-[#161426] flex items-center gap-2.5">
            <BoomCardIllustrationSvg type="bomb" className="w-12 h-12 shrink-0" />
            <div className="text-xs">
              <div className="font-extrabold text-[#161426]">
                {ar ? '2. اسحب كرتاً لإنهاء دورك' : '2. Draw 1 Card to End Turn'}
              </div>
              <div className="font-bold text-[#3f3b5c]">
                {ar
                  ? 'إذا ما لعبت كرت تخطي/هجوم، اضغط على الكومة بوسط الطاولة لسحب كرت.'
                  : 'Unless you skipped/attacked, tap the center Draw Pile to draw 1 card!'}
              </div>
            </div>
          </div>

          <div className="p-2.5 rounded-2xl bg-[#dcfce7] border-3 border-[#161426] flex items-center gap-2.5">
            <BoomCardIllustrationSvg type="defuse" className="w-12 h-12 shrink-0" />
            <div className="text-xs">
              <div className="font-extrabold text-[#161426]">
                {ar ? '3. قصّ السلك وازرع الفخ!' : '3. Snip Wire & Plant Trap!'}
              </div>
              <div className="font-bold text-[#3f3b5c]">
                {ar
                  ? 'مقص الأسلاك ينقذك من القنبلة ويخليك تزرعها بأي مكان بالكومة بالسر!'
                  : 'Wire Cutters save you and let you secretly hide the bomb in the deck!'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          2. THE UNIFIED 3D BOMB-BUNKER CASINO TABLETOP ARENA ("طاولة القبو الملغوم")
             - Wood & Riveted Steel Outer Rim
             - Deep Emerald/Crimson Felt Surface with Spotlight
             - Rival Players Seated Around the Perimeter with Fanned Card-Backs
             - Live SVG Spatial Choreography Layer Right on the Felt
             - 3D Stacked Draw Pile + Tilted Discard Pile in the Center
             - Active Player's Fanned Card Hand at the Bottom Edge
         ==================================================================== */}
      <div
        className={`relative w-full rounded-[42px] border-[8px] border-[#3b2314] ring-4 ring-[#161426] shadow-[0_14px_0_#161426,inset_0_0_80px_rgba(0,0,0,0.75)] overflow-hidden flex flex-col justify-between p-3 sm:p-6 ${
          isFullscreen ? 'flex-1 min-h-[82vh]' : 'min-h-[78vh]'
        } ${
          gameData.phase === 'bomb_crisis' || bombRiskPercent >= 50
            ? 'bg-[radial-gradient(ellipse_at_center,#4c1122_0%,#250914_60%,#12040a_100%)]'
            : 'bg-[radial-gradient(ellipse_at_center,#1b4d3e_0%,#0f2e24_62%,#071712_100%)]'
        }`}
      >
        {/* Decorative Inner Gold Casino Felt Rim Line */}
        <div className="pointer-events-none absolute inset-3 sm:inset-5 rounded-[34px] border-2 border-[#ffca3a]/25" />

        {/* LIVE IN-ARENA SPATIAL CHOREOGRAPHY SVG LAYER (Connects Seats & Center Deck!) */}
        <ArenaSpatialFXLayer
          seatCoords={seatCoords}
          turnPlayerId={gameData.turnPlayerId}
          direction={gameData.direction}
          cinematic={activeCinematic}
          ar={ar}
        />

        {/* FLOATING LIVE CINEMA BANNER AT TOP OF THE TABLE WHEN AN ABILITY FIRES */}
        {activeCinematic && (
          <div className="relative z-30 mx-auto max-w-xl px-4 py-2 rounded-2xl bg-[#161426]/95 border-3 border-[#ffca3a] shadow-[0_6px_0_#161426] flex items-center gap-3 animate-in zoom-in-95 duration-150">
            <div className="w-11 h-11 rounded-xl bg-[#fff9ec] border-2 border-[#161426] flex items-center justify-center shrink-0">
              {activeCinematic.type === 'exploded' ? (
                <Skull weight="fill" className="w-7 h-7 text-[#e11d48]" />
              ) : activeCinematic.type === 'planted' ? (
                <BoomCardIllustrationSvg type="bomb" className="w-9 h-9" />
              ) : (
                <BoomCardIllustrationSvg
                  type={activeCinematic.type}
                  className="w-9 h-9"
                />
              )}
            </div>
            <div className="text-xs sm:text-sm font-black text-white">
              <span className="text-[#ffca3a] block text-[10px] uppercase">
                {ar ? 'حدث مباشر على الطاولة!' : 'LIVE ON THE TABLE!'}
              </span>
              {ar ? activeCinematic.subtitle_ar : activeCinematic.subtitle_en}
            </div>
          </div>
        )}

        {/* ==================================================================
            A) UPPER / PERIMETER SEATS: RIVALS SITTING AROUND THE TABLE WITH FANNED CARDS
           ================================================================== */}
        <div className="relative z-30 flex flex-wrap items-start justify-around gap-3 pt-1">
          {rivalPlayers.map((riv) => {
            const pIdx = getPlayerIndex(riv.id);
            const isTurn = riv.id === gameData.turnPlayerId;
            const alive = (gameData.alivePlayerIds || []).includes(riv.id);
            const cardCount = (gameData.hands?.[riv.id] || []).length;
            const visibleFanCount = Math.min(7, cardCount);
            const isTargetable =
              pickingMagnetTarget &&
              alive &&
              riv.id !== gameData.turnPlayerId &&
              cardCount > 0;
            const wasJustTargeted =
              activeCinematic &&
              (activeCinematic.targetId === riv.id ||
                (activeCinematic.actorId === riv.id &&
                  activeCinematic.type === 'exploded'));

            return (
              <div
                key={riv.id}
                onClick={() => {
                  if (isTargetable && selectedCard) {
                    handleInitiateCardPlay(selectedCard, riv.id);
                  }
                }}
                className={`group flex flex-col items-center transition-all duration-300 ${
                  !alive
                    ? 'opacity-50 grayscale'
                    : isTargetable
                    ? 'cursor-pointer scale-105 -translate-y-1'
                    : isTurn
                    ? 'scale-105'
                    : ''
                } ${wasJustTargeted ? 'animate-bounce' : ''}`}
              >
                {/* Seat Station Pod (Avatar + Name + Status Badge) */}
                <div
                  className={`relative px-3.5 py-2 rounded-2xl border-3 border-[#161426] shadow-[0_5px_0_#161426] flex items-center gap-2.5 min-w-[165px] transition-all ${
                    !alive
                      ? 'bg-[#1e1b2e] text-white/60'
                      : isTargetable
                      ? 'bg-[#ffedd5] text-[#161426] ring-4 ring-[#f97316]'
                      : isTurn
                      ? 'bg-[#ffca3a] text-[#161426] ring-4 ring-[#ffca3a]/50'
                      : 'bg-[#191636]/95 text-white'
                  }`}
                >
                  <div className="relative w-11 h-11 rounded-xl border-2 border-[#161426] bg-white overflow-hidden shrink-0">
                    <CartoonAvatarSvg index={pIdx} color={riv.avatar_color} />
                    {!alive && (
                      <div className="absolute inset-0 bg-[#e11d48]/80 flex items-center justify-center">
                        <Skull weight="fill" className="w-6 h-6 text-white" />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="font-black text-xs sm:text-sm truncate">
                      {riv.name}
                    </div>
                    <div
                      className={`text-[11px] font-extrabold flex items-center gap-1 ${
                        isTurn || isTargetable
                          ? 'text-[#161426]/80'
                          : 'text-white/75'
                      }`}
                    >
                      {!alive ? (
                        <span className="text-[#ff595e]">
                          {ar ? 'انفجر وخرج!' : 'Exploded!'}
                        </span>
                      ) : (
                        <span>
                          {ar ? `${cardCount} كروت بيده` : `${cardCount} cards`}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Turn or Target Pill */}
                  {alive && isTurn && (
                    <span className="cartoon-badge bg-[#e11d48] text-white px-2 py-0.5 text-[10px] flex items-center gap-0.5">
                      {gameData.turnsRemaining > 1 ? (
                        <>
                          <Lightning
                            weight="fill"
                            className="w-3 h-3 text-[#ffca3a]"
                          />
                          <span>×{gameData.turnsRemaining}</span>
                        </>
                      ) : ar ? (
                        'دوره!'
                      ) : (
                        'TURN'
                      )}
                    </span>
                  )}

                  {isTargetable && (
                    <span className="cartoon-badge bg-[#f97316] text-white px-2 py-0.5 text-[10px] animate-pulse flex items-center gap-1">
                      <Crosshair weight="bold" className="w-3.5 h-3.5" />
                      <span>{ar ? 'اسرق منه!' : 'Steal!'}</span>
                    </span>
                  )}
                </div>

                {/* PHYSICAL FANNED CARD-BACKS HELD IN FRONT OF THIS RIVAL ON THE TABLE! */}
                {alive && cardCount > 0 && (
                  <div
                    className={`flex items-center justify-center -space-x-3.5 mt-[-6px] pt-1 transition-transform ${
                      isTargetable ? 'group-hover:scale-110' : ''
                    }`}
                  >
                    {Array.from({ length: visibleFanCount }).map((_, cIdx) => {
                      const mid = (visibleFanCount - 1) / 2;
                      const deg = (cIdx - mid) * 8;
                      const yOff = Math.abs(cIdx - mid) * 2;
                      return (
                        <div
                          key={cIdx}
                          style={{
                            transform: `rotate(${deg}deg) translateY(${yOff}px)`,
                          }}
                          className="transition-transform duration-200 drop-shadow-[0_3px_0_#161426]"
                        >
                          <BoomCardBackSvg className="w-8 h-11 sm:w-9 sm:h-13" />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ==================================================================
            B) CENTER TABLE FELT ARENA:
               - 3D Stacked Draw Pile (with Live Fuse & Risk Meter)
               - Tilted Played Cards Arena (Discard Pile)
               - Direction Ring Indicator
               - Interactive Overlays for Counter Window / Bomb Crisis / Secret Planting
           ================================================================== */}
        <div className="relative z-30 my-auto py-3 flex flex-col items-center justify-center">
          {/* MAGNET TARGETING INSTRUCTION BANNER ON THE FELT */}
          {pickingMagnetTarget && (
            <div className="mb-3 px-4 py-2 rounded-2xl bg-[#f97316] text-white border-3 border-[#161426] shadow-[0_5px_0_#161426] flex items-center gap-3 animate-bounce">
              <Magnet weight="fill" className="w-5 h-5 text-[#ffca3a]" />
              <span className="text-xs sm:text-sm font-black">
                {ar
                  ? 'اضغط على أي لاعب جالس حول الطاولة لسحب كرت عشوائي من يده بالمغناطيس!'
                  : 'Click any rival seated around the table to yank a random card from their hand!'}
              </span>
              <button
                type="button"
                onClick={() => {
                  setPickingMagnetTarget(false);
                  setSelectedCardId(null);
                }}
                className="px-2.5 py-0.5 rounded-xl bg-[#161426] text-[#ffca3a] text-xs font-extrabold cursor-pointer"
              >
                {ar ? 'إلغاء' : 'Cancel'}
              </button>
            </div>
          )}

          {/* X-RAY RADAR SECRET SCAN OVERLAY RIGHT OVER THE DECK */}
          {gameData.radarPeekPlayerId === activeViewerId &&
            gameData.radarCards &&
            gameData.radarCards.length > 0 && (
              <div className="mb-4 p-3.5 rounded-3xl bg-[#161426]/95 border-4 border-[#00f5d4] shadow-[0_8px_0_#161426] text-white space-y-2.5 max-w-lg w-full animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-center gap-2 text-xs sm:text-sm font-black text-[#00f5d4]">
                  <Broadcast weight="fill" className="w-5 h-5 text-[#f15bb5]" />
                  <span>
                    {ar
                      ? 'أشعة الرادار السرية (أنت وحدك ترى أول 3 كروت بأعلى الكومة الآن!):'
                      : 'Secret X-Ray Scan (Only YOU see the top 3 cards of the pile!):'}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2.5">
                  {gameData.radarCards.map((rc, idx) => {
                    const meta = BOOM_CARD_META[rc.type];
                    return (
                      <div
                        key={rc.id}
                        style={{ backgroundColor: meta.bg }}
                        className="p-2 rounded-2xl border-3 border-[#161426] text-center flex flex-col items-center gap-1 text-[#161426]"
                      >
                        <span className="px-2 py-0.5 rounded-full bg-[#161426] text-[#ffca3a] text-[10px] font-black">
                          {idx === 0
                            ? ar
                              ? '1. عالوجه مباشرة!'
                              : '1. Top Card!'
                            : idx === 1
                            ? ar
                              ? '2. الكرت الثاني'
                              : '2. 2nd Card'
                            : ar
                            ? '3. الكرت الثالث'
                            : '3. 3rd Card'}
                        </span>
                        <BoomCardIllustrationSvg
                          type={rc.type}
                          className="w-12 h-12"
                        />
                        <span className="font-black text-xs leading-tight">
                          {ar ? meta.name_ar : meta.name_en}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          {/* MAIN CENTER TABLE CONSOLE: 3D DRAW PILE + RISK GAUGE + DISCARD PILE */}
          {gameData.phase === 'playing' && (
            <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10">
              {/* 1. 3D STACKED DRAW PILE ON THE FELT */}
              <div className="flex flex-col items-center gap-2">
                <div className="relative">
                  {/* 3D Deck Thickness Layers Underneath */}
                  {totalDeckCount > 8 && (
                    <div className="absolute inset-0 translate-x-2.5 translate-y-2.5 rounded-3xl bg-[#881337] border-4 border-[#161426]" />
                  )}
                  {totalDeckCount > 3 && (
                    <div className="absolute inset-0 translate-x-1.5 translate-y-1.5 rounded-3xl bg-[#be123c] border-4 border-[#161426]" />
                  )}

                  <button
                    type="button"
                    disabled={!isMyTurn}
                    onClick={handleDrawCard}
                    className={`group relative w-40 h-54 sm:w-44 sm:h-58 rounded-3xl border-4 border-[#161426] p-3.5 flex flex-col items-center justify-between transition-all ${
                      isMyTurn
                        ? 'bg-gradient-to-b from-[#ff595e] via-[#e11d48] to-[#9f1239] text-white shadow-[0_8px_0_#161426] hover:-translate-y-2 cursor-pointer ring-4 ring-[#ffca3a]'
                        : 'bg-gradient-to-b from-[#334155] to-[#1e293b] text-white/80 shadow-[0_6px_0_#161426] cursor-not-allowed'
                    }`}
                  >
                    <div className="w-full flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full bg-[#161426] text-[#ffca3a] text-[11px] font-black">
                        {ar ? `${totalDeckCount} كرت` : `${totalDeckCount} left`}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-black border border-[#161426] ${
                          bombRiskPercent >= 50
                            ? 'bg-[#ffca3a] text-[#161426]'
                            : 'bg-[#161426]/80 text-white'
                        }`}
                      >
                        {bombRiskPercent}%
                      </span>
                    </div>

                    <div className="w-22 h-22 rounded-2xl bg-[#fff9ec] border-3 border-[#161426] shadow-[0_4px_0_#161426] flex items-center justify-center group-hover:scale-110 transition-transform">
                      <PartyGameSvgIcon
                        gameId="boomdeck"
                        className="w-18 h-18"
                      />
                    </div>

                    <span
                      className={`w-full py-2 rounded-xl border-2 border-[#161426] font-black text-xs text-center shadow-[0_3px_0_#161426] ${
                        isMyTurn
                          ? 'bg-[#ffca3a] text-[#161426] group-hover:bg-[#fde047]'
                          : 'bg-[#161426]/60 text-white/75'
                      }`}
                    >
                      {isMyTurn
                        ? ar
                          ? 'اسحب كرتاً (إنهاء الدور)'
                          : 'Draw Card (End Turn)'
                        : ar
                        ? 'كومة السحب الملغومة'
                        : 'Armed Draw Pile'}
                    </span>
                  </button>
                </div>
              </div>

              {/* 2. CENTER DIRECTION & TURN MULTIPLIER MEDALLION ON THE FELT */}
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="w-16 h-16 rounded-full bg-[#161426]/90 border-3 border-[#ffca3a] shadow-[0_5px_0_#161426] flex flex-col items-center justify-center text-[#ffca3a]">
                  <ArrowsClockwise
                    weight="bold"
                    className={`w-7 h-7 animate-spin ${
                      gameData.direction === -1 ? '-scale-x-100' : ''
                    }`}
                    style={{ animationDuration: '6s' }}
                  />
                  <span className="text-[9px] font-black text-white">
                    {gameData.direction === 1
                      ? ar
                        ? 'مع العقارب'
                        : 'CW'
                      : ar
                      ? 'عكس العقارب'
                      : 'CCW'}
                  </span>
                </div>

                {gameData.turnsRemaining > 1 && (
                  <div className="cartoon-badge bg-[#e11d48] text-white px-3 py-1 text-xs animate-bounce flex items-center gap-1">
                    <Lightning weight="fill" className="w-4 h-4 text-[#ffca3a]" />
                    <span>
                      {ar
                        ? `مطلوب ${gameData.turnsRemaining} سحبات!`
                        : `${gameData.turnsRemaining} Draws Left!`}
                    </span>
                  </div>
                )}
              </div>

              {/* 3. TILTED PLAYED CARDS PILE (DISCARD ARENA) */}
              <div className="flex flex-col items-center gap-2">
                {gameData.discardPile && gameData.discardPile.length > 0 ? (
                  (() => {
                    const topDiscard =
                      gameData.discardPile[gameData.discardPile.length - 1];
                    const prevDiscard =
                      gameData.discardPile.length > 1
                        ? gameData.discardPile[gameData.discardPile.length - 2]
                        : null;
                    const dMeta = BOOM_CARD_META[topDiscard.type];
                    return (
                      <div className="relative">
                        {/* Previous card peeking underneath at an angle */}
                        {prevDiscard && (
                          <div
                            style={{
                              backgroundColor:
                                BOOM_CARD_META[prevDiscard.type].bg,
                            }}
                            className="absolute inset-0 -rotate-12 -translate-x-2 translate-y-1 rounded-3xl border-4 border-[#161426] opacity-75"
                          />
                        )}
                        <div
                          style={{ backgroundColor: dMeta.bg }}
                          className="relative rotate-3 w-40 h-54 sm:w-44 sm:h-58 rounded-3xl border-4 border-[#161426] shadow-[0_8px_0_#161426] p-3.5 flex flex-col items-center justify-between text-center text-[#161426]"
                        >
                          <span
                            style={{ backgroundColor: dMeta.badgeBg }}
                            className="px-2.5 py-0.5 rounded-full text-white border-2 border-[#161426] text-[10px] font-black"
                          >
                            {ar ? 'آخر قدرة ملعوبة' : 'Last Played'}
                          </span>
                          <BoomCardIllustrationSvg
                            type={topDiscard.type}
                            className="w-22 h-22"
                          />
                          <div>
                            <div className="font-black text-sm leading-tight">
                              {ar ? dMeta.name_ar : dMeta.name_en}
                            </div>
                            <div className="text-[10px] font-bold text-[#3f3b5c] mt-0.5">
                              {ar ? dMeta.short_ar : dMeta.short_en}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()
                ) : (
                  <div className="w-40 h-54 sm:w-44 sm:h-58 rounded-3xl border-4 border-dashed border-[#ffca3a]/35 bg-[#161426]/40 flex flex-col items-center justify-center p-4 text-center text-white/60">
                    <Sparkle weight="fill" className="w-9 h-9 mb-2 text-[#ffca3a]/60" />
                    <span className="text-xs font-extrabold">
                      {ar ? 'ساحة رمي القدرات' : 'Played Ability Arena'}
                    </span>
                    <span className="text-[10px] font-bold opacity-75 mt-1">
                      {ar
                        ? 'ارمِ كرت قدرة من يدك لينطلق هنا!'
                        : 'Play a card from your hand onto the felt!'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* CENTER TABLE OVERLAY 1: COUNTER WINDOW ("بلوك! 4s") */}
          {gameData.phase === 'counter_window' && gameData.pendingAction && (
            <div className="cartoon-card p-5 bg-gradient-to-b from-[#fff1f2] to-[#ffe4e6] border-4 border-[#161426] text-center space-y-3.5 shadow-[0_10px_0_#161426] max-w-xl w-full animate-in zoom-in-95 duration-150">
              <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-[#e11d48] text-white border-2 border-[#161426] font-black text-xs animate-pulse">
                <Prohibit weight="fill" className="w-4 h-4" />
                <span>
                  {ar
                    ? `نافذة الاعتراض مفتوحة (${counterSecondsLeft} ثوانٍ)... هل يكبس أحد «بلوك!»؟`
                    : `Counter Window (${counterSecondsLeft}s)... Anyone slamming BLOCK?`}
                </span>
              </div>

              <div className="flex flex-col items-center gap-1.5">
                <div className="w-22 h-22 rounded-3xl bg-white border-4 border-[#161426] shadow-[0_5px_0_#161426] flex items-center justify-center">
                  <BoomCardIllustrationSvg
                    type={gameData.pendingAction.cardType}
                    className="w-18 h-18"
                  />
                </div>
                <h3 className="text-lg sm:text-xl font-black text-[#161426]">
                  {ar
                    ? `${getPlayerName(
                        gameData.pendingAction.actorId
                      )} رمى عالطاولة «${
                        BOOM_CARD_META[gameData.pendingAction.cardType].name_ar
                      }»!`
                    : `${getPlayerName(
                        gameData.pendingAction.actorId
                      )} slammed "${
                        BOOM_CARD_META[gameData.pendingAction.cardType].name_en
                      }"!`}
                </h3>
                <p className="text-xs font-bold text-[#3f3b5c]">
                  {gameData.pendingAction.blockedCount % 2 === 1
                    ? ar
                      ? `الحركة مُبطلة حالياً بواسطة ${getPlayerName(
                          gameData.pendingAction.lastBlockerId
                        )}! هل يرد أحد بـ «بلوك ع البلوك»؟`
                      : `Currently BLOCKED by ${getPlayerName(
                          gameData.pendingAction.lastBlockerId
                        )}! Anyone counter-blocking?`
                    : ar
                    ? BOOM_CARD_META[gameData.pendingAction.cardType].desc_ar
                    : BOOM_CARD_META[gameData.pendingAction.cardType].desc_en}
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
                {!isPassAndPlay && myBlockCard && (
                  <button
                    type="button"
                    onClick={() => handleSlamBlockCard(myPlayerId)}
                    className="cartoon-btn bg-[#ef4444] hover:bg-[#dc2626] text-white px-5 py-2.5 text-sm flex items-center gap-2 cursor-pointer animate-bounce"
                  >
                    <Prohibit weight="fill" className="w-5 h-5" />
                    <span>
                      {gameData.pendingAction.blockedCount % 2 === 1
                        ? ar
                          ? 'اكبس بلوك ع البلوك!'
                          : 'Counter-Block!'
                        : ar
                        ? 'اكبس بلوك! وأبطل حركته'
                        : 'Slam BLOCK!'}
                    </span>
                  </button>
                )}

                {isPassAndPlay &&
                  gameData.alivePlayerIds
                    .filter((pid) =>
                      (gameData.hands?.[pid] || []).some(
                        (c) => c.type === 'block'
                      )
                    )
                    .map((pid) => (
                      <button
                        key={pid}
                        type="button"
                        onClick={() => handleSlamBlockCard(pid)}
                        className="cartoon-btn bg-[#ef4444] text-white px-4 py-2 text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer"
                      >
                        <Prohibit weight="fill" className="w-4 h-4" />
                        <span>
                          {ar
                            ? `بلوك! (${getPlayerName(pid)})`
                            : `BLOCK (${getPlayerName(pid)})`}
                        </span>
                      </button>
                    ))}

                <button
                  type="button"
                  onClick={resolvePendingAction}
                  className="cartoon-btn bg-[#8ac926] text-[#161426] px-5 py-2.5 text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle weight="fill" className="w-4 h-4" />
                  <span>
                    {gameData.pendingAction.blockedCount % 2 === 1
                      ? ar
                        ? 'تأكيد إبطال الحركة'
                        : 'Confirm Cancelled'
                      : ar
                      ? 'لا اعتراض — نفّذ القدرة!'
                      : 'Execute Move Now!'}
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* CENTER TABLE OVERLAY 2: BOMB CRISIS ON THE FELT */}
          {gameData.phase === 'bomb_crisis' && (
            <div className="cartoon-card p-5 bg-gradient-to-b from-[#ffe4e6] to-[#fecdd3] border-4 border-[#161426] text-center space-y-4 shadow-[0_10px_0_#161426] max-w-xl w-full animate-in zoom-in-95 duration-150">
              <div className="w-24 h-24 rounded-3xl bg-white border-4 border-[#161426] shadow-[0_6px_0_#161426] flex items-center justify-center mx-auto animate-bounce">
                <BoomCardIllustrationSvg type="bomb" className="w-20 h-20" />
              </div>

              <div className="space-y-1">
                <span className="cartoon-badge bg-[#e11d48] text-white px-3.5 py-0.5 text-xs inline-flex items-center gap-1.5">
                  <WarningOctagon weight="fill" className="w-4 h-4" />
                  <span>{ar ? 'إنذار انفجار عالطاولة!' : 'BOMB ON THE TABLE!'}</span>
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-[#161426]">
                  {ar
                    ? `${getPlayerName(crisisPlayerId)} سحب «الديناميت المشتعل»!`
                    : `${getPlayerName(crisisPlayerId)} drew LIT DYNAMITE!`}
                </h3>
                <p className="text-xs sm:text-sm font-bold text-[#3f3b5c]">
                  {crisisHasDefuse
                    ? ar
                      ? 'يملك «مقص الأسلاك» في يده! قصّ السلك الأحمر الآن لتنجو وتزرع اللغم بالكومة بالسر!'
                      : 'Wire Cutters in hand! Snip the red wire now to survive and re-plant the bomb!'
                    : ar
                    ? 'لا يملك أي «مقص أسلاك» في يده... الفتيل وصل للنهاية!'
                    : 'No Wire Cutters left in hand... The fuse has reached the end!'}
                </p>
              </div>

              {(isCrisisMine || isPassAndPlay) && (
                <div className="flex justify-center">
                  {crisisHasDefuse ? (
                    <button
                      type="button"
                      onClick={handleDefuseBomb}
                      className="cartoon-btn bg-[#22c55e] hover:bg-[#16a34a] text-[#161426] px-6 py-3 text-base flex items-center gap-2 cursor-pointer animate-pulse"
                    >
                      <Scissors weight="fill" className="w-5 h-5" />
                      <span>
                        {ar
                          ? 'قصّ السلك بمقص الأسلاك وانجُ بنفسك!'
                          : 'Snip Fuse with Wire Cutters!'}
                      </span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleConfirmExplosion}
                      className="cartoon-btn bg-[#e11d48] text-white px-6 py-3 text-base flex items-center gap-2 cursor-pointer"
                    >
                      <Flame weight="fill" className="w-5 h-5" />
                      <span>
                        {ar
                          ? 'بوووم! انفجار وخروج من الجولة'
                          : 'KABOOM! Accept Explosion'}
                      </span>
                    </button>
                  )}
                </div>
              )}

              {isHost && !isCrisisMine && !isPassAndPlay && (
                <button
                  type="button"
                  onClick={
                    crisisHasDefuse ? handleDefuseBomb : handleConfirmExplosion
                  }
                  className="cartoon-badge bg-[#191636] text-white px-4 py-1.5 text-xs cursor-pointer"
                >
                  {ar
                    ? 'متابعة تلقائية (إذا تأخر اللاعب)'
                    : 'Host Continue (if player AFK)'}
                </button>
              )}
            </div>
          )}

          {/* CENTER TABLE OVERLAY 3: SECRET BOMB RE-PLANTING VAULT */}
          {gameData.phase === 'planting_bomb' && (
            <div className="cartoon-card p-5 bg-gradient-to-b from-[#dcfce7] to-[#bbf7d0] border-4 border-[#161426] text-center space-y-3.5 shadow-[0_10px_0_#161426] max-w-2xl w-full animate-in zoom-in-95 duration-150">
              {isCrisisMine || isPassAndPlay ? (
                <>
                  <div className="flex items-center justify-center gap-2">
                    <span className="cartoon-badge bg-[#16a34a] text-white px-3 py-0.5 text-xs">
                      {ar
                        ? 'سري للغاية — اختر مكان الفخ داخل الكومة!'
                        : 'TOP SECRET — Plant the Trap in the Deck!'}
                    </span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-black text-[#161426]">
                    {ar
                      ? `يا ${getPlayerName(
                          crisisPlayerId
                        )}، وين بدك تزرع الديناميت وسط الـ ${totalDeckCount} كرت؟`
                      : `${getPlayerName(
                          crisisPlayerId
                        )}, where will you hide the Dynamite among ${totalDeckCount} cards?`}
                  </h3>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => handlePlantBombAt('top_0')}
                      className="cartoon-btn bg-[#e11d48] text-white p-2.5 text-xs flex flex-col items-center gap-0.5 cursor-pointer"
                    >
                      <span className="font-black flex items-center gap-1">
                        <Flame weight="fill" className="w-4 h-4 text-[#ffca3a]" />
                        <span>{ar ? '1. أول كرت عالوجه!' : '1. Right on TOP!'}</span>
                      </span>
                      <span className="text-[10px] opacity-90">
                        {ar ? 'فخ فوري للي بعدك!' : 'Instant trap for next player!'}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handlePlantBombAt('top_1')}
                      className="cartoon-btn bg-[#f97316] text-white p-2.5 text-xs flex flex-col items-center gap-0.5 cursor-pointer"
                    >
                      <span className="font-black flex items-center gap-1">
                        <Lightning weight="fill" className="w-4 h-4 text-[#fef08a]" />
                        <span>{ar ? '2. تاني كرت من فوق' : '2. Second Card'}</span>
                      </span>
                      <span className="text-[10px] opacity-90">
                        {ar ? 'ينفجر بعد سحبة واحدة!' : 'After 1 safe draw!'}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handlePlantBombAt('top_2')}
                      className="cartoon-btn bg-[#ffca3a] text-[#161426] p-2.5 text-xs flex flex-col items-center gap-0.5 cursor-pointer"
                    >
                      <span className="font-black flex items-center gap-1">
                        <WarningOctagon
                          weight="fill"
                          className="w-4 h-4 text-[#e11d48]"
                        />
                        <span>{ar ? '3. تالت كرت من فوق' : '3. Third Card'}</span>
                      </span>
                      <span className="text-[10px] opacity-85">
                        {ar ? 'كمين بعد سحبتين' : 'After 2 safe draws'}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handlePlantBombAt('middle')}
                      className="cartoon-btn bg-[#00bbf9] text-[#161426] p-2.5 text-xs flex flex-col items-center gap-0.5 cursor-pointer"
                    >
                      <span className="font-black flex items-center gap-1">
                        <FastForward weight="fill" className="w-4 h-4" />
                        <span>{ar ? '4. بنص الكومة' : '4. Middle of Deck'}</span>
                      </span>
                      <span className="text-[10px] opacity-85">
                        {ar ? 'آمن لعدة أدوار' : 'Safe for a few turns'}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handlePlantBombAt('bottom')}
                      className="cartoon-btn bg-[#8ac926] text-[#161426] p-2.5 text-xs flex flex-col items-center gap-0.5 cursor-pointer"
                    >
                      <span className="font-black flex items-center gap-1">
                        <ShieldCheck weight="fill" className="w-4 h-4" />
                        <span>{ar ? '5. بآخر الكومة تحت' : '5. Bottom of Deck'}</span>
                      </span>
                      <span className="text-[10px] opacity-85">
                        {ar ? 'أبعد مكان ممكن' : 'Furthest spot'}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handlePlantBombAt('random')}
                      className="cartoon-btn bg-[#9b5de5] text-white p-2.5 text-xs flex flex-col items-center gap-0.5 cursor-pointer"
                    >
                      <span className="font-black flex items-center gap-1">
                        <Shuffle weight="bold" className="w-4 h-4 text-[#ffca3a]" />
                        <span>{ar ? '6. مكان عشوائي' : '6. Random Spot'}</span>
                      </span>
                      <span className="text-[10px] opacity-90">
                        {ar ? 'مفاجأة للجميع!' : 'Total mystery!'}
                      </span>
                    </button>
                  </div>
                </>
              ) : (
                <div className="py-4 space-y-2">
                  <div className="w-16 h-16 rounded-2xl bg-white border-3 border-[#161426] flex items-center justify-center mx-auto animate-pulse">
                    <BoomCardIllustrationSvg type="bomb" className="w-13 h-13" />
                  </div>
                  <h3 className="text-lg font-black text-[#161426]">
                    {ar
                      ? `${getPlayerName(
                          crisisPlayerId
                        )} يخبئ القنبلة داخل الكومة بالسر الآن...`
                      : `${getPlayerName(
                          crisisPlayerId
                        )} is secretly planting the bomb in the deck...`}
                  </h3>
                </div>
              )}
            </div>
          )}

          {/* CENTER TABLE OVERLAY 4: ROUND OVER CHAMPION PODIUM */}
          {gameData.phase === 'round_over' && (
            <div className="cartoon-card p-6 bg-gradient-to-b from-[#fef9c3] to-[#fde047] border-4 border-[#161426] text-center space-y-3.5 shadow-[0_10px_0_#161426] max-w-lg w-full animate-in zoom-in-95 duration-150">
              <div className="w-20 h-20 rounded-3xl bg-white border-4 border-[#161426] shadow-[0_4px_0_#161426] flex items-center justify-center mx-auto">
                <Trophy weight="fill" className="w-12 h-12 text-[#eab308]" />
              </div>
              <h3 className="text-2xl font-black text-[#161426]">
                {ar
                  ? `الناجي الأخير والبطل: ${getPlayerName(gameData.winnerId)}!`
                  : `Last Survivor Champion: ${getPlayerName(gameData.winnerId)}!`}
              </h3>
              <p className="text-xs sm:text-sm font-bold text-[#3f3b5c]">
                {ar
                  ? 'نجا من كل الألغام والفخاخ وحصد +4 نقاط في صدارة الغرفة!'
                  : 'Outsmarted every dynamite trap and earned +4 victory points!'}
              </p>
              {(isHost || isPassAndPlay) && (
                <button
                  type="button"
                  onClick={onStartNewRound}
                  className="cartoon-btn bg-[#8ac926] text-[#161426] px-7 py-2.5 text-sm sm:text-base inline-flex items-center gap-2 cursor-pointer"
                >
                  <Flame weight="fill" className="w-5 h-5 text-[#e11d48]" />
                  <span>
                    {ar ? 'جولة جديدة على الطاولة!' : 'Play Another Round!'}
                  </span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* ==================================================================
            C) BOTTOM EDGE OF THE TABLE: ACTIVE PLAYER'S STATION & CURVED FANNED HAND!
           ================================================================== */}
        <div className="relative z-30 mt-auto pt-2 flex flex-col items-center">
          {/* Active Player's Table Seat Bar */}
          <div className="mb-2 px-4 py-1.5 rounded-2xl bg-[#161426]/95 border-3 border-[#ffca3a] shadow-[0_4px_0_#161426] flex flex-wrap items-center justify-center gap-3 text-white">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl border-2 border-[#ffca3a] bg-white overflow-hidden shrink-0">
                <CartoonAvatarSvg
                  index={getPlayerIndex(bottomPlayer?.id)}
                  color={bottomPlayer?.avatar_color}
                />
              </div>
              <span className="font-black text-xs sm:text-sm text-[#ffca3a]">
                {isPassAndPlay
                  ? ar
                    ? `مقعد (${bottomPlayer?.name}) الحالي`
                    : `${bottomPlayer?.name}’s Seat`
                  : ar
                  ? `مقعدك (${bottomPlayer?.name})`
                  : `Your Seat (${bottomPlayer?.name})`}
              </span>
            </div>

            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-black ${
                isMyTurn
                  ? 'bg-[#8ac926] text-[#161426]'
                  : 'bg-[#25204d] text-white/80'
              }`}
            >
              {isMyTurn
                ? ar
                  ? 'دورك الآن! العب قدرة أو اسحب كرتاً'
                  : 'YOUR TURN! Play a card or draw'
                : ar
                ? `بانتظار دور ${getPlayerName(gameData.turnPlayerId)}`
                : `Waiting on ${getPlayerName(gameData.turnPlayerId)}`}
            </span>

            {isPassAndPlay && passAndPlayHandUnlocked && (
              <button
                type="button"
                onClick={() => setPassAndPlayHandUnlocked(false)}
                className="px-2.5 py-0.5 rounded-full bg-[#e11d48] text-white text-[11px] font-black flex items-center gap-1 cursor-pointer"
              >
                <EyeSlash weight="bold" className="w-3.5 h-3.5" />
                <span>{ar ? 'إخفاء أوراقي' : 'Hide Hand'}</span>
              </button>
            )}
          </div>

          {/* FANNED HAND OF ABILITY CARDS AT THE BOTTOM OF THE TABLE */}
          {!isAmAlive ? (
            <div className="px-6 py-3 rounded-2xl bg-[#ffe4e6] border-3 border-[#161426] text-center font-black text-xs sm:text-sm text-[#e11d48] flex items-center gap-2">
              <Skull weight="fill" className="w-5 h-5" />
              <span>
                {ar
                  ? 'لقد انفجرت في هذه الجولة! شاهد المعركة الحية على الطاولة!'
                  : 'You exploded this round! Watch the live battle on the table!'}
              </span>
            </div>
          ) : isPassAndPlay && !passAndPlayHandUnlocked ? (
            <div className="px-6 py-4 rounded-3xl bg-[#191636]/95 border-3 border-[#ffca3a] text-center space-y-2 shadow-[0_6px_0_#161426]">
              <p className="text-xs sm:text-sm font-extrabold text-[#fff9ec]">
                {ar
                  ? `مرّر الجهاز إلى (${getPlayerName(
                      activeViewerId
                    )}) الجالس بهذا المقعد ثم اكشف أوراقه:`
                  : `Pass device to (${getPlayerName(
                      activeViewerId
                    )}) and tap to reveal their hand:`}
              </p>
              <button
                type="button"
                onClick={() => setPassAndPlayHandUnlocked(true)}
                className="cartoon-btn bg-[#ffca3a] text-[#161426] px-6 py-2 text-xs sm:text-sm inline-flex items-center gap-2 cursor-pointer"
              >
                <Eye weight="fill" className="w-4 h-4" />
                <span>
                  {ar
                    ? `اكشف أوراق ${getPlayerName(activeViewerId)} (${
                        myHand.length
                      } كروت)`
                    : `Reveal ${getPlayerName(activeViewerId)}’s Hand (${
                        myHand.length
                      })`}
                </span>
              </button>
            </div>
          ) : (
            <div className="w-full overflow-x-auto pb-2 pt-5 px-2 flex justify-center">
              <div className="inline-flex items-end justify-center -space-x-3 sm:-space-x-4 px-4">
                {myHand.map((card, idx) => {
                  const meta = BOOM_CARD_META[card.type];
                  const isPassive =
                    card.type === 'defuse' || card.type === 'block';
                  const canPlayNow =
                    gameData.phase === 'playing' && isMyTurn && !isPassive;
                  const isPickedForMagnet =
                    pickingMagnetTarget && selectedCardId === card.id;

                  // Calculate natural curved hand fan rotation & vertical arc
                  const mid = (myHand.length - 1) / 2;
                  const fanAngle = (idx - mid) * 3.5;
                  const fanLift = Math.abs(idx - mid) * 3;

                  return (
                    <div
                      key={card.id}
                      style={{
                        backgroundColor: meta.bg,
                        transform: isPickedForMagnet
                          ? 'translateY(-18px) scale(1.08)'
                          : `rotate(${fanAngle}deg) translateY(${fanLift}px)`,
                      }}
                      onClick={() => {
                        if (canPlayNow) {
                          handleInitiateCardPlay(card);
                        }
                      }}
                      className={`group relative w-34 sm:w-40 min-h-[205px] sm:min-h-[222px] p-2.5 sm:p-3 rounded-3xl border-4 border-[#161426] flex flex-col items-center justify-between text-center transition-all duration-200 shrink-0 ${
                        isPickedForMagnet
                          ? 'z-40 ring-4 ring-[#f97316] shadow-[0_12px_0_#161426]'
                          : canPlayNow
                          ? 'hover:!-translate-y-5 hover:!rotate-0 hover:scale-105 hover:z-30 shadow-[0_7px_0_#161426] cursor-pointer'
                          : 'opacity-95 hover:!-translate-y-2 hover:!rotate-0 hover:z-20 shadow-[0_5px_0_#161426]'
                      }`}
                    >
                      {/* Crisp Non-Truncated Top Tag Pill */}
                      <span
                        style={{ backgroundColor: meta.badgeBg }}
                        className="px-2.5 py-0.5 rounded-full text-white border-2 border-[#161426] text-[10px] font-black leading-tight whitespace-nowrap"
                      >
                        {ar ? meta.tag_ar : meta.tag_en}
                      </span>

                      {/* High-Detail Custom Vector Illustration */}
                      <BoomCardIllustrationSvg
                        type={card.type}
                        className="w-16 h-16 sm:w-18 sm:h-18 my-0.5 group-hover:scale-110 transition-transform"
                      />

                      {/* Full Card Name + Clear Short Explanation (No ellipsis truncation!) */}
                      <div className="space-y-0.5 w-full">
                        <div className="font-black text-xs sm:text-sm text-[#161426] leading-tight">
                          {ar ? meta.name_ar : meta.name_en}
                        </div>
                        <div className="text-[10px] sm:text-[11px] font-bold text-[#3f3b5c] leading-snug">
                          {ar ? meta.short_ar : meta.short_en}
                        </div>
                      </div>

                      {/* Play Button on Action Cards */}
                      {canPlayNow ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleInitiateCardPlay(card);
                          }}
                          className="w-full mt-1 py-1 rounded-xl bg-[#161426] group-hover:bg-[#ffca3a] text-[#ffca3a] group-hover:text-[#161426] border-2 border-[#161426] font-black text-[11px] transition-colors cursor-pointer"
                        >
                          {isPickedForMagnet
                            ? ar
                              ? 'اختر خصماً عالطاولة'
                              : 'Pick Rival Above'
                            : ar
                            ? 'العب القدرة الآن'
                            : 'Play Ability'}
                        </button>
                      ) : (
                        <span className="w-full mt-1 py-0.5 rounded-lg bg-[#161426]/10 text-[#161426]/75 font-extrabold text-[10px]">
                          {card.type === 'defuse'
                            ? ar
                              ? 'يشتغل تلقائياً عند اللغم'
                              : 'Auto-saves on Bomb'
                            : card.type === 'block'
                            ? ar
                              ? 'يُكبس بنافذة الاعتراض'
                              : 'Use in Counter Window'
                            : ar
                            ? 'انتظر دورك للعب'
                            : 'Wait for your turn'}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
