import React, { useState } from 'react';
import confetti from 'canvas-confetti';

export type DiscType = 'rose' | 'skull';

export type SkullPhase =
  | 'placing'
  | 'bidding'
  | 'flipping'
  | 'round_result'
  | 'game_over';

export interface FlippedDiscRecord {
  ownerId: string;
  stackIndex: number; // index inside playerStacks[ownerId] (top is length - 1)
  type: DiscType;
}

export interface SkullGameState {
  phase: SkullPhase;
  roundNumber: number;
  activePlayerIds: string[]; // players who still have >= 1 disc in ownedDiscs
  currentTurnId: string;
  // Total discs each player still owns in the match (starts at ['rose','rose','rose','skull'])
  ownedDiscs: Record<string, DiscType[]>;
  // Discs remaining in each player's hand this round
  handDiscs: Record<string, DiscType[]>;
  // Discs placed face-down on each player's mat this round (bottom to top)
  playerStacks: Record<string, DiscType[]>;
  // Discs flipped face-up during the 'flipping' phase
  flippedDiscs: FlippedDiscRecord[];
  // Bidding state
  currentBid: number;
  highBidderId: string | null;
  passedPlayerIds: string[];
  // Match mats won (first to 2 wins the game!)
  matchWins: Record<string, number>;
  // Round result summary
  roundOutcome: 'challenge_won' | 'skull_hit' | null;
  skullOwnerId: string | null;
  lostDiscType: DiscType | null;
  winnerId: string | null;
  winReason: 'two_mats' | 'last_survivor' | null;
  lastActionTextAr: string;
  lastActionTextEn: string;
}

export interface SkullPlayerInfo {
  id: string;
  name: string;
  avatar_color: string;
  score: number;
}

export interface SkullGameProps {
  gameData: SkullGameState;
  players: SkullPlayerInfo[];
  myPlayerId: string;
  isHost: boolean;
  isPassAndPlay: boolean;
  lang: 'ar' | 'en';
  onUpdateGameData: (nextData: SkullGameState, scoreAwards?: Record<string, number>) => void;
  onStartNewRound: () => void;
}

export function buildInitialSkullState(
  players: { id: string; name: string; avatar_color?: string; score?: number }[]
): SkullGameState {
  const validPlayers =
    players.length >= 2
      ? players
      : [
          ...players,
          ...Array.from({ length: Math.max(0, 2 - players.length) }, (_, idx) => ({
            id: `bot_fallback_${idx + 1}`,
            name: idx === 0 ? 'لاعب ١' : 'لاعب ٢',
            avatar_color: idx === 0 ? '#E11D48' : '#7C3AED',
            score: 0,
          })),
        ];

  const activePlayerIds = validPlayers.map((p) => p.id);
  const ownedDiscs: Record<string, DiscType[]> = {};
  const handDiscs: Record<string, DiscType[]> = {};
  const playerStacks: Record<string, DiscType[]> = {};
  const matchWins: Record<string, number> = {};

  for (const p of validPlayers) {
    const startPool: DiscType[] = ['rose', 'rose', 'rose', 'skull'];
    ownedDiscs[p.id] = [...startPool];
    handDiscs[p.id] = [...startPool];
    playerStacks[p.id] = [];
    matchWins[p.id] = 0;
  }

  return {
    phase: 'placing',
    roundNumber: 1,
    activePlayerIds,
    currentTurnId: activePlayerIds[0] || '',
    ownedDiscs,
    handDiscs,
    playerStacks,
    flippedDiscs: [],
    currentBid: 0,
    highBidderId: null,
    passedPlayerIds: [],
    matchWins,
    roundOutcome: null,
    skullOwnerId: null,
    lostDiscType: null,
    winnerId: null,
    winReason: null,
    lastActionTextAr: 'بدأت الجولة! على كل لاعب وضع قرص واحد مقلوب أولاً.',
    lastActionTextEn: 'Round started! Every player must first place 1 face-down disc.',
  };
}

// ============================================================================
// CUSTOM ORNATE SVG MEDALLIONS (ZERO EMOJIS)
// ============================================================================

export const RoseDiscSvg: React.FC<{ size?: number; className?: string }> = ({
  size = 88,
  className = '',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 120 120"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Outer Coaster Shadow & Base */}
    <circle cx="60" cy="63" r="54" fill="#161426" />
    <circle
      cx="60"
      cy="60"
      r="54"
      fill="#FFFBEB"
      stroke="#161426"
      strokeWidth="5"
    />
    {/* Ornate Gold Rim */}
    <circle
      cx="60"
      cy="60"
      r="47"
      fill="#FEF3C7"
      stroke="#D97706"
      strokeWidth="3"
      strokeDasharray="6 3"
    />
    <circle
      cx="60"
      cy="60"
      r="41"
      fill="#FFF1F2"
      stroke="#161426"
      strokeWidth="3"
    />

    {/* Compass Gold Filigree Points */}
    <path
      d="M60 10L63 18L57 18Z M60 110L63 102L57 102Z M10 60L18 63L18 57Z M110 60L102 63L102 57Z"
      fill="#D97706"
    />

    {/* Emerald Botanical Leaves Behind Rose */}
    <path
      d="M28 72C24 58 34 48 44 52C36 62 34 70 28 72Z"
      fill="#10B981"
      stroke="#161426"
      strokeWidth="2.8"
      strokeLinejoin="round"
    />
    <path
      d="M92 72C96 58 86 48 76 52C84 62 86 70 92 72Z"
      fill="#10B981"
      stroke="#161426"
      strokeWidth="2.8"
      strokeLinejoin="round"
    />
    <path
      d="M42 88C34 84 32 72 42 68C44 76 46 82 42 88Z"
      fill="#059669"
      stroke="#161426"
      strokeWidth="2.8"
      strokeLinejoin="round"
    />
    <path
      d="M78 88C86 84 88 72 78 68C76 76 74 82 78 88Z"
      fill="#059669"
      stroke="#161426"
      strokeWidth="2.8"
      strokeLinejoin="round"
    />

    {/* Outer Crimson Rose Petals */}
    <path
      d="M60 27C44 27 33 40 36 56C39 72 50 84 60 86C70 84 81 72 84 56C87 40 76 27 60 27Z"
      fill="#E11D48"
      stroke="#161426"
      strokeWidth="3.2"
    />
    <path
      d="M35 50C32 65 44 80 60 83C49 72 45 58 35 50Z"
      fill="#BE123C"
      stroke="#161426"
      strokeWidth="2.6"
      strokeLinejoin="round"
    />
    <path
      d="M85 50C88 65 76 80 60 83C71 72 75 58 85 50Z"
      fill="#BE123C"
      stroke="#161426"
      strokeWidth="2.6"
      strokeLinejoin="round"
    />

    {/* Inner Velvet Rose Bud Layers */}
    <path
      d="M60 34C48 34 41 44 44 56C47 67 54 73 60 75C66 73 73 67 76 56C79 44 72 34 60 34Z"
      fill="#F43F5E"
      stroke="#161426"
      strokeWidth="3"
    />
    <path
      d="M60 41C52 41 48 48 50 55C52 62 57 66 60 66C63 66 68 62 70 55C72 48 68 41 60 41Z"
      fill="#FB7185"
      stroke="#161426"
      strokeWidth="2.8"
    />
    {/* Center Spiral */}
    <path
      d="M55 51C55 47 60 45 64 48C67 51 65 57 60 58C56 59 53 55 56 52"
      stroke="#FFF1F2"
      strokeWidth="2.8"
      strokeLinecap="round"
    />
    <circle cx="60" cy="52" r="2.5" fill="#FDE68A" />
  </svg>
);

export const SkullDiscSvg: React.FC<{ size?: number; className?: string }> = ({
  size = 88,
  className = '',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 120 120"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Outer Coaster Shadow & Base */}
    <circle cx="60" cy="63" r="54" fill="#161426" />
    <circle
      cx="60"
      cy="60"
      r="54"
      fill="#1E1B2E"
      stroke="#161426"
      strokeWidth="5"
    />
    {/* Crimson / Gold Ornate Gothic Rim */}
    <circle
      cx="60"
      cy="60"
      r="47"
      fill="#31102F"
      stroke="#F59E0B"
      strokeWidth="2.8"
      strokeDasharray="5 3"
    />
    <circle
      cx="60"
      cy="60"
      r="41"
      fill="#161426"
      stroke="#E11D48"
      strokeWidth="2.8"
    />

    {/* Decorative Marigold / Gothic Petals Around Skull */}
    <circle cx="32" cy="42" r="7" fill="#E11D48" stroke="#161426" strokeWidth="2.5" />
    <circle cx="88" cy="42" r="7" fill="#E11D48" stroke="#161426" strokeWidth="2.5" />
    <circle cx="30" cy="66" r="6" fill="#D97706" stroke="#161426" strokeWidth="2.5" />
    <circle cx="90" cy="66" r="6" fill="#D97706" stroke="#161426" strokeWidth="2.5" />

    {/* Crossed Bones Hint Behind */}
    <path
      d="M28 84L92 32M92 84L28 32"
      stroke="#FDE68A"
      strokeWidth="4.5"
      strokeLinecap="round"
    />

    {/* Royal Calavera Skull Silhouette */}
    <path
      d="M60 24C41 24 31 37 31 53C31 63 36 70 42 74L44 88C44 91 47 93 50 93H70C73 93 76 91 76 88L78 74C84 70 89 63 89 53C89 37 79 24 60 24Z"
      fill="#FFFBEB"
      stroke="#161426"
      strokeWidth="4"
      strokeLinejoin="round"
    />

    {/* Forehead Crown / Marigold Emblem */}
    <path
      d="M51 36L55 30L60 35L65 30L69 36"
      stroke="#E11D48"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="60" cy="39" r="3" fill="#F59E0B" />

    {/* Glowing Amber / Crimson Eye Sockets */}
    <circle
      cx="47"
      cy="54"
      r="9"
      fill="#161426"
      stroke="#E11D48"
      strokeWidth="2.2"
    />
    <circle
      cx="73"
      cy="54"
      r="9"
      fill="#161426"
      stroke="#E11D48"
      strokeWidth="2.2"
    />
    <circle cx="47" cy="54" r="4" fill="#F59E0B" />
    <circle cx="73" cy="54" r="4" fill="#F59E0B" />
    <circle cx="45.5" cy="52.5" r="1.5" fill="#FEF3C7" />
    <circle cx="71.5" cy="52.5" r="1.5" fill="#FEF3C7" />

    {/* Inverted Heart Nasal Cavity */}
    <path
      d="M60 60L55 68H65L60 60Z"
      fill="#161426"
      stroke="#161426"
      strokeWidth="2"
      strokeLinejoin="round"
    />

    {/* Ornate Cheek Swirls */}
    <path
      d="M36 62C39 66 43 66 45 63 M84 62C81 66 77 66 75 63"
      stroke="#7C3AED"
      strokeWidth="2.5"
      strokeLinecap="round"
    />

    {/* Stitched Jaw Teeth */}
    <line x1="48" y1="81" x2="72" y2="81" stroke="#161426" strokeWidth="3.2" />
    <line x1="52" y1="76" x2="52" y2="89" stroke="#161426" strokeWidth="3" />
    <line x1="60" y1="76" x2="60" y2="90" stroke="#161426" strokeWidth="3" />
    <line x1="68" y1="76" x2="68" y2="89" stroke="#161426" strokeWidth="3" />
  </svg>
);

export const BackDiscSvg: React.FC<{
  size?: number;
  accentColor?: string;
  badgeNumber?: number;
  className?: string;
}> = ({ size = 88, accentColor = '#7C3AED', badgeNumber, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 120 120"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Coaster Shadow & Base */}
    <circle cx="60" cy="63" r="54" fill="#161426" />
    <circle
      cx="60"
      cy="60"
      r="54"
      fill={accentColor}
      stroke="#161426"
      strokeWidth="5"
    />
    {/* Mandala Geometric Rings */}
    <circle
      cx="60"
      cy="60"
      r="45"
      fill="#161426"
      fillOpacity="0.22"
      stroke="#FDE68A"
      strokeWidth="2.8"
      strokeDasharray="7 4"
    />
    <circle
      cx="60"
      cy="60"
      r="36"
      fill="#161426"
      stroke="#F59E0B"
      strokeWidth="3"
    />
    {/* 8-Point Starburst */}
    <path
      d="M60 28L66 50L88 44L72 60L88 76L66 70L60 92L54 70L32 76L48 60L32 44L54 50Z"
      fill="#F59E0B"
      fillOpacity="0.28"
      stroke="#FDE68A"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <circle
      cx="60"
      cy="60"
      r="17"
      fill="#FFFBEB"
      stroke="#161426"
      strokeWidth="3.5"
    />
    {badgeNumber !== undefined ? (
      <text
        x="60"
        y="66"
        textAnchor="middle"
        fill="#161426"
        fontSize="19"
        fontWeight="900"
        fontFamily="sans-serif"
      >
        {badgeNumber}
      </text>
    ) : (
      <path
        d="M56 54C56 51 58.5 49 61.5 49C64.5 49 66.5 51 66.5 53.8C66.5 56 64.5 57.3 62.5 58.5C61 59.3 60.5 60.5 60.5 62.2M60.5 67.5H60.6"
        stroke="#161426"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
    )}
  </svg>
);

const MatCrownIcon: React.FC<{ won: boolean; size?: number }> = ({
  won,
  size = 22,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 28 28"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect
      x="3"
      y="4"
      width="22"
      height="20"
      rx="5"
      fill={won ? '#F59E0B' : '#E2E8F0'}
      stroke="#161426"
      strokeWidth="2.5"
    />
    <path
      d="M7 18L9 10L14 14L19 10L21 18H7Z"
      fill={won ? '#FFFBEB' : '#94A3B8'}
      stroke="#161426"
      strokeWidth="2"
      strokeLinejoin="round"
    />
  </svg>
);

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getTotalDiscsOnTable(stacks: Record<string, DiscType[]>): number {
  return Object.values(stacks).reduce((sum, st) => sum + (st ? st.length : 0), 0);
}

function getNextTurnPlayerId(
  currentId: string,
  activeIds: string[],
  excludedIds: string[] = []
): string {
  const eligible = activeIds.filter((id) => !excludedIds.includes(id));
  if (eligible.length === 0) return currentId;
  const idx = activeIds.indexOf(currentId);
  if (idx === -1) return eligible[0];
  for (let offset = 1; offset <= activeIds.length; offset++) {
    const candidate = activeIds[(idx + offset) % activeIds.length];
    if (!excludedIds.includes(candidate)) {
      return candidate;
    }
  }
  return eligible[0];
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const SkullGame: React.FC<SkullGameProps> = ({
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
  const [selectedBid, setSelectedBid] = useState<number>(1);
  const [passAndPlayHandOpen, setPassAndPlayHandOpen] = useState<boolean>(false);
  const [showRulesModal, setShowRulesModal] = useState<boolean>(false);

  // Safe fallbacks if gameData is partially initialized
  const activePlayerIds = gameData?.activePlayerIds || players.map((p) => p.id);
  const ownedDiscs = gameData?.ownedDiscs || {};
  const handDiscs = gameData?.handDiscs || {};
  const playerStacks = gameData?.playerStacks || {};
  const flippedDiscs = gameData?.flippedDiscs || [];
  const matchWins = gameData?.matchWins || {};
  const passedPlayerIds = gameData?.passedPlayerIds || [];
  const phase: SkullPhase = gameData?.phase || 'placing';
  const currentTurnId = gameData?.currentTurnId || activePlayerIds[0] || '';
  const highBidderId = gameData?.highBidderId || null;
  const currentBid = gameData?.currentBid || 0;

  const getPlayerInfo = (id: string): SkullPlayerInfo => {
    const found = players.find((p) => p.id === id);
    if (found) return found;
    return {
      id,
      name: isAr ? 'لاعب' : 'Player',
      avatar_color: '#7C3AED',
      score: 0,
    };
  };

  // Determine who controls the UI right now
  const effectiveActorId =
    phase === 'flipping'
      ? highBidderId || currentTurnId
      : isPassAndPlay
      ? currentTurnId
      : myPlayerId;

  const isMyActionTurn =
    phase === 'flipping'
      ? isPassAndPlay || myPlayerId === highBidderId
      : isPassAndPlay || myPlayerId === currentTurnId;

  const totalDiscsOnTable = getTotalDiscsOnTable(playerStacks);

  // Check if all active players have placed at least 1 disc on their mat
  const allActiveHavePlacedOne = activePlayerIds.every(
    (id) => (playerStacks[id]?.length || 0) >= 1
  );

  // Check how many unflipped discs the Challenger still has on their OWN stack
  const challengerStack = highBidderId ? playerStacks[highBidderId] || [] : [];
  const challengerFlippedIndices = flippedDiscs
    .filter((f) => f.ownerId === highBidderId)
    .map((f) => f.stackIndex);
  const challengerUnflippedCount =
    challengerStack.length - challengerFlippedIndices.length;
  const mustFlipOwnFirst =
    phase === 'flipping' && challengerUnflippedCount > 0;

  const rosesFlippedCount = flippedDiscs.filter((f) => f.type === 'rose').length;
  const remainingFlipsNeeded = Math.max(0, currentBid - rosesFlippedCount);

  // Keep selectedBid valid when phase/bid updates
  const minAllowedBid = phase === 'bidding' ? currentBid + 1 : 1;
  const effectiveBidChoice = Math.min(
    Math.max(selectedBid, minAllowedBid),
    Math.max(minAllowedBid, totalDiscsOnTable)
  );

  // ==========================================================================
  // GAMEPLAY ACTIONS
  // ==========================================================================

  const handlePlaceDisc = (discIndexInHand: number) => {
    if (phase !== 'placing' || !isMyActionTurn) return;
    const actorId = currentTurnId;
    const actorHand = [...(handDiscs[actorId] || [])];
    if (discIndexInHand < 0 || discIndexInHand >= actorHand.length) return;

    const [chosenDisc] = actorHand.splice(discIndexInHand, 1);
    const nextHandDiscs = {
      ...handDiscs,
      [actorId]: actorHand,
    };
    const nextStacks = {
      ...playerStacks,
      [actorId]: [...(playerStacks[actorId] || []), chosenDisc],
    };

    const actorName = getPlayerInfo(actorId).name;

    // Find next player in placing phase
    // Note: if the next player has 0 discs in hand AND everyone has placed >=1 disc, they can still bid on their turn!
    const nextTurnId = getNextTurnPlayerId(actorId, activePlayerIds);

    setPassAndPlayHandOpen(false);

    onUpdateGameData({
      ...gameData,
      handDiscs: nextHandDiscs,
      playerStacks: nextStacks,
      currentTurnId: nextTurnId,
      lastActionTextAr: `وضع ${actorName} قرصاً مقلوباً على طاولته.`,
      lastActionTextEn: `${actorName} placed a face-down disc on their mat.`,
    });
  };

  const handleStartOrRaiseBid = (bidAmount: number) => {
    if ((phase !== 'placing' && phase !== 'bidding') || !isMyActionTurn) return;
    if (phase === 'placing' && !allActiveHavePlacedOne) return;
    if (bidAmount < minAllowedBid || bidAmount > totalDiscsOnTable) return;

    const actorId = currentTurnId;
    const actorName = getPlayerInfo(actorId).name;
    setPassAndPlayHandOpen(false);

    // If someone bids the maximum possible discs on table, immediately enter 'flipping'!
    if (bidAmount >= totalDiscsOnTable) {
      onUpdateGameData({
        ...gameData,
        phase: 'flipping',
        currentBid: bidAmount,
        highBidderId: actorId,
        currentTurnId: actorId,
        lastActionTextAr: `زايد ${actorName} بأقصى عدد (${bidAmount})! حان وقت كشف الأقراص — يجب كشف أقراصك أولاً!`,
        lastActionTextEn: `${actorName} bid the maximum (${bidAmount})! Time to flip — must flip own discs first!`,
      });
      return;
    }

    const nextTurnId = getNextTurnPlayerId(
      actorId,
      activePlayerIds,
      passedPlayerIds
    );

    onUpdateGameData({
      ...gameData,
      phase: 'bidding',
      currentBid: bidAmount,
      highBidderId: actorId,
      currentTurnId: nextTurnId,
      lastActionTextAr: `زايد ${actorName} بـ ${bidAmount} ورود! من يرفع التحدي؟`,
      lastActionTextEn: `${actorName} challenged for ${bidAmount} Roses! Raise or Pass?`,
    });
  };

  const handlePassBid = () => {
    if (phase !== 'bidding' || !isMyActionTurn) return;
    const actorId = currentTurnId;
    const actorName = getPlayerInfo(actorId).name;
    const nextPassed = passedPlayerIds.includes(actorId)
      ? passedPlayerIds
      : [...passedPlayerIds, actorId];

    const remainingBidders = activePlayerIds.filter(
      (id) => !nextPassed.includes(id)
    );

    setPassAndPlayHandOpen(false);

    // If only 1 player remains (the highBidderId), transition immediately to 'flipping'!
    if (remainingBidders.length <= 1 && highBidderId) {
      const challengerName = getPlayerInfo(highBidderId).name;
      onUpdateGameData({
        ...gameData,
        phase: 'flipping',
        passedPlayerIds: nextPassed,
        currentTurnId: highBidderId,
        lastActionTextAr: `انسحب الجميع! على ${challengerName} كشف ${currentBid} ورود (ابدأ بأقراصك أولاً!).`,
        lastActionTextEn: `Everyone passed! ${challengerName} must flip ${currentBid} Roses (start with your own stack!).`,
      });
      return;
    }

    const nextTurnId = getNextTurnPlayerId(actorId, activePlayerIds, nextPassed);
    onUpdateGameData({
      ...gameData,
      passedPlayerIds: nextPassed,
      currentTurnId: nextTurnId,
      lastActionTextAr: `انسحب ${actorName} من المزايدة.`,
      lastActionTextEn: `${actorName} passed.`,
    });
  };

  const handleFlipStackTopDisc = (targetOwnerId: string) => {
    if (phase !== 'flipping' || !highBidderId || !isMyActionTurn) return;

    // GOLDEN RULE ENFORCEMENT: Challenger MUST flip all their own unflipped discs first!
    if (mustFlipOwnFirst && targetOwnerId !== highBidderId) {
      return;
    }

    const targetStack = playerStacks[targetOwnerId] || [];
    if (targetStack.length === 0) return;

    // Find the topmost unflipped disc index in targetStack (from length - 1 down to 0)
    const alreadyFlippedIndices = flippedDiscs
      .filter((f) => f.ownerId === targetOwnerId)
      .map((f) => f.stackIndex);

    let topUnflippedIndex = -1;
    for (let i = targetStack.length - 1; i >= 0; i--) {
      if (!alreadyFlippedIndices.includes(i)) {
        topUnflippedIndex = i;
        break;
      }
    }

    if (topUnflippedIndex === -1) return; // All discs in this stack are already flipped

    const revealedType = targetStack[topUnflippedIndex];
    const nextFlipped: FlippedDiscRecord[] = [
      ...flippedDiscs,
      {
        ownerId: targetOwnerId,
        stackIndex: topUnflippedIndex,
        type: revealedType,
      },
    ];

    const challengerName = getPlayerInfo(highBidderId).name;
    const ownerName = getPlayerInfo(targetOwnerId).name;

    // CASE 1: SKULL HIT!
    if (revealedType === 'skull') {
      const challengerPool = [...(ownedDiscs[highBidderId] || [])];
      let lostType: DiscType | null = null;
      if (challengerPool.length > 0) {
        const randIdx = Math.floor(Math.random() * challengerPool.length);
        const [removed] = challengerPool.splice(randIdx, 1);
        lostType = removed;
      }

      const nextOwnedDiscs = {
        ...ownedDiscs,
        [highBidderId]: challengerPool,
      };

      const nextActiveIds = activePlayerIds.filter(
        (id) => (nextOwnedDiscs[id]?.length || 0) > 0
      );

      // Award +1 bonus leaderboard point to the skull trap owner (if not self-hit)
      const scoreAwards: Record<string, number> = {};
      if (targetOwnerId !== highBidderId) {
        scoreAwards[targetOwnerId] = 1;
      }

      // Check if only 1 player survives with discs left!
      if (nextActiveIds.length === 1) {
        const survivorId = nextActiveIds[0];
        const survivorName = getPlayerInfo(survivorId).name;
        scoreAwards[survivorId] = (scoreAwards[survivorId] || 0) + 3;
        try {
          confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
        } catch {
          // ignore confetti errors
        }
        onUpdateGameData(
          {
            ...gameData,
            phase: 'game_over',
            ownedDiscs: nextOwnedDiscs,
            activePlayerIds: nextActiveIds,
            flippedDiscs: nextFlipped,
            roundOutcome: 'skull_hit',
            skullOwnerId: targetOwnerId,
            lostDiscType: lostType,
            winnerId: survivorId,
            winReason: 'last_survivor',
            lastActionTextAr: `اصطدم ${challengerName} بجمجمة ${ownerName} وخرج من اللعبة! فاز ${survivorName} لأنه الناجي الأخير!`,
            lastActionTextEn: `${challengerName} hit ${ownerName}'s Skull and was eliminated! ${survivorName} wins as the last survivor!`,
          },
          scoreAwards
        );
        return;
      }

      onUpdateGameData(
        {
          ...gameData,
          phase: 'round_result',
          ownedDiscs: nextOwnedDiscs,
          activePlayerIds: nextActiveIds,
          flippedDiscs: nextFlipped,
          roundOutcome: 'skull_hit',
          skullOwnerId: targetOwnerId,
          lostDiscType: lostType,
          lastActionTextAr:
            targetOwnerId === highBidderId
              ? `فخ ذاتي! كشف ${challengerName} جمجمته الخاصة وخسر قرصاً عشوائياً للأبد!`
              : `فخ قاتل! اصطدم ${challengerName} بجمجمة ${ownerName} وخسر قرصاً عشوائياً للأبد!`,
          lastActionTextEn:
            targetOwnerId === highBidderId
              ? `Self-trap! ${challengerName} flipped their own Skull and permanently lost a random disc!`
              : `Trap sprung! ${challengerName} hit ${ownerName}'s Skull and permanently lost a random disc!`,
        },
        Object.keys(scoreAwards).length > 0 ? scoreAwards : undefined
      );
      return;
    }

    // CASE 2: ROSE FLIPPED!
    const totalRosesNow = nextFlipped.filter((f) => f.type === 'rose').length;
    if (totalRosesNow >= currentBid) {
      // Challenge Won!
      const prevWins = matchWins[highBidderId] || 0;
      const newWins = prevWins + 1;
      const nextMatchWins = {
        ...matchWins,
        [highBidderId]: newWins,
      };

      const scoreAwards: Record<string, number> = {
        [highBidderId]: newWins >= 2 ? 3 : 1,
      };

      try {
        confetti({ particleCount: newWins >= 2 ? 120 : 60, spread: 70, origin: { y: 0.6 } });
      } catch {
        // ignore
      }

      if (newWins >= 2) {
        onUpdateGameData(
          {
            ...gameData,
            phase: 'game_over',
            flippedDiscs: nextFlipped,
            matchWins: nextMatchWins,
            roundOutcome: 'challenge_won',
            winnerId: highBidderId,
            winReason: 'two_mats',
            lastActionTextAr: `نجح ${challengerName} في كشف ${currentBid} ورود وحصد البساط الثاني ليفوز بالمباراة!`,
            lastActionTextEn: `${challengerName} flipped all ${currentBid} Roses and won their 2nd Mat to claim victory!`,
          },
          scoreAwards
        );
        return;
      }

      onUpdateGameData(
        {
          ...gameData,
          phase: 'round_result',
          flippedDiscs: nextFlipped,
          matchWins: nextMatchWins,
          roundOutcome: 'challenge_won',
          lastActionTextAr: `تحدٍ ناجح! كشف ${challengerName} كل الورود الـ ${currentBid} وكسب نقطة بساط (١/٢)!`,
          lastActionTextEn: `Challenge succeeded! ${challengerName} flipped all ${currentBid} Roses and earned a Mat point (1/2)!`,
        },
        scoreAwards
      );
      return;
    }

    // Still need more flips
    onUpdateGameData({
      ...gameData,
      flippedDiscs: nextFlipped,
      lastActionTextAr: `كشف ${challengerName} وردة من طاولة ${ownerName}! (${totalRosesNow} من ${currentBid})`,
      lastActionTextEn: `${challengerName} revealed a Rose from ${ownerName}'s mat! (${totalRosesNow}/${currentBid})`,
    });
  };

  const handleNextRound = () => {
    const nextHandDiscs: Record<string, DiscType[]> = {};
    const nextStacks: Record<string, DiscType[]> = {};

    for (const pid of activePlayerIds) {
      nextHandDiscs[pid] = [...(ownedDiscs[pid] || [])];
      nextStacks[pid] = [];
    }

    // According to authentic Skull rules:
    // - If the Challenger won the challenge, they start the next round.
    // - If the Challenger hit a Skull, the owner of that Skull starts the next round (if still active, else next active player).
    let nextStarter = activePlayerIds[0] || '';
    if (gameData.roundOutcome === 'challenge_won' && highBidderId && activePlayerIds.includes(highBidderId)) {
      nextStarter = highBidderId;
    } else if (gameData.roundOutcome === 'skull_hit' && gameData.skullOwnerId) {
      if (activePlayerIds.includes(gameData.skullOwnerId)) {
        nextStarter = gameData.skullOwnerId;
      } else if (highBidderId) {
        nextStarter = getNextTurnPlayerId(highBidderId, activePlayerIds);
      }
    }

    setPassAndPlayHandOpen(false);
    setSelectedBid(1);

    onUpdateGameData({
      ...gameData,
      phase: 'placing',
      roundNumber: (gameData.roundNumber || 1) + 1,
      currentTurnId: nextStarter,
      handDiscs: nextHandDiscs,
      playerStacks: nextStacks,
      flippedDiscs: [],
      currentBid: 0,
      highBidderId: null,
      passedPlayerIds: [],
      roundOutcome: null,
      skullOwnerId: null,
      lostDiscType: null,
      lastActionTextAr: `بدأت الجولة ${(gameData.roundNumber || 1) + 1}! على كل لاعب وضع قرص واحد مقلوب أولاً.`,
      lastActionTextEn: `Round ${(gameData.roundNumber || 1) + 1} started! Every player must place 1 face-down disc first.`,
    });
  };

  // ==========================================================================
  // RENDER HELPERS
  // ==========================================================================

  const activeTurnPlayer = getPlayerInfo(currentTurnId);
  const challengerPlayer = highBidderId ? getPlayerInfo(highBidderId) : null;
  const myHand = handDiscs[effectiveActorId] || [];
  const myOwned = ownedDiscs[effectiveActorId] || [];

  return (
    <div
      dir={isAr ? 'rtl' : 'ltr'}
      className="w-full max-w-6xl mx-auto px-3 py-4 sm:px-6 flex flex-col gap-5 select-none"
    >
      {/* TOP HEADER BAR: GAME TITLE, ROUND, MATS GOAL & RULES BUTTON */}
      <div className="bg-[#FFFBEB] border-4 border-[#161426] rounded-3xl p-4 sm:p-5 shadow-[0_6px_0_#161426] flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-14 h-14 rounded-2xl bg-[#161426] border-3 border-[#161426] flex items-center justify-center shrink-0 shadow-[0_4px_0_#E11D48]">
            <RoseDiscSvg size={46} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-black text-[#161426] tracking-tight">
                {isAr ? 'الجمجمة والورد' : 'Skull & Roses'}
              </h2>
              <span className="px-2.5 py-0.5 text-xs font-black rounded-full bg-[#E11D48] text-white border-2 border-[#161426]">
                {isAr ? `الجولة ${gameData.roundNumber || 1}` : `Round ${gameData.roundNumber || 1}`}
              </span>
            </div>
            <p className="text-xs sm:text-sm font-bold text-[#475569] mt-0.5">
              {isAr
                ? 'لعبة الخداع الجريء — اجمع نقطتين (بساطين) بالورود أو أوقع خصومك في فخ الجمجمة!'
                : 'High-stakes bluffing — win 2 Mat points with Roses or trap challengers with your Skull!'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="px-3.5 py-2 rounded-2xl bg-[#FEF3C7] border-3 border-[#161426] shadow-[0_3px_0_#161426] text-center">
            <span className="block text-[11px] font-extrabold text-[#92400E] uppercase">
              {isAr ? 'الأقراص على الطاولة' : 'Discs on Table'}
            </span>
            <span className="text-lg font-black text-[#161426]">
              {totalDiscsOnTable}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setShowRulesModal((v) => !v)}
            className="px-4 py-2.5 rounded-2xl bg-[#7C3AED] hover:bg-[#6D28D9] active:translate-y-0.5 text-white font-black text-xs sm:text-sm border-3 border-[#161426] shadow-[0_4px_0_#161426] transition cursor-pointer"
          >
            {isAr ? 'قوانين اللعبة' : 'How to Play'}
          </button>
        </div>
      </div>

      {/* COLLAPSIBLE RULES MODAL / BANNER */}
      {showRulesModal && (
        <div className="bg-[#1E1B2E] text-[#FFFBEB] border-4 border-[#161426] rounded-3xl p-5 shadow-[0_6px_0_#161426] flex flex-col gap-3">
          <div className="flex items-center justify-between border-b-2 border-white/15 pb-2">
            <h3 className="text-base sm:text-lg font-black text-[#FDE68A]">
              {isAr ? 'القوانين الرسمية للعبة الجمجمة والورد (Skull)' : 'Official Skull & Roses Rules'}
            </h3>
            <button
              type="button"
              onClick={() => setShowRulesModal(false)}
              className="px-3 py-1 rounded-xl bg-[#E11D48] text-white text-xs font-black border-2 border-[#161426] cursor-pointer"
            >
              {isAr ? 'إغلاق' : 'Close'}
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs sm:text-sm font-bold leading-relaxed">
            <div className="bg-white/10 rounded-2xl p-3.5 border-2 border-white/15">
              <div className="text-[#FB7185] font-black mb-1">
                {isAr ? '١. وضع الأقراص والمزايدة' : '1. Place or Challenge'}
              </div>
              <p className="text-white/90">
                {isAr
                  ? 'يبدأ كل لاعب بـ ٣ ورود وجمجمة واحدة. في بداية الجولة يضع كل لاعب قرصاً مقلوباً. بعدها في دورك يمكنك إما إضافة قرص جديد فوق كومتك أو بدء المزايدة بعدد الورود التي تتحدى أنك تستطيع كشفها!'
                  : 'Every player starts with 3 Roses and 1 Skull. Everyone places 1 disc face-down. Then on your turn, either place another disc onto your stack OR start a Challenge Bid!'}
              </p>
            </div>
            <div className="bg-white/10 rounded-2xl p-3.5 border-2 border-white/15">
              <div className="text-[#FBBF24] font-black mb-1">
                {isAr ? '٢. القانون الذهبي للكشف' : '2. The Golden Flipping Rule'}
              </div>
              <p className="text-white/90">
                {isAr
                  ? 'صاحب أعلى مزايدة يصبح "المتحدي". يجب عليه إجبارياً كشف جميع الأقراص الموجودة في كومته الخاصة أولاً (من الأعلى للأسفل) قبل أن يلمس أي قرص من طاولات الخصوم!'
                  : 'The highest bidder becomes the Challenger. You MUST flip ALL discs in your OWN stack first (top-to-bottom) before flipping any disc from opponents!'}
              </p>
            </div>
            <div className="bg-white/10 rounded-2xl p-3.5 border-2 border-white/15">
              <div className="text-[#34D399] font-black mb-1">
                {isAr ? '٣. النصر أو عقوبة الجمجمة' : '3. Victory or Skull Penalty'}
              </div>
              <p className="text-white/90">
                {isAr
                  ? 'إذا كشفت العدد المطلوب من الورود بدون جمجمة تكسب نقطة بساط (أول من يصل لنقطتين يفوز!). أما إذا ظهرت جمجمة، تتوقف الجولة فوراً وتخسر قرصاً عشوائياً من أقراصك للأبد!'
                  : 'Flip your target Roses without hitting a Skull to win 1 Mat (first to 2 Mats wins!). Hit a Skull and your turn ends immediately — losing 1 random disc permanently!'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* LIVE PHASE & TURN BANNER */}
      <div
        className={`border-4 border-[#161426] rounded-3xl p-4 sm:p-5 shadow-[0_6px_0_#161426] transition-colors ${
          phase === 'flipping'
            ? 'bg-gradient-to-r from-[#881337] via-[#9F1239] to-[#4C0519] text-white'
            : phase === 'bidding'
            ? 'bg-gradient-to-r from-[#FEF3C7] via-[#FDE68A] to-[#FCD34D] text-[#161426]'
            : 'bg-white text-[#161426]'
        }`}
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span
              className="w-4 h-4 rounded-full border-2 border-[#161426] shrink-0 animate-pulse"
              style={{
                backgroundColor:
                  phase === 'flipping'
                    ? '#F59E0B'
                    : activeTurnPlayer.avatar_color || '#E11D48',
              }}
            />
            <div>
              <div className="text-xs font-black uppercase tracking-wider opacity-80">
                {phase === 'placing' &&
                  (allActiveHavePlacedOne
                    ? isAr
                      ? 'مرحلة التخطيط: ضع قرصاً أو ابدأ المزايدة'
                      : 'Planning Phase: Place a Disc or Start Bidding'
                    : isAr
                    ? 'البداية الإلزامية: قرص أول لكل لاعب'
                    : 'Opening Placement: First Disc Required')}
                {phase === 'bidding' &&
                  (isAr ? 'مرحلة المزايدة والتحدي!' : 'Bidding & Challenge Phase!')}
                {phase === 'flipping' &&
                  (isAr
                    ? 'مرحلة كشف الأقراص — القانون الذهبي مفعل!'
                    : 'Flipping Phase — Golden Rule Active!')}
                {phase === 'round_result' &&
                  (isAr ? 'نتيجة الجولة' : 'Round Result')}
                {phase === 'game_over' &&
                  (isAr ? 'نهاية المباراة!' : 'Match Complete!')}
              </div>
              <div className="text-base sm:text-xl font-black mt-0.5">
                {isAr ? gameData.lastActionTextAr : gameData.lastActionTextEn}
              </div>
            </div>
          </div>

          {/* Right Badge: Current Bid or Turn Indicator */}
          <div className="flex items-center gap-2.5 self-end md:self-center">
            {(phase === 'bidding' || phase === 'flipping') && challengerPlayer && (
              <div className="px-4 py-2 rounded-2xl bg-[#161426] text-[#FDE68A] border-2 border-white/25 flex items-center gap-2.5">
                <div className="text-xs font-bold">
                  {isAr ? 'أعلى مزايدة:' : 'High Bid:'}
                </div>
                <div className="text-lg font-black text-white">
                  {currentBid} {isAr ? 'ورود' : 'Roses'}
                </div>
                <span className="text-xs font-extrabold px-2 py-0.5 rounded-lg bg-[#E11D48] text-white">
                  {challengerPlayer.name}
                </span>
              </div>
            )}

            {phase === 'flipping' && (
              <div className="px-4 py-2 rounded-2xl bg-[#FFFBEB] text-[#161426] border-3 border-[#161426] font-black text-xs sm:text-sm">
                {isAr
                  ? `الورود المكشوفة: ${rosesFlippedCount} / ${currentBid}`
                  : `Roses Flipped: ${rosesFlippedCount} / ${currentBid}`}
              </div>
            )}
          </div>
        </div>

        {/* GOLDEN RULE WARNING STRIP DURING FLIPPING */}
        {phase === 'flipping' && challengerPlayer && (
          <div className="mt-3 pt-3 border-t-2 border-white/20 flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm font-black">
            {mustFlipOwnFirst ? (
              <div className="flex items-center gap-2 text-[#FDE68A]">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#F59E0B]" />
                <span>
                  {isAr
                    ? `القانون الذهبي: يجب على ${challengerPlayer.name} كشف جميع أقراصه (${challengerUnflippedCount} متبقية) قبل لمس أقراص الخصوم!`
                    : `Golden Rule: ${challengerPlayer.name} MUST flip all of their own discs (${challengerUnflippedCount} left) before clicking any opponent's mat!`}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-[#6EE7B7]">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#10B981]" />
                <span>
                  {isAr
                    ? `كشف ${challengerPlayer.name} كل أقراصه بنجاح! الآن اختر أي طاولة خصم لكشف أعلى قرص فيها (${remainingFlipsNeeded} متبقية).`
                    : `${challengerPlayer.name} cleared their own stack! Now click any opponent's mat to flip their topmost disc (${remainingFlipsNeeded} left).`}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* PLAYERS TABLE MATS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {players.map((player) => {
          const pid = player.id;
          const isEliminated = !activePlayerIds.includes(pid);
          const isCurrentTurn =
            (phase === 'placing' || phase === 'bidding') && currentTurnId === pid;
          const isChallenger = highBidderId === pid;
          const hasPassed = passedPlayerIds.includes(pid);
          const stack = playerStacks[pid] || [];
          const playerFlipped = flippedDiscs.filter((f) => f.ownerId === pid);
          const unflippedCount = stack.length - playerFlipped.length;
          const totalOwnedCount = (ownedDiscs[pid] || []).length;
          const inHandCount = (handDiscs[pid] || []).length;
          const wins = matchWins[pid] || 0;

          // Can the Challenger click this mat right now during 'flipping'?
          const isClickableForFlip =
            phase === 'flipping' &&
            isMyActionTurn &&
            unflippedCount > 0 &&
            (mustFlipOwnFirst ? pid === highBidderId : pid !== highBidderId);

          const isLockedByGoldenRule =
            phase === 'flipping' &&
            mustFlipOwnFirst &&
            pid !== highBidderId &&
            unflippedCount > 0;

          return (
            <div
              key={pid}
              onClick={() => {
                if (isClickableForFlip) {
                  handleFlipStackTopDisc(pid);
                }
              }}
              className={`relative rounded-3xl border-4 border-[#161426] p-4 transition-all flex flex-col justify-between min-h-[250px] ${
                isEliminated
                  ? 'bg-slate-200 opacity-65'
                  : isClickableForFlip
                  ? 'bg-[#FFFBEB] ring-4 ring-[#E11D48] shadow-[0_8px_0_#161426] -translate-y-1 cursor-pointer hover:bg-[#FEF3C7]'
                  : isCurrentTurn
                  ? 'bg-[#FEFCE8] ring-4 ring-[#7C3AED] shadow-[0_6px_0_#161426]'
                  : 'bg-white shadow-[0_6px_0_#161426]'
              }`}
            >
              {/* Player Header & Mat Score */}
              <div className="flex items-start justify-between gap-2 border-b-2 border-slate-200 pb-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="w-10 h-10 rounded-2xl border-3 border-[#161426] flex items-center justify-center text-white font-black text-sm shrink-0 shadow-[0_2px_0_#161426]"
                    style={{ backgroundColor: player.avatar_color || '#7C3AED' }}
                  >
                    {player.name.slice(0, 2)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-black text-[#161426] text-sm sm:text-base truncate">
                        {player.name}
                      </span>
                      {pid === myPlayerId && !isPassAndPlay && (
                        <span className="px-2 py-0.5 text-[10px] font-black rounded-md bg-[#161426] text-white">
                          {isAr ? 'أنت' : 'YOU'}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] font-bold text-slate-600 flex items-center gap-2 mt-0.5">
                      <span>
                        {isAr
                          ? `في اليد: ${inHandCount} / ${totalOwnedCount}`
                          : `Hand: ${inHandCount}/${totalOwnedCount}`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2 Mat Victory Slots */}
                <div className="flex items-center gap-1.5 shrink-0" title={isAr ? 'نقاط البساط (٢ للفوز)' : 'Mat Points (2 to win)'}>
                  <MatCrownIcon won={wins >= 1} />
                  <MatCrownIcon won={wins >= 2} />
                </div>
              </div>

              {/* Status Badges Row */}
              <div className="flex flex-wrap items-center gap-1.5 my-2 min-h-[26px]">
                {isEliminated && (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-slate-800 text-white">
                    {isAr ? 'خسر كل أقراصه' : 'Eliminated'}
                  </span>
                )}
                {isCurrentTurn && !isEliminated && (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-[#7C3AED] text-white border-2 border-[#161426]">
                    {isAr ? 'دوره الآن' : 'Current Turn'}
                  </span>
                )}
                {isChallenger && (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-[#E11D48] text-white border-2 border-[#161426]">
                    {isAr
                      ? `المتحدي (${currentBid} ورود)`
                      : `Challenger (${currentBid})`}
                  </span>
                )}
                {hasPassed && phase === 'bidding' && (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-slate-300 text-slate-800 border-2 border-[#161426]">
                    {isAr ? 'منسحب' : 'Passed'}
                  </span>
                )}
                {isLockedByGoldenRule && (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-amber-100 text-amber-900 border-2 border-amber-700">
                    {isAr ? 'مغلق حتى يكشف المتحدي أقراصه' : 'Locked: Flip own stack first'}
                  </span>
                )}
              </div>

              {/* Coaster Stack Display Area */}
              <div className="flex-1 flex flex-col items-center justify-center py-3 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-300 relative">
                {stack.length === 0 ? (
                  <div className="text-center py-4 px-2">
                    <div className="w-14 h-14 mx-auto rounded-full border-3 border-dashed border-slate-400 flex items-center justify-center text-slate-400 font-black text-xs">
                      0
                    </div>
                    <span className="block text-xs font-bold text-slate-400 mt-1.5">
                      {isAr ? 'لا توجد أقراص موضوعة' : 'No discs placed yet'}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center flex-wrap gap-2 px-2">
                    {stack.map((discType, idx) => {
                      const isFlipped = playerFlipped.some(
                        (f) => f.stackIndex === idx
                      );
                      const isTopUnflipped =
                        idx === stack.length - 1 - playerFlipped.length;

                      return (
                        <div
                          key={idx}
                          className={`relative transition-transform ${
                            isTopUnflipped && isClickableForFlip
                              ? 'scale-105 animate-bounce'
                              : ''
                          }`}
                        >
                          {isFlipped ? (
                            discType === 'rose' ? (
                              <RoseDiscSvg size={68} />
                            ) : (
                              <SkullDiscSvg size={68} />
                            )
                          ) : (
                            <BackDiscSvg
                              size={68}
                              accentColor={player.avatar_color || '#7C3AED'}
                              badgeNumber={idx + 1}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Flip Call-To-Action Button Overlay when clickable */}
                {isClickableForFlip && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleFlipStackTopDisc(pid);
                    }}
                    className="mt-2 px-4 py-1.5 rounded-xl bg-[#E11D48] hover:bg-[#BE123C] text-white font-black text-xs border-2 border-[#161426] shadow-[0_3px_0_#161426] cursor-pointer"
                  >
                    {pid === highBidderId
                      ? isAr
                        ? 'اكشف أعلى قرص من كومتك!'
                        : 'Flip Your Top Disc!'
                      : isAr
                      ? `اكشف أعلى قرص لـ ${player.name}`
                      : `Flip ${player.name}'s Top Disc`}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ROUND RESULT OR GAME OVER MODAL BANNER */}
      {(phase === 'round_result' || phase === 'game_over') && (
        <div
          className={`border-4 border-[#161426] rounded-3xl p-6 shadow-[0_8px_0_#161426] flex flex-col items-center text-center gap-4 ${
            gameData.roundOutcome === 'skull_hit'
              ? 'bg-gradient-to-b from-[#1E1B2E] to-[#31102F] text-white'
              : 'bg-gradient-to-b from-[#FEF3C7] to-[#FDE68A] text-[#161426]'
          }`}
        >
          <div className="flex items-center justify-center gap-3">
            {gameData.roundOutcome === 'skull_hit' ? (
              <SkullDiscSvg size={92} />
            ) : (
              <RoseDiscSvg size={92} />
            )}
          </div>

          <h3 className="text-2xl sm:text-3xl font-black">
            {phase === 'game_over'
              ? isAr
                ? `انتهت المباراة! الفائز: ${getPlayerInfo(gameData.winnerId || '').name}`
                : `Match Over! Winner: ${getPlayerInfo(gameData.winnerId || '').name}`
              : gameData.roundOutcome === 'skull_hit'
              ? isAr
                ? 'تم الاصطدام بالجمجمة!'
                : 'A Skull Was Hit!'
              : isAr
              ? 'نجح التحدي بالكامل!'
              : 'Challenge Succeeded!'}
          </h3>

          <p className="text-sm sm:text-base font-bold max-w-xl opacity-95">
            {isAr ? gameData.lastActionTextAr : gameData.lastActionTextEn}
          </p>

          {phase === 'round_result' && (
            <button
              type="button"
              onClick={handleNextRound}
              className="mt-1 px-7 py-3.5 rounded-2xl bg-[#10B981] hover:bg-[#059669] text-[#161426] font-black text-base border-3 border-[#161426] shadow-[0_5px_0_#161426] active:translate-y-0.5 transition cursor-pointer"
            >
              {isAr ? 'بدء الجولة التالية' : 'Start Next Round'}
            </button>
          )}

          {phase === 'game_over' && (isHost || isPassAndPlay) && (
            <button
              type="button"
              onClick={onStartNewRound}
              className="mt-1 px-7 py-3.5 rounded-2xl bg-[#E11D48] hover:bg-[#BE123C] text-white font-black text-base border-3 border-[#161426] shadow-[0_5px_0_#161426] active:translate-y-0.5 transition cursor-pointer"
            >
              {isAr ? 'مباراة جديدة' : 'Play Again'}
            </button>
          )}
        </div>
      )}

      {/* PLAYER'S ACTION & HAND CONTROL DECK (PLACING & BIDDING) */}
      {(phase === 'placing' || phase === 'bidding') && (
        <div className="bg-[#FFFBEB] border-4 border-[#161426] rounded-3xl p-4 sm:p-6 shadow-[0_6px_0_#161426] flex flex-col gap-5">
          {/* Header of Control Deck */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-[#161426]/15 pb-3">
            <div>
              <h3 className="text-lg sm:text-xl font-black text-[#161426]">
                {isPassAndPlay
                  ? isAr
                    ? `دور التحكم: ${activeTurnPlayer.name}`
                    : `Active Controller: ${activeTurnPlayer.name}`
                  : isMyActionTurn
                  ? isAr
                    ? 'دورك الآن — اتخذ قرارك!'
                    : 'Your Turn — Make Your Move!'
                  : isAr
                  ? `أقراصك الخاصة (بانتظار دور ${activeTurnPlayer.name})`
                  : `Your Hand (Waiting for ${activeTurnPlayer.name})`}
              </h3>
              <p className="text-xs sm:text-sm font-bold text-slate-600">
                {phase === 'placing'
                  ? allActiveHavePlacedOne
                    ? isAr
                      ? 'يمكنك وضع قرص إضافي مقلوب على طاولتك أو بدء مزايدة التحدي الآن!'
                      : 'Place another face-down disc onto your stack OR start a Challenge Bid now!'
                    : isAr
                    ? 'يجب على كل لاعب وضع قرص أول على طاولته قبل فتح باب المزايدة.'
                    : 'Every player must place their 1st face-down disc before bidding unlocks.'
                  : isAr
                  ? `المزايدة الحالية: ${currentBid} ورود. ارفع الرقم أو انسحب من الجولة.`
                  : `Current Bid: ${currentBid} Roses. Raise the bid or Pass.`}
              </p>
            </div>

            {/* Pass-and-Play fast hand visibility toggle */}
            {isPassAndPlay && phase === 'placing' && (
              <button
                type="button"
                onClick={() => setPassAndPlayHandOpen((prev) => !prev)}
                className="px-4 py-2 rounded-2xl bg-[#161426] text-[#FDE68A] font-black text-xs sm:text-sm border-2 border-[#161426] cursor-pointer"
              >
                {passAndPlayHandOpen
                  ? isAr
                    ? 'إخفاء نوع الأقراص'
                    : 'Hide Disc Types'
                  : isAr
                  ? `إظهار أقراص ${activeTurnPlayer.name} لاختيار (وردة / جمجمة)`
                  : `Reveal ${activeTurnPlayer.name}'s Hand (Rose / Skull)`}
              </button>
            )}
          </div>

          {/* SECTION A: PLACING DISCS FROM HAND */}
          {phase === 'placing' && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm font-black text-[#161426]">
                  {isAr
                    ? `الأقراص المتاحة في اليد (${myHand.length} من أصل ${myOwned.length}):`
                    : `Discs Available in Hand (${myHand.length} of ${myOwned.length}):`}
                </span>
              </div>

              {isPassAndPlay && !passAndPlayHandOpen ? (
                <div className="bg-amber-100/80 border-3 border-dashed border-[#161426] rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-xs sm:text-sm font-bold text-[#161426]">
                    {isAr
                      ? `وضع تمرير الجهاز: اضغط الزر لكشف أقراص ${activeTurnPlayer.name} واختيار وضع وردة أو جمجمة بسرية.`
                      : `Pass & Play Mode: Tap to view ${activeTurnPlayer.name}'s discs and secretly place a Rose or Skull.`}
                  </div>
                  <button
                    type="button"
                    onClick={() => setPassAndPlayHandOpen(true)}
                    className="px-5 py-2.5 rounded-2xl bg-[#E11D48] text-white font-black text-sm border-3 border-[#161426] shadow-[0_4px_0_#161426] shrink-0 cursor-pointer"
                  >
                    {isAr ? 'اختر قرصك الآن' : 'Choose Your Disc'}
                  </button>
                </div>
              ) : myHand.length === 0 ? (
                <div className="p-4 rounded-2xl bg-slate-100 border-2 border-slate-300 text-center text-xs sm:text-sm font-bold text-slate-600">
                  {isAr
                    ? 'لقد وضعت جميع أقراصك على الطاولة! إذا كان دورك الآن، يجب عليك بدء المزايدة.'
                    : 'All of your discs are on the table! On your turn, you must start a Challenge Bid.'}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {myHand.map((disc, idx) => {
                    const isRose = disc === 'rose';
                    return (
                      <button
                        key={`${disc}-${idx}`}
                        type="button"
                        disabled={!isMyActionTurn}
                        onClick={() => handlePlaceDisc(idx)}
                        className={`group rounded-2xl border-3 border-[#161426] p-3 flex flex-col items-center gap-2 transition-all ${
                          isMyActionTurn
                            ? isRose
                              ? 'bg-white hover:bg-[#FFF1F2] shadow-[0_5px_0_#161426] hover:-translate-y-0.5 active:translate-y-0.5 cursor-pointer'
                              : 'bg-[#1E1B2E] text-white hover:bg-[#31102F] shadow-[0_5px_0_#161426] hover:-translate-y-0.5 active:translate-y-0.5 cursor-pointer'
                            : 'bg-slate-100 opacity-75 cursor-not-allowed'
                        }`}
                      >
                        {isRose ? (
                          <RoseDiscSvg size={72} />
                        ) : (
                          <SkullDiscSvg size={72} />
                        )}
                        <span className="font-black text-xs sm:text-sm">
                          {isRose
                            ? isAr
                              ? 'وردة (آمنة)'
                              : 'Rose (Safe)'
                            : isAr
                            ? 'جمجمة (فخ!)'
                            : 'Skull (Trap!)'}
                        </span>
                        {isMyActionTurn && (
                          <span
                            className={`px-2.5 py-0.5 rounded-lg text-[11px] font-black border border-[#161426] ${
                              isRose
                                ? 'bg-[#10B981] text-[#161426]'
                                : 'bg-[#E11D48] text-white'
                            }`}
                          >
                            {isAr ? 'ضع على الطاولة' : 'Place Face-Down'}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* SECTION B: CHALLENGE BIDDING CONTROLS */}
          {((phase === 'placing' && allActiveHavePlacedOne) ||
            phase === 'bidding') &&
            isMyActionTurn && (
              <div className="bg-white border-3 border-[#161426] rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <span className="text-sm sm:text-base font-black text-[#161426]">
                    {phase === 'placing'
                      ? isAr
                        ? 'أو ابدأ تحدي المزايدة (بدلاً من وضع قرص):'
                        : 'Or Start a Challenge Bid (instead of placing a disc):'
                      : isAr
                      ? `ارفع المزايدة فوق (${currentBid}) أو انسحب:`
                      : `Raise the Bid above (${currentBid}) or Pass:`}
                  </span>
                  <span className="text-xs font-bold text-slate-600">
                    {isAr
                      ? `اختر عدد الورود التي تتحدى كشفها (من ${minAllowedBid} إلى ${totalDiscsOnTable})`
                      : `Select how many Roses you dare to flip (${minAllowedBid} to ${totalDiscsOnTable})`}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  {/* Number Stepper */}
                  <div className="flex items-center bg-[#FEF3C7] border-3 border-[#161426] rounded-2xl p-1">
                    <button
                      type="button"
                      disabled={effectiveBidChoice <= minAllowedBid}
                      onClick={() =>
                        setSelectedBid(Math.max(minAllowedBid, effectiveBidChoice - 1))
                      }
                      className="w-9 h-9 rounded-xl bg-white border-2 border-[#161426] font-black text-lg text-[#161426] disabled:opacity-40 cursor-pointer"
                    >
                      -
                    </button>
                    <span className="px-4 font-black text-xl text-[#161426]">
                      {effectiveBidChoice}
                    </span>
                    <button
                      type="button"
                      disabled={effectiveBidChoice >= totalDiscsOnTable}
                      onClick={() =>
                        setSelectedBid(
                          Math.min(totalDiscsOnTable, effectiveBidChoice + 1)
                        )
                      }
                      className="w-9 h-9 rounded-xl bg-white border-2 border-[#161426] font-black text-lg text-[#161426] disabled:opacity-40 cursor-pointer"
                    >
                      +
                    </button>
                  </div>

                  {/* Confirm Bid Button */}
                  <button
                    type="button"
                    onClick={() => handleStartOrRaiseBid(effectiveBidChoice)}
                    className="px-5 py-2.5 rounded-2xl bg-[#E11D48] hover:bg-[#BE123C] text-white font-black text-sm border-3 border-[#161426] shadow-[0_4px_0_#161426] active:translate-y-0.5 transition cursor-pointer"
                  >
                    {phase === 'placing'
                      ? isAr
                        ? `تحدي كشف ${effectiveBidChoice} ورود!`
                        : `Bid ${effectiveBidChoice} Roses!`
                      : isAr
                      ? `رفع المزايدة إلى ${effectiveBidChoice}`
                      : `Raise Bid to ${effectiveBidChoice}`}
                  </button>

                  {/* Pass Button (Only during Bidding Phase) */}
                  {phase === 'bidding' && (
                    <button
                      type="button"
                      onClick={handlePassBid}
                      className="px-4 py-2.5 rounded-2xl bg-slate-200 hover:bg-slate-300 text-[#161426] font-black text-sm border-3 border-[#161426] shadow-[0_4px_0_#161426] active:translate-y-0.5 transition cursor-pointer"
                    >
                      {isAr ? 'انسحاب (Pass)' : 'Pass'}
                    </button>
                  )}
                </div>
              </div>
            )}
        </div>
      )}
    </div>
  );
};

export default SkullGame;
