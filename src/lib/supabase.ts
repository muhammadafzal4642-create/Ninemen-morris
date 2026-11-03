/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  applyCapture,
  applyMove,
  applyPlacement,
  createInitialGameState,
} from '../game/engine.ts';
import { GameState, PlayerId, PointId } from '../game/types.ts';

// Get Supabase credentials if provided
const envSupabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const envSupabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

let supabaseClient: SupabaseClient | null = null;

if (envSupabaseUrl && envSupabaseAnonKey && envSupabaseUrl !== 'MY_SUPABASE_URL') {
  try {
    supabaseClient = createClient(envSupabaseUrl, envSupabaseAnonKey);
  } catch (err) {
    console.warn('Failed to initialize Supabase client:', err);
  }
}

export function isSupabaseConfigured(): boolean {
  return !!supabaseClient;
}

// Generate human-friendly 6-character room codes (e.g. "NK-842")
export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `NK-${code}`;
}

export interface RoomRecord {
  id: string;
  code: string;
  host_id: string;
  host_name: string;
  guest_id: string | null;
  guest_name: string | null;
  host_side: PlayerId;
  status: 'waiting' | 'active' | 'completed' | 'abandoned';
  current_player: PlayerId;
  game_state: GameState;
  rematch_requested?: string | null;
}

// In-memory / Cross-tab Broadcast Channel fallback when Supabase keys are not yet configured
// This allows testing 2-player multiplayer across two browser tabs or windows immediately!
const localRooms: Map<string, RoomRecord> = new Map();
const localChannels: Map<string, BroadcastChannel> = new Map();

function getLocalChannel(code: string): BroadcastChannel {
  if (!localChannels.has(code)) {
    const channel = new BroadcastChannel(`navakankari_room_${code}`);
    localChannels.set(code, channel);
  }
  return localChannels.get(code)!;
}

/**
 * Create a new multiplayer room
 */
export async function createOnlineRoom(
  hostName: string,
  hostSide: PlayerId = 1
): Promise<{ room: RoomRecord; playerId: string }> {
  const code = generateRoomCode();
  const playerId = 'host_' + Math.random().toString(36).substring(2, 9);
  const initialState = createInitialGameState(hostName, 'Waiting for player...');

  const roomRecord: RoomRecord = {
    id: crypto.randomUUID?.() || 'rm_' + Date.now(),
    code,
    host_id: playerId,
    host_name: hostName,
    guest_id: null,
    guest_name: null,
    host_side: hostSide,
    status: 'waiting',
    current_player: 1,
    game_state: initialState,
  };

  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient
        .from('navakankari_rooms')
        .insert({
          code: roomRecord.code,
          host_id: roomRecord.host_id,
          host_name: roomRecord.host_name,
          host_side: roomRecord.host_side,
          status: 'waiting',
          current_player: 1,
          game_state: roomRecord.game_state,
        })
        .select()
        .single();

      if (error) {
        console.warn('Supabase room insert failed, falling back to local channel:', error);
      } else if (data) {
        roomRecord.id = data.id;
      }
    } catch (e) {
      console.warn('Supabase room insert exception:', e);
    }
  }

  localRooms.set(code, roomRecord);
  return { room: roomRecord, playerId };
}

/**
 * Join an existing multiplayer room using its room code
 */
export async function joinOnlineRoom(
  code: string,
  guestName: string
): Promise<{ room: RoomRecord | null; playerId: string; error?: string }> {
  const normalizedCode = code.trim().toUpperCase();
  const guestPlayerId = 'guest_' + Math.random().toString(36).substring(2, 9);

  let currentRoom: RoomRecord | null = null;

  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient
        .from('navakankari_rooms')
        .select('*')
        .eq('code', normalizedCode)
        .single();

      if (!error && data) {
        currentRoom = data as RoomRecord;
      }
    } catch (e) {
      console.warn('Supabase room lookup error:', e);
    }
  }

  // Check local fallback
  if (!currentRoom) {
    currentRoom = localRooms.get(normalizedCode) || null;
  }

  if (!currentRoom) {
    return { room: null, playerId: '', error: `Room ${normalizedCode} not found. Please check code.` };
  }

  if (currentRoom.guest_id && currentRoom.status !== 'waiting') {
    return { room: null, playerId: '', error: 'Room is already full with 2 players.' };
  }

  // Assign guest
  currentRoom.guest_id = guestPlayerId;
  currentRoom.guest_name = guestName;
  currentRoom.status = 'active';

  // Update game state player names
  const guestSide = currentRoom.host_side === 1 ? 2 : 1;
  currentRoom.game_state.players[currentRoom.host_side].name = currentRoom.host_name;
  currentRoom.game_state.players[guestSide].name = guestName;

  if (supabaseClient) {
    try {
      await supabaseClient
        .from('navakankari_rooms')
        .update({
          guest_id: currentRoom.guest_id,
          guest_name: currentRoom.guest_name,
          status: 'active',
          game_state: currentRoom.game_state,
          updated_at: new Date().toISOString(),
        })
        .eq('code', normalizedCode);
    } catch (e) {
      console.warn('Supabase room update error on join:', e);
    }
  }

  localRooms.set(normalizedCode, currentRoom);

  // Broadcast to host
  const bc = getLocalChannel(normalizedCode);
  bc.postMessage({ type: 'ROOM_UPDATE', room: currentRoom });

  return { room: currentRoom, playerId: guestPlayerId };
}

/**
 * Execute a validated move in the online room
 */
export async function submitOnlineAction(
  code: string,
  playerId: string,
  action:
    | { type: 'place'; point: PointId }
    | { type: 'move'; from: PointId; to: PointId }
    | { type: 'capture'; point: PointId }
): Promise<{ success: boolean; state?: GameState; error?: string }> {
  const normalizedCode = code.trim().toUpperCase();
  let room = localRooms.get(normalizedCode);

  if (supabaseClient) {
    try {
      const { data } = await supabaseClient
        .from('navakankari_rooms')
        .select('*')
        .eq('code', normalizedCode)
        .single();
      if (data) room = data as RoomRecord;
    } catch (e) {
      console.warn('Supabase room fetch error:', e);
    }
  }

  if (!room) {
    return { success: false, error: 'Room not found' };
  }

  const isHost = playerId === room.host_id;
  const isGuest = playerId === room.guest_id;
  if (!isHost && !isGuest) {
    return { success: false, error: 'You are not a participant in this room' };
  }

  const playerSide = isHost ? room.host_side : (room.host_side === 1 ? 2 : 1);
  const currentState = room.game_state;

  // Authoritative turn validation: Is it this player's turn?
  if (currentState.currentPlayer !== playerSide) {
    return { success: false, error: "Not your turn!" };
  }

  // Authoritative move validation via our game engine
  let newState: GameState;
  try {
    if (action.type === 'place') {
      newState = applyPlacement(currentState, action.point);
    } else if (action.type === 'move') {
      newState = applyMove(currentState, action.from, action.to);
    } else if (action.type === 'capture') {
      newState = applyCapture(currentState, action.point);
    } else {
      return { success: false, error: 'Invalid action type' };
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Illegal action';
    return { success: false, error: errorMsg };
  }

  room.game_state = newState;
  room.current_player = newState.currentPlayer;
  if (newState.status === 'won' || newState.status === 'draw') {
    room.status = 'completed';
  }

  localRooms.set(normalizedCode, room);

  // Sync to Supabase if available
  if (supabaseClient) {
    try {
      await supabaseClient
        .from('navakankari_rooms')
        .update({
          game_state: newState,
          current_player: newState.currentPlayer,
          status: room.status,
          updated_at: new Date().toISOString(),
        })
        .eq('code', normalizedCode);
    } catch (e) {
      console.warn('Supabase room update error:', e);
    }
  }

  // Broadcast to other client
  const bc = getLocalChannel(normalizedCode);
  bc.postMessage({ type: 'ROOM_UPDATE', room });

  return { success: true, state: newState };
}

/**
 * Subscribe to real-time room events (via Supabase Realtime channel and BroadcastChannel)
 */
export function subscribeToOnlineRoom(
  code: string,
  onUpdate: (room: RoomRecord) => void
): () => void {
  const normalizedCode = code.trim().toUpperCase();

  // 1. BroadcastChannel subscription (immediate cross-tab/local sync)
  const bc = getLocalChannel(normalizedCode);
  const handleMessage = (event: MessageEvent) => {
    if (event.data?.type === 'ROOM_UPDATE' && event.data.room) {
      onUpdate(event.data.room);
    }
  };
  bc.addEventListener('message', handleMessage);

  // 2. Supabase Realtime channel subscription if configured
  let supabaseSubscription: ReturnType<SupabaseClient['channel']> | null = null;
  if (supabaseClient) {
    try {
      supabaseSubscription = supabaseClient
        .channel(`room:${normalizedCode}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'navakankari_rooms',
            filter: `code=eq.${normalizedCode}`,
          },
          (payload) => {
            if (payload.new) {
              onUpdate(payload.new as RoomRecord);
            }
          }
        )
        .subscribe();
    } catch (err) {
      console.warn('Failed to subscribe to Supabase Realtime:', err);
    }
  }

  return () => {
    bc.removeEventListener('message', handleMessage);
    if (supabaseSubscription && supabaseClient) {
      supabaseClient.removeChannel(supabaseSubscription).catch(() => {});
    }
  };
}
