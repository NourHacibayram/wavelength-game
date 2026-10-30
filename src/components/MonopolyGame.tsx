import React, { useState, useEffect, useRef, useMemo } from 'react';
import confetti from 'canvas-confetti';
import {
  Crown,
  Trophy,
  Lightning,
  ArrowsLeftRight,
  ArrowsClockwise,
  Sparkle,
  Robot,
  Play,
  CheckCircle,
  WarningCircle,
  Users,
  Plus,
} from '@phosphor-icons/react';

export type SpaceKind =
  | 'go'
  | 'property'
  | 'chest'
  | 'tax'
  | 'airport'
  | 'jail'
  | 'utility'
  | 'parking'
  | 'chance'
  | 'gotojail';

export type ColorGroup =
  | 'brown'
  | 'sky'
  | 'pink'
  | 'orange'
  | 'red'
  | 'yellow'
  | 'royal';

export interface BoardSpaceDef {
  index: number;
  kind: SpaceKind;
  nameAr: string;
  nameEn: string;
  group?: ColorGroup;
  colorHex?: string;
  price?: number;
  houseCost?: number;
  rents?: [number, number, number, number, number]; // [base, 1H, 2H, 3H, Hotel]
  gridCol: number; // 1..7 in LTR 7x7 perimeter
  gridRow: number; // 1..7 in LTR 7x7 perimeter
}

export interface MonopolyAuctionState {
  spaceIndex: number;
  currentBid: number;
  highestBidderId: string | null;
  activeBidderIds: string[];
  turnBidderIndex: number;
}

export interface MonopolyTradeOffer {
  fromId: string;
  toId: string;
  offerSpaceIndex: number | null;
  offerCash: number;
  requestSpaceIndex: number | null;
  requestCash: number;
}

export interface MonopolyDrawnCard {
  deck: 'chance' | 'chest';
  titleAr: string;
  titleEn: string;
  descAr: string;
  descEn: string;
}

export interface MonopolyLogItem {
  ar: string;
  en: string;
}

export interface MonopolyGameState {
  cash: Record<string, number>;
  positions: Record<string, number>;
  owners: Record<number, string>;
  houses: Record<number, number>; // 0..4 (4 = Royal Hotel)
  inJail: Record<string, number>; // remaining jail turns (0 = free)
  getOutOfJailCards: Record<string, number>;
  bankruptIds: string[];
  jackpot: number;
  turnIndex: number;
  playerOrder: string[];
  botProfiles: Record<string, { nameAr: string; nameEn: string; color: string }>;
  mode: 'quick20' | 'classic';
  maxRounds: number;
  roundNumber: number;
  phase: 'roll' | 'buy_or_auction' | 'auction' | 'end_turn' | 'game_over';
  pendingSpaceIndex: number | null;
  auctionState: MonopolyAuctionState | null;
  pendingTrade: MonopolyTradeOffer | null;
  lastCard: MonopolyDrawnCard | null;
  lastDice: [number, number];
  doublesCount: number;
  hasExtraRoll: boolean;
  moveSeq: number;
  lastMoverId: string | null;
  lastMovePath: number[];
  winnerId: string | null;
  eventLog: MonopolyLogItem[];
}

interface PlayerInfo {
  id: string;
  name: string;
  avatar_color: string;
  score: number;
}

export interface MonopolyGameProps {
  gameData: MonopolyGameState;
  players: PlayerInfo[];
  myPlayerId: string;
  isHost: boolean;
  isPassAndPlay: boolean;
  lang: 'ar' | 'en';
  onUpdateGameData: (
    nextData: MonopolyGameState,
    scoreAwards?: Record<string, number>
  ) => void;
  onStartNewRound: () => void;
}

export const BOARD_SPACES: BoardSpaceDef[] = [
  {
    index: 0,
    kind: 'go',
    nameAr: 'انطلاق',
    nameEn: 'GO +$200',
    gridCol: 7,
    gridRow: 7,
  },
  {
    index: 1,
    kind: 'property',
    nameAr: 'الإسكندرية',
    nameEn: 'Alexandria',
    group: 'brown',
    colorHex: '#9c6644',
    price: 60,
    houseCost: 50,
    rents: [10, 35, 90, 180, 260],
    gridCol: 6,
    gridRow: 7,
  },
  {
    index: 2,
    kind: 'chest',
    nameAr: 'صندوق الشلّة',
    nameEn: 'Shilla Chest',
    gridCol: 5,
    gridRow: 7,
  },
  {
    index: 3,
    kind: 'property',
    nameAr: 'القاهرة',
    nameEn: 'Cairo',
    group: 'brown',
    colorHex: '#9c6644',
    price: 80,
    houseCost: 50,
    rents: [14, 45, 110, 220, 320],
    gridCol: 4,
    gridRow: 7,
  },
  {
    index: 4,
    kind: 'tax',
    nameAr: 'ضريبة فخامة',
    nameEn: 'Luxury Tax',
    price: 100,
    gridCol: 3,
    gridRow: 7,
  },
  {
    index: 5,
    kind: 'airport',
    nameAr: 'مطار الشرق',
    nameEn: 'East Airport',
    colorHex: '#2b2845',
    price: 150,
    gridCol: 2,
    gridRow: 7,
  },
  {
    index: 6,
    kind: 'jail',
    nameAr: 'السجن / زيارة',
    nameEn: 'Jail / Visit',
    gridCol: 1,
    gridRow: 7,
  },
  {
    index: 7,
    kind: 'property',
    nameAr: 'عمّان',
    nameEn: 'Amman',
    group: 'sky',
    colorHex: '#00bbf9',
    price: 110,
    houseCost: 50,
    rents: [18, 60, 150, 290, 410],
    gridCol: 1,
    gridRow: 6,
  },
  {
    index: 8,
    kind: 'property',
    nameAr: 'بيروت',
    nameEn: 'Beirut',
    group: 'sky',
    colorHex: '#00bbf9',
    price: 130,
    houseCost: 50,
    rents: [22, 70, 180, 330, 470],
    gridCol: 1,
    gridRow: 5,
  },
  {
    index: 9,
    kind: 'utility',
    nameAr: 'شركة الكهرباء',
    nameEn: 'Power Grid',
    colorHex: '#8ac926',
    price: 140,
    gridCol: 1,
    gridRow: 4,
  },
  {
    index: 10,
    kind: 'property',
    nameAr: 'دمشق',
    nameEn: 'Damascus',
    group: 'pink',
    colorHex: '#f15bb5',
    price: 160,
    houseCost: 100,
    rents: [26, 90, 220, 400, 560],
    gridCol: 1,
    gridRow: 3,
  },
  {
    index: 11,
    kind: 'property',
    nameAr: 'بغداد',
    nameEn: 'Baghdad',
    group: 'pink',
    colorHex: '#f15bb5',
    price: 180,
    houseCost: 100,
    rents: [30, 105, 255, 450, 630],
    gridCol: 1,
    gridRow: 2,
  },
  {
    index: 12,
    kind: 'parking',
    nameAr: 'موقف مجاني',
    nameEn: 'Free Jackpot',
    gridCol: 1,
    gridRow: 1,
  },
  {
    index: 13,
    kind: 'property',
    nameAr: 'مراكش',
    nameEn: 'Marrakech',
    group: 'orange',
    colorHex: '#ff924c',
    price: 200,
    houseCost: 100,
    rents: [34, 120, 290, 510, 700],
    gridCol: 2,
    gridRow: 1,
  },
  {
    index: 14,
    kind: 'chance',
    nameAr: 'بطاقة حظ',
    nameEn: 'Chance',
    gridCol: 3,
    gridRow: 1,
  },
  {
    index: 15,
    kind: 'property',
    nameAr: 'القدس',
    nameEn: 'Jerusalem',
    group: 'orange',
    colorHex: '#ff924c',
    price: 220,
    houseCost: 100,
    rents: [38, 135, 325, 560, 770],
    gridCol: 4,
    gridRow: 1,
  },
  {
    index: 16,
    kind: 'airport',
    nameAr: 'مطار الخليج',
    nameEn: 'Gulf Airport',
    colorHex: '#2b2845',
    price: 150,
    gridCol: 5,
    gridRow: 1,
  },
  {
    index: 17,
    kind: 'property',
    nameAr: 'الدوحة',
    nameEn: 'Doha',
    group: 'red',
    colorHex: '#ff595e',
    price: 250,
    houseCost: 150,
    rents: [44, 155, 370, 640, 860],
    gridCol: 6,
    gridRow: 1,
  },
  {
    index: 18,
    kind: 'gotojail',
    nameAr: 'اذهب للسجن!',
    nameEn: 'Go To Jail!',
    gridCol: 7,
    gridRow: 1,
  },
  {
    index: 19,
    kind: 'property',
    nameAr: 'الكويت',
    nameEn: 'Kuwait',
    group: 'red',
    colorHex: '#ff595e',
    price: 270,
    houseCost: 150,
    rents: [48, 170, 400, 700, 940],
    gridCol: 7,
    gridRow: 2,
  },
  {
    index: 20,
    kind: 'property',
    nameAr: 'المنامة',
    nameEn: 'Manama',
    group: 'yellow',
    colorHex: '#ffca3a',
    price: 300,
    houseCost: 150,
    rents: [54, 190, 450, 780, 1040],
    gridCol: 7,
    gridRow: 3,
  },
  {
    index: 21,
    kind: 'property',
    nameAr: 'أبوظبي',
    nameEn: 'Abu Dhabi',
    group: 'yellow',
    colorHex: '#ffca3a',
    price: 320,
    houseCost: 150,
    rents: [60, 210, 490, 840, 1120],
    gridCol: 7,
    gridRow: 4,
  },
  {
    index: 22,
    kind: 'property',
    nameAr: 'الرياض',
    nameEn: 'Riyadh',
    group: 'royal',
    colorHex: '#4361ee',
    price: 360,
    houseCost: 200,
    rents: [70, 240, 560, 960, 1280],
    gridCol: 7,
    gridRow: 5,
  },
  {
    index: 23,
    kind: 'property',
    nameAr: 'دبي',
    nameEn: 'Dubai',
    group: 'royal',
    colorHex: '#4361ee',
    price: 400,
    houseCost: 200,
    rents: [85, 280, 650, 1100, 1500],
    gridCol: 7,
    gridRow: 6,
  },
];

const GROUP_SPACES: Record<ColorGroup, number[]> = {
  brown: [1, 3],
  sky: [7, 8],
  pink: [10, 11],
  orange: [13, 15],
  red: [17, 19],
  yellow: [20, 21],
  royal: [22, 23],
};

interface SurpriseCardTemplate {
  id: string;
  deck: 'chance' | 'chest';
  titleAr: string;
  titleEn: string;
  descAr: string;
  descEn: string;
  effect:
    | { type: 'cash'; amount: number }
    | { type: 'tax_pot'; amount: number }
    | { type: 'birthday'; perPlayer: number }
    | { type: 'jail_card' }
    | { type: 'goto_go' }
    | { type: 'goto_space'; spaceIndex: number }
    | { type: 'goto_jail' }
    | { type: 'repairs'; perHouse: number; perHotel: number };
}

const SURPRISE_CARDS: SurpriseCardTemplate[] = [
  {
    id: 'ch_go',
    deck: 'chance',
    titleAr: 'رحلة VIP إلى البداية!',
    titleEn: 'VIP Trip to GO!',
    descAr: 'تقدّم مباشرة إلى خانة انطلاق واقبض راتب $200 فوراً.',
    descEn: 'Advance directly to GO and collect $200 immediately.',
    effect: { type: 'goto_go' },
  },
  {
    id: 'ch_dubai',
    deck: 'chance',
    titleAr: 'صفقة أبراج دبي!',
    titleEn: 'Dubai Skyline Express!',
    descAr: 'انتقل فوراً إلى مدينة دبي (وإذا مررت بانطلاق اقبض $200).',
    descEn: 'Advance directly to Dubai (collect $200 if you pass GO).',
    effect: { type: 'goto_space', spaceIndex: 23 },
  },
  {
    id: 'ch_beirut',
    deck: 'chance',
    titleAr: 'عطلة ساحلية في بيروت!',
    titleEn: 'Coastal Trip to Beirut!',
    descAr: 'انطلق إلى بيروت واستفد من راتب الانطلاق إن مررت به.',
    descEn: 'Travel to Beirut and collect $200 if passing GO.',
    effect: { type: 'goto_space', spaceIndex: 8 },
  },
  {
    id: 'ch_div',
    deck: 'chance',
    titleAr: 'أرباح أسهم المصرف!',
    titleEn: 'Bank Stock Dividend!',
    descAr: 'وزّع البنك أرباحاً استثنائية: اقبض +$150 كاش.',
    descEn: 'The bank pays you a special dividend of +$150.',
    effect: { type: 'cash', amount: 150 },
  },
  {
    id: 'ch_speed',
    deck: 'chance',
    titleAr: 'مخالفة رادار سريعة!',
    titleEn: 'Speeding Fine!',
    descAr: 'ادفع $75 وتُضاف مباشرة إلى جائزة الموقف المجاني.',
    descEn: 'Pay $75 straight into the Free Parking Jackpot.',
    effect: { type: 'tax_pot', amount: 75 },
  },
  {
    id: 'ch_jailfree',
    deck: 'chance',
    titleAr: 'واسطة خروج من السجن!',
    titleEn: 'Get Out of Jail Free!',
    descAr: 'احتفظ بهذه البطاقة لاستخدامها مجاناً عند دخول السجن.',
    descEn: 'Keep this pass to exit Jail for free anytime.',
    effect: { type: 'jail_card' },
  },
  {
    id: 'ch_jail',
    deck: 'chance',
    titleAr: 'تفتيش مفاجئ — للسجن!',
    titleEn: 'Busted — Go To Jail!',
    descAr: 'اذهب مباشرة إلى السجن دون المرور بخانة الانطلاق.',
    descEn: 'Go directly to Jail without collecting $200.',
    effect: { type: 'goto_jail' },
  },
  {
    id: 'cc_inherit',
    deck: 'chest',
    titleAr: 'صفقة عقارية رابحة!',
    titleEn: 'Real Estate Boom!',
    descAr: 'بعت أرضاً قديمة بمكسب ممتاز: اقبض +$200 من البنك.',
    descEn: 'You sold an old parcel at peak value: collect +$200.',
    effect: { type: 'cash', amount: 200 },
  },
  {
    id: 'cc_bday',
    deck: 'chest',
    titleAr: 'عيد ميلادك مع الشلّة!',
    titleEn: 'Shilla Birthday Party!',
    descAr: 'هدية فورية: اقبض $50 من كل لاعب منافس عالطاولة!',
    descEn: 'Collect $50 as a gift from every active player!',
    effect: { type: 'birthday', perPlayer: 50 },
  },
  {
    id: 'cc_bonus',
    deck: 'chest',
    titleAr: 'مكافأة أفضل مستثمر!',
    titleEn: 'Top Investor Award!',
    descAr: 'فزت بجائزة التطوير العمراني: اقبض +$120.',
    descEn: 'You won the Urban Development Prize: collect +$120.',
    effect: { type: 'cash', amount: 120 },
  },
  {
    id: 'cc_repair',
    deck: 'chest',
    titleAr: 'صيانة البيوت والفنادق',
    titleEn: 'Property Maintenance',
    descAr: 'ادفع $25 عن كل بيت و$80 عن كل فندق تملكه للموقف المجاني.',
    descEn: 'Pay $25 per house and $80 per hotel into the Jackpot.',
    effect: { type: 'repairs', perHouse: 25, perHotel: 80 },
  },
  {
    id: 'cc_party',
    deck: 'chest',
    titleAr: 'عزيمة عشاء للشلّة!',
    titleEn: 'Dinner Bill for the Crew!',
    descAr: 'عزمت الشلّة على عشاء فاخر — ادفع $60 لصندوق الموقف المجاني.',
    descEn: 'You treated everyone to dinner — pay $60 into the Jackpot.',
    effect: { type: 'tax_pot', amount: 60 },
  },
];

export function buildInitialMonopolyState(playerIds: string[]): MonopolyGameState {
  const cleanIds = playerIds.length > 0 ? [...playerIds] : ['local_host'];
  const botProfiles: Record<string, { nameAr: string; nameEn: string; color: string }> = {};

  if (cleanIds.length === 1) {
    cleanIds.push('monopoly_bot_1', 'monopoly_bot_2');
    botProfiles['monopoly_bot_1'] = {
      nameAr: 'التاجر الآلي',
      nameEn: 'Tycoon Bot',
      color: '#00bbf9',
    };
    botProfiles['monopoly_bot_2'] = {
      nameAr: 'الشيخة الذكية',
      nameEn: 'Mogul Bot',
      color: '#f15bb5',
    };
  }

  const ordered = cleanIds.slice(0, 6);
  const cash: Record<string, number> = {};
  const positions: Record<string, number> = {};
  const inJail: Record<string, number> = {};
  const getOutOfJailCards: Record<string, number> = {};

  ordered.forEach((pid) => {
    cash[pid] = 1500;
    positions[pid] = 0;
    inJail[pid] = 0;
    getOutOfJailCards[pid] = 0;
  });

  return {
    cash,
    positions,
    owners: {},
    houses: {},
    inJail,
    getOutOfJailCards,
    bankruptIds: [],
    jackpot: 100,
    turnIndex: 0,
    playerOrder: ordered,
    botProfiles,
    mode: 'quick20',
    maxRounds: 20,
    roundNumber: 1,
    phase: 'roll',
    pendingSpaceIndex: null,
    auctionState: null,
    pendingTrade: null,
    lastCard: null,
    lastDice: [4, 3],
    doublesCount: 0,
    hasExtraRoll: false,
    moveSeq: 0,
    lastMoverId: null,
    lastMovePath: [],
    winnerId: null,
    eventLog: [
      {
        ar: 'انطلقت بطولة مونوبولي الشلّة! كل لاعب يبدأ بـ $1,500.',
        en: 'Shilla Monopoly started! Every tycoon begins with $1,500.',
      },
    ],
  };
}

export function ownsFullGroup(
  owners: Record<number, string>,
  ownerId: string,
  group?: ColorGroup
): boolean {
  if (!group) return false;
  const indices = GROUP_SPACES[group];
  return indices.every((idx) => owners[idx] === ownerId);
}

export function calculateRent(
  space: BoardSpaceDef,
  owners: Record<number, string>,
  houses: Record<number, number>,
  diceTotal: number
): number {
  const ownerId = owners[space.index];
  if (!ownerId) return 0;

  if (space.kind === 'airport') {
    const ownedAirports = [5, 16].filter((idx) => owners[idx] === ownerId).length;
    return ownedAirports >= 2 ? 100 : 45;
  }

  if (space.kind === 'utility') {
    const hasAirportToo = owners[5] === ownerId || owners[16] === ownerId;
    return diceTotal * (hasAirportToo ? 14 : 8);
  }

  if (space.kind === 'property' && space.rents) {
    const h = houses[space.index] || 0;
    if (h > 0) {
      return space.rents[Math.min(4, h)];
    }
    const base = space.rents[0];
    return ownsFullGroup(owners, ownerId, space.group) ? base * 2 : base;
  }

  return 0;
}

export function calculateNetWorth(state: MonopolyGameState, pid: string): number {
  let total = state.cash[pid] || 0;
  BOARD_SPACES.forEach((sp) => {
    if (state.owners[sp.index] === pid && sp.price) {
      total += sp.price;
      const h = state.houses[sp.index] || 0;
      if (h > 0 && sp.houseCost) {
        total += h * sp.houseCost;
      }
    }
  });
  return total;
}

/* ---------- Custom Pure SVG Vector Icons (Zero Emojis) ---------- */
const DiceFaceSvg: React.FC<{ value: number; rolling?: boolean; accent?: string }> = ({
  value,
  rolling,
  accent = '#ffffff',
}) => {
  const pips: Record<number, [number, number][]> = {
    1: [[24, 24]],
    2: [
      [14, 14],
      [34, 34],
    ],
    3: [
      [14, 14],
      [24, 24],
      [34, 34],
    ],
    4: [
      [14, 14],
      [34, 14],
      [14, 34],
      [34, 34],
    ],
    5: [
      [14, 14],
      [34, 14],
      [24, 24],
      [14, 34],
      [34, 34],
    ],
    6: [
      [14, 12],
      [34, 12],
      [14, 24],
      [34, 24],
      [14, 36],
      [34, 36],
    ],
  };
  const coords = pips[value] || pips[1];
  return (
    <svg
      viewBox="0 0 48 48"
      className={`w-11 h-11 md:w-12 md:h-12 drop-shadow-[0_3px_0_#161426] transition-transform ${
        rolling ? 'animate-spin' : ''
      }`}
    >
      <rect
        x="3"
        y="3"
        width="42"
        height="42"
        rx="10"
        fill={accent}
        stroke="#161426"
        strokeWidth="3.5"
      />
      {coords.map(([cx, cy], idx) => (
        <circle
          key={idx}
          cx={cx}
          cy={cy}
          r="4.2"
          fill={value === 6 ? '#ff595e' : '#161426'}
        />
      ))}
    </svg>
  );
};

const BuildingBadgeSvg: React.FC<{ level: number }> = ({ level }) => {
  if (level <= 0) return null;
  if (level >= 4) {
    // Royal Hotel
    return (
      <div
        className="inline-flex items-center gap-0.5 bg-[#ff595e] text-white border border-[#161426] rounded px-1 py-0.5 shadow-[0_1px_0_#161426]"
        title="Royal Hotel"
      >
        <svg viewBox="0 0 20 20" className="w-3 h-3">
          <path
            d="M3 17V7l7-4 7 4v10H3z"
            fill="#ffca3a"
            stroke="#161426"
            strokeWidth="2"
          />
          <rect x="8" y="11" width="4" height="6" fill="#161426" />
        </svg>
      </div>
    );
  }
  return (
    <div className="inline-flex items-center gap-0.5">
      {Array.from({ length: level }).map((_, idx) => (
        <svg key={idx} viewBox="0 0 16 16" className="w-3 h-3">
          <path
            d="M2 14V7.5L8 3l6 4.5V14H2z"
            fill="#8ac926"
            stroke="#161426"
            strokeWidth="2"
          />
        </svg>
      ))}
    </div>
  );
};

const SpaceSpecialSvg: React.FC<{ kind: SpaceKind }> = ({ kind }) => {
  switch (kind) {
    case 'go':
      return (
        <svg viewBox="0 0 36 36" className="w-6 h-6 md:w-7 md:h-7">
          <circle cx="18" cy="18" r="15" fill="#8ac926" stroke="#161426" strokeWidth="2.8" />
          <path
            d="M11 18h13m0 0l-5-5m5 5l-5 5"
            stroke="#161426"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'chest':
      return (
        <svg viewBox="0 0 36 36" className="w-5 h-5 md:w-6 md:h-6">
          <rect
            x="5"
            y="12"
            width="26"
            height="17"
            rx="3"
            fill="#ffca3a"
            stroke="#161426"
            strokeWidth="2.6"
          />
          <path
            d="M5 14c0-4 5-6 13-6s13 2 13 6H5z"
            fill="#ff924c"
            stroke="#161426"
            strokeWidth="2.6"
          />
          <rect x="15" y="13" width="6" height="6" rx="1" fill="#161426" />
        </svg>
      );
    case 'chance':
      return (
        <svg viewBox="0 0 36 36" className="w-5 h-5 md:w-6 md:h-6">
          <rect
            x="6"
            y="4"
            width="24"
            height="28"
            rx="5"
            fill="#f15bb5"
            stroke="#161426"
            strokeWidth="2.6"
          />
          <text
            x="18"
            y="24"
            textAnchor="middle"
            fill="#ffffff"
            fontWeight="900"
            fontSize="18"
          >
            ?
          </text>
        </svg>
      );
    case 'tax':
      return (
        <svg viewBox="0 0 36 36" className="w-5 h-5 md:w-6 md:h-6">
          <polygon
            points="18,4 31,14 25,30 11,30 5,14"
            fill="#00bbf9"
            stroke="#161426"
            strokeWidth="2.6"
          />
          <polygon points="18,8 26,15 18,26 10,15" fill="#ffffff" opacity="0.65" />
        </svg>
      );
    case 'airport':
      return (
        <svg viewBox="0 0 36 36" className="w-5 h-5 md:w-6 md:h-6">
          <path
            d="M18 5l3 9 10 4-10 3-3 10-3-10-10-3 10-4 3-9z"
            fill="#00bbf9"
            stroke="#161426"
            strokeWidth="2.4"
          />
        </svg>
      );
    case 'utility':
      return (
        <svg viewBox="0 0 36 36" className="w-5 h-5 md:w-6 md:h-6">
          <path
            d="M20 4L9 20h8l-2 12 12-16h-8l1-12z"
            fill="#ffca3a"
            stroke="#161426"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'jail':
      return (
        <svg viewBox="0 0 36 36" className="w-6 h-6 md:w-7 md:h-7">
          <rect
            x="5"
            y="5"
            width="26"
            height="26"
            rx="4"
            fill="#ff924c"
            stroke="#161426"
            strokeWidth="2.6"
          />
          <line x1="12" y1="5" x2="12" y2="31" stroke="#161426" strokeWidth="2.6" />
          <line x1="18" y1="5" x2="18" y2="31" stroke="#161426" strokeWidth="2.6" />
          <line x1="24" y1="5" x2="24" y2="31" stroke="#161426" strokeWidth="2.6" />
        </svg>
      );
    case 'parking':
      return (
        <svg viewBox="0 0 36 36" className="w-6 h-6 md:w-7 md:h-7">
          <circle cx="18" cy="18" r="14" fill="#ffca3a" stroke="#161426" strokeWidth="2.8" />
          <text
            x="18"
            y="24"
            textAnchor="middle"
            fill="#161426"
            fontWeight="900"
            fontSize="16"
          >
            $
          </text>
        </svg>
      );
    case 'gotojail':
      return (
        <svg viewBox="0 0 36 36" className="w-6 h-6 md:w-7 md:h-7">
          <circle cx="18" cy="18" r="14" fill="#ff595e" stroke="#161426" strokeWidth="2.8" />
          <path
            d="M12 12l12 12M24 12L12 24"
            stroke="#ffffff"
            strokeWidth="3.2"
            strokeLinecap="round"
          />
        </svg>
      );
    default:
      return null;
  }
};

export const MonopolyGame: React.FC<MonopolyGameProps> = ({
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

  const state: MonopolyGameState = useMemo(() => {
    if (!gameData || !gameData.cash || !Array.isArray(gameData.playerOrder)) {
      return buildInitialMonopolyState(players.map((p) => p.id));
    }
    return gameData;
  }, [gameData, players]);

  const [selectedSpaceIdx, setSelectedSpaceIdx] = useState<number>(23);
  const [rollingAnim, setRollingAnim] = useState(false);
  const [visualPositions, setVisualPositions] = useState<Record<string, number>>(
    state.positions
  );
  const [showTradeDrawer, setShowTradeDrawer] = useState(false);
  const [tradeTargetId, setTradeTargetId] = useState<string>('');
  const [tradeOfferSpace, setTradeOfferSpace] = useState<number | null>(null);
  const [tradeOfferCash, setTradeOfferCash] = useState<number>(0);
  const [tradeRequestSpace, setTradeRequestSpace] = useState<number | null>(null);
  const [tradeRequestCash, setTradeRequestCash] = useState<number>(0);

  const animatedSeqRef = useRef<number>(state.moveSeq);

  // Sync or hop-animate pawn movements cleanly
  useEffect(() => {
    if (
      state.moveSeq !== animatedSeqRef.current &&
      state.lastMoverId &&
      Array.isArray(state.lastMovePath) &&
      state.lastMovePath.length > 0
    ) {
      animatedSeqRef.current = state.moveSeq;
      const mover = state.lastMoverId;
      const path = [...state.lastMovePath];
      let stepIdx = 0;

      const interval = window.setInterval(() => {
        if (stepIdx < path.length) {
          const sq = path[stepIdx];
          setVisualPositions((prev) => ({
            ...state.positions,
            [mover]: sq,
          }));
          stepIdx += 1;
        } else {
          window.clearInterval(interval);
          setVisualPositions(state.positions);
        }
      }, 90);

      return () => window.clearInterval(interval);
    } else {
      setVisualPositions(state.positions);
    }
  }, [state.moveSeq, state.lastMoverId, state.lastMovePath, state.positions]);

  const getPlayerMeta = (pid: string) => {
    const human = players.find((p) => p.id === pid);
    if (human) {
      return {
        id: pid,
        name: human.name,
        color: human.avatar_color,
        isBot: false,
      };
    }
    const bot = state.botProfiles?.[pid];
    if (bot) {
      return {
        id: pid,
        name: isAr ? bot.nameAr : bot.nameEn,
        color: bot.color,
        isBot: true,
      };
    }
    return {
      id: pid,
      name: isAr ? 'لاعب' : 'Player',
      color: '#ffca3a',
      isBot: pid.startsWith('monopoly_bot_'),
    };
  };

  const activePlayerId =
    state.playerOrder[state.turnIndex % state.playerOrder.length] || state.playerOrder[0];
  const activeMeta = getPlayerMeta(activePlayerId);
  const isMyTurn =
    !activeMeta.isBot && (isPassAndPlay || activePlayerId === myPlayerId);
  const activeCash = state.cash[activePlayerId] ?? 0;
  const activeJailTurns = state.inJail[activePlayerId] || 0;

  const pushLog = (
    current: MonopolyLogItem[],
    ar: string,
    en: string
  ): MonopolyLogItem[] => [{ ar, en }, ...(current || [])].slice(0, 10);

  // Crown richest player helper
  const finishWithRichest = (draft: MonopolyGameState, reasonAr: string, reasonEn: string) => {
    const alive = draft.playerOrder.filter((pid) => !draft.bankruptIds.includes(pid));
    const ranked = (alive.length > 0 ? alive : draft.playerOrder)
      .map((pid) => ({ pid, worth: calculateNetWorth(draft, pid) }))
      .sort((a, b) => b.worth - a.worth);

    const topId = ranked[0]?.pid || draft.playerOrder[0];
    const topMeta = getPlayerMeta(topId);

    const finalState: MonopolyGameState = {
      ...draft,
      phase: 'game_over',
      winnerId: topId,
      pendingTrade: null,
      auctionState: null,
      eventLog: pushLog(
        draft.eventLog,
        `${reasonAr} — الفائز هو ${topMeta.name}!`,
        `${reasonEn} — Winner: ${topMeta.name}!`
      ),
    };

    const awards: Record<string, number> = {};
    ranked.forEach((item, idx) => {
      if (!item.pid.startsWith('monopoly_bot_')) {
        if (idx === 0) awards[item.pid] = 6;
        else if (idx === 1) awards[item.pid] = 3;
        else if (idx === 2) awards[item.pid] = 1;
      }
    });

    confetti({ particleCount: 130, spread: 95, origin: { y: 0.55 } });
    onUpdateGameData(finalState, awards);
  };

  // Resolve landing on any square
  const resolveLanding = (
    baseState: MonopolyGameState,
    pid: string,
    destIdx: number,
    diceTotal: number,
    logSoFar: MonopolyLogItem[]
  ): MonopolyGameState => {
    const space = BOARD_SPACES[destIdx];
    const pMeta = getPlayerMeta(pid);
    const next: MonopolyGameState = {
      ...baseState,
      cash: { ...baseState.cash },
      positions: { ...baseState.positions, [pid]: destIdx },
      owners: { ...baseState.owners },
      houses: { ...baseState.houses },
      inJail: { ...baseState.inJail },
      getOutOfJailCards: { ...baseState.getOutOfJailCards },
      lastCard: null,
      pendingSpaceIndex: null,
      eventLog: logSoFar,
    };

    setSelectedSpaceIdx(destIdx);

    if (space.kind === 'go') {
      next.phase = 'end_turn';
      return next;
    }

    if (space.kind === 'jail') {
      next.eventLog = pushLog(
        next.eventLog,
        `${pMeta.name} يمر بالسجن كزائر فقط.`,
        `${pMeta.name} is just visiting Jail.`
      );
      next.phase = 'end_turn';
      return next;
    }

    if (space.kind === 'tax') {
      const tax = space.price || 100;
      next.cash[pid] = (next.cash[pid] || 0) - tax;
      next.jackpot = (next.jackpot || 100) + tax;
      next.eventLog = pushLog(
        next.eventLog,
        `${pMeta.name} دفع ضريبة فخامة $${tax} (أُضيفت للموقف المجاني!).`,
        `${pMeta.name} paid $${tax} Luxury Tax into Free Parking!`
      );
      next.phase = 'end_turn';
      return next;
    }

    if (space.kind === 'parking') {
      const pot = next.jackpot || 100;
      next.cash[pid] = (next.cash[pid] || 0) + pot;
      next.jackpot = 100;
      next.eventLog = pushLog(
        next.eventLog,
        `ضربة معلّم! ${pMeta.name} حصد جائزة الموقف المجاني ($${pot})!`,
        `Jackpot! ${pMeta.name} collected $${pot} at Free Parking!`
      );
      next.phase = 'end_turn';
      return next;
    }

    if (space.kind === 'gotojail') {
      next.positions[pid] = 6;
      next.inJail[pid] = 3;
      next.hasExtraRoll = false;
      next.doublesCount = 0;
      next.eventLog = pushLog(
        next.eventLog,
        `صفّارة الشرطة! ${pMeta.name} أُرسل إلى السجن مباشرة!`,
        `Sirens! ${pMeta.name} was sent straight to Jail!`
      );
      next.phase = 'end_turn';
      return next;
    }

    if (space.kind === 'chance' || space.kind === 'chest') {
      const pool = SURPRISE_CARDS.filter((c) => c.deck === space.kind);
      const card = pool[Math.floor(Math.random() * pool.length)];
      next.lastCard = {
        deck: card.deck,
        titleAr: card.titleAr,
        titleEn: card.titleEn,
        descAr: card.descAr,
        descEn: card.descEn,
      };

      const eff = card.effect;
      if (eff.type === 'cash') {
        next.cash[pid] = (next.cash[pid] || 0) + eff.amount;
        next.eventLog = pushLog(
          next.eventLog,
          `${pMeta.name}: ${card.titleAr} (+$${eff.amount})`,
          `${pMeta.name}: ${card.titleEn} (+$${eff.amount})`
        );
        next.phase = 'end_turn';
        return next;
      }

      if (eff.type === 'tax_pot') {
        next.cash[pid] = (next.cash[pid] || 0) - eff.amount;
        next.jackpot = (next.jackpot || 100) + eff.amount;
        next.eventLog = pushLog(
          next.eventLog,
          `${pMeta.name}: ${card.titleAr} (-$${eff.amount})`,
          `${pMeta.name}: ${card.titleEn} (-$${eff.amount})`
        );
        next.phase = 'end_turn';
        return next;
      }

      if (eff.type === 'birthday') {
        let collected = 0;
        next.playerOrder.forEach((otherId) => {
          if (otherId !== pid && !next.bankruptIds.includes(otherId)) {
            next.cash[otherId] = (next.cash[otherId] || 0) - eff.perPlayer;
            collected += eff.perPlayer;
          }
        });
        next.cash[pid] = (next.cash[pid] || 0) + collected;
        next.eventLog = pushLog(
          next.eventLog,
          `عيد ميلاد ${pMeta.name}! جمع +$${collected} من الشلّة!`,
          `${pMeta.name}'s Birthday! Collected +$${collected} from everyone!`
        );
        next.phase = 'end_turn';
        return next;
      }

      if (eff.type === 'jail_card') {
        next.getOutOfJailCards[pid] = (next.getOutOfJailCards[pid] || 0) + 1;
        next.eventLog = pushLog(
          next.eventLog,
          `${pMeta.name} حصل على بطاقة خروج مجاني من السجن!`,
          `${pMeta.name} received a Get Out of Jail Free pass!`
        );
        next.phase = 'end_turn';
        return next;
      }

      if (eff.type === 'repairs') {
        let bill = 0;
        Object.entries(next.owners).forEach(([spIdxStr, owner]) => {
          if (owner === pid) {
            const h = next.houses[Number(spIdxStr)] || 0;
            if (h === 4) bill += eff.perHotel;
            else if (h > 0) bill += h * eff.perHouse;
          }
        });
        next.cash[pid] = (next.cash[pid] || 0) - bill;
        next.jackpot = (next.jackpot || 100) + bill;
        next.eventLog = pushLog(
          next.eventLog,
          `${pMeta.name} دفع صيانة عقارات $${bill}.`,
          `${pMeta.name} paid $${bill} in property repairs.`
        );
        next.phase = 'end_turn';
        return next;
      }

      if (eff.type === 'goto_go') {
        next.positions[pid] = 0;
        next.cash[pid] = (next.cash[pid] || 0) + 200;
        next.eventLog = pushLog(
          next.eventLog,
          `${pMeta.name} طار إلى انطلاق وقبض +$200!`,
          `${pMeta.name} flew to GO and collected +$200!`
        );
        next.phase = 'end_turn';
        return next;
      }

      if (eff.type === 'goto_jail') {
        next.positions[pid] = 6;
        next.inJail[pid] = 3;
        next.hasExtraRoll = false;
        next.doublesCount = 0;
        next.eventLog = pushLog(
          next.eventLog,
          `${pMeta.name}: ${card.titleAr}`,
          `${pMeta.name}: ${card.titleEn}`
        );
        next.phase = 'end_turn';
        return next;
      }

      if (eff.type === 'goto_space') {
        const passedGo = eff.spaceIndex < destIdx;
        if (passedGo) {
          next.cash[pid] = (next.cash[pid] || 0) + 200;
        }
        const cardLogs = pushLog(
          next.eventLog,
          `${pMeta.name}: ${card.titleAr}${passedGo ? ' (+$200 انطلاق)' : ''}`,
          `${pMeta.name}: ${card.titleEn}${passedGo ? ' (+$200 GO)' : ''}`
        );
        const jumped = resolveLanding(next, pid, eff.spaceIndex, diceTotal, cardLogs);
        jumped.lastCard = next.lastCard;
        return jumped;
      }
    }

    // Buyable space (Property, Airport, Utility)
    if (
      space.kind === 'property' ||
      space.kind === 'airport' ||
      space.kind === 'utility'
    ) {
      const ownerId = next.owners[destIdx];
      if (!ownerId) {
        next.phase = 'buy_or_auction';
        next.pendingSpaceIndex = destIdx;
        next.eventLog = pushLog(
          next.eventLog,
          `${pMeta.name} وصل إلى ${space.nameAr} ($${space.price}) — شراء أم مزاد؟`,
          `${pMeta.name} landed on ${space.nameEn} ($${space.price}) — Buy or Auction?`
        );
        return next;
      }

      if (ownerId === pid) {
        next.eventLog = pushLog(
          next.eventLog,
          `${pMeta.name} زار ملكه الخاص في ${space.nameAr}.`,
          `${pMeta.name} visited their own property ${space.nameEn}.`
        );
        next.phase = 'end_turn';
        return next;
      }

      // Pay rent if owner is not in jail? Classic rules allow rent even in jail; let's always pay rent for fast party action!
      const rent = calculateRent(space, next.owners, next.houses, diceTotal);
      const ownerMeta = getPlayerMeta(ownerId);
      next.cash[pid] = (next.cash[pid] || 0) - rent;
      next.cash[ownerId] = (next.cash[ownerId] || 0) + rent;
      next.eventLog = pushLog(
        next.eventLog,
        `${pMeta.name} دفع إيجار $${rent} إلى ${ownerMeta.name} في ${space.nameAr}!`,
        `${pMeta.name} paid $${rent} rent to ${ownerMeta.name} at ${space.nameEn}!`
      );
      next.phase = 'end_turn';
      return next;
    }

    next.phase = 'end_turn';
    return next;
  };

  // Roll Dice Action
  const handleRollDice = (payJailBail = false, useJailPass = false) => {
    if (state.phase !== 'roll' || rollingAnim) return;
    setRollingAnim(true);

    window.setTimeout(() => {
      setRollingAnim(false);
      const d1 = Math.floor(Math.random() * 6) + 1;
      const d2 = Math.floor(Math.random() * 6) + 1;
      const isDoubles = d1 === d2;
      const total = d1 + d2;
      const pid = activePlayerId;
      const pMeta = getPlayerMeta(pid);

      let working: MonopolyGameState = {
        ...state,
        cash: { ...state.cash },
        positions: { ...state.positions },
        inJail: { ...state.inJail },
        getOutOfJailCards: { ...state.getOutOfJailCards },
        lastDice: [d1, d2],
        lastCard: null,
        pendingTrade: null,
      };

      let logs = [...(working.eventLog || [])];
      const jailTurns = working.inJail[pid] || 0;

      // Handle Jail Exit
      if (jailTurns > 0) {
        if (useJailPass && (working.getOutOfJailCards[pid] || 0) > 0) {
          working.getOutOfJailCards[pid] -= 1;
          working.inJail[pid] = 0;
          logs = pushLog(
            logs,
            `${pMeta.name} استخدم بطاقة الخروج المجاني من السجن!`,
            `${pMeta.name} used a Get Out of Jail Free pass!`
          );
        } else if (payJailBail) {
          working.cash[pid] = (working.cash[pid] || 0) - 50;
          working.jackpot = (working.jackpot || 100) + 50;
          working.inJail[pid] = 0;
          logs = pushLog(
            logs,
            `${pMeta.name} دفع كفالة $50 وخرج من السجن.`,
            `${pMeta.name} paid $50 bail and exited Jail.`
          );
        } else if (isDoubles) {
          working.inJail[pid] = 0;
          logs = pushLog(
            logs,
            `يا حظك! ${pMeta.name} رمى دبل (${d1}-${d2}) وخرج من السجن مجاناً!`,
            `Lucky! ${pMeta.name} rolled doubles (${d1}-${d2}) and escaped Jail!`
          );
        } else if (jailTurns > 1) {
          working.inJail[pid] = jailTurns - 1;
          working.hasExtraRoll = false;
          working.doublesCount = 0;
          working.phase = 'end_turn';
          working.eventLog = pushLog(
            logs,
            `${pMeta.name} رمى (${d1}+${d2}) ولم يحالفه الدبل للخروج من السجن.`,
            `${pMeta.name} rolled (${d1}+${d2}) — still in Jail.`
          );
          onUpdateGameData(working);
          return;
        } else {
          // 3rd turn in jail: mandatory $50 bail and move
          working.cash[pid] = (working.cash[pid] || 0) - 50;
          working.jackpot = (working.jackpot || 100) + 50;
          working.inJail[pid] = 0;
          logs = pushLog(
            logs,
            `انتهت مدة التوقيف: ${pMeta.name} دفع $50 كفالة وانطلق!`,
            `${pMeta.name} paid mandatory $50 bail on turn 3 and moved!`
          );
        }
      }

      // Check 3 consecutive doubles -> Speeding to Jail
      const nextDoublesCount = isDoubles ? (working.doublesCount || 0) + 1 : 0;
      if (nextDoublesCount >= 3) {
        working.positions[pid] = 6;
        working.inJail[pid] = 3;
        working.doublesCount = 0;
        working.hasExtraRoll = false;
        working.moveSeq = (working.moveSeq || 0) + 1;
        working.lastMoverId = pid;
        working.lastMovePath = [6];
        working.phase = 'end_turn';
        working.eventLog = pushLog(
          logs,
          `3 مرات دبل متتالية! ${pMeta.name} أُرسل للسجن بتهمة السرعة!`,
          `3 Doubles in a row! ${pMeta.name} sped straight to Jail!`
        );
        onUpdateGameData(working);
        return;
      }

      working.doublesCount = nextDoublesCount;
      working.hasExtraRoll = isDoubles && jailTurns === 0;

      const startPos = working.positions[pid] || 0;
      const hopPath: number[] = [];
      let passedGo = false;
      for (let step = 1; step <= total; step++) {
        const sq = (startPos + step) % 24;
        if (sq === 0) passedGo = true;
        hopPath.push(sq);
      }
      const finalSq = (startPos + total) % 24;

      if (passedGo) {
        working.cash[pid] = (working.cash[pid] || 0) + 200;
        logs = pushLog(
          logs,
          `${pMeta.name} عبر خانة انطلاق وقبض راتب +$200!`,
          `${pMeta.name} passed GO and collected +$200!`
        );
      }

      working.moveSeq = (working.moveSeq || 0) + 1;
      working.lastMoverId = pid;
      working.lastMovePath = hopPath;

      const afterLanding = resolveLanding(working, pid, finalSq, total, logs);
      onUpdateGameData(afterLanding);
    }, 340);
  };

  // Buy Pending Property
  const handleBuyProperty = () => {
    if (state.phase !== 'buy_or_auction' || state.pendingSpaceIndex === null) return;
    const sp = BOARD_SPACES[state.pendingSpaceIndex];
    const price = sp.price || 0;
    if ((state.cash[activePlayerId] || 0) < price) return;

    const pMeta = getPlayerMeta(activePlayerId);
    const nextOwners = { ...state.owners, [sp.index]: activePlayerId };
    const completedSet = ownsFullGroup(nextOwners, activePlayerId, sp.group);

    const nextState: MonopolyGameState = {
      ...state,
      cash: {
        ...state.cash,
        [activePlayerId]: (state.cash[activePlayerId] || 0) - price,
      },
      owners: nextOwners,
      pendingSpaceIndex: null,
      phase: 'end_turn',
      eventLog: pushLog(
        state.eventLog,
        `${pMeta.name} اشترى ${sp.nameAr} مقابل $${price}${
          completedSet ? ' وأكمل المجموعة اللونية بالكامل!' : '!'
        }`,
        `${pMeta.name} bought ${sp.nameEn} for $${price}${
          completedSet ? ' and completed the full color set!' : '!'
        }`
      ),
    };
    onUpdateGameData(nextState);
  };

  // Start Quick Live Auction
  const handleStartAuction = () => {
    if (state.phase !== 'buy_or_auction' || state.pendingSpaceIndex === null) return;
    const sp = BOARD_SPACES[state.pendingSpaceIndex];
    const startBid = Math.max(20, Math.floor((sp.price || 100) * 0.5));
    const eligible = state.playerOrder.filter(
      (pid) => !state.bankruptIds.includes(pid) && (state.cash[pid] || 0) >= startBid
    );

    if (eligible.length === 0) {
      onUpdateGameData({
        ...state,
        pendingSpaceIndex: null,
        phase: 'end_turn',
        eventLog: pushLog(
          state.eventLog,
          `لم يملك أحد سيولة للمزايدة على ${sp.nameAr}.`,
          `No one had enough cash to bid on ${sp.nameEn}.`
        ),
      });
      return;
    }

    onUpdateGameData({
      ...state,
      phase: 'auction',
      auctionState: {
        spaceIndex: sp.index,
        currentBid: startBid - 20,
        highestBidderId: null,
        activeBidderIds: eligible,
        turnBidderIndex: 0,
      },
      eventLog: pushLog(
        state.eventLog,
        `انطلق مزاد علني حامي على ${sp.nameAr}!`,
        `Live auction started for ${sp.nameEn}!`
      ),
    });
  };

  // Bid or Pass in Auction
  const handleAuctionAction = (raiseAmount: number | 'pass') => {
    const auc = state.auctionState;
    if (state.phase !== 'auction' || !auc) return;
    const sp = BOARD_SPACES[auc.spaceIndex];
    const currentBidderId =
      auc.activeBidderIds[auc.turnBidderIndex % auc.activeBidderIds.length];
    const bidderMeta = getPlayerMeta(currentBidderId);

    if (raiseAmount === 'pass') {
      const remaining = auc.activeBidderIds.filter((id) => id !== currentBidderId);

      if (remaining.length === 0) {
        if (auc.highestBidderId) {
          const winMeta = getPlayerMeta(auc.highestBidderId);
          onUpdateGameData({
            ...state,
            cash: {
              ...state.cash,
              [auc.highestBidderId]:
                (state.cash[auc.highestBidderId] || 0) - auc.currentBid,
            },
            owners: { ...state.owners, [sp.index]: auc.highestBidderId },
            auctionState: null,
            pendingSpaceIndex: null,
            phase: 'end_turn',
            eventLog: pushLog(
              state.eventLog,
              `حُسم المزاد! ${winMeta.name} اقتنص ${sp.nameAr} بـ $${auc.currentBid}!`,
              `Sold! ${winMeta.name} won ${sp.nameEn} at auction for $${auc.currentBid}!`
            ),
          });
        } else {
          onUpdateGameData({
            ...state,
            auctionState: null,
            pendingSpaceIndex: null,
            phase: 'end_turn',
            eventLog: pushLog(
              state.eventLog,
              `انتهى المزاد على ${sp.nameAr} دون مشترٍ.`,
              `Auction for ${sp.nameEn} ended with no buyer.`
            ),
          });
        }
        return;
      }

      if (remaining.length === 1 && auc.highestBidderId === remaining[0]) {
        const winId = remaining[0];
        const winMeta = getPlayerMeta(winId);
        onUpdateGameData({
          ...state,
          cash: {
            ...state.cash,
            [winId]: (state.cash[winId] || 0) - auc.currentBid,
          },
          owners: { ...state.owners, [sp.index]: winId },
          auctionState: null,
          pendingSpaceIndex: null,
          phase: 'end_turn',
          eventLog: pushLog(
            state.eventLog,
            `حُسم المزاد! ${winMeta.name} فاز بـ ${sp.nameAr} مقابل $${auc.currentBid}!`,
            `Hammer down! ${winMeta.name} won ${sp.nameEn} for $${auc.currentBid}!`
          ),
        });
        return;
      }

      onUpdateGameData({
        ...state,
        auctionState: {
          ...auc,
          activeBidderIds: remaining,
          turnBidderIndex: auc.turnBidderIndex % remaining.length,
        },
        eventLog: pushLog(
          state.eventLog,
          `${bidderMeta.name} انسحب من المزاد.`,
          `${bidderMeta.name} passed in the auction.`
        ),
      });
      return;
    }

    const nextBid = auc.currentBid + raiseAmount;
    if ((state.cash[currentBidderId] || 0) < nextBid) return;

    if (auc.activeBidderIds.length === 1) {
      onUpdateGameData({
        ...state,
        cash: {
          ...state.cash,
          [currentBidderId]: (state.cash[currentBidderId] || 0) - nextBid,
        },
        owners: { ...state.owners, [sp.index]: currentBidderId },
        auctionState: null,
        pendingSpaceIndex: null,
        phase: 'end_turn',
        eventLog: pushLog(
          state.eventLog,
          `${bidderMeta.name} اشترى ${sp.nameAr} بالمزاد بـ $${nextBid}!`,
          `${bidderMeta.name} won ${sp.nameEn} at auction for $${nextBid}!`
        ),
      });
      return;
    }

    onUpdateGameData({
      ...state,
      auctionState: {
        ...auc,
        currentBid: nextBid,
        highestBidderId: currentBidderId,
        turnBidderIndex: (auc.turnBidderIndex + 1) % auc.activeBidderIds.length,
      },
      eventLog: pushLog(
        state.eventLog,
        `${bidderMeta.name} رفع المزاد على ${sp.nameAr} إلى $${nextBid}!`,
        `${bidderMeta.name} raised the bid on ${sp.nameEn} to $${nextBid}!`
      ),
    });
  };

  // Build House / Royal Hotel
  const handleBuildOnSpace = (spaceIndex: number) => {
    const sp = BOARD_SPACES[spaceIndex];
    if (
      sp.kind !== 'property' ||
      !sp.houseCost ||
      state.owners[spaceIndex] !== activePlayerId ||
      !ownsFullGroup(state.owners, activePlayerId, sp.group)
    ) {
      return;
    }
    const curLevel = state.houses[spaceIndex] || 0;
    if (curLevel >= 4 || (state.cash[activePlayerId] || 0) < sp.houseCost) return;

    const pMeta = getPlayerMeta(activePlayerId);
    const nextLevel = curLevel + 1;
    onUpdateGameData({
      ...state,
      cash: {
        ...state.cash,
        [activePlayerId]: (state.cash[activePlayerId] || 0) - sp.houseCost,
      },
      houses: {
        ...state.houses,
        [spaceIndex]: nextLevel,
      },
      eventLog: pushLog(
        state.eventLog,
        nextLevel === 4
          ? `${pMeta.name} شيّد فندقاً ملكياً فاخراً في ${sp.nameAr}!`
          : `${pMeta.name} بنى بيتاً (${nextLevel}/3) في ${sp.nameAr}!`,
        nextLevel === 4
          ? `${pMeta.name} built a Royal Hotel in ${sp.nameEn}!`
          : `${pMeta.name} built house #${nextLevel} in ${sp.nameEn}!`
      ),
    });
  };

  // Sell Building or Deed back to Bank (50% value — especially useful for clearing debt!)
  const handleLiquidateSpace = (spaceIndex: number) => {
    const sp = BOARD_SPACES[spaceIndex];
    if (state.owners[spaceIndex] !== activePlayerId || !sp.price) return;
    const pMeta = getPlayerMeta(activePlayerId);
    const curHouses = state.houses[spaceIndex] || 0;

    if (curHouses > 0 && sp.houseCost) {
      const refund = Math.floor(sp.houseCost * 0.5);
      onUpdateGameData({
        ...state,
        cash: {
          ...state.cash,
          [activePlayerId]: (state.cash[activePlayerId] || 0) + refund,
        },
        houses: {
          ...state.houses,
          [spaceIndex]: curHouses - 1,
        },
        eventLog: pushLog(
          state.eventLog,
          `${pMeta.name} باع مبنى في ${sp.nameAr} واسترد +$${refund}.`,
          `${pMeta.name} sold a building in ${sp.nameEn} for +$${refund}.`
        ),
      });
      return;
    }

    const deedRefund = Math.floor(sp.price * 0.5);
    const nextOwners = { ...state.owners };
    delete nextOwners[spaceIndex];
    onUpdateGameData({
      ...state,
      cash: {
        ...state.cash,
        [activePlayerId]: (state.cash[activePlayerId] || 0) + deedRefund,
      },
      owners: nextOwners,
      eventLog: pushLog(
        state.eventLog,
        `${pMeta.name} باع صك ${sp.nameAr} للبنك مقابل +$${deedRefund}.`,
        `${pMeta.name} liquidated ${sp.nameEn} to the bank for +$${deedRefund}.`
      ),
    });
  };

  // End Turn or Declare Bankruptcy
  const handleEndTurn = () => {
    if (state.phase !== 'end_turn') return;
    const pid = activePlayerId;
    const pMeta = getPlayerMeta(pid);

    // Extra turn on Doubles (if solvent and not in jail)
    if (state.hasExtraRoll && (state.cash[pid] || 0) >= 0 && !state.inJail[pid]) {
      onUpdateGameData({
        ...state,
        phase: 'roll',
        hasExtraRoll: false,
        eventLog: pushLog(
          state.eventLog,
          `دبل! ${pMeta.name} يحصل على رمية إضافية!`,
          `Doubles! ${pMeta.name} gets a bonus roll!`
        ),
      });
      return;
    }

    let nextBankrupt = [...state.bankruptIds];
    const nextOwners = { ...state.owners };
    const nextHouses = { ...state.houses };

    if ((state.cash[pid] || 0) < 0) {
      nextBankrupt.push(pid);
      Object.keys(nextOwners).forEach((k) => {
        const idx = Number(k);
        if (nextOwners[idx] === pid) {
          delete nextOwners[idx];
          delete nextHouses[idx];
        }
      });
    }

    const alive = state.playerOrder.filter((id) => !nextBankrupt.includes(id));
    if (alive.length <= 1) {
      const updatedDraft: MonopolyGameState = {
        ...state,
        bankruptIds: nextBankrupt,
        owners: nextOwners,
        houses: nextHouses,
      };
      finishWithRichest(
        updatedDraft,
        'أفلس جميع المنافسين وبقي إمبراطور واحد',
        'All rivals went bankrupt — one tycoon stands supreme'
      );
      return;
    }

    // Advance turnIndex to next non-bankrupt player
    let nextIdx = state.turnIndex;
    let wrappedRound = false;
    for (let step = 1; step <= state.playerOrder.length; step++) {
      const candidateIdx = (state.turnIndex + step) % state.playerOrder.length;
      if (candidateIdx <= state.turnIndex) wrappedRound = true;
      const candId = state.playerOrder[candidateIdx];
      if (!nextBankrupt.includes(candId)) {
        nextIdx = candidateIdx;
        break;
      }
    }

    const nextRound = wrappedRound ? state.roundNumber + 1 : state.roundNumber;
    const draft: MonopolyGameState = {
      ...state,
      bankruptIds: nextBankrupt,
      owners: nextOwners,
      houses: nextHouses,
      turnIndex: nextIdx,
      roundNumber: nextRound,
      phase: 'roll',
      doublesCount: 0,
      hasExtraRoll: false,
      pendingTrade: null,
      eventLog:
        (state.cash[pid] || 0) < 0
          ? pushLog(
              state.eventLog,
              `أعلن ${pMeta.name} إفلاسه وعادت أملاكه للبنك!`,
              `${pMeta.name} went bankrupt and returned all deeds to the bank!`
            )
          : state.eventLog,
    };

    if (draft.mode === 'quick20' && nextRound > draft.maxRounds) {
      finishWithRichest(
        draft,
        `انتهت الـ ${draft.maxRounds} جولة وحان وقت حساب الثروات`,
        `All ${draft.maxRounds} rounds completed — counting net worth`
      );
      return;
    }

    onUpdateGameData(draft);
  };

  // Submit Trade Proposal
  const handleSendTrade = () => {
    if (!tradeTargetId || tradeTargetId === activePlayerId) return;
    if (
      tradeOfferSpace === null &&
      tradeRequestSpace === null &&
      tradeOfferCash === 0 &&
      tradeRequestCash === 0
    ) {
      return;
    }

    const offer: MonopolyTradeOffer = {
      fromId: activePlayerId,
      toId: tradeTargetId,
      offerSpaceIndex: tradeOfferSpace,
      offerCash: Math.max(0, Math.min(state.cash[activePlayerId] || 0, tradeOfferCash)),
      requestSpaceIndex: tradeRequestSpace,
      requestCash: Math.max(0, Math.min(state.cash[tradeTargetId] || 0, tradeRequestCash)),
    };

    const targetMeta = getPlayerMeta(tradeTargetId);
    const fromMeta = getPlayerMeta(activePlayerId);

    // Instant Smart Bot evaluation if trading with a Bot!
    if (targetMeta.isBot) {
      const givenValue =
        offer.offerCash +
        (offer.offerSpaceIndex !== null
          ? BOARD_SPACES[offer.offerSpaceIndex].price || 0
          : 0);
      const askedSp =
        offer.requestSpaceIndex !== null ? BOARD_SPACES[offer.requestSpaceIndex] : null;
      const askedBreaksBotSet =
        askedSp && ownsFullGroup(state.owners, tradeTargetId, askedSp.group);
      const askedValue =
        offer.requestCash +
        (askedSp ? (askedSp.price || 0) * (askedBreaksBotSet ? 1.65 : 1.05) : 0);

      setShowTradeDrawer(false);

      if (givenValue >= askedValue && (state.cash[tradeTargetId] || 0) >= offer.requestCash) {
        executeAcceptedTrade(offer);
      } else {
        onUpdateGameData({
          ...state,
          eventLog: pushLog(
            state.eventLog,
            `رفض ${targetMeta.name} عرض التبادل من ${fromMeta.name} (يريد عرضاً أسخى!).`,
            `${targetMeta.name} declined ${fromMeta.name}'s trade offer.`
          ),
        });
      }
      return;
    }

    setShowTradeDrawer(false);
    onUpdateGameData({
      ...state,
      pendingTrade: offer,
      eventLog: pushLog(
        state.eventLog,
        `${fromMeta.name} أرسل عرض صفقة تبادل إلى ${targetMeta.name}!`,
        `${fromMeta.name} sent a trade proposal to ${targetMeta.name}!`
      ),
    });
  };

  const executeAcceptedTrade = (offer: MonopolyTradeOffer) => {
    const nextOwners = { ...state.owners };
    const nextCash = { ...state.cash };

    if (offer.offerSpaceIndex !== null && nextOwners[offer.offerSpaceIndex] === offer.fromId) {
      nextOwners[offer.offerSpaceIndex] = offer.toId;
    }
    if (
      offer.requestSpaceIndex !== null &&
      nextOwners[offer.requestSpaceIndex] === offer.toId
    ) {
      nextOwners[offer.requestSpaceIndex] = offer.fromId;
    }

    nextCash[offer.fromId] =
      (nextCash[offer.fromId] || 0) - offer.offerCash + offer.requestCash;
    nextCash[offer.toId] =
      (nextCash[offer.toId] || 0) + offer.offerCash - offer.requestCash;

    const fromMeta = getPlayerMeta(offer.fromId);
    const toMeta = getPlayerMeta(offer.toId);

    onUpdateGameData({
      ...state,
      cash: nextCash,
      owners: nextOwners,
      pendingTrade: null,
      eventLog: pushLog(
        state.eventLog,
        `تمت الصفقة بنجاح بين ${fromMeta.name} و${toMeta.name}!`,
        `Trade completed between ${fromMeta.name} and ${toMeta.name}!`
      ),
    });
  };

  // Automatic Smart Bot Driver (runs on Host / Pass-and-Play)
  useEffect(() => {
    if (!isHost && !isPassAndPlay) return;
    if (state.phase === 'game_over' || rollingAnim) return;

    // 1. Auction Bot Turn
    if (state.phase === 'auction' && state.auctionState) {
      const auc = state.auctionState;
      const bidderId =
        auc.activeBidderIds[auc.turnBidderIndex % auc.activeBidderIds.length];
      const meta = getPlayerMeta(bidderId);
      if (!meta.isBot) return;

      const timer = window.setTimeout(() => {
        const sp = BOARD_SPACES[auc.spaceIndex];
        const basePrice = sp.price || 120;
        const completesPair =
          sp.group &&
          GROUP_SPACES[sp.group].some(
            (idx) => idx !== sp.index && state.owners[idx] === bidderId
          );
        const maxWilling = Math.min(
          (state.cash[bidderId] || 0) - 80,
          Math.floor(basePrice * (completesPair ? 1.3 : 1.05))
        );
        if (auc.currentBid + 20 <= maxWilling && auc.highestBidderId !== bidderId) {
          handleAuctionAction(20);
        } else {
          handleAuctionAction('pass');
        }
      }, 650);
      return () => window.clearTimeout(timer);
    }

    // 2. Active Turn Bot
    if (!activeMeta.isBot) return;

    const timer = window.setTimeout(() => {
      if (state.phase === 'roll') {
        const jailTurns = state.inJail[activePlayerId] || 0;
        if (jailTurns > 0) {
          if ((state.getOutOfJailCards[activePlayerId] || 0) > 0) {
            handleRollDice(false, true);
          } else if ((state.cash[activePlayerId] || 0) >= 260) {
            handleRollDice(true, false);
          } else {
            handleRollDice(false, false);
          }
        } else {
          handleRollDice(false, false);
        }
        return;
      }

      if (state.phase === 'buy_or_auction' && state.pendingSpaceIndex !== null) {
        const sp = BOARD_SPACES[state.pendingSpaceIndex];
        const price = sp.price || 0;
        if ((state.cash[activePlayerId] || 0) >= price + 60) {
          handleBuyProperty();
        } else {
          handleStartAuction();
        }
        return;
      }

      if (state.phase === 'end_turn') {
        // Liquidate if negative cash
        if ((state.cash[activePlayerId] || 0) < 0) {
          const ownedIdx = BOARD_SPACES.find(
            (s) => state.owners[s.index] === activePlayerId && s.price
          )?.index;
          if (ownedIdx !== undefined) {
            handleLiquidateSpace(ownedIdx);
            return;
          }
        } else {
          // Build a house if bot owns a full group and has healthy cash Cushion!
          const buildable = BOARD_SPACES.find(
            (s) =>
              s.kind === 'property' &&
              s.houseCost &&
              state.owners[s.index] === activePlayerId &&
              ownsFullGroup(state.owners, activePlayerId, s.group) &&
              (state.houses[s.index] || 0) < 4 &&
              (state.cash[activePlayerId] || 0) >= s.houseCost + 220
          );
          if (buildable) {
            handleBuildOnSpace(buildable.index);
            return;
          }
        }
        handleEndTurn();
      }
    }, 850);

    return () => window.clearTimeout(timer);
  }, [
    state.phase,
    state.turnIndex,
    state.moveSeq,
    state.auctionState?.turnBidderIndex,
    state.auctionState?.currentBid,
     state.cash[activePlayerId],
    rollingAnim,
    isHost,
    isPassAndPlay,
  ]);

  const inspectedSpace = BOARD_SPACES[selectedSpaceIdx] || BOARD_SPACES[23];
  const inspectedOwnerId = state.owners[inspectedSpace.index];
  const inspectedOwnerMeta = inspectedOwnerId ? getPlayerMeta(inspectedOwnerId) : null;
  const inspectedHouses = state.houses[inspectedSpace.index] || 0;
  const canBuildInspected =
    isMyTurn &&
    (state.phase === 'roll' || state.phase === 'end_turn') &&
    inspectedSpace.kind === 'property' &&
    inspectedOwnerId === activePlayerId &&
    ownsFullGroup(state.owners, activePlayerId, inspectedSpace.group) &&
    inspectedHouses < 4 &&
    (state.cash[activePlayerId] || 0) >= (inspectedSpace.houseCost || 9999);

  const canSellInspected =
    isMyTurn &&
    (state.phase === 'roll' || state.phase === 'end_turn') &&
    inspectedOwnerId === activePlayerId &&
    !!inspectedSpace.price;

  const myProperties = BOARD_SPACES.filter(
    (s) => state.owners[s.index] === activePlayerId && s.price
  );
  const targetProperties = BOARD_SPACES.filter(
    (s) => tradeTargetId && state.owners[s.index] === tradeTargetId && s.price
  );

  return (
    <div
      dir={isAr ? 'rtl' : 'ltr'}
      className="w-full space-y-3.5 select-none [overflow-anchor:none]"
    >
      {/* Top Status & Mode Header */}
      <div className="cartoon-card p-3.5 md:p-4 flex flex-wrap items-center justify-between gap-3 bg-[#fffdf7]">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-[#ffca3a] border-2 border-[#161426] shadow-[0_3px_0_#161426] flex items-center justify-center">
            <Crown weight="fill" className="w-6 h-6 text-[#161426]" />
          </div>
          <div>
            <div className="text-base md:text-lg font-black text-[#161426] leading-tight">
              {isAr ? 'مونوبولي الشلّة — عواصم العرب' : 'Shilla Monopoly — Arab Capitals'}
            </div>
            <div className="text-xs font-extrabold text-[#5e5a7d] flex flex-wrap items-center gap-2">
              <span>
                {state.mode === 'quick20'
                  ? isAr
                    ? `الجولة ${Math.min(state.roundNumber, state.maxRounds)} من ${state.maxRounds}`
                    : `Round ${Math.min(state.roundNumber, state.maxRounds)} / ${state.maxRounds}`
                  : isAr
                  ? `الطور الكلاسيكي — الجولة ${state.roundNumber}`
                  : `Classic Mode — Round ${state.roundNumber}`}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-[#ffca3a]/40 text-[#161426] border border-[#161426]/30">
                {isAr
                  ? `جائزة الموقف: $${state.jackpot}`
                  : `Free Parking Pot: $${state.jackpot}`}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isHost && state.phase !== 'game_over' && (
            <>
              <button
                type="button"
                onClick={() =>
                  onUpdateGameData({
                    ...state,
                    mode: state.mode === 'quick20' ? 'classic' : 'quick20',
                  })
                }
                className="cartoon-btn bg-[#242038] text-white px-3 py-1.5 text-xs font-extrabold"
              >
                {state.mode === 'quick20'
                  ? isAr
                    ? 'النظام: 20 جولة سريعة'
                    : 'Mode: Quick 20 Rounds'
                  : isAr
                  ? 'النظام: كلاسيك مفتوح'
                  : 'Mode: Classic Endless'}
              </button>

              {state.roundNumber >= 2 && (
                <button
                  type="button"
                  onClick={() =>
                    finishWithRichest(
                      state,
                      'حسم المضيف البطولة بحساب صافي الثروة',
                      'Host concluded the match by total Net Worth'
                    )
                  }
                  className="cartoon-btn bg-[#ffca3a] text-[#161426] px-3 py-1.5 text-xs font-extrabold flex items-center gap-1"
                >
                  <Trophy weight="fill" className="w-4 h-4" />
                  <span>{isAr ? 'تتويج الأغنى الآن' : 'Crown Richest Now'}</span>
                </button>
              )}
            </>
          )}

          {isHost && (
            <button
              type="button"
              onClick={onStartNewRound}
              className="cartoon-btn bg-white text-[#161426] px-3 py-1.5 text-xs font-extrabold flex items-center gap-1"
            >
              <ArrowsClockwise weight="bold" className="w-4 h-4" />
              <span>{isAr ? 'لعبة جديدة' : 'Reset'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Tycoon Wealth Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {state.playerOrder.map((pid) => {
          const meta = getPlayerMeta(pid);
          const isTurn = pid === activePlayerId && state.phase !== 'game_over';
          const isBankrupt = state.bankruptIds.includes(pid);
          const worth = calculateNetWorth(state, pid);
          const deedCount = Object.values(state.owners).filter((o) => o === pid).length;
          return (
            <div
              key={pid}
              className={`rounded-2xl border-3 border-[#161426] p-2.5 transition-all ${
                isBankrupt
                  ? 'bg-gray-200 opacity-55'
                  : isTurn
                  ? 'bg-[#ffca3a] shadow-[0_4px_0_#161426] -translate-y-0.5'
                  : 'bg-[#fffdf7] shadow-[0_2px_0_#161426]'
              }`}
            >
              <div className="flex items-center justify-between gap-1.5">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span
                    className="w-4 h-4 rounded-full border-2 border-[#161426] shrink-0"
                    style={{ backgroundColor: meta.color }}
                  />
                  <span className="font-black text-xs text-[#161426] truncate">
                    {meta.name}
                  </span>
                </div>
                {meta.isBot && <Robot weight="fill" className="w-3.5 h-3.5 text-[#161426]" />}
              </div>
              <div className="mt-1 flex items-baseline justify-between">
                <span
                  className={`font-black text-sm ${
                    (state.cash[pid] || 0) < 0 ? 'text-[#ff595e]' : 'text-[#161426]'
                  }`}
                >
                  ${state.cash[pid] ?? 0}
                </span>
                <span className="text-[10px] font-extrabold text-[#3f3b5c]">
                  {isBankrupt
                    ? isAr
                      ? 'مفلس'
                      : 'OUT'
                    : isAr
                    ? `${deedCount} أملاك • ثروة $${worth}`
                    : `${deedCount} deeds • $${worth}`}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Layout: 7x7 Square Monopoly Board + Side Property Inspector */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
        {/* 7x7 PERIMETER BOARD (Forced LTR grid coordinates so clockwise never flips!) */}
        <div className="xl:col-span-8 cartoon-card p-2.5 sm:p-4 bg-[#d8f3dc] border-4 border-[#161426] shadow-[0_8px_0_#161426]">
          <div
            dir="ltr"
            className="grid grid-cols-7 grid-rows-7 gap-1.5 sm:gap-2 h-[540px] sm:h-[650px] lg:h-[740px] w-full"
          >
            {BOARD_SPACES.map((sp) => {
              const ownerId = state.owners[sp.index];
              const ownerMeta = ownerId ? getPlayerMeta(ownerId) : null;
              const houseLvl = state.houses[sp.index] || 0;
              const isSelected = selectedSpaceIdx === sp.index;
              const pawnsHere = state.playerOrder.filter(
                (pid) =>
                  !state.bankruptIds.includes(pid) &&
                  (visualPositions[pid] ?? state.positions[pid] ?? 0) === sp.index
              );

              return (
                <button
                  key={sp.index}
                  type="button"
                  onClick={() => setSelectedSpaceIdx(sp.index)}
                  style={{
                    gridColumn: sp.gridCol,
                    gridRow: sp.gridRow,
                  }}
                  className={`relative rounded-xl sm:rounded-2xl border-3 border-[#161426] flex flex-col justify-between overflow-hidden text-center p-1 sm:p-1.5 transition-transform shadow-[0_3px_0_#161426] ${
                    isSelected
                      ? 'ring-4 ring-[#ffca3a] scale-[1.03] z-10 bg-white'
                      : sp.kind === 'go' ||
                        sp.kind === 'jail' ||
                        sp.kind === 'parking' ||
                        sp.kind === 'gotojail'
                      ? 'bg-[#fff3b0]'
                      : 'bg-[#fffdf7] hover:bg-white'
                  }`}
                >
                  {/* Color Band for Properties / Airports / Utility */}
                  {sp.colorHex ? (
                    <div
                      className="w-full h-3.5 sm:h-5 rounded-t-lg border-b-2 border-[#161426] flex items-center justify-center px-1 shrink-0"
                      style={{ backgroundColor: sp.colorHex }}
                    >
                      <BuildingBadgeSvg level={houseLvl} />
                    </div>
                  ) : (
                    <div className="pt-1 flex justify-center shrink-0">
                      <SpaceSpecialSvg kind={sp.kind} />
                    </div>
                  )}

                  {/* City / Tile Name */}
                  <div
                    dir={isAr ? 'rtl' : 'ltr'}
                    className="font-black text-[10px] sm:text-xs md:text-sm leading-tight text-[#161426] px-0.5 line-clamp-2 my-auto"
                  >
                    {isAr ? sp.nameAr : sp.nameEn}
                  </div>

                  {/* Price or Owner Ribbon */}
                  <div className="w-full flex items-center justify-center gap-0.5 pb-0.5">
                    {ownerMeta ? (
                      <span
                        className="px-2 py-0.5 rounded-full text-[9px] sm:text-[11px] font-black text-white border-2 border-[#161426] truncate max-w-full shadow-[0_1px_0_#161426]"
                        style={{ backgroundColor: ownerMeta.color }}
                      >
                        {ownerMeta.name.slice(0, 8)}
                      </span>
                    ) : sp.price ? (
                      <span className="px-1.5 py-0.2 rounded bg-[#161426]/10 text-[9px] sm:text-xs font-black text-[#161426]">
                        ${sp.price}
                      </span>
                    ) : null}
                  </div>

                  {/* Player Pawns on this Square */}
                  {pawnsHere.length > 0 && (
                    <div className="absolute inset-x-0.5 bottom-4 sm:bottom-5 flex flex-wrap items-center justify-center gap-1 pointer-events-none">
                      {pawnsHere.map((pid) => {
                        const pm = getPlayerMeta(pid);
                        return (
                          <span
                            key={pid}
                            className="w-4.5 h-4.5 sm:w-6 sm:h-6 rounded-full border-2 border-[#161426] shadow-[0_2px_0_#161426] flex items-center justify-center text-[9px] sm:text-[11px] font-black text-white"
                            style={{ backgroundColor: pm.color }}
                          >
                            {pm.name.slice(0, 1)}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </button>
              );
            })}

            {/* 5x5 CENTER COMMAND CONSOLE */}
            <div
              dir={isAr ? 'rtl' : 'ltr'}
              style={{ gridColumn: '2 / 7', gridRow: '2 / 7' }}
              className="rounded-2xl border-3 border-[#161426] bg-[#1b1830] text-white p-2.5 sm:p-4 flex flex-col justify-between overflow-y-auto shadow-inner"
            >
              {/* GAME OVER PODIUM */}
              {state.phase === 'game_over' ? (
                <div className="my-auto text-center space-y-3 py-2">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-[#ffca3a] border-3 border-[#161426] flex items-center justify-center shadow-[0_4px_0_#161426]">
                    <Trophy weight="fill" className="w-9 h-9 text-[#161426]" />
                  </div>
                  <div className="text-lg sm:text-2xl font-black text-[#ffca3a]">
                    {isAr
                      ? `إمبراطور العقارات: ${getPlayerMeta(state.winnerId || activePlayerId).name}!`
                      : `Real Estate Champion: ${getPlayerMeta(state.winnerId || activePlayerId).name}!`}
                  </div>
                  <div className="space-y-1 max-w-xs mx-auto">
                    {[...state.playerOrder]
                      .sort((a, b) => calculateNetWorth(state, b) - calculateNetWorth(state, a))
                      .map((pid, idx) => {
                        const m = getPlayerMeta(pid);
                        return (
                          <div
                            key={pid}
                            className="flex items-center justify-between bg-white/10 rounded-xl px-3 py-1.5 text-xs font-extrabold"
                          >
                            <span>
                              #{idx + 1} {m.name}
                            </span>
                            <span className="text-[#8ac926]">
                              ${calculateNetWorth(state, pid)}
                            </span>
                          </div>
                        );
                      })}
                  </div>
                  {isHost && (
                    <button
                      type="button"
                      onClick={onStartNewRound}
                      className="cartoon-btn bg-[#8ac926] text-[#161426] px-5 py-2.5 text-sm font-black inline-flex items-center gap-2"
                    >
                      <Play weight="fill" className="w-4 h-4" />
                      <span>{isAr ? 'مباراة مونوبولي جديدة!' : 'Play Again!'}</span>
                    </button>
                  )}
                </div>
              ) : state.pendingTrade ? (
                /* INCOMING HUMAN TRADE OFFER MODAL */
                <div className="my-auto bg-[#2a2547] border-2 border-[#ffca3a] rounded-2xl p-3 text-center space-y-2.5">
                  <div className="text-sm sm:text-base font-black text-[#ffca3a] flex items-center justify-center gap-1.5">
                    <ArrowsLeftRight weight="bold" className="w-5 h-5" />
                    <span>
                      {isAr ? 'عرض صفقة تبادل عقاري!' : 'Incoming Trade Offer!'}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-white/90">
                    {isAr
                      ? `${getPlayerMeta(state.pendingTrade.fromId).name} يعرض على ${
                          getPlayerMeta(state.pendingTrade.toId).name
                        }:`
                      : `${getPlayerMeta(state.pendingTrade.fromId).name} offers ${
                          getPlayerMeta(state.pendingTrade.toId).name
                        }:`}
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-xs font-extrabold">
                    <div className="bg-white/10 rounded-xl p-2">
                      <div className="text-[#8ac926]">
                        {isAr ? 'تُقدّم:' : 'Gives:'}
                      </div>
                      <div>
                        {state.pendingTrade.offerSpaceIndex !== null
                          ? isAr
                            ? BOARD_SPACES[state.pendingTrade.offerSpaceIndex].nameAr
                            : BOARD_SPACES[state.pendingTrade.offerSpaceIndex].nameEn
                          : isAr
                          ? 'بدون عقار'
                          : 'No Deed'}
                      </div>
                      {state.pendingTrade.offerCash > 0 && (
                        <div>+${state.pendingTrade.offerCash}</div>
                      )}
                    </div>
                    <div className="bg-white/10 rounded-xl p-2">
                      <div className="text-[#ffca3a]">
                        {isAr ? 'مقابل:' : 'Wants:'}
                      </div>
                      <div>
                        {state.pendingTrade.requestSpaceIndex !== null
                          ? isAr
                            ? BOARD_SPACES[state.pendingTrade.requestSpaceIndex].nameAr
                            : BOARD_SPACES[state.pendingTrade.requestSpaceIndex].nameEn
                          : isAr
                          ? 'بدون عقار'
                          : 'No Deed'}
                      </div>
                      {state.pendingTrade.requestCash > 0 && (
                        <div>+${state.pendingTrade.requestCash}</div>
                      )}
                    </div>
                  </div>
                  {isPassAndPlay || myPlayerId === state.pendingTrade.toId ? (
                    <div className="flex items-center justify-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => executeAcceptedTrade(state.pendingTrade!)}
                        className="cartoon-btn bg-[#8ac926] text-[#161426] px-4 py-1.5 text-xs font-black"
                      >
                        {isAr ? 'قبول الصفقة' : 'Accept Deal'}
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateGameData({
                            ...state,
                            pendingTrade: null,
                            eventLog: pushLog(
                              state.eventLog,
                              'رُفض عرض التبادل العقاري.',
                              'Trade offer was declined.'
                            ),
                          })
                        }
                        className="cartoon-btn bg-[#ff595e] text-white px-4 py-1.5 text-xs font-black"
                      >
                        {isAr ? 'رفض' : 'Decline'}
                      </button>
                    </div>
                  ) : (
                    <div className="text-xs text-[#ffca3a] animate-pulse">
                      {isAr
                        ? `بانتظار رد ${getPlayerMeta(state.pendingTrade.toId).name}...`
                        : `Waiting for ${getPlayerMeta(state.pendingTrade.toId).name}...`}
                    </div>
                  )}
                </div>
              ) : showTradeDrawer && isMyTurn ? (
                /* CREATE TRADE DRAWER */
                <div className="my-auto bg-[#2a2547] border-2 border-[#00bbf9] rounded-2xl p-2.5 sm:p-3 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-[#00bbf9] text-sm">
                      {isAr ? 'إنشاء صفقة تبادل ذكية' : 'Propose Property Trade'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowTradeDrawer(false)}
                      className="text-white/70 hover:text-white font-black px-2 text-sm"
                    >
                      X
                    </button>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-white/75 mb-0.5">
                      {isAr ? 'اختر اللاعب المنافس:' : 'Select Partner:'}
                    </label>
                    <select
                      value={tradeTargetId}
                      onChange={(e) => {
                        setTradeTargetId(e.target.value);
                        setTradeRequestSpace(null);
                      }}
                      className="w-full rounded-lg bg-[#161426] border border-white/30 px-2 py-1 text-white font-bold"
                    >
                      <option value="">
                        {isAr ? '-- اختر لاعباً --' : '-- Choose player --'}
                      </option>
                      {state.playerOrder
                        .filter(
                          (pid) =>
                            pid !== activePlayerId && !state.bankruptIds.includes(pid)
                        )
                        .map((pid) => (
                          <option key={pid} value={pid}>
                            {getPlayerMeta(pid).name} (${state.cash[pid]})
                          </option>
                        ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <div className="font-extrabold text-[#8ac926]">
                        {isAr ? 'أنت تقدّم:' : 'You Offer:'}
                      </div>
                      <select
                        value={tradeOfferSpace ?? ''}
                        onChange={(e) =>
                          setTradeOfferSpace(
                            e.target.value === '' ? null : Number(e.target.value)
                          )
                        }
                        className="w-full rounded-lg bg-[#161426] border border-white/30 px-1.5 py-1 text-white"
                      >
                        <option value="">{isAr ? 'بدون عقار' : 'No Deed'}</option>
                        {myProperties.map((s) => (
                          <option key={s.index} value={s.index}>
                            {isAr ? s.nameAr : s.nameEn}
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        min={0}
                        max={Math.max(0, activeCash)}
                        step={25}
                        value={tradeOfferCash}
                        onChange={(e) => setTradeOfferCash(Number(e.target.value) || 0)}
                        placeholder="$ Cash"
                        className="w-full rounded-lg bg-[#161426] border border-white/30 px-2 py-1 text-white"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="font-extrabold text-[#ffca3a]">
                        {isAr ? 'وتطلب مقابلها:' : 'You Request:'}
                      </div>
                      <select
                        value={tradeRequestSpace ?? ''}
                        onChange={(e) =>
                          setTradeRequestSpace(
                            e.target.value === '' ? null : Number(e.target.value)
                          )
                        }
                        className="w-full rounded-lg bg-[#161426] border border-white/30 px-1.5 py-1 text-white"
                      >
                        <option value="">{isAr ? 'بدون عقار' : 'No Deed'}</option>
                        {targetProperties.map((s) => (
                          <option key={s.index} value={s.index}>
                            {isAr ? s.nameAr : s.nameEn}
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        min={0}
                        max={500}
                        step={25}
                        value={tradeRequestCash}
                        onChange={(e) => setTradeRequestCash(Number(e.target.value) || 0)}
                        placeholder="$ Cash"
                        className="w-full rounded-lg bg-[#161426] border border-white/30 px-2 py-1 text-white"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={!tradeTargetId}
                    onClick={handleSendTrade}
                    className="cartoon-btn w-full bg-[#00bbf9] disabled:opacity-40 text-[#161426] py-1.5 font-black"
                  >
                    {isAr ? 'إرسال العرض الآن' : 'Send Trade Offer'}
                  </button>
                </div>
              ) : (
                /* ACTIVE TURN CONSOLE */
                <>
                  {/* Turn Banner + Dice Pair */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/15 pb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-4 h-4 rounded-full border-2 border-white shrink-0"
                        style={{ backgroundColor: activeMeta.color }}
                      />
                      <span className="font-black text-xs sm:text-sm text-[#ffca3a]">
                        {isAr ? `دور: ${activeMeta.name}` : `Turn: ${activeMeta.name}`}
                      </span>
                      {state.hasExtraRoll && (
                        <span className="px-2 py-0.5 rounded-full bg-[#8ac926] text-[#161426] text-[10px] font-black">
                          {isAr ? 'دبل! دور إضافي' : 'DOUBLES!'}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <DiceFaceSvg value={state.lastDice[0]} rolling={rollingAnim} />
                      <DiceFaceSvg
                        value={state.lastDice[1]}
                        rolling={rollingAnim}
                        accent={
                          state.lastDice[0] === state.lastDice[1] ? '#ffca3a' : '#ffffff'
                        }
                      />
                    </div>
                  </div>

                  {/* Middle Action Area */}
                  <div className="my-auto py-2 flex flex-col items-center justify-center text-center space-y-2.5">
                    {state.lastCard && (
                      <div className="w-full max-w-sm rounded-xl border-2 border-[#ffca3a] bg-[#2c264c] px-3 py-2">
                        <div className="text-xs font-black text-[#ffca3a]">
                          {isAr ? state.lastCard.titleAr : state.lastCard.titleEn}
                        </div>
                        <div className="text-[11px] font-bold text-white/90 mt-0.5">
                          {isAr ? state.lastCard.descAr : state.lastCard.descEn}
                        </div>
                      </div>
                    )}

                    {/* PHASE 1: ROLL */}
                    {state.phase === 'roll' && (
                      <div className="space-y-2 w-full max-w-xs">
                        {activeJailTurns > 0 && (
                          <div className="rounded-xl bg-[#ff924c]/20 border border-[#ff924c] px-3 py-1.5 text-xs font-bold text-[#ffca3a]">
                            {isAr
                              ? `أنت في السجن (${activeJailTurns} محاولات متبقية)`
                              : `In Jail (${activeJailTurns} turns remaining)`}
                          </div>
                        )}

                        {isMyTurn ? (
                          <div className="space-y-1.5">
                            <button
                              type="button"
                              disabled={rollingAnim}
                              onClick={() => handleRollDice(false, false)}
                              className="cartoon-btn w-full bg-[#8ac926] hover:bg-[#9be02f] text-[#161426] py-2.5 sm:py-3 text-sm sm:text-base font-black flex items-center justify-center gap-2"
                            >
                              <Sparkle weight="fill" className="w-5 h-5" />
                              <span>
                                {activeJailTurns > 0
                                  ? isAr
                                    ? 'محاولة رمي دبل مجاناً!'
                                    : 'Roll for Doubles!'
                                  : isAr
                                  ? 'ارمِ النرد وانطلق!'
                                  : 'Roll Dice!'}
                              </span>
                            </button>

                            {activeJailTurns > 0 && activeCash >= 50 && (
                              <button
                                type="button"
                                onClick={() => handleRollDice(true, false)}
                                className="cartoon-btn w-full bg-[#ffca3a] text-[#161426] py-1.5 text-xs font-black"
                              >
                                {isAr
                                  ? 'دفع كفالة $50 والانطلاق فوراً'
                                  : 'Pay $50 Bail & Roll'}
                              </button>
                            )}

                            {activeJailTurns > 0 &&
                              (state.getOutOfJailCards[activePlayerId] || 0) > 0 && (
                                <button
                                  type="button"
                                  onClick={() => handleRollDice(false, true)}
                                  className="cartoon-btn w-full bg-[#00bbf9] text-[#161426] py-1.5 text-xs font-black"
                                >
                                  {isAr
                                    ? 'استخدام بطاقة الخروج المجاني'
                                    : 'Use Jail Free Pass'}
                                </button>
                              )}

                            <button
                              type="button"
                              onClick={() => setShowTradeDrawer(true)}
                              className="cartoon-btn w-full bg-[#2b2648] text-white py-1.5 text-xs font-extrabold flex items-center justify-center gap-1.5"
                            >
                              <ArrowsLeftRight weight="bold" className="w-4 h-4" />
                              <span>
                                {isAr ? 'عرض صفقة تبادل عقاري' : 'Trade Properties'}
                              </span>
                            </button>
                          </div>
                        ) : (
                          <div className="text-xs sm:text-sm font-extrabold text-[#ffca3a] animate-pulse">
                            {isAr
                              ? `بانتظار ${activeMeta.name} لرمي النرد...`
                              : `Waiting for ${activeMeta.name} to roll...`}
                          </div>
                        )}
                      </div>
                    )}

                    {/* PHASE 2: BUY OR AUCTION */}
                    {state.phase === 'buy_or_auction' &&
                      state.pendingSpaceIndex !== null && (
                        <div className="w-full max-w-sm rounded-2xl bg-[#fffdf7] text-[#161426] border-3 border-[#161426] p-3 space-y-2 shadow-[0_4px_0_#161426]">
                          {(() => {
                            const sp = BOARD_SPACES[state.pendingSpaceIndex!];
                            const canAfford = activeCash >= (sp.price || 0);
                            return (
                              <>
                                <div
                                  className="rounded-lg py-1 px-2 font-black text-sm text-white border border-[#161426]"
                                  style={{ backgroundColor: sp.colorHex || '#4361ee' }}
                                >
                                  {isAr ? sp.nameAr : sp.nameEn} — ${sp.price}
                                </div>
                                <div className="text-[11px] font-extrabold text-[#3f3b5c]">
                                  {sp.rents
                                    ? isAr
                                      ? `الإيجار: $${sp.rents[0]} | المجموعة كاملة: $${
                                          sp.rents[0] * 2
                                        } | فندق: $${sp.rents[4]}`
                                      : `Rent: $${sp.rents[0]} | Full Set: $${
                                          sp.rents[0] * 2
                                        } | Hotel: $${sp.rents[4]}`
                                    : sp.kind === 'airport'
                                    ? isAr
                                      ? 'الإيجار: $45 لمطار واحد | $100 للمطارين معاً'
                                      : 'Rent: $45 (1 Airport) | $100 (Both Airports)'
                                    : isAr
                                    ? 'الإيجار: مجموع النرد ×8 (أو ×14 مع مطار)'
                                    : 'Rent: 8x Dice (or 14x with an Airport)'}
                                </div>
                                {isMyTurn ? (
                                  <div className="grid grid-cols-2 gap-2 pt-1">
                                    <button
                                      type="button"
                                      disabled={!canAfford}
                                      onClick={handleBuyProperty}
                                      className="cartoon-btn bg-[#8ac926] disabled:opacity-40 text-[#161426] py-2 text-xs sm:text-sm font-black"
                                    >
                                      {isAr
                                        ? `شراء ($${sp.price})`
                                        : `Buy ($${sp.price})`}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={handleStartAuction}
                                      className="cartoon-btn bg-[#ffca3a] text-[#161426] py-2 text-xs sm:text-sm font-black"
                                    >
                                      {isAr ? 'طرح بالمزاد!' : 'Auction!'}
                                    </button>
                                  </div>
                                ) : (
                                  <div className="text-xs font-extrabold text-[#5e5a7d]">
                                    {isAr
                                      ? `${activeMeta.name} يقرر الشراء أو المزاد...`
                                      : `${activeMeta.name} is deciding...`}
                                  </div>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      )}

                    {/* PHASE 3: LIVE QUICK AUCTION */}
                    {state.phase === 'auction' && state.auctionState && (
                      <div className="w-full max-w-sm rounded-2xl bg-[#2c2550] border-2 border-[#ffca3a] p-3 space-y-2">
                        {(() => {
                          const auc = state.auctionState!;
                          const sp = BOARD_SPACES[auc.spaceIndex];
                          const turnBidder =
                            auc.activeBidderIds[
                              auc.turnBidderIndex % auc.activeBidderIds.length
                            ];
                          const turnMeta = getPlayerMeta(turnBidder);
                          const canControlBidder =
                            !turnMeta.isBot &&
                            (isPassAndPlay || turnBidder === myPlayerId);
                          const bidderCash = state.cash[turnBidder] || 0;

                          return (
                            <>
                              <div className="text-xs sm:text-sm font-black text-[#ffca3a]">
                                {isAr
                                  ? `مزاد علني: ${sp.nameAr} (السعر الأصلي $${sp.price})`
                                  : `Live Auction: ${sp.nameEn} (List $${sp.price})`}
                              </div>
                              <div className="text-base sm:text-lg font-black text-white">
                                {auc.highestBidderId
                                  ? isAr
                                    ? `أعلى مزايدة: $${auc.currentBid} (${
                                        getPlayerMeta(auc.highestBidderId).name
                                      })`
                                    : `Top Bid: $${auc.currentBid} (${
                                        getPlayerMeta(auc.highestBidderId).name
                                      })`
                                  : isAr
                                  ? `افتح المزاد بـ $${auc.currentBid + 20}`
                                  : `Opening Bid: $${auc.currentBid + 20}`}
                              </div>
                              {canControlBidder ? (
                                <div className="space-y-1.5">
                                  <div className="text-[11px] font-bold text-[#00bbf9]">
                                    {isAr
                                      ? `دور المزايدة لـ ${turnMeta.name} (معك $${bidderCash}):`
                                      : `${turnMeta.name}'s turn to bid ($${bidderCash}):`}
                                  </div>
                                  <div className="grid grid-cols-3 gap-1.5">
                                    <button
                                      type="button"
                                      disabled={bidderCash < auc.currentBid + 20}
                                      onClick={() => handleAuctionAction(20)}
                                      className="cartoon-btn bg-[#8ac926] disabled:opacity-40 text-[#161426] py-1.5 text-xs font-black"
                                    >
                                      +${20}
                                    </button>
                                    <button
                                      type="button"
                                      disabled={bidderCash < auc.currentBid + 50}
                                      onClick={() => handleAuctionAction(50)}
                                      className="cartoon-btn bg-[#ffca3a] disabled:opacity-40 text-[#161426] py-1.5 text-xs font-black"
                                    >
                                      +${50}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleAuctionAction('pass')}
                                      className="cartoon-btn bg-[#ff595e] text-white py-1.5 text-xs font-black"
                                    >
                                      {isAr ? 'انسحاب' : 'Pass'}
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="text-xs font-bold text-white/80 animate-pulse">
                                  {isAr
                                    ? `دور ${turnMeta.name} للمزايدة...`
                                    : `Waiting for ${turnMeta.name}'s bid...`}
                                </div>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    )}

                    {/* PHASE 4: END TURN / BUILD / DEBT CHECK */}
                    {state.phase === 'end_turn' && (
                      <div className="w-full max-w-xs space-y-2">
                        {activeCash < 0 && (
                          <div className="rounded-xl bg-[#ff595e]/20 border border-[#ff595e] p-2 text-xs font-extrabold text-[#ffca3a] flex items-center gap-1.5 justify-center">
                            <WarningCircle weight="fill" className="w-4 h-4 shrink-0" />
                            <span>
                              {isAr
                                ? `رصيدك سالب ($${activeCash})! بِع مبنى أو عقاراً من اللوحة لتفادي الإفلاس.`
                                : `Negative cash ($${activeCash})! Sell deeds/buildings before ending turn.`}
                            </span>
                          </div>
                        )}

                        {isMyTurn ? (
                          <div className="space-y-1.5">
                            <button
                              type="button"
                              onClick={handleEndTurn}
                              className={`cartoon-btn w-full py-2.5 text-sm sm:text-base font-black flex items-center justify-center gap-2 ${
                                activeCash < 0
                                  ? 'bg-[#ff595e] text-white'
                                  : state.hasExtraRoll
                                  ? 'bg-[#ffca3a] text-[#161426]'
                                  : 'bg-[#00bbf9] text-[#161426]'
                              }`}
                            >
                              <CheckCircle weight="fill" className="w-5 h-5" />
                              <span>
                                {activeCash < 0
                                  ? isAr
                                    ? 'إعلان الإفلاس رسمياً'
                                    : 'Declare Bankruptcy'
                                  : state.hasExtraRoll
                                  ? isAr
                                    ? 'رمية الدبل الإضافية!'
                                    : 'Roll Bonus Doubles!'
                                  : isAr
                                  ? 'إنهاء الدور'
                                  : 'End Turn'}
                              </span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setShowTradeDrawer(true)}
                              className="cartoon-btn w-full bg-[#2b2648] text-white py-1.5 text-xs font-extrabold flex items-center justify-center gap-1.5"
                            >
                              <ArrowsLeftRight weight="bold" className="w-4 h-4" />
                              <span>
                                {isAr ? 'صفقة تبادل مع لاعب' : 'Trade with Player'}
                              </span>
                            </button>
                          </div>
                        ) : (
                          <div className="text-xs sm:text-sm font-extrabold text-[#ffca3a] animate-pulse">
                            {isAr
                              ? `${activeMeta.name} ينهي دوره...`
                              : `${activeMeta.name} is finishing turn...`}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Live Event Feed Footer */}
                  <div className="border-t border-white/15 pt-1.5 space-y-0.5 text-[10.5px] sm:text-xs font-bold text-white/85 max-h-14 overflow-y-auto">
                    {(state.eventLog || []).slice(0, 2).map((item, idx) => (
                      <div key={idx} className="truncate">
                        • {isAr ? item.ar : item.en}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Side Panel: Selected Property Title Deed & Portfolio Builder */}
        <div className="xl:col-span-4 space-y-3">
          {/* Selected Space Title Deed Inspector */}
          <div className="cartoon-card p-4 bg-[#fffdf7] space-y-3">
            <div className="text-xs font-extrabold uppercase text-[#5e5a7d]">
              {isAr ? 'بطاقة تفاصيل الخانة (اضغط أي مدينة عالبورد)' : 'Space Inspector (Click any tile)'}
            </div>

            <div
              className="rounded-xl p-3 border-3 border-[#161426] text-center shadow-[0_3px_0_#161426]"
              style={{
                backgroundColor: inspectedSpace.colorHex || '#ffca3a',
                color:
                  inspectedSpace.colorHex === '#ffca3a' || !inspectedSpace.colorHex
                    ? '#161426'
                    : '#ffffff',
              }}
            >
              <div className="text-lg font-black">
                {isAr ? inspectedSpace.nameAr : inspectedSpace.nameEn}
              </div>
              {inspectedSpace.price && (
                <div className="text-xs font-extrabold opacity-90">
                  {isAr
                    ? `السعر الرسمي: $${inspectedSpace.price}`
                    : `List Price: $${inspectedSpace.price}`}
                </div>
              )}
            </div>

            {inspectedOwnerMeta ? (
              <div className="flex items-center justify-between rounded-xl bg-[#f4f1ea] px-3 py-2 border-2 border-[#161426]">
                <span className="text-xs font-extrabold text-[#161426]">
                  {isAr ? 'المالك الحالي:' : 'Current Owner:'}
                </span>
                <span
                  className="px-2.5 py-0.5 rounded-full text-xs font-black text-white border border-[#161426]"
                  style={{ backgroundColor: inspectedOwnerMeta.color }}
                >
                  {inspectedOwnerMeta.name}
                </span>
              </div>
            ) : inspectedSpace.price ? (
              <div className="text-xs font-extrabold text-center text-[#5e5a7d] bg-[#f4f1ea] rounded-xl py-2 border border-[#161426]/20">
                {isAr ? 'متاح للشراء عند الوقوف عليه!' : 'Unowned — available for purchase!'}
              </div>
            ) : null}

            {inspectedSpace.rents && (
              <div className="space-y-1 text-xs font-extrabold text-[#161426] bg-white rounded-xl p-2.5 border-2 border-[#161426]">
                <div className="flex justify-between">
                  <span>{isAr ? 'الإيجار الأساسي' : 'Base Rent'}</span>
                  <span>${inspectedSpace.rents[0]}</span>
                </div>
                <div className="flex justify-between text-[#4361ee]">
                  <span>{isAr ? 'امتلاك المدينتين (×2)' : 'Full Color Pair (2x)'}</span>
                  <span>${inspectedSpace.rents[0] * 2}</span>
                </div>
                <div className="flex justify-between">
                  <span>{isAr ? 'مع بيت واحد' : 'With 1 House'}</span>
                  <span>${inspectedSpace.rents[1]}</span>
                </div>
                <div className="flex justify-between">
                  <span>{isAr ? 'مع بيتين' : 'With 2 Houses'}</span>
                  <span>${inspectedSpace.rents[2]}</span>
                </div>
                <div className="flex justify-between">
                  <span>{isAr ? 'مع 3 بيوت' : 'With 3 Houses'}</span>
                  <span>${inspectedSpace.rents[3]}</span>
                </div>
                <div className="flex justify-between text-[#ff595e] font-black border-t border-[#161426]/15 pt-1">
                  <span>{isAr ? 'مع فندق ملكي' : 'With Royal Hotel'}</span>
                  <span>${inspectedSpace.rents[4]}</span>
                </div>
              </div>
            )}

            {/* Build / Sell Controls on Selected Property */}
            <div className="flex flex-col gap-2">
              {canBuildInspected && (
                <button
                  type="button"
                  onClick={() => handleBuildOnSpace(inspectedSpace.index)}
                  className="cartoon-btn w-full bg-[#8ac926] text-[#161426] py-2 text-xs font-black flex items-center justify-center gap-1.5"
                >
                  <Plus weight="bold" className="w-4 h-4" />
                  <span>
                    {inspectedHouses === 3
                      ? isAr
                        ? `تشييد فندق ملكي ($${inspectedSpace.houseCost})`
                        : `Build Royal Hotel ($${inspectedSpace.houseCost})`
                      : isAr
                      ? `بناء بيت جديد ($${inspectedSpace.houseCost})`
                      : `Build House ($${inspectedSpace.houseCost})`}
                  </span>
                </button>
              )}

              {canSellInspected && (
                <button
                  type="button"
                  onClick={() => handleLiquidateSpace(inspectedSpace.index)}
                  className="cartoon-btn w-full bg-[#ff924c] text-[#161426] py-1.5 text-xs font-black"
                >
                  {inspectedHouses > 0
                    ? isAr
                      ? `بيع مبنى (+$${Math.floor((inspectedSpace.houseCost || 0) * 0.5)})`
                      : `Sell Building (+$${Math.floor((inspectedSpace.houseCost || 0) * 0.5)})`
                    : isAr
                    ? `بيع الصك للبنك (+$${Math.floor((inspectedSpace.price || 0) * 0.5)})`
                    : `Sell Deed (+$${Math.floor((inspectedSpace.price || 0) * 0.5)})`}
                </button>
              )}
            </div>
          </div>

          {/* Active Player's Owned Deeds Quick-Build Card */}
          <div className="cartoon-card p-4 bg-[#fffdf7] space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-black text-[#161426] flex items-center gap-1.5">
                <Users weight="fill" className="w-4 h-4 text-[#4361ee]" />
                <span>
                  {isAr ? `محفظة أملاك ${activeMeta.name}` : `${activeMeta.name}'s Portfolio`}
                </span>
              </span>
              <span className="text-xs font-black text-[#8ac926]">
                ${activeCash}
              </span>
            </div>

            {myProperties.length === 0 ? (
              <div className="text-xs font-bold text-[#5e5a7d] py-2 text-center">
                {isAr
                  ? 'لا يملك صكوك مدن بعد — ارمِ النرد واقتنص العواصم!'
                  : 'No deeds owned yet — roll and acquire capitals!'}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-1.5 max-h-52 overflow-y-auto pr-0.5">
                {myProperties.map((sp) => {
                  const full = ownsFullGroup(state.owners, activePlayerId, sp.group);
                  const lvl = state.houses[sp.index] || 0;
                  return (
                    <button
                      key={sp.index}
                      type="button"
                      onClick={() => setSelectedSpaceIdx(sp.index)}
                      className={`rounded-xl border-2 border-[#161426] p-2 text-start bg-white hover:bg-[#fff9db] transition ${
                        selectedSpaceIdx === sp.index ? 'ring-2 ring-[#ffca3a]' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span
                          className="w-3 h-3 rounded-full border border-[#161426] shrink-0"
                          style={{ backgroundColor: sp.colorHex || '#161426' }}
                        />
                        {full && (
                          <Lightning weight="fill" className="w-3.5 h-3.5 text-[#ff924c]" />
                        )}
                      </div>
                      <div className="font-black text-xs text-[#161426] mt-1 truncate">
                        {isAr ? sp.nameAr : sp.nameEn}
                      </div>
                      <div className="mt-0.5 flex items-center justify-between">
                        <span className="text-[10px] font-bold text-[#5e5a7d]">
                          ${sp.price}
                        </span>
                        <BuildingBadgeSvg level={lvl} />
                      </div>
                    </button>
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
