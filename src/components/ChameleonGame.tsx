import React, { useState } from 'react';
import { CHAMELEON_TOPICS } from '../data/partyGamesData';
import {
  Eye,
  EyeSlash,
  Detective,
  CheckCircle,
  Sparkle,
  PaperPlaneTilt,
  ArrowsClockwise,
  UserCheck,
} from '@phosphor-icons/react';

export interface ChameleonGameState {
  phase: 'clues' | 'voting' | 'reveal';
  topicId: string;
  secretWordIndex: number;
  chameleonId: string;
  clues: Record<string, string>;
  votes: Record<string, string>;
  escapedGuessIndex?: number | null;
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
  const [peekRole, setPeekRole] = useState<boolean>(false);
  const [activeLocalPlayerIdx, setActiveLocalPlayerIdx] = useState<number>(0);
  const [clueText, setClueText] = useState<string>('');

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

  const handleSubmitClue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clueText.trim()) return;
    const nextClues = {
      ...(gameData.clues || {}),
      [currentViewerId]: clueText.trim(),
    };
    setClueText('');
    setPeekRole(false);

    if (isPassAndPlay && activeLocalPlayerIdx + 1 < players.length) {
      setActiveLocalPlayerIdx(activeLocalPlayerIdx + 1);
    }

    const allSubmitted = players.every((p) => nextClues[p.id]);
    onUpdateGameData({
      ...gameData,
      clues: nextClues,
      phase: allSubmitted ? 'voting' : 'clues',
    });
  };

  const handleCastVote = (suspectId: string) => {
    const nextVotes = {
      ...(gameData.votes || {}),
      [currentViewerId]: suspectId,
    };

    if (isPassAndPlay && activeLocalPlayerIdx + 1 < players.length) {
      setActiveLocalPlayerIdx(activeLocalPlayerIdx + 1);
      onUpdateGameData({
        ...gameData,
        votes: nextVotes,
      });
      return;
    }

    const allVoted = players.every((p) => nextVotes[p.id]);
    if (allVoted || isPassAndPlay) {
      finishVotingAndScore(nextVotes);
    } else {
      onUpdateGameData({
        ...gameData,
        votes: nextVotes,
      });
    }
  };

  const finishVotingAndScore = (finalVotes: Record<string, string>) => {
    // Count votes
    const tally: Record<string, number> = {};
    Object.values(finalVotes).forEach((votedId) => {
      tally[votedId] = (tally[votedId] || 0) + 1;
    });

    let topSuspectId = '';
    let maxVotes = 0;
    Object.entries(tally).forEach(([pid, count]) => {
      if (count > maxVotes) {
        maxVotes = count;
        topSuspectId = pid;
      }
    });

    const caughtChameleon = topSuspectId === gameData.chameleonId;
    const awards: Record<string, number> = {};

    if (caughtChameleon) {
      // Everyone who voted for the Chameleon gets +3 points!
      Object.entries(finalVotes).forEach(([voterId, suspectId]) => {
        if (suspectId === gameData.chameleonId && voterId !== gameData.chameleonId) {
          awards[voterId] = 3;
        }
      });
    } else {
      // Chameleon escaped! +4 points to Chameleon!
      awards[gameData.chameleonId] = 4;
    }

    onUpdateGameData(
      {
        ...gameData,
        votes: finalVotes,
        phase: 'reveal',
      },
      awards
    );
  };

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="cartoon-card bg-[#ffca3a] p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-11 h-11 rounded-2xl bg-[#161426] text-[#ffca3a] flex items-center justify-center text-2xl">
            {topic.emoji}
          </div>
          <div>
            <div className="text-xs font-extrabold uppercase text-[#161426]/70">
              {lang === 'ar' ? 'موضوع اللوحة السرية' : 'Secret Topic Board'}
            </div>
            <h2 className="text-xl md:text-2xl font-extrabold text-[#161426]">
              {lang === 'ar' ? topic.title_ar : topic.title_en}
            </h2>
          </div>
        </div>

        {(isHost || isPassAndPlay) && (
          <button
            type="button"
            onClick={() => {
              setPeekRole(false);
              setActiveLocalPlayerIdx(0);
              onStartNewRound();
            }}
            className="cartoon-btn bg-white text-[#161426] px-3.5 py-2 text-sm flex items-center gap-1.5"
          >
            <ArrowsClockwise weight="bold" className="w-4 h-4" />
            <span>{lang === 'ar' ? 'جولة / موضوع جديد' : 'New Topic Round'}</span>
          </button>
        )}
      </div>

      {/* Pass & Play Player Switcher Bar */}
      {isPassAndPlay && gameData.phase !== 'reveal' && (
        <div className="cartoon-panel-dark p-3.5 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm font-extrabold">
            <Sparkle weight="fill" className="w-5 h-5 text-[#ffca3a]" />
            <span>
              {lang === 'ar' ? 'الدور هلق على الجهاز لـ:' : 'Current Player on Device:'}
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

      {/* Secret Role Anti-Spoiler Peek Box */}
      {gameData.phase !== 'reveal' && (
        <div className="cartoon-card p-4 text-center space-y-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 font-extrabold text-[#161426]">
              <Detective weight="fill" className="w-6 h-6 text-[#ff595e]" />
              <span>
                {lang === 'ar'
                  ? `بطاقة الدور السرية (${currentViewer?.name || ''})`
                  : `Secret Role Card (${currentViewer?.name || ''})`}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setPeekRole(!peekRole)}
              className={`cartoon-btn px-4 py-2 text-sm flex items-center gap-2 ${
                peekRole ? 'bg-[#ff595e] text-white' : 'bg-[#8ac926] text-[#161426]'
              }`}
            >
              {peekRole ? (
                <>
                  <EyeSlash weight="bold" className="w-5 h-5" />
                  <span>{lang === 'ar' ? 'خبّي دوري هلق!' : 'Hide My Role!'}</span>
                </>
              ) : (
                <>
                  <Eye weight="bold" className="w-5 h-5" />
                  <span>
                    {lang === 'ar'
                      ? 'اضغط لتشوف الكلمة أو إذا إنت برّا السالفة!'
                      : 'Click to Peek Your Secret Role!'}
                  </span>
                </>
              )}
            </button>
          </div>

          {peekRole && (
            <div
              className={`p-4 rounded-2xl border-4 border-[#161426] font-extrabold text-lg animate-in zoom-in-95 duration-150 ${
                isViewerChameleon
                  ? 'bg-[#ff595e] text-white'
                  : 'bg-[#8ac926] text-[#161426]'
              }`}
            >
              {isViewerChameleon ? (
                <div>
                  <div className="text-2xl mb-1">
                    🕵️‍♂️ {lang === 'ar' ? 'إنت برّا السالفة (الحرباية)!' : 'You are the CHAMELEON!'}
                  </div>
                  <p className="text-sm opacity-95">
                    {lang === 'ar'
                      ? 'ما بتعرف شو هي الكلمة السرية! شوف الـ 16 كلمة تحت ومثّل إنك عارفها بدون ما يكشفوك!'
                      : 'You don’t know the secret word! Blend in using the 16 words below!'}
                  </p>
                </div>
              ) : (
                <div>
                  <div className="text-sm uppercase opacity-80">
                    {lang === 'ar' ? 'الكلمة السرية هي:' : 'The Secret Word is:'}
                  </div>
                  <div className="text-3xl mt-0.5">✨ {secretWord} ✨</div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 4x4 Cartoon Topic Words Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {words.map((w, idx) => {
          const isSecret = idx === gameData.secretWordIndex;
          const highlightSecret =
            gameData.phase === 'reveal' || (peekRole && !isViewerChameleon && isSecret);

          return (
            <div
              key={idx}
              className={`p-3.5 rounded-2xl border-4 border-[#161426] font-extrabold text-center text-base md:text-lg transition-all ${
                highlightSecret
                  ? 'bg-[#8ac926] text-[#161426] scale-105 shadow-[0_6px_0_#161426] ring-4 ring-[#ffca3a]'
                  : 'bg-[#fff9ec] text-[#161426] shadow-[0_5px_0_#161426]'
              }`}
            >
              {w}
            </div>
          );
        })}
      </div>

      {/* PHASE 1: Giving Clues */}
      {gameData.phase === 'clues' && (
        <div className="cartoon-card p-5 space-y-4">
          <h3 className="font-extrabold text-lg text-[#161426]">
            💬{' '}
            {lang === 'ar'
              ? 'الخطوة 1: كل لاعب يعطي تلميح بكلمة وحدة!'
              : 'Step 1: Each player gives a 1-word clue!'}
          </h3>

          {/* Existing Clues */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {players.map((p) => {
              const pClue = gameData.clues?.[p.id];
              return (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-3 rounded-2xl bg-white border-3 border-[#161426]"
                >
                  <div className="flex items-center gap-2">
                    <span
                      style={{ backgroundColor: p.avatar_color }}
                      className="w-7 h-7 rounded-full border-2 border-[#161426] inline-flex items-center justify-center font-extrabold text-xs text-[#161426]"
                    >
                      {p.name.slice(0, 1)}
                    </span>
                    <span className="font-extrabold text-sm text-[#161426]">{p.name}</span>
                  </div>
                  {pClue ? (
                    <span className="cartoon-badge bg-[#ffca3a] text-[#161426] px-3 py-0.5 text-sm">
                      &ldquo;{pClue}&rdquo;
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-gray-400">
                      {lang === 'ar' ? 'عم يفكر...' : 'Thinking...'}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Clue Input Form */}
          <form onSubmit={handleSubmitClue} className="flex flex-col sm:flex-row gap-2.5">
            <input
              type="text"
              maxLength={35}
              value={clueText}
              onChange={(e) => setClueText(e.target.value)}
              placeholder={
                lang === 'ar'
                  ? `اكتب تلميح ${currentViewer?.name || ''} هون...`
                  : `Type ${currentViewer?.name || 'your'} clue...`
              }
              className="cartoon-input min-w-0 flex-1 px-4 py-2.5 bg-white text-[#161426]"
            />
            <button
              type="submit"
              className="cartoon-btn bg-[#00bbf9] text-[#161426] px-5 py-2.5 flex items-center justify-center gap-2 shrink-0"
            >
              <PaperPlaneTilt weight="fill" className="w-5 h-5" />
              <span>{lang === 'ar' ? 'إرسال التلميح' : 'Send Clue'}</span>
            </button>
          </form>

          {(isHost || isPassAndPlay) && (
            <button
              type="button"
              onClick={() => onUpdateGameData({ ...gameData, phase: 'voting' })}
              className="cartoon-btn bg-[#ff924c] text-[#161426] w-full py-2.5 text-base"
            >
              🗳️ {lang === 'ar' ? 'الانتقال للتصويت وكشف الجاسوس!' : 'Proceed to Voting!'}
            </button>
          )}
        </div>
      )}

      {/* PHASE 2: Voting for the Chameleon */}
      {gameData.phase === 'voting' && (
        <div className="cartoon-card p-5 space-y-4 text-center">
          <h3 className="font-extrabold text-xl text-[#161426]">
            🕵️‍♂️{' '}
            {lang === 'ar'
              ? 'وقت الاتهام! مين برأيكم اللي برّا السالفة؟'
              : 'Who is the Chameleon? Cast your vote!'}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {players.map((p) => {
              const myVote = gameData.votes?.[currentViewerId];
              const isSelected = myVote === p.id;
              const pClue = gameData.clues?.[p.id];
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleCastVote(p.id)}
                  className={`cartoon-btn p-3.5 flex items-center justify-between ${
                    isSelected
                      ? 'bg-[#ff595e] text-white'
                      : 'bg-white hover:bg-[#fff3d1] text-[#161426]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      style={{ backgroundColor: p.avatar_color }}
                      className="w-9 h-9 rounded-full border-3 border-[#161426] flex items-center justify-center font-extrabold text-[#161426]"
                    >
                      {p.name.slice(0, 1)}
                    </span>
                    <div className="text-start">
                      <div className="font-extrabold text-base">{p.name}</div>
                      {pClue && (
                        <div className="text-xs opacity-80">
                          {lang === 'ar' ? 'تلميحه:' : 'Clue:'} &ldquo;{pClue}&rdquo;
                        </div>
                      )}
                    </div>
                  </div>
                  {isSelected && <UserCheck weight="fill" className="w-6 h-6" />}
                </button>
              );
            })}
          </div>

          {(isHost || isPassAndPlay) && (
            <button
              type="button"
              onClick={() => finishVotingAndScore(gameData.votes || {})}
              className="cartoon-btn bg-[#8ac926] text-[#161426] w-full py-3 text-lg"
            >
              🎉 {lang === 'ar' ? 'اكشف مين اللي برّا السالفة!' : 'Reveal the Chameleon!'}
            </button>
          )}
        </div>
      )}

      {/* PHASE 3: Reveal */}
      {gameData.phase === 'reveal' && (
        <div className="cartoon-card p-6 text-center space-y-4 animate-in zoom-in-95 duration-200">
          <div className="inline-flex items-center gap-2 cartoon-badge bg-[#ff595e] text-white px-4 py-1 text-sm">
            <CheckCircle weight="fill" className="w-5 h-5" />
            <span>{lang === 'ar' ? 'انكشفت الحقيقة!' : 'Truth Revealed!'}</span>
          </div>

          <div className="text-2xl md:text-3xl font-extrabold text-[#161426]">
            🕵️‍♂️ {lang === 'ar' ? 'اللي كان برّا السالفة هو:' : 'The Chameleon was:'}{' '}
            <span className="text-[#ff595e] underline">{chameleonPlayer?.name || '!'}</span>
          </div>

          <div className="p-4 rounded-2xl bg-[#8ac926] border-4 border-[#161426] text-[#161426] font-extrabold text-xl">
            {lang === 'ar' ? 'الكلمة السرية كانت:' : 'The Secret Word was:'} &ldquo;{secretWord}&rdquo;
          </div>

          <button
            type="button"
            onClick={() => {
              setPeekRole(false);
              setActiveLocalPlayerIdx(0);
              onStartNewRound();
            }}
            className="cartoon-btn bg-[#ffca3a] text-[#161426] w-full py-3.5 text-xl"
          >
            {lang === 'ar' ? 'جولة جديدة من برّا السالفة! 🔄' : 'Play Next Chameleon Round! 🔄'}
          </button>
        </div>
      )}
    </div>
  );
};
