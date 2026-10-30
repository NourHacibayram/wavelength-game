import React, { useState } from 'react';
import { MEDIUM_WORD_PAIRS } from '../data/extraGamesData';
import { CartoonAvatarSvg } from './CartoonIcons';
import {
  Lightning,
  PaperPlaneTilt,
  Sparkle,
  CheckCircle,
  ArrowsClockwise,
  Handshake,
} from '@phosphor-icons/react';

export interface MeldAttemptLog {
  attempt: number;
  w1: string;
  w2: string;
  sub1: string;
  sub2: string;
  matched: boolean;
}

export interface MediumGameState {
  phase: 'submitting' | 'matched' | 'failed';
  player1Id: string;
  player2Id: string;
  word1: string;
  word2: string;
  attempt: 1 | 2 | 3;
  submissions: Record<string, string>;
  history: MeldAttemptLog[];
}

interface PlayerInfo {
  id: string;
  name: string;
  avatar_color: string;
  score: number;
}

interface MediumGameProps {
  gameData: MediumGameState;
  players: PlayerInfo[];
  myPlayerId: string;
  isHost: boolean;
  isPassAndPlay: boolean;
  lang: 'ar' | 'en';
  onUpdateGameData: (nextData: MediumGameState, scoreAwards?: Record<string, number>) => void;
  onStartNewRound: () => void;
}

function normMeldWord(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/^ال/, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي');
}

export const MediumGame: React.FC<MediumGameProps> = ({
  gameData,
  players,
  myPlayerId,
  isHost,
  isPassAndPlay,
  lang,
  onUpdateGameData,
}) => {
  const [wordInput, setWordInput] = useState<string>('');

  const p1 = players.find((p) => p.id === gameData.player1Id) || players[0];
  const p2 =
    players.find((p) => p.id === gameData.player2Id && p.id !== p1?.id) ||
    players[1] ||
    p1;

  const sub1Done = Boolean(gameData.submissions?.[p1?.id || '']);
  const sub2Done = Boolean(gameData.submissions?.[(p2?.id || '') + (p2?.id === p1?.id ? '_2' : '')] ?? gameData.submissions?.[p2?.id || '']);

  // Determine whose input box is active
  const p2Key = p2?.id === p1?.id ? `${p1?.id}_2` : p2?.id || 'p2';
  const activePassTurnKey = !sub1Done ? p1?.id || 'p1' : p2Key;
  const myOnlineKey =
    myPlayerId === p1?.id && p1?.id !== p2?.id
      ? p1.id
      : myPlayerId === p2?.id && p1?.id !== p2?.id
      ? p2.id
      : p1?.id === p2?.id && myPlayerId === p1?.id
      ? activePassTurnKey
      : null;

  const targetSubmitKey = isPassAndPlay ? activePassTurnKey : myOnlineKey;
  const hasSubmittedMine = targetSubmitKey
    ? Boolean(gameData.submissions?.[targetSubmitKey])
    : false;

  const handleSubmitWord = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = wordInput.trim();
    if (!cleaned || !targetSubmitKey) return;

    const nextSubs = {
      ...(gameData.submissions || {}),
      [targetSubmitKey]: cleaned,
    };
    setWordInput('');

    const wA = nextSubs[p1?.id || ''];
    const wB = nextSubs[p2Key];

    if (wA && wB) {
      const isMatch = normMeldWord(wA) === normMeldWord(wB);
      const logEntry: MeldAttemptLog = {
        attempt: gameData.attempt,
        w1: gameData.word1,
        w2: gameData.word2,
        sub1: wA,
        sub2: wB,
        matched: isMatch,
      };
      const nextHistory = [...(gameData.history || []), logEntry];

      if (isMatch) {
        const pts = gameData.attempt === 1 ? 4 : gameData.attempt === 2 ? 3 : 2;
        const awards: Record<string, number> = {};
        if (p1) awards[p1.id] = pts;
        if (p2) awards[p2.id] = pts;
        onUpdateGameData(
          {
            ...gameData,
            submissions: nextSubs,
            history: nextHistory,
            phase: 'matched',
          },
          awards
        );
      } else if (gameData.attempt >= 3) {
        onUpdateGameData({
          ...gameData,
          submissions: nextSubs,
          history: nextHistory,
          phase: 'failed',
        });
      } else {
        // Converge! Their two submitted words become the new pair!
        onUpdateGameData({
          ...gameData,
          word1: wA,
          word2: wB,
          attempt: ((gameData.attempt + 1) as 2 | 3),
          submissions: {},
          history: nextHistory,
          phase: 'submitting',
        });
      }
    } else {
      onUpdateGameData({
        ...gameData,
        submissions: nextSubs,
      });
    }
  };

  // Crowd override if they wrote synonyms / dialect equivalents!
  const handleManualSynonymMatch = () => {
    const pts = 2;
    const awards: Record<string, number> = {};
    if (p1) awards[p1.id] = pts;
    if (p2) awards[p2.id] = pts;
    onUpdateGameData(
      {
        ...gameData,
        phase: 'matched',
      },
      awards
    );
  };

  const handleNextDuoRound = () => {
    const pair =
      MEDIUM_WORD_PAIRS[Math.floor(Math.random() * MEDIUM_WORD_PAIRS.length)];
    const i1 = players.findIndex((p) => p.id === p1?.id);
    const nextP1 = players[(i1 + 1) % Math.max(1, players.length)] || players[0];
    const nextP2 =
      players[(i1 + 2) % Math.max(1, players.length)] || nextP1;

    onUpdateGameData({
      phase: 'submitting',
      player1Id: nextP1.id,
      player2Id: nextP2.id,
      word1: lang === 'ar' ? pair.w1_ar : pair.w1_en,
      word2: lang === 'ar' ? pair.w2_ar : pair.w2_en,
      attempt: 1,
      submissions: {},
      history: [],
    });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="cartoon-card bg-[#00f5d4] text-[#161426] p-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs font-extrabold uppercase flex items-center gap-1.5">
            <Lightning weight="fill" className="w-4 h-4" />
            <span>
              {lang === 'ar'
                ? `التقاء العقول — المحاولة ${gameData.attempt} من 3`
                : `Mind Meld — Attempt ${gameData.attempt} of 3`}
            </span>
          </div>
          <h2 className="text-2xl font-extrabold mt-0.5">
            {p1?.name} &times; {p2?.name}
          </h2>
        </div>

        {(isHost || isPassAndPlay) && (
          <button
            type="button"
            onClick={handleNextDuoRound}
            className="cartoon-btn bg-white text-[#161426] px-3.5 py-2 text-xs flex items-center gap-1.5"
          >
            <ArrowsClockwise weight="bold" className="w-4 h-4" />
            <span>{lang === 'ar' ? 'ثنائي جديد' : 'New Pair'}</span>
          </button>
        )}
      </div>

      {/* Active Pair & Two Bridge Words */}
      <div className="cartoon-card p-6 text-center space-y-5">
        <div className="flex items-center justify-center gap-5">
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-[#e0f2fe] border-4 border-[#161426] p-1">
              <CartoonAvatarSvg index={0} color={p1?.avatar_color || '#00bbf9'} />
            </div>
            <span className="cartoon-badge bg-[#00bbf9] text-[#161426] px-3 py-0.5 text-xs -mt-2">
              {p1?.name} {sub1Done ? '✓' : ''}
            </span>
          </div>

          <Lightning weight="fill" className="w-9 h-9 text-[#ffca3a] drop-shadow-[0_3px_0_#161426]" />

          <div className="flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-[#ffe5f4] border-4 border-[#161426] p-1">
              <CartoonAvatarSvg index={1} color={p2?.avatar_color || '#f15bb5'} />
            </div>
            <span className="cartoon-badge bg-[#f15bb5] text-white px-3 py-0.5 text-xs -mt-2">
              {p2?.name} {sub2Done ? '✓' : ''}
            </span>
          </div>
        </div>

        {/* The Two Words to Bridge */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl mx-auto">
          <div className="p-5 rounded-3xl bg-[#ffca3a] border-4 border-[#161426] shadow-[0_6px_0_#161426]">
            <div className="text-xs font-extrabold text-[#161426]/70">
              {lang === 'ar' ? 'الكلمة الأولى' : 'Word 1'}
            </div>
            <div className="text-3xl font-extrabold text-[#161426] mt-1">
              {gameData.word1}
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-[#ff924c] border-4 border-[#161426] shadow-[0_6px_0_#161426]">
            <div className="text-xs font-extrabold text-[#161426]/70">
              {lang === 'ar' ? 'الكلمة الثانية' : 'Word 2'}
            </div>
            <div className="text-3xl font-extrabold text-[#161426] mt-1">
              {gameData.word2}
            </div>
          </div>
        </div>

        {/* Input / Status */}
        {gameData.phase === 'submitting' && (
          <>
            {targetSubmitKey && !hasSubmittedMine ? (
              <form onSubmit={handleSubmitWord} className="max-w-lg mx-auto space-y-2.5">
                <div className="text-sm font-extrabold text-[#161426]">
                  {isPassAndPlay
                    ? lang === 'ar'
                      ? `دور (${!sub1Done ? p1?.name : p2?.name}) بالسر — شو الكلمة الواحدة اللي بتربطهم؟`
                      : `Secret turn (${!sub1Done ? p1?.name : p2?.name}) — what 1 word links both?`
                    : lang === 'ar'
                    ? 'اكتب كلمة واحدة فقط بتربط الكلمتين فوق برأيك!'
                    : 'Type ONE single word that connects both words above!'}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    maxLength={30}
                    value={wordInput}
                    onChange={(e) => setWordInput(e.target.value)}
                    placeholder={
                      lang === 'ar' ? 'اكتب الكلمة الرابطة هون...' : 'Connecting word...'
                    }
                    className="cartoon-input min-w-0 flex-1 px-4 py-3 bg-white text-[#161426] text-lg text-center"
                  />
                  <button
                    type="submit"
                    className="cartoon-btn bg-[#8ac926] text-[#161426] px-6 py-3 text-lg flex items-center gap-2 shrink-0"
                  >
                    <PaperPlaneTilt weight="fill" className="w-5 h-5" />
                    <span>{lang === 'ar' ? 'إرسال' : 'Lock'}</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="p-4 rounded-2xl bg-[#191636] text-[#ffca3a] font-extrabold text-base">
                {hasSubmittedMine
                  ? lang === 'ar'
                    ? 'ثبتت كلمتك بالسر! بانتظار الطرف الثاني لنكشفهم سوا...'
                    : 'Your word is locked! Waiting for your partner...'
                  : lang === 'ar'
                  ? `راقب التقاء عقلَي (${p1?.name}) و (${p2?.name})!`
                  : `Watching ${p1?.name} & ${p2?.name} try to mind-meld!`}
              </div>
            )}
          </>
        )}

        {/* MATCH CELEBRATION */}
        {gameData.phase === 'matched' && (
          <div className="p-5 rounded-3xl bg-[#8ac926] border-4 border-[#161426] space-y-3 animate-in zoom-in-95 duration-200">
            <Sparkle weight="fill" className="w-11 h-11 text-[#ffca3a] mx-auto" />
            <h3 className="text-3xl font-extrabold text-[#161426]">
              {lang === 'ar'
                ? 'التقت العقول على نفس الكلمة!!'
                : 'MIND MELD! Exact Same Word!'}
            </h3>
            <button
              type="button"
              onClick={handleNextDuoRound}
              className="cartoon-btn bg-[#ffca3a] text-[#161426] px-8 py-3.5 text-xl inline-flex items-center gap-2"
            >
              <ArrowsClockwise weight="bold" className="w-6 h-6" />
              <span>{lang === 'ar' ? 'جولة ثنائي جديدة!' : 'Next Mind Meld!'}</span>
            </button>
          </div>
        )}

        {/* FAILED AFTER 3 ATTEMPTS */}
        {gameData.phase === 'failed' && (
          <div className="p-5 rounded-3xl bg-[#ffe4e6] border-4 border-[#161426] space-y-3">
            <h3 className="text-2xl font-extrabold text-[#ff595e]">
              {lang === 'ar'
                ? 'خلصت المحاولات الـ 3 وما اتطابقت الكلمتان!'
                : '3 Attempts Done — No Exact Match!'}
            </h3>
            <div className="flex flex-wrap gap-2.5 justify-center">
              <button
                type="button"
                onClick={handleManualSynonymMatch}
                className="cartoon-btn bg-[#8ac926] text-[#161426] px-5 py-2.5 text-sm flex items-center gap-1.5"
              >
                <Handshake weight="fill" className="w-5 h-5" />
                <span>
                  {lang === 'ar'
                    ? 'نفس المعنى بالعامية! احسبها تطابق (+2)'
                    : 'Close Enough Synonym! Count Match (+2)'}
                </span>
              </button>
              <button
                type="button"
                onClick={handleNextDuoRound}
                className="cartoon-btn bg-[#ffca3a] text-[#161426] px-6 py-2.5 text-base flex items-center gap-1.5"
              >
                <ArrowsClockwise weight="bold" className="w-5 h-5" />
                <span>{lang === 'ar' ? 'جولة جديدة' : 'Next Pair'}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Convergence Bridge History */}
      {(gameData.history || []).length > 0 && (
        <div className="cartoon-panel-dark p-4 space-y-2.5">
          <div className="text-xs font-extrabold text-[#ffca3a] uppercase">
            {lang === 'ar' ? 'مسار تقارب الأفكار:' : 'Mind Convergence Trail:'}
          </div>
          {gameData.history.map((item, i) => (
            <div
              key={i}
              className="p-3 rounded-2xl bg-[#191636] border-2 border-[#120f29] flex flex-wrap items-center justify-between gap-2 text-sm font-extrabold"
            >
              <span className="text-[#d9d4f7]">
                #{item.attempt}: ({item.w1} + {item.w2})
              </span>
              <div className="flex items-center gap-2">
                <span className="cartoon-badge bg-[#00bbf9] text-[#161426] px-3 py-0.5">
                  {p1?.name}: {item.sub1}
                </span>
                <span className="cartoon-badge bg-[#f15bb5] text-white px-3 py-0.5">
                  {p2?.name}: {item.sub2}
                </span>
                {item.matched && (
                  <CheckCircle weight="fill" className="w-5 h-5 text-[#8ac926]" />
                )}
              </div>
            </div>
          ))}

          {gameData.phase === 'submitting' && (
            <button
              type="button"
              onClick={handleManualSynonymMatch}
              className="cartoon-btn bg-[#8ac926] text-[#161426] px-3.5 py-1.5 text-xs flex items-center gap-1"
            >
              <Handshake weight="fill" className="w-4 h-4" />
              <span>
                {lang === 'ar'
                  ? 'كتبنا نفس الكلمة بلهجتين؟ احسبها تطابق!'
                  : 'Same word in slang? Count as Match!'}
              </span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
