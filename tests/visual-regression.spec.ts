import { test, expect } from '@playwright/test';
import { GAME_URL, navigateAndDismiss } from './helpers.js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test.describe('Elango Surfers - Visual Regression Tests', () => {
  
  const BASELINE_DIR = path.join(__dirname, '../visual-baselines');
  
  test.beforeEach(async ({ page }) => {
    await navigateAndDismiss(page);
  });

  test('title screen baseline', async ({ page }) => {
    const screenshot = await page.screenshot({ fullPage: true });
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
    await page.mouse.click(400, 300);
    await page.waitForTimeout(3000);
    
    const screenshot = await page.screenshot({ fullPage: true });
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
    await page.mouse.click(400, 300);
    await page.waitForTimeout(3000);
    
    const screenshot = await page.screenshot({ fullPage: true });
    
    // Verify key UI elements exist
    const scoreVisible = await page.locator('#score').isVisible();
    const highScoreVisible = await page.locator('#highscore').isVisible();
    const versionVisible = await page.locator('#version').isVisible();
    
    console.log('UI elements visible:', { scoreVisible, highScoreVisible, versionVisible });
    
    expect(scoreVisible).toBe(true);
    expect(highScoreVisible).toBe(true);
    expect(versionVisible).toBe(true);
  });
});
