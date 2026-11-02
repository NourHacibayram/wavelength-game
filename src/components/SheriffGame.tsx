import React, { useState } from 'react';
import { motion } from 'motion/react';
import confetti from 'canvas-confetti';
import {
  ShieldStar,
  Scales,
  Briefcase,
  MagnifyingGlass,
  CheckCircle,
  Coins,
  ArrowRight,
  ArrowsClockwise,
  Trophy,
  Eye,
  EyeSlash,
  LockKey,
  HandCoins,
  SealCheck,
  SealWarning,
} from '@phosphor-icons/react';

/* ============================================================================
 * TYPES & INTERFACES
 * ========================================================================== */

export type GoodId = 'apple' | 'cheese' | 'bread' | 'pepper' | 'silk' | 'diamonds';
export type LegalGoodId = 'apple' | 'cheese' | 'bread';

export interface SheriffGoodSpec {
  id: GoodId;
  isContraband: boolean;
  nameAr: string;
  nameEn: string;
  value: number;
  penalty: number;
  bgClass: string;
  accentHex: string;
}

export interface SheriffSuitcase {
  merchantId: string;
  merchantName: string;
  packedGoods: GoodId[]; // 3 items
  declaredGood: LegalGoodId;
  bribeCoins: number; // 0, 5, 10, 15
  bluffNoteIndex: number; // 0..3 pre-built bluff note
  status: 'pending' | 'passed' | 'inspected';
  resolution?: {
    decision: 'passed' | 'inspected';
    wasHonest: boolean;
    merchantGoldDelta: number;
    sheriffGoldDelta: number;
    passedGoods: GoodId[];
    confiscatedGoods: GoodId[];
    bribePaid: number;
    penaltyPaidToSheriff: number;
    compensationPaidToMerchant: number;
  };
}

export interface SheriffRoundLog {
  round: number;
  sheriffId: string;
  sheriffName: string;
  suitcases: SheriffSuitcase[];
}

export interface SheriffGameState {
  phase: 'packing' | 'inspection' | 'round_summary' | 'game_over';
  round: number;
  totalRounds: number;
  sheriffId: string;
  merchantIds: string[];
  /** Used in Pass-and-Play so merchants pack one by one without peeking */
  activePackerIndex: number;
  /** Dealt 6-card hand per merchant */
  hands: Record<string, GoodId[]>;
  /** Packed suitcases keyed by merchantId */
  suitcases: Record<string, SheriffSuitcase>;
  /** Cumulative gold per player id (everyone starts with 50 gold) */
  goldByPlayer: Record<string, number>;
  /** Count of contraband items successfully smuggled across the match */
  contrabandSmuggledCount: Record<string, number>;
  /** Count of honest bags falsely opened by Sheriff */
  falseAccusationsReceived: Record<string, number>;
  /** Count of smugglers caught by each player while serving as Sheriff */
  smugglersCaughtCount: Record<string, number>;
  /** History of completed rounds */
  roundHistory: SheriffRoundLog[];
  /** Whether final leaderboard points have been emitted */
  scoresAwarded?: boolean;
}

export interface SheriffPlayerInfo {
  id: string;
  name: string;
  avatar_color: string;
  score: number;
}

export interface SheriffGameProps {
  gameData: SheriffGameState;
  players: SheriffPlayerInfo[];
  myPlayerId: string;
  isHost: boolean;
  isPassAndPlay: boolean;
  lang: 'ar' | 'en';
  onUpdateGameData: (
    nextData: SheriffGameState,
    scoreAwards?: Record<string, number>
  ) => void;
  onStartNewRound: () => void;
}

/* ============================================================================
 * CONSTANTS & GOODS CATALOG
 * ========================================================================== */

export const SHERIFF_GOODS: Record<GoodId, SheriffGoodSpec> = {
  apple: {
    id: 'apple',
    isContraband: false,
    nameAr: 'تفاح طازج',
    nameEn: 'Fresh Apples',
    value: 4,
    penalty: 2,
    bgClass: 'bg-[#ecfdf5]',
    accentHex: '#10b981',
  },
  cheese: {
    id: 'cheese',
    isContraband: false,
    nameAr: 'جبنة فاخرة',
    nameEn: 'Aged Cheese',
    value: 5,
    penalty: 3,
    bgClass: 'bg-[#fefce8]',
    accentHex: '#eab308',
  },
  bread: {
    id: 'bread',
    isContraband: false,
    nameAr: 'خبز ساخن',
    nameEn: 'Warm Bread',
    value: 4,
    penalty: 2,
    bgClass: 'bg-[#fff7ed]',
    accentHex: '#f97316',
  },
  pepper: {
    id: 'pepper',
    isContraband: true,
    nameAr: 'فلفل ملكي مهرّب',
    nameEn: 'Royal Pepper',
    value: 10,
    penalty: 5,
    bgClass: 'bg-[#fef2f2]',
    accentHex: '#ef4444',
  },
  silk: {
    id: 'silk',
    isContraband: true,
    nameAr: 'حرير نادر مهرّب',
    nameEn: 'Rare Silk Roll',
    value: 12,
    penalty: 6,
    bgClass: 'bg-[#faf5ff]',
    accentHex: '#a855f7',
  },
  diamonds: {
    id: 'diamonds',
    isContraband: true,
    nameAr: 'ألماس مهرّب',
    nameEn: 'Smuggled Diamonds',
    value: 15,
    penalty: 8,
    bgClass: 'bg-[#ecfeff]',
    accentHex: '#06b6d4',
  },
};

export const LEGAL_GOOD_IDS: LegalGoodId[] = ['apple', 'cheese', 'bread'];
export const CONTRABAND_GOOD_IDS: GoodId[] = ['pepper', 'silk', 'diamonds'];
export const BRIBE_OPTIONS: number[] = [0, 5, 10, 15];
export const FALSE_ACCUSATION_COMPENSATION = 12;
export const STARTING_GOLD = 50;

export const BLUFF_NOTES: { ar: string; en: string }[] = [
  {
    ar: 'بضاعة نظامية ١٠٠٪ على ضمانتي، لا تضيّع وقتك!',
    en: '100% legal goods on my honor, do not waste your time!',
  },
  {
    ar: 'افتح الشنطة لو شاكّ.. وجهّز ١٢ ذهب تعويض البلاغ الكاذب!',
    en: 'Go ahead and open it... and get the 12 gold compensation ready!',
  },
  {
    ar: 'خذ إكراميتك ومرّق الشنطة بالحبيب، كلنا مستفيدين!',
    en: 'Pocket the tip and wave me through friend, win-win for both!',
  },
  {
    ar: 'أنا تاجر مسكين ومستعجل، الشنطة ما فيها إلا الخير!',
    en: 'Just a humble merchant in a hurry, nothing suspicious inside!',
  },
];

/* ============================================================================
 * CUSTOM CARTOON SVG ILLUSTRATIONS (ZERO EMOJIS)
 * ========================================================================== */

export const GoodCardSvg: React.FC<{
  goodId: GoodId;
  className?: string;
}> = ({ goodId, className = 'w-14 h-14' }) => {
  switch (goodId) {
    case 'apple':
      return (
        <svg viewBox="0 0 100 100" className={`${className} select-none overflow-visible`}>
          {/* Stem & Leaf */}
          <path
            d="M50 24 C50 14, 56 10, 60 8"
            fill="none"
            stroke="#161426"
            strokeWidth="6"
            strokeLinecap="round"
          />
          <path
            d="M52 18 C64 10, 78 16, 72 28 C64 32, 54 26, 52 18 Z"
            fill="#22c55e"
            stroke="#161426"
            strokeWidth="5"
            strokeLinejoin="round"
          />
          {/* Apple Body */}
          <path
            d="M50 26 C34 22, 16 34, 18 56 C20 78, 36 90, 48 88 C50 87, 50 87, 52 88 C64 90, 80 78, 82 56 C84 34, 66 22, 50 26 Z"
            fill="#ef4444"
            stroke="#161426"
            strokeWidth="5.5"
            strokeLinejoin="round"
          />
          {/* Glossy Highlight */}
          <path
            d="M30 40 C26 48, 26 58, 30 66"
            fill="none"
            stroke="#fecaca"
            strokeWidth="5"
            strokeLinecap="round"
          />
        </svg>
      );

    case 'cheese':
      return (
        <svg viewBox="0 0 100 100" className={`${className} select-none overflow-visible`}>
          {/* Cheese Wedge Top */}
          <polygon
            points="14,52 62,20 88,44 40,68"
            fill="#fde047"
            stroke="#161426"
            strokeWidth="5.5"
            strokeLinejoin="round"
          />
          {/* Cheese Front Side */}
          <polygon
            points="14,52 40,68 88,44 88,72 40,88 14,74"
            fill="#eab308"
            stroke="#161426"
            strokeWidth="5.5"
            strokeLinejoin="round"
          />
          {/* Cheese Holes */}
          <circle cx="52" cy="42" r="6" fill="#ca8a04" stroke="#161426" strokeWidth="4" />
          <circle cx="66" cy="64" r="7" fill="#ca8a04" stroke="#161426" strokeWidth="4" />
          <circle cx="38" cy="74" r="5" fill="#ca8a04" stroke="#161426" strokeWidth="4" />
        </svg>
      );

    case 'bread':
      return (
        <svg viewBox="0 0 100 100" className={`${className} select-none overflow-visible`}>
          {/* Loaf Base */}
          <path
            d="M16 58 C12 36, 30 24, 50 24 C70 24, 88 36, 84 58 L80 78 C78 84, 72 86, 64 86 L36 86 C28 86, 22 84, 20 78 Z"
            fill="#f97316"
            stroke="#161426"
            strokeWidth="5.5"
            strokeLinejoin="round"
          />
          {/* Inner Crumb / Crust Highlight */}
          <path
            d="M26 52 C26 38, 38 32, 50 32 C62 32, 74 38, 74 52"
            fill="none"
            stroke="#fed7aa"
            strokeWidth="4.5"
            strokeLinecap="round"
          />
          {/* Diagonal Score Lines */}
          <line x1="36" y1="36" x2="44" y2="50" stroke="#161426" strokeWidth="5" strokeLinecap="round" />
          <line x1="50" y1="34" x2="58" y2="48" stroke="#161426" strokeWidth="5" strokeLinecap="round" />
          <line x1="64" y1="36" x2="70" y2="48" stroke="#161426" strokeWidth="5" strokeLinecap="round" />
        </svg>
      );

    case 'pepper':
      return (
        <svg viewBox="0 0 100 100" className={`${className} select-none overflow-visible`}>
          {/* Royal Crown Cap */}
          <polygon
            points="34,26 40,12 50,20 60,12 66,26"
            fill="#facc15"
            stroke="#161426"
            strokeWidth="4.5"
            strokeLinejoin="round"
          />
          {/* Spicy Pepper Bottle / Pod */}
          <path
            d="M34 28 L66 28 L74 44 C78 64, 68 86, 50 88 C32 86, 22 64, 26 44 Z"
            fill="#dc2626"
            stroke="#161426"
            strokeWidth="5.5"
            strokeLinejoin="round"
          />
          {/* Golden Royal Band */}
          <rect
            x="28"
            y="48"
            width="44"
            height="16"
            rx="4"
            fill="#fde047"
            stroke="#161426"
            strokeWidth="4.5"
          />
          {/* Flame Icon in Center */}
          <path
            d="M50 36 C56 44, 58 52, 50 60 C42 52, 44 44, 50 36 Z"
            fill="#f97316"
            stroke="#161426"
            strokeWidth="3.5"
          />
        </svg>
      );

    case 'silk':
      return (
        <svg viewBox="0 0 100 100" className={`${className} select-none overflow-visible`}>
          {/* Flowing Silk Ribbon Drape */}
          <path
            d="M24 26 L68 18 C78 24, 78 42, 68 50 L32 62 C20 68, 22 82, 36 86 L78 76 L74 58"
            fill="#a855f7"
            stroke="#161426"
            strokeWidth="5.5"
            strokeLinejoin="round"
          />
          {/* Cylinder Roll Ends */}
          <ellipse
            cx="28"
            cy="44"
            rx="10"
            ry="18"
            fill="#e9d5ff"
            stroke="#161426"
            strokeWidth="5"
          />
          <circle cx="28" cy="44" r="5" fill="#eab308" stroke="#161426" strokeWidth="3.5" />
          {/* Golden Embroidery Trim */}
          <path
            d="M42 32 L64 28 M40 46 L62 42"
            stroke="#fde047"
            strokeWidth="4.5"
            strokeLinecap="round"
          />
        </svg>
      );

    case 'diamonds':
      return (
        <svg viewBox="0 0 100 100" className={`${className} select-none overflow-visible`}>
          {/* Sparkle Rays */}
          <line x1="50" y1="6" x2="50" y2="14" stroke="#eab308" strokeWidth="4.5" strokeLinecap="round" />
          <line x1="16" y1="20" x2="22" y2="26" stroke="#eab308" strokeWidth="4.5" strokeLinecap="round" />
          <line x1="84" y1="20" x2="78" y2="26" stroke="#eab308" strokeWidth="4.5" strokeLinecap="round" />
          {/* Diamond Gem Top & Crown */}
          <polygon
            points="28,24 72,24 88,44 50,88 12,44"
            fill="#22d3ee"
            stroke="#161426"
            strokeWidth="5.5"
            strokeLinejoin="round"
          />
          {/* Inner Facet Lines */}
          <polygon
            points="34,24 66,24 72,44 28,44"
            fill="#a5f3fc"
            stroke="#161426"
            strokeWidth="4"
            strokeLinejoin="round"
          />
          <line x1="12" y1="44" x2="88" y2="44" stroke="#161426" strokeWidth="4.5" />
          <line x1="28" y1="44" x2="50" y2="88" stroke="#161426" strokeWidth="4" />
          <line x1="72" y1="44" x2="50" y2="88" stroke="#161426" strokeWidth="4" />
        </svg>
      );
  }
};

export const SuitcaseSvg: React.FC<{
  isOpen?: boolean;
  hasContrabandGlow?: boolean;
  className?: string;
}> = ({ isOpen = false, hasContrabandGlow = false, className = 'w-20 h-20' }) => {
  return (
    <svg viewBox="0 0 120 100" className={`${className} select-none overflow-visible`}>
      {/* Handle */}
      <path
        d="M42 26 L42 14 C42 10, 46 8, 50 8 L70 8 C74 8, 78 10, 78 14 L78 26"
        fill="none"
        stroke="#161426"
        strokeWidth="7"
        strokeLinecap="round"
      />
      {/* Open Lid Effect */}
      {isOpen && (
        <rect
          x="14"
          y="12"
          width="92"
          height="22"
          rx="8"
          fill="#78350f"
          stroke="#161426"
          strokeWidth="5.5"
        />
      )}
      {/* Main Leather Body */}
      <rect
        x="12"
        y="24"
        width="96"
        height="64"
        rx="12"
        fill={hasContrabandGlow ? '#991b1b' : '#b45309'}
        stroke="#161426"
        strokeWidth="6"
      />
      {/* Leather Straps */}
      <rect
        x="28"
        y="24"
        width="12"
        height="64"
        fill="#fde047"
        stroke="#161426"
        strokeWidth="4.5"
      />
      <rect
        x="80"
        y="24"
        width="12"
        height="64"
        fill="#fde047"
        stroke="#161426"
        strokeWidth="4.5"
      />
      {/* Brass Clasps */}
      <rect
        x="25"
        y="48"
        width="18"
        height="14"
        rx="3"
        fill="#facc15"
        stroke="#161426"
        strokeWidth="4"
      />
      <rect
        x="77"
        y="48"
        width="18"
        height="14"
        rx="3"
        fill="#facc15"
        stroke="#161426"
        strokeWidth="4"
      />
      {/* Customs Travel Sticker */}
      <polygon
        points="52,44 68,40 72,56 56,60"
        fill="#38bdf8"
        stroke="#161426"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export const SheriffBadgeSvg: React.FC<{ className?: string }> = ({
  className = 'w-12 h-12',
}) => (
  <svg viewBox="0 0 100 100" className={`${className} select-none overflow-visible`}>
    {/* 6-Point Sheriff Star */}
    <polygon
      points="50,8 61,30 86,28 73,50 86,72 61,70 50,92 39,70 14,72 27,50 14,28 39,30"
      fill="#facc15"
      stroke="#161426"
      strokeWidth="5.5"
      strokeLinejoin="round"
    />
    {/* Points Tips Circles */}
    <circle cx="50" cy="8" r="4.5" fill="#fde047" stroke="#161426" strokeWidth="3.5" />
    <circle cx="86" cy="28" r="4.5" fill="#fde047" stroke="#161426" strokeWidth="3.5" />
    <circle cx="86" cy="72" r="4.5" fill="#fde047" stroke="#161426" strokeWidth="3.5" />
    <circle cx="50" cy="92" r="4.5" fill="#fde047" stroke="#161426" strokeWidth="3.5" />
    <circle cx="14" cy="72" r="4.5" fill="#fde047" stroke="#161426" strokeWidth="3.5" />
    <circle cx="14" cy="28" r="4.5" fill="#fde047" stroke="#161426" strokeWidth="3.5" />
    {/* Inner Medallion */}
    <circle
      cx="50"
      cy="50"
      r="16"
      fill="#eab308"
      stroke="#161426"
      strokeWidth="4.5"
    />
    <circle cx="45" cy="45" r="4" fill="#fef08a" />
  </svg>
);

/* ============================================================================
 * HELPER FUNCTIONS & INITIAL STATE BUILDER
 * ========================================================================== */

/**
 * Generates a balanced 6-card hand for a Merchant:
 * Always guarantees at least 3 of one Legal Good (so a 100% honest triple is always possible!)
 * plus 1 other Legal Good and 2 high-temptation Contraband cards!
 */
function dealMerchantHand(): GoodId[] {
  const primaryLegal =
    LEGAL_GOOD_IDS[Math.floor(Math.random() * LEGAL_GOOD_IDS.length)];
  const otherLegals = LEGAL_GOOD_IDS.filter((g) => g !== primaryLegal);
  const secondaryLegal =
    otherLegals[Math.floor(Math.random() * otherLegals.length)];

  // Pick 3 of primaryLegal (or 2 primary + 2 secondary) — giving 3 of primaryLegal makes bluffing vs truth razor-sharp!
  const c1 =
    CONTRABAND_GOOD_IDS[Math.floor(Math.random() * CONTRABAND_GOOD_IDS.length)];
  const c2 =
    CONTRABAND_GOOD_IDS[Math.floor(Math.random() * CONTRABAND_GOOD_IDS.length)];

  const hand: GoodId[] = [
    primaryLegal,
    primaryLegal,
    primaryLegal,
    secondaryLegal,
    c1,
    c2,
  ];

  // Shuffle hand
  return hand.sort(() => Math.random() - 0.5);
}

export function buildInitialSheriffState(
  players: { id: string; name: string; avatar_color?: string; score?: number }[]
): SheriffGameState {
  const safePlayers =
    players.length >= 2
      ? players
      : [
          ...(players.length === 1
            ? players
            : [{ id: 'p1', name: 'تاجر ١', avatar_color: '#FF595E', score: 0 }]),
          { id: 'bot_smuggler', name: 'المهرّب المقنّع', avatar_color: '#8AC926', score: 0 },
        ];

  const sheriffId = safePlayers[0].id;
  const merchantIds = safePlayers.slice(1).map((p) => p.id);
  const totalRounds =
    safePlayers.length === 2 ? 4 : Math.max(safePlayers.length, 3);

  const hands: Record<string, GoodId[]> = {};
  const suitcases: Record<string, SheriffSuitcase> = {};
  const goldByPlayer: Record<string, number> = {};
  const contrabandSmuggledCount: Record<string, number> = {};
  const falseAccusationsReceived: Record<string, number> = {};
  const smugglersCaughtCount: Record<string, number> = {};

  for (const p of safePlayers) {
    goldByPlayer[p.id] = STARTING_GOLD;
    contrabandSmuggledCount[p.id] = 0;
    falseAccusationsReceived[p.id] = 0;
    smugglersCaughtCount[p.id] = 0;
  }

  for (const mId of merchantIds) {
    const hand = dealMerchantHand();
    hands[mId] = hand;

    // If a synthetic bot smuggler is present (only when testing solo with 1 human player), auto-pack its bag
    if (mId === 'bot_smuggler') {
      const botDeclared: LegalGoodId = 'apple';
      const botGoods: GoodId[] = [hand[0], hand[1], hand[2]];
      suitcases[mId] = {
        merchantId: mId,
        merchantName: 'المهرّب المقنّع',
        packedGoods: botGoods,
        declaredGood: botDeclared,
        bribeCoins: 5,
        bluffNoteIndex: 0,
        status: 'pending',
      };
    }
  }

  const allPacked = merchantIds.every((id) => Boolean(suitcases[id]));

  return {
    phase: allPacked ? 'inspection' : 'packing',
    round: 1,
    totalRounds,
    sheriffId,
    merchantIds,
    activePackerIndex: 0,
    hands,
    suitcases,
    goldByPlayer,
    contrabandSmuggledCount,
    falseAccusationsReceived,
    smugglersCaughtCount,
    roundHistory: [],
    scoresAwarded: false,
  };
}

/* ============================================================================
 * MAIN COMPONENT: SheriffGame
 * ========================================================================== */

export const SheriffGame: React.FC<SheriffGameProps> = ({
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

  // Local state for the active merchant's suitcase configuration
  const [selectedHandIndices, setSelectedHandIndices] = useState<number[]>([0, 1, 2]);
  const [declaredGood, setDeclaredGood] = useState<LegalGoodId>('apple');
  const [bribeCoins, setBribeCoins] = useState<number>(0);
  const [bluffNoteIndex, setBluffNoteIndex] = useState<number>(0);
  const [passAndPlayRevealed, setPassAndPlayRevealed] = useState<boolean>(!isPassAndPlay);

  // Resolve full player list (including fallback solo bot if needed)
  const effectivePlayers: SheriffPlayerInfo[] =
    players.length >= 2
      ? players
      : [
          ...players,
          {
            id: 'bot_smuggler',
            name: isAr ? 'المهرّب المقنّع' : 'Masked Smuggler',
            avatar_color: '#8AC926',
            score: 0,
          },
        ];

  const getPlayer = (id: string): SheriffPlayerInfo =>
    effectivePlayers.find((p) => p.id === id) || {
      id,
      name: isAr ? 'مسافر' : 'Traveler',
      avatar_color: '#6A4C93',
      score: 0,
    };

  const sheriffPlayer = getPlayer(gameData.sheriffId);

  // Determine which merchant is currently packing
  const currentPassPackerId =
    gameData.merchantIds[gameData.activePackerIndex] || gameData.merchantIds[0];
  const activeMerchantId = isPassAndPlay ? currentPassPackerId : myPlayerId;
  const isMyRoleSheriff = !isPassAndPlay && myPlayerId === gameData.sheriffId;
  const isMyRoleMerchant =
    isPassAndPlay || gameData.merchantIds.includes(myPlayerId);

  const myHand: GoodId[] = gameData.hands[activeMerchantId] || [
    'apple',
    'apple',
    'cheese',
    'bread',
    'pepper',
    'diamonds',
  ];
  const myPackedSuitcase = gameData.suitcases[activeMerchantId];
  const myAvailableGold = gameData.goldByPlayer[activeMerchantId] ?? STARTING_GOLD;

  // Toggle selecting a card in the 6-card hand (must pick 3)
  const toggleCardIndex = (idx: number) => {
    setSelectedHandIndices((prev) => {
      if (prev.includes(idx)) {
        return prev.filter((i) => i !== idx);
      }
      if (prev.length >= 3) {
        // Replace oldest selected card for fast UX
        return [...prev.slice(1), idx];
      }
      return [...prev, idx];
    });
  };

  // Lock in suitcase for active merchant
  const handleLockSuitcase = () => {
    if (selectedHandIndices.length !== 3) return;
    const merchantObj = getPlayer(activeMerchantId);
    const packedGoods = selectedHandIndices.map((idx) => myHand[idx] || 'apple');
    const safeBribe = Math.min(bribeCoins, myAvailableGold);

    const newSuitcase: SheriffSuitcase = {
      merchantId: activeMerchantId,
      merchantName: merchantObj.name,
      packedGoods,
      declaredGood,
      bribeCoins: safeBribe,
      bluffNoteIndex,
      status: 'pending',
    };

    const nextSuitcases: Record<string, SheriffSuitcase> = {
      ...gameData.suitcases,
      [activeMerchantId]: newSuitcase,
    };

    // Check if there are more merchants in Pass-and-Play
    const nextPackerIdx = gameData.activePackerIndex + 1;
    const allMerchantsPacked = gameData.merchantIds.every((mId) =>
      Boolean(nextSuitcases[mId])
    );

    // Reset local picker state for next merchant
    setSelectedHandIndices([0, 1, 2]);
    setDeclaredGood('apple');
    setBribeCoins(0);
    setBluffNoteIndex(0);
    if (isPassAndPlay) {
      setPassAndPlayRevealed(false);
    }

    onUpdateGameData({
      ...gameData,
      suitcases: nextSuitcases,
      activePackerIndex: allMerchantsPacked ? 0 : nextPackerIdx,
      phase: allMerchantsPacked ? 'inspection' : 'packing',
    });
  };

  // Sheriff Decision: Pass Bag (accept bribe) OR Inspect Bag (open it!)
  const handleSheriffDecision = (
    merchantId: string,
    decision: 'passed' | 'inspected'
  ) => {
    const bag = gameData.suitcases[merchantId];
    if (!bag || bag.status !== 'pending') return;

    const nextGold = { ...gameData.goldByPlayer };
    const nextContrabandCount = { ...gameData.contrabandSmuggledCount };
    const nextFalseAccusations = { ...gameData.falseAccusationsReceived };
    const nextSmugglersCaught = { ...gameData.smugglersCaughtCount };

    const sId = gameData.sheriffId;
    const mGold = nextGold[merchantId] ?? STARTING_GOLD;
    const sGold = nextGold[sId] ?? STARTING_GOLD;

    const wasHonest = bag.packedGoods.every((g) => g === bag.declaredGood);

    let merchantGoldDelta = 0;
    let sheriffGoldDelta = 0;
    let passedGoods: GoodId[] = [];
    let confiscatedGoods: GoodId[] = [];
    let bribePaid = 0;
    let penaltyPaidToSheriff = 0;
    let compensationPaidToMerchant = 0;

    if (decision === 'passed') {
      // All 3 items pass safely!
      passedGoods = [...bag.packedGoods];
      const goodsValue = passedGoods.reduce(
        (sum, gId) => sum + SHERIFF_GOODS[gId].value,
        0
      );
      bribePaid = Math.min(bag.bribeCoins, mGold);

      merchantGoldDelta = goodsValue - bribePaid;
      sheriffGoldDelta = bribePaid;

      // Count smuggled contraband
      const contrabandCount = passedGoods.filter(
        (gId) => SHERIFF_GOODS[gId].isContraband
      ).length;
      nextContrabandCount[merchantId] =
        (nextContrabandCount[merchantId] || 0) + contrabandCount;
    } else {
      // Sheriff opens the suitcase! Bribe is cancelled.
      if (wasHonest) {
        // 100% Honest! All 3 goods pass AND Sheriff pays +12 Gold Compensation to Merchant!
        passedGoods = [...bag.packedGoods];
        const goodsValue = passedGoods.reduce(
          (sum, gId) => sum + SHERIFF_GOODS[gId].value,
          0
        );
        compensationPaidToMerchant = FALSE_ACCUSATION_COMPENSATION;
        merchantGoldDelta = goodsValue + compensationPaidToMerchant;
        sheriffGoldDelta = -compensationPaidToMerchant;

        nextFalseAccusations[merchantId] =
          (nextFalseAccusations[merchantId] || 0) + 1;
      } else {
        // Caught lying / smuggling!
        for (const gId of bag.packedGoods) {
          if (gId === bag.declaredGood) {
            passedGoods.push(gId);
            merchantGoldDelta += SHERIFF_GOODS[gId].value;
          } else {
            confiscatedGoods.push(gId);
            const pen = SHERIFF_GOODS[gId].penalty;
            penaltyPaidToSheriff += pen;
          }
        }
        merchantGoldDelta -= penaltyPaidToSheriff;
        sheriffGoldDelta += penaltyPaidToSheriff;

        nextSmugglersCaught[sId] = (nextSmugglersCaught[sId] || 0) + 1;
      }
    }

    nextGold[merchantId] = Math.max(0, mGold + merchantGoldDelta);
    nextGold[sId] = Math.max(0, sGold + sheriffGoldDelta);

    const updatedSuitcase: SheriffSuitcase = {
      ...bag,
      status: decision,
      resolution: {
        decision,
        wasHonest,
        merchantGoldDelta,
        sheriffGoldDelta,
        passedGoods,
        confiscatedGoods,
        bribePaid,
        penaltyPaidToSheriff,
        compensationPaidToMerchant,
      },
    };

    const nextSuitcases: Record<string, SheriffSuitcase> = {
      ...gameData.suitcases,
      [merchantId]: updatedSuitcase,
    };

    onUpdateGameData({
      ...gameData,
      suitcases: nextSuitcases,
      goldByPlayer: nextGold,
      contrabandSmuggledCount: nextContrabandCount,
      falseAccusationsReceived: nextFalseAccusations,
      smugglersCaughtCount: nextSmugglersCaught,
    });
  };

  // Proceed from Inspection to Round Summary or Game Over
  const handleFinishInspectionPhase = () => {
    const completedSuitcases = gameData.merchantIds
      .map((mId) => gameData.suitcases[mId])
      .filter(Boolean);

    const roundLog: SheriffRoundLog = {
      round: gameData.round,
      sheriffId: gameData.sheriffId,
      sheriffName: sheriffPlayer.name,
      suitcases: completedSuitcases,
    };

    const isFinalRound = gameData.round >= gameData.totalRounds;

    if (isFinalRound) {
      // Calculate final leaderboard score awards based on gold ranking
      const sortedByGold = [...effectivePlayers].sort(
        (a, b) =>
          (gameData.goldByPlayer[b.id] ?? 0) - (gameData.goldByPlayer[a.id] ?? 0)
      );
      const scoreAwards: Record<string, number> = {};
      sortedByGold.forEach((p, idx) => {
        if (p.id === 'bot_smuggler') return;
        if (idx === 0) scoreAwards[p.id] = 5;
        else if (idx === 1) scoreAwards[p.id] = 3;
        else scoreAwards[p.id] = 1;
      });

      try {
        confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
      } catch {
        // ignore confetti error
      }

      onUpdateGameData(
        {
          ...gameData,
          phase: 'game_over',
          roundHistory: [...gameData.roundHistory, roundLog],
          scoresAwarded: true,
        },
        scoreAwards
      );
    } else {
      onUpdateGameData({
        ...gameData,
        phase: 'round_summary',
        roundHistory: [...gameData.roundHistory, roundLog],
      });
    }
  };

  // Start the next round with rotated Customs Officer
  const handleNextRound = () => {
    const nextRoundNum = gameData.round + 1;
    const currentSheriffIdx = effectivePlayers.findIndex(
      (p) => p.id === gameData.sheriffId
    );
    const nextSheriffIdx =
      (currentSheriffIdx + 1) % Math.max(1, effectivePlayers.length);
    const nextSheriffId = effectivePlayers[nextSheriffIdx].id;
    const nextMerchantIds = effectivePlayers
      .filter((p) => p.id !== nextSheriffId)
      .map((p) => p.id);

    const nextHands: Record<string, GoodId[]> = {};
    const nextSuitcases: Record<string, SheriffSuitcase> = {};

    for (const mId of nextMerchantIds) {
      const hand = dealMerchantHand();
      nextHands[mId] = hand;
      if (mId === 'bot_smuggler') {
        nextSuitcases[mId] = {
          merchantId: mId,
          merchantName: isAr ? 'المهرّب المقنّع' : 'Masked Smuggler',
          packedGoods: [hand[0], hand[1], hand[2]],
          declaredGood: 'cheese',
          bribeCoins: 10,
          bluffNoteIndex: 2,
          status: 'pending',
        };
      }
    }

    // If the bot is Sheriff in solo mode, auto-resolve once human packs
    setSelectedHandIndices([0, 1, 2]);
    setDeclaredGood('apple');
    setBribeCoins(0);
    setBluffNoteIndex(0);
    setPassAndPlayRevealed(!isPassAndPlay);

    onUpdateGameData({
      ...gameData,
      phase: 'packing',
      round: nextRoundNum,
      sheriffId: nextSheriffId,
      merchantIds: nextMerchantIds,
      activePackerIndex: 0,
      hands: nextHands,
      suitcases: nextSuitcases,
    });
  };

  const allSuitcasesResolved = gameData.merchantIds.every(
    (mId) =>
      gameData.suitcases[mId] && gameData.suitcases[mId].status !== 'pending'
  );

  // Selected cards preview calculation for packing phase
  const previewPackedGoods = selectedHandIndices.map(
    (idx) => myHand[idx] || 'apple'
  );
  const previewIsHonest =
    previewPackedGoods.length === 3 &&
    previewPackedGoods.every((g) => g === declaredGood);
  const previewTotalValue = previewPackedGoods.reduce(
    (sum, g) => sum + SHERIFF_GOODS[g].value,
    0
  );
  const previewPotentialPenalty = previewPackedGoods.reduce(
    (sum, g) => (g === declaredGood ? sum : sum + SHERIFF_GOODS[g].penalty),
    0
  );

  return (
    <div
      dir={isAr ? 'rtl' : 'ltr'}
      className="w-full max-w-5xl mx-auto space-y-5 pb-10 select-none"
    >
      {/* ====================================================================
       * 1. TOP CHECKPOINT HEADER & GOLD STANDINGS BAR
       * ==================================================================== */}
      <div className="bg-gradient-to-r from-[#fef08a] via-[#fde047] to-[#facc15] border-4 border-[#161426] rounded-[1.75rem] p-4 sm:p-5 shadow-[0_8px_0_#161426] relative overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Game Title & Round Pill */}
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-[#161426] border-3 border-[#161426] flex items-center justify-center shadow-[0_4px_0_rgba(0,0,0,0.25)] shrink-0">
              <SheriffBadgeSvg className="w-11 h-11" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-black text-[#161426] tracking-tight">
                  {isAr ? 'مهرّب الجمارك' : 'Smuggler’s Run'}
                </h2>
                <span className="px-3 py-0.5 rounded-full bg-[#161426] text-[#fde047] text-xs font-black">
                  {isAr
                    ? `جولة ${gameData.round} من ${gameData.totalRounds}`
                    : `Round ${gameData.round} / ${gameData.totalRounds}`}
                </span>
              </div>
              <p className="text-xs sm:text-sm font-bold text-[#161426]/80 mt-0.5">
                {isAr
                  ? 'هرّب الألماس والحرير، أو ارشِ الضابط، أو افرش له فخ البضاعة النظامية!'
                  : 'Smuggle Diamonds & Silk, bribe the Officer, or bait a false inspection!'}
              </p>
            </div>
          </div>

          {/* Current Customs Officer Badge */}
          <div className="flex items-center gap-2.5 bg-white border-3 border-[#161426] rounded-2xl px-3.5 py-2 shadow-[0_4px_0_#161426]">
            <ShieldStar weight="fill" className="w-6 h-6 text-[#eab308] shrink-0" />
            <div className="text-xs">
              <div className="font-bold text-slate-500">
                {isAr ? 'ضابط الجمارك الحالي' : 'Customs Officer'}
              </div>
              <div className="font-black text-sm text-[#161426] flex items-center gap-1.5">
                <span
                  className="w-3 h-3 rounded-full inline-block border border-[#161426]"
                  style={{ backgroundColor: sheriffPlayer.avatar_color }}
                />
                <span>{sheriffPlayer.name}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Live Gold Treasury Bar for All Players */}
        <div className="mt-4 pt-3 border-t-2 border-[#161426]/15 flex items-center gap-2 overflow-x-auto pb-1">
          {effectivePlayers.map((p) => {
            const pGold = gameData.goldByPlayer[p.id] ?? STARTING_GOLD;
            const isSheriffNow = p.id === gameData.sheriffId;
            return (
              <div
                key={p.id}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border-2 border-[#161426] shrink-0 transition-all ${
                  isSheriffNow
                    ? 'bg-[#161426] text-white shadow-[0_3px_0_#000]'
                    : 'bg-white/95 text-[#161426] shadow-[0_3px_0_#161426]'
                }`}
              >
                <span
                  className="w-3 h-3 rounded-full border border-[#161426] shrink-0"
                  style={{ backgroundColor: p.avatar_color }}
                />
                <span className="text-xs font-black truncate max-w-[110px]">
                  {p.name}
                </span>
                {isSheriffNow && (
                  <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-[#facc15] text-[#161426]">
                    {isAr ? 'الضابط' : 'Sheriff'}
                  </span>
                )}
                <span
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-black ${
                    isSheriffNow
                      ? 'bg-[#facc15]/20 text-[#fde047]'
                      : 'bg-amber-100 text-amber-900 border border-amber-300'
                  }`}
                >
                  <Coins weight="fill" className="w-3.5 h-3.5 text-amber-500" />
                  {pGold}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ====================================================================
       * 2. PHASE 1: PACKING SUITCASES & BRIBES ('packing')
       * ==================================================================== */}
      {gameData.phase === 'packing' && (
        <div className="space-y-5">
          {/* Pass-and-Play Privacy Handoff Screen */}
          {isPassAndPlay && !passAndPlayRevealed ? (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border-4 border-[#161426] rounded-[1.75rem] p-6 sm:p-8 text-center shadow-[0_8px_0_#161426] space-y-4"
            >
              <div className="w-20 h-20 mx-auto rounded-3xl bg-amber-100 border-4 border-[#161426] flex items-center justify-center shadow-[0_5px_0_#161426]">
                <SuitcaseSvg className="w-16 h-16" />
              </div>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-100 border-2 border-[#161426] text-xs font-black text-purple-900">
                <EyeSlash weight="bold" className="w-4 h-4" />
                {isAr
                  ? `الضابط (${sheriffPlayer.name}) ممنوع يشوف الشاشة!`
                  : `Officer (${sheriffPlayer.name}) must look away!`}
              </div>
              <h3 className="text-2xl font-black text-[#161426]">
                {isAr
                  ? `مرّر الجوال للمسافر: ${getPlayer(activeMerchantId).name}`
                  : `Pass device to Merchant: ${getPlayer(activeMerchantId).name}`}
              </h3>
              <p className="text-sm font-bold text-slate-600 max-w-md mx-auto">
                {isAr
                  ? 'اختر ٣ بضائع لوضعها في شنطتك السرية، وحدد تصريحك الجمركي وقيمة الرشوة!'
                  : 'Secretly pack 3 items into your suitcase, set your legal declaration, and offer a bribe!'}
              </p>
              <button
                type="button"
                onClick={() => setPassAndPlayRevealed(true)}
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-[#22c55e] hover:bg-[#16a34a] text-white font-black text-base border-4 border-[#161426] shadow-[0_6px_0_#161426] active:translate-y-1 active:shadow-[0_2px_0_#161426] transition-all cursor-pointer"
              >
                <Eye weight="bold" className="w-5 h-5" />
                {isAr
                  ? `أنا ${getPlayer(activeMerchantId).name} — افتح شنطتي`
                  : `I am ${getPlayer(activeMerchantId).name} — Open My Suitcase`}
              </button>
            </motion.div>
          ) : isMyRoleSheriff ? (
            /* Online Mode: Sheriff Waiting View while Merchants Pack */
            <div className="bg-white border-4 border-[#161426] rounded-[1.75rem] p-6 sm:p-8 text-center shadow-[0_8px_0_#161426] space-y-5">
              <div className="w-20 h-20 mx-auto rounded-3xl bg-[#fef08a] border-4 border-[#161426] flex items-center justify-center shadow-[0_5px_0_#161426]">
                <SheriffBadgeSvg className="w-14 h-14" />
              </div>
              <div className="space-y-1">
                <span className="px-3.5 py-1 rounded-full bg-[#161426] text-[#fde047] text-xs font-black">
                  {isAr ? 'أنت ضابط الجمارك في هذه الجولة!' : 'You are the Customs Officer this round!'}
                </span>
                <h3 className="text-2xl font-black text-[#161426] pt-2">
                  {isAr
                    ? 'المسافرون يجهّزون شنطهم السرية الآن...'
                    : 'Merchants are secretly packing their suitcases...'}
                </h3>
                <p className="text-sm font-bold text-slate-600 max-w-lg mx-auto">
                  {isAr
                    ? 'راقب تعابير وجوههم! بمجرد إغلاق الشنط، ستظهر أمامك على طاولة التفتيش لتقرر: تقبل الرشوة وتمرّرها أم تفتّشها!'
                    : 'Watch their poker faces! Once locked, suitcases will appear on your inspection desk.'}
                </p>
              </div>

              {/* Live Packing Status Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl mx-auto pt-2">
                {gameData.merchantIds.map((mId) => {
                  const mPlayer = getPlayer(mId);
                  const isPacked = Boolean(gameData.suitcases[mId]);
                  return (
                    <div
                      key={mId}
                      className={`flex items-center justify-between p-3.5 rounded-2xl border-3 border-[#161426] ${
                        isPacked ? 'bg-emerald-50' : 'bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className="w-4 h-4 rounded-full border-2 border-[#161426]"
                          style={{ backgroundColor: mPlayer.avatar_color }}
                        />
                        <span className="font-black text-sm text-[#161426]">
                          {mPlayer.name}
                        </span>
                      </div>
                      {isPacked ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-500 text-white text-xs font-black border-2 border-[#161426]">
                          <LockKey weight="fill" className="w-3.5 h-3.5" />
                          {isAr ? 'أغلق الشنطة' : 'Locked'}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-200 text-[#161426] text-xs font-black border-2 border-[#161426] animate-pulse">
                          <Briefcase weight="fill" className="w-3.5 h-3.5" />
                          {isAr ? 'يرتّب البضاعة...' : 'Packing...'}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : isMyRoleMerchant && myPackedSuitcase && !isPassAndPlay ? (
            /* Online Mode: Merchant already locked suitcase and is waiting for other merchants */
            <div className="bg-white border-4 border-[#161426] rounded-[1.75rem] p-6 text-center shadow-[0_8px_0_#161426] space-y-4">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-100 border-3 border-[#161426] flex items-center justify-center">
                <CheckCircle weight="fill" className="w-10 h-10 text-emerald-600" />
              </div>
              <h3 className="text-xl font-black text-[#161426]">
                {isAr
                  ? 'تم إقفال شنطتك وإرسالها لنقطة التفتيش!'
                  : 'Your suitcase is locked and at the checkpoint!'}
              </h3>
              <p className="text-sm font-bold text-slate-600">
                {isAr
                  ? 'بانتظار بقية المسافرين لإغلاق شنطهم...'
                  : 'Waiting for remaining merchants to lock their bags...'}
              </p>
            </div>
          ) : (
            /* Active Merchant Packing Workbench */
            <div className="bg-white border-4 border-[#161426] rounded-[1.75rem] p-4 sm:p-6 shadow-[0_8px_0_#161426] space-y-6">
              {/* Merchant Workbench Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b-3 border-slate-100">
                <div className="flex items-center gap-3">
                  <SuitcaseSvg className="w-14 h-14 shrink-0" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-lg bg-amber-100 border-2 border-[#161426] text-xs font-black text-[#161426]">
                        {isAr ? 'طاولة تجهيز الشنطة' : 'Suitcase Packing Desk'}
                      </span>
                      <span className="text-sm font-black text-purple-700">
                        {getPlayer(activeMerchantId).name}
                      </span>
                    </div>
                    <h3 className="text-lg sm:text-xl font-black text-[#161426] mt-0.5">
                      {isAr
                        ? '١. اختر ٣ بضائع من يدك لوضعها داخل الشنطة'
                        : '1. Select 3 items from your hand to pack inside'}
                    </h3>
                  </div>
                </div>

                {/* Selected Counter Pill */}
                <div
                  className={`px-4 py-2 rounded-2xl border-3 border-[#161426] font-black text-sm shadow-[0_3px_0_#161426] ${
                    selectedHandIndices.length === 3
                      ? 'bg-emerald-400 text-[#161426]'
                      : 'bg-amber-200 text-[#161426]'
                  }`}
                >
                  {isAr
                    ? `تم اختيار ${selectedHandIndices.length} / 3 بضائع`
                    : `Selected ${selectedHandIndices.length} / 3 items`}
                </div>
              </div>

              {/* 6-Card Dealt Hand Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                {myHand.map((goodId, idx) => {
                  const spec = SHERIFF_GOODS[goodId];
                  const isSelected = selectedHandIndices.includes(idx);
                  return (
                    <motion.button
                      key={`${goodId}-${idx}`}
                      type="button"
                      whileHover={{ y: -3 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => toggleCardIndex(idx)}
                      className={`relative flex flex-col items-center justify-between p-3 rounded-2xl border-4 transition-all cursor-pointer text-center ${
                        isSelected
                          ? 'border-[#161426] bg-[#fef9c3] shadow-[0_6px_0_#161426] -translate-y-1.5 ring-4 ring-amber-400'
                          : `${spec.bgClass} border-[#161426]/80 hover:border-[#161426] shadow-[0_4px_0_#161426] opacity-90`
                      }`}
                    >
                      {/* Top Tag: Legal vs Contraband */}
                      <div className="w-full flex items-center justify-between gap-1 mb-1">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-black border border-[#161426] ${
                            spec.isContraband
                              ? 'bg-red-500 text-white'
                              : 'bg-emerald-500 text-white'
                          }`}
                        >
                          {spec.isContraband
                            ? isAr
                              ? 'مهرّبات!'
                              : 'Contraband'
                            : isAr
                            ? 'نظامية'
                            : 'Legal'}
                        </span>
                        {isSelected && (
                          <span className="w-5 h-5 rounded-full bg-[#161426] text-[#fde047] text-[11px] font-black flex items-center justify-center">
                            ✓
                          </span>
                        )}
                      </div>

                      {/* Custom SVG Illustration */}
                      <div className="my-2">
                        <GoodCardSvg goodId={goodId} className="w-14 h-14 mx-auto" />
                      </div>

                      {/* Name & Stats */}
                      <div className="w-full space-y-1">
                        <div className="font-black text-xs text-[#161426] leading-tight">
                          {isAr ? spec.nameAr : spec.nameEn}
                        </div>
                        <div className="flex items-center justify-between text-[11px] font-black pt-1 border-t border-[#161426]/15">
                          <span className="text-emerald-700">
                            +{spec.value} {isAr ? 'ذهب' : 'G'}
                          </span>
                          <span className="text-rose-600">
                            {isAr ? `غرامة ${spec.penalty}` : `Fine ${spec.penalty}`}
                          </span>
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              {/* Step 2 & Step 3: Legal Declaration + Bribe Offer */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                {/* Step 2: Choose Official Legal Declaration */}
                <div className="bg-slate-50 border-3 border-[#161426] rounded-2xl p-4 space-y-3 shadow-[0_4px_0_#161426]">
                  <div className="flex items-center gap-2">
                    <Scales weight="fill" className="w-5 h-5 text-indigo-600" />
                    <h4 className="font-black text-sm sm:text-base text-[#161426]">
                      {isAr
                        ? '٢. التصريح الجمركي الرسمي (ماذا تدّعي بداخل الشنطة؟)'
                        : '2. Official Legal Declaration (What do you claim all 3 are?)'}
                    </h4>
                  </div>
                  <div className="grid grid-cols-3 gap-2.5">
                    {LEGAL_GOOD_IDS.map((legId) => {
                      const spec = SHERIFF_GOODS[legId];
                      const active = declaredGood === legId;
                      return (
                        <button
                          key={legId}
                          type="button"
                          onClick={() => setDeclaredGood(legId)}
                          className={`flex flex-col items-center p-2.5 rounded-xl border-3 transition-all cursor-pointer ${
                            active
                              ? 'bg-indigo-600 text-white border-[#161426] shadow-[0_4px_0_#161426] -translate-y-0.5'
                              : 'bg-white text-[#161426] border-[#161426] hover:bg-indigo-50'
                          }`}
                        >
                          <GoodCardSvg goodId={legId} className="w-10 h-10" />
                          <span className="text-xs font-black mt-1">
                            3 × {isAr ? spec.nameAr : spec.nameEn}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Step 3: Optional Bribe & Psychological Bluff Note */}
                <div className="bg-amber-50/70 border-3 border-[#161426] rounded-2xl p-4 space-y-3 shadow-[0_4px_0_#161426]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <HandCoins weight="fill" className="w-5 h-5 text-amber-600" />
                      <h4 className="font-black text-sm sm:text-base text-[#161426]">
                        {isAr
                          ? '٣. عرض الرشوة لضابط الجمارك (تُدفع فقط إذا مرّرك!)'
                          : '3. Bribe Offer to Officer (Paid ONLY if passed!)'}
                      </h4>
                    </div>
                    <span className="text-xs font-black text-amber-800">
                      {isAr ? `رصيدك: ${myAvailableGold}` : `Gold: ${myAvailableGold}`}
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    {BRIBE_OPTIONS.map((amount) => {
                      const canAfford = myAvailableGold >= amount;
                      const active = bribeCoins === amount;
                      return (
                        <button
                          key={amount}
                          type="button"
                          disabled={!canAfford}
                          onClick={() => setBribeCoins(amount)}
                          className={`py-2.5 px-2 rounded-xl border-3 font-black text-xs sm:text-sm transition-all cursor-pointer ${
                            active
                              ? 'bg-[#facc15] text-[#161426] border-[#161426] shadow-[0_4px_0_#161426] -translate-y-0.5'
                              : canAfford
                              ? 'bg-white text-[#161426] border-[#161426] hover:bg-amber-100'
                              : 'bg-slate-100 text-slate-400 border-slate-300 cursor-not-allowed'
                          }`}
                        >
                          {amount === 0
                            ? isAr
                              ? 'بدون رشوة (0)'
                              : 'No Bribe (0)'
                            : `+${amount} ${isAr ? 'ذهب' : 'Gold'}`}
                        </button>
                      );
                    })}
                  </div>

                  {/* Quick Psychological Bluff Message Selector */}
                  <div className="pt-1">
                    <div className="text-xs font-black text-slate-600 mb-1.5">
                      {isAr
                        ? 'رسالة نفسية للضابط على الشنطة:'
                        : 'Psychological note on the suitcase:'}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {BLUFF_NOTES.map((note, nIdx) => (
                        <button
                          key={nIdx}
                          type="button"
                          onClick={() => setBluffNoteIndex(nIdx)}
                          className={`text-start px-2.5 py-1.5 rounded-lg border-2 text-[11px] font-bold transition-all cursor-pointer truncate ${
                            bluffNoteIndex === nIdx
                              ? 'bg-[#161426] text-[#fde047] border-[#161426]'
                              : 'bg-white text-slate-700 border-slate-300 hover:border-[#161426]'
                          }`}
                        >
                          “{isAr ? note.ar : note.en}”
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Live Risk & Profit Calculator Bar + Lock Button */}
              <div className="bg-[#161426] text-white rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 border-3 border-[#161426]">
                <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm">
                  <div className="flex items-center gap-2">
                    {previewIsHonest ? (
                      <span className="px-3 py-1 rounded-xl bg-emerald-500 text-[#161426] font-black flex items-center gap-1">
                        <SealCheck weight="fill" className="w-4 h-4" />
                        {isAr ? 'شنطة صادقة ١٠٠٪' : '100% Honest Bag'}
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-xl bg-rose-500 text-white font-black flex items-center gap-1">
                        <SealWarning weight="fill" className="w-4 h-4" />
                        {isAr ? 'شنطة فيها خدعة / تهريب!' : 'Bluff / Smuggling Bag!'}
                      </span>
                    )}
                  </div>

                  <div>
                    <span className="text-slate-400 font-bold">
                      {isAr ? 'ربحك لو مرّت: ' : 'Profit if passed: '}
                    </span>
                    <span className="text-emerald-400 font-black">
                      +{previewTotalValue - bribeCoins} {isAr ? 'ذهب صافي' : 'net gold'}
                    </span>
                  </div>

                  <div>
                    {previewIsHonest ? (
                      <span className="text-amber-300 font-black">
                        {isAr
                          ? `لو فتّشك الضابط تكسب +${
                              previewTotalValue + FALSE_ACCUSATION_COMPENSATION
                            } ذهب (شامل +12 تعويض!)`
                          : `If inspected, you win +${
                              previewTotalValue + FALSE_ACCUSATION_COMPENSATION
                            } gold (+12 bonus!)`}
                      </span>
                    ) : (
                      <span className="text-rose-300 font-black">
                        {isAr
                          ? `غرامة التفتيش لو انكشفت: -${previewPotentialPenalty} ذهب`
                          : `Penalty if caught: -${previewPotentialPenalty} gold`}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  disabled={selectedHandIndices.length !== 3}
                  onClick={handleLockSuitcase}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#22c55e] hover:bg-[#16a34a] disabled:opacity-50 text-[#161426] font-black text-base border-3 border-white shadow-[0_4px_0_rgba(255,255,255,0.3)] cursor-pointer transition-all"
                >
                  <LockKey weight="fill" className="w-5 h-5" />
                  {isAr
                    ? 'إقفال الشنطة وتقديمها للجمارك'
                    : 'Lock Suitcase & Submit to Customs'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ====================================================================
       * 3. PHASE 2: CUSTOMS CHECKPOINT INSPECTION ('inspection')
       * ==================================================================== */}
      {gameData.phase === 'inspection' && (
        <div className="space-y-5">
          {/* Checkpoint Banner */}
          <div className="bg-white border-4 border-[#161426] rounded-[1.75rem] p-5 shadow-[0_8px_0_#161426] flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-amber-100 border-3 border-[#161426] flex items-center justify-center">
                <MagnifyingGlass weight="bold" className="w-8 h-8 text-[#161426]" />
              </div>
              <div>
                <span className="px-2.5 py-0.5 rounded-lg bg-[#161426] text-[#fde047] text-xs font-black">
                  {isAr ? 'طاولة التفتيش الجمركي' : 'Customs Inspection Desk'}
                </span>
                <h3 className="text-xl font-black text-[#161426] mt-0.5">
                  {isAr
                    ? `القرار بيد الضابط (${sheriffPlayer.name}): تمرير الشنطة وأخذ الرشوة أم تفتيشها؟`
                    : `Officer ${sheriffPlayer.name}'s decision: Pass & pocket bribe, or Inspect!`}
                </h3>
              </div>
            </div>

            <div className="text-xs font-black bg-rose-50 border-2 border-[#161426] text-rose-900 px-3.5 py-2 rounded-xl">
              {isAr
                ? `تنبيه للضابط: تفتيش شنطة صادقة ١٠٠٪ يغرّمك ${FALSE_ACCUSATION_COMPENSATION} ذهب تعويضاً للمسافر!`
                : `Warning: Inspecting a 100% honest bag costs you ${FALSE_ACCUSATION_COMPENSATION} gold in compensation!`}
            </div>
          </div>

          {/* Suitcases Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {gameData.merchantIds.map((mId) => {
              const bag = gameData.suitcases[mId];
              if (!bag) return null;
              const mPlayer = getPlayer(mId);
              const declaredSpec = SHERIFF_GOODS[bag.declaredGood];
              const isResolved = bag.status !== 'pending';
              const res = bag.resolution;
              const canSheriffAct =
                !isResolved &&
                (isPassAndPlay ||
                  myPlayerId === gameData.sheriffId ||
                  (gameData.sheriffId === 'bot_smuggler' && isHost));

              return (
                <motion.div
                  key={mId}
                  layout
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`border-4 border-[#161426] rounded-[1.75rem] p-5 shadow-[0_8px_0_#161426] flex flex-col justify-between space-y-4 transition-colors ${
                    !isResolved
                      ? 'bg-white'
                      : res?.decision === 'passed'
                      ? 'bg-amber-50/90'
                      : res?.wasHonest
                      ? 'bg-emerald-50'
                      : 'bg-rose-50'
                  }`}
                >
                  {/* Top Row: Merchant Identity & Status Stamp */}
                  <div className="flex items-center justify-between gap-2 pb-3 border-b-2 border-[#161426]/10">
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-5 h-5 rounded-full border-2 border-[#161426]"
                        style={{ backgroundColor: mPlayer.avatar_color }}
                      />
                      <div>
                        <div className="font-black text-base text-[#161426]">
                          {mPlayer.name}
                        </div>
                        <div className="text-[11px] font-bold text-slate-500">
                          {isAr ? 'شنطة مسافر مختومة' : 'Sealed Traveler Suitcase'}
                        </div>
                      </div>
                    </div>

                    {/* Resolution Stamp Badge */}
                    {isResolved && res && (
                      <span
                        className={`px-3 py-1 rounded-xl border-2 border-[#161426] text-xs font-black shadow-[0_2px_0_#161426] ${
                          res.decision === 'passed'
                            ? 'bg-[#fde047] text-[#161426]'
                            : res.wasHonest
                            ? 'bg-emerald-500 text-white'
                            : 'bg-rose-600 text-white'
                        }`}
                      >
                        {res.decision === 'passed'
                          ? isAr
                            ? 'تم التمرير بدون تفتيش!'
                            : 'Passed Unopened!'
                          : res.wasHonest
                          ? isAr
                            ? 'بلاغ كاذب! المسافر صادق ١٠٠٪'
                            : 'False Accusation! 100% Honest!'
                          : isAr
                          ? 'تم كشف التهريب والمصادرة!'
                          : 'Contraband Caught & Confiscated!'}
                      </span>
                    )}
                  </div>

                  {/* Middle Area: Claim, Bribe & Suitcase Visual / Opened Contents */}
                  <div className="space-y-3">
                    {/* Official Claim + Bribe Offer Row */}
                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="bg-indigo-50 border-2 border-[#161426] rounded-2xl p-3 flex items-center gap-2.5">
                        <GoodCardSvg
                          goodId={bag.declaredGood}
                          className="w-10 h-10 shrink-0"
                        />
                        <div>
                          <div className="text-[10px] font-bold text-indigo-700">
                            {isAr ? 'التصريح الرسمي:' : 'Declared Claim:'}
                          </div>
                          <div className="font-black text-xs sm:text-sm text-[#161426]">
                            3 × {isAr ? declaredSpec.nameAr : declaredSpec.nameEn}
                          </div>
                        </div>
                      </div>

                      <div className="bg-amber-100 border-2 border-[#161426] rounded-2xl p-3 flex items-center gap-2.5">
                        <HandCoins
                          weight="fill"
                          className="w-8 h-8 text-amber-600 shrink-0"
                        />
                        <div>
                          <div className="text-[10px] font-bold text-amber-900">
                            {isAr ? 'الرشوة المعروضة:' : 'Bribe Offered:'}
                          </div>
                          <div className="font-black text-xs sm:text-sm text-[#161426]">
                            {bag.bribeCoins > 0
                              ? `+${bag.bribeCoins} ${isAr ? 'ذهب للضابط' : 'Gold'}`
                              : isAr
                              ? '٠ ذهب (تحدّي صريح!)'
                              : '0 Gold (Bold challenge!)'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Merchant's Psychological Bluff Quote */}
                    <div className="bg-slate-100 border-2 border-dashed border-[#161426]/40 rounded-xl px-3.5 py-2 text-xs font-bold text-[#161426] italic">
                      “
                      {isAr
                        ? BLUFF_NOTES[bag.bluffNoteIndex || 0]?.ar
                        : BLUFF_NOTES[bag.bluffNoteIndex || 0]?.en}
                      ”
                    </div>

                    {/* Closed Suitcase OR Revealed 3 Cards */}
                    {!isResolved ? (
                      <div className="py-4 flex flex-col items-center justify-center bg-slate-50 rounded-2xl border-2 border-[#161426]/20">
                        <SuitcaseSvg isOpen={false} className="w-24 h-20" />
                        <span className="text-xs font-black text-slate-600 mt-1">
                          {isAr
                            ? '٣ بضائع مخفية بالداخل — هل تصدّقه أم تفتّشه؟'
                            : '3 mystery items inside — Trust or Inspect?'}
                        </span>
                      </div>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-3 pt-1"
                      >
                        <div className="text-xs font-black text-[#161426] flex items-center justify-between">
                          <span>
                            {isAr
                              ? 'محتويات الشنطة الحقيقية:'
                              : 'Actual Suitcase Contents:'}
                          </span>
                          {res && (
                            <span className="text-xs font-black">
                              {isAr ? 'صافي التاجر:' : 'Merchant Net:'}{' '}
                              <strong
                                className={
                                  res.merchantGoldDelta >= 0
                                    ? 'text-emerald-700'
                                    : 'text-rose-600'
                                }
                              >
                                {res.merchantGoldDelta >= 0
                                  ? `+${res.merchantGoldDelta}`
                                  : res.merchantGoldDelta}{' '}
                                {isAr ? 'ذهب' : 'G'}
                              </strong>{' '}
                              | {isAr ? 'الضابط:' : 'Officer:'}{' '}
                              <strong
                                className={
                                  res.sheriffGoldDelta >= 0
                                    ? 'text-emerald-700'
                                    : 'text-rose-600'
                                }
                              >
                                {res.sheriffGoldDelta >= 0
                                  ? `+${res.sheriffGoldDelta}`
                                  : res.sheriffGoldDelta}{' '}
                                {isAr ? 'ذهب' : 'G'}
                              </strong>
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-3 gap-2.5">
                          {bag.packedGoods.map((gId, cIdx) => {
                            const spec = SHERIFF_GOODS[gId];
                            const wasConfiscated =
                              res?.decision === 'inspected' &&
                              gId !== bag.declaredGood;
                            return (
                              <div
                                key={`${gId}-${cIdx}`}
                                className={`p-2.5 rounded-xl border-3 border-[#161426] flex flex-col items-center text-center relative ${
                                  wasConfiscated
                                    ? 'bg-rose-100 opacity-90'
                                    : spec.bgClass
                                }`}
                              >
                                <GoodCardSvg goodId={gId} className="w-11 h-11" />
                                <span className="text-[11px] font-black text-[#161426] mt-1">
                                  {isAr ? spec.nameAr : spec.nameEn}
                                </span>
                                <span
                                  className={`mt-1 px-2 py-0.5 rounded text-[10px] font-black border border-[#161426] ${
                                    wasConfiscated
                                      ? 'bg-rose-600 text-white'
                                      : 'bg-emerald-500 text-white'
                                  }`}
                                >
                                  {wasConfiscated
                                    ? isAr
                                      ? `مُصادرة (-${spec.penalty})`
                                      : `Seized (-${spec.penalty})`
                                    : `+${spec.value} ${isAr ? 'ذهب' : 'G'}`}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </div>

                  {/* Action Buttons for Customs Officer */}
                  {!isResolved && (
                    <div className="pt-2">
                      {canSheriffAct ? (
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            type="button"
                            onClick={() => handleSheriffDecision(mId, 'passed')}
                            className="flex items-center justify-center gap-2 py-3 px-3 rounded-2xl bg-[#22c55e] hover:bg-[#16a34a] text-white font-black text-xs sm:text-sm border-3 border-[#161426] shadow-[0_5px_0_#161426] active:translate-y-1 active:shadow-[0_1px_0_#161426] transition-all cursor-pointer"
                          >
                            <CheckCircle weight="fill" className="w-5 h-5 shrink-0" />
                            <span>
                              {isAr
                                ? `تمرير الشنطة ${
                                    bag.bribeCoins > 0
                                      ? `(+${bag.bribeCoins} ذهب)`
                                      : ''
                                  }`
                                : `Pass Bag ${
                                    bag.bribeCoins > 0 ? `(+${bag.bribeCoins}G)` : ''
                                  }`}
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleSheriffDecision(mId, 'inspected')}
                            className="flex items-center justify-center gap-2 py-3 px-3 rounded-2xl bg-[#ef4444] hover:bg-[#dc2626] text-white font-black text-xs sm:text-sm border-3 border-[#161426] shadow-[0_5px_0_#161426] active:translate-y-1 active:shadow-[0_1px_0_#161426] transition-all cursor-pointer"
                          >
                            <MagnifyingGlass
                              weight="bold"
                              className="w-5 h-5 shrink-0"
                            />
                            <span>
                              {isAr ? 'تفتيش الشنطة!' : 'Inspect Bag!'}
                            </span>
                          </button>
                        </div>
                      ) : (
                        <div className="text-center py-2.5 rounded-xl bg-amber-100 border-2 border-[#161426] text-xs font-black text-[#161426]">
                          {isAr
                            ? `بانتظار قرار الضابط (${sheriffPlayer.name})...`
                            : `Waiting for Officer ${sheriffPlayer.name}'s decision...`}
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Continue Button once all bags are resolved */}
          {allSuitcasesResolved && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-center pt-2"
            >
              {(isPassAndPlay || isHost || myPlayerId === gameData.sheriffId) ? (
                <button
                  type="button"
                  onClick={handleFinishInspectionPhase}
                  className="inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl bg-[#facc15] hover:bg-[#eab308] text-[#161426] font-black text-base sm:text-lg border-4 border-[#161426] shadow-[0_6px_0_#161426] active:translate-y-1 active:shadow-[0_2px_0_#161426] transition-all cursor-pointer"
                >
                  <span>
                    {gameData.round >= gameData.totalRounds
                      ? isAr
                        ? 'عرض النتائج النهائية وتكريم أثرى مهرّب!'
                        : 'Show Final Standings & Crown Winner!'
                      : isAr
                      ? 'ملخص الجولة وتبديل ضابط الجمارك'
                      : 'Round Summary & Rotate Customs Officer'}
                  </span>
                  <ArrowRight weight="bold" className="w-5 h-5" />
                </button>
              ) : (
                <div className="px-5 py-3 rounded-2xl bg-white border-3 border-[#161426] text-sm font-black text-[#161426]">
                  {isAr
                    ? 'بانتظار المضيف أو الضابط للانتقال للجولة التالية...'
                    : 'Waiting for Host or Officer to continue...'}
                </div>
              )}
            </motion.div>
          )}
        </div>
      )}

      {/* ====================================================================
       * 4. PHASE 3: ROUND SUMMARY ('round_summary')
       * ==================================================================== */}
      {gameData.phase === 'round_summary' && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border-4 border-[#161426] rounded-[1.75rem] p-6 sm:p-8 shadow-[0_8px_0_#161426] space-y-6"
        >
          <div className="text-center space-y-2">
            <span className="px-3.5 py-1 rounded-full bg-amber-200 border-2 border-[#161426] text-xs font-black text-[#161426]">
              {isAr
                ? `انتهت الجولة ${gameData.round} من ${gameData.totalRounds}`
                : `End of Round ${gameData.round} of ${gameData.totalRounds}`}
            </span>
            <h3 className="text-2xl font-black text-[#161426]">
              {isAr ? 'حصيلة التهريب والجمارك' : 'Customs & Smuggling Standings'}
            </h3>
          </div>

          {/* Standings Table */}
          <div className="space-y-2.5 max-w-2xl mx-auto">
            {[...effectivePlayers]
              .sort(
                (a, b) =>
                  (gameData.goldByPlayer[b.id] ?? 0) -
                  (gameData.goldByPlayer[a.id] ?? 0)
              )
              .map((p, idx) => {
                const gold = gameData.goldByPlayer[p.id] ?? STARTING_GOLD;
                const smuggled = gameData.contrabandSmuggledCount[p.id] || 0;
                const caught = gameData.smugglersCaughtCount[p.id] || 0;
                return (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-3.5 rounded-2xl border-3 border-[#161426] bg-slate-50 shadow-[0_4px_0_#161426]"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-xl bg-[#161426] text-[#fde047] font-black text-xs flex items-center justify-center">
                        #{idx + 1}
                      </span>
                      <span
                        className="w-4 h-4 rounded-full border-2 border-[#161426]"
                        style={{ backgroundColor: p.avatar_color }}
                      />
                      <div>
                        <div className="font-black text-sm sm:text-base text-[#161426]">
                          {p.name}
                        </div>
                        <div className="text-[11px] font-bold text-slate-500">
                          {isAr
                            ? `مهرّبات ناجحة: ${smuggled} | مهربين قبض عليهم: ${caught}`
                            : `Smuggled: ${smuggled} | Caught as Officer: ${caught}`}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#fef08a] border-2 border-[#161426] font-black text-sm text-[#161426]">
                      <Coins weight="fill" className="w-4 h-4 text-amber-600" />
                      <span>
                        {gold} {isAr ? 'ذهب' : 'Gold'}
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>

          <div className="flex justify-center pt-2">
            {isPassAndPlay || isHost || myPlayerId === gameData.sheriffId ? (
              <button
                type="button"
                onClick={handleNextRound}
                className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-[#22c55e] hover:bg-[#16a34a] text-white font-black text-base border-4 border-[#161426] shadow-[0_6px_0_#161426] active:translate-y-1 active:shadow-[0_2px_0_#161426] transition-all cursor-pointer"
              >
                <span>
                  {isAr
                    ? `بدء الجولة ${gameData.round + 1} (ضابط جمارك جديد!)`
                    : `Start Round ${gameData.round + 1} (New Customs Officer!)`}
                </span>
                <ArrowRight weight="bold" className="w-5 h-5" />
              </button>
            ) : (
              <div className="text-sm font-black text-slate-600">
                {isAr
                  ? 'بانتظار المضيف لبدء الجولة التالية...'
                  : 'Waiting for host to start the next round...'}
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* ====================================================================
       * 5. PHASE 4: GAME OVER & RICHEST SMUGGLER PODIUM ('game_over')
       * ==================================================================== */}
      {gameData.phase === 'game_over' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white border-4 border-[#161426] rounded-[1.75rem] p-6 sm:p-8 shadow-[0_8px_0_#161426] space-y-6 text-center"
        >
          <div className="w-20 h-20 mx-auto rounded-3xl bg-[#fef08a] border-4 border-[#161426] flex items-center justify-center shadow-[0_5px_0_#161426]">
            <Trophy weight="fill" className="w-11 h-11 text-amber-600" />
          </div>

          {(() => {
            const ranked = [...effectivePlayers].sort(
              (a, b) =>
                (gameData.goldByPlayer[b.id] ?? 0) -
                (gameData.goldByPlayer[a.id] ?? 0)
            );
            const winner = ranked[0];
            const winnerGold = gameData.goldByPlayer[winner.id] ?? STARTING_GOLD;

            return (
              <>
                <div className="space-y-1">
                  <span className="px-3.5 py-1 rounded-full bg-[#161426] text-[#fde047] text-xs font-black">
                    {isAr ? 'أثرى إمبراطور في الجمارك!' : 'Richest Customs Tycoon!'}
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-black text-[#161426] pt-1">
                    {winner.name} — {winnerGold} {isAr ? 'ذهب' : 'Gold'}
                  </h3>
                </div>

                <div className="space-y-2.5 max-w-2xl mx-auto text-start">
                  {ranked.map((p, idx) => {
                    const gold = gameData.goldByPlayer[p.id] ?? STARTING_GOLD;
                    const smuggled = gameData.contrabandSmuggledCount[p.id] || 0;
                    const falseAcc = gameData.falseAccusationsReceived[p.id] || 0;
                    const caught = gameData.smugglersCaughtCount[p.id] || 0;

                    return (
                      <div
                        key={p.id}
                        className={`flex flex-wrap items-center justify-between gap-2 p-4 rounded-2xl border-3 border-[#161426] ${
                          idx === 0
                            ? 'bg-gradient-to-r from-amber-100 to-yellow-200 shadow-[0_5px_0_#161426]'
                            : 'bg-slate-50 shadow-[0_3px_0_#161426]'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 rounded-xl bg-[#161426] text-[#fde047] font-black text-sm flex items-center justify-center">
                            #{idx + 1}
                          </span>
                          <div>
                            <div className="font-black text-base text-[#161426]">
                              {p.name}
                            </div>
                            <div className="text-xs font-bold text-slate-600 flex flex-wrap gap-2 mt-0.5">
                              <span>
                                {isAr
                                  ? `مهرّبات ناجحة: ${smuggled}`
                                  : `Contraband Smuggled: ${smuggled}`}
                              </span>
                              <span>•</span>
                              <span>
                                {isAr
                                  ? `تعويضات البلاغ الكاذب: ${falseAcc}`
                                  : `Honest Traps Sprung: ${falseAcc}`}
                              </span>
                              <span>•</span>
                              <span>
                                {isAr
                                  ? `كشف مهربين كضابط: ${caught}`
                                  : `Smugglers Caught: ${caught}`}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="px-4 py-2 rounded-xl bg-[#161426] text-[#fde047] font-black text-base flex items-center gap-1.5">
                          <Coins weight="fill" className="w-5 h-5 text-amber-400" />
                          <span>
                            {gold} {isAr ? 'ذهب' : 'G'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            );
          })()}

          {(isHost || isPassAndPlay) && (
            <div className="pt-3">
              <button
                type="button"
                onClick={onStartNewRound}
                className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-[#22c55e] hover:bg-[#16a34a] text-white font-black text-base border-4 border-[#161426] shadow-[0_6px_0_#161426] active:translate-y-1 active:shadow-[0_2px_0_#161426] transition-all cursor-pointer"
              >
                <ArrowsClockwise weight="bold" className="w-5 h-5" />
                <span>{isAr ? 'مباراة تهريب جديدة' : 'Play New Match'}</span>
              </button>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default SheriffGame;
