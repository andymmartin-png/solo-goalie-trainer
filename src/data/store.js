import { PROFILES as DEFAULT_PROFILES, DRILLS as DEFAULT_DRILLS } from './drills';

const PROFILES_KEY = 'sgt-profiles';
const DRILLS_KEY   = 'sgt-drills';
const THEME_KEY    = 'sgt-theme';
const ONBOARD_KEY  = 'sgt-onboarded';

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}

function write(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function uid(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

// ── Profiles ──

export function loadProfiles() {
  const stored = read(PROFILES_KEY, null);
  if (stored) return stored;
  write(PROFILES_KEY, DEFAULT_PROFILES);
  return DEFAULT_PROFILES;
}

export function saveProfiles(profiles) {
  write(PROFILES_KEY, profiles);
}

export function addProfile(data) {
  const profiles = loadProfiles();
  const profile = { id: uid('p'), ...data };
  profiles.push(profile);
  saveProfiles(profiles);
  return profile;
}

export function updateProfile(id, data) {
  const profiles = loadProfiles().map(p => (p.id === id ? { ...p, ...data } : p));
  saveProfiles(profiles);
}

export function deleteProfile(id) {
  saveProfiles(loadProfiles().filter(p => p.id !== id));
}

// ── Drills ──

// Bump when the built-in DRILLS change so existing testers pick up the update.
const DRILLS_VERSION = 4;
const DRILLS_VERSION_KEY = 'sgt-drills-version';

// Refresh built-in drills (matched by id) to the current defaults while keeping
// any coach-created custom drills untouched.
function migrateDrills(stored) {
  const defaultsById = new Map(DEFAULT_DRILLS.map(d => [d.id, d]));
  const result = stored.map(d => (defaultsById.has(d.id) ? defaultsById.get(d.id) : d));
  for (const d of DEFAULT_DRILLS) {
    if (!result.some(x => x.id === d.id)) result.push(d);
  }
  return result;
}

export function loadDrills() {
  const stored = read(DRILLS_KEY, null);
  if (!stored) {
    write(DRILLS_KEY, DEFAULT_DRILLS);
    localStorage.setItem(DRILLS_VERSION_KEY, String(DRILLS_VERSION));
    return DEFAULT_DRILLS;
  }
  const storedVersion = parseInt(localStorage.getItem(DRILLS_VERSION_KEY)) || 1;
  if (storedVersion < DRILLS_VERSION) {
    const merged = migrateDrills(stored);
    write(DRILLS_KEY, merged);
    localStorage.setItem(DRILLS_VERSION_KEY, String(DRILLS_VERSION));
    return merged;
  }
  return stored;
}

export function saveDrills(drills) {
  write(DRILLS_KEY, drills);
}

export function addDrill(data) {
  const drills = loadDrills();
  const drill = { id: uid('drill'), ...data };
  drills.push(drill);
  saveDrills(drills);
  return drill;
}

export function updateDrill(id, data) {
  const drills = loadDrills().map(d => (d.id === id ? { ...d, ...data } : d));
  saveDrills(drills);
}

export function deleteDrill(id) {
  saveDrills(loadDrills().filter(d => d.id !== id));
}

export function newBlankDrill() {
  return {
    name: '',
    type: 'shot-reaction',
    levelType: 'shot-reaction',
    description: '',
    intervalSeconds: 8,
    cones: [],
    reps: [{ zone: 'High Stick-Side', shotType: 'Direct' }],
  };
}

// ── Theme ──

export function getTheme() {
  return localStorage.getItem(THEME_KEY) || 'dark';
}

export function setTheme(theme) {
  localStorage.setItem(THEME_KEY, theme);
  document.documentElement.setAttribute('data-theme', theme);
}

// ── Cue speech rate ──
// Web Speech rate multiplier. 1.0 = normal; higher = faster ("game speed").
const SPEECH_RATE_KEY = 'sgt-speech-rate';
export const SPEECH_RATE_MIN = 0.6;
export const SPEECH_RATE_MAX = 1.6;

export function getSpeechRate() {
  const v = parseFloat(localStorage.getItem(SPEECH_RATE_KEY));
  return Number.isFinite(v) ? v : 1.0;
}

export function setSpeechRate(rate) {
  const clamped = Math.min(SPEECH_RATE_MAX, Math.max(SPEECH_RATE_MIN, rate));
  localStorage.setItem(SPEECH_RATE_KEY, String(clamped));
  return clamped;
}

// ── Goal diagram perspective ──
// 'goalie'  = egocentric (stick side on the goalie's own side) — recommended for reaction reps
// 'shooter' = traditional coaching-diagram view (looking at the goal from the field)
const PERSPECTIVE_KEY = 'sgt-perspective';

export function getPerspective() {
  return localStorage.getItem(PERSPECTIVE_KEY) || 'goalie';
}

export function setPerspective(value) {
  localStorage.setItem(PERSPECTIVE_KEY, value);
}

// ── Onboarding ──

export function isOnboarded() {
  return localStorage.getItem(ONBOARD_KEY) === 'true';
}

export function setOnboarded() {
  localStorage.setItem(ONBOARD_KEY, 'true');
}
