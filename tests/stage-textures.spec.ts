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
    test.setTimeout(60000);
    
    await page.goto(GAME_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');
    await navigateAndDismiss(page);
    await page.waitForTimeout(2000);
    await focusCanvas(page);
    
    // Enter debug mode
    await page.keyboard.press('d');
    await page.waitForTimeout(100);
    await page.keyboard.press('e');
    await page.waitForTimeout(100);
    await page.keyboard.press('b');
    await page.waitForTimeout(100);
    await page.keyboard.press('u');
    await page.waitForTimeout(100);
    await page.keyboard.press('g');
    await page.waitForTimeout(500);
    await focusCanvas(page);
    
    // Select Stage 2
    await page.keyboard.press('2');
    
    // Wait for cobblestone texture to load
    await page.waitForFunction(() => {
      const mesh = window.__getRoadMesh();
      if (!mesh || !mesh.material) return false;
      return mesh.material.color.getHex() === 0x888888;
    }, { timeout: 10000 });
    
    await page.waitForTimeout(2000);
    await screenshot(page, 'test-results/stage2-cobblestone-texture.png');
    
    // Verify Stage 2 indicator
    const stageIndicator = page.locator('#stage-indicator');
    const stageText = await stageIndicator.textContent();
    expect(stageText).toContain('STAGE 2');
    expect(stageText).toContain('Medieval');
    
    // Verify cobblestone texture
    const roadMaterial = await page.evaluate(() => {
      const mesh = window.__getRoadMesh();
      if (!mesh || !mesh.material) return null;
      return {
        color: mesh.material.color.getHex(),
        hasMap: !!mesh.material.map
      };
    });
    
    expect(roadMaterial).not.toBeNull();
    expect(roadMaterial.hasMap).toBe(true);
    expect(roadMaterial.color).toBe(0x888888); // Cobblestone gray
  });

  test('Stage 3: Concrete jungle textures load', async ({ page }) => {
    test.setTimeout(60000);
    
    await page.goto(GAME_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');
    await navigateAndDismiss(page);
    await page.waitForTimeout(2000);
    await focusCanvas(page);
    
    // Enter debug mode
    await page.keyboard.press('d');
    await page.waitForTimeout(100);
    await page.keyboard.press('e');
    await page.waitForTimeout(100);
    await page.keyboard.press('b');
    await page.waitForTimeout(100);
    await page.keyboard.press('u');
    await page.waitForTimeout(100);
    await page.keyboard.press('g');
    await page.waitForTimeout(500);
    await focusCanvas(page);
    
    // Select Stage 3
    await page.keyboard.press('3');
    
    // Wait for concrete texture to load (Stage 3 has white concrete)
    await page.waitForFunction(() => {
      const mesh = window.__getRoadMesh();
      if (!mesh || !mesh.material) return false;
      const color = mesh.material.color.getHex();
      // Stage 3 concrete should be white/light (0xffffff)
      return color === 0xffffff;
    }, { timeout: 10000 });
    
    await page.waitForTimeout(2000);
    await screenshot(page, 'test-results/stage3-concrete-texture.png');
    
    // Verify Stage 3 indicator
    const stageIndicator = page.locator('#stage-indicator');
    const stageText = await stageIndicator.textContent();
    expect(stageText).toContain('STAGE 3');
    expect(stageText).toContain('Cyber');
    
    // Verify concrete texture
    const roadMaterial = await page.evaluate(() => {
      const mesh = window.__getRoadMesh();
      if (!mesh || !mesh.material) return null;
      return {
        color: mesh.material.color.getHex(),
        hasMap: !!mesh.material.map
      };
    });
    
    expect(roadMaterial).not.toBeNull();
    expect(roadMaterial.hasMap).toBe(true);
    expect(roadMaterial.color).toBe(0xffffff); // Concrete white
  });
});
