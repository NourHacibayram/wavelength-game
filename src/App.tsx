import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import {
  supabase,
  getLocalPlayerId,
  getLocalPlayerName,
  setLocalPlayerName,
  getLocalPlayerColor,
  setLocalPlayerColor,
  generateRoomCode,
  CARTOON_AVATAR_COLORS,
} from './lib/supabase';
import {
  SpectrumCardItem,
  calculateScoreFromAngles,
  generateRandomTargetAngle,
  pickNextCard,
} from './data/cards';
import { TRANSLATIONS, Lang } from './data/translations';
import {
  PartyGameId,
  CHAMELEON_TOPICS,
  ITO_THEMES,
  WORD_BOMB_CHALLENGES,
} from './data/partyGamesData';
import {
  PARTY_GAMES_CATALOG,
  TABOO_CARDS,
  WITNESS_MONSTERS,
  FAKE_ARTIST_PROMPTS,
  MEDIUM_WORD_PAIRS,
  WITS_QUESTIONS,
  INSIDER_WORDS,
} from './data/extraGamesData';
import { HomePage, InviteJoinCard } from './components/HomePage';
import { RoomMenu } from './components/RoomMenu';
import { makeRoomStamp, mergeJson, sameRoomStamp } from './utils/roomSync';
import { WavelengthWheel } from './components/WavelengthWheel';
import { SpectrumCard } from './components/SpectrumCard';
import {
  HowToPlayModal,
  CustomCardModal,
  GamePickerModal,
} from './components/Modals';
import { ChameleonGame, ChameleonGameState } from './components/ChameleonGame';
import { ItoGame, ItoGameState } from './components/ItoGame';
import { WordBombGame, WordBombGameState } from './components/WordBombGame';
import { TabooGame, TabooGameState } from './components/TabooGame';
import {
  DixitGame,
  DixitGameState,
  buildDixitHands,
} from './components/DixitGame';
import { WitnessGame, WitnessGameState } from './components/WitnessGame';
import { FakeArtistGame, FakeArtistGameState } from './components/FakeArtistGame';
import { MediumGame, MediumGameState } from './components/MediumGame';
import {
  SoCloverGame,
  SoCloverGameState,
  buildInitialSoCloverState,
} from './components/SoCloverGame';
import { WitsGame, WitsGameState } from './components/WitsGame';
import { InsiderGame, InsiderGameState } from './components/InsiderGame';
import {
  DecryptoGame,
  DecryptoGameState,
  buildInitialDecryptoState,
} from './components/DecryptoGame';
import {
  CockroachGame,
  CockroachGameState,
  randomCritter,
} from './components/CockroachGame';
import {
  TheMindGame,
  TheMindGameState,
  buildInitialTheMindState,
} from './components/TheMindGame';
import {
  SkullGame,
  SkullGameState,
  buildInitialSkullState,
} from './components/SkullGame';
import {
  SheriffGame,
  SheriffGameState,
  buildInitialSheriffState,
} from './components/SheriffGame';
import {
  CashNGunsGame,
  CashNGunsGameState,
  buildInitialCashNGunsState,
} from './components/CashNGunsGame';
import {
  OneNightGame,
  OneNightGameState,
  buildInitialOneNightState,
} from './components/OneNightGame';
import {
  ResistanceGame,
  ResistanceGameState,
  buildInitialResistanceState,
} from './components/ResistanceGame';
import {
  ArtAuctionGame,
  ArtAuctionGameState,
  buildInitialArtAuctionState,
} from './components/ArtAuctionGame';
import {
  AlibiGame,
  AlibiGameState,
  buildInitialAlibiState,
} from './components/AlibiGame';
import {
  SplitStealGame,
  SplitStealGameState,
  buildInitialSplitStealState,
} from './components/SplitStealGame';
import {
  BoomDeckGame,
  BoomDeckGameState,
  buildInitialBoomDeckState,
} from './components/BoomDeckGame';
import {
  PartyGameSvgIcon,
  ReactionSvgIcon,
  ReactionType,
} from './components/CartoonIcons';
import { AudioControlPanel } from './components/AudioControlPanel';
import { soundManager } from './utils/soundManager';
import {
  Globe,
  Question,
  Users,
  Copy,
  Check,
  SignOut,
  Crown,
  Sparkle,
  PaperPlaneTilt,
  Target,
  Trophy,
  Plus,
  Play,
  ArrowCounterClockwise,
  Eye,
  EyeSlash,
  UserMinus,
  SquaresFour,
  Medal,
  Sword,
  CheckCircle,
  Hourglass,
  FilmStrip,
} from '@phosphor-icons/react';

interface RoomState {
  id: string;
  code: string;
  host_id: string;
  mode: 'coop' | 'teams';
  language: Lang;
  status: 'lobby' | 'psychic_clue' | 'guessing' | 'left_right' | 'reveal' | 'finished';
  round_number: number;
  max_rounds: number;
  psychic_id: string | null;
  active_team: 'A' | 'B';
  target_angle: number;
  dial_angle: number;
  clue: string;
  card_left_ar: string;
  card_right_ar: string;
  card_left_en: string;
  card_right_en: string;
  card_category: string;
  other_team_guess: 'left' | 'right' | null;
  coop_score: number;
  team_a_score: number;
  team_b_score: number;
  last_round_points: number;
  last_bonus_points: number;
  used_card_indices: number[];
  custom_cards: SpectrumCardItem[];
  selected_game?: PartyGameId;
  game_data?: any;
  updated_at?: string | null;
}

interface PlayerItem {
  id: string;
  room_id: string;
  name: string;
  avatar_color: string;
  team: 'A' | 'B';
  score: number;
  is_host: boolean;
}

interface FloatingReaction {
  id: string;
  reactionType: ReactionType;
  sender: string;
  x: number;
}

const REACTION_TYPES: ReactionType[] = [
  'bullseye',
  'fire',
  'laugh',
  'wow',
  'clap',
  'think',
];

export function App() {
  const [lang, setLang] = useState<Lang>('ar');
  const t = TRANSLATIONS[lang];

  // Player Identity
  const [playerId] = useState<string>(() => getLocalPlayerId());
  const [playerName, setPlayerName] = useState<string>(() => getLocalPlayerName());
  const [playerColor, setPlayerColor] = useState<string>(() => getLocalPlayerColor());

  // Navigation & Room State
  const [joinCodeInput, setJoinCodeInput] = useState<string>('');
  const [room, setRoom] = useState<RoomState | null>(null);
  const [players, setPlayers] = useState<PlayerItem[]>([]);
  const [isPassAndPlay, setIsPassAndPlay] = useState<boolean>(false);
  const [localPeekTarget, setLocalPeekTarget] = useState<boolean>(false);
  const [psychicCurtainOpen, setPsychicCurtainOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  // Modals
  const [showHowToPlay, setShowHowToPlay] = useState<boolean>(false);
  const [howToPlayTargetGame, setHowToPlayTargetGame] = useState<PartyGameId | null>(null);
  const [showCustomCardModal, setShowCustomCardModal] = useState<boolean>(false);
  const [showGamePickerModal, setShowGamePickerModal] = useState<boolean>(false);

  const openHowToPlayFor = (gid?: PartyGameId) => {
    setHowToPlayTargetGame(gid || null);
    setShowHowToPlay(true);
  };

  // Home Page Selected Game
  const [homeSelectedGame, setHomeSelectedGame] = useState<PartyGameId>('wavelength');

  // Gameplay local inputs
  const [clueInput, setClueInput] = useState<string>('');
  const [localNewPlayerName, setLocalNewPlayerName] = useState<string>('');
  const [liveDialAngle, setLiveDialAngle] = useState<number>(0);
  const [reactions, setReactions] = useState<FloatingReaction[]>([]);

  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const lastBroadcastRef = useRef<number>(0);

  // Room sync bookkeeping: the newest room we know of, how many of our writes are still
  // travelling, and the stamp of our last write whose realtime echo hasn't come back yet
  const roomRef = useRef<RoomState | null>(null);
  roomRef.current = room;
  const pendingRoomWritesRef = useRef<number>(0);
  const awaitingEchoRef = useRef<string | null>(null);
  const echoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resyncRoom = async (roomId: string) => {
    const [{ data: freshRoom }, { data: freshPlayers }] = await Promise.all([
      supabase.from('wavelength_rooms').select('*').eq('id', roomId).maybeSingle(),
      supabase
        .from('wavelength_players')
        .select('*')
        .eq('room_id', roomId)
        .order('joined_at', { ascending: true }),
    ]);
    if (freshRoom && pendingRoomWritesRef.current === 0 && roomRef.current?.id === roomId) {
      awaitingEchoRef.current = null;
      setRoom(freshRoom as RoomState);
    }
    if (freshPlayers && roomRef.current?.id === roomId) setPlayers(freshPlayers as PlayerItem[]);
  };

  // Keep HTML dir and lang attributes synced
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }, [lang]);

  // A `?room=XXXX` link goes straight to the room: right away if we already know your name,
  // otherwise after a one-field name card
  const [inviteCode, setInviteCode] = useState<string | null>(() => {
    const codeParam = new URLSearchParams(window.location.search).get('room');
    return codeParam ? codeParam.trim().toUpperCase() : null;
  });
  useEffect(() => {
    if (!inviteCode) return;
    setJoinCodeInput(inviteCode);
    if (playerName.trim()) handleJoinRoom(undefined, inviteCode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reset liveDialAngle to 0 at the start of a new round
  useEffect(() => {
    if (room?.status === 'psychic_clue') {
      setLiveDialAngle(0);
    } else if (room?.mode === 'teams' && room) {
      setLiveDialAngle(Number(room.dial_angle) || 0);
    }
  }, [room?.round_number, room?.status, room?.mode, room?.dial_angle]);

  // Trigger Psychic Safety Curtain at the start of every psychic_clue phase (for Wavelength).
  // Only on a shared device: online, the target shows on the psychic's own screen only
  useEffect(() => {
    const activeGame = room?.selected_game || 'wavelength';
    if (activeGame === 'wavelength' && room?.status === 'psychic_clue') {
      setLocalPeekTarget(!isPassAndPlay);
      setPsychicCurtainOpen(isPassAndPlay);
    } else {
      setPsychicCurtainOpen(false);
    }
  }, [room?.status, room?.round_number, room?.selected_game, isPassAndPlay]);

  // Trigger confetti on high score reveal!
  useEffect(() => {
    if (room?.status === 'reveal' && room.last_round_points >= 3) {
      confetti({
        particleCount: room.last_round_points === 4 ? 110 : 55,
        spread: 80,
        origin: { y: 0.6 },
      });
    }
  }, [room?.status, room?.round_number]);

  const spawnReaction = useCallback((reactionType: ReactionType, sender: string) => {
    const id = Math.random().toString(36).slice(2, 9);
    const x = 15 + Math.random() * 70;
    setReactions((prev) => [...prev.slice(-10), { id, reactionType, sender, x }]);
    setTimeout(() => {
      setReactions((prev) => prev.filter((r) => r.id !== id));
    }, 2600);
  }, []);

  // Subscribe to Supabase Realtime for active online room
  useEffect(() => {
    if (!room || isPassAndPlay) return;

    const currentRoomId = room.id;
    const currentRoomCode = room.code;

    const channel = supabase
      .channel(`wavelength_room_${currentRoomCode}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'wavelength_rooms',
          filter: `id=eq.${currentRoomId}`,
        },
        (payload) => {
          const incoming = payload.new as RoomState | undefined;
          if (!incoming?.id) return;
          // Our own write is in flight: it will hand us the merged room when it lands
          if (pendingRoomWritesRef.current > 0) return;
          // Updates that landed before our last write arrive late; skip them until our own echo
          const waitingFor = awaitingEchoRef.current;
          if (waitingFor) {
            if (!sameRoomStamp(incoming.updated_at, waitingFor)) return;
            awaitingEchoRef.current = null;
          }
          setRoom(incoming);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'wavelength_players',
          filter: `room_id=eq.${currentRoomId}`,
        },
        async () => {
          const { data } = await supabase
            .from('wavelength_players')
            .select('*')
            .eq('room_id', currentRoomId)
            .order('joined_at', { ascending: true });
          if (data) {
            const list = data as PlayerItem[];
            setPlayers(list);
            if (list.length > 0 && !list.some((p) => p.id === playerId)) {
              setRoom(null);
              setPlayers([]);
              setErrorMsg(
                lang === 'ar'
                  ? 'تم إخراجك من الغرفة من قِبل صاحب الغرفة.'
                  : 'You were kicked from the room by the host.'
              );
              window.history.replaceState({}, '', window.location.pathname);
            }
          }
        }
      )
      .on('broadcast', { event: 'kick_player' }, ({ payload }) => {
        if (payload?.kickedId === playerId) {
          setRoom(null);
          setPlayers([]);
          setErrorMsg(
            lang === 'ar'
              ? 'تم إخراجك من الغرفة من قِبل صاحب الغرفة.'
              : 'You were kicked from the room by the host.'
          );
          window.history.replaceState({}, '', window.location.pathname);
        }
      })
      .on('broadcast', { event: 'dial_move' }, ({ payload }) => {
        if (
          room.mode === 'teams' &&
          payload &&
          typeof payload.angle === 'number' &&
          payload.senderId !== playerId
        ) {
          setLiveDialAngle(payload.angle);
        }
      })
      .on('broadcast', { event: 'reaction' }, ({ payload }) => {
        if (payload?.reactionType) {
          spawnReaction(payload.reactionType as ReactionType, payload.senderName || '');
        }
      })
      // (Re)connected: anything we missed while offline is only in the database now
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') resyncRoom(currentRoomId);
      });

    channelRef.current = channel;

    // A phone that slept or switched apps misses updates, so catch up when it comes back
    const onWake = () => {
      if (document.visibilityState === 'visible') resyncRoom(currentRoomId);
    };
    document.addEventListener('visibilitychange', onWake);
    window.addEventListener('online', onWake);

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
      document.removeEventListener('visibilitychange', onWake);
      window.removeEventListener('online', onWake);
    };
  }, [room?.id, isPassAndPlay, playerId, spawnReaction, lang, room?.mode]);

  const ensurePlayerIdentity = (): string | null => {
    const trimmed = playerName.trim();
    if (!trimmed) {
      setErrorMsg(lang === 'ar' ? 'اكتب اسمك بالأول عشان نعرفك!' : 'Please enter your name first!');
      return null;
    }
    setLocalPlayerName(trimmed);
    setLocalPlayerColor(playerColor);
    setErrorMsg(null);
    return trimmed;
  };

  // Build initial game_data for ANY of the 14 Party Games!
  const buildInitialGameData = (gameId: PartyGameId, playerList: PlayerItem[]) => {
    const validPlayers =
      playerList.length > 0
        ? playerList
        : [
            {
              id: playerId,
              room_id: room?.id || 'local',
              name: playerName || 'Player 1',
              avatar_color: playerColor,
              team: 'A' as const,
              score: 0,
              is_host: true,
            },
          ];
    const pIds = validPlayers.map((p) => p.id);

    switch (gameId) {
      case 'chameleon': {
        const topic = CHAMELEON_TOPICS[Math.floor(Math.random() * CHAMELEON_TOPICS.length)];
        const secretWordIndex = Math.floor(Math.random() * 16);
        const randomCham = validPlayers[Math.floor(Math.random() * validPlayers.length)];
        const state: ChameleonGameState = {
          phase: 'qa',
          topicId: topic.id,
          secretWordIndex,
          chameleonId: randomCham.id,
          turnIndex: 0,
          qaHistory: [],
          votes: {},
          chameleonChosenWordIndex: null,
        };
        return state;
      }

      case 'ito': {
        const theme = ITO_THEMES[Math.floor(Math.random() * ITO_THEMES.length)];
        const usedNums = new Set<number>();
        const numbers: Record<string, number> = {};
        validPlayers.forEach((p) => {
          let n = Math.floor(Math.random() * 100) + 1;
          while (usedNums.has(n)) {
            n = Math.floor(Math.random() * 100) + 1;
          }
          usedNums.add(n);
          numbers[p.id] = n;
        });
        const state: ItoGameState = {
          phase: 'ordering',
          themeId: theme.id,
          numbers,
          clues: {},
          orderedPlayerIds: pIds,
        };
        return state;
      }

      case 'wordbomb': {
        const ch = WORD_BOMB_CHALLENGES[Math.floor(Math.random() * WORD_BOMB_CHALLENGES.length)];
        const firstHolder = validPlayers[Math.floor(Math.random() * validPlayers.length)];
        const state: WordBombGameState = {
          phase: 'ticking',
          challengeId: ch.id,
          holderPlayerId: firstHolder.id,
          usedWords: [],
          turnStartedAt: Date.now(),
        };
        return state;
      }

      case 'taboo': {
        const firstCard = TABOO_CARDS[Math.floor(Math.random() * TABOO_CARDS.length)];
        const describer = validPlayers[0];
        const watcher = validPlayers[1] || describer;
        const state: TabooGameState = {
          phase: 'ready',
          describerId: describer.id,
          watcherId: watcher.id,
          currentCardId: firstCard.id,
          usedCardIds: [firstCard.id],
          roundStartedAt: Date.now(),
          durationSec: 60,
          correctWords: [],
          buzzedWords: [],
          skippedCount: 0,
        };
        return state;
      }

      case 'dixit': {
        return buildDixitHands(pIds);
      }

      case 'witness': {
        const m = WITNESS_MONSTERS[Math.floor(Math.random() * WITNESS_MONSTERS.length)];
        const state: WitnessGameState = {
          phase: 'witness_ready',
          witnessId: validPlayers[0].id,
          monsterId: m.id,
          hints: [],
          drawings: {},
          votes: {},
        };
        return state;
      }

      case 'fakeartist': {
        const pr = FAKE_ARTIST_PROMPTS[Math.floor(Math.random() * FAKE_ARTIST_PROMPTS.length)];
        const fake = validPlayers[Math.floor(Math.random() * validPlayers.length)];
        const state: FakeArtistGameState = {
          phase: 'strokes',
          promptId: pr.id,
          fakeArtistId: fake.id,
          turnIndex: 0,
          strokes: [],
          votes: {},
        };
        return state;
      }

      case 'medium': {
        const pair = MEDIUM_WORD_PAIRS[Math.floor(Math.random() * MEDIUM_WORD_PAIRS.length)];
        const p1 = validPlayers[0];
        const p2 = validPlayers[1] || p1;
        const state: MediumGameState = {
          phase: 'submitting',
          player1Id: p1.id,
          player2Id: p2.id,
          word1: lang === 'ar' ? pair.w1_ar : pair.w1_en,
          word2: lang === 'ar' ? pair.w2_ar : pair.w2_en,
          attempt: 1,
          submissions: {},
          history: [],
        };
        return state;
      }

      case 'soclover': {
        return buildInitialSoCloverState(pIds);
      }

      case 'wits': {
        const wq = WITS_QUESTIONS[Math.floor(Math.random() * WITS_QUESTIONS.length)];
        const state: WitsGameState = {
          phase: 'guessing',
          questionId: wq.id,
          guesses: {},
          bets: {},
        };
        return state;
      }

      case 'insider': {
        const iw = INSIDER_WORDS[Math.floor(Math.random() * INSIDER_WORDS.length)];
        const judge = validPlayers[0];
        const nonJudges = validPlayers.length > 1 ? validPlayers.slice(1) : validPlayers;
        const ins = nonJudges[Math.floor(Math.random() * nonJudges.length)];
        const state: InsiderGameState = {
          phase: 'role_peek',
          wordId: iw.id,
          judgeId: judge.id,
          insiderId: ins.id,
          startedAt: Date.now(),
          durationSec: 120,
          questions: [],
          votes: {},
        };
        return state;
      }

      case 'decrypto': {
        return buildInitialDecryptoState(pIds);
      }

      case 'cockroach': {
        const sPlayer = validPlayers[0];
        const tPlayer = validPlayers[1] || sPlayer;
        const state: CockroachGameState = {
          phase: 'choose_claim',
          senderId: sPlayer.id,
          targetId: tPlayer.id,
          trueCritter: randomCritter(),
          seenByIds: [sPlayer.id],
          penalties: {},
        };
        return state;
      }

      case 'themind': {
        return buildInitialTheMindState(pIds);
      }

      case 'skull': {
        return buildInitialSkullState(validPlayers);
      }

      case 'sheriff': {
        return buildInitialSheriffState(validPlayers);
      }

      case 'cashnguns': {
        return buildInitialCashNGunsState(validPlayers);
      }

      case 'onenight': {
        return buildInitialOneNightState(validPlayers);
      }

      case 'resistance': {
        return buildInitialResistanceState(validPlayers);
      }

      case 'artauction': {
        return buildInitialArtAuctionState(validPlayers);
      }

      case 'alibi': {
        return buildInitialAlibiState(validPlayers);
      }

      case 'splitsteal': {
        return buildInitialSplitStealState(validPlayers);
      }

      case 'boomdeck': {
        return buildInitialBoomDeckState(validPlayers);
      }

      case 'wavelength':
      default:
        return {
          wavelength_guesses: {},
          wavelength_points: {},
        };
    }
  };

  // Create Online Room
  const handleCreateRoom = async () => {
    const validName = ensurePlayerIdentity();
    if (!validName) return;

    setLoading(true);
    setErrorMsg(null);
    try {
      const code = generateRoomCode();
      const firstCard = pickNextCard();
      const initialTarget = generateRandomTargetAngle();

      const { data: roomData, error: roomErr } = await supabase
        .from('wavelength_rooms')
        .insert({
          code,
          host_id: playerId,
          mode: 'coop',
          language: lang,
          status: 'lobby',
          round_number: 1,
          max_rounds: 7,
          psychic_id: playerId,
          active_team: 'A',
          target_angle: initialTarget,
          dial_angle: 0,
          clue: '',
          card_left_ar: firstCard.left_ar,
          card_right_ar: firstCard.right_ar,
          card_left_en: firstCard.left_en,
          card_right_en: firstCard.right_en,
          card_category: firstCard.category,
          used_card_indices: [firstCard.id],
          custom_cards: [],
          selected_game: homeSelectedGame,
          game_data: {},
        })
        .select('*')
        .single();

      if (roomErr || !roomData) throw roomErr || new Error('Failed to create room');

      const { error: playerErr } = await supabase.from('wavelength_players').upsert({
        room_id: roomData.id,
        id: playerId,
        name: validName,
        avatar_color: playerColor,
        team: 'A',
        score: 0,
        is_host: true,
      });

      if (playerErr) throw playerErr;

      const { data: roomPlayers } = await supabase
        .from('wavelength_players')
        .select('*')
        .eq('room_id', roomData.id)
        .order('joined_at', { ascending: true });

      setIsPassAndPlay(false);
      setRoom(roomData as RoomState);
      setPlayers((roomPlayers as PlayerItem[]) || []);
      window.history.replaceState({}, '', `?room=${code}`);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error creating room');
    } finally {
      setLoading(false);
    }
  };

  // Join Online Room
  const handleJoinRoom = async (e?: React.FormEvent, codeOverride?: string) => {
    if (e) e.preventDefault();
    const validName = ensurePlayerIdentity();
    if (!validName) return;

    const cleanCode = (codeOverride ?? joinCodeInput).trim().toUpperCase();
    if (!cleanCode) {
      setErrorMsg(lang === 'ar' ? 'اكتب كود الغرفة بالأول!' : 'Please enter a room code!');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      const { data: roomData, error: roomErr } = await supabase
        .from('wavelength_rooms')
        .select('*')
        .eq('code', cleanCode)
        .single();

      if (roomErr || !roomData) {
        setErrorMsg(
          lang === 'ar'
            ? 'ما لقينا غرفة بهاد الكود! تأكد من الأحرف.'
            : 'Room not found! Check the code.'
        );
        setLoading(false);
        return;
      }

      const { data: existingPlayers } = await supabase
        .from('wavelength_players')
        .select('*')
        .eq('room_id', roomData.id)
        .order('joined_at', { ascending: true });

      const list = (existingPlayers as PlayerItem[]) || [];
      // Coming back through the link (a refresh, a dropped connection) keeps your team and score
      const returning = list.find((p) => p.id === playerId);
      const countA = list.filter((p) => p.team === 'A').length;
      const countB = list.filter((p) => p.team === 'B').length;
      const assignedTeam: 'A' | 'B' = returning?.team || (countA <= countB ? 'A' : 'B');

      await supabase.from('wavelength_players').upsert({
        room_id: roomData.id,
        id: playerId,
        name: validName,
        avatar_color: playerColor,
        team: assignedTeam,
        score: returning?.score || 0,
        is_host: roomData.host_id === playerId,
      });

      const { data: updatedPlayers } = await supabase
        .from('wavelength_players')
        .select('*')
        .eq('room_id', roomData.id)
        .order('joined_at', { ascending: true });

      setIsPassAndPlay(false);
      setRoom(roomData as RoomState);
      setPlayers((updatedPlayers as PlayerItem[]) || []);
      setInviteCode(null);
      window.history.replaceState({}, '', `?room=${cleanCode}`);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to join room');
    } finally {
      setLoading(false);
    }
  };

  // Start Pass & Play (Local Same-Device Mode)
  const handleStartPassAndPlay = () => {
    const firstCard = pickNextCard();
    const initialTarget = generateRandomTargetAngle();
    const p1Name = playerName.trim() || (lang === 'ar' ? 'اللاعب 1' : 'Player 1');
    const p2Name = lang === 'ar' ? 'اللاعب 2' : 'Player 2';
    const p3Name = lang === 'ar' ? 'اللاعب 3' : 'Player 3';
    const initialLocalPlayers: PlayerItem[] = [
      {
        id: playerId,
        room_id: 'local_room',
        name: p1Name,
        avatar_color: playerColor,
        team: 'A',
        score: 0,
        is_host: true,
      },
      {
        id: 'local_p2',
        room_id: 'local_room',
        name: p2Name,
        avatar_color: '#00bbf9',
        team: 'B',
        score: 0,
        is_host: false,
      },
      {
        id: 'local_p3',
        room_id: 'local_room',
        name: p3Name,
        avatar_color: '#8ac926',
        team: 'A',
        score: 0,
        is_host: false,
      },
    ];
    const initGameData = buildInitialGameData(homeSelectedGame, initialLocalPlayers);
    setIsPassAndPlay(true);
    setPlayers(initialLocalPlayers);
    setLocalPeekTarget(false);
    setPsychicCurtainOpen(homeSelectedGame === 'wavelength');
    setClueInput('');
    setLiveDialAngle(0);
    setRoom({
      id: 'local_room',
      code: 'LOCAL',
      host_id: playerId,
      mode: 'coop',
      language: lang,
      status: homeSelectedGame === 'wavelength' ? 'psychic_clue' : 'guessing',
      round_number: 1,
      max_rounds: 7,
      psychic_id: initialLocalPlayers[0].id,
      active_team: 'A',
      target_angle: initialTarget,
      dial_angle: 0,
      clue: '',
      card_left_ar: firstCard.left_ar,
      card_right_ar: firstCard.right_ar,
      card_left_en: firstCard.left_en,
      card_right_en: firstCard.right_en,
      card_category: firstCard.category,
      other_team_guess: null,
      coop_score: 0,
      team_a_score: 0,
      team_b_score: 0,
      last_round_points: 0,
      last_bonus_points: 0,
      used_card_indices: [firstCard.id],
      custom_cards: [],
      selected_game: homeSelectedGame,
      game_data: initGameData,
    });
  };

  const handleAddLocalPlayer = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = localNewPlayerName.trim();
    if (!trimmed) return;
    const nextColor =
      CARTOON_AVATAR_COLORS[players.length % CARTOON_AVATAR_COLORS.length];
    const newP: PlayerItem = {
      id: 'local_' + Date.now().toString(36),
      room_id: 'local_room',
      name: trimmed,
      avatar_color: nextColor,
      team: players.length % 2 === 0 ? 'A' : 'B',
      score: 0,
      is_host: false,
    };
    setPlayers((prev) => [...prev, newP]);
    setLocalNewPlayerName('');
  };

  const handleLeaveRoom = async () => {
    if (room && !isPassAndPlay) {
      await supabase
        .from('wavelength_players')
        .delete()
        .eq('room_id', room.id)
        .eq('id', playerId);
    }
    setRoom(null);
    setPlayers([]);
    setIsPassAndPlay(false);
    window.history.replaceState({}, '', window.location.pathname);
  };

  const isHost = room ? room.host_id === playerId || isPassAndPlay : false;

  const handleKickPlayer = async (targetPlayerId: string) => {
    if (!room || !isHost || targetPlayerId === room.host_id) return;
    const remaining = players.filter((p) => p.id !== targetPlayerId);
    setPlayers(remaining);

    if (!isPassAndPlay) {
      if (channelRef.current) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'kick_player',
          payload: { kickedId: targetPlayerId },
        });
      }
      await supabase
        .from('wavelength_players')
        .delete()
        .eq('room_id', room.id)
        .eq('id', targetPlayerId);
    }

    if (room.psychic_id === targetPlayerId && remaining.length > 0) {
      const sameTeam =
        room.mode === 'teams' ? remaining.find((p) => p.team === room.active_team) : undefined;
      await updateRoomState({ psychic_id: (sameTeam || remaining[0]).id });
    }
  };

  // Writes only land on the room version we last saw. If another player wrote first, we
  // fetch their version, replay our change on top of it (game_data merges key by key so two
  // votes at once both survive), and try again
  const updateRoomState = async (patch: Partial<RoomState>) => {
    if (!room) return;
    setRoom((prev) => (prev ? { ...prev, ...patch } : null));
    if (isPassAndPlay) return;

    // `room` is the state this screen showed when the player acted: the base of their change
    const base = room;
    let toWrite: Partial<RoomState> = patch;
    let knownStamp = roomRef.current?.updated_at ?? base.updated_at ?? null;
    pendingRoomWritesRef.current += 1;
    try {
      for (let attempt = 0; attempt < 6; attempt++) {
        const stamp = makeRoomStamp();
        let query = supabase
          .from('wavelength_rooms')
          .update({ ...toWrite, updated_at: stamp })
          .eq('id', base.id);
        query = knownStamp ? query.eq('updated_at', knownStamp) : query.is('updated_at', null);
        const { data: written, error } = await query.select('id');
        if (error) {
          console.error('Room update failed', error);
          return;
        }
        if (written && written.length > 0) {
          awaitingEchoRef.current = stamp;
          setRoom((prev) => (prev && prev.id === base.id ? { ...prev, updated_at: stamp } : prev));
          if (echoTimerRef.current) clearTimeout(echoTimerRef.current);
          echoTimerRef.current = setTimeout(() => {
            // The echo never came (dropped event): read the room directly instead
            if (awaitingEchoRef.current === stamp) resyncRoom(base.id);
          }, 2500);
          return;
        }

        const { data: latest } = await supabase
          .from('wavelength_rooms')
          .select('*')
          .eq('id', base.id)
          .maybeSingle();
        if (!latest) return;
        const latestRoom = latest as RoomState;
        toWrite = { ...patch };
        if ('game_data' in patch) {
          toWrite.game_data = mergeJson(base.game_data, patch.game_data, latestRoom.game_data);
        }
        knownStamp = latestRoom.updated_at ?? null;
        setRoom({ ...latestRoom, ...toWrite });
      }
      console.error('Room update gave up after repeated conflicts');
      resyncRoom(base.id);
    } finally {
      pendingRoomWritesRef.current -= 1;
    }
  };

  const handleSwitchTeam = async (newTeam: 'A' | 'B') => {
    if (!room || isPassAndPlay) return;
    setPlayers((prev) =>
      prev.map((p) => (p.id === playerId ? { ...p, team: newTeam } : p))
    );
    await supabase
      .from('wavelength_players')
      .update({ team: newTeam })
      .eq('room_id', room.id)
      .eq('id', playerId);
  };

  const handleStartOnlineGame = async () => {
    if (!room) return;
    const activeGame = room.selected_game || 'wavelength';
    const card = pickNextCard([], room.custom_cards);
    const target = generateRandomTargetAngle();
    // In teams mode the first psychic comes from team A, so the guessing team matches them
    const firstPsychicPlayer =
      (room.mode === 'teams' && players.find((p) => p.team === 'A')) || players[0];
    const firstPsychic = firstPsychicPlayer?.id || playerId;
    const firstTeam: 'A' | 'B' = room.mode === 'teams' ? firstPsychicPlayer?.team || 'A' : 'A';
    const initGameData = buildInitialGameData(activeGame, players);
    setClueInput('');
    setPlayers((prev) => prev.map((p) => ({ ...p, score: 0 })));
    if (!isPassAndPlay) {
      await supabase
        .from('wavelength_players')
        .update({ score: 0 })
        .eq('room_id', room.id);
    }
    await updateRoomState({
      selected_game: activeGame,
      game_data: initGameData,
      status: activeGame === 'wavelength' ? 'psychic_clue' : 'guessing',
      round_number: 1,
      psychic_id: firstPsychic,
      active_team: firstTeam,
      target_angle: target,
      dial_angle: 0,
      clue: '',
      card_left_ar: card.left_ar,
      card_right_ar: card.right_ar,
      card_left_en: card.left_en,
      card_right_en: card.right_en,
      card_category: card.category,
      other_team_guess: null,
      coop_score: 0,
      team_a_score: 0,
      team_b_score: 0,
      last_round_points: 0,
      last_bonus_points: 0,
      used_card_indices: [card.id],
    });
  };

  const handleSwapCard = async () => {
    if (!room) return;
    const nextCard = pickNextCard(room.used_card_indices, room.custom_cards);
    const nextTarget = generateRandomTargetAngle();
    await updateRoomState({
      target_angle: nextTarget,
      card_left_ar: nextCard.left_ar,
      card_right_ar: nextCard.right_ar,
      card_left_en: nextCard.left_en,
      card_right_en: nextCard.right_en,
      card_category: nextCard.category,
      used_card_indices: [...(room.used_card_indices || []), nextCard.id],
    });
  };

  const handleAddCustomCard = async (leftText: string, rightText: string) => {
    if (!room) return;
    const newCard: SpectrumCardItem = {
      id: Date.now(),
      left_ar: leftText,
      right_ar: rightText,
      left_en: leftText,
      right_en: rightText,
      category: 'general',
    };
    const updatedCustom = [newCard, ...(room.custom_cards || [])];
    if (room.status === 'psychic_clue') {
      await updateRoomState({
        custom_cards: updatedCustom,
        card_left_ar: newCard.left_ar,
        card_right_ar: newCard.right_ar,
        card_left_en: newCard.left_en,
        card_right_en: newCard.right_en,
      });
    } else {
      await updateRoomState({ custom_cards: updatedCustom });
    }
  };

  const handleSubmitClue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!room || !clueInput.trim()) return;
    setLocalPeekTarget(false);
    await updateRoomState({
      clue: clueInput.trim(),
      status: 'guessing',
      dial_angle: 0,
      game_data: {
        ...(room.game_data || {}),
        wavelength_guesses: {},
        wavelength_points: {},
      },
    });
    setClueInput('');
  };

  const handleDialChange = async (newAngle: number, isFinal = false) => {
    setLiveDialAngle(newAngle);
    if (!room) return;

    if (room.mode === 'teams') {
      const now = Date.now();
      if (!isPassAndPlay && channelRef.current && now - lastBroadcastRef.current > 40) {
        lastBroadcastRef.current = now;
        channelRef.current.send({
          type: 'broadcast',
          event: 'dial_move',
          payload: { angle: newAngle, senderId: playerId },
        });
      }

      if (isFinal) {
        await updateRoomState({ dial_angle: newAngle });
      }
    }
  };

  const handleLockGuess = async () => {
    if (!room) return;
    if (room.mode === 'teams' && !isPassAndPlay) {
      await updateRoomState({
        dial_angle: liveDialAngle,
        status: 'left_right',
      });
      return;
    }

    const expectedGuessers =
      players.length > 1
        ? players.filter((p) => p.id !== room.psychic_id)
        : players;

    const currentGuesses: Record<string, number> = {
      ...(room.game_data?.wavelength_guesses || {}),
    };

    if (isPassAndPlay) {
      const nextLocalGuesser =
        expectedGuessers.find((p) => currentGuesses[p.id] === undefined) ||
        expectedGuessers[0];
      if (nextLocalGuesser) {
        currentGuesses[nextLocalGuesser.id] = liveDialAngle;
      }
      setLiveDialAngle(0);
    } else {
      currentGuesses[playerId] = liveDialAngle;
    }

    const allGuessed = expectedGuessers.every(
      (p) => typeof currentGuesses[p.id] === 'number'
    );

    if (allGuessed) {
      await performMultiPlayerReveal(currentGuesses);
    } else {
      await updateRoomState({
        game_data: {
          ...(room.game_data || {}),
          wavelength_guesses: currentGuesses,
        },
      });
    }
  };

  const performMultiPlayerReveal = async (allGuesses: Record<string, number>) => {
    if (!room) return;
    const perPlayerPoints: Record<string, number> = {};
    let bestPoints = 0;
    let sumPoints = 0;

    Object.entries(allGuesses).forEach(([pid, guessedAngle]) => {
      const pts = calculateScoreFromAngles(Number(room.target_angle), Number(guessedAngle));
      perPlayerPoints[pid] = pts;
      sumPoints += pts;
      if (pts > bestPoints) bestPoints = pts;
    });

    if (room.psychic_id && players.length > 1) {
      perPlayerPoints[room.psychic_id] = bestPoints;
    }

    const updatedPlayers = players.map((p) => {
      const earned = perPlayerPoints[p.id] || 0;
      return earned > 0 ? { ...p, score: (p.score || 0) + earned } : p;
    });
    setPlayers(updatedPlayers);

    if (!isPassAndPlay) {
      for (const [pid, earned] of Object.entries(perPlayerPoints)) {
        if (earned > 0) {
          const targetP = updatedPlayers.find((item) => item.id === pid);
          if (targetP) {
            await supabase
              .from('wavelength_players')
              .update({ score: targetP.score })
              .eq('room_id', room.id)
              .eq('id', pid);
          }
        }
      }
    }

    await updateRoomState({
      status: 'reveal',
      last_round_points: bestPoints,
      coop_score: room.coop_score + sumPoints,
      game_data: {
        ...(room.game_data || {}),
        wavelength_guesses: allGuesses,
        wavelength_points: perPlayerPoints,
      },
    });
  };

  const handleOtherTeamGuess = async (direction: 'left' | 'right') => {
    if (!room) return;
    await performReveal(liveDialAngle, direction);
  };

  const performReveal = async (finalDialAngle: number, sideGuess: 'left' | 'right' | null) => {
    if (!room) return;
    const pts = calculateScoreFromAngles(Number(room.target_angle), finalDialAngle);
    let bonus = 0;
    if (room.mode === 'teams' && sideGuess && pts < 4) {
      const targetIsLeftOfDial = Number(room.target_angle) < finalDialAngle;
      if ((sideGuess === 'left' && targetIsLeftOfDial) || (sideGuess === 'right' && !targetIsLeftOfDial)) {
        bonus = 1;
      }
    }

    const nextCoopScore = room.coop_score + pts;
    const nextTeamAScore =
      room.team_a_score + (room.active_team === 'A' ? pts : bonus);
    const nextTeamBScore =
      room.team_b_score + (room.active_team === 'B' ? pts : bonus);

    if (pts > 0) {
      // The guessing team earned these points, not whoever called left/right
      const winnerIds = new Set<string>(
        players.filter((p) => p.team === room.active_team).map((p) => p.id)
      );
      if (room.psychic_id) winnerIds.add(room.psychic_id);

      const updatedPlayers = players.map((p) =>
        winnerIds.has(p.id) ? { ...p, score: (p.score || 0) + pts } : p
      );
      setPlayers(updatedPlayers);

      if (!isPassAndPlay) {
        for (const wid of winnerIds) {
          const targetPlayer = updatedPlayers.find((p) => p.id === wid);
          if (targetPlayer) {
            await supabase
              .from('wavelength_players')
              .update({ score: targetPlayer.score })
              .eq('room_id', room.id)
              .eq('id', wid);
          }
        }
      }
    }

    await updateRoomState({
      dial_angle: finalDialAngle,
      other_team_guess: sideGuess,
      status: 'reveal',
      last_round_points: pts,
      last_bonus_points: bonus,
      coop_score: nextCoopScore,
      team_a_score: nextTeamAScore,
      team_b_score: nextTeamBScore,
    });
  };

  // Who gives the clue next round: the other team's turn in teams mode, everyone in turn otherwise
  const getNextPsychicId = (current: RoomState): string | null => {
    if (players.length === 0) return null;
    const nextTeam: 'A' | 'B' = current.active_team === 'A' ? 'B' : 'A';
    const candidatePool =
      current.mode === 'teams' ? players.filter((p) => p.team === nextTeam) : players;
    const pool = candidatePool.length > 0 ? candidatePool : players;
    let nextIdx: number;
    if (current.mode === 'teams') {
      // Each team gives a clue every other round, so walk through its members in turn
      nextIdx = Math.floor(current.round_number / 2) % pool.length;
    } else {
      const currentIdx = pool.findIndex((p) => p.id === current.psychic_id);
      nextIdx = (currentIdx + 1) % pool.length;
    }
    return pool[nextIdx].id;
  };

  const handleNextRound = async () => {
    if (!room) return;
    if (room.round_number >= room.max_rounds) {
      await updateRoomState({ status: 'finished' });
      confetti({ particleCount: 140, spread: 100, origin: { y: 0.5 } });
      return;
    }

    const nextCard = pickNextCard(room.used_card_indices, room.custom_cards);
    const nextTarget = generateRandomTargetAngle();
    const nextTeam: 'A' | 'B' = room.active_team === 'A' ? 'B' : 'A';

    const nextPsychicId = getNextPsychicId(room) || playerId;

    setClueInput('');
    setLocalPeekTarget(!isPassAndPlay);
    setPsychicCurtainOpen(isPassAndPlay);
    setLiveDialAngle(0);

    await updateRoomState({
      status: 'psychic_clue',
      round_number: room.round_number + 1,
      psychic_id: nextPsychicId,
      active_team: nextTeam,
      target_angle: nextTarget,
      dial_angle: 0,
      clue: '',
      other_team_guess: null,
      last_round_points: 0,
      last_bonus_points: 0,
      card_left_ar: nextCard.left_ar,
      card_right_ar: nextCard.right_ar,
      card_left_en: nextCard.left_en,
      card_right_en: nextCard.right_en,
      card_category: nextCard.category,
      used_card_indices: [...(room.used_card_indices || []), nextCard.id],
    });
  };

  // Switch active Party Game inside the same Room!
  const handleSelectPartyGame = async (gameId: PartyGameId) => {
    if (!room) return;
    const initialData = buildInitialGameData(gameId, players);
    if (gameId === 'wavelength') {
      const card = pickNextCard(room.used_card_indices, room.custom_cards);
      const target = generateRandomTargetAngle();
      await updateRoomState({
        selected_game: 'wavelength',
        status: room.status === 'lobby' ? 'lobby' : 'psychic_clue',
        target_angle: target,
        dial_angle: 0,
        clue: '',
        card_left_ar: card.left_ar,
        card_right_ar: card.right_ar,
        card_left_en: card.left_en,
        card_right_en: card.right_en,
        game_data: initialData,
      });
    } else {
      await updateRoomState({
        selected_game: gameId,
        status: room.status === 'lobby' ? 'lobby' : 'guessing',
        game_data: initialData,
      });
    }
  };

  const handleUpdateMiniGameData = async (
    nextData: any,
    scoreAwards?: Record<string, number>
  ) => {
    if (!room) return;
    let bonusTotal = 0;

    if (scoreAwards && Object.keys(scoreAwards).length > 0) {
      confetti({ particleCount: 75, spread: 70, origin: { y: 0.6 } });
      soundManager.playSfx('applause_win');
      const updatedPlayers = players.map((p) => {
        const add = scoreAwards[p.id] || 0;
        bonusTotal += add;
        return add > 0 ? { ...p, score: (p.score || 0) + add } : p;
      });
      setPlayers(updatedPlayers);

      if (!isPassAndPlay) {
        for (const [pid, ptsToAdd] of Object.entries(scoreAwards)) {
          if (ptsToAdd > 0) {
            const targetP = updatedPlayers.find((item) => item.id === pid);
            if (targetP) {
              await supabase
                .from('wavelength_players')
                .update({ score: targetP.score })
                .eq('room_id', room.id)
                .eq('id', pid);
            }
          }
        }
      }
    }

    await updateRoomState({
      game_data: nextData,
      coop_score: room.coop_score + bonusTotal,
    });
  };

  const sendCartoonReaction = (reactionType: ReactionType) => {
    const sender = playerName || 'Player';
    soundManager.playSfx('ui_pop');
    spawnReaction(reactionType, sender);
    if (channelRef.current && !isPassAndPlay) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'reaction',
        payload: { reactionType, senderName: sender },
      });
    }
  };

  const copyInviteLink = () => {
    if (!room) return;
    const isLocalHost =
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      window.location.hostname.startsWith('192.168.');
    const baseOrigin = isLocalHost
      ? 'https://wavelength-game-ecru.vercel.app'
      : `${window.location.origin}${window.location.pathname.replace(/\/$/, '')}`;
    const url = `${baseOrigin}/?room=${room.code}`;
    navigator.clipboard.writeText(url);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const isPsychic = room ? (isPassAndPlay ? true : room.psychic_id === playerId) : false;
  const psychicPlayer = players.find((p) => p.id === room?.psychic_id);
  const nextPsychicIdPreview = room ? getNextPsychicId(room) : null;
  const myPlayer = players.find((p) => p.id === playerId);

  const shouldShowTarget = (() => {
    if (!room) return false;
    if (room.status === 'reveal' || room.status === 'finished') return true;
    if (room.status === 'psychic_clue' && isPsychic) {
      return localPeekTarget && !psychicCurtainOpen;
    }
    return false;
  })();

  const canDragDial = (() => {
    if (!room) return false;
    if (room.status !== 'guessing') return false;
    if (isPassAndPlay) return true;
    if (isPsychic && players.length > 1) return false;
    if (room.mode === 'teams' && myPlayer && myPlayer.team !== room.active_team) {
      return false;
    }
    return true;
  })();

  const isOnRivalTeam =
    !!room && room.mode === 'teams' && !!myPlayer && myPlayer.team !== room.active_team;
  // Only the team that isn't guessing calls left/right (anyone can on a shared device)
  const canCallLeftRight = isPassAndPlay || !room || room.mode !== 'teams' || !myPlayer || isOnRivalTeam;
  const activeTeamName = room?.active_team === 'B' ? t.teamB : t.teamA;
  const rivalTeamName = room?.active_team === 'B' ? t.teamA : t.teamB;

  const leftCardText = room
    ? lang === 'ar'
      ? room.card_left_ar
      : room.card_left_en
    : '';
  const rightCardText = room
    ? lang === 'ar'
      ? room.card_right_ar
      : room.card_right_en
    : '';

  const activeGameId: PartyGameId = room?.selected_game || 'wavelength';
  const isImmersiveTable =
    activeGameId === 'boomdeck';
  const activeGameMeta =
    PARTY_GAMES_CATALOG.find((g) => g.id === activeGameId) || PARTY_GAMES_CATALOG[0];

  // Sync Background Music Track with Active Game or Home Selected Game
  useEffect(() => {
    soundManager.setGameContext(room ? activeGameId : homeSelectedGame);
  }, [room?.id, activeGameId, homeSelectedGame]);

  // Automatically trigger real studio-recorded Foley SFX across all 27 games whenever `room.game_data` updates!
  const prevGameDataRef = useRef<any>(null);
  useEffect(() => {
    if (!room || room.status === 'lobby') {
      prevGameDataRef.current = room?.game_data || null;
      return;
    }
    if (prevGameDataRef.current && room.game_data && prevGameDataRef.current !== room.game_data) {
      soundManager.playGameDataTransitionSfx(
        activeGameId,
        prevGameDataRef.current,
        room.game_data
      );
    }
    prevGameDataRef.current = room.game_data;
  }, [room?.game_data, activeGameId, room?.status]);

  const wavelengthGuesses: Record<string, number> =
    room?.game_data?.wavelength_guesses || {};
  const wavelengthPoints: Record<string, number> =
    room?.game_data?.wavelength_points || {};
  const expectedWavelengthGuessers =
    room && players.length > 1
      ? players.filter((p) => p.id !== room.psychic_id)
      : players;
  const hasLockedMyGuess =
    !isPassAndPlay && typeof wavelengthGuesses[playerId] === 'number';
  const nextPassAndPlayGuesser = isPassAndPlay
    ? expectedWavelengthGuessers.find(
        (p) => typeof wavelengthGuesses[p.id] !== 'number'
      ) || expectedWavelengthGuessers[0]
    : null;
  const wheelPlayerPins = Object.entries(wavelengthGuesses).map(([pid, angle]) => {
    const p = players.find((item) => item.id === pid);
    return {
      id: pid,
      name: p?.name || '?',
      color: p?.avatar_color || '#ffca3a',
      angle: Number(angle),
    };
  });

  return (
    <div className="min-h-[100dvh] flex flex-col justify-between pb-8 relative">
      {/* Floating Live Vector Reactions */}
      <div className="fixed inset-0 pointer-events-none z-40 overflow-hidden">
        {reactions.map((r) => (
          <div
            key={r.id}
            style={{ left: `${r.x}%` }}
            className="absolute bottom-16 animate-bounce flex flex-col items-center"
          >
            <div className="drop-shadow-[0_4px_0_#161426]">
              <ReactionSvgIcon type={r.reactionType} className="w-11 h-11" />
            </div>
            {r.sender && (
              <span className="text-xs font-extrabold bg-[#161426] text-[#ffca3a] px-2.5 py-0.5 rounded-full border-2 border-white mt-0.5">
                {r.sender}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Top Cartoon Header Bar (Hidden in Immersive Fullscreen Board/Tabletop Mode to maximize vertical space!) */}
      {/* During a game the game bar is the only header, so the table gets the screen */}
      {!(room && room.status !== 'lobby' && room.status !== 'finished') && (
        <header className="w-full max-w-7xl mx-auto px-4 pt-4 pb-2 flex items-center justify-between gap-2">
          <div
            onClick={() => {
              if (room) handleLeaveRoom();
            }}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-12 h-12 shrink-0 rounded-2xl bg-[#ff595e] border-4 border-[#161426] shadow-[0_5px_0_#161426] flex items-center justify-center -rotate-3 group-hover:rotate-3 transition-transform">
              {/* Sahra (late-night hangout) mark: crescent and star */}
              <svg viewBox="0 0 64 64" className="w-9 h-9" aria-hidden="true">
                <path
                  d="M37 7a26 26 0 1 0 20 39A22 22 0 0 1 37 7z"
                  fill="#ffca3a"
                  stroke="#161426"
                  strokeWidth="5"
                  strokeLinejoin="round"
                />
                <path
                  d="M47 15l2.8 6.2 6.7.8-5 4.5 1.4 6.6-5.9-3.4-5.9 3.4 1.4-6.6-5-4.5 6.7-.8z"
                  fill="#fff9ec"
                  stroke="#161426"
                  strokeWidth="3"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className={room ? 'hidden sm:block' : ''}>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[#fff9ec] drop-shadow-[0_3px_0_#161426] leading-none whitespace-nowrap">
                {t.appTitle}
              </h1>
              <span className="text-sm font-bold text-[#ffca3a] hidden sm:block mt-1">
                {t.appSubtitle}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <AudioControlPanel lang={lang} />

            {room && (
              <button
                type="button"
                onClick={() => openHowToPlayFor(activeGameId)}
                className="cartoon-btn bg-[#ffca3a] text-[#161426] px-3.5 py-2 text-sm md:text-base flex items-center gap-1.5"
              >
                <Question weight="fill" className="w-5 h-5" />
                <span className="hidden sm:inline">{t.howToPlay}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
              className="cartoon-btn bg-[#00bbf9] text-[#161426] px-3.5 py-2 text-sm md:text-base flex items-center gap-1.5"
            >
              <Globe weight="bold" className="w-5 h-5" />
              <span className={room ? 'hidden sm:inline' : 'hidden min-[400px]:inline'}>{t.langToggle}</span>
            </button>

            {room && (
              <button
                type="button"
                onClick={handleLeaveRoom}
                className="cartoon-btn bg-[#ff595e] text-white px-3 py-2 text-sm md:text-base flex items-center gap-1"
                title={t.leaveRoom}
              >
                <SignOut weight="bold" className="w-5 h-5" />
                <span className="hidden sm:inline">{t.leaveRoom}</span>
              </button>
            )}
          </div>
        </header>
      )}

      {/* MAIN CONTENT */}
      <main
        className={`w-full ${
          room &&
          room.status !== 'lobby' &&
          room.status !== 'finished' &&
          activeGameId === 'boomdeck'
            ? 'max-w-[1680px] px-2 sm:px-4 my-1.5'
            : 'max-w-7xl px-4 my-3'
        } mx-auto flex-1 flex flex-col ${
          !room || room.status === 'lobby' || room.status === 'finished'
            ? 'justify-center'
            : 'justify-start'
        } [overflow-anchor:none]`}
      >
        {!room && inviteCode ? (
          <InviteJoinCard
            lang={lang}
            code={inviteCode}
            playerName={playerName}
            onPlayerNameChange={setPlayerName}
            playerColor={playerColor}
            onPlayerColorChange={(c) => {
              setPlayerColor(c);
              setLocalPlayerColor(c);
            }}
            loading={loading}
            errorMsg={errorMsg}
            onJoin={() => handleJoinRoom(undefined, inviteCode)}
            onGoHome={() => {
              setInviteCode(null);
              setErrorMsg(null);
              window.history.replaceState({}, '', window.location.pathname);
            }}
          />
        ) : !room ? (
          /* ================= ARCADE HUB HOME PAGE ================= */
          <HomePage
            lang={lang}
            selectedGame={homeSelectedGame}
            onSelectGame={setHomeSelectedGame}
            onOpenGuide={openHowToPlayFor}
            playerName={playerName}
            onPlayerNameChange={setPlayerName}
            playerColor={playerColor}
            onPlayerColorChange={(c) => {
              setPlayerColor(c);
              setLocalPlayerColor(c);
            }}
            joinCode={joinCodeInput}
            onJoinCodeChange={setJoinCodeInput}
            loading={loading}
            errorMsg={errorMsg}
            onCreateRoom={handleCreateRoom}
            onJoinRoom={handleJoinRoom}
            onPassAndPlay={handleStartPassAndPlay}
          />
        ) : room.status === 'lobby' ? (
          /* ================= ONLINE ROOM LOBBY ================= */
          <div className="max-w-4xl mx-auto w-full space-y-5 my-auto">
            {/* Room Code Banner */}
            <div className="cartoon-card p-6 text-center relative overflow-hidden">
              <div className="inline-block cartoon-badge bg-[#ffca3a] text-[#161426] px-4 py-1 text-sm mb-2">
                {t.roomCodeLabel}
              </div>
              <div
                dir="ltr"
                className="text-5xl md:text-6xl font-extrabold tracking-widest text-[#161426] my-1 select-all"
              >
                {room.code}
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3 mt-4">
                <button
                  type="button"
                  onClick={copyInviteLink}
                  className="cartoon-btn bg-[#00bbf9] text-[#161426] px-5 py-2.5 flex items-center gap-2 text-base"
                >
                  {copiedCode ? (
                    <>
                      <Check weight="bold" className="w-5 h-5" />
                      <span>{t.copied}</span>
                    </>
                  ) : (
                    <>
                      <Copy weight="bold" className="w-5 h-5" />
                      <span>{t.copyLink}</span>
                    </>
                  )}
                </button>

                {activeGameId === 'wavelength' && (
                  <button
                    type="button"
                    onClick={() => setShowCustomCardModal(true)}
                    className="cartoon-btn bg-[#ff924c] text-[#161426] px-4 py-2.5 flex items-center gap-1.5 text-base"
                  >
                    <Plus weight="bold" className="w-5 h-5" />
                    <span>{t.addCustomCard}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Game Settings & Players Grid */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
              {/* Players List */}
              <div className="md:col-span-7 cartoon-panel-dark p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Users weight="fill" className="w-6 h-6 text-[#ffca3a]" />
                    <h3 className="text-xl font-extrabold">
                      {t.playersInRoom} ({players.length})
                    </h3>
                  </div>

                  {activeGameId === 'wavelength' && room.mode === 'teams' && (
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleSwitchTeam('A')}
                        className={`cartoon-badge px-3 py-1 text-xs cursor-pointer ${
                          myPlayer?.team === 'A'
                            ? 'bg-[#ff924c] text-[#161426]'
                            : 'bg-[#191636] text-white'
                        }`}
                      >
                        {t.joinTeamA}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSwitchTeam('B')}
                        className={`cartoon-badge px-3 py-1 text-xs cursor-pointer ${
                          myPlayer?.team === 'B'
                            ? 'bg-[#00bbf9] text-[#161426]'
                            : 'bg-[#191636] text-white'
                        }`}
                      >
                        {t.joinTeamB}
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {players.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between p-3 rounded-2xl bg-[#191636] border-3 border-[#120f29] shadow-[0_4px_0_#120f29]"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          style={{ backgroundColor: p.avatar_color }}
                          className="w-10 h-10 rounded-full border-3 border-[#161426] flex items-center justify-center font-extrabold text-[#161426] text-lg shrink-0"
                        >
                          {p.name.slice(0, 1).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="font-extrabold text-base flex items-center gap-1.5 truncate">
                            <span className="truncate">{p.name}</span>
                            {p.id === room.host_id && (
                              <Crown weight="fill" className="w-4 h-4 text-[#ffca3a] shrink-0" />
                            )}
                          </div>
                          {activeGameId === 'wavelength' && room.mode === 'teams' && (
                            <span
                              className={`text-xs font-bold ${
                                p.team === 'A' ? 'text-[#ff924c]' : 'text-[#00bbf9]'
                              }`}
                            >
                              {p.team === 'A' ? t.teamA : t.teamB}
                            </span>
                          )}
                        </div>
                      </div>

                      {isHost && p.id !== room.host_id && (
                        <button
                          type="button"
                          onClick={() => handleKickPlayer(p.id)}
                          title={lang === 'ar' ? 'طرد اللاعب (Kick)' : 'Kick Player'}
                          className="cartoon-btn bg-[#ff595e] text-white p-2 text-xs flex items-center gap-1 shrink-0"
                        >
                          <UserMinus weight="bold" className="w-4 h-4" />
                          <span>{lang === 'ar' ? 'طرد' : 'Kick'}</span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Host Settings Panel */}
              <div className="md:col-span-5 cartoon-card p-5 flex flex-col justify-between space-y-4">
                <div className="space-y-4">
                  {/* Active Selected Game Ticket + Modal Picker Button */}
                  <div className="space-y-2">
                    <label className="block font-extrabold text-sm text-[#161426]">
                      {lang === 'ar' ? 'لعبة الغرفة الحالية:' : 'Selected Room Game:'}
                    </label>
                    <div
                      style={{ backgroundColor: activeGameMeta.bgTint }}
                      className="p-3.5 rounded-2xl border-3 border-[#161426] flex items-center gap-3"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-white border-3 border-[#161426] flex items-center justify-center shrink-0">
                        <PartyGameSvgIcon gameId={activeGameId} className="w-8 h-8" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-extrabold text-base text-[#161426]">
                          {lang === 'ar' ? activeGameMeta.name_ar : activeGameMeta.name_en}
                        </div>
                        <div className="text-xs font-bold text-[#3f3b5c]">
                          {lang === 'ar' ? activeGameMeta.desc_ar : activeGameMeta.desc_en}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => openHowToPlayFor(activeGameId)}
                      className="cartoon-btn bg-[#e0f2fe] text-[#161426] w-full py-2 px-4 text-xs sm:text-sm flex items-center justify-center gap-1.5"
                    >
                      <FilmStrip weight="fill" className="w-4 h-4 text-[#1982c4]" />
                      <span>
                        {lang === 'ar'
                          ? 'شاهد الشرح المتحرك لهذه اللعبة'
                          : 'Watch Animated Tutorial'}
                      </span>
                    </button>

                    {isHost && (
                      <button
                        type="button"
                        onClick={() => setShowGamePickerModal(true)}
                        className="cartoon-btn bg-[#ffca3a] text-[#161426] w-full py-2.5 px-4 text-sm flex items-center justify-center gap-2"
                      >
                        <SquaresFour weight="fill" className="w-5 h-5" />
                        <span>
                          {lang === 'ar'
                            ? `تغيير اللعبة (مكتبة الـ ${PARTY_GAMES_CATALOG.length} لعبة)`
                            : `Switch Game (Browse All ${PARTY_GAMES_CATALOG.length})`}
                        </span>
                      </button>
                    )}
                  </div>

                  {activeGameId === 'wavelength' && (
                    <>
                      <div>
                        <label className="block font-extrabold text-sm text-[#161426] mb-2">
                          {t.gameMode}
                        </label>
                        <div className="grid grid-cols-1 gap-2">
                          <button
                            type="button"
                            disabled={!isHost}
                            onClick={() => updateRoomState({ mode: 'coop' })}
                            className={`cartoon-btn py-2 px-3 text-sm flex items-center justify-between ${
                              room.mode === 'coop'
                                ? 'bg-[#ffca3a] text-[#161426]'
                                : 'bg-white text-[#161426]'
                            }`}
                          >
                            <span className="flex items-center gap-1.5">
                              <Sparkle weight="fill" className="w-4 h-4" />
                              <span>{t.coopMode}</span>
                            </span>
                            {room.mode === 'coop' && <Check weight="bold" className="w-5 h-5" />}
                          </button>

                          <button
                            type="button"
                            disabled={!isHost}
                            onClick={() => updateRoomState({ mode: 'teams' })}
                            className={`cartoon-btn py-2 px-3 text-sm flex items-center justify-between ${
                              room.mode === 'teams'
                                ? 'bg-[#ff924c] text-[#161426]'
                                : 'bg-white text-[#161426]'
                            }`}
                          >
                            <span className="flex items-center gap-1.5">
                              <Sword weight="fill" className="w-4 h-4" />
                              <span>{t.teamsMode}</span>
                            </span>
                            {room.mode === 'teams' && <Check weight="bold" className="w-5 h-5" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block font-extrabold text-sm text-[#161426] mb-2">
                          {t.roundsLabel}: {room.max_rounds}
                        </label>
                        <div className="flex gap-2">
                          {[5, 7, 10].map((rCount) => (
                            <button
                              key={rCount}
                              type="button"
                              disabled={!isHost}
                              onClick={() => updateRoomState({ max_rounds: rCount })}
                              className={`cartoon-btn flex-1 py-2 text-base ${
                                room.max_rounds === rCount
                                  ? 'bg-[#00bbf9] text-[#161426]'
                                  : 'bg-white text-[#161426]'
                              }`}
                            >
                              {rCount}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {isHost ? (
                  <button
                    type="button"
                    onClick={handleStartOnlineGame}
                    className="cartoon-btn w-full py-3.5 bg-[#8ac926] hover:bg-[#9be02f] text-[#161426] text-xl flex items-center justify-center gap-2"
                  >
                    <Play weight="fill" className="w-6 h-6" />
                    <span>{t.startGame}</span>
                  </button>
                ) : (
                  <div className="p-3 rounded-2xl bg-[#161426] text-[#ffca3a] text-center font-extrabold text-sm">
                    {t.waitingForHost}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : room.status === 'finished' ? (
          /* ================= GAME OVER SCREEN ================= */
          <div className="max-w-xl mx-auto w-full cartoon-card p-7 text-center space-y-5 my-auto">
            <div className="w-20 h-20 rounded-3xl bg-[#ffca3a] border-4 border-[#161426] shadow-[0_6px_0_#161426] flex items-center justify-center mx-auto">
              <Trophy weight="fill" className="w-12 h-12 text-[#161426]" />
            </div>

            <h2 className="text-3xl md:text-4xl font-extrabold text-[#161426]">{t.gameOver}</h2>

            {room.mode === 'coop' ? (
              <div className="p-5 rounded-3xl bg-[#191636] text-white border-4 border-[#161426]">
                <div className="text-sm font-bold text-[#ffca3a]">{t.totalScore}</div>
                <div className="text-5xl font-extrabold my-1">{room.coop_score}</div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-[#ff924c] text-[#161426] border-4 border-[#161426]">
                  <div className="font-extrabold text-sm">{t.teamA}</div>
                  <div className="text-4xl font-extrabold">{room.team_a_score}</div>
                </div>
                <div className="p-4 rounded-2xl bg-[#00bbf9] text-[#161426] border-4 border-[#161426]">
                  <div className="font-extrabold text-sm">{t.teamB}</div>
                  <div className="text-4xl font-extrabold">{room.team_b_score}</div>
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-3 justify-center pt-2">
              <button
                type="button"
                onClick={isPassAndPlay ? handleStartPassAndPlay : handleStartOnlineGame}
                className="cartoon-btn bg-[#8ac926] text-[#161426] px-6 py-3 text-lg flex items-center gap-2"
              >
                <ArrowCounterClockwise weight="bold" className="w-6 h-6" />
                <span>{t.playAgain}</span>
              </button>

              {(isHost || isPassAndPlay) && (
                <button
                  type="button"
                  onClick={() => setShowGamePickerModal(true)}
                  className="cartoon-btn bg-[#00bbf9] text-[#161426] px-6 py-3 text-lg flex items-center gap-2"
                >
                  <SquaresFour weight="fill" className="w-6 h-6" />
                  <span>{lang === 'ar' ? 'جربوا لعبة تانية!' : 'Switch Game!'}</span>
                </button>
              )}

              {!isPassAndPlay && (
                <button
                  type="button"
                  onClick={() => updateRoomState({ status: 'lobby' })}
                  className="cartoon-btn bg-[#ffca3a] text-[#161426] px-6 py-3 text-lg"
                >
                  {t.backToLobby}
                </button>
              )}
            </div>
          </div>
        ) : (
          /* ================= ACTIVE GAMEPLAY BOARD ================= */
          <div className="w-full space-y-3.5">
            {/* One compact bar: what we're playing on the start side, score/sound/menu on the end */}
            <div
              className={`flex items-center justify-between gap-2 bg-[#25204d] border-[#120f29] rounded-2xl ${
                isImmersiveTable
                  ? 'border-3 sm:border-4 shadow-[0_3px_0_#120f29] sm:shadow-[0_6px_0_#120f29] px-1.5 sm:px-3 py-1 sm:py-2'
                  : 'border-4 shadow-[0_5px_0_#120f29] px-2 sm:px-3 py-2'
              }`}
            >
              <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                <div className="cartoon-badge bg-[#fff9ec] text-[#161426] ps-1.5 pe-3 py-1 text-sm flex items-center gap-1.5 min-w-0">
                  <PartyGameSvgIcon gameId={activeGameId} className="w-5 h-5 shrink-0" />
                  <span className="truncate">
                    {lang === 'ar' ? activeGameMeta.name_ar : activeGameMeta.name_en}
                  </span>
                </div>

                {activeGameId === 'wavelength' && (
                  <span
                    className="cartoon-badge bg-[#191636] text-[#ffca3a] px-2.5 py-1 text-xs shrink-0"
                    dir="ltr"
                    aria-label={`${t.round} ${room.round_number} ${t.of} ${room.max_rounds}`}
                  >
                    {room.round_number}/{room.max_rounds}
                  </span>
                )}

                {!isPassAndPlay && (
                  <button
                    type="button"
                    onClick={copyInviteLink}
                    aria-label={lang === 'ar' ? 'انسخ رابط الدعوة' : 'Copy invite link'}
                    className="cartoon-badge bg-[#191636] text-[#00bbf9] px-2.5 py-1 text-xs hidden sm:flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    <span dir="ltr">#{room.code}</span>
                    {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                <div
                  className="cartoon-badge bg-[#8ac926] text-[#161426] px-2.5 py-1 text-xs sm:text-sm flex items-center gap-1"
                  aria-label={`${t.totalScore}: ${room.coop_score}`}
                >
                  <Trophy weight="fill" className="w-4 h-4" />
                  <span>{room.coop_score}</span>
                </div>
                <AudioControlPanel lang={lang} compact />
                <RoomMenu
                  lang={lang}
                  canSwitchGame={isHost || isPassAndPlay}
                  gameCount={PARTY_GAMES_CATALOG.length}
                  onGuide={() => openHowToPlayFor(activeGameId)}
                  onSwitchGame={() => setShowGamePickerModal(true)}
                  onToggleLang={() => setLang(lang === 'ar' ? 'en' : 'ar')}
                  onLeave={handleLeaveRoom}
                  onCopyInvite={isPassAndPlay ? undefined : copyInviteLink}
                />
              </div>
            </div>

            {/* Who gives the clue this round (Wavelength only) */}
            {activeGameId === 'wavelength' && (
              <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-sm font-extrabold text-[#fff9ec]">
                <Sparkle weight="fill" className="w-5 h-5 text-[#ff924c]" />
                <span>{t.psychicRole}:</span>
                <span className="text-[#ffca3a]">
                  {isPassAndPlay
                    ? lang === 'ar'
                      ? 'اللاعب الحالي'
                      : 'Current Psychic'
                    : isPsychic
                    ? lang === 'ar'
                      ? 'إنت!'
                      : 'You!'
                    : psychicPlayer?.name || '...'}
                </span>
                {room.mode === 'teams' && (
                  <span
                    className={`cartoon-badge px-2.5 py-0.5 text-xs text-[#161426] ${
                      room.active_team === 'B' ? 'bg-[#00bbf9]' : 'bg-[#ff924c]'
                    }`}
                  >
                    {lang === 'ar' ? `دور ${activeTeamName}` : `${activeTeamName}'s turn`}
                    {myPlayer && !isPassAndPlay && myPlayer.team === room.active_team
                      ? lang === 'ar'
                        ? ' (فريقك)'
                        : ' (yours)'
                      : ''}
                  </span>
                )}
              </div>
            )}

            {/* MAIN GAMEPLAY + LEADERBOARD GRID (Full-width 12 cols for Board & Card Table Games!) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              {/* Primary Game Column */}
              <div
                className={`${
                  activeGameId === 'boomdeck'
                    ? 'lg:col-span-12'
                    : 'lg:col-span-8'
                } space-y-3`}
              >
                {activeGameId === 'chameleon' ? (
                  <ChameleonGame
                    gameData={
                      room.game_data?.topicId
                        ? room.game_data
                        : (buildInitialGameData('chameleon', players) as ChameleonGameState)
                    }
                    players={players}
                    myPlayerId={playerId}
                    isHost={isHost}
                    isPassAndPlay={isPassAndPlay}
                    lang={lang}
                    onUpdateGameData={handleUpdateMiniGameData}
                    onStartNewRound={() => handleSelectPartyGame('chameleon')}
                  />
                ) : activeGameId === 'ito' ? (
                  <ItoGame
                    gameData={
                      room.game_data?.numbers
                        ? room.game_data
                        : (buildInitialGameData('ito', players) as ItoGameState)
                    }
                    players={players}
                    myPlayerId={playerId}
                    isHost={isHost}
                    isPassAndPlay={isPassAndPlay}
                    lang={lang}
                    onUpdateGameData={handleUpdateMiniGameData}
                    onStartNewRound={() => handleSelectPartyGame('ito')}
                  />
                ) : activeGameId === 'wordbomb' ? (
                  <WordBombGame
                    gameData={
                      room.game_data?.challengeId
                        ? room.game_data
                        : (buildInitialGameData('wordbomb', players) as WordBombGameState)
                    }
                    players={players}
                    myPlayerId={playerId}
                    isHost={isHost}
                    isPassAndPlay={isPassAndPlay}
                    lang={lang}
                    onUpdateGameData={handleUpdateMiniGameData}
                    onStartNewRound={() => handleSelectPartyGame('wordbomb')}
                  />
                ) : activeGameId === 'taboo' ? (
                  <TabooGame
                    gameData={
                      room.game_data?.describerId
                        ? room.game_data
                        : (buildInitialGameData('taboo', players) as TabooGameState)
                    }
                    players={players}
                    myPlayerId={playerId}
                    isHost={isHost}
                    isPassAndPlay={isPassAndPlay}
                    lang={lang}
                    onUpdateGameData={handleUpdateMiniGameData}
                    onStartNewRound={() => handleSelectPartyGame('taboo')}
                  />
                ) : activeGameId === 'dixit' ? (
                  <DixitGame
                    gameData={
                      room.game_data?.hands
                        ? room.game_data
                        : (buildInitialGameData('dixit', players) as DixitGameState)
                    }
                    players={players}
                    myPlayerId={playerId}
                    isHost={isHost}
                    isPassAndPlay={isPassAndPlay}
                    lang={lang}
                    onUpdateGameData={handleUpdateMiniGameData}
                    onStartNewRound={() => handleSelectPartyGame('dixit')}
                  />
                ) : activeGameId === 'witness' ? (
                  <WitnessGame
                    gameData={
                      room.game_data?.monsterId
                        ? room.game_data
                        : (buildInitialGameData('witness', players) as WitnessGameState)
                    }
                    players={players}
                    myPlayerId={playerId}
                    isHost={isHost}
                    isPassAndPlay={isPassAndPlay}
                    lang={lang}
                    onUpdateGameData={handleUpdateMiniGameData}
                    onStartNewRound={() => handleSelectPartyGame('witness')}
                  />
                ) : activeGameId === 'fakeartist' ? (
                  <FakeArtistGame
                    gameData={
                      room.game_data?.promptId
                        ? room.game_data
                        : (buildInitialGameData('fakeartist', players) as FakeArtistGameState)
                    }
                    players={players}
                    myPlayerId={playerId}
                    isHost={isHost}
                    isPassAndPlay={isPassAndPlay}
                    lang={lang}
                    onUpdateGameData={handleUpdateMiniGameData}
                    onStartNewRound={() => handleSelectPartyGame('fakeartist')}
                  />
                ) : activeGameId === 'medium' ? (
                  <MediumGame
                    gameData={
                      room.game_data?.word1
                        ? room.game_data
                        : (buildInitialGameData('medium', players) as MediumGameState)
                    }
                    players={players}
                    myPlayerId={playerId}
                    isHost={isHost}
                    isPassAndPlay={isPassAndPlay}
                    lang={lang}
                    onUpdateGameData={handleUpdateMiniGameData}
                    onStartNewRound={() => handleSelectPartyGame('medium')}
                  />
                ) : activeGameId === 'soclover' ? (
                  <SoCloverGame
                    gameData={
                      room.game_data?.targetWordIds
                        ? room.game_data
                        : (buildInitialGameData('soclover', players) as SoCloverGameState)
                    }
                    players={players}
                    myPlayerId={playerId}
                    isHost={isHost}
                    isPassAndPlay={isPassAndPlay}
                    lang={lang}
                    onUpdateGameData={handleUpdateMiniGameData}
                    onStartNewRound={() => handleSelectPartyGame('soclover')}
                  />
                ) : activeGameId === 'wits' ? (
                  <WitsGame
                    gameData={
                      room.game_data?.questionId
                        ? room.game_data
                        : (buildInitialGameData('wits', players) as WitsGameState)
                    }
                    players={players}
                    myPlayerId={playerId}
                    isHost={isHost}
                    isPassAndPlay={isPassAndPlay}
                    lang={lang}
                    onUpdateGameData={handleUpdateMiniGameData}
                    onStartNewRound={() => handleSelectPartyGame('wits')}
                  />
                ) : activeGameId === 'insider' ? (
                  <InsiderGame
                    gameData={
                      room.game_data?.wordId
                        ? room.game_data
                        : (buildInitialGameData('insider', players) as InsiderGameState)
                    }
                    players={players}
                    myPlayerId={playerId}
                    isHost={isHost}
                    isPassAndPlay={isPassAndPlay}
                    lang={lang}
                    onUpdateGameData={handleUpdateMiniGameData}
                    onStartNewRound={() => handleSelectPartyGame('insider')}
                  />
                ) : activeGameId === 'decrypto' ? (
                  <DecryptoGame
                    gameData={
                      room.game_data?.secretCode
                        ? room.game_data
                        : (buildInitialGameData('decrypto', players) as DecryptoGameState)
                    }
                    players={players}
                    myPlayerId={playerId}
                    isHost={isHost}
                    isPassAndPlay={isPassAndPlay}
                    lang={lang}
                    onUpdateGameData={handleUpdateMiniGameData}
                    onStartNewRound={() => handleSelectPartyGame('decrypto')}
                  />
                ) : activeGameId === 'cockroach' ? (
                  <CockroachGame
                    gameData={
                      room.game_data?.trueCritter
                        ? room.game_data
                        : (buildInitialGameData('cockroach', players) as CockroachGameState)
                    }
                    players={players}
                    myPlayerId={playerId}
                    isHost={isHost}
                    isPassAndPlay={isPassAndPlay}
                    lang={lang}
                    onUpdateGameData={handleUpdateMiniGameData}
                    onStartNewRound={() => handleSelectPartyGame('cockroach')}
                  />
                ) : activeGameId === 'themind' ? (
                  <TheMindGame
                    gameData={
                      typeof room.game_data?.level === 'number' && room.game_data?.hands
                        ? room.game_data
                        : (buildInitialGameData('themind', players) as TheMindGameState)
                    }
                    players={players}
                    myPlayerId={playerId}
                    isHost={isHost}
                    isPassAndPlay={isPassAndPlay}
                    lang={lang}
                    onUpdateGameData={handleUpdateMiniGameData}
                    onStartNewRound={() => handleSelectPartyGame('themind')}
                  />
                ) : activeGameId === 'skull' ? (
                  <SkullGame
                    gameData={
                      room.game_data?.ownedDiscs && room.game_data?.playerStacks
                        ? room.game_data
                        : (buildInitialGameData('skull', players) as SkullGameState)
                    }
                    players={players}
                    myPlayerId={playerId}
                    isHost={isHost}
                    isPassAndPlay={isPassAndPlay}
                    lang={lang}
                    onUpdateGameData={handleUpdateMiniGameData}
                    onStartNewRound={() => handleSelectPartyGame('skull')}
                  />
                ) : activeGameId === 'sheriff' ? (
                  <SheriffGame
                    gameData={
                      room.game_data?.sheriffId && Array.isArray(room.game_data?.merchantIds)
                        ? room.game_data
                        : (buildInitialGameData('sheriff', players) as SheriffGameState)
                    }
                    players={players}
                    myPlayerId={playerId}
                    isHost={isHost}
                    isPassAndPlay={isPassAndPlay}
                    lang={lang}
                    onUpdateGameData={handleUpdateMiniGameData}
                    onStartNewRound={() => handleSelectPartyGame('sheriff')}
                  />
                ) : activeGameId === 'cashnguns' ? (
                  <CashNGunsGame
                    gameData={
                      room.game_data?.playerStates && Array.isArray(room.game_data?.roundLoot)
                        ? room.game_data
                        : (buildInitialGameData('cashnguns', players) as CashNGunsGameState)
                    }
                    players={players}
                    myPlayerId={playerId}
                    isHost={isHost}
                    isPassAndPlay={isPassAndPlay}
                    lang={lang}
                    onUpdateGameData={handleUpdateMiniGameData}
                    onStartNewRound={() => handleSelectPartyGame('cashnguns')}
                  />
                ) : activeGameId === 'onenight' ? (
                  <OneNightGame
                    gameData={
                      room.game_data?.initialRoles && Array.isArray(room.game_data?.centerRoles)
                        ? room.game_data
                        : (buildInitialGameData('onenight', players) as OneNightGameState)
                    }
                    players={players}
                    myPlayerId={playerId}
                    isHost={isHost}
                    isPassAndPlay={isPassAndPlay}
                    lang={lang}
                    onUpdateGameData={handleUpdateMiniGameData}
                    onStartNewRound={() => handleSelectPartyGame('onenight')}
                  />
                ) : activeGameId === 'resistance' ? (
                  <ResistanceGame
                    gameData={
                      room.game_data?.roles && Array.isArray(room.game_data?.missions)
                        ? room.game_data
                        : (buildInitialGameData('resistance', players) as ResistanceGameState)
                    }
                    players={players}
                    myPlayerId={playerId}
                    isHost={isHost}
                    isPassAndPlay={isPassAndPlay}
                    lang={lang}
                    onUpdateGameData={handleUpdateMiniGameData}
                    onStartNewRound={() => handleSelectPartyGame('resistance')}
                  />
                ) : activeGameId === 'artauction' ? (
                  <ArtAuctionGame
                    gameData={
                      room.game_data?.cash && room.game_data?.collectedArtValue
                        ? room.game_data
                        : (buildInitialGameData('artauction', players) as ArtAuctionGameState)
                    }
                    players={players}
                    myPlayerId={playerId}
                    isHost={isHost}
                    isPassAndPlay={isPassAndPlay}
                    lang={lang}
                    onUpdateGameData={handleUpdateMiniGameData}
                    onStartNewRound={() => handleSelectPartyGame('artauction')}
                  />
                ) : activeGameId === 'alibi' ? (
                  <AlibiGame
                    gameData={
                      typeof room.game_data?.caseId === 'number' && room.game_data?.culpritId
                        ? room.game_data
                        : (buildInitialGameData('alibi', players) as AlibiGameState)
                    }
                    players={players}
                    myPlayerId={playerId}
                    isHost={isHost}
                    isPassAndPlay={isPassAndPlay}
                    lang={lang}
                    onUpdateGameData={handleUpdateMiniGameData}
                    onStartNewRound={() => handleSelectPartyGame('alibi')}
                  />
                ) : activeGameId === 'splitsteal' ? (
                  <SplitStealGame
                    gameData={
                      room.game_data?.bossId && room.game_data?.briefcases
                        ? room.game_data
                        : (buildInitialGameData('splitsteal', players) as SplitStealGameState)
                    }
                    players={players}
                    myPlayerId={playerId}
                    isHost={isHost}
                    isPassAndPlay={isPassAndPlay}
                    lang={lang}
                    onUpdateGameData={handleUpdateMiniGameData}
                    onStartNewRound={() => handleSelectPartyGame('splitsteal')}
                  />
                ) : activeGameId === 'boomdeck' ? (
                  <BoomDeckGame
                    gameData={
                      Array.isArray(room.game_data?.deck) &&
                      Array.isArray(room.game_data?.alivePlayerIds)
                        ? room.game_data
                        : (buildInitialGameData('boomdeck', players) as BoomDeckGameState)
                    }
                    players={players}
                    myPlayerId={playerId}
                    isHost={isHost}
                    isPassAndPlay={isPassAndPlay}
                    lang={lang}
                    onUpdateGameData={handleUpdateMiniGameData}
                  />
                ) : (
                  /* WAVELENGTH GAME BOARD */
                  <>
                    {room.clue && (
                      <div className="cartoon-card bg-[#ffca3a] px-5 py-3 text-center max-w-xl mx-auto">
                        <div className="text-xs font-extrabold uppercase text-[#161426]/75">
                          {t.theClueIs}
                        </div>
                        <div className="text-2xl md:text-3xl font-extrabold text-[#161426] mt-0.5">
                          &ldquo;{room.clue}&rdquo;
                        </div>
                      </div>
                    )}

                    {isPassAndPlay && isPsychic && room.status === 'psychic_clue' && !psychicCurtainOpen && (
                      <div className="flex justify-center">
                        <button
                          type="button"
                          onClick={() => setLocalPeekTarget(!localPeekTarget)}
                          className="cartoon-btn bg-[#ff924c] text-[#161426] px-4 py-1.5 text-sm flex items-center gap-2"
                        >
                          {localPeekTarget ? (
                            <>
                              <EyeSlash weight="bold" className="w-5 h-5" />
                              <span>{t.hideTargetAndPass}</span>
                            </>
                          ) : (
                            <>
                              <Eye weight="bold" className="w-5 h-5" />
                              <span>{t.iAmPsychicShowTarget}</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}

                    <WavelengthWheel
                      targetAngle={Number(room.target_angle)}
                      dialAngle={liveDialAngle}
                      showTarget={shouldShowTarget}
                      canMoveDial={canDragDial}
                      onDialChange={handleDialChange}
                      otherTeamGuess={room.other_team_guess}
                      playerPins={wheelPlayerPins}
                      lang={lang}
                    />

                    <SpectrumCard
                      leftText={leftCardText}
                      rightText={rightCardText}
                      lang={lang}
                      canSwap={room.status === 'psychic_clue' && isPsychic}
                      onSwap={handleSwapCard}
                    />

                    <div className="max-w-xl mx-auto w-full pt-2">
                      {room.status === 'psychic_clue' &&
                        (isPsychic ? (
                          <form
                            onSubmit={handleSubmitClue}
                            className="cartoon-card p-3.5 sm:p-5 space-y-2.5 sm:space-y-3 text-center"
                          >
                            <div className="flex items-center justify-center gap-2 text-[#ff595e] font-extrabold text-lg">
                              <Sparkle weight="fill" className="w-6 h-6" />
                              <span>{t.youArePsychic}</span>
                            </div>
                            <p className="text-sm font-bold text-[#3f3b5c]">
                              {t.psychicHintInstruction}
                            </p>
                            <div className="flex flex-col sm:flex-row gap-2.5 w-full">
                              <input
                                type="text"
                                required
                                maxLength={60}
                                value={clueInput}
                                onChange={(e) => setClueInput(e.target.value)}
                                placeholder={t.cluePlaceholder}
                                className="cartoon-input min-w-0 flex-1 px-4 py-3 bg-white text-[#161426] text-lg"
                              />
                              <button
                                type="submit"
                                className="cartoon-btn bg-[#8ac926] hover:bg-[#9be02f] text-[#161426] px-5 py-3 text-lg flex items-center justify-center gap-2 shrink-0 whitespace-nowrap"
                              >
                                <PaperPlaneTilt weight="fill" className="w-5 h-5" />
                                <span>{t.sendClue}</span>
                              </button>
                            </div>
                          </form>
                        ) : (
                          <div className="cartoon-panel-dark p-5 text-center space-y-2">
                            <div className="text-xl font-extrabold text-[#ffca3a] animate-pulse flex items-center justify-center gap-2">
                              <Sparkle weight="fill" className="w-6 h-6" />
                              <span>
                                {psychicPlayer?.name || t.psychicRole} {t.waitingForPsychic}
                              </span>
                            </div>
                          </div>
                        ))}

                      {room.status === 'guessing' && (
                        <div className="cartoon-card p-3.5 sm:p-5 text-center space-y-2.5 sm:space-y-3.5">
                          {canDragDial ? (
                            <>
                              <p className="font-extrabold text-base text-[#161426]">
                                {isPassAndPlay && nextPassAndPlayGuesser
                                  ? lang === 'ar'
                                    ? `دور (${nextPassAndPlayGuesser.name}) ليحرك المؤشر ويثبت تخمينه الشخصي!`
                                    : `${nextPassAndPlayGuesser.name}'s turn to move the pointer and lock their guess!`
                                  : hasLockedMyGuess
                                  ? lang === 'ar'
                                    ? `ثبتت تخمينك على (${wavelengthGuesses[playerId]}°)! فيك تعدله قبل ما يخلصوا الباقين:`
                                    : `Locked your guess at (${wavelengthGuesses[playerId]}°)! You can still adjust it:`
                                  : t.moveDialInstruction}
                              </p>
                              <button
                                type="button"
                                onClick={handleLockGuess}
                                className={`cartoon-btn w-full py-3.5 text-xl flex items-center justify-center gap-2 ${
                                  hasLockedMyGuess
                                    ? 'bg-[#ffca3a] text-[#161426]'
                                    : 'bg-[#ff595e] hover:bg-[#ff6f73] text-white'
                                }`}
                              >
                                <Target weight="fill" className="w-6 h-6" />
                                <span>
                                  {room.mode === 'teams' && !isPassAndPlay
                                    ? t.lockTeamGuess
                                    : isPassAndPlay && nextPassAndPlayGuesser
                                    ? lang === 'ar'
                                      ? `تثبيت تخمين ${nextPassAndPlayGuesser.name}!`
                                      : `Lock ${nextPassAndPlayGuesser.name}'s Guess!`
                                    : hasLockedMyGuess
                                    ? lang === 'ar'
                                      ? 'تحديث تخميني الشخصي'
                                      : 'Update My Personal Guess'
                                    : lang === 'ar'
                                    ? 'تثبيت تخميني الشخصي!'
                                    : 'Lock My Personal Guess!'}
                                </span>
                              </button>
                            </>
                          ) : (
                            <p className="font-extrabold text-base text-[#161426] flex items-center justify-center gap-2">
                              <Eye weight="fill" className="w-5 h-5 text-[#1982c4]" />
                              <span>
                                {isPsychic || !isOnRivalTeam
                                  ? t.psychicWatchingInstruction
                                  : lang === 'ar'
                                  ? `${activeTeamName} عم يحزر هلق. جهزوا حالكم، بعدها بتقولوا الهدف يمين ولا يسار.`
                                  : `${activeTeamName} is guessing now. Get ready to call left or right next.`}
                              </span>
                            </p>
                          )}

                          {room.mode === 'coop' && expectedWavelengthGuessers.length > 0 && (
                            <div className="pt-2 border-t-2 border-[#161426]/15 space-y-2">
                              <div className="text-xs font-extrabold text-[#3f3b5c]">
                                {lang === 'ar'
                                  ? `حالة تخمينات اللاعبين (${Object.keys(wavelengthGuesses).length} / ${expectedWavelengthGuessers.length}):`
                                  : `Players Guessed (${Object.keys(wavelengthGuesses).length} / ${expectedWavelengthGuessers.length}):`}
                              </div>
                              <div className="flex flex-wrap items-center justify-center gap-2">
                                {expectedWavelengthGuessers.map((gp) => {
                                  const locked = typeof wavelengthGuesses[gp.id] === 'number';
                                  return (
                                    <span
                                      key={gp.id}
                                      className={`cartoon-badge px-3 py-1 text-xs flex items-center gap-1 ${
                                        locked
                                          ? 'bg-[#8ac926] text-[#161426]'
                                          : 'bg-gray-200 text-gray-600'
                                      }`}
                                    >
                                      <span>{gp.name}</span>
                                      {locked ? (
                                        <CheckCircle weight="fill" className="w-3.5 h-3.5" />
                                      ) : (
                                        <Hourglass weight="bold" className="w-3.5 h-3.5" />
                                      )}
                                    </span>
                                  );
                                })}
                              </div>

                              {(isHost || isPsychic) &&
                                Object.keys(wavelengthGuesses).length > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => performMultiPlayerReveal(wavelengthGuesses)}
                                    className="cartoon-btn bg-[#00bbf9] text-[#161426] px-4 py-2 text-sm mt-2"
                                  >
                                    {lang === 'ar'
                                      ? 'اكشف النتيجة الآن (بمن جاوب)'
                                      : 'Reveal Results Now'}
                                  </button>
                                )}
                            </div>
                          )}
                        </div>
                      )}

                      {room.status === 'left_right' && (
                        <div className="cartoon-card p-5 text-center space-y-3">
                          <h3 className="font-extrabold text-lg text-[#161426]">
                            {t.otherTeamTurn}
                          </h3>
                          {!canCallLeftRight ? (
                            <p className="font-extrabold text-sm text-[#3f3b5c] flex items-center justify-center gap-2">
                              <Hourglass weight="bold" className="w-4 h-4" />
                              <span>
                                {lang === 'ar'
                                  ? `استنوا ${rivalTeamName} يقرر: الهدف يمين المؤشر ولا يساره؟`
                                  : `Waiting for ${rivalTeamName} to call left or right...`}
                              </span>
                            </p>
                          ) : (
                          <div dir="ltr" className="grid grid-cols-2 gap-3">
                            <button
                              type="button"
                              onClick={() => handleOtherTeamGuess('left')}
                              className="cartoon-btn bg-[#38bdf8] text-[#161426] py-3 text-lg"
                            >
                              {t.guessLeft}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOtherTeamGuess('right')}
                              className="cartoon-btn bg-[#fb7185] text-[#161426] py-3 text-lg"
                            >
                              {t.guessRight}
                            </button>
                          </div>
                          )}
                        </div>
                      )}

                      {room.status === 'reveal' && (
                        <div className="cartoon-card p-5 text-center space-y-3.5 animate-in zoom-in-95 duration-200">
                          <div className="text-3xl font-extrabold text-[#161426]">
                            {room.last_round_points === 4
                              ? t.bullseye
                              : room.last_round_points === 3
                              ? t.greatJob
                              : room.last_round_points === 2
                              ? t.goodTry
                              : t.missed}
                          </div>

                          {Object.keys(wavelengthGuesses).length > 0 && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                              {Object.entries(wavelengthGuesses).map(([pid, guessedAng]) => {
                                const p = players.find((item) => item.id === pid);
                                const pts =
                                  wavelengthPoints[pid] ??
                                  calculateScoreFromAngles(
                                    Number(room.target_angle),
                                    Number(guessedAng)
                                  );
                                return (
                                  <div
                                    key={pid}
                                    className="flex items-center justify-between p-2.5 rounded-2xl bg-white border-3 border-[#161426]"
                                  >
                                    <div className="flex items-center gap-2">
                                      <span
                                        style={{
                                          backgroundColor: p?.avatar_color || '#ffca3a',
                                        }}
                                        className="w-7 h-7 rounded-full border-2 border-[#161426] flex items-center justify-center font-extrabold text-xs text-[#161426]"
                                      >
                                        {p?.name?.slice(0, 1) || '?'}
                                      </span>
                                      <span className="font-extrabold text-sm text-[#161426]">
                                        {p?.name || 'Player'}
                                      </span>
                                    </div>
                                    <span
                                      className={`cartoon-badge px-2.5 py-0.5 text-xs ${
                                        pts === 4
                                          ? 'bg-[#3898b8] text-white'
                                          : pts === 3
                                          ? 'bg-[#ff5722] text-white'
                                          : pts === 2
                                          ? 'bg-[#ffaa1d] text-[#161426]'
                                          : 'bg-gray-200 text-gray-600'
                                      }`}
                                    >
                                      +{pts} {t.pointsUnit} ({guessedAng > 0 ? `+${guessedAng}°` : `${guessedAng}°`})
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {room.last_bonus_points > 0 && (
                            <div className="cartoon-badge bg-[#ffca3a] text-[#161426] px-4 py-1 text-sm inline-block">
                              {t.bonusEarned}
                            </div>
                          )}

                          <button
                            type="button"
                            onClick={handleNextRound}
                            className="cartoon-btn bg-[#8ac926] hover:bg-[#9be02f] text-[#161426] w-full py-3.5 text-xl"
                          >
                            {room.round_number >= room.max_rounds ? t.finishGame : t.nextRound}
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* Live Custom Cartoon Vector Reaction Bar */}
                <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                  {REACTION_TYPES.map((rt) => (
                    <button
                      key={rt}
                      type="button"
                      onClick={() => sendCartoonReaction(rt)}
                      className="cartoon-btn bg-[#25204d] hover:bg-[#322b66] w-12 h-12 flex items-center justify-center p-2"
                    >
                      <ReactionSvgIcon type={rt} className="w-7 h-7" />
                    </button>
                  ))}
                  {activeGameId === 'wavelength' && (
                    <button
                      type="button"
                      onClick={() => setShowCustomCardModal(true)}
                      className="cartoon-btn bg-[#ffca3a] text-[#161426] px-3.5 h-12 text-sm flex items-center gap-1"
                    >
                      <Plus weight="bold" className="w-4 h-4" />
                      <span>{t.addCustomCard}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* LEADERBOARD SIDEBAR (Drops to a sleek full-width bar when playing full-screen board/tabletop games) */}
              <aside
                className={`${
                  activeGameId === 'boomdeck'
                    ? 'lg:col-span-12'
                    : 'lg:col-span-4 lg:sticky lg:top-4'
                } cartoon-panel-dark p-4 sm:p-5 space-y-3.5`}
              >
                <div className="flex items-center justify-between border-b-3 border-[#120f29] pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-[#ffca3a] border-3 border-[#161426] flex items-center justify-center">
                      <Trophy weight="fill" className="w-5 h-5 text-[#161426]" />
                    </div>
                    <h3 className="text-xl font-extrabold text-[#fff9ec]">
                      {t.leaderboardTitle}
                    </h3>
                  </div>
                  <span className="cartoon-badge bg-[#191636] text-[#ffca3a] px-3 py-0.5 text-xs">
                    {players.length} {lang === 'ar' ? 'لاعبين' : 'Players'}
                  </span>
                </div>

                {/* Ranked Players List */}
                <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-0.5">
                  {[...players]
                    .sort((a, b) => (b.score || 0) - (a.score || 0))
                    .map((p, index) => {
                      const isCurrentPsychic =
                        activeGameId === 'wavelength' && p.id === room.psychic_id;
                      const isNextPsychic =
                        activeGameId === 'wavelength' &&
                        room.round_number < room.max_rounds &&
                        !isCurrentPsychic &&
                        p.id === nextPsychicIdPreview;
                      return (
                        <div
                          key={p.id}
                          className={`flex items-center justify-between p-3 rounded-2xl border-3 transition-transform ${
                            isCurrentPsychic
                              ? 'bg-[#322b66] border-[#ffca3a] shadow-[0_4px_0_#120f29]'
                              : 'bg-[#191636] border-[#120f29] shadow-[0_4px_0_#120f29]'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="text-sm font-extrabold w-6 flex items-center justify-center shrink-0">
                              {index < 3 ? (
                                <Medal
                                  weight="fill"
                                  className={`w-6 h-6 ${
                                    index === 0
                                      ? 'text-[#ffca3a]'
                                      : index === 1
                                      ? 'text-[#cbd5e1]'
                                      : 'text-[#fb923c]'
                                  }`}
                                />
                              ) : (
                                `#${index + 1}`
                              )}
                            </span>
                            <div
                              style={{ backgroundColor: p.avatar_color }}
                              className="w-9 h-9 rounded-full border-3 border-[#161426] flex items-center justify-center font-extrabold text-[#161426] text-base shrink-0"
                            >
                              {p.name.slice(0, 1).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="font-extrabold text-sm md:text-base text-white truncate flex items-center gap-1">
                                <span className="truncate">{p.name}</span>
                                {p.id === playerId && !isPassAndPlay && (
                                  <span className="text-[11px] bg-[#00bbf9] text-[#161426] px-1.5 py-0.2 rounded-full font-extrabold">
                                    {t.youBadge}
                                  </span>
                                )}
                                {p.is_host && (
                                  <Crown
                                    weight="fill"
                                    className="w-4 h-4 text-[#ffca3a] shrink-0"
                                  />
                                )}
                              </div>
                              {isCurrentPsychic && (
                                <span className="text-xs font-extrabold text-[#ffca3a] block">
                                  {t.currentPsychicBadge}
                                </span>
                              )}
                              {isNextPsychic && (
                                <span className="text-xs font-extrabold text-[#9fd8ff] block">
                                  {lang === 'ar' ? 'العرّاف الجاي' : 'Psychic next round'}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <div className="cartoon-badge bg-[#ffca3a] text-[#161426] px-3 py-1 text-xs md:text-sm">
                              {p.score || 0} {t.pointsUnit}
                            </div>
                            {isHost && p.id !== room.host_id && (
                              <button
                                type="button"
                                onClick={() => handleKickPlayer(p.id)}
                                title={lang === 'ar' ? 'طرد اللاعب (Kick)' : 'Kick Player'}
                                className="cartoon-btn bg-[#ff595e] text-white p-1.5 rounded-xl flex items-center justify-center"
                              >
                                <UserMinus weight="bold" className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>

                {/* Add Local Player in Pass & Play */}
                {isPassAndPlay && (
                  <form onSubmit={handleAddLocalPlayer} className="flex gap-2 pt-2">
                    <input
                      type="text"
                      maxLength={16}
                      value={localNewPlayerName}
                      onChange={(e) => setLocalNewPlayerName(e.target.value)}
                      placeholder={t.addLocalPlayerPlaceholder}
                      className="cartoon-input min-w-0 flex-1 px-3 py-2 bg-white text-[#161426] text-sm"
                    />
                    <button
                      type="submit"
                      className="cartoon-btn bg-[#8ac926] text-[#161426] px-3 py-2 text-sm shrink-0 flex items-center justify-center"
                    >
                      <Plus weight="bold" className="w-4 h-4" />
                    </button>
                  </form>
                )}
              </aside>
            </div>

            {/* Animated Cartoon Psychic Turn Curtain (Anti-Spoiler Overlay for Wavelength) */}
            <AnimatePresence>
              {activeGameId === 'wavelength' &&
                room.status === 'psychic_clue' &&
                isPsychic &&
                psychicCurtainOpen && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#120f29]/90 backdrop-blur-md"
                  >
                    <motion.div
                      initial={{ scale: 0.75, y: 40, rotate: -2 }}
                      animate={{ scale: 1, y: 0, rotate: 0 }}
                      exit={{ scale: 0.85, y: -30, opacity: 0 }}
                      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                      className="cartoon-card w-full max-w-lg p-6 md:p-8 text-center space-y-5 relative overflow-hidden"
                    >
                      <div className="inline-flex items-center gap-2 cartoon-badge bg-[#00bbf9] text-[#161426] px-4 py-1 text-sm">
                        <Sparkle weight="fill" className="w-4 h-4" />
                        <span>
                          {t.round} {room.round_number} {t.of} {room.max_rounds}
                        </span>
                      </div>

                      <motion.div
                        animate={{ y: [0, -10, 0], rotate: [0, -4, 4, 0] }}
                        transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                        className="w-24 h-24 rounded-3xl bg-[#ff595e] border-4 border-[#161426] shadow-[0_7px_0_#161426] flex items-center justify-center mx-auto"
                      >
                        <EyeSlash weight="fill" className="w-14 h-14 text-[#ffca3a]" />
                      </motion.div>

                      <div className="space-y-1">
                        <h2 className="text-2xl md:text-3xl font-extrabold text-[#161426]">
                          {t.psychicCurtainTitle}
                        </h2>
                        {psychicPlayer && (
                          <div className="text-lg font-extrabold text-[#1982c4]">
                            ({psychicPlayer.name})
                          </div>
                        )}
                      </div>

                      <div className="p-4 rounded-2xl bg-[#ffca3a] border-4 border-[#161426] shadow-[0_5px_0_#161426] text-[#161426] font-extrabold text-base md:text-lg leading-relaxed">
                        {t.psychicCurtainWarning}
                      </div>

                      <p className="text-sm font-bold text-[#3f3b5c]">{t.psychicCurtainSub}</p>

                      <button
                        type="button"
                        onClick={() => {
                          setPsychicCurtainOpen(false);
                          setLocalPeekTarget(true);
                        }}
                        className="cartoon-btn w-full py-4 px-6 bg-[#8ac926] hover:bg-[#9be02f] text-[#161426] text-xl flex items-center justify-center gap-2.5"
                      >
                        <Eye weight="fill" className="w-7 h-7" />
                        <span>{t.psychicCurtainBtn}</span>
                      </button>
                    </motion.div>
                  </motion.div>
                )}
            </AnimatePresence>
          </div>
        )}
      </main>

      {/* Modals */}
      <HowToPlayModal
        isOpen={showHowToPlay}
        onClose={() => {
          setShowHowToPlay(false);
          setHowToPlayTargetGame(null);
        }}
        lang={lang}
        activeGameId={howToPlayTargetGame || (room ? activeGameId : homeSelectedGame)}
      />
      <GamePickerModal
        isOpen={showGamePickerModal}
        onClose={() => setShowGamePickerModal(false)}
        activeGameId={activeGameId}
        onSelectGame={(gid) => handleSelectPartyGame(gid)}
        onLearnGame={(gid) => openHowToPlayFor(gid)}
        lang={lang}
      />
      <CustomCardModal
        isOpen={showCustomCardModal}
        onClose={() => setShowCustomCardModal(false)}
        onAdd={handleAddCustomCard}
        lang={lang}
      />
    </div>
  );
}
export default App;
