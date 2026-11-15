import React from 'react';
import { STUDIO_INFO } from '../game/data';
import type { AudioSettings, GraphicsQuality, RunSummary } from '../game/types';

interface SettingsControlsProps {
  quality: GraphicsQuality;
  onChangeQuality: (q: GraphicsQuality) => void;
  audioSettings: AudioSettings;
  onChangeAudioSettings: (next: AudioSettings) => void;
  touchControlsEnabled: boolean;
  onToggleTouchControls: () => void;
}

const SettingsControlsSection: React.FC<SettingsControlsProps> = ({
  quality,
  onChangeQuality,
  audioSettings,
  onChangeAudioSettings,
  touchControlsEnabled,
  onToggleTouchControls,
}) => (
  <>
    {/* Audio Settings */}
    <section
      aria-labelledby="audio-settings-heading"
      className="bg-[#090c0b] border border-[rgba(207,161,90,0.18)] rounded-sm p-3.5 flex flex-col gap-2.5"
    >
      <h3
        id="audio-settings-heading"
        className="text-[11px] uppercase tracking-[0.16em] text-[#ebe7dc] font-bold"
      >
        Audio Settings
      </h3>

      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between text-xs text-[#b5c0b9] font-mono-num">
          <label htmlFor="slider-master-volume" className="font-medium">
            Master Volume
          </label>
          <span data-testid="master-volume-value">{audioSettings.masterVolume}%</span>
        </div>
        <input
          id="slider-master-volume"
          type="range"
          min={0}
          max={100}
          value={audioSettings.masterVolume}
          onChange={(e) =>
            onChangeAudioSettings({
              ...audioSettings,
              masterVolume: Number(e.target.value),
            })
          }
          className="w-full accent-[#b53429] cursor-pointer"
        />
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between text-xs text-[#b5c0b9] font-mono-num">
          <label htmlFor="slider-music-volume" className="font-medium">
            Music
          </label>
          <span data-testid="music-volume-value">{audioSettings.musicVolume}%</span>
        </div>
        <input
          id="slider-music-volume"
          type="range"
          min={0}
          max={100}
          value={audioSettings.musicVolume}
          onChange={(e) =>
            onChangeAudioSettings({
              ...audioSettings,
              musicVolume: Number(e.target.value),
            })
          }
          className="w-full accent-[#cfa15a] cursor-pointer"
        />
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between text-xs text-[#b5c0b9] font-mono-num">
          <label htmlFor="slider-sfx-volume" className="font-medium">
            SFX
          </label>
          <span data-testid="sfx-volume-value">{audioSettings.sfxVolume}%</span>
        </div>
        <input
          id="slider-sfx-volume"
          type="range"
          min={0}
          max={100}
          value={audioSettings.sfxVolume}
          onChange={(e) =>
            onChangeAudioSettings({
              ...audioSettings,
              sfxVolume: Number(e.target.value),
            })
          }
          className="w-full accent-[#689f7d] cursor-pointer"
        />
      </div>
    </section>

    {/* Kualitas Grafis & Kontrol Sentuh */}
    <div className="bg-[#090c0b] border border-[rgba(207,161,90,0.18)] rounded-sm p-3.5 flex flex-col gap-2.5">
      <div>
        <div className="text-[11px] uppercase tracking-[0.14em] text-[#9ca7a0] mb-1.5 font-semibold">
          Kualitas Grafis WebGL
        </div>
        <div className="grid grid-cols-3 gap-2">
          {(['low', 'medium', 'high'] as GraphicsQuality[]).map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => onChangeQuality(q)}
              className={`py-1.5 text-xs font-bold uppercase rounded-sm border cursor-pointer ${
                quality === q
                  ? 'bg-[#2a1412] border-[#b53429] text-[#ebe7dc]'
                  : 'bg-[#121714] border-[#26302a] text-[#95a39a]'
              }`}
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-[#1e2621]">
        <span className="text-xs text-[#b5c0b9] font-medium">Kontrol Sentuh Layar (Mobile)</span>
        <button
          type="button"
          role="switch"
          aria-checked={touchControlsEnabled}
          onClick={onToggleTouchControls}
          className={`px-3 py-1 text-[11px] font-bold uppercase rounded-sm border cursor-pointer ${
            touchControlsEnabled
              ? 'bg-[#102418] border-[#689f7d] text-[#9de3b8]'
              : 'bg-[#121714] border-[#26302a] text-[#95a39a]'
          }`}
        >
          {touchControlsEnabled ? 'Aktif' : 'Nonaktif'}
        </button>
      </div>
    </div>
  </>
);

interface SettingsModalProps extends SettingsControlsProps {
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ onClose, ...props }) => (
  <div className="fixed inset-0 z-30 flex items-center justify-center p-4 bg-[#050706]/85 overflow-y-auto">
    <div className="w-full max-w-md archival-card rounded-sm p-5 sm:p-6 flex flex-col gap-3.5 my-auto">
      <div className="text-center">
        <div className="text-[10px] uppercase tracking-[0.22em] text-[#cfa15a] font-semibold">
          {STUDIO_INFO.studio} · Preferensi Sistem
        </div>
        <h2 className="font-display text-xl font-bold tracking-[0.16em] uppercase text-[#ebe7dc] mt-1">
          Pengaturan
        </h2>
      </div>
      <div className="archival-divider" />
      <SettingsControlsSection {...props} />
      <button
        type="button"
        onClick={onClose}
        className="w-full py-2.5 bg-[#9e271e] hover:bg-[#b83025] border border-[#cfa15a]/40 text-[#f7f4ec] font-display text-xs font-bold uppercase tracking-[0.16em] rounded-sm cursor-pointer"
      >
        Simpan &amp; Tutup
      </button>
    </div>
  </div>
);

interface PauseModalProps extends SettingsControlsProps {
  isMultiplayer?: boolean;
  onResume: () => void;
  onRestart: () => void;
  onReturnToLobby?: () => void;
  onExitTitle: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  isMultiplayer = false,
  onResume,
  onRestart,
  onReturnToLobby,
  onExitTitle,
  ...settingsProps
}) => {
  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center p-4 bg-[#050706]/85 overflow-y-auto">
      <div className="w-full max-w-md archival-card rounded-sm p-5 sm:p-6 flex flex-col gap-3.5 my-auto">
        <div className="text-center">
          <div className="text-[10px] uppercase tracking-[0.22em] text-[#cfa15a] font-semibold">
            {STUDIO_INFO.studio} · {STUDIO_INFO.leadDev}
          </div>
          <h2 className="font-display text-xl font-bold tracking-[0.16em] uppercase text-[#ebe7dc] mt-1">
            {isMultiplayer ? 'Menu Jeda (Live)' : 'Permainan Dijeda'}
          </h2>
          {isMultiplayer && (
            <p className="text-[11px] text-[#7ec99e] mt-1">
              Mode Multiplayer: Dunia terus berjalan real-time selama menu ini dibuka.
            </p>
          )}
        </div>

        <div className="archival-divider" />

        <SettingsControlsSection {...settingsProps} />

        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={onResume}
            className="w-full py-2.5 bg-[#9e271e] hover:bg-[#b83025] border border-[#cfa15a]/40 text-[#f7f4ec] font-display text-xs font-bold uppercase tracking-[0.16em] rounded-sm cursor-pointer"
          >
            Lanjutkan
          </button>
          {!isMultiplayer ? (
            <button
              type="button"
              onClick={onRestart}
              className="w-full py-2.5 bg-[#161c19] hover:bg-[#202924] border border-[rgba(207,161,90,0.28)] text-[#ebe7dc] text-xs font-bold uppercase tracking-wider rounded-sm cursor-pointer"
            >
              Ulangi Dari Awal
            </button>
          ) : (
            onReturnToLobby && (
              <button
                type="button"
                onClick={onReturnToLobby}
                className="w-full py-2.5 bg-[#16241d] hover:bg-[#1e3128] border border-[#689f7d]/50 text-[#ccebd8] text-xs font-bold uppercase tracking-wider rounded-sm cursor-pointer"
              >
                Kembali ke Lobby Room
              </button>
            )
          )}
          <button
            type="button"
            onClick={onExitTitle}
            className="w-full py-2.5 bg-transparent hover:bg-[#161c19] border border-[#2a342e] text-[#9ca7a0] text-xs font-bold uppercase tracking-wider rounded-sm cursor-pointer"
          >
            Kembali ke Menu Utama
          </button>
        </div>

        <p className="text-[11px] text-[#8d9690] leading-relaxed border-t border-[rgba(207,161,90,0.16)] pt-2.5">
          {STUDIO_INFO.disclaimer}
        </p>
      </div>
    </div>
  );
};

interface GameOverModalProps {
  summary: RunSummary;
  isMultiplayer?: boolean;
  isHost?: boolean;
  onPlayAgain: () => void;
  onReturnToLobby?: () => void;
  onExitTitle: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  summary,
  isMultiplayer = false,
  isHost = false,
  onPlayAgain,
  onReturnToLobby,
  onExitTitle,
}) => {
  const accentBorder =
    summary.ending === 'true'
      ? 'border-[#689f7d]'
      : summary.ending === 'normal'
        ? 'border-[#cfa15a]'
        : 'border-[#b53429]';

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center p-4 bg-[#050706]/90">
      <div className={`w-full max-w-lg archival-card border-2 ${accentBorder} rounded-sm p-6 flex flex-col gap-4`}>
        <div>
          <span className="text-[10px] uppercase tracking-[0.2em] text-[#cfa15a] font-semibold">
            {STUDIO_INFO.studio} · Akhir Cerita
          </span>
          <h2 className="font-display text-xl font-bold text-[#ebe7dc] mt-1">{summary.endingTitle}</h2>
          <p className="text-xs text-[#cfa15a] mt-1 font-semibold">{summary.endingSubtitle}</p>
        </div>

        <p className="text-sm text-[#cdd4cf] leading-relaxed bg-[#090c0b] border border-[rgba(207,161,90,0.18)] rounded-sm p-3.5">
          {summary.endingMessage}
        </p>

        <div className="grid grid-cols-3 gap-2.5 text-center font-mono-num">
          <div className="bg-[#0b0e0d] border border-[#26302a] rounded-sm p-2.5">
            <div className="text-lg font-bold text-[#cfa15a]">
              {summary.segelBroken}/{summary.totalSegel}
            </div>
            <div className="text-[10px] uppercase tracking-wider text-[#8e9a92]">Segel Fakta</div>
          </div>
          <div className="bg-[#0b0e0d] border border-[#26302a] rounded-sm p-2.5">
            <div className="text-lg font-bold text-[#7ec99e]">{summary.elapsedSeconds}d</div>
            <div className="text-[10px] uppercase tracking-wider text-[#8e9a92]">Durasi</div>
          </div>
          <div className="bg-[#0b0e0d] border border-[#26302a] rounded-sm p-2.5">
            <div className="text-lg font-bold text-[#d97b73]">{summary.ghostHits}</div>
            <div className="text-[10px] uppercase tracking-wider text-[#8e9a92]">Serangan</div>
          </div>
        </div>

        <div className="flex gap-2.5 mt-1">
          {isMultiplayer ? (
            isHost && onReturnToLobby ? (
              <button
                type="button"
                onClick={onReturnToLobby}
                className="flex-1 py-3 bg-[#1d5438] hover:bg-[#256946] border border-[#689f7d] text-[#f5faf6] font-display text-xs font-bold uppercase tracking-[0.14em] rounded-sm cursor-pointer"
              >
                Kembali ke Lobby Room
              </button>
            ) : (
              <div className="flex-1 py-3 px-3 bg-[#101613] border border-[#2c3a32] text-[#98a89f] text-xs text-center rounded-sm">
                Menunggu Host kembali ke Lobby...
              </div>
            )
          ) : (
            <button
              type="button"
              data-start="true"
              onClick={onPlayAgain}
              className="flex-1 py-3 bg-[#9e271e] hover:bg-[#b83025] border border-[#cfa15a]/40 text-[#f7f4ec] font-display text-xs font-bold uppercase tracking-[0.14em] rounded-sm cursor-pointer"
            >
              Main Lagi
            </button>
          )}
          <button
            type="button"
            onClick={onExitTitle}
            className="px-5 py-3 bg-[#161c19] hover:bg-[#202924] border border-[rgba(207,161,90,0.28)] text-[#ebe7dc] text-xs font-bold uppercase tracking-wider rounded-sm cursor-pointer"
          >
            Menu Utama
          </button>
        </div>
      </div>
    </div>
  );
};

interface CreditsModalProps {
  onClose: () => void;
}

export const CreditsModal: React.FC<CreditsModalProps> = ({ onClose }) => (
  <div className="fixed inset-0 z-30 flex items-center justify-center p-4 bg-[#050706]/85">
    <div className="w-full max-w-md archival-card rounded-sm p-6 flex flex-col gap-3">
      <div className="text-[10px] uppercase tracking-[0.2em] text-[#cfa15a] font-semibold">
        Catatan Produksi
      </div>
      <h2 className="font-display text-lg font-bold tracking-[0.14em] uppercase text-[#ebe7dc]">
        Kredit &amp; Etika Karya
      </h2>
      <div className="archival-divider" />
      <div className="text-xs text-[#c7cfc9] leading-relaxed space-y-2">
        <p>
          <strong className="text-[#ebe7dc]">Judul:</strong> {STUDIO_INFO.title}
        </p>
        <p>
          <strong className="text-[#ebe7dc]">Developer:</strong> {STUDIO_INFO.studio}
        </p>
        <p>
          <strong className="text-[#ebe7dc]">Lead Developer:</strong> {STUDIO_INFO.leadDev}
        </p>
        <p className="pt-2 border-t border-[rgba(207,161,90,0.16)] text-[#d9b8b4]">
          {STUDIO_INFO.disclaimer}
        </p>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="mt-2 py-2.5 bg-[#9e271e] hover:bg-[#b83025] border border-[#cfa15a]/40 text-[#f7f4ec] font-display text-xs font-bold uppercase tracking-[0.14em] rounded-sm cursor-pointer"
      >
        Tutup
      </button>
    </div>
  </div>
);
