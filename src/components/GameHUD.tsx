import React, { useEffect, useRef, useState } from 'react';
import { MessageSquare, Mic, MicOff, Send } from 'lucide-react';
import type { GameHUDState } from '../game/types';
import type { VoiceStatus } from '../net/voiceChat';
import type { LobbyChatMessage } from '../shared/lobbyProtocol';

interface SquadMemberHud {
  id: string;
  name: string;
  characterName: string;
  isBot?: boolean;
  connected?: boolean;
  downed?: boolean;
  micOn?: boolean;
}

interface GameHUDProps {
  hud: GameHUDState;
  isMuted: boolean;
  toast: { message: string; tone: 'info' | 'warn' | 'fact' } | null;
  roomCode?: string | null;
  isMultiplayer?: boolean;
  squadRoster?: SquadMemberHud[];
  isSpectator?: boolean;
  chatMessages?: LobbyChatMessage[];
  chatOpen?: boolean;
  onSetChatOpen?: (open: boolean) => void;
  onSendChat?: (text: string) => void;
  voiceChatEnabled?: boolean;
  micOn?: boolean;
  voiceStatus?: VoiceStatus;
  onToggleMic?: () => void;
  onCheckpointSpawn?: () => void;
  onToggleMute: () => void;
  onOpenJournal: () => void;
  onOpenPause: () => void;
  onInteract: () => void;
  onToggleFlashlight: () => void;
  onToggleUV: () => void;
  onUseSalt: () => void;
}

const FLOOR_LABELS: Record<GameHUDState['floor'], string> = {
  outside: 'SUKAJADI · DUNIA NYATA',
  ground: 'ACT 1 · LANTAI DASAR',
  second: 'ACT 2 · LANTAI 2',
  roof: 'ACT 3 · ROOFTOP GURITA',
};

export const GameHUD: React.FC<GameHUDProps> = ({
  hud,
  isMuted,
  toast,
  roomCode,
  isMultiplayer = false,
  squadRoster = [],
  isSpectator = false,
  chatMessages = [],
  chatOpen = false,
  onSetChatOpen,
  onSendChat,
  voiceChatEnabled = false,
  micOn = false,
  voiceStatus = 'disabled',
  onToggleMic,
  onCheckpointSpawn,
  onToggleMute,
  onOpenJournal,
  onOpenPause,
  onInteract,
  onToggleFlashlight,
  onToggleUV,
  onUseSalt,
}) => {
  const [chatInput, setChatInput] = useState('');
  const chatInputRef = useRef<HTMLInputElement | null>(null);
  const lowSanity = hud.sanity < 45;
  const dangerAlpha = lowSanity ? Math.min(0.65, (45 - hud.sanity) / 45) : 0;

  useEffect(() => {
    if (chatOpen) {
      window.setTimeout(() => chatInputRef.current?.focus(), 20);
    }
  }, [chatOpen]);

  const recentChat = chatMessages.slice(-4);

  return (
    <div className="fixed inset-0 z-10 pointer-events-none select-none">
      {/* Vignette Ketakutan saat Sanity rendah */}
      {dangerAlpha > 0 && (
        <div
          className="fixed inset-0 pointer-events-none"
          style={{
            boxShadow: `inset 0 0 110px rgba(145, 18, 18, ${dangerAlpha.toFixed(2)})`,
          }}
        />
      )}

      {/* Overlay Kamera Ponsel UV */}
      {hud.uvMode && (
        <div className="fixed inset-0 pointer-events-none uv-scanlines border-[3px] border-[#8f6be8]/55">
          <div className="absolute top-16 left-1/2 -translate-x-1/2 px-3 py-1 bg-[#160f26]/95 border border-[#8f6be8]/60 text-[#d8c8ff] text-[11px] font-mono-num tracking-widest uppercase">
            KAMERA UV · {hud.uvBattery}%
          </div>
        </div>
      )}

      {/* TOP-LEFT: Lokasi, Progres, Zona Aman & Tim */}
      <div className="absolute top-3 left-3 sm:top-4 sm:left-4 flex flex-col gap-1.5 max-w-[calc(100vw-12.5rem)] sm:max-w-none">
        <div className="archival-panel rounded-sm px-2.5 py-1.5 sm:px-3.5 sm:py-2">
          <div className="flex items-center justify-between gap-3">
            <div className="font-display text-[10px] sm:text-[11px] font-bold tracking-[0.14em] uppercase text-[#ebe7dc] truncate">
              {FLOOR_LABELS[hud.floor]}
            </div>
            {roomCode && (
              <span className="text-[10px] font-mono-num font-bold text-[#cfa15a] shrink-0">
                ROOM {roomCode}
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 mt-1 text-[11px] text-[#98a29b] font-mono-num">
            <span>
              Segel{' '}
              <strong className="text-[#cfa15a]">
                {hud.segelBroken}/{hud.totalSegel}
              </strong>
            </span>
            <span className="text-[#4a544e]">/</span>
            <span>
              Fakta{' '}
              <strong className="text-[#7ec99e]">
                {hud.evidenceCount}/{hud.totalEvidence}
              </strong>
            </span>
            {hud.keysInventory.length > 0 && (
              <>
                <span className="text-[#4a544e]">/</span>
                <span className="text-[#e8c674]">Kunci: {hud.keysInventory.length}</span>
              </>
            )}
          </div>
          <p
            data-testid="hud-objective"
            className="mt-1 pt-1 border-t border-[rgba(207,161,90,0.16)] text-[9.5px] sm:text-[11px] text-[#d6dbd7] leading-snug line-clamp-3 sm:line-clamp-2 max-w-[15.5rem] sm:max-w-[23rem]"
          >
            <strong className="text-[#cfa15a] font-semibold">Misi:</strong> {hud.currentObjective}
          </p>
        </div>

        {hud.inSafeZone && (
          <div
            data-testid="safe-zone-badge"
            className="px-2.5 py-1 bg-[#0e2117]/95 border border-[#689f7d]/60 text-[#a9e3bf] text-[10px] font-bold tracking-[0.08em] uppercase rounded-sm w-fit"
          >
            {hud.safeZoneName ?? 'Zona Aman'} · Bebas Serangan
          </div>
        )}

        {hud.isHiding && (
          <div className="px-2.5 py-1 bg-[#1e1810]/95 border border-[#cfa15a]/70 text-[#f5dfb3] text-[10px] font-bold tracking-[0.08em] uppercase rounded-sm w-fit">
            Bersembunyi · Tekan [E] Keluar
          </div>
        )}

        {hud.ditoSenseHint && (
          <div className="px-2.5 py-1 bg-[#1b142a]/95 border border-[#8f6be8]/60 text-[#d8c8ff] text-[11px] font-semibold rounded-sm w-fit">
            {hud.ditoSenseHint}
          </div>
        )}
      </div>

      {/* Mode Penonton Late Join */}
      {isSpectator && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-20 pointer-events-auto archival-card border border-[#cfa15a]/70 rounded-sm px-4 py-3 flex flex-col sm:flex-row items-center gap-3">
          <div className="text-xs text-[#ebe7dc]">
            <strong className="text-[#cfa15a] uppercase tracking-wider mr-1.5">
              Mode Penonton (Late Join)
            </strong>
            <span>Ekspedisi sedang berjalan. Kamu bisa langsung turun di Checkpoint Sukajadi.</span>
          </div>
          {onCheckpointSpawn && (
            <button
              type="button"
              data-testid="btn-checkpoint-spawn"
              onClick={onCheckpointSpawn}
              className="px-4 py-2 bg-[#1c5c3b] hover:bg-[#24734a] border border-[#689f7d] text-[#f5faf6] text-xs font-bold uppercase tracking-wider rounded-sm cursor-pointer whitespace-nowrap"
            >
              Masuk di Checkpoint
            </button>
          )}
        </div>
      )}

      {/* TOP-RIGHT: Utilitas Ringkas + Regu Penyelidik */}
      <div className="absolute top-3 right-3 sm:top-4 sm:right-4 flex flex-col items-end gap-2 pointer-events-none">
        <div className="flex items-center gap-1.5 sm:gap-2 pointer-events-auto">
          <button
            type="button"
            tabIndex={-1}
            aria-label="Jurnal Mitos vs Fakta"
            onClick={(e) => {
              e.currentTarget.blur();
              onOpenJournal();
            }}
            className="h-9 px-2.5 sm:px-3 archival-panel hover:bg-[#19211d] text-[#ebe7dc] text-xs font-semibold rounded-sm flex items-center gap-1.5 cursor-pointer"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-none stroke-current" strokeWidth="1.8">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
            <span className="hidden sm:inline">Jurnal [J]</span>
            <span className="sm:hidden">Jurnal</span>
          </button>

          <button
            type="button"
            tabIndex={-1}
            aria-label={isMuted ? 'Nyalakan Audio' : 'Bisukan Audio'}
            onClick={(e) => {
              e.currentTarget.blur();
              onToggleMute();
            }}
            className="w-9 h-9 archival-panel hover:bg-[#19211d] text-[#ebe7dc] rounded-sm flex items-center justify-center cursor-pointer"
            title="Audio [M]"
          >
            {isMuted ? (
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-none stroke-current" strokeWidth="1.8">
                <path d="M11 5L6 9H2v6h4l5 4V5z" />
                <line x1="23" y1="9" x2="17" y2="15" />
                <line x1="17" y1="9" x2="23" y2="15" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-none stroke-current" strokeWidth="1.8">
                <path d="M11 5L6 9H2v6h4l5 4V5z" />
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
              </svg>
            )}
          </button>

          <button
            type="button"
            tabIndex={-1}
            aria-label="Pause"
            onClick={(e) => {
              e.currentTarget.blur();
              onOpenPause();
            }}
            className="w-9 h-9 archival-panel hover:bg-[#19211d] text-[#ebe7dc] rounded-sm flex items-center justify-center cursor-pointer"
            title="Pause [Esc]"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-none stroke-current" strokeWidth="1.8">
              <rect x="6" y="4" width="4" height="16" />
              <rect x="14" y="4" width="4" height="16" />
            </svg>
          </button>
        </div>

        {squadRoster.length > 0 && (
          <div className="px-2.5 py-1.5 archival-panel rounded-sm w-fit flex flex-col gap-0.5 text-[10px] text-right">
            <span className="uppercase tracking-[0.12em] text-[#cfa15a] font-semibold">
              Regu Penyelidik ({squadRoster.length})
            </span>
            {squadRoster.map((m) => (
              <div key={m.id} className="text-[#cdd4cf] font-mono-num flex items-center justify-end gap-1.5">
                {m.downed ? (
                  <span className="text-[#ff7c6e] font-bold">TUMBANG</span>
                ) : (
                  <span className={m.connected === false ? 'text-[#d97b73]' : 'text-[#7ec99e]'}>●</span>
                )}
                <span>{m.name}</span>
                <span className="text-[#8e9a92]">({m.characterName})</span>
                {m.micOn && <Mic className="w-2.5 h-2.5 text-[#7ec99e] shrink-0" />}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Status Tumbang (Multiplayer Co-op) */}
      {hud.isDowned && (
        <div
          data-testid="downed-banner"
          className="fixed top-20 left-1/2 -translate-x-1/2 z-20 px-4 py-2 bg-[#36110e]/95 border border-[#e0564a] text-[#ffdcd8] text-xs font-semibold tracking-wide rounded-sm shadow-xl text-center max-w-md"
        >
          KAMU TUMBANG · Merangkak mendekati rekan regu agar ditolong dengan tombol [E]
        </div>
      )}

      {/* CENTER CROSSHAIR & PROMPT INTERAKSI */}
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-3 pointer-events-none">
        <div className="w-1.5 h-1.5 rounded-full bg-[#ebe7dc]/80 shadow" />
        {hud.nearestPrompt && (
          <button
            type="button"
            tabIndex={-1}
            data-testid="interact-prompt"
            onClick={(e) => {
              e.currentTarget.blur();
              onInteract();
            }}
            className="pointer-events-auto px-3.5 py-1.5 bg-[#0f1311]/95 border border-[#cfa15a]/75 text-[#f7ebd1] text-xs font-bold tracking-wide rounded-sm shadow-xl cursor-pointer"
          >
            {hud.nearestPrompt}
          </button>
        )}
      </div>

      {/* TOAST NOTIFIKASI */}
      {toast && (
        <div
          className={`fixed top-20 left-1/2 -translate-x-1/2 max-w-md px-4 py-2 rounded-sm border text-xs font-medium text-center shadow-xl ${
            toast.tone === 'warn'
              ? 'bg-[#28110f]/95 border-[#b53429] text-[#ffd4cf]'
              : toast.tone === 'fact'
                ? 'bg-[#102318]/95 border-[#689f7d] text-[#d4f5df]'
                : 'bg-[#101412]/95 border-[rgba(207,161,90,0.35)] text-[#ebe7dc]'
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* BOTTOM-LEFT: Sanity, Stamina, Baterai Senter & Baterai UV (Terpisah) */}
      <div className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4 w-36 sm:w-56 archival-panel rounded-sm p-2 sm:p-3 flex flex-col gap-1 sm:gap-1.5">
        <div>
          <div className="flex justify-between text-[9px] sm:text-[10px] tracking-[0.08em] uppercase text-[#a3afa7] font-mono-num">
            <span>Sanity</span>
            <span className={lowSanity ? 'text-[#e0564a] font-bold' : ''}>{hud.sanity}%</span>
          </div>
          <div className="h-1.5 bg-[#181f1b] rounded-sm overflow-hidden mt-0.5">
            <div
              className="h-full transition-all duration-150"
              style={{
                width: `${hud.sanity}%`,
                backgroundColor: lowSanity ? '#b53429' : '#689f7d',
              }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-[9px] sm:text-[10px] tracking-[0.08em] uppercase text-[#a3afa7] font-mono-num">
            <span>
              {hud.isCrouching ? 'Jongkok' : hud.isSprinting ? 'Lari' : 'Stamina'}
            </span>
            <span>{hud.stamina}%</span>
          </div>
          <div className="h-1.5 bg-[#181f1b] rounded-sm overflow-hidden mt-0.5">
            <div
              className="h-full bg-[#cfa15a] transition-all duration-100"
              style={{ width: `${hud.stamina}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-0.5 border-t border-[rgba(207,161,90,0.16)]">
          <div>
            <div className="flex justify-between text-[9px] tracking-[0.04em] uppercase text-[#d8c493] font-mono-num whitespace-nowrap">
              <span>Senter</span>
              <span>{hud.flashlightBattery}%</span>
            </div>
            <div className="h-1.5 bg-[#181f1b] rounded-sm overflow-hidden mt-0.5">
              <div
                className="h-full bg-[#e0b863] transition-all duration-150"
                style={{ width: `${hud.flashlightBattery}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-[9px] tracking-[0.04em] uppercase text-[#bca6f5] font-mono-num whitespace-nowrap">
              <span>UV</span>
              <span>{hud.uvBattery}%</span>
            </div>
            <div className="h-1.5 bg-[#181f1b] rounded-sm overflow-hidden mt-0.5">
              <div
                className="h-full bg-[#8f6be8] transition-all duration-150"
                style={{ width: `${hud.uvBattery}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* CHAT REGU IN-GAME (Multiplayer) */}
      {isMultiplayer && (
        <div className="absolute bottom-32 sm:bottom-36 left-3 sm:left-4 w-56 sm:w-72 flex flex-col gap-1 pointer-events-auto">
          {recentChat.length > 0 && (
            <div
              data-testid="ingame-chat-feed"
              className="archival-panel rounded-sm px-2.5 py-1.5 flex flex-col gap-0.5 text-[10px] leading-snug"
            >
              {recentChat.map((m) => (
                <div
                  key={m.id}
                  className={m.system ? 'text-[#cfa15a] italic' : 'text-[#e3e7e4]'}
                >
                  {!m.system && <strong className="text-[#ebe7dc] mr-1">{m.senderName}:</strong>}
                  <span>{m.text}</span>
                </div>
              ))}
            </div>
          )}

          {chatOpen ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (chatInput.trim() && onSendChat) {
                  onSendChat(chatInput);
                }
                setChatInput('');
                onSetChatOpen?.(false);
              }}
              className="flex items-center gap-1"
            >
              <input
                ref={chatInputRef}
                type="text"
                maxLength={160}
                data-testid="ingame-chat-input"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.code === 'Escape') {
                    e.preventDefault();
                    e.stopPropagation();
                    onSetChatOpen?.(false);
                  }
                }}
                placeholder="Pesan regu... (Enter)"
                className="flex-1 bg-[#0b0e0c]/95 border border-[#cfa15a]/65 rounded-sm px-2.5 py-1.5 text-[11px] text-[#ebe7dc] focus:outline-none"
              />
              <button
                type="submit"
                aria-label="Kirim chat regu"
                className="px-2 py-1.5 bg-[#1b3a29] border border-[#689f7d]/70 text-[#ebe7dc] rounded-sm cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          ) : (
            <button
              type="button"
              tabIndex={-1}
              data-testid="btn-open-ingame-chat"
              onClick={(e) => {
                e.currentTarget.blur();
                onSetChatOpen?.(true);
              }}
              className="w-fit px-2 py-1 archival-panel hover:bg-[#19211d] text-[10px] text-[#c8d0ca] rounded-sm flex items-center gap-1 cursor-pointer whitespace-nowrap"
            >
              <MessageSquare className="w-3 h-3 text-[#cfa15a]" />
              <span>Chat Regu [T]</span>
            </button>
          )}
        </div>
      )}

      {/* BOTTOM-RIGHT: Slot Peralatan Cepat + Mic Radio */}
      <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 flex items-center gap-1.5 sm:gap-2 pointer-events-auto">
        {isMultiplayer && voiceChatEnabled && onToggleMic && (
          <button
            type="button"
            tabIndex={-1}
            data-testid="btn-ingame-mic"
            onClick={(e) => {
              e.currentTarget.blur();
              onToggleMic();
            }}
            title={
              voiceStatus === 'denied'
                ? 'Izin mikrofon ditolak browser'
                : voiceStatus === 'unavailable'
                  ? 'Perangkat audio WebRTC tidak tersedia'
                  : 'Toggle Mikrofon / Radio HT [B]'
            }
            className={`px-2 py-2 sm:px-3 rounded-sm border text-[10px] sm:text-xs font-semibold font-mono-num flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              micOn && voiceStatus !== 'denied'
                ? 'bg-[#152e20]/95 border-[#689f7d] text-[#c7f2d6]'
                : 'bg-[#0e1411]/90 border-[#2e3832] text-[#8d9991]'
            }`}
          >
            {micOn && voiceStatus !== 'denied' ? (
              <Mic className="w-3.5 h-3.5" />
            ) : (
              <MicOff className="w-3.5 h-3.5" />
            )}
            <span className="hidden sm:inline">
              {voiceStatus === 'denied'
                ? 'Mic Ditolak'
                : micOn
                  ? 'Mic [B] · Aktif'
                  : 'Mic [B] · Mati'}
            </span>
          </button>
        )}

        <button
          type="button"
          tabIndex={-1}
          onClick={(e) => {
            e.currentTarget.blur();
            onToggleFlashlight();
          }}
          className={`px-2 py-2 sm:px-3 rounded-sm border text-[10px] sm:text-xs font-semibold font-mono-num cursor-pointer whitespace-nowrap ${
            hud.flashlightOn
              ? 'bg-[#2a2112]/95 border-[#cfa15a] text-[#ffe8b5]'
              : 'bg-[#0e1411]/90 border-[#2e3832] text-[#8d9991]'
          }`}
        >
          <span className="hidden sm:inline">Senter [F] · {hud.flashlightBattery}%</span>
          <span className="sm:hidden">Senter {hud.flashlightBattery}%</span>
        </button>

        <button
          type="button"
          tabIndex={-1}
          onClick={(e) => {
            e.currentTarget.blur();
            onToggleUV();
          }}
          className={`px-2 py-2 sm:px-3 rounded-sm border text-[10px] sm:text-xs font-semibold font-mono-num cursor-pointer whitespace-nowrap ${
            hud.uvMode
              ? 'bg-[#21153b]/95 border-[#8f6be8] text-[#e1d4ff]'
              : 'bg-[#0e1411]/90 border-[#2e3832] text-[#8d9991]'
          }`}
        >
          <span className="hidden sm:inline">UV [Q] · {hud.uvBattery}%</span>
          <span className="sm:hidden">UV {hud.uvBattery}%</span>
        </button>

        <button
          type="button"
          tabIndex={-1}
          onClick={(e) => {
            e.currentTarget.blur();
            onUseSalt();
          }}
          className="px-2 py-2 sm:px-3 rounded-sm border bg-[#0e1411]/90 hover:bg-[#1a221e] border-[#3d4a42] text-[#ebe7dc] text-[10px] sm:text-xs font-semibold font-mono-num cursor-pointer whitespace-nowrap"
        >
          <span className="hidden sm:inline">Garam [G]: {hud.saltCount}</span>
          <span className="sm:hidden">Garam:{hud.saltCount}</span>
        </button>
      </div>
    </div>
  );
};
