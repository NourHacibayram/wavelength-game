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
import { WavelengthWheel } from './components/WavelengthWheel';
import { SpectrumCard } from './components/SpectrumCard';
import { HowToPlayModal, CustomCardModal } from './components/Modals';
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
  const [clueInput, setClueInput] = useState<string>('');
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

  // Sync liveDialAngle when room.dial_angle updates from DB
  useEffect(() => {
    if (room) {
      setLiveDialAngle(Number(room.dial_angle) || 0);
    }
  }, [room?.dial_angle, room?.round_number, room?.status]);

  // Trigger Psychic Safety Curtain at the start of every psychic_clue phase
  useEffect(() => {
    if (room?.status === 'psychic_clue') {
      setLocalPeekTarget(false);
      setPsychicCurtainOpen(true);
    } else {
      setPsychicCurtainOpen(false);
    }
  }, [room?.status, room?.round_number]);

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
          if (data) setPlayers(data as PlayerItem[]);
        }
      )
      .on('broadcast', { event: 'dial_move' }, ({ payload }) => {
        if (payload && typeof payload.angle === 'number' && payload.senderId !== playerId) {
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
    setIsPassAndPlay(true);
    setLocalPeekTarget(false);
    setPsychicCurtainOpen(true);
    setClueInput('');
    setLiveDialAngle(0);
    setRoom({
      id: 'local_room',
      code: 'LOCAL',
      host_id: playerId,
      mode: 'coop',
      language: lang,
      status: 'psychic_clue',
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
      other_team_guess: null,
      coop_score: 0,
      team_a_score: 0,
      team_b_score: 0,
      last_round_points: 0,
      last_bonus_points: 0,
      used_card_indices: [firstCard.id],
      custom_cards: [],
    });
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
    const card = pickNextCard([], room.custom_cards);
    const target = generateRandomTargetAngle();
    const firstPsychic = players[0]?.id || playerId;
    setClueInput('');
    await updateRoomState({
      status: 'psychic_clue',
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
    });
    setClueInput('');
  };

  // Dial Change Handler (Realtime Broadcast + DB commit on release)
  const handleDialChange = async (newAngle: number, isFinal = false) => {
    setLiveDialAngle(newAngle);
    if (!room) return;

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
  };

  // Lock Team/Coop Guess
  const handleLockGuess = async () => {
    if (!room) return;
    if (room.mode === 'teams' && !isPassAndPlay) {
      await updateRoomState({
        dial_angle: liveDialAngle,
        status: 'left_right',
      });
    } else {
      await performReveal(liveDialAngle, null);
    }
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

    // Rotate Psychic to next player in list
    let nextPsychicId = playerId;
    if (!isPassAndPlay && players.length > 0) {
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
      <main className="w-full max-w-5xl mx-auto px-4 flex-1 flex flex-col justify-center my-2">
        {!room ? (
          /* ================= HOME SCREEN / LANDING ================= */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center my-auto py-4">
            {/* Left / Hero Preview Column */}
            <div className="lg:col-span-7 flex flex-col items-center text-center">
              <div className="w-full max-w-[470px]">
                <WavelengthWheel
                  targetAngle={18}
                  dialAngle={demoDialAngle}
                  showTarget={true}
                  canMoveDial={true}
                  onDialChange={(a) => setDemoDialAngle(a)}
                  lang={lang}
                />
              </div>

              <div className="mt-3 max-w-lg">
                <h2 className="text-2xl md:text-4xl font-extrabold text-[#ffca3a] drop-shadow-[0_4px_0_#161426]">
                  {t.appSubtitle}
                </h2>
                <p className="text-sm md:text-base text-[#d9d4f7] font-semibold mt-1">
                  {lang === 'ar'
                    ? 'افتح غرفة مجانية بثانية، ابعت الرابط لأصحابك، واختبروا لو عقولكم على نفس الموجة!'
                    : 'Create a free room in one click, share the link with friends, and test if your minds are on the same wavelength!'}
                </p>
              </div>
            </div>

            {/* Right / Cartoon Action Card */}
            <div className="lg:col-span-5">
              <div className="cartoon-card p-6 md:p-7 space-y-5">
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
                      <div className="flex items-center gap-2.5">
                        <div
                          style={{ backgroundColor: p.avatar_color }}
                          className="w-10 h-10 rounded-full border-3 border-[#161426] flex items-center justify-center font-extrabold text-[#161426] text-lg shrink-0"
                        >
                          {p.name.slice(0, 1).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-extrabold text-base flex items-center gap-1.5">
                            <span>{p.name}</span>
                            {p.id === room.host_id && (
                              <Crown weight="fill" className="w-4 h-4 text-[#ffca3a]" />
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
                    </div>
                  ))}
                </div>
              </div>

              {/* Host Settings Panel */}
              <div className="md:col-span-5 cartoon-card p-5 flex flex-col justify-between space-y-4">
                <div className="space-y-4">
                  <div>
                    <label className="block font-extrabold text-sm text-[#161426] mb-2">
                      {t.gameMode}
                    </label>
                    <div className="grid grid-cols-1 gap-2">
                      <button
                        type="button"
                        disabled={!isHost}
                        onClick={() => updateRoomState({ mode: 'coop' })}
                        className={`cartoon-btn py-2.5 px-3 text-sm flex items-center justify-between ${
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
                        className={`cartoon-btn py-2.5 px-3 text-sm flex items-center justify-between ${
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

            {/* Animated Cartoon Psychic Turn Curtain (Anti-Spoiler Overlay) */}
            <AnimatePresence>
              {room.status === 'psychic_clue' && isPsychic && psychicCurtainOpen && (
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
                      {!isPassAndPlay && psychicPlayer && (
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

            {/* THE WAVELENGTH WHEEL */}
            <WavelengthWheel
              targetAngle={Number(room.target_angle)}
              dialAngle={liveDialAngle}
              showTarget={shouldShowTarget}
              canMoveDial={canDragDial}
              onDialChange={handleDialChange}
              otherTeamGuess={room.other_team_guess}
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
                <div className="cartoon-card p-5 text-center space-y-3">
                  {canDragDial ? (
                    <>
                      <p className="font-extrabold text-base text-[#161426]">
                        {t.moveDialInstruction}
                      </p>
                      <button
                        type="button"
                        onClick={handleLockGuess}
                        className="cartoon-btn bg-[#ff595e] hover:bg-[#ff6f73] text-white w-full py-3.5 text-xl flex items-center justify-center gap-2"
                      >
                        <Target weight="fill" className="w-6 h-6" />
                        <span>
                          {room.mode === 'teams' && !isPassAndPlay
                            ? t.lockTeamGuess
                            : t.lockGuess}
                        </span>
                      </button>
                    </>
                  ) : (
                    <p className="font-extrabold text-base text-[#161426]">
                      👀 {t.psychicWatchingInstruction}
                    </p>
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
                <div className="cartoon-card p-5 text-center space-y-3 animate-in zoom-in-95 duration-200">
                  <div className="text-3xl font-extrabold text-[#161426]">
                    {room.last_round_points === 4
                      ? `🎯 ${t.bullseye}`
                      : room.last_round_points === 3
                      ? `🔥 ${t.greatJob}`
                      : room.last_round_points === 2
                      ? `👍 ${t.goodTry}`
                      : `😅 ${t.missed}`}
                  </div>

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
