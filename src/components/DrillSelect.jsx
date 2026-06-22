import { getLevel, LEVEL_LABELS } from '../data/drills';
import { loadDrills } from '../data/store';
import VoicePicker, { useSpeechVoice } from './VoicePicker';

const TYPE_LABELS = {
  'shot-reaction': 'Shot Reaction',
  'cone':          'Cone Drill',
  'combined':      'Combined',
};

const TYPE_COLORS = {
  'shot-reaction': 'badge-shot',
  'cone':          'badge-cone',
  'combined':      'badge-combined',
};

export default function DrillSelect({ profile, onSelect, onHistory, onBack }) {
  const voiceState = useSpeechVoice();
  const drills = loadDrills();

  return (
    <div className="screen drill-screen">
      <div className="drill-screen-header">
        <button className="btn-back" onClick={onBack}>← Back</button>
        <div className="profile-pill">
          <span className="profile-pill-avatar">{profile.name[0]}</span>
          <span className="profile-pill-name">{profile.name}</span>
          <span className="profile-pill-hand">
            {profile.handedness === 'right' ? 'R' : 'L'}
          </span>
        </div>
        <button className="btn-history" onClick={onHistory}>📋 History</button>
      </div>

      <VoicePicker {...voiceState} />

      <h2 className="section-title">Select a Drill</h2>

      <div className="drill-list">
        {drills.map(drill => {
          const level = getLevel(profile, drill);
          return (
            <button
              key={drill.id}
              className="drill-card"
              onClick={() => onSelect(drill, voiceState.activeVoice)}
            >
              <div className="drill-card-top">
                <span className={`badge ${TYPE_COLORS[drill.type]}`}>
                  {TYPE_LABELS[drill.type]}
                </span>
                <span className="drill-level">
                  Level {level} · {LEVEL_LABELS[level]}
                </span>
              </div>
              <div className="drill-card-name">{drill.name}</div>
              <div className="drill-card-desc">{drill.description}</div>
              <div className="drill-card-meta">
                {drill.reps.length} reps · {drill.intervalSeconds}s intervals
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
