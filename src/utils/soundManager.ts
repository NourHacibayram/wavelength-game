import { PartyGameId } from '../data/partyGamesData';

export type MusicTrackId =
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
  vibe_ar: string;
  vibe_en: string;
}

export const MUSIC_TRACKS: Record<MusicTrackId, MusicTrackMeta> = {
  sneaky_snitch: {
    id: 'sneaky_snitch',
    url: '/audio/music/sneaky-snitch.mp3?v=2',
    title_ar: 'خطوة عالساكت (تسلل ومقالب - تلحين خاص)',
    title_en: 'Silent Tiptoe (Original Sneaky Heist)',
    vibe_ar: 'الفتيل الملعون، تفتيش الشريف، الجمجمة والورد، الغنائم والمسدسات',
    vibe_en: 'Cursed Fuse, Sheriff, Skull & Roses, Cash n Guns',
  },
  scheming_weasel: {
    id: 'scheming_weasel',
    url: '/audio/music/scheming-weasel.mp3?v=2',
    title_ar: 'همس الجواسيس (خداع وشكوك - تلحين خاص)',
    title_en: 'Spy Whisper (Original Bluff Groove)',
    vibe_ar: 'الحرباء، ليلة المستذئب، المقاومة، الدخيل، الرسام المزيف، حجة الغياب',
    vibe_en: 'Chameleon, One Night Werewolf, Resistance, Insider, Fake Artist, Alibi',
  },
  lobby_time: {
    id: 'lobby_time',
    url: '/audio/music/lobby-time.mp3?v=2',
    title_ar: 'طاولة السهرة (جاز كازينو - تلحين خاص)',
    title_en: 'Velvet Table (Original Lounge Jazz)',
    vibe_ar: 'تركس، مونوبولي، مزاد التحف، نصف أم سرقة، ديكسيت، الصالة الرئيسية',
    vibe_en: 'Trix, Monopoly, Art Auction, Split or Steal, Dixit, Main Lobby',
  },
  investigations: {
    id: 'investigations',
    url: '/audio/music/investigations.mp3?v=2',
    title_ar: 'شفرة العقول (تحقيق وتخاطر - تلحين خاص)',
    title_en: 'Mind Cipher (Original Detective Pulse)',
    vibe_ar: 'كسر الشيفرة، العقل الواحد، إيتو، الشاهد الصامت، التخاطر',
    vibe_en: 'Decrypto, The Mind, Ito, Silent Witness, Medium',
  },
  monkeys: {
    id: 'monkeys',
    url: '/audio/music/monkeys-spinning-monkeys.mp3?v=2',
    title_ar: 'سباق الأبطال (سهرة ومرح - تلحين خاص)',
    title_en: 'Party Dash (Original Upbeat Groove)',
    vibe_ar: 'حيّات وسلالم، على نفس الموجة، قنبلة الحروف، الكلمة الممنوعة، برسيم الكلمات',
    vibe_en: 'Snakes & Ladders, Wavelength, Word Bomb, Taboo, So Clover',
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
    case 'boomdeck':
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
    case 'wavelength':
    case 'snakes':
    case 'wordbomb':
    case 'taboo':
    case 'soclover':
      return 'monkeys';
    case 'trix':
    case 'monopoly':
    case 'artauction':
    case 'splitsteal':
    case 'dixit':
    case 'wits':
    case 'lobby':
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
  private bgAudio: HTMLAudioElement | null = null;
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
    if (this.bgAudio) {
      this.bgAudio.volume = this.musicVolume;
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

  public syncBackgroundMusic(forceRestart = false) {
    if (typeof window === 'undefined') return;
    if (!this.musicEnabled) {
      if (this.bgAudio) {
        this.bgAudio.pause();
      }
      return;
    }

    const targetTrackId: MusicTrackId =
      this.musicMode === 'auto'
        ? getRecommendedTrackForGame(this.currentContextGame)
        : this.musicMode;

    const trackMeta = MUSIC_TRACKS[targetTrackId];
    if (!trackMeta) return;

    if (
      !this.bgAudio ||
      this.activeTrackId !== targetTrackId ||
      forceRestart
    ) {
      if (this.bgAudio) {
        this.bgAudio.pause();
      }
      const nextAudio = new Audio(trackMeta.url);
      nextAudio.loop = true;
      nextAudio.volume = this.musicVolume;
      this.bgAudio = nextAudio;
      this.activeTrackId = targetTrackId;
    } else {
      this.bgAudio.volume = this.musicVolume;
    }

    if (this.bgAudio.paused) {
      this.bgAudio.play().catch(() => {
        // Browser autoplay policy waiting for first click
      });
    }
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
            this.playSfx('card_shuffle');
            return;
          case 'radar':
            this.playSfx('metal_click');
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

    // 2. Dice & Board Games (Snakes & Ladders, Monopoly)
    if (gameId === 'snakes' || gameId === 'monopoly') {
      if (
        prevData?.lastRoll !== nextData?.lastRoll ||
        prevData?.dice?.[0] !== nextData?.dice?.[0] ||
        prevData?.dice?.[1] !== nextData?.dice?.[1]
      ) {
        this.playSfx('dice_roll');
        return;
      }
      if (prevData?.cash && nextData?.cash) {
        const cashChanged = Object.keys(nextData.cash).some(
          (k) => prevData.cash[k] !== nextData.cash[k]
        );
        if (cashChanged) {
          this.playSfx('coins_jingle');
          return;
        }
      }
    }

    // 3. Card Games (Trix, Dixit, The Mind, Ito, Cockroach, Sheriff)
    if (
      gameId === 'trix' ||
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
