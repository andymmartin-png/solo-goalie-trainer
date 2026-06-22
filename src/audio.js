// Centralized audio for cues and tones.
//
// iOS Safari is the constraint:
//   • Web Audio — an AudioContext starts "suspended" and must be resumed from
//     inside a user gesture, then reused (not recreated per sound).
//   • Speech synthesis — the engine stays locked until the first speak() runs
//     inside a user gesture. Once unlocked, later timer-driven cues are allowed.
//
// warmUpAudio() handles both and must be called synchronously from a real tap
// (the "Start Drill" handler), before any countdown/cue fires.

let ctx = null;

function getCtx() {
  if (typeof window === 'undefined') return null;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  if (!ctx) {
    try { ctx = new AC(); } catch { return null; }
  }
  return ctx;
}

// Unlock both audio subsystems. Call from within a user gesture.
export function warmUpAudio() {
  const c = getCtx();
  if (c) {
    if (c.state === 'suspended') c.resume().catch(() => {});
    // A silent blip nudges the context into the "running" state on iOS.
    try {
      const osc = c.createOscillator();
      const gain = c.createGain();
      gain.gain.value = 0;
      osc.connect(gain);
      gain.connect(c.destination);
      osc.start();
      osc.stop(c.currentTime + 0.02);
    } catch { /* ignore */ }
  }

  if (typeof window !== 'undefined' && window.speechSynthesis) {
    try {
      // Speaking a near-silent utterance inside the gesture unlocks iOS TTS.
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(' ');
      u.volume = 0;
      window.speechSynthesis.speak(u);
    } catch { /* ignore */ }
  }
}

export function playTone() {
  const c = getCtx();
  if (!c) return;
  if (c.state === 'suspended') c.resume().catch(() => {});
  try {
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.connect(gain);
    gain.connect(c.destination);
    osc.frequency.value = 880;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.3, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.15);
    osc.start(c.currentTime);
    osc.stop(c.currentTime + 0.15);
  } catch { /* audio not available */ }
}

export function speak(text, voice) {
  if (!text) { playTone(); return; }
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(text);
  utt.rate = 1.5;
  utt.pitch = 1.0;
  if (voice) utt.voice = voice;
  window.speechSynthesis.speak(utt);
}
