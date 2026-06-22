import { LEVEL_LABELS } from '../data/drills';
import { loadProfiles } from '../data/store';
import { getStoredLevel } from '../data/sessions.js';
import ThemeToggle from './ThemeToggle';

function liveLevel(profile, type) {
  return getStoredLevel(profile.id, type) ?? (type === 'cone' ? profile.coneLevel : profile.shotReactionLevel);
}

export default function ProfileSelect({ onSelect, onCoach }) {
  const profiles = loadProfiles();

  return (
    <div className="screen profile-screen">
      <div className="profile-topbar">
        <button className="btn-coach" onClick={onCoach}>👤 Coach</button>
        <ThemeToggle />
      </div>

      <div className="screen-header">
        <div className="app-logo">
          <span className="logo-icon">🥍</span>
          <h1 className="app-title">Solo Goalie Trainer</h1>
        </div>
        <p className="screen-subtitle">Select your profile to begin</p>
      </div>

      <div className="profile-grid">
        {profiles.map(profile => {
          const shotLevel = liveLevel(profile, 'shot-reaction');
          const coneLevel = liveLevel(profile, 'cone');
          return (
            <button
              key={profile.id}
              className="profile-card"
              onClick={() => onSelect(profile)}
            >
              <div className="profile-avatar">{profile.name[0]}</div>
              <div className="profile-name">{profile.name}</div>
              <div className="profile-meta">
                <span className="badge badge-shot">
                  Shot L{shotLevel}
                  <span className="badge-label"> · {LEVEL_LABELS[shotLevel]}</span>
                </span>
                <span className="badge badge-cone">Cone L{coneLevel}</span>
              </div>
              <div className="profile-hand">
                {profile.handedness === 'right' ? 'Right-handed' : 'Left-handed'}
              </div>
            </button>
          );
        })}
      </div>

      <p className="screen-footer">Manage athletes and drills in Coach mode</p>
    </div>
  );
}
