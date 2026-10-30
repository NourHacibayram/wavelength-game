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
 * 8. WITS & WAGERS (مزايدة التخمين) — 4-Step Animated SVG Scene
 * ========================================================================== */
export const WitsTutorialScene: React.FC<TutorialSceneProps> = ({ step, lang }) => {
  const lanes = [
    { val: '140', mult: '3x', x: 138, winner: false },
    { val: '200', mult: '2x', x: 260, winner: true },
    { val: '320', mult: '3x', x: 382, winner: false },
  ];

  return (
    <StageBackdrop bg="#133328" accent="#ffca3a">
      {/* Trivia Question Banner */}
      <SvgPill
        x={260}
        y={26}
        w={305}
        bg="#fff9ec"
        text={
          lang === 'ar'
            ? 'سؤال: كم عظمة في جسم الإنسان البالغ؟'
            : 'Q: How many bones in an adult human body?'
        }
      />

      {step === 0 ? (
        /* Step 0: Players Secretly Type Numeric Guesses */
        <g>
          {[
            { x: 130, nameAr: 'أحمد', nameEn: 'Rami', c: '#00bbf9', g: '200' },
            { x: 260, nameAr: 'سارة', nameEn: 'Sara', c: '#ff595e', g: '140' },
            { x: 390, nameAr: 'عمر', nameEn: 'Omar', c: '#8ac926', g: '320' },
          ].map((p, i) => (
            <g key={i}>
              <SvgPlayerAvatar
                x={p.x}
                y={104}
                color={p.c}
                label={lang === 'ar' ? p.nameAr : p.nameEn}
                scale={0.85}
                highlight={true}
              />
              <motion.g
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: i * 0.12 }}
              >
                <SvgPill x={p.x} y={168} w={84} h={28} bg="#ffca3a" text={p.g} />
              </motion.g>
            </g>
          ))}
          <SvgPill
            x={260}
            y={212}
            w={280}
            h={24}
            bg="#161426"
            fg="#ffca3a"
            fontSize={11}
            text={lang === 'ar' ? 'الكل يكتب تخمينه الرقمي بالسر!' : 'Everyone submits a secret number guess!'}
          />
        </g>
      ) : (
        /* Steps 1, 2, 3: Casino Betting Mat Lanes */
        <g>
          {lanes.map((lane, idx) => {
            const isWin = step === 3 && lane.winner;
            return (
              <g key={idx} transform={`translate(${lane.x}, 118)`}>
                <motion.rect
                  x="-52"
                  y="-54"
                  width="104"
                  height="112"
                  rx="14"
                  fill={isWin ? '#8ac926' : '#1e5240'}
                  stroke={isWin ? '#ffca3a' : '#161426'}
                  strokeWidth={isWin ? '4.5' : '3.5'}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: idx * 0.08 }}
                />
                {/* Multiplier Pill */}
                <rect x="-26" y="-44" width="52" height="20" rx="10" fill="#161426" />
                <text x="0" y="-33" textAnchor="middle" dominantBaseline="central" fill="#ffca3a" fontSize="11" fontWeight="900">
                  {lane.mult}
                </text>
                {/* Sorted Guess Number */}
                <text
                  x="0"
                  y="-4"
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill={isWin ? '#161426' : '#fff9ec'}
                  fontSize="22"
                  fontWeight="900"
                >
                  {lane.val}
                </text>

                {/* Step 2 & 3: Betting Chips Flying Onto Lane 200 & 140 */}
                {step >= 2 && idx === 1 && (
                  <g>
                    <motion.g
                      initial={{ y: -50, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ type: 'spring' }}
                    >
                      <circle cx="-16" cy="32" r="14" fill="#ffca3a" stroke="#161426" strokeWidth="3" />
                      <text x="-16" y="33" textAnchor="middle" dominantBaseline="central" fill="#161426" fontSize="10" fontWeight="900">
                        ★2
                      </text>
                    </motion.g>
                    <motion.g
                      initial={{ y: -50, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.15, type: 'spring' }}
                    >
                      <circle cx="16" cy="32" r="14" fill="#00bbf9" stroke="#161426" strokeWidth="3" />
                      <text x="16" y="33" textAnchor="middle" dominantBaseline="central" fill="#161426" fontSize="10" fontWeight="900">
                        ★1
                      </text>
                    </motion.g>
                  </g>
                )}
              </g>
            );
          })}

          {step === 3 ? (
            <SvgScoreBadge
              x={260}
              y={206}
              bg="#ffca3a"
              text={lang === 'ar' ? 'الجواب: 206! رهان «200» يكسب الضعف!' : 'Answer: 206! "200" wins double!'}
            />
          ) : (
            <SvgPill
              x={260}
              y={208}
              w={310}
              h={25}
              bg="#161426"
              fg="#fff9ec"
              fontSize={11}
              text={
                step === 1
                  ? lang === 'ar'
                    ? 'تُرتّب كل التخمينات تصاعدياً مع نسب مضاعفة النقاط'
                    : 'All guesses are sorted ascending with payout odds'
                  : lang === 'ar'
                  ? 'راهن بفيشاتك على أقرب جواب بدون تجاوز الرقم الصحيح!'
                  : 'Bet your chips on the closest guess!'
              }
            />
          )}
        </g>
      )}
    </StageBackdrop>
  );
};

/* ============================================================================
 * 9. THE INSIDER (العميل الداخلي) — 4-Step Animated SVG Scene
 * ========================================================================== */
export const InsiderTutorialScene: React.FC<TutorialSceneProps> = ({ step, lang }) => {
  return (
    <StageBackdrop bg="#291536" accent="#f15bb5">
      {/* Judge at Top Center */}
      <SvgPlayerAvatar
        x={260}
        y={54}
        color="#ffca3a"
        label={lang === 'ar' ? 'الحَكم' : 'Judge'}
        scale={0.82}
        crown={true}
      />

      {/* Secret Word Next to Judge */}
      <SvgPill
        x={388}
        y={42}
        w={145}
        h={28}
        bg="#fff9ec"
        fontSize={11.5}
        text={lang === 'ar' ? 'السر: «الأهرامات»' : 'Secret: "Pyramids"'}
      />

      {/* Countdown Timer Badge Left */}
      <SvgPill
        x={96}
        y={42}
        w={110}
        h={28}
        bg={step >= 2 ? '#8ac926' : '#ff595e'}
        fg={step >= 2 ? '#161426' : '#ffffff'}
        fontSize={12}
        text={step >= 2 ? '00:44 ✓' : '01:38'}
      />

      {/* 3 Players at Bottom (Middle/Right one is the Secret Insider!) */}
      <SvgPlayerAvatar
        x={125}
        y={158}
        color="#00bbf9"
        label={lang === 'ar' ? 'لاعب 1' : 'Player 1'}
        scale={0.86}
        highlight={step === 2}
      />
      <SvgPlayerAvatar
        x={260}
        y={158}
        color="#f15bb5"
        label={step === 0 || step === 3 ? (lang === 'ar' ? 'العميل!' : 'Insider!') : lang === 'ar' ? 'لاعب 2' : 'Player 2'}
        scale={0.86}
        suspect={step === 0 || step === 3}
        highlight={step === 1}
      />
      <SvgPlayerAvatar
        x={395}
        y={158}
        color="#8ac926"
        label={lang === 'ar' ? 'لاعب 3' : 'Player 3'}
        scale={0.86}
      />

      {/* Step 0: Insider Secretly Knows the Word Too! */}
      {step === 0 && (
        <motion.path
          d="M 355 58 Q 315 100 282 132"
          fill="none"
          stroke="#f15bb5"
          strokeWidth="3.5"
          strokeDasharray="5 4"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
        />
      )}

      {/* Step 1: Insider Subtly Steers Q&A with Yes/No */}
      {step === 1 && (
        <g>
          <SvgPill
            x={260}
            y={106}
            w={225}
            h={28}
            bg="#ffe5f4"
            fontSize={11.5}
            text={lang === 'ar' ? 'يسأل بخبث: «بناء أثري بمصر؟» ← نعم ✓' : '"Ancient structure in Egypt?" -> YES ✓'}
          />
        </g>
      )}

      {/* Step 2: Group Solves the Word Before Timer Ends! */}
      {step === 2 && (
        <SvgScoreBadge
          x={145}
          y={104}
          bg="#8ac926"
          text={lang === 'ar' ? 'حزرناها: الأهرامات! ✓' : 'Solved: Pyramids! ✓'}
        />
      )}

      {/* Step 3: Trial Vote to Unmask Who Steered Them! */}
      {step === 3 && (
        <g>
          <motion.line
            x1={150}
            y1={148}
            x2={232}
            y2={148}
            stroke="#ffca3a"
            strokeWidth="4"
            strokeDasharray="5 4"
          />
          <motion.line
            x1={370}
            y1={148}
            x2={288}
            y2={148}
            stroke="#ffca3a"
            strokeWidth="4"
            strokeDasharray="5 4"
          />
          <SvgScoreBadge
            x={260}
            y={106}
            bg="#ffca3a"
            text={lang === 'ar' ? 'محاكمة: اكشفوا مين غشّشكم بالسر!' : 'Trial: Vote who steered you!'}
          />
        </g>
      )}
    </StageBackdrop>
  );
};

/* ============================================================================
 * 10. MEDIUM / MIND MELD (التقاء العقول) — 4-Step Animated SVG Scene
 * ========================================================================== */
export const MediumTutorialScene: React.FC<TutorialSceneProps> = ({ step, lang }) => {
  return (
    <StageBackdrop bg="#132c38" accent="#00f5d4">
      {/* Left & Right Mind Players */}
      <SvgPlayerAvatar
        x={72}
        y={122}
        color="#00bbf9"
        label={lang === 'ar' ? 'عقل 1' : 'Mind 1'}
        scale={0.9}
        highlight={true}
      />
      <SvgPlayerAvatar
        x={448}
        y={122}
        color="#ffca3a"
        label={lang === 'ar' ? 'عقل 2' : 'Mind 2'}
        scale={0.9}
        highlight={true}
      />

      {/* Step 0: Starting Unrelated Word Pair */}
      {step === 0 && (
        <g>
          <SvgPill x={185} y={118} w={105} h={38} bg="#ff924c" fontSize={15} text={lang === 'ar' ? 'شمس' : 'SUN'} />
          <SvgPill x={335} y={118} w={105} h={38} bg="#38bdf8" fontSize={15} text={lang === 'ar' ? 'ثلج' : 'SNOW'} />
          <SvgPill
            x={260}
            y={34}
            w={250}
            bg="#fff9ec"
            text={lang === 'ar' ? 'كلمتان مختلفتان أمام اللاعبين' : 'Two unrelated starting words'}
          />
        </g>
      )}

      {/* Step 1: Attempt 1 Simultaneous Reveal (Different Words) */}
      {step === 1 && (
        <g>
          <motion.g initial={{ x: -35, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
            <SvgPill x={198} y={118} w={104} h={36} bg="#fff9ec" fontSize={14} text={lang === 'ar' ? 'صيف' : 'Summer'} />
          </motion.g>
          <motion.g initial={{ x: 35, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
            <SvgPill x={322} y={118} w={104} h={36} bg="#fff9ec" fontSize={14} text={lang === 'ar' ? 'بارد' : 'Cold'} />
          </motion.g>
          <SvgPill
            x={260}
            y={34}
            w={275}
            bg="#ffca3a"
            text={lang === 'ar' ? 'محاولة 1: يكتبان الكلمة الرابطة بنفس اللحظة!' : 'Attempt 1: Both type the link simultaneously!'}
          />
        </g>
      )}

      {/* Step 2: New Words Become Narrower Bridge! */}
      {step === 2 && (
        <g>
          <SvgPill x={205} y={82} w={95} h={30} bg="#e0fff9" fontSize={12.5} text={lang === 'ar' ? 'صيف' : 'Summer'} />
          <SvgPill x={315} y={82} w={95} h={30} bg="#e0fff9" fontSize={12.5} text={lang === 'ar' ? 'بارد' : 'Cold'} />
          <motion.path
            d="M 205 102 L 260 142 L 315 102"
            fill="none"
            stroke="#00f5d4"
            strokeWidth="4"
            strokeDasharray="6 4"
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.2, repeat: Infinity }}
          />
          <SvgPill
            x={260}
            y={162}
            w={120}
            h={32}
            bg="#00f5d4"
            text="???"
          />
          <SvgPill
            x={260}
            y={30}
            w={295}
            bg="#fff9ec"
            fontSize={11.5}
            text={lang === 'ar' ? 'كلمتاهما الجديدتان تصبحان الجسر للمحاولة 2!' : 'Their 2 new words become the next bridge!'}
          />
        </g>
      )}

      {/* Step 3: Mind Meld Convergence! */}
      {step === 3 && (
        <g>
          <motion.circle
            cx="260"
            cy="118"
            r="46"
            fill="rgba(0, 245, 212, 0.22)"
            stroke="#00f5d4"
            strokeWidth="3.5"
            animate={{ scale: [0.9, 1.18, 0.9] }}
            transition={{ duration: 1.4, repeat: Infinity }}
          />
          <SvgScoreBadge
            x={260}
            y={118}
            bg="#00f5d4"
            text={lang === 'ar' ? '«آيس كريم!» تطابق! +4' : '"ICE CREAM!" Match! +4'}
          />
          <SvgPill
            x={260}
            y={34}
            w={255}
            bg="#8ac926"
            text={lang === 'ar' ? 'التقت العقول بنفس الكلمة تماماً!' : 'Minds converged on the exact word!'}
          />
        </g>
      )}
    </StageBackdrop>
  );
};

/* ============================================================================
 * 11. SO CLOVER (شفرة الأربع كلمات) — 4-Step Animated SVG Scene
 * ========================================================================== */
export const SoCloverTutorialScene: React.FC<TutorialSceneProps> = ({ step, lang }) => {
  const words =
    lang === 'ar'
      ? ['بحر', 'سمك', 'حليب', 'قطة']
      : ['Sea', 'Fish', 'Milk', 'Cat'];
  const clues =
    lang === 'ar'
      ? { top: 'صنارة', right: 'تونة', bottom: 'أليف', left: 'سائل' }
      : { top: 'Hook', right: 'Tuna', bottom: 'Pet', left: 'Liquid' };

  return (
    <StageBackdrop bg="#173321" accent="#8ac926">
      {/* Clover Board Center */}
      <g transform="translate(230, 122)">
        {/* 4 Clover Leaves Background */}
        <circle cx="-42" cy="-42" r="46" fill="#2b9348" stroke="#161426" strokeWidth="4" />
        <circle cx="42" cy="-42" r="46" fill="#2b9348" stroke="#161426" strokeWidth="4" />
        <circle cx="-42" cy="42" r="46" fill="#2b9348" stroke="#161426" strokeWidth="4" />
        <circle cx="42" cy="42" r="46" fill="#2b9348" stroke="#161426" strokeWidth="4" />
        <rect x="-56" y="-56" width="112" height="112" rx="18" fill="#55a630" stroke="#161426" strokeWidth="3.5" />

        {/* 4 Corner Word Slots */}
        {[
          { x: -29, y: -27, w: words[0] },
          { x: 29, y: -27, w: words[1] },
          { x: -29, y: 27, w: words[2] },
          { x: 29, y: 27, w: words[3] },
        ].map((slot, i) => (
          <g key={i} transform={`translate(${slot.x}, ${slot.y})`}>
            <rect
              x="-25"
              y="-18"
              width="50"
              height="36"
              rx="8"
              fill={step === 2 ? '#1e4620' : step === 3 ? '#d9f99d' : '#fff9ec'}
              stroke="#161426"
              strokeWidth="2.5"
            />
            <text
              x="0"
              y="1"
              textAnchor="middle"
              dominantBaseline="central"
              fill={step === 2 ? '#8ac926' : '#161426'}
              fontSize="11.5"
              fontWeight="900"
            >
              {step === 2 ? '?' : slot.w}
            </text>
          </g>
        ))}

        {/* 4 Outer Edge Clues (Appear from Step 1 onwards!) */}
        {step >= 1 && (
          <g>
            <SvgPill x={0} y={-76} w={76} h={22} bg="#ffca3a" fontSize={10.5} text={clues.top} />
            <SvgPill x={0} y={76} w={76} h={22} bg="#ffca3a" fontSize={10.5} text={clues.bottom} />
            <SvgPill x={-96} y={0} w={70} h={22} bg="#ffca3a" fontSize={10.5} text={clues.left} />
            <SvgPill x={96} y={0} w={70} h={22} bg="#ffca3a" fontSize={10.5} text={clues.right} />
          </g>
        )}
      </g>

      {/* Right Side Info / Shuffled Pool + Decoy */}
      {step === 0 && (
        <SvgPill
          x={425}
          y={122}
          w={155}
          h={34}
          bg="#fff9ec"
          fontSize={11}
          text={lang === 'ar' ? '4 كلمات سرية عالزوايا' : '4 secret corner words'}
        />
      )}

      {step === 1 && (
        <SvgPill
          x={425}
          y={122}
          w={160}
          h={34}
          bg="#ffca3a"
          fontSize={11}
          text={lang === 'ar' ? 'اكتب شفرة تربط كل زوج!' : '1 clue per adjacent pair!'}
        />
      )}

      {step === 2 && (
        <g>
          <SvgPill x={425} y={78} w={135} h={26} bg="#fff9ec" fontSize={11} text={lang === 'ar' ? 'سمك / حليب / قطة' : 'Fish / Milk / Cat'} />
          <SvgPill x={425} y={114} w={135} h={26} bg="#ff595e" fg="#ffffff" fontSize={11} text={lang === 'ar' ? '+ كلمة دخيلة: طيارة!' : '+ Decoy: Airplane!'} />
          <SvgPill x={425} y={154} w={145} h={26} bg="#161426" fg="#ffca3a" fontSize={10.5} text={lang === 'ar' ? 'تُخلط الكلمات ليحلّها الفريق' : 'Shuffled with a decoy!'} />
        </g>
      )}

      {step === 3 && (
        <SvgScoreBadge
          x={420}
          y={122}
          bg="#8ac926"
          text={lang === 'ar' ? 'تركيب صحيح 4/4! +5' : 'Solved all 4! +5 PTS'}
        />
      )}
    </StageBackdrop>
  );
};

/* ============================================================================
 * 12. DECRYPTO (كسر الشيفرة) — 4-Step Animated SVG Scene
 * ========================================================================== */
export const DecryptoTutorialScene: React.FC<TutorialSceneProps> = ({ step, lang }) => {
  const screens =
    lang === 'ar'
      ? ['شمس', 'بحر', 'كتاب', 'قطار']
      : ['Sun', 'Ocean', 'Book', 'Train'];

  return (
    <StageBackdrop bg="#161e3d" accent="#4361ee">
      {/* Top 4 Numbered Keyword Monitors (#1 .. #4) */}
      {screens.map((word, idx) => {
        const sx = 92 + idx * 112;
        const activeScreen =
          step >= 1 && (idx === 2 || idx === 0 || idx === 3);
        return (
          <g key={idx} transform={`translate(${sx}, 52)`}>
            <rect
              x="-46"
              y="-26"
              width="92"
              height="52"
              rx="10"
              fill={activeScreen && step === 3 ? '#8ac926' : '#fff9ec'}
              stroke="#161426"
              strokeWidth="3.2"
            />
            <rect x="-40" y="-21" width="24" height="16" rx="5" fill="#161426" />
            <text x="-28" y="-12.5" textAnchor="middle" dominantBaseline="central" fill="#ffca3a" fontSize="10" fontWeight="900">
              #{idx + 1}
            </text>
            <text x="0" y="9" textAnchor="middle" dominantBaseline="central" fill="#161426" fontSize="13" fontWeight="900">
              {word}
            </text>
          </g>
        );
      })}

      {/* Step 0: Explain 4 Screens */}
      {step === 0 && (
        <SvgPill
          x={260}
          y={152}
          w={295}
          bg="#ffca3a"
          text={lang === 'ar' ? '4 شاشات مرقّمة بكلمات ثابتة طوال الجولة' : '4 numbered screens hold secret keywords'}
        />
      )}

      {/* Step 1: Secret 3-Digit Code Card for Encryptor */}
      {step === 1 && (
        <g>
          <SvgPlayerAvatar
            x={135}
            y={156}
            color="#ffca3a"
            label={lang === 'ar' ? 'المشفِّر' : 'Encryptor'}
            scale={0.85}
            crown={true}
          />
          <motion.g initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
            <SvgPill
              x={305}
              y={152}
              w={195}
              h={42}
              bg="#ff595e"
              fg="#ffffff"
              fontSize={15}
              text={lang === 'ar' ? 'الكود السري: 3 - 1 - 4' : 'Secret Code: 3 - 1 - 4'}
            />
          </motion.g>
        </g>
      )}

      {/* Step 2: 3 Transmitted Clues in Order */}
      {step === 2 && (
        <g>
          <SvgPill
            x={135}
            y={136}
            w={115}
            h={32}
            bg="#00bbf9"
            text={lang === 'ar' ? '1) «قراءة»' : '1) "Pages"'}
          />
          <SvgPill
            x={260}
            y={136}
            w={115}
            h={32}
            bg="#00bbf9"
            text={lang === 'ar' ? '2) «شروق»' : '2) "Dawn"'}
          />
          <SvgPill
            x={385}
            y={136}
            w={115}
            h={32}
            bg="#00bbf9"
            text={lang === 'ar' ? '3) «سكة»' : '3) "Rails"'}
          />
          <SvgPill
            x={260}
            y={196}
            w={295}
            h={26}
            bg="#161426"
            fg="#ffca3a"
            fontSize={11}
            text={lang === 'ar' ? 'المشفِّر يرسل 3 تلميحات تطابق ترتيب الأرقام' : '3 clues transmitted matching the 3 code digits'}
          />
        </g>
      )}

      {/* Step 3: Team Cracks 3 - 1 - 4! */}
      {step === 3 && (
        <g>
          <SvgPill
            x={260}
            y={132}
            w={265}
            h={32}
            bg="#fff9ec"
            fontSize={12}
            text={lang === 'ar' ? 'قراءة (#3) ← شروق (#1) ← سكة (#4)' : 'Pages (#3) -> Dawn (#1) -> Rails (#4)'}
          />
          <SvgScoreBadge
            x={260}
            y={188}
            bg="#8ac926"
            text={lang === 'ar' ? 'تم فك الشيفرة: 3 - 1 - 4 ✓' : 'Code Cracked: 3 - 1 - 4 ✓'}
          />
        </g>
      )}
    </StageBackdrop>
  );
};

/* ============================================================================
 * 13. ITO 1-100 (تخاطر الأرقام) — 4-Step Animated SVG Scene
 * ========================================================================== */
export const ItoTutorialScene: React.FC<TutorialSceneProps> = ({ step, lang }) => {
  // In Step 0 & 1: unsorted [91, 15, 54]. In Step 2 & 3: sorted [15, 54, 91]!
  const cards = [
    {
      id: 'low',
      num: 15,
      clueAr: 'قطة صغيرة',
      clueEn: 'Tiny Kitten',
      color: '#00bbf9',
      yUnsorted: 126,
      ySorted: 78,
    },
    {
      id: 'mid',
      num: 54,
      clueAr: 'ذئب بري',
      clueEn: 'Wild Wolf',
      color: '#ffca3a',
      yUnsorted: 174,
      ySorted: 126,
    },
    {
      id: 'high',
      num: 91,
      clueAr: 'قرش مفترس',
      clueEn: 'Great Shark',
      color: '#ff595e',
      yUnsorted: 78,
      ySorted: 174,
    },
  ];

  const isSorted = step >= 2;
  const showNumbers = step === 0 || step === 3;

  return (
    <StageBackdrop bg="#172845" accent="#00bbf9">
      {/* Top Theme Scale */}
      <SvgPill
        x={260}
        y={26}
        w={295}
        bg="#ffca3a"
        fontSize={11.5}
        text={
          lang === 'ar'
            ? 'المقياس: كائنات مخيفة (1 لطيف ← 100 رعب!)'
            : 'Scale: Scary Creatures (1 Cute -> 100 Terror!)'
        }
      />

      {/* Left Scale Bar */}
      <g transform="translate(88, 126)">
        <rect x="-12" y="-62" width="24" height="124" rx="12" fill="#161426" />
        <rect x="-7" y="-56" width="14" height="112" rx="7" fill="#38bdf8" />
        <text x="0" y="-72" textAnchor="middle" fill="#8ac926" fontSize="11" fontWeight="900">
          1
        </text>
        <text x="0" y="78" textAnchor="middle" fill="#ff595e" fontSize="11" fontWeight="900">
          100
        </text>
      </g>

      {/* 3 Animated Sorting Player Rows */}
      {cards.map((c) => {
        const targetY = isSorted ? c.ySorted : c.yUnsorted;
        return (
          <motion.g
            key={c.id}
            animate={{ x: 270, y: targetY }}
            transition={{ type: 'spring', stiffness: 190, damping: 20 }}
          >
            <rect
              x="-135"
              y="-19"
              width="270"
              height="38"
              rx="12"
              fill={step === 3 ? '#d9f99d' : '#fff9ec'}
              stroke="#161426"
              strokeWidth="3.2"
            />
            {/* Secret Number Circle */}
            <circle cx="-106" cy="0" r="14" fill={c.color} stroke="#161426" strokeWidth="2.5" />
            <text
              x="-106"
              y="1"
              textAnchor="middle"
              dominantBaseline="central"
              fill="#161426"
              fontSize="12"
              fontWeight="900"
            >
              {showNumbers ? c.num : '?'}
            </text>

            {/* Clue Text */}
            <text
              x="8"
              y="1"
              textAnchor="middle"
              dominantBaseline="central"
              fill="#161426"
              fontSize="13.5"
              fontWeight="900"
            >
              { step === 0
                ? lang === 'ar'
                  ? 'يشوف رقمه بالسر...'
                  : 'Peeks at secret number...'
                : lang === 'ar'
                ? `«${c.clueAr}»`
                : `"${c.clueEn}"`}
            </text>

            {step === 3 && (
              <text x="114" y="1" textAnchor="middle" dominantBaseline="central" fill="#15803d" fontSize="15" fontWeight="900">
                ✓
              </text>
            )}
          </motion.g>
        );
      })}

      {step === 3 && (
        <SvgScoreBadge
          x={435}
          y={126}
          bg="#8ac926"
          text={lang === 'ar' ? '15 < 54 < 91 ✓' : '15 < 54 < 91 ✓'}
        />
      )}
    </StageBackdrop>
  );
};

/* ============================================================================
 * 14. WORD BOMB (قنبلة الحروف) — 4-Step Animated SVG Scene
 * ========================================================================== */
export const WordBombTutorialScene: React.FC<TutorialSceneProps> = ({ step, lang }) => {
  const bombX = step === 0 || step === 1 ? 140 : step === 2 ? 260 : 380;

  return (
    <StageBackdrop bg="#2b1424" accent="#ff595e">
      {/* 3 Players in Hot-Potato Row */}
      <SvgPlayerAvatar
        x={105}
        y={152}
        color="#00bbf9"
        label={lang === 'ar' ? 'لاعب 1' : 'Player 1'}
        scale={0.86}
        highlight={step === 0 || step === 1}
      />
      <SvgPlayerAvatar
        x={260}
        y={162}
        color="#8ac926"
        label={lang === 'ar' ? 'لاعب 2' : 'Player 2'}
        scale={0.86}
        highlight={step === 2}
      />
      <SvgPlayerAvatar
        x={415}
        y={152}
        color="#ffca3a"
        label={lang === 'ar' ? 'لاعب 3' : 'Player 3'}
        scale={0.86}
        suspect={step === 3}
      />

      {/* Dashed Pass Arc */}
      {step >= 2 && (
        <path
          d="M 140 95 Q 260 35 380 95"
          fill="none"
          stroke="#ffca3a"
          strokeWidth="3"
          strokeDasharray="6 5"
        />
      )}

      {/* Animated Ticking Cartoon Bomb */}
      <motion.g
        animate={{
          x: bombX,
          y: step === 2 ? 78 : 96,
          scale: step === 3 ? [1, 1.22, 0.95, 1.15] : [1, 1.06, 1],
        }}
        transition={
          step === 3
            ? { duration: 0.7, repeat: Infinity }
            : { type: 'spring', stiffness: 200, damping: 16 }
        }
      >
        {step === 3 ? (
          /* Comic BOOM Starburst! */
          <g>
            <polygon
              points="0,-42 12,-16 40,-24 22,0 42,22 14,18 4,42 -10,18 -38,26 -20,2 -40,-20 -12,-16"
              fill="#ff595e"
              stroke="#161426"
              strokeWidth="3.5"
            />
            <text x="0" y="2" textAnchor="middle" dominantBaseline="central" fill="#ffca3a" fontSize="14" fontWeight="900">
              BOOM!
            </text>
          </g>
        ) : (
          /* Round Bomb + Unpredictable Sparking Fuse */
          <g>
            <path d="M 8 -26 Q 18 -40 28 -34" fill="none" stroke="#d97706" strokeWidth="4" strokeLinecap="round" />
            <motion.circle
              cx="29"
              cy="-34"
              r="6"
              fill="#ffca3a"
              animate={{ scale: [0.8, 1.4, 0.8] }}
              transition={{ duration: 0.35, repeat: Infinity }}
            />
            <circle cx="0" cy="0" r="28" fill="#161426" stroke="#120f29" strokeWidth="3.5" />
            <rect x="-20" y="-11" width="40" height="22" rx="7" fill="#1e1b4b" stroke="#ffca3a" strokeWidth="2.2" />
            <text x="0" y="1" textAnchor="middle" dominantBaseline="central" fill="#ffca3a" fontSize="12" fontWeight="900">
              {lang === 'ar' ? 'ب ر' : 'B R'}
            </text>
          </g>
        )}
      </motion.g>

      {/* Step Captions / Word Bubbles */}
      {step === 0 && (
        <SvgPill
          x={295}
          y={40}
          w={265}
          bg="#ff595e"
          fg="#ffffff"
          fontSize={11.5}
          text={lang === 'ar' ? 'فتيل عشوائي مخفي بدون عدّاد مكشوف!' : 'Hidden random fuse — can blow anytime!'}
        />
      )}

      {step === 1 && (
        <SvgScoreBadge
          x={295}
          y={44}
          bg="#8ac926"
          text={lang === 'ar' ? 'يكتب بسرعة: «برتقال!» ✓' : 'Types fast: "BREAD!" ✓'}
        />
      )}

      {step === 2 && (
        <SvgPill
          x={260}
          y={28}
          w={275}
          bg="#ffca3a"
          fontSize={11.5}
          text={lang === 'ar' ? 'تنتقل القنبلة فوراً للي بعده (مع زر اعتراض!)' : 'Passes bomb to next friend instantly!'}
        />
      )}

      {step === 3 && (
        <SvgScoreBadge
          x={220}
          y={40}
          bg="#ffca3a"
          text={lang === 'ar' ? 'انفجرت! الناجون يكسبون النقاط!' : 'BOOM! Survivors score points!'}
        />
      )}
    </StageBackdrop>
  );
};
