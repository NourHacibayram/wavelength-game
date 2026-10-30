import React, { useId } from 'react';
import {
  TutorialSceneProps,
  StageBackdrop,
  SvgPlayerAvatar,
  SvgPill,
  SvgScoreBadge,
  SvgCheckMark,
  SvgCrossMark,
  SvgDoubleArrow,
  clamp01,
  lerp,
  easeOutCubic,
  easeOutBack,
  polarToXY,
  describeArcWedge,
} from './TutorialSvgPrimitives';

/* ============================================================================
 * 1. WAVELENGTH (عَ نفس الموجة) — Pure Native SVG 4-Step Scene
 * ========================================================================== */
export const WavelengthTutorialScene: React.FC<TutorialSceneProps> = ({
  step,
  animT,
  clock,
  lang,
}) => {
  const rawId = useId();
  const safeId = rawId.replace(/[^a-zA-Z0-9_-]/g, '');
  const faceClipId = `wlFaceClip_${safeId}`;
  const hubClipId = `wlHubClip_${safeId}`;

  // Carefully calibrated dial geometry — 100% zero overlap with top pill, bottom spectrum, & right badges
  const CX = 260;
  const CY = 166;
  const R_FACE = 90;
  const R_BEZEL = 100;
  const TARGET_CENTER = 26;
  const WEDGE_W = 11;

  const t = easeOutCubic(animT);

  const wedges = [
    {
      pts: '2',
      color: '#ffaa1d',
      start: TARGET_CENTER - WEDGE_W * 2.5,
      end: TARGET_CENTER - WEDGE_W * 1.5,
      mid: TARGET_CENTER - WEDGE_W * 2,
    },
    {
      pts: '3',
      color: '#ff5722',
      start: TARGET_CENTER - WEDGE_W * 1.5,
      end: TARGET_CENTER - WEDGE_W * 0.5,
      mid: TARGET_CENTER - WEDGE_W * 1,
    },
    {
      pts: '4',
      color: '#3898b8',
      start: TARGET_CENTER - WEDGE_W * 0.5,
      end: TARGET_CENTER + WEDGE_W * 0.5,
      mid: TARGET_CENTER,
    },
    {
      pts: '3',
      color: '#ff5722',
      start: TARGET_CENTER + WEDGE_W * 0.5,
      end: TARGET_CENTER + WEDGE_W * 1.5,
      mid: TARGET_CENTER + WEDGE_W * 1,
    },
    {
      pts: '2',
      color: '#ffaa1d',
      start: TARGET_CENTER + WEDGE_W * 1.5,
      end: TARGET_CENTER + WEDGE_W * 2.5,
      mid: TARGET_CENTER + WEDGE_W * 2,
    },
  ];

  // Needle angle anchored 100% around (CX, CY) with continuous micro-life in every step
  const needleAngle =
    step === 0
      ? -32 + Math.sin(clock * 2.6) * 1.8
      : step === 1
      ? lerp(-32, 0, t) + Math.sin(clock * 3) * 1.2
      : step === 2
      ? 24 + Math.sin(clock * 3.4) * 16
      : lerp(12, TARGET_CENTER, t) + (animT >= 1 ? Math.sin(clock * 5) * 0.8 : 0);

  // Rotational Shutter Wedge Bounds:
  // Step 0: hidden; Step 1: sweeps -90 -> +90; Step 2: full -90..+90; Step 3: sweeps open (-90 -> +90 start)
  const showShutter = step === 1 || step === 2 || (step === 3 && t < 0.99);
  const shutterStart = step === 3 ? lerp(-90, 90, t) : -90;
  const shutterEnd = step === 1 ? lerp(-90, 90, t) : 90;
  const shutterPath = showShutter
    ? describeArcWedge(CX, CY, R_FACE + 1, shutterStart, shutterEnd)
    : '';

  const hotPulse = step === 1 ? 1 + Math.sin(clock * 5.2) * 0.045 : 1;
  const targetTip = polarToXY(CX, CY, R_FACE - 8, TARGET_CENTER);

  return (
    <StageBackdrop bg="#1d1842" accent="#ff595e">
      <defs>
        <clipPath id={faceClipId}>
          <path
            d={`M ${CX - R_FACE} ${CY} A ${R_FACE} ${R_FACE} 0 0 1 ${CX + R_FACE} ${CY} Z`}
          />
        </clipPath>
        <clipPath id={hubClipId}>
          <rect x={CX - 40} y={CY - 40} width="80" height="50" />
        </clipPath>
      </defs>

      {/* Top Step Pill (y=21, h=25 -> y_bot=36, 19px above top gear dot at y=55!) */}
      {step === 0 ? (
        <SvgPill
          x={260}
          y={21}
          w={295}
          h={25}
          bg="#ffca3a"
          fontSize={11}
          scale={easeOutBack(animT)}
          text={
            lang === 'ar'
              ? 'العرّاف وحده يرى مكان الهدف!'
              : 'Only the Psychic sees the target!'
          }
        />
      ) : (
        <SvgPill
          x={260}
          y={21}
          w={250}
          h={25}
          bg="#ffca3a"
          fontSize={11.5}
          scale={step === 1 ? easeOutBack(animT) : 1}
          text={
            lang === 'ar'
              ? 'التلميح: «قهوة الصبح!»'
              : 'Clue: "Morning Coffee!"'
          }
        />
      )}

      {/* Left Psychic Avatar */}
      <SvgPlayerAvatar
        x={66}
        y={96}
        color="#ffca3a"
        label={lang === 'ar' ? 'العرّاف' : 'Psychic'}
        scale={0.86}
        highlight={step === 0 || step === 1}
        crown={true}
        clock={clock}
      />

      {/* Step 0: Sightline from Psychic to Hidden Target */}
      {step === 0 && (
        <line
          x1={94}
          y1={92}
          x2={targetTip.x - 4}
          y2={targetTip.y + 8}
          stroke="#ffca3a"
          strokeWidth="2.8"
          strokeDasharray="6 5"
          strokeDashoffset={-(clock * 26) % 22}
        />
      )}

      {/* Step 1: Psychic Reads Spectrum Card ("Hot") -> Emits Clue */}
      {step === 1 && (
        <path
          d="M 86 122 Q 112 198 148 212"
          fill="none"
          stroke="#fb7185"
          strokeWidth="2.8"
          strokeDasharray="5 5"
          strokeDashoffset={-(clock * 24) % 20}
        />
      )}

      {/* Right Team Avatar */}
      <SvgPlayerAvatar
        x={448}
        y={94}
        color="#00bbf9"
        label={lang === 'ar' ? 'الشلّة' : 'Team'}
        scale={0.86}
        highlight={step === 2 || step === 3}
        clock={clock}
      />

      {/* Semicircle Wavelength Wheel (x=[151..369], y=[55..184]) */}
      <g>
        {/* Scalloped Gear Dots along Outer Rim */}
        {[-80, -60, -40, -20, 0, 20, 40, 60, 80].map((ang) => {
          const p = polarToXY(CX, CY, R_BEZEL + 1, ang);
          return (
            <circle
              key={ang}
              cx={p.x}
              cy={p.y}
              r="8.5"
              fill="#f8f4e8"
              stroke="#161426"
              strokeWidth="3"
            />
          );
        })}

        {/* Navy Bezel */}
        <path
          d={`M ${CX - R_BEZEL} ${CY} A ${R_BEZEL} ${R_BEZEL} 0 0 1 ${CX + R_BEZEL} ${CY} L ${CX + R_BEZEL} ${CY + 10} L ${CX - R_BEZEL} ${CY + 10} Z`}
          fill="#0b2842"
          stroke="#161426"
          strokeWidth="3.8"
          strokeLinejoin="round"
        />

        {/* Inner Clipped Dial Face */}
        <g clipPath={`url(#${faceClipId})`}>
          <path
            d={`M ${CX - R_FACE} ${CY} A ${R_FACE} ${R_FACE} 0 0 1 ${CX + R_FACE} ${CY} Z`}
            fill="#fff9ec"
          />

          {/* Minor Ticks */}
          {[-70, -50, -30, -10, 10, 30, 50, 70].map((a) => {
            const p1 = polarToXY(CX, CY, R_FACE - 3, a);
            const p2 = polarToXY(CX, CY, R_FACE - 10, a);
            return (
              <line
                key={a}
                x1={p1.x}
                y1={p1.y}
                x2={p2.x}
                y2={p2.y}
                stroke="#d6ccb2"
                strokeWidth="2"
                strokeLinecap="round"
              />
            );
          })}

          {/* 5 Scoring Target Wedges (2 - 3 - 4 - 3 - 2) */}
          <g>
            {wedges.map((w, i) => {
              const d = describeArcWedge(CX, CY, R_FACE, w.start, w.end);
              const lbl = polarToXY(CX, CY, R_FACE - 15, w.mid);
              const isCenter = w.pts === '4';
              const glintOpacity =
                isCenter && (step === 0 || step === 3)
                  ? 0.18 + Math.sin(clock * 6) * 0.14
                  : 0;
              return (
                <g key={i}>
                  <path
                    d={d}
                    fill={w.color}
                    stroke="#161426"
                    strokeWidth="2.2"
                    strokeLinejoin="round"
                  />
                  {glintOpacity > 0 && (
                    <path d={d} fill={`rgba(255,255,255,${glintOpacity.toFixed(2)})`} />
                  )}
                  <text
                    x={lbl.x}
                    y={lbl.y}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill="#161426"
                    fontSize="10.5"
                    fontWeight="900"
                    transform={`rotate(${w.mid}, ${lbl.x}, ${lbl.y})`}
                  >
                    {w.pts}
                  </text>
                </g>
              );
            })}
          </g>

          {/* Rotational Blue Shutter Screen (Sweeps Closed in Step 1, Sweeps Open in Step 3!) */}
          {shutterPath && (
            <g>
              <path
                d={shutterPath}
                fill="#11365c"
                stroke="#161426"
                strokeWidth="3"
                strokeLinejoin="round"
              />
              {(step === 2 || (step === 1 && t > 0.65)) && (
                <g
                  transform={`translate(${CX}, ${CY - 52}) scale(${
                    1 + Math.sin(clock * 4.5) * 0.06
                  })`}
                >
                  <circle
                    cx="0"
                    cy="0"
                    r="15"
                    fill="#1b4d80"
                    stroke="#161426"
                    strokeWidth="2.8"
                  />
                  <text
                    x="0"
                    y="0.5"
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill="#ffca3a"
                    fontSize="17"
                    fontWeight="900"
                  >
                    ?
                  </text>
                </g>
              )}
            </g>
          )}

          <path
            d={`M ${CX - R_FACE} ${CY} A ${R_FACE} ${R_FACE} 0 0 1 ${CX + R_FACE} ${CY}`}
            fill="none"
            stroke="#161426"
            strokeWidth="4"
          />
        </g>

        {/* Step 3 Celebration Sparkle Rays Above Bullseye Wedge */}
        {step === 3 && animT > 0.45 && (
          <g
            transform={`translate(${targetTip.x + 8}, ${targetTip.y - 8}) scale(${
              0.85 + Math.sin(clock * 7) * 0.18
            })`}
          >
            <polygon
              points="0,-10 2.5,-2.5 10,0 2.5,2.5 0,10 -2.5,2.5 -10,0 -2.5,-2.5"
              fill="#ffca3a"
              stroke="#161426"
              strokeWidth="1.8"
            />
          </g>
        )}

        {/* Clipped Mint Ring Behind Hub (Flush with bezel base CY+10=176!) */}
        <g clipPath={`url(#${hubClipId})`}>
          <circle
            cx={CX}
            cy={CY}
            r="23"
            fill="#6ee7b7"
            stroke="#161426"
            strokeWidth="3"
          />
        </g>

        {/* Crimson Pointer Needle — Pure SVG rotate(angle, CX, CY) NEVER detaches! */}
        <g transform={`rotate(${needleAngle}, ${CX}, ${CY})`}>
          <path
            d={`M ${CX - 6} ${CY} L ${CX - 2.2} ${CY - (R_FACE - 10)} A 2.2 2.2 0 0 1 ${CX + 2.2} ${CY - (R_FACE - 10)} L ${CX + 6} ${CY} Z`}
            fill="#ff3b5c"
            stroke="#161426"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <line
            x1={CX - 1.2}
            y1={CY - 22}
            x2={CX - 0.8}
            y2={CY - (R_FACE - 17)}
            stroke="rgba(255,255,255,0.55)"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </g>

        {/* Central Red Hub Knob (y_bot = 166 + 18 = 184, 13.5px clear above Spectrum Card!) */}
        <circle
          cx={CX}
          cy={CY}
          r="16.5"
          fill="#e11538"
          stroke="#161426"
          strokeWidth="3.4"
        />
        <circle
          cx={CX}
          cy={CY - 1}
          r="11"
          fill="#ff3b5c"
          stroke="#161426"
          strokeWidth="2"
        />
        <ellipse
          cx={CX - 4}
          cy={CY - 4.5}
          rx="3.6"
          ry="2.2"
          fill="rgba(255,255,255,0.55)"
        />
      </g>

      {/* Bottom Spectrum Card (y=213, h=28 -> y=[197.5..228.5], zero collision!) */}
      <g transform="translate(260, 213)">
        <rect
          x="-118"
          y="-14"
          width="118"
          height="28"
          rx="9"
          fill="#38bdf8"
          stroke="#161426"
          strokeWidth="3"
        />
        <g transform={`scale(${hotPulse})`}>
          <rect
            x="0"
            y="-14"
            width="118"
            height="28"
            rx="9"
            fill="#fb7185"
            stroke={step === 1 ? '#ffca3a' : '#161426'}
            strokeWidth={step === 1 ? '3.5' : '3'}
          />
          <text
            x="60"
            y="0.5"
            textAnchor="middle"
            dominantBaseline="central"
            fill="#161426"
            fontSize="12.5"
            fontWeight="900"
          >
            {lang === 'ar' ? 'ساخن' : 'Hot'}
          </text>
        </g>
        <text
          x="-60"
          y="0.5"
          textAnchor="middle"
          dominantBaseline="central"
          fill="#161426"
          fontSize="12.5"
          fontWeight="900"
        >
          {lang === 'ar' ? 'بارد' : 'Cold'}
        </text>
        <circle
          cx="0"
          cy="0"
          r="10.5"
          fill="#fff9ec"
          stroke="#161426"
          strokeWidth="2.8"
        />
        <SvgDoubleArrow x={0} y={0} />
      </g>

      {/* Step 2 & Step 3 Right Callout Badges (x=444, w=130 -> x=[374..514], zero bezel collision!) */}
      {step === 2 && (
        <g transform={`translate(0, ${Math.sin(clock * 4.2) * 2})`}>
          <SvgPill
            x={444}
            y={162}
            w={130}
            h={26}
            bg="#00bbf9"
            fontSize={11}
            scale={easeOutBack(animT)}
            text={lang === 'ar' ? 'ثبّت المؤشر!' : 'Lock needle!'}
          />
        </g>
      )}

      {step === 3 && (
        <SvgScoreBadge
          x={443}
          y={162}
          w={132}
          bg="#8ac926"
          animT={animT}
          clock={clock}
          text={lang === 'ar' ? 'بالمنتصف! +4' : 'Bullseye! +4'}
        />
      )}
    </StageBackdrop>
  );
};

/* ============================================================================
 * 2. CHAMELEON (برّا السالفة) — Pure Native SVG 4-Step Scene
 * ========================================================================== */
export const ChameleonTutorialScene: React.FC<TutorialSceneProps> = ({
  step,
  animT,
  clock,
  lang,
}) => {
  const players = [
    { x: 82, nameAr: 'أحمد', nameEn: 'Rami', color: '#00bbf9', imp: false },
    { x: 200, nameAr: 'سارة', nameEn: 'Sara', color: '#8ac926', imp: false },
    { x: 318, nameAr: 'نور', nameEn: 'Noor', color: '#ff595e', imp: true },
    { x: 436, nameAr: 'عمر', nameEn: 'Omar', color: '#ffca3a', imp: false },
  ];

  const gridWords =
    lang === 'ar'
      ? ['بيتزا', 'شاورما', 'سوشي', 'برغر', 'فلافل', 'منسف']
      : ['Pizza', 'Shawarma', 'Sushi', 'Burger', 'Falafel', 'Mansaf'];

  // Step 3 scanning reticle moves across grid cells then locks onto Shawarma (col 1, row 0 -> 304, 74)
  const scanProg = clamp01(animT * 1.25);
  const reticleX =
    scanProg < 0.45
      ? lerp(196, 196, scanProg / 0.45)
      : lerp(196, 304, (scanProg - 0.45) / 0.55);
  const reticleY =
    scanProg < 0.45
      ? lerp(74, 124, scanProg / 0.45)
      : lerp(124, 74, (scanProg - 0.45) / 0.55);

  return (
    <StageBackdrop bg="#233163" accent="#5c73b8">
      {/* Category Header */}
      <SvgPill
        x={260}
        y={22}
        w={220}
        h={25}
        bg="#ffca3a"
        fontSize={11.5}
        text={lang === 'ar' ? 'الموضوع: أكلات ومأكولات' : 'Topic: Foods & Dishes'}
      />

      {step < 3 ? (
        <>
          {/* 4 Players Row */}
          {players.map((p, idx) => {
            const cardPop = easeOutBack(clamp01(animT * 1.3 - idx * 0.1));
            const floatRoleY = Math.sin(clock * 3.6 + idx * 0.9) * 2.5;
            return (
              <g key={idx}>
                <SvgPlayerAvatar
                  x={p.x}
                  y={142}
                  color={p.color}
                  label={lang === 'ar' ? p.nameAr : p.nameEn}
                  scale={0.88}
                  highlight={step === 1 && (idx === 0 || idx === 2)}
                  suspect={(step === 0 || step === 2) && p.imp}
                  clock={clock}
                />

                {/* Animated Sweat Drop on Impostor during Q&A (Step 1) */}
                {step === 1 && p.imp && (
                  <path
                    d="M 0 -5 C 3 0 3 5 0 5 C -3 5 -3 0 0 -5 Z"
                    fill="#38bdf8"
                    stroke="#161426"
                    strokeWidth="1.4"
                    transform={`translate(${p.x + 21}, ${122 + ((clock * 18) % 14)})`}
                  />
                )}

                {/* Step 0: Floating Secret Role Badges Above Every Player */}
                {step === 0 && (
                  <g
                    transform={`translate(${p.x}, ${82 + floatRoleY}) scale(${Math.max(
                      0.01,
                      cardPop
                    )})`}
                  >
                    <rect
                      x="-48"
                      y="-13.5"
                      width="96"
                      height="27"
                      rx="9.5"
                      fill={p.imp ? '#ff595e' : '#8ac926'}
                      stroke="#161426"
                      strokeWidth="3"
                    />
                    <text
                      x="0"
                      y="0.5"
                      textAnchor="middle"
                      dominantBaseline="central"
                      fill={p.imp ? '#ffffff' : '#161426'}
                      fontSize="11.2"
                      fontWeight="900"
                    >
                      {p.imp
                        ? lang === 'ar'
                          ? 'برّا السالفة!'
                          : 'Impostor!'
                        : lang === 'ar'
                        ? 'شاورما'
                        : 'Shawarma'}
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* Step 1: Q&A Pills Cleanly Above Q&A Arc (Zero overlap!) */}
          {step === 1 && (
            <g>
              <path
                d="M 96 122 Q 200 94 304 122"
                fill="none"
                stroke="#ffca3a"
                strokeWidth="3"
                strokeDasharray="6 5"
                strokeDashoffset={-(clock * 28) % 22}
              />
              <SvgPill
                x={140}
                y={64}
                w={186}
                h={26}
                bg="#fff9ec"
                fontSize={11}
                scale={easeOutBack(animT)}
                text={lang === 'ar' ? 'س: معها ثوم ومخلل؟' : 'Q: Served with garlic?'}
              />
              <SvgPill
                x={356}
                y={64}
                w={176}
                h={26}
                bg="#ff595e"
                fg="#ffffff"
                fontSize={11}
                scale={easeOutBack(clamp01((animT - 0.15) * 1.18))}
                text={lang === 'ar' ? 'ج: إيه.. أحياناً!' : 'A: Uh.. sometimes!'}
              />
            </g>
          )}

          {/* Step 2: Everyone Votes Against Suspect #3 */}
          {step === 2 && (
            <g>
              {[82, 200, 436].map((fromX, i) => (
                <line
                  key={i}
                  x1={fromX}
                  y1={116}
                  x2={318}
                  y2={88}
                  stroke="#ffca3a"
                  strokeWidth="3.2"
                  strokeDasharray="5 4"
                  strokeDashoffset={-(clock * 26) % 18}
                />
              ))}
              <SvgScoreBadge
                x={318}
                y={66}
                w={170}
                bg="#ff595e"
                fg="#ffffff"
                animT={animT}
                clock={clock}
                text={lang === 'ar' ? 'انكشف! 3 أصوات' : 'Caught! 3 Votes'}
              />
            </g>
          )}

          {/* Generous Bottom Step Explanation Pill (w=415 fits 50-char EN cleanly!) */}
          <SvgPill
            x={260}
            y={213}
            w={415}
            h={25}
            bg="#161426"
            fg="#ffca3a"
            fontSize={11}
            text={
              step === 0
                ? lang === 'ar'
                  ? 'الكل يعرف الكلمة السرية ما عدا لاعب واحد فقط!'
                  : 'Everyone sees the secret word except one impostor!'
                : step === 1
                ? lang === 'ar'
                  ? 'اسألوا بذكاء بدون ما تفضحوا الكلمة للجاسوس!'
                  : 'Ask subtle questions without giving away the word!'
                : lang === 'ar'
                ? 'صوّتوا معاً لكشف الشخص اللي برّا السالفة!'
                : 'Vote together on who you suspect is faking it!'
            }
          />
        </>
      ) : (
        /* Step 3: Caught Chameleon Scans Topic Grid & Locks Onto Secret Word! */
        <g>
          <SvgPlayerAvatar
            x={74}
            y={120}
            color="#ff595e"
            label={lang === 'ar' ? 'نور' : 'Noor'}
            scale={0.88}
            suspect={true}
            clock={clock}
          />

          {/* Scanning Sightline from Caught Impostor to Active Grid Target */}
          <line
            x1={102}
            y1={114}
            x2={reticleX - 44}
            y2={reticleY}
            stroke="#ffca3a"
            strokeWidth="2.8"
            strokeDasharray="5 4"
            strokeDashoffset={-(clock * 28) % 18}
          />

          <g transform="translate(148, 56)">
            {gridWords.map((w, idx) => {
              const col = idx % 3;
              const row = Math.floor(idx / 3);
              const cx = col * 108 + 48;
              const cy = row * 50 + 18;
              const isSecret = idx === 1;
              const locked = isSecret && scanProg >= 0.95;
              const pulse = locked ? 1 + Math.sin(clock * 5.2) * 0.045 : 1;
              return (
                <g key={idx} transform={`translate(${cx}, ${cy}) scale(${pulse})`}>
                  <rect
                    x="-47"
                    y="-19"
                    width="94"
                    height="38"
                    rx="11"
                    fill={locked ? '#8ac926' : '#fff9ec'}
                    stroke="#161426"
                    strokeWidth="3"
                  />
                  <text
                    x="0"
                    y="0.5"
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill="#161426"
                    fontSize="12.5"
                    fontWeight="900"
                  >
                    {w}
                  </text>
                </g>
              );
            })}
          </g>

          {/* Animated Sniper Reticle Ring Locking onto Shawarma */}
          <g
            transform={`translate(${reticleX}, ${reticleY}) scale(${
              1 + Math.sin(clock * 6) * 0.06
            })`}
          >
            <rect
              x="-51"
              y="-23"
              width="102"
              height="46"
              rx="13"
              fill="none"
              stroke="#ffca3a"
              strokeWidth="3"
              strokeDasharray="8 6"
            />
          </g>

          <SvgScoreBadge
            x={292}
            y={204}
            w={295}
            bg="#ffca3a"
            animT={animT}
            clock={clock}
            text={
              lang === 'ar'
                ? 'فرصة أخيرة لحزر الكلمة (+3)!'
                : 'Last chance to guess word (+3)!'
            }
          />
        </g>
      )}
    </StageBackdrop>
  );
};

/* ============================================================================
 * 3. DIXIT DREAMS (خيال الشلّة) — Pure Native SVG 4-Step Scene
 * ========================================================================== */
const PureSurrealCard: React.FC<{
  x: number;
  y: number;
  rot?: number;
  scale?: number;
  scaleX?: number;
  variant: 0 | 1 | 2;
  faceDown?: boolean;
  winner?: boolean;
  votes?: number;
  voteScale?: number;
  decoyBonusText?: string;
}> = ({
  x,
  y,
  rot = 0,
  scale = 1,
  scaleX = 1,
  variant,
  faceDown = false,
  winner = false,
  votes = 0,
  voteScale = 1,
  decoyBonusText,
}) => {
  return (
    <g
      transform={`translate(${x}, ${y}) rotate(${rot}) scale(${
        scale * Math.max(0.08, scaleX)
      }, ${scale})`}
    >
      <rect x="-34" y="-43" width="68" height="90" rx="12" fill="#120f29" />
      {faceDown ? (
        <g>
          <rect
            x="-34"
            y="-47"
            width="68"
            height="90"
            rx="12"
            fill="#6d28d9"
            stroke="#161426"
            strokeWidth="3.4"
          />
          <circle
            cx="0"
            cy="-2"
            r="17"
            fill="none"
            stroke="#ffca3a"
            strokeWidth="2.4"
            strokeDasharray="4 4"
          />
          <polygon
            points="0,-11 3,-3.5 10,-2 3,1 0,8.5 -3,1 -10,-2 -3,-3.5"
            fill="#ffca3a"
          />
        </g>
      ) : (
        <g>
          <rect
            x="-34"
            y="-47"
            width="68"
            height="90"
            rx="12"
            fill={variant === 0 ? '#1e1b4b' : variant === 1 ? '#0f4c5c' : '#4a154b'}
            stroke={winner ? '#ffca3a' : '#161426'}
            strokeWidth={winner ? '4.2' : '3.4'}
          />
          {variant === 0 && (
            <g>
              <circle cx="8" cy="-21" r="12" fill="#ffca3a" />
              <circle cx="13.5" cy="-24" r="9.5" fill="#1e1b4b" />
              <line x1="-12" y1="31" x2="2" y2="-15" stroke="#fff9ec" strokeWidth="2.4" />
              <line x1="-2" y1="31" x2="12" y2="-15" stroke="#fff9ec" strokeWidth="2.4" />
              <line x1="-9" y1="18" x2="1" y2="18" stroke="#fff9ec" strokeWidth="2" />
              <line x1="-5" y1="5" x2="5" y2="5" stroke="#fff9ec" strokeWidth="2" />
              <line x1="-1" y1="-7" x2="9" y2="-7" stroke="#fff9ec" strokeWidth="2" />
            </g>
          )}
          {variant === 1 && (
            <g>
              <circle
                cx="0"
                cy="-16"
                r="15"
                fill="#ff595e"
                stroke="#161426"
                strokeWidth="2.4"
              />
              <line x1="-6" y1="-1" x2="-3" y2="14" stroke="#fff9ec" strokeWidth="2" />
              <line x1="6" y1="-1" x2="3" y2="14" stroke="#fff9ec" strokeWidth="2" />
              <ellipse
                cx="0"
                cy="19"
                rx="15"
                ry="6"
                fill="#8ac926"
                stroke="#161426"
                strokeWidth="2"
              />
            </g>
          )}
          {variant === 2 && (
            <g>
              <polygon
                points="-14,-22 14,-22 0,-2 -14,18 14,18"
                fill="#00bbf9"
                stroke="#fff9ec"
                strokeWidth="2"
              />
              <circle cx="0" cy="-28" r="3.5" fill="#ffca3a" />
            </g>
          )}
        </g>
      )}

      {winner && (
        <polygon
          points="-10,-51 -5,-59 0,-53 5,-59 10,-51"
          fill="#ffca3a"
          stroke="#161426"
          strokeWidth="2.2"
          strokeLinejoin="round"
        />
      )}

      {votes > 0 && voteScale > 0.02 && (
        <g transform={`translate(25, -39) scale(${voteScale})`}>
          <circle
            cx="0"
            cy="0"
            r="11.5"
            fill="#8ac926"
            stroke="#161426"
            strokeWidth="2.5"
          />
          <text
            x="0"
            y="0.5"
            textAnchor="middle"
            dominantBaseline="central"
            fill="#161426"
            fontSize="10.2"
            fontWeight="900"
          >
            +{votes}
          </text>
        </g>
      )}

      {decoyBonusText && (
        <g transform="translate(0, 40)">
          <rect
            x="-30"
            y="-9"
            width="60"
            height="18"
            rx="9"
            fill="#00bbf9"
            stroke="#161426"
            strokeWidth="2"
          />
          <text
            x="0"
            y="0.5"
            textAnchor="middle"
            dominantBaseline="central"
            fill="#161426"
            fontSize="9.2"
            fontWeight="900"
          >
            {decoyBonusText}
          </text>
        </g>
      )}
    </g>
  );
};

export const DixitTutorialScene: React.FC<TutorialSceneProps> = ({
  step,
  animT,
  clock,
  lang,
}) => {
  const t = easeOutCubic(animT);
  // Continuous gentle float in ALL 4 steps so cards never freeze dead!
  const float0 = Math.sin(clock * 3.4) * 2.8;
  const float1 = Math.sin(clock * 3.4 + 1.8) * 2.4;
  const float2 = Math.sin(clock * 3.4 + 3.6) * 2.4;

  // Smooth card positions across all 4 steps (no teleporting in Step 2!)
  const c0x =
    step === 0
      ? lerp(132, 260, t)
      : step === 1
      ? 260
      : 260;
  const c1x =
    step === 1
      ? lerp(388, 226, t)
      : step === 2
      ? lerp(226, 172, t)
      : 172;
  const c2x =
    step === 1
      ? lerp(404, 294, t)
      : step === 2
      ? lerp(294, 348, t)
      : 348;

  // Step 2 2D horizontal card-flip animation (faceDown -> faceUp)
  const flipProg = step === 2 ? clamp01(animT * 1.45) : 1;
  const cardFaceDown =
    step === 1 || (step === 2 && flipProg < 0.5);
  const cardScaleX =
    step === 2
      ? flipProg < 0.5
        ? 1 - flipProg * 2
        : (flipProg - 0.5) * 2
      : 1;
  const votePop =
    step === 2
      ? easeOutBack(clamp01((animT - 0.55) * 2.2))
      : step === 3
      ? 1
      : 0;

  return (
    <StageBackdrop bg="#26174a" accent="#9b5de5">
      {/* Generous Clue Banner (w=345 fits 38-char EN cleanly!) */}
      <SvgPill
        x={260}
        y={23}
        w={345}
        h={26}
        bg="#ffca3a"
        fontSize={11.5}
        scale={step === 0 ? easeOutBack(animT) : 1}
        text={
          lang === 'ar'
            ? 'تلميح الراوي: «رحلة إلى السماء»'
            : 'Storyteller Clue: "Journey to the Sky"'
        }
      />

      {/* Left Storyteller */}
      <SvgPlayerAvatar
        x={60}
        y={124}
        color="#ffca3a"
        label={lang === 'ar' ? 'الراوي' : 'Story'}
        scale={0.84}
        crown={true}
        highlight={step === 0 || step === 3}
        clock={clock}
      />

      {/* Right Friends */}
      <SvgPlayerAvatar
        x={460}
        y={124}
        color="#00bbf9"
        label={lang === 'ar' ? 'الأصحاب' : 'Friends'}
        scale={0.84}
        highlight={step === 1 || step === 2}
        clock={clock}
      />

      {/* Step 2 Animated Vote Beams from Friends */}
      {step === 2 && animT > 0.5 && (
        <g>
          <line
            x1={428}
            y1={116}
            x2={288}
            y2={94}
            stroke="#8ac926"
            strokeWidth="2.8"
            strokeDasharray="5 4"
            strokeDashoffset={-(clock * 26) % 18}
          />
          <line
            x1={428}
            y1={128}
            x2={202}
            y2={98}
            stroke="#00bbf9"
            strokeWidth="2.4"
            strokeDasharray="5 4"
            strokeDashoffset={-(clock * 22) % 18}
          />
        </g>
      )}

      {/* Decoy Card 1 */}
      {step >= 1 && (
        <PureSurrealCard
          x={c1x}
          y={122 + float1}
          rot={step === 1 ? -7 : step === 2 ? lerp(-7, 0, t) : 0}
          scaleX={cardScaleX}
          variant={1}
          faceDown={cardFaceDown}
          votes={step >= 2 ? 1 : 0}
          voteScale={votePop}
          decoyBonusText={
            step === 3 ? (lang === 'ar' ? 'تمويه +1' : 'Decoy +1') : undefined
          }
        />
      )}

      {/* Decoy Card 2 */}
      {step >= 1 && (
        <PureSurrealCard
          x={c2x}
          y={122 + float2}
          rot={step === 1 ? 7 : step === 2 ? lerp(7, 0, t) : 0}
          scaleX={cardScaleX}
          variant={2}
          faceDown={cardFaceDown}
        />
      )}

      {/* Storyteller's Real Card */}
      <PureSurrealCard
        x={c0x}
        y={(step === 3 ? 118 : 122) + float0}
        scale={step === 3 ? 1.05 : 1}
        scaleX={cardScaleX}
        variant={0}
        faceDown={cardFaceDown}
        winner={step === 3}
        votes={step >= 2 ? 2 : 0}
        voteScale={votePop}
      />

      {step === 3 ? (
        <SvgScoreBadge
          x={260}
          y={212}
          w={360}
          bg="#8ac926"
          animT={animT}
          clock={clock}
          text={
            lang === 'ar'
              ? 'عرفها البعض! +3 للراوي ومن أصاب'
              : 'Some found it! +3 Storyteller & voters'
          }
        />
      ) : (
        <SvgPill
          x={260}
          y={213}
          w={410}
          h={25}
          bg="#161426"
          fg="#fff9ec"
          fontSize={11}
          text={
            step === 0
              ? lang === 'ar'
                ? 'الراوي يختار لوحة ويعطي تلميحاً خيالياً غامضاً'
                : 'Storyteller picks 1 card & gives a poetic clue'
              : step === 1
              ? lang === 'ar'
                ? 'البقية يختارون لوحات مشابهة من يدهم لتمويه الشلّة!'
                : 'Others play matching decoy cards face-down!'
              : lang === 'ar'
              ? 'تُقلب اللوحات مكشوفة ويصوّت الجميع على لوحة الراوي'
              : 'Cards flip face-up & everyone votes for the real one'
          }
        />
      )}
    </StageBackdrop>
  );
};

/* ============================================================================
 * 4. TABOO RUSH (الكلمات الممنوعة) — Pure Native SVG 4-Step Scene
 * ========================================================================== */
export const TabooTutorialScene: React.FC<TutorialSceneProps> = ({
  step,
  animT,
  clock,
  lang,
}) => {
  // All 5 strictly forbidden words matching rules[0]!
  const forbidden =
    lang === 'ar'
      ? ['كافيين', 'فنجان', 'سهر', 'صباح', 'بن']
      : ['Caffeine', 'Cup', 'Awake', 'Morning', 'Beans'];

  const shakeX = step === 2 ? Math.sin(clock * 32) * 3.5 * (1 - animT * 0.35) : 0;
  const handAngle = (clock * 145) % 360;
  const secsLeft = Math.max(12, 58 - Math.floor((clock * 4) % 42));
  const capPress = Math.abs(Math.sin(clock * 7)) * 5.5;

  return (
    <StageBackdrop bg="#2a1638" accent="#ff595e">
      {/* Left Ticking Stopwatch — Hand anchored 100% at (0, 0)! */}
      <g transform="translate(68, 62)">
        <rect
          x="-7"
          y="-30"
          width="14"
          height="6"
          rx="3"
          fill="#ffca3a"
          stroke="#161426"
          strokeWidth="2.2"
        />
        <circle
          cx="0"
          cy="0"
          r="24"
          fill="#fff9ec"
          stroke="#161426"
          strokeWidth="3.4"
        />
        <circle cx="0" cy="0" r="2.6" fill="#161426" />
        <line
          x1="0"
          y1="0"
          x2="0"
          y2="-15"
          stroke="#ff595e"
          strokeWidth="3"
          strokeLinecap="round"
          transform={`rotate(${handAngle}, 0, 0)`}
        />
        <rect x="-23" y="30" width="46" height="19" rx="9.5" fill="#161426" />
        <text
          x="0"
          y="40"
          textAnchor="middle"
          dominantBaseline="central"
          fill="#ffca3a"
          fontSize="10.8"
          fontWeight="900"
        >
          {secsLeft}s
        </text>
      </g>

      {/* Describer Avatar Bottom Left */}
      <SvgPlayerAvatar
        x={68}
        y={168}
        color="#00bbf9"
        label={lang === 'ar' ? 'الشارح' : 'Speaker'}
        scale={0.82}
        highlight={step === 0 || step === 1}
        suspect={step === 2}
        clock={clock}
      />

      {/* Center Taboo Card with Target + ALL 5 Forbidden Words (x=[134..274], y=[28..212]) */}
      <g transform={`translate(${204 + shakeX}, 120)`}>
        <rect x="-70" y="-88" width="140" height="180" rx="15" fill="#120f29" />
        <rect
          x="-70"
          y="-92"
          width="140"
          height="180"
          rx="15"
          fill="#fff9ec"
          stroke="#161426"
          strokeWidth="3.8"
        />

        {/* Green Target Header */}
        <rect
          x="-60"
          y="-83"
          width="120"
          height="32"
          rx="9"
          fill="#8ac926"
          stroke="#161426"
          strokeWidth="2.8"
        />
        <text
          x="0"
          y="-66.5"
          textAnchor="middle"
          dominantBaseline="central"
          fill="#161426"
          fontSize="15"
          fontWeight="900"
        >
          {lang === 'ar' ? 'قهوة' : 'COFFEE'}
        </text>

        {/* 5 Forbidden Words with Pure Vector Cross Icons */}
        {forbidden.map((word, idx) => {
          const wy = -33 + idx * 24;
          const slipped = step === 2 && idx === 1;
          return (
            <g key={idx} transform={`translate(0, ${wy})`}>
              <rect
                x="-58"
                y="-9.5"
                width="116"
                height="19"
                rx="6.5"
                fill={slipped ? '#ff595e' : '#ffe4e6'}
                stroke="#161426"
                strokeWidth="2"
              />
              <SvgCrossMark
                x={-44}
                y={0}
                size={0.8}
                color={slipped ? '#ffffff' : '#b91c1c'}
              />
              <text
                x="6"
                y="0.5"
                textAnchor="middle"
                dominantBaseline="central"
                fill={slipped ? '#ffffff' : '#991b1b'}
                fontSize="11"
                fontWeight="800"
              >
                {word}
              </text>
            </g>
          );
        })}
      </g>

      {/* Right Column Action per Step (x=396, clear corridor x=[284..508]!) */}
      {step === 0 && (
        <g>
          <SvgPill
            x={396}
            y={88}
            w={204}
            h={30}
            bg="#ffca3a"
            fontSize={11}
            scale={easeOutBack(animT)}
            text={
              lang === 'ar'
                ? '5 كلمات ممنوعة تماماً!'
                : '5 strictly forbidden words!'
            }
          />
          <line
            x1={366}
            y1={154}
            x2={278}
            y2={132}
            stroke="#ff595e"
            strokeWidth="2.5"
            strokeDasharray="5 4"
            strokeDashoffset={-(clock * 22) % 18}
          />
          <SvgPlayerAvatar
            x={396}
            y={164}
            color="#ff595e"
            label={lang === 'ar' ? 'المراقب' : 'Watcher'}
            scale={0.78}
            clock={clock}
          />
        </g>
      )}

      {step === 1 && (
        <g>
          <SvgPill
            x={396}
            y={68}
            w={206}
            h={30}
            bg="#8ac926"
            fontSize={11}
            scale={easeOutBack(animT)}
            text={
              lang === 'ar'
                ? '«مشروب بني يصحصحك!»'
                : '"Hot brown drink to wake up!"'
            }
          />
          <g transform={`translate(0, ${Math.sin(clock * 4.5) * 2.5})`}>
            <SvgPill
              x={396}
              y={114}
              w={148}
              h={26}
              bg="#fff9ec"
              fontSize={11.5}
              scale={easeOutBack(clamp01((animT - 0.15) * 1.2))}
              text={lang === 'ar' ? 'الشلّة: قهوة!' : 'Team: COFFEE!'}
            />
          </g>
          <SvgPlayerAvatar
            x={396}
            y={172}
            color="#ffca3a"
            label={lang === 'ar' ? 'الشلّة' : 'Team'}
            scale={0.78}
            highlight={true}
            clock={clock}
          />
        </g>
      )}

      {step === 2 && (
        <g>
          <SvgPill
            x={396}
            y={54}
            w={204}
            h={28}
            bg="#ff595e"
            fg="#ffffff"
            fontSize={11}
            scale={easeOutBack(animT)}
            text={
              lang === 'ar'
                ? 'زلّ لسانه وقال «فنجان»!'
                : 'Slipped & said "Cup"!'
            }
          />
          {/* Watcher Pressing Stationary-Base 3D Red Buzzer */}
          <SvgPlayerAvatar
            x={468}
            y={152}
            color="#ff595e"
            label={lang === 'ar' ? 'المراقب' : 'Watcher'}
            scale={0.74}
            highlight={true}
            clock={clock}
          />
          <g transform="translate(362, 148)">
            {/* Stationary Table Shadow & Slate Base */}
            <ellipse cx="0" cy="20" rx="42" ry="10" fill="#120f29" />
            <rect
              x="-38"
              y="6"
              width="76"
              height="14"
              rx="6"
              fill="#475569"
              stroke="#161426"
              strokeWidth="3"
            />
            {/* Depressing Red Dome Cap ONLY! */}
            <g transform={`translate(0, ${capPress})`}>
              <ellipse
                cx="0"
                cy="0"
                rx="32"
                ry="14.5"
                fill="#ff595e"
                stroke="#161426"
                strokeWidth="3.2"
              />
              <text
                x="0"
                y="0.5"
                textAnchor="middle"
                dominantBaseline="central"
                fill="#ffffff"
                fontSize="11.5"
                fontWeight="900"
              >
                BUZZ!
              </text>
            </g>
            {/* Radiating Buzzer Shockwaves */}
            <path
              d="M -28 -18 Q 0 -30 28 -18"
              fill="none"
              stroke="#ffca3a"
              strokeWidth="2.5"
              strokeLinecap="round"
              opacity={0.35 + Math.abs(Math.sin(clock * 7)) * 0.65}
            />
          </g>
        </g>
      )}

      {step === 3 && (
        <g>
          <g transform={`translate(0, ${Math.sin(clock * 4) * 2})`}>
            <SvgPill
              x={396}
              y={66}
              w={172}
              h={27}
              bg="#8ac926"
              fontSize={11.5}
              scale={easeOutBack(animT)}
              text={lang === 'ar' ? 'قهوة (+1)' : 'Coffee (+1)'}
            />
          </g>
          <g transform={`translate(0, ${Math.sin(clock * 4 + 1.2) * 2})`}>
            <SvgPill
              x={396}
              y={104}
              w={172}
              h={27}
              bg="#8ac926"
              fontSize={11.5}
              scale={easeOutBack(clamp01((animT - 0.15) * 1.2))}
              text={lang === 'ar' ? 'طيارة (+1)' : 'Airplane (+1)'}
            />
          </g>
          <SvgScoreBadge
            x={396}
            y={158}
            w={204}
            bg="#ffca3a"
            animT={animT}
            clock={clock}
            text={
              lang === 'ar'
                ? 'أكبر عدد بطاقات يفوز!'
                : 'Most cards in 60s wins!'
            }
          />
        </g>
      )}
    </StageBackdrop>
  );
};

/* ============================================================================
 * 5. SOLE WITNESS (الشاهد الوحيد) — Pure Native SVG 4-Step Scene
 * ========================================================================== */
const CuteWeirdMonster: React.FC<{
  x: number;
  y: number;
  scale?: number;
  opacity?: number;
}> = ({ x, y, scale = 1, opacity = 1 }) => (
  <g transform={`translate(${x}, ${y}) scale(${scale})`} opacity={opacity}>
    <path
      d="M -22 -26 L -34 -48 L -10 -34 Z"
      fill="#ffca3a"
      stroke="#161426"
      strokeWidth="3"
      strokeLinejoin="round"
    />
    <path
      d="M 22 -26 L 34 -48 L 10 -34 Z"
      fill="#ffca3a"
      stroke="#161426"
      strokeWidth="3"
      strokeLinejoin="round"
    />
    <rect
      x="-36"
      y="-34"
      width="72"
      height="68"
      rx="32"
      fill="#9b5de5"
      stroke="#161426"
      strokeWidth="3.8"
    />
    {[-15, 0, 15].map((ex, i) => (
      <g key={i} transform={`translate(${ex}, -10)`}>
        <circle cx="0" cy="0" r="7" fill="#ffffff" stroke="#161426" strokeWidth="2.2" />
        <circle cx="0" cy="0" r="3" fill="#161426" />
      </g>
    ))}
    <path
      d="M -16 12 L -8 18 L 0 12 L 8 18 L 16 12"
      fill="none"
      stroke="#fff9ec"
      strokeWidth="3"
      strokeLinecap="round"
    />
  </g>
);

export const WitnessTutorialScene: React.FC<TutorialSceneProps> = ({
  step,
  animT,
  clock,
  lang,
}) => {
  // Deterministic Step 0 peek-then-vanish: guaranteed 100% visible during entrance (animT < 1), then cycles!
  const postEntranceCycle = animT < 1 ? 0.25 : (clock * 0.36) % 1;
  const step0Visible = postEntranceCycle < 0.68;
  const step0Opacity = step0Visible
    ? 1
    : Math.max(0.12, 1 - (postEntranceCycle - 0.68) * 3.5);
  const secsRemaining = step0Visible
    ? Math.max(1, Math.ceil((1 - postEntranceCycle / 0.68) * 10))
    : 0;

  const drawProg = 0.3 + (Math.sin(clock * 2.8) * 0.5 + 0.5) * 0.7;

  return (
    <StageBackdrop bg="#152b44" accent="#00bbf9">
      {/* Witness Avatar Left */}
      <SvgPlayerAvatar
        x={62}
        y={134}
        color="#ffca3a"
        label={lang === 'ar' ? 'الشاهد' : 'Witness'}
        scale={0.84}
        highlight={step === 0 || step === 1}
        clock={clock}
      />

      {/* Step 0: 10s Peek & Vanish */}
      {step === 0 && (
        <g>
          <SvgPill
            x={276}
            y={24}
            w={335}
            h={26}
            bg="#00bbf9"
            fontSize={11}
            scale={easeOutBack(animT)}
            text={
              lang === 'ar'
                ? 'يظهر الكائن للشاهد 10 ثوانٍ ثم يختفي!'
                : 'Witness peeks for 10s then it vanishes!'
            }
          />
          <circle
            cx="276"
            cy="132"
            r="56"
            fill="none"
            stroke={step0Visible ? '#00bbf9' : '#ff595e'}
            strokeWidth="3.5"
            strokeDasharray="352"
            strokeDashoffset={postEntranceCycle * 352}
            transform="rotate(-90, 276, 132)"
          />
          <CuteWeirdMonster
            x={276}
            y={132 + Math.sin(clock * 3.5) * 2.5}
            scale={1.04 * Math.max(0.2, easeOutBack(animT))}
            opacity={step0Opacity}
          />
          <SvgPill
            x={364}
            y={92}
            w={64}
            h={24}
            bg={step0Visible ? '#ffca3a' : '#ff595e'}
            fg={step0Visible ? '#161426' : '#ffffff'}
            fontSize={11}
            text={`${secsRemaining}s`}
          />
        </g>
      )}

      {/* Step 1: Witness Describes From Memory with Radiating Soundwaves */}
      {step === 1 && (
        <g>
          <SvgPill
            x={278}
            y={25}
            w={378}
            h={27}
            bg="#fff9ec"
            fontSize={10.8}
            scale={easeOutBack(animT)}
            text={
              lang === 'ar'
                ? '«إلو 3 عيون وقرنين صفر وجسم مدوّر!»'
                : '"3 eyes, 2 yellow horns & round purple body!"'
            }
          />
          {/* Radiating Speech Soundwaves from Witness */}
          {[0, 1, 2].map((wi) => {
            const waveP = ((clock * 1.4 + wi * 0.33) % 1);
            const wx = 104 + waveP * 85;
            return (
              <path
                key={wi}
                d={`M ${wx} ${118 - waveP * 12} Q ${wx + 12} 134 ${wx} ${150 + waveP * 12}`}
                fill="none"
                stroke="#00bbf9"
                strokeWidth="2.8"
                strokeLinecap="round"
                opacity={1 - waveP}
              />
            );
          })}
          {/* Floating Memory Cloud */}
          <g transform={`translate(292, ${134 + Math.sin(clock * 3.2) * 3.5})`}>
            <circle
              cx="0"
              cy="0"
              r="56"
              fill="rgba(255,255,255,0.06)"
              stroke="#00bbf9"
              strokeWidth="2.6"
              strokeDasharray="7 5"
            />
            <CuteWeirdMonster
              x={0}
              y={2}
              scale={0.98}
              opacity={0.26 + Math.sin(clock * 4) * 0.08}
            />
            <circle
              cx="36"
              cy="-36"
              r="16"
              fill="#161426"
              stroke="#ffca3a"
              strokeWidth="2.8"
            />
            <text
              x="36"
              y="-35.5"
              textAnchor="middle"
              dominantBaseline="central"
              fill="#ffca3a"
              fontSize="18"
              fontWeight="900"
            >
              ?
            </text>
          </g>
        </g>
      )}

      {/* Step 2: Friends Sketch Live on Canvases with Moving Pencil Nibs */}
      {step === 2 && (
        <g>
          <SvgPill
            x={280}
            y={24}
            w={305}
            h={26}
            bg="#ffca3a"
            fontSize={11.5}
            scale={easeOutBack(animT)}
            text={
              lang === 'ar'
                ? 'الرسامون يتخيلون ويرسمون الوصف!'
                : 'Artists sketch what they hear live!'
            }
          />
          {[212, 366].map((cx, idx) => {
            const penX = Math.cos(clock * 3.4 + idx * 2) * 20;
            const penY = Math.sin(clock * 3.4 + idx * 2) * 18;
            return (
              <g key={idx} transform={`translate(${cx}, 130)`}>
                <rect
                  x="-53"
                  y="-54"
                  width="106"
                  height="108"
                  rx="14"
                  fill="#fff9ec"
                  stroke="#161426"
                  strokeWidth="3.5"
                />
                <path
                  d={
                    idx === 0
                      ? 'M -20 -14 L -26 -32 L -10 -20 C -4 -24 4 -24 10 -20 L 26 -32 L 20 -14 C 30 2 26 28 0 28 C -26 28 -30 2 -20 -14 Z'
                      : 'M -22 -18 L 22 -18 L 26 26 L -26 26 Z'
                  }
                  pathLength={100}
                  fill="none"
                  stroke={idx === 0 ? '#9b5de5' : '#00bbf9'}
                  strokeWidth="3.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray="100"
                  strokeDashoffset={100 * (1 - drawProg)}
                />
                <circle cx="-9" cy="-2" r="2.6" fill="#161426" />
                <circle cx="0" cy="-2" r="2.6" fill="#161426" />
                {idx === 0 && <circle cx="9" cy="-2" r="2.6" fill="#161426" />}

                {/* Moving Cartoon Marker Nib */}
                <g transform={`translate(${penX}, ${penY}) rotate(-35)`}>
                  <rect
                    x="0"
                    y="-4"
                    width="18"
                    height="8"
                    rx="2"
                    fill={idx === 0 ? '#9b5de5' : '#00bbf9'}
                    stroke="#161426"
                    strokeWidth="2"
                  />
                  <polygon points="-6,0 0,-4 0,4" fill="#ffca3a" stroke="#161426" strokeWidth="1.6" />
                </g>
              </g>
            );
          })}
        </g>
      )}

      {/* Step 3: Side-by-Side Comparison: Real Creature vs Hand-Drawn Sketches! */}
      {step === 3 && (
        <g>
          <SvgPill
            x={286}
            y={22}
            w={315}
            h={24}
            bg="#fff9ec"
            fontSize={10.8}
            scale={easeOutBack(animT)}
            text={
              lang === 'ar'
                ? 'نقارن الكائن الحقيقي بالرسومات ونصوّت للأدق!'
                : 'Compare real creature vs sketches & vote!'
            }
          />

          {/* Panel 1: Original Creature */}
          <g transform="translate(178, 114)">
            <rect
              x="-44"
              y="-47"
              width="88"
              height="94"
              rx="12"
              fill="#1e293b"
              stroke="#00bbf9"
              strokeWidth="3.2"
            />
            <CuteWeirdMonster x={0} y={5} scale={0.68} />
            <text
              x="0"
              y="-34"
              textAnchor="middle"
              dominantBaseline="central"
              fill="#00bbf9"
              fontSize="9.8"
              fontWeight="900"
            >
              {lang === 'ar' ? 'الأصلي' : 'Original'}
            </text>
          </g>

          {/* Panel 2: Winning Hand-Drawn Sketch (Genuine wobbly marker paths, NOT vector clone!) */}
          <g
            transform={`translate(298, ${
              114 + Math.sin(clock * 4) * 2.5
            })`}
          >
            <rect
              x="-46"
              y="-48"
              width="92"
              height="96"
              rx="12"
              fill="#fff9ec"
              stroke="#8ac926"
              strokeWidth="4"
            />
            <path
              d="M -17 -10 L -23 -27 L -9 -16 C -3 -20 3 -20 9 -16 L 23 -27 L 17 -10 C 26 4 22 27 0 27 C -22 27 -26 4 -17 -10 Z"
              fill="rgba(155,93,229,0.16)"
              stroke="#9b5de5"
              strokeWidth="3.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="-8" cy="-1" r="2.6" fill="#161426" />
            <circle cx="0" cy="-1" r="2.6" fill="#161426" />
            <circle cx="8" cy="-1" r="2.6" fill="#161426" />
            <path
              d="M -10 12 L -5 16 L 0 12 L 5 16 L 10 12"
              fill="none"
              stroke="#9b5de5"
              strokeWidth="2.4"
              strokeLinecap="round"
            />
            <circle
              cx="36"
              cy="-38"
              r="12"
              fill="#8ac926"
              stroke="#161426"
              strokeWidth="2.5"
            />
            <SvgCheckMark x={36} y={-38} size={0.88} color="#161426" />
          </g>

          {/* Panel 3: Funny Confused Boxy Sketch */}
          <g transform="translate(416, 114)">
            <rect
              x="-42"
              y="-46"
              width="84"
              height="92"
              rx="12"
              fill="#fff9ec"
              stroke="#161426"
              strokeWidth="3"
            />
            <path
              d="M -18 -14 L 18 -14 L 22 22 L -22 22 Z"
              fill="none"
              stroke="#00bbf9"
              strokeWidth="3.2"
              strokeLinejoin="round"
            />
            <circle cx="-7" cy="2" r="2.5" fill="#161426" />
            <circle cx="7" cy="2" r="2.5" fill="#161426" />
          </g>

          <SvgScoreBadge
            x={296}
            y={208}
            w={265}
            bg="#8ac926"
            animT={animT}
            clock={clock}
            text={
              lang === 'ar'
                ? 'أدق وأظرف رسمة تفوز! +3'
                : 'Best sketch match wins! +3'
            }
          />
        </g>
      )}
    </StageBackdrop>
  );
};

/* ============================================================================
 * 6. FAKE ARTIST (الفنان المزيّف) — Pure Native SVG 4-Step Scene
 * ========================================================================== */
export const FakeArtistTutorialScene: React.FC<TutorialSceneProps> = ({
  step,
  animT,
  clock,
  lang,
}) => {
  const stroke1Prog =
    step === 1 ? clamp01(animT * 1.8) : step > 1 ? 1 : 0;
  const stroke2Prog =
    step === 1 ? clamp01((animT - 0.35) * 1.8) : step > 1 ? 1 : 0;
  const stroke3Prog =
    step === 2 ? clamp01(animT * 1.55) : step > 2 ? 1 : 0;

  return (
    <StageBackdrop bg="#2b1e38" accent="#ff924c">
      {/* Generous Top Banner (w=390 fits 53-char EN with zero overflow!) */}
      <SvgPill
        x={260}
        y={21}
        w={390}
        h={25}
        bg="#ffca3a"
        fontSize={10.8}
        scale={step === 0 ? easeOutBack(animT) : 1}
        text={
          step === 0
            ? lang === 'ar'
              ? 'التصنيف للكل: حيوانات | السر للرسامين: «قطة»'
              : 'Category: Animals | Real Artists see: "Cat"'
            : step === 3
            ? lang === 'ar'
              ? 'صوّتوا لكشف المزيّف — وإذا انكشف يحاول حزر الرسمة!'
              : 'Vote for the Fake — if caught, they get 1 last guess!'
            : lang === 'ar'
            ? 'كل لاعب يرسم خطاً واحداً متصلاً فقط بلونه!'
            : 'Each player draws 1 continuous stroke in their color!'
        }
      />

      {/* Shared Central Canvas (x=[178..342], y=[53..175]) */}
      <g transform="translate(260, 114)">
        <rect x="-82" y="-57" width="164" height="122" rx="15" fill="#120f29" />
        <rect
          x="-82"
          y="-61"
          width="164"
          height="122"
          rx="15"
          fill="#fff9ec"
          stroke="#161426"
          strokeWidth="3.8"
        />

        {/* Public Category Strip Visible to EVERYONE (Including Fake Artist!) */}
        <rect
          x="-68"
          y="-52"
          width="136"
          height="19"
          rx="6"
          fill="#e2e8f0"
          stroke="#161426"
          strokeWidth="1.8"
        />
        <text
          x="0"
          y="-42"
          textAnchor="middle"
          dominantBaseline="central"
          fill="#161426"
          fontSize="10"
          fontWeight="900"
        >
          {lang === 'ar' ? 'التصنيف: حيوانات' : 'Category: Animals'}
        </text>

        {step === 0 && (
          <text
            x="0"
            y="12"
            textAnchor="middle"
            dominantBaseline="central"
            fill="#94a3b8"
            fontSize="12.5"
            fontWeight="900"
            opacity={0.65 + Math.sin(clock * 3.5) * 0.25}
          >
            {lang === 'ar' ? 'لوحة مشتركة' : 'Shared Canvas'}
          </text>
        )}

        {/* Stroke 1 (Blue Real Artist: 1 Continuous Circle Cat Face) */}
        {step >= 1 && (
          <circle
            cx="0"
            cy="14"
            r="25"
            pathLength={100}
            fill="none"
            stroke="#00bbf9"
            strokeWidth="4.2"
            strokeDasharray="100"
            strokeDashoffset={100 * (1 - stroke1Prog)}
          />
        )}

        {/* Stroke 2 (Green Real Artist: 1 SINGLE Unbroken Continuous Path for Cat Ears + Crown!) */}
        {step >= 1 && stroke2Prog > 0 && (
          <path
            d="M -20 0 L -25 -22 L -6 -9 Q 0 -11 6 -9 L 25 -22 L 20 0"
            pathLength={100}
            fill="none"
            stroke="#8ac926"
            strokeWidth="4.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="100"
            strokeDashoffset={100 * (1 - stroke2Prog)}
          />
        )}

        {/* Moving Marker Nib in Step 1 */}
        {step === 1 && (
          <g
            transform={`translate(${Math.cos(clock * 3.8) * 18}, ${
              8 + Math.sin(clock * 3.8) * 14
            }) rotate(-35)`}
          >
            <rect
              x="0"
              y="-3.5"
              width="16"
              height="7"
              rx="2"
              fill={animT < 0.45 ? '#00bbf9' : '#8ac926'}
              stroke="#161426"
              strokeWidth="1.8"
            />
          </g>
        )}

        {/* Stroke 3 (Red Fake Artist: 1 Suspicious Continuous Stroke!) */}
        {step >= 2 && stroke3Prog > 0 && (
          <path
            d="M -38 45 L 38 45 L 46 22"
            pathLength={100}
            fill="none"
            stroke="#ff595e"
            strokeWidth="4.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="100"
            strokeDashoffset={100 * (1 - stroke3Prog)}
            opacity={step === 2 ? 0.8 + Math.sin(clock * 7) * 0.2 : 1}
          />
        )}

        {/* Moving Red Marker Nib in Step 2 */}
        {step === 2 && (
          <g
            transform={`translate(${lerp(-36, 44, stroke3Prog) + Math.sin(clock * 5) * 3}, ${
              36 + Math.cos(clock * 5) * 3
            }) rotate(-30)`}
          >
            <rect
              x="0"
              y="-3.5"
              width="16"
              height="7"
              rx="2"
              fill="#ff595e"
              stroke="#161426"
              strokeWidth="1.8"
            />
          </g>
        )}
      </g>

      {/* Left Real Artists */}
      <SvgPlayerAvatar
        x={64}
        y={78}
        color="#00bbf9"
        label={lang === 'ar' ? 'رسام 1' : 'Artist 1'}
        scale={0.78}
        highlight={step === 1}
        clock={clock}
      />
      <SvgPlayerAvatar
        x={64}
        y={166}
        color="#8ac926"
        label={lang === 'ar' ? 'رسام 2' : 'Artist 2'}
        scale={0.78}
        highlight={step === 1}
        clock={clock}
      />

      {/* Right Fake Artist */}
      <SvgPlayerAvatar
        x={452}
        y={132}
        color="#ff595e"
        label={lang === 'ar' ? 'المزيّف!' : 'Fake!'}
        scale={0.86}
        suspect={step === 0 || step >= 2}
        clock={clock}
      />

      {/* Step 0: Floating Secret Word Cards ("Cat" vs "???") — Alive via clock! */}
      {step === 0 && (
        <g>
          <g transform={`translate(0, ${Math.sin(clock * 3.8) * 2.5})`}>
            <SvgPill
              x={132}
              y={74}
              w={68}
              h={24}
              bg="#8ac926"
              fontSize={11}
              scale={easeOutBack(animT)}
              text={lang === 'ar' ? 'قطة' : 'Cat'}
            />
          </g>
          <g transform={`translate(0, ${Math.sin(clock * 3.8 + 1.2) * 2.5})`}>
            <SvgPill
              x={132}
              y={162}
              w={68}
              h={24}
              bg="#8ac926"
              fontSize={11}
              scale={easeOutBack(clamp01((animT - 0.1) * 1.15))}
              text={lang === 'ar' ? 'قطة' : 'Cat'}
            />
          </g>
          <g transform={`translate(0, ${Math.sin(clock * 4.5) * 3})`}>
            <SvgPill
              x={442}
              y={74}
              w={92}
              h={26}
              bg="#ff595e"
              fg="#ffffff"
              fontSize={11.5}
              scale={easeOutBack(clamp01((animT - 0.18) * 1.2))}
              text="???"
            />
          </g>
        </g>
      )}

      {step === 2 && (
        <SvgPill
          x={434}
          y={68}
          w={136}
          h={25}
          bg="#ff595e"
          fg="#ffffff"
          fontSize={11}
          scale={easeOutBack(animT)}
          text={lang === 'ar' ? 'خط أحمر مريب!' : 'Weird red stroke!'}
        />
      )}

      {/* Step 3: Voting Arrows + Fake Artist's Frantic Last Guess! */}
      {step === 3 && (
        <g>
          <line
            x1={96}
            y1={80}
            x2={418}
            y2={124}
            stroke="#ffca3a"
            strokeWidth="2.8"
            strokeDasharray="6 5"
            strokeDashoffset={-(clock * 28) % 22}
          />
          <line
            x1={96}
            y1={164}
            x2={418}
            y2={138}
            stroke="#ffca3a"
            strokeWidth="2.8"
            strokeDasharray="6 5"
            strokeDashoffset={-(clock * 28) % 22}
          />
          <g transform={`translate(0, ${Math.sin(clock * 4.4) * 2.5})`}>
            <SvgPill
              x={434}
              y={68}
              w={136}
              h={25}
              bg="#fff9ec"
              fontSize={11}
              scale={easeOutBack(animT)}
              text={lang === 'ar' ? 'يخمّن: «أرنب؟؟»' : 'Guesses: "Rabbit??"'}
            />
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
                ? 'انكشف المزيّف! فرصته الأخيرة حزر الرسمة'
                : 'Fake caught! Gets 1 last guess to steal!'
            }
          />
        </g>
      )}
    </StageBackdrop>
  );
};

/* ============================================================================
 * 7. COCKROACH POKER (بوكر الخداع) — Pure Native SVG 4-Step Scene
 * ========================================================================== */
const CritterFaceCard: React.FC<{
  x: number;
  y: number;
  rot?: number;
  scale?: number;
  scaleX?: number;
  faceDown?: boolean;
  label: string;
  tint?: string;
  danger?: boolean;
}> = ({
  x,
  y,
  rot = 0,
  scale = 1,
  scaleX = 1,
  faceDown = false,
  label,
  tint = '#8ac926',
  danger = false,
}) => (
  <g
    transform={`translate(${x}, ${y}) rotate(${rot}) scale(${
      scale * Math.max(0.08, scaleX)
    }, ${scale})`}
  >
    <rect x="-32" y="-39" width="64" height="84" rx="11" fill="#120f29" />
    {faceDown ? (
      <g>
        <rect
          x="-32"
          y="-43"
          width="64"
          height="84"
          rx="11"
          fill="#2d265e"
          stroke="#161426"
          strokeWidth="3.4"
        />
        <circle
          cx="0"
          cy="-1"
          r="16"
          fill="#ffca3a"
          stroke="#161426"
          strokeWidth="2.4"
        />
        <text
          x="0"
          y="0"
          textAnchor="middle"
          dominantBaseline="central"
          fill="#161426"
          fontSize="19"
          fontWeight="900"
        >
          ?
        </text>
      </g>
    ) : (
      <g>
        <rect
          x="-32"
          y="-43"
          width="64"
          height="84"
          rx="11"
          fill={danger ? '#ffe4e6' : '#eefbe0'}
          stroke={danger ? '#ff595e' : '#161426'}
          strokeWidth={danger ? '3.8' : '3.4'}
        />
        <ellipse
          cx="0"
          cy="2"
          rx="18"
          ry="12.5"
          fill={tint}
          stroke="#161426"
          strokeWidth="2.6"
        />
        <circle cx="-9" cy="-9" r="5.5" fill={tint} stroke="#161426" strokeWidth="2.2" />
        <circle cx="9" cy="-9" r="5.5" fill={tint} stroke="#161426" strokeWidth="2.2" />
        <circle cx="-9" cy="-9" r="2" fill="#161426" />
        <circle cx="9" cy="-9" r="2" fill="#161426" />
        <path
          d="M -7 4 Q 0 8.5 7 4"
          fill="none"
          stroke="#161426"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <text
          x="0"
          y="27"
          textAnchor="middle"
          fill="#161426"
          fontSize="10"
          fontWeight="900"
        >
          {label}
        </text>
      </g>
    )}
  </g>
);

export const CockroachTutorialScene: React.FC<TutorialSceneProps> = ({
  step,
  animT,
  clock,
  lang,
}) => {
  const t = easeOutCubic(animT);
  const floatY = Math.sin(clock * 3.8) * 2.4;

  // Step 2 2D flip from faceDown (?) -> faceUp (FROG)
  const flip2 = step === 2 ? clamp01(animT * 1.5) : 1;
  const step2FaceDown = step === 2 && flip2 < 0.5;
  const step2ScaleX =
    step === 2 ? (flip2 < 0.5 ? 1 - flip2 * 2 : (flip2 - 0.5) * 2) : 1;

  return (
    <StageBackdrop bg="#1d2f24" accent="#8ac926">
      {/* Player A (Bluffer) */}
      <SvgPlayerAvatar
        x={70}
        y={136}
        color="#ffca3a"
        label={lang === 'ar' ? 'رامي' : 'Rami'}
        scale={0.86}
        highlight={step === 0}
        suspect={step === 3}
        clock={clock}
      />

      {/* Player B (Target) */}
      <SvgPlayerAvatar
        x={450}
        y={136}
        color="#00bbf9"
        label={lang === 'ar' ? 'سارة' : 'Sara'}
        scale={0.86}
        highlight={step === 1 || step === 2}
        clock={clock}
      />

      {/* Step 0: Bluffer Peeks at Frog & Claims "Scorpion!" */}
      {step === 0 && (
        <g>
          <SvgPill
            x={260}
            y={28}
            w={335}
            h={28}
            bg="#ff595e"
            fg="#ffffff"
            fontSize={11.5}
            scale={easeOutBack(animT)}
            text={
              lang === 'ar'
                ? 'يشوفه «ضفدع» ويدّعي: «هذا عقرب!»'
                : 'Sees a Frog, claims: "It’s a Scorpion!"'
            }
          />
          <line
            x1={216}
            y1={134}
            x2={412}
            y2={134}
            stroke="#ffca3a"
            strokeWidth="2.8"
            strokeDasharray="6 5"
            strokeDashoffset={-(clock * 26) % 22}
          />
          <CritterFaceCard
            x={174}
            y={136 + floatY}
            label={lang === 'ar' ? 'ضفدع' : 'FROG'}
          />
        </g>
      )}

      {/* Step 1: Target's 2 Strategic Options + 3rd Player for "Peek & Pass"! (Zero collision: pills y<=64, card y>=90!) */}
      {step === 1 && (
        <g>
          <SvgPill
            x={252}
            y={22}
            w={265}
            h={24}
            bg="#ffca3a"
            fontSize={11}
            scale={easeOutBack(animT)}
            text={
              lang === 'ar'
                ? 'خيار 1: تحدّي فوراً (صادق أم كذّاب؟)'
                : 'Option 1: Call Truth or Lie!'
            }
          />
          <SvgPill
            x={252}
            y={50}
            w={285}
            h={24}
            bg="#00bbf9"
            fontSize={11}
            scale={easeOutBack(clamp01((animT - 0.12) * 1.15))}
            text={
              lang === 'ar'
                ? 'خيار 2: طلّ بالسر ومرّره للاعب ثالث!'
                : 'Option 2: Peek & Pass to another!'
            }
          />

          {/* 3rd Player Omar + Dashed Pass Arc */}
          <path
            d="M 418 148 Q 392 174 374 172"
            fill="none"
            stroke="#00bbf9"
            strokeWidth="2.6"
            strokeDasharray="5 4"
            strokeDashoffset={-(clock * 22) % 18}
          />
          <SvgPlayerAvatar
            x={348}
            y={170}
            color="#9b5de5"
            label={lang === 'ar' ? 'عمر' : 'Omar'}
            scale={0.7}
            clock={clock}
          />

          <CritterFaceCard
            x={lerp(174, 264, t)}
            y={138 + floatY}
            rot={lerp(0, 5, t)}
            faceDown={true}
            label=""
          />
        </g>
      )}

      {/* Step 2: Target Calls LIE! Card Flips Face-Up in 2D! */}
      {step === 2 && (
        <g>
          <SvgScoreBadge
            x={260}
            y={32}
            w={315}
            bg="#8ac926"
            animT={animT}
            clock={clock}
            text={
              lang === 'ar'
                ? 'قالت «كذّاب!» — وطلع ضفدع فعلاً!'
                : 'Called "LIE!" — It WAS a Frog!'
            }
          />
          <circle
            cx="260"
            cy="138"
            r={52 + Math.sin(clock * 5) * 4}
            fill="rgba(138, 201, 38, 0.16)"
            stroke="#8ac926"
            strokeWidth="2.5"
            strokeDasharray="6 5"
          />
          <CritterFaceCard
            x={lerp(264, 260, t)}
            y={138 + floatY}
            scaleX={step2ScaleX}
            faceDown={step2FaceDown}
            label={lang === 'ar' ? 'ضفدع' : 'FROG'}
          />
        </g>
      )}

      {/* Step 3: 3 Face-Up Penalty Cards Accumulate = Lose Round! */}
      {step === 3 && (
        <g>
          <SvgScoreBadge
            x={272}
            y={30}
            w={335}
            bg="#ffca3a"
            animT={animT}
            clock={clock}
            text={
              lang === 'ar'
                ? 'الخاسر يأخذ الكرت (3 عقوبات = خسارة!)'
                : 'Loser takes card (3 penalties = lose!)'
            }
          />
          <CritterFaceCard
            x={170}
            y={142}
            scale={0.82}
            tint="#9b5de5"
            label={lang === 'ar' ? 'خفاش 1/3' : 'BAT 1/3'}
          />
          <CritterFaceCard
            x={236}
            y={142}
            scale={0.82}
            tint="#ff924c"
            label={lang === 'ar' ? 'عقرب 2/3' : 'BUG 2/3'}
          />
          <CritterFaceCard
            x={lerp(340, 302, t)}
            y={142 + Math.sin(clock * 6) * 2.5}
            scale={0.85}
            tint="#8ac926"
            danger={true}
            label={lang === 'ar' ? 'ضفدع 3/3' : 'FROG 3/3'}
          />
        </g>
      )}
    </StageBackdrop>
  );
};
