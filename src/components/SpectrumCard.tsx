import React from 'react';
import { ArrowLeft, ArrowRight, ArrowsClockwise } from '@phosphor-icons/react';

interface SpectrumCardProps {
  leftText: string;
  rightText: string;
  lang: 'ar' | 'en';
  canSwap?: boolean;
  onSwap?: () => void;
}

export const SpectrumCard: React.FC<SpectrumCardProps> = ({
  leftText,
  rightText,
  lang,
  canSwap,
  onSwap,
}) => {
  return (
    <div className="w-full max-w-[560px] mx-auto mt-3">
      {/* Keep physical left/right aligned with the wheel (-90° on left, +90° on right) */}
      <div
        dir="ltr"
        className="grid grid-cols-2 rounded-[26px] border-4 border-[#161426] shadow-[0_8px_0_#161426] overflow-hidden relative"
      >
        {/* Physical Left Side (-90°) */}
        <div className="bg-[#38bdf8] text-[#161426] p-3.5 md:p-5 flex flex-col justify-between border-r-4 border-[#161426] min-h-[104px]">
          <div className="flex items-center gap-1.5 text-xs md:text-sm font-extrabold uppercase opacity-80">
            <ArrowLeft weight="bold" className="w-4 h-4 stroke-[3]" />
            <span>{lang === 'ar' ? 'أقصى اليسار' : 'Far Left'}</span>
          </div>
          <div
            dir={lang === 'ar' ? 'rtl' : 'ltr'}
            className="text-lg md:text-2xl font-extrabold leading-snug text-center my-auto py-1"
          >
            {leftText}
          </div>
        </div>

        {/* Physical Right Side (+90°) */}
        <div className="bg-[#fb7185] text-[#161426] p-3.5 md:p-5 flex flex-col justify-between min-h-[104px]">
          <div className="flex items-center justify-end gap-1.5 text-xs md:text-sm font-extrabold uppercase opacity-80">
            <span>{lang === 'ar' ? 'أقصى اليمين' : 'Far Right'}</span>
            <ArrowRight weight="bold" className="w-4 h-4 stroke-[3]" />
          </div>
          <div
            dir={lang === 'ar' ? 'rtl' : 'ltr'}
            className="text-lg md:text-2xl font-extrabold leading-snug text-center my-auto py-1"
          >
            {rightText}
          </div>
        </div>

        {/* Center VS / Swap Badge */}
        {canSwap && onSwap ? (
          <button
            type="button"
            onClick={onSwap}
            title={lang === 'ar' ? 'تبديل البطاقة' : 'Swap Card'}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-[#ffca3a] hover:bg-[#ffd65c] text-[#161426] border-4 border-[#161426] shadow-[0_4px_0_#161426] active:translate-y-[-42%] active:shadow-none flex items-center justify-center cursor-pointer transition-transform"
          >
            <ArrowsClockwise weight="bold" className="w-5 h-5" />
          </button>
        ) : (
          <div className="
            absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
            w-9 h-9 rounded-full bg-[#fff9ec] text-[#161426]
            border-4 border-[#161426] flex items-center justify-center
            font-extrabold text-xs pointer-events-none
          ">
            ↔
          </div>
        )}
      </div>
    </div>
  );
};
