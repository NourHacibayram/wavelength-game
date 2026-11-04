import React, { useEffect, useRef, useState } from 'react';
import { DotsThreeVertical, FilmStrip, Globe, LinkSimple, SignOut, SquaresFour } from '@phosphor-icons/react';
import { Lang } from '../data/translations';

interface RoomMenuProps {
  lang: Lang;
  canSwitchGame: boolean;
  gameCount: number;
  onGuide: () => void;
  onSwitchGame: () => void;
  onToggleLang: () => void;
  onLeave: () => void;
  /** Online rooms only: the code chip hides on phones, so the invite lives here too */
  onCopyInvite?: () => void;
}

const MENU_W = 224;

/** Everything a player rarely needs mid-game, folded behind one button */
export const RoomMenu: React.FC<RoomMenuProps> = ({
  lang,
  canSwitchGame,
  gameCount,
  onGuide,
  onSwitchGame,
  onToggleLang,
  onLeave,
  onCopyInvite,
}) => {
  const ar = lang === 'ar';
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const close = () => setPos(null);
  const toggle = () => {
    if (pos) return close();
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;
    // Fixed position so a scrolling game bar can't clip it; kept on screen at any width
    const left = Math.min(
      Math.max(8, ar ? rect.left : rect.right - MENU_W),
      window.innerWidth - MENU_W - 8
    );
    setPos({ top: rect.bottom + 8, left });
  };

  useEffect(() => {
    if (!pos) return;
    const onPointer = (e: PointerEvent) => {
      const target = e.target as Node;
      if (!menuRef.current?.contains(target) && !buttonRef.current?.contains(target)) close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        close();
        buttonRef.current?.focus();
      }
    };
    window.addEventListener('pointerdown', onPointer);
    window.addEventListener('keydown', onKey);
    window.addEventListener('resize', close);
    window.addEventListener('scroll', close, true);
    menuRef.current?.querySelector('button')?.focus();
    return () => {
      window.removeEventListener('pointerdown', onPointer);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', close);
      window.removeEventListener('scroll', close, true);
    };
  }, [pos]);

  const run = (action: () => void) => () => {
    close();
    action();
  };

  const itemClass =
    'w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-start text-sm font-extrabold text-[#161426] hover:bg-[#ffca3a]/40 focus-visible:bg-[#ffca3a]/40 outline-none cursor-pointer';

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={toggle}
        aria-haspopup="menu"
        aria-expanded={!!pos}
        aria-label={ar ? 'خيارات الغرفة' : 'Room options'}
        className="cartoon-btn bg-[#fff9ec] text-[#161426] w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center shrink-0"
      >
        <DotsThreeVertical weight="bold" className="w-5 h-5" />
      </button>

      {pos && (
        <div
          ref={menuRef}
          role="menu"
          style={{ top: pos.top, left: pos.left, width: MENU_W }}
          className="fixed z-[80] p-1.5 rounded-2xl bg-[#fff9ec] border-4 border-[#161426] shadow-[0_6px_0_#161426]"
        >
          {onCopyInvite && (
            <button type="button" role="menuitem" onClick={run(onCopyInvite)} className={itemClass}>
              <LinkSimple weight="bold" className="w-5 h-5 text-[#6a4c93]" />
              <span>{ar ? 'انسخ رابط الدعوة' : 'Copy invite link'}</span>
            </button>
          )}
          <button type="button" role="menuitem" onClick={run(onGuide)} className={itemClass}>
            <FilmStrip weight="fill" className="w-5 h-5 text-[#1982c4]" />
            <span>{ar ? 'كيف بتنلعب؟' : 'How to play'}</span>
          </button>
          {canSwitchGame && (
            <button type="button" role="menuitem" onClick={run(onSwitchGame)} className={itemClass}>
              <SquaresFour weight="fill" className="w-5 h-5 text-[#ff924c]" />
              <span>{ar ? `بدّل اللعبة (${gameCount})` : `Switch game (${gameCount})`}</span>
            </button>
          )}
          <button type="button" role="menuitem" onClick={run(onToggleLang)} className={itemClass}>
            <Globe weight="bold" className="w-5 h-5 text-[#00a3d9]" />
            <span>{ar ? 'English' : 'عربي'}</span>
          </button>
          <div className="h-0.5 bg-[#161426]/10 my-1 mx-2" />
          <button type="button" role="menuitem" onClick={run(onLeave)} className={itemClass}>
            <SignOut weight="bold" className="w-5 h-5 text-[#e11d48]" />
            <span className="text-[#e11d48]">{ar ? 'اطلع من الغرفة' : 'Leave room'}</span>
          </button>
        </div>
      )}
    </>
  );
};
