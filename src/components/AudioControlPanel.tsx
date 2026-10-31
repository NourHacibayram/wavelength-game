import React, { useState, useEffect } from 'react';
import {
  SpeakerHigh,
  SpeakerSlash,
  MusicNotes,
  Play,
  SlidersHorizontal,
  X,
  Check,
  Sparkle,
} from '@phosphor-icons/react';
import {
  soundManager,
  MUSIC_TRACKS,
  SFX_CATALOG,
  MusicTrackId,
  MusicSelectionMode,
  SfxId,
} from '../utils/soundManager';

interface AudioControlPanelProps {
  lang: 'ar' | 'en';
  compact?: boolean;
}

const FEATURED_SFX_IDS: SfxId[] = [
  'card_draw',
  'card_play',
  'card_shuffle',
  'card_shove',
  'clock_tick',
  'wire_snip',
  'explosion',
  'heavy_slam',
  'metal_click',
  'dice_roll',
  'chip_place',
  'coins_jingle',
  'applause_win',
];

export const AudioControlPanel: React.FC<AudioControlPanelProps> = ({
  lang,
  compact = false,
}) => {
  const ar = lang === 'ar';
  const [open, setOpen] = useState(false);
  const [audioState, setAudioState] = useState(() => soundManager.getState());

  useEffect(() => {
    return soundManager.subscribe(() => {
      setAudioState(soundManager.getState());
    });
  }, []);

  const currentTrackMeta = MUSIC_TRACKS[audioState.resolvedTrackId];

  return (
    <>
      {/* Top Bar Quick Audio Pill */}
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
          title={ar ? 'إعدادات واستوديو الصوت والموسيقى' : 'Audio & Music Studio'}
        >
          {audioState.musicEnabled || audioState.sfxEnabled ? (
            <SpeakerHigh weight="fill" className={compact ? 'w-4 h-4' : 'w-5 h-5'} />
          ) : (
            <SpeakerSlash weight="fill" className={compact ? 'w-4 h-4' : 'w-5 h-5'} />
          )}
          <span className="hidden sm:inline font-extrabold">
            {ar ? 'الصوت والموسيقى' : 'Audio'}
          </span>
        </button>
      </div>

      {/* Interactive Audio & Music Studio Modal */}
      {open && (
        <div
          className="fixed inset-0 z-[120] bg-[#0b0914]/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
          onClick={() => setOpen(false)}
        >
          <div
            dir={ar ? 'rtl' : 'ltr'}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-[28px] bg-[#fff9ec] text-[#161426] border-4 border-[#161426] shadow-[0_12px_0_#161426] p-4 sm:p-6 space-y-5"
          >
            {/* Header */}
            <div className="flex items-center justify-between gap-3 border-b-3 border-[#161426]/15 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-[#a855f7] text-white border-3 border-[#161426] shadow-[0_3px_0_#161426] flex items-center justify-center shrink-0">
                  <MusicNotes weight="fill" className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-black text-[#161426]">
                    {ar
                      ? 'استوديو الصوت والموسيقى الحقيقية'
                      : 'Real Audio & Music Studio'}
                  </h2>
                  <p className="text-xs font-bold text-[#3f3b5c]">
                    {ar
                      ? 'اسمع وجرّب كل الموسيقى والمؤثرات المسجّلة واختَر اللي بيعجبك!'
                      : 'Listen, preview, and customize real recorded music & Foley SFX!'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="w-9 h-9 rounded-xl bg-[#ff595e] text-white border-3 border-[#161426] shadow-[0_3px_0_#161426] flex items-center justify-center cursor-pointer"
              >
                <X weight="bold" className="w-5 h-5" />
              </button>
            </div>

            {/* 1. Master Toggles & Volume Sliders */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Music Box */}
              <div className="rounded-2xl bg-white border-3 border-[#161426] p-3.5 space-y-2.5 shadow-[0_4px_0_#161426]">
                <div className="flex items-center justify-between">
                  <span className="font-black text-sm flex items-center gap-1.5">
                    <MusicNotes weight="fill" className="w-4 h-4 text-[#9333ea]" />
                    <span>{ar ? 'موسيقى الخلفية' : 'Background Music'}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      soundManager.setMusicEnabled(!audioState.musicEnabled)
                    }
                    className={`px-3 py-1 rounded-full border-2 border-[#161426] text-xs font-black cursor-pointer ${
                      audioState.musicEnabled
                        ? 'bg-[#8ac926] text-[#161426]'
                        : 'bg-[#e2e8f0] text-[#475569]'
                    }`}
                  >
                    {audioState.musicEnabled
                      ? ar
                        ? 'شغّال ✓'
                        : 'ON ✓'
                      : ar
                      ? 'مكتوم'
                      : 'OFF'}
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.02}
                    value={audioState.musicVolume}
                    onChange={(e) =>
                      soundManager.setMusicVolume(parseFloat(e.target.value))
                    }
                    className="w-full accent-[#9333ea] cursor-pointer"
                  />
                  <span className="text-xs font-black w-10 text-end">
                    {Math.round(audioState.musicVolume * 100)}%
                  </span>
                </div>
                <div className="text-[11px] font-bold text-[#3f3b5c] truncate">
                  {ar ? 'تعمل الآن: ' : 'Playing: '}
                  <span className="font-black text-[#9333ea]">
                    {ar ? currentTrackMeta.title_ar : currentTrackMeta.title_en}
                  </span>
                </div>
              </div>

              {/* SFX Box */}
              <div className="rounded-2xl bg-white border-3 border-[#161426] p-3.5 space-y-2.5 shadow-[0_4px_0_#161426]">
                <div className="flex items-center justify-between">
                  <span className="font-black text-sm flex items-center gap-1.5">
                    <SlidersHorizontal
                      weight="fill"
                      className="w-4 h-4 text-[#0284c7]"
                    />
                    <span>{ar ? 'المؤثرات الصوتية (SFX)' : 'Sound Effects (SFX)'}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      soundManager.setSfxEnabled(!audioState.sfxEnabled)
                    }
                    className={`px-3 py-1 rounded-full border-2 border-[#161426] text-xs font-black cursor-pointer ${
                      audioState.sfxEnabled
                        ? 'bg-[#8ac926] text-[#161426]'
                        : 'bg-[#e2e8f0] text-[#475569]'
                    }`}
                  >
                    {audioState.sfxEnabled
                      ? ar
                        ? 'شغّال ✓'
                        : 'ON ✓'
                      : ar
                      ? 'مكتوم'
                      : 'OFF'}
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={audioState.sfxVolume}
                    onChange={(e) => {
                      soundManager.setSfxVolume(parseFloat(e.target.value));
                    }}
                    className="w-full accent-[#0284c7] cursor-pointer"
                  />
                  <span className="text-xs font-black w-10 text-end">
                    {Math.round(audioState.sfxVolume * 100)}%
                  </span>
                </div>
                <div className="text-[11px] font-bold text-[#3f3b5c]">
                  {ar
                    ? 'أصوات ورق، نرد، مقص، فتيل، وانفجار حقيقية (Foley)'
                    : 'Real studio-recorded cards, dice, wire snip & explosion'}
                </div>
              </div>
            </div>

            {/* 2. Music Track Mode Picker (Auto Per Game vs Lock Favorite Track!) */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h3 className="font-black text-sm sm:text-base text-[#161426]">
                  {ar
                    ? '١. اختر نظام الموسيقى (تلقائي لكل لعبة أو تثبيت مقطوعة واحدة):'
                    : '1. Choose Music Mode (Auto per game mood or lock one track):'}
                </h3>
              </div>

              <div className="grid grid-cols-1 gap-2">
                {/* Auto Per-Game Mood Option */}
                <button
                  type="button"
                  onClick={() => soundManager.setMusicMode('auto')}
                  className={`w-full text-start p-3 rounded-2xl border-3 border-[#161426] transition-all flex items-center justify-between gap-3 cursor-pointer ${
                    audioState.musicMode === 'auto'
                      ? 'bg-[#ffca3a] shadow-[0_4px_0_#161426]'
                      : 'bg-white hover:bg-[#fef3c7]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-8 h-8 rounded-xl bg-[#161426] text-[#ffca3a] flex items-center justify-center shrink-0">
                      <Sparkle weight="fill" className="w-4 h-4" />
                    </span>
                    <div className="min-w-0">
                      <div className="font-black text-sm text-[#161426]">
                        {ar
                          ? 'تلقائي حسب أجواء كل لعبة (موصى به)'
                          : 'Auto-Match Each Game Atmosphere (Recommended)'}
                      </div>
                      <div className="text-[11px] font-bold text-[#3f3b5c]">
                        {ar
                          ? 'يشغّل «خطوة عالساكت» بالفتيل الملعون وتفتيش الشريف، ومقطوعة خاصة لكل لعبة تلقائياً!'
                          : 'Plays "Silent Tiptoe" in BoomDeck/Sheriff, and matches each game automatically!'}
                      </div>
                    </div>
                  </div>
                  {audioState.musicMode === 'auto' && (
                    <span className="w-6 h-6 rounded-full bg-[#8ac926] border-2 border-[#161426] flex items-center justify-center shrink-0">
                      <Check weight="bold" className="w-3.5 h-3.5" />
                    </span>
                  )}
                </button>

                {/* Individual Real Kevin MacLeod MP3 Tracks */}
                {(Object.keys(MUSIC_TRACKS) as MusicTrackId[]).map((trackId) => {
                  const tr = MUSIC_TRACKS[trackId];
                  const isSelected = audioState.musicMode === trackId;
                  const isCurrentlyPlaying =
                    audioState.musicEnabled &&
                    audioState.resolvedTrackId === trackId;
                  return (
                    <button
                      key={trackId}
                      type="button"
                      onClick={() => {
                        if (!audioState.musicEnabled) {
                          soundManager.setMusicEnabled(true);
                        }
                        soundManager.setMusicMode(trackId as MusicSelectionMode);
                      }}
                      className={`w-full text-start p-2.5 sm:p-3 rounded-2xl border-3 border-[#161426] transition-all flex items-center justify-between gap-3 cursor-pointer ${
                        isSelected
                          ? 'bg-[#e9d5ff] shadow-[0_4px_0_#161426]'
                          : 'bg-white hover:bg-[#f3e8ff]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className={`w-8 h-8 rounded-xl border-2 border-[#161426] flex items-center justify-center shrink-0 ${
                            isCurrentlyPlaying
                              ? 'bg-[#8ac926] text-[#161426]'
                              : 'bg-[#161426] text-white'
                          }`}
                        >
                          <Play weight="fill" className="w-4 h-4" />
                        </span>
                        <div className="min-w-0">
                          <div className="font-black text-xs sm:text-sm text-[#161426] flex items-center gap-1.5">
                            <span>{ar ? tr.title_ar : tr.title_en}</span>
                            {isCurrentlyPlaying && (
                              <span className="px-2 py-0.5 rounded-full bg-[#8ac926] text-[#161426] border border-[#161426] text-[10px] font-black">
                                {ar ? 'شغّالة الآن' : 'Playing'}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] font-bold text-[#3f3b5c] truncate">
                            {ar ? `مناسبة لـ: ${tr.vibe_ar}` : `Fits: ${tr.vibe_en}`}
                          </div>
                        </div>
                      </div>
                      <span className="text-[11px] font-black px-2.5 py-1 rounded-xl bg-[#161426] text-[#ffca3a] shrink-0">
                        {isSelected
                          ? ar
                            ? 'مثبّتة ✓'
                            : 'Locked ✓'
                          : ar
                          ? 'تشغيل وتثبيت'
                          : 'Play & Lock'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Interactive SFX Soundboard (Audition Every Real Sound!) */}
            <div className="space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-black text-sm sm:text-base text-[#161426]">
                  {ar
                    ? '٢. جرّب المؤثرات الصوتية الحقيقية (اضغط للاستماع):'
                    : '2. Preview Real Recorded Sound Effects (Click to listen):'}
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    if (!audioState.sfxEnabled) soundManager.setSfxEnabled(true);
                    soundManager.playDefuseShowdownSequence();
                  }}
                  className="px-3 py-1 rounded-xl bg-[#22c55e] text-[#161426] border-2 border-[#161426] shadow-[0_2px_0_#161426] text-xs font-black flex items-center gap-1.5 cursor-pointer"
                >
                  <Play weight="fill" className="w-3.5 h-3.5" />
                  <span>
                    {ar
                      ? 'جرّب صوت «تكتكة القنبلة + قص المقص» معاً!'
                      : 'Test Bomb Tick + Wire Snip Combo!'}
                  </span>
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {FEATURED_SFX_IDS.map((sfxId) => {
                  const sfx = SFX_CATALOG[sfxId];
                  return (
                    <button
                      key={sfxId}
                      type="button"
                      onClick={() => {
                        if (!audioState.sfxEnabled) {
                          soundManager.setSfxEnabled(true);
                        }
                        soundManager.playSfx(sfxId);
                      }}
                      className="p-2.5 rounded-xl bg-white hover:bg-[#e0f2fe] border-2 border-[#161426] shadow-[0_3px_0_#161426] active:translate-y-0.5 flex items-center gap-2 text-start cursor-pointer"
                    >
                      <span className="w-6 h-6 rounded-lg bg-[#00bbf9] text-[#161426] border border-[#161426] flex items-center justify-center shrink-0">
                        <Play weight="fill" className="w-3 h-3" />
                      </span>
                      <span className="text-xs font-black text-[#161426] leading-tight">
                        {ar ? sfx.label_ar : sfx.label_en}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
