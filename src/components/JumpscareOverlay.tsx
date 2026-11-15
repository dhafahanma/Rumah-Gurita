import React from 'react';
import type { GhostKind, JumpscareEvent } from '../game/types';

interface JumpscareOverlayProps {
  event: JumpscareEvent | null;
}

const SCARE_THEME: Record<
  GhostKind,
  { bg: string; accent: string; caption: string; subtitle: string }
> = {
  ambu_hideung: {
    bg: 'radial-gradient(circle at 50% 45%, rgba(120,16,12,0.88) 0%, rgba(10,4,5,0.96) 68%)',
    accent: '#ef2e24',
    caption: 'AMBU HIDEUNG',
    subtitle: 'ILUSI MITOS PEMUJAAN MENGURUNG PENGELIHATANMU!',
  },
  kuntilanak: {
    bg: 'radial-gradient(circle at 50% 45%, rgba(28,56,74,0.85) 0%, rgba(4,7,10,0.96) 70%)',
    accent: '#a9dcff',
    caption: 'KUNTILANAK',
    subtitle: 'TAWA MELENGKING DARI BALIK KEGELAPAN!',
  },
  pocong: {
    bg: 'radial-gradient(circle at 50% 45%, rgba(92,84,54,0.84) 0%, rgba(8,8,6,0.97) 68%)',
    accent: '#e5d499',
    caption: 'POCONG',
    subtitle: 'KAFAN KUSUT MELOMPAT TEPAT DI DEPAN WAJAHMU!',
  },
  genderuwo: {
    bg: 'radial-gradient(circle at 50% 45%, rgba(110,42,16,0.88) 0%, rgba(10,5,3,0.97) 70%)',
    accent: '#ff8a3d',
    caption: 'GENDERUWO',
    subtitle: 'RAUNGAN BESAR MENGGUNCANG LORONG RUMAH!',
  },
  boneka_uci: {
    bg: 'radial-gradient(circle at 50% 45%, rgba(88,24,48,0.84) 0%, rgba(8,5,8,0.97) 70%)',
    accent: '#f0b6c8',
    caption: 'BONEKA UCI',
    subtitle: 'IA BERPINDAH SAAT KAU BERPALING!',
  },
};

function renderGhostVisage(kind: GhostKind) {
  switch (kind) {
    case 'ambu_hideung':
      return (
        <svg viewBox="0 0 400 400" className="w-[74vmin] h-[74vmin] max-w-[540px] max-h-[540px]" aria-hidden="true">
          {/* Tentacle-like hair tendrils radiating outward matching concept art */}
          <g stroke="#08080a" strokeWidth="14" strokeLinecap="round" fill="none">
            <path d="M200 110 C120 40, 45 75, 22 145" />
            <path d="M200 110 C280 40, 355 75, 378 145" />
            <path d="M160 150 C90 155, 35 215, 18 300" />
            <path d="M240 150 C310 155, 365 215, 382 300" />
            <path d="M145 210 C95 255, 78 330, 62 390" />
            <path d="M255 210 C305 255, 322 330, 338 390" />
          </g>
          {/* Tattered kebaya shoulders */}
          <path d="M60 395 L135 255 L200 288 L265 255 L340 395 Z" fill="#121417" stroke="#2c3035" strokeWidth="4" />
          {/* Shadowed face oval */}
          <ellipse cx="200" cy="175" rx="84" ry="105" fill="#181c22" stroke="#060708" strokeWidth="8" />
          {/* Piercing crimson eyes */}
          <ellipse cx="164" cy="162" rx="19" ry="9" fill="#ff241c" />
          <ellipse cx="236" cy="162" rx="19" ry="9" fill="#ff241c" />
          <circle cx="164" cy="162" r="5" fill="#fff3e6" />
          <circle cx="236" cy="162" r="5" fill="#fff3e6" />
          {/* Screaming mouth shadow & sharp streaks */}
          <path d="M162 225 Q200 205 238 225 Q228 265 200 268 Q172 265 162 225 Z" fill="#050406" />
          {/* Reaching claw hands */}
          <path d="M40 365 L86 285 L105 298 L72 372 M95 280 L118 258 M108 292 L134 274 M82 288 L94 256" stroke="#7d8691" strokeWidth="7" strokeLinecap="round" fill="none" />
          <path d="M360 365 L314 285 L295 298 L328 372 M305 280 L282 258 M292 292 L266 274 M318 288 L306 256" stroke="#7d8691" strokeWidth="7" strokeLinecap="round" fill="none" />
        </svg>
      );

    case 'kuntilanak':
      return (
        <svg viewBox="0 0 400 400" className="w-[74vmin] h-[74vmin] max-w-[540px] max-h-[540px]" aria-hidden="true">
          {/* Messy long raven hair curtain */}
          <path d="M75 390 C55 210, 75 55, 200 42 C325 55, 345 210, 325 390 Z" fill="#07090b" />
          {/* Pale bluish corpse face */}
          <ellipse cx="200" cy="186" rx="76" ry="98" fill="#ccd8dc" />
          {/* Hollow dark eye sockets with tiny cold glints */}
          <ellipse cx="165" cy="164" rx="22" ry="18" fill="#0a0d10" />
          <ellipse cx="235" cy="164" rx="22" ry="18" fill="#0a0d10" />
          <circle cx="165" cy="164" r="3.5" fill="#bce6ff" />
          <circle cx="235" cy="164" r="3.5" fill="#bce6ff" />
          {/* Wide shrieking jaw */}
          <ellipse cx="200" cy="242" rx="34" ry="44" fill="#0c0507" stroke="#5c2026" strokeWidth="5" />
          <path d="M174 218 L184 230 L194 217 L204 230 L214 217 L226 229" stroke="#e4ebe9" strokeWidth="4" fill="none" />
          {/* Draped hair strands across face */}
          <path d="M140 70 Q152 175 130 295 M260 68 Q245 180 272 298 M204 52 Q212 130 198 166" stroke="#080a0c" strokeWidth="9" strokeLinecap="round" fill="none" />
        </svg>
      );

    case 'pocong':
      return (
        <svg viewBox="0 0 400 400" className="w-[74vmin] h-[74vmin] max-w-[540px] max-h-[540px]" aria-hidden="true">
          {/* Top-tied shroud crown (ikatan pocong) */}
          <path d="M165 65 L200 10 L235 65 Z" fill="#b5b2a4" />
          <rect x="168" y="62" width="64" height="14" rx="4" fill="#5e5a4d" />
          {/* Tight shroud wrapping around shoulders and skull */}
          <path d="M88 395 C88 215, 115 72, 200 72 C285 72, 312 215, 312 395 Z" fill="#aba89b" stroke="#47443c" strokeWidth="6" />
          {/* Exposed blackened face inside shroud oval */}
          <ellipse cx="200" cy="188" rx="64" ry="82" fill="#2c2924" stroke="#615d52" strokeWidth="6" />
          {/* Sunken sockets + eerie glowing yellow pinpoints */}
          <circle cx="170" cy="166" r="18" fill="#0a0907" />
          <circle cx="230" cy="166" r="18" fill="#0a0907" />
          <circle cx="170" cy="166" r="4.5" fill="#e8cf72" />
          <circle cx="230" cy="166" r="4.5" fill="#e8cf72" />
          {/* Nasal cavity + dry grinning jaw */}
          <path d="M192 204 L200 188 L208 204 Z" fill="#0e0c0a" />
          <rect x="168" y="226" width="64" height="26" rx="10" fill="#0c0a08" />
          <path d="M174 226 V252 M187 226 V252 M200 226 V252 M213 226 V252 M226 226 V252" stroke="#9e998b" strokeWidth="3.5" />
        </svg>
      );

    case 'genderuwo':
      return (
        <svg viewBox="0 0 400 400" className="w-[74vmin] h-[74vmin] max-w-[540px] max-h-[540px]" aria-hidden="true">
          {/* Massive hulking furry shoulders */}
          <path d="M16 395 C25 220, 95 160, 200 160 C305 160, 375 220, 384 395 Z" fill="#170f0b" />
          {/* Broad beast skull */}
          <ellipse cx="200" cy="176" rx="112" ry="118" fill="#261710" stroke="#0d0704" strokeWidth="10" />
          {/* Heavy brow ridge */}
          <path d="M98 135 Q150 156 200 142 Q250 156 302 135" stroke="#0e0704" strokeWidth="18" strokeLinecap="round" fill="none" />
          {/* Blazing amber-crimson eyes */}
          <ellipse cx="152" cy="165" rx="22" ry="12" fill="#ff541f" />
          <ellipse cx="248" cy="165" rx="22" ry="12" fill="#ff541f" />
          <circle cx="152" cy="165" r="5" fill="#fff0c4" />
          <circle cx="248" cy="165" r="5" fill="#fff0c4" />
          {/* Roaring maw & huge lower fangs */}
          <path d="M126 225 Q200 202 274 225 Q260 296 200 302 Q140 296 126 225 Z" fill="#120403" />
          <polygon points="146,274 158,236 170,276" fill="#e6dcc8" />
          <polygon points="230,276 242,236 254,274" fill="#e6dcc8" />
          <polygon points="178,220 188,244 198,220" fill="#d9cbb3" />
          <polygon points="204,220 214,244 224,220" fill="#d9cbb3" />
        </svg>
      );

    case 'boneka_uci':
      return (
        <svg viewBox="0 0 400 400" className="w-[74vmin] h-[74vmin] max-w-[540px] max-h-[540px]" aria-hidden="true">
          {/* Doll bonnet hair */}
          <circle cx="105" cy="165" r="58" fill="#181216" />
          <circle cx="295" cy="165" r="58" fill="#181216" />
          <path d="M100 155 C100 62, 300 62, 300 155 Z" fill="#181216" />
          {/* Cracked porcelain face */}
          <ellipse cx="200" cy="196" rx="92" ry="104" fill="#e2d9d0" stroke="#473c3c" strokeWidth="5" />
          {/* Porcelain fracture cracks */}
          <path d="M142 106 L160 144 L148 172 L166 196 M258 122 L236 164 L248 212" stroke="#2c2424" strokeWidth="3.5" fill="none" />
          {/* Oversized hollow black button eyes with crimson glints */}
          <circle cx="158" cy="182" r="28" fill="#090708" />
          <circle cx="242" cy="182" r="28" fill="#090708" />
          <circle cx="158" cy="182" r="4.5" fill="#d92b21" />
          <circle cx="242" cy="182" r="4.5" fill="#d92b21" />
          {/* Stitched crooked porcelain smile */}
          <path d="M146 244 Q200 282 254 244" stroke="#1c0d10" strokeWidth="7" strokeLinecap="round" fill="none" />
          <path d="M162 246 L160 264 M180 255 L180 274 M200 260 L200 279 M220 255 L220 274 M238 246 L240 264" stroke="#1c0d10" strokeWidth="4" />
        </svg>
      );
  }
}

export const JumpscareOverlay: React.FC<JumpscareOverlayProps> = ({ event }) => {
  if (!event) return null;
  const theme = SCARE_THEME[event.kind];

  return (
    <div
      data-testid="jumpscare-overlay"
      data-ghost-kind={event.kind}
      className="fixed inset-0 z-40 pointer-events-none select-none overflow-hidden flex flex-col items-center justify-center"
      style={{ background: theme.bg }}
    >
      <div className="jumpscare-shake flex items-center justify-center">
        {renderGhostVisage(event.kind)}
      </div>
      <div className="absolute bottom-14 left-1/2 -translate-x-1/2 text-center px-4">
        <div
          className="font-display text-2xl sm:text-4xl font-extrabold tracking-[0.22em] uppercase hud-text-shadow"
          style={{ color: theme.accent }}
        >
          {theme.caption}
        </div>
        <div className="text-[11px] sm:text-xs font-semibold tracking-[0.18em] uppercase text-[#f0eae0] mt-1 hud-text-shadow">
          {theme.subtitle}
        </div>
      </div>
    </div>
  );
};
