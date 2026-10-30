import React from 'react';
import {
  TutorialSceneProps,
  StageBackdrop,
  SvgPlayerAvatar,
  SvgPill,
  SvgScoreBadge,
  SvgCheckMark,
  SvgCrossMark,
  clamp01,
  lerp,
  easeOutCubic,
  easeOutBack,
} from './TutorialSvgPrimitives';

/* ============================================================================
 * 8. WITS & WAGERS (مزايدة التخمين) — Pure Native SVG 4-Step Scene
 * ========================================================================== */
export const WitsTutorialScene: React.FC<TutorialSceneProps> = ({
  step,
  animT,
  clock,
  lang,
}) => {
  const t = easeOutCubic(animT);
  // In Step 0, Rami (x=130) guessed 200 and Sara (x=260) guessed 140.
  // In Step 1, 140 & 200 physically cross-glide into ascending order (140 -> 136, 200 -> 260)!
  const lanes = [
    { val: '140', mult: '3x', unsortedX: 260, sortedX: 136, winner: false },
    { val: '200', mult: '2x', unsortedX: 130, sortedX: 260, winner: true },
    { val: '320', mult: '3x', unsortedX: 390, sortedX: 384, winner: false },
  ];

  return (
    <StageBackdrop bg="#133328" accent="#ffca3a">
      {/* Trivia Question Banner */}
      <SvgPill
        x={260}
        y={23}
        w={365}
        h={26}
        bg="#fff9ec"
        fontSize={11.2}
        text={
          lang === 'ar'
            ? 'سؤال: كم عظمة في جسم الإنسان البالغ؟'
            : 'Q: How many bones in an adult human body?'
        }
      />

      {step === 0 ? (
        /* Step 0: Secret Numeric Guesses (Continuous clock float!) */
        <g>
          {[
            { x: 130, nameAr: 'أحمد', nameEn: 'Rami', c: '#00bbf9', g: '200' },
            { x: 260, nameAr: 'سارة', nameEn: 'Sara', c: '#ff595e', g: '140' },
            { x: 390, nameAr: 'عمر', nameEn: 'Omar', c: '#8ac926', g: '320' },
          ].map((p, i) => (
            <g key={i}>
              <SvgPlayerAvatar
                x={p.x}
                y={100}
                color={p.c}
                label={lang === 'ar' ? p.nameAr : p.nameEn}
                scale={0.84}
                highlight={true}
                clock={clock}
              />
              <g transform={`translate(0, ${Math.sin(clock * 3.8 + i) * 2.5})`}>
                <SvgPill
                  x={p.x}
                  y={166}
                  w={88}
                  h={28}
                  bg="#ffca3a"
                  scale={easeOutBack(clamp01(animT * 1.2 - i * 0.1))}
                  text={p.g}
                />
              </g>
            </g>
          ))}
          <SvgPill
            x={260}
            y={213}
            w={355}
            h={24}
            bg="#161426"
            fg="#ffca3a"
            fontSize={11}
            text={
              lang === 'ar'
                ? 'الكل يكتب تخمينه الرقمي بالسر!'
                : 'Everyone submits a secret number guess!'
            }
          />
        </g>
      ) : (
        /* Steps 1, 2, 3: Casino Betting Mat Lanes */
        <g>
          {lanes.map((lane, idx) => {
            const isWin = step === 3 && lane.winner;
            const laneX =
              step === 1 ? lerp(lane.unsortedX, lane.sortedX, t) : lane.sortedX;
            const laneY =
              118 +
              (isWin
                ? Math.sin(clock * 5) * 2.5
                : Math.sin(clock * 3 + idx) * 1.2);
            const multScale =
              step === 1 ? 1 + Math.sin(clock * 5 + idx) * 0.06 : 1;

            return (
              <g key={idx} transform={`translate(${laneX}, ${laneY})`}>
                <rect
                  x="-50"
                  y="-48"
                  width="100"
                  height="104"
                  rx="14"
                  fill="#120f29"
                />
                <rect
                  x="-50"
                  y="-52"
                  width="100"
                  height="104"
                  rx="14"
                  fill={isWin ? '#8ac926' : '#1e5240'}
                  stroke={isWin ? '#ffca3a' : '#161426'}
                  strokeWidth={isWin ? '4.2' : '3.4'}
                />
                {/* Multiplier Pill */}
                <g transform={`translate(0, -34) scale(${multScale})`}>
                  <rect x="-26" y="-10" width="52" height="20" rx="10" fill="#161426" />
                  <text
                    x="0"
                    y="0.5"
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill="#ffca3a"
                    fontSize="11"
                    fontWeight="900"
                  >
                    {lane.mult}
                  </text>
                </g>
                {/* Sorted Guess Number */}
                <text
                  x="0"
                  y="-3"
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill={isWin ? '#161426' : '#fff9ec'}
                  fontSize="21"
                  fontWeight="900"
                >
                  {lane.val}
                </text>

                {/* Step 2 & 3: Gold & Silver Betting Chips Flying Onto Lane 200 */}
                {step >= 2 && idx === 1 && (
                  <g>
                    <g
                      transform={`translate(-17, ${
                        (step === 2 ? lerp(-34, 28, t) : 28) +
                        Math.sin(clock * 4.8) * 2
                      })`}
                    >
                      <circle
                        cx="0"
                        cy="0"
                        r="13.5"
                        fill="#ffca3a"
                        stroke="#161426"
                        strokeWidth="2.8"
                      />
                      <circle
                        cx="0"
                        cy="0"
                        r="9"
                        fill="none"
                        stroke="#161426"
                        strokeWidth="1.4"
                        strokeDasharray="3 2"
                      />
                      <text
                        x="0"
                        y="0.5"
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill="#161426"
                        fontSize="9.8"
                        fontWeight="900"
                      >
                        +2
                      </text>
                    </g>
                    <g
                      transform={`translate(17, ${
                        (step === 2 ? lerp(-46, 28, t) : 28) +
                        Math.sin(clock * 4.8 + 1.4) * 2
                      })`}
                    >
                      <circle
                        cx="0"
                        cy="0"
                        r="13.5"
                        fill="#e2e8f0"
                        stroke="#161426"
                        strokeWidth="2.8"
                      />
                      <circle
                        cx="0"
                        cy="0"
                        r="9"
                        fill="none"
                        stroke="#161426"
                        strokeWidth="1.4"
                        strokeDasharray="3 2"
                      />
                      <text
                        x="0"
                        y="0.5"
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill="#161426"
                        fontSize="9.8"
                        fontWeight="900"
                      >
                        +1
                      </text>
                    </g>
                  </g>
                )}

                {/* Rival Chip on Lane 320 */}
                {step >= 2 && idx === 2 && (
                  <g
                    transform={`translate(0, ${
                      (step === 2 ? lerp(-36, 28, t) : 28) +
                      Math.sin(clock * 4.2) * 1.5
                    })`}
                  >
                    <circle
                      cx="0"
                      cy="0"
                      r="13"
                      fill="#00bbf9"
                      stroke="#161426"
                      strokeWidth="2.8"
                    />
                    <text
                      x="0"
                      y="0.5"
                      textAnchor="middle"
                      dominantBaseline="central"
                      fill="#161426"
                      fontSize="9.5"
                      fontWeight="900"
                    >
                      +1
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {step === 3 ? (
            <SvgScoreBadge
              x={260}
              y={210}
              w={335}
              bg="#ffca3a"
              animT={animT}
              clock={clock}
              text={
                lang === 'ar'
                  ? 'الجواب: 206! رهان «200» يكسب الضعف!'
                  : 'Answer: 206! "200" wins double!'
              }
            />
          ) : (
            <SvgPill
              x={260}
              y={212}
              w={415}
              h={25}
              bg="#161426"
              fg="#fff9ec"
              fontSize={11}
              text={
                step === 1
                  ? lang === 'ar'
                    ? 'تُرتّب كل التخمينات تصاعدياً مع نسب مضاعفة النقاط'
                    : 'All guesses sort ascending with payout multipliers'
                  : lang === 'ar'
                  ? 'ضع فيشتيك الذهبية والفضية على أقرب تخمين للجواب!'
                  : 'Place your Gold & Silver chips on the closest guess!'
              }
            />
          )}
        </g>
      )}
    </StageBackdrop>
  );
};

/* ============================================================================
 * 9. THE INSIDER (العميل الداخلي) — Pure Native SVG 4-Step Scene
 * ========================================================================== */
export const InsiderTutorialScene: React.FC<TutorialSceneProps> = ({
  step,
  animT,
  clock,
  lang,
}) => {
  const secs =
    step >= 2
      ? '00:44'
      : `01:${Math.max(15, 52 - Math.floor((clock * 3) % 35))}`;

  // Traveling orb along secret link in Step 0
  const orbT = (clock * 0.65) % 1;
  const invOrb = 1 - orbT;
  const orbX = invOrb * invOrb * 424 + 2 * invOrb * orbT * 452 + orbT * orbT * 288;
  const orbY = invOrb * invOrb * 52 + 2 * invOrb * orbT * 114 + orbT * orbT * 160;

  return (
    <StageBackdrop bg="#291536" accent="#f15bb5">
      {/* Judge at Top Center (y=44, scale=0.76 -> y_bot=70) */}
      <SvgPlayerAvatar
        x={260}
        y={44}
        color="#ffca3a"
        label={lang === 'ar' ? 'الحَكم' : 'Judge'}
        scale={0.76}
        crown={true}
        highlight={step === 1}
        clock={clock}
      />

      {/* Secret Word Next to Judge */}
      <SvgPill
        x={408}
        y={38}
        w={165}
        h={26}
        bg="#fff9ec"
        fontSize={11.2}
        text={lang === 'ar' ? 'السر: «الأهرامات»' : 'Secret: "Pyramids"'}
      />

      {/* Countdown Timer Badge Left */}
      <SvgPill
        x={92}
        y={38}
        w={104}
        h={26}
        bg={step >= 2 ? '#8ac926' : '#ff595e'}
        fg={step >= 2 ? '#161426' : '#ffffff'}
        fontSize={12}
        text={secs}
      />

      {/* Step 0: Unobstructed Curved Secret Link on the Right + Traveling Orb! */}
      {step === 0 && (
        <g>
          <path
            d="M 424 52 Q 452 114 288 160"
            fill="none"
            stroke="#f15bb5"
            strokeWidth="3.2"
            strokeDasharray="6 5"
            strokeDashoffset={-(clock * 24) % 22}
          />
          <circle
            cx={orbX}
            cy={orbY}
            r="5.5"
            fill="#ffca3a"
            stroke="#161426"
            strokeWidth="2"
          />
        </g>
      )}

      {/* 3 Players at Bottom (y=172, scale=0.82 -> y_top=146; clean 76px center lane!) */}
      <SvgPlayerAvatar
        x={118}
        y={172}
        color="#00bbf9"
        label={lang === 'ar' ? 'لاعب 1' : 'Player 1'}
        scale={0.82}
        highlight={step === 2}
        clock={clock}
      />
      <SvgPlayerAvatar
        x={260}
        y={172}
        color="#f15bb5"
        label={
          step === 0 || step === 3
            ? lang === 'ar'
              ? 'العميل!'
              : 'Insider!'
            : lang === 'ar'
            ? 'لاعب 2'
            : 'Player 2'
        }
        scale={0.82}
        suspect={step === 0 || step === 3}
        highlight={step === 1}
        clock={clock}
      />
      <SvgPlayerAvatar
        x={402}
        y={172}
        color="#8ac926"
        label={lang === 'ar' ? 'لاعب 3' : 'Player 3'}
        scale={0.82}
        clock={clock}
      />

      {/* Step 0 Caption (Shifted left x=188 so it NEVER crosses the pink secret link!) */}
      {step === 0 && (
        <SvgPill
          x={188}
          y={108}
          w={295}
          h={26}
          bg="#f15bb5"
          fg="#ffffff"
          fontSize={11}
          scale={easeOutBack(animT)}
          text={
            lang === 'ar'
              ? 'العميل يعرف الكلمة بالسر مثل الحكم!'
              : 'The Insider secretly knows the word too!'
          }
        />
      )}

      {/* Step 1: Yes/No Q&A Race Against the Clock */}
      {step === 1 && (
        <g>
          <line
            x1={260}
            y1={144}
            x2={260}
            y2={74}
            stroke="#ffca3a"
            strokeWidth="2.8"
            strokeDasharray="5 4"
            strokeDashoffset={-(clock * 24) % 18}
          />
          <SvgPill
            x={152}
            y={108}
            w={188}
            h={26}
            bg="#ffe5f4"
            fontSize={11}
            scale={easeOutBack(animT)}
            text={lang === 'ar' ? 'س: «هل هو أثر بمصر؟»' : 'Q: "Monument in Egypt?"'}
          />
          <g transform={`translate(0, ${Math.sin(clock * 4.5) * 2})`}>
            <SvgPill
              x={376}
              y={108}
              w={148}
              h={26}
              bg="#8ac926"
              fontSize={11}
              scale={easeOutBack(clamp01((animT - 0.15) * 1.2))}
              text={lang === 'ar' ? 'الحكم: نعم!' : 'Judge: YES!'}
            />
          </g>
        </g>
      )}

      {/* Step 2: Explicitly Teaches rules[2] (00:00 Timeout = ALL Lose vs Solving in Time!) */}
      {step === 2 && (
        <g>
          <g transform={`translate(0, ${Math.sin(clock * 4.8) * 2})`}>
            <SvgPill
              x={144}
              y={108}
              w={215}
              h={27}
              bg="#ff595e"
              fg="#ffffff"
              fontSize={10.8}
              scale={easeOutBack(animT)}
              text={
                lang === 'ar'
                  ? 'انتهاء الوقت 00:00 = الكل يخسر!'
                  : '00:00 Timeout = ALL Lose!'
              }
            />
          </g>
          <SvgScoreBadge
            x={386}
            y={108}
            w={205}
            bg="#8ac926"
            animT={animT}
            clock={clock}
            text={
              lang === 'ar'
                ? 'حزرناها: الأهرامات!'
                : 'Solved: Pyramids!'
            }
          />
        </g>
      )}

      {/* Step 3: Trial Vote to Unmask Who Steered Them! */}
      {step === 3 && (
        <g>
          <line
            x1={150}
            y1={164}
            x2={228}
            y2={164}
            stroke="#ffca3a"
            strokeWidth="3.4"
            strokeDasharray="5 4"
            strokeDashoffset={-(clock * 24) % 18}
          />
          <line
            x1={370}
            y1={164}
            x2={292}
            y2={164}
            stroke="#ffca3a"
            strokeWidth="3.4"
            strokeDasharray="5 4"
            strokeDashoffset={(clock * 24) % 18}
          />
          <SvgScoreBadge
            x={260}
            y={108}
            w={315}
            bg="#ffca3a"
            animT={animT}
            clock={clock}
            text={
              lang === 'ar'
                ? 'محاكمة: صوّتوا مين غشّشكم بالسر!'
                : 'Trial: Vote who steered you to win!'
            }
          />
        </g>
      )}
    </StageBackdrop>
  );
};

/* ============================================================================
 * 10. MEDIUM / MIND MELD (التقاء العقول) — Pure Native SVG 4-Step Scene
 *     1-to-1 Aligned: Step 2 = Attempt 1 Match (+4), Step 3 = Convergence Bridge!
 * ========================================================================== */
export const MediumTutorialScene: React.FC<TutorialSceneProps> = ({
  step,
  animT,
  clock,
  lang,
}) => {
  const t = easeOutCubic(animT);
  const pulseR = 46 + Math.sin(clock * 5) * 6;
  const bob = Math.sin(clock * 3.8) * 3;

  return (
    <StageBackdrop bg="#132c38" accent="#00f5d4">
      {/* Left & Right Mind Players */}
      <SvgPlayerAvatar
        x={66}
        y={132}
        color="#00bbf9"
        label={lang === 'ar' ? 'عقل 1' : 'Mind 1'}
        scale={0.86}
        highlight={true}
        clock={clock}
      />
      <SvgPlayerAvatar
        x={454}
        y={132}
        color="#ffca3a"
        label={lang === 'ar' ? 'عقل 2' : 'Mind 2'}
        scale={0.86}
        highlight={true}
        clock={clock}
      />

      {/* Step 0: Starting Unrelated Word Pair (Counter-bobbing + Telepathy Wave!) */}
      {step === 0 && (
        <g>
          <SvgPill
            x={260}
            y={25}
            w={295}
            h={26}
            bg="#fff9ec"
            scale={easeOutBack(animT)}
            text={
              lang === 'ar'
                ? 'كلمتان مختلفتان أمام الثنائي'
                : 'Two unrelated starting words'
            }
          />
          <path
            d="M 190 130 Q 260 104 330 130"
            fill="none"
            stroke="#00f5d4"
            strokeWidth="3"
            strokeDasharray="6 5"
            strokeDashoffset={-(clock * 24) % 22}
          />
          <SvgPill
            x={190}
            y={130 + bob}
            w={106}
            h={36}
            bg="#ff924c"
            fontSize={14.5}
            scale={easeOutBack(animT)}
            text={lang === 'ar' ? 'شمس' : 'SUN'}
          />
          <SvgPill
            x={330}
            y={130 - bob}
            w={106}
            h={36}
            bg="#38bdf8"
            fontSize={14.5}
            scale={easeOutBack(clamp01((animT - 0.1) * 1.15))}
            text={lang === 'ar' ? 'ثلج' : 'SNOW'}
          />
        </g>
      )}

      {/* Step 1: Both Secretly Submit ONE Connecting Word Simultaneously */}
      {step === 1 && (
        <g>
          <SvgPill
            x={260}
            y={25}
            w={355}
            h={26}
            bg="#ffca3a"
            fontSize={11}
            scale={easeOutBack(animT)}
            text={
              lang === 'ar'
                ? 'يكتب الاثنان الكلمة الرابطة بالسر بنفس اللحظة!'
                : 'Both secretly submit 1 link word at once!'
            }
          />
          <line
            x1={98}
            y1={130}
            x2={422}
            y2={130}
            stroke="#00f5d4"
            strokeWidth="2.8"
            strokeDasharray="6 5"
            strokeDashoffset={-(clock * 26) % 22}
          />
          <SvgPill
            x={lerp(132, 202, t)}
            y={130 + bob}
            w={98}
            h={36}
            bg="#e0fff9"
            fontSize={15}
            text="?"
          />
          <SvgPill
            x={lerp(388, 318, t)}
            y={130 - bob}
            w={98}
            h={36}
            bg="#e0fff9"
            fontSize={15}
            text="?"
          />
        </g>
      )}

      {/* Step 2 (rules[2]): Attempt 1 Instant Match = Mind Meld Jackpot (+4 pts)! */}
      {step === 2 && (
        <g>
          <SvgPill
            x={260}
            y={25}
            w={355}
            h={26}
            bg="#8ac926"
            fontSize={11}
            scale={easeOutBack(animT)}
            text={
              lang === 'ar'
                ? 'تطابق من أول محاولة = انفجار تخاطر (+4)!'
                : 'Match on Attempt 1 = Mind Meld (+4 pts)!'
            }
          />
          <circle
            cx="260"
            cy="132"
            r={pulseR}
            fill="rgba(0, 245, 212, 0.2)"
            stroke="#00f5d4"
            strokeWidth="3.2"
          />
          <circle
            cx="260"
            cy="132"
            r={pulseR + 14}
            fill="none"
            stroke="rgba(0, 245, 212, 0.35)"
            strokeWidth="2"
            strokeDasharray="6 6"
          />
          <SvgScoreBadge
            x={260}
            y={132}
            w={245}
            bg="#00f5d4"
            animT={animT}
            clock={clock}
            text={
              lang === 'ar'
                ? '«ذوبان!» تطابق فوري! +4'
                : '"MELT!" Instant Match! +4'
            }
          />
        </g>
      )}

      {/* Step 3 (rules[3]): If Different, New Words Form Narrower Bridge -> Converge! */}
      {step === 3 && (
        <g>
          <SvgPill
            x={260}
            y={22}
            w={380}
            h={25}
            bg="#ffca3a"
            fontSize={10.8}
            scale={easeOutBack(animT)}
            text={
              lang === 'ar'
                ? 'إذا اختلفا: تصبح كلمتاهما الجسر الجديد حتى تتطابق!'
                : 'If different: new words form Bridge 2 until match!'
            }
          />
          <SvgPill
            x={196}
            y={80}
            w={96}
            h={28}
            bg="#fff9ec"
            fontSize={12}
            text={lang === 'ar' ? 'صيف' : 'Summer'}
          />
          <SvgPill
            x={324}
            y={80}
            w={96}
            h={28}
            bg="#fff9ec"
            fontSize={12}
            text={lang === 'ar' ? 'بارد' : 'Cold'}
          />
          <path
            d="M 196 96 L 260 146 L 324 96"
            fill="none"
            stroke="#00f5d4"
            strokeWidth="3.4"
            strokeDasharray="6 4"
            strokeDashoffset={-(clock * 24) % 20}
          />
          <SvgScoreBadge
            x={260}
            y={170}
            w={240}
            bg="#00f5d4"
            animT={animT}
            clock={clock}
            text={
              lang === 'ar'
                ? 'محاولة 2: «آيس كريم!»'
                : 'Try 2: "ICE CREAM!"'
            }
          />
        </g>
      )}
    </StageBackdrop>
  );
};

/* ============================================================================
 * 11. SO CLOVER (شفرة الأربع كلمات) — Pure Native SVG 4-Step Scene
 *     Shifted Board (x=148, scale=0.9 -> x=[31..265]) + Flying Tiles + Zero Collisions!
 * ========================================================================== */
export const SoCloverTutorialScene: React.FC<TutorialSceneProps> = ({
  step,
  animT,
  clock,
  lang,
}) => {
  const t = easeOutCubic(animT);
  const words =
    lang === 'ar'
      ? ['بحر', 'سمك', 'حليب', 'قطة']
      : ['Sea', 'Fish', 'Milk', 'Cat'];
  const clues =
    lang === 'ar'
      ? { top: 'صنارة', right: 'تونة', bottom: 'شوارب', left: 'سائل' }
      : { top: 'Hook', right: 'Tuna', bottom: 'Whiskers', left: 'Liquid' };

  // Global coordinates of the 4 Clover slots vs Right Shuffled Pool
  const slotTargets = [
    { bx: 148 - 25, by: 124 - 23, px: 348, py: 66 },
    { bx: 148 + 25, by: 124 - 23, px: 440, py: 66 },
    { bx: 148 - 25, by: 124 + 23, px: 348, py: 108 },
    { bx: 148 + 25, by: 124 + 23, px: 440, py: 108 },
  ];

  return (
    <StageBackdrop bg="#173321" accent="#8ac926">
      {/* Clover Board Shifted Left (x=[31..265], 29px clear of right column x>=294!) */}
      <g transform="translate(148, 124) scale(0.9)">
        <circle
          cx="-40"
          cy="-40"
          r="44"
          fill="#2b9348"
          stroke="#161426"
          strokeWidth="3.8"
        />
        <circle
          cx="40"
          cy="-40"
          r="44"
          fill="#2b9348"
          stroke="#161426"
          strokeWidth="3.8"
        />
        <circle
          cx="-40"
          cy="40"
          r="44"
          fill="#2b9348"
          stroke="#161426"
          strokeWidth="3.8"
        />
        <circle
          cx="40"
          cy="40"
          r="44"
          fill="#2b9348"
          stroke="#161426"
          strokeWidth="3.8"
        />
        <rect
          x="-54"
          y="-54"
          width="108"
          height="108"
          rx="18"
          fill="#55a630"
          stroke="#161426"
          strokeWidth="3.5"
        />

        {/* Empty ? Recesses Shown Underneath Flying Tiles */}
        {[-28, 28].map((sx) =>
          [-26, 26].map((sy) => (
            <g key={`${sx}_${sy}`} transform={`translate(${sx}, ${sy})`}>
              <rect
                x="-23"
                y="-16"
                width="46"
                height="32"
                rx="7"
                fill="#1e4620"
                stroke="#161426"
                strokeWidth="2.2"
              />
              <text
                x="0"
                y="0.5"
                textAnchor="middle"
                dominantBaseline="central"
                fill="#8ac926"
                fontSize="11"
                fontWeight="900"
              >
                ?
              </text>
            </g>
          ))
        )}

        {/* Step 1 Pulsing Pair-Link Brackets */}
        {step === 1 && (
          <rect
            x="-46"
            y="-46"
            width="92"
            height="92"
            rx="14"
            fill="none"
            stroke="#ffca3a"
            strokeWidth="2.6"
            strokeDasharray="6 5"
            strokeDashoffset={-(clock * 22) % 22}
          />
        )}

        {/* 4 Outer Edge Clues */}
        {step >= 1 && (
          <g>
            <SvgPill
              x={0}
              y={-76}
              w={74}
              h={22}
              bg="#ffca3a"
              fontSize={10.5}
              scale={step === 1 ? easeOutBack(animT) : 1}
              text={clues.top}
            />
            <SvgPill
              x={0}
              y={76}
              w={78}
              h={22}
              bg="#ffca3a"
              fontSize={10.2}
              scale={step === 1 ? easeOutBack(clamp01((animT - 0.08) * 1.15)) : 1}
              text={clues.bottom}
            />
            <SvgPill
              x={-96}
              y={0}
              w={68}
              h={22}
              bg="#ffca3a"
              fontSize={10.5}
              scale={step === 1 ? easeOutBack(clamp01((animT - 0.16) * 1.2)) : 1}
              text={clues.left}
            />
            <SvgPill
              x={96}
              y={0}
              w={68}
              h={22}
              bg="#ffca3a"
              fontSize={10.5}
              scale={step === 1 ? easeOutBack(clamp01((animT - 0.22) * 1.25)) : 1}
              text={clues.right}
            />
          </g>
        )}
      </g>

      {/* 4 Physically Flying Word Tiles (Clover <-> Right Shuffled Pool!) */}
      {slotTargets.map((st, idx) => {
        const tx =
          step < 2
            ? st.bx
            : step === 2
            ? lerp(st.bx, st.px, t)
            : lerp(st.px, st.bx, t);
        const ty =
          (step < 2
            ? st.by
            : step === 2
            ? lerp(st.by, st.py, t)
            : lerp(st.py, st.by, t)) +
          Math.sin(clock * 3.8 + idx) * (step === 2 ? 2.2 : 1.2);
        const popS =
          step === 0 ? easeOutBack(clamp01(animT * 1.25 - idx * 0.1)) : 1;

        return (
          <g
            key={idx}
            transform={`translate(${tx}, ${ty}) scale(${Math.max(0.01, popS)})`}
          >
            <rect
              x="-24"
              y="-15"
              width="48"
              height="30"
              rx="7.5"
              fill={step === 3 && t > 0.7 ? '#d9f99d' : '#fff9ec'}
              stroke="#161426"
              strokeWidth="2.5"
            />
            <text
              x="0"
              y="0.5"
              textAnchor="middle"
              dominantBaseline="central"
              fill="#161426"
              fontSize="11"
              fontWeight="900"
            >
              {words[idx]}
            </text>
          </g>
        );
      })}

      {/* Right Column (x=394, x_left >= 294 -> 29px clear of Clover right edge 265!) */}
      {step === 0 && (
        <g transform={`translate(0, ${Math.sin(clock * 3.6) * 2.5})`}>
          <SvgPill
            x={394}
            y={124}
            w={196}
            h={34}
            bg="#fff9ec"
            fontSize={11.2}
            scale={easeOutBack(animT)}
            text={
              lang === 'ar'
                ? '4 كلمات سرية على الزوايا'
                : '4 secret corner words'
            }
          />
        </g>
      )}

      {step === 1 && (
        <g transform={`translate(0, ${Math.sin(clock * 3.6) * 2.5})`}>
          <SvgPill
            x={394}
            y={124}
            w={200}
            h={34}
            bg="#ffca3a"
            fontSize={11.2}
            scale={easeOutBack(animT)}
            text={
              lang === 'ar'
                ? 'شفرة واحدة تربط كل كلمتين!'
                : '1 clue per adjacent pair!'
            }
          />
        </g>
      )}

      {step === 2 && (
        <g>
          <g transform={`translate(0, ${Math.sin(clock * 4.5) * 2})`}>
            <SvgPill
              x={394}
              y={152}
              w={178}
              h={28}
              bg="#ff595e"
              fg="#ffffff"
              fontSize={11}
              scale={easeOutBack(animT)}
              text={
                lang === 'ar'
                  ? '+ كلمة دخيلة: طيارة!'
                  : '+ Decoy: Airplane!'
              }
            />
          </g>
          <SvgPill
            x={394}
            y={196}
            w={202}
            h={25}
            bg="#161426"
            fg="#ffca3a"
            fontSize={10.5}
            text={
              lang === 'ar'
                ? 'تُخلط الكلمات ليحلّها الفريق'
                : 'Removed & shuffled with decoy!'
            }
          />
        </g>
      )}

      {step === 3 && (
        <g>
          {/* Stranded Rejected Decoy Tile */}
          <g transform="translate(394, 82)">
            <rect
              x="-58"
              y="-14"
              width="116"
              height="28"
              rx="9"
              fill="#ffe4e6"
              stroke="#161426"
              strokeWidth="2.6"
            />
            <SvgCrossMark x={-40} y={0} size={0.85} color="#b91c1c" />
            <text
              x="8"
              y="0.5"
              textAnchor="middle"
              dominantBaseline="central"
              fill="#991b1b"
              fontSize="11"
              fontWeight="900"
            >
              {lang === 'ar' ? 'طيارة (دخيلة)' : 'Airplane'}
            </text>
          </g>
          <SvgScoreBadge
            x={394}
            y={152}
            w={196}
            bg="#8ac926"
            animT={animT}
            clock={clock}
            text={
              lang === 'ar'
                ? 'تركيب صحيح 4/4! +5'
                : 'Solved all 4! +5 PTS'
            }
          />
        </g>
      )}
    </StageBackdrop>
  );
};

/* ============================================================================
 * 12. DECRYPTO (كسر الشيفرة) — Pure Native SVG 4-Step Scene
 * ========================================================================== */
export const DecryptoTutorialScene: React.FC<TutorialSceneProps> = ({
  step,
  animT,
  clock,
  lang,
}) => {
  const screens =
    lang === 'ar'
      ? ['شمس', 'بحر', 'كتاب', 'قطار']
      : ['Sun', 'Ocean', 'Book', 'Train'];

  const activeScanIdx = Math.floor(clock * 2.2) % 4;
  const screenXs = [86, 202, 318, 434];

  return (
    <StageBackdrop bg="#161e3d" accent="#4361ee">
      {/* Top 4 Numbered Keyword Monitors (#1 .. #4) */}
      {screens.map((word, idx) => {
        const sx = screenXs[idx];
        const matchedInStep3 = step === 3 && (idx === 2 || idx === 0 || idx === 3);
        const scanningInStep0 = step === 0 && activeScanIdx === idx;
        return (
          <g
            key={idx}
            transform={`translate(${sx}, ${
              50 + (scanningInStep0 ? -2.5 : 0)
            })`}
          >
            <rect
              x="-46"
              y="-22"
              width="92"
              height="50"
              rx="10"
              fill="#120f29"
            />
            <rect
              x="-46"
              y="-25"
              width="92"
              height="50"
              rx="10"
              fill={
                matchedInStep3
                  ? '#8ac926'
                  : scanningInStep0
                  ? '#fef08a'
                  : '#fff9ec'
              }
              stroke={scanningInStep0 ? '#ffca3a' : '#161426'}
              strokeWidth="3.2"
            />
            <rect x="-40" y="-20" width="24" height="15" rx="5" fill="#161426" />
            <text
              x="-28"
              y="-12"
              textAnchor="middle"
              dominantBaseline="central"
              fill="#ffca3a"
              fontSize="9.8"
              fontWeight="900"
            >
              #{idx + 1}
            </text>
            <text
              x="0"
              y="8"
              textAnchor="middle"
              dominantBaseline="central"
              fill="#161426"
              fontSize="12.5"
              fontWeight="900"
            >
              {word}
            </text>
          </g>
        );
      })}

      {/* Step 0: Explain 4 Screens */}
      {step === 0 && (
        <g transform={`translate(0, ${Math.sin(clock * 3.8) * 2})`}>
          <SvgPill
            x={260}
            y={152}
            w={340}
            h={30}
            bg="#ffca3a"
            scale={easeOutBack(animT)}
            text={
              lang === 'ar'
                ? '4 شاشات مرقّمة بكلمات ثابتة طوال الجولة'
                : '4 numbered screens hold secret keywords'
            }
          />
        </g>
      )}

      {/* Step 1: Secret 3-Digit Code Card for Encryptor */}
      {step === 1 && (
        <g>
          <SvgPlayerAvatar
            x={124}
            y={156}
            color="#ffca3a"
            label={lang === 'ar' ? 'المشفِّر' : 'Encryptor'}
            scale={0.84}
            crown={true}
            highlight={true}
            clock={clock}
          />
          <line
            x1={158}
            y1={152}
            x2={188}
            y2={152}
            stroke="#ffca3a"
            strokeWidth="2.8"
            strokeDasharray="4 4"
            strokeDashoffset={-(clock * 20) % 16}
          />
          <g transform={`translate(0, ${Math.sin(clock * 4) * 2.5})`}>
            <SvgPill
              x={312}
              y={152}
              w={238}
              h={40}
              bg="#ff595e"
              fg="#ffffff"
              fontSize={14.5}
              scale={easeOutBack(animT)}
              text={
                lang === 'ar'
                  ? 'الكود السري: 3 - 1 - 4'
                  : 'Secret Code: 3 - 1 - 4'
              }
            />
          </g>
        </g>
      )}

      {/* Step 2: 3 Well-Spaced Transmitted Clues + Radio Wave Pulse */}
      {step === 2 && (
        <g>
          {[
            { x: 116, ar: '1) «قراءة»', en: '1) "Pages"', d: 0 },
            { x: 260, ar: '2) «شروق»', en: '2) "Dawn"', d: 0.1 },
            { x: 404, ar: '3) «سكة»', en: '3) "Rails"', d: 0.2 },
          ].map((cl, i) => (
            <g
              key={i}
              transform={`translate(0, ${Math.sin(clock * 4 + i * 1.1) * 2.2})`}
            >
              <SvgPill
                x={cl.x}
                y={134}
                w={114}
                h={30}
                bg="#00bbf9"
                scale={easeOutBack(clamp01(animT * 1.2 - cl.d))}
                text={lang === 'ar' ? cl.ar : cl.en}
              />
            </g>
          ))}
          <SvgPill
            x={260}
            y={198}
            w={360}
            h={25}
            bg="#161426"
            fg="#ffca3a"
            fontSize={11}
            text={
              lang === 'ar'
                ? 'المشفِّر يكتب 3 تلميحات تطابق أرقام الكود بالترتيب'
                : '3 clues transmitted matching the 3 code digits'
            }
          />
        </g>
      )}

      {/* Step 3: Visual Decoding Beams Mapping Clues -> Monitors #3, #1, #4! */}
      {step === 3 && (
        <g>
          {[
            { fromX: 116, toX: 318, color: '#ffca3a' }, // 1) Pages -> #3 Book
            { fromX: 260, toX: 86, color: '#00bbf9' }, // 2) Dawn -> #1 Sun
            { fromX: 404, toX: 434, color: '#8ac926' }, // 3) Rails -> #4 Train
          ].map((beam, bi) => (
            <line
              key={bi}
              x1={beam.fromX}
              y1={122}
              x2={beam.toX}
              y2={76}
              stroke={beam.color}
              strokeWidth="3"
              strokeDasharray="6 4"
              strokeDashoffset={-(clock * 26) % 20}
            />
          ))}
          <SvgPill
            x={116}
            y={136}
            w={112}
            h={28}
            bg="#fff9ec"
            fontSize={11}
            text={lang === 'ar' ? 'قراءة = #3' : 'Pages = #3'}
          />
          <SvgPill
            x={260}
            y={136}
            w={112}
            h={28}
            bg="#fff9ec"
            fontSize={11}
            text={lang === 'ar' ? 'شروق = #1' : 'Dawn = #1'}
          />
          <SvgPill
            x={404}
            y={136}
            w={112}
            h={28}
            bg="#fff9ec"
            fontSize={11}
            text={lang === 'ar' ? 'سكة = #4' : 'Rails = #4'}
          />
          <SvgScoreBadge
            x={260}
            y={196}
            w={265}
            bg="#8ac926"
            animT={animT}
            clock={clock}
            text={
              lang === 'ar'
                ? 'تم فك الشيفرة: 3 - 1 - 4!'
                : 'Code Cracked: 3 - 1 - 4!'
            }
          />
        </g>
      )}
    </StageBackdrop>
  );
};

/* ============================================================================
 * 13. ITO 1-100 (تخاطر الأرقام) — Pure Native SVG 4-Step Scene
 *     Shifted Layout (Rows x=198, w=232 -> [82..314]; Right Zone x=422 -> [340..504]!)
 * ========================================================================== */
export const ItoTutorialScene: React.FC<TutorialSceneProps> = ({
  step,
  animT,
  clock,
  lang,
}) => {
  const t = easeOutCubic(animT);
  const cards = [
    {
      id: 'low',
      num: 15,
      clueAr: 'قطة صغيرة',
      clueEn: 'Tiny Kitten',
      color: '#00bbf9',
      yUnsorted: 130,
      ySorted: 82,
    },
    {
      id: 'mid',
      num: 54,
      clueAr: 'ذئب بري',
      clueEn: 'Wild Wolf',
      color: '#ffca3a',
      yUnsorted: 178,
      ySorted: 130,
    },
    {
      id: 'high',
      num: 91,
      clueAr: 'قرش مفترس',
      clueEn: 'Great Shark',
      color: '#ff595e',
      yUnsorted: 82,
      ySorted: 178,
    },
  ];

  const showNumbers = step === 0 || step === 3;

  return (
    <StageBackdrop bg="#172845" accent="#00bbf9">
      {/* Top Theme Scale */}
      <SvgPill
        x={260}
        y={23}
        w={365}
        h={25}
        bg="#ffca3a"
        fontSize={11.2}
        scale={step === 0 ? easeOutBack(animT) : 1}
        text={
          lang === 'ar'
            ? 'المقياس: كائنات مخيفة (1 لطيف — 100 رعب!)'
            : 'Scale: Scary Creatures (1 Cute — 100 Terror!)'
        }
      />

      {/* Left Scale Thermometer (x=46, animated mercury level!) */}
      <g transform="translate(46, 130)">
        <rect x="-11" y="-58" width="22" height="116" rx="11" fill="#161426" />
        <rect x="-6.5" y="-52" width="13" height="104" rx="6.5" fill="#38bdf8" />
        <circle
          cx="0"
          cy={Math.sin(clock * 2.6) * 38}
          r="5"
          fill="#ffca3a"
        />
        <text
          x="0"
          y="-65"
          textAnchor="middle"
          fill="#8ac926"
          fontSize="11"
          fontWeight="900"
        >
          1
        </text>
        <text
          x="0"
          y="73"
          textAnchor="middle"
          fill="#ff595e"
          fontSize="11"
          fontWeight="900"
        >
          100
        </text>
      </g>

      {/* 3 Smoothly Sliding Player Rows (x=198, w=232 -> x=[82..314], zero collision!) */}
      {cards.map((c, idx) => {
        const baseCurY =
          step < 2
            ? c.yUnsorted
            : step === 2
            ? lerp(c.yUnsorted, c.ySorted, t)
            : c.ySorted;
        const curY = baseCurY + Math.sin(clock * 3.6 + idx * 1.1) * 1.6;
        const rowPop =
          step === 0 ? easeOutBack(clamp01(animT * 1.25 - idx * 0.1)) : 1;

        return (
          <g
            key={c.id}
            transform={`translate(198, ${curY}) scale(${Math.max(0.01, rowPop)})`}
          >
            <rect
              x="-116"
              y="-15"
              width="232"
              height="35"
              rx="11"
              fill="#120f29"
            />
            <rect
              x="-116"
              y="-18"
              width="232"
              height="35"
              rx="11"
              fill={step === 3 ? '#d9f99d' : '#fff9ec'}
              stroke="#161426"
              strokeWidth="3"
            />
            <circle
              cx="-90"
              cy="-0.5"
              r="12.5"
              fill={c.color}
              stroke="#161426"
              strokeWidth="2.4"
            />
            <text
              x="-90"
              y="0"
              textAnchor="middle"
              dominantBaseline="central"
              fill="#161426"
              fontSize="11.5"
              fontWeight="900"
            >
              {showNumbers ? c.num : '?'}
            </text>

            <text
              x="8"
              y="0"
              textAnchor="middle"
              dominantBaseline="central"
              fill="#161426"
              fontSize="12"
              fontWeight="900"
            >
              {step === 0
                ? lang === 'ar'
                  ? 'يشوف رقمه بالسر...'
                  : 'Secret number...'
                : lang === 'ar'
                ? `«${c.clueAr}»`
                : `"${c.clueEn}"`}
            </text>

            {step === 3 && (
              <SvgCheckMark x={96} y={0} size={0.9} color="#15803d" />
            )}
          </g>
        );
      })}

      {/* Right Column Callouts / Score Badge (x=422, w=160 -> x=[342..502], 28px clear of rows!) */}
      {step === 0 && (
        <SvgPill
          x={422}
          y={130}
          w={162}
          h={32}
          bg="#00bbf9"
          fontSize={11}
          scale={easeOutBack(animT)}
          text={lang === 'ar' ? 'أرقام سرية 1–100!' : 'Secret 1–100 cards!'}
        />
      )}

      {step === 1 && (
        <SvgPill
          x={422}
          y={130}
          w={164}
          h={32}
          bg="#ffca3a"
          fontSize={11}
          scale={easeOutBack(animT)}
          text={lang === 'ar' ? 'أمثلة بدون ذكر أرقام!' : 'Clues, zero numbers!'}
        />
      )}

      {step === 2 && (
        <SvgPill
          x={422}
          y={130}
          w={164}
          h={32}
          bg="#fff9ec"
          fontSize={11}
          scale={easeOutBack(animT)}
          text={lang === 'ar' ? 'رتّبوها تصاعدياً!' : 'Sort low to high!'}
        />
      )}

      {step === 3 && (
        <SvgScoreBadge
          x={422}
          y={130}
          w={158}
          bg="#8ac926"
          animT={animT}
          clock={clock}
          text="15 < 54 < 91"
        />
      )}
    </StageBackdrop>
  );
};

/* ============================================================================
 * 14. WORD BOMB (قنبلة الحروف) — Pure Native SVG 4-Step Scene
 *     Zero Collisions + 1-to-1 Rules Alignment Including Crowd Referee Objection!
 * ========================================================================== */
export const WordBombTutorialScene: React.FC<TutorialSceneProps> = ({
  step,
  animT,
  clock,
  lang,
}) => {
  const t = easeOutCubic(animT);
  // Calibrated vertical budget: Top Pill y<=35, Bomb y=92..112 (spark >=58), Avatars y_top=152!
  const bombX =
    step === 0 || step === 1
      ? 108
      : step === 2
      ? lerp(108, 260, t)
      : animT < 0.55
      ? lerp(412, 310, animT / 0.55)
      : lerp(310, 412, (animT - 0.55) / 0.45);

  const arcLift = step === 2 ? Math.sin(t * Math.PI) * -20 : 0;
  const bombY = 112 + arcLift;
  const sparkScale = 0.85 + Math.sin(clock * 14) * 0.32;

  return (
    <StageBackdrop bg="#2b1424" accent="#ff595e">
      {/* Top Rule Banner (y=21, h=25 -> y_bot=35.5, 22px clear of bomb spark!) */}
      <SvgPill
        x={260}
        y={21}
        w={390}
        h={25}
        bg={
          step === 1
            ? '#ff595e'
            : step === 2
            ? '#8ac926'
            : '#ffca3a'
        }
        fg={step === 1 ? '#ffffff' : '#161426'}
        fontSize={10.8}
        scale={easeOutBack(animT)}
        text={
          step === 0
            ? lang === 'ar'
              ? 'تظهر القنبلة بيد لاعب وعليها حرفان مطلوبان!'
              : 'Bomb lands in hand showing 2 required letters!'
            : step === 1
            ? lang === 'ar'
              ? 'فتيل عشوائي مخفي — ممكن تنفجر بأي ثانية!'
              : 'Hidden unpredictable fuse — can blow any second!'
            : step === 2
            ? lang === 'ar'
              ? 'كلمة صحيحة تحتوي الحرفين تمرّر القنبلة فوراً!'
              : 'Valid word with both letters passes the bomb!'
            : lang === 'ar'
            ? 'تخبيص؟ زر اعتراض الشلّة يرجّع القنبلة ليده!'
            : 'Gibberish? Crowd Referee tosses the bomb back!'
        }
      />

      {/* 3 Players in Hot-Potato Row (y=178, scale=0.82 -> y_top=152!) */}
      <SvgPlayerAvatar
        x={108}
        y={178}
        color="#00bbf9"
        label={lang === 'ar' ? 'لاعب 1' : 'Player 1'}
        scale={0.82}
        highlight={step === 0 || step === 1}
        clock={clock}
      />
      <SvgPlayerAvatar
        x={260}
        y={180}
        color="#8ac926"
        label={lang === 'ar' ? 'لاعب 2' : 'Player 2'}
        scale={0.82}
        highlight={step === 2}
        clock={clock}
      />
      <SvgPlayerAvatar
        x={412}
        y={178}
        color="#ffca3a"
        label={lang === 'ar' ? 'لاعب 3' : 'Player 3'}
        scale={0.82}
        suspect={step === 3}
        clock={clock}
      />

      {/* Step 0: Zoom Callout Highlighting the 2 Required Letters */}
      {step === 0 && (
        <g transform={`translate(0, ${Math.sin(clock * 4) * 2.5})`}>
          <SvgPill
            x={268}
            y={112}
            w={178}
            h={32}
            bg="#fff9ec"
            fontSize={12.5}
            scale={easeOutBack(animT)}
            text={lang === 'ar' ? 'الحرفان: «ب + ر»' : 'Letters: "B + R"'}
          />
        </g>
      )}

      {/* Step 1: Mystery Unpredictable Timer Callout + Sweat Drop */}
      {step === 1 && (
        <g>
          <path
            d="M 0 -5 C 3 0 3 5 0 5 C -3 5 -3 0 0 -5 Z"
            fill="#38bdf8"
            stroke="#161426"
            strokeWidth="1.4"
            transform={`translate(132, ${156 + ((clock * 18) % 12)})`}
          />
          <g transform={`translate(0, ${Math.sin(clock * 5.5) * 3})`}>
            <SvgPill
              x={268}
              y={112}
              w={186}
              h={32}
              bg="#161426"
              fg="#ffca3a"
              fontSize={12}
              scale={easeOutBack(animT)}
              text={lang === 'ar' ? 'وقت الانفجار: ؟؟؟' : 'Fuse Timer: ???'}
            />
          </g>
        </g>
      )}

      {/* Step 2: Valid Word Shout + Parabolic Pass Arc */}
      {step === 2 && (
        <g>
          <path
            d="M 108 112 Q 184 74 260 112"
            fill="none"
            stroke="#8ac926"
            strokeWidth="3"
            strokeDasharray="6 5"
            strokeDashoffset={-(clock * 28) % 22}
          />
          <SvgPill
            x={92}
            y={58}
            w={136}
            h={26}
            bg="#fff9ec"
            fontSize={11.5}
            scale={easeOutBack(animT)}
            text={lang === 'ar' ? '«برتقال!»' : '"BREAD!"'}
          />
        </g>
      )}

      {/* Step 3: Gibberish Rejected by Crowd Referee -> Bounces Back -> BOOM! */}
      {step === 3 && (
        <g>
          <SvgPill
            x={408}
            y={56}
            w={136}
            h={25}
            bg="#ffe4e6"
            fg="#991b1b"
            fontSize={11}
            text={lang === 'ar' ? '«بربص!!»' : '"BRXZZ!!"'}
          />
          <g transform={`translate(0, ${Math.sin(clock * 5) * 2})`}>
            <SvgPill
              x={212}
              y={108}
              w={162}
              h={28}
              bg="#ff595e"
              fg="#ffffff"
              fontSize={11}
              scale={easeOutBack(animT)}
              text={lang === 'ar' ? 'اعتراض الشلّة!' : 'Crowd Reject!'}
            />
          </g>
        </g>
      )}

      {/* Animated Ticking Bomb / Comic BOOM (Calibrated r<=32 so y_bot=144 < 152!) */}
      <g transform={`translate(${bombX}, ${bombY})`}>
        {step === 3 && animT > 0.7 ? (
          <g transform={`scale(${0.92 + Math.sin(clock * 10) * 0.06})`}>
            <polygon
              points="0,-33 10,-13 32,-19 18,0 33,17 11,14 3,33 -8,14 -30,20 -16,2 -32,-16 -10,-13"
              fill="#ff595e"
              stroke="#161426"
              strokeWidth="3.2"
              strokeLinejoin="round"
            />
            <text
              x="0"
              y="0.5"
              textAnchor="middle"
              dominantBaseline="central"
              fill="#ffca3a"
              fontSize="12.5"
              fontWeight="900"
            >
              BOOM!
            </text>
          </g>
        ) : (
          <g transform={`scale(${1 + Math.sin(clock * 8) * 0.04})`}>
            <path
              d="M 7 -22 Q 16 -34 25 -28"
              fill="none"
              stroke="#d97706"
              strokeWidth="3.6"
              strokeLinecap="round"
            />
            <g transform={`translate(26, -28) scale(${sparkScale})`}>
              <polygon
                points="0,-8 2.2,-2.2 8,0 2.2,2.2 0,8 -2.2,2.2 -8,0 -2.2,-2.2"
                fill="#ffca3a"
              />
              <circle cx="0" cy="0" r="2.6" fill="#ff595e" />
            </g>
            <circle
              cx="0"
              cy="0"
              r="24"
              fill="#161426"
              stroke="#120f29"
              strokeWidth="3.2"
            />
            <rect
              x="-18"
              y="-10"
              width="36"
              height="20"
              rx="6"
              fill="#1e1b4b"
              stroke="#ffca3a"
              strokeWidth="2"
            />
            <text
              x="0"
              y="0.5"
              textAnchor="middle"
              dominantBaseline="central"
              fill="#ffca3a"
              fontSize="11"
              fontWeight="900"
            >
              {lang === 'ar' ? 'ب ر' : 'B R'}
            </text>
          </g>
        )}
      </g>
    </StageBackdrop>
  );
};

/* ============================================================================
 * 15. THE MIND (ذا مايند / نبض الصمت) — Pure Native SVG 4-Step Scene
 * ========================================================================== */
const MindNumberCard: React.FC<{
  x: number;
  y: number;
  num: number;
  scale?: number;
  tint?: string;
  danger?: boolean;
}> = ({ x, y, num, scale = 1, tint = '#fff9ec', danger = false }) => (
  <g transform={`translate(${x}, ${y}) scale(${scale})`}>
    <rect x="-21" y="-26" width="42" height="56" rx="9" fill="#120f29" />
    <rect
      x="-21"
      y="-29"
      width="42"
      height="56"
      rx="9"
      fill={tint}
      stroke={danger ? '#ff595e' : '#161426'}
      strokeWidth={danger ? '3.5' : '3'}
    />
    <text
      x="0"
      y="-0.5"
      textAnchor="middle"
      dominantBaseline="central"
      fill="#161426"
      fontSize="15.5"
      fontWeight="900"
    >
      {num}
    </text>
  </g>
);

const SvgHeartLife: React.FC<{
  x: number;
  y: number;
  alive: boolean;
  scale?: number;
}> = ({ x, y, alive, scale = 1 }) => (
  <g transform={`translate(${x}, ${y}) scale(${scale})`}>
    <path
      d="M 0 8 C -2 6 -11 0 -11 -5.5 A 5.5 5.5 0 0 1 0 -4 A 5.5 5.5 0 0 1 11 -5.5 C 11 0 2 6 0 8 Z"
      fill={alive ? '#ff595e' : '#334155'}
      stroke="#161426"
      strokeWidth="2.4"
      strokeLinejoin="round"
    />
  </g>
);

export const TheMindTutorialScene: React.FC<TutorialSceneProps> = ({
  step,
  animT,
  clock,
  lang,
}) => {
  const t = easeOutCubic(animT);
  const floatA = Math.sin(clock * 3.6) * 2.5;
  const floatB = Math.sin(clock * 3.6 + 1.6) * 2.5;
  const auraR = 36 + Math.sin(clock * 4) * 4;
  const starAngle = (clock * 150) % 360;

  return (
    <StageBackdrop bg="#191336" accent="#ff924c">
      {/* Top Rule Banner (y=21, h=25 -> y_bot=35.5) */}
      <SvgPill
        x={260}
        y={21}
        w={410}
        h={25}
        bg={step === 2 ? '#ff595e' : '#ffca3a'}
        fg={step === 2 ? '#ffffff' : '#161426'}
        fontSize={10.8}
        scale={easeOutBack(animT)}
        text={
          step === 0
            ? lang === 'ar'
              ? 'المستوى 2 = كرتان سريّان لكل لاعب (1–100) — صمت تام!'
              : 'Level 2 = 2 secret cards each (1–100) — Total silence!'
            : step === 1
            ? lang === 'ar'
              ? 'بدون أدوار! من يشعر أن معه أصغر رقم يرميه بالوسط'
              : 'No turns! Feel time together & play lowest card next'
            : step === 2
            ? lang === 'ar'
              ? 'رمى 62 وبيد صاحبه 38 أصغر! خسارة قلب وكشف الأصغر'
              : 'Played 62 while 38 was held! Lose 1 Life & discard 38'
            : lang === 'ar'
            ? 'نجمة التزامن: يتخلص الجميع من أصغر كرت بيدهم معاً!'
            : 'Throwing Star: Everyone discards their lowest card!'
        }
      />

      {/* Left & Right Players (x=64 & x=456, y=136) */}
      <SvgPlayerAvatar
        x={64}
        y={136}
        color="#00bbf9"
        label={lang === 'ar' ? 'رامي' : 'Rami'}
        scale={0.84}
        highlight={step === 0 || step === 1}
        suspect={step === 2}
        clock={clock}
      />
      <SvgPlayerAvatar
        x={456}
        y={136}
        color="#ffca3a"
        label={lang === 'ar' ? 'سارة' : 'Sara'}
        scale={0.84}
        highlight={step === 0 || step === 1}
        clock={clock}
      />

      {/* STEP 0: Dealt Secret 1-100 Cards + Silent Telepathy Bunny Aura */}
      {step === 0 && (
        <g>
          {/* Rami's 2 Secret Cards (14, 62) */}
          <MindNumberCard
            x={136}
            y={122 + floatA}
            num={14}
            scale={0.88 * Math.max(0.05, easeOutBack(animT))}
            tint="#e0f2fe"
          />
          <MindNumberCard
            x={178}
            y={128 - floatA}
            num={62}
            scale={0.88 * Math.max(0.05, easeOutBack(clamp01((animT - 0.1) * 1.15)))}
            tint="#e0f2fe"
          />

          {/* Center Silent Mind Aura */}
          <circle
            cx="260"
            cy="122"
            r={auraR}
            fill="rgba(255, 146, 76, 0.14)"
            stroke="#ff924c"
            strokeWidth="2.6"
            strokeDasharray="6 5"
          />
          <SvgPill
            x={260}
            y={122}
            w={92}
            h={26}
            bg="#161426"
            fg="#ff924c"
            fontSize={10.8}
            text={lang === 'ar' ? 'صمت تام!' : 'SILENCE!'}
          />

          {/* Sara's 2 Secret Cards (29, 85) */}
          <MindNumberCard
            x={342}
            y={122 + floatB}
            num={29}
            scale={0.88 * Math.max(0.05, easeOutBack(clamp01((animT - 0.15) * 1.2)))}
            tint="#fef3c7"
          />
          <MindNumberCard
            x={384}
            y={128 - floatB}
            num={85}
            scale={0.88 * Math.max(0.05, easeOutBack(clamp01((animT - 0.22) * 1.25)))}
            tint="#fef3c7"
          />

          <SvgPill
            x={260}
            y={213}
            w={365}
            h={24}
            bg="#161426"
            fg="#ffca3a"
            fontSize={11}
            text={
              lang === 'ar'
                ? 'ممنوع النطق أو الإشارة — اعتمدوا على الإحساس المشترك!'
                : 'Zero speaking or hints — tune into one shared rhythm!'
            }
          />
        </g>
      )}

      {/* STEP 1: No Turn Order — Cards Glide Onto Ascending Pile (14 -> 29) */}
      {step === 1 && (
        <g>
          <circle
            cx="260"
            cy="120"
            r={auraR + 8}
            fill="rgba(138, 201, 38, 0.12)"
            stroke="#8ac926"
            strokeWidth="2.5"
            strokeDasharray="6 5"
          />
          <path
            d="M 100 128 Q 180 86 236 116"
            fill="none"
            stroke="#00bbf9"
            strokeWidth="2.6"
            strokeDasharray="5 4"
            strokeDashoffset={-(clock * 24) % 18}
          />
          <path
            d="M 420 128 Q 345 86 284 116"
            fill="none"
            stroke="#ffca3a"
            strokeWidth="2.6"
            strokeDasharray="5 4"
            strokeDashoffset={-(clock * 24) % 18}
          />

          {/* Base Played Card 14 + Incoming Ascending Card 29 */}
          <MindNumberCard x={244} y={122} num={14} tint="#d9f99d" />
          <MindNumberCard
            x={lerp(368, 276, t)}
            y={120 + Math.sin(t * Math.PI) * -18 + floatA * 0.6}
            num={29}
            tint="#8ac926"
          />

          <SvgPill
            x={260}
            y={213}
            w={365}
            h={24}
            bg="#161426"
            fg="#8ac926"
            fontSize={11}
            text={
              lang === 'ar'
                ? 'تزامن رائع: 14 ثم 29 بالترتيب التصاعدي الصحيح!'
                : 'Perfect sync: 14 then 29 in ascending order!'
            }
          />
        </g>
      )}

      {/* STEP 2: Timing Clash! Played 62 While 38 Was Held -> Lose 1 Heart! */}
      {step === 2 && (
        <g>
          {/* Team Lives Strip Showing -1 Heart */}
          <g transform={`translate(160, ${118 + Math.sin(clock * 8) * 2})`}>
            <SvgHeartLife x={-26} y={0} alive={true} />
            <SvgHeartLife x={0} y={0} alive={true} />
            <SvgHeartLife x={26} y={0} alive={false} />
            <text
              x="0"
              y="24"
              textAnchor="middle"
              fill="#ff595e"
              fontSize="11.5"
              fontWeight="900"
            >
              {lang === 'ar' ? '-1 قلب!' : '-1 Life!'}
            </text>
          </g>

          {/* Prematurely Played 62 on Pile */}
          <MindNumberCard x={252} y={120} num={62} tint="#ffe4e6" danger={true} />

          {/* Sara's Skipped Lower Card 38 Revealed & Discarded */}
          <MindNumberCard
            x={lerp(390, 344, t)}
            y={120 + floatB}
            num={38}
            tint="#ffca3a"
            danger={true}
          />
          <SvgPill
            x={344}
            y={74}
            w={82}
            h={22}
            bg="#ff595e"
            fg="#ffffff"
            fontSize={10.5}
            text="38 < 62!"
          />

          <SvgPill
            x={260}
            y={213}
            w={385}
            h={24}
            bg="#161426"
            fg="#fda4af"
            fontSize={11}
            text={
              lang === 'ar'
                ? 'تُكشف وتُستبعد الكروت الأصغر (38) وتكملون المستوى!'
                : 'Lower card (38) is discarded face-up & level continues!'
            }
          />
        </g>
      )}

      {/* STEP 3: Spinning Golden Throwing Star (Shuriken) Reveals Both Lowest Cards! */}
      {step === 3 && (
        <g>
          {/* Pure Native SVG Spinning 4-Point Shuriken at (260, 112) */}
          <circle
            cx="260"
            cy="112"
            r={30 + Math.sin(clock * 6) * 3}
            fill="rgba(255, 202, 58, 0.18)"
            stroke="#ffca3a"
            strokeWidth="2.4"
            strokeDasharray="5 4"
          />
          <g transform={`translate(260, 112) rotate(${starAngle}, 0, 0)`}>
            <polygon
              points="0,-24 6,-6 24,0 6,6 0,24 -6,6 -24,0 -6,-6"
              fill="#ffca3a"
              stroke="#161426"
              strokeWidth="2.8"
              strokeLinejoin="round"
            />
            <circle
              cx="0"
              cy="0"
              r="4.5"
              fill="#191336"
              stroke="#161426"
              strokeWidth="2"
            />
          </g>

          {/* Both Players Simultaneously Reveal & Discard Lowest Card! */}
          <MindNumberCard
            x={lerp(126, 168, t)}
            y={116 + floatA}
            num={19}
            scale={0.92}
            tint="#d9f99d"
          />
          <MindNumberCard
            x={lerp(394, 352, t)}
            y={116 + floatB}
            num={34}
            scale={0.92}
            tint="#d9f99d"
          />

          <SvgScoreBadge
            x={260}
            y={210}
            w={355}
            bg="#8ac926"
            animT={animT}
            clock={clock}
            text={
              lang === 'ar'
                ? 'نجمة التزامن أنقذت الشلّة بمعلومات ذهبية!'
                : 'Throwing Star reveals lowest cards safely!'
            }
          />
        </g>
      )}
    </StageBackdrop>
  );
};
