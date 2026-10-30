import React, { useState } from 'react';
import {
  COCKROACH_CRITTERS,
  CritterType,
} from '../data/extraGamesData';
import { CritterCardSvg } from './ExtraGameArt';
import {
  Eye,
  EyeSlash,
  CheckCircle,
  XCircle,
  ArrowRight,
  ArrowsClockwise,
  Trophy,
  WarningOctagon,
} from '@phosphor-icons/react';

export interface CockroachTurnOutcome {
  challengerId: string;
  senderId: string;
  loserId: string;
  calledTruth: boolean;
  wasTruth: boolean;
  critter: CritterType;
  claimed: CritterType;
}

export interface CockroachGameState {
  phase: 'choose_claim' | 'respond' | 'reveal_turn' | 'game_over';
  senderId: string;
  targetId: string;
  trueCritter: CritterType;
  claimedCritter?: CritterType;
  seenByIds: string[];
  penalties: Record<string, CritterType[]>;
  lastOutcome?: CockroachTurnOutcome;
  loserOfMatchId?: string;
}

interface PlayerInfo {
  id: string;
  name: string;
  avatar_color: string;
  score: number;
}

interface CockroachGameProps {
  gameData: CockroachGameState;
  players: PlayerInfo[];
  myPlayerId: string;
  isHost: boolean;
  isPassAndPlay: boolean;
  lang: 'ar' | 'en';
  onUpdateGameData: (nextData: CockroachGameState, scoreAwards?: Record<string, number>) => void;
  onStartNewRound: () => void;
}

export function randomCritter(): CritterType {
  return COCKROACH_CRITTERS[
    Math.floor(Math.random() * COCKROACH_CRITTERS.length)
  ].id;
}

export const CockroachGame: React.FC<CockroachGameProps> = ({
  gameData,
  players,
  myPlayerId,
  isHost,
  isPassAndPlay,
  lang,
  onUpdateGameData,
  onStartNewRound,
}) => {
  const [peekSecret, setPeekSecret] = useState<boolean>(!isPassAndPlay);
  const [peekingToPass, setPeekingToPass] = useState<boolean>(false);
  const [chosenTarget, setChosenTarget] = useState<string>('');
  const [chosenClaim, setChosenClaim] = useState<CritterType>('scorpion');

  const sender = players.find((p) => p.id === gameData.senderId) || players[0];
  const target =
    players.find((p) => p.id === gameData.targetId && p.id !== sender?.id) ||
    players.find((p) => p.id !== sender?.id) ||
    players[0];

  const isMySendTurn = isPassAndPlay || myPlayerId === sender?.id;
  const isMyRespondTurn = isPassAndPlay || myPlayerId === target?.id;

  // Players who haven't seen this card yet (eligible for Peek & Pass!)
  const unseenPlayers = players.filter(
    (p) => p.id !== target?.id && !(gameData.seenByIds || []).includes(p.id)
  );

  const getCritterLabel = (cid?: CritterType) => {
    const item = COCKROACH_CRITTERS.find((c) => c.id === cid) || COCKROACH_CRITTERS[0];
    return lang === 'ar' ? item.name_ar : item.name_en;
  };

  const handleSlideBluffCard = () => {
    const validTargets = players.filter((p) => p.id !== sender?.id);
    const destId =
      chosenTarget && validTargets.some((p) => p.id === chosenTarget)
        ? chosenTarget
        : validTargets[0]?.id || sender?.id || myPlayerId;

    setPeekSecret(false);
    setPeekingToPass(false);
    setChosenTarget('');

    onUpdateGameData({
      ...gameData,
      targetId: destId,
      claimedCritter: chosenClaim,
      seenByIds: Array.from(new Set([...(gameData.seenByIds || []), sender?.id || ''])),
      phase: 'respond',
    });
  };

  const handlePeekAndPassForward = () => {
    if (unseenPlayers.length === 0 || !target) return;
    const destId =
      chosenTarget && unseenPlayers.some((p) => p.id === chosenTarget)
        ? chosenTarget
        : unseenPlayers[0].id;

    setPeekingToPass(false);
    setPeekSecret(false);
    setChosenTarget('');

    onUpdateGameData({
      ...gameData,
      senderId: target.id,
      targetId: destId,
      claimedCritter: chosenClaim,
      seenByIds: Array.from(new Set([...(gameData.seenByIds || []), target.id])),
      phase: 'respond',
    });
  };

  const handleCallTruthOrLie = (calledTruth: boolean) => {
    if (!sender || !target) return;
    const wasTruth = gameData.trueCritter === gameData.claimedCritter;
    const challengerWon = calledTruth === wasTruth;
    const loserId = challengerWon ? sender.id : target.id;
    const winnerId = challengerWon ? target.id : sender.id;

    const prevPenalties = gameData.penalties || {};
    const loserCards = [...(prevPenalties[loserId] || []), gameData.trueCritter];
    const nextPenalties = {
      ...prevPenalties,
      [loserId]: loserCards,
    };

    const outcome: CockroachTurnOutcome = {
      challengerId: target.id,
      senderId: sender.id,
      loserId,
      calledTruth,
      wasTruth,
      critter: gameData.trueCritter,
      claimed: gameData.claimedCritter || 'roach',
    };

    const hitThreePenalties = loserCards.length >= 3;
    const awards: Record<string, number> = {
      [winnerId]: 1,
    };

    if (hitThreePenalties) {
      players.forEach((p) => {
        if (p.id !== loserId) {
          awards[p.id] = (awards[p.id] || 0) + 3;
        }
      });
    }

    onUpdateGameData(
      {
        ...gameData,
        penalties: nextPenalties,
        lastOutcome: outcome,
        loserOfMatchId: hitThreePenalties ? loserId : undefined,
        phase: hitThreePenalties ? 'game_over' : 'reveal_turn',
      },
      awards
    );
  };

  const handleContinueNextCard = () => {
    const nextSenderId = gameData.lastOutcome?.loserId || players[0]?.id || myPlayerId;
    const others = players.filter((p) => p.id !== nextSenderId);
    const nextTargetId = others[0]?.id || nextSenderId;
    setPeekSecret(!isPassAndPlay);
    setPeekingToPass(false);

    onUpdateGameData({
      ...gameData,
      phase: 'choose_claim',
      senderId: nextSenderId,
      targetId: nextTargetId,
      trueCritter: randomCritter(),
      claimedCritter: undefined,
      seenByIds: [nextSenderId],
      lastOutcome: undefined,
    });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="cartoon-card bg-[#8ac926] text-[#161426] p-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs font-extrabold uppercase flex items-center gap-1.5">
            <WarningOctagon weight="fill" className="w-4 h-4" />
            <span>
              {lang === 'ar'
                ? 'بوكر الخداع — 3 كروت عقوبة وتخسر الجولة!'
                : 'Cockroach Poker — Collect 3 Penalty Bugs & You Lose!'}
            </span>
          </div>
          <h2 className="text-2xl font-extrabold mt-0.5">
            {lang === 'ar' ? 'مرّر الكرت واكشف الكذّاب!' : 'Slide, Bluff & Call It Out!'}
          </h2>
        </div>

        {(isHost || isPassAndPlay) && (
          <button
            type="button"
            onClick={onStartNewRound}
            className="cartoon-btn bg-white text-[#161426] px-3.5 py-2 text-xs flex items-center gap-1.5"
          >
            <ArrowsClockwise weight="bold" className="w-4 h-4" />
            <span>{lang === 'ar' ? 'تصفير الطاولة' : 'Reset Table'}</span>
          </button>
        )}
      </div>

      {/* Penalty Cards Table Row */}
      <div className="cartoon-panel-dark p-4 space-y-2">
        <div className="text-xs font-extrabold text-[#ffca3a] uppercase">
          {lang === 'ar'
            ? 'كروت العقوبة المكشوفة أمام كل لاعب (3 = خسارة):'
            : 'Face-Up Penalty Bugs (3 = Defeat):'}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {players.map((p) => {
            const bugs = gameData.penalties?.[p.id] || [];
            return (
              <div
                key={p.id}
                className="p-2.5 rounded-2xl bg-[#191636] border-2 border-[#120f29] flex flex-col justify-between"
              >
                <div className="flex items-center justify-between text-xs font-extrabold">
                  <span className="truncate text-white">{p.name}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full ${
                      bugs.length >= 2 ? 'bg-[#ff595e] text-white' : 'bg-[#25204d] text-[#ffca3a]'
                    }`}
                  >
                    {bugs.length}/3
                  </span>
                </div>
                <div className="flex flex-wrap gap-1 mt-1.5 min-h-[20px]">
                  {bugs.map((b, bi) => (
                    <span
                      key={bi}
                      className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-[#ffca3a] text-[#161426]"
                    >
                      {getCritterLabel(b)}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* PHASE 1: SENDER PEEKS CARD & MAKES A CLAIM */}
      {gameData.phase === 'choose_claim' && (
        <div className="cartoon-card p-6 space-y-4">
          {isMySendTurn ? (
            <>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h3 className="font-extrabold text-lg text-[#161426]">
                  {lang === 'ar'
                    ? `دور (${sender?.name}): شوف الكرت السري ومرّره لصاحبك مع ادعاء!`
                    : `${sender?.name}’s turn: Peek at the card & slide it with a claim!`}
                </h3>
                {isPassAndPlay && (
                  <button
                    type="button"
                    onClick={() => setPeekSecret(!peekSecret)}
                    className="cartoon-btn bg-[#ffca3a] text-[#161426] px-3.5 py-1.5 text-xs flex items-center gap-1"
                  >
                    {peekSecret ? <EyeSlash className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    <span>
                      {peekSecret
                        ? lang === 'ar'
                          ? 'إخفاء الكرت'
                          : 'Hide Card'
                        : lang === 'ar'
                        ? `اكشف الكرت لـ ${sender?.name}`
                        : 'Peek Card'}
                    </span>
                  </button>
                )}
              </div>

              <div className="flex justify-center py-1">
                <CritterCardSvg
                  critter={gameData.trueCritter}
                  faceDown={!peekSecret}
                  lang={lang}
                  className="w-32 h-44"
                />
              </div>

              {/* Pick Target Friend */}
              {players.length > 1 && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-extrabold text-[#3f3b5c]">
                    {lang === 'ar' ? '1. لمين بدك تمرّر الكرت؟' : '1. Slide card to which player?'}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {players
                      .filter((p) => p.id !== sender?.id)
                      .map((p) => {
                        const active =
                          (chosenTarget || players.find((x) => x.id !== sender?.id)?.id) === p.id;
                        return (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => setChosenTarget(p.id)}
                            className={`cartoon-btn px-4 py-2 text-sm ${
                              active ? 'bg-[#00bbf9] text-[#161426]' : 'bg-white text-[#161426]'
                            }`}
                          >
                            {p.name}
                          </button>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* Pick Claimed Critter (Truth or Bluff!) */}
              <div className="space-y-1.5">
                <label className="block text-xs font-extrabold text-[#3f3b5c]">
                  {lang === 'ar'
                    ? '2. شو بدك تدّعي إنه هاد الكرت؟ (قول الصدق أو اكذب!):'
                    : '2. What do you claim this card is? (Tell truth or bluff!):'}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {COCKROACH_CRITTERS.map((cr) => (
                    <button
                      key={cr.id}
                      type="button"
                      onClick={() => setChosenClaim(cr.id)}
                      className={`cartoon-btn py-2 px-3 text-sm ${
                        chosenClaim === cr.id
                          ? 'bg-[#ffca3a] text-[#161426] ring-2 ring-[#ff595e]'
                          : 'bg-white text-[#161426]'
                      }`}
                    >
                      {lang === 'ar' ? cr.name_ar : cr.name_en}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={handleSlideBluffCard}
                className="cartoon-btn bg-[#8ac926] text-[#161426] w-full py-3.5 text-xl flex items-center justify-center gap-2"
              >
                <ArrowRight weight="bold" className="w-6 h-6" />
                <span>
                  {lang === 'ar'
                    ? `مرّر الكرت وادّعِ إنه "${getCritterLabel(chosenClaim)}"!`
                    : `Slide Card Claiming "${getCritterLabel(chosenClaim)}"!`}
                </span>
              </button>
            </>
          ) : (
            <div className="py-8 text-center font-extrabold text-lg text-[#161426] animate-pulse">
              {lang === 'ar'
                ? `${sender?.name} عم يطلّ ع الكرت ويحضّر خدعة...`
                : `${sender?.name} is peeking at a card & preparing a bluff...`}
            </div>
          )}
        </div>
      )}

      {/* PHASE 2: TARGET PLAYER RESPONDS (CALL TRUTH/LIE OR PEEK & PASS!) */}
      {gameData.phase === 'respond' && (
        <div className="cartoon-card p-6 space-y-5 text-center">
          <div className="inline-block cartoon-badge bg-[#ffca3a] text-[#161426] px-4 py-1 text-sm">
            {sender?.name} &rarr; {target?.name}
          </div>

          <div className="flex justify-center">
            <CritterCardSvg
              critter={gameData.trueCritter}
              faceDown={!peekingToPass}
              lang={lang}
              className="w-32 h-44"
            />
          </div>

          <div className="p-4 rounded-2xl bg-[#191636] text-white border-4 border-[#161426]">
            <div className="text-xs font-bold text-[#00bbf9]">
              {lang === 'ar' ? `ادّعاء ${sender?.name}:` : `${sender?.name} claims:`}
            </div>
            <div className="text-2xl md:text-3xl font-extrabold text-[#ffca3a] mt-0.5">
              &ldquo;
              {lang === 'ar'
                ? `هذا الكرت هو: ${getCritterLabel(gameData.claimedCritter)}!`
                : `This card is a ${getCritterLabel(gameData.claimedCritter)}!`}
              &rdquo;
            </div>
          </div>

          {isMyRespondTurn ? (
            !peekingToPass ? (
              <div className="space-y-3">
                <div className="text-sm font-extrabold text-[#161426]">
                  {lang === 'ar'
                    ? `يا (${target?.name})، شو قرارك؟`
                    : `${target?.name}, make your call!`}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleCallTruthOrLie(true)}
                    className="cartoon-btn bg-[#8ac926] text-[#161426] py-3.5 text-lg flex items-center justify-center gap-2"
                  >
                    <CheckCircle weight="fill" className="w-6 h-6" />
                    <span>
                      {lang === 'ar'
                        ? `صادق! (فعلاً ${getCritterLabel(gameData.claimedCritter)})`
                        : `TRUTH! (It IS a ${getCritterLabel(gameData.claimedCritter)})`}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCallTruthOrLie(false)}
                    className="cartoon-btn bg-[#ff595e] text-white py-3.5 text-lg flex items-center justify-center gap-2"
                  >
                    <XCircle weight="fill" className="w-6 h-6" />
                    <span>
                      {lang === 'ar'
                        ? `كذّاب! (مو ${getCritterLabel(gameData.claimedCritter)})`
                        : `LIE! (NOT a ${getCritterLabel(gameData.claimedCritter)})`}
                    </span>
                  </button>
                </div>

                {unseenPlayers.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setPeekingToPass(true)}
                    className="cartoon-btn bg-[#00bbf9] text-[#161426] w-full py-3 text-sm flex items-center justify-center gap-2"
                  >
                    <Eye weight="fill" className="w-5 h-5" />
                    <span>
                      {lang === 'ar'
                        ? 'أو: اختلس النظر بالسر ومرّره للاعب تالت ما شافه!'
                        : 'OR: Secretly Peek & Pass to another player!'}
                    </span>
                  </button>
                )}
              </div>
            ) : (
              /* Peeking to pass it forward! */
              <div className="p-4 rounded-2xl bg-[#fff1c2] border-3 border-[#161426] space-y-3 text-start">
                <div className="font-extrabold text-sm text-[#161426]">
                  {lang === 'ar'
                    ? 'شفت الحقيقة! الآن اختار لاعب لسه ما شاف الكرت وادّعِ ادعاء جديد:'
                    : 'You peeked! Now pass it to an unseen player with your own claim:'}
                </div>

                <div className="flex flex-wrap gap-2">
                  {unseenPlayers.map((up) => {
                    const active = (chosenTarget || unseenPlayers[0]?.id) === up.id;
                    return (
                      <button
                        key={up.id}
                        type="button"
                        onClick={() => setChosenTarget(up.id)}
                        className={`cartoon-btn px-3.5 py-1.5 text-xs ${
                          active ? 'bg-[#00bbf9] text-[#161426]' : 'bg-white text-[#161426]'
                        }`}
                      >
                        {up.name}
                      </button>
                    );
                  })}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {COCKROACH_CRITTERS.map((cr) => (
                    <button
                      key={cr.id}
                      type="button"
                      onClick={() => setChosenClaim(cr.id)}
                      className={`cartoon-btn py-1.5 px-2 text-xs ${
                        chosenClaim === cr.id ? 'bg-[#ffca3a] text-[#161426]' : 'bg-white text-[#161426]'
                      }`}
                    >
                      {lang === 'ar' ? cr.name_ar : cr.name_en}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handlePeekAndPassForward}
                  className="cartoon-btn bg-[#8ac926] text-[#161426] w-full py-3 text-base"
                >
                  {lang === 'ar'
                    ? `مرّر الكرت وادّعِ إنه "${getCritterLabel(chosenClaim)}"!`
                    : `Pass Card Claiming "${getCritterLabel(chosenClaim)}"!`}
                </button>
              </div>
            )
          ) : (
            <div className="text-base font-extrabold text-[#3f3b5c] animate-pulse">
              {lang === 'ar'
                ? `ننتظر قرار (${target?.name}): هل يكشف الخدعة أم يمررها؟`
                : `Waiting for ${target?.name} to call Truth, Lie, or Pass...`}
            </div>
          )}
        </div>
      )}

      {/* PHASE 3 & 4: TURN REVEAL OR MATCH OVER */}
      {(gameData.phase === 'reveal_turn' || gameData.phase === 'game_over') &&
        gameData.lastOutcome && (
          <div className="cartoon-card p-6 text-center space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex justify-center">
              <CritterCardSvg
                critter={gameData.lastOutcome.critter}
                faceDown={false}
                lang={lang}
                className="w-32 h-44"
              />
            </div>

            <div className="text-sm font-extrabold text-[#3f3b5c]">
              {lang === 'ar'
                ? `الكرت الحقيقي طلع: (${getCritterLabel(gameData.lastOutcome.critter)})!`
                : `The card was actually: (${getCritterLabel(gameData.lastOutcome.critter)})!`}
            </div>

            <h3 className="text-2xl font-extrabold text-[#161426]">
              {lang === 'ar'
                ? `أكل الكرت كعقوبة: (${
                    players.find((p) => p.id === gameData.lastOutcome?.loserId)?.name
                  })!`
                : `${
                    players.find((p) => p.id === gameData.lastOutcome?.loserId)?.name
                  } takes the penalty bug!`}
            </h3>

            {gameData.phase === 'game_over' ? (
              <div className="p-4 rounded-2xl bg-[#191636] text-[#ffca3a] border-4 border-[#161426] space-y-2">
                <Trophy weight="fill" className="w-10 h-10 mx-auto" />
                <div className="text-xl font-extrabold">
                  {lang === 'ar'
                    ? `جمع (${
                        players.find((p) => p.id === gameData.loserOfMatchId)?.name
                      }) 3 حشرات وخسر الطاولة — باقي الشلّة كسبوا +3 نقاط!`
                    : `${
                        players.find((p) => p.id === gameData.loserOfMatchId)?.name
                      } collected 3 bugs — Everyone else wins +3 pts!`}
                </div>
                <button
                  type="button"
                  onClick={onStartNewRound}
                  className="cartoon-btn bg-[#8ac926] text-[#161426] w-full py-3.5 text-xl mt-2"
                >
                  {lang === 'ar' ? 'مباراة بوكر خداع جديدة!' : 'New Match!'}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleContinueNextCard}
                className="cartoon-btn bg-[#ffca3a] text-[#161426] w-full py-3.5 text-xl flex items-center justify-center gap-2"
              >
                <ArrowRight weight="bold" className="w-6 h-6" />
                <span>{lang === 'ar' ? 'اسحب الكرت التالي!' : 'Draw Next Card!'}</span>
              </button>
            )}
          </div>
        )}
    </div>
  );
};
