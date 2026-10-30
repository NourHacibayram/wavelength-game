import React, { useState, useEffect, useRef, useMemo } from 'react';
import confetti from 'canvas-confetti';
import {
  Crown,
  Robot,
  Users,
  Sparkle,
  Lightning,
  Trophy,
  ArrowsClockwise,
  Eye,
  EyeSlash,
  CheckCircle,
  Flame,
  Play,
  Sword,
  HandPalm,
} from '@phosphor-icons/react';

export type Suit = 'H' | 'S' | 'D' | 'C';
export type TrixContract =
  | 'king_of_hearts'
  | 'queens'
  | 'diamonds'
  | 'tricks'
  | 'trix'
  | 'complex';

export interface TrixCard {
  id: string; // e.g. 'KH', '7H', 'JS'
  suit: Suit;
  rank: number; // 2..14 (11=J, 12=Q, 13=K, 14=A)
}

export interface TrixSeat {
  seatIndex: number; // 0..3
  playerId: string;
  isBot: boolean;
  botNameAr?: string;
  botNameEn?: string;
  totalScore: number;
  handScore: number;
  tricksWon: number;
  diamondsEaten: number;
  queensEaten: string[];
  ateKingOfHearts: boolean;
}

export interface PlayedTrickCard {
  seatIndex: number;
  card: TrixCard;
}

export interface TrixGameState {
  rulesVersion?: number;
  seats: TrixSeat[];
  mode: 'kingdoms' | 'complex';
  partnership: boolean; // Seats 0+2 vs Seats 1+3
  phase:
    | 'choose_contract'
    | 'doubling'
    | 'playing'
    | 'trick_pause'
    | 'hand_summary'
    | 'match_over';
  kingdomNumber: number; // 1..4
  kingdomOwnerSeat: number; // 0..3
  remainingContracts: TrixContract[];
  activeContract: TrixContract | null;
  hands: Record<number, TrixCard[]>;
  doubledCards: Record<string, number>; // cardId ('KH' | 'QH' | ...) -> doubler seatIndex
  doublingReadySeats: number[];
  turnSeat: number;
  // Trix sequential layout state
  trixLanes: Record<Suit, { low: number; high: number } | null>;
  trixFinishOrder: number[]; // seatIndices in order of emptying hand
  // Trick-taking state
  currentTrick: PlayedTrickCard[];
  heartsBroken: boolean;
  lastTrickWinnerSeat: number | null;
  lastTrickMessageAr?: string;
  lastTrickMessageEn?: string;
  queensEatenTotal: number;
  kingOfHeartsEaten: boolean;
}

interface PlayerInfo {
  id: string;
  name: string;
  avatar_color: string;
  score: number;
}

export interface TrixGameProps {
  gameData: TrixGameState;
  players: PlayerInfo[];
  myPlayerId: string;
  isHost: boolean;
  isPassAndPlay: boolean;
  lang: 'ar' | 'en';
  onUpdateGameData: (
    nextData: TrixGameState,
    scoreAwards?: Record<string, number>
  ) => void;
  onStartNewRound: () => void;
}

const SUIT_ORDER: Suit[] = ['H', 'S', 'D', 'C'];

const SUIT_NAMES: Record<Suit, { ar: string; en: string; color: string }> = {
  H: { ar: 'كبة', en: 'Hearts', color: '#ff595e' },
  S: { ar: 'سبيت', en: 'Spades', color: '#94a3b8' },
  D: { ar: 'ديناري', en: 'Diamonds', color: '#ff924c' },
  C: { ar: 'سنك', en: 'Clubs', color: '#cbd5e1' },
};

const BOT_PROFILES = [
  { id: 'trix_bot_1', ar: 'أبو شهاب (بوت)', en: 'Bot Karim', color: '#00bbf9' },
  { id: 'trix_bot_2', ar: 'أبو عصام (بوت)', en: 'Bot Tariq', color: '#8ac926' },
  { id: 'trix_bot_3', ar: 'أبو جودت (بوت)', en: 'Bot Ziad', color: '#f15bb5' },
  { id: 'trix_bot_4', ar: 'العقيد (بوت)', en: 'Bot Omar', color: '#ff924c' },
];

export const FIVE_KINGDOM_CONTRACTS: TrixContract[] = [
  'king_of_hearts',
  'queens',
  'diamonds',
  'tricks',
  'trix',
];

const CONTRACT_META: Record<
  TrixContract,
  {
    ar: string;
    en: string;
    shortAr: string;
    shortEn: string;
    ptsBadgeAr: string;
    ptsBadgeEn: string;
    descAr: string;
    descEn: string;
    accent: string;
  }
> = {
  king_of_hearts: {
    ar: 'شيخ الكبة',
    en: 'King of Hearts',
    shortAr: 'شيخ الكبة',
    shortEn: 'King H',
    ptsBadgeAr: '-75 (أو -150 مدبّل)',
    ptsBadgeEn: '-75 (-150 Doubled)',
    descAr: 'تجنّب أكل شيخ الكبة! يتضاعف العقاب إلى -150 والمكافأة +75 عند التدبيل وتنتهي الجولة فور أكله.',
    descEn: 'Avoid eating the King of Hearts! Doubles to -150 (+75 bonus to doubler) and ends the hand immediately.',
    accent: '#e63946',
  },
  queens: {
    ar: 'البنات (الدامات)',
    en: 'Queens (Banat)',
    shortAr: 'البنات',
    shortEn: 'Queens',
    ptsBadgeAr: '-25 لكل بنت (-50 مدبّلة)',
    ptsBadgeEn: '-25 each (-50 Doubled)',
    descAr: 'تجنّب أكل البنات الأربع! كل بنت بـ -25 نقطة، ويمكن تدبيل أي بنت بيدك قبل اللعب لتصبح بـ -50!',
    descEn: 'Avoid eating the 4 Queens! Each costs -25 pts, or -50 pts (+25 to doubler) when doubled before play.',
    accent: '#9b5de5',
  },
  diamonds: {
    ar: 'الديناري',
    en: 'Diamonds',
    shortAr: 'الديناري',
    shortEn: 'Diamonds',
    ptsBadgeAr: '-10 لكل ديناري',
    ptsBadgeEn: '-10 per Diamond',
    descAr: 'تجنّب أكل أوراق الديناري! كل ورقة ديناري ضمن الأكلة تخصم -10 نقاط من رصيدك.',
    descEn: 'Avoid collecting Diamond cards! Every Diamond card taken in a trick costs -10 points.',
    accent: '#ff924c',
  },
  tricks: {
    ar: 'اللطش (الأكلات)',
    en: 'Tricks (Laltesh)',
    shortAr: 'اللطش',
    shortEn: 'Tricks',
    ptsBadgeAr: '-15 لكل أكلة',
    ptsBadgeEn: '-15 per Trick',
    descAr: 'العب أصغر أوراقك وتجنّب لمّ الأكلات عن الأرض! كل أكلة تكسبها تخصم -15 نقطة.',
    descEn: 'Play low and duck under tricks! Every trick you take costs -15 points.',
    accent: '#00bbf9',
  },
  trix: {
    ar: 'التركس (ترتيب السلسلة)',
    en: 'Trix (Jack Domino)',
    shortAr: 'التركس',
    shortEn: 'Trix',
    ptsBadgeAr: '+200 / +150 / +100 / +50',
    ptsBadgeEn: '+200 / +150 / +100 / +50',
    descAr: 'العقد الموجب الوحيد! افتح بالولد (J) ورتّب صعوداً للـ A ونزولاً للـ 2 لتفرغ يدك أولاً وتكسب +200!',
    descEn: 'The positive scoring contract! Open lanes with Jacks (J) up to A and down to 2. First out wins +200!',
    accent: '#8ac926',
  },
  complex: {
    ar: 'كومبلكس (كل العقوبات معاً!)',
    en: 'Complex (All Penalties!)',
    shortAr: 'كومبلكس',
    shortEn: 'Complex',
    ptsBadgeAr: 'كل النواقص معاً',
    ptsBadgeEn: 'All 4 Penalties',
    descAr: 'شيخ الكبة (-75)، البنات (-25)، الديناري (-10)، واللطش (-15) مجتمعة في جولة نارية واحدة!',
    descEn: 'King of Hearts (-75), Queens (-25), Diamonds (-10) & Tricks (-15) combined in one intense hand!',
    accent: '#f15bb5',
  },
};

function rankLabel(rank: number): string {
  if (rank === 14) return 'A';
  if (rank === 13) return 'K';
  if (rank === 12) return 'Q';
  if (rank === 11) return 'J';
  return String(rank);
}

function createShuffledDeck(): TrixCard[] {
  const deck: TrixCard[] = [];
  for (const suit of SUIT_ORDER) {
    for (let rank = 2; rank <= 14; rank++) {
      deck.push({ id: `${rankLabel(rank)}${suit}`, suit, rank });
    }
  }
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = deck[i];
    deck[i] = deck[j];
    deck[j] = tmp;
  }
  return deck;
}

function sortHand(cards: TrixCard[]): TrixCard[] {
  return [...cards].sort((a, b) => {
    const sDiff = SUIT_ORDER.indexOf(a.suit) - SUIT_ORDER.indexOf(b.suit);
    if (sDiff !== 0) return sDiff;
    return b.rank - a.rank; // High to low within each suit for instant readability!
  });
}

function dealFourHands(): { hands: Record<number, TrixCard[]>; sevenHeartsSeat: number } {
  const deck = createShuffledDeck();
  const hands: Record<number, TrixCard[]> = { 0: [], 1: [], 2: [], 3: [] };
  let sevenHeartsSeat = 0;
  for (let s = 0; s < 4; s++) {
    const slice = sortHand(deck.slice(s * 13, (s + 1) * 13));
    hands[s] = slice;
    if (slice.some((c) => c.id === '7H')) {
      sevenHeartsSeat = s;
    }
  }
  return { hands, sevenHeartsSeat };
}

function contractsForMode(mode: 'kingdoms' | 'complex'): TrixContract[] {
  return mode === 'kingdoms'
    ? [...FIVE_KINGDOM_CONTRACTS]
    : ['trix', 'complex'];
}

export function buildInitialTrixState(
  playerIds: string[],
  mode: 'kingdoms' | 'complex' = 'kingdoms',
  partnership = false
): TrixGameState {
  const { hands } = dealFourHands();
  const seats: TrixSeat[] = [0, 1, 2, 3].map((idx) => {
    const humanId = playerIds[idx];
    if (humanId) {
      return {
        seatIndex: idx,
        playerId: humanId,
        isBot: false,
        totalScore: 0,
        handScore: 0,
        tricksWon: 0,
        diamondsEaten: 0,
        queensEaten: [],
        ateKingOfHearts: false,
      };
    }
    const bot = BOT_PROFILES[idx % BOT_PROFILES.length];
    return {
      seatIndex: idx,
      playerId: bot.id,
      isBot: true,
      botNameAr: bot.ar,
      botNameEn: bot.en,
      totalScore: 0,
      handScore: 0,
      tricksWon: 0,
      diamondsEaten: 0,
      queensEaten: [],
      ateKingOfHearts: false,
    };
  });

  // Seat 0 (the first human player!) ALWAYS owns Kingdom 1 so the player immediately chooses from the 5 Kingdoms!
  return {
    rulesVersion: 2,
    seats,
    mode,
    partnership,
    phase: 'choose_contract',
    kingdomNumber: 1,
    kingdomOwnerSeat: 0,
    remainingContracts: contractsForMode(mode),
    activeContract: null,
    hands,
    doubledCards: {},
    doublingReadySeats: [],
    turnSeat: 0,
    trixLanes: { H: null, S: null, D: null, C: null },
    trixFinishOrder: [],
    currentTrick: [],
    heartsBroken: false,
    lastTrickWinnerSeat: null,
    queensEatenTotal: 0,
    kingOfHeartsEaten: false,
  };
}

/* ============================================================================
 * PURE VECTOR SUIT, CONTRACT EMBLEMS & LUXURY PLAYING CARDS
 * ========================================================================== */
const SuitVectorSvg: React.FC<{ suit: Suit; className?: string }> = ({
  suit,
  className = 'w-4 h-4',
}) => (
  <svg viewBox="0 0 24 24" className={`${className} inline-block shrink-0`}>
    {suit === 'H' && (
      <path
        d="M 12 20.5 C 12 20.5 3 14.5 3 8.5 C 3 5 6 3 9 4.5 C 10.6 5.3 12 7.2 12 7.2 C 12 7.2 13.4 5.3 15 4.5 C 18 3 21 5 21 8.5 C 21 14.5 12 20.5 12 20.5 Z"
        fill="#ff595e"
        stroke="#161426"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    )}
    {suit === 'D' && (
      <polygon
        points="12,2.5 20.5,12 12,21.5 3.5,12"
        fill="#ff924c"
        stroke="#161426"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    )}
    {suit === 'S' && (
      <g>
        <path
          d="M 12 2.5 C 12 2.5 21 9.5 21 14.5 C 21 18 17.5 19 15 17 L 12 14.5 L 9 17 C 6.5 19 3 18 3 14.5 C 3 9.5 12 2.5 12 2.5 Z"
          fill="#1e293b"
          stroke="#161426"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <path d="M 9.5 16.5 L 12 21.5 L 14.5 16.5 Z" fill="#161426" />
      </g>
    )}
    {suit === 'C' && (
      <g fill="#334155" stroke="#161426" strokeWidth="1.6">
        <circle cx="12" cy="7.5" r="4.3" />
        <circle cx="7.3" cy="13.5" r="4.3" />
        <circle cx="16.7" cy="13.5" r="4.3" />
        <path d="M 10 15.5 L 14 15.5 L 15 21.5 L 9 21.5 Z" fill="#161426" stroke="none" />
      </g>
    )}
  </svg>
);

const ContractEmblemSvg: React.FC<{ contract: TrixContract }> = ({ contract }) => {
  switch (contract) {
    case 'king_of_hearts':
      return (
        <svg viewBox="0 0 44 44" className="w-11 h-11 shrink-0">
          <rect
            x="4"
            y="4"
            width="36"
            height="36"
            rx="10"
            fill="#fff1f2"
            stroke="#161426"
            strokeWidth="3"
          />
          <path
            d="M12 17l4-6 6 5 6-5 4 6H12z"
            fill="#ffca3a"
            stroke="#161426"
            strokeWidth="2.2"
            strokeLinejoin="round"
          />
          <path
            d="M22 35s-9-5.5-9-11c0-3 2.5-5 5-3.8 1.5.7 4 2.8 4 2.8s2.5-2.1 4-2.8c2.5-1.2 5 .8 5 3.8 0 5.5-9 11-9 11z"
            fill="#e63946"
            stroke="#161426"
            strokeWidth="2.2"
          />
        </svg>
      );
    case 'queens':
      return (
        <svg viewBox="0 0 44 44" className="w-11 h-11 shrink-0">
          <rect
            x="4"
            y="4"
            width="36"
            height="36"
            rx="10"
            fill="#f3e8ff"
            stroke="#161426"
            strokeWidth="3"
          />
          <path
            d="M10 29l3-13 9 7 9-7 3 13H10z"
            fill="#c084fc"
            stroke="#161426"
            strokeWidth="2.4"
            strokeLinejoin="round"
          />
          <circle cx="13" cy="14" r="2.5" fill="#ffca3a" stroke="#161426" strokeWidth="1.6" />
          <circle cx="22" cy="11" r="2.8" fill="#ffca3a" stroke="#161426" strokeWidth="1.6" />
          <circle cx="31" cy="14" r="2.5" fill="#ffca3a" stroke="#161426" strokeWidth="1.6" />
        </svg>
      );
    case 'diamonds':
      return (
        <svg viewBox="0 0 44 44" className="w-11 h-11 shrink-0">
          <rect
            x="4"
            y="4"
            width="36"
            height="36"
            rx="10"
            fill="#fff7ed"
            stroke="#161426"
            strokeWidth="3"
          />
          <polygon
            points="22,8 34,22 22,36 10,22"
            fill="#ff924c"
            stroke="#161426"
            strokeWidth="2.6"
          />
          <polygon points="22,13 29,22 22,31 15,22" fill="#fed7aa" opacity="0.7" />
        </svg>
      );
    case 'tricks':
      return (
        <svg viewBox="0 0 44 44" className="w-11 h-11 shrink-0">
          <rect
            x="4"
            y="4"
            width="36"
            height="36"
            rx="10"
            fill="#e0f2fe"
            stroke="#161426"
            strokeWidth="3"
          />
          <rect
            x="11"
            y="11"
            width="16"
            height="21"
            rx="3"
            fill="#ffffff"
            stroke="#161426"
            strokeWidth="2.4"
          />
          <rect
            x="17"
            y="14"
            width="16"
            height="21"
            rx="3"
            fill="#38bdf8"
            stroke="#161426"
            strokeWidth="2.4"
          />
        </svg>
      );
    case 'trix':
      return (
        <svg viewBox="0 0 44 44" className="w-11 h-11 shrink-0">
          <rect
            x="4"
            y="4"
            width="36"
            height="36"
            rx="10"
            fill="#ecfccb"
            stroke="#161426"
            strokeWidth="3"
          />
          <path
            d="M9 30l4-15 9 7 9-7 4 15H9z"
            fill="#ffca3a"
            stroke="#161426"
            strokeWidth="2.6"
            strokeLinejoin="round"
          />
          <text
            x="22"
            y="28"
            textAnchor="middle"
            fill="#161426"
            fontSize="11"
            fontWeight="900"
          >
            J
          </text>
        </svg>
      );
    case 'complex':
    default:
      return (
        <svg viewBox="0 0 44 44" className="w-11 h-11 shrink-0">
          <rect
            x="4"
            y="4"
            width="36"
            height="36"
            rx="10"
            fill="#fce7f3"
            stroke="#161426"
            strokeWidth="3"
          />
          <circle cx="22" cy="22" r="11" fill="#f15bb5" stroke="#161426" strokeWidth="2.6" />
          <text
            x="22"
            y="26"
            textAnchor="middle"
            fill="#ffffff"
            fontSize="12"
            fontWeight="900"
          >
            4x
          </text>
        </svg>
      );
  }
};

/* Ornate Card Back Fanned Stack for Opponents */
const OpponentCardBacksFan: React.FC<{ count: number; vertical?: boolean }> = ({
  count,
  vertical = false,
}) => {
  const shown = Math.min(count, 8);
  if (shown <= 0) {
    return (
      <span className="px-2.5 py-0.5 rounded-full bg-[#8ac926] text-[#161426] font-black text-xs border-2 border-[#161426]">
        0
      </span>
    );
  }
  return (
    <div
      className={`flex items-center justify-center ${
        vertical ? 'flex-col -space-y-4' : '-space-x-3'
      }`}
    >
      {Array.from({ length: shown }).map((_, idx) => (
        <div
          key={idx}
          className={`${
            vertical ? 'w-9 h-6' : 'w-7 h-10 sm:w-8 sm:h-11'
          } rounded-lg bg-gradient-to-br from-[#dc2626] to-[#991b1b] border-2 border-[#161426] shadow-[0_2px_0_#161426] flex items-center justify-center`}
        >
          <div className="w-3/4 h-3/4 rounded border border-[#ffca3a]/60 bg-[#7f1d1d]/40" />
        </div>
      ))}
    </div>
  );
};

/* Large Luxury Playing Card Component */
const TrixPlayingCardButton: React.FC<{
  card: TrixCard;
  playable: boolean;
  doubled?: boolean;
  size?: 'hand' | 'table' | 'mini';
  onClick?: () => void;
}> = ({ card, playable, doubled = false, size = 'hand', onClick }) => {
  const isRed = card.suit === 'H' || card.suit === 'D';
  const isKingHearts = card.id === 'KH';
  const isQueen = card.rank === 12;
  const isJack = card.rank === 11;
  const rText = rankLabel(card.rank);

  const dims =
    size === 'hand'
      ? 'w-[70px] h-[104px] sm:w-[84px] sm:h-[124px] md:w-[92px] md:h-[136px] p-1.5 sm:p-2 rounded-2xl'
      : size === 'table'
      ? 'w-[68px] h-[100px] sm:w-[82px] sm:h-[120px] p-1.5 sm:p-2 rounded-2xl'
      : 'w-11 h-15 p-1 rounded-xl';

  return (
    <button
      type="button"
      disabled={!playable}
      onClick={onClick}
      className={`relative border-3 border-[#161426] select-none transition-all flex flex-col justify-between ${dims} ${
        playable
          ? 'bg-[#fffef9] hover:-translate-y-3.5 shadow-[0_6px_0_#161426] ring-3 ring-[#8ac926] cursor-pointer active:translate-y-0 z-10'
          : size === 'table'
          ? 'bg-[#fffef9] shadow-[0_5px_0_#161426] cursor-default'
          : 'bg-[#e2e8f0] opacity-75 shadow-[0_3px_0_#161426] cursor-not-allowed'
      }`}
    >
      {doubled && (
        <span className="absolute -top-2.5 -end-2 z-20 bg-[#ff595e] text-white text-[11px] font-black px-2 py-0.5 rounded-full border-2 border-[#161426] shadow-[0_2px_0_#161426]">
          ×2
        </span>
      )}

      {/* Top Corner */}
      <div className="flex items-center justify-between w-full leading-none">
        <span
          className={`font-black ${
            size === 'mini'
              ? 'text-xs'
              : 'text-base sm:text-lg md:text-xl'
          } ${isRed ? 'text-[#e63946]' : 'text-[#161426]'}`}
        >
          {rText}
        </span>
        <SuitVectorSvg
          suit={card.suit}
          className={size === 'mini' ? 'w-3 h-3' : 'w-4 h-4 sm:w-5 sm:h-5'}
        />
      </div>

      {/* Center Court / Suit Artwork */}
      <div className="flex flex-col items-center justify-center my-auto">
        {isKingHearts ? (
          <div className="flex flex-col items-center">
            <Crown
              weight="fill"
              className="w-5 h-5 sm:w-6 sm:h-6 text-[#ffca3a] drop-shadow-[0_1.5px_0_#161426]"
            />
            <SuitVectorSvg
              suit="H"
              className={size === 'mini' ? 'w-4 h-4' : 'w-7 h-7 sm:w-8 sm:h-8'}
            />
          </div>
        ) : isQueen ? (
          <div className="flex flex-col items-center">
            <Sparkle
              weight="fill"
              className="w-4 h-4 sm:w-5 sm:h-5 text-[#9b5de5]"
            />
            <SuitVectorSvg
              suit={card.suit}
              className={size === 'mini' ? 'w-4 h-4' : 'w-6 h-6 sm:w-7 sm:h-7'}
            />
          </div>
        ) : isJack ? (
          <div className="flex flex-col items-center">
            <span className="px-1.5 py-0.2 rounded bg-[#ffca3a]/40 text-[#161426] text-[9px] font-black">
              JACK
            </span>
            <SuitVectorSvg
              suit={card.suit}
              className={size === 'mini' ? 'w-4 h-4' : 'w-6 h-6 sm:w-7 sm:h-7'}
            />
          </div>
        ) : (
          <SuitVectorSvg
            suit={card.suit}
            className={size === 'mini' ? 'w-4 h-4' : 'w-7 h-7 sm:w-8 sm:h-8'}
          />
        )}
      </div>

      {/* Bottom Corner */}
      <div className="flex items-center justify-end w-full leading-none opacity-85">
        <span
          className={`font-black ${
            size === 'mini' ? 'text-[10px]' : 'text-xs sm:text-sm'
          } ${isRed ? 'text-[#e63946]' : 'text-[#161426]'}`}
        >
          {rText}
        </span>
      </div>
    </button>
  );
};

/* ============================================================================
 * LEGAL MOVE, HAND ADVISOR & AI ENGINE FOR TRIX
 * ========================================================================== */
function getContractHintForHand(
  hand: TrixCard[],
  contract: TrixContract,
  isAr: boolean
): { badge: string; good: boolean } {
  const jacks = hand.filter((c) => c.rank === 11).length;
  const hasKh = hand.some((c) => c.id === 'KH');
  const heartsCount = hand.filter((c) => c.suit === 'H').length;
  const queensCount = hand.filter((c) => c.rank === 12).length;
  const diamondsCount = hand.filter((c) => c.suit === 'D').length;
  const lowCardsCount = hand.filter((c) => c.rank <= 6).length;

  switch (contract) {
    case 'king_of_hearts':
      if (!hasKh && heartsCount <= 3) {
        return {
          badge: isAr ? 'ممتاز ليدك (بدون شيخ الكبة)' : 'Great (Safe from K of Hearts)',
          good: true,
        };
      }
      if (hasKh && heartsCount >= 4) {
        return {
          badge: isAr ? 'فرصة تدبيل شيخ الكبة!' : 'Good for Doubling King!',
          good: true,
        };
      }
      return {
        badge: isAr ? `معك ${heartsCount} أوراق كبة` : `You hold ${heartsCount} Hearts`,
        good: false,
      };
    case 'queens':
      return {
        badge: isAr
          ? `في يدك ${queensCount} بنات`
          : `You hold ${queensCount} Queens`,
        good: queensCount <= 1,
      };
    case 'diamonds':
      return {
        badge: isAr
          ? `في يدك ${diamondsCount} أوراق ديناري`
          : `You hold ${diamondsCount} Diamonds`,
        good: diamondsCount <= 2,
      };
    case 'tricks':
      return {
        badge: isAr
          ? `معك ${lowCardsCount} أوراق صغيرة آمنة`
          : `${lowCardsCount} low ducking cards`,
        good: lowCardsCount >= 6,
      };
    case 'trix':
      return {
        badge: isAr
          ? `معك ${jacks} أولاد (J) لفتح السلاسل`
          : `You hold ${jacks} Jacks (J)`,
        good: jacks >= 2,
      };
    case 'complex':
    default:
      return {
        badge: isAr ? 'كل العقوبات الأربع معاً' : 'All 4 penalties active',
        good: lowCardsCount >= 6,
      };
  }
}

function getLegalTrixDominoCards(
  hand: TrixCard[],
  lanes: Record<Suit, { low: number; high: number } | null>
): TrixCard[] {
  return hand.filter((c) => {
    const lane = lanes[c.suit];
    if (!lane) return c.rank === 11; // Jack opens suit
    return c.rank === lane.low - 1 || c.rank === lane.high + 1;
  });
}

function getLegalTrickCards(
  hand: TrixCard[],
  currentTrick: PlayedTrickCard[],
  contract: TrixContract,
  heartsBroken: boolean
): TrixCard[] {
  if (hand.length === 0) return [];
  if (currentTrick.length > 0) {
    const leadSuit = currentTrick[0].card.suit;
    const sameSuit = hand.filter((c) => c.suit === leadSuit);
    if (sameSuit.length > 0) return sameSuit;
    return hand;
  }

  if ((contract === 'king_of_hearts' || contract === 'complex') && !heartsBroken) {
    const nonHearts = hand.filter((c) => c.suit !== 'H');
    if (nonHearts.length > 0) return nonHearts;
  }
  return hand;
}

function getDoubleableCardsInHand(hand: TrixCard[], contract: TrixContract | null): TrixCard[] {
  if (!contract) return [];
  return hand.filter((c) => {
    if (c.id === 'KH' && (contract === 'complex' || contract === 'king_of_hearts')) return true;
    if (c.rank === 12 && (contract === 'complex' || contract === 'queens')) return true;
    return false;
  });
}

function chooseBotContract(hand: TrixCard[], remaining: TrixContract[]): TrixContract {
  if (remaining.length === 1) return remaining[0];
  const jacksAndLow = hand.filter((c) => c.rank === 11 || c.rank <= 5).length;
  if (remaining.includes('trix') && jacksAndLow >= 5) return 'trix';
  if (remaining.includes('king_of_hearts') && !hand.some((c) => c.id === 'KH' || c.id === 'AH')) {
    return 'king_of_hearts';
  }
  if (remaining.includes('queens') && hand.filter((c) => c.rank >= 12).length <= 2) {
    return 'queens';
  }
  if (remaining.includes('diamonds') && hand.filter((c) => c.suit === 'D').length <= 2) {
    return 'diamonds';
  }
  return remaining[0];
}

function chooseBotTrixDominoCard(
  hand: TrixCard[],
  legal: TrixCard[]
): TrixCard {
  let best = legal[0];
  let bestScore = -999;
  for (const c of legal) {
    const sameSuit = hand.filter((x) => x.suit === c.suit);
    const extremeWeight = sameSuit.reduce(
      (acc, x) => acc + Math.abs(x.rank - 8),
      0
    );
    const distanceWeight = Math.abs(c.rank - 11) * 3;
    const score = extremeWeight + distanceWeight;
    if (score > bestScore) {
      bestScore = score;
      best = c;
    }
  }
  return best;
}

function chooseBotTrickCard(
  legal: TrixCard[],
  currentTrick: PlayedTrickCard[],
  contract: TrixContract
): TrixCard {
  if (legal.length === 1) return legal[0];

  if (currentTrick.length === 0) {
    const sorted = [...legal].sort((a, b) => a.rank - b.rank);
    const nonKh = sorted.filter((c) => c.id !== 'KH');
    return nonKh[0] || sorted[0];
  }

  const leadSuit = currentTrick[0].card.suit;
  const highestInLead = Math.max(
    ...currentTrick.filter((p) => p.card.suit === leadSuit).map((p) => p.card.rank)
  );

  const followingSuit = legal[0].suit === leadSuit;
  if (followingSuit) {
    const duckCards = legal
      .filter((c) => c.rank < highestInLead)
      .sort((a, b) => b.rank - a.rank);
    if (duckCards.length > 0) return duckCards[0];
    const asc = [...legal].sort((a, b) => a.rank - b.rank);
    const withoutKh = asc.filter((c) => c.id !== 'KH');
    return withoutKh[0] || asc[0];
  }

  const kh = legal.find((c) => c.id === 'KH');
  if (kh && (contract === 'complex' || contract === 'king_of_hearts')) return kh;
  const queens = legal.filter((c) => c.rank === 12);
  if (queens.length > 0 && (contract === 'complex' || contract === 'queens')) return queens[0];
  const diamonds = legal
    .filter((c) => c.suit === 'D')
    .sort((a, b) => b.rank - a.rank);
  if (diamonds.length > 0 && (contract === 'complex' || contract === 'diamonds')) return diamonds[0];

  return [...legal].sort((a, b) => b.rank - a.rank)[0];
}

/* ============================================================================
 * MAIN TRIX ROYAL 5-KINGDOMS TABLETOP COMPONENT
 * ========================================================================== */
export const TrixGame: React.FC<TrixGameProps> = ({
  gameData,
  players,
  myPlayerId,
  isHost,
  isPassAndPlay,
  lang,
  onUpdateGameData,
}) => {
  const isAr = lang === 'ar';
  const [passAndPlayRevealed, setPassAndPlayRevealed] = useState<boolean>(!isPassAndPlay);
  const botTimerRef = useRef<number | null>(null);

  const seats = gameData.seats || [];

  const getSeatDisplayName = (seatIdx: number): string => {
    const s = seats[seatIdx];
    if (!s) return `Seat ${seatIdx + 1}`;
    if (s.isBot) {
      return isAr ? s.botNameAr || 'بوت' : s.botNameEn || 'Bot';
    }
    const found = players.find((p) => p.id === s.playerId);
    return found?.name || (isAr ? `لاعب ${seatIdx + 1}` : `Player ${seatIdx + 1}`);
  };

  const getSeatColor = (seatIdx: number): string => {
    const s = seats[seatIdx];
    if (!s) return '#ffca3a';
    if (!s.isBot) {
      const found = players.find((p) => p.id === s.playerId);
      if (found?.avatar_color) return found.avatar_color;
    }
    return BOT_PROFILES[seatIdx % BOT_PROFILES.length].color;
  };

  // Determine which seat is at the bottom perspective
  const viewerSeatIdx = useMemo(() => {
    if (isPassAndPlay) {
      if (gameData.phase === 'choose_contract' && !seats[gameData.kingdomOwnerSeat]?.isBot) {
        return gameData.kingdomOwnerSeat;
      }
      if (gameData.phase === 'doubling') {
        const pendingHuman = seats.find(
          (s) => !s.isBot && !gameData.doublingReadySeats.includes(s.seatIndex)
        );
        if (pendingHuman) return pendingHuman.seatIndex;
      }
      if (!seats[gameData.turnSeat]?.isBot) {
        return gameData.turnSeat;
      }
      const firstHuman = seats.find((s) => !s.isBot);
      return firstHuman ? firstHuman.seatIndex : 0;
    }
    const mySeat = seats.find((s) => s.playerId === myPlayerId);
    return mySeat ? mySeat.seatIndex : 0;
  }, [
    isPassAndPlay,
    seats,
    myPlayerId,
    gameData.phase,
    gameData.kingdomOwnerSeat,
    gameData.doublingReadySeats,
    gameData.turnSeat,
  ]);

  const humanCount = seats.filter((s) => !s.isBot).length;

  useEffect(() => {
    if (isPassAndPlay && humanCount > 1) {
      setPassAndPlayRevealed(false);
    } else {
      setPassAndPlayRevealed(true);
    }
  }, [viewerSeatIdx, isPassAndPlay, humanCount]);

  // Core Actions
  const handleSelectContract = (contract: TrixContract) => {
    const needsDoubling =
      contract === 'complex' || contract === 'king_of_hearts' || contract === 'queens';

    // In Trix Domino contract, the holder of 7 of Hearts (or kingdom owner if starting with J) leads; let's let Kingdom Owner or 7H lead if they hold a J, otherwise Kingdom Owner!
    const startTurnSeat = gameData.kingdomOwnerSeat;

    if (needsDoubling) {
      const nextDoubled: Record<string, number> = {};
      const autoReady: number[] = [];

      seats.forEach((s) => {
        const hand = gameData.hands[s.seatIndex] || [];
        const dblCards = getDoubleableCardsInHand(hand, contract);
        if (dblCards.length === 0) {
          autoReady.push(s.seatIndex);
        } else if (s.isBot) {
          dblCards.forEach((dc) => {
            const suitLen = hand.filter((x) => x.suit === dc.suit).length;
            if (suitLen >= 4) {
              nextDoubled[dc.id] = s.seatIndex;
            }
          });
          autoReady.push(s.seatIndex);
        }
      });

      const allReadyImmediately = autoReady.length >= 4;
      onUpdateGameData({
        ...gameData,
        activeContract: contract,
        doubledCards: nextDoubled,
        doublingReadySeats: autoReady,
        phase: allReadyImmediately ? 'playing' : 'doubling',
        turnSeat: startTurnSeat,
        trixLanes: { H: null, S: null, D: null, C: null },
        trixFinishOrder: [],
        currentTrick: [],
        heartsBroken: false,
        lastTrickWinnerSeat: null,
        queensEatenTotal: 0,
        kingOfHeartsEaten: false,
      });
    } else {
      onUpdateGameData({
        ...gameData,
        activeContract: contract,
        doubledCards: {},
        doublingReadySeats: [0, 1, 2, 3],
        phase: 'playing',
        turnSeat: startTurnSeat,
        trixLanes: { H: null, S: null, D: null, C: null },
        trixFinishOrder: [],
        currentTrick: [],
        heartsBroken: false,
        lastTrickWinnerSeat: null,
        queensEatenTotal: 0,
        kingOfHeartsEaten: false,
      });
    }
  };

  const handleToggleDoubleCard = (seatIdx: number, cardId: string) => {
    const nextDoubled = { ...(gameData.doubledCards || {}) };
    if (nextDoubled[cardId] === seatIdx) {
      delete nextDoubled[cardId];
    } else {
      nextDoubled[cardId] = seatIdx;
    }
    onUpdateGameData({
      ...gameData,
      doubledCards: nextDoubled,
    });
  };

  const handleConfirmDoublingSeat = (seatIdx: number) => {
    const nextReady = Array.from(new Set([...(gameData.doublingReadySeats || []), seatIdx]));
    const allReady = seats.every((s) => nextReady.includes(s.seatIndex));
    onUpdateGameData({
      ...gameData,
      doublingReadySeats: nextReady,
      phase: allReady ? 'playing' : 'doubling',
    });
  };

  const finalizeHandAndAdvance = (stateSnap: TrixGameState) => {
    const remainingAfter = stateSnap.remainingContracts.filter(
      (c) => c !== stateSnap.activeContract
    );
    const isMatchComplete =
      remainingAfter.length === 0 && stateSnap.kingdomNumber >= 4;

    const awards: Record<string, number> = {};
    let bestDelta = -9999;
    stateSnap.seats.forEach((s) => {
      if (s.handScore > bestDelta) bestDelta = s.handScore;
    });
    stateSnap.seats.forEach((s) => {
      if (!s.isBot && s.handScore === bestDelta && bestDelta > -50) {
        awards[s.playerId] = isMatchComplete ? 4 : 2;
      }
    });

    if (isMatchComplete) {
      confetti({ particleCount: 95, spread: 75, origin: { y: 0.6 } });
    }

    onUpdateGameData(
      {
        ...stateSnap,
        remainingContracts: remainingAfter,
        phase: isMatchComplete ? 'match_over' : 'hand_summary',
      },
      Object.keys(awards).length > 0 ? awards : undefined
    );
  };

  const handlePlayTrixDominoCard = (seatIdx: number, card: TrixCard) => {
    const curHand = gameData.hands[seatIdx] || [];
    const nextHand = curHand.filter((c) => c.id !== card.id);
    const nextHands = { ...gameData.hands, [seatIdx]: nextHand };

    const curLane = gameData.trixLanes[card.suit];
    const nextLane = !curLane
      ? { low: 11, high: 11 }
      : {
          low: Math.min(curLane.low, card.rank),
          high: Math.max(curLane.high, card.rank),
         };
    const nextLanes = { ...gameData.trixLanes, [card.suit]: nextLane };

    let nextFinish = [...gameData.trixFinishOrder];
    const nextSeats = gameData.seats.map((s) => ({ ...s }));
    const ptsTable = [200, 150, 100, 50];

    if (nextHand.length === 0 && !nextFinish.includes(seatIdx)) {
      const rankIdx = nextFinish.length;
      const earned = ptsTable[rankIdx] || 50;
      nextFinish.push(seatIdx);
      nextSeats[seatIdx].handScore += earned;
      nextSeats[seatIdx].totalScore += earned;
    }

    if (nextFinish.length >= 3) {
      const lastSeat = [0, 1, 2, 3].find((i) => !nextFinish.includes(i));
      if (typeof lastSeat === 'number') {
        nextFinish.push(lastSeat);
        nextSeats[lastSeat].handScore += 50;
        nextSeats[lastSeat].totalScore += 50;
      }
      finalizeHandAndAdvance({
        ...gameData,
        seats: nextSeats,
        hands: nextHands,
        trixLanes: nextLanes,
        trixFinishOrder: nextFinish,
      });
      return;
    }

    let nextTurn = (seatIdx + 1) % 4;
    for (let step = 0; step < 4; step++) {
      if ((nextHands[nextTurn] || []).length > 0) break;
      nextTurn = (nextTurn + 1) % 4;
    }

    onUpdateGameData({
      ...gameData,
      seats: nextSeats,
      hands: nextHands,
      trixLanes: nextLanes,
      trixFinishOrder: nextFinish,
      turnSeat: nextTurn,
    });
  };

  const handlePassTrixDominoTurn = (seatIdx: number) => {
    let nextTurn = (seatIdx + 1) % 4;
    for (let step = 0; step < 4; step++) {
      if ((gameData.hands[nextTurn] || []).length > 0) break;
      nextTurn = (nextTurn + 1) % 4;
    }
    onUpdateGameData({
      ...gameData,
      turnSeat: nextTurn,
    });
  };

  const handlePlayTrickCard = (seatIdx: number, card: TrixCard) => {
    const curHand = gameData.hands[seatIdx] || [];
    const nextHand = curHand.filter((c) => c.id !== card.id);
    const nextHands = { ...gameData.hands, [seatIdx]: nextHand };
    const nextTrick: PlayedTrickCard[] = [
      ...gameData.currentTrick,
      { seatIndex: seatIdx, card },
    ];
    const nextHeartsBroken = gameData.heartsBroken || card.suit === 'H';

    if (nextTrick.length < 4) {
      onUpdateGameData({
        ...gameData,
        hands: nextHands,
        currentTrick: nextTrick,
        heartsBroken: nextHeartsBroken,
        turnSeat: (seatIdx + 1) % 4,
      });
      return;
    }

    const leadSuit = nextTrick[0].card.suit;
    let winnerSeat = nextTrick[0].seatIndex;
    let highestRank = nextTrick[0].card.rank;
    for (const pc of nextTrick) {
      if (pc.card.suit === leadSuit && pc.card.rank > highestRank) {
        highestRank = pc.card.rank;
        winnerSeat = pc.seatIndex;
      }
    }

    const contract = gameData.activeContract || 'king_of_hearts';
    const nextSeats = gameData.seats.map((s) => ({
      ...s,
      queensEaten: [...s.queensEaten],
    }));

    let trickDeltaWinner = 0;
    const bonusBySeat: Record<number, number> = {};
    const notesAr: string[] = [];
    const notesEn: string[] = [];
    let ateKhNow = false;
    let queensNow = 0;

    if (contract === 'complex' || contract === 'tricks') {
      trickDeltaWinner -= 15;
      nextSeats[winnerSeat].tricksWon += 1;
      if (contract === 'tricks') {
        notesAr.push('-15 أكلة');
        notesEn.push('-15 Trick');
      }
    }

    if (contract === 'complex' || contract === 'diamonds') {
      const dCount = nextTrick.filter((p) => p.card.suit === 'D').length;
      if (dCount > 0) {
        trickDeltaWinner -= dCount * 10;
        nextSeats[winnerSeat].diamondsEaten += dCount;
        notesAr.push(`${-dCount * 10} ديناري`);
        notesEn.push(`${-dCount * 10} Diamonds`);
      }
    }

    if (contract === 'complex' || contract === 'queens') {
      const qCards = nextTrick.filter((p) => p.card.rank === 12);
      for (const qc of qCards) {
        queensNow += 1;
        nextSeats[winnerSeat].queensEaten.push(qc.card.id);
        const doubler = gameData.doubledCards[qc.card.id];
        if (typeof doubler === 'number') {
          trickDeltaWinner -= 50;
          notesAr.push('-50 بنت مدبّلة!');
          notesEn.push('-50 Doubled Queen!');
          if (doubler !== winnerSeat) {
            bonusBySeat[doubler] = (bonusBySeat[doubler] || 0) + 25;
          }
        } else {
          trickDeltaWinner -= 25;
          notesAr.push('-25 بنت');
          notesEn.push('-25 Queen');
        }
      }
    }

    if (contract === 'complex' || contract === 'king_of_hearts') {
      const hasKh = nextTrick.some((p) => p.card.id === 'KH');
      if (hasKh) {
        ateKhNow = true;
        nextSeats[winnerSeat].ateKingOfHearts = true;
        const doubler = gameData.doubledCards['KH'];
        if (typeof doubler === 'number') {
          trickDeltaWinner -= 150;
          notesAr.push('-150 شيخ الكبة مدبّل!!');
          notesEn.push('-150 DOUBLED KING!!');
          if (doubler !== winnerSeat) {
            bonusBySeat[doubler] = (bonusBySeat[doubler] || 0) + 75;
          }
        } else {
          trickDeltaWinner -= 75;
          notesAr.push('-75 شيخ الكبة!');
          notesEn.push('-75 King of Hearts!');
        }
      }
    }

    nextSeats[winnerSeat].handScore += trickDeltaWinner;
    nextSeats[winnerSeat].totalScore += trickDeltaWinner;

    Object.entries(bonusBySeat).forEach(([sIdxStr, bonus]) => {
      const idx = Number(sIdxStr);
      nextSeats[idx].handScore += bonus;
      nextSeats[idx].totalScore += bonus;
    });

    const winnerNameAr = seats[winnerSeat]?.isBot
      ? seats[winnerSeat].botNameAr
      : players.find((p) => p.id === seats[winnerSeat]?.playerId)?.name || 'لاعب';
    const winnerNameEn = seats[winnerSeat]?.isBot
      ? seats[winnerSeat].botNameEn
      : players.find((p) => p.id === seats[winnerSeat]?.playerId)?.name || 'Player';

    const msgAr =
      notesAr.length > 0
        ? `${winnerNameAr} أكل اللطشة (${notesAr.join(' ، ')})!`
        : `${winnerNameAr} أخذ الأكلة بسلام!`;
    const msgEn =
      notesEn.length > 0
        ? `${winnerNameEn} took the trick (${notesEn.join(', ')})!`
        : `${winnerNameEn} won a clean trick!`;

    onUpdateGameData({
      ...gameData,
      seats: nextSeats,
      hands: nextHands,
      currentTrick: nextTrick,
      heartsBroken: nextHeartsBroken,
      phase: 'trick_pause',
      lastTrickWinnerSeat: winnerSeat,
      lastTrickMessageAr: msgAr,
      lastTrickMessageEn: msgEn,
      turnSeat: winnerSeat,
      queensEatenTotal: (gameData.queensEatenTotal || 0) + queensNow,
      kingOfHeartsEaten: gameData.kingOfHeartsEaten || ateKhNow,
    });
  };

  const handleSweepCompletedTrick = () => {
    const contract = gameData.activeContract || 'king_of_hearts';
    const allCardsGone = [0, 1, 2, 3].every(
      (idx) => (gameData.hands[idx] || []).length === 0
    );
    const earlyEndKh = contract === 'king_of_hearts' && gameData.kingOfHeartsEaten;
    const earlyEndQueens = contract === 'queens' && gameData.queensEatenTotal >= 4;

    if (allCardsGone || earlyEndKh || earlyEndQueens) {
      finalizeHandAndAdvance({
        ...gameData,
        currentTrick: [],
      });
      return;
    }

    onUpdateGameData({
      ...gameData,
      phase: 'playing',
      currentTrick: [],
      turnSeat:
        typeof gameData.lastTrickWinnerSeat === 'number'
          ? gameData.lastTrickWinnerSeat
          : gameData.turnSeat,
    });
  };

  const handleDealNextContractOrKingdom = () => {
    const { hands } = dealFourHands();
    const resetSeats = gameData.seats.map((s) => ({
      ...s,
      handScore: 0,
      tricksWon: 0,
      diamondsEaten: 0,
      queensEaten: [],
      ateKingOfHearts: false,
    }));

    let nextOwner = gameData.kingdomOwnerSeat;
    let nextKingdomNum = gameData.kingdomNumber;
    let nextRemaining = [...gameData.remainingContracts];

    if (nextRemaining.length === 0) {
      nextOwner = (gameData.kingdomOwnerSeat + 1) % 4;
      nextKingdomNum = gameData.kingdomNumber + 1;
      nextRemaining = contractsForMode(gameData.mode);
    }

    onUpdateGameData({
      ...gameData,
      seats: resetSeats,
      phase: 'choose_contract',
      kingdomNumber: nextKingdomNum,
      kingdomOwnerSeat: nextOwner,
      remainingContracts: nextRemaining,
      activeContract: null,
      hands,
      doubledCards: {},
      doublingReadySeats: [],
      turnSeat: nextOwner,
      trixLanes: { H: null, S: null, D: null, C: null },
      trixFinishOrder: [],
      currentTrick: [],
      heartsBroken: false,
      lastTrickWinnerSeat: null,
      queensEatenTotal: 0,
      kingOfHeartsEaten: false,
    });
  };

  // Switch directly to a specific player's Kingdom (1..4) with all 5 contracts fresh!
  const handleJumpToKingdom = (targetSeat: number) => {
    const { hands } = dealFourHands();
    const resetSeats = gameData.seats.map((s) => ({
      ...s,
      handScore: 0,
      tricksWon: 0,
      diamondsEaten: 0,
      queensEaten: [],
      ateKingOfHearts: false,
    }));
    onUpdateGameData({
      ...gameData,
      seats: resetSeats,
      phase: 'choose_contract',
      kingdomNumber: targetSeat + 1,
      kingdomOwnerSeat: targetSeat,
      remainingContracts: contractsForMode(gameData.mode),
      activeContract: null,
      hands,
      doubledCards: {},
      doublingReadySeats: [],
      turnSeat: targetSeat,
      trixLanes: { H: null, S: null, D: null, C: null },
      trixFinishOrder: [],
      currentTrick: [],
      heartsBroken: false,
      lastTrickWinnerSeat: null,
      queensEatenTotal: 0,
      kingOfHeartsEaten: false,
    });
  };

  const handleRestartMatch = (
    nextMode: 'kingdoms' | 'complex' = 'kingdoms',
    nextPartners: boolean = gameData.partnership
  ) => {
    const pIds = players.map((p) => p.id);
    onUpdateGameData(buildInitialTrixState(pIds, nextMode, nextPartners));
  };

  const shouldDriveAutomation = isHost || isPassAndPlay;

  useEffect(() => {
    if (!shouldDriveAutomation) return;
    if (botTimerRef.current) {
      window.clearTimeout(botTimerRef.current);
      botTimerRef.current = null;
    }

    if (gameData.phase === 'choose_contract') {
      const owner = seats[gameData.kingdomOwnerSeat];
      if (owner?.isBot) {
        botTimerRef.current = window.setTimeout(() => {
          const hand = gameData.hands[owner.seatIndex] || [];
          const picked = chooseBotContract(hand, gameData.remainingContracts);
          handleSelectContract(picked);
        }, 700);
      }
    } else if (gameData.phase === 'trick_pause') {
      botTimerRef.current = window.setTimeout(() => {
        handleSweepCompletedTrick();
      }, 1150);
    } else if (gameData.phase === 'playing') {
      const activeSeat = seats[gameData.turnSeat];
      if (activeSeat?.isBot) {
        botTimerRef.current = window.setTimeout(() => {
          const botHand = gameData.hands[activeSeat.seatIndex] || [];
          if (gameData.activeContract === 'trix') {
            const legal = getLegalTrixDominoCards(botHand, gameData.trixLanes);
            if (legal.length === 0) {
              handlePassTrixDominoTurn(activeSeat.seatIndex);
            } else {
              const chosen = chooseBotTrixDominoCard(botHand, legal);
              handlePlayTrixDominoCard(activeSeat.seatIndex, chosen);
            }
          } else {
            const legal = getLegalTrickCards(
              botHand,
              gameData.currentTrick,
              gameData.activeContract || 'king_of_hearts',
              gameData.heartsBroken
            );
            if (legal.length > 0) {
              const chosen = chooseBotTrickCard(
                legal,
                gameData.currentTrick,
                gameData.activeContract || 'king_of_hearts'
              );
              handlePlayTrickCard(activeSeat.seatIndex, chosen);
            }
          }
        }, 620);
      }
    }

    return () => {
      if (botTimerRef.current) {
        window.clearTimeout(botTimerRef.current);
      }
    };
  });

  // Compute Viewer Hand & Legal Moves
  const viewerSeat = seats[viewerSeatIdx];
  const viewerHand = gameData.hands[viewerSeatIdx] || [];
  const isViewerTurn =
    gameData.phase === 'playing' &&
    gameData.turnSeat === viewerSeatIdx &&
    !viewerSeat?.isBot;

  const viewerLegalIds = useMemo(() => {
    if (!isViewerTurn) return new Set<string>();
    const list =
      gameData.activeContract === 'trix'
        ? getLegalTrixDominoCards(viewerHand, gameData.trixLanes)
        : getLegalTrickCards(
            viewerHand,
            gameData.currentTrick,
            gameData.activeContract || 'king_of_hearts',
            gameData.heartsBroken
          );
    return new Set(list.map((c) => c.id));
  }, [
    isViewerTurn,
    gameData.activeContract,
    viewerHand,
    gameData.trixLanes,
    gameData.currentTrick,
    gameData.heartsBroken,
  ]);

  // Relative compass seats around the table from viewerSeatIdx
  const southSeat = viewerSeatIdx;
  const eastSeat = (viewerSeatIdx + 1) % 4;
  const northSeat = (viewerSeatIdx + 2) % 4;
  const westSeat = (viewerSeatIdx + 3) % 4;

  const teamAScore = (seats[0]?.totalScore || 0) + (seats[2]?.totalScore || 0);
  const teamBScore = (seats[1]?.totalScore || 0) + (seats[3]?.totalScore || 0);

  const allModeContracts = contractsForMode(gameData.mode);

  // Render opponent seat card with penalty counters
  const renderOpponentSeatBox = (seatIdx: number, vertical = false) => {
    const s = seats[seatIdx];
    if (!s) return null;
    const isTurn =
      gameData.phase === 'playing' && gameData.turnSeat === seatIdx;
    const isOwner = gameData.kingdomOwnerSeat === seatIdx;
    const name = getSeatDisplayName(seatIdx);
    const col = getSeatColor(seatIdx);
    const handCount = (gameData.hands[seatIdx] || []).length;
    const finishRank = gameData.trixFinishOrder.indexOf(seatIdx);

    return (
      <div
        className={`rounded-2xl border-3 border-[#161426] p-2.5 sm:p-3 transition-all ${
          isTurn
            ? 'bg-[#ffca3a] text-[#161426] shadow-[0_5px_0_#161426] ring-3 ring-white scale-[1.03]'
            : 'bg-[#11261d]/90 text-white shadow-[0_4px_0_#0b1a13]'
        } flex ${
          vertical ? 'flex-col items-center text-center gap-2' : 'items-center justify-between gap-3'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <div
            style={{ backgroundColor: col }}
            className="w-10 h-10 rounded-2xl border-2 border-[#161426] flex items-center justify-center font-black text-sm text-[#161426] shrink-0 shadow-[0_2px_0_#161426]"
          >
            {s.isBot ? <Robot weight="fill" className="w-5 h-5" /> : name.slice(0, 1)}
          </div>
          <div className="min-w-0 text-start">
            <div className="font-black text-xs sm:text-sm truncate flex items-center gap-1">
              <span className="truncate">{name}</span>
              {isOwner && (
                <Crown
                  weight="fill"
                  className={`w-4 h-4 shrink-0 ${
                    isTurn ? 'text-[#161426]' : 'text-[#ffca3a]'
                  }`}
                />
              )}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span
                dir="ltr"
                className={`px-2 py-0.2 rounded-full text-xs font-black border border-[#161426] ${
                  s.totalScore >= 0
                    ? 'bg-[#8ac926] text-[#161426]'
                    : 'bg-[#ff595e] text-white'
                }`}
              >
                {s.totalScore > 0 ? `+${s.totalScore}` : s.totalScore}
              </span>
              <span className="text-[11px] font-extrabold opacity-80">
                {isAr ? `${handCount} ورقة` : `${handCount} cards`}
              </span>
            </div>
          </div>
        </div>

        {/* Opponent Fanned Card Backs */}
        <OpponentCardBacksFan count={handCount} vertical={vertical} />

        {/* Live Eaten Penalties / Trix Rank Badges */}
        <div className="flex flex-wrap items-center justify-center gap-1">
          {finishRank !== -1 && (
            <span className="px-2 py-0.5 rounded-lg bg-[#8ac926] text-[#161426] text-xs font-black border border-[#161426]">
              #{finishRank + 1}
            </span>
          )}
          {s.ateKingOfHearts && (
            <span className="px-2 py-0.5 rounded-lg bg-[#e63946] text-white text-[11px] font-black border border-[#161426] inline-flex items-center gap-1">
              <span>K</span>
              <SuitVectorSvg suit="H" className="w-3 h-3" />
              <span>-75</span>
            </span>
          )}
          {s.queensEaten.length > 0 && (
            <span className="px-2 py-0.5 rounded-lg bg-[#9b5de5] text-white text-[11px] font-black border border-[#161426]">
              Q×{s.queensEaten.length}
            </span>
          )}
          {s.diamondsEaten > 0 && (
            <span className="px-2 py-0.5 rounded-lg bg-[#ff924c] text-[#161426] text-[11px] font-black border border-[#161426] inline-flex items-center gap-0.5">
              <SuitVectorSvg suit="D" className="w-3 h-3" />
              <span>×{s.diamondsEaten}</span>
            </span>
          )}
          {s.tricksWon > 0 && (
            <span className="px-2 py-0.5 rounded-lg bg-[#00bbf9] text-[#161426] text-[11px] font-black border border-[#161426]">
              {isAr ? `أكلات: ${s.tricksWon}` : `Tricks: ${s.tricksWon}`}
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full space-y-4 select-none [overflow-anchor:none]">
      {/* TOP BAR: 4 KINGDOMS & 5 CONTRACTS TRACKER + MODE SWITCHER */}
      <div className="cartoon-card bg-[#fffbeb] p-4 sm:p-5 space-y-3.5 border-4 border-[#161426]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#ffca3a] border-3 border-[#161426] shadow-[0_4px_0_#161426] flex items-center justify-center shrink-0">
              <Crown weight="fill" className="w-7 h-7 text-[#161426]" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-[#161426] leading-tight">
                {isAr
                  ? 'تركس الملوك — نظام الممالك الخمس الكامل'
                  : 'Trix Royal — Full 5-Kingdoms Championship'}
              </h2>
              <p className="text-xs sm:text-sm font-extrabold text-[#78350f]">
                {isAr
                  ? `المملكة الحالية (${gameData.kingdomNumber} من 4): مملكة ${getSeatDisplayName(
                      gameData.kingdomOwnerSeat
                    )} — باقي ${gameData.remainingContracts.length} من ${allModeContracts.length} عقود`
                  : `Kingdom ${gameData.kingdomNumber}/4: ${getSeatDisplayName(
                      gameData.kingdomOwnerSeat
                    )} — ${gameData.remainingContracts.length}/${allModeContracts.length} contracts left`}
              </p>
            </div>
          </div>

          {/* Mode & Partnership Controls for Host */}
          {(isHost || isPassAndPlay) && (
            <div className="flex flex-wrap items-center gap-2">
              {/* Explicit 5 Kingdoms vs Complex Segmented Toggle */}
              <div className="inline-flex rounded-xl border-3 border-[#161426] bg-[#161426] p-0.5 shadow-[0_3px_0_#161426]">
                <button
                  type="button"
                  onClick={() => handleRestartMatch('kingdoms', gameData.partnership)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black transition ${
                    gameData.mode === 'kingdoms'
                      ? 'bg-[#ffca3a] text-[#161426]'
                      : 'text-white hover:text-[#ffca3a]'
                  }`}
                >
                  {isAr ? 'الممالك الـ 5 (الأصلية)' : '5 Kingdoms (Classic)'}
                </button>
                <button
                  type="button"
                  onClick={() => handleRestartMatch('complex', gameData.partnership)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black transition ${
                    gameData.mode === 'complex'
                      ? 'bg-[#ff595e] text-white'
                      : 'text-white hover:text-[#ffca3a]'
                  }`}
                >
                  {isAr ? 'كومبلكس' : 'Complex'}
                </button>
              </div>

              <button
                type="button"
                onClick={() => handleRestartMatch(gameData.mode, !gameData.partnership)}
                className={`cartoon-btn px-3.5 py-2 text-xs font-black flex items-center gap-1.5 ${
                  gameData.partnership
                    ? 'bg-[#00bbf9] text-[#161426]'
                    : 'bg-white text-[#161426]'
                }`}
              >
                <Users weight="fill" className="w-4 h-4" />
                <span>
                  {gameData.partnership
                    ? isAr
                      ? 'شراكة 2 ضد 2'
                      : 'Partners 2v2'
                    : isAr
                    ? 'لعب فردي'
                    : 'Solo Play'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleRestartMatch(gameData.mode, gameData.partnership)}
                className="cartoon-btn bg-white text-[#161426] px-3.5 py-2 text-xs font-black flex items-center gap-1.5"
              >
                <ArrowsClockwise weight="bold" className="w-4 h-4" />
                <span>{isAr ? 'توزيع جديد' : 'Redeal'}</span>
              </button>
            </div>
          )}
        </div>

        {/* 4 KINGDOMS TABS + 5 CONTRACTS STATUS STRIP */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 pt-2 border-t-2 border-[#161426]/15 items-center">
          {/* 4 Player Kingdoms Switcher */}
          <div className="lg:col-span-5 flex flex-wrap items-center gap-1.5">
            {[0, 1, 2, 3].map((sIdx) => {
              const isCurrentKing = gameData.kingdomOwnerSeat === sIdx;
              const sName = getSeatDisplayName(sIdx);
              return (
                <button
                  key={sIdx}
                  type="button"
                  disabled={!isHost && !isPassAndPlay}
                  onClick={() => handleJumpToKingdom(sIdx)}
                  className={`px-3 py-1.5 rounded-xl border-2 border-[#161426] text-xs font-black flex items-center gap-1.5 transition ${
                    isCurrentKing
                      ? 'bg-[#ffca3a] text-[#161426] shadow-[0_3px_0_#161426] -translate-y-0.5'
                      : 'bg-white text-[#161426]/75 hover:bg-[#fef3c7]'
                  }`}
                >
                  <Crown
                    weight="fill"
                    className={`w-3.5 h-3.5 ${
                      isCurrentKing ? 'text-[#d97706]' : 'text-[#94a3b8]'
                    }`}
                  />
                  <span>
                    {isAr ? `مملكة ${sIdx + 1}: ${sName}` : `K${sIdx + 1}: ${sName}`}
                  </span>
                </button>
              );
            })}
          </div>

          {/* The 5 Contracts of the Active Kingdom */}
          <div className="lg:col-span-7 flex flex-wrap items-center justify-end gap-1.5">
            {allModeContracts.map((ct) => {
              const meta = CONTRACT_META[ct];
              const isCompleted = !gameData.remainingContracts.includes(ct);
              const isActive = gameData.activeContract === ct;
              const canPickNow =
                gameData.phase === 'choose_contract' &&
                !isCompleted &&
                !seats[gameData.kingdomOwnerSeat]?.isBot &&
                (isPassAndPlay ||
                  seats[gameData.kingdomOwnerSeat]?.playerId === myPlayerId);

              return (
                <button
                  key={ct}
                  type="button"
                  disabled={!canPickNow}
                  onClick={() => canPickNow && handleSelectContract(ct)}
                  style={{
                    backgroundColor: isActive
                      ? meta.accent
                      : isCompleted
                      ? '#e2e8f0'
                      : '#161426',
                  }}
                  className={`px-3 py-1.5 rounded-xl border-2 border-[#161426] text-xs font-black flex items-center gap-1.5 transition ${
                    isActive
                      ? 'text-white ring-3 ring-[#ffca3a] shadow-[0_3px_0_#161426] scale-105'
                      : isCompleted
                      ? 'text-[#64748b] line-through opacity-65'
                      : canPickNow
                      ? 'text-white hover:scale-105 cursor-pointer shadow-[0_3px_0_#161426]'
                      : 'text-white'
                  }`}
                >
                  {isCompleted && <CheckCircle weight="fill" className="w-3.5 h-3.5 text-[#8ac926]" />}
                  {isActive && <Flame weight="fill" className="w-3.5 h-3.5 text-[#ffca3a]" />}
                  <span>{isAr ? meta.shortAr : meta.shortEn}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* PARTNERSHIP SCORE BANNER (When 2v2 Active) */}
      {gameData.partnership && (
        <div className="grid grid-cols-2 gap-3">
          <div className="cartoon-badge bg-[#fde68a] text-[#161426] px-4 py-2 text-sm flex items-center justify-between">
            <span>
              {isAr
                ? `الفريق الأول (${getSeatDisplayName(0)} + ${getSeatDisplayName(2)})`
                : `Team 1 (${getSeatDisplayName(0)} & ${getSeatDisplayName(2)})`}
            </span>
            <span dir="ltr" className="font-black text-base">
              {teamAScore}
            </span>
          </div>
          <div className="cartoon-badge bg-[#bae6fd] text-[#161426] px-4 py-2 text-sm flex items-center justify-between">
            <span>
              {isAr
                ? `الفريق الثاني (${getSeatDisplayName(1)} + ${getSeatDisplayName(3)})`
                : `Team 2 (${getSeatDisplayName(1)} & ${getSeatDisplayName(3)})`}
            </span>
            <span dir="ltr" className="font-black text-base">
              {teamBScore}
            </span>
          </div>
        </div>
      )}

      {/* MASSIVE ROYAL DAMASCENE EMERALD FELT TABLE STAGE */}
      <div className="rounded-[32px] border-4 border-[#161426] shadow-[0_10px_0_#161426] bg-[radial-gradient(circle_at_center,#1f5c43_0%,#133b2b_68%,#0c261c_100%)] p-3 sm:p-6 text-white space-y-5 relative overflow-hidden min-h-[700px] flex flex-col justify-between">
        {/* Decorative Gold Inner Felt Trim */}
        <div className="pointer-events-none absolute inset-3 rounded-[24px] border-2 border-[#ffca3a]/25" />

        {/* NORTH OPPONENT SEAT (TOP OF TABLE) */}
        <div className="relative z-10 max-w-xl mx-auto w-full">
          {renderOpponentSeatBox(northSeat, false)}
        </div>

        {/* MIDDLE ARENA: WEST SEAT + CENTER FELT STAGE + EAST SEAT */}
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-4 items-center my-auto">
          {/* WEST SEAT */}
          <div className="lg:col-span-2 order-2 lg:order-1">
            {renderOpponentSeatBox(westSeat, true)}
          </div>

          {/* CENTER FELT STAGE (8 COLUMNS) */}
          <div className="lg:col-span-8 order-1 lg:order-2">
            {/* PHASE 1: CHOOSE ONE OF THE 5 KINGDOM CONTRACTS */}
            {gameData.phase === 'choose_contract' && (
              <div className="bg-[#0f1f18]/92 border-3 border-[#ffca3a] rounded-3xl p-4 sm:p-6 space-y-4 shadow-2xl">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/15 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="cartoon-badge bg-[#ffca3a] text-[#161426] px-3.5 py-1 text-xs sm:text-sm font-black flex items-center gap-1.5">
                      <Crown weight="fill" className="w-4 h-4" />
                      <span>
                        {isAr
                          ? `ديوان مملكة ${getSeatDisplayName(gameData.kingdomOwnerSeat)} (${
                              gameData.kingdomNumber
                            }/4)`
                          : `${getSeatDisplayName(gameData.kingdomOwnerSeat)}'s Kingdom (${
                              gameData.kingdomNumber
                            }/4)`}
                      </span>
                    </span>
                  </div>
                  <span className="text-xs sm:text-sm font-extrabold text-[#ffca3a]">
                    {isAr
                      ? 'افحص أوراق يدك الـ 13 بالأسفل ثم اختر العقد الأنسب:'
                      : 'Inspect your 13 cards below and pick a contract:'}
                  </span>
                </div>

                {seats[gameData.kingdomOwnerSeat]?.isBot ? (
                  <div className="py-8 text-center space-y-3">
                    <Robot weight="fill" className="w-12 h-12 text-[#ffca3a] mx-auto animate-bounce" />
                    <p className="text-lg font-black text-[#ffca3a]">
                      {isAr
                        ? `${getSeatDisplayName(gameData.kingdomOwnerSeat)} يفحص أوراقه ويختار عقد المملكة...`
                        : `${getSeatDisplayName(gameData.kingdomOwnerSeat)} is choosing a contract...`}
                    </p>
                  </div>
                ) : isPassAndPlay ||
                  seats[gameData.kingdomOwnerSeat]?.playerId === myPlayerId ? (
                  <div
                    className={`grid grid-cols-1 sm:grid-cols-2 ${
                      allModeContracts.length === 5
                        ? 'xl:grid-cols-5'
                        : 'xl:grid-cols-2'
                    } gap-2.5`}
                  >
                    {allModeContracts.map((ct) => {
                      const meta = CONTRACT_META[ct];
                      const isAvailable = gameData.remainingContracts.includes(ct);
                      const hint = getContractHintForHand(viewerHand, ct, isAr);

                      return (
                        <button
                          key={ct}
                          type="button"
                          disabled={!isAvailable}
                          onClick={() => handleSelectContract(ct)}
                          className={`rounded-2xl border-3 border-[#161426] p-3.5 text-start transition-all flex flex-col justify-between gap-2.5 ${
                            isAvailable
                              ? 'bg-[#fffdf7] text-[#161426] hover:-translate-y-1.5 shadow-[0_6px_0_#161426] cursor-pointer hover:ring-3 hover:ring-[#ffca3a]'
                              : 'bg-gray-800/60 text-white/40 opacity-50 cursor-not-allowed'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <ContractEmblemSvg contract={ct} />
                            <span
                              style={{ backgroundColor: meta.accent }}
                              className="px-2.5 py-0.5 rounded-full text-[11px] font-black text-white border-2 border-[#161426] shadow-[0_2px_0_#161426]"
                            >
                              {isAr ? meta.ptsBadgeAr : meta.ptsBadgeEn}
                            </span>
                          </div>

                          <div>
                            <div className="font-black text-base sm:text-lg text-[#161426] flex items-center justify-between">
                              <span>{isAr ? meta.ar : meta.en}</span>
                              {!isAvailable && (
                                <span className="text-xs text-[#8ac926]">
                                  {isAr ? '✓ لُعبت' : '✓ Played'}
                                </span>
                              )}
                            </div>
                            <p className="text-xs font-bold text-[#3f3b5c] mt-0.5 leading-snug">
                              {isAr ? meta.descAr : meta.descEn}
                            </p>
                          </div>

                          {isAvailable && (
                            <div
                              className={`rounded-xl px-2.5 py-1 text-[11px] font-black border border-[#161426]/20 flex items-center justify-between ${
                                hint.good
                                  ? 'bg-[#ecfccb] text-[#161426]'
                                  : 'bg-[#f1f5f9] text-[#475569]'
                              }`}
                            >
                              <span>{hint.badge}</span>
                              <Play weight="fill" className="w-3.5 h-3.5 shrink-0" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="py-8 text-center text-lg font-black text-[#ffca3a]">
                    {isAr
                      ? `بانتظار (${getSeatDisplayName(
                          gameData.kingdomOwnerSeat
                        )}) ليختار عقد المملكة...`
                      : `Waiting for ${getSeatDisplayName(
                          gameData.kingdomOwnerSeat
                        )} to pick a contract...`}
                  </p>
                )}
              </div>
            )}

            {/* PHASE 2: DOUBLING WINDOW (تدبيل شيخ الكبة والبنات!) */}
            {gameData.phase === 'doubling' && (
              <div className="bg-[#161426]/95 border-3 border-[#ff595e] rounded-3xl p-6 text-center space-y-4 shadow-2xl">
                <div className="inline-flex items-center gap-2 cartoon-badge bg-[#ff595e] text-white px-4 py-1.5 text-sm font-black">
                  <Flame weight="fill" className="w-5 h-5 text-[#ffca3a]" />
                  <span>
                    {isAr
                      ? 'فرصة التدبيل (×2) قبل بدء اللعب!'
                      : 'Doubling Window (x2) Before Play!'}
                  </span>
                </div>

                {!viewerSeat?.isBot &&
                !gameData.doublingReadySeats.includes(viewerSeatIdx) ? (
                  <div className="space-y-4">
                    <p className="text-base sm:text-lg font-extrabold text-[#fff9ec]">
                      {isAr
                        ? `يا (${getSeatDisplayName(
                            viewerSeatIdx
                          )})، معك أوراق قابلة للتدبيل! إذا دبّلتها وأكلها خصمك يتضاعف العقاب عليه وتكسب مكافأة فورية:`
                        : `${getSeatDisplayName(
                            viewerSeatIdx
                          )}, double your King of Hearts / Queens for x2 damage & bonus?`}
                    </p>

                    <div className="flex flex-wrap items-center justify-center gap-3">
                      {getDoubleableCardsInHand(viewerHand, gameData.activeContract).map(
                        (dc) => {
                          const isDbl = gameData.doubledCards[dc.id] === viewerSeatIdx;
                          return (
                            <button
                              key={dc.id}
                              type="button"
                              onClick={() => handleToggleDoubleCard(viewerSeatIdx, dc.id)}
                              className={`cartoon-btn px-5 py-3 text-base font-black flex items-center gap-2.5 ${
                                isDbl
                                  ? 'bg-[#ff595e] text-white ring-3 ring-[#ffca3a]'
                                  : 'bg-white text-[#161426]'
                              }`}
                            >
                              <SuitVectorSvg suit={dc.suit} className="w-5 h-5" />
                              <span>
                                {dc.id === 'KH'
                                  ? isAr
                                    ? 'شيخ الكبة'
                                    : 'King of Hearts'
                                  : `${rankLabel(dc.rank)}`}
                              </span>
                              <span className="cartoon-badge bg-[#ffca3a] text-[#161426] px-2.5 py-0.5 text-xs">
                                {isDbl
                                  ? isAr
                                    ? 'مدبّل ×2!'
                                    : 'DOUBLED!'
                                  : isAr
                                  ? 'دبّل ×2'
                                  : 'Double x2'}
                              </span>
                            </button>
                          );
                        }
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleConfirmDoublingSeat(viewerSeatIdx)}
                      className="cartoon-btn bg-[#8ac926] text-[#161426] px-8 py-3 text-lg font-black inline-flex items-center gap-2"
                    >
                      <CheckCircle weight="fill" className="w-6 h-6" />
                      <span>{isAr ? 'اعتمد وبلّش اللعب!' : 'Confirm & Start Hand!'}</span>
                    </button>
                  </div>
                ) : (
                  <p className="text-base font-extrabold text-[#ffca3a] animate-pulse">
                    {isAr
                      ? 'بانتظار باقي اللاعبين لإنهاء قرار التدبيل...'
                      : 'Waiting for other players to confirm doubling...'}
                  </p>
                )}
              </div>
            )}

            {/* PHASE 3: ACTIVE TABLE CENTER (VISUAL TRIX SUIT COLUMNS OR 4-COMPASS TRICK CARPET) */}
            {(gameData.phase === 'playing' || gameData.phase === 'trick_pause') && (
              <div className="space-y-3">
                {/* Active Contract & Turn Status Banner */}
                <div className="flex flex-wrap items-center justify-between gap-2 bg-[#0d2118]/90 border-2 border-[#ffca3a]/40 rounded-2xl px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    {gameData.activeContract && (
                      <span
                        style={{
                          backgroundColor: CONTRACT_META[gameData.activeContract].accent,
                        }}
                        className="px-3 py-1 rounded-xl font-black text-xs sm:text-sm text-white border-2 border-[#161426]"
                      >
                        {isAr
                          ? CONTRACT_META[gameData.activeContract].ar
                          : CONTRACT_META[gameData.activeContract].en}
                      </span>
                    )}
                    {Object.keys(gameData.doubledCards || {}).length > 0 && (
                      <span className="px-2.5 py-1 rounded-xl bg-[#ff595e] text-white text-xs font-black border-2 border-[#161426]">
                        {isAr
                          ? `مدبّل ×2: ${Object.keys(gameData.doubledCards).join(' + ')}`
                          : `Doubled x2: ${Object.keys(gameData.doubledCards).join(' + ')}`}
                      </span>
                    )}
                  </div>

                  <div className="text-xs sm:text-sm font-black text-[#ffca3a]">
                    {gameData.phase === 'trick_pause'
                      ? isAr
                        ? gameData.lastTrickMessageAr
                        : gameData.lastTrickMessageEn
                      : isAr
                      ? `الدور الآن عند: ${getSeatDisplayName(gameData.turnSeat)}`
                      : `Active Turn: ${getSeatDisplayName(gameData.turnSeat)}`}
                  </div>
                </div>

                {gameData.activeContract === 'trix' ? (
                  /* 4 FULL VISUAL SUIT COLUMNS ON THE FELT (A .. J .. 2) */
                  <div className="grid grid-cols-4 gap-2.5 sm:gap-4 bg-[#0d241a]/80 rounded-3xl p-3 sm:p-4 border-2 border-white/15">
                    {SUIT_ORDER.map((suit) => {
                      const lane = gameData.trixLanes[suit];
                      const nextUp = lane && lane.high < 14 ? lane.high + 1 : null;
                      const nextDown = lane && lane.low > 2 ? lane.low - 1 : null;

                      return (
                        <div
                          key={suit}
                          className="rounded-2xl border-3 border-[#161426] bg-[#143326] p-2.5 sm:p-3 flex flex-col items-center justify-between min-h-[250px] shadow-inner"
                        >
                          {/* Suit Column Header */}
                          <div className="w-full flex items-center justify-between border-b border-white/15 pb-1.5">
                            <SuitVectorSvg suit={suit} className="w-6 h-6" />
                            <span className="text-xs sm:text-sm font-black text-white">
                              {isAr ? SUIT_NAMES[suit].ar : SUIT_NAMES[suit].en}
                            </span>
                          </div>

                          {!lane ? (
                            <div className="my-auto py-8 px-2 rounded-2xl border-2 border-dashed border-[#ffca3a]/50 bg-[#161426]/35 text-center space-y-1 w-full">
                              <div className="text-lg font-black text-[#ffca3a]">J</div>
                              <div className="text-[11px] font-extrabold text-white/80">
                                {isAr ? 'تُفتح بالولد (J)' : 'Opens with Jack (J)'}
                              </div>
                            </div>
                          ) : (
                            <div className="w-full space-y-2 my-auto py-1">
                              {/* Upper End (Towards Ace) */}
                              <div className="rounded-xl bg-[#161426]/60 p-2 text-center border border-white/15">
                                <div className="text-[10px] font-bold text-[#8ac926]">
                                  {lane.high === 14
                                    ? isAr
                                      ? 'اكتمل للأعلى (A)!'
                                      : 'Top Closed (A)!'
                                    : isAr
                                    ? `مطلوب للأعلى: ${rankLabel(nextUp!)}`
                                    : `Next Up: ${rankLabel(nextUp!)}`}
                                </div>
                                <div className="mt-1 flex justify-center">
                                  <TrixPlayingCardButton
                                    card={{ id: `${rankLabel(lane.high)}${suit}`, suit, rank: lane.high }}
                                    playable={false}
                                    size="mini"
                                  />
                                </div>
                              </div>

                              {/* Center Jack Anchor */}
                              <div className="text-center">
                                <span className="px-3 py-0.5 rounded-full bg-[#ffca3a] text-[#161426] font-black text-xs border border-[#161426]">
                                  {isAr ? 'المركز: J' : 'Anchor: J'}
                                </span>
                              </div>

                              {/* Lower End (Towards 2) */}
                              <div className="rounded-xl bg-[#161426]/60 p-2 text-center border border-white/15">
                                <div className="flex justify-center mb-1">
                                  <TrixPlayingCardButton
                                    card={{ id: `${rankLabel(lane.low)}${suit}`, suit, rank: lane.low }}
                                    playable={false}
                                    size="mini"
                                  />
                                </div>
                                <div className="text-[10px] font-bold text-[#00bbf9]">
                                  {lane.low === 2
                                    ? isAr
                                      ? 'اكتمل للأسفل (2)!'
                                      : 'Bottom Closed (2)!'
                                    : isAr
                                    ? `مطلوب للأسفل: ${rankLabel(nextDown!)}`
                                    : `Next Down: ${rankLabel(nextDown!)}`}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  /* 4-COMPASS TRICK CARPET WITH FULL-SIZE CARDS */
                  <div className="rounded-3xl bg-[#0d241a]/80 border-2 border-[#ffca3a]/30 p-4 sm:p-5 min-h-[290px] flex flex-col justify-between">
                    {/* North Trick Card Slot */}
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-xs font-black text-[#ffca3a]">
                        {getSeatDisplayName(northSeat)}
                      </span>
                      <div className="h-[104px] sm:h-[124px] flex items-center justify-center">
                        {(() => {
                          const played = gameData.currentTrick.find(
                            (p) => p.seatIndex === northSeat
                          );
                          return played ? (
                            <TrixPlayingCardButton
                              card={played.card}
                              playable={false}
                              size="table"
                              doubled={Boolean(gameData.doubledCards[played.card.id])}
                            />
                          ) : (
                            <div className="w-[68px] h-[100px] sm:w-[82px] sm:h-[120px] rounded-2xl border-2 border-dashed border-white/25 bg-white/5 flex items-center justify-center text-xs font-bold text-white/40">
                              {gameData.turnSeat === northSeat ? '...' : ''}
                            </div>
                          );
                        })()}
                      </div>
                    </div>

                    {/* West + Center Lead Suit Badge + East */}
                    <div className="flex items-center justify-between gap-3 px-2 sm:px-8 my-1">
                      {/* West Card */}
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-xs font-black text-[#ffca3a]">
                          {getSeatDisplayName(westSeat)}
                        </span>
                        {(() => {
                          const played = gameData.currentTrick.find(
                            (p) => p.seatIndex === westSeat
                          );
                          return played ? (
                            <TrixPlayingCardButton
                              card={played.card}
                              playable={false}
                              size="table"
                              doubled={Boolean(gameData.doubledCards[played.card.id])}
                            />
                          ) : (
                            <div className="w-[68px] h-[100px] sm:w-[82px] sm:h-[120px] rounded-2xl border-2 border-dashed border-white/25 bg-white/5 flex items-center justify-center text-xs font-bold text-white/40">
                              {gameData.turnSeat === westSeat ? '...' : ''}
                            </div>
                          );
                        })()}
                      </div>

                      {/* Center Trick Carpet Info */}
                      <div className="text-center space-y-1.5 px-2">
                        {gameData.currentTrick.length > 0 ? (
                          <div className="inline-flex flex-col items-center gap-1 bg-[#161426]/85 border-2 border-[#ffca3a] rounded-2xl px-4 py-2">
                            <span className="text-[11px] font-extrabold text-white/75">
                              {isAr ? 'النوع المطلوب اتباعه:' : 'Lead Suit:'}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <SuitVectorSvg
                                suit={gameData.currentTrick[0].card.suit}
                                className="w-6 h-6"
                              />
                              <span className="font-black text-sm text-[#ffca3a]">
                                {isAr
                                  ? SUIT_NAMES[gameData.currentTrick[0].card.suit].ar
                                  : SUIT_NAMES[gameData.currentTrick[0].card.suit].en}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="text-xs sm:text-sm font-black text-white/70">
                            {isAr
                              ? `بانتظار ضربة البداية من ${getSeatDisplayName(
                                  gameData.turnSeat
                                )}`
                              : `Waiting for ${getSeatDisplayName(
                                  gameData.turnSeat
                                )} to lead`}
                          </div>
                        )}
                      </div>

                      {/* East Card */}
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-xs font-black text-[#ffca3a]">
                          {getSeatDisplayName(eastSeat)}
                        </span>
                        {(() => {
                          const played = gameData.currentTrick.find(
                            (p) => p.seatIndex === eastSeat
                          );
                          return played ? (
                            <TrixPlayingCardButton
                              card={played.card}
                              playable={false}
                              size="table"
                              doubled={Boolean(gameData.doubledCards[played.card.id])}
                            />
                          ) : (
                            <div className="w-[68px] h-[100px] sm:w-[82px] sm:h-[120px] rounded-2xl border-2 border-dashed border-white/25 bg-white/5 flex items-center justify-center text-xs font-bold text-white/40">
                              {gameData.turnSeat === eastSeat ? '...' : ''}
                            </div>
                          );
                        })()}
                      </div>
                    </div>

                    {/* South Trick Card Slot */}
                    <div className="flex flex-col items-center gap-1">
                      <div className="h-[104px] sm:h-[124px] flex items-center justify-center">
                        {(() => {
                          const played = gameData.currentTrick.find(
                            (p) => p.seatIndex === southSeat
                          );
                          return played ? (
                            <TrixPlayingCardButton
                              card={played.card}
                              playable={false}
                              size="table"
                              doubled={Boolean(gameData.doubledCards[played.card.id])}
                            />
                          ) : (
                            <div className="w-[68px] h-[100px] sm:w-[82px] sm:h-[120px] rounded-2xl border-2 border-dashed border-[#ffca3a]/40 bg-white/5 flex items-center justify-center text-xs font-black text-[#ffca3a]">
                              {isViewerTurn ? (isAr ? 'العب ورقة' : 'Play Card') : ''}
                            </div>
                          );
                        })()}
                      </div>
                      <span className="text-xs font-black text-[#8ac926]">
                        {getSeatDisplayName(southSeat)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* PHASE 4: HAND SUMMARY OR MATCH VICTORY */}
            {(gameData.phase === 'hand_summary' || gameData.phase === 'match_over') && (
              <div className="bg-[#161426]/95 border-3 border-[#ffca3a] rounded-3xl p-6 text-center space-y-4 shadow-2xl">
                <Trophy weight="fill" className="w-12 h-12 text-[#ffca3a] mx-auto" />
                <h3 className="text-2xl sm:text-3xl font-black text-[#ffca3a]">
                  {gameData.phase === 'match_over'
                    ? isAr
                      ? 'اكتملت الممالك الأربع — النتائج النهائية!'
                      : 'All 4 Kingdoms Completed — Final Standings!'
                    : isAr
                    ? `حصيلة عقد (${
                        gameData.activeContract
                          ? CONTRACT_META[gameData.activeContract].ar
                          : ''
                      })`
                    : `Hand Summary (${
                        gameData.activeContract
                          ? CONTRACT_META[gameData.activeContract].en
                          : ''
                      })`}
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl mx-auto">
                  {seats.map((s) => (
                    <div
                      key={s.seatIndex}
                      className="p-3.5 rounded-2xl bg-[#25204d] border-2 border-white/20 flex items-center justify-between"
                    >
                      <div className="text-start">
                        <div className="font-black text-base text-white">
                          {getSeatDisplayName(s.seatIndex)}
                        </div>
                        <div className="text-xs text-[#cbd5e1] font-bold">
                          {isAr
                            ? `نقاط هذا العقد: ${
                                s.handScore > 0 ? `+${s.handScore}` : s.handScore
                              }`
                            : `This contract: ${
                                s.handScore > 0 ? `+${s.handScore}` : s.handScore
                              }`}
                        </div>
                      </div>
                      <span
                        dir="ltr"
                        className={`cartoon-badge px-3.5 py-1 text-base font-black ${
                          s.totalScore >= 0
                            ? 'bg-[#8ac926] text-[#161426]'
                            : 'bg-[#ff595e] text-white'
                        }`}
                      >
                        {s.totalScore > 0 ? `+${s.totalScore}` : s.totalScore}
                      </span>
                    </div>
                  ))}
                </div>

                {gameData.phase === 'match_over' ? (
                  <button
                    type="button"
                    onClick={() => handleRestartMatch(gameData.mode, gameData.partnership)}
                    className="cartoon-btn bg-[#8ac926] text-[#161426] px-8 py-3.5 text-lg font-black inline-flex items-center gap-2"
                  >
                    <ArrowsClockwise weight="bold" className="w-6 h-6" />
                    <span>{isAr ? 'بطولة ممالك جديدة!' : 'New Kingdoms Match!'}</span>
                  </button>
                ) : (
                  (isHost || isPassAndPlay) && (
                    <button
                      type="button"
                      onClick={handleDealNextContractOrKingdom}
                      className="cartoon-btn bg-[#8ac926] text-[#161426] px-8 py-3.5 text-lg font-black inline-flex items-center gap-2"
                    >
                      <Play weight="fill" className="w-6 h-6" />
                      <span>
                        {gameData.remainingContracts.length > 0
                          ? isAr
                            ? `وزّع أوراق العقد القادم (باقي ${gameData.remainingContracts.length} بالمملكة)!`
                            : `Deal Next Contract (${gameData.remainingContracts.length} left in Kingdom)!`
                          : isAr
                          ? 'انتقل إلى المملكة التالية!'
                          : 'Advance to Next Kingdom!'}
                      </span>
                    </button>
                  )
                )}
              </div>
            )}
          </div>

          {/* EAST SEAT */}
          <div className="lg:col-span-2 order-3">
            {renderOpponentSeatBox(eastSeat, true)}
          </div>
        </div>

        {/* SOUTH SEAT: VIEWER'S FULL-SIZE SORTED HAND TRAY */}
        {!viewerSeat?.isBot && gameData.phase !== 'match_over' && (
          <div className="relative z-10 bg-[#0d2118]/92 rounded-3xl p-4 sm:p-5 border-3 border-[#ffca3a]/40 space-y-3 shadow-2xl">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2.5">
                <div
                  style={{ backgroundColor: getSeatColor(viewerSeatIdx) }}
                  className="w-9 h-9 rounded-xl border-2 border-[#161426] flex items-center justify-center font-black text-sm text-[#161426]"
                >
                  {getSeatDisplayName(viewerSeatIdx).slice(0, 1)}
                </div>
                <div>
                  <div className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                    <Sword weight="fill" className="w-4 h-4 text-[#ffca3a]" />
                    <span>
                      {isAr
                        ? `أوراق يدك (${getSeatDisplayName(viewerSeatIdx)})`
                        : `Your Hand (${getSeatDisplayName(viewerSeatIdx)})`}
                    </span>
                    <span
                      dir="ltr"
                      className={`px-2.5 py-0.5 rounded-full text-xs font-black border border-[#161426] ${
                        (viewerSeat?.totalScore || 0) >= 0
                          ? 'bg-[#8ac926] text-[#161426]'
                          : 'bg-[#ff595e] text-white'
                      }`}
                    >
                      {(viewerSeat?.totalScore || 0) > 0
                        ? `+${viewerSeat?.totalScore}`
                        : viewerSeat?.totalScore || 0}
                    </span>
                  </div>
                </div>

                {/* Suit Breakdown Pills */}
                <div className="hidden sm:flex items-center gap-1.5 ps-2">
                  {SUIT_ORDER.map((st) => {
                    const cnt = viewerHand.filter((c) => c.suit === st).length;
                    return (
                      <span
                        key={st}
                        className="px-2.5 py-0.5 rounded-full bg-white/10 border border-white/15 text-xs font-extrabold flex items-center gap-1"
                      >
                        <SuitVectorSvg suit={st} className="w-3.5 h-3.5" />
                        <span>{cnt}</span>
                      </span>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {isViewerTurn && (
                  <span className="px-3 py-1 rounded-full bg-[#8ac926] text-[#161426] font-black text-xs sm:text-sm animate-pulse">
                    {isAr ? 'دورك الآن — اضغط على ورقة متاحة!' : 'Your Turn — Play a highlighted card!'}
                  </span>
                )}

                {/* Pass Turn Button ONLY when in Trix contract and 0 legal moves */}
                {isViewerTurn &&
                  gameData.activeContract === 'trix' &&
                  viewerLegalIds.size === 0 &&
                  viewerHand.length > 0 && (
                    <button
                      type="button"
                      onClick={() => handlePassTrixDominoTurn(viewerSeatIdx)}
                      className="cartoon-btn bg-[#ff595e] text-white px-5 py-2 text-sm font-black flex items-center gap-1.5 animate-bounce"
                    >
                      <HandPalm weight="fill" className="w-5 h-5" />
                      <span>
                        {isAr ? 'باس (لا توجد نقلة متاحة)' : 'Pass Turn (No Legal Play)'}
                      </span>
                    </button>
                  )}

                {isPassAndPlay && humanCount > 1 && (
                  <button
                    type="button"
                    onClick={() => setPassAndPlayRevealed(!passAndPlayRevealed)}
                    className="cartoon-btn bg-[#ffca3a] text-[#161426] px-3.5 py-1.5 text-xs font-black flex items-center gap-1.5"
                  >
                    {passAndPlayRevealed ? (
                      <EyeSlash className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                    <span>
                      {passAndPlayRevealed
                        ? isAr
                          ? 'إخفاء الأوراق'
                          : 'Hide Hand'
                        : isAr
                        ? `اكشف أوراق (${getSeatDisplayName(viewerSeatIdx)})`
                        : 'Reveal Hand'}
                    </span>
                  </button>
                )}
              </div>
            </div>

            {!passAndPlayRevealed ? (
              <div className="py-8 text-center text-base font-black text-[#ffca3a]">
                {isAr
                  ? `مرّر الجهاز إلى (${getSeatDisplayName(
                      viewerSeatIdx
                    )}) ثم اضغط «اكشف أوراق»!`
                  : `Pass device to ${getSeatDisplayName(
                      viewerSeatIdx
                    )} and tap Reveal Hand!`}
              </div>
            ) : (
              <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5 pt-2 pb-1">
                {viewerHand.map((card) => {
                  const canPlay = isViewerTurn && viewerLegalIds.has(card.id);
                  return (
                    <TrixPlayingCardButton
                      key={card.id}
                      card={card}
                      playable={canPlay}
                      size="hand"
                      doubled={Boolean(gameData.doubledCards[card.id])}
                      onClick={() => {
                        if (!canPlay) return;
                        if (gameData.activeContract === 'trix') {
                          handlePlayTrixDominoCard(viewerSeatIdx, card);
                        } else {
                          handlePlayTrickCard(viewerSeatIdx, card);
                        }
                      }}
                    />
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
