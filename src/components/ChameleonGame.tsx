import React, { useState, useEffect } from 'react';
import { CHAMELEON_TOPICS } from '../data/partyGamesData';
import { CartoonAvatarSvg, TopicCategoryIcon } from './CartoonIcons';
import {
  Eye,
  EyeSlash,
  CheckCircle,
  XCircle,
  Sparkle,
  PaperPlaneTilt,
  ArrowsClockwise,
  UserCheck,
  ArrowDown,
  ChatCircleText,
  Detective,
  Ear,
  SkipForward,
  Plus,
  Check,
  Hourglass,
  Megaphone,
  Target,
} from '@phosphor-icons/react';

export interface QATurnItem {
  askerId: string;
  responderId: string;
  question: string;
  answer?: string;
}

export interface ChameleonGameState {
  phase: 'qa' | 'voting' | 'chameleon_guess' | 'reveal';
  topicId: string;
  secretWordIndex: number;
  chameleonId: string;
  turnIndex: number;
  qaHistory: QATurnItem[];
  currentQuestion?: string;
  currentAnswer?: string;
  customAskerId?: string;
  customResponderId?: string;
  votes: Record<string, string>;
  chameleonChosenWordIndex?: number | null;
}

interface PlayerInfo {
  id: string;
  name: string;
  avatar_color: string;
  score: number;
}

interface ChameleonGameProps {
  gameData: ChameleonGameState;
  players: PlayerInfo[];
  myPlayerId: string;
  isHost: boolean;
  isPassAndPlay: boolean;
  lang: 'ar' | 'en';
  onUpdateGameData: (nextData: ChameleonGameState, scoreAwards?: Record<string, number>) => void;
  onStartNewRound: () => void;
}

export const ChameleonGame: React.FC<ChameleonGameProps> = ({
  gameData,
  players,
  myPlayerId,
  isHost,
  isPassAndPlay,
  lang,
  onUpdateGameData,
  onStartNewRound,
}) => {
  const [peekRole, setPeekRole] = useState<boolean>(!isPassAndPlay);
  const [activeLocalPlayerIdx, setActiveLocalPlayerIdx] = useState<number>(0);
  const [selectedTargetId, setSelectedTargetId] = useState<string>('');
  const [showTextChatBox, setShowTextChatBox] = useState<boolean>(true);
  const [questionInput, setQuestionInput] = useState<string>('');
  const [answerInput, setAnswerInput] = useState<string>('');
  const [turnProgress, setTurnProgress] = useState<number>(85);

  const topic =
    CHAMELEON_TOPICS.find((t) => t.id === gameData.topicId) || CHAMELEON_TOPICS[0];
  const words = lang === 'ar' ? topic.words_ar : topic.words_en;
  const secretWord = words[gameData.secretWordIndex] || words[0];

  const currentViewerId = isPassAndPlay
    ? players[activeLocalPlayerIdx]?.id || myPlayerId
    : myPlayerId;
  const currentViewer = players.find((p) => p.id === currentViewerId);
  const isViewerChameleon = currentViewerId === gameData.chameleonId;
  const chameleonPlayer = players.find((p) => p.id === gameData.chameleonId);

  const safePlayers = players.length > 0 ? players : [];
  const totalQuestions = Math.max(2, safePlayers.length);
  const currentTurnNumber = (gameData.turnIndex || 0) + 1;
  const tIdx = (gameData.turnIndex || 0) % Math.max(1, safePlayers.length);
  const defaultAsker = safePlayers[tIdx];
  const defaultResponder = safePlayers[(tIdx + 1) % Math.max(1, safePlayers.length)];

  const activeAskerId = gameData.customAskerId || defaultAsker?.id || myPlayerId;
  const activeResponderId =
    gameData.customResponderId ||
    selectedTargetId ||
    (defaultResponder?.id !== activeAskerId
      ? defaultResponder?.id
      : safePlayers.find((p) => p.id !== activeAskerId)?.id) ||
    myPlayerId;

  const askerIdx = Math.max(0, players.findIndex((p) => p.id === activeAskerId));
  const responderIdx = Math.max(0, players.findIndex((p) => p.id === activeResponderId));
  const askerPlayer = players[askerIdx] || players[0];
  const responderPlayer = players[responderIdx] || players[0];

  useEffect(() => {
    setTurnProgress(100);
    const interval = setInterval(() => {
      setTurnProgress((prev) => (prev > 4 ? prev - 1.5 : 4));
    }, 450);
    return () => clearInterval(interval);
  }, [gameData.turnIndex, activeAskerId, activeResponderId]);

  const hasQuestion = Boolean(gameData.currentQuestion);
  const hasAnswer = Boolean(gameData.currentAnswer);
  const canControlTurn =
    isPassAndPlay ||
    isHost ||
    myPlayerId === activeAskerId ||
    myPlayerId === activeResponderId;

  const canWriteQuestion =
    !hasQuestion && (isPassAndPlay || isHost || myPlayerId === activeAskerId);
  const canWriteAnswer =
    hasQuestion && !hasAnswer && (isPassAndPlay || isHost || myPlayerId === activeResponderId);

  // Move to the NEXT pair after everyone has seen the current question & answer!
  const handleAdvanceToNextTurn = () => {
    const newItem: QATurnItem = {
      askerId: activeAskerId,
      responderId: activeResponderId,
      question:
        gameData.currentQuestion ||
        (lang === 'ar' ? 'سؤال شفهي' : 'Spoken question'),
      answer:
        gameData.currentAnswer ||
        (lang === 'ar' ? 'جواب شفهي' : 'Spoken answer'),
    };

    const nextTurnIndex = (gameData.turnIndex || 0) + 1;
    setSelectedTargetId('');
    setQuestionInput('');
    setAnswerInput('');
    if (isPassAndPlay) {
      setPeekRole(false);
      setActiveLocalPlayerIdx(nextTurnIndex % Math.max(1, players.length));
    }

    onUpdateGameData({
      ...gameData,
      turnIndex: nextTurnIndex,
      currentQuestion: undefined,
      currentAnswer: undefined,
      customAskerId: undefined,
      customResponderId: undefined,
      qaHistory: [...(gameData.qaHistory || []), newItem],
    });
  };

  // Step 1A: Asker sends a question -> stays on screen waiting for Responder's answer
  const handleSendQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    const qText =
      questionInput.trim() || (lang === 'ar' ? 'سؤال شفهي' : 'Spoken question');
    setQuestionInput('');

    if (isPassAndPlay) {
      const respIdx = players.findIndex((p) => p.id === activeResponderId);
      if (respIdx >= 0) setActiveLocalPlayerIdx(respIdx);
    }

    onUpdateGameData({
      ...gameData,
      currentQuestion: qText,
      currentAnswer: undefined,
      customAskerId: activeAskerId,
      customResponderId: activeResponderId,
    });
  };

  // Step 1B: Responder sends their answer -> BOTH Question & Answer stay visible on screen until someone clicks "Next Question"!
  const handleSendAnswer = (e: React.FormEvent) => {
    e.preventDefault();
    const aText =
      answerInput.trim() || (lang === 'ar' ? 'جاوب شفهياً' : 'Answered out loud');
    setAnswerInput('');

    onUpdateGameData({
      ...gameData,
      currentAnswer: aText,
    });
  };

  const handleCastVote = (suspectId: string) => {
    if (suspectId === currentViewerId && players.length > 1) return;
    const nextVotes = {
      ...(gameData.votes || {}),
      [currentViewerId]: suspectId,
    };

    if (isPassAndPlay && activeLocalPlayerIdx + 1 < players.length) {
      setPeekRole(false);
      setActiveLocalPlayerIdx(activeLocalPlayerIdx + 1);
      onUpdateGameData({
        ...gameData,
        votes: nextVotes,
      });
      return;
    }

    const allVoted = players.every((p) => nextVotes[p.id]);
    onUpdateGameData({
      ...gameData,
      votes: nextVotes,
      phase: allVoted ? 'chameleon_guess' : 'voting',
    });
  };

  const handleChameleonPickWord = (wordIndex: number) => {
    const canPick = isPassAndPlay || myPlayerId === gameData.chameleonId || isHost;
    if (!canPick) return;

    const awards: Record<string, number> = {};
    Object.entries(gameData.votes || {}).forEach(([voterId, suspectId]) => {
      if (suspectId === gameData.chameleonId && voterId !== gameData.chameleonId) {
        awards[voterId] = (awards[voterId] || 0) + 2;
      }
    });

    const guessedRight = wordIndex === gameData.secretWordIndex;
    if (guessedRight) {
      awards[gameData.chameleonId] = (awards[gameData.chameleonId] || 0) + 3;
    } else {
      const voteCounts: Record<string, number> = {};
      Object.values(gameData.votes || {}).forEach((v) => {
        voteCounts[v] = (voteCounts[v] || 0) + 1;
      });
      const chamVotes = voteCounts[gameData.chameleonId] || 0;
      const maxVotes = Math.max(0, ...Object.values(voteCounts));
      if (chamVotes < maxVotes) {
        awards[gameData.chameleonId] = (awards[gameData.chameleonId] || 0) + 2;
      }
    }

    onUpdateGameData(
      {
        ...gameData,
        chameleonChosenWordIndex: wordIndex,
        phase: 'reveal',
      },
      awards
    );
  };

  return (
    <div className="space-y-4">
      {/* Pass & Play Player Switcher Bar */}
      {isPassAndPlay && (gameData.phase === 'qa' || gameData.phase === 'voting') && (
        <div className="cartoon-panel-dark p-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm font-extrabold">
            <Sparkle weight="fill" className="w-5 h-5 text-[#ffca3a]" />
            <span>
              {lang === 'ar' ? 'اللاعب اللي ماسك الجهاز:' : 'Current Player:'}
            </span>
            <span className="cartoon-badge bg-[#ffca3a] text-[#161426] px-3 py-0.5">
              {currentViewer?.name}
            </span>
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {players.map((p, idx) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setPeekRole(false);
                  setActiveLocalPlayerIdx(idx);
                }}
                className={`cartoon-badge px-3 py-1 text-xs cursor-pointer ${
                  idx === activeLocalPlayerIdx
                    ? 'bg-[#00bbf9] text-[#161426]'
                    : 'bg-[#191636] text-white'
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ================= PHASE 1: QUESTION & ANSWER SPOTLIGHT ================= */}
      {gameData.phase === 'qa' && (
        <div className="rounded-3xl bg-[#5c73b8] border-4 border-[#161426] shadow-[0_8px_0_#161426] p-5 md:p-7 text-white relative overflow-hidden min-h-[540px] flex flex-col justify-between">
          {/* Top Bar: Category Pill on one side, Secret Word Pill + New Round on the other side */}
          <div className="flex items-center justify-between gap-2 flex-wrap z-10">
            <div className="flex items-center gap-2">
              <span className="px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white/30 text-xs md:text-sm font-extrabold text-white shadow-sm flex items-center gap-1.5">
                <TopicCategoryIcon topicId={topic.id} className="w-4 h-4 text-[#ffca3a]" />
                <span>{lang === 'ar' ? topic.title_ar : topic.title_en}</span>
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Secret Word Pill (Tap to Peek / Hide) */}
              <button
                type="button"
                onClick={() => setPeekRole(!peekRole)}
                className={`px-4 py-1.5 rounded-full border-2 text-xs md:text-sm font-extrabold flex items-center gap-2 transition-all cursor-pointer shadow-sm ${
                  !peekRole
                    ? 'bg-[#161426]/60 border-white/30 text-white'
                    : isViewerChameleon
                    ? 'bg-[#ff595e] border-[#161426] text-white'
                    : 'bg-white/25 border-white/40 text-white'
                }`}
                title={lang === 'ar' ? 'اضغط لإخفاء أو إظهار الكلمة السرية' : 'Click to toggle secret role'}
              >
                {peekRole ? (
                  isViewerChameleon ? (
                    <>
                      <Detective weight="fill" className="w-4 h-4 text-[#ffca3a]" />
                      <span>{lang === 'ar' ? 'إنت برّا السالفة!' : 'Out of the Loop!'}</span>
                      <EyeSlash weight="bold" className="w-4 h-4 opacity-80" />
                    </>
                  ) : (
                    <>
                      <TopicCategoryIcon topicId={topic.id} className="w-4 h-4 text-[#ffca3a]" />
                      <span>{secretWord}</span>
                      <EyeSlash weight="bold" className="w-4 h-4 opacity-80" />
                    </>
                  )
                ) : (
                  <>
                    <Eye weight="bold" className="w-4 h-4 text-[#ffca3a]" />
                    <span>{lang === 'ar' ? 'اكشف دورك السري' : 'Show Secret Role'}</span>
                  </>
                )}
              </button>

              {(isHost || isPassAndPlay) && (
                <button
                  type="button"
                  onClick={() => {
                    setPeekRole(!isPassAndPlay);
                    setActiveLocalPlayerIdx(0);
                    onStartNewRound();
                  }}
                  className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 border-2 border-white/30 flex items-center justify-center text-white cursor-pointer"
                  title={lang === 'ar' ? 'تغيير السالفة' : 'New Topic'}
                >
                  <ArrowsClockwise weight="bold" className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          {/* Center Vertical Layout: Question Pill -> Asker Circle -> asks ↓ -> Responder Circle */}
          <div className="my-5 flex flex-col items-center justify-center text-center space-y-3 z-10">
            {/* Question X of Y Pill */}
            <div className="px-4 py-1 rounded-full bg-white/20 border-2 border-white/30 text-xs md:text-sm font-extrabold text-white/95">
              {lang === 'ar'
                ? `السؤال ${currentTurnNumber} من ${totalQuestions}`
                : `Question ${currentTurnNumber} of ${totalQuestions}`}
            </div>

            {/* ASKER Large Circular Vector Cartoon Avatar + Name Pill */}
            <div className="relative flex flex-col items-center pt-1">
              <div
                style={{ borderColor: askerPlayer?.avatar_color || '#f9a826' }}
                className="w-28 h-28 md:w-32 md:h-32 rounded-full bg-[#dce3f2] border-[5px] shadow-[0_6px_0_rgba(22,20,38,0.45)] flex items-center justify-center p-2 select-none"
              >
                <CartoonAvatarSvg
                  index={askerIdx}
                  color={askerPlayer?.avatar_color || '#ffca3a'}
                />
              </div>
              <div
                style={{ backgroundColor: askerPlayer?.avatar_color || '#f9a826' }}
                className="-mt-3.5 px-5 py-1 rounded-full border-3 border-[#161426] text-[#161426] font-extrabold text-sm md:text-base shadow-[0_3px_0_#161426]"
              >
                {askerPlayer?.name || '?'}
              </div>
            </div>

            {/* QUESTION BUBBLE (Stays visible right below Asker!) */}
            {gameData.currentQuestion && (
              <div className="px-5 py-2.5 rounded-2xl bg-[#fff9ec] text-[#161426] border-3 border-[#161426] shadow-[0_4px_0_#161426] max-w-md w-full animate-in zoom-in-95 duration-150">
                <div className="text-[11px] font-extrabold text-[#1982c4] uppercase">
                  {lang === 'ar'
                    ? `سؤال ${askerPlayer?.name}:`
                    : `${askerPlayer?.name}'s Question:`}
                </div>
                <div className="text-base md:text-lg font-extrabold mt-0.5">
                  &ldquo;{gameData.currentQuestion}&rdquo;
                </div>
              </div>
            )}

            {/* "asks / يسأل" + Downward Arrow ↓ */}
            <div className="flex flex-col items-center py-0.5">
              <span className="text-base md:text-lg font-extrabold tracking-wide text-white drop-shadow">
                {lang === 'ar' ? 'يسأل' : 'asks'}
              </span>
              <ArrowDown weight="bold" className="w-8 h-8 text-white/90 mt-0.5 animate-bounce" />
            </div>

            {/* RESPONDER Large Circular Vector Cartoon Avatar + Name Pill */}
            <div className="relative flex flex-col items-center">
              <div
                style={{ borderColor: responderPlayer?.avatar_color || '#e11d48' }}
                className="w-28 h-28 md:w-32 md:h-32 rounded-full bg-[#eef1f8] border-[5px] shadow-[0_6px_0_rgba(22,20,38,0.45)] flex items-center justify-center p-2 select-none"
              >
                <CartoonAvatarSvg
                  index={responderIdx + 2}
                  color={responderPlayer?.avatar_color || '#00bbf9'}
                />
              </div>
              <div
                style={{ backgroundColor: responderPlayer?.avatar_color || '#e11d48' }}
                className="-mt-3.5 px-5 py-1 rounded-full border-3 border-[#161426] text-[#161426] font-extrabold text-sm md:text-base shadow-[0_3px_0_#161426]"
              >
                {responderPlayer?.name || '?'}
              </div>
            </div>

            {/* ANSWER BUBBLE (Stays visible right below Responder so everyone can read both Question & Answer!) */}
            {gameData.currentAnswer && (
              <div className="px-5 py-2.5 rounded-2xl bg-[#8ac926] text-[#161426] border-3 border-[#161426] shadow-[0_4px_0_#161426] max-w-md w-full animate-in zoom-in-95 duration-150">
                <div className="text-[11px] font-extrabold text-[#161426]/80 uppercase">
                  {lang === 'ar'
                    ? `جواب ${responderPlayer?.name}:`
                    : `${responderPlayer?.name}'s Answer:`}
                </div>
                <div className="text-base md:text-lg font-extrabold mt-0.5">
                  &ldquo;{gameData.currentAnswer}&rdquo;
                </div>
              </div>
            )}

            {/* Optional: Pick a different Responder pill bar if > 2 players */}
            {canControlTurn && players.length > 2 && !hasQuestion && (
              <div className="flex flex-wrap items-center justify-center gap-1.5 pt-2">
                <span className="text-xs font-bold text-white/80">
                  {lang === 'ar' ? 'تغيير المسؤول:' : 'Change target:'}
                </span>
                {players
                  .filter((p) => p.id !== activeAskerId)
                  .map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelectedTargetId(p.id)}
                      className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold cursor-pointer transition-all ${
                        activeResponderId === p.id
                          ? 'bg-[#ffca3a] text-[#161426] border-2 border-[#161426]'
                          : 'bg-white/20 text-white hover:bg-white/30'
                      }`}
                    >
                      {p.name}
                    </button>
                  ))}
              </div>
            )}
          </div>

          {/* Bottom Progress Bar + Text Input + Next Turn Controls */}
          <div className="w-full max-w-md mx-auto space-y-3 z-10">
            {/* Orange Progress Bar */}
            <div className="w-full h-2.5 rounded-full bg-white/30 overflow-hidden">
              <div
                style={{ width: `${turnProgress}%` }}
                className="h-full rounded-full bg-[#f59e0b] transition-all duration-300"
              />
            </div>

            <div className="flex items-center justify-center gap-1.5 text-xs md:text-sm font-extrabold text-white/90">
              <Ear weight="fill" className="w-4 h-4 text-[#ffca3a]" />
              <span>
                {hasAnswer
                  ? lang === 'ar'
                    ? 'الكل قرأ السؤال والجواب؟ اضغط «السؤال التالي» للمتابعة!'
                    : 'Everyone read the Q&A? Click Next Question to continue!'
                  : hasQuestion
                  ? lang === 'ar'
                    ? `بانتظار جواب ${responderPlayer?.name}...`
                    : `Waiting for ${responderPlayer?.name}'s answer...`
                  : lang === 'ar'
                  ? 'اسمع السؤال والجواب بتركيز'
                  : 'Listen to the question and answer'}
              </span>
            </div>

            {/* Text Input for Question or Answer */}
            {showTextChatBox && (
              <div className="pt-1">
                {canWriteQuestion && (
                  <form onSubmit={handleSendQuestion} className="flex gap-2">
                    <input
                      type="text"
                      maxLength={70}
                      value={questionInput}
                      onChange={(e) => setQuestionInput(e.target.value)}
                      placeholder={
                        lang === 'ar'
                          ? `اكتب سؤال ${askerPlayer?.name} هون...`
                          : `Type ${askerPlayer?.name}'s question...`
                      }
                      className="cartoon-input min-w-0 flex-1 px-3.5 py-2.5 bg-white text-[#161426] text-sm"
                    />
                    <button
                      type="submit"
                      className="cartoon-btn bg-[#ffca3a] text-[#161426] px-4 py-2.5 text-sm shrink-0 flex items-center gap-1.5"
                    >
                      <PaperPlaneTilt weight="fill" className="w-4 h-4" />
                      <span>{lang === 'ar' ? 'اسأل' : 'Ask'}</span>
                    </button>
                  </form>
                )}

                {canWriteAnswer && (
                  <form onSubmit={handleSendAnswer} className="flex gap-2">
                    <input
                      type="text"
                      maxLength={70}
                      value={answerInput}
                      onChange={(e) => setAnswerInput(e.target.value)}
                      placeholder={
                        lang === 'ar'
                          ? `اكتب جواب ${responderPlayer?.name} هون...`
                          : `Type ${responderPlayer?.name}'s answer...`
                      }
                      className="cartoon-input min-w-0 flex-1 px-3.5 py-2.5 bg-white text-[#161426] text-sm"
                    />
                    <button
                      type="submit"
                      className="cartoon-btn bg-[#8ac926] text-[#161426] px-4 py-2.5 text-sm shrink-0 flex items-center gap-1.5"
                    >
                      <PaperPlaneTilt weight="fill" className="w-4 h-4" />
                      <span>{lang === 'ar' ? 'إرسال الجواب' : 'Answer'}</span>
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* Main Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
              {canControlTurn && (
                <button
                  type="button"
                  onClick={handleAdvanceToNextTurn}
                  className={`cartoon-btn px-5 py-2.5 text-sm md:text-base flex-1 flex items-center justify-center gap-1.5 ${
                    hasAnswer
                      ? 'bg-[#8ac926] hover:bg-[#9be02f] text-[#161426] ring-4 ring-white animate-pulse'
                      : 'bg-[#ffca3a] hover:bg-[#ffd55a] text-[#161426]'
                  }`}
                >
                  {currentTurnNumber < totalQuestions ? (
                    <>
                      <span>{lang === 'ar' ? 'السؤال التالي' : 'Next Question'}</span>
                      <SkipForward weight="fill" className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      <Plus weight="bold" className="w-4 h-4" />
                      <span>{lang === 'ar' ? 'كمان سؤال إضافي' : 'Ask Another Question'}</span>
                    </>
                  )}
                </button>
              )}

              {canControlTurn && (
                <button
                  type="button"
                  onClick={() => setShowTextChatBox(!showTextChatBox)}
                  className="cartoon-btn bg-white/20 hover:bg-white/30 text-white px-3.5 py-2.5 text-xs md:text-sm flex items-center gap-1.5"
                  title={lang === 'ar' ? 'إظهار/إخفاء مربع الكتابة' : 'Toggle text input'}
                >
                  <ChatCircleText weight="fill" className="w-5 h-5" />
                  <span>{lang === 'ar' ? 'كتابة' : 'Type'}</span>
                </button>
              )}

              {(isHost || isPassAndPlay || (gameData.turnIndex || 0) >= 1) && (
                <button
                  type="button"
                  onClick={() => {
                    setPeekRole(false);
                    setActiveLocalPlayerIdx(0);
                    onUpdateGameData({ ...gameData, phase: 'voting' });
                  }}
                  className={`cartoon-btn px-5 py-2.5 text-sm md:text-base flex items-center justify-center gap-1.5 ${
                    currentTurnNumber >= totalQuestions
                      ? 'bg-[#ff595e] text-white w-full'
                      : 'bg-[#161426] text-[#ffca3a]'
                  }`}
                >
                  <Detective weight="fill" className="w-5 h-5" />
                  <span>
                    {lang === 'ar'
                      ? 'يلا نصوّت مين برّا السالفة!'
                      : 'Vote Who is Out of the Loop!'}
                  </span>
                </button>
              )}
            </div>

            {/* Previous Q&A Log so no question/answer is ever lost! */}
            {gameData.qaHistory && gameData.qaHistory.length > 0 && (
              <div className="pt-2 space-y-1.5 max-h-36 overflow-y-auto text-start">
                <div className="text-[11px] font-extrabold text-white/80 uppercase">
                  {lang === 'ar' ? 'الأسئلة السابقة:' : 'Previous Q&A:'}
                </div>
                {gameData.qaHistory.map((item, idx) => {
                  const askP = players.find((p) => p.id === item.askerId);
                  const respP = players.find((p) => p.id === item.responderId);
                  return (
                    <div
                      key={idx}
                      className="px-3 py-2 rounded-xl bg-[#161426]/40 border border-white/20 text-xs space-y-0.5"
                    >
                      <div className="font-extrabold text-[#ffca3a]">
                        {askP?.name} ← {respP?.name}:{' '}
                        <span className="text-white">&ldquo;{item.question}&rdquo;</span>
                      </div>
                      {item.answer && (
                        <div className="font-bold text-[#8ac926]">
                          {respP?.name}: <span className="text-white">&ldquo;{item.answer}&rdquo;</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= PHASE 2: VOTING FOR WHO IS OUT OF THE LOOP ================= */}
      {gameData.phase === 'voting' && (
        <div className="cartoon-card p-5 space-y-4 text-center">
          <h3 className="font-extrabold text-xl text-[#161426] flex items-center justify-center gap-2">
            <Detective weight="fill" className="w-7 h-7 text-[#ff595e]" />
            <span>
              {lang === 'ar'
                ? 'وقت التصويت! مين برأيكم الشخص اللي برّا السالفة؟'
                : 'Voting Time! Who is Out of the Loop?'}
            </span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {players.map((p, idx) => {
              const myVote = gameData.votes?.[currentViewerId];
              const isSelected = myVote === p.id;
              const isSelf = !isPassAndPlay && p.id === currentViewerId && players.length > 1;
              return (
                <button
                  key={p.id}
                  type="button"
                  disabled={isSelf}
                  onClick={() => handleCastVote(p.id)}
                  className={`cartoon-btn p-3.5 flex items-center justify-between ${
                    isSelected
                      ? 'bg-[#ff595e] text-white'
                      : isSelf
                      ? 'bg-gray-200 text-gray-400'
                      : 'bg-white hover:bg-[#fff3d1] text-[#161426]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-11 h-11 rounded-full bg-[#eef1f8] border-3 border-[#161426] p-1 flex items-center justify-center">
                      <CartoonAvatarSvg index={idx} color={p.avatar_color} />
                    </div>
                    <span className="font-extrabold text-base">{p.name}</span>
                  </div>
                  {isSelected && <UserCheck weight="fill" className="w-6 h-6" />}
                </button>
              );
            })}
          </div>

          {/* Show who has voted */}
          <div className="flex flex-wrap justify-center gap-2 pt-1">
            {players.map((p) => {
              const voted = Boolean(gameData.votes?.[p.id]);
              return (
                <span
                  key={p.id}
                  className={`cartoon-badge px-3 py-0.5 text-xs flex items-center gap-1 ${
                    voted ? 'bg-[#8ac926] text-[#161426]' : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  <span>{p.name}</span>
                  {voted ? (
                    <Check weight="bold" className="w-3.5 h-3.5" />
                  ) : (
                    <Hourglass weight="bold" className="w-3.5 h-3.5" />
                  )}
                </span>
              );
            })}
          </div>

          {(isHost || isPassAndPlay) && Object.keys(gameData.votes || {}).length > 0 && (
            <button
              type="button"
              onClick={() =>
                onUpdateGameData({
                  ...gameData,
                  phase: 'chameleon_guess',
                })
              }
              className="cartoon-btn bg-[#8ac926] text-[#161426] w-full py-3 text-lg flex items-center justify-center gap-2"
            >
              <Megaphone weight="fill" className="w-6 h-6" />
              <span>
                {lang === 'ar'
                  ? 'اكشف مين برّا السالفة واعطيه فرصة يحزر الكلمة!'
                  : 'Reveal Impostor & Let Them Guess the Word!'}
              </span>
            </button>
          )}
        </div>
      )}

      {/* ================= PHASE 3: CHAMELEON GUESSES THE SECRET WORD ================= */}
      {gameData.phase === 'chameleon_guess' && (
        <div className="cartoon-card p-5 space-y-4 text-center animate-in zoom-in-95 duration-200">
          <div className="p-4 rounded-2xl bg-[#ff595e] text-white border-4 border-[#161426] space-y-1">
            <div className="text-sm font-extrabold uppercase flex items-center justify-center gap-1.5">
              <Megaphone weight="fill" className="w-5 h-5 text-[#ffca3a]" />
              <span>{lang === 'ar' ? 'انكشف المستور!' : 'The Impostor is Revealed!'}</span>
            </div>
            <div className="text-2xl md:text-3xl font-extrabold flex items-center justify-center gap-2">
              <Detective weight="fill" className="w-8 h-8 text-[#ffca3a]" />
              <span>
                {lang === 'ar' ? 'اللي كان برّا السالفة هو:' : 'Out of the Loop:'}{' '}
                <span className="text-[#ffca3a] underline">{chameleonPlayer?.name}</span>
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <h3 className="font-extrabold text-xl text-[#161426] flex items-center justify-center gap-2">
              <Target weight="fill" className="w-6 h-6 text-[#ff595e]" />
              <span>
                {lang === 'ar'
                  ? `فرصة أخيرة لـ (${chameleonPlayer?.name}): شو تتوقع كانت السالفة؟`
                  : `Last Chance for ${chameleonPlayer?.name}: Guess the Secret Word!`}
              </span>
            </h3>
            <p className="text-sm font-bold text-[#3f3b5c]">
              {lang === 'ar'
                ? 'إذا حزر الكلمة صح من بين الخيارات تحت، بيكسب +3 نقاط!'
                : 'If they pick the right word below, they score +3 bonus points!'}
            </p>
          </div>

          {/* NOW the words grid appears for the Chameleon to pick from! */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
            {words.map((w, idx) => {
              const canClickWord =
                isPassAndPlay || myPlayerId === gameData.chameleonId || isHost;
              return (
                <button
                  key={idx}
                  type="button"
                  disabled={!canClickWord}
                  onClick={() => handleChameleonPickWord(idx)}
                  className="cartoon-btn p-3.5 bg-[#fff9ec] hover:bg-[#ffca3a] text-[#161426] text-base md:text-lg"
                >
                  {w}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ================= PHASE 4: FINAL REVEAL & SCORES ================= */}
      {gameData.phase === 'reveal' && (
        <div className="cartoon-card p-6 text-center space-y-4 animate-in zoom-in-95 duration-200">
          <div className="inline-flex items-center gap-2 cartoon-badge bg-[#8ac926] text-[#161426] px-4 py-1 text-sm">
            <CheckCircle weight="fill" className="w-5 h-5" />
            <span>{lang === 'ar' ? 'نتيجة الجولة!' : 'Round Results!'}</span>
          </div>

          <div className="text-2xl font-extrabold text-[#161426] flex items-center justify-center gap-2">
            <Detective weight="fill" className="w-7 h-7 text-[#ff595e]" />
            <span>
              {lang === 'ar' ? 'اللي كان برّا السالفة:' : 'Out of the Loop:'}{' '}
              <span className="text-[#ff595e]">{chameleonPlayer?.name}</span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-4 rounded-2xl bg-[#8ac926] border-4 border-[#161426] text-[#161426] font-extrabold">
              <div className="text-xs uppercase opacity-80">
                {lang === 'ar' ? 'السالفة الحقيقية كانت:' : 'The Real Secret Word:'}
              </div>
              <div className="text-2xl mt-1 flex items-center justify-center gap-1.5">
                <CheckCircle weight="fill" className="w-6 h-6" />
                <span>{secretWord}</span>
              </div>
            </div>

            <div
              className={`p-4 rounded-2xl border-4 border-[#161426] font-extrabold ${
                gameData.chameleonChosenWordIndex === gameData.secretWordIndex
                  ? 'bg-[#ffca3a] text-[#161426]'
                  : 'bg-[#ffe4e6] text-[#161426]'
              }`}
            >
              <div className="text-xs uppercase opacity-80">
                {lang === 'ar'
                  ? `تخمين ${chameleonPlayer?.name} للسالفة:`
                  : `${chameleonPlayer?.name}'s Guess:`}
              </div>
              <div className="text-2xl mt-1 flex items-center justify-center gap-1.5">
                {gameData.chameleonChosenWordIndex === gameData.secretWordIndex ? (
                  <CheckCircle weight="fill" className="w-6 h-6 text-[#161426]" />
                ) : (
                  <XCircle weight="fill" className="w-6 h-6 text-[#ff595e]" />
                )}
                <span>
                  {typeof gameData.chameleonChosenWordIndex === 'number'
                    ? words[gameData.chameleonChosenWordIndex]
                    : '-'}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setPeekRole(!isPassAndPlay);
              setActiveLocalPlayerIdx(0);
              onStartNewRound();
            }}
            className="cartoon-btn bg-[#ffca3a] text-[#161426] w-full py-3.5 text-xl flex items-center justify-center gap-2"
          >
            <ArrowsClockwise weight="bold" className="w-6 h-6" />
            <span>{lang === 'ar' ? 'سالفة جديدة!' : 'Play Next Round!'}</span>
          </button>
        </div>
      )}
    </div>
  );
};
