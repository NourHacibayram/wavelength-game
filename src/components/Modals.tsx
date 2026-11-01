import React, { useState, useEffect } from 'react';
import {
  CaretLeft,
  CaretRight,
  Clock,
  X,
  PlusCircle,
  MagnifyingGlass,
  Users,
} from '@phosphor-icons/react';
import { TRANSLATIONS, Lang } from '../data/translations';
import { PartyGameId } from '../data/partyGamesData';
import { PARTY_GAMES_CATALOG } from '../data/extraGamesData';
import { HOME_SHELVES, HomeShelfId, getHomeGameMeta, readableInk } from '../data/homeGameMeta';
import { GameCard, minutesLabel, playerRange } from './GameCard';
import { PartyGameSvgIcon } from './CartoonIcons';
import { GameTutorialPlayer } from './tutorials/GameTutorialPlayer';

/* ============================================================================
 * 1. FOCUSED SINGLE-GAME ANIMATED HOW-TO-PLAY MODAL
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
  const [autoPlay, setAutoPlay] = useState<boolean>(true);

  useEffect(() => {
    if (isOpen) {
      setActiveStep(0);
      setAutoPlay(true);
    }
  }, [isOpen, activeGameId]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const gameMeta =
    PARTY_GAMES_CATALOG.find((g) => g.id === activeGameId) || PARTY_GAMES_CATALOG[0];
  const rules = lang === 'ar' ? gameMeta.rules_ar : gameMeta.rules_en;
  const homeMeta = getHomeGameMeta(gameMeta.id);

  // Choosing a step means the reader took over: stop auto-advancing under them
  const goToStep = (step: number) => {
    setAutoPlay(false);
    setActiveStep(((step % rules.length) + rules.length) % rules.length);
  };

  const gotItButton = (
    <button
      type="button"
      onClick={onClose}
      className="cartoon-btn bg-[#8ac926] hover:bg-[#9be02f] text-[#161426] w-full py-3 text-lg shrink-0"
    >
      {lang === 'ar' ? 'فهمت عليها' : 'Got it'}
    </button>
  );

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-xs"
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className="cartoon-card w-full max-w-6xl overflow-hidden relative animate-in fade-in zoom-in-95 duration-150 max-h-[94dvh] flex flex-col"
      >
        {/* Poster band: the game's own color, name and pitch */}
        <div
          style={{ backgroundColor: homeMeta.poster, color: readableInk(homeMeta.poster) }}
          className="relative shrink-0 flex items-center gap-3 sm:gap-4 ps-4 sm:ps-6 pe-16 py-3 border-b-4 border-[#161426] overflow-hidden"
        >
          <div className="home-halftone absolute inset-0 pointer-events-none" />
          <PartyGameSvgIcon
            gameId={gameMeta.id}
            className="relative w-14 h-14 sm:w-16 sm:h-16 shrink-0 -rotate-3 drop-shadow-[0_3px_0_rgba(22,20,38,0.3)]"
          />
          <div className="relative min-w-0">
            <h2 className="text-2xl sm:text-3xl font-extrabold leading-tight truncate">
              {lang === 'ar' ? gameMeta.name_ar : gameMeta.name_en}
            </h2>
            <p className="text-sm sm:text-base font-bold leading-snug">
              {lang === 'ar' ? homeMeta.hook_ar : homeMeta.hook_en}
            </p>
          </div>
          <div className="relative hidden md:flex items-center gap-4 ms-auto shrink-0 text-sm font-extrabold">
            <span className="inline-flex items-center gap-1.5" dir="ltr">
              <Users weight="fill" className="w-4 h-4" />
              {playerRange(gameMeta)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock weight="fill" className="w-4 h-4" />
              {minutesLabel(homeMeta.minutes, lang)}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={lang === 'ar' ? 'سكّر' : 'Close'}
            className="absolute top-1/2 -translate-y-1/2 end-4 z-10 w-10 h-10 rounded-full bg-white text-[#161426] border-3 border-[#161426] shadow-[0_3px_0_#161426] flex items-center justify-center cursor-pointer hover:bg-[#fff1c2]"
          >
            <X weight="bold" className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto no-scrollbar p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 items-start">
          {/* The animated scene is the star: the steps only caption it */}
          <div className="lg:col-span-8 min-w-0">
            <GameTutorialPlayer
              gameId={gameMeta.id}
              lang={lang}
              controlledStep={activeStep}
              onStepChange={setActiveStep}
              autoPlay={autoPlay}
            />
          </div>

          {/* Phones: one step at a time, so the scene stays in view */}
          <div className="lg:hidden space-y-3">
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => goToStep(activeStep - 1)}
                aria-label={lang === 'ar' ? 'الخطوة السابقة' : 'Previous step'}
                className="cartoon-btn bg-white text-[#161426] w-11 h-11 shrink-0 flex items-center justify-center"
              >
                {lang === 'ar' ? <CaretRight weight="bold" className="w-5 h-5" /> : <CaretLeft weight="bold" className="w-5 h-5" />}
              </button>
              <p className="flex-1 min-w-0 min-h-[6.5rem] flex items-center text-base font-bold text-[#161426] leading-snug">
                {rules[activeStep]}
              </p>
              <button
                type="button"
                onClick={() => goToStep(activeStep + 1)}
                aria-label={lang === 'ar' ? 'الخطوة التالية' : 'Next step'}
                className="cartoon-btn bg-[#ffca3a] text-[#161426] w-11 h-11 shrink-0 flex items-center justify-center"
              >
                {lang === 'ar' ? <CaretLeft weight="bold" className="w-5 h-5" /> : <CaretRight weight="bold" className="w-5 h-5" />}
              </button>
            </div>
            {gotItButton}
          </div>

          {/* Desktop: every step at a glance, click any to jump the scene */}
          <div className="hidden lg:flex lg:col-span-4 flex-col gap-3 h-full">
            <ol className="space-y-1.5 flex-1">
              {rules.map((stepText, idx) => {
                const isCurrentStep = idx === activeStep;
                return (
                  <li key={idx}>
                    <button
                      type="button"
                      onClick={() => goToStep(idx)}
                      aria-current={isCurrentStep ? 'step' : undefined}
                      className={`w-full text-start flex items-start gap-2.5 p-2.5 rounded-2xl border-3 transition-colors cursor-pointer ${
                        isCurrentStep
                          ? 'bg-[#ffca3a] border-[#161426] shadow-[0_3px_0_#161426]'
                          : 'border-transparent hover:bg-[#fff1c2]'
                      }`}
                    >
                      <span
                        className={`w-7 h-7 rounded-full font-extrabold text-sm flex items-center justify-center shrink-0 ${
                          isCurrentStep ? 'bg-[#161426] text-[#ffca3a]' : 'bg-[#161426]/10 text-[#161426]'
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <span
                        className={`text-[15px] leading-snug ${
                          isCurrentStep ? 'font-extrabold text-[#161426]' : 'font-semibold text-[#3f3b5c]'
                        }`}
                      >
                        {stepText}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
            {gotItButton}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
 * 2. CATEGORIZED GAME LIBRARY SWITCHER MODAL (For Lobby & In-Room!)
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
  const [cat, setCat] = useState<HomeShelfId | 'all'>('all');
  const [search, setSearch] = useState<string>('');

  if (!isOpen) return null;

  const currentGame = PARTY_GAMES_CATALOG.find((g) => g.id === activeGameId);

  const filters = [
    { id: 'all' as const, label: lang === 'ar' ? 'الكل' : 'All', count: PARTY_GAMES_CATALOG.length },
    ...HOME_SHELVES.map((s) => ({
      id: s.id,
      label: lang === 'ar' ? s.filter_ar : s.filter_en,
      count: PARTY_GAMES_CATALOG.filter((g) => g.category === s.id).length,
    })),
  ];

  const q = search.trim().toLowerCase();
  const filtered = PARTY_GAMES_CATALOG.filter((g) => {
    const matchCat = cat === 'all' || g.category === cat;
    const meta = getHomeGameMeta(g.id);
    const matchQ =
      !q ||
      [g.name_ar, g.name_en, g.desc_ar, g.desc_en, meta.hook_ar, meta.hook_en].some((text) =>
        text.toLowerCase().includes(q)
      );
    return matchCat && matchQ;
  });

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs"
    >
      <div
        role="dialog"
        aria-modal="true"
        className="cartoon-card w-full max-w-4xl p-4 sm:p-6 relative animate-in fade-in zoom-in-95 duration-150 max-h-[90dvh] flex flex-col gap-3 sm:gap-4"
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#161426] leading-tight">
              {lang === 'ar' ? 'شو بدكم تلعبوا هلق؟' : 'What’s next?'}
            </h2>
            {currentGame && (
              <p className="text-sm font-bold text-[#3f3b5c] truncate">
                {lang === 'ar' ? 'عم تلعبوا: ' : 'Now playing: '}
                {lang === 'ar' ? currentGame.name_ar : currentGame.name_en}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={lang === 'ar' ? 'سكّر' : 'Close'}
            className="cartoon-btn bg-[#ff595e] text-white w-10 h-10 flex items-center justify-center shrink-0"
          >
            <X weight="bold" className="w-5 h-5" />
          </button>
        </div>

        {/* Category Filter Pills + Search */}
        <div className="flex flex-col md:flex-row md:items-center gap-2.5 justify-between">
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-1 -mx-4 px-4 sm:-mx-6 sm:px-6 md:mx-0 md:px-0 md:flex-wrap">
            {filters.map((f) => {
              const active = cat === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setCat(f.id)}
                  aria-pressed={active}
                  className={`shrink-0 whitespace-nowrap rounded-full px-3 py-1 text-sm font-extrabold border-3 border-[#161426] cursor-pointer transition-colors ${
                    active ? 'bg-[#161426] text-[#ffca3a]' : 'bg-white text-[#161426] hover:bg-[#fff1c2]'
                  }`}
                >
                  {f.label} <span className="opacity-70">{f.count}</span>
                </button>
              );
            })}
          </div>

          <div className="relative md:w-44 shrink-0">
            <MagnifyingGlass
              weight="bold"
              className="w-4 h-4 text-[#3f3b5c] absolute top-1/2 -translate-y-1/2 start-3 pointer-events-none"
            />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={lang === 'ar' ? 'دوّر على لعبة' : 'Find a game'}
              aria-label={lang === 'ar' ? 'دوّر على لعبة' : 'Find a game'}
              className="cartoon-input w-full ps-9 pe-3 py-1.5 bg-white text-[#161426] text-sm focus:outline-none focus:ring-4 focus:ring-[#ffca3a]"
            />
          </div>
        </div>

        {/* Games Grid: rows keep their natural height so the poster art never collapses */}
        <div className="relative flex-1 min-h-0 flex flex-col -mx-1">
          {filtered.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 auto-rows-max gap-x-3 gap-y-4 sm:gap-x-4 sm:gap-y-5 overflow-y-auto flex-1 min-h-0 px-2 pt-2 pb-8">
              {filtered.map((g, i) => (
                <GameCard
                  key={g.id}
                  game={g}
                  lang={lang}
                  index={i}
                  isPicked={g.id === activeGameId}
                  onSelect={() => {
                    onSelectGame(g.id);
                    onClose();
                  }}
                  onOpenGuide={onLearnGame ? () => onLearnGame(g.id) : undefined}
                  guideAlwaysVisible
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <p className="text-lg font-extrabold text-[#161426]">
                {lang === 'ar' ? 'ما لقينا لعبة بهالاسم' : 'No game by that name'}
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setCat('all');
                }}
                className="cartoon-btn bg-[#ffca3a] text-[#161426] px-4 py-2 text-sm mt-3"
              >
                {lang === 'ar' ? 'رجّع كل الألعاب' : 'Show all games'}
              </button>
            </div>
          )}
          {/* Fade hints that the list keeps scrolling */}
          <div className="absolute bottom-0 inset-x-0 h-8 bg-gradient-to-t from-[#fff9ec] to-transparent pointer-events-none" />
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
