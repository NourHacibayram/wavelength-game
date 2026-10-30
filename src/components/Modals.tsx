import React, { useState, useEffect } from 'react';
import {
  X,
  PlusCircle,
  Check,
  MagnifyingGlass,
  Users,
  GameController,
  Sparkle,
  FilmStrip,
} from '@phosphor-icons/react';
import { TRANSLATIONS, Lang } from '../data/translations';
import { PartyGameId, PartyGameCategory } from '../data/partyGamesData';
import { PARTY_GAMES_CATALOG } from '../data/extraGamesData';
import { PartyGameSvgIcon } from './CartoonIcons';
import { GameTutorialPlayer } from './tutorials/GameTutorialPlayer';

/* ============================================================================
 * 1. FOCUSED SINGLE-GAME ANIMATED HOW-TO-PLAY MODAL (Zero Clutter, Zero Scrollbars!)
 * ========================================================================== */
interface HowToPlayModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Lang;
  activeGameId?: PartyGameId;
}

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({
  isOpen,
  onClose,
  lang,
  activeGameId = 'wavelength',
}) => {
  const [activeStep, setActiveStep] = useState<number>(0);

  useEffect(() => {
    if (isOpen) {
      setActiveStep(0);
    }
  }, [isOpen, activeGameId]);

  if (!isOpen) return null;

  const gameMeta =
    PARTY_GAMES_CATALOG.find((g) => g.id === activeGameId) || PARTY_GAMES_CATALOG[0];
  const rules = lang === 'ar' ? gameMeta.rules_ar : gameMeta.rules_en;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-xs"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="cartoon-card w-full max-w-6xl p-5 sm:p-7 lg:p-8 relative animate-in fade-in zoom-in-95 duration-150 max-h-[94dvh] overflow-y-auto no-scrollbar"
      >
        <button
          type="button"
          onClick={onClose}
          className="cartoon-btn bg-[#ff595e] text-white w-11 h-11 flex items-center justify-center absolute top-5 end-5 z-10"
        >
          <X weight="bold" className="w-6 h-6" />
        </button>

        {/* Big Clean Single-Game Header */}
        <div className="flex items-center gap-4 pe-14 mb-5">
          <div
            style={{ backgroundColor: gameMeta.bgTint }}
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl border-4 border-[#161426] shadow-[0_4px_0_#161426] flex items-center justify-center shrink-0"
          >
            <PartyGameSvgIcon gameId={gameMeta.id} className="w-10 h-10 sm:w-11 sm:h-11" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-0.5">
              <span className="text-xs sm:text-sm font-extrabold text-[#3f3b5c] flex items-center gap-1.5">
                <FilmStrip weight="fill" className="w-4 h-4 text-[#1982c4]" />
                <span>
                  {lang === 'ar'
                    ? 'شرح اللعبة خطوة بخطوة:'
                    : 'Step-by-Step Game Guide:'}
                </span>
              </span>
              <span className="cartoon-badge bg-[#fff1c2] text-[#161426] px-3 py-0.5 text-xs inline-flex items-center gap-1">
                <Users weight="fill" className="w-3.5 h-3.5" />
                <span>
                  {lang === 'ar' ? gameMeta.players_ar : gameMeta.players_en}
                </span>
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#161426] leading-tight truncate">
              {lang === 'ar' ? gameMeta.name_ar : gameMeta.name_en}
            </h2>
          </div>
        </div>

        {/* Spacious Cinema 2-Column Theater Layout — Large SVG + Large Readable Steps, Zero Scrollbars! */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Large Animated SVG Stage + Game Pitch (7 Cols on Desktop = ~640px wide!) */}
          <div className="lg:col-span-7 flex flex-col justify-between gap-4">
            <GameTutorialPlayer
              gameId={gameMeta.id}
              lang={lang}
              controlledStep={activeStep}
              onStepChange={setActiveStep}
            />

            <p className="text-sm sm:text-base font-extrabold text-[#3f3b5c] bg-[#fff1c2] px-4 py-3.5 rounded-2xl border-3 border-[#161426] shadow-[0_3px_0_#161426] leading-relaxed">
              {lang === 'ar' ? gameMeta.longDesc_ar : gameMeta.longDesc_en}
            </p>
          </div>

          {/* 4 Large Synchronized Clickable Steps + Ready Button (5 Cols on Desktop) */}
          <div className="lg:col-span-5 flex flex-col justify-between gap-3.5">
            <div className="space-y-2.5">
              {rules.map((stepText, idx) => {
                const isCurrentStep = idx === activeStep;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveStep(idx)}
                    className={`w-full text-start flex items-start gap-3 p-3.5 sm:p-4 rounded-2xl border-3 border-[#161426] transition-all cursor-pointer ${
                      isCurrentStep
                        ? 'bg-[#ffca3a] shadow-[0_5px_0_#161426] -translate-y-0.5 ring-2 ring-[#161426]'
                        : 'bg-white hover:bg-[#fffdf5] shadow-[0_3px_0_#161426]'
                    }`}
                  >
                    <span
                      className={`w-8 h-8 rounded-xl font-extrabold text-sm flex items-center justify-center shrink-0 border-2 border-[#161426] mt-0.5 ${
                        isCurrentStep
                          ? 'bg-[#161426] text-[#ffca3a]'
                          : 'bg-[#fff1c2] text-[#161426]'
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <span className="text-sm sm:text-base font-extrabold text-[#161426] leading-relaxed">
                      {stepText}
                    </span>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="cartoon-btn bg-[#8ac926] hover:bg-[#9be02f] text-[#161426] w-full py-3.5 sm:py-4 text-lg sm:text-xl shrink-0"
            >
              {lang === 'ar' ? 'فهمت اللعب، يلا نبلش!' : 'Got It, Let’s Play!'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
 * 2. CATEGORIZED 14-GAME LIBRARY SWITCHER MODAL (For Lobby & In-Room!)
 * ========================================================================== */
interface GamePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeGameId: PartyGameId;
  onSelectGame: (gameId: PartyGameId) => void;
  onLearnGame?: (gameId: PartyGameId) => void;
  lang: Lang;
}

export const GamePickerModal: React.FC<GamePickerModalProps> = ({
  isOpen,
  onClose,
  activeGameId,
  onSelectGame,
  onLearnGame,
  lang,
}) => {
  const [cat, setCat] = useState<PartyGameCategory>('all');
  const [search, setSearch] = useState<string>('');

  if (!isOpen) return null;

  const categories: { id: PartyGameCategory; ar: string; en: string }[] = [
    { id: 'all', ar: `الكل (${PARTY_GAMES_CATALOG.length})`, en: `All (${PARTY_GAMES_CATALOG.length})` },
    { id: 'telepathy', ar: 'تخاطر وخيال', en: 'Mind & Imagination' },
    { id: 'bluff', ar: 'خداع وجواسيس', en: 'Bluff & Spies' },
    { id: 'drawing', ar: 'رسم وإبداع', en: 'Drawing' },
    { id: 'speed', ar: 'سرعة وتحدي', en: 'Speed & Wagers' },
  ];

  const filtered = PARTY_GAMES_CATALOG.filter((g) => {
    const matchCat = cat === 'all' || g.category === cat;
    const q = search.trim().toLowerCase();
    const matchQ =
      !q ||
      g.name_ar.toLowerCase().includes(q) ||
      g.name_en.toLowerCase().includes(q) ||
      g.desc_ar.toLowerCase().includes(q) ||
      g.desc_en.toLowerCase().includes(q);
    return matchCat && matchQ;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs">
      <div className="cartoon-card w-full max-w-4xl p-5 sm:p-6 relative animate-in fade-in zoom-in-95 duration-150 max-h-[90dvh] flex flex-col space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-11 h-11 rounded-2xl bg-[#ffca3a] border-3 border-[#161426] flex items-center justify-center shrink-0">
              <GameController weight="fill" className="w-6 h-6 text-[#161426]" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-[#161426] leading-tight">
                {lang === 'ar'
                  ? `مكتبة ألعاب الشلّة (${PARTY_GAMES_CATALOG.length} لعبة جماعية)`
                  : `Party Games Library (${PARTY_GAMES_CATALOG.length} Games)`}
              </h2>
              <p className="text-xs font-bold text-[#3f3b5c]">
                {lang === 'ar'
                  ? 'بدّل اللعبة فوراً أو اضغط «شرح متحرك» لتعلّم أي لعبة!'
                  : 'Switch games anytime or watch the animated guide for any game!'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="cartoon-btn bg-[#ff595e] text-white w-10 h-10 flex items-center justify-center shrink-0"
          >
            <X weight="bold" className="w-5 h-5" />
          </button>
        </div>

        {/* Category Filter Pills + Search */}
        <div className="flex flex-col sm:flex-row gap-2.5 justify-between">
          <div className="flex flex-wrap gap-1.5">
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCat(c.id)}
                className={`cartoon-badge px-3 py-1 text-xs cursor-pointer transition-colors ${
                  cat === c.id
                    ? 'bg-[#161426] text-[#ffca3a]'
                    : 'bg-white text-[#161426] hover:bg-[#fff1c2]'
                }`}
              >
                {lang === 'ar' ? c.ar : c.en}
              </button>
            ))}
          </div>

          <div className="relative sm:w-56">
            <MagnifyingGlass
              weight="bold"
              className="w-4 h-4 text-[#3f3b5c] absolute top-1/2 -translate-y-1/2 start-3 pointer-events-none"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={lang === 'ar' ? 'ابحث عن لعبة...' : 'Search games...'}
              className="cartoon-input w-full ps-9 pe-3 py-1.5 bg-white text-[#161426] text-xs"
            />
          </div>
        </div>

        {/* Games Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 overflow-y-auto pr-1 flex-1">
          {filtered.map((g) => {
            const isCurrent = g.id === activeGameId;
            return (
              <div
                key={g.id}
                onClick={() => {
                  onSelectGame(g.id);
                  onClose();
                }}
                className={`p-3.5 rounded-2xl border-4 border-[#161426] text-start transition-all cursor-pointer flex flex-col justify-between gap-2.5 ${
                  isCurrent
                    ? 'bg-[#ffca3a] shadow-[0_5px_0_#161426] -translate-y-0.5'
                    : 'bg-white hover:bg-[#fffdf5] shadow-[0_4px_0_#161426] hover:-translate-y-0.5'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div
                      style={{ backgroundColor: g.bgTint }}
                      className="w-12 h-12 rounded-2xl border-3 border-[#161426] flex items-center justify-center shrink-0"
                    >
                      <PartyGameSvgIcon gameId={g.id} className="w-8 h-8" />
                    </div>
                    <div>
                      <div className="font-extrabold text-base text-[#161426] leading-tight flex items-center gap-1.5">
                        <span>{lang === 'ar' ? g.name_ar : g.name_en}</span>
                      </div>
                      <span className="text-[11px] font-extrabold text-[#3f3b5c] flex items-center gap-1 mt-0.5">
                        <Users weight="fill" className="w-3.5 h-3.5" />
                        <span>{lang === 'ar' ? g.players_ar : g.players_en}</span>
                      </span>
                    </div>
                  </div>

                  {isCurrent ? (
                    <span className="cartoon-badge bg-[#8ac926] text-[#161426] p-1">
                      <Check weight="bold" className="w-4 h-4" />
                    </span>
                  ) : g.isNew ? (
                    <span className="cartoon-badge bg-[#ff595e] text-white px-2 py-0.5 text-[10px] flex items-center gap-0.5">
                      <Sparkle weight="fill" className="w-3 h-3 text-[#ffca3a]" />
                      <span>{lang === 'ar' ? 'جديد' : 'NEW'}</span>
                    </span>
                  ) : null}
                </div>

                <p className="text-xs font-bold text-[#3f3b5c] leading-snug">
                  {lang === 'ar' ? g.desc_ar : g.desc_en}
                </p>

                {onLearnGame && (
                  <div className="flex justify-end pt-0.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onLearnGame(g.id);
                      }}
                      className="cartoon-badge bg-[#e0f2fe] hover:bg-[#bae6fd] text-[#161426] px-2.5 py-1 text-[11px] flex items-center gap-1 cursor-pointer"
                    >
                      <FilmStrip weight="fill" className="w-3.5 h-3.5 text-[#1982c4]" />
                      <span>{lang === 'ar' ? 'شرح متحرك' : 'Watch Guide'}</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
 * 3. CUSTOM SPECTRUM CARD MODAL (For Wavelength)
 * ========================================================================== */
interface CustomCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (left: string, right: string) => void;
  lang: Lang;
}

export const CustomCardModal: React.FC<CustomCardModalProps> = ({
  isOpen,
  onClose,
  onAdd,
  lang,
}) => {
  const [left, setLeft] = useState('');
  const [right, setRight] = useState('');
  const t = TRANSLATIONS[lang];

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!left.trim() || !right.trim()) return;
    onAdd(left.trim(), right.trim());
    setLeft('');
    setRight('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <form
        onSubmit={handleSubmit}
        className="cartoon-card w-full max-w-md p-6 relative animate-in fade-in zoom-in-95 duration-150"
      >
        <button
          type="button"
          onClick={onClose}
          className="cartoon-btn bg-[#ff595e] text-white w-10 h-10 flex items-center justify-center absolute top-4 end-4"
        >
          <X weight="bold" className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-4 pe-10">
          <PlusCircle weight="fill" className="w-7 h-7 text-[#1982c4]" />
          <h2 className="text-2xl font-extrabold text-[#161426]">{t.customCardTitle}</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block font-extrabold text-sm text-[#161426] mb-1">
              {t.leftSideLabel}
            </label>
            <input
              type="text"
              required
              maxLength={40}
              value={left}
              onChange={(e) => setLeft(e.target.value)}
              placeholder={lang === 'ar' ? 'مثلاً: أكلة رخيصة' : 'e.g. Underrated Snack'}
              className="cartoon-input w-full px-4 py-3 bg-[#e0f2fe] text-[#161426]"
            />
          </div>

          <div>
            <label className="block font-extrabold text-sm text-[#161426] mb-1">
              {t.rightSideLabel}
            </label>
            <input
              type="text"
              required
              maxLength={40}
              value={right}
              onChange={(e) => setRight(e.target.value)}
              placeholder={lang === 'ar' ? 'مثلاً: أكلة ملوك' : 'e.g. Overrated Snack'}
              className="cartoon-input w-full px-4 py-3 bg-[#ffe4e6] text-[#161426]"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="cartoon-btn bg-gray-200 text-[#161426] flex-1 py-3"
          >
            {t.cancel}
          </button>
          <button
            type="submit"
            className="cartoon-btn bg-[#ffca3a] text-[#161426] flex-2 py-3 text-lg"
          >
            {t.saveCard}
          </button>
        </div>
      </form>
    </div>
  );
};
