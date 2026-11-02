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
  easeOutBack,
  clamp01,
} from './TutorialSvgPrimitives';

/* ============================================================================
 * 19. SKULL & ROSES (الجمجمة والورد) — Pure Native SVG 4-Step Scene (520x240)
 * ========================================================================== */
const SvgDiscToken: React.FC<{
  x: number;
  y: number;
  r?: number;
  kind: 'back' | 'rose' | 'skull';
  color?: string;
  scale?: number;
  highlight?: boolean;
}> = ({ x, y, r = 22, kind, color = '#9b5de5', scale = 1, highlight = false }) => (
  <g transform={`translate(${x}, ${y}) scale(${scale})`}>
    <circle cx="0" cy="3.5" r={r} fill="#120f29" />
    {kind === 'back' && (
      <g>
        <circle
          cx="0"
          cy="0"
          r={r}
          fill={color}
          stroke={highlight ? '#ffca3a' : '#161426'}
          strokeWidth={highlight ? '3.5' : '2.8'}
        />
        <circle
          cx="0"
          cy="0"
          r={r * 0.72}
          fill="none"
          stroke="#fff9ec"
          strokeWidth="1.8"
          strokeDasharray="3 3"
        />
        <polygon
          points={`0,${-r * 0.4} ${r * 0.4},0 0,${r * 0.4} ${-r * 0.4},0`}
          fill="#ffca3a"
          stroke="#161426"
          strokeWidth="1.8"
        />
      </g>
    )}
    {kind === 'rose' && (
      <g>
        <circle
          cx="0"
          cy="0"
          r={r}
          fill="#fff1f2"
          stroke={highlight ? '#8ac926' : '#161426'}
          strokeWidth={highlight ? '3.5' : '2.8'}
        />
        <circle cx="0" cy="0" r={r * 0.52} fill="#e11d48" stroke="#161426" strokeWidth="2.2" />
        <circle cx="0" cy="0" r={r * 0.24} fill="#fda4af" />
      </g>
    )}
    {kind === 'skull' && (
      <g>
        <circle
          cx="0"
          cy="0"
          r={r}
          fill="#191636"
          stroke="#ff595e"
          strokeWidth="3.5"
        />
        <path
          d={`M ${-r * 0.42} ${-r * 0.12} C ${-r * 0.42} ${-r * 0.55} ${r * 0.42} ${-r * 0.55} ${r * 0.42} ${-r * 0.12} C ${r * 0.42} ${r * 0.12} ${r * 0.28} ${r * 0.22} ${r * 0.22} ${r * 0.42} L ${-r * 0.22} ${r * 0.42} C ${-r * 0.28} ${r * 0.22} ${-r * 0.42} ${r * 0.12} ${-r * 0.42} ${-r * 0.12} Z`}
          fill="#fff9ec"
          stroke="#161426"
          strokeWidth="2"
        />
        <circle cx={-r * 0.16} cy={-r * 0.1} r="2.3" fill="#e11d48" />
        <circle cx={r * 0.16} cy={-r * 0.1} r="2.3" fill="#e11d48" />
      </g>
    )}
  </g>
);

export const SkullTutorialScene: React.FC<TutorialSceneProps> = ({
  step,
  animT,
  clock,
  lang,
}) => {
  const ar = lang === 'ar';
  const pulse = 1 + Math.sin(clock * 4.5) * 0.04;
  const bob = Math.sin(clock * 3.2) * 2.5;
  const b = easeOutBack(animT);

  return (
    <StageBackdrop accent="#e11d48">
      {step === 0 && (
        <g>
          <SvgPill
            x={260}
            y={25}
            w={410}
            h={27}
            bg="#ffe4e6"
            text={
              ar
                ? 'لكل لاعب 4 أقراص سرية: 3 ورود آمنة وجمجمة قاتلة!'
                : 'Each player holds 4 secret discs: 3 safe Roses & 1 Skull!'
            }
          />
          <SvgPlayerAvatar x={95} y={118} color="#00bbf9" label={ar ? 'نور' : 'Noor'} clock={clock} />
          {[
            { x: 205, kind: 'rose' as const, label: ar ? 'وردة 1' : 'Rose 1' },
            { x: 280, kind: 'rose' as const, label: ar ? 'وردة 2' : 'Rose 2' },
            { x: 355, kind: 'rose' as const, label: ar ? 'وردة 3' : 'Rose 3' },
            { x: 435, kind: 'skull' as const, label: ar ? 'فخ الجمجمة' : 'Skull Trap' },
          ].map((item, idx) => {
            const st = clamp01((animT - idx * 0.1) / 0.65);
            const sc = easeOutBack(st);
            return (
              <g key={idx}>
                <SvgDiscToken
                  x={item.x}
                  y={114 + (idx === 3 ? bob : 0)}
                  r={24}
                  kind={item.kind}
                  scale={sc * (idx === 3 ? pulse : 1)}
                  highlight={idx === 3}
                />
                <SvgPill
                  x={item.x}
                  y={156}
                  w={70}
                  h={21}
                  bg={idx === 3 ? '#ff595e' : '#191636'}
                  fg="#fff9ec"
                  fontSize={9.8}
                  text={item.label}
                />
              </g>
            );
          })}
          <SvgPill
            x={260}
            y={212}
            w={410}
            h={27}
            bg="#191636"
            fg="#ffca3a"
            text={
              ar
                ? 'ضع قرصاً مقلوباً أمامك بالسر: هل تزرع وردة أم جمجمة؟'
                : 'Place 1 disc face-down on your mat: Rose or Skull trap?'
            }
          />
        </g>
      )}

      {step === 1 && (
        <g>
          <SvgPill
            x={260}
            y={25}
            w={430}
            h={27}
            bg="#ffca3a"
            text={
              ar
                ? 'في دورك: أضف قرصاً مقلوباً أو افتح باب المزايدة والتحدي!'
                : 'On your turn: stack another disc OR launch the Bidding Challenge!'
            }
          />
          {[
            { x: 115, name: ar ? 'نور' : 'Noor', col: '#00bbf9', count: 2, bid: ar ? 'أقلب 2!' : 'Bid: 2!' },
            { x: 260, name: ar ? 'سارة' : 'Sara', col: '#9b5de5', count: 1, bid: ar ? 'أعلّي: 3!' : 'Raise: 3!' },
            { x: 405, name: ar ? 'رامي' : 'Rami', col: '#ff924c', count: 1, bid: ar ? 'انسحاب (Pass)' : 'Pass' },
          ].map((p, i) => (
            <g key={i}>
              <SvgPlayerAvatar x={p.x} y={88} color={p.col} label={p.name} highlight={i === 1} clock={clock} />
              <SvgDiscToken x={p.x - (p.count > 1 ? 9 : 0)} y={145} r={17} kind="back" color={p.col} />
              {p.count > 1 && (
                <SvgDiscToken x={p.x + 10} y={142} r={17} kind="back" color={p.col} highlight />
              )}
              <SvgPill
                x={p.x}
                y={178}
                w={105}
                h={23}
                bg={i === 1 ? '#8ac926' : i === 2 ? '#334155' : '#ffca3a'}
                fg={i === 2 ? '#fff9ec' : '#161426'}
                fontSize={10}
                scale={b * (i === 1 ? pulse : 1)}
                text={p.bid}
              />
            </g>
          ))}
          <SvgPill
            x={260}
            y={214}
            w={415}
            h={26}
            bg="#191636"
            fg="#fff9ec"
            text={
              ar
                ? 'سارة صاحبة أعلى مزايدة (3 أقراص) — حان وقت الكشف!'
                : 'Sara wins the auction at 3 discs — time to flip!'
            }
          />
        </g>
      )}

      {step === 2 && (
        <g>
          <SvgPill
            x={260}
            y={25}
            w={445}
            h={27}
            bg="#ff924c"
            text={
              ar
                ? 'القانون الذهبي: مجبور تقلب كل أقراصك أنت أولاً قبل غيرك!'
                : 'Golden Rule: You MUST flip all of your OWN discs first!'
            }
          />
          <SvgPlayerAvatar x={125} y={96} color="#9b5de5" label={ar ? '1. أقراصك أولاً' : '1. Own First'} highlight clock={clock} />
          <SvgDiscToken x={125} y={160} r={22} kind="rose" scale={b} highlight />
          <SvgCheckMark x={152} y={144} size={1.1} />

          <SvgDoubleArrow x={225} y={128} color="#ffca3a" />

          <SvgPlayerAvatar x={315} y={96} color="#00bbf9" label={ar ? '2. قرص نور' : '2. Noor Disc'} clock={clock} />
          <SvgDiscToken x={315} y={160} r={22} kind="rose" scale={b} highlight />

          <SvgPlayerAvatar x={425} y={96} color="#ff924c" label={ar ? '3. قرص رامي؟' : '3. Rami Disc?'} suspect clock={clock} />
          <SvgDiscToken x={425} y={160 + bob} r={22} kind="back" color="#ff924c" scale={pulse} highlight />

          <SvgPill
            x={260}
            y={212}
            w={430}
            h={27}
            bg="#191636"
            fg="#ffca3a"
            text={
              ar
                ? 'إذا نصبت جمجمة لتغري خصمك وما حدا زايد عليك... رح تنفجر فيك!'
                : 'Plant a Skull & if nobody outbids you, you flip your own Skull!'
            }
          />
        </g>
      )}

      {step === 3 && (
        <g>
          <SvgPill
            x={260}
            y={25}
            w={435}
            h={27}
            bg="#8ac926"
            text={
              ar
                ? 'كلها ورود = نقطة فوز! (أو جمجمة = خسارة قرص من يدك!)'
                : 'All Roses = +1 Win Point! (Hit a Skull = Lose 1 Disc!)'
            }
          />
          <rect x="42" y="58" width="205" height="126" rx="14" fill="#191636" stroke="#8ac926" strokeWidth="3.2" />
          <SvgDiscToken x={95} y={102} r={19} kind="rose" highlight />
          <SvgDiscToken x={144} y={102} r={19} kind="rose" highlight />
          <SvgDiscToken x={193} y={102} r={19} kind="rose" highlight />
          <SvgScoreBadge
            x={144}
            y={156}
            w={180}
            text={ar ? '+1 نقطة (نقطتان للفوز!)' : '+1 Mat (2 Wins Match!)'}
            bg="#8ac926"
            animT={animT}
            clock={clock}
          />

          <rect x="273" y="58" width="205" height="126" rx="14" fill="#191636" stroke="#ff595e" strokeWidth="3.2" />
          <SvgDiscToken x={375} y={102 + bob} r={24} kind="skull" scale={pulse} />
          <SvgScoreBadge
            x={375}
            y={156}
            w={180}
            text={ar ? 'انفجرت الجمجمة! (-1 قرص)' : 'Skull Boom! (-1 Disc)'}
            bg="#ff595e"
            fg="#fff9ec"
            animT={animT}
            clock={clock}
          />

          <SvgPill
            x={260}
            y={212}
            w={415}
            h={27}
            bg="#8ac926"
            text={
              ar
                ? 'أول لاعب يحقق نقطتي فوز ياخد التاج!'
                : 'First player to score 2 Challenge Points wins the crown!'
            }
          />
        </g>
      )}
    </StageBackdrop>
  );
};

/* ============================================================================
 * 20. SHERIFF OF NOTTINGHAM (مهرّب الجمارك) — Pure Native SVG 4-Step Scene
 * ========================================================================== */
const SvgSuitcaseCard: React.FC<{
  x: number;
  y: number;
  scale?: number;
}> = ({ x, y, scale = 1 }) => (
  <g transform={`translate(${x}, ${y}) scale(${scale})`}>
    <rect x="-48" y="-26" width="96" height="58" rx="10" fill="#120f29" />
    <path
      d="M -18 -30 V -39 A 5 5 0 0 1 -13 -44 H 13 A 5 5 0 0 1 18 -39 V -30"
      fill="none"
      stroke="#161426"
      strokeWidth="4.5"
    />
    <rect
      x="-48"
      y="-30"
      width="96"
      height="58"
      rx="10"
      fill="#b45309"
      stroke="#161426"
      strokeWidth="3.2"
    />
    <rect x="-28" y="-30" width="9" height="58" fill="#fbbf24" stroke="#161426" strokeWidth="2.2" />
    <rect x="19" y="-30" width="9" height="58" fill="#fbbf24" stroke="#161426" strokeWidth="2.2" />
    <circle cx="0" cy="-1" r="10" fill="#ffca3a" stroke="#161426" strokeWidth="2.5" />
  </g>
);

export const SheriffTutorialScene: React.FC<TutorialSceneProps> = ({
  step,
  animT,
  clock,
  lang,
}) => {
  const ar = lang === 'ar';
  const pulse = 1 + Math.sin(clock * 4.5) * 0.04;
  const bob = Math.sin(clock * 3.5) * 2.5;
  const b = easeOutBack(animT);

  return (
    <StageBackdrop accent="#d97706">
      {step === 0 && (
        <g>
          <SvgPill
            x={260}
            y={25}
            w={430}
            h={27}
            bg="#fef3c7"
            text={
              ar
                ? 'ضع 3 بضائع بالسر في شنطتك: نظامية آمنة أم مهربات غالية؟'
                : 'Secretly pack 3 goods in your bag: Legal or Contraband?'
            }
          />
          <SvgSuitcaseCard x={135} y={122} scale={b} />
          <SvgDoubleArrow x={215} y={120} color="#ffca3a" />
          {[
            { x: 290, title: ar ? 'تفاح (+4)' : 'Apple (+4)', sub: ar ? 'نظامي' : 'Legal', col: '#8ac926' },
            { x: 370, title: ar ? 'ألماس (+15)' : 'Diamond (+15)', sub: ar ? 'مهرّبات!' : 'Contraband!', col: '#ff595e' },
            { x: 450, title: ar ? 'حرير (+12)' : 'Silk (+12)', sub: ar ? 'مهرّبات!' : 'Contraband!', col: '#9b5de5' },
          ].map((g, i) => (
            <g key={i} transform={`translate(${g.x}, ${120 + (i > 0 ? bob : 0)}) scale(${b})`}>
              <rect
                x="-34"
                y="-38"
                width="68"
                height="76"
                rx="10"
                fill="#fff9ec"
                stroke={g.col}
                strokeWidth="3.2"
              />
              <circle cx="0" cy="-11" r="12" fill={g.col} stroke="#161426" strokeWidth="2.4" />
              <text x="0" y="15" textAnchor="middle" fill="#161426" fontSize="9.5" fontWeight="900">
                {g.title}
              </text>
              <text x="0" y="29" textAnchor="middle" fill={g.col} fontSize="9" fontWeight="900">
                {g.sub}
              </text>
            </g>
          ))}
          <SvgPill
            x={260}
            y={212}
            w={420}
            h={27}
            bg="#191636"
            fg="#ffca3a"
            text={
              ar
                ? 'المهربات تعطي نقاطاً مضاعفة إذا مرّت بدون تفتيش!'
                : 'Contraband scores huge points if it slips past inspection!'
            }
          />
        </g>
      )}

      {step === 1 && (
        <g>
          <SvgPill
            x={260}
            y={25}
            w={430}
            h={27}
            bg="#ffca3a"
            text={
              ar
                ? 'أعلن بضاعة نظامية، واعرض رشوة ذهبية لإغراء الضابط!'
                : 'Declare a legal good & offer a Gold Bribe to tempt the Officer!'
            }
          />
          <SvgPlayerAvatar x={95} y={118} color="#00bbf9" label={ar ? 'المسافر' : 'Merchant'} clock={clock} />
          <SvgSuitcaseCard x={235} y={128} scale={pulse} />
          <SvgPill
            x={235}
            y={74}
            w={185}
            h={25}
            bg="#fff9ec"
            fontSize={10.5}
            text={ar ? '«والله بشنطتي 3 تفاحات!»' : '"Just 3 Apples inside!"'}
          />
          <SvgScoreBadge
            x={410}
            y={124}
            w={170}
            text={ar ? 'رشوة: +10 ذهب!' : 'Bribe: +10 Gold!'}
            bg="#ffca3a"
            animT={animT}
            clock={clock}
          />
          <SvgPill
            x={260}
            y={212}
            w={425}
            h={27}
            bg="#191636"
            fg="#fff9ec"
            text={
              ar
                ? 'ممكن تعرض رشوة وأنت صادق لتطمع الضابط يفتشك ويدفعلك تعويض!'
                : 'Bluff or reverse-bait the Officer into opening an honest bag!'
            }
          />
        </g>
      )}

      {step === 2 && (
        <g>
          <SvgPill
            x={260}
            y={25}
            w={435}
            h={27}
            bg="#ff924c"
            text={
              ar
                ? 'ضابط الجمارك يختار: يقبل الرشوة ويمرّقك أم يفتش الشنطة؟'
                : 'Customs Officer decides: Accept Bribe & Pass OR Inspect Bag!'
            }
          />
          <SvgPlayerAvatar x={260} y={86} color="#ffca3a" label={ar ? 'ضابط الجمارك' : 'Officer'} crown highlight clock={clock} />
          <SvgPill
            x={145}
            y={162}
            w={185}
            h={34}
            bg="#8ac926"
            scale={b * pulse}
            text={ar ? 'تمرير الشنطة + قبض الرشوة' : 'Pass Bag + Take Bribe'}
          />
          <SvgPill
            x={375}
            y={162}
            w={185}
            h={34}
            bg="#ff595e"
            fg="#fff9ec"
            scale={b * pulse}
            text={ar ? 'فتح وتفتيش الشنطة!' : 'Open & Inspect Bag!'}
          />
          <SvgPill
            x={260}
            y={212}
            w={415}
            h={27}
            bg="#191636"
            fg="#ffca3a"
            text={
              ar
                ? 'قرار واحد يفصل بين الغنيمة الكبرى أو المصادرة والغرامة!'
                : 'One decision separates a massive haul from confiscation!'
            }
          />
        </g>
      )}

      {step === 3 && (
        <g>
          <SvgPill
            x={260}
            y={25}
            w={430}
            h={27}
            bg="#8ac926"
            text={
              ar
                ? 'نتيجة التفتيش: كشف المهربات أو تعويض البريء المظلوم!'
                : 'Inspection Outcome: Catch Smugglers or Pay Honest Merchants!'
            }
          />
          <rect x="38" y="58" width="210" height="126" rx="14" fill="#191636" stroke="#ff595e" strokeWidth="3.2" />
          <SvgPill
            x={143}
            y={92}
            w={180}
            h={25}
            bg="#ff595e"
            fg="#fff9ec"
            fontSize={10.2}
            text={ar ? 'طلع كذّاب ومهرّب ألماس!' : 'Caught Smuggling Diamonds!'}
          />
          <SvgPill
            x={143}
            y={140}
            w={188}
            h={25}
            bg="#fff9ec"
            fontSize={10}
            text={ar ? 'مصادرة المهربات + غرامة للضابط' : 'Confiscated + Fine to Officer'}
          />

          <rect x="272" y="58" width="210" height="126" rx="14" fill="#191636" stroke="#8ac926" strokeWidth="3.2" />
          <SvgPill
            x={377}
            y={92}
            w={180}
            h={25}
            bg="#8ac926"
            fontSize={10.2}
            text={ar ? 'طلع صادق (3 تفاحات فعلاً!)' : '100% Honest (3 Apples!)'}
          />
          <SvgPill
            x={377}
            y={140}
            w={188}
            h={25}
            bg="#ffca3a"
            fontSize={10}
            text={ar ? 'الضابط يدفع له تعويض +12 ذهب!' : 'Officer pays +12 Gold Penalty!'}
          />

          <SvgPill
            x={260}
            y={212}
            w={415}
            h={27}
            bg="#8ac926"
            text={
              ar
                ? 'يتناوب الجميع على دور الضابط، وأغنى تاجر في النهاية يفوز!'
                : 'Everyone takes a turn as Officer — richest merchant wins!'
            }
          />
        </g>
      )}
    </StageBackdrop>
  );
};

/* ============================================================================
 * 21. CASH 'N GUNS (قسمة العصابة) — Pure Native SVG 4-Step Scene
 * ========================================================================== */
const SvgCartoonBlaster: React.FC<{
  x: number;
  y: number;
  flip?: boolean;
  scale?: number;
}> = ({ x, y, flip = false, scale = 1 }) => (
  <g transform={`translate(${x}, ${y}) scale(${flip ? -scale : scale}, ${scale})`}>
    <path
      d="M -28 -12 H 18 A 5 5 0 0 1 23 -7 V 2 A 5 5 0 0 1 18 7 H -4 L -10 24 H -24 L -19 7 H -28 A 5 5 0 0 1 -33 2 V -7 A 5 5 0 0 1 -28 -12 Z"
      fill="#f97316"
      stroke="#161426"
      strokeWidth="3.5"
      strokeLinejoin="round"
    />
    <rect x="22" y="-8" width="9" height="11" rx="2" fill="#ef4444" stroke="#161426" strokeWidth="2.8" />
    <circle cx="-8" cy="-2" r="4.5" fill="#fde047" stroke="#161426" strokeWidth="2.2" />
  </g>
);

export const CashNGunsTutorialScene: React.FC<TutorialSceneProps> = ({
  step,
  animT,
  clock,
  lang,
}) => {
  const ar = lang === 'ar';
  const pulse = 1 + Math.sin(clock * 4.5) * 0.04;
  const bob = Math.sin(clock * 3.5) * 2.5;
  const b = easeOutBack(animT);

  return (
    <StageBackdrop accent="#f97316">
      {step === 0 && (
        <g>
          <SvgPill
            x={260}
            y={25}
            w={430}
            h={27}
            bg="#ffedd5"
            text={
              ar
                ? 'معك 5 طلقات (3 فاضية «طَقّ!» للتخويف + 2 حقيقية «بوم!»)'
                : 'Hold 5 rounds: 3 Blanks ("CLICK!") + 2 Live Darts ("BANG!")'
            }
          />
          <SvgCartoonBlaster x={140} y={120 + bob} scale={1.1 * b} />
          <SvgPill
            x={310}
            y={98}
            w={185}
            h={32}
            bg="#00bbf9"
            scale={b}
            text={ar ? '3 طلقات فاضية (طَقّ!)' : '3 Blank Clicks (Bluff!)'}
          />
          <SvgPill
            x={310}
            y={146}
            w={185}
            h={32}
            bg="#ff595e"
            fg="#fff9ec"
            scale={b * pulse}
            text={ar ? '2 طلقات حقيقية (بوم!)' : '2 Live Darts (BANG!)'}
          />
          <SvgPill
            x={260}
            y={212}
            w={415}
            h={27}
            bg="#191636"
            fg="#ffca3a"
            text={
              ar
                ? 'عمّر سلاحك بالسر وصوّب على أحد أصحابك للضغط عليه!'
                : 'Secretly load your card & aim at a friend across the vault!'
            }
          />
        </g>
      )}

      {step === 1 && (
        <g>
          <SvgPill
            x={260}
            y={25}
            w={430}
            h={27}
            bg="#ffca3a"
            text={
              ar
                ? 'ينكشف التصويب! هل طلقة صاحبك حقيقية أم مجرد تخويف؟'
                : 'Targets revealed! Is their blaster loaded with BANG or CLICK?'
            }
          />
          <SvgPlayerAvatar x={105} y={118} color="#ff595e" label={ar ? 'رامي' : 'Rami'} clock={clock} />
          <SvgCartoonBlaster x={200} y={115 + bob} scale={0.95 * pulse} />
          <SvgDoubleArrow x={290} y={115} color="#ff595e" />
          <SvgPlayerAvatar x={400} y={118} color="#00bbf9" label={ar ? 'نور (مستهدف!)' : 'Noor (Target!)'} suspect clock={clock} />
          <SvgPill
            x={260}
            y={212}
            w={420}
            h={27}
            bg="#191636"
            fg="#fff9ec"
            text={
              ar
                ? 'أمامك ثوانٍ لتقرر: تصمد بمكانك عالغنيمة أم تنسحب؟'
                : 'Decide now: Hold Your Ground for the loot or Duck for cover?'
            }
          />
        </g>
      )}

      {step === 2 && (
        <g>
          <SvgPill
            x={260}
            y={25}
            w={420}
            h={27}
            bg="#ff924c"
            text={
              ar
                ? 'قرارك المصيري: الصمود للشجعان أم الانسحاب الآمن؟'
                : 'Your Choice: Brave Hold for Loot vs Safe Duck!'
            }
          />
          <rect x="42" y="60" width="205" height="122" rx="14" fill="#191636" stroke="#8ac926" strokeWidth="3.2" />
          <SvgPill x={144} y={94} w={170} h={28} bg="#8ac926" text={ar ? 'أصمد بمكاني!' : 'Hold My Ground!'} />
          <SvgPill
            x={144}
            y={142}
            w={180}
            h={25}
            bg="#fff9ec"
            fontSize={9.8}
            text={ar ? 'تتقاسم الغنيمة إذا لم تُصب!' : 'Win Loot if unhit!'}
          />

          <rect x="273" y="60" width="205" height="122" rx="14" fill="#191636" stroke="#00bbf9" strokeWidth="3.2" />
          <SvgPill x={375} y={94} w={170} h={28} bg="#00bbf9" text={ar ? 'أنسحب وأحمي نفسي' : 'Duck for Cover'} />
          <SvgPill
            x={375}
            y={142}
            w={180}
            h={25}
            bg="#fff9ec"
            fontSize={9.8}
            text={ar ? 'تنجو من الرصاص لكن بدون غنيمة' : 'Dodge shots, 0 Loot this round'}
          />

          <SvgPill
            x={260}
            y={212}
            w={420}
            h={27}
            bg="#191636"
            fg="#ffca3a"
            text={
              ar
                ? 'إذا صمدت وطلعت طلقة خصمك «طَقّ!» فاضية... تضحك عليه وتأخذ الكنز!'
                : 'Stay against a "CLICK!" bluff and claim the vault treasure!'
            }
          />
        </g>
      )}

      {step === 3 && (
        <g>
          <SvgPill
            x={260}
            y={25}
            w={420}
            h={27}
            bg="#8ac926"
            text={
              ar
                ? 'تقسيم الكنز: الدولارات، اللوحات النادرة، ومكافأة الألماس!'
                : 'Split the Vault: Cash bundles, Paintings & Diamond Bonus!'
            }
          />
          {[
            { x: 130, label: '$20,000', sub: ar ? 'حقيبة كاش' : 'Cash Stack', col: '#22c55e' },
            { x: 260, label: '+$30,000', sub: ar ? 'أغلبية الألماس' : 'Diamond King', col: '#00bbf9' },
            { x: 390, label: '$18,000', sub: ar ? 'لوحة فنية' : 'Masterpiece', col: '#ffca3a' },
          ].map((item, i) => (
            <g key={i} transform={`translate(${item.x}, ${120 + (i === 1 ? bob : 0)}) scale(${b})`}>
              <rect x="-52" y="-38" width="104" height="76" rx="14" fill="#191636" stroke={item.col} strokeWidth="3.2" />
              <text x="0" y="-4" textAnchor="middle" fill={item.col} fontSize="14.5" fontWeight="900">
                {item.label}
              </text>
              <text x="0" y="18" textAnchor="middle" fill="#fff9ec" fontSize="10" fontWeight="900">
                {item.sub}
              </text>
            </g>
          ))}
          <SvgPill
            x={260}
            y={212}
            w={415}
            h={27}
            bg="#8ac926"
            text={
              ar
                ? 'بعد 5 جولات: أغنى فرد صامد في العصابة يفوز بالصدارة!'
                : 'After 5 rounds, the richest surviving gangster wins!'
            }
          />
        </g>
      )}
    </StageBackdrop>
  );
};

/* ============================================================================
 * 22. ONE NIGHT ULTIMATE WEREWOLF (ليلة الذئب) — Pure Native SVG 4-Step Scene
 * ========================================================================== */
const SvgRoleTarotCard: React.FC<{
  x: number;
  y: number;
  title: string;
  teamColor: string;
  scale?: number;
}> = ({ x, y, title, teamColor, scale = 1 }) => (
  <g transform={`translate(${x}, ${y}) scale(${scale})`}>
    <rect x="-39" y="-44" width="78" height="90" rx="12" fill="#120f29" />
    <rect
      x="-39"
      y="-47"
      width="78"
      height="90"
      rx="12"
      fill="#191636"
      stroke={teamColor}
      strokeWidth="3.2"
    />
    <circle cx="0" cy="-12" r="17" fill={teamColor} stroke="#161426" strokeWidth="2.5" />
    <polygon points="-9,-5 -5,-19 0,-12 5,-19 9,-5" fill="#ffca3a" stroke="#161426" strokeWidth="1.6" />
    <SvgPill x={0} y={22} w={68} h={20} bg={teamColor} fg="#fff9ec" fontSize={9.5} text={title} />
  </g>
);

export const OneNightTutorialScene: React.FC<TutorialSceneProps> = ({
  step,
  animT,
  clock,
  lang,
}) => {
  const ar = lang === 'ar';
  const pulse = 1 + Math.sin(clock * 4.5) * 0.04;
  const swapProgress = (Math.sin(clock * 2.8) + 1) / 2;
  const b = easeOutBack(animT);

  return (
    <StageBackdrop accent="#7c3aed">
      {step === 0 && (
        <g>
          <SvgPill
            x={260}
            y={25}
            w={430}
            h={27}
            bg="#ede9fe"
            text={
              ar
                ? 'أدوار سرية للاعبين + 3 بطاقات غامضة في وسط الطاولة!'
                : 'Secret player roles + 3 mystery cards in the Center!'
            }
          />
          <SvgRoleTarotCard x={112} y={122} title={ar ? 'المستذئب' : 'Werewolf'} teamColor="#e11d48" scale={b} />
          <SvgRoleTarotCard x={210} y={122} title={ar ? 'العرّافة' : 'Seer'} teamColor="#00bbf9" scale={b} />
          <SvgRoleTarotCard x={308} y={122} title={ar ? 'اللص' : 'Robber'} teamColor="#8ac926" scale={b} />
          <SvgRoleTarotCard x={406} y={122} title={ar ? 'المشاغب' : 'Troublemaker'} teamColor="#9b5de5" scale={b} />
          <SvgPill
            x={260}
            y={212}
            w={415}
            h={27}
            bg="#191636"
            fg="#ffca3a"
            text={
              ar
                ? 'ليلة واحدة ونهار واحد فقط — بدون راوي وبدون إقصاء!'
                : 'Just ONE Night and ONE Day — zero moderator & zero elimination!'
            }
          />
        </g>
      )}

      {step === 1 && (
        <g>
          <SvgPill
            x={260}
            y={25}
            w={435}
            h={27}
            bg="#ffca3a"
            text={
              ar
                ? 'في الليل: اللص يسرق دوراً، والمشاغب يبدّل بطاقتين بالسر!'
                : 'At Night: Robber steals a role & Troublemaker swaps two cards!'
            }
          />
          <SvgPlayerAvatar x={145} y={82} color="#00bbf9" label={ar ? 'نور' : 'Noor'} clock={clock} />
          <SvgPlayerAvatar x={375} y={82} color="#ff595e" label={ar ? 'رامي' : 'Rami'} clock={clock} />

          <SvgRoleTarotCard
            x={lerp(145, 375, swapProgress)}
            y={152}
            title={ar ? 'قروي بريء' : 'Villager'}
            teamColor="#00bbf9"
            scale={0.72}
          />
          <SvgRoleTarotCard
            x={lerp(375, 145, swapProgress)}
            y={152}
            title={ar ? 'المستذئب!' : 'Werewolf!'}
            teamColor="#e11d48"
            scale={0.72}
          />
          <SvgDoubleArrow x={260} y={152} color="#ffca3a" />

          <SvgPill
            x={260}
            y={212}
            w={425}
            h={27}
            bg="#191636"
            fg="#fff9ec"
            text={
              ar
                ? 'قد تستيقظ في النهار وقد تحوّلت إلى مستذئب دون أن تدري!'
                : 'You might wake up at Daybreak having become the Werewolf!'
            }
          />
        </g>
      )}

      {step === 2 && (
        <g>
          <SvgPill
            x={260}
            y={25}
            w={435}
            h={27}
            bg="#00bbf9"
            text={
              ar
                ? 'في النهار: اجمعوا خيوط الليل واكشفوا أين استقر كرت الذئب!'
                : 'At Daybreak: piece together clues & deduce who holds the Wolf NOW!'
            }
          />
          <SvgPlayerAvatar x={115} y={114} color="#00bbf9" label={ar ? 'نور' : 'Noor'} suspect clock={clock} />
          <SvgPill x={115} y={168} w={130} h={23} bg="#fff9ec" fontSize={9.5} text={ar ? '«أنا كنت قروي!»' : '"I started Villager!"'} />

          <SvgPlayerAvatar x={260} y={114} color="#9b5de5" label={ar ? 'سارة (مشاغب)' : 'Sara'} highlight clock={clock} />
          <SvgPill
            x={260}
            y={168}
            w={155}
            h={24}
            bg="#ffca3a"
            fontSize={9.5}
            scale={pulse}
            text={ar ? '«بدّلت نور مع رامي!»' : '"I swapped Noor & Rami!"'}
          />

          <SvgPlayerAvatar x={405} y={114} color="#ff595e" label={ar ? 'رامي' : 'Rami'} clock={clock} />
          <SvgPill x={405} y={168} w={130} h={23} bg="#fff9ec" fontSize={9.5} text={ar ? '«يعني نور الذئب!»' : '"So Noor is Wolf!"'} />

          <SvgPill
            x={260}
            y={212}
            w={415}
            h={27}
            bg="#191636"
            fg="#ffca3a"
            text={
              ar
                ? 'الفوز يُحسب على بطاقتك النهائية بعد تبديلات الليل!'
                : 'Your team is determined by the card in front of you at the end!'
            }
          />
        </g>
      )}

      {step === 3 && (
        <g>
          <SvgPill
            x={260}
            y={25}
            w={425}
            h={27}
            bg="#8ac926"
            text={
              ar
                ? 'التصويت الحاسم: صيد المستذئب أم نجاة الذئاب؟'
                : 'Final Vote: Catch the Werewolf or Wolves take the night!'
            }
          />
          <SvgRoleTarotCard x={175} y={112} title={ar ? 'إعدام الذئب' : 'Wolf Caught'} teamColor="#8ac926" scale={0.9 * b * pulse} />
          <SvgScoreBadge
            x={175}
            y={175}
            w={165}
            text={ar ? 'فوز القرية! (+3)' : 'Village Wins! (+3)'}
            bg="#8ac926"
            animT={animT}
            clock={clock}
          />

          <SvgRoleTarotCard x={345} y={112} title={ar ? 'نجا الذئب' : 'Wolf Survived'} teamColor="#e11d48" scale={0.9 * b} />
          <SvgScoreBadge
            x={345}
            y={175}
            w={165}
            text={ar ? 'فوز الذئاب! (+4)' : 'Werewolves Win! (+4)'}
            bg="#ff595e"
            fg="#fff9ec"
            animT={animT}
            clock={clock}
          />

          <SvgPill
            x={260}
            y={212}
            w={415}
            h={27}
            bg="#8ac926"
            text={
              ar
                ? 'ينكشف مسار تبديل البطاقات الكامل بالأسهم في نهاية الجولة!'
                : 'Full Before-and-After Role Swap map is revealed at the end!'
            }
          />
        </g>
      )}
    </StageBackdrop>
  );
};

/* ============================================================================
 * 23. THE RESISTANCE (المهمة السرية) — Pure Native SVG 4-Step Scene
 * ========================================================================== */
export const ResistanceTutorialScene: React.FC<TutorialSceneProps> = ({
  step,
  animT,
  clock,
  lang,
}) => {
  const ar = lang === 'ar';
  const bob = Math.sin(clock * 3.5) * 2.5;
  const b = easeOutBack(animT);

  return (
    <StageBackdrop accent="#0284c7">
      {step === 0 && (
        <g>
          <SvgPill
            x={260}
            y={25}
            w={430}
            h={27}
            bg="#e0f2fe"
            text={
              ar
                ? 'عملاء شرفاء ضد جواسيس خونة عبر 5 مهمات مصيرية!'
                : 'Loyal Agents vs Hidden Spies across 5 high-stakes Missions!'
            }
          />
          {[1, 2, 3, 4, 5].map((m, i) => (
            <g key={m} transform={`translate(${92 + i * 84}, 118) scale(${b})`}>
              <circle
                cx="0"
                cy="0"
                r="28"
                fill={i < 2 ? '#0284c7' : i === 2 ? '#e11d48' : '#191636'}
                stroke={i === 2 ? '#ffca3a' : '#fff9ec'}
                strokeWidth="3.2"
              />
              <text x="0" y="-3" textAnchor="middle" fill="#fff9ec" fontSize="11.5" fontWeight="900">
                {ar ? `مهمة ${m}` : `M${m}`}
              </text>
              <text x="0" y="13" textAnchor="middle" fill="#ffca3a" fontSize="9.2" fontWeight="900">
                {i < 2 ? (ar ? 'ناجحة' : 'PASS') : i === 2 ? (ar ? 'مخربة!' : 'FAIL!') : '3/5'}
              </text>
            </g>
          ))}
          <SvgPill
            x={260}
            y={212}
            w={415}
            h={27}
            bg="#191636"
            fg="#ffca3a"
            text={
              ar
                ? 'الجواسيس يعرفون بعضهم بالسر، بينما العملاء يبحثون عن الحقيقة!'
                : 'Spies know each other secretly; Agents must root them out!'
            }
          />
        </g>
      )}

      {step === 1 && (
        <g>
          <SvgPill
            x={260}
            y={25}
            w={430}
            h={27}
            bg="#ffca3a"
            text={
              ar
                ? 'القائد يرشح فريق المهمة، والجميع يصوّتون علناً: موافقة أم رفض!'
                : 'Leader proposes a Mission Team & everyone votes publicly!'
            }
          />
          <SvgPlayerAvatar x={125} y={108} color="#00bbf9" label={ar ? 'نور (القائد)' : 'Noor (Leader)'} crown clock={clock} />
          <SvgPlayerAvatar x={260} y={108} color="#8ac926" label={ar ? 'سارة (بالفريق)' : 'Sara (Team)'} highlight clock={clock} />
          <SvgPlayerAvatar x={395} y={108} color="#ff595e" label={ar ? 'رامي' : 'Rami'} clock={clock} />

          <SvgPill x={125} y={168} w={105} h={23} bg="#8ac926" fontSize={10} text={ar ? 'موافقة ✓' : 'Approve ✓'} />
          <SvgPill x={260} y={168} w={105} h={23} bg="#8ac926" fontSize={10} text={ar ? 'موافقة ✓' : 'Approve ✓'} />
          <SvgPill x={395} y={168} w={105} h={23} bg="#ff595e" fg="#fff9ec" fontSize={10} text={ar ? 'رفض ✕' : 'Reject ✕'} />

          <SvgPill
            x={260}
            y={212}
            w={415}
            h={27}
            bg="#191636"
            fg="#fff9ec"
            text={
              ar
                ? 'إذا رُفضت 5 تشكيلات متتالية تعم الفوضى ويفوز الجواسيس!'
                : 'If 5 proposals in a row are rejected, Spies win automatically!'
            }
          />
        </g>
      )}

      {step === 2 && (
        <g>
          <SvgPill
            x={260}
            y={25}
            w={430}
            h={27}
            bg="#0284c7"
            fg="#fff9ec"
            text={
              ar
                ? 'تنفيذ المهمة بالسر: إنجاح المهمة أم ضربة تخريب خفية؟'
                : 'Secret Mission Action: Submit Success or covert Sabotage!'
            }
          />
          <rect
            x="65"
            y="66"
            width="175"
            height="112"
            rx="15"
            fill="#0284c7"
            stroke="#161426"
            strokeWidth="3.2"
            transform={`translate(0, ${bob})`}
          />
          <text x="152" y="114" textAnchor="middle" fill="#fff9ec" fontSize="15" fontWeight="900">
            {ar ? 'إنجاح المهمة' : 'SUCCESS'}
          </text>
          <text x="152" y="138" textAnchor="middle" fill="#bae6fd" fontSize="10" fontWeight="900">
            {ar ? 'للعملاء (أو تمويه الجاسوس)' : 'Loyal Agent (or Spy Bluff)'}
          </text>

          <rect
            x="280"
            y="66"
            width="175"
            height="112"
            rx="15"
            fill="#e11d48"
            stroke="#161426"
            strokeWidth="3.2"
            transform={`translate(0, ${-bob})`}
          />
          <text x="367" y="114" textAnchor="middle" fill="#fff9ec" fontSize="15" fontWeight="900">
            {ar ? 'تخريب المهمة!' : 'SABOTAGE!'}
          </text>
          <text x="367" y="138" textAnchor="middle" fill="#fecdd3" fontSize="10" fontWeight="900">
            {ar ? 'متاح للجواسيس فقط!' : 'Available to Spies Only!'}
          </text>

          <SvgPill
            x={260}
            y={212}
            w={425}
            h={27}
            bg="#191636"
            fg="#ffca3a"
            text={
              ar
                ? 'تُخلط البطاقات وتُكشف بدون أسماء — تخريب واحد يفجّر المهمة!'
                : 'Cards are shuffled anonymously — 1 Sabotage fails the mission!'
            }
          />
        </g>
      )}

      {step === 3 && (
        <g>
          <SvgPill
            x={260}
            y={25}
            w={430}
            h={27}
            bg="#8ac926"
            text={
              ar
                ? '3 مهمات ناجحة = نصر المقاومة (مع فرصة اغتيال القائد السري!)'
                : '3 Successful Missions = Agents Win (unless Spies snipe Commander!)'
            }
          />
          <SvgScoreBadge
            x={155}
            y={122}
            w={190}
            text={ar ? '3 مهمات ناجحة = فوز العملاء!' : '3 Missions Passed = Agents Win!'}
            bg="#0284c7"
            fg="#fff9ec"
            animT={animT}
            clock={clock}
          />
          <SvgScoreBadge
            x={365}
            y={122}
            w={190}
            text={ar ? '3 مهمات مخربة = فوز الجواسيس!' : '3 Sabotaged = Spies Win!'}
            bg="#e11d48"
            fg="#fff9ec"
            animT={animT}
            clock={clock}
          />
          <SvgPill
            x={260}
            y={212}
            w={415}
            h={27}
            bg="#8ac926"
            text={
              ar
                ? 'قراءة الوجوه وتحليل التصويت هما مفتاح كشف الجواسيس!'
                : 'Analyze every vote & mission result to unmask the Spies!'
            }
          />
        </g>
      )}
    </StageBackdrop>
  );
};

/* ============================================================================
 * 24. MASTERPIECE TRAP AUCTION (مزاد الخربشات) — Pure Native SVG 4-Step Scene
 * ========================================================================== */
export const ArtAuctionTutorialScene: React.FC<TutorialSceneProps> = ({
  step,
  animT,
  clock,
  lang,
}) => {
  const ar = lang === 'ar';
  const pulse = 1 + Math.sin(clock * 4.5) * 0.04;
  const bob = Math.sin(clock * 3.5) * 2.5;
  const b = easeOutBack(animT);

  return (
    <StageBackdrop accent="#eab308">
      {step === 0 && (
        <g>
          <SvgPill
            x={260}
            y={25}
            w={435}
            h={27}
            bg="#fef9c3"
            text={
              ar
                ? 'ارسم لوحتك وضع خلفها بيدك ختمك السري: تحفة أم فخ؟'
                : 'Draw your art & secretly stamp it yourself: Masterpiece or Trap?'
            }
          />
          {/* Painting Frame */}
          <g transform={`translate(145, 118) scale(${b})`}>
            <rect x="-52" y="-42" width="104" height="84" rx="10" fill="#ffca3a" stroke="#161426" strokeWidth="3.5" />
            <rect x="-42" y="-32" width="84" height="64" rx="6" fill="#fff9ec" stroke="#161426" strokeWidth="2.5" />
            <path d="M -28 14 Q -10 -16 8 8 T 28 -12" fill="none" stroke="#e11d48" strokeWidth="3.5" strokeLinecap="round" />
            <circle cx="-18" cy="-12" r="5" fill="#00bbf9" />
          </g>
          <SvgDoubleArrow x={232} y={118} color="#ffca3a" />
          <SvgPill
            x={365}
            y={94}
            w={195}
            h={32}
            bg="#8ac926"
            scale={b}
            text={ar ? 'ختم: تحفة ملكية (+$5,000)' : 'Stamp: Masterpiece (+$5k)'}
          />
          <SvgPill
            x={365}
            y={142}
            w={195}
            h={32}
            bg="#ff595e"
            fg="#fff9ec"
            scale={b * pulse}
            text={ar ? 'ختم: لوحة ملغومة (-$3,000!)' : 'Stamp: Cursed Trap (-$3k!)'}
          />
          <SvgPill
            x={260}
            y={212}
            w={425}
            h={27}
            bg="#191636"
            fg="#ffca3a"
            text={
              ar
                ? 'أنت الوحيد الذي يعرف القيمة السرية خلف لوحتك!'
                : 'Only YOU know the secret stamp hidden behind your painting!'
            }
          />
        </g>
      )}

      {step === 1 && (
        <g>
          <SvgPill
            x={260}
            y={25}
            w={435}
            h={27}
            bg="#ffca3a"
            text={
              ar
                ? 'قاعة المزاد: زايد بالدولارات (والمبلغ يذهب كاش لجيب الرسام!)'
                : 'Live Auction: Bid cash — winning bid goes straight to the Artist!'
            }
          />
          <SvgPlayerAvatar x={110} y={115} color="#00bbf9" label={ar ? 'الرسام' : 'Artist'} crown clock={clock} />
          <g transform={`translate(255, ${118 + bob}) scale(${pulse})`}>
            <rect x="-46" y="-36" width="92" height="72" rx="10" fill="#ffca3a" stroke="#161426" strokeWidth="3.2" />
            <rect x="-36" y="-26" width="72" height="52" rx="5" fill="#fff9ec" stroke="#161426" strokeWidth="2.2" />
            <text x="0" y="3" textAnchor="middle" fill="#161426" fontSize="12" fontWeight="900">
              {ar ? '؟ ختم سري ؟' : '? SECRET ?'}
            </text>
          </g>
          <SvgPlayerAvatar x={405} y={115} color="#9b5de5" label={ar ? 'المشتري' : 'Buyer'} highlight clock={clock} />
          <SvgPill
            x={405}
            y={170}
            w={135}
            h={25}
            bg="#8ac926"
            fontSize={10}
            text={ar ? 'أزايد بـ $2,000!' : 'Bid $2,000!'}
          />
          <SvgPill
            x={260}
            y={212}
            w={425}
            h={27}
            bg="#191636"
            fg="#fff9ec"
            text={
              ar
                ? 'الرسام يقبض $2,000 فوراً... والمشتري يفتح الختم السري!'
                : 'Artist pockets $2,000 cash... while Buyer flips the secret stamp!'
            }
          />
        </g>
      )}

      {step === 2 && (
        <g>
          <SvgPill
            x={260}
            y={25}
            w={435}
            h={27}
            bg="#ff924c"
            text={
              ar
                ? 'فخ الطمع: إذا لم يزايد أحد على لوحتك... تبتلعها أنت!'
                : 'Careful: If NOBODY bids on your painting, YOU keep it!'
            }
          />
          <SvgPlayerAvatar x={165} y={114} color="#ff595e" label={ar ? 'رسام نصّاب' : 'Trap Artist'} suspect clock={clock} />
          <SvgDoubleArrow x={255} y={114} color="#ff595e" />
          <SvgScoreBadge
            x={365}
            y={114}
            w={195}
            text={ar ? 'صفر مزايدة = الفخ ينفجر فيك!' : '0 Bids = Trap Hits Artist!'}
            bg="#ff595e"
            fg="#fff9ec"
            animT={animT}
            clock={clock}
          />
          <SvgPill
            x={260}
            y={212}
            w={425}
            h={27}
            bg="#191636"
            fg="#ffca3a"
            text={
              ar
                ? 'لا تضع فخاً إلا إذا كنت واثقاً أن لوحتك ستُغري أصحابك بالشراء!'
                : 'Only plant a Trap if your drawing is tempting enough to get bids!'
            }
          />
        </g>
      )}

      {step === 3 && (
        <g>
          <SvgPill
            x={260}
            y={25}
            w={430}
            h={27}
            bg="#8ac926"
            text={
              ar
                ? 'كشف الأختام السرية وحساب الثروة الكلية (كاش + قيمة اللوحات)!'
                : 'Unveil all Secret Stamps — Total Cash + Art Value wins!'
            }
          />
          <SvgScoreBadge
            x={155}
            y={122}
            w={190}
            text={ar ? 'تحفة ملكية: +$5,000!' : 'Royal Masterpiece: +$5,000!'}
            bg="#8ac926"
            animT={animT}
            clock={clock}
          />
          <SvgScoreBadge
            x={365}
            y={122}
            w={190}
            text={ar ? 'لوحة ملغومة: -$3,000!' : 'Cursed Trap: -$3,000!'}
            bg="#e11d48"
            fg="#fff9ec"
            animT={animT}
            clock={clock}
          />
          <SvgPill
            x={260}
            y={212}
            w={415}
            h={27}
            bg="#8ac926"
            text={
              ar
                ? 'أذكى جامع تحف ومروّج لوحات يتوّج إمبراطور المزاد!'
                : 'The sharpest art collector & bluffer wins the auction crown!'
            }
          />
        </g>
      )}
    </StageBackdrop>
  );
};

/* ============================================================================
 * 25. DRAW YOUR ALIBI (ارسم حجّتك!) — Pure Native SVG 4-Step Scene
 * ========================================================================== */
export const AlibiTutorialScene: React.FC<TutorialSceneProps> = ({
  step,
  animT,
  clock,
  lang,
}) => {
  const ar = lang === 'ar';
  const pulse = 1 + Math.sin(clock * 4.5) * 0.04;
  const b = easeOutBack(animT);

  return (
    <StageBackdrop accent="#06b6d4">
      {step === 0 && (
        <g>
          <SvgPill
            x={260}
            y={25}
            w={435}
            h={27}
            bg="#cffafe"
            text={
              ar
                ? 'الشهود الأبرياء يعرفون «تفصيل الحجّة السري» والمجرم يجهله!'
                : 'Witnesses see the Secret Alibi Detail — the Culprit is in the dark!'
            }
          />
          <rect x="42" y="60" width="205" height="122" rx="14" fill="#191636" stroke="#06b6d4" strokeWidth="3.2" />
          <SvgPill x={144} y={92} w={175} h={26} bg="#06b6d4" fg="#161426" fontSize={10} text={ar ? 'شاهد بريء: المتحف' : 'Witness: Museum'} />
          <SvgPill
            x={144}
            y={140}
            w={185}
            h={26}
            bg="#ffca3a"
            fontSize={9.8}
            text={ar ? 'السر: قطة فوق التمثال!' : 'Alibi: Cat on Statue!'}
          />

          <rect x="273" y="60" width="205" height="122" rx="14" fill="#191636" stroke="#ff595e" strokeWidth="3.2" />
          <SvgPill x={375} y={92} w={175} h={26} bg="#ff595e" fg="#fff9ec" fontSize={10} text={ar ? 'المجرم: المتحف فقط!' : 'Culprit: Museum Only!'} />
          <SvgPill
            x={375}
            y={140}
            w={185}
            h={26}
            bg="#fff9ec"
            fontSize={9.8}
            text={ar ? 'تفصيل الحجّة: ؟؟؟ مجهول' : 'Alibi Detail: ??? Unknown'}
          />

          <SvgPill
            x={260}
            y={212}
            w={420}
            h={27}
            bg="#191636"
            fg="#ffca3a"
            text={
              ar
                ? 'ادمج التفصيل السري في رسمتك بذكاء لتثبت براءتك!'
                : 'Weave the secret detail into your sketch to prove your innocence!'
            }
          />
        </g>
      )}

      {step === 1 && (
        <g>
          <SvgPill
            x={260}
            y={25}
            w={430}
            h={27}
            bg="#ffca3a"
            text={
              ar
                ? 'يرسم الجميع مشهد حجّتهم في نفس اللحظة داخل غرفة التحقيق!'
                : 'Everyone sketches their alibi scene simultaneously!'
            }
          />
          {[
            { x: 115, name: ar ? 'نور (شاهد)' : 'Noor', hasSecret: true },
            { x: 260, name: ar ? 'سارة (شاهد)' : 'Sara', hasSecret: true },
            { x: 405, name: ar ? 'رامي (مجرم!)' : 'Rami (Culprit!)', hasSecret: false },
          ].map((p, i) => (
            <g key={i} transform={`translate(${p.x}, 122) scale(${b})`}>
              <rect
                x="-54"
                y="-44"
                width="108"
                height="88"
                rx="12"
                fill="#fff9ec"
                stroke={p.hasSecret ? '#06b6d4' : '#ff595e'}
                strokeWidth="3.2"
              />
              <text x="0" y="-20" textAnchor="middle" fill="#161426" fontSize="10" fontWeight="900">
                {p.name}
              </text>
              <text x="0" y="12" textAnchor="middle" fill={p.hasSecret ? '#0284c7' : '#e11d48'} fontSize="9.5" fontWeight="900">
                {p.hasSecret ? (ar ? 'تمثال + قطة' : 'Statue + Cat') : ar ? 'تمثال فقط!' : 'Statue Only!'}
              </text>
            </g>
          ))}
          <SvgPill
            x={260}
            y={212}
            w={425}
            h={27}
            bg="#191636"
            fg="#fff9ec"
            text={
              ar
                ? 'لا تجعل التفصيل السري مكشوفاً جداً كي لا يفهمه المجرم!'
                : 'Keep the detail subtle enough that the Culprit cannot guess it!'
            }
          />
        </g>
      )}

      {step === 2 && (
        <g>
          <SvgPill
            x={260}
            y={25}
            w={430}
            h={27}
            bg="#06b6d4"
            text={
              ar
                ? 'معرض الاستجواب: قارنوا الرسومات وصوّتوا للقبض على المجرم!'
                : 'Interrogation Board: Compare sketches & vote to arrest the Culprit!'
            }
          />
          <SvgPlayerAvatar x={130} y={118} color="#00bbf9" label={ar ? 'نور' : 'Noor'} clock={clock} />
          <SvgPlayerAvatar x={260} y={118} color="#9b5de5" label={ar ? 'سارة' : 'Sara'} clock={clock} />
          <SvgPlayerAvatar x={390} y={118} color="#ff595e" label={ar ? 'رامي (مشتبه!)' : 'Rami (Suspect!)'} suspect clock={clock} />
          <SvgPill
            x={390}
            y={172}
            w={140}
            h={24}
            bg="#ff595e"
            fg="#fff9ec"
            fontSize={9.8}
            scale={pulse}
            text={ar ? 'رسمته ناقصة السر!' : 'Missing the Alibi!'}
          />
          <SvgPill
            x={260}
            y={212}
            w={415}
            h={27}
            bg="#191636"
            fg="#ffca3a"
            text={
              ar
                ? 'كل شاهد يصوّت للمجرم الحقيقي يحصل على نقاط المحقق!'
                : 'Every Witness who votes for the real Culprit scores Detective points!'
            }
          />
        </g>
      )}

      {step === 3 && (
        <g>
          <SvgPill
            x={260}
            y={25}
            w={435}
            h={27}
            bg="#8ac926"
            text={
              ar
                ? 'إذا انكشف المجرم: أمامه فرصة أخيرة لتخمين تفصيل الحجّة السري!'
                : 'If caught, the Culprit gets 1 last shot to guess the Secret Alibi!'
            }
          />
          <SvgScoreBadge
            x={155}
            y={122}
            w={190}
            text={ar ? 'إخفاء السر = فوز الشهود!' : 'Secret Safe = Witnesses Win!'}
            bg="#8ac926"
            animT={animT}
            clock={clock}
          />
          <SvgScoreBadge
            x={365}
            y={122}
            w={190}
            text={ar ? 'هروب أو تخمين = فوز المجرم!' : 'Escape/Guess = Culprit Wins!'}
            bg="#ff595e"
            fg="#fff9ec"
            animT={animT}
            clock={clock}
          />
          <SvgPill
            x={260}
            y={212}
            w={415}
            h={27}
            bg="#8ac926"
            text={
              ar
                ? 'توازن ذكي بين إثبات البراءة للشهود وتمويه المجرم!'
                : 'Strike the perfect balance between proving innocence & hiding the clue!'
            }
          />
        </g>
      )}
    </StageBackdrop>
  );
};

/* ============================================================================
 * 26. SPLIT OR STEAL (شرف اللصوص: شراكة أم غدر؟) — Pure Native SVG 4-Step Scene
 * ========================================================================== */
export const SplitStealTutorialScene: React.FC<TutorialSceneProps> = ({
  step,
  animT,
  clock,
  lang,
}) => {
  const ar = lang === 'ar';
  const pulse = 1 + Math.sin(clock * 4.5) * 0.04;
  const bob = Math.sin(clock * 3.5) * 2.5;
  const b = easeOutBack(animT);

  return (
    <StageBackdrop accent="#eab308">
      {step === 0 && (
        <g>
          <SvgPill
            x={260}
            y={25}
            w={435}
            h={27}
            bg="#fef08a"
            text={
              ar
                ? 'افحص حقيبتك السرية وقدّم وعدك ليختارك الزعيم شريكاً بالخزنة!'
                : 'Peek at your secret briefcase & pitch the Boss to pick you!'
            }
          />
          <SvgPlayerAvatar x={115} y={118} color="#00bbf9" label={ar ? 'زعيم الخزنة' : 'Vault Boss'} crown clock={clock} />
          <SvgDoubleArrow x={200} y={118} color="#ffca3a" />
          <SvgPill
            x={345}
            y={94}
            w={215}
            h={32}
            bg="#ffca3a"
            scale={b}
            text={ar ? 'سارة: «حقيبتي +$60,000 وسأختار شراكة!»' : 'Sara: "$60k & I swear I’ll Split!"'}
          />
          <SvgPill
            x={345}
            y={142}
            w={215}
            h={32}
            bg="#fff9ec"
            scale={b}
            text={ar ? 'رامي: «عندي ألماس مضاعف، اخترني!»' : 'Rami: "Double Diamonds, pick me!"'}
          />
          <SvgPill
            x={260}
            y={212}
            w={420}
            h={27}
            bg="#191636"
            fg="#ffca3a"
            text={
              ar
                ? 'قد تكون الحقيبة مليانة ذهب... أو فخ ضريبي ملغوم!'
                : 'A briefcase might hold $60,000 Gold... or a Tax Trap!'
            }
          />
        </g>
      )}

      {step === 1 && (
        <g>
          <SvgPill
            x={260}
            y={25}
            w={435}
            h={27}
            bg="#ffca3a"
            text={
              ar
                ? 'المواجهة الكبرى: كل طرف يختار بالسر «شراكة» أو «غدر»!'
                : 'Final Showdown: Each duelist secretly locks SPLIT or STEAL!'
            }
          />
          {/* Left Orb: SPLIT */}
          <g transform={`translate(160, ${118 + bob}) scale(${b})`}>
            <circle cx="0" cy="0" r="34" fill="#8ac926" stroke="#161426" strokeWidth="3.8" />
            <text x="0" y="-3" textAnchor="middle" fill="#161426" fontSize="13" fontWeight="900">
              {ar ? 'شراكة' : 'SPLIT'}
            </text>
            <text x="0" y="13" textAnchor="middle" fill="#161426" fontSize="9.5" fontWeight="900">
              50% / 50%
            </text>
          </g>

          <SvgDoubleArrow x={260} y={118} color="#ffca3a" />

          {/* Right Orb: STEAL */}
          <g transform={`translate(360, ${118 - bob}) scale(${b * pulse})`}>
            <circle cx="0" cy="0" r="34" fill="#e11d48" stroke="#161426" strokeWidth="3.8" />
            <text x="0" y="-3" textAnchor="middle" fill="#fff9ec" fontSize="13" fontWeight="900">
              {ar ? 'غدر!' : 'STEAL!'}
            </text>
            <text x="0" y="13" textAnchor="middle" fill="#ffca3a" fontSize="9.5" fontWeight="900">
              100% / 0%
            </text>
          </g>

          <SvgPill
            x={260}
            y={212}
            w={425}
            h={27}
            bg="#191636"
            fg="#fff9ec"
            text={
              ar
                ? 'بينما يتعرق الشريكان، يراهن باقي اللاعبين على النتيجة!'
                : 'While duelists sweat, spectators bet on whether they Split or Betray!'
            }
          />
        </g>
      )}

      {step === 2 && (
        <g>
          <SvgPill
            x={260}
            y={25}
            w={435}
            h={27}
            bg="#ff924c"
            text={
              ar
                ? 'قوانين الكرات الذهبية الثلاثة عند فتح الخزنة:'
                : 'The 3 Golden Rules when both Orbs are revealed:'
            }
          />
          {[
            { x: 105, title: ar ? 'شراكة + شراكة' : 'SPLIT + SPLIT', res: ar ? 'تقاسم بالنص!' : '50/50 Split!', col: '#8ac926' },
            { x: 260, title: ar ? 'غدر + شراكة' : 'STEAL + SPLIT', res: ar ? 'الغادر يأخذ 100%!' : 'Stealer takes 100%!', col: '#ffca3a' },
            { x: 415, title: ar ? 'غدر + غدر' : 'STEAL + STEAL', res: ar ? 'انفجار! $0 للاثنين!' : 'BOOM! $0 for Both!', col: '#ff595e' },
          ].map((c, i) => (
            <g key={i} transform={`translate(${c.x}, 122) scale(${b})`}>
              <rect x="-66" y="-40" width="132" height="80" rx="14" fill="#191636" stroke={c.col} strokeWidth="3.2" />
              <text x="0" y="-8" textAnchor="middle" fill={c.col} fontSize="11.5" fontWeight="900">
                {c.title}
              </text>
              <text x="0" y="16" textAnchor="middle" fill="#fff9ec" fontSize="10.2" fontWeight="900">
                {c.res}
              </text>
            </g>
          ))}
          <SvgPill
            x={260}
            y={212}
            w={420}
            h={27}
            bg="#191636"
            fg="#ffca3a"
            text={
              ar
                ? 'الطمع المزدوج يحرق الخزنة ويمنح الجائزة للمراهنين من الجمهور!'
                : 'Double greed burns the vault and pays out Spectator bets!'
            }
          />
        </g>
      )}

      {step === 3 && (
        <g>
          <SvgPill
            x={260}
            y={25}
            w={430}
            h={27}
            bg="#8ac926"
            text={
              ar
                ? 'يتناوب الجميع على زعامة الخزنة — وأغنى لص في النهاية يفوز!'
                : 'Everyone takes a turn as Vault Boss — richest mastermind wins!'
            }
          />
          <SvgScoreBadge
            x={155}
            y={122}
            w={190}
            text={ar ? 'ثقة متبادلة أو خيانة قاضية!' : 'Mutual Trust or Cold Betrayal!'}
            bg="#ffca3a"
            animT={animT}
            clock={clock}
          />
          <SvgScoreBadge
            x={365}
            y={122}
            w={190}
            text={ar ? 'رهان الجمهور الصحيح: +$15,000!' : 'Correct Crowd Bet: +$15,000!'}
            bg="#8ac926"
            animT={animT}
            clock={clock}
          />
          <SvgPill
            x={260}
            y={212}
            w={415}
            h={27}
            bg="#8ac926"
            text={
              ar
                ? 'وعود صادقة أم خديعة العمر؟ القرار بيدك!'
                : 'Honest alliance or betrayal of the century? You decide!'
            }
          />
        </g>
      )}
    </StageBackdrop>
  );
};

/* ============================================================================
 * 9. BOOM DECK ("الفتيل الملعون") — 4-STEP ANIMATED TUTORIAL SCENE
 * ========================================================================== */
export const BoomDeckTutorialScene: React.FC<TutorialSceneProps> = ({
  step,
  animT,
  clock,
  lang,
}) => {
  const ar = lang === 'ar';
  const b = easeOutBack(animT);
  const pulse = 1 + Math.sin(clock * 0.008) * 0.045;
  const floatY = Math.sin(clock * 0.006) * 4;

  return (
    <StageBackdrop accent="#e11d48">
      {step === 0 && (
        <g>
          <SvgPill
            x={260}
            y={25}
            w={435}
            h={27}
            bg="#ffca3a"
            text={
              ar
                ? 'معك 7 كروت قدرات ومقص إنقاذ — والقنابل مزروعة بالكومة!'
                : 'Start with 7 Ability Cards + Wire Cutters — Bombs lurk in the deck!'
            }
          />
          {/* Center Draw Pile with Bomb Risk */}
          <g transform={`translate(260, ${118 + floatY}) scale(${b})`}>
            <rect x="-42" y="-50" width="84" height="100" rx="14" fill="#e11d48" stroke="#161426" strokeWidth="4" />
            <rect x="-32" y="-38" width="64" height="76" rx="10" fill="#fff9ec" stroke="#161426" strokeWidth="3" />
            <circle cx="0" cy="0" r="18" fill="#161426" />
            <circle cx="0" cy="0" r="7" fill="#ffca3a" />
          </g>
          <SvgPill x={125} y={118} w={135} h={34} bg="#dcfce7" scale={b * pulse} text={ar ? 'مقص الإنقاذ' : 'Wire Cutters'} />
          <SvgPill x={395} y={118} w={135} h={34} bg="#fce7f3" scale={b} text={ar ? 'رادار الكومة' : 'X-Ray Radar'} />
          <SvgPill
            x={260}
            y={212}
            w={425}
            h={27}
            bg="#191636"
            fg="#fff9ec"
            text={
              ar
                ? 'في دورك: العب قدراتك أولاً، أو اسحب كرتاً لإنهاء دورك!'
                : 'On your turn: play ability cards first, or draw 1 card to finish!'
            }
          />
        </g>
      )}

      {step === 1 && (
        <g>
          <SvgPill
            x={260}
            y={25}
            w={440}
            h={27}
            bg="#00bbf9"
            text={
              ar
                ? 'العب قدرات سينمائية: اكشف أول 3 كروت، اسرق، أو دبل المصيبة ×2!'
                : 'Unleash Cinema Abilities: Scan top 3 cards, steal, or Attack ×2!'
            }
          />
          <SvgPill x={130} y={96} w={150} h={36} bg="#fef9c3" scale={b * pulse} text={ar ? 'تدبيل المصيبة ×2' : 'Double Attack ×2'} />
          <SvgPill x={390} y={96} w={150} h={36} bg="#e0f2fe" scale={b} text={ar ? 'تزحليقة! (بدون سحب)' : 'Turbo Skip!'} />
          <SvgPill x={130} y={150} w={150} h={36} bg="#ffedd5" scale={b} text={ar ? 'مغناطيس السرقة' : 'Heist Magnet'} />
          <SvgPill x={390} y={150} w={150} h={36} bg="#fee2e2" scale={b * pulse} text={ar ? 'بلوك! (إبطال)' : 'BLOCK! Stamp'} />
          <SvgPill
            x={260}
            y={212}
            w={425}
            h={27}
            bg="#191636"
            fg="#ffca3a"
            text={
              ar
                ? 'أي لاعب يملك كرت «بلوك!» يمكنه إبطال حركتك خلال 4 ثوانٍ!'
                : 'Anyone holding a BLOCK card can cancel your move in 4 seconds!'
            }
          />
        </g>
      )}

      {step === 2 && (
        <g>
          <SvgPill
            x={260}
            y={25}
            w={440}
            h={27}
            bg="#e11d48"
            fg="#fff9ec"
            text={
              ar
                ? 'سحبت القنبلة؟ قصّ السلك وازرع القنبلة بأي مكان بالكومة بالسر!'
                : 'Drew a Lit Bomb? Snip the wire & secretly plant it anywhere!'
            }
          />
          <SvgPill x={155} y={115} w={175} h={42} bg="#dcfce7" scale={b * pulse} text={ar ? 'قصّ السلك ونجاة!' : 'Snip Wire & Survive!'} />
          <SvgDoubleArrow x={260} y={115} color="#ffca3a" />
          <SvgPill x={365} y={115} w={175} h={42} bg="#ffe4e6" scale={b} text={ar ? 'ازرعها أول كرت عالوجه!' : 'Plant Right on Top!'} />
          <SvgPill
            x={260}
            y={212}
            w={425}
            h={27}
            bg="#191636"
            fg="#fff9ec"
            text={
              ar
                ? 'أنت وحدك تختار أين تزرع القنبلة لتنفجر باللاعب القادم!'
                : 'Only YOU choose where to hide the bomb for the next victim!'
            }
          />
        </g>
      )}

      {step === 3 && (
        <g>
          <SvgPill
            x={260}
            y={25}
            w={430}
            h={27}
            bg="#8ac926"
            text={
              ar
                ? 'من يسحب قنبلة بلا مقص ينفجر — والناجي الأخير يتوّج بطلاً!'
                : 'Draw a bomb with no Wire Cutters and BOOM — Last Survivor wins!'
            }
          />
          <SvgScoreBadge
            x={165}
            y={122}
            w={185}
            text={ar ? 'انفجار بلا مقص أسلاك!' : 'No Wire Cutters = BOOM!'}
            bg="#ff595e"
            fg="#fff9ec"
            animT={animT}
            clock={clock}
          />
          <SvgScoreBadge
            x={355}
            y={122}
            w={185}
            text={ar ? 'الناجي الأخير (+4 نقاط)!' : 'Last Survivor (+4 pts)!'}
            bg="#8ac926"
            animT={animT}
            clock={clock}
          />
          <SvgPill
            x={260}
            y={212}
            w={415}
            h={27}
            bg="#8ac926"
            text={
              ar
                ? 'صفر كتابة، سرعة جنونية، وفخاخ لا ترحم!'
                : 'Zero typing, lightning pace, and ruthless traps!'
            }
          />
        </g>
      )}
    </StageBackdrop>
  );
};


