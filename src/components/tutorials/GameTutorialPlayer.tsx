import React, { useState, useEffect } from 'react';
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
} from './GameTutorialScenesB';

interface GameTutorialPlayerProps {
  gameId: PartyGameId;
  lang: 'ar' | 'en';
  controlledStep?: number;
  onStepChange?: (step: number) => void;
  compact?: boolean;
  onExpandModal?: () => void;
}

const STEP_DURATION_MS = 3800;

export const GameTutorialSvgScene: React.FC<{
  gameId: PartyGameId;
  step: number;
  lang: 'ar' | 'en';
}> = ({ gameId, step, lang }) => {
  switch (gameId) {
    case 'wavelength':
      return <WavelengthTutorialScene step={step} lang={lang} />;
    case 'chameleon':
      return <ChameleonTutorialScene step={step} lang={lang} />;
    case 'dixit':
      return <DixitTutorialScene step={step} lang={lang} />;
    case 'taboo':
      return <TabooTutorialScene step={step} lang={lang} />;
    case 'witness':
      return <WitnessTutorialScene step={step} lang={lang} />;
    case 'fakeartist':
      return <FakeArtistTutorialScene step={step} lang={lang} />;
    case 'cockroach':
      return <CockroachTutorialScene step={step} lang={lang} />;
    case 'wits':
      return <WitsTutorialScene step={step} lang={lang} />;
    case 'insider':
      return <InsiderTutorialScene step={step} lang={lang} />;
    case 'medium':
      return <MediumTutorialScene step={step} lang={lang} />;
    case 'soclover':
      return <SoCloverTutorialScene step={step} lang={lang} />;
    case 'decrypto':
      return <DecryptoTutorialScene step={step} lang={lang} />;
    case 'ito':
      return <ItoTutorialScene step={step} lang={lang} />;
    case 'wordbomb':
      return <WordBombTutorialScene step={step} lang={lang} />;
    default:
      return <WavelengthTutorialScene step={step} lang={lang} />;
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

  const currentStep =
    typeof controlledStep === 'number' ? controlledStep : internalStep;

  const setStep = (next: number) => {
    const normalized = ((next % 4) + 4) % 4;
    setInternalStep(normalized);
    setProgress(0);
    if (onStepChange) {
      onStepChange(normalized);
    }
  };

  // Reset to Step 0 whenever gameId changes
  useEffect(() => {
    setInternalStep(0);
    setProgress(0);
    setIsPlaying(true);
    if (onStepChange) {
      onStepChange(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId]);

  // Smooth Auto-Advance Progress Loop
  useEffect(() => {
    if (!isPlaying) return;
    const tickMs = 60;
    const increment = (tickMs / STEP_DURATION_MS) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev + increment >= 100) {
          const next = (currentStep + 1) % 4;
          setInternalStep(next);
          if (onStepChange) {
            onStepChange(next);
          }
          return 0;
        }
        return prev + increment;
      });
    }, tickMs);

    return () => clearInterval(timer);
  }, [isPlaying, currentStep, onStepChange]);

  const gameMeta =
    PARTY_GAMES_CATALOG.find((g) => g.id === gameId) || PARTY_GAMES_CATALOG[0];
  const rules = lang === 'ar' ? gameMeta.rules_ar : gameMeta.rules_en;

  return (
    <div className="rounded-3xl bg-[#161426] border-4 border-[#120f29] shadow-[0_6px_0_#120f29] overflow-hidden">
      {/* Top Stage Header Bar */}
      <div className="px-3.5 py-2 bg-[#120f29] flex items-center justify-between gap-2 border-b-2 border-white/10">
        <div className="flex items-center gap-1.5 text-xs font-extrabold text-[#ffca3a]">
          <FilmStrip weight="fill" className="w-4 h-4 text-[#00bbf9]" />
          <span>
            {lang === 'ar'
              ? `شرح متحرك — خطوة ${currentStep + 1} من 4`
              : `Animated Guide — Step ${currentStep + 1} of 4`}
          </span>
        </div>

        {/* Step Controls: Play/Pause + 1-2-3-4 Pills */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-1">
            {[0, 1, 2, 3].map((idx) => {
              const active = idx === currentStep;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setStep(idx)}
                  className={`w-6 h-6 rounded-lg font-extrabold text-xs transition-all cursor-pointer border-2 border-[#161426] flex items-center justify-center ${
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
            onClick={() => setIsPlaying((p) => !p)}
            className="w-7 h-7 rounded-lg bg-[#00bbf9] text-[#161426] border-2 border-[#161426] flex items-center justify-center cursor-pointer hover:brightness-110"
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
              <Pause weight="fill" className="w-3.5 h-3.5" />
            ) : (
              <Play weight="fill" className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Animated SVG Canvas */}
      <div
        onClick={onExpandModal}
        className={`relative p-2 bg-[#191636] ${onExpandModal ? 'cursor-pointer' : ''}`}
      >
        <GameTutorialSvgScene gameId={gameId} step={currentStep} lang={lang} />
      </div>

      {/* Step Auto-Play Progress Bar */}
      <div className="w-full h-1.5 bg-[#120f29]" dir="ltr">
        <div
          style={{ width: `${progress}%` }}
          className="h-full bg-[#ffca3a] transition-[width] duration-75"
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
