import { loadSessions, sessionsToCsv, downloadCsv } from '../data/sessions.js';

function formatDate(ts) {
  const d = new Date(ts);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatTime(ts) {
  return new Date(ts).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

const LEVEL_LABELS = { 1: 'Beginner', 2: 'Intermediate', 3: 'Advanced', 4: 'Game Speed' };

export default function SessionHistory({ profile, onBack }) {
  const sessions = loadSessions()
    .filter(s => s.profileId === profile.id)
    .sort((a, b) => b.date - a.date);

  // Group by date string
  const groups = [];
  let lastDate = null;
  for (const s of sessions) {
    const dateStr = formatDate(s.date);
    if (dateStr !== lastDate) {
      groups.push({ date: dateStr, sessions: [] });
      lastDate = dateStr;
    }
    groups[groups.length - 1].sessions.push(s);
  }

  const totalSessions = sessions.length;
  const totalMade     = sessions.reduce((acc, s) => acc + (s.made   ?? 0), 0);
  const totalMissed   = sessions.reduce((acc, s) => acc + (s.missed ?? 0), 0);
  const overallPct    = (totalMade + totalMissed) > 0
    ? Math.round((totalMade / (totalMade + totalMissed)) * 100)
    : null;

  return (
    <div className="screen history-screen">
      <div className="history-header">
        <button className="btn-back" onClick={onBack}>← Back</button>
        <div className="profile-pill">
          <span className="profile-pill-avatar">{profile.name[0]}</span>
          <span className="profile-pill-name">{profile.name}</span>
        </div>
      </div>

      <div className="history-title-row">
        <h2 className="section-title">Session History</h2>
        {sessions.length > 0 && (
          <button className="btn-export" onClick={() =>
            downloadCsv(
              `${profile.name}-sessions-${new Date().toISOString().slice(0, 10)}.csv`,
              sessionsToCsv(sessions)
            )
          }>⬇ CSV</button>
        )}
      </div>

      {sessions.length === 0 ? (
        <div className="history-empty">
          <p className="history-empty-icon">📋</p>
          <p className="history-empty-text">No sessions logged yet.</p>
          <p className="history-empty-sub">Complete a drill and log your results to see history here.</p>
        </div>
      ) : (
        <>
          {/* Summary stats */}
          <div className="history-summary-row">
            <div className="history-stat">
              <span className="history-stat-value">{totalSessions}</span>
              <span className="history-stat-label">sessions</span>
            </div>
            <div className="history-stat">
              <span className="history-stat-value">{totalMade}</span>
              <span className="history-stat-label">total made</span>
            </div>
            {overallPct !== null && (
              <div className="history-stat">
                <span className="history-stat-value">{overallPct}%</span>
                <span className="history-stat-label">save rate</span>
              </div>
            )}
          </div>

          {/* Grouped session list */}
          <div className="history-list">
            {groups.map(group => (
              <div key={group.date} className="history-group">
                <p className="history-date-label">{group.date}</p>
                {group.sessions.map((s, i) => {
                  const hasTally = s.made !== undefined;
                  const pct = hasTally && (s.made + s.missed) > 0
                    ? Math.round((s.made / (s.made + s.missed)) * 100)
                    : null;
                  return (
                    <div key={i} className="history-entry">
                      <div className="history-entry-left">
                        <p className="history-entry-drill">{s.drillName ?? 'Drill'}</p>
                        <p className="history-entry-meta">
                          L{s.level} · {LEVEL_LABELS[s.level] ?? ''} · {formatTime(s.date)}
                        </p>
                      </div>
                      <div className="history-entry-right">
                        {hasTally ? (
                          <>
                            <span className="history-entry-tally">{s.made}/{s.made + s.missed}</span>
                            {pct !== null && (
                              <span className="history-entry-pct">{pct}%</span>
                            )}
                          </>
                        ) : (
                          <span className="history-entry-tally history-no-tally">—</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
