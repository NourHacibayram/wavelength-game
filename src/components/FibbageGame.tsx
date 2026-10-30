import React, { useState } from 'react';
import { FIBBAGE_QUESTIONS } from '../data/partyGamesData';
import {
  Sparkle,
  PaperPlaneTilt,
  ArrowsClockwise,
  CheckCircle,
  SmileyWink,
  MagnifyingGlass,
  MaskHappy,
  Trophy,
  WarningCircle,
} from '@phosphor-icons/react';

export interface FibbageGameState {
  phase: 'writing' | 'voting' | 'reveal';
  questionId: number;
  lies: Record<string, string>;
  votes: Record<string, string>; // voterId -> targetAuthorId or '__TRUTH__'
}

interface PlayerInfo {
  id: string;
  name: string;
  avatar_color: string;
  score: number;
}

interface FibbageGameProps {
  gameData: FibbageGameState;
  players: PlayerInfo[];
  myPlayerId: string;
  isHost: boolean;
  isPassAndPlay: boolean;
  lang: 'ar' | 'en';
  onUpdateGameData: (nextData: FibbageGameState, scoreAwards?: Record<string, number>) => void;
  onStartNewRound: () => void;
}

export const FibbageGame: React.FC<FibbageGameProps> = ({
  gameData,
  players,
  myPlayerId,
  isHost,
  isPassAndPlay,
  lang,
  onUpdateGameData,
  onStartNewRound,
}) => {
  const [activeLocalIdx, setActiveLocalIdx] = useState<number>(0);
  const [lieInput, setLieInput] = useState<string>('');
  const [warnMsg, setWarnMsg] = useState<string | null>(null);

  const q =
    FIBBAGE_QUESTIONS.find((item) => item.id === gameData.questionId) ||
    FIBBAGE_QUESTIONS[0];
  const questionText = lang === 'ar' ? q.question_ar : q.question_en;
  const truthText = lang === 'ar' ? q.truth_ar : q.truth_en;
  const categoryText = lang === 'ar' ? q.category_ar : q.category_en;

  const currentViewerId = isPassAndPlay
    ? players[activeLocalIdx]?.id || myPlayerId
    : myPlayerId;
  const currentViewer = players.find((p) => p.id === currentViewerId);

  const handleSubmitLie = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = lieInput.trim();
    if (!cleaned) return;

    if (cleaned.toLowerCase() === truthText.toLowerCase()) {
      setWarnMsg(
        lang === 'ar'
          ? 'هاد هو الجواب الحقيقي فعلاً! اكتب كذبة مقنعة لتخدعهم!'
          : 'That’s the actual truth! Write a convincing lie to fool your friends!'
      );
      return;
    }
    setWarnMsg(null);

    const nextLies = {
      ...(gameData.lies || {}),
      [currentViewerId]: cleaned,
    };
    setLieInput('');

    if (isPassAndPlay && activeLocalIdx + 1 < players.length) {
      setActiveLocalIdx(activeLocalIdx + 1);
      onUpdateGameData({
        ...gameData,
        lies: nextLies,
      });
      return;
    }

    const allSubmitted = players.every((p) => nextLies[p.id]);
    onUpdateGameData({
      ...gameData,
      lies: nextLies,
      phase: allSubmitted ? 'voting' : 'writing',
    });
    if (allSubmitted) setActiveLocalIdx(0);
  };

  const options = React.useMemo(() => {
    const items: { id: string; text: string }[] = [
      { id: '__TRUTH__', text: truthText },
    ];
    Object.entries(gameData.lies || {}).forEach(([authorId, text]) => {
      if (text) items.push({ id: authorId, text });
    });
    return items.sort((a, b) => a.text.localeCompare(b.text));
  }, [gameData.lies, truthText]);

  const handleVoteOption = (optionAuthorId: string) => {
    if (optionAuthorId === currentViewerId) return;
    const nextVotes = {
      ...(gameData.votes || {}),
      [currentViewerId]: optionAuthorId,
    };

    if (isPassAndPlay && activeLocalIdx + 1 < players.length) {
      setActiveLocalIdx(activeLocalIdx + 1);
      onUpdateGameData({
        ...gameData,
        votes: nextVotes,
      });
      return;
    }

    const allVoted = players.every((p) => nextVotes[p.id]);
    if (allVoted || isPassAndPlay) {
      finishRoundAndScore(nextVotes);
    } else {
      onUpdateGameData({
        ...gameData,
        votes: nextVotes,
      });
    }
  };

  const finishRoundAndScore = (finalVotes: Record<string, string>) => {
    const awards: Record<string, number> = {};
    Object.entries(finalVotes).forEach(([voterId, chosenId]) => {
      if (chosenId === '__TRUTH__') {
        awards[voterId] = (awards[voterId] || 0) + 3;
      } else if (chosenId && chosenId !== voterId) {
        awards[chosenId] = (awards[chosenId] || 0) + 2;
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

  return (
    <div className="space-y-4">
      {/* Question Card */}
      <div className="cartoon-card bg-[#ffca3a] p-5 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <span className="cartoon-badge bg-[#161426] text-[#ffca3a] px-3.5 py-1 text-xs flex items-center gap-1.5">
            <MaskHappy weight="fill" className="w-4 h-4" />
            <span>{categoryText}</span>
          </span>
          {(isHost || isPassAndPlay) && (
            <button
              type="button"
              onClick={() => {
                setActiveLocalIdx(0);
                setLieInput('');
                onStartNewRound();
              }}
              className="cartoon-btn bg-white text-[#161426] px-3 py-1.5 text-xs flex items-center gap-1"
            >
              <ArrowsClockwise weight="bold" className="w-4 h-4" />
              <span>{lang === 'ar' ? 'سؤال جديد' : 'New Question'}</span>
            </button>
          )}
        </div>

        <h2 className="text-xl md:text-2xl font-extrabold text-[#161426] leading-relaxed text-center py-2">
          {questionText}
        </h2>
      </div>

      {/* Pass & Play Switcher */}
      {isPassAndPlay && gameData.phase !== 'reveal' && (
        <div className="cartoon-panel-dark p-3.5 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm font-extrabold">
            <Sparkle weight="fill" className="w-5 h-5 text-[#ffca3a]" />
            <span>
              {lang === 'ar' ? 'الدور بالسر لـ:' : 'Secret Turn for:'}
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
                onClick={() => setActiveLocalIdx(idx)}
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

      {/* PHASE 1: Writing Lies */}
      {gameData.phase === 'writing' && (
        <div className="cartoon-card p-5 space-y-4">
          <div className="flex items-center gap-2 text-lg font-extrabold text-[#161426]">
            <SmileyWink weight="fill" className="w-7 h-7 text-[#ff595e] shrink-0" />
            <span>
              {lang === 'ar'
                ? 'ألّف جواب كذبي بس مقنع ليصوتوا عليه أصحابك بدل الجواب الصحيح!'
                : 'Write a believable fake answer to trick your friends!'}
            </span>
          </div>

          {warnMsg && (
            <div className="p-3 rounded-2xl bg-[#ff595e] text-white font-extrabold text-sm flex items-center justify-center gap-2">
              <WarningCircle weight="fill" className="w-5 h-5 shrink-0" />
              <span>{warnMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmitLie} className="flex flex-col sm:flex-row gap-2.5">
            <input
              type="text"
              maxLength={45}
              value={lieInput}
              onChange={(e) => setLieInput(e.target.value)}
              placeholder={
                lang === 'ar'
                  ? `اكتب كذبة ${currentViewer?.name || ''} المقنعة هون...`
                  : `Type ${currentViewer?.name || 'your'} convincing lie...`
              }
              className="cartoon-input min-w-0 flex-1 px-4 py-3 bg-white text-[#161426] text-lg"
            />
            <button
              type="submit"
              className="cartoon-btn bg-[#8ac926] text-[#161426] px-5 py-3 text-lg flex items-center justify-center gap-2 shrink-0"
            >
              <PaperPlaneTilt weight="fill" className="w-5 h-5" />
              <span>{lang === 'ar' ? 'إخفاء الكذبة' : 'Submit Lie'}</span>
            </button>
          </form>

          {/* Status of who submitted */}
          <div className="flex flex-wrap gap-2 pt-1">
            {players.map((p) => {
              const done = Boolean(gameData.lies?.[p.id]);
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

          {(isHost || isPassAndPlay) && Object.keys(gameData.lies || {}).length > 0 && (
            <button
              type="button"
              onClick={() => {
                setActiveLocalIdx(0);
                onUpdateGameData({ ...gameData, phase: 'voting' });
              }}
              className="cartoon-btn bg-[#ff924c] text-[#161426] w-full py-2.5 text-base flex items-center justify-center gap-2"
            >
              <MagnifyingGlass weight="bold" className="w-5 h-5" />
              <span>{lang === 'ar' ? 'عرض الخيارات وبدء التصويت!' : 'Show Answers & Start Voting!'}</span>
            </button>
          )}
        </div>
      )}

      {/* PHASE 2: Voting for the Truth */}
      {gameData.phase === 'voting' && (
        <div className="cartoon-card p-5 space-y-4 text-center">
          <h3 className="font-extrabold text-xl text-[#161426] flex items-center justify-center gap-2">
            <MagnifyingGlass weight="bold" className="w-6 h-6 text-[#1982c4]" />
            <span>
              {lang === 'ar'
                ? 'واحد بس من هدول هو الحقيقة والباقي تأليف أصحابك! وين الحقيقة؟'
                : 'Only ONE of these is the real truth! Spot it:'}
            </span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {options.map((opt) => {
              const isMyOwnLie = opt.id === currentViewerId;
              const isSelected = gameData.votes?.[currentViewerId] === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  disabled={isMyOwnLie}
                  onClick={() => handleVoteOption(opt.id)}
                  className={`cartoon-btn p-4 text-lg font-extrabold ${
                    isSelected
                      ? 'bg-[#00bbf9] text-[#161426]'
                      : isMyOwnLie
                      ? 'bg-gray-200 text-gray-500'
                      : 'bg-white hover:bg-[#fff3d1] text-[#161426]'
                  }`}
                >
                  <span>{opt.text}</span>
                  {isMyOwnLie && (
                    <span className="block text-xs mt-1">
                      ({lang === 'ar' ? 'كذبتك إنت' : 'Your Lie'})
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {(isHost || isPassAndPlay) && (
            <button
              type="button"
              onClick={() => finishRoundAndScore(gameData.votes || {})}
              className="cartoon-btn bg-[#8ac926] text-[#161426] w-full py-3 text-lg flex items-center justify-center gap-2"
            >
              <Trophy weight="fill" className="w-6 h-6" />
              <span>{lang === 'ar' ? 'اكشف الجواب الحقيقي ومين انخدع!' : 'Reveal the Truth & Scores!'}</span>
            </button>
          )}
        </div>
      )}

      {/* PHASE 3: Reveal */}
      {gameData.phase === 'reveal' && (
        <div className="cartoon-card p-6 space-y-4">
          <div className="text-center space-y-2">
            <span className="cartoon-badge bg-[#8ac926] text-[#161426] px-4 py-1 text-sm inline-flex items-center gap-1.5">
              <CheckCircle weight="fill" className="w-5 h-5" />
              <span>{lang === 'ar' ? 'الحقيقة الصادمة!' : 'The Real Truth!'}</span>
            </span>
            <div className="text-3xl font-extrabold text-[#161426]">
              &ldquo;{truthText}&rdquo;
            </div>
          </div>

          <div className="space-y-2.5 pt-2">
            {options.map((opt) => {
              const isTruth = opt.id === '__TRUTH__';
              const author = players.find((p) => p.id === opt.id);
              const fooledPlayers = players.filter(
                (p) => gameData.votes?.[p.id] === opt.id
              );

              return (
                <div
                  key={opt.id}
                  className={`p-3.5 rounded-2xl border-4 border-[#161426] flex flex-wrap items-center justify-between gap-2 ${
                    isTruth ? 'bg-[#8ac926] text-[#161426]' : 'bg-white text-[#161426]'
                  }`}
                >
                  <div>
                    <div className="font-extrabold text-lg">&ldquo;{opt.text}&rdquo;</div>
                    <div className="text-xs font-extrabold opacity-80 flex items-center gap-1">
                      {isTruth ? (
                        <>
                          <CheckCircle weight="fill" className="w-4 h-4" />
                          <span>
                            {lang === 'ar'
                              ? 'الجواب الحقيقي (+3 نقاط للي عرفه)'
                              : 'Real Truth (+3 pts)'}
                          </span>
                        </>
                      ) : (
                        <>
                          <SmileyWink weight="fill" className="w-4 h-4 text-[#ff595e]" />
                          <span>
                            {lang === 'ar'
                              ? `كذبة من تأليف: ${author?.name || ''} (+2 عن كل شخص انخدع)`
                              : `Lie written by: ${author?.name || ''}`}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {fooledPlayers.length > 0 ? (
                      fooledPlayers.map((fp) => (
                        <span
                          key={fp.id}
                          className="cartoon-badge bg-[#ffca3a] text-[#161426] px-2.5 py-0.5 text-xs"
                        >
                          {isTruth
                            ? `${fp.name} ✓`
                            : lang === 'ar'
                            ? `انخدع فيها ${fp.name}`
                            : `Fooled ${fp.name}`}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs font-bold opacity-60">
                        {lang === 'ar' ? 'ما حدا صوتلها' : '0 votes'}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => {
              setActiveLocalIdx(0);
              setLieInput('');
              onStartNewRound();
            }}
            className="cartoon-btn bg-[#ffca3a] text-[#161426] w-full py-3.5 text-xl flex items-center justify-center gap-2"
          >
            <ArrowsClockwise weight="bold" className="w-6 h-6" />
            <span>{lang === 'ar' ? 'سؤال جديد من كذّاب بس مقنع!' : 'Next Fibbage Question!'}</span>
          </button>
        </div>
      )}
    </div>
  );
};
