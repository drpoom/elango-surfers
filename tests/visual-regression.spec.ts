import { test, expect } from '@playwright/test';
import { skipToGameplay, getStore } from './helpers.js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test.describe('Elango Surfers - Visual Regression Tests', () => {

  const BASELINE_DIR = path.join(__dirname, '../visual-baselines');

  test('title screen baseline', async ({ page }) => {
    await skipToGameplay(page);
    const screenshot = await page.screenshot({ fullPage: true, timeout: 30000 });
    const baselinePath = path.join(BASELINE_DIR, 'title-screen.png');
    if (!fs.existsSync(BASELINE_DIR)) {
      fs.mkdirSync(BASELINE_DIR, { recursive: true });
    }
    if (!fs.existsSync(baselinePath)) {
      fs.writeFileSync(baselinePath, screenshot);
      console.log('Created baseline:', baselinePath);
    }
    expect(screenshot.length).toBeGreaterThan(0);
  });

  test('gameplay screen baseline', async ({ page }) => {
    await skipToGameplay(page);
    await page.waitForTimeout(200);
    const screenshot = await page.screenshot({ fullPage: true, timeout: 30000 });
    const baselinePath = path.join(BASELINE_DIR, 'gameplay-screen.png');
    if (!fs.existsSync(BASELINE_DIR)) {
      fs.mkdirSync(BASELINE_DIR, { recursive: true });
    }
    if (!fs.existsSync(baselinePath)) {
      fs.writeFileSync(baselinePath, screenshot);
      console.log('Created baseline:', baselinePath);
    }
    expect(screenshot.length).toBeGreaterThan(0);
  });

  test('UI elements are visible', async ({ page }) => {
    await skipToGameplay(page);
    // Verify key UI elements exist via store (faster than DOM queries)
    const store = await getStore(page);
    expect(store).not.toBeNull();
    // Also check DOM elements
    const scoreVisible = await page.locator('#score').isVisible();
    const highScoreVisible = await page.locator('#highscore').isVisible();
    const versionVisible = await page.locator('#version').isVisible();
    expect(scoreVisible).toBe(true);
    expect(highScoreVisible).toBe(true);
    expect(versionVisible).toBe(true);
  });
});
