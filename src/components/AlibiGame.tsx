import React, { useState, useRef, useEffect } from 'react';
import {
  PaintBrush,
  ArrowCounterClockwise,
  Trash,
  CheckCircle,
  Trophy,
  ArrowsClockwise,
  Eye,
  EyeSlash,
  MagnifyingGlass,
  WarningCircle,
  ShieldCheck,
  UserFocus,
} from '@phosphor-icons/react';

export interface AlibiStroke {
  c: string;
  w: number;
  pts: number[]; // flat [x0, y0, x1, y1, ...] in 0..280 coords
}

export interface AlibiSubmission {
  strokes: AlibiStroke[];
  caption: string;
}

export interface AlibiCase {
  id: number;
  titleAr: string;
  titleEn: string;
  locationAr: string;
  locationEn: string;
  secretAlibiAr: string;
  secretAlibiEn: string;
  decoyOptionsAr: string[];
  decoyOptionsEn: string[];
}

export interface AlibiGameState {
  phase: 'sketch_alibi' | 'interrogation_vote' | 'culprit_last_chance' | 'case_closed';
  caseId: number;
  culpritId: string;
  submissions: Record<string, AlibiSubmission>;
  votes: Record<string, string>; // voterId -> suspectId
  caughtCulprit?: boolean;
  culpritGuess?: string;
  culpritGuessedRight?: boolean;
}

export interface AlibiPlayerInfo {
  id: string;
  name: string;
  avatar_color: string;
  score: number;
}

export interface AlibiGameProps {
  gameData: AlibiGameState;
  players: AlibiPlayerInfo[];
  myPlayerId: string;
  isHost: boolean;
  isPassAndPlay: boolean;
  lang: 'ar' | 'en';
  onUpdateGameData: (nextData: AlibiGameState, scoreAwards?: Record<string, number>) => void;
  onStartNewRound: () => void;
}

export const ALIBI_CASES: AlibiCase[] = [
  {
    id: 1,
    titleAr: 'سرقة الجوهرة الزرقاء',
    titleEn: 'The Blue Diamond Heist',
    locationAr: 'سرقة الجوهرة الزرقاء من المتحف الوطني منتصف الليل',
    locationEn: 'The Blue Diamond stolen from the National Museum at midnight',
    secretAlibiAr: 'كان هناك قط برتقالي نائم فوق تمثال بجانبنا',
    secretAlibiEn: 'An orange cat was sleeping on top of a statue next to us',
    decoyOptionsAr: [
      'كانت هناك لوحة مائلة تسقط من الحائط',
      'كان الحارس يأكل شطيرة شاورما عملاقة',
      'كانت هناك نافورة شوكولاتة في وسط القاعة',
      'كان هناك ببغاء أخضر يطير تحت الثريا',
      'كانت هناك مكنسة كهربائية تعمل لوحدها',
    ],
    decoyOptionsEn: [
      'A crooked painting was falling off the wall',
      'The guard was eating a giant shawarma sandwich',
      'A chocolate fountain stood in the center of the hall',
      'A green parrot was flying under the chandelier',
      'A vacuum cleaner was running by itself',
    ],
  },
  {
    id: 2,
    titleAr: 'اختفاء كعكة العرس الملكية',
    titleEn: 'The Vanishing Royal Wedding Cake',
    locationAr: 'اختفاء كعكة العرس الملكية من المطبخ الفاخر',
    locationEn: 'The Royal Wedding Cake vanished from the luxury kitchen',
    secretAlibiAr: 'كانت هناك مظلة مطر مفتوحة معلقة بالسقف',
    secretAlibiEn: 'An open rain umbrella was hanging upside down from the ceiling',
    decoyOptionsAr: [
      'كان الطباخ يرتدي زلاجات جليد في قدميه',
      'كانت هناك سمكة ذهبية تسبح داخل قدر كبير',
      'كان هناك قرد صغير يسرق الموز من الطاولة',
      'كانت الثلاجة مربوطة بسلسلة حديدية وقفل',
      'كانت هناك مروحة عملاقة تطير القبعات',
    ],
    decoyOptionsEn: [
      'The chef was wearing ice skates on his feet',
      'A goldfish was swimming inside a giant cooking pot',
      'A little monkey was stealing bananas from the counter',
      'The fridge was chained shut with a giant padlock',
      'A huge fan was blowing everyone’s hats away',
    ],
  },
  {
    id: 3,
    titleAr: 'انقطاع الكهرباء في القطار السريع',
    titleEn: 'Express Train Blackout',
    locationAr: 'انقطاع الكهرباء الغامض في القطار السريع',
    locationEn: 'Mysterious blackout aboard the midnight Express Train',
    secretAlibiAr: 'كان الجميع يشرب عصير أناناس بـ شلمونة حمراء',
    secretAlibiEn: 'Everyone was drinking pineapple juice with a red straw',
    decoyOptionsAr: [
      'كان سائق القطار يعزف على الجيتار في الممر',
      'كانت هناك حقيبة سفر تخرج منها فقاعات صابون',
      'كان هناك كلب يرتدي نظارة شمسية على المقعد',
      'كانت هناك بيتزا مثلثة ملتصقة بنافذة القطار',
      'كان هناك رجل يرتدي خوذة رائد فضاء',
    ],
    decoyOptionsEn: [
      'The conductor was playing guitar in the aisle',
      'Soap bubbles were floating out of a suitcase',
      'A dog wearing sunglasses was sitting on a seat',
      'A slice of pizza was stuck to the train window',
      'A passenger was wearing a full astronaut helmet',
    ],
  },
  {
    id: 4,
    titleAr: 'فوضى مختبر البروفيسور عبقرينو',
    titleEn: 'Chaos in Professor Genius’s Lab',
    locationAr: 'سرقة معادلة الاختراع السري من المختبر العلمي',
    locationEn: 'The secret invention formula stolen from the Science Lab',
    secretAlibiAr: 'كانت هناك صبارة صغيرة ترتدي قبعة حفلات فوق الطاولة',
    secretAlibiEn: 'A tiny cactus wearing a party hat was sitting on the lab desk',
    decoyOptionsAr: [
      'كان هناك روبوت يقدم القهوة في أكواب ورقية',
      'كانت هناك ضفدعة عملاقة داخل أنبوب زجاجي',
      'كانت السبورة مرسوماً عليها لعبة إكس أو',
      'كان هناك حذاء رياضي يطفو في الهواء بدون جاذبية',
      'كانت هناك نظارة طبية عملاقة معلقة على الباب',
    ],
    decoyOptionsEn: [
      'A robot was serving coffee in paper cups',
      'A giant frog was sitting inside a glass beaker',
      'A game of Tic-Tac-Toe was drawn on the chalkboard',
      'A sneaker was floating mid-air with zero gravity',
      'Giant eyeglasses were hanging on the lab door',
    ],
  },
  {
    id: 5,
    titleAr: 'اختطاف البطريق الذهبي من حديقة الحيوان',
    titleEn: 'Kidnapping of the Golden Penguin',
    locationAr: 'اختفاء البطريق النادر من القبة الجليدية بالحديقة',
    locationEn: 'The rare penguin vanished from the Zoo Ice Dome',
    secretAlibiAr: 'كان هناك رجل ثلج يحمل مكنسة خشبية ويرتدي وشاحاً أصفر',
    secretAlibiEn: 'A snowman holding a wooden broom and wearing a yellow scarf was nearby',
    decoyOptionsAr: [
      'كان هناك دب قطبي ينام على أرجوحة شبكية',
      'كانت هناك لافتة مكتوب عليها ممنوع التزحلق',
      'كان الحارس يصطاد السمك من بركة البطاريق',
      'كانت هناك عربة آيس كريم مقلوبة على الجليد',
      'كان هناك كرسي شاطئ ومظلة صيفية وسط الثلج',
    ],
    decoyOptionsEn: [
      'A polar bear was sleeping in a hammock',
      'A sign read No Ice Skating Allowed',
      'The keeper was fishing in the penguin pool',
      'An ice cream cart was flipped over on the ice',
      'A beach chair and sun umbrella stood in the snow',
    ],
  },
  {
    id: 6,
    titleAr: 'تخريب حفل الأوبرا الصاخب',
    titleEn: 'Sabotage at the Grand Opera',
    locationAr: 'قطع حبل الستارة المخملية في المسرح الكبير',
    locationEn: 'The velvet curtain rope was cut at the Grand Theater',
    secretAlibiAr: 'كان هناك عازف كمان يقف فوق كرسي خشبي بعجلات',
    secretAlibiEn: 'A violinist was standing on a wooden chair with wheels',
    decoyOptionsAr: [
      'كانت المغنية تحمل مكبر صوت يدوي بدلاً من الميكروفون',
      'كان هناك بيانو يخرج منه دخان وردي اللون',
      'كانت هناك بالونات هيليوم مربوطة بالصف الأول',
      'كان هناك تمساح بلاستيكي تحت منصة العزف',
      'كان قائد الأوركسترا يلوح بملعقةطبخ كبيرة',
    ],
    decoyOptionsEn: [
      'The singer held a megaphone instead of a mic',
      'Pink smoke was rising out of the grand piano',
      'Helium balloons were tied to the front row seats',
      'A plastic crocodile was under the stage platform',
      'The conductor was waving a giant wooden cooking spoon',
    ],
  },
  {
    id: 7,
    titleAr: 'لغز سفينة القراصنة السياحية',
    titleEn: 'Mystery on the Pirate Cruise Ship',
    locationAr: 'سرقة بوصلة القبطان الذهبية من سطح السفينة',
    locationEn: 'The Captain’s golden compass stolen from the ship deck',
    secretAlibiAr: 'كان هناك أخطبوط بنفسجي يتمسك بعجلة قيادة السفينة',
    secretAlibiEn: 'A purple octopus was clinging to the ship’s steering wheel',
    decoyOptionsAr: [
      'كان هناك صندوق كنز مليء ببطاطس مقلية',
      'كانت هناك طيور نورس ترتدي قبعات قراصنة',
      'كان الشراع مرسوماً عليه وجه مبتسم كبير',
      'كان هناك مدفع يطلق كرات تنس خضراء',
      'كانت هناك مرساة سفينة مربوطة ببالون أحمر',
    ],
    decoyOptionsEn: [
      'A treasure chest was overflowing with french fries',
      'Seagulls were wearing tiny pirate hats',
      'A giant smiley face was painted on the main sail',
      'A cannon was firing green tennis balls',
      'The ship’s anchor was tied to a red balloon',
    ],
  },
  {
    id: 8,
    titleAr: 'سرقة كأس البطولة من غرفة الملابس',
    titleEn: 'The Championship Trophy Heist',
    locationAr: 'اختفاء كأس الدوري من غرفة تبديل ملابس اللاعبين',
    locationEn: 'The League Trophy disappeared from the stadium locker room',
    secretAlibiAr: 'كانت هناك كرة قدم مربعة الشكل فوق خزانة الملابس',
    secretAlibiEn: 'A square-shaped soccer ball was sitting on top of the lockers',
    decoyOptionsAr: [
      'كان المدرب يرسم خطة اللعب بصلصة الكاتشب',
      'كانت هناك دراجة هوائية معلقة داخل الدش',
      'كان حارس المرمى يرتدي قفازات ملاكمة حمراء',
      'كانت هناك صافرة عملاقة مربوطة بالمروحة',
      'كان هناك حذاء واحد عملاق في وسط الغرفة',
    ],
    decoyOptionsEn: [
      'The coach was drawing tactics with ketchup',
      'A bicycle was hanging inside the shower stall',
      'The goalkeeper was wearing red boxing gloves',
      'A giant whistle was tied to the ceiling fan',
      'One giant boot stood in the middle of the room',
    ],
  },
  {
    id: 9,
    titleAr: 'اقتحام خزنة البنك المركزي',
    titleEn: 'Central Bank Vault Break-In',
    locationAr: 'فتح الخزنة الفولاذية في البنك المركزي ظهراً',
    locationEn: 'The steel vault opened at the Central Bank at noon',
    secretAlibiAr: 'كانت كاميرا المراقبة مغطاة بدونات وردية اللون',
    secretAlibiEn: 'The security camera was covered with a pink frosted donut',
    decoyOptionsAr: [
      'كان مدير البنك يلعب الجولف داخل المكتب',
      'كانت هناك عربة تسوق سوبرماركت مليئة بالذهب',
      'كانت أشعة الليزر على شكل شبكة عنكبوت',
      'كان هناك كلب حراسة نائم فوق كومة نقود',
      'كانت هناك آلة بيع مشروبات داخل الخزنة',
    ],
    decoyOptionsEn: [
      'The bank manager was playing golf in his office',
      'A supermarket shopping cart was full of gold bars',
      'The laser beams formed a giant spiderweb',
      'A guard dog was sleeping on a pile of cash',
      'A soda vending machine stood inside the vault',
    ],
  },
  {
    id: 10,
    titleAr: 'شغب في معرض السيارات الكلاسيكية',
    titleEn: 'Mayhem at the Classic Car Show',
    locationAr: 'تبديل محرك السيارة الملكية في صالة العرض',
    locationEn: 'The royal vintage car engine swapped in the showroom',
    secretAlibiAr: 'كانت هناك بطة مطاطية صفراء عملاقة فوق سقف السيارة',
    secretAlibiEn: 'A giant yellow rubber duck was sitting on the car roof',
    decoyOptionsAr: [
      'كانت إطارات السيارة مصنوعة من قطع الجبن',
      'كان هناك ميكانيكي يتزلج على لوح سكيت بورد',
      'كانت إشارة مرور ضوئية تعمل وسط الصالة',
      'كان هناك خرطوم بنزين مربوط على شكل فيونكة',
      'كانت المساحات الأمامية تمسك بمضارب تنس',
    ],
    decoyOptionsEn: [
      'The car tires were made of round cheese wheels',
      'A mechanic was riding a skateboard',
      'A working traffic light stood inside the hall',
      'A fuel hose was tied into a giant bow',
      'The windshield wipers held tennis rackets',
    ],
  },
  {
    id: 11,
    titleAr: 'لغز الفندق المسكون في الجبل',
    titleEn: 'Mystery at the Haunted Mountain Hotel',
    locationAr: 'اختفاء مفتاح الجناح الملكي من مكتب الاستقبال',
    locationEn: 'The Royal Suite key disappeared from the reception desk',
    secretAlibiAr: 'كانت الساعة الحائطية تشير للوقت بعقارب على شكل ملاعق',
    secretAlibiEn: 'The wall clock had spoons instead of clock hands',
    decoyOptionsAr: [
      'كانت هناك درع فارس حديدي يمسك بمقلاة',
      'كانت السجادة الحمراء تطير قليلاً عن الأرض',
      'كان هناك جرس استقبال تحت قبة زجاجية',
      'كانت المدفأة تشتعل بنار زرقاء اللون',
      'كانت هناك لوحة رجل يتحرك حاجباه للأعلى',
    ],
    decoyOptionsEn: [
      'A knight’s armor was holding a frying pan',
      'The red carpet was levitating off the floor',
      'The desk bell was trapped under a glass dome',
      'The fireplace was burning with bright blue flames',
      'A portrait on the wall had raised eyebrows',
    ],
  },
  {
    id: 12,
    titleAr: 'سرقة تاج الملك من القلعة القديمة',
    titleEn: 'The King’s Crown Stolen from the Castle',
    locationAr: 'اختفاء التاج المرصع من قاعة العرش الملكي',
    locationEn: 'The jeweled crown vanished from the Royal Throne Room',
    secretAlibiAr: 'كان هناك تنين صغير نائم داخل خوذة حارس عند الباب',
    secretAlibiEn: 'A tiny baby dragon was sleeping inside a guard’s helmet by the door',
    decoyOptionsAr: [
      'كان العرش الملكي موضوعاً فوق نطيطة أطفال',
      'كانت هناك بيتزا كبيرة معلقة مكان الدرع الملكي',
      'كان المهرج يركب دراجة بعجلة واحدة فوق الطاولة',
      'كانت هناك سحابة تمطر داخل القاعة فوق السجادة',
      'كان السيف الملكي مغروساً في قالب حلوى جيلي',
    ],
    decoyOptionsEn: [
      'The royal throne was sitting on a trampoline',
      'A giant pizza hung where the royal crest should be',
      'The jester rode a unicycle across the banquet table',
      'A tiny raincloud was raining indoors over the rug',
      'The royal sword was stuck inside a giant jelly mold',
    ],
  },
];

const PALETTE = ['#161426', '#ff595e', '#00bbf9', '#8ac926', '#ffca3a', '#9b5de5'];

// ============================================================================
// CUSTOM CARTOON SVG ARTWORK (ZERO EMOJIS!)
// ============================================================================

export const DetectiveBadgeSvg: React.FC<{ className?: string }> = ({ className = 'w-12 h-12' }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none">
    <path
      d="M50 8 L86 22 V52 C86 74 70 88 50 95 C30 88 14 74 14 52 V22 L50 8 Z"
      fill="#ffca3a"
      stroke="#161426"
      strokeWidth="5"
      strokeLinejoin="round"
    />
    <path
      d="M50 16 L78 27 V51 C78 69 65 81 50 87 C35 81 22 69 22 51 V27 L50 16 Z"
      fill="#ff924c"
      stroke="#161426"
      strokeWidth="3.5"
      strokeLinejoin="round"
    />
    <polygon
      points="50,27 56,41 71,42 60,52 63,67 50,59 37,67 40,52 29,42 44,41"
      fill="#fffdf5"
      stroke="#161426"
      strokeWidth="4"
      strokeLinejoin="round"
    />
    <circle cx="50" cy="49" r="5" fill="#161426" />
  </svg>
);

export const MagnifierEvidenceSvg: React.FC<{ className?: string }> = ({ className = 'w-12 h-12' }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none">
    <rect
      x="14"
      y="12"
      width="56"
      height="70"
      rx="8"
      fill="#fffdf5"
      stroke="#161426"
      strokeWidth="4.5"
    />
    <line x1="25" y1="28" x2="55" y2="28" stroke="#161426" strokeWidth="4" strokeLinecap="round" />
    <line x1="25" y1="40" x2="58" y2="40" stroke="#9b5de5" strokeWidth="4" strokeLinecap="round" />
    <line x1="25" y1="52" x2="46" y2="52" stroke="#161426" strokeWidth="4" strokeLinecap="round" />
    <line
      x1="64"
      y1="64"
      x2="88"
      y2="88"
      stroke="#161426"
      strokeWidth="12"
      strokeLinecap="round"
    />
    <line
      x1="64"
      y1="64"
      x2="88"
      y2="88"
      stroke="#ff595e"
      strokeWidth="6"
      strokeLinecap="round"
    />
    <circle
      cx="52"
      cy="52"
      r="22"
      fill="#00bbf9"
      fillOpacity="0.35"
      stroke="#161426"
      strokeWidth="5"
    />
    <path
      d="M42 43 C45 39 51 38 56 40"
      stroke="#ffffff"
      strokeWidth="3.5"
      strokeLinecap="round"
    />
  </svg>
);

export const HandcuffsSvg: React.FC<{ className?: string }> = ({ className = 'w-12 h-12' }) => (
  <svg viewBox="0 0 110 90" className={className} fill="none">
    <circle cx="30" cy="52" r="20" fill="none" stroke="#161426" strokeWidth="10" />
    <circle cx="30" cy="52" r="20" fill="none" stroke="#00bbf9" strokeWidth="4.5" />
    <circle cx="80" cy="52" r="20" fill="none" stroke="#161426" strokeWidth="10" />
    <circle cx="80" cy="52" r="20" fill="none" stroke="#00bbf9" strokeWidth="4.5" />
    <rect x="44" y="24" width="22" height="10" rx="5" fill="#ffca3a" stroke="#161426" strokeWidth="4" />
    <line x1="36" y1="33" x2="46" y2="28" stroke="#161426" strokeWidth="5" strokeLinecap="round" />
    <line x1="74" y1="33" x2="64" y2="28" stroke="#161426" strokeWidth="5" strokeLinecap="round" />
  </svg>
);

export const CrimeTapeBannerSvg: React.FC<{ className?: string }> = ({ className = 'w-full h-7' }) => (
  <svg viewBox="0 0 600 32" preserveAspectRatio="none" className={className}>
    <rect width="600" height="32" fill="#ffca3a" stroke="#161426" strokeWidth="4" />
    <g fill="#161426">
      <polygon points="20,0 45,0 25,32 0,32" />
      <polygon points="90,0 115,0 95,32 70,32" />
      <polygon points="160,0 185,0 165,32 140,32" />
      <polygon points="230,0 255,0 235,32 210,32" />
      <polygon points="300,0 325,0 305,32 280,32" />
      <polygon points="370,0 395,0 375,32 350,32" />
      <polygon points="440,0 465,0 445,32 420,32" />
      <polygon points="510,0 535,0 515,32 490,32" />
      <polygon points="580,0 600,0 585,32 560,32" />
    </g>
  </svg>
);

export const AlibiDrawingPreview: React.FC<{
  strokes: AlibiStroke[];
  className?: string;
}> = ({ strokes, className = 'w-full h-full' }) => (
  <svg viewBox="0 0 280 280" className={`${className} bg-[#fffdf5] select-none`}>
    {(strokes || []).map((st, idx) => {
      if (!st.pts || st.pts.length < 2) return null;
      if (st.pts.length === 2) {
        return (
          <circle
            key={idx}
            cx={st.pts[0]}
            cy={st.pts[1]}
            r={st.w / 2}
            fill={st.c}
          />
        );
      }
      let d = `M ${st.pts[0]} ${st.pts[1]}`;
      for (let i = 2; i < st.pts.length; i += 2) {
        d += ` L ${st.pts[i]} ${st.pts[i + 1]}`;
      }
      return (
        <path
          key={idx}
          d={d}
          fill="none"
          stroke={st.c}
          strokeWidth={st.w}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      );
    })}
  </svg>
);

export function buildInitialAlibiState(
  players: { id: string; name: string; avatar_color?: string; score?: number }[]
): AlibiGameState {
  const safePlayers = players.length > 0 ? players : [{ id: 'p1', name: 'Player 1' }];
  const randomCase = ALIBI_CASES[Math.floor(Math.random() * ALIBI_CASES.length)] || ALIBI_CASES[0];
  const randomCulprit = safePlayers[Math.floor(Math.random() * safePlayers.length)] || safePlayers[0];

  return {
    phase: 'sketch_alibi',
    caseId: randomCase.id,
    culpritId: randomCulprit.id,
    submissions: {},
    votes: {},
    caughtCulprit: undefined,
    culpritGuess: undefined,
    culpritGuessedRight: undefined,
  };
}

export const AlibiGame: React.FC<AlibiGameProps> = ({
  gameData,
  players,
  myPlayerId,
  isHost,
  isPassAndPlay,
  lang,
  onUpdateGameData,
}) => {
  const [strokes, setStrokes] = useState<AlibiStroke[]>([]);
  const [caption, setCaption] = useState<string>('');
  const [brushColor, setBrushColor] = useState<string>('#161426');
  const [brushWidth, setBrushWidth] = useState<number>(6);
  const [localSketchTurnIdx, setLocalSketchTurnIdx] = useState<number>(0);
  const [localVoteTurnIdx, setLocalVoteTurnIdx] = useState<number>(0);
  const [roleRevealedPnP, setRoleRevealedPnP] = useState<boolean>(!isPassAndPlay);

  const svgCanvasRef = useRef<SVGSVGElement | null>(null);
  const isDrawingRef = useRef<boolean>(false);
  const lockedScrollYRef = useRef<number>(0);

  useEffect(() => {
    const keepScrollLocked = () => {
      if (isDrawingRef.current && window.scrollY !== lockedScrollYRef.current) {
        window.scrollTo(window.scrollX, lockedScrollYRef.current);
      }
    };
    window.addEventListener('scroll', keepScrollLocked, { passive: true });
    return () => window.removeEventListener('scroll', keepScrollLocked);
  }, []);

  const currentCase =
    ALIBI_CASES.find((c) => c.id === gameData.caseId) || ALIBI_CASES[0];

  const activeSketchPlayer = isPassAndPlay
    ? players[localSketchTurnIdx] || players[0]
    : players.find((p) => p.id === myPlayerId) || players[0];

  const activeVoterPlayer = isPassAndPlay
    ? players[localVoteTurnIdx] || players[0]
    : players.find((p) => p.id === myPlayerId) || players[0];

  const activeSketchId = activeSketchPlayer?.id || myPlayerId;
  const activeVoterId = activeVoterPlayer?.id || myPlayerId;

  const isViewerCulprit = activeSketchId === gameData.culpritId;
  const culpritPlayer = players.find((p) => p.id === gameData.culpritId) || players[0];
  const hasSubmittedMyAlibi = Boolean(gameData.submissions?.[activeSketchId]);
  const hasVotedMySuspect = Boolean(gameData.votes?.[activeVoterId]);

  // Build 6 deterministic multiple-choice options for Culprit's final guess
  const culpritChoices = React.useMemo(() => {
    const truth = lang === 'ar' ? currentCase.secretAlibiAr : currentCase.secretAlibiEn;
    const decoys = lang === 'ar' ? currentCase.decoyOptionsAr : currentCase.decoyOptionsEn;
    const list = [truth, ...decoys.slice(0, 5)];
    return list
      .map((item, idx) => ({
        text: item,
        sortKey: ((currentCase.id * 17 + idx * 31) % 97),
      }))
      .sort((a, b) => a.sortKey - b.sortKey)
      .map((x) => x.text);
  }, [currentCase, lang]);

  const getPointerCoords = (e: React.PointerEvent<SVGSVGElement>): [number, number] => {
    const svg = svgCanvasRef.current;
    if (!svg) return [140, 140];
    const rect = svg.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 280);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 280);
    return [Math.max(0, Math.min(280, x)), Math.max(0, Math.min(280, y))];
  };

  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    lockedScrollYRef.current = window.scrollY;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Ignore if pointer capture is unsupported
    }
    isDrawingRef.current = true;
    const [x, y] = getPointerCoords(e);
    setStrokes((prev) => [...prev, { c: brushColor, w: brushWidth, pts: [x, y] }]);
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!isDrawingRef.current) return;
    e.preventDefault();
    e.stopPropagation();
    if (window.scrollY !== lockedScrollYRef.current) {
      window.scrollTo(window.scrollX, lockedScrollYRef.current);
    }
    const [x, y] = getPointerCoords(e);
    setStrokes((prev) => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      const len = last.pts.length;
      const lx = last.pts[len - 2];
      const ly = last.pts[len - 1];
      if (Math.hypot(x - lx, y - ly) < 3.5) return prev;
      const updatedLast: AlibiStroke = {
        ...last,
        pts: [...last.pts, x, y],
      };
      return [...prev.slice(0, -1), updatedLast];
    });
  };

  const handlePointerUp = (e?: React.PointerEvent<SVGSVGElement>) => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    if (e) {
      try {
        if (e.currentTarget.hasPointerCapture?.(e.pointerId)) {
          e.currentTarget.releasePointerCapture(e.pointerId);
        }
      } catch {
        // Ignore release errors
      }
    }
  };

  const handleSubmitAlibi = () => {
    const cleanCaption =
      caption.trim() ||
      (lang === 'ar' ? 'كنت متواجداً في مسرح الحدث!' : 'I was right there at the scene!');
    const nextSubmissions: Record<string, AlibiSubmission> = {
      ...(gameData.submissions || {}),
      [activeSketchId]: {
        strokes,
        caption: cleanCaption,
      },
    };

    setStrokes([]);
    setCaption('');

    if (isPassAndPlay && localSketchTurnIdx + 1 < players.length) {
      setLocalSketchTurnIdx(localSketchTurnIdx + 1);
      setRoleRevealedPnP(false);
      onUpdateGameData({
        ...gameData,
        submissions: nextSubmissions,
      });
      return;
    }

    const allSubmitted = players.every((p) => Boolean(nextSubmissions[p.id]));
    onUpdateGameData({
      ...gameData,
      submissions: nextSubmissions,
      phase: allSubmitted ? 'interrogation_vote' : 'sketch_alibi',
    });
  };

  const handleCastArrestVote = (suspectId: string) => {
    const nextVotes: Record<string, string> = {
      ...(gameData.votes || {}),
      [activeVoterId]: suspectId,
    };

    if (isPassAndPlay && localVoteTurnIdx + 1 < players.length) {
      setLocalVoteTurnIdx(localVoteTurnIdx + 1);
      onUpdateGameData({
        ...gameData,
        votes: nextVotes,
      });
      return;
    }

    const allVoted = players.every((p) => Boolean(nextVotes[p.id]));
    if (allVoted) {
      evaluateInterrogationVotes(nextVotes);
    } else {
      onUpdateGameData({
        ...gameData,
        votes: nextVotes,
      });
    }
  };

  const evaluateInterrogationVotes = (finalVotes: Record<string, string>) => {
    const tally: Record<string, number> = {};
    Object.values(finalVotes).forEach((sid) => {
      tally[sid] = (tally[sid] || 0) + 1;
    });

    let maxVotes = 0;
    let topSuspects: string[] = [];
    Object.entries(tally).forEach(([sid, count]) => {
      if (count > maxVotes) {
        maxVotes = count;
        topSuspects = [sid];
      } else if (count === maxVotes) {
        topSuspects.push(sid);
      }
    });

    const caught = topSuspects.length === 1 && topSuspects[0] === gameData.culpritId;

    if (caught) {
      onUpdateGameData({
        ...gameData,
        votes: finalVotes,
        caughtCulprit: true,
        phase: 'culprit_last_chance',
      });
    } else {
      // Culprit escaped arrest! Culprit gets +4 points, anyone who voted right still gets +1
      const awards: Record<string, number> = {
        [gameData.culpritId]: 4,
      };
      Object.entries(finalVotes).forEach(([voterId, suspectId]) => {
        if (voterId !== gameData.culpritId && suspectId === gameData.culpritId) {
          awards[voterId] = (awards[voterId] || 0) + 1;
        }
      });

      onUpdateGameData(
        {
          ...gameData,
          votes: finalVotes,
          caughtCulprit: false,
          phase: 'case_closed',
        },
        awards
      );
    }
  };

  const handleCulpritFinalShot = (chosenAlibi: string) => {
    const trueAlibi = lang === 'ar' ? currentCase.secretAlibiAr : currentCase.secretAlibiEn;
    const guessedRight = chosenAlibi === trueAlibi;

    const awards: Record<string, number> = {};
    if (guessedRight) {
      // Culprit deduced the secret alibi from the drawings! Steals +3 pts
      awards[gameData.culpritId] = 3;
      Object.entries(gameData.votes || {}).forEach(([voterId, suspectId]) => {
        if (voterId !== gameData.culpritId && suspectId === gameData.culpritId) {
          awards[voterId] = 1;
        }
      });
    } else {
      // Innocent witnesses triumph! +3 pts to every witness, +1 bonus for voting culprit
      players.forEach((p) => {
        if (p.id !== gameData.culpritId) {
          awards[p.id] = 3 + (gameData.votes?.[p.id] === gameData.culpritId ? 1 : 0);
        }
      });
    }

    onUpdateGameData(
      {
        ...gameData,
        culpritGuess: chosenAlibi,
        culpritGuessedRight: guessedRight,
        phase: 'case_closed',
      },
      awards
    );
  };

  const handleStartNextCase = () => {
    const otherCases = ALIBI_CASES.filter((c) => c.id !== gameData.caseId);
    const nextCase =
      otherCases[Math.floor(Math.random() * otherCases.length)] || ALIBI_CASES[0];
    const nextCulprit =
      players[Math.floor(Math.random() * Math.max(1, players.length))] || players[0];

    setStrokes([]);
    setCaption('');
    setLocalSketchTurnIdx(0);
    setLocalVoteTurnIdx(0);
    setRoleRevealedPnP(!isPassAndPlay);

    onUpdateGameData({
      phase: 'sketch_alibi',
      caseId: nextCase.id,
      culpritId: nextCulprit.id,
      submissions: {},
      votes: {},
      caughtCulprit: undefined,
      culpritGuess: undefined,
      culpritGuessedRight: undefined,
    });
  };

  return (
    <div className="space-y-4 select-none [overflow-anchor:none]">
      {/* Crime Scene Tape Header Banner */}
      <div className="cartoon-card bg-[#161426] text-white overflow-hidden">
        <CrimeTapeBannerSvg className="w-full h-5" />
        <div className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <DetectiveBadgeSvg className="w-12 h-12 shrink-0" />
            <div>
              <div className="text-xs font-extrabold uppercase tracking-wider text-[#ffca3a] flex items-center gap-1.5">
                <MagnifyingGlass weight="bold" className="w-4 h-4" />
                <span>
                  {lang === 'ar'
                    ? `ملف القضية #${currentCase.id}: ${currentCase.titleAr}`
                    : `Case File #${currentCase.id}: ${currentCase.titleEn}`}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold mt-0.5 text-white">
                {lang === 'ar'
                  ? 'ارسم حجّتك! — تحقيق مسرح الجريمة'
                  : 'Sketch Your Alibi! — Crime Scene Interrogation'}
              </h2>
            </div>
          </div>

          {(isHost || isPassAndPlay) && (
            <button
              type="button"
              onClick={handleStartNextCase}
              className="cartoon-btn bg-[#ffca3a] text-[#161426] px-3.5 py-2 text-xs font-extrabold flex items-center gap-1.5"
            >
              <ArrowsClockwise weight="bold" className="w-4 h-4" />
              <span>{lang === 'ar' ? 'قضية جديدة' : 'New Case'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Public Crime Scene Location Card */}
      <div className="cartoon-card bg-[#fffdf5] p-4 sm:p-5 border-4 border-[#161426]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <span className="inline-block px-3 py-0.5 rounded-full bg-[#00bbf9] text-[#161426] border-2 border-[#161426] text-xs font-extrabold">
              {lang === 'ar' ? 'مسرح الجريمة المعلن للجميع' : 'Public Crime Scene Location'}
            </span>
            <p className="text-lg sm:text-xl font-extrabold text-[#161426]">
              {lang === 'ar' ? currentCase.locationAr : currentCase.locationEn}
            </p>
          </div>
          <MagnifierEvidenceSvg className="w-12 h-12 shrink-0 hidden sm:block" />
        </div>
      </div>

      {/* ===================================================================== */}
      {/* PHASE 1: SKETCH ALIBI                                                 */}
      {/* ===================================================================== */}
      {gameData.phase === 'sketch_alibi' && (
        <div className="space-y-4">
          {/* Pass-and-Play Turn Handoff Curtain */}
          {isPassAndPlay && !roleRevealedPnP ? (
            <div className="cartoon-card bg-[#9b5de5] text-white p-6 text-center space-y-4">
              <DetectiveBadgeSvg className="w-16 h-16 mx-auto" />
              <h3 className="text-2xl font-extrabold">
                {lang === 'ar'
                  ? `مرّر الجهاز إلى المشتبه به: ${activeSketchPlayer?.name}`
                  : `Pass device to suspect: ${activeSketchPlayer?.name}`}
              </h3>
              <p className="text-sm font-bold text-white/90 max-w-md mx-auto">
                {lang === 'ar'
                  ? 'تأكد أن لا أحد ينظر إلى شاشتك قبل كشف دورك السري ورسم حجّتك!'
                  : 'Make sure nobody is peeking at your screen before revealing your secret role and sketching your alibi!'}
              </p>
              <button
                type="button"
                onClick={() => setRoleRevealedPnP(true)}
                className="cartoon-btn bg-[#ffca3a] text-[#161426] px-6 py-3 text-base font-extrabold inline-flex items-center gap-2"
              >
                <Eye weight="bold" className="w-5 h-5" />
                <span>
                  {lang === 'ar'
                    ? `أنا ${activeSketchPlayer?.name} — اكشف دوري السري!`
                    : `I am ${activeSketchPlayer?.name} — Reveal My Role!`}
                </span>
              </button>
            </div>
          ) : (
            <>
              {/* Role & Secret Alibi Banner */}
              <div
                className={`cartoon-card p-4 sm:p-5 ${
                  isViewerCulprit
                    ? 'bg-[#ff595e] text-white'
                    : 'bg-[#8ac926] text-[#161426]'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#161426] text-white text-xs font-extrabold">
                      {isViewerCulprit ? (
                        <>
                          <WarningCircle weight="fill" className="w-4 h-4 text-[#ffca3a]" />
                          <span>
                            {lang === 'ar'
                              ? 'دورك السري: أنت المجرم المشتبه به!'
                              : 'Secret Role: You are the Culprit!'}
                          </span>
                        </>
                      ) : (
                        <>
                          <ShieldCheck weight="fill" className="w-4 h-4 text-[#8ac926]" />
                          <span>
                            {lang === 'ar'
                              ? 'دورك السري: شاهد بريء في مسرح الجريمة'
                              : 'Secret Role: Innocent Witness'}
                          </span>
                        </>
                      )}
                    </div>

                    {isViewerCulprit ? (
                      <div className="pt-1">
                        <p className="text-base sm:text-lg font-extrabold">
                          {lang === 'ar'
                            ? 'أنت لا تعرف تفصيل الحجّة السري! ارسم مشهداً مقنعاً في الموقع المعلن لتندمج مع الشهود دون أن يكشفوك!'
                            : 'You DO NOT know the Secret Alibi Detail! Draw a believable scene at the public location to blend in with the witnesses!'}
                        </p>
                      </div>
                    ) : (
                      <div className="pt-1 space-y-1">
                        <div className="text-xs font-extrabold uppercase opacity-85">
                          {lang === 'ar'
                            ? 'تفصيل الحجّة السري (يعرفه الشهود الأبرياء فقط):'
                            : 'Secret Alibi Detail (Known ONLY to Innocent Witnesses):'}
                        </div>
                        <p className="text-lg sm:text-xl font-extrabold bg-white/90 text-[#161426] px-3.5 py-2 rounded-xl border-2 border-[#161426] inline-block">
                          {lang === 'ar' ? currentCase.secretAlibiAr : currentCase.secretAlibiEn}
                        </p>
                        <p className="text-xs font-bold pt-0.5">
                          {lang === 'ar'
                            ? 'نصيحة: ادمج هذا التفصيل بذكاء في رسمتك ليعرف الشهود أنك بريء، دون أن تجعله واضحاً جداً للمجرم!'
                            : 'Tip: Subtly weave this detail into your sketch so witnesses trust you, without making it too obvious for the Culprit!'}
                        </p>
                      </div>
                    )}
                  </div>

                  {isPassAndPlay && (
                    <button
                      type="button"
                      onClick={() => setRoleRevealedPnP(false)}
                      className="cartoon-btn bg-white text-[#161426] px-3 py-1.5 text-xs font-extrabold flex items-center gap-1"
                    >
                      <EyeSlash weight="bold" className="w-4 h-4" />
                      <span>{lang === 'ar' ? 'إخفاء' : 'Hide'}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Sketch Canvas or Waiting State */}
              {hasSubmittedMyAlibi && !isPassAndPlay ? (
                <div className="cartoon-card bg-white p-6 text-center space-y-3">
                  <CheckCircle weight="fill" className="w-12 h-12 text-[#8ac926] mx-auto" />
                  <h3 className="text-xl font-extrabold text-[#161426]">
                    {lang === 'ar'
                      ? 'تم تسليم رسمة حجّتك إلى المحقق!'
                      : 'Your Alibi Sketch Has Been Submitted!'}
                  </h3>
                  <p className="text-sm font-bold text-[#161426]/70">
                    {lang === 'ar'
                      ? `بانتظار بقية المشتبه بهم (${Object.keys(gameData.submissions || {}).length} / ${players.length})...`
                      : `Waiting for other suspects (${Object.keys(gameData.submissions || {}).length} / ${players.length})...`}
                  </p>
                  <div className="flex flex-wrap justify-center gap-2 pt-2">
                    {players.map((p) => {
                      const done = Boolean(gameData.submissions?.[p.id]);
                      return (
                        <span
                          key={p.id}
                          className={`px-3 py-1 rounded-full text-xs font-extrabold border-2 border-[#161426] ${
                            done ? 'bg-[#8ac926] text-[#161426]' : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {p.name} {done ? '✓' : '...'}
                        </span>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="cartoon-card bg-white p-4 sm:p-5 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <PaintBrush weight="fill" className="w-5 h-5 text-[#9b5de5]" />
                      <span className="font-extrabold text-sm sm:text-base text-[#161426]">
                        {lang === 'ar'
                          ? `كراسة التحقيق — ${activeSketchPlayer?.name}`
                          : `Interrogation Sketchpad — ${activeSketchPlayer?.name}`}
                      </span>
                    </div>

                    {/* Brush Controls */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      {PALETTE.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setBrushColor(color)}
                          className={`w-7 h-7 rounded-full border-2 border-[#161426] transition-transform ${
                            brushColor === color ? 'scale-125 ring-2 ring-[#ffca3a]' : ''
                          }`}
                          style={{ backgroundColor: color }}
                          aria-label={color}
                        />
                      ))}

                      <div className="h-5 w-0.5 bg-[#161426]/20 mx-1" />

                      {[4, 8, 13].map((w) => (
                        <button
                          key={w}
                          type="button"
                          onClick={() => setBrushWidth(w)}
                          className={`px-2 py-1 rounded-lg border-2 border-[#161426] text-xs font-extrabold ${
                            brushWidth === w
                              ? 'bg-[#161426] text-white'
                              : 'bg-[#fffdf5] text-[#161426]'
                          }`}
                        >
                          {w === 4 ? 'S' : w === 8 ? 'M' : 'L'}
                        </button>
                      ))}

                      <button
                        type="button"
                        onClick={() => setStrokes((prev) => prev.slice(0, -1))}
                        disabled={strokes.length === 0}
                        className="cartoon-btn bg-[#ffca3a] text-[#161426] p-1.5 disabled:opacity-40"
                        title={lang === 'ar' ? 'تراجع' : 'Undo'}
                      >
                        <ArrowCounterClockwise weight="bold" className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setStrokes([])}
                        disabled={strokes.length === 0}
                        className="cartoon-btn bg-[#ff595e] text-white p-1.5 disabled:opacity-40"
                        title={lang === 'ar' ? 'مسح الكل' : 'Clear All'}
                      >
                        <Trash weight="bold" className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Drawing Canvas with strict scroll lock & touchAction: none */}
                  <div className="max-w-[320px] mx-auto aspect-square rounded-2xl border-4 border-[#161426] overflow-hidden shadow-[4px_4px_0px_#161426] bg-[#fffdf5]">
                    <svg
                      ref={svgCanvasRef}
                      viewBox="0 0 280 280"
                      style={{ touchAction: 'none' }}
                      onPointerDown={handlePointerDown}
                      onPointerMove={handlePointerMove}
                      onPointerUp={handlePointerUp}
                      onPointerCancel={handlePointerUp}
                      className="w-full h-full cursor-crosshair select-none touch-none"
                    >
                      {strokes.map((st, idx) => {
                        if (!st.pts || st.pts.length < 2) return null;
                        if (st.pts.length === 2) {
                          return (
                            <circle
                              key={idx}
                              cx={st.pts[0]}
                              cy={st.pts[1]}
                              r={st.w / 2}
                              fill={st.c}
                            />
                          );
                        }
                        let d = `M ${st.pts[0]} ${st.pts[1]}`;
                        for (let i = 2; i < st.pts.length; i += 2) {
                          d += ` L ${st.pts[i]} ${st.pts[i + 1]}`;
                        }
                        return (
                          <path
                            key={idx}
                            d={d}
                            fill="none"
                            stroke={st.c}
                            strokeWidth={st.w}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        );
                      })}
                    </svg>
                  </div>

                  {/* Verbal Alibi Caption Input */}
                  <div className="max-w-md mx-auto space-y-2">
                    <label className="block text-xs font-extrabold text-[#161426]">
                      {lang === 'ar'
                        ? 'إفادتك المكتوبة للمحقق (اختياري):'
                        : 'Your Written Statement to the Detective (optional):'}
                    </label>
                    <input
                      type="text"
                      maxLength={70}
                      value={caption}
                      onChange={(e) => setCaption(e.target.value)}
                      placeholder={
                        lang === 'ar'
                          ? 'مثال: كنت واقفاً بجانب التمثال في الصالة...'
                          : 'e.g., I was standing right next to the statue...'
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl border-3 border-[#161426] bg-[#fffdf5] font-bold text-sm text-[#161426] focus:outline-none focus:ring-2 focus:ring-[#00bbf9]"
                    />
                  </div>

                  <div className="text-center pt-1">
                    <button
                      type="button"
                      onClick={handleSubmitAlibi}
                      disabled={strokes.length === 0}
                      className="cartoon-btn bg-[#8ac926] text-[#161426] px-6 py-3 text-base font-extrabold inline-flex items-center gap-2 disabled:opacity-50"
                    >
                      <CheckCircle weight="bold" className="w-5 h-5" />
                      <span>
                        {lang === 'ar'
                          ? 'اعتماد رسمة الحجّة وتسليمها للمحقق'
                          : 'Submit Alibi Sketch to Detective'}
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* PHASE 2: INTERROGATION VOTE (DETECTIVE CASEBOARD GRID)                */}
      {/* ===================================================================== */}
      {gameData.phase === 'interrogation_vote' && (
        <div className="space-y-4">
          <div className="cartoon-card bg-[#ffca3a] text-[#161426] p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <HandcuffsSvg className="w-11 h-11 shrink-0" />
              <div>
                <h3 className="text-lg sm:text-xl font-extrabold">
                  {lang === 'ar'
                    ? 'معرض الاستجواب — من رسم حجّة مزيّفة؟'
                    : 'Interrogation Caseboard — Who Faked Their Alibi?'}
                </h3>
                <p className="text-xs sm:text-sm font-bold text-[#161426]/80">
                  {isPassAndPlay
                    ? lang === 'ar'
                      ? `دور التصويت الآن لـ: ${activeVoterPlayer?.name}`
                      : `Now voting: ${activeVoterPlayer?.name}`
                    : lang === 'ar'
                      ? 'افحص رسومات وإفادات الجميع، ثم صوّت للقبض على المجرم الذي لم يعرف التفصيل السري!'
                      : 'Inspect every sketch and statement, then vote to arrest the Culprit who missed the secret detail!'}
                </p>
              </div>
            </div>

            <div className="px-3 py-1.5 rounded-xl bg-white border-2 border-[#161426] text-xs font-extrabold">
              {lang === 'ar'
                ? `الأصوات: ${Object.keys(gameData.votes || {}).length} / ${players.length}`
                : `Votes: ${Object.keys(gameData.votes || {}).length} / ${players.length}`}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {players.map((suspect) => {
              const sub = gameData.submissions?.[suspect.id];
              const isMe = suspect.id === activeVoterId && players.length > 1;
              const myCurrentVote = gameData.votes?.[activeVoterId];
              const isVotedByMe = myCurrentVote === suspect.id;

              return (
                <div
                  key={suspect.id}
                  className={`cartoon-card bg-white p-3.5 flex flex-col justify-between space-y-3 transition-transform ${
                    isVotedByMe ? 'ring-4 ring-[#ff595e]' : ''
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3.5 h-3.5 rounded-full border-2 border-[#161426]"
                          style={{ backgroundColor: suspect.avatar_color || '#00bbf9' }}
                        />
                        <span className="font-extrabold text-sm text-[#161426]">
                          {suspect.name}
                        </span>
                      </div>
                      <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-md bg-[#161426] text-[#ffca3a]">
                        {lang === 'ar' ? 'دليل مستند' : 'Exhibit'}
                      </span>
                    </div>

                    <div className="aspect-square w-full rounded-xl border-3 border-[#161426] overflow-hidden bg-[#fffdf5]">
                      <AlibiDrawingPreview strokes={sub?.strokes || []} />
                    </div>

                    <div className="p-2.5 rounded-xl bg-[#fffdf5] border-2 border-[#161426] text-xs font-bold text-[#161426]">
                      "{sub?.caption || (lang === 'ar' ? 'بدون تعليق' : 'No statement')}"
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={isMe || (hasVotedMySuspect && !isPassAndPlay)}
                    onClick={() => handleCastArrestVote(suspect.id)}
                    className={`cartoon-btn w-full py-2.5 px-3 text-xs font-extrabold flex items-center justify-center gap-1.5 ${
                      isVotedByMe
                        ? 'bg-[#ff595e] text-white'
                        : isMe
                          ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                          : 'bg-[#00bbf9] text-[#161426]'
                    }`}
                  >
                    <UserFocus weight="bold" className="w-4 h-4" />
                    <span>
                      {isVotedByMe
                        ? lang === 'ar'
                          ? 'تم التصويت للقبض عليه!'
                          : 'Voted to Arrest!'
                        : isMe
                          ? lang === 'ar'
                            ? 'حجّتك الشخصية'
                            : 'Your Own Alibi'
                          : lang === 'ar'
                            ? `اتّهم ${suspect.name} بالجريمة!`
                            : `Accuse ${suspect.name}!`}
                    </span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* PHASE 3: CULPRIT'S LAST CHANCE TO STEAL VICTORY                       */}
      {/* ===================================================================== */}
      {gameData.phase === 'culprit_last_chance' && (
        <div className="cartoon-card bg-[#ff595e] text-white p-5 sm:p-6 space-y-5">
          <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-start">
            <HandcuffsSvg className="w-16 h-16 shrink-0" />
            <div className="space-y-1">
              <div className="inline-block px-3 py-0.5 rounded-full bg-[#161426] text-[#ffca3a] text-xs font-extrabold">
                {lang === 'ar' ? 'تمت محاصرة المجرم بالأصوات!' : 'Culprit Cornered by Majority Vote!'}
              </div>
              <h3 className="text-2xl font-extrabold">
                {lang === 'ar'
                  ? `فرصة ${culpritPlayer?.name} الأخيرة لسرقة الفوز!`
                  : `${culpritPlayer?.name}'s Last Chance to Steal Victory!`}
              </h3>
              <p className="text-sm font-bold text-white/90">
                {lang === 'ar'
                  ? 'إذا استطاع المجرم استنتاج "تفصيل الحجّة السري" من رسومات الشهود الآن، يقلب الطاولة ويفوز بـ 3 نقاط!'
                  : 'If the Culprit deduces the true Secret Alibi Detail from the witnesses’ sketches right now, they flip the case and steal +3 points!'}
              </p>
            </div>
          </div>

          {isPassAndPlay || myPlayerId === gameData.culpritId ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {culpritChoices.map((optionText, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleCulpritFinalShot(optionText)}
                  className="cartoon-btn bg-[#fffdf5] text-[#161426] p-3.5 text-start font-extrabold text-sm hover:bg-[#ffca3a] transition-colors"
                >
                  {optionText}
                </button>
              ))}
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-[#161426]/30 border-2 border-[#161426] text-center font-extrabold text-sm">
              {lang === 'ar'
                ? `بانتظار المجرم (${culpritPlayer?.name}) لاختيار التفصيل السري من لوحة الأدلة...`
                : `Waiting for the Culprit (${culpritPlayer?.name}) to guess the Secret Alibi Detail...`}
            </div>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* PHASE 4: CASE CLOSED & SCORE SUMMARY                                  */}
      {/* ===================================================================== */}
      {gameData.phase === 'case_closed' && (
        <div className="space-y-4">
          <div
            className={`cartoon-card p-5 sm:p-6 ${
              !gameData.caughtCulprit || gameData.culpritGuessedRight
                ? 'bg-[#ff924c] text-[#161426]'
                : 'bg-[#8ac926] text-[#161426]'
            }`}
          >
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <DetectiveBadgeSvg className="w-16 h-16 shrink-0" />
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#161426] text-[#ffca3a] text-xs font-extrabold">
                    <Trophy weight="fill" className="w-3.5 h-3.5" />
                    <span>{lang === 'ar' ? 'إغلاق ملف القضية' : 'Case File Closed'}</span>
                  </div>

                  <h3 className="text-2xl font-extrabold">
                    {!gameData.caughtCulprit
                      ? lang === 'ar'
                        ? `هرب المجرم ${culpritPlayer?.name} بخدعة متقنة! (+4 نقاط)`
                        : `Culprit ${culpritPlayer?.name} Escaped Undetected! (+4 pts)`
                      : gameData.culpritGuessedRight
                        ? lang === 'ar'
                          ? `المجرم ${culpritPlayer?.name} كشف الحجّة السرية وسرق الفوز! (+3 نقاط)`
                          : `Culprit ${culpritPlayer?.name} Deduced the Secret Alibi! (+3 pts)`
                        : lang === 'ar'
                          ? `انتصر الشهود الأبرياء وتم القبض على ${culpritPlayer?.name}!`
                          : `Innocent Witnesses Triumph & Arrested ${culpritPlayer?.name}!`}
                  </h3>

                  <p className="text-sm font-extrabold">
                    {lang === 'ar'
                      ? `تفصيل الحجّة السري الحقيقي كان: "${currentCase.secretAlibiAr}"`
                      : `The True Secret Alibi Detail was: "${currentCase.secretAlibiEn}"`}
                  </p>

                  {gameData.culpritGuess && (
                    <p className="text-xs font-bold opacity-90">
                      {lang === 'ar'
                        ? `تخمين المجرم الأخير: "${gameData.culpritGuess}"`
                        : `Culprit's Final Guess: "${gameData.culpritGuess}"`}
                    </p>
                  )}
                </div>
              </div>

              {(isHost || isPassAndPlay) && (
                <button
                  type="button"
                  onClick={handleStartNextCase}
                  className="cartoon-btn bg-[#161426] text-white px-5 py-3 text-sm font-extrabold flex items-center gap-2 shrink-0"
                >
                  <ArrowsClockwise weight="bold" className="w-5 h-5 text-[#ffca3a]" />
                  <span>{lang === 'ar' ? 'القضية التالية' : 'Next Case'}</span>
                </button>
              )}
            </div>
          </div>

          {/* All Sketches & Votes Breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {players.map((p) => {
              const sub = gameData.submissions?.[p.id];
              const isCulprit = p.id === gameData.culpritId;
              const votedFor = players.find((x) => x.id === gameData.votes?.[p.id]);

              return (
                <div
                  key={p.id}
                  className={`cartoon-card p-3.5 space-y-2.5 ${
                    isCulprit ? 'bg-[#ff595e]/15 border-[#ff595e]' : 'bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-extrabold text-sm text-[#161426]">{p.name}</span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold border-2 border-[#161426] ${
                        isCulprit ? 'bg-[#ff595e] text-white' : 'bg-[#8ac926] text-[#161426]'
                      }`}
                    >
                      {isCulprit
                        ? lang === 'ar'
                          ? 'المجرم'
                          : 'The Culprit'
                        : lang === 'ar'
                          ? 'شاهد بريء'
                          : 'Witness'}
                    </span>
                  </div>

                  <div className="aspect-square w-full rounded-xl border-3 border-[#161426] overflow-hidden bg-[#fffdf5]">
                    <AlibiDrawingPreview strokes={sub?.strokes || []} />
                  </div>

                  <div className="p-2 rounded-lg bg-[#fffdf5] border-2 border-[#161426] text-xs font-bold text-[#161426]">
                    "{sub?.caption || ''}"
                  </div>

                  {votedFor && (
                    <div className="text-[11px] font-extrabold text-[#161426]/75">
                      {lang === 'ar'
                        ? `صوّت ضد: ${votedFor.name}`
                        : `Voted against: ${votedFor.name}`}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
