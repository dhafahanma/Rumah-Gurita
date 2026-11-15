import type { AudioSettings, GhostKind, NpcVoiceId } from './types';

/**
 * Mesin Audio Prosedural Web Audio API (Zero-404) untuk Rumah Gurita: Dimensi Gaib.
 * Menggunakan bus Gain terpisah (Master, Music, SFX) serta menghadirkan suara jump-scare
 * yang khas & berbeda untuk setiap jenis hantu, suara engsel pintu, dan atmosfer malam.
 */
export class HorrorAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private droneGain: GainNode | null = null;
  private padGain: GainNode | null = null;
  private droneOsc: OscillatorNode | null = null;
  private padOscA: OscillatorNode | null = null;
  private padOscB: OscillatorNode | null = null;
  private cricketTimer = 0;
  private heartbeatTimer = 0;
  private stepTimer = 0;
  private ghostCueTimer = 0;
  private muted = false;
  private settings: AudioSettings = {
    masterVolume: 80,
    musicVolume: 65,
    sfxVolume: 85,
  };

  public isMuted(): boolean {
    return this.muted;
  }

  public getAudioSettings(): AudioSettings {
    return { ...this.settings };
  }

  public setAudioSettings(next: AudioSettings): void {
    this.settings = {
      masterVolume: Math.max(0, Math.min(100, Math.round(next.masterVolume))),
      musicVolume: Math.max(0, Math.min(100, Math.round(next.musicVolume))),
      sfxVolume: Math.max(0, Math.min(100, Math.round(next.sfxVolume))),
    };
    this.applyGains();
  }

  public setMuted(muted: boolean): void {
    this.muted = muted;
    this.applyGains();
  }

  public toggleMute(): boolean {
    this.setMuted(!this.muted);
    return this.muted;
  }

  private applyGains(): void {
    if (!this.ctx || !this.masterGain || !this.musicGain || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const masterTarget = this.muted ? 0 : (this.settings.masterVolume / 100) * 0.85;
    const musicTarget = this.settings.musicVolume / 100;
    const sfxTarget = this.settings.sfxVolume / 100;
    this.masterGain.gain.setTargetAtTime(masterTarget, now, 0.04);
    this.musicGain.gain.setTargetAtTime(musicTarget, now, 0.04);
    this.sfxGain.gain.setTargetAtTime(sfxTarget, now, 0.04);
  }

  private hasUserActivation(): boolean {
    if (typeof navigator === 'undefined') return true;
    const ua = (navigator as unknown as { userActivation?: { hasBeenActive: boolean } }).userActivation;
    return ua ? ua.hasBeenActive : true;
  }

  public unlock(force = false): void {
    if (!force && !this.hasUserActivation()) return;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.musicGain = this.ctx.createGain();
      this.sfxGain = this.ctx.createGain();

      this.musicGain.connect(this.masterGain);
      this.sfxGain.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);
      this.applyGains();

      // Musik Layer 1: Sub-bass Dimensi Gaib drone
      this.droneOsc = this.ctx.createOscillator();
      this.droneOsc.type = 'sawtooth';
      this.droneOsc.frequency.value = 46;
      const droneFilter = this.ctx.createBiquadFilter();
      droneFilter.type = 'lowpass';
      droneFilter.frequency.value = 115;
      this.droneGain = this.ctx.createGain();
      this.droneGain.gain.value = 0.03;

      this.droneOsc.connect(droneFilter);
      droneFilter.connect(this.droneGain);
      this.droneGain.connect(this.musicGain);
      this.droneOsc.start();

      // Musik Layer 2: Pad minor gamelan-ambient misterius
      this.padOscA = this.ctx.createOscillator();
      this.padOscB = this.ctx.createOscillator();
      this.padOscA.type = 'sine';
      this.padOscB.type = 'triangle';
      this.padOscA.frequency.value = 146.83;
      this.padOscB.frequency.value = 174.61;
      const padFilter = this.ctx.createBiquadFilter();
      padFilter.type = 'lowpass';
      padFilter.frequency.value = 340;
      this.padGain = this.ctx.createGain();
      this.padGain.gain.value = 0.018;

      this.padOscA.connect(padFilter);
      this.padOscB.connect(padFilter);
      padFilter.connect(this.padGain);
      this.padGain.connect(this.musicGain);
      this.padOscA.start();
      this.padOscB.start();
    }

    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public updateAmbience(
    dt: number,
    inDimensiGaib: boolean,
    sanity: number,
    nearestGhostDist: number,
    isMoving: boolean,
    isSprinting: boolean,
    isCrouching: boolean
  ): void {
    if (!this.ctx || !this.masterGain || this.muted || this.ctx.state !== 'running') return;

    const threat = nearestGhostDist < 10 ? (10 - nearestGhostDist) / 10 : 0;

    if (this.droneGain) {
      const targetDrone = (inDimensiGaib ? 0.08 : 0.025) + threat * 0.11;
      this.droneGain.gain.setTargetAtTime(targetDrone, this.ctx.currentTime, 0.25);
    }
    if (this.padGain && this.padOscB) {
      const targetPad = (inDimensiGaib ? 0.045 : 0.022) + threat * 0.035;
      this.padGain.gain.setTargetAtTime(targetPad, this.ctx.currentTime, 0.35);
      const targetFreqB = threat > 0.45 ? 155.56 : 174.61;
      this.padOscB.frequency.setTargetAtTime(targetFreqB, this.ctx.currentTime, 0.4);
    }

    if (!inDimensiGaib) {
      this.cricketTimer -= dt;
      if (this.cricketTimer <= 0) {
        this.cricketTimer = 1.6 + Math.random() * 2.8;
        this.playCricketChirp();
      }
    }

    const danger = Math.max(
      sanity < 55 ? (55 - sanity) / 55 : 0,
      nearestGhostDist < 7 ? (7 - nearestGhostDist) / 7 : 0
    );
    if (danger > 0.12) {
      this.heartbeatTimer -= dt;
      if (this.heartbeatTimer <= 0) {
        this.heartbeatTimer = Math.max(0.38, 1.05 - danger * 0.62);
        this.playHeartbeat(0.15 + danger * 0.28);
      }
    }

    if (isMoving) {
      this.stepTimer -= dt;
      if (this.stepTimer <= 0) {
        this.stepTimer = isSprinting ? 0.31 : isCrouching ? 0.62 : 0.45;
        this.playFootstep(isCrouching ? 0.05 : isSprinting ? 0.16 : 0.1);
      }
    } else {
      this.stepTimer = 0.08;
    }

    if (inDimensiGaib && nearestGhostDist < 11) {
      this.ghostCueTimer -= dt;
      if (this.ghostCueTimer <= 0) {
        this.ghostCueTimer = 4.2 + Math.random() * 4.5;
        this.playEerieWhisper(Math.max(0.05, (11 - nearestGhostDist) / 11));
      }
    }
  }

  private playCricketChirp(): void {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(4200 + Math.random() * 250, now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.025, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.15);
  }

  private playHeartbeat(volume: number): void {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    for (let i = 0; i < 2; i++) {
      const t = now + i * 0.16;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(i === 0 ? 64 : 52, t);
      osc.frequency.exponentialRampToValueAtTime(28, t + 0.12);
      gain.gain.setValueAtTime(volume, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.15);
    }
  }

  public playFootstep(volume = 0.1): void {
    if (!this.ctx || !this.sfxGain || this.muted || this.ctx.state !== 'running') return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    const baseFreq = 110 * (0.92 + Math.random() * 0.16);
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(38, now + 0.07);
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.09);
  }

  public playClick(high = true): void {
    this.unlock();
    if (!this.ctx || !this.sfxGain || this.muted || this.ctx.state !== 'running') return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(high ? 1450 : 920, now);
    osc.frequency.exponentialRampToValueAtTime(240, now + 0.035);
    gain.gain.setValueAtTime(0.11, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.05);
  }

  public playDoorCreak(opening: boolean): void {
    this.unlock();
    if (!this.ctx || !this.sfxGain || this.muted || this.ctx.state !== 'running') return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const filt = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(opening ? 135 : 195, now);
    osc.frequency.linearRampToValueAtTime(opening ? 225 : 112, now + 0.28);
    filt.type = 'bandpass';
    filt.frequency.value = 540;
    filt.Q.value = 4.5;
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.12, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
    osc.connect(filt);
    filt.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.34);
  }

  public playLockedRattle(): void {
    this.unlock();
    if (!this.ctx || !this.sfxGain || this.muted || this.ctx.state !== 'running') return;
    const now = this.ctx.currentTime;
    [0, 0.08].forEach((offset) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(220, now + offset);
      osc.frequency.exponentialRampToValueAtTime(85, now + offset + 0.05);
      gain.gain.setValueAtTime(0.14, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.06);
      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(now + offset);
      osc.stop(now + offset + 0.07);
    });
  }

  public playDoorSlam(): void {
    this.unlock();
    if (!this.ctx || !this.sfxGain || this.muted || this.ctx.state !== 'running') return;
    const now = this.ctx.currentTime;
    const sub = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(115, now);
    sub.frequency.exponentialRampToValueAtTime(28, now + 0.35);
    subGain.gain.setValueAtTime(0.36, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
    sub.connect(subGain);
    subGain.connect(this.sfxGain);
    sub.start(now);
    sub.stop(now + 0.4);

    const clack = this.ctx.createOscillator();
    const clackGain = this.ctx.createGain();
    clack.type = 'square';
    clack.frequency.setValueAtTime(180, now);
    clack.frequency.exponentialRampToValueAtTime(55, now + 0.14);
    clackGain.gain.setValueAtTime(0.18, now);
    clackGain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
    clack.connect(clackGain);
    clackGain.connect(this.sfxGain);
    clack.start(now);
    clack.stop(now + 0.17);
  }

  /**
   * Suara vokal prosedural berbeda untuk setiap NPC saat berinteraksi / berdialog.
   */
  public playNpcVoice(speakerId: NpcVoiceId, lineIndex = 0): void {
    this.unlock(true);
    if (!this.ctx || !this.sfxGain || this.muted || this.ctx.state !== 'running') return;
    const now = this.ctx.currentTime;

    const profiles: Record<
      NpcVoiceId,
      {
        baseFreq: number;
        contour: number[];
        formantFreq: number;
        q: number;
        oscType: OscillatorType;
        stepSec: number;
        gain: number;
      }
    > = {
      // Pak Ujang: bariton tegas paruh baya, intonasi menurun berwibawa
      satpam: {
        baseFreq: 108,
        contour: [1.02, 1.08, 0.94, 0.88],
        formantFreq: 480,
        q: 3.2,
        oscType: 'sawtooth',
        stepSec: 0.115,
        gain: 0.14,
      },
      // Mang Asep: tenor ramah ceria dengan cengkok Sunda naik-turun
      nasgor: {
        baseFreq: 168,
        contour: [0.95, 1.18, 1.04, 1.24, 0.96],
        formantFreq: 760,
        q: 2.6,
        oscType: 'triangle',
        stepSec: 0.095,
        gain: 0.16,
      },
      // Mas Budi: tenor rendah santai agak serak/datar
      pecel: {
        baseFreq: 136,
        contour: [1.0, 1.06, 0.96, 1.02, 0.92],
        formantFreq: 610,
        q: 2.8,
        oscType: 'sawtooth',
        stepSec: 0.105,
        gain: 0.12,
      },
      // Rani (walkie-talkie): suara remaja tinggi disaring bandpass radio
      rani: {
        baseFreq: 315,
        contour: [1.08, 1.22, 0.96, 1.15],
        formantFreq: 1450,
        q: 4.5,
        oscType: 'triangle',
        stepSec: 0.09,
        gain: 0.14,
      },
      // Ceu Titin (Pemilik Warung Ceu Titin): suara ibu-ibu Sunda hangat lembut bernada sedang-tinggi
      warung_ibu: {
        baseFreq: 238,
        contour: [1.04, 1.16, 1.08, 0.96, 1.12],
        formantFreq: 980,
        q: 2.7,
        oscType: 'triangle',
        stepSec: 0.1,
        gain: 0.15,
      },
      // Rizky & Anak Muda Tongkrongan: suara pemuda energik, cepat, sedikit nasal
      warung_pemuda: {
        baseFreq: 152,
        contour: [0.96, 1.14, 1.2, 1.02, 1.1],
        formantFreq: 720,
        q: 3.1,
        oscType: 'sawtooth',
        stepSec: 0.082,
        gain: 0.13,
      },
    };

    const p = profiles[speakerId];
    const pitchShift = 1 + ((lineIndex % 3) - 1) * 0.035;

    p.contour.forEach((mult, idx) => {
      const t = now + idx * p.stepSec;
      const osc = this.ctx!.createOscillator();
      const formant = this.ctx!.createBiquadFilter();
      const gain = this.ctx!.createGain();

      osc.type = p.oscType;
      const f = p.baseFreq * mult * pitchShift;
      osc.frequency.setValueAtTime(f, t);
      osc.frequency.linearRampToValueAtTime(f * (idx % 2 === 0 ? 1.05 : 0.94), t + p.stepSec * 0.85);

      formant.type = 'bandpass';
      formant.frequency.setValueAtTime(p.formantFreq * (0.94 + idx * 0.04), t);
      formant.Q.value = p.q;

      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(p.gain, t + 0.018);
      gain.gain.exponentialRampToValueAtTime(0.001, t + p.stepSec * 0.9);

      osc.connect(formant);
      formant.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(t);
      osc.stop(t + p.stepSec);
    });
  }

  public playPickup(): void {
    this.unlock();
    if (!this.ctx || !this.sfxGain || this.muted || this.ctx.state !== 'running') return;
    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25];
    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.07);
      gain.gain.setValueAtTime(0.12, now + idx * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.22);
      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(now + idx * 0.07);
      osc.stop(now + idx * 0.07 + 0.24);
    });
  }

  public playDebunkChime(): void {
    this.unlock();
    if (!this.ctx || !this.sfxGain || this.muted || this.ctx.state !== 'running') return;
    const now = this.ctx.currentTime;
    const chord = [392.0, 493.88, 587.33, 783.99];
    chord.forEach((freq, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + i * 0.06);
      gain.gain.setValueAtTime(0.14, now + i * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.7);
      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(now + i * 0.06);
      osc.stop(now + i * 0.06 + 0.72);
    });
  }

  public playEerieWhisper(intensity = 0.5): void {
    if (!this.ctx || !this.sfxGain || this.muted || this.ctx.state !== 'running') return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(520 + Math.random() * 180, now);
    osc.frequency.exponentialRampToValueAtTime(280, now + 0.55);
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.08 * intensity, now + 0.12);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.62);
  }

  /**
   * Suara jump-scare berbeda untuk masing-masing hantu agar identitas tiap hantu terasa jelas!
   */
  public playJumpScare(kind: GhostKind = 'ambu_hideung'): void {
    this.unlock();
    if (!this.ctx || !this.sfxGain || this.muted || this.ctx.state !== 'running') return;
    const now = this.ctx.currentTime;

    if (kind === 'kuntilanak') {
      // Kuntilanak: jeritan / tawa melengking bernada tinggi bergetar
      const shrieks = [0, 0.14, 0.28];
      shrieks.forEach((off, idx) => {
        const osc = this.ctx!.createOscillator();
        const lfo = this.ctx!.createOscillator();
        const lfoGain = this.ctx!.createGain();
        const gain = this.ctx!.createGain();
        osc.type = 'sawtooth';
        const base = 980 - idx * 90;
        osc.frequency.setValueAtTime(base, now + off);
        osc.frequency.exponentialRampToValueAtTime(base * 0.7, now + off + 0.14);
        lfo.frequency.value = 28;
        lfoGain.gain.value = 55;
        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);
        gain.gain.setValueAtTime(0.18, now + off);
        gain.gain.exponentialRampToValueAtTime(0.001, now + off + 0.16);
        osc.connect(gain);
        gain.connect(this.sfxGain!);
        lfo.start(now + off);
        osc.start(now + off);
        lfo.stop(now + off + 0.17);
        osc.stop(now + off + 0.17);
      });
      return;
    }

    if (kind === 'pocong') {
      // Pocong: hantaman tanah + desis kain kafan dingin & disonansi tajam
      const sub = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();
      sub.type = 'sine';
      sub.frequency.setValueAtTime(95, now);
      sub.frequency.exponentialRampToValueAtTime(26, now + 0.35);
      subGain.gain.setValueAtTime(0.32, now);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
      sub.connect(subGain);
      subGain.connect(this.sfxGain);
      sub.start(now);
      sub.stop(now + 0.4);

      [330, 466, 659].forEach((f) => {
        const o = this.ctx!.createOscillator();
        const g = this.ctx!.createGain();
        o.type = 'square';
        o.frequency.setValueAtTime(f, now);
        o.frequency.linearRampToValueAtTime(f * 0.85, now + 0.42);
        g.gain.setValueAtTime(0.1, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
        o.connect(g);
        g.connect(this.sfxGain!);
        o.start(now);
        o.stop(now + 0.46);
      });
      return;
    }

    if (kind === 'genderuwo') {
      // Genderuwo: auman bas sangat rendah & geraman kasar
      [58, 72, 109].forEach((f, idx) => {
        const osc = this.ctx!.createOscillator();
        const filter = this.ctx!.createBiquadFilter();
        const gain = this.ctx!.createGain();
        osc.type = idx === 0 ? 'sawtooth' : 'square';
        osc.frequency.setValueAtTime(f, now);
        osc.frequency.linearRampToValueAtTime(f * 0.58, now + 0.65);
        filter.type = 'lowpass';
        filter.frequency.value = 320;
        gain.gain.setValueAtTime(0.24, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.68);
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain!);
        osc.start(now);
        osc.stop(now + 0.7);
      });
      return;
    }

    if (kind === 'boneka_uci') {
      // Boneka Uci: denting kotak musik sumbang + retakan porselen tinggi
      const notes = [880, 1244, 622, 1396];
      notes.forEach((f, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'triangle';
        const t = now + idx * 0.055;
        osc.frequency.setValueAtTime(f, t);
        osc.frequency.exponentialRampToValueAtTime(f * 0.92, t + 0.25);
        gain.gain.setValueAtTime(0.22, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
        osc.connect(gain);
        gain.connect(this.sfxGain!);
        osc.start(t);
        osc.stop(t + 0.3);
      });
      return;
    }

    // Ambu Hideung (Boss): kor gamelan gaib + sub-bass runtuh + lengkingan berlapis
    [73.4, 155.5, 293.6, 554.3, 830.6].forEach((f, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = idx % 2 === 0 ? 'sawtooth' : 'square';
      osc.frequency.setValueAtTime(f, now);
      osc.frequency.exponentialRampToValueAtTime(f * 0.55, now + 0.68);
      gain.gain.setValueAtTime(0.16, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.72);
      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(now);
      osc.stop(now + 0.75);
    });
  }

  public dispose(): void {
    for (const osc of [this.droneOsc, this.padOscA, this.padOscB]) {
      if (osc) {
        try {
          osc.stop();
        } catch {
          // ignore
        }
      }
    }
    if (this.ctx) {
      this.ctx.close().catch(() => {});
      this.ctx = null;
    }
  }
}
