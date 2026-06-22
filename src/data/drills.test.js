import { describe, it, expect, beforeEach } from 'vitest';
import {
  generateCueText, getIntervalSeconds, getLevel, stickRendersLeft,
  ZONE_NAMES, ZONE_POSITIONS, CONE_COLORS, LEVEL_LABELS, DRILLS,
} from './drills';
import { setStoredLevel } from './sessions';

const shotDrill     = DRILLS.find(d => d.type === 'shot-reaction');
const coneDrill     = DRILLS.find(d => d.type === 'cone');
const combinedDrill = DRILLS.find(d => d.type === 'combined');

beforeEach(() => localStorage.clear());

describe('generateCueText — shot reaction', () => {
  const rep = { zone: 'High Stick-Side', shotType: 'Direct' };

  it('level 1 includes zone, shot type, and technique', () => {
    const cue = generateCueText(rep, shotDrill, 1);
    expect(cue).toContain('High Stick-Side');
    expect(cue).toContain('Direct');
    expect(cue).toContain('Step stick side'); // technique
  });

  it('level 2 includes zone and shot type, no technique', () => {
    const cue = generateCueText(rep, shotDrill, 2);
    expect(cue).toBe('High Stick-Side. Direct.');
  });

  it('level 3 is zone only', () => {
    expect(generateCueText(rep, shotDrill, 3)).toBe('High Stick-Side');
  });

  it('level 4 is null (tone only)', () => {
    expect(generateCueText(rep, shotDrill, 4)).toBeNull();
  });
});

describe('generateCueText — cone', () => {
  const rep = { cone: 'Red' };

  it('level 1 gives full step-and-shuffle cue with goal side', () => {
    const cue = generateCueText(rep, coneDrill, 1);
    expect(cue).toContain('Red');
    expect(cue).toContain('shuffle');
  });

  it('level 3 is color only', () => {
    expect(generateCueText(rep, coneDrill, 3)).toBe('Red');
  });
});

describe('generateCueText — combined', () => {
  const rep = { cone: 'Red', zone: 'Low Stick-Side', shotType: 'Bounce shot' };

  it('level 3 gives cone + zone', () => {
    expect(generateCueText(rep, combinedDrill, 3)).toBe('Red. Low Stick-Side.');
  });

  it('level 4 is null', () => {
    expect(generateCueText(rep, combinedDrill, 4)).toBeNull();
  });
});

describe('getIntervalSeconds — level scaling', () => {
  const drill = { intervalSeconds: 8 };
  it('scales the base interval down as level rises', () => {
    expect(getIntervalSeconds(drill, 1)).toBe(8);   // ×1.0
    expect(getIntervalSeconds(drill, 2)).toBe(6);   // ×0.75
    expect(getIntervalSeconds(drill, 3)).toBe(5);   // ×0.625
    expect(getIntervalSeconds(drill, 4)).toBe(4);   // ×0.5
  });
});

describe('getLevel', () => {
  const profile = { id: 'p1', shotReactionLevel: 2, coneLevel: 1 };

  it('falls back to the profile level when nothing is stored', () => {
    expect(getLevel(profile, shotDrill)).toBe(2);
    expect(getLevel(profile, coneDrill)).toBe(1);
  });

  it('prefers a stored level override', () => {
    setStoredLevel('p1', 'shot-reaction', 4);
    expect(getLevel(profile, shotDrill)).toBe(4);
    expect(getLevel(profile, coneDrill)).toBe(1); // cone unaffected
  });
});

describe('stickRendersLeft — perspective × handedness', () => {
  it('goalie view: right-handed stick on the right, left-handed on the left', () => {
    expect(stickRendersLeft('right', 'goalie')).toBe(false); // right -> right side
    expect(stickRendersLeft('left', 'goalie')).toBe(true);   // left  -> left side
  });

  it('shooter view mirrors the goalie view', () => {
    expect(stickRendersLeft('right', 'shooter')).toBe(true);
    expect(stickRendersLeft('left', 'shooter')).toBe(false);
  });
});

describe('data integrity', () => {
  it('every zone name has a logical grid position', () => {
    for (const name of ZONE_NAMES) {
      expect(ZONE_POSITIONS[name]).toMatchObject({
        row: expect.any(Number),
        col: expect.any(Number),
      });
    }
  });

  it('5-Hole is lower center', () => {
    expect(ZONE_POSITIONS['5-Hole']).toEqual({ row: 2, col: 1 });
  });

  it('exposes level labels and cone colors', () => {
    expect(LEVEL_LABELS[1]).toBe('Beginner');
    expect(CONE_COLORS).toContain('Red');
  });
});
