export type PartyGameId = 'wavelength' | 'chameleon' | 'ito' | 'fibbage' | 'wordbomb';

export interface ChameleonTopic {
  id: string;
  title_ar: string;
  title_en: string;
  emoji: string;
  words_ar: string[];
  words_en: string[];
}

export interface ItoThemeCard {
  id: number;
  title_ar: string;
  title_en: string;
  min_ar: string;
  max_ar: string;
  min_en: string;
  max_en: string;
}

export interface FibbageQuestion {
  id: number;
  question_ar: string;
  question_en: string;
  truth_ar: string;
  truth_en: string;
  category_ar: string;
  category_en: string;
}

export interface WordBombChallenge {
  id: number;
  letters_ar: string;
  letters_en: string;
  hint_ar: string;
  hint_en: string;
}

export const CHAMELEON_TOPICS: ChameleonTopic[] = [
  {
    id: 'food',
    title_ar: 'أكلات ومأكولات',
    title_en: 'Foods & Dishes',
    emoji: '🍔',
    words_ar: [
      'شاورما', 'منسف', 'بيتزا', 'سوشي',
      'فلافل', 'برغر', 'كبسة', 'كنافة',
      'ورق عنب', 'ملوخية', 'كشري', 'تبولة',
      'معكرونة', 'سمك مشوي', 'بروستد', 'كريب',
    ],
    words_en: [
      'Shawarma', 'Mansaf', 'Pizza', 'Sushi',
      'Falafel', 'Burger', 'Kabsa', 'Kunafa',
      'Grape Leaves', 'Molokhia', 'Koshary', 'Tabbouleh',
      'Pasta', 'Grilled Fish', 'Fried Chicken', 'Crepe',
    ],
  },
  {
    id: 'animals',
    title_ar: 'عالم الحيوانات',
    title_en: 'Animals Kingdom',
    emoji: '🦁',
    words_ar: [
      'أسد', 'بطريق', 'دولفين', 'زرافة',
      'كنغر', 'باندا', 'تمساح', 'ببغاء',
      'أخطبوط', 'ثعلب', 'حصان', 'كوالا',
      'نمر', 'فلامنغو', 'حرباء', 'قنفذ',
    ],
    words_en: [
      'Lion', 'Penguin', 'Dolphin', 'Giraffe',
      'Kangaroo', 'Panda', 'Crocodile', 'Parrot',
      'Octopus', 'Fox', 'Horse', 'Koala',
      'Tiger', 'Flamingo', 'Chameleon', 'Hedgehog',
    ],
  },
  {
    id: 'countries',
    title_ar: 'دول حول العالم',
    title_en: 'Countries',
    emoji: '🌍',
    words_ar: [
      'اليابان', 'مصر', 'إيطاليا', 'البرازيل',
      'تركيا', 'فرنسا', 'المغرب', 'أستراليا',
      'إسبانيا', 'الهند', 'المكسيك', 'كندا',
      'سويسرا', 'اليونان', 'كوريا', 'الأرجنتين',
    ],
    words_en: [
      'Japan', 'Egypt', 'Italy', 'Brazil',
      'Turkey', 'France', 'Morocco', 'Australia',
      'Spain', 'India', 'Mexico', 'Canada',
      'Switzerland', 'Greece', 'Korea', 'Argentina',
    ],
  },
  {
    id: 'movies',
    title_ar: 'أفلام ومسلسلات',
    title_en: 'Movies & Shows',
    emoji: '🎬',
    words_ar: [
      'هاري بوتر', 'باب الحارة', 'سبايدرمان', 'تيتانيك',
      'الأسد الملك', 'باتمان', 'لا كاسا دي بابيل', 'شريك',
      'أفاتار', 'توم وجيري', 'المحقق كونان', 'جون ويك',
      'علاء الدين', 'الجوكر', 'فروزن', 'لعبة الحبار',
    ],
    words_en: [
      'Harry Potter', 'Friends', 'Spider-Man', 'Titanic',
      'The Lion King', 'Batman', 'Money Heist', 'Shrek',
      'Avatar', 'Tom & Jerry', 'Detective Conan', 'John Wick',
      'Aladdin', 'Joker', 'Frozen', 'Squid Game',
    ],
  },
  {
    id: 'sports',
    title_ar: 'رياضات وألعاب',
    title_en: 'Sports & Games',
    emoji: '⚽',
    words_ar: [
      'كرة قدم', 'سباحة', 'ملاكمة', 'تنس',
      'كرة سلة', 'شطرنج', 'بولينغ', 'تزلج',
      'كاراتيه', 'ركوب خيل', 'غولف', 'بلياردو',
      'سباق سيارات', 'كرة طائرة', 'جمباز', 'رمي سهام',
    ],
    words_en: [
      'Football', 'Swimming', 'Boxing', 'Tennis',
      'Basketball', 'Chess', 'Bowling', 'Skiing',
      'Karate', 'Horse Riding', 'Golf', 'Billiards',
      'Car Racing', 'Volleyball', 'Gymnastics', 'Archery',
    ],
  },
  {
    id: 'places',
    title_ar: 'أماكن بنروحها',
    title_en: 'Everyday Places',
    emoji: '🏖️',
    words_ar: [
      'المطار', 'المستشفى', 'السينما', 'النادي الرياضي',
      'البحر', 'المكتبة', 'الحلاق', 'الملاهي',
      'السوبرماركت', 'الجامعة', 'المتحف', 'الفندق',
      'حديقة الحيوان', 'المطعم', 'محطة القطار', 'الملعب',
    ],
    words_en: [
      'Airport', 'Hospital', 'Cinema', 'Gym',
      'Beach', 'Library', 'Barbershop', 'Theme Park',
      'Supermarket', 'University', 'Museum', 'Hotel',
      'Zoo', 'Restaurant', 'Train Station', 'Stadium',
    ],
  },
];

export const ITO_THEMES: ItoThemeCard[] = [
  {
    id: 1,
    title_ar: 'أشياء أو كائنات بتخوّف!',
    title_en: 'Scary Things or Creatures!',
    min_ar: '1 = لطيف وما بيخوف أبداً',
    max_ar: '100 = رعب حقيقي بيجمد الدم',
    min_en: '1 = Cute & Harmless',
    max_en: '100 = Pure Nightmare Fuel',
  },
  {
    id: 2,
    title_ar: 'أكلات ومشروبات بتحبها',
    title_en: 'Foods & Drinks Popularity',
    min_ar: '1 = مستحيل آكلها',
    max_ar: '100 = ألذ أكلة بالكون',
    min_en: '1 = Never Touch It',
    max_en: '100 = Best Meal on Earth',
  },
  {
    id: 3,
    title_ar: 'أقوى القوى الخارقة (Superpowers)',
    title_en: 'Superpowers Strength',
    min_ar: '1 = قوة خارقة تافهة وما بتفيد',
    max_ar: '100 = قوة خارقة بتحكم العالم',
    min_en: '1 = Totally Useless Power',
    max_en: '100 = Unstoppable God-Tier Power',
  },
  {
    id: 4,
    title_ar: 'مواقف محرجة بالحياة اليومية',
    title_en: 'Awkward Everyday Moments',
    min_ar: '1 = موقف عادي ما حدا بينتبه',
    max_ar: '100 = بتتمنى الأرض تنشق وتبلعك',
    min_en: '1 = Barely Noticeable',
    max_en: '100 = Maximum Embarrassment',
  },
  {
    id: 5,
    title_ar: 'أشياء مستحيل تعيش بدونها',
    title_en: 'Things You Cannot Live Without',
    min_ar: '1 = كماليات بلا طعمة',
    max_ar: '100 = أساسي متل الهوا والمي',
    min_en: '1 = Totally Optional',
    max_en: '100 = Essential Like Oxygen',
  },
  {
    id: 6,
    title_ar: 'هدايا ممكن توصلك بعيد ميلادك',
    title_en: 'Birthday Gifts Tier List',
    min_ar: '1 = أسوأ هدية بالتاريخ',
    max_ar: '100 = هدية العمر الأسطورية',
    min_en: '1 = Worst Gift Ever',
    max_en: '100 = Dream Gift of a Lifetime',
  },
  {
    id: 7,
    title_ar: 'مشاهير أو شخصيات خيالية بقوتهم',
    title_en: 'Fictional Characters by Power',
    min_ar: '1 = ضعيف جداً',
    max_ar: '100 = لا يقهر أبداً',
    min_en: '1 = Super Weak',
    max_en: '100 = Invincible Legend',
  },
  {
    id: 8,
    title_ar: 'أماكن لقضاء عطلة الصيف',
    title_en: 'Summer Vacation Destinations',
    min_ar: '1 = ممل وكئيب',
    max_ar: '100 = جنة عالأرض',
    min_en: '1 = Boring & Miserable',
    max_en: '100 = Absolute Paradise',
  },
];

export const FIBBAGE_QUESTIONS: FibbageQuestion[] = [
  {
    id: 1,
    category_ar: 'غرائب العالم',
    category_en: 'Weird World',
    question_ar: 'في سويسرا، يمنع القانون امتلاك حيوان واحد فقط من ______ لأنها بتشعر بالوحدة والاكتئاب لحالها!',
    question_en: 'In Switzerland, it is illegal to own just one ______ because they get lonely!',
    truth_ar: 'خنازير غينيا (الهامستر الغيني)',
    truth_en: 'Guinea Pig',
  },
  {
    id: 2,
    category_ar: 'اختراعات عجيبة',
    category_en: 'Bizarre Inventions',
    question_ar: 'أول منبّه ميكانيكي اخترعه ليفي هاتشينز عام 1787 كان مستحيل يرن غير على الساعة ______ فقط!',
    question_en: 'The first mechanical alarm clock invented in 1787 could only ring at ______!',
    truth_ar: 'الرابعة فجراً (4:00 صباحاً)',
    truth_en: '4:00 AM',
  },
  {
    id: 3,
    category_ar: 'عالم الحيوان',
    category_en: 'Animal Facts',
    question_ar: 'الأخطبوط عنده 9 أدمغة و 3 قلوب، ولون دمه الحقيقي هو ______!',
    question_en: 'An octopus has 9 brains, 3 hearts, and its blood is actually ______!',
    truth_ar: 'أزرق',
    truth_en: 'Blue',
  },
  {
    id: 4,
    category_ar: 'تاريخ وطرائف',
    category_en: 'Funny History',
    question_ar: 'في عام 1932، خاض الجيش الأسترالي حرباً حقيقية وخسرها ضد قطيع من ______!',
    question_en: 'In 1932, the Australian military fought and lost a war against ______!',
    truth_ar: 'طيور الإيمو (النعام الأسترالي)',
    truth_en: 'Emus',
  },
  {
    id: 5,
    category_ar: 'طعام وغرائب',
    category_en: 'Food & History',
    question_ar: 'في القرن التاسع عشر بأمريكا، كان يتم بيع ______ في الصيدليات كدواء رسمي لعلاج المغص والصداع!',
    question_en: 'In the 1830s, ______ was sold in pharmacies as an official medicine!',
    truth_ar: 'الكاتشب',
    truth_en: 'Ketchup',
  },
  {
    id: 6,
    category_ar: 'فضاء وعلوم',
    category_en: 'Space & Science',
    question_ar: 'اليوم الواحد على كوكب الزهرة (دورانه حول نفسه) أطول من ______ على نفس الكوكب!',
    question_en: 'A single day on Venus is actually longer than ______ on Venus!',
    truth_ar: 'السنة الكاملة',
    truth_en: 'A Full Year',
  },
  {
    id: 7,
    category_ar: 'قوانين غريبة',
    category_en: 'Strange Laws',
    question_ar: 'في مدينة ميلانو الإيطالية، يفرض القانون القديم على المواطنين ______ في الأماكن العامة ما عدا المستشفيات والجنازات!',
    question_en: 'An old law in Milan, Italy requires citizens to ______ in public at all times except funerals or hospitals!',
    truth_ar: 'الابتسام دائماً',
    truth_en: 'Smile at all times',
  },
  {
    id: 8,
    category_ar: 'غرائب الطبيعة',
    category_en: 'Nature Facts',
    question_ar: 'الفاكهة الوحيدة اللي بذورها موجودة على قشرتها من الخارج بدل الداخل هي ______!',
    question_en: 'The only fruit that wears its seeds on the outside is the ______!',
    truth_ar: 'الفراولة (الفريز)',
    truth_en: 'Strawberry',
  },
];

export const WORD_BOMB_CHALLENGES: WordBombChallenge[] = [
  { id: 1, letters_ar: 'م ا', letters_en: 'WA', hint_ar: 'كلمة تحتوي حرفي (م) و (ا) مثل: ماء، سماء، مال', hint_en: 'Word containing WA (e.g. WATER, WATCH)' },
  { id: 2, letters_ar: 'ب ر', letters_en: 'BR', hint_ar: 'كلمة تحتوي حرفي (ب) و (ر) مثل: بحر، برتقال، برد', hint_en: 'Word containing BR (e.g. BREAD, BRAVE)' },
  { id: 3, letters_ar: 'س ل', letters_en: 'SL', hint_ar: 'كلمة تحتوي حرفي (س) و (ل) مثل: سلام، عسل، سلم', hint_en: 'Word containing SL (e.g. SLEEP, SLOW)' },
  { id: 4, letters_ar: 'ق ل', letters_en: 'CA', hint_ar: 'كلمة تحتوي حرفي (ق) و (ل) مثل: قلب، قلم، عقل', hint_en: 'Word containing CA (e.g. CAT, CAMERA)' },
  { id: 5, letters_ar: 'ش م', letters_en: 'SH', hint_ar: 'كلمة تحتوي حرفي (ش) و (م) مثل: شمس، شمع، مشمش', hint_en: 'Word containing SH (e.g. SHIP, SHADOW)' },
  { id: 6, letters_ar: 'ف ر', letters_en: 'FR', hint_ar: 'كلمة تحتوي حرفي (ف) و (ر) مثل: فراشة، فرح، سفر', hint_en: 'Word containing FR (e.g. FRIEND, FRUIT)' },
  { id: 7, letters_ar: 'ن و', letters_en: 'NO', hint_ar: 'كلمة تحتوي حرفي (ن) و (و) مثل: نور، نوم، ليمون', hint_en: 'Word containing NO (e.g. NIGHT, NOTE)' },
  { id: 8, letters_ar: 'ك ت', letters_en: 'ST', hint_ar: 'كلمة تحتوي حرفي (ك) و (ت) مثل: كتاب، مكتب، نكتة', hint_en: 'Word containing ST (e.g. STAR, STONE)' },
];
