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
// Cones mark where the shooter takes the shot from (left → right, goalie facing the field).
export const SHOOTER_POSITIONS = ['Left Pipe', 'Left 45', 'Top Center', 'Right 45', 'Right Pipe'];

export function getZoneGrid(zoneName, handedness) {
  const pos = ZONE_GRID[zoneName];
  if (!pos) return null;
  if (handedness === 'left') {
    return { row: pos.row, col: pos.col === 0 ? 2 : pos.col === 2 ? 0 : 1 };
  }
  return pos;
}

// Cues reflect the cross-source coaching consensus: hands move first (top hand
// straight to the ball), then a shot-side save step; stay square and don't turn
// the hips on off-stick saves; drop the hips/knee rather than step on five-hole;
// chest over stick on low saves.
//
// Footwork is drill-aware. On a straight perimeter shot (shot-reaction), the
// off-stick first move is a wide lateral save step. After a feed across the
// crease (combined / pass drills), the off-stick first move is a drop step to
// re-square quickly without crossing the feet. The stick-side and central zones
// use the same footwork either way.
const TECHNIQUES = {
  'High Stick-Side': 'Hands up first, step stick side',
  'High Center':     'Hands up first, stay tall',
  'High Off-Stick':  'Hands up, wide step, stay square',
  'Mid Stick-Side':  'Top hand to ball, step stick side',
  '5-Hole':          'No step, drop the knee, stay low',
  'Mid Off-Stick':   'Top hand straight, stay square',
  'Low Stick-Side':  'Stick down first, chest over stick',
  'Low Off-Stick':   'Stick down, wide step, body behind it',
};

// Off-stick footwork overrides when the save follows a feed (drop step to
// re-square). Only the zones whose footwork actually changes are listed.
const FEED_TECHNIQUES = {
  'High Off-Stick': 'Hands up, drop step, stay square',
  'Low Off-Stick':  'Stick down, drop step, body behind it',
};

// Pass drills always involve a feed; combined drills step to a cone then react,
// so they also re-square off a movement rather than a static perimeter set.
function techniqueFor(zone, drillType) {
  const feed = drillType === 'pass' || drillType === 'combined';
  return (feed && FEED_TECHNIQUES[zone]) || TECHNIQUES[zone];
}

function shotCue(zone, shotType, level) {
  if (level === 4) return null;
  if (level === 3) return zone;
  if (level === 2) return `${zone}. ${shotType}.`;
  return `${zone}. ${shotType}. ${TECHNIQUES[zone]}.`;
}

function coneCue(color, cone, level) {
  const spot = cone?.shotFrom;
  if (level === 3) return color;
  if (level === 2) return spot ? `${color}. ${spot}.` : `${color}.`;
  return spot
    ? `${color} cone. ${spot}. Shuffle and set your angle.`
    : `${color} cone. Shuffle and set your angle.`;
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
    return `${rep.cone} cone. ${rep.zone}. ${rep.shotType}. ${techniqueFor(rep.zone, 'combined')}.`;
  }
  if (drill.type === 'pass') {
    if (level === 4) return null;
    if (level === 3) return `${rep.coneTo}. ${rep.zone}.`;
    if (level === 2) return `${rep.coneFrom} to ${rep.coneTo}. ${rep.zone}. ${rep.shotType}.`;
    return `Pass ${rep.coneFrom} to ${rep.coneTo}. Re-square. Shot ${rep.zone}. ${rep.shotType}. ${techniqueFor(rep.zone, 'pass')}.`;
  }
  return '';
}

// Pass drills are delivered in two stages: announce the origin cone, pause ~2s
// (the feed across the crease), then announce the receiving cone + shot. Returns
// { first, second } — `second` is null at level 4 (tone only). The origin cone is
// announced on its own so the goalie sets to the feed before reacting to the shot.
export function passCueStages(rep, level) {
  const first = level === 1 ? `${rep.coneFrom} cone. Set.` : rep.coneFrom;
  if (level === 4) return { first, second: null };
  if (level === 3) return { first, second: `${rep.coneTo}. ${rep.zone}.` };
  if (level === 2) return { first, second: `${rep.coneTo}. ${rep.zone}. ${rep.shotType}.` };
  return { first, second: `${rep.coneTo}. Re-square. Shot ${rep.zone}. ${rep.shotType}. ${techniqueFor(rep.zone, 'pass')}.` };
}

// Pick a random element from a non-empty array.
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Replace selected rep fields with random valid values. `fields` is
// { cone, zone, shotType } — each a boolean. Only fields present on the rep and
// supported by the drill are randomized; the rep shape is preserved.
export function randomizeRep(rep, drill, fields) {
  const out = { ...rep };
  const coneColors = (drill.cones ?? []).map(c => c.color);

  if (fields.cone && coneColors.length) {
    if ('coneFrom' in rep) {
      out.coneFrom = pick(coneColors);
      const others = coneColors.filter(c => c !== out.coneFrom);
      out.coneTo = others.length ? pick(others) : out.coneFrom;
    } else if ('cone' in rep) {
      out.cone = pick(coneColors);
    }
  }
  if (fields.zone && 'zone' in rep) out.zone = pick(ZONE_NAMES);
  if (fields.shotType && 'shotType' in rep) out.shotType = pick(SHOT_TYPES);
  return out;
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
    description: 'Five cones marking common shooting positions, from Left Pipe to Right Pipe. React to the color and shuffle to cover the angle.',
    intervalSeconds: 8,
    cones: [
      { color: 'Red',    shotFrom: 'Left Pipe',   position: 0 },
      { color: 'Blue',   shotFrom: 'Left 45',     position: 1 },
      { color: 'Green',  shotFrom: 'Top Center',  position: 2 },
      { color: 'Yellow', shotFrom: 'Right 45',    position: 3 },
      { color: 'Orange', shotFrom: 'Right Pipe',  position: 4 },
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
    description: 'Combines cone footwork with a shot-reaction cue. Step to the shooting position, then react to the called net zone.',
    intervalSeconds: 8,
    cones: [
      { color: 'Red',  shotFrom: 'Left 45',  position: 1 },
      { color: 'Blue', shotFrom: 'Right 45', position: 3 },
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
  {
    id: 'pass-1',
    name: 'Crease Feed Reaction',
    type: 'pass',
    levelType: 'shot-reaction',
    description: 'Simulates a feed across the crease using all five shooting positions. Set to the first cone, then drop step to re-square to the second cone and react to the shot.',
    intervalSeconds: 10,
    cones: [
      { color: 'Red',    shotFrom: 'Left Pipe',  position: 0 },
      { color: 'Blue',   shotFrom: 'Left 45',    position: 1 },
      { color: 'Green',  shotFrom: 'Top Center', position: 2 },
      { color: 'Yellow', shotFrom: 'Right 45',   position: 3 },
      { color: 'Orange', shotFrom: 'Right Pipe', position: 4 },
    ],
    reps: [
      { coneFrom: 'Red',    coneTo: 'Orange', zone: 'High Off-Stick',  shotType: 'Direct' },
      { coneFrom: 'Orange', coneTo: 'Red',    zone: 'Low Off-Stick',   shotType: 'Bounce shot' },
      { coneFrom: 'Blue',   coneTo: 'Yellow', zone: 'Mid Off-Stick',   shotType: 'Sidearm' },
      { coneFrom: 'Yellow', coneTo: 'Green',  zone: 'High Stick-Side', shotType: 'Direct' },
      { coneFrom: 'Green',  coneTo: 'Red',    zone: '5-Hole',          shotType: 'Skip shot' },
      { coneFrom: 'Orange', coneTo: 'Blue',   zone: 'Low Stick-Side',  shotType: 'Direct' },
      { coneFrom: 'Red',    coneTo: 'Green',  zone: 'High Off-Stick',  shotType: 'Bounce shot' },
      { coneFrom: 'Yellow', coneTo: 'Orange', zone: 'Mid Stick-Side',  shotType: 'Direct' },
    ],
  },
];
