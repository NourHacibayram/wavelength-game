import React, { useState, useRef, useEffect } from 'react';
import { FAKE_ARTIST_PROMPTS } from '../data/extraGamesData';
import {
  PaintBrush,
  Eye,
  EyeSlash,
  Detective,
  CheckCircle,
  ArrowCounterClockwise,
  ArrowsClockwise,
  PaperPlaneTilt,
  Trophy,
  WarningCircle,
} from '@phosphor-icons/react';

export interface SharedStroke {
  authorId: string;
  color: string;
  pts: number[];
}

export interface FakeArtistGameState {
  phase: 'strokes' | 'voting' | 'fake_guess' | 'reveal';
  promptId: number;
  fakeArtistId: string;
  turnIndex: number;
  strokes: SharedStroke[];
  votes: Record<string, string>;
  caughtFake?: boolean;
  fakeGuessText?: string;
  fakeGuessedRight?: boolean;
}

interface PlayerInfo {
  id: string;
  name: string;
  avatar_color: string;
  score: number;
}

interface FakeArtistGameProps {
  gameData: FakeArtistGameState;
  players: PlayerInfo[];
  myPlayerId: string;
  isHost: boolean;
  isPassAndPlay: boolean;
  lang: 'ar' | 'en';
  onUpdateGameData: (nextData: FakeArtistGameState, scoreAwards?: Record<string, number>) => void;
  onStartNewRound: () => void;
}

function normWord(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي');
}

const DISTINCT_BRUSH_COLORS = [
  '#e63946',
  '#1982c4',
  '#38b000',
  '#ff924c',
  '#9b5de5',
  '#f15bb5',
  '#00b4d8',
  '#d97706',
];

export const FakeArtistGame: React.FC<FakeArtistGameProps> = ({
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
  const [draftPts, setDraftPts] = useState<number[]>([]);
  const [isDrawingStroke, setIsDrawingStroke] = useState<boolean>(false);
  const [activeVoteIdx, setActiveVoteIdx] = useState<number>(0);
  const [fakeGuessInput, setFakeGuessInput] = useState<string>('');

  const svgRef = useRef<SVGSVGElement | null>(null);
  const drawingNowRef = useRef<boolean>(false);
  const lockedScrollYRef = useRef<number>(0);

  useEffect(() => {
    const keepScrollLocked = () => {
      if (drawingNowRef.current && window.scrollY !== lockedScrollYRef.current) {
        window.scrollTo(window.scrollX, lockedScrollYRef.current);
      }
    };
    window.addEventListener('scroll', keepScrollLocked, { passive: true });
    return () => window.removeEventListener('scroll', keepScrollLocked);
  }, []);

  const prompt =
    FAKE_ARTIST_PROMPTS.find((p) => p.id === gameData.promptId) ||
    FAKE_ARTIST_PROMPTS[0];

  const totalTurns = Math.max(2, players.length * 2);
  const activePlayerIdx = (gameData.turnIndex || 0) % Math.max(1, players.length);
  const activeDrawer = players[activePlayerIdx] || players[0];
  const activeBrushColor =
    DISTINCT_BRUSH_COLORS[activePlayerIdx % DISTINCT_BRUSH_COLORS.length];

  const viewerId = isPassAndPlay
    ? gameData.phase === 'voting'
      ? players[activeVoteIdx]?.id || myPlayerId
      : activeDrawer?.id || myPlayerId
    : myPlayerId;
  const viewerPlayer = players.find((p) => p.id === viewerId);
  const isViewerFake = viewerId === gameData.fakeArtistId;
  const fakePlayer = players.find((p) => p.id === gameData.fakeArtistId);

  const canDrawThisTurn =
    gameData.phase === 'strokes' &&
    (isPassAndPlay || myPlayerId === activeDrawer?.id);

  const getCoords = (e: React.PointerEvent<SVGSVGElement>): [number, number] => {
    const svg = svgRef.current;
    if (!svg) return [150, 150];
    const r = svg.getBoundingClientRect();
    const x = Math.round(((e.clientX - r.left) / r.width) * 300);
    const y = Math.round(((e.clientY - r.top) / r.height) * 300);
    return [Math.max(0, Math.min(300, x)), Math.max(0, Math.min(300, y))];
  };

  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!canDrawThisTurn || draftPts.length > 0) return; // ONE continuous stroke only unless reset!
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    lockedScrollYRef.current = window.scrollY;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Ignore if pointer capture is unsupported
    }
    drawingNowRef.current = true;
    setIsDrawingStroke(true);
    const [x, y] = getCoords(e);
    setDraftPts([x, y]);
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!drawingNowRef.current) return;
    e.preventDefault();
    e.stopPropagation();
    if (window.scrollY !== lockedScrollYRef.current) {
      window.scrollTo(window.scrollX, lockedScrollYRef.current);
    }
    const [x, y] = getCoords(e);
    setDraftPts((prev) => {
      if (prev.length < 2) return [x, y];
      const lx = prev[prev.length - 2];
      const ly = prev[prev.length - 1];
      if (Math.hypot(x - lx, y - ly) < 3.5) return prev;
      return [...prev, x, y];
    });
  };

  const finishDrawingPointer = (e?: React.PointerEvent<SVGSVGElement>) => {
    if (!drawingNowRef.current) return;
    drawingNowRef.current = false;
    setIsDrawingStroke(false);
    if (e) {
      try {
        if (e.currentTarget.hasPointerCapture?.(e.pointerId)) {
          e.currentTarget.releasePointerCapture(e.pointerId);
        }
      } catch {
        // Ignore release errors
      }
    }
  };

  const handleCommitSingleStroke = () => {
    if (draftPts.length < 2 || !activeDrawer) return;
    const nextStrokes: SharedStroke[] = [
      ...(gameData.strokes || []),
      {
        authorId: activeDrawer.id,
        color: activeBrushColor,
        pts: draftPts,
      },
    ];
    const nextTurn = (gameData.turnIndex || 0) + 1;
    setDraftPts([]);
    if (isPassAndPlay) setPeekRole(false);

    onUpdateGameData({
      ...gameData,
      strokes: nextStrokes,
      turnIndex: nextTurn,
      phase: nextTurn >= totalTurns ? 'voting' : 'strokes',
    });
  };

  const handleVoteSuspect = (suspectId: string) => {
    const nextVotes = {
      ...(gameData.votes || {}),
      [viewerId]: suspectId,
    };

    if (isPassAndPlay && activeVoteIdx + 1 < players.length) {
      setActiveVoteIdx(activeVoteIdx + 1);
      onUpdateGameData({ ...gameData, votes: nextVotes });
      return;
    }

    const allVoted = players.every((p) => Boolean(nextVotes[p.id]));
    if (allVoted) {
      evaluateVoteOutcome(nextVotes);
    } else {
      onUpdateGameData({ ...gameData, votes: nextVotes });
    }
  };

  const evaluateVoteOutcome = (finalVotes: Record<string, string>) => {
    const tally: Record<string, number> = {};
    Object.values(finalVotes).forEach((sid) => {
      tally[sid] = (tally[sid] || 0) + 1;
    });

    let maxVotes = 0;
    let topSuspects: string[] = [];
    Object.entries(tally).forEach(([sid, count]) => {
      if (count > maxVotes) {
        maxVotes = count;
        topSuspects = [sid];
      } else if (count === maxVotes) {
        topSuspects.push(sid);
      }
    });

    const caught = topSuspects.length === 1 && topSuspects[0] === gameData.fakeArtistId;

    if (caught) {
      onUpdateGameData({
        ...gameData,
        votes: finalVotes,
        caughtFake: true,
        phase: 'fake_guess',
      });
    } else {
      // Fake Artist escaped! +3 pts
      const awards: Record<string, number> = {
        [gameData.fakeArtistId]: 3,
      };
      onUpdateGameData(
        {
          ...gameData,
          votes: finalVotes,
          caughtFake: false,
          phase: 'reveal',
        },
        awards
      );
    }
  };

  const handleFakeFinalGuess = (wordChoice: string) => {
    const targetAr = normWord(prompt.word_ar);
    const targetEn = normWord(prompt.word_en);
    const clean = normWord(wordChoice);
    const guessedRight = clean === targetAr || clean === targetEn;

    const awards: Record<string, number> = {};
    if (guessedRight) {
      awards[gameData.fakeArtistId] = 2;
    } else {
      players.forEach((p) => {
        if (p.id !== gameData.fakeArtistId) {
          awards[p.id] = 2;
        }
      });
    }

    setFakeGuessInput('');
    onUpdateGameData(
      {
        ...gameData,
        fakeGuessText: wordChoice,
        fakeGuessedRight: guessedRight,
        phase: 'reveal',
      },
      awards
    );
  };

  // Build 8 multiple-choice options in same/mixed categories so Fake Artist can click or type!
  const guessOptions = React.useMemo(() => {
    const sameCat = FAKE_ARTIST_PROMPTS.filter(
      (p) => p.category_en === prompt.category_en && p.id !== prompt.id
    );
    const others = FAKE_ARTIST_PROMPTS.filter(
      (p) => p.category_en !== prompt.category_en
    );
    const decoys = [...sameCat, ...others.slice(0, 5)].slice(0, 7);
    return [prompt, ...decoys].sort((a, b) => ((a.id * 7) % 13) - ((b.id * 7) % 13));
  }, [prompt]);

  const renderSvgPath = (pts: number[], color: string, key: string | number, dashed = false) => {
    if (!pts || pts.length < 2) return null;
    if (pts.length === 2) {
      return <circle key={key} cx={pts[0]} cy={pts[1]} r={4} fill={color} />;
    }
    let d = `M ${pts[0]} ${pts[1]}`;
    for (let i = 2; i < pts.length; i += 2) {
      d += ` L ${pts[i]} ${pts[i + 1]}`;
    }
    return (
      <path
        key={key}
        d={d}
        fill="none"
        stroke={color}
        strokeWidth="6.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={dashed ? '6 4' : undefined}
      />
    );
  };

  return (
    <div className="space-y-3 select-none [overflow-anchor:none]">
      {/* Top Role & Category Bar */}
      <div className="cartoon-card bg-[#ff924c] text-[#161426] px-5 py-3.5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs font-extrabold uppercase flex items-center gap-1.5">
            <PaintBrush weight="fill" className="w-4 h-4" />
            <span>
              {lang === 'ar'
                ? `التصنيف العلني للجميع: ${prompt.category_ar}`
                : `Public Category: ${prompt.category_en}`}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold mt-0.5">
            {lang === 'ar'
              ? 'الفنان المزيّف — خط واحد لكل لاعب!'
              : 'Fake Artist — One Continuous Stroke Each!'}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPeekRole(!peekRole)}
            className="cartoon-btn bg-[#161426] text-[#ffca3a] px-3.5 py-2 text-xs flex items-center gap-1.5"
          >
            {peekRole ? <EyeSlash className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            <span>
              {peekRole
                ? lang === 'ar'
                  ? 'إخفاء دوري'
                  : 'Hide Role'
                : lang === 'ar'
                ? `اكشف دور (${viewerPlayer?.name || ''})`
                : 'Peek Secret Role'}
            </span>
          </button>

          {(isHost || isPassAndPlay) && (
            <button
              type="button"
              onClick={() => {
                setDraftPts([]);
                setIsDrawingStroke(false);
                drawingNowRef.current = false;
                setActiveVoteIdx(0);
                onStartNewRound();
              }}
              className="cartoon-btn bg-white text-[#161426] px-3 py-2 text-xs flex items-center gap-1"
            >
              <ArrowsClockwise weight="bold" className="w-4 h-4" />
              <span>{lang === 'ar' ? 'جديد' : 'New'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Secret Role Banner */}
      {peekRole && gameData.phase !== 'reveal' && (
        <div
          className={`px-4 py-2.5 rounded-2xl border-4 border-[#161426] shadow-[0_5px_0_#161426] text-center ${
            isViewerFake ? 'bg-[#ff595e] text-white' : 'bg-[#fff1c2] text-[#161426]'
          }`}
        >
          {isViewerFake ? (
            <div className="space-y-0.5">
              <div className="font-extrabold text-lg sm:text-xl flex items-center justify-center gap-2">
                <Detective weight="fill" className="w-6 h-6 text-[#ffca3a]" />
                <span>
                  {lang === 'ar'
                    ? 'أنت الفنان المزيّف! ما بتعرف شو الكلمة!'
                    : 'You are the FAKE ARTIST!'}
                </span>
              </div>
              <p className="text-xs font-bold opacity-95">
                {lang === 'ar'
                  ? `التصنيف هو (${prompt.category_ar}) — راقب خطوط البقية وارسم خطاً ذكياً لتموّه حالك!`
                  : `Category is (${prompt.category_en}) — blend in with one clever stroke!`}
              </p>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-center gap-2">
              <span className="text-xs sm:text-sm font-extrabold text-[#3f3b5c]">
                {lang === 'ar'
                  ? 'أنت فنان حقيقي — الكلمة السرية المطلوب رسمها:'
                  : 'Real Artist — Secret Word to Draw:'}
              </span>
              <span className="text-2xl sm:text-3xl font-extrabold text-[#161426]">
                {lang === 'ar' ? prompt.word_ar : prompt.word_en}
              </span>
            </div>
          )}
        </div>
      )}

      {/* SHARED CANVAS + PLAYER COLOR LEGEND */}
      <div className="cartoon-card p-4 sm:p-5 space-y-3.5">
        {/* Color Legend & Turn Status */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            {players.map((p, idx) => {
              const col = DISTINCT_BRUSH_COLORS[idx % DISTINCT_BRUSH_COLORS.length];
              const isTurn = gameData.phase === 'strokes' && p.id === activeDrawer?.id;
              return (
                <span
                  key={p.id}
                  style={{ borderColor: '#161426', backgroundColor: isTurn ? col : '#ffffff' }}
                  className={`cartoon-badge px-3 py-1 text-xs flex items-center gap-1.5 ${
                    isTurn ? 'text-white scale-105' : 'text-[#161426]'
                  }`}
                >
                  <span
                    style={{ backgroundColor: col }}
                    className="w-3.5 h-3.5 rounded-full border-2 border-[#161426] inline-block"
                  />
                  <span>{p.name}</span>
                </span>
              );
            })}
          </div>

          <span className="cartoon-badge bg-[#161426] text-[#ffca3a] px-3 py-1 text-xs">
            {lang === 'ar'
              ? `الخط ${Math.min(totalTurns, (gameData.turnIndex || 0) + 1)} من ${totalTurns}`
              : `Stroke ${Math.min(totalTurns, (gameData.turnIndex || 0) + 1)} / ${totalTurns}`}
          </span>
        </div>

        {/* Shared 300x300 SVG Canvas — Locked Touch/Drag/Scroll Geometry */}
        <div
          onDragStart={(e) => e.preventDefault()}
          className="max-w-[315px] mx-auto aspect-square rounded-3xl overflow-hidden border-4 border-[#161426] shadow-[0_6px_0_#161426] bg-white touch-none select-none"
        >
          <svg
            ref={svgRef}
            viewBox="0 0 300 300"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={finishDrawingPointer}
            onPointerCancel={finishDrawingPointer}
            onLostPointerCapture={finishDrawingPointer}
            onDragStart={(e) => e.preventDefault()}
            onContextMenu={(e) => e.preventDefault()}
            style={{ touchAction: 'none', userSelect: 'none', WebkitUserSelect: 'none' }}
            className={`w-full h-full block touch-none select-none ${
              canDrawThisTurn && draftPts.length === 0 ? 'cursor-crosshair' : 'cursor-default'
            }`}
          >
            {(gameData.strokes || []).map((s, idx) =>
              renderSvgPath(s.pts, s.color, idx)
            )}
            {draftPts.length > 0 &&
              renderSvgPath(draftPts, activeBrushColor, 'draft', true)}
          </svg>
        </div>

        {/* PHASE CONTROLS — Fixed-Height Action Bar (Zero Layout Jump During Drawing!) */}
        {gameData.phase === 'strokes' && (
          <div className="space-y-2.5 text-center">
            {canDrawThisTurn ? (
              <>
                <p className="font-extrabold text-sm text-[#161426] min-h-[1.5rem] flex items-center justify-center">
                  {draftPts.length === 0
                    ? lang === 'ar'
                      ? `دور (${activeDrawer?.name})! ارسم خطاً واحداً متصلاً بدون رفع إصبعك!`
                      : `${activeDrawer?.name}’s turn! Draw ONE single continuous stroke!`
                    : isDrawingStroke
                    ? lang === 'ar'
                      ? 'كمّل خطك المتصل ثم ارفع يدك لاعتماده...'
                      : 'Finish your single continuous stroke, then lift to confirm...'
                    : lang === 'ar'
                    ? 'تمام! اعتمد خطك أو امسحه لتعيد رسمه:'
                    : 'Great! Confirm your single stroke or redraw it:'}
                </p>

                <div className="flex flex-wrap gap-2.5 justify-center">
                  <button
                    type="button"
                    disabled={draftPts.length === 0 || isDrawingStroke}
                    onClick={() => {
                      drawingNowRef.current = false;
                      setIsDrawingStroke(false);
                      setDraftPts([]);
                    }}
                    className="cartoon-btn bg-[#ffe4e6] text-[#161426] px-4 py-2.5 text-sm flex items-center gap-1.5"
                  >
                    <ArrowCounterClockwise weight="bold" className="w-4 h-4" />
                    <span>{lang === 'ar' ? 'إعادة رسم خطي' : 'Redraw Stroke'}</span>
                  </button>
                  <button
                    type="button"
                    disabled={draftPts.length === 0 || isDrawingStroke}
                    onClick={handleCommitSingleStroke}
                    className="cartoon-btn bg-[#8ac926] text-[#161426] px-6 py-2.5 text-base flex items-center gap-1.5"
                  >
                    <CheckCircle weight="fill" className="w-5 h-5" />
                    <span>{lang === 'ar' ? 'اعتماد خطي وتمرير الدور' : 'Lock My Stroke'}</span>
                  </button>
                </div>
              </>
            ) : (
              <div className="p-3 rounded-2xl bg-[#191636] text-[#ffca3a] font-extrabold text-sm">
                {lang === 'ar'
                  ? `بانتظار (${activeDrawer?.name}) ليرسم خطه الواحد عاللوحة...`
                  : `Waiting for ${activeDrawer?.name} to draw their single stroke...`}
              </div>
            )}

            {(gameData.strokes || []).length >= players.length && (isHost || isPassAndPlay) && (
              <button
                type="button"
                onClick={() => onUpdateGameData({ ...gameData, phase: 'voting' })}
                className="cartoon-btn bg-[#ff595e] text-white px-4 py-2 text-xs inline-flex items-center gap-1.5"
              >
                <Detective weight="fill" className="w-4 h-4" />
                <span>{lang === 'ar' ? 'انتقل للتصويت الآن' : 'Jump to Voting Now'}</span>
              </button>
            )}
          </div>
        )}

        {/* VOTING PHASE */}
        {gameData.phase === 'voting' && (
          <div className="space-y-3 pt-2 border-t-3 border-[#161426]/15">
            <h3 className="font-extrabold text-lg text-[#161426] text-center">
              {lang === 'ar'
                ? isPassAndPlay
                  ? `تصويت (${viewerPlayer?.name}): مين الفنان المزيّف صاحب الخط المريب؟`
                  : 'صوّتوا الآن: مين الفنان المزيّف بينكم؟'
                : 'Vote Now: Who is the Fake Artist?'}
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {players.map((p, idx) => {
                const col = DISTINCT_BRUSH_COLORS[idx % DISTINCT_BRUSH_COLORS.length];
                const myVoted = gameData.votes?.[viewerId] === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleVoteSuspect(p.id)}
                    className={`cartoon-btn p-3 text-sm flex items-center justify-between ${
                      myVoted ? 'bg-[#ff595e] text-white' : 'bg-white text-[#161426]'
                    }`}
                  >
                    <span className="flex items-center gap-2 truncate">
                      <span
                        style={{ backgroundColor: col }}
                        className="w-4 h-4 rounded-full border-2 border-[#161426] shrink-0"
                      />
                      <span className="truncate">{p.name}</span>
                    </span>
                    {myVoted && <CheckCircle weight="fill" className="w-4 h-4 shrink-0" />}
                  </button>
                );
              })}
            </div>

            {isHost && Object.keys(gameData.votes || {}).length > 0 && (
              <button
                type="button"
                onClick={() => evaluateVoteOutcome(gameData.votes || {})}
                className="cartoon-btn bg-[#ffca3a] text-[#161426] w-full py-2.5 text-sm"
              >
                {lang === 'ar' ? 'فرز الأصوات الآن' : 'Count Votes Now'}
              </button>
            )}
          </div>
        )}

        {/* FAKE ARTIST CAUGHT -> FINAL GUESS */}
        {gameData.phase === 'fake_guess' && (
          <div className="p-4 rounded-2xl bg-[#fff1c2] border-4 border-[#161426] space-y-3 text-center">
            <div className="font-extrabold text-xl text-[#ff595e] flex items-center justify-center gap-2">
              <WarningCircle weight="fill" className="w-6 h-6" />
              <span>
                {lang === 'ar'
                  ? `لقطنا الفنان المزيّف (${fakePlayer?.name})!`
                  : `Caught the Fake Artist (${fakePlayer?.name})!`}
              </span>
            </div>
            <p className="text-sm font-bold text-[#161426]">
              {lang === 'ar'
                ? 'فرصة أخيرة لسرقة الفوز: شو الكلمة السرية اللي كانوا عم يرسموها؟'
                : 'Last chance to steal the win: What were they actually drawing?'}
            </p>

            {isPassAndPlay || myPlayerId === gameData.fakeArtistId ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {guessOptions.map((opt) => {
                    const label = lang === 'ar' ? opt.word_ar : opt.word_en;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => handleFakeFinalGuess(label)}
                        className="cartoon-btn bg-white hover:bg-[#ffca3a] text-[#161426] py-2 px-3 text-sm"
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (fakeGuessInput.trim()) handleFakeFinalGuess(fakeGuessInput.trim());
                  }}
                  className="flex gap-2"
                >
                  <input
                    type="text"
                    value={fakeGuessInput}
                    onChange={(e) => setFakeGuessInput(e.target.value)}
                    placeholder={lang === 'ar' ? 'أو اكتب تخمينك...' : 'Or type your guess...'}
                    className="cartoon-input min-w-0 flex-1 px-3 py-2 bg-white text-[#161426]"
                  />
                  <button
                    type="submit"
                    className="cartoon-btn bg-[#8ac926] text-[#161426] px-4 py-2 flex items-center gap-1"
                  >
                    <PaperPlaneTilt weight="fill" className="w-4 h-4" />
                  </button>
                </form>
              </div>
            ) : (
              <div className="text-sm font-extrabold text-[#3f3b5c] animate-pulse">
                {lang === 'ar'
                  ? `بانتظار (${fakePlayer?.name}) ليحاول حزر الرسمة...`
                  : `Waiting for ${fakePlayer?.name} to guess the drawing...`}
              </div>
            )}
          </div>
        )}

        {/* REVEAL PHASE */}
        {gameData.phase === 'reveal' && (
          <div className="p-5 rounded-3xl bg-[#191636] text-white border-4 border-[#161426] text-center space-y-3 animate-in zoom-in-95 duration-200">
            <Trophy weight="fill" className="w-11 h-11 text-[#ffca3a] mx-auto" />
            <div className="text-sm font-bold text-[#00bbf9]">
              {lang === 'ar'
                ? `الكلمة السرية كانت: (${prompt.word_ar}) — والفنان المزيّف: (${fakePlayer?.name})`
                : `Secret Word: (${prompt.word_en}) — Fake Artist: (${fakePlayer?.name})`}
            </div>

            <h3 className="text-2xl font-extrabold text-[#ffca3a]">
              {!gameData.caughtFake
                ? lang === 'ar'
                  ? `نجا الفنان المزيّف (${fakePlayer?.name}) من التصويت وكسب +3 نقاط!`
                  : `${fakePlayer?.name} fooled everyone and escaped (+3 pts)!`
                : gameData.fakeGuessedRight
                ? lang === 'ar'
                  ? `انكشف (${fakePlayer?.name}) لكنه حزر الرسمة صح (${gameData.fakeGuessText}) وسرق الفوز!`
                  : `${fakePlayer?.name} was caught, but guessed "${gameData.fakeGuessText}" correctly!`
                : lang === 'ar'
                ? `فاز الفنانون الحقيقيون (+2 لكل فنان)! خمن المزيف "${gameData.fakeGuessText}" خطأ!`
                : `Real Artists Win (+2 pts each)! Fake Artist guessed "${gameData.fakeGuessText}"!`}
            </h3>

            <button
              type="button"
              onClick={() => {
                setDraftPts([]);
                setActiveVoteIdx(0);
                onStartNewRound();
              }}
              className="cartoon-btn bg-[#8ac926] text-[#161426] w-full py-3.5 text-xl flex items-center justify-center gap-2"
            >
              <ArrowsClockwise weight="bold" className="w-6 h-6" />
              <span>{lang === 'ar' ? 'لوحة جديدة!' : 'New Canvas Round!'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
