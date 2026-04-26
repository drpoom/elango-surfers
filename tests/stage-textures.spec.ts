import { test, expect } from '@playwright/test';
import { GAME_URL, navigateAndDismiss, focusCanvas, screenshot } from './helpers';

test.describe('Stage Texture Verification', () => {
  
  test('Stage 1: Modern highway textures load', async ({ page }) => {
    test.setTimeout(60000);
    
    await page.goto(GAME_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');
    await navigateAndDismiss(page);
    await page.waitForTimeout(2000);
    
    // Wait for road material to be set (Stage 1 default)
    await page.waitForFunction(() => {
      const mesh = window.__getRoadMesh();
      if (!mesh || !mesh.material) return false;
      // Stage 1 should have default texture (not cobblestone gray 0x888888)
      const color = mesh.material.color.getHex();
      return color !== 0x888888; // Not cobblestone
    }, { timeout: 10000 });
    
    await page.waitForTimeout(2000);
    await screenshot(page, 'test-results/stage1-highway-texture.png');
    
    // Verify Stage 1 indicator
    const stageIndicator = page.locator('#stage-indicator');
    const stageText = await stageIndicator.textContent();
    expect(stageText).toContain('STAGE 1');
    expect(stageText).toContain('Modern');
    
    // Verify road material
    const roadMaterial = await page.evaluate(() => {
      const mesh = window.__getRoadMesh();
      if (!mesh || !mesh.material) return null;
      return {
        color: mesh.material.color.getHex(),
        hasMap: !!mesh.material.map
      };
    });
    
    expect(roadMaterial).not.toBeNull();
    expect(roadMaterial.hasMap).toBe(true); // Should have highway texture
    expect(roadMaterial.color).not.toBe(0x888888); // Not cobblestone gray
  });

  test('Stage 2: Cobblestone + Fachwerkhaus textures load', async ({ page }) => {
    test.setTimeout(90000);
    
    await page.goto(GAME_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');
    await navigateAndDismiss(page);
    await page.waitForTimeout(2000);
    await focusCanvas(page);
    
    // Enter debug mode via keyboard (d-e-b-u-g)
    for (const key of ['d', 'e', 'b', 'u', 'g']) {
      await page.keyboard.press(key);
      await page.waitForTimeout(50);
    }
    await page.waitForTimeout(1000); // Wait for debug mode to activate
    
    // Verify debug mode is active (check for debug indicator in body)
    await page.waitForFunction(() => {
      const body = document.querySelector('body');
      return body && body.textContent?.includes('🐛');
    }, { timeout: 5000 });
    
    await focusCanvas(page);
    
    // Select Stage 2 via keyboard
    await page.keyboard.press('2');
    await page.waitForTimeout(1500); // Let resetStage() process
    
    // Wait for stage indicator
    const stageIndicator = page.locator('#stage-indicator');
    const stageText = await stageIndicator.textContent();
    console.log('Stage indicator:', stageText);
    expect(stageText).toContain('STAGE 2');
    expect(stageText).toContain('Medieval');
    
    // Wait for applyStageVisuals() to set color (immediate, not texture load)
    await page.waitForTimeout(2000);
    
    // Get road material info
    const debugInfo = await page.evaluate(() => {
      const mesh = window.__getRoadMesh();
      if (!mesh || !mesh.material) return null;
      return {
        color: mesh.material.color.getHex(),
        hasMap: !!mesh.material.map
      };
    });
    
    console.log('Stage 2 road material:', debugInfo);
    await screenshot(page, 'test-results/stage2-cobblestone-texture.png');
    
    expect(debugInfo).not.toBeNull();
    expect(debugInfo.color).toBe(0x888888); // Cobblestone gray
    expect(debugInfo.hasMap).toBe(true);
  });

  test('Stage 3: Concrete jungle textures load', async ({ page }) => {
    test.setTimeout(90000);
    
    await page.goto(GAME_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');
    await navigateAndDismiss(page);
    await page.waitForTimeout(2000);
    await focusCanvas(page);
    
    // Enter debug mode via keyboard (d-e-b-u-g)
    for (const key of ['d', 'e', 'b', 'u', 'g']) {
      await page.keyboard.press(key);
      await page.waitForTimeout(50);
    }
    await page.waitForTimeout(1000);
    
    // Verify debug mode is active
    await page.waitForFunction(() => {
      const body = document.querySelector('body');
      return body && body.textContent?.includes('🐛');
    }, { timeout: 5000 });
    
    await focusCanvas(page);
    
    // Select Stage 3 via keyboard
    await page.keyboard.press('3');
    await page.waitForTimeout(1500);
    
    // Wait for stage indicator
    const stageIndicator = page.locator('#stage-indicator');
    const stageText = await stageIndicator.textContent();
    console.log('Stage indicator:', stageText);
    expect(stageText).toContain('STAGE 3');
    expect(stageText).toContain('Cyber');
    
    // Wait for applyStageVisuals() to set color (immediate)
    await page.waitForTimeout(2000);
    
    // Get road material info
    const debugInfo = await page.evaluate(() => {
      const mesh = window.__getRoadMesh();
      if (!mesh || !mesh.material) return null;
      return {
        color: mesh.material.color.getHex(),
        hasMap: !!mesh.material.map
      };
    });
    
    console.log('Stage 3 road material:', debugInfo);
    await screenshot(page, 'test-results/stage3-concrete-texture.png');
    
    expect(debugInfo).not.toBeNull();
    expect(debugInfo.color).toBe(0xffffff); // Concrete white
    expect(debugInfo.hasMap).toBe(true);
  });
});
