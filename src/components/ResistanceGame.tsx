import React, { useState } from 'react';
import { CartoonAvatarSvg } from './CartoonIcons';
import {
  Eye,
  EyeSlash,
  ShieldCheck,
  ShieldWarning,
  Users,
  CheckCircle,
  XCircle,
  LockKey,
  Sparkle,
  Target,
  Crown,
  ArrowsClockwise,
  Detective,
  WarningOctagon,
  Checks,
  HandPalm,
  Crosshair,
  Medal,
  Lightning,
} from '@phosphor-icons/react';

/* ============================================================================
 * TYPES & STATE INTERFACES
 * ========================================================================== */

export type ResistanceRole = 'agent' | 'spy';
export type ResistancePhase =
  | 'team_select'
  | 'team_vote'
  | 'mission_execute'
  | 'mission_reveal'
  | 'assassinate'
  | 'game_over';

export interface MissionRecord {
  missionNumber: number; // 1..5
  requiredTeamSize: number;
  status: 'pending' | 'current' | 'success' | 'sabotaged';
  teamIds: string[];
  leaderId?: string;
  successCount?: number;
  sabotageCount?: number;
  codeNameAr: string;
  codeNameEn: string;
}

export interface VoteHistoryRecord {
  missionNumber: number;
  attemptNumber: number;
  leaderId: string;
  teamIds: string[];
  votes: Record<string, 'approve' | 'reject'>;
  approved: boolean;
}

export interface ResistanceGameState {
  phase: ResistancePhase;
  roles: Record<string, ResistanceRole>;
  commanderId: string;
  assassinId: string;
  commanderSuspectIds: string[]; // For 2-3p games, 1 spy + 1 decoy; for 4+p games, actual spy IDs
  currentMissionIndex: number; // 0..4
  rejectedCount: number; // 0..5
  leaderIndex: number;
  leaderId: string;
  proposedTeamIds: string[];
  teamVotes: Record<string, 'approve' | 'reject'>;
  voteRevealed: boolean;
  missionActions: Record<string, 'success' | 'sabotage'>;
  missions: MissionRecord[];
  voteHistory: VoteHistoryRecord[];
  assassinatedTargetId?: string | null;
  winner?: 'agents' | 'spies' | null;
  winReasonAr?: string;
  winReasonEn?: string;
  scoresAwarded?: boolean;
}

export interface ResistancePlayerInfo {
  id: string;
  name: string;
  avatar_color: string;
  score: number;
}

export interface ResistanceGameProps {
  gameData: ResistanceGameState;
  players: ResistancePlayerInfo[];
  myPlayerId: string;
  isHost: boolean;
  isPassAndPlay: boolean;
  lang: 'ar' | 'en';
  onUpdateGameData: (
    nextData: ResistanceGameState,
    scoreAwards?: Record<string, number>
  ) => void;
  onStartNewRound: () => void;
}

/* ============================================================================
 * MISSION SIZES & OPERATION CODE NAMES
 * ========================================================================== */

const MISSION_CODE_NAMES: { ar: string; en: string }[] = [
  { ar: 'عملية الخزنة الفولاذية', en: 'OP: IRON VAULT' },
  { ar: 'عملية القمر المظلم', en: 'OP: DARK ECLIPSE' },
  { ar: 'عملية الشفرة النووية', en: 'OP: CIPHER CORE' },
  { ar: 'عملية القطار السري', en: 'OP: PHANTOM EXPRESS' },
  { ar: 'عملية الحصن الأخير', en: 'OP: FINAL CITADEL' },
];

function getSpyCount(playerCount: number): number {
  if (playerCount <= 4) return 1;
  if (playerCount <= 6) return 2;
  if (playerCount <= 9) return 3;
  return 4;
}

function getMissionTeamSizes(playerCount: number): number[] {
  const n = Math.max(2, playerCount);
  if (n === 2) return [1, 2, 1, 2, 2];
  if (n === 3) return [2, 2, 2, 2, 2];
  if (n === 4) return [2, 2, 2, 3, 3];
  if (n === 5) return [2, 3, 2, 3, 3];
  if (n === 6) return [2, 3, 4, 3, 4];
  if (n === 7) return [2, 3, 3, 4, 4];
  return [3, 4, 4, 5, 5].map((size) => Math.min(n, size));
}

function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/* ============================================================================
 * INITIAL STATE BUILDER
 * ========================================================================== */

export function buildInitialResistanceState(
  players: { id: string; name: string; avatar_color?: string; score?: number }[]
): ResistanceGameState {
  const safePlayers =
    players.length >= 2
      ? players
      : [
          { id: 'p1', name: 'اللاعب 1' },
          { id: 'p2', name: 'اللاعب 2' },
        ];

  const count = safePlayers.length;
  const spyCount = getSpyCount(count);
  const shuffledPlayers = shuffleArray(safePlayers);

  const roles: Record<string, ResistanceRole> = {};
  const spyIds: string[] = [];
  const agentIds: string[] = [];

  shuffledPlayers.forEach((p, idx) => {
    if (idx < spyCount) {
      roles[p.id] = 'spy';
      spyIds.push(p.id);
    } else {
      roles[p.id] = 'agent';
      agentIds.push(p.id);
    }
  });

  const commanderId = agentIds[0] || safePlayers[0].id;
  const assassinId = spyIds[0] || safePlayers[safePlayers.length - 1].id;

  // In 2-3p games, Commander sees a suspect pair (the Spy + 1 random non-Commander Agent if available)
  // so 2-3p games remain tense and balanced; in 4+p games, Commander sees exact Spies!
  let commanderSuspectIds = [...spyIds];
  if (count <= 3) {
    const otherAgents = agentIds.filter((id) => id !== commanderId);
    if (otherAgents.length > 0) {
      commanderSuspectIds = shuffleArray([spyIds[0], otherAgents[0]]);
    } else {
      commanderSuspectIds = shuffleArray(safePlayers.map((p) => p.id));
    }
  }

  const teamSizes = getMissionTeamSizes(count);
  const shuffledCodeNames = shuffleArray(MISSION_CODE_NAMES);

  const missions: MissionRecord[] = teamSizes.map((reqSize, idx) => ({
    missionNumber: idx + 1,
    requiredTeamSize: Math.min(count, reqSize),
    status: idx === 0 ? 'current' : 'pending',
    teamIds: [],
    codeNameAr: shuffledCodeNames[idx % shuffledCodeNames.length].ar,
    codeNameEn: shuffledCodeNames[idx % shuffledCodeNames.length].en,
  }));

  const startLeaderIdx = Math.floor(Math.random() * count);
  const startLeaderId = safePlayers[startLeaderIdx]?.id || safePlayers[0].id;

  return {
    phase: 'team_select',
    roles,
    commanderId,
    assassinId,
    commanderSuspectIds,
    currentMissionIndex: 0,
    rejectedCount: 0,
    leaderIndex: startLeaderIdx,
    leaderId: startLeaderId,
    proposedTeamIds: [],
    teamVotes: {},
    voteRevealed: false,
    missionActions: {},
    missions,
    voteHistory: [],
    assassinatedTargetId: null,
    winner: null,
    winReasonAr: undefined,
    winReasonEn: undefined,
    scoresAwarded: false,
  };
}

/* ============================================================================
 * CUSTOM CARTOON NEO-BRUTALIST SVG BADGES (ZERO EMOJIS!)
 * ========================================================================== */

export const AgentBadgeSvg: React.FC<{ className?: string }> = ({
  className = 'w-14 h-14',
}) => (
  <svg
    viewBox="0 0 80 80"
    className={`${className} select-none overflow-visible`}
    aria-label="Resistance Agent Shield"
  >
    {/* Outer Neo-Brutalist Shield */}
    <path
      d="M 40 6 L 68 18 L 68 42 C 68 58 55 70 40 75 C 25 70 12 58 12 42 L 12 18 Z"
      fill="#00bbf9"
      stroke="#161426"
      strokeWidth="4.5"
      strokeLinejoin="round"
    />
    {/* Inner Shield Highlight */}
    <path
      d="M 40 13 L 61 22 L 61 41 C 61 53 51 63 40 67 C 29 63 19 53 19 41 L 19 22 Z"
      fill="#25204d"
      stroke="#161426"
      strokeWidth="3.5"
      strokeLinejoin="round"
    />
    {/* Golden Star Emblem */}
    <polygon
      points="40,21 45,32 57,32 47,39 51,51 40,44 29,51 33,39 23,32 35,32"
      fill="#ffca3a"
      stroke="#161426"
      strokeWidth="3"
      strokeLinejoin="round"
    />
    {/* Cyan Tactical Shine */}
    <circle cx="40" cy="38" r="4" fill="#00f5d4" />
  </svg>
);

export const SpyBadgeSvg: React.FC<{ className?: string }> = ({
  className = 'w-14 h-14',
}) => (
  <svg
    viewBox="0 0 80 80"
    className={`${className} select-none overflow-visible`}
    aria-label="Secret Spy Infiltrator Badge"
  >
    {/* Crimson Hexagon Base */}
    <polygon
      points="40,6 70,22 70,58 40,74 10,58 10,22"
      fill="#ff595e"
      stroke="#161426"
      strokeWidth="4.5"
      strokeLinejoin="round"
    />
    {/* Dark Crimson Inner Ring */}
    <polygon
      points="40,14 62,26 62,54 40,66 18,54 18,26"
      fill="#161426"
      stroke="#ffca3a"
      strokeWidth="2.5"
      strokeLinejoin="round"
    />
    {/* Spy Fedora Hat Brim & Crown */}
    <path
      d="M 22 36 Q 40 31 58 36"
      fill="none"
      stroke="#ffca3a"
      strokeWidth="4"
      strokeLinecap="round"
    />
    <path
      d="M 28 35 L 32 23 L 40 26 L 48 23 L 52 35 Z"
      fill="#ff595e"
      stroke="#ffca3a"
      strokeWidth="2.5"
      strokeLinejoin="round"
    />
    {/* Sinister Glowing Shades */}
    <polygon
      points="25,42 38,44 36,51 26,49"
      fill="#ff595e"
      stroke="#ffffff"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <polygon
      points="55,42 42,44 44,51 54,49"
      fill="#ff595e"
      stroke="#ffffff"
      strokeWidth="2"
      strokeLinejoin="round"
    />
  </svg>
);

export const CommanderBadgeSvg: React.FC<{ className?: string }> = ({
  className = 'w-14 h-14',
}) => (
  <svg
    viewBox="0 0 80 80"
    className={`${className} select-none overflow-visible`}
    aria-label="Chief Intelligence Radar Badge"
  >
    <circle
      cx="40"
      cy="40"
      r="33"
      fill="#9b5de5"
      stroke="#161426"
      strokeWidth="4.5"
    />
    <circle
      cx="40"
      cy="40"
      r="24"
      fill="#161426"
      stroke="#ffca3a"
      strokeWidth="3"
    />
    {/* All-Seeing Radar Eye */}
    <path
      d="M 22 40 Q 40 25 58 40 Q 40 55 22 40 Z"
      fill="#00f5d4"
      stroke="#161426"
      strokeWidth="3"
      strokeLinejoin="round"
    />
    <circle
      cx="40"
      cy="40"
      r="6.5"
      fill="#161426"
      stroke="#ffca3a"
      strokeWidth="2.5"
    />
    <circle cx="42" cy="38" r="2" fill="#ffffff" />
  </svg>
);

export const MissionVaultSvg: React.FC<{
  status: 'pending' | 'current' | 'success' | 'sabotaged';
  sizeNumber: number;
  missionNumber: number;
  className?: string;
}> = ({ status, sizeNumber, missionNumber, className = 'w-14 h-14' }) => {
  const fillMap = {
    pending: '#25204d',
    current: '#ffca3a',
    success: '#00bbf9',
    sabotaged: '#ff595e',
  };
  const strokeMap = {
    pending: '#475569',
    current: '#161426',
    success: '#161426',
    sabotaged: '#161426',
  };

  return (
    <svg
      viewBox="0 0 72 72"
      className={`${className} select-none overflow-visible`}
      aria-label={`Mission ${missionNumber}`}
    >
      {/* Vault Body */}
      <rect
        x="6"
        y="6"
        width="60"
        height="60"
        rx="16"
        fill={fillMap[status]}
        stroke="#161426"
        strokeWidth="4.5"
      />
      {/* Vault Gear Ring */}
      <circle
        cx="36"
        cy="36"
        r="21"
        fill={status === 'current' ? '#fff9ec' : '#161426'}
        stroke={strokeMap[status]}
        strokeWidth="3"
        strokeDasharray={status === 'pending' ? '4 3' : undefined}
      />

      {status === 'success' && (
        <path
          d="M 25 36 L 33 44 L 48 28"
          fill="none"
          stroke="#00f5d4"
          strokeWidth="5.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}

      {status === 'sabotaged' && (
        <>
          <line
            x1="26"
            y1="26"
            x2="46"
            y2="46"
            stroke="#ff595e"
            strokeWidth="5.5"
            strokeLinecap="round"
          />
          <line
            x1="46"
            y1="26"
            x2="26"
            y2="46"
            stroke="#ff595e"
            strokeWidth="5.5"
            strokeLinecap="round"
          />
        </>
      )}

      {(status === 'pending' || status === 'current') && (
        <text
          x="36"
          y="43"
          textAnchor="middle"
          fill={status === 'current' ? '#161426' : '#ffffff'}
          fontSize="22"
          fontWeight="900"
          fontFamily="inherit"
        >
          {sizeNumber}
        </text>
      )}
    </svg>
  );
};

export const VoteStampSvg: React.FC<{
  vote: 'approve' | 'reject';
  className?: string;
}> = ({ vote, className = 'w-12 h-12' }) => {
  const isApprove = vote === 'approve';
  return (
    <svg
      viewBox="0 0 64 64"
      className={`${className} select-none overflow-visible`}
      aria-label={isApprove ? 'Approved Stamp' : 'Rejected Stamp'}
    >
      <rect
        x="6"
        y="10"
        width="52"
        height="44"
        rx="10"
        transform={isApprove ? 'rotate(-5 32 32)' : 'rotate(5 32 32)'}
        fill={isApprove ? '#8ac926' : '#ff595e'}
        stroke="#161426"
        strokeWidth="4"
      />
      <rect
        x="11"
        y="15"
        width="42"
        height="34"
        rx="6"
        transform={isApprove ? 'rotate(-5 32 32)' : 'rotate(5 32 32)'}
        fill="none"
        stroke="#fff9ec"
        strokeWidth="2"
        strokeDasharray="4 2"
      />
      {isApprove ? (
        <path
          d="M 22 33 L 29 40 L 43 24"
          fill="none"
          stroke="#161426"
          strokeWidth="5.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : (
        <>
          <line
            x1="23"
            y1="23"
            x2="41"
            y2="41"
            stroke="#161426"
            strokeWidth="5.5"
            strokeLinecap="round"
          />
          <line
            x1="41"
            y1="23"
            x2="23"
            y2="41"
            stroke="#161426"
            strokeWidth="5.5"
            strokeLinecap="round"
          />
        </>
      )}
    </svg>
  );
};

/* ============================================================================
 * MAIN RESISTANCE GAME COMPONENT
 * ========================================================================== */

export const ResistanceGame: React.FC<ResistanceGameProps> = ({
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
  const [activeLocalPlayerIdx, setActiveLocalPlayerIdx] = useState<number>(0);
  const [showRoleDrawer, setShowRoleDrawer] = useState<boolean>(false);
  const [assassinCandidateId, setAssassinCandidateId] = useState<string>('');

  const safePlayers = players.length > 0 ? players : [];
  const currentViewerId = isPassAndPlay
    ? safePlayers[activeLocalPlayerIdx]?.id || myPlayerId
    : myPlayerId;
  const currentViewer =
    safePlayers.find((p) => p.id === currentViewerId) || safePlayers[0];

  const myRole: ResistanceRole = gameData.roles?.[currentViewerId] || 'agent';
  const isCommander = currentViewerId === gameData.commanderId;
  const isAssassin = currentViewerId === gameData.assassinId;

  const currentMissionIdx = Math.min(
    4,
    Math.max(0, gameData.currentMissionIndex || 0)
  );
  const currentMission =
    gameData.missions?.[currentMissionIdx] || {
      missionNumber: currentMissionIdx + 1,
      requiredTeamSize: Math.min(safePlayers.length, 2),
      status: 'current',
      teamIds: [],
      codeNameAr: 'عملية الخزنة الفولاذية',
      codeNameEn: 'OP: IRON VAULT',
    };

  const leaderPlayer =
    safePlayers.find((p) => p.id === gameData.leaderId) || safePlayers[0];
  const isViewerLeader = currentViewerId === gameData.leaderId;
  const canControlLeaderAction =
    isViewerLeader || (isPassAndPlay && isHost);

  const spyPlayers = safePlayers.filter((p) => gameData.roles?.[p.id] === 'spy');
  const agentPlayers = safePlayers.filter(
    (p) => gameData.roles?.[p.id] !== 'spy'
  );
  const suspectPlayers = safePlayers.filter((p) =>
    (gameData.commanderSuspectIds || []).includes(p.id)
  );

  const succeededMissionsCount = (gameData.missions || []).filter(
    (m) => m.status === 'success'
  ).length;
  const sabotagedMissionsCount = (gameData.missions || []).filter(
    (m) => m.status === 'sabotaged'
  ).length;

  /* ==========================================================================
   * GAMEPLAY HANDLERS
   * ======================================================================== */

  const handleToggleTeamMember = (targetId: string) => {
    if (gameData.phase !== 'team_select') return;
    if (!canControlLeaderAction && !isHost) return;

    const currentTeam = gameData.proposedTeamIds || [];
    const reqSize = currentMission.requiredTeamSize;

    let nextTeam: string[];
    if (currentTeam.includes(targetId)) {
      nextTeam = currentTeam.filter((id) => id !== targetId);
    } else {
      if (currentTeam.length >= reqSize) {
        // Replace oldest selected member if already full for smooth UX
        nextTeam = [...currentTeam.slice(1), targetId];
      } else {
        nextTeam = [...currentTeam, targetId];
      }
    }

    onUpdateGameData({
      ...gameData,
      proposedTeamIds: nextTeam,
    });
  };

  const handleProposeTeamForVote = () => {
    const currentTeam = gameData.proposedTeamIds || [];
    if (currentTeam.length !== currentMission.requiredTeamSize) return;

    onUpdateGameData({
      ...gameData,
      phase: 'team_vote',
      teamVotes: {},
      voteRevealed: false,
    });
  };

  const handleCastTeamVote = (
    voterId: string,
    voteChoice: 'approve' | 'reject'
  ) => {
    if (gameData.phase !== 'team_vote' || gameData.voteRevealed) return;

    const nextVotes: Record<string, 'approve' | 'reject'> = {
      ...(gameData.teamVotes || {}),
      [voterId]: voteChoice,
    };

    const allVoted = safePlayers.every((p) => Boolean(nextVotes[p.id]));

    onUpdateGameData({
      ...gameData,
      teamVotes: nextVotes,
      voteRevealed: allVoted,
    });
  };

  const handleResolveVoteResult = () => {
    const votes = gameData.teamVotes || {};
    const approveCount = Object.values(votes).filter(
      (v) => v === 'approve'
    ).length;
    const rejectCount = Object.values(votes).filter(
      (v) => v === 'reject'
    ).length;
    const approved = approveCount > rejectCount;

    const historyEntry: VoteHistoryRecord = {
      missionNumber: currentMission.missionNumber,
      attemptNumber: (gameData.rejectedCount || 0) + 1,
      leaderId: gameData.leaderId,
      teamIds: [...(gameData.proposedTeamIds || [])],
      votes,
      approved,
    };

    const nextHistory = [...(gameData.voteHistory || []), historyEntry];

    if (approved) {
      // Advance to Mission Execution!
      onUpdateGameData({
        ...gameData,
        phase: 'mission_execute',
        missionActions: {},
        voteHistory: nextHistory,
      });
    } else {
      const nextRejected = (gameData.rejectedCount || 0) + 1;
      if (nextRejected >= 5) {
        // 5 consecutive rejected proposals -> Spies win by political chaos!
        const awards: Record<string, number> = {};
        spyPlayers.forEach((sp) => {
          awards[sp.id] = 3;
        });

        onUpdateGameData(
          {
            ...gameData,
            phase: 'game_over',
            rejectedCount: 5,
            voteHistory: nextHistory,
            winner: 'spies',
            winReasonAr:
              'فشل العملاء في الاتفاق على فريق لـ 5 مرات متتالية! الجواسيس انتصروا بنشر الفوضى والشلل التام!',
            winReasonEn:
              '5 consecutive team proposals were rejected! The Spies win by total gridlock and chaos!',
            scoresAwarded: true,
          },
          awards
        );
      } else {
        const nextLeaderIdx =
          ((gameData.leaderIndex || 0) + 1) % Math.max(1, safePlayers.length);
        const nextLeaderId =
          safePlayers[nextLeaderIdx]?.id || safePlayers[0].id;

        onUpdateGameData({
          ...gameData,
          phase: 'team_select',
          rejectedCount: nextRejected,
          leaderIndex: nextLeaderIdx,
          leaderId: nextLeaderId,
          proposedTeamIds: [],
          teamVotes: {},
          voteRevealed: false,
          voteHistory: nextHistory,
        });
      }
    }
  };

  const handleSubmitMissionAction = (
    actorId: string,
    action: 'success' | 'sabotage'
  ) => {
    if (gameData.phase !== 'mission_execute') return;
    const teamIds = gameData.proposedTeamIds || [];
    if (!teamIds.includes(actorId)) return;

    // Enforce rule: Loyal Agents can only submit 'success'
    const actorRole = gameData.roles?.[actorId] || 'agent';
    const safeAction: 'success' | 'sabotage' =
      actorRole === 'agent' ? 'success' : action;

    const nextActions: Record<string, 'success' | 'sabotage'> = {
      ...(gameData.missionActions || {}),
      [actorId]: safeAction,
    };

    const allSubmitted = teamIds.every((id) => Boolean(nextActions[id]));

    if (!allSubmitted) {
      onUpdateGameData({
        ...gameData,
        missionActions: nextActions,
      });
      return;
    }

    // All team members submitted! Tally cards anonymously
    const actionList = Object.values(nextActions);
    const sabotageCount = actionList.filter((a) => a === 'sabotage').length;
    const successCount = actionList.filter((a) => a === 'success').length;
    const missionSucceeded = sabotageCount === 0;

    const updatedMissions = (gameData.missions || []).map((m, idx) => {
      if (idx !== currentMissionIdx) return m;
      return {
        ...m,
        status: (missionSucceeded ? 'success' : 'sabotaged') as
          | 'success'
          | 'sabotaged',
        teamIds: [...teamIds],
        leaderId: gameData.leaderId,
        successCount,
        sabotageCount,
      };
    });

    onUpdateGameData({
      ...gameData,
      phase: 'mission_reveal',
      missionActions: nextActions,
      missions: updatedMissions,
    });
  };

  const handleProceedAfterMissionReveal = () => {
    const missions = gameData.missions || [];
    const totalSuccess = missions.filter((m) => m.status === 'success').length;
    const totalSabotaged = missions.filter(
      (m) => m.status === 'sabotaged'
    ).length;

    if (totalSabotaged >= 3) {
      // Spies win 3 missions!
      const awards: Record<string, number> = {};
      spyPlayers.forEach((sp) => {
        awards[sp.id] = 3;
      });

      onUpdateGameData(
        {
          ...gameData,
          phase: 'game_over',
          winner: 'spies',
          winReasonAr:
            'نجح الجواسيس في تخريب 3 مهمات استراتيجية وتدمير المقاومة من الداخل!',
          winReasonEn:
            'The Spies successfully sabotaged 3 strategic missions from within!',
          scoresAwarded: true,
        },
        awards
      );
      return;
    }

    if (totalSuccess >= 3) {
      // Agents completed 3 missions -> Spies get 1 final Assassin shot to identify the Commander!
      onUpdateGameData({
        ...gameData,
        phase: 'assassinate',
      });
      return;
    }

    // Advance to next Mission!
    const nextMissionIdx = Math.min(4, currentMissionIdx + 1);
    const nextLeaderIdx =
      ((gameData.leaderIndex || 0) + 1) % Math.max(1, safePlayers.length);
    const nextLeaderId = safePlayers[nextLeaderIdx]?.id || safePlayers[0].id;

    const updatedMissions = missions.map((m, idx) =>
      idx === nextMissionIdx ? { ...m, status: 'current' as const } : m
    );

    onUpdateGameData({
      ...gameData,
      phase: 'team_select',
      currentMissionIndex: nextMissionIdx,
      rejectedCount: 0,
      leaderIndex: nextLeaderIdx,
      leaderId: nextLeaderId,
      proposedTeamIds: [],
      teamVotes: {},
      voteRevealed: false,
      missionActions: {},
      missions: updatedMissions,
    });
  };

  const handleExecuteAssassination = (targetId: string) => {
    if (!targetId) return;
    const caughtCommander = targetId === gameData.commanderId;
    const awards: Record<string, number> = {};

    if (caughtCommander) {
      spyPlayers.forEach((sp) => {
        awards[sp.id] = 3;
      });
    } else {
      agentPlayers.forEach((ag) => {
        awards[ag.id] = 3;
      });
      if (gameData.commanderId) {
        awards[gameData.commanderId] = 4; // Bonus point for Commander staying hidden!
      }
    }

    const commanderPlayer = safePlayers.find(
      (p) => p.id === gameData.commanderId
    );
    const targetedPlayer = safePlayers.find((p) => p.id === targetId);

    onUpdateGameData(
      {
        ...gameData,
        phase: 'game_over',
        assassinatedTargetId: targetId,
        winner: caughtCommander ? 'spies' : 'agents',
        winReasonAr: caughtCommander
          ? `انقلاب درامي! رغم نجاح 3 مهمات، نجح الجاسوس في كشف واغتيال القائد السري (${
              commanderPlayer?.name || ''
            }) وسرق الفوز!`
          : `انتصار ساحق للمقاومة! أخطأ الجاسوس واستهدف (${
              targetedPlayer?.name || ''
            }) بينما بقي القائد السري (${
              commanderPlayer?.name || ''
            }) في الظل!`,
        winReasonEn: caughtCommander
          ? `Dramatic Twist! Despite 3 successful missions, the Spy identified Chief Intelligence (${
              commanderPlayer?.name || ''
            }) and stole the victory!`
          : `Total Resistance Victory! The Spy targeted (${
              targetedPlayer?.name || ''
            }) while Chief Intelligence (${
              commanderPlayer?.name || ''
            }) remained hidden!`,
        scoresAwarded: true,
      },
      awards
    );
  };

  /* ==========================================================================
   * RENDER UI
   * ======================================================================== */

  return (
    <div
      dir={isAr ? 'rtl' : 'ltr'}
      className="w-full max-w-4xl mx-auto flex flex-col gap-4 pb-8 select-none"
    >
      {/* ====================================================================
       * 1. PASS-AND-PLAY PLAYER SWITCHER + SECRET IDENTITY DRAWER BAR
       * ==================================================================== */}
      <div className="bg-[#1e1b36] border-4 border-[#161426] rounded-3xl p-3.5 shadow-[0_6px_0_#161426] flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* Active Viewer Pill / Pass-and-Play Switcher */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-black uppercase tracking-wider px-2.5 py-1 rounded-xl bg-[#161426] text-[#ffca3a] border-2 border-[#161426]">
              {isAr ? 'منظور اللاعب:' : 'VIEWING AS:'}
            </span>
            {isPassAndPlay ? (
              <div className="flex items-center gap-1.5 flex-wrap">
                {safePlayers.map((p, idx) => {
                  const isActive = idx === activeLocalPlayerIdx;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setActiveLocalPlayerIdx(idx);
                        setShowRoleDrawer(false);
                      }}
                      className={`px-3 py-1.5 rounded-xl font-black text-xs border-2 border-[#161426] transition-all flex items-center gap-1.5 ${
                        isActive
                          ? 'bg-[#00bbf9] text-[#161426] shadow-[0_3px_0_#161426] -translate-y-0.5'
                          : 'bg-[#25204d] text-white/80 hover:bg-[#312b63]'
                      }`}
                    >
                      <div className="w-5 h-5 rounded-full overflow-hidden border border-[#161426]">
                        <CartoonAvatarSvg index={idx} color={p.avatar_color} />
                      </div>
                      <span>{p.name}</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-[#25204d] border-2 border-[#161426] text-white font-black text-sm">
                <div className="w-6 h-6 rounded-full overflow-hidden border border-[#161426]">
                  <CartoonAvatarSvg
                    index={Math.max(
                      0,
                      safePlayers.findIndex((p) => p.id === currentViewerId)
                    )}
                    color={currentViewer?.avatar_color}
                  />
                </div>
                <span>{currentViewer?.name}</span>
              </div>
            )}
          </div>

          {/* Toggle Private Role Drawer Button */}
          <button
            type="button"
            onClick={() => setShowRoleDrawer((prev) => !prev)}
            className={`px-4 py-2 rounded-2xl font-black text-xs sm:text-sm border-3 border-[#161426] shadow-[0_4px_0_#161426] active:translate-y-0.5 transition-all flex items-center gap-2 ${
              showRoleDrawer
                ? 'bg-[#ff595e] text-white'
                : 'bg-[#ffca3a] text-[#161426] hover:bg-[#ffd45c]'
            }`}
          >
            {showRoleDrawer ? (
              <>
                <EyeSlash weight="fill" className="w-4 h-4" />
                <span>
                  {isAr ? 'إخفاء ملفي السري' : 'Hide Secret Dossier'}
                </span>
              </>
            ) : (
              <>
                <Eye weight="fill" className="w-4 h-4" />
                <span>
                  {isAr
                    ? `اكشف هويتي السرية (${currentViewer?.name || ''})`
                    : `Peek Secret Role (${currentViewer?.name || ''})`}
                </span>
              </>
            )}
          </button>
        </div>

        {/* Collapsible Secret Identity Dossier */}
        {showRoleDrawer && (
          <div
            className={`rounded-2xl border-4 border-[#161426] p-4 shadow-[0_5px_0_#161426] transition-all ${
              myRole === 'spy'
                ? 'bg-gradient-to-br from-[#3b1224] via-[#2b1329] to-[#161426]'
                : isCommander
                ? 'bg-gradient-to-br from-[#2d1b4e] via-[#1f2041] to-[#161426]'
                : 'bg-gradient-to-br from-[#102a45] via-[#18223d] to-[#161426]'
            }`}
          >
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="shrink-0">
                {myRole === 'spy' ? (
                  <SpyBadgeSvg className="w-20 h-20" />
                ) : isCommander ? (
                  <CommanderBadgeSvg className="w-20 h-20" />
                ) : (
                  <AgentBadgeSvg className="w-20 h-20" />
                )}
              </div>

              <div className="flex-1 text-center sm:text-start space-y-1.5">
                <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full border-2 border-[#161426] text-xs font-black bg-[#161426] text-[#ffca3a]">
                  <LockKey weight="fill" className="w-3.5 h-3.5" />
                  <span>
                    {isAr
                      ? 'ملف مخابرات سري للغاية — لا تدع أحداً يرى شاشتك!'
                      : 'TOP SECRET DOSSIER — KEEP HIDDEN!'}
                  </span>
                </div>

                <h3
                  className={`text-xl sm:text-2xl font-black ${
                    myRole === 'spy'
                      ? 'text-[#ff595e]'
                      : isCommander
                      ? 'text-[#00f5d4]'
                      : 'text-[#00bbf9]'
                  }`}
                >
                  {myRole === 'spy'
                    ? isAr
                      ? 'جاسوس مزدوج (خائن سري)!'
                      : 'UNDERCOVER SPY (SABOTEUR)!'
                    : isCommander
                    ? isAr
                      ? 'قائد المخابرات السري (عميل مقاومة)!'
                      : 'CHIEF INTELLIGENCE (COMMANDER)!'
                    : isAr
                    ? 'عميل مقاومة شريف!'
                    : 'LOYAL RESISTANCE AGENT!'}
                </h3>

                <p className="text-xs sm:text-sm text-white/90 font-bold leading-relaxed">
                  {myRole === 'spy'
                    ? isAr
                      ? 'مهمتك: التظاهر بأنك عميل شريف للدخول في فرق المهمات، ثم تخريب 3 مهمات سراً (أو كشف القائد السري في النهاية)!'
                      : 'Your objective: Blend in as a loyal Agent to get picked for missions, then secretly sabotage 3 missions!'
                    : isCommander
                    ? isAr
                      ? 'مهمتك: أنت تعرف المشتبه بهم!وجّه العملاء لإنجاح 3 مهمات بذكاء دون أن يكتشف الجواسيس أنك القائد السري!'
                      : 'Your objective: Guide the Agents to succeed 3 missions without letting the Spies figure out you are the Commander!'
                    : isAr
                    ? 'مهمتك: حلل التصويت ونتائج المهمات لكشف الجواسيس، وصوّت فقط للفرق الموثوقة لإنجاح 3 مهمات!'
                    : 'Your objective: Analyze votes and mission outcomes to keep Spies off the team and succeed 3 missions!'}
                </p>

                {/* Extra Intel for Spies or Commander */}
                {myRole === 'spy' && (
                  <div className="pt-2 flex flex-wrap items-center gap-2 justify-center sm:justify-start">
                    <span className="text-xs font-black text-[#ffca3a]">
                      {isAr ? 'شبكة الجواسيس:' : 'Spy Network:'}
                    </span>
                    {spyPlayers.map((sp) => (
                      <span
                        key={sp.id}
                        className="px-2.5 py-1 rounded-xl bg-[#ff595e] text-white border-2 border-[#161426] font-black text-xs shadow-[0_2px_0_#161426]"
                      >
                        {sp.name}
                        {sp.id === gameData.assassinId
                          ? isAr
                            ? ' (المنفّذ)'
                            : ' (Assassin)'
                          : ''}
                      </span>
                    ))}
                  </div>
                )}

                {isCommander && myRole === 'agent' && (
                  <div className="pt-2 flex flex-wrap items-center gap-2 justify-center sm:justify-start">
                    <span className="text-xs font-black text-[#00f5d4]">
                      {safePlayers.length <= 3
                        ? isAr
                          ? 'رادار الاشتباه (أحدهما جاسوس خطير):'
                          : 'Radar Suspects (One of these is the Spy):'
                        : isAr
                        ? 'الجواسيس المكشوفون لرادارك:'
                        : 'Spies Detected by Your Radar:'}
                    </span>
                    {suspectPlayers.map((sp) => (
                      <span
                        key={sp.id}
                        className="px-2.5 py-1 rounded-xl bg-[#9b5de5] text-white border-2 border-[#161426] font-black text-xs shadow-[0_2px_0_#161426]"
                      >
                        {sp.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ====================================================================
       * 2. TACTICAL 5-MISSIONS BOARD & REJECTION TRACK
       * ==================================================================== */}
      <div className="bg-[#fff9ec] border-4 border-[#161426] rounded-3xl p-4 sm:p-5 shadow-[0_8px_0_#161426]">
        {/* Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#161426] text-[#ffca3a] flex items-center justify-center border-2 border-[#161426] shadow-[0_3px_0_#00bbf9]">
              <Detective weight="fill" className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-[#161426] leading-tight">
                {isAr
                  ? 'لوحة العمليات التكتيكية (5 مهمات)'
                  : 'TACTICAL OPERATIONS BOARD (5 MISSIONS)'}
              </h2>
              <p className="text-xs font-extrabold text-[#161426]/70">
                {isAr
                  ? `العملاء الشرفاء (${agentPlayers.length}) ضد الجواسيس (${spyPlayers.length}) — الفوز بـ 3 مهمات`
                  : `Loyal Agents (${agentPlayers.length}) vs Spies (${spyPlayers.length}) — First to 3 Missions`}
              </p>
            </div>
          </div>

          {/* Live Score Pill */}
          <div className="flex items-center gap-2">
            <div className="px-3 py-1.5 rounded-2xl bg-[#00bbf9] text-[#161426] border-3 border-[#161426] shadow-[0_3px_0_#161426] font-black text-xs sm:text-sm flex items-center gap-1.5">
              <ShieldCheck weight="fill" className="w-4 h-4" />
              <span>
                {isAr ? 'العملاء:' : 'Agents:'} {succeededMissionsCount}/3
              </span>
            </div>
            <div className="px-3 py-1.5 rounded-2xl bg-[#ff595e] text-white border-3 border-[#161426] shadow-[0_3px_0_#161426] font-black text-xs sm:text-sm flex items-center gap-1.5">
              <ShieldWarning weight="fill" className="w-4 h-4" />
              <span>
                {isAr ? 'الجواسيس:' : 'Spies:'} {sabotagedMissionsCount}/3
              </span>
            </div>
          </div>
        </div>

        {/* 5 Mission Vault Nodes */}
        <div className="grid grid-cols-5 gap-2 sm:gap-3 mb-4">
          {(gameData.missions || []).map((mission, idx) => {
            const isCurrent = idx === currentMissionIdx && gameData.phase !== 'game_over';
            return (
              <div
                key={mission.missionNumber}
                className={`rounded-2xl border-3 border-[#161426] p-2 sm:p-2.5 flex flex-col items-center text-center transition-all ${
                  mission.status === 'success'
                    ? 'bg-[#e0f8ff] shadow-[0_4px_0_#161426]'
                    : mission.status === 'sabotaged'
                    ? 'bg-[#ffe3e4] shadow-[0_4px_0_#161426]'
                    : isCurrent
                    ? 'bg-[#fff0b8] shadow-[0_5px_0_#161426] -translate-y-1 ring-2 ring-[#ff924c]'
                    : 'bg-white/80 opacity-85'
                }`}
              >
                <span className="text-[10px] sm:text-xs font-black uppercase text-[#161426]/70 mb-1">
                  {isAr
                    ? `مهمة ${mission.missionNumber}`
                    : `M${mission.missionNumber}`}
                </span>

                <MissionVaultSvg
                  status={mission.status}
                  sizeNumber={mission.requiredTeamSize}
                  missionNumber={mission.missionNumber}
                  className="w-11 h-11 sm:w-14 sm:h-14"
                />

                <span className="mt-1.5 text-[10px] sm:text-xs font-black text-[#161426] line-clamp-1">
                  {mission.status === 'success'
                    ? isAr
                      ? 'ناجحة!'
                      : 'SUCCESS'
                    : mission.status === 'sabotaged'
                    ? isAr
                      ? `تخريب (${mission.sabotageCount || 1})`
                      : `SABOTAGED (${mission.sabotageCount || 1})`
                    : isAr
                    ? `${mission.requiredTeamSize} عملاء`
                    : `${mission.requiredTeamSize} Team`}
                </span>
              </div>
            );
          })}
        </div>

        {/* Rejection Chaos Track (0..5) */}
        <div className="bg-[#161426] text-white rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <WarningOctagon
              weight="fill"
              className={`w-5 h-5 ${
                (gameData.rejectedCount || 0) >= 3
                  ? 'text-[#ff595e] animate-bounce'
                  : 'text-[#ffca3a]'
              }`}
            />
            <div>
              <span className="text-xs sm:text-sm font-black block">
                {isAr
                  ? 'عدّاد رفض الفرق (5 رفض متتالي = فوز فوري للجواسيس!)'
                  : 'TEAM REJECTION TRACK (5 Rejections = Instant Spy Win!)'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4, 5].map((step) => {
              const filled = (gameData.rejectedCount || 0) >= step;
              const isDanger = step >= 4;
              return (
                <div
                  key={step}
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl border-2 flex items-center justify-center font-black text-xs transition-all ${
                    filled
                      ? isDanger
                        ? 'bg-[#ff595e] border-white text-white scale-105'
                        : 'bg-[#ffca3a] border-white text-[#161426]'
                      : 'bg-[#25204d] border-white/25 text-white/40'
                  }`}
                >
                  {step}/5
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ====================================================================
       * 3. PHASE 1: TEAM SELECTION ('team_select')
       * ==================================================================== */}
      {gameData.phase === 'team_select' && (
        <div className="bg-white border-4 border-[#161426] rounded-3xl p-5 shadow-[0_8px_0_#161426] space-y-5">
          {/* Current Mission & Leader Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#f4f1ea] border-3 border-[#161426] rounded-2xl p-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-[#161426] text-[#00f5d4] text-xs font-black">
                <Target weight="fill" className="w-3.5 h-3.5" />
                <span>
                  {isAr
                    ? `المهمة ${currentMission.missionNumber}: ${currentMission.codeNameAr}`
                    : `MISSION ${currentMission.missionNumber}: ${currentMission.codeNameEn}`}
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-black text-[#161426]">
                {isAr
                  ? `قائد المهمة الحالي: ${leaderPlayer?.name || ''}`
                  : `Current Mission Leader: ${leaderPlayer?.name || ''}`}
              </h3>
              <p className="text-xs sm:text-sm font-bold text-[#161426]/75">
                {isAr
                  ? `يجب على القائد اختيار (${currentMission.requiredTeamSize}) لاعبين للذهاب في هذه المهمة السرية.`
                  : `The Leader must select (${currentMission.requiredTeamSize}) players to deploy on this secret mission.`}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0 bg-[#ffca3a] border-3 border-[#161426] rounded-2xl px-3.5 py-2 shadow-[0_4px_0_#161426]">
              <Crown weight="fill" className="w-5 h-5 text-[#161426]" />
              <span className="font-black text-sm text-[#161426]">
                {isAr
                  ? `المختارون: ${(gameData.proposedTeamIds || []).length} / ${
                      currentMission.requiredTeamSize
                    }`
                  : `Selected: ${(gameData.proposedTeamIds || []).length} / ${
                      currentMission.requiredTeamSize
                    }`}
              </span>
            </div>
          </div>

          {/* Selectable Player Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {safePlayers.map((player, idx) => {
              const isSelected = (gameData.proposedTeamIds || []).includes(
                player.id
              );
              const isLeader = player.id === gameData.leaderId;

              return (
                <button
                  key={player.id}
                  type="button"
                  onClick={() => handleToggleTeamMember(player.id)}
                  className={`relative rounded-2xl border-4 border-[#161426] p-3.5 flex flex-col items-center text-center transition-all ${
                    isSelected
                      ? 'bg-[#00bbf9] text-[#161426] shadow-[0_6px_0_#161426] -translate-y-1'
                      : 'bg-[#fff9ec] text-[#161426] hover:bg-[#fff0c4] shadow-[0_4px_0_#161426]'
                  }`}
                >
                  {isLeader && (
                    <span className="absolute -top-2.5 right-2 px-2 py-0.5 rounded-full bg-[#ffca3a] border-2 border-[#161426] text-[10px] font-black flex items-center gap-1 shadow-[0_2px_0_#161426]">
                      <Crown weight="fill" className="w-3 h-3" />
                      {isAr ? 'القائد' : 'LEADER'}
                    </span>
                  )}

                  <div className="w-14 h-14 rounded-2xl overflow-hidden border-3 border-[#161426] bg-white mb-2 shadow-[0_3px_0_#161426]">
                    <CartoonAvatarSvg index={idx} color={player.avatar_color} />
                  </div>

                  <span className="font-black text-sm truncate w-full">
                    {player.name}
                  </span>

                  <span
                    className={`mt-2 px-2.5 py-1 rounded-xl border-2 border-[#161426] text-xs font-black flex items-center gap-1 ${
                      isSelected
                        ? 'bg-[#8ac926] text-[#161426]'
                        : 'bg-white text-[#161426]/70'
                    }`}
                  >
                    {isSelected ? (
                      <>
                        <CheckCircle weight="fill" className="w-3.5 h-3.5" />
                        <span>{isAr ? 'ضمن الفريق' : 'On Team'}</span>
                      </>
                    ) : (
                      <>
                        <Users weight="bold" className="w-3.5 h-3.5" />
                        <span>{isAr ? 'اضغط للاختيار' : 'Select'}</span>
                      </>
                    )}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Submit Team Proposal Button */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-xs font-bold text-[#161426]/70">
              {canControlLeaderAction
                ? isAr
                  ? 'اختر أعضاء الفريق الذين تثق بهم ثم اطرح الفريق للتصويت العلني.'
                  : 'Select the agents you trust and propose the team for a public vote.'
                : isAr
                ? `بانتظار القائد (${leaderPlayer?.name || ''}) لاختيار الفريق...`
                : `Waiting for Leader (${leaderPlayer?.name || ''}) to propose a team...`}
            </span>

            {(canControlLeaderAction || isHost) && (
              <button
                type="button"
                disabled={
                  (gameData.proposedTeamIds || []).length !==
                  currentMission.requiredTeamSize
                }
                onClick={handleProposeTeamForVote}
                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-[#8ac926] hover:bg-[#9be02b] disabled:bg-slate-300 disabled:text-slate-500 text-[#161426] font-black text-base border-4 border-[#161426] shadow-[0_6px_0_#161426] active:translate-y-1 transition-all flex items-center justify-center gap-2"
              >
                <Checks weight="bold" className="w-5 h-5" />
                <span>
                  {isAr
                    ? 'طرح الفريق للتصويت العلني!'
                    : 'Propose Team for Public Vote!'}
                </span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* ====================================================================
       * 4. PHASE 2: PUBLIC TEAM VOTE ('team_vote')
       * ==================================================================== */}
      {gameData.phase === 'team_vote' && (
        <div className="bg-white border-4 border-[#161426] rounded-3xl p-5 shadow-[0_8px_0_#161426] space-y-5">
          {/* Proposed Team Display */}
          <div className="bg-[#25204d] text-white border-3 border-[#161426] rounded-2xl p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-black uppercase px-2.5 py-1 rounded-lg bg-[#ffca3a] text-[#161426]">
                {isAr
                  ? `اقتراح القائد (${leaderPlayer?.name || ''}) للمهمة ${
                      currentMission.missionNumber
                    }`
                  : `Leader (${leaderPlayer?.name || ''}) Proposal — Mission ${
                      currentMission.missionNumber
                    }`}
              </span>
              <span className="text-xs font-bold text-[#00f5d4]">
                {isAr
                  ? 'الأغلبية المطلقة مطلوبة للموافقة على الفريق'
                  : 'Strict majority required to approve'}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {(gameData.proposedTeamIds || []).map((id) => {
                const pIdx = safePlayers.findIndex((p) => p.id === id);
                const p = safePlayers[pIdx];
                if (!p) return null;
                return (
                  <div
                    key={id}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-[#00bbf9] text-[#161426] border-3 border-[#161426] shadow-[0_4px_0_#161426] font-black text-sm"
                  >
                    <div className="w-7 h-7 rounded-full overflow-hidden border-2 border-[#161426] bg-white">
                      <CartoonAvatarSvg index={pIdx} color={p.avatar_color} />
                    </div>
                    <span>{p.name}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Voting Controls (Pass-and-Play All-Players List OR Single Online Player) */}
          {!gameData.voteRevealed ? (
            <div className="space-y-3">
              <h4 className="font-black text-base text-[#161426]">
                {isAr
                  ? 'التصويت السري على الفريق المقترح (يُكشف علناً فور تصويت الجميع):'
                  : 'Cast Your Vote on the Proposed Team (Revealed publicly once all vote):'}
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {safePlayers.map((player, idx) => {
                  const hasVoted = Boolean(gameData.teamVotes?.[player.id]);
                  const canVoteForThisPlayer =
                    isPassAndPlay || player.id === myPlayerId || isHost;

                  return (
                    <div
                      key={player.id}
                      className={`rounded-2xl border-3 border-[#161426] p-3 flex items-center justify-between gap-2 ${
                        hasVoted ? 'bg-[#e8fce8]' : 'bg-[#fff9ec]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-10 h-10 rounded-xl overflow-hidden border-2 border-[#161426] bg-white shrink-0">
                          <CartoonAvatarSvg
                            index={idx}
                            color={player.avatar_color}
                          />
                        </div>
                        <div className="min-w-0">
                          <div className="font-black text-sm text-[#161426] truncate">
                            {player.name}
                          </div>
                          <div className="text-xs font-bold text-[#161426]/65">
                            {hasVoted
                              ? isAr
                                ? 'تم تسجيل الصوت'
                                : 'Vote Locked In'
                              : isAr
                              ? 'بانتظار التصويت...'
                              : 'Waiting for vote...'}
                          </div>
                        </div>
                      </div>

                      {canVoteForThisPlayer && !hasVoted ? (
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() =>
                              handleCastTeamVote(player.id, 'approve')
                            }
                            className="px-3 py-2 rounded-xl bg-[#8ac926] hover:bg-[#9be02b] text-[#161426] font-black text-xs border-2 border-[#161426] shadow-[0_3px_0_#161426] active:translate-y-0.5 flex items-center gap-1"
                          >
                            <CheckCircle weight="fill" className="w-4 h-4" />
                            <span>{isAr ? 'موافقة' : 'Approve'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleCastTeamVote(player.id, 'reject')
                            }
                            className="px-3 py-2 rounded-xl bg-[#ff595e] hover:bg-[#ff7074] text-white font-black text-xs border-2 border-[#161426] shadow-[0_3px_0_#161426] active:translate-y-0.5 flex items-center gap-1"
                          >
                            <XCircle weight="fill" className="w-4 h-4" />
                            <span>{isAr ? 'رفض' : 'Reject'}</span>
                          </button>
                        </div>
                      ) : (
                        <span className="px-3 py-1.5 rounded-xl bg-[#161426] text-[#ffca3a] font-black text-xs">
                          {hasVoted
                            ? isAr
                              ? 'جاهز'
                              : 'Ready'
                            : isAr
                            ? 'يفكر...'
                            : 'Thinking...'}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Public Vote Reveal Banner */
            <div className="space-y-4">
              {(() => {
                const votes = gameData.teamVotes || {};
                const approveCount = Object.values(votes).filter(
                  (v) => v === 'approve'
                ).length;
                const rejectCount = Object.values(votes).filter(
                  (v) => v === 'reject'
                ).length;
                const approved = approveCount > rejectCount;

                return (
                  <>
                    <div
                      className={`rounded-2xl border-4 border-[#161426] p-4 text-center shadow-[0_5px_0_#161426] ${
                        approved
                          ? 'bg-[#8ac926] text-[#161426]'
                          : 'bg-[#ff595e] text-white'
                      }`}
                    >
                      <h4 className="text-xl font-black">
                        {approved
                          ? isAr
                            ? `تمت الموافقة على الفريق (${approveCount} موافقة مقابل ${rejectCount} رفض)!`
                            : `TEAM APPROVED (${approveCount} Approve vs ${rejectCount} Reject)!`
                          : isAr
                          ? `تم رفض الفريق المقترح (${rejectCount} رفض مقابل ${approveCount} موافقة)!`
                          : `TEAM REJECTED (${rejectCount} Reject vs ${approveCount} Approve)!`}
                      </h4>
                      <p className="text-xs sm:text-sm font-bold mt-1 opacity-90">
                        {approved
                          ? isAr
                            ? 'ينتقل أعضاء الفريق الآن لتنفيذ المهمة السرية!'
                            : 'The selected team now deploys to execute the mission!'
                          : isAr
                          ? 'تنتقل القيادة للاعب التالي ويزداد عدّاد الرفض بمقدار 1!'
                          : 'Leadership rotates to the next player and the Rejection Track advances!'}
                      </p>
                    </div>

                    {/* Everyone's Public Vote Stamps */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {safePlayers.map((player, idx) => {
                        const v = votes[player.id] || 'reject';
                        return (
                          <div
                            key={player.id}
                            className="rounded-2xl border-3 border-[#161426] bg-[#fff9ec] p-3 flex items-center justify-between gap-2 shadow-[0_4px_0_#161426]"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="w-9 h-9 rounded-xl overflow-hidden border-2 border-[#161426] bg-white shrink-0">
                                <CartoonAvatarSvg
                                  index={idx}
                                  color={player.avatar_color}
                                />
                              </div>
                              <span className="font-black text-xs sm:text-sm text-[#161426] truncate">
                                {player.name}
                              </span>
                            </div>
                            <VoteStampSvg vote={v} className="w-10 h-10 shrink-0" />
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={handleResolveVoteResult}
                        className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-[#00bbf9] hover:bg-[#33c9fa] text-[#161426] font-black text-base border-4 border-[#161426] shadow-[0_6px_0_#161426] active:translate-y-1 transition-all flex items-center justify-center gap-2"
                      >
                        <Lightning weight="fill" className="w-5 h-5" />
                        <span>
                          {approved
                            ? isAr
                              ? 'بدء تنفيذ المهمة السرية!'
                              : 'Proceed to Mission Execution!'
                            : isAr
                            ? 'تدوير القائد والعودة للاختيار'
                            : 'Rotate Leader & Continue'}
                        </span>
                      </button>
                    </div>
                  </>
                );
              })()}
            </div>
          )}
        </div>
      )}

      {/* ====================================================================
       * 5. PHASE 3: SECRET MISSION EXECUTION ('mission_execute')
       * ==================================================================== */}
      {gameData.phase === 'mission_execute' && (
        <div className="bg-[#1e1b36] text-white border-4 border-[#161426] rounded-3xl p-5 shadow-[0_8px_0_#161426] space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-white/15 pb-4">
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#ffca3a] text-[#161426] font-black text-xs border-2 border-[#161426]">
                <LockKey weight="fill" className="w-4 h-4" />
                <span>
                  {isAr
                    ? 'غرفة العمليات المشفرة — قرارات المهمة سرية تماماً!'
                    : 'ENCRYPTED MISSION CHAMBER — CARDS ARE SHUFFLED ANONYMOUSLY!'}
                </span>
              </span>
              <h3 className="text-xl font-black text-white">
                {isAr
                  ? `تنفيذ المهمة ${currentMission.missionNumber}: ${currentMission.codeNameAr}`
                  : `Executing Mission ${currentMission.missionNumber}: ${currentMission.codeNameEn}`}
              </h3>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {(gameData.proposedTeamIds || []).map((memberId) => {
              const pIdx = safePlayers.findIndex((p) => p.id === memberId);
              const member = safePlayers[pIdx];
              if (!member) return null;

              const hasSubmitted = Boolean(gameData.missionActions?.[memberId]);
              const memberRole = gameData.roles?.[memberId] || 'agent';
              const isViewerThisMember = currentViewerId === memberId;

              return (
                <div
                  key={memberId}
                  className={`rounded-2xl border-4 border-[#161426] p-4 transition-all ${
                    hasSubmitted
                      ? 'bg-[#25204d] opacity-90'
                      : isViewerThisMember
                      ? 'bg-[#fff9ec] text-[#161426] shadow-[0_6px_0_#00bbf9]'
                      : 'bg-[#25204d] text-white'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl overflow-hidden border-3 border-[#161426] bg-white shrink-0">
                        <CartoonAvatarSvg
                          index={pIdx}
                          color={member.avatar_color}
                        />
                      </div>
                      <div>
                        <h4 className="font-black text-base">{member.name}</h4>
                        <p className="text-xs font-bold opacity-75">
                          {hasSubmitted
                            ? isAr
                              ? 'تم تسليم بطاقة المهمة المشفرة في الصندوق!'
                              : 'Encrypted Mission Card deposited in vault!'
                            : isViewerThisMember
                            ? isAr
                              ? 'دورك الآن لتسليم قرار المهمة السري:'
                              : 'Your turn to submit your secret mission card:'
                            : isPassAndPlay
                            ? isAr
                              ? `مرر الجهاز إلى (${member.name}) أو اختر اسمه من الأعلى لتنفيذ المهمة`
                              : `Switch to (${member.name}) at the top bar to execute mission`
                            : isAr
                            ? 'يقوم الآن بتنفيذ المهمة سراً...'
                            : 'Secretly executing mission...'}
                        </p>
                      </div>
                    </div>

                    {/* Action Buttons for Active Member */}
                    {!hasSubmitted && isViewerThisMember && (
                      <div className="flex flex-wrap items-center gap-2.5">
                        {/* Success Card Button (Available to both Agents & Spies) */}
                        <button
                          type="button"
                          onClick={() =>
                            handleSubmitMissionAction(memberId, 'success')
                          }
                          className="px-4 py-3 rounded-2xl bg-[#00bbf9] hover:bg-[#33c9fa] text-[#161426] font-black text-xs sm:text-sm border-3 border-[#161426] shadow-[0_4px_0_#161426] active:translate-y-0.5 flex items-center gap-2"
                        >
                          <ShieldCheck weight="fill" className="w-5 h-5" />
                          <span>
                            {memberRole === 'spy'
                              ? isAr
                                ? 'إنجاح المهمة (تمويه ذكي)'
                                : 'Succeed Mission (Bluff)'
                              : isAr
                              ? 'إنجاح المهمة!'
                              : 'Succeed Mission!'}
                          </span>
                        </button>

                        {/* Sabotage Card Button (Enabled for Spies; Locked with identical layout for Agents!) */}
                        {memberRole === 'spy' ? (
                          <button
                            type="button"
                            onClick={() =>
                              handleSubmitMissionAction(memberId, 'sabotage')
                            }
                            className="px-4 py-3 rounded-2xl bg-[#ff595e] hover:bg-[#ff7074] text-white font-black text-xs sm:text-sm border-3 border-[#161426] shadow-[0_4px_0_#161426] active:translate-y-0.5 flex items-center gap-2"
                          >
                            <ShieldWarning weight="fill" className="w-5 h-5" />
                            <span>
                              {isAr ? 'تخريب المهمة!' : 'Sabotage Mission!'}
                            </span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled
                            title={
                              isAr
                                ? 'العميل الشريف لا يخرب المهمة'
                                : 'Loyal Agents cannot sabotage missions'
                            }
                            className="px-4 py-3 rounded-2xl bg-slate-300 text-slate-600 font-black text-xs sm:text-sm border-3 border-[#161426] opacity-80 cursor-not-allowed flex items-center gap-1.5"
                          >
                            <LockKey weight="fill" className="w-4 h-4" />
                            <span>
                              {isAr
                                ? 'تخريب (العميل الشريف لا يخرب المهمة)'
                                : 'Sabotage (Locked for Loyal Agent)'}
                            </span>
                          </button>
                        )}
                      </div>
                    )}

                    {hasSubmitted && (
                      <span className="px-3.5 py-2 rounded-xl bg-[#8ac926] text-[#161426] font-black text-xs border-2 border-[#161426] flex items-center gap-1.5 self-start sm:self-center">
                        <CheckCircle weight="fill" className="w-4 h-4" />
                        <span>{isAr ? 'تم التسليم' : 'Card Submitted'}</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ====================================================================
       * 6. PHASE 4: ANONYMOUS MISSION REVEAL ('mission_reveal')
       * ==================================================================== */}
      {gameData.phase === 'mission_reveal' && (
        <div className="bg-white border-4 border-[#161426] rounded-3xl p-6 shadow-[0_8px_0_#161426] space-y-5 text-center">
          {(() => {
            const sabotageCount = currentMission.sabotageCount || 0;
            const successCount =
              currentMission.successCount ??
              currentMission.requiredTeamSize - sabotageCount;
            const succeeded = sabotageCount === 0;

            // Build anonymous sorted card array (Success first, then Sabotage) so order never leaks who played what!
            const anonymousCards: ('success' | 'sabotage')[] = [
              ...Array(Math.max(0, successCount)).fill('success'),
              ...Array(Math.max(0, sabotageCount)).fill('sabotage'),
            ];

            return (
              <>
                <div
                  className={`rounded-3xl border-4 border-[#161426] p-6 shadow-[0_6px_0_#161426] ${
                    succeeded
                      ? 'bg-gradient-to-b from-[#00bbf9] to-[#0096c7] text-[#161426]'
                      : 'bg-gradient-to-b from-[#ff595e] to-[#d90429] text-white'
                  }`}
                >
                  <div className="flex justify-center mb-3">
                    <MissionVaultSvg
                      status={succeeded ? 'success' : 'sabotaged'}
                      sizeNumber={currentMission.requiredTeamSize}
                      missionNumber={currentMission.missionNumber}
                      className="w-20 h-20"
                    />
                  </div>

                  <span className="px-3 py-1 rounded-full bg-[#161426] text-[#ffca3a] font-black text-xs uppercase">
                    {isAr
                      ? `تقرير المهمة ${currentMission.missionNumber} — بدون كشف الأسماء!`
                      : `MISSION ${currentMission.missionNumber} REPORT — ANONYMOUS DECRYPTION`}
                  </span>

                  <h3 className="text-2xl sm:text-3xl font-black mt-2">
                    {succeeded
                      ? isAr
                        ? 'نجحت المهمة السرية بالكامل!'
                        : 'MISSION SUCCEEDED FLAWLESSLY!'
                      : isAr
                      ? `فشلت المهمة! تم العثور على (${sabotageCount}) بطاقة تخريب!`
                      : `MISSION SABOTAGED! (${sabotageCount}) SABOTAGE CARD(S) DETECTED!`}
                  </h3>

                  <p className="text-xs sm:text-sm font-bold mt-2 opacity-90 max-w-xl mx-auto">
                    {succeeded
                      ? isAr
                        ? 'جميع البطاقات المسلمة كانت لإنجاح المهمة (أو أن الجاسوس قام بالتمويه لكسب ثقتكم)!'
                        : 'Every card submitted was a Success card (or a Spy blended in to gain your trust)!'
                      : isAr
                      ? `أحد أعضاء هذا الفريق على الأقل جاسوس خائن! ناقشوا من تتهمون قبل المهمة القادمة!`
                      : `At least ${sabotageCount} member(s) of this Mission Team is a traitor!`}
                  </p>
                </div>

                {/* Anonymous Shuffled Mission Cards */}
                <div className="flex flex-wrap items-center justify-center gap-3 py-2">
                  {anonymousCards.map((cardType, cIdx) => (
                    <div
                      key={cIdx}
                      className={`w-32 sm:w-36 rounded-2xl border-4 border-[#161426] p-3.5 shadow-[0_5px_0_#161426] flex flex-col items-center gap-2 ${
                        cardType === 'success'
                          ? 'bg-[#e0f8ff] text-[#161426]'
                          : 'bg-[#ffe3e4] text-[#161426]'
                      }`}
                    >
                      {cardType === 'success' ? (
                        <AgentBadgeSvg className="w-12 h-12" />
                      ) : (
                        <SpyBadgeSvg className="w-12 h-12" />
                      )}
                      <span className="font-black text-xs uppercase">
                        {cardType === 'success'
                          ? isAr
                            ? 'بطاقة إنجاح'
                            : 'SUCCESS CARD'
                          : isAr
                          ? 'بطاقة تخريب!'
                          : 'SABOTAGE CARD!'}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Team Members Reminder */}
                <div className="bg-[#fff9ec] border-3 border-[#161426] rounded-2xl p-3 flex flex-wrap items-center justify-center gap-2">
                  <span className="text-xs font-black text-[#161426]/70">
                    {isAr
                      ? 'أعضاء الفريق الذين نفذوا المهمة:'
                      : 'Team Members on this Mission:'}
                  </span>
                  {(currentMission.teamIds || gameData.proposedTeamIds || []).map(
                    (id) => {
                      const p = safePlayers.find((pl) => pl.id === id);
                      if (!p) return null;
                      return (
                        <span
                          key={id}
                          className="px-2.5 py-1 rounded-xl bg-white border-2 border-[#161426] font-black text-xs text-[#161426]"
                        >
                          {p.name}
                        </span>
                      );
                    }
                  )}
                </div>

                <div className="flex justify-center pt-2">
                  <button
                    type="button"
                    onClick={handleProceedAfterMissionReveal}
                    className="px-8 py-4 rounded-2xl bg-[#ffca3a] hover:bg-[#ffd45c] text-[#161426] font-black text-base border-4 border-[#161426] shadow-[0_6px_0_#161426] active:translate-y-1 transition-all flex items-center gap-2"
                  >
                    <ArrowsClockwise weight="bold" className="w-5 h-5" />
                    <span>
                      {succeededMissionsCount >= 3 ||
                      sabotagedMissionsCount >= 3
                        ? isAr
                          ? 'الانتقال إلى الحسم النهائي!'
                          : 'Proceed to Final Showdown!'
                        : isAr
                        ? 'الانتقال إلى المهمة التالية'
                        : 'Continue to Next Mission'}
                    </span>
                  </button>
                </div>
              </>
            );
          })()}
        </div>
      )}

      {/* ====================================================================
       * 7. PHASE 4.5: FINAL ASSASSINATION TWIST ('assassinate')
       * ==================================================================== */}
      {gameData.phase === 'assassinate' && (
        <div className="bg-gradient-to-br from-[#2b1329] via-[#1e1b36] to-[#161426] text-white border-4 border-[#161426] rounded-3xl p-5 sm:p-6 shadow-[0_8px_0_#161426] space-y-5">
          <div className="flex flex-col sm:flex-row items-center gap-4 bg-[#161426]/80 border-3 border-[#ff595e] rounded-2xl p-4">
            <SpyBadgeSvg className="w-16 h-16 shrink-0" />
            <div className="space-y-1 text-center sm:text-start">
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#ff595e] text-white text-xs font-black">
                <Crosshair weight="bold" className="w-4 h-4" />
                <span>
                  {isAr
                    ? 'الفرصة الأخيرة للجواسيس — اغتيال القائد السري!'
                    : 'SPIES LAST STAND — IDENTIFY CHIEF INTELLIGENCE!'}
                </span>
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-[#ffca3a]">
                {isAr
                  ? 'نجح العملاء في 3 مهمات... لكن الجواسيس يملكون رصاصة أخيرة!'
                  : 'Agents completed 3 missions... but the Spies have one final shot!'}
              </h3>
              <p className="text-xs sm:text-sm font-bold text-white/85">
                {isAr
                  ? 'إذا نجح الجواسيس في تخمين من هو «قائد المخابرات السري» من بين العملاء، يسرق الجواسيس الفوز فوراً!'
                  : 'If the Spies correctly guess which Agent is Chief Intelligence (Commander), the Spies steal the victory!'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {agentPlayers.map((candidate) => {
              const pIdx = safePlayers.findIndex((p) => p.id === candidate.id);
              const isSelected = assassinCandidateId === candidate.id;
              return (
                <button
                  key={candidate.id}
                  type="button"
                  onClick={() => setAssassinCandidateId(candidate.id)}
                  className={`rounded-2xl border-4 border-[#161426] p-3.5 flex flex-col items-center text-center transition-all ${
                    isSelected
                      ? 'bg-[#ff595e] text-white shadow-[0_6px_0_#161426] -translate-y-1'
                      : 'bg-[#fff9ec] text-[#161426] hover:bg-[#ffe3e4] shadow-[0_4px_0_#161426]'
                  }`}
                >
                  <div className="w-14 h-14 rounded-2xl overflow-hidden border-3 border-[#161426] bg-white mb-2">
                    <CartoonAvatarSvg
                      index={pIdx}
                      color={candidate.avatar_color}
                    />
                  </div>
                  <span className="font-black text-sm">{candidate.name}</span>
                  <span className="mt-1.5 text-xs font-extrabold flex items-center gap-1">
                    <Crosshair weight="bold" className="w-3.5 h-3.5" />
                    <span>
                      {isSelected
                        ? isAr
                          ? 'الهدف المحدد!'
                          : 'Targeted!'
                        : isAr
                        ? 'استهداف كقائد'
                        : 'Target as Commander'}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          {(isAssassin || myRole === 'spy' || isPassAndPlay || isHost) && (
            <div className="flex justify-center pt-2">
              <button
                type="button"
                disabled={!assassinCandidateId}
                onClick={() => handleExecuteAssassination(assassinCandidateId)}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-[#ff595e] hover:bg-[#ff7074] disabled:bg-slate-600 text-white font-black text-base border-4 border-[#161426] shadow-[0_6px_0_#161426] active:translate-y-1 transition-all flex items-center justify-center gap-2"
              >
                <Crosshair weight="fill" className="w-5 h-5" />
                <span>
                  {isAr
                    ? 'تأكيد قرار الاغتيال وكشف الهويات!'
                    : 'Execute Final Shot & Reveal All Roles!'}
                </span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* ====================================================================
       * 8. PHASE 5: GAME OVER & FULL DOSSIER REVEAL ('game_over')
       * ==================================================================== */}
      {gameData.phase === 'game_over' && (
        <div className="bg-white border-4 border-[#161426] rounded-3xl p-5 sm:p-6 shadow-[0_8px_0_#161426] space-y-6">
          {/* Winner Banner */}
          <div
            className={`rounded-3xl border-4 border-[#161426] p-6 text-center shadow-[0_6px_0_#161426] ${
              gameData.winner === 'agents'
                ? 'bg-gradient-to-b from-[#00bbf9] to-[#0096c7] text-[#161426]'
                : 'bg-gradient-to-b from-[#ff595e] to-[#d90429] text-white'
            }`}
          >
            <div className="flex justify-center mb-3">
              {gameData.winner === 'agents' ? (
                <AgentBadgeSvg className="w-20 h-20" />
              ) : (
                <SpyBadgeSvg className="w-20 h-20" />
              )}
            </div>

            <span className="px-3 py-1 rounded-full bg-[#161426] text-[#ffca3a] font-black text-xs uppercase">
              {isAr ? 'انتهت العملية السرية!' : 'OPERATION CONCLUDED!'}
            </span>

            <h3 className="text-2xl sm:text-3xl font-black mt-2">
              {gameData.winner === 'agents'
                ? isAr
                  ? 'انتصار عملاء المقاومة الشرفاء!'
                  : 'VICTORY FOR THE RESISTANCE AGENTS!'
                : isAr
                ? 'انتصار الجواسيس الخونة!'
                : 'VICTORY FOR THE UNDERCOVER SPIES!'}
            </h3>

            <p className="text-sm font-bold mt-2 max-w-xl mx-auto">
              {isAr ? gameData.winReasonAr : gameData.winReasonEn}
            </p>
          </div>

          {/* Full Secret Identities Reveal */}
          <div className="space-y-3">
            <h4 className="font-black text-lg text-[#161426] flex items-center gap-2">
              <Medal weight="fill" className="w-5 h-5 text-[#ff924c]" />
              <span>
                {isAr
                  ? 'كشف الهويات السرية لجميع اللاعبين:'
                  : 'Full Classified Identity Reveal:'}
              </span>
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {safePlayers.map((player, idx) => {
                const role = gameData.roles?.[player.id] || 'agent';
                const isCmd = player.id === gameData.commanderId;
                const wasAssassinated =
                  player.id === gameData.assassinatedTargetId;

                return (
                  <div
                    key={player.id}
                    className={`rounded-2xl border-4 border-[#161426] p-3.5 flex flex-col items-center text-center shadow-[0_5px_0_#161426] ${
                      role === 'spy'
                        ? 'bg-[#ffe3e4]'
                        : isCmd
                        ? 'bg-[#f3e8ff]'
                        : 'bg-[#e0f8ff]'
                    }`}
                  >
                    <div className="relative mb-2">
                      <div className="w-14 h-14 rounded-2xl overflow-hidden border-3 border-[#161426] bg-white">
                        <CartoonAvatarSvg
                          index={idx}
                          color={player.avatar_color}
                        />
                      </div>
                      <div className="absolute -bottom-2 -right-2">
                        {role === 'spy' ? (
                          <SpyBadgeSvg className="w-8 h-8" />
                        ) : isCmd ? (
                          <CommanderBadgeSvg className="w-8 h-8" />
                        ) : (
                          <AgentBadgeSvg className="w-8 h-8" />
                        )}
                      </div>
                    </div>

                    <span className="font-black text-sm text-[#161426]">
                      {player.name}
                    </span>

                    <span
                      className={`mt-1.5 px-2.5 py-0.5 rounded-lg border-2 border-[#161426] text-[11px] font-black ${
                        role === 'spy'
                          ? 'bg-[#ff595e] text-white'
                          : isCmd
                          ? 'bg-[#9b5de5] text-white'
                          : 'bg-[#00bbf9] text-[#161426]'
                      }`}
                    >
                      {role === 'spy'
                        ? isAr
                          ? 'جاسوس خائن'
                          : 'Undercover Spy'
                        : isCmd
                        ? isAr
                          ? 'القائد السري'
                          : 'Chief Intelligence'
                        : isAr
                        ? 'عميل شريف'
                        : 'Loyal Agent'}
                    </span>

                    {wasAssassinated && (
                      <span className="mt-1 text-[10px] font-black text-[#d90429]">
                        {isAr ? '(تم استهدافه بالاغتيال)' : '(Targeted by Spy)'}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Play Again Button */}
          <div className="flex justify-center pt-2">
            <button
              type="button"
              onClick={onStartNewRound}
              className="px-8 py-4 rounded-2xl bg-[#8ac926] hover:bg-[#9be02b] text-[#161426] font-black text-base border-4 border-[#161426] shadow-[0_6px_0_#161426] active:translate-y-1 transition-all flex items-center gap-2"
            >
              <Sparkle weight="fill" className="w-5 h-5" />
              <span>
                {isAr ? 'عملية سرية جديدة!' : 'Start New Operation!'}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* ====================================================================
       * 9. PUBLIC VOTE LOG & MISSION HISTORY ACCORDION
       * ==================================================================== */}
      {(gameData.voteHistory || []).length > 0 && (
        <div className="bg-[#fff9ec] border-4 border-[#161426] rounded-3xl p-4 shadow-[0_6px_0_#161426] space-y-2.5">
          <div className="flex items-center gap-2 text-xs sm:text-sm font-black text-[#161426]">
            <HandPalm weight="fill" className="w-4 h-4 text-[#9b5de5]" />
            <span>
              {isAr
                ? 'سجل التصويت العلني للمخابرات (حلّل من وافق على الفرق المخربة!):'
                : 'Public Intelligence Vote Log (Analyze who approved sabotaged teams!):'}
            </span>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {(gameData.voteHistory || []).map((entry, idx) => {
              const leader = safePlayers.find((p) => p.id === entry.leaderId);
              const teamNames = entry.teamIds
                .map((id) => safePlayers.find((p) => p.id === id)?.name)
                .filter(Boolean)
                .join('، ');

              return (
                <div
                  key={idx}
                  className="rounded-xl border-2 border-[#161426] bg-white p-2.5 text-xs flex flex-wrap items-center justify-between gap-2"
                >
                  <div className="font-bold text-[#161426]">
                    <span className="font-black">
                      {isAr
                        ? `مهمة ${entry.missionNumber} (محاولة ${entry.attemptNumber}) — القائد ${
                            leader?.name || ''
                          }: `
                        : `M${entry.missionNumber} (#${entry.attemptNumber}) — Leader ${
                            leader?.name || ''
                          }: `}
                    </span>
                    <span>[{teamNames}]</span>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-lg border border-[#161426] font-black ${
                      entry.approved
                        ? 'bg-[#8ac926] text-[#161426]'
                        : 'bg-[#ff595e] text-white'
                    }`}
                  >
                    {entry.approved
                      ? isAr
                        ? 'مقبول'
                        : 'Approved'
                      : isAr
                      ? 'مرفوض'
                      : 'Rejected'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
