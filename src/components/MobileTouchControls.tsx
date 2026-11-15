import React, { useRef, useState } from 'react';

interface MobileTouchControlsProps {
  isCrouching: boolean;
  isSprinting: boolean;
  onMoveVector: (forward: number, right: number) => void;
  onToggleCrouch: () => void;
  onSprintChange: (sprinting: boolean) => void;
  onTogglePerspective: () => void;
}

export const MobileTouchControls: React.FC<MobileTouchControlsProps> = ({
  isCrouching,
  isSprinting,
  onMoveVector,
  onToggleCrouch,
  onSprintChange,
  onTogglePerspective,
}) => {
  const padRef = useRef<HTMLDivElement | null>(null);
  const activePointerId = useRef<number | null>(null);
  const [knobOffset, setKnobOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const maxRadius = 32;

  const updateStick = (clientX: number, clientY: number) => {
    const pad = padRef.current;
    if (!pad) return;
    const rect = pad.getBoundingClientRect();
    const cx = rect.left + rect.width * 0.5;
    const cy = rect.top + rect.height * 0.5;
    const dx = clientX - cx;
    const dy = clientY - cy;
    const dist = Math.hypot(dx, dy);
    const clamped = Math.min(dist, maxRadius);
    const angle = Math.atan2(dy, dx);
    const kx = dist > 1e-4 ? Math.cos(angle) * clamped : 0;
    const ky = dist > 1e-4 ? Math.sin(angle) * clamped : 0;
    setKnobOffset({ x: kx, y: ky });

    const normRight = kx / maxRadius;
    const normForward = -ky / maxRadius;
    onMoveVector(normForward, normRight);
  };

  const resetStick = () => {
    activePointerId.current = null;
    setKnobOffset({ x: 0, y: 0 });
    onMoveVector(0, 0);
  };

  return (
    <div className="fixed inset-0 z-10 pointer-events-none select-none">
      {/* Virtual Movement Thumbstick — di posisi bottom-44 agar tidak bertumpukan dengan panel status 4-bar di bawahnya */}
      <div
        ref={padRef}
        role="group"
        aria-label="Joystick Gerak Sentuh"
        data-testid="mobile-joystick"
        style={{ touchAction: 'none' }}
        onPointerDown={(e) => {
          e.stopPropagation();
          e.currentTarget.setPointerCapture(e.pointerId);
          activePointerId.current = e.pointerId;
          updateStick(e.clientX, e.clientY);
        }}
        onPointerMove={(e) => {
          if (activePointerId.current !== e.pointerId) return;
          e.stopPropagation();
          updateStick(e.clientX, e.clientY);
        }}
        onPointerUp={(e) => {
          if (activePointerId.current !== e.pointerId) return;
          e.stopPropagation();
          resetStick();
        }}
        onPointerCancel={(e) => {
          if (activePointerId.current !== e.pointerId) return;
          resetStick();
        }}
        className="pointer-events-auto absolute bottom-44 left-3 sm:bottom-48 sm:left-4 w-22 h-22 sm:w-24 sm:h-24 rounded-full archival-panel flex items-center justify-center"
      >
        <div
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#9e271e] border border-[#cfa15a]/75 shadow pointer-events-none"
          style={{
            transform: `translate(${knobOffset.x}px, ${knobOffset.y}px)`,
          }}
        />
      </div>

      {/* Tombol Aksi Gerak Sentuh (Jongkok, Lari, Kamera V) */}
      <div
        className="pointer-events-auto absolute bottom-14 right-3 sm:bottom-16 sm:right-4 flex items-center gap-1 sm:gap-1.5"
        style={{ touchAction: 'none' }}
      >
        <button
          type="button"
          tabIndex={-1}
          aria-pressed={isCrouching}
          onClick={(e) => {
            e.currentTarget.blur();
            onToggleCrouch();
          }}
          className={`px-2 py-2 sm:px-2.5 rounded-sm border text-[10px] sm:text-[11px] font-bold uppercase tracking-wide cursor-pointer ${
            isCrouching
              ? 'bg-[#2a2112]/95 border-[#cfa15a] text-[#ffe8b5]'
              : 'bg-[#0e1411]/90 border-[rgba(207,161,90,0.28)] text-[#cfd6d1]'
          }`}
        >
          Jongkok
        </button>

        <button
          type="button"
          tabIndex={-1}
          aria-pressed={isSprinting}
          onPointerDown={(e) => {
            e.stopPropagation();
            onSprintChange(true);
          }}
          onPointerUp={(e) => {
            e.stopPropagation();
            onSprintChange(false);
          }}
          onPointerCancel={() => onSprintChange(false)}
          onPointerLeave={() => onSprintChange(false)}
          className={`px-2 py-2 sm:px-2.5 rounded-sm border text-[10px] sm:text-[11px] font-bold uppercase tracking-wide cursor-pointer ${
            isSprinting
              ? 'bg-[#2a1412]/95 border-[#b53429] text-[#ffd4cf]'
              : 'bg-[#0e1411]/90 border-[rgba(207,161,90,0.28)] text-[#cfd6d1]'
          }`}
        >
          Lari
        </button>

        <button
          type="button"
          tabIndex={-1}
          onClick={(e) => {
            e.currentTarget.blur();
            onTogglePerspective();
          }}
          className="px-2 py-2 sm:px-2.5 rounded-sm border bg-[#0e1411]/90 border-[rgba(207,161,90,0.28)] text-[#cfd6d1] text-[10px] sm:text-[11px] font-bold uppercase tracking-wide cursor-pointer"
        >
          Kamera
        </button>
      </div>
    </div>
  );
};
