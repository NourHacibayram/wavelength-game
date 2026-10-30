import React, { useState } from 'react';
import { DECRYPTO_WORDS } from '../data/extraGamesData';
import {
  TerminalWindow,
  Eye,
  EyeSlash,
  PaperPlaneTilt,
  CheckCircle,
  LockKey,
  ArrowsClockwise,
  ShieldCheck,
  ShieldWarning,
} from '@phosphor-icons/react';

export interface DecryptoGameState {
  phase: 'encrypting' | 'decoding' | 'reveal';
  transmission: number; // 1, 2, 3... using the same 4 words so clue log builds up!
  encryptorId: string;
  teamMemberIds: string[]; // Encryptor + Decryptor teammates (see the 4 words)
  wordsAr: [string, string, string, string];
  wordsEn: [string, string, string, string];
  secretCode: [number, number, number]; // e.g. [3, 1, 4] (1-indexed)
  currentClues: [string, string, string];
  clueLog: Record<number, string[]>; // slot 1..4 -> past clues!
  guesses: Record<string, [number, number, number]>; // playerId -> guessed 3 digits
}

interface PlayerInfo {
  id: string;
  name: string;
  avatar_color: string;
  score: number;
}

interface DecryptoGameProps {
  gameData: DecryptoGameState;
  players: PlayerInfo[];
  myPlayerId: string;
  isHost: boolean;
  isPassAndPlay: boolean;
  lang: 'ar' | 'en';
  onUpdateGameData: (nextData: DecryptoGameState, scoreAwards?: Record<string, number>) => void;
  onStartNewRound: () => void;
}

function randomCodeTriple(): [number, number, number] {
  const arr = [1, 2, 3, 4].sort(() => Math.random() - 0.5);
  return [arr[0], arr[1], arr[2]];
}

export function buildInitialDecryptoState(playerIds: string[]): DecryptoGameState {
  const shuffledWords = [...DECRYPTO_WORDS].sort(() => Math.random() - 0.5).slice(0, 4);
  const encId = playerIds[0] || 'p1';
  // If 3+ players, split roughly half as teammates (who see words) and half as Interceptors (who don't see words!)
  let teamIds: string[] = [];
  if (playerIds.length <= 2) {
    teamIds = [...playerIds];
  } else {
    const half = Math.ceil(playerIds.length / 2);
    teamIds = playerIds.slice(0, Math.max(2, half));
  }

  return {
    phase: 'encrypting',
    transmission: 1,
    encryptorId: encId,
    teamMemberIds: teamIds,
    wordsAr: [
      shuffledWords[0].ar,
      shuffledWords[1].ar,
      shuffledWords[2].ar,
      shuffledWords[3].ar,
    ],
    wordsEn: [
      shuffledWords[0].en,
      shuffledWords[1].en,
      shuffledWords[2].en,
      shuffledWords[3].en,
    ],
    secretCode: randomCodeTriple(),
    currentClues: ['', '', ''],
    clueLog: { 1: [], 2: [], 3: [], 4: [] },
    guesses: {},
  };
}

export const DecryptoGame: React.FC<DecryptoGameProps> = ({
  gameData,
  players,
  myPlayerId,
  isHost,
  isPassAndPlay,
  lang,
  onUpdateGameData,
  onStartNewRound,
}) => {
  const [c1, setC1] = useState<string>('');
  const [c2, setC2] = useState<string>('');
  const [c3, setC3] = useState<string>('');
  const [peekCode, setPeekCode] = useState<boolean>(!isPassAndPlay);
  const [localVoterIdx, setLocalVoterIdx] = useState<number>(0);
  const [d1, setD1] = useState<number>(1);
  const [d2, setD2] = useState<number>(2);
  const [d3, setD3] = useState<number>(3);

  const encryptor =
    players.find((p) => p.id === gameData.encryptorId) || players[0];
  const decoders =
    players.length > 1
      ? players.filter((p) => p.id !== encryptor?.id)
      : players;

  const viewerId = isPassAndPlay
    ? gameData.phase === 'encrypting'
      ? encryptor?.id || myPlayerId
      : decoders[localVoterIdx]?.id || myPlayerId
    : myPlayerId;
  const viewer = players.find((p) => p.id === viewerId);

  const isEncryptor = isPassAndPlay
    ? gameData.phase === 'encrypting'
    : myPlayerId === encryptor?.id;
  const isTeamMember = (gameData.teamMemberIds || []).includes(viewerId);
  const canSeeFourWords =
    gameData.phase === 'reveal' ||
    (isTeamMember && (!isPassAndPlay || peekCode || gameData.phase === 'decoding'));

  const words = lang === 'ar' ? gameData.wordsAr : gameData.wordsEn;
  const hasSubmittedGuess = Boolean(gameData.guesses?.[viewerId]);

  const handleTransmitClues = (e: React.FormEvent) => {
    e.preventDefault();
    if (!c1.trim() || !c2.trim() || !c3.trim()) return;
    setPeekCode(false);
    setLocalVoterIdx(0);
    onUpdateGameData({
      ...gameData,
      currentClues: [c1.trim(), c2.trim(), c3.trim()],
      guesses: {},
      phase: 'decoding',
    });
    setC1('');
    setC2('');
    setC3('');
  };

  const handleSubmitCodeGuess = () => {
    if (new Set([d1, d2, d3]).size < 3) return; // all 3 digits are distinct in Decrypto!
    const nextGuesses: Record<string, [number, number, number]> = {
      ...(gameData.guesses || {}),
      [viewerId]: [d1, d2, d3],
    };

    if (isPassAndPlay && localVoterIdx + 1 < decoders.length) {
      setLocalVoterIdx(localVoterIdx + 1);
      onUpdateGameData({ ...gameData, guesses: nextGuesses });
      return;
    }

    const allIn = decoders.every((p) => Boolean(nextGuesses[p.id]));
    if (allIn) {
      resolveTransmission(nextGuesses);
    } else {
      onUpdateGameData({ ...gameData, guesses: nextGuesses });
    }
  };

  const resolveTransmission = (
    finalGuesses: Record<string, [number, number, number]>
  ) => {
    const [s1, s2, s3] = gameData.secretCode;
    const awards: Record<string, number> = {};
    let anyTeamDecoded = false;

    Object.entries(finalGuesses).forEach(([pid, [g1, g2, g3]]) => {
      const exact = g1 === s1 && g2 === s2 && g3 === s3;
      const onTeam = (gameData.teamMemberIds || []).includes(pid);
      if (exact) {
        if (onTeam) {
          awards[pid] = 2;
          anyTeamDecoded = true;
        } else {
          // Interceptor cracked it WITHOUT seeing the 4 words!! Huge +3 bonus!
          awards[pid] = 3;
        }
      }
    });

    if (anyTeamDecoded && encryptor) {
      awards[encryptor.id] = (awards[encryptor.id] || 0) + 2;
    }

    // Append current clues to the slot Clue Log for the next transmission!
    const nextLog: Record<number, string[]> = {
      1: [...(gameData.clueLog?.[1] || [])],
      2: [...(gameData.clueLog?.[2] || [])],
      3: [...(gameData.clueLog?.[3] || [])],
      4: [...(gameData.clueLog?.[4] || [])],
    };
    nextLog[s1].push(gameData.currentClues[0]);
    nextLog[s2].push(gameData.currentClues[1]);
    nextLog[s3].push(gameData.currentClues[2]);

    onUpdateGameData(
      {
        ...gameData,
        guesses: finalGuesses,
        clueLog: nextLog,
        phase: 'reveal',
      },
      awards
    );
  };

  const handleNextTransmissionSameWords = () => {
    // Rotate encryptor within teamMemberIds so clue history keeps building!
    const teamIds = gameData.teamMemberIds || [players[0]?.id];
    const idx = teamIds.indexOf(gameData.encryptorId);
    const nextEnc = teamIds[(idx + 1) % Math.max(1, teamIds.length)] || teamIds[0];
    setPeekCode(!isPassAndPlay);
    setLocalVoterIdx(0);

    onUpdateGameData({
      ...gameData,
      phase: 'encrypting',
      transmission: (gameData.transmission || 1) + 1,
      encryptorId: nextEnc,
      secretCode: randomCodeTriple(),
      currentClues: ['', '', ''],
      guesses: {},
    });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="cartoon-card bg-[#1e1b38] text-white p-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs font-extrabold uppercase text-[#00bbf9] flex items-center gap-1.5">
            <TerminalWindow weight="fill" className="w-4 h-4" />
            <span>
              {lang === 'ar'
                ? `كسر الشيفرة — الإرسال #${gameData.transmission || 1}`
                : `Decrypto — Transmission #${gameData.transmission || 1}`}
            </span>
          </div>
          <h2 className="text-2xl font-extrabold mt-0.5 text-[#ffca3a]">
            {lang === 'ar'
              ? `المشفِّر الحالي: ${encryptor?.name || ''}`
              : `Active Encryptor: ${encryptor?.name || ''}`}
          </h2>
        </div>

        {(isHost || isPassAndPlay) && (
          <button
            type="button"
            onClick={onStartNewRound}
            className="cartoon-btn bg-[#ffca3a] text-[#161426] px-3.5 py-2 text-xs flex items-center gap-1.5"
          >
            <ArrowsClockwise weight="bold" className="w-4 h-4" />
            <span>{lang === 'ar' ? '4 كلمات جديدة' : 'New 4 Words'}</span>
          </button>
        )}
      </div>

      {/* Role Badge for Online Players */}
      {!isPassAndPlay && players.length >= 3 && (
        <div
          className={`p-3 rounded-2xl border-3 border-[#161426] font-extrabold text-xs flex items-center justify-center gap-2 ${
            isTeamMember
              ? 'bg-[#dcfce7] text-[#161426]'
              : 'bg-[#ffe4e6] text-[#161426]'
          }`}
        >
          {isTeamMember ? (
            <>
              <ShieldCheck weight="fill" className="w-5 h-5 text-[#38b000]" />
              <span>
                {lang === 'ar'
                  ? 'أنت من فريق الشفرة — ترى الكلمات الـ 4 ومهمتك فكّ ترتيب الأرقام!'
                  : 'You are on the Code Team — you see the 4 keywords!'}
              </span>
            </>
          ) : (
            <>
              <ShieldWarning weight="fill" className="w-5 h-5 text-[#ff595e]" />
              <span>
                {lang === 'ar'
                  ? 'أنت من فريق الاعتراض — الكلمات مخفية عنك! استعمل سجل التلميحات لاختراق الكود (+3 نقاط)!'
                  : 'You are an Interceptor — keywords are hidden! Use the Clue Log to intercept (+3 pts)!'}
              </span>
            </>
          )}
        </div>
      )}

      {/* THE 4 RETRO CODE SCREENS + ACCUMULATED CLUE LOG */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[0, 1, 2, 3].map((idx) => {
          const slotNum = idx + 1;
          const pastClues = gameData.clueLog?.[slotNum] || [];
          return (
            <div
              key={slotNum}
              className="cartoon-panel-dark p-3.5 flex flex-col justify-between space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <span className="cartoon-badge bg-[#ffca3a] text-[#161426] px-2.5 py-0.5 text-xs">
                  #{slotNum}
                </span>
                <LockKey weight="fill" className="w-4 h-4 text-[#00bbf9]" />
              </div>

              <div className="p-2.5 rounded-xl bg-[#00bbf9] border-3 border-[#161426] text-center font-extrabold text-base text-[#161426]">
                {canSeeFourWords ? words?.[idx] : '• • • •'}
              </div>

              <div className="space-y-1 min-h-[38px]">
                <div className="text-[10px] font-bold text-[#d9d4f7] uppercase">
                  {lang === 'ar' ? 'سجل التلميحات السابقة:' : 'Past Clues:'}
                </div>
                {pastClues.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {pastClues.map((pc, pi) => (
                      <span
                        key={pi}
                        className="text-[11px] font-extrabold px-2 py-0.5 rounded-lg bg-[#191636] text-[#ffca3a] border border-white/15"
                      >
                        {pc}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="text-[11px] text-white/40 font-bold">—</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* PHASE 1: ENCRYPTOR WRITES 3 CLUES FOR SECRET CODE */}
      {gameData.phase === 'encrypting' && (
        <div className="cartoon-card p-5 space-y-4">
          {isEncryptor ? (
            <>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h3 className="font-extrabold text-base md:text-lg text-[#161426]">
                  {lang === 'ar'
                    ? `يا (${encryptor?.name})، شوف كود الأرقام السري واكتب 3 تلميحات بالترتيب:`
                    : `${encryptor?.name}, peek your 3-digit secret code & write 3 clues in order:`}
                </h3>
                {isPassAndPlay && (
                  <button
                    type="button"
                    onClick={() => setPeekCode(!peekCode)}
                    className="cartoon-btn bg-[#ffca3a] text-[#161426] px-3.5 py-1.5 text-xs flex items-center gap-1"
                  >
                    {peekCode ? <EyeSlash className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    <span>{peekCode ? (lang === 'ar' ? 'إخفاء الكود' : 'Hide Code') : (lang === 'ar' ? 'اكشف الكود السري' : 'Show Secret Code')}</span>
                  </button>
                )}
              </div>

              {peekCode && (
                <form onSubmit={handleTransmitClues} className="space-y-4">
                  <div className="p-4 rounded-2xl bg-[#191636] text-[#ffca3a] border-4 border-[#161426] text-center">
                    <div className="text-xs font-bold text-white uppercase">
                      {lang === 'ar' ? 'شيفرتك السرية لهذه الجولة:' : 'Your Secret 3-Digit Code:'}
                    </div>
                    <div dir="ltr" className="text-4xl font-extrabold tracking-widest mt-1">
                      {gameData.secretCode.join(' — ')}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { val: c1, set: setC1, codeNum: gameData.secretCode[0], idx: 1 },
                      { val: c2, set: setC2, codeNum: gameData.secretCode[1], idx: 2 },
                      { val: c3, set: setC3, codeNum: gameData.secretCode[2], idx: 3 },
                    ].map((slot) => (
                      <div
                        key={slot.idx}
                        className="p-3 rounded-2xl bg-[#fff1c2] border-3 border-[#161426] space-y-1.5"
                      >
                        <label className="block text-xs font-extrabold text-[#161426]">
                          {lang === 'ar'
                            ? `التلميح ${slot.idx} للكلمة #${slot.codeNum} (${words?.[slot.codeNum - 1]}):`
                            : `Clue ${slot.idx} for #${slot.codeNum} (${words?.[slot.codeNum - 1]}):`}
                        </label>
                        <input
                          type="text"
                          required
                          maxLength={30}
                          value={slot.val}
                          onChange={(e) => slot.set(e.target.value)}
                          placeholder={lang === 'ar' ? 'اكتب تلميح...' : 'Type clue...'}
                          className="cartoon-input w-full px-3 py-2 bg-white text-[#161426]"
                        />
                      </div>
                    ))}
                  </div>

                  <button
                    type="submit"
                    className="cartoon-btn bg-[#8ac926] text-[#161426] w-full py-3.5 text-xl flex items-center justify-center gap-2"
                  >
                    <PaperPlaneTilt weight="fill" className="w-6 h-6" />
                    <span>{lang === 'ar' ? 'بثّ التلميحات المشفّرة!' : 'Transmit Clues!'}</span>
                  </button>
                </form>
              )}
            </>
          ) : (
            <div className="py-8 text-center font-extrabold text-lg text-[#161426] animate-pulse">
              {lang === 'ar'
                ? `${encryptor?.name} عم يجهّز التلميحات الـ 3 للشيفرة السرية...`
                : `${encryptor?.name} is encrypting the 3 clues...`}
            </div>
          )}
        </div>
      )}

      {/* PHASE 2: DECODING & INTERCEPTING */}
      {gameData.phase === 'decoding' && (
        <div className="cartoon-card p-5 space-y-4">
          <div className="text-center space-y-1">
            <span className="text-xs font-extrabold uppercase text-[#3f3b5c]">
              {lang === 'ar'
                ? 'التلميحات المستلمة بالترتيب (استنتجوا الـ 3 أرقام المختلفة!):'
                : 'Intercepted Clues in Order (Deduce the 3 distinct digits!):'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { clue: gameData.currentClues[0], val: d1, set: setD1, label: 'A' },
              { clue: gameData.currentClues[1], val: d2, set: setD2, label: 'B' },
              { clue: gameData.currentClues[2], val: d3, set: setD3, label: 'C' },
            ].map((item, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-white border-4 border-[#161426] shadow-[0_4px_0_#161426] text-center space-y-3"
              >
                <div className="text-xs font-extrabold text-[#4361ee]">
                  {lang === 'ar' ? `التلميح #${idx + 1}` : `Clue #${idx + 1}`}
                </div>
                <div className="text-xl font-extrabold text-[#161426]">
                  &ldquo;{item.clue}&rdquo;
                </div>

                {(!isEncryptor || isPassAndPlay) && (!hasSubmittedGuess || isPassAndPlay) && (
                  <div className="flex justify-center gap-1.5">
                    {[1, 2, 3, 4].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => item.set(num)}
                        className={`w-9 h-9 rounded-xl border-3 border-[#161426] font-extrabold text-sm cursor-pointer ${
                          item.val === num
                            ? 'bg-[#ffca3a] text-[#161426] scale-110'
                            : 'bg-gray-100 text-[#161426]'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {!isPassAndPlay && myPlayerId === encryptor?.id && players.length > 1 ? (
            <div className="text-center space-y-2">
              <div className="font-extrabold text-sm text-[#3f3b5c]">
                {lang === 'ar'
                  ? 'أنت المشفِّر — راقب محاولات فكّ الشيفرة والاعتراض!'
                  : 'You are the Encryptor — watch everyone try to crack your code!'}
              </div>
              {Object.keys(gameData.guesses || {}).length > 0 && (
                <button
                  type="button"
                  onClick={() => resolveTransmission(gameData.guesses || {})}
                  className="cartoon-btn bg-[#00bbf9] text-[#161426] px-4 py-2 text-xs"
                >
                  {lang === 'ar' ? 'اكشف الكود الحقيقي الآن' : 'Reveal Code Now'}
                </button>
              )}
            </div>
          ) : hasSubmittedGuess && !isPassAndPlay ? (
            <div className="text-center font-extrabold text-base text-[#38b000]">
              {lang === 'ar'
                ? 'تم إرسال توقعك للكود! بانتظار البقية...'
                : 'Code guess submitted! Waiting for others...'}
            </div>
          ) : (
            <div className="space-y-2 text-center">
              {isPassAndPlay && (
                <div className="text-sm font-extrabold text-[#161426]">
                  {lang === 'ar'
                    ? `دور (${viewer?.name}) لفكّ الشيفرة:`
                    : `${viewer?.name}’s turn to crack the code:`}
                </div>
              )}
              {new Set([d1, d2, d3]).size < 3 && (
                <div className="text-xs font-extrabold text-[#ff595e]">
                  {lang === 'ar'
                    ? 'تنبيه: لازم الأرقام الـ 3 تكون مختلفة عن بعضها (مثلاً 3 - 1 - 4)!'
                    : 'All 3 digits must be distinct (e.g. 3 - 1 - 4)!'}
                </div>
              )}
              <button
                type="button"
                disabled={new Set([d1, d2, d3]).size < 3}
                onClick={handleSubmitCodeGuess}
                className="cartoon-btn bg-[#8ac926] text-[#161426] w-full py-3.5 text-xl flex items-center justify-center gap-2"
              >
                <CheckCircle weight="fill" className="w-6 h-6" />
                <span>
                  {lang === 'ar'
                    ? `اعتماد الشيفرة (${d1} - ${d2} - ${d3})`
                    : `Submit Code (${d1} - ${d2} - ${d3})`}
                </span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* PHASE 3: REVEAL */}
      {gameData.phase === 'reveal' && (
        <div className="cartoon-card p-5 space-y-4 text-center animate-in zoom-in-95 duration-200">
          <div className="p-4 rounded-2xl bg-[#191636] text-[#ffca3a] border-4 border-[#161426]">
            <div className="text-xs font-bold text-white uppercase">
              {lang === 'ar' ? 'الشيفرة الحقيقية كانت:' : 'True Secret Code:'}
            </div>
            <div dir="ltr" className="text-4xl font-extrabold tracking-widest mt-1">
              {gameData.secretCode.join(' — ')}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {Object.entries(gameData.guesses || {}).map(([pid, codeArr]) => {
              const p = players.find((item) => item.id === pid);
              const exact =
                codeArr[0] === gameData.secretCode[0] &&
                codeArr[1] === gameData.secretCode[1] &&
                codeArr[2] === gameData.secretCode[2];
              return (
                <div
                  key={pid}
                  className="p-3 rounded-2xl bg-white border-3 border-[#161426] flex items-center justify-between"
                >
                  <span className="font-extrabold text-sm text-[#161426]">{p?.name}</span>
                  <span
                    dir="ltr"
                    className={`cartoon-badge px-3 py-0.5 text-xs ${
                      exact ? 'bg-[#8ac926] text-[#161426]' : 'bg-[#ffe4e6] text-[#ff595e]'
                    }`}
                  >
                    {codeArr.join('-')} {exact ? '✓' : '✗'}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            <button
              type="button"
              onClick={handleNextTransmissionSameWords}
              className="cartoon-btn bg-[#8ac926] text-[#161426] py-3 text-base flex items-center justify-center gap-2"
            >
              <TerminalWindow weight="fill" className="w-5 h-5" />
              <span>
                {lang === 'ar'
                  ? 'إرسال جديد ع نفس الكلمات (أصعب وأحماس!)'
                  : 'Next Transmission (Keep Clue Log!)'}
              </span>
            </button>

            <button
              type="button"
              onClick={onStartNewRound}
              className="cartoon-btn bg-[#ffca3a] text-[#161426] py-3 text-base flex items-center justify-center gap-2"
            >
              <ArrowsClockwise weight="bold" className="w-5 h-5" />
              <span>{lang === 'ar' ? 'توليد 4 كلمات جديدة' : 'Fresh 4 Words'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
