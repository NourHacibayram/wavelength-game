import React, { useState, useEffect } from 'react';
import { INSIDER_WORDS } from '../data/extraGamesData';
import {
  Eye,
  EyeSlash,
  Timer,
  CheckCircle,
  XCircle,
  Question,
  Detective,
  PaperPlaneTilt,
  Play,
  Trophy,
  ArrowsClockwise,
  Gavel,
} from '@phosphor-icons/react';

export interface InsiderQuestionEntry {
  id: string;
  authorId: string;
  text: string;
  reply?: 'yes' | 'no' | 'maybe';
}

export interface InsiderGameState {
  phase: 'role_peek' | 'questioning' | 'trial' | 'timeout' | 'reveal';
  wordId: number;
  judgeId: string;
  insiderId: string;
  startedAt: number;
  durationSec: number;
  questions: InsiderQuestionEntry[];
  solverId?: string;
  votes: Record<string, string>;
  caughtInsider?: boolean;
}

interface PlayerInfo {
  id: string;
  name: string;
  avatar_color: string;
  score: number;
}

interface InsiderGameProps {
  gameData: InsiderGameState;
  players: PlayerInfo[];
  myPlayerId: string;
  isHost: boolean;
  isPassAndPlay: boolean;
  lang: 'ar' | 'en';
  onUpdateGameData: (nextData: InsiderGameState, scoreAwards?: Record<string, number>) => void;
  onStartNewRound: () => void;
}

function normStr(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/^ال/, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/\s*\(.*?\)\s*/g, '')
    .trim();
}

export const InsiderGame: React.FC<InsiderGameProps> = ({
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
  const [localViewerIdx, setLocalViewerIdx] = useState<number>(0);
  const [secLeft, setSecLeft] = useState<number>(gameData.durationSec || 120);
  const [qInput, setQInput] = useState<string>('');

  const wordObj =
    INSIDER_WORDS.find((w) => w.id === gameData.wordId) || INSIDER_WORDS[0];
  const secretWord = lang === 'ar' ? wordObj.word_ar : wordObj.word_en;

  const judge = players.find((p) => p.id === gameData.judgeId) || players[0];
  const suspects =
    players.length > 1 ? players.filter((p) => p.id !== judge?.id) : players;
  const insider = players.find((p) => p.id === gameData.insiderId);

  const viewerId = isPassAndPlay
    ? players[localViewerIdx]?.id || myPlayerId
    : myPlayerId;
  const viewer = players.find((p) => p.id === viewerId);

  const viewerIsJudge = viewerId === judge?.id;
  const viewerIsInsider = viewerId === gameData.insiderId && !viewerIsJudge;
  const isOnlineJudge = isPassAndPlay || myPlayerId === judge?.id;

  // 2-minute countdown during 'questioning'
  useEffect(() => {
    if (gameData.phase !== 'questioning') {
      setSecLeft(gameData.durationSec || 120);
      return;
    }

    const tick = () => {
      const elapsed = Math.floor((Date.now() - (gameData.startedAt || Date.now())) / 1000);
      const rem = Math.max(0, (gameData.durationSec || 120) - elapsed);
      setSecLeft(rem);
      if (rem <= 0 && (isOnlineJudge || isHost)) {
        onUpdateGameData({
          ...gameData,
          phase: 'timeout',
        });
      }
    };

    tick();
    const t = setInterval(tick, 500);
    return () => clearInterval(t);
  }, [gameData.phase, gameData.startedAt, gameData.durationSec]);

  const handleStartCountdown = () => {
    setPeekRole(false);
    onUpdateGameData({
      ...gameData,
      phase: 'questioning',
      startedAt: Date.now(),
      questions: [],
    });
  };

  const handleAskOrGuess = (e: React.FormEvent) => {
    e.preventDefault();
    const raw = qInput.trim();
    if (!raw) return;
    setQInput('');

    // Auto-check if they typed the exact secret word!
    const clean = normStr(raw);
    if (clean === normStr(wordObj.word_ar) || clean === normStr(wordObj.word_en)) {
      onUpdateGameData({
        ...gameData,
        solverId: viewerId,
        phase: 'trial',
      });
      return;
    }

    const entry: InsiderQuestionEntry = {
      id: Math.random().toString(36).slice(2, 8),
      authorId: viewerId,
      text: raw,
    };

    onUpdateGameData({
      ...gameData,
      questions: [...(gameData.questions || []), entry],
    });
  };

  const handleJudgeReply = (qId: string, reply: 'yes' | 'no' | 'maybe') => {
    const updated = (gameData.questions || []).map((q) =>
      q.id === qId ? { ...q, reply } : q
    );
    onUpdateGameData({
      ...gameData,
      questions: updated,
    });
  };

  const handleWordSolvedBy = (solverId: string) => {
    onUpdateGameData({
      ...gameData,
      solverId,
      phase: 'trial',
    });
  };

  const handleVoteInsider = (suspectId: string) => {
    const nextVotes = {
      ...(gameData.votes || {}),
      [viewerId]: suspectId,
    };

    if (isPassAndPlay && localViewerIdx + 1 < players.length) {
      setLocalViewerIdx(localViewerIdx + 1);
      onUpdateGameData({ ...gameData, votes: nextVotes });
      return;
    }

    const allVoted = players.every((p) => Boolean(nextVotes[p.id]));
    if (allVoted) {
      resolveTrial(nextVotes);
    } else {
      onUpdateGameData({ ...gameData, votes: nextVotes });
    }
  };

  const resolveTrial = (finalVotes: Record<string, string>) => {
    const counts: Record<string, number> = {};
    Object.values(finalVotes).forEach((sid) => {
      counts[sid] = (counts[sid] || 0) + 1;
    });

    let topCount = 0;
    let topSuspects: string[] = [];
    Object.entries(counts).forEach(([sid, c]) => {
      if (c > topCount) {
        topCount = c;
        topSuspects = [sid];
      } else if (c === topCount) {
        topSuspects.push(sid);
      }
    });

    const caught = topSuspects.length === 1 && topSuspects[0] === gameData.insiderId;
    const awards: Record<string, number> = {};

    if (caught) {
      players.forEach((p) => {
        if (p.id !== gameData.insiderId) {
          awards[p.id] = 2;
        }
      });
    } else if (gameData.insiderId) {
      awards[gameData.insiderId] = 4;
    }

    onUpdateGameData(
      {
        ...gameData,
        votes: finalVotes,
        caughtInsider: caught,
        phase: 'reveal',
      },
      awards
    );
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="cartoon-card bg-[#f15bb5] text-white p-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs font-extrabold uppercase text-[#ffca3a] flex items-center gap-1.5">
            <Detective weight="fill" className="w-4 h-4" />
            <span>
              {lang === 'ar'
                ? `العميل الداخلي — التصنيف: ${wordObj.category_ar}`
                : `The Insider — Category: ${wordObj.category_en}`}
            </span>
          </div>
          <h2 className="text-2xl font-extrabold mt-0.5 flex items-center gap-2">
            <Gavel weight="fill" className="w-6 h-6 text-[#ffca3a]" />
            <span>
              {lang === 'ar'
                ? `حَكَم الجولة: ${judge?.name || ''}`
                : `Round Judge: ${judge?.name || ''}`}
            </span>
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {gameData.phase === 'questioning' && (
            <span
              className={`cartoon-badge px-4 py-1.5 text-lg flex items-center gap-1.5 ${
                secLeft <= 20
                  ? 'bg-[#ffca3a] text-[#161426] animate-bounce'
                  : 'bg-[#161426] text-[#ffca3a]'
              }`}
            >
              <Timer weight="fill" className="w-5 h-5" />
              <span>{secLeft}s</span>
            </span>
          )}

          {(isHost || isPassAndPlay) && (
            <button
              type="button"
              onClick={() => {
                setLocalViewerIdx(0);
                setPeekRole(!isPassAndPlay);
                onStartNewRound();
              }}
              className="cartoon-btn bg-white text-[#161426] px-3 py-2 text-xs flex items-center gap-1"
            >
              <ArrowsClockwise weight="bold" className="w-4 h-4" />
              <span>{lang === 'ar' ? 'جولة جديدة' : 'New Round'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Pass & Play Player Selector */}
      {isPassAndPlay && (gameData.phase === 'role_peek' || gameData.phase === 'trial') && (
        <div className="cartoon-panel-dark p-3.5 flex flex-wrap items-center justify-between gap-2">
          <span className="text-sm font-extrabold text-[#ffca3a]">
            {lang === 'ar' ? `اللاعب الحالي: ${viewer?.name}` : `Current Player: ${viewer?.name}`}
          </span>
          <div className="flex flex-wrap gap-1.5">
            {players.map((p, idx) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setPeekRole(false);
                  setLocalViewerIdx(idx);
                }}
                className={`cartoon-badge px-3 py-1 text-xs cursor-pointer ${
                  idx === localViewerIdx ? 'bg-[#00bbf9] text-[#161426]' : 'bg-[#191636] text-white'
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Secret Role Peek Card */}
      {(gameData.phase === 'role_peek' || gameData.phase === 'questioning') && (
        <div className="cartoon-card p-5 space-y-3 text-center">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="font-extrabold text-sm text-[#161426]">
              {lang === 'ar'
                ? `الهوية السرية الخاصة بـ (${viewer?.name || ''}):`
                : `Secret Role for (${viewer?.name || ''}):`}
            </span>
            <button
              type="button"
              onClick={() => setPeekRole(!peekRole)}
              className="cartoon-btn bg-[#ffca3a] text-[#161426] px-4 py-1.5 text-xs flex items-center gap-1.5"
            >
              {peekRole ? <EyeSlash className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              <span>
                {peekRole
                  ? lang === 'ar'
                    ? 'إخفاء دوري السري'
                    : 'Hide Role'
                  : lang === 'ar'
                  ? 'اكشف دوري بالسر'
                  : 'Peek My Role'}
              </span>
            </button>
          </div>

          {peekRole && (
            <div
              className={`p-4 rounded-2xl border-4 border-[#161426] animate-in zoom-in-95 duration-150 ${
                viewerIsInsider
                  ? 'bg-[#ff595e] text-white'
                  : viewerIsJudge
                  ? 'bg-[#ffca3a] text-[#161426]'
                  : 'bg-[#e0f2fe] text-[#161426]'
              }`}
            >
              {viewerIsJudge ? (
                <div className="space-y-1">
                  <div className="text-xs font-extrabold uppercase">
                    {lang === 'ar' ? 'أنت الحَكَم — أجب بـ (نعم / لا) فقط!' : 'You are the JUDGE!'}
                  </div>
                  <div className="text-3xl font-extrabold">{secretWord}</div>
                </div>
              ) : viewerIsInsider ? (
                <div className="space-y-1">
                  <div className="text-sm font-extrabold uppercase text-[#ffca3a]">
                    {lang === 'ar'
                      ? 'أنت العميل الداخلي السري!!'
                      : 'YOU ARE THE SECRET INSIDER!!'}
                  </div>
                  <div className="text-3xl font-extrabold">{secretWord}</div>
                  <p className="text-xs font-bold opacity-95">
                    {lang === 'ar'
                      ? 'اسأل أسئلة ذكية تقود الشلّة لحزر الكلمة قبل الوقت بدون ما يشكّوا فيك!'
                      : 'Subtly steer the group to guess the word in time without getting caught!'}
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="text-xl font-extrabold">
                    {lang === 'ar' ? 'أنت مواطن محقّق!' : 'You are a Citizen!'}
                  </div>
                  <p className="text-xs font-bold text-[#3f3b5c]">
                    {lang === 'ar'
                      ? 'اسأل الحَكم أسئلة (نعم / لا) لتعرف الكلمة السرية، وراقب مين عم يغشّشكم بالخفاء!'
                      : 'Ask Yes/No questions to find the secret word, and watch who knows too much!'}
                  </p>
                </div>
              )}
            </div>
          )}

          {gameData.phase === 'role_peek' &&
            (isOnlineJudge || isHost ? (
              <button
                type="button"
                onClick={handleStartCountdown}
                className="cartoon-btn bg-[#8ac926] text-[#161426] w-full py-3.5 text-xl flex items-center justify-center gap-2"
              >
                <Play weight="fill" className="w-6 h-6" />
                <span>
                  {lang === 'ar'
                    ? 'الكل شاف دوره! ابدأ عدّاد الـ 120 ثانية!'
                    : 'Everyone Saw Their Role — Start 120s Timer!'}
                </span>
              </button>
            ) : (
              <div className="text-sm font-extrabold text-[#3f3b5c]">
                {lang === 'ar'
                  ? `بانتظار الحَكم (${judge?.name}) ليبدأ العدّاد...`
                  : `Waiting for Judge (${judge?.name}) to start timer...`}
              </div>
            ))}
        </div>
      )}

      {/* PHASE 2: LIVE YES/NO QUESTIONING */}
      {gameData.phase === 'questioning' && (
        <div className="cartoon-card p-5 space-y-4">
          {/* Question & Guess Input */}
          {(!viewerIsJudge || isPassAndPlay) && (
            <form onSubmit={handleAskOrGuess} className="flex gap-2">
              <input
                type="text"
                maxLength={80}
                value={qInput}
                onChange={(e) => setQInput(e.target.value)}
                placeholder={
                  lang === 'ar'
                    ? 'اسأل سؤال (نعم/لا) أو اكتب الكلمة السرية مباشرة...'
                    : 'Ask a Yes/No question or type the exact Secret Word...'
                }
                className="cartoon-input min-w-0 flex-1 px-4 py-2.5 bg-white text-[#161426]"
              />
              <button
                type="submit"
                className="cartoon-btn bg-[#00bbf9] text-[#161426] px-5 py-2.5 flex items-center gap-1.5 shrink-0"
              >
                <PaperPlaneTilt weight="fill" className="w-5 h-5" />
                <span>{lang === 'ar' ? 'إرسال' : 'Ask'}</span>
              </button>
            </form>
          )}

          {/* Q&A Feed */}
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {(gameData.questions || []).map((q) => {
              const author = players.find((p) => p.id === q.authorId);
              return (
                <div
                  key={q.id}
                  className="p-3 rounded-2xl bg-white border-3 border-[#161426] flex flex-wrap items-center justify-between gap-2"
                >
                  <div className="font-extrabold text-sm text-[#161426]">
                    <span className="text-[#f15bb5]">{author?.name}: </span>
                    <span>{q.text}</span>
                  </div>

                  {q.reply ? (
                    <span
                      className={`cartoon-badge px-3 py-0.5 text-xs ${
                        q.reply === 'yes'
                          ? 'bg-[#8ac926] text-[#161426]'
                          : q.reply === 'no'
                          ? 'bg-[#ff595e] text-white'
                          : 'bg-[#ffca3a] text-[#161426]'
                      }`}
                    >
                      {q.reply === 'yes'
                        ? lang === 'ar'
                          ? '✓ نعم'
                          : '✓ YES'
                        : q.reply === 'no'
                        ? lang === 'ar'
                          ? '✗ لا'
                          : '✗ NO'
                        : lang === 'ar'
                        ? '؟ ما خصه'
                        : '? Maybe'}
                    </span>
                  ) : isOnlineJudge ? (
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => handleJudgeReply(q.id, 'yes')}
                        className="cartoon-btn bg-[#8ac926] text-[#161426] px-2.5 py-1 text-xs flex items-center gap-1"
                      >
                        <CheckCircle weight="fill" className="w-3.5 h-3.5" />
                        <span>{lang === 'ar' ? 'نعم' : 'Yes'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleJudgeReply(q.id, 'no')}
                        className="cartoon-btn bg-[#ff595e] text-white px-2.5 py-1 text-xs flex items-center gap-1"
                      >
                        <XCircle weight="fill" className="w-3.5 h-3.5" />
                        <span>{lang === 'ar' ? 'لا' : 'No'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleJudgeReply(q.id, 'maybe')}
                        className="cartoon-btn bg-[#ffca3a] text-[#161426] px-2.5 py-1 text-xs flex items-center gap-1"
                      >
                        <Question weight="fill" className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs font-bold text-gray-400">...</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Judge Quick Button if someone guessed it verbally! */}
          {isOnlineJudge && (
            <div className="pt-3 border-t-3 border-[#161426]/15 space-y-2">
              <div className="text-xs font-extrabold text-[#3f3b5c]">
                {lang === 'ar'
                  ? 'حدا حزر الكلمة بالصوت؟ اضغط ع اسمه لننتقل لمحاكمة العميل الداخلي:'
                  : 'Someone guessed the word out loud? Click who solved it:'}
              </div>
              <div className="flex flex-wrap gap-2">
                {suspects.map((sp) => (
                  <button
                    key={sp.id}
                    type="button"
                    onClick={() => handleWordSolvedBy(sp.id)}
                    className="cartoon-btn bg-[#8ac926] text-[#161426] px-3.5 py-1.5 text-xs"
                  >
                    ✓ {sp.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* PHASE 3: INSIDER TRIAL VOTE */}
      {gameData.phase === 'trial' && (
        <div className="cartoon-card p-6 space-y-4 text-center">
          <div className="inline-block cartoon-badge bg-[#8ac926] text-[#161426] px-4 py-1 text-xs">
            {lang === 'ar'
              ? `لقيتوا الكلمة بالوقت (${secretWord})!`
              : `Word Solved in Time (${secretWord})!`}
          </div>

          <h3 className="text-2xl font-extrabold text-[#161426]">
            {lang === 'ar'
              ? 'الآن وقت المحاكمة: مين كان "العميل الداخلي" اللي يعرف الكلمة ووجّهكم بالخفاء؟'
              : 'Trial Time: Who among you was the secret INSIDER steering the group?'}
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
            {suspects.map((sp) => {
              const myV = gameData.votes?.[viewerId] === sp.id;
              return (
                <button
                  key={sp.id}
                  type="button"
                  onClick={() => handleVoteInsider(sp.id)}
                  className={`cartoon-btn p-3.5 text-base flex items-center justify-between ${
                    myV ? 'bg-[#ff595e] text-white' : 'bg-white text-[#161426]'
                  }`}
                >
                  <span className="truncate">{sp.name}</span>
                  {myV && <CheckCircle weight="fill" className="w-5 h-5 shrink-0" />}
                </button>
              );
            })}
          </div>

          {isHost && Object.keys(gameData.votes || {}).length > 0 && (
            <button
              type="button"
              onClick={() => resolveTrial(gameData.votes || {})}
              className="cartoon-btn bg-[#ffca3a] text-[#161426] w-full py-2.5 text-sm"
            >
              {lang === 'ar' ? 'اكشف هوية العميل الداخلي الآن' : 'Unmask the Insider Now'}
            </button>
          )}
        </div>
      )}

      {/* TIMEOUT LOSS */}
      {gameData.phase === 'timeout' && (
        <div className="cartoon-card p-6 text-center space-y-3 bg-[#ffe4e6]">
          <h3 className="text-2xl font-extrabold text-[#ff595e]">
            {lang === 'ar'
              ? `انتهى الوقت وما عرفتوا الكلمة (${secretWord}) — خسر الجميع حتى العميل (${insider?.name})!`
              : `Time ran out for (${secretWord}) — Everyone lost, even Insider (${insider?.name})!`}
          </h3>
          <button
            type="button"
            onClick={onStartNewRound}
            className="cartoon-btn bg-[#ffca3a] text-[#161426] w-full py-3.5 text-xl"
          >
            {lang === 'ar' ? 'جولة جديدة' : 'Play Again'}
          </button>
        </div>
      )}

      {/* REVEAL */}
      {gameData.phase === 'reveal' && (
        <div className="cartoon-card p-6 text-center space-y-4 animate-in zoom-in-95 duration-200">
          <Trophy weight="fill" className="w-12 h-12 text-[#ffca3a] mx-auto" />
          <div className="text-sm font-extrabold text-[#3f3b5c]">
            {lang === 'ar'
              ? `الكلمة كانت (${secretWord}) — والعميل الداخلي الحقيقي هو: (${insider?.name})`
              : `Word: (${secretWord}) — Actual Insider: (${insider?.name})`}
          </div>

          <h3 className="text-2xl md:text-3xl font-extrabold text-[#161426]">
            {gameData.caughtInsider
              ? lang === 'ar'
                ? `كفو للمحققين! كشفتوا العميل الداخلي (${insider?.name}) وكسبتوا +2!`
                : `Citizens Win! You unmasked Insider (${insider?.name}) (+2 pts each)!`
              : lang === 'ar'
              ? `دهاء خارق! (${insider?.name}) خدعكم جميعاً وكسب +4 نقاط!`
              : `Mastermind! Insider (${insider?.name}) fooled the whole table (+4 pts)!`}
          </h3>

          <button
            type="button"
            onClick={onStartNewRound}
            className="cartoon-btn bg-[#8ac926] text-[#161426] w-full py-3.5 text-xl flex items-center justify-center gap-2"
          >
            <ArrowsClockwise weight="bold" className="w-6 h-6" />
            <span>{lang === 'ar' ? 'جولة عميل جديدة!' : 'Next Insider Round!'}</span>
          </button>
        </div>
      )}
    </div>
  );
};
