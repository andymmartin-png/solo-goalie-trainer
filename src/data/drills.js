import { getStoredLevel } from './sessions.js';

export const CONE_COLOR_MAP = {
  Red:    '#ef4444',
  Blue:   '#3b82f6',
  Green:  '#22c55e',
  Yellow: '#eab308',
  Orange: '#f97316',
  Purple: '#a855f7',
  White:  '#e2e8f0',
  Black:  '#374151',
};

// Grid positions for right-handed (col 0 = stick side = goalie's right = viewer's left)
const ZONE_GRID = {
  'High Stick-Side': { row: 0, col: 0 },
  'High Center':     { row: 0, col: 1 },
  'High Off-Stick':  { row: 0, col: 2 },
  'Mid Stick-Side':  { row: 1, col: 0 },
  'Mid Off-Stick':   { row: 1, col: 2 },
  'Low Stick-Side':  { row: 2, col: 0 },
  '5-Hole':          { row: 2, col: 1 },
  'Low Off-Stick':   { row: 2, col: 2 },
};

// Raw logical zone positions (col 0 = stick side, col 1 = center, col 2 = off-stick)
export const ZONE_POSITIONS = ZONE_GRID;

// Whether the stick side renders on the LEFT screen edge.
//   goalie view (egocentric): right-handed stick on the right, left-handed on the left
//   shooter view (from field): mirrored relative to the goalie
export function stickRendersLeft(handedness, perspective) {
  if (perspective === 'shooter') return handedness === 'right';
  return handedness === 'left';
}

// Editable option lists for the drill builder
export const ZONE_NAMES = Object.keys(ZONE_GRID);
export const SHOT_TYPES = ['Direct', 'Bounce shot', 'Sidearm', 'Skip shot', 'Overhand'];
export const CONE_COLORS = Object.keys(CONE_COLOR_MAP);
export const GOAL_SIDES = [
  'Stick-Side Low', 'Stick-Side High', 'Stick-Side', 'Center',
  'Off-Stick High', 'Off-Stick Low', 'Off-Stick',
];

export function getZoneGrid(zoneName, handedness) {
  const pos = ZONE_GRID[zoneName];
  if (!pos) return null;
  if (handedness === 'left') {
    return { row: pos.row, col: pos.col === 0 ? 2 : pos.col === 2 ? 0 : 1 };
  }
  return pos;
}

const TECHNIQUES = {
  'High Stick-Side': 'Step stick side, stick head up',
  'High Center':     'Set feet, stick head up',
  'High Off-Stick':  'Drop step, stick head up',
  'Mid Stick-Side':  'Step stick side, hands in',
  '5-Hole':          'Stick head down, squeeze',
  'Mid Off-Stick':   'Drop step and reach',
  'Low Stick-Side':  'Step stick side, stick head down',
  'Low Off-Stick':   'Drop step, stick head down',
};

function shotCue(zone, shotType, level) {
  if (level === 4) return null;
  if (level === 3) return zone;
  if (level === 2) return `${zone}. ${shotType}.`;
  return `${zone}. ${shotType}. ${TECHNIQUES[zone]}.`;
}

function coneCue(color, cone, level) {
  if (level === 3) return color;
  if (level === 2) return `${color}. ${cone.goalSide}.`;
  return `${color} cone. Step and shuffle. ${cone.goalSide} save.`;
}

export function generateCueText(rep, drill, level) {
  if (drill.type === 'shot-reaction') {
    return shotCue(rep.zone, rep.shotType, level);
  }
  if (drill.type === 'cone') {
    const cone = drill.cones.find(c => c.color === rep.cone);
    return coneCue(rep.cone, cone, level);
  }
  if (drill.type === 'combined') {
    if (level === 4) return null;
    if (level === 3) return `${rep.cone}. ${rep.zone}.`;
    if (level === 2) return `${rep.cone} cone. ${rep.zone}. ${rep.shotType}.`;
    return `${rep.cone} cone. ${rep.zone}. ${rep.shotType}. ${TECHNIQUES[rep.zone]}.`;
  }
  return '';
}

export function getLevel(profile, drill) {
  const stored = getStoredLevel(profile.id, drill.levelType);
  if (stored !== null) return stored;
  return drill.levelType === 'cone' ? profile.coneLevel : profile.shotReactionLevel;
}

// intervalSeconds is the base (Level 1) duration.
// Higher levels have shorter cues so the interval compresses.
const LEVEL_INTERVAL_SCALE = { 1: 1.0, 2: 0.75, 3: 0.625, 4: 0.5 };

export function getIntervalSeconds(drill, level) {
  return Math.round(drill.intervalSeconds * (LEVEL_INTERVAL_SCALE[level] ?? 1.0));
}

export const LEVEL_LABELS = {
  1: 'Beginner',
  2: 'Intermediate',
  3: 'Advanced',
  4: 'Game Speed',
};

export const PROFILES = [
  { id: 'p1', name: 'Alex',   handedness: 'right', shotReactionLevel: 1, coneLevel: 1 },
  { id: 'p2', name: 'Jordan', handedness: 'right', shotReactionLevel: 2, coneLevel: 1 },
  { id: 'p3', name: 'Morgan', handedness: 'left',  shotReactionLevel: 3, coneLevel: 2 },
  { id: 'p4', name: 'Riley',  handedness: 'right', shotReactionLevel: 4, coneLevel: 3 },
];

export const DRILLS = [
  {
    id: 'shot-1',
    name: '4-Corner Reaction',
    type: 'shot-reaction',
    levelType: 'shot-reaction',
    description: 'Cycles through all four corner zones and common mid-saves. Builds basic shot-reaction across the full goal.',
    intervalSeconds: 8,
    reps: [
      { zone: 'High Stick-Side', shotType: 'Direct' },
      { zone: 'Low Off-Stick',   shotType: 'Bounce shot' },
      { zone: 'High Off-Stick',  shotType: 'Sidearm' },
      { zone: 'Low Stick-Side',  shotType: 'Bounce shot' },
      { zone: '5-Hole',          shotType: 'Skip shot' },
      { zone: 'High Stick-Side', shotType: 'Sidearm' },
      { zone: 'High Off-Stick',  shotType: 'Direct' },
      { zone: 'Low Stick-Side',  shotType: 'Direct' },
      { zone: 'Low Off-Stick',   shotType: 'Skip shot' },
      { zone: 'Mid Stick-Side',  shotType: 'Direct' },
      { zone: 'Mid Off-Stick',   shotType: 'Sidearm' },
      { zone: '5-Hole',          shotType: 'Bounce shot' },
    ],
  },
  {
    id: 'cone-1',
    name: '5-Cone Lateral Shuffle',
    type: 'cone',
    levelType: 'cone',
    description: 'Five cones spanning the full save range. React to the color and shuffle laterally to that position.',
    intervalSeconds: 8,
    cones: [
      { color: 'Red',    goalSide: 'Stick-Side Low',  position: 0 },
      { color: 'Blue',   goalSide: 'Stick-Side High', position: 1 },
      { color: 'Green',  goalSide: 'Center',          position: 2 },
      { color: 'Yellow', goalSide: 'Off-Stick High',  position: 3 },
      { color: 'Orange', goalSide: 'Off-Stick Low',   position: 4 },
    ],
    reps: [
      { cone: 'Red'    },
      { cone: 'Orange' },
      { cone: 'Green'  },
      { cone: 'Blue'   },
      { cone: 'Yellow' },
      { cone: 'Red'    },
      { cone: 'Orange' },
      { cone: 'Green'  },
      { cone: 'Yellow' },
      { cone: 'Blue'   },
    ],
  },
  {
    id: 'combined-1',
    name: 'Corner Attack',
    type: 'combined',
    levelType: 'shot-reaction',
    description: 'Combines cone footwork with a shot-reaction cue. Step to the cone, then react to the called zone.',
    intervalSeconds: 8,
    cones: [
      { color: 'Red',  goalSide: 'Stick-Side', position: 0 },
      { color: 'Blue', goalSide: 'Off-Stick',  position: 4 },
    ],
    reps: [
      { cone: 'Red',  zone: 'Low Stick-Side',  shotType: 'Bounce shot' },
      { cone: 'Blue', zone: 'High Off-Stick',  shotType: 'Direct' },
      { cone: 'Red',  zone: 'High Stick-Side', shotType: 'Direct' },
      { cone: 'Blue', zone: 'Mid Off-Stick',   shotType: 'Sidearm' },
      { cone: 'Red',  zone: 'Mid Stick-Side',  shotType: 'Sidearm' },
      { cone: 'Blue', zone: '5-Hole',          shotType: 'Skip shot' },
      { cone: 'Red',  zone: 'Low Stick-Side',  shotType: 'Direct' },
      { cone: 'Blue', zone: 'High Off-Stick',  shotType: 'Bounce shot' },
    ],
  },
];
