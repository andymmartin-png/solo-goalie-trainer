import { describe, it, expect } from 'vitest';
import { warmUpAudio, playTone, speak } from './audio';

// jsdom provides no AudioContext / speechSynthesis, so these must all be
// safe no-ops rather than throwing (matches a browser without audio support).
describe('audio graceful degradation', () => {
  it('warmUpAudio does not throw without audio APIs', () => {
    expect(() => warmUpAudio()).not.toThrow();
  });

  it('playTone does not throw without an AudioContext', () => {
    expect(() => playTone()).not.toThrow();
  });

  it('speak does not throw with or without text', () => {
    expect(() => speak('High stick side')).not.toThrow();
    expect(() => speak(null)).not.toThrow(); // falls back to tone
  });
});
