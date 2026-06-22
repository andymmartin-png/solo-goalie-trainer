import { useState, useEffect } from 'react';
import { speak } from '../audio';
import { getSpeechRate, setSpeechRate, SPEECH_RATE_MIN, SPEECH_RATE_MAX } from '../data/store';

const STORAGE_KEY = 'sgt-voice-uri';

export function useSpeechVoice() {
  const [voices, setVoices]           = useState([]);
  const [selectedUri, setSelectedUri] = useState(() => localStorage.getItem(STORAGE_KEY) ?? '');

  useEffect(() => {
    function load() {
      const v = window.speechSynthesis?.getVoices() ?? [];
      if (v.length) setVoices(v);
    }
    load();
    window.speechSynthesis?.addEventListener('voiceschanged', load);
    return () => window.speechSynthesis?.removeEventListener('voiceschanged', load);
  }, []);

  function selectVoice(uri) {
    setSelectedUri(uri);
    localStorage.setItem(STORAGE_KEY, uri);
  }

  const activeVoice = voices.find(v => v.voiceURI === selectedUri) ?? voices[0] ?? null;

  return { voices, activeVoice, selectedUri, selectVoice };
}

export default function VoicePicker({ voices, activeVoice, selectedUri, selectVoice }) {
  const [open, setOpen] = useState(false);
  const [rate, setRate] = useState(() => getSpeechRate());

  if (!voices.length) return null;

  function changeRate(value) {
    const r = setSpeechRate(parseFloat(value));
    setRate(r);
  }

  function testSpeed() {
    speak('High, stick side. Bounce shot.', activeVoice);
  }

  // Group voices by language prefix (en, fr, etc.)
  const enVoices  = voices.filter(v => v.lang.startsWith('en'));
  const otherVoices = voices.filter(v => !v.lang.startsWith('en'));

  return (
    <div className="voice-picker-wrap">
      <button className="voice-toggle" onClick={() => setOpen(o => !o)}>
        <span className="voice-icon">🔊</span>
        <span className="voice-current">
          {activeVoice ? activeVoice.name : 'Default voice'}
        </span>
        <span className="voice-chevron">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="voice-dropdown">
          <p className="voice-section-label">English</p>
          {enVoices.map(v => (
            <button
              key={v.voiceURI}
              className={`voice-option ${v.voiceURI === (activeVoice?.voiceURI) ? 'voice-option-active' : ''}`}
              onClick={() => { selectVoice(v.voiceURI); setOpen(false); speak('High, stick side', v); }}
            >
              <span className="voice-name">{v.name}</span>
              <span className="voice-lang">{v.lang}</span>
            </button>
          ))}
          {otherVoices.length > 0 && (
            <>
              <p className="voice-section-label" style={{ marginTop: 8 }}>Other</p>
              {otherVoices.map(v => (
                <button
                  key={v.voiceURI}
                  className={`voice-option ${v.voiceURI === (activeVoice?.voiceURI) ? 'voice-option-active' : ''}`}
                  onClick={() => { selectVoice(v.voiceURI); setOpen(false); speak('High, stick side', v); }}
                >
                  <span className="voice-name">{v.name}</span>
                  <span className="voice-lang">{v.lang}</span>
                </button>
              ))}
            </>
          )}
        </div>
      )}

      <div className="speed-row">
        <span className="speed-label">Cue speed</span>
        <input
          className="speed-slider"
          type="range"
          min={SPEECH_RATE_MIN}
          max={SPEECH_RATE_MAX}
          step="0.1"
          value={rate}
          onChange={e => changeRate(e.target.value)}
        />
        <span className="speed-value">{rate.toFixed(1)}×</span>
        <button className="speed-test" onClick={testSpeed}>▶ Test</button>
      </div>
    </div>
  );
}
