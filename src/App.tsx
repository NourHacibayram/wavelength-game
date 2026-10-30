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
  FIBBAGE_QUESTIONS,
  WORD_BOMB_CHALLENGES,
} from './data/partyGamesData';
import { WavelengthWheel } from './components/WavelengthWheel';
import { SpectrumCard } from './components/SpectrumCard';
import { HowToPlayModal, CustomCardModal } from './components/Modals';
import { ChameleonGame, ChameleonGameState } from './components/ChameleonGame';
import { ItoGame, ItoGameState } from './components/ItoGame';
import { FibbageGame, FibbageGameState } from './components/FibbageGame';
import { WordBombGame, WordBombGameState } from './components/WordBombGame';
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
  DeviceMobile,
  GameController,
  Play,
  ArrowCounterClockwise,
  Eye,
  EyeSlash,
  UserMinus,
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
  emoji: string;
  sender: string;
  x: number;
}

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
  const [showCustomCardModal, setShowCustomCardModal] = useState<boolean>(false);

  // Gameplay local inputs
  const [homeSelectedGame, setHomeSelectedGame] = useState<PartyGameId>('wavelength');
  const [clueInput, setClueInput] = useState<string>('');
  const [localNewPlayerName, setLocalNewPlayerName] = useState<string>('');
  const [liveDialAngle, setLiveDialAngle] = useState<number>(0);
  const [demoDialAngle, setDemoDialAngle] = useState<number>(14);
  const [reactions, setReactions] = useState<FloatingReaction[]>([]);

  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const lastBroadcastRef = useRef<number>(0);

  // Keep HTML dir and lang attributes synced
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }, [lang]);

  // Check URL query param `?room=XXXX` on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const codeParam = params.get('room');
    if (codeParam) {
      setJoinCodeInput(codeParam.toUpperCase());
    }
  }, []);

  // Reset liveDialAngle to 0 at the start of a new round
  useEffect(() => {
    if (room?.status === 'psychic_clue') {
      setLiveDialAngle(0);
    } else if (room?.mode === 'teams' && room) {
      setLiveDialAngle(Number(room.dial_angle) || 0);
    }
  }, [room?.round_number, room?.status, room?.mode, room?.dial_angle]);

  // Trigger Psychic Safety Curtain at the start of every psychic_clue phase (for Wavelength)
  useEffect(() => {
    const activeGame = room?.selected_game || 'wavelength';
    if (activeGame === 'wavelength' && room?.status === 'psychic_clue') {
      setLocalPeekTarget(false);
      setPsychicCurtainOpen(true);
    } else {
      setPsychicCurtainOpen(false);
    }
  }, [room?.status, room?.round_number, room?.selected_game]);

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

  const spawnReaction = useCallback((emoji: string, sender: string) => {
    const id = Math.random().toString(36).slice(2, 9);
    const x = 15 + Math.random() * 70;
    setReactions((prev) => [...prev.slice(-10), { id, emoji, sender, x }]);
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
          if (payload.new) {
            setRoom(payload.new as RoomState);
          }
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
        // Only sync live dial in Teams mode; in Co-op/Individual mode each player controls their own needle!
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
        if (payload?.emoji) {
          spawnReaction(payload.emoji, payload.senderName || '');
        }
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [room?.id, isPassAndPlay, playerId, spawnReaction]);

  // Save name & color helper
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
  const handleJoinRoom = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const validName = ensurePlayerIdentity();
    if (!validName) return;

    const cleanCode = joinCodeInput.trim().toUpperCase();
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

      // Check existing players to balance teams
      const { data: existingPlayers } = await supabase
        .from('wavelength_players')
        .select('*')
        .eq('room_id', roomData.id)
        .order('joined_at', { ascending: true });

      const list = (existingPlayers as PlayerItem[]) || [];
      const countA = list.filter((p) => p.team === 'A').length;
      const countB = list.filter((p) => p.team === 'B').length;
      const assignedTeam: 'A' | 'B' = countA <= countB ? 'A' : 'B';

      await supabase.from('wavelength_players').upsert({
        room_id: roomData.id,
        id: playerId,
        name: validName,
        avatar_color: playerColor,
        team: assignedTeam,
        score: 0,
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

  // Leave Room
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

  // Host Kick Player
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

    // If kicked player was the active Wavelength psychic, rotate to another player
    if (room.psychic_id === targetPlayerId && remaining.length > 0) {
      await updateRoomState({ psychic_id: remaining[0].id });
    }
  };

  // Update Room helper (works for both Online & Pass-and-Play)
  const updateRoomState = async (patch: Partial<RoomState>) => {
    if (!room) return;
    if (isPassAndPlay) {
      setRoom((prev) => (prev ? { ...prev, ...patch } : null));
      return;
    }
    setRoom((prev) => (prev ? { ...prev, ...patch } : null));
    await supabase
      .from('wavelength_rooms')
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq('id', room.id);
  };

  // Switch player team in Lobby
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

  // Start Game from Lobby
  const handleStartOnlineGame = async () => {
    if (!room) return;
    const activeGame = room.selected_game || 'wavelength';
    const card = pickNextCard([], room.custom_cards);
    const target = generateRandomTargetAngle();
    const firstPsychic = players[0]?.id || playerId;
    const initGameData = buildInitialGameData(activeGame, players);
    setClueInput('');
    // Reset player scores for new game
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
      active_team: 'A',
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

  // Swap Spectrum Card (Psychic can swap before giving clue)
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

  // Add Custom Card
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

  // Psychic Submits Clue
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

  // Dial Change Handler (Personal in Individual/Coop mode, synced in Teams mode)
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

  // Lock Personal Guess (or Team Guess in Teams mode)
  const handleLockGuess = async () => {
    if (!room) return;
    if (room.mode === 'teams' && !isPassAndPlay) {
      await updateRoomState({
        dial_angle: liveDialAngle,
        status: 'left_right',
      });
      return;
    }

    // Individual Personal Guessing!
    const expectedGuessers =
      players.length > 1
        ? players.filter((p) => p.id !== room.psychic_id)
        : players;

    const currentGuesses: Record<string, number> = {
      ...(room.game_data?.wavelength_guesses || {}),
    };

    if (isPassAndPlay) {
      // Find the first expected guesser who hasn't guessed yet
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

  // Reveal all players' personal guesses & award each player their exact personal points!
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

    // Psychic earns the best score achieved by any guesser from their clue!
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

  // Opposing team guesses Left or Right (in Teams Mode)
  const handleOtherTeamGuess = async (direction: 'left' | 'right') => {
    if (!room) return;
    await performReveal(liveDialAngle, direction);
  };

  // Reveal Target & Calculate Score
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

    // Update individual player scores on Leaderboard
    if (pts > 0) {
      const winnerIds = new Set<string>();
      if (room.psychic_id) winnerIds.add(room.psychic_id);
      if (!isPassAndPlay && playerId) winnerIds.add(playerId);

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

  // Advance to Next Round or Finish Game
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

    // Rotate Psychic to next player in list (works for both Online & Pass-and-Play!)
    let nextPsychicId = playerId;
    if (players.length > 0) {
      const candidatePool =
        room.mode === 'teams'
          ? players.filter((p) => p.team === nextTeam)
          : players;
      const pool = candidatePool.length > 0 ? candidatePool : players;
      const currentIdx = pool.findIndex((p) => p.id === room.psychic_id);
      const nextIdx = (currentIdx + 1) % pool.length;
      nextPsychicId = pool[nextIdx].id;
    }

    setClueInput('');
    setLocalPeekTarget(false);
    setPsychicCurtainOpen(true);
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

  // Build initial game_data for any of the 5 Party Games
  const buildInitialGameData = (gameId: PartyGameId, playerList: PlayerItem[]) => {
    const validPlayers =
      playerList.length > 0
        ? playerList
        : [{ id: playerId, room_id: room?.id || 'local', name: playerName || 'Player 1', avatar_color: playerColor, team: 'A' as const, score: 0, is_host: true }];

    if (gameId === 'chameleon') {
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

    if (gameId === 'ito') {
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
        orderedPlayerIds: validPlayers.map((p) => p.id),
      };
      return state;
    }

    if (gameId === 'fibbage') {
      const q = FIBBAGE_QUESTIONS[Math.floor(Math.random() * FIBBAGE_QUESTIONS.length)];
      const state: FibbageGameState = {
        phase: 'writing',
        questionId: q.id,
        lies: {},
        votes: {},
      };
      return state;
    }

    if (gameId === 'wordbomb') {
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

    return {};
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
      });
    } else {
      await updateRoomState({
        selected_game: gameId,
        status: room.status === 'lobby' ? 'lobby' : 'guessing',
        game_data: initialData,
      });
    }
  };

  // Update mini-game state + award Leaderboard points to players
  const handleUpdateMiniGameData = async (
    nextData: any,
    scoreAwards?: Record<string, number>
  ) => {
    if (!room) return;
    let bonusTotal = 0;

    if (scoreAwards && Object.keys(scoreAwards).length > 0) {
      confetti({ particleCount: 75, spread: 70, origin: { y: 0.6 } });
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

  const sendEmojiReaction = (emoji: string) => {
    const sender = playerName || 'Player';
    spawnReaction(emoji, sender);
    if (channelRef.current && !isPassAndPlay) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'reaction',
        payload: { emoji, senderName: sender },
      });
    }
  };

  const copyInviteLink = () => {
    if (!room) return;
    const url = `${window.location.origin}${window.location.pathname}?room=${room.code}`;
    navigator.clipboard.writeText(url);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Role permissions for the current round
  const isHost = room ? room.host_id === playerId || isPassAndPlay : false;
  const isPsychic = room ? (isPassAndPlay ? true : room.psychic_id === playerId) : false;
  const psychicPlayer = players.find((p) => p.id === room?.psychic_id);
  const myPlayer = players.find((p) => p.id === playerId);

  // Determine whether target wedges are visible on this screen
  const shouldShowTarget = (() => {
    if (!room) return false;
    if (room.status === 'reveal' || room.status === 'finished') return true;
    if (room.status === 'psychic_clue' && isPsychic) {
      return localPeekTarget && !psychicCurtainOpen;
    }
    return false;
  })();

  // Determine whether this player can drag the red pointer right now
  const canDragDial = (() => {
    if (!room) return false;
    if (room.status !== 'guessing') return false;
    if (isPassAndPlay) return true;
    if (isPsychic && players.length > 1) return false; // Psychic watches friends move the dial!
    if (room.mode === 'teams' && myPlayer && myPlayer.team !== room.active_team) {
      return false;
    }
    return true;
  })();

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
  const wheelPlayerPins = Object.entries(wavelengthGuesses).map(
    ([pid, angle]) => {
      const p = players.find((item) => item.id === pid);
      return {
        id: pid,
        name: p?.name || '?',
        color: p?.avatar_color || '#ffca3a',
        angle: Number(angle),
      };
    }
  );
  const partyGamesCatalog: { id: PartyGameId; emoji: string; name_ar: string; name_en: string; desc_ar: string; desc_en: string }[] = [
    {
      id: 'wavelength',
      emoji: '🎯',
      name_ar: 'عَ نفس الموجة',
      name_en: 'Wavelength',
      desc_ar: 'تخاطر المؤشر والمقاييس',
      desc_en: 'Telepathic dial & spectrums',
    },
    {
      id: 'chameleon',
      emoji: '🕵️‍♂️',
      name_ar: 'برّا السالفة',
      name_en: 'Chameleon',
      desc_ar: 'اكشف الجاسوس بينكم!',
      desc_en: 'Spot the hidden impostor!',
    },
    {
      id: 'ito',
      emoji: '🔢',
      name_ar: 'تخاطر الأرقام',
      name_en: 'Ito (1-100)',
      desc_ar: 'رتبوا أرقامكم السرية 1-100',
      desc_en: 'Sort secret numbers 1-100',
    },
    {
      id: 'fibbage',
      emoji: '🤥',
      name_ar: 'كذّاب بس مقنع',
      name_en: 'Fibbage',
      desc_ar: 'ألّف كذبة واخدع الشلة!',
      desc_en: 'Bluff your friends with lies!',
    },
    {
      id: 'wordbomb',
      emoji: '💣',
      name_ar: 'قنبلة الحروف',
      name_en: 'Word Bomb',
      desc_ar: 'هات كلمة بسرعة قبل الانفجار!',
      desc_en: 'Type a word before it explodes!',
    },
  ];

  return (
    <div className="min-h-[100dvh] flex flex-col justify-between pb-8 relative">
      {/* Floating Live Emoji Reactions */}
      <div className="fixed inset-0 pointer-events-none z-40 overflow-hidden">
        {reactions.map((r) => (
          <div
            key={r.id}
            style={{ left: `${r.x}%` }}
            className="absolute bottom-16 animate-bounce flex flex-col items-center"
          >
            <span className="text-4xl drop-shadow-[0_4px_0_#161426]">{r.emoji}</span>
            {r.sender && (
              <span className="text-xs font-extrabold bg-[#161426] text-[#ffca3a] px-2 py-0.5 rounded-full border-2 border-white">
                {r.sender}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Top Cartoon Header Bar */}
      <header className="w-full max-w-6xl mx-auto px-4 pt-4 pb-2 flex items-center justify-between gap-2">
        <div
          onClick={() => {
            if (room) handleLeaveRoom();
          }}
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          {/* Mini Cartoon Wheel Emblem */}
          <div className="w-12 h-12 rounded-2xl bg-[#ff595e] border-4 border-[#161426] shadow-[0_5px_0_#161426] flex items-center justify-center group-hover:scale-105 transition-transform">
            <Target weight="fill" className="w-7 h-7 text-[#ffca3a]" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[#fff9ec] drop-shadow-[0_3px_0_#161426] leading-none">
              {t.appTitle}
            </h1>
            <span className="text-xs font-bold text-[#ffca3a] block">Wavelength Online</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowHowToPlay(true)}
            className="cartoon-btn bg-[#ffca3a] text-[#161426] px-3.5 py-2 text-sm md:text-base flex items-center gap-1.5"
          >
            <Question weight="fill" className="w-5 h-5" />
            <span className="hidden sm:inline">{t.howToPlay}</span>
          </button>

          <button
            type="button"
            onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
            className="cartoon-btn bg-[#00bbf9] text-[#161426] px-3.5 py-2 text-sm md:text-base flex items-center gap-1.5"
          >
            <Globe weight="bold" className="w-5 h-5" />
            <span>{t.langToggle}</span>
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

      {/* MAIN CONTENT */}
      <main className="w-full max-w-6xl mx-auto px-4 flex-1 flex flex-col justify-center my-2">
        {!room ? (
          /* ================= HOME SCREEN / LANDING ================= */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-center my-auto py-3">
            {/* Left / Interactive Party Games Showcase Column */}
            <div className="lg:col-span-7 flex flex-col items-center text-center space-y-4">
              {/* Sleek Pill Dock to Switch Between the 5 Party Games */}
              <div className="w-full max-w-2xl bg-[#231f42]/95 p-2 rounded-3xl border-4 border-[#120f29] shadow-[0_6px_0_#120f29]">
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                  {partyGamesCatalog.map((g) => {
                    const isPicked = homeSelectedGame === g.id;
                    return (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => setHomeSelectedGame(g.id)}
                        className={`px-2.5 py-2.5 rounded-2xl font-extrabold text-xs sm:text-sm flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                          isPicked
                            ? 'bg-[#ffca3a] text-[#161426] border-3 border-[#161426] shadow-[0_4px_0_#161426] -translate-y-0.5'
                            : 'text-[#fff9ec]/85 hover:bg-[#2f2959] hover:text-white border-3 border-transparent'
                        }`}
                      >
                        <span className="text-2xl leading-none drop-shadow-sm">{g.emoji}</span>
                        <span className="leading-tight truncate max-w-full">
                          {lang === 'ar' ? g.name_ar : g.name_en}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Dynamic Interactive Hero Preview for Each Game */}
              <div className="w-full max-w-[490px] min-h-[300px] flex flex-col items-center justify-center">
                {homeSelectedGame === 'wavelength' && (
                  <div className="w-full animate-in fade-in zoom-in-95 duration-200">
                    <WavelengthWheel
                      targetAngle={18}
                      dialAngle={demoDialAngle}
                      showTarget={true}
                      canMoveDial={true}
                      onDialChange={(a) => setDemoDialAngle(a)}
                      lang={lang}
                    />
                  </div>
                )}

                {homeSelectedGame === 'chameleon' && (
                  <div className="w-full rounded-3xl bg-[#5c73b8] border-4 border-[#161426] shadow-[0_8px_0_#161426] p-5 text-white animate-in fade-in zoom-in-95 duration-200 space-y-3">
                    <div className="flex items-center justify-between text-xs font-extrabold">
                      <span className="px-3 py-1 rounded-full bg-white/20 border border-white/30">
                        🍔 {lang === 'ar' ? 'أكل ومطاعم' : 'Food & Dining'}
                      </span>
                      <span className="px-3 py-1 rounded-full bg-[#ff595e] border-2 border-[#161426] shadow-[0_2px_0_#161426]">
                        🕵️‍♂️ {lang === 'ar' ? 'واحد بينكم برّا السالفة!' : '1 Impostor Among You!'}
                      </span>
                    </div>

                    <div className="flex items-center justify-center gap-4 py-2">
                      <div className="flex flex-col items-center">
                        <div className="w-20 h-20 rounded-full bg-[#dce3f2] border-4 border-[#ffca3a] shadow-[0_4px_0_#161426] flex items-center justify-center text-4xl">
                          🦊
                        </div>
                        <span className="-mt-2.5 px-3.5 py-0.5 rounded-full bg-[#ffca3a] text-[#161426] border-2 border-[#161426] font-extrabold text-xs">
                          {lang === 'ar' ? 'زيد' : 'Zaid'}
                        </span>
                      </div>

                      <div className="flex flex-col items-center">
                        <span className="text-xs font-extrabold uppercase bg-[#161426]/40 px-2.5 py-1 rounded-full">
                          {lang === 'ar' ? 'يسأل 🎤' : 'asks 🎤'}
                        </span>
                        <span className="text-2xl font-extrabold text-[#ffca3a] mt-1">
                          {lang === 'ar' ? '⬅️' : '➡️'}
                        </span>
                      </div>

                      <div className="flex flex-col items-center">
                        <div className="w-20 h-20 rounded-full bg-[#eef1f8] border-4 border-[#ff595e] shadow-[0_4px_0_#161426] flex items-center justify-center text-4xl">
                          🐼
                        </div>
                        <span className="-mt-2.5 px-3.5 py-0.5 rounded-full bg-[#ff595e] text-white border-2 border-[#161426] font-extrabold text-xs">
                          {lang === 'ar' ? 'نور' : 'Noor'}
                        </span>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-2xl bg-[#161426]/35 text-xs md:text-sm font-bold text-white/95">
                      {lang === 'ar'
                        ? 'اسألوا بعض بالترتيب بدون ما تفضحوا الكلمة السرية، وصوّتوا عالجاسوس قبل ما يحزر السالفة!'
                        : 'Question each other carefully without spoiling the secret word, then vote out the impostor!'}
                    </div>
                  </div>
                )}

                {homeSelectedGame === 'ito' && (
                  <div className="w-full rounded-3xl bg-[#25204d] border-4 border-[#161426] shadow-[0_8px_0_#161426] p-5 text-white animate-in fade-in zoom-in-95 duration-200 space-y-4">
                    <div className="inline-block cartoon-badge bg-[#00bbf9] text-[#161426] px-4 py-1 text-xs">
                      🔢 {lang === 'ar' ? 'المقياس: أشياء بتعصّب من 1 لـ 100' : 'Scale: Annoying Things (1 to 100)'}
                    </div>

                    <div className="grid grid-cols-3 gap-2.5 pt-1">
                      {[
                        { num: '14', clueAr: 'نت بطيء شوي', clueEn: 'Slow Wi-Fi', bg: '#8ac926' },
                        { num: '58', clueAr: 'زحمة طريق الصبح', clueEn: 'Morning Traffic', bg: '#ffca3a' },
                        { num: '96', clueAr: 'يطفي جوالك 1%', clueEn: 'Phone dies at 1%', bg: '#ff595e' },
                      ].map((card, i) => (
                        <div
                          key={i}
                          style={{ backgroundColor: card.bg }}
                          className="p-3 rounded-2xl border-3 border-[#161426] shadow-[0_4px_0_#161426] text-[#161426] flex flex-col items-center justify-between"
                        >
                          <span className="text-2xl md:text-3xl font-extrabold">#{card.num}</span>
                          <span className="text-[11px] md:text-xs font-extrabold bg-white/90 px-2 py-1 rounded-xl border-2 border-[#161426] mt-2 w-full">
                            &ldquo;{lang === 'ar' ? card.clueAr : card.clueEn}&rdquo;
                          </span>
                        </div>
                      ))}
                    </div>

                    <p className="text-xs md:text-sm font-bold text-[#d9d4f7]">
                      {lang === 'ar'
                        ? 'كل لاعب بيطلعله رقم سري من 1 لـ 100! أوصف رقمك بتلميح ذكي ورتبوا بطاقاتكم تصاعدياً!'
                        : 'Everyone gets a secret number 1–100! Give a clever clue and sort everyone in order!'}
                    </p>
                  </div>
                )}

                {homeSelectedGame === 'fibbage' && (
                  <div className="w-full rounded-3xl bg-[#fff9ec] border-4 border-[#161426] shadow-[0_8px_0_#161426] p-5 text-[#161426] animate-in fade-in zoom-in-95 duration-200 space-y-3">
                    <div className="p-3 rounded-2xl bg-[#191636] text-white border-3 border-[#161426]">
                      <span className="text-[11px] font-extrabold text-[#ffca3a] uppercase block">
                        🤥 {lang === 'ar' ? 'سؤال حقيقي غريب' : 'Weird True Fact'}
                      </span>
                      <p className="text-sm md:text-base font-extrabold mt-0.5">
                        {lang === 'ar'
                          ? 'في سويسرا، ممنوع قانونياً تربي حيوان واحد بس من ___ لأنه بيشعر بالوحدة!'
                          : 'In Switzerland, it is illegal to own just one ___ because they get lonely!'}
                      </p>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-xs font-extrabold">
                      <div className="p-2.5 rounded-xl bg-[#ffe4e6] border-3 border-[#161426]">
                        🦩 {lang === 'ar' ? 'طائر الفلامنغو' : 'Flamingo'}
                        <span className="block text-[10px] text-[#ff595e] mt-0.5">
                          {lang === 'ar' ? 'كذبة سارة 🤥' : "Sara's Lie 🤥"}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-[#8ac926] border-3 border-[#161426]">
                        🐹 {lang === 'ar' ? 'خنزير غينيا' : 'Guinea Pig'}
                        <span className="block text-[10px] text-[#161426] mt-0.5">
                          {lang === 'ar' ? 'الجواب الصح ✅' : 'Real Truth ✅'}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-[#ffe4e6] border-3 border-[#161426]">
                        🦥 {lang === 'ar' ? 'حيوان الكسلان' : 'Sloth'}
                        <span className="block text-[10px] text-[#ff595e] mt-0.5">
                          {lang === 'ar' ? 'كذبة عمر 🤥' : "Omar's Lie 🤥"}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {homeSelectedGame === 'wordbomb' && (
                  <div className="w-full rounded-3xl bg-[#25204d] border-4 border-[#161426] shadow-[0_8px_0_#161426] p-5 text-white animate-in fade-in zoom-in-95 duration-200 space-y-3">
                    <div className="flex items-center justify-center gap-4">
                      <div className="w-20 h-20 rounded-full bg-[#ff595e] border-4 border-[#161426] shadow-[0_5px_0_#161426] flex items-center justify-center text-5xl animate-bounce">
                        💣
                      </div>
                      <div className="text-right">
                        <span className="cartoon-badge bg-[#ffca3a] text-[#161426] px-3 py-0.5 text-xs">
                          ⏱️ {lang === 'ar' ? 'قبل الانفجار!' : 'Beat the Timer!'}
                        </span>
                        <div className="text-xl md:text-2xl font-extrabold mt-1">
                          {lang === 'ar' ? 'كلمة فيها الحروف:' : 'Word containing:'}{' '}
                          <span className="text-[#ffca3a] bg-[#161426] px-3 py-0.5 rounded-xl border-2 border-[#ffca3a]">
                            {lang === 'ar' ? 'ب ر' : 'B R'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap justify-center gap-2 pt-1">
                      {(lang === 'ar'
                        ? ['⚡ برتقال', '⚡ بركان', '⚡ قبرص', '⚡ مبرد']
                        : ['⚡ BRIDGE', '⚡ COBRA', '⚡ BRAIN']
                      ).map((w, i) => (
                        <span
                          key={i}
                          className="cartoon-badge bg-[#8ac926] text-[#161426] px-3 py-1 text-xs"
                        >
                          {w}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Headline & Feature Pills */}
              <div className="max-w-lg space-y-2">
                <h2 className="text-2xl md:text-4xl font-extrabold text-[#ffca3a] drop-shadow-[0_4px_0_#161426]">
                  {lang === 'ar'
                    ? `${partyGamesCatalog.find((g) => g.id === homeSelectedGame)?.emoji} ${
                        partyGamesCatalog.find((g) => g.id === homeSelectedGame)?.name_ar
                      }`
                    : `${partyGamesCatalog.find((g) => g.id === homeSelectedGame)?.emoji} ${
                        partyGamesCatalog.find((g) => g.id === homeSelectedGame)?.name_en
                      }`}
                </h2>
                <p className="text-sm md:text-base text-[#d9d4f7] font-semibold">
                  {lang === 'ar'
                    ? 'افتح غرفة مجانية بثانية، ابعت الرابط لأصحابك، وبدّلوا بين 5 ألعاب جماعية بنفس الغرفة ونفس الـ Leaderboard!'
                    : 'Create a free room in one click, invite friends, and switch between 5 party games with one shared Leaderboard!'}
                </p>
              </div>
            </div>

            {/* Right / Cartoon Action Card */}
            <div className="lg:col-span-5">
              <div className="cartoon-card p-6 md:p-7 space-y-5 relative">
                {/* Selected Game Indicator Pill at Top of Form */}
                <div className="flex items-center justify-between bg-[#fff1c2] border-3 border-[#161426] rounded-2xl px-3.5 py-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">
                      {partyGamesCatalog.find((g) => g.id === homeSelectedGame)?.emoji}
                    </span>
                    <div className=" leading-tight">
                      <span className="text-[11px] font-bold text-[#3f3b5c] block">
                        {lang === 'ar' ? 'اللعبة المختارة للبدء:' : 'Selected Starting Game:'}
                      </span>
                      <span className="text-sm font-extrabold text-[#161426]">
                        {lang === 'ar'
                          ? partyGamesCatalog.find((g) => g.id === homeSelectedGame)?.name_ar
                          : partyGamesCatalog.find((g) => g.id === homeSelectedGame)?.name_en}
                      </span>
                    </div>
                  </div>
                  <span className="cartoon-badge bg-[#8ac926] text-[#161426] px-2.5 py-0.5 text-[11px]">
                    {lang === 'ar' ? '5 ألعاب بالغرفة' : '5-in-1 Room'}
                  </span>
                </div>

                {errorMsg && (
                  <div className="p-3 rounded-2xl bg-[#ff595e] text-white border-3 border-[#161426] font-extrabold text-sm text-center">
                    {errorMsg}
                  </div>
                )}

                {/* Player Name Input */}
                <div>
                  <label className="block text-base font-extrabold text-[#161426] mb-1.5">
                    {t.yourName}
                  </label>
                  <input
                    type="text"
                    maxLength={18}
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    placeholder={t.namePlaceholder}
                    className="cartoon-input w-full px-4 py-3 bg-white text-[#161426] text-lg focus:outline-none focus:ring-4 focus:ring-[#ffca3a]"
                  />
                </div>

                {/* Cartoon Avatar Color Picker */}
                <div>
                  <label className="block text-sm font-extrabold text-[#161426] mb-2.5">
                    {t.chooseColor}
                  </label>
                  <div className="grid grid-cols-8 gap-2 place-items-center">
                    {CARTOON_AVATAR_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => {
                          setPlayerColor(c);
                          setLocalPlayerColor(c);
                        }}
                        style={{ backgroundColor: c }}
                        className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full border-3 border-[#161426] transition-transform cursor-pointer ${
                          playerColor === c
                            ? 'scale-115 shadow-[0_3px_0_#161426] ring-3 ring-[#161426]'
                            : 'opacity-80 hover:opacity-100'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Create Online Room CTA */}
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleCreateRoom}
                  className="cartoon-btn w-full py-3.5 px-5 bg-[#8ac926] hover:bg-[#9be02f] text-[#161426] text-xl flex items-center justify-center gap-2.5"
                >
                  <GameController weight="fill" className="w-7 h-7" />
                  <span>{loading ? '...' : t.createRoom}</span>
                </button>

                {/* Divider */}
                <div className="flex items-center gap-3">
                  <div className="h-1 bg-[#161426]/20 flex-1 rounded-full" />
                  <span className="font-extrabold text-xs text-[#161426]/60 uppercase">
                    {lang === 'ar' ? 'أو عندك كود غرفة؟' : 'OR JOIN ROOM'}
                  </span>
                  <div className="h-1 bg-[#161426]/20 flex-1 rounded-full" />
                </div>

                {/* Join Room Form */}
                <form onSubmit={handleJoinRoom} className="flex items-stretch gap-2.5 w-full">
                  <input
                    type="text"
                    maxLength={6}
                    value={joinCodeInput}
                    onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                    placeholder={lang === 'ar' ? 'كود الغرفة (WAVE)' : 'Room Code (WAVE)'}
                    className="cartoon-input min-w-0 flex-1 px-3 py-2.5 bg-white text-[#161426] text-center font-extrabold text-base sm:text-lg focus:outline-none focus:ring-4 focus:ring-[#ffca3a]"
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="cartoon-btn bg-[#ffca3a] hover:bg-[#ffd55a] text-[#161426] px-4 sm:px-5 py-2.5 text-base sm:text-lg shrink-0 whitespace-nowrap"
                  >
                    {t.joinBtn}
                  </button>
                </form>

                {/* Pass & Play Same Device Mode */}
                <button
                  type="button"
                  onClick={handleStartPassAndPlay}
                  className="cartoon-btn w-full py-3 px-4 bg-[#00bbf9] hover:bg-[#33c9fa] text-[#161426] text-base flex items-center justify-center gap-2"
                >
                  <DeviceMobile weight="fill" className="w-6 h-6" />
                  <span>{t.passAndPlay}</span>
                </button>
              </div>
            </div>
          </div>
        ) : room.status === 'lobby' ? (
          /* ================= ONLINE ROOM LOBBY ================= */
          <div className="max-w-3xl mx-auto w-full space-y-5 my-auto">
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

                <button
                  type="button"
                  onClick={() => setShowCustomCardModal(true)}
                  className="cartoon-btn bg-[#ff924c] text-[#161426] px-4 py-2.5 flex items-center gap-1.5 text-base"
                >
                  <Plus weight="bold" className="w-5 h-5" />
                  <span>{t.addCustomCard}</span>
                </button>
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

                  {room.mode === 'teams' && (
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
                          {room.mode === 'teams' && (
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
                  {/* Choose Party Game */}
                  <div>
                    <label className="block font-extrabold text-sm text-[#161426] mb-2">
                      🎮 {lang === 'ar' ? 'اختار اللعبة للشلّة:' : 'Pick Party Game:'}
                    </label>
                    <div className="grid grid-cols-1 gap-2">
                      {partyGamesCatalog.map((g) => (
                        <button
                          key={g.id}
                          type="button"
                          disabled={!isHost}
                          onClick={() => handleSelectPartyGame(g.id)}
                          className={`cartoon-btn py-2 px-3 text-start flex items-center justify-between ${
                            activeGameId === g.id
                              ? 'bg-[#ffca3a] text-[#161426]'
                              : 'bg-white text-[#161426]'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{g.emoji}</span>
                            <div>
                              <div className="font-extrabold text-sm leading-tight">
                                {lang === 'ar' ? g.name_ar : g.name_en}
                              </div>
                              <div className="text-[11px] font-bold opacity-75">
                                {lang === 'ar' ? g.desc_ar : g.desc_en}
                              </div>
                            </div>
                          </div>
                          {activeGameId === g.id && (
                            <Check weight="bold" className="w-5 h-5 shrink-0" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {activeGameId === 'wavelength' && (
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
                          <span>🎉 {t.coopMode}</span>
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
                          <span>⚔️ {t.teamsMode}</span>
                          {room.mode === 'teams' && <Check weight="bold" className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>
                  )}

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
                <div className="text-5xl font-extrabold my-1">
                  {room.coop_score}{' '}
                  <span className="text-xl text-[#00bbf9]">/ {room.max_rounds * 4}</span>
                </div>
                <p className="text-sm font-bold text-[#d9d4f7] mt-2">
                  {room.coop_score >= room.max_rounds * 3
                    ? lang === 'ar'
                      ? 'أساطير التخاطر! عقولكم متصلة 100%!'
                      : 'Telepathic Legends! Your minds are 100% synced!'
                    : lang === 'ar'
                    ? 'جولة ممتعة! جربوا كمان مرة لتكسروا الرقم القياسي!'
                    : 'Great game! Play again to beat your high score!'}
                </p>
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
          <div className="w-full space-y-3">
            {/* Instant Party Game Switcher Bar (Host or Pass & Play can switch games anytime with the same group!) */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {partyGamesCatalog.map((g) => {
                const isSelected = activeGameId === g.id;
                return (
                  <button
                    key={g.id}
                    type="button"
                    disabled={!isHost && !isPassAndPlay}
                    onClick={() => handleSelectPartyGame(g.id)}
                    className={`cartoon-btn px-3.5 py-2 text-xs md:text-sm flex items-center gap-1.5 shrink-0 ${
                      isSelected
                        ? 'bg-[#ffca3a] text-[#161426]'
                        : 'bg-[#25204d] text-[#fff9ec]'
                    }`}
                  >
                    <span className="text-base">{g.emoji}</span>
                    <span>{lang === 'ar' ? g.name_ar : g.name_en}</span>
                  </button>
                );
              })}
            </div>

            {/* Score & Round Status Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 bg-[#25204d] border-4 border-[#120f29] shadow-[0_6px_0_#120f29] rounded-2xl px-4 py-2.5">
              <div className="flex items-center gap-2.5">
                <span className="cartoon-badge bg-[#ffca3a] text-[#161426] px-3.5 py-1 text-sm">
                  {t.round} {room.round_number} {t.of} {room.max_rounds}
                </span>

                {!isPassAndPlay && (
                  <button
                    type="button"
                    onClick={copyInviteLink}
                    className="cartoon-badge bg-[#191636] text-[#00bbf9] px-3 py-1 text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <span>#{room.code}</span>
                    {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                )}
              </div>

              {/* Psychic Indicator */}
              <div className="flex items-center gap-2 text-sm font-extrabold">
                <Sparkle weight="fill" className="w-5 h-5 text-[#ff924c]" />
                <span>{t.psychicRole}:</span>
                <span className="text-[#ffca3a]">
                  {isPassAndPlay
                    ? lang === 'ar'
                      ? 'اللاعب الحالي'
                      : 'Current Psychic'
                    : psychicPlayer?.name || '...'}
                </span>
              </div>

              {/* Score Readout */}
              {room.mode === 'coop' ? (
                <div className="cartoon-badge bg-[#8ac926] text-[#161426] px-4 py-1 text-sm flex items-center gap-1.5">
                  <Trophy weight="fill" className="w-4 h-4" />
                  <span>
                    {t.totalScore}: {room.coop_score}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="cartoon-badge bg-[#ff924c] text-[#161426] px-3 py-0.5 text-sm">
                    {t.teamA}: {room.team_a_score}
                  </span>
                  <span className="cartoon-badge bg-[#00bbf9] text-[#161426] px-3 py-0.5 text-sm">
                    {t.teamB}: {room.team_b_score}
                  </span>
                </div>
              )}
            </div>

            {/* MAIN 2-COLUMN GAMEPLAY + LEADERBOARD GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Primary Game Column */}
              <div className="lg:col-span-8 space-y-3">
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
                ) : activeGameId === 'fibbage' ? (
                  <FibbageGame
                    gameData={
                      room.game_data?.questionId
                        ? room.game_data
                        : (buildInitialGameData('fibbage', players) as FibbageGameState)
                    }
                    players={players}
                    myPlayerId={playerId}
                    isHost={isHost}
                    isPassAndPlay={isPassAndPlay}
                    lang={lang}
                    onUpdateGameData={handleUpdateMiniGameData}
                    onStartNewRound={() => handleSelectPartyGame('fibbage')}
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
                ) : (
                  <>
                    {/* Clue Display Banner (when Clue has been given) */}
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

                    {/* Secret Target Toggle for Psychic */}
                    {isPsychic && room.status === 'psychic_clue' && !psychicCurtainOpen && (
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

                    {/* THE WAVELENGTH WHEEL */}
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

                    {/* THE SPECTRUM CARD */}
                    <SpectrumCard
                      leftText={leftCardText}
                      rightText={rightCardText}
                      lang={lang}
                      canSwap={room.status === 'psychic_clue' && isPsychic}
                      onSwap={handleSwapCard}
                    />

                    {/* PHASE ACTION PANEL */}
                    <div className="max-w-xl mx-auto w-full pt-2">
                      {room.status === 'psychic_clue' && (
                        isPsychic ? (
                          <form
                            onSubmit={handleSubmitClue}
                            className="cartoon-card p-5 space-y-3 text-center"
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
                            <div className="text-xl font-extrabold text-[#ffca3a] animate-pulse">
                              🔮 {psychicPlayer?.name || t.psychicRole} {t.waitingForPsychic}
                            </div>
                          </div>
                        )
                      )}

                      {room.status === 'guessing' && (
                        <div className="cartoon-card p-5 text-center space-y-3.5">
                          {canDragDial ? (
                            <>
                              <p className="font-extrabold text-base text-[#161426]">
                                {isPassAndPlay && nextPassAndPlayGuesser
                                  ? lang === 'ar'
                                    ? `🎯 دور (${nextPassAndPlayGuesser.name}) ليحرك المؤشر ويثبت تخمينه الشخصي!`
                                    : `🎯 ${nextPassAndPlayGuesser.name}'s turn to move the pointer and lock their guess!`
                                  : hasLockedMyGuess
                                  ? lang === 'ar'
                                    ? `✅ ثبتت تخمينك على (${wavelengthGuesses[playerId]}°)! فيك تعدله قبل ما يخلصوا الباقين:`
                                    : `✅ Locked your guess at (${wavelengthGuesses[playerId]}°)! You can still adjust it:`
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
                                      ? 'تحديث تخميني الشخصي 🔄'
                                      : 'Update My Personal Guess 🔄'
                                    : lang === 'ar'
                                    ? 'تثبيت تخميني الشخصي! 🎯'
                                    : 'Lock My Personal Guess! 🎯'}
                                </span>
                              </button>
                            </>
                          ) : (
                            <p className="font-extrabold text-base text-[#161426]">
                              👀 {t.psychicWatchingInstruction}
                            </p>
                          )}

                          {/* Live Player Guessing Progress Badges */}
                          {room.mode === 'coop' && expectedWavelengthGuessers.length > 0 && (
                            <div className="pt-2 border-t-2 border-[#161426]/15 space-y-2">
                              <div className="text-xs font-extrabold text-[#3f3b5c]">
                                {lang === 'ar'
                                  ? `حالة تخمينات اللاعبين (${Object.keys(wavelengthGuesses).length} / ${expectedWavelengthGuessers.length}):`
                                  : `Players Guessed (${Object.keys(wavelengthGuesses).length} / ${expectedWavelengthGuessers.length}):`}
                              </div>
                              <div className="flex flex-wrap items-center justify-center gap-2">
                                {expectedWavelengthGuessers.map((gp) => {
                                  const locked =
                                    typeof wavelengthGuesses[gp.id] === 'number';
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
                                      <span>{locked ? '✓ جاوب' : '⏳ عم يفكر'}</span>
                                    </span>
                                  );
                                })}
                              </div>

                              {/* Host / Psychic Force Reveal if at least 1 person answered */}
                              {(isHost || isPsychic) &&
                                Object.keys(wavelengthGuesses).length > 0 && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      performMultiPlayerReveal(wavelengthGuesses)
                                    }
                                    className="cartoon-btn bg-[#00bbf9] text-[#161426] px-4 py-2 text-sm mt-2"
                                  >
                                    {lang === 'ar'
                                      ? 'اكشف النتيجة الآن (بمن جاوب) 🎉'
                                      : 'Reveal Results Now 🎉'}
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
                        </div>
                      )}

                      {room.status === 'reveal' && (
                        <div className="cartoon-card p-5 text-center space-y-3.5 animate-in zoom-in-95 duration-200">
                          <div className="text-3xl font-extrabold text-[#161426]">
                            {room.last_round_points === 4
                              ? `🎯 ${t.bullseye}`
                              : room.last_round_points === 3
                              ? `🔥 ${t.greatJob}`
                              : room.last_round_points === 2
                              ? `👍 ${t.goodTry}`
                              : `😅 ${t.missed}`}
                          </div>

                          {/* Individual Player Results Breakdown */}
                          {Object.keys(wavelengthGuesses).length > 0 && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                              {Object.entries(wavelengthGuesses).map(
                                ([pid, guessedAng]) => {
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
                                            backgroundColor:
                                              p?.avatar_color || '#ffca3a',
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
                                }
                              )}
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

                {/* Live Cartoon Reaction Bar + Custom Card Trigger */}
                <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                  {['🎯', '🔥', '😂', '🤯', '👏', '🤔'].map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => sendEmojiReaction(emoji)}
                      className="cartoon-btn bg-[#25204d] hover:bg-[#322b66] text-2xl w-12 h-12 flex items-center justify-center"
                    >
                      {emoji}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setShowCustomCardModal(true)}
                    className="cartoon-btn bg-[#ffca3a] text-[#161426] px-3.5 h-12 text-sm flex items-center gap-1"
                  >
                    <Plus weight="bold" className="w-4 h-4" />
                    <span>{t.addCustomCard}</span>
                  </button>
                </div>
              </div>

              {/* LEADERBOARD SIDEBAR (Sits on the left side in RTL) */}
              <aside className="lg:col-span-4 lg:sticky lg:top-4 cartoon-panel-dark p-5 space-y-4">
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

                {/* Room / Teams Score Summary */}
                {room.mode === 'coop' ? (
                  <div className="p-3.5 rounded-2xl bg-[#191636] border-3 border-[#120f29] flex items-center justify-between">
                    <span className="text-sm font-extrabold text-[#d9d4f7]">
                      {t.roomTotalProgress}
                    </span>
                    <span className="cartoon-badge bg-[#8ac926] text-[#161426] px-3 py-0.5 text-base">
                      {room.coop_score} / {room.max_rounds * 4}
                    </span>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="p-3 rounded-2xl bg-[#ff924c] text-[#161426] border-3 border-[#161426] text-center">
                      <div className="text-xs font-extrabold">{t.teamA}</div>
                      <div className="text-2xl font-extrabold">{room.team_a_score}</div>
                    </div>
                    <div className="p-3 rounded-2xl bg-[#00bbf9] text-[#161426] border-3 border-[#161426] text-center">
                      <div className="text-xs font-extrabold">{t.teamB}</div>
                      <div className="text-2xl font-extrabold">{room.team_b_score}</div>
                    </div>
                  </div>
                )}

                {/* Ranked Players List */}
                <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-0.5">
                  {[...players]
                    .sort((a, b) => (b.score || 0) - (a.score || 0))
                    .map((p, index) => {
                      const isCurrentPsychic = p.id === room.psychic_id;
                      const rankMedal =
                        index === 0
                          ? '🥇'
                          : index === 1
                          ? '🥈'
                          : index === 2
                          ? '🥉'
                          : `#${index + 1}`;
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
                            <span className="text-lg font-extrabold w-6 text-center shrink-0">
                              {rankMedal}
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

                {/* In Pass & Play mode, allow adding players right inside the Leaderboard */}
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
                    {/* Round Pill */}
                    <div className="inline-flex items-center gap-2 cartoon-badge bg-[#00bbf9] text-[#161426] px-4 py-1 text-sm">
                      <Sparkle weight="fill" className="w-4 h-4" />
                      <span>
                        {t.round} {room.round_number} {t.of} {room.max_rounds}
                      </span>
                    </div>

                    {/* Bouncing Cartoon Eye-Slash & Crystal Ball */}
                    <motion.div
                      animate={{ y: [0, -10, 0], rotate: [0, -4, 4, 0] }}
                      transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                      className="w-24 h-24 rounded-3xl bg-[#ff595e] border-4 border-[#161426] shadow-[0_7px_0_#161426] flex items-center justify-center mx-auto"
                    >
                      <EyeSlash weight="fill" className="w-14 h-14 text-[#ffca3a]" />
                    </motion.div>

                    {/* Title */}
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

                    {/* Big Cartoon Warning Box */}
                    <div className="p-4 rounded-2xl bg-[#ffca3a] border-4 border-[#161426] shadow-[0_5px_0_#161426] text-[#161426] font-extrabold text-base md:text-lg leading-relaxed">
                      🙈 {t.psychicCurtainWarning}
                    </div>

                    <p className="text-sm font-bold text-[#3f3b5c]">
                      {t.psychicCurtainSub}
                    </p>

                    {/* Reveal Button */}
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
        onClose={() => setShowHowToPlay(false)}
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
