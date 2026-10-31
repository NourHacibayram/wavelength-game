import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import {
  ShieldCheck,
  Briefcase,
  Coins,
  ArrowRight,
  ArrowsClockwise,
  Trophy,
  Eye,
  EyeSlash,
  LockKey,
  SealCheck,
  SealWarning,
  Users,
  Sparkle,
  Lightning,
  CheckCircle,
  HandCoins,
  Scales,
  WarningOctagon,
  ChatCircleText,
} from '@phosphor-icons/react';
import { CartoonAvatarSvg } from './CartoonIcons';

/* ============================================================================
 * TYPES & INTERFACES
 * ========================================================================== */

export type BriefcaseTierId =
  | 'gold_60k'
  | 'gold_40k'
  | 'gold_20k'
  | 'empty_0'
  | 'bomb_minus_20k';

export type OrbChoice = 'split' | 'steal';

export type SpectatorBetType = 'both_split' | 'one_steals' | 'both_steal';

export interface BriefcaseSpec {
  id: BriefcaseTierId;
  value: number;
  titleAr: string;
  titleEn: string;
  subtitleAr: string;
  subtitleEn: string;
  badgeClass: string;
  accentHex: string;
  isTrap?: boolean;
}

export interface CandidateClaim {
  playerId: string;
  claimedTier: BriefcaseTierId;
  promiseIndex: number;
  locked: boolean;
}

export interface RoundResolution {
  round: number;
  bossId: string;
  bossName: string;
  partnerId: string;
  partnerName: string;
  bossBriefcase: BriefcaseTierId;
  partnerBriefcase: BriefcaseTierId;
  PartnerClaimedTier: BriefcaseTierId;
  wasPartnerHonestAboutBriefcase: boolean;
  vaultBaseBonus: number;
  vaultPot: number;
  bossChoice: OrbChoice;
  partnerChoice: OrbChoice;
  outcomeType: 'both_split' | 'boss_steals' | 'partner_steals' | 'both_steal';
  bossCashDelta: number;
  partnerCashDelta: number;
  spectatorWinners: string[];
  spectatorBetResults: Record<
    string,
    { bet: SpectatorBetType; won: boolean; delta: number }
  >;
}

export interface SplitStealGameState {
  phase: 'briefcase_bluff' | 'showdown' | 'reveal' | 'game_over';
  round: number;
  totalRounds: number;
  bossId: string;
  candidateIds: string[];
  partnerId: string | null;
  /** Secret briefcase assigned to each player in the round */
  briefcases: Record<string, BriefcaseTierId>;
  /** Public claim & promise made by each candidate */
  claims: Record<string, CandidateClaim>;
  /** Pass-and-Play index for candidates inspecting briefcases & locking claims */
  activeCandidateIndex: number;
  /** Pass-and-Play step during showdown: 'duelist_boss' | 'duelist_partner' | 'spectators' | 'ready' */
  pnpShowdownStep: 'duelist_boss' | 'duelist_partner' | 'spectators' | 'ready';
  pnpSpectatorIndex: number;
  /** Base heist vault money before briefcases */
  vaultBaseBonus: number;
  /** Combined total vault pot for the showdown */
  vaultPot: number;
  /** Live psychological pledges sent during the showdown */
  duelistPledges: {
    bossPledgeIndex: number | null;
    partnerPledgeIndex: number | null;
    bossInterrogationIndex: number | null;
  };
  /** Secret orb choices by the two duelists */
  orbChoices: {
    boss?: OrbChoice;
    partner?: OrbChoice;
  };
  /** Spectator Syndicate side-bets */
  spectatorBets: Record<string, SpectatorBetType>;
  /** Cumulative heist cash per player (everyone starts with $30,000) */
  cashByPlayer: Record<string, number>;
  /** Stats tracking for titles at the end */
  splitsCount: Record<string, number>;
  stealsCount: Record<string, number>;
  successfulBetrayals: Record<string, number>;
  spectatorWinsCount: Record<string, number>;
  /** Latest round resolution and full match history */
  lastResolution: RoundResolution | null;
  roundHistory: RoundResolution[];
  scoresAwarded?: boolean;
}

export interface SplitStealPlayerInfo {
  id: string;
  name: string;
  avatar_color: string;
  score: number;
}

export interface SplitStealGameProps {
  gameData: SplitStealGameState;
  players: SplitStealPlayerInfo[];
  myPlayerId: string;
  isHost: boolean;
  isPassAndPlay: boolean;
  lang: 'ar' | 'en';
  onUpdateGameData: (
    nextData: SplitStealGameState,
    scoreAwards?: Record<string, number>
  ) => void;
  onStartNewRound: () => void;
}

/* ============================================================================
 * CATALOGS & CONSTANTS
 * ========================================================================== */

export const BRIEFCASE_CATALOG: Record<BriefcaseTierId, BriefcaseSpec> = {
  gold_60k: {
    id: 'gold_60k',
    value: 60000,
    titleAr: '+$60,000 سبيكة ذهب ملكية',
    titleEn: '+$60,000 Royal Gold Bullion',
    subtitleAr: 'أعلى غنيمة في الخزنة الكبرى!',
    subtitleEn: 'Highest treasure in the Grand Vault!',
    badgeClass: 'bg-amber-100 text-amber-950 border-amber-500',
    accentHex: '#f59e0b',
  },
  gold_40k: {
    id: 'gold_40k',
    value: 40000,
    titleAr: '+$40,000 حقيبة ألماس نادر',
    titleEn: '+$40,000 Rare Diamond Case',
    subtitleAr: 'مجوهرات مصقولة ترفع قيمة الخزنة بقوة',
    subtitleEn: 'Polished gems that massively boost the pot',
    badgeClass: 'bg-cyan-100 text-cyan-950 border-cyan-500',
    accentHex: '#06b6d4',
  },
  gold_20k: {
    id: 'gold_20k',
    value: 20000,
    titleAr: '+$20,000 رزمة دولارات نقدية',
    titleEn: '+$20,000 Crisp Cash Stack',
    subtitleAr: 'نقد مضمون يضاف لرصيد العملية',
    subtitleEn: 'Solid cash added to the heist pot',
    badgeClass: 'bg-emerald-100 text-emerald-950 border-emerald-500',
    accentHex: '#10b981',
  },
  empty_0: {
    id: 'empty_0',
    value: 0,
    titleAr: '$0 حقيبة فارغة تماماً!',
    titleEn: '$0 Completely Empty Case!',
    subtitleAr: 'لا تضيف شيئاً للخزنة.. عليك التظاهر بأنها مليئة بالذهب!',
    subtitleEn: 'Adds zero to the vault.. bluff like you hold gold!',
    badgeClass: 'bg-slate-200 text-slate-800 border-slate-400',
    accentHex: '#64748b',
  },
  bomb_minus_20k: {
    id: 'bomb_minus_20k',
    value: -20000,
    titleAr: '-$20,000 فخ ضريبي ملغوم!',
    titleEn: '-$20,000 Tax Trap Bomb!',
    subtitleAr: 'يخصم من الخزنة! وإذا غدر الطرفان ينفجر بخصم -$10,000 لكل منكما!',
    subtitleEn: 'Drains the pot! If both steal, explodes for -$10,000 penalty each!',
    badgeClass: 'bg-rose-100 text-rose-950 border-rose-500',
    accentHex: '#f43f5e',
    isTrap: true,
  },
};

export const CANDIDATE_PROMISES: { ar: string; en: string }[] = [
  {
    ar: 'أحلف أن بحقيبتي ثروة دسمة وسأضغط «شراكة» بدون تردد!',
    en: 'I swear my briefcase is loaded and I will press SPLIT without hesitation!',
  },
  {
    ar: 'اختَرني معك للخزنة.. هدفنا تقاسم الغنيمة 50/50 بشرف اللصوص!',
    en: 'Pick me for the Vault.. we split 50/50 with true Thieves Honor!',
  },
  {
    ar: 'أنا أكثر لاعب مضمون في الغرفة، لو غدرتني ستندم، خلينا نتقاسم!',
    en: 'I am the most trustworthy player here—let us team up and split!',
  },
  {
    ar: 'حقيبتي ترفع الخزنة للسقف! لا تضيع الفرصة مع غيري!',
    en: 'My briefcase pushes the Vault to the ceiling! Do not miss out!',
  },
];

export const SHOWDOWN_PLEDGES: { ar: string; en: string }[] = [
  {
    ar: 'عهداً عليّ أمام الجميع: سأختار الكرة الذهبية (شراكة)!',
    en: 'On my honor in front of everyone: I am choosing the Golden Orb (SPLIT)!',
  },
  {
    ar: 'اسمعني جيداً: إذا طمعتَ وضغطتَ سرقة سنخرج بصفر معاً.. خلينا نتقاسمها بالنص!',
    en: 'Listen closely: if you get greedy we both walk away with $0.. let us split 50/50!',
  },
  {
    ar: 'لقد اخترتك لأنني أثق بك.. لا تكسر كلمتك في اللحظة الأخيرة!',
    en: 'I trusted you for this heist.. do not break your word at the final second!',
  },
  {
    ar: 'عيني في عينك: يدي على زر الشراكة الآن، لا تخذلني!',
    en: 'Look me in the eye: my hand is on SPLIT right now, do not betray me!',
  },
];

export const BOSS_INTERROGATIONS: { ar: string; en: string }[] = [
  {
    ar: 'هل حقيبتك فعلاً كما ادّعيت أم كنت تخدعني لتدخل الخزنة؟',
    en: 'Was your briefcase really what you claimed, or did you bluff to get inside?',
  },
  {
    ar: 'لو ضغطتُ أنا شراكة، ما الذي يضمن لي ألا تطعنني بالسرقة؟',
    en: 'If I press SPLIT, what guarantees you will not backstab me with STEAL?',
  },
  {
    ar: 'الجمهور يراهن على غدرنا.. دعنا نثبت لهم أننا أذكى من الطمع!',
    en: 'The crowd is betting on betrayal.. let us prove we are smarter than greed!',
  },
];

export const SPECTATOR_BET_SPECS: Record<
  SpectatorBetType,
  {
    id: SpectatorBetType;
    titleAr: string;
    titleEn: string;
    descAr: string;
    descEn: string;
    accentClass: string;
  }
> = {
  both_split: {
    id: 'both_split',
    titleAr: 'شرف اللصوص (كلاهما شراكة)',
    titleEn: 'Honor Among Thieves (Both Split)',
    descAr: 'كلا المتواجهين يختار الكرة الذهبية ويتقاسمان الخزنة بالنصف',
    descEn: 'Both duelists pick the Golden Orb and split the vault 50/50',
    accentClass: 'border-emerald-500 bg-emerald-50 text-emerald-950',
  },
  one_steals: {
    id: 'one_steals',
    titleAr: 'طعنة غدر (أحدهما يسرق الآخر)',
    titleEn: 'Single Betrayal (One Steals)',
    descAr: 'أحدهما يختار شراكة والآخر يطعنه ويخطف 100% من الخزنة!',
    descEn: 'One chooses Split while the other backstabs for 100% of the pot!',
    accentClass: 'border-amber-500 bg-amber-50 text-amber-950',
  },
  both_steal: {
    id: 'both_steal',
    titleAr: 'طمع مزدوج (كلاهما يغدر = $0)',
    titleEn: 'Double Greed (Both Steal = $0)',
    descAr: 'كلاهما يختار كرة الغدر فتدمّر الخزنة ويخرجان بصفر!',
    descEn: 'Both pick Steal, destroying the vault so both get $0!',
    accentClass: 'border-rose-500 bg-rose-50 text-rose-950',
  },
};

const BRIEFCASE_DECK_POOL: BriefcaseTierId[] = [
  'gold_60k',
  'gold_40k',
  'gold_40k',
  'gold_20k',
  'gold_20k',
  'empty_0',
  'bomb_minus_20k',
];

function formatMoney(amount: number): string {
  const sign = amount < 0 ? '-' : '';
  const abs = Math.abs(Math.round(amount));
  return `${sign}$${abs.toLocaleString('en-US')}`;
}

function dealRoundBriefcases(
  players: { id: string }[],
  bossId: string
): Record<string, BriefcaseTierId> {
  const result: Record<string, BriefcaseTierId> = {};
  // Boss always brings a solid base briefcase ($20k or $40k)
  result[bossId] = Math.random() < 0.5 ? 'gold_40k' : 'gold_20k';

  const candidates = players.filter((p) => p.id !== bossId);
  const shuffledPool = [...BRIEFCASE_DECK_POOL].sort(() => Math.random() - 0.5);
  candidates.forEach((c, idx) => {
    result[c.id] = shuffledPool[idx % shuffledPool.length];
  });
  return result;
}

/* ============================================================================
 * INITIAL STATE BUILDER
 * ========================================================================== */

export function buildInitialSplitStealState(
  players: { id: string; name: string; avatar_color?: string; score?: number }[]
): SplitStealGameState {
  const safePlayers =
    players.length >= 2
      ? players
      : [
          { id: 'p1', name: 'لص 1' },
          { id: 'p2', name: 'لص 2' },
        ];

  const totalRounds = Math.min(Math.max(safePlayers.length, 4), 6);
  const bossId = safePlayers[0].id;
  const candidateIds = safePlayers.filter((p) => p.id !== bossId).map((p) => p.id);
  const briefcases = dealRoundBriefcases(safePlayers, bossId);

  const claims: Record<string, CandidateClaim> = {};
  candidateIds.forEach((cid) => {
    claims[cid] = {
      playerId: cid,
      claimedTier: 'gold_60k',
      promiseIndex: 0,
      locked: false,
    };
  });

  const cashByPlayer: Record<string, number> = {};
  const splitsCount: Record<string, number> = {};
  const stealsCount: Record<string, number> = {};
  const successfulBetrayals: Record<string, number> = {};
  const spectatorWinsCount: Record<string, number> = {};

  safePlayers.forEach((p) => {
    cashByPlayer[p.id] = 30000; // Starting heist syndicate bankroll
    splitsCount[p.id] = 0;
    stealsCount[p.id] = 0;
    successfulBetrayals[p.id] = 0;
    spectatorWinsCount[p.id] = 0;
  });

  return {
    phase: 'briefcase_bluff',
    round: 1,
    totalRounds,
    bossId,
    candidateIds,
    partnerId: null,
    briefcases,
    claims,
    activeCandidateIndex: 0,
    pnpShowdownStep: 'duelist_boss',
    pnpSpectatorIndex: 0,
    vaultBaseBonus: 30000,
    vaultPot: 50000,
    duelistPledges: {
      bossPledgeIndex: null,
      partnerPledgeIndex: null,
      bossInterrogationIndex: null,
    },
    orbChoices: {},
    spectatorBets: {},
    cashByPlayer,
    splitsCount,
    stealsCount,
    successfulBetrayals,
    spectatorWinsCount,
    lastResolution: null,
    roundHistory: [],
    scoresAwarded: false,
  };
}

/* ============================================================================
 * BESPOKE CARTOON SVG ILLUSTRATIONS (ZERO EMOJIS)
 * ========================================================================== */

export const GoldenOrbSplitSvg: React.FC<{ className?: string }> = ({
  className = 'w-20 h-20',
}) => (
  <svg viewBox="0 0 120 120" className={className} fill="none">
    <defs>
      <radialGradient id="splitOrbGrad" cx="35%" cy="30%" r="70%">
        <stop offset="0%" stopColor="#FEF08A" />
        <stop offset="45%" stopColor="#F59E0B" />
        <stop offset="100%" stopColor="#B45309" />
      </radialGradient>
      <linearGradient id="splitRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#34D399" />
        <stop offset="100%" stopColor="#059669" />
      </linearGradient>
    </defs>
    {/* Outer Halo Glow */}
    <circle
      cx="60"
      cy="60"
      r="54"
      fill="url(#splitRingGrad)"
      opacity="0.22"
    />
    {/* Main Golden Sphere */}
    <circle
      cx="60"
      cy="60"
      r="46"
      fill="url(#splitOrbGrad)"
      stroke="#1E293B"
      strokeWidth="4.5"
    />
    {/* Specular Shine */}
    <ellipse
      cx="43"
      cy="36"
      rx="14"
      ry="8"
      transform="rotate(-25 43 36)"
      fill="#FEF9C3"
      opacity="0.75"
    />
    {/* Emerald Equator Band */}
    <path
      d="M15 60 C30 72, 90 72, 105 60"
      stroke="#065F46"
      strokeWidth="5"
      strokeLinecap="round"
      opacity="0.45"
    />
    {/* Stylized Handshake / Shield Emblem */}
    <path
      d="M38 62 L51 50 L62 60 L72 50 L83 61 L69 75 L51 75 Z"
      fill="#10B981"
      stroke="#1E293B"
      strokeWidth="3.5"
      strokeLinejoin="round"
    />
    <path
      d="M48 61 L59 71 M56 56 L67 67"
      stroke="#ECFDF5"
      strokeWidth="3"
      strokeLinecap="round"
    />
    {/* Crowned Star on top of Orb */}
    <path
      d="M60 22 L63 30 L71 30 L65 35 L67 43 L60 38 L53 43 L55 35 L49 30 L57 30 Z"
      fill="#FFFBEB"
      stroke="#1E293B"
      strokeWidth="2.2"
      strokeLinejoin="round"
    />
  </svg>
);

export const GoldenOrbStealSvg: React.FC<{ className?: string }> = ({
  className = 'w-20 h-20',
}) => (
  <svg viewBox="0 0 120 120" className={className} fill="none">
    <defs>
      <radialGradient id="stealOrbGrad" cx="35%" cy="30%" r="70%">
        <stop offset="0%" stopColor="#FDA4AF" />
        <stop offset="50%" stopColor="#E11D48" />
        <stop offset="100%" stopColor="#881337" />
      </radialGradient>
    </defs>
    {/* Crimson Danger Aura */}
    <circle cx="60" cy="60" r="54" fill="#F43F5E" opacity="0.24" />
    {/* Main Sphere */}
    <circle
      cx="60"
      cy="60"
      r="46"
      fill="url(#stealOrbGrad)"
      stroke="#1E293B"
      strokeWidth="4.5"
    />
    {/* Specular Highlight */}
    <ellipse
      cx="43"
      cy="36"
      rx="13"
      ry="7"
      transform="rotate(-25 43 36)"
      fill="#FFE4E6"
      opacity="0.65"
    />
    {/* Thief Domino Mask & Crossed Dagger */}
    <path
      d="M32 54 C38 45, 52 46, 60 52 C68 46, 82 45, 88 54 C89 64, 76 70, 66 64 L60 60 L54 64 C44 70, 31 64, 32 54 Z"
      fill="#0F172A"
      stroke="#F8FAFC"
      strokeWidth="2.8"
      strokeLinejoin="round"
    />
    {/* Glinting Eyes inside Mask */}
    <polygon points="42,56 52,54 49,60" fill="#FBBF24" />
    <polygon points="78,56 68,54 71,60" fill="#FBBF24" />
    {/* Golden Dagger Blade Below */}
    <path
      d="M60 30 L65 76 L60 88 L55 76 Z"
      fill="#FDE047"
      stroke="#1E293B"
      strokeWidth="2.8"
      strokeLinejoin="round"
       opacity="0.9"
    />
    <path
      d="M49 40 L71 40"
      stroke="#F59E0B"
      strokeWidth="4.5"
      strokeLinecap="round"
    />
  </svg>
);

export const VaultBriefcaseSvg: React.FC<{
  tier?: BriefcaseTierId | 'mystery';
  className?: string;
}> = ({ tier = 'mystery', className = 'w-16 h-16' }) => {
  const accentColor =
    tier === 'gold_60k'
      ? '#F59E0B'
      : tier === 'gold_40k'
      ? '#06B6D4'
      : tier === 'gold_20k'
      ? '#10B981'
      : tier === 'bomb_minus_20k'
      ? '#F43F5E'
      : tier === 'empty_0'
      ? '#94A3B8'
      : '#8B5CF6';

  return (
    <svg viewBox="0 0 100 90" className={className} fill="none">
      {/* Handle */}
      <path
        d="M36 24 V15 C36 11, 40 9, 45 9 H55 C60 9, 64 11, 64 15 V24"
        stroke="#1E293B"
        strokeWidth="5"
        strokeLinecap="round"
      />
      {/* Case Body */}
      <rect
        x="12"
        y="22"
        width="76"
        height="56"
        rx="11"
        fill="#1E293B"
        stroke="#0F172A"
        strokeWidth="4"
      />
      {/* Inner Metallic Panel */}
      <rect
        x="18"
        y="28"
        width="64"
        height="44"
        rx="7"
        fill={accentColor}
        stroke="#0F172A"
        strokeWidth="3"
      />
      {/* Vertical Straps */}
      <rect x="28" y="22" width="7" height="56" fill="#F8FAFC" opacity="0.35" />
      <rect x="65" y="22" width="7" height="56" fill="#F8FAFC" opacity="0.35" />
      {/* Center Emblem */}
      <circle
        cx="50"
        cy="50"
        r="13"
        fill="#0F172A"
        stroke="#F8FAFC"
        strokeWidth="2.5"
      />
      {tier === 'mystery' && (
        <path
          d="M46 45 C46 41, 54 41, 54 46 C54 49, 50 50, 50 53 M50 58 V59"
          stroke="#FDE047"
          strokeWidth="3"
          strokeLinecap="round"
        />
      )}
      {tier === 'gold_60k' && (
        <polygon
          points="50,39 53,46 61,46 55,51 57,59 50,54 43,59 45,51 39,46 47,46"
          fill="#FDE047"
        />
      )}
      {tier === 'gold_40k' && (
        <polygon points="50,39 60,50 50,61 40,50" fill="#67E8F9" />
      )}
      {tier === 'gold_20k' && (
        <path
          d="M50 41 V59 M46 45 H53 C55 45, 55 50, 50 50 C45 50, 45 55, 47 55 H54"
          stroke="#34D399"
          strokeWidth="2.8"
          strokeLinecap="round"
        />
      )}
      {tier === 'empty_0' && (
        <circle
          cx="50"
          cy="50"
          r="6"
          stroke="#CBD5E1"
          strokeWidth="2.5"
          strokeDasharray="3 3"
        />
      )}
      {tier === 'bomb_minus_20k' && (
        <path
          d="M44 44 L56 56 M56 44 L44 56"
          stroke="#FB7185"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
};

export const HeistSafeDoorSvg: React.FC<{
  isOpen?: boolean;
  isExploded?: boolean;
  className?: string;
}> = ({ isOpen = false, isExploded = false, className = 'w-24 h-24' }) => (
  <svg viewBox="0 0 120 120" className={className} fill="none">
    {/* Safe Outer Frame */}
    <rect
      x="10"
      y="10"
      width="100"
      height="100"
      rx="18"
      fill="#0F172A"
      stroke="#F59E0B"
      strokeWidth="5"
    />
    {/* Safe Door Interior */}
    <rect
      x="20"
      y="20"
      width="80"
      height="80"
      rx="12"
      fill={isExploded ? '#881337' : isOpen ? '#065F46' : '#1E293B'}
      stroke="#CBD5E1"
      strokeWidth="3.5"
    />
    {/* Heavy Locking Bolts */}
    <rect x="14" y="34" width="10" height="8" rx="2" fill="#FBBF24" />
    <rect x="14" y="78" width="10" height="8" rx="2" fill="#FBBF24" />
    <rect x="96" y="34" width="10" height="8" rx="2" fill="#FBBF24" />
    <rect x="96" y="78" width="10" height="8" rx="2" fill="#FBBF24" />
    {/* Central Vault Wheel */}
    <circle
      cx="60"
      cy="60"
      r="24"
      fill="#334155"
      stroke="#F59E0B"
      strokeWidth="4.5"
    />
    {/* Wheel Spokes */}
    <line x1="60" y1="36" x2="60" y2="84" stroke="#FDE047" strokeWidth="4" />
    <line x1="36" y1="60" x2="84" y2="60" stroke="#FDE047" strokeWidth="4" />
    <line x1="43" y1="43" x2="77" y2="77" stroke="#FDE047" strokeWidth="3.5" />
    <line x1="77" y1="43" x2="43" y2="77" stroke="#FDE047" strokeWidth="3.5" />
    <circle
      cx="60"
      cy="60"
      r="9"
      fill={isExploded ? '#F43F5E' : '#F59E0B'}
      stroke="#0F172A"
      strokeWidth="3"
    />
  </svg>
);

/* ============================================================================
 * MAIN COMPONENT: SplitStealGame
 * ========================================================================== */

export const SplitStealGame: React.FC<SplitStealGameProps> = ({
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

  // Local state for Pass-and-Play privacy curtain ONLY
  const [pnpCurtainOpen, setPnpCurtainOpen] = useState(false);

  // Local draft state for candidate claim before locking
  const [draftTier, setDraftTier] = useState<BriefcaseTierId>('gold_60k');
  const [draftPromiseIdx, setDraftPromiseIdx] = useState<number>(0);

  const getPlayer = (id: string | null | undefined): SplitStealPlayerInfo => {
    const found = players.find((p) => p.id === id);
    return (
      found || {
        id: id || 'unknown',
        name: isAr ? 'لص مقنّع' : 'Masked Thief',
        avatar_color: '#f59e0b',
        score: 0,
      }
    );
  };

  const bossPlayer = getPlayer(gameData.bossId);
  const partnerPlayer = gameData.partnerId ? getPlayer(gameData.partnerId) : null;

  /* ==========================================================================
   * GAMEPLAY HANDLERS
   * ======================================================================== */

  const handleLockClaim = (
    candidateId: string,
    claimedTier: BriefcaseTierId,
    promiseIndex: number
  ) => {
    const updatedClaims: Record<string, CandidateClaim> = {
      ...gameData.claims,
      [candidateId]: {
        playerId: candidateId,
        claimedTier,
        promiseIndex,
        locked: true,
      },
    };

    const nextCandidateIndex = gameData.activeCandidateIndex + 1;

    // Special convenience for 2-player game: once the single candidate locks claim,
    // if there's only 1 candidate, the Boss still gets to see the claim and click "Open Vault Showdown"
    setPnpCurtainOpen(false);
    onUpdateGameData({
      ...gameData,
      claims: updatedClaims,
      activeCandidateIndex: nextCandidateIndex,
    });
  };

  const handleSelectPartnerForVault = (chosenPartnerId: string) => {
    const bossCaseSpec =
      BRIEFCASE_CATALOG[gameData.briefcases[gameData.bossId] || 'gold_20k'];
    const partnerCaseSpec =
      BRIEFCASE_CATALOG[gameData.briefcases[chosenPartnerId] || 'empty_0'];

    const rawPot =
      gameData.vaultBaseBonus + bossCaseSpec.value + partnerCaseSpec.value;
    const vaultPot = Math.max(20000, rawPot);

    setPnpCurtainOpen(false);
    onUpdateGameData({
      ...gameData,
      phase: 'showdown',
      partnerId: chosenPartnerId,
      vaultPot,
      pnpShowdownStep: 'duelist_boss',
      pnpSpectatorIndex: 0,
      duelistPledges: {
        bossPledgeIndex: 0,
        partnerPledgeIndex: 1,
        bossInterrogationIndex: null,
      },
      orbChoices: {},
      spectatorBets: {},
    });
  };

  const handleSendPledge = (
    role: 'boss' | 'partner' | 'interrogation',
    idx: number
  ) => {
    const nextPledges = { ...gameData.duelistPledges };
    if (role === 'boss') nextPledges.bossPledgeIndex = idx;
    if (role === 'partner') nextPledges.partnerPledgeIndex = idx;
    if (role === 'interrogation') nextPledges.bossInterrogationIndex = idx;

    onUpdateGameData({
      ...gameData,
      duelistPledges: nextPledges,
    });
  };

  const resolveShowdownState = (
    bossOrb: OrbChoice,
    partnerOrb: OrbChoice,
    currentSpectatorBets: Record<string, SpectatorBetType>
  ): SplitStealGameState => {
    const partnerId = gameData.partnerId || gameData.candidateIds[0];
    const bossId = gameData.bossId;
    const bossCase = gameData.briefcases[bossId] || 'gold_20k';
    const partnerCase = gameData.briefcases[partnerId] || 'empty_0';
    const partnerClaim =
      gameData.claims[partnerId]?.claimedTier || 'gold_60k';
    const wasPartnerHonestAboutBriefcase = partnerCase === partnerClaim;

    let outcomeType: RoundResolution['outcomeType'] = 'both_split';
    let bossCashDelta = 0;
    let partnerCashDelta = 0;
    let winningSpectatorBet: SpectatorBetType = 'both_split';

    if (bossOrb === 'split' && partnerOrb === 'split') {
      outcomeType = 'both_split';
      winningSpectatorBet = 'both_split';
      bossCashDelta = Math.round(gameData.vaultPot / 2);
      partnerCashDelta = Math.round(gameData.vaultPot / 2);
    } else if (bossOrb === 'steal' && partnerOrb === 'split') {
      outcomeType = 'boss_steals';
      winningSpectatorBet = 'one_steals';
      bossCashDelta = gameData.vaultPot;
      partnerCashDelta = 0;
    } else if (bossOrb === 'split' && partnerOrb === 'steal') {
      outcomeType = 'partner_steals';
      winningSpectatorBet = 'one_steals';
      bossCashDelta = 0;
      partnerCashDelta = gameData.vaultPot;
    } else {
      outcomeType = 'both_steal';
      winningSpectatorBet = 'both_steal';
      if (partnerCase === 'bomb_minus_20k') {
        bossCashDelta = -10000;
        partnerCashDelta = -10000;
      } else {
        bossCashDelta = 0;
        partnerCashDelta = 0;
      }
    }

    const nextCash = { ...gameData.cashByPlayer };
    nextCash[bossId] = Math.max(0, (nextCash[bossId] || 0) + bossCashDelta);
    nextCash[partnerId] = Math.max(
      0,
      (nextCash[partnerId] || 0) + partnerCashDelta
    );

    const nextSplits = { ...gameData.splitsCount };
    const nextSteals = { ...gameData.stealsCount };
    const nextBetrayals = { ...gameData.successfulBetrayals };
    const nextSpecWins = { ...gameData.spectatorWinsCount };

    if (bossOrb === 'split') nextSplits[bossId] = (nextSplits[bossId] || 0) + 1;
    else nextSteals[bossId] = (nextSteals[bossId] || 0) + 1;

    if (partnerOrb === 'split')
      nextSplits[partnerId] = (nextSplits[partnerId] || 0) + 1;
    else nextSteals[partnerId] = (nextSteals[partnerId] || 0) + 1;

    if (outcomeType === 'boss_steals') {
      nextBetrayals[bossId] = (nextBetrayals[bossId] || 0) + 1;
    } else if (outcomeType === 'partner_steals') {
      nextBetrayals[partnerId] = (nextBetrayals[partnerId] || 0) + 1;
    }

    const spectatorWinners: string[] = [];
    const spectatorBetResults: RoundResolution['spectatorBetResults'] = {};

    const spectatorIds = players
      .map((p) => p.id)
      .filter((id) => id !== bossId && id !== partnerId);

    spectatorIds.forEach((sid) => {
      const bet = currentSpectatorBets[sid];
      if (bet) {
        const won = bet === winningSpectatorBet;
        const delta = won ? 15000 : 0;
        spectatorBetResults[sid] = { bet, won, delta };
        if (won) {
          spectatorWinners.push(sid);
          nextCash[sid] = (nextCash[sid] || 0) + delta;
          nextSpecWins[sid] = (nextSpecWins[sid] || 0) + 1;
        }
      }
    });

    const resolution: RoundResolution = {
      round: gameData.round,
      bossId,
      bossName: getPlayer(bossId).name,
      partnerId,
      partnerName: getPlayer(partnerId).name,
      bossBriefcase: bossCase,
      partnerBriefcase: partnerCase,
      PartnerClaimedTier: partnerClaim,
      wasPartnerHonestAboutBriefcase,
      vaultBaseBonus: gameData.vaultBaseBonus,
      vaultPot: gameData.vaultPot,
      bossChoice: bossOrb,
      partnerChoice: partnerOrb,
      outcomeType,
      bossCashDelta,
      partnerCashDelta,
      spectatorWinners,
      spectatorBetResults,
    };

    try {
      confetti({
        particleCount: outcomeType === 'both_steal' ? 35 : 85,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch {
      // ignore confetti error
    }

    return {
      ...gameData,
      phase: 'reveal',
      orbChoices: { boss: bossOrb, partner: partnerOrb },
      spectatorBets: currentSpectatorBets,
      cashByPlayer: nextCash,
      splitsCount: nextSplits,
      stealsCount: nextSteals,
      successfulBetrayals: nextBetrayals,
      spectatorWinsCount: nextSpecWins,
      lastResolution: resolution,
      roundHistory: [...gameData.roundHistory, resolution],
    };
  };

  const handleLockOrbChoice = (role: 'boss' | 'partner', choice: OrbChoice) => {
    const nextOrbChoices = {
      ...gameData.orbChoices,
      [role]: choice,
    };

    setPnpCurtainOpen(false);

    // In Pass-and-Play mode, advance step by step
    if (isPassAndPlay) {
      const spectatorIds = players
        .map((p) => p.id)
        .filter((id) => id !== gameData.bossId && id !== gameData.partnerId);

      if (role === 'boss') {
        onUpdateGameData({
          ...gameData,
          orbChoices: nextOrbChoices,
          pnpShowdownStep: 'duelist_partner',
        });
        return;
      }

      if (role === 'partner') {
        if (spectatorIds.length > 0) {
          onUpdateGameData({
            ...gameData,
            orbChoices: nextOrbChoices,
            pnpShowdownStep: 'spectators',
            pnpSpectatorIndex: 0,
          });
        } else {
          // 2 players only -> immediately resolve showdown!
          const nextState = resolveShowdownState(
            nextOrbChoices.boss || 'split',
            choice,
            gameData.spectatorBets
          );
          onUpdateGameData(nextState);
        }
        return;
      }
    }

    // Online Mode: if both duelists have now locked their orbs, automatically resolve!
    if (nextOrbChoices.boss && nextOrbChoices.partner) {
      const nextState = resolveShowdownState(
        nextOrbChoices.boss,
        nextOrbChoices.partner,
        gameData.spectatorBets
      );
      onUpdateGameData(nextState);
    } else {
      onUpdateGameData({
        ...gameData,
        orbChoices: nextOrbChoices,
      });
    }
  };

  const handlePlaceSpectatorBet = (
    spectatorId: string,
    bet: SpectatorBetType
  ) => {
    const nextBets = {
      ...gameData.spectatorBets,
      [spectatorId]: bet,
    };

    if (isPassAndPlay) {
      const spectatorIds = players
        .map((p) => p.id)
        .filter((id) => id !== gameData.bossId && id !== gameData.partnerId);
      const nextIdx = gameData.pnpSpectatorIndex + 1;
      if (nextIdx < spectatorIds.length) {
        onUpdateGameData({
          ...gameData,
          spectatorBets: nextBets,
          pnpSpectatorIndex: nextIdx,
        });
      } else {
        // All spectators placed bets in PnP -> trigger dramatic reveal!
        const nextState = resolveShowdownState(
          gameData.orbChoices.boss || 'split',
          gameData.orbChoices.partner || 'split',
          nextBets
        );
        onUpdateGameData(nextState);
      }
      return;
    }

    onUpdateGameData({
      ...gameData,
      spectatorBets: nextBets,
    });
  };

  const handleAdvanceAfterReveal = () => {
    if (gameData.round >= gameData.totalRounds) {
      // Compute final leaderboard awards
      const sorted = [...players].sort(
        (a, b) =>
          (gameData.cashByPlayer[b.id] || 0) -
          (gameData.cashByPlayer[a.id] || 0)
      );
      const scoreAwards: Record<string, number> = {};
      sorted.forEach((p, idx) => {
        if (idx === 0) scoreAwards[p.id] = 5;
        else if (idx === 1) scoreAwards[p.id] = 3;
        else if (idx === 2) scoreAwards[p.id] = 2;
        else scoreAwards[p.id] = 1;
      });

      onUpdateGameData(
        {
          ...gameData,
          phase: 'game_over',
          scoresAwarded: true,
        },
        gameData.scoresAwarded ? undefined : scoreAwards
      );
      return;
    }

    const nextRound = gameData.round + 1;
    const nextBossPlayer = players[(nextRound - 1) % players.length];
    const nextBossId = nextBossPlayer.id;
    const nextCandidateIds = players
      .filter((p) => p.id !== nextBossId)
      .map((p) => p.id);
    const nextBriefcases = dealRoundBriefcases(players, nextBossId);

    const nextClaims: Record<string, CandidateClaim> = {};
    nextCandidateIds.forEach((cid) => {
      nextClaims[cid] = {
        playerId: cid,
        claimedTier: 'gold_60k',
        promiseIndex: 0,
        locked: false,
      };
    });

    setPnpCurtainOpen(false);
    onUpdateGameData({
      ...gameData,
      phase: 'briefcase_bluff',
      round: nextRound,
      bossId: nextBossId,
      candidateIds: nextCandidateIds,
      partnerId: null,
      briefcases: nextBriefcases,
      claims: nextClaims,
      activeCandidateIndex: 0,
      pnpShowdownStep: 'duelist_boss',
      pnpSpectatorIndex: 0,
      vaultBaseBonus: 30000 + (nextRound - 1) * 5000,
      vaultPot: 50000,
      duelistPledges: {
        bossPledgeIndex: null,
        partnerPledgeIndex: null,
        bossInterrogationIndex: null,
      },
      orbChoices: {},
      spectatorBets: {},
      lastResolution: null,
    });
  };

  /* ==========================================================================
   * DERIVED HELPERS
   * ======================================================================== */

  const allCandidatesLocked = gameData.candidateIds.every(
    (cid) => gameData.claims[cid]?.locked
  );

  const spectatorIds = players
    .map((p) => p.id)
    .filter((id) => id !== gameData.bossId && id !== gameData.partnerId);

  const isMyTurnAsBoss = isPassAndPlay
    ? true
    : myPlayerId === gameData.bossId;

  const isMyTurnAsPartner = isPassAndPlay
    ? true
    : myPlayerId === gameData.partnerId;

  const amIDuelistOnline =
    myPlayerId === gameData.bossId || myPlayerId === gameData.partnerId;

  /* ==========================================================================
   * RENDER: TOP HEIST VAULT HEADER & LIVE BANKROLL STRIP
   * ======================================================================== */

  const renderTopVaultHeader = () => (
    <div className="bg-slate-900 text-white rounded-3xl p-4 sm:p-5 border-4 border-slate-950 shadow-[0_8px_0_#020617] mb-5">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b-2 border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-400 border-3 border-slate-950 flex items-center justify-center shadow-[0_4px_0_#020617]">
            <HeistSafeDoorSvg className="w-9 h-9" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 border border-slate-950">
                {isAr
                  ? `الخزنة ${gameData.round} من ${gameData.totalRounds}`
                  : `Vault ${gameData.round} of ${gameData.totalRounds}`}
              </span>
              <span className="text-xs font-bold text-amber-300">
                {gameData.phase === 'briefcase_bluff'
                  ? isAr
                    ? '1. فحص الحقائب السرية واختيار الشريك'
                    : '1. Secret Briefcase Bluff & Partner Pick'
                  : gameData.phase === 'showdown'
                  ? isAr
                    ? '2. المواجهة الكبرى: شراكة أم غدر؟'
                    : '2. Grand Showdown: Split or Steal?'
                  : gameData.phase === 'reveal'
                  ? isAr
                    ? '3. كشف الكرات الذهبية!'
                    : '3. Golden Orbs Reveal!'
                  : isAr
                  ? 'النتائج النهائية'
                  : 'Final Standings'}
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-white mt-0.5">
              {isAr
                ? 'شرف اللصوص: شراكة أم غدر؟'
                : 'Honor Among Thieves: Split or Steal'}
            </h2>
          </div>
        </div>

        {/* Current Vault Boss Pill */}
        <div className="flex items-center gap-2.5 bg-slate-800/90 px-3.5 py-2 rounded-2xl border-2 border-amber-400/50">
          <CartoonAvatarSvg
            index={0}
            color={bossPlayer.avatar_color}
            className="w-8 h-8 rounded-full border-2 border-amber-400"
          />
          <div className="text-xs">
            <div className="text-amber-300 font-bold">
              {isAr ? 'زعيم الخزنة الحالي' : 'Current Vault Boss'}
            </div>
            <div className="font-black text-white text-sm">
              {bossPlayer.name}
            </div>
          </div>
        </div>
      </div>

      {/* Player Bankroll Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 mt-3">
        {players.map((p, pIdx) => {
          const cash = gameData.cashByPlayer[p.id] ?? 30000;
          const isBoss = p.id === gameData.bossId;
          const isPartner = p.id === gameData.partnerId;
          return (
            <div
              key={p.id}
              className={`flex items-center justify-between gap-2 px-3 py-2 rounded-2xl border-2 transition-all ${
                isBoss
                  ? 'bg-amber-400/20 border-amber-400 text-white'
                  : isPartner
                  ? 'bg-emerald-400/20 border-emerald-400 text-white'
                  : 'bg-slate-800/70 border-slate-700 text-slate-200'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <CartoonAvatarSvg
                  index={pIdx}
                  color={p.avatar_color}
                  className="w-6 h-6 shrink-0"
                />
                <span className="font-bold text-xs truncate">{p.name}</span>
              </div>
              <span className="font-black text-xs text-amber-300 shrink-0">
                {formatMoney(cash)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );

  /* ==========================================================================
   * PHASE 1: BRIEFCASE BLUFF & PARTNER SELECTION
   * ======================================================================== */

  const renderPhaseBriefcaseBluff = () => {
    // Pass-and-Play sequential candidate inspection
    if (isPassAndPlay && !allCandidatesLocked) {
      const currentCandidateId =
        gameData.candidateIds[gameData.activeCandidateIndex] ||
        gameData.candidateIds[0];
      const currentCandidate = getPlayer(currentCandidateId);
      const secretTier =
        gameData.briefcases[currentCandidateId] || 'empty_0';
      const secretSpec = BRIEFCASE_CATALOG[secretTier];

      if (!pnpCurtainOpen) {
        return (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border-4 border-slate-900 shadow-[0_8px_0_#0f172a] text-center max-w-xl mx-auto">
            <div className="w-20 h-20 mx-auto mb-4 rounded-3xl bg-amber-100 border-3 border-slate-900 flex items-center justify-center">
              <VaultBriefcaseSvg tier="mystery" className="w-14 h-14" />
            </div>
            <span className="inline-block px-3 py-1 rounded-full bg-slate-900 text-amber-300 text-xs font-black mb-2">
              {isAr
                ? `مرّر الجهاز إلى المرشح (${gameData.activeCandidateIndex + 1} من ${gameData.candidateIds.length})`
                : `Pass device to Candidate (${gameData.activeCandidateIndex + 1} of ${gameData.candidateIds.length})`}
            </span>
            <h3 className="text-2xl font-black text-slate-900 mb-2">
              {currentCandidate.name}
            </h3>
            <p className="text-sm font-bold text-slate-600 mb-6">
              {isAr
                ? `افتح حقيبتك السرية دون أن يراك زعيم الخزنة (${bossPlayer.name})، ثم أعلن ادعاءك لإقناعه باختيارك!`
                : `Inspect your secret briefcase away from Vault Boss (${bossPlayer.name}), then make your public claim!`}
            </p>
            <button
              type="button"
              onClick={() => {
                setDraftTier('gold_60k');
                setDraftPromiseIdx(0);
                setPnpCurtainOpen(true);
              }}
              className="w-full py-4 px-6 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-base border-3 border-slate-900 shadow-[0_5px_0_#0f172a] active:translate-y-1 transition-all flex items-center justify-center gap-2"
            >
              <Eye size={22} weight="fill" />
              {isAr
                ? `أنا ${currentCandidate.name} — اكشف حقيبتي السرية`
                : `I am ${currentCandidate.name} — Reveal My Briefcase`}
            </button>
          </div>
        );
      }

      return renderCandidateClaimEditor(currentCandidate, secretSpec);
    }

    // Online Mode OR all candidates have locked their claims!
    const amICandidateOnline =
      !isPassAndPlay && gameData.candidateIds.includes(myPlayerId);
    const myClaim = gameData.claims[myPlayerId];
    const mySecretTier = gameData.briefcases[myPlayerId] || 'empty_0';
    const mySecretSpec = BRIEFCASE_CATALOG[mySecretTier];

    const bossSecretTier = gameData.briefcases[gameData.bossId] || 'gold_20k';
    const bossSecretSpec = BRIEFCASE_CATALOG[bossSecretTier];

    return (
      <div className="space-y-5">
        {/* Online Mode: If I am a Candidate and haven't locked my claim yet, show my secret briefcase immediately without any curtain */}
        {amICandidateOnline && !myClaim?.locked && (
          <div>
            {renderCandidateClaimEditor(getPlayer(myPlayerId), mySecretSpec)}
          </div>
        )}

        {/* Online Mode: If I am the Vault Boss, show my own Boss Briefcase contribution */}
        {(!isPassAndPlay && myPlayerId === gameData.bossId) && (
          <div className="bg-amber-50 rounded-3xl p-5 border-4 border-slate-900 shadow-[0_6px_0_#0f172a] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <VaultBriefcaseSvg
                tier={bossSecretSpec.id}
                className="w-16 h-16 shrink-0"
              />
              <div>
                <div className="text-xs font-black uppercase text-amber-800">
                  {isAr
                    ? 'حقيبتك السرية كزعيم للخزنة (تضاف تلقائياً للخزنة)'
                    : 'Your Secret Boss Briefcase (Added automatically to Vault)'}
                </div>
                <div className="text-lg font-black text-slate-900">
                  {isAr ? bossSecretSpec.titleAr : bossSecretSpec.titleEn}
                </div>
                <div className="text-xs font-bold text-slate-600">
                  {isAr
                    ? `بالإضافة إلى مكافأة الخزنة الأساسية (${formatMoney(gameData.vaultBaseBonus)})`
                    : `Plus base Vault heist bonus (${formatMoney(gameData.vaultBaseBonus)})`}
                </div>
              </div>
            </div>
            <div className="px-4 py-2 rounded-2xl bg-slate-900 text-amber-300 font-black text-sm">
              {isAr
                ? 'اختر شريكاً واحداً من المرشحين بالأسفل!'
                : 'Pick 1 Partner from the candidates below!'}
            </div>
          </div>
        )}

        {/* Candidates Claims Showcase Grid & Boss Partner Selection */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border-4 border-slate-900 shadow-[0_8px_0_#0f172a]">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
                <Briefcase size={24} weight="fill" className="text-amber-500" />
                {isAr
                  ? 'وعود المرشحين وحقائبهم أمام زعيم الخزنة'
                  : 'Candidates Public Claims & Briefcases'}
              </h3>
              <p className="text-xs sm:text-sm font-bold text-slate-600">
                {isAr
                  ? `الزعيم (${bossPlayer.name}) يقرأ وعود الجميع ويختار شريكاً واحداً فقط لدخول المواجهة الكبرى!`
                  : `Vault Boss (${bossPlayer.name}) inspects all claims and chooses 1 partner for the Final Showdown!`}
              </p>
            </div>
            <span className="px-3 py-1.5 rounded-xl bg-slate-100 border-2 border-slate-900 text-xs font-black text-slate-900">
              {
                gameData.candidateIds.filter(
                  (id) => gameData.claims[id]?.locked
                ).length
              }{' '}
              / {gameData.candidateIds.length}{' '}
              {isAr ? 'جاهزون' : 'Ready'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {gameData.candidateIds.map((cid, cIdx) => {
              const cand = getPlayer(cid);
              const claim = gameData.claims[cid];
              const isLocked = Boolean(claim?.locked);
              const claimedSpec =
                BRIEFCASE_CATALOG[claim?.claimedTier || 'gold_60k'];
              const promiseObj =
                CANDIDATE_PROMISES[claim?.promiseIndex || 0] ||
                CANDIDATE_PROMISES[0];

              return (
                <div
                  key={cid}
                  className={`rounded-2xl p-4 border-3 transition-all flex flex-col justify-between gap-3 ${
                    isLocked
                      ? 'bg-amber-50/60 border-slate-900 shadow-[0_4px_0_#0f172a]'
                      : 'bg-slate-50 border-dashed border-slate-300 opacity-80'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <CartoonAvatarSvg
                        index={cIdx + 1}
                        color={cand.avatar_color}
                        className="w-11 h-11 rounded-full border-2 border-slate-900 shrink-0"
                      />
                      <div>
                        <div className="font-black text-base text-slate-900">
                          {cand.name}
                        </div>
                        <div className="text-xs font-bold text-slate-500">
                          {isAr ? 'رصيده:' : 'Bank:'}{' '}
                          {formatMoney(gameData.cashByPlayer[cid] || 30000)}
                        </div>
                      </div>
                    </div>

                    <VaultBriefcaseSvg
                      tier={isLocked ? claimedSpec.id : 'mystery'}
                      className="w-12 h-12 shrink-0"
                    />
                  </div>

                  {isLocked ? (
                    <div className="space-y-2">
                      <div
                        className={`inline-block px-3 py-1 rounded-xl border-2 text-xs font-black ${claimedSpec.badgeClass}`}
                      >
                        {isAr ? 'يدّعي أن بحقيبته:' : 'Claims to hold:'}{' '}
                        {isAr ? claimedSpec.titleAr : claimedSpec.titleEn}
                      </div>
                      <div className="p-3 rounded-xl bg-white border-2 border-slate-200 text-xs font-bold text-slate-800 italic">
                        &ldquo;{isAr ? promiseObj.ar : promiseObj.en}&rdquo;
                      </div>
                    </div>
                  ) : (
                    <div className="py-3 text-center text-xs font-bold text-slate-500">
                      {isAr
                        ? 'يفحص حقيبته السرية ويجهز وعده...'
                        : 'Inspecting secret briefcase & preparing claim...'}
                    </div>
                  )}

                  {isLocked && (isMyTurnAsBoss || isHost) && (
                    <button
                      type="button"
                      onClick={() => handleSelectPartnerForVault(cid)}
                      className="w-full py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm border-2 border-slate-900 shadow-[0_3px_0_#0f172a] active:translate-y-0.5 transition-all flex items-center justify-center gap-2"
                    >
                      <HandshakeIcon />
                      {isAr
                        ? `اختر ${cand.name} شريكاً في الخزنة!`
                        : `Pick ${cand.name} as Vault Partner!`}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderCandidateClaimEditor = (
    candidate: SplitStealPlayerInfo,
    secretSpec: BriefcaseSpec
  ) => {
    const claimableTiers: BriefcaseTierId[] = [
      'gold_60k',
      'gold_40k',
      'gold_20k',
    ];

    return (
      <div className="bg-white rounded-3xl p-5 sm:p-6 border-4 border-slate-900 shadow-[0_8px_0_#0f172a]">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 mb-5 border-b-2 border-slate-100">
          <div className="flex items-center gap-4">
            <VaultBriefcaseSvg
              tier={secretSpec.id}
              className="w-16 h-16 shrink-0"
            />
            <div>
              <span className="text-xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-900 text-amber-300">
                {isAr
                  ? `سري للغاية — حقيبة ${candidate.name} الحقيقية`
                  : `Top Secret — ${candidate.name}'s True Briefcase`}
              </span>
              <h3 className="text-lg sm:text-xl font-black text-slate-900 mt-1">
                {isAr ? secretSpec.titleAr : secretSpec.titleEn}
              </h3>
              <p className="text-xs font-bold text-slate-600">
                {isAr ? secretSpec.subtitleAr : secretSpec.subtitleEn}
              </p>
            </div>
          </div>
        </div>

        {/* Step A: Choose what to CLAIM is inside */}
        <div className="mb-4">
          <label className="block text-xs font-black text-slate-700 uppercase mb-2">
            {isAr
              ? '1. ماذا ستدّعي أمام زعيم الخزنة أن بداخل حقيبتك؟ (يمكنك الصدق أو الخداع!)'
              : '1. What will you CLAIM is inside your briefcase to the Vault Boss? (Truth or Bluff!)'}
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {claimableTiers.map((tid) => {
              const spec = BRIEFCASE_CATALOG[tid];
              const selected = draftTier === tid;
              return (
                <button
                  key={tid}
                  type="button"
                  onClick={() => setDraftTier(tid)}
                  className={`p-3 rounded-2xl border-3 text-right transition-all flex items-center gap-3 ${
                    selected
                      ? 'bg-amber-100 border-slate-900 shadow-[0_4px_0_#0f172a] scale-[1.01]'
                      : 'bg-slate-50 border-slate-200 hover:border-slate-400'
                  }`}
                >
                  <VaultBriefcaseSvg tier={tid} className="w-10 h-10 shrink-0" />
                  <div className="text-xs font-black text-slate-900">
                    {isAr ? spec.titleAr : spec.titleEn}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step B: Choose Public Promise */}
        <div className="mb-5">
          <label className="block text-xs font-black text-slate-700 uppercase mb-2">
            {isAr
              ? '2. اختر وعد الشرف الذي ستوجهه لزعيم الخزنة:'
              : '2. Choose your Pledge of Honor to convince the Vault Boss:'}
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {CANDIDATE_PROMISES.map((pr, idx) => {
              const selected = draftPromiseIdx === idx;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setDraftPromiseIdx(idx)}
                  className={`p-3 rounded-xl border-2 text-xs font-bold text-right transition-all ${
                    selected
                      ? 'bg-emerald-100 border-slate-900 text-slate-950 font-black shadow-[0_3px_0_#0f172a]'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  &ldquo;{isAr ? pr.ar : pr.en}&rdquo;
                </button>
              );
            })}
          </div>
        </div>

        <button
          type="button"
          onClick={() =>
            handleLockClaim(candidate.id, draftTier, draftPromiseIdx)
          }
          className="w-full py-3.5 px-6 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-sm sm:text-base border-3 border-slate-900 shadow-[0_5px_0_#0f172a] active:translate-y-0.5 transition-all flex items-center justify-center gap-2"
        >
          <SealCheck size={22} weight="fill" />
          {isAr
            ? 'اعتماد الوعد وإغلاق الحقيبة أمام الجميع'
            : 'Lock Public Claim & Close Briefcase'}
        </button>
      </div>
    );
  };

  /* ==========================================================================
   * PHASE 2: GRAND SHOWDOWN (SPLIT OR STEAL + SPECTATOR SYNDICATE BETS)
   * ======================================================================== */

  const renderPhaseShowdown = () => {
    if (!partnerPlayer) return null;

    const bossPledge =
      gameData.duelistPledges.bossPledgeIndex !== null
        ? SHOWDOWN_PLEDGES[gameData.duelistPledges.bossPledgeIndex]
        : null;
    const partnerPledge =
      gameData.duelistPledges.partnerPledgeIndex !== null
        ? SHOWDOWN_PLEDGES[gameData.duelistPledges.partnerPledgeIndex]
        : null;
    const bossInterrogation =
      gameData.duelistPledges.bossInterrogationIndex !== null
        ? BOSS_INTERROGATIONS[gameData.duelistPledges.bossInterrogationIndex]
        : null;

    return (
      <div className="space-y-5">
        {/* Grand Vault Pot Banner */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-white rounded-3xl p-5 sm:p-6 border-4 border-amber-400 shadow-[0_8px_0_#0f172a]">
          <div className="flex flex-col md:flex-row items-center justify-between gap-5">
            {/* Boss Side */}
            <div className="flex items-center gap-3 bg-slate-800/90 px-4 py-3 rounded-2xl border-2 border-amber-400/60 w-full md:w-auto">
              <CartoonAvatarSvg
                index={0}
                color={bossPlayer.avatar_color}
                className="w-12 h-12 rounded-full border-2 border-amber-400 shrink-0"
              />
              <div>
                <span className="text-[11px] font-black uppercase text-amber-300">
                  {isAr ? 'زعيم الخزنة' : 'Vault Boss'}
                </span>
                <div className="font-black text-base text-white">
                  {bossPlayer.name}
                </div>
                <div className="text-xs font-bold text-emerald-300">
                  {gameData.orbChoices.boss
                    ? isAr
                      ? 'تم قفل الكرة السرية!'
                      : 'Secret Orb Locked!'
                    : isAr
                    ? 'يفكر في قراره...'
                    : 'Deciding...'}
                </div>
              </div>
            </div>

            {/* Center Vault Pot */}
            <div className="text-center flex flex-col items-center">
              <div className="text-xs font-black uppercase tracking-widest text-amber-300 mb-1">
                {isAr
                  ? 'إجمالي غنيمة الخزنة الكبرى (شاملة الحقائب السرية!)'
                  : 'Total Grand Vault Pot (Including Secret Briefcases!)'}
              </div>
              <div className="text-3xl sm:text-4xl font-black text-amber-400 tracking-tight px-5 py-1.5 rounded-2xl bg-slate-950/90 border-2 border-amber-400/80 shadow-inner">
                {formatMoney(gameData.vaultPot)}
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2 mt-2 text-[11px] font-bold text-slate-300">
                <span className="px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-400/40">
                  {isAr
                    ? `شراكة + شراكة = ${formatMoney(gameData.vaultPot / 2)} لكل منكما`
                    : `Split + Split = ${formatMoney(gameData.vaultPot / 2)} each`}
                </span>
                <span className="px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-400/40">
                  {isAr
                    ? `غدر + شراكة = ${formatMoney(gameData.vaultPot)} للغادر و$0 للآخر`
                    : `Steal + Split = ${formatMoney(gameData.vaultPot)} to betrayer`}
                </span>
                <span className="px-2 py-0.5 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-400/40">
                  {isAr
                    ? 'غدر + غدر = $0 للطرفين!'
                    : 'Steal + Steal = $0 for both!'}
                </span>
              </div>
            </div>

            {/* Partner Side */}
            <div className="flex items-center gap-3 bg-slate-800/90 px-4 py-3 rounded-2xl border-2 border-emerald-400/60 w-full md:w-auto">
              <CartoonAvatarSvg
                index={1}
                color={partnerPlayer.avatar_color}
                className="w-12 h-12 rounded-full border-2 border-emerald-400 shrink-0"
              />
              <div>
                <span className="text-[11px] font-black uppercase text-emerald-300">
                  {isAr ? 'الشريك المختار' : 'Chosen Partner'}
                </span>
                <div className="font-black text-base text-white">
                  {partnerPlayer.name}
                </div>
                <div className="text-xs font-bold text-emerald-300">
                  {gameData.orbChoices.partner
                    ? isAr
                      ? 'تم قفل الكرة السرية!'
                      : 'Secret Orb Locked!'
                    : isAr
                    ? 'يفكر في قراره...'
                    : 'Deciding...'}
                </div>
              </div>
            </div>
          </div>

          {/* Live Psychological Dialogue Bubbles */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-700/80">
            <div className="bg-slate-800/80 rounded-2xl p-3 border border-amber-400/30">
              <div className="text-[11px] font-black text-amber-300 mb-1 flex items-center gap-1.5">
                <ChatCircleText size={15} weight="fill" />
                {bossPlayer.name} ({isAr ? 'زعيم الخزنة' : 'Vault Boss'}):
              </div>
              <div className="text-xs font-bold text-white italic">
                &ldquo;
                {bossPledge
                  ? isAr
                    ? bossPledge.ar
                    : bossPledge.en
                  : isAr
                  ? 'انظر في عيني.. هل جئت لنتقاسم أم لتغدر؟'
                  : 'Look me in the eye.. are we splitting or betraying?'}
                &rdquo;
              </div>
              {bossInterrogation && (
                <div className="mt-1.5 text-[11px] font-bold text-amber-200 bg-amber-500/10 px-2.5 py-1 rounded-lg">
                  {isAr ? 'استجواب:' : 'Interrogation:'}{' '}
                  {isAr ? bossInterrogation.ar : bossInterrogation.en}
                </div>
              )}
            </div>

            <div className="bg-slate-800/80 rounded-2xl p-3 border border-emerald-400/30">
              <div className="text-[11px] font-black text-emerald-300 mb-1 flex items-center gap-1.5">
                <ChatCircleText size={15} weight="fill" />
                {partnerPlayer.name} ({isAr ? 'الشريك' : 'Partner'}):
              </div>
              <div className="text-xs font-bold text-white italic">
                &ldquo;
                {partnerPledge
                  ? isAr
                    ? partnerPledge.ar
                    : partnerPledge.en
                  : isAr
                  ? 'كلمة شرف! يدي على كرة الشراكة!'
                  : 'Word of honor! My hand is on the Split orb!'}
                &rdquo;
              </div>
            </div>
          </div>
        </div>

        {/* Decision Controls: Online vs Pass-and-Play */}
        {isPassAndPlay
          ? renderPassAndPlayShowdownFlow()
          : renderOnlineShowdownFlow()}
      </div>
    );
  };

  const renderOrbDecisionCard = (
    role: 'boss' | 'partner',
    duelist: SplitStealPlayerInfo
  ) => {
    const currentLockedChoice = gameData.orbChoices[role];

    return (
      <div className="bg-white rounded-3xl p-5 sm:p-6 border-4 border-slate-900 shadow-[0_8px_0_#0f172a]">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div>
            <span className="text-xs font-black uppercase px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 border border-slate-900">
              {role === 'boss'
                ? isAr
                  ? 'قرار زعيم الخزنة السري'
                  : 'Vault Boss Secret Decision'
                : isAr
                ? 'قرار الشريك السري'
                : 'Partner Secret Decision'}
            </span>
            <h3 className="text-xl font-black text-slate-900 mt-1">
              {duelist.name} —{' '}
              {isAr
                ? 'اختر كرتك الذهبية بحسم!'
                : 'Choose Your Golden Orb!'}
            </h3>
          </div>
        </div>

        {/* Psychological Pledge Buttons before locking */}
        <div className="mb-5">
          <div className="text-xs font-black text-slate-700 mb-2">
            {isAr
              ? 'أرسل رسالة ضغط نفسي أو قسم شرف لخصمك على الطاولة:'
              : 'Send a live psychological pledge to your counterpart:'}
          </div>
          <div className="flex flex-wrap gap-2">
            {SHOWDOWN_PLEDGES.map((pl, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendPledge(role, idx)}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-amber-100 border-2 border-slate-900 text-xs font-bold text-slate-900 transition-all"
              >
                &ldquo;{isAr ? pl.ar : pl.en}&rdquo;
              </button>
            ))}
          </div>
        </div>

        {currentLockedChoice ? (
          <div className="p-6 rounded-2xl bg-emerald-50 border-3 border-emerald-600 text-center">
            <CheckCircle
              size={40}
              weight="fill"
              className="text-emerald-600 mx-auto mb-2"
            />
            <div className="text-base font-black text-slate-900">
              {isAr
                ? 'تم قفل كرتك السرية في الخزنة! بانتظار الطرف الآخر...'
                : 'Your Secret Orb is locked! Waiting for the other duelist...'}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* SPLIT ORB BUTTON */}
            <button
              type="button"
              onClick={() => handleLockOrbChoice(role, 'split')}
              className="group p-5 rounded-3xl bg-gradient-to-b from-amber-50 to-emerald-50 hover:from-emerald-100 hover:to-amber-100 border-4 border-slate-900 shadow-[0_6px_0_#0f172a] active:translate-y-1 transition-all flex flex-col items-center text-center"
            >
              <GoldenOrbSplitSvg className="w-24 h-24 mb-3 group-hover:scale-105 transition-transform" />
              <span className="px-3 py-0.5 rounded-full bg-emerald-600 text-white text-xs font-black uppercase mb-1">
                SPLIT • {isAr ? 'شراكة وتقاسم' : 'Honor & Split'}
              </span>
              <span className="text-lg font-black text-slate-900">
                {isAr ? 'كرة الشراكة الذهبية' : 'The Golden Split Orb'}
              </span>
              <span className="text-xs font-bold text-slate-600 mt-1">
                {isAr
                  ? `إذا اختار شريكك شراكة أيضاً، يأخذ كل منكما ${formatMoney(gameData.vaultPot / 2)}!`
                  : `If your partner also splits, you each take ${formatMoney(gameData.vaultPot / 2)}!`}
              </span>
            </button>

            {/* STEAL ORB BUTTON */}
            <button
              type="button"
              onClick={() => handleLockOrbChoice(role, 'steal')}
              className="group p-5 rounded-3xl bg-gradient-to-b from-rose-50 to-amber-50 hover:from-rose-100 hover:to-amber-100 border-4 border-slate-900 shadow-[0_6px_0_#0f172a] active:translate-y-1 transition-all flex flex-col items-center text-center"
            >
              <GoldenOrbStealSvg className="w-24 h-24 mb-3 group-hover:scale-105 transition-transform" />
              <span className="px-3 py-0.5 rounded-full bg-rose-600 text-white text-xs font-black uppercase mb-1">
                STEAL • {isAr ? 'غدر وسرقة الكل' : 'Betray & Steal All'}
              </span>
              <span className="text-lg font-black text-slate-900">
                {isAr ? 'كرة الغدر والسرقة' : 'The Crimson Steal Orb'}
              </span>
              <span className="text-xs font-bold text-slate-600 mt-1">
                {isAr
                  ? `تخطف ${formatMoney(gameData.vaultPot)} وحدك إذا اختار شريكك شراكة.. لكن إن غدرك أيضاً تخرجان بـ $0!`
                  : `Take all ${formatMoney(gameData.vaultPot)} if partner splits.. or $0 if both steal!`}
              </span>
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderSpectatorSyndicateBetCard = (spectator: SplitStealPlayerInfo) => {
    const currentBet = gameData.spectatorBets[spectator.id];

    return (
      <div className="bg-white rounded-3xl p-5 sm:p-6 border-4 border-slate-900 shadow-[0_8px_0_#0f172a]">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <span className="text-xs font-black uppercase px-2.5 py-0.5 rounded-full bg-purple-600 text-white">
              {isAr
                ? 'رهان نقابة اللصوص للجمهور (+$15,000)'
                : 'Syndicate Spectator Side-Bet (+$15,000)'}
            </span>
            <h3 className="text-lg sm:text-xl font-black text-slate-900 mt-1">
              {spectator.name} —{' '}
              {isAr
                ? 'توقّع نتيجة المواجهة الكبرى واربح +$15,000!'
                : 'Predict the Showdown Outcome & Win +$15,000!'}
            </h3>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {(['both_split', 'one_steals', 'both_steal'] as SpectatorBetType[]).map(
            (bType) => {
              const spec = SPECTATOR_BET_SPECS[bType];
              const isSelected = currentBet === bType;
              return (
                <button
                  key={bType}
                  type="button"
                  onClick={() => handlePlaceSpectatorBet(spectator.id, bType)}
                  className={`p-4 rounded-2xl border-3 text-right transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'bg-amber-100 border-slate-900 shadow-[0_4px_0_#0f172a] scale-[1.02]'
                      : 'bg-slate-50 border-slate-200 hover:border-slate-400'
                  }`}
                >
                  <div>
                    <div className="text-sm font-black text-slate-900 mb-1">
                      {isAr ? spec.titleAr : spec.titleEn}
                    </div>
                    <p className="text-xs font-bold text-slate-600">
                      {isAr ? spec.descAr : spec.descEn}
                    </p>
                  </div>
                  <div className="mt-3 text-xs font-black text-emerald-700">
                    {isSelected
                      ? isAr
                        ? 'تم تثبيت رهانك!'
                        : 'Bet Locked!'
                      : isAr
                      ? 'اضغط للرهان (+$15,000)'
                      : 'Click to Bet (+$15,000)'}
                  </div>
                </button>
              );
            }
          )}
        </div>
      </div>
    );
  };

  const renderOnlineShowdownFlow = () => {
    const myRole =
      myPlayerId === gameData.bossId
        ? 'boss'
        : myPlayerId === gameData.partnerId
        ? 'partner'
        : 'spectator';

    return (
      <div className="space-y-4">
        {myRole === 'boss' && renderOrbDecisionCard('boss', bossPlayer)}
        {myRole === 'partner' &&
          partnerPlayer &&
          renderOrbDecisionCard('partner', partnerPlayer)}
        {myRole === 'spectator' &&
          renderSpectatorSyndicateBetCard(getPlayer(myPlayerId))}

        {/* Host fallback button if needed */}
        {isHost &&
          gameData.orbChoices.boss &&
          gameData.orbChoices.partner && (
            <button
              type="button"
              onClick={() => {
                const nextState = resolveShowdownState(
                  gameData.orbChoices.boss || 'split',
                  gameData.orbChoices.partner || 'split',
                  gameData.spectatorBets
                );
                onUpdateGameData(nextState);
              }}
              className="w-full py-3.5 rounded-2xl bg-amber-400 text-slate-950 font-black border-3 border-slate-900"
            >
              {isAr ? 'كشف الكرات الذهبية الآن!' : 'Reveal Golden Orbs Now!'}
            </button>
          )}
      </div>
    );
  };

  const renderPassAndPlayShowdownFlow = () => {
    if (!partnerPlayer) return null;

    if (gameData.pnpShowdownStep === 'duelist_boss') {
      if (!pnpCurtainOpen) {
        return (
          <div className="bg-white rounded-3xl p-6 border-4 border-slate-900 shadow-[0_8px_0_#0f172a] text-center max-w-xl mx-auto">
            <h3 className="text-xl font-black text-slate-900 mb-2">
              {isAr
                ? `مرّر الجهاز إلى زعيم الخزنة: ${bossPlayer.name}`
                : `Pass device to Vault Boss: ${bossPlayer.name}`}
            </h3>
            <p className="text-xs font-bold text-slate-600 mb-4">
              {isAr
                ? 'اختر كرتك السرية (شراكة أم غدر) دون أن يرى شريكك!'
                : 'Secretly lock your Golden Orb (Split or Steal) away from your partner!'}
            </p>
            <button
              type="button"
              onClick={() => setPnpCurtainOpen(true)}
              className="w-full py-3.5 rounded-2xl bg-amber-400 text-slate-950 font-black border-3 border-slate-900 shadow-[0_4px_0_#0f172a]"
            >
              {isAr
                ? `أنا ${bossPlayer.name} — افتح شاشة اختيار الكرة`
                : `I am ${bossPlayer.name} — Open Orb Selector`}
            </button>
          </div>
        );
      }
      return renderOrbDecisionCard('boss', bossPlayer);
    }

    if (gameData.pnpShowdownStep === 'duelist_partner') {
      if (!pnpCurtainOpen) {
        return (
          <div className="bg-white rounded-3xl p-6 border-4 border-slate-900 shadow-[0_8px_0_#0f172a] text-center max-w-xl mx-auto">
            <h3 className="text-xl font-black text-slate-900 mb-2">
              {isAr
                ? `مرّر الجهاز إلى الشريك المختار: ${partnerPlayer.name}`
                : `Pass device to Chosen Partner: ${partnerPlayer.name}`}
            </h3>
            <p className="text-xs font-bold text-slate-600 mb-4">
              {isAr
                ? 'لقد قفل الزعيم كرته.. الآن دورك لتختار: شراكة أم غدر؟'
                : 'The Vault Boss locked their orb.. now choose yours: Split or Steal?'}
            </p>
            <button
              type="button"
              onClick={() => setPnpCurtainOpen(true)}
              className="w-full py-3.5 rounded-2xl bg-emerald-400 text-slate-950 font-black border-3 border-slate-900 shadow-[0_4px_0_#0f172a]"
            >
              {isAr
                ? `أنا ${partnerPlayer.name} — افتح شاشة اختيار الكرة`
                : `I am ${partnerPlayer.name} — Open Orb Selector`}
            </button>
          </div>
        );
      }
      return renderOrbDecisionCard('partner', partnerPlayer);
    }

    if (gameData.pnpShowdownStep === 'spectators' && spectatorIds.length > 0) {
      const currentSpecId =
        spectatorIds[gameData.pnpSpectatorIndex] || spectatorIds[0];
      return renderSpectatorSyndicateBetCard(getPlayer(currentSpecId));
    }

    return null;
  };

  /* ==========================================================================
   * PHASE 3: DRAMATIC GOLDEN ORB REVEAL
   * ======================================================================== */

  const renderPhaseReveal = () => {
    const res = gameData.lastResolution;
    if (!res) return null;

    const partnerTrueSpec = BRIEFCASE_CATALOG[res.partnerBriefcase];
    const partnerClaimSpec = BRIEFCASE_CATALOG[res.PartnerClaimedTier];

    const outcomeBanner =
      res.outcomeType === 'both_split'
        ? {
            bg: 'bg-emerald-500 text-slate-950 border-slate-900',
            titleAr: 'شرف اللصوص! كلاهما اختار شراكة وتقاسما الغنيمة بالنصف!',
            titleEn: 'Honor Among Thieves! Both chose SPLIT and shared 50/50!',
          }
        : res.outcomeType === 'boss_steals'
        ? {
            bg: 'bg-amber-400 text-slate-950 border-slate-900',
            titleAr: `طعنة غدر صاعقة! ${res.bossName} غدر بـ ${res.partnerName} وخطف الخزنة كاملة!`,
            titleEn: `Ruthless Backstab! ${res.bossName} betrayed ${res.partnerName} and stole 100%!`,
          }
        : res.outcomeType === 'partner_steals'
        ? {
            bg: 'bg-amber-400 text-slate-950 border-slate-900',
            titleAr: `انقلاب في الخزنة! الشريك ${res.partnerName} غدر بالزعيم ${res.bossName} وخطف كل شيء!`,
            titleEn: `Vault Heist Twist! Partner ${res.partnerName} betrayed Boss ${res.bossName} for 100%!`,
          }
        : {
            bg: 'bg-rose-600 text-white border-slate-950',
            titleAr: 'طمع مزدوج! كلاهما اختار الغدر فدُمّرت الخزنة وخرجا بصفر!',
            titleEn: 'Double Greed! Both chose STEAL—the vault self-destructed for $0!',
          };

    return (
      <div className="space-y-5">
        {/* Outcome Headline Banner */}
        <motion.div
          initial={{ scale: 0.92, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={`rounded-3xl p-5 sm:p-6 border-4 shadow-[0_8px_0_#0f172a] text-center ${outcomeBanner.bg}`}
        >
          <div className="text-xs font-black uppercase tracking-widest opacity-80 mb-1">
            {isAr
              ? `نتيجة الخزنة رقم ${res.round} • إجمالي الغنيمة ${formatMoney(res.vaultPot)}`
              : `Vault #${res.round} Result • Total Pot ${formatMoney(res.vaultPot)}`}
          </div>
          <h3 className="text-xl sm:text-2xl font-black">
            {isAr ? outcomeBanner.titleAr : outcomeBanner.titleEn}
          </h3>
        </motion.div>

        {/* Side-by-Side Orbs Reveal */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Boss Orb Reveal Card */}
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="bg-white rounded-3xl p-5 border-4 border-slate-900 shadow-[0_6px_0_#0f172a] flex flex-col items-center text-center"
          >
            <span className="text-xs font-black uppercase px-3 py-0.5 rounded-full bg-slate-900 text-amber-300 mb-2">
              {isAr ? 'كرة زعيم الخزنة' : 'Vault Boss Orb'} • {res.bossName}
            </span>
            {res.bossChoice === 'split' ? (
              <GoldenOrbSplitSvg className="w-24 h-24 my-2" />
            ) : (
              <GoldenOrbStealSvg className="w-24 h-24 my-2" />
            )}
            <div
              className={`text-lg font-black px-4 py-1 rounded-xl border-2 border-slate-900 ${
                res.bossChoice === 'split'
                  ? 'bg-emerald-300 text-slate-950'
                  : 'bg-rose-500 text-white'
              }`}
            >
              {res.bossChoice === 'split'
                ? isAr
                  ? 'شراكة (SPLIT)'
                  : 'SPLIT'
                : isAr
                ? 'غدر وسرقة (STEAL)'
                : 'STEAL'}
            </div>
            <div className="mt-3 text-xl font-black text-slate-900">
              {res.bossCashDelta >= 0 ? '+' : ''}
              {formatMoney(res.bossCashDelta)}
            </div>
          </motion.div>

          {/* Partner Orb Reveal Card */}
          <motion.div
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="bg-white rounded-3xl p-5 border-4 border-slate-900 shadow-[0_6px_0_#0f172a] flex flex-col items-center text-center"
          >
            <span className="text-xs font-black uppercase px-3 py-0.5 rounded-full bg-slate-900 text-emerald-300 mb-2">
              {isAr ? 'كرة الشريك المختار' : 'Partner Orb'} • {res.partnerName}
            </span>
            {res.partnerChoice === 'split' ? (
              <GoldenOrbSplitSvg className="w-24 h-24 my-2" />
            ) : (
              <GoldenOrbStealSvg className="w-24 h-24 my-2" />
            )}
            <div
              className={`text-lg font-black px-4 py-1 rounded-xl border-2 border-slate-900 ${
                res.partnerChoice === 'split'
                  ? 'bg-emerald-300 text-slate-950'
                  : 'bg-rose-500 text-white'
              }`}
            >
              {res.partnerChoice === 'split'
                ? isAr
                  ? 'شراكة (SPLIT)'
                  : 'SPLIT'
                : isAr
                ? 'غدر وسرقة (STEAL)'
                : 'STEAL'}
            </div>
            <div className="mt-3 text-xl font-black text-slate-900">
              {res.partnerCashDelta >= 0 ? '+' : ''}
              {formatMoney(res.partnerCashDelta)}
            </div>
          </motion.div>
        </div>

        {/* Briefcase Truth vs Bluff Audit */}
        <div className="bg-amber-50 rounded-3xl p-4 sm:p-5 border-4 border-slate-900 shadow-[0_6px_0_#0f172a] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <VaultBriefcaseSvg
              tier={res.partnerBriefcase}
              className="w-14 h-14 shrink-0"
            />
            <div>
              <div className="text-xs font-black uppercase text-slate-600">
                {isAr
                  ? `كشف حقيبة الشريك (${res.partnerName}) السرية:`
                  : `Partner (${res.partnerName}) Briefcase Truth Check:`}
              </div>
              <div className="text-base font-black text-slate-900">
                {isAr ? 'الحقيبة الحقيقية:' : 'Actual Briefcase:'}{' '}
                {isAr ? partnerTrueSpec.titleAr : partnerTrueSpec.titleEn}
              </div>
              <div className="text-xs font-bold text-slate-600">
                {isAr ? 'بينما ادّعى أنها:' : 'Claimed it was:'}{' '}
                {isAr ? partnerClaimSpec.titleAr : partnerClaimSpec.titleEn}
              </div>
            </div>
          </div>

          <span
            className={`px-4 py-2 rounded-2xl border-2 border-slate-900 font-black text-xs ${
              res.wasPartnerHonestAboutBriefcase
                ? 'bg-emerald-300 text-slate-950'
                : 'bg-rose-400 text-slate-950'
            }`}
          >
            {res.wasPartnerHonestAboutBriefcase
              ? isAr
                ? 'صادق في وصف حقيبته!'
                : 'Honest About Briefcase!'
              : isAr
              ? 'خدع الزعيم بشأن محتوى الحقيبة!'
              : 'Bluffed About Briefcase Contents!'}
          </span>
        </div>

        {/* Spectator Syndicate Side-Bet Payouts */}
        {Object.keys(res.spectatorBetResults).length > 0 && (
          <div className="bg-white rounded-3xl p-5 border-4 border-slate-900 shadow-[0_6px_0_#0f172a]">
            <h4 className="text-sm font-black text-slate-900 mb-3">
              {isAr
                ? 'نتائج رهانات نقابة الجمهور (+$15,000 للتوقع الصحيح):'
                : 'Spectator Syndicate Bet Payouts (+$15,000 for Correct Prediction):'}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {Object.entries(res.spectatorBetResults).map(([sid, bRes]) => {
                const sp = getPlayer(sid);
                const specInfo = SPECTATOR_BET_SPECS[bRes.bet];
                return (
                  <div
                    key={sid}
                    className={`p-3 rounded-2xl border-2 flex items-center justify-between ${
                      bRes.won
                        ? 'bg-emerald-50 border-emerald-600'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div>
                      <div className="font-black text-xs text-slate-900">
                        {sp.name}
                      </div>
                      <div className="text-[11px] font-bold text-slate-600">
                        {isAr ? specInfo.titleAr : specInfo.titleEn}
                      </div>
                    </div>
                    <span
                      className={`text-xs font-black px-2.5 py-1 rounded-lg ${
                        bRes.won
                          ? 'bg-emerald-500 text-slate-950'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {bRes.won ? '+$15,000' : '$0'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {(isHost || isPassAndPlay) && (
          <button
            type="button"
            onClick={handleAdvanceAfterReveal}
            className="w-full py-4 px-6 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-base border-3 border-slate-900 shadow-[0_6px_0_#0f172a] active:translate-y-0.5 transition-all flex items-center justify-center gap-2"
          >
            <ArrowRight size={22} weight="bold" />
            {gameData.round >= gameData.totalRounds
              ? isAr
                ? 'عرض تتويج أباطرة الخزنة النهائي!'
                : 'View Final Master Thieves Crowning!'
              : isAr
              ? `الانتقال إلى الخزنة التالية (${gameData.round + 1} من ${gameData.totalRounds})`
              : `Proceed to Next Vault (${gameData.round + 1} of ${gameData.totalRounds})`}
          </button>
        )}
      </div>
    );
  };

  /* ==========================================================================
   * PHASE 4: GAME OVER & MASTER THIEF PODIUM
   * ======================================================================== */

  const renderPhaseGameOver = () => {
    const sortedPlayers = [...players].sort(
      (a, b) =>
        (gameData.cashByPlayer[b.id] || 0) -
        (gameData.cashByPlayer[a.id] || 0)
    );
    const winner = sortedPlayers[0];

    return (
      <div className="space-y-5">
        <div className="bg-gradient-to-b from-amber-300 via-amber-400 to-amber-500 rounded-3xl p-6 sm:p-8 border-4 border-slate-950 shadow-[0_8px_0_#020617] text-center">
          <div className="w-20 h-20 mx-auto mb-3 rounded-3xl bg-slate-950 text-amber-400 flex items-center justify-center border-3 border-white shadow-lg">
            <Trophy size={44} weight="fill" />
          </div>
          <span className="px-3 py-1 rounded-full bg-slate-950 text-amber-300 text-xs font-black uppercase">
            {isAr ? 'إمبراطور الخزنة الذهبية' : 'Emperor of the Golden Vault'}
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-950 mt-2">
            {winner?.name}
          </h2>
          <div className="text-xl font-black text-slate-900 mt-1">
            {formatMoney(gameData.cashByPlayer[winner?.id] || 0)}
          </div>
        </div>

        {/* Full Standings & Honor/Betrayal Badges */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border-4 border-slate-900 shadow-[0_8px_0_#0f172a] space-y-3">
          <h3 className="text-lg font-black text-slate-900 mb-2">
            {isAr
              ? 'الترتيب النهائي وسجل الشرف والغدر'
              : 'Final Heist Standings & Honor Record'}
          </h3>
          {sortedPlayers.map((p, idx) => {
            const cash = gameData.cashByPlayer[p.id] || 0;
            const splits = gameData.splitsCount[p.id] || 0;
            const steals = gameData.stealsCount[p.id] || 0;
            const specWins = gameData.spectatorWinsCount[p.id] || 0;

            return (
              <div
                key={p.id}
                className={`p-4 rounded-2xl border-3 flex flex-wrap items-center justify-between gap-3 ${
                  idx === 0
                    ? 'bg-amber-50 border-slate-900 shadow-[0_4px_0_#0f172a]'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-xl bg-slate-900 text-amber-300 font-black text-sm flex items-center justify-center">
                    #{idx + 1}
                  </span>
                  <CartoonAvatarSvg
                    index={idx}
                    color={p.avatar_color}
                    className="w-10 h-10 rounded-full border-2 border-slate-900"
                  />
                  <div>
                    <div className="font-black text-base text-slate-900">
                      {p.name}
                    </div>
                    <div className="flex flex-wrap gap-2 text-[11px] font-bold text-slate-600 mt-0.5">
                      <span className="text-emerald-700">
                        {isAr ? `شراكة: ${splits}` : `Splits: ${splits}`}
                      </span>
                      <span>•</span>
                      <span className="text-rose-700">
                        {isAr ? `غدر: ${steals}` : `Steals: ${steals}`}
                      </span>
                      <span>•</span>
                      <span className="text-purple-700">
                        {isAr
                          ? `رهانات رابحة: ${specWins}`
                          : `Bet Wins: ${specWins}`}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-lg font-black text-slate-900">
                  {formatMoney(cash)}
                </div>
              </div>
            );
          })}

          {(isHost || isPassAndPlay) && (
            <button
              type="button"
              onClick={onStartNewRound}
              className="w-full mt-4 py-4 px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-base border-3 border-slate-900 shadow-[0_5px_0_#0f172a] flex items-center justify-center gap-2"
            >
              <ArrowsClockwise size={22} weight="bold" />
              {isAr ? 'بدء عملية سطو جديدة!' : 'Start New Heist Match!'}
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div
      className="w-full max-w-4xl mx-auto pb-12"
      dir={isAr ? 'rtl' : 'ltr'}
    >
      {renderTopVaultHeader()}

      <AnimatePresence mode="wait">
        <motion.div
          key={`${gameData.phase}-${gameData.round}`}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.22 }}
        >
          {gameData.phase === 'briefcase_bluff' && renderPhaseBriefcaseBluff()}
          {gameData.phase === 'showdown' && renderPhaseShowdown()}
          {gameData.phase === 'reveal' && renderPhaseReveal()}
          {gameData.phase === 'game_over' && renderPhaseGameOver()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

const HandshakeIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
    <path d="M12.7 6.3a1 1 0 0 0-1.4 0L7 10.6 4.7 8.3a1 1 0 0 0-1.4 1.4l3 3a1 1 0 0 0 1.4 0L12 8.4l4.3 4.3a1 1 0 0 0 1.4 0l3-3a1 1 0 0 0-1.4-1.4L17 10.6l-4.3-4.3Z" />
  </svg>
);

export default SplitStealGame;
