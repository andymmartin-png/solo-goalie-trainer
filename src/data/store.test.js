import { describe, it, expect, beforeEach } from 'vitest';
import {
  loadProfiles, addProfile, updateProfile, deleteProfile,
  loadDrills, addDrill, updateDrill, deleteDrill, newBlankDrill,
  getPerspective, setPerspective,
  getTheme, setTheme,
  isOnboarded, setOnboarded,
} from './store';

beforeEach(() => {
  localStorage.clear();
  document.documentElement.removeAttribute('data-theme');
});

describe('profiles', () => {
  it('seeds default profiles on first load', () => {
    const profiles = loadProfiles();
    expect(profiles.length).toBeGreaterThanOrEqual(4);
    expect(profiles[0]).toHaveProperty('handedness');
  });

  it('adds a profile with a generated id', () => {
    const before = loadProfiles().length;
    const p = addProfile({ name: 'Test', handedness: 'left', shotReactionLevel: 2, coneLevel: 1 });
    expect(p.id).toBeTruthy();
    expect(loadProfiles()).toHaveLength(before + 1);
  });

  it('updates and deletes a profile', () => {
    const p = addProfile({ name: 'Temp', handedness: 'right', shotReactionLevel: 1, coneLevel: 1 });
    updateProfile(p.id, { name: 'Renamed' });
    expect(loadProfiles().find(x => x.id === p.id).name).toBe('Renamed');
    deleteProfile(p.id);
    expect(loadProfiles().some(x => x.id === p.id)).toBe(false);
  });
});

describe('drills', () => {
  it('seeds default drills and supports CRUD', () => {
    expect(loadDrills().length).toBeGreaterThanOrEqual(3);
    const d = addDrill(newBlankDrill());
    expect(d.id).toBeTruthy();
    updateDrill(d.id, { name: 'Edited Drill' });
    expect(loadDrills().find(x => x.id === d.id).name).toBe('Edited Drill');
    deleteDrill(d.id);
    expect(loadDrills().some(x => x.id === d.id)).toBe(false);
  });

  it('newBlankDrill is a valid shot-reaction starter', () => {
    const d = newBlankDrill();
    expect(d.type).toBe('shot-reaction');
    expect(d.reps.length).toBeGreaterThan(0);
  });
});

describe('perspective setting', () => {
  it('defaults to goalie and persists changes', () => {
    expect(getPerspective()).toBe('goalie');
    setPerspective('shooter');
    expect(getPerspective()).toBe('shooter');
  });
});

describe('theme setting', () => {
  it('defaults to dark and applies the attribute when set', () => {
    expect(getTheme()).toBe('dark');
    setTheme('light');
    expect(getTheme()).toBe('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });
});

describe('onboarding flag', () => {
  it('is false until marked done', () => {
    expect(isOnboarded()).toBe(false);
    setOnboarded();
    expect(isOnboarded()).toBe(true);
  });
});
