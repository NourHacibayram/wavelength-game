import React from 'react';
import {
  TutorialSceneProps,
  StageBackdrop,
  SvgPlayerAvatar,
  SvgPill,
  SvgScoreBadge,
  SvgCheckMark,
  SvgDoubleArrow,
  lerp,
  easeOutCubic,
  easeOutBack,
  clamp01,
} from './TutorialSvgPrimitives';

/* ============================================================================
 * HELPER MINI PLAYING CARD VECTOR FOR TRIX TUTORIAL
 * ========================================================================== */
const MiniPlayingCard: React.FC<{
  x: number;
  y: number;
  w?: number;
  h?: number;
  rank: string;
  suit: 'H' | 'D' | 'S' | 'C';
  rot?: number;
  scale?: number;
  highlight?: boolean;
}> = ({ x, y, w = 44, h = 62, rank, suit, rot = 0, scale = 1, highlight = false }) => {
  const isRed = suit === 'H' || suit === 'D';
  const col = isRed ? '#e63946' : '#161426';
  const rankX = rank.length > 1 ? -w / 2 + 10.8 : -w / 2 + 9;

  return (
    <g transform={`translate(${x}, ${y}) rotate(${rot}) scale(${scale})`}>
      <rect
        x={-w / 2}
        y={-h / 2 + 3}
        width={w}
        height={h}
        rx="7"
        fill="#120f29"
      />
      <rect
        x={-w / 2}
        y={-h / 2}
        width={w}
        height={h}
        rx="7"
        fill={highlight ? '#fffbeb' : '#ffffff'}
        stroke={highlight ? '#ffca3a' : '#161426'}
        strokeWidth={highlight ? '3.2' : '2.6'}
      />
      <text
        x={rankX}
        y={-h / 2 + 12}
        textAnchor="middle"
        dominantBaseline="central"
        fill={col}
        fontSize={rank.length > 1 ? '10' : '11'}
        fontWeight="900"
      >
        {rank}
      </text>

      {/* Pure Vector Suit Pip */}
      <g transform="translate(0, 5)">
        {suit === 'H' && (
          <path
            d="M 0 9 C 0 9 -9 3 -9 -2.5 C -9 -6 -5.5 -7.5 -3 -5.5 C -1.2 -4 0 -2 0 -2 C 0 -2 1.2 -4 3 -5.5 C 5.5 -7.5 9 -6 9 -2.5 C 9 3 0 9 0 9 Z"
            fill="#ff595e"
            stroke="#161426"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
        )}
        {suit === 'D' && (
          <polygon
            points="0,-9 8,0 0,9 -8,0"
            fill="#ff924c"
            stroke="#161426"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
        )}
        {suit === 'S' && (
          <g>
            <path
              d="M 0 -9 C 0 -9 9 -2 9 3 C 9 6.5 5.5 7.5 3 5.5 L 0 3 L -3 5.5 C -5.5 7.5 -9 6.5 -9 3 C -9 -2 0 -9 0 -9 Z"
              fill="#1e293b"
              stroke="#161426"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
            <path d="M -2.5 5 L 0 10 L 2.5 5 Z" fill="#161426" />
          </g>
        )}
        {suit === 'C' && (
          <g fill="#334155" stroke="#161426" strokeWidth="1.5">
            <circle cx="0" cy="-4.5" r="4.2" />
            <circle cx="-4.5" cy="1.5" r="4.2" />
            <circle cx="4.5" cy="1.5" r="4.2" />
            <path d="M -2 4 L 2 4 L 3 9 L -3 9 Z" fill="#161426" stroke="none" />
          </g>
        )}
      </g>
    </g>
  );
};

/* ============================================================================
 * 16. TRIX ROYAL (تركس الملوك — كومبلكس وممالك) — Pure Native SVG 4-Step Scene
 *     Zero Collisions, Pure Vector Suit Symbols, Continuous Clock Motion
 * ========================================================================== */
export const TrixTutorialScene: React.FC<TutorialSceneProps> = ({
  step,
  animT,
  clock,
  lang,
}) => {
  const t = easeOutCubic(animT);
  const bob = Math.sin(clock * 4.5) * 2.5;

  return (
    <StageBackdrop bg="#132e23" accent="#ffca3a">
      {/* Top Rule Banner (y=[10.5..35.5]) */}
      <SvgPill
        x={260}
        y={23}
        w={445}
        h={25}
        bg="#ffca3a"
        fontSize={10.8}
        text={
          step === 0
            ? lang === 'ar'
              ? '13 ورقة لكل لاعب — وصاحب «7 الكبة» يفتتح المملكة!'
              : '13 cards per seat — holder of 7 of Hearts opens Kingdom 1!'
            : step === 1
            ? lang === 'ar'
              ? 'عقد «تركس»: نرتّب من الولد (J) صعوداً للـ A ونزولاً للـ 2!'
              : 'Trix Contract: Build from Jack (J) up to A & down to 2!'
            : step === 2
            ? lang === 'ar'
              ? 'كومبلكس والنواقص: التزم باللون وتجنّب أكل أوراق العقوبة!'
              : 'Complex: Follow led suit & dodge all 4 penalty types!'
            : lang === 'ar'
            ? 'التدبيل (×2): ضاعف شيخ الكبة أو البنات لعقوبة مضاعفة ومكافأة!'
            : 'Doubling (x2): Double Red King or Queens for x2 penalty & bonus!'
        }
      />

      {/* Step 0: 4 Corner Seats + Dealing Deck + 7 of Hearts Kingdom Opener */}
      {step === 0 && (
        <g>
          {/* Felt Table Oval */}
          <ellipse
            cx="260"
            cy="118"
            rx="132"
            ry="62"
            fill="#1b4332"
            stroke="#161426"
            strokeWidth="3.5"
          />
          <ellipse
            cx="260"
            cy="118"
            rx="120"
            ry="51"
            fill="none"
            stroke="rgba(255, 202, 58, 0.3)"
            strokeWidth="2"
            strokeDasharray="6 5"
          />

          {/* 4 Seats Safely in Corners */}
          <SvgPlayerAvatar
            x={66}
            y={72}
            color="#ffca3a"
            label={lang === 'ar' ? 'المملكة!' : 'Owner!'}
            scale={0.72}
            crown={true}
            highlight={true}
            clock={clock}
          />
          <SvgPlayerAvatar
            x={454}
            y={72}
            color="#00bbf9"
            label={lang === 'ar' ? 'مقعد 2' : 'Seat 2'}
            scale={0.72}
            clock={clock}
          />
          <SvgPlayerAvatar
            x={66}
            y={156}
            color="#8ac926"
            label={lang === 'ar' ? 'مقعد 3' : 'Seat 3'}
            scale={0.72}
            clock={clock}
          />
          <SvgPlayerAvatar
            x={454}
            y={156}
            color="#f15bb5"
            label={lang === 'ar' ? 'مقعد 4' : 'Seat 4'}
            scale={0.72}
            clock={clock}
          />

          {/* Dashed Beam Connecting 7 of Hearts to Seat 1 */}
          <path
            d="M 228 112 Q 155 86 96 76"
            fill="none"
            stroke="#ffca3a"
            strokeWidth="3"
            strokeDasharray="6 4"
            strokeDashoffset={-(clock * 24) % 20}
          />

          {/* Glowing 7 of Hearts Card in Center */}
          <MiniPlayingCard
            x={260}
            y={116 + bob}
            w={54}
            h={74}
            rank="7"
            suit="H"
            scale={easeOutBack(animT)}
            highlight={true}
          />

          <SvgPill
            x={260}
            y={213}
            w={385}
            h={24}
            bg="#161426"
            fg="#fff9ec"
            fontSize={10.8}
            text={
              lang === 'ar'
                ? 'البوتات الذكية تكمل المقاعد تلقائياً إذا كنتم أقل من 4!'
                : 'Smart AI Bots fill empty seats automatically if under 4!'
            }
          />
        </g>
      )}

      {/* Step 1: Trix Sequential Layout Columns (J -> Q..A up, 10..2 down) */}
      {step === 1 && (
        <g>
          {/* Left Direction Guide Badges (x=[38..90], cleanly clear of Lane 0 at x=106!) */}
          <g transform={`translate(64, ${72 + Math.sin(clock * 4) * 2})`}>
            <rect
              x="-26"
              y="-11"
              width="52"
              height="22"
              rx="8"
              fill="#8ac926"
              stroke="#161426"
              strokeWidth="2.4"
            />
            <path
              d="M -11 3 L -11 -4 M -14.5 -0.5 L -11 -4.5 L -7.5 -0.5"
              fill="none"
              stroke="#161426"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <text
              x="7"
              y="0.5"
              textAnchor="middle"
              dominantBaseline="central"
              fill="#161426"
              fontSize="11"
              fontWeight="900"
            >
              A
            </text>
          </g>

          <g transform={`translate(64, ${160 - Math.sin(clock * 4) * 2})`}>
            <rect
              x="-26"
              y="-11"
              width="52"
              height="22"
              rx="8"
              fill="#00bbf9"
              stroke="#161426"
              strokeWidth="2.4"
            />
            <path
              d="M -11 -4 L -11 3 M -14.5 -0.5 L -11 3.5 L -7.5 -0.5"
              fill="none"
              stroke="#161426"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <text
              x="7"
              y="0.5"
              textAnchor="middle"
              dominantBaseline="central"
              fill="#161426"
              fontSize="11"
              fontWeight="900"
            >
              2
            </text>
          </g>

          {(
            [
              { x: 138, suit: 'H', up: 'Q', down: '10' },
              { x: 222, suit: 'D', up: 'K', down: '9' },
              { x: 306, suit: 'S', up: 'Q', down: '10' },
              { x: 390, suit: 'C', up: 'A', down: '10' },
            ] as const
          ).map((lane, idx) => {
            const laneT = clamp01((animT - idx * 0.08) * 1.3);
            const laneFloat = Math.sin(clock * 3.8 + idx * 0.9) * 1.8;
            return (
              <g key={lane.suit} transform={`translate(0, ${laneFloat})`}>
                <rect
                  x={lane.x - 28}
                  y={47}
                  width="56"
                  height="138"
                  rx="10"
                  fill="rgba(255,255,255,0.06)"
                  stroke="rgba(255,255,255,0.16)"
                  strokeWidth="1.6"
                />
                {/* Up Card (Q/K/A) */}
                <MiniPlayingCard
                  x={lane.x}
                  y={lerp(116, 72, easeOutCubic(laneT))}
                  w={40}
                  h={45}
                  rank={lane.up}
                  suit={lane.suit}
                />
                {/* Anchor Jack (J) */}
                <MiniPlayingCard
                  x={lane.x}
                  y={116}
                  w={42}
                  h={47}
                  rank="J"
                  suit={lane.suit}
                  highlight={true}
                />
                {/* Down Card (10/9) */}
                <MiniPlayingCard
                  x={lane.x}
                  y={lerp(116, 160, easeOutCubic(laneT))}
                  w={40}
                  h={45}
                  rank={lane.down}
                  suit={lane.suit}
                />
              </g>
            );
          })}

          <SvgScoreBadge
            x={260}
            y={212}
            w={395}
            bg="#8ac926"
            animT={animT}
            clock={clock}
            text={
              lang === 'ar'
                ? 'نقاط الترتيب: +200 ثم +150 ثم +100 ثم +50!'
                : 'Finish order: +200 / +150 / +100 / +50!'
            }
          />
        </g>
      )}

      {/* Step 2: The 4 Penalty Categories in Complex / Kingdoms */}
      {step === 2 && (
        <g>
          {[
            {
              x: 100,
              rank: 'K',
              suit: 'H' as const,
              pts: '-75',
              lblAr: 'شيخ الكبة',
              lblEn: 'Red King',
              bg: '#ff595e',
            },
            {
              x: 206,
              rank: 'Q',
              suit: 'S' as const,
              pts: '-25',
              lblAr: 'كل بنت',
              lblEn: 'Each Queen',
              bg: '#9b5de5',
            },
            {
              x: 314,
              rank: 'A',
              suit: 'D' as const,
              pts: '-10',
              lblAr: 'كل ديناري',
              lblEn: 'Each Diamond',
              bg: '#ff924c',
            },
            {
              x: 420,
              rank: '10',
              suit: 'C' as const,
              pts: '-15',
              lblAr: 'اللطش',
              lblEn: 'Each Trick',
              bg: '#00bbf9',
            },
          ].map((item, idx) => {
            const cScale = easeOutBack(clamp01((animT - idx * 0.08) * 1.25));
            return (
              <g key={item.lblEn} transform={`translate(0, ${Math.sin(clock * 4 + idx) * 1.8})`}>
                <MiniPlayingCard
                  x={item.x}
                  y={90}
                  w={50}
                  h={68}
                  rank={item.rank}
                  suit={item.suit}
                  scale={cScale}
                  highlight={idx === 0}
                />
                <SvgPill
                  x={item.x}
                  y={145}
                  w={92}
                  h={22}
                  bg="#fff9ec"
                  fontSize={10.2}
                  text={lang === 'ar' ? item.lblAr : item.lblEn}
                />
                <SvgPill
                  x={item.x}
                  y={176}
                  w={72}
                  h={22}
                  bg={item.bg}
                  fg="#ffffff"
                  fontSize={11.2}
                  text={item.pts}
                />
              </g>
            );
          })}

          <SvgPill
            x={260}
            y={214}
            w={430}
            h={23}
            bg="#161426"
            fg="#ffca3a"
            fontSize={10.5}
            text={
              lang === 'ar'
                ? 'في عقد «كومبلكس» تُحسب كل العقوبات الأربع معاً بنفس اليد!'
                : 'In "Complex", all 4 penalties apply together in one hand!'
            }
          />
        </g>
      )}

      {/* Step 3: Doubling (x2) King of Hearts & Queens — Zero Overlap! */}
      {step === 3 && (
        <g>
          {/* Doubler Seat Left */}
          <SvgPlayerAvatar
            x={88}
            y={114}
            color="#8ac926"
            label={lang === 'ar' ? 'المدبِّل' : 'Doubler'}
            scale={0.84}
            crown={true}
            highlight={true}
            clock={clock}
          />
          <SvgPill
            x={88}
            y={168}
            w={112}
            h={25}
            bg="#8ac926"
            fontSize={11.5}
            scale={easeOutBack(animT)}
            text={lang === 'ar' ? 'يكسب +75!' : 'Earns +75!'}
          />

          {/* Left Dashed Beam from Doubler to K of Hearts */}
          <path
            d="M 122 114 Q 175 96 226 118"
            fill="none"
            stroke="#8ac926"
            strokeWidth="3.2"
            strokeDasharray="6 4"
            strokeDashoffset={-(clock * 24) % 20}
          />

          {/* Top DOUBLED x2 Pill (y=[45..67], cleanly 12px above K card y_top=79.5!) */}
          <SvgPill
            x={260}
            y={56}
            w={116}
            h={22}
            bg="#ff595e"
            fg="#ffffff"
            fontSize={10.8}
            scale={easeOutBack(animT)}
            text={lang === 'ar' ? 'مدبّل ×2!' : 'DOUBLED x2!'}
          />

          {/* Center Doubled K of Hearts (y=[81..163]) */}
          <MiniPlayingCard
            x={260}
            y={122 + bob * 0.8}
            w={58}
            h={78}
            rank="K"
            suit="H"
            scale={easeOutBack(t)}
            highlight={true}
          />

          {/* Curved Attack Arrow to Victim + Vector Arrowhead */}
          <path
            d="M 294 120 Q 346 96 392 112"
            fill="none"
            stroke="#ff595e"
            strokeWidth="3.5"
            strokeDasharray="6 4"
            strokeDashoffset={-(clock * 28) % 20}
          />
          <polygon
            points="396,114 385,106 388,118"
            fill="#ff595e"
            stroke="#161426"
            strokeWidth="1.4"
          />

          {/* Victim Seat Right */}
          <SvgPlayerAvatar
            x={432}
            y={114}
            color="#ff595e"
            label={lang === 'ar' ? 'أكل الشيخ!' : 'Ate King!'}
            scale={0.84}
            suspect={true}
            clock={clock}
          />
          <SvgPill
            x={432}
            y={168}
            w={112}
            h={25}
            bg="#ff595e"
            fg="#ffffff"
            fontSize={11.5}
            scale={easeOutBack(animT)}
            text={lang === 'ar' ? 'يخسر -150!' : 'Takes -150!'}
          />

          <SvgScoreBadge
            x={260}
            y={212}
            w={370}
            bg="#ffca3a"
            animT={animT}
            clock={clock}
            text={
              lang === 'ar'
                ? 'التدبيل يقلب الطاولة بثوانٍ — فردي أو شراكة 2 ضد 2!'
                : 'Doubling flips the match — play Solo or 2v2 Partners!'
            }
          />
        </g>
      )}
    </StageBackdrop>
  );
};

/* ============================================================================
 * 17. MONOPOLY DELUXE (مونوبولي الشلّة — مدن العرب) — Pure Native SVG 4-Step Scene
 *     Zero Collisions, Exact 2+2=4 Hop Count, Continuous Clock Motion
 * ========================================================================== */
export const MonopolyTutorialScene: React.FC<TutorialSceneProps> = ({
  step,
  animT,
  clock,
  lang,
}) => {
  const t = easeOutCubic(animT);
  const bob = Math.sin(clock * 4.5) * 2.5;

  return (
    <StageBackdrop bg="#132a3a" accent="#10b981">
      {/* Top Banner */}
      <SvgPill
        x={260}
        y={23}
        w={445}
        h={25}
        bg="#ffca3a"
        fontSize={10.6}
        text={
          step === 0
            ? lang === 'ar'
              ? 'ارمِ النردين للتنقل بين المدن العربية — واقبض 200$ عند «انطلاق»!'
              : 'Roll 2 dice around Arab capitals — collect $200 passing GO!'
            : step === 1
            ? lang === 'ar'
              ? 'اشترِ صك المدينة فوراً — أو افتح مزاداً علنياً يزايد فيه الجميع!'
              : 'Buy an unowned City Deed — or trigger a live Auction for all!'
            : step === 2
            ? lang === 'ar'
              ? 'امتلك مدينتي اللون نفسه لمضاعفة الإيجار وبناء البيوت والفنادق!'
              : 'Own both cities of a color to double rent & build Houses/Hotels!'
            : lang === 'ar'
            ? 'بطاقات حظ، ضرائب، سجن، وصفقات تبادل العقارات لتصبح الأغنى!'
            : 'Chance cards, Jail, Tax Jackpot & 1-click Trades crown the Tycoon!'
        }
      />

      {/* Step 0: 5 Board Tiles + 2+2=4 Doubles Dice + 4-Space Hopping Pawn */}
      {step === 0 && (
        <g>
          {/* Two Vector Dice Showing 2 + 2 = 4 Doubles at y=58 */}
          {[
            { dx: 232, rot: -10 + Math.sin(clock * 5) * 4 },
            { dx: 282, rot: 12 - Math.sin(clock * 5) * 4 },
          ].map((die, idx) => (
            <g key={idx} transform={`translate(${die.dx}, 58) rotate(${die.rot})`}>
              <rect
                x="-13"
                y="-13"
                width="26"
                height="26"
                rx="6"
                fill="#fff9ec"
                stroke="#161426"
                strokeWidth="2.8"
              />
              <circle cx="-5.5" cy="-5.5" r="2.4" fill="#161426" />
              <circle cx="5.5" cy="5.5" r="2.4" fill="#161426" />
            </g>
          ))}
          <SvgPill
            x={398}
            y={58}
            w={168}
            h={23}
            bg="#8ac926"
            fontSize={10.4}
            text={lang === 'ar' ? 'دبل 2+2 = رمية إضافية!' : 'Doubles = Bonus Roll!'}
          />
          <SvgPill
            x={118}
            y={58}
            w={136}
            h={23}
            bg="#10b981"
            fg="#ffffff"
            fontSize={10.8}
            text={lang === 'ar' ? 'انطلاق +$200!' : 'Pass GO +$200!'}
          />

          {/* 5 Connected Board Spaces (y=[98..178]) */}
          {[
            { x: 96, ar: 'انطلاق', en: 'GO', price: '+$200', stripe: '#10b981' },
            { x: 178, ar: 'القاهرة', en: 'Cairo', price: '$80', stripe: '#92400e' },
            { x: 260, ar: 'بيروت', en: 'Beirut', price: '$130', stripe: '#00bbf9' },
            { x: 342, ar: 'دمشق', en: 'Damascus', price: '$160', stripe: '#f15bb5' },
            { x: 424, ar: 'دبي', en: 'Dubai', price: '$400', stripe: '#eab308' },
          ].map((sp) => (
            <g key={sp.en} transform={`translate(${sp.x}, 138)`}>
              <rect
                x="-37"
                y="-40"
                width="74"
                height="80"
                rx="10"
                fill="#fff9ec"
                stroke="#161426"
                strokeWidth="3"
              />
              <rect
                x="-37"
                y="-40"
                width="74"
                height="20"
                rx="8"
                fill={sp.stripe}
                stroke="#161426"
                strokeWidth="2.6"
              />
              <text
                x="0"
                y="3"
                textAnchor="middle"
                dominantBaseline="central"
                fill="#161426"
                fontSize="11.5"
                fontWeight="900"
              >
                {lang === 'ar' ? sp.ar : sp.en}
              </text>
              <text
                x="0"
                y="24"
                textAnchor="middle"
                dominantBaseline="central"
                fill="#3f3b5c"
                fontSize="10.5"
                fontWeight="800"
              >
                {sp.price}
              </text>
            </g>
          ))}

          {/* Moving Player Token Hopping Exactly 4 Spaces: GO (96) -> Dubai (424) */}
          <g
            transform={`translate(${lerp(96, 424, t)}, ${
              108 - Math.abs(Math.sin(t * Math.PI * 4)) * 12 + bob * 0.75
            })`}
          >
            <circle
              cx="0"
              cy="0"
              r="11.5"
              fill="#ff595e"
              stroke="#161426"
              strokeWidth="2.8"
            />
            <polygon points="-5,-3 0,-9 5,-3" fill="#ffca3a" />
          </g>

          <SvgPill
            x={260}
            y={212}
            w={385}
            h={24}
            bg="#161426"
            fg="#fff9ec"
            fontSize={10.8}
            text={
              lang === 'ar'
                ? 'كل لاعب يبدأ بـ $1,500 نقداً لبناء إمبراطوريته العقارية!'
                : 'Every player starts with $1,500 cash to build their empire!'
            }
          />
        </g>
      )}

      {/* Step 1: Title Deed Card vs Instant Live Auction (Zero Detached Pivot!) */}
      {step === 1 && (
        <g>
          {/* Left: Damascus Property Deed Card (x=[82..226], y=[54..182]) */}
          <g transform={`translate(154, ${118 + bob}) scale(${easeOutBack(animT)})`}>
            <rect
              x="-70"
              y="-62"
              width="140"
              height="124"
              rx="14"
              fill="#fff9ec"
              stroke="#161426"
              strokeWidth="3.5"
            />
            <rect
              x="-70"
              y="-62"
              width="140"
              height="32"
              rx="12"
              fill="#f15bb5"
              stroke="#161426"
              strokeWidth="3"
            />
            <text
              x="0"
              y="-45"
              textAnchor="middle"
              dominantBaseline="central"
              fill="#ffffff"
              fontSize="13"
              fontWeight="900"
            >
              {lang === 'ar' ? 'صك ملكية: دمشق' : 'DEED: DAMASCUS'}
            </text>
            <text
              x="0"
              y="-12"
              textAnchor="middle"
              dominantBaseline="central"
              fill="#161426"
              fontSize="16"
              fontWeight="900"
            >
              $160
            </text>
            <text
              x="0"
              y="14"
              textAnchor="middle"
              dominantBaseline="central"
              fill="#3f3b5c"
              fontSize="10.5"
              fontWeight="800"
            >
              {lang === 'ar' ? 'الإيجار الأساسي: $26' : 'Base Rent: $26'}
            </text>
            <text
              x="0"
              y="36"
              textAnchor="middle"
              dominantBaseline="central"
              fill="#15803d"
              fontSize="10.5"
              fontWeight="900"
            >
              {lang === 'ar' ? 'مع فندق ملكي: $560!' : 'With Hotel: $560!'}
            </text>
          </g>

          {/* Right Choice 1: Buy Immediately (Self-Contained Scale + Float) */}
          <g transform={`translate(0, ${bob * 0.5})`}>
            <SvgPill
              x={364}
              y={82}
              w={222}
              h={34}
              bg="#8ac926"
              fontSize={11.4}
              scale={easeOutBack(animT)}
              text={lang === 'ar' ? '1) شراء العقار فوراً ($160)' : '1) Buy Deed Now ($160)'}
            />
          </g>

          {/* Right Choice 2: Live Bidding Auction */}
          <g
            transform={`translate(364, ${146 - bob * 0.6}) scale(${easeOutBack(
              clamp01((animT - 0.1) * 1.2)
            )})`}
          >
            <rect
              x="-110"
              y="-26"
              width="220"
              height="52"
              rx="13"
              fill="#ffca3a"
              stroke="#161426"
              strokeWidth="3.2"
            />
            <text
              x="0"
              y="-7"
              textAnchor="middle"
              dominantBaseline="central"
              fill="#161426"
              fontSize="11.4"
              fontWeight="900"
            >
              {lang === 'ar' ? '2) أو طرحه بالمزاد العلني!' : '2) Or Start Live Auction!'}
            </text>
            <text
              x="0"
              y="12"
              textAnchor="middle"
              dominantBaseline="central"
              fill="#b91c1c"
              fontSize="10.8"
              fontWeight="900"
            >
              {lang === 'ar' ? 'مزايدة سريعة: $80 .. $110 .. $130!' : 'Bidding: $80 .. $110 .. $130!'}
            </text>
          </g>

          <SvgPill
            x={260}
            y={212}
            w={395}
            h={24}
            bg="#161426"
            fg="#fff9ec"
            fontSize={10.8}
            text={
              lang === 'ar'
                ? 'إذا تركت العقار يفتح مزاد حماسي ليخطفه أصحابك بسعر لقطة!'
                : 'Passing opens a fast bidding war so friends can snipe bargains!'
            }
          />
        </g>
      )}

      {/* Step 2: Color Pair Monopoly (2x Rent Badge) + Houses & Royal Hotel */}
      {step === 2 && (
        <g>
          {/* Connecting Pair Arc + 2x Rent Badge */}
          <path
            d="M 156 68 Q 260 38 364 68"
            fill="none"
            stroke="#ffca3a"
            strokeWidth="3.2"
            strokeDasharray="6 4"
            strokeDashoffset={-(clock * 22) % 20}
          />
          <SvgPill
            x={260}
            y={54}
            w={104}
            h={21}
            bg="#ffca3a"
            fontSize={10.2}
            scale={easeOutBack(animT)}
            text={lang === 'ar' ? 'إيجار مضاعف ×2!' : '2x PAIR RENT!'}
          />

          {/* City 1: Riyadh with 3 Green Vector Houses */}
          <g transform={`translate(156, ${126 + Math.sin(clock * 4) * 2})`}>
            <rect
              x="-68"
              y="-50"
              width="136"
              height="100"
              rx="14"
              fill="#fff9ec"
              stroke="#161426"
              strokeWidth="3.5"
            />
            <rect
              x="-68"
              y="-50"
              width="136"
              height="30"
              rx="12"
              fill="#10b981"
              stroke="#161426"
              strokeWidth="3"
            />
            {[-34, 0, 34].map((hx, i) => (
              <g
                key={i}
                transform={`translate(${hx}, -35) scale(${easeOutBack(
                  clamp01((animT - i * 0.1) * 1.3)
                )})`}
              >
                <polygon
                  points="-9,2 0,-7 9,2"
                  fill="#8ac926"
                  stroke="#161426"
                  strokeWidth="2"
                />
                <rect
                  x="-7"
                  y="2"
                  width="14"
                  height="9"
                  fill="#bbf7d0"
                  stroke="#161426"
                  strokeWidth="2"
                />
              </g>
            ))}
            <text
              x="0"
              y="-1"
              textAnchor="middle"
              dominantBaseline="central"
              fill="#161426"
              fontSize="14"
              fontWeight="900"
            >
              {lang === 'ar' ? 'الرياض' : 'Riyadh'}
            </text>
            <text
              x="0"
              y="24"
              textAnchor="middle"
              dominantBaseline="central"
              fill="#15803d"
              fontSize="11.4"
              fontWeight="900"
            >
              {lang === 'ar' ? '3 بيوت: إيجار $900!' : '3 Houses: $900 Rent!'}
            </text>
          </g>

          {/* City 2: Dubai with Royal Golden-Red Hotel */}
          <g transform={`translate(364, ${126 + Math.sin(clock * 4 + 1.6) * 2})`}>
            <rect
              x="-68"
              y="-50"
              width="136"
              height="100"
              rx="14"
              fill="#fff9ec"
              stroke="#161426"
              strokeWidth="3.5"
            />
            <rect
              x="-68"
              y="-50"
              width="136"
              height="30"
              rx="12"
              fill="#10b981"
              stroke="#161426"
              strokeWidth="3"
            />
            <g transform={`translate(0, -36) scale(${easeOutBack(animT)})`}>
              <polygon
                points="-15,2 0,-10 15,2"
                fill="#ff595e"
                stroke="#161426"
                strokeWidth="2.2"
              />
              <rect
                x="-12"
                y="2"
                width="24"
                height="11"
                fill="#ffca3a"
                stroke="#161426"
                strokeWidth="2.2"
              />
            </g>
            <text
              x="0"
              y="-1"
              textAnchor="middle"
              dominantBaseline="central"
              fill="#161426"
              fontSize="14"
              fontWeight="900"
            >
              {lang === 'ar' ? 'دبي' : 'Dubai'}
            </text>
            <text
              x="0"
              y="24"
              textAnchor="middle"
              dominantBaseline="central"
              fill="#b91c1c"
              fontSize="11.4"
              fontWeight="900"
            >
              {lang === 'ar' ? 'فندق ملكي: $1,500!' : 'Royal Hotel: $1,500!'}
            </text>
          </g>

          <SvgScoreBadge
            x={260}
            y={212}
            w={365}
            bg="#8ac926"
            animT={animT}
            clock={clock}
            text={
              lang === 'ar'
                ? 'كل لون مكون من مدينتين فقط لبناء سريع وحماسي!'
                : '2-city color sets unlock fast building & huge rents!'
            }
          />
        </g>
      )}

      {/* Step 3: Chance/Jail/Jackpot + 1-Click Trades + Wealth Tycoon */}
      {step === 3 && (
        <g>
          {[
            {
              x: 104,
              bg: '#fef3c7',
              badge: '#ff924c',
              t1Ar: 'حظ وخزنة الجائزة',
              t1En: 'Chance & Tax Pot',
              t2Ar: 'بطاقات، سجن وجاكبوت!',
              t2En: 'Cards, Jail & Pot!',
            },
            {
              x: 260,
              bg: '#e0f2fe',
              badge: '#00bbf9',
              t1Ar: 'صفقات تبادل فورية',
              t1En: '1-Click Trades',
              t2Ar: 'بادل المدن والكاش',
              t2En: 'Swap Deeds & Cash',
            },
            {
              x: 416,
              bg: '#dcfce7',
              badge: '#10b981',
              t1Ar: 'إمبراطور العقارات',
              t1En: 'Wealth Tycoon',
              t2Ar: 'أعلى ثروة يتوّج!',
              t2En: 'Highest Worth Wins!',
            },
          ].map((card, idx) => (
            <g
              key={card.t1En}
              transform={`translate(${card.x}, ${
                118 + Math.sin(clock * 4 + idx * 1.2) * 2.5
              }) scale(${easeOutBack(clamp01((animT - idx * 0.08) * 1.25))})`}
            >
              <rect
                x="-67"
                y="-48"
                width="134"
                height="96"
                rx="14"
                fill={card.bg}
                stroke="#161426"
                strokeWidth="3.2"
              />
              <circle
                cx="0"
                cy="-18"
                r="14"
                fill={card.badge}
                stroke="#161426"
                strokeWidth="2.6"
              />
              {idx === 0 ? (
                <text
                  x="0"
                  y="-17.5"
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="#161426"
                  fontSize="14"
                  fontWeight="900"
                >
                  $
                </text>
              ) : idx === 1 ? (
                <SvgDoubleArrow x={0} y={-18} color="#161426" />
              ) : (
                <polygon
                  points="-7,-15 -3,-24 0,-18 3,-24 7,-15"
                  fill="#ffca3a"
                  stroke="#161426"
                  strokeWidth="1.8"
                />
              )}
              <text
                x="0"
                y="10"
                textAnchor="middle"
                dominantBaseline="central"
                fill="#161426"
                fontSize="11"
                fontWeight="900"
              >
                {lang === 'ar' ? card.t1Ar : card.t1En}
              </text>
              <text
                x="0"
                y="29"
                textAnchor="middle"
                dominantBaseline="central"
                fill="#3f3b5c"
                fontSize="10"
                fontWeight="800"
              >
                {lang === 'ar' ? card.t2Ar : card.t2En}
              </text>
            </g>
          ))}

          <SvgScoreBadge
            x={260}
            y={212}
            w={365}
            bg="#ffca3a"
            animT={animT}
            clock={clock}
            text={
              lang === 'ar'
                ? 'وضع السهرة السريع (20 جولة) أو وضع الإفلاس المفتوح!'
                : 'Play Quick 20-Round Wealth Mode or Classic Last Standing!'
            }
          />
        </g>
      )}
    </StageBackdrop>
  );
};

/* ============================================================================
 * 18. SNAKES & LADDERS DELUXE (الحيّة والسلّم) — Pure Native SVG 4-Step Scene
 *     Zero Collisions, True Cubic Bezier Snake Slide, Bounce-Back Visual
 * ========================================================================== */
export const SnakesTutorialScene: React.FC<TutorialSceneProps> = ({
  step,
  animT,
  clock,
  lang,
}) => {
  const t = easeOutCubic(animT);
  const bob = Math.sin(clock * 5) * 2.5;

  // Cubic Bezier evaluation for Step 2 snake slide: P0=(132,74), P1=(190,80), P2=(116,150), P3=(174,160)
  const invT = 1 - t;
  const snakeSlideX =
    invT * invT * invT * 132 +
    3 * invT * invT * t * 190 +
    3 * invT * t * t * 116 +
    t * t * t * 174;
  const snakeSlideY =
    invT * invT * invT * 74 +
    3 * invT * invT * t * 80 +
    3 * invT * t * t * 150 +
    t * t * t * 160;

  return (
    <StageBackdrop bg="#1b264f" accent="#22c55e">
      {/* Top Rule Banner */}
      <SvgPill
        x={260}
        y={23}
        w={445}
        h={25}
        bg="#ffca3a"
        fontSize={10.8}
        text={
          step === 0
            ? lang === 'ar'
              ? 'ابدأ من المربع 1 وارمِ النرد للتقدم — الرقم 6 يمنحك رمية إضافية!'
              : 'Start at Square 1 & roll to advance — a 6 grants a bonus roll!'
            : step === 1
            ? lang === 'ar'
              ? 'الوقوف أسفل «سلّم» يطير بك فوراً إلى قمته ويختصر الطريق!'
              : 'Land at the base of a Ladder to zip straight up to its top!'
            : step === 2
            ? lang === 'ar'
              ? 'رأس الثعبان يزحلقك لذيله — إلا إذا حميت نفسك بدرع الشلّة!'
              : 'Snake heads slide you down — unless blocked by a Party Shield!'
            : lang === 'ar'
            ? 'ادخل المربع 100 بالرقم المضبوط للفوز — واحذر كوبرا الـ 99!'
            : 'Hit Square 100 on the exact roll to win — beware the 99 Cobra!'
        }
      />

      {/* Step 0: Rolling a 6 + Hopping Squares 1 -> 7 */}
      {step === 0 && (
        <g>
          {/* Bouncing Die Showing 6 at (182, 68) + Bonus Badge at (318, 68) */}
          <g transform={`translate(182, ${68 + bob}) rotate(${Math.sin(clock * 4) * 6})`}>
            <rect
              x="-18"
              y="-18"
              width="36"
              height="36"
              rx="8"
              fill="#fff9ec"
              stroke="#161426"
              strokeWidth="3.2"
            />
            {[-8, 8].map((px) =>
              [-9, 0, 9].map((py) => (
                <circle key={`${px}_${py}`} cx={px} cy={py} r="2.6" fill="#e63946" />
              ))
            )}
          </g>
          <SvgPill
            x={318}
            y={68}
            w={195}
            h={26}
            bg="#8ac926"
            fontSize={11.2}
            scale={easeOutBack(animT)}
            text={lang === 'ar' ? 'جبت 6 = رمية إضافية!' : 'Rolled 6 = Bonus Roll!'}
          />

          {/* Row of Squares 1..7 */}
          {[1, 2, 3, 4, 5, 6, 7].map((sq, idx) => {
            const sx = 76 + idx * 61;
            const bgCols = ['#dcfce7', '#fff9ec', '#bae6fd', '#fde68a', '#fbcfe8', '#fed7aa', '#bbf7d0'];
            return (
              <g key={sq} transform={`translate(${sx}, 144)`}>
                <rect
                  x="-27"
                  y="-27"
                  width="54"
                  height="54"
                  rx="10"
                  fill={bgCols[idx]}
                  stroke="#161426"
                  strokeWidth="3"
                />
                <text
                  x="0"
                  y="11"
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="#161426"
                  fontSize="14"
                  fontWeight="900"
                >
                  {sq}
                </text>
              </g>
            );
          })}

          {/* Hopping Player Pawn from Square 1 (76) -> Square 7 (442) + Idle Bob */}
          <g
            transform={`translate(${lerp(76, 442, t)}, ${
              126 - Math.abs(Math.sin(t * Math.PI * 6)) * 16 + (t >= 0.98 ? bob * 0.8 : 0)
            })`}
          >
            <circle
              cx="0"
              cy="0"
              r="12"
              fill="#00bbf9"
              stroke="#161426"
              strokeWidth="3"
            />
            <circle cx="0" cy="-4" r="3.8" fill="#fff9ec" />
          </g>

          <SvgPill
            x={260}
            y={212}
            w={370}
            h={24}
            bg="#161426"
            fg="#fff9ec"
            fontSize={10.8}
            text={
              lang === 'ar'
                ? 'سباق حماسي من 1 إلى 100 حتى 10 لاعبين أونلاين!'
                : 'Thrilling 1-to-100 board race for up to 10 players!'
            }
          />
        </g>
      )}

      {/* Step 1: Climbing Golden Wooden Ladder (Square 13 -> Square 46, Zero Digit Overlap!) */}
      {step === 1 && (
        <g>
          {/* Base Tile 13 (x=152, y=158, 76x54 -> '13' safely at bottom-left (-22, 16)) */}
          <g transform="translate(152, 158)">
            <rect
              x="-38"
              y="-27"
              width="76"
              height="54"
              rx="11"
              fill="#fde68a"
              stroke="#161426"
              strokeWidth="3.2"
            />
            <text
              x="-21"
              y="14"
              textAnchor="middle"
              dominantBaseline="central"
              fill="#161426"
              fontSize="12.5"
              fontWeight="900"
            >
              13
            </text>
          </g>

          {/* Top Tile 46 (x=368, y=72, 76x54 -> '46' safely at bottom-right (22, 14)!) */}
          <g transform="translate(368, 72)">
            <rect
              x="-38"
              y="-27"
              width="76"
              height="54"
              rx="11"
              fill="#bbf7d0"
              stroke="#161426"
              strokeWidth="3.2"
            />
            <text
              x="22"
              y="14"
              textAnchor="middle"
              dominantBaseline="central"
              fill="#161426"
              fontSize="12.5"
              fontWeight="900"
            >
              46
            </text>
          </g>

          {/* Angled Golden Wooden Ladder Connecting (158, 154) -> (356, 68) */}
          <g>
            <line
              x1="152"
              y1="145"
              x2="350"
              y2="59"
              stroke="#d97706"
              strokeWidth="6.5"
              strokeLinecap="round"
            />
            <line
              x1="164"
              y1="163"
              x2="362"
              y2="77"
              stroke="#d97706"
              strokeWidth="6.5"
              strokeLinecap="round"
            />
            {[0.18, 0.36, 0.54, 0.72, 0.9].map((rt, i) => (
              <line
                key={i}
                x1={lerp(152, 350, rt)}
                y1={lerp(145, 59, rt)}
                x2={lerp(164, 362, rt)}
                y2={lerp(163, 77, rt)}
                stroke="#161426"
                strokeWidth="3.4"
                strokeLinecap="round"
              />
            ))}
          </g>

          {/* Player Pawn Zipping Up the Ladder to (356, 68) — 11px Clear of '46' at (390, 86)! */}
          <g
            transform={`translate(${lerp(158, 356, t)}, ${
              lerp(154, 68, t) + (t >= 0.98 ? bob * 0.8 : 0)
            })`}
          >
            <circle
              cx="0"
              cy="0"
              r="13"
              fill="#ffca3a"
              stroke="#161426"
              strokeWidth="3.2"
            />
            <polygon points="-5.5,-3.5 0,-10 5.5,-3.5" fill="#ff595e" />
          </g>

          <SvgScoreBadge
            x={260}
            y={212}
            w={345}
            bg="#8ac926"
            animT={animT}
            clock={clock}
            text={
              lang === 'ar'
                ? 'سلّم ذهبي! قفزة عملاقة من 13 إلى 46!'
                : 'Golden Ladder! Giant leap from 13 to 46!'
            }
          />
        </g>
      )}

      {/* Step 2: Cubic Bezier Snake Slide vs Party Shield Protection (Zero Overlap!) */}
      {step === 2 && (
        <g>
          {/* Left Panel: Snake Sliding Pawn Along S-Curve from 56 -> 34 */}
          <g>
            <rect
              x="54"
              y="50"
              width="202"
              height="136"
              rx="16"
              fill="rgba(255,255,255,0.07)"
              stroke="rgba(255,255,255,0.18)"
              strokeWidth="2"
            />
            {/* Non-Overlapping Number Pills Outside Snake Endpoints */}
            <SvgPill x={86} y={74} w={46} h={22} bg="#ffe4e6" fontSize={11} text="56" />
            <SvgPill x={220} y={162} w={46} h={22} bg="#fde68a" fontSize={11} text="34" />

            {/* Sinuous Green Snake (Head at 132,74 -> Tail at 174,160) */}
            <path
              d="M 132 74 C 190 80 116 150 174 160"
              fill="none"
              stroke="#161426"
              strokeWidth="13"
              strokeLinecap="round"
            />
            <path
              d="M 132 74 C 190 80 116 150 174 160"
              fill="none"
              stroke="#22c55e"
              strokeWidth="8"
              strokeLinecap="round"
            />
            {/* Snake Head + Animated Flicking Tongue Pointing Rightward */}
            <circle cx="132" cy="74" r="9" fill="#22c55e" stroke="#161426" strokeWidth="2.8" />
            <circle cx="134" cy="71.5" r="2" fill="#161426" />
            <g transform={`translate(${141 + Math.sin(clock * 8) * 1.5}, 74)`}>
              <path d="M 0 0 L 7 -3 M 0 0 L 7 3" stroke="#ff595e" strokeWidth="2" strokeLinecap="round" />
            </g>

            {/* Pawn Following True Cubic Bezier Curve + Idle Bob at Tail */}
            <circle
              cx={snakeSlideX}
              cy={snakeSlideY + (t >= 0.98 ? bob * 0.7 : 0)}
              r="10"
              fill="#ff595e"
              stroke="#161426"
              strokeWidth="2.8"
            />
          </g>

          {/* Right Panel: Party Power Shield Blocking Bite */}
          <g transform={`translate(371, ${118 + bob * 0.7})`}>
            <rect
              x="-96"
              y="-68"
              width="192"
              height="136"
              rx="16"
              fill="#191636"
              stroke="#00bbf9"
              strokeWidth="3"
            />
            <path
              d="M 0 -46 L 28 -34 V -8 C 28 12 14 24 0 30 C -14 24 -28 12 -28 -8 V -34 Z"
              fill="#00bbf9"
              stroke="#161426"
              strokeWidth="3.2"
              strokeLinejoin="round"
            />
            <SvgCheckMark x={0} y={-10} size={1.15} color="#161426" />
            <text
              x="0"
              y="48"
              textAnchor="middle"
              dominantBaseline="central"
              fill="#ffca3a"
              fontSize="11.2"
              fontWeight="900"
            >
              {lang === 'ar' ? 'درع الشلّة يصد اللدغة!' : 'Party Shield Blocks Bite!'}
            </text>
          </g>

          <SvgPill
            x={260}
            y={212}
            w={395}
            h={24}
            bg="#161426"
            fg="#fff9ec"
            fontSize={10.8}
            text={
              lang === 'ar'
                ? 'يمكنك اللعب بالنظام الكلاسيكي أو تفعيل مربعات الأكشن والدروع!'
                : 'Play Classic Pure mode or enable Party Rockets, Swaps & Shields!'
            }
          />
        </g>
      )}

      {/* Step 3: Exact 100 Finish Crown + Overshoot Bounce-Back to Hooded 99 Cobra */}
      {step === 3 && (
        <g>
          {[
            { sq: 96, x: 96, bg: '#fff9ec' },
            { sq: 97, x: 178, bg: '#bae6fd' },
            { sq: 98, x: 260, bg: '#dcfce7' },
            { sq: 99, x: 342, bg: '#ffe4e6' },
            { sq: 100, x: 424, bg: '#ffca3a' },
          ].map((tile) => (
            <g key={tile.sq} transform={`translate(${tile.x}, 118)`}>
              <rect
                x="-36"
                y="-36"
                width="72"
                height="72"
                rx="12"
                fill={tile.bg}
                stroke="#161426"
                strokeWidth="3.4"
              />
              <text
                x="0"
                y={tile.sq >= 99 ? 16 : 4}
                textAnchor="middle"
                dominantBaseline="central"
                fill="#161426"
                fontSize="15"
                fontWeight="900"
              >
                {tile.sq}
              </text>

              {/* Pulsing Flared Hooded King Cobra on 99 */}
              {tile.sq === 99 && (
                <g transform={`translate(0, -12) scale(${1 + Math.sin(clock * 6) * 0.06})`}>
                  <ellipse
                    cx="0"
                    cy="1"
                    rx="15.5"
                    ry="8.5"
                    fill="#e63946"
                    stroke="#161426"
                    strokeWidth="2.4"
                  />
                  <circle
                    cx="0"
                    cy="0"
                    r="9.5"
                    fill="#ff595e"
                    stroke="#161426"
                    strokeWidth="2.4"
                  />
                  <circle cx="-3.5" cy="-1.5" r="1.9" fill="#ffca3a" />
                  <circle cx="3.5" cy="-1.5" r="1.9" fill="#ffca3a" />
                  <path d="M 0 9.5 L -2.5 14 M 0 9.5 L 2.5 14" stroke="#e63946" strokeWidth="1.8" />
                </g>
              )}

              {/* Royal Winner Crown on 100 */}
              {tile.sq === 100 && (
                <polygon
                  points="-16,-5 -9,-20 0,-11 9,-20 16,-5"
                  fill="#fff9ec"
                  stroke="#161426"
                  strokeWidth="2.6"
                  strokeLinejoin="round"
                />
              )}
            </g>
          ))}

          {/* Animated Red Bounce-Back Warning Arc Underneath 100 -> 99 (y=[160..178], Clear of ScoreBadge!) */}
          <path
            d="M 424 160 Q 383 180 344 160"
            fill="none"
            stroke="#ff595e"
            strokeWidth="2.8"
            strokeDasharray="5 4"
            strokeDashoffset={-(clock * 22) % 18}
          />
          <polygon
            points="341,158 351,158 347,166"
            fill="#ff595e"
            stroke="#161426"
            strokeWidth="1.2"
          />

          {/* Winning Pawn Landing Precisely on 100 (Safe 7.5px Clearance Below Top Banner!) */}
          <g
            transform={`translate(${lerp(260, 424, t)}, ${
              73 - Math.sin(t * Math.PI) * 13 + (t > 0.95 ? bob * 0.8 : 0)
            })`}
          >
            <circle
              cx="0"
              cy="0"
              r="12.5"
              fill="#8ac926"
              stroke="#161426"
              strokeWidth="3"
            />
            <SvgCheckMark x={0} y={0} size={0.85} color="#161426" />
          </g>

          <SvgScoreBadge
            x={260}
            y={212}
            w={425}
            bg="#ffca3a"
            animT={animT}
            clock={clock}
            text={
              lang === 'ar'
                ? 'بالرقم المضبوط للـ 100 تفوز — والزيادة ترتد للـ 99!'
                : 'Exact 100 wins — overshooting bounces back to 99!'
            }
          />
        </g>
      )}
    </StageBackdrop>
  );
};
