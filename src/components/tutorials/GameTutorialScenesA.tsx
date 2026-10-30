import React from 'react';
import { motion } from 'motion/react';
import {
  TutorialSceneProps,
  StageBackdrop,
  SvgPlayerAvatar,
  SvgPill,
  SvgScoreBadge,
} from './TutorialSvgPrimitives';

/* ============================================================================
 * 1. WAVELENGTH (عَ نفس الموجة) — 4-Step Animated SVG Scene
 * ========================================================================== */
export const WavelengthTutorialScene: React.FC<TutorialSceneProps> = ({ step, lang }) => {
  const showTarget = step === 0 || step === 3;
  const needleAngle = step === 0 ? -40 : step === 1 ? 0 : step === 2 ? 24 : 26;

  return (
    <StageBackdrop bg="#1d1842" accent="#ff595e">
      <defs>
        <clipPath id="tutWheelClip">
          <path d="M 135 178 A 125 125 0 0 1 385 178 Z" />
        </clipPath>
      </defs>

      {/* Psychic Avatar on Left */}
      <SvgPlayerAvatar
        x={68}
        y={86}
        color="#ffca3a"
        label={lang === 'ar' ? 'العرّاف' : 'Psychic'}
        scale={0.92}
        highlight={step === 0 || step === 1}
        crown={true}
      />

      {/* Guesser Avatar on Right */}
      <SvgPlayerAvatar
        x={452}
        y={86}
        color="#00bbf9"
        label={lang === 'ar' ? 'الشلّة' : 'Team'}
        scale={0.92}
        highlight={step === 2}
      />

      {/* Step 0: Psychic peeks badge */}
      {step === 0 && (
        <motion.g
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <SvgPill
            x={260}
            y={28}
            w={220}
            bg="#ffca3a"
            text={lang === 'ar' ? 'العرّاف وحده يرى مكان الهدف!' : 'Only Psychic sees target!'}
          />
        </motion.g>
      )}

      {/* Step 1: Psychic gives clue bubble */}
      {step >= 1 && (
        <g transform="translate(260, 28)">
          <motion.g
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            <SvgPill
              x={0}
              y={0}
              w={195}
              bg="#ffca3a"
              text={lang === 'ar' ? 'التلميح: «قهوة الصبح!»' : 'Clue: "Morning Coffee!"'}
            />
          </motion.g>
        </g>
      )}

      {/* Semicircle Wavelength Wheel */}
      <g>
        {/* Outer Bezel */}
        <path
          d="M 122 178 A 138 138 0 0 1 398 178 L 398 192 L 122 192 Z"
          fill="#0b2842"
          stroke="#161426"
          strokeWidth="4.5"
          strokeLinejoin="round"
        />

        {/* Cream Dial Face */}
        <g clipPath="url(#tutWheelClip)">
          <path d="M 135 178 A 125 125 0 0 1 385 178 Z" fill="#fff9ec" />

          {/* Target Wedges centered around +26 deg */}
          <motion.g
            animate={{ opacity: showTarget ? 1 : 0 }}
            transition={{ duration: 0.35 }}
          >
            {/* 2-pt left */}
            <path d="M 260 178 L 281 55 A 125 125 0 0 1 299 59 Z" fill="#ffaa1d" stroke="#161426" strokeWidth="2" />
            {/* 3-pt left */}
            <path d="M 260 178 L 299 59 A 125 125 0 0 1 316 66 Z" fill="#ff5722" stroke="#161426" strokeWidth="2" />
            {/* 4-pt center bullseye */}
            <path d="M 260 178 L 316 66 A 125 125 0 0 1 333 76 Z" fill="#3898b8" stroke="#161426" strokeWidth="2.5" />
            {/* 3-pt right */}
            <path d="M 260 178 L 333 76 A 125 125 0 0 1 348 89 Z" fill="#ff5722" stroke="#161426" strokeWidth="2" />
            {/* 2-pt right */}
            <path d="M 260 178 L 348 89 A 125 125 0 0 1 360 104 Z" fill="#ffaa1d" stroke="#161426" strokeWidth="2" />
            <text x="317" y="88" fill="#161426" fontSize="13" fontWeight="900" textAnchor="middle">
              4
            </text>
          </motion.g>

          {/* Sliding Blue Shutter Cover when hidden */}
          <motion.g
            animate={{ opacity: showTarget ? 0 : 1 }}
            transition={{ duration: 0.35 }}
          >
            <path d="M 135 178 A 125 125 0 0 1 385 178 Z" fill="#123a63" />
            <circle cx="260" cy="112" r="20" fill="#1b4d80" stroke="#161426" strokeWidth="3" />
            <text x="260" y="113" textAnchor="middle" dominantBaseline="central" fill="#ffca3a" fontSize="22" fontWeight="900">
              ?
            </text>
          </motion.g>

          <path d="M 135 178 A 125 125 0 0 1 385 178" fill="none" stroke="#161426" strokeWidth="4.5" />
        </g>

        {/* Rotating Red Needle */}
        <g transform="translate(260, 178)">
          <motion.g
            animate={{
              rotate: step === 2 ? [-28, 38, 18, 25] : needleAngle,
            }}
            transition={
              step === 2
                ? { duration: 2.6, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }
                : { type: 'spring', stiffness: 180, damping: 16 }
            }
          >
            <path
              d="M -7 0 L -2.5 -108 L 2.5 -108 L 7 0 Z"
              fill="#ff3b5c"
              stroke="#161426"
              strokeWidth="3.2"
              strokeLinejoin="round"
            />
          </motion.g>
          <circle cx="0" cy="0" r="22" fill="#ff3b5c" stroke="#161426" strokeWidth="4" />
          <circle cx="-5" cy="-6" r="5" fill="rgba(255,255,255,0.45)" />
        </g>
      </g>

      {/* Bottom Spectrum Card (Cold <-> Hot) */}
      <g transform="translate(260, 214)">
        <rect x="-125" y="-17" width="125" height="34" rx="10" fill="#38bdf8" stroke="#161426" strokeWidth="3.2" />
        <rect x="0" y="-17" width="125" height="34" rx="10" fill="#fb7185" stroke="#161426" strokeWidth="3.2" />
        <text x="-62" y="1" textAnchor="middle" dominantBaseline="central" fill="#161426" fontSize="13" fontWeight="900">
          {lang === 'ar' ? 'بارد' : 'Cold'}
        </text>
        <text x="62" y="1" textAnchor="middle" dominantBaseline="central" fill="#161426" fontSize="13" fontWeight="900">
          {lang === 'ar' ? 'ساخن' : 'Hot'}
        </text>
        <circle cx="0" cy="0" r="12" fill="#fff9ec" stroke="#161426" strokeWidth="3" />
        <text x="0" y="0.5" textAnchor="middle" dominantBaseline="central" fill="#161426" fontSize="11" fontWeight="900">
          ↔
        </text>
      </g>

      {/* Step 3: +4 Bullseye Score Celebration */}
      {step === 3 && (
        <SvgScoreBadge
          x={425}
          y={162}
          bg="#8ac926"
          text={lang === 'ar' ? 'بالمنتصف! +4 نقاط' : 'Bullseye! +4 PTS'}
        />
      )}
    </StageBackdrop>
  );
};

/* ============================================================================
 * 2. CHAMELEON (برّا السالفة) — 4-Step Animated SVG Scene
 * ========================================================================== */
export const ChameleonTutorialScene: React.FC<TutorialSceneProps> = ({ step, lang }) => {
  const players = [
    { x: 88, nameAr: 'أحمد', nameEn: 'rami', color: '#00bbf9', imp: false },
    { x: 202, nameAr: 'سارة', nameEn: 'Sara', color: '#8ac926', imp: false },
    { x: 318, nameAr: 'نور', nameEn: 'Noor', color: '#ff595e', imp: true },
    { x: 432, nameAr: 'عمر', nameEn: 'Omar', color: '#ffca3a', imp: false },
  ];

  const gridWordsAr = ['بيتزا', 'شاورما', 'سوشي', 'برغر', 'فلافل', 'منسف'];
  const gridWordsEn = ['Pizza', 'Shawarma', 'Sushi', 'Burger', 'Falafel', 'Mansaf'];
  const gridWords = lang === 'ar' ? gridWordsAr : gridWordsEn;

  return (
    <StageBackdrop bg="#233163" accent="#5c73b8">
      {/* Category Header */}
      <SvgPill
        x={260}
        y={24}
        w={185}
        h={26}
        bg="#ffca3a"
        fontSize={11.5}
        text={lang === 'ar' ? 'الموضوع: أكلات ومأكولات' : 'Topic: Foods & Dishes'}
      />

      {step < 3 ? (
        <>
          {/* 4 Players Row */}
          {players.map((p, idx) => (
            <g key={idx}>
              <SvgPlayerAvatar
                x={p.x}
                y={135}
                color={p.color}
                label={lang === 'ar' ? p.nameAr : p.nameEn}
                scale={0.92}
                highlight={step === 1 && (idx === 0 || idx === 2)}
                suspect={step === 2 && p.imp}
              />

              {/* Step 0: Secret Role Badges Above Every Player */}
              {step === 0 && (
                <g transform={`translate(${p.x}, 76)`}>
                  <motion.g
                    initial={{ scale: 0, y: 10 }}
                    animate={{ scale: 1, y: 0 }}
                    transition={{ delay: idx * 0.1, type: 'spring' }}
                  >
                    <rect
                      x="-44"
                      y="-14"
                      width="88"
                      height="28"
                      rx="10"
                      fill={p.imp ? '#ff595e' : '#8ac926'}
                      stroke="#161426"
                      strokeWidth="3"
                    />
                    <text
                      x="0"
                      y="1"
                      textAnchor="middle"
                      dominantBaseline="central"
                      fill={p.imp ? '#ffffff' : '#161426'}
                      fontSize="11.5"
                      fontWeight="900"
                    >
                      {p.imp
                        ? lang === 'ar'
                          ? 'برّا السالفة!'
                          : 'Out of Loop!'
                        : lang === 'ar'
                        ? 'شاورما'
                        : 'Shawarma'}
                    </text>
                  </motion.g>
                </g>
              )}
            </g>
          ))}

          {/* Step 1: Q&A Arc Between Player 1 & Player 3 */}
          {step === 1 && (
            <g>
              <motion.path
                d="M 105 98 Q 203 42 300 98"
                fill="none"
                stroke="#ffca3a"
                strokeWidth="3.5"
                strokeDasharray="6 5"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.6 }}
              />
              <motion.g
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
              >
                <SvgPill
                  x={148}
                  y={68}
                  w={140}
                  h={28}
                  bg="#fff9ec"
                  fontSize={11}
                  text={lang === 'ar' ? 'س: معها ثوم ومخلل؟' : 'Q: Served with garlic?'}
                />
              </motion.g>
              <motion.g
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.45 }}
              >
                <SvgPill
                  x={338}
                  y={68}
                  w={135}
                  h={28}
                  bg="#ff595e"
                  fg="#ffffff"
                  fontSize={11}
                  text={lang === 'ar' ? 'ج: إيه.. أحياناً!' : 'A: Uh.. sometimes!'}
                />
              </motion.g>
            </g>
          )}

          {/* Step 2: Everyone Votes Against Suspect #3 */}
          {step === 2 && (
            <g>
              {[88, 202, 432].map((fromX, i) => (
                <motion.line
                  key={i}
                  x1={fromX}
                  y1={105}
                  x2={318}
                  y2={84}
                  stroke="#ffca3a"
                  strokeWidth="3.5"
                  strokeDasharray="5 4"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ delay: i * 0.15, duration: 0.4 }}
                />
              ))}
              <SvgScoreBadge
                x={318}
                y={66}
                bg="#ff595e"
                text={lang === 'ar' ? 'انكشف! 3 أصوات' : 'Caught! 3 Votes'}
              />
            </g>
          )}

          {/* Bottom Hint */}
          <SvgPill
            x={260}
            y={212}
            w={310}
            h={26}
            bg="#161426"
            fg="#ffca3a"
            fontSize={11}
            text={
              step === 0
                ? lang === 'ar'
                  ? 'لاعب واحد فقط لا يعرف الكلمة السرية'
                  : 'One impostor doesn’t see the secret word'
                : step === 1
                ? lang === 'ar'
                  ? 'اسألوا بذكاء بدون ما تفضحوا الكلمة للجاسوس!'
                  : 'Ask subtle questions without giving away the word!'
                : lang === 'ar'
                ? 'صوّتوا معاً لكشف الشخص اللي برّا السالفة!'
                : 'Vote together on who is faking it!'
            }
          />
        </>
      ) : (
        /* Step 3: Caught Chameleon Gets Final Shot on the Topic Grid! */
        <g>
          <SvgPlayerAvatar
            x={85}
            y={128}
            color="#ff595e"
            label={lang === 'ar' ? 'نور' : 'Noor'}
            suspect={true}
          />
          <g transform="translate(160, 56)">
            {gridWords.map((w, idx) => {
              const col = idx % 3;
              const row = Math.floor(idx / 3);
              const gx = col * 106;
              const gy = row * 52;
              const isSecret = idx === 1;
              return (
                <g key={idx} transform={`translate(${gx}, ${gy})`}>
                  <motion.rect
                    x="0"
                    y="0"
                    width="96"
                    height="40"
                    rx="12"
                    fill={isSecret ? '#8ac926' : '#fff9ec'}
                    stroke="#161426"
                    strokeWidth="3.2"
                    animate={isSecret ? { scale: [1, 1.07, 1] } : {}}
                    transition={{ duration: 1, repeat: Infinity }}
                  />
                  <text
                    x="48"
                    y="21"
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill="#161426"
                    fontSize="13"
                    fontWeight="900"
                  >
                    {w}
                  </text>
                </g>
              );
            })}
          </g>
          <SvgScoreBadge
            x={290}
            y={198}
            bg="#ffca3a"
            text={lang === 'ar' ? 'فرصة أخيرة لحزر الكلمة (+3)!' : 'Last chance to guess word (+3)!'}
          />
        </g>
      )}
    </StageBackdrop>
  );
};

/* ============================================================================
 * 3. DIXIT DREAMS (خيال الشلّة) — 4-Step Animated SVG Scene
 * ========================================================================== */
const MiniSurrealCard: React.FC<{
  x: number;
  y: number;
  variant: 0 | 1 | 2;
  faceDown?: boolean;
  winner?: boolean;
  votes?: number;
}> = ({ x, y, variant, faceDown = false, winner = false, votes = 0 }) => {
  return (
    <motion.g
      animate={{ x, y, scale: winner ? 1.08 : 1 }}
      transition={{ type: 'spring', stiffness: 210, damping: 20 }}
    >
      <rect x="-36" y="-50" width="72" height="100" rx="12" fill="#120f29" transform="translate(0, 4)" />
      {faceDown ? (
        <g>
          <rect x="-36" y="-50" width="72" height="100" rx="12" fill="#6d28d9" stroke="#161426" strokeWidth="3.5" />
          <circle cx="0" cy="0" r="18" fill="none" stroke="#ffca3a" strokeWidth="2.5" strokeDasharray="4 4" />
          <polygon points="0,-10 3,-3 10,0 3,3 0,10 -3,3 -10,0 -3,-3" fill="#ffca3a" />
        </g>
      ) : (
        <g>
          <rect
            x="-36"
            y="-50"
            width="72"
            height="100"
            rx="12"
            fill={variant === 0 ? '#1e1b4b' : variant === 1 ? '#0f4c5c' : '#4a154b'}
            stroke={winner ? '#ffca3a' : '#161426'}
            strokeWidth={winner ? '4.5' : '3.5'}
          />
          {variant === 0 && (
            /* Moon + Ladder */
            <g>
              <circle cx="8" cy="-22" r="14" fill="#ffca3a" />
              <circle cx="14" cy="-25" r="11" fill="#1e1b4b" />
              <line x1="-14" y1="38" x2="2" y2="-16" stroke="#fff9ec" strokeWidth="2.5" />
              <line x1="-4" y1="38" x2="12" y2="-16" stroke="#fff9ec" strokeWidth="2.5" />
              <line x1="-11" y1="22" x2="-1" y2="22" stroke="#fff9ec" strokeWidth="2" />
              <line x1="-7" y1="8" x2="3" y2="8" stroke="#fff9ec" strokeWidth="2" />
              <line x1="-3" y1="-6" x2="7" y2="-6" stroke="#fff9ec" strokeWidth="2" />
            </g>
          )}
          {variant === 1 && (
            /* Floating Balloon Island */
            <g>
              <circle cx="0" cy="-16" r="17" fill="#ff595e" stroke="#161426" strokeWidth="2.5" />
              <line x1="-6" y1="0" x2="-3" y2="16" stroke="#fff9ec" strokeWidth="2" />
              <line x1="6" y1="0" x2="3" y2="16" stroke="#fff9ec" strokeWidth="2" />
              <ellipse cx="0" cy="22" rx="16" ry="7" fill="#8ac926" stroke="#161426" strokeWidth="2" />
            </g>
          )}
          {variant === 2 && (
            /* Glowing Hourglass Star */
            <g>
              <polygon points="-16,-24 16,-24 0,0 -16,24 16,24" fill="#00bbf9" stroke="#fff9ec" strokeWidth="2.2" />
              <circle cx="0" cy="-28" r="4" fill="#ffca3a" />
            </g>
          )}
        </g>
      )}

      {votes > 0 && (
        <g transform="translate(26, -44)">
          <circle cx="0" cy="0" r="12" fill="#8ac926" stroke="#161426" strokeWidth="2.5" />
          <text x="0" y="1" textAnchor="middle" dominantBaseline="central" fill="#161426" fontSize="11" fontWeight="900">
            +{votes}
          </text>
        </g>
      )}
    </motion.g>
  );
};

export const DixitTutorialScene: React.FC<TutorialSceneProps> = ({ step, lang }) => {
  return (
    <StageBackdrop bg="#26174a" accent="#9b5de5">
      {/* Clue Banner at Top */}
      <SvgPill
        x={260}
        y={28}
        w={245}
        bg="#ffca3a"
        text={
          lang === 'ar'
            ? 'تلميح الراوي: «رحلة إلى السماء»'
            : 'Storyteller Clue: "Journey to the Sky"'
        }
      />

      {/* Storyteller Avatar on Left */}
      <SvgPlayerAvatar
        x={68}
        y={132}
        color="#ffca3a"
        label={lang === 'ar' ? 'الراوي' : 'Story'}
        scale={0.88}
        crown={true}
        highlight={step === 0}
      />

      {/* Three Surreal Cards Choreographed Across Steps 0..3 */}
      {/* Storyteller's True Card (Variant 0: Moon Ladder) */}
      <MiniSurrealCard
        x={step === 0 ? 185 : step === 1 ? 260 : 280}
        y={126}
        variant={0}
        faceDown={step === 1}
        winner={step === 3}
        votes={step >= 2 ? 2 : 0}
      />

      {/* Decoy Card 1 (Variant 1: Balloon Island) */}
      {step >= 1 && (
        <MiniSurrealCard
          x={step === 1 ? 235 : 182}
          y={126}
          variant={1}
          faceDown={step === 1}
          votes={step >= 2 ? 1 : 0}
        />
      )}

      {/* Decoy Card 2 (Variant 2: Hourglass) */}
      {step >= 1 && (
        <MiniSurrealCard
          x={step === 1 ? 285 : 378}
          y={126}
          variant={2}
          faceDown={step === 1}
        />
      )}

      {/* Other Players on Right */}
      <SvgPlayerAvatar
        x={462}
        y={132}
        color="#00bbf9"
        label={lang === 'ar' ? 'الأصحاب' : 'Friends'}
        scale={0.88}
        highlight={step === 1 || step === 2}
      />

      {/* Step Footer / Score */}
      {step === 3 ? (
        <SvgScoreBadge
          x={280}
          y={208}
          bg="#8ac926"
          text={lang === 'ar' ? 'عرفها البعض! +3 للراوي ومن أصاب' : 'Some guessed right! +3 PTS'}
        />
      ) : (
        <SvgPill
          x={260}
          y={210}
          w={310}
          h={26}
          bg="#161426"
          fg="#fff9ec"
          fontSize={11}
          text={
            step === 0
              ? lang === 'ar'
                ? '1) الراوي يختار لوحة ويعطي تلميحاً خيالياً لا سهل ولا مستحيل'
                : '1) Storyteller plays 1 art card with a poetic clue'
              : step === 1
              ? lang === 'ar'
                ? '2) البقية يرمون لوحات مشابهة من يدهم لتمويه التصويت!'
                : '2) Friends throw matching decoy cards face-down!'
              : lang === 'ar'
              ? '3) تُكشف اللوحات ويصوّت الجميع على لوحة الراوي الحقيقية'
              : '3) Flip & shuffle! Vote for the real Storyteller card'
          }
        />
      )}
    </StageBackdrop>
  );
};

/* ============================================================================
 * 4. TABOO RUSH (الكلمات الممنوعة) — 4-Step Animated SVG Scene
 * ========================================================================== */
export const TabooTutorialScene: React.FC<TutorialSceneProps> = ({ step, lang }) => {
  const forbidden =
    lang === 'ar'
      ? ['كافيين', 'فنجان', 'سهر', 'صباح']
      : ['Caffeine', 'Cup', 'Awake', 'Morning'];

  return (
    <StageBackdrop bg="#2a1638" accent="#ff595e">
      {/* Ticking Timer Badge Top Left */}
      <g transform="translate(76, 42)">
        <circle cx="0" cy="0" r="24" fill="#fff9ec" stroke="#161426" strokeWidth="3.5" />
        <motion.line
          x1="0"
          y1="0"
          x2="0"
          y2="-15"
          stroke="#ff595e"
          strokeWidth="3.5"
          strokeLinecap="round"
          animate={{ rotate: 360 }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
        />
        <text x="0" y="36" textAnchor="middle" fill="#ffca3a" fontSize="11.5" fontWeight="900">
          60s
        </text>
      </g>

      {/* Center Taboo Card */}
      <g transform="translate(235, 118)">
        <motion.g
          animate={
            step === 2
              ? { x: [-5, 5, -4, 4, 0] }
              : step === 3
              ? { scale: [1, 1.05, 1] }
              : {}
          }
          transition={{ duration: 0.4 }}
        >
          <rect x="-74" y="-88" width="148" height="176" rx="16" fill="#120f29" transform="translate(0, 5)" />
          <rect x="-74" y="-88" width="148" height="176" rx="16" fill="#fff9ec" stroke="#161426" strokeWidth="4" />
          {/* Target Green Header */}
          <rect x="-64" y="-78" width="128" height="36" rx="10" fill="#8ac926" stroke="#161426" strokeWidth="3" />
          <text x="0" y="-59" textAnchor="middle" dominantBaseline="central" fill="#161426" fontSize="16" fontWeight="900">
            {lang === 'ar' ? 'قهوة' : 'COFFEE'}
          </text>

          {/* 4 Forbidden Words */}
          {forbidden.map((word, idx) => {
            const wy = -24 + idx * 26;
            const slipped = step === 2 && idx === 1;
            return (
              <g key={idx} transform={`translate(0, ${wy})`}>
                <rect
                  x="-60"
                  y="-10"
                  width="120"
                  height="21"
                  rx="7"
                  fill={slipped ? '#ff595e' : '#ffe4e6'}
                  stroke="#161426"
                  strokeWidth="2"
                />
                <text
                  x="0"
                  y="1"
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill={slipped ? '#ffffff' : '#b91c1c'}
                  fontSize="11.5"
                  fontWeight="800"
                >
                  ✗ {word}
                </text>
              </g>
            );
          })}
        </motion.g>
      </g>

      {/* Step 1: Clean Clue Speech Bubble */}
      {step === 1 && (
        <motion.g initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          <SvgPill
            x={415}
            y={68}
            w={165}
            h={34}
            bg="#8ac926"
            fontSize={11}
            text={lang === 'ar' ? '«مشروب بني ساخن!» ✓' : '"Hot brown drink!" ✓'}
          />
        </motion.g>
      )}

      {/* Step 2: Watcher Slams the Red Buzzer! */}
      {step === 2 && (
        <g transform="translate(415, 118)">
          <motion.g
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 0.6, repeat: Infinity }}
          >
            <ellipse cx="0" cy="24" rx="44" ry="12" fill="#161426" />
            <rect x="-40" y="8" width="80" height="16" rx="6" fill="#475569" stroke="#161426" strokeWidth="3" />
            <ellipse cx="0" cy="4" rx="34" ry="18" fill="#ff595e" stroke="#161426" strokeWidth="3.5" />
            <text x="0" y="4" textAnchor="middle" dominantBaseline="central" fill="#ffffff" fontSize="12" fontWeight="900">
              BUZZ!
            </text>
          </motion.g>
          <SvgPill
            x={0}
            y={-46}
            w={150}
            h={28}
            bg="#ff595e"
            fg="#ffffff"
            fontSize={11}
            text={lang === 'ar' ? 'قال «فنجان»! إنذار!' : 'Said "Cup"! BUZZ!'}
          />
        </g>
      )}

      {/* Step 3: Fast Score Stack */}
      {step === 3 && (
        <g>
          <SvgPill x={415} y={85} w={145} h={28} bg="#8ac926" fontSize={11.5} text={lang === 'ar' ? '✓ قهوة (+1)' : '✓ Coffee (+1)'} />
          <SvgPill x={415} y={122} w={145} h={28} bg="#8ac926" fontSize={11.5} text={lang === 'ar' ? '✓ طيارة (+1)' : '✓ Airplane (+1)'} />
          <SvgScoreBadge x={415} y={168} bg="#ffca3a" text={lang === 'ar' ? 'أسرع شرح يفوز!' : 'Fastest team wins!'} />
        </g>
      )}

      {/* Step 0 Hint */}
      {step === 0 && (
        <SvgPill
          x={415}
          y={120}
          w={165}
          h={34}
          bg="#ffca3a"
          fontSize={11}
          text={lang === 'ar' ? 'ممنوع نطق الـ 5 كلمات!' : 'Don’t say forbidden words!'}
        />
      )}
    </StageBackdrop>
  );
};

/* ============================================================================
 * 5. SOLE WITNESS (الشاهد الوحيد) — 4-Step Animated SVG Scene
 * ========================================================================== */
const CuteWeirdMonster: React.FC<{ x: number; y: number; scale?: number; faded?: boolean }> = ({
  x,
  y,
  scale = 1,
  faded = false,
}) => (
  <g transform={`translate(${x}, ${y}) scale(${scale})`} opacity={faded ? 0.22 : 1}>
    {/* Horns */}
    <path d="M -22 -26 L -34 -48 L -10 -34 Z" fill="#ffca3a" stroke="#161426" strokeWidth="3" strokeLinejoin="round" />
    <path d="M 22 -26 L 34 -48 L 10 -34 Z" fill="#ffca3a" stroke="#161426" strokeWidth="3" strokeLinejoin="round" />
    {/* Blob Body */}
    <rect x="-36" y="-34" width="72" height="68" rx="32" fill="#9b5de5" stroke="#161426" strokeWidth="3.8" />
    {/* 3 Eyes! */}
    {[-15, 0, 15].map((ex, i) => (
      <g key={i} transform={`translate(${ex}, -10)`}>
        <circle cx="0" cy="0" r="7" fill="#ffffff" stroke="#161426" strokeWidth="2.2" />
        <circle cx="0" cy="0" r="3" fill="#161426" />
      </g>
    ))}
    {/* Zigzag Smile */}
    <path d="M -16 12 L -8 18 L 0 12 L 8 18 L 16 12" fill="none" stroke="#fff9ec" strokeWidth="3" strokeLinecap="round" />
  </g>
);

export const WitnessTutorialScene: React.FC<TutorialSceneProps> = ({ step, lang }) => {
  return (
    <StageBackdrop bg="#152b44" accent="#00bbf9">
      {/* Witness Avatar Left */}
      <SvgPlayerAvatar
        x={70}
        y={128}
        color="#ffca3a"
        label={lang === 'ar' ? 'الشاهد' : 'Witness'}
        scale={0.9}
        highlight={step === 0 || step === 1}
      />

      {/* Step 0: 10-Second Monster Peek then Vanish */}
      {step === 0 && (
        <g>
          <motion.g
            animate={{ opacity: [1, 1, 0.15, 1], scale: [1, 1.04, 0.9, 1] }}
            transition={{ duration: 3.2, repeat: Infinity }}
          >
            <CuteWeirdMonster x={260} y={120} scale={1.15} />
          </motion.g>
          <SvgPill
            x={260}
            y={30}
            w={235}
            bg="#00bbf9"
            text={lang === 'ar' ? 'يظهر الكائن للشاهد 10 ثوانٍ ثم يختفي!' : 'Witness peeks for 10s then it vanishes!'}
          />
        </g>
      )}

      {/* Step 1: Witness Describes From Memory */}
      {step === 1 && (
        <g>
          <CuteWeirdMonster x={260} y={125} scale={1.05} faded={true} />
          <text x="260" y="128" textAnchor="middle" fill="#ffca3a" fontSize="34" fontWeight="900">
            ?
          </text>
          <motion.g initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
            <SvgPill
              x={275}
              y={42}
              w={265}
              bg="#fff9ec"
              text={lang === 'ar' ? '«إلو 3 عيون وقرنين صفر وجسم مدوّر!»' : '"It has 3 eyes, 2 horns & round body!"'}
            />
          </motion.g>
        </g>
      )}

      {/* Step 2: Friends Sketch Live on Canvases */}
      {step === 2 && (
        <g>
          {[215, 355].map((cx, idx) => (
            <g key={idx} transform={`translate(${cx}, 122)`}>
              <rect x="-54" y="-58" width="108" height="116" rx="14" fill="#fff9ec" stroke="#161426" strokeWidth="3.5" />
              <motion.path
                d={
                  idx === 0
                    ? 'M -22 -18 L -28 -36 L -12 -24 C -5 -28 5 -28 12 -24 L 28 -36 L 22 -18 C 32 0 28 32 0 32 C -28 32 -32 0 -22 -18 Z'
                    : 'M -24 -22 L 24 -22 L 28 28 L -28 28 Z'
                }
                fill="none"
                stroke={idx === 0 ? '#9b5de5' : '#00bbf9'}
                strokeWidth="3.5"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.5, repeat: Infinity, repeatType: 'reverse' }}
              />
              <circle cx="-10" cy="-4" r="3" fill="#161426" />
              <circle cx="0" cy="-4" r="3" fill="#161426" />
              {idx === 0 && <circle cx="10" cy="-4" r="3" fill="#161426" />}
            </g>
          ))}
          <SvgPill
            x={285}
            y={30}
            w={240}
            bg="#ffca3a"
            text={lang === 'ar' ? 'الرسامون يتخيلون ويرسمون الوصف!' : 'Artists sketch from the description!'}
          />
        </g>
      )}

      {/* Step 3: Reveal Original + Vote Best Match */}
      {step === 3 && (
        <g>
          <CuteWeirdMonster x={210} y={118} scale={0.95} />
          <g transform="translate(355, 118)">
            <rect x="-48" y="-52" width="96" height="104" rx="14" fill="#fff9ec" stroke="#8ac926" strokeWidth="4" />
            <CuteWeirdMonster x={0} y={4} scale={0.72} />
          </g>
          <SvgScoreBadge
            x={355}
            y={198}
            bg="#8ac926"
            text={lang === 'ar' ? '★ أدق رسمة تفوز! +3' : '★ Closest sketch wins! +3'}
          />
        </g>
      )}
    </StageBackdrop>
  );
};

/* ============================================================================
 * 6. FAKE ARTIST (الفنان المزيّف) — 4-Step Animated SVG Scene
 * ========================================================================== */
export const FakeArtistTutorialScene: React.FC<TutorialSceneProps> = ({ step, lang }) => {
  return (
    <StageBackdrop bg="#2b1e38" accent="#ff924c">
      {/* Shared Central Canvas */}
      <g transform="translate(260, 118)">
        <rect x="-86" y="-68" width="172" height="136" rx="16" fill="#120f29" transform="translate(0, 5)" />
        <rect x="-86" y="-68" width="172" height="136" rx="16" fill="#fff9ec" stroke="#161426" strokeWidth="4" />

        {/* Stroke 1 (Blue Real Artist: Cat Head Circle) */}
        {step >= 1 && (
          <motion.circle
            cx="0"
            cy="8"
            r="32"
            fill="none"
            stroke="#00bbf9"
            strokeWidth="4.5"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.7 }}
          />
        )}

        {/* Stroke 2 (Green Real Artist: Cute Cat Ears) */}
        {step >= 1 && (
          <motion.path
            d="M -25 -12 L -30 -40 L -6 -22 M 6 -22 L 30 -40 L 25 -12"
            fill="none"
            stroke="#8ac926"
            strokeWidth="4.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ delay: 0.4, duration: 0.7 }}
          />
        )}

        {/* Stroke 3 (Orange Fake Artist: Weird Crooked Antenna/Wheel!) */}
        {step >= 2 && (
          <motion.path
            d="M -42 42 L 45 42 L 52 15"
            fill="none"
            stroke="#ff595e"
            strokeWidth="5"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.7 }}
          />
        )}
      </g>

      {/* Top Category / Secret Word Pill */}
      <SvgPill
        x={260}
        y={24}
        w={250}
        h={26}
        bg="#ffca3a"
        fontSize={11.5}
        text={
          step === 0
            ? lang === 'ar'
              ? 'الكلمة للرسامين: «قطة» | للمزيف: «؟؟؟»'
              : 'Real Artists: "Cat" | Fake Artist: "???"'
            : lang === 'ar'
            ? 'خط واحد فقط لكل لاعب بلونه الخاص!'
            : '1 single stroke per player in their color!'
        }
      />

      {/* Left Real Artists */}
      <SvgPlayerAvatar
        x={74}
        y={88}
        color="#00bbf9"
        label={lang === 'ar' ? 'رسام 1' : 'Artist 1'}
        scale={0.82}
        highlight={step === 1}
      />
      <SvgPlayerAvatar
        x={74}
        y={172}
        color="#8ac926"
        label={lang === 'ar' ? 'رسام 2' : 'Artist 2'}
        scale={0.82}
        highlight={step === 1}
      />

      {/* Right Fake Artist */}
      <SvgPlayerAvatar
        x={446}
        y={128}
        color="#ff595e"
        label={lang === 'ar' ? 'المزيّف!' : 'Fake!'}
        scale={0.92}
        suspect={step >= 2}
      />

      {step === 2 && (
        <SvgPill
          x={435}
          y={62}
          w={130}
          h={26}
          bg="#ff595e"
          fg="#ffffff"
          fontSize={11}
          text={lang === 'ar' ? 'خط غريب مريب! !؟' : 'Suspicious stroke!'}
        />
      )}

      {step === 3 && (
        <SvgScoreBadge
          x={260}
          y={208}
          bg="#8ac926"
          text={lang === 'ar' ? 'صوّتوا عالمزيّف قبل ما يحزر الرسمة!' : 'Catch the Fake Artist by their stroke!'}
        />
      )}
    </StageBackdrop>
  );
};

/* ============================================================================
 * 7. COCKROACH POKER (بوكر الخداع) — 4-Step Animated SVG Scene
 * ========================================================================== */
export const CockroachTutorialScene: React.FC<TutorialSceneProps> = ({ step, lang }) => {
  return (
    <StageBackdrop bg="#1d2f24" accent="#8ac926">
      {/* Player A (Bluffer) */}
      <SvgPlayerAvatar
        x={82}
        y={126}
        color="#ffca3a"
        label={lang === 'ar' ? 'رامي' : 'Rami'}
        scale={0.92}
        highlight={step === 0}
        suspect={step === 3}
      />

      {/* Player B (Target) */}
      <SvgPlayerAvatar
        x={438}
        y={126}
        color="#00bbf9"
        label={lang === 'ar' ? 'سارة' : 'Sara'}
        scale={0.92}
        highlight={step === 1 || step === 2}
      />

      {/* Sliding Critter Card */}
      <motion.g
        animate={{
          x: step === 0 ? 185 : step === 1 ? 305 : step === 2 ? 260 : 165,
          y: step === 3 ? 150 : 122,
          rotate: step === 1 ? 6 : 0,
        }}
        transition={{ type: 'spring', stiffness: 190, damping: 18 }}
      >
        <rect x="-34" y="-46" width="68" height="92" rx="12" fill="#120f29" transform="translate(0, 4)" />
        {step === 1 ? (
          /* Face-down card in transit */
          <g>
            <rect x="-34" y="-46" width="68" height="92" rx="12" fill="#2d265e" stroke="#161426" strokeWidth="3.5" />
            <circle cx="0" cy="0" r="18" fill="#ffca3a" stroke="#161426" strokeWidth="2.5" />
            <text x="0" y="1" textAnchor="middle" dominantBaseline="central" fill="#161426" fontSize="20" fontWeight="900">
              ?
            </text>
          </g>
        ) : (
          /* Face-up Frog Card (True Critter!) */
          <g>
            <rect x="-34" y="-46" width="68" height="92" rx="12" fill="#eefbe0" stroke="#161426" strokeWidth="3.5" />
            <ellipse cx="0" cy="4" rx="20" ry="15" fill="#8ac926" stroke="#161426" strokeWidth="2.8" />
            <circle cx="-10" cy="-10" r="6" fill="#8ac926" stroke="#161426" strokeWidth="2.4" />
            <circle cx="10" cy="-10" r="6" fill="#8ac926" stroke="#161426" strokeWidth="2.4" />
            <circle cx="-10" cy="-10" r="2.2" fill="#161426" />
            <circle cx="10" cy="-10" r="2.2" fill="#161426" />
            <text x="0" y="32" textAnchor="middle" fill="#161426" fontSize="10.5" fontWeight="900">
              {lang === 'ar' ? 'ضفدع' : 'FROG'}
            </text>
          </g>
        )}
      </motion.g>

      {/* Step 0: Bluffer's Claim Bubble */}
      {step === 0 && (
        <SvgPill
          x={255}
          y={36}
          w={255}
          bg="#ff595e"
          fg="#ffffff"
          text={lang === 'ar' ? 'يشوفه «ضفدع» ويدّعي: «هذا عقرب!»' : 'Sees a Frog, claims: "It’s a Scorpion!"'}
        />
      )}

      {/* Step 1: Target's 2 Choices */}
      {step === 1 && (
        <g>
          <SvgPill
            x={260}
            y={34}
            w={195}
            h={28}
            bg="#ffca3a"
            fontSize={11.5}
            text={lang === 'ar' ? 'خيار 1: صادق أم كذّاب؟' : 'Option 1: Truth or Lie?'}
          />
          <SvgPill
            x={260}
            y={68}
            w={215}
            h={28}
            bg="#00bbf9"
            fontSize={11.5}
            text={lang === 'ar' ? 'خيار 2: طلّ بالسر ومرّره لغيرك!' : 'Option 2: Peek & Pass to another!'}
          />
        </g>
      )}

      {/* Step 2: Target Calls LIE! */}
      {step === 2 && (
        <SvgScoreBadge
          x={260}
          y={42}
          bg="#8ac926"
          text={lang === 'ar' ? 'قالت «كذّاب!» — وطلع ضفدع فعلاً!' : 'Called "LIE!" — It WAS a Frog!'}
        />
      )}

      {/* Step 3: Penalty Card Lands on Loser */}
      {step === 3 && (
        <SvgScoreBadge
          x={280}
          y={46}
          bg="#ffca3a"
          text={lang === 'ar' ? 'الخاسر يأخذ الكرت (3 عقوبات = خسارة!)' : 'Loser takes penalty (3 cards = lose!)'}
        />
      )}
    </StageBackdrop>
  );
};
