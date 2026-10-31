import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import {
  Coins,
  CheckCircle,
  ArrowRight,
  ArrowsClockwise,
  Trophy,
  Eye,
  EyeSlash,
  LockKey,
  Sparkle,
  Crown,
  Trash,
  ArrowCounterClockwise,
  Megaphone,
  Gavel,
  HandCoins,
  SealCheck,
  SealWarning,
  ShieldWarning,
  PaintBrush,
} from '@phosphor-icons/react';
import { CartoonAvatarSvg } from './CartoonIcons';

/* ============================================================================
 * TYPES & INTERFACES
 * ========================================================================== */

export type StampType =
  | 'royal_masterpiece'
  | 'diamond_gem'
  | 'forged_replica'
  | 'cursed_trap';

export interface ArtStrokePoint {
  x: number;
  y: number;
}

export interface ArtStroke {
  points: ArtStrokePoint[];
  color: string;
  size: number;
}

export interface ArtPromptSpec {
  id: string;
  ar: string;
  en: string;
  defaultPitchAr: string;
  defaultPitchEn: string;
}

export interface ArtPaintingLot {
  artistId: string;
  artistName: string;
  prompt: ArtPromptSpec;
  strokes: ArtStroke[];
  secretStamp: StampType;
  pitchTitle: string;
  submitted: boolean;
  winningBidderId: string | null; // null if unsold (artist keeps it)
  winningBid: number;
  revealed: boolean;
  resolution?: {
    recipientId: string;
    recipientName: string;
    wasUnsold: boolean;
    paidCash: number;
    artValueDelta: number;
    stamp: StampType;
  };
}

export interface ArtAuctionPlayerInfo {
  id: string;
  name: string;
  avatar_color: string;
  score: number;
}

export interface ArtAuctionGameState {
  phase: 'studio_draw' | 'auction_floor' | 'lot_reveal' | 'game_over';
  roundNumber: number;
  passAndPlayStudioIndex: number;
  cash: Record<string, number>;
  collectedArtValue: Record<string, number>;
  collectedLots: Record<string, { title: string; stamp: StampType; value: number; paid: number; fromArtist: string }[]>;
  availableStamps: Record<string, StampType[]>;
  lots: ArtPaintingLot[];
  currentLotIndex: number;
  currentHighBid: number;
  currentHighBidderId: string | null;
  passedBidders: string[];
  bidHistory: { bidderId: string; bidderName: string; amount: number }[];
  scoreAwarded?: boolean;
}

export interface ArtAuctionGameProps {
  gameData: ArtAuctionGameState;
  players: ArtAuctionPlayerInfo[];
  myPlayerId: string;
  isHost: boolean;
  isPassAndPlay: boolean;
  lang: 'ar' | 'en';
  onUpdateGameData: (
    nextData: ArtAuctionGameState,
    scoreAwards?: Record<string, number>
  ) => void;
  onStartNewRound: () => void;
}

/* ============================================================================
 * CONSTANTS: PROMPTS, STAMPS & PALETTE
 * ========================================================================== */

export interface StampSpec {
  id: StampType;
  nameAr: string;
  nameEn: string;
  badgeAr: string;
  badgeEn: string;
  descAr: string;
  descEn: string;
  artValue: number;
  borderHex: string;
  bgGradient: string;
  accentHex: string;
}

export const STAMP_SPECS: Record<StampType, StampSpec> = {
  royal_masterpiece: {
    id: 'royal_masterpiece',
    nameAr: 'تحفة ملكية أصلية',
    nameEn: 'Royal Masterpiece',
    badgeAr: '+$5,000 قيمة فنية',
    badgeEn: '+$5,000 Art Value',
    descAr: 'كنز متحفي نادر! تمنح المشتري +$5,000 قيمة فنية عند الكشف.',
    descEn: 'Rare museum treasure! Grants the buyer +$5,000 Art Value at reveal.',
    artValue: 5000,
    borderHex: '#F59E0B',
    bgGradient: 'from-amber-500/25 via-yellow-500/15 to-amber-900/30',
    accentHex: '#FBBF24',
  },
  diamond_gem: {
    id: 'diamond_gem',
    nameAr: 'لوحة نادرة الماسية',
    nameEn: 'Rare Diamond Gem',
    badgeAr: '+$3,500 قيمة فنية',
    badgeEn: '+$3,500 Art Value',
    descAr: 'عمل فني أصيل ومطلوب! يمنح المشتري +$3,500 قيمة فنية.',
    descEn: 'Authentic sought-after piece! Grants the buyer +$3,500 Art Value.',
    artValue: 3500,
    borderHex: '#38BDF8',
    bgGradient: 'from-sky-500/25 via-cyan-500/15 to-blue-900/30',
    accentHex: '#38BDF8',
  },
  forged_replica: {
    id: 'forged_replica',
    nameAr: 'نسخة مقلّدة مزوّرة',
    nameEn: 'Forged Replica',
    badgeAr: '$0 قيمة فنية (خدعة!)',
    badgeEn: '$0 Art Value (Bluff!)',
    descAr: 'ورقة مقلّدة لا تساوي شيئاً ($0)! كل ما يدفعه المشتري يذهب لجيبك مجاناً.',
    descEn: 'Worthless $0 knockoff! Every dollar the buyer pays goes straight to your pocket.',
    artValue: 0,
    borderHex: '#A855F7',
    bgGradient: 'from-purple-500/25 via-fuchsia-500/15 to-purple-900/30',
    accentHex: '#C084FC',
  },
  cursed_trap: {
    id: 'cursed_trap',
    nameAr: 'لوحة ملغومة / فخ!',
    nameEn: 'Cursed Art Trap!',
    badgeAr: '-$3,000 غرامة للمشتري!',
    badgeEn: '-$3,000 Buyer Penalty!',
    descAr: 'فخ متفجر يخصم -$3,000 من المشتري! لكن احذر: إن لم يزايد أحد ستنفجر فيك أنت!',
    descEn: 'Explodes for -$3,000 on the buyer! Warning: if nobody bids, you keep it and take the hit!',
    artValue: -3000,
    borderHex: '#EF4444',
    bgGradient: 'from-rose-500/25 via-red-600/15 to-rose-950/35',
    accentHex: '#F87171',
  },
};

export const STUDIO_COLORS = [
  { hex: '#1E293B', nameAr: 'حبر فحمي', nameEn: 'Charcoal Ink' },
  { hex: '#EF4444', nameAr: 'أحمر قرمزي', nameEn: 'Crimson Red' },
  { hex: '#F59E0B', nameAr: 'ذهبي ملكي', nameEn: 'Royal Gold' },
  { hex: '#10B981', nameAr: 'أخضر زمردي', nameEn: 'Emerald Green' },
  { hex: '#3B82F6', nameAr: 'أزرق سماوي', nameEn: 'Cobalt Blue' },
  { hex: '#A855F7', nameAr: 'بنفسجي ساحر', nameEn: 'Mystic Violet' },
];

export const BRUSH_SIZES = [
  { size: 4, labelAr: 'دقيق', labelEn: 'Fine' },
  { size: 8, labelAr: 'متوسط', labelEn: 'Medium' },
  { size: 15, labelAr: 'عريض', labelEn: 'Bold' },
];

export const ART_PROMPTS_POOL: ArtPromptSpec[] = [
  {
    id: 'mona_mate',
    ar: 'موناليزا تشرب متة وتلبس نظارة شمسية',
    en: 'Mona Lisa sipping yerba mate in sunglasses',
    defaultPitchAr: 'النسخة السرية المفقودة لدافنشي!',
    defaultPitchEn: 'Da Vinci’s lost secret summer edition!',
  },
  {
    id: 'ceo_cat',
    ar: 'قطة غاضبة تعمل مدير شركة وتطرد موظفاً',
    en: 'Grumpy cat CEO firing an employee',
    defaultPitchAr: 'تجسيد عميق للرأسمالية الحديثة والمياو!',
    defaultPitchEn: 'A profound commentary on corporate meow-nagement!',
  },
  {
    id: 'desert_penguin',
    ar: 'بطريق يتزلج على كثبان الصحراء تحت الشمس',
    en: 'Penguin sandboarding down hot desert dunes',
    defaultPitchAr: 'تضاد بصري عبقري بين الجليد والرمال!',
    defaultPitchEn: 'Brilliant visual contrast of ice spirit and desert sand!',
  },
  {
    id: 'dino_barber',
    ar: 'ديناصور تي-ريكس عند الحلاق يقص شعره',
    en: 'T-Rex getting a fresh fade at the barbershop',
    defaultPitchAr: 'تراث ما قبل التاريخ بلمسة عصرية أنيقة!',
    defaultPitchEn: 'Prehistoric elegance meets modern grooming!',
  },
  {
    id: 'astronaut_shawarma',
    ar: 'رائد فضاء يأكل شاورما فوق سطح القمر',
    en: 'Astronaut eating a giant shawarma on the Moon',
    defaultPitchAr: 'خطوة صغيرة للإنسان، قضمة عملاقة للتاريخ!',
    defaultPitchEn: 'One small step for man, one giant bite for mankind!',
  },
  {
    id: 'octopus_dj',
    ar: 'أخطبوط يعمل دي جي في حفلة تحت البحر',
    en: 'Octopus DJ spinning records at an underwater rave',
    defaultPitchAr: 'ثمانية أذرع من الإبداع الموسيقي الخالص!',
    defaultPitchEn: 'Eight tentacles of pure aquatic sonic mastery!',
  },
  {
    id: 'grandma_skateboard',
    ar: 'جدّة تطير بلوح تزلج فوق سيارة شرطة',
    en: 'Grandma kickflipping a skateboard over a police car',
    defaultPitchAr: 'تمرد الشباب الأبدي في أبهى صوره!',
    defaultPitchEn: 'Eternal rebellious youth captured in one bold stroke!',
  },
  {
    id: 'camel_jacuzzi',
    ar: 'جمل يسترخي في جاكوزي فندقي خمس نجوم',
    en: 'Camel relaxing in a 5-star luxury hotel jacuzzi',
    defaultPitchAr: 'سفينة الصحراء في إجازة ملكية نادرة!',
    defaultPitchEn: 'The ship of the desert docked in pure royal luxury!',
  },
  {
    id: 'alien_tea',
    ar: 'كائن فضائي يصب شاي كرك في صحن طائر',
    en: 'Alien pouring hot karak tea inside a UFO',
    defaultPitchAr: 'لقاء الحضارات يبدأ بكوب شاي ساخن!',
    defaultPitchEn: 'First contact begins with a warm cup of hospitality!',
  },
  {
    id: 'chicken_bodybuilder',
    ar: 'دجاجة مفتولة العضلات ترفع أثقالاً في النادي',
    en: 'Buff bodybuilder chicken lifting heavy weights',
    defaultPitchAr: 'القوة الكامنة قبل السلق والشوي!',
    defaultPitchEn: 'Unstoppable protein power in raw artistic form!',
  },
  {
    id: 'ghost_selfie',
    ar: 'شبح يلتقط سيلفي أمام مرآة الحمام',
    en: 'Ghost trying to take a mirror selfie in the bathroom',
    defaultPitchAr: 'وجودية ما وراء الطبيعة في عصر السوشيال ميديا!',
    defaultPitchEn: 'Supernatural existentialism in the modern selfie era!',
  },
  {
    id: 'wizard_traffic',
    ar: 'ساحر قديم عالق في زحمة السير على سجادة طائرة',
    en: 'Ancient wizard stuck in rush-hour traffic on a flying carpet',
    defaultPitchAr: 'حين يصطدم السحر القديم بزحمة الصباح!',
    defaultPitchEn: 'When ancient mysticism collides with morning commute!',
  },
];

export const PRESET_HYPE_PITCHES: { ar: string; en: string }[] = [
  { ar: 'تحفة القرن الأصلية، لا تفوتكم!', en: 'Authentic masterpiece of the century, do not miss out!' },
  { ar: 'أقسم أنها لوحة نادرة وليست فخاً!', en: 'I swear this is a rare gem and definitely NOT a trap!' },
  { ar: 'المزادات العالمية تتقاتل على هذه اللوحة!', en: 'World museums are fighting over this very canvas!' },
  { ar: 'استثمار مضمون ١٠٠٪ لمن يجرؤ فقط!', en: '100% guaranteed return for bold collectors only!' },
];

/* ============================================================================
 * INITIAL STATE BUILDER
 * ========================================================================== */

export function buildInitialArtAuctionState(
  players: { id: string; name: string; avatar_color?: string; score?: number }[],
  existingState?: Partial<ArtAuctionGameState>
): ArtAuctionGameState {
  const safePlayers =
    players.length > 0
      ? players
      : [
          { id: 'p1', name: 'بيكاسو', avatar_color: '#F59E0B', score: 0 },
          { id: 'p2', name: 'دافنشي', avatar_color: '#10B981', score: 0 },
          { id: 'p3', name: 'فان غوخ', avatar_color: '#3B82F6', score: 0 },
        ];

  const shuffledPrompts = [...ART_PROMPTS_POOL].sort(() => Math.random() - 0.5);

  const cash: Record<string, number> = {};
  const collectedArtValue: Record<string, number> = {};
  const collectedLots: Record<
    string,
    { title: string; stamp: StampType; value: number; paid: number; fromArtist: string }[]
  > = {};
  const availableStamps: Record<string, StampType[]> = {};

  const defaultStampArsenal: StampType[] = [
    'royal_masterpiece',
    'diamond_gem',
    'forged_replica',
    'cursed_trap',
  ];

  safePlayers.forEach((p) => {
    cash[p.id] = existingState?.cash?.[p.id] ?? 6000;
    collectedArtValue[p.id] = existingState?.collectedArtValue?.[p.id] ?? 0;
    collectedLots[p.id] = existingState?.collectedLots?.[p.id] ?? [];
    availableStamps[p.id] =
      existingState?.availableStamps?.[p.id] && existingState.availableStamps[p.id].length > 0
        ? existingState.availableStamps[p.id]
        : [...defaultStampArsenal];
  });

  const lots: ArtPaintingLot[] = safePlayers.map((p, idx) => {
    const prompt = shuffledPrompts[idx % shuffledPrompts.length];
    const playerStamps = availableStamps[p.id] || defaultStampArsenal;
    return {
      artistId: p.id,
      artistName: p.name,
      prompt,
      strokes: [],
      secretStamp: playerStamps[0] || 'royal_masterpiece',
      pitchTitle: prompt.defaultPitchAr,
      submitted: false,
      winningBidderId: null,
      winningBid: 0,
      revealed: false,
    };
  });

  return {
    phase: 'studio_draw',
    roundNumber: (existingState?.roundNumber ?? 0) + 1,
    passAndPlayStudioIndex: 0,
    cash,
    collectedArtValue,
    collectedLots,
    availableStamps,
    lots,
    currentLotIndex: 0,
    currentHighBid: 0,
    currentHighBidderId: null,
    passedBidders: [],
    bidHistory: [],
    scoreAwarded: false,
  };
}

/* ============================================================================
 * CUSTOM CARTOON SVG ARTWORK (ZERO EMOJIS!)
 * ========================================================================== */

export const GoldenFrameSvg: React.FC<{
  children: React.ReactNode;
  className?: string;
  placardText?: string;
  subPlacardText?: string;
}> = ({ children, className = '', placardText, subPlacardText }) => (
  <div className={`relative p-3 sm:p-5 rounded-[28px] bg-gradient-to-br from-amber-300 via-yellow-600 to-amber-900 shadow-[0_16px_40px_rgba(0,0,0,0.6),inset_0_2px_6px_rgba(255,255,255,0.6)] border-4 border-amber-400/90 ${className}`}>
    {/* Corner Ornaments SVG */}
    <svg className="absolute top-1.5 left-1.5 w-6 h-6 text-amber-200/80 pointer-events-none" viewBox="0 0 24 24" fill="currentColor">
      <path d="M2 2h10v3H5v7H2V2zm4 4h4v2H8v2H6V6z" />
    </svg>
    <svg className="absolute top-1.5 right-1.5 w-6 h-6 text-amber-200/80 pointer-events-none transform scale-x-[-1]" viewBox="0 0 24 24" fill="currentColor">
      <path d="M2 2h10v3H5v7H2V2zm4 4h4v2H8v2H6V6z" />
    </svg>
    <svg className="absolute bottom-1.5 left-1.5 w-6 h-6 text-amber-200/80 pointer-events-none transform scale-y-[-1]" viewBox="0 0 24 24" fill="currentColor">
      <path d="M2 2h10v3H5v7H2V2zm4 4h4v2H8v2H6V6z" />
    </svg>
    <svg className="absolute bottom-1.5 right-1.5 w-6 h-6 text-amber-200/80 pointer-events-none transform scale-[-1]" viewBox="0 0 24 24" fill="currentColor">
      <path d="M2 2h10v3H5v7H2V2zm4 4h4v2H8v2H6V6z" />
    </svg>

    {/* Inner Velvet Matting */}
    <div className="p-2 sm:p-3 rounded-[20px] bg-gradient-to-b from-stone-900 via-neutral-900 to-stone-950 border-2 border-amber-500/50 shadow-inner">
      <div className="relative rounded-2xl overflow-hidden bg-[#FAF6EE] shadow-inner border border-amber-900/20">
        {children}
      </div>
    </div>

    {/* Museum Brass Placard */}
    {(placardText || subPlacardText) && (
      <div className="mt-2.5 mx-auto max-w-[92%] px-4 py-1.5 rounded-xl bg-gradient-to-r from-amber-950 via-stone-900 to-amber-950 border border-amber-400/60 shadow-md text-center">
        {placardText && (
          <p className="text-xs sm:text-sm font-black text-amber-200 truncate">{placardText}</p>
        )}
        {subPlacardText && (
          <p className="text-[11px] font-bold text-amber-400/90 truncate">{subPlacardText}</p>
        )}
      </div>
    )}
  </div>
);

export const AuctionGavelSvg: React.FC<{ className?: string }> = ({ className = 'w-12 h-12' }) => (
  <svg viewBox="0 0 80 80" className={className} fill="none">
    {/* Sound Block Base */}
    <ellipse cx="42" cy="68" rx="24" ry="6" fill="#451A03" />
    <path d="M22 62 C22 57 62 57 62 62 L65 68 L19 68 Z" fill="#92400E" stroke="#F59E0B" strokeWidth="2" />
    {/* Handle */}
    <path d="M40 36 L68 62" stroke="#D97706" strokeWidth="7" strokeLinecap="round" />
    <path d="M40 36 L68 62" stroke="#FDE68A" strokeWidth="2.5" strokeLinecap="round" />
    {/* Gavel Mallet Head */}
    <g transform="rotate(-35 34 30)">
      <rect x="14" y="18" width="40" height="22" rx="6" fill="#78350F" stroke="#FBBF24" strokeWidth="2.5" />
      <rect x="30" y="17" width="8" height="24" rx="2" fill="#F59E0B" />
      <ellipse cx="14" cy="29" rx="4" ry="11" fill="#B45309" stroke="#FCD34D" strokeWidth="2" />
      <ellipse cx="54" cy="29" rx="4" ry="11" fill="#B45309" stroke="#FCD34D" strokeWidth="2" />
    </g>
    {/* Impact Sparkles */}
    <path d="M12 48 L20 50 M15 40 L22 45 M34 52 L36 46" stroke="#FDE047" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

export const PaletteSvg: React.FC<{ className?: string }> = ({ className = 'w-12 h-12' }) => (
  <svg viewBox="0 0 80 80" className={className} fill="none">
    <path
      d="M40 10 C20 10 8 24 8 42 C8 58 22 70 38 70 C45 70 50 65 50 59 C50 55 47 52 47 48 C47 44 51 41 56 41 L62 41 C68 41 72 36 72 29 C72 17 57 10 40 10 Z"
      fill="#FDE68A"
      stroke="#B45309"
      strokeWidth="3.5"
    />
    <circle cx="23" cy="34" r="5.5" fill="#EF4444" />
    <circle cx="33" cy="23" r="5.5" fill="#3B82F6" />
    <circle cx="48" cy="23" r="5.5" fill="#10B981" />
    <circle cx="59" cy="31" r="5" fill="#A855F7" />
    <circle cx="24" cy="49" r="5" fill="#F59E0B" />
    <circle cx="37" cy="57" r="4.5" fill="#1E293B" />
    {/* Paintbrush */}
    <path d="M54 68 L74 44" stroke="#92400E" strokeWidth="5" strokeLinecap="round" />
    <path d="M48 72 C48 66 53 64 56 67 C58 70 53 75 48 72 Z" fill="#EC4899" />
  </svg>
);

export const SecretStampBadgeSvg: React.FC<{
  stamp: StampType;
  className?: string;
}> = ({ stamp, className = 'w-14 h-14' }) => {
  if (stamp === 'royal_masterpiece') {
    return (
      <svg viewBox="0 0 80 80" className={className} fill="none">
        <circle cx="40" cy="40" r="34" fill="#78350F" stroke="#FBBF24" strokeWidth="4" strokeDasharray="6 3" />
        <circle cx="40" cy="40" r="27" fill="#F59E0B" />
        {/* Royal Crown */}
        <path
          d="M22 50 L26 28 L35 37 L40 24 L45 37 L54 28 L58 50 Z"
          fill="#FEF08A"
          stroke="#78350F"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <circle cx="26" cy="25" r="2.5" fill="#FFFBEB" />
        <circle cx="40" cy="21" r="3" fill="#FFFBEB" />
        <circle cx="54" cy="25" r="2.5" fill="#FFFBEB" />
      </svg>
    );
  }
  if (stamp === 'diamond_gem') {
    return (
      <svg viewBox="0 0 80 80" className={className} fill="none">
        <circle cx="40" cy="40" r="34" fill="#0C4A6E" stroke="#38BDF8" strokeWidth="4" strokeDasharray="6 3" />
        <circle cx="40" cy="40" r="27" fill="#0284C7" />
        {/* Cut Diamond */}
        <polygon
          points="28,26 52,26 60,36 40,58 20,36"
          fill="#E0F2FE"
          stroke="#0369A1"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <polyline points="20,36 60,36" stroke="#38BDF8" strokeWidth="2" />
        <polyline points="28,26 34,36 40,58 46,36 52,26" stroke="#38BDF8" strokeWidth="2" fill="none" />
      </svg>
    );
  }
  if (stamp === 'forged_replica') {
    return (
      <svg viewBox="0 0 80 80" className={className} fill="none">
        <circle cx="40" cy="40" r="34" fill="#3B0764" stroke="#C084FC" strokeWidth="4" strokeDasharray="6 3" />
        <circle cx="40" cy="40" r="27" fill="#7E22CE" />
        {/* Mischievous Mask / Photocopy Stamp */}
        <path
          d="M22 32 C22 25 58 25 58 32 C58 46 49 55 40 55 C31 55 22 46 22 32 Z"
          fill="#F3E8FF"
          stroke="#3B0764"
          strokeWidth="2.5"
        />
        <path d="M28 36 Q32 32 36 36" stroke="#581C87" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M44 36 Q48 32 52 36" stroke="#581C87" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M31 46 Q40 51 49 46" stroke="#7E22CE" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    );
  }
  // cursed_trap
  return (
    <svg viewBox="0 0 80 80" className={className} fill="none">
      <circle cx="40" cy="40" r="34" fill="#450A0A" stroke="#F87171" strokeWidth="4" strokeDasharray="6 3" />
      <circle cx="40" cy="40" r="27" fill="#B91C1C" />
      {/* Cartoon Bomb Trap */}
      <circle cx="38" cy="44" r="14" fill="#18181B" stroke="#FCA5A5" strokeWidth="2" />
      <circle cx="33" cy="39" r="3.5" fill="#71717A" />
      <path d="M46 32 Q53 24 58 26" stroke="#FDE047" strokeWidth="3" strokeLinecap="round" />
      <polygon points="59,20 61,25 66,26 61,28 59,33 57,28 52,26 57,25" fill="#FEF08A" />
    </svg>
  );
};

/* ============================================================================
 * READ-ONLY & INTERACTIVE PAINTING CANVAS
 * ========================================================================== */

const ReadOnlyPaintingSvg: React.FC<{
  strokes: ArtStroke[];
  className?: string;
}> = ({ strokes, className = 'w-full aspect-[4/3]' }) => {
  return (
    <svg
      viewBox="0 0 400 300"
      className={`block bg-[#FAF6EE] select-none ${className}`}
    >
      {/* Subtle canvas texture lines */}
      <defs>
        <pattern id="canvasGrid" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#E7DFD3" strokeWidth="0.6" />
        </pattern>
      </defs>
      <rect width="400" height="300" fill="url(#canvasGrid)" />

      {strokes.length === 0 && (
        <text
          x="200"
          y="155"
          textAnchor="middle"
          fill="#A8A29E"
          fontSize="15"
          fontWeight="bold"
        >
          لوحة تجريدية صامتة
        </text>
      )}

      {strokes.map((stroke, idx) => {
        if (stroke.points.length === 0) return null;
        if (stroke.points.length === 1) {
          const pt = stroke.points[0];
          return (
            <circle
              key={idx}
              cx={pt.x}
              cy={pt.y}
              r={stroke.size / 2}
              fill={stroke.color}
            />
          );
        }
        const d = stroke.points
          .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`)
          .join(' ');
        return (
          <path
            key={idx}
            d={d}
            stroke={stroke.color}
            strokeWidth={stroke.size}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        );
      })}
    </svg>
  );
};

interface InteractiveDrawingCanvasProps {
  strokes: ArtStroke[];
  onChangeStrokes: (next: ArtStroke[]) => void;
  activeColor: string;
  activeSize: number;
  disabled?: boolean;
  lang: 'ar' | 'en';
}

const InteractiveDrawingCanvas: React.FC<InteractiveDrawingCanvasProps> = ({
  strokes,
  onChangeStrokes,
  activeColor,
  activeSize,
  disabled = false,
  lang,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [currentStroke, setCurrentStroke] = useState<ArtStroke | null>(null);
  const isDrawingRef = useRef(false);

  const getCanvasPoint = useCallback((clientX: number, clientY: number): ArtStrokePoint | null => {
    const svg = svgRef.current;
    if (!svg) return null;
    const rect = svg.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return null;
    const x = Math.max(0, Math.min(400, ((clientX - rect.left) / rect.width) * 400));
    const y = Math.max(0, Math.min(300, ((clientY - rect.top) / rect.height) * 300));
    return { x, y };
  }, []);

  // Prevent touch scrolling while drawing on mobile/tablet
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const preventTouchScroll = (e: TouchEvent) => {
      if (isDrawingRef.current || !disabled) {
        e.preventDefault();
      }
    };
    svg.addEventListener('touchstart', preventTouchScroll, { passive: false });
    svg.addEventListener('touchmove', preventTouchScroll, { passive: false });
    return () => {
      svg.removeEventListener('touchstart', preventTouchScroll);
      svg.removeEventListener('touchmove', preventTouchScroll);
    };
  }, [disabled]);

  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (disabled) return;
    e.preventDefault();
    e.stopPropagation();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // ignore pointer capture issues on synthetic events
    }
    const pt = getCanvasPoint(e.clientX, e.clientY);
    if (!pt) return;
    isDrawingRef.current = true;
    setCurrentStroke({
      points: [pt],
      color: activeColor,
      size: activeSize,
    });
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!isDrawingRef.current || disabled) return;
    e.preventDefault();
    e.stopPropagation();
    const pt = getCanvasPoint(e.clientX, e.clientY);
    if (!pt) return;
    setCurrentStroke((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        points: [...prev.points, pt],
      };
    });
  };

  const finishStroke = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!isDrawingRef.current) return;
    e.preventDefault();
    isDrawingRef.current = false;
    if (currentStroke && currentStroke.points.length > 0) {
      onChangeStrokes([...strokes, currentStroke]);
    }
    setCurrentStroke(null);
  };

  const allStrokes = currentStroke ? [...strokes, currentStroke] : strokes;

  return (
    <div
      className="relative w-full select-none touch-none"
      style={{ touchAction: 'none' }}
    >
      <svg
        ref={svgRef}
        viewBox="0 0 400 300"
        style={{ touchAction: 'none' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishStroke}
        onPointerCancel={finishStroke}
        className={`block w-full aspect-[4/3] bg-[#FAF6EE] select-none touch-none ${
          disabled ? 'cursor-not-allowed opacity-90' : 'cursor-crosshair'
        }`}
      >
        <defs>
          <pattern id="studioGrid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#E7DFD3" strokeWidth="0.6" />
          </pattern>
        </defs>
        <rect width="400" height="300" fill="url(#studioGrid)" />

        {allStrokes.length === 0 && (
          <text
            x="200"
            y="155"
            textAnchor="middle"
            fill="#A8A29E"
            fontSize="15"
            fontWeight="bold"
            className="pointer-events-none"
          >
            {lang === 'ar' ? 'ارسم لوحتك هنا بإصبعك أو بالماوس...' : 'Draw your masterpiece here...'}
          </text>
        )}

        {allStrokes.map((stroke, idx) => {
          if (stroke.points.length === 0) return null;
          if (stroke.points.length === 1) {
            const pt = stroke.points[0];
            return (
              <circle
                key={idx}
                cx={pt.x}
                cy={pt.y}
                r={stroke.size / 2}
                fill={stroke.color}
              />
            );
          }
          const d = stroke.points
            .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`)
            .join(' ');
          return (
            <path
              key={idx}
              d={d}
              stroke={stroke.color}
              strokeWidth={stroke.size}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          );
        })}
      </svg>
    </div>
  );
};

/* ============================================================================
 * MAIN COMPONENT: ArtAuctionGame
 * ========================================================================== */

export const ArtAuctionGame: React.FC<ArtAuctionGameProps> = ({
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

  // Studio local state per artist
  const [activeColor, setActiveColor] = useState<string>(STUDIO_COLORS[0].hex);
  const [activeBrushSize, setActiveBrushSize] = useState<number>(BRUSH_SIZES[1].size);
  const [localStrokes, setLocalStrokes] = useState<ArtStroke[]>([]);
  const [selectedStamp, setSelectedStamp] = useState<StampType>('royal_masterpiece');
  const [pitchInput, setPitchInput] = useState<string>('');
  const [studioShieldUnlocked, setStudioShieldUnlocked] = useState<boolean>(false);

  // Determine active artist in studio phase
  const activeStudioArtistId = isPassAndPlay
    ? gameData.lots[gameData.passAndPlayStudioIndex]?.artistId ?? players[0]?.id
    : myPlayerId;

  const activeStudioLot =
    gameData.lots.find((l) => l.artistId === activeStudioArtistId) ?? gameData.lots[0];

  // Sync local studio inputs when switching active studio artist or round
  useEffect(() => {
    if (!activeStudioLot) return;
    setLocalStrokes(activeStudioLot.strokes || []);
    const avail = gameData.availableStamps?.[activeStudioLot.artistId] || [
      'royal_masterpiece',
      'diamond_gem',
      'forged_replica',
      'cursed_trap',
    ];
    setSelectedStamp(
      avail.includes(activeStudioLot.secretStamp)
        ? activeStudioLot.secretStamp
        : avail[0] || 'royal_masterpiece'
    );
    setPitchInput(
      activeStudioLot.pitchTitle ||
        (isAr ? activeStudioLot.prompt.defaultPitchAr : activeStudioLot.prompt.defaultPitchEn)
    );
    setStudioShieldUnlocked(false);
  }, [
    activeStudioArtistId,
    gameData.roundNumber,
    gameData.passAndPlayStudioIndex,
    isAr,
  ]);

  // Current auction lot
  const currentLot: ArtPaintingLot | undefined =
    gameData.lots[gameData.currentLotIndex] ?? gameData.lots[0];

  // Player lookup helper
  const getPlayer = (id: string | null | undefined): ArtAuctionPlayerInfo | undefined =>
    players.find((p) => p.id === id);

  /* ==========================================================================
   * HANDLERS: PHASE 1 (STUDIO DRAW & SECRET STAMP)
   * ========================================================================== */

  const handleSubmitStudioPainting = () => {
    if (!activeStudioLot) return;

    const finalPitch =
      pitchInput.trim() ||
      (isAr ? activeStudioLot.prompt.defaultPitchAr : activeStudioLot.prompt.defaultPitchEn);

    // Ensure at least a tiny signature dot if the player forgot to draw a stroke
    const finalStrokes: ArtStroke[] =
      localStrokes.length > 0
        ? localStrokes
        : [
            {
              color: activeColor,
              size: 10,
              points: [
                { x: 140, y: 150 },
                { x: 200, y: 110 },
                { x: 260, y: 150 },
                { x: 200, y: 190 },
                { x: 140, y: 150 },
              ],
            },
          ];

    const updatedLots = gameData.lots.map((lot) =>
      lot.artistId === activeStudioLot.artistId
        ? {
            ...lot,
            strokes: finalStrokes,
            secretStamp: selectedStamp,
            pitchTitle: finalPitch,
            submitted: true,
          }
        : lot
    );

    const allSubmitted = updatedLots.every((l) => l.submitted);

    if (isPassAndPlay) {
      const nextIdx = gameData.passAndPlayStudioIndex + 1;
      if (nextIdx < updatedLots.length) {
        onUpdateGameData({
          ...gameData,
          lots: updatedLots,
          passAndPlayStudioIndex: nextIdx,
        });
        return;
      }
    }

    if (allSubmitted) {
      onUpdateGameData({
        ...gameData,
        lots: updatedLots,
        phase: 'auction_floor',
        currentLotIndex: 0,
        currentHighBid: 0,
        currentHighBidderId: null,
        passedBidders: [],
        bidHistory: [],
      });
    } else {
      onUpdateGameData({
        ...gameData,
        lots: updatedLots,
      });
    }
  };

  const handleHostForceStartAuction = () => {
    const filledLots = gameData.lots.map((lot) => {
      if (lot.submitted) return lot;
      return {
        ...lot,
        strokes:
          lot.strokes.length > 0
            ? lot.strokes
            : [
                {
                  color: '#F59E0B',
                  size: 10,
                  points: [
                    { x: 150, y: 150 },
                    { x: 250, y: 150 },
                  ],
                },
              ],
        submitted: true,
      };
    });

    onUpdateGameData({
      ...gameData,
      lots: filledLots,
      phase: 'auction_floor',
      currentLotIndex: 0,
      currentHighBid: 0,
      currentHighBidderId: null,
      passedBidders: [],
      bidHistory: [],
    });
  };

  /* ==========================================================================
   * HANDLERS: PHASE 2 (AUCTION FLOOR BIDDING)
   * ========================================================================== */

  const handlePlaceBid = (bidderId: string, increment: number) => {
    if (!currentLot || bidderId === currentLot.artistId) return;
    const bidderCash = gameData.cash[bidderId] ?? 0;
    const nextBidAmount = gameData.currentHighBid + increment;
    if (nextBidAmount > bidderCash) return;

    const bidderObj = getPlayer(bidderId);
    const updatedPassed = gameData.passedBidders.filter((id) => id !== bidderId);

    onUpdateGameData({
      ...gameData,
      currentHighBid: nextBidAmount,
      currentHighBidderId: bidderId,
      passedBidders: updatedPassed,
      bidHistory: [
        {
          bidderId,
          bidderName: bidderObj?.name || 'مزايد',
          amount: nextBidAmount,
        },
        ...gameData.bidHistory.slice(0, 5),
      ],
    });
  };

  const handleResolveCurrentLot = (
    overrideHighBidderId?: string | null,
    overrideHighBid?: number
  ) => {
    if (!currentLot) return;

    const winningBidderId =
      overrideHighBidderId !== undefined ? overrideHighBidderId : gameData.currentHighBidderId;
    const winningBid =
      overrideHighBid !== undefined ? overrideHighBid : gameData.currentHighBid;

    const wasUnsold = !winningBidderId || winningBid <= 0;
    const recipientId = wasUnsold ? currentLot.artistId : winningBidderId;
    const recipientPlayer = getPlayer(recipientId);
    const stampSpec = STAMP_SPECS[currentLot.secretStamp];

    const nextCash = { ...gameData.cash };
    const nextArtValue = { ...gameData.collectedArtValue };
    const nextCollectedLots = { ...gameData.collectedLots };
    const nextAvailableStamps = { ...gameData.availableStamps };

    if (!wasUnsold && winningBidderId) {
      // Buyer pays the Artist directly!
      nextCash[winningBidderId] = Math.max(0, (nextCash[winningBidderId] ?? 0) - winningBid);
      nextCash[currentLot.artistId] = (nextCash[currentLot.artistId] ?? 0) + winningBid;
    }

    // Recipient receives the painting's true Art Value (positive, 0, or -3000 trap!)
    nextArtValue[recipientId] = (nextArtValue[recipientId] ?? 0) + stampSpec.artValue;

    const existingCollection = nextCollectedLots[recipientId] || [];
    nextCollectedLots[recipientId] = [
      ...existingCollection,
      {
        title: currentLot.pitchTitle,
        stamp: currentLot.secretStamp,
        value: stampSpec.artValue,
        paid: wasUnsold ? 0 : winningBid,
        fromArtist: currentLot.artistName,
      },
    ];

    // Consume the used stamp from the artist's inventory (refill if empty)
    const artistStamps = nextAvailableStamps[currentLot.artistId] || [];
    const filteredStamps = artistStamps.filter((s) => s !== currentLot.secretStamp);
    nextAvailableStamps[currentLot.artistId] =
      filteredStamps.length > 0
        ? filteredStamps
        : ['royal_masterpiece', 'diamond_gem', 'forged_replica', 'cursed_trap'];

    const updatedLots = gameData.lots.map((lot, idx) =>
      idx === gameData.currentLotIndex
        ? {
            ...lot,
            winningBidderId: wasUnsold ? null : winningBidderId,
            winningBid: wasUnsold ? 0 : winningBid,
            revealed: true,
            resolution: {
              recipientId,
              recipientName: recipientPlayer?.name || currentLot.artistName,
              wasUnsold,
              paidCash: wasUnsold ? 0 : winningBid,
              artValueDelta: stampSpec.artValue,
              stamp: currentLot.secretStamp,
            },
          }
        : lot
    );

    if (stampSpec.artValue > 0 && !wasUnsold) {
      try {
        confetti({ particleCount: 55, spread: 65, origin: { y: 0.6 } });
      } catch {
        // ignore confetti error
      }
    }

    onUpdateGameData({
      ...gameData,
      phase: 'lot_reveal',
      cash: nextCash,
      collectedArtValue: nextArtValue,
      collectedLots: nextCollectedLots,
      availableStamps: nextAvailableStamps,
      lots: updatedLots,
    });
  };

  const handlePassBidding = (bidderId: string) => {
    if (!currentLot || bidderId === currentLot.artistId) return;
    if (gameData.passedBidders.includes(bidderId)) return;

    const nextPassed = [...gameData.passedBidders, bidderId];
    const eligibleBidders = players.filter((p) => p.id !== currentLot.artistId);

    // Check if everyone who can bid has passed (or everyone except current high bidder has passed)
    const allOthersPassed = eligibleBidders.every(
      (p) => nextPassed.includes(p.id) || p.id === gameData.currentHighBidderId
    );

    if (allOthersPassed) {
      handleResolveCurrentLot(gameData.currentHighBidderId, gameData.currentHighBid);
    } else {
      onUpdateGameData({
        ...gameData,
        passedBidders: nextPassed,
      });
    }
  };

  /* ==========================================================================
   * HANDLERS: PHASE 3 (LOT REVEAL -> NEXT LOT OR GAME OVER)
   * ========================================================================== */

  const handleAdvanceAfterReveal = () => {
    const nextLotIdx = gameData.currentLotIndex + 1;
    if (nextLotIdx < gameData.lots.length) {
      onUpdateGameData({
        ...gameData,
        phase: 'auction_floor',
        currentLotIndex: nextLotIdx,
        currentHighBid: 0,
        currentHighBidderId: null,
        passedBidders: [],
        bidHistory: [],
      });
      return;
    }

    // All lots sold! Compute final net worth & award leaderboard points
    const netWorthByPlayer: { id: string; netWorth: number }[] = players.map((p) => ({
      id: p.id,
      netWorth: (gameData.cash[p.id] ?? 0) + (gameData.collectedArtValue[p.id] ?? 0),
    }));

    netWorthByPlayer.sort((a, b) => b.netWorth - a.netWorth);
    const highestNetWorth = netWorthByPlayer[0]?.netWorth ?? 0;

    const scoreAwards: Record<string, number> = {};
    netWorthByPlayer.forEach((entry, rankIdx) => {
      if (entry.netWorth === highestNetWorth) {
        scoreAwards[entry.id] = 3; // 1st place: +3 leaderboard points
      } else if (rankIdx === 1) {
        scoreAwards[entry.id] = 2; // 2nd place: +2 leaderboard points
      } else if (entry.netWorth >= 6000) {
        scoreAwards[entry.id] = 1; // Profitable collector: +1 point
      }
    });

    try {
      confetti({ particleCount: 90, spread: 80, origin: { y: 0.55 } });
    } catch {
      // ignore
    }

    onUpdateGameData(
      {
        ...gameData,
        phase: 'game_over',
        scoreAwarded: true,
      },
      scoreAwards
    );
  };

  const handlePlayAnotherExhibition = () => {
    const nextState = buildInitialArtAuctionState(players, {
      roundNumber: gameData.roundNumber,
      availableStamps: gameData.availableStamps,
    });
    onUpdateGameData(nextState);
  };

  /* ==========================================================================
   * RENDER HELPERS
   * ========================================================================== */

  const formatMoney = (amount: number) => {
    const abs = Math.abs(amount).toLocaleString('en-US');
    if (amount < 0) return `-$${abs}`;
    return `$${abs}`;
  };

  return (
    <div
      dir={isAr ? 'rtl' : 'ltr'}
      className="w-full max-w-5xl mx-auto px-3 sm:px-5 py-4 text-white select-none"
    >
      {/* ====================================================================
       * TOP ROYAL AUCTION HEADER & PLAYERS WALLET STRIP
       * ==================================================================== */}
      <div className="rounded-3xl bg-gradient-to-r from-amber-950/90 via-stone-900/95 to-amber-950/90 border-2 border-amber-500/40 p-4 sm:p-5 shadow-2xl mb-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center shadow-inner">
              <AuctionGavelSvg className="w-9 h-9" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-amber-300 tracking-tight">
                  {isAr ? 'مزاد الخربشات الملكي' : 'Masterpiece Trap Auction'}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-amber-500/20 text-amber-200 border border-amber-400/40">
                  {isAr ? `المعرض #${gameData.roundNumber}` : `Exhibition #${gameData.roundNumber}`}
                </span>
              </div>
              <p className="text-xs text-stone-300 font-medium">
                {isAr
                  ? 'ارسم لوحتك، الصق ختم القيمة السري أو الفخ، وبعها لأعلى مزايد!'
                  : 'Draw your art, attach a secret value or trap stamp, and sell to the highest bidder!'}
              </p>
            </div>
          </div>

          {/* Phase Badge */}
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-stone-950/80 border border-amber-500/30">
            <Sparkle weight="fill" className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-extrabold text-amber-200">
              {gameData.phase === 'studio_draw' &&
                (isAr ? 'المرحلة ١: المرسم السري ووضع الختم' : 'Phase 1: Secret Studio & Stamp')}
              {gameData.phase === 'auction_floor' &&
                (isAr
                  ? `المرحلة ٢: المزاد العلني (${gameData.currentLotIndex + 1}/${gameData.lots.length})`
                  : `Phase 2: Live Auction (${gameData.currentLotIndex + 1}/${gameData.lots.length})`)}
              {gameData.phase === 'lot_reveal' &&
                (isAr ? 'المرحلة ٣: كشف الختم السري!' : 'Phase 3: Secret Stamp Reveal!')}
              {gameData.phase === 'game_over' &&
                (isAr ? 'النتائج النهائية للثروة الفنية' : 'Final Art Net Worth Standings')}
            </span>
          </div>
        </div>

        {/* Players Cash & Art Portfolio Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {players.map((p, pIdx) => {
            const pCash = gameData.cash[p.id] ?? 6000;
            const pArtVal = gameData.collectedArtValue[p.id] ?? 0;
            const pCount = (gameData.collectedLots[p.id] || []).length;
            const isCurrentArtist =
              (gameData.phase === 'auction_floor' || gameData.phase === 'lot_reveal') &&
              currentLot?.artistId === p.id;
            const isTopBidder =
              gameData.phase === 'auction_floor' && gameData.currentHighBidderId === p.id;

            return (
              <div
                key={p.id}
                className={`relative flex items-center gap-2.5 p-2.5 rounded-2xl border transition-all ${
                  isTopBidder
                    ? 'bg-emerald-950/60 border-emerald-400 shadow-[0_0_16px_rgba(16,185,129,0.25)]'
                    : isCurrentArtist
                    ? 'bg-amber-950/60 border-amber-400/80'
                    : 'bg-stone-950/65 border-white/10'
                }`}
              >
                <div className="w-9 h-9 rounded-xl overflow-hidden shrink-0 border border-white/20 bg-stone-800">
                  <CartoonAvatarSvg index={pIdx} color={p.avatar_color || '#F59E0B'} className="w-full h-full" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-black text-white truncate">{p.name}</span>
                    {isCurrentArtist && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-amber-500 text-stone-950">
                        {isAr ? 'الرسام' : 'Artist'}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs font-black text-emerald-400 flex items-center gap-0.5">
                      <Coins weight="fill" className="w-3.5 h-3.5" />
                      {formatMoney(pCash)}
                    </span>
                    {pCount > 0 && (
                      <span
                        className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded ${
                          pArtVal >= 0
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-rose-500/25 text-rose-300'
                        }`}
                      >
                        {isAr ? `لوحات: ${pCount}` : `Art: ${pCount}`}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ====================================================================
       * PHASE 1: STUDIO DRAW & SECRET STAMP SELECTION
       * ==================================================================== */}
      <AnimatePresence mode="wait">
        {gameData.phase === 'studio_draw' && activeStudioLot && (
          <motion.div
            key={`studio-${activeStudioLot.artistId}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="space-y-5"
          >
            {/* Pass & Play Secrecy Shield (ONLY in Pass-and-Play so next player doesn't see previous stamp) */}
            {isPassAndPlay && !studioShieldUnlocked ? (
              <div className="rounded-3xl bg-gradient-to-b from-stone-900 to-stone-950 border-2 border-amber-500/50 p-7 text-center shadow-2xl max-w-lg mx-auto">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center">
                  <PaletteSvg className="w-12 h-12" />
                </div>
                <p className="text-xs font-extrabold uppercase tracking-wider text-amber-400 mb-1">
                  {isAr
                    ? `دور الرسام (${gameData.passAndPlayStudioIndex + 1} من ${gameData.lots.length})`
                    : `Artist Turn (${gameData.passAndPlayStudioIndex + 1} of ${gameData.lots.length})`}
                </p>
                <h3 className="text-2xl font-black text-white mb-2">
                  {activeStudioLot.artistName}
                </h3>
                <p className="text-sm text-stone-300 mb-6">
                  {isAr
                    ? 'مرّر الجهاز إلى الرسام ليرسم لوحته ويضع الختم السري خلفها دون أن يراه الآخرون!'
                    : 'Pass the device to the Artist to draw their piece and attach a secret stamp in private!'}
                </p>
                <button
                  type="button"
                  onClick={() => setStudioShieldUnlocked(true)}
                  className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-stone-950 font-black text-base shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Eye weight="bold" className="w-5 h-5" />
                  {isAr
                    ? `أنا ${activeStudioLot.artistName} — ادخل المرسم السري`
                    : `I am ${activeStudioLot.artistName} — Enter Secret Studio`}
                </button>
              </div>
            ) : activeStudioLot.submitted && !isPassAndPlay ? (
              /* Online Waiting Screen once player submits their own painting */
              <div className="rounded-3xl bg-stone-900/90 border-2 border-emerald-500/40 p-6 sm:p-8 text-center shadow-2xl">
                <CheckCircle weight="fill" className="w-14 h-14 text-emerald-400 mx-auto mb-3" />
                <h3 className="text-xl font-black text-white mb-1">
                  {isAr
                    ? 'تم تغليف لوحتك وختمها السري بنجاح!'
                    : 'Your Painting & Secret Stamp are Locked In!'}
                </h3>
                <p className="text-sm text-stone-300 mb-5">
                  {isAr
                    ? 'بانتظار بقية الرسامين لإنهاء لوحاتهم لبدء المزاد العلني...'
                    : 'Waiting for other artists to finish their paintings to open the auction floor...'}
                </p>

                <div className="flex flex-wrap justify-center gap-2.5 mb-6">
                  {gameData.lots.map((lot) => (
                    <div
                      key={lot.artistId}
                      className={`px-3.5 py-2 rounded-xl border text-xs font-extrabold flex items-center gap-2 ${
                        lot.submitted
                          ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-200'
                          : 'bg-stone-800/80 border-white/10 text-stone-400'
                      }`}
                    >
                      <span>{lot.artistName}</span>
                      <span>{lot.submitted ? (isAr ? 'جاهز' : 'Ready') : '...'}</span>
                    </div>
                  ))}
                </div>

                {isHost && (
                  <button
                    type="button"
                    onClick={handleHostForceStartAuction}
                    className="px-5 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/50 text-amber-200 text-xs font-black transition cursor-pointer"
                  >
                    {isAr ? 'افتتاح قاعة المزاد الآن (للمضيف)' : 'Force Open Auction Floor Now (Host)'}
                  </button>
                )}
              </div>
            ) : (
              /* Active Studio Drawing & Secret Stamp Workspace */
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                {/* Left Column: Prompt + Framed Drawing Canvas + Brush Controls */}
                <div className="lg:col-span-7 space-y-3.5">
                  {/* Secret Art Commission Banner */}
                  <div className="rounded-2xl bg-gradient-to-r from-amber-500/20 via-yellow-500/10 to-amber-500/20 border border-amber-400/50 p-3.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/25 border border-amber-300/40 flex items-center justify-center shrink-0">
                        <PaintBrush weight="fill" className="w-5 h-5 text-amber-300" />
                      </div>
                      <div>
                        <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-300 block">
                          {isAr
                            ? `موضوع اللوحة المطلوب من ${activeStudioLot.artistName}:`
                            : `Commission Prompt for ${activeStudioLot.artistName}:`}
                        </span>
                        <p className="text-sm sm:text-base font-black text-white">
                          {isAr ? activeStudioLot.prompt.ar : activeStudioLot.prompt.en}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Golden Framed Interactive Canvas */}
                  <GoldenFrameSvg
                    placardText={pitchInput || (isAr ? activeStudioLot.prompt.defaultPitchAr : activeStudioLot.prompt.defaultPitchEn)}
                    subPlacardText={`${isAr ? 'ريشة الفنان:' : 'By Artist:'} ${activeStudioLot.artistName}`}
                  >
                    <InteractiveDrawingCanvas
                      strokes={localStrokes}
                      onChangeStrokes={setLocalStrokes}
                      activeColor={activeColor}
                      activeSize={activeBrushSize}
                      lang={lang}
                    />
                  </GoldenFrameSvg>

                  {/* Palette & Brush Toolbar */}
                  <div className="rounded-2xl bg-stone-900/95 border border-white/15 p-3 flex flex-wrap items-center justify-between gap-3">
                    {/* Colors */}
                    <div className="flex items-center gap-2">
                      {STUDIO_COLORS.map((c) => {
                        const selected = activeColor === c.hex;
                        return (
                          <button
                            key={c.hex}
                            type="button"
                            title={isAr ? c.nameAr : c.nameEn}
                            onClick={() => setActiveColor(c.hex)}
                            className={`w-8 h-8 rounded-full transition transform cursor-pointer ${
                              selected
                                ? 'scale-115 ring-3 ring-amber-300 shadow-lg'
                                : 'opacity-80 hover:opacity-100'
                            }`}
                            style={{ backgroundColor: c.hex }}
                          />
                        );
                      })}
                    </div>

                    {/* Brush Sizes */}
                    <div className="flex items-center gap-1.5 bg-stone-950 px-2.5 py-1.5 rounded-xl border border-white/10">
                      {BRUSH_SIZES.map((b) => (
                        <button
                          key={b.size}
                          type="button"
                          onClick={() => setActiveBrushSize(b.size)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition cursor-pointer ${
                            activeBrushSize === b.size
                              ? 'bg-amber-500 text-stone-950'
                              : 'text-stone-300 hover:bg-white/10'
                          }`}
                        >
                          {isAr ? b.labelAr : b.labelEn}
                        </button>
                      ))}
                    </div>

                    {/* Undo & Clear */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setLocalStrokes((prev) => prev.slice(0, -1))}
                        disabled={localStrokes.length === 0}
                        className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 disabled:opacity-40 text-xs font-bold text-stone-200 flex items-center gap-1 cursor-pointer"
                      >
                        <ArrowCounterClockwise weight="bold" className="w-4 h-4" />
                        {isAr ? 'تراجع' : 'Undo'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setLocalStrokes([])}
                        disabled={localStrokes.length === 0}
                        className="px-3 py-1.5 rounded-xl bg-rose-950/80 hover:bg-rose-900/80 disabled:opacity-40 border border-rose-500/30 text-xs font-bold text-rose-200 flex items-center gap-1 cursor-pointer"
                      >
                        <Trash weight="bold" className="w-4 h-4" />
                        {isAr ? 'مسح' : 'Clear'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right Column: Secret Stamp Arsenal + Artist Hype Pitch + Lock Button */}
                <div className="lg:col-span-5 space-y-4">
                  <div className="rounded-3xl bg-stone-900/95 border-2 border-amber-500/40 p-4 sm:p-5 shadow-xl space-y-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <LockKey weight="fill" className="w-5 h-5 text-amber-400" />
                        <h3 className="text-base font-black text-amber-200">
                          {isAr
                            ? '١. اختر الختم السري خلف اللوحة!'
                            : '1. Choose the Secret Stamp Behind Your Canvas!'}
                        </h3>
                      </div>
                      <p className="text-xs text-stone-300 leading-relaxed">
                        {isAr
                          ? 'المشتري الذي يربح المزاد سيدفع لك المال نقداً ويأخذ هذا الختم! (إن لم يزايد أحد، ستحتفظ أنت باللوحة وختمها!)'
                          : 'The winning bidder pays you cash directly and takes this stamp! (If nobody bids, YOU keep your own painting & stamp!)'}
                      </p>
                    </div>

                    {/* 4 Secret Stamps Selection Cards */}
                    <div className="space-y-2.5">
                      {(['royal_masterpiece', 'diamond_gem', 'forged_replica', 'cursed_trap'] as StampType[]).map(
                        (sType) => {
                          const spec = STAMP_SPECS[sType];
                          const isSelected = selectedStamp === sType;
                          return (
                            <button
                              key={sType}
                              type="button"
                              onClick={() => setSelectedStamp(sType)}
                              className={`w-full text-start p-3 rounded-2xl border-2 transition-all flex items-center gap-3 cursor-pointer bg-gradient-to-r ${
                                spec.bgGradient
                              } ${
                                isSelected
                                  ? 'border-amber-300 ring-2 ring-amber-400/50 scale-[1.01] shadow-lg'
                                  : 'border-white/10 opacity-80 hover:opacity-100'
                              }`}
                            >
                              <SecretStampBadgeSvg stamp={sType} className="w-12 h-12 shrink-0" />
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-sm font-black text-white">
                                    {isAr ? spec.nameAr : spec.nameEn}
                                  </span>
                                  <span
                                    className="px-2 py-0.5 rounded-lg text-[11px] font-black shrink-0"
                                    style={{
                                      backgroundColor: 'rgba(0,0,0,0.45)',
                                      color: spec.accentHex,
                                      border: `1px solid ${spec.borderHex}`,
                                    }}
                                  >
                                    {isAr ? spec.badgeAr : spec.badgeEn}
                                  </span>
                                </div>
                                <p className="text-[11px] text-stone-200/90 mt-1 leading-snug">
                                  {isAr ? spec.descAr : spec.descEn}
                                </p>
                              </div>
                            </button>
                          );
                        }
                      )}
                    </div>

                    {/* Artist Hype Pitch / Bluff Title */}
                    <div className="pt-2 border-t border-white/10 space-y-2">
                      <label className="text-xs font-black text-amber-200 flex items-center gap-1.5">
                        <Megaphone weight="fill" className="w-4 h-4 text-amber-400" />
                        {isAr
                          ? '٢. عنوان الترويج في المزاد (لإغراء المزايدين!):'
                          : '2. Auction Hype Pitch (Lure Bidders!):'}
                      </label>
                      <input
                        type="text"
                        maxLength={70}
                        value={pitchInput}
                        onChange={(e) => setPitchInput(e.target.value)}
                        placeholder={
                          isAr
                            ? 'اكتب جملة ترويجية مغرية للوحتك...'
                            : 'Write a tempting pitch for your painting...'
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl bg-stone-950 border border-amber-500/40 text-sm font-bold text-white focus:outline-none focus:border-amber-400"
                      />
                      {/* Quick Hype Presets */}
                      <div className="flex flex-wrap gap-1.5">
                        {PRESET_HYPE_PITCHES.map((preset, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setPitchInput(isAr ? preset.ar : preset.en)}
                            className="px-2.5 py-1 rounded-lg bg-stone-800/90 hover:bg-stone-700 text-[11px] font-bold text-amber-200/90 border border-white/10 cursor-pointer"
                          >
                            {isAr ? preset.ar : preset.en}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Submit Painting & Secret Stamp Button */}
                    <button
                      type="button"
                      onClick={handleSubmitStudioPainting}
                      className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-500 hover:from-amber-400 hover:to-yellow-400 text-stone-950 font-black text-sm sm:text-base shadow-xl transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <SealCheck weight="fill" className="w-5 h-5" />
                      {isAr
                        ? 'اعتماد اللوحة وإخفاء الختم للمزاد!'
                        : 'Lock Painting & Secret Stamp for Auction!'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* ====================================================================
         * PHASE 2: LIVE AUCTION FLOOR (قاعة المزاد العلني)
         * ==================================================================== */}
        {gameData.phase === 'auction_floor' && currentLot && (
          <motion.div
            key={`auction-lot-${gameData.currentLotIndex}`}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start"
          >
            {/* Left Column: Ornate Framed Painting on the Auction Easel */}
            <div className="lg:col-span-7 space-y-3">
              <div className="flex items-center justify-between px-3 py-2 rounded-2xl bg-stone-900/90 border border-amber-500/30">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-xl bg-amber-500 text-stone-950 text-xs font-black">
                    {isAr
                      ? `لوحة المزاد #${gameData.currentLotIndex + 1}`
                      : `Lot #${gameData.currentLotIndex + 1}`}
                  </span>
                  <span className="text-xs sm:text-sm font-extrabold text-amber-200">
                    {isAr ? currentLot.prompt.ar : currentLot.prompt.en}
                  </span>
                </div>
                <span className="text-xs font-black text-stone-300">
                  {isAr ? `الرسام: ${currentLot.artistName}` : `Artist: ${currentLot.artistName}`}
                </span>
              </div>

              <GoldenFrameSvg
                placardText={`"${currentLot.pitchTitle}"`}
                subPlacardText={
                  isAr
                    ? `بقلم الفنان: ${currentLot.artistName} — الختم الخلفي: ؟؟؟ سري`
                    : `By ${currentLot.artistName} — Back Stamp: ??? Secret`
                }
              >
                <ReadOnlyPaintingSvg strokes={currentLot.strokes} />
              </GoldenFrameSvg>
            </div>

            {/* Right Column: Live Bidding Desk & Quick Bid Controls */}
            <div className="lg:col-span-5 space-y-4">
              {/* Current Highest Bid Podium */}
              <div className="rounded-3xl bg-gradient-to-b from-stone-900 via-stone-950 to-stone-900 border-2 border-amber-500/50 p-5 shadow-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div>
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-400 block">
                      {isAr ? 'أعلى مزايدة حالية' : 'Current Highest Bid'}
                    </span>
                    <div className="text-3xl sm:text-4xl font-black text-emerald-400 tracking-tight mt-0.5">
                      {formatMoney(gameData.currentHighBid)}
                    </div>
                  </div>
                  <div className="text-end">
                    <span className="text-[11px] font-bold text-stone-400 block">
                      {isAr ? 'المتصدر للمزاد:' : 'Leading Bidder:'}
                    </span>
                    {gameData.currentHighBidderId ? (
                      <span className="inline-flex items-center gap-1.5 mt-1 px-3 py-1 rounded-xl bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 text-xs font-black">
                        <Crown weight="fill" className="w-4 h-4 text-amber-300" />
                        {getPlayer(gameData.currentHighBidderId)?.name}
                      </span>
                    ) : (
                      <span className="inline-block mt-1 px-3 py-1 rounded-xl bg-rose-500/20 border border-rose-400/40 text-rose-300 text-xs font-extrabold">
                        {isAr
                          ? 'لا يوجد مزايد بعد! (ستبقى مع الرسام)'
                          : 'No bids yet! (Artist keeps it)'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Psychological Reminder Banner */}
                <div className="rounded-2xl bg-amber-500/10 border border-amber-400/30 p-3 text-xs text-amber-100 leading-relaxed">
                  {isAr ? (
                    <>
                      <strong>قانون المزاد:</strong> سعر البيع يذهب نقداً إلى جيب الرسام (
                      <strong>{currentLot.artistName}</strong>). إذا لم يزايد أحد، يحتفظ الرسام بلوحته وختمها!
                    </>
                  ) : (
                    <>
                      <strong>Auction Rule:</strong> Winning bid goes in cash to{' '}
                      <strong>{currentLot.artistName}</strong>. If nobody bids, the Artist keeps their own painting & stamp!
                    </>
                  )}
                </div>

                {/* Bidding Cards for Non-Artist Players */}
                <div className="space-y-2.5">
                  <h4 className="text-xs font-black uppercase tracking-wider text-stone-300">
                    {isAr ? 'منصة المزايدين المباشرة:' : 'Live Collector Bidding Desk:'}
                  </h4>

                  {players
                    .filter((p) => {
                      if (p.id === currentLot.artistId) return false;
                      // In Online mode, show the local player's controls prominently (or all in Pass & Play)
                      return isPassAndPlay ? true : p.id === myPlayerId;
                    })
                    .map((bidder) => {
                      const bidderCash = gameData.cash[bidder.id] ?? 0;
                      const hasPassed = gameData.passedBidders.includes(bidder.id);
                      const isLeading = gameData.currentHighBidderId === bidder.id;

                      return (
                        <div
                          key={bidder.id}
                          className={`p-3 rounded-2xl border transition ${
                            isLeading
                              ? 'bg-emerald-950/40 border-emerald-400/60'
                              : hasPassed
                              ? 'bg-stone-950/50 border-white/5 opacity-60'
                              : 'bg-stone-900/90 border-white/15'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-black text-white">{bidder.name}</span>
                              <span className="text-[11px] font-extrabold text-emerald-400">
                                ({isAr ? 'الرصيد:' : 'Cash:'} {formatMoney(bidderCash)})
                              </span>
                            </div>
                            {hasPassed && (
                              <span className="text-[10px] font-black px-2 py-0.5 rounded bg-stone-800 text-stone-400">
                                {isAr ? 'منسحب' : 'Passed'}
                              </span>
                            )}
                            {isLeading && (
                              <span className="text-[10px] font-black px-2 py-0.5 rounded bg-emerald-500 text-stone-950">
                                {isAr ? 'أعلى مزايد' : 'Highest Bid'}
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-5 gap-1.5">
                            {[500, 1000, 1500, 2000].map((inc) => {
                              const targetBid = gameData.currentHighBid + inc;
                              const canAfford = targetBid <= bidderCash;
                              return (
                                <button
                                  key={inc}
                                  type="button"
                                  disabled={!canAfford}
                                  onClick={() => handlePlaceBid(bidder.id, inc)}
                                  className="py-2 px-1 rounded-xl bg-amber-500/20 hover:bg-amber-500 hover:text-stone-950 disabled:opacity-30 disabled:pointer-events-none border border-amber-400/50 text-amber-200 font-black text-[11px] transition cursor-pointer"
                                >
                                  +${inc}
                                </button>
                              );
                            })}
                            <button
                              type="button"
                              disabled={hasPassed || isLeading}
                              onClick={() => handlePassBidding(bidder.id)}
                              className="py-2 px-1 rounded-xl bg-stone-800 hover:bg-rose-950 hover:text-rose-200 disabled:opacity-30 border border-white/10 text-stone-300 font-bold text-[11px] transition cursor-pointer"
                            >
                              {isAr ? 'انسحاب' : 'Pass'}
                            </button>
                          </div>
                        </div>
                      );
                    })}

                  {/* If Online Mode and I am the Artist of this lot */}
                  {!isPassAndPlay && myPlayerId === currentLot.artistId && (
                    <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-400/50 text-center space-y-1.5">
                      <p className="text-xs font-black text-amber-300">
                        {isAr
                          ? 'أنت رسام هذه اللوحة! راقب اللاعبين وهم يتنافسون على شرائها!'
                          : 'You are the Artist of this lot! Watch collectors bid on your creation!'}
                      </p>
                      <p className="text-[11px] text-stone-300">
                        {isAr
                          ? `ختمك السري المخفي: ${STAMP_SPECS[currentLot.secretStamp].nameAr}`
                          : `Your hidden stamp: ${STAMP_SPECS[currentLot.secretStamp].nameEn}`}
                      </p>
                    </div>
                  )}
                </div>

                {/* Hammer / SOLD Button (Available to Host, Artist, or Pass & Play) */}
                {(isPassAndPlay || isHost || myPlayerId === currentLot.artistId) && (
                  <button
                    type="button"
                    onClick={() =>
                      handleResolveCurrentLot(gameData.currentHighBidderId, gameData.currentHighBid)
                    }
                    className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500 hover:from-emerald-400 hover:to-teal-400 text-stone-950 font-black text-sm sm:text-base shadow-xl transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Gavel weight="fill" className="w-5 h-5" />
                    {gameData.currentHighBidderId
                      ? isAr
                        ? `حسم المزاد وبيع اللوحة مقابل ${formatMoney(gameData.currentHighBid)}! (SOLD!)`
                        : `Hammer Down & SELL for ${formatMoney(gameData.currentHighBid)}! (SOLD!)`
                      : isAr
                      ? 'إغلاق المزاد بدون مشترٍ (الرسام يحتفظ بلوحته!)'
                      : 'Close Bidding Unsold (Artist Keeps Painting!)'}
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* ====================================================================
         * PHASE 3: DRAMATIC SECRET STAMP REVEAL (كشف ختم اللوحة الحقيقي!)
         * ==================================================================== */}
        {gameData.phase === 'lot_reveal' && currentLot && currentLot.resolution && (
          <motion.div
            key={`reveal-${gameData.currentLotIndex}`}
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="max-w-3xl mx-auto space-y-5"
          >
            {(() => {
              const res = currentLot.resolution!;
              const spec = STAMP_SPECS[res.stamp];
              const isTrap = res.artValueDelta < 0;
              const isMasterpiece = res.artValueDelta > 0;

              return (
                <div
                  className={`rounded-3xl border-2 p-6 sm:p-7 shadow-2xl bg-gradient-to-b ${spec.bgGradient}`}
                  style={{ borderColor: spec.borderHex }}
                >
                  <div className="flex flex-col sm:flex-row items-center gap-5">
                    <motion.div
                      initial={{ rotate: -18, scale: 0.5 }}
                      animate={{ rotate: 0, scale: 1 }}
                      transition={{ type: 'spring', stiffness: 220, damping: 14 }}
                      className="shrink-0"
                    >
                      <SecretStampBadgeSvg stamp={res.stamp} className="w-24 h-24" />
                    </motion.div>

                    <div className="flex-1 text-center sm:text-start space-y-2">
                      <span className="inline-block px-3 py-1 rounded-full text-xs font-black bg-black/40 text-amber-300 border border-amber-400/40">
                        {isAr ? 'تم قلب اللوحة وكشف الختم السري!' : 'Canvas Flipped — Secret Stamp Revealed!'}
                      </span>

                      <h3 className="text-2xl sm:text-3xl font-black text-white">
                        {isAr ? spec.nameAr : spec.nameEn}{' '}
                        <span style={{ color: spec.accentHex }}>
                          ({isAr ? spec.badgeAr : spec.badgeEn})
                        </span>
                      </h3>

                      {res.wasUnsold ? (
                        <p className="text-sm sm:text-base font-bold text-amber-100 leading-relaxed">
                          {isAr
                            ? `لم يزايد أحد على اللوحة! اضطر الرسام (${res.recipientName}) للاحتفاظ بلوحته وأخذ قيمة ختمها (${formatMoney(res.artValueDelta)})!`
                            : `Nobody bid on this lot! Artist ${res.recipientName} had to keep their own painting and take its stamp (${formatMoney(res.artValueDelta)})!`}
                        </p>
                      ) : (
                        <p className="text-sm sm:text-base font-bold text-stone-100 leading-relaxed">
                          {isAr
                            ? `اشترى (${res.recipientName}) اللوحة من الرسام (${currentLot.artistName}) بمبلغ ${formatMoney(res.paidCash)} نقداً، وحصل على ${formatMoney(res.artValueDelta)} قيمة فنية!`
                            : `${res.recipientName} bought the painting from ${currentLot.artistName} for ${formatMoney(res.paidCash)} cash, receiving ${formatMoney(res.artValueDelta)} in Art Value!`}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Financial Impact Summary Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5 pt-4 border-t border-white/15">
                    <div className="p-3.5 rounded-2xl bg-black/35 border border-white/10 flex items-center justify-between">
                      <span className="text-xs font-bold text-stone-300">
                        {isAr ? `الرسام (${currentLot.artistName}):` : `Artist (${currentLot.artistName}):`}
                      </span>
                      <span className="text-sm font-black text-emerald-400">
                        {res.wasUnsold
                          ? isAr
                            ? 'احتفظ بلوحته ($0 كاش)'
                            : 'Kept own lot ($0 cash)'
                          : `+${formatMoney(res.paidCash)} ${isAr ? 'كاش مباشر!' : 'Cash Paid!'}`}
                      </span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-black/35 border border-white/10 flex items-center justify-between">
                      <span className="text-xs font-bold text-stone-300">
                        {isAr
                          ? `المتلقي (${res.recipientName}):`
                          : `Recipient (${res.recipientName}):`}
                      </span>
                      <span
                        className={`text-sm font-black ${
                          isMasterpiece
                            ? 'text-amber-300'
                            : isTrap
                            ? 'text-rose-400'
                            : 'text-purple-300'
                        }`}
                      >
                        {res.artValueDelta >= 0
                          ? `+${formatMoney(res.artValueDelta)}`
                          : formatMoney(res.artValueDelta)}{' '}
                        {isAr ? 'قيمة فنية' : 'Art Value'}
                      </span>
                    </div>
                  </div>

                  {/* Next Lot / Final Standings Button */}
                  {(isPassAndPlay || isHost || myPlayerId === currentLot.artistId) && (
                    <button
                      type="button"
                      onClick={handleAdvanceAfterReveal}
                      className="mt-5 w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-stone-950 font-black text-base shadow-xl transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>
                        {gameData.currentLotIndex + 1 < gameData.lots.length
                          ? isAr
                            ? `الانتقال إلى اللوحة التالية (${gameData.currentLotIndex + 2}/${gameData.lots.length})`
                            : `Next Painting Lot (${gameData.currentLotIndex + 2}/${gameData.lots.length})`
                          : isAr
                          ? 'عرض كشف الثروة الفنية النهائي والفائز!'
                          : 'Reveal Final Art Net Worth & Winner!'}
                      </span>
                      <ArrowRight weight="bold" className="w-5 h-5" />
                    </button>
                  )}
                </div>
              );
            })()}
          </motion.div>
        )}

        {/* ====================================================================
         * PHASE 4: GAME OVER — NET WORTH LEADERBOARD (Cash + Art Value)
         * ==================================================================== */}
        {gameData.phase === 'game_over' && (
          <motion.div
            key="game-over"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl mx-auto rounded-3xl bg-gradient-to-b from-stone-900 via-stone-950 to-stone-900 border-2 border-amber-400/60 p-6 sm:p-8 shadow-2xl space-y-6"
          >
            <div className="text-center space-y-2">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center">
                <Trophy weight="fill" className="w-10 h-10 text-amber-400" />
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-amber-300">
                {isAr ? 'حصيلة المزاد والثروة الفنية النهائية!' : 'Final Auction Net Worth Standings!'}
              </h3>
              <p className="text-xs sm:text-sm text-stone-300">
                {isAr
                  ? 'صافي الثروة = الكاش المتبقي في المحفظة + إجمالي قيمة اللوحات المقتناة'
                  : 'Total Net Worth = Remaining Cash + Collected Art Value'}
              </p>
            </div>

            <div className="space-y-3">
              {[...players]
                .map((p) => {
                  const pCash = gameData.cash[p.id] ?? 0;
                  const pArt = gameData.collectedArtValue[p.id] ?? 0;
                  const netWorth = pCash + pArt;
                  const lotsOwned = gameData.collectedLots[p.id] || [];
                  return { player: p, pCash, pArt, netWorth, lotsOwned };
                })
                .sort((a, b) => b.netWorth - a.netWorth)
                .map((entry, idx) => (
                  <div
                    key={entry.player.id}
                    className={`p-4 rounded-2xl border-2 transition ${
                      idx === 0
                        ? 'bg-gradient-to-r from-amber-500/25 via-yellow-500/15 to-stone-900 border-amber-400 shadow-lg'
                        : 'bg-stone-900/80 border-white/10'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-8 h-8 rounded-xl font-black text-sm flex items-center justify-center ${
                            idx === 0
                              ? 'bg-amber-400 text-stone-950'
                              : 'bg-stone-800 text-stone-300'
                          }`}
                        >
                          #{idx + 1}
                        </span>
                        <div className="w-10 h-10 rounded-xl overflow-hidden border border-white/20 bg-stone-800">
                          <CartoonAvatarSvg
                            index={idx}
                            color={entry.player.avatar_color || '#F59E0B'}
                            className="w-full h-full"
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-base font-black text-white">
                              {entry.player.name}
                            </span>
                            {idx === 0 && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-stone-950">
                                {isAr ? 'قطب المزاد الفائز!' : 'Auction Tycoon Winner!'}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-stone-300 flex flex-wrap gap-3 mt-0.5">
                            <span>
                              {isAr ? 'الكاش:' : 'Cash:'}{' '}
                              <strong className="text-emerald-400">{formatMoney(entry.pCash)}</strong>
                            </span>
                            <span>
                              {isAr ? 'قيمة اللوحات:' : 'Art Value:'}{' '}
                              <strong
                                className={
                                  entry.pArt >= 0 ? 'text-amber-300' : 'text-rose-400'
                                }
                              >
                                {formatMoney(entry.pArt)}
                              </strong>
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="text-end">
                        <span className="text-[10px] font-bold uppercase text-stone-400 block">
                          {isAr ? 'صافي الثروة الكلي' : 'Total Net Worth'}
                        </span>
                        <span className="text-xl sm:text-2xl font-black text-amber-300">
                          {formatMoney(entry.netWorth)}
                        </span>
                      </div>
                    </div>

                    {entry.lotsOwned.length > 0 && (
                      <div className="mt-3 pt-2.5 border-t border-white/10 flex flex-wrap gap-2">
                        {entry.lotsOwned.map((item, lIdx) => {
                          const sSpec = STAMP_SPECS[item.stamp];
                          return (
                            <div
                              key={lIdx}
                              className="px-2.5 py-1 rounded-xl bg-black/40 border border-white/10 text-[11px] flex items-center gap-1.5"
                            >
                              <SecretStampBadgeSvg stamp={item.stamp} className="w-4 h-4" />
                              <span className="font-bold text-stone-200 truncate max-w-[150px]">
                                {item.title}
                              </span>
                              <span
                                className="font-black"
                                style={{ color: sSpec.accentHex }}
                              >
                                ({formatMoney(item.value)})
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
            </div>

            {/* Play Another Exhibition Round Button */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={handlePlayAnotherExhibition}
                className="py-3.5 px-7 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-stone-950 font-black text-sm sm:text-base shadow-xl transition flex items-center gap-2 cursor-pointer"
              >
                <ArrowsClockwise weight="bold" className="w-5 h-5" />
                {isAr ? 'افتتاح معرض ومزاد جديد!' : 'Start New Exhibition & Auction!'}
              </button>
              <button
                type="button"
                onClick={onStartNewRound}
                className="py-3.5 px-5 rounded-2xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold text-xs sm:text-sm border border-white/10 transition cursor-pointer"
              >
                {isAr ? 'تحديث الجولة' : 'Reset Round'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ArtAuctionGame;
