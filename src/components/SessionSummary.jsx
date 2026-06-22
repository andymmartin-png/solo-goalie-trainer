import { useState } from 'react';
import { LEVEL_LABELS } from '../data/drills';
import { saveSession, getSessionsAtLevel, setStoredLevel } from '../data/sessions.js';

const PROMOTION_THRESHOLD = 3;
const MAX_LEVEL = { 'shot-reaction': 4, 'cone': 3 };

function formatDuration(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export default function SessionSummary({ profile, drill, data, onDone }) {
  const [made,      setMade]      = useState('');
  const [missed,    setMissed]    = useState('');
  const [logged,    setLogged]    = useState(false);
  const [promoted,  setPromoted]  = useState(false);
  const [sessionsAtLevel, setSessionsAtLevel] = useState(null);

  const currentLevel = data.level;
  const levelType    = data.levelType;
  const maxLevel     = MAX_LEVEL[levelType] ?? 4;
  const canPromote   = currentLevel < maxLevel;

  function handleLog() {
    const madeNum   = parseInt(made)   || 0;
    const missedNum = parseInt(missed) || 0;

    saveSession({
      profileId:   profile.id,
      profileName: profile.name,
      drillId:     drill.id,
      drillName:   drill.name,
      levelType,
      level:     currentLevel,
      made:      madeNum,
      missed:    missedNum,
      totalReps: data.totalReps,
    });

    const sessions = getSessionsAtLevel(profile.id, levelType, currentLevel);
    setSessionsAtLevel(sessions.length);
    setLogged(true);
  }

  function handlePromote() {
    const nextLevel = currentLevel + 1;
    setStoredLevel(profile.id, levelType, nextLevel);
    setPromoted(true);
  }

  const total = (parseInt(made) || 0) + (parseInt(missed) || 0);
  const pct   = total > 0 ? Math.round(((parseInt(made) || 0) / total) * 100) : null;

  const showPromotionPrompt = logged && canPromote &&
    sessionsAtLevel !== null && sessionsAtLevel >= PROMOTION_THRESHOLD && !promoted;

  return (
    <div className="screen summary-screen">
      <div className="summary-icon">✓</div>
      <h2 className="summary-title">Session Complete</h2>

      <div className="summary-card">
        <div className="summary-drill-name">{drill.name}</div>
        <div className="summary-stats">
          <div className="summary-stat">
            <span className="stat-value">{data.totalReps}</span>
            <span className="stat-label">reps</span>
          </div>
          <div className="summary-stat-divider" />
          <div className="summary-stat">
            <span className="stat-value">{formatDuration(data.duration)}</span>
            <span className="stat-label">duration</span>
          </div>
          <div className="summary-stat-divider" />
          <div className="summary-stat">
            <span className="stat-value">L{currentLevel}</span>
            <span className="stat-label">{LEVEL_LABELS[currentLevel]}</span>
          </div>
        </div>
      </div>

      {/* Tally */}
      {!logged && (
        <div className="tally-section">
          <h3 className="tally-title">Log your results</h3>
          <p className="tally-hint">How many saves did you make this session?</p>
          <div className="tally-row">
            <div className="tally-field">
              <label className="tally-label">Made</label>
              <input className="tally-input" type="number" min="0" max={data.totalReps}
                value={made} onChange={e => setMade(e.target.value)} placeholder="0" />
            </div>
            <span className="tally-slash">/</span>
            <div className="tally-field">
              <label className="tally-label">Missed</label>
              <input className="tally-input" type="number" min="0" max={data.totalReps}
                value={missed} onChange={e => setMissed(e.target.value)} placeholder="0" />
            </div>
          </div>
          {pct !== null && <p className="tally-pct">{pct}% save rate</p>}
        </div>
      )}

      {/* Promotion prompt */}
      {showPromotionPrompt && (
        <div className="promotion-card">
          <div className="promotion-icon">⬆</div>
          <div className="promotion-text">
            <p className="promotion-title">Ready to level up?</p>
            <p className="promotion-desc">
              You've logged {sessionsAtLevel} sessions at Level {currentLevel} ({LEVEL_LABELS[currentLevel]}).
              Move to Level {currentLevel + 1} ({LEVEL_LABELS[currentLevel + 1]})?
            </p>
          </div>
          <button className="btn-promote" onClick={handlePromote}>
            Level Up →
          </button>
        </div>
      )}

      {promoted && (
        <div className="promotion-confirmed">
          <p>✓ Moved to Level {currentLevel + 1} · {LEVEL_LABELS[currentLevel + 1]}</p>
        </div>
      )}

      {/* Actions */}
      <div className="summary-actions">
        {!logged ? (
          <>
            <button className="btn-primary" onClick={handleLog}>
              Save Results
            </button>
            <button className="btn-ghost" onClick={onDone}>
              Skip logging
            </button>
          </>
        ) : (
          <button className="btn-primary" onClick={onDone}>
            Done
          </button>
        )}
      </div>
    </div>
  );
}
