import { describe, it, expect, beforeEach } from 'vitest';
import {
  saveSession, loadSessions, getSessionsAtLevel,
  getStoredLevel, setStoredLevel,
  countSessionsForProfile, deleteSessionsForProfile,
  addSessions, addSessionsDeduped,
  sessionsToCsv, parseSessionsCsv,
} from './sessions';

beforeEach(() => localStorage.clear());

function rec(over = {}) {
  return {
    profileId: 'p1', profileName: 'Alex',
    drillId: 'shot-1', drillName: '4-Corner Reaction',
    levelType: 'shot-reaction', level: 1,
    made: 6, missed: 2, totalReps: 8,
    date: 1000, ...over,
  };
}

describe('save / load sessions', () => {
  it('persists sessions and stamps a date when missing', () => {
    saveSession({ profileId: 'p1', drillName: 'X', level: 1, levelType: 'shot-reaction' });
    const all = loadSessions();
    expect(all).toHaveLength(1);
    expect(typeof all[0].date).toBe('number');
  });

  it('loadSessions returns [] when storage is empty or corrupt', () => {
    expect(loadSessions()).toEqual([]);
    localStorage.setItem('sgt-sessions', 'not json');
    expect(loadSessions()).toEqual([]);
  });
});

describe('getSessionsAtLevel', () => {
  it('filters by profile, level type, and level', () => {
    addSessions([
      rec(), rec(),
      rec({ level: 2 }),
      rec({ profileId: 'p2' }),
      rec({ levelType: 'cone' }),
    ]);
    expect(getSessionsAtLevel('p1', 'shot-reaction', 1)).toHaveLength(2);
    expect(getSessionsAtLevel('p1', 'shot-reaction', 2)).toHaveLength(1);
    expect(getSessionsAtLevel('p2', 'shot-reaction', 1)).toHaveLength(1);
  });
});

describe('stored level overrides', () => {
  it('returns null until set, then the stored value', () => {
    expect(getStoredLevel('p1', 'shot-reaction')).toBeNull();
    setStoredLevel('p1', 'shot-reaction', 3);
    expect(getStoredLevel('p1', 'shot-reaction')).toBe(3);
    expect(getStoredLevel('p1', 'cone')).toBeNull(); // independent key
  });
});

describe('cascade delete by profile', () => {
  it('counts and removes only the target profile’s sessions', () => {
    addSessions([rec(), rec(), rec({ profileId: 'p2' })]);
    expect(countSessionsForProfile('p1')).toBe(2);
    deleteSessionsForProfile('p1');
    expect(countSessionsForProfile('p1')).toBe(0);
    expect(countSessionsForProfile('p2')).toBe(1);
  });
});

describe('sessionsToCsv', () => {
  it('emits a header and one row per session with computed save %', () => {
    const csv = sessionsToCsv([rec({ made: 6, missed: 2, totalReps: 8 })]);
    const lines = csv.split('\n');
    expect(lines[0]).toBe('Date,Time,Profile,Drill,Level,Reps,Made,Missed,Save %');
    expect(lines).toHaveLength(2);
    expect(lines[1]).toContain('Alex');
    expect(lines[1].endsWith('75')).toBe(true); // 6/8
  });

  it('quotes cells containing commas', () => {
    const csv = sessionsToCsv([rec({ drillName: 'Corner, Attack' })]);
    expect(csv).toContain('"Corner, Attack"');
  });
});

describe('parseSessionsCsv', () => {
  it('skips the header and parses rows', () => {
    const csv = [
      'Date,Time,Profile,Drill,Level,Reps,Made,Missed,Save %',
      '6/10/2026,5:30 PM,Ignored,4-Corner Reaction,1,12,9,3,75',
    ].join('\n');
    const rows = parseSessionsCsv(csv);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      drillName: '4-Corner Reaction', level: 1, totalReps: 12, made: 9, missed: 3, imported: true,
    });
    expect(Number.isNaN(rows[0].date)).toBe(false);
  });

  it('handles quoted drill names and missing tally cells', () => {
    const csv = [
      'Date,Time,Profile,Drill,Level,Reps,Made,Missed,Save %',
      '6/10/2026,5:30 PM,X,"Corner, Attack",2,8,,,',
    ].join('\n');
    const [row] = parseSessionsCsv(csv);
    expect(row.drillName).toBe('Corner, Attack');
    expect(row.made).toBeUndefined();
    expect(row.missed).toBeUndefined();
  });

  it('returns [] for empty input', () => {
    expect(parseSessionsCsv('')).toEqual([]);
  });

  it('round-trips with sessionsToCsv', () => {
    const csv = sessionsToCsv([rec()]);
    const rows = parseSessionsCsv(csv);
    expect(rows[0]).toMatchObject({ drillName: '4-Corner Reaction', level: 1, totalReps: 8, made: 6, missed: 2 });
  });
});

describe('addSessionsDeduped', () => {
  it('adds all when nothing matches', () => {
    const res = addSessionsDeduped([rec({ date: 1 }), rec({ date: 2 })]);
    expect(res).toEqual({ added: 2, skipped: 0 });
    expect(loadSessions()).toHaveLength(2);
  });

  it('skips rows duplicating existing sessions', () => {
    addSessions([rec({ date: 1 })]);
    const res = addSessionsDeduped([rec({ date: 1 }), rec({ date: 2 })]);
    expect(res).toEqual({ added: 1, skipped: 1 });
    expect(loadSessions()).toHaveLength(2);
  });

  it('skips duplicates within the same batch', () => {
    const res = addSessionsDeduped([rec({ date: 5 }), rec({ date: 5 })]);
    expect(res).toEqual({ added: 1, skipped: 1 });
  });

  it('treats a different tally as a distinct session', () => {
    addSessions([rec({ date: 9, made: 6 })]);
    const res = addSessionsDeduped([rec({ date: 9, made: 7 })]);
    expect(res).toEqual({ added: 1, skipped: 0 });
  });
});
