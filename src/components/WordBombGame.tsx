import React, { useState, useEffect, useMemo } from 'react';
import { WORD_BOMB_CHALLENGES } from '../data/partyGamesData';
import { AnimatedBombSvg } from './CartoonIcons';
import {
  Fire,
  PaperPlaneTilt,
  WarningOctagon,
  ArrowsClockwise,
  HourglassHigh,
  Trophy,
  WarningCircle,
} from '@phosphor-icons/react';

export interface WordBombGameState {
  phase: 'ticking' | 'exploded';
  challengeId: number;
  holderPlayerId: string;
  usedWords: string[];
  lastWord?: string;
  lastAuthorId?: string;
  explodedPlayerId?: string | null;
  turnStartedAt: number;
}

interface PlayerInfo {
  id: string;
  name: string;
  avatar_color: string;
  score: number;
}

interface WordBombGameProps {
  gameData: WordBombGameState;
  players: PlayerInfo[];
  myPlayerId: string;
  isHost: boolean;
  isPassAndPlay: boolean;
  lang: 'ar' | 'en';
  onUpdateGameData: (nextData: WordBombGameState, scoreAwards?: Record<string, number>) => void;
  onStartNewRound: () => void;
}

function normalizeArabicText(str: string): string {
  return str
    .trim()
    .toLowerCase()
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي');
}

export const WordBombGame: React.FC<WordBombGameProps> = ({
  gameData,
  players,
  myPlayerId,
  isHost,
  isPassAndPlay,
  lang,
  onUpdateGameData,
  onStartNewRound,
}) => {
  const [wordInput, setWordInput] = useState<string>('');
  const [errorHint, setErrorHint] = useState<string | null>(null);
  const [visualFuseStep, setVisualFuseStep] = useState<number>(10);

  const challenge =
    WORD_BOMB_CHALLENGES.find((c) => c.id === gameData.challengeId) ||
    WORD_BOMB_CHALLENGES[0];
  const requiredLettersRaw =
    lang === 'ar' ? challenge.letters_ar : challenge.letters_en;
  const requiredChars = requiredLettersRaw
    .split(' ')
    .join('')
    .split('')
    .map((c) => normalizeArabicText(c));

  const holderPlayer =
    players.find((p) => p.id === gameData.holderPlayerId) || players[0];
  const isMyBombTurn =
    isPassAndPlay || gameData.holderPlayerId === myPlayerId;
  const lastAuthor = players.find((p) => p.id === gameData.lastAuthorId);

  // Secret unpredictable explosion duration (between 8 and 17 seconds, seeded by turnStartedAt)
  const secretDurationSec = useMemo(() => {
    const seed = Math.abs((gameData.turnStartedAt || 1) % 10);
    return 8 + seed; // 8s to 17s — nobody knows when it will blow!
  }, [gameData.turnStartedAt]);

  // Hidden timer + suspenseful fuse animation that doesn't give away the exact second
  useEffect(() => {
    if (gameData.phase !== 'ticking') return;
    setVisualFuseStep(10);
    let elapsed = 0;

    const interval = setInterval(() => {
      elapsed += 1;
      // Oscillate visual fuse between 3 and 8 after a few seconds so it looks unstable & suspenseful!
      setVisualFuseStep((prev) => (prev > 4 ? prev - 1 : 4 + (elapsed % 3)));

      if (elapsed >= secretDurationSec) {
        clearInterval(interval);
        if (isMyBombTurn || isHost) {
          triggerExplosion(gameData.holderPlayerId);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [gameData.turnStartedAt, gameData.holderPlayerId, gameData.phase, secretDurationSec]);

  const triggerExplosion = (loserId: string) => {
    if (gameData.phase === 'exploded') return;
    const awards: Record<string, number> = {};
    players.forEach((p) => {
      if (p.id !== loserId) {
        awards[p.id] = 2; // Survivors earn +2 points!
      }
    });
    onUpdateGameData(
      {
        ...gameData,
        phase: 'exploded',
        explodedPlayerId: loserId,
      },
      awards
    );
  };

  const handlePassBomb = (e: React.FormEvent) => {
    e.preventDefault();
    const raw = wordInput.trim();
    if (!raw || raw.length < 2) {
      setErrorHint(
        lang === 'ar' ? 'اكتب كلمة حقيقية من حرفين عالأقل!' : 'Type a valid word!'
      );
      return;
    }

    const norm = normalizeArabicText(raw);
    const alreadyUsed = (gameData.usedWords || []).some(
      (u) => normalizeArabicText(u) === norm
    );
    if (alreadyUsed) {
      setErrorHint(
        lang === 'ar'
          ? 'هاي الكلمة انكتبت من قبل بهاي الجولة! هات كلمة غيرها!'
          : 'Word already used this round!'
      );
      return;
    }

    const hasAllLetters = requiredChars.every((ch) => norm.includes(ch));
    if (!hasAllLetters) {
      setErrorHint(
        lang === 'ar'
          ? `لازم الكلمة تحتوي على الحروف: (${requiredLettersRaw})`
          : `Word must contain: (${requiredLettersRaw})`
      );
      return;
    }

    setErrorHint(null);
    setWordInput('');

    // Pass bomb to next player in the circle
    const currentIdx = players.findIndex((p) => p.id === gameData.holderPlayerId);
    const nextIdx = (currentIdx + 1) % Math.max(1, players.length);
    const nextHolderId = players[nextIdx]?.id || myPlayerId;
    const nextChallenge =
      WORD_BOMB_CHALLENGES[
        Math.floor(Math.random() * WORD_BOMB_CHALLENGES.length)
      ];

    onUpdateGameData(
      {
        ...gameData,
        challengeId: nextChallenge.id,
        holderPlayerId: nextHolderId,
        usedWords: [...(gameData.usedWords || []), raw],
        lastWord: raw,
        lastAuthorId: gameData.holderPlayerId,
        turnStartedAt: Date.now(),
      },
      { [gameData.holderPlayerId]: 1 } // +1 point for surviving the pass!
    );
  };

  // Crowd Judge: Friends can reject a fake/gibberish word and throw the bomb back!
  const handleCrowdRejectWord = () => {
    if (!gameData.lastAuthorId) return;
    const nextUsed = (gameData.usedWords || []).slice(0, -1);
    onUpdateGameData({
      ...gameData,
      holderPlayerId: gameData.lastAuthorId,
      usedWords: nextUsed,
      lastWord: undefined,
      lastAuthorId: undefined,
      turnStartedAt: Date.now(),
    });
  };

  return (
    <div className="space-y-4">
      {/* Main Ticking Bomb Arena */}
      <div className="cartoon-card p-6 text-center space-y-4 relative overflow-hidden">
        {gameData.phase === 'ticking' ? (
          <>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="cartoon-badge bg-[#ff595e] text-white px-4 py-1 text-sm flex items-center gap-1.5 animate-pulse">
                <Fire weight="fill" className="w-4 h-4 text-[#ffca3a]" />
                <span>
                  {lang === 'ar'
                    ? 'الفتيل شغّال... ممكن تنفجر بأي لحظة!'
                    : 'Fuse is burning... Could explode any second!'}
                </span>
              </span>

              <span className="cartoon-badge bg-[#161426] text-[#ffca3a] px-3.5 py-1 text-xs">
                {lang === 'ar'
                  ? `الكلمات المقبولة: ${(gameData.usedWords || []).length}`
                  : `Words Passed: ${(gameData.usedWords || []).length}`}
              </span>
            </div>

            {/* Custom SVG Animated Bomb with Unpredictable Burning Fuse & Sparks! */}
            <div className="py-1 flex justify-center">
              <AnimatedBombSvg
                secondsLeft={visualFuseStep}
                maxSeconds={12}
                letters={requiredLettersRaw}
                exploded={false}
                className="w-48 h-48"
              />
            </div>

            <div className="space-y-1">
              <div className="text-sm font-extrabold text-[#3f3b5c]">
                {lang === 'ar' ? challenge.hint_ar : challenge.hint_en}
              </div>
              <div className="text-xl md:text-2xl font-extrabold text-[#161426] flex items-center justify-center gap-2">
                <Fire weight="fill" className="w-6 h-6 text-[#ff595e]" />
                <span>
                  {lang === 'ar'
                    ? `القنبلة هلق بإيد: ${holderPlayer?.name || ''}!`
                    : `Bomb is in ${holderPlayer?.name || ''}’s hands!`}
                </span>
              </div>
            </div>

            {errorHint && (
              <div className="p-3 rounded-2xl bg-[#ff595e] text-white font-extrabold text-sm flex items-center justify-center gap-2">
                <WarningCircle weight="fill" className="w-5 h-5 shrink-0" />
                <span>{errorHint}</span>
              </div>
            )}

            {isMyBombTurn ? (
              <form onSubmit={handlePassBomb} className="flex flex-col sm:flex-row gap-2.5">
                <input
                  type="text"
                  autoFocus
                  maxLength={30}
                  value={wordInput}
                  onChange={(e) => setWordInput(e.target.value)}
                  placeholder={
                    lang === 'ar'
                      ? `بسرعة! اكتب كلمة فيها (${requiredLettersRaw}) بالعامية أو الفصحى...`
                      : `Quick! Type a word with (${requiredLettersRaw})...`
                  }
                  className="cartoon-input min-w-0 flex-1 px-4 py-3 bg-white text-[#161426] text-lg"
                />
                <button
                  type="submit"
                  className="cartoon-btn bg-[#8ac926] hover:bg-[#9be02f] text-[#161426] px-6 py-3 text-lg flex items-center justify-center gap-2 shrink-0"
                >
                  <PaperPlaneTilt weight="fill" className="w-5 h-5" />
                  <span>{lang === 'ar' ? 'ارمي القنبلة للي بعدك!' : 'Pass the Bomb!'}</span>
                </button>
              </form>
            ) : (
              <div className="p-4 rounded-2xl bg-[#191636] text-[#ffca3a] font-extrabold text-lg flex items-center justify-center gap-2">
                <HourglassHigh weight="fill" className="w-6 h-6 animate-spin" />
                <span>
                  {lang === 'ar'
                    ? `${holderPlayer?.name || ''} عم يحاول يلاقي كلمة قبل ما تنفجر!`
                    : `${holderPlayer?.name || ''} is trying to find a word!`}
                </span>
              </div>
            )}
          </>
        ) : (
          /* Exploded State with Custom Comic Explosion SVG */
          <div className="space-y-4 py-3 animate-in zoom-in-95 duration-200 flex flex-col items-center">
            <AnimatedBombSvg exploded={true} className="w-40 h-40" />
            <h2 className="text-3xl font-extrabold text-[#ff595e]">
              {lang === 'ar'
                ? `بوووم! انفجرت القنبلة بإيد ${
                    players.find((p) => p.id === gameData.explodedPlayerId)?.name || ''
                  }!`
                : `BOOM! The bomb exploded on ${
                    players.find((p) => p.id === gameData.explodedPlayerId)?.name || ''
                  }!`}
            </h2>
            <p className="font-extrabold text-[#161426] flex items-center justify-center gap-2">
              <Trophy weight="fill" className="w-6 h-6 text-[#ffca3a]" />
              <span>
                {lang === 'ar'
                  ? 'باقي اللاعبين كسبوا +2 نقطة لنجاتهم من الانفجار!'
                  : 'All surviving players earned +2 points!'}
              </span>
            </p>
            <button
              type="button"
              onClick={onStartNewRound}
              className="cartoon-btn bg-[#ffca3a] text-[#161426] w-full py-3.5 text-xl flex items-center justify-center gap-2"
            >
              <ArrowsClockwise weight="bold" className="w-6 h-6" />
              <span>{lang === 'ar' ? 'جولة قنبلة جديدة!' : 'New Bomb Round!'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Crowd Judge Bar (Handles Slang/Dialect vs Fake Words without needing AI!) */}
      {gameData.phase === 'ticking' && gameData.lastWord && (
        <div className="cartoon-panel-dark p-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="text-xs font-bold text-[#ffca3a] block">
              {lang === 'ar'
                ? 'حكم الشلّة (تقبلوا العامية مثل موية/ماء أو اعترضوا عالتخبيص!):'
                : 'Crowd Referee (Challenge fake words!):'}
            </span>
            <div className="text-base font-extrabold text-white">
              {lastAuthor?.name}:{' '}
              <span className="text-[#8ac926]">&ldquo;{gameData.lastWord}&rdquo;</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCrowdRejectWord}
            className="cartoon-btn bg-[#ff595e] text-white px-4 py-2 text-sm flex items-center gap-1.5"
          >
            <WarningOctagon weight="fill" className="w-5 h-5" />
            <span>
              {lang === 'ar'
                ? 'اعتراض! مافي هيك كلمة (رجّع القنبلة لإيده)'
                : 'Challenge! Reject Word & Return Bomb'}
            </span>
          </button>
        </div>
      )}
    </div>
  );
};
