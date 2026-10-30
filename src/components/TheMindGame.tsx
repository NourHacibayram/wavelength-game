import React, { useState } from 'react';
import {
  Heart,
  StarFour,
  HandPalm,
  Eye,
  EyeSlash,
  Sparkle,
  CheckCircle,
  WarningOctagon,
  Trophy,
  ArrowsClockwise,
  Lightning,
  Play,
} from '@phosphor-icons/react';
import { PartyGameSvgIcon } from './CartoonIcons';

export interface TheMindGameState {
  phase: 'focus' | 'playing' | 'mistake_pause' | 'level_clear' | 'victory' | 'gameover';
  level: number;
  maxLevel: number;
  lives: number;
  maxLives: number;
  shurikens: number;
  hands: Record<string, number[]>;
  pile: { value: number; playerId: string }[];
  readyPlayerIds: string[];
  holdSignalIds: string[];
  shurikenVoteIds: string[];
  lastShurikenDiscards?: { playerId: string; value: number }[];
  lastMistake?: {
    playedBy: string;
    playedCard: number;
    skippedCards: { playerId: string; value: number }[];
  };
  lastReward?: 'life' | 'shuriken' | null;
}

interface PlayerInfo {
  id: string;
  name: string;
  avatar_color: string;
  score: number;
}

interface TheMindGameProps {
  gameData: TheMindGameState;
  players: PlayerInfo[];
  myPlayerId: string;
  isHost: boolean;
  isPassAndPlay: boolean;
  lang: 'ar' | 'en';
  onUpdateGameData: (
    nextData: TheMindGameState,
    scoreAwards?: Record<string, number>
  ) => void;
  onStartNewRound: () => void;
}

export function dealTheMindHands(
  playerIds: string[],
  cardsPerPlayer: number
): Record<string, number[]> {
  const deck = Array.from({ length: 100 }, (_, i) => i + 1);
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = deck[i];
    deck[i] = deck[j];
    deck[j] = tmp;
  }

  const maxSafePerPlayer = Math.max(
    1,
    Math.min(cardsPerPlayer, Math.floor(100 / Math.max(1, playerIds.length)))
  );

  const hands: Record<string, number[]> = {};
  let cursor = 0;
  playerIds.forEach((pid) => {
    const slice = deck.slice(cursor, cursor + maxSafePerPlayer).sort((a, b) => a - b);
    hands[pid] = slice;
    cursor += maxSafePerPlayer;
  });
  return hands;
}

export function buildInitialTheMindState(playerIds: string[]): TheMindGameState {
  const count = Math.max(2, playerIds.length);
  const startingLives = count <= 2 ? 3 : count === 3 ? 3 : 4;
  const maxLevel = count <= 2 ? 8 : count === 3 ? 7 : 6;
  return {
    phase: 'focus',
    level: 1,
    maxLevel,
    lives: startingLives,
    maxLives: 5,
    shurikens: 1,
    hands: dealTheMindHands(playerIds, 1),
    pile: [],
    readyPlayerIds: [],
    holdSignalIds: [],
    shurikenVoteIds: [],
    lastShurikenDiscards: [],
    lastReward: null,
  };
}

export const TheMindGame: React.FC<TheMindGameProps> = ({
  gameData,
  players,
  myPlayerId,
  isHost,
  isPassAndPlay,
  lang,
  onUpdateGameData,
  onStartNewRound,
}) => {
  const [localPeekPlayerId, setLocalPeekPlayerId] = useState<string | null>(null);
  const [hideOnlineHand, setHideOnlineHand] = useState<boolean>(false);

  const activePlayerIds = players.map((p) => p.id);
  const myHand = (gameData.hands?.[myPlayerId] || []).slice().sort((a, b) => a - b);
  const topPileEntry =
    gameData.pile && gameData.pile.length > 0
      ? gameData.pile[gameData.pile.length - 1]
      : null;

  const totalRemainingCards = activePlayerIds.reduce(
    (sum, pid) => sum + (gameData.hands?.[pid]?.length || 0),
    0
  );

  const playersWithCards = players.filter(
    (p) => (gameData.hands?.[p.id]?.length || 0) > 0
  );

  const getPlayerName = (pid: string) =>
    players.find((p) => p.id === pid)?.name || (lang === 'ar' ? 'لاعب' : 'Player');

  const getPlayerColor = (pid: string) =>
    players.find((p) => p.id === pid)?.avatar_color || '#ffca3a';

  // Sync / Focus Check-in before silent level starts
  const handleToggleReady = (pid: string) => {
    const current = new Set(gameData.readyPlayerIds || []);
    if (current.has(pid)) {
      current.delete(pid);
    } else {
      current.add(pid);
    }
    const nextReady = Array.from(current);
    const allReady = activePlayerIds.every((id) => nextReady.includes(id));

    onUpdateGameData({
      ...gameData,
      readyPlayerIds: nextReady,
      phase: allReady ? 'playing' : 'focus',
    });
  };

  const handleForceStartPlaying = () => {
    setLocalPeekPlayerId(null);
    onUpdateGameData({
      ...gameData,
      readyPlayerIds: activePlayerIds,
      phase: 'playing',
    });
  };

  // Toggle Non-Verbal "Wait / Hold On!" Hand Signal
  const handleToggleHoldSignal = (pid: string) => {
    const set = new Set(gameData.holdSignalIds || []);
    if (set.has(pid)) {
      set.delete(pid);
    } else {
      set.add(pid);
    }
    onUpdateGameData({
      ...gameData,
      holdSignalIds: Array.from(set),
    });
  };

  // Award helper when a level is cleared
  const buildLevelClearTransition = (
    baseState: TheMindGameState
  ): { next: TheMindGameState; awards: Record<string, number> } => {
    const awards: Record<string, number> = {};
    const ptsEach = 2 + Math.floor(baseState.level / 2);
    activePlayerIds.forEach((pid) => {
      awards[pid] = ptsEach;
    });

    if (baseState.level >= baseState.maxLevel) {
      return {
        next: {
          ...baseState,
          phase: 'victory',
          holdSignalIds: [],
          shurikenVoteIds: [],
        },
        awards,
      };
    }

    // Official Mind Rewards: Lv 2 & 5 -> +1 Shuriken; Lv 3 & 6 -> +1 Life
    let nextLives = baseState.lives;
    let nextShurikens = baseState.shurikens;
    let reward: 'life' | 'shuriken' | null = null;

    if (baseState.level === 2 || baseState.level === 5) {
      nextShurikens = Math.min(3, nextShurikens + 1);
      reward = 'shuriken';
    } else if (baseState.level === 3 || baseState.level === 6) {
      nextLives = Math.min(baseState.maxLives, nextLives + 1);
      reward = 'life';
    }

    return {
      next: {
        ...baseState,
        lives: nextLives,
        shurikens: nextShurikens,
        phase: 'level_clear',
        holdSignalIds: [],
        shurikenVoteIds: [],
        lastReward: reward,
      },
      awards,
    };
  };

  // Core Action: A player plays their lowest card onto the central ascending pile!
  const handlePlayLowestCard = (actingPlayerId: string) => {
    if (gameData.phase !== 'playing') return;
    const actorHand = (gameData.hands?.[actingPlayerId] || [])
      .slice()
      .sort((a, b) => a - b);
    if (actorHand.length === 0) return;

    const playedCard = actorHand[0];
    const remainingActorHand = actorHand.slice(1);

    // Check ALL other players' hands for ANY card strictly smaller than playedCard!
    const skippedCards: { playerId: string; value: number }[] = [];
    const nextHands: Record<string, number[]> = {};

    activePlayerIds.forEach((pid) => {
      if (pid === actingPlayerId) {
        nextHands[pid] = remainingActorHand;
      } else {
        const pHand = (gameData.hands?.[pid] || []).slice().sort((a, b) => a - b);
        const lower = pHand.filter((val) => val < playedCard);
        const kept = pHand.filter((val) => val >= playedCard);
        lower.forEach((val) => skippedCards.push({ playerId: pid, value: val }));
        nextHands[pid] = kept;
      }
    });

    const nextPile = [
      ...(gameData.pile || []),
      { value: playedCard, playerId: actingPlayerId },
    ];

    // MISTAKE: Someone held a lower card!
    if (skippedCards.length > 0) {
      const nextLives = Math.max(0, gameData.lives - 1);
      const updatedState: TheMindGameState = {
        ...gameData,
        lives: nextLives,
        hands: nextHands,
        pile: nextPile,
        holdSignalIds: [],
        shurikenVoteIds: [],
        lastShurikenDiscards: [],
        lastMistake: {
          playedBy: actingPlayerId,
          playedCard,
          skippedCards: skippedCards.sort((a, b) => a.value - b.value),
        },
        phase: nextLives <= 0 ? 'gameover' : 'mistake_pause',
      };
      onUpdateGameData(updatedState);
      return;
    }

    // CLEAN TELEPATHIC PLAY! Check if all cards in the room are now played
    const cardsLeftAfterPlay = Object.values(nextHands).reduce(
      (s, arr) => s + arr.length,
      0
    );

    const cleanState: TheMindGameState = {
      ...gameData,
      hands: nextHands,
      pile: nextPile,
      holdSignalIds: (gameData.holdSignalIds || []).filter(
        (id) => id !== actingPlayerId
      ),
      shurikenVoteIds: [],
      lastShurikenDiscards: [],
      lastMistake: undefined,
    };

    if (cardsLeftAfterPlay === 0) {
      const { next, awards } = buildLevelClearTransition(cleanState);
      onUpdateGameData(next, awards);
    } else {
      onUpdateGameData(cleanState);
    }
  };

  // Resume after inspecting a mistake clash
  const handleResumeAfterMistake = () => {
    const cardsLeft = Object.values(gameData.hands || {}).reduce(
      (s, arr) => s + arr.length,
      0
    );
    if (cardsLeft === 0) {
      const { next, awards } = buildLevelClearTransition({
        ...gameData,
        lastMistake: undefined,
      });
      onUpdateGameData(next, awards);
    } else {
      onUpdateGameData({
        ...gameData,
        phase: 'playing',
        lastMistake: undefined,
      });
    }
  };

  // Execute Throwing Star (everyone reveals & discards their lowest card!)
  const executeShuriken = (currentState: TheMindGameState) => {
    if (currentState.shurikens <= 0) return;
    const discards: { playerId: string; value: number }[] = [];
    const nextHands: Record<string, number[]> = {};

    activePlayerIds.forEach((pid) => {
      const sorted = (currentState.hands?.[pid] || []).slice().sort((a, b) => a - b);
      if (sorted.length > 0) {
        discards.push({ playerId: pid, value: sorted[0] });
        nextHands[pid] = sorted.slice(1);
      } else {
        nextHands[pid] = [];
      }
    });

    const cardsLeft = Object.values(nextHands).reduce((s, arr) => s + arr.length, 0);
    const afterStar: TheMindGameState = {
      ...currentState,
      shurikens: currentState.shurikens - 1,
      hands: nextHands,
      shurikenVoteIds: [],
      holdSignalIds: [],
      lastShurikenDiscards: discards.sort((a, b) => a.value - b.value),
    };

    if (cardsLeft === 0) {
      const { next, awards } = buildLevelClearTransition(afterStar);
      onUpdateGameData(next, awards);
    } else {
      onUpdateGameData(afterStar);
    }
  };

  const handleVoteShuriken = (pid: string) => {
    if (gameData.shurikens <= 0 || gameData.phase !== 'playing') return;
    if (isPassAndPlay) {
      executeShuriken(gameData);
      return;
    }

    const votersNeeded = playersWithCards.map((p) => p.id);
    const votes = new Set(gameData.shurikenVoteIds || []);
    if (votes.has(pid)) {
      votes.delete(pid);
    } else {
      votes.add(pid);
    }
    const nextVotes = Array.from(votes);
    const unanimous =
      votersNeeded.length > 0 && votersNeeded.every((id) => nextVotes.includes(id));

    if (unanimous) {
      executeShuriken({ ...gameData, shurikenVoteIds: nextVotes });
    } else {
      onUpdateGameData({
        ...gameData,
        shurikenVoteIds: nextVotes,
      });
    }
  };

  // Advance to Next Level (Level + 1 cards per player!)
  const handleStartNextLevel = () => {
    const nextLvl = gameData.level + 1;
    setLocalPeekPlayerId(null);
    onUpdateGameData({
      ...gameData,
      phase: 'focus',
      level: nextLvl,
      hands: dealTheMindHands(activePlayerIds, nextLvl),
      pile: [],
      readyPlayerIds: [],
      holdSignalIds: [],
      shurikenVoteIds: [],
      lastShurikenDiscards: [],
      lastMistake: undefined,
      lastReward: null,
    });
  };

  return (
    <div className="space-y-4">
      {/* TOP STATUS BAR: Level, Lives (Hearts), Throwing Stars (Shurikens), Remaining Cards */}
      <div className="cartoon-panel-dark p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#fff1e6] border-3 border-[#161426] flex items-center justify-center shrink-0">
            <PartyGameSvgIcon gameId="themind" className="w-9 h-9" />
          </div>
          <div>
            <div className="text-xs font-extrabold text-[#ffca3a] uppercase tracking-wide">
              {lang === 'ar'
                ? 'تزامن صامت — ممنوع الكلام أو ذكر الأرقام!'
                : 'Silent Co-op — No Talking or Signaling Numbers!'}
            </div>
            <div className="text-lg sm:text-xl font-extrabold text-white flex items-center gap-2">
              <span>
                {lang === 'ar'
                  ? `المستوى ${gameData.level} من ${gameData.maxLevel}`
                  : `Level ${gameData.level} of ${gameData.maxLevel}`}
              </span>
              <span className="text-xs bg-[#ff924c] text-[#161426] px-2.5 py-0.5 rounded-full border-2 border-[#161426] font-extrabold">
                {lang === 'ar'
                  ? `${totalRemainingCards} كروت متبقية`
                  : `${totalRemainingCards} cards left`}
              </span>
            </div>
          </div>
        </div>

        {/* Team Lives & Throwing Stars */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Lives (Hearts) */}
          <div className="cartoon-badge bg-[#191636] text-white px-3.5 py-1.5 flex items-center gap-1.5">
            <span className="text-xs font-extrabold text-[#fda4af] me-0.5">
              {lang === 'ar' ? 'القلوب:' : 'Lives:'}
            </span>
            {Array.from({ length: gameData.maxLives }).map((_, i) => {
              const alive = i < gameData.lives;
              return (
                <Heart
                  key={i}
                  weight={alive ? 'fill' : 'regular'}
                  className={`w-5 h-5 transition-transform ${
                    alive ? 'text-[#ff595e] scale-105' : 'text-white/25'
                  }`}
                />
              );
            })}
          </div>

          {/* Throwing Stars (Shurikens) */}
          <div className="cartoon-badge bg-[#191636] text-white px-3.5 py-1.5 flex items-center gap-1.5">
            <span className="text-xs font-extrabold text-[#fde047] me-0.5">
              {lang === 'ar' ? 'نجوم التزامن:' : 'Stars:'}
            </span>
            {Array.from({ length: 3 }).map((_, i) => {
              const active = i < gameData.shurikens;
              return (
                <StarFour
                  key={i}
                  weight={active ? 'fill' : 'regular'}
                  className={`w-5 h-5 ${
                    active ? 'text-[#ffca3a]' : 'text-white/25'
                  }`}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* PASS-AND-PLAY SECRET CARD PEEK DRAWER (So players on 1 device can memorize privately!) */}
      {isPassAndPlay &&
        (gameData.phase === 'focus' || gameData.phase === 'playing') && (
          <div className="cartoon-card p-4 bg-[#fff9ec] space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="text-sm font-extrabold text-[#161426] flex items-center gap-1.5">
                <Eye weight="fill" className="w-5 h-5 text-[#9b5de5]" />
                <span>
                  {lang === 'ar'
                    ? 'جهاز مشترك: اضغط على اسمك لتطلّ عأرقامك بالسر وتحفظها ثم أخفِها!'
                    : 'Same Device: Tap your name privately to memorize your cards, then hide!'}
                </span>
              </div>
              {localPeekPlayerId && (
                <button
                  type="button"
                  onClick={() => setLocalPeekPlayerId(null)}
                  className="cartoon-btn bg-[#ff595e] text-white px-3 py-1 text-xs flex items-center gap-1"
                >
                  <EyeSlash weight="bold" className="w-4 h-4" />
                  <span>{lang === 'ar' ? 'إخفاء الأرقام' : 'Hide Cards'}</span>
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {players.map((p) => {
                const count = gameData.hands?.[p.id]?.length || 0;
                const isPeeking = localPeekPlayerId === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() =>
                      setLocalPeekPlayerId(isPeeking ? null : p.id)
                    }
                    className={`cartoon-btn px-3.5 py-2 text-xs sm:text-sm flex items-center gap-2 ${
                      isPeeking
                        ? 'bg-[#ffca3a] text-[#161426]'
                        : 'bg-white text-[#161426]'
                    }`}
                  >
                    <span
                      style={{ backgroundColor: p.avatar_color }}
                      className="w-5 h-5 rounded-full border-2 border-[#161426] inline-block"
                    />
                    <span>{p.name}</span>
                    <span className="text-[11px] opacity-75">({count})</span>
                  </button>
                );
              })}
            </div>

            {localPeekPlayerId && (
              <div className="p-3.5 rounded-2xl bg-[#191636] border-3 border-[#161426] text-center space-y-2 animate-in fade-in duration-150">
                <div className="text-xs font-extrabold text-[#ffca3a]">
                  {lang === 'ar'
                    ? `أوراق (${getPlayerName(localPeekPlayerId)}) السرية لهذا المستوى:`
                    : `${getPlayerName(localPeekPlayerId)}’s Secret Cards:`}
                </div>
                <div className="flex flex-wrap items-center justify-center gap-2.5">
                  {(gameData.hands?.[localPeekPlayerId] || []).map((num) => (
                    <div
                      key={num}
                      className="w-14 h-20 rounded-2xl bg-[#fff9ec] border-3 border-[#ff924c] shadow-[0_4px_0_#000] flex items-center justify-center font-extrabold text-2xl text-[#161426]"
                    >
                      {num}
                    </div>
                  ))}
                  {(gameData.hands?.[localPeekPlayerId] || []).length === 0 && (
                    <span className="text-sm font-bold text-white/70">
                      {lang === 'ar' ? 'لا توجد أوراق متبقية!' : 'No cards left!'}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

      {/* PHASE 1: FOCUS / MIND-SYNC RITUAL */}
      {gameData.phase === 'focus' && (
        <div className="cartoon-card p-6 text-center space-y-5 bg-gradient-to-b from-[#fff9ec] to-[#fff1e6]">
          <div className="w-20 h-20 rounded-3xl bg-[#25204d] border-4 border-[#161426] shadow-[0_6px_0_#161426] flex items-center justify-center mx-auto animate-pulse">
            <HandPalm weight="fill" className="w-11 h-11 text-[#ff924c]" />
          </div>

          <div className="space-y-1.5 max-w-lg mx-auto">
            <h3 className="text-2xl font-extrabold text-[#161426]">
              {lang === 'ar'
                ? `لحظة توحيد التركيز — المستوى ${gameData.level}`
                : `Mind-Sync Ritual — Level ${gameData.level}`}
            </h3>
            <p className="text-sm font-bold text-[#3f3b5c] leading-relaxed">
              {lang === 'ar'
                ? 'شوفوا أرقامكم السرية بصمت تام! ممنوع الكلام أو العدّ بصوت عالٍ. لما يضغط الجميع «جاهز للتركيز»، تنفتح الطاولة وتبدأون اللعب بالإحساس فقط!'
                : 'Check your secret 1–100 cards in total silence! Once everyone taps Ready, the table opens — feel the shared pace and play ascending!'}
            </p>
          </div>

          {/* Online Player's Secret Hand Preview During Focus */}
          {!isPassAndPlay && (
            <div className="p-4 rounded-2xl bg-[#191636] border-3 border-[#161426] max-w-md mx-auto space-y-2">
              <div className="text-xs font-extrabold text-[#ffca3a]">
                {lang === 'ar' ? 'أرقامك السرية في يدك:' : 'Your Secret Hand:'}
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2.5">
                {myHand.map((val) => (
                  <div
                    key={val}
                    className="w-14 h-20 rounded-2xl bg-[#fff9ec] border-3 border-[#ff924c] shadow-[0_4px_0_#120f29] flex items-center justify-center font-extrabold text-2xl text-[#161426]"
                  >
                    {val}
                  </div>
                ))}
              </div>
            </div>
          )}

          {!isPassAndPlay ? (
            <div className="space-y-3">
              <div className="flex flex-wrap justify-center gap-2">
                {players.map((p) => {
                  const ready = (gameData.readyPlayerIds || []).includes(p.id);
                  return (
                    <span
                      key={p.id}
                      className={`cartoon-badge px-3 py-1 text-xs flex items-center gap-1.5 ${
                        ready
                          ? 'bg-[#8ac926] text-[#161426]'
                          : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      <span>{p.name}</span>
                      {ready && <CheckCircle weight="fill" className="w-4 h-4" />}
                    </span>
                  );
                })}
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => handleToggleReady(myPlayerId)}
                  className={`cartoon-btn px-7 py-3.5 text-lg flex items-center gap-2 ${
                    (gameData.readyPlayerIds || []).includes(myPlayerId)
                      ? 'bg-[#ffca3a] text-[#161426]'
                      : 'bg-[#8ac926] text-[#161426]'
                  }`}
                >
                  <HandPalm weight="fill" className="w-6 h-6" />
                  <span>
                    {(gameData.readyPlayerIds || []).includes(myPlayerId)
                      ? lang === 'ar'
                        ? 'جاهز! بانتظار البقية...'
                        : 'Synced! Waiting for others...'
                      : lang === 'ar'
                      ? 'ضع يدك — جاهز للتركيز!'
                      : 'Place Hand — Ready to Sync!'}
                  </span>
                </button>

                {isHost && (gameData.readyPlayerIds || []).length > 0 && (
                  <button
                    type="button"
                    onClick={handleForceStartPlaying}
                    className="cartoon-btn bg-[#00bbf9] text-[#161426] px-4 py-3 text-sm"
                  >
                    {lang === 'ar' ? 'ابدأ فوراً' : 'Force Start'}
                  </button>
                )}
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleForceStartPlaying}
              className="cartoon-btn bg-[#8ac926] text-[#161426] px-8 py-3.5 text-lg inline-flex items-center gap-2"
            >
              <Play weight="fill" className="w-6 h-6" />
              <span>
                {lang === 'ar'
                  ? 'الكل حفظ أرقامه؟ ابدأ الصمت واللعب!'
                  : 'Everyone Memorized? Start Silent Play!'}
              </span>
            </button>
          )}
        </div>
      )}

      {/* PHASE 2: LIVE SILENT ASCENDING PLAY */}
      {gameData.phase === 'playing' && (
        <div className="space-y-4">
          {/* Shuriken Reveal Banner (if a Throwing Star was just used!) */}
          {gameData.lastShurikenDiscards &&
            gameData.lastShurikenDiscards.length > 0 && (
              <div className="cartoon-card p-3.5 bg-[#fff1c2] border-3 border-[#161426] flex flex-wrap items-center justify-center gap-2.5">
                <div className="flex items-center gap-1.5 font-extrabold text-xs sm:text-sm text-[#161426]">
                  <StarFour weight="fill" className="w-5 h-5 text-[#d97706]" />
                  <span>
                    {lang === 'ar'
                      ? 'نجمة التزامن كشفت وتخلصت من أصغر كرت لكل لاعب:'
                      : 'Throwing Star discarded each player’s lowest card:'}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {gameData.lastShurikenDiscards.map((d, idx) => (
                    <span
                      key={idx}
                      className="cartoon-badge bg-white text-[#161426] px-3 py-0.5 text-xs"
                    >
                      {getPlayerName(d.playerId)}: <strong>{d.value}</strong>
                    </span>
                  ))}
                </div>
              </div>
            )}

          {/* CENTRAL TELEPATHIC ASCENDING PILE */}
          <div className="cartoon-panel-dark p-6 text-center relative overflow-hidden space-y-4">
            {/* Silent Breathing Aura Rings (Pure visual rhythm — no numeric timer!) */}
            <div className="relative w-40 h-48 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-3xl border-3 border-[#ff924c]/35 animate-ping pointer-events-none" />
              <div className="absolute -inset-3 rounded-3xl border-2 border-[#9b5de5]/30 animate-pulse pointer-events-none" />

              {topPileEntry ? (
                <div className="relative w-32 h-44 rounded-3xl bg-[#fff9ec] border-4 border-[#161426] shadow-[0_8px_0_#120f29] flex flex-col items-center justify-between p-3">
                  <span className="text-[11px] font-extrabold text-[#3f3b5c] truncate max-w-full">
                    {getPlayerName(topPileEntry.playerId)}
                  </span>
                  <span className="text-5xl font-black text-[#161426] leading-none">
                    {topPileEntry.value}
                  </span>
                  <span className="text-[10px] font-extrabold bg-[#8ac926] text-[#161426] px-2 py-0.5 rounded-full border-2 border-[#161426]">
                    1 — 100
                  </span>
                </div>
              ) : (
                <div className="relative w-32 h-44 rounded-3xl bg-[#191636] border-4 border-dashed border-[#ff924c]/70 flex flex-col items-center justify-center p-3 text-center">
                  <Sparkle
                    weight="fill"
                    className="w-8 h-8 text-[#ff924c] mb-1 animate-pulse"
                  />
                  <span className="text-xs font-extrabold text-[#ffca3a]">
                    {lang === 'ar'
                      ? 'بانتظار أصغر رقم بالهمس الصامت...'
                      : 'Awaiting lowest card in silence...'}
                  </span>
                  <span className="text-[11px] font-bold text-white/50 mt-1">
                    1 — 100
                  </span>
                </div>
              )}
            </div>

            {/* Played History Trail */}
            {gameData.pile && gameData.pile.length > 1 && (
              <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
                {gameData.pile.slice(-8).map((entry, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-0.5 rounded-lg bg-[#191636] border-2 border-white/15 text-xs font-extrabold text-[#fff9ec]"
                  >
                    {entry.value}
                  </span>
                ))}
              </div>
            )}

            {/* Teammates Status Strip (Cards Remaining + Non-Verbal "Wait!" Signal) */}
            <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
              {players.map((p) => {
                const cLeft = gameData.hands?.[p.id]?.length || 0;
                const holdingWait = (gameData.holdSignalIds || []).includes(p.id);
                const votedStar = (gameData.shurikenVoteIds || []).includes(p.id);
                return (
                  <div
                    key={p.id}
                    className={`px-3 py-2 rounded-2xl border-3 flex items-center gap-2 transition-all ${
                      holdingWait
                        ? 'bg-[#ffca3a] text-[#161426] border-[#161426] -translate-y-0.5'
                        : 'bg-[#191636] text-white border-[#120f29]'
                    }`}
                  >
                    <span
                      style={{ backgroundColor: p.avatar_color }}
                      className="w-6 h-6 rounded-full border-2 border-[#161426] flex items-center justify-center text-[11px] font-extrabold text-[#161426]"
                    >
                      {p.name.slice(0, 1)}
                    </span>
                    <span className="text-xs font-extrabold">{p.name}</span>
                    <span className="px-2 py-0.5 rounded-full bg-black/25 text-[11px] font-extrabold">
                      {cLeft} {lang === 'ar' ? 'كرت' : 'cards'}
                    </span>
                    {holdingWait && (
                      <span className="flex items-center gap-0.5 text-xs font-black text-[#b91c1c]">
                        <HandPalm weight="fill" className="w-4 h-4" />
                        <span>{lang === 'ar' ? 'مهلاً!' : 'Wait!'}</span>
                      </span>
                    )}
                    {votedStar && (
                      <StarFour
                        weight="fill"
                        className="w-4 h-4 text-[#ffca3a] animate-spin"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* PLAYER CONTROLS: Online Private Hand OR Pass-and-Play Instant Tap Grid */}
          {!isPassAndPlay ? (
            <div className="cartoon-card p-5 space-y-4">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="text-sm font-extrabold text-[#161426]">
                  {lang === 'ar'
                    ? 'أوراقك السرية (مرتبة تصاعدياً):'
                    : 'Your Secret Cards (Sorted Ascending):'}
                </div>
                <button
                  type="button"
                  onClick={() => setHideOnlineHand((v) => !v)}
                  className="cartoon-badge bg-white px-3 py-1 text-xs flex items-center gap-1 cursor-pointer"
                >
                  {hideOnlineHand ? (
                    <>
                      <Eye weight="bold" className="w-4 h-4" />
                      <span>{lang === 'ar' ? 'إظهار' : 'Show'}</span>
                    </>
                  ) : (
                    <>
                      <EyeSlash weight="bold" className="w-4 h-4" />
                      <span>{lang === 'ar' ? 'إخفاء' : 'Hide'}</span>
                    </>
                  )}
                </button>
              </div>

              {myHand.length > 0 ? (
                <>
                  <div className="flex flex-wrap items-center justify-center gap-3">
                    {myHand.map((num, idx) => (
                      <div
                        key={num}
                        className={`w-16 h-24 rounded-2xl border-4 border-[#161426] flex flex-col items-center justify-center font-black transition-transform ${
                          idx === 0
                            ? 'bg-[#ffca3a] text-[#161426] scale-105 shadow-[0_5px_0_#161426]'
                            : 'bg-white text-[#161426] shadow-[0_3px_0_#161426]'
                        }`}
                      >
                        <span className="text-2xl">
                          {hideOnlineHand ? '?' : num}
                        </span>
                        {idx === 0 && (
                          <span className="text-[10px] font-extrabold uppercase mt-0.5">
                            {lang === 'ar' ? 'الأصغر' : 'Lowest'}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                    {/* Play Lowest Card NOW */}
                    <button
                      type="button"
                      onClick={() => handlePlayLowestCard(myPlayerId)}
                      className="sm:col-span-2 cartoon-btn bg-[#8ac926] hover:bg-[#9be02f] text-[#161426] py-3.5 px-5 text-base sm:text-lg flex items-center justify-center gap-2"
                    >
                      <Lightning weight="fill" className="w-6 h-6" />
                      <span>
                        {lang === 'ar'
                          ? `ارمِ أصغر كرت الآن (${hideOnlineHand ? '؟' : myHand[0]})!`
                          : `Play Lowest Card Now (${hideOnlineHand ? '?' : myHand[0]})!`}
                      </span>
                    </button>

                    {/* Silent "Hold On!" Hand Raise */}
                    <button
                      type="button"
                      onClick={() => handleToggleHoldSignal(myPlayerId)}
                      className={`cartoon-btn py-3 px-4 text-sm flex items-center justify-center gap-1.5 ${
                        (gameData.holdSignalIds || []).includes(myPlayerId)
                          ? 'bg-[#ff595e] text-white'
                          : 'bg-[#fff1c2] text-[#161426]'
                      }`}
                    >
                      <HandPalm weight="fill" className="w-5 h-5" />
                      <span>
                        {(gameData.holdSignalIds || []).includes(myPlayerId)
                          ? lang === 'ar'
                            ? 'إلغاء «مهلاً!»'
                            : 'Clear "Wait!"'
                          : lang === 'ar'
                          ? 'إشارة «مهلاً!»'
                          : 'Signal "Wait!"'}
                      </span>
                    </button>
                  </div>
                </>
              ) : (
                <div className="p-4 rounded-2xl bg-[#eefbe0] border-3 border-[#161426] text-center font-extrabold text-sm text-[#161426]">
                  {lang === 'ar'
                    ? 'خلصت كل أوراقك بهذا المستوى! التزم الصمت وراقب أصحابك.'
                    : 'All your cards are played! Stay completely silent for your team.'}
                </div>
              )}

              {/* Vote to Use Throwing Star */}
              {gameData.shurikens > 0 && playersWithCards.length > 0 && (
                <div className="pt-2 border-t-2 border-[#161426]/15 flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-xs font-extrabold text-[#3f3b5c]">
                    {lang === 'ar'
                      ? `تصويت نجمة التزامن (${(gameData.shurikenVoteIds || []).length}/${playersWithCards.length}): التخلص من أصغر كرت للجميع!`
                      : `Throwing Star Vote (${(gameData.shurikenVoteIds || []).length}/${playersWithCards.length}): Discard everyone’s lowest card!`}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleVoteShuriken(myPlayerId)}
                    className={`cartoon-btn px-4 py-2 text-xs sm:text-sm flex items-center gap-1.5 ${
                      (gameData.shurikenVoteIds || []).includes(myPlayerId)
                        ? 'bg-[#ffca3a] text-[#161426]'
                        : 'bg-white text-[#161426]'
                    }`}
                  >
                    <StarFour weight="fill" className="w-4 h-4 text-[#d97706]" />
                    <span>
                      {(gameData.shurikenVoteIds || []).includes(myPlayerId)
                        ? lang === 'ar'
                          ? 'تم التصويت للنجمة'
                          : 'Voted for Star'
                        : lang === 'ar'
                        ? 'اقترح استخدام نجمة'
                        : 'Propose Throwing Star'}
                    </span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Pass-and-Play Action Pad: Any player taps their button WITHOUT spoiling the number! */
            <div className="cartoon-card p-5 space-y-4">
              <div className="text-sm font-extrabold text-[#161426] text-center">
                {lang === 'ar'
                  ? 'كل لاعب يشعر أن أصغر كرت بيده حان وقته يضغط زر اسمه فوراً:'
                  : 'Whoever feels they hold the next lowest card taps their button now:'}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {players.map((p) => {
                  const hasCards = (gameData.hands?.[p.id]?.length || 0) > 0;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      disabled={!hasCards}
                      onClick={() => handlePlayLowestCard(p.id)}
                      style={{
                        backgroundColor: hasCards ? p.avatar_color : '#e2e8f0',
                      }}
                      className="cartoon-btn py-3.5 px-4 text-[#161426] text-sm sm:text-base flex items-center justify-center gap-2"
                    >
                      <Lightning weight="fill" className="w-5 h-5" />
                      <span>
                        {hasCards
                          ? lang === 'ar'
                            ? `${p.name}: ارمِ أصغر كرت!`
                            : `${p.name}: Play Lowest!`
                          : lang === 'ar'
                          ? `${p.name} (خلص أوراقه)`
                          : `${p.name} (Done)`}
                      </span>
                    </button>
                  );
                })}
              </div>

              {gameData.shurikens > 0 && playersWithCards.length > 0 && (
                <div className="flex justify-center pt-1">
                  <button
                    type="button"
                    onClick={() => handleVoteShuriken(myPlayerId)}
                    className="cartoon-btn bg-[#ffca3a] text-[#161426] px-5 py-2.5 text-xs sm:text-sm flex items-center gap-2"
                  >
                    <StarFour weight="fill" className="w-4 h-4" />
                    <span>
                      {lang === 'ar'
                        ? 'اتفقتم؟ استخدموا نجمة التزامن لكشف أصغر كرت للكل!'
                        : 'Agreed? Spend Throwing Star to discard all lowest cards!'}
                    </span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* PHASE 3: MISTAKE PAUSE (Clear Inspection of Skipped Lower Cards!) */}
      {gameData.phase === 'mistake_pause' && gameData.lastMistake && (
        <div className="cartoon-card p-6 bg-[#ffe4e6] border-4 border-[#161426] text-center space-y-4 animate-in zoom-in-95 duration-150">
          <div className="w-16 h-16 rounded-3xl bg-[#ff595e] border-4 border-[#161426] shadow-[0_5px_0_#161426] flex items-center justify-center mx-auto">
            <WarningOctagon weight="fill" className="w-9 h-9 text-white" />
          </div>

          <h3 className="text-2xl font-extrabold text-[#991b1b]">
            {lang === 'ar'
              ? 'تسرّع بالتوقيت! خسرتم قلباً (-1)'
              : 'Timing Clash! Lost 1 Team Life (-1)'}
          </h3>

          <p className="text-sm sm:text-base font-extrabold text-[#161426]">
            {lang === 'ar'
              ? `رمى (${getPlayerName(gameData.lastMistake.playedBy)}) الكرت رقم (${gameData.lastMistake.playedCard}) بينما كانت هذه الأرقام الأصغر ما زالت باليد:`
              : `${getPlayerName(gameData.lastMistake.playedBy)} played (${gameData.lastMistake.playedCard}) while lower cards were still held:`}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 py-1">
            {gameData.lastMistake.skippedCards.map((sc, i) => (
              <div
                key={i}
                className="px-4 py-2.5 rounded-2xl bg-white border-3 border-[#161426] shadow-[0_4px_0_#161426] flex items-center gap-2"
              >
                <span
                  style={{ backgroundColor: getPlayerColor(sc.playerId) }}
                  className="w-6 h-6 rounded-full border-2 border-[#161426] inline-block"
                />
                <span className="font-extrabold text-sm text-[#161426]">
                  {getPlayerName(sc.playerId)}:
                </span>
                <span className="font-black text-xl text-[#ff595e]">
                  {sc.value}
                </span>
              </div>
            ))}
          </div>

          <p className="text-xs font-bold text-[#3f3b5c]">
            {lang === 'ar'
              ? 'حسب قوانين ذا مايند الرسمية: تم استبعاد هذه الكروت الأصغر، ونكمل المستوى من الرقم الحالي!'
              : 'Official rule: All lower cards are discarded face-up, and the team continues from here!'}
          </p>

          <button
            type="button"
            onClick={handleResumeAfterMistake}
            className="cartoon-btn bg-[#8ac926] text-[#161426] px-8 py-3.5 text-lg inline-flex items-center gap-2"
          >
            <Play weight="fill" className="w-5 h-5" />
            <span>
              {lang === 'ar'
                ? 'استوعبنا الإيقاع — متابعة المستوى!'
                : 'Got the Rhythm — Continue Level!'}
            </span>
          </button>
        </div>
      )}

      {/* PHASE 4: LEVEL CLEARED */}
      {gameData.phase === 'level_clear' && (
        <div className="cartoon-card p-6 text-center space-y-4 bg-[#eefbe0] animate-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-3xl bg-[#8ac926] border-4 border-[#161426] shadow-[0_5px_0_#161426] flex items-center justify-center mx-auto">
            <Sparkle weight="fill" className="w-9 h-9 text-[#161426]" />
          </div>

          <h3 className="text-2xl sm:text-3xl font-extrabold text-[#161426]">
            {lang === 'ar'
              ? `تخاطر أسطوري! اجتزتم المستوى ${gameData.level}!`
              : `Pure Telepathy! Level ${gameData.level} Cleared!`}
          </h3>

          {gameData.lastReward && (
            <div className="cartoon-badge bg-[#ffca3a] text-[#161426] px-4 py-1.5 text-sm inline-flex items-center gap-1.5">
              {gameData.lastReward === 'shuriken' ? (
                <>
                  <StarFour weight="fill" className="w-4 h-4" />
                  <span>
                    {lang === 'ar'
                      ? 'مكافأة المستوى: +1 نجمة تزامن إضافية!'
                      : 'Level Bonus: +1 Throwing Star!'}
                  </span>
                </>
              ) : (
                <>
                  <Heart weight="fill" className="w-4 h-4 text-[#ff595e]" />
                  <span>
                    {lang === 'ar'
                      ? 'مكافأة المستوى: +1 قلب إضافي للشلّة!'
                      : 'Level Bonus: +1 Extra Team Life!'}
                  </span>
                </>
              )}
            </div>
          )}

          <p className="text-sm font-bold text-[#3f3b5c]">
            {lang === 'ar'
              ? `الاستعداد للمستوى ${gameData.level + 1}: سيحصل كل لاعب على (${gameData.level + 1}) كروت سرية!`
              : `Next up — Level ${gameData.level + 1}: Each player gets ${gameData.level + 1} secret cards!`}
          </p>

          <button
            type="button"
            onClick={handleStartNextLevel}
            className="cartoon-btn bg-[#ffca3a] hover:bg-[#ffd55a] text-[#161426] px-8 py-3.5 text-lg inline-flex items-center gap-2"
          >
            <Play weight="fill" className="w-5 h-5" />
            <span>
              {lang === 'ar'
                ? `انطلقوا للمستوى ${gameData.level + 1}!`
                : `Start Level ${gameData.level + 1}!`}
            </span>
          </button>
        </div>
      )}

      {/* PHASE 5: FULL GAME VICTORY OR GAME OVER */}
      {(gameData.phase === 'victory' || gameData.phase === 'gameover') && (
        <div
          className={`cartoon-card p-6 text-center space-y-4 animate-in zoom-in-95 duration-200 ${
            gameData.phase === 'victory' ? 'bg-[#fff9db]' : 'bg-[#ffe4e6]'
          }`}
        >
          <div
            className={`w-20 h-20 rounded-3xl border-4 border-[#161426] shadow-[0_6px_0_#161426] flex items-center justify-center mx-auto ${
              gameData.phase === 'victory' ? 'bg-[#ffca3a]' : 'bg-[#ff595e]'
            }`}
          >
            {gameData.phase === 'victory' ? (
              <Trophy weight="fill" className="w-11 h-11 text-[#161426]" />
            ) : (
              <WarningOctagon weight="fill" className="w-11 h-11 text-white" />
            )}
          </div>

          <h3 className="text-2xl sm:text-3xl font-extrabold text-[#161426]">
            {gameData.phase === 'victory'
              ? lang === 'ar'
                ? 'ختمتم «ذا مايند» بعقل واحد كامل!'
                : 'You Conquered THE MIND Together!'
              : lang === 'ar'
              ? `نفدت القلوب عند المستوى ${gameData.level}!`
              : `Out of Lives on Level ${gameData.level}!`}
          </h3>

          {gameData.lastMistake && gameData.phase === 'gameover' && (
            <p className="text-sm font-bold text-[#991b1b]">
              {lang === 'ar'
                ? `الكرت الأخير (${gameData.lastMistake.playedCard}) قفز فوق: ${gameData.lastMistake.skippedCards
                    .map((s) => `${getPlayerName(s.playerId)} (${s.value})`)
                    .join('، ')}`
                : `Final card (${gameData.lastMistake.playedCard}) skipped over: ${gameData.lastMistake.skippedCards
                    .map((s) => `${getPlayerName(s.playerId)} (${s.value})`)
                    .join(', ')}`}
            </p>
          )}

          <button
            type="button"
            onClick={onStartNewRound}
            className="cartoon-btn bg-[#8ac926] text-[#161426] px-8 py-3.5 text-lg inline-flex items-center gap-2"
          >
            <ArrowsClockwise weight="bold" className="w-6 h-6" />
            <span>
              {lang === 'ar' ? 'رحلة تخاطر جديدة!' : 'Play Again from Level 1!'}
            </span>
          </button>
        </div>
      )}
    </div>
  );
};
