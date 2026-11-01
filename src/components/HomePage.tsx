import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  Brain,
  Clock,
  Detective,
  DeviceMobile,
  DiceFive,
  GameController,
  Image as ImageIcon,
  Lightning,
  MagnifyingGlass,
  PaintBrush,
  Play,
  Question,
  Users,
  X,
} from '@phosphor-icons/react';
import { CARTOON_AVATAR_COLORS } from '../lib/supabase';
import { Lang, TRANSLATIONS } from '../data/translations';
import { PartyGameId } from '../data/partyGamesData';
import { PARTY_GAMES_CATALOG, PartyGameCatalogItem } from '../data/extraGamesData';
import {
  HOME_SHELVES,
  HomeShelfId,
  getHomeGameMeta,
  readableInk,
} from '../data/homeGameMeta';
import { CartoonAvatarSvg, PartyGameSvgIcon } from './CartoonIcons';
import { GameCard, minutesLabel, playerRange } from './GameCard';
import { GameTutorialPlayer } from './tutorials/GameTutorialPlayer';

const SHELF_ICONS: Record<HomeShelfId, React.ElementType> = {
  bluff: Detective,
  telepathy: Brain,
  speed: Lightning,
  drawing: PaintBrush,
};

interface LaunchPanelProps {
  lang: Lang;
  game: PartyGameCatalogItem;
  playerName: string;
  onPlayerNameChange: (name: string) => void;
  playerColor: string;
  onPlayerColorChange: (color: string) => void;
  joinCode: string;
  onJoinCodeChange: (code: string) => void;
  loading: boolean;
  errorMsg: string | null;
  onCreateRoom: () => void;
  onJoinRoom: (e?: React.FormEvent) => void;
  onPassAndPlay: () => void;
  focusJoinCode?: boolean;
}

const LaunchPanel: React.FC<LaunchPanelProps> = ({
  lang,
  game,
  playerName,
  onPlayerNameChange,
  playerColor,
  onPlayerColorChange,
  joinCode,
  onJoinCodeChange,
  loading,
  errorMsg,
  onCreateRoom,
  onJoinRoom,
  onPassAndPlay,
  focusJoinCode,
}) => {
  const t = TRANSLATIONS[lang];
  const meta = getHomeGameMeta(game.id);
  const [showColors, setShowColors] = useState(false);
  const joinCodeRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (focusJoinCode) joinCodeRef.current?.focus();
  }, [focusJoinCode]);

  return (
    <div className="cartoon-card overflow-hidden">
      {/* Which game we are about to start */}
      <div
        style={{ backgroundColor: meta.poster, color: readableInk(meta.poster) }}
        className="flex items-center gap-3 px-5 py-3 border-b-4 border-[#161426]"
      >
        <PartyGameSvgIcon gameId={game.id} className="w-11 h-11 shrink-0" />
        <div className="min-w-0 leading-tight">
          <span className="text-xs font-bold block opacity-85">
            {lang === 'ar' ? 'اللعبة الليلة' : 'Tonight’s game'}
          </span>
          <span className="text-lg font-extrabold truncate block">
            {lang === 'ar' ? game.name_ar : game.name_en}
          </span>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {errorMsg && (
          <div
            role="alert"
            className="p-3 rounded-2xl bg-[#ff595e] text-white border-3 border-[#161426] font-extrabold text-sm text-center"
          >
            {errorMsg}
          </div>
        )}

        {/* Player Avatar + Name */}
        <div>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setShowColors((v) => !v)}
              aria-expanded={showColors}
              aria-label={lang === 'ar' ? 'غيّر لون شخصيتك' : 'Change your avatar color'}
              className="w-13 h-13 rounded-2xl bg-white border-3 border-[#161426] shadow-[0_3px_0_#161426] p-1 shrink-0 cursor-pointer hover:-translate-y-0.5 transition-transform"
            >
              <CartoonAvatarSvg
                index={CARTOON_AVATAR_COLORS.indexOf(playerColor)}
                color={playerColor}
              />
            </button>
            <input
              type="text"
              maxLength={18}
              value={playerName}
              onChange={(e) => onPlayerNameChange(e.target.value)}
              placeholder={t.namePlaceholder}
              aria-label={t.yourName}
              className="cartoon-input min-w-0 flex-1 px-4 py-2.5 bg-white text-[#161426] text-base focus:outline-none focus:ring-4 focus:ring-[#ffca3a]"
            />
          </div>

          {showColors && (
            <div className="grid grid-cols-8 gap-1.5 place-items-center pt-3">
              {CARTOON_AVATAR_COLORS.map((c, idx) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => onPlayerColorChange(c)}
                  aria-label={`${lang === 'ar' ? 'لون' : 'Color'} ${idx + 1}`}
                  aria-pressed={playerColor === c}
                  style={{ backgroundColor: c }}
                  className={`w-7 h-7 rounded-full border-3 border-[#161426] transition-transform cursor-pointer ${
                    playerColor === c
                      ? 'scale-115 shadow-[0_3px_0_#161426] ring-2 ring-[#161426]'
                      : 'hover:scale-110'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Create Online Room */}
        <div>
          <button
            type="button"
            disabled={loading}
            onClick={onCreateRoom}
            className="cartoon-btn w-full py-3.5 px-5 bg-[#8ac926] hover:bg-[#9be02f] text-[#161426] text-xl flex items-center justify-center gap-2"
          >
            <GameController weight="fill" className="w-6 h-6" />
            <span>{loading ? '...' : lang === 'ar' ? 'افتح غرفة' : 'Open a room'}</span>
          </button>
          <p className="text-xs font-bold text-[#3f3b5c] text-center mt-2.5">
            {lang === 'ar'
              ? 'بتبعت الرابط للشلّة، وبتبدّلوا اللعبة وقت ما بدكم'
              : 'Send the link to your group and switch games anytime'}
          </p>
        </div>

        {/* Pass & Play Same Device Mode */}
        <button
          type="button"
          onClick={onPassAndPlay}
          className="cartoon-btn w-full py-2.5 px-4 bg-white hover:bg-[#fef3c7] text-[#161426] text-base flex items-center justify-center gap-2"
        >
          <DeviceMobile weight="fill" className="w-5 h-5" />
          <span>{lang === 'ar' ? 'كلنا ع نفس الجهاز' : 'All on one device'}</span>
        </button>

        {/* Join Room Form */}
        <form
          onSubmit={onJoinRoom}
          className="pt-4 border-t-3 border-dashed border-[#161426]/25"
        >
          <label
            htmlFor={focusJoinCode === undefined ? 'home-join-code' : 'home-join-code-sheet'}
            className="block text-sm font-extrabold text-[#161426] mb-2"
          >
            {lang === 'ar' ? 'معك كود من صاحبك؟' : 'Got a code from a friend?'}
          </label>
          <div className="flex items-stretch gap-2">
            <input
              ref={joinCodeRef}
              id={focusJoinCode === undefined ? 'home-join-code' : 'home-join-code-sheet'}
              type="text"
              dir="ltr"
              maxLength={6}
              value={joinCode}
              onChange={(e) => onJoinCodeChange(e.target.value.toUpperCase())}
              placeholder={lang === 'ar' ? 'الكود' : 'CODE'}
              className="cartoon-input min-w-0 flex-1 px-3 py-2 bg-white text-[#161426] text-center font-extrabold text-base tracking-widest focus:outline-none focus:ring-4 focus:ring-[#ffca3a]"
            />
            <button
              type="submit"
              disabled={loading}
              className="cartoon-btn bg-[#161426] text-[#fff9ec] px-5 py-2 text-base shrink-0"
            >
              {lang === 'ar' ? 'فوت' : 'Join'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export interface HomePageProps {
  lang: Lang;
  selectedGame: PartyGameId;
  onSelectGame: (id: PartyGameId) => void;
  onOpenGuide: (id: PartyGameId) => void;
  playerName: string;
  onPlayerNameChange: (name: string) => void;
  playerColor: string;
  onPlayerColorChange: (color: string) => void;
  joinCode: string;
  onJoinCodeChange: (code: string) => void;
  loading: boolean;
  errorMsg: string | null;
  onCreateRoom: () => void;
  onJoinRoom: (e?: React.FormEvent) => void;
  onPassAndPlay: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  lang,
  selectedGame,
  onSelectGame,
  onOpenGuide,
  playerName,
  onPlayerNameChange,
  playerColor,
  onPlayerColorChange,
  joinCode,
  onJoinCodeChange,
  loading,
  errorMsg,
  onCreateRoom,
  onJoinRoom,
  onPassAndPlay,
}) => {
  const reduceMotion = useReducedMotion();
  const [shelfFilter, setShelfFilter] = useState<HomeShelfId | 'all'>('all');
  const [search, setSearch] = useState('');
  const [showDemo, setShowDemo] = useState(false);
  const [sheet, setSheet] = useState<'start' | 'join' | null>(null);

  const game = PARTY_GAMES_CATALOG.find((g) => g.id === selectedGame) || PARTY_GAMES_CATALOG[0];
  const meta = getHomeGameMeta(game.id);
  const stageInk = readableInk(meta.poster);
  const name = (g: PartyGameCatalogItem) => (lang === 'ar' ? g.name_ar : g.name_en);

  const pickRandomGame = () => {
    const others = PARTY_GAMES_CATALOG.filter((g) => g.id !== selectedGame);
    onSelectGame(others[Math.floor(Math.random() * others.length)].id);
  };

  // Errors live inside the launch panel, which sits in a closed sheet on phones
  useEffect(() => {
    if (errorMsg && window.matchMedia('(max-width: 1023.98px)').matches) {
      setSheet((current) => current || 'start');
    }
  }, [errorMsg]);

  useEffect(() => {
    if (!sheet) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSheet(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [sheet]);

  const query = search.trim().toLowerCase();
  const searchResults = query
    ? PARTY_GAMES_CATALOG.filter((g) =>
        [
          g.name_ar,
          g.name_en,
          g.desc_ar,
          g.desc_en,
          g.tag_ar,
          g.tag_en,
          getHomeGameMeta(g.id).hook_ar,
          getHomeGameMeta(g.id).hook_en,
        ].some((text) => text.toLowerCase().includes(query))
      )
    : [];
  const visibleShelves = HOME_SHELVES.filter((s) => shelfFilter === 'all' || s.id === shelfFilter);

  const launchPanelProps = {
    lang,
    game,
    playerName,
    onPlayerNameChange,
    playerColor,
    onPlayerColorChange,
    joinCode,
    onJoinCodeChange,
    loading,
    errorMsg,
    onCreateRoom,
    onJoinRoom,
    onPassAndPlay,
  };

  const renderCard = (g: PartyGameCatalogItem, index: number, layoutClass = '', isWide = false) => (
    <GameCard
      key={g.id}
      game={g}
      lang={lang}
      index={index}
      isPicked={g.id === selectedGame}
      layoutClass={layoutClass}
      isWide={isWide}
      onSelect={() => onSelectGame(g.id)}
      onOpenGuide={() => {
        onSelectGame(g.id);
        onOpenGuide(g.id);
      }}
    />
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start py-2 pb-24 lg:pb-2">
      {/* Launch panel: sticky on desktop, bottom sheet on phones */}
      <aside className="hidden lg:block lg:col-span-4 lg:sticky lg:top-4 lg:order-2">
        <LaunchPanel {...launchPanelProps} />
      </aside>

      <div className="lg:col-span-8 lg:order-1 space-y-8 min-w-0">
        {/* Spotlight stage: floods with the picked game's color */}
        <section
          style={{ backgroundColor: meta.poster, color: stageInk }}
          className="relative overflow-hidden rounded-[28px] border-4 border-[#120f29] shadow-[0_8px_0_#120f29] p-5 sm:p-7 transition-colors duration-300"
        >
          <div className="home-rays absolute pointer-events-none" />
          <div className="relative grid grid-cols-[minmax(0,1fr)_auto] sm:grid-cols-2 gap-x-4 gap-y-4 items-center">
            <div className={showDemo ? 'col-span-2 sm:col-span-1' : ''}>
              <span className="cartoon-badge inline-block bg-[#161426] text-[#fff9ec] px-3 py-0.5 text-xs mb-2">
                {lang === 'ar' ? game.tag_ar : game.tag_en}
              </span>
              <div key={game.id} className="home-text-in">
                <h2 className="text-3xl sm:text-4xl xl:text-5xl font-extrabold leading-[1.1]">
                  {name(game)}
                </h2>
                <p className="text-base sm:text-lg font-bold leading-snug mt-2 opacity-90">
                  {lang === 'ar' ? meta.hook_ar : meta.hook_en}
                </p>
                <div className="flex items-center gap-4 mt-3 text-sm font-extrabold">
                  <span className="inline-flex items-center gap-1.5" dir="ltr">
                    <Users weight="fill" className="w-4 h-4" />
                    {playerRange(game)}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Clock weight="fill" className="w-4 h-4" />
                    {minutesLabel(meta.minutes, lang)}
                  </span>
                </div>
              </div>
            </div>

            {/* Art, or the live animated tutorial in its place */}
            <div
              className={`sm:col-start-2 sm:row-start-1 sm:row-span-2 min-w-0 ${
                showDemo ? 'col-span-2 sm:col-span-1 text-[#fff9ec]' : ''
              }`}
            >
              {showDemo ? (
                <GameTutorialPlayer
                  gameId={game.id}
                  lang={lang}
                  compact={true}
                  onExpandModal={() => onOpenGuide(game.id)}
                />
              ) : (
                <div
                  key={game.id}
                  className="home-art-pop flex justify-center drop-shadow-[0_8px_0_rgba(22,20,38,0.3)]"
                >
                  <PartyGameSvgIcon
                    gameId={game.id}
                    className="w-28 h-28 sm:w-52 sm:h-52 xl:w-64 xl:h-64"
                  />
                </div>
              )}
            </div>

            <div className="col-span-2 sm:col-span-1 flex flex-wrap gap-2.5">
              <button
                type="button"
                onClick={() => setShowDemo((v) => !v)}
                aria-pressed={showDemo}
                className="cartoon-btn bg-[#fff9ec] text-[#161426] px-4 py-2 text-sm sm:text-base flex items-center gap-1.5"
              >
                {showDemo ? (
                  <ImageIcon weight="fill" className="w-4 h-4" />
                ) : (
                  <Play weight="fill" className="w-4 h-4" />
                )}
                <span>
                  {showDemo
                    ? lang === 'ar' ? 'سكّر الشرح' : 'Close guide'
                    : lang === 'ar' ? 'كيف بتنلعب؟' : 'How it plays'}
                </span>
              </button>
              <button
                type="button"
                onClick={pickRandomGame}
                className="cartoon-btn bg-[#161426] text-[#fff9ec] px-4 py-2 text-sm sm:text-base flex items-center gap-1.5"
              >
                <DiceFive weight="fill" className="w-4 h-4" />
                <span>{lang === 'ar' ? 'فاجئني' : 'Surprise me'}</span>
              </button>
            </div>
          </div>
        </section>

        {/* Phones: joining a friend's room must stay one tap away */}
        <button
          type="button"
          onClick={() => setSheet('join')}
          className="lg:hidden w-full flex items-center justify-between gap-3 text-sm font-extrabold text-[#fff9ec] px-1 cursor-pointer"
        >
          <span>{lang === 'ar' ? 'معك كود من صاحبك؟' : 'Got a code from a friend?'}</span>
          <span className="text-[#ffca3a] underline underline-offset-4 shrink-0">
            {lang === 'ar' ? 'فوت عالغرفة' : 'Join the room'}
          </span>
        </button>

        {/* Shelf filters & search */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex gap-2 overflow-x-auto no-scrollbar py-1 -mx-4 px-4 md:mx-0 md:px-0 md:flex-wrap">
            {[
              { id: 'all' as const, label: lang === 'ar' ? 'الكل' : 'All', count: PARTY_GAMES_CATALOG.length },
              ...HOME_SHELVES.map((s) => ({
                id: s.id,
                label: lang === 'ar' ? s.filter_ar : s.filter_en,
                count: PARTY_GAMES_CATALOG.filter((g) => g.category === s.id).length,
              })),
            ].map((f) => {
              const active = shelfFilter === f.id && !query;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => {
                    setShelfFilter(f.id);
                    setSearch('');
                  }}
                  aria-pressed={active}
                  className={`shrink-0 whitespace-nowrap rounded-full px-3 py-1 text-sm font-extrabold border-3 cursor-pointer transition-colors ${
                    active
                      ? 'bg-[#ffca3a] text-[#161426] border-[#161426]'
                      : 'bg-transparent text-[#d9d4f7] border-[#3d3672] hover:text-[#fff9ec] hover:border-[#5a5196]'
                  }`}
                >
                  {f.label} <span className="opacity-70">{f.count}</span>
                </button>
              );
            })}
          </div>

          <div className="relative md:w-40 shrink-0">
            <MagnifyingGlass
              weight="bold"
              className="w-4 h-4 text-[#3f3b5c] absolute top-1/2 -translate-y-1/2 start-3.5 pointer-events-none"
            />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={lang === 'ar' ? 'دوّر على لعبة' : 'Find a game'}
              aria-label={lang === 'ar' ? 'دوّر على لعبة' : 'Find a game'}
              className="cartoon-input w-full ps-9 pe-3 py-1.5 bg-[#fff9ec] text-[#161426] text-sm focus:outline-none focus:ring-4 focus:ring-[#ffca3a]"
            />
          </div>
        </div>

        {query ? (
          searchResults.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-3 gap-y-4 sm:gap-x-4 sm:gap-y-5">
              {searchResults.map((g, i) => renderCard(g, i))}
            </div>
          ) : (
            <div className="text-center py-10">
              <p className="text-xl font-extrabold text-[#fff9ec]">
                {lang === 'ar' ? `ما لقينا شي باسم «${search.trim()}»` : `Nothing called “${search.trim()}”`}
              </p>
              <button
                type="button"
                onClick={() => setSearch('')}
                className="cartoon-btn bg-[#ffca3a] text-[#161426] px-4 py-2 text-sm mt-4"
              >
                {lang === 'ar' ? 'رجّع كل الألعاب' : 'Show all games'}
              </button>
            </div>
          )
        ) : (
          visibleShelves.map((shelf) => {
            const ShelfIcon = SHELF_ICONS[shelf.id];
            const games = PARTY_GAMES_CATALOG.filter((g) => g.category === shelf.id);
            // Wide cards keep every row full: 3 columns on desktop, 2 on phones
            const wideCount = (3 - (games.length % 3)) % 3;
            return (
              <section key={shelf.id} className="space-y-3.5">
                <div className="flex items-center gap-3">
                  <span className="w-11 h-11 rounded-2xl bg-[#25204d] border-3 border-[#120f29] flex items-center justify-center shrink-0">
                    <ShelfIcon weight="fill" className="w-6 h-6 text-[#ffca3a]" />
                  </span>
                  <div className="min-w-0 leading-tight">
                    <h3 className="text-2xl font-extrabold text-[#fff9ec]">
                      {lang === 'ar' ? shelf.title_ar : shelf.title_en}
                    </h3>
                    <p className="text-sm font-semibold text-[#b9b3e6]">
                      {lang === 'ar' ? shelf.blurb_ar : shelf.blurb_en}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-3 gap-y-4 sm:gap-x-4 sm:gap-y-5">
                  {games.map((g, i) => {
                    const wideOnDesktop = i % 2 === 0 && i / 2 < wideCount;
                    const wideOnPhone = i === 0 && games.length % 2 === 1;
                    const layoutClass = [
                      wideOnPhone ? 'col-span-2' : '',
                      wideOnDesktop ? 'sm:col-span-2' : 'sm:col-span-1',
                    ].join(' ');
                    return renderCard(g, i, layoutClass, wideOnDesktop);
                  })}
                </div>
              </section>
            );
          })
        )}
      </div>

      {/* Phone dock: the picked game and the way to start it are always on screen */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-30 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pointer-events-none">
        <div className="cartoon-card pointer-events-auto flex items-center gap-2.5 p-2.5 !rounded-3xl !shadow-[0_6px_0_#120f29]">
          <span
            style={{ backgroundColor: meta.poster }}
            className="w-12 h-12 rounded-2xl border-3 border-[#161426] flex items-center justify-center shrink-0"
          >
            <PartyGameSvgIcon gameId={game.id} className="w-9 h-9" />
          </span>
          <div className="min-w-0 flex-1 leading-tight">
            <span className="text-base font-extrabold truncate block">{name(game)}</span>
            <span className="text-xs font-bold text-[#3f3b5c] inline-flex items-center gap-1" dir="ltr">
              <Users weight="fill" className="w-3 h-3" />
              {playerRange(game)}
            </span>
          </div>
          <button
            type="button"
            onClick={() => onOpenGuide(game.id)}
            aria-label={lang === 'ar' ? 'كيف بتنلعب؟' : 'How to play?'}
            className="w-11 h-11 rounded-full bg-white border-3 border-[#161426] flex items-center justify-center shrink-0 cursor-pointer"
          >
            <Question weight="bold" className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => setSheet('start')}
            className="cartoon-btn !shadow-[0_4px_0_#161426] bg-[#8ac926] text-[#161426] px-4 py-2 text-base shrink-0"
          >
            {lang === 'ar' ? 'يلا نلعب' : 'Let’s play'}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {sheet && (
          <div className="lg:hidden fixed inset-0 z-50 flex items-end" role="dialog" aria-modal="true">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSheet(null)}
              className="absolute inset-0 bg-[#120f29]/75"
            />
            <motion.div
              initial={reduceMotion ? { opacity: 0 } : { y: '100%' }}
              animate={reduceMotion ? { opacity: 1 } : { y: 0 }}
              exit={reduceMotion ? { opacity: 0 } : { y: '100%' }}
              transition={{ type: 'spring', stiffness: 380, damping: 34 }}
              className="relative w-full max-h-[92dvh] overflow-y-auto p-3 pb-[max(1rem,env(safe-area-inset-bottom))]"
            >
              <div className="relative max-w-md mx-auto">
                <button
                  type="button"
                  onClick={() => setSheet(null)}
                  aria-label={lang === 'ar' ? 'سكّر' : 'Close'}
                  className="absolute top-3 end-3 z-10 w-9 h-9 rounded-full bg-white text-[#161426] border-3 border-[#161426] flex items-center justify-center cursor-pointer"
                >
                  <X weight="bold" className="w-4 h-4" />
                </button>
                <LaunchPanel {...launchPanelProps} focusJoinCode={sheet === 'join'} />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
