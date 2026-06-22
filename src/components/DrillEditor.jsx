import { useState } from 'react';
import { addDrill, updateDrill } from '../data/store';
import { ZONE_NAMES, SHOT_TYPES, CONE_COLORS, SHOOTER_POSITIONS, CONE_COLOR_MAP } from '../data/drills';

const TYPES = [
  { id: 'shot-reaction', label: 'Shot Reaction', levelType: 'shot-reaction' },
  { id: 'cone',          label: 'Cone Drill',    levelType: 'cone' },
  { id: 'combined',      label: 'Combined',      levelType: 'shot-reaction' },
  { id: 'pass',          label: 'Pass + Shot',   levelType: 'shot-reaction' },
];

function blankRep(type, cones) {
  if (type === 'cone')     return { cone: cones[0]?.color ?? 'Red' };
  if (type === 'combined') return { cone: cones[0]?.color ?? 'Red', zone: ZONE_NAMES[0], shotType: SHOT_TYPES[0] };
  if (type === 'pass')     return {
    coneFrom: cones[0]?.color ?? 'Red',
    coneTo:   cones[1]?.color ?? cones[0]?.color ?? 'Blue',
    zone: ZONE_NAMES[0], shotType: SHOT_TYPES[0],
  };
  return { zone: ZONE_NAMES[0], shotType: SHOT_TYPES[0] };
}

export default function DrillEditor({ drill, onDone }) {
  const editing = !!drill;
  const [name,        setName]        = useState(drill?.name ?? '');
  const [type,        setType]        = useState(drill?.type ?? 'shot-reaction');
  const [description, setDescription] = useState(drill?.description ?? '');
  const [interval,    setInterval]    = useState(drill?.intervalSeconds ?? 8);
  const [cones,       setCones]       = useState(drill?.cones ?? []);
  const [reps,        setReps]        = useState(drill?.reps ?? [blankRep('shot-reaction', [])]);

  const usesCones = type === 'cone' || type === 'combined' || type === 'pass';
  // Pass drills simulate a feed across the crease, so they need at least two cones.
  const minCones = type === 'pass' ? 2 : 1;
  const valid = name.trim().length > 0 && reps.length > 0 && (!usesCones || cones.length >= minCones);

  function changeType(newType) {
    setType(newType);
    // Reset reps to a valid shape for the new type
    const usesConesNext = newType === 'cone' || newType === 'combined' || newType === 'pass';
    let startCones = usesConesNext
      ? (cones.length ? cones : [{ color: 'Red', shotFrom: 'Left Pipe', position: 0 }])
      : cones;
    // Pass drills need a second cone to feed to.
    if (newType === 'pass' && startCones.length < 2) {
      startCones = [...startCones, { color: 'Blue', shotFrom: 'Right Pipe', position: 4 }];
    }
    setCones(startCones);
    setReps([blankRep(newType, startCones)]);
  }

  // ── Cone editing ──
  function addCone() {
    const usedColors = cones.map(c => c.color);
    const nextColor  = CONE_COLORS.find(c => !usedColors.includes(c)) ?? CONE_COLORS[0];
    const usedSpots  = cones.map(c => c.shotFrom);
    const nextSpot   = SHOOTER_POSITIONS.find(s => !usedSpots.includes(s)) ?? SHOOTER_POSITIONS[0];
    setCones([...cones, { color: nextColor, shotFrom: nextSpot, position: SHOOTER_POSITIONS.indexOf(nextSpot) }]);
  }
  function updateCone(i, patch) {
    setCones(cones.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));
  }
  // Renaming a cone's color must re-point any reps that reference the old color,
  // otherwise the rep dropdowns blank out and cues speak a color that's gone.
  function changeColor(i, newColor) {
    const old = cones[i]?.color;
    updateCone(i, { color: newColor });
    if (old && old !== newColor) {
      setReps(reps.map(r => ({
        ...r,
        ...(r.cone === old     ? { cone: newColor } : {}),
        ...(r.coneFrom === old ? { coneFrom: newColor } : {}),
        ...(r.coneTo === old   ? { coneTo: newColor } : {}),
      })));
    }
  }
  // Keep the field slot (position) in sync with the chosen shooter position.
  function changeShotFrom(i, spot) {
    updateCone(i, { shotFrom: spot, position: SHOOTER_POSITIONS.indexOf(spot) });
  }
  function removeCone(i) {
    const next = cones.filter((_, idx) => idx !== i);
    setCones(next);
    // Drop reps referencing the removed cone
    const removed = cones[i]?.color;
    const fallback = next[0]?.color;
    setReps(reps.map(r => ({
      ...r,
      ...(r.cone === removed     ? { cone: fallback } : {}),
      ...(r.coneFrom === removed ? { coneFrom: fallback } : {}),
      ...(r.coneTo === removed   ? { coneTo: next[1]?.color ?? fallback } : {}),
    })));
  }

  // ── Rep editing ──
  function addRep() { setReps([...reps, blankRep(type, cones)]); }
  function updateRep(i, patch) { setReps(reps.map((r, idx) => (idx === i ? { ...r, ...patch } : r))); }
  function removeRep(i) { setReps(reps.filter((_, idx) => idx !== i)); }
  function moveRep(i, dir) {
    const j = i + dir;
    if (j < 0 || j >= reps.length) return;
    const next = [...reps];
    [next[i], next[j]] = [next[j], next[i]];
    setReps(next);
  }

  function save() {
    if (!valid) return;
    const levelType = TYPES.find(t => t.id === type).levelType;
    const data = {
      name: name.trim(),
      type,
      levelType,
      description: description.trim(),
      intervalSeconds: Number(interval) || 8,
      cones: usesCones ? cones : [],
      reps,
    };
    if (editing) updateDrill(drill.id, data);
    else addDrill(data);
    onDone();
  }

  const coneColors = cones.map(c => c.color);

  return (
    <div className="screen editor-screen">
      <div className="editor-header">
        <button className="btn-back" onClick={onDone}>← Cancel</button>
        <h2 className="editor-title">{editing ? 'Edit Drill' : 'New Drill'}</h2>
        <button className="btn-save" disabled={!valid} onClick={save}>Save</button>
      </div>

      <div className="editor-body">
        <label className="field">
          <span className="field-label">Name</span>
          <input className="field-input" value={name} autoFocus
            onChange={e => setName(e.target.value)} placeholder="Drill name" />
        </label>

        <div className="field">
          <span className="field-label">Type</span>
          <div className="seg-control">
            {TYPES.map(t => (
              <button key={t.id} className={`seg-btn ${type === t.id ? 'seg-active' : ''}`}
                onClick={() => changeType(t.id)}>{t.label}</button>
            ))}
          </div>
        </div>

        <label className="field">
          <span className="field-label">Description</span>
          <textarea className="field-input field-textarea" value={description}
            onChange={e => setDescription(e.target.value)} rows={2}
            placeholder="What this drill builds…" />
        </label>

        <div className="field">
          <span className="field-label">Base Interval (Level 1)</span>
          <div className="interval-row">
            <button className="interval-btn" onClick={() => setInterval(s => Math.max(2, s - 1))}>−</button>
            <span className="interval-value">{interval}s</span>
            <button className="interval-btn" onClick={() => setInterval(s => Math.min(30, s + 1))}>+</button>
          </div>
        </div>

        {/* Cones */}
        {usesCones && (
          <div className="field">
            <div className="editor-subhead">
              <span className="field-label">Cones ({cones.length})</span>
              <button className="btn-add-sm" onClick={addCone} disabled={cones.length >= CONE_COLORS.length}>+ Cone</button>
            </div>
            <div className="editor-rows">
              {cones.map((c, i) => (
                <div key={i} className="editor-rep">
                  <span className="cone-swatch" style={{ background: CONE_COLOR_MAP[c.color] }} />
                  <select className="rep-select" value={c.color}
                    onChange={e => changeColor(i, e.target.value)}>
                    {CONE_COLORS.map(col => <option key={col} value={col}>{col}</option>)}
                  </select>
                  <select className="rep-select" value={c.shotFrom}
                    onChange={e => changeShotFrom(i, e.target.value)}>
                    {SHOOTER_POSITIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <button className="btn-icon btn-icon-danger" onClick={() => removeCone(i)}>✕</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reps */}
        <div className="field">
          <div className="editor-subhead">
            <span className="field-label">Reps ({reps.length})</span>
            <button className="btn-add-sm" onClick={addRep}>+ Rep</button>
          </div>
          <div className="editor-rows">
            {reps.map((r, i) => (
              <div key={i} className="editor-rep">
                <span className="rep-num">{i + 1}</span>

                {(type === 'cone' || type === 'combined') && (
                  <select className="rep-select" value={r.cone}
                    onChange={e => updateRep(i, { cone: e.target.value })}>
                    {coneColors.map(col => <option key={col} value={col}>{col}</option>)}
                  </select>
                )}

                {type === 'pass' && (
                  <>
                    <select className="rep-select" value={r.coneFrom}
                      onChange={e => updateRep(i, { coneFrom: e.target.value })}>
                      {coneColors.map(col => <option key={col} value={col}>{col}</option>)}
                    </select>
                    <span className="rep-arrow">→</span>
                    <select className="rep-select" value={r.coneTo}
                      onChange={e => updateRep(i, { coneTo: e.target.value })}>
                      {coneColors.map(col => <option key={col} value={col}>{col}</option>)}
                    </select>
                  </>
                )}

                {(type === 'shot-reaction' || type === 'combined' || type === 'pass') && (
                  <>
                    <select className="rep-select" value={r.zone}
                      onChange={e => updateRep(i, { zone: e.target.value })}>
                      {ZONE_NAMES.map(z => <option key={z} value={z}>{z}</option>)}
                    </select>
                    <select className="rep-select" value={r.shotType}
                      onChange={e => updateRep(i, { shotType: e.target.value })}>
                      {SHOT_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </>
                )}

                <div className="rep-row-actions">
                  <button className="btn-icon" onClick={() => moveRep(i, -1)} disabled={i === 0}>↑</button>
                  <button className="btn-icon" onClick={() => moveRep(i, 1)} disabled={i === reps.length - 1}>↓</button>
                  <button className="btn-icon btn-icon-danger" onClick={() => removeRep(i)} disabled={reps.length === 1}>✕</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
