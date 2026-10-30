import React, { useState, useEffect, useRef } from 'react';
import { WITNESS_MONSTERS } from '../data/extraGamesData';
import { MonsterWitnessSvg } from './ExtraGameArt';
import {
  Eye,
  Timer,
  PaintBrush,
  ArrowCounterClockwise,
  Trash,
  CheckCircle,
  PaperPlaneTilt,
  Trophy,
  ArrowsClockwise,
  Sparkle,
} from '@phosphor-icons/react';

export interface DrawingStroke {
  c: string;
  w: number;
  pts: number[]; // flat [x0, y0, x1, y1, ...] in 0..280 coords
}

export interface WitnessGameState {
  phase: 'witness_ready' | 'drawing' | 'gallery_vote' | 'reveal';
  witnessId: string;
  monsterId: number;
  hints: string[];
  drawings: Record<string, DrawingStroke[]>;
  votes: Record<string, string>;
}

interface PlayerInfo {
  id: string;
  name: string;
  avatar_color: string;
  score: number;
}

interface WitnessGameProps {
  gameData: WitnessGameState;
  players: PlayerInfo[];
  myPlayerId: string;
  isHost: boolean;
  isPassAndPlay: boolean;
  lang: 'ar' | 'en';
  onUpdateGameData: (nextData: WitnessGameState, scoreAwards?: Record<string, number>) => void;
  onStartNewRound: () => void;
}

const PALETTE = ['#161426', '#ff595e', '#00bbf9', '#8ac926', '#ffca3a', '#9b5de5', '#ff924c'];

export const StoredDrawingSvg: React.FC<{
  strokes: DrawingStroke[];
  className?: string;
}> = ({ strokes, className = 'w-full h-full' }) => (
  <svg viewBox="0 0 280 280" className={`${className} bg-white select-none`}>
    {(strokes || []).map((st, idx) => {
      if (!st.pts || st.pts.length < 2) return null;
      if (st.pts.length === 2) {
        return (
          <circle
            key={idx}
            cx={st.pts[0]}
            cy={st.pts[1]}
            r={st.w / 2}
            fill={st.c}
          />
        );
      }
      let d = `M ${st.pts[0]} ${st.pts[1]}`;
      for (let i = 2; i < st.pts.length; i += 2) {
        d += ` L ${st.pts[i]} ${st.pts[i + 1]}`;
      }
      return (
        <path
          key={idx}
          d={d}
          fill="none"
          stroke={st.c}
          strokeWidth={st.w}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      );
    })}
  </svg>
);

export const WitnessGame: React.FC<WitnessGameProps> = ({
  gameData,
  players,
  myPlayerId,
  isHost,
  isPassAndPlay,
  lang,
  onUpdateGameData,
}) => {
  const [peekingNow, setPeekingNow] = useState<boolean>(false);
  const [peekSecondsLeft, setPeekSecondsLeft] = useState<number>(10);
  const [strokes, setStrokes] = useState<DrawingStroke[]>([]);
  const [brushColor, setBrushColor] = useState<string>('#161426');
  const [brushWidth, setBrushWidth] = useState<number>(6);
  const [hintInput, setHintInput] = useState<string>('');
  const [activeLocalArtistIdx, setActiveLocalArtistIdx] = useState<number>(0);

  const svgCanvasRef = useRef<SVGSVGElement | null>(null);
  const isDrawingRef = useRef<boolean>(false);

  const witness = players.find((p) => p.id === gameData.witnessId) || players[0];
  const artists =
    players.length > 1 ? players.filter((p) => p.id !== witness?.id) : players;

  const isWitness = isPassAndPlay
    ? gameData.phase === 'witness_ready'
    : myPlayerId === witness?.id;

  const currentArtist = isPassAndPlay
    ? artists[activeLocalArtistIdx] || artists[0]
    : players.find((p) => p.id === myPlayerId);
  const currentArtistId = currentArtist?.id || myPlayerId;
  const hasSubmittedMyDrawing = Boolean(gameData.drawings?.[currentArtistId]);

  const monster =
    WITNESS_MONSTERS.find((m) => m.id === gameData.monsterId) || WITNESS_MONSTERS[0];

  // 10-second peek timer for Witness!
  useEffect(() => {
    if (!peekingNow) return;
    setPeekSecondsLeft(10);
    const interval = setInterval(() => {
      setPeekSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setPeekingNow(false);
          onUpdateGameData({
            ...gameData,
            phase: 'drawing',
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [peekingNow]);

  const getPointerCoords = (e: React.PointerEvent<SVGSVGElement>): [number, number] => {
    const svg = svgCanvasRef.current;
    if (!svg) return [140, 140];
    const rect = svg.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 280);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 280);
    return [Math.max(0, Math.min(280, x)), Math.max(0, Math.min(280, y))];
  };

  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    isDrawingRef.current = true;
    const [x, y] = getPointerCoords(e);
    setStrokes((prev) => [...prev, { c: brushColor, w: brushWidth, pts: [x, y] }]);
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!isDrawingRef.current) return;
    const [x, y] = getPointerCoords(e);
    setStrokes((prev) => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      const len = last.pts.length;
      const lx = last.pts[len - 2];
      const ly = last.pts[len - 1];
      if (Math.hypot(x - lx, y - ly) < 4) return prev; // downsample for ultra-light JSON
      const updatedLast: DrawingStroke = {
        ...last,
        pts: [...last.pts, x, y],
      };
      return [...prev.slice(0, -1), updatedLast];
    });
  };

  const handlePointerUp = () => {
    isDrawingRef.current = false;
  };

  const handleSendWitnessHint = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hintInput.trim()) return;
    const nextHints = [...(gameData.hints || []), hintInput.trim()];
    setHintInput('');
    onUpdateGameData({
      ...gameData,
      hints: nextHints,
    });
  };

  const handleSubmitDrawing = () => {
    const nextDrawings = {
      ...(gameData.drawings || {}),
      [currentArtistId]: strokes,
    };
    setStrokes([]);

    if (isPassAndPlay && activeLocalArtistIdx + 1 < artists.length) {
      setActiveLocalArtistIdx(activeLocalArtistIdx + 1);
      onUpdateGameData({
        ...gameData,
        drawings: nextDrawings,
      });
      return;
    }

    const allDrawn = artists.every((a) => Boolean(nextDrawings[a.id]));
    onUpdateGameData({
      ...gameData,
      drawings: nextDrawings,
      phase: allDrawn ? 'gallery_vote' : 'drawing',
    });
  };

  const handleVoteDrawing = (artistId: string) => {
    const voterId = isPassAndPlay ? witness?.id || myPlayerId : myPlayerId;
    const nextVotes = {
      ...(gameData.votes || {}),
      [voterId]: artistId,
    };

    const allVoted = isPassAndPlay || players.every((p) => Boolean(nextVotes[p.id]));

    if (allVoted) {
      finalizeWitnessScores(nextVotes);
    } else {
      onUpdateGameData({
        ...gameData,
        votes: nextVotes,
      });
    }
  };

  const finalizeWitnessScores = (finalVotes: Record<string, string>) => {
    const counts: Record<string, number> = {};
    Object.values(finalVotes).forEach((aid) => {
      counts[aid] = (counts[aid] || 0) + 1;
    });

    let topVotes = 0;
    Object.values(counts).forEach((c) => {
      if (c > topVotes) topVotes = c;
    });

    const awards: Record<string, number> = {};
    Object.entries(counts).forEach(([aid, c]) => {
      awards[aid] = c === topVotes && topVotes > 0 ? 3 : 1;
    });
    if (witness && topVotes > 0) {
      awards[witness.id] = (awards[witness.id] || 0) + 2;
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

  const handleNextMonsterRound = () => {
    const curIdx = players.findIndex((p) => p.id === witness?.id);
    const nextWitness = players[(curIdx + 1) % Math.max(1, players.length)] || players[0];
    const otherMonsters = WITNESS_MONSTERS.filter((m) => m.id !== gameData.monsterId);
    const nextM = otherMonsters[Math.floor(Math.random() * otherMonsters.length)] || WITNESS_MONSTERS[0];
    setStrokes([]);
    setActiveLocalArtistIdx(0);
    setPeekingNow(false);

    onUpdateGameData({
      phase: 'witness_ready',
      witnessId: nextWitness.id,
      monsterId: nextM.id,
      hints: [],
      drawings: {},
      votes: {},
    });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="cartoon-card bg-[#00bbf9] text-[#161426] p-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs font-extrabold uppercase flex items-center gap-1.5">
            <Eye weight="fill" className="w-4 h-4" />
            <span>
              {lang === 'ar'
                ? 'الشاهد الوحيد — 10 ثوانٍ لحفظ الكائن العجيب!'
                : 'Sole Witness — 10 Seconds to Memorize the Creature!'}
            </span>
          </div>
          <h2 className="text-2xl font-extrabold mt-0.5">
            {lang === 'ar'
              ? `الشاهد الوحيد: ${witness?.name || ''}`
              : `Sole Witness: ${witness?.name || ''}`}
          </h2>
        </div>

        {(isHost || isPassAndPlay) && (
          <button
            type="button"
            onClick={handleNextMonsterRound}
            className="cartoon-btn bg-white text-[#161426] px-3.5 py-2 text-xs flex items-center gap-1.5"
          >
            <ArrowsClockwise weight="bold" className="w-4 h-4" />
            <span>{lang === 'ar' ? 'كائن جديد' : 'New Monster'}</span>
          </button>
        )}
      </div>

      {/* PHASE 1: WITNESS 10-SECOND PEEK */}
      {gameData.phase === 'witness_ready' && (
        <div className="cartoon-card p-6 text-center space-y-4">
          {isWitness ? (
            peekingNow ? (
              <div className="space-y-3 animate-in zoom-in-95 duration-150">
                <div className="inline-flex items-center gap-2 cartoon-badge bg-[#ff595e] text-white px-5 py-1.5 text-lg animate-pulse">
                  <Timer weight="fill" className="w-6 h-6 text-[#ffca3a]" />
                  <span>
                    {lang === 'ar'
                      ? `احفظ كل التفاصيل! رح يختفي بعد ${peekSecondsLeft} ثوانٍ!`
                      : `Memorize every detail! Vanishing in ${peekSecondsLeft}s!`}
                  </span>
                </div>

                <div className="flex justify-center py-2">
                  <MonsterWitnessSvg monsterId={monster.id} className="w-60 h-60" />
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setPeekingNow(false);
                    onUpdateGameData({ ...gameData, phase: 'drawing' });
                  }}
                  className="cartoon-btn bg-[#8ac926] text-[#161426] px-6 py-2.5 text-base"
                >
                  {lang === 'ar' ? 'حفظته براسي! ابدأوا الرسم الآن' : 'Got It! Start Drawing Now'}
                </button>
              </div>
            ) : (
              <div className="space-y-4 py-3">
                <h3 className="text-2xl font-extrabold text-[#161426]">
                  {lang === 'ar'
                    ? `يا (${witness?.name})، أنت الشاهد الوحيد!`
                    : `${witness?.name}, you are the Sole Witness!`}
                </h3>
                <p className="text-sm font-bold text-[#3f3b5c] max-w-md mx-auto">
                  {lang === 'ar'
                    ? 'رح يطلعلك كائن غريب لمدة 10 ثوانٍ فقط ثم يختفي للأبد! ركّز بعدد عيونه، شكل جسمه، قرونه، إيديه، وتمّه عشان توصفه للرسامين!'
                    : 'You will see a bizarre creature for ONLY 10 seconds before it vanishes! Memorize its shape, eyes, horns, arms, and mouth!'}
                </p>
                <button
                  type="button"
                  onClick={() => setPeekingNow(true)}
                  className="cartoon-btn bg-[#ffca3a] text-[#161426] px-8 py-4 text-xl inline-flex items-center gap-2.5"
                >
                  <Eye weight="fill" className="w-7 h-7" />
                  <span>
                    {lang === 'ar' ? 'اكشف الكائن لمدة 10 ثوانٍ!' : 'Glimpse Creature for 10s!'}
                  </span>
                </button>
              </div>
            )
          ) : (
            <div className="py-8 space-y-2">
              <div className="text-xl font-extrabold text-[#161426] animate-pulse">
                {lang === 'ar'
                  ? `${witness?.name} عم يشاهد الكائن المشتبه به لمدة 10 ثوانٍ...`
                  : `${witness?.name} is glimpsing the creature for 10 seconds...`}
              </div>
              <p className="text-sm font-bold text-[#3f3b5c]">
                {lang === 'ar' ? 'جهّزوا ريشتكم للرسم!' : 'Get your brushes ready!'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* PHASE 2: DRAWING FROM WITNESS DESCRIPTION */}
      {gameData.phase === 'drawing' && (
        <div className="space-y-4">
          {/* Witness Description Log */}
          <div className="cartoon-panel-dark p-4 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs font-extrabold text-[#ffca3a] uppercase flex items-center gap-1.5">
                <Sparkle weight="fill" className="w-4 h-4" />
                <span>
                  {lang === 'ar'
                    ? `أوصاف الشاهد (${witness?.name}) — بالصوت أو الكتابة:`
                    : `Witness (${witness?.name}) Clues:`}
                </span>
              </span>

              {(isHost || myPlayerId === witness?.id) &&
                Object.keys(gameData.drawings || {}).length > 0 && (
                  <button
                    type="button"
                    onClick={() => onUpdateGameData({ ...gameData, phase: 'gallery_vote' })}
                    className="cartoon-btn bg-[#ffca3a] text-[#161426] px-3 py-1 text-xs"
                  >
                    {lang === 'ar' ? 'افتح معرض الرسومات الآن' : 'Open Gallery Now'}
                  </button>
                )}
            </div>

            {(gameData.hints || []).length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {gameData.hints.map((h, i) => (
                  <span
                    key={i}
                    className="cartoon-badge bg-[#ffca3a] text-[#161426] px-3.5 py-1 text-sm"
                  >
                    &ldquo;{h}&rdquo;
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs font-bold text-[#d9d4f7]">
                {lang === 'ar'
                  ? 'الشاهد فيه يوصفلكم الكائن بالصوت مباشرة أو يكتب تفاصيله هون...'
                  : 'The Witness can describe the monster out loud or type hints here...'}
              </p>
            )}

            {(myPlayerId === witness?.id || isPassAndPlay) && (
              <form onSubmit={handleSendWitnessHint} className="flex gap-2">
                <input
                  type="text"
                  maxLength={70}
                  value={hintInput}
                  onChange={(e) => setHintInput(e.target.value)}
                  placeholder={
                    lang === 'ar'
                      ? 'اكتب وصف من ذاكرتك (مثلاً: مثلث أخضر بـ 3 عيون وقرون استشعار)...'
                      : 'Type a memory detail (e.g. green triangle, 3 eyes, antennas)...'
                  }
                  className="cartoon-input min-w-0 flex-1 px-3.5 py-2 bg-white text-[#161426] text-sm"
                />
                <button
                  type="submit"
                  className="cartoon-btn bg-[#8ac926] text-[#161426] px-4 py-2 text-sm flex items-center gap-1 shrink-0"
                >
                  <PaperPlaneTilt weight="fill" className="w-4 h-4" />
                  <span>{lang === 'ar' ? 'إرسال وصف' : 'Add Hint'}</span>
                </button>
              </form>
            )}
          </div>

          {/* Drawing Canvas for Artists */}
          {!isPassAndPlay && myPlayerId === witness?.id && players.length > 1 ? (
            <div className="cartoon-card p-6 text-center space-y-3">
              <h3 className="text-xl font-extrabold text-[#161426]">
                {lang === 'ar'
                  ? 'أنت الشاهد! أوصف الكائن لأصحابك وانتظر إبداعاتهم!'
                  : 'You are the Witness! Describe what you saw while artists sketch!'}
              </h3>
              <div className="flex flex-wrap justify-center gap-2">
                {artists.map((a) => {
                  const done = Boolean(gameData.drawings?.[a.id]);
                  return (
                    <span
                      key={a.id}
                      className={`cartoon-badge px-3 py-1 text-xs ${
                        done ? 'bg-[#8ac926] text-[#161426]' : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {a.name} {done ? '✓ خلّص رسم' : 'عم يرسم...'}
                    </span>
                  );
                })}
              </div>
            </div>
          ) : hasSubmittedMyDrawing && !isPassAndPlay ? (
            <div className="cartoon-card p-6 text-center space-y-2">
              <CheckCircle weight="fill" className="w-12 h-12 text-[#38b000] mx-auto" />
              <div className="text-xl font-extrabold text-[#161426]">
                {lang === 'ar'
                  ? 'تم تسليم لوحتك الفنية! بانتظار باقي الرسامين...'
                  : 'Masterpiece submitted! Waiting for other artists...'}
              </div>
            </div>
          ) : (
            <div className="cartoon-card p-5 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="font-extrabold text-base text-[#161426] flex items-center gap-2">
                  <PaintBrush weight="fill" className="w-5 h-5 text-[#ff595e]" />
                  <span>
                    {lang === 'ar'
                      ? `لوحة الرسام: ${currentArtist?.name || ''}`
                      : `Artist Canvas: ${currentArtist?.name || ''}`}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setStrokes((prev) => prev.slice(0, -1))}
                    className="cartoon-btn bg-[#e0f2fe] text-[#161426] px-3 py-1.5 text-xs flex items-center gap-1"
                  >
                    <ArrowCounterClockwise weight="bold" className="w-4 h-4" />
                    <span>{lang === 'ar' ? 'تراجع' : 'Undo'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setStrokes([])}
                    className="cartoon-btn bg-[#ffe4e6] text-[#161426] px-3 py-1.5 text-xs flex items-center gap-1"
                  >
                    <Trash weight="bold" className="w-4 h-4" />
                    <span>{lang === 'ar' ? 'مسح' : 'Clear'}</span>
                  </button>
                </div>
              </div>

              {/* Color & Size Palette */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {PALETTE.map((col) => (
                    <button
                      key={col}
                      type="button"
                      onClick={() => setBrushColor(col)}
                      style={{ backgroundColor: col }}
                      className={`w-8 h-8 rounded-full border-3 border-[#161426] cursor-pointer transition-transform ${
                        brushColor === col ? 'scale-120 ring-3 ring-[#ffca3a]' : ''
                      }`}
                    />
                  ))}
                </div>

                <div className="flex items-center gap-1.5">
                  {[4, 8, 13].map((sz) => (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => setBrushWidth(sz)}
                      className={`cartoon-badge px-2.5 py-1 text-xs cursor-pointer ${
                        brushWidth === sz ? 'bg-[#ffca3a] text-[#161426]' : 'bg-white text-[#161426]'
                      }`}
                    >
                      {sz === 4 ? (lang === 'ar' ? 'رفيع' : 'Thin') : sz === 8 ? (lang === 'ar' ? 'وسط' : 'Med') : (lang === 'ar' ? 'عريض' : 'Bold')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Interactive Touch/Mouse SVG Canvas */}
              <div className="max-w-[320px] mx-auto aspect-square rounded-3xl overflow-hidden border-4 border-[#161426] shadow-[0_6px_0_#161426] bg-white touch-none">
                <svg
                  ref={svgCanvasRef}
                  viewBox="0 0 280 280"
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerCancel={handlePointerUp}
                  className="w-full h-full cursor-crosshair touch-none"
                >
                  {strokes.map((st, idx) => {
                    if (st.pts.length < 2) return null;
                    if (st.pts.length === 2) {
                      return <circle key={idx} cx={st.pts[0]} cy={st.pts[1]} r={st.w / 2} fill={st.c} />;
                    }
                    let d = `M ${st.pts[0]} ${st.pts[1]}`;
                    for (let i = 2; i < st.pts.length; i += 2) {
                      d += ` L ${st.pts[i]} ${st.pts[i + 1]}`;
                    }
                    return (
                      <path
                        key={idx}
                        d={d}
                        fill="none"
                        stroke={st.c}
                        strokeWidth={st.w}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    );
                  })}
                </svg>
              </div>

              <button
                type="button"
                disabled={strokes.length === 0}
                onClick={handleSubmitDrawing}
                className="cartoon-btn bg-[#8ac926] text-[#161426] w-full py-3.5 text-lg flex items-center justify-center gap-2"
              >
                <CheckCircle weight="fill" className="w-6 h-6" />
                <span>{lang === 'ar' ? 'اعتماد رسمتي وتسليمها!' : 'Submit My Drawing!'}</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* PHASE 3 & 4: SIDE-BY-SIDE GALLERY COMPARISON & VOTING */}
      {(gameData.phase === 'gallery_vote' || gameData.phase === 'reveal') && (
        <div className="cartoon-card p-5 space-y-5 animate-in zoom-in-95 duration-200">
          {/* Real Creature Reveal */}
          <div className="p-4 rounded-3xl bg-[#191636] text-white border-4 border-[#161426] flex flex-col sm:flex-row items-center justify-center gap-5">
            <MonsterWitnessSvg monsterId={monster.id} className="w-40 h-40 shrink-0" />
            <div className="text-center sm:text-start space-y-1">
              <span className="cartoon-badge bg-[#ffca3a] text-[#161426] px-3 py-0.5 text-xs">
                {lang === 'ar' ? 'المشتبه به الحقيقي!' : 'The Actual Creature!'}
              </span>
              <h3 className="text-2xl font-extrabold text-[#ffca3a]">
                {lang === 'ar' ? monster.name_ar : monster.name_en}
              </h3>
              <p className="text-xs font-bold text-[#d9d4f7]">
                {gameData.phase === 'gallery_vote'
                  ? lang === 'ar'
                    ? 'قارنوا الرسومات بالكائن الحقيقي وصوّتوا لأقرب أو أظرف رسمة!'
                    : 'Compare everyone’s sketches with the real monster and vote for the best one!'
                  : lang === 'ar'
                  ? 'نتيجة التصويت على إبداعات الرسامين!'
                  : 'Voting results are in!'}
              </p>
            </div>
          </div>

          {/* Submitted Drawings Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {Object.entries(gameData.drawings || {}).map(([aid, artStrokes]) => {
              const artist = players.find((p) => p.id === aid);
              const voteCount = Object.values(gameData.votes || {}).filter(
                (v) => v === aid
              ).length;
              const myVotedThis = gameData.votes?.[myPlayerId] === aid;

              return (
                <div
                  key={aid}
                  className="p-3 rounded-2xl bg-white border-4 border-[#161426] shadow-[0_5px_0_#161426] flex flex-col justify-between space-y-2.5"
                >
                  <div className="aspect-square rounded-xl overflow-hidden border-3 border-[#161426]">
                    <StoredDrawingSvg strokes={artStrokes} />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-sm text-[#161426]">
                      {artist?.name || 'Artist'}
                    </span>
                    {gameData.phase === 'reveal' && (
                      <span className="cartoon-badge bg-[#ffca3a] text-[#161426] px-2.5 py-0.5 text-xs flex items-center gap-1">
                        <Trophy weight="fill" className="w-3.5 h-3.5" />
                        <span>{voteCount}</span>
                      </span>
                    )}
                  </div>

                  {gameData.phase === 'gallery_vote' && (
                    <button
                      type="button"
                      onClick={() => handleVoteDrawing(aid)}
                      className={`cartoon-btn py-2 text-sm w-full ${
                        myVotedThis
                          ? 'bg-[#8ac926] text-[#161426]'
                          : 'bg-[#00bbf9] text-[#161426]'
                      }`}
                    >
                      {myVotedThis
                        ? lang === 'ar'
                          ? '✓ صوّتت لها'
                          : '✓ Voted'
                        : lang === 'ar'
                        ? 'صوّت لهي الرسمة!'
                        : 'Vote Best Match!'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {gameData.phase === 'gallery_vote' &&
            (isHost || myPlayerId === witness?.id) &&
            Object.keys(gameData.votes || {}).length > 0 && (
              <button
                type="button"
                onClick={() => finalizeWitnessScores(gameData.votes || {})}
                className="cartoon-btn bg-[#ffca3a] text-[#161426] w-full py-3 text-base"
              >
                {lang === 'ar' ? 'اعتماد الأصوات وتوزيع النقاط' : 'Finalize Votes & Award Points'}
              </button>
            )}

          {gameData.phase === 'reveal' && (
            <button
              type="button"
              onClick={handleNextMonsterRound}
              className="cartoon-btn bg-[#8ac926] text-[#161426] w-full py-3.5 text-xl flex items-center justify-center gap-2"
            >
              <ArrowsClockwise weight="bold" className="w-6 h-6" />
              <span>{lang === 'ar' ? 'جولة شاهد وحش جديدة!' : 'Next Witness Round!'}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
