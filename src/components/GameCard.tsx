import React from 'react';
import { Check, Clock, Question, Sparkle, Users } from '@phosphor-icons/react';
import { Lang } from '../data/translations';
import { PartyGameCatalogItem } from '../data/extraGamesData';
import { getHomeGameMeta } from '../data/homeGameMeta';
import { PartyGameSvgIcon } from './CartoonIcons';

const CARD_TILTS = ['-0.7deg', '0.5deg', '-0.3deg', '0.8deg', '-0.5deg'];

export const playerRange = (g: PartyGameCatalogItem) => g.players_en.match(/[\d–-]+/)?.[0] || '';

export const minutesLabel = (minutes: number, lang: Lang) =>
  lang === 'ar' ? `${minutes} د` : `${minutes} min`;

export interface GameCardProps {
  game: PartyGameCatalogItem;
  lang: Lang;
  index: number;
  isPicked: boolean;
  layoutClass?: string;
  isWide?: boolean;
  onSelect: () => void;
  onOpenGuide?: () => void;
  /** Touch-friendly: keep the guide button visible instead of revealing it on hover */
  guideAlwaysVisible?: boolean;
}

export const GameCard: React.FC<GameCardProps> = ({
  game,
  lang,
  index,
  isPicked,
  layoutClass = '',
  isWide = false,
  onSelect,
  onOpenGuide,
  guideAlwaysVisible = false,
}) => {
  const meta = getHomeGameMeta(game.id);

  return (
    <article
      style={{ '--tilt': isPicked ? '0deg' : CARD_TILTS[index % CARD_TILTS.length] } as React.CSSProperties}
      className={`home-card group relative ${layoutClass}`}
    >
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={isPicked}
        className={`w-full h-full rounded-3xl border-4 border-[#161426] overflow-hidden flex flex-col text-start cursor-pointer transition-[transform,box-shadow] ${
          isWide ? 'sm:flex-row' : ''
        } ${
          isPicked
            ? 'bg-[#fff9ec] shadow-[0_8px_0_#ffca3a] -translate-y-1'
            : 'bg-[#fff9ec] shadow-[0_6px_0_#120f29] hover:-translate-y-1 hover:shadow-[0_9px_0_#120f29]'
        }`}
      >
        {/* Poster art */}
        <div
          style={{ backgroundColor: meta.poster }}
          className={`relative h-28 sm:h-36 flex items-center justify-center overflow-hidden shrink-0 border-[#161426] ${
            isWide ? 'border-b-4 sm:border-b-0 sm:border-e-4 sm:h-auto sm:w-[46%]' : 'border-b-4'
          }`}
        >
          <div className="home-halftone absolute inset-0 pointer-events-none" />
          <div className="relative transition-transform duration-200 group-hover:scale-110 group-hover:-rotate-3 drop-shadow-[0_4px_0_rgba(22,20,38,0.28)]">
            <PartyGameSvgIcon
              gameId={game.id}
              className={isWide ? 'w-20 h-20 sm:w-32 sm:h-32' : 'w-20 h-20 sm:w-24 sm:h-24'}
            />
          </div>
        </div>

        <div className="p-3 sm:p-3.5 flex flex-col gap-1 flex-1 min-w-0 text-[#161426]">
          <h4 className={`font-extrabold leading-tight text-base ${isWide ? 'sm:text-2xl' : 'sm:text-lg'}`}>
            {lang === 'ar' ? game.name_ar : game.name_en}
          </h4>
          <p
            className={`hidden sm:block font-semibold text-[#3f3b5c] leading-snug ${
              isWide ? 'text-base' : 'text-[13px]'
            }`}
          >
            {lang === 'ar' ? meta.hook_ar : meta.hook_en}
          </p>
          <div className="flex items-center gap-3 mt-auto pt-1.5 text-xs font-extrabold text-[#3f3b5c]">
            <span className="inline-flex items-center gap-1" dir="ltr">
              <Users weight="fill" className="w-3.5 h-3.5" />
              {playerRange(game)}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock weight="fill" className="w-3.5 h-3.5" />
              {minutesLabel(meta.minutes, lang)}
            </span>
          </div>
        </div>
      </button>

      {/* Picked / fresh marker */}
      {isPicked ? (
        <span className="absolute top-2.5 start-2.5 w-8 h-8 rounded-full bg-[#ffca3a] text-[#161426] border-3 border-[#161426] shadow-[0_2px_0_#161426] flex items-center justify-center pointer-events-none">
          <Check weight="bold" className="w-4 h-4" />
        </span>
      ) : (
        meta.isFresh && (
          <span className="cartoon-badge absolute top-2.5 start-2.5 bg-[#fff9ec] text-[#161426] px-2.5 py-0.5 text-[11px] flex items-center gap-1 shadow-[0_2px_0_#161426] pointer-events-none">
            <Sparkle weight="fill" className="w-3 h-3 text-[#ff595e]" />
            <span>{lang === 'ar' ? 'جديد' : 'NEW'}</span>
          </span>
        )
      )}

      {onOpenGuide && (
        <button
          type="button"
          onClick={onOpenGuide}
          aria-label={`${lang === 'ar' ? 'شرح لعبة' : 'How to play'} ${lang === 'ar' ? game.name_ar : game.name_en}`}
          title={lang === 'ar' ? 'كيف بتنلعب؟' : 'How to play?'}
          className={`absolute top-2.5 end-2.5 w-8 h-8 rounded-full bg-white text-[#161426] border-3 border-[#161426] shadow-[0_2px_0_#161426] items-center justify-center cursor-pointer ${
            guideAlwaysVisible
              ? 'flex'
              : 'hidden lg:flex opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity'
          }`}
        >
          <Question weight="bold" className="w-4 h-4" />
        </button>
      )}
    </article>
  );
};
