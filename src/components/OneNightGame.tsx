import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import {
  Eye,
  EyeSlash,
  MoonStars,
  SunHorizon,
  ArrowsLeftRight,
  Gavel,
  Trophy,
  CheckCircle,
  Sparkle,
  Users,
  ShieldCheck,
  MagnifyingGlass,
  ArrowsClockwise,
  Clock,
  ChatCenteredText,
  LockKey,
  Cards,
} from '@phosphor-icons/react';
import { CartoonAvatarSvg } from './CartoonIcons';

/* ============================================================================
 * 1. TYPES & INTERFACES
 * ========================================================================== */

export type OneNightRoleId =
  | 'werewolf'
  | 'seer'
  | 'robber'
  | 'troublemaker'
  | 'tanner'
  | 'insomniac'
  | 'villager';

export type OneNightTeam = 'village' | 'werewolf' | 'tanner';

export interface OneNightNightAction {
  type:
    | 'werewolf_center'
    | 'werewolf_pack'
    | 'seer_player'
    | 'seer_center'
    | 'robber_steal'
    | 'troublemaker_swap'
    | 'ready';
  targetPlayerId?: string;
  targetPlayerId2?: string;
  centerIndices?: number[];
}

export interface OneNightSwapStep {
  actorId: string;
  actorName: string;
  role: 'robber' | 'troublemaker';
  fromId: string;
  fromName: string;
  toId: string;
  toName: string;
  roleBeforeFrom: OneNightRoleId;
  roleBeforeTo: OneNightRoleId;
}

export interface OneNightReport {
  title_ar: string;
  title_en: string;
  detail_ar: string;
  detail_en: string;
  seenRoles?: { label_ar: string; label_en: string; role: OneNightRoleId }[];
}

export interface OneNightClaim {
  claimedRole: OneNightRoleId;
  note: string;
}

export interface OneNightGameState {
  phase: 'night' | 'day_debate' | 'reveal';
  deckRoles: OneNightRoleId[];
  initialRoles: Record<string, OneNightRoleId>;
  currentRoles: Record<string, OneNightRoleId>;
  centerRoles: [OneNightRoleId, OneNightRoleId, OneNightRoleId];
  initialCenterRoles: [OneNightRoleId, OneNightRoleId, OneNightRoleId];
  nightActions: Record<string, OneNightNightAction>;
  nightReports: Record<string, OneNightReport>;
  swapHistory: OneNightSwapStep[];
  claims: Record<string, OneNightClaim>;
  votes: Record<string, string>; // voterId -> targetPlayerId or 'no_wolf'
  executedPlayerIds: string[];
  winningTeams: OneNightTeam[];
  winnerPlayerIds: string[];
  startedAt: number;
  dayDurationSec: number;
}

export interface OneNightPlayerInfo {
  id: string;
  name: string;
  avatar_color: string;
  score: number;
}

export interface OneNightGameProps {
  gameData: OneNightGameState;
  players: OneNightPlayerInfo[];
  myPlayerId: string;
  isHost: boolean;
  isPassAndPlay: boolean;
  lang: 'ar' | 'en';
  onUpdateGameData: (
    nextData: OneNightGameState,
    scoreAwards?: Record<string, number>
  ) => void;
  onStartNewRound: () => void;
}

/* ============================================================================
 * 2. ROLE METADATA & DECK BUILDER
 * ========================================================================== */

interface RoleMeta {
  id: OneNightRoleId;
  team: OneNightTeam;
  nightOrder: number | null; // 1..5 or null
  name_ar: string;
  name_en: string;
  team_ar: string;
  team_en: string;
  badgeBg: string;
  cardBg: string;
  accentHex: string;
  power_ar: string;
  power_en: string;
}

export const ONE_NIGHT_ROLES_META: Record<OneNightRoleId, RoleMeta> = {
  werewolf: {
    id: 'werewolf',
    team: 'werewolf',
    nightOrder: 1,
    name_ar: 'المستذئب',
    name_en: 'Werewolf',
    team_ar: 'فريق الذئاب',
    team_en: 'Werewolf Team',
    badgeBg: 'bg-[#ff595e] text-white',
    cardBg: 'from-[#2b1328] via-[#3d1734] to-[#161426]',
    accentHex: '#ff595e',
    power_ar:
      'يتعرّف على الذئاب الآخرين في الليل. إذا كنت الذئب الوحيد، يمكنك الكشف عن بطاقة واحدة من المنتصف!',
    power_en:
      'Sees other Werewolves at night. If you are a Lone Wolf, you may peek at 1 Center Card!',
  },
  seer: {
    id: 'seer',
    team: 'village',
    nightOrder: 2,
    name_ar: 'العرّافة',
    name_en: 'The Seer',
    team_ar: 'فريق القرية',
    team_en: 'Village Team',
    badgeBg: 'bg-[#9b5de5] text-white',
    cardBg: 'from-[#221642] via-[#341f60] to-[#161426]',
    accentHex: '#9b5de5',
    power_ar:
      'يمكنها كشف بطاقة لاعب واحد آخر، أو كشف بطاقتين من بطاقات المنتصف الثلاث!',
    power_en:
      'May peek at 1 other player’s role card OR 2 of the 3 Center Cards!',
  },
  robber: {
    id: 'robber',
    team: 'village',
    nightOrder: 3,
    name_ar: 'اللص',
    name_en: 'The Robber',
    team_ar: 'فريق القرية',
    team_en: 'Village Team',
    badgeBg: 'bg-[#ff924c] text-[#161426]',
    cardBg: 'from-[#362014] via-[#4a2b18] to-[#161426]',
    accentHex: '#ff924c',
    power_ar:
      'يختار لاعباً آخر، يسرق بطاقته ويبدلها ببطاقته، ثم ينظر إلى دوره الجديد ويصبح من فريق ذلك الدور!',
    power_en:
      'Swaps his card with another player’s card and views his new role (joining that role’s team!).',
  },
  troublemaker: {
    id: 'troublemaker',
    team: 'village',
    nightOrder: 4,
    name_ar: 'المشاغب',
    name_en: 'Troublemaker',
    team_ar: 'فريق القرية',
    team_en: 'Village Team',
    badgeBg: 'bg-[#00bbf9] text-[#161426]',
    cardBg: 'from-[#102b3f] via-[#163e59] to-[#161426]',
    accentHex: '#00bbf9',
    power_ar:
      'يختار لاعبين آخرين ويبدّل بطاقتيهما بالسر دون أن ينظر إليهما لإشعال الفوضى في النهار!',
    power_en:
      'Chooses 2 other players and swaps their role cards blindly without looking at them!',
  },
  insomniac: {
    id: 'insomniac',
    team: 'village',
    nightOrder: 5,
    name_ar: 'السهران',
    name_en: 'Insomniac',
    team_ar: 'فريق القرية',
    team_en: 'Village Team',
    badgeBg: 'bg-[#ffca3a] text-[#161426]',
    cardBg: 'from-[#332a10] via-[#4a3c14] to-[#161426]',
    accentHex: '#ffca3a',
    power_ar:
      'يستيقظ في نهاية الليل ويتفقد بطاقته الخاصة ليرى ما إذا كان اللص أو المشاغب قد غيّر دوره!',
    power_en:
      'Wakes up last at night and checks their own card to see if it was swapped while sleeping!',
  },
  tanner: {
    id: 'tanner',
    team: 'tanner',
    nightOrder: null,
    name_ar: 'اليائس المخادع',
    name_en: 'The Tanner',
    team_ar: 'فريق مستقل',
    team_en: 'Solo Team',
    badgeBg: 'bg-[#f15bb5] text-white',
    cardBg: 'from-[#38142c] via-[#4f1b3d] to-[#161426]',
    accentHex: '#f15bb5',
    power_ar:
      'يكره وظيفته! هدفه الوحيد هو خداع القرية وجعلهم يصوتون لإعدامه. إذا أُعدم يفوز!',
    power_en:
      'Wants to trick the village into executing him! Only wins if he is voted out and executed!',
  },
  villager: {
    id: 'villager',
    team: 'village',
    nightOrder: null,
    name_ar: 'القروي البريء',
    name_en: 'Villager',
    team_ar: 'فريق القرية',
    team_en: 'Village Team',
    badgeBg: 'bg-[#8ac926] text-[#161426]',
    cardBg: 'from-[#1b3314] via-[#26471c] to-[#161426]',
    accentHex: '#8ac926',
    power_ar:
      'ينام طوال الليل ولا يملك قدرة ليلية، لكنه يعتمد على ذكائه وكشف تناقضات الذئاب في النهار!',
    power_en:
      'Has no night action. Uses sharp deduction during the daytime debate to catch the Werewolves!',
  },
};

function shuffleArray<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function buildOneNightDeck(playerCount: number): OneNightRoleId[] {
  const totalCards = Math.max(4, playerCount + 3);
  const corePool: OneNightRoleId[] = [
    'werewolf',
    'werewolf',
    'seer',
    'robber',
    'troublemaker',
    'tanner',
    'insomniac',
    'villager',
    'villager',
    'villager',
    'werewolf',
    'villager',
  ];
  const selected = corePool.slice(0, totalCards);
  while (selected.length < totalCards) {
    selected.push('villager');
  }
  return selected;
}

export function buildInitialOneNightState(
  players: { id: string; name: string; avatar_color?: string; score?: number }[]
): OneNightGameState {
  const safePlayers =
    players.length > 0
      ? players
      : [
          { id: 'p1', name: 'Player 1' },
          { id: 'p2', name: 'Player 2' },
          { id: 'p3', name: 'Player 3' },
        ];

  const deckRoles = buildOneNightDeck(safePlayers.length);
  const shuffled = shuffleArray(deckRoles);

  const initialRoles: Record<string, OneNightRoleId> = {};
  const currentRoles: Record<string, OneNightRoleId> = {};

  safePlayers.forEach((p, idx) => {
    const role = shuffled[idx] || 'villager';
    initialRoles[p.id] = role;
    currentRoles[p.id] = role;
  });

  const c0 = shuffled[safePlayers.length] || 'villager';
  const c1 = shuffled[safePlayers.length + 1] || 'seer';
  const c2 = shuffled[safePlayers.length + 2] || 'werewolf';
  const centerRoles: [OneNightRoleId, OneNightRoleId, OneNightRoleId] = [c0, c1, c2];

  return {
    phase: 'night',
    deckRoles,
    initialRoles,
    currentRoles,
    centerRoles,
    initialCenterRoles: [...centerRoles] as [
      OneNightRoleId,
      OneNightRoleId,
      OneNightRoleId
    ],
    nightActions: {},
    nightReports: {},
    swapHistory: [],
    claims: {},
    votes: {},
    executedPlayerIds: [],
    winningTeams: [],
    winnerPlayerIds: [],
    startedAt: Date.now(),
    dayDurationSec: 210,
  };
}

/* ============================================================================
 * 3. CUSTOM CARTOON TAROT SVG EMBLEMS (ZERO EMOJIS!)
 * ========================================================================== */

export const OneNightRoleSvg: React.FC<{
  role: OneNightRoleId | 'mystery';
  className?: string;
}> = ({ role, className = 'w-20 h-20' }) => {
  switch (role) {
    case 'werewolf':
      return (
        <svg viewBox="0 0 120 120" className={`${className} select-none`}>
          {/* Full Blood Moon Backdrop */}
          <circle
            cx="60"
            cy="60"
            r="50"
            fill="#ff595e"
            stroke="#161426"
            strokeWidth="5"
          />
          <circle cx="42" cy="36" r="8" fill="#ff924c" opacity="0.5" />
          {/* Pointed Wolf Ears */}
          <polygon
            points="24,52 30,14 52,38"
            fill="#2b2640"
            stroke="#161426"
            strokeWidth="5"
            strokeLinejoin="round"
          />
          <polygon
            points="96,52 90,14 68,38"
            fill="#2b2640"
            stroke="#161426"
            strokeWidth="5"
            strokeLinejoin="round"
          />
          <polygon points="31,44 34,24 46,38" fill="#ff595e" />
          <polygon points="89,44 86,24 74,38" fill="#ff595e" />
          {/* Wolf Head Fur */}
          <polygon
            points="20,62 32,36 60,32 88,36 100,62 88,92 60,104 32,92"
            fill="#3d355c"
            stroke="#161426"
            strokeWidth="5"
            strokeLinejoin="round"
          />
          {/* Glowing Yellow Predator Eyes */}
          <polygon
            points="35,54 52,60 38,65"
            fill="#ffca3a"
            stroke="#161426"
            strokeWidth="3.5"
            strokeLinejoin="round"
          />
          <polygon
            points="85,54 68,60 82,65"
            fill="#ffca3a"
            stroke="#161426"
            strokeWidth="3.5"
            strokeLinejoin="round"
          />
          {/* Snout & Fangs */}
          <polygon
            points="44,72 60,64 76,72 70,94 50,94"
            fill="#231f38"
            stroke="#161426"
            strokeWidth="4"
            strokeLinejoin="round"
          />
          <polygon points="53,72 67,72 60,80" fill="#161426" />
          <polygon
            points="48,88 53,99 57,88"
            fill="#fff9ec"
            stroke="#161426"
            strokeWidth="3"
          />
          <polygon
            points="63,88 67,99 72,88"
            fill="#fff9ec"
            stroke="#161426"
            strokeWidth="3"
          />
        </svg>
      );

    case 'seer':
      return (
        <svg viewBox="0 0 120 120" className={`${className} select-none`}>
          {/* Mystic Halo */}
          <circle
            cx="60"
            cy="60"
            r="50"
            fill="#9b5de5"
            stroke="#161426"
            strokeWidth="5"
          />
          {/* Star Sparkles */}
          <polygon
            points="26,24 29,31 36,34 29,37 26,44 23,37 16,34 23,31"
            fill="#ffca3a"
            stroke="#161426"
            strokeWidth="2.5"
          />
          <polygon
            points="94,26 96,31 101,33 96,35 94,40 92,35 87,33 92,31"
            fill="#ffca3a"
            stroke="#161426"
            strokeWidth="2.5"
          />
          {/* Crystal Ball Pedestal */}
          <path
            d="M 34 96 L 86 96 L 78 82 L 42 82 Z"
            fill="#ffca3a"
            stroke="#161426"
            strokeWidth="4.5"
            strokeLinejoin="round"
          />
          {/* Crystal Orb */}
          <circle
            cx="60"
            cy="56"
            r="30"
            fill="#00bbf9"
            stroke="#161426"
            strokeWidth="5"
          />
          <circle cx="60" cy="56" r="23" fill="#3a0ca3" opacity="0.45" />
          {/* All-Seeing Eye Inside Crystal */}
          <path
            d="M 38 56 Q 60 36 82 56 Q 60 76 38 56 Z"
            fill="#fff9ec"
            stroke="#161426"
            strokeWidth="4"
            strokeLinejoin="round"
          />
          <circle
            cx="60"
            cy="56"
            r="9"
            fill="#f15bb5"
            stroke="#161426"
            strokeWidth="3.5"
          />
          <circle cx="60" cy="56" r="4" fill="#161426" />
          <circle cx="63" cy="53" r="2.2" fill="#ffffff" />
        </svg>
      );

    case 'robber':
      return (
        <svg viewBox="0 0 120 120" className={`${className} select-none`}>
          <circle
            cx="60"
            cy="60"
            r="50"
            fill="#ff924c"
            stroke="#161426"
            strokeWidth="5"
          />
          {/* Bandit Hat */}
          <ellipse
            cx="60"
            cy="38"
            rx="38"
            ry="10"
            fill="#2b2640"
            stroke="#161426"
            strokeWidth="4.5"
          />
          <path
            d="M 34 38 Q 42 14 60 20 Q 78 14 86 38 Z"
            fill="#3d355c"
            stroke="#161426"
            strokeWidth="4.5"
            strokeLinejoin="round"
          />
          {/* Domino Mask */}
          <path
            d="M 22 58 Q 40 44 60 54 Q 80 44 98 58 Q 84 76 60 66 Q 36 76 22 58 Z"
            fill="#161426"
            stroke="#fff9ec"
            strokeWidth="3.5"
            strokeLinejoin="round"
          />
          <ellipse cx="43" cy="59" rx="8" ry="5" fill="#ffca3a" />
          <ellipse cx="77" cy="59" rx="8" ry="5" fill="#ffca3a" />
          {/* Stolen Card & Loot Bag */}
          <rect
            x="44"
            y="74"
            width="32"
            height="24"
            rx="5"
            transform="rotate(-8 60 86)"
            fill="#fff9ec"
            stroke="#161426"
            strokeWidth="4"
          />
          <path
            d="M 52 86 L 68 86 M 62 80 L 68 86 L 62 92"
            stroke="#ff595e"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );

    case 'troublemaker':
      return (
        <svg viewBox="0 0 120 120" className={`${className} select-none`}>
          <circle
            cx="60"
            cy="60"
            r="50"
            fill="#00bbf9"
            stroke="#161426"
            strokeWidth="5"
          />
          {/* Jester Two-Pronged Hat */}
          <path
            d="M 28 56 C 18 28 38 18 54 40 C 66 18 102 28 92 56 Z"
            fill="#ff595e"
            stroke="#161426"
            strokeWidth="4.5"
            strokeLinejoin="round"
          />
          <circle
            cx="24"
            cy="32"
            r="7"
            fill="#ffca3a"
            stroke="#161426"
            strokeWidth="3.5"
          />
          <circle
            cx="96"
            cy="32"
            r="7"
            fill="#ffca3a"
            stroke="#161426"
            strokeWidth="3.5"
          />
          {/* Swirling Swap Arrows */}
          <rect
            x="24"
            y="58"
            width="28"
            height="36"
            rx="5"
            transform="rotate(-12 38 76)"
            fill="#ffca3a"
            stroke="#161426"
            strokeWidth="4"
          />
          <rect
            x="68"
            y="58"
            width="28"
            height="36"
            rx="5"
            transform="rotate(12 82 76)"
            fill="#9b5de5"
            stroke="#161426"
            strokeWidth="4"
          />
          <path
            d="M 44 74 L 76 74 M 68 66 L 76 74 L 68 82 M 52 66 L 44 74 L 52 82"
            stroke="#fff9ec"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );

    case 'insomniac':
      return (
        <svg viewBox="0 0 120 120" className={`${className} select-none`}>
          <circle
            cx="60"
            cy="60"
            r="50"
            fill="#ffca3a"
            stroke="#161426"
            strokeWidth="5"
          />
          {/* Crescent Moon & Night Cap */}
          <path
            d="M 32 38 Q 60 14 88 38"
            fill="#9b5de5"
            stroke="#161426"
            strokeWidth="4.5"
          />
          {/* Wide-Awake Bloodshot Cartoon Owl Eyes */}
          <circle
            cx="42"
            cy="58"
            r="16"
            fill="#fff9ec"
            stroke="#161426"
            strokeWidth="4.5"
          />
          <circle
            cx="78"
            cy="58"
            r="16"
            fill="#fff9ec"
            stroke="#161426"
            strokeWidth="4.5"
          />
          <circle cx="42" cy="58" r="6" fill="#161426" />
          <circle cx="78" cy="58" r="6" fill="#161426" />
          <circle cx="40" cy="56" r="2" fill="#ffffff" />
          <circle cx="76" cy="56" r="2" fill="#ffffff" />
          {/* Dark Under-Eye Sleepless Bags */}
          <path
            d="M 28 76 Q 42 84 54 76"
            fill="none"
            stroke="#ff595e"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <path
            d="M 66 76 Q 78 84 92 76"
            fill="none"
            stroke="#ff595e"
            strokeWidth="4"
            strokeLinecap="round"
          />
          {/* Candle Flame Below */}
          <rect
            x="54"
            y="88"
            width="12"
            height="16"
            rx="3"
            fill="#fff9ec"
            stroke="#161426"
            strokeWidth="3.5"
          />
          <path
            d="M 60 74 C 66 80 66 86 60 88 C 54 86 54 80 60 74 Z"
            fill="#ff595e"
            stroke="#161426"
            strokeWidth="3"
          />
        </svg>
      );

    case 'tanner':
      return (
        <svg viewBox="0 0 120 120" className={`${className} select-none`}>
          <circle
            cx="60"
            cy="60"
            r="50"
            fill="#f15bb5"
            stroke="#161426"
            strokeWidth="5"
          />
          {/* Bullseye Target On Chest ("Vote Me!") */}
          <circle
            cx="60"
            cy="64"
            r="32"
            fill="#fff9ec"
            stroke="#161426"
            strokeWidth="4.5"
          />
          <circle
            cx="60"
            cy="64"
            r="21"
            fill="#ff595e"
            stroke="#161426"
            strokeWidth="4"
          />
          <circle
            cx="60"
            cy="64"
            r="10"
            fill="#ffca3a"
            stroke="#161426"
            strokeWidth="3.5"
          />
          {/* Cheeky Finger Pointing Inward */}
          <path
            d="M 60 16 L 68 32 L 52 32 Z"
            fill="#ffca3a"
            stroke="#161426"
            strokeWidth="4"
            strokeLinejoin="round"
          />
        </svg>
      );

    case 'villager':
      return (
        <svg viewBox="0 0 120 120" className={`${className} select-none`}>
          <circle
            cx="60"
            cy="60"
            r="50"
            fill="#8ac926"
            stroke="#161426"
            strokeWidth="5"
          />
          {/* Straw Hat */}
          <ellipse
            cx="60"
            cy="38"
            rx="38"
            ry="10"
            fill="#ffca3a"
            stroke="#161426"
            strokeWidth="4.5"
          />
          <path
            d="M 38 38 C 38 20 82 20 82 38 Z"
            fill="#ffca3a"
            stroke="#161426"
            strokeWidth="4.5"
          />
          {/* Pitchfork & Lantern Shield */}
          <circle
            cx="60"
            cy="66"
            r="22"
            fill="#fff9ec"
            stroke="#161426"
            strokeWidth="4.5"
          />
          <circle cx="52" cy="63" r="3.5" fill="#161426" />
          <circle cx="68" cy="63" r="3.5" fill="#161426" />
          <path
            d="M 52 74 Q 60 80 68 74"
            fill="none"
            stroke="#161426"
            strokeWidth="4"
            strokeLinecap="round"
          />
          {/* Pitchfork */}
          <line
            x1="28"
            y1="48"
            x2="28"
            y2="96"
            stroke="#161426"
            strokeWidth="5"
            strokeLinecap="round"
          />
          <path
            d="M 20 48 L 20 60 Q 28 66 36 60 L 36 48"
            fill="none"
            stroke="#161426"
            strokeWidth="4.5"
            strokeLinecap="round"
          />
        </svg>
      );

    case 'mystery':
    default:
      return (
        <svg viewBox="0 0 120 120" className={`${className} select-none`}>
          <circle
            cx="60"
            cy="60"
            r="50"
            fill="#2b2640"
            stroke="#161426"
            strokeWidth="5"
          />
          <circle
            cx="60"
            cy="60"
            r="38"
            fill="none"
            stroke="#ffca3a"
            strokeWidth="3"
            strokeDasharray="6 6"
          />
          <path
            d="M 48 46 C 48 34 72 34 72 48 C 72 58 60 60 60 70"
            fill="none"
            stroke="#ffca3a"
            strokeWidth="7"
            strokeLinecap="round"
          />
          <circle cx="60" cy="84" r="4.5" fill="#ffca3a" />
        </svg>
      );
  }
};

/* ============================================================================
 * 4. CANONICAL NIGHT RESOLUTION ENGINE (1. Wolf -> 2. Seer -> 3. Robber -> 4. Troublemaker -> 5. Insomniac)
 * ========================================================================== */

function resolveNightPhase(
  state: OneNightGameState,
  players: OneNightPlayerInfo[]
): OneNightGameState {
  const initialRoles = { ...state.initialRoles };
  const currentRoles = { ...state.initialRoles };
  const centerRoles: [OneNightRoleId, OneNightRoleId, OneNightRoleId] = [
    ...state.initialCenterRoles,
  ] as [OneNightRoleId, OneNightRoleId, OneNightRoleId];

  const swapHistory: OneNightSwapStep[] = [];
  const nightReports: Record<string, OneNightReport> = {};

  const getPlayerName = (id?: string) =>
    players.find((p) => p.id === id)?.name || 'لاعب';

  // Identify initial Werewolves
  const initialWolves = players.filter(
    (p) => initialRoles[p.id] === 'werewolf'
  );

  // 1. WEREWOLF RESOLUTION (Order 1)
  for (const wolf of initialWolves) {
    const otherWolves = initialWolves.filter((w) => w.id !== wolf.id);
    const action = state.nightActions[wolf.id];

    if (otherWolves.length > 0) {
      const namesAr = otherWolves.map((w) => w.name).join(' ، ');
      const namesEn = otherWolves.map((w) => w.name).join(', ');
      nightReports[wolf.id] = {
        title_ar: 'يقظة قطيع الذئاب',
        title_en: 'Werewolf Pack Wakeup',
        detail_ar: `استيقظت في الليل وتعرّفت على شريكك في القطيع: ${namesAr}!`,
        detail_en: `You woke up and saw your fellow Werewolf packmate(s): ${namesEn}!`,
        seenRoles: otherWolves.map((w) => ({
          label_ar: w.name,
          label_en: w.name,
          role: 'werewolf',
        })),
      };
    } else {
      // Lone wolf peeking at 1 center card
      const cIdx = action?.centerIndices?.[0] ?? 0;
      const safeIdx = Math.max(0, Math.min(2, cIdx));
      const seenRole = centerRoles[safeIdx];
      const meta = ONE_NIGHT_ROLES_META[seenRole];
      nightReports[wolf.id] = {
        title_ar: 'الذئب الوحيد — كشف المنتصف',
        title_en: 'Lone Wolf — Center Peek',
        detail_ar: `أنت الذئب الوحيد بين اللاعبين! كشفت بطاقة المنتصف رقم (${
          safeIdx + 1
        }) فكانت: ${meta.name_ar}.`,
        detail_en: `You are the Lone Wolf! You peeked at Center Card #${
          safeIdx + 1
        }: ${meta.name_en}.`,
        seenRoles: [
          {
            label_ar: `منتصف #${safeIdx + 1}`,
            label_en: `Center #${safeIdx + 1}`,
            role: seenRole,
          },
        ],
      };
    }
  }

  // 2. SEER RESOLUTION (Order 2 — sees roles BEFORE Robber/Troublemaker swaps!)
  for (const p of players) {
    if (initialRoles[p.id] !== 'seer') continue;
    const action = state.nightActions[p.id];
    if (action?.type === 'seer_player' && action.targetPlayerId) {
      const targetName = getPlayerName(action.targetPlayerId);
      const seenRole = currentRoles[action.targetPlayerId] || 'villager';
      const meta = ONE_NIGHT_ROLES_META[seenRole];
      nightReports[p.id] = {
        title_ar: 'رؤية العرّافة',
        title_en: 'Seer’s Vision',
        detail_ar: `كشفت بطاقة اللاعب (${targetName}) في بداية الليل فكانت: ${meta.name_ar}!`,
        detail_en: `You peeked at ${targetName}'s card before any swaps: ${meta.name_en}!`,
        seenRoles: [
          {
            label_ar: targetName,
            label_en: targetName,
            role: seenRole,
          },
        ],
      };
    } else {
      const indices =
        action?.centerIndices && action.centerIndices.length >= 2
          ? action.centerIndices.slice(0, 2)
          : [0, 1];
      const r1 = centerRoles[indices[0]] || 'villager';
      const r2 = centerRoles[indices[1]] || 'villager';
      const m1 = ONE_NIGHT_ROLES_META[r1];
      const m2 = ONE_NIGHT_ROLES_META[r2];
      nightReports[p.id] = {
        title_ar: 'رؤية العرّافة لبطاقات المنتصف',
        title_en: 'Seer’s Center Vision',
        detail_ar: `كشفت بطاقتي المنتصف (#${indices[0] + 1} و #${
          indices[1] + 1
        }): ${m1.name_ar} + ${m2.name_ar}!`,
        detail_en: `You peeked at Center #${indices[0] + 1} (${
          m1.name_en
        }) & Center #${indices[1] + 1} (${m2.name_en})!`,
        seenRoles: [
          {
            label_ar: `منتصف #${indices[0] + 1}`,
            label_en: `Center #${indices[0] + 1}`,
            role: r1,
          },
          {
            label_ar: `منتصف #${indices[1] + 1}`,
            label_en: `Center #${indices[1] + 1}`,
            role: r2,
          },
        ],
      };
    }
  }

  // 3. ROBBER RESOLUTION (Order 3 — swaps own card with target player and views new card!)
  for (const p of players) {
    if (initialRoles[p.id] !== 'robber') continue;
    const action = state.nightActions[p.id];
    const targetId =
      action?.targetPlayerId && action.targetPlayerId !== p.id
        ? action.targetPlayerId
        : players.find((other) => other.id !== p.id)?.id;

    if (targetId) {
      const targetName = getPlayerName(targetId);
      const roleBeforeRobber = currentRoles[p.id];
      const stolenRole = currentRoles[targetId];
      // Perform swap
      currentRoles[p.id] = stolenRole;
      currentRoles[targetId] = roleBeforeRobber;

      swapHistory.push({
        actorId: p.id,
        actorName: p.name,
        role: 'robber',
        fromId: p.id,
        fromName: p.name,
        toId: targetId,
        toName: targetName,
        roleBeforeFrom: roleBeforeRobber,
        roleBeforeTo: stolenRole,
      });

      const stolenMeta = ONE_NIGHT_ROLES_META[stolenRole];
      nightReports[p.id] = {
        title_ar: 'غارة اللص الليلية',
        title_en: 'Robber’s Heist',
        detail_ar: `سرقت بطاقة (${targetName}) وأعطيته بطاقة اللص! دورك الجديد الآن هو: ${stolenMeta.name_ar} (${stolenMeta.team_ar}).`,
        detail_en: `You stole ${targetName}'s card and gave them your Robber card! Your new role is: ${stolenMeta.name_en} (${stolenMeta.team_en}).`,
        seenRoles: [
          {
            label_ar: `دورك الجديد (من ${targetName})`,
            label_en: `Your New Role (from ${targetName})`,
            role: stolenRole,
          },
        ],
      };
    }
  }

  // 4. TROUBLEMAKER RESOLUTION (Order 4 — swaps 2 other players blindly!)
  for (const p of players) {
    if (initialRoles[p.id] !== 'troublemaker') continue;
    const action = state.nightActions[p.id];
    const otherPlayers = players.filter((other) => other.id !== p.id);
    const t1 =
      action?.targetPlayerId && action.targetPlayerId !== p.id
        ? action.targetPlayerId
        : otherPlayers[0]?.id;
    const t2 =
      action?.targetPlayerId2 &&
      action.targetPlayerId2 !== p.id &&
      action.targetPlayerId2 !== t1
        ? action.targetPlayerId2
        : otherPlayers.find((o) => o.id !== t1)?.id;

    if (t1 && t2 && t1 !== t2) {
      const name1 = getPlayerName(t1);
      const name2 = getPlayerName(t2);
      const r1Before = currentRoles[t1];
      const r2Before = currentRoles[t2];

      currentRoles[t1] = r2Before;
      currentRoles[t2] = r1Before;

      swapHistory.push({
        actorId: p.id,
        actorName: p.name,
        role: 'troublemaker',
        fromId: t1,
        fromName: name1,
        toId: t2,
        toName: name2,
        roleBeforeFrom: r1Before,
        roleBeforeTo: r2Before,
      });

      nightReports[p.id] = {
        title_ar: 'خدعة المشاغب السرية',
        title_en: 'Troublemaker’s Swap',
        detail_ar: `بدّلت بطاقتي (${name1}) و (${name2}) بالسر دون أن تنظر إليهما!`,
        detail_en: `You blindly swapped ${name1}'s card and ${name2}'s card in the dark!`,
      };
    }
  }

  // 5. INSOMNIAC RESOLUTION (Order 5 — checks their own final role at end of night!)
  for (const p of players) {
    if (initialRoles[p.id] !== 'insomniac') continue;
    const finalRole = currentRoles[p.id];
    const finalMeta = ONE_NIGHT_ROLES_META[finalRole];
    const changed = finalRole !== 'insomniac';

    nightReports[p.id] = {
      title_ar: 'تفقد السهران آخر الليل',
      title_en: 'Insomniac’s Late Check',
      detail_ar: changed
        ? `مفاجأة! تفقدت بطاقتك في نهاية الليل فوجدت أن أحدهم بدّلها إلى: ${finalMeta.name_ar}!`
        : `تفقدت بطاقتك في نهاية الليل فوجدت أنها لم تتغير وما زلت: السهران.`,
      detail_en: changed
        ? `Surprise! You checked your card at the end of the night and someone swapped you into: ${finalMeta.name_en}!`
        : `You checked your card at the end of the night — it was untouched. You are still the Insomniac.`,
      seenRoles: [
        {
          label_ar: 'بطاقتك في نهاية الليل',
          label_en: 'Your End-of-Night Card',
          role: finalRole,
        },
      ],
    };
  }

  // 6. VILLAGER & TANNER REPORTS
  for (const p of players) {
    if (nightReports[p.id]) continue;
    const initRole = initialRoles[p.id];
    if (initRole === 'tanner') {
      nightReports[p.id] = {
        title_ar: 'خطة اليائس المخادع',
        title_en: 'Tanner’s Gambit',
        detail_ar:
          'لم تقم بأي حركة في الليل. تظاهر بأنك مريب في النقاش حتى يصوت اللاعبون لإعدامك وتفوز!',
        detail_en:
          'You slept through the night. Act suspicious during the debate so the village executes you and you win!',
      };
    } else {
      nightReports[p.id] = {
        title_ar: 'نوم القروي العميق',
        title_en: 'Peaceful Slumber',
        detail_ar:
          'نمت طوال الليل. استمع جيداً لقصص العرّافة واللص والمشاغب واكشف من يكذب!',
        detail_en:
          'You slept peacefully. Listen carefully to the Seer, Robber, and Troublemaker claims to catch the Werewolves!',
      };
    }
  }

  return {
    ...state,
    phase: 'day_debate',
    currentRoles,
    nightReports,
    swapHistory,
    startedAt: Date.now(),
  };
}

/* ============================================================================
 * 5. DAYTIME VOTE & WIN CONDITION ENGINE (Evaluated on FINAL currentRoles!)
 * ========================================================================== */

function resolveVotesAndWinners(
  state: OneNightGameState,
  players: OneNightPlayerInfo[],
  votes: Record<string, string>
): {
  nextState: OneNightGameState;
  scoreAwards: Record<string, number>;
} {
  const tally: Record<string, number> = {};
  Object.values(votes).forEach((targetId) => {
    if (!targetId || targetId === 'no_wolf') return;
    tally[targetId] = (tally[targetId] || 0) + 1;
  });

  let maxVotes = 0;
  Object.values(tally).forEach((cnt) => {
    if (cnt > maxVotes) maxVotes = cnt;
  });

  // In One Night Ultimate Werewolf, a player needs at least 2 votes to die if there are >=3 players (or 1 vote in 2p test)
  const minVotesToExecute = players.length >= 3 ? 2 : 1;
  const executedPlayerIds: string[] =
    maxVotes >= minVotesToExecute
      ? Object.keys(tally).filter((pid) => tally[pid] === maxVotes)
      : [];

  const finalRoles = state.currentRoles;
  const activeWerewolfIds = players
    .filter((p) => finalRoles[p.id] === 'werewolf')
    .map((p) => p.id);

  const executedWerewolves = executedPlayerIds.filter(
    (pid) => finalRoles[pid] === 'werewolf'
  );
  const executedTanners = executedPlayerIds.filter(
    (pid) => finalRoles[pid] === 'tanner'
  );

  const winningTeams: OneNightTeam[] = [];
  const winnerPlayerIds: string[] = [];

  // 1. Did Tanner get executed? Tanner wins!
  if (executedTanners.length > 0) {
    winningTeams.push('tanner');
    executedTanners.forEach((id) => {
      if (!winnerPlayerIds.includes(id)) winnerPlayerIds.push(id);
    });
  }

  // 2. Did Village win?
  // Village wins if:
  // (a) At least 1 Werewolf is executed, OR
  // (b) No player is a Werewolf (all Werewolves in center) AND nobody was executed!
  const villageWon =
    executedWerewolves.length > 0 ||
    (activeWerewolfIds.length === 0 && executedPlayerIds.length === 0);

  if (villageWon) {
    winningTeams.push('village');
    players.forEach((p) => {
      const r = finalRoles[p.id];
      if (ONE_NIGHT_ROLES_META[r]?.team === 'village') {
        if (!winnerPlayerIds.includes(p.id)) winnerPlayerIds.push(p.id);
      }
    });
  }

  // 3. Did Werewolves win?
  // Werewolves win if there is at least 1 Werewolf among players, NO Werewolf was executed, and NO Tanner was executed!
  if (
    activeWerewolfIds.length > 0 &&
    executedWerewolves.length === 0 &&
    executedTanners.length === 0
  ) {
    winningTeams.push('werewolf');
    activeWerewolfIds.forEach((id) => {
      if (!winnerPlayerIds.includes(id)) winnerPlayerIds.push(id);
    });
  }

  // Score awards
  const scoreAwards: Record<string, number> = {};
  winnerPlayerIds.forEach((pid) => {
    const finalRole = finalRoles[pid];
    if (finalRole === 'tanner') {
      scoreAwards[pid] = 4; // Solo Tanner master bluff bonus
    } else if (finalRole === 'werewolf') {
      scoreAwards[pid] = 3; // Surviving Werewolf bonus
    } else {
      scoreAwards[pid] = 2; // Village team victory
    }
  });

  const nextState: OneNightGameState = {
    ...state,
    phase: 'reveal',
    votes,
    executedPlayerIds,
    winningTeams,
    winnerPlayerIds,
  };

  return { nextState, scoreAwards };
}

/* ============================================================================
 * 6. MAIN COMPONENT: OneNightGame
 * ========================================================================== */

export const OneNightGame: React.FC<OneNightGameProps> = ({
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

  // Pass-and-Play active player switcher + Privacy Curtain
  const [localTurnIdx, setLocalTurnIdx] = useState<number>(0);
  const [privacyUnlocked, setPrivacyUnlocked] = useState<boolean>(!isPassAndPlay);

  // Local Night Action draft state before locking in
  const [seerMode, setSeerMode] = useState<'player' | 'center'>('player');
  const [selectedTarget1, setSelectedTarget1] = useState<string>('');
  const [selectedTarget2, setSelectedTarget2] = useState<string>('');
  const [selectedCenters, setSelectedCenters] = useState<number[]>([]);

  // Daytime Public Role Claim state & Private Dossier modal
  const [showPrivateReport, setShowPrivateReport] = useState<boolean>(false);
  const [claimRolePick, setClaimRolePick] = useState<OneNightRoleId>('villager');
  const [claimNoteInput, setClaimNoteInput] = useState<string>('');
  const [dayTimeLeft, setDayTimeLeft] = useState<number>(
    gameData.dayDurationSec || 210
  );

  // Reset local draft selections when active player changes in Pass-and-Play or phase resets
  const activePlayer = isPassAndPlay
    ? players[localTurnIdx] || players[0]
    : players.find((p) => p.id === myPlayerId) || players[0];

  const activePlayerId = activePlayer?.id || myPlayerId;
  const myInitialRole: OneNightRoleId =
    gameData.initialRoles?.[activePlayerId] || 'villager';
  const myRoleMeta = ONE_NIGHT_ROLES_META[myInitialRole];

  useEffect(() => {
    setSelectedTarget1('');
    setSelectedTarget2('');
    setSelectedCenters([]);
    setSeerMode('player');
    if (isPassAndPlay) {
      setPrivacyUnlocked(false);
    } else {
      setPrivacyUnlocked(true);
    }
  }, [activePlayerId, gameData.phase, isPassAndPlay]);

  // Trigger celebratory confetti on Reveal
  useEffect(() => {
    if (gameData.phase === 'reveal') {
      try {
        confetti({
          particleCount: 75,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {
        // ignore confetti error
      }
    }
  }, [gameData.phase]);

  // Daytime debate countdown timer
  useEffect(() => {
    if (gameData.phase !== 'day_debate') return;
    const updateTimer = () => {
      const elapsed = Math.floor(
        (Date.now() - (gameData.startedAt || Date.now())) / 1000
      );
      const rem = Math.max(0, (gameData.dayDurationSec || 210) - elapsed);
      setDayTimeLeft(rem);
    };
    updateTimer();
    const id = setInterval(updateTimer, 1000);
    return () => clearInterval(id);
  }, [gameData.phase, gameData.startedAt, gameData.dayDurationSec]);

  const otherPlayers = players.filter((p) => p.id !== activePlayerId);
  const allInitialWolves = players.filter(
    (p) => gameData.initialRoles?.[p.id] === 'werewolf'
  );
  const isLoneWolf =
    myInitialRole === 'werewolf' && allInitialWolves.length === 1;

  // Toggle center card selection
  const handleToggleCenterIdx = (idx: number, maxAllowed: number) => {
    setSelectedCenters((prev) => {
      if (prev.includes(idx)) {
        return prev.filter((i) => i !== idx);
      }
      if (maxAllowed === 1) {
        return [idx];
      }
      if (prev.length >= maxAllowed) {
        return [...prev.slice(1), idx];
      }
      return [...prev, idx];
    });
  };

  // Validate if active player can lock their night action
  const canLockNightAction = (): boolean => {
    if (myInitialRole === 'werewolf') {
      return isLoneWolf ? selectedCenters.length === 1 : true;
    }
    if (myInitialRole === 'seer') {
      return seerMode === 'player'
        ? Boolean(selectedTarget1)
        : selectedCenters.length === 2;
    }
    if (myInitialRole === 'robber') {
      return Boolean(selectedTarget1);
    }
    if (myInitialRole === 'troublemaker') {
      return (
        Boolean(selectedTarget1) &&
        Boolean(selectedTarget2) &&
        selectedTarget1 !== selectedTarget2
      );
    }
    return true;
  };

  // Lock Night Action for activePlayerId
  const handleLockNightAction = () => {
    let action: OneNightNightAction = { type: 'ready' };

    if (myInitialRole === 'werewolf') {
      action = isLoneWolf
        ? { type: 'werewolf_center', centerIndices: selectedCenters }
        : { type: 'werewolf_pack' };
    } else if (myInitialRole === 'seer') {
      action =
        seerMode === 'player'
          ? { type: 'seer_player', targetPlayerId: selectedTarget1 }
          : { type: 'seer_center', centerIndices: selectedCenters };
    } else if (myInitialRole === 'robber') {
      action = { type: 'robber_steal', targetPlayerId: selectedTarget1 };
    } else if (myInitialRole === 'troublemaker') {
      action = {
        type: 'troublemaker_swap',
        targetPlayerId: selectedTarget1,
        targetPlayerId2: selectedTarget2,
      };
    }

    const updatedActions: Record<string, OneNightNightAction> = {
      ...(gameData.nightActions || {}),
      [activePlayerId]: action,
    };

    const allDone = players.every((p) => Boolean(updatedActions[p.id]));

    if (allDone) {
      const resolved = resolveNightPhase(
        {
          ...gameData,
          nightActions: updatedActions,
        },
        players
      );
      onUpdateGameData(resolved);
      if (isPassAndPlay) {
        setLocalTurnIdx(0);
      }
    } else {
      onUpdateGameData({
        ...gameData,
        nightActions: updatedActions,
      });
      // Advance to next unlocked player in Pass-and-Play
      if (isPassAndPlay) {
        const nextIdx = players.findIndex(
          (p, idx) => idx > localTurnIdx && !updatedActions[p.id]
        );
        if (nextIdx !== -1) {
          setLocalTurnIdx(nextIdx);
        } else {
          const firstUnlocked = players.findIndex((p) => !updatedActions[p.id]);
          if (firstUnlocked !== -1) setLocalTurnIdx(firstUnlocked);
        }
      }
    }
  };

  // Submit public role claim during Day Debate
  const handlePostClaim = () => {
    const nextClaims: Record<string, OneNightClaim> = {
      ...(gameData.claims || {}),
      [activePlayerId]: {
        claimedRole: claimRolePick,
        note: claimNoteInput.trim(),
      },
    };
    onUpdateGameData({
      ...gameData,
      claims: nextClaims,
    });
    setClaimNoteInput('');
  };

  // Cast Execution Vote during Day Debate
  const handleCastVote = (targetId: string) => {
    const nextVotes: Record<string, string> = {
      ...(gameData.votes || {}),
      [activePlayerId]: targetId,
    };

    const everyoneVoted = players.every((p) => Boolean(nextVotes[p.id]));

    if (everyoneVoted) {
      const { nextState, scoreAwards } = resolveVotesAndWinners(
        gameData,
        players,
        nextVotes
      );
      onUpdateGameData(nextState, scoreAwards);
    } else {
      onUpdateGameData({
        ...gameData,
        votes: nextVotes,
      });
      if (isPassAndPlay) {
        const nextUnvoted = players.findIndex((p) => !nextVotes[p.id]);
        if (nextUnvoted !== -1) setLocalTurnIdx(nextUnvoted);
      }
    }
  };

  // Host force-resolve if timer runs out
  const handleForceResolveDay = () => {
    const { nextState, scoreAwards } = resolveVotesAndWinners(
      gameData,
      players,
      gameData.votes || {}
    );
    onUpdateGameData(nextState, scoreAwards);
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  /* ============================================================================
   * RENDER HELPERS
   * ========================================================================== */

  // Deck Roles Pool Bar (Players + 3 Center Cards)
  const renderDeckPoolBanner = () => {
    const deck = gameData.deckRoles || buildOneNightDeck(players.length);
    const counts: Partial<Record<OneNightRoleId, number>> = {};
    deck.forEach((r) => {
      counts[r] = (counts[r] || 0) + 1;
    });

    const uniqueRoles = Object.keys(counts) as OneNightRoleId[];

    return (
      <div className="bg-[#fff9ec] border-4 border-[#161426] rounded-3xl p-4 shadow-[0_6px_0_#161426]">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#9b5de5] border-2 border-[#161426] flex items-center justify-center text-white">
              <Cards weight="fill" className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-black text-sm md:text-base text-[#161426]">
                {isAr
                  ? `الأدوار الموجودة في هذه الجولة (${deck.length} بطاقات: ${players.length} لاعبين + 3 في المنتصف)`
                  : `Roles in Play (${deck.length} Cards: ${players.length} Players + 3 in Center)`}
              </h4>
            </div>
          </div>
          <span className="text-xs font-black px-3 py-1 rounded-full bg-[#ffca3a] border-2 border-[#161426] text-[#161426]">
            {isAr
              ? 'الأولوية الليلية: ذئب ← عرّافة ← لص ← مشاغب ← سهران'
              : 'Night Order: Wolf -> Seer -> Robber -> Troublemaker -> Insomniac'}
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {uniqueRoles.map((rId) => {
            const meta = ONE_NIGHT_ROLES_META[rId];
            const cnt = counts[rId] || 1;
            return (
              <div
                key={rId}
                className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-white border-3 border-[#161426] shadow-[0_3px_0_#161426]"
              >
                <OneNightRoleSvg role={rId} className="w-7 h-7" />
                <span className="font-black text-xs md:text-sm text-[#161426]">
                  {isAr ? meta.name_ar : meta.name_en}
                </span>
                {cnt > 1 && (
                  <span className="px-1.5 py-0.5 text-[11px] font-black rounded-lg bg-[#161426] text-[#ffca3a]">
                    x{cnt}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  /* ============================================================================
   * PHASE 1: NIGHT PHASE (الليل وتنفيذ الأدوار السرية)
   * ========================================================================== */

  const renderNightPhase = () => {
    const myLockedAction = gameData.nightActions?.[activePlayerId];
    const lockedCount = players.filter((p) =>
      Boolean(gameData.nightActions?.[p.id])
    ).length;

    return (
      <div className="space-y-5">
        {/* Top Night Status Header */}
        <div className="bg-gradient-to-r from-[#161426] via-[#271b47] to-[#161426] text-white border-4 border-[#161426] rounded-3xl p-5 shadow-[0_8px_0_#161426] flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-[#9b5de5] border-3 border-[#fff9ec] flex items-center justify-center shadow-[0_4px_0_#161426]">
              <MoonStars weight="fill" className="w-8 h-8 text-[#ffca3a]" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#ffca3a] text-[#161426] font-black text-xs mb-1">
                <Sparkle weight="fill" className="w-3.5 h-3.5" />
                <span>
                  {isAr ? 'المرحلة 1: الليل السري' : 'Phase 1: Secret Night'}
                </span>
              </div>
              <h2 className="text-xl md:text-2xl font-black">
                {isAr
                  ? 'افتح بطاقتك السرية ونفّذ قدرتك الليلية!'
                  : 'Inspect Your Secret Role & Lock Your Night Action!'}
              </h2>
            </div>
          </div>

          {/* Progress Counter */}
          <div className="flex items-center gap-2 bg-[#252042] border-3 border-[#fff9ec]/30 px-4 py-2.5 rounded-2xl">
            <Users weight="fill" className="w-5 h-5 text-[#00bbf9]" />
            <span className="font-black text-sm">
              {isAr
                ? `الجاهزون للنهار: ${lockedCount} / ${players.length}`
                : `Ready for Day: ${lockedCount} / ${players.length}`}
            </span>
          </div>
        </div>

        {/* Pass-and-Play Player Selector Pills */}
        {isPassAndPlay && (
          <div className="bg-[#fff9ec] border-4 border-[#161426] rounded-3xl p-4 shadow-[0_6px_0_#161426]">
            <p className="text-xs font-black text-[#161426]/70 mb-2.5">
              {isAr
                ? 'وضع جهاز واحد (مرّر الجوال بالترتيب لكل لاعب لتنفيذ دوره السري):'
                : 'Pass-and-Play: Pass the device to each player to complete their secret Night step:'}
            </p>
            <div className="flex flex-wrap gap-2">
              {players.map((p, idx) => {
                const isDone = Boolean(gameData.nightActions?.[p.id]);
                const isSelected = idx === localTurnIdx;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setLocalTurnIdx(idx)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl border-3 border-[#161426] font-black text-xs md:text-sm transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#ffca3a] text-[#161426] shadow-[0_4px_0_#161426] -translate-y-0.5'
                        : isDone
                        ? 'bg-[#8ac926]/25 text-[#161426]'
                        : 'bg-white text-[#161426] hover:bg-slate-100'
                    }`}
                  >
                    <div className="w-6 h-6 rounded-full border-2 border-[#161426] overflow-hidden">
                      <CartoonAvatarSvg index={idx} color={p.avatar_color} />
                    </div>
                    <span>{p.name}</span>
                    {isDone && (
                      <CheckCircle
                        weight="fill"
                        className="w-4 h-4 text-[#38b000]"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Privacy Screen for Pass-and-Play */}
        {!privacyUnlocked ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#161426] text-white border-4 border-[#161426] rounded-3xl p-8 text-center shadow-[0_8px_0_#161426] space-y-5"
          >
            <div className="w-24 h-24 mx-auto rounded-3xl bg-[#2b2640] border-4 border-[#ffca3a] flex items-center justify-center shadow-[0_6px_0_#000]">
              <LockKey weight="fill" className="w-12 h-12 text-[#ffca3a]" />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-black uppercase tracking-wider text-[#00bbf9]">
                {isAr ? 'شاشة حماية السرية' : 'Secret Role Privacy Shield'}
              </p>
              <h3 className="text-2xl md:text-3xl font-black text-[#fff9ec]">
                {isAr
                  ? `مرّر الجهاز إلى: ${activePlayer?.name}`
                  : `Pass Device To: ${activePlayer?.name}`}
              </h3>
              <p className="text-sm text-white/75 max-w-md mx-auto">
                {isAr
                  ? 'تأكد أن لا أحد ينظر إلى شاشتك قبل كشف بطاقة دورك الليلي!'
                  : 'Make sure nobody else is peeking at the screen before revealing your night card!'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setPrivacyUnlocked(true)}
              className="inline-flex items-center gap-2.5 px-7 py-4 rounded-2xl bg-[#ffca3a] hover:bg-[#ffd65c] text-[#161426] font-black text-base md:text-lg border-4 border-white shadow-[0_6px_0_#000] active:translate-y-1 transition-all cursor-pointer"
            >
              <Eye weight="fill" className="w-6 h-6" />
              <span>
                {isAr
                  ? `أنا ${activePlayer?.name} — اكشف بطاقتي!`
                  : `I am ${activePlayer?.name} — Reveal My Role!`}
              </span>
            </button>
          </motion.div>
        ) : (
          /* Active Player Tarot Role Card & Night Action Console */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
            {/* Tarot Role Card (5 cols) */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className={`lg:col-span-5 bg-gradient-to-b ${myRoleMeta.cardBg} text-white border-4 border-[#161426] rounded-3xl p-6 shadow-[0_8px_0_#161426] flex flex-col justify-between relative overflow-hidden`}
            >
              <div className="flex items-center justify-between gap-2 z-10">
                <span
                  className={`px-3.5 py-1 rounded-full border-2 border-[#161426] font-black text-xs shadow-[0_2px_0_#161426] ${myRoleMeta.badgeBg}`}
                >
                  {isAr ? myRoleMeta.team_ar : myRoleMeta.team_en}
                </span>
                <span className="text-xs font-black px-3 py-1 rounded-full bg-white/15 border border-white/25">
                  {isAr ? `بطاقة ${activePlayer?.name}` : `${activePlayer?.name}'s Card`}
                </span>
              </div>

              <div className="my-6 flex flex-col items-center text-center z-10">
                <div className="w-36 h-36 rounded-3xl bg-[#fff9ec]/10 border-4 border-[#fff9ec]/40 flex items-center justify-center shadow-[0_8px_0_rgba(0,0,0,0.4)] mb-4">
                  <OneNightRoleSvg role={myInitialRole} className="w-28 h-28" />
                </div>
                <p className="text-xs uppercase tracking-widest text-[#ffca3a] font-black mb-1">
                  {isAr ? 'دورك الابتدائي في أول الليل' : 'Your Initial Role'}
                </p>
                <h3 className="text-3xl font-black text-[#fff9ec] mb-2">
                  {isAr ? myRoleMeta.name_ar : myRoleMeta.name_en}
                </h3>
                <p className="text-sm text-white/85 leading-relaxed font-bold">
                  {isAr ? myRoleMeta.power_ar : myRoleMeta.power_en}
                </p>
              </div>

              <div className="bg-black/35 border-2 border-white/20 rounded-2xl p-3 text-center text-xs font-bold text-[#ffca3a] z-10">
                {isAr
                  ? 'انتبه: قد يقوم اللص أو المشاغب بتبديل بطاقتك أثناء الليل دون علمك!'
                  : 'Heads up: The Robber or Troublemaker might swap your card later tonight!'}
              </div>
            </motion.div>

            {/* Interactive Night Power Console (7 cols) */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="lg:col-span-7 bg-[#fff9ec] border-4 border-[#161426] rounded-3xl p-6 shadow-[0_8px_0_#161426] flex flex-col justify-between"
            >
              {myLockedAction ? (
                <div className="my-auto text-center py-8 space-y-4">
                  <div className="w-20 h-20 mx-auto rounded-3xl bg-[#8ac926] border-4 border-[#161426] flex items-center justify-center shadow-[0_5px_0_#161426]">
                    <CheckCircle weight="fill" className="w-11 h-11 text-[#161426]" />
                  </div>
                  <h3 className="text-2xl font-black text-[#161426]">
                    {isAr
                      ? 'تم تسجيل حركتك الليلية بنجاح!'
                      : 'Night Action Locked In!'}
                  </h3>
                  <p className="text-sm font-bold text-[#161426]/75 max-w-md mx-auto">
                    {isAr
                      ? 'بمجرد انتهاء جميع اللاعبين، سيشرق النهار وستظهر لك نتيجة حركتك السرية بالتفصيل!'
                      : 'Once all players finish their night step, daybreak will begin and your private night report will be revealed!'}
                  </p>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="border-b-3 border-[#161426]/15 pb-3">
                    <span className="text-xs font-black uppercase text-[#9b5de5]">
                      {isAr ? 'لوحة تنفيذ القدرة الليلية' : 'Night Ability Console'}
                    </span>
                    <h4 className="text-xl font-black text-[#161426] mt-0.5">
                      {myInitialRole === 'werewolf' &&
                        (isLoneWolf
                          ? isAr
                            ? 'أنت الذئب الوحيد! اختر بطاقة واحدة من المنتصف لكشفها:'
                            : 'You are a Lone Wolf! Pick 1 Center Card to peek at:'
                          : isAr
                          ? 'تعرّف على قطيع الذئاب معك في هذه الليلة:'
                          : 'Meet your fellow Werewolf packmates tonight:')}
                      {myInitialRole === 'seer' &&
                        (isAr
                          ? 'اختر: كشف بطاقة لاعب واحد أو كشف بطاقتين من المنتصف!'
                          : 'Choose: Peek at 1 Player’s card OR 2 Center Cards!')}
                      {myInitialRole === 'robber' &&
                        (isAr
                          ? 'اختر لاعباً لسرقة بطاقته وتبديلها ببطاقتك:'
                          : 'Choose a player to steal their role card and swap with yours:')}
                      {myInitialRole === 'troublemaker' &&
                        (isAr
                          ? 'اختر لاعبين اثنين لتبديل بطاقتيهما بالسر:'
                          : 'Select 2 other players to swap their cards blindly:')}
                      {(myInitialRole === 'villager' ||
                        myInitialRole === 'tanner' ||
                        myInitialRole === 'insomniac') &&
                        (isAr
                          ? 'تأكيد الجاهزية لطلوع النهار'
                          : 'Confirm Readiness for Daybreak')}
                    </h4>
                  </div>

                  {/* WEREWOLF CONSOLE */}
                  {myInitialRole === 'werewolf' && !isLoneWolf && (
                    <div className="bg-[#ff595e]/15 border-3 border-[#161426] rounded-2xl p-4 space-y-3">
                      <p className="text-sm font-black text-[#161426]">
                        {isAr ? 'شركاؤك الذئاب في هذه الجولة:' : 'Your fellow Werewolves:'}
                      </p>
                      <div className="flex flex-wrap gap-3">
                        {allInitialWolves
                          .filter((w) => w.id !== activePlayerId)
                          .map((w, idx) => (
                            <div
                              key={w.id}
                              className="flex items-center gap-2.5 bg-white px-4 py-2.5 rounded-2xl border-3 border-[#161426] shadow-[0_3px_0_#161426]"
                            >
                              <div className="w-8 h-8 rounded-full border-2 border-[#161426] overflow-hidden">
                                <CartoonAvatarSvg
                                  index={idx}
                                  color={w.avatar_color}
                                />
                              </div>
                              <span className="font-black text-[#161426]">
                                {w.name}
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {myInitialRole === 'werewolf' && isLoneWolf && (
                    <div className="grid grid-cols-3 gap-3">
                      {[0, 1, 2].map((cIdx) => {
                        const picked = selectedCenters.includes(cIdx);
                        return (
                          <button
                            key={cIdx}
                            type="button"
                            onClick={() => handleToggleCenterIdx(cIdx, 1)}
                            className={`p-4 rounded-2xl border-4 border-[#161426] flex flex-col items-center gap-2 transition-all cursor-pointer ${
                              picked
                                ? 'bg-[#ffca3a] shadow-[0_5px_0_#161426] -translate-y-1'
                                : 'bg-white hover:bg-slate-100'
                            }`}
                          >
                            <OneNightRoleSvg
                              role="mystery"
                              className="w-14 h-14"
                            />
                            <span className="font-black text-xs md:text-sm text-[#161426]">
                              {isAr
                                ? `بطاقة المنتصف #${cIdx + 1}`
                                : `Center Card #${cIdx + 1}`}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* SEER CONSOLE */}
                  {myInitialRole === 'seer' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            setSeerMode('player');
                            setSelectedCenters([]);
                          }}
                          className={`py-2.5 px-4 rounded-2xl border-3 border-[#161426] font-black text-xs md:text-sm cursor-pointer transition-all ${
                            seerMode === 'player'
                              ? 'bg-[#9b5de5] text-white shadow-[0_4px_0_#161426]'
                              : 'bg-white text-[#161426]'
                          }`}
                        >
                          {isAr
                            ? '1. كشف بطاقة لاعب واحد'
                            : '1. Peek at 1 Player Card'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSeerMode('center');
                            setSelectedTarget1('');
                          }}
                          className={`py-2.5 px-4 rounded-2xl border-3 border-[#161426] font-black text-xs md:text-sm cursor-pointer transition-all ${
                            seerMode === 'center'
                              ? 'bg-[#9b5de5] text-white shadow-[0_4px_0_#161426]'
                              : 'bg-white text-[#161426]'
                          }`}
                        >
                          {isAr
                            ? '2. كشف بطاقتين من المنتصف'
                            : '2. Peek at 2 Center Cards'}
                        </button>
                      </div>

                      {seerMode === 'player' ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                          {otherPlayers.map((p, idx) => {
                            const picked = selectedTarget1 === p.id;
                            return (
                              <button
                                key={p.id}
                                type="button"
                                onClick={() => setSelectedTarget1(p.id)}
                                className={`p-3 rounded-2xl border-3 border-[#161426] flex items-center gap-2.5 font-black text-sm transition-all cursor-pointer ${
                                  picked
                                    ? 'bg-[#ffca3a] shadow-[0_4px_0_#161426] -translate-y-0.5'
                                    : 'bg-white hover:bg-slate-100'
                                }`}
                              >
                                <div className="w-8 h-8 rounded-full border-2 border-[#161426] overflow-hidden shrink-0">
                                  <CartoonAvatarSvg
                                    index={idx}
                                    color={p.avatar_color}
                                  />
                                </div>
                                <span className="truncate text-[#161426]">
                                  {p.name}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="grid grid-cols-3 gap-3">
                          {[0, 1, 2].map((cIdx) => {
                            const picked = selectedCenters.includes(cIdx);
                            return (
                              <button
                                key={cIdx}
                                type="button"
                                onClick={() => handleToggleCenterIdx(cIdx, 2)}
                                className={`p-3.5 rounded-2xl border-3 border-[#161426] flex flex-col items-center gap-1.5 cursor-pointer transition-all ${
                                  picked
                                    ? 'bg-[#ffca3a] shadow-[0_4px_0_#161426] -translate-y-0.5'
                                    : 'bg-white hover:bg-slate-100'
                                }`}
                              >
                                <OneNightRoleSvg
                                  role="mystery"
                                  className="w-12 h-12"
                                />
                                <span className="font-black text-xs text-[#161426]">
                                  {isAr
                                    ? `منتصف #${cIdx + 1}`
                                    : `Center #${cIdx + 1}`}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* ROBBER CONSOLE */}
                  {myInitialRole === 'robber' && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {otherPlayers.map((p, idx) => {
                        const picked = selectedTarget1 === p.id;
                        return (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => setSelectedTarget1(p.id)}
                            className={`p-3.5 rounded-2xl border-3 border-[#161426] flex items-center gap-2.5 font-black text-sm transition-all cursor-pointer ${
                              picked
                                ? 'bg-[#ff924c] text-[#161426] shadow-[0_4px_0_#161426] -translate-y-0.5'
                                : 'bg-white text-[#161426] hover:bg-slate-100'
                            }`}
                          >
                            <div className="w-8 h-8 rounded-full border-2 border-[#161426] overflow-hidden shrink-0">
                              <CartoonAvatarSvg
                                index={idx}
                                color={p.avatar_color}
                              />
                            </div>
                            <span className="truncate">{p.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* TROUBLEMAKER CONSOLE */}
                  {myInitialRole === 'troublemaker' && (
                    <div className="space-y-2.5">
                      <p className="text-xs font-bold text-[#161426]/75">
                        {isAr
                          ? 'اضغط على لاعبين اثنين لتبديل بطاقتيهما:'
                          : 'Click two other players to swap their cards:'}
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                        {otherPlayers.map((p, idx) => {
                          const isP1 = selectedTarget1 === p.id;
                          const isP2 = selectedTarget2 === p.id;
                          const picked = isP1 || isP2;
                          return (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => {
                                if (isP1) {
                                  setSelectedTarget1('');
                                } else if (isP2) {
                                  setSelectedTarget2('');
                                } else if (!selectedTarget1) {
                                  setSelectedTarget1(p.id);
                                } else {
                                  setSelectedTarget2(p.id);
                                }
                              }}
                              className={`p-3.5 rounded-2xl border-3 border-[#161426] flex items-center justify-between gap-2 font-black text-sm transition-all cursor-pointer ${
                                picked
                                  ? 'bg-[#00bbf9] text-[#161426] shadow-[0_4px_0_#161426] -translate-y-0.5'
                                  : 'bg-white text-[#161426] hover:bg-slate-100'
                              }`}
                            >
                              <div className="flex items-center gap-2 truncate">
                                <div className="w-7 h-7 rounded-full border-2 border-[#161426] overflow-hidden shrink-0">
                                  <CartoonAvatarSvg
                                    index={idx}
                                    color={p.avatar_color}
                                  />
                                </div>
                                <span className="truncate">{p.name}</span>
                              </div>
                              {picked && (
                                <span className="px-2 py-0.5 rounded-lg bg-[#161426] text-[#ffca3a] text-xs">
                                  {isP1 ? '#1' : '#2'}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* INSOMNIAC / VILLAGER / TANNER INFO BOX */}
                  {(myInitialRole === 'insomniac' ||
                    myInitialRole === 'villager' ||
                    myInitialRole === 'tanner') && (
                    <div className="bg-white border-3 border-[#161426] rounded-2xl p-4 space-y-2">
                      <p className="font-black text-sm text-[#161426]">
                        {myInitialRole === 'insomniac'
                          ? isAr
                            ? 'السهران يستيقظ في نهاية الليل تلقائياً! اضغط تأكيد الجاهزية، وعند شروق الشمس ستعرف هل بقيت بطاقتك كما هي أم تم تبديلها!'
                            : 'The Insomniac wakes up last automatically! Confirm readiness below, and at daybreak you will see whether your card was swapped!'
                          : myInitialRole === 'tanner'
                          ? isAr
                            ? 'اليائس لا يقوم بحركة ليلية. خطط لخداع القرية في النهار وجعلهم يصوتون ضدك!'
                            : 'The Tanner has no night action. Prepare your bluff so the village votes to execute you!'
                          : isAr
                          ? 'القروي ينام بهدوء في الليل. اضغط تأكيد الجاهزية للانتقال إلى نقاش النهار!'
                          : 'The Villager sleeps peacefully at night. Click confirm below to proceed to the daytime debate!'}
                      </p>
                    </div>
                  )}

                  {/* Lock Night Action Button */}
                  <button
                    type="button"
                    disabled={!canLockNightAction()}
                    onClick={handleLockNightAction}
                    className={`w-full py-4 px-6 rounded-2xl border-4 border-[#161426] font-black text-base md:text-lg flex items-center justify-center gap-2.5 transition-all cursor-pointer ${
                      canLockNightAction()
                        ? 'bg-[#8ac926] hover:bg-[#9be02b] text-[#161426] shadow-[0_6px_0_#161426] active:translate-y-1'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <CheckCircle weight="fill" className="w-6 h-6" />
                    <span>
                      {isAr
                        ? 'تأكيد الحركة الليلية والجاهزية للنهار'
                        : 'Lock In Night Action & Ready for Day'}
                    </span>
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}

        {/* Roles Pool Bar */}
        {renderDeckPoolBanner()}
      </div>
    );
  };

  /* ============================================================================
   * PHASE 2: DAY DEBATE & EXECUTION VOTING (النهار والنقاش والتصويت)
   * ========================================================================== */

  const renderDayDebatePhase = () => {
    const myReport = gameData.nightReports?.[activePlayerId];
    const myVote = gameData.votes?.[activePlayerId];
    const totalVotes = Object.keys(gameData.votes || {}).length;

    return (
      <div className="space-y-5">
        {/* Daybreak Header with Countdown & Private Dossier Toggle */}
        <div className="bg-gradient-to-r from-[#ffca3a] via-[#ff924c] to-[#ff595e] text-[#161426] border-4 border-[#161426] rounded-3xl p-5 shadow-[0_8px_0_#161426] flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-[#fff9ec] border-3 border-[#161426] flex items-center justify-center shadow-[0_4px_0_#161426]">
              <SunHorizon weight="fill" className="w-8 h-8 text-[#ff595e]" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#161426] text-[#ffca3a] font-black text-xs mb-1">
                <span>
                  {isAr
                    ? 'المرحلة 2: شروق الشمس والنقاش'
                    : 'Phase 2: Daybreak Debate & Voting'}
                </span>
              </div>
              <h2 className="text-xl md:text-2xl font-black text-[#161426]">
                {isAr
                  ? 'تبادلوا الادعاءات، اكشفوا التبديلات، وصوّتوا لإعدام الذئب!'
                  : 'Debate Claims, Trace Card Swaps & Vote to Execute a Werewolf!'}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Timer Pill */}
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#fff9ec] border-3 border-[#161426] shadow-[0_4px_0_#161426] font-black">
              <Clock weight="fill" className="w-5 h-5 text-[#ff595e]" />
              <span className="text-base md:text-lg tabular-nums">
                {formatTimer(dayTimeLeft)}
              </span>
            </div>

            {/* Secret Night Report Button */}
            <button
              type="button"
              onClick={() => setShowPrivateReport((prev) => !prev)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#161426] text-[#ffca3a] border-3 border-[#161426] shadow-[0_4px_0_#000] font-black text-xs md:text-sm cursor-pointer hover:bg-[#282442]"
            >
              {showPrivateReport ? (
                <EyeSlash weight="fill" className="w-5 h-5" />
              ) : (
                <Eye weight="fill" className="w-5 h-5" />
              )}
              <span>
                {showPrivateReport
                  ? isAr
                    ? 'إخفاء تقريري الليلي'
                    : 'Hide Night Report'
                  : isAr
                  ? 'كشف تقريري الليلي السري'
                  : 'View My Secret Night Report'}
              </span>
            </button>
          </div>
        </div>

        {/* Pass-and-Play Switcher during Day Debate */}
        {isPassAndPlay && (
          <div className="bg-[#fff9ec] border-4 border-[#161426] rounded-3xl p-4 shadow-[0_6px_0_#161426]">
            <p className="text-xs font-black text-[#161426]/70 mb-2">
              {isAr
                ? 'اختر اسمك لمراجعة تقريرك الليلي أو التصويت لإعدام المشتبه به:'
                : 'Select your player tab to check your private Night Report or cast your Execution Vote:'}
            </p>
            <div className="flex flex-wrap gap-2">
              {players.map((p, idx) => {
                const hasVoted = Boolean(gameData.votes?.[p.id]);
                const isSelected = idx === localTurnIdx;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setLocalTurnIdx(idx);
                      setShowPrivateReport(false);
                    }}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl border-3 border-[#161426] font-black text-xs md:text-sm cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-[#ffca3a] text-[#161426] shadow-[0_4px_0_#161426]'
                        : hasVoted
                        ? 'bg-[#8ac926]/25 text-[#161426]'
                        : 'bg-white text-[#161426]'
                    }`}
                  >
                    <div className="w-6 h-6 rounded-full border-2 border-[#161426] overflow-hidden">
                      <CartoonAvatarSvg index={idx} color={p.avatar_color} />
                    </div>
                    <span>{p.name}</span>
                    {hasVoted && (
                      <CheckCircle
                        weight="fill"
                        className="w-4 h-4 text-[#38b000]"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Collapsible Private Night Report Drawer */}
        <AnimatePresence>
          {showPrivateReport && myReport && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-[#161426] text-white border-4 border-[#161426] rounded-3xl p-5 shadow-[0_6px_0_#161426] space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <OneNightRoleSvg role={myInitialRole} className="w-12 h-12" />
                    <div>
                      <span className="text-xs font-black text-[#ffca3a]">
                        {isAr
                          ? `دورك الابتدائي: ${myRoleMeta.name_ar}`
                          : `Initial Role: ${myRoleMeta.name_en}`}
                      </span>
                      <h4 className="text-lg font-black text-white">
                        {isAr ? myReport.title_ar : myReport.title_en}
                      </h4>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPrivateReport(false)}
                    className="px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-xs font-black cursor-pointer"
                  >
                    {isAr ? 'إغلاق السرية' : 'Close'}
                  </button>
                </div>

                <p className="text-sm font-bold text-[#fff9ec] bg-white/10 border-2 border-white/15 rounded-2xl p-3.5">
                  {isAr ? myReport.detail_ar : myReport.detail_en}
                </p>

                {myReport.seenRoles && myReport.seenRoles.length > 0 && (
                  <div className="flex flex-wrap gap-3">
                    {myReport.seenRoles.map((sr, i) => {
                      const sm = ONE_NIGHT_ROLES_META[sr.role];
                      return (
                        <div
                          key={i}
                          className="flex items-center gap-3 bg-[#252042] border-3 border-[#ffca3a] rounded-2xl px-4 py-2.5"
                        >
                          <OneNightRoleSvg role={sr.role} className="w-10 h-10" />
                          <div>
                            <div className="text-xs text-white/75 font-bold">
                              {isAr ? sr.label_ar : sr.label_en}
                            </div>
                            <div className="font-black text-sm text-[#ffca3a]">
                              {isAr ? sm.name_ar : sm.name_en}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Roles in Play Bar */}
        {renderDeckPoolBanner()}

        {/* Main Day Grid: Left = Role Claims & Bluff Board, Right = Execution Voting */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Public Role Claim & Alibi Board (5 cols) */}
          <div className="lg:col-span-5 bg-[#fff9ec] border-4 border-[#161426] rounded-3xl p-5 shadow-[0_6px_0_#161426] space-y-4">
            <div className="flex items-center gap-2">
              <ChatCenteredText
                weight="fill"
                className="w-6 h-6 text-[#9b5de5]"
              />
              <h3 className="text-lg font-black text-[#161426]">
                {isAr
                  ? 'لوحة الادعاءات والمراوغة العلنية'
                  : 'Public Role Claims & Alibi Board'}
              </h3>
            </div>

            <div className="bg-white border-3 border-[#161426] rounded-2xl p-3.5 space-y-3">
              <label className="block text-xs font-black text-[#161426]/80">
                {isAr
                  ? `باسم (${activePlayer?.name}) — أعلن للقرية الدور الذي تدّعيه (بصدق أو كذب!):`
                  : `As (${activePlayer?.name}) — Publicly claim a role (truthfully or bluffing!):`}
              </label>
              <div className="flex flex-wrap gap-1.5">
                {(Object.keys(ONE_NIGHT_ROLES_META) as OneNightRoleId[]).map(
                  (rId) => {
                    const m = ONE_NIGHT_ROLES_META[rId];
                    const active = claimRolePick === rId;
                    return (
                      <button
                        key={rId}
                        type="button"
                        onClick={() => setClaimRolePick(rId)}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border-2 border-[#161426] font-black text-xs cursor-pointer transition-all ${
                          active
                            ? 'bg-[#ffca3a] text-[#161426] shadow-[0_2px_0_#161426]'
                            : 'bg-slate-50 text-[#161426]'
                        }`}
                      >
                        <OneNightRoleSvg role={rId} className="w-5 h-5" />
                        <span>{isAr ? m.name_ar : m.name_en}</span>
                      </button>
                    );
                  }
                )}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={claimNoteInput}
                  onChange={(e) => setClaimNoteInput(e.target.value)}
                  placeholder={
                    isAr
                      ? 'اكتب ماذا رأيت أو مع من بدّلت البطاقات...'
                      : 'Write what you saw or who you swapped...'
                  }
                  className="flex-1 px-3 py-2 rounded-xl border-2 border-[#161426] text-xs font-bold bg-[#fff9ec] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handlePostClaim}
                  className="px-4 py-2 rounded-xl bg-[#9b5de5] text-white border-2 border-[#161426] font-black text-xs shadow-[0_3px_0_#161426] cursor-pointer"
                >
                  {isAr ? 'نشر الادعاء' : 'Post Claim'}
                </button>
              </div>
            </div>

            {/* List of Claims */}
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {players.map((p, idx) => {
                const c = gameData.claims?.[p.id];
                const cm = c ? ONE_NIGHT_ROLES_META[c.claimedRole] : null;
                return (
                  <div
                    key={p.id}
                    className="flex items-center justify-between gap-2 bg-white border-2 border-[#161426] rounded-2xl p-2.5"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-full border-2 border-[#161426] overflow-hidden shrink-0">
                        <CartoonAvatarSvg index={idx} color={p.avatar_color} />
                      </div>
                      <div className="truncate">
                        <span className="font-black text-xs text-[#161426]">
                          {p.name}
                        </span>
                        {c?.note && (
                          <p className="text-[11px] font-bold text-[#161426]/75 truncate">
                            “{c.note}”
                          </p>
                        )}
                      </div>
                    </div>
                    {cm ? (
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#fff9ec] border-2 border-[#161426] shrink-0">
                        <OneNightRoleSvg
                          role={c!.claimedRole}
                          className="w-5 h-5"
                        />
                        <span className="font-black text-xs text-[#161426]">
                          {isAr ? cm.name_ar : cm.name_en}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[11px] font-bold text-slate-400">
                        {isAr ? 'لم يعلن بعد' : 'No claim yet'}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Execution Voting Arena (7 cols) */}
          <div className="lg:col-span-7 bg-[#fff9ec] border-4 border-[#161426] rounded-3xl p-5 shadow-[0_6px_0_#161426] flex flex-col justify-between space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Gavel weight="fill" className="w-6 h-6 text-[#ff595e]" />
                <h3 className="text-lg font-black text-[#161426]">
                  {isAr
                    ? `تصويت الإعدام النهائي (${totalVotes}/${players.length})`
                    : `Final Execution Vote (${totalVotes}/${players.length})`}
                </h3>
              </div>
              <span className="text-xs font-black px-3 py-1 rounded-full bg-[#ff595e]/15 text-[#ff595e] border-2 border-[#ff595e]">
                {isAr
                  ? 'يموت اللاعب صاحب أعلى أصوات (بحد أدنى صوتين)'
                  : 'Player(s) with the most votes (min 2) are executed!'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {players
                .filter((p) => p.id !== activePlayerId)
                .map((suspect, idx) => {
                  const isMyTarget = myVote === suspect.id;
                  const suspectClaim = gameData.claims?.[suspect.id];
                  const suspectClaimMeta = suspectClaim
                    ? ONE_NIGHT_ROLES_META[suspectClaim.claimedRole]
                    : null;

                  return (
                    <button
                      key={suspect.id}
                      type="button"
                      onClick={() => handleCastVote(suspect.id)}
                      className={`p-4 rounded-2xl border-4 border-[#161426] flex items-center justify-between gap-3 text-start transition-all cursor-pointer ${
                        isMyTarget
                          ? 'bg-[#ff595e] text-white shadow-[0_6px_0_#161426] -translate-y-0.5'
                          : 'bg-white text-[#161426] hover:bg-slate-50 shadow-[0_4px_0_#161426]'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-11 h-11 rounded-2xl border-3 border-[#161426] overflow-hidden shrink-0 bg-[#fff9ec]">
                          <CartoonAvatarSvg
                            index={idx}
                            color={suspect.avatar_color}
                          />
                        </div>
                        <div className="truncate">
                          <div className="font-black text-base truncate">
                            {suspect.name}
                          </div>
                          <div
                            className={`text-xs font-bold truncate ${
                              isMyTarget ? 'text-white/90' : 'text-[#161426]/65'
                            }`}
                          >
                            {suspectClaimMeta
                              ? isAr
                                ? `يدّعي: ${suspectClaimMeta.name_ar}`
                                : `Claims: ${suspectClaimMeta.name_en}`
                              : isAr
                              ? 'بدون ادعاء علني'
                              : 'No public claim'}
                          </div>
                        </div>
                      </div>

                      <div
                        className={`px-3 py-1.5 rounded-xl border-2 border-[#161426] font-black text-xs shrink-0 ${
                          isMyTarget
                            ? 'bg-[#ffca3a] text-[#161426]'
                            : 'bg-[#fff9ec] text-[#161426]'
                        }`}
                      >
                        {isMyTarget
                          ? isAr
                            ? 'تم التصويت'
                            : 'Voted'
                          : isAr
                          ? 'إعدام'
                          : 'Vote'}
                      </div>
                    </button>
                  );
                })}

              {/* Center / No Werewolf Among Players Vote Option */}
              <button
                type="button"
                onClick={() => handleCastVote('no_wolf')}
                className={`sm:col-span-2 p-4 rounded-2xl border-4 border-[#161426] flex items-center justify-between gap-3 transition-all cursor-pointer ${
                  myVote === 'no_wolf'
                    ? 'bg-[#8ac926] text-[#161426] shadow-[0_6px_0_#161426] -translate-y-0.5'
                    : 'bg-white text-[#161426] hover:bg-slate-50 shadow-[0_4px_0_#161426]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-[#00bbf9] border-3 border-[#161426] flex items-center justify-center shrink-0">
                    <ShieldCheck weight="fill" className="w-6 h-6 text-[#161426]" />
                  </div>
                  <div className="text-start">
                    <div className="font-black text-sm md:text-base">
                      {isAr
                        ? 'تصويت سلمي: لا يوجد أي مستذئب بين اللاعبين (جميع الذئاب في المنتصف!)'
                        : 'Peaceful Vote: No Werewolves Among Players (All Wolves in Center!)'}
                    </div>
                    <div className="text-xs font-bold opacity-75">
                      {isAr
                        ? 'إذا كانت جميع بطاقات الذئاب في المنتصف ولم يُعدم أحد، تفوز القرية!'
                        : 'If all Werewolves are in the Center and nobody dies, the Village wins!'}
                    </div>
                  </div>
                </div>
                <span className="px-3 py-1.5 rounded-xl bg-[#161426] text-[#ffca3a] font-black text-xs shrink-0">
                  {myVote === 'no_wolf'
                    ? isAr
                      ? 'مختار'
                      : 'Selected'
                    : isAr
                    ? 'تصويت سلمي'
                    : 'Vote Safe'}
                </span>
              </button>
            </div>

            {/* Host Force Reveal button if needed */}
            {(isHost || isPassAndPlay) && totalVotes > 0 && (
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleForceResolveDay}
                  className="px-4 py-2 rounded-xl bg-[#161426] text-[#ffca3a] font-black text-xs border-2 border-[#161426] cursor-pointer hover:bg-[#2a2644]"
                >
                  {isAr
                    ? 'إنهاء التصويت وكشف الحقيقة الآن'
                    : 'End Voting & Reveal Truth Now'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  /* ============================================================================
   * PHASE 3: REVEAL & BEFORE/AFTER ROLE SWAP MAP (كشف الحقيقة وخريطة تبديل الأدوار)
   * ========================================================================== */

  const renderRevealPhase = () => {
    const winningTeams = gameData.winningTeams || [];
    const executedIds = gameData.executedPlayerIds || [];

    const villageWon = winningTeams.includes('village');
    const tannerWon = winningTeams.includes('tanner');
    const wolfWon = winningTeams.includes('werewolf');

    let bannerBg = 'from-[#8ac926] to-[#38b000] text-[#161426]';
    let headlineAr = 'انتصرت القرية وتم القضاء على المستذئب!';
    let headlineEn = 'Village Victory! The Werewolf Was Caught!';

    if (tannerWon && !villageWon) {
      bannerBg = 'from-[#f15bb5] to-[#9b5de5] text-white';
      headlineAr = 'فوز اليائس المخادع! لقد خدعكم لتصوتوا ضده!';
      headlineEn = 'The Tanner Wins! He Tricked the Village Into Executing Him!';
    } else if (tannerWon && villageWon) {
      bannerBg = 'from-[#ffca3a] to-[#8ac926] text-[#161426]';
      headlineAr = 'فوز مشترك للقرية واليائس المخادع!';
      headlineEn = 'Joint Victory for the Village & The Tanner!';
    } else if (wolfWon) {
      bannerBg = 'from-[#ff595e] to-[#9b1d20] text-white';
      headlineAr = 'انتصر قطيع الذئاب ونجا المستذئب من الإعدام!';
      headlineEn = 'Werewolf Pack Victory! The Werewolves Survived!';
    } else if (winningTeams.length === 0) {
      bannerBg = 'from-[#3d355c] to-[#161426] text-white';
      headlineAr = 'خسرت القرية! تم إعدام قروي بريء مع عدم وجود ذئاب!';
      headlineEn = 'Village Defeat! An Innocent Villager Was Executed!';
    }

    return (
      <div className="space-y-6">
        {/* Grand Outcome Banner */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`bg-gradient-to-r ${bannerBg} border-4 border-[#161426] rounded-3xl p-6 shadow-[0_8px_0_#161426] flex flex-col md:flex-row items-center justify-between gap-4`}
        >
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-3xl bg-[#fff9ec] border-4 border-[#161426] flex items-center justify-center shadow-[0_4px_0_#161426] shrink-0">
              <Trophy weight="fill" className="w-9 h-9 text-[#ff924c]" />
            </div>
            <div>
              <span className="inline-block px-3 py-0.5 rounded-full bg-[#161426] text-[#ffca3a] font-black text-xs mb-1">
                {isAr
                  ? 'المرحلة 3: كشف الحقيقة وتبديلات الليل'
                  : 'Phase 3: Final Role Reveal & Swap Map'}
              </span>
              <h2 className="text-2xl md:text-3xl font-black">
                {isAr ? headlineAr : headlineEn}
              </h2>
            </div>
          </div>

          {(isHost || isPassAndPlay) && (
            <button
              type="button"
              onClick={onStartNewRound}
              className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-[#ffca3a] hover:bg-[#ffd65c] text-[#161426] border-4 border-[#161426] font-black text-base shadow-[0_5px_0_#161426] active:translate-y-1 transition-all cursor-pointer shrink-0"
            >
              <ArrowsClockwise weight="bold" className="w-5 h-5" />
              <span>{isAr ? 'ليلة جديدة' : 'Play Next Night'}</span>
            </button>
          )}
        </motion.div>

        {/* Night Swap Timeline (Before & After Chronological Log) */}
        <div className="bg-[#fff9ec] border-4 border-[#161426] rounded-3xl p-5 shadow-[0_6px_0_#161426] space-y-3">
          <div className="flex items-center gap-2">
            <ArrowsLeftRight
              weight="bold"
              className="w-6 h-6 text-[#9b5de5]"
            />
            <h3 className="text-lg font-black text-[#161426]">
              {isAr
                ? 'سجل تبديل البطاقات أثناء الليل (ماذا حدث بالظلام؟)'
                : 'Night Card Swap Timeline (What Happened in the Dark?)'}
            </h3>
          </div>

          {(!gameData.swapHistory || gameData.swapHistory.length === 0) ? (
            <p className="text-sm font-bold text-[#161426]/70 bg-white border-2 border-[#161426] rounded-2xl p-3.5">
              {isAr
                ? 'لم يحدث أي تبديل للبطاقات في هذه الليلة (كان اللص والمشاغب في بطاقات المنتصف!).'
                : 'No card swaps occurred tonight (Robber and Troublemaker were in the Center!).'}
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {gameData.swapHistory.map((step, i) => {
                const actorMeta = ONE_NIGHT_ROLES_META[step.role];
                const beforeFromMeta =
                  ONE_NIGHT_ROLES_META[step.roleBeforeFrom];
                const beforeToMeta = ONE_NIGHT_ROLES_META[step.roleBeforeTo];
                return (
                  <div
                    key={i}
                    className="bg-white border-3 border-[#161426] rounded-2xl p-4 shadow-[0_4px_0_#161426] flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <OneNightRoleSvg role={step.role} className="w-12 h-12" />
                      <div>
                        <span className="text-xs font-black text-[#9b5de5]">
                          {isAr
                            ? `الخطوة #${i + 1}: ${actorMeta.name_ar} (${step.actorName})`
                            : `Step #${i + 1}: ${actorMeta.name_en} (${step.actorName})`}
                        </span>
                        <p className="font-black text-sm text-[#161426]">
                          {isAr
                            ? `بدّل بطاقة (${step.fromName}: ${beforeFromMeta.name_ar}) ⇄ (${step.toName}: ${beforeToMeta.name_ar})`
                            : `Swapped (${step.fromName}: ${beforeFromMeta.name_en}) ⇄ (${step.toName}: ${beforeToMeta.name_en})`}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Before & After Player Role Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {players.map((p, idx) => {
            const initRole = gameData.initialRoles?.[p.id] || 'villager';
            const finalRole = gameData.currentRoles?.[p.id] || initRole;
            const initMeta = ONE_NIGHT_ROLES_META[initRole];
            const finalMeta = ONE_NIGHT_ROLES_META[finalRole];
            const wasSwapped = initRole !== finalRole;
            const wasExecuted = executedIds.includes(p.id);
            const isWinner = (gameData.winnerPlayerIds || []).includes(p.id);

            const votesReceived = Object.values(gameData.votes || {}).filter(
              (v) => v === p.id
            ).length;
            const votedForId = gameData.votes?.[p.id];
            const votedForName =
              votedForId === 'no_wolf'
                ? isAr
                  ? 'لا يوجد ذئب (سلمي)'
                  : 'No Wolf (Safe)'
                : players.find((other) => other.id === votedForId)?.name || '—';

            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.06 }}
                className={`bg-[#fff9ec] border-4 border-[#161426] rounded-3xl p-4 shadow-[0_6px_0_#161426] flex flex-col justify-between space-y-3 relative ${
                  isWinner ? 'ring-4 ring-[#8ac926]' : ''
                }`}
              >
                {/* Player Header */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl border-3 border-[#161426] overflow-hidden bg-white">
                      <CartoonAvatarSvg index={idx} color={p.avatar_color} />
                    </div>
                    <div>
                      <div className="font-black text-base text-[#161426]">
                        {p.name}
                      </div>
                      <div className="text-xs font-bold text-[#161426]/65">
                        {isAr
                          ? `صوّت ضد: ${votedForName}`
                          : `Voted: ${votedForName}`}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    {wasExecuted && (
                      <span className="px-2.5 py-0.5 rounded-full bg-[#ff595e] text-white border-2 border-[#161426] font-black text-xs">
                        {isAr ? 'تم إعدامه!' : 'Executed!'}
                      </span>
                    )}
                    {isWinner && (
                      <span className="px-2.5 py-0.5 rounded-full bg-[#8ac926] text-[#161426] border-2 border-[#161426] font-black text-xs">
                        {isAr ? 'فائز!' : 'Winner!'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Before -> After Visual Role Transformation */}
                <div className="bg-white border-3 border-[#161426] rounded-2xl p-3 flex items-center justify-between gap-2">
                  {/* Initial Role */}
                  <div className="flex flex-col items-center text-center flex-1">
                    <span className="text-[10px] font-black text-slate-500 uppercase">
                      {isAr ? 'أول الليل' : 'Initial'}
                    </span>
                    <OneNightRoleSvg role={initRole} className="w-12 h-12 my-1" />
                    <span className="font-black text-xs text-[#161426]">
                      {isAr ? initMeta.name_ar : initMeta.name_en}
                    </span>
                  </div>

                  {/* Swap Indicator Arrow */}
                  <div className="flex flex-col items-center">
                    <ArrowsLeftRight
                      weight="bold"
                      className={`w-6 h-6 ${
                        wasSwapped ? 'text-[#ff595e]' : 'text-slate-300'
                      }`}
                    />
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                        wasSwapped
                          ? 'bg-[#ffca3a] text-[#161426] border border-[#161426]'
                          : 'text-slate-400'
                      }`}
                    >
                      {wasSwapped
                        ? isAr
                          ? 'تبدّل!'
                          : 'Swapped!'
                        : isAr
                        ? 'ثابت'
                        : 'Same'}
                    </span>
                  </div>

                  {/* Final Role */}
                  <div className="flex flex-col items-center text-center flex-1">
                    <span className="text-[10px] font-black text-[#9b5de5] uppercase">
                      {isAr ? 'الدور النهائي' : 'Final Role'}
                    </span>
                    <OneNightRoleSvg
                      role={finalRole}
                      className="w-12 h-12 my-1"
                    />
                    <span className="font-black text-xs text-[#161426]">
                      {isAr ? finalMeta.name_ar : finalMeta.name_en}
                    </span>
                  </div>
                </div>

                {/* Vote Count Footer */}
                <div className="flex items-center justify-between text-xs font-black px-1">
                  <span className={`px-2.5 py-0.5 rounded-lg border border-[#161426] ${finalMeta.badgeBg}`}>
                    {isAr ? finalMeta.team_ar : finalMeta.team_en}
                  </span>
                  <span className="text-[#161426]">
                    {isAr
                      ? `الأصوات ضده: ${votesReceived}`
                      : `Votes Against: ${votesReceived}`}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* The 3 Center Cards Reveal */}
        <div className="bg-[#161426] text-white border-4 border-[#161426] rounded-3xl p-5 shadow-[0_6px_0_#161426] space-y-3">
          <div className="flex items-center gap-2">
            <MagnifyingGlass
              weight="bold"
              className="w-6 h-6 text-[#ffca3a]"
            />
            <h3 className="text-lg font-black text-[#fff9ec]">
              {isAr
                ? 'بطاقات المنتصف الثلاث (التي لم يأخذها أحد):'
                : 'The 3 Unclaimed Center Cards:'}
            </h3>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {(gameData.centerRoles || ['villager', 'seer', 'werewolf']).map(
              (cRole, idx) => {
                const cm = ONE_NIGHT_ROLES_META[cRole];
                return (
                  <div
                    key={idx}
                    className="bg-[#252042] border-3 border-[#fff9ec]/30 rounded-2xl p-4 flex flex-col items-center text-center gap-1.5"
                  >
                    <span className="text-xs font-black text-[#ffca3a]">
                      {isAr ? `منتصف #${idx + 1}` : `Center #${idx + 1}`}
                    </span>
                    <OneNightRoleSvg role={cRole} className="w-14 h-14" />
                    <span className="font-black text-sm text-white">
                      {isAr ? cm.name_ar : cm.name_en}
                    </span>
                  </div>
                );
              }
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      className="w-full max-w-5xl mx-auto select-none"
      dir={isAr ? 'rtl' : 'ltr'}
    >
      {gameData.phase === 'night' && renderNightPhase()}
      {gameData.phase === 'day_debate' && renderDayDebatePhase()}
      {gameData.phase === 'reveal' && renderRevealPhase()}
    </div>
  );
};

export default OneNightGame;
