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
 * 1. DYNAMIC INTERACTIVE ANIMATED HOW-TO-PLAY MODAL (All 14 Party Games!)
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
  const [selectedId, setSelectedId] = useState<PartyGameId>(activeGameId);
  const [activeStep, setActiveStep] = useState<number>(0);

  useEffect(() => {
    if (isOpen && activeGameId) {
      setSelectedId(activeGameId);
      setActiveStep(0);
    }
  }, [isOpen, activeGameId]);

  if (!isOpen) return null;

  const gameMeta =
    PARTY_GAMES_CATALOG.find((g) => g.id === selectedId) || PARTY_GAMES_CATALOG[0];
  const rules = lang === 'ar' ? gameMeta.rules_ar : gameMeta.rules_en;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs">
      <div className="cartoon-card w-full max-w-3xl p-4 sm:p-6 relative animate-in fade-in zoom-in-95 duration-150 max-h-[92dvh] flex flex-col">
        <button
          type="button"
          onClick={onClose}
          className="cartoon-btn bg-[#ff595e] text-white w-10 h-10 flex items-center justify-center absolute top-4 end-4 z-10"
        >
          <X weight="bold" className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 pe-12 mb-2.5">
          <div
            style={{ backgroundColor: gameMeta.bgTint }}
            className="w-12 h-12 rounded-2xl border-3 border-[#161426] flex items-center justify-center shrink-0"
          >
            <PartyGameSvgIcon gameId={gameMeta.id} className="w-8 h-8" />
          </div>
          <div>
            <span className="text-xs font-extrabold text-[#3f3b5c] flex items-center gap-1">
              <FilmStrip weight="fill" className="w-3.5 h-3.5 text-[#1982c4]" />
              <span>
                {lang === 'ar'
                  ? 'شرح تفاعلي متحرك خطوة بخطوة:'
                  : 'Step-by-Step Animated Guide:'}
              </span>
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#161426] leading-tight">
              {lang === 'ar' ? gameMeta.name_ar : gameMeta.name_en}
            </h2>
          </div>
        </div>

        {/* Quick Game Switcher Chips (All 14 Games) */}
        <div className="flex gap-1.5 overflow-x-auto pb-2.5 mb-3 border-b-3 border-[#161426]/10 shrink-0">
          {PARTY_GAMES_CATALOG.map((g) => {
            const active = g.id === selectedId;
            return (
              <button
                key={g.id}
                type="button"
                onClick={() => {
                  setSelectedId(g.id);
                  setActiveStep(0);
                }}
                className={`cartoon-badge px-3 py-1 text-xs flex items-center gap-1.5 shrink-0 cursor-pointer transition-colors ${
                  active
                    ? 'bg-[#ffca3a] text-[#161426]'
                    : 'bg-white text-[#161426] hover:bg-[#fff1c2]'
                }`}
              >
                <PartyGameSvgIcon gameId={g.id} className="w-4 h-4" />
                <span>{lang === 'ar' ? g.name_ar : g.name_en}</span>
              </button>
            );
          })}
        </div>

        {/* Scrollable Content: Animated SVG Stage + Synchronized 4 Clickable Steps */}
        <div className="space-y-3 overflow-y-auto pr-1 flex-1">
          {/* Live 4-Step Animated SVG Theater */}
          <GameTutorialPlayer
            gameId={selectedId}
            lang={lang}
            controlledStep={activeStep}
            onStepChange={setActiveStep}
          />

          {/* Summary Banner */}
          <p className="text-xs sm:text-sm font-bold text-[#3f3b5c] bg-[#fff1c2] px-3.5 py-2.5 rounded-2xl border-2 border-[#161426]">
            {lang === 'ar' ? gameMeta.longDesc_ar : gameMeta.longDesc_en}
          </p>

          {/* 4 Clickable Synchronized Rule Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {rules.map((stepText, idx) => {
              const isCurrentStep = idx === activeStep;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveStep(idx)}
                  className={`text-start flex items-start gap-2.5 p-3 rounded-2xl border-3 border-[#161426] transition-all cursor-pointer ${
                    isCurrentStep
                      ? 'bg-[#ffca3a] shadow-[0_4px_0_#161426] -translate-y-0.5 ring-2 ring-[#161426]'
                      : 'bg-white hover:bg-[#fffdf5] shadow-[0_3px_0_#161426]'
                  }`}
                >
                  <span
                    className={`w-7 h-7 rounded-xl font-extrabold text-xs flex items-center justify-center shrink-0 border-2 border-[#161426] ${
                      isCurrentStep
                        ? 'bg-[#161426] text-[#ffca3a]'
                        : 'bg-[#fff1c2] text-[#161426]'
                    }`}
                  >
                    {idx + 1}
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-[#161426] leading-relaxed">
                    {stepText}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="cartoon-btn bg-[#8ac926] text-[#161426] w-full py-2.5 sm:py-3 mt-3 text-base sm:text-lg shrink-0"
        >
          {lang === 'ar' ? 'فهمت اللعب، يلا نبلش!' : 'Got It, Let’s Play!'}
        </button>
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
    { id: 'all', ar: 'الكل (14)', en: 'All (14)' },
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
                  ? 'مكتبة ألعاب الشلّة (14 لعبة جماعية)'
                  : 'Party Games Library (14 Games)'}
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
