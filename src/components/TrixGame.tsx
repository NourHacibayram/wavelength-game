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
  | 'trix'
  | 'complex'
  | 'king_of_hearts'
  | 'queens'
  | 'diamonds'
  | 'tricks';

export interface TrixCard {
  id: string; // e.g. 'KH', '7H', '11S'
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
  seats: TrixSeat[];
  mode: 'complex' | 'kingdoms';
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

const BOT_PROFILES = [
  { id: 'trix_bot_1', ar: 'أبو شهاب (بوت)', en: 'Bot Karim', color: '#00bbf9' },
  { id: 'trix_bot_2', ar: 'أبو عصام (بوت)', en: 'Bot Tariq', color: '#8ac926' },
  { id: 'trix_bot_3', ar: 'أبو جودت (بوت)', en: 'Bot Ziad', color: '#f15bb5' },
  { id: 'trix_bot_4', ar: 'العقيد (بوت)', en: 'Bot Omar', color: '#ff924c' },
];

const CONTRACT_META: Record<
  TrixContract,
  { ar: string; en: string; descAr: string; descEn: string; accent: string }
> = {
  trix: {
    ar: 'تركس (ترتيب الأوراق)',
    en: 'Trix (Domino Run)',
    descAr: 'ابدأ من الولد (J) صعوداً للـ A ونزولاً للـ 2 (+200 / +150 / +100 / +50)',
    descEn: 'Build from Jack (J) up to A & down to 2 (+200 / +150 / +100 / +50)',
    accent: '#8ac926',
  },
  complex: {
    ar: 'كومبلكس (كل النواقص معاً!)',
    en: 'Complex (All Penalties!)',
    descAr: 'شيخ الكبة (-75)، البنات (-25)، الديناري (-10)، واللطش (-15) بنفس اليد!',
    descEn: 'King of Hearts (-75), Queens (-25), Diamonds (-10) & Tricks (-15) at once!',
    accent: '#ff595e',
  },
  king_of_hearts: {
    ar: 'شيخ الكبة',
    en: 'King of Hearts',
    descAr: 'تجنّب أكل شيخ الكبة (-75، أو -150 مع التدبيل!) وتنتهي اليد فور أكله!',
    descEn: 'Dodge the King of Hearts (-75, or -150 if Doubled)! Hand ends once eaten.',
    accent: '#e63946',
  },
  queens: {
    ar: 'البنات',
    en: 'Queens',
    descAr: 'كل بنت بتاكلها بـ -25 نقطة (-50 إذا مدبّلة)!',
    descEn: 'Each Queen eaten costs -25 pts (-50 if Doubled)!',
    accent: '#9b5de5',
  },
  diamonds: {
    ar: 'الديناري',
    en: 'Diamonds',
    descAr: 'كل ورقة ديناري بتاكلها بـ -10 نقاط!',
    descEn: 'Every Diamond card eaten costs -10 pts!',
    accent: '#ff924c',
  },
  tricks: {
    ar: 'اللطش (الأكلات)',
    en: 'Tricks (Slaps)',
    descAr: 'كل أكلة بتلمّها على الأرض بـ -15 نقطة!',
    descEn: 'Every trick won costs -15 pts!',
    accent: '#00bbf9',
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
    return a.rank - b.rank;
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

function contractsForMode(mode: 'complex' | 'kingdoms'): TrixContract[] {
  return mode === 'complex'
    ? ['trix', 'complex']
    : ['trix', 'king_of_hearts', 'queens', 'diamonds', 'tricks'];
}

export function buildInitialTrixState(
  playerIds: string[],
  mode: 'complex' | 'kingdoms' = 'complex',
  partnership = false
): TrixGameState {
  const { hands, sevenHeartsSeat } = dealFourHands();
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

  return {
    seats,
    mode,
    partnership,
    phase: 'choose_contract',
    kingdomNumber: 1,
    kingdomOwnerSeat: sevenHeartsSeat,
    remainingContracts: contractsForMode(mode),
    activeContract: null,
    hands,
    doubledCards: {},
    doublingReadySeats: [],
    turnSeat: sevenHeartsSeat,
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
 * PURE VECTOR SUIT & LUXURY PLAYING CARD SVG
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

const TrixPlayingCardButton: React.FC<{
  card: TrixCard;
  playable: boolean;
  doubled?: boolean;
  compact?: boolean;
  onClick?: () => void;
}> = ({ card, playable, doubled = false, compact = false, onClick }) => {
  const isRed = card.suit === 'H' || card.suit === 'D';
  const isKingHearts = card.id === 'KH';
  const isQueen = card.rank === 12;
  const rText = rankLabel(card.rank);

  return (
    <button
      type="button"
      disabled={!playable}
      onClick={onClick}
      className={`relative rounded-2xl border-3 border-[#161426] select-none transition-all flex flex-col justify-between p-1.5 ${
        compact ? 'w-12 h-17 sm:w-14 sm:h-20' : 'w-14 h-21 sm:w-16 sm:h-24'
      } ${
        playable
          ? 'bg-white hover:-translate-y-2.5 shadow-[0_5px_0_#161426] ring-2 ring-[#ffca3a] cursor-pointer active:translate-y-0'
          : 'bg-[#f1f5f9] opacity-60 shadow-[0_3px_0_#161426] cursor-not-allowed'
      }`}
    >
      {doubled && (
        <span className="absolute -top-2.5 -end-2 z-10 bg-[#ff595e] text-white text-[10px] font-extrabold px-1.5 py-0.2 rounded-full border-2 border-[#161426] shadow-[0_2px_0_#161426]">
          ×2
        </span>
      )}

      {/* Top Corner */}
      <div className="flex items-center justify-between w-full leading-none">
        <span
          className={`font-extrabold ${compact ? 'text-xs' : 'text-sm sm:text-base'} ${
            isRed ? 'text-[#e63946]' : 'text-[#161426]'
          }`}
        >
          {rText}
        </span>
        <SuitVectorSvg suit={card.suit} className="w-3.5 h-3.5" />
      </div>

      {/* Center Emblem */}
      <div className="flex flex-col items-center justify-center my-auto">
        {isKingHearts ? (
          <div className="flex flex-col items-center">
            <Crown weight="fill" className="w-4 h-4 text-[#ffca3a] drop-shadow-[0_1px_0_#161426]" />
            <SuitVectorSvg suit="H" className={compact ? 'w-5 h-5' : 'w-6 h-6'} />
          </div>
        ) : isQueen ? (
          <div className="flex flex-col items-center">
            <Sparkle weight="fill" className="w-3.5 h-3.5 text-[#9b5de5]" />
            <SuitVectorSvg suit={card.suit} className={compact ? 'w-5 h-5' : 'w-6 h-6'} />
          </div>
        ) : (
          <SuitVectorSvg suit={card.suit} className={compact ? 'w-5 h-5' : 'w-6 h-6'} />
        )}
      </div>

      {/* Bottom Corner */}
      <div className="flex items-center justify-end w-full leading-none opacity-80">
        <span
          className={`font-extrabold text-[11px] ${
            isRed ? 'text-[#e63946]' : 'text-[#161426]'
          }`}
        >
          {rText}
        </span>
      </div>
    </button>
  );
};

/* ============================================================================
 * LEGAL MOVE & AI ENGINE FOR TRIX
 * ========================================================================== */
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

  // Leading a trick: in king_of_hearts or complex, avoid leading Hearts until broken unless only Hearts remain
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
  // Prefer playing cards in suits where bot holds extreme 2 or A!
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
    // Lead lowest safe card to avoid winning tricks
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
    // Try to duck right under highestInLead!
    const duckCards = legal
      .filter((c) => c.rank < highestInLead)
      .sort((a, b) => b.rank - a.rank);
    if (duckCards.length > 0) return duckCards[0];
    // Forced to go over: if last player (length === 3) and no penalty in trick, can dump highest safe card; otherwise play lowest over
    const asc = [...legal].sort((a, b) => a.rank - b.rank);
    const withoutKh = asc.filter((c) => c.id !== 'KH');
    return withoutKh[0] || asc[0];
  }

  // Off-suit! Dump the most dangerous penalty card immediately!
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
 * MAIN TRIX ROYAL COMPONENT
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
  const [passAndPlayRevealed, setPassAndPlayRevealed] = useState<boolean>(!isPassAndPlay);
  const botTimerRef = useRef<number | null>(null);

  const seats = gameData.seats || [];

  const getSeatDisplayName = (seatIdx: number): string => {
    const s = seats[seatIdx];
    if (!s) return `Seat ${seatIdx + 1}`;
    if (s.isBot) {
      return lang === 'ar' ? s.botNameAr || 'بوت' : s.botNameEn || 'Bot';
    }
    const found = players.find((p) => p.id === s.playerId);
    return found?.name || (lang === 'ar' ? `لاعب ${seatIdx + 1}` : `Player ${seatIdx + 1}`);
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

  // Hide hand on Pass & Play turn switch when 2+ humans share one screen
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

    if (needsDoubling) {
      // Auto-ready any seats (human or bot) that hold ZERO doubleable cards, and let bots decide!
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
        turnSeat: gameData.kingdomOwnerSeat,
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
        turnSeat: gameData.kingdomOwnerSeat,
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

    // Award room leaderboard points to best scorer(s) of this hand
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

    // If 3 players have finished, the 4th automatically takes +50 and hand ends!
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

    // Advance turn to next player who still holds cards
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

    // Evaluate 4-card trick winner!
    const leadSuit = nextTrick[0].card.suit;
    let winnerSeat = nextTrick[0].seatIndex;
    let highestRank = nextTrick[0].card.rank;
    for (const pc of nextTrick) {
      if (pc.card.suit === leadSuit && pc.card.rank > highestRank) {
        highestRank = pc.card.rank;
        winnerSeat = pc.seatIndex;
      }
    }

    const contract = gameData.activeContract || 'complex';
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

    // 1. Tricks penalty
    if (contract === 'complex' || contract === 'tricks') {
      trickDeltaWinner -= 15;
      nextSeats[winnerSeat].tricksWon += 1;
      if (contract === 'tricks') {
        notesAr.push('-15 أكلة');
        notesEn.push('-15 Trick');
      }
    }

    // 2. Diamonds penalty
    if (contract === 'complex' || contract === 'diamonds') {
      const dCount = nextTrick.filter((p) => p.card.suit === 'D').length;
      if (dCount > 0) {
        trickDeltaWinner -= dCount * 10;
        nextSeats[winnerSeat].diamondsEaten += dCount;
        notesAr.push(`${-dCount * 10} ديناري`);
        notesEn.push(`${-dCount * 10} Diamonds`);
      }
    }

    // 3. Queens penalty (+ Doubling!)
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

    // 4. King of Hearts penalty (+ Doubling!)
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
    const contract = gameData.activeContract || 'complex';
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

  const handleRestartMatch = (
    nextMode: 'complex' | 'kingdoms' = gameData.mode,
    nextPartners: boolean = gameData.partnership
  ) => {
    const pIds = players.map((p) => p.id);
    onUpdateGameData(buildInitialTrixState(pIds, nextMode, nextPartners));
  };

  // Single-Controller Automation for Bot Turns & Trick Sweep!
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
        }, 650);
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
              gameData.activeContract || 'complex',
              gameData.heartsBroken
            );
            if (legal.length > 0) {
              const chosen = chooseBotTrickCard(
                legal,
                gameData.currentTrick,
                gameData.activeContract || 'complex'
              );
              handlePlayTrickCard(activeSeat.seatIndex, chosen);
            }
          }
        }, 600);
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
            gameData.activeContract || 'complex',
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

  return (
    <div className="space-y-3.5 select-none [overflow-anchor:none]">
      {/* Top Trix Kingdom & Mode Header */}
      <div className="cartoon-card bg-[#fef3c7] p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-0.5">
          <div className="flex flex-wrap items-center gap-2 text-xs font-extrabold text-[#92400e]">
            <span className="cartoon-badge bg-[#ffca3a] text-[#161426] px-2.5 py-0.5 flex items-center gap-1">
              <Crown weight="fill" className="w-3.5 h-3.5" />
              <span>
                {lang === 'ar'
                  ? `مملكة (${getSeatDisplayName(gameData.kingdomOwnerSeat)}) — ${gameData.kingdomNumber}/4`
                  : `${getSeatDisplayName(gameData.kingdomOwnerSeat)}’s Kingdom (${gameData.kingdomNumber}/4)`}
              </span>
            </span>

            {gameData.activeContract && (
              <span
                style={{ backgroundColor: CONTRACT_META[gameData.activeContract].accent }}
                className="cartoon-badge text-white px-2.5 py-0.5"
              >
                {lang === 'ar'
                  ? CONTRACT_META[gameData.activeContract].ar
                  : CONTRACT_META[gameData.activeContract].en}
              </span>
            )}

            {Object.keys(gameData.doubledCards || {}).length > 0 && (
              <span className="cartoon-badge bg-[#ff595e] text-white px-2.5 py-0.5 flex items-center gap-1">
                <Flame weight="fill" className="w-3.5 h-3.5 text-[#ffca3a]" />
                <span>
                  {lang === 'ar'
                    ? `مدبّل: ${Object.keys(gameData.doubledCards).join(' + ')}`
                    : `Doubled: ${Object.keys(gameData.doubledCards).join(' + ')}`}
                </span>
              </span>
            )}
          </div>

          <h2 className="text-xl sm:text-2xl font-extrabold text-[#161426]">
            {lang === 'ar'
              ? 'تركس الملوك — كومبلكس وممالك'
              : 'Trix Royal — Complex & Kingdoms'}
          </h2>
        </div>

        {/* Mode & Partnership Controls for Host */}
        {(isHost || isPassAndPlay) && (
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() =>
                handleRestartMatch(
                  gameData.mode === 'complex' ? 'kingdoms' : 'complex',
                  gameData.partnership
                )
              }
              className="cartoon-btn bg-white text-[#161426] px-3 py-1.5 text-xs flex items-center gap-1"
            >
              <Lightning weight="fill" className="w-3.5 h-3.5 text-[#d97706]" />
              <span>
                {gameData.mode === 'complex'
                  ? lang === 'ar'
                    ? 'النظام: كومبلكس'
                    : 'Mode: Complex'
                  : lang === 'ar'
                  ? 'النظام: 5 ممالك'
                  : 'Mode: 5 Kingdoms'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleRestartMatch(gameData.mode, !gameData.partnership)}
              className={`cartoon-btn px-3 py-1.5 text-xs flex items-center gap-1 ${
                gameData.partnership
                  ? 'bg-[#00bbf9] text-[#161426]'
                  : 'bg-white text-[#161426]'
              }`}
            >
              <Users weight="fill" className="w-3.5 h-3.5" />
              <span>
                {gameData.partnership
                  ? lang === 'ar'
                    ? 'شراكة 2×2'
                    : 'Partners 2v2'
                  : lang === 'ar'
                  ? 'فردي'
                  : 'Solo'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleRestartMatch()}
              className="cartoon-btn bg-[#ffca3a] text-[#161426] px-3 py-1.5 text-xs flex items-center gap-1"
            >
              <ArrowsClockwise weight="bold" className="w-3.5 h-3.5" />
              <span>{lang === 'ar' ? 'إعادة' : 'Reset'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Live 4-Seat Score Strip (+ Partnership Totals if Active) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {seats.map((s) => {
          const isTurn =
            gameData.phase === 'playing' && gameData.turnSeat === s.seatIndex;
          const sName = getSeatDisplayName(s.seatIndex);
          const sCol = getSeatColor(s.seatIndex);
          return (
            <div
              key={s.seatIndex}
              className={`p-2.5 rounded-2xl border-3 border-[#161426] flex items-center justify-between gap-2 transition-all ${
                isTurn
                  ? 'bg-[#ffca3a] text-[#161426] shadow-[0_4px_0_#161426] -translate-y-0.5'
                  : 'bg-[#25204d] text-[#fff9ec] shadow-[0_3px_0_#120f29]'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <div
                  style={{ backgroundColor: sCol }}
                  className="w-8 h-8 rounded-full border-2 border-[#161426] flex items-center justify-center font-extrabold text-xs text-[#161426] shrink-0"
                >
                  {s.isBot ? <Robot weight="fill" className="w-4 h-4" /> : sName.slice(0, 1)}
                </div>
                <div className="min-w-0 leading-tight">
                  <div className="text-xs font-extrabold truncate flex items-center gap-1">
                    <span className="truncate">{sName}</span>
                    {gameData.kingdomOwnerSeat === s.seatIndex && (
                      <Crown weight="fill" className="w-3.5 h-3.5 text-[#f59e0b] shrink-0" />
                    )}
                  </div>
                  <span className="text-[10px] opacity-80 font-bold">
                    {lang === 'ar'
                      ? `${(gameData.hands[s.seatIndex] || []).length} ورقة`
                      : `${(gameData.hands[s.seatIndex] || []).length} cards`}
                  </span>
                </div>
              </div>

              <span
                dir="ltr"
                className={`cartoon-badge px-2 py-0.5 text-xs ${
                  s.totalScore >= 0
                    ? 'bg-[#8ac926] text-[#161426]'
                    : 'bg-[#ff595e] text-white'
                }`}
              >
                {s.totalScore > 0 ? `+${s.totalScore}` : s.totalScore}
              </span>
            </div>
          );
        })}
      </div>

      {gameData.partnership && (
        <div className="grid grid-cols-2 gap-2.5">
          <div className="cartoon-badge bg-[#fde68a] text-[#161426] px-3 py-1.5 text-xs flex items-center justify-between">
            <span>
              {lang === 'ar'
                ? `فريق 1 (${getSeatDisplayName(0)} + ${getSeatDisplayName(2)})`
                : `Team 1 (${getSeatDisplayName(0)} & ${getSeatDisplayName(2)})`}
            </span>
            <span dir="ltr" className="font-extrabold text-sm">
              {teamAScore}
            </span>
          </div>
          <div className="cartoon-badge bg-[#bae6fd] text-[#161426] px-3 py-1.5 text-xs flex items-center justify-between">
            <span>
              {lang === 'ar'
                ? `فريق 2 (${getSeatDisplayName(1)} + ${getSeatDisplayName(3)})`
                : `Team 2 (${getSeatDisplayName(1)} & ${getSeatDisplayName(3)})`}
            </span>
            <span dir="ltr" className="font-extrabold text-sm">
              {teamBScore}
            </span>
          </div>
        </div>
      )}

      {/* ROYAL EMERALD FELT TABLE STAGE */}
      <div className="rounded-3xl border-4 border-[#161426] shadow-[0_8px_0_#161426] bg-gradient-to-b from-[#1b4332] to-[#132e23] p-4 sm:p-5 text-white space-y-4 relative overflow-hidden">
        {/* PHASE 1: CHOOSE CONTRACT */}
        {gameData.phase === 'choose_contract' && (
          <div className="bg-[#161426]/85 border-3 border-[#ffca3a] rounded-3xl p-5 text-center space-y-4">
            <div className="inline-flex items-center gap-2 cartoon-badge bg-[#ffca3a] text-[#161426] px-4 py-1 text-xs">
              <Crown weight="fill" className="w-4 h-4" />
              <span>
                {lang === 'ar'
                  ? `صاحب المملكة: ${getSeatDisplayName(gameData.kingdomOwnerSeat)}`
                  : `Kingdom Owner: ${getSeatDisplayName(gameData.kingdomOwnerSeat)}`}
              </span>
            </div>

            {seats[gameData.kingdomOwnerSeat]?.isBot ? (
              <p className="text-base font-extrabold text-[#ffca3a] animate-pulse">
                {lang === 'ar'
                  ? `${getSeatDisplayName(gameData.kingdomOwnerSeat)} عم يفحص أوراقه ويختار العقد...`
                  : `${getSeatDisplayName(gameData.kingdomOwnerSeat)} is inspecting cards & choosing a contract...`}
              </p>
            ) : isPassAndPlay || seats[gameData.kingdomOwnerSeat]?.playerId === myPlayerId ? (
              <>
                <h3 className="text-xl font-extrabold text-white">
                  {lang === 'ar'
                    ? 'افحص أوراقك بالأسفل واختر عقد هذه الجولة:'
                    : 'Inspect your hand below & choose this hand’s contract:'}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl mx-auto">
                  {gameData.remainingContracts.map((ct) => {
                    const meta = CONTRACT_META[ct];
                    return (
                      <button
                        key={ct}
                        type="button"
                        onClick={() => handleSelectContract(ct)}
                        style={{ backgroundColor: meta.accent }}
                        className="cartoon-btn text-white p-3.5 text-start space-y-1"
                      >
                        <div className="font-extrabold text-base flex items-center justify-between">
                          <span>{lang === 'ar' ? meta.ar : meta.en}</span>
                          <Play weight="fill" className="w-4 h-4" />
                        </div>
                        <p className="text-xs font-bold opacity-95 leading-snug">
                          {lang === 'ar' ? meta.descAr : meta.descEn}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </>
            ) : (
              <p className="text-base font-extrabold text-[#ffca3a]">
                {lang === 'ar'
                  ? `بانتظار (${getSeatDisplayName(gameData.kingdomOwnerSeat)}) ليختار عقد المملكة...`
                  : `Waiting for ${getSeatDisplayName(gameData.kingdomOwnerSeat)} to choose the contract...`}
              </p>
            )}
          </div>
        )}

        {/* PHASE 2: DOUBLING WINDOW (تدبيل شيخ الكبة والبنات!) */}
        {gameData.phase === 'doubling' && (
          <div className="bg-[#161426]/90 border-3 border-[#ff595e] rounded-3xl p-5 text-center space-y-3.5">
            <div className="inline-flex items-center gap-1.5 cartoon-badge bg-[#ff595e] text-white px-4 py-1 text-xs">
              <Flame weight="fill" className="w-4 h-4 text-[#ffca3a]" />
              <span>
                {lang === 'ar' ? 'مرحلة التدبيل (×2) قبل اللعب!' : 'Doubling Window (x2)!'}
              </span>
            </div>

            {!viewerSeat?.isBot &&
            !gameData.doublingReadySeats.includes(viewerSeatIdx) ? (
              <div className="space-y-3">
                <p className="text-sm sm:text-base font-extrabold text-[#fff9ec]">
                  {lang === 'ar'
                    ? `يا (${getSeatDisplayName(viewerSeatIdx)})، معك أوراق خطيرة! بتحب تدبّلها (×2) لترفع العقوبة وتكسب مكافأة إذا أكلها غيرك؟`
                    : `${getSeatDisplayName(viewerSeatIdx)}, double your King of Hearts / Queens for x2 damage & bonus?`}
                </p>

                <div className="flex flex-wrap items-center justify-center gap-3">
                  {getDoubleableCardsInHand(viewerHand, gameData.activeContract).map((dc) => {
                    const isDbl = gameData.doubledCards[dc.id] === viewerSeatIdx;
                    return (
                      <button
                        key={dc.id}
                        type="button"
                        onClick={() => handleToggleDoubleCard(viewerSeatIdx, dc.id)}
                        className={`cartoon-btn px-4 py-2.5 text-sm flex items-center gap-2 ${
                          isDbl
                            ? 'bg-[#ff595e] text-white ring-2 ring-[#ffca3a]'
                            : 'bg-white text-[#161426]'
                        }`}
                      >
                        <SuitVectorSvg suit={dc.suit} className="w-4 h-4" />
                        <span>
                          {dc.id === 'KH'
                            ? lang === 'ar'
                              ? 'شيخ الكبة'
                              : 'King of Hearts'
                            : `${rankLabel(dc.rank)}`}
                        </span>
                        <span className="cartoon-badge bg-[#ffca3a] text-[#161426] px-2 py-0.2 text-[11px]">
                          {isDbl ? (lang === 'ar' ? 'مدبّل ×2!' : 'DOUBLED!') : '×2?'}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => handleConfirmDoublingSeat(viewerSeatIdx)}
                  className="cartoon-btn bg-[#8ac926] text-[#161426] px-7 py-2.5 text-base inline-flex items-center gap-2"
                >
                  <CheckCircle weight="fill" className="w-5 h-5" />
                  <span>{lang === 'ar' ? 'اعتمد وبلّش اللعب!' : 'Confirm & Play!'}</span>
                </button>
              </div>
            ) : (
              <p className="text-sm font-extrabold text-[#ffca3a] animate-pulse">
                {lang === 'ar'
                  ? 'بانتظار باقي اللاعبين لإنهاء قرار التدبيل...'
                  : 'Waiting for other players to finish doubling decisions...'}
              </p>
            )}
          </div>
        )}

        {/* PHASE 3: ACTIVE TABLE CENTER (TRIX LANES OR 4-SEAT TRICK COMPASS) */}
        {(gameData.phase === 'playing' || gameData.phase === 'trick_pause') && (
          <div className="space-y-3">
            {gameData.activeContract === 'trix' ? (
              /* 4 SUIT LANES FOR TRIX DOMINO */
              <div className="grid grid-cols-4 gap-2 sm:gap-3 max-w-xl mx-auto py-2">
                {SUIT_ORDER.map((suit) => {
                  const lane = gameData.trixLanes[suit];
                  return (
                    <div
                      key={suit}
                      className="rounded-2xl border-3 border-[#161426] bg-[#161426]/45 p-2.5 sm:p-3 text-center space-y-2"
                    >
                      <div className="flex items-center justify-center gap-1">
                        <SuitVectorSvg suit={suit} className="w-5 h-5" />
                      </div>

                      {!lane ? (
                        <div className="py-6 rounded-xl border-2 border-dashed border-white/25 text-xs font-extrabold text-white/60">
                          {lang === 'ar' ? 'يفتح بـ J' : 'Needs J'}
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          <div className="cartoon-badge bg-[#8ac926] text-[#161426] py-1 text-xs">
                            ↑ {rankLabel(lane.high)}
                          </div>
                          <div className="cartoon-badge bg-[#ffca3a] text-[#161426] py-0.5 text-[11px]">
                            J
                          </div>
                          <div className="cartoon-badge bg-[#00bbf9] text-[#161426] py-1 text-xs">
                            ↓ {rankLabel(lane.low)}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              /* 4-COMPASS TRICK TABLE */
              <div className="max-w-lg mx-auto py-1 space-y-2">
                {/* North Seat Slot */}
                <div className="flex flex-col items-center gap-1">
                  <span className="text-[11px] font-extrabold text-[#ffca3a]">
                    {getSeatDisplayName(northSeat)}
                  </span>
                  <div className="h-21 flex items-center justify-center">
                    {(() => {
                      const played = gameData.currentTrick.find(
                        (p) => p.seatIndex === northSeat
                      );
                      return played ? (
                        <TrixPlayingCardButton
                          card={played.card}
                          playable={false}
                          compact={true}
                          doubled={Boolean(gameData.doubledCards[played.card.id])}
                        />
                      ) : (
                        <div className="w-13 h-18 rounded-xl border-2 border-dashed border-white/25" />
                      );
                    })()}
                  </div>
                </div>

                {/* West + Center Status + East */}
                <div className="flex items-center justify-between gap-2 px-2">
                  {/* West */}
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-[11px] font-extrabold text-[#ffca3a]">
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
                          compact={true}
                          doubled={Boolean(gameData.doubledCards[played.card.id])}
                        />
                      ) : (
                        <div className="w-13 h-18 rounded-xl border-2 border-dashed border-white/25" />
                      );
                    })()}
                  </div>

                  {/* Center Trick Status */}
                  <div className="text-center px-2 flex-1">
                    {gameData.phase === 'trick_pause' ? (
                      <div className="cartoon-badge bg-[#ffca3a] text-[#161426] px-3 py-1.5 text-xs inline-block">
                        {lang === 'ar'
                          ? gameData.lastTrickMessageAr
                          : gameData.lastTrickMessageEn}
                      </div>
                    ) : (
                      <div className="text-xs font-extrabold text-white/85">
                        {lang === 'ar'
                          ? `الدور عند: ${getSeatDisplayName(gameData.turnSeat)}`
                          : `Turn: ${getSeatDisplayName(gameData.turnSeat)}`}
                      </div>
                    )}
                  </div>

                  {/* East */}
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-[11px] font-extrabold text-[#ffca3a]">
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
                          compact={true}
                          doubled={Boolean(gameData.doubledCards[played.card.id])}
                        />
                      ) : (
                        <div className="w-13 h-18 rounded-xl border-2 border-dashed border-white/25" />
                      );
                    })()}
                  </div>
                </div>

                {/* South Seat Slot */}
                <div className="flex flex-col items-center gap-1">
                  <div className="h-21 flex items-center justify-center">
                    {(() => {
                      const played = gameData.currentTrick.find(
                        (p) => p.seatIndex === southSeat
                      );
                      return played ? (
                        <TrixPlayingCardButton
                          card={played.card}
                          playable={false}
                          compact={true}
                          doubled={Boolean(gameData.doubledCards[played.card.id])}
                        />
                      ) : (
                        <div className="w-13 h-18 rounded-xl border-2 border-dashed border-white/25" />
                      );
                    })()}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* PHASE 4: HAND SUMMARY OR MATCH VICTORY */}
        {(gameData.phase === 'hand_summary' || gameData.phase === 'match_over') && (
          <div className="bg-[#161426]/92 border-3 border-[#ffca3a] rounded-3xl p-5 text-center space-y-4">
            <Trophy weight="fill" className="w-11 h-11 text-[#ffca3a] mx-auto" />
            <h3 className="text-2xl font-extrabold text-[#ffca3a]">
              {gameData.phase === 'match_over'
                ? lang === 'ar'
                  ? 'انتهت بطولة التركس الملوكية!'
                  : 'Trix Royal Championship Complete!'
                : lang === 'ar'
                ? 'نتيجة اليد المنتهية'
                : 'Hand Score Summary'}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-w-xl mx-auto">
              {seats.map((s) => (
                <div
                  key={s.seatIndex}
                  className="p-3 rounded-2xl bg-[#25204d] border-2 border-white/20 flex items-center justify-between"
                >
                  <div className="text-start">
                    <div className="font-extrabold text-sm text-white">
                      {getSeatDisplayName(s.seatIndex)}
                    </div>
                    <div className="text-[11px] text-[#cbd5e1] font-bold">
                      {lang === 'ar'
                        ? `هذه اليد: ${s.handScore > 0 ? `+${s.handScore}` : s.handScore}`
                        : `This hand: ${s.handScore > 0 ? `+${s.handScore}` : s.handScore}`}
                    </div>
                  </div>
                  <span
                    dir="ltr"
                    className={`cartoon-badge px-3 py-1 text-sm ${
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
                onClick={() => handleRestartMatch()}
                className="cartoon-btn bg-[#8ac926] text-[#161426] px-8 py-3 text-lg inline-flex items-center gap-2"
              >
                <ArrowsClockwise weight="bold" className="w-5 h-5" />
                <span>{lang === 'ar' ? 'بطولة تركس جديدة!' : 'New Trix Match!'}</span>
              </button>
            ) : (
              (isHost || isPassAndPlay) && (
                <button
                  type="button"
                  onClick={handleDealNextContractOrKingdom}
                  className="cartoon-btn bg-[#8ac926] text-[#161426] px-8 py-3 text-lg inline-flex items-center gap-2"
                >
                  <Play weight="fill" className="w-5 h-5" />
                  <span>
                    {gameData.remainingContracts.length > 0
                      ? lang === 'ar'
                        ? 'وزّع أوراق العقد القادم!'
                        : 'Deal Next Contract!'
                      : lang === 'ar'
                      ? 'انتقل للمملكة التالية!'
                      : 'Start Next Kingdom!'}
                  </span>
                </button>
              )
            )}
          </div>
        )}

        {/* VIEWER'S HAND TRAY AT SOUTH OF TABLE */}
        {!viewerSeat?.isBot && gameData.phase !== 'match_over' && (
          <div className="bg-[#161426]/65 rounded-2xl p-3 sm:p-4 border-2 border-white/15 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs sm:text-sm font-extrabold flex items-center gap-2">
                <Sword weight="fill" className="w-4 h-4 text-[#ffca3a]" />
                <span>
                  {lang === 'ar'
                    ? `أوراق يدك (${getSeatDisplayName(viewerSeatIdx)})`
                    : `Your Hand (${getSeatDisplayName(viewerSeatIdx)})`}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {/* Pass Turn Button ONLY when in Trix contract and 0 legal moves */}
                {isViewerTurn &&
                  gameData.activeContract === 'trix' &&
                  viewerLegalIds.size === 0 &&
                  viewerHand.length > 0 && (
                    <button
                      type="button"
                      onClick={() => handlePassTrixDominoTurn(viewerSeatIdx)}
                      className="cartoon-btn bg-[#ff595e] text-white px-4 py-1.5 text-xs sm:text-sm flex items-center gap-1.5 animate-bounce"
                    >
                      <HandPalm weight="fill" className="w-4 h-4" />
                      <span>
                        {lang === 'ar' ? 'باس (ما معي نقلة)' : 'Pass Turn (No Legal Play)'}
                      </span>
                    </button>
                  )}

                {isPassAndPlay && humanCount > 1 && (
                  <button
                    type="button"
                    onClick={() => setPassAndPlayRevealed(!passAndPlayRevealed)}
                    className="cartoon-btn bg-[#ffca3a] text-[#161426] px-3 py-1 text-xs flex items-center gap-1"
                  >
                    {passAndPlayRevealed ? (
                      <EyeSlash className="w-3.5 h-3.5" />
                    ) : (
                      <Eye className="w-3.5 h-3.5" />
                    )}
                    <span>
                      {passAndPlayRevealed
                        ? lang === 'ar'
                          ? 'إخفاء الأوراق'
                          : 'Hide Hand'
                        : lang === 'ar'
                        ? `اكشف أوراق (${getSeatDisplayName(viewerSeatIdx)})`
                        : 'Reveal Hand'}
                    </span>
                  </button>
                )}
              </div>
            </div>

            {!passAndPlayRevealed ? (
              <div className="py-6 text-center text-sm font-extrabold text-[#ffca3a]">
                {lang === 'ar'
                  ? `مرّر الجهاز إلى (${getSeatDisplayName(viewerSeatIdx)}) ثم اضغط «اكشف أوراق»!`
                  : `Pass device to ${getSeatDisplayName(viewerSeatIdx)} and tap Reveal Hand!`}
              </div>
            ) : (
              <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 pt-1">
                {viewerHand.map((card) => {
                  const canPlay = isViewerTurn && viewerLegalIds.has(card.id);
                  return (
                    <TrixPlayingCardButton
                      key={card.id}
                      card={card}
                      playable={canPlay}
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
