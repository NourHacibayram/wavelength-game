export interface SpectrumCardItem {
  id: number;
  left_ar: string;
  right_ar: string;
  left_en: string;
  right_en: string;
  category: 'general' | 'food' | 'pop' | 'deep' | 'funny';
}

export const WEDGE_WIDTH_DEG = 9; // Each of the 5 wedges is 9 degrees wide (total 45 deg fan)

export function calculateScoreFromAngles(targetAngle: number, dialAngle: number): 0 | 2 | 3 | 4 {
  const diff = Math.abs(targetAngle - dialAngle);
  if (diff <= WEDGE_WIDTH_DEG * 0.5) return 4; // Within ±4.5°
  if (diff <= WEDGE_WIDTH_DEG * 1.5) return 3; // Within ±13.5°
  if (diff <= WEDGE_WIDTH_DEG * 2.5) return 2; // Within ±22.5°
  return 0;
}

export function generateRandomTargetAngle(): number {
  // Keep target center within [-64, +64] so all 5 wedges (±22.5°) fit inside [-88, +88]
  const min = -64;
  const max = 64;
  return Math.round((Math.random() * (max - min) + min) * 2) / 2;
}

export const SPECTRUM_CARDS: SpectrumCardItem[] = [
  // General & Everyday
  { id: 1, left_ar: 'بارد جداً', right_ar: 'ساخن جداً', left_en: 'Freezing Cold', right_en: 'Boiling Hot', category: 'general' },
  { id: 2, left_ar: 'مظلوم ومو ماخد حقه', right_ar: 'مبالغ بتقديره (Overrated)', left_en: 'Underrated', right_en: 'Overrated', category: 'general' },
  { id: 3, left_ar: 'عديم الفائدة', right_ar: 'أساسي بالحياة', left_en: 'Completely Useless', right_en: 'Essential for Life', category: 'general' },
  { id: 4, left_ar: 'عادة سيئة', right_ar: 'عادة صحية وممتازة', left_en: 'Bad Habit', right_en: 'Great Habit', category: 'general' },
  { id: 5, left_ar: 'شيء رخيص', right_ar: 'شيء غالي وفخم', left_en: 'Cheap', right_en: 'Luxury & Expensive', category: 'general' },
  { id: 6, left_ar: 'سهل تتعلمه', right_ar: 'مستحيل تتقنه', left_en: 'Easy to Learn', right_en: 'Impossible to Master', category: 'general' },
  { id: 7, left_ar: 'بطيء وممل', right_ar: 'سريع وحماسي', left_en: 'Slow & Boring', right_en: 'Fast & Thrilling', category: 'general' },
  { id: 8, left_ar: 'مؤقت', right_ar: 'بيدوم للأبد', left_en: 'Temporary', right_en: 'Permanent', category: 'general' },
  { id: 9, left_ar: 'صوت مزعج', right_ar: 'صوت مريح للأعصاب', left_en: 'Annoying Sound', right_en: 'Relaxing Sound', category: 'general' },
  { id: 10, left_ar: 'هدية سيئة', right_ar: 'هدية أسطورية', left_en: 'Terrible Gift', right_en: 'Legendary Gift', category: 'general' },
  { id: 11, left_ar: 'يحتاج حظ فقط', right_ar: 'يحتاج مهارة عالية', left_en: 'Pure Luck', right_en: 'Pure Skill', category: 'general' },
  { id: 12, left_ar: 'مكان هادي', right_ar: 'مكان صاخب ومزدحم', left_en: 'Quiet Place', right_en: 'Loud & Crowded Place', category: 'general' },
  { id: 13, left_ar: 'وظيفة مريحة', right_ar: 'وظيفة متعبة جداً', left_en: 'Relaxing Job', right_en: 'Exhausting Job', category: 'general' },
  { id: 14, left_ar: 'اختراع قديم', right_ar: 'اختراع مستقبلي', left_en: 'Ancient Invention', right_en: 'Futuristic Tech', category: 'general' },
  { id: 15, left_ar: 'آمن تماماً', right_ar: 'خطير جداً', left_en: 'Totally Safe', right_en: 'Super Dangerous', category: 'general' },

  // Food & Drinks
  { id: 16, left_ar: 'أكلة خفيفة', right_ar: 'أكلة دسمة بتنعّس', left_en: 'Light Snack', right_en: 'Heavy Coma Meal', category: 'food' },
  { id: 17, left_ar: 'أكل صحي', right_ar: 'أكل غير صحي بس طيب', left_en: 'Super Healthy Food', right_en: 'Delicious Junk Food', category: 'food' },
  { id: 18, left_ar: 'طعم عادي', right_ar: 'طعم إدمان', left_en: 'Plain Taste', right_en: 'Addictive Flavor', category: 'food' },
  { id: 19, left_ar: 'ينأكل بالشوكة والسكين', right_ar: 'ما بينأكل غير بالإيد', left_en: 'Eat with Fork & Knife', right_en: 'Must Eat with Hands', category: 'food' },
  { id: 20, left_ar: 'فطور صباحي', right_ar: 'أكلة آخر الليل', left_en: 'Morning Breakfast', right_en: '2 AM Late-Night Craving', category: 'food' },
  { id: 21, left_ar: 'مشروب شتوي', right_ar: 'مشروب صيفي منعش', left_en: 'Cozy Winter Drink', right_en: 'Refreshing Summer Drink', category: 'food' },
  { id: 22, left_ar: 'سهل ينطبخ بالبيت', right_ar: 'مستحيل يضبط غير بالمطعم', left_en: 'Easy to Cook at Home', right_en: 'Only Good at Restaurants', category: 'food' },
  { id: 23, left_ar: 'حلو زيادة', right_ar: 'مالح أو حامض', left_en: 'Ultra Sweet', right_en: 'Salty or Sour', category: 'food' },

  // Funny & Social
  { id: 24, left_ar: 'شيء بتعمله بالسر', right_ar: 'شيء بتفتخر فيه قدام الكل', left_en: 'Secret Guilty Pleasure', right_en: 'Brag About It Publicly', category: 'funny' },
  { id: 25, left_ar: 'عذر مقنع', right_ar: 'كذبة مكشوفة', left_en: 'Believable Excuse', right_en: 'Obvious Lie', category: 'funny' },
  { id: 26, left_ar: 'موقف عادي', right_ar: 'موقف محرج للموت', left_en: 'Totally Normal Moment', right_en: 'Maximum Embarrassment', category: 'funny' },
  { id: 27, left_ar: 'صديق وقت الضيق', right_ar: 'صديق مصلحة', left_en: 'True Ride-or-Die Friend', right_en: 'Fake Friend', category: 'funny' },
  { id: 28, left_ar: 'رد بارد ومختصر', right_ar: 'رد درامي ومبالغ فيه', left_en: 'Cold Short Reply', right_en: 'Full Drama Response', category: 'funny' },
  { id: 29, left_ar: 'ضيف خفيف ولطيف', right_ar: 'ضيف ثقيل ما بيروح', left_en: 'Lovely Easy Guest', right_en: 'Guest Who Never Leaves', category: 'funny' },
  { id: 30, left_ar: 'نكتة بايخة', right_ar: 'نكتة بتفرط ضحك', left_en: 'Dad Joke', right_en: 'Hilarious Masterpiece', category: 'funny' },
  { id: 31, left_ar: 'تصرف عاقل ورايق', right_ar: 'تصرف مجنون ومتهور', left_en: 'Calm & Rational', right_en: 'Chaotic & Wild', category: 'funny' },
  { id: 32, left_ar: 'شخصية انطوائية', right_ar: 'شخصية اجتماعية زيادة', left_en: 'Total Introvert', right_en: 'Extreme Extrovert', category: 'funny' },
  { id: 33, left_ar: 'كسل مو طبيعي', right_ar: 'نشاط مفرط', left_en: 'Ultimate Laziness', right_en: 'Hyperactive Energy', category: 'funny' },

  // Pop Culture & Entertainment
  { id: 34, left_ar: 'فيلم بينتسى فوراً', right_ar: 'فيلم للتاريخ', left_en: 'Forgettable Movie', right_en: 'Timeless Masterpiece', category: 'pop' },
  { id: 35, left_ar: 'شرير مكروه', right_ar: 'شرير الكل بيحبه', left_en: 'Hated Villain', right_en: 'Lovable Villain', category: 'pop' },
  { id: 36, left_ar: 'لعبة بتروق الأعصاب', right_ar: 'لعبة بتعمل ضغط وعصبية', left_en: 'Cozy Chill Game', right_en: 'Rage-Inducing Game', category: 'pop' },
  { id: 37, left_ar: 'قوة خارقة بلا طعمة', right_ar: 'قوة خارقة لا تقهر', left_en: 'Useless Superpower', right_en: 'God-Tier Superpower', category: 'pop' },
  { id: 38, left_ar: 'تطبيق ما حدا بيفتحه', right_ar: 'تطبيق مستحيل تحذفه', left_en: 'Never Opened App', right_en: 'Can Never Delete App', category: 'pop' },
  { id: 39, left_ar: 'ترند قديم ومات', right_ar: 'ترند ضارب هلق', left_en: 'Dead Trend', right_en: 'Viral Right Now', category: 'pop' },
  { id: 40, left_ar: 'مشاهير بدون موهبة', right_ar: 'موهبة حقيقية وأسطورية', left_en: 'Famous for Nothing', right_en: 'Pure Legendary Talent', category: 'pop' },

  // Deep & Thought-provoking
  { id: 41, left_ar: 'قرار بالقلب والعاطفة', right_ar: 'قرار بالعقل والمنطق', left_en: 'Follow Your Heart', right_en: 'Pure Cold Logic', category: 'deep' },
  { id: 42, left_ar: 'حقيقة قاسية', right_ar: 'مجاملة لطيفة', left_en: 'Harsh Truth', right_en: 'Sweet Comforting Lie', category: 'deep' },
  { id: 43, left_ar: 'سعادة لحظية', right_ar: 'سعادة طويلة المدى', left_en: 'Instant Gratification', right_en: 'Long-Term Fulfillment', category: 'deep' },
  { id: 44, left_ar: 'تخطيط دقيق لكل تفصيلة', right_ar: 'عفوية وعلى البركة', left_en: 'Strict Planner', right_en: 'Total Spontaneity', category: 'deep' },
  { id: 45, left_ar: 'توفير وحرص', right_ar: 'تبذير وصرف بلا حساب', left_en: 'Super Frugal', right_en: 'Big Spender', category: 'deep' },
  { id: 46, left_ar: 'الماضي والحنين', right_ar: 'المستقبل والتجديد', left_en: 'Nostalgic Past', right_en: 'Exciting Future', category: 'deep' },
  { id: 47, left_ar: 'موهبة بالفطرة', right_ar: 'اجتهاد وتعب سنين', left_en: 'Natural Born Talent', right_en: 'Years of Hard Work', category: 'deep' },
  { id: 48, left_ar: 'سفر استرخاء عالبحر', right_ar: 'سفر مغامرات وتسلق جبال', left_en: 'Lazy Beach Vacation', right_en: 'Extreme Adventure Trip', category: 'deep' },
  { id: 49, left_ar: 'حيوان أليف لطيف', right_ar: 'وحش مفترس ومرعب', left_en: 'Cute Cuddly Pet', right_en: 'Terrifying Predator', category: 'general' },
  { id: 50, left_ar: 'مادة دراسية ممتعة', right_ar: 'مادة دراسية كابوس', left_en: 'Fun School Subject', right_en: 'Nightmare Subject', category: 'general' },
];

export function pickNextCard(
  usedIds: number[] = [],
  customCards: SpectrumCardItem[] = []
): SpectrumCardItem {
  const allCards = [...customCards, ...SPECTRUM_CARDS];
  const available = allCards.filter((c) => !usedIds.includes(c.id));
  const pool = available.length > 0 ? available : allCards;
  return pool[Math.floor(Math.random() * pool.length)];
}
