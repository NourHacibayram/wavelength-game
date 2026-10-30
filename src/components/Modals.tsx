import React, { useState } from 'react';
import { X, Sparkle, Target, UsersThree, Trophy, PlusCircle } from '@phosphor-icons/react';
import { TRANSLATIONS, Lang } from '../data/translations';

interface HowToPlayModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Lang;
}

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({ isOpen, onClose, lang }) => {
  if (!isOpen) return null;

  const steps =
    lang === 'ar'
      ? [
          {
            icon: <Sparkle weight="fill" className="w-7 h-7 text-[#ff924c]" />,
            title: '1. دور العرّاف (Psychic)',
            desc: 'لاعب واحد بيكون العرّاف، وهو الوحيد اللي بيشوف وين الهدف الملوّن (2 - 3 - 4 - 3 - 2) مخفي عالعجلة.',
          },
          {
            icon: <Target weight="fill" className="w-7 h-7 text-[#1982c4]" />,
            title: '2. إعطاء التلميح',
            desc: 'العرّاف بيشوف البطاقة (مثلاً: بارد ↔ ساخن) وبيكتب تلميح بكلمة أو فكرة تدل ع مكان الهدف بدون ما يذكر أرقام!',
          },
          {
            icon: <UsersThree weight="fill" className="w-7 h-7 text-[#8ac926]" />,
            title: '3. تحريك المؤشر الأحمر',
            desc: 'باقي اللاعبين بيتناقشوا وبيسحبوا المؤشر الأحمر للمكان اللي بيتوقعوا إنه التلميح بيقصده.',
          },
          {
            icon: <Trophy weight="fill" className="w-7 h-7 text-[#ffca3a]" />,
            title: '4. كشف الغطاء والنقاط!',
            desc: 'بينفتح الغطاء! إذا إجا المؤشر بالمنطقة الزرقاء بالنص بتاخدوا 4 نقاط، البرتقالية 3 نقاط، والصفراء نقطتين!',
          },
        ]
      : [
          {
            icon: <Sparkle weight="fill" className="w-7 h-7 text-[#ff924c]" />,
            title: '1. The Psychic Peeks',
            desc: 'One player is the Psychic and is the ONLY one who sees where the colored target (2-3-4-3-2) is hidden.',
          },
          {
            icon: <Target weight="fill" className="w-7 h-7 text-[#1982c4]" />,
            title: '2. Give a Conceptual Clue',
            desc: 'Look at the spectrum card (e.g. Cold ↔ Hot) and give a single clue that sits at that exact spot on the scale!',
          },
          {
            icon: <UsersThree weight="fill" className="w-7 h-7 text-[#8ac926]" />,
            title: '3. Turn the Red Dial',
            desc: 'Everyone else debates and drags the red pointer to where they think the Psychic’s clue points.',
          },
          {
            icon: <Trophy weight="fill" className="w-7 h-7 text-[#ffca3a]" />,
            title: '4. Reveal & Score!',
            desc: 'Open the screen! Hitting the center blue wedge scores 4 points, orange scores 3, and yellow scores 2!',
          },
        ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div className="cartoon-card w-full max-w-lg p-6 relative animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="cartoon-btn bg-[#ff595e] text-white w-10 h-10 flex items-center justify-center absolute top-4 end-4"
        >
          <X weight="bold" className="w-5 h-5" />
        </button>

        <h2 className="text-2xl md:text-3xl font-extrabold text-[#161426] mb-4 pe-12">
          {lang === 'ar' ? 'كيف بنلعب عَ نفس الموجة؟' : 'How to Play Wavelength'}
        </h2>

        <div className="space-y-3">
          {steps.map((s, i) => (
            <div
              key={i}
              className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-white border-3 border-[#161426] shadow-[0_4px_0_#161426]"
            >
              <div className="p-2 rounded-xl bg-[#161426] shrink-0">{s.icon}</div>
              <div>
                <h3 className="font-extrabold text-lg text-[#161426]">{s.title}</h3>
                <p className="text-sm font-semibold text-[#3f3b5c] leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={onClose}
          className="cartoon-btn bg-[#8ac926] text-[#161426] w-full py-3 mt-5 text-lg"
        >
          {lang === 'ar' ? 'فهمت اللعب، يلا نبلش!' : 'Got It, Let’s Play!'}
        </button>
      </div>
    </div>
  );
};

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
