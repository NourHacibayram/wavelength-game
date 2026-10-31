import { PartyGameId, PartyGameCategory } from './partyGamesData';

export interface PartyGameCatalogItem {
  id: PartyGameId;
  category: Exclude<PartyGameCategory, 'all'>;
  accent: string;
  bgTint: string;
  players_ar: string;
  players_en: string;
  tag_ar: string;
  tag_en: string;
  name_ar: string;
  name_en: string;
  desc_ar: string;
  desc_en: string;
  longDesc_ar: string;
  longDesc_en: string;
  rules_ar: string[];
  rules_en: string[];
  isNew?: boolean;
}

export const ARCHIVED_BOARD_GAMES_CATALOG: PartyGameCatalogItem[] = [
  {
    id: 'trix',
    category: 'board',
    accent: '#d97706',
    bgTint: '#fef3c7',
    players_ar: '1–4 لاعبين (+بوتات ذكية)',
    players_en: '1–4 Players (+Smart Bots)',
    tag_ar: 'شدّة شامية أصيلة',
    tag_en: 'Classic Card Game',
    name_ar: 'تركس الملوك (الممالك الخمس)',
    name_en: 'Trix Royal (5 Kingdoms)',
    desc_ar: 'اللعبة الشعبية الأشهر! الممالك الـ 5 الكاملة: شيخ الكبة، البنات، الديناري، اللطش والتركس!',
    desc_en: 'The iconic 4-seat Levantine card game with all 5 Kingdoms: King of Hearts, Queens, Diamonds, Tricks & Trix!',
    longDesc_ar:
      'طاولة تركس ملوكية كاملة لـ 4 مقاعد (مع إكمال تلقائي ببوتات ذكية)! لكل لاعب مملكته الخاصة من 5 عقود (شيخ الكبة، البنات، الديناري، اللطش، والتركس) مع خيار الشراكة 2 ضد 2 وخاصية التدبيل!',
    longDesc_en:
      'Full 4-seat Levantine Trix with smart AI bots filling empty seats! Each player commands a 5-Contract Kingdom (King of Hearts, Queens, Diamonds, Tricks & Trix), Solo or 2v2 Partners, with x2 Doubling!',
    rules_ar: [
      'تُوزع 52 ورقة بالتساوي (13 لكل مقعد)، ولكل لاعب مملكة تضم 5 عقود يختار ترتيبها حسب أوراق يده!',
      'العقود الخمسة: شيخ الكبة (-75)، البنات (-25 لكل بنت)، الديناري (-10 لكل ديناري)، اللطش (-15 لكل أكلة)، والتركس (+200 للأول)!',
      'قبل بدء شيخ الكبة أو البنات يمكنك «تدبيل ×2» لمضاعفة العقوبة (-150 أو -50) وكسب مكافأة فورية!',
      'في عقد «التركس»: نفتح السلاسل بالولد (J) صعوداً للـ A ونزولاً للـ 2، وأول من يفرغ يده يحصد +200 نقطة!',
    ],
    rules_en: [
      '52 cards are dealt (13 per seat); each player commands a Kingdom of 5 Contracts chosen based on their hand!',
      'The 5 Contracts: King of Hearts (-75), Queens (-25 each), Diamonds (-10 each), Tricks (-15 each), and Trix (+200 for 1st)!',
      'Before King of Hearts or Queens begins, holders can Double (x2) for double penalty & instant bonus points!',
      'In "Trix": open lanes with Jacks (J) up to A and down to 2 — 1st out scores +200, then +150, +100, +50!',
    ],
    isNew: true,
  },
  {
    id: 'monopoly',
    category: 'board',
    accent: '#10b981',
    bgTint: '#d1fae5',
    players_ar: '1–8 لاعبين',
    players_en: '1–8 Players',
    tag_ar: 'إمبراطورية العقارات',
    tag_en: 'Property Tycoon',
    name_ar: 'مونوبولي الشلّة (مدن العرب)',
    name_en: 'Shilla Monopoly (Arab Cities)',
    desc_ar: 'اشترِ المدن العربية، ابنِ البيوت والفنادق، افتح المزادات وافلس خصومك!',
    desc_en: 'Buy iconic Arab cities, build houses & hotels, run auctions, and bankrupt rivals!',
    longDesc_ar:
      'لوحة مونوبولي متكاملة من 24 مربعاً بأشهر المدن العربية (دمشق، القاهرة، بيروت، عمّان، القدس، الرياض، دبي...)! اشترِ، زايد بالمزاد العلني، بادل العقارات، وابنِ الفنادق الملكية!',
    longDesc_en:
      'Full 24-space perimeter board featuring iconic Arab capitals! Roll 2 dice, buy or auction cities, trade deeds, complete color pairs to build houses & royal hotels, and claim the Jackpot!',
    rules_ar: [
      'ارمِ النردين لتحريك قطعتك حول المدن العربية، واقبض 200$ في كل مرة تمر فيها بمربع «انطلاق»! الدبل يمنحك رمية إضافية.',
      'عند الوقوف على مدينة حرة: اشترِ صك ملكيتها فوراً أو اطرحها في «مزاد علني سريع» يزايد فيه الجميع!',
      'امتلاك مدينتي اللون نفسه يضاعف الإيجار ويفتح لك بناء البيوت الخضراء والفندق الملكي لرفع الإيجار لأرقام فلكية!',
      'احذر بطاقات الحظ والضرائب والسجن، وفاوض أصحابك بصفقات التبادل حتى تتوّج أغنى إمبراطور عقاري!',
    ],
    rules_en: [
      'Roll 2 dice to travel around Arab capitals and collect $200 every time you pass GO! Doubles grant a bonus roll.',
      'Land on an unowned city to buy its Deed at face value — or pass to trigger a live bidding Auction for everyone!',
      'Own both cities of a color pair to double rent and build Houses & a Royal Hotel for massive payouts!',
      'Navigate Chance, Chest, Jail, Free Parking Jackpot, and 1-click Trades to become the ultimate Tycoon!',
    ],
    isNew: true,
  },
  {
    id: 'snakes',
    category: 'board',
    accent: '#22c55e',
    bgTint: '#dcfce7',
    players_ar: '1–10 لاعبين',
    players_en: '1–10 Players',
    tag_ar: 'سباق ومفاجآت',
    tag_en: 'Board Race 1–100',
    name_ar: 'الحيّة والسلّم (الثعبان والسلالم)',
    name_en: 'Snakes & Ladders Deluxe',
    desc_ar: 'سباق مشتعل من 1 إلى 100! اصعد السلالم الذهبية واحذر كوبرا المربع 99!',
    desc_en: 'Race from 1 to 100! Climb golden ladders, use shields & dodge the 99 King Cobra!',
    longDesc_ar:
      'اللعبة الكلاسيكية المحبوبة بلوحة كرتونية نابضة بالحياة (1–100)! ارمِ النرد (الـ 6 تعطيك رمية إضافية)، تسلّق السلالم الخشبية والذهبية، وجرّب «وضع أكشن الشلّة» مع الدروع والصواريخ وتبديل الأماكن!',
    longDesc_en:
      'The beloved 1-to-100 board race with animated hops, custom cartoon snakes & ladders, bonus rolls on 6, exact-100 bounce, plus optional Party Power Tiles (Rockets, Snake Shields & Swaps)!',
    rules_ar: [
      'يبدأ الجميع من المربع 1 ويتناوبون رمي النرد للتقدم نحو القمة — وإذا جبت الرقم 6 تكسب رمية إضافية فوراً!',
      'الوقوف أسفل «سلّم» يطير بك فوراً إلى قمته ويختصر عليك عشرات المربعات للأمام!',
      'الوقوف على رأس «ثعبان» يزحلقك لذيله بالأسفل (إلا إذا كنت تحمل درع الحماية في وضع أكشن الشلّة!).',
      'أول لاعب يصل للمربع 100 بالضبط يتوّج بالفوز (وإذا زاد رقم النرد عن 100 يرتد للخلف — فاحذر ثعبان الـ 99!).',
    ],
    rules_en: [
      'Start at Square 1 and roll the die to advance — rolling a 6 immediately grants a bonus roll!',
      'Land at the foot of a Ladder to zip straight up to its top square and leapfrog the pack!',
      'Land on a Snake’s head and slide all the way down to its tail (unless protected by a Party Shield!).',
      'Reach Square 100 on the exact count to win — overshooting bounces back, right near the dreaded 99 Snake!',
    ],
    isNew: true,
  },
];

export const PARTY_GAMES_CATALOG: PartyGameCatalogItem[] = [
  {
    id: 'wavelength',
    category: 'telepathy',
    accent: '#ff595e',
    bgTint: '#ffe8e8',
    players_ar: '2–12 لاعب',
    players_en: '2–12 Players',
    tag_ar: 'تخاطر ومقاييس',
    tag_en: 'Telepathy Dial',
    name_ar: 'عَ نفس الموجة',
    name_en: 'Wavelength',
    desc_ar: 'تخاطر المؤشر السري بين طرفين متضادين!',
    desc_en: 'Read your friend’s mind on a hidden spectrum!',
    longDesc_ar:
      'العرّاف يشوف مكان الهدف السري عالعجلة ويعطي كلمة تلميح، وكل لاعب يحرّك مؤشره الشخصي للمكان الصح!',
    longDesc_en:
      'One Psychic sees the hidden target wedge and gives a single clue while everyone locks their personal pointer!',
    rules_ar: [
      'لاعب واحد يكون العرّاف وهو الوحيد الذي يرى موقع الهدف الملوّن عالعجلة.',
      'ينظر العرّاف لبطاقة المقياس (مثلاً: بارد — ساخن) ويكتب تلميحاً ذكياً بدون أرقام.',
      'كل لاعب يحرّك مؤشره الشخصي للمكان الذي يتوقعه ويثبت تخمينه.',
      'نفتح الغطاء! الإصابة بالمنتصف تعطي 4 نقاط، وبجانبها 3 أو 2 نقطة!',
    ],
    rules_en: [
      'One player is the Psychic and peeks at the hidden target wedge on the wheel.',
      'Look at the spectrum card (e.g. Cold — Hot) and give one conceptual clue.',
      'Every player drags their personal needle and locks in their angle.',
      'Open the screen! Center blue scores 4 pts, orange 3 pts, yellow 2 pts!',
    ],
  },
  {
    id: 'skull',
    category: 'bluff',
    accent: '#e11d48',
    bgTint: '#ffe4e6',
    players_ar: '2–10 لاعبين',
    players_en: '2–10 Players',
    tag_ar: 'فخاخ ومزايدة',
    tag_en: 'Roses & Skulls',
    name_ar: 'الجمجمة والورد',
    name_en: 'Skull & Roses',
    desc_ar: '3 ورود وجمجمة قاتلة! ازرع الفخاخ وزايد ع قلب الأقراص بدون ما تنفجر الجمجمة بوجهك!',
    desc_en: '3 Roses & 1 deadly Skull! Bluff, bid high, and flip discs without hitting a hidden Skull!',
    longDesc_ar:
      'كل لاعب يملك 3 أقراص ورد وقرص جمجمة واحد! ضع أقراصاً مقلوبة أو افتح المزايدة على عدد الورود التي تجرؤ على قلبها — لكن احذر: أنت مجبر على قلب أقراصك أنت أولاً قبل لمس أقراص أصحابك!',
    longDesc_en:
      'Every player holds 3 Rose discs and 1 Skull disc! Stack discs face-down or launch a high-stakes bid — but remember the Golden Rule: you MUST flip all of your own discs first before touching anyone else’s!',
    rules_ar: [
      'يبدأ كل لاعب وبيده 4 أقراص سرية: 3 ورود آمنة وجمجمة واحدة قاتلة.',
      'في دورك: إما أن تضيف قرصاً مقلوباً جديداً أمامك، أو تفتح «المزايدة» بعدد الأقراص التي تتحدى قلبها.',
      'صاحب أعلى مزايدة يقلب الأقراص واحداً تلو الآخر، ومجبور يقلب كل أقراصه هو أولاً قبل أقراص أصحابه!',
      'إذا قلبت العدد المطلوب كله ورود تكسب نقطة فوز (نقطتان للفوز بالمباراة)، وإذا ظهرت جمجمة تخسر قرصاً من يدك عشوائياً!',
    ],
    rules_en: [
      'Each player starts with 4 secret discs: 3 safe Roses and 1 deadly Skull.',
      'On your turn: either place another disc face-down on your mat, or start the Bidding challenge.',
      'The highest bidder flips discs one by one — and MUST flip all of their own discs first!',
      'Flip only Roses to win a point (2 wins the match); hit a Skull and lose 1 random disc permanently!',
    ],
    isNew: true,
  },
  {
    id: 'sheriff',
    category: 'bluff',
    accent: '#d97706',
    bgTint: '#fef3c7',
    players_ar: '2–10 لاعبين',
    players_en: '2–10 Players',
    tag_ar: 'تهريب ورشوة',
    tag_en: 'Customs & Bribes',
    name_ar: 'مهرّب الجمارك',
    name_en: 'Contraband Sheriff',
    desc_ar: 'خبّئ المهربات بالشنطة، احلف إنها تفاح، أو ارشِ الضابط ليمرّقك بدون تفتيش!',
    desc_en: 'Smuggle diamonds in your bag, claim it’s apples, or bribe the Customs Officer to look away!',
    longDesc_ar:
      'بكل جولة لاعب واحد هو «ضابط الجمارك» والبقية مسافرون يجهزون شنطهم المقفولة بـ 3 بضائع (نظامية أو مهربات غالية)! اعرض رشوة أو العب على أعصاب الضابط ليفتشك وأنت صادق فيدفع لك تعويضاً من جيبه!',
    longDesc_en:
      'One player is the Customs Officer while everyone else packs 3 secret goods (Legal or high-value Contraband) into locked suitcases! Offer bribes or bait the Officer into inspecting an honest bag for a hefty payout!',
    rules_ar: [
      'يختار كل مسافر 3 بضائع بالسر ليضعها في شنطته (بضاعة نظامية مثل التفاح والجبن، أو مهربات نادرة كالألماس والحرير).',
      'يعلن المسافر نوع بضاعة نظامية واحدة، ويمكنه إرفاق «رشوة ذهبية» لإغراء الضابط بعدم فتح الشنطة!',
      'ضابط الجمارك يقرر لكل شنطة: إما «قبول الرشوة وتمرير الشنطة»، أو «فتح وتفتيش الشنطة!».',
      'إذا فُتحت الشنطة وكان المسافر كاذباً تُصادر المهربات ويدفع غرامة للضابط، أما إذا كان صادقاً فالضابط يدفع له تعويضاً مضاعفاً!',
    ],
    rules_en: [
      'Merchants secretly pack 3 goods into their suitcase (Legal goods or high-profit Contraband).',
      'Declare a legal good type and optionally attach a Gold Bribe to tempt the Customs Officer.',
      'The Officer chooses for each suitcase: Pass & pocket the bribe, OR Open & Inspect!',
      'Caught smugglers lose contraband & pay fines; falsely accused honest merchants win compensation from the Officer!',
    ],
    isNew: true,
  },
  {
    id: 'cashnguns',
    category: 'speed',
    accent: '#f97316',
    bgTint: '#ffedd5',
    players_ar: '2–10 لاعبين',
    players_en: '2–10 Players',
    tag_ar: 'مواجهة وغنيمة',
    tag_en: 'Heist Standoff',
    name_ar: 'قسمة العصابة',
    name_en: 'Cash ’n Guns',
    desc_ar: 'طلقة فاضية للتخويف ولا طلقة حقيقية؟ صوّب ع صاحبك، وقرر: تصمد عالكنز ولا تنسحب!',
    desc_en: 'Blank click or live foam dart? Aim at a friend, then decide: hold your ground for loot or duck!',
    longDesc_ar:
      'عصابتكم سرقت الخزنة وحان وقت تقسيم الألماس والذهب! عمّر سلاحك الكرتوني بالسر (طلقة فاضية «طَقّ!» للتخويف أو طلقة حقيقية «بوم!»)، صوّب على أحد أصحابك، ثم قرر بشجاعة: تصمد لتأخذ حصتك أم تنسحب؟',
    longDesc_en:
      'The heist is over — now split the loot! Secretly load a Blank ("CLICK!") or Live Foam Dart ("BANG!"), aim at a rival, and make a split-second choice: Stay for your share of the vault or Duck for cover!',
    rules_ar: [
      'يملك كل لاعب 3 طلقات فاضية للتخويف («طَقّ!») وطلقتين حقيقيتين («بوم!») عبر 5 جولات لتقسيم الغنيمة.',
      'المرحلة 1: يختار كل لاعب بالسر نوع طلقته ويصوّب مسدسه الكرتوني نحو أحد اللاعبين.',
      'المرحلة 2: ينكشف مين مصوّب على مين! وهنا يقرر كل لاعب: «أصمد بمكاني» أم «أنسحب وأحمي نفسي».',
      'المنسحب يسلم من الإصابة لكنه ينحرم من الغنيمة، والصامد الذي لا يُصاب بطلقة حقيقية يتقاسم دولارات الخزنة والألماس!',
    ],
    rules_en: [
      'Each player holds 3 Blanks ("CLICK!") and 2 Live Darts ("BANG!") across 5 heist rounds.',
      'Phase 1: Secretly pick your bullet card and choose which rival to aim at.',
      'Phase 2: All targets are revealed! Decide whether to Hold Your Ground or Duck for Cover.',
      'Ducking keeps you safe but forfeits loot; unhit players who Stay split the cash, paintings & diamonds!',
    ],
    isNew: true,
  },
  {
    id: 'onenight',
    category: 'bluff',
    accent: '#7c3aed',
    bgTint: '#ede9fe',
    players_ar: '2–10 لاعبين',
    players_en: '2–10 Players',
    tag_ar: 'مافيا وتبديل أدوار',
    tag_en: '1-Night Werewolf',
    name_ar: 'ليلة الذئب (تبديل الأدوار)',
    name_en: 'One Night Werewolf',
    desc_ar: 'مافيا بليلة واحدة بدون إقصاء! اللص والمشاغب يبدّلون كروتكم بالليل بدون علمكم!',
    desc_en: 'Fast 1-night Mafia with zero elimination! Robber & Troublemaker swap roles while you sleep!',
    longDesc_ar:
      'نسخة المافيا الأذكى عالمياً بدون راوي وبدون أن يموت أحد وينتظر! في الليل تكشف العرّافة الأسرار، ويسرق اللص دور غيره، ويبدّل المشاغب كرتين بين لاعبين دون علمهما — وفي النهار تكتشف أن دورك انقلب رأساً على عقب!',
    longDesc_en:
      'The ultimate fast-paced Mafia twist with no moderator and no player elimination! During one single Night, the Seer peeks, the Robber steals a role, and the Troublemaker swaps two players’ cards behind their backs!',
    rules_ar: [
      'تُوزع الأدوار السرية على اللاعبين مع 3 بطاقات إضافية في وسط الطاولة (مستذئب، عرّافة، لص، مشاغب، يائس، قروي).',
      'في الليل ينفذ كل صاحب قدرة حركته السرية: اللص يسرق بطاقة لاعب ويعرف دوره الجديد، والمشاغب يبدّل بطاقتي لاعبين دون علمهما!',
      'في النهار يتناقش الجميع لكشف من أصبح «المستذئب النهائي» بعد تبديلات الليل ثم يصوّتون دفعة واحدة!',
      'إذا أُعدم مستذئب واحد على الأقل تفوز القرية، وإذا نجا المستذئب يفوز الذئاب (وإذا أُعدم اليائس يفوز وحده!).',
    ],
    rules_en: [
      'Secret roles are dealt to all players plus 3 face-down Center Cards (Werewolf, Seer, Robber, Troublemaker, Tanner, Villager).',
      'At Night, roles act in order: Robber steals a player’s role, and Troublemaker swaps two players’ roles blindly!',
      'At Daybreak, debate and deduce who holds the Werewolf card NOW after the night swaps, then vote!',
      'Catch a final Werewolf for a Village win; if Werewolves survive, they win (or Tanner wins if executed!).',
    ],
    isNew: true,
  },
  {
    id: 'resistance',
    category: 'bluff',
    accent: '#0284c7',
    bgTint: '#e0f2fe',
    players_ar: '2–10 لاعبين',
    players_en: '2–10 Players',
    tag_ar: 'مخابرات وخيانة',
    tag_en: 'Secret Missions',
    name_ar: 'المهمة السرية (المقاومة)',
    name_en: 'The Resistance',
    desc_ar: '5 مهمات مصيرية وجواسيس بينكم! صوّتوا عالفريق واكشفوا مين عم يكبس «تخريب المهمة» بالسر!',
    desc_en: '5 high-stakes missions & hidden Spies among you! Vote on teams and catch who secretly sabotages!',
    longDesc_ar:
      'أنتم خلية مخابرات أمام 5 مهمات حاسمة، لكن بينكم جواسيس خونة يعرفون بعضهم بالسر! القائد يرشح فريق المهمة والكل يصوّت عليه علناً، ثم ينفذ الفريق المهمة بالسر بين «إنجاح» أو «تخريب»!',
    longDesc_en:
      'Your intelligence cell faces 5 critical missions, but hidden Spies lurk among you! Vote publicly to approve or reject each Mission Team, then watch in suspense as team members secretly play Success or Sabotage!',
    rules_ar: [
      'ينقسم اللاعبون بالسر إلى «عملاء شرفاء» (هدفهم إنجاح 3 مهمات) و«جواسيس خونة» يعرفون بعضهم (هدفهم تخريب 3 مهمات).',
      'في كل جولة يختار القائد فريقاً للمهمة، ويصوّت جميع اللاعبين علناً بالموافقة أو الرفض على تشكيلة الفريق.',
      'الفريق الموافَق عليه ينفذ المهمة بالسر: العميل الشريف يدعم النجاح دائماً، بينما الجاسوس يختار بين التمويه (إنجاح) أو الضربة القاضية (تخريب)!',
      'تُكشف بطاقات المهمة بدون أسماء: بطاقة تخريب واحدة فقط تكفي لإفشال المهمة وإشعال الشكوك بين أعضاء الفريق!',
    ],
    rules_en: [
      'Players are secretly divided into Loyal Agents (win 3 Missions) and Hidden Spies (sabotage 3 Missions).',
      'Each round, the Leader proposes a Mission Team and everyone votes publicly to Approve or Reject it.',
      'Approved team members secretly submit a Mission Card: Agents must Succeed, while Spies can Succeed (bluff) or Sabotage!',
      'Mission cards are revealed anonymously — even a single Sabotage card blows up the mission and sparks paranoia!',
    ],
    isNew: true,
  },
  {
    id: 'artauction',
    category: 'drawing',
    accent: '#eab308',
    bgTint: '#fef9c3',
    players_ar: '2–10 لاعبين',
    players_en: '2–10 Players',
    tag_ar: 'مزاد وفخاخ الرسم',
    tag_en: 'Trap Art Auction',
    name_ar: 'مزاد الخربشات (تحفة أم فخ؟)',
    name_en: 'Masterpiece Trap Auction',
    desc_ar: 'ارسم لوحتك وحط وراها ختمك السري بإيدك (تحفة ذهبية +$5000 أو فخ -$3000) وبيعها بالمزاد!',
    desc_en: 'Draw a canvas, secretly stamp it yourself (+$5000 Masterpiece or -$3000 Trap!) & auction it to friends!',
    longDesc_ar:
      'الرسام هو من يحدد قيمة لوحته بالسر! ارسم لوحتك وضع خلفها ختمك الخفي (تحفة ملكية +$5,000 أو فخ ملغوم -$3,000!)، ثم افتح المزاد وأقنع الشلّة بشرائها لتأخذ دولاراتهم كاش بجيبك!',
    longDesc_en:
      '100% player-controlled values! Draw your canvas and secretly attach your own stamp behind it (+$5,000 Masterpiece or -$3,000 Cursed Trap!). Hype your art in the live auction, pocket the buyer’s cash, and watch the reveal!',
    rules_ar: [
      'يرسم كل لاعب لوحته السرية ويضع خلفها بيده ختماً مخفياً: «تحفة ملكية (+$5,000)» أو «فخ ملغوم (-$3,000)!».',
      'تُعرض اللوحات في قاعة المزاد، ويزايد اللاعبون بالدولارات لشراء اللوحة (والمبلغ المدفوع يذهب كاش لجيب الرسام!).',
      'احذر: إذا وضعت ختماً ملغوماً (-$3,000) ولم يزايد أحد على لوحتك، ستنفجر اللوحة الملغومة فيك أنت!',
      'عند حسم المزاد ينكشف الختم السري خلف اللوحة، وأغنى جامع ثروة وفن في النهاية يفوز!',
    ],
    rules_en: [
      'Each artist draws their prompt and secretly attaches a stamp behind it: +$5,000 Masterpiece or -$3,000 Trap!',
      'Paintings go up for live bidding — and whatever the highest bidder pays goes straight to the Artist’s pocket!',
      'Careful: if nobody bids on your painting, YOU keep it (blowing up your own -$3,000 Trap on yourself!).',
      'Reveal the secret stamp after each sale — highest combined Cash + Art Value wins!',
    ],
    isNew: true,
  },
  {
    id: 'alibi',
    category: 'drawing',
    accent: '#06b6d4',
    bgTint: '#cffafe',
    players_ar: '2–10 لاعبين',
    players_en: '2–10 Players',
    tag_ar: 'استجواب بالرسم',
    tag_en: 'Sketch Interrogation',
    name_ar: 'ارسم حجّتك! (مسرح الجريمة)',
    name_en: 'Draw Your Alibi',
    desc_ar: 'الشهود الأبرياء يدمجون «تفصيلاً سرياً» برسمتهم، والمجرم يرسم عالعمياني ليهرب من التهمة!',
    desc_en: 'Innocent witnesses sketch a secret shared alibi detail while the Culprit bluffs in the dark!',
    longDesc_ar:
      'وقعت جريمة سرقة والكل متهم! الشهود الأبرياء يعرفون «تفصيل الحجّة السري» الذي يجب دمجه بذكاء في رسمتهم، بينما المجرم يعرف مكان الجريمة فقط ويحاول رسم حجّة مقنعة دون أن ينفضح!',
    longDesc_en:
      'A heist went down and everyone is a suspect! Innocent Witnesses know the Secret Alibi Detail to weave into their sketch, while the Culprit only knows the Crime Location and must fake a convincing drawing!',
    rules_ar: [
      'يظهر مكان الجريمة للجميع، بينما يظهر «تفصيل الحجّة السري» (مثلاً: قطة فوق التمثال) للشهود الأبرياء فقط دون المجرم!',
      'يرسم كل لاعب مشهد حجّته خلال وقت التحقيق ليُثبت براءته للبقية بدون أن يفضح السر للمجرم.',
      'تُعرض جميع رسومات الحجّة معاً في غرفة الاستجواب، ويصوّت الجميع للقبض على المجرم المشتبه به!',
      'إذا انكشف المجرم، يحصل على فرصة أخيرة لتخمين «تفصيل الحجّة السري» من الرسومات لسرقة الفوز!',
    ],
    rules_en: [
      'Everyone sees the Crime Location, but only Innocent Witnesses see the Secret Alibi Detail!',
      'Every player sketches their alibi scene — subtle enough to hide from the Culprit, clear enough for Witnesses.',
      'Inspect all Alibi sketches side-by-side on the Detective Board and vote to arrest the Culprit!',
      'If caught, the Culprit gets one last shot to deduce the Secret Alibi Detail and steal the win!',
    ],
    isNew: true,
  },
  {
    id: 'splitsteal',
    category: 'bluff',
    accent: '#eab308',
    bgTint: '#fef08a',
    players_ar: '2–10 لاعبين',
    players_en: '2–10 Players',
    tag_ar: 'شراكة أم خيانة',
    tag_en: 'Split or Steal',
    name_ar: 'شرف اللصوص (شراكة أم غدر؟)',
    name_en: 'Honor Among Thieves',
    desc_ar: 'خزنة ذهب وكرتان سريتان: تقاسموا المليون بشرف (شراكة) أم اسرقها كلها وحدك (غدر)؟',
    desc_en: 'One golden vault & two secret orbs: Split the jackpot 50/50 or Steal it all for yourself?',
    longDesc_ar:
      'المواجهة النفسية الأشهر عالمياً! افحص الحقائب السرية، اختر شريكك للخزنة بعد الوعود والحلفان، ثم اختر كرتك الذهبية بالسر: «شراكة» للتقاسم بالنص، أم «غدر» لسرقة الخزنة كاملة (أو تفجيرها إذا طمع الاثنان معاً)!',
    longDesc_en:
      'The ultimate psychological dilemma! Peek at secret briefcases, negotiate your way into the Final Vault, and secretly lock your Golden Orb: SPLIT 50/50, STEAL 100%, or crash to $0 if both get greedy!',
    rules_ar: [
      'يحمل المرشحون حقائب سرية (ذهب ضخم أو فخ ضريبي!) ويقدمون وعودهم ليختار زعيم الجولة شريكه في الخزنة.',
      'يتواجه الشريكان أمام الخزنة ويختار كل منهما بالسر كرة ذهبية: «شراكة (Split)» أو «غدر وسرقة (Steal)» بينما يراهن البقية!',
      'إذا اختار الاثنان «شراكة» يتقاسمان الخزنة بالنص، وإذا اختار أحدهما «غدر» والآخر «شراكة» يسرق الغادر الخزنة كاملة!',
      'أما إذا طمع الاثنان واختارا «غدر» معاً: تحترق الخزنة ويخرج الاثنان بصفر بينما يربح المراهنون من الجمهور!',
    ],
    rules_en: [
      'Candidates hold secret briefcases and pitch promises so the Vault Boss picks them as Partner.',
      'The 2 Finalists face the Vault and secretly lock SPLIT or STEAL while spectators place side-bets!',
      'Both Split = 50/50 each! One Steals & One Splits = Betrayer takes 100% and loyal partner gets $0!',
      'Both Steal = Greed blows up the vault! Both get $0 while spectators who bet on Double Betrayal cash in!',
    ],
    isNew: true,
  },
  {
    id: 'chameleon',
    category: 'bluff',
    accent: '#5c73b8',
    bgTint: '#e6ecff',
    players_ar: '3–10 لاعبين',
    players_en: '3–10 Players',
    tag_ar: 'تحقيق وجاسوس',
    tag_en: 'Social Deduction',
    name_ar: 'برّا السالفة',
    name_en: 'Out of the Loop',
    desc_ar: 'اسألوا بذكاء واكشفوا مين الجاسوس اللي برّا السالفة!',
    desc_en: 'Question each other & catch the hidden impostor!',
    longDesc_ar:
      'الكل يعرف الكلمة السرية إلا واحد "برّا السالفة"! اسألوا بعض بالترتيب بدون ما تفضحوا الكلمة وصوّتوا عالجاسوس.',
    longDesc_en:
      'Everyone knows the secret word except one Chameleon! Ask clever questions without giving away the word, then vote!',
    rules_ar: [
      'تظهر الكلمة السرية لكل اللاعبين ما عدا لاعب واحد فقط يظهر له أنه "برّا السالفة".',
      'يسأل اللاعبون بعضهم سؤالاً وجواباً واحداً بالترتيب حول الكلمة بحذر.',
      'يصوّت الجميع على الشخص المشتبه بأنه برّا السالفة.',
      'إذا انكشف الجاسوس، يحصل على فرصة أخيرة لتخمين الكلمة السرية من الجدول وسرقة النقاط!',
    ],
    rules_en: [
      'Everyone sees the secret word except one player who is Out of the Loop.',
      'Take turns asking and answering subtle questions about the word.',
      'Vote together on who you suspect is faking it.',
      'If caught, the impostor gets one final shot to guess the secret word from the grid!',
    ],
  },
  {
    id: 'dixit',
    category: 'telepathy',
    accent: '#9b5de5',
    bgTint: '#f3e8ff',
    players_ar: '3–10 لاعبين',
    players_en: '3–10 Players',
    tag_ar: 'خيال ولوحات',
    tag_en: 'Surreal Art',
    name_ar: 'خيال الشلّة',
    name_en: 'Dixit Dreams',
    desc_ar: 'لوحات خيالية ساحرة وتلميح غامض لا سهل ولا مستحيل!',
    desc_en: 'Dreamlike art cards & Goldilocks poetic clues!',
    longDesc_ar:
      'الراوي يختار لوحة خيالية من يده ويعطي جملة أو تلميحاً، والبقية يرمون لوحات مشابهة لخداع الشلّة والتصويت!',
    longDesc_en:
      'The Storyteller plays a surreal card with a mysterious clue, friends play decoys, and everyone votes for the real one!',
    rules_ar: [
      'الراوي يختار لوحة سرية من أوراقه ويكتب تلميحاً خيالياً (جملة، أغنية، أو كلمة).',
      'باقي اللاعبين يختارون من أوراقهم أكثر لوحة تشبه تلميح الراوي لتمويه الآخرين.',
      'تُخلط اللوحات وتُعرض مكشوفة، ويصوّت الجميع على لوحة الراوي الحقيقية.',
      'إذا عرفها البعض فقط: الراوي ومن أصاب يأخذون +3! أما إذا عرفها الكل أو لم يعرفها أحد فالراوي يأخذ 0 والبقية +2!',
    ],
    rules_en: [
      'The Storyteller picks 1 surreal card from hand and gives a poetic/clever clue.',
      'Other players pick 1 card from their hand that best matches that clue as a decoy.',
      'All chosen cards are shuffled face-up and everyone votes for the Storyteller’s card.',
      'If SOME (not all, not zero) find it: Storyteller & finders get +3! Plus +1 per player fooled by your decoy!',
    ],
    isNew: true,
  },
  {
    id: 'taboo',
    category: 'speed',
    accent: '#ff595e',
    bgTint: '#ffe4e6',
    players_ar: '2–12 لاعب',
    players_en: '2–12 Players',
    tag_ar: 'تحدي شرح',
    tag_en: 'Forbidden Words',
    name_ar: 'الكلمات الممنوعة',
    name_en: 'Taboo Rush',
    desc_ar: 'اشرح الكلمة للشلّة بدون ما تزلّ لسانك بالـ 5 كلمات الممنوعة!',
    desc_en: 'Describe the target word without saying the 5 taboo words!',
    longDesc_ar:
      'عداد الثواني يركض! اشرح أكبر عدد من البطاقات لأصحابك بينما المراقب ينتظر أي زلّة لسان ليضغط جرس الإنذار!',
    longDesc_en:
      'Race the clock to describe words while the Watcher hovers over the Buzzer waiting for you to slip up!',
    rules_ar: [
      'الشارح يرى الكلمة المطلوبة وتحتها 5 كلمات ممنوعة تماماً.',
      'خلال 60 ثانية، اشرح الكلمة للشلّة بالصوت أو التلميح بدون نطق أي كلمة ممنوعة أو مشتقاتها.',
      'لاعب المراقبة يرى البطاقة أيضاً ومعه زر الجرس الأحمر لخصم البطاقة إذا غلطت!',
      'كل كلمة صحيحة تعطي نقاطاً للشارح وللفريق قبل انتهاء الوقت!',
    ],
    rules_en: [
      'The Describer sees the target word and 5 strictly forbidden Taboo words.',
      'Beat the 60-second timer by explaining as many cards as possible.',
      'Watchers see the forbidden list too and can hit the Red Buzzer if you slip!',
      'Score points for every clean guess before the timer runs out!',
    ],
    isNew: true,
  },
  {
    id: 'witness',
    category: 'drawing',
    accent: '#00bbf9',
    bgTint: '#e0f7ff',
    players_ar: '2–10 لاعبين',
    players_en: '2–10 Players',
    tag_ar: 'ذاكرة ورسم',
    tag_en: 'Memory Sketch',
    name_ar: 'الشاهد الوحيد',
    name_en: 'Sole Witness',
    desc_ar: 'شاهد الكائن العجيب 10 ثوانٍ فقط واوصفه ليرسموه عالعمياني!',
    desc_en: 'Memorize a bizarre monster in 10s & describe it for artists!',
    longDesc_ar:
      'الشاهد يرى وحشاً كرتونياً عجيباً لمدة 10 ثوانٍ ثم يختفي! يصفه من ذاكرته بينما البقية يرسمونه ثم نصوّت لأدق رسمة!',
    longDesc_en:
      'One Witness glimpses a weird monster for 10 seconds before it vanishes! Describe it from memory while friends draw it!',
    rules_ar: [
      'الشاهد الوحيد يضغط "ابدأ المشاهدة" ويرى الكائن العجيب لمدة 10 ثوانٍ فقط ثم يختفي!',
      'يصف الشاهد تفاصيل الكائن (عدد العيون، القرون، شكل الجسم، الأذرع) من ذاكرته.',
      'يرسم باقي اللاعبين الكائن على لوحة الرسم المباشرة ويرسلون لوحاتهم.',
      'نكشف الكائن الحقيقي بجانب إبداعات اللاعبين ونصوّت لأقرب وأظرف رسمة!',
    ],
    rules_en: [
      'The Witness views a weird cartoon creature for just 10 seconds before it disappears.',
      'From memory alone, the Witness describes its shape, eyes, horns, and limbs.',
      'Everyone else sketches what they hear on their canvas and submits.',
      'Reveal the real creature next to all drawings and vote for the best match!',
    ],
    isNew: true,
  },
  {
    id: 'fakeartist',
    category: 'drawing',
    accent: '#ff924c',
    bgTint: '#fff0e5',
    players_ar: '3–10 لاعبين',
    players_en: '3–10 Players',
    tag_ar: 'رسم وجاسوس',
    tag_en: 'Shared Canvas',
    name_ar: 'الفنان المزيّف',
    name_en: 'Fake Artist',
    desc_ar: 'لوحة مشتركة! كل لاعب يرسم خطاً واحداً... ومين اللي عم يخبّص؟',
    desc_en: 'One shared canvas, 1 stroke per turn — spot the Fake Artist!',
    longDesc_ar:
      'الكل يعرف شو عم نرسم إلا الفنان المزيّف يعرف التصنيف فقط! كل لاعب يرسم خطاً واحداً بلونه ليكمل اللوحة بدون ما يفضحها.',
    longDesc_en:
      'Everyone knows the secret object except one Fake Artist! Each player adds ONE stroke in their own color across 2 rounds.',
    rules_ar: [
      'يظهر عنوان التصنيف للجميع، وتظهر الكلمة السرية للرسامين الحقيقيين فقط (الفنان المزيف لا يراها!).',
      'يتناوب اللاعبون على لوحة واحدة: كل لاعب يرسم خطاً واحداً متصلاً بلونه الخاص في دوره (دورتان فقط).',
      'ارسم خطاً يثبت للبقية أنك تعرف الكلمة، لكن ليس واضحاً جداً كي لا يفهمها الفنان المزيف!',
      'بعد اكتمال الخطوط نصوّت لكشف الفنان المزيف، وإذا انكشف يحاول تخمين الرسمة!',
    ],
    rules_en: [
      'Everyone sees the Category, and real artists see the Secret Word (Fake Artist doesn’t!).',
      'Take turns drawing ONE single continuous stroke in your color on the shared canvas (2 strokes each).',
      'Be subtle enough to hide the word from the Fake Artist, yet clear enough to look innocent!',
      'Vote for the Fake Artist — if caught, they get one last guess at what the drawing is!',
    ],
    isNew: true,
  },
  {
    id: 'cockroach',
    category: 'bluff',
    accent: '#8ac926',
    bgTint: '#eefbe0',
    players_ar: '2–10 لاعبين',
    players_en: '2–10 Players',
    tag_ar: 'خداع وتحدي',
    tag_en: 'Bluff Poker',
    name_ar: 'بوكر الخداع',
    name_en: 'Critter Bluff',
    desc_ar: 'مرّر الكرت مقلوباً وادّعِ إنه عقرب... صادق ولا كذّاب؟',
    desc_en: 'Slide a critter card face-down & bluff — Truth or Lie?',
    longDesc_ar:
      'شوف كرت الحشرة السري ومرّره لصاحبك مع ادعاء (مثلاً: هذا خفاش!). صاحبك إما يكشفك (صادق/كذاب) أو يطلّ عليه ويمرره لغيره!',
    longDesc_en:
      'Peek at a creepy-cute critter card, slide it to a friend with a claim, and force them to call your bluff or pass it on!',
    rules_ar: [
      'اللاعب صاحب الدور يرى الكرت الحقيقي بالسر، يختار لاعباً ويدّعي اسماً للكرت (صدقاً أو كذباً!).',
      'اللاعب المستهدف لديه خياران: إما أن يتحدى فوراً (صادق / كذّاب)، أو يختلس النظر ويمرره للاعب لم يره بعد!',
      'إذا تحدّى وكان محقاً: يأخذ صاحب الادعاء الكرت كعقوبة، أما إذا أخطأ فيأخذه هو!',
      'أول لاعب يتجمع أمامه 3 كروت عقوبة يخسر الجولة والبقية يكسبون النقاط!',
    ],
    rules_en: [
      'Active player peeks at the hidden critter card, picks a target friend, and claims what critter it is.',
      'Target player can either call "Truth!" / "Lie!" right away, OR peek secretly and pass it to a new player!',
      'Whoever loses the bluff challenge takes the critter card face-up in front of them.',
      'Avoid collecting 3 penalty cards — sharp bluffers earn bonus points!',
    ],
    isNew: true,
  },
  {
    id: 'wits',
    category: 'speed',
    accent: '#ffca3a',
    bgTint: '#fff9db',
    players_ar: '2–12 لاعب',
    players_en: '2–12 Players',
    tag_ar: 'توقعات ورهان',
    tag_en: 'Trivia Betting',
    name_ar: 'مزايدة التخمين',
    name_en: 'Wits & Wagers',
    desc_ar: 'أسئلة أرقام مستحيلة! مو شرط تعرف الجواب... راهن ع صاحبك الصح!',
    desc_en: 'Wild number trivia — bet your chips on the closest guess!',
    longDesc_ar:
      'الكل يخمّن رقماً سرياً لسؤال عجيب، ثم تُفرش التخمينات على طاولة الرهان ليضع كل لاعب فيشاته على أقرب جواب!',
    longDesc_en:
      'Everyone submits a secret number guess, guesses are sorted on the betting mat, and everyone bets chips on the closest answer!',
    rules_ar: [
      'يظهر سؤال رقمي غريب وممتع، ويكتب كل لاعب تخمينه الرقمي بالسر.',
      'تُرتّب كل التخمينات تصاعدياً على طاولة المزايدة مع نسب مضاعفة النقاط.',
      'يملك كل لاعب فيشتي رهان (فيشة ذهبية وفيشة فضية) يضعهما على التخمين الذي يظنه الأقرب للجواب الحقيقي.',
      'يُكشف الرقم الحقيقي! صاحب أقرب تخمين يكسب مكافأة، وكل من راهن عليه يربح أضعاف فيشاته!',
    ],
    rules_en: [
      'Read a wild numerical question and submit your best secret number guess.',
      'All guesses are revealed and sorted ascending on the Cartoon Betting Mat.',
      'Place your 2 betting chips on whichever guess you think is closest to the real answer!',
      'Reveal the truth! Closest guesser + winning bettors cash in big points!',
    ],
    isNew: true,
  },
  {
    id: 'insider',
    category: 'bluff',
    accent: '#f15bb5',
    bgTint: '#ffe5f4',
    players_ar: '3–10 لاعبين',
    players_en: '3–10 Players',
    tag_ar: 'عميل خفي',
    tag_en: 'Reverse Spy',
    name_ar: 'العميل الداخلي',
    name_en: 'The Insider',
    desc_ar: 'حزروا الكلمة بأسئلة نعم/لا، ثم اكشفوا مين اللي كان يغشّشكم بالسر!',
    desc_en: 'Guess the word via Yes/No, then unmask who secretly steered you!',
    longDesc_ar:
      'الحَكم يعرف الكلمة، وواحد بينكم هو "العميل الداخلي" يعرفها كمان! العميل لازم يلمّحلكم لتفوزوا قبل الوقت بدون ما ينفضح!',
    longDesc_en:
      'The Judge knows the word, and 1 hidden Insider knows it too! Beat the 2-min clock with Yes/No questions, then catch the Insider!',
    rules_ar: [
      'يُعيّن حَكم يعرف الكلمة السرية، ولاعب واحد سري بينكم هو "العميل الداخلي" يعرف الكلمة أيضاً!',
      'المرحلة 1 (سباق الوقت): اسألوا أسئلة (نعم / لا) والحكم يجيب حتى يحزر أحدكم الكلمة قبل انتهاء الدقيقتين.',
      'إذا انتهى الوقت دون معرفة الكلمة يخسر الجميع بما فيهم العميل!',
      'المرحلة 2 (المحاكمة): بعد إيجاد الكلمة، ناقشوا وصوّتوا: مين سأل أسئلة مريبة وقادكم للحل؟',
    ],
    rules_en: [
      'One Judge knows the Secret Word — and one secret Insider among you knows it too!',
      'Phase 1: Ask Yes/No questions and guess the Secret Word before the 2-minute timer runs out.',
      'If time runs out, EVERYONE loses (including the Insider)!',
      'Phase 2: Once solved, debate and vote on who subtly steered the group to the answer!',
    ],
    isNew: true,
  },
  {
    id: 'medium',
    category: 'telepathy',
    accent: '#00f5d4',
    bgTint: '#e0fff9',
    players_ar: '2–10 لاعبين',
    players_en: '2–10 Players',
    tag_ar: 'تلاقي الأفكار',
    tag_en: 'Mind Meld',
    name_ar: 'التقاء العقول',
    name_en: 'Mind Meld',
    desc_ar: 'كلمتان مختلفتان... اكتبوا الكلمة اللي بتربطهم بنفس اللحظة!',
    desc_en: 'Two words — simultaneously type the exact link between them!',
    longDesc_ar:
      'لاعبان يواجهان كلمتين مثل (شمس + ثلج) ويكتبان الكلمة الرابطة بنفس اللحظة! إذا اختلفا، تصبح كلمتاهما هما الجسر الجديد حتى تتطابق عقولهما!',
    longDesc_en:
      'Two players see two words and simultaneously submit the connecting word! If different, their two new words form the next bridge until they match!',
    rules_ar: [
      'يختار النظام ثنائياً من اللاعبين ويعرض لهما كلمتين مختلفتين (مثلاً: قهوة — ليل).',
      'يكتب كل طرف بالسر الكلمة الواحدة التي تربط بينهما في ذهنه.',
      'إذا كتب الاثنان نفس الكلمة من أول محاولة: انفجار تخاطر أسطوري (+4 نقاط لكل منهما)!',
      'إذا اختلفت الكلمتان، تصبح الكلمتان الجديدتان هما طرفا الجسر للمحاولة 2 ثم 3 لتقترب الأفكار حتى تتطابق!',
    ],
    rules_en: [
      'An active pair of players gets two unrelated starting words.',
      'Both secretly submit ONE single word that connects those two concepts.',
      'If they match on Attempt 1: Mind Meld Jackpot (+4 pts each)!',
      'If not, their two newly submitted words become the new pair for Attempt 2 & 3 until they converge!',
    ],
    isNew: true,
  },
  {
    id: 'soclover',
    category: 'telepathy',
    accent: '#38b000',
    bgTint: '#e6f9e0',
    players_ar: '2–10 لاعبين',
    players_en: '2–10 Players',
    tag_ar: 'روابط ذكية',
    tag_en: 'Word Clover',
    name_ar: 'شفرة الأربع كلمات',
    name_en: 'Clover Code',
    desc_ar: 'اربط كل كلمتين متجاورتين بشفرة واحدة، وخلي الشلّة يركّبوا البورد!',
    desc_en: 'Link 4 word pairs on a clover & let friends reconstruct them!',
    longDesc_ar:
      'صاحب الشفرة يرى 4 كلمات موزعة حول زهرة البرسيم ويكتب كلمة رابطة لكل ضلع، ثم تُخلط الكلمات مع كلمة دخيلة ليحلّها الأصحاب!',
    longDesc_en:
      'Write 1 connecting clue for each of the 4 sides of your word clover, then shuffle them with a decoy for your team to solve!',
    rules_ar: [
      'تتوزع 4 كلمات سرية على زوايا زهرة البرسيم (أعلى، يمين، أسفل، يسار) لصاحب الدور.',
      'يكتب صاحب الدور كلمة تلميح واحدة تربط كل كلمتين متجاورتين (4 تلميحات على الأضلاع).',
      'تُسحب الكلمات الأربع وتُخلط مع كلمة خامسة دخيلة لتمويه الفريق!',
      'يتعاون باقي اللاعبين لوضع كل كلمة في زاويتها الصحيحة لتطابق عقل صاحب الشفرة!',
    ],
    rules_en: [
      '4 secret words sit on the corners of the Clue-Giver’s 2x2 Clover board.',
      'Write a 1-word clue on each of the 4 outer edges linking its two adjacent corner words.',
      'The 4 words are removed and shuffled with 1 sneaky decoy word!',
      'Friends work together to place the right 4 words back into their exact corner slots!',
    ],
    isNew: true,
  },
  {
    id: 'decrypto',
    category: 'bluff',
    accent: '#4361ee',
    bgTint: '#e5eaff',
    players_ar: '2–10 لاعبين',
    players_en: '2–10 Players',
    tag_ar: 'تشفير واستخبارات',
    tag_en: 'Code Breakers',
    name_ar: 'كسر الشيفرة',
    name_en: 'Decrypto',
    desc_ar: 'وصّل شيفرة الأرقام الـ 3 لفريقك بدون ما يفهمها الخصوم!',
    desc_en: 'Transmit a 3-digit secret code without getting intercepted!',
    longDesc_ar:
      'لديكم 4 كلمات مرقمة (1–4) وكود سري مثل (3 - 1 - 4)! أعطِ 3 تلميحات ذكية ليفكّ الشلّة الترتيب بدون كشف الكلمات الأصلية!',
    longDesc_en:
      'You have 4 numbered keywords (#1–#4) and a secret 3-digit code like 3-1-4. Give 3 clues so friends crack the order!',
    rules_ar: [
      'تظهر على الشاشة 4 كلمات مرقمة من #1 إلى #4.',
      'المشفِّر وحده يرى كود الجولة المكون من 3 أرقام مختلفة (مثلاً: 2 - 4 - 1).',
      'يكتب المشفِّر 3 تلميحات بالترتيب تدل على تلك الكلمات بذكاء.',
      'يحاول اللاعبون استنتاج الكود الثلاثي الصحيح بالترتيب لكسب نقاط فكّ التشفير!',
    ],
    rules_en: [
      '4 keywords sit in slots #1, #2, #3, and #4.',
      'Only the Encryptor sees the secret 3-digit sequence (e.g. 2 - 4 - 1).',
      'The Encryptor writes 3 clues corresponding to those three numbered words in order.',
      'Everyone else deduces which 3-digit sequence matches the clues to crack the code!',
    ],
    isNew: true,
  },
  {
    id: 'ito',
    category: 'telepathy',
    accent: '#1982c4',
    bgTint: '#e0f2fe',
    players_ar: '2–10 لاعبين',
    players_en: '2–10 Players',
    tag_ar: 'ترتيب تشاركي',
    tag_en: '1–100 Scale',
    name_ar: 'تخاطر الأرقام',
    name_en: 'Ito (1–100)',
    desc_ar: 'أوصف رقمك السري (1–100) بمثال ورتّبوا بطاقاتكم تصاعدياً!',
    desc_en: 'Describe your secret 1–100 number & sort everyone in order!',
    longDesc_ar:
      'كل لاعب يحمل رقماً سرياً من 1 إلى 100 وممنوع يذكره! يكتب مثالاً يناسب قوة رقمه حسب الموضوع ثم ترتبون البطاقات من الأصغر للأكبر.',
    longDesc_en:
      'Everyone gets a secret 1–100 card! Express its intensity using the round’s theme and arrange all players from smallest to largest.',
    rules_ar: [
      'يُختار موضوع للمقياس (مثلاً: أشياء مرعبة من 1 لطيف إلى 100 رعب حقيقي).',
      'يكشف كل لاعب رقمه السري بالسر ويكتب مثالاً يعبر عن حجم رقمه بدون ذكر أي أرقام.',
      'تتناقش الشلّة وترتب بطاقات اللاعبين من الأصغر فوق إلى الأكبر تحت.',
      'نكشف الأرقام السرية ونحسب كم بطاقة إجت بمكانها التصاعدي الصحيح!',
    ],
    rules_en: [
      'Read the round’s 1-to-100 scale theme (e.g. Scary Things).',
      'Peek at your secret number and write a matching example without saying numbers.',
      'Reorder everyone’s cards from lowest (top) to highest (bottom).',
      'Reveal all numbers and score big for every card in exact ascending order!',
    ],
  },
  {
    id: 'wordbomb',
    category: 'speed',
    accent: '#e63946',
    bgTint: '#ffe3e3',
    players_ar: '2–12 لاعب',
    players_en: '2–12 Players',
    tag_ar: 'سرعة وتوتر',
    tag_en: 'Hot Potato',
    name_ar: 'قنبلة الحروف',
    name_en: 'Word Bomb',
    desc_ar: 'فتيل القنبلة شغّال وما حدا بيعرف إيمتى تنفجر! هات كلمة وارميها!',
    desc_en: 'Unpredictable burning fuse — type a matching word & pass it fast!',
    longDesc_ar:
      'قنبلة موقوتة بفتيل عشوائي مشتعل! اكتب كلمة تحتوي الحرفين المطلوبين بسرعة البرق وارميها للي بعدك قبل الانفجار!',
    longDesc_en:
      'A ticking cartoon bomb with an unpredictable hidden fuse! Type a word with the required letters and pass it before BOOM!',
    rules_ar: [
      'القنبلة تظهر بيد أحد اللاعبين وعليها حرفان مطلوبان (مثلاً: ب ر).',
      'الفتيل يشتعل بوقت عشوائي مخفي — ممكن تنفجر بأي ثانية بدون عدّاد مكشوف!',
      'اكتب أي كلمة صحيحة (فصحى أو عامية مقبولة للشلّة) تحتوي الحرفين لترمي القنبلة للي بعدك.',
      'إذا كتب أحدهم كلمة تخبيص، يمكن للشلّة الضغط على زر الاعتراض لإرجاع القنبلة ليده!',
    ],
    rules_en: [
      'The bomb lands in one player’s hands showing 2 required letters.',
      'The fuse burns with a hidden unpredictable timer — it can blow any second!',
      'Type a valid unused word containing those letters to pass the bomb to the next player.',
      'Friends can hit the Crowd Referee button to reject gibberish and toss the bomb back!',
    ],
  },
  {
    id: 'themind',
    category: 'telepathy',
    accent: '#ff924c',
    bgTint: '#fff1e6',
    players_ar: '2–10 لاعبين',
    players_en: '2–10 Players',
    tag_ar: 'تزامن صامت',
    tag_en: 'Silent Sync',
    name_ar: 'ذا مايند (نبض الصمت)',
    name_en: 'The Mind',
    desc_ar: 'رتّبوا الأرقام (1–100) تصاعدياً بالوسط بدون ولا كلمة أو دور!',
    desc_en: 'Play cards 1–100 ascending in total silence with no turns!',
    longDesc_ar:
      'اللعبة العالمية الشهيرة! كل لاعب يحمل أرقاماً سرية من 1 إلى 100 وممنوع الكلام أو التلميح؛ اشعروا بالوقت معاً ليرمي صاحب أصغر رقم كرته باللحظة الصح قبل أي لاعب آخر!',
    longDesc_en:
      'The legendary silent co-op card game! Hold secret 1–100 cards with zero talking or turn order — feel time together and play your lowest card at the exact right moment!',
    rules_ar: [
      'في المستوى 1 يأخذ كل لاعب كرتاً سرياً (1–100)، وفي المستوى 2 كرتين، وهكذا — ممنوع الكلام أو الإشارة للأرقام!',
      'بدون أدوار! اعتمدوا على الإحساس بالوقت، ومن يشعر أن معه أصغر رقم يرمي كرته مكشوفاً بالوسط.',
      'إذا رمى لاعب رقماً وكان بيد غيره رقم أصغر منه: تخسر الشلّة قلباً وتُكشف كل الكروت الأصغر!',
      'استخدموا «نجمة التزامن» بالتصويت ليتخلص الكل من أصغر كرت بيدهم وكسب معلومات تنقذكم!',
    ],
    rules_en: [
      'Level 1 deals 1 secret card (1–100) each, Level 2 deals 2, and so on — zero talking or signaling numbers!',
      'No turn order! Feel the silent rhythm together; whoever senses they hold the lowest card plays it face-up.',
      'If someone plays a card while ANY friend holds a lower number, the team loses 1 Life and discards lower cards!',
      'Vote to spend a Throwing Star so everyone reveals & discards their lowest card at once!',
    ],
    isNew: true,
  },
];

/* ============================================================================
 * 1. TABOO CARDS (الكلمات الممنوعة)
 * ========================================================================== */
export interface TabooCardItem {
  id: number;
  category_ar: string;
  category_en: string;
  word_ar: string;
  word_en: string;
  forbidden_ar: [string, string, string, string, string];
  forbidden_en: [string, string, string, string, string];
}

export const TABOO_CARDS: TabooCardItem[] = [
  { id: 1, category_ar: 'أكل', category_en: 'Food', word_ar: 'شاورما', word_en: 'Shawarma', forbidden_ar: ['دجاج', 'ثوم', 'سيخ', 'خبز', 'مخلل'], forbidden_en: ['Chicken', 'Garlic', 'Wrap', 'Meat', 'Spit'] },
  { id: 2, category_ar: 'حياة يومية', category_en: 'Daily Life', word_ar: 'شاحن جوال', word_en: 'Phone Charger', forbidden_ar: ['بطارية', 'سلك', 'كهرباء', 'موبايل', 'يفصل'], forbidden_en: ['Battery', 'Cable', 'Plug', 'Power', 'Phone'] },
  { id: 3, category_ar: 'أماكن', category_en: 'Places', word_ar: 'المطار', word_en: 'Airport', forbidden_ar: ['طيارة', 'سفر', 'جواز', 'شنطة', 'طيران'], forbidden_en: ['Plane', 'Travel', 'Passport', 'Luggage', 'Flight'] },
  { id: 4, category_ar: 'مناسبات', category_en: 'Events', word_ar: 'عرس', word_en: 'Wedding', forbidden_ar: ['عريس', 'عروس', 'فستان', 'زواج', 'حفلة'], forbidden_en: ['Bride', 'Groom', 'Ring', 'Dress', 'Marriage'] },
  { id: 5, category_ar: 'مشروبات', category_en: 'Drinks', word_ar: 'قهوة', word_en: 'Coffee', forbidden_ar: ['فنجان', 'كافيين', 'سهر', 'بن', 'الصبح'], forbidden_en: ['Morning', 'Cup', 'Caffeine', 'Beans', 'Awake'] },
  { id: 6, category_ar: 'تقنية', category_en: 'Tech', word_ar: 'نتفليكس', word_en: 'Netflix', forbidden_ar: ['أفلام', 'مسلسلات', 'اشتراك', 'شاشة', 'مشاهدة'], forbidden_en: ['Movies', 'Series', 'Stream', 'Watch', 'TV'] },
  { id: 7, category_ar: 'دراسة', category_en: 'School', word_ar: 'امتحان', word_en: 'Exam', forbidden_ar: ['دراسة', 'علامة', 'نجاح', 'ورقة', 'سؤال'], forbidden_en: ['Test', 'Study', 'Grade', 'School', 'Paper'] },
  { id: 8, category_ar: 'مهن', category_en: 'Jobs', word_ar: 'طبيب أسنان', word_en: 'Dentist', forbidden_ar: ['ضرس', 'وجع', 'فرشاة', 'عيادة', 'سوسة'], forbidden_en: ['Teeth', 'Drill', 'Mouth', 'Pain', 'Brush'] },
  { id: 9, category_ar: 'أكل', category_en: 'Food', word_ar: 'كنافة', word_en: 'Kunafa', forbidden_ar: ['جبنة', 'قطر', 'حلويات', 'نابلسية', 'سخن'], forbidden_en: ['Cheese', 'Sweet', 'Syrup', 'Dessert', 'Pastry'] },
  { id: 10, category_ar: 'أشياء', category_en: 'Objects', word_ar: 'مصعد', word_en: 'Elevator', forbidden_ar: ['طابق', 'درج', 'زر', 'عمارة', 'فوق'], forbidden_en: ['Floor', 'Stairs', 'Button', 'Building', 'Lift'] },
  { id: 11, category_ar: 'تقنية', category_en: 'Tech', word_ar: 'سيلفي', word_en: 'Selfie', forbidden_ar: ['صورة', 'كاميرا', 'أمامية', 'وجه', 'تلفون'], forbidden_en: ['Photo', 'Camera', 'Front', 'Face', 'Instagram'] },
  { id: 12, category_ar: 'طبيعة', category_en: 'Nature', word_ar: 'كابوس', word_en: 'Nightmare', forbidden_ar: ['حلم', 'نوم', 'خوف', 'ليل', 'مرعب'], forbidden_en: ['Dream', 'Sleep', 'Scary', 'Night', 'Wake'] },
  { id: 13, category_ar: 'شارع', category_en: 'Street', word_ar: 'إشارة مرور', word_en: 'Traffic Light', forbidden_ar: ['أحمر', 'أخضر', 'سيارة', 'شارع', 'توقف'], forbidden_en: ['Red', 'Green', 'Stop', 'Car', 'Road'] },
  { id: 14, category_ar: 'سفر', category_en: 'Travel', word_ar: 'جواز سفر', word_en: 'Passport', forbidden_ar: ['فيزا', 'مطار', 'ختم', 'حدود', 'دولة'], forbidden_en: ['Visa', 'Airport', 'Stamp', 'Border', 'Country'] },
  { id: 15, category_ar: 'أكل', category_en: 'Food', word_ar: 'بيتزا', word_en: 'Pizza', forbidden_ar: ['إيطاليا', 'جبنة', 'عجينة', 'فرن', 'مثلث'], forbidden_en: ['Italy', 'Cheese', 'Slice', 'Dough', 'Oven'] },
  { id: 16, category_ar: 'حيوانات', category_en: 'Animals', word_ar: 'أخطبوط', word_en: 'Octopus', forbidden_ar: ['بحر', 'ثمانية', 'أذرع', 'حبر', 'محيط'], forbidden_en: ['Eight', 'Tentacles', 'Sea', 'Ink', 'Ocean'] },
  { id: 17, category_ar: 'منزل', category_en: 'Home', word_ar: 'غسالة', word_en: 'Washing Machine', forbidden_ar: ['ملابس', 'ماء', 'صابون', 'تنظيف', 'نشر'], forbidden_en: ['Clothes', 'Water', 'Soap', 'Spin', 'Laundry'] },
  { id: 18, category_ar: 'أشياء', category_en: 'Objects', word_ar: 'نظارة شمسية', word_en: 'Sunglasses', forbidden_ar: ['عيون', 'شمس', 'صيف', 'عدسات', 'أسود'], forbidden_en: ['Eyes', 'Sun', 'Bright', 'Summer', 'Shades'] },
  { id: 19, category_ar: 'ترفيه', category_en: 'Fun', word_ar: 'بوشار (فشار)', word_en: 'Popcorn', forbidden_ar: ['سينما', 'ذرة', 'فيلم', 'ملح', 'يفرقع'], forbidden_en: ['Cinema', 'Movie', 'Corn', 'Butter', 'Salt'] },
  { id: 20, category_ar: 'رياضة', category_en: 'Sports', word_ar: 'حكم مباراة', word_en: 'Referee', forbidden_ar: ['صفارة', 'كرت أحمر', 'تسلل', 'كرة قدم', 'ملعب'], forbidden_en: ['Whistle', 'Red Card', 'Foul', 'Football', 'Rules'] },
  { id: 21, category_ar: 'حياة يومية', category_en: 'Daily Life', word_ar: 'منبّه الصبح', word_en: 'Alarm Clock', forbidden_ar: ['نوم', 'يرن', 'ساعة', 'فيق', 'غفوة'], forbidden_en: ['Wake', 'Ring', 'Snooze', 'Morning', 'Sleep'] },
  { id: 22, category_ar: 'حيوانات', category_en: 'Animals', word_ar: 'بطريق', word_en: 'Penguin', forbidden_ar: ['ثلج', 'قطب', 'طائر', 'يطير', 'سمك'], forbidden_en: ['Ice', 'Bird', 'Fly', 'Antarctica', 'Tuxedo'] },
  { id: 23, category_ar: 'تقنية', category_en: 'Tech', word_ar: 'كلمة سر (باسورد)', word_en: 'Password', forbidden_ar: ['حساب', 'دخول', 'نسيت', 'رموز', 'قفل'], forbidden_en: ['Login', 'Secret', 'Account', 'Forgot', 'Lock'] },
  { id: 24, category_ar: 'أشياء', category_en: 'Objects', word_ar: 'مرآة (مراية)', word_en: 'Mirror', forbidden_ar: ['انعكاس', 'وجه', 'زجاج', 'تشوف', 'حمام'], forbidden_en: ['Reflection', 'Glass', 'Look', 'Face', 'See'] },
];

/* ============================================================================
 * 2. DIXIT SURREAL CARDS (خيال الشلّة — 24 Custom Illustrated SVG Scenes!)
 * ========================================================================== */
export interface DixitCardDef {
  id: number;
  label_ar: string;
  label_en: string;
}

export const DIXIT_CARDS: DixitCardDef[] = Array.from({ length: 24 }, (_, idx) => ({
  id: idx + 1,
  label_ar: `لوحة الخيال #${idx + 1}`,
  label_en: `Dream Card #${idx + 1}`,
}));

/* ============================================================================
 * 3. MONSDRAWSITY / SOLE WITNESS MONSTERS (الشاهد الوحيد — 16 Unique Monsters!)
 * ========================================================================== */
export interface WitnessMonsterDef {
  id: number;
  name_ar: string;
  name_en: string;
  bg: string;
  bodyColor: string;
  accentColor: string;
  shape: 'blob' | 'triangle' | 'pear' | 'box' | 'bean' | 'star';
  eyes: 1 | 2 | 3 | 4;
  horns: 'devil' | 'antennas' | 'crown' | 'cactus' | 'ears' | 'none';
  mouth: 'fangs' | 'tongue' | 'zigzag' | 'bucktooth';
  arms: 'tentacles' | 'claws' | 'wings' | 'noodle';
  pattern: 'spots' | 'stripes' | 'belly' | 'stitches';
}

export const WITNESS_MONSTERS: WitnessMonsterDef[] = [
  { id: 1, name_ar: 'زعتر ذو العين الواحدة', name_en: 'King Bloop', bg: '#e0f2fe', bodyColor: '#ff595e', accentColor: '#ffca3a', shape: 'pear', eyes: 1, horns: 'crown', mouth: 'fangs', arms: 'tentacles', pattern: 'spots' },
  { id: 2, name_ar: 'فرفور المثلث الفضائي', name_en: 'Tri-Zapper', bg: '#fef3c7', bodyColor: '#8ac926', accentColor: '#00bbf9', shape: 'triangle', eyes: 3, horns: 'antennas', mouth: 'zigzag', arms: 'claws', pattern: 'stripes' },
  { id: 3, name_ar: 'صندوق الكوابيس اللطيف', name_en: 'Boxy Chomper', bg: '#f3e8ff', bodyColor: '#9b5de5', accentColor: '#ff924c', shape: 'box', eyes: 2, horns: 'devil', mouth: 'bucktooth', arms: 'wings', pattern: 'stitches' },
  { id: 4, name_ar: 'صبّار الغيوم الطائر', name_en: 'Cloud Cactus', bg: '#ffe4e6', bodyColor: '#00bbf9', accentColor: '#ff595e', shape: 'bean', eyes: 4, horns: 'cactus', mouth: 'tongue', arms: 'noodle', pattern: 'belly' },
  { id: 5, name_ar: 'نجمة المجرة الجائعة', name_en: 'Star Muncher', bg: '#dcfce7', bodyColor: '#ffca3a', accentColor: '#f15bb5', shape: 'star', eyes: 1, horns: 'antennas', mouth: 'fangs', arms: 'noodle', pattern: 'spots' },
  { id: 6, name_ar: 'بطاطا الكهف ذو الأجنحة', name_en: 'Bat-Tater', bg: '#e0e7ff', bodyColor: '#ff924c', accentColor: '#8ac926', shape: 'blob', eyes: 3, horns: 'ears', mouth: 'tongue', arms: 'wings', pattern: 'belly' },
  { id: 7, name_ar: 'سلطعون المريخ المرقّط', name_en: 'Snip-Snap', bg: '#ffedd5', bodyColor: '#f15bb5', accentColor: '#ffca3a', shape: 'box', eyes: 4, horns: 'antennas', mouth: 'zigzag', arms: 'claws', pattern: 'spots' },
  { id: 8, name_ar: 'هرم العيون الأربعة', name_en: 'Quadra-Cone', bg: '#ecfccb', bodyColor: '#1982c4', accentColor: '#ff595e', shape: 'triangle', eyes: 4, horns: 'crown', mouth: 'bucktooth', arms: 'tentacles', pattern: 'stripes' },
  { id: 9, name_ar: 'حبّة الفاصوليا المرقطة', name_en: 'Jellyfang', bg: '#fae8ff', bodyColor: '#38b000', accentColor: '#ffca3a', shape: 'bean', eyes: 2, horns: 'devil', mouth: 'fangs', arms: 'claws', pattern: 'stitches' },
  { id: 10, name_ar: 'كابتن إجاصة الأخطبوط', name_en: 'Pear-Pus', bg: '#cffafe', bodyColor: '#ff595e', accentColor: '#00f5d4', shape: 'pear', eyes: 3, horns: 'cactus', mouth: 'zigzag', arms: 'tentacles', pattern: 'belly' },
  { id: 11, name_ar: 'مستر مكعب بلسان طويل', name_en: 'Licky Cube', bg: '#fef9c3', bodyColor: '#4361ee', accentColor: '#ff924c', shape: 'box', eyes: 1, horns: 'ears', mouth: 'tongue', arms: 'noodle', pattern: 'spots' },
  { id: 12, name_ar: 'كعكة الفضاء ذات القرون', name_en: 'Horned Blob', bg: '#ffe4e6', bodyColor: '#9b5de5', accentColor: '#8ac926', shape: 'blob', eyes: 2, horns: 'crown', mouth: 'bucktooth', arms: 'tentacles', pattern: 'stripes' },
  { id: 13, name_ar: 'شهاب المخالب السريع', name_en: 'Claw Star', bg: '#e0f2fe', bodyColor: '#ff924c', accentColor: '#1982c4', shape: 'star', eyes: 2, horns: 'devil', mouth: 'zigzag', arms: 'claws', pattern: 'belly' },
  { id: 14, name_ar: 'أرنب المختبر العجيب', name_en: 'Stitch-Ear', bg: '#f1f5f9', bodyColor: '#00bbf9', accentColor: '#ffca3a', shape: 'pear', eyes: 4, horns: 'ears', mouth: 'fangs', arms: 'wings', pattern: 'stitches' },
  { id: 15, name_ar: 'كبسولة الصبار الضاحكة', name_en: 'Prickle Bean', bg: '#fef2f2', bodyColor: '#ffca3a', accentColor: '#38b000', shape: 'bean', eyes: 1, horns: 'cactus', mouth: 'bucktooth', arms: 'wings', pattern: 'spots' },
  { id: 16, name_ar: 'إمبراطور الهلام الثلاثي', name_en: 'Slime Rex', bg: '#ede9fe', bodyColor: '#e63946', accentColor: '#ffca3a', shape: 'triangle', eyes: 3, horns: 'devil', mouth: 'tongue', arms: 'noodle', pattern: 'belly' },
];

/* ============================================================================
 * 4. FAKE ARTIST PROMPTS (الفنان المزيّف)
 * ========================================================================== */
export interface FakeArtistPrompt {
  id: number;
  category_ar: string;
  category_en: string;
  word_ar: string;
  word_en: string;
}

export const FAKE_ARTIST_PROMPTS: FakeArtistPrompt[] = [
  { id: 1, category_ar: 'حيوانات', category_en: 'Animals', word_ar: 'زرافة', word_en: 'Giraffe' },
  { id: 2, category_ar: 'حيوانات', category_en: 'Animals', word_ar: 'أخطبوط', word_en: 'Octopus' },
  { id: 3, category_ar: 'حيوانات', category_en: 'Animals', word_ar: 'فيل', word_en: 'Elephant' },
  { id: 4, category_ar: 'حيوانات', category_en: 'Animals', word_ar: 'سلحفاة', word_en: 'Turtle' },
  { id: 5, category_ar: 'حيوانات', category_en: 'Animals', word_ar: 'فراشة', word_en: 'Butterfly' },
  { id: 6, category_ar: 'أطعمة', category_en: 'Food', word_ar: 'أناناس', word_en: 'Pineapple' },
  { id: 7, category_ar: 'أطعمة', category_en: 'Food', word_ar: 'آيس كريم', word_en: 'Ice Cream' },
  { id: 8, category_ar: 'أطعمة', category_en: 'Food', word_ar: 'بيتزا', word_en: 'Pizza' },
  { id: 9, category_ar: 'أطعمة', category_en: 'Food', word_ar: 'برغر', word_en: 'Burger' },
  { id: 10, category_ar: 'مركبات', category_en: 'Vehicles', word_ar: 'صاروخ فضاء', word_en: 'Rocket' },
  { id: 11, category_ar: 'مركبات', category_en: 'Vehicles', word_ar: 'منطاد هوائي', word_en: 'Hot Air Balloon' },
  { id: 12, category_ar: 'مركبات', category_en: 'Vehicles', word_ar: 'غواصة', word_en: 'Submarine' },
  { id: 13, category_ar: 'مركبات', category_en: 'Vehicles', word_ar: 'هليكوبتر', word_en: 'Helicopter' },
  { id: 14, category_ar: 'أشياء', category_en: 'Objects', word_ar: 'جيتار', word_en: 'Guitar' },
  { id: 15, category_ar: 'أشياء', category_en: 'Objects', word_ar: 'مظلة مطر', word_en: 'Umbrella' },
  { id: 16, category_ar: 'أشياء', category_en: 'Objects', word_ar: 'تاج ملكي', word_en: 'Crown' },
  { id: 17, category_ar: 'أشياء', category_en: 'Objects', word_ar: 'ساعة رملية', word_en: 'Hourglass' },
  { id: 18, category_ar: 'أشياء', category_en: 'Objects', word_ar: 'مفتاح قديم', word_en: 'Key' },
  { id: 19, category_ar: 'طبيعة', category_en: 'Nature', word_ar: 'بركان يثور', word_en: 'Volcano' },
  { id: 20, category_ar: 'طبيعة', category_en: 'Nature', word_ar: 'نخلة على جزيرة', word_en: 'Palm Island' },
  { id: 21, category_ar: 'طبيعة', category_en: 'Nature', word_ar: 'رجل ثلج', word_en: 'Snowman' },
  { id: 22, category_ar: 'شخصيات', category_en: 'Characters', word_ar: 'قرصان', word_en: 'Pirate' },
  { id: 23, category_ar: 'شخصيات', category_en: 'Characters', word_ar: 'رائد فضاء', word_en: 'Astronaut' },
  { id: 24, category_ar: 'أبنية', category_en: 'Landmarks', word_ar: 'الأهرامات', word_en: 'Pyramids' },
];

/* ============================================================================
 * 5. MEDIUM / MIND MELD PAIRS (التقاء العقول)
 * ========================================================================== */
export interface MediumPairItem {
  id: number;
  w1_ar: string;
  w2_ar: string;
  w1_en: string;
  w2_en: string;
}

export const MEDIUM_WORD_PAIRS: MediumPairItem[] = [
  { id: 1, w1_ar: 'شمس', w2_ar: 'ثلج', w1_en: 'Sun', w2_en: 'Snow' },
  { id: 2, w1_ar: 'قهوة', w2_ar: 'ليل', w1_en: 'Coffee', w2_en: 'Night' },
  { id: 3, w1_ar: 'مدرسة', w2_ar: 'جرس', w1_en: 'School', w2_en: 'Bell' },
  { id: 4, w1_ar: 'طائرة', w2_ar: 'عصفور', w1_en: 'Airplane', w2_en: 'Bird' },
  { id: 5, w1_ar: 'بحر', w2_ar: 'دموع', w1_en: 'Sea', w2_en: 'Tears' },
  { id: 6, w1_ar: 'ذهب', w2_ar: 'وقت', w1_en: 'Gold', w2_en: 'Time' },
  { id: 7, w1_ar: 'قطة', w2_ar: 'أسد', w1_en: 'Cat', w2_en: 'Lion' },
  { id: 8, w1_ar: 'سينما', w2_ar: 'ظلام', w1_en: 'Cinema', w2_en: 'Darkness' },
  { id: 9, w1_ar: 'خبز', w2_ar: 'فرن', w1_en: 'Bread', w2_en: 'Fire' },
  { id: 10, w1_ar: 'مفتاح', w2_ar: 'سر', w1_en: 'Key', w2_en: 'Secret' },
  { id: 11, w1_ar: 'شتاء', w2_ar: 'بطانية', w1_en: 'Winter', w2_en: 'Soup' },
  { id: 12, w1_ar: 'هاتف', w2_ar: 'شاحن', w1_en: 'Phone', w2_en: 'Electricity' },
  { id: 13, w1_ar: 'قمر', w2_ar: 'ذئب', w1_en: 'Moon', w2_en: 'Wolf' },
  { id: 14, w1_ar: 'سفر', w2_ar: 'حقيبة', w1_en: 'Travel', w2_en: 'Cloud' },
  { id: 15, w1_ar: 'ملك', w2_ar: 'شطرنج', w1_en: 'King', w2_en: 'Board' },
  { id: 16, w1_ar: 'ساعة', w2_ar: 'ركض', w1_en: 'Clock', w2_en: 'Race' },
  { id: 17, w1_ar: 'مرآة', w2_ar: 'ماء', w1_en: 'Mirror', w2_en: 'Water' },
  { id: 18, w1_ar: 'نار', w2_ar: 'فحم', w1_en: 'Fire', w2_en: 'Meat' },
  { id: 19, w1_ar: 'كتاب', w2_ar: 'شجرة', w1_en: 'Book', w2_en: 'Tree' },
  { id: 20, w1_ar: 'عرس', w2_ar: 'كيك', w1_en: 'Wedding', w2_en: 'Ring' },
];

/* ============================================================================
 * 6. SO CLOVER! WORD BANK (شفرة الأربع كلمات)
 * ========================================================================== */
export interface CloverWord {
  id: number;
  ar: string;
  en: string;
}

export const SO_CLOVER_WORDS: CloverWord[] = [
  { id: 1, ar: 'قمر', en: 'Moon' },
  { id: 2, ar: 'جبنة', en: 'Cheese' },
  { id: 3, ar: 'سفينة', en: 'Ship' },
  { id: 4, ar: 'صحراء', en: 'Desert' },
  { id: 5, ar: 'تاج', en: 'Crown' },
  { id: 6, ar: 'ثعلب', en: 'Fox' },
  { id: 7, ar: 'بيانو', en: 'Piano' },
  { id: 8, ar: 'قهوة', en: 'Coffee' },
  { id: 9, ar: 'ساعة', en: 'Clock' },
  { id: 10, ar: 'قطار', en: 'Train' },
  { id: 11, ar: 'قلعة', en: 'Castle' },
  { id: 12, ar: 'مرآة', en: 'Mirror' },
  { id: 13, ar: 'بركان', en: 'Volcano' },
  { id: 14, ar: 'عسل', en: 'Honey' },
  { id: 15, ar: 'مفتاح', en: 'Key' },
  { id: 16, ar: 'شبح', en: 'Ghost' },
  { id: 17, ar: 'مظلة', en: 'Umbrella' },
  { id: 18, ar: 'ألماس', en: 'Diamond' },
  { id: 19, ar: 'روبوت', en: 'Robot' },
  { id: 20, ar: 'تفاحة', en: 'Apple' },
  { id: 21, ar: 'نار', en: 'Fire' },
  { id: 22, ar: 'جليد', en: 'Ice' },
  { id: 23, ar: 'سينما', en: 'Cinema' },
  { id: 24, ar: 'فراشة', en: 'Butterfly' },
  { id: 25, ar: 'مطار', en: 'Airport' },
  { id: 26, ar: 'حقيبة', en: 'Suitcase' },
  { id: 27, ar: 'بطريق', en: 'Penguin' },
  { id: 28, ar: 'ليمون', en: 'Lemon' },
  { id: 29, ar: 'سيف', en: 'Sword' },
  { id: 30, ar: 'غيوم', en: 'Clouds' },
  { id: 31, ar: 'شمع', en: 'Candle' },
  { id: 32, ar: 'بوصلة', en: 'Compass' },
  { id: 33, ar: 'تنين', en: 'Dragon' },
  { id: 34, ar: 'مكتبة', en: 'Library' },
  { id: 35, ar: 'جسر', en: 'Bridge' },
  { id: 36, ar: 'خاتم', en: 'Ring' },
];

/* ============================================================================
 * 7. WITS & WAGERS QUESTIONS (مزايدة التخمين)
 * ========================================================================== */
export interface WitsQuestionItem {
  id: number;
  question_ar: string;
  question_en: string;
  answer: number;
  unit_ar: string;
  unit_en: string;
  fact_ar: string;
  fact_en: string;
}

export const WITS_QUESTIONS: WitsQuestionItem[] = [
  {
    id: 1,
    question_ar: 'كم عدد العظام الموجودة في جسم سمكة القرش البالغة؟',
    question_en: 'How many bones are in an adult shark’s entire body?',
    answer: 0,
    unit_ar: 'عظمة',
    unit_en: 'bones',
    fact_ar: 'صفر! هيكل سمكة القرش مكوّن بالكامل من الغضاريف وليس العظام!',
    fact_en: 'Zero! A shark’s skeleton is made 100% of cartilage!',
  },
  {
    id: 2,
    question_ar: 'كم دقيقة استمرت أقصر حرب مسجّلة في التاريخ (بين بريطانيا وزنجبار عام 1896)؟',
    question_en: 'How many minutes did the shortest war in history last (1896)?',
    answer: 38,
    unit_ar: 'دقيقة',
    unit_en: 'minutes',
    fact_ar: 'انتهت الحرب خلال 38 دقيقة فقط!',
    fact_en: 'The Anglo-Zanzibar War lasted just 38 minutes!',
  },
  {
    id: 3,
    question_ar: 'كم متراً يبلغ الارتفاع الدقيق لبرج خليفة في دبي؟',
    question_en: 'How many meters tall is the Burj Khalifa in Dubai?',
    answer: 828,
    unit_ar: 'متر',
    unit_en: 'meters',
    fact_ar: 'يبلغ طول برج خليفة 828 متراً (أكثر من 160 طابقاً)!',
    fact_en: 'Burj Khalifa stands at 828 meters tall!',
  },
  {
    id: 4,
    question_ar: 'كم عضلة توجد في خرطوم الفيل الواحد؟',
    question_en: 'Approximately how many muscles are in an elephant’s trunk?',
    answer: 40000,
    unit_ar: 'عضلة',
    unit_en: 'muscles',
    fact_ar: 'خرطوم الفيل يحتوي حوالي 40,000 عضلة مقارنة بـ 600 عضلة في جسم الإنسان كله!',
    fact_en: 'An elephant’s trunk packs around 40,000 muscles!',
  },
  {
    id: 5,
    question_ar: 'كم مرة يرفرف طائر الطنّان (Hummingbird) بجناحيه في الثانية الواحدة؟',
    question_en: 'How many times per second does a hummingbird flap its wings?',
    answer: 80,
    unit_ar: 'رفرفة/ثانية',
    unit_en: 'flaps/sec',
    fact_ar: 'يرفرف حوالي 80 مرة في الثانية الواحدة ليبقى معلقاً بالهواء!',
    fact_en: 'Around 80 wingbeats every single second!',
  },
  {
    id: 6,
    question_ar: 'في أي عام أُطلقت أول نسخة من هاتف آيفون (iPhone) الأول في العالم؟',
    question_en: 'In what year was the very first iPhone released?',
    answer: 2007,
    unit_ar: 'ميلادي',
    unit_en: 'year',
    fact_ar: 'أعلن ستيف جوبز عن أول آيفون في عام 2007!',
    fact_en: 'Steve Jobs unveiled the original iPhone in 2007!',
  },
  {
    id: 7,
    question_ar: 'كم عدد مفاتيح البيانو الكلاسيكي الكامل (الأبيض + الأسود معاً)؟',
    question_en: 'How many total keys (black + white) are on a standard grand piano?',
    answer: 88,
    unit_ar: 'مفتاح',
    unit_en: 'keys',
    fact_ar: '52 مفتاحاً أبيض و 36 مفتاحاً أسود = 88 مفتاحاً!',
    fact_en: '52 white keys + 36 black keys = 88 total keys!',
  },
  {
    id: 8,
    question_ar: 'كم يوماً من السنة يقضيها حيوان الكوالا نائماً لو جمعنا ساعات نومه؟',
    question_en: 'Out of 365 days in a year, how many full days’ worth of time does a koala spend sleeping?',
    answer: 300,
    unit_ar: 'يوم',
    unit_en: 'days',
    fact_ar: 'ينام الكوالا قرابة 20 ساعة يومياً، أي نحو 300 يوم في السنة!',
    fact_en: 'Sleeping ~20 hours a day equals roughly 300 days per year!',
  },
  {
    id: 9,
    question_ar: 'كم عدد الغُرز الحمراء الموجودة على كرة البيسبول الرسمية؟',
    question_en: 'How many red double-stitches are on an official MLB baseball?',
    answer: 108,
    unit_ar: 'غرزة',
    unit_en: 'stitches',
    fact_ar: 'كل كرة رسمية تُخاط يدوياً بـ 108 غرزات بالضبط!',
    fact_en: 'Every official baseball has exactly 108 hand-sewn double stitches!',
  },
  {
    id: 10,
    question_ar: 'كم دقيقة يستغرق ضوء الشمس ليصل إلى كوكب الأرض (بالتقريب لأقرب دقيقة)؟',
    question_en: 'How many minutes does sunlight take to reach Earth?',
    answer: 8,
    unit_ar: 'دقائق',
    unit_en: 'minutes',
    fact_ar: 'يصل ضوء الشمس إلى الأرض خلال 8 دقائق و20 ثانية!',
    fact_en: 'Sunlight travels 150 million km in just ~8 minutes!',
  },
  {
    id: 11,
    question_ar: 'كم لتراً من الدم يضخّه قلب الإنسان البالغ في اليوم الواحد تقريباً؟',
    question_en: 'Roughly how many liters of blood does a human heart pump per day?',
    answer: 7500,
    unit_ar: 'لتر',
    unit_en: 'liters',
    fact_ar: 'يضخ القلب حوالي 7,500 لتر يومياً في أكثر من 100 ألف نبضة!',
    fact_en: 'About 7,500 liters every single day!',
  },
  {
    id: 12,
    question_ar: 'كم عدد فقرات رقبة الزرافة الطويلة؟',
    question_en: 'How many neck vertebrae bones does a giraffe have?',
    answer: 7,
    unit_ar: 'فقرات',
    unit_en: 'vertebrae',
    fact_ar: 'مفاجأة! 7 فقرات فقط — نفس عدد فقرات رقبة الإنسان تماماً لكن كل فقرة عملاقة!',
    fact_en: 'Just 7! Exactly the same count as humans, only much longer!',
  },
];

/* ============================================================================
 * 8. INSIDER SECRET WORDS (العميل الداخلي)
 * ========================================================================== */
export interface InsiderWordItem {
  id: number;
  category_ar: string;
  category_en: string;
  word_ar: string;
  word_en: string;
}

export const INSIDER_WORDS: InsiderWordItem[] = [
  { id: 1, category_ar: 'أجهزة وأدوات', category_en: 'Gadgets', word_ar: 'مايكروويف', word_en: 'Microwave' },
  { id: 2, category_ar: 'أجهزة وأدوات', category_en: 'Gadgets', word_ar: 'مكنسة كهربائية', word_en: 'Vacuum Cleaner' },
  { id: 3, category_ar: 'أشياء يومية', category_en: 'Everyday Objects', word_ar: 'فرشاة أسنان', word_en: 'Toothbrush' },
  { id: 4, category_ar: 'أشياء يومية', category_en: 'Everyday Objects', word_ar: 'مظلة هبوط (باراشوت)', word_en: 'Parachute' },
  { id: 5, category_ar: 'أطعمة', category_en: 'Food', word_ar: 'بطيخ أحمر', word_en: 'Watermelon' },
  { id: 6, category_ar: 'أطعمة', category_en: 'Food', word_ar: 'سوشي', word_en: 'Sushi' },
  { id: 7, category_ar: 'أماكن ومعالم', category_en: 'Places', word_ar: 'الأهرامات', word_en: 'The Pyramids' },
  { id: 8, category_ar: 'أماكن ومعالم', category_en: 'Places', word_ar: 'منارة البحر', word_en: 'Lighthouse' },
  { id: 9, category_ar: 'كائنات', category_en: 'Creatures', word_ar: 'حرباء', word_en: 'Chameleon' },
  { id: 10, category_ar: 'كائنات', category_en: 'Creatures', word_ar: 'خفاش', word_en: 'Bat' },
  { id: 11, category_ar: 'أشياء يومية', category_en: 'Everyday Objects', word_ar: 'بوصلة', word_en: 'Compass' },
  { id: 12, category_ar: 'أشياء يومية', category_en: 'Everyday Objects', word_ar: 'قفل ومفتاح', word_en: 'Padlock' },
  { id: 13, category_ar: 'مركبات', category_en: 'Vehicles', word_ar: 'غواصة بحرية', word_en: 'Submarine' },
  { id: 14, category_ar: 'طبيعة', category_en: 'Nature', word_ar: 'جبل جليدي', word_en: 'Iceberg' },
  { id: 15, category_ar: 'ترفيه', category_en: 'Entertainment', word_ar: 'أفعوانية الملاهي', word_en: 'Rollercoaster' },
  { id: 16, category_ar: 'أشياء يومية', category_en: 'Everyday Objects', word_ar: 'شمعة', word_en: 'Candle' },
];

/* ============================================================================
 * 9. DECRYPTO KEYWORDS (كسر الشيفرة)
 * ========================================================================== */
export const DECRYPTO_WORDS: { ar: string; en: string }[] = [
  { ar: 'محيط', en: 'Ocean' },
  { ar: 'مستشفى', en: 'Hospital' },
  { ar: 'قمر', en: 'Moon' },
  { ar: 'شطرنج', en: 'Chess' },
  { ar: 'بركان', en: 'Volcano' },
  { ar: 'مكتبة', en: 'Library' },
  { ar: 'سيرك', en: 'Circus' },
  { ar: 'جيتار', en: 'Guitar' },
  { ar: 'قطار', en: 'Train' },
  { ar: 'ألماس', en: 'Diamond' },
  { ar: 'غابة', en: 'Jungle' },
  { ar: 'تلسكوب', en: 'Telescope' },
  { ar: 'عسل', en: 'Honey' },
  { ar: 'قرصان', en: 'Pirate' },
  { ar: 'مطار', en: 'Airport' },
  { ar: 'كاميرا', en: 'Camera' },
  { ar: 'ثعلب', en: 'Fox' },
  { ar: 'قصر', en: 'Palace' },
  { ar: 'فشار', en: 'Popcorn' },
  { ar: 'سيف', en: 'Sword' },
  { ar: 'عاصفة', en: 'Storm' },
  { ar: 'متحف', en: 'Museum' },
  { ar: 'روبوت', en: 'Robot' },
  { ar: 'قهوة', en: 'Coffee' },
];

/* ============================================================================
 * 10. COCKROACH POKER CRITTERS (بوكر الخداع)
 * ========================================================================== */
export type CritterType =
  | 'scorpion'
  | 'bat'
  | 'frog'
  | 'spider'
  | 'roach'
  | 'snake'
  | 'rat'
  | 'chameleon';

export interface CritterDef {
  id: CritterType;
  name_ar: string;
  name_en: string;
  color: string;
}

export const COCKROACH_CRITTERS: CritterDef[] = [
  { id: 'scorpion', name_ar: 'عقرب', name_en: 'Scorpion', color: '#ff924c' },
  { id: 'bat', name_ar: 'خفاش', name_en: 'Bat', color: '#9b5de5' },
  { id: 'frog', name_ar: 'ضفدع', name_en: 'Frog', color: '#8ac926' },
  { id: 'spider', name_ar: 'عنكبوت', name_en: 'Spider', color: '#ff595e' },
  { id: 'roach', name_ar: 'صرصور', name_en: 'Cockroach', color: '#d97706' },
  { id: 'snake', name_ar: 'ثعبان', name_en: 'Snake', color: '#38b000' },
  { id: 'rat', name_ar: 'جرذ', name_en: 'Rat', color: '#64748b' },
  { id: 'chameleon', name_ar: 'حرباء', name_en: 'Chameleon', color: '#00bbf9' },
];
