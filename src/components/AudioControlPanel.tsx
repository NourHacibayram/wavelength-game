import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  SpeakerHigh,
  SpeakerSlash,
  MusicNotes,
  MusicNotesSimple,
  Waveform,
  Play,
  X,
  Check,
  Sparkle,
} from '@phosphor-icons/react';
import {
  soundManager,
  MUSIC_TRACKS,
  MusicTrackId,
  MusicSelectionMode,
} from '../utils/soundManager';

interface AudioControlPanelProps {
  lang: 'ar' | 'en';
  compact?: boolean;
}

/** Three bouncing bars that mark the track currently playing */
const PlayingBars: React.FC = () => (
  <span className="sound-eq" aria-hidden="true">
    <span />
    <span />
    <span />
  </span>
);

interface VolumeRowProps {
  ar: boolean;
  label: string;
  tone: string;
  enabled: boolean;
  volume: number;
  step: number;
  onIcon: React.ReactNode;
  onToggle: () => void;
  onVolume: (v: number) => void;
  extra?: React.ReactNode;
}

const VolumeRow: React.FC<VolumeRowProps> = ({
  ar,
  label,
  tone,
  enabled,
  volume,
  step,
  onIcon,
  onToggle,
  onVolume,
  extra,
}) => (
  <div className="flex items-center gap-3">
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={enabled}
      aria-label={enabled ? (ar ? `اكتم ${label}` : `Mute ${label}`) : ar ? `شغّل ${label}` : `Unmute ${label}`}
      style={{ backgroundColor: enabled ? tone : '#e7e2d6' }}
      className="w-12 h-12 rounded-2xl border-3 border-[#161426] shadow-[0_3px_0_#161426] active:translate-y-0.5 active:shadow-[0_1px_0_#161426] flex items-center justify-center shrink-0 cursor-pointer transition-colors"
    >
      {enabled ? onIcon : <SpeakerSlash weight="fill" className="w-6 h-6 text-[#6b6580]" />}
    </button>
    <div className="flex-1 min-w-0 space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="font-black text-sm">{label}</span>
        <span className="flex items-center gap-2">
          {extra}
          <span className="text-xs font-black tabular-nums text-[#3f3b5c]" dir="ltr">
            {enabled ? `${Math.round(volume * 100)}%` : ar ? 'مكتوم' : 'Muted'}
          </span>
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={1}
        step={step}
        value={volume}
        disabled={!enabled}
        aria-label={label}
        onChange={(e) => onVolume(parseFloat(e.target.value))}
        className="sound-range"
        style={
          {
            '--tone': tone,
            '--fill': `${volume * 100}%`,
            '--fill-side': ar ? 'left' : 'right',
          } as React.CSSProperties
        }
      />
    </div>
  </div>
);

export const AudioControlPanel: React.FC<AudioControlPanelProps> = ({
  lang,
  compact = false,
}) => {
  const ar = lang === 'ar';
  const reduceMotion = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [audioState, setAudioState] = useState(() => soundManager.getState());

  useEffect(() => {
    return soundManager.subscribe(() => {
      setAudioState(soundManager.getState());
    });
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const pickMode = (mode: MusicSelectionMode) => {
    if (!audioState.musicEnabled) soundManager.setMusicEnabled(true);
    soundManager.setMusicMode(mode);
  };

  const trackIds = Object.keys(MUSIC_TRACKS) as MusicTrackId[];
  const autoTrack = MUSIC_TRACKS[audioState.resolvedTrackId];

  return (
    <>
      <div className="inline-flex items-center gap-1">
        <button
          type="button"
          onClick={() => {
            soundManager.playSfx('ui_click');
            setOpen(true);
          }}
          className={`cartoon-btn bg-[#a855f7] hover:bg-[#9333ea] text-white ${
            compact
              ? 'px-2.5 py-1 text-xs'
              : 'px-3.5 py-2 text-sm md:text-base'
          } flex items-center gap-1.5 cursor-pointer`}
          title={ar ? 'الصوت' : 'Sound'}
        >
          {audioState.musicEnabled || audioState.sfxEnabled ? (
            <SpeakerHigh weight="fill" className={compact ? 'w-4 h-4' : 'w-5 h-5'} />
          ) : (
            <SpeakerSlash weight="fill" className={compact ? 'w-4 h-4' : 'w-5 h-5'} />
          )}
          <span className="hidden sm:inline font-extrabold">
            {ar ? 'الصوت' : 'Sound'}
          </span>
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            key="sound-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[120] bg-[#0b0914]/75 backdrop-blur-xs flex items-end sm:items-center justify-center sm:p-4"
            onClick={() => setOpen(false)}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label={ar ? 'الصوت' : 'Sound'}
              dir={ar ? 'rtl' : 'ltr'}
              onClick={(e) => e.stopPropagation()}
              initial={reduceMotion ? { opacity: 0 } : { y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={reduceMotion ? { opacity: 0 } : { y: 40, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 420, damping: 34 }}
              className="sound-panel w-full sm:max-w-md max-h-[88dvh] overflow-y-auto overscroll-contain rounded-t-[28px] sm:rounded-[28px] bg-[#fff9ec] text-[#161426] border-4 border-b-0 sm:border-b-4 border-[#161426] sm:shadow-[0_10px_0_#161426]"
            >
              <div className="sm:hidden flex justify-center pt-2.5">
                <span className="w-12 h-1.5 rounded-full bg-[#161426]/25" />
              </div>

              <div className="flex items-center justify-between gap-3 px-5 pt-3 sm:pt-5 pb-3">
                <h2 className="text-2xl font-black flex items-center gap-2.5">
                  <span className="w-10 h-10 rounded-2xl bg-[#a855f7] text-white border-3 border-[#161426] shadow-[0_3px_0_#161426] flex items-center justify-center">
                    <SpeakerHigh weight="fill" className="w-5 h-5" />
                  </span>
                  {ar ? 'الصوت' : 'Sound'}
                </h2>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label={ar ? 'سكّر' : 'Close'}
                  className="w-10 h-10 rounded-xl bg-[#ff595e] text-white border-3 border-[#161426] shadow-[0_3px_0_#161426] active:translate-y-0.5 active:shadow-[0_1px_0_#161426] flex items-center justify-center cursor-pointer"
                >
                  <X weight="bold" className="w-5 h-5" />
                </button>
              </div>

              <div className="px-5 pb-5 space-y-5">
                <div className="rounded-3xl bg-white border-3 border-[#161426] p-4 space-y-4">
                  <VolumeRow
                    ar={ar}
                    label={ar ? 'الموسيقى' : 'Music'}
                    tone="#a855f7"
                    enabled={audioState.musicEnabled}
                    volume={audioState.musicVolume}
                    step={0.02}
                    onIcon={<MusicNotes weight="fill" className="w-6 h-6 text-white" />}
                    onToggle={() => soundManager.setMusicEnabled(!audioState.musicEnabled)}
                    onVolume={(v) => soundManager.setMusicVolume(v)}
                  />
                  <VolumeRow
                    ar={ar}
                    label={ar ? 'المؤثرات' : 'Effects'}
                    tone="#00bbf9"
                    enabled={audioState.sfxEnabled}
                    volume={audioState.sfxVolume}
                    step={0.05}
                    onIcon={<Waveform weight="bold" className="w-6 h-6 text-[#161426]" />}
                    onToggle={() => soundManager.setSfxEnabled(!audioState.sfxEnabled)}
                    onVolume={(v) => {
                      soundManager.setSfxVolume(v);
                    }}
                    extra={
                      audioState.sfxEnabled && (
                        <button
                          type="button"
                          onClick={() => soundManager.playSfx('card_draw')}
                          className="px-2 py-0.5 rounded-lg border-2 border-[#161426] bg-[#fff9ec] text-[11px] font-black flex items-center gap-1 cursor-pointer hover:bg-[#e0f2fe]"
                        >
                          <Play weight="fill" className="w-3 h-3" />
                          {ar ? 'جرّب' : 'Test'}
                        </button>
                      )
                    }
                  />
                </div>

                <section className="space-y-2.5">
                  <h3 className="font-black text-sm text-[#3f3b5c]">
                    {ar ? 'شو نسمع؟' : 'What plays?'}
                  </h3>

                  <div
                    role="radiogroup"
                    aria-label={ar ? 'الموسيقى' : 'Music'}
                    className={`space-y-2 transition-opacity ${
                      audioState.musicEnabled ? '' : 'opacity-60'
                    }`}
                  >
                    {(() => {
                      const selected = audioState.musicMode === 'auto';
                      return (
                        <button
                          type="button"
                          role="radio"
                          aria-checked={selected}
                          onClick={() => pickMode('auto')}
                          className={`w-full text-start px-3 py-2.5 rounded-2xl border-3 border-[#161426] flex items-center gap-3 cursor-pointer transition-[background-color,box-shadow,transform] ${
                            selected
                              ? 'bg-[#161426] text-[#fff9ec] shadow-[0_3px_0_#a855f7]'
                              : 'bg-white hover:bg-[#f3e8ff]'
                          }`}
                        >
                          <span className="w-10 h-10 rounded-xl bg-[#ffca3a] text-[#161426] border-2 border-[#161426] flex items-center justify-center shrink-0">
                            <Sparkle weight="fill" className="w-5 h-5" />
                          </span>
                          <span className="flex-1 min-w-0">
                            <span className="block font-black text-sm">
                              {ar ? 'حسب اللعبة' : 'Match the game'}
                            </span>
                            <span
                              className={`block text-xs font-bold truncate ${
                                selected ? 'text-[#fff9ec]/70' : 'text-[#3f3b5c]'
                              }`}
                            >
                              {selected && audioState.musicEnabled
                                ? ar
                                  ? `هلأ: ${autoTrack.title_ar}`
                                  : `Now: ${autoTrack.title_en}`
                                : ar
                                ? 'كل لعبة إلها لحنها'
                                : 'Each game gets its own tune'}
                            </span>
                          </span>
                          {selected && (
                            <Check weight="bold" className="w-5 h-5 text-[#ffca3a] shrink-0" />
                          )}
                        </button>
                      );
                    })()}

                    <div className="grid grid-cols-2 gap-2">
                      {trackIds.map((trackId) => {
                        const tr = MUSIC_TRACKS[trackId];
                        const selected = audioState.musicMode === trackId;
                        const playing =
                          audioState.musicEnabled && audioState.resolvedTrackId === trackId;
                        return (
                          <button
                            key={trackId}
                            type="button"
                            role="radio"
                            aria-checked={selected}
                            onClick={() => pickMode(trackId as MusicSelectionMode)}
                            className={`w-full text-start p-2 sm:p-2.5 rounded-2xl border-3 last:odd:col-span-2 border-[#161426] flex items-center gap-2 cursor-pointer transition-[background-color,box-shadow] ${
                              selected
                                ? 'bg-[#161426] text-[#fff9ec] shadow-[0_3px_0_#a855f7]'
                                : 'bg-white hover:bg-[#f3e8ff]'
                            }`}
                          >
                            <span
                              style={{ backgroundColor: tr.color }}
                              className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl border-2 border-[#161426] text-[#161426] flex items-center justify-center shrink-0"
                            >
                              {playing ? (
                                <PlayingBars />
                              ) : (
                                <MusicNotesSimple weight="fill" className="w-4 h-4" />
                              )}
                            </span>
                            <span className="min-w-0">
                              <span className="block font-black text-[13px] sm:text-sm truncate">
                                {ar ? tr.title_ar : tr.title_en}
                              </span>
                              <span
                                className={`block text-xs font-bold truncate ${
                                  selected ? 'text-[#fff9ec]/70' : 'text-[#3f3b5c]'
                                }`}
                              >
                                {ar ? tr.mood_ar : tr.mood_en}
                              </span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </section>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
