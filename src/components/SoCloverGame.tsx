import React, { useState } from 'react';
import { SO_CLOVER_WORDS } from '../data/extraGamesData';
import {
  Clover,
  Eye,
  EyeSlash,
  CheckCircle,
  ArrowsClockwise,
  PaperPlaneTilt,
  Trophy,
} from '@phosphor-icons/react';

export interface SoCloverGameState {
  phase: 'writing_clues' | 'solving' | 'reveal';
  clueGiverId: string;
  targetWordIds: [number, number, number, number]; // [TL, TR, BL, BR] in LTR
  poolWordIds: number[]; // 4 target words + 2 decoys shuffled
  clues: {
    top: string; // connects [0] & [1]
    bottom: string; // connects [2] & [3]
    start: string; // connects [0] & [2] (Right in RTL, Left in LTR)
    end: string; // connects [1] & [3] (Left in RTL, Right in LTR)
  };
  placedWordIds: (number | null)[]; // [slot0, slot1, slot2, slot3]
}

interface PlayerInfo {
  id: string;
  name: string;
  avatar_color: string;
  score: number;
}

interface SoCloverGameProps {
  gameData: SoCloverGameState;
  players: PlayerInfo[];
  myPlayerId: string;
  isHost: boolean;
  isPassAndPlay: boolean;
  lang: 'ar' | 'en';
  onUpdateGameData: (nextData: SoCloverGameState, scoreAwards?: Record<string, number>) => void;
  onStartNewRound: () => void;
}

export function buildInitialSoCloverState(
  playerIds: string[],
  prevClueGiverId?: string
): SoCloverGameState {
  const shuffled = [...SO_CLOVER_WORDS].sort(() => Math.random() - 0.5);
  const targets: [number, number, number, number] = [
    shuffled[0].id,
    shuffled[1].id,
    shuffled[2].id,
    shuffled[3].id,
  ];
  const decoys = [shuffled[4].id, shuffled[5].id];
  const pool = [...targets, ...decoys].sort(() => Math.random() - 0.5);

  const prevIdx = prevClueGiverId ? playerIds.indexOf(prevClueGiverId) : -1;
  const nextGiver =
    playerIds[(prevIdx + 1) % Math.max(1, playerIds.length)] || playerIds[0];

  return {
    phase: 'writing_clues',
    clueGiverId: nextGiver,
    targetWordIds: targets,
    poolWordIds: pool,
    clues: { top: '', bottom: '', start: '', end: '' },
    placedWordIds: [null, null, null, null],
  };
}

export const SoCloverGame: React.FC<SoCloverGameProps> = ({
  gameData,
  players,
  myPlayerId,
  isHost,
  isPassAndPlay,
  lang,
  onUpdateGameData,
}) => {
  const [topClue, setTopClue] = useState<string>('');
  const [bottomClue, setBottomClue] = useState<string>('');
  const [startClue, setStartClue] = useState<string>('');
  const [endClue, setEndClue] = useState<string>('');
  const [peekSecret, setPeekSecret] = useState<boolean>(!isPassAndPlay);
  const [selectedPoolWord, setSelectedPoolWord] = useState<number | null>(null);

  const giver = players.find((p) => p.id === gameData.clueGiverId) || players[0];
  const isClueGiver = isPassAndPlay
    ? gameData.phase === 'writing_clues'
    : myPlayerId === giver?.id;

  const getWordText = (wid: number | null) => {
    if (!wid) return '';
    const item = SO_CLOVER_WORDS.find((w) => w.id === wid);
    return item ? (lang === 'ar' ? item.ar : item.en) : '';
  };

  const w0 = getWordText(gameData.targetWordIds?.[0]);
  const w1 = getWordText(gameData.targetWordIds?.[1]);
  const w2 = getWordText(gameData.targetWordIds?.[2]);
  const w3 = getWordText(gameData.targetWordIds?.[3]);

  const handleLockClues = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topClue.trim() || !bottomClue.trim() || !startClue.trim() || !endClue.trim()) {
      return;
    }
    onUpdateGameData({
      ...gameData,
      clues: {
        top: topClue.trim(),
        bottom: bottomClue.trim(),
        start: startClue.trim(),
        end: endClue.trim(),
      },
      placedWordIds: [null, null, null, null],
      phase: 'solving',
    });
    setTopClue('');
    setBottomClue('');
    setStartClue('');
    setEndClue('');
  };

  const handlePlaceInSlot = (slotIdx: number) => {
    if (gameData.phase !== 'solving') return;
    const currentPlaced = [...(gameData.placedWordIds || [null, null, null, null])];

    if (selectedPoolWord !== null) {
      // Remove selectedPoolWord if it was already in another slot
      const prevSlot = currentPlaced.indexOf(selectedPoolWord);
      if (prevSlot !== -1) {
        currentPlaced[prevSlot] = currentPlaced[slotIdx];
      }
      currentPlaced[slotIdx] = selectedPoolWord;
      setSelectedPoolWord(null);
    } else if (currentPlaced[slotIdx] !== null) {
      // Clicking a filled slot clears it back to pool
      currentPlaced[slotIdx] = null;
    }

    onUpdateGameData({
      ...gameData,
      placedWordIds: currentPlaced,
    });
  };

  const handleCheckBoard = () => {
    let matches = 0;
    (gameData.targetWordIds || []).forEach((tid, idx) => {
      if (gameData.placedWordIds?.[idx] === tid) {
        matches++;
      }
    });

    const pts = matches === 4 ? 4 : matches;
    const awards: Record<string, number> = {};
    if (pts > 0) {
      players.forEach((p) => {
        awards[p.id] = pts;
      });
    }

    onUpdateGameData(
      {
        ...gameData,
        phase: 'reveal',
      },
      awards
    );
  };

  const handleNextCloverRound = () => {
    setSelectedPoolWord(null);
    setPeekSecret(!isPassAndPlay);
    const next = buildInitialSoCloverState(
      players.map((p) => p.id),
      giver?.id
    );
    onUpdateGameData(next);
  };

  const allSlotsFilled = (gameData.placedWordIds || []).every((x) => x !== null);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="cartoon-card bg-[#38b000] text-white p-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs font-extrabold uppercase text-[#ffca3a] flex items-center gap-1.5">
            <Clover weight="fill" className="w-4 h-4" />
            <span>
              {lang === 'ar'
                ? 'شفرة الأربع كلمات — بورد الروابط التعاوني!'
                : 'Link Board — 4 Intersecting Word Clues!'}
            </span>
          </div>
          <h2 className="text-2xl font-extrabold mt-0.5">
            {lang === 'ar'
              ? `صاحب الشفرة: ${giver?.name || ''}`
              : `Clue-Giver: ${giver?.name || ''}`}
          </h2>
        </div>

        {(isHost || isPassAndPlay) && (
          <button
            type="button"
            onClick={handleNextCloverRound}
            className="cartoon-btn bg-[#ffca3a] text-[#161426] px-3.5 py-2 text-xs flex items-center gap-1.5"
          >
            <ArrowsClockwise weight="bold" className="w-4 h-4" />
            <span>{lang === 'ar' ? 'زهرة جديدة' : 'New Board'}</span>
          </button>
        )}
      </div>

      {/* PHASE 1: WRITING THE 4 INTERSECTING CLUES */}
      {gameData.phase === 'writing_clues' && (
        <div className="cartoon-card p-5 space-y-4">
          {isClueGiver ? (
            <>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h3 className="font-extrabold text-base md:text-lg text-[#161426]">
                  {lang === 'ar'
                    ? `يا (${giver?.name})، اكتب كلمة تلميح واحدة تربط كل زوج كلمات متجاور!`
                    : `${giver?.name}, write a 1-word clue connecting each adjacent pair!`}
                </h3>
                {isPassAndPlay && (
                  <button
                    type="button"
                    onClick={() => setPeekSecret(!peekSecret)}
                    className="cartoon-btn bg-[#ffca3a] text-[#161426] px-3 py-1.5 text-xs flex items-center gap-1"
                  >
                    {peekSecret ? <EyeSlash className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    <span>{peekSecret ? (lang === 'ar' ? 'إخفاء الكلمات' : 'Hide') : (lang === 'ar' ? 'عرض الكلمات الـ 4' : 'Peek 4 Words')}</span>
                  </button>
                )}
              </div>

              {peekSecret && (
                <form onSubmit={handleLockClues} className="space-y-4">
                  {/* Visual 2x2 Preview */}
                  <div className="grid grid-cols-2 gap-3 max-w-md mx-auto p-4 rounded-3xl bg-[#dcfce7] border-4 border-[#161426]">
                    {[w0, w1, w2, w3].map((wt, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-2xl bg-white border-3 border-[#161426] text-center font-extrabold text-xl text-[#161426]"
                      >
                        {wt}
                      </div>
                    ))}
                  </div>

                  {/* 4 Pair Inputs */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3 rounded-2xl bg-[#fff1c2] border-3 border-[#161426] space-y-1.5">
                      <label className="block text-xs font-extrabold text-[#161426]">
                        {lang === 'ar'
                          ? `1. شفرة تربط (${w0}) + (${w1}):`
                          : `1. Top Clue linking (${w0}) + (${w1}):`}
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={24}
                        value={topClue}
                        onChange={(e) => setTopClue(e.target.value)}
                        placeholder={lang === 'ar' ? 'كلمة واحدة...' : '1-word clue...'}
                        className="cartoon-input w-full px-3 py-2 bg-white text-[#161426]"
                      />
                    </div>

                    <div className="p-3 rounded-2xl bg-[#fff1c2] border-3 border-[#161426] space-y-1.5">
                      <label className="block text-xs font-extrabold text-[#161426]">
                        {lang === 'ar'
                          ? `2. شفرة تربط (${w2}) + (${w3}):`
                          : `2. Bottom Clue linking (${w2}) + (${w3}):`}
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={24}
                        value={bottomClue}
                        onChange={(e) => setBottomClue(e.target.value)}
                        placeholder={lang === 'ar' ? 'كلمة واحدة...' : '1-word clue...'}
                        className="cartoon-input w-full px-3 py-2 bg-white text-[#161426]"
                      />
                    </div>

                    <div className="p-3 rounded-2xl bg-[#e0f2fe] border-3 border-[#161426] space-y-1.5">
                      <label className="block text-xs font-extrabold text-[#161426]">
                        {lang === 'ar'
                          ? `3. شفرة تربط (${w0}) + (${w2}):`
                          : `3. Side Clue linking (${w0}) + (${w2}):`}
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={24}
                        value={startClue}
                        onChange={(e) => setStartClue(e.target.value)}
                        placeholder={lang === 'ar' ? 'كلمة واحدة...' : '1-word clue...'}
                        className="cartoon-input w-full px-3 py-2 bg-white text-[#161426]"
                      />
                    </div>

                    <div className="p-3 rounded-2xl bg-[#e0f2fe] border-3 border-[#161426] space-y-1.5">
                      <label className="block text-xs font-extrabold text-[#161426]">
                        {lang === 'ar'
                          ? `4. شفرة تربط (${w1}) + (${w3}):`
                          : `4. Side Clue linking (${w1}) + (${w3}):`}
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={24}
                        value={endClue}
                        onChange={(e) => setEndClue(e.target.value)}
                        placeholder={lang === 'ar' ? 'كلمة واحدة...' : '1-word clue...'}
                        className="cartoon-input w-full px-3 py-2 bg-white text-[#161426]"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="cartoon-btn bg-[#8ac926] text-[#161426] w-full py-3.5 text-xl flex items-center justify-center gap-2"
                  >
                    <PaperPlaneTilt weight="fill" className="w-6 h-6" />
                    <span>
                      {lang === 'ar'
                        ? 'اخلط الكلمات مع الدخلاء وابدأ التحدي!'
                        : 'Shuffle Words & Challenge Team!'}
                    </span>
                  </button>
                </form>
              )}
            </>
          ) : (
            <div className="py-8 text-center space-y-2">
              <div className="text-xl font-extrabold text-[#161426] animate-pulse">
                {lang === 'ar'
                  ? `${giver?.name} عم يؤلف الـ 4 شفرات الرابطة على زهرة البرسيم...`
                  : `${giver?.name} is writing the 4 intersecting clues...`}
              </div>
              <p className="text-sm font-bold text-[#3f3b5c]">
                {lang === 'ar'
                  ? 'استعدوا لتركيب الكلمات الـ 4 الصحيحة وتجنب الكلمتين الدخيلتين!'
                  : 'Get ready to place the 4 right words and dodge 2 decoys!'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* PHASE 2 & 3: INTERACTIVE CLOVER PUZZLE BOARD */}
      {(gameData.phase === 'solving' || gameData.phase === 'reveal') && (
        <div className="cartoon-card p-5 space-y-5">
          <div className="text-center">
            <h3 className="font-extrabold text-lg text-[#161426]">
              {gameData.phase === 'solving'
                ? lang === 'ar'
                  ? 'اختار كلمة من الأسفل وحطها بالمربع اللي بيتقاطع مع الشفرتين تبعها!'
                  : 'Click a word below, then click the board corner matching both edge clues!'
                : lang === 'ar'
                ? 'كشف البورد الحقيقي ومقارنة إجاباتكم!'
                : 'Board Solution Revealed!'}
            </h3>
          </div>

          {/* THE CLOVER MATRIX WITH 4 OUTER CLUES */}
          <div className="max-w-xl mx-auto p-4 rounded-3xl bg-[#dcfce7] border-4 border-[#161426] shadow-[0_6px_0_#161426] space-y-3">
            {/* Top Clue */}
            <div className="flex justify-center">
              <span className="cartoon-badge bg-[#ffca3a] text-[#161426] px-5 py-1.5 text-base">
                {gameData.clues?.top}
              </span>
            </div>

            {/* Middle Row: Start Clue + 2x2 Slots + End Clue */}
            <div className="grid grid-cols-12 gap-2 items-center">
              <div className="col-span-3 flex justify-center">
                <span className="cartoon-badge bg-[#00bbf9] text-[#161426] px-3 py-1.5 text-xs sm:text-sm text-center break-words">
                  {gameData.clues?.start}
                </span>
              </div>

              <div className="col-span-6 grid grid-cols-2 gap-2.5">
                {[0, 1, 2, 3].map((slotIdx) => {
                  const placedId = gameData.placedWordIds?.[slotIdx] ?? null;
                  const targetId = gameData.targetWordIds?.[slotIdx];
                  const isCorrect = placedId === targetId;

                  return (
                    <button
                      key={slotIdx}
                      type="button"
                      disabled={gameData.phase === 'reveal'}
                      onClick={() => handlePlaceInSlot(slotIdx)}
                      className={`min-h-[78px] p-2.5 rounded-2xl border-4 border-[#161426] font-extrabold text-base flex flex-col items-center justify-center transition-all ${
                        gameData.phase === 'reveal'
                          ? isCorrect
                            ? 'bg-[#8ac926] text-[#161426]'
                            : 'bg-[#ffe4e6] text-[#161426]'
                          : placedId
                          ? 'bg-white text-[#161426] shadow-[0_4px_0_#161426] cursor-pointer'
                          : selectedPoolWord
                          ? 'bg-[#fff1c2] text-[#161426] animate-pulse cursor-pointer'
                          : 'bg-white/60 text-gray-400 border-dashed cursor-pointer'
                      }`}
                    >
                      {placedId ? (
                        <>
                          <span>{getWordText(placedId)}</span>
                          {gameData.phase === 'reveal' && !isCorrect && (
                            <span className="text-[11px] text-[#ff595e] mt-1">
                              ({getWordText(targetId)})
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="text-xs">#{slotIdx + 1}</span>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="col-span-3 flex justify-center">
                <span className="cartoon-badge bg-[#00bbf9] text-[#161426] px-3 py-1.5 text-xs sm:text-sm text-center break-words">
                  {gameData.clues?.end}
                </span>
              </div>
            </div>

            {/* Bottom Clue */}
            <div className="flex justify-center">
              <span className="cartoon-badge bg-[#ffca3a] text-[#161426] px-5 py-1.5 text-base">
                {gameData.clues?.bottom}
              </span>
            </div>
          </div>

          {/* SHUFFLED 6-WORD POOL (4 Real + 2 Decoys!) */}
          {gameData.phase === 'solving' && (
            <div className="space-y-3">
              <div className="text-xs font-extrabold text-center text-[#3f3b5c]">
                {lang === 'ar'
                  ? 'الكلمات المتاحة (انتبه: يوجد كلمتان دخيلتان للتمويه!):'
                  : 'Shuffled Word Pool (Watch out: 2 words are decoys!):'}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {(gameData.poolWordIds || []).map((wid) => {
                  const alreadyOnBoard = (gameData.placedWordIds || []).includes(wid);
                  const isPicked = selectedPoolWord === wid;
                  return (
                    <button
                      key={wid}
                      type="button"
                      disabled={alreadyOnBoard}
                      onClick={() => setSelectedPoolWord(isPicked ? null : wid)}
                      className={`cartoon-btn py-3 px-4 text-base ${
                        alreadyOnBoard
                          ? 'bg-gray-200 text-gray-400 opacity-50'
                          : isPicked
                          ? 'bg-[#ffca3a] text-[#161426] ring-4 ring-[#ff595e]'
                          : 'bg-white text-[#161426]'
                      }`}
                    >
                      {getWordText(wid)}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                disabled={!allSlotsFilled}
                onClick={handleCheckBoard}
                className="cartoon-btn bg-[#8ac926] text-[#161426] w-full py-3.5 text-xl flex items-center justify-center gap-2"
              >
                <CheckCircle weight="fill" className="w-6 h-6" />
                <span>
                  {lang === 'ar'
                    ? 'افحص تطابق الزهرة واكشف النتيجة!'
                    : 'Lock Board & Reveal Score!'}
                </span>
              </button>
            </div>
          )}

          {gameData.phase === 'reveal' && (
            <div className="text-center space-y-3 pt-2">
              <div className="inline-flex items-center gap-2 cartoon-badge bg-[#ffca3a] text-[#161426] px-5 py-1.5 text-lg">
                <Trophy weight="fill" className="w-5 h-5" />
                <span>
                  {lang === 'ar'
                    ? `تطابق ${
                        (gameData.targetWordIds || []).filter(
                          (tid, i) => gameData.placedWordIds?.[i] === tid
                        ).length
                      } من أصل 4 كلمات!`
                    : `Matched ${
                        (gameData.targetWordIds || []).filter(
                          (tid, i) => gameData.placedWordIds?.[i] === tid
                        ).length
                      } / 4 Board Words!`}
                </span>
              </div>

              <button
                type="button"
                onClick={handleNextCloverRound}
                className="cartoon-btn bg-[#8ac926] text-[#161426] w-full py-3.5 text-xl flex items-center justify-center gap-2"
              >
                <ArrowsClockwise weight="bold" className="w-6 h-6" />
                <span>{lang === 'ar' ? 'جولة شفرة جديدة!' : 'Next Board Round!'}</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
