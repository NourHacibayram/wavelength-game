import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  CaretLeft,
  CaretRight,
  FilmStrip,
} from '@phosphor-icons/react';
import { PartyGameId } from '../../data/partyGamesData';
import { PARTY_GAMES_CATALOG } from '../../data/extraGamesData';
import {
  WavelengthTutorialScene,
  ChameleonTutorialScene,
  DixitTutorialScene,
  TabooTutorialScene,
  WitnessTutorialScene,
  FakeArtistTutorialScene,
  CockroachTutorialScene,
} from './GameTutorialScenesA';
import {
  WitsTutorialScene,
  InsiderTutorialScene,
  MediumTutorialScene,
  SoCloverTutorialScene,
  DecryptoTutorialScene,
  ItoTutorialScene,
  WordBombTutorialScene,
  TheMindTutorialScene,
} from './GameTutorialScenesB';
import {
  TrixTutorialScene,
  MonopolyTutorialScene,
  SnakesTutorialScene,
} from './GameTutorialScenesC';
import {
  SkullTutorialScene,
  SheriffTutorialScene,
  CashNGunsTutorialScene,
  OneNightTutorialScene,
  ResistanceTutorialScene,
  ArtAuctionTutorialScene,
  AlibiTutorialScene,
  SplitStealTutorialScene,
  BoomDeckTutorialScene,
} from './GameTutorialScenesD';

interface GameTutorialPlayerProps {
  gameId: PartyGameId;
  lang: 'ar' | 'en';
  controlledStep?: number;
  onStepChange?: (step: number) => void;
  compact?: boolean;
  onExpandModal?: () => void;
}

const STEP_DURATION_MS = 3800;
const ENTRANCE_DURATION_MS = 650;

export const GameTutorialSvgScene: React.FC<{
  gameId: PartyGameId;
  step: number;
  animT: number;
  clock: number;
  lang: 'ar' | 'en';
}> = ({ gameId, step, animT, clock, lang }) => {
  const props = { step, animT, clock, lang };
  switch (gameId) {
    case 'wavelength':
      return <WavelengthTutorialScene {...props} />;
    case 'chameleon':
      return <ChameleonTutorialScene {...props} />;
    case 'dixit':
      return <DixitTutorialScene {...props} />;
    case 'taboo':
      return <TabooTutorialScene {...props} />;
    case 'witness':
      return <WitnessTutorialScene {...props} />;
    case 'fakeartist':
      return <FakeArtistTutorialScene {...props} />;
    case 'cockroach':
      return <CockroachTutorialScene {...props} />;
    case 'wits':
      return <WitsTutorialScene {...props} />;
    case 'insider':
      return <InsiderTutorialScene {...props} />;
    case 'medium':
      return <MediumTutorialScene {...props} />;
    case 'soclover':
      return <SoCloverTutorialScene {...props} />;
    case 'decrypto':
      return <DecryptoTutorialScene {...props} />;
    case 'ito':
      return <ItoTutorialScene {...props} />;
    case 'wordbomb':
      return <WordBombTutorialScene {...props} />;
    case 'themind':
      return <TheMindTutorialScene {...props} />;
    case 'trix':
      return <TrixTutorialScene {...props} />;
    case 'monopoly':
      return <MonopolyTutorialScene {...props} />;
    case 'snakes':
      return <SnakesTutorialScene {...props} />;
    case 'skull':
      return <SkullTutorialScene {...props} />;
    case 'sheriff':
      return <SheriffTutorialScene {...props} />;
    case 'cashnguns':
      return <CashNGunsTutorialScene {...props} />;
    case 'onenight':
      return <OneNightTutorialScene {...props} />;
    case 'resistance':
      return <ResistanceTutorialScene {...props} />;
    case 'artauction':
      return <ArtAuctionTutorialScene {...props} />;
    case 'alibi':
      return <AlibiTutorialScene {...props} />;
    case 'splitsteal':
      return <SplitStealTutorialScene {...props} />;
    case 'boomdeck':
      return <BoomDeckTutorialScene {...props} />;
    default:
      return <WavelengthTutorialScene {...props} />;
  }
};

export const GameTutorialPlayer: React.FC<GameTutorialPlayerProps> = ({
  gameId,
  lang,
  controlledStep,
  onStepChange,
  compact = false,
  onExpandModal,
}) => {
  const [internalStep, setInternalStep] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [progress, setProgress] = useState<number>(0);
  const [animT, setAnimT] = useState<number>(1);
  const [clock, setClock] = useState<number>(0);

  const stepStartRef = useRef<number>(performance.now());
  const mountStartRef = useRef<number>(performance.now());
  const onStepChangeRef = useRef(onStepChange);
  onStepChangeRef.current = onStepChange;

  const currentStep =
    typeof controlledStep === 'number' ? controlledStep : internalStep;

  const setStep = (next: number) => {
    const normalized = ((next % 4) + 4) % 4;
    stepStartRef.current = performance.now();
    setInternalStep(normalized);
    setProgress(0);
    setAnimT(0);
    if (onStepChangeRef.current) {
      onStepChangeRef.current(normalized);
    }
  };

  // Reset entrance timer whenever controlledStep changes externally (e.g. clicking a rule card)
  useEffect(() => {
    stepStartRef.current = performance.now();
    setAnimT(0);
    setProgress(0);
  }, [currentStep]);

  // Reset to Step 0 whenever gameId changes
  useEffect(() => {
    stepStartRef.current = performance.now();
    setInternalStep(0);
    setProgress(0);
    setAnimT(0);
    setIsPlaying(true);
    if (onStepChangeRef.current) {
      onStepChangeRef.current(0);
    }
  }, [gameId]);

  // Smooth ~30fps Animation & Auto-Advance Loop (Pure Native SVG Driver!)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = performance.now();
      const stepElapsed = now - stepStartRef.current;
      const totalElapsedSec = (now - mountStartRef.current) / 1000;

      setClock(totalElapsedSec);
      setAnimT(Math.min(1, stepElapsed / ENTRANCE_DURATION_MS));

      if (isPlaying) {
        const pct = (stepElapsed / STEP_DURATION_MS) * 100;
        if (pct >= 100) {
          stepStartRef.current = now;
          const next = (currentStep + 1) % 4;
          setInternalStep(next);
          setAnimT(0);
          setProgress(0);
          if (onStepChangeRef.current) {
            onStepChangeRef.current(next);
          }
        } else {
          setProgress(pct);
        }
      }
    }, 33);

    return () => clearInterval(interval);
  }, [isPlaying, currentStep]);

  const gameMeta =
    PARTY_GAMES_CATALOG.find((g) => g.id === gameId) || PARTY_GAMES_CATALOG[0];
  const rules = lang === 'ar' ? gameMeta.rules_ar : gameMeta.rules_en;

  return (
    <div className="rounded-3xl bg-[#161426] border-4 border-[#120f29] shadow-[0_6px_0_#120f29] overflow-hidden">
      {/* Top Stage Header Bar */}
      <div
        className={`${
          compact ? 'px-3.5 py-2' : 'px-4 py-2.5 sm:py-3'
        } bg-[#120f29] flex items-center justify-between gap-2 border-b-2 border-white/10`}
      >
        <div
          className={`flex items-center gap-1.5 ${
            compact ? 'text-xs' : 'text-xs sm:text-sm'
          } font-extrabold text-[#ffca3a]`}
        >
          <FilmStrip
            weight="fill"
            className={`${compact ? 'w-4 h-4' : 'w-4 h-4 sm:w-5 sm:h-5'} text-[#00bbf9]`}
          />
          <span>
            {lang === 'ar'
              ? `شرح متحرك — خطوة ${currentStep + 1} من 4`
              : `Animated Guide — Step ${currentStep + 1} of 4`}
          </span>
        </div>

        {/* Step Controls: Play/Pause + 1-2-3-4 Pills */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="flex items-center gap-1 sm:gap-1.5">
            {[0, 1, 2, 3].map((idx) => {
              const active = idx === currentStep;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setStep(idx)}
                  className={`${
                    compact ? 'w-6 h-6 text-xs' : 'w-7 h-7 sm:w-8 sm:h-8 text-xs sm:text-sm'
                  } rounded-lg font-extrabold transition-all cursor-pointer border-2 border-[#161426] flex items-center justify-center ${
                    active
                      ? 'bg-[#ffca3a] text-[#161426] scale-110'
                      : 'bg-[#2a2456] text-white/80 hover:bg-[#383070]'
                  }`}
                  title={
                    lang === 'ar' ? `انتقل للخطوة ${idx + 1}` : `Go to Step ${idx + 1}`
                  }
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => {
              stepStartRef.current = performance.now() - (progress / 100) * STEP_DURATION_MS;
              setIsPlaying((p) => !p);
            }}
            className={`${
              compact ? 'w-7 h-7' : 'w-8 h-8'
            } rounded-lg bg-[#00bbf9] text-[#161426] border-2 border-[#161426] flex items-center justify-center cursor-pointer hover:brightness-110`}
            title={
              isPlaying
                ? lang === 'ar'
                  ? 'إيقاف مؤقت'
                  : 'Pause'
                : lang === 'ar'
                ? 'تشغيل'
                : 'Play'
            }
          >
            {isPlaying ? (
              <Pause weight="fill" className={compact ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
            ) : (
              <Play weight="fill" className={compact ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
            )}
          </button>
        </div>
      </div>

      {/* Animated SVG Canvas */}
      <div
        onClick={onExpandModal}
        className={`relative ${compact ? 'p-2' : 'p-2.5 sm:p-3.5'} bg-[#191636] ${
          onExpandModal ? 'cursor-pointer' : ''
        }`}
      >
        <GameTutorialSvgScene
          gameId={gameId}
          step={currentStep}
          animT={animT}
          clock={clock}
          lang={lang}
        />
      </div>

      {/* Step Auto-Play Progress Bar */}
      <div className={`w-full ${compact ? 'h-1.5' : 'h-2'} bg-[#120f29]`} dir="ltr">
        <div
          style={{ width: `${progress}%` }}
          className="h-full bg-[#ffca3a]"
        />
      </div>

      {/* Compact Caption Bar (Shown on Home Page Spotlight or Compact Views) */}
      {compact && (
        <div className="px-3.5 py-2.5 bg-[#221d47] flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setStep(currentStep - 1)}
            className="w-7 h-7 rounded-lg bg-[#161426] text-[#ffca3a] flex items-center justify-center shrink-0 cursor-pointer hover:bg-[#2d265e]"
          >
            {lang === 'ar' ? (
              <CaretRight weight="bold" className="w-4 h-4" />
            ) : (
              <CaretLeft weight="bold" className="w-4 h-4" />
            )}
          </button>

          <p className="text-xs font-extrabold text-[#fff9ec] text-center leading-snug line-clamp-2 flex-1">
            {rules[currentStep]}
          </p>

          <button
            type="button"
            onClick={() => setStep(currentStep + 1)}
            className="w-7 h-7 rounded-lg bg-[#161426] text-[#ffca3a] flex items-center justify-center shrink-0 cursor-pointer hover:bg-[#2d265e]"
          >
            {lang === 'ar' ? (
              <CaretLeft weight="bold" className="w-4 h-4" />
            ) : (
              <CaretRight weight="bold" className="w-4 h-4" />
            )}
          </button>
        </div>
      )}
    </div>
  );
};
