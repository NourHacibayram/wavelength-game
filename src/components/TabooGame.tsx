import React, { useState, useEffect } from 'react';
import { TABOO_CARDS } from '../data/extraGamesData';
import {
  Play,
  CheckCircle,
  Prohibit,
  SkipForward,
  Timer,
  ArrowsClockwise,
  Eye,
  EyeSlash,
  PaperPlaneTilt,
  BellRinging,
  Trophy,
  Microphone,
} from '@phosphor-icons/react';

export interface TabooGameState {
  phase: 'ready' | 'playing' | 'summary';
  describerId: string;
  watcherId: string;
  currentCardId: number;
  usedCardIds: number[];
  roundStartedAt: number;
  durationSec: number;
  correctWords: string[];
  buzzedWords: string[];
  skippedCount: number;
  lastGuesserName?: string;
}

interface PlayerInfo {
  id: string;
  name: string;
  avatar_color: string;
  score: number;
}

interface TabooGameProps {
  gameData: TabooGameState;
  players: PlayerInfo[];
  myPlayerId: string;
  isHost: boolean;
  isPassAndPlay: boolean;
  lang: 'ar' | 'en';
  onUpdateGameData: (nextData: TabooGameState, scoreAwards?: Record<string, number>) => void;
  onStartNewRound: () => void;
}

function normText(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/\s*\(.*?\)\s*/g, '')
    .trim();
}

export const TabooGame: React.FC<TabooGameProps> = ({
  gameData,
  players,
  myPlayerId,
  isHost,
  isPassAndPlay,
  lang,
  onUpdateGameData,
  onStartNewRound,
}) => {
  const [secondsLeft, setSecondsLeft] = useState<number>(gameData.durationSec || 60);
  const [localShowCard, setLocalShowCard] = useState<boolean>(!isPassAndPlay);
  const [guessInput, setGuessInput] = useState<string>('');
  const [wrongGuessFlash, setWrongGuessFlash] = useState<string | null>(null);

  const describer = players.find((p) => p.id === gameData.describerId) || players[0];
  const watcher =
    players.find((p) => p.id === gameData.watcherId && p.id !== describer?.id) ||
    players.find((p) => p.id !== describer?.id);

  const isDescriber = isPassAndPlay ? true : myPlayerId === describer?.id;
  const isWatcher = !isPassAndPlay && myPlayerId === watcher?.id;
  const canSeeTabooCard = isPassAndPlay ? localShowCard : isDescriber || isWatcher;

  const currentCard =
    TABOO_CARDS.find((c) => c.id === gameData.currentCardId) || TABOO_CARDS[0];

  const pickNextUnusedCardId = (used: number[]): number => {
    const remaining = TABOO_CARDS.filter((c) => !used.includes(c.id));
    const pool = remaining.length > 0 ? remaining : TABOO_CARDS;
    return pool[Math.floor(Math.random() * pool.length)].id;
  };

  // Live countdown timer during 'playing'
  useEffect(() => {
    if (gameData.phase !== 'playing') {
      setSecondsLeft(gameData.durationSec || 60);
      return;
    }

    const tick = () => {
      const elapsed = Math.floor((Date.now() - (gameData.roundStartedAt || Date.now())) / 1000);
      const rem = Math.max(0, (gameData.durationSec || 60) - elapsed);
      setSecondsLeft(rem);
      if (rem <= 0 && (isDescriber || isHost)) {
        finishTurn(gameData);
      }
    };

    tick();
    const timer = setInterval(tick, 500);
    return () => clearInterval(timer);
  }, [gameData.phase, gameData.roundStartedAt, gameData.durationSec]);

  const finishTurn = (stateSnapshot: TabooGameState) => {
    if (stateSnapshot.phase === 'summary') return;
    const netScore = Math.max(
      0,
      (stateSnapshot.correctWords?.length || 0) * 2 - (stateSnapshot.buzzedWords?.length || 0)
    );
    const awards: Record<string, number> = {};
    if (netScore > 0 && describer) {
      awards[describer.id] = netScore;
    }
    onUpdateGameData(
      {
        ...stateSnapshot,
        phase: 'summary',
      },
      awards
    );
  };

  const handleStartTimer = () => {
    const firstId = pickNextUnusedCardId(gameData.usedCardIds || []);
    setLocalShowCard(true);
    onUpdateGameData({
      ...gameData,
      phase: 'playing',
      currentCardId: firstId,
      usedCardIds: [...(gameData.usedCardIds || []), firstId],
      roundStartedAt: Date.now(),
      correctWords: [],
      buzzedWords: [],
      skippedCount: 0,
      lastGuesserName: undefined,
    });
  };

  const handleGotIt = (guesserId?: string) => {
    const wordLabel = lang === 'ar' ? currentCard.word_ar : currentCard.word_en;
    const nextUsed = [...(gameData.usedCardIds || []), currentCard.id];
    const nextId = pickNextUnusedCardId(nextUsed);
    const guesser = guesserId ? players.find((p) => p.id === guesserId) : undefined;
    const bonusAwards = guesserId ? { [guesserId]: 1 } : undefined;

    onUpdateGameData(
      {
        ...gameData,
        currentCardId: nextId,
        usedCardIds: nextUsed,
        correctWords: [...(gameData.correctWords || []), wordLabel],
        lastGuesserName: guesser?.name,
      },
      bonusAwards
    );
  };

  const handleTabooBuzzer = () => {
    const wordLabel = lang === 'ar' ? currentCard.word_ar : currentCard.word_en;
    const nextUsed = [...(gameData.usedCardIds || []), currentCard.id];
    const nextId = pickNextUnusedCardId(nextUsed);
    const watcherBonus = watcher && !isPassAndPlay ? { [watcher.id]: 1 } : undefined;

    onUpdateGameData(
      {
        ...gameData,
        currentCardId: nextId,
        usedCardIds: nextUsed,
        buzzedWords: [...(gameData.buzzedWords || []), wordLabel],
      },
      watcherBonus
    );
  };

  const handleSkipCard = () => {
    const nextUsed = [...(gameData.usedCardIds || []), currentCard.id];
    const nextId = pickNextUnusedCardId(nextUsed);
    onUpdateGameData({
      ...gameData,
      currentCardId: nextId,
      usedCardIds: nextUsed,
      skippedCount: (gameData.skippedCount || 0) + 1,
    });
  };

  const handleTextGuessSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = guessInput.trim();
    if (!trimmed) return;

    const targetAr = normText(currentCard.word_ar);
    const targetEn = normText(currentCard.word_en);
    const cleaned = normText(trimmed);

    if (cleaned === targetAr || cleaned === targetEn) {
      setGuessInput('');
      setWrongGuessFlash(null);
      handleGotIt(myPlayerId);
    } else {
      setWrongGuessFlash(trimmed);
      setGuessInput('');
      setTimeout(() => setWrongGuessFlash(null), 1600);
    }
  };

  const handleRotateNextDescriber = () => {
    const idx = players.findIndex((p) => p.id === gameData.describerId);
    const nextDescriber = players[(idx + 1) % Math.max(1, players.length)] || players[0];
    const nextWatcher =
      players[(idx + 2) % Math.max(1, players.length)] || nextDescriber;

    onUpdateGameData({
      phase: 'ready',
      describerId: nextDescriber.id,
      watcherId: nextWatcher.id,
      currentCardId: pickNextUnusedCardId(gameData.usedCardIds || []),
      usedCardIds: gameData.usedCardIds || [],
      roundStartedAt: Date.now(),
      durationSec: 60,
      correctWords: [],
      buzzedWords: [],
      skippedCount: 0,
    });
  };

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="cartoon-card bg-[#ff595e] text-white p-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs font-extrabold uppercase text-[#ffca3a] flex items-center gap-1.5">
            <Prohibit weight="bold" className="w-4 h-4" />
            <span>
              {lang === 'ar'
                ? 'الكلمات الممنوعة — اشرح بدون زلّة لسان!'
                : 'Don’t Say It! — Describe Without Slipping!'}
            </span>
          </div>
          <h2 className="text-2xl font-extrabold mt-0.5">
            {lang === 'ar'
              ? `الشارح: ${describer?.name || '...'}`
              : `Describer: ${describer?.name || '...'}`}
          </h2>
          {watcher && watcher.id !== describer?.id && (
            <div className="text-xs font-bold text-white/90 mt-0.5">
              {lang === 'ar'
                ? `مراقب الجرس: ${watcher.name}`
                : `Buzzer Watcher: ${watcher.name}`}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {gameData.phase === 'playing' && (
            <div
              className={`cartoon-badge px-4 py-1.5 text-lg flex items-center gap-1.5 ${
                secondsLeft <= 12
                  ? 'bg-[#ffca3a] text-[#161426] animate-bounce'
                  : 'bg-[#161426] text-[#ffca3a]'
              }`}
            >
              <Timer weight="fill" className="w-5 h-5" />
              <span>{secondsLeft}s</span>
            </div>
          )}

          {(isHost || isPassAndPlay) && (
            <button
              type="button"
              onClick={onStartNewRound}
              className="cartoon-btn bg-white text-[#161426] px-3 py-2 text-xs flex items-center gap-1"
            >
              <ArrowsClockwise weight="bold" className="w-4 h-4" />
              <span>{lang === 'ar' ? 'إعادة' : 'Reset'}</span>
            </button>
          )}
        </div>
      </div>

      {/* READY PHASE */}
      {gameData.phase === 'ready' && (
        <div className="cartoon-card p-6 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-[#ffca3a] border-4 border-[#161426] shadow-[0_5px_0_#161426] flex items-center justify-center mx-auto">
            <Microphone weight="fill" className="w-9 h-9 text-[#161426]" />
          </div>
          <h3 className="text-2xl font-extrabold text-[#161426]">
            {lang === 'ar'
              ? `جاهز يا ${describer?.name}؟ معك 60 ثانية!`
              : `Ready ${describer?.name}? You have 60 seconds!`}
          </h3>
          <p className="text-sm font-bold text-[#3f3b5c] max-w-md mx-auto">
            {lang === 'ar'
              ? 'اشرح الكلمة المكتوبة بالأعلى لأصحابك بدون نطق أي كلمة من الـ 5 كلمات الممنوعة تحتها! الأصحاب فيهم يجاوبوا بالصوت أو يكتبوا الجواب مباشرة.'
              : 'Describe the top word without saying any of the 5 forbidden words below it! Friends can shout out guesses or type them live.'}
          </p>

          {isDescriber || isHost ? (
            <button
              type="button"
              onClick={handleStartTimer}
              className="cartoon-btn bg-[#8ac926] hover:bg-[#9be02f] text-[#161426] px-8 py-4 text-xl inline-flex items-center gap-2.5"
            >
              <Play weight="fill" className="w-6 h-6" />
              <span>{lang === 'ar' ? 'ابدأ العدّاد الآن!' : 'Start 60s Timer!'}</span>
            </button>
          ) : (
            <div className="p-3 rounded-2xl bg-[#191636] text-[#ffca3a] font-extrabold text-sm">
              {lang === 'ar'
                ? `بانتظار ${describer?.name} ليبدأ الجولة...`
                : `Waiting for ${describer?.name} to start...`}
            </div>
          )}
        </div>
      )}

      {/* PLAYING PHASE */}
      {gameData.phase === 'playing' && (
        <div className="space-y-4">
          {/* Live Score Strip */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="cartoon-panel-dark p-3 text-center">
              <div className="text-xs font-bold text-[#8ac926]">
                {lang === 'ar' ? 'صح (+2)' : 'Correct (+2)'}
              </div>
              <div className="text-2xl font-extrabold text-white">
                {gameData.correctWords?.length || 0}
              </div>
            </div>
            <div className="cartoon-panel-dark p-3 text-center">
              <div className="text-xs font-bold text-[#ff595e]">
                {lang === 'ar' ? 'زلّة ممنوعة' : 'Forbidden Buzz'}
              </div>
              <div className="text-2xl font-extrabold text-white">
                {gameData.buzzedWords?.length || 0}
              </div>
            </div>
            <div className="cartoon-panel-dark p-3 text-center">
              <div className="text-xs font-bold text-[#ffca3a]">
                {lang === 'ar' ? 'تخطي' : 'Skipped'}
              </div>
              <div className="text-2xl font-extrabold text-white">
                {gameData.skippedCount || 0}
              </div>
            </div>
          </div>

          {isPassAndPlay && (
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => setLocalShowCard(!localShowCard)}
                className="cartoon-btn bg-[#ffca3a] text-[#161426] px-4 py-2 text-sm flex items-center gap-2"
              >
                {localShowCard ? (
                  <>
                    <EyeSlash weight="bold" className="w-5 h-5" />
                    <span>{lang === 'ar' ? 'إخفاء البطاقة عن المخمنين' : 'Hide Card'}</span>
                  </>
                ) : (
                  <>
                    <Eye weight="bold" className="w-5 h-5" />
                    <span>{lang === 'ar' ? 'إظهار البطاقة للشارح فقط' : 'Show Card to Describer'}</span>
                  </>
                )}
              </button>
            </div>
          )}

          {canSeeTabooCard ? (
            /* THE TABOO CARD (Seen by Describer & Watcher) */
            <div className="cartoon-card max-w-md mx-auto overflow-hidden">
              <div className="bg-[#ffca3a] border-b-4 border-[#161426] p-5 text-center">
                <span className="cartoon-badge bg-white text-[#161426] px-3 py-0.5 text-xs">
                  {lang === 'ar' ? currentCard.category_ar : currentCard.category_en}
                </span>
                <div className="text-3xl md:text-4xl font-extrabold text-[#161426] mt-2">
                  {lang === 'ar' ? currentCard.word_ar : currentCard.word_en}
                </div>
              </div>

              <div className="p-5 bg-white space-y-2.5">
                <div className="text-xs font-extrabold uppercase text-[#ff595e] text-center flex items-center justify-center gap-1">
                  <Prohibit weight="fill" className="w-4 h-4" />
                  <span>
                    {lang === 'ar' ? 'ممنوع نطق هذه الكلمات الـ 5:' : '5 Forbidden Words:'}
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  {(lang === 'ar' ? currentCard.forbidden_ar : currentCard.forbidden_en).map(
                    (fw, idx) => (
                      <div
                        key={idx}
                        className="py-2 px-4 rounded-xl bg-[#ffe4e6] border-3 border-[#161426] text-center font-extrabold text-lg text-[#161426]"
                      >
                        {fw}
                      </div>
                    )
                  )}
                </div>
              </div>

              {/* Action Controls for Describer / Watcher */}
              <div className="p-4 bg-[#fff9ec] border-t-4 border-[#161426] grid grid-cols-3 gap-2.5">
                {isDescriber && (
                  <button
                    type="button"
                    onClick={() => handleGotIt()}
                    className="cartoon-btn bg-[#8ac926] text-[#161426] py-3 px-2 text-sm md:text-base flex flex-col items-center justify-center gap-1"
                  >
                    <CheckCircle weight="fill" className="w-6 h-6" />
                    <span>{lang === 'ar' ? 'جابوها صح!' : 'Got It!'}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleTabooBuzzer}
                  className={`cartoon-btn bg-[#ff595e] text-white py-3 px-2 text-sm md:text-base flex flex-col items-center justify-center gap-1 ${
                    !isDescriber ? 'col-span-3' : ''
                  }`}
                >
                  <BellRinging weight="fill" className="w-6 h-6" />
                  <span>
                    {lang === 'ar' ? 'جرس! قال كلمة ممنوعة' : 'BUZZ! Said a Forbidden Word'}
                  </span>
                </button>

                {isDescriber && (
                  <button
                    type="button"
                    onClick={handleSkipCard}
                    className="cartoon-btn bg-[#00bbf9] text-[#161426] py-3 px-2 text-sm md:text-base flex flex-col items-center justify-center gap-1"
                  >
                    <SkipForward weight="fill" className="w-6 h-6" />
                    <span>{lang === 'ar' ? 'تخطي البطاقة' : 'Skip Card'}</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* GUESSER SCREEN (Online teammates guessing!) */
            <div className="cartoon-card p-6 text-center space-y-4">
              <div className="inline-block cartoon-badge bg-[#00bbf9] text-[#161426] px-4 py-1 text-xs">
                {lang === 'ar' ? currentCard.category_ar : currentCard.category_en}
              </div>
              <h3 className="text-2xl font-extrabold text-[#161426]">
                {lang === 'ar'
                  ? `اسمع شرح (${describer?.name}) واحزر الكلمة!`
                  : `Listen to ${describer?.name} and guess the word!`}
              </h3>

              {gameData.lastGuesserName && (
                <div className="p-2.5 rounded-2xl bg-[#dcfce7] border-2 border-[#161426] text-xs font-extrabold text-[#161426]">
                  {lang === 'ar'
                    ? `رائع! ${gameData.lastGuesserName} جاب البطاقة اللي قبلها!`
                    : `Nice! ${gameData.lastGuesserName} nailed the last word!`}
                </div>
              )}

              {wrongGuessFlash && (
                <div className="text-sm font-extrabold text-[#ff595e]">
                  {lang === 'ar'
                    ? `"${wrongGuessFlash}" مو هي الكلمة... جرب تاني!`
                    : `"${wrongGuessFlash}" is not quite right... try again!`}
                </div>
              )}

              <form onSubmit={handleTextGuessSubmit} className="flex gap-2">
                <input
                  type="text"
                  value={guessInput}
                  onChange={(e) => setGuessInput(e.target.value)}
                  placeholder={
                    lang === 'ar'
                      ? 'اكتب تخمينك هون (أو احكيه بالصوت)...'
                      : 'Type your guess here (or shout it out)...'
                  }
                  className="cartoon-input min-w-0 flex-1 px-4 py-3 bg-white text-[#161426]"
                />
                <button
                  type="submit"
                  className="cartoon-btn bg-[#8ac926] text-[#161426] px-5 py-3 flex items-center gap-1.5 shrink-0"
                >
                  <PaperPlaneTilt weight="fill" className="w-5 h-5" />
                  <span>{lang === 'ar' ? 'تخمين' : 'Guess'}</span>
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* SUMMARY PHASE */}
      {gameData.phase === 'summary' && (
        <div className="cartoon-card p-6 text-center space-y-4 animate-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-2xl bg-[#ffca3a] border-4 border-[#161426] flex items-center justify-center mx-auto">
            <Trophy weight="fill" className="w-9 h-9 text-[#161426]" />
          </div>
          <h3 className="text-2xl md:text-3xl font-extrabold text-[#161426]">
            {lang === 'ar' ? 'انتهى الوقت!' : 'Time’s Up!'}
          </h3>

          <div className="flex flex-wrap justify-center gap-2">
            {(gameData.correctWords || []).map((w, i) => (
              <span key={i} className="cartoon-badge bg-[#8ac926] text-[#161426] px-3 py-1 text-sm">
                ✓ {w}
              </span>
            ))}
            {(gameData.buzzedWords || []).map((w, i) => (
              <span key={i} className="cartoon-badge bg-[#ff595e] text-white px-3 py-1 text-sm">
                ✗ {w}
              </span>
            ))}
          </div>

          <button
            type="button"
            onClick={handleRotateNextDescriber}
            className="cartoon-btn bg-[#ffca3a] text-[#161426] w-full py-3.5 text-xl flex items-center justify-center gap-2"
          >
            <ArrowsClockwise weight="bold" className="w-6 h-6" />
            <span>
              {lang === 'ar' ? 'الدور للشارح اللي بعده!' : 'Next Player’s Turn!'}
            </span>
          </button>
        </div>
      )}
    </div>
  );
};
