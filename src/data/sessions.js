const SESSIONS_KEY = 'sgt-sessions';
const LEVELS_KEY   = 'sgt-levels';

// ── Session history ──

export function loadSessions() {
  try { return JSON.parse(localStorage.getItem(SESSIONS_KEY) ?? '[]'); }
  catch { return []; }
}

export function saveSession(record) {
  const sessions = loadSessions();
  sessions.push({ ...record, date: Date.now() });
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
}

export function addSessions(records) {
  const sessions = loadSessions();
  sessions.push(...records);
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
  return records.length;
}

// Identifies a session for duplicate detection (same goalie, time, drill, and tally).
function sessionKey(s) {
  return [s.profileId, s.date, s.drillName, s.level, s.totalReps, s.made ?? '', s.missed ?? ''].join('|');
}

// Appends records, skipping any that duplicate an existing session or each other.
export function addSessionsDeduped(records) {
  const sessions = loadSessions();
  const seen = new Set(sessions.map(sessionKey));
  const fresh = [];
  for (const r of records) {
    const k = sessionKey(r);
    if (seen.has(k)) continue;
    seen.add(k);
    fresh.push(r);
  }
  if (fresh.length) {
    sessions.push(...fresh);
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
  }
  return { added: fresh.length, skipped: records.length - fresh.length };
}

export function countSessionsForProfile(profileId) {
  return loadSessions().filter(s => s.profileId === profileId).length;
}

export function deleteSessionsForProfile(profileId) {
  const remaining = loadSessions().filter(s => s.profileId !== profileId);
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(remaining));
}

export function getSessionsAtLevel(profileId, levelType, level) {
  return loadSessions().filter(s =>
    s.profileId  === profileId &&
    s.levelType  === levelType &&
    s.level      === level
  );
}

// ── Level overrides (stored when coach approves or goalie self-promotes in prototype) ──

function loadLevels() {
  try { return JSON.parse(localStorage.getItem(LEVELS_KEY) ?? '{}'); }
  catch { return {}; }
}

function saveLevels(levels) {
  localStorage.setItem(LEVELS_KEY, JSON.stringify(levels));
}

export function getStoredLevel(profileId, levelType) {
  const levels = loadLevels();
  return levels[`${profileId}-${levelType}`] ?? null;
}

export function setStoredLevel(profileId, levelType, level) {
  const levels = loadLevels();
  levels[`${profileId}-${levelType}`] = level;
  saveLevels(levels);
}

// ── CSV export ──

function csvCell(value) {
  const s = String(value ?? '');
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function sessionsToCsv(sessions) {
  const headers = ['Date', 'Time', 'Profile', 'Drill', 'Level', 'Reps', 'Made', 'Missed', 'Save %'];
  const rows = sessions.map(s => {
    const d = new Date(s.date);
    const made = s.made ?? '';
    const missed = s.missed ?? '';
    const pct = (s.made != null && (s.made + s.missed) > 0)
      ? Math.round((s.made / (s.made + s.missed)) * 100)
      : '';
    return [
      d.toLocaleDateString('en-US'),
      d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      s.profileName ?? s.profileId ?? '',
      s.drillName ?? '',
      s.level ?? '',
      s.totalReps ?? '',
      made, missed, pct,
    ].map(csvCell).join(',');
  });
  return [headers.join(','), ...rows].join('\n');
}

function parseCsvLine(line) {
  const cells = [];
  let cur = '', inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQ) {
      if (ch === '"') {
        if (line[i + 1] === '"') { cur += '"'; i++; }
        else inQ = false;
      } else cur += ch;
    } else if (ch === '"') inQ = true;
    else if (ch === ',') { cells.push(cur); cur = ''; }
    else cur += ch;
  }
  cells.push(cur);
  return cells;
}

// Parses CSV in the same shape as sessionsToCsv (Date,Time,Profile,Drill,Level,Reps,Made,Missed,Save %).
// Returns partial session records WITHOUT profile fields — the caller assigns the target goalie.
export function parseSessionsCsv(text) {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (!lines.length) return [];
  const start = /^date\s*,/i.test(lines[0]) ? 1 : 0;
  const records = [];
  for (let i = start; i < lines.length; i++) {
    const c = parseCsvLine(lines[i]);
    if (c.length < 4) continue;
    const [date, time, , drill, level, reps, made, missed] = c;
    const ts = Date.parse(`${(date || '').trim()} ${(time || '').trim()}`.trim());
    const rec = {
      drillName: (drill || '').trim() || 'Imported drill',
      level:     parseInt(level) || 1,
      totalReps: parseInt(reps) || 0,
      date:      Number.isNaN(ts) ? Date.now() : ts,
      imported:  true,
    };
    if (made   !== undefined && made   !== '') rec.made   = parseInt(made)   || 0;
    if (missed !== undefined && missed !== '') rec.missed = parseInt(missed) || 0;
    records.push(rec);
  }
  return records;
}

export function downloadCsv(filename, csv) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
