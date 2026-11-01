import { PartyGameId, PartyGameCategory } from './partyGamesData';

export interface HomeGameMeta {
  poster: string;
  hook_ar: string;
  hook_en: string;
  /** Rough length of one full game, shown as "N min" */
  minutes: number;
  isFresh?: boolean;
}

export type HomeShelfId = Exclude<PartyGameCategory, 'all' | 'board'>;

export const HOME_SHELVES: {
  id: HomeShelfId;
  title_ar: string;
  title_en: string;
  blurb_ar: string;
  blurb_en: string;
  filter_ar: string;
  filter_en: string;
}[] = [
  {
    id: 'bluff',
    title_ar: 'مين عم يكذب؟',
    title_en: 'Who’s lying?',
    blurb_ar: 'خداع وجواسيس، وما حدا بيطلع بريء',
    blurb_en: 'Bluffs and spies. Nobody leaves innocent',
    filter_ar: 'خداع وجواسيس',
    filter_en: 'Bluff & Spies',
  },
  {
    id: 'telepathy',
    title_ar: 'عقل واحد',
    title_en: 'One mind',
    blurb_ar: 'تخاطر وخيال، لتعرفوا قديش بتفهموا على بعض',
    blurb_en: 'Telepathy and imagination. How in sync are you?',
    filter_ar: 'تخاطر وخيال',
    filter_en: 'Mind & Art',
  },
  {
    id: 'speed',
    title_ar: 'بسرعة، بسرعة!',
    title_en: 'Quick, quick!',
    blurb_ar: 'مواجهات سريعة وأعصاب مشدودة',
    blurb_en: 'Fast rounds and frayed nerves',
    filter_ar: 'سرعة ومواجهة',
    filter_en: 'Speed & Action',
  },
  {
    id: 'drawing',
    title_ar: 'ريشة وورطة',
    title_en: 'Draw your way out',
    blurb_ar: 'مو لازم تعرف ترسم، لازم تعرف تتهرّب',
    blurb_en: 'You don’t need talent, just a good excuse',
    filter_ar: 'رسم وإبداع',
    filter_en: 'Drawing',
  },
];

const FALLBACK_META: HomeGameMeta = {
  poster: '#ffca3a',
  hook_ar: '',
  hook_en: '',
  minutes: 15,
};

export const HOME_GAME_META: Partial<Record<PartyGameId, HomeGameMeta>> = {
  wavelength: {
    poster: '#ffca3a',
    hook_ar: 'تلميح واحد، وكل الشلّة لازم تقرا أفكارك',
    hook_en: 'One clue. Can the group read your mind?',
    minutes: 20,
  },
  boomdeck: {
    poster: '#00bbf9',
    hook_ar: 'اسحب كرت، وادعي ما تكون القنبلة',
    hook_en: 'Draw a card and pray it isn’t the bomb',
    minutes: 15,
    isFresh: true,
  },
  skull: {
    poster: '#ff595e',
    hook_ar: 'خبّي جمجمة بين الورد وزايد على أعصابهم',
    hook_en: 'Hide a skull, bid big, flip carefully',
    minutes: 15,
  },
  sheriff: {
    poster: '#ff924c',
    hook_ar: 'احلف إنه تفاح، والشنطة مليانة مهربات',
    hook_en: 'Swear it’s apples. The bag says otherwise',
    minutes: 25,
  },
  cashnguns: {
    poster: '#8ac926',
    hook_ar: 'صوّب ع صاحبك: الطلقة فاضية ولا لأ؟',
    hook_en: 'Point, bluff, and grab the loot',
    minutes: 15,
  },
  onenight: {
    poster: '#ff924c',
    hook_ar: 'ليلة وحدة، والأدوار بتتبدّل وإنتو نايمين',
    hook_en: 'One night. Roles swap while you sleep',
    minutes: 10,
  },
  resistance: {
    poster: '#ffca3a',
    hook_ar: '5 مهمات، وفي جاسوس عم يخرّب بينكم',
    hook_en: '5 missions. Someone here is sabotaging',
    minutes: 25,
  },
  artauction: {
    poster: '#00bbf9',
    hook_ar: 'ارسم، اختم بالسر، وبيعها بأغلى سعر',
    hook_en: 'Draw it, stamp it secretly, sell it high',
    minutes: 20,
  },
  alibi: {
    poster: '#ff924c',
    hook_ar: 'كلكم بترسموا، والمجرم عم يرسم عالعمياني',
    hook_en: 'Everyone sketches. The culprit is guessing',
    minutes: 15,
  },
  splitsteal: {
    poster: '#9b5de5',
    hook_ar: 'نتقاسم الخزنة، ولا بتغدر فيّي؟',
    hook_en: 'Split the vault, or steal it all?',
    minutes: 5,
  },
  chameleon: {
    poster: '#8ac926',
    hook_ar: 'كلكم بتعرفوا السالفة إلا واحد',
    hook_en: 'Everyone knows the topic. Except one',
    minutes: 10,
  },
  dixit: {
    poster: '#ff99c8',
    hook_ar: 'لوحة غريبة وتلميح لا سهل ولا مستحيل',
    hook_en: 'Strange art and a clue that’s just vague enough',
    minutes: 20,
  },
  taboo: {
    poster: '#ffca3a',
    hook_ar: 'اشرح الكلمة بدون الكلمات الممنوعة',
    hook_en: 'Explain it without the forbidden words',
    minutes: 15,
  },
  fakeartist: {
    poster: '#00bbf9',
    hook_ar: 'خط واحد لكل لاعب، ومين عم يخبّص؟',
    hook_en: 'One line each. Who’s faking it?',
    minutes: 10,
  },
  wits: {
    poster: '#ff99c8',
    hook_ar: 'ما بتعرف الجواب؟ راهن ع اللي بيعرف',
    hook_en: 'Don’t know the answer? Bet on who does',
    minutes: 20,
  },
  medium: {
    poster: '#ffca3a',
    hook_ar: 'كلمتين، واكتبوا نفس الرابط بنفس اللحظة',
    hook_en: 'Two words. Type the same link, together',
    minutes: 10,
  },
  soclover: {
    poster: '#ff99c8',
    hook_ar: 'شفرة وحدة لكل كلمتين، وركّبوا البورد',
    hook_en: 'One clue per word pair. Rebuild the board',
    minutes: 20,
  },
  ito: {
    poster: '#ff924c',
    hook_ar: 'وصّف رقمك بمثال، ورتّبوا حالكم',
    hook_en: 'Describe your number. Line up in order',
    minutes: 15,
  },
  wordbomb: {
    poster: '#9b5de5',
    hook_ar: 'الفتيل شغّال: هات كلمة وارميها!',
    hook_en: 'The fuse is lit. Say a word, pass it on!',
    minutes: 10,
  },
  themind: {
    poster: '#00f5d4',
    hook_ar: 'رتّبوا الأرقام بدون ولا كلمة',
    hook_en: 'Play in order without a single word',
    minutes: 10,
  },
};

export const getHomeGameMeta = (id: PartyGameId): HomeGameMeta =>
  HOME_GAME_META[id] || FALLBACK_META;

/** Dark ink on bright posters, cream on deep ones */
export const readableInk = (hex: string): string => {
  const n = parseInt(hex.slice(1), 16);
  const channels = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  const luminance = 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
  return luminance > 0.2 ? '#161426' : '#fff9ec';
};
