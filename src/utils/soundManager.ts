import { PartyGameId } from '../data/partyGamesData';
import { MUSIC_LOOPS } from '../data/musicLoops';
import { PARTY_GAMES_CATALOG } from '../data/extraGamesData';

// Every visible game has its own theme; 'lobby' plays on the home screen
export type MusicTrackId =
  | 'lobby'
  | 'wavelength'
  | 'boomdeck'
  | 'skull'
  | 'sheriff'
  | 'cashnguns'
  | 'onenight'
  | 'resistance'
  | 'artauction'
  | 'alibi'
  | 'splitsteal'
  | 'chameleon'
  | 'dixit'
  | 'taboo'
  | 'fakeartist'
  | 'wits'
  | 'medium'
  | 'soclover'
  | 'ito'
  | 'wordbomb'
  | 'themind';

export type MusicSelectionMode = 'auto' | MusicTrackId;

export type SfxId =
  | 'card_draw'
  | 'card_play'
  | 'card_shuffle'
  | 'card_fan'
  | 'card_shove'
  | 'wire_snip'
  | 'clock_tick'
  | 'explosion'
  | 'heavy_slam'
  | 'metal_click'
  | 'gun_click'
  | 'dice_shake'
  | 'dice_roll'
  | 'chip_place'
  | 'chips_stack'
  | 'coins_jingle'
  | 'applause_win'
  | 'book_flip'
  | 'ui_click'
  | 'ui_switch'
  | 'ui_pop';

export interface MusicTrackMeta {
  id: MusicTrackId;
  url: string;
  title_ar: string;
  title_en: string;
  mood_ar: string;
  mood_en: string;
  color: string;
}

// What each theme sounds like; titles and colours come from the game catalog
const THEME_MOODS: Record<MusicTrackId, [ar: string, en: string]> = {
  lobby: ['نهاوند ودربكة', 'Nahawand & darbuka'],
  wavelength: ['حالمة وهادية', 'Dreamy lo-fi'],
  boomdeck: ['حجاز وتكتكة', 'Hijaz & ticking'],
  skull: ['فالس قوطي', 'Gothic waltz'],
  sheriff: ['خبب ريفي', 'Border-town trot'],
  cashnguns: ['جاز عصابات', 'Noir heist jazz'],
  onenight: ['ليل وصندوق موسيقى', 'Moonlit music box'],
  resistance: ['مطاردة جواسيس', 'Surf-guitar spy chase'],
  artauction: ['بيانو راغتايم', 'Ragtime parlour'],
  alibi: ['محقق متسلل', 'Tiptoe detective'],
  splitsteal: ['توتر وثقة', 'Trust-or-betray tension'],
  chameleon: ['تصفيق خليجي', 'Gulf claps'],
  dixit: ['فالس حكايات', 'Fairy-tale waltz'],
  taboo: ['فانك مسابقات', 'Game-show funk'],
  fakeartist: ['أكورديون باريسي', 'Paris café accordion'],
  wits: ['برنامج مسابقات', 'Quiz-show bounce'],
  medium: ['هالة حالمة', 'Weightless shimmer'],
  soclover: ['ماريمبا تفكير', 'Puzzle marimba'],
  ito: ['صندوق موسيقى لطيف', 'Cute music box'],
  wordbomb: ['سباق مع الفتيل', 'Race the fuse'],
  themind: ['بيانو ونبض', 'Piano & heartbeat'],
};

export const MUSIC_TRACKS = Object.fromEntries(
  (Object.keys(THEME_MOODS) as MusicTrackId[]).map((id) => {
    const game = PARTY_GAMES_CATALOG.find((g) => g.id === id);
    const [mood_ar, mood_en] = THEME_MOODS[id];
    const meta: MusicTrackMeta = {
      id,
      url: `/audio/music/themes/${id}.mp3?v=2`,
      title_ar: game?.name_ar ?? 'سهرة الشلّة',
      title_en: game?.name_en ?? 'Shilla Night',
      mood_ar,
      mood_en,
      color: game?.accent ?? '#ff924c',
    };
    return [id, meta];
  })
) as Record<MusicTrackId, MusicTrackMeta>;

export interface SfxMeta {
  id: SfxId;
  urls: string[];
  label_ar: string;
  label_en: string;
  maxDurationMs?: number;
  baseVolume?: number;
}

export const SFX_CATALOG: Record<SfxId, SfxMeta> = {
  card_draw: {
    id: 'card_draw',
    urls: ['/audio/sfx/card-draw.ogg', '/audio/sfx/card-draw2.ogg'],
    label_ar: 'سحب كرت من الكومة',
    label_en: 'Draw Card',
    baseVolume: 0.9,
  },
  card_play: {
    id: 'card_play',
    urls: ['/audio/sfx/card-play.ogg', '/audio/sfx/card-play2.ogg'],
    label_ar: 'رمي كرت عالطاولة',
    label_en: 'Play Card on Table',
    baseVolume: 0.95,
  },
  card_shuffle: {
    id: 'card_shuffle',
    urls: ['/audio/sfx/card-shuffle.ogg'],
    label_ar: 'خلط كومة الورق',
    label_en: 'Shuffle Deck',
    baseVolume: 0.95,
  },
  card_fan: {
    id: 'card_fan',
    urls: ['/audio/sfx/card-fan.ogg'],
    label_ar: 'توزيع وفرد الكروت',
    label_en: 'Deal / Fan Cards',
    baseVolume: 0.9,
  },
  card_shove: {
    id: 'card_shove',
    urls: ['/audio/sfx/card-shove.ogg'],
    label_ar: 'سرقة كرت / زرع اللغم',
    label_en: 'Steal / Plant Card',
    baseVolume: 0.9,
  },
  wire_snip: {
    id: 'wire_snip',
    urls: ['/audio/sfx/wire-snip.ogg?v=2'],
    label_ar: 'قصّ الفتيل + رنّة النجاة الكرتونية',
    label_en: 'Cartoon Wire Snip & Rescue Chime',
    baseVolume: 1.0,
  },
  clock_tick: {
    id: 'clock_tick',
    urls: ['/audio/sfx/clock-tick.ogg?v=2'],
    label_ar: 'تكتكة عدّاد القنبلة الكرتوني',
    label_en: 'Cartoon Bomb Countdown',
    maxDurationMs: 950,
    baseVolume: 0.95,
  },
  explosion: {
    id: 'explosion',
    urls: ['/audio/sfx/explosion.ogg?v=2'],
    label_ar: 'انفجار كرتوني كوميدي (كابووم!)',
    label_en: 'Cartoon KABOOM!',
    baseVolume: 1.0,
  },
  heavy_slam: {
    id: 'heavy_slam',
    urls: ['/audio/sfx/heavy-slam.ogg?v=2'],
    label_ar: 'ضربة بلوك! كرتونية',
    label_en: 'Cartoon Block Slam',
    baseVolume: 0.95,
  },
  metal_click: {
    id: 'metal_click',
    urls: ['/audio/sfx/metal-click.ogg?v=2'],
    label_ar: 'نبضة رادار الكومة الكرتوني',
    label_en: 'Cartoon Radar Sonar Ping',
    baseVolume: 0.9,
  },
  gun_click: {
    id: 'gun_click',
    urls: ['/audio/sfx/gun-click.ogg'],
    label_ar: 'تلقيم مسدس الماء الكرتوني',
    label_en: 'Cartoon Cap-Gun Cock',
    baseVolume: 0.95,
  },
  dice_shake: {
    id: 'dice_shake',
    urls: ['/audio/sfx/dice-shake.ogg'],
    label_ar: 'خلط النرد باليد',
    label_en: 'Shake Dice',
    baseVolume: 0.9,
  },
  dice_roll: {
    id: 'dice_roll',
    urls: ['/audio/sfx/dice-roll.ogg'],
    label_ar: 'رمي النرد عالطاولة',
    label_en: 'Roll Dice on Board',
    baseVolume: 0.95,
  },
  chip_place: {
    id: 'chip_place',
    urls: ['/audio/sfx/chip-place.ogg'],
    label_ar: 'وضع فيشة / قرص عالطاولة',
    label_en: 'Place Chip / Disc',
    baseVolume: 0.9,
  },
  chips_stack: {
    id: 'chips_stack',
    urls: ['/audio/sfx/chips-stack.ogg'],
    label_ar: 'تجميع فيشات المزايدة',
    label_en: 'Stack Chips',
    baseVolume: 0.9,
  },
  coins_jingle: {
    id: 'coins_jingle',
    urls: ['/audio/sfx/coins-jingle.ogg'],
    label_ar: 'رنين الذهب والأموال',
    label_en: 'Coins & Cash Jingle',
    baseVolume: 0.9,
  },
  applause_win: {
    id: 'applause_win',
    urls: ['/audio/sfx/applause-win.ogg?v=2'],
    label_ar: 'فانفير الفوز الكرتوني الاحتفالي',
    label_en: 'Cartoon Victory Fanfare',
    baseVolume: 0.95,
  },
  book_flip: {
    id: 'book_flip',
    urls: ['/audio/sfx/book-flip.ogg'],
    label_ar: 'كشف الورقة / تقليب صفحة',
    label_en: 'Reveal / Flip Sheet',
    baseVolume: 0.85,
  },
  ui_click: {
    id: 'ui_click',
    urls: ['/audio/sfx/ui-click.ogg'],
    label_ar: 'نقرة زر',
    label_en: 'Button Click',
    baseVolume: 0.65,
  },
  ui_switch: {
    id: 'ui_switch',
    urls: ['/audio/sfx/ui-switch.ogg'],
    label_ar: 'تبديل الدور / الخيار',
    label_en: 'Switch Turn / Option',
    baseVolume: 0.7,
  },
  ui_pop: {
    id: 'ui_pop',
    urls: ['/audio/sfx/ui-pop.ogg'],
    label_ar: 'إيموجي / تنبيه خفيف',
    label_en: 'Reaction Pop',
    baseVolume: 0.7,
  },
};

// Games not in the picker borrow the theme of a game with a similar mood
const BORROWED_THEMES: Partial<Record<PartyGameId, MusicTrackId>> = {
  insider: 'chameleon',
  decrypto: 'resistance',
  witness: 'alibi',
  cockroach: 'skull',
};

export function getRecommendedTrackForGame(
  gameId: PartyGameId | 'lobby'
): MusicTrackId {
  if (gameId in THEME_MOODS) return gameId as MusicTrackId;
  return BORROWED_THEMES[gameId as PartyGameId] ?? 'lobby';
}

const STORAGE_KEYS = {
  musicEnabled: 'wp_audio_music_enabled',
  sfxEnabled: 'wp_audio_sfx_enabled',
  musicVolume: 'wp_audio_music_volume',
  sfxVolume: 'wp_audio_sfx_volume',
  musicMode: 'wp_audio_music_mode',
};

class SoundManager {
  private musicEnabled: boolean = true;
  private sfxEnabled: boolean = true;
  private musicVolume: number = 0.28;
  private sfxVolume: number = 0.85;
  private musicMode: MusicSelectionMode = 'auto';
  private currentContextGame: PartyGameId | 'lobby' = 'lobby';
  private activeTrackId: MusicTrackId | null = null;
  // Music runs through Web Audio so loops circle without a gap
  private audioCtx: AudioContext | null = null;
  private musicBus: GainNode | null = null;
  private musicVoice: { source: AudioBufferSourceNode; gain: GainNode } | null = null;
  private musicBuffers: Map<string, Promise<AudioBuffer>> = new Map();
  private musicRequest = 0;
  private sfxPreloadCache: Map<string, HTMLAudioElement> = new Map();
  private sfxVariationCursor: Map<SfxId, number> = new Map();
  private sfxLastPlayedAt: Map<SfxId, number> = new Map();
  private lastTransitionSfxAt = 0;
  private activeLoopSfx: Map<SfxId, HTMLAudioElement> = new Map();
  private listeners: Set<() => void> = new Set();
  private unlocked: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      const savedMusicEn = localStorage.getItem(STORAGE_KEYS.musicEnabled);
      if (savedMusicEn !== null) this.musicEnabled = savedMusicEn === 'true';

      const savedSfxEn = localStorage.getItem(STORAGE_KEYS.sfxEnabled);
      if (savedSfxEn !== null) this.sfxEnabled = savedSfxEn === 'true';

      const savedMusicVol = localStorage.getItem(STORAGE_KEYS.musicVolume);
      if (savedMusicVol !== null) {
        const parsed = parseFloat(savedMusicVol);
        if (!isNaN(parsed)) this.musicVolume = Math.max(0, Math.min(1, parsed));
      }

      const savedSfxVol = localStorage.getItem(STORAGE_KEYS.sfxVolume);
      if (savedSfxVol !== null) {
        const parsed = parseFloat(savedSfxVol);
        if (!isNaN(parsed)) this.sfxVolume = Math.max(0, Math.min(1, parsed));
      }

      const savedMode = localStorage.getItem(
        STORAGE_KEYS.musicMode
      ) as MusicSelectionMode | null;
      if (
        savedMode &&
        (savedMode === 'auto' || savedMode in MUSIC_TRACKS)
      ) {
        this.musicMode = savedMode;
      }

      // Preload all real SFX .ogg files for instant 0ms playback
      setTimeout(() => {
        Object.values(SFX_CATALOG).forEach((item) => {
          item.urls.forEach((u) => {
            if (!this.sfxPreloadCache.has(u)) {
              const a = new Audio(u);
              a.preload = 'auto';
              this.sfxPreloadCache.set(u, a);
            }
          });
        });
      }, 200);

      // Unlock background music on first user gesture anywhere in the app
      const unlockHandler = () => {
        if (!this.unlocked) {
          this.unlocked = true;
          this.syncBackgroundMusic();
        }
      };
      window.addEventListener('pointerdown', unlockHandler, { passive: true });
      window.addEventListener('keydown', unlockHandler, { passive: true });
    }
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((fn) => fn());
  }

  public getState() {
    const resolvedTrackId =
      this.musicMode === 'auto'
        ? getRecommendedTrackForGame(this.currentContextGame)
        : this.musicMode;
    return {
      musicEnabled: this.musicEnabled,
      sfxEnabled: this.sfxEnabled,
      musicVolume: this.musicVolume,
      sfxVolume: this.sfxVolume,
      musicMode: this.musicMode,
      currentContextGame: this.currentContextGame,
      resolvedTrackId,
    };
  }

  public setMusicEnabled(enabled: boolean) {
    this.musicEnabled = enabled;
    localStorage.setItem(STORAGE_KEYS.musicEnabled, String(enabled));
    this.unlocked = true;
    this.syncBackgroundMusic();
    this.notify();
  }

  public setSfxEnabled(enabled: boolean) {
    this.sfxEnabled = enabled;
    localStorage.setItem(STORAGE_KEYS.sfxEnabled, String(enabled));
    if (!enabled) {
      this.stopAllLoopingSfx();
    }
    this.notify();
  }

  public setMusicVolume(vol: number) {
    this.musicVolume = Math.max(0, Math.min(1, vol));
    localStorage.setItem(STORAGE_KEYS.musicVolume, String(this.musicVolume));
    if (this.musicBus && this.audioCtx) {
      this.musicBus.gain.setTargetAtTime(this.musicVolume, this.audioCtx.currentTime, 0.05);
    }
    this.notify();
  }

  public setSfxVolume(vol: number) {
    this.sfxVolume = Math.max(0, Math.min(1, vol));
    localStorage.setItem(STORAGE_KEYS.sfxVolume, String(this.sfxVolume));
    this.notify();
  }

  public setMusicMode(mode: MusicSelectionMode) {
    this.musicMode = mode;
    localStorage.setItem(STORAGE_KEYS.musicMode, mode);
    this.unlocked = true;
    this.syncBackgroundMusic(true);
    this.notify();
  }

  public setGameContext(gameId: PartyGameId | 'lobby') {
    if (this.currentContextGame === gameId) return;
    this.currentContextGame = gameId;
    this.syncBackgroundMusic();
    this.notify();
  }

  private ensureAudioContext(): AudioContext | null {
    if (this.audioCtx) return this.audioCtx;
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    this.audioCtx = new Ctor();
    this.musicBus = this.audioCtx.createGain();
    this.musicBus.gain.value = this.musicVolume;
    this.musicBus.connect(this.audioCtx.destination);
    return this.audioCtx;
  }

  private loadMusicBuffer(ctx: AudioContext, url: string): Promise<AudioBuffer> {
    let pending = this.musicBuffers.get(url);
    if (pending) {
      // refresh its place so the least recently used theme is dropped first
      this.musicBuffers.delete(url);
    } else {
      pending = fetch(url)
        .then((r) => r.arrayBuffer())
        .then((data) => ctx.decodeAudioData(data));
      pending.catch(() => this.musicBuffers.delete(url));
    }
    this.musicBuffers.set(url, pending);
    // a decoded theme is ~10-20 MB, so keep only the last few
    while (this.musicBuffers.size > 3) {
      const oldest = this.musicBuffers.keys().next().value as string;
      this.musicBuffers.delete(oldest);
    }
    return pending;
  }

  private fadeOutMusicVoice(seconds = 0.6) {
    const voice = this.musicVoice;
    if (!voice || !this.audioCtx) return;
    const now = this.audioCtx.currentTime;
    voice.gain.gain.cancelScheduledValues(now);
    voice.gain.gain.setValueAtTime(voice.gain.gain.value, now);
    voice.gain.gain.linearRampToValueAtTime(0, now + seconds);
    voice.source.stop(now + seconds + 0.05);
    this.musicVoice = null;
  }

  public syncBackgroundMusic(forceRestart = false) {
    if (typeof window === 'undefined') return;
    if (!this.musicEnabled) {
      this.musicRequest++;
      this.fadeOutMusicVoice(0.3);
      this.activeTrackId = null;
      return;
    }
    // Browsers only allow audio after the first tap or key press
    if (!this.unlocked) return;

    const targetTrackId: MusicTrackId =
      this.musicMode === 'auto'
        ? getRecommendedTrackForGame(this.currentContextGame)
        : this.musicMode;
    const trackMeta = MUSIC_TRACKS[targetTrackId];
    if (!trackMeta) return;

    const ctx = this.ensureAudioContext();
    if (!ctx || !this.musicBus) return;
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    this.musicBus.gain.setTargetAtTime(this.musicVolume, ctx.currentTime, 0.05);

    if (this.musicVoice && this.activeTrackId === targetTrackId && !forceRestart) return;

    this.activeTrackId = targetTrackId;
    const request = ++this.musicRequest;
    this.loadMusicBuffer(ctx, trackMeta.url)
      .then((buffer) => {
        if (request !== this.musicRequest || !this.musicBus) return;
        this.fadeOutMusicVoice();

        const loop = MUSIC_LOOPS[targetTrackId];
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.loop = true;
        const loopStart = loop ? loop.loopStart : 0;
        if (loop) {
          source.loopStart = loop.loopStart;
          source.loopEnd = Math.min(loop.loopEnd, buffer.duration);
        }
        const gain = ctx.createGain();
        const now = ctx.currentTime;
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(1, now + 0.6);
        source.connect(gain).connect(this.musicBus);
        source.start(now, loopStart);
        this.musicVoice = { source, gain };
      })
      .catch(() => {
        if (request === this.musicRequest) this.activeTrackId = null;
      });
  }

  public playSfx(id: SfxId, customDurationMs?: number) {
    if (typeof window === 'undefined' || !this.sfxEnabled) return;
    const meta = SFX_CATALOG[id];
    if (!meta || meta.urls.length === 0) return;
    this.sfxLastPlayedAt.set(id, Date.now());

    const cursor = this.sfxVariationCursor.get(id) || 0;
    const url = meta.urls[cursor % meta.urls.length];
    this.sfxVariationCursor.set(id, cursor + 1);

    const cached = this.sfxPreloadCache.get(url);
    const audioEl = cached
      ? (cached.cloneNode(true) as HTMLAudioElement)
      : new Audio(url);

    audioEl.volume = Math.max(
      0,
      Math.min(1, (meta.baseVolume ?? 0.9) * this.sfxVolume)
    );
    audioEl.play().catch(() => {});

    const cutoffMs = customDurationMs ?? meta.maxDurationMs;
    if (cutoffMs && cutoffMs > 0) {
      setTimeout(() => {
        try {
          audioEl.pause();
          audioEl.currentTime = 0;
        } catch {
          // ignore
        }
      }, cutoffMs);
    }
  }

  public stopAllLoopingSfx() {
    this.activeLoopSfx.forEach((a) => {
      try {
        a.pause();
        a.currentTime = 0;
      } catch {
        // ignore
      }
    });
    this.activeLoopSfx.clear();
  }

  /**
   * Plays a dramatic 2-beat Bomb Defuse sequence using real recorded Foley files:
   * - Beat 1 (0ms -> 920ms): Real ticking clock (`clock-tick.ogg`)
   * - Beat 2 (920ms): Crisp metallic wire snip (`wire-snip.ogg` + `metal-click.ogg`)
   */
  public playDefuseShowdownSequence() {
    if (!this.sfxEnabled) return;
    this.playSfx('clock_tick', 920);
    setTimeout(() => {
      if (!this.sfxEnabled) return;
      this.playSfx('wire_snip');
    }, 910);
  }

  /**
   * Plays a sound unless the same one already played in the last `windowMs`.
   * The player who acts hears their sound right away, and the same move then
   * arrives back from the server — this stops it from playing twice.
   */
  private playSfxOnce(id: SfxId, windowMs = 1500) {
    const last = this.sfxLastPlayedAt.get(id) ?? 0;
    if (Date.now() - last < windowMs) return;
    this.playSfx(id);
  }

  /**
   * Plays a sound when a synced game state changes, for every player in the room.
   */
  public playGameDataTransitionSfx(
    gameId: PartyGameId,
    prevData: any,
    nextData: any,
    scoreAwards?: Record<string, number>
  ) {
    if (!this.sfxEnabled || !nextData) return;

    const phaseChanged = prevData?.phase !== nextData?.phase;
    const hasScoreAwards =
      scoreAwards &&
      Object.values(scoreAwards).some((pts) => typeof pts === 'number' && pts > 0);

    // Boom Deck: react to each new cinematic event once
    if (gameId === 'boomdeck') {
      const prevCinId = prevData?.lastCinematic?.id;
      const nextCin = nextData?.lastCinematic;
      if (nextCin && nextCin.id !== prevCinId) {
        const id: string = String(nextCin.id || '');
        // `cin_<time>` = a card was just thrown on the table; the effect sound plays when it resolves (`cin_res_`)
        const isCardThrown = /^cin_\d/.test(id);
        switch (nextCin.type) {
          case 'exploded':
            this.playSfxOnce('explosion');
            break;
          case 'defuse':
            // the defuse showdown plays its own tick + snip
            break;
          case 'planted':
          case 'bottom_draw':
            this.playSfxOnce('card_shove');
            break;
          case 'draw_safe':
          case 'bomb':
            this.playSfxOnce('card_draw');
            break;
          case 'block':
            this.playSfxOnce('heavy_slam');
            break;
          default:
            if (isCardThrown) {
              this.playSfxOnce('card_play');
            } else if (nextCin.type === 'shuffle' || nextCin.type === 'scry') {
              this.playSfxOnce('card_shuffle');
            } else if (nextCin.type === 'radar' || nextCin.type === 'stack_deck') {
              this.playSfxOnce('metal_click');
            } else if (nextCin.type === 'magnet') {
              this.playSfxOnce('card_shove');
            } else {
              this.playSfxOnce('ui_switch');
            }
        }
      }
      if (prevData?.phase !== 'round_over' && nextData?.phase === 'round_over') {
        setTimeout(() => this.playSfxOnce('applause_win', 2500), 550);
      }
      return;
    }

    // Other games: one sound per change at most every 350ms, so fast updates don't stack up
    const now = Date.now();
    if (now - this.lastTransitionSfxAt < 350) return;
    this.lastTransitionSfxAt = now;

    // Card games
    if (
      gameId === 'dixit' ||
      gameId === 'themind' ||
      gameId === 'ito' ||
      gameId === 'cockroach' ||
      gameId === 'sheriff'
    ) {
      if (phaseChanged) {
        if (
          nextData?.phase === 'reveal' ||
          nextData?.phase === 'inspection' ||
          nextData?.phase === 'round_over'
        ) {
          this.playSfxOnce('book_flip', 400);
        } else {
          this.playSfxOnce('card_fan', 400);
        }
        return;
      }
      this.playSfxOnce('card_play', 300);
      return;
    }

    // Bidding, chips and bluffing discs
    if (
      gameId === 'skull' ||
      gameId === 'artauction' ||
      gameId === 'splitsteal' ||
      gameId === 'wits'
    ) {
      if (hasScoreAwards) {
        this.playSfxOnce('applause_win', 2500);
        return;
      }
      if (phaseChanged) {
        this.playSfxOnce('heavy_slam', 400);
        return;
      }
      this.playSfxOnce('chip_place', 300);
      return;
    }

    // Word Bomb: only the explosion and turn/phase changes, not every keystroke
    if (gameId === 'wordbomb') {
      if (
        nextData?.explodedPlayerId &&
        prevData?.explodedPlayerId !== nextData?.explodedPlayerId
      ) {
        this.playSfxOnce('explosion');
      } else if (phaseChanged) {
        this.playSfxOnce('ui_switch', 400);
      }
      return;
    }

    // Cash 'n Guns: cartoon cap-gun when the phase changes (aiming, firing)
    if (gameId === 'cashnguns') {
      if (phaseChanged) {
        this.playSfxOnce('gun_click', 400);
        return;
      }
      this.playSfxOnce('chip_place', 300);
      return;
    }

    // Everything else: only phase changes make a sound
    if (hasScoreAwards) {
      this.playSfxOnce('applause_win', 2500);
    } else if (phaseChanged) {
      this.playSfxOnce('book_flip', 400);
    }
  }
}

export const soundManager = new SoundManager();
