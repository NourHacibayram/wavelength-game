import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import {
  Crosshair,
  ShieldCheck,
  ShieldWarning,
  Trophy,
  ArrowsClockwise,
  Eye,
  EyeSlash,
  CheckCircle,
  Lightning,
  Sparkle,
  WarningOctagon,
  Play,
  Users,
  Crown,
  LockKey,
  ArrowRight,
  FirstAidKit,
} from '@phosphor-icons/react';
import { CartoonAvatarSvg } from './CartoonIcons';

/* ============================================================================
 * TYPES & INTERFACES
 * ========================================================================== */

export type BulletType = 'click' | 'bang';

export type LootCardType = 'cash_10' | 'cash_20' | 'diamond' | 'painting' | 'medkit';

export interface LootCardItem {
  id: string;
  type: LootCardType;
  value: number;
  healsWound?: boolean;
  titleAr: string;
  titleEn: string;
  subtitleAr: string;
  subtitleEn: string;
}

export type StandoffDecision = 'stay' | 'duck';

export interface CashNGunsPlayerState {
  playerId: string;
  wounds: number;
  maxWounds: number;
  eliminated: boolean;
  cash: number;
  diamonds: number;
  paintings: number;
  medkitsUsed: number;
  ammoRemaining: BulletType[];
  selectedBullet: BulletType | null;
  selectedTargetId: string | null;
  lockedAim: boolean;
  standoffChoice: StandoffDecision | null;
  lockedStandoff: boolean;
  collectedItems: LootCardItem[];
}

export interface ShootoutActionLog {
  shooterId: string;
  targetId: string;
  bullet: BulletType;
  shooterDucked: boolean;
  targetDucked: boolean;
  causedWound: boolean;
}

export interface LootSplitLog {
  playerId: string;
  item: LootCardItem;
  healedWound: boolean;
}

export interface RoundResolutionSummary {
  roundNumber: number;
  actions: ShootoutActionLog[];
  woundedPlayerIds: string[];
  knockedOutPlayerIds: string[];
  lootWinners: string[];
  lootSplits: LootSplitLog[];
  unclaimedLoot: LootCardItem[];
}

export interface DiamondBonusWinner {
  playerIds: string[];
  diamondCount: number;
  bonusPerWinner: number;
}

export interface CashNGunsGameState {
  phase: 'load_and_aim' | 'standoff' | 'shootout_reveal' | 'game_over';
  round: number;
  totalRounds: number;
  roundLoot: LootCardItem[];
  playerStates: Record<string, CashNGunsPlayerState>;
  passAndPlayCursor: number;
  lastResolution: RoundResolutionSummary | null;
  diamondBonus: DiamondBonusWinner | null;
  winnerIds: string[];
}

export interface CashNGunsPlayerInfo {
  id: string;
  name: string;
  avatar_color: string;
  score: number;
}

export interface CashNGunsGameProps {
  gameData: CashNGunsGameState;
  players: CashNGunsPlayerInfo[];
  myPlayerId: string;
  isHost: boolean;
  isPassAndPlay: boolean;
  lang: 'ar' | 'en';
  onUpdateGameData: (
    nextData: CashNGunsGameState,
    scoreAwards?: Record<string, number>
  ) => void;
  onStartNewRound: () => void;
}

/* ============================================================================
 * LOOT GENERATOR & INITIAL STATE BUILDER
 * ========================================================================== */

const LOOT_POOL_TEMPLATES: Omit<LootCardItem, 'id'>[] = [
  {
    type: 'cash_10',
    value: 10000,
    titleAr: 'رزمة كاش 10,000$',
    titleEn: '$10,000 Cash Stack',
    subtitleAr: 'أوراق نقدية جاهزة للتهريب',
    subtitleEn: 'Crisp unmarked bills',
  },
  {
    type: 'cash_20',
    value: 20000,
    titleAr: 'حقيبة ذهب وكاش 20,000$',
    titleEn: '$20,000 Heist Briefcase',
    subtitleAr: 'حقيبة دبلوماسية مليئة بالدولارات',
    subtitleEn: 'Heavy armored briefcase',
  },
  {
    type: 'diamond',
    value: 25000,
    titleAr: 'ألماسة ملكية 25,000$',
    titleEn: '$25,000 Royal Diamond',
    subtitleAr: '+30,000$ مكافأة لأكثر جامع ألماس!',
    subtitleEn: '+$30k Endgame Bonus for Most Diamonds!',
  },
  {
    type: 'painting',
    value: 18000,
    titleAr: 'لوحة أثرية نادرة 18,000$',
    titleEn: '$18,000 Masterpiece Art',
    subtitleAr: 'تحفة مسروقة من المعرض الملكي',
    subtitleEn: 'Priceless gallery heist piece',
  },
  {
    type: 'medkit',
    value: 5000,
    healsWound: true,
    titleAr: 'حقيبة إسعاف + 5,000$',
    titleEn: 'Medkit + $5,000 Cash',
    subtitleAr: 'تعالج إصابة واحدة فوراً وتمنحك 5,000$',
    subtitleEn: 'Heals 1 Wound immediately + $5k',
  },
];

function generateRoundLoot(roundNum: number): LootCardItem[] {
  const weights: LootCardType[] =
    roundNum === 1
      ? ['cash_10', 'cash_20', 'diamond', 'painting', 'cash_10', 'diamond']
      : ['cash_10', 'cash_20', 'diamond', 'painting', 'medkit', 'cash_20', 'diamond'];

  const items: LootCardItem[] = [];
  for (let i = 0; i < 4; i++) {
    const pickedType = weights[Math.floor(Math.random() * weights.length)];
    const tpl =
      LOOT_POOL_TEMPLATES.find((t) => t.type === pickedType) || LOOT_POOL_TEMPLATES[0];
    items.push({
      ...tpl,
      id: `loot-r${roundNum}-${i}-${Math.random().toString(36).slice(2, 7)}`,
    });
  }

  // Sort highest value first so loot distribution is exciting and clear
  return items.sort((a, b) => b.value - a.value);
}

export function buildInitialCashNGunsState(
  players: { id: string; name: string; avatar_color?: string; score?: number }[]
): CashNGunsGameState {
  const safePlayers =
    players.length >= 2
      ? players
      : [
          ...players,
          {
            id: 'bot-gangster-1',
            name: 'الدون كابوني',
            avatar_color: '#ff595e',
            score: 0,
          },
        ];

  const playerStates: Record<string, CashNGunsPlayerState> = {};

  safePlayers.forEach((p) => {
    // 3 Blanks ('click') + 2 Live Foam Darts ('bang') for 5 intense rounds
    playerStates[p.id] = {
      playerId: p.id,
      wounds: 0,
      maxWounds: 3,
      eliminated: false,
      cash: 0,
      diamonds: 0,
      paintings: 0,
      medkitsUsed: 0,
      ammoRemaining: ['click', 'click', 'click', 'bang', 'bang'],
      selectedBullet: null,
      selectedTargetId: null,
      lockedAim: false,
      standoffChoice: null,
      lockedStandoff: false,
      collectedItems: [],
    };
  });

  return {
    phase: 'load_and_aim',
    round: 1,
    totalRounds: 5,
    roundLoot: generateRoundLoot(1),
    playerStates,
    passAndPlayCursor: 0,
    lastResolution: null,
    diamondBonus: null,
    winnerIds: [],
  };
}

/* ============================================================================
 * CUSTOM CARTOON SVGS (ZERO EMOJIS — VIBRANT NEO-BRUTALIST VECTOR ART)
 * ========================================================================== */

export const CartoonBlasterSvg: React.FC<{
  className?: string;
  color?: string;
  firing?: 'none' | 'click' | 'bang';
  flipped?: boolean;
}> = ({ className = 'w-16 h-16', color = '#ff924c', firing = 'none', flipped = false }) => (
  <svg
    viewBox="0 0 120 80"
    className={`${className} select-none overflow-visible`}
    style={{ transform: flipped ? 'scaleX(-1)' : undefined }}
    aria-label="Cartoon Foam Blaster"
  >
    {/* Grip */}
    <path
      d="M 22 44 L 12 72 Q 10 76 16 76 L 32 76 Q 36 76 37 70 L 42 46 Z"
      fill="#64748b"
      stroke="#161426"
      strokeWidth="4.5"
      strokeLinejoin="round"
    />
    {/* Grip ridges */}
    <line x1="18" y1="56" x2="36" y2="56" stroke="#161426" strokeWidth="3.5" strokeLinecap="round" />
    <line x1="16" y1="65" x2="34" y2="65" stroke="#161426" strokeWidth="3.5" strokeLinecap="round" />

    {/* Trigger Guard & Trigger */}
    <path
      d="M 38 46 Q 48 62 56 46"
      fill="none"
      stroke="#161426"
      strokeWidth="4"
      strokeLinecap="round"
    />
    <path
      d="M 44 46 Q 43 54 48 55"
      fill="none"
      stroke="#ff595e"
      strokeWidth="4"
      strokeLinecap="round"
    />

    {/* Main Blaster Body */}
    <rect
      x="16"
      y="20"
      width="68"
      height="28"
      rx="9"
      fill={color}
      stroke="#161426"
      strokeWidth="4.5"
    />
    {/* Top Sight Rail */}
    <rect
      x="24"
      y="13"
      width="42"
      height="7"
      rx="3"
      fill="#ffca3a"
      stroke="#161426"
      strokeWidth="3.5"
    />
    {/* Side Cylinder / Drum detail */}
    <rect
      x="34"
      y="25"
      width="28"
      height="16"
      rx="5"
      fill="#161426"
    />
    <circle cx="42" cy="33" r="4" fill="#00bbf9" />
    <circle cx="54" cy="33" r="4" fill="#ffca3a" />

    {/* Orange Toy Foam Muzzle */}
    <rect
      x="82"
      y="24"
      width="14"
      height="20"
      rx="4"
      fill="#ff595e"
      stroke="#161426"
      strokeWidth="4.5"
    />

    {/* Firing Effect: BANG */}
    {firing === 'bang' && (
      <g>
        <polygon
          points="98,34 114,16 110,30 126,26 114,38 126,48 108,44 112,56"
          fill="#ffca3a"
          stroke="#161426"
          strokeWidth="3.5"
          strokeLinejoin="round"
        />
        <circle cx="106" cy="34" r="5" fill="#ff595e" />
      </g>
    )}

    {/* Firing Effect: CLICK Flag */}
    {firing === 'click' && (
      <g>
        <line x1="96" y1="34" x2="116" y2="34" stroke="#161426" strokeWidth="4" strokeLinecap="round" />
        <rect
          x="100"
          y="34"
          width="20"
          height="16"
          rx="3"
          fill="#ffffff"
          stroke="#161426"
          strokeWidth="3"
        />
        <circle cx="110" cy="42" r="3.5" fill="#00bbf9" />
      </g>
    )}
  </svg>
);

export const BulletCardSvg: React.FC<{
  type: BulletType;
  className?: string;
}> = ({ type, className = 'w-14 h-14' }) => {
  if (type === 'bang') {
    return (
      <svg viewBox="0 0 80 80" className={`${className} select-none`} aria-label="Live Foam Dart">
        {/* Comic explosion backdrop */}
        <polygon
          points="40,4 50,20 68,12 60,30 76,40 60,50 68,68 50,60 40,76 30,60 12,68 20,50 4,40 20,30 12,12 30,20"
          fill="#ffca3a"
          stroke="#161426"
          strokeWidth="4"
          strokeLinejoin="round"
        />
        {/* Foam Dart */}
        <g transform="rotate(-30 40 40)">
          <rect
            x="28"
            y="24"
            width="24"
            height="36"
            rx="5"
            fill="#ff595e"
            stroke="#161426"
            strokeWidth="4"
          />
          <path
            d="M 28 26 Q 40 8 52 26 Z"
            fill="#00bbf9"
            stroke="#161426"
            strokeWidth="4"
            strokeLinejoin="round"
          />
          <line x1="34" y1="36" x2="34" y2="52" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
        </g>
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 80 80" className={`${className} select-none`} aria-label="Blank Click Flag">
      <circle
        cx="40"
        cy="40"
        r="32"
        fill="#e2e8f0"
        stroke="#161426"
        strokeWidth="4.5"
      />
      {/* Toy Flag on stick */}
      <line x1="22" y1="58" x2="28" y2="18" stroke="#161426" strokeWidth="5" strokeLinecap="round" />
      <path
        d="M 27 20 L 62 24 L 54 36 L 62 46 L 24 44 Z"
        fill="#ffffff"
        stroke="#161426"
        strokeWidth="4"
        strokeLinejoin="round"
      />
      <circle cx="42" cy="33" r="5" fill="#00bbf9" stroke="#161426" strokeWidth="2.5" />
    </svg>
  );
};

export const LootVaultItemSvg: React.FC<{
  type: LootCardType;
  className?: string;
}> = ({ type, className = 'w-16 h-16' }) => {
  switch (type) {
    case 'diamond':
      return (
        <svg viewBox="0 0 80 80" className={`${className} select-none`} aria-label="Royal Diamond">
          <polygon
            points="22,16 58,16 72,34 40,70 8,34"
            fill="#00bbf9"
            stroke="#161426"
            strokeWidth="4.5"
            strokeLinejoin="round"
          />
          <polyline
            points="8,34 72,34"
            fill="none"
            stroke="#161426"
            strokeWidth="4"
          />
          <polyline
            points="22,16 30,34 40,70 50,34 58,16"
            fill="none"
            stroke="#161426"
            strokeWidth="3.5"
            strokeLinejoin="round"
          />
          <polygon points="30,34 40,18 50,34" fill="#7dd3fc" />
        </svg>
      );

    case 'painting':
      return (
        <svg viewBox="0 0 80 80" className={`${className} select-none`} aria-label="Masterpiece Painting">
          <rect
            x="10"
            y="14"
            width="60"
            height="52"
            rx="6"
            fill="#ffca3a"
            stroke="#161426"
            strokeWidth="4.5"
          />
          <rect
            x="18"
            y="22"
            width="44"
            height="36"
            rx="3"
            fill="#a855f7"
            stroke="#161426"
            strokeWidth="3.5"
          />
          <circle cx="30" cy="32" r="5" fill="#ffca3a" />
          <polygon
            points="20,56 34,38 46,50 54,42 60,56"
            fill="#8ac926"
            stroke="#161426"
            strokeWidth="3"
            strokeLinejoin="round"
          />
        </svg>
      );

    case 'medkit':
      return (
        <svg viewBox="0 0 80 80" className={`${className} select-none`} aria-label="First Aid Medkit">
          <path
            d="M 28 20 L 28 13 Q 28 9 33 9 L 47 9 Q 52 9 52 13 L 52 20"
            fill="none"
            stroke="#161426"
            strokeWidth="4.5"
          />
          <rect
            x="12"
            y="20"
            width="56"
            height="46"
            rx="9"
            fill="#ffffff"
            stroke="#161426"
            strokeWidth="4.5"
          />
          <rect x="35" y="29" width="10" height="28" rx="2" fill="#ff595e" stroke="#161426" strokeWidth="3" />
          <rect x="26" y="38" width="28" height="10" rx="2" fill="#ff595e" stroke="#161426" strokeWidth="3" />
        </svg>
      );

    case 'cash_20':
      return (
        <svg viewBox="0 0 80 80" className={`${className} select-none`} aria-label="Cash Briefcase">
          <path
            d="M 28 22 L 28 14 Q 28 10 33 10 L 47 10 Q 52 10 52 14 L 52 22"
            fill="none"
            stroke="#161426"
            strokeWidth="4.5"
          />
          <rect
            x="10"
            y="22"
            width="60"
            height="44"
            rx="8"
            fill="#ffca3a"
            stroke="#161426"
            strokeWidth="4.5"
          />
          <rect
            x="22"
            y="30"
            width="36"
            height="28"
            rx="5"
            fill="#8ac926"
            stroke="#161426"
            strokeWidth="3.5"
          />
          <circle cx="40" cy="44" r="7" fill="#ffca3a" stroke="#161426" strokeWidth="3" />
        </svg>
      );

    case 'cash_10':
    default:
      return (
        <svg viewBox="0 0 80 80" className={`${className} select-none`} aria-label="Cash Stack">
          <rect
            x="14"
            y="28"
            width="54"
            height="34"
            rx="6"
            fill="#15803d"
            stroke="#161426"
            strokeWidth="4.5"
          />
          <rect
            x="10"
            y="20"
            width="54"
            height="34"
            rx="6"
            fill="#8ac926"
            stroke="#161426"
            strokeWidth="4.5"
          />
          <rect
            x="31"
            y="20"
            width="12"
            height="34"
            fill="#ffca3a"
            stroke="#161426"
            strokeWidth="3.5"
          />
          <circle cx="22" cy="37" r="4" fill="#15803d" />
          <circle cx="52" cy="37" r="4" fill="#15803d" />
        </svg>
      );
  }
};

export const ShieldDuckSvg: React.FC<{
  mode: 'stay' | 'duck';
  className?: string;
}> = ({ mode, className = 'w-14 h-14' }) => {
  if (mode === 'stay') {
    return (
      <svg viewBox="0 0 80 80" className={`${className} select-none`} aria-label="Hold Your Ground">
        <polygon
          points="40,8 70,22 62,56 40,72 18,56 10,22"
          fill="#ff595e"
          stroke="#161426"
          strokeWidth="4.5"
          strokeLinejoin="round"
        />
        <circle cx="40" cy="40" r="14" fill="#ffca3a" stroke="#161426" strokeWidth="4" />
        <circle cx="40" cy="40" r="5" fill="#161426" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 80 80" className={`${className} select-none`} aria-label="Duck for Cover">
      <path
        d="M 40 8 L 68 20 L 68 42 C 68 58 40 72 40 72 C 40 72 12 58 12 42 L 12 20 Z"
        fill="#00bbf9"
        stroke="#161426"
        strokeWidth="4.5"
        strokeLinejoin="round"
      />
      <path
        d="M 28 40 L 36 48 L 52 32"
        fill="none"
        stroke="#ffffff"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

/* ============================================================================
 * HELPER FUNCTIONS
 * ========================================================================== */

function formatMoney(amount: number): string {
  return `$${amount.toLocaleString('en-US')}`;
}

function getLootBadgeColor(type: LootCardType): string {
  switch (type) {
    case 'diamond':
      return 'bg-[#00bbf9] text-[#161426]';
    case 'cash_20':
      return 'bg-[#ffca3a] text-[#161426]';
    case 'painting':
      return 'bg-[#a855f7] text-white';
    case 'medkit':
      return 'bg-[#ff595e] text-white';
    case 'cash_10':
    default:
      return 'bg-[#8ac926] text-[#161426]';
  }
}

/* ============================================================================
 * MAIN COMPONENT: CashNGunsGame
 * ========================================================================== */

export const CashNGunsGame: React.FC<CashNGunsGameProps> = ({
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

  // Local selection state before locking in Phase 1
  const [localBullet, setLocalBullet] = useState<BulletType | null>(null);
  const [localTargetId, setLocalTargetId] = useState<string | null>(null);
  const [passAndPlayRevealed, setPassAndPlayRevealed] = useState<boolean>(false);

  // Ordered players list synced with gameData.playerStates
  const activePlayers = useMemo(() => {
    const stateIds = Object.keys(gameData.playerStates || {});
    if (players.length > 0) {
      return players.filter((p) => stateIds.includes(p.id));
    }
    return stateIds.map((id, idx) => ({
      id,
      name: `Player ${idx + 1}`,
      avatar_color: '#ffca3a',
      score: 0,
    }));
  }, [players, gameData.playerStates]);

  const survivingPlayers = useMemo(
    () =>
      activePlayers.filter((p) => {
        const st = gameData.playerStates[p.id];
        return st && !st.eliminated;
      }),
    [activePlayers, gameData.playerStates]
  );

  // Determine who the active controller is right now
  const currentActorId = useMemo(() => {
    if (!isPassAndPlay) {
      return myPlayerId;
    }
    if (gameData.phase === 'load_and_aim') {
      const unlocked = survivingPlayers.find(
        (p) => !gameData.playerStates[p.id]?.lockedAim
      );
      return unlocked ? unlocked.id : survivingPlayers[0]?.id || myPlayerId;
    }
    if (gameData.phase === 'standoff') {
      const unlocked = survivingPlayers.find(
        (p) => !gameData.playerStates[p.id]?.lockedStandoff
      );
      return unlocked ? unlocked.id : survivingPlayers[0]?.id || myPlayerId;
    }
    return myPlayerId;
  }, [isPassAndPlay, myPlayerId, gameData.phase, gameData.playerStates, survivingPlayers]);

  const currentActorInfo = useMemo(
    () => activePlayers.find((p) => p.id === currentActorId) || activePlayers[0],
    [activePlayers, currentActorId]
  );

  const currentActorState = gameData.playerStates[currentActorId];

  const getPlayerName = (pid: string) =>
    activePlayers.find((p) => p.id === pid)?.name || (isAr ? 'فرد عصابة' : 'Gangster');

  const getPlayerIndex = (pid: string) =>
    Math.max(
      0,
      activePlayers.findIndex((p) => p.id === pid)
    );

  const getPlayerColor = (pid: string) =>
    activePlayers.find((p) => p.id === pid)?.avatar_color || '#ffca3a';

  // Count remaining clicks and bangs for the active player
  const ammoCounts = useMemo(() => {
    const ammo = currentActorState?.ammoRemaining || [];
    return {
      click: ammo.filter((b) => b === 'click').length,
      bang: ammo.filter((b) => b === 'bang').length,
    };
  }, [currentActorState]);

  // Map who is aiming at whom during Phase 2 ('standoff') and Phase 3 ('shootout_reveal')
  const incomingAimersByTarget = useMemo(() => {
    const map: Record<string, string[]> = {};
    activePlayers.forEach((p) => {
      map[p.id] = [];
    });
    survivingPlayers.forEach((shooter) => {
      const st = gameData.playerStates[shooter.id];
      if (st?.selectedTargetId && map[st.selectedTargetId]) {
        map[st.selectedTargetId].push(shooter.id);
      }
    });
    return map;
  }, [activePlayers, survivingPlayers, gameData.playerStates]);

  /* ==========================================================================
   * PHASE 1 ACTIONS: LOCK AIM & BULLET
   * ======================================================================== */

  const checkAllAimLocked = (states: Record<string, CashNGunsPlayerState>) => {
    return survivingPlayers.every((p) => states[p.id]?.lockedAim);
  };

  const handleLockLoadAndAim = () => {
    if (!currentActorState || currentActorState.eliminated) return;

    const chosenBullet: BulletType =
      localBullet && currentActorState.ammoRemaining.includes(localBullet)
        ? localBullet
        : currentActorState.ammoRemaining[0] || 'click';

    const validOpponents = survivingPlayers.filter((p) => p.id !== currentActorId);
    const chosenTargetId =
      localTargetId && validOpponents.some((o) => o.id === localTargetId)
        ? localTargetId
        : validOpponents[0]?.id || currentActorId;

    const nextStates: Record<string, CashNGunsPlayerState> = {
      ...gameData.playerStates,
      [currentActorId]: {
        ...currentActorState,
        selectedBullet: chosenBullet,
        selectedTargetId: chosenTargetId,
        lockedAim: true,
      },
    };

    // If any bot players exist, auto-lock them simultaneously
    survivingPlayers.forEach((p) => {
      if (p.id.startsWith('bot-') && !nextStates[p.id].lockedAim) {
        const botState = nextStates[p.id];
        const botBullet =
          botState.ammoRemaining[
            Math.floor(Math.random() * botState.ammoRemaining.length)
          ] || 'click';
        const botTargets = survivingPlayers.filter((t) => t.id !== p.id);
        const botTarget =
          botTargets[Math.floor(Math.random() * botTargets.length)]?.id || p.id;
        nextStates[p.id] = {
          ...botState,
          selectedBullet: botBullet,
          selectedTargetId: botTarget,
          lockedAim: true,
        };
      }
    });

    const everyoneLocked = checkAllAimLocked(nextStates);

    setLocalBullet(null);
    setLocalTargetId(null);
    setPassAndPlayRevealed(false);

    onUpdateGameData({
      ...gameData,
      playerStates: nextStates,
      phase: everyoneLocked ? 'standoff' : 'load_and_aim',
    });
  };

  // Host helper in Online mode to auto-lock any remaining undecided players
  const handleHostAutoLockAim = () => {
    const nextStates: Record<string, CashNGunsPlayerState> = {
      ...gameData.playerStates,
    };

    survivingPlayers.forEach((p) => {
      const st = nextStates[p.id];
      if (st && !st.lockedAim) {
        const randomBullet =
          st.ammoRemaining[Math.floor(Math.random() * st.ammoRemaining.length)] ||
          'click';
        const validTargets = survivingPlayers.filter((t) => t.id !== p.id);
        const randomTarget =
          validTargets[Math.floor(Math.random() * validTargets.length)]?.id || p.id;
        nextStates[p.id] = {
          ...st,
          selectedBullet: randomBullet,
          selectedTargetId: randomTarget,
          lockedAim: true,
        };
      }
    });

    onUpdateGameData({
      ...gameData,
      playerStates: nextStates,
      phase: 'standoff',
    });
  };

  /* ==========================================================================
   * PHASE 2 ACTIONS: STANDOFF DECISION ('stay' vs 'duck') & SHOOTOUT RESOLVER
   * ======================================================================== */

  const resolveShootoutAndLoot = (
    statesWithChoices: Record<string, CashNGunsPlayerState>
  ) => {
    const nextStates: Record<string, CashNGunsPlayerState> = {};
    Object.keys(statesWithChoices).forEach((pid) => {
      nextStates[pid] = {
        ...statesWithChoices[pid],
        ammoRemaining: [...statesWithChoices[pid].ammoRemaining],
        collectedItems: [...statesWithChoices[pid].collectedItems],
      };
    });

    // 1. Consume the loaded bullet from every surviving player's magazine
    survivingPlayers.forEach((p) => {
      const st = nextStates[p.id];
      if (!st || !st.selectedBullet) return;
      const idx = st.ammoRemaining.indexOf(st.selectedBullet);
      if (idx !== -1) {
        st.ammoRemaining.splice(idx, 1);
      } else if (st.ammoRemaining.length > 0) {
        st.ammoRemaining.shift();
      }
    });

    // 2. Evaluate all shots fired this round
    const actions: ShootoutActionLog[] = [];
    const woundedSet = new Set<string>();
    const knockedOutSet = new Set<string>();

    survivingPlayers.forEach((shooter) => {
      const shooterSt = nextStates[shooter.id];
      const targetId = shooterSt?.selectedTargetId;
      const bullet: BulletType = shooterSt?.selectedBullet || 'click';
      if (!targetId || !nextStates[targetId]) return;

      const targetSt = nextStates[targetId];
      const shooterDucked = shooterSt.standoffChoice === 'duck';
      const targetDucked = targetSt.standoffChoice === 'duck';

      // A shot hits if the shooter stayed, the target stayed, and the bullet is 'bang'
      const causedWound = !shooterDucked && !targetDucked && bullet === 'bang';

      if (causedWound) {
        targetSt.wounds = Math.min(targetSt.maxWounds, targetSt.wounds + 1);
        woundedSet.add(targetId);
        if (targetSt.wounds >= targetSt.maxWounds) {
          targetSt.eliminated = true;
          knockedOutSet.add(targetId);
        }
      }

      actions.push({
        shooterId: shooter.id,
        targetId,
        bullet,
        shooterDucked,
        targetDucked,
        causedWound,
      });
    });

    // 3. Determine who splits the Vault Loot:
    // Surviving players who chose 'stay' AND did NOT take a wound this round!
    const lootWinners = survivingPlayers
      .map((p) => p.id)
      .filter((pid) => {
        const st = nextStates[pid];
        return (
          st &&
          !st.eliminated &&
          st.standoffChoice === 'stay' &&
          !woundedSet.has(pid)
        );
      });

    const lootSplits: LootSplitLog[] = [];
    const unclaimedLoot: LootCardItem[] = [];

    if (lootWinners.length > 0) {
      gameData.roundLoot.forEach((item, index) => {
        const recipientId = lootWinners[index % lootWinners.length];
        const recipientSt = nextStates[recipientId];
        recipientSt.cash += item.value;
        recipientSt.collectedItems.push(item);

        if (item.type === 'diamond') {
          recipientSt.diamonds += 1;
        } else if (item.type === 'painting') {
          recipientSt.paintings += 1;
        }

        let healedWound = false;
        if (item.type === 'medkit' && recipientSt.wounds > 0) {
          recipientSt.wounds = Math.max(0, recipientSt.wounds - 1);
          recipientSt.medkitsUsed += 1;
          healedWound = true;
        }

        lootSplits.push({
          playerId: recipientId,
          item,
          healedWound,
        });
      });
    } else {
      unclaimedLoot.push(...gameData.roundLoot);
    }

    const summary: RoundResolutionSummary = {
      roundNumber: gameData.round,
      actions,
      woundedPlayerIds: Array.from(woundedSet),
      knockedOutPlayerIds: Array.from(knockedOutSet),
      lootWinners,
      lootSplits,
      unclaimedLoot,
    };

    onUpdateGameData({
      ...gameData,
      phase: 'shootout_reveal',
      playerStates: nextStates,
      lastResolution: summary,
    });
  };

  const handleLockStandoffDecision = (choice: StandoffDecision) => {
    if (!currentActorState || currentActorState.eliminated) return;

    const nextStates: Record<string, CashNGunsPlayerState> = {
      ...gameData.playerStates,
      [currentActorId]: {
        ...currentActorState,
        standoffChoice: choice,
        lockedStandoff: true,
      },
    };

    // Auto-decide for any bot players
    survivingPlayers.forEach((p) => {
      if (p.id.startsWith('bot-') && !nextStates[p.id].lockedStandoff) {
        const aimersCount = (incomingAimersByTarget[p.id] || []).length;
        const botChoice: StandoffDecision =
          aimersCount >= 2 && Math.random() < 0.65 ? 'duck' : 'stay';
        nextStates[p.id] = {
          ...nextStates[p.id],
          standoffChoice: botChoice,
          lockedStandoff: true,
        };
      }
    });

    const allStandoffLocked = survivingPlayers.every(
      (p) => nextStates[p.id]?.lockedStandoff
    );

    if (allStandoffLocked) {
      resolveShootoutAndLoot(nextStates);
    } else {
      onUpdateGameData({
        ...gameData,
        playerStates: nextStates,
      });
    }
  };

  const handleHostAutoLockStandoff = () => {
    const nextStates: Record<string, CashNGunsPlayerState> = {
      ...gameData.playerStates,
    };
    survivingPlayers.forEach((p) => {
      const st = nextStates[p.id];
      if (st && !st.lockedStandoff) {
        nextStates[p.id] = {
          ...st,
          standoffChoice: 'stay',
          lockedStandoff: true,
        };
      }
    });
    resolveShootoutAndLoot(nextStates);
  };

  /* ==========================================================================
   * PHASE 3 -> NEXT ROUND OR GAME OVER
   * ======================================================================== */

  const handleAdvanceAfterReveal = () => {
    const remainingSurvivors = activePlayers.filter(
      (p) => !gameData.playerStates[p.id]?.eliminated
    );

    const isFinalRound = gameData.round >= gameData.totalRounds;
    const heistEndedEarly = remainingSurvivors.length <= 1;

    if (isFinalRound || heistEndedEarly) {
      // Finalize Game Over + Apply $30,000 Diamond Majority Bonus to surviving players
      const finalStates: Record<string, CashNGunsPlayerState> = {};
      Object.keys(gameData.playerStates).forEach((pid) => {
        finalStates[pid] = { ...gameData.playerStates[pid] };
      });

      let maxDiamonds = 0;
      remainingSurvivors.forEach((p) => {
        const d = finalStates[p.id]?.diamonds || 0;
        if (d > maxDiamonds) maxDiamonds = d;
      });

      let diamondBonus: DiamondBonusWinner | null = null;
      if (maxDiamonds > 0) {
        const topDiamondHolders = remainingSurvivors
          .filter((p) => (finalStates[p.id]?.diamonds || 0) === maxDiamonds)
          .map((p) => p.id);

        const bonusPerWinner = Math.floor(30000 / topDiamondHolders.length);
        topDiamondHolders.forEach((pid) => {
          finalStates[pid].cash += bonusPerWinner;
        });

        diamondBonus = {
          playerIds: topDiamondHolders,
          diamondCount: maxDiamonds,
          bonusPerWinner,
        };
      }

      // Determine richest surviving gangster(s)
      let highestCash = -1;
      const candidatePool =
        remainingSurvivors.length > 0 ? remainingSurvivors : activePlayers;

      candidatePool.forEach((p) => {
        const c = finalStates[p.id]?.cash || 0;
        if (c > highestCash) highestCash = c;
      });

      const winnerIds = candidatePool
        .filter((p) => (finalStates[p.id]?.cash || 0) === highestCash)
        .map((p) => p.id);

      // Compute room score awards (1 point per $10k + 3 bonus for winning the heist)
      const scoreAwards: Record<string, number> = {};
      candidatePool.forEach((p) => {
        const cashEarned = finalStates[p.id]?.cash || 0;
        const pts =
          Math.max(1, Math.round(cashEarned / 10000)) +
          (winnerIds.includes(p.id) ? 3 : 0);
        scoreAwards[p.id] = pts;
      });

      try {
        confetti({ particleCount: 95, spread: 75, origin: { y: 0.6 } });
      } catch {
        // Ignore confetti errors in headless environments
      }

      onUpdateGameData(
        {
          ...gameData,
          phase: 'game_over',
          playerStates: finalStates,
          diamondBonus,
          winnerIds,
        },
        scoreAwards
      );
      return;
    }

    // Prepare Next Heist Round
    const nextRound = gameData.round + 1;
    const resetStates: Record<string, CashNGunsPlayerState> = {};
    Object.keys(gameData.playerStates).forEach((pid) => {
      const prev = gameData.playerStates[pid];
      resetStates[pid] = {
        ...prev,
        selectedBullet: null,
        selectedTargetId: null,
        lockedAim: false,
        standoffChoice: null,
        lockedStandoff: false,
      };
    });

    setLocalBullet(null);
    setLocalTargetId(null);
    setPassAndPlayRevealed(false);

    onUpdateGameData({
      ...gameData,
      phase: 'load_and_aim',
      round: nextRound,
      roundLoot: generateRoundLoot(nextRound),
      playerStates: resetStates,
    });
  };

  /* ==========================================================================
   * RENDER: TOP HEIST STATUS BAR & GANGSTER STRIP
   * ======================================================================== */

  return (
    <div
      dir={isAr ? 'rtl' : 'ltr'}
      className="w-full max-w-5xl mx-auto space-y-5 pb-10 select-none"
    >
      {/* 1. TOP HEIST HEADER BANNER */}
      <div className="bg-[#161426] text-white rounded-3xl border-4 border-[#161426] shadow-[0_8px_0_#161426] p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-14 h-14 rounded-2xl bg-[#ffca3a] border-4 border-white flex items-center justify-center shrink-0 shadow-[0_4px_0_rgba(0,0,0,0.4)]">
            <CartoonBlasterSvg className="w-12 h-12" color="#ff595e" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-[#ffca3a]">
                {isAr ? 'قسمة العصابة' : "Cash 'n Guns"}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-[#ff595e] text-white text-xs font-black border-2 border-white">
                {isAr
                  ? `الجولة ${gameData.round} من ${gameData.totalRounds}`
                  : `Round ${gameData.round} / ${gameData.totalRounds}`}
              </span>
            </div>
            <p className="text-xs sm:text-sm font-bold text-slate-300 mt-0.5">
              {gameData.phase === 'load_and_aim' &&
                (isAr
                  ? 'المرحلة 1: عمّر سلاحك بالسر وصوّب على أحد أفراد العصابة!'
                  : 'Phase 1: Secretly load a bullet and point your blaster!')}
              {gameData.phase === 'standoff' &&
                (isAr
                  ? 'المرحلة 2: انكشفت الأسلحة! هل تصمد لتأخذ الغنيمة أم تنسحب؟'
                  : 'Phase 2: Blasters revealed! Hold your ground or duck for cover?')}
              {gameData.phase === 'shootout_reveal' &&
                (isAr
                  ? 'المرحلة 3: كشف الطلقات وتقسيم غنيمة الخزنة!'
                  : 'Phase 3: Bullet reveal & Vault loot distribution!')}
              {gameData.phase === 'game_over' &&
                (isAr
                  ? 'انتهت السرقة الكبرى! حساب الثروات ومكافأة الألماس'
                  : 'The Heist is Over! Final fortune & Diamond bonus')}
            </p>
          </div>
        </div>

        {/* Phase Stepper Pills */}
        <div className="flex items-center gap-1.5 bg-[#25204d] p-1.5 rounded-2xl border-2 border-white/15">
          {[
            { id: 'load_and_aim', ar: '1. التصويب', en: '1. Aim' },
            { id: 'standoff', ar: '2. المواجهة', en: '2. Standoff' },
            { id: 'shootout_reveal', ar: '3. الغنيمة', en: '3. Shootout' },
          ].map((step) => {
            const active = gameData.phase === step.id;
            return (
              <div
                key={step.id}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                  active
                    ? 'bg-[#ffca3a] text-[#161426] shadow-[0_3px_0_#161426]'
                    : 'text-slate-300 opacity-75'
                }`}
              >
                {isAr ? step.ar : step.en}
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. GANGSTER CREW STATUS STRIP (Wounds, Cash, Diamonds, Lock State) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {activePlayers.map((p, idx) => {
          const st = gameData.playerStates[p.id];
          if (!st) return null;
          const aimers = incomingAimersByTarget[p.id] || [];
          const isMe = p.id === currentActorId;
          const isLocked =
            gameData.phase === 'load_and_aim'
              ? st.lockedAim
              : gameData.phase === 'standoff'
              ? st.lockedStandoff
              : false;

          return (
            <div
              key={p.id}
              className={`relative rounded-2xl border-4 border-[#161426] p-3 transition-all ${
                st.eliminated
                  ? 'bg-slate-200 opacity-65 grayscale'
                  : isMe
                  ? 'bg-[#fffbeb] shadow-[0_6px_0_#161426] ring-4 ring-[#ffca3a]'
                  : 'bg-white shadow-[0_5px_0_#161426]'
              }`}
            >
              {/* Top Row: Avatar + Name + Cash */}
              <div className="flex items-center gap-2.5">
                <div className="w-11 h-11 rounded-xl border-3 border-[#161426] bg-slate-100 overflow-hidden shrink-0">
                  <CartoonAvatarSvg index={idx} color={p.avatar_color} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1">
                    <span className="font-black text-sm text-[#161426] truncate">
                      {p.name}
                    </span>
                  </div>
                  <div className="text-xs font-black text-emerald-700 bg-emerald-100 border-2 border-[#161426] rounded-lg px-1.5 py-0.5 inline-block mt-0.5">
                    {formatMoney(st.cash)}
                  </div>
                </div>
              </div>

              {/* Health / Wounds Bar (3 Bandage/Heart Slots) */}
              <div className="mt-2.5 flex items-center justify-between text-xs font-black">
                <span className="text-slate-600">
                  {st.eliminated
                    ? isAr
                      ? 'خارج السرقة'
                      : 'Knocked Out'
                    : isAr
                    ? `الإصابات: ${st.wounds}/3`
                    : `Wounds: ${st.wounds}/3`}
                </span>
                <div className="flex items-center gap-1">
                  {[0, 1, 2].map((slot) => {
                    const wounded = slot < st.wounds;
                    return (
                      <span
                        key={slot}
                        className={`w-4 h-4 rounded-md border-2 border-[#161426] flex items-center justify-center ${
                          wounded ? 'bg-[#ff595e]' : 'bg-[#8ac926]'
                        }`}
                        title={
                          wounded
                            ? isAr
                              ? 'إصابة'
                              : 'Wound'
                            : isAr
                            ? 'سليم'
                            : 'Healthy'
                        }
                      />
                    );
                  })}
                </div>
              </div>

              {/* Diamonds & Ammo Left */}
              <div className="mt-2 pt-2 border-t-2 border-dashed border-slate-200 flex items-center justify-between text-[11px] font-black text-[#161426]">
                <span className="px-2 py-0.5 rounded-md bg-sky-100 border border-[#161426]">
                  {isAr ? `ألماس: ${st.diamonds}` : `Diamonds: ${st.diamonds}`}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-amber-100 border border-[#161426]">
                  {isAr
                    ? `طلقات: ${st.ammoRemaining.length}`
                    : `Ammo: ${st.ammoRemaining.length}`}
                </span>
              </div>

              {/* Phase-specific badge (Locked or Targeted in Standoff) */}
              {!st.eliminated &&
                (gameData.phase === 'load_and_aim' ||
                  gameData.phase === 'standoff') && (
                  <div className="mt-2">
                    {isLocked ? (
                      <div className="w-full py-1 px-2 rounded-lg bg-[#8ac926] border-2 border-[#161426] text-[#161426] text-[11px] font-black flex items-center justify-center gap-1">
                        <CheckCircle weight="fill" className="w-3.5 h-3.5" />
                        <span>{isAr ? 'جاهز ومقفل!' : 'Locked In!'}</span>
                      </div>
                    ) : (
                      <div className="w-full py-1 px-2 rounded-lg bg-slate-100 border-2 border-[#161426] text-slate-600 text-[11px] font-black text-center">
                        {isAr ? 'يقرر الآن...' : 'Deciding...'}
                      </div>
                    )}
                  </div>
                )}

              {/* Incoming blasters indicator during Standoff */}
              {gameData.phase === 'standoff' && aimers.length > 0 && (
                <div className="mt-2 py-1 px-2 rounded-xl bg-[#ff595e] text-white border-2 border-[#161426] text-[11px] font-black flex items-center justify-center gap-1 animate-pulse">
                  <Crosshair weight="bold" className="w-4 h-4 shrink-0" />
                  <span>
                    {isAr
                      ? `${aimers.length} مصوّب عليه!`
                      : `${aimers.length} Blaster(s) Aimed!`}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 3. CENTER VAULT LOOT TABLE (4 RICH LOOT CARDS THIS ROUND) */}
      {gameData.phase !== 'game_over' && (
        <div className="bg-[#fff7ed] rounded-3xl border-4 border-[#161426] shadow-[0_6px_0_#161426] p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3.5">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-xl bg-[#ffca3a] border-3 border-[#161426] font-black text-xs sm:text-sm text-[#161426] shadow-[0_3px_0_#161426]">
                {isAr
                  ? `غنيمة الخزنة — الجولة ${gameData.round}`
                  : `Vault Loot Table — Round ${gameData.round}`}
              </span>
              <span className="text-xs font-bold text-slate-600">
                {isAr
                  ? 'يتقاسمها فقط الصامدون الذين لم تصبهم طلقة حقيقية!'
                  : 'Split only among standing gangsters who survive unscathed!'}
              </span>
            </div>
            <div className="text-xs font-black text-[#161426] bg-white px-3 py-1 rounded-xl border-2 border-[#161426]">
              {isAr ? 'إجمالي الخزنة: ' : 'Total Vault: '}
              <span className="text-emerald-700">
                {formatMoney(
                  gameData.roundLoot.reduce((sum, item) => sum + item.value, 0)
                )}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {gameData.roundLoot.map((item, idx) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.06 }}
                className="bg-white rounded-2xl border-4 border-[#161426] shadow-[0_5px_0_#161426] p-3 flex flex-col items-center text-center relative overflow-hidden"
              >
                <div
                  className={`text-[11px] font-black px-2.5 py-0.5 rounded-full border-2 border-[#161426] mb-2 ${getLootBadgeColor(
                    item.type
                  )}`}
                >
                  {formatMoney(item.value)}
                </div>
                <LootVaultItemSvg type={item.type} className="w-14 h-14 my-1" />
                <div className="font-black text-xs sm:text-sm text-[#161426] mt-1">
                  {isAr ? item.titleAr : item.titleEn}
                </div>
                <div className="text-[11px] font-bold text-slate-500 mt-0.5 leading-tight">
                  {isAr ? item.subtitleAr : item.subtitleEn}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* ====================================================================
       * PHASE 1: LOAD & AIM ('load_and_aim')
       * ================================================================== */}
      {gameData.phase === 'load_and_aim' && (
        <div className="bg-white rounded-3xl border-4 border-[#161426] shadow-[0_8px_0_#161426] p-5 sm:p-6 space-y-5">
          {/* Pass-and-Play Privacy Shield if not yet revealed */}
          {isPassAndPlay && !passAndPlayRevealed ? (
            <div className="py-8 px-4 text-center space-y-4 bg-[#f8fafc] rounded-2xl border-4 border-dashed border-[#161426]">
              <div className="w-20 h-20 mx-auto rounded-2xl border-4 border-[#161426] bg-[#ffca3a] shadow-[0_5px_0_#161426] overflow-hidden">
                <CartoonAvatarSvg
                  index={getPlayerIndex(currentActorId)}
                  color={currentActorInfo?.avatar_color}
                />
              </div>
              <div className="space-y-1">
                <span className="px-3 py-1 rounded-full bg-[#161426] text-[#ffca3a] text-xs font-black">
                  {isAr ? 'تعمير سري — مرّر الجهاز' : 'Secret Load — Pass Device'}
                </span>
                <h3 className="text-2xl font-black text-[#161426]">
                  {isAr
                    ? `دور ${currentActorInfo?.name} لتعمير السلاح والتصويب`
                    : `${currentActorInfo?.name}'s Turn to Load & Aim`}
                </h3>
                <p className="text-sm font-bold text-slate-600 max-w-md mx-auto">
                  {isAr
                    ? 'تأكد أن لا أحد يرى شاشتك قبل كشف مخزن طلقاتك السري!'
                    : 'Make sure nobody is peeking at your screen before revealing your magazine!'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPassAndPlayRevealed(true)}
                className="px-6 py-3.5 rounded-2xl bg-[#8ac926] hover:bg-[#7ab81e] text-[#161426] font-black text-base border-4 border-[#161426] shadow-[0_5px_0_#161426] active:translate-y-1 transition-all inline-flex items-center gap-2"
              >
                <Eye weight="bold" className="w-5 h-5" />
                <span>
                  {isAr
                    ? `أنا ${currentActorInfo?.name} — افتح مخزن الطلقات`
                    : `I am ${currentActorInfo?.name} — Reveal Magazine`}
                </span>
              </button>
            </div>
          ) : currentActorState?.eliminated ? (
            <div className="p-6 rounded-2xl bg-rose-50 border-4 border-[#161426] text-center space-y-2">
              <WarningOctagon
                weight="fill"
                className="w-12 h-12 text-[#ff595e] mx-auto"
              />
              <h3 className="text-xl font-black text-[#161426]">
                {isAr
                  ? 'لقد تعرضت لـ 3 إصابات وخرجت من السرقة!'
                  : 'You took 3 wounds and are out of the heist!'}
              </h3>
              <p className="text-sm font-bold text-slate-600">
                {isAr
                  ? 'تفرّج على بقية أفراد العصابة وهم يتقاتلون على الغنيمة!'
                  : 'Watch the remaining gangsters battle over the vault loot!'}
              </p>
            </div>
          ) : currentActorState?.lockedAim ? (
            <div className="p-6 rounded-2xl bg-emerald-50 border-4 border-[#161426] text-center space-y-3">
              <CheckCircle
                weight="fill"
                className="w-12 h-12 text-emerald-600 mx-auto"
              />
              <h3 className="text-xl font-black text-[#161426]">
                {isAr
                  ? 'تم قفل سلاحك وهدفك لهذه الجولة!'
                  : 'Your blaster and target are locked in!'}
              </h3>
              <p className="text-sm font-bold text-slate-600">
                {isAr
                  ? 'بانتظار بقية أفراد العصابة لقفل تصويبهم...'
                  : 'Waiting for the rest of the gang to lock their aim...'}
              </p>
              {isHost && (
                <button
                  type="button"
                  onClick={handleHostAutoLockAim}
                  className="mt-2 px-4 py-2 rounded-xl bg-[#ffca3a] text-[#161426] font-black text-xs border-3 border-[#161426] shadow-[0_3px_0_#161426]"
                >
                  {isAr
                    ? 'تعبئة تلقائية للمتأخرين وبدء المواجهة'
                    : 'Auto-lock remaining players & start Standoff'}
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Step 1: Choose Bullet from Remaining Magazine */}
              <div className="space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-[#161426] text-[#ffca3a] font-black text-sm flex items-center justify-center">
                      1
                    </span>
                    <h3 className="text-base sm:text-lg font-black text-[#161426]">
                      {isAr
                        ? `اختر الطلقة السرية لـ (${currentActorInfo?.name}):`
                        : `Select Secret Bullet for (${currentActorInfo?.name}):`}
                    </h3>
                  </div>
                  <span className="text-xs font-black text-slate-600 bg-slate-100 px-3 py-1 rounded-xl border-2 border-[#161426]">
                    {isAr
                      ? `المتبقي بمخزنك: ${ammoCounts.click} طَقّ (فاضية) | ${ammoCounts.bang} بوم (حقيقية)`
                      : `Magazine Left: ${ammoCounts.click} Click (Blank) | ${ammoCounts.bang} Bang (Live)`}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* CLICK / BLANK CARD */}
                  <button
                    type="button"
                    disabled={ammoCounts.click <= 0}
                    onClick={() => setLocalBullet('click')}
                    className={`p-4 rounded-2xl border-4 border-[#161426] text-start transition-all flex items-center gap-4 ${
                      ammoCounts.click <= 0
                        ? 'bg-slate-100 opacity-45 cursor-not-allowed'
                        : (localBullet || currentActorState?.ammoRemaining[0]) ===
                          'click'
                        ? 'bg-[#e0f2fe] ring-4 ring-[#00bbf9] shadow-[0_6px_0_#161426] -translate-y-0.5'
                        : 'bg-white hover:bg-slate-50 shadow-[0_4px_0_#161426]'
                    }`}
                  >
                    <BulletCardSvg type="click" className="w-16 h-16 shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-black text-base text-[#161426]">
                          {isAr ? 'طلقة فاضية «طَقّ!» (Click)' : 'Blank Bullet "CLICK!"'}
                        </span>
                        <span className="px-2 py-0.5 rounded-lg bg-[#161426] text-white text-xs font-black">
                          x{ammoCounts.click}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-slate-600 mt-1">
                        {isAr
                          ? 'تخوّف خصمك وتدفعه للانسحاب دون أن تستهلك ذخيرتك الحقيقية!'
                          : 'Bluff and scare your target into ducking while saving your live ammo!'}
                      </p>
                    </div>
                  </button>

                  {/* BANG / LIVE FOAM DART CARD */}
                  <button
                    type="button"
                    disabled={ammoCounts.bang <= 0}
                    onClick={() => setLocalBullet('bang')}
                    className={`p-4 rounded-2xl border-4 border-[#161426] text-start transition-all flex items-center gap-4 ${
                      ammoCounts.bang <= 0
                        ? 'bg-slate-100 opacity-45 cursor-not-allowed'
                        : localBullet === 'bang'
                        ? 'bg-[#ffe4e6] ring-4 ring-[#ff595e] shadow-[0_6px_0_#161426] -translate-y-0.5'
                        : 'bg-white hover:bg-slate-50 shadow-[0_4px_0_#161426]'
                    }`}
                  >
                    <BulletCardSvg type="bang" className="w-16 h-16 shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-black text-base text-[#161426]">
                          {isAr ? 'طلقة حقيقية «بوم!» (Bang)' : 'Live Foam Dart "BANG!"'}
                        </span>
                        <span className="px-2 py-0.5 rounded-lg bg-[#ff595e] text-white text-xs font-black">
                          x{ammoCounts.bang}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-slate-600 mt-1">
                        {isAr
                          ? 'إذا صمد خصمك ولم ينسحب، تصيبه بجرح وتطرده من تقسيم غنيمة هذه الجولة!'
                          : 'If your target holds their ground, they take +1 wound and lose their loot share!'}
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Step 2: Choose Opponent Target */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-[#161426] text-[#ffca3a] font-black text-sm flex items-center justify-center">
                    2
                  </span>
                  <h3 className="text-base sm:text-lg font-black text-[#161426]">
                    {isAr
                      ? 'صوّب مسدسك نحو أحد الخصوم:'
                      : 'Aim Your Blaster at an Opponent:'}
                  </h3>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {survivingPlayers
                    .filter((p) => p.id !== currentActorId)
                    .map((opponent) => {
                      const oppSt = gameData.playerStates[opponent.id];
                      const isSelected = localTargetId === opponent.id;
                      return (
                        <button
                          key={opponent.id}
                          type="button"
                          onClick={() => setLocalTargetId(opponent.id)}
                          className={`p-3.5 rounded-2xl border-4 border-[#161426] transition-all flex flex-col items-center text-center ${
                            isSelected
                              ? 'bg-[#ffca3a] shadow-[0_6px_0_#161426] -translate-y-0.5'
                              : 'bg-white hover:bg-slate-50 shadow-[0_4px_0_#161426]'
                          }`}
                        >
                          <div className="relative w-14 h-14 rounded-2xl border-3 border-[#161426] bg-slate-100 overflow-hidden mb-2">
                            <CartoonAvatarSvg
                              index={getPlayerIndex(opponent.id)}
                              color={opponent.avatar_color}
                            />
                            {isSelected && (
                              <div className="absolute inset-0 bg-[#ff595e]/25 flex items-center justify-center">
                                <Crosshair
                                  weight="bold"
                                  className="w-8 h-8 text-[#161426]"
                                />
                              </div>
                            )}
                          </div>
                          <span className="font-black text-sm text-[#161426] truncate w-full">
                            {opponent.name}
                          </span>
                          <span className="text-[11px] font-bold text-slate-600 mt-0.5">
                            {formatMoney(oppSt?.cash || 0)} •{' '}
                            {isAr
                              ? `إصابات ${oppSt?.wounds || 0}/3`
                              : `Wounds ${oppSt?.wounds || 0}/3`}
                          </span>
                        </button>
                      );
                    })}
                </div>
              </div>

              {/* Lock Aim Button */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleLockLoadAndAim}
                  className="w-full sm:w-auto px-7 py-4 rounded-2xl bg-[#ff595e] hover:bg-[#ef4444] text-white font-black text-base border-4 border-[#161426] shadow-[0_6px_0_#161426] active:translate-y-1 transition-all flex items-center justify-center gap-2.5"
                >
                  <LockKey weight="fill" className="w-5 h-5" />
                  <span>
                    {isAr
                      ? 'اقفل الطلقة والتصويب السري!'
                      : 'Lock Secret Bullet & Aim!'}
                  </span>
                </button>

                {isHost && !isPassAndPlay && (
                  <button
                    type="button"
                    onClick={handleHostAutoLockAim}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#161426] font-black text-xs border-3 border-[#161426]"
                  >
                    {isAr
                      ? 'قفل تلقائي للبقية (للمضيف)'
                      : 'Host: Auto-lock remaining'}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ====================================================================
       * PHASE 2: STANDOFF ('standoff' — HOLD YOUR GROUND OR DUCK FOR COVER!)
       * ================================================================== */}
      {gameData.phase === 'standoff' && (
        <div className="bg-white rounded-3xl border-4 border-[#161426] shadow-[0_8px_0_#161426] p-5 sm:p-6 space-y-5">
          {/* Dramatic Standoff Header */}
          <div className="bg-[#fef2f2] border-4 border-[#161426] rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-[#ff595e] font-black text-base sm:text-lg">
              <Crosshair weight="bold" className="w-6 h-6 shrink-0" />
              <span>
                {isAr
                  ? 'المواجهة الكبرى: انكشف من يصوّب على من!'
                  : 'Mexican Standoff: All Aimed Blasters Revealed!'}
              </span>
            </div>
            <p className="text-xs sm:text-sm font-bold text-slate-700">
              {isAr
                ? 'أنت ترى من يوجّه سلاحه نحوك الآن، لكنك لا تعرف هل بداخل سلاحه طلقة فاضية «طَقّ!» أم طلقة حقيقية «بوم!»...'
                : 'You can see every blaster aimed at you, but nobody knows which blasters hold a Blank "CLICK!" vs a Live "BANG!"...'}
            </p>

            {/* Visual Aim Lines Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              {survivingPlayers.map((shooter) => {
                const st = gameData.playerStates[shooter.id];
                const targetId = st?.selectedTargetId || '';
                return (
                  <div
                    key={shooter.id}
                    className="bg-white rounded-xl border-3 border-[#161426] px-3 py-2 flex items-center justify-between gap-2 shadow-[0_3px_0_#161426]"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-8 h-8 rounded-lg border-2 border-[#161426] overflow-hidden shrink-0">
                        <CartoonAvatarSvg
                          index={getPlayerIndex(shooter.id)}
                          color={shooter.avatar_color}
                        />
                      </div>
                      <span className="font-black text-xs sm:text-sm text-[#161426] truncate">
                        {shooter.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <CartoonBlasterSvg
                        className="w-10 h-7"
                        color="#ff924c"
                        flipped={isAr}
                      />
                      <span className="text-[11px] font-black px-2 py-0.5 rounded-md bg-[#ffca3a] border-2 border-[#161426]">
                        {isAr ? 'يصوّب على' : 'aims at'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-8 h-8 rounded-lg border-2 border-[#161426] overflow-hidden shrink-0">
                        <CartoonAvatarSvg
                          index={getPlayerIndex(targetId)}
                          color={getPlayerColor(targetId)}
                        />
                      </div>
                      <span className="font-black text-xs sm:text-sm text-[#ff595e] truncate">
                        {getPlayerName(targetId)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Current Player Decision Box */}
          {currentActorState?.eliminated ? (
            <div className="p-5 rounded-2xl bg-slate-100 border-3 border-[#161426] text-center font-black text-slate-600">
              {isAr
                ? 'أنت خارج الجولة بسبب الإصابات — تابع نتيجة المواجهة!'
                : 'You are knocked out — watch the standoff unfold!'}
            </div>
          ) : currentActorState?.lockedStandoff ? (
            <div className="p-5 rounded-2xl bg-emerald-50 border-4 border-[#161426] text-center space-y-2">
              <CheckCircle
                weight="fill"
                className="w-10 h-10 text-emerald-600 mx-auto"
              />
              <h4 className="text-lg font-black text-[#161426]">
                {isAr ? 'تم تسجيل قرارك!' : 'Your decision is locked in!'}
              </h4>
              <p className="text-xs font-bold text-slate-600">
                {isAr
                  ? 'بانتظار بقية أفراد العصابة لحسم موقفهم...'
                  : 'Waiting for remaining gangsters to make their call...'}
              </p>
              {isHost && (
                <button
                  type="button"
                  onClick={handleHostAutoLockStandoff}
                  className="mt-2 px-4 py-2 rounded-xl bg-[#ffca3a] text-[#161426] font-black text-xs border-3 border-[#161426]"
                >
                  {isAr
                    ? 'حسم تلقائي للبقية وكشف الطلقات'
                    : 'Host: Resolve Standoff Now'}
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl border-3 border-[#161426] overflow-hidden">
                    <CartoonAvatarSvg
                      index={getPlayerIndex(currentActorId)}
                      color={currentActorInfo?.avatar_color}
                    />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-[#161426]">
                      {isAr
                        ? `قرار المواجهة لـ (${currentActorInfo?.name}):`
                        : `Standoff Decision for (${currentActorInfo?.name}):`}
                    </h3>
                    <p className="text-xs font-bold text-slate-600">
                      {(incomingAimersByTarget[currentActorId] || []).length > 0
                        ? isAr
                          ? `انتبه! يوجد ${
                              incomingAimersByTarget[currentActorId].length
                            } سلاح مصوّب عليك الآن (${incomingAimersByTarget[
                              currentActorId
                            ]
                              .map(getPlayerName)
                              .join(' ، ')})!`
                          : `Watch out! ${
                              incomingAimersByTarget[currentActorId].length
                            } blaster(s) aimed at you (${incomingAimersByTarget[
                              currentActorId
                            ]
                              .map(getPlayerName)
                              .join(', ')})!`
                        : isAr
                        ? 'لا أحد يصوّب عليك في هذه الجولة! الصمود آمن تماماً!'
                        : 'Nobody is aiming at you this round! Holding your ground is 100% safe!'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* STAY / HOLD GROUND */}
                <button
                  type="button"
                  onClick={() => handleLockStandoffDecision('stay')}
                  className="p-5 rounded-2xl border-4 border-[#161426] bg-[#fffbeb] hover:bg-[#fef3c7] shadow-[0_6px_0_#161426] active:translate-y-1 transition-all flex items-center gap-4 text-start"
                >
                  <ShieldDuckSvg mode="stay" className="w-16 h-16 shrink-0" />
                  <div>
                    <div className="text-lg font-black text-[#161426]">
                      {isAr
                        ? 'أصمد بمكاني! (Hold Ground)'
                        : 'Hold Your Ground! (Stay)'}
                    </div>
                    <p className="text-xs font-bold text-slate-700 mt-1">
                      {isAr
                        ? 'تطلق سلاحك وتشارك بتقسيم غنيمة الخزنة إذا لم تصبك طلقة حقيقية «بوم!»'
                        : 'Fire your blaster and claim your share of the Vault Loot if you survive unscathed!'}
                    </p>
                  </div>
                </button>

                {/* DUCK / TAKE COVER */}
                <button
                  type="button"
                  onClick={() => handleLockStandoffDecision('duck')}
                  className="p-5 rounded-2xl border-4 border-[#161426] bg-[#f0f9ff] hover:bg-[#e0f2fe] shadow-[0_6px_0_#161426] active:translate-y-1 transition-all flex items-center gap-4 text-start"
                >
                  <ShieldDuckSvg mode="duck" className="w-16 h-16 shrink-0" />
                  <div>
                    <div className="text-lg font-black text-[#161426]">
                      {isAr
                        ? 'أنسحب وأحمي نفسي! (Duck)'
                        : 'Duck for Cover! (Dodge)'}
                    </div>
                    <p className="text-xs font-bold text-slate-700 mt-1">
                      {isAr
                        ? 'تتفادى جميع الطلقات الموجهة نحوك بسلام، لكنك تتنازل عن غنيمة هذه الجولة!'
                        : 'Dodge all bullets aimed at you safely, but forfeit any share of this round’s loot!'}
                    </p>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ====================================================================
       * PHASE 3: SHOOTOUT REVEAL & LOOT SPLIT ('shootout_reveal')
       * ================================================================== */}
      {gameData.phase === 'shootout_reveal' && gameData.lastResolution && (
        <div className="bg-white rounded-3xl border-4 border-[#161426] shadow-[0_8px_0_#161426] p-5 sm:p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b-4 border-dashed border-slate-200 pb-4">
            <div>
              <h3 className="text-xl sm:text-2xl font-black text-[#161426]">
                {isAr
                  ? `نتيجة إطلاق النار وتقسيم الغنيمة — الجولة ${gameData.lastResolution.roundNumber}`
                  : `Shootout & Loot Split — Round ${gameData.lastResolution.roundNumber}`}
              </h3>
              <p className="text-xs sm:text-sm font-bold text-slate-600">
                {isAr
                  ? 'انكشفت جميع الطلقات الفاضية والحقيقية وتوزعت غنائم الخزنة!'
                  : 'All Blank Clicks and Live Bangs revealed & Vault Loot distributed!'}
              </p>
            </div>
          </div>

          {/* 1. Bullet Reveal Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {gameData.lastResolution.actions.map((act, i) => {
              const isBang = act.bullet === 'bang';
              return (
                <motion.div
                  key={`${act.shooterId}-${i}`}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.08 }}
                  className={`rounded-2xl border-4 border-[#161426] p-3.5 shadow-[0_5px_0_#161426] flex items-center justify-between gap-3 ${
                    act.causedWound
                      ? 'bg-[#ffe4e6]'
                      : isBang
                      ? 'bg-[#fef3c7]'
                      : 'bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <CartoonBlasterSvg
                      className="w-14 h-10 shrink-0"
                      color={isBang ? '#ff595e' : '#64748b'}
                      firing={act.shooterDucked ? 'none' : act.bullet}
                    />
                    <div className="min-w-0">
                      <div className="font-black text-sm text-[#161426] truncate">
                        {getPlayerName(act.shooterId)} {'→'}{' '}
                        {getPlayerName(act.targetId)}
                      </div>
                      <div className="text-xs font-bold text-slate-700 mt-0.5">
                        {act.shooterDucked
                          ? isAr
                            ? 'المهاجم انسحب ولم يطلق النار'
                            : 'Shooter ducked for cover (shot cancelled)'
                          : act.targetDucked
                          ? isAr
                            ? `الهدف انسحب وتفادى الطلقة (${
                                isBang ? 'بوم!' : 'طَقّ!'
                              })`
                            : `Target ducked & dodged (${
                                isBang ? 'BANG!' : 'CLICK!'
                              })`
                          : act.causedWound
                          ? isAr
                            ? 'إصابة مباشرة بطلقة حقيقية «بوم!» (+1 جرح)'
                            : 'Direct hit with a LIVE DART "BANG!" (+1 Wound)'
                          : isAr
                          ? 'طلقة فاضية «طَقّ!» — خدعة ناجحة بلا إصابات!'
                          : 'Blank bullet "CLICK!" — No wound dealt!'}
                      </div>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-xl border-2 border-[#161426] text-xs font-black shrink-0 ${
                      isBang
                        ? 'bg-[#ff595e] text-white'
                        : 'bg-white text-[#161426]'
                    }`}
                  >
                    {isBang
                      ? isAr
                        ? 'بوم! (Bang)'
                        : 'BANG!'
                      : isAr
                      ? 'طَقّ! (Click)'
                      : 'CLICK!'}
                  </span>
                </motion.div>
              );
            })}
          </div>

          {/* 2. Loot Distribution Summary */}
          <div className="bg-[#f0fdf4] rounded-2xl border-4 border-[#161426] p-4 space-y-3">
            <h4 className="font-black text-base text-[#161426] flex items-center gap-2">
              <Sparkle weight="fill" className="w-5 h-5 text-emerald-600" />
              <span>
                {isAr
                  ? 'تقسيم غنيمة الخزنة لهذه الجولة:'
                  : 'Vault Loot Distribution This Round:'}
              </span>
            </h4>

            {gameData.lastResolution.lootSplits.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {gameData.lastResolution.lootSplits.map((split, idx) => (
                  <div
                    key={`${split.item.id}-${idx}`}
                    className="bg-white rounded-xl border-3 border-[#161426] p-3 shadow-[0_4px_0_#161426] flex flex-col items-center text-center"
                  >
                    <LootVaultItemSvg
                      type={split.item.type}
                      className="w-12 h-12"
                    />
                    <span className="font-black text-xs text-[#161426] mt-1">
                      {isAr ? split.item.titleAr : split.item.titleEn}
                    </span>
                    <div className="mt-2 px-2.5 py-1 rounded-lg bg-[#8ac926] border-2 border-[#161426] text-[11px] font-black text-[#161426]">
                      {isAr
                        ? `ذهبت إلى: ${getPlayerName(split.playerId)}`
                        : `Claimed by: ${getPlayerName(split.playerId)}`}
                    </div>
                    {split.healedWound && (
                      <span className="mt-1 text-[10px] font-black text-rose-600">
                        {isAr ? '+ عالجت إصابة واحدة!' : '+ Healed 1 Wound!'}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-amber-100 border-2 border-[#161426] text-xs sm:text-sm font-black text-[#161426]">
                {isAr
                  ? 'لم يصمد أحد دون إصابة في هذه الجولة! بقيت الغنيمة في الخزنة وضاعت على الجميع!'
                  : 'Nobody stood unscathed this round! All vault loot went unclaimed!'}
              </div>
            )}
          </div>

          {/* Next Round / Finish Heist Button */}
          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={handleAdvanceAfterReveal}
              className="w-full sm:w-auto px-7 py-4 rounded-2xl bg-[#8ac926] hover:bg-[#7ab81e] text-[#161426] font-black text-base border-4 border-[#161426] shadow-[0_6px_0_#161426] active:translate-y-1 transition-all flex items-center justify-center gap-2"
            >
              <span>
                {gameData.round >= gameData.totalRounds ||
                survivingPlayers.length <= 1
                  ? isAr
                    ? 'إعلان الفائز بالسرقة ومكافأة الألماس!'
                    : 'Reveal Final Heist Winner & Diamond Bonus!'
                  : isAr
                  ? `الانتقال إلى الجولة ${gameData.round + 1}`
                  : `Proceed to Heist Round ${gameData.round + 1}`}
              </span>
              <ArrowRight weight="bold" className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* ====================================================================
       * PHASE 4: GAME OVER ('game_over')
       * ================================================================== */}
      {gameData.phase === 'game_over' && (
        <div className="bg-white rounded-3xl border-4 border-[#161426] shadow-[0_8px_0_#161426] p-6 space-y-6 text-center">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-[#ffca3a] border-4 border-[#161426] shadow-[0_6px_0_#161426] flex items-center justify-center">
            <Trophy weight="fill" className="w-11 h-11 text-[#161426]" />
          </div>

          <div className="space-y-1.5">
            <span className="px-3 py-1 rounded-full bg-[#161426] text-[#ffca3a] text-xs font-black">
              {isAr ? 'نهاية قسمة العصابة' : 'Heist Complete'}
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-[#161426]">
              {isAr ? 'زعيم الغنيمة الفائز: ' : 'Mastermind Heist Winner: '}
              <span className="text-[#ff595e]">
                {gameData.winnerIds.map(getPlayerName).join(' & ')}
              </span>
            </h2>
          </div>

          {/* Diamond Majority Bonus Callout */}
          {gameData.diamondBonus && (
            <div className="max-w-xl mx-auto bg-[#e0f2fe] border-4 border-[#161426] rounded-2xl p-4 shadow-[0_5px_0_#161426] flex items-center justify-center gap-3">
              <LootVaultItemSvg type="diamond" className="w-12 h-12 shrink-0" />
              <div className="text-start">
                <div className="font-black text-sm sm:text-base text-[#161426]">
                  {isAr
                    ? `مكافأة ملك الألماس (+${formatMoney(
                        gameData.diamondBonus.bonusPerWinner
                      )})`
                    : `Diamond King Bonus (+${formatMoney(
                        gameData.diamondBonus.bonusPerWinner
                      )})`}
                </div>
                <div className="text-xs font-bold text-slate-700">
                  {isAr
                    ? `حصل عليها ${gameData.diamondBonus.playerIds
                        .map(getPlayerName)
                        .join(' و ')} لجمع ${
                        gameData.diamondBonus.diamondCount
                      } ألماسة!`
                    : `Awarded to ${gameData.diamondBonus.playerIds
                        .map(getPlayerName)
                        .join(' & ')} with ${
                        gameData.diamondBonus.diamondCount
                      } diamond(s)!`}
                </div>
              </div>
            </div>
          )}

          {/* Final Standings Table */}
          <div className="max-w-2xl mx-auto space-y-2.5 text-start">
            {[...activePlayers]
              .sort((a, b) => {
                const stA = gameData.playerStates[a.id];
                const stB = gameData.playerStates[b.id];
                if (stA?.eliminated !== stB?.eliminated) {
                  return stA?.eliminated ? 1 : -1;
                }
                return (stB?.cash || 0) - (stA?.cash || 0);
              })
              .map((p, rankIdx) => {
                const st = gameData.playerStates[p.id];
                const isWinner = gameData.winnerIds.includes(p.id);
                return (
                  <div
                    key={p.id}
                    className={`rounded-2xl border-4 border-[#161426] p-3.5 flex items-center justify-between gap-3 ${
                      isWinner
                        ? 'bg-[#ffca3a] shadow-[0_5px_0_#161426]'
                        : st?.eliminated
                        ? 'bg-slate-100 opacity-75'
                        : 'bg-white shadow-[0_4px_0_#161426]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-xl bg-[#161426] text-white font-black text-sm flex items-center justify-center">
                        #{rankIdx + 1}
                      </span>
                      <div className="w-11 h-11 rounded-xl border-3 border-[#161426] bg-white overflow-hidden">
                        <CartoonAvatarSvg
                          index={getPlayerIndex(p.id)}
                          color={p.avatar_color}
                        />
                      </div>
                      <div>
                        <div className="font-black text-base text-[#161426] flex items-center gap-1.5">
                          <span>{p.name}</span>
                          {isWinner && (
                            <Crown
                              weight="fill"
                              className="w-4 h-4 text-[#161426]"
                            />
                          )}
                        </div>
                        <div className="text-xs font-bold text-slate-700">
                          {st?.eliminated
                            ? isAr
                              ? 'أُقصي بـ 3 إصابات'
                              : 'Knocked Out (3/3 Wounds)'
                            : isAr
                            ? `نجا (${st?.wounds || 0}/3 إصابات) • ألماس: ${
                                st?.diamonds || 0
                              }`
                            : `Survived (${st?.wounds || 0}/3 Wounds) • Diamonds: ${
                                st?.diamonds || 0
                              }`}
                        </div>
                      </div>
                    </div>

                    <div className="text-end">
                      <div className="font-black text-lg text-[#161426]">
                        {formatMoney(st?.cash || 0)}
                      </div>
                      <div className="text-[11px] font-bold text-slate-700">
                        {isAr
                          ? `${st?.collectedItems.length || 0} غنائم`
                          : `${st?.collectedItems.length || 0} loot items`}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>

          <div className="pt-3 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() =>
                onUpdateGameData(buildInitialCashNGunsState(activePlayers))
              }
              className="px-6 py-3.5 rounded-2xl bg-[#8ac926] hover:bg-[#7ab81e] text-[#161426] font-black text-base border-4 border-[#161426] shadow-[0_5px_0_#161426] active:translate-y-1 transition-all inline-flex items-center gap-2"
            >
              <ArrowsClockwise weight="bold" className="w-5 h-5" />
              <span>{isAr ? 'سرقة جديدة!' : 'Play Another Heist!'}</span>
            </button>
            <button
              type="button"
              onClick={onStartNewRound}
              className="px-5 py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-[#161426] font-black text-sm border-4 border-[#161426] shadow-[0_5px_0_#161426]"
            >
              {isAr ? 'العودة للغرفة' : 'Back to Room'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CashNGunsGame;
