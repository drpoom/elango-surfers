/**
 * useGameSettings.ts — Persistent game settings via localStorage
 * 
 * Saves user preferences across game sessions:
 * - soundEnabled: Master sound toggle
 * - musicEnabled: Background music toggle  
 * - sfxEnabled: Sound effects toggle
 * - sensorEnabled: Tilt/accelerometer controls toggle
 * 
 * Usage:
 *   import { loadSettings, saveSettings, getDefaultSettings, resetToDefaults } from './composables/useGameSettings'
 *   const settings = loadSettings()
 *   saveSettings({ ...settings, soundEnabled: false })
 */

const STORAGE_KEY: string = 'elangoSurfersSettings';
const SETTINGS_VERSION: number = 1;

export interface GameSettings {
  version: number;
  soundEnabled: boolean;
  musicEnabled: boolean;
  sfxEnabled: boolean;
  sensorEnabled: boolean;
}

/**
 * Get default settings object
 */
export function getDefaultSettings(): GameSettings {
  return {
    version: SETTINGS_VERSION,
    soundEnabled: true,
    musicEnabled: true,
    sfxEnabled: true,
    sensorEnabled: false,
  };
}

/**
 * Load settings from localStorage
 */
export function loadSettings(): GameSettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return getDefaultSettings();
    }
    const parsed = JSON.parse(stored);
    return { ...getDefaultSettings(), ...parsed };
  } catch (err: any) {
    console.warn('useGameSettings: Failed to load settings:', err?.message);
    return getDefaultSettings();
  }
}

/**
 * Save settings to localStorage
 */
export function saveSettings(settings: GameSettings): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    return true;
  } catch (err: any) {
    console.warn('useGameSettings: Failed to save settings:', err?.message);
    return false;
  }
}

/**
 * Reset settings to defaults and clear localStorage
 */
export function resetToDefaults(): GameSettings {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err: any) {
    console.warn('useGameSettings: Failed to clear settings:', err?.message);
  }
  return getDefaultSettings();
}