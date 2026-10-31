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
  HandGrabbing,
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
  | 'block'
  | 'combo_shawarma'
  | 'combo_kabsa'
  | 'combo_karak'
  | 'combo_falcon';

export function isComboSetCard(type: BoomCardType): boolean {
  return (
    type === 'combo_shawarma' ||
    type === 'combo_kabsa' ||
    type === 'combo_karak' ||
    type === 'combo_falcon'
  );
}

export interface BoomCard {
  id: string;
  type: BoomCardType;
}

export interface BoomPendingAction {
  id: string;
  actorId: string;
  cardType: Exclude<BoomCardType, 'bomb' | 'defuse'>;
  comboCount?: 1 | 2 | 3; // 1 = normal action, 2 = Pair (steal random), 3 = Triple (demand named card!)
  demandedCardType?: BoomCardType; // Used when comboCount === 3
  targetPlayerId?: string;
  blockedCount: number; // Odd = blocked (cancelled), Even = active!
  lastBlockerId?: string;
  createdAt: number;
}

export interface BoomCinematicEvent {
  id: string;
  type: BoomCardType | 'exploded' | 'planted' | 'draw_safe';
  actorId: string;
  targetId?: string;
  drawnCardType?: BoomCardType;
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
    frameBg: string;
    badgeBg: string;
    accent: string;
    tag_ar: string;
    tag_en: string;
    symbol: string;
  }
> = {
  bomb: {
    name_ar: 'قنبلة!',
    name_en: 'Lit Bomb',
    short_ar: 'تنفجر إلا بمقص الإنقاذ!',
    short_en: 'Explodes unless Defused!',
    desc_ar: 'إذا سحبته ينفجر فيك فوراً وتخرج من الجولة إلا إذا معك «مقص الإنقاذ»!',
    desc_en: 'If drawn, it explodes and eliminates you unless you hold Wire Cutters!',
    bg: '#ffe4e6',
    frameBg: '#881337',
    badgeBg: '#e11d48',
    accent: '#e11d48',
    tag_ar: 'لغم',
    tag_en: 'BOMB',
    symbol: '!',
  },
  defuse: {
    name_ar: 'مقص الإنقاذ',
    name_en: 'Defuse',
    short_ar: 'ينقذك من القنبلة تلقائياً',
    short_en: 'Saves you from a Bomb',
    desc_ar: 'يشتغل تلقائياً عند سحب القنبلة! ينقذك ويخليك تزرعها بأي مكان بالكومة بالسر!',
    desc_en: 'Cuts the fuse when you draw a bomb and lets you secretly hide it anywhere in the deck!',
    bg: '#dcfce7',
    frameBg: '#064e3b',
    badgeBg: '#16a34a',
    accent: '#22c55e',
    tag_ar: 'إنقاذ',
    tag_en: 'DEFUSE',
    symbol: '+',
  },
  attack: {
    name_ar: 'هجوم ×2',
    name_en: 'Attack ×2',
    short_ar: 'اللي بعدك يسحب مرتين!',
    short_en: 'Next player draws 2x!',
    desc_ar: 'ينهي دورك فوراً بدون سحب، ويجبر اللاعب اللي بعدك يسحب مرتين!',
    desc_en: 'Immediately ends your turn without drawing and forces the next player to take 2 turns!',
    bg: '#fef3c7',
    frameBg: '#78350f',
    badgeBg: '#d97706',
    accent: '#f59e0b',
    tag_ar: 'هجوم',
    tag_en: 'ATTACK',
    symbol: '×2',
  },
  skip: {
    name_ar: 'تخطي الدور',
    name_en: 'Skip Turn',
    short_ar: 'أنهِ دورك بدون سحب كرت',
    short_en: 'End turn without drawing',
    desc_ar: 'أنهِ دورك الحالي بسلام بدون ما تسحب كرت من الكومة!',
    desc_en: 'Dash safely out of your current turn without drawing a card from the pile!',
    bg: '#e0f2fe',
    frameBg: '#0c4a6e',
    badgeBg: '#0284c7',
    accent: '#00bbf9',
    tag_ar: 'تخطي',
    tag_en: 'SKIP',
    symbol: '>>',
  },
  reverse: {
    name_ar: 'عكس الدور',
    name_en: 'Reverse',
    short_ar: 'اعكس الاتجاه بدون سحب',
    short_en: 'Reverse & skip draw',
    desc_ar: 'يعكس اتجاه الدوران حول الطاولة وينهي دورك الحالي بدون سحب كرت!',
    desc_en: 'Flips the turn direction around the table and ends your current turn without drawing!',
    bg: '#f3e8ff',
    frameBg: '#4c1d95',
    badgeBg: '#7c3aed',
    accent: '#9b5de5',
    tag_ar: 'عكس',
    tag_en: 'REVERSE',
    symbol: '⇄',
  },
  radar: {
    name_ar: 'رادار الكومة',
    name_en: 'Radar',
    short_ar: 'اكشف أول 3 كروت سراً',
    short_en: 'Peek top 3 cards',
    desc_ar: 'يكشف لك وحدك أول 3 كروت بأعلى الكومة لتعرف مكان القنبلة!',
    desc_en: 'Secretly scans the top 3 cards of the Draw Pile so only you see if a bomb is next!',
    bg: '#fce7f3',
    frameBg: '#831843',
    badgeBg: '#db2777',
    accent: '#f15bb5',
    tag_ar: 'رادار',
    tag_en: 'RADAR',
    symbol: '3x',
  },
  shuffle: {
    name_ar: 'خلط الكومة',
    name_en: 'Shuffle',
    short_ar: 'اخلط كومة السحب بالكامل',
    short_en: 'Shuffle the draw pile',
    desc_ar: 'يخلط كومة السحب بالكامل ليبعد القنبلة عن الوجه!',
    desc_en: 'Shuffles the entire Draw Pile to dodge a top-decked bomb!',
    bg: '#ccfbf1',
    frameBg: '#134e4a',
    badgeBg: '#0d9488',
    accent: '#14b8a6',
    tag_ar: 'خلط',
    tag_en: 'SHUFFLE',
    symbol: '~',
  },
  magnet: {
    name_ar: 'مغناطيس',
    name_en: 'Magnet',
    short_ar: 'اسرق كرتاً من يد خصمك',
    short_en: 'Steal 1 card from rival',
    desc_ar: 'اختر أي لاعب عالطاولة واسحب كرتاً عشوائياً من يده إلى يدك!',
    desc_en: 'Target any rival player and yank 1 random card straight from their hand into yours!',
    bg: '#ffedd5',
    frameBg: '#7c2d12',
    badgeBg: '#ea580c',
    accent: '#f97316',
    tag_ar: 'سرقة',
    tag_en: 'STEAL',
    symbol: 'U',
  },
  block: {
    name_ar: 'بلوك!',
    name_en: 'Block!',
    short_ar: 'يلغي حركة خصمك فوراً',
    short_en: 'Cancel rival action',
    desc_ar: 'اكبسه بأي لحظة لما يلعب خصمك كرت قدرة لإلغاء حركته فوراً!',
    desc_en: 'Slam this during the Counter Window to cancel any action card played by a rival!',
    bg: '#fee2e2',
    frameBg: '#7f1d1d',
    badgeBg: '#dc2626',
    accent: '#ef4444',
    tag_ar: 'إلغاء',
    tag_en: 'BLOCK',
    symbol: '✕',
  },
  combo_shawarma: {
    name_ar: 'شاورما',
    name_en: 'Shawarma',
    short_ar: 'اجمع 2 أو 3 للسرقة',
    short_en: 'Collect 2 or 3 to steal',
    desc_ar: 'لا يعمل وحده! اجمع 2 لسرقة كرت عشوائي، أو 3 لطلب أي كرت بالاسم من خصمك!',
    desc_en: 'Powerless alone! Play 2 of a kind to steal a random card, or 3 of a kind to demand any card by name!',
    bg: '#fef3c7',
    frameBg: '#78350f',
    badgeBg: '#d97706',
    accent: '#f59e0b',
    tag_ar: 'كومبو',
    tag_en: 'COMBO',
    symbol: '2×',
  },
  combo_kabsa: {
    name_ar: 'كبسة',
    name_en: 'Kabsa',
    short_ar: 'اجمع 2 أو 3 للسرقة',
    short_en: 'Collect 2 or 3 to steal',
    desc_ar: 'لا يعمل وحده! اجمع 2 لسرقة كرت عشوائي، أو 3 لطلب أي كرت بالاسم من خصمك!',
    desc_en: 'Powerless alone! Play 2 of a kind to steal a random card, or 3 of a kind to demand any card by name!',
    bg: '#ffedd5',
    frameBg: '#7c2d12',
    badgeBg: '#c2410c',
    accent: '#ea580c',
    tag_ar: 'كومبو',
    tag_en: 'COMBO',
    symbol: '2×',
  },
  combo_karak: {
    name_ar: 'دلة الكرك',
    name_en: 'Karak',
    short_ar: 'اجمع 2 أو 3 للسرقة',
    short_en: 'Collect 2 or 3 to steal',
    desc_ar: 'لا يعمل وحده! اجمع 2 لسرقة كرت عشوائي، أو 3 لطلب أي كرت بالاسم من خصمك!',
    desc_en: 'Powerless alone! Play 2 of a kind to steal a random card, or 3 of a kind to demand any card by name!',
    bg: '#f3e8ff',
    frameBg: '#581c87',
    badgeBg: '#9333ea',
    accent: '#a855f7',
    tag_ar: 'كومبو',
    tag_en: 'COMBO',
    symbol: '2×',
  },
  combo_falcon: {
    name_ar: 'الصقر',
    name_en: 'Falcon',
    short_ar: 'اجمع 2 أو 3 للسرقة',
    short_en: 'Collect 2 or 3 to steal',
    desc_ar: 'لا يعمل وحده! اجمع 2 لسرقة كرت عشوائي، أو 3 لطلب أي كرت بالاسم من خصمك!',
    desc_en: 'Powerless alone! Play 2 of a kind to steal a random card, or 3 of a kind to demand any card by name!',
    bg: '#ecfccb',
    frameBg: '#365314',
    badgeBg: '#4d7c0f',
    accent: '#65a30d',
    tag_ar: 'كومبو',
    tag_en: 'COMBO',
    symbol: '2×',
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

export function getPlayerCountDeckSpec(playerCount: number) {
  if (playerCount <= 3) {
    return {
      tier_ar: 'حزمة المواجهة (2-3 لاعبين)',
      tier_en: 'Quick Pack (2-3P)',
      dealtRandomCards: 6, // + 1 Defuse = 7 starting cards per player
      counts: {
        skip: 3,
        attack: 3,
        radar: 3,
        reverse: 2,
        shuffle: 2,
        magnet: 2,
        block: 3,
        comboEach: 3, // 3 copies of each of the 4 Combo Set cards = 12 combo cards
      },
      extraDefusesInDeck: playerCount === 2 ? 1 : 2,
      bombsInDeck: Math.max(1, playerCount - 1),
    };
  }
  if (playerCount <= 6) {
    return {
      tier_ar: 'الحزمة القياسية (4-6 لاعبين)',
      tier_en: 'Standard Pack (4-6P)',
      dealtRandomCards: 6, // + 1 Defuse = 7 starting cards per player
      counts: {
        skip: 5,
        attack: 5,
        radar: 5,
        reverse: 4,
        shuffle: 4,
        magnet: 4,
        block: 5,
        comboEach: 4, // 4 copies of each of the 4 Combo Set cards = 16 combo cards
      },
      extraDefusesInDeck: 2,
      bombsInDeck: playerCount - 1,
    };
  }
  return {
    tier_ar: 'حزمة الحفلة الكبرى (7+ لاعبين)',
    tier_en: 'Party Pack (7+P)',
    dealtRandomCards: 6, // + 1 Defuse = 7 starting cards per player
    counts: {
      skip: 7,
      attack: 7,
      radar: 7,
      reverse: 5,
      shuffle: 5,
      magnet: 6,
      block: 7,
      comboEach: 6, // 6 copies of each of the 4 Combo Set cards = 24 combo cards
    },
    extraDefusesInDeck: 3,
    bombsInDeck: playerCount - 1,
  };
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
  const spec = getPlayerCountDeckSpec(count);

  let cardSeq = 1;
  const makeCard = (type: BoomCardType): BoomCard => ({
    id: `bc_${round}_${cardSeq++}_${Math.random().toString(36).slice(2, 6)}`,
    type,
  });

  const pool: BoomCard[] = [];
  for (let i = 0; i < spec.counts.skip; i++) pool.push(makeCard('skip'));
  for (let i = 0; i < spec.counts.attack; i++) pool.push(makeCard('attack'));
  for (let i = 0; i < spec.counts.radar; i++) pool.push(makeCard('radar'));
  for (let i = 0; i < spec.counts.reverse; i++) pool.push(makeCard('reverse'));
  for (let i = 0; i < spec.counts.shuffle; i++) pool.push(makeCard('shuffle'));
  for (let i = 0; i < spec.counts.magnet; i++) pool.push(makeCard('magnet'));
  for (let i = 0; i < spec.counts.block; i++) pool.push(makeCard('block'));
  // Collectible Bunker Loot Combo Cards (scaled by player bracket so 2x & 3x combos happen naturally!)
  for (let i = 0; i < spec.counts.comboEach; i++)
    pool.push(makeCard('combo_shawarma'));
  for (let i = 0; i < spec.counts.comboEach; i++)
    pool.push(makeCard('combo_kabsa'));
  for (let i = 0; i < spec.counts.comboEach; i++)
    pool.push(makeCard('combo_karak'));
  for (let i = 0; i < spec.counts.comboEach; i++)
    pool.push(makeCard('combo_falcon'));

  const shuffledPool = shuffleArray(pool);

  const hands: Record<string, BoomCard[]> = {};
  pIds.forEach((pid) => {
    const dealt = shuffledPool.splice(0, spec.dealtRandomCards);
    dealt.push(makeCard('defuse'));
    hands[pid] = shuffleArray(dealt);
  });

  const remainingDeck = [...shuffledPool];
  for (let i = 0; i < spec.extraDefusesInDeck; i++) {
    remainingDeck.push(makeCard('defuse'));
  }
  const bombCount = spec.bombsInDeck;
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
        ar: `بدأت الجولة ${round} بنظام «${spec.tier_ar}»! وُزّع لكل لاعب ${
          spec.dealtRandomCards + 1
        } كروت (بينها مقص أسلاك)، وزُرعت ${bombCount} قنابل (${count} لاعبين - 1) وسط ${
          finalDeck.length
        } كرت بالكومة!`,
        en: `Round ${round} started with "${spec.tier_en}"! Each player holds ${
          spec.dealtRandomCards + 1
        } cards (incl. 1 Wire Cutter) and ${bombCount} bombs (${count}P - 1) lurk in the ${
          finalDeck.length
        }-card pile!`,
      },
    ],
  };
}

/* ============================================================================
 * LUXURY COLLECTIBLE CARD BACK SVG (Royal Crimson & Gold Foil Tarot Style)
 * ========================================================================== */
export const BoomCardBackSvg: React.FC<{ className?: string }> = ({
  className = 'w-10 h-14',
}) => {
  const uid = React.useId().replace(/:/g, '');
  return (
    <svg
      viewBox="0 0 120 170"
      preserveAspectRatio="xMidYMid meet"
      className={className}
    >
      <defs>
        <linearGradient id={`luxCardBack_${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#9f1239" />
          <stop offset="50%" stopColor="#4c0519" />
          <stop offset="100%" stopColor="#1e1b4b" />
        </linearGradient>
        <linearGradient id={`goldFoil_${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="50%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#b45309" />
        </linearGradient>
      </defs>
      {/* Outer Cream Card Stock Rim */}
      <rect
        x="3"
        y="3"
        width="114"
        height="164"
        rx="16"
        fill="#fffbeb"
        stroke="#161426"
        strokeWidth="6"
      />
      {/* Inner Velvet Crimson Panel */}
      <rect
        x="11"
        y="11"
        width="98"
        height="148"
        rx="11"
        fill={`url(#luxCardBack_${uid})`}
        stroke="#161426"
        strokeWidth="3"
      />
      {/* Ornate Gold Filigree Frame */}
      <rect
        x="18"
        y="18"
        width="84"
        height="134"
        rx="7"
        fill="none"
        stroke={`url(#goldFoil_${uid})`}
        strokeWidth="2.5"
      />
      {/* Corner Gold Diamonds */}
      <polygon points="26,22 30,26 26,30 22,26" fill="#f59e0b" />
      <polygon points="94,22 98,26 94,30 90,26" fill="#f59e0b" />
      <polygon points="26,140 30,144 26,148 22,144" fill="#f59e0b" />
      <polygon points="94,140 98,144 94,148 90,144" fill="#f59e0b" />
      {/* Center Medallion Crest */}
      <circle
        cx="60"
        cy="85"
        r="30"
        fill="#161426"
        stroke={`url(#goldFoil_${uid})`}
        strokeWidth="3.5"
      />
      <circle
        cx="60"
        cy="85"
        r="23"
        fill="none"
        stroke="#f59e0b"
        strokeWidth="1.2"
        strokeDasharray="4 3"
      />
      {/* Bomb Silhouette Inside Medallion */}
      <circle
        cx="57"
        cy="90"
        r="13"
        fill="#e11d48"
        stroke="#fef08a"
        strokeWidth="2"
      />
      <circle cx="53" cy="86" r="3.5" fill="#fda4af" />
      <path
        d="M 65 78 Q 73 68 81 72"
        fill="none"
        stroke="#fef08a"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <polygon
        points="82,64 84,70 90,70 85,74 87,80 82,76 77,80 79,74 74,70 80,70"
        fill="#ffca3a"
      />
    </svg>
  );
};

/* ============================================================================
 * FULL-SCENE ILLUSTRATED ARTWORK FOR ALL 9 CARDS (140 × 108 Rectangular Canvas)
 * Designed like a physical tabletop card game (Exploding Kittens / Balatro style)
 * ========================================================================== */
export const BoomCardIllustrationSvg: React.FC<{
  type: BoomCardType;
  className?: string;
}> = ({ type, className = 'w-full h-full' }) => {
  const uid = React.useId().replace(/:/g, '');
  switch (type) {
    case 'bomb':
      return (
        <svg
          viewBox="0 0 140 108"
          preserveAspectRatio="xMidYMid slice"
          className={className}
        >
          <defs>
            <radialGradient id={`scBombBg_${uid}`} cx="50%" cy="48%" r="68%">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="48%" stopColor="#fb7185" />
              <stop offset="100%" stopColor="#9f1239" />
            </radialGradient>
            <linearGradient
              id={`scC4Cylinder_${uid}`}
              x1="0"
              y1="0"
              x2="1"
              y2="0"
            >
              <stop offset="0%" stopColor="#fb7185" />
              <stop offset="42%" stopColor="#e11d48" />
              <stop offset="100%" stopColor="#9f1239" />
            </linearGradient>
            <linearGradient
              id={`scC4Center_${uid}`}
              x1="0"
              y1="0"
              x2="1"
              y2="0"
            >
              <stop offset="0%" stopColor="#fda4af" />
              <stop offset="38%" stopColor="#f43f5e" />
              <stop offset="100%" stopColor="#be123c" />
            </linearGradient>
            <linearGradient id={`scGoldCard_${uid}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#fde047" />
              <stop offset="100%" stopColor="#f59e0b" />
            </linearGradient>
          </defs>
          {/* Vibrant Comic Stage Background */}
          <rect width="140" height="108" rx="12" fill={`url(#scBombBg_${uid})`} />
          {/* Dynamic Sunburst Rays */}
          <g opacity="0.28" fill="#fef08a">
            <polygon points="70,56 0,0 26,0" />
            <polygon points="70,56 54,0 86,0" />
            <polygon points="70,56 114,0 140,0" />
            <polygon points="70,56 140,34 140,64" />
            <polygon points="70,56 140,88 114,108" />
            <polygon points="70,56 26,108 0,88" />
            <polygon points="70,56 0,64 0,34" />
          </g>
          {/* Hazard Bunker Floor & Ground Shadow */}
          <rect x="0" y="88" width="140" height="20" fill="#161426" opacity="0.35" />
          <g opacity="0.35" fill="#ffca3a">
            <polygon points="8,108 20,88 32,88 20,108" />
            <polygon points="40,108 52,88 64,88 52,108" />
            <polygon points="72,108 84,88 96,88 84,108" />
            <polygon points="104,108 116,88 128,88 116,108" />
          </g>
          <ellipse cx="70" cy="95" rx="46" ry="7" fill="#161426" opacity="0.38" />

          {/* Back Plane: Fanned Ability Cards (Direct Homage to boomdeck Icon!) */}
          <g transform="rotate(-16 42 56)">
            <rect
              x="18"
              y="26"
              width="34"
              height="48"
              rx="6"
              fill={`url(#scGoldCard_${uid})`}
              stroke="#161426"
              strokeWidth="3.2"
            />
            <rect
              x="22"
              y="30"
              width="26"
              height="40"
              rx="3.5"
              fill="none"
              stroke="#fff9ec"
              strokeWidth="1.5"
              strokeDasharray="4 3"
            />
          </g>
          <g transform="rotate(15 98 56)">
            <rect
              x="88"
              y="26"
              width="34"
              height="48"
              rx="6"
              fill="#00bbf9"
              stroke="#161426"
              strokeWidth="3.2"
            />
            <rect
              x="92"
              y="30"
              width="26"
              height="40"
              rx="3.5"
              fill="#e0f2fe"
            />
          </g>

          {/* Middle & Foreground Plane: 3-Stick Heavy C4 Dynamite Bundle */}
          <g transform="translate(0, 5)">
            {/* Left Cylinder */}
            <rect
              x="35"
              y="28"
              width="22"
              height="60"
              rx="7"
              fill={`url(#scC4Cylinder_${uid})`}
              stroke="#161426"
              strokeWidth="3.5"
            />
            <line
              x1="41"
              y1="34"
              x2="41"
              y2="82"
              stroke="#fecdd3"
              strokeWidth="2.8"
              strokeLinecap="round"
              opacity="0.85"
            />
            {/* Right Cylinder */}
            <rect
              x="83"
              y="28"
              width="22"
              height="60"
              rx="7"
              fill={`url(#scC4Cylinder_${uid})`}
              stroke="#161426"
              strokeWidth="3.5"
            />
            <line
              x1="89"
              y1="34"
              x2="89"
              y2="82"
              stroke="#fecdd3"
              strokeWidth="2.8"
              strokeLinecap="round"
              opacity="0.85"
            />
            {/* Center Tall Cylinder */}
            <rect
              x="56"
              y="22"
              width="28"
              height="68"
              rx="8"
              fill={`url(#scC4Center_${uid})`}
              stroke="#161426"
              strokeWidth="3.8"
            />
            <line
              x1="63"
              y1="28"
              x2="63"
              y2="84"
              stroke="#ffffff"
              strokeWidth="3.2"
              strokeLinecap="round"
              opacity="0.9"
            />
            {/* Tactical Carbon Straps */}
            <rect x="31" y="39" width="78" height="8" rx="3" fill="#161426" />
            <rect x="31" y="69" width="78" height="8" rx="3" fill="#161426" />
            {/* Coiled Detonator Wires */}
            <path
              d="M 43 39 C 37 28, 52 28, 60 45"
              fill="none"
              stroke="#00bbf9"
              strokeWidth="3.2"
              strokeLinecap="round"
            />
            <path
              d="M 97 39 C 103 28, 88 28, 80 45"
              fill="none"
              stroke="#ffca3a"
              strokeWidth="3.2"
              strokeLinecap="round"
            />
            {/* Digital Timer Console */}
            <rect
              x="44"
              y="43"
              width="52"
              height="26"
              rx="6"
              fill="#161426"
              stroke="#ffca3a"
              strokeWidth="3.2"
            />
            <rect
              x="48.5"
              y="47.5"
              width="43"
              height="17"
              rx="3"
              fill="#090d16"
            />
            <text
              x="70"
              y="60"
              textAnchor="middle"
              fill="#ff595e"
              fontSize="13.5"
              fontWeight="900"
              fontFamily="monospace"
            >
              00:01
            </text>
            {/* Braided Fuse & Unclipped Multi-Layer Spark */}
            <path
              d="M 70 22 C 70 11, 86 12, 98 9"
              fill="none"
              stroke="#d97706"
              strokeWidth="5.2"
              strokeLinecap="round"
            />
            <path
              d="M 70 22 C 70 11, 86 12, 98 9"
              fill="none"
              stroke="#161426"
              strokeWidth="2.4"
              strokeDasharray="3.5 3.5"
              strokeLinecap="round"
            />
            <g transform="translate(101, 10)">
              <polygon
                points="0,-10 4,-4 11,-5 6,1 10,8 2,5 -3,10 -4,3 -11,2 -5,-3"
                fill="#ffca3a"
                stroke="#161426"
                strokeWidth="2.5"
                strokeLinejoin="round"
              />
              <circle cx="0" cy="0" r="3.8" fill="#ffffff" />
            </g>
          </g>
        </svg>
      );

    case 'defuse':
      return (
        <svg
          viewBox="0 0 140 108"
          preserveAspectRatio="xMidYMid slice"
          className={className}
        >
          <defs>
            <radialGradient id={`scDefBg_${uid}`} cx="50%" cy="48%" r="68%">
              <stop offset="0%" stopColor="#a7f3d0" />
              <stop offset="55%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#047857" />
            </radialGradient>
            <linearGradient id={`scChrome_${uid}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="50%" stopColor="#e2e8f0" />
              <stop offset="100%" stopColor="#94a3b8" />
            </linearGradient>
            <linearGradient id={`scGripL_${uid}`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#4ade80" />
              <stop offset="55%" stopColor="#22c55e" />
              <stop offset="100%" stopColor="#15803d" />
            </linearGradient>
          </defs>
          <rect width="140" height="108" rx="12" fill={`url(#scDefBg_${uid})`} />
          {/* Bright Radial Rescue Burst */}
          <circle
            cx="68"
            cy="36"
            r="38"
            fill="#ecfdf5"
            opacity="0.22"
          />
          <circle
            cx="68"
            cy="36"
            r="26"
            fill="none"
            stroke="#6ee7b7"
            strokeWidth="2"
            strokeDasharray="5 4"
            opacity="0.7"
          />

          {/* Left Bomb Top-Cap Corner & Snipped Red Cable End (Left) */}
          <path
            d="M 6 33 C 24 33, 40 30, 52 28"
            fill="none"
            stroke="#161426"
            strokeWidth="10"
            strokeLinecap="round"
          />
          <path
            d="M 6 33 C 24 33, 40 30, 52 28"
            fill="none"
            stroke="#f43f5e"
            strokeWidth="5.5"
            strokeLinecap="round"
          />
          <path
            d="M 10 31.5 C 24 31.5, 38 29, 49 27"
            fill="none"
            stroke="#fecdd3"
            strokeWidth="2"
            strokeLinecap="round"
          />
          {/* Frayed Copper Strands on Left Cut End */}
          <path
            d="M 52 28 L 58 23 M 52 28 L 59 28 M 52 28 L 57 33"
            stroke="#ffca3a"
            strokeWidth="2.2"
            strokeLinecap="round"
          />

          {/* Snipped Red Fuse End Recoiling Right */}
          <path
            d="M 80 28 C 96 25, 114 21, 132 18"
            fill="none"
            stroke="#161426"
            strokeWidth="10"
            strokeLinecap="round"
          />
          <path
            d="M 80 28 C 96 25, 114 21, 132 18"
            fill="none"
            stroke="#e11d48"
            strokeWidth="5.5"
            strokeDasharray="6 4"
            strokeLinecap="round"
          />
          <path
            d="M 80 28 L 74 22 M 80 28 L 73 28 M 80 28 L 75 33"
            stroke="#ffca3a"
            strokeWidth="2.2"
            strokeLinecap="round"
          />

          {/* Tilted Dynamic Chrome Wire Cutters (-12 deg) */}
          <g transform="rotate(-12 68 54)">
            {/* Left Beveled Chrome Jaw */}
            <path
              d="M 68 52 L 49 21 C 56 14, 65 18, 68 33 Z"
              fill={`url(#scChrome_${uid})`}
              stroke="#161426"
              strokeWidth="3.6"
              strokeLinejoin="round"
            />
            <path
              d="M 54 23 L 64 42"
              stroke="#ffffff"
              strokeWidth="2.4"
              strokeLinecap="round"
            />
            {/* Right Beveled Chrome Jaw */}
            <path
              d="M 68 52 L 87 21 C 80 14, 71 18, 68 33 Z"
              fill={`url(#scChrome_${uid})`}
              stroke="#161426"
              strokeWidth="3.6"
              strokeLinejoin="round"
            />
            {/* Left Insulated Rubber Handle + Specular Highlight */}
            <path
              d="M 64 55 L 34 96 C 28 103, 41 108, 47 99 L 70 61 Z"
              fill={`url(#scGripL_${uid})`}
              stroke="#161426"
              strokeWidth="3.6"
              strokeLinejoin="round"
            />
            <path
              d="M 61 61 L 39 93"
              stroke="#bbf7d0"
              strokeWidth="3"
              strokeLinecap="round"
            />
            {/* Right Insulated Rubber Handle + Specular Highlight */}
            <path
              d="M 72 55 L 102 96 C 108 103, 95 108, 89 99 L 66 61 Z"
              fill={`url(#scGripL_${uid})`}
              stroke="#161426"
              strokeWidth="3.6"
              strokeLinejoin="round"
            />
            <path
              d="M 75 61 L 97 93"
              stroke="#86efac"
              strokeWidth="2.6"
              strokeLinecap="round"
            />
            {/* Golden Pivot Bolt & Screw Slot */}
            <circle
              cx="68"
              cy="53"
              r="9.5"
              fill="#ffca3a"
              stroke="#161426"
              strokeWidth="3.6"
            />
            <circle cx="68" cy="53" r="4" fill="#fff9ec" />
            <line
              x1="64"
              y1="51"
              x2="72"
              y2="55"
              stroke="#161426"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </g>

          {/* Foreground Multi-Layer Snip Flash at Blade Tips */}
          <g transform="translate(66, 26)">
            <polygon
              points="0,-18 4,-6 17,-8 8,1 15,11 3,7 0,18 -3,7 -15,11 -8,1 -17,-8 -4,-6"
              fill="#00f5d4"
              stroke="#161426"
              strokeWidth="2.6"
              strokeLinejoin="round"
            />
            <polygon
              points="0,-10 3,-3 10,-3 4,2 6,9 0,5 -6,9 -4,2 -10,-3 -3,-3"
              fill="#ffca3a"
            />
            <circle cx="0" cy="0" r="4.5" fill="#ffffff" />
          </g>
        </svg>
      );

    case 'attack':
      return (
        <svg
          viewBox="0 0 140 108"
          preserveAspectRatio="xMidYMid slice"
          className={className}
        >
          <defs>
            <radialGradient id={`scAtkBg_${uid}`} cx="50%" cy="50%" r="68%">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="52%" stopColor="#f97316" />
              <stop offset="100%" stopColor="#b45309" />
            </radialGradient>
            <linearGradient id={`scBolt_${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="50%" stopColor="#ffca3a" />
              <stop offset="100%" stopColor="#f59e0b" />
            </linearGradient>
            <linearGradient id={`scBadge_${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fb7185" />
              <stop offset="45%" stopColor="#e11d48" />
              <stop offset="100%" stopColor="#9f1239" />
            </linearGradient>
          </defs>
          <rect width="140" height="108" rx="12" fill={`url(#scAtkBg_${uid})`} />
          {/* High-Voltage Comic Speed Rays */}
          <g opacity="0.28" fill="#fffbeb">
            <polygon points="70,54 0,10 22,0" />
            <polygon points="70,54 118,0 140,10" />
            <polygon points="70,54 140,85 118,108" />
            <polygon points="70,54 22,108 0,85" />
          </g>
          <ellipse cx="70" cy="96" rx="46" ry="6.5" fill="#161426" opacity="0.3" />

          {/* Back Plane: 2 Fanned Target Cards Being Struck (Matches boomdeck Icon!) */}
          <g transform="rotate(-16 48 56)">
            <rect
              x="26"
              y="26"
              width="36"
              height="50"
              rx="6.5"
              fill="#fff9ec"
              stroke="#161426"
              strokeWidth="3.5"
            />
            <rect
              x="31"
              y="31"
              width="26"
              height="40"
              rx="4"
              fill="#00bbf9"
              stroke="#161426"
              strokeWidth="2"
            />
          </g>
          <g transform="rotate(15 92 56)">
            <rect
              x="78"
              y="26"
              width="36"
              height="50"
              rx="6.5"
              fill="#fff9ec"
              stroke="#161426"
              strokeWidth="3.5"
            />
            <rect
              x="83"
              y="31"
              width="26"
              height="40"
              rx="4"
              fill="#f43f5e"
              stroke="#161426"
              strokeWidth="2"
            />
          </g>

          {/* Middle Plane: Twin 3D Extruded Lightning Bolts */}
          {/* Left Lightning Bolt */}
          <g>
            <polygon
              points="46,9 22,49 41,49 29,88 64,41 44,41"
              transform="translate(0, 4)"
              fill="#161426"
            />
            <polygon
              points="46,9 22,49 41,49 29,88 64,41 44,41"
              fill={`url(#scBolt_${uid})`}
              stroke="#161426"
              strokeWidth="3.5"
              strokeLinejoin="round"
            />
            <polyline
              points="43,16 28,45 42,45"
              fill="none"
              stroke="#ffffff"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
          {/* Right Lightning Bolt */}
          <g>
            <polygon
              points="96,9 72,49 91,49 79,88 114,41 94,41"
              transform="translate(0, 4)"
              fill="#161426"
            />
            <polygon
              points="96,9 72,49 91,49 79,88 114,41 94,41"
              fill={`url(#scBolt_${uid})`}
              stroke="#161426"
              strokeWidth="3.5"
              strokeLinejoin="round"
            />
            <polyline
              points="93,16 78,45 92,45"
              fill="none"
              stroke="#ffffff"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>

          {/* Foreground Plane: 3D Crimson & Gold ×2 Impact Shield Badge */}
          <g transform="translate(70, 62) rotate(-5)">
            <circle cx="0" cy="4" r="22" fill="#161426" />
            <circle
              cx="0"
              cy="0"
              r="22"
              fill={`url(#scBadge_${uid})`}
              stroke="#161426"
              strokeWidth="3.8"
            />
            <path
              d="M -14 -10 A 17 17 0 0 1 14 -10"
              fill="none"
              stroke="#fecdd3"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <circle
              cx="0"
              cy="0"
              r="16.5"
              fill="none"
              stroke="#ffca3a"
              strokeWidth="2.2"
              strokeDasharray="5 3"
            />
            <text
              x="0"
              y="7"
              textAnchor="middle"
              fill="#ffffff"
              stroke="#161426"
              strokeWidth="3.5"
              paintOrder="stroke"
              fontSize="19"
              fontWeight="900"
            >
              ×2
            </text>
          </g>
        </svg>
      );

    case 'skip':
      return (
        <svg
          viewBox="0 0 140 108"
          preserveAspectRatio="xMidYMid slice"
          className={className}
        >
          <defs>
            <linearGradient id={`scSkipBg_${uid}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="55%" stopColor="#0284c7" />
              <stop offset="100%" stopColor="#0369a1" />
            </linearGradient>
            <linearGradient id={`scShoe_${uid}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="55%" stopColor="#00bbf9" />
              <stop offset="100%" stopColor="#0284c7" />
            </linearGradient>
          </defs>
          <rect width="140" height="108" rx="12" fill={`url(#scSkipBg_${uid})`} />
          {/* Supersonic Speed Lines */}
          <line
            x1="10"
            y1="22"
            x2="56"
            y2="22"
            stroke="#bae6fd"
            strokeWidth="3.5"
            strokeLinecap="round"
            opacity="0.8"
          />
          <line
            x1="6"
            y1="38"
            x2="34"
            y2="38"
            stroke="#ffffff"
            strokeWidth="4"
            strokeLinecap="round"
            opacity="0.85"
          />

          {/* Tiny Bomb Left Behind at Bottom-Left (Visualizing "Skipping Danger!") */}
          <g transform="translate(26, 86)">
            <circle
              cx="0"
              cy="0"
              r="11"
              fill="#e11d48"
              stroke="#161426"
              strokeWidth="3"
            />
            <circle cx="-3.5" cy="-3.5" r="3" fill="#fecdd3" />
            <path
              d="M 6 -8 Q 12 -14 16 -10"
              fill="none"
              stroke="#ffca3a"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </g>
          {/* Curved Vault Arc Over the Bomb */}
          <path
            d="M 18 72 Q 56 48 118 78"
            fill="none"
            stroke="#bae6fd"
            strokeWidth="3"
            strokeDasharray="6 5"
            strokeLinecap="round"
          />

          {/* 3-Layer Nitro Rocket Exhaust Flame */}
          <path
            d="M 48 48 L 8 38 L 22 52 L 6 62 L 46 62 Z"
            fill="#e11d48"
            stroke="#161426"
            strokeWidth="3.4"
            strokeLinejoin="round"
          />
          <path
            d="M 46 50 L 18 44 L 27 52 L 16 58 L 45 59 Z"
            fill="#f97316"
          />
          <path
            d="M 45 52 L 28 48 L 33 53 L 26 56 L 44 56 Z"
            fill="#fef08a"
          />

          {/* Sculpted Nitro Winged Sneaker */}
          <g transform="translate(14, -4) rotate(-14 72 54)">
            {/* Chrome Heel Thruster Nozzle */}
            <rect
              x="29"
              y="50"
              width="10"
              height="14"
              rx="3"
              fill="#cbd5e1"
              stroke="#161426"
              strokeWidth="3.2"
            />
            {/* Sneaker Main Body */}
            <path
              d="M 38 34 H 66 L 73 50 L 98 55 C 106 56, 107 69, 98 72 H 36 C 32 72, 32 60, 35 52 Z"
              fill={`url(#scShoe_${uid})`}
              stroke="#161426"
              strokeWidth="3.8"
              strokeLinejoin="round"
            />
            {/* Specular Highlight Along Collar & Instep */}
            <path
              d="M 42 39 H 62 L 68 52"
              fill="none"
              stroke="#bae6fd"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* White Rubber Toe-Cap */}
            <path
              d="M 84 53 L 98 55 C 105 56, 106 68, 98 71 H 82 C 80 63, 81 57, 84 53 Z"
              fill="#ffffff"
              stroke="#161426"
              strokeWidth="3.2"
            />
            {/* Yellow Shoelaces */}
            <line
              x1="67"
              y1="43"
              x2="75"
              y2="41"
              stroke="#ffca3a"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <line
              x1="70"
              y1="49"
              x2="78"
              y2="47"
              stroke="#ffca3a"
              strokeWidth="3"
              strokeLinecap="round"
            />
            {/* Thick Treaded Sole */}
            <rect
              x="33"
              y="68"
              width="70"
              height="9"
              rx="4.5"
              fill="#ffffff"
              stroke="#161426"
              strokeWidth="3.5"
            />
            <line
              x1="46"
              y1="72.5"
              x2="88"
              y2="72.5"
              stroke="#e11d48"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            {/* Sculpted 3-Feather Golden Wing */}
            <path
              d="M 54 50 C 40 38, 26 40, 20 26 C 34 24, 45 28, 53 35 C 46 24, 36 20, 30 11 C 46 11, 60 22, 65 40 Z"
              fill="#ffca3a"
              stroke="#161426"
              strokeWidth="3.4"
              strokeLinejoin="round"
            />
            <path
              d="M 34 18 C 44 20, 53 27, 58 37"
              fill="none"
              stroke="#fef08a"
              strokeWidth="2.4"
              strokeLinecap="round"
            />
          </g>

          {/* Foreground Fast-Forward Chevrons */}
          <g transform="translate(0, 2)">
            <polygon
              points="96,15 112,27 96,39"
              fill="#ffca3a"
              stroke="#161426"
              strokeWidth="3.2"
              strokeLinejoin="round"
            />
            <polygon
              points="111,15 127,27 111,39"
              fill="#ffffff"
              stroke="#161426"
              strokeWidth="3.2"
              strokeLinejoin="round"
            />
          </g>
        </svg>
      );

    case 'reverse':
      return (
        <svg
          viewBox="0 0 140 108"
          preserveAspectRatio="xMidYMid slice"
          className={className}
        >
          <defs>
            <radialGradient id={`scRevBg_${uid}`} cx="50%" cy="50%" r="68%">
              <stop offset="0%" stopColor="#d8b4fe" />
              <stop offset="52%" stopColor="#9333ea" />
              <stop offset="100%" stopColor="#581c87" />
            </radialGradient>
            <linearGradient id={`scRevGold_${uid}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="50%" stopColor="#ffca3a" />
              <stop offset="100%" stopColor="#f59e0b" />
            </linearGradient>
            <linearGradient id={`scRevCyan_${uid}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#cffafe" />
              <stop offset="50%" stopColor="#00f5d4" />
              <stop offset="100%" stopColor="#00bbf9" />
            </linearGradient>
          </defs>
          <rect width="140" height="108" rx="12" fill={`url(#scRevBg_${uid})`} />

          {/* Tilted Cosmic Orbit Track & Mini Orbiting Cards */}
          <ellipse
            cx="70"
            cy="54"
            rx="50"
            ry="37"
            transform="rotate(-16 70 54)"
            fill="#3b0764"
            stroke="#e9d5ff"
            strokeWidth="2.5"
            strokeDasharray="6 4"
            opacity="0.7"
          />
          {/* Mini Orbiting Card Top-Left */}
          <g transform="translate(22, 24) rotate(-25)">
            <rect
              x="-9"
              y="-12"
              width="18"
              height="24"
              rx="3.5"
              fill="#f43f5e"
              stroke="#161426"
              strokeWidth="2.8"
            />
            <circle cx="0" cy="0" r="4" fill="#ffca3a" />
          </g>
          {/* Mini Orbiting Card Bottom-Right */}
          <g transform="translate(118, 84) rotate(25)">
            <rect
              x="-9"
              y="-12"
              width="18"
              height="24"
              rx="3.5"
              fill="#00bbf9"
              stroke="#161426"
              strokeWidth="2.8"
            />
            <circle cx="0" cy="0" r="4" fill="#ffffff" />
          </g>

          {/* 3D Extruded Interlocking Curved Arrows */}
          <g transform="rotate(-16 70 54)">
            {/* Top Arrow 3D Extrusion Shadow */}
            <path
              d="M 34 52 C 34 24, 76 18, 92 34 L 101 24 L 109 52 L 81 47 L 89 39 C 76 29, 50 33, 50 52 Z"
              transform="translate(0, 4.5)"
              fill="#161426"
            />
            {/* Top Arrow (Golden Gradient + White Specular Highlight) */}
            <path
              d="M 34 52 C 34 24, 76 18, 92 34 L 101 24 L 109 52 L 81 47 L 89 39 C 76 29, 50 33, 50 52 Z"
              fill={`url(#scRevGold_${uid})`}
              stroke="#161426"
              strokeWidth="3.6"
              strokeLinejoin="round"
            />
            <path
              d="M 40 46 C 42 30, 68 25, 86 35"
              fill="none"
              stroke="#ffffff"
              strokeWidth="2.8"
              strokeLinecap="round"
            />

            {/* Bottom Arrow (180-Degree Symmetry — Electric Cyan Gradient + Specular Highlight) */}
            <g transform="rotate(180 70 54)">
              <path
                d="M 34 52 C 34 24, 76 18, 92 34 L 101 24 L 109 52 L 81 47 L 89 39 C 76 29, 50 33, 50 52 Z"
                transform="translate(0, -4.5)"
                fill="#161426"
              />
              <path
                d="M 34 52 C 34 24, 76 18, 92 34 L 101 24 L 109 52 L 81 47 L 89 39 C 76 29, 50 33, 50 52 Z"
                fill={`url(#scRevCyan_${uid})`}
                stroke="#161426"
                strokeWidth="3.6"
                strokeLinejoin="round"
              />
              <path
                d="M 40 46 C 42 30, 68 25, 86 35"
                fill="none"
                stroke="#ffffff"
                strokeWidth="2.8"
                strokeLinecap="round"
              />
            </g>
          </g>

          {/* Central Vortex Star-Gem */}
          <polygon
            points="70,42 73.5,50.5 82,54 73.5,57.5 70,66 66.5,57.5 58,54 66.5,50.5"
            fill="#ffca3a"
            stroke="#161426"
            strokeWidth="2.8"
            strokeLinejoin="round"
          />
          <circle cx="70" cy="54" r="3.2" fill="#ffffff" />
        </svg>
      );

    case 'radar':
      return (
        <svg
          viewBox="0 0 140 108"
          preserveAspectRatio="xMidYMid slice"
          className={className}
        >
          <defs>
            <radialGradient id={`scRadBg_${uid}`} cx="50%" cy="48%" r="70%">
              <stop offset="0%" stopColor="#f472b6" />
              <stop offset="52%" stopColor="#db2777" />
              <stop offset="100%" stopColor="#4c1d95" />
            </radialGradient>
            <linearGradient id={`scBeam_${uid}`} x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor="#00f5d4" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#00f5d4" stopOpacity="0.08" />
            </linearGradient>
          </defs>
          <rect width="140" height="108" rx="12" fill={`url(#scRadBg_${uid})`} />
          {/* Radar Grid Rings */}
          <circle
            cx="70"
            cy="44"
            r="44"
            fill="none"
            stroke="#00f5d4"
            strokeWidth="1.6"
            opacity="0.35"
          />
          <circle
            cx="70"
            cy="44"
            r="28"
            fill="none"
            stroke="#00f5d4"
            strokeWidth="1.6"
            strokeDasharray="5 4"
            opacity="0.55"
          />

          {/* 3 Fanned Collectible Cards Under X-Ray Inspection */}
          <g transform="rotate(-16 40 44)">
            <rect
              x="22"
              y="18"
              width="30"
              height="42"
              rx="5.5"
              fill="#fff9ec"
              stroke="#161426"
              strokeWidth="3.4"
            />
            <rect
              x="26"
              y="22"
              width="22"
              height="34"
              rx="3.5"
              fill="#00bbf9"
              stroke="#161426"
              strokeWidth="1.8"
            />
            <text
              x="37"
              y="44"
              textAnchor="middle"
              fill="#ffffff"
              fontSize="13"
              fontWeight="900"
            >
              #1
            </text>
          </g>
          <g transform="rotate(16 100 44)">
            <rect
              x="88"
              y="18"
              width="30"
              height="42"
              rx="5.5"
              fill="#fff9ec"
              stroke="#161426"
              strokeWidth="3.4"
            />
            <rect
              x="92"
              y="22"
              width="22"
              height="34"
              rx="3.5"
              fill="#22c55e"
              stroke="#161426"
              strokeWidth="1.8"
            />
            <text
              x="103"
              y="44"
              textAnchor="middle"
              fill="#ffffff"
              fontSize="13"
              fontWeight="900"
            >
              #3
            </text>
          </g>

          {/* Center Card Revealed by X-Ray (Showing Hidden C4 Stick Inside!) */}
          <rect
            x="52"
            y="11"
            width="36"
            height="48"
            rx="6"
            fill="#090d16"
            stroke="#00f5d4"
            strokeWidth="3.5"
          />
          {/* Mini C4 Dynamite Detected Inside Center Card */}
          <rect
            x="63"
            y="20"
            width="14"
            height="30"
            rx="4"
            fill="#e11d48"
            stroke="#ffca3a"
            strokeWidth="2"
          />
          <rect
            x="61"
            y="30"
            width="18"
            height="10"
            rx="2"
            fill="#161426"
            stroke="#ffca3a"
            strokeWidth="1.5"
          />
          <circle cx="70" cy="35" r="2.5" fill="#ff595e" />

          {/* Translucent Cyan X-Ray Scanner Beam Cone from Visor */}
          <polygon
            points="44,68 96,68 124,14 16,14"
            fill={`url(#scBeam_${uid})`}
          />
          {/* Horizontal Laser Scan Line + Corner Target Reticles */}
          <line
            x1="18"
            y1="34"
            x2="122"
            y2="34"
            stroke="#00f5d4"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          <line
            x1="28"
            y1="34"
            x2="112"
            y2="34"
            stroke="#ffffff"
            strokeWidth="1.6"
            strokeLinecap="round"
          />

          {/* Foreground Cybernetic X-Ray Visor Goggles */}
          <g transform="translate(0, 2)">
            <rect
              x="28"
              y="62"
              width="84"
              height="30"
              rx="15"
              fill="#161426"
              stroke="#ffca3a"
              strokeWidth="3.6"
            />
            <circle
              cx="51"
              cy="77"
              r="10.5"
              fill="#00f5d4"
              stroke="#161426"
              strokeWidth="2.6"
            />
            <circle
              cx="89"
              cy="77"
              r="10.5"
              fill="#00f5d4"
              stroke="#161426"
              strokeWidth="2.6"
            />
            <circle cx="47.5" cy="73.5" r="3.5" fill="#ffffff" />
            <circle cx="85.5" cy="73.5" r="3.5" fill="#ffffff" />
          </g>
        </svg>
      );

    case 'shuffle':
      return (
        <svg
          viewBox="0 0 140 108"
          preserveAspectRatio="xMidYMid slice"
          className={className}
        >
          <defs>
            <radialGradient id={`scShufBg_${uid}`} cx="50%" cy="50%" r="68%">
              <stop offset="0%" stopColor="#99f6e4" />
              <stop offset="55%" stopColor="#14b8a6" />
              <stop offset="100%" stopColor="#0f766e" />
            </radialGradient>
          </defs>
          <rect width="140" height="108" rx="12" fill={`url(#scShufBg_${uid})`} />

          {/* Back Cyclone Swirl Ribbon (Passes Behind Cards) */}
          <path
            d="M 16 34 C 46 14, 94 14, 124 34"
            fill="none"
            stroke="#161426"
            strokeWidth="9"
            strokeLinecap="round"
          />
          <path
            d="M 16 34 C 46 14, 94 14, 124 34"
            fill="none"
            stroke="#ffca3a"
            strokeWidth="4.5"
            strokeLinecap="round"
          />

          {/* 4 Swirling Collectible Boom Cards */}
          <g transform="rotate(-24 36 46)">
            <rect
              x="20"
              y="22"
              width="30"
              height="42"
              rx="5.5"
              fill="#fff9ec"
              stroke="#161426"
              strokeWidth="3.4"
            />
            <rect
              x="24"
              y="26"
              width="22"
              height="34"
              rx="3.5"
              fill="#ffca3a"
              stroke="#161426"
              strokeWidth="2"
            />
            <circle cx="35" cy="43" r="5" fill="#e11d48" />
          </g>
          <g transform="rotate(24 104 46)">
            <rect
              x="90"
              y="22"
              width="30"
              height="42"
              rx="5.5"
              fill="#fff9ec"
              stroke="#161426"
              strokeWidth="3.4"
            />
            <rect
              x="94"
              y="26"
              width="22"
              height="34"
              rx="3.5"
              fill="#00bbf9"
              stroke="#161426"
              strokeWidth="2"
            />
            <circle cx="105" cy="43" r="5" fill="#ffffff" />
          </g>
          <g transform="rotate(-8 60 52)">
            <rect
              x="44"
              y="26"
              width="32"
              height="44"
              rx="6"
              fill="#fff9ec"
              stroke="#161426"
              strokeWidth="3.5"
            />
            <rect
              x="48.5"
              y="30.5"
              width="23"
              height="35"
              rx="3.5"
              fill="#f43f5e"
              stroke="#161426"
              strokeWidth="2"
            />
          </g>
          <g transform="rotate(10 80 50)">
            <rect
              x="62"
              y="24"
              width="34"
              height="46"
              rx="6"
              fill="#fff9ec"
              stroke="#161426"
              strokeWidth="3.6"
            />
            <rect
              x="66.5"
              y="28.5"
              width="25"
              height="37"
              rx="4"
              fill="#a855f7"
              stroke="#161426"
              strokeWidth="2"
            />
            <polygon
              points="79,37 82,44 90,44 84,49 86,56 79,51 72,56 74,49 68,44 76,44"
              fill="#ffca3a"
              stroke="#161426"
              strokeWidth="1.6"
            />
          </g>

          {/* Front Cyclone Swirl Ribbon (Wraps Across the Front of Cards!) */}
          <path
            d="M 16 64 C 48 88, 92 88, 122 58"
            fill="none"
            stroke="#161426"
            strokeWidth="10"
            strokeLinecap="round"
          />
          <path
            d="M 16 64 C 48 88, 92 88, 122 58"
            fill="none"
            stroke="#00f5d4"
            strokeWidth="5"
            strokeLinecap="round"
          />
          <path
            d="M 24 67 C 52 84, 88 84, 114 62"
            fill="none"
            stroke="#ffffff"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <polygon
            points="126,52 114,55 123,66"
            fill="#00f5d4"
            stroke="#161426"
            strokeWidth="2.8"
            strokeLinejoin="round"
          />
        </svg>
      );

    case 'magnet':
      return (
        <svg
          viewBox="0 0 140 108"
          preserveAspectRatio="xMidYMid slice"
          className={className}
        >
          <defs>
            <radialGradient id={`scMagBg_${uid}`} cx="50%" cy="50%" r="68%">
              <stop offset="0%" stopColor="#fde047" />
              <stop offset="55%" stopColor="#f97316" />
              <stop offset="100%" stopColor="#c2410c" />
            </radialGradient>
            <linearGradient id={`scMagBody_${uid}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#fb7185" />
              <stop offset="45%" stopColor="#e11d48" />
              <stop offset="100%" stopColor="#9f1239" />
            </linearGradient>
          </defs>
          <rect width="140" height="108" rx="12" fill={`url(#scMagBg_${uid})`} />

          {/* Curved Cyan Tractor-Beam Wave Rings Pulling Card In */}
          <path
            d="M 68 24 Q 84 36 74 52"
            fill="none"
            stroke="#00f5d4"
            strokeWidth="3.2"
            strokeLinecap="round"
          />
          <path
            d="M 80 18 Q 98 34 86 54"
            fill="none"
            stroke="#00f5d4"
            strokeWidth="3.2"
            strokeDasharray="5 4"
            strokeLinecap="round"
          />

          {/* Stolen Collectible Card Being Yanked From Top-Right */}
          <g transform="translate(96, 30) rotate(24)">
            <rect
              x="-16"
              y="-22"
              width="32"
              height="44"
              rx="5.5"
              fill="#fff9ec"
              stroke="#161426"
              strokeWidth="3.5"
            />
            <rect
              x="-11.5"
              y="-17.5"
              width="23"
              height="35"
              rx="3.5"
              fill="#ffca3a"
              stroke="#161426"
              strokeWidth="2"
            />
            <polygon
              points="0,-9 3,-2 10,-2 4,3 6,10 0,5 -6,10 -4,3 -10,-2 -3,-2"
              fill="#e11d48"
            />
          </g>

          {/* Dynamic Tilted 3D Horseshoe Magnet (-28 deg) */}
          <g transform="translate(52, 60) rotate(-28)">
            {/* 3D Extrusion Shadow */}
            <path
              d="M -30 -16 V 10 A 30 26 0 0 0 30 10 V -16 H 12 V 10 A 12 10 0 0 1 -12 10 V -16 Z"
              transform="translate(0, 4.5)"
              fill="#161426"
            />
            {/* Red U-Magnet Body */}
            <path
              d="M -30 -16 V 10 A 30 26 0 0 0 30 10 V -16 H 12 V 10 A 12 10 0 0 1 -12 10 V -16 Z"
              fill={`url(#scMagBody_${uid})`}
              stroke="#161426"
              strokeWidth="3.8"
              strokeLinejoin="round"
            />
            {/* Inner Specular Highlight Arc */}
            <path
              d="M -24 -6 V 9 A 24 20 0 0 0 6 27"
              fill="none"
              stroke="#fecdd3"
              strokeWidth="3"
              strokeLinecap="round"
            />
            {/* Silver Chrome Polarity Tips */}
            <rect
              x="-30"
              y="-28"
              width="18"
              height="13"
              rx="2.5"
              fill="#f8fafc"
              stroke="#161426"
              strokeWidth="3.5"
            />
            <rect
              x="12"
              y="-28"
              width="18"
              height="13"
              rx="2.5"
              fill="#e2e8f0"
              stroke="#161426"
              strokeWidth="3.5"
            />
          </g>

          {/* Electric Cyan Spark Bolts at Magnet Poles */}
          <polygon
            points="64,14 56,26 65,26 58,38 74,23 65,23"
            fill="#00f5d4"
            stroke="#161426"
            strokeWidth="2.4"
            strokeLinejoin="round"
          />
        </svg>
      );

    case 'combo_shawarma':
      return (
        <svg
          viewBox="0 0 140 108"
          preserveAspectRatio="xMidYMid slice"
          className={className}
        >
          <defs>
            <radialGradient id={`scShawBg_${uid}`} cx="50%" cy="50%" r="68%">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="55%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#b45309" />
            </radialGradient>
            <linearGradient id={`scMeat_${uid}`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#f59e0b" />
              <stop offset="45%" stopColor="#d97706" />
              <stop offset="100%" stopColor="#92400e" />
            </linearGradient>
          </defs>
          <rect width="140" height="108" rx="12" fill={`url(#scShawBg_${uid})`} />
          <ellipse cx="70" cy="96" rx="42" ry="6" fill="#161426" opacity="0.3" />

          {/* Chrome Rotisserie Base & Vertical Spit Rod */}
          <line
            x1="70"
            y1="7"
            x2="70"
            y2="90"
            stroke="#161426"
            strokeWidth="6"
            strokeLinecap="round"
          />
          <line
            x1="69"
            y1="9"
            x2="69"
            y2="88"
            stroke="#e2e8f0"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <ellipse
            cx="70"
            cy="90"
            rx="32"
            ry="7"
            fill="#cbd5e1"
            stroke="#161426"
            strokeWidth="3.5"
          />

          {/* Sculpted Scalloped Shawarma Meat Cone */}
          <path
            d="M 42 24 C 37 30, 44 36, 40 42 C 37 48, 45 54, 42 60 C 40 66, 48 72, 46 78 C 56 83, 84 83, 94 78 C 92 72, 100 66, 98 60 C 95 54, 103 48, 100 42 C 96 36, 103 30, 98 24 Z"
            fill={`url(#scMeat_${uid})`}
            stroke="#161426"
            strokeWidth="3.6"
            strokeLinejoin="round"
          />
          {/* Sizzling Golden Roasted Glaze Streaks */}
          <path
            d="M 46 33 Q 70 40 94 33"
            fill="none"
            stroke="#fde047"
            strokeWidth="3.8"
            strokeLinecap="round"
          />
          <path
            d="M 48 48 Q 70 55 92 48"
            fill="none"
            stroke="#fed7aa"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <path
            d="M 51 63 Q 70 70 89 63"
            fill="none"
            stroke="#fde047"
            strokeWidth="3.8"
            strokeLinecap="round"
          />

          {/* Roasted Tomato & Green Pepper Crown */}
          <ellipse
            cx="70"
            cy="21"
            rx="18"
            ry="6.5"
            fill="#e11d48"
            stroke="#161426"
            strokeWidth="3.4"
          />
          <path
            d="M 58 20 Q 70 24 82 20"
            fill="none"
            stroke="#fecdd3"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <path
            d="M 64 15 C 66 10, 74 10, 76 15"
            fill="#22c55e"
            stroke="#161426"
            strokeWidth="2.8"
            strokeLinejoin="round"
          />

          {/* Gleaming Chef Carving Knife Slicing on the Right */}
          <g transform="translate(106, 52) rotate(-28)">
            <path
              d="M -4 -26 C 4 -22, 6 4, 2 14 L -4 14 Z"
              fill="#f8fafc"
              stroke="#161426"
              strokeWidth="3"
              strokeLinejoin="round"
            />
            <rect
              x="-5.5"
              y="14"
              width="9"
              height="14"
              rx="3"
              fill="#e11d48"
              stroke="#161426"
              strokeWidth="2.8"
            />
          </g>

          {/* Golden Aroma Sparkle */}
          <polygon
            points="24,36 27,43 34,43 28,47 30,54 24,50 18,54 20,47 14,43 21,43"
            fill="#ffca3a"
            stroke="#161426"
            strokeWidth="2.2"
          />
        </svg>
      );

    case 'combo_kabsa':
      return (
        <svg
          viewBox="0 0 140 108"
          preserveAspectRatio="xMidYMid slice"
          className={className}
        >
          <defs>
            <radialGradient id={`scKabBg_${uid}`} cx="50%" cy="50%" r="68%">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="55%" stopColor="#f97316" />
              <stop offset="100%" stopColor="#c2410c" />
            </radialGradient>
            <linearGradient id={`scRice_${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="55%" stopColor="#facc15" />
              <stop offset="100%" stopColor="#eab308" />
            </linearGradient>
            <linearGradient id={`scDrum_${uid}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#f97316" />
              <stop offset="50%" stopColor="#c2410c" />
              <stop offset="100%" stopColor="#7c2d12" />
            </linearGradient>
          </defs>
          <rect width="140" height="108" rx="12" fill={`url(#scKabBg_${uid})`} />
          <ellipse cx="70" cy="94" rx="52" ry="7.5" fill="#161426" opacity="0.32" />

          {/* Ornate Royal Silver Platter (Sahan) */}
          <ellipse
            cx="70"
            cy="78"
            rx="54"
            ry="15"
            fill="#f8fafc"
            stroke="#161426"
            strokeWidth="3.8"
          />
          <ellipse
            cx="70"
            cy="78"
            rx="46"
            ry="11"
            fill="#cbd5e1"
            stroke="#161426"
            strokeWidth="2"
          />

          {/* Fluffy Scalloped Mound of Golden Saffron Rice */}
          <path
            d="M 24 75 C 24 54, 42 40, 56 42 C 64 34, 76 34, 84 42 C 98 40, 116 54, 116 75 C 94 83, 46 83, 24 75 Z"
            fill={`url(#scRice_${uid})`}
            stroke="#161426"
            strokeWidth="3.6"
            strokeLinejoin="round"
          />
          <path
            d="M 36 62 Q 52 54 66 60"
            fill="none"
            stroke="#ffffff"
            strokeWidth="2.8"
            strokeLinecap="round"
            opacity="0.85"
          />

          {/* Left Roasted Chicken Drumstick (Angled Outward with Bone Knuckles!) */}
          <g transform="translate(50, 44) rotate(-26)">
            <rect
              x="-24"
              y="-3.5"
              width="14"
              height="7"
              rx="3"
              fill="#fffbeb"
              stroke="#161426"
              strokeWidth="2.8"
            />
            <circle
              cx="-25"
              cy="-3.5"
              r="4"
              fill="#fffbeb"
              stroke="#161426"
              strokeWidth="2.6"
            />
            <circle
              cx="-25"
              cy="3.5"
              r="4"
              fill="#fffbeb"
              stroke="#161426"
              strokeWidth="2.6"
            />
            <path
              d="M -12 -5 C -2 -12, 18 -11, 18 0 C 18 11, -2 12, -12 5 Z"
              fill={`url(#scDrum_${uid})`}
              stroke="#161426"
              strokeWidth="3.4"
            />
            <path
              d="M -4 -5 Q 6 -8 12 -3"
              fill="none"
              stroke="#fed7aa"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </g>

          {/* Right Roasted Chicken Drumstick (Angled Outward with Bone Knuckles!) */}
          <g transform="translate(90, 44) rotate(26) scale(-1, 1)">
            <rect
              x="-24"
              y="-3.5"
              width="14"
              height="7"
              rx="3"
              fill="#fffbeb"
              stroke="#161426"
              strokeWidth="2.8"
            />
            <circle
              cx="-25"
              cy="-3.5"
              r="4"
              fill="#fffbeb"
              stroke="#161426"
              strokeWidth="2.6"
            />
            <circle
              cx="-25"
              cy="3.5"
              r="4"
              fill="#fffbeb"
              stroke="#161426"
              strokeWidth="2.6"
            />
            <path
              d="M -12 -5 C -2 -12, 18 -11, 18 0 C 18 11, -2 12, -12 5 Z"
              fill={`url(#scDrum_${uid})`}
              stroke="#161426"
              strokeWidth="3.4"
            />
            <path
              d="M -4 -5 Q 6 -8 12 -3"
              fill="none"
              stroke="#fed7aa"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </g>

          {/* Toasted Almonds, Raisins, Red Chili & Steam Wisps */}
          <ellipse
            cx="50"
            cy="68"
            rx="5"
            ry="2.8"
            fill="#fffbeb"
            stroke="#161426"
            strokeWidth="2"
          />
          <ellipse
            cx="90"
            cy="68"
            rx="5"
            ry="2.8"
            fill="#fffbeb"
            stroke="#161426"
            strokeWidth="2"
          />
          <path
            d="M 62 66 Q 70 72 78 65"
            fill="none"
            stroke="#e11d48"
            strokeWidth="4.5"
            strokeLinecap="round"
          />
          <path
            d="M 52 24 Q 47 15 54 8"
            fill="none"
            stroke="#ffffff"
            strokeWidth="3.2"
            strokeLinecap="round"
            opacity="0.9"
          />
          <path
            d="M 88 24 Q 93 15 86 8"
            fill="none"
            stroke="#ffffff"
            strokeWidth="3.2"
            strokeLinecap="round"
            opacity="0.9"
          />
        </svg>
      );

    case 'combo_karak':
      return (
        <svg
          viewBox="0 0 140 108"
          preserveAspectRatio="xMidYMid slice"
          className={className}
        >
          <defs>
            <radialGradient id={`scKrkBg_${uid}`} cx="50%" cy="50%" r="68%">
              <stop offset="0%" stopColor="#f3e8ff" />
              <stop offset="55%" stopColor="#a855f7" />
              <stop offset="100%" stopColor="#581c87" />
            </radialGradient>
            <linearGradient id={`scGoldDallah_${uid}`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="45%" stopColor="#ffca3a" />
              <stop offset="100%" stopColor="#d97706" />
            </linearGradient>
          </defs>
          <rect width="140" height="108" rx="12" fill={`url(#scKrkBg_${uid})`} />
          <ellipse cx="72" cy="96" rx="46" ry="6.5" fill="#161426" opacity="0.3" />

          {/* Warm Spiced Karak Stream Pouring from Beak into Cup */}
          <path
            d="M 27 36 Q 22 54 28 70"
            fill="none"
            stroke="#161426"
            strokeWidth="7"
            strokeLinecap="round"
          />
          <path
            d="M 27 36 Q 22 54 28 70"
            fill="none"
            stroke="#d97706"
            strokeWidth="3.8"
            strokeLinecap="round"
          />

          {/* Glass Istikana Karak Cup on Left */}
          <g transform="translate(28, 78)">
            <path
              d="M -11 -14 H 11 L 8 12 C 8 15, -8 15, -8 12 Z"
              fill="#fed7aa"
              stroke="#161426"
              strokeWidth="3.2"
              strokeLinejoin="round"
            />
            <path
              d="M -9 -8 H 9 L 7 10 H -7 Z"
              fill="#c2410c"
            />
            <line
              x1="-6"
              y1="-5"
              x2="-5"
              y2="7"
              stroke="#ffffff"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
          </g>

          {/* Authentic Pinched-Waist Golden Dallah (Arabic Coffee/Karak Pot) */}
          <g transform="translate(6, 0)">
            {/* Curved S-Handle */}
            <path
              d="M 88 34 C 108 32, 110 66, 88 70"
              fill="none"
              stroke="#161426"
              strokeWidth="9"
              strokeLinecap="round"
            />
            <path
              d="M 88 34 C 108 32, 110 66, 88 70"
              fill="none"
              stroke="#ffca3a"
              strokeWidth="4.5"
              strokeLinecap="round"
            />
            {/* Prominent Curved Crescent Spout (Beak) */}
            <path
              d="M 52 34 C 36 34, 26 26, 20 35 C 28 45, 38 46, 50 48 Z"
              fill={`url(#scGoldDallah_${uid})`}
              stroke="#161426"
              strokeWidth="3.5"
              strokeLinejoin="round"
            />
            {/* Hourglass Pinched Waist & Bulbous Lower Belly */}
            <path
              d="M 50 28 H 86 C 84 42, 80 48, 84 56 C 90 68, 96 80, 90 88 C 82 94, 54 94, 46 88 C 40 80, 46 68, 52 56 C 56 48, 52 42, 50 28 Z"
              fill={`url(#scGoldDallah_${uid})`}
              stroke="#161426"
              strokeWidth="3.8"
              strokeLinejoin="round"
            />
            {/* Engraved Collar Band */}
            <path
              d="M 52 52 Q 68 56 84 52"
              fill="none"
              stroke="#161426"
              strokeWidth="3"
              strokeLinecap="round"
            />
            {/* Vertical Specular Highlight Along Left Belly */}
            <path
              d="M 55 34 C 57 46, 53 60, 50 78"
              fill="none"
              stroke="#ffffff"
              strokeWidth="3"
              strokeLinecap="round"
              opacity="0.88"
            />
            {/* Tiered Spire Lid & Finial Gem */}
            <path
              d="M 52 28 C 54 14, 82 14, 84 28 Z"
              fill="#fde047"
              stroke="#161426"
              strokeWidth="3.5"
            />
            <circle
              cx="68"
              cy="12"
              r="5"
              fill="#e11d48"
              stroke="#161426"
              strokeWidth="2.8"
            />
            {/* Center Turquoise Diamond Jewel */}
            <polygon
              points="68,60 75,70 68,80 61,70"
              fill="#00f5d4"
              stroke="#161426"
              strokeWidth="2.8"
              strokeLinejoin="round"
            />
          </g>
        </svg>
      );

    case 'combo_falcon':
      return (
        <svg
          viewBox="0 0 140 108"
          preserveAspectRatio="xMidYMid slice"
          className={className}
        >
          <defs>
            <radialGradient id={`scFlcBg_${uid}`} cx="50%" cy="50%" r="68%">
              <stop offset="0%" stopColor="#d9f99d" />
              <stop offset="55%" stopColor="#65a30d" />
              <stop offset="100%" stopColor="#365314" />
            </radialGradient>
            <linearGradient id={`scWing_${uid}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="50%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#b45309" />
            </linearGradient>
          </defs>
          <rect width="140" height="108" rx="12" fill={`url(#scFlcBg_${uid})`} />

          {/* Royal Emblem Shield Behind Falcon */}
          <circle
            cx="70"
            cy="56"
            r="39"
            fill="#161426"
            stroke="#ffca3a"
            strokeWidth="3.8"
          />
          <circle
            cx="70"
            cy="56"
            r="33"
            fill="none"
            stroke="#fde047"
            strokeWidth="1.6"
            strokeDasharray="5 4"
            opacity="0.65"
          />

          {/* Sculpted 3-Tiered Feathered Golden Wings */}
          <path
            d="M 70 60 L 10 22 L 22 44 L 14 58 L 28 70 L 70 76 Z"
            fill={`url(#scWing_${uid})`}
            stroke="#161426"
            strokeWidth="3.6"
            strokeLinejoin="round"
          />
          <path
            d="M 70 60 L 130 22 L 118 44 L 126 58 L 112 70 L 70 76 Z"
            fill={`url(#scWing_${uid})`}
            stroke="#161426"
            strokeWidth="3.6"
            strokeLinejoin="round"
          />
          {/* Wing Feather Specular Ridges */}
          <path
            d="M 20 30 L 48 50 M 118 30 L 92 50"
            stroke="#fef08a"
            strokeWidth="2.8"
            strokeLinecap="round"
          />

          {/* Sculpted Falcon Crest Head & Crown Tuft */}
          <path
            d="M 48 48 C 48 26, 62 20, 70 15 C 78 20, 92 26, 92 48 C 92 66, 82 78, 70 78 C 58 78, 48 66, 48 48 Z"
            fill="#fffbeb"
            stroke="#161426"
            strokeWidth="3.8"
            strokeLinejoin="round"
          />
          {/* Brown Falcon Crown Cap */}
          <path
            d="M 50 40 C 52 24, 63 20, 70 15 C 77 20, 88 24, 90 40 Q 70 34 50 40 Z"
            fill="#b45309"
            stroke="#161426"
            strokeWidth="3.2"
            strokeLinejoin="round"
          />

          {/* Sleek Cyan Tactical Aviator Visor + Diagonal White Glare */}
          <path
            d="M 46 38 L 70 43 L 94 38 L 90 52 L 70 49 L 50 52 Z"
            fill="#00f5d4"
            stroke="#161426"
            strokeWidth="3.4"
            strokeLinejoin="round"
          />
          <line
            x1="54"
            y1="41"
            x2="60"
            y2="49"
            stroke="#ffffff"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <line
            x1="78"
            y1="41"
            x2="84"
            y2="49"
            stroke="#ffffff"
            strokeWidth="3"
            strokeLinecap="round"
          />

          {/* Fierce Hooked Golden Raptor Beak with Dark Tip */}
          <path
            d="M 60 50 Q 70 44 80 50 L 74 70 Q 70 76 66 70 Z"
            fill="#ffca3a"
            stroke="#161426"
            strokeWidth="3.4"
            strokeLinejoin="round"
          />
          <path
            d="M 66 64 L 74 64 L 72 71 Q 70 74 68 71 Z"
            fill="#161426"
          />
        </svg>
      );

    case 'block':
    default:
      return (
        <svg
          viewBox="0 0 140 108"
          preserveAspectRatio="xMidYMid slice"
          className={className}
        >
          <defs>
            <radialGradient id={`scBlkBg_${uid}`} cx="50%" cy="50%" r="68%">
              <stop offset="0%" stopColor="#fecdd3" />
              <stop offset="55%" stopColor="#e11d48" />
              <stop offset="100%" stopColor="#9f1239" />
            </radialGradient>
            <linearGradient id={`scShield_${uid}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#fb7185" />
              <stop offset="45%" stopColor="#e11d48" />
              <stop offset="100%" stopColor="#be123c" />
            </linearGradient>
          </defs>
          <rect width="140" height="108" rx="12" fill={`url(#scBlkBg_${uid})`} />

          {/* Back Plane: Opponent's Card Being Slammed & Cancelled */}
          <g transform="rotate(18 82 54)">
            <rect
              x="64"
              y="18"
              width="42"
              height="58"
              rx="6.5"
              fill="#fde047"
              stroke="#161426"
              strokeWidth="3.4"
            />
          </g>

          {/* Middle & Foreground Plane: Heavy 3D Octagonal Stop-Shield (-5 deg) */}
          <g transform="rotate(-5 68 54)">
            {/* 3D Extruded Drop Base */}
            <polygon
              points="48,10 88,10 112,34 112,74 88,98 48,98 24,74 24,34"
              transform="translate(0, 5)"
              fill="#161426"
            />
            {/* Main Crimson Octagon Shield */}
            <polygon
              points="48,10 88,10 112,34 112,74 88,98 48,98 24,74 24,34"
              fill={`url(#scShield_${uid})`}
              stroke="#161426"
              strokeWidth="4"
              strokeLinejoin="round"
            />
            {/* Crisp Inner Specular Bevel */}
            <polygon
              points="51,16 85,16 106,37 106,71 85,92 51,92 30,71 30,37"
              fill="none"
              stroke="#ffe4e6"
              strokeWidth="2.4"
              strokeLinejoin="round"
            />
            {/* Corner Gold Rivets */}
            <circle cx="51" cy="21" r="2.8" fill="#ffca3a" stroke="#161426" strokeWidth="1.6" />
            <circle cx="85" cy="21" r="2.8" fill="#ffca3a" stroke="#161426" strokeWidth="1.6" />
            <circle cx="51" cy="87" r="2.8" fill="#ffca3a" stroke="#161426" strokeWidth="1.6" />
            <circle cx="85" cy="87" r="2.8" fill="#ffca3a" stroke="#161426" strokeWidth="1.6" />

            {/* Central Cream Medallion + Bold 3D Extruded Cancel X */}
            <circle
              cx="68"
              cy="54"
              r="24"
              fill="#fff9ec"
              stroke="#161426"
              strokeWidth="3.8"
            />
            <path
              d="M 55 41 L 81 67 M 81 41 L 55 67"
              stroke="#161426"
              strokeWidth="12"
              strokeLinecap="round"
            />
            <path
              d="M 55 41 L 81 67 M 81 41 L 55 67"
              stroke="#ffca3a"
              strokeWidth="6"
              strokeLinecap="round"
            />
            <path
              d="M 57 40 L 66 49 M 79 40 L 70 49"
              stroke="#ffffff"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
          </g>
        </svg>
      );
  }
};

/* ============================================================================
 * COLLECTIBLE PLAYING CARD COMPONENT (True Tabletop Card Anatomy)
 * Used in Player's Hand, Discard Pile, Radar Preview, and Flying Card Overlays!
 * ========================================================================== */
export const BoomPlayingCard: React.FC<{
  type: BoomCardType;
  ar: boolean;
  size?: 'sm' | 'md' | 'lg';
  canPlay?: boolean;
  isSelected?: boolean;
  actionLabel?: string;
  comboBadge?: string;
  onClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
}> = ({
  type,
  ar,
  size = 'md',
  canPlay = false,
  isSelected = false,
  actionLabel,
  comboBadge,
  onClick,
  className = '',
  style,
}) => {
  const meta = BOOM_CARD_META[type];

  const exactSizeStyle: React.CSSProperties =
    size === 'sm'
      ? { width: '136px', height: '192px' }
      : size === 'lg'
      ? { width: '176px', height: '248px' }
      : { width: '152px', height: '216px' };

  return (
    <div
      dir={ar ? 'rtl' : 'ltr'}
      style={{
        ...exactSizeStyle,
        display: 'grid',
        gridTemplateRows: '1fr',
        ...style,
      }}
      onClick={onClick}
      className={`group relative bg-[#fffdf7] border-[3.5px] border-[#161426] p-1.5 rounded-[22px] select-none transition-all duration-200 ease-out shrink-0 ${
        isSelected
          ? 'z-40 ring-4 ring-[#f97316] shadow-[0_8px_0_#161426]'
          : canPlay
          ? 'hover:-translate-y-2.5 hover:z-50 shadow-[0_7px_0_#161426] hover:shadow-[0_12px_0_#161426] cursor-pointer'
          : 'hover:-translate-y-1.5 hover:z-50 shadow-[0_6px_0_#161426]'
      } ${className}`}
    >
      {/* Inner Colored Card Face (CSS Grid guarantees 100% height fill and identical row alignment across all cards!) */}
      <div
        style={{
          backgroundColor: meta.bg,
          borderColor: meta.accent,
          display: 'grid',
          gridTemplateRows: 'auto 1fr auto',
        }}
        className="w-full h-full rounded-[15px] border-2 p-2 gap-1.5 relative overflow-hidden"
      >
        {/* 1. CLEAN EXPLODING-KITTENS STYLE TOP HEADER: Symbol Badge + Card Name */}
        <div className="flex items-center gap-1.5 min-w-0">
          <span
            style={{ backgroundColor: meta.badgeBg }}
            className="w-6 h-6 rounded-lg border-2 border-[#161426] text-white font-black text-[11px] flex items-center justify-center shadow-[0_2px_0_#161426] shrink-0"
          >
            {meta.symbol}
          </span>
          <div className="min-w-0 flex-1 text-start">
            <div className="font-black text-[12px] sm:text-[13px] text-[#161426] leading-tight truncate">
              {ar ? meta.name_ar : meta.name_en}
            </div>
          </div>
        </div>

        {/* 2. LARGE DOMINANT FULL-SCENE ILLUSTRATION WINDOW (100% Clean — Zero Floating Badges Covering Art!) */}
        <div
          style={{ backgroundColor: meta.frameBg }}
          className="w-full h-full min-h-0 rounded-xl border-[2.5px] border-[#161426] overflow-hidden relative shadow-inner"
        >
          <BoomCardIllustrationSvg
            type={type}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>

        {/* 3. UNIFIED BOTTOM EFFECT & ACTION FOOTER (Fixed 2-line height so every card aligns to the exact pixel!) */}
        <div
          style={{
            backgroundColor: isSelected
              ? '#f97316'
              : canPlay
              ? '#fffbeb'
              : '#f1f5f9',
            height: size === 'sm' ? '38px' : '44px',
          }}
          className={`w-full rounded-xl border-2 border-[#161426] px-2 flex items-center justify-center text-center shadow-[0_2px_0_#161426] transition-colors ${
            canPlay ? 'group-hover:bg-[#ffca3a]' : ''
          }`}
        >
          <span
            className={`font-extrabold text-[10px] sm:text-[10.5px] leading-tight line-clamp-2 ${
              isSelected ? 'text-white' : 'text-[#161426]'
            }`}
          >
            {actionLabel || (ar ? meta.short_ar : meta.short_en)}
          </span>
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
 * SPATIAL ARENA COORDINATE SYSTEM (1000 × 560 Tabletop Canvas)
 * ========================================================================== */
export interface SeatCoord {
  id: string;
  x: number; // 0..1000
  y: number; // 0..560
  isBottomViewer: boolean;
}

const DRAW_PILE_COORD = { x: 415, y: 270 };
const DISCARD_PILE_COORD = { x: 585, y: 270 };
const TABLE_CENTER_COORD = { x: 500, y: 270 };

export function computeTableSeatCoords(
  players: { id: string }[],
  bottomViewerId: string,
  ar = true
): Record<string, SeatCoord> {
  const result: Record<string, SeatCoord> = {};
  if (players.length === 0) return result;

  const bottomIdx = Math.max(
    0,
    players.findIndex((p) => p.id === bottomViewerId)
  );
  const rotated = [
    ...players.slice(bottomIdx),
    ...players.slice(0, bottomIdx),
  ];

  // Bottom player sits at (500, 475)
  result[rotated[0].id] = {
    id: rotated[0].id,
    x: 500,
    y: 475,
    isBottomViewer: true,
  };

  const rivals = rotated.slice(1);
  const rCount = rivals.length;

  rivals.forEach((riv, idx) => {
    // Match `flex justify-around` along the top row (y = 82)
    // In RTL (ar = true), flex-start is on the right (1000 -> 0); in LTR, left (0 -> 1000)
    const slotFraction = (idx + 0.5) / Math.max(1, rCount);
    const rawX = 110 + slotFraction * 780;
    const cx = ar ? 1000 - rawX : rawX;
    const cy = 82;
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
 * BACKGROUND FELT TRACK & ACTIVE TURN GLOW LAYER (z-10, Behind Seats & Piles)
 * ========================================================================== */
export const ArenaTableFeltTrackSvg: React.FC<{
  seatCoords: Record<string, SeatCoord>;
  turnPlayerId: string;
}> = ({ seatCoords, turnPlayerId }) => {
  const uid = React.useId().replace(/:/g, '');
  const turnSeat = seatCoords[turnPlayerId] || { x: 500, y: 475 };
  return (
    <svg
      viewBox="0 0 1000 560"
      className="absolute inset-0 w-full h-full pointer-events-none z-10 overflow-visible"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <radialGradient id={`calmSeatGlow_${uid}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffca3a" stopOpacity="0.24" />
          <stop offset="100%" stopColor="#ffca3a" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse
        cx="500"
        cy="270"
        rx="340"
        ry="155"
        fill="none"
        stroke="#ffca3a"
        strokeWidth="1.5"
        strokeDasharray="8 12"
        opacity="0.18"
      />
      <circle
        cx={turnSeat.x}
        cy={turnSeat.y}
        r="64"
        fill={`url(#calmSeatGlow_${uid})`}
      />
    </svg>
  );
};

/* ============================================================================
 * PREMIUM SINGLE-SHOT IN-ARENA SPATIAL CHOREOGRAPHY LAYER (z-50 Foreground)
 * - 100% Proportional (`preserveAspectRatio="xMidYMid meet"`)
 * - ZERO dizzying infinite loops (`NO repeatCount="indefinite"`)
 * - Strict W3C SMIL compliance: explicit `keyTimes` matching every `keySplines`
 * ========================================================================== */
export const ArenaSpatialFXLayer: React.FC<{
  seatCoords: Record<string, SeatCoord>;
  cinematic: BoomCinematicEvent | null;
  suppressSelfDrawFlight?: boolean;
  ar: boolean;
}> = ({ seatCoords, cinematic, suppressSelfDrawFlight = false, ar }) => {
  const uid = React.useId().replace(/:/g, '');
  if (!cinematic) return null;

  const actorSeat = seatCoords[cinematic.actorId] || { x: 500, y: 475 };
  const targetSeat =
    (cinematic.targetId && seatCoords[cinematic.targetId]) ||
    DISCARD_PILE_COORD;

  return (
    <svg
      viewBox="0 0 1000 560"
      className="absolute inset-0 w-full h-full pointer-events-none z-40 overflow-visible"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <filter
          id={`cardDropShadow_${uid}`}
          x="-20%"
          y="-20%"
          width="140%"
          height="140%"
        >
          <feDropShadow
            dx="0"
            dy="8"
            stdDeviation="4"
            floodColor="#161426"
            floodOpacity="0.65"
          />
        </filter>
      </defs>

      <g key={cinematic.id}>
        <animate
          attributeName="opacity"
          values="1; 1; 0"
          keyTimes="0; 0.78; 1"
          dur="1.22s"
          fill="freeze"
        />
        {/* ==================== DRAW SAFE CARD: PHYSICAL CARD GLIDES FROM DRAW PILE -> PLAYER'S HAND ==================== */}
        {cinematic.type === 'draw_safe' && !suppressSelfDrawFlight && (
          <g filter={`url(#cardDropShadow_${uid})`}>
            {/* Soft Emerald Ring on Draw Pile */}
            <circle
              cx={DRAW_PILE_COORD.x}
              cy={DRAW_PILE_COORD.y}
              r="32"
              fill="none"
              stroke="#22c55e"
              strokeWidth="3.5"
            >
              <animate
                attributeName="r"
                values="24;68"
                keyTimes="0; 1"
                dur="0.55s"
                calcMode="spline"
                keySplines="0.22 1 0.36 1"
                fill="freeze"
              />
              <animate
                attributeName="opacity"
                values="0.85;0"
                keyTimes="0; 1"
                dur="0.55s"
                fill="freeze"
              />
            </circle>

            {/* Single Physical Card Gliding Smoothly from Draw Pile to Drawer's Seat */}
            <g>
              <animateTransform
                attributeName="transform"
                type="translate"
                values={`${DRAW_PILE_COORD.x},${DRAW_PILE_COORD.y}; ${(DRAW_PILE_COORD.x + actorSeat.x) / 2},${Math.min(DRAW_PILE_COORD.y, actorSeat.y) - 35}; ${actorSeat.x},${actorSeat.y}`}
                keyTimes="0; 0.45; 1"
                calcMode="spline"
                keySplines="0.22 1 0.36 1; 0.22 1 0.36 1"
                dur="0.72s"
                fill="freeze"
              />
              <g>
                {/* 3D Card Flip Effect Mid-Flight (Width scales 1 -> 0.15 -> 1) */}
                <animateTransform
                  attributeName="transform"
                  type="scale"
                  values="0.9,0.9; 0.2,1.08; 1,1"
                  keyTimes="0; 0.45; 1"
                  dur="0.72s"
                  fill="freeze"
                />
                <rect
                  x="-34"
                  y="-48"
                  width="68"
                  height="96"
                  rx="11"
                  fill="#fffdf7"
                  stroke="#161426"
                  strokeWidth="4"
                />
                <rect
                  x="-27"
                  y="-41"
                  width="54"
                  height="82"
                  rx="7"
                  fill="#dcfce7"
                  stroke="#22c55e"
                  strokeWidth="2.5"
                />
                <circle
                  cx="0"
                  cy="-6"
                  r="16"
                  fill="#22c55e"
                  stroke="#161426"
                  strokeWidth="3"
                />
                <path
                  d="M -7 -6 L -2 -1 L 8 -11"
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <text
                  x="0"
                  y="26"
                  textAnchor="middle"
                  fill="#161426"
                  fontSize="10"
                  fontWeight="900"
                >
                  {ar ? 'سحبة آمنة' : 'SAFE'}
                </text>
              </g>
            </g>
          </g>
        )}

        {/* ==================== MAGNET OR 2x/3x COMBO HEIST: SINGLE SMOOTH PULL OF 1 CARD FROM RIVAL -> ACTOR ==================== */}
        {(cinematic.type === 'magnet' ||
          isComboSetCard(cinematic.type as BoomCardType) ||
          (cinematic.targetId &&
            cinematic.type !== 'attack' &&
            cinematic.type !== 'block')) && (
          <g filter={`url(#cardDropShadow_${uid})`}>
            {/* Subtle Magnetic Tether Line (Fades out cleanly after pull) */}
            <line
              x1={actorSeat.x}
              y1={actorSeat.y}
              x2={targetSeat.x}
              y2={targetSeat.y}
              stroke="#f97316"
              strokeWidth="4"
              strokeDasharray="8 8"
            >
              <animate
                attributeName="opacity"
                values="0;0.75;0"
                keyTimes="0;0.4;1"
                dur="0.95s"
                fill="freeze"
              />
            </line>

            {/* Single Ripple at Victim's Hand */}
            <circle
              cx={targetSeat.x}
              cy={targetSeat.y}
              r="24"
              fill="none"
              stroke="#f97316"
              strokeWidth="3.5"
            >
              <animate
                attributeName="r"
                values="18;56"
                keyTimes="0; 1"
                dur="0.6s"
                calcMode="spline"
                keySplines="0.22 1 0.36 1"
                fill="freeze"
              />
              <animate
                attributeName="opacity"
                values="0.9;0"
                keyTimes="0; 1"
                dur="0.6s"
                fill="freeze"
              />
            </circle>

            {/* Stolen Card Gliding ONCE Smoothly from Target Seat -> Actor Seat */}
            <g>
              <animateTransform
                attributeName="transform"
                type="translate"
                values={`${targetSeat.x},${targetSeat.y}; ${actorSeat.x},${actorSeat.y}`}
                keyTimes="0; 1"
                calcMode="spline"
                keySplines="0.22 1 0.36 1"
                dur="0.82s"
                fill="freeze"
              />
              <rect
                x="-30"
                y="-42"
                width="60"
                height="84"
                rx="10"
                fill="#fffdf7"
                stroke="#161426"
                strokeWidth="4"
              />
              <rect
                x="-23"
                y="-35"
                width="46"
                height="70"
                rx="6"
                fill="#9f1239"
                stroke="#f59e0b"
                strokeWidth="2"
              />
              <circle
                cx="0"
                cy="0"
                r="12"
                fill="#ffca3a"
                stroke="#161426"
                strokeWidth="2.5"
              />
            </g>
          </g>
        )}

        {/* ==================== ATTACK ×2: SINGLE CLEAN CARD FLIGHT + ×2 SEAL ON NEXT PLAYER ==================== */}
        {cinematic.type === 'attack' && (
          <g filter={`url(#cardDropShadow_${uid})`}>
            {/* Played Card Gliding from Actor -> Target Seat */}
            <g>
              <animateTransform
                attributeName="transform"
                type="translate"
                values={`${actorSeat.x},${actorSeat.y}; ${targetSeat.x},${targetSeat.y}`}
                keyTimes="0; 1"
                calcMode="spline"
                keySplines="0.22 1 0.36 1"
                dur="0.68s"
                fill="freeze"
              />
              <circle
                r="30"
                fill="#fef08a"
                stroke="#161426"
                strokeWidth="3.5"
              />
              <polygon
                points="3,-18 -11,3 0,3 -6,18 13,-3 1,-3"
                fill="#f97316"
                stroke="#161426"
                strokeWidth="2.4"
              />
              <circle
                cx="18"
                cy="14"
                r="13"
                fill="#e11d48"
                stroke="#161426"
                strokeWidth="2.5"
              />
              <text
                x="18"
                y="18"
                textAnchor="middle"
                fill="#ffffff"
                fontSize="12"
                fontWeight="900"
              >
                ×2
              </text>
            </g>

            {/* Single Clean Expanding Ring at Target */}
            <circle
              cx={targetSeat.x}
              cy={targetSeat.y}
              r="28"
              fill="none"
              stroke="#f59e0b"
              strokeWidth="4"
            >
              <animate
                attributeName="r"
                values="24;68"
                keyTimes="0; 1"
                dur="0.7s"
                calcMode="spline"
                keySplines="0.22 1 0.36 1"
                fill="freeze"
              />
              <animate
                attributeName="opacity"
                values="0.9;0"
                keyTimes="0; 1"
                dur="0.7s"
                fill="freeze"
              />
            </circle>
          </g>
        )}

        {/* ==================== SKIP: SINGLE SMOOTH SLIPSTREAM GLIDE TO NEXT PLAYER ==================== */}
        {cinematic.type === 'skip' && (
          <g filter={`url(#cardDropShadow_${uid})`}>
            <g>
              <animateTransform
                attributeName="transform"
                type="translate"
                values={`${actorSeat.x},${actorSeat.y}; ${targetSeat.x},${targetSeat.y}`}
                keyTimes="0; 1"
                calcMode="spline"
                keySplines="0.22 1 0.36 1"
                dur="0.68s"
                fill="freeze"
              />
              <circle
                r="28"
                fill="#e0f2fe"
                stroke="#161426"
                strokeWidth="3.5"
              />
              <polygon
                points="-12,-11 4,0 -12,11"
                fill="#0284c7"
                stroke="#161426"
                strokeWidth="2.2"
              />
              <polygon
                points="2,-11 18,0 2,11"
                fill="#ffca3a"
                stroke="#161426"
                strokeWidth="2.2"
              />
            </g>
          </g>
        )}

        {/* ==================== REVERSE: SINGLE 180-DEGREE COMPASS ROTATION (NO INFINITE SPIN!) ==================== */}
        {cinematic.type === 'reverse' && (
          <g
            transform="translate(500, 270)"
            filter={`url(#cardDropShadow_${uid})`}
          >
            <g>
              <animateTransform
                attributeName="transform"
                type="rotate"
                values="0; 180"
                keyTimes="0; 1"
                calcMode="spline"
                keySplines="0.22 1 0.36 1"
                dur="0.75s"
                fill="freeze"
              />
              <path
                d="M -68 -14 A 68 68 0 0 1 68 -14"
                fill="none"
                stroke="#9333ea"
                strokeWidth="10"
                strokeLinecap="round"
              />
              <polygon
                points="68,-34 92,-4 48,-4"
                fill="#ffca3a"
                stroke="#161426"
                strokeWidth="3"
              />
              <path
                d="M 68 14 A 68 68 0 0 1 -68 14"
                fill="none"
                stroke="#ec4899"
                strokeWidth="10"
                strokeLinecap="round"
              />
              <polygon
                points="-68,34 -92,4 -48,4"
                fill="#00f5d4"
                stroke="#161426"
                strokeWidth="3"
              />
            </g>
          </g>
        )}

        {/* ==================== RADAR: SINGLE SOFT SCAN WAVE ACROSS THE DRAW PILE ==================== */}
        {cinematic.type === 'radar' && (
          <g transform={`translate(${DRAW_PILE_COORD.x}, ${DRAW_PILE_COORD.y})`}>
            <circle r="30" fill="none" stroke="#00f5d4" strokeWidth="3.5">
              <animate
                attributeName="r"
                values="22;88"
                keyTimes="0; 1"
                dur="0.75s"
                calcMode="spline"
                keySplines="0.22 1 0.36 1"
                fill="freeze"
              />
              <animate
                attributeName="opacity"
                values="0.9;0"
                keyTimes="0; 1"
                dur="0.75s"
                fill="freeze"
              />
            </circle>
          </g>
        )}

        {/* ==================== SHUFFLE: CLEAN CASINO RIFFLE SPLIT & MERGE ON THE DRAW PILE ==================== */}
        {cinematic.type === 'shuffle' && (
          <g
            transform={`translate(${DRAW_PILE_COORD.x}, ${DRAW_PILE_COORD.y})`}
            filter={`url(#cardDropShadow_${uid})`}
          >
            {/* Left Half of Deck Splitting Out and Riffle-Merging Back */}
            <g>
              <animateTransform
                attributeName="transform"
                type="translate"
                values="0,0; -48,-8; 0,0"
                keyTimes="0; 0.45; 1"
                calcMode="spline"
                keySplines="0.22 1 0.36 1; 0.22 1 0.36 1"
                dur="0.75s"
                fill="freeze"
              />
              <rect
                x="-28"
                y="-40"
                width="56"
                height="80"
                rx="9"
                fill="#fffdf7"
                stroke="#161426"
                strokeWidth="3.5"
              />
              <rect
                x="-22"
                y="-34"
                width="44"
                height="68"
                rx="6"
                fill="#0d9488"
              />
            </g>
            {/* Right Half of Deck Splitting Out and Riffle-Merging Back */}
            <g>
              <animateTransform
                attributeName="transform"
                type="translate"
                values="0,0; 48,-8; 0,0"
                keyTimes="0; 0.45; 1"
                calcMode="spline"
                keySplines="0.22 1 0.36 1; 0.22 1 0.36 1"
                dur="0.75s"
                fill="freeze"
              />
              <rect
                x="-28"
                y="-40"
                width="56"
                height="80"
                rx="9"
                fill="#fffdf7"
                stroke="#161426"
                strokeWidth="3.5"
              />
              <rect
                x="-22"
                y="-34"
                width="44"
                height="68"
                rx="6"
                fill="#9f1239"
              />
            </g>
          </g>
        )}

        {/* ==================== BLOCK: SINGLE STAMP PRESS ON DISCARD PILE ==================== */}
        {cinematic.type === 'block' && (
          <g
            transform={`translate(${DISCARD_PILE_COORD.x}, ${DISCARD_PILE_COORD.y})`}
            filter={`url(#cardDropShadow_${uid})`}
          >
            <circle r="35" fill="none" stroke="#ef4444" strokeWidth="4">
              <animate
                attributeName="r"
                values="28;84"
                keyTimes="0; 1"
                dur="0.6s"
                calcMode="spline"
                keySplines="0.22 1 0.36 1"
                fill="freeze"
              />
              <animate
                attributeName="opacity"
                values="0.9;0"
                keyTimes="0; 1"
                dur="0.6s"
                fill="freeze"
              />
            </circle>
            <g>
              <animateTransform
                attributeName="transform"
                type="scale"
                values="1.45;1"
                keyTimes="0; 1"
                calcMode="spline"
                keySplines="0.22 1 0.36 1"
                dur="0.45s"
                fill="freeze"
              />
              <polygon
                points="-18,-42 18,-42 42,-18 42,18 18,42 -18,42 -42,18 -42,-18"
                fill="#ef4444"
                stroke="#161426"
                strokeWidth="4"
              />
              <circle r="24" fill="#fff9ec" stroke="#161426" strokeWidth="3" />
              <line
                x1="-14"
                y1="-14"
                x2="14"
                y2="14"
                stroke="#ef4444"
                strokeWidth="6"
                strokeLinecap="round"
              />
              <line
                x1="14"
                y1="-14"
                x2="-14"
                y2="14"
                stroke="#ef4444"
                strokeWidth="6"
                strokeLinecap="round"
              />
            </g>
          </g>
        )}

        {/* ==================== BOMB DRAWN: SINGLE DRAMATIC CARD FLIGHT FROM DECK -> DRAWER ==================== */}
        {cinematic.type === 'bomb' && !suppressSelfDrawFlight && (
          <g filter={`url(#cardDropShadow_${uid})`}>
            <g>
              <animateTransform
                attributeName="transform"
                type="translate"
                values={`${DRAW_PILE_COORD.x},${DRAW_PILE_COORD.y}; ${actorSeat.x},${actorSeat.y}`}
                keyTimes="0; 1"
                calcMode="spline"
                keySplines="0.22 1 0.36 1"
                dur="0.72s"
                fill="freeze"
              />
              <rect
                x="-34"
                y="-48"
                width="68"
                height="96"
                rx="11"
                fill="#fff1f2"
                stroke="#161426"
                strokeWidth="4"
              />
              <rect
                x="-26"
                y="-40"
                width="52"
                height="80"
                rx="7"
                fill="#e11d48"
                stroke="#161426"
                strokeWidth="2.5"
              />
              <rect
                x="-18"
                y="-12"
                width="36"
                height="24"
                rx="4"
                fill="#090d16"
                stroke="#ffca3a"
                strokeWidth="2"
              />
              <text
                x="0"
                y="4"
                textAnchor="middle"
                fill="#ff595e"
                fontSize="11"
                fontWeight="900"
                fontFamily="monospace"
              >
                00:01
              </text>
            </g>
          </g>
        )}

        {/* ==================== DEFUSE: BOMB ABOUT TO BLOW -> WIRE CUTTERS SWOOP IN & SNIP FUSE! ==================== */}
        {cinematic.type === 'defuse' && (
          <g
            transform={`translate(${TABLE_CENTER_COORD.x}, ${TABLE_CENTER_COORD.y})`}
            filter={`url(#cardDropShadow_${uid})`}
          >
            {/* Emerald Safety Shockwave Ring */}
            <circle r="36" fill="none" stroke="#22c55e" strokeWidth="4.5">
              <animate
                attributeName="r"
                values="24;96"
                keyTimes="0; 1"
                dur="0.75s"
                calcMode="spline"
                keySplines="0.22 1 0.36 1"
                fill="freeze"
              />
              <animate
                attributeName="opacity"
                values="0.95;0"
                keyTimes="0; 1"
                dur="0.75s"
                fill="freeze"
              />
            </circle>
            <circle r="34" fill="#22c55e" stroke="#161426" strokeWidth="4" />
            <path
              d="M -14 1 L -4 11 L 16 -10"
              fill="none"
              stroke="#ffffff"
              strokeWidth="6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
        )}

        {/* ==================== PLANTED: BOMB CARD SLIDES SMOOTHLY BACK INTO THE DRAW PILE ==================== */}
        {cinematic.type === 'planted' && (
          <g filter={`url(#cardDropShadow_${uid})`}>
            <g>
              <animateTransform
                attributeName="transform"
                type="translate"
                values={`${actorSeat.x},${actorSeat.y}; ${DRAW_PILE_COORD.x},${DRAW_PILE_COORD.y}`}
                keyTimes="0; 1"
                calcMode="spline"
                keySplines="0.22 1 0.36 1"
                dur="0.75s"
                fill="freeze"
              />
              <g>
                <animateTransform
                  attributeName="transform"
                  type="scale"
                  values="1;0.82"
                  keyTimes="0; 1"
                  dur="0.75s"
                  fill="freeze"
                />
                <rect
                  x="-28"
                  y="-40"
                  width="56"
                  height="80"
                  rx="9"
                  fill="#161426"
                  stroke="#ffca3a"
                  strokeWidth="3.5"
                />
                <circle cx="0" cy="0" r="12" fill="#e11d48" />
              </g>
            </g>
          </g>
        )}

        {/* ==================== EXPLODED: SINGLE CLEAN SHOCKWAVE AT VICTIM'S SEAT ==================== */}
        {cinematic.type === 'exploded' && (
          <g
            transform={`translate(${actorSeat.x}, ${actorSeat.y})`}
            filter={`url(#cardDropShadow_${uid})`}
          >
            <circle r="35" fill="none" stroke="#ffca3a" strokeWidth="5">
              <animate
                attributeName="r"
                values="24;96"
                keyTimes="0; 1"
                dur="0.65s"
                calcMode="spline"
                keySplines="0.22 1 0.36 1"
                fill="freeze"
              />
              <animate
                attributeName="opacity"
                values="1;0"
                keyTimes="0; 1"
                dur="0.65s"
                fill="freeze"
              />
            </circle>
            <circle r="36" fill="#e11d48" stroke="#161426" strokeWidth="4" />
            <text
              x="0"
              y="6"
              textAnchor="middle"
              fill="#ffffff"
              fontSize="14"
              fontWeight="900"
            >
              {ar ? 'بوووم!' : 'BOOM!'}
            </text>
          </g>
        )}
      </g>
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
  const [counterSecondsLeft, setCounterSecondsLeft] = useState<number>(3);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [radarDismissed, setRadarDismissed] = useState<boolean>(false);
  const [passedCounterId, setPassedCounterId] = useState<string | null>(null);
  const [activeCinematic, setActiveCinematic] =
    useState<BoomCinematicEvent | null>(null);
  const [localDrawPreview, setLocalDrawPreview] = useState<{
    card: BoomCard;
    drawerId: string;
  } | null>(null);
  const [localPlayPreview, setLocalPlayPreview] = useState<{
    card: BoomCard;
    actorId: string;
    targetPlayerId?: string;
    comboCount?: 1 | 2 | 3;
  } | null>(null);
  const [defuseShowdown, setDefuseShowdown] = useState<{
    drawerId: string;
    defuseCard: BoomCard;
  } | null>(null);
  const [comboBuilder, setComboBuilder] = useState<{
    card: BoomCard;
    targetPlayerId: string;
  } | null>(null);
  const [customBombSlot, setCustomBombSlot] = useState<number>(1);

  const activeViewerId = isPassAndPlay ? gameData.turnPlayerId : myPlayerId;
  const rawHand = gameData.hands?.[activeViewerId] || [];

  // Neatly sort cards in player's hand so identical/related cards sit grouped together cleanly
  const CARD_SORT_ORDER: Record<BoomCardType, number> = {
    defuse: 1,
    block: 2,
    attack: 3,
    skip: 4,
    reverse: 5,
    radar: 6,
    shuffle: 7,
    magnet: 8,
    combo_shawarma: 9,
    combo_kabsa: 10,
    combo_karak: 11,
    combo_falcon: 12,
    bomb: 13,
  };
  const myHand = [...rawHand].sort(
    (a, b) => (CARD_SORT_ORDER[a.type] || 99) - (CARD_SORT_ORDER[b.type] || 99)
  );

  // Count how many copies of each card type the active viewer holds (for 2x & 3x Combos!)
  const handTypeCounts = myHand.reduce<Record<string, number>>((acc, c) => {
    acc[c.type] = (acc[c.type] || 0) + 1;
    return acc;
  }, {});

  const isMyTurn = activeViewerId === gameData.turnPlayerId;
  const isAmAlive = (gameData.alivePlayerIds || []).includes(activeViewerId);

  const seatCoords = computeTableSeatCoords(players, activeViewerId, ar);

  // Trigger single-shot in-arena animation for 1.25 seconds whenever `lastCinematic` updates
  useEffect(() => {
    if (!gameData.lastCinematic) return;
    const cid = gameData.lastCinematic.id;
    setActiveCinematic(gameData.lastCinematic);

    // If another player just defused a bomb, play the full 2-beat Defuse Showdown for spectators too!
    let defTimer: ReturnType<typeof setTimeout> | null = null;
    if (
      gameData.lastCinematic.type === 'defuse' &&
      gameData.lastCinematic.actorId !== activeViewerId
    ) {
      setDefuseShowdown({
        drawerId: gameData.lastCinematic.actorId,
        defuseCard: { id: `spec_def_${Date.now()}`, type: 'defuse' },
      });
      defTimer = setTimeout(() => {
        setDefuseShowdown(null);
      }, 1850);
    }

    const clearDelay =
      gameData.lastCinematic.type === 'defuse' ? 1850 : 1250;
    const timer = setTimeout(() => {
      setActiveCinematic((prev) => (prev?.id === cid ? null : prev));
    }, clearDelay);

    return () => {
      if (defTimer) clearTimeout(defTimer);
      clearTimeout(timer);
    };
  }, [gameData.lastCinematic?.id]);

  // Reset Pass-and-Play privacy lock when turn changes
  useEffect(() => {
    setPassAndPlayHandUnlocked(false);
    setSelectedCardId(null);
    setPickingMagnetTarget(false);
    setComboBuilder(null);
    setCustomBombSlot(1);
  }, [gameData.turnPlayerId, gameData.phase]);

  // Reset Radar dismissal when a new Radar peek occurs
  useEffect(() => {
    setRadarDismissed(false);
  }, [gameData.radarPeekPlayerId, gameData.deck?.length]);

  // Determine which alive players (other than the one who just acted/blocked) actually hold a BLOCK card
  const getEligibleBlockerIds = (
    state: BoomDeckGameState,
    pending: BoomPendingAction
  ): string[] => {
    const lastMoverId =
      pending.blockedCount > 0 && pending.lastBlockerId
        ? pending.lastBlockerId
        : pending.actorId;
    return (state.alivePlayerIds || []).filter(
      (pid) =>
        pid !== lastMoverId &&
        (state.hands?.[pid] || []).some((c) => c.type === 'block')
    );
  };

  // Countdown for the 3-second Counter ("بلوك!") Window (only when someone actually holds a Block card)
  useEffect(() => {
    if (gameData.phase !== 'counter_window' || !gameData.pendingAction) return;
    const eligible = getEligibleBlockerIds(gameData, gameData.pendingAction);
    if (eligible.length === 0) {
      setCounterSecondsLeft(0);
      return;
    }
    setCounterSecondsLeft(3);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    gameData.phase,
    gameData.pendingAction?.id,
    gameData.pendingAction?.blockedCount,
  ]);

  // Auto-resolve Counter Window when timer hits 0 (or immediately if no rival holds a Block card)
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

  const totalDeckCount = gameData.deck?.length || 0;
  const bombsInDeckCount = (gameData.deck || []).filter(
    (c) => c.type === 'bomb'
  ).length;
  const bombRiskPercent =
    totalDeckCount > 0
      ? Math.round((bombsInDeckCount / totalDeckCount) * 100)
      : 0;

  // Compute resolved state for any pending action
  const buildResolvedActionState = (
    baseState: BoomDeckGameState,
    pending: BoomPendingAction
  ): BoomDeckGameState => {
    const isCancelled = pending.blockedCount % 2 === 1;
    const actorName = getPlayerName(pending.actorId);

    if (isCancelled) {
      return {
        ...baseState,
        phase: 'playing',
        pendingAction: null,
        actionLog: [
          {
            ar: `أُبطلت حركة ${actorName} بالبلوك! ما زال الدور عند ${actorName}.`,
            en: `${actorName}’s card was blocked! It is still ${actorName}’s turn.`,
          },
          ...(baseState.actionLog || []).slice(0, 7),
        ],
      };
    }

    const cType = pending.cardType;
    let nextDeck = [...(baseState.deck || [])];
    let nextHands = { ...baseState.hands };
    let nextTurnPlayerId = baseState.turnPlayerId;
    let nextTurnsRemaining = baseState.turnsRemaining;
    let nextDirection = baseState.direction;
    let nextRadarPlayerId: string | null = null;
    let nextRadarCards: BoomCard[] = [];
    let logAr = '';
    let logEn = '';

    // IMPORTANT: Check 2x / 3x Combo Heist FIRST (because ANY 2 or 3 identical cards — even Skip, Attack, Radar, etc. — can be played as a 2x/3x Combo to steal from a rival!)
    if (
      (pending.comboCount && pending.comboCount >= 2) ||
      cType === 'magnet' ||
      isComboSetCard(cType)
    ) {
      const victimId =
        pending.targetPlayerId ||
        baseState.alivePlayerIds.find((id) => id !== pending.actorId);
      const victimHand = victimId ? [...(nextHands[victimId] || [])] : [];
      const victimName = getPlayerName(victimId);
      const playedMeta = BOOM_CARD_META[cType];

      if (pending.comboCount === 3 && pending.demandedCardType) {
        const demandedMeta = BOOM_CARD_META[pending.demandedCardType];
        const foundIdx = victimHand.findIndex(
          (c) => c.type === pending.demandedCardType
        );
        if (victimId && foundIdx !== -1) {
          const [stolenCard] = victimHand.splice(foundIdx, 1);
          nextHands = {
            ...nextHands,
            [victimId]: victimHand,
            [pending.actorId]: [
              ...(nextHands[pending.actorId] || []),
              stolenCard,
            ],
          };
          logAr = `${actorName} لعب ثلاثية «${playedMeta.name_ar}» (3×) وانتزع كرت «${demandedMeta.name_ar}» بالاسم من يد ${victimName}!`;
          logEn = `${actorName} played 3× "${playedMeta.name_en}" and claimed "${demandedMeta.name_en}" from ${victimName}!`;
        } else {
          logAr = `${actorName} لعب ثلاثية «${playedMeta.name_ar}» (3×) وطلب «${demandedMeta.name_ar}» من ${victimName}، لكن لم يكن بيده!`;
          logEn = `${actorName} played 3× "${playedMeta.name_en}" demanding "${demandedMeta.name_en}" from ${victimName}, but they didn't have it!`;
        }
      } else if (victimId && victimHand.length > 0) {
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
        if (pending.comboCount === 2 || isComboSetCard(cType)) {
          logAr = `${actorName} لعب ثنائية «${playedMeta.name_ar}» (2×) وسرق كرتاً عشوائياً من يد ${victimName}!`;
          logEn = `${actorName} played 2× "${playedMeta.name_en}" and stole a random card from ${victimName}!`;
        } else {
          logAr = `${actorName} سحب كرتاً عشوائياً بالمغناطيس من يد ${victimName}!`;
          logEn = `${actorName} magnetized a random card from ${victimName}’s hand!`;
        }
      } else {
        logAr = `${actorName} حاول السرقة لكن يد الخصم فارغة!`;
        logEn = `${actorName} tried to steal a card, but target had no cards!`;
      }
    } else if (cType === 'skip') {
      if (nextTurnsRemaining > 1) {
        nextTurnsRemaining -= 1;
        logAr = `${actorName} تزحلق من سحبة واحدة! باقي عليه (${nextTurnsRemaining}) سحبة.`;
        logEn = `${actorName} skipped 1 draw! (${nextTurnsRemaining} left).`;
      } else {
        nextTurnPlayerId = getNextAlivePlayerId(
          baseState.turnPlayerId,
          baseState.alivePlayerIds,
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
        baseState.turnPlayerId,
        baseState.alivePlayerIds,
        nextDirection
      );
      nextTurnsRemaining =
        baseState.turnsRemaining > 1 ? baseState.turnsRemaining + 2 : 2;
      logAr = `${actorName} دبل المصيبة! ${getPlayerName(
        nextTurnPlayerId
      )} مجبور يسحب (${nextTurnsRemaining}) مرات!`;
      logEn = `${actorName} struck! ${getPlayerName(
        nextTurnPlayerId
      )} must take ${nextTurnsRemaining} turns!`;
    } else if (cType === 'reverse') {
      nextDirection = (baseState.direction === 1 ? -1 : 1) as 1 | -1;
      if (nextTurnsRemaining > 1) {
        nextTurnsRemaining -= 1;
        logAr = `${actorName} عكس اتجاه الطاولة وتخلص من سحبة واحدة!`;
        logEn = `${actorName} reversed direction and cleared 1 draw!`;
      } else {
        nextTurnPlayerId = getNextAlivePlayerId(
          baseState.turnPlayerId,
          baseState.alivePlayerIds,
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
      logAr = `${actorName} خلط كومة السحب بالكامل!`;
      logEn = `${actorName} shuffled the entire Draw Pile!`;
    }

    return {
      ...baseState,
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
        ...(baseState.actionLog || []).slice(0, 7),
      ],
    };
  };

  // Play an action card (or 2x / 3x Combo!) from hand with a smooth 460ms physical flight transition to the center Discard Pile!
  const handleInitiateCardPlay = (
    card: BoomCard,
    targetPlayerId?: string,
    comboCount: 1 | 2 | 3 = 1,
    demandedCardType?: BoomCardType
  ) => {
    if (
      gameData.phase !== 'playing' ||
      !isMyTurn ||
      localDrawPreview ||
      localPlayPreview
    )
      return;
    if (
      card.type === 'bomb' ||
      card.type === 'defuse' ||
      (card.type === 'block' && comboCount < 2)
    )
      return;

    const actorId = gameData.turnPlayerId;
    const actorHand = gameData.hands?.[actorId] || [];
    const matchingCopies = actorHand.filter((c) => c.type === card.type);

    // If this is a Combo Set card, Magnet, OR any Special Card where the player is choosing a 2x/3x Combo target:
    if (
      (isComboSetCard(card.type) || card.type === 'magnet' || comboCount >= 2) &&
      !targetPlayerId
    ) {
      if ((isComboSetCard(card.type) || comboCount >= 2) && matchingCopies.length < 2)
        return;
      setSelectedCardId(card.id);
      setPickingMagnetTarget(true);
      return;
    }

    const effectiveComboCount: 1 | 2 | 3 = isComboSetCard(card.type)
      ? comboCount >= 3 && matchingCopies.length >= 3
        ? 3
        : 2
      : comboCount >= 3 && matchingCopies.length >= 3
      ? 3
      : comboCount === 2 && matchingCopies.length >= 2
      ? 2
      : 1;

    const actionCardType = card.type;
    setSelectedCardId(null);
    setPickingMagnetTarget(false);
    setComboBuilder(null);

    // 1. Trigger smooth 460ms physical card flight from Player's Hand -> Center Discard Pile!
    setLocalPlayPreview({
      card,
      actorId,
      targetPlayerId,
      comboCount: effectiveComboCount,
    });

    setTimeout(() => {
      setLocalPlayPreview(null);

      const currentHand = [...(gameData.hands[actorId] || [])];
      const discardedCards: BoomCard[] = [];

      if (effectiveComboCount >= 2) {
        // Remove `effectiveComboCount` copies of `card.type` (starting with `card.id`)
        const clickedIdx = currentHand.findIndex((c) => c.id === card.id);
        if (clickedIdx !== -1) {
          discardedCards.push(...currentHand.splice(clickedIdx, 1));
        }
        while (discardedCards.length < effectiveComboCount) {
          const nextMatchIdx = currentHand.findIndex(
            (c) => c.type === actionCardType
          );
          if (nextMatchIdx === -1) break;
          discardedCards.push(...currentHand.splice(nextMatchIdx, 1));
        }
      } else {
        const idx = currentHand.findIndex((c) => c.id === card.id);
        if (idx !== -1) {
          discardedCards.push(...currentHand.splice(idx, 1));
        } else {
          discardedCards.push(card);
        }
      }

      const actorName = getPlayerName(actorId);
      const computedTargetId =
        targetPlayerId ||
        (actionCardType === 'attack' || actionCardType === 'skip'
          ? getNextAlivePlayerId(
              actorId,
              gameData.alivePlayerIds,
              gameData.direction
            )
          : undefined);
      const targetName = targetPlayerId ? getPlayerName(targetPlayerId) : '';
      const meta = BOOM_CARD_META[actionCardType];
      const demandedMeta = demandedCardType
        ? BOOM_CARD_META[demandedCardType]
        : null;

      const pending: BoomPendingAction = {
        id: `act_${Date.now()}`,
        actorId,
        cardType: actionCardType,
        comboCount: effectiveComboCount,
        demandedCardType:
          effectiveComboCount === 3 ? demandedCardType : undefined,
        targetPlayerId: computedTargetId,
        blockedCount: 0,
        createdAt: Date.now(),
      };

      const subtitleAr =
        effectiveComboCount === 3 && demandedMeta
          ? `${actorName} لعب ثلاثية «${meta.name_ar}» (3×) وطلب «${demandedMeta.name_ar}» من ${targetName}!`
          : effectiveComboCount === 2
          ? `${actorName} لعب ثنائية «${meta.name_ar}» (2×) لسرقة كرت عشوائي من ${targetName}!`
          : targetPlayerId
          ? `${actorName} صوّب «${meta.name_ar}» نحو ${targetName}!`
          : `${actorName} لعب قدرة «${meta.name_ar}»!`;

      const subtitleEn =
        effectiveComboCount === 3 && demandedMeta
          ? `${actorName} played 3× "${meta.name_en}" demanding "${demandedMeta.name_en}" from ${targetName}!`
          : effectiveComboCount === 2
          ? `${actorName} played 2× "${meta.name_en}" to steal a random card from ${targetName}!`
          : targetPlayerId
          ? `${actorName} aimed "${meta.name_en}" at ${targetName}!`
          : `${actorName} played "${meta.name_en}"!`;

      const stateWithCardOnTable: BoomDeckGameState = {
        ...gameData,
        phase: 'counter_window',
        hands: {
          ...gameData.hands,
          [actorId]: currentHand,
        },
        discardPile: [...(gameData.discardPile || []), ...discardedCards],
        pendingAction: pending,
        radarPeekPlayerId: null,
        radarCards: [],
        lastCinematic: {
          id: `cin_${Date.now()}`,
          type: card.type,
          actorId,
          targetId: computedTargetId,
          subtitle_ar: subtitleAr,
          subtitle_en: subtitleEn,
          timestamp: Date.now(),
        },
        actionLog: [
          {
            ar: subtitleAr,
            en: subtitleEn,
          },
          ...(gameData.actionLog || []).slice(0, 7),
        ],
      };

      // 2. Smart Counter Check: Does ANY other alive player actually hold a 'block' card?
      // If nobody else has a Block card, execute the ability immediately without pausing!
      const eligibleBlockers = getEligibleBlockerIds(
        stateWithCardOnTable,
        pending
      );
      if (eligibleBlockers.length === 0) {
        onUpdateGameData(
          buildResolvedActionState(stateWithCardOnTable, pending)
        );
      } else {
        onUpdateGameData(stateWithCardOnTable);
      }
    }, 460);
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

    const updatedPending: BoomPendingAction = {
      ...gameData.pendingAction,
      blockedCount: newBlockedCount,
      lastBlockerId: blockerPlayerId,
    };

    const nextState: BoomDeckGameState = {
      ...gameData,
      hands: {
        ...gameData.hands,
        [blockerPlayerId]: nextBlockerHand,
      },
      discardPile: [...(gameData.discardPile || []), blockCard],
      pendingAction: updatedPending,
      lastCinematic: {
        id: `cin_block_${Date.now()}`,
        type: 'block',
        actorId: blockerPlayerId,
        targetId: gameData.pendingAction.actorId,
        subtitle_ar: isNowCancelled
          ? `${blockerName} كبس ختم «بلوك» وأبطل حركة ${actorName}!`
          : `${blockerName} كبس «بلوك ع البلوك» ورجّع الحركة تشتغل!`,
        subtitle_en: isNowCancelled
          ? `${blockerName} slammed BLOCK and cancelled ${actorName}’s move!`
          : `${blockerName} double-blocked — the move is BACK ON!`,
        timestamp: Date.now(),
      },
      actionLog: [
        {
          ar: isNowCancelled
            ? `${blockerName} اعترض بكرت «بلوك» وألغى الحركة!`
            : `${blockerName} ردّ بكرت «بلوك ع البلوك» وأعاد تفعيل الحركة!`,
          en: isNowCancelled
            ? `${blockerName} slammed BLOCK to cancel the card!`
            : `${blockerName} played BLOCK on the BLOCK!`,
        },
        ...(gameData.actionLog || []).slice(0, 7),
      ],
    };

    // If no other player has another Block card to counter-block, resolve after a brief beat!
    const nextEligible = getEligibleBlockerIds(nextState, updatedPending);
    if (nextEligible.length === 0) {
      onUpdateGameData(buildResolvedActionState(nextState, updatedPending));
    } else {
      onUpdateGameData(nextState);
    }
  };

  // Execute (or cancel if blocked) the pending action after the Counter Window
  const resolvePendingAction = () => {
    const pending = gameData.pendingAction;
    if (!pending) return;
    onUpdateGameData(buildResolvedActionState(gameData, pending));
  };

  // Draw the top card from the Draw Pile with a physical 3D Card-Draw Flight & Flip Animation!
  const handleDrawCard = () => {
    if (gameData.phase !== 'playing' || !isMyTurn || localDrawPreview) return;
    const currentDeck = [...(gameData.deck || [])];
    if (currentDeck.length === 0) return;

    const topCard = currentDeck.shift()!;
    const drawerId = gameData.turnPlayerId;
    const drawerName = getPlayerName(drawerId);

    // 1. Play physical local card-draw flight & flip animation first (680ms)!
    setLocalDrawPreview({ card: topCard, drawerId });

    setTimeout(() => {
      setLocalDrawPreview(null);

      if (topCard.type === 'bomb') {
        const drawerHand = [...(gameData.hands[drawerId] || [])];
        const defuseIdx = drawerHand.findIndex((c) => c.type === 'defuse');

        // Case A: Player holds a Defuse ("مقص الإنقاذ") card!
        // Play the dramatic 2-beat "Bomb About to Explode -> Last-Second Wire Cutters Snip!" animation (1850ms), then open the Bomb Planting selector directly!
        if (defuseIdx !== -1) {
          const [usedDefuse] = drawerHand.splice(defuseIdx, 1);
          setDefuseShowdown({
            drawerId,
            defuseCard: usedDefuse,
          });

          setTimeout(() => {
            setDefuseShowdown(null);
            onUpdateGameData({
              ...gameData,
              phase: 'planting_bomb',
              deck: currentDeck,
              crisisPlayerId: drawerId,
              radarPeekPlayerId: null,
              radarCards: [],
              hands: {
                ...gameData.hands,
                [drawerId]: drawerHand,
              },
              discardPile: [...(gameData.discardPile || []), usedDefuse],
              lastCinematic: {
                id: `cin_defuse_${Date.now()}`,
                type: 'defuse',
                actorId: drawerId,
                subtitle_ar: `${drawerName} فكّك القنبلة بمقص الإنقاذ قبل الانفجار بثانية!`,
                subtitle_en: `${drawerName} snipped the bomb fuse at the very last second!`,
                timestamp: Date.now(),
              },
              actionLog: [
                {
                  ar: `${drawerName} سحب قنبلة وفكّكها بمقص الإنقاذ بآخر لحظة! الآن يزرعها بالكومة...`,
                  en: `${drawerName} defused the bomb at the last second! Now planting it in the deck...`,
                },
                ...(gameData.actionLog || []).slice(0, 7),
              ],
            });
          }, 1850);
          return;
        }

        // Case B: Player has NO Defuse card -> Automatic Explosion!
        const nextAlive = (gameData.alivePlayerIds || []).filter(
          (id) => id !== drawerId
        );
        const nextEliminated = [
          ...(gameData.eliminatedPlayerIds || []),
          drawerId,
        ];

        if (nextAlive.length <= 1) {
          const champId = nextAlive[0] || drawerId;
          const awards: Record<string, number> = { [champId]: 4 };
          nextEliminated.slice(-1).forEach((runnerUpId) => {
            if (runnerUpId !== champId) awards[runnerUpId] = 1;
          });

          onUpdateGameData(
            {
              ...gameData,
              phase: 'round_over',
              deck: currentDeck,
              alivePlayerIds: nextAlive,
              eliminatedPlayerIds: nextEliminated,
              crisisPlayerId: null,
              radarPeekPlayerId: null,
              radarCards: [],
              winnerId: champId,
              lastCinematic: {
                id: `cin_win_${Date.now()}`,
                type: 'exploded',
                actorId: drawerId,
                subtitle_ar: `انفجرت القنبلة بـ ${drawerName}! الفائز الناجي الأخير هو ${getPlayerName(
                  champId
                )}!`,
                subtitle_en: `${drawerName} exploded! Last survivor ${getPlayerName(
                  champId
                )} wins!`,
                timestamp: Date.now(),
              },
              actionLog: [
                {
                  ar: `انفجر ${drawerName} وتُوّج ${getPlayerName(
                    champId
                  )} بطلاً للفتيل الملعون (+4 نقاط)!`,
                  en: `${drawerName} blew up! ${getPlayerName(
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

        const nextTurnAfterBoom = getNextAlivePlayerId(
          drawerId,
          nextAlive,
          gameData.direction
        );

        onUpdateGameData({
          ...gameData,
          phase: 'playing',
          deck: currentDeck,
          alivePlayerIds: nextAlive,
          eliminatedPlayerIds: nextEliminated,
          crisisPlayerId: null,
          radarPeekPlayerId: null,
          radarCards: [],
          turnPlayerId: nextTurnAfterBoom,
          turnsRemaining: 1,
          lastCinematic: {
            id: `cin_exp_${Date.now()}`,
            type: 'exploded',
            actorId: drawerId,
            subtitle_ar: `بوووم! سحب ${drawerName} قنبلة بدون مقص إنقاذ وخرج من الجولة!`,
            subtitle_en: `KABOOM! ${drawerName} drew a Bomb with no Defuse and blew up!`,
            timestamp: Date.now(),
          },
          actionLog: [
            {
              ar: `انفجر اللغم بوجه ${drawerName} وخرج! باقي ${nextAlive.length} ناجين.`,
              en: `${drawerName} exploded! ${nextAlive.length} survivors remain.`,
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

      const drawnMeta = BOOM_CARD_META[topCard.type];

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
        lastCinematic: {
          id: `cin_draw_${Date.now()}`,
          type: 'draw_safe',
          actorId: drawerId,
          drawnCardType: topCard.type,
          subtitle_ar:
            nextTurnPlayerId === drawerId
              ? `${drawerName} سحب كرتاً آمناً! باقي عليه (${nextTurnsRemaining}) سحبة.`
              : `${drawerName} سحب كرتاً آمناً ونجا! الدور الآن عند ${getPlayerName(
                  nextTurnPlayerId
                )}.`,
          subtitle_en:
            nextTurnPlayerId === drawerId
              ? `${drawerName} drew a safe card! (${nextTurnsRemaining} draw left).`
              : `${drawerName} drew safe! Now it’s ${getPlayerName(
                  nextTurnPlayerId
                )}’s turn.`,
          timestamp: Date.now(),
        },
        actionLog: [
          {
            ar:
              nextTurnPlayerId === drawerId
                ? `${drawerName} سحب كرتاً آمناً (${drawnMeta.name_ar})! باقي عليه (${nextTurnsRemaining}) سحبة.`
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
    }, 680);
  };

  // Re-plant the defused bomb at ANY exact position (0 .. nextDeck.length) or random in the Draw Pile!
  const handlePlantBombAt = (
    positionChoice:
      | number
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
    if (typeof positionChoice === 'number') {
      insertIdx = Math.max(0, Math.min(nextDeck.length, positionChoice));
    } else if (positionChoice === 'top_0') {
      insertIdx = 0;
    } else if (positionChoice === 'top_1') {
      insertIdx = Math.min(1, nextDeck.length);
    } else if (positionChoice === 'top_2') {
      insertIdx = Math.min(2, nextDeck.length);
    } else if (positionChoice === 'middle') {
      insertIdx = Math.floor(nextDeck.length / 2);
    } else if (positionChoice === 'bottom') {
      insertIdx = nextDeck.length;
    } else {
      insertIdx = Math.floor(Math.random() * (nextDeck.length + 1));
    }

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

  const selectedCard = myHand.find((c) => c.id === selectedCardId) || null;
  const crisisPlayerId = gameData.crisisPlayerId || gameData.turnPlayerId;
  const isCrisisMine = activeViewerId === crisisPlayerId;

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
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-white">
                {ar ? 'طاولة الفتيل الملعون' : 'Boom Deck Table'}
              </h2>
              <span className="cartoon-badge bg-[#ffca3a] text-[#161426] px-2.5 py-0.5 text-[11px]">
                {ar ? `الجولة ${gameData.round}` : `Round ${gameData.round}`}
              </span>
              <span className="cartoon-badge bg-[#8ac926] text-[#161426] px-2.5 py-0.5 text-[11px] hidden sm:inline-flex">
                {ar
                  ? `الناجون: ${gameData.alivePlayerIds.length}/${players.length}`
                  : `Alive: ${gameData.alivePlayerIds.length}/${players.length}`}
              </span>
              <span className="cartoon-badge bg-[#a855f7] text-white px-2.5 py-0.5 text-[11px] hidden md:inline-flex">
                {ar
                  ? getPlayerCountDeckSpec(players.length).tier_ar
                  : getPlayerCountDeckSpec(players.length).tier_en}
              </span>
            </div>
            <p className="text-[11px] font-bold text-white/75 hidden md:block">
              {ar
                ? 'العب كروت القدرات من يدك أو اضغط على كومة السحب بالوسط لسحب كرت وإنهاء دورك.'
                : 'Play ability cards from your hand or tap the center Draw Pile to draw 1 card.'}
            </p>
          </div>
        </div>

        {/* Live Action Ticker in Center of Top Bar */}
        {gameData.actionLog?.[0] && (
          <div className="hidden xl:flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-[#110e24] border-2 border-white/15 text-xs font-extrabold text-[#ffca3a] max-w-md truncate">
            <SpeakerHigh
              weight="fill"
              className="w-4 h-4 text-[#ff595e] shrink-0"
            />
            <span className="truncate">
              {ar ? gameData.actionLog[0].ar : gameData.actionLog[0].en}
            </span>
          </div>
        )}

        {/* Right Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <div
            className={`cartoon-badge px-3 py-1 text-xs flex items-center gap-1.5 ${
              bombRiskPercent >= 50
                ? 'bg-[#e11d48] text-white'
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
        <div className="cartoon-card p-3.5 bg-[#fff9ec] grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <div className="p-2.5 rounded-2xl bg-[#e0f2fe] border-3 border-[#161426] flex items-center gap-2.5">
            <div className="w-14 h-12 rounded-xl overflow-hidden border-2 border-[#161426] shrink-0">
              <BoomCardIllustrationSvg type="skip" />
            </div>
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
            <div className="w-14 h-12 rounded-xl overflow-hidden border-2 border-[#161426] shrink-0">
              <BoomCardIllustrationSvg type="bomb" />
            </div>
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
            <div className="w-14 h-12 rounded-xl overflow-hidden border-2 border-[#161426] shrink-0">
              <BoomCardIllustrationSvg type="defuse" />
            </div>
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
             - 100% LOCKED GEOMETRY (Fixed Height = Zero Growing/Shrinking!)
         ==================================================================== */}
      <div
        className={`relative w-full rounded-[42px] border-[8px] border-[#3b2314] ring-4 ring-[#161426] shadow-[0_14px_0_#161426,inset_0_0_80px_rgba(0,0,0,0.75)] overflow-hidden flex flex-col justify-between p-3 sm:p-5 ${
          isFullscreen ? 'flex-1 h-full' : 'h-[760px] sm:h-[800px]'
        } ${
          gameData.phase === 'bomb_crisis' || bombRiskPercent >= 50
            ? 'bg-[radial-gradient(ellipse_at_center,#4c1122_0%,#250914_60%,#12040a_100%)]'
            : 'bg-[radial-gradient(ellipse_at_center,#1b4d3e_0%,#0f2e24_62%,#071712_100%)]'
        }`}
      >
        {/* Decorative Inner Gold Casino Felt Rim Line */}
        <div className="pointer-events-none absolute inset-3 sm:inset-5 rounded-[34px] border-2 border-[#ffca3a]/20" />

        {/* BACKGROUND FELT TRACK & ACTIVE TURN GLOW (z-10) */}
        <ArenaTableFeltTrackSvg
          seatCoords={seatCoords}
          turnPlayerId={gameData.turnPlayerId}
        />

        {/* PREMIUM SINGLE-SHOT IN-ARENA SPATIAL FX LAYER (z-40 Foreground) */}
        <ArenaSpatialFXLayer
          seatCoords={seatCoords}
          cinematic={activeCinematic}
          suppressSelfDrawFlight={
            isPassAndPlay || activeCinematic?.actorId === myPlayerId
          }
          ar={ar}
        />

        {/* ABSOLUTE FLOATING EVENT PILL (Zero Layout Shift!) */}
        {activeCinematic && (
          <div className="pointer-events-none absolute top-3 left-1/2 -translate-x-1/2 z-50 max-w-lg w-[90%] sm:w-auto px-4 py-1.5 rounded-full bg-[#161426]/95 border-2 border-[#ffca3a] shadow-[0_4px_0_#161426] flex items-center justify-center gap-2.5">
            <Sparkle weight="fill" className="w-4 h-4 text-[#ffca3a] shrink-0" />
            <div className="text-xs font-extrabold text-white truncate">
              {ar ? activeCinematic.subtitle_ar : activeCinematic.subtitle_en}
            </div>
          </div>
        )}

        {/* ==================================================================
            A) UPPER / PERIMETER SEATS: FIXED-HEIGHT RIVAL ROW (h-[132px])
           ================================================================== */}
        <div className="relative z-30 h-[132px] shrink-0 flex items-start justify-around gap-3 pt-1">
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

            return (
              <div
                key={riv.id}
                onClick={() => {
                  if (isTargetable && selectedCard) {
                    const copies = handTypeCounts[selectedCard.type] || 1;
                    if (copies >= 3) {
                      setPickingMagnetTarget(false);
                      setComboBuilder({
                        card: selectedCard,
                        targetPlayerId: riv.id,
                      });
                    } else if (
                      isComboSetCard(selectedCard.type) ||
                      (selectedCard.type !== 'magnet' && copies >= 2)
                    ) {
                      handleInitiateCardPlay(selectedCard, riv.id, 2);
                    } else {
                      handleInitiateCardPlay(selectedCard, riv.id, 1);
                    }
                  }
                }}
                className={`group flex flex-col items-center transition-transform duration-200 ${
                  !alive
                    ? 'opacity-50 grayscale'
                    : isTargetable
                    ? 'cursor-pointer hover:scale-105'
                    : ''
                }`}
              >
                {/* Seat Station Pod */}
                <div
                  className={`relative px-3.5 py-2 rounded-2xl border-3 border-[#161426] shadow-[0_5px_0_#161426] flex items-center gap-2.5 min-w-[168px] transition-colors ${
                    !alive
                      ? 'bg-[#1e1b2e] text-white/60'
                      : isTargetable
                      ? 'bg-[#ffedd5] text-[#161426] ring-4 ring-[#f97316]'
                      : isTurn
                      ? 'bg-[#ffca3a] text-[#161426] ring-3 ring-[#ffca3a]/40'
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
                        'دوره'
                      ) : (
                        'TURN'
                      )}
                    </span>
                  )}

                  {isTargetable && (
                    <span className="cartoon-badge bg-[#f97316] text-white px-2 py-0.5 text-[10px] flex items-center gap-1">
                      <Crosshair weight="bold" className="w-3.5 h-3.5" />
                      <span>{ar ? 'اسرق كرت' : 'Steal'}</span>
                    </span>
                  )}
                </div>

                {/* NEATLY ORDERED UPRIGHT CARD-BACKS HELD IN FRONT OF THIS RIVAL */}
                {alive && cardCount > 0 && (
                  <div
                    dir="ltr"
                    className={`flex items-center justify-center -space-x-2.5 mt-1 transition-transform ${
                      isTargetable ? 'group-hover:-translate-y-1' : ''
                    }`}
                  >
                    {Array.from({ length: visibleFanCount }).map((_, cIdx) => (
                      <div
                        key={cIdx}
                        className="drop-shadow-[0_3px_0_#161426] transition-transform duration-200"
                      >
                        <BoomCardBackSvg className="w-8 h-12 sm:w-9 sm:h-[52px]" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ==================================================================
            B) CENTER TABLE FELT ARENA (flex-1 relative — Fixed Geometry!)
               - Permanent 3D Draw Pile + Direction Compass + Discard Pile
               - All Modals/Scanners/Banners float as absolute overlays so
                 the screen NEVER grows or shrinks!
           ================================================================== */}
        <div className="relative flex-1 flex items-center justify-center">
          {/* PERMANENT CENTER TABLE CONSOLE: 3D DRAW PILE (415,270) + COMPASS (500,270) + DISCARD PILE (585,270) */}
          <div
            dir="ltr"
            className={`relative ${
              localDrawPreview || localPlayPreview ? 'z-50' : 'z-30'
            } flex items-center justify-center gap-5 sm:gap-10`}
          >
            {/* 1. 3D STACKED COLLECTIBLE DRAW PILE (Always Fill 100% of Card Height — Zero White Gap!) */}
            <div className="flex flex-col items-center">
              <div className="relative">
                {totalDeckCount > 8 && (
                  <div className="absolute inset-0 translate-x-3 translate-y-3 rounded-[24px] bg-[#4c0519] border-[3.5px] border-[#161426]" />
                )}
                {totalDeckCount > 3 && (
                  <div className="absolute inset-0 translate-x-1.5 translate-y-1.5 rounded-[24px] bg-[#881337] border-[3.5px] border-[#161426]" />
                )}

                {/* PHYSICAL DRAWN CARD LIFTING & FLIPPING OUT OF THE DECK! */}
                {localDrawPreview && (
                  <div
                    style={{
                      animation:
                        'boomDrawCardFlight 0.68s cubic-bezier(0.22, 1, 0.36, 1) forwards',
                    }}
                    className="absolute inset-0 z-50 pointer-events-none flex items-center justify-center"
                  >
                    <BoomPlayingCard
                      type={localDrawPreview.card.type}
                      ar={ar}
                      size="lg"
                      actionLabel={
                        localDrawPreview.card.type === 'bomb'
                          ? ar
                            ? 'لغم مشتعل!'
                            : 'LIT BOMB!'
                          : ar
                          ? 'تم سحب الكرت ليدك!'
                          : 'Drawn to Hand!'
                      }
                    />
                  </div>
                )}

                <div
                  role="button"
                  tabIndex={0}
                  dir={ar ? 'rtl' : 'ltr'}
                  style={{
                    width: '176px',
                    height: '248px',
                    display: 'grid',
                    gridTemplateRows: '1fr',
                  }}
                  onClick={() => {
                    if (
                      gameData.phase === 'playing' &&
                      isMyTurn &&
                      !localDrawPreview &&
                      !localPlayPreview
                    ) {
                      handleDrawCard();
                    }
                  }}
                  onKeyDown={(e) => {
                    if (
                      (e.key === 'Enter' || e.key === ' ') &&
                      gameData.phase === 'playing' &&
                      isMyTurn &&
                      !localDrawPreview &&
                      !localPlayPreview
                    ) {
                      e.preventDefault();
                      handleDrawCard();
                    }
                  }}
                  className={`group relative rounded-[24px] bg-[#fffdf7] border-[3.5px] border-[#161426] p-1.5 select-none transition-all duration-200 ${
                    gameData.phase === 'playing' &&
                    isMyTurn &&
                    !localDrawPreview &&
                    !localPlayPreview
                      ? 'shadow-[0_10px_0_#161426] hover:-translate-y-1.5 hover:shadow-[0_14px_0_#161426] cursor-pointer ring-4 ring-[#ffca3a]'
                      : 'opacity-90 shadow-[0_7px_0_#161426] cursor-not-allowed'
                  }`}
                >
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateRows: 'auto 1fr auto',
                    }}
                    className="w-full h-full rounded-[16px] bg-gradient-to-b from-[#9f1239] via-[#881337] to-[#4c0519] border-2 border-[#f59e0b] p-2.5 items-center justify-items-center text-white overflow-hidden"
                  >
                    <div className="w-full flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-md bg-[#161426] text-[#ffca3a] border border-[#f59e0b]/50 text-[11px] font-black">
                        {ar ? `${totalDeckCount} كرت` : `${totalDeckCount} left`}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-black border border-[#161426] ${
                          bombRiskPercent >= 50
                            ? 'bg-[#ffca3a] text-[#161426]'
                            : 'bg-[#161426] text-white'
                        }`}
                      >
                        {bombRiskPercent}% {ar ? 'خطر' : 'Risk'}
                      </span>
                    </div>

                    <div className="w-20 h-20 rounded-2xl bg-[#fffbeb] border-3 border-[#161426] shadow-[0_4px_0_#161426] flex items-center justify-center group-hover:scale-105 transition-transform">
                      <PartyGameSvgIcon
                        gameId="boomdeck"
                        className="w-16 h-16"
                      />
                    </div>

                    <span
                      className={`w-full py-2 rounded-xl border-2 border-[#161426] font-black text-xs flex items-center justify-center gap-1.5 shadow-[0_3px_0_#161426] transition-colors ${
                        gameData.phase === 'playing' && isMyTurn
                          ? 'bg-[#ffca3a] text-[#161426] group-hover:bg-[#fde047]'
                          : 'bg-[#161426]/70 text-white/75'
                      }`}
                    >
                      <HandGrabbing weight="fill" className="w-4 h-4 shrink-0" />
                      <span>
                        {isMyTurn
                          ? ar
                            ? 'اسحب كرتاً (إنهاء الدور)'
                            : 'Draw 1 Card (End Turn)'
                          : ar
                          ? 'كومة السحب'
                          : 'Draw Pile'}
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. CALM, STATIC DIRECTION COMPASS & TURN COUNTER MEDALLION */}
            <div
              dir={ar ? 'rtl' : 'ltr'}
              className="flex flex-col items-center gap-2 text-center"
            >
              <div className="w-[62px] h-[62px] rounded-2xl bg-[#161426]/90 border-3 border-[#ffca3a] shadow-[0_5px_0_#161426] flex flex-col items-center justify-center text-[#ffca3a]">
                <ArrowsClockwise
                  weight="bold"
                  className={`w-6 h-6 transition-transform duration-500 ${
                    gameData.direction === -1 ? '-scale-x-100' : ''
                  }`}
                />
                <span className="text-[10px] font-black text-white mt-0.5">
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
                <div className="cartoon-badge bg-[#e11d48] text-white px-2.5 py-0.5 text-[11px] flex items-center gap-1">
                  <Lightning weight="fill" className="w-3.5 h-3.5 text-[#ffca3a]" />
                  <span>×{gameData.turnsRemaining}</span>
                </div>
              )}
            </div>

            {/* 3. COLLECTIBLE DISCARD PILE (WITH SMOOTH PHYSICAL FLIGHT & LANDING TRANSITION!) */}
            <div className="flex flex-col items-center relative">
              {/* PHYSICAL CARD FLYING SMOOTHLY FROM PLAYER'S HAND ONTO THE DISCARD PILE! */}
              {localPlayPreview && (
                <div
                  style={{
                    animation:
                      'boomPlayCardToCenter 0.46s cubic-bezier(0.22, 1, 0.36, 1) forwards',
                  }}
                  className="absolute inset-0 z-50 pointer-events-none flex items-center justify-center"
                >
                  <BoomPlayingCard
                    type={localPlayPreview.card.type}
                    ar={ar}
                    size="lg"
                    comboBadge={
                      localPlayPreview.comboCount &&
                      localPlayPreview.comboCount >= 2
                        ? `${localPlayPreview.comboCount}× COMBO`
                        : undefined
                    }
                    actionLabel={
                      localPlayPreview.comboCount === 3
                        ? ar
                          ? 'كومبو ثلاثي 3×!'
                          : '3× Triple Combo!'
                        : localPlayPreview.comboCount === 2
                        ? ar
                          ? 'كومبو ثنائي 2×!'
                          : '2× Pair Combo!'
                        : ar
                        ? 'جاري رمي القدرة...'
                        : 'Playing Ability...'
                    }
                  />
                </div>
              )}

              {gameData.discardPile && gameData.discardPile.length > 0 ? (
                (() => {
                  const topDiscard =
                    gameData.discardPile[gameData.discardPile.length - 1];
                  const prevDiscard =
                    gameData.discardPile.length > 1
                      ? gameData.discardPile[gameData.discardPile.length - 2]
                      : null;
                  return (
                    <div className="relative">
                      {prevDiscard && (
                        <div className="absolute inset-0 -translate-x-1.5 translate-y-1.5 opacity-55 pointer-events-none">
                          <BoomPlayingCard
                            type={prevDiscard.type}
                            ar={ar}
                            size="lg"
                          />
                        </div>
                      )}
                      <div
                        key={topDiscard.id}
                        style={{
                          animation:
                            'boomDiscardSettle 0.32s cubic-bezier(0.22, 1, 0.36, 1) forwards',
                        }}
                        className="relative"
                      >
                        <BoomPlayingCard
                          type={topDiscard.type}
                          ar={ar}
                          size="lg"
                          actionLabel={
                            ar ? 'آخر قدرة ملعوبة' : 'Last Played Card'
                          }
                        />
                      </div>
                    </div>
                  );
                })()
              ) : (
                <div
                  dir={ar ? 'rtl' : 'ltr'}
                  style={{ width: '176px', height: '248px' }}
                  className="rounded-[24px] border-4 border-dashed border-[#ffca3a]/30 bg-[#161426]/40 flex flex-col items-center justify-center p-4 text-center text-white/60"
                >
                  <Sparkle
                    weight="fill"
                    className="w-9 h-9 mb-2 text-[#ffca3a]/60"
                  />
                  <span className="text-xs font-extrabold">
                    {ar ? 'ساحة رمي القدرات' : 'Played Ability Pile'}
                  </span>
                  <span className="text-[10px] font-bold opacity-75 mt-1">
                    {ar
                      ? 'ارمِ كرت قدرة من يدك ليستقر هنا'
                      : 'Play a card from your hand onto the table'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* ==================================================================
              DRAMATIC 2-BEAT "BOMB ABOUT TO BLOW -> WIRE CUTTERS RESCUE!" STAGE
              Beat 1 (0.0s - 0.95s): Vertical 3-Stick C4 Bundle (matching boomdeck icon!)
                shakes, swells, and ticks 00:03 -> 00:02 -> 00:01 as the fuse burns down!
              Beat 2 (0.95s - 1.85s): Chrome Wire Cutters swoop in diagonally from top-right,
                snip the fuse with their blade tips at (154, 42) so the upper fuse recoils &
                flies away while the timer turns green SAFE ✓!
             ================================================================== */}
          {defuseShowdown && (
            <div className="pointer-events-none absolute inset-0 z-[65] flex items-center justify-center">
              <div className="relative w-[340px] h-[265px] rounded-[32px] bg-[#161426]/95 border-4 border-[#ffca3a] shadow-[0_14px_0_#090712] flex flex-col items-center justify-center p-3 overflow-hidden">
                <svg
                  viewBox="0 0 280 185"
                  className="w-full h-full overflow-visible"
                >
                  <defs>
                    <linearGradient id="showdownC4Side" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#fb7185" />
                      <stop offset="45%" stopColor="#e11d48" />
                      <stop offset="100%" stopColor="#9f1239" />
                    </linearGradient>
                    <linearGradient id="showdownC4Center" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#fda4af" />
                      <stop offset="40%" stopColor="#f43f5e" />
                      <stop offset="100%" stopColor="#be123c" />
                    </linearGradient>
                    <linearGradient id="showdownChrome" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#ffffff" />
                      <stop offset="50%" stopColor="#e2e8f0" />
                      <stop offset="100%" stopColor="#94a3b8" />
                    </linearGradient>
                  </defs>

                  {/* 1. Pulsing Red Danger Ring (0.0s -> 0.95s) */}
                  <circle
                    cx="132"
                    cy="102"
                    r="44"
                    fill="none"
                    stroke="#e11d48"
                    strokeWidth="4"
                  >
                    <animate
                      attributeName="r"
                      values="38; 88; 38; 92"
                      keyTimes="0; 0.45; 0.5; 1"
                      dur="0.95s"
                      fill="freeze"
                    />
                    <animate
                      attributeName="opacity"
                      values="0.85; 0; 0.9; 0"
                      keyTimes="0; 0.45; 0.5; 1"
                      dur="0.95s"
                      fill="freeze"
                    />
                  </circle>

                  {/* Grounded Stage Shadow */}
                  <ellipse
                    cx="132"
                    cy="154"
                    rx="58"
                    ry="9"
                    fill="#090712"
                    opacity="0.55"
                  />

                  {/* 2. Ticking & Swelling Vertical 3-Stick C4 Bundle (Direct Match to boomdeck Icon!) */}
                  <g>
                    <animateTransform
                      attributeName="transform"
                      type="translate"
                      values="0,0; -4,-3; 4,2; -5,2; 5,-3; -6,3; 6,-2; 0,0; 0,0"
                      keyTimes="0; 0.12; 0.24; 0.36; 0.48; 0.60; 0.72; 0.80; 1"
                      dur="1.2s"
                      fill="freeze"
                    />
                    <g transform="translate(132, 108)">
                      <animateTransform
                        attributeName="transform"
                        type="scale"
                        values="0.96; 1.06; 1.16; 1.0; 1.0"
                        keyTimes="0; 0.45; 0.76; 0.90; 1"
                        dur="1.25s"
                        additive="sum"
                        fill="freeze"
                      />

                      {/* Back Fanned Gold & Cyan Ability Cards (Echoing boomdeck Icon!) */}
                      <g transform="rotate(-16 -24 -4)">
                        <rect
                          x="-52"
                          y="-36"
                          width="36"
                          height="52"
                          rx="6.5"
                          fill="#f59e0b"
                          stroke="#161426"
                          strokeWidth="3.4"
                        />
                        <rect
                          x="-47.5"
                          y="-31.5"
                          width="27"
                          height="43"
                          rx="4"
                          fill="none"
                          stroke="#fff9ec"
                          strokeWidth="1.6"
                          strokeDasharray="4 3"
                        />
                      </g>
                      <g transform="rotate(14 24 -4)">
                        <rect
                          x="16"
                          y="-36"
                          width="36"
                          height="52"
                          rx="6.5"
                          fill="#00bbf9"
                          stroke="#161426"
                          strokeWidth="3.4"
                        />
                        <rect
                          x="20.5"
                          y="-31.5"
                          width="27"
                          height="43"
                          rx="4"
                          fill="#e0f2fe"
                        />
                      </g>

                      {/* Left Vertical C4 Cylinder + Specular Highlight */}
                      <rect
                        x="-36"
                        y="-32"
                        width="22"
                        height="68"
                        rx="7.5"
                        fill="url(#showdownC4Side)"
                        stroke="#161426"
                        strokeWidth="3.6"
                      />
                      <line
                        x1="-30"
                        y1="-25"
                        x2="-30"
                        y2="29"
                        stroke="#fecdd3"
                        strokeWidth="3"
                        strokeLinecap="round"
                        opacity="0.85"
                      />

                      {/* Right Vertical C4 Cylinder + Specular Highlight */}
                      <rect
                        x="14"
                        y="-32"
                        width="22"
                        height="68"
                        rx="7.5"
                        fill="url(#showdownC4Side)"
                        stroke="#161426"
                        strokeWidth="3.6"
                      />
                      <line
                        x1="20"
                        y1="-25"
                        x2="20"
                        y2="29"
                        stroke="#fecdd3"
                        strokeWidth="3"
                        strokeLinecap="round"
                        opacity="0.85"
                      />

                      {/* Center Tall C4 Cylinder + Bright Specular Highlight */}
                      <rect
                        x="-14"
                        y="-39"
                        width="28"
                        height="78"
                        rx="8.5"
                        fill="url(#showdownC4Center)"
                        stroke="#161426"
                        strokeWidth="3.8"
                      />
                      <line
                        x1="-7"
                        y1="-32"
                        x2="-7"
                        y2="32"
                        stroke="#ffffff"
                        strokeWidth="3.4"
                        strokeLinecap="round"
                        opacity="0.9"
                      />

                      {/* Horizontal Tactical Steel & Carbon Straps */}
                      <rect
                        x="-40"
                        y="-19"
                        width="80"
                        height="8"
                        rx="3"
                        fill="#161426"
                      />
                      <rect
                        x="-40"
                        y="14"
                        width="80"
                        height="8"
                        rx="3"
                        fill="#161426"
                      />

                      {/* Digital Countdown Screen (Unobscured Center Stage!) */}
                      <rect
                        x="-30"
                        y="-14"
                        width="60"
                        height="28"
                        rx="6"
                        fill="#161426"
                        stroke="#ffca3a"
                        strokeWidth="3.2"
                      >
                        <animate
                          attributeName="stroke"
                          values="#ffca3a; #e11d48; #22c55e"
                          keyTimes="0; 0.52; 1"
                          dur="1.1s"
                          fill="freeze"
                        />
                      </rect>
                      <rect
                        x="-25.5"
                        y="-9.5"
                        width="51"
                        height="19"
                        rx="3.5"
                        fill="#090d16"
                      />

                      {/* Countdown Tick 1: 00:03 (0.0s -> 0.32s) */}
                      <text
                        x="0"
                        y="5"
                        textAnchor="middle"
                        fill="#ffca3a"
                        fontSize="14.5"
                        fontWeight="900"
                        fontFamily="monospace"
                      >
                        00:03
                        <animate
                          attributeName="opacity"
                          values="1; 1; 0; 0"
                          keyTimes="0; 0.29; 0.31; 1"
                          dur="1.05s"
                          fill="freeze"
                        />
                      </text>
                      {/* Countdown Tick 2: 00:02 (0.32s -> 0.64s) */}
                      <text
                        x="0"
                        y="5"
                        textAnchor="middle"
                        fill="#fb7185"
                        fontSize="14.5"
                        fontWeight="900"
                        fontFamily="monospace"
                        opacity="0"
                      >
                        00:02
                        <animate
                          attributeName="opacity"
                          values="0; 0; 1; 1; 0; 0"
                          keyTimes="0; 0.29; 0.31; 0.59; 0.61; 1"
                          dur="1.05s"
                          fill="freeze"
                        />
                      </text>
                      {/* Countdown Tick 3: 00:01 (0.64s -> 0.95s) */}
                      <text
                        x="0"
                        y="5"
                        textAnchor="middle"
                        fill="#ff595e"
                        fontSize="15"
                        fontWeight="900"
                        fontFamily="monospace"
                        opacity="0"
                      >
                        00:01
                        <animate
                          attributeName="opacity"
                          values="0; 0; 1; 1; 0; 0"
                          keyTimes="0; 0.59; 0.61; 0.88; 0.91; 1"
                          dur="1.05s"
                          fill="freeze"
                        />
                      </text>
                      {/* Defused SAFE ✓ Text (0.95s -> 1.85s) */}
                      <text
                        x="0"
                        y="4.5"
                        textAnchor="middle"
                        fill="#22c55e"
                        fontSize="13.5"
                        fontWeight="900"
                        opacity="0"
                      >
                        SAFE ✓
                        <animate
                          attributeName="opacity"
                          values="0; 0; 1"
                          keyTimes="0; 0.89; 1"
                          dur="1.08s"
                          fill="freeze"
                        />
                      </text>
                    </g>
                  </g>

                  {/* 3A. Intact Braided Fuse Before the Snip (0.0s -> 0.95s) */}
                  <g>
                    <animate
                      attributeName="opacity"
                      values="1; 1; 0; 0"
                      keyTimes="0; 0.56; 0.58; 1"
                      dur="1.65s"
                      fill="freeze"
                    />
                    <path
                      d="M 132 69 C 132 50, 152 38, 178 24"
                      fill="none"
                      stroke="#161426"
                      strokeWidth="8.5"
                      strokeLinecap="round"
                    />
                    <path
                      d="M 132 69 C 132 50, 152 38, 178 24"
                      fill="none"
                      stroke="#d97706"
                      strokeWidth="4.8"
                      strokeLinecap="round"
                    />
                    <path
                      d="M 132 69 C 132 50, 152 38, 178 24"
                      fill="none"
                      stroke="#161426"
                      strokeWidth="2.2"
                      strokeDasharray="4 4"
                      strokeLinecap="round"
                    />
                  </g>

                  {/* Burning Spark Racing Down Fuse Toward the Snip Point (148, 43) */}
                  <g>
                    <animateTransform
                      attributeName="transform"
                      type="translate"
                      values="178,24; 162,33; 148,43"
                      keyTimes="0; 0.5; 1"
                      dur="0.95s"
                      fill="freeze"
                    />
                    <animate
                      attributeName="opacity"
                      values="1; 1; 0"
                      keyTimes="0; 0.92; 1"
                      dur="0.96s"
                      fill="freeze"
                    />
                    <polygon
                      points="0,-16 4,-5 16,-8 7,1 14,11 3,7 0,18 -3,7 -14,11 -7,1 -16,-8 -4,-5"
                      fill="#ffca3a"
                      stroke="#161426"
                      strokeWidth="2.5"
                      strokeLinejoin="round"
                    />
                    <circle r="5" fill="#ffffff" />
                  </g>

                  {/* 3B. Post-Snip Lower Fuse Stump + Recoiling Severed Upper Fuse Piece (0.95s -> 1.85s)! */}
                  <g opacity="0">
                    <animate
                      attributeName="opacity"
                      values="0; 0; 1; 1"
                      keyTimes="0; 0.56; 0.58; 1"
                      dur="1.65s"
                      fill="freeze"
                    />
                    {/* Lower Safe Fuse Stump Attached to C4 */}
                    <path
                      d="M 132 69 C 132 57, 138 49, 145 45"
                      fill="none"
                      stroke="#161426"
                      strokeWidth="8.5"
                      strokeLinecap="round"
                    />
                    <path
                      d="M 132 69 C 132 57, 138 49, 145 45"
                      fill="none"
                      stroke="#d97706"
                      strokeWidth="4.8"
                      strokeLinecap="round"
                    />
                    {/* Severed Upper Fuse Half Flying Away & Fading Out! */}
                    <g>
                      <animateTransform
                        attributeName="transform"
                        type="translate"
                        values="0,0; 0,0; 28,-22"
                        keyTimes="0; 0.57; 1"
                        calcMode="spline"
                        keySplines="0 0 1 1; 0.22 1 0.36 1"
                        dur="1.65s"
                        fill="freeze"
                      />
                      <animate
                        attributeName="opacity"
                        values="1; 1; 0"
                        keyTimes="0; 0.68; 1"
                        dur="1.65s"
                        fill="freeze"
                      />
                      <path
                        d="M 152 41 C 162 34, 170 29, 178 24"
                        fill="none"
                        stroke="#161426"
                        strokeWidth="8.5"
                        strokeLinecap="round"
                      />
                      <path
                        d="M 152 41 C 162 34, 170 29, 178 24"
                        fill="none"
                        stroke="#f43f5e"
                        strokeWidth="4.8"
                        strokeDasharray="4 4"
                        strokeLinecap="round"
                      />
                      <circle
                        cx="154"
                        cy="40"
                        r="5.5"
                        fill="#ffca3a"
                        stroke="#161426"
                        strokeWidth="2"
                      />
                    </g>
                  </g>

                  {/* 4. WIRE CUTTERS ("مقص الإنقاذ") SWOOPING IN DIAGONALLY FROM TOP-RIGHT!
                      Pivot sits at (164, 54) rotated -56 deg so the cutting jaw tips (0, -20)
                      meet the fuse cleanly at (148, 43) while green handles stay to the right,
                      100% clear of the 00:03 -> 00:01 -> SAFE ✓ screen! */}
                  <g opacity="0">
                    <animate
                      attributeName="opacity"
                      values="0; 0; 1; 1"
                      keyTimes="0; 0.32; 0.45; 1"
                      dur="1.4s"
                      fill="freeze"
                    />
                    <animateTransform
                      attributeName="transform"
                      type="translate"
                      values="236,6; 236,6; 164,54; 164,54"
                      keyTimes="0; 0.32; 0.62; 1"
                      calcMode="spline"
                      keySplines="0 0 1 1; 0.22 1 0.36 1; 0 0 1 1"
                      dur="1.4s"
                      fill="freeze"
                    />
                    <g transform="rotate(-56)">
                      {/* Left Cutter Jaw & Green Insulated Handle (Snaps shut from -28 deg -> 0 deg!) */}
                      <g>
                        <animateTransform
                          attributeName="transform"
                          type="rotate"
                          values="-28; -28; 0; 0"
                          keyTimes="0; 0.54; 0.68; 1"
                          dur="1.4s"
                          fill="freeze"
                        />
                        <path
                          d="M 0 -2 L -19 -28 C -11 -35, -2 -30, 0 -16 Z"
                          fill="url(#showdownChrome)"
                          stroke="#161426"
                          strokeWidth="3.5"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M -3 3 L -26 38 C -30 43, -21 47, -16 40 L 2 8 Z"
                          fill="#22c55e"
                          stroke="#161426"
                          strokeWidth="3.5"
                          strokeLinejoin="round"
                        />
                        <line
                          x1="-6"
                          y1="10"
                          x2="-20"
                          y2="34"
                          stroke="#bbf7d0"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                        />
                      </g>

                      {/* Right Cutter Jaw & Green Insulated Handle (Snaps shut from +28 deg -> 0 deg!) */}
                      <g>
                        <animateTransform
                          attributeName="transform"
                          type="rotate"
                          values="28; 28; 0; 0"
                          keyTimes="0; 0.54; 0.68; 1"
                          dur="1.4s"
                          fill="freeze"
                        />
                        <path
                          d="M 0 -2 L 19 -28 C 11 -35, 2 -30, 0 -16 Z"
                          fill="url(#showdownChrome)"
                          stroke="#161426"
                          strokeWidth="3.5"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M 3 3 L 26 38 C 30 43, 21 47, 16 40 L -2 8 Z"
                          fill="#16a34a"
                          stroke="#161426"
                          strokeWidth="3.5"
                          strokeLinejoin="round"
                        />
                        <line
                          x1="6"
                          y1="10"
                          x2="20"
                          y2="34"
                          stroke="#86efac"
                          strokeWidth="2.2"
                          strokeLinecap="round"
                        />
                      </g>

                      {/* Golden Brass Pivot Bolt */}
                      <circle
                        cx="0"
                        cy="0"
                        r="7.5"
                        fill="#ffca3a"
                        stroke="#161426"
                        strokeWidth="3.4"
                      />
                      <circle cx="0" cy="0" r="2.8" fill="#fff9ec" />
                    </g>
                  </g>

                  {/* 5. 3-Layer Emerald-Cyan & Gold Snip Flash at Blade Tips (148, 43) */}
                  <g transform="translate(148, 43)" opacity="0">
                    <animate
                      attributeName="opacity"
                      values="0; 0; 1; 0"
                      keyTimes="0; 0.56; 0.63; 1"
                      dur="1.65s"
                      fill="freeze"
                    />
                    <circle r="10" fill="none" stroke="#00f5d4" strokeWidth="4">
                      <animate
                        attributeName="r"
                        values="8; 8; 48"
                        keyTimes="0; 0.56; 1"
                        dur="1.65s"
                        fill="freeze"
                      />
                    </circle>
                    <polygon
                      points="0,-20 5,-6 19,-6 8,3 12,17 0,9 -12,17 -8,3 -19,-6 -5,-6"
                      fill="#00f5d4"
                      stroke="#161426"
                      strokeWidth="2.6"
                      strokeLinejoin="round"
                    />
                    <polygon
                      points="0,-11 3,-3 11,-3 4,2 7,10 0,5 -7,10 -4,2 -11,-3 -3,-3"
                      fill="#ffca3a"
                    />
                    <circle r="4.5" fill="#ffffff" />
                  </g>
                </svg>

                <div className="px-3.5 py-1 rounded-full bg-[#22c55e] text-[#161426] border-2 border-[#161426] font-black text-xs shadow-[0_3px_0_#090712]">
                  {ar
                    ? 'تدخّل «مقص الإنقاذ» وقصّ الفتيل قبل الانفجار!'
                    : 'Wire Cutters snipped the fuse just in time!'}
                </div>
              </div>
            </div>
          )}
          <style>{`
            @keyframes boomDrawCardFlight {
              0% {
                transform: perspective(900px) translateY(0px) scale(0.92) rotateY(90deg);
                opacity: 0.9;
              }
              45% {
                transform: perspective(900px) translateY(-34px) scale(1.08) rotateY(0deg);
                opacity: 1;
              }
              100% {
                transform: perspective(900px) translateY(138px) scale(0.96) rotateY(0deg);
                opacity: 0.98;
              }
            }
            @keyframes boomPlayCardToCenter {
              0% {
                transform: perspective(900px) translateY(155px) scale(0.88);
                opacity: 0.85;
              }
              60% {
                transform: perspective(900px) translateY(-14px) scale(1.05);
                opacity: 1;
              }
              100% {
                transform: perspective(900px) translateY(0px) scale(1);
                opacity: 1;
              }
            }
            @keyframes boomDiscardSettle {
              0% {
                transform: scale(1.04) translateY(-6px);
              }
              100% {
                transform: scale(1) translateY(0px);
              }
            }
          `}</style>

          {/* ABSOLUTE FLOATING TARGETING & SPECIAL-COMBO BAR (Zero Layout Shift!) */}
          {pickingMagnetTarget && (
            <div className="absolute top-1 left-1/2 -translate-x-1/2 z-[60] px-3.5 py-2 rounded-2xl bg-[#f97316] text-white border-3 border-[#161426] shadow-[0_6px_0_#161426] flex flex-wrap items-center justify-center gap-2.5">
              {/* If this is a Special Ability card (not Combo Set, not Magnet, not Block) that has 2+ copies, let the player either play 1x normal ability OR click a rival for 2x/3x Combo! */}
              {selectedCard &&
                !isComboSetCard(selectedCard.type) &&
                selectedCard.type !== 'magnet' &&
                selectedCard.type !== 'block' && (
                  <button
                    type="button"
                    onClick={() => handleInitiateCardPlay(selectedCard, undefined, 1)}
                    className="cartoon-btn bg-[#8ac926] hover:bg-[#9ef01a] text-[#161426] px-3 py-1 text-xs font-black cursor-pointer flex items-center gap-1"
                  >
                    <Lightning weight="fill" className="w-3.5 h-3.5" />
                    <span>
                      {ar
                        ? `العب قدرة «${
                            BOOM_CARD_META[selectedCard.type].name_ar
                          }» العادية (1×)`
                        : `Play 1× Normal "${
                            BOOM_CARD_META[selectedCard.type].name_en
                          }"`}
                    </span>
                  </button>
                )}

              <div className="flex items-center gap-1.5 text-xs sm:text-sm font-black">
                <Magnet weight="fill" className="w-4 h-4 text-[#ffca3a] shrink-0" />
                <span>
                  {selectedCard &&
                  (handTypeCounts[selectedCard.type] || 0) >= 3
                    ? ar
                      ? 'اضغط على الخصم فوق لكومبو (3× طلب كرت بالاسم)!'
                      : 'Tap a rival above for 3× Combo (Claim Named Card)!'
                    : selectedCard &&
                      (isComboSetCard(selectedCard.type) ||
                        (handTypeCounts[selectedCard.type] || 0) >= 2)
                    ? ar
                      ? 'اضغط على الخصم فوق لكومبو (2× سرقة كرت عشوائي)!'
                      : 'Tap a rival above for 2× Combo (Steal Random Card)!'
                    : ar
                    ? 'اضغط على أي خصم فوق لسحب كرت عشوائي من يده!'
                    : 'Tap any rival above to steal a random card!'}
                </span>
              </div>

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

          {/* ULTRA-CLEAN 1-CLICK CARD PICKER (Only appears for 3× Combo after clicking a rival!) */}
          {comboBuilder && (
            <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 z-[60] mx-auto cartoon-card p-4 bg-[#fffdf7] border-4 border-[#161426] text-[#161426] space-y-3 shadow-[0_12px_0_#161426] max-w-md w-full">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm sm:text-base font-black text-[#161426]">
                  {ar
                    ? `أي كرت تطلب من يد ${getPlayerName(
                        comboBuilder.targetPlayerId
                    )}؟`
                    : `Which card do you want from ${getPlayerName(
                        comboBuilder.targetPlayerId
                    )}?`}
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setComboBuilder(null);
                    setSelectedCardId(null);
                  }}
                  className="px-2.5 py-1 rounded-xl bg-[#e11d48] text-white text-xs font-black border-2 border-[#161426] cursor-pointer"
                >
                  {ar ? 'إلغاء ✕' : 'Cancel ✕'}
                </button>
              </div>

              {/* Clean 3×4 Grid of Cards — 1 Click Immediately Executes! */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {(
                  [
                    'defuse',
                    'block',
                    'attack',
                    'skip',
                    'radar',
                    'magnet',
                    'reverse',
                    'shuffle',
                    'combo_shawarma',
                    'combo_kabsa',
                    'combo_karak',
                    'combo_falcon',
                  ] as BoomCardType[]
                ).map((cType) => {
                  const cMeta = BOOM_CARD_META[cType];
                  return (
                    <button
                      key={cType}
                      type="button"
                      onClick={() =>
                        handleInitiateCardPlay(
                          comboBuilder.card,
                          comboBuilder.targetPlayerId,
                          3,
                          cType
                        )
                      }
                      style={{ backgroundColor: cMeta.bg }}
                      className="p-1.5 rounded-xl border-2 border-[#161426] shadow-[0_2px_0_#161426] hover:-translate-y-0.5 transition-transform flex items-center gap-1.5 text-start cursor-pointer"
                    >
                      <span
                        style={{ backgroundColor: cMeta.badgeBg }}
                        className="w-6 h-6 rounded-lg border-2 border-[#161426] text-white text-[10px] font-black flex items-center justify-center shrink-0"
                      >
                        {cMeta.symbol}
                      </span>
                      <span className="text-[11px] font-black text-[#161426] truncate">
                        {ar ? cMeta.name_ar : cMeta.name_en}
                      </span>
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() =>
                  handleInitiateCardPlay(
                    comboBuilder.card,
                    comboBuilder.targetPlayerId,
                    comboBuilder.card.type === 'magnet' ? 1 : 2
                  )
                }
                className="w-full py-1.5 rounded-xl bg-[#f1f5f9] hover:bg-[#ffca3a] border-2 border-[#161426] text-xs font-extrabold text-[#161426] cursor-pointer transition-colors"
              >
                {comboBuilder.card.type === 'magnet'
                  ? ar
                    ? 'أو العب مغناطيس واحد (1×) فقط لسرقة كرت عشوائي'
                    : 'Or play 1× Magnet only to steal a random card'
                  : ar
                  ? 'أو العب ثنائية (2×) فقط واسرق كرتاً عشوائياً'
                  : 'Or play 2× only to steal a random card'}
              </button>
            </div>
          )}

          {/* ABSOLUTE FLOATING X-RAY RADAR SCANNER OVERLAY (With Interactive Close Button!) */}
          {gameData.radarPeekPlayerId === activeViewerId &&
            !radarDismissed &&
            gameData.radarCards &&
            gameData.radarCards.length > 0 && (
              <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 z-[60] mx-auto p-4 rounded-3xl bg-[#161426]/95 border-4 border-[#00f5d4] shadow-[0_12px_0_#161426] text-white space-y-3 max-w-xl w-full">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs sm:text-sm font-black text-[#00f5d4]">
                    <Broadcast weight="fill" className="w-5 h-5 text-[#f15bb5]" />
                    <span>
                      {ar
                        ? 'كشف الرادار السري (أول 3 كروت بأعلى الكومة):'
                        : 'Secret X-Ray Scan (Top 3 cards of the pile):'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setRadarDismissed(true)}
                    className="cartoon-btn bg-[#ffca3a] text-[#161426] px-3 py-1 text-xs font-black cursor-pointer"
                  >
                    {ar ? 'إغلاق الرادار ✕' : 'Close Radar ✕'}
                  </button>
                </div>

                <div className="flex items-center justify-center gap-3">
                  {gameData.radarCards.map((rc, idx) => (
                    <div
                      key={rc.id}
                      className="flex flex-col items-center gap-1.5"
                    >
                      <span className="px-2.5 py-0.5 rounded-full bg-[#ffca3a] text-[#161426] text-[10px] font-black border-2 border-[#161426]">
                        {idx === 0
                          ? ar
                            ? '1. الأول عالوجه!'
                            : '1. Top Card!'
                          : idx === 1
                          ? ar
                            ? '2. الكرت الثاني'
                            : '2. 2nd Card'
                          : ar
                          ? '3. الكرت الثالث'
                          : '3. 3rd Card'}
                      </span>
                      <BoomPlayingCard type={rc.type} ar={ar} size="sm" />
                    </div>
                  ))}
                </div>

                <div className="flex justify-center pt-1">
                  <button
                    type="button"
                    onClick={() => setRadarDismissed(true)}
                    className="cartoon-btn bg-[#00f5d4] text-[#161426] px-5 py-1.5 text-xs sm:text-sm font-black cursor-pointer"
                  >
                    {ar
                      ? 'حفظت الترتيب — متابعة اللعب'
                      : 'Got It — Continue Playing'}
                  </button>
                </div>
              </div>
            )}

          {/* ABSOLUTE CENTER OVERLAY 1: SMART COUNTER WINDOW
              - ONLY shown to a player who ACTUALLY holds a 'block' card!
              - Players without a 'block' card are NEVER asked to block or execute! */}
          {gameData.phase === 'counter_window' &&
            gameData.pendingAction &&
            (() => {
              const eligibleBlockers = getEligibleBlockerIds(
                gameData,
                gameData.pendingAction
              );
              const viewerCanBlock = isPassAndPlay
                ? eligibleBlockers.length > 0 &&
                  passedCounterId !== gameData.pendingAction.id
                : eligibleBlockers.includes(myPlayerId) &&
                  passedCounterId !== gameData.pendingAction.id;

              if (!viewerCanBlock) return null;

              return (
                <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 z-[60] mx-auto cartoon-card p-4 bg-[#fffdf7] border-4 border-[#161426] text-center space-y-2.5 shadow-[0_12px_0_#161426] max-w-lg w-full">
                  <div className="inline-flex items-center gap-2 px-3.5 py-0.5 rounded-full bg-[#e11d48] text-white border-2 border-[#161426] font-black text-xs">
                    <Prohibit weight="fill" className="w-4 h-4" />
                    <span>
                      {ar
                        ? `لديك كرت «بلوك»! هل تعترض خلال (${counterSecondsLeft} ثوانٍ)؟`
                        : `You hold a BLOCK card! Counter within (${counterSecondsLeft}s)?`}
                    </span>
                  </div>

                  <div className="flex items-center justify-center gap-4 text-start">
                    <BoomPlayingCard
                      type={gameData.pendingAction.cardType}
                      ar={ar}
                      size="sm"
                    />
                    <div className="space-y-1 flex-1">
                      <h3 className="text-base sm:text-lg font-black text-[#161426]">
                        {ar
                          ? `${getPlayerName(
                              gameData.pendingAction.actorId
                            )} لعب «${
                              BOOM_CARD_META[gameData.pendingAction.cardType]
                                .name_ar
                            }»${
                              gameData.pendingAction.comboCount &&
                              gameData.pendingAction.comboCount >= 2
                                ? ` (${gameData.pendingAction.comboCount}×)`
                                : ''
                            }!`
                          : `${getPlayerName(
                              gameData.pendingAction.actorId
                            )} played "${
                              BOOM_CARD_META[gameData.pendingAction.cardType]
                                .name_en
                            }"${
                              gameData.pendingAction.comboCount &&
                              gameData.pendingAction.comboCount >= 2
                                ? ` (${gameData.pendingAction.comboCount}×)`
                                : ''
                            }!`}
                      </h3>
                      <p className="text-xs font-bold text-[#3f3b5c]">
                        {gameData.pendingAction.blockedCount % 2 === 1
                          ? ar
                            ? `مُبطلة حالياً بواسطة ${getPlayerName(
                                gameData.pendingAction.lastBlockerId
                              )}!`
                            : `Currently BLOCKED by ${getPlayerName(
                                gameData.pendingAction.lastBlockerId
                              )}!`
                          : ar
                          ? BOOM_CARD_META[gameData.pendingAction.cardType]
                              .desc_ar
                          : BOOM_CARD_META[gameData.pendingAction.cardType]
                              .desc_en}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                    {!isPassAndPlay && eligibleBlockers.includes(myPlayerId) && (
                      <button
                        type="button"
                        onClick={() => handleSlamBlockCard(myPlayerId)}
                        className="cartoon-btn bg-[#ef4444] hover:bg-[#dc2626] text-white px-4 py-2 text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer"
                      >
                        <Prohibit weight="fill" className="w-4 h-4" />
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
                      eligibleBlockers.map((pid) => (
                        <button
                          key={pid}
                          type="button"
                          onClick={() => handleSlamBlockCard(pid)}
                          className="cartoon-btn bg-[#ef4444] text-white px-3.5 py-1.5 text-xs flex items-center gap-1 cursor-pointer"
                        >
                          <Prohibit weight="fill" className="w-4 h-4" />
                          <span>
                            {ar
                              ? `اكبس بلوك! (${getPlayerName(pid)})`
                              : `Slam BLOCK (${getPlayerName(pid)})`}
                          </span>
                        </button>
                      ))}

                    <button
                      type="button"
                      onClick={() => {
                        setPassedCounterId(
                          gameData.pendingAction?.id || null
                        );
                        resolvePendingAction();
                      }}
                      className="cartoon-btn bg-[#8ac926] text-[#161426] px-4 py-2 text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle weight="fill" className="w-4 h-4" />
                      <span>
                        {ar ? 'تجاهل (لا تعترض)' : 'Pass (Do Not Block)'}
                      </span>
                    </button>
                  </div>
                </div>
              );
            })()}

          {/* (Bomb Crisis is now 100% automatic: Defuse card flies smoothly to the table and opens the Bomb Planting selector directly!) */}

          {/* ABSOLUTE CENTER OVERLAY 3: SECRET BOMB RE-PLANTING VAULT */}
          {gameData.phase === 'planting_bomb' && (
            <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 z-[60] mx-auto cartoon-card p-4 bg-[#fffdf7] border-4 border-[#161426] text-center space-y-3 shadow-[0_12px_0_#161426] max-w-md w-full">
              {isCrisisMine || isPassAndPlay ? (
                <>
                  <h3 className="text-base sm:text-lg font-black text-[#161426]">
                    {ar
                      ? `يا ${getPlayerName(
                          crisisPlayerId
                        )}، وين بدك تزرع الديناميت؟`
                      : `${getPlayerName(
                          crisisPlayerId
                        )}, where do you want to hide the Dynamite?`}
                  </h3>

                  {/* Clean Tactile Cartoon Number Stepper (Pick ANY Exact Card #1 .. #N+1) */}
                  <div className="px-3.5 py-2.5 rounded-2xl bg-[#191636] border-3 border-[#161426] shadow-[0_4px_0_#161426] flex items-center justify-between gap-2 text-white">
                    <span className="text-xs font-extrabold text-white/90">
                      {ar ? 'اختر رقم الكرت:' : 'Pick card #:'}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          setCustomBombSlot((prev) => Math.max(1, prev - 1))
                        }
                        className="w-8 h-8 rounded-xl bg-[#2d2852] hover:bg-[#ffca3a] hover:text-[#161426] border-2 border-[#161426] font-black text-base flex items-center justify-center cursor-pointer transition-colors"
                      >
                        -
                      </button>

                      <span className="min-w-[82px] px-3 py-1 rounded-xl bg-[#110e24] border-2 border-[#ffca3a] text-[#ffca3a] font-black text-xs text-center">
                        {ar
                          ? `كرت #${Math.min(
                              customBombSlot,
                              totalDeckCount + 1
                            )} / ${totalDeckCount + 1}`
                          : `#${Math.min(
                              customBombSlot,
                              totalDeckCount + 1
                            )} / ${totalDeckCount + 1}`}
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          setCustomBombSlot((prev) =>
                            Math.min(totalDeckCount + 1, prev + 1)
                          )
                        }
                        className="w-8 h-8 rounded-xl bg-[#2d2852] hover:bg-[#ffca3a] hover:text-[#161426] border-2 border-[#161426] font-black text-base flex items-center justify-center cursor-pointer transition-colors"
                      >
                        +
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        handlePlantBombAt(
                          Math.min(customBombSlot, totalDeckCount + 1) - 1
                        )
                      }
                      className="cartoon-btn bg-[#ffca3a] hover:bg-[#fde047] text-[#161426] px-4 py-1.5 text-xs font-black shrink-0 cursor-pointer"
                    >
                      {ar
                        ? `ازرع في #${Math.min(
                            customBombSlot,
                            totalDeckCount + 1
                          )}`
                        : `Plant #${Math.min(
                            customBombSlot,
                            totalDeckCount + 1
                          )}`}
                    </button>
                  </div>
                </>
              ) : (
                <div className="py-2 flex items-center justify-center gap-3">
                  <BoomPlayingCard type="bomb" ar={ar} size="sm" />
                  <h3 className="text-base font-black text-[#161426]">
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

          {/* ABSOLUTE CENTER OVERLAY 4: ROUND OVER CHAMPION PODIUM */}
          {gameData.phase === 'round_over' && (
            <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 z-[60] mx-auto cartoon-card p-5 bg-gradient-to-b from-[#fef9c3] to-[#fde047] border-4 border-[#161426] text-center space-y-3 shadow-[0_12px_0_#161426] max-w-lg w-full">
              <div className="w-16 h-16 rounded-3xl bg-white border-4 border-[#161426] shadow-[0_4px_0_#161426] flex items-center justify-center mx-auto">
                <Trophy weight="fill" className="w-10 h-10 text-[#eab308]" />
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-[#161426]">
                {ar
                  ? `الناجي الأخير والبطل: ${getPlayerName(gameData.winnerId)}!`
                  : `Last Survivor Champion: ${getPlayerName(gameData.winnerId)}!`}
              </h3>
              <p className="text-xs font-bold text-[#3f3b5c]">
                {ar
                  ? 'نجا من كل الألغام والفخاخ وحصد +4 نقاط في صدارة الغرفة!'
                  : 'Outsmarted every dynamite trap and earned +4 victory points!'}
              </p>
              {(isHost || isPassAndPlay) && (
                <button
                  type="button"
                  onClick={onStartNewRound}
                  className="cartoon-btn bg-[#8ac926] text-[#161426] px-6 py-2 text-sm inline-flex items-center gap-2 cursor-pointer"
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
            C) BOTTOM EDGE OF THE TABLE: FIXED-HEIGHT HAND ZONE (h-[290px])
               - Never changes height whether locked, unlocked, or eliminated!
               - Cards are 100% upright, straight, and neatly sorted!
           ================================================================== */}
        <div className="relative z-30 h-[290px] shrink-0 flex flex-col justify-end items-center">
          {/* Active Player's Table Seat Bar */}
          <div className="mb-1.5 px-4 py-1 rounded-2xl bg-[#161426]/95 border-3 border-[#ffca3a] shadow-[0_4px_0_#161426] flex flex-wrap items-center justify-center gap-3 text-white shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl border-2 border-[#ffca3a] bg-white overflow-hidden shrink-0">
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

          {/* FIXED-HEIGHT STRAIGHT HAND SLOT (h-[250px] — Dynamic Overlap Guarantees ALL Cards Fit Inside Table!) */}
          <div className="relative w-full h-[250px] flex items-end justify-center overflow-hidden pb-1 pt-4 px-3">
            {!isAmAlive ? (
              <div className="my-auto px-6 py-3 rounded-2xl bg-[#ffe4e6] border-3 border-[#161426] text-center font-black text-xs sm:text-sm text-[#e11d48] flex items-center gap-2">
                <Skull weight="fill" className="w-5 h-5" />
                <span>
                  {ar
                    ? 'لقد انفجرت في هذه الجولة! شاهد المعركة الحية على الطاولة!'
                    : 'You exploded this round! Watch the live battle on the table!'}
                </span>
              </div>
            ) : isPassAndPlay && !passAndPlayHandUnlocked ? (
              /* Upright Face-Down Cards at Exact Same Height + Centered Reveal Button! */
              (() => {
                const handCount = myHand.length;
                const cardW = handCount >= 7 ? 136 : 148;
                const maxRowW = 920;
                const step =
                  handCount <= 1
                    ? cardW
                    : Math.min(
                        cardW + 10,
                        Math.floor((maxRowW - cardW) / (handCount - 1))
                      );
                const overlapPx = step - cardW;

                return (
                  <div className="relative flex items-end justify-center w-full h-full">
                    <div
                      dir="ltr"
                      className="inline-flex items-end justify-center opacity-55 pointer-events-none"
                    >
                      {myHand.map((card, idx) => (
                        <div
                          key={card.id}
                          style={{
                            marginLeft: idx === 0 ? '0px' : `${overlapPx}px`,
                          }}
                        >
                          <BoomCardBackSvg
                            className={
                              handCount >= 7
                                ? 'w-[136px] h-[192px]'
                                : 'w-[148px] h-[214px]'
                            }
                          />
                        </div>
                      ))}
                    </div>

                    <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 mx-auto max-w-md px-5 py-3.5 rounded-3xl bg-[#191636]/95 border-3 border-[#ffca3a] text-center space-y-2 shadow-[0_8px_0_#161426]">
                      <p className="text-xs sm:text-sm font-extrabold text-[#fff9ec]">
                        {ar
                          ? `مرّر الجهاز إلى (${getPlayerName(
                              activeViewerId
                            )}) ثم اكشف أوراقه السرية:`
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
                  </div>
                );
              })()
            ) : (
              /* NEATLY ALIGNED, STRAIGHT UPRIGHT CARDS IN HAND (0deg tilt, sorted by type, auto-overlapping when 7+ cards so 100% stay visible!) */
              (() => {
                const handCount = myHand.length;
                const useCompactSize = handCount >= 7;
                const cardW = useCompactSize ? 136 : 152;
                const maxRowW = 930;
                const step =
                  handCount <= 1
                    ? cardW
                    : Math.min(
                        cardW + 10,
                        Math.floor((maxRowW - cardW) / (handCount - 1))
                      );
                const overlapPx = step - cardW;

                return (
                  <div
                    dir="ltr"
                    className="inline-flex items-end justify-center px-2"
                  >
                    {myHand.map((card, idx) => {
                      const isComboCard = isComboSetCard(card.type);
                      const copyCount = handTypeCounts[card.type] || 1;
                      const canPlayCombo = copyCount >= 2 && card.type !== 'defuse';
                      const isPassiveOnly =
                        card.type === 'defuse' ||
                        (card.type === 'block' && copyCount < 2);

                      const canPlayNow =
                        gameData.phase === 'playing' &&
                        isMyTurn &&
                        !isPassiveOnly &&
                        (!isComboCard || canPlayCombo) &&
                        !localDrawPreview &&
                        !localPlayPreview;

                      const isPickedForMagnet =
                        (pickingMagnetTarget && selectedCardId === card.id) ||
                        comboBuilder?.card.id === card.id;
                      const isBeingPlayedNow =
                        localPlayPreview?.card.id === card.id ||
                        defuseShowdown?.defuseCard.id === card.id;

                      const actionLabel = isComboCard
                        ? copyCount >= 3
                          ? ar
                            ? 'العب 3× (اطلب كرت بالاسم)'
                            : 'Play 3× (Name a Card)'
                          : copyCount === 2
                          ? ar
                            ? 'العب 2× (اسرق كرت عشوائي)'
                            : 'Play 2× (Steal Random)'
                          : ar
                          ? 'اجمع 2 أو 3 للسرقة'
                          : 'Collect 2 or 3 to steal'
                        : isPickedForMagnet
                        ? ar
                          ? 'اختر خصماً فوق أو العب 1×'
                          : 'Pick Rival or Play 1×'
                        : undefined;

                      return (
                        <BoomPlayingCard
                          key={card.id}
                          type={card.type}
                          ar={ar}
                          size={useCompactSize ? 'sm' : 'md'}
                          canPlay={canPlayNow}
                          isSelected={isPickedForMagnet}
                          actionLabel={actionLabel}
                          style={{
                            transform: 'none',
                            marginLeft: idx === 0 ? '0px' : `${overlapPx}px`,
                          }}
                          onClick={() => {
                            if (!canPlayNow) return;
                            // If player holds 2+ copies of ANY playable card (Combo OR Special), open the top targeting bar so they can either click a rival for 2x/3x Combo OR play 1x normal ability!
                            if (copyCount >= 2 && card.type !== 'defuse') {
                              handleInitiateCardPlay(
                                card,
                                undefined,
                                copyCount >= 3 ? 3 : 2
                              );
                            } else {
                              handleInitiateCardPlay(card);
                            }
                          }}
                          className={
                            isBeingPlayedNow
                              ? 'opacity-0 pointer-events-none'
                              : isComboCard && copyCount < 2
                              ? 'opacity-90'
                              : ''
                          }
                        />
                      );
                    })}
                  </div>
                );
              })()
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
