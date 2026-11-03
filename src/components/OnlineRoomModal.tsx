/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  X,
  Globe,
  Copy,
  Check,
  Users,
  Radio,
  ArrowRight,
  Shield,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import {
  createOnlineRoom,
  isSupabaseConfigured,
  joinOnlineRoom,
  RoomRecord,
} from '../lib/supabase.ts';
import { PlayerId } from '../game/types.ts';

interface OnlineRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRoomJoined: (room: RoomRecord, playerId: string, isHost: boolean) => void;
  defaultPlayerName: string;
}

export const OnlineRoomModal: React.FC<OnlineRoomModalProps> = ({
  isOpen,
  onClose,
  onRoomJoined,
  defaultPlayerName,
}) => {
  const [activeTab, setActiveTab] = useState<'create' | 'join'>('create');
  const [playerName, setPlayerName] = useState(defaultPlayerName);
  const [hostSide, setHostSide] = useState<PlayerId>(1);
  const [joinCode, setJoinCode] = useState('');
  const [createdRoom, setCreatedRoom] = useState<RoomRecord | null>(null);
  const [hostPlayerId, setHostPlayerId] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const isSupabaseReady = isSupabaseConfigured();

  const handleCreate = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const { room, playerId } = await createOnlineRoom(playerName.trim() || 'Player 1', hostSide);
      setCreatedRoom(room);
      setHostPlayerId(playerId);
      // Inform parent so it listens for the guest joining
      onRoomJoined(room, playerId, true);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to create room');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!joinCode.trim()) {
      setErrorMsg('Please enter a valid room code');
      return;
    }
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const { room, playerId, error } = await joinOnlineRoom(
        joinCode.trim(),
        playerName.trim() || 'Guest'
      );
      if (error || !room) {
        setErrorMsg(error || 'Could not join room');
      } else {
        onRoomJoined(room, playerId, false);
        onClose();
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Error joining room');
    } finally {
      setIsLoading(false);
    }
  };

  const copyRoomCode = () => {
    if (!createdRoom) return;
    navigator.clipboard?.writeText(createdRoom.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-stone-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-stone-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-heading text-xl font-bold text-white">Online Multiplayer</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isSupabaseReady ? 'bg-emerald-400' : 'bg-cyan-400 animate-pulse'
                  }`}
                />
                <span className="text-[11px] text-stone-400">
                  {isSupabaseReady ? 'Supabase Cloud Connected' : 'Cross-Device / Multi-Tab Ready'}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        {!createdRoom && (
          <div className="flex bg-stone-950 p-1 rounded-2xl border border-stone-800 mt-5">
            <button
              onClick={() => {
                setActiveTab('create');
                setErrorMsg(null);
              }}
              className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
                activeTab === 'create'
                  ? 'bg-amber-600 text-stone-950 shadow'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              Create Private Room
            </button>
            <button
              onClick={() => {
                setActiveTab('join');
                setErrorMsg(null);
              }}
              className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
                activeTab === 'join'
                  ? 'bg-amber-600 text-stone-950 shadow'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              Join with Code
            </button>
          </div>
        )}

        {/* Content Body */}
        <div className="py-5">
          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {createdRoom ? (
            /* Room Waiting Screen */
            <div className="text-center py-4 space-y-5">
              <div className="w-16 h-16 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center mx-auto text-amber-400 animate-pulse">
                <Radio className="w-8 h-8" />
              </div>

              <div>
                <span className="text-xs uppercase tracking-wider text-stone-400 font-semibold block mb-1">
                  Share Room Code With Opponent
                </span>
                <div className="flex items-center justify-center gap-2">
                  <span className="font-mono text-3xl sm:text-4xl font-extrabold tracking-widest text-amber-400 bg-stone-950 px-5 py-2.5 rounded-2xl border border-stone-800">
                    {createdRoom.code}
                  </span>
                  <button
                    onClick={copyRoomCode}
                    className="p-3.5 rounded-2xl bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition cursor-pointer border border-stone-700"
                    title="Copy Code"
                  >
                    {copied ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="bg-stone-950 border border-stone-800 rounded-xl p-3.5 text-xs text-stone-300 flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
                <span>Waiting for opponent to connect... The match starts immediately upon joining.</span>
              </div>

              <div className="text-[11px] text-stone-500">
                Playing as: <strong>{createdRoom.host_name}</strong> (Player {createdRoom.host_side})
              </div>
            </div>
          ) : activeTab === 'create' ? (
            /* Create Room Form */
            <div className="space-y-4">
              <div>
                <label className="text-xs uppercase tracking-wider font-bold text-stone-400 block mb-1.5">
                  Your Name
                </label>
                <input
                  type="text"
                  value={playerName}
                  maxLength={18}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-xs uppercase tracking-wider font-bold text-stone-400 block mb-1.5">
                  Choose Starting Side
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setHostSide(1)}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition ${
                      hostSide === 1
                        ? 'border-amber-500 bg-amber-500/15'
                        : 'border-stone-800 bg-stone-950 hover:border-stone-700'
                    }`}
                  >
                    <div className="text-xs font-bold text-white">Player 1 (Moves First)</div>
                    <div className="text-[11px] text-amber-400">Terracotta Amber</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setHostSide(2)}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition ${
                      hostSide === 2
                        ? 'border-amber-500 bg-amber-500/15'
                        : 'border-stone-800 bg-stone-950 hover:border-stone-700'
                    }`}
                  >
                    <div className="text-xs font-bold text-white">Player 2</div>
                    <div className="text-[11px] text-stone-300">Silver Ivory</div>
                  </button>
                </div>
              </div>

              <button
                onClick={handleCreate}
                disabled={isLoading}
                className="w-full mt-2 py-3.5 rounded-xl bg-amber-600 hover:bg-amber-500 active:scale-95 text-stone-950 font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-amber-600/30 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Users className="w-5 h-5" />}
                Generate Room & Play
              </button>
            </div>
          ) : (
            /* Join Room Form */
            <div className="space-y-4">
              <div>
                <label className="text-xs uppercase tracking-wider font-bold text-stone-400 block mb-1.5">
                  Your Name
                </label>
                <input
                  type="text"
                  value={playerName}
                  maxLength={18}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-xs uppercase tracking-wider font-bold text-stone-400 block mb-1.5">
                  Room Code
                </label>
                <input
                  type="text"
                  value={joinCode}
                  maxLength={8}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="e.g. NK-7X2P"
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl px-4 py-3 font-mono text-center text-lg uppercase tracking-widest text-amber-400 focus:outline-none focus:border-amber-500"
                />
              </div>

              <button
                onClick={handleJoin}
                disabled={isLoading}
                className="w-full mt-2 py-3.5 rounded-xl bg-amber-600 hover:bg-amber-500 active:scale-95 text-stone-950 font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-amber-600/30 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
                Join Game Room
              </button>
            </div>
          )}

          {/* Architecture info */}
          <div className="mt-5 pt-4 border-t border-stone-800 flex items-center gap-2 text-[11px] text-stone-400">
            <Shield className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Authoritative game logic engine prevents illegal moves or state corruption.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
