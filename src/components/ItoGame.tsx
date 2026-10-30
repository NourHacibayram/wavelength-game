import React, { useState } from 'react';
import { ITO_THEMES } from '../data/partyGamesData';
import {
  Eye,
  EyeSlash,
  ArrowUp,
  ArrowDown,
  Sparkle,
  PaperPlaneTilt,
  ArrowsClockwise,
  CheckCircle,
} from '@phosphor-icons/react';

export interface ItoGameState {
  phase: 'ordering' | 'reveal';
  themeId: number;
  numbers: Record<string, number>;
  clues: Record<string, string>;
  orderedPlayerIds: string[];
}

interface PlayerInfo {
  id: string;
  name: string;
  avatar_color: string;
  score: number;
}

interface ItoGameProps {
  gameData: ItoGameState;
  players: PlayerInfo[];
  myPlayerId: string;
  isHost: boolean;
  isPassAndPlay: boolean;
  lang: 'ar' | 'en';
  onUpdateGameData: (nextData: ItoGameState, scoreAwards?: Record<string, number>) => void;
  onStartNewRound: () => void;
}

export const ItoGame: React.FC<ItoGameProps> = ({
  gameData,
  players,
  myPlayerId,
  isHost,
  isPassAndPlay,
  lang,
  onUpdateGameData,
  onStartNewRound,
}) => {
  const [peekNum, setPeekNum] = useState<boolean>(false);
  const [activeLocalIdx, setActiveLocalIdx] = useState<number>(0);
  const [clueInput, setClueInput] = useState<string>('');

  const theme = ITO_THEMES.find((t) => t.id === gameData.themeId) || ITO_THEMES[0];
  const currentViewerId = isPassAndPlay
    ? players[activeLocalIdx]?.id || myPlayerId
    : myPlayerId;
  const currentViewer = players.find((p) => p.id === currentViewerId);
  const mySecretNumber = gameData.numbers?.[currentViewerId] ?? 50;

  // Ensure all players are in orderedPlayerIds
  const orderedIds = Array.from(
    new Set([...(gameData.orderedPlayerIds || []), ...players.map((p) => p.id)])
  ).filter((id) => players.some((p) => p.id === id));

  const handleSubmitClue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clueInput.trim()) return;
    const nextClues = {
      ...(gameData.clues || {}),
      [currentViewerId]: clueInput.trim(),
    };
    setClueInput('');
    setPeekNum(false);
    if (isPassAndPlay && activeLocalIdx + 1 < players.length) {
      setActiveLocalIdx(activeLocalIdx + 1);
    }
    onUpdateGameData({
      ...gameData,
      clues: nextClues,
      orderedPlayerIds: orderedIds,
    });
  };

  const movePlayerInOrder = (index: number, direction: -1 | 1) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= orderedIds.length) return;
    const nextOrder = [...orderedIds];
    const temp = nextOrder[index];
    nextOrder[index] = nextOrder[targetIdx];
    nextOrder[targetIdx] = temp;
    onUpdateGameData({
      ...gameData,
      orderedPlayerIds: nextOrder,
    });
  };

  const handleRevealOrder = () => {
    // Check which players are in ascending order!
    const actualSortedIds = [...orderedIds].sort(
      (a, b) => (gameData.numbers?.[a] || 0) - (gameData.numbers?.[b] || 0)
    );
    const awards: Record<string, number> = {};
    let correctCount = 0;

    orderedIds.forEach((pid, idx) => {
      if (actualSortedIds[idx] === pid) {
        correctCount++;
        awards[pid] = 3;
      } else {
        awards[pid] = 1;
      }
    });

    if (correctCount === orderedIds.length) {
      orderedIds.forEach((pid) => {
        awards[pid] = 4; // Perfect team order!
      });
    }

    onUpdateGameData(
      {
        ...gameData,
        orderedPlayerIds: orderedIds,
        phase: 'reveal',
      },
      awards
    );
  };

  return (
    <div className="space-y-4">
      {/* Theme Scale Banner */}
      <div className="cartoon-card bg-[#ffca3a] p-5 space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <div className="text-xs font-extrabold uppercase text-[#161426]/75">
              🔢 {lang === 'ar' ? 'موضوع مقياس الأرقام (1 إلى 100)' : 'Number Scale Theme (1 to 100)'}
            </div>
            <h2 className="text-2xl font-extrabold text-[#161426]">
              {lang === 'ar' ? theme.title_ar : theme.title_en}
            </h2>
          </div>

          {(isHost || isPassAndPlay) && (
            <button
              type="button"
              onClick={() => {
                setPeekNum(false);
                setActiveLocalIdx(0);
                onStartNewRound();
              }}
              className="cartoon-btn bg-white text-[#161426] px-3.5 py-2 text-sm flex items-center gap-1.5"
            >
              <ArrowsClockwise weight="bold" className="w-4 h-4" />
              <span>{lang === 'ar' ? 'تغيير الموضوع' : 'New Theme'}</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 pt-1">
          <div className="p-3 rounded-2xl bg-[#38bdf8] border-3 border-[#161426] font-extrabold text-sm text-[#161426] text-center">
            ⬇️ {lang === 'ar' ? theme.min_ar : theme.min_en}
          </div>
          <div className="p-3 rounded-2xl bg-[#fb7185] border-3 border-[#161426] font-extrabold text-sm text-[#161426] text-center">
            ⬆️ {lang === 'ar' ? theme.max_ar : theme.max_en}
          </div>
        </div>
      </div>

      {/* Pass & Play Switcher */}
      {isPassAndPlay && gameData.phase !== 'reveal' && (
        <div className="cartoon-panel-dark p-3.5 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm font-extrabold">
            <Sparkle weight="fill" className="w-5 h-5 text-[#ffca3a]" />
            <span>{lang === 'ar' ? 'اللاعب الحالي:' : 'Current Player:'}</span>
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
                  setPeekNum(false);
                  setActiveLocalIdx(idx);
                }}
                className={`cartoon-badge px-3 py-1 text-xs cursor-pointer ${
                  idx === activeLocalIdx
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

      {/* Secret Number Peek Card */}
      {gameData.phase !== 'reveal' && (
        <div className="cartoon-card p-4 text-center space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="font-extrabold text-base text-[#161426]">
              🔒{' '}
              {lang === 'ar'
                ? `الرقم السري الخاص بـ (${currentViewer?.name || ''}) من 1 لـ 100`
                : `Secret Number (1–100) for ${currentViewer?.name || ''}`}
            </span>

            <button
              type="button"
              onClick={() => setPeekNum(!peekNum)}
              className={`cartoon-btn px-4 py-2 text-sm flex items-center gap-2 ${
                peekNum ? 'bg-[#ff595e] text-white' : 'bg-[#8ac926] text-[#161426]'
              }`}
            >
              {peekNum ? (
                <>
                  <EyeSlash weight="bold" className="w-5 h-5" />
                  <span>{lang === 'ar' ? 'خبّي رقمي!' : 'Hide My Number!'}</span>
                </>
              ) : (
                <>
                  <Eye weight="bold" className="w-5 h-5" />
                  <span>{lang === 'ar' ? 'اكشف رقمي بالسر 👁️' : 'Peek My Secret Number 👁️'}</span>
                </>
              )}
            </button>
          </div>

          {peekNum && (
            <div className="p-4 rounded-2xl bg-[#191636] text-[#ffca3a] border-4 border-[#161426] animate-in zoom-in-95 duration-150">
              <div className="text-xs font-bold text-white uppercase">
                {lang === 'ar'
                  ? 'ممنوع تحكي الرقم! اوصفه بمثال يناسب قوته:'
                  : 'Don’t say the number! Describe it with an example:'}
              </div>
              <div className="text-5xl font-extrabold my-1">{mySecretNumber}</div>
            </div>
          )}

          {/* Clue Input */}
          <form onSubmit={handleSubmitClue} className="flex flex-col sm:flex-row gap-2.5 pt-1">
            <input
              type="text"
              maxLength={50}
              value={clueInput}
              onChange={(e) => setClueInput(e.target.value)}
              placeholder={
                lang === 'ar'
                  ? `اكتب مثال يعبر عن رقم ${currentViewer?.name || ''} بدون ذكر أرقام...`
                  : `Write an example matching ${currentViewer?.name || 'your'} number...`
              }
              className="cartoon-input min-w-0 flex-1 px-4 py-2.5 bg-white text-[#161426]"
            />
            <button
              type="submit"
              className="cartoon-btn bg-[#00bbf9] text-[#161426] px-5 py-2.5 flex items-center justify-center gap-2 shrink-0"
            >
              <PaperPlaneTilt weight="fill" className="w-5 h-5" />
              <span>{lang === 'ar' ? 'حفظ المثال' : 'Save Clue'}</span>
            </button>
          </form>
        </div>
      )}

      {/* Ordering Board (Smallest 1 -> Largest 100) */}
      <div className="cartoon-card p-5 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="font-extrabold text-lg text-[#161426]">
            📊{' '}
            {lang === 'ar'
              ? 'رتّبوا البطاقات من الأصغر (فوق) للأكبر (تحت) حسب أمثلتكم!'
              : 'Sort cards from Smallest (top) to Largest (bottom)!'}
          </h3>
          <span className="cartoon-badge bg-[#ffca3a] text-[#161426] px-3 py-0.5 text-xs">
            1 ⬆️ ... 100 ⬇️
          </span>
        </div>

        <div className="space-y-2.5">
          {orderedIds.map((pid, idx) => {
            const p = players.find((item) => item.id === pid);
            if (!p) return null;
            const clue = gameData.clues?.[pid];
            const num = gameData.numbers?.[pid] ?? 0;

            return (
              <div
                key={pid}
                className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-white border-4 border-[#161426] shadow-[0_4px_0_#161426]"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="cartoon-badge bg-[#161426] text-[#ffca3a] w-8 h-8 flex items-center justify-center text-sm shrink-0">
                    #{idx + 1}
                  </span>
                  <div
                    style={{ backgroundColor: p.avatar_color }}
                    className="w-10 h-10 rounded-full border-3 border-[#161426] flex items-center justify-center font-extrabold text-[#161426] shrink-0"
                  >
                    {p.name.slice(0, 1)}
                  </div>
                  <div className="min-w-0">
                    <div className="font-extrabold text-base text-[#161426] truncate">
                      {p.name}
                    </div>
                    <div className="text-sm font-bold text-[#1982c4] truncate">
                      {clue ? `“${clue}”` : lang === 'ar' ? 'لسه ما كتب مثال...' : 'No clue yet...'}
                    </div>
                  </div>
                </div>

                {gameData.phase === 'reveal' ? (
                  <div className="cartoon-badge bg-[#8ac926] text-[#161426] px-4 py-1.5 text-xl font-extrabold shrink-0">
                    {num}
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => movePlayerInOrder(idx, -1)}
                      className="cartoon-btn bg-[#e0f2fe] text-[#161426] p-2"
                      title="Move Up"
                    >
                      <ArrowUp weight="bold" className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === orderedIds.length - 1}
                      onClick={() => movePlayerInOrder(idx, 1)}
                      className="cartoon-btn bg-[#ffe4e6] text-[#161426] p-2"
                      title="Move Down"
                    >
                      <ArrowDown weight="bold" className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {gameData.phase === 'ordering' ? (
          <button
            type="button"
            onClick={handleRevealOrder}
            className="cartoon-btn bg-[#8ac926] hover:bg-[#9be02f] text-[#161426] w-full py-3.5 text-xl flex items-center justify-center gap-2"
          >
            <CheckCircle weight="fill" className="w-6 h-6" />
            <span>
              {lang === 'ar'
                ? 'اعتمد الترتيب واكشف الأرقام السرية! 🎉'
                : 'Lock Order & Reveal Secret Numbers! 🎉'}
            </span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              setPeekNum(false);
              setActiveLocalIdx(0);
              onStartNewRound();
            }}
            className="cartoon-btn bg-[#ffca3a] text-[#161426] w-full py-3.5 text-xl"
          >
            {lang === 'ar' ? 'جولة أرقام جديدة! 🔄' : 'Next Number Round! 🔄'}
          </button>
        )}
      </div>
    </div>
  );
};
