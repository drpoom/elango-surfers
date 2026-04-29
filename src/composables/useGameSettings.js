/**
 * useGameSettings — Persistent game settings via localStorage
 * 
 * Saves user preferences across game sessions:
 * - soundEnabled: Master sound toggle
 * - musicEnabled: Background music toggle  
 * - sfxEnabled: Sound effects toggle
 * - sensorEnabled: Tilt/accelerometer controls toggle
 * 
 * Usage:
 *   import { loadSettings, saveSettings, getDefaultSettings, resetToDefaults } from './composables/useGameSettings.js'
 *   const settings = loadSettings()
 *   saveSettings({ ...settings, soundEnabled: false })
 */

const STORAGE_KEY = 'elangoSurfersSettings';
const SETTINGS_VERSION = 1;

/**
 * Get default settings object
 * @returns {Object} Default settings
 */
export function getDefaultSettings() {
  return {
    version: SETTINGS_VERSION,
    soundEnabled: true,
    musicEnabled: true,
    sfxEnabled: true,
    sensorEnabled: false
  };
}

/**
 * Load settings from localStorage
 * @returns {Object} Settings object (defaults if unavailable)
 */
export function loadSettings() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return getDefaultSettings();
    }
    const parsed = JSON.parse(stored);
    // Merge with defaults to ensure all keys exist
    return { ...getDefaultSettings(), ...parsed };
  } catch (err) {
    console.warn('useGameSettings: Failed to load settings:', err.message);
    return getDefaultSettings();
  }
}

/**
 * Save settings to localStorage
 * @param {Object} settings - Settings to save
 * @returns {boolean} True if successful
 */
export function saveSettings(settings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    return true;
  } catch (err) {
    console.warn('useGameSettings: Failed to save settings:', err.message);
    return false;
  }
}

/**
 * Reset settings to defaults and clear localStorage
 * @returns {Object} Default settings
 */
export function resetToDefaults() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.warn('useGameSettings: Failed to clear settings:', err.message);
  }
  return getDefaultSettings();
}
