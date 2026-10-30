import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 30,
    },
  },
});

const PLAYER_ID_KEY = 'wavelength_player_id_v1';
const PLAYER_NAME_KEY = 'wavelength_player_name_v1';
const PLAYER_COLOR_KEY = 'wavelength_player_color_v1';

export const CARTOON_AVATAR_COLORS = [
  '#ff595e', // Candy Red
  '#ff924c', // Bright Orange
  '#ffca3a', // Sunny Yellow
  '#8ac926', // Lime Green
  '#1982c4', // Sky Blue
  '#6a4c93', // Cartoon Purple
  '#ff6392', // Bubblegum Pink
  '#00bbf9', // Cyan Pop
];

export function getLocalPlayerId(): string {
  let id = localStorage.getItem(PLAYER_ID_KEY);
  if (!id) {
    id = 'p_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36).slice(-4);
    localStorage.setItem(PLAYER_ID_KEY, id);
  }
  return id;
}

export function getLocalPlayerName(): string {
  return localStorage.getItem(PLAYER_NAME_KEY) || '';
}

export function setLocalPlayerName(name: string): void {
  localStorage.setItem(PLAYER_NAME_KEY, name.trim());
}

export function getLocalPlayerColor(): string {
  let color = localStorage.getItem(PLAYER_COLOR_KEY);
  if (!color) {
    color = CARTOON_AVATAR_COLORS[Math.floor(Math.random() * CARTOON_AVATAR_COLORS.length)];
    localStorage.setItem(PLAYER_COLOR_KEY, color);
  }
  return color;
}

export function setLocalPlayerColor(color: string): void {
  localStorage.setItem(PLAYER_COLOR_KEY, color);
}

export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}
