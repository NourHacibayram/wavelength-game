import React, { useState } from 'react';
import { DixitArtCardSvg } from './ExtraGameArt';
import {
  Sparkle,
  PaperPlaneTilt,
  Eye,
  EyeSlash,
  CheckCircle,
  ArrowsClockwise,
  Star,
  Crown,
} from '@phosphor-icons/react';

export interface DixitGameState {
  phase: 'storyteller_pick' | 'decoys' | 'voting' | 'reveal';
  storytellerId: string;
  hands: Record<string, number[]>;
  clue: string;
  submittedCards: Record<string, number>;
  shuffledCardIds: number[];
  votes: Record<string, number>;
}

interface PlayerInfo {
  id: string;
  name: string;
  avatar_color: string;
  score: number;
}

interface DixitGameProps {
  gameData: DixitGameState;
  players: PlayerInfo[];
  myPlayerId: string;
  isHost: boolean;
  isPassAndPlay: boolean;
  lang: 'ar' | 'en';
  onUpdateGameData: (nextData: DixitGameState, scoreAwards?: Record<string, number>) => void;
  onStartNewRound: () => void;
}

export function buildDixitHands(playerIds: string[], prevStorytellerId?: string): DixitGameState {
  const deck = Array.from({ length: 24 }, (_, i) => i + 1).sort(() => Math.random() - 0.5);
  const hands: Record<string, number[]> = {};
  let cursor = 0;
  playerIds.forEach((pid) => {
    const hand: number[] = [];
    for (let i = 0; i < 5; i++) {
      hand.push(deck[cursor % deck.length]);
      cursor++;
    }
    hands[pid] = hand;
  });

  const prevIdx = prevStorytellerId ? playerIds.indexOf(prevStorytellerId) : -1;
  const nextStoryteller =
    playerIds[(prevIdx + 1) % Math.max(1, playerIds.length)] || playerIds[0];

  return {
    phase: 'storyteller_pick',
    storytellerId: nextStoryteller,
    hands,
    clue: '',
    submittedCards: {},
    shuffledCardIds: [],
    votes: {},
  };
}

export const DixitGame: React.FC<DixitGameProps> = ({
  gameData,
  players,
  myPlayerId,
  isHost,
  isPassAndPlay,
  lang,
  onUpdateGameData,
}) => {
  const [selectedCardId, setSelectedCardId] = useState<number | null>(null);
  const [clueInput, setClueInput] = useState<string>('');
  const [activeLocalIdx, setActiveLocalIdx] = useState<number>(0);
  const [peekHand, setPeekHand] = useState<boolean>(!isPassAndPlay);

  const storyteller =
    players.find((p) => p.id === gameData.storytellerId) || players[0];
  const nonStorytellers = players.filter((p) => p.id !== storyteller?.id);

  const currentViewerId = isPassAndPlay
    ? gameData.phase === 'storyteller_pick'
      ? storyteller?.id || myPlayerId
      : nonStorytellers[activeLocalIdx]?.id || players[0]?.id || myPlayerId
    : myPlayerId;
  const currentViewer = players.find((p) => p.id === currentViewerId);
  const myHand = gameData.hands?.[currentViewerId] || [1, 2, 3, 4, 5];

  const isMyStoryTurn = isPassAndPlay || myPlayerId === storyteller?.id;
  const hasSubmittedDecoy = typeof gameData.submittedCards?.[currentViewerId] === 'number';
  const hasVoted = typeof gameData.votes?.[currentViewerId] === 'number';

  const handleStorytellerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCardId || !clueInput.trim() || !storyteller) return;

    const nextSubmitted: Record<string, number> = {
      [storyteller.id]: selectedCardId,
    };

    // If solo testing (1 player), auto-add 3 deck decoys & jump to reveal/voting
    if (nonStorytellers.length === 0) {
      const usedSet = new Set([selectedCardId]);
      const allDeck = Array.from({ length: 24 }, (_, i) => i + 1).filter(
        (c) => !usedSet.has(c)
      );
      nextSubmitted['bot_1'] = allDeck[0];
      nextSubmitted['bot_2'] = allDeck[1];
      const shuffled = Object.values(nextSubmitted).sort(() => Math.random() - 0.5);
      setSelectedCardId(null);
      setClueInput('');
      onUpdateGameData({
        ...gameData,
        clue: clueInput.trim(),
        submittedCards: nextSubmitted,
        shuffledCardIds: shuffled,
        phase: 'voting',
      });
      return;
    }

    setSelectedCardId(null);
    setClueInput('');
    setActiveLocalIdx(0);
    if (isPassAndPlay) setPeekHand(false);

    onUpdateGameData({
      ...gameData,
      clue: clueInput.trim(),
      submittedCards: nextSubmitted,
      phase: 'decoys',
    });
  };

  const finalizeShuffledPool = (subs: Record<string, number>): { subs: Record<string, number>; shuffled: number[] } => {
    const copy = { ...subs };
    // In 2-player games, add 2 mystery deck decoys so there are 4 cards on the table!
    if (Object.keys(copy).length < 4) {
      const used = new Set<number>();
      Object.values(gameData.hands || {}).forEach((h) => h.forEach((c) => used.add(c)));
      Object.values(copy).forEach((c) => used.add(c));
      const unusedDeck = Array.from({ length: 24 }, (_, i) => i + 1)
        .filter((c) => !used.has(c))
        .sort(() => Math.random() - 0.5);
      let idx = 0;
      while (Object.keys(copy).length < 4 && idx < unusedDeck.length) {
        copy[`mystery_${idx + 1}`] = unusedDeck[idx];
        idx++;
      }
    }
    const shuffled = Object.values(copy).sort(() => Math.random() - 0.5);
    return { subs: copy, shuffled };
  };

  const handleSubmitDecoy = (cardId: number) => {
    const nextSubs = {
      ...(gameData.submittedCards || {}),
      [currentViewerId]: cardId,
    };

    const allDecoysReady = nonStorytellers.every(
      (p) => typeof nextSubs[p.id] === 'number'
    );

    if (isPassAndPlay) {
      setPeekHand(false);
      if (activeLocalIdx + 1 < nonStorytellers.length) {
        setActiveLocalIdx(activeLocalIdx + 1);
      } else {
        setActiveLocalIdx(0);
      }
    }

    if (allDecoysReady) {
      const { subs, shuffled } = finalizeShuffledPool(nextSubs);
      onUpdateGameData({
        ...gameData,
        submittedCards: subs,
        shuffledCardIds: shuffled,
        phase: 'voting',
      });
    } else {
      onUpdateGameData({
        ...gameData,
        submittedCards: nextSubs,
      });
    }
  };

  const scoreAndReveal = (finalVotes: Record<string, number>) => {
    const stId = storyteller?.id || '';
    const stCard = gameData.submittedCards?.[stId];
    const awards: Record<string, number> = {};

    const voterIds = Object.keys(finalVotes);
    const correctVoters = voterIds.filter((vid) => finalVotes[vid] === stCard);

    // Goldilocks rule when 2+ guessers exist
    if (voterIds.length >= 2 && (correctVoters.length === 0 || correctVoters.length === voterIds.length)) {
      // Everyone except Storyteller scores +2
      nonStorytellers.forEach((p) => {
        awards[p.id] = (awards[p.id] || 0) + 2;
      });
    } else {
      if (correctVoters.length > 0 && stId) {
        awards[stId] = (awards[stId] || 0) + 3;
      }
      correctVoters.forEach((vid) => {
        awards[vid] = (awards[vid] || 0) + 3;
      });
    }

    // Decoy bonus: +1 per vote received on your decoy card!
    Object.entries(finalVotes).forEach(([voterId, votedCard]) => {
      if (votedCard === stCard) return;
      const cardOwnerEntry = Object.entries(gameData.submittedCards || {}).find(
        ([ownerId, cid]) => cid === votedCard && ownerId !== stId && !ownerId.startsWith('mystery_')
      );
      if (cardOwnerEntry && cardOwnerEntry[0] !== voterId) {
        const ownerId = cardOwnerEntry[0];
        awards[ownerId] = (awards[ownerId] || 0) + 1;
      }
    });

    onUpdateGameData(
      {
        ...gameData,
        votes: finalVotes,
        phase: 'reveal',
      },
      awards
    );
  };

  const handleCastVote = (cardId: number) => {
    const mySubmittedCard = gameData.submittedCards?.[currentViewerId];
    if (mySubmittedCard === cardId && nonStorytellers.length > 0) return;

    const nextVotes = {
      ...(gameData.votes || {}),
      [currentViewerId]: cardId,
    };

    if (isPassAndPlay && activeLocalIdx + 1 < nonStorytellers.length) {
      setActiveLocalIdx(activeLocalIdx + 1);
    }

    const expectedVoters = nonStorytellers.length > 0 ? nonStorytellers : players;
    const allVoted = expectedVoters.every((p) => typeof nextVotes[p.id] === 'number');

    if (allVoted) {
      scoreAndReveal(nextVotes);
    } else {
      onUpdateGameData({
        ...gameData,
        votes: nextVotes,
      });
    }
  };

  const handleNextStoryRound = () => {
    setSelectedCardId(null);
    setClueInput('');
    setActiveLocalIdx(0);
    setPeekHand(!isPassAndPlay);
    const nextState = buildDixitHands(
      players.map((p) => p.id),
      storyteller?.id
    );
    onUpdateGameData(nextState);
  };

  return (
    <div className="space-y-4">
      {/* Storyteller & Clue Banner */}
      <div className="cartoon-card bg-[#3b1d6e] text-white p-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs font-extrabold uppercase text-[#ffca3a] flex items-center gap-1.5">
            <Sparkle weight="fill" className="w-4 h-4" />
            <span>
              {lang === 'ar'
                ? 'خيال الشلّة — لوحات الأحلام والتلميحات الغامضة'
                : 'Dixit Dreams — Surreal Art & Goldilocks Clues'}
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-extrabold mt-0.5 flex items-center gap-2">
            <Crown weight="fill" className="w-6 h-6 text-[#ffca3a]" />
            <span>
              {lang === 'ar'
                ? `راوي الجولة: ${storyteller?.name || ''}`
                : `Storyteller: ${storyteller?.name || ''}`}
            </span>
          </h2>
        </div>

        {(isHost || isPassAndPlay) && (
          <button
            type="button"
            onClick={handleNextStoryRound}
            className="cartoon-btn bg-[#ffca3a] text-[#161426] px-3.5 py-2 text-xs flex items-center gap-1.5"
          >
            <ArrowsClockwise weight="bold" className="w-4 h-4" />
            <span>{lang === 'ar' ? 'جولة جديدة' : 'New Deal'}</span>
          </button>
        )}
      </div>

      {/* Clue Display if already submitted */}
      {gameData.clue && (
        <div className="cartoon-card bg-[#ffca3a] p-4 text-center">
          <div className="text-xs font-extrabold text-[#161426]/75 uppercase">
            {lang === 'ar'
              ? `تلميح الراوي (${storyteller?.name}):`
              : `${storyteller?.name}’s Clue:`}
          </div>
          <div className="text-2xl md:text-3xl font-extrabold text-[#161426] mt-0.5">
            &ldquo;{gameData.clue}&rdquo;
          </div>
        </div>
      )}

      {/* PHASE 1: STORYTELLER PICKS A CARD & GIVES A CLUE */}
      {gameData.phase === 'storyteller_pick' && (
        <div className="cartoon-card p-5 space-y-4">
          {isMyStoryTurn ? (
            <>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h3 className="font-extrabold text-lg text-[#161426]">
                  {lang === 'ar'
                    ? `يا (${storyteller?.name})، اختار لوحة من إيدك واكتب جملة خيالية تعبّر عنها!`
                    : `${storyteller?.name}, pick 1 dream card from your hand & write a mysterious clue!`}
                </h3>
                {isPassAndPlay && (
                  <button
                    type="button"
                    onClick={() => setPeekHand(!peekHand)}
                    className="cartoon-btn bg-[#9b5de5] text-white px-3.5 py-1.5 text-xs flex items-center gap-1.5"
                  >
                    {peekHand ? <EyeSlash className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    <span>{peekHand ? (lang === 'ar' ? 'إخفاء أوراقي' : 'Hide Hand') : (lang === 'ar' ? 'عرض أوراق الراوي' : 'Show Hand')}</span>
                  </button>
                )}
              </div>

              {peekHand && (
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {myHand.map((cid) => {
                    const picked = selectedCardId === cid;
                    return (
                      <button
                        key={cid}
                        type="button"
                        onClick={() => setSelectedCardId(cid)}
                        className={`rounded-2xl overflow-hidden transition-all cursor-pointer border-4 ${
                          picked
                            ? 'border-[#ff595e] ring-4 ring-[#ffca3a] -translate-y-2 shadow-[0_8px_0_#161426]'
                            : 'border-[#161426] shadow-[0_4px_0_#161426] hover:-translate-y-1'
                        }`}
                      >
                        <DixitArtCardSvg cardId={cid} />
                      </button>
                    );
                  })}
                </div>
              )}

              <form onSubmit={handleStorytellerSubmit} className="flex flex-col sm:flex-row gap-2.5 pt-2">
                <input
                  type="text"
                  required
                  maxLength={70}
                  value={clueInput}
                  onChange={(e) => setClueInput(e.target.value)}
                  placeholder={
                    lang === 'ar'
                      ? 'اكتب التلميح (لا تخليه واضح كتير للكل ولا مستحيل!)...'
                      : 'Write a poetic/clever clue (not too easy, not impossible)...'
                  }
                  className="cartoon-input min-w-0 flex-1 px-4 py-3 bg-white text-[#161426]"
                />
                <button
                  type="submit"
                  disabled={!selectedCardId || !clueInput.trim()}
                  className="cartoon-btn bg-[#8ac926] text-[#161426] px-6 py-3 text-lg flex items-center justify-center gap-2 shrink-0"
                >
                  <PaperPlaneTilt weight="fill" className="w-5 h-5" />
                  <span>{lang === 'ar' ? 'اعتماد اللوحة والتلميح' : 'Lock Card & Clue'}</span>
                </button>
              </form>
            </>
          ) : (
            <div className="py-8 text-center space-y-2">
              <div className="text-xl font-extrabold text-[#3b1d6e] animate-pulse">
                {lang === 'ar'
                  ? `${storyteller?.name} عم يتأمل لوحاته ويحضّر تلميح خيالي...`
                  : `${storyteller?.name} is picking a dream card & crafting a clue...`}
              </div>
              <p className="text-sm font-bold text-[#3f3b5c]">
                {lang === 'ar' ? 'تفرّج ع أوراق إيدك تحت وجهّز حالك!' : 'Inspect your own hand below while you wait!'}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-4">
                {(gameData.hands?.[myPlayerId] || []).map((cid) => (
                  <div
                    key={cid}
                    className="rounded-2xl overflow-hidden border-4 border-[#161426] shadow-[0_4px_0_#161426]"
                  >
                    <DixitArtCardSvg cardId={cid} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* PHASE 2: OTHER PLAYERS PICK DECOY CARDS */}
      {gameData.phase === 'decoys' && (
        <div className="cartoon-card p-5 space-y-4">
          {isPassAndPlay && (
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-2xl bg-[#191636] text-white">
              <span className="font-extrabold text-sm">
                {lang === 'ar'
                  ? `دور (${currentViewer?.name}) ليختار لوحة تمويه:`
                  : `${currentViewer?.name}’s turn to pick a decoy card:`}
              </span>
              <button
                type="button"
                onClick={() => setPeekHand(!peekHand)}
                className="cartoon-btn bg-[#ffca3a] text-[#161426] px-3.5 py-1.5 text-xs flex items-center gap-1.5"
              >
                {peekHand ? <EyeSlash className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                <span>
                  {peekHand
                    ? lang === 'ar'
                      ? 'إخفاء الأوراق'
                      : 'Hide Cards'
                    : lang === 'ar'
                    ? `عرض أوراق ${currentViewer?.name}`
                    : `Show ${currentViewer?.name}’s Hand`}
                </span>
              </button>
            </div>
          )}

          {!isPassAndPlay && myPlayerId === storyteller?.id ? (
            <div className="p-6 text-center space-y-3">
              <div className="text-xl font-extrabold text-[#161426]">
                {lang === 'ar'
                  ? 'باقي اللاعبين عم يختاروا لوحات مشابهة لتلميحك لتمويه الشلّة!'
                  : 'Other players are picking matching decoy cards from their hands!'}
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                {nonStorytellers.map((p) => {
                  const done = typeof gameData.submittedCards?.[p.id] === 'number';
                  return (
                    <span
                      key={p.id}
                      className={`cartoon-badge px-3 py-1 text-xs ${
                        done ? 'bg-[#8ac926] text-[#161426]' : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {p.name} {done ? '✓' : '...'}
                    </span>
                  );
                })}
              </div>
            </div>
          ) : hasSubmittedDecoy && !isPassAndPlay ? (
            <div className="p-6 text-center font-extrabold text-lg text-[#38b000]">
              {lang === 'ar'
                ? 'تم إرسال لوحتك التمويهية! بانتظار البقية...'
                : 'Decoy card submitted! Waiting for others...'}
            </div>
          ) : (
            peekHand && (
              <>
                <h3 className="font-extrabold text-base text-[#161426]">
                  {lang === 'ar'
                    ? 'اختار من إيدك اللوحة اللي أكثر شي بتشبه تلميح الراوي عشان تخدع الباقين يصوّتولها!'
                    : 'Click 1 card from your hand that best fits the clue to fool your friends!'}
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {myHand.map((cid) => (
                    <button
                      key={cid}
                      type="button"
                      onClick={() => handleSubmitDecoy(cid)}
                      className="rounded-2xl overflow-hidden border-4 border-[#161426] shadow-[0_5px_0_#161426] hover:-translate-y-2 hover:border-[#9b5de5] transition-all cursor-pointer"
                    >
                      <DixitArtCardSvg cardId={cid} />
                    </button>
                  ))}
                </div>
              </>
            )
          )}
        </div>
      )}

      {/* PHASE 3: VOTING ON SHUFFLED CARDS */}
      {gameData.phase === 'voting' && (
        <div className="cartoon-card p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-extrabold text-lg text-[#161426]">
              {lang === 'ar'
                ? isPassAndPlay
                  ? `دور (${currentViewer?.name}) للتصويت: أي وحدة لوحة الراوي الحقيقية؟`
                  : 'أي وحدة هي لوحة الراوي الحقيقية؟ (ممنوع تصوّت للوحتك!)'
                : 'Which card actually belongs to the Storyteller?'}
            </h3>

            {(isHost || myPlayerId === storyteller?.id) &&
              Object.keys(gameData.votes || {}).length > 0 && (
                <button
                  type="button"
                  onClick={() => scoreAndReveal(gameData.votes || {})}
                  className="cartoon-btn bg-[#00bbf9] text-[#161426] px-3.5 py-1.5 text-xs"
                >
                  {lang === 'ar' ? 'اكشف النتيجة الآن' : 'Reveal Now'}
                </button>
              )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {(gameData.shuffledCardIds || []).map((cid, idx) => {
              const isMine =
                nonStorytellers.length > 0 &&
                gameData.submittedCards?.[currentViewerId] === cid;
              const myVote = gameData.votes?.[currentViewerId] === cid;
              const canClick =
                (isPassAndPlay || myPlayerId !== storyteller?.id || nonStorytellers.length === 0) &&
                !isMine;

              return (
                <div key={cid} className="flex flex-col items-center gap-2">
                  <button
                    type="button"
                    disabled={!canClick}
                    onClick={() => handleCastVote(cid)}
                    className={`w-full rounded-2xl overflow-hidden border-4 transition-all relative ${
                      myVote
                        ? 'border-[#8ac926] ring-4 ring-[#8ac926] -translate-y-1.5'
                        : isMine
                        ? 'border-gray-400 opacity-60 cursor-not-allowed'
                        : canClick
                        ? 'border-[#161426] shadow-[0_6px_0_#161426] hover:-translate-y-1.5 cursor-pointer'
                        : 'border-[#161426]'
                    }`}
                  >
                    <DixitArtCardSvg cardId={cid} />
                    <span className="absolute top-2 start-2 cartoon-badge bg-[#ffca3a] text-[#161426] w-7 h-7 flex items-center justify-center text-xs">
                      #{idx + 1}
                    </span>
                  </button>

                  {isMine && (
                    <span className="text-xs font-extrabold text-[#ff595e]">
                      {lang === 'ar' ? 'لوحتك (تمويه)' : 'Your Decoy'}
                    </span>
                  )}
                  {myVote && !isPassAndPlay && (
                    <span className="cartoon-badge bg-[#8ac926] text-[#161426] px-2.5 py-0.5 text-xs flex items-center gap-1">
                      <CheckCircle weight="fill" className="w-3.5 h-3.5" />
                      <span>{lang === 'ar' ? 'صوّتت لها' : 'Voted'}</span>
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {!isPassAndPlay && hasVoted && (
            <div className="text-center font-extrabold text-sm text-[#38b000]">
              {lang === 'ar' ? 'تم تسجيل صوتك! بانتظار البقية...' : 'Vote locked! Waiting for others...'}
            </div>
          )}
        </div>
      )}

      {/* PHASE 4: REVEAL & GOLDILOCKS BREAKDOWN */}
      {gameData.phase === 'reveal' && (
        <div className="cartoon-card p-5 space-y-4 animate-in zoom-in-95 duration-200">
          <h3 className="text-2xl font-extrabold text-[#161426] text-center flex items-center justify-center gap-2">
            <Star weight="fill" className="w-7 h-7 text-[#ffca3a]" />
            <span>
              {lang === 'ar' ? 'كشف اللوحات وأصحابها!' : 'Dream Cards Revealed!'}
            </span>
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {(gameData.shuffledCardIds || []).map((cid) => {
              const ownerEntry = Object.entries(gameData.submittedCards || {}).find(
                ([, c]) => c === cid
              );
              const ownerId = ownerEntry?.[0] || '';
              const isStoryCard = ownerId === storyteller?.id;
              const ownerPlayer = players.find((p) => p.id === ownerId);
              const votersForThis = Object.entries(gameData.votes || {})
                .filter(([, vc]) => vc === cid)
                .map(([vid]) => players.find((p) => p.id === vid)?.name || '?');

              return (
                <div
                  key={cid}
                  className={`p-2.5 rounded-2xl border-4 flex flex-col justify-between ${
                    isStoryCard
                      ? 'bg-[#fff1c2] border-[#ff595e] shadow-[0_6px_0_#161426]'
                      : 'bg-white border-[#161426] shadow-[0_4px_0_#161426]'
                  }`}
                >
                  <div className="rounded-xl overflow-hidden border-2 border-[#161426]">
                    <DixitArtCardSvg cardId={cid} />
                  </div>

                  <div className="pt-2 text-center space-y-1">
                    <span
                      className={`cartoon-badge px-2.5 py-0.5 text-xs inline-block ${
                        isStoryCard
                          ? 'bg-[#ff595e] text-white'
                          : 'bg-[#191636] text-[#ffca3a]'
                      }`}
                    >
                      {isStoryCard
                        ? lang === 'ar'
                          ? `لوحة الراوي (${storyteller?.name})`
                          : `Storyteller (${storyteller?.name})`
                        : ownerPlayer
                        ? ownerPlayer.name
                        : lang === 'ar'
                        ? 'لوحة غامضة'
                        : 'Mystery Deck'}
                    </span>

                    {votersForThis.length > 0 && (
                      <div className="text-[11px] font-extrabold text-[#3f3b5c]">
                        {lang === 'ar' ? 'صوّت لها: ' : 'Voted by: '}
                        {votersForThis.join('، ')}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={handleNextStoryRound}
            className="cartoon-btn bg-[#8ac926] text-[#161426] w-full py-3.5 text-xl flex items-center justify-center gap-2"
          >
            <ArrowsClockwise weight="bold" className="w-6 h-6" />
            <span>{lang === 'ar' ? 'جولة خيال جديدة!' : 'Next Dream Round!'}</span>
          </button>
        </div>
      )}
    </div>
  );
};
