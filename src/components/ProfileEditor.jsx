import { useState } from 'react';
import { addProfile, updateProfile } from '../data/store';
import { LEVEL_LABELS } from '../data/drills';

const LEVELS = [1, 2, 3, 4];

export default function ProfileEditor({ profile, onDone }) {
  const editing = !!profile;
  const [name,       setName]       = useState(profile?.name ?? '');
  const [handedness, setHandedness] = useState(profile?.handedness ?? 'right');
  const [shotLevel,  setShotLevel]  = useState(profile?.shotReactionLevel ?? 1);
  const [coneLevel,  setConeLevel]  = useState(profile?.coneLevel ?? 1);

  const valid = name.trim().length > 0;

  function save() {
    if (!valid) return;
    const data = {
      name: name.trim(),
      handedness,
      shotReactionLevel: shotLevel,
      coneLevel,
    };
    if (editing) updateProfile(profile.id, data);
    else addProfile(data);
    onDone();
  }

  return (
    <div className="screen editor-screen">
      <div className="editor-header">
        <button className="btn-back" onClick={onDone}>← Cancel</button>
        <h2 className="editor-title">{editing ? 'Edit Athlete' : 'New Athlete'}</h2>
        <button className="btn-save" disabled={!valid} onClick={save}>Save</button>
      </div>

      <div className="editor-body">
        <label className="field">
          <span className="field-label">Name</span>
          <input className="field-input" value={name} autoFocus
            onChange={e => setName(e.target.value)} placeholder="Athlete name" />
        </label>

        <div className="field">
          <span className="field-label">Catch Hand</span>
          <div className="seg-control">
            <button className={`seg-btn ${handedness === 'right' ? 'seg-active' : ''}`}
              onClick={() => setHandedness('right')}>Right</button>
            <button className={`seg-btn ${handedness === 'left' ? 'seg-active' : ''}`}
              onClick={() => setHandedness('left')}>Left</button>
          </div>
        </div>

        <div className="field">
          <span className="field-label">Shot Reaction Level</span>
          <div className="level-picker">
            {LEVELS.map(l => (
              <button key={l} className={`level-opt ${shotLevel === l ? 'level-opt-active' : ''}`}
                onClick={() => setShotLevel(l)}>
                <span className="level-opt-num">L{l}</span>
                <span className="level-opt-label">{LEVEL_LABELS[l]}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <span className="field-label">Cone Drill Level</span>
          <div className="level-picker">
            {LEVELS.slice(0, 3).map(l => (
              <button key={l} className={`level-opt ${coneLevel === l ? 'level-opt-active' : ''}`}
                onClick={() => setConeLevel(l)}>
                <span className="level-opt-num">L{l}</span>
                <span className="level-opt-label">{LEVEL_LABELS[l]}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
