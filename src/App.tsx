/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  RotateCcw,
  Volume2,
  VolumeX,
  BookOpen,
  Sliders,
  History,
  Home,
  Users,
  Globe,
  Bot,
  AlertTriangle,
  Radio,
} from 'lucide-react';
import { AdBannerPlaceholder } from './components/AdBannerPlaceholder.tsx';
import { Board } from './components/Board.tsx';
import { GameOverModal } from './components/GameOverModal.tsx';
import { HistoryDrawer } from './components/HistoryDrawer.tsx';
import { LandingPage } from './components/LandingPage.tsx';
import { OnlineRoomModal } from './components/OnlineRoomModal.tsx';
import { PlayerCard } from './components/PlayerCard.tsx';
import { RulesModal } from './components/RulesModal.tsx';
import { SettingsModal } from './components/SettingsModal.tsx';
import { AiDifficulty, getAiAction } from './game/ai.ts';
import { THEMES } from './game/constants.ts';
import {
  applyCapture,
  applyMove,
  applyPlacement,
  createInitialGameState,
  getLegalCaptures,
  getLegalDestinations,
  getLegalPiecesToMove,
  getLegalPlacements,
} from './game/engine.ts';
import { sounds } from './game/sound.ts';
import { GameState, GameTheme, PlayerId, PointId, ThemeConfig } from './game/types.ts';
import {
  RoomRecord,
  submitOnlineAction,
  subscribeToOnlineRoom,
} from './lib/supabase.ts';

type AppMode = 'landing' | 'local' | 'bot' | 'online';

export default function App() {
  // Theme state
  const [themeId, setThemeId] = useState<GameTheme>(() => {
    return (localStorage.getItem('navakankari_theme') as GameTheme) || 'teak';
  });
  const theme: ThemeConfig = THEMES[themeId] || THEMES.teak;

  // Sound state
  const [isMuted, setIsMuted] = useState(sounds.getMuted());

  // Player Names & AI difficulty
  const [player1Name, setPlayer1Name] = useState(() => {
    return localStorage.getItem('navakankari_p1') || 'Player 1';
  });
  const [player2Name, setPlayer2Name] = useState(() => {
    return localStorage.getItem('navakankari_p2') || 'Player 2';
  });
  const [aiDifficulty, setAiDifficulty] = useState<AiDifficulty>('medium');

  // Application Screen Mode
  const [mode, setMode] = useState<AppMode>('landing');

  // Game Engine State
  const [gameState, setGameState] = useState<GameState>(() =>
    createInitialGameState(player1Name, player2Name)
  );

  // Undo stack for local matches
  const [stateHistory, setStateHistory] = useState<GameState[]>([]);

  // Online Room State
  const [onlineRoom, setOnlineRoom] = useState<RoomRecord | null>(null);
  const [onlinePlayerId, setOnlinePlayerId] = useState<string>('');
  const [isHost, setIsHost] = useState(false);
  const [onlineError, setOnlineError] = useState<string | null>(null);

  // Modals & Drawers
  const [isRulesOpen, setIsRulesOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isOnlineModalOpen, setIsOnlineModalOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isRestartConfirmOpen, setIsRestartConfirmOpen] = useState(false);

  // Sync theme to localStorage
  const handleSelectTheme = (newTheme: GameTheme) => {
    setThemeId(newTheme);
    localStorage.setItem('navakankari_theme', newTheme);
  };

  const handleToggleSound = () => {
    const nextMuted = sounds.toggleMute();
    setIsMuted(nextMuted);
    if (!nextMuted) sounds.playClick();
  };

  const handleUpdateNames = (p1: string, p2: string) => {
    setPlayer1Name(p1);
    setPlayer2Name(p2);
    localStorage.setItem('navakankari_p1', p1);
    localStorage.setItem('navakankari_p2', p2);

    setGameState((prev) => {
      const copy = { ...prev };
      copy.players[1].name = p1;
      if (!copy.players[2].isAi) {
        copy.players[2].name = p2;
      }
      return copy;
    });
  };

  // Start new local match
  const startLocalGame = () => {
    const newGame = createInitialGameState(player1Name, player2Name, false);
    setGameState(newGame);
    setStateHistory([]);
    setOnlineRoom(null);
    setMode('local');
    sounds.playClick();
  };

  // Start practice vs Bot
  const startBotGame = () => {
    const newGame = createInitialGameState(player1Name, 'Navakankari Bot', true);
    setGameState(newGame);
    setStateHistory([]);
    setOnlineRoom(null);
    setMode('bot');
    sounds.playClick();
  };

  // Online Room Join Callback
  const handleRoomJoined = (room: RoomRecord, playerId: string, host: boolean) => {
    setOnlineRoom(room);
    setOnlinePlayerId(playerId);
    setIsHost(host);
    setGameState(room.game_state);
    setMode('online');
  };

  // Subscribe to Online Room updates via Supabase Realtime / BroadcastChannel
  useEffect(() => {
    if (mode !== 'online' || !onlineRoom) return;

    const unsubscribe = subscribeToOnlineRoom(onlineRoom.code, (updatedRoom) => {
      setOnlineRoom(updatedRoom);
      setGameState(updatedRoom.game_state);

      // Play audio based on latest move
      const lastMove = updatedRoom.game_state.moveHistory[updatedRoom.game_state.moveHistory.length - 1];
      if (lastMove) {
        if (lastMove.type === 'capture') sounds.playCapture();
        else if (lastMove.formedMill) sounds.playMill();
        else if (lastMove.type === 'place') sounds.playPlace();
        else sounds.playMove();
      }
    });

    return () => {
      unsubscribe();
    };
  }, [mode, onlineRoom?.code]);

  // Offline Bot Automated Turn Execution
  useEffect(() => {
    if (mode !== 'bot') return;
    if (gameState.status !== 'playing' && gameState.status !== 'capture') return;
    if (gameState.currentPlayer !== 2) return; // Player 2 is the bot

    const timer = setTimeout(() => {
      try {
        const nextState = getAiAction(gameState, aiDifficulty);
        const lastMove = nextState.moveHistory[nextState.moveHistory.length - 1];
        if (lastMove?.type === 'capture') {
          sounds.playCapture();
        } else if (lastMove?.formedMill) {
          sounds.playMill();
        } else if (lastMove?.type === 'place') {
          sounds.playPlace();
        } else {
          sounds.playMove();
        }
        setGameState(nextState);
      } catch (err) {
        console.warn('Bot action error:', err);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [mode, gameState, aiDifficulty]);

  // Handle Point Tap / Click on the Board
  const handlePointClick = useCallback(
    async (pointId: PointId) => {
      if (gameState.status === 'won' || gameState.status === 'draw') return;

      // Online turn validation: Is it this player's turn?
      if (mode === 'online' && onlineRoom) {
        const mySide = isHost ? onlineRoom.host_side : (onlineRoom.host_side === 1 ? 2 : 1);
        if (gameState.currentPlayer !== mySide) {
          setOnlineError("Waiting for opponent's turn...");
          setTimeout(() => setOnlineError(null), 2500);
          return;
        }
      }

      // If playing vs bot, prevent clicking during bot's turn
      if (mode === 'bot' && gameState.currentPlayer === 2) return;

      // 1. CAPTURE STATE: Player must click an eligible opponent piece to remove it
      if (gameState.status === 'capture') {
        const eligible = getLegalCaptures(gameState);
        if (eligible.includes(pointId)) {
          if (mode === 'online' && onlineRoom) {
            const res = await submitOnlineAction(onlineRoom.code, onlinePlayerId, {
              type: 'capture',
              point: pointId,
            });
            if (!res.success) {
              setOnlineError(res.error || 'Move rejected');
            } else if (res.state) {
              sounds.playCapture();
              setGameState(res.state);
            }
          } else {
            // Local / Bot mode
            setStateHistory((prev) => [...prev, gameState]);
            const nextState = applyCapture(gameState, pointId);
            sounds.playCapture();
            if (nextState.status === 'won') {
              sounds.playWin();
            }
            setGameState(nextState);
          }
        }
        return;
      }

      // 2. PLACEMENT PHASE: Player taps an empty point to place a piece
      if (gameState.phase === 'placement') {
        const legalPlacements = getLegalPlacements(gameState);
        if (legalPlacements.includes(pointId)) {
          if (mode === 'online' && onlineRoom) {
            const res = await submitOnlineAction(onlineRoom.code, onlinePlayerId, {
              type: 'place',
              point: pointId,
            });
            if (!res.success) {
              setOnlineError(res.error || 'Placement rejected');
            } else if (res.state) {
              if (res.state.millFormedJustNow) sounds.playMill();
              else sounds.playPlace();
              setGameState(res.state);
            }
          } else {
            // Local / Bot mode
            setStateHistory((prev) => [...prev, gameState]);
            const nextState = applyPlacement(gameState, pointId);
            if (nextState.millFormedJustNow) {
              sounds.playMill();
            } else {
              sounds.playPlace();
            }
            setGameState(nextState);
          }
        }
        return;
      }

      // 3. MOVEMENT & FLYING PHASES:
      // Case A: Clicking an owned piece to select it
      if (gameState.board[pointId] === gameState.currentPlayer) {
        sounds.playClick();
        const destinations = getLegalDestinations(gameState, pointId);
        setGameState((prev) => ({
          ...prev,
          selectedPiece: pointId,
          legalDestinations: destinations,
        }));
        return;
      }

      // Case B: Clicking a valid destination when a piece is already selected
      if (gameState.selectedPiece !== null) {
        if (gameState.legalDestinations.includes(pointId)) {
          const fromPoint = gameState.selectedPiece;

          if (mode === 'online' && onlineRoom) {
            const res = await submitOnlineAction(onlineRoom.code, onlinePlayerId, {
              type: 'move',
              from: fromPoint,
              to: pointId,
            });
            if (!res.success) {
              setOnlineError(res.error || 'Move rejected');
            } else if (res.state) {
              if (res.state.millFormedJustNow) sounds.playMill();
              else sounds.playMove();
              setGameState(res.state);
            }
          } else {
            // Local / Bot mode
            setStateHistory((prev) => [...prev, gameState]);
            const nextState = applyMove(gameState, fromPoint, pointId);
            if (nextState.millFormedJustNow) {
              sounds.playMill();
            } else {
              sounds.playMove();
            }
            if (nextState.status === 'won') {
              sounds.playWin();
            }
            setGameState(nextState);
          }
          return;
        }

        // Clicked elsewhere on board: deselect
        setGameState((prev) => ({
          ...prev,
          selectedPiece: null,
          legalDestinations: [],
        }));
      }
    },
    [gameState, mode, onlineRoom, onlinePlayerId, isHost]
  );

  // Undo move for local match
  const handleUndo = () => {
    if (stateHistory.length === 0) return;
    const previous = stateHistory[stateHistory.length - 1];
    setStateHistory((prev) => prev.slice(0, prev.length - 1));
    setGameState(previous);
    sounds.playClick();
  };

  // Rematch
  const handleRematch = () => {
    if (mode === 'bot') {
      startBotGame();
    } else if (mode === 'online' && onlineRoom) {
      const resetState = createInitialGameState(onlineRoom.host_name, onlineRoom.guest_name || 'Guest');
      setGameState(resetState);
      sounds.playClick();
    } else {
      startLocalGame();
    }
  };

  // Return to landing page
  const handleReturnHome = () => {
    setMode('landing');
    setOnlineRoom(null);
    sounds.playClick();
  };

  return (
    <div className={`min-h-screen ${theme.background} text-stone-100 flex flex-col justify-between selection:bg-amber-500 selection:text-black transition-colors duration-500`}>
      {/* ==================================================== */}
      {/* APP HEADER NAVIGATION                                */}
      {/* ==================================================== */}
      <header className="sticky top-0 z-30 w-full backdrop-blur-md bg-stone-950/70 border-b border-stone-800/80 px-3 sm:px-6 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-2">
          {/* Brand Logo & Name */}
          <div
            onClick={handleReturnHome}
            className="flex items-center gap-2 sm:gap-3 cursor-pointer group select-none"
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-stone-950 font-black shadow-lg shadow-amber-600/20 group-hover:scale-105 transition">
              <span className="font-heading text-lg">N</span>
            </div>
            <div>
              <div className="font-heading font-extrabold text-base sm:text-lg tracking-wider text-white group-hover:text-amber-400 transition">
                NAVAKANKARI
              </div>
              <div className="text-[10px] text-stone-400 uppercase tracking-widest hidden sm:block">
                Nine Men's Morris
              </div>
            </div>
          </div>

          {/* Mode Badge in Header when in game */}
          {mode !== 'landing' && (
            <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-stone-900 border border-stone-800 text-xs">
              {mode === 'local' && (
                <>
                  <Users className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-stone-300 font-semibold">Local Pass & Play</span>
                </>
              )}
              {mode === 'bot' && (
                <>
                  <Bot className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-stone-300 font-semibold">Bot Practice ({aiDifficulty})</span>
                </>
              )}
              {mode === 'online' && onlineRoom && (
                <>
                  <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                  <span className="text-stone-300 font-semibold font-mono">
                    Room {onlineRoom.code}
                  </span>
                </>
              )}
            </div>
          )}

          {/* Action Bar Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Rules Button */}
            <button
              onClick={() => setIsRulesOpen(true)}
              className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-stone-900/80 hover:bg-stone-800 text-stone-300 hover:text-white border border-stone-800 transition flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
              title="How to Play"
            >
              <BookOpen className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">Rules</span>
            </button>

            {/* Sound Toggle */}
            <button
              onClick={handleToggleSound}
              className="p-2 sm:px-2.5 sm:py-1.5 rounded-xl bg-stone-900/80 hover:bg-stone-800 text-stone-300 hover:text-white border border-stone-800 transition text-xs cursor-pointer"
              title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4 text-rose-400" />
              ) : (
                <Volume2 className="w-4 h-4 text-emerald-400" />
              )}
            </button>

            {/* Settings Modal */}
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 sm:px-2.5 sm:py-1.5 rounded-xl bg-stone-900/80 hover:bg-stone-800 text-stone-300 hover:text-white border border-stone-800 transition text-xs cursor-pointer"
              title="Game Settings & Themes"
            >
              <Sliders className="w-4 h-4 text-stone-300" />
            </button>

            {/* In-Game Extra Controls */}
            {mode !== 'landing' && (
              <>
                {/* Move History Drawer Toggle */}
                <button
                  onClick={() => setIsHistoryOpen(true)}
                  className="p-2 sm:px-2.5 sm:py-1.5 rounded-xl bg-stone-900/80 hover:bg-stone-800 text-stone-300 hover:text-white border border-stone-800 transition text-xs cursor-pointer"
                  title="Move History"
                >
                  <History className="w-4 h-4 text-amber-400" />
                </button>

                {/* Return Home */}
                <button
                  onClick={handleReturnHome}
                  className="p-2 sm:px-2.5 sm:py-1.5 rounded-xl bg-stone-900/80 hover:bg-stone-800 text-stone-300 hover:text-white border border-stone-800 transition text-xs cursor-pointer"
                  title="Exit to Main Menu"
                >
                  <Home className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ==================================================== */}
      {/* MAIN CONTENT ROUTING                                 */}
      {/* ==================================================== */}
      <main className="flex-1 flex flex-col justify-center px-2 sm:px-4 py-4 sm:py-6">
        {mode === 'landing' ? (
          <LandingPage
            onStartLocalGame={startLocalGame}
            onStartBotGame={startBotGame}
            onOpenOnlineModal={() => setIsOnlineModalOpen(true)}
            onOpenRules={() => setIsRulesOpen(true)}
          />
        ) : (
          <div className="w-full max-w-2xl mx-auto flex flex-col gap-3 sm:gap-4">
            {/* Online Error Notice */}
            {onlineError && (
              <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs text-center font-medium animate-pulse">
                {onlineError}
              </div>
            )}

            {/* Capture Notification Banner */}
            {gameState.status === 'capture' && (
              <div className="p-2.5 sm:p-3 rounded-2xl bg-gradient-to-r from-rose-900/80 via-red-900/80 to-rose-900/80 border border-rose-500/60 text-white text-center shadow-lg animate-pulse flex items-center justify-center gap-2 text-xs sm:text-sm font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                <span>
                  MILL FORMED!{' '}
                  <strong className="text-amber-300">
                    {gameState.players[gameState.currentPlayer].name}
                  </strong>
                  , tap an opponent piece to capture it.
                </span>
              </div>
            )}

            {/* Top Player Card (Player 2 / Bot / Guest) */}
            <PlayerCard
              player={gameState.players[2]}
              isCurrentTurn={gameState.currentPlayer === 2}
              gamePhase={gameState.phase}
              gameStatus={gameState.status}
              theme={theme}
            />

            {/* Interactive SVG Game Board */}
            <Board
              state={gameState}
              theme={theme}
              onPointClick={handlePointClick}
              disabled={
                gameState.status === 'won' ||
                gameState.status === 'draw' ||
                (mode === 'bot' && gameState.currentPlayer === 2)
              }
            />

            {/* Bottom Player Card (Player 1 / Host) */}
            <PlayerCard
              player={gameState.players[1]}
              isCurrentTurn={gameState.currentPlayer === 1}
              gamePhase={gameState.phase}
              gameStatus={gameState.status}
              theme={theme}
            />

            {/* In-Game Action Bar */}
            <div className="flex items-center justify-between gap-2 pt-2">
              {/* Undo move button (Local mode) */}
              {mode === 'local' ? (
                <button
                  onClick={handleUndo}
                  disabled={stateHistory.length === 0}
                  className="px-3.5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 disabled:opacity-30 disabled:pointer-events-none text-stone-300 hover:text-white border border-stone-800 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                  <span>Undo</span>
                </button>
              ) : (
                <div />
              )}

              {/* Match Controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsRestartConfirmOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-white border border-stone-800 text-xs font-semibold transition cursor-pointer"
                >
                  Restart Match
                </button>
              </div>
            </div>

            {/* Monetization / Sponsorship banner outside playable area */}
            <AdBannerPlaceholder className="mt-4" />
          </div>
        )}
      </main>

      {/* ==================================================== */}
      {/* MODALS & DRAWERS                                     */}
      {/* ==================================================== */}

      {/* Restart Match Confirmation */}
      {isRestartConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-sm bg-stone-900 border border-stone-800 rounded-2xl p-6 text-center text-stone-200">
            <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto mb-3" />
            <h3 className="font-heading text-lg font-bold text-white mb-1">
              Restart Match?
            </h3>
            <p className="text-xs text-stone-400 mb-5">
              Current match progress will be cleared and the board will reset.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setIsRestartConfirmOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold transition cursor-pointer"
              >
                Continue Playing
              </button>
              <button
                onClick={() => {
                  setIsRestartConfirmOpen(false);
                  handleRematch();
                }}
                className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-stone-950 text-xs font-bold transition cursor-pointer"
              >
                Restart Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Game Over Modal */}
      {(gameState.status === 'won' || gameState.status === 'draw') && (
        <GameOverModal
          state={gameState}
          theme={theme}
          onRematch={handleRematch}
          onHome={handleReturnHome}
        />
      )}

      {/* Illustrated Rules Modal */}
      <RulesModal
        isOpen={isRulesOpen}
        onClose={() => setIsRulesOpen(false)}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        currentTheme={theme}
        onSelectTheme={handleSelectTheme}
        player1Name={player1Name}
        player2Name={player2Name}
        onUpdateNames={handleUpdateNames}
        aiDifficulty={aiDifficulty}
        onSelectAiDifficulty={setAiDifficulty}
      />

      {/* Online Room Modal */}
      <OnlineRoomModal
        isOpen={isOnlineModalOpen}
        onClose={() => setIsOnlineModalOpen(false)}
        onRoomJoined={handleRoomJoined}
        defaultPlayerName={player1Name}
      />

      {/* History Drawer */}
      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        moves={gameState.moveHistory}
        canUndo={mode === 'local' && stateHistory.length > 0}
        onUndo={handleUndo}
      />
    </div>
  );
}
