import { useState, useRef } from 'react';
import { loadProfiles, deleteProfile, loadDrills, deleteDrill, getPerspective, setPerspective } from '../data/store';
import { LEVEL_LABELS } from '../data/drills';
import {
  loadSessions, sessionsToCsv, downloadCsv,
  countSessionsForProfile, deleteSessionsForProfile,
  parseSessionsCsv, addSessionsDeduped,
} from '../data/sessions';
import ThemeToggle from './ThemeToggle';
import ConfirmModal from './ConfirmModal';

const TYPE_LABELS = {
  'shot-reaction': 'Shot Reaction',
  'cone':          'Cone Drill',
  'combined':      'Combined',
};

export default function AdminDashboard({ onBack, onEditProfile, onNewProfile, onEditDrill, onNewDrill }) {
  const [, force]  = useState(0);
  const refresh    = () => force(n => n + 1);
  const profiles   = loadProfiles();
  const drills     = loadDrills();
  const sessions   = loadSessions();
  const [perspective, setLocalPersp] = useState(getPerspective());
  const [confirmState, setConfirmState] = useState(null); // { title, message, danger, onConfirm }
  const [importGoalieId, setImportGoalieId] = useState(profiles[0]?.id ?? '');
  const [importMsg, setImportMsg] = useState(null);       // { ok, text }
  const fileRef = useRef(null);

  function changePerspective(value) {
    setPerspective(value);
    setLocalPersp(value);
  }

  function askDeleteProfile(p) {
    const n = countSessionsForProfile(p.id);
    setConfirmState({
      title: `Delete ${p.name}?`,
      message: n > 0
        ? `This permanently removes ${p.name} and their ${n} logged session${n === 1 ? '' : 's'}.`
        : `This permanently removes ${p.name}. They have no logged sessions.`,
      confirmLabel: 'Delete',
      danger: true,
      onConfirm: () => {
        deleteSessionsForProfile(p.id);  // cascade — no orphaned sessions
        deleteProfile(p.id);
        if (importGoalieId === p.id) setImportGoalieId(loadProfiles()[0]?.id ?? '');
        setConfirmState(null);
        refresh();
      },
    });
  }

  function askDeleteDrill(d) {
    setConfirmState({
      title: `Delete ${d.name}?`,
      message: 'This removes the drill from the library. Logged sessions that reference it are kept.',
      confirmLabel: 'Delete',
      danger: true,
      onConfirm: () => { deleteDrill(d.id); setConfirmState(null); refresh(); },
    });
  }

  function exportAll() {
    if (sessions.length === 0) { alert('No sessions to export yet.'); return; }
    const csv = sessionsToCsv([...sessions].sort((a, b) => b.date - a.date));
    downloadCsv(`goalie-sessions-${new Date().toISOString().slice(0, 10)}.csv`, csv);
  }

  function handleImportFile(e) {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-importing the same file
    if (!file) return;
    const goalie = profiles.find(p => p.id === importGoalieId);
    if (!goalie) { setImportMsg({ ok: false, text: 'Select a goalie first.' }); return; }

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = parseSessionsCsv(String(reader.result));
        if (!parsed.length) { setImportMsg({ ok: false, text: 'No session rows found in that file.' }); return; }
        // Assign target goalie and infer levelType / drillId from the drill library by name.
        const records = parsed.map(r => {
          const match = drills.find(d => d.name.toLowerCase() === r.drillName.toLowerCase());
          return {
            ...r,
            profileId:   goalie.id,
            profileName: goalie.name,
            drillId:     match?.id,
            levelType:   match?.levelType ?? 'shot-reaction',
          };
        });
        const { added, skipped } = addSessionsDeduped(records);
        const base = added === 0
          ? `No new sessions — all ${skipped} already imported.`
          : `Imported ${added} session${added === 1 ? '' : 's'} to ${goalie.name}.`;
        const note = added > 0 && skipped > 0 ? ` (${skipped} duplicate${skipped === 1 ? '' : 's'} skipped)` : '';
        setImportMsg({ ok: added > 0, text: base + note });
        refresh();
      } catch {
        setImportMsg({ ok: false, text: 'Could not read that file. Expected a sessions CSV.' });
      }
    };
    reader.onerror = () => setImportMsg({ ok: false, text: 'Failed to read the file.' });
    reader.readAsText(file);
  }

  return (
    <div className="screen admin-screen">
      <div className="admin-header">
        <button className="btn-back" onClick={onBack}>← Back</button>
        <h2 className="admin-title">Coach Mode</h2>
        <ThemeToggle />
      </div>

      {/* Profiles */}
      <section className="admin-section">
        <div className="admin-section-head">
          <h3 className="admin-section-title">Athletes ({profiles.length})</h3>
          <button className="btn-add" onClick={onNewProfile}>+ Add</button>
        </div>
        <div className="admin-list">
          {profiles.map(p => (
            <div key={p.id} className="admin-row">
              <div className="admin-row-avatar">{p.name[0]}</div>
              <div className="admin-row-main">
                <p className="admin-row-name">{p.name}</p>
                <p className="admin-row-meta">
                  {p.handedness === 'right' ? 'Right' : 'Left'}-handed · Shot L{p.shotReactionLevel} · Cone L{p.coneLevel}
                </p>
              </div>
              <div className="admin-row-actions">
                <button className="btn-icon" onClick={() => onEditProfile(p)} aria-label="Edit">✎</button>
                <button className="btn-icon btn-icon-danger" onClick={() => askDeleteProfile(p)} aria-label="Delete">🗑</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Drills */}
      <section className="admin-section">
        <div className="admin-section-head">
          <h3 className="admin-section-title">Drills ({drills.length})</h3>
          <button className="btn-add" onClick={onNewDrill}>+ Add</button>
        </div>
        <div className="admin-list">
          {drills.map(d => (
            <div key={d.id} className="admin-row">
              <div className="admin-row-main">
                <p className="admin-row-name">{d.name}</p>
                <p className="admin-row-meta">
                  {TYPE_LABELS[d.type]} · {d.reps.length} reps · {d.intervalSeconds}s
                </p>
              </div>
              <div className="admin-row-actions">
                <button className="btn-icon" onClick={() => onEditDrill(d)} aria-label="Edit">✎</button>
                <button className="btn-icon btn-icon-danger" onClick={() => askDeleteDrill(d)} aria-label="Delete">🗑</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Display */}
      <section className="admin-section">
        <h3 className="admin-section-title">Goal Diagram Perspective</h3>
        <div className="seg-control">
          <button className={`seg-btn ${perspective === 'goalie' ? 'seg-active' : ''}`}
            onClick={() => changePerspective('goalie')}>Goalie&rsquo;s view</button>
          <button className={`seg-btn ${perspective === 'shooter' ? 'seg-active' : ''}`}
            onClick={() => changePerspective('shooter')}>Shooter&rsquo;s view</button>
        </div>
        <p className="admin-section-hint">
          {perspective === 'goalie'
            ? 'Egocentric — stick side appears on the goalie’s own side. Best for reaction reps.'
            : 'Traditional coaching view, looking at the goal from the field.'}
        </p>
      </section>

      {/* Data */}
      <section className="admin-section">
        <h3 className="admin-section-title">Data</h3>
        <button className="btn-secondary-full" onClick={exportAll}>
          ⬇ Export all sessions (CSV) · {sessions.length}
        </button>

        {/* Import sessions to a specific goalie */}
        <div className="import-box">
          <p className="import-label">Import sessions to a goalie</p>
          <div className="import-row">
            <select className="import-select" value={importGoalieId}
              onChange={e => { setImportGoalieId(e.target.value); setImportMsg(null); }}>
              {profiles.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <button className="btn-import" onClick={() => fileRef.current?.click()}>⬆ Choose CSV</button>
          </div>
          <input ref={fileRef} type="file" accept=".csv,text/csv" hidden onChange={handleImportFile} />
          <p className="import-hint">Accepts a sessions CSV (same format as export). Rows are assigned to the selected goalie.</p>
          {importMsg && (
            <p className={`import-result ${importMsg.ok ? 'import-ok' : 'import-err'}`}>{importMsg.text}</p>
          )}
        </div>
      </section>

      {confirmState && (
        <ConfirmModal
          title={confirmState.title}
          message={confirmState.message}
          confirmLabel={confirmState.confirmLabel}
          danger={confirmState.danger}
          onConfirm={confirmState.onConfirm}
          onCancel={() => setConfirmState(null)}
        />
      )}
    </div>
  );
}
