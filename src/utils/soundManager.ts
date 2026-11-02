import { PartyGameId } from '../data/partyGamesData';
import { MUSIC_LOOPS } from '../data/musicLoops';

export type MusicTrackId =
  | 'lobby'
  | 'boomdeck'
  | 'wavelength'
  | 'sneaky_snitch'
  | 'scheming_weasel'
  | 'lobby_time'
  | 'investigations'
  | 'monkeys';

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

const themeUrl = (id: string) => `/audio/music/themes/${id}.mp3?v=1`;

export const MUSIC_TRACKS: Record<MusicTrackId, MusicTrackMeta> = {
  lobby: {
    id: 'lobby',
    url: themeUrl('lobby'),
    title_ar: 'سهرة الشلّة',
    title_en: 'Shilla Night',
    mood_ar: 'نهاوند ودربكة',
    mood_en: 'Nahawand & darbuka',
    color: '#ff924c',
  },
  boomdeck: {
    id: 'boomdeck',
    url: themeUrl('boomdeck'),
    title_ar: 'الفتيل الملعون',
    title_en: 'Cursed Fuse',
    mood_ar: 'حجاز وتكتكة',
    mood_en: 'Hijaz & ticking',
    color: '#f15bb5',
  },
  wavelength: {
    id: 'wavelength',
    url: themeUrl('wavelength'),
    title_ar: 'عَ نفس الموجة',
    title_en: 'Tune In',
    mood_ar: 'حالمة وهادية',
    mood_en: 'Dreamy lo-fi',
    color: '#4cc9f0',
  },
  sneaky_snitch: {
    id: 'sneaky_snitch',
    url: '/audio/music/sneaky-snitch.mp3?v=2',
    title_ar: 'خطوة عالساكت',
    title_en: 'Silent Tiptoe',
    mood_ar: 'تسلل ومقالب',
    mood_en: 'Sneaky heist',
    color: '#ff595e',
  },
  scheming_weasel: {
    id: 'scheming_weasel',
    url: '/audio/music/scheming-weasel.mp3?v=2',
    title_ar: 'همس الجواسيس',
    title_en: 'Spy Whisper',
    mood_ar: 'خداع وشكوك',
    mood_en: 'Bluff & suspicion',
    color: '#9b5de5',
  },
  lobby_time: {
    id: 'lobby_time',
    url: '/audio/music/lobby-time.mp3?v=2',
    title_ar: 'طاولة السهرة',
    title_en: 'Velvet Table',
    mood_ar: 'جاز هادي',
    mood_en: 'Lounge jazz',
    color: '#ffca3a',
  },
  investigations: {
    id: 'investigations',
    url: '/audio/music/investigations.mp3?v=2',
    title_ar: 'شفرة العقول',
    title_en: 'Mind Cipher',
    mood_ar: 'تحقيق وتخاطر',
    mood_en: 'Detective pulse',
    color: '#00bbf9',
  },
  monkeys: {
    id: 'monkeys',
    url: '/audio/music/monkeys-spinning-monkeys.mp3?v=2',
    title_ar: 'سباق الأبطال',
    title_en: 'Party Dash',
    mood_ar: 'سهرة ومرح',
    mood_en: 'Upbeat groove',
    color: '#8ac926',
  },
};

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

export function getRecommendedTrackForGame(
  gameId: PartyGameId | 'lobby'
): MusicTrackId {
  switch (gameId) {
    case 'lobby':
    case 'boomdeck':
    case 'wavelength':
      return gameId;
    case 'sheriff':
    case 'skull':
    case 'cashnguns':
    case 'cockroach':
      return 'sneaky_snitch';
    case 'chameleon':
    case 'onenight':
    case 'resistance':
    case 'insider':
    case 'fakeartist':
    case 'alibi':
      return 'scheming_weasel';
    case 'decrypto':
    case 'witness':
    case 'medium':
    case 'themind':
    case 'ito':
      return 'investigations';
    case 'wordbomb':
    case 'taboo':
    case 'soclover':
      return 'monkeys';
    case 'artauction':
    case 'splitsteal':
    case 'dixit':
    case 'wits':
    default:
      return 'lobby_time';
  }
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
    if (!pending) {
      pending = fetch(url)
        .then((r) => r.arrayBuffer())
        .then((data) => ctx.decodeAudioData(data));
      pending.catch(() => this.musicBuffers.delete(url));
      this.musicBuffers.set(url, pending);
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
   * Automatically triggers real Foley SFX across all 27 games when `game_data` updates!
   */
  public playGameDataTransitionSfx(
    gameId: PartyGameId,
    prevData: any,
    nextData: any,
    scoreAwards?: Record<string, number>
  ) {
    if (!this.sfxEnabled || !nextData) return;

    // 1. Check if someone won the round or earned points
    const hasScoreAwards =
      scoreAwards &&
      Object.values(scoreAwards).some((pts) => typeof pts === 'number' && pts > 0);

    // Special handling for BoomDeck ("الفتيل الملعون") cinematics
    if (gameId === 'boomdeck') {
      const prevCinId = prevData?.lastCinematic?.id;
      const nextCin = nextData?.lastCinematic;
      if (nextCin && nextCin.id !== prevCinId) {
        switch (nextCin.type) {
          case 'exploded':
            this.playSfx('explosion');
            return;
          case 'defuse':
            // Handled by defuseShowdown effect so it doesn't double-fire
            return;
          case 'planted':
            this.playSfx('card_shove');
            return;
          case 'shuffle':
          case 'scry':
            this.playSfx('card_shuffle');
            return;
          case 'radar':
          case 'stack_deck':
            this.playSfx('metal_click');
            return;
          case 'bottom_draw':
            this.playSfx('card_shove');
            return;
          case 'block':
            this.playSfx('heavy_slam');
            return;
          case 'magnet':
            this.playSfx('card_shove');
            return;
          case 'attack':
          case 'skip':
          case 'reverse':
            this.playSfx('card_play');
            return;
          case 'draw_safe':
          case 'bomb':
            this.playSfx('card_draw');
            return;
        }
      }
      if (
        prevData?.phase !== 'round_over' &&
        nextData?.phase === 'round_over'
      ) {
        setTimeout(() => this.playSfx('applause_win'), 550);
      }
      return;
    }

    // 3. Card Games (Dixit, The Mind, Ito, Cockroach, Sheriff)
    if (
      gameId === 'dixit' ||
      gameId === 'themind' ||
      gameId === 'ito' ||
      gameId === 'cockroach' ||
      gameId === 'sheriff'
    ) {
      if (prevData?.phase !== nextData?.phase) {
        if (
          nextData?.phase === 'reveal' ||
          nextData?.phase === 'inspection' ||
          nextData?.phase === 'round_over'
        ) {
          this.playSfx('book_flip');
        } else {
          this.playSfx('card_fan');
        }
        return;
      }
      this.playSfx('card_play');
      return;
    }

    // 4. Bidding, Chips & Bluffing Discs (Skull, Art Auction, Split or Steal, Wits)
    if (
      gameId === 'skull' ||
      gameId === 'artauction' ||
      gameId === 'splitsteal' ||
      gameId === 'wits'
    ) {
      if (hasScoreAwards) {
        this.playSfx('applause_win');
        return;
      }
      if (prevData?.phase !== nextData?.phase) {
        this.playSfx('heavy_slam');
        return;
      }
      this.playSfx('chip_place');
      return;
    }

    // 5. Word Bomb & Taboo
    if (gameId === 'wordbomb') {
      if (prevData?.explodedPlayerId !== nextData?.explodedPlayerId && nextData?.explodedPlayerId) {
        this.playSfx('explosion');
        return;
      }
      this.playSfx('ui_switch');
      return;
    }

    // 6. Cash 'n Guns
    if (gameId === 'cashnguns') {
      if (prevData?.phase !== nextData?.phase) {
        this.playSfx('metal_click');
        return;
      }
      this.playSfx('chip_place');
      return;
    }

    // 7. Generic fallback for all other games (One Night, Resistance, Chameleon, Insider, Decrypto, Alibi, Fake Artist, etc.)
    if (hasScoreAwards) {
      this.playSfx('applause_win');
    } else if (prevData?.phase !== nextData?.phase) {
      this.playSfx('book_flip');
    } else {
      this.playSfx('ui_switch');
    }
  }
}

export const soundManager = new SoundManager();
