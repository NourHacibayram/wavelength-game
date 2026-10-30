import React, { useState } from 'react';
import { WITS_QUESTIONS } from '../data/extraGamesData';
import {
  Coins,
  PaperPlaneTilt,
  CheckCircle,
  Trophy,
  ArrowsClockwise,
  Sparkle,
  Lightbulb,
} from '@phosphor-icons/react';

export interface PlayerWager {
  goldSlotKey: string; // slot key = guessed number as string
  silverSlotKey: string;
}

export interface WitsGameState {
  phase: 'guessing' | 'betting' | 'reveal';
  questionId: number;
  guesses: Record<string, number>;
  bets: Record<string, PlayerWager>;
}

interface PlayerInfo {
  id: string;
  name: string;
  avatar_color: string;
  score: number;
}

interface WitsGameProps {
  gameData: WitsGameState;
  players: PlayerInfo[];
  myPlayerId: string;
  isHost: boolean;
  isPassAndPlay: boolean;
  lang: 'ar' | 'en';
  onUpdateGameData: (nextData: WitsGameState, scoreAwards?: Record<string, number>) => void;
  onStartNewRound: () => void;
}

export const WitsGame: React.FC<WitsGameProps> = ({
  gameData,
  players,
  myPlayerId,
  isHost,
  isPassAndPlay,
  lang,
  onUpdateGameData,
}) => {
  const [numInput, setNumInput] = useState<string>('');
  const [localIdx, setLocalIdx] = useState<number>(0);
  const [goldPick, setGoldPick] = useState<string>('');
  const [silverPick, setSilverPick] = useState<string>('');

  const q =
    WITS_QUESTIONS.find((item) => item.id === gameData.questionId) ||
    WITS_QUESTIONS[0];

  const viewerId = isPassAndPlay
    ? players[localIdx]?.id || myPlayerId
    : myPlayerId;
  const viewerPlayer = players.find((p) => p.id === viewerId);

  const hasGuessed = typeof gameData.guesses?.[viewerId] === 'number';
  const hasBet = Boolean(gameData.bets?.[viewerId]);

  // Group players by identical numeric guesses & sort ascending for the Casino Mat
  const sortedMatSlots = React.useMemo(() => {
    const map = new Map<number, string[]>();
    Object.entries(gameData.guesses || {}).forEach(([pid, val]) => {
      const n = Number(val);
      const arr = map.get(n) || [];
      arr.push(pid);
      map.set(n, arr);
    });
    const entries = Array.from(map.entries()).sort((a, b) => a[0] - b[0]);
    const mid = (entries.length - 1) / 2;
    return entries.map(([val, authorIds], idx) => {
      const distFromCenter = Math.round(Math.abs(idx - mid));
      const multiplier = distFromCenter >= 2 ? 3 : 2;
      return {
        key: String(val),
        value: val,
        authorIds,
        multiplier,
      };
    });
  }, [gameData.guesses]);

  const winningValue = React.useMemo(() => {
    if (sortedMatSlots.length === 0) return null;
    let minDiff = Infinity;
    sortedMatSlots.forEach((s) => {
      const diff = Math.abs(s.value - q.answer);
      if (diff < minDiff) minDiff = diff;
    });
    return minDiff;
  }, [sortedMatSlots, q.answer]);

  const handleSubmitGuess = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = Number(numInput.replace(/,/g, '').trim());
    if (Number.isNaN(parsed) || numInput.trim() === '') return;

    const nextGuesses = {
      ...(gameData.guesses || {}),
      [viewerId]: parsed,
    };
    setNumInput('');

    if (isPassAndPlay && localIdx + 1 < players.length) {
      setLocalIdx(localIdx + 1);
      onUpdateGameData({ ...gameData, guesses: nextGuesses });
      return;
    }

    const allIn = players.every((p) => typeof nextGuesses[p.id] === 'number');
    if (allIn) {
      setLocalIdx(0);
      onUpdateGameData({
        ...gameData,
        guesses: nextGuesses,
        phase: 'betting',
      });
    } else {
      onUpdateGameData({
        ...gameData,
        guesses: nextGuesses,
      });
    }
  };

  const handleLockWagers = () => {
    const gSlot = goldPick || sortedMatSlots[0]?.key || '0';
    const sSlot = silverPick || gSlot;

    const nextBets: Record<string, PlayerWager> = {
      ...(gameData.bets || {}),
      [viewerId]: { goldSlotKey: gSlot, silverSlotKey: sSlot },
    };
    setGoldPick('');
    setSilverPick('');

    if (isPassAndPlay && localIdx + 1 < players.length) {
      setLocalIdx(localIdx + 1);
      onUpdateGameData({ ...gameData, bets: nextBets });
      return;
    }

    const allBet = players.every((p) => Boolean(nextBets[p.id]));
    if (allBet) {
      payoutAndReveal(nextBets);
    } else {
      onUpdateGameData({ ...gameData, bets: nextBets });
    }
  };

  const payoutAndReveal = (finalBets: Record<string, PlayerWager>) => {
    const awards: Record<string, number> = {};
    if (winningValue !== null) {
      const winningSlots = sortedMatSlots.filter(
        (s) => Math.abs(s.value - q.answer) === winningValue
      );
      const winningKeys = new Set(winningSlots.map((s) => s.key));

      // +3 bonus to author(s) of closest guess!
      winningSlots.forEach((ws) => {
        ws.authorIds.forEach((aid) => {
          awards[aid] = (awards[aid] || 0) + 3;
        });
      });

      // Payout chips!
      Object.entries(finalBets).forEach(([pid, wager]) => {
        const gSlotObj = sortedMatSlots.find((s) => s.key === wager.goldSlotKey);
        const sSlotObj = sortedMatSlots.find((s) => s.key === wager.silverSlotKey);
        if (winningKeys.has(wager.goldSlotKey) && gSlotObj) {
          awards[pid] = (awards[pid] || 0) + gSlotObj.multiplier;
        }
        if (winningKeys.has(wager.silverSlotKey) && sSlotObj) {
          awards[pid] = (awards[pid] || 0) + 1;
        }
      });
    }

    onUpdateGameData(
      {
        ...gameData,
        bets: finalBets,
        phase: 'reveal',
      },
      awards
    );
  };

  const handleNextTrivia = () => {
    const others = WITS_QUESTIONS.filter((item) => item.id !== q.id);
    const nextQ = others[Math.floor(Math.random() * others.length)] || WITS_QUESTIONS[0];
    setLocalIdx(0);
    setGoldPick('');
    setSilverPick('');
    setNumInput('');
    onUpdateGameData({
      phase: 'guessing',
      questionId: nextQ.id,
      guesses: {},
      bets: {},
    });
  };

  return (
    <div className="space-y-4">
      {/* Question Card */}
      <div className="cartoon-card bg-[#ffca3a] text-[#161426] p-5 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <span className="cartoon-badge bg-[#161426] text-[#ffca3a] px-3.5 py-1 text-xs flex items-center gap-1.5">
            <Coins weight="fill" className="w-4 h-4" />
            <span>
              {lang === 'ar'
                ? 'مزايدة التخمين — خمّن وراهن ع أقرب جواب!'
                : 'Wits & Wagers — Guess & Bet Your Chips!'}
            </span>
          </span>

          {(isHost || isPassAndPlay) && (
            <button
              type="button"
              onClick={handleNextTrivia}
              className="cartoon-btn bg-white text-[#161426] px-3 py-1.5 text-xs flex items-center gap-1"
            >
              <ArrowsClockwise weight="bold" className="w-4 h-4" />
              <span>{lang === 'ar' ? 'سؤال آخر' : 'Next Q'}</span>
            </button>
          )}
        </div>

        <h2 className="text-xl md:text-2xl font-extrabold leading-snug">
          {lang === 'ar' ? q.question_ar : q.question_en}
        </h2>
      </div>

      {/* PHASE 1: SECRET NUMERIC GUESSING */}
      {gameData.phase === 'guessing' && (
        <div className="cartoon-card p-6 text-center space-y-4">
          {isPassAndPlay && (
            <div className="inline-flex items-center gap-2 cartoon-badge bg-[#00bbf9] text-[#161426] px-4 py-1 text-sm">
              <Sparkle weight="fill" className="w-4 h-4" />
              <span>
                {lang === 'ar'
                  ? `دور (${viewerPlayer?.name}) لكتابة تخمينه السري`
                  : `${viewerPlayer?.name}’s Secret Guess`}
              </span>
            </div>
          )}

          {!hasGuessed || isPassAndPlay ? (
            <form onSubmit={handleSubmitGuess} className="max-w-md mx-auto space-y-3">
              <label className="block font-extrabold text-sm text-[#3f3b5c]">
                {lang === 'ar'
                  ? `اكتب توقعك الرقمي (${q.unit_ar}) بدون ما يشوفه حدا:`
                  : `Enter your secret numeric guess (${q.unit_en}):`}
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  step="any"
                  required
                  value={numInput}
                  onChange={(e) => setNumInput(e.target.value)}
                  placeholder="0"
                  className="cartoon-input min-w-0 flex-1 px-4 py-3 bg-white text-[#161426] text-2xl text-center font-extrabold"
                />
                <button
                  type="submit"
                  className="cartoon-btn bg-[#8ac926] text-[#161426] px-6 py-3 text-lg flex items-center gap-2 shrink-0"
                >
                  <PaperPlaneTilt weight="fill" className="w-5 h-5" />
                  <span>{lang === 'ar' ? 'قفل الرقم' : 'Lock In'}</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-3 py-3">
              <div className="text-xl font-extrabold text-[#38b000]">
                {lang === 'ar'
                  ? 'تم قفل رقمك السري! بانتظار البقية لفرش طاولة الرهان...'
                  : 'Your secret number is locked! Waiting for others...'}
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                {players.map((p) => {
                  const done = typeof gameData.guesses?.[p.id] === 'number';
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
              {isHost && Object.keys(gameData.guesses || {}).length > 0 && (
                <button
                  type="button"
                  onClick={() => onUpdateGameData({ ...gameData, phase: 'betting' })}
                  className="cartoon-btn bg-[#00bbf9] text-[#161426] px-4 py-2 text-xs"
                >
                  {lang === 'ar' ? 'افتح طاولة المزايدة بمن جاوب' : 'Start Betting Now'}
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* PHASE 2 & 3: GREEN CARTOON CASINO BETTING MAT */}
      {(gameData.phase === 'betting' || gameData.phase === 'reveal') && (
        <div className="rounded-3xl bg-[#065f46] border-4 border-[#161426] shadow-[0_8px_0_#161426] p-5 text-white space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="font-extrabold text-lg text-[#ffca3a]">
                {gameData.phase === 'betting'
                  ? isPassAndPlay
                    ? lang === 'ar'
                      ? `دور (${viewerPlayer?.name}): وزّع فيشتك الذهبية والفضية ع أقرب تخمين!`
                      : `${viewerPlayer?.name}: Place your Gold & Silver chips!`
                    : lang === 'ar'
                    ? 'طاولة المزايدة: وزّع فيشتك الذهبية والفضية ع الرقم اللي بتتوقعه الأقرب!'
                    : 'Betting Mat: Place your Gold & Silver chips on the closest guess!'
                  : lang === 'ar'
                  ? 'نتيجة المزايدة والجواب الحقيقي!'
                  : 'Answer & Payouts Revealed!'}
              </h3>
            </div>

            {gameData.phase === 'betting' &&
              isHost &&
              Object.keys(gameData.bets || {}).length > 0 && (
                <button
                  type="button"
                  onClick={() => payoutAndReveal(gameData.bets || {})}
                  className="cartoon-btn bg-[#ffca3a] text-[#161426] px-3.5 py-1.5 text-xs"
                >
                  {lang === 'ar' ? 'اكشف الجواب الحقيقي الآن' : 'Reveal Answer Now'}
                </button>
              )}
          </div>

          {/* Sorted Guess Cards on the Casino Mat */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {sortedMatSlots.map((slot) => {
              const isWinner =
                gameData.phase === 'reveal' &&
                winningValue !== null &&
                Math.abs(slot.value - q.answer) === winningValue;

              const authorNames = slot.authorIds
                .map((id) => players.find((p) => p.id === id)?.name || '?')
                .join(' + ');

              const isGoldHere = goldPick === slot.key;
              const isSilverHere = silverPick === slot.key;

              // Who bet on this slot
              const bettorsOnSlot = Object.entries(gameData.bets || {}).filter(
                ([, w]) => w.goldSlotKey === slot.key || w.silverSlotKey === slot.key
              );

              return (
                <div
                  key={slot.key}
                  className={`p-4 rounded-2xl border-4 border-[#161426] transition-all flex flex-col justify-between space-y-3 ${
                    isWinner
                      ? 'bg-[#ffca3a] text-[#161426] ring-4 ring-white scale-102'
                      : 'bg-[#fff9ec] text-[#161426]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="cartoon-badge bg-[#161426] text-[#ffca3a] px-2.5 py-0.5 text-xs">
                      {lang === 'ar' ? `مضاعف ×${slot.multiplier}` : `Payout ×${slot.multiplier}`}
                    </span>
                    <span className="text-xs font-extrabold text-[#3f3b5c] truncate max-w-[120px]">
                      {authorNames}
                    </span>
                  </div>

                  <div className="text-center py-1">
                    <div className="text-3xl font-extrabold">
                      {slot.value.toLocaleString()}
                    </div>
                    <div className="text-xs font-bold opacity-75">
                      {lang === 'ar' ? q.unit_ar : q.unit_en}
                    </div>
                  </div>

                  {/* Chip Placement Buttons */}
                  {gameData.phase === 'betting' && (!hasBet || isPassAndPlay) && (
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => setGoldPick(slot.key)}
                        className={`cartoon-btn py-1.5 px-2 text-xs flex items-center justify-center gap-1 ${
                          isGoldHere
                            ? 'bg-[#ffca3a] text-[#161426] ring-2 ring-[#ff595e]'
                            : 'bg-white text-[#161426]'
                        }`}
                      >
                        <Coins weight="fill" className="w-4 h-4 text-[#d97706]" />
                        <span>{lang === 'ar' ? 'ذهبية' : 'Gold'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSilverPick(slot.key)}
                        className={`cartoon-btn py-1.5 px-2 text-xs flex items-center justify-center gap-1 ${
                          isSilverHere
                            ? 'bg-[#cbd5e1] text-[#161426] ring-2 ring-[#1982c4]'
                            : 'bg-white text-[#161426]'
                        }`}
                      >
                        <Coins weight="fill" className="w-4 h-4 text-[#64748b]" />
                        <span>{lang === 'ar' ? 'فضية' : 'Silver'}</span>
                      </button>
                    </div>
                  )}

                  {/*Placed Chips Badges */}
                  {bettorsOnSlot.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1 border-t-2 border-[#161426]/10">
                      {bettorsOnSlot.map(([bId, w]) => {
                        const bp = players.find((p) => p.id === bId);
                        const both =
                          w.goldSlotKey === slot.key && w.silverSlotKey === slot.key;
                        return (
                          <span
                            key={bId}
                            className="text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-[#161426] text-[#ffca3a]"
                          >
                            {bp?.name} {both ? '(2)' : ''}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {gameData.phase === 'betting' && (
            !hasBet || isPassAndPlay ? (
              <button
                type="button"
                disabled={!goldPick && !silverPick}
                onClick={handleLockWagers}
                className="cartoon-btn bg-[#8ac926] text-[#161426] w-full py-3.5 text-xl flex items-center justify-center gap-2"
              >
                <CheckCircle weight="fill" className="w-6 h-6" />
                <span>
                  {lang === 'ar' ? 'تثبيت فيشات الرهان!' : 'Lock My Betting Chips!'}
                </span>
              </button>
            ) : (
              <div className="text-center font-extrabold text-base text-[#ffca3a]">
                {lang === 'ar'
                  ? 'تم تثبيت رهانك! بانتظار باقي المقامرين...'
                  : 'Chips placed! Waiting for others...'}
              </div>
            )
          )}

          {/* DRAMATIC ANSWER REVEAL */}
          {gameData.phase === 'reveal' && (
            <div className="p-5 rounded-3xl bg-[#191636] border-4 border-[#161426] text-center space-y-3 animate-in zoom-in-95 duration-200">
              <div className="inline-flex items-center gap-1.5 cartoon-badge bg-[#8ac926] text-[#161426] px-4 py-1 text-xs">
                <Trophy weight="fill" className="w-4 h-4" />
                <span>{lang === 'ar' ? 'الإجابة الدقيقة الحقيقية' : 'Exact True Answer'}</span>
              </div>

              <div className="text-4xl md:text-5xl font-extrabold text-[#ffca3a]">
                {q.answer.toLocaleString()}{' '}
                <span className="text-xl text-[#00bbf9]">
                  {lang === 'ar' ? q.unit_ar : q.unit_en}
                </span>
              </div>

              <p className="text-sm font-bold text-[#d9d4f7] flex items-center justify-center gap-1.5 max-w-lg mx-auto">
                <Lightbulb weight="fill" className="w-5 h-5 text-[#ffca3a] shrink-0" />
                <span>{lang === 'ar' ? q.fact_ar : q.fact_en}</span>
              </p>

              <button
                type="button"
                onClick={handleNextTrivia}
                className="cartoon-btn bg-[#ffca3a] text-[#161426] w-full py-3.5 text-xl flex items-center justify-center gap-2 mt-2"
              >
                <ArrowsClockwise weight="bold" className="w-6 h-6" />
                <span>{lang === 'ar' ? 'سؤال مزايدة جديد!' : 'Next Wager Question!'}</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
