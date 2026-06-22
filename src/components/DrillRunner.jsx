import { useState, useEffect, useRef } from 'react';
import GoalDiagram from './GoalDiagram';
import ConeDiagram from './ConeDiagram';
import { generateCueText, getLevel, getIntervalSeconds, LEVEL_LABELS, CONE_COLOR_MAP, randomizeRep } from '../data/drills';
import { getPerspective } from '../data/store';
import { playTone, speak, warmUpAudio } from '../audio';

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Build a rep sequence of exactly `count` items, cycling the drill reps if needed.
// `randomize` shuffles rep ORDER; `randomFields` (cone/zone/shotType) replaces
// individual rep VALUES with random valid picks.
function buildSequence(drill, count, randomize, randomFields) {
  const drillReps = drill.reps;
  const anyField = randomFields.cone || randomFields.zone || randomFields.shotType;
  const result = [];
  while (result.length < count) {
    const batch = randomize ? shuffle([...drillReps]) : [...drillReps];
    result.push(...batch);
  }
  return result.slice(0, count).map(r => (anyField ? randomizeRep(r, drill, randomFields) : r));
}

const REP_PRESETS = [8, 12, 16, 20];

export default function DrillRunner({ profile, drill, voice, onComplete, onBack }) {
  const level            = getLevel(profile, drill);
  const defaultInterval  = getIntervalSeconds(drill, level);
  const drillRepCount    = drill.reps.length;
  const perspective      = getPerspective();

  // Pre-session options
  const [pacingMode,    setPacingMode]    = useState('timer');
  const [randomize,     setRandomize]     = useState(false);
  const [randomFields,  setRandomFields]  = useState({ cone: false, zone: false, shotType: false });
  const [interval,      setIntervalSecs]  = useState(defaultInterval);
  const [repPreset,     setRepPreset]     = useState('all');   // 'all' | number | 'custom'
  const [customReps,    setCustomReps]    = useState('');

  // Resolve effective rep count
  const effectiveReps = (() => {
    if (repPreset === 'all') return drillRepCount;
    if (repPreset === 'custom') return Math.max(1, parseInt(customReps) || drillRepCount);
    return repPreset;
  })();

  // Session state
  const [reps,      setReps]      = useState([]);
  const [repIndex,  setRepIndex]  = useState(0);
  const [timeLeft,  setTimeLeft]  = useState(interval);
  const [phase,     setPhase]     = useState('ready');
  const [countdown, setCountdown] = useState(3);

  const startTimeRef = useRef(null);
  const timerRef     = useRef(null);

  const currentRep = reps[repIndex];

  // Timer mode
  useEffect(() => {
    if (phase !== 'running' || pacingMode !== 'timer') return;

    let rep = 0;
    let t   = interval;
    setTimeLeft(t);

    timerRef.current = setInterval(() => {
      t -= 1;
      setTimeLeft(t);
      if (t <= 0) {
        const next = rep + 1;
        if (next >= reps.length) {
          clearInterval(timerRef.current);
          setPhase('done');
          return;
        }
        rep = next;
        setRepIndex(next);
        speak(generateCueText(reps[next], drill, level), voice);
        t = interval;
        setTimeLeft(t);
      }
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  // Tap mode advance
  function handleTap() {
    if (phase !== 'running' || pacingMode !== 'tap') return;
    const next = repIndex + 1;
    if (next >= reps.length) { setPhase('done'); return; }
    setRepIndex(next);
    speak(generateCueText(reps[next], drill, level), voice);
  }

  useEffect(() => {
    if (phase === 'done') {
      window.speechSynthesis?.cancel();
      const duration = startTimeRef.current
        ? Math.round((Date.now() - startTimeRef.current) / 1000)
        : 0;
      setTimeout(() => onComplete({
        totalReps: reps.length, duration, level, levelType: drill.levelType
      }), 800);
    }
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  function startDrill() {
    warmUpAudio(); // unlock iOS audio + speech inside this tap gesture
    const sequence = buildSequence(drill, effectiveReps, randomize, randomFields);
    setReps(sequence);
    setRepIndex(0);
    setTimeLeft(interval);
    setCountdown(3);
    setPhase('countdown');
  }

  // Pre-drill countdown
  useEffect(() => {
    if (phase !== 'countdown') return;
    let n = 3;
    setCountdown(n);
    playTone();
    const id = setInterval(() => {
      n -= 1;
      if (n <= 0) {
        clearInterval(id);
        startTimeRef.current = Date.now();
        setPhase('running');
        speak(generateCueText(reps[0], drill, level), voice);
        return;
      }
      setCountdown(n);
      playTone();
    }, 1000);
    return () => clearInterval(id);
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  const progressPct = pacingMode === 'timer' && phase === 'running'
    ? ((interval - timeLeft) / interval) * 100
    : 0;

  const cueText = phase === 'running' && currentRep
    ? generateCueText(currentRep, drill, level)
    : null;

  const showGoal     = drill.type === 'shot-reaction' || drill.type === 'combined' || drill.type === 'pass';
  const activeConeColorName = currentRep?.cone ?? currentRep?.coneTo;
  const activeConeColor = phase === 'running' && activeConeColorName
    ? CONE_COLOR_MAP[activeConeColorName]
    : null;

  // Which randomize-field toggles apply to this drill type
  const canRandCone     = drill.type === 'cone' || drill.type === 'combined' || drill.type === 'pass';
  const canRandZone     = drill.type === 'shot-reaction' || drill.type === 'combined' || drill.type === 'pass';
  const canRandShotType = canRandZone;
  function toggleField(key) { setRandomFields(f => ({ ...f, [key]: !f[key] })); }

  return (
    <div className="screen runner-screen">
      <div className="runner-header">
        <button className="btn-back-runner" onClick={() => {
          clearInterval(timerRef.current);
          window.speechSynthesis?.cancel();
          onBack();
        }}>← Back</button>
        <div className="runner-title">{drill.name}</div>
        <div className="runner-rep-counter">
          {phase === 'ready' ? '—' : `${Math.min(repIndex + 1, reps.length)} / ${reps.length}`}
        </div>
      </div>

      <div className="runner-level-row">
        <span className="badge badge-level">Level {level} · {LEVEL_LABELS[level]}</span>
        {phase === 'running' && activeConeColor && (drill.type === 'combined' || drill.type === 'pass') && (
          <span className="cone-indicator" style={{ background: activeConeColor }}>
            {activeConeColorName}
          </span>
        )}
      </div>

      <div className="timer-bar-track">
        <div className="timer-bar-fill" style={{
          width: `${progressPct}%`,
          transition: phase === 'running' && pacingMode === 'timer' ? 'width 1s linear' : 'none',
        }} />
      </div>

      <div className="visual-area">
        {showGoal && (
          <GoalDiagram
            activeZone={phase === 'running' ? currentRep?.zone : null}
            handedness={profile.handedness}
            level={level}
            perspective={perspective}
          />
        )}
        {drill.type === 'cone' && (
          <ConeDiagram cones={drill.cones} activeCone={phase === 'running' ? currentRep?.cone : null} />
        )}
        {drill.type === 'combined' && (
          <ConeDiagram cones={drill.cones} activeCone={phase === 'running' ? currentRep?.cone : null} compact />
        )}
        {drill.type === 'pass' && (
          <ConeDiagram
            cones={drill.cones}
            activeCone={phase === 'running' ? currentRep?.coneTo : null}
            fromCone={phase === 'running' ? currentRep?.coneFrom : null}
            compact
          />
        )}
      </div>

      <div className="cue-area">
        {phase === 'ready' && (
          <div className="ready-state">
            {/* Pacing mode */}
            <div className="pacing-toggle">
              <button
                className={`pacing-btn ${pacingMode === 'timer' ? 'pacing-active' : ''}`}
                onClick={() => setPacingMode('timer')}
              >⏱ Timer</button>
              <button
                className={`pacing-btn ${pacingMode === 'tap' ? 'pacing-active' : ''}`}
                onClick={() => setPacingMode('tap')}
              >👆 Manual Tap</button>
            </div>

            {/* Interval adjuster (timer mode only) */}
            {pacingMode === 'timer' && (
              <div className="interval-row">
                <span className="interval-label">Interval</span>
                <button className="interval-btn"
                  onClick={() => setIntervalSecs(s => Math.max(2, s - 1))}>−</button>
                <span className="interval-value">{interval}s</span>
                <button className="interval-btn"
                  onClick={() => setIntervalSecs(s => Math.min(30, s + 1))}>+</button>
              </div>
            )}

            {/* Rep count */}
            <div className="rep-count-row">
              <span className="rep-count-label">Reps</span>
              <div className="rep-count-chips">
                {REP_PRESETS.map(n => (
                  <button
                    key={n}
                    className={`rep-chip ${repPreset === n ? 'rep-chip-active' : ''}`}
                    onClick={() => setRepPreset(n)}
                  >{n}</button>
                ))}
                <button
                  className={`rep-chip ${repPreset === 'all' ? 'rep-chip-active' : ''}`}
                  onClick={() => setRepPreset('all')}
                >All ({drillRepCount})</button>
                <button
                  className={`rep-chip ${repPreset === 'custom' ? 'rep-chip-active' : ''}`}
                  onClick={() => setRepPreset('custom')}
                >Custom</button>
              </div>
              {repPreset === 'custom' && (
                <input
                  className="rep-custom-input"
                  type="number"
                  min="1"
                  max="99"
                  placeholder={drillRepCount}
                  value={customReps}
                  onChange={e => setCustomReps(e.target.value)}
                  autoFocus
                />
              )}
            </div>

            {/* Randomize */}
            <button
              className={`randomize-toggle ${randomize ? 'randomize-on' : ''}`}
              onClick={() => setRandomize(r => !r)}
            >
              <span className="randomize-icon">⇄</span>
              {randomize ? 'Shuffled' : 'Fixed order'}
            </button>

            {/* Per-field randomization */}
            {(canRandCone || canRandZone || canRandShotType) && (
              <div className="rand-field-row">
                <span className="rand-field-label">Randomize</span>
                <div className="rand-field-chips">
                  {canRandCone && (
                    <button className={`rand-chip ${randomFields.cone ? 'rand-chip-on' : ''}`}
                      onClick={() => toggleField('cone')}>🎲 Cone</button>
                  )}
                  {canRandZone && (
                    <button className={`rand-chip ${randomFields.zone ? 'rand-chip-on' : ''}`}
                      onClick={() => toggleField('zone')}>🎲 Net</button>
                  )}
                  {canRandShotType && (
                    <button className={`rand-chip ${randomFields.shotType ? 'rand-chip-on' : ''}`}
                      onClick={() => toggleField('shotType')}>🎲 Shot</button>
                  )}
                </div>
              </div>
            )}

            <p className="ready-hint">{effectiveReps} reps · audio + visual</p>
            <button className="btn-start" onClick={startDrill}>Start Drill</button>
          </div>
        )}

        {phase === 'countdown' && (
          <div className="countdown-display">
            <p className="countdown-number" key={countdown}>{countdown}</p>
            <p className="countdown-label">Get ready…</p>
          </div>
        )}

        {phase === 'running' && (
          <div className="cue-display">
            {cueText
              ? <p className="cue-text">{cueText}</p>
              : <p className="cue-text cue-tone">●</p>
            }
            {pacingMode === 'timer' && <p className="timer-countdown">{timeLeft}s</p>}
            {pacingMode === 'tap'   && <button className="btn-tap" onClick={handleTap}>TAP</button>}
          </div>
        )}

        {phase === 'done' && (
          <div className="done-state">
            <p className="cue-text">Complete ✓</p>
          </div>
        )}
      </div>
    </div>
  );
}
