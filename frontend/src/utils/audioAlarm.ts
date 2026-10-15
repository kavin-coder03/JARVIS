let audioCtx: AudioContext | null = null;
let activeOscillators: OscillatorNode[] = [];
let alarmTimeout: any = null;

export function isAlarmEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  return localStorage.getItem('trueqr_alarm_enabled') !== 'false';
}

export function setAlarmEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('trueqr_alarm_enabled', enabled ? 'true' : 'false');
}

function getAudioContext(): AudioContext | null {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return null;
    if (!audioCtx || audioCtx.state === 'closed') {
      audioCtx = new AudioContextClass();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  } catch (err) {
    console.warn('Web Audio API not accessible:', err);
    return null;
  }
}

export function stopAlarmSound(): void {
  if (alarmTimeout) {
    clearTimeout(alarmTimeout);
    alarmTimeout = null;
  }
  activeOscillators.forEach((osc) => {
    try {
      osc.stop();
      osc.disconnect();
    } catch {
      // Ignored if already stopped
    }
  });
  activeOscillators = [];
}

export const stopHighRiskAlarm = stopAlarmSound;

/**
 * Plays a controlled, synthesized 3-pulse cybersecurity alarm sound.
 * Does not play indefinitely (runs for 1.8 seconds max).
 */
export function playHighRiskAlarm(): boolean {
  if (!isAlarmEnabled()) return false;

  const ctx = getAudioContext();
  if (!ctx) return false;

  // Stop any existing sound first
  stopAlarmSound();

  const now = ctx.currentTime;
  const beeps = [
    { freq: 880, start: 0.05, duration: 0.22 },
    { freq: 660, start: 0.35, duration: 0.22 },
    { freq: 880, start: 0.65, duration: 0.22 },
    { freq: 660, start: 0.95, duration: 0.22 },
    { freq: 990, start: 1.25, duration: 0.35 },
  ];

  beeps.forEach(({ freq, start, duration }) => {
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now + start);

      // Volume envelope with gentle attack and decay
      gain.gain.setValueAtTime(0.001, now + start);
      gain.gain.exponentialRampToValueAtTime(0.2, now + start + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + start + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + start);
      osc.stop(now + start + duration + 0.05);

      activeOscillators.push(osc);
    } catch (err) {
      console.warn('Alarm audio node creation failed:', err);
    }
  });

  // Auto clean-up after 1.8 seconds
  alarmTimeout = setTimeout(() => {
    stopAlarmSound();
  }, 1800);

  return true;
}

export function testAlarmSound(): boolean {
  return playHighRiskAlarm();
}
