import { describe, it, expect, beforeEach } from 'vitest';
import {
  generateCueText, passCueStages, getIntervalSeconds, getLevel, stickRendersLeft, randomizeRep,
  ZONE_NAMES, ZONE_POSITIONS, CONE_COLORS, SHOT_TYPES, LEVEL_LABELS, DRILLS,
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
    expect(cue.toLowerCase()).toContain('step stick side'); // technique
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
  const rep = { cone: 'Red' }; // Red maps to the Left Pipe shooting position

  it('level 1 names the color, shooter position, and footwork', () => {
    const cue = generateCueText(rep, coneDrill, 1);
    expect(cue).toContain('Red');
    expect(cue).toContain('Left Pipe');
    expect(cue.toLowerCase()).toContain('shuffle');
  });

  it('level 2 is color + shooter position', () => {
    expect(generateCueText(rep, coneDrill, 2)).toBe('Red. Left Pipe.');
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

describe('drill-aware off-stick footwork', () => {
  const zone = 'High Off-Stick';

  it('perimeter shot-reaction uses a wide save step', () => {
    const cue = generateCueText({ zone, shotType: 'Direct' }, shotDrill, 1);
    expect(cue).toContain('wide step');
    expect(cue).not.toContain('drop step');
  });

  it('combined (post-feed) uses a drop step to re-square', () => {
    const cue = generateCueText({ cone: 'Red', zone, shotType: 'Direct' }, combinedDrill, 1);
    expect(cue).toContain('drop step');
  });

  it('pass (post-feed) uses a drop step to re-square', () => {
    const passDrill = { type: 'pass', cones: [{ color: 'Red' }, { color: 'Blue' }] };
    const cue = generateCueText({ coneFrom: 'Red', coneTo: 'Blue', zone, shotType: 'Direct' }, passDrill, 1);
    expect(cue).toContain('drop step');
  });
});

describe('generateCueText — pass + shot', () => {
  const passDrill = {
    type: 'pass',
    cones: [
      { color: 'Red',  shotFrom: 'Left 45',  position: 1 },
      { color: 'Blue', shotFrom: 'Right 45', position: 3 },
    ],
  };
  const rep = { coneFrom: 'Red', coneTo: 'Blue', zone: 'High Off-Stick', shotType: 'Direct' };

  it('level 1 narrates the feed, the shot, and a technique', () => {
    const cue = generateCueText(rep, passDrill, 1);
    expect(cue).toContain('Red to Blue');
    expect(cue).toContain('High Off-Stick');
    expect(cue).toContain('Direct');
  });

  it('level 2 keeps the feed and shot but drops the technique', () => {
    expect(generateCueText(rep, passDrill, 2)).toBe('Red to Blue. High Off-Stick. Direct.');
  });

  it('level 3 is the receiving cone + zone', () => {
    expect(generateCueText(rep, passDrill, 3)).toBe('Blue. High Off-Stick.');
  });

  it('level 4 is null (tone only)', () => {
    expect(generateCueText(rep, passDrill, 4)).toBeNull();
  });
});

describe('passCueStages — two-stage feed', () => {
  const rep = { coneFrom: 'Red', coneTo: 'Blue', zone: 'High Off-Stick', shotType: 'Direct' };

  it('stage 1 announces only the origin cone (with a set cue at level 1)', () => {
    expect(passCueStages(rep, 1).first).toBe('Red cone. Set.');
    expect(passCueStages(rep, 2).first).toBe('Red');
    // stage 1 never leaks the destination or shot
    expect(passCueStages(rep, 1).first).not.toContain('Blue');
  });

  it('stage 2 announces the receiving cone + shot, scaling by level', () => {
    expect(passCueStages(rep, 2).second).toBe('Blue. High Off-Stick. Direct.');
    expect(passCueStages(rep, 3).second).toBe('Blue. High Off-Stick.');
    expect(passCueStages(rep, 1).second).toContain('drop step'); // feed footwork
  });

  it('level 4 stage 2 is null (tone only)', () => {
    expect(passCueStages(rep, 4).second).toBeNull();
  });
});

describe('randomizeRep', () => {
  const drill = { cones: [{ color: 'Red' }, { color: 'Blue' }, { color: 'Green' }] };

  it('only changes requested fields and keeps the rep shape', () => {
    const rep = { cone: 'Red', zone: 'High Center', shotType: 'Direct' };
    const out = randomizeRep(rep, drill, { cone: false, zone: true, shotType: false });
    expect(out.cone).toBe('Red');          // untouched
    expect(out.shotType).toBe('Direct');   // untouched
    expect(ZONE_NAMES).toContain(out.zone);
  });

  it('picks valid cones and a distinct feed target for pass reps', () => {
    const rep = { coneFrom: 'Red', coneTo: 'Blue', zone: 'High Center', shotType: 'Direct' };
    for (let i = 0; i < 25; i++) {
      const out = randomizeRep(rep, drill, { cone: true, zone: false, shotType: false });
      expect(['Red', 'Blue', 'Green']).toContain(out.coneFrom);
      expect(['Red', 'Blue', 'Green']).toContain(out.coneTo);
      expect(out.coneFrom).not.toBe(out.coneTo);
    }
  });

  it('randomizes shot type from the valid list', () => {
    const rep = { zone: 'High Center', shotType: 'Direct' };
    const out = randomizeRep(rep, drill, { cone: false, zone: false, shotType: true });
    expect(SHOT_TYPES).toContain(out.shotType);
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
